// Edge Function: pesquisar-cidade
// Pesquisa coeficiente de aproveitamento, gabarito e taxa de ocupação de uma
// cidade via Gemini (com google_search) e salva o resultado na tabela `cidades`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function montarPrompt(nome: string, uf: string): string {
  return `Pesquise o coeficiente de aproveitamento, o gabarito (altura máxima em metros) e a taxa de ocupação definidos no plano diretor / lei de zoneamento / uso e ocupação do solo vigente da cidade de ${nome}, ${uf}, Brasil.

Estratégia de busca:
1. Primeiro tente encontrar o nome oficial da lei do plano diretor ou da lei de zoneamento/uso e ocupação do solo dessa cidade.
2. Se não encontrar rápido por aí, faça também buscas mais genéricas, do tipo "coeficiente de aproveitamento residencial ${nome} ${uf}" ou "gabarito máximo ${nome} ${uf} plano diretor".

Importante sobre zoneamento variável por zona:
- Muitas cidades têm coeficiente de aproveitamento, gabarito e taxa de ocupação diferentes por zona (residencial, comercial, centro, eixos de adensamento, etc.).
- Quando isso acontecer, NÃO retorne null só porque o valor varia por zona. Em vez disso, retorne o valor mais comum/típico para USO RESIDENCIAL, que é o que importa para o nosso caso de uso (estudo de viabilidade de empreendimentos residenciais).
- Nesse caso, marque "confianca" como "media" e inclua no campo "fonte" uma nota do tipo "Valor residencial padrão — cidade tem zoneamento variável por zona" (além do nome da lei/site, se souber).

Responda APENAS em JSON válido, sem nenhum texto antes ou depois, exatamente neste formato:
{"coeficiente_aproveitamento": number ou null, "gabarito_metros": number ou null, "taxa_ocupacao": number ou null, "fonte": "string com o nome/site da fonte encontrada", "confianca": "alta" ou "media" ou "baixa"}

Só retorne null nos três campos numéricos e "confianca": "baixa" quando você realmente não encontrar NENHUMA lei, plano diretor ou documento oficial de zoneamento dessa cidade — não quando encontrar o documento mas os valores variarem por zona (nesse caso, use a regra do valor residencial padrão acima).

Você tem até 4 ou 5 buscas disponíveis — use-as para tentar abordagens diferentes (nome oficial da lei, depois busca genérica) antes de desistir. Só pare e responda com os campos numéricos null e "confianca": "baixa" depois de esgotar essas tentativas sem achar nenhum documento oficial.`;
}

function extrairJson(texto: string): string {
  const semMarkdown = texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const inicio = semMarkdown.indexOf("{");
  const fim = semMarkdown.lastIndexOf("}");

  if (inicio === -1 || fim === -1 || fim < inicio) {
    throw new Error(`Resposta do Gemini não contém um JSON reconhecível: ${texto}`);
  }

  return semMarkdown.slice(inicio, fim + 1);
}

function extrairTextoCombinado(dadosGemini: any): string {
  const partes = dadosGemini.candidates?.[0]?.content?.parts;

  if (!Array.isArray(partes)) {
    throw new Error("Resposta do Gemini não contém partes de conteúdo.");
  }

  const texto = partes
    .filter((parte: { text?: string }) => typeof parte.text === "string")
    .map((parte: { text?: string }) => parte.text)
    .join("");

  if (!texto) {
    throw new Error("Resposta do Gemini não contém texto.");
  }

  return texto;
}

const STATUS_TRANSITORIOS = [429, 503];
const MAX_TENTATIVAS = 3;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chamarGeminiComRetry(corpo: unknown): Promise<Response> {
  let ultimaResposta: Response | null = null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const resposta = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

    if (resposta.ok || !STATUS_TRANSITORIOS.includes(resposta.status)) {
      return resposta;
    }

    ultimaResposta = resposta;

    if (tentativa < MAX_TENTATIVAS) {
      await aguardar(1000 * tentativa);
    }
  }

  return ultimaResposta!;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { nome, uf } = await req.json();

    if (!nome || !uf) {
      return new Response(
        JSON.stringify({ error: "Campos 'nome' e 'uf' são obrigatórios." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const respostaGemini = await chamarGeminiComRetry({
      contents: [{ role: "user", parts: [{ text: montarPrompt(nome, uf) }] }],
      tools: [{ google_search: {} }],
    });

    if (!respostaGemini.ok) {
      const erroTexto = await respostaGemini.text();
      throw new Error(`Erro na API do Gemini (status ${respostaGemini.status}): ${erroTexto}`);
    }

    const dadosGemini = await respostaGemini.json();
    const textoCombinado = extrairTextoCombinado(dadosGemini);

    const resultado = JSON.parse(extrairJson(textoCombinado));

    const { data, error } = await supabase
      .from("cidades")
      .upsert(
        {
          nome,
          uf,
          populacao: null,
          coeficiente_aproveitamento: resultado.coeficiente_aproveitamento,
          gabarito_metros: resultado.gabarito_metros,
          taxa_ocupacao: resultado.taxa_ocupacao,
          fonte_dado: resultado.fonte,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "nome,uf" },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar no Supabase: ${error.message}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (erro) {
    return new Response(
      JSON.stringify({ error: erro instanceof Error ? erro.message : "Erro desconhecido" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
