#!/usr/bin/env node
/**
 * AchadoCertoVIP — Gerador automático de posts
 *
 * USO (1 comando, só isso):
 *   npm run post "https://url-afiliado"
 *
 * Plataformas suportadas:
 *   ✅ Mercado Livre  (via API oficial)
 *   ✅ Amazon         (via scraping)
 *   ✅ Magalu         (via scraping)
 *
 * Faz tudo:
 *  1. Detecta a plataforma automaticamente
 *  2. Busca nome, imagem e specs
 *  3. Baixa a foto do produto
 *  4. Gera o .md completo
 *  5. Faz git add + commit + push
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
  if (redirectCount > 8) throw new Error('Muitos redirecionamentos');
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
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
    req.setTimeout(14000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadImage(imgUrl, destPath, redirectCount = 0) {
  if (redirectCount > 8) throw new Error('Muitos redirecionamentos na imagem');
  return new Promise((resolve, reject) => {
    const lib = imgUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = lib.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        file.close(); try { fs.unlinkSync(destPath); } catch(_) {}
        return resolve(downloadImage(res.headers.location, destPath, redirectCount + 1));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', err => { try { fs.unlinkSync(destPath); } catch(_){} reject(err); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout imagem')); });
  });
}

// ── Detecta plataforma ───────────────────────────────────────────────────

function detectPlatform(u) {
  if (/mercadolivre|mercadolibre|mercado livre|mlb|meli\.la/i.test(u)) return 'ml';
  if (/amazon\.com\.br|amzn\.to|amzn\.com/i.test(u))          return 'amazon';
  if (/magazineluiza|magalu|maga\.lu/i.test(u))                return 'magalu';
  return 'unknown';
}

// ── Mapeamento de categoria ──────────────────────────────────────────

function mapCategory(name) {
  const n = (name || '').toLowerCase();
  if (/celular|smartphone|tablet|notebook|tv |tela|fone|audio|áudio|camera|câmera|monitor|pc |computador|headphone|earphone|smartwatch|relogio|relógio/.test(n)) return 'Tech';
  if (/saúde|saude|suplemento|vitamina|proteína|proteina|creatina|colágen|colagen|whey|cápsulas|medicamento/.test(n)) return 'Saude';
  if (/casa|cozinha|lar|móvel|movel|decora|panela|liquidificador|ventilador|aspirador|geladeira|fogão|fogao/.test(n)) return 'Casa';
  if (/esporte|fitness|academia|legging|tênis|tenis|corrida|bicicleta|esteira|muscula/.test(n)) return 'Esportes';
  if (/beleza|cosm|perfume|cabelo|pele|maquiagem|batom|hidratante|serum|sérum/.test(n)) return 'Beleza';
  return 'Tech';
}

// ── Mercado Livre Scraping (fallback) ────────────────────────────────

async function fetchMLScraping(inputUrl, itemId) {
  console.log('   🔧 Usando scraping direto da página...');
  const res = await get(inputUrl);
  const body = res.body;

  // Título - múltiplas estratégias
  let title = 'Produto Mercado Livre';
  
  // Tenta JSON-LD primeiro
  const jsonLdMatch = body.match(/<script type="application\/ld\+json">({[^<]+product[^<]+})<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.name) title = data.name;
    } catch(e) {}
  }
  
  // Tenta Open Graph
  if (title === 'Produto Mercado Livre') {
    const ogMatch = body.match(/<meta[^>]+property="og:title"[^>]+content="([^"]{5,200})"/);
    if (ogMatch) title = ogMatch[1].trim().replace(/ \| Mercado Livre$/i, '');
  }
  
  // Tenta title tag
  if (title === 'Produto Mercado Livre') {
    const titleMatch = body.match(/<title>([^<|]{5,200})/);
    if (titleMatch) title = titleMatch[1].trim().replace(/ \| Mercado Livre$/i, '');
  }
  
  // Tenta H1
  if (title === 'Produto Mercado Livre') {
    const h1Match = body.match(/<h1[^>]*>([^<]{5,200})<\/h1>/);
    if (h1Match) title = h1Match[1].trim();
  }

  // Imagem - múltiplas estratégias
  let imageUrl = '';
  const imgMatch = 
    body.match(/"image":"(https:\/\/http2\.mlstatic\.com[^"]+\.(?:jpg|webp))"/) ||
    body.match(/"secure_url":"(https:\/\/http2\.mlstatic\.com[^"]+\.(?:jpg|webp))"/) ||
    body.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
    body.match(/"url":"(https:\/\/http2\.mlstatic\.com[^"]+\.(?:jpg|webp))"/);
  
  if (imgMatch) {
    imageUrl = imgMatch[1]
      .replace(/-[A-Z]\.(?:jpg|webp)$/, '-F.jpg')
      .replace(/\.webp$/, '.jpg');
  }

  // Specs básicos
  const specs = [];
  const attrsMatches = body.matchAll(/<dt[^>]*>([^<]{2,50})<\/dt>\s*<dd[^>]*>([^<]{1,80})<\/dd>/g);
  for (const m of attrsMatches) {
    if (specs.length < 6 && !['Linha','Cor','Modelo','Marca'].includes(m[1].trim())) {
      specs.push(`- **${m[1].trim()}:** ${m[2].trim()}`);
    }
  }

  return {
    title: title.replace(/\s+/g, ' ').slice(0, 150),
    description: `Conheça o ${title}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
    category: mapCategory(title),
    imageUrl, specs,
    store: 'Mercado Livre',
    affiliateUrl: inputUrl,
  };
}

// ── Mercado Livre (API oficial) ───────────────────────────────────────

async function fetchML(inputUrl) {
  console.log('🛒  Mercado Livre detectado...');
  const res = await get(inputUrl);
  const fullText = (res.headers.location || '') + res.body + inputUrl;
  const match = fullText.match(/MLB-?(\d{6,12})/i);
  if (!match) throw new Error('Não encontrei o ID. Use a URL completa da página do produto.');
  const itemId = 'MLB' + match[1];
  console.log('   ID:', itemId);

  const api = await get(`https://api.mercadolibre.com/items/${itemId}`);
  if (api.status !== 200) {
    console.log(`   ⚠️  API retornou ${api.status}, tentando scraping direto...`);
    // Fallback: scraping da página
    return await fetchMLScraping(inputUrl, itemId);
  }
  const item = JSON.parse(api.body);

  const pics = item.pictures || [];
  const imageUrl = pics.length
    ? (pics[0].url || pics[0].secure_url || '').replace(/-[A-Z]\.jpg$/, '-F.jpg')
    : '';

  const specs = (item.attributes || [])
    .filter(a => a.value_name && !['Linha','Cor','Modelo','Marca'].includes(a.name))
    .slice(0, 6)
    .map(a => `- **${a.name}:** ${a.value_name}`);

  let categoryName = item.title;
  try {
    const c = await get(`https://api.mercadolibre.com/categories/${item.category_id}`);
    if (c.status === 200) categoryName = JSON.parse(c.body).name;
  } catch(_) {}

  return {
    title: item.title,
    description: `Conheça o ${item.title}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
    category: mapCategory(categoryName),
    imageUrl, specs,
    store: 'Mercado Livre',
    affiliateUrl: inputUrl,
  };
}

// ── Amazon (scraping) ───────────────────────────────────────────────

async function fetchAmazon(inputUrl) {
  console.log('📦  Amazon detectado...');
  const res = await get(inputUrl);
  const body = res.body;

  const titleM = body.match(/<span[^>]*id="productTitle"[^>]*>([\s\S]{1,300}?)<\/span>/);
  const title  = titleM ? titleM[1].trim().replace(/\s+/g,' ') : 'Produto Amazon';

  // Tenta vários padrões de imagem
  const imgM =
    body.match(/"hiRes":"(https:\/\/[^"]+\.jpg)"/) ||
    body.match(/"large":"(https:\/\/[^"]+\.jpg)"/) ||
    body.match(/id="landingImage"[^>]+src="([^"]+)"/) ||
    body.match(/data-old-hires="(https:\/\/[^"]+\.jpg)"/);
  const imageUrl = imgM ? imgM[1] : '';

  // Specs dos bullet points
  const specs = [];
  const bullets = body.matchAll(/<span class="a-list-item">([^<]{10,120})<\/span>/g);
  for (const m of bullets) {
    const txt = m[1].trim().replace(/\s+/g,' ');
    if (txt && specs.length < 5) specs.push(`- ${txt}`);
  }

  return {
    title,
    description: `${title} disponível na Amazon com entrega Prime para todo o Brasil.`,
    category: mapCategory(title),
    imageUrl, specs,
    store: 'Amazon',
    affiliateUrl: inputUrl,
  };
}

// ── Magalu (scraping) ───────────────────────────────────────────────

async function fetchMagalu(inputUrl) {
  console.log('🏪  Magalu detectado...');
  const res  = await get(inputUrl);
  const body = res.body;

  // Título — vários padrões possíveis
  const titleM =
    body.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]{5,200})<\/h1>/) ||
    body.match(/<h1[^>]*>([^<]{5,200})<\/h1>/) ||
    body.match(/"name":"([^"]{5,200})"/) ||
    body.match(/<title>([^<|]{5,120})/);
  const title = titleM
    ? titleM[1].trim().replace(/\s+/g,' ').replace(/ - Magazine Luiza.*/i,'').replace(/ \| Magalu.*/i,'')
    : 'Produto Magalu';

  // Imagem — tenta JSON-LD e meta tags
  const imgM =
    body.match(/"image":\s*"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/) ||
    body.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
    body.match(/src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/);
  const imageUrl = imgM ? imgM[1] : '';

  // Specs da tabela de características
  const specs = [];
  const rows  = body.matchAll(/<tr[^>]*>[\s\S]*?<th[^>]*>([^<]{3,60})<\/th>[\s\S]*?<td[^>]*>([^<]{1,100})<\/td>[\s\S]*?<\/tr>/g);
  for (const m of rows) {
    if (specs.length < 6) specs.push(`- **${m[1].trim()}:** ${m[2].trim()}`);
  }

  // Descrição via meta
  const descM = body.match(/<meta[^>]+name="description"[^>]+content="([^"]{10,200})"/);
  const description = descM
    ? descM[1].trim()
    : `Conheça o ${title}. Disponível no Magalu com entrega rápida.`;

  return {
    title,
    description,
    category: mapCategory(title),
    imageUrl, specs,
    store: 'Magalu',
    affiliateUrl: inputUrl,
  };
}

