/**
 * amazon-service.js
 * Busca dados de produto da Amazon BR via:
 *  1. Creators API (se AMAZON_CREDENTIAL_ID estiver no .env)
 *  2. PA-API 5.0  (se AMAZON_ACCESS_KEY estiver no .env)
 *  3. Título via Open Graph / meta tags (leve, menos bloqueio)
 *  4. Scraping HTML completo (fallback pesado)
 *
 * Imagem: sempre via URL direta por ASIN (100% confiável, sem API)
 * Link afiliado: montado com ASIN + tag (100% confiável, sem API)
 *
 * NÃO altere novo-post.js — importe fetchAmazon daqui:
 *   import { fetchAmazon } from './amazon-service.js';
 */

import https from 'https';
import http from 'http';
import crypto from 'crypto';

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

// ── Extrai ASIN da URL ─────────────────────────────────────────────────────

function extractAsin(url) {
  return (
    url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/[?&]asin=([A-Z0-9]{10})/)?.[1] ||
    null
  );
}

async function resolveFinalUrl(url) {
  if (!/amzn\.to/i.test(url)) return url;
  console.log('   🔄 Resolvendo redirecionamento Amazon short URL...');
  try {
    const res = await get(url);
    return res.url || url;
  } catch (err) {
    console.log(`   ⚠️  Falha ao resolver short URL: ${err.message}`);
    return url;
  }
}

// ── Imagem direta por ASIN (sem API, 100% confiável) ──────────────────────
// A Amazon expõe imagens nesse padrão público para todos os produtos listados.

function buildImageUrl(asin) {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`;
}

// ── Creators API (novo método oficial — substitui PA-API) ─────────────────

async function fetchViaCreatorsApi(asin, credentialId, credentialSecret, credentialVersion, partnerTag) {
  console.log('   🔑 Usando Creators API (oficial)...');

  const host = 'webservices.amazon.com.br';
  const path = '/paapi5/getitems';
  const endpoint = `https://${host}${path}`;

  const payload = JSON.stringify({
    ItemIds: [asin],
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com.br',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Images.Primary.Large',
      'Offers.Listings.Price',
    ],
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';

  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Date': amzDate,
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
        'X-Credential-Id': credentialId,
        'X-Credential-Secret': credentialSecret,
        'X-Credential-Version': credentialVersion,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Creators API status ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Creators API timeout')); });
    req.write(payload);
    req.end();
  });
}

// ── PA-API 5.0 (método legado ainda funcional) ─────────────────────────────

function signPaapi(accessKey, secretKey, partnerTag, asin) {
  const host = 'webservices.amazon.com.br';
  const region = 'us-east-1';
  const service = 'ProductAdvertisingAPI';
  const endpoint = `https://${host}/paapi5/getitems`;
  const now = new Date();

  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const payload = JSON.stringify({
    ItemIds: [asin],
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com.br',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Images.Primary.Large',
      'Offers.Listings.Price',
    ],
  });

  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    'POST',
    '/paapi5/getitems',
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  function hmac(key, data) {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), service),
    'aws4_request'
  );

  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    endpoint,
    headers: {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      'host': host,
      'x-amz-date': amzDate,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
      'Authorization': authorization,
    },
    payload,
  };
}

async function fetchViaPaapi(asin, accessKey, secretKey, partnerTag) {
  console.log('   🔑 Usando PA-API 5.0...');
  const { endpoint, headers, payload } = signPaapi(accessKey, secretKey, partnerTag, asin);

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`PA-API status ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('PA-API timeout')); });
    req.write(payload);
    req.end();
  });
}

// ── Título via Open Graph (leve, menos bloqueio que scraping completo) ─────

async function fetchTitleViaOG(asin) {
  console.log('   🌐 Buscando título via Open Graph...');
  try {
    const url = `https://www.amazon.com.br/dp/${asin}`;
    const res = await get(url);
    const body = res.body;

    // Open Graph (mais rápido e menos bloqueado que HTML completo)
    const ogTitle = body.match(/<meta[^>]+property="og:title"[^>]+content="([^"]{5,300})"/)?.[1];
    if (ogTitle) {
      const clean = ogTitle.trim()
        .replace(/\s+/g, ' ')
        .replace(/ - Amazon\.com\.br.*/i, '')
        .replace(/ : Amazon\.com\.br.*/i, '');
      if (clean.length > 10 && !/^amazon|^página|^error|^acesso negado/i.test(clean)) {
        return { title: clean, specs: [], source: 'og' };
      }
    }

    // Meta name="title"
    const metaTitle = body.match(/<meta[^>]+name="title"[^>]+content="([^"]{5,300})"/)?.[1];
    if (metaTitle) {
      const clean = metaTitle.trim().replace(/ - Amazon\.com\.br.*/i, '');
      if (clean.length > 10) return { title: clean, specs: [], source: 'meta' };
    }

    // <title> tag
    const titleTag = body.match(/<title>([^<|]{5,200})/)?.[1];
    if (titleTag) {
      const clean = titleTag.trim()
        .replace(/ - Amazon\.com\.br.*/i, '')
        .replace(/ : Amazon\.com\.br.*/i, '');
      if (clean.length > 10 && !/^amazon/i.test(clean)) {
        return { title: clean, specs: [], source: 'title-tag' };
      }
    }

    // productTitle span
    const productTitle = body.match(/<span[^>]*id="productTitle"[^>]*>([\s\S]{1,400}?)<\/span>/)?.[1];
    if (productTitle) {
      const clean = productTitle.trim().replace(/\s+/g, ' ');
      if (clean.length > 10) return { title: clean, specs: [], source: 'product-title' };
    }

    // JSON-LD
    const ldBlocks = [...(body.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]+?)<\/script>/g))];
    for (const block of ldBlocks) {
      try {
        const json = JSON.parse(block[1]);
        if (json.name && json.name.length > 10) {
          return { title: json.name, specs: [], source: 'json-ld' };
        }
      } catch (_) {}
    }

    // Bullet specs (aproveita o HTML já baixado)
    const specs = [];
    const bulletRe = /<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([^<]{15,150})<\/span>/g;
    for (const m of [...body.matchAll(bulletRe)]) {
      const txt = m[1].trim().replace(/\s+/g, ' ');
      if (txt && specs.length < 5) specs.push(`- ${txt}`);
    }

    return null; // Amazon bloqueou
  } catch (err) {
    console.log(`   ⚠️  OG fetch falhou: ${err.message}`);
    return null;
  }
}

