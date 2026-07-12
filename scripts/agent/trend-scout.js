/**
 * trend-scout.js — Buscador de Produtos em Alta por Pilar
 * AchadoCerto.VIP
 *
 * RESPONSABILIDADE:
 *   Buscar produtos em alta (bestsellers / mais vendidos) na Amazon BR
 *   para cada pilar ANTES que o agente faça a seleção.
 *
 * COMO FUNCIONA:
 *   1. Faz scraping leve das páginas de Mais Vendidos da Amazon BR
 *      (páginas públicas, sem autenticação, sem PA-API)
 *   2. Retorna lista de ASINs + nomes de produtos em alta por categoria
 *   3. Esses produtos recebem PRIORIDADE no pickProduct() do agente
 *      mas o catálogo fixo é sempre o fallback — nunca fica sem produto
 *
 * PROTOCOLO DE SEGURANÇA:
 *   - Não altera nenhum arquivo do site
 *   - Falha silenciosa: se o fetch falhar, retorna array vazio e o agente
 *     usa o catálogo fixo normalmente — sem quebrar nada
 *   - Timeout de 8s para não bloquear o job
 *   - Cache de 6h em disco para não bater na Amazon a cada execução
 *   - Respeita robots.txt: usa apenas páginas de bestsellers públicas
 *   - SEGURANÇA: produtos trending fora do catálogo fixo são ignorados
 *     para evitar publicar produtos da Amazon.com (EUA) por engano
 *
 * MAPEAMENTO DE PILAR → CATEGORIA AMAZON BR:
 *   beleza  → /bestsellers/beauty        (Beleza e Cuidados Pessoais)
 *   saude   → /bestsellers/drugstore     (Saúde e Cuidados Pessoais)
 *   casa    → /bestsellers/kitchen       (Casa e Cozinha)
 *
 * RETORNO DE fetchTrendingProducts(pillar):
 *   Array de objetos: [{ asin, name, rating, reviewCount, isTrending: true }]
 *   Array vazio se falhar (fallback automático para o catálogo)
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const CACHE_FILE    = path.join(__dirname, 'trending-cache.json');
const CACHE_TTL_MS  = 6 * 60 * 60 * 1000; // 6 horas
const FETCH_TIMEOUT = 8000;               // 8 segundos
const MAX_TRENDING  = 10;                 // produtos por pilar

// URLs públicas de Mais Vendidos Amazon BR por pilar
const BESTSELLER_URLS = {
  beleza: 'https://www.amazon.com.br/bestsellers/beauty',
  saude:  'https://www.amazon.com.br/bestsellers/drugstore',
  casa:   'https://www.amazon.com.br/bestsellers/kitchen',
};

// Headers para simular browser real (evita bloqueio 403)
const FETCH_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
};

// ── Cache em disco ──────────────────────────────────────────────────────────────

function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (_) {
    return {};
  }
}

function saveCache(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (_) {}
}

function getCached(pillar) {
  const cache = loadCache();
  const entry = cache[pillar];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null; // expirado
  return entry.products;
}

function setCached(pillar, products) {
  const cache = loadCache();
  cache[pillar] = { fetchedAt: Date.now(), products };
  saveCache(cache);
}

// ── Parser HTML leve (sem dependência extra) ───────────────────────────────────
// Extrai ASINs e nomes via regex direto no HTML bruto.
// Mais robusto que DOM parsing para markup dinâmico do Amazon.

function parseAmazonBestsellers(html) {
  const products = [];
  const seen = new Set();

  // Padrão 1: data-asin em qualquer tag
  const asinPattern = /data-asin="([A-Z0-9]{10})"/g;
  // Padrão 2: URL /dp/ASIN
  const dpPattern   = /\/dp\/([A-Z0-9]{10})/g;

  // Coleta ASINs do HTML
  const asins = new Set();
  let m;
  while ((m = asinPattern.exec(html)) !== null) asins.add(m[1]);
  while ((m = dpPattern.exec(html))   !== null) asins.add(m[1]);

  // Para cada ASIN encontrado, tenta extrair nome próximo
  for (const asin of asins) {
    if (seen.has(asin)) continue;
    seen.add(asin);

    // Tenta extrair título perto do ASIN (dentro de ~2000 chars após)
    const idx = html.indexOf(asin);
    if (idx === -1) continue;
    const chunk = html.slice(idx, idx + 2000);

    // Tenta alt="...", title="...", ou aria-label="..."
    const namePatterns = [
      /alt="([^"]{10,120})"/,
      /title="([^"]{10,120})"/,
      /aria-label="([^"]{10,120})"/,
      /<span[^>]+>([^<]{10,100})<\/span>/,
    ];

    let name = null;
    for (const np of namePatterns) {
      const nm = np.exec(chunk);
      if (nm && nm[1] && !nm[1].toLowerCase().includes('mais vendido')) {
        name = nm[1].replace(/\s+/g, ' ').trim();
        // Remove lixo comum do Amazon
        name = name.replace(/^Visitar.+$/, '').trim();
        if (name.length >= 10) break;
      }
    }

    if (!name || name.length < 10) continue;

    // Tenta extrair avaliação
    const ratingM = /([\d,]+)\s*de\s*5\s*estrelas/.exec(chunk);
    const reviewM = /(\d[\d.]+)\s*avalia[cç][oõ]es/.exec(chunk);

    products.push({
      asin,
      name:        name.slice(0, 100),
      rating:      ratingM ? parseFloat(ratingM[1].replace(',', '.')) : null,
      reviewCount: reviewM ? parseInt(reviewM[1].replace('.', '')) : null,
      isTrending:  true,
    });

    if (products.length >= MAX_TRENDING) break;
  }

  return products;
}

// ── Fetch com timeout ──────────────────────────────────────────────────────────

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal:  controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── API pública ────────────────────────────────────────────────────────────────

/**
 * fetchTrendingProducts(pillar)
 *
 * @param  {string} pillar  'beleza' | 'saude' | 'casa'
 * @returns {Promise<Array>} produtos em alta (pode ser array vazio)
 *
 * Nunca lança exceção — falha silenciosa garante que o agente
 * continua funcionando mesmo sem acesso à internet.
 */
