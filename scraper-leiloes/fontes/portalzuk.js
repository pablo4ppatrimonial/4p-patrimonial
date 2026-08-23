const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.portalzuk.com.br';
const LISTING_URL = `${BASE_URL}/leilao-de-imoveis`;
const FONTE = 'portalzuk';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const DELAY_MIN_MS = 1000;
const DELAY_MAX_MS = 2000;

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

function parseCard($, card) {
  const $card = $(card);

  const link = $card.find('.card-property-image-wrapper a').first();
  const urlOriginal = link.attr('href');
  if (!urlOriginal) return null;

  const tipoImovel = $card.find('.card-property-price-lote').first().text().trim() || null;

  const addressSpans = $card.find('address.card-property-address span');
  const localidadeTexto = addressSpans.eq(0).text().replace(/\s+/g, ' ').trim();
  const enderecoTexto = addressSpans.eq(1).text().replace(/\s+/g, ' ').trim();

  const [localidadePart, bairroPart] = localidadeTexto.split(' - ').map((s) => s.trim());
  const [cidade = null, estado = null] = (localidadePart || '').split('/').map((s) => s.trim());
  const bairro = bairroPart || null;

  const precos = $card.find('ul.card-property-prices').last().find('li.card-property-price');

  const valores = [];
  precos.each((_, li) => {
    const $li = $(li);
    const valorTexto = $li
      .find('.card-property-price-value')
      .clone()
      .find('.card-property-price-percent')
      .remove()
      .end()
      .text();
    const dataTexto = $li.find('.card-property-price-data').text();
    valores.push({
      valor: parseValorBR(valorTexto),
      data: parseDataBR(dataTexto),
    });
  });

  const primeiraPraca = valores[0] || null;
  const segundaPraca = valores[1] || null;

  const valorAvaliacao = primeiraPraca ? primeiraPraca.valor : null;
  const valorLanceMinimo = segundaPraca ? segundaPraca.valor : valorAvaliacao;
  const dataLeilao = primeiraPraca ? primeiraPraca.data : null;

  let percentualDesconto = null;
  if (valorAvaliacao && valorLanceMinimo && valorAvaliacao > 0) {
    percentualDesconto = ((valorAvaliacao - valorLanceMinimo) / valorAvaliacao) * 100;
    percentualDesconto = Math.round(percentualDesconto * 100) / 100;
  }

  const imagemUrl = $card.find('.card-property-image-wrapper img').attr('src') || null;

  const partesTitulo = [tipoImovel, enderecoTexto, [cidade, estado].filter(Boolean).join('/')].filter(Boolean);
  const titulo = partesTitulo.join(' - ');

  return {
    titulo,
    cidade,
    estado,
    bairro,
    valor_avaliacao: valorAvaliacao,
    valor_lance_minimo: valorLanceMinimo,
    percentual_desconto: percentualDesconto,
    data_leilao: dataLeilao,
    tipo_imovel: tipoImovel,
    url_original: urlOriginal,
    imagem_url: imagemUrl,
    fonte: FONTE,
  };
}

async function fetchListagem() {
  const response = await axios.get(LISTING_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    timeout: 20000,
  });
  return response.data;
}

/**
 * Coleta imóveis em leilão do Portal Zuk (portalzuk.com.br, ex-Zukerman Leilões).
 * robots.txt permite `/leilao-de-imoveis` e `/imovel/...` (só bloqueia rotas
 * administrativas como /edital, /minha-conta, /ajax-*).
 * A listagem não pagina por querystring (?page= é ignorado pelo servidor),
 * então é coletada a página padrão, que já traz um bom volume de imóveis.
 */
async function coletar() {
  const html = await fetchListagem();
  const $ = cheerio.load(html);
  const cards = $('.card-property.card_lotes_div');

  const imoveis = [];
  cards.each((_, card) => {
    const item = parseCard($, card);
    if (item && item.url_original) imoveis.push(item);
  });

  await randomDelay();

  return imoveis;
}

module.exports = { coletar, FONTE };
