/**
 * amazon-service-puppeteer.js — v2 (com Puppeteer para scraping confiável)
 * 
 * Resolve problemas do scraper HTTP puro:
 * - Evita bloqueios com stealth plugin
 * - Carrega JavaScript dinâmico
 * - Consegue extrair imagens reais
 * - Sem 404s artificiais
 */

import puppeteer from 'puppeteer';

// ── Padrões de título inválido ────────────────────────────────────────────
const ERROR_TITLE_PATTERNS = [
  /não foi possível encontrar/i,
  /página não encontrada/i,
  /page not found/i,
  /robot check/i,
  /captcha/i,
  /acesso negado/i,
  /^amazon\.com/i,
  /^amazon\.com\.br\s*[-|]/i,
  /amazon prime/i,
  /teste grátis/i,
];

function isTitleValid(title) {
  if (!title || title.trim().length < 8) return false;
  return !ERROR_TITLE_PATTERNS.some(re => re.test(title.trim()));
}

function extractAsin(url) {
  return (
    url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/)?.[1] ||
    null
  );
}

function buildAffiliateUrl(asin, partnerTag) {
  const baseUrl = `https://www.amazon.com.br/dp/${asin}?tag=${partnerTag}`;
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'achadocertovip');
  url.searchParams.set('utm_medium', 'blog');
  url.searchParams.set('utm_campaign', 'posts-ia');
  return url.toString();
}

async function fetchAmazonWithPuppeteer(asin, partnerTag) {
  console.log(`   🔍 Puppeteer — carregando página Amazon com JavaScript...`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    const url = `https://www.amazon.com.br/dp/${asin}`;
    console.log(`   → GET ${url}`);
    
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (!response || ![200, 304].includes(response.status())) {
      console.log(`   ⚠️  Status ${response?.status()}`);
      await browser.close();
      return null;
    }

    // Extrai dados do DOM completo
    const data = await page.evaluate(() => {
      const titleEl = document.querySelector('h1 span') || document.querySelector('[data-feature-name="title"]');
      const title = titleEl?.textContent?.trim() || '';
      
      // Tenta múltiplas estratégias de imagem
      const imgSrc = 
        document.querySelector('img.a-dynamic-image')?._nativeElement?.src ||
        document.querySelector('[data-old-hires]')?.src ||
        document.querySelector('img[alt*="Amazon"]')?.src ||
        document.querySelector('.imageThumbnail img')?.src ||
        '';
      
      // Specs da tabela de características
      const specs = [];
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td && specs.length < 6) {
          specs.push(`- **${th.textContent.trim()}:** ${td.textContent.trim()}`);
        }
      });

      return { title, imageUrl: imgSrc, specs };
    });

    await browser.close();

    if (!isTitleValid(data.title)) {
      console.log(`   ⚠️  Título inválido: ${data.title.slice(0, 60)}`);
      return null;
    }

    console.log(`   ✅ Título: ${data.title.slice(0, 80)}`);
    console.log(`   ✅ Imagem: ${data.imageUrl ? '✓' : '✗'}`);
    
    return {
      title: data.title.slice(0, 150),
      description: `${data.title.slice(0, 100)} disponível na Amazon com entrega Prime para todo o Brasil.`,
      imageUrl: data.imageUrl || '',
      specs: data.specs,
      affiliateUrl: buildAffiliateUrl(asin, partnerTag),
    };

  } catch (err) {
    console.log(`   ⚠️  Puppeteer falhou: ${err.message}`);
    if (browser) await browser.close();
    return null;
  }
}

export async function fetchAmazon(inputUrl, { mapCategory, buildTags, cleanTitle, productName } = {}) {
  const asin = extractAsin(inputUrl);
  if (!asin) throw new Error('ASIN não encontrado na URL');

  console.log('📦  Amazon detectado...');
  console.log(`   ASIN: ${asin}`);

  const partnerTag = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG || 'altivita-20';
  
  const result = await fetchAmazonWithPuppeteer(asin, partnerTag);
  
  if (!result) {
    throw new Error('Não foi possível extrair dados do produto Amazon');
  }

  const _mapCat = mapCategory || (() => 'casa');
  const _buildTags = buildTags || ((t, c) => [c]);

  const category = _mapCat(result.title);
  return {
    title: result.title,
    description: result.description,
    category,
    tags: _buildTags(result.title, category),
    imageUrl: result.imageUrl,
    specs: result.specs,
    store: 'Amazon',
    affiliateUrl: result.affiliateUrl,
  };
}