// ── Export principal ───────────────────────────────────────────────────────

export async function fetchAmazon(inputUrl, { mapCategory, buildTags, cleanTitle } = {}) {
  console.log('📦  Amazon detectado...');

  const finalUrl = await resolveFinalUrl(inputUrl);
  if (finalUrl !== inputUrl) console.log('   URL final:', finalUrl);

  const asin = extractAsin(finalUrl) || extractAsin(inputUrl);
  if (!asin) throw new Error('Não consegui extrair o ASIN da URL Amazon. Use a URL completa do produto (ex: amazon.com.br/dp/XXXXXXXXXX).');
  console.log('   ASIN:', asin);

  const credentialId      = process.env.AMAZON_CREDENTIAL_ID;
  const credentialSecret  = process.env.AMAZON_CREDENTIAL_SECRET;
  const credentialVersion = process.env.AMAZON_CREDENTIAL_VERSION;
  const accessKey         = process.env.AMAZON_ACCESS_KEY;
  const secretKey         = process.env.AMAZON_SECRET_KEY;
  const partnerTag        = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;

  let title = '';
  let specs = [];

  // ── 1. Creators API (novo método oficial) ──────────────────────────────
  if (credentialId && credentialSecret && credentialVersion &&
      credentialId !== 'YOUR_CREDENTIAL_ID') {
    try {
      const data = await fetchViaCreatorsApi(asin, credentialId, credentialSecret, credentialVersion, partnerTag);
      const item = data?.ItemsResult?.Items?.[0];
      if (item) {
        title = item.ItemInfo?.Title?.DisplayValue || '';
        specs = (item.ItemInfo?.Features?.DisplayValues || []).slice(0, 5).map(f => `- ${f}`);
        console.log('   ✅ Creators API OK');
      }
    } catch (err) {
      console.log(`   ⚠️  Creators API falhou (${err.message}), tentando PA-API...`);
    }
  }

  // ── 2. PA-API 5.0 (legado) ─────────────────────────────────────────────
  if (!title && accessKey && secretKey && partnerTag &&
      accessKey !== 'sua-access-key') {
    try {
      const data = await fetchViaPaapi(asin, accessKey, secretKey, partnerTag);
      const item = data?.ItemsResult?.Items?.[0];
      if (item) {
        title = item.ItemInfo?.Title?.DisplayValue || '';
        specs = (item.ItemInfo?.Features?.DisplayValues || []).slice(0, 5).map(f => `- ${f}`);
        console.log('   ✅ PA-API OK');
      }
    } catch (err) {
      console.log(`   ⚠️  PA-API falhou (${err.message}), tentando OG...`);
    }
  }

  // ── 3. Open Graph / meta tags (leve, sem API) ──────────────────────────
  if (!title) {
    const og = await fetchTitleViaOG(asin);
    if (og) {
      title = og.title;
      specs = og.specs;
      console.log(`   ✅ Título via ${og.source}`);
    }
  }

  if (!title) {
    throw new Error(
      'Não foi possível obter o título do produto. ' +
      'Configure AMAZON_CREDENTIAL_ID no .env para garantir acesso via Creators API.'
    );
  }

  // ── Imagem: URL direta por ASIN (sem API, 100% confiável) ─────────────
  const imageUrl = buildImageUrl(asin);
  console.log('   🖼️  Imagem por ASIN:', imageUrl);

  // ── Link afiliado: montado com ASIN + tag ─────────────────────────────
  const affiliateUrl = partnerTag
    ? `https://www.amazon.com.br/dp/${asin}?tag=${partnerTag}`
    : inputUrl;

  // ── Helpers injetados ou internos ────────────────────────────────────
  const _clean    = cleanTitle  || (t => t.replace(/\s+/g, ' ').trim().slice(0, 150));
  const _mapCat   = mapCategory || (() => 'casa');
  const _buildTags = buildTags  || ((t, c) => [c]);

  const cleanedTitle = _clean(title);
  const category     = _mapCat(cleanedTitle);

  return {
    title:       cleanedTitle,
    description: `${cleanedTitle} disponível na Amazon com entrega Prime para todo o Brasil.`,
    category,
    tags:        _buildTags(cleanedTitle, category),
    imageUrl,
    specs,
    store:       'Amazon',
    affiliateUrl,
  };
}
