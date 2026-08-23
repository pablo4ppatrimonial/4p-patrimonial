require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const megaleiloes = require('./fontes/megaleiloes');
const portalzuk = require('./fontes/portalzuk');
const freitasleiloeiro = require('./fontes/freitasleiloeiro');
const { pontuarLeiloes } = require('./pontuacao');

const FONTES = [megaleiloes, portalzuk, freitasleiloeiro];

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar definidos no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  const ms = 1000 + Math.random() * 1000;
  return delay(ms);
}

async function salvarLeiloes(imoveis) {
  if (imoveis.length === 0) return 0;

  const { data, error } = await supabase
    .from('leiloes')
    .upsert(imoveis, { onConflict: 'url_original' })
    .select('id');

  if (error) throw error;
  return data ? data.length : 0;
}

async function main() {
  const coletadosPorFonte = {};
  const todosImoveis = [];

  for (let i = 0; i < FONTES.length; i += 1) {
    const fonte = FONTES[i];
    console.log(`Coletando imóveis em leilão (${fonte.FONTE})...`);
    try {
      const imoveis = await fonte.coletar();
      console.log(`  -> ${imoveis.length} imóveis coletados de ${fonte.FONTE}`);
      coletadosPorFonte[fonte.FONTE] = imoveis.length;
      todosImoveis.push(...imoveis);
    } catch (err) {
      console.error(`  -> erro ao coletar ${fonte.FONTE}:`, err.message || err);
      coletadosPorFonte[fonte.FONTE] = 0;
    }
    if (i < FONTES.length - 1) await randomDelay();
  }

  console.log(`Total coletado: ${todosImoveis.length} imóveis`);

  const salvos = await salvarLeiloes(todosImoveis);
  console.log(`Leilões salvos/atualizados no Supabase: ${salvos}`);
  console.log('Resumo por fonte (coletados):', coletadosPorFonte);

  console.log('\nCalculando pontuação dos leilões ativos...');
  await pontuarLeiloes(supabase);
}

main().catch((err) => {
  console.error('Erro ao rodar o scraper:', err.message || err);
  process.exit(1);
});
