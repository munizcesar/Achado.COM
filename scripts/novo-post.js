#!/usr/bin/env node
/**
 * AchadoCertoVIP — Gerador automático de posts com IA
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
 *  3. Busca contexto via Serper.dev (opcional)
 *  4. Gera conteúdo rico via Groq AI (temperature 0.1)
 *  5. Valida qualidade anti-genérico
 *  6. Baixa a foto do produto
 *  7. Gera o .md completo
 *  8. Faz git add + commit + push
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

// Carrega .env do backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Importa módulos personalizados
import { selecionarArquetipo, gerarContextoVariacoes, ARQUETIPOS } from './content-archetypos.js';
import { buscarContextoProduto, verificarStatusSerper } from './serper-service.js';
import { gerarConteudoPost } from './groq-service.js';
import { validarConteudo, corrigirAutomatico, analisarDetalhado } from './content-validator.js';

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
  
  // Sistema de pontuação para categorias (quando há ambiguidade)
  const scores = {
    Tech: 0,
    Saude: 0,
    Casa: 0,
    Esportes: 0,
    Beleza: 0,
    Automotivo: 0
  };
  
  // Tech - Eletrônicos e tecnologia
  const techWords = /celular|smartphone|tablet|notebook|laptop|tv |tela|fone|audio|áudio|camera|câmera|monitor|pc |computador|headphone|earphone|smartwatch|relogio|relógio|mouse|teclado|webcam|microfone|caixa de som|alexa|echo|chromecast|kindle|console|playstation|xbox|nintendo|controle|joystick|ssd|hd |pendrive|carregador|cabo usb|bluetooth/;
  if (techWords.test(n)) scores.Tech += 2;
  
  // Saúde - Suplementos e medicamentos
  const saudeWords = /saúde|saude|suplemento|vitamina|proteína|proteina|creatina|colágen|colagen|whey|bcaa|amino|cápsulas|capsulas|medicamento|remédio|remedio|farmácia|farmacia|glutamina|pre.?treino|pré.?treino|arginina|cafeína|cafeina|omega|probiótico|multivitamínico/;
  if (saudeWords.test(n)) scores.Saude += 2;
  
  // Casa - Eletrodomésticos e itens do lar
  const casaWords = /casa|cozinha|lar|móvel|movel|decora|panela|liquidificador|ventilador|aspirador|geladeira|freezer|fogão|fogao|microondas|air ?fryer|fritadeira|batedeira|mixer|processador|cafeteira|chaleira|ferro de passar|secadora|lavadora|colchão|colchao|travesseiro|edredom|jogo de cama|tapete|cortina|luminária|luminaria/;
  if (casaWords.test(n)) scores.Casa += 2;
  
  // Esportes - Fitness e atividades físicas
  const esportesWords = /esporte|fitness|academia|legging|tênis|tenis|corrida|bicicleta|bike|esteira|muscula|halteres|peso|anilha|barra ?fixa|elástico|elastico|mat de yoga|kimono|luva de boxe|caneleira|tornozeleira|corda de pular|roda abdominal|kettlebell|top fitness|shorts de treino|meia de compressão|squeeze|garrafa de água|faixa de resistência/;
  if (esportesWords.test(n)) scores.Esportes += 2;
  
  // Beleza - Cosméticos e cuidados pessoais
  const belezaWords = /beleza|cosm|perfume|fragr|colônia|colonia|desodorante|deo |antiperspirante|cabelo|shampoo|condicionador|pele|maquiagem|make|batom|hidratante|serum|sérum|creme|loção|loçao|óleo|oleo corporal|sabonete|gel de banho|esmalte|base facial|corretivo|máscara|mascara facial|protetor solar|rosa mosqueta|boticário|boticario|natura|avon|eudora/;
  if (belezaWords.test(n)) scores.Beleza += 2;
  
  // Automotivo - Peças e acessórios de veículos
  const automotivoWords = /carro|moto|auto|veículo|veiculo|pneu|óleo de motor|oleo de motor|filtro|bateria automotiva|limpador de para.?brisa|parabrisa|vela de ignição|amortecedor|freio|pastilha|disco de freio|correia|radiador|alternador|motor de arranque|aditivo|fluido|aromatizante|tapete automotivo|capa de banco|suporte veicular|carregador veicular|dashcam|sensor de ré|alarme|trava|película|insulfilm|som automotivo|alto.?falante automotivo|bardahl|stp|castrol|shell|mobil|wynn/;
  if (automotivoWords.test(n)) scores.Automotivo += 2;
  
  // Ajustes de priorização (evita ambiguidade)
  // Ex: "fone de ouvido fitness" deve ser Tech, não Esportes
  if (/celular|smartphone|notebook|tv/.test(n)) scores.Tech += 1;
  if (/suplemento|whey|creatina/.test(n)) scores.Saude += 1;
  if (/perfume|colônia|desodorante|shampoo/.test(n)) scores.Beleza += 1;
  if (/carro|moto|motor|pneu/.test(n)) scores.Automotivo += 1;
  
  // Retorna a categoria com maior pontuação
  let maxScore = -1;
  let bestCategory = 'Casa'; // Fallback mais neutro que Tech
  
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }
  
  return bestCategory;
}

function cleanTitle(title) {
  // Remove cores comuns (no final da string)
  const colors = [
    'Cinza', 'Cinza-escuro', 'Preto', 'Branco', 'Azul', 'Verde', 'Vermelho', 
    'Amarelo', 'Rosa', 'Roxo', 'Laranja', 'Marrom', 'Bege', 'Dourado',
    'Prata', 'Prateado', 'Grafite', 'Chumbo', 'Cobre'
  ];
  
  let cleaned = title;
  
  // Remove cores que aparecem no final (com ou sem espaço antes)
  const colorPattern = new RegExp(`\\s+(${colors.join('|')})$`, 'i');
  cleaned = cleaned.replace(colorPattern, '');
  
  // Remove tamanhos/unidades redundantes no final (ex: "200 Ml" se já está no meio do título)
  cleaned = cleaned.replace(/\s+(ml|cm|mm|kg|g|l)$/i, '');
  
  return cleaned.trim();
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
    title: cleanTitle(title.replace(/\s+/g, ' ')).slice(0, 150),
    description: `Conheça o ${cleanTitle(title)}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
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
    title: cleanTitle(item.title),
    description: `Conheça o ${cleanTitle(item.title)}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
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
    title: cleanTitle(title),
    description: `${cleanTitle(title)} disponível na Amazon com entrega Prime para todo o Brasil.`,
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
    title: cleanTitle(title),
    description,
    category: mapCategory(title),
    imageUrl, specs,
    store: 'Magalu',
    affiliateUrl: inputUrl,
  };
}

// ── Gera markdown com IA ──────────────────────────────────────────────────

async function generateMarkdown(produto, imageFile, slug) {
  const { title, description, category, store, affiliateUrl } = produto;
  
  const today = new Date().toISOString().split('T')[0];
  const cat = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
  
  // 1. Seleciona arquetipo baseado no produto
  const arquetipo = selecionarArquetipo(title);
  console.log(`   📚 Arquétipo: ${ARQUETIPOS[arquetipo].nome}`);
  
  // 2. Gera variações de conteúdo
  const variacoes = gerarContextoVariacoes(produto, arquetipo);
  
  // 3. Busca contexto via Serper (opcional)
  let contextoSerper = null;
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey && serperKey !== 'sua-key-serper-aqui') {
    try {
      contextoSerper = await buscarContextoProduto(title, category, serperKey);
    } catch (e) {
      console.log('   ⚠️  Serper indisponível, continuando sem contexto externo');
    }
  }
  
  // 4. Gera conteúdo via Groq
  const groqKey = process.env.GROQ_API_KEY;
  let conteudoGerado;
  
  try {
    conteudoGerado = await gerarConteudoPost(
      produto,
      ARQUETIPOS[arquetipo],
      variacoes,
      contextoSerper,
      groqKey
    );
  } catch (error) {
    console.log(`   ⚠️  Erro no Groq: ${error.message}`);
    // Fallback: conteúdo básico
    conteudoGerado = gerarConteudoBasico(produto, variacoes);
  }
  
  // 5. Valida e corrige conteúdo
  let conteudoFinal = corrigirAutomatico(conteudoGerado);
  const validacao = validarConteudo(conteudoFinal);
  
  if (!validacao.aprovado) {
    console.log('   ⚠️  Conteúdo precisa de revisão manual');
  }
  
  // 6. Monta markdown completo com frontmatter
  const descricaoFinal = description.replace(/"/g, "'").slice(0, 155);
  
  return `---
title: "${title.replace(/"/g, "'")}"
description: "${descricaoFinal}"
date: ${today}
category: ${category}
image: /images/posts/${imageFile}
tags: [${cat}]
draft: false
affiliateUrl: "${affiliateUrl}"
productImage: /images/posts/${imageFile}
---

${conteudoFinal}

---

*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*
`;
}

// ── Fallback: conteúdo básico ─────────────────────────────────────────────

function gerarConteudoBasico(produto, variacoes) {
  const { title, description, specs, store } = produto;
  const emoji = { 'Mercado Livre': '🛒', 'Amazon': '📦', 'Magalu': '🏪' }[store] || '🛍️';
  
  const specsBlock = specs && specs.length > 0
    ? `\n## Especificações Principais\n\n${specs.join('\n')}\n`
    : '';
  
  return `${variacoes.abertura}

${title} é um produto disponível no ${store} com entrega rápida para todo o Brasil.

${specsBlock}

## Vale a Pena?

${variacoes.transicao}

${description}

## Como Comprar

${variacoes.fechamento}. ${variacoes.cta.gatilho}.

${emoji} ${variacoes.cta.texto}`;
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

  // 3. Gera .md com IA
  console.log('🤖 Gerando conteúdo...');
  const md     = await generateMarkdown(product, imageFile, slug);
  const mdDir  = path.join(process.cwd(), 'src', 'content', 'blog');
  const mdPath = path.join(mdDir, `${slug}.md`);

  if (fs.existsSync(mdPath)) {
    // Move backup para pasta .backups/ (não commitada)
    const backupDir = path.join(process.cwd(), '.backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const bak = path.join(backupDir, `${slug}-bak-${Date.now()}.md`);
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
