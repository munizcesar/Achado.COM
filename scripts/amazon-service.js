/**
 * amazon-service.js
 * Busca dados de produto da Amazon BR via:
 *  1. PA-API 5.0 (oficial — se AMAZON_ACCESS_KEY estiver no .env)
 *  2. Scraping melhorado com headers realistas (fallback automático)
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
      'Accept-Encoding': 'gzip, deflate, br',
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

// ── PA-API 5.0 (método oficial) ────────────────────────────────────────────

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
  console.log('   🔑 Usando PA-API 5.0 (oficial)...');
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

// ── Scraping melhorado (fallback) ──────────────────────────────────────────

async function fetchViaScraping(inputUrl, asin) {
  console.log('   🔧 Fallback: scraping com headers realistas...');

  // Tenta a URL canônica com ASIN para evitar redirecionamentos
  const canonicalUrl = asin
    ? `https://www.amazon.com.br/dp/${asin}`
    : inputUrl;

  const res = await get(canonicalUrl);
  const body = res.body;

  // Título — múltiplos seletores em ordem de confiabilidade
  let title = '';

  const patterns = [
    /<span[^>]*id="productTitle"[^>]*>([\s\S]{1,400}?)<\/span>/,
    /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]{1,300}?)<\/h1>/,
    /<meta[^>]+name="title"[^>]+content="([^"]{5,300})"/,
    /<meta[^>]+property="og:title"[^>]+content="([^"]{5,300})"/,
    /<title>([^<|]{5,200})/,
  ];

  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      const candidate = m[1].trim().replace(/\s+/g, ' ').replace(/ - Amazon\.com\.br.*/i, '').replace(/ : Amazon\.com\.br.*/i, '');
      // Descarta títulos genéricos
      if (candidate.length > 10 && !/^amazon|^página|^error|^acesso negado/i.test(candidate)) {
        title = candidate;
        break;
      }
    }
  }

  if (!title) {
    // Última tentativa: JSON-LD
    const ldMatch = body.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]+?)<\/script>/g);
    if (ldMatch) {
      for (const block of ldMatch) {
        try {
          const json = JSON.parse(block.replace(/<script[^>]+>|<\/script>/g, ''));
          if (json.name && json.name.length > 10) { title = json.name; break; }
        } catch (_) {}
      }
    }
  }

  if (!title) throw new Error('Amazon bloqueou o scraping. Configure a PA-API no .env para contornar.');

  // Imagem
  const imgPatterns = [
    /data-old-hires="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/,
    /id="landingImage"[^>]+src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/,
    /"hiRes":"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/,
    /"large":"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/,
    /<meta[^>]+property="og:image"[^>]+content="(https:\/\/[^"]+)"/,
  ];
  let imageUrl = '';
  for (const p of imgPatterns) {
    const m = body.match(p);
    if (m) { imageUrl = m[1]; break; }
  }

  // Specs — bullet points do produto
  const specs = [];
  const bulletRe = /<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([^<]{15,150})<\/span>/g;
  for (const m of [...body.matchAll(bulletRe)]) {
    const txt = m[1].trim().replace(/\s+/g, ' ');
    if (txt && specs.length < 5) specs.push(`- ${txt}`);
  }

  return { title, imageUrl, specs };
}

// ── Export principal ───────────────────────────────────────────────────────

export async function fetchAmazon(inputUrl, { mapCategory, buildTags, cleanTitle } = {}) {
  console.log('📦  Amazon detectado...');

  const asin = extractAsin(inputUrl);
  if (!asin) throw new Error('Não consegui extrair o ASIN da URL Amazon. Use a URL completa do produto (ex: amazon.com.br/dp/XXXXXXXXXX).');
  console.log('   ASIN:', asin);

  const accessKey  = process.env.AMAZON_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;

  let title, imageUrl, specs = [];

  // Tenta PA-API primeiro se as chaves estiverem configuradas
  if (accessKey && secretKey && partnerTag &&
      accessKey !== 'sua-access-key' && secretKey !== 'sua-secret-key') {
    try {
      const data = await fetchViaPaapi(asin, accessKey, secretKey, partnerTag);
      const item = data?.ItemsResult?.Items?.[0];

      if (item) {
        title    = item.ItemInfo?.Title?.DisplayValue || '';
        imageUrl = item.Images?.Primary?.Large?.URL || '';
        specs    = (item.ItemInfo?.Features?.DisplayValues || [])
                     .slice(0, 5)
                     .map(f => `- ${f}`);
        console.log('   ✅ PA-API OK');
      }
    } catch (err) {
      console.log(`   ⚠️  PA-API falhou (${err.message}), tentando scraping...`);
    }
  }

  // Fallback: scraping melhorado
  if (!title) {
    const scraped = await fetchViaScraping(inputUrl, asin);
    title    = scraped.title;
    imageUrl = scraped.imageUrl;
    specs    = scraped.specs;
  }

  // Helpers podem ser injetados (para compatibilidade com novo-post.js)
  // ou usamos versões internas minimalistas
  const _clean = cleanTitle || (t => t.replace(/\s+/g, ' ').trim().slice(0, 150));
  const _mapCat = mapCategory || (() => 'casa');
  const _buildTags = buildTags || ((t, c) => [c]);

  const cleanedTitle = _clean(title);
  const category     = _mapCat(cleanedTitle);

  // URL afiliada: usa a URL original ou monta com tag
  const affiliateUrl = partnerTag && !inputUrl.includes('tag=')
    ? `https://www.amazon.com.br/dp/${asin}?tag=${partnerTag}`
    : inputUrl;

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