export async function fetchTrendingProducts(pillar) {
  // 1. Verifica cache
  const cached = getCached(pillar);
  if (cached) {
    return cached;
  }

  const url = BESTSELLER_URLS[pillar];
  if (!url) return [];

  try {
    const html     = await fetchWithTimeout(url, FETCH_TIMEOUT);
    const products = parseAmazonBestsellers(html);

    if (products.length > 0) {
      setCached(pillar, products);
    }

    return products;
  } catch (_) {
    // Falha silenciosa: qualquer erro de rede, timeout, bloqueio 429/403
    // retorna array vazio e o agente usa o catálogo fixo normalmente
    return [];
  }
}

/**
 * mergeTrendingWithCatalog(trendingProducts, catalogProducts, pillar, history)
 *
 * Combina produtos em alta com o catálogo fixo de forma estratégica:
 *   - Produtos trending que já existem no catálogo recebem boost de prioridade
 *   - Produtos trending FORA do catálogo são IGNORADOS por segurança
 *     (evita publicar produtos da Amazon.com EUA ou sem curadoria)
 *   - Catálogo fixo é sempre o fallback final
 *
 * @param {Array}  trendingProducts  - resultado de fetchTrendingProducts()
 * @param {Array}  catalogProducts   - produtos do AMAZON_CATALOG filtrados pelo pilar
 * @param {string} pillar
 * @param {Array}  history
 * @param {object} ANGLES            - mapa de angles do agente
 * @returns {Array} pool ordenado por prioridade
 */
export function mergeTrendingWithCatalog(trendingProducts, catalogProducts, pillar, history, ANGLES) {
  // Usa 7 dias (consistente com o HISTORY_DAYS do agent.js)
  // Antes: 60 dias — bloqueava todo o catálogo após ~16 dias de postagens
  const historyAsins = new Set(
    history
      .filter(h => (Date.now() - new Date(h.postedAt).getTime()) < 7 * 24 * 60 * 60 * 1000)
      .map(h => h.asin)
  );

  const catalogMap = new Map(catalogProducts.map(p => [p.asin, p]));

  // Grupo A: trending que já estão no catálogo e não foram postados recentemente
  // ÚNICO grupo permitido para trending — garante que só produtos curados são usados
  const groupA = trendingProducts
    .filter(t => catalogMap.has(t.asin) && !historyAsins.has(t.asin))
    .map(t => ({ ...catalogMap.get(t.asin), isTrending: true, trendingRank: trendingProducts.indexOf(t) + 1 }));

  // GRUPO B REMOVIDO: produtos trending fora do catálogo eram publicados sem
  // validação de origem, causando posts de produtos Amazon.com (EUA) no site.
  // Apenas produtos do catálogo curado podem ser postados.

  // Grupo C: catálogo fixo restante (não trending, não postado)
  const groupC = catalogProducts
    .filter(p => !historyAsins.has(p.asin))
    .filter(p => !groupA.some(a => a.asin === p.asin));

  // Ordem de prioridade: A (trending no catálogo) > C (catálogo fixo)
  return [...groupA, ...groupC];
}

/**
 * getTrendingStatus()
 * Para o --status do agente: mostra o que está em cache.
 */
export function getTrendingStatus() {
  const cache = loadCache();
  const lines = [];
  for (const pillar of ['beleza', 'saude', 'casa']) {
    const entry = cache[pillar];
    if (!entry) {
      lines.push(`  ${pillar.padEnd(8)} [sem cache]`);
    } else {
      const age  = Math.round((Date.now() - entry.fetchedAt) / 60000);
      const exp  = age > 360 ? ' (expirado)' : '';
      lines.push(`  ${pillar.padEnd(8)} ${entry.products.length} produtos  [cache ${age}min atrás${exp}]`);
    }
  }
  return lines;
}
