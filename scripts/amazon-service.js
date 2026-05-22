/**
 * amazon-service.js  — v5 (sem API Amazon)
 *
 * Estratégia sem PA-API / Creators API:
 *  1. Extrai ASIN da URL
 *  2. Busca título via Serper.dev (Google Shopping / Web) — funciona em CI/CD
 *  3. Fallback: busca título via Open Graph com proxy de metadados público
 *  4. Fallback final: usa nome do catálogo como título (nunca lança exceção)
 *
 * Imagem: testa múltiplos padrões de URL por ASIN com validação real
 * Link:   montado com ASIN + tag (sem API, 100% confiável)
 *
 * v5: Adiciona filtro de idioma — rejeita títulos em espanhol
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

// ── Palavras exclusivamente em espanhol — rejeita títulos com elas ────────
// Palavras que nunca aparecem em português brasileiro mas são comuns em ES
const SPANISH_ONLY_PATTERNS = [
  /\bjuego de\b/i,       // "juego de" = jogo de (ES)
  /\bcubo de limpieza\b/i,
  /\bde piso\b/i,        // "piso" em ES = chão (em PT é diferente)
  /\blimpieza\b/i,
  /\bescobilla\b/i,
  /\bespuma de afeitar\b/i,
  /\b(el|la|los|las|del|al|un|una|unos|unas)\s+\w/i, // artigos ES
  /\b(también|además|después|entonces|siempre|nunca|algo|alguien|nadie)\b/i,
  /\b(grande|pequeño|pequeña|mismo|misma|nuevo|nueva|usado|usada)\b/i,
  /\b(precio|envío|gratis|color|tamaño|tipo|producto)\b/i,
  /\b(rectangular|cuadrado|triangular)\b.*\b(limpieza|piso|suelo)\b/i,
];

function isTitleValid(title) {
  if (!title || title.trim().length < 8) return false;
  return !ERROR_TITLE_PATTERNS.some(re => re.test(title.trim()));
}

// Retorna true se o título parece estar em espanhol
function isTitleInSpanish(title) {
  if (!title) return false;
  const matched = SPANISH_ONLY_PATTERNS.filter(re => re.test(title));
  return matched.length >= 2; // precisa de pelo menos 2 indicadores para rejeitar
}

// ── HTTP helper ───────────────────────────────────────────────────────────
function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body: text, headers: res.headers });
      });
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

// ── Valida se uma URL retorna uma imagem real ─────────────────────────────
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
      if (res.statusCode === 200 && isImage && hasSize) {
        resolve(imgUrl);
      } else {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// ── Encontra a primeira URL de imagem válida entre os candidatos ──────────
async function resolveImageUrl(asin) {
  const candidates = buildImageCandidates(asin);
  console.log(`   🔍 Testando ${candidates.length} URLs de imagem para ASIN ${asin}...`);
  for (const url of candidates) {
    const valid = await validateImageUrl(url);
    if (valid) {
      console.log(`   ✅ Imagem válida encontrada: ${valid}`);
      return valid;
    }
    console.log(`   ✗  Inválida: ${url.split('/').pop()}`);
  }
  console.log(`   ⚠️  Nenhuma URL de imagem funcionou para ASIN ${asin}`);
  return null;
}

// ── 1. Título via Serper.dev — busca FORÇADA em PT-BR, site:amazon.com.br ─
async function fetchTitleViaSerper(asin, serperKey) {
  if (!serperKey) return null;
  console.log('   🔍 Buscando título via Serper (Google PT-BR)...');
  try {
    // gl=br + hl=pt-br força resultados em português do Brasil
    const query = `site:amazon.com.br/dp/${asin}`;
    const payload = JSON.stringify({ q: query, gl: 'br', hl: 'pt-br', num: 5 });
    const res = await httpRequest({
      hostname: 'google.serper.dev',
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload);

    if (res.status !== 200) {
      console.log(`   ⚠️  Serper retornou ${res.status}`);
      return null;
    }

    const data = JSON.parse(res.body);
    const results = [...(data?.organic || []), ...(data?.shopping || [])];

    for (const r of results) {
      const raw = (r.title || '').replace(/ [-:|].*Amazon.*$/i, '').replace(/ - Amazon\.com\.br$/i, '').trim();
      if (raw.length > 10 && isTitleValid(raw) && !isTitleInSpanish(raw)) {
        console.log(`   ✅ Título via Serper (PT): "${raw.slice(0, 60)}..."`);
        return { title: raw, specs: [] };
      }
      if (raw.length > 10 && isTitleInSpanish(raw)) {
        console.log(`   ⚠️  Título em espanhol ignorado: "${raw.slice(0, 50)}"`);
      }
    }
    return null;
  } catch (err) {
    console.log(`   ⚠️  Serper falhou: ${err.message}`);
    return null;
  }
}

// ── 2. Título via Serper com query mais simples ───────────────────────────
async function fetchTitleViaSerperSimple(asin, serperKey) {
  if (!serperKey) return null;
  console.log('   🔍 Serper — query simplificada (PT-BR)...');
  try {
    const payload = JSON.stringify({ q: `amazon.com.br ${asin}`, gl: 'br', hl: 'pt-br', num: 3 });
    const res = await httpRequest({
      hostname: 'google.serper.dev',
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload);

    if (res.status !== 200) return null;
    const data = JSON.parse(res.body);
    const results = data?.organic || [];

    for (const r of results) {
      if (!r.link?.includes('amazon.com')) continue;
      const raw = (r.title || '').replace(/ [-:|].*Amazon.*$/i, '').trim();
      if (raw.length > 10 && isTitleValid(raw) && !isTitleInSpanish(raw)) {
        console.log(`   ✅ Título via Serper (simples PT): "${raw.slice(0, 60)}..."`);
        return { title: raw, specs: [] };
      }
    }
    return null;
  } catch (err) {
    console.log(`   ⚠️  Serper simples falhou: ${err.message}`);
    return null;
  }
}

// ── 3. Título via proxy de metadados público ──────────────────────────────
async function fetchTitleViaMetaProxy(asin) {
  console.log('   🌐 Tentando via proxy de metadados...');
  try {
    const targetUrl = encodeURIComponent(`https://www.amazon.com.br/dp/${asin}`);
    const res = await httpRequest({
      hostname: 'jsonlink.io',
      path: `/api/extract?url=${targetUrl}`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });

    if (res.status !== 200) return null;
    const data = JSON.parse(res.body);
    const title = (data?.title || '').replace(/ [-:|].*Amazon.*$/i, '').trim();
    if (title.length > 10 && isTitleValid(title) && !isTitleInSpanish(title)) {
      console.log(`   ✅ Título via proxy (PT): "${title.slice(0, 60)}..."`);
      return { title, specs: [] };
    }
    if (isTitleInSpanish(title)) {
      console.log(`   ⚠️  Proxy retornou título em espanhol — descartado`);
    }
    return null;
  } catch (err) {
    console.log(`   ⚠️  Proxy falhou: ${err.message}`);
    return null;
  }
}

// ── Export principal ───────────────────────────────────────────────────────
export async function fetchAmazon(inputUrl, { mapCategory, buildTags, cleanTitle, productName } = {}) {
  console.log('📦  Amazon detectado...');

  let resolvedUrl = inputUrl;
  if (/amzn\.to/i.test(inputUrl)) {
    console.log('   🔗 Resolvendo link curto...');
    resolvedUrl = await resolveShortUrl(inputUrl);
    if (resolvedUrl !== inputUrl) console.log('   ✅ URL resolvida:', resolvedUrl);
  }

  const asin = extractAsin(resolvedUrl) || extractAsin(inputUrl);
  if (!asin) {
    throw new Error('Não consegui extrair o ASIN da URL Amazon. Use a URL completa do produto (ex: amazon.com.br/dp/XXXXXXXXXX).');
  }
  console.log('   ASIN:', asin);

  const serperKey = process.env.SERPER_API_KEY;
  const partnerTag = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;

  let title = '';
  let specs = [];

  // 1. Serper (query com site:amazon.com.br/dp/ASIN + forçar PT-BR)
  if (!title) {
    const r = await fetchTitleViaSerper(asin, serperKey);
    if (r) { title = r.title; specs = r.specs; }
  }

  // 2. Serper query simples PT-BR
  if (!title) {
    const r = await fetchTitleViaSerperSimple(asin, serperKey);
    if (r) { title = r.title; specs = r.specs; }
  }

  // 3. Proxy de metadados
  if (!title) {
    const r = await fetchTitleViaMetaProxy(asin);
    if (r) { title = r.title; specs = r.specs; }
  }

  // 4. Fallback: nome do catálogo (passado pelo agente via PRODUCT_NAME_HINT)
  if (!title && productName && isTitleValid(productName) && !isTitleInSpanish(productName)) {
    console.log(`   ℹ️  Usando nome do catálogo como título: "${productName}"`);
    title = productName;
  }

  // 5. Fallback extremo: ASIN como base — nunca trava o agente
  if (!title || !isTitleValid(title)) {
    console.log(`   ⚠️  Não consegui título em português — usando ASIN como base`);
    title = `Produto Amazon ${asin}`;
  }

  // Resolve imagem
  const imageUrl = await resolveImageUrl(asin);

  // Link afiliado — usa SEMPRE a tag do .env
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
