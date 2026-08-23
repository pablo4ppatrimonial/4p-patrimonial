require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const megaleiloes = require('./fontes/megaleiloes');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar definidos no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
  console.log('Coletando imóveis em leilão (Mega Leilões)...');
  const imoveis = await megaleiloes.coletar(3);
  console.log(`Coletados ${imoveis.length} imóveis na listagem.`);

  const salvos = await salvarLeiloes(imoveis);
  console.log(`Leilões salvos/atualizados no Supabase: ${salvos}`);
}

main().catch((err) => {
  console.error('Erro ao rodar o scraper:', err.message || err);
  process.exit(1);
});
