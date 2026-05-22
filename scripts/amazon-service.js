/**
 * amazon-service.js  — v6 (sem API Amazon, com ML como fallback PT-BR)
 *
 * Cadeia de busca de título PT-BR:
 *  1. Serper.dev — site:amazon.com.br/dp/ASIN (gl=br, hl=pt-br)
 *  2. Serper.dev — query simples PT-BR
 *  3. Mercado Livre via RapidAPI — busca por nome do produto → pega título PT-BR
 *     (Opção B: usa só o TÍTULO do ML; o link de destino continua sendo Amazon)
 *  4. Proxy de metadados público (jsonlink.io)
 *  5. Fallback: nome do catálogo (PRODUCT_NAME_HINT)
 *  6. Fallback extremo: "Produto Amazon {ASIN}"
 *
 * Imagem: testa múltiplos padrões de URL por ASIN com validação real
 * Link:   montado com ASIN + tag Amazon (100% confiável, nunca muda)
 *
 * v6: +Mercado Livre RapidAPI como step 3 para garantir título sempre PT-BR
 */

import https from 'https';
import http from 'http';

// ── Padrões de título inválido ────────────────────────────────────────────
const ERROR_TITLE_PATTERNS = [
  /não foi possível encontrar/i,
  /página não encontrada/i,
  /page not found/i,
  /robot check/i,
  /captcha/i,
  /acesso negado/i,
  /access denied/i,
  /desculpe.*erro/i,
  /sorry.*error/i,
  /^404/i,
  /^erro\b/i,
  /^error\b/i,
  /^amazon\.com/i,
  /^amazon\.com\.br\s*[-|]/i,
  /sign in/i,
  /fazer login/i,
];

// ── Detector de espanhol ──────────────────────────────────────────────────
const SPANISH_ONLY_PATTERNS = [
  /\bjuego de\b/i,
  /\bcubo de limpieza\b/i,
  /\bde piso\b/i,
  /\blimpieza\b/i,
  /\bescobilla\b/i,
  /\bespuma de afeitar\b/i,
  /\b(el|la|los|las|del|al|un|una|unos|unas)\s+\w/i,
  /\b(también|además|después|entonces|siempre|nunca|algo|alguien|nadie)\b/i,
  /\b(grande|pequeño|pequeña|mismo|misma|nuevo|nueva|usado|usada)\b/i,
  /\b(precio|envío|gratis|color|tamaño|tipo|producto)\b/i,
  /\b(rectangular|cuadrado|triangular)\b.*\b(limpieza|piso|suelo)\b/i,
];

function isTitleValid(title) {
  if (!title || title.trim().length < 8) return false;
  return !ERROR_TITLE_PATTERNS.some(re => re.test(title.trim()));
}

function isTitleInSpanish(title) {
  if (!title) return false;
  return SPANISH_ONLY_PATTERNS.filter(re => re.test(title)).length >= 2;
}

// ── HTTP helper ───────────────────────────────────────────────────────────
function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(Buffer.from(c)));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// ── Resolve link curto amzn.to ────────────────────────────────────────────
function resolveShortUrl(urlStr, redirectCount = 0) {
  if (redirectCount > 8) return Promise.resolve(urlStr);
  return new Promise((resolve) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pt-BR,pt;q=0.9' }
    }, (res) => {
      res.resume();
      const loc = res.headers.location;
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && loc) {
        const next = loc.startsWith('http') ? loc : new URL(loc, urlStr).href;
        return resolve(resolveShortUrl(next, redirectCount + 1));
      }
      resolve(urlStr);
    });
    req.on('error', () => resolve(urlStr));
    req.setTimeout(10000, () => { req.destroy(); resolve(urlStr); });
  });
}

// ── Extrai ASIN ───────────────────────────────────────────────────────────
function extractAsin(url) {
  return (
    url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/[?&]asin=([A-Z0-9]{10})/)?.[1] ||
    null
  );
}

