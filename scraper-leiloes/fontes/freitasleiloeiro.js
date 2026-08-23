const fs = require('fs');
const path = require('path');
const https = require('https');
const tls = require('tls');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.freitasleiloeiro.com.br';
const ENDPOINT = `${BASE_URL}/Leiloes/PesquisarLotes`;
const FONTE = 'freitasleiloeiro';

// O servidor envia um certificado intermediário AlphaSSL desatualizado que não
// fecha a cadeia até a raiz confiável (erro "unable to verify the first
// certificate"). Completa a cadeia com o intermediário correto, publicado
// oficialmente pela GlobalSign, mantendo a verificação TLS ativa.
const INTERMEDIATE_CERT = fs.readFileSync(
  path.join(__dirname, 'certs', 'freitasleiloeiro-intermediate.pem'),
  'utf8'
);
const httpsAgent = new https.Agent({
  ca: [...tls.rootCertificates, INTERMEDIATE_CERT],
});

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const DELAY_MIN_MS = 1000;
const DELAY_MAX_MS = 2000;
const TOP_ROWS = 12;
const CATEGORIA_IMOVEIS = 2;

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

function parseDataHora(dataStr, horaStr) {
  const dataMatch = (dataStr || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dataMatch) return null;
  const [, dd, mm, yyyy] = dataMatch;
  const horaMatch = (horaStr || '').match(/(\d{2}):(\d{2})/);
  const hh = horaMatch ? horaMatch[1] : '00';
  const min = horaMatch ? horaMatch[2] : '00';
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`;
}

function resolveUrl(href) {
  if (!href) return null;
  try {
    return new URL(href, BASE_URL).toString();
  } catch {
    return null;
  }
}

function parseCard($, card) {
  const $card = $(card);

  const link = $card.find('a').first();
  const urlOriginal = resolveUrl(link.attr('href'));
  if (!urlOriginal) return null;

  const localidadeTexto = $card.find('.cardLote-details span').first().text().replace(/\s+/g, ' ').trim();
  const [cidade = null, estado = null] = localidadeTexto.split('/').map((s) => s.trim());

  const descricao = $card.find('.cardLote-descBens .small').text().replace(/\s+/g, ' ').trim();
  const titulo = descricao || `Imóvel em leilão - ${localidadeTexto}`;

  const valor = parseValorBR($card.find('.cardLote-vlr').text());

  const dataSpans = $card.find('.cardLote-data span.fw-bold');
  const dataLeilao = dataSpans.length >= 1
    ? parseDataHora(dataSpans.eq(0).text(), dataSpans.eq(1).text())
    : null;

  const imagemUrl = $card.find('.cardLote-img').attr('src') || null;

  return {
    titulo,
    cidade,
    estado,
    bairro: null,
    valor_avaliacao: valor,
    valor_lance_minimo: valor,
    percentual_desconto: 0,
    data_leilao: dataLeilao,
    tipo_imovel: null,
    url_original: urlOriginal,
    imagem_url: imagemUrl,
    fonte: FONTE,
  };
}

async function fetchPage(pageNumber) {
  const response = await axios.get(ENDPOINT, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'X-Requested-With': 'XMLHttpRequest',
    },
    params: {
      Categoria: CATEGORIA_IMOVEIS,
      TipoLoteId: 0,
      PageNumber: pageNumber,
      TopRows: TOP_ROWS,
    },
    httpsAgent,
    timeout: 20000,
  });
  return response.data;
}

/**
 * Coleta imóveis em leilão do Freitas Leiloeiro (freitasleiloeiro.com.br).
 * O site não expõe robots.txt (retorna 404), ou seja, sem restrições declaradas.
 * A listagem é carregada via o mesmo endpoint AJAX que o site usa no botão
 * "Carregar mais lotes" (Leiloes/PesquisarLotes), filtrando Categoria=2 (Imóveis).
 * @param {number} maxPaginas número máximo de páginas a percorrer (12 lotes por página)
 */
async function coletar(maxPaginas = 3) {
  const imoveis = [];

  for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
    const html = await fetchPage(pagina);

    if (typeof html === 'string' && html.includes('Nenhum lote localizado')) break;

    const $ = cheerio.load(html);
    const cards = $('.cardlote');

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
