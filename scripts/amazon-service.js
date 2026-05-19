/**
 * amazon-service.js
 * Busca dados de produto da Amazon BR via:
 *  1. Creators API  (se AMAZON_CREDENTIAL_ID estiver configurado)
 *  2. PA-API 5.0    (se AMAZON_ACCESS_KEY estiver configurado)
 *  3. Open Graph / scraping leve (funciona localmente, bloqueado no CI)
 *  4. Fallback gracioso: usa título passado pelo catálogo ou nome genérico
 *     ──► NUNCA lança erro fatal — o agente sempre continua.
 *
 * Imagem: sempre via URL direta por ASIN (100% confiável, sem API)
 * Link afiliado: montado com ASIN + tag (100% confiável, sem API)
 */

import https from 'https';
import http from 'http';
import crypto from 'crypto';

// ── Títulos de erro que indicam bloqueio/captcha ──────────────────────────
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
];

function isTitleValid(title) {
  if (!title || title.trim().length < 8) return false;
  return !ERROR_TITLE_PATTERNS.some(re => re.test(title.trim()));
}

// ── HTTP helper ────────────────────────────────────────────────────────────

function get(urlStr, customHeaders = {}, redirectCount = 0) {
  if (redirectCount > 8) throw new Error('Muitos redirecionamentos');
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'identity',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'Upgrade-Insecure-Requests': '1',
    };
    const headers = { ...defaultHeaders, ...customHeaders };
    const req = lib.get(urlStr, { headers }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return resolve(get(res.headers.location, customHeaders, redirectCount + 1));
      }
      const chunks = [];
      res.on('data', c => chunks.push(Buffer.from(c)));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body, headers: res.headers, url: urlStr });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Resolve link curto amzn.to → URL real ─────────────────────────────────

function resolveShortUrl(urlStr, redirectCount = 0) {
  if (redirectCount > 8) return Promise.resolve(urlStr);
  return new Promise((resolve) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    }, (res) => {
      res.resume();
      const location = res.headers.location;
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && location) {
        const next = location.startsWith('http') ? location : new URL(location, urlStr).href;
        return resolve(resolveShortUrl(next, redirectCount + 1));
      }
      resolve(urlStr);
    });
    req.on('error', () => resolve(urlStr));
    req.setTimeout(10000, () => { req.destroy(); resolve(urlStr); });
  });
}

// ── Extrai ASIN da URL ─────────────────────────────────────────────────────

function extractAsin(url) {
  return (
    url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/[?&]asin=([A-Z0-9]{10})/)?.[1] ||
    null
  );
}

// ── Imagem direta por ASIN (sem API, 100% confiável) ──────────────────────

function buildImageUrl(asin) {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`;
}

// ── Creators API (OAuth 2.0) ───────────────────────────────────────────────

async function fetchViaCreatorsApi(asin, credentialId, credentialSecret, credentialVersion, partnerTag) {
  console.log('   🔑 Tentando Creators API...');

  // Passo 1: obtém token OAuth 2.0
  const tokenEndpoint = credentialVersion && credentialVersion.startsWith('2')
    ? 'https://api.amazon.com/auth/o2/token'
    : 'https://api.amazon.com/auth/o2/token';

  const basicAuth = Buffer.from(`${credentialId}:${credentialSecret}`).toString('base64');
  const tokenBody = 'grant_type=client_credentials&scope=creatorsapi%2Fdefault';

  const token = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.amazon.com',
      path: '/auth/o2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Content-Length': Buffer.byteLength(tokenBody),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`Token ${res.statusCode}: ${data.slice(0, 200)}`));
        const json = JSON.parse(data);
        resolve(json.access_token);
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Token timeout')); });
    req.write(tokenBody);
    req.end();
  });

  // Passo 2: chama GetItems com Bearer token
  const payload = JSON.stringify({
    itemIds: [asin],
    partnerTag,
    partnerType: 'Associates',
    marketplace: 'www.amazon.com.br',
    resources: ['itemInfo.title', 'itemInfo.features', 'images.primary.large'],
  });

  const authHeader = credentialVersion && credentialVersion.startsWith('2')
    ? `Bearer ${token}, Version ${credentialVersion}`
    : `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'creatorsapi.amazon',
      path: '/catalog/v1/getItems',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-marketplace': 'www.amazon.com.br',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`Creators API ${res.statusCode}: ${data.slice(0, 200)}`));
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Creators API timeout')); });
    req.write(payload);
    req.end();
  });
}

// ── PA-API 5.0 (legado) ───────────────────────────────────────────────────

function signPaapi(accessKey, secretKey, partnerTag, asin) {
  const host = 'webservices.amazon.com.br';
  const region = 'us-east-1';
  const service = 'ProductAdvertisingAPI';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\\.\\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const payload = JSON.stringify({
    ItemIds: [asin], PartnerTag: partnerTag, PartnerType: 'Associates',
    Marketplace: 'www.amazon.com.br',
    Resources: ['ItemInfo.Title', 'ItemInfo.Features', 'Images.Primary.Large'],
  });
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  const canonicalHeaders =
    `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  const canonicalRequest = ['POST', '/paapi5/getitems', '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, crypto.createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), service), 'aws4_request');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    endpoint: `https://${host}/paapi5/getitems`,
    headers: {
      'content-encoding': 'amz-1.0', 'content-type': 'application/json; charset=utf-8',
      'host': host, 'x-amz-date': amzDate,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
      'Authorization': authorization,
    },
    payload,
  };
}