// ── Gera markdown ─────────────────────────────────────────────────────────

function generateMarkdown({ title, description, category, imageFile, specs, store, affiliateUrl }) {
  const today = new Date().toISOString().split('T')[0];
  const cat   = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
  const emoji = { 'Mercado Livre':'🛒', 'Amazon':'📦', 'Magalu':'🏪' }[store] || '🛍️';

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
Confira abaixo as principais informações e acesse a página oficial do produto.
${specsBlock}
## Vale a Pena?

${title.split(' ').slice(0,5).join(' ')} se destaca pelo ótimo custo-benefício e pela avaliação positiva dos compradores.
Clique no botão abaixo para ver fotos, avaliações completas e disponibilidade:

${emoji} Acesse o produto na loja ${store} pelo botão abaixo.

---

*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const inputUrl = process.argv[2];

  if (!inputUrl) {
    console.log('\n✨  AchadoCertoVIP — Gerador de Posts');
    console.log('\nUso:  npm run post "<url-afiliado>"');
    console.log('\nExemplos:');
    console.log('  npm run post "https://www.mercadolivre.com.br/..."  ← Mercado Livre');
    console.log('  npm run post "https://amzn.to/xyz"                  ← Amazon');
    console.log('  npm run post "https://www.magazineluiza.com.br/..." ← Magalu\n');
    process.exit(0);
  }

  const platform = detectPlatform(inputUrl);
  if (platform === 'unknown') {
    console.error('\n❌ Plataforma não reconhecida.');
    console.error('Links suportados: mercadolivre.com.br | amzn.to | amazon.com.br | magazineluiza.com.br\n');
    process.exit(1);
  }

  // 1. Busca produto
  let product;
  try {
    if      (platform === 'ml')     product = await fetchML(inputUrl);
    else if (platform === 'amazon') product = await fetchAmazon(inputUrl);
    else                             product = await fetchMagalu(inputUrl);
  } catch (err) {
    console.error('\n❌ Erro ao buscar produto:', err.message, '\n');
    process.exit(1);
  }

  const slug = slugify(product.title);
  console.log('\n📝 Título    :', product.title);
  console.log('📂 Categoria :', product.category);
  console.log('🔗 Slug      :', slug);

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
      console.warn('⚠️  Não foi possível baixar a imagem:', err.message);
      imageFile = 'placeholder.jpg';
    }
  } else {
    console.warn('⚠️  Nenhuma imagem encontrada, usando placeholder.');
    imageFile = 'placeholder.jpg';
  }

  // 3. Gera .md
  const md     = generateMarkdown({ ...product, slug, imageFile });
  const mdDir  = path.join(process.cwd(), 'src', 'content', 'blog');
  const mdPath = path.join(mdDir, `${slug}.md`);

  if (fs.existsSync(mdPath)) {
    const bak = mdPath.replace('.md', `-bak-${Date.now()}.md`);
    fs.renameSync(mdPath, bak);
    console.log('⚠️  Post já existia, backup criado.');
  }
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('📎  Post criado  :', mdPath);

  // 4. Git: add + commit + push
  console.log('🚀  Publicando...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "post: ${slug}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log(`\n✅  PRONTO! Post publicado.`);
    console.log(`🌍  URL: https://achadocerto.vip/blog/${slug}\n`);
  } catch (_) {
    console.log('\n📎  Arquivo gerado. Rode manualmente:');
    console.log(`   git add . && git commit -m "post: ${slug}" && git push\n`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
