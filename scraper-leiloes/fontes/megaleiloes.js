const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.megaleiloes.com.br';
const LISTING_URL = `${BASE_URL}/imoveis`;
const FONTE = 'megaleiloes';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const DELAY_MIN_MS = 1000;
const DELAY_MAX_MS = 2000;

const TIPO_IMOVEL_MAP = {
  apartamentos: 'Apartamento',
  casas: 'Casa',
  'imoveis-comerciais': 'Imóvel Comercial',
  'imoveis-rurais': 'Imóvel Rural',
  'terrenos-e-lotes': 'Terreno/Lote',
  galpoes: 'Galpão',
  'salas-e-conjuntos': 'Sala/Conjunto',
  predios: 'Prédio',
  'imoveis-industriais': 'Imóvel Industrial',
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  const ms = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
  return delay(ms);
}

function parseValorBR(str) {
  if (!str) return null;
  const match = str.match(/[\d.,]+/);
  if (!match) return null;
  const numStr = match[0].replace(/\./g, '').replace(',', '.');
  const num = parseFloat(numStr);
  return Number.isNaN(num) ? null : num;
}

function parseDataBR(str) {
  if (!str) return null;
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s*às\s*(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh = '00', min = '00'] = match;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`;
}

function tipoImovelFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    const idx = parts.indexOf('imoveis');
    const slug = idx >= 0 ? parts[idx + 1] : null;
    if (!slug) return null;
    return TIPO_IMOVEL_MAP[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return null;
  }
}

function bairroFromTitulo(titulo) {
  const partes = titulo.split(' - ').map((p) => p.trim());
  return partes.length === 4 ? partes[1] : null;
}

function limparUrl(url) {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString();
  } catch {
    return url;
  }
}

function parseCard($, card) {
  const $card = $(card);

  const linkTitulo = $card.find('a.card-title');
  const tituloRaw = linkTitulo.text().trim();
  if (!tituloRaw) return null;

  const urlOriginal = limparUrl(linkTitulo.attr('href'));
  const localidade = $card.find('a.card-locality').text().trim();
  const [cidade = null, estado = null] = localidade.split(',').map((s) => s.trim());

  const imagemUrl = $card.find('a.card-image').attr('data-bg') || null;

  const valorPrimeiraPraca = parseValorBR($card.find('.card-first-instance-date').closest('.instance').find('.card-instance-value').text());
  const valorSegundaPraca = parseValorBR($card.find('.card-second-instance-date').closest('.instance').find('.card-instance-value').text());
  const valorPrecoPrincipal = parseValorBR($card.find('.card-price').first().text());

  const valorAvaliacao = valorPrimeiraPraca ?? valorPrecoPrincipal;
  const valorLanceMinimo = valorSegundaPraca ?? valorAvaliacao;

  const dataLeilaoRaw = $card.find('.card-first-instance-date').text().trim();
  const dataLeilao = parseDataBR(dataLeilaoRaw);

  let percentualDesconto = null;
  if (valorAvaliacao && valorLanceMinimo && valorAvaliacao > 0) {
    percentualDesconto = ((valorAvaliacao - valorLanceMinimo) / valorAvaliacao) * 100;
    percentualDesconto = Math.round(percentualDesconto * 100) / 100;
  }

  return {
    titulo: tituloRaw,
    cidade,
    estado,
    bairro: bairroFromTitulo(tituloRaw),
    valor_avaliacao: valorAvaliacao,
    valor_lance_minimo: valorLanceMinimo,
    percentual_desconto: percentualDesconto,
    data_leilao: dataLeilao,
    tipo_imovel: tipoImovelFromUrl(urlOriginal),
    url_original: urlOriginal,
    imagem_url: imagemUrl,
    fonte: FONTE,
  };
}

async function fetchPage(pageNum) {
  const url = pageNum === 1 ? LISTING_URL : `${LISTING_URL}?pagina=${pageNum}`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    timeout: 20000,
  });
  return response.data;
}

/**
 * Coleta imóveis em leilão do Mega Leilões (megaleiloes.com.br).
 * robots.txt do site permite `Allow: /` (exceto /login), respeitado aqui.
 * @param {number} maxPaginas número máximo de páginas de listagem a percorrer
 */
async function coletar(maxPaginas = 3) {
  const imoveis = [];

  for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
    const html = await fetchPage(pagina);
    const $ = cheerio.load(html);
    const cards = $('.card.open');

    if (cards.length === 0) break;

    cards.each((_, card) => {
      const item = parseCard($, card);
      if (item && item.url_original) imoveis.push(item);
    });

    if (pagina < maxPaginas) await randomDelay();
  }

  return imoveis;
}

module.exports = { coletar, FONTE };