// ── Candidatos de URL de imagem por ASIN ─────────────────────────────────
function buildImageCandidates(asin) {
  return [
    `https://m.media-amazon.com/images/P/${asin}.01._AC_SL1500_.jpg`,
    `https://m.media-amazon.com/images/P/${asin}.01._AC_SX679_.jpg`,
    `https://m.media-amazon.com/images/P/${asin}.01.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._AC_SL1500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.jpg`,
  ];
}

// ── Valida URL de imagem ──────────────────────────────────────────────────
async function validateImageUrl(imgUrl) {
  return new Promise((resolve) => {
    const lib = imgUrl.startsWith('https') ? https : http;
    const req = lib.request(imgUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const ct = (res.headers['content-type'] || '').toLowerCase();
      const cl = parseInt(res.headers['content-length'] || '0', 10);
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(validateImageUrl(res.headers.location));
      }
      res.resume();
      const isImage = ct.startsWith('image/') || ct === 'binary/octet-stream';
      const hasSize = cl === 0 || cl > 5000;
      resolve(res.statusCode === 200 && isImage && hasSize ? imgUrl : null);
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function resolveImageUrl(asin) {
  const candidates = buildImageCandidates(asin);
  console.log(`   🔍 Testando ${candidates.length} URLs de imagem para ASIN ${asin}...`);
  for (const url of candidates) {
    const valid = await validateImageUrl(url);
    if (valid) { console.log(`   ✅ Imagem válida: ${valid}`); return valid; }
    console.log(`   ✗  Inválida: ${url.split('/').pop()}`);
  }
  console.log(`   ⚠️  Nenhuma imagem funcionou para ASIN ${asin}`);
  return null;
}

// ── 1. Serper — site:amazon.com.br/dp/ASIN (PT-BR forçado) ───────────────
async function fetchTitleViaSerper(asin, serperKey) {
  if (!serperKey) return null;
  console.log('   🔍 Serper — site:amazon.com.br/dp (PT-BR)...');
  try {
    const payload = JSON.stringify({ q: `site:amazon.com.br/dp/${asin}`, gl: 'br', hl: 'pt-br', num: 5 });
    const res = await httpRequest({
      hostname: 'google.serper.dev', path: '/search', method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, payload);
    if (res.status !== 200) { console.log(`   ⚠️  Serper ${res.status}`); return null; }
    const results = [...(JSON.parse(res.body)?.organic || []), ...(JSON.parse(res.body)?.shopping || [])];
    for (const r of results) {
      const raw = (r.title || '').replace(/ [-:|].*Amazon.*$/i, '').trim();
      if (raw.length > 10 && isTitleValid(raw) && !isTitleInSpanish(raw)) {
        console.log(`   ✅ Serper (PT): "${raw.slice(0, 60)}"`);
        return { title: raw, specs: [] };
      }
      if (isTitleInSpanish(raw)) console.log(`   ⚠️  ES ignorado: "${raw.slice(0, 40)}"`);
    }
    return null;
  } catch (err) { console.log(`   ⚠️  Serper falhou: ${err.message}`); return null; }
}

// ── 2. Serper — query simples PT-BR ──────────────────────────────────────
async function fetchTitleViaSerperSimple(asin, serperKey) {
  if (!serperKey) return null;
  console.log('   🔍 Serper — query simples (PT-BR)...');
  try {
    const payload = JSON.stringify({ q: `amazon.com.br ${asin}`, gl: 'br', hl: 'pt-br', num: 3 });
    const res = await httpRequest({
      hostname: 'google.serper.dev', path: '/search', method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, payload);
    if (res.status !== 200) return null;
    const results = JSON.parse(res.body)?.organic || [];
    for (const r of results) {
      if (!r.link?.includes('amazon.com')) continue;
      const raw = (r.title || '').replace(/ [-:|].*Amazon.*$/i, '').trim();
      if (raw.length > 10 && isTitleValid(raw) && !isTitleInSpanish(raw)) {
        console.log(`   ✅ Serper simples (PT): "${raw.slice(0, 60)}"`);
        return { title: raw, specs: [] };
      }
    }
    return null;
  } catch (err) { console.log(`   ⚠️  Serper simples falhou: ${err.message}`); return null; }
}

// ── 3. MERCADO LIVRE via RapidAPI — Opção B ───────────────────────────────
// Busca o produto por nome no ML Brasil e pega o título PT-BR do resultado.
// O link de destino CONTINUA sendo Amazon — apenas o título é reutilizado.
//
// Como funciona:
//   a) Usa o nome do catálogo (productName) como query de busca
//   b) Chama GET /listings_for_search?query=<nome>&limit=3
//   c) Pega o primeiro título que seja válido e em PT-BR
//   d) Sanitiza o título (remove marca do ML, preço, etc.)
async function fetchTitleViaML(productName, rapidApiKey, rapidApiHost) {
  if (!rapidApiKey || !productName) return null;
  console.log('   🛒 Mercado Livre (RapidAPI) — buscando título PT-BR...');
  try {
    const query = encodeURIComponent(productName.slice(0, 80));
    const host  = rapidApiHost || 'mercado-libre7.p.rapidapi.com';
    const res   = await httpRequest({
      hostname: host,
      path:     `/listings_for_search?query=${query}&limit=3`,
      method:   'GET',
      headers: {
        'x-rapidapi-key':  rapidApiKey,
        'x-rapidapi-host': host,
        'Accept':          'application/json',
      },
    });

    if (res.status !== 200) {
      console.log(`   ⚠️  ML RapidAPI retornou ${res.status}`);
      return null;
    }

    const data = JSON.parse(res.body);
    // A API pode retornar array direto ou { results: [...] }
    const items = Array.isArray(data) ? data : (data?.results || data?.listings || []);

    for (const item of items) {
      const raw = (item?.title || item?.name || '').trim();
      if (!raw || raw.length < 8) continue;

      // Sanitiza: remove sufixos de quantidade/tamanho que ML adiciona
      const clean = raw
        .replace(/\s*[-|–]\s*(\d+\s*(ml|g|kg|un|pack|unidades|capsulas|cápsulas|comprimidos)).*$/i, '')
        .replace(/\s*\(.*?\)$/, '')   // remove parênteses finais
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150);

      if (clean.length < 8) continue;
      if (isTitleInSpanish(clean)) {
        console.log(`   ⚠️  ML título ES ignorado: "${clean.slice(0, 40)}"`);
        continue;
      }
      if (!isTitleValid(clean)) continue;

      console.log(`   ✅ ML RapidAPI título PT-BR: "${clean.slice(0, 60)}"`);
      return { title: clean, specs: [] };
    }

    console.log('   ⚠️  ML RapidAPI: nenhum título PT-BR válido nos resultados');
    return null;
  } catch (err) {
    console.log(`   ⚠️  ML RapidAPI falhou: ${err.message}`);
    return null;
  }
}

// ── 4. Proxy de metadados público ────────────────────────────────────────
async function fetchTitleViaMetaProxy(asin) {
  console.log('   🌐 Proxy de metadados (jsonlink.io)...');
  try {
    const targetUrl = encodeURIComponent(`https://www.amazon.com.br/dp/${asin}`);
    const res = await httpRequest({
      hostname: 'jsonlink.io', path: `/api/extract?url=${targetUrl}`,
      method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    if (res.status !== 200) return null;
    const title = (JSON.parse(res.body)?.title || '').replace(/ [-:|].*Amazon.*$/i, '').trim();
    if (title.length > 10 && isTitleValid(title) && !isTitleInSpanish(title)) {
      console.log(`   ✅ Proxy (PT): "${title.slice(0, 60)}"`);
      return { title, specs: [] };
    }
    if (isTitleInSpanish(title)) console.log('   ⚠️  Proxy: título ES — descartado');
    return null;
  } catch (err) { console.log(`   ⚠️  Proxy falhou: ${err.message}`); return null; }
}

// ── Export principal ──────────────────────────────────────────────────────
export async function fetchAmazon(inputUrl, { mapCategory, buildTags, cleanTitle, productName } = {}) {
  console.log('📦  Amazon detectado...');

  let resolvedUrl = inputUrl;
  if (/amzn\.to/i.test(inputUrl)) {
    console.log('   🔗 Resolvendo link curto...');
    resolvedUrl = await resolveShortUrl(inputUrl);
    if (resolvedUrl !== inputUrl) console.log('   ✅ URL resolvida:', resolvedUrl);
  }

  const asin = extractAsin(resolvedUrl) || extractAsin(inputUrl);
  if (!asin) throw new Error('Não consegui extrair o ASIN da URL Amazon.');
  console.log('   ASIN:', asin);

  const serperKey    = process.env.SERPER_API_KEY;
  const rapidApiKey  = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST || 'mercado-libre7.p.rapidapi.com';
  const partnerTag   = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;

  let title = '';
  let specs = [];

  // ── Cadeia de busca de título PT-BR ──────────────────────────────────
  // Step 1: Serper — site:amazon.com.br/dp/ASIN
  if (!title) {
    const r = await fetchTitleViaSerper(asin, serperKey);
    if (r) { title = r.title; specs = r.specs; }
  }

  // Step 2: Serper — query simples
  if (!title) {
    const r = await fetchTitleViaSerperSimple(asin, serperKey);
    if (r) { title = r.title; specs = r.specs; }
  }

  // Step 3: Mercado Livre RapidAPI (Opção B)
  // Usa o nome do catálogo para buscar no ML e pegar título PT-BR.
  // O link de destino continua sendo Amazon — só o título é reutilizado.
  if (!title) {
    const hint = productName || '';
    if (hint) {
      const r = await fetchTitleViaML(hint, rapidApiKey, rapidApiHost);
      if (r) { title = r.title; specs = r.specs; }
    } else {
      console.log('   ℹ️  ML step 3 pulado — sem PRODUCT_NAME_HINT');
    }
  }

  // Step 4: Proxy de metadados
  if (!title) {
    const r = await fetchTitleViaMetaProxy(asin);
    if (r) { title = r.title; specs = r.specs; }
  }

  // Step 5: Nome do catálogo direto
  if (!title && productName && isTitleValid(productName) && !isTitleInSpanish(productName)) {
    console.log(`   ℹ️  Usando nome do catálogo: "${productName}"`);
    title = productName;
  }

  // Step 6: Fallback extremo — nunca trava o agente
  if (!title || !isTitleValid(title)) {
    console.log(`   ⚠️  Sem título PT — usando ASIN como base`);
    title = `Produto Amazon ${asin}`;
  }

  // ── Imagem ────────────────────────────────────────────────────────────
  const imageUrl = await resolveImageUrl(asin);

  // ── Link afiliado — SEMPRE Amazon ────────────────────────────────────
  const affiliateUrl = partnerTag
    ? `https://www.amazon.com.br/dp/${asin}?tag=${partnerTag}`
    : resolvedUrl;

  const _clean     = cleanTitle  || (t => t.replace(/\s+/g, ' ').trim().slice(0, 150));
  const _mapCat    = mapCategory || (() => 'casa');
  const _buildTags = buildTags   || ((t, c) => [c]);

  const cleanedTitle = _clean(title);
  const category     = _mapCat(cleanedTitle);

  return {
    title: cleanedTitle,
    description: `${cleanedTitle} disponível na Amazon com entrega Prime para todo o Brasil.`,
    category,
    tags: _buildTags(cleanedTitle, category),
    imageUrl,
    specs,
    store: 'Amazon',
    affiliateUrl,
  };
}