async function fetchViaPaapi(asin, accessKey, secretKey, partnerTag) {
  console.log('   🔑 Tentando PA-API 5.0...');
  const { endpoint, headers, payload } = signPaapi(accessKey, secretKey, partnerTag, asin);
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`PA-API ${res.statusCode}: ${data.slice(0, 200)}`));
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('PA-API timeout')); });
    req.write(payload); req.end();
  });
}

// ── Open Graph / scraping leve (funciona local, bloqueado no CI) ──────────

async function fetchTitleViaOG(asin) {
  console.log('   🌐 Tentando Open Graph / scraping...');
  try {
    const res = await get(`https://www.amazon.com.br/dp/${asin}`);
    const body = res.body;

    // Detecta bloqueio imediato (captcha / robot check)
    if (
      body.includes('api-services-support@amazon.com') ||
      body.includes('Type the characters') ||
      body.includes('robot') ||
      body.length < 5000
    ) {
      console.log('   ⚠️  Amazon bloqueou a requisição (captcha/robot) — esperado no CI');
      return null;
    }

    const patterns = [
      [/<meta[^>]+property="og:title"[^>]+content="([^"]{5,300})"/,  true],
      [/<meta[^>]+name="title"[^>]+content="([^"]{5,300})"/,         true],
      [/<title>([^<|]{5,200})/,                                        true],
      [/<span[^>]*id="productTitle"[^>]*>([\s\S]{1,400}?)<\/span>/,  false],
    ];
    for (const [re, stripBrand] of patterns) {
      const m = body.match(re);
      if (m) {
        let clean = m[1].trim().replace(/\s+/g, ' ');
        if (stripBrand) clean = clean.replace(/ [-:|].*Amazon.*$/i, '');
        if (clean.length > 10 && isTitleValid(clean)) {
          const specs = [];
          for (const m2 of body.matchAll(/<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([^<]{15,150})<\/span>/g)) {
            const txt = m2[1].trim().replace(/\s+/g, ' ');
            if (txt && specs.length < 5) specs.push(`- ${txt}`);
          }
          return { title: clean, specs };
        }
      }
    }
    for (const block of body.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]+?)<\/script>/g)) {
      try {
        const json = JSON.parse(block[1]);
        if (json.name && json.name.length > 10 && isTitleValid(json.name)) return { title: json.name, specs: [] };
      } catch (_) {}
    }
    return null;
  } catch (err) {
    console.log(`   ⚠️  OG fetch falhou: ${err.message}`);
    return null;
  }
}

// ── Export principal ───────────────────────────────────────────────────────

export async function fetchAmazon(inputUrl, { mapCategory, buildTags, cleanTitle, fallbackTitle } = {}) {
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

  const credentialId      = process.env.AMAZON_CREDENTIAL_ID;
  const credentialSecret  = process.env.AMAZON_CREDENTIAL_SECRET;
  const credentialVersion = process.env.AMAZON_CREDENTIAL_VERSION;
  const accessKey         = process.env.AMAZON_ACCESS_KEY;
  const secretKey         = process.env.AMAZON_SECRET_KEY;
  const partnerTag        = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;

  let title = '', specs = [];

  // 1. Creators API (OAuth 2.0)
  if (credentialId && credentialSecret && credentialId !== 'YOUR_CREDENTIAL_ID') {
    try {
      const data = await fetchViaCreatorsApi(asin, credentialId, credentialSecret, credentialVersion, partnerTag);
      const item = data?.itemsResult?.items?.[0] || data?.ItemsResult?.Items?.[0];
      if (item) {
        const raw = item.itemInfo?.title?.displayValue || item.ItemInfo?.Title?.DisplayValue || '';
        if (isTitleValid(raw)) {
          title = raw;
          specs = (item.itemInfo?.features?.displayValues || item.ItemInfo?.Features?.DisplayValues || []).slice(0, 5).map(f => `- ${f}`);
          console.log('   ✅ Creators API OK');
        }
      }
    } catch (err) { console.log(`   ⚠️  Creators API: ${err.message}`); }
  }

  // 2. PA-API 5.0
  if (!title && accessKey && secretKey && partnerTag && accessKey !== 'sua-access-key') {
    try {
      const data = await fetchViaPaapi(asin, accessKey, secretKey, partnerTag);
      const item = data?.ItemsResult?.Items?.[0];
      if (item) {
        const raw = item.ItemInfo?.Title?.DisplayValue || '';
        if (isTitleValid(raw)) {
          title = raw;
          specs = (item.ItemInfo?.Features?.DisplayValues || []).slice(0, 5).map(f => `- ${f}`);
          console.log('   ✅ PA-API OK');
        }
      }
    } catch (err) { console.log(`   ⚠️  PA-API: ${err.message}`); }
  }

  // 3. Open Graph / scraping leve
  if (!title) {
    const og = await fetchTitleViaOG(asin);
    if (og) { title = og.title; specs = og.specs; console.log('   ✅ Título via scraping'); }
  }

  // 4. Fallback gracioso — usa título do catálogo ou nome genérico
  //    ──► NUNCA falha: o agente continua e o post é criado normalmente.
  if (!title || !isTitleValid(title)) {
    if (fallbackTitle && fallbackTitle.length > 5) {
      title = fallbackTitle;
      console.log(`   ℹ️  Usando título do catálogo: "${title}"`);
    } else {
      title = `Produto Amazon (ASIN: ${asin})`;
      console.log(`   ℹ️  Usando título genérico por ASIN — configure Creators API para títulos reais`);
    }
    specs = [];
  }

  // Imagem por ASIN (sem API, 100% confiável)
  const imageUrl = buildImageUrl(asin);
  console.log('   🖼️  Imagem por ASIN:', imageUrl);

  // Link afiliado com tag
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
