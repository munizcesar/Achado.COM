#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts
 *
 * Funciona como um "funcionário" que:
 *  1. Decide qual produto postar (Amazon BR ou Mercado Livre)
 *  2. Monta o link com tag de afiliado
 *  3. Executa: node scripts/novo-post.js "https://link-afiliado"
 *  4. Registra no histórico (evita repetição por 60 dias)
 *
 * NÃO modifica o novo-post.js. Só dispara o comando.
 *
 * Horários padrão: 08:00 | 12:00 | 18:00 (BRT, America/Sao_Paulo)
 *
 * Uso:
 *   node scripts/agent/agent.js           <- roda como daemon (cron)
 *   node scripts/agent/agent.js --now     <- executa imediatamente (teste)
 *   node scripts/agent/agent.js --status  <- mostra histórico
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

// ── Configuração ─────────────────────────────────────────────────────────────

const AMAZON_TAG       = process.env.AMAZON_AFFILIATE_TAG || 'altivita-20';
const ML_AFFILIATE_TAG = process.env.ML_AFFILIATE_TAG || '';
const HISTORY_FILE     = path.join(__dirname, 'history.json');
const LOG_FILE         = path.join(__dirname, 'agent.log');
const HISTORY_DAYS     = 60;

// Horários BRT
const SCHEDULES = [
  { hour: 8,  minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
];

// ── Catálogo Amazon BR ────────────────────────────────────────────────────────
// ASINs reais com alta demanda. Adicione mais conforme desejar.

const AMAZON_CATALOG = [
  // TECH
  { asin: 'B09B8RVKGR', name: 'Echo Dot 5ª Geração',           category: 'tech',       angle: 'casa_inteligente' },
  { asin: 'B07PXGQC1Q', name: 'Fire TV Stick 4K',               category: 'tech',       angle: 'entretenimento' },
  { asin: 'B09WZM4GBK', name: 'Kindle 11ª Geração',             category: 'tech',       angle: 'leitura_produtividade' },
  { asin: 'B09B8V1LZ3', name: 'Echo Show 5 (3ª Geração)',       category: 'tech',       angle: 'casa_inteligente' },
  { asin: 'B07NFTVP7P', name: 'Fire TV Stick Lite',             category: 'tech',       angle: 'custo_beneficio' },
  // SAÚDE
  { asin: 'B07QM5WZQG', name: 'Vitamina D 2000UI',              category: 'saude',      angle: 'saude_preventiva' },
  { asin: 'B00GXSNVWI', name: 'Ômega 3 Fish Oil',               category: 'saude',      angle: 'saude_preventiva' },
  { asin: 'B07K7BFJL8', name: 'Magnésio Quelato',               category: 'saude',      angle: 'bem_estar' },
  { asin: 'B01MUDDDL6', name: 'Whey Protein Gold Standard',     category: 'saude',      angle: 'performance' },
  { asin: 'B07BVJFMHB', name: 'Creatina Monohidratada',         category: 'saude',      angle: 'performance' },
  // BELEZA
  { asin: 'B08L6QPNB8', name: 'Sérum Vitamina C',               category: 'beleza',     angle: 'skincare_basico' },
  { asin: 'B0932TVFR9', name: 'Protetor Solar FPS 70',          category: 'beleza',     angle: 'cuidado_diario' },
  { asin: 'B07V3BQYZ6', name: 'Óleo de Argan para Cabelo',      category: 'beleza',     angle: 'cuidado_capilar' },
  { asin: 'B08NWMH1CJ', name: 'Secador de Cabelo 2200W',        category: 'beleza',     angle: 'custo_beneficio' },
  // CASA
  { asin: 'B09HKD5VHX', name: 'Air Fryer 4L Digital',           category: 'casa',       angle: 'praticidade_cozinha' },
  { asin: 'B07VX9W8WP', name: 'Cafeteira Expresso',             category: 'casa',       angle: 'ritual_diario' },
  { asin: 'B087LTZW61', name: 'Chaleira Elétrica',              category: 'casa',       angle: 'custo_beneficio' },
  { asin: 'B08GSH9XMQ', name: 'Panela Antiaderente 28cm',       category: 'casa',       angle: 'praticidade_cozinha' },
  // ESPORTES
  { asin: 'B08H7PKBKL', name: 'Tênis de Corrida Masculino',     category: 'esportes',   angle: 'performance' },
  { asin: 'B07JLGN6KD', name: 'Corda de Pular Speed Rope',      category: 'esportes',   angle: 'treino_em_casa' },
  { asin: 'B07KKT3K5S', name: 'Tapete de Yoga 6mm',             category: 'esportes',   angle: 'bem_estar' },
  { asin: 'B08LTQ87DN', name: 'Kit Elásticos de Resistência',   category: 'esportes',   angle: 'treino_em_casa' },
  // AUTOMOTIVO
  { asin: 'B07C7DM3V1', name: 'Suporte Veicular Celular',       category: 'automotivo', angle: 'seguranca_pratica' },
  { asin: 'B087C5KQVP', name: 'Aspirador Automotivo',           category: 'automotivo', angle: 'manutencao_facil' },
];

// Ângulos narrativos evergreen
const ANGLES = {
  casa_inteligente:       'Como este produto transforma a casa em um lar mais inteligente e conectado',
  entretenimento:         'A escolha mais inteligente para quem quer entretenimento sem complicação',
  leitura_produtividade:  'Por que quem lê muito considera este produto indispensável',
  custo_beneficio:        'Custo-benefício real: vale a pena investir neste produto?',
  saude_preventiva:       'O hábito simples que faz diferença na sua saúde a longo prazo',
  bem_estar:              'Pequenas mudanças, grandes resultados: o papel deste produto no dia a dia',
  performance:            'Para quem leva a sério os resultados: o que este produto entrega de verdade',
  skincare_basico:        'O básico que transforma: por que este produto entrou na rotina de tanta gente',
  cuidado_diario:         'Proteção diária que você não pode negligenciar',
  cuidado_capilar:        'O segredo dos cabelos saudáveis que poucos conhecem',
  praticidade_cozinha:    'Menos tempo na cozinha, mais tempo para o que importa',
  ritual_diario:          'O ritual que começa o dia com o pé direito',
  treino_em_casa:         'Academia em casa: como treinar de verdade sem sair do lar',
  seguranca_pratica:      'Praticidade e segurança que todo motorista merece',
  manutencao_facil:       'Cuidar do carro ficou mais simples do que você imagina',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch(_) {}
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch(_) {}
  return [];
}

function saveHistory(history) {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function wasRecentlyPosted(asin, history) {
  const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  return history.some(h => h.asin === asin && new Date(h.postedAt).getTime() > cutoff);
}

function recordPost(asin, name, url, category, history) {
  history.push({ asin, name, url, category, postedAt: new Date().toISOString() });
  if (history.length > 200) history.splice(0, history.length - 200);
  saveHistory(history);
}

// ── Seleção estratégica de produto ───────────────────────────────────────────

function pickProduct(history) {
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const todayPosts = history.filter(h => {
    const d = new Date(h.postedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return d === today;
  });
  const todayCategories = new Set(todayPosts.map(h => h.category).filter(Boolean));

  const fresh = AMAZON_CATALOG.filter(p => !wasRecentlyPosted(p.asin, history));
  const freshNewCategory = fresh.filter(p => !todayCategories.has(p.category));
  const pool = freshNewCategory.length > 0 ? freshNewCategory : fresh;

  if (pool.length === 0) {
    log('⚠️  Todos os produtos foram postados recentemente. Resetando metade do histórico...');
    history.splice(0, Math.floor(history.length / 2));
    saveHistory(history);
    return pickProduct(history);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function buildAmazonUrl(asin, tag) {
  return `https://www.amazon.com.br/dp/${asin}?tag=${tag}`;
}

// ── Executa o novo-post.js ────────────────────────────────────────────────────

function runPost(affiliateUrl, angle) {
  const projectRoot = path.join(__dirname, '..', '..');
  log(`🚀 Executando: node scripts/novo-post.js "${affiliateUrl}"`);
  log(`📐 Ângulo: ${ANGLES[angle] || angle}`);

  try {
    execSync(
      `node scripts/novo-post.js "${affiliateUrl}"`,
      {
        cwd: projectRoot,
        stdio: 'inherit',
        timeout: 5 * 60 * 1000,
        env: {
          ...process.env,
          POST_ANGLE: angle,
          POST_ANGLE_DESC: ANGLES[angle] || angle,
        }
      }
    );
    log('✅ Post criado com sucesso!');
    return true;
  } catch (err) {
    log(`❌ Erro ao criar post: ${err.message}`);
    return false;
  }
}

// ── Job principal ─────────────────────────────────────────────────────────────

async function runJob() {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🤖 Agente AchadoCerto.VIP — iniciando job...');

  const history = loadHistory();
  const product = pickProduct(history);

  if (!product) { log('⚠️  Nenhum produto disponível.'); return; }

  const url = buildAmazonUrl(product.asin, AMAZON_TAG);
  log(`🛒 Produto: ${product.name} [${product.category}]`);
  log(`🔗 URL: ${url}`);

  const success = runPost(url, product.angle);
  if (success) recordPost(product.asin, product.name, url, product.category, history);
}

// ── Scheduler (sem dependências externas) ────────────────────────────────────

function startScheduler() {
  log(`🕐 Agente iniciado. Horários: 08:00 | 12:00 | 18:00 (BRT)`);
  log(`🏷️  Tag Amazon: ${AMAZON_TAG}`);
  log(`📦 Catálogo: ${AMAZON_CATALOG.length} produtos em ${new Set(AMAZON_CATALOG.map(p=>p.category)).size} categorias`);

  let lastRun = null;
  setInterval(() => {
    const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const h   = brt.getHours();
    const m   = brt.getMinutes();
    const key = `${brt.toDateString()}-${h}:${m}`;
    if (SCHEDULES.some(s => s.hour === h && s.minute === m) && key !== lastRun) {
      lastRun = key;
      runJob().catch(err => log(`❌ ${err.message}`));
    }
  }, 30 * 1000);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--status')) {
  const history = loadHistory();
  console.log(`\n📋 Últimos posts (${history.length} total):\n`);
  history.slice(-20).reverse().forEach(h => {
    console.log(`  ${h.postedAt.slice(0,10)}  [${(h.category||'?').padEnd(12)}]  ${h.name || h.asin}`);
  });
  console.log('');
  process.exit(0);
}

if (args.includes('--now')) {
  log('⚡ Modo --now: executando imediatamente...');
  runJob().then(() => process.exit(0)).catch(err => { log(err.message); process.exit(1); });
} else {
  startScheduler();
}
