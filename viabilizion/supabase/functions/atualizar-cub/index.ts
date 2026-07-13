// Edge Function: atualizar-cub
// Pesquisa o CUB (Custo Unitário Básico) residencial padrão mais recente do
// Sinduscon de um estado via Gemini (com google_search) e salva o resultado
// na tabela `cub_estados`.

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

function montarPrompt(uf: string): string {
  return `Pesquise o valor mais recente do CUB (Custo Unitário Básico) residencial padrão (padrão médio, R-1 ou equivalente) divulgado pelo Sinduscon do estado de ${uf}, Brasil.

Estratégia de busca:
1. Primeiro tente encontrar a tabela oficial publicada pelo Sinduscon do estado (site do Sinduscon estadual, ou notícias recentes citando o valor).
2. Se não encontrar rápido por aí, faça também buscas mais genéricas, do tipo "CUB residencial ${uf} valor atual" ou "CUB m2 padrão médio ${uf} mês ano".

Responda APENAS em JSON válido, sem nenhum texto antes ou depois, exatamente neste formato:
{"valor_m2": number ou null, "data_referencia": "string tipo mês/ano", "fonte": "string com o nome/site da fonte encontrada", "confianca": "alta" ou "media" ou "baixa"}

Se não encontrar um dado confiável, retorne null em "valor_m2" e "confianca": "baixa".

Você tem até 4 ou 5 buscas disponíveis — use-as para tentar abordagens diferentes (site oficial do Sinduscon, depois busca genérica) antes de desistir. Só pare e responda com "valor_m2" null e "confianca": "baixa" depois de esgotar essas tentativas sem achar nenhuma fonte confiável.`;
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
    const { uf } = await req.json();

    if (!uf) {
      return new Response(
        JSON.stringify({ error: "Campo 'uf' é obrigatório." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const respostaGemini = await chamarGeminiComRetry({
      contents: [{ role: "user", parts: [{ text: montarPrompt(uf) }] }],
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
      .from("cub_estados")
      .upsert(
        {
          uf,
          valor_m2: resultado.valor_m2,
          data_referencia: resultado.data_referencia,
          fonte: resultado.fonte,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "uf" },
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
