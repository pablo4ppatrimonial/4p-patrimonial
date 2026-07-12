// Edge Function: atualizar-cub
// Pesquisa o CUB (Custo Unitário Básico) residencial padrão mais recente do
// Sinduscon de um estado via Claude (com web_search) e salva o resultado na
// tabela `cub_estados`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function montarPrompt(uf: string): string {
  return `Pesquise o valor mais recente do CUB (Custo Unitário Básico) residencial padrão (padrão médio, R-1 ou equivalente) divulgado pelo Sinduscon do estado de ${uf}, Brasil.

Responda APENAS em JSON válido, sem nenhum texto antes ou depois, exatamente neste formato:
{"valor_m2": number ou null, "data_referencia": "string tipo mês/ano", "fonte": "string com o nome/site da fonte encontrada", "confianca": "alta" ou "media" ou "baixa"}

Se não encontrar um dado confiável, retorne null em "valor_m2" e "confianca": "baixa".

Faça no máximo 2 ou 3 buscas. Se depois disso não tiver encontrado uma fonte confiável, pare de pesquisar e responda imediatamente com "valor_m2" null e "confianca": "baixa" — não continue tentando buscas adicionais.`;
}

function extrairJson(texto: string): string {
  const semMarkdown = texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const inicio = semMarkdown.indexOf("{");
  const fim = semMarkdown.lastIndexOf("}");

  if (inicio === -1 || fim === -1 || fim < inicio) {
    throw new Error(`Resposta do Claude não contém um JSON reconhecível: ${texto}`);
  }

  return semMarkdown.slice(inicio, fim + 1);
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

    const respostaClaude = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 2 }],
        messages: [{ role: "user", content: montarPrompt(uf) }],
      }),
    });

    if (!respostaClaude.ok) {
      const erroTexto = await respostaClaude.text();
      throw new Error(`Erro na API do Claude (status ${respostaClaude.status}): ${erroTexto}`);
    }

    const dadosClaude = await respostaClaude.json();
    const blocosTexto = dadosClaude.content?.filter(
      (bloco: { type: string }) => bloco.type === "text",
    );
    const blocoTexto = blocosTexto?.[blocosTexto.length - 1];

    if (!blocoTexto) {
      throw new Error("Resposta do Claude não contém texto.");
    }

    const resultado = JSON.parse(extrairJson(blocoTexto.text));

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
