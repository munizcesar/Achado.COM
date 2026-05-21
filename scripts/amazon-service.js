/**
 * amazon-service.js  — v4 (sem PA-API, com imagem corrigida)
 *
 * Estratégia:
 *  1. Extrai ASIN da URL
 *  2. Busca título via Serper.dev (Google Shopping / Web)
 *  3. Fallback: proxy de metadados público (jsonlink.io)
 *  4. Fallback final: usa nome do catálogo como título
 *
 * Imagem: tenta múltiplos padrões de URL por ASIN, valida antes de retornar
 * Link:   montado com ASIN + tag de afiliado
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

function isTitleValid(title) {
  if (!title || title.trim().length < 8) return false;
  return !ERROR_TITLE_PATTERNS.some(re => re.test(title.trim()));
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
// Testados em ordem — retorna o primeiro que responder com imagem válida
function buildImageCandidates(asin) {
  return [
    // Padrão principal atual (SL1500)
    `https://m.media-amazon.com/images/P/${asin}.01._SL1500_.jpg`,
    // Padrão compacto (SL500) — fallback
    `https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`,
    // Padrão legado images-na (às vezes ainda funciona)
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL1500_.jpg`,
    // Padrão mínimo sem sufixo
    `https://m.media-amazon.com/images/P/${asin}.01.jpg`,
  ];
}

// ── Verifica se URL retorna uma imagem válida (≥ 2 KB) ───────────────────
async function probeImageUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      const ct = res.headers['content-type'] || '';
      const isImage = ct.startsWith('image/');
      const size = parseInt(res.headers['content-length'] || '0', 10);

      // Consome os dados sem salvar
      res.resume();

      if (res.statusCode === 200 && isImage && (size === 0 || size > 2000)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => { req.destroy(); resolve(false); });
  });
}

// ── Retorna a primeira URL de imagem válida para o ASIN ──────────────────
async function findValidImageUrl(asin) {
  const candidates = buildImageCandidates(asin);
  for (const url of candidates) {
    console.log(`   🖼️  Testando imagem: ${url}`);
    const ok = await probeImageUrl(url);
    if (ok) {
      console.log(`   ✅ Imagem válida: ${url}`);
      return url;
    }
  }
  console.log('   ⚠️  Nenhuma URL de imagem válida encontrada para este ASIN');
  return '';
}

// ── 1. Título via Serper.dev (Google) ─────────────────────────────────────
async function fetchTitleViaSerper(asin, serperKey) {
  if (!serperKey) return null;
  console.log('   🔍 Buscando título via Serper (Google)...');
  try {
    const query = `amazon.com.br ${asin} site:amazon.com.br`;
    const payload = JSON.stringify({ q: query, gl: 'br', hl: 'pt', num: 5 });
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
    const results = data?.organic || [];

    for (const r of results) {
      const raw = (r.title || '').replace(/ [-:|].*Amazon.*$/i, '').replace(/ - Amazon\.com\.br$/i, '').trim();
      if (raw.length > 10 && isTitleValid(raw) && !raw.toLowerCase().includes(asin.toLowerCase())) {
        console.log(`   ✅ Título via Serper: "${raw.slice(0, 60)}..."`);
        return { title: raw, specs: [] };
      }
    }

    const shopping = data?.shopping || [];
    for (const s of shopping) {
      const raw = (s.title || '').trim();
      if (raw.length > 10 && isTitleValid(raw)) {
        console.log(`   ✅ Título via Serper Shopping: "${raw.slice(0, 60)}..."`);
        return { title: raw, specs: [] };
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
  console.log('   🔍 Serper — query simplificada...');
  try {
    const payload = JSON.stringify({ q: `amazon ${asin}`, gl: 'br', hl: 'pt', num: 3 });
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
      if (raw.length > 10 && isTitleValid(raw)) {
        console.log(`   ✅ Título via Serper (simples): "${raw.slice(0, 60)}..."`);
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
    if (title.length > 10 && isTitleValid(title)) {
      console.log(`   ✅ Título via proxy: "${title.slice(0, 60)}..."`);
      return { title, specs: [] };
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

  // Resolve link curto
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

  // 1. Serper (query com ASIN + site:amazon.com.br)
  if (!title) {
    const r = await fetchTitleViaSerper(asin, serperKey);
    if (r) { title = r.title; specs = r.specs; }
  }

  // 2. Serper query simples
  if (!title) {
    const r = await fetchTitleViaSerperSimple(asin, serperKey);
    if (r) { title = r.title; specs = r.specs; }
  }

  // 3. Proxy de metadados
  if (!title) {
    const r = await fetchTitleViaMetaProxy(asin);
    if (r) { title = r.title; specs = r.specs; }
  }

  // 4. Fallback: usa o nome do catálogo (passado pelo agente)
  if (!title && productName && isTitleValid(productName)) {
    console.log(`   ℹ️  Usando nome do catálogo como título: "${productName}"`);
    title = productName;
  }

  // 5. Fallback extremo: usa ASIN como marcador
  if (!title || !isTitleValid(title)) {
    console.log(`   ⚠️  Não consegui título real — usando ASIN como base`);
    title = `Produto Amazon ${asin}`;
  }

  // Imagem: testa candidatos em ordem, retorna a primeira URL válida
  const imageUrl = await findValidImageUrl(asin);

  // Link afiliado
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
