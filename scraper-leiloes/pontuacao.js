require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

const BONUS_URGENCIA = 10;
const DIAS_URGENCIA = 3;
const PENALIDADE_SEM_AVALIACAO = 15;
const PENALIDADE_SEM_CIDADE = 15;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar definidos no .env');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Desconto é o peso principal do score (até 90 dos 100 pontos possíveis,
// os outros 10 vêm do bônus de urgência). Três faixas com transição linear
// para não ter saltos bruscos nas bordas (30% e 50%):
//  - < 30%  ->  10 a 45 pontos (baixo)
//  - 30-50% ->  45 a 70 pontos (médio)
//  - >= 50% ->  70 a 90 pontos (alto, satura em 100% de desconto)
function scoreDesconto(percentualDesconto) {
  if (percentualDesconto === null || percentualDesconto === undefined) return 0;

  const d = percentualDesconto;
  if (d >= 50) {
    const excedente = Math.min(d - 50, 50);
    return 70 + (excedente / 50) * 20;
  }
  if (d >= 30) {
    return 45 + ((d - 30) / 20) * 25;
  }
  const dPositivo = Math.max(d, 0);
  return 10 + (dPositivo / 30) * 35;
}

// Bônus de urgência: leilão acontecendo dentro de 3 dias (ou já em curso hoje).
function bonusUrgencia(dataLeilao) {
  if (!dataLeilao) return 0;
  const dataLeilaoMs = new Date(dataLeilao).getTime();
  if (Number.isNaN(dataLeilaoMs)) return 0;

  const diffDias = (dataLeilaoMs - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDias >= -0.5 && diffDias <= DIAS_URGENCIA) return BONUS_URGENCIA;
  return 0;
}

// Penaliza quando falta informação essencial para confiar no score.
function penalidadeIncerteza(leilao) {
  let penalidade = 0;
  if (!leilao.valor_avaliacao) penalidade += PENALIDADE_SEM_AVALIACAO;
  if (!leilao.cidade) penalidade += PENALIDADE_SEM_CIDADE;
  return penalidade;
}

function classificar(score) {
  if (score >= 80) return 'excelente';
  if (score >= 60) return 'boa';
  if (score >= 40) return 'regular';
  return 'fraca';
}

function calcularScore(leilao) {
  const base = scoreDesconto(leilao.percentual_desconto);
  const bonus = bonusUrgencia(leilao.data_leilao);
  const penalidade = penalidadeIncerteza(leilao);
  const score = Math.round(Math.min(100, Math.max(0, base + bonus - penalidade)));
  return { score, classificacao: classificar(score) };
}

async function buscarLeiloesAtivos(supabase) {
  const { data, error } = await supabase
    .from('leiloes')
    .select('id,titulo,cidade,valor_avaliacao,percentual_desconto,data_leilao,status')
    .eq('status', 'ativo');
  if (error) throw error;
  return data;
}

async function atualizarScore(supabase, id, score, classificacao) {
  const { error } = await supabase.from('leiloes').update({ score, classificacao }).eq('id', id);
  if (error) throw error;
}

function imprimirResumo(resultados) {
  const contagem = { excelente: 0, boa: 0, regular: 0, fraca: 0 };
  resultados.forEach((r) => {
    contagem[r.classificacao] += 1;
  });

  console.log('\nResumo por classificação:');
  console.log(`  Excelente: ${contagem.excelente}`);
  console.log(`  Boa:       ${contagem.boa}`);
  console.log(`  Regular:   ${contagem.regular}`);
  console.log(`  Fraca:     ${contagem.fraca}`);

  const top5 = [...resultados].sort((a, b) => b.score - a.score).slice(0, 5);
  console.log('\nTop 5 leilões por score:');
  top5.forEach((r, i) => {
    const desconto = r.percentual_desconto !== null && r.percentual_desconto !== undefined
      ? `${r.percentual_desconto}%`
      : 'N/D';
    console.log(`  ${i + 1}. [score ${r.score}] ${r.titulo} — ${r.cidade || 'sem cidade'} — desconto ${desconto}`);
  });

  return { contagem, top5 };
}

/**
 * Calcula e grava score (0-100) e classificação para todos os leilões
 * com status 'ativo', atualizando os registros existentes na tabela leiloes.
 */
async function pontuarLeiloes(supabaseClient) {
  const supabase = supabaseClient || getSupabase();

  const leiloes = await buscarLeiloesAtivos(supabase);
  console.log(`Calculando score para ${leiloes.length} leilões ativos...`);

  const resultados = [];
  for (const leilao of leiloes) {
    const { score, classificacao } = calcularScore(leilao);
    await atualizarScore(supabase, leilao.id, score, classificacao);
    resultados.push({ ...leilao, score, classificacao });
  }

  const { contagem, top5 } = imprimirResumo(resultados);
  return { total: resultados.length, contagem, top5 };
}

module.exports = { pontuarLeiloes, calcularScore };

if (require.main === module) {
  pontuarLeiloes().catch((err) => {
    console.error('Erro ao pontuar leilões:', err.message || err);
    process.exit(1);
  });
}
