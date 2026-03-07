#!/usr/bin/env node
/**
 * AchadoCertoVIP — Gerador de Posts
 * Uso: node scripts/novo-post.js "<url-afiliado>" [categoria]
 *
 * Suporte: Mercado Livre, Amazon (amzn.to ou amazon.com.br)
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

// ─── Utilitários ─────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function get(urlStr) {
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AchadoCertoBot/1.0)',
        'Accept': 'application/json, text/html',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadImage(imageUrl, destPath) {
  return new Promise((resolve, reject) => {
    const lib = imageUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = lib.get(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return resolve(downloadImage(res.headers.location, destPath));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    });
    req.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function detectPlatform(inputUrl) {
  if (inputUrl.includes('mercadolivre') || inputUrl.includes('mercadolibre') || inputUrl.includes('mlb')) return 'ml';
  if (inputUrl.includes('amazon') || inputUrl.includes('amzn')) return 'amazon';
  return 'unknown';
}

// ─── Mercado Livre ────────────────────────────────────────────────────────────

async function resolveMLId(inputUrl) {
  // Resolve redirects (links curtos ml.shoplink etc)
  const res = await get(inputUrl);
  const finalUrl = res.headers['location'] || inputUrl;
  // Extrai o ID do produto: MLB123456789
  const match = (finalUrl + res.body).match(/MLB[\-]?(\d+)/i);
  if (!match) throw new Error('Não consegui extrair o ID do Mercado Livre. Tente usar a URL completa do produto.');
  return 'MLB' + match[1].replace('-','');
}

async function fetchML(inputUrl) {
  console.log('🔍 Detectado: Mercado Livre');
  const itemId = await resolveMLId(inputUrl);
  console.log('📦 Item ID:', itemId);

  const res = await get(`https://api.mercadolibre.com/items/${itemId}`);
  if (res.status !== 200) throw new Error(`API ML retornou ${res.status}`);
  const item = JSON.parse(res.body);

  // Categoria
  const catRes = await get(`https://api.mercadolibre.com/categories/${item.category_id}`);
  const catName = catRes.status === 200 ? JSON.parse(catRes.body).name : 'Geral';

  // Melhor imagem disponível
  const images = item.pictures || [];
  const bestImage = images.length > 0
    ? (images[0].url || images[0].secure_url || '').replace('-O.jpg','-D.jpg')
    : '';

  // Atributos relevantes para specs
  const specs = (item.attributes || [])
    .filter(a => a.value_name && a.name)
    .slice(0, 8)
    .map(a => `- **${a.name}:** ${a.value_name}`);

  return {
    title: item.title,
    description: `Conheça o ${item.title}. Produto disponível no Mercado Livre com entrega rápida.`,
    category: mapCategory(catName),
    imageUrl: bestImage,
    specs,
    store: 'Mercado Livre',
    affiliateUrl: inputUrl,
  };
}

// ─── Amazon ───────────────────────────────────────────────────────────────────

async function fetchAmazon(inputUrl) {
  console.log('🔍 Detectado: Amazon');
  // Resolve link curto amzn.to → URL real
  let finalUrl = inputUrl;
  if (inputUrl.includes('amzn.to') || inputUrl.includes('amzn.com')) {
    const res = await get(inputUrl);
    finalUrl = res.headers['location'] || inputUrl;
  }
  console.log('🌐 URL final:', finalUrl.slice(0, 80) + '...');

  // Scraping básico da página de produto
  const res = await get(finalUrl);
  const body = res.body;

  // Título
  const titleMatch = body.match(/<span id="productTitle"[^>]*>([^<]+)<\/span>/);
  const title = titleMatch ? titleMatch[1].trim() : 'Produto Amazon';

  // Imagem principal
  const imgMatch = body.match(/"hiRes":"(https:\/\/[^"]+\.jpg)"/) ||
                   body.match(/"large":"(https:\/\/[^"]+\.jpg)"/) ||
                   body.match(/id="landingImage"[^>]+src="([^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : '';

  // Descrição dos bullet points
  const bulletsMatch = body.match(/<div id="feature-bullets"[\s\S]{0,3000}?<\/div>/);
  const description = bulletsMatch
    ? bulletsMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
    : `Conheça o ${title}. Disponível na Amazon com entrega Prime.`;

  return {
    title,
    description,
    category: 'Tech',
    imageUrl,
    specs: [],
    store: 'Amazon',
    affiliateUrl: inputUrl,
  };
}

// ─── Mapeamento de categoria ──────────────────────────────────────────────────

function mapCategory(mlCat) {
  const c = mlCat.toLowerCase();
  if (c.includes('celular') || c.includes('smartphone') || c.includes('tablet') ||
      c.includes('notebook') || c.includes('computador') || c.includes('tv') ||
      c.includes('fone') || c.includes('áudio') || c.includes('câmera')) return 'Tech';
  if (c.includes('saúde') || c.includes('suplemento') || c.includes('vitamina') ||
      c.includes('beleza') || c.includes('perfume') || c.includes('cabelo')) return 'Saúde';
  if (c.includes('casa') || c.includes('cozinha') || c.includes('lar') ||
      c.includes('móveis') || c.includes('decoração')) return 'Casa';
  if (c.includes('esporte') || c.includes('fitness') || c.includes('academia')) return 'Esportes';
  if (c.includes('beleza') || c.includes('cosméticos')) return 'Beleza';
  return 'Geral';
}

// ─── Gerador de Markdown ──────────────────────────────────────────────────────

function generateMarkdown({ title, description, category, slug, imageFile, specs, store, affiliateUrl }) {
  const today = new Date().toISOString().split('T')[0];
  const categorySlug = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
  const specsSection = specs.length > 0
    ? `\n## Especificações\n\n${specs.join('\n')}\n`
    : '';

  return `---
title: "${title.replace(/"/g, "'")}"
description: "${description.replace(/"/g, "'").slice(0, 155)}"
date: ${today}
category: ${category}
image: /images/posts/${imageFile}
tags: [${categorySlug}]
draft: false
affiliateUrl: "${affiliateUrl}"
productImage: /images/posts/${imageFile}
---

${title} é um produto disponível na loja ${store} com entrega rápida para todo o Brasil.
Abaixo você encontra todas as informações e o link direto para a página do produto.
${specsSection}
## Onde Comprar

<ProductBox
  name="${title.replace(/"/g, "'")}"
  image="/images/posts/${imageFile}"
  store="${store}"
  url="${affiliateUrl}"
/>

## Vale a Pena?

${title} é uma ótima opção para quem busca qualidade e bom custo-benefício.
Clique no botão acima para ver a disponibilidade e detalhes completos na loja ${store}.

---

*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site.*
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const inputUrl = process.argv[2];
  const forceCategory = process.argv[3];

  if (!inputUrl) {
    console.error('\n❌ Uso: node scripts/novo-post.js "<url-afiliado>" [categoria]\n');
    console.error('Exemplos:');
    console.error('  node scripts/novo-post.js "https://www.mercadolivre.com.br/..."');
    console.error('  node scripts/novo-post.js "https://amzn.to/xyz" Tech\n');
    process.exit(1);
  }

  const platform = detectPlatform(inputUrl);

  let product;
  try {
    if (platform === 'ml')     product = await fetchML(inputUrl);
    else if (platform === 'amazon') product = await fetchAmazon(inputUrl);
    else throw new Error('Plataforma não reconhecida. Use links do Mercado Livre ou Amazon.');
  } catch (err) {
    console.error('\n❌ Erro ao buscar produto:', err.message);
    process.exit(1);
  }

  if (forceCategory) product.category = forceCategory;

  const slug = slugify(product.title);
  console.log('\n📝 Título:', product.title);
  console.log('📂 Categoria:', product.category);
  console.log('🔗 Slug:', slug);

  // Baixa a imagem
  const imgDir = path.join(process.cwd(), 'public', 'images', 'posts');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  let imageFile = `${slug}.jpg`;
  if (product.imageUrl) {
    const imgPath = path.join(imgDir, imageFile);
    try {
      console.log('🖼️  Baixando imagem...');
      await downloadImage(product.imageUrl, imgPath);
      console.log('✅ Imagem salva:', imgPath);
    } catch (err) {
      console.warn('⚠️  Não foi possível baixar a imagem:', err.message);
      imageFile = 'placeholder.jpg';
    }
  } else {
    console.warn('⚠️  Nenhuma imagem encontrada, usando placeholder.');
    imageFile = 'placeholder.jpg';
  }

  // Gera o arquivo markdown
  const md = generateMarkdown({ ...product, slug, imageFile });
  const mdDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const mdPath = path.join(mdDir, `${slug}.md`);

  if (fs.existsSync(mdPath)) {
    console.warn(`\n⚠️  Arquivo já existe: ${mdPath}`);
    console.warn('Renomeando para evitar sobrescrita...');
    fs.renameSync(mdPath, mdPath.replace('.md', `-backup-${Date.now()}.md`));
  }

  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('\n✅ Post gerado:', mdPath);
  console.log('\n👉 Próximos passos:');
  console.log('   1. Revise o arquivo gerado e adicione mais conteúdo se quiser');
  console.log('   2. git add . && git commit -m "post: ' + slug + '" && git push');
  console.log('   3. O deploy acontece automaticamente!\n');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
