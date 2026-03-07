#!/usr/bin/env node
/**
 * AchadoCertoVIP — Gerador automático de posts
 *
 * USO (1 comando, só isso):
 *   npm run post "https://url-afiliado"
 *
 * Faz tudo:
 *  1. Detecta a plataforma (ML ou Amazon)
 *  2. Busca nome, imagem e specs via API
 *  3. Baixa a foto do produto
 *  4. Gera o .md completo
 *  5. Faz git add + commit + push automaticamente
 */

const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const { execSync } = require('child_process');

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60);
}

function get(urlStr, redirectCount = 0) {
  if (redirectCount > 6) throw new Error('Muitos redirecionamentos');
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json,text/html,*/*',
      }
    }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return resolve(get(res.headers.location, redirectCount + 1));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadImage(imgUrl, destPath, redirectCount = 0) {
  if (redirectCount > 6) throw new Error('Muitos redirecionamentos na imagem');
  return new Promise((resolve, reject) => {
    const lib = imgUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = lib.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        file.close(); fs.unlinkSync(destPath);
        return resolve(downloadImage(res.headers.location, destPath, redirectCount + 1));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', err => { try { fs.unlinkSync(destPath); } catch(_){} reject(err); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout imagem')); });
  });
}

function detectPlatform(u) {
  if (/mercadolivre|mercadolibre|mlb/i.test(u)) return 'ml';
  if (/amazon|amzn/i.test(u)) return 'amazon';
  return 'unknown';
}

function mapCategory(name) {
  const n = (name || '').toLowerCase();
  if (/celular|smartphone|tablet|notebook|tv|fone|áudio|audio|camera|câmera|monitor|pc|computador/.test(n)) return 'Tech';
  if (/saúde|saude|suplemento|vitamina|proteína|proteina|creatina|colagem|colágen/.test(n)) return 'Saude';
  if (/casa|cozinha|lar|móvel|movel|decora/.test(n)) return 'Casa';
  if (/esporte|fitness|academia|legging|tênis|tenis|corrida/.test(n)) return 'Esportes';
  if (/beleza|cosm|perfume|cabelo|pele|maquiagem/.test(n)) return 'Beleza';
  return 'Tech';
}

// ── Mercado Livre ────────────────────────────────────────────────────────

async function fetchML(inputUrl) {
  console.log('\n🛒  Mercado Livre detectado...');

  // Resolve redirects e extrai o ID MLB
  const res = await get(inputUrl);
  const fullText = (res.headers.location || '') + res.body + inputUrl;
  const match = fullText.match(/MLB-?(\d{6,12})/i);
  if (!match) throw new Error('Não encontrei o ID do produto. Use a URL completa da página do produto.');
  const itemId = 'MLB' + match[1];
  console.log('📦  ID:', itemId);

  const api = await get(`https://api.mercadolibre.com/items/${itemId}`);
  if (api.status !== 200) throw new Error(`API retornou ${api.status}`);
  const item = JSON.parse(api.body);

  // Melhor imagem (alta resolução)
  const pics = item.pictures || [];
  const imageUrl = pics.length
    ? (pics[0].url || pics[0].secure_url || '').replace(/-[A-Z]\.jpg$/, '-D.jpg')
    : '';

  // Specs formatados
  const specs = (item.attributes || [])
    .filter(a => a.value_name && !['Linha', 'Cor', 'Modelo'].includes(a.name))
    .slice(0, 6)
    .map(a => `- **${a.name}:** ${a.value_name}`);

  // Categoria ML
  let categoryName = 'Tech';
  try {
    const catRes = await get(`https://api.mercadolibre.com/categories/${item.category_id}`);
    if (catRes.status === 200) categoryName = JSON.parse(catRes.body).name;
  } catch(_) {}

  return {
    title: item.title,
    description: `Conheça o ${item.title}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
    category: mapCategory(categoryName),
    imageUrl,
    specs,
    store: 'Mercado Livre',
    affiliateUrl: inputUrl,
  };
}

// ── Amazon ───────────────────────────────────────────────────────────────────

async function fetchAmazon(inputUrl) {
  console.log('\n📦  Amazon detectado...');
  const res = await get(inputUrl);
  const body = res.body;

  const titleM = body.match(/<span[^>]*id="productTitle"[^>]*>([\s\S]{1,300}?)<\/span>/);
  const title = titleM ? titleM[1].trim().replace(/\s+/g,' ') : 'Produto Amazon';

  const imgM = body.match(/"hiRes":"(https:\/\/[^"]+\.jpg)"/) ||
               body.match(/"large":"(https:\/\/[^"]+\.jpg)"/) ||
               body.match(/id="landingImage"[^>]+src="([^"]+)"/);
  const imageUrl = imgM ? imgM[1] : '';

  return {
    title,
    description: `${title} disponível na Amazon com entrega Prime para todo o Brasil.`,
    category: mapCategory(title),
    imageUrl,
    specs: [],
    store: 'Amazon',
    affiliateUrl: inputUrl,
  };
}

// ── Gera markdown ──────────────────────────────────────────────────────────

function generateMarkdown({ title, description, category, imageFile, specs, store, affiliateUrl }) {
  const today = new Date().toISOString().split('T')[0];
  const cat = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
  const storeEmoji = { 'Mercado Livre': '🛒', 'Amazon': '📦', 'Magalu': '🏪' }[store] || '🛍️';

  const specsBlock = specs.length
    ? `\n## Especificações Principais\n\n${specs.join('\n')}\n`
    : '';

  return `---
title: "${title.replace(/"/g,"'")}"
description: "${description.replace(/"/g,"'").slice(0,155)}"
date: ${today}
category: ${category}
image: /images/posts/${imageFile}
tags: [${cat}]
draft: false
affiliateUrl: "${affiliateUrl}"
productImage: /images/posts/${imageFile}
---

${title} é um produto disponível no ${store} com entrega rápida para todo o Brasil.
Confira abaixo as principais informações e acesse a página do produto na loja.
${specsBlock}
## Vale a Pena?

${title.split(' ').slice(0,4).join(' ')} é bem avaliado pelos compradores e se destaca pelo custo-benefício.
Para ver a disponibilidade, fotos detalhadas e avaliações de quem já comprou, acesse a página oficial:

${storeEmoji} Acesse o produto na loja ${store} pelo botão abaixo.

---

*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const inputUrl = process.argv[2];

  if (!inputUrl) {
    console.log('\n✨  AchadoCertoVIP — Gerador de Posts\n');
    console.log('Uso: npm run post "<url-afiliado>"\n');
    console.log('Exemplos:');
    console.log('  npm run post "https://www.mercadolivre.com.br/..."');
    console.log('  npm run post "https://amzn.to/xyz"\n');
    process.exit(0);
  }

  const platform = detectPlatform(inputUrl);
  if (platform === 'unknown') {
    console.error('\n❌ Plataforma não reconhecida.');
    console.error('Use links do Mercado Livre (mercadolivre.com.br) ou Amazon (amzn.to / amazon.com.br)\n');
    process.exit(1);
  }

  // 1. Busca dados do produto
  let product;
  try {
    product = platform === 'ml' ? await fetchML(inputUrl) : await fetchAmazon(inputUrl);
  } catch (err) {
    console.error('\n❌ Erro ao buscar produto:', err.message, '\n');
    process.exit(1);
  }

  const slug = slugify(product.title);
  console.log('\n📝 Título  :', product.title);
  console.log('📂 Categoria:', product.category);
  console.log('🔗 Slug    :', slug);

  // 2. Baixa imagem
  const imgDir  = path.join(process.cwd(), 'public', 'images', 'posts');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  let imageFile = `${slug}.jpg`;
  const imgPath = path.join(imgDir, imageFile);

  if (product.imageUrl) {
    try {
      process.stdout.write('🖼️  Baixando imagem... ');
      await downloadImage(product.imageUrl, imgPath);
      console.log('✅');
    } catch (err) {
      console.warn('\u26a0️ não foi possível baixar:', err.message);
      imageFile = 'placeholder.jpg';
    }
  } else {
    console.warn('⚠️  Nenhuma imagem encontrada.');
    imageFile = 'placeholder.jpg';
  }

  // 3. Gera o .md
  const md     = generateMarkdown({ ...product, slug, imageFile });
  const mdDir  = path.join(process.cwd(), 'src', 'content', 'blog');
  const mdPath = path.join(mdDir, `${slug}.md`);

  if (fs.existsSync(mdPath)) {
    const bak = mdPath.replace('.md', `-bak-${Date.now()}.md`);
    fs.renameSync(mdPath, bak);
    console.log('⚠️  Post já existia, renomeado para backup.');
  }

  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('📎  Post gerado :', mdPath);

  // 4. Git: add + commit + push
  console.log('\n🚀  Publicando no GitHub...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "post: ${slug}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('\n✅ PRONTO! Post publicado com sucesso.');
    console.log(`🌍 Vai ao ar em: https://achadocerto.vip/blog/${slug}\n`);
  } catch (err) {
    console.warn('\n⚠️ Git push falhou (talvez não tenha internet ou repositório não configurado).');
    console.log('Faça manualmente: git add . && git commit -m "post: ' + slug + '" && git push\n');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
