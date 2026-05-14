#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts (Amazon BR)
 *
 * 3 PILARES DE IDENTIDADE: beleza · saúde · casa
 *
 * Regra do dia:
 *   08:00 → pilar A do dia
 *   12:00 → pilar B do dia
 *   18:00 → pilar C do dia
 *   (rotação cíclica diária para nunca repetir a mesma ordem)
 *
 * Protocolo de segurança: content-guard.js roda ANTES do novo-post.js
 *   e blinda as env vars injetadas sem tocar em nenhum código do site.
 *
 * Mercado Livre: manual.
 *
 * Uso:
 *   node scripts/agent/agent.js           ← daemon (08:00|12:00|18:00 BRT)
 *   node scripts/agent/agent.js --now     ← post imediato (usa próximo pilar)
 *   node scripts/agent/agent.js --now beleza|saude|casa  ← força pilar
 *   node scripts/agent/agent.js --status  ← histórico + rotação do dia
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { runContentGuard } from './content-guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

// ── Configuração ──────────────────────────────────────────────────────────────

const AMAZON_TAG   = process.env.AMAZON_AFFILIATE_TAG || 'altivita-20';
const HISTORY_FILE = path.join(__dirname, 'history.json');
const LOG_FILE     = path.join(__dirname, 'agent.log');
const HISTORY_DAYS = 60;
const MAX_GUARD_RETRIES = 3; // tentativas antes de pular o produto

const PILLARS = ['beleza', 'saude', 'casa'];

const SCHEDULES = [
  { hour: 8,  minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
];

// ── Catálogo Amazon BR — apenas os 3 pilares ─────────────────────────────────

const AMAZON_CATALOG = [
  // BELEZA
  { asin: 'B08L6QPNB8', name: 'Sérum Vitamina C Facial',         category: 'beleza', angle: 'skincare_basico' },
  { asin: 'B0932TVFR9', name: 'Protetor Solar FPS 70',           category: 'beleza', angle: 'cuidado_diario' },
  { asin: 'B07V3BQYZ6', name: 'Óleo de Argan para Cabelo',       category: 'beleza', angle: 'cuidado_capilar' },
  { asin: 'B08NWMH1CJ', name: 'Secador de Cabelo 2200W',         category: 'beleza', angle: 'custo_beneficio' },
  { asin: 'B09BVKFXLQ', name: 'Ácido Hialurônico Sérum',         category: 'beleza', angle: 'anti_idade' },
  { asin: 'B07WQJLX2P', name: 'Esfoliante Facial de Argila',     category: 'beleza', angle: 'limpeza_pele' },
  { asin: 'B08KGXK3HY', name: 'Máscara Capilar Hidratação',      category: 'beleza', angle: 'cuidado_capilar' },
  { asin: 'B09C3MRFL4', name: 'Tônico Facial Niacinamida 10%',   category: 'beleza', angle: 'skincare_basico' },
  // SAÚDE
  { asin: 'B07QM5WZQG', name: 'Vitamina D3 2000UI',              category: 'saude',  angle: 'saude_preventiva' },
  { asin: 'B00GXSNVWI', name: 'Ômega 3 Fish Oil 1000mg',         category: 'saude',  angle: 'saude_preventiva' },
  { asin: 'B07K7BFJL8', name: 'Magnésio Quelato 300mg',          category: 'saude',  angle: 'bem_estar' },
  { asin: 'B07BVJFMHB', name: 'Creatina Monohidratada 300g',     category: 'saude',  angle: 'performance' },
  { asin: 'B08F7BQXCK', name: 'Colágeno Hidrolisado + Vit C',    category: 'saude',  angle: 'anti_idade' },
  { asin: 'B07WQRG8LM', name: 'Vitamina C 1000mg Efervescente',  category: 'saude',  angle: 'imunidade' },
  { asin: 'B09HKJLP2Q', name: 'Probiótico 10 Cepas',             category: 'saude',  angle: 'bem_estar' },
  { asin: 'B08C2RFTPN', name: 'Melatonina 0,21mg Sublingual',    category: 'saude',  angle: 'qualidade_sono' },
  // CASA
  { asin: 'B09HKD5VHX', name: 'Air Fryer 4L Digital',            category: 'casa',   angle: 'praticidade_cozinha' },
  { asin: 'B07VX9W8WP', name: 'Cafeteira Expresso 15 Bar',       category: 'casa',   angle: 'ritual_diario' },
  { asin: 'B087LTZW61', name: 'Chaleira Elétrica 1,7L',          category: 'casa',   angle: 'custo_beneficio' },
  { asin: 'B08GSH9XMQ', name: 'Panela Antiaderente 28cm',        category: 'casa',   angle: 'praticidade_cozinha' },
  { asin: 'B09B2KXQPL', name: 'Purificador de Água Compacto',    category: 'casa',   angle: 'saude_em_casa' },
  { asin: 'B08KFPBWQL', name: 'Umidificador de Ar Ultrassônico', category: 'casa',   angle: 'bem_estar_em_casa' },
  { asin: 'B07XLMBQPV', name: 'Aspirador Robô Wi-Fi',            category: 'casa',   angle: 'praticidade_cozinha' },
  { asin: 'B09C5HXQRM', name: 'Difusor de Aromas 400ml',         category: 'casa',   angle: 'bem_estar_em_casa' },
];

const ANGLES = {
  skincare_basico:    'O básico que transforma: por que este produto entrou na rotina de tanta gente',
  cuidado_diario:     'A proteção diária que você não pode negligenciar',
  cuidado_capilar:    'O segredo dos cabelos saudáveis que poucos conhecem',
  anti_idade:         'Ingrediente ativo que age de verdade contra o envelhecimento precoce',
  limpeza_pele:       'Pele limpa é pele saudável: o ritual que muda tudo',
  saude_preventiva:   'O hábito simples que faz diferença na sua saúde a longo prazo',
  bem_estar:          'Pequenas mudanças, grandes resultados no bem-estar diário',
  performance:        'Para quem leva a sério os resultados: o que este produto entrega',
  imunidade:          'Imunidade forte começa com suplementação inteligente',
  qualidade_sono:     'O sono que você merece começa com a suplementação certa',
  praticidade_cozinha:'Menos tempo na cozinha, mais tempo para o que importa',
  ritual_diario:      'O ritual que começa o dia com o pé direito',
  custo_beneficio:    'Custo-benefício real: vale a pena investir neste produto?',
  saude_em_casa:      'Um investimento pequeno que protege toda a família',
  bem_estar_em_casa:  'Transformar o ambiente em que você vive transforma como você se sente',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  const ts   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
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

function recordPost(asin, name, url, category, guardResult, history) {
  history.push({
    asin, name, url, category,
    postedAt: new Date().toISOString(),
    guardWarnings: guardResult.warnings.length,
  });
  if (history.length > 300) history.splice(0, history.length - 300);
  saveHistory(history);
}

// ── Rotação de pilares ────────────────────────────────────────────────────────

function getPillarForSlot(slotIndex) {
  const brt      = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const start    = new Date(brt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((brt - start) / 86400000);
  const offset   = dayOfYear % PILLARS.length;
  return PILLARS[(slotIndex + offset) % PILLARS.length];
}

// ── Seleção de produto ────────────────────────────────────────────────────────

function pickProduct(pillar, history, exclude = []) {
  const pool = AMAZON_CATALOG
    .filter(p => p.category === pillar)
    .filter(p => !wasRecentlyPosted(p.asin, history))
    .filter(p => !exclude.includes(p.asin));

  if (pool.length === 0) {
    if (exclude.length > 0) {
      // Tentou retries, reseta histórico do pilar
      log(`⚠️  Reset parcial do histórico de "${pillar}"`);
      const half = Math.ceil(history.filter(h => h.category === pillar).length / 2);
      let removed = 0;
      for (let i = 0; i < history.length && removed < half; i++) {
        if (history[i].category === pillar) { history.splice(i, 1); removed++; i--; }
      }
      saveHistory(history);
    }
    return AMAZON_CATALOG
      .filter(p => p.category === pillar)
      .filter(p => !exclude.includes(p.asin))
      [0] || AMAZON_CATALOG.find(p => p.category === pillar);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function buildAmazonUrl(asin, tag) {
  return `https://www.amazon.com.br/dp/${asin}?tag=${tag}`;
}

// ── Executa o novo-post.js (com env vars do guard injetadas) ────────────────────

function runPost(affiliateUrl, guardEnvVars) {
  const projectRoot = path.join(__dirname, '..', '..');
  log(`🚀 Executando: node scripts/novo-post.js "${affiliateUrl}"`);
  try {
    execSync(
      `node scripts/novo-post.js "${affiliateUrl}"`,
      {
        cwd: projectRoot,
        stdio: 'inherit',
        timeout: 5 * 60 * 1000,
        env: { ...process.env, ...guardEnvVars },
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

async function runJob(forcePillar = null, slotIndex = 0) {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🤖 Agente + Content Guard — AchadoCerto.VIP');

  const pillar  = forcePillar || getPillarForSlot(slotIndex);
  const history = loadHistory();
  const excluded = [];

  for (let attempt = 1; attempt <= MAX_GUARD_RETRIES; attempt++) {
    const product = pickProduct(pillar, history, excluded);
    if (!product) { log('❌ Sem produtos disponíveis.'); return; }

    const angleDesc = ANGLES[product.angle] || product.angle;

    // ── CONTENT GUARD ──
    const guard = runContentGuard({
      productName: product.name,
      pillar,
      angle:       product.angle,
      angleDesc,
      history,
    });

    // Imprime relatório do guard
    guard.report.forEach(line => log(line));
    if (guard.warnings.length) guard.warnings.forEach(w => log(`   ${w}`));

    if (!guard.safe) {
      log(`🚫 Guard bloqueou tentativa ${attempt}/${MAX_GUARD_RETRIES}: ${guard.blockers.join(' | ')}`);
      excluded.push(product.asin);
      if (attempt < MAX_GUARD_RETRIES) {
        log(`🔁 Tentando próximo produto do pilar "${pillar}"...`);
        continue;
      } else {
        log('⚠️  Máx de tentativas atingido. Prosseguindo com avisos (não bloqueante).');
      }
    }

    // Guard aprovado (ou retries esgotados com aviso)
    const url = buildAmazonUrl(product.asin, AMAZON_TAG);
    log(`🎨 Pilar   : ${pillar.toUpperCase()}`);
    log(`🛒 Produto : ${product.name}`);
    log(`🔗 URL     : ${url}`);
    log(`📐 Ângulo  : ${angleDesc}`);

    const success = runPost(url, guard.envVars);
    if (success) recordPost(product.asin, product.name, url, product.category, guard, history);
    return;
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function startScheduler() {
  log('🕐 Agente iniciado — 08:00 | 12:00 | 18:00 (BRT)');
  log(`🏷️  Tag: ${AMAZON_TAG}  |  Pilares: ${PILLARS.join(' · ')}  |  Catálogo: ${AMAZON_CATALOG.length} produtos`);
  log('📅 Rotação de hoje:');
  SCHEDULES.forEach((s, i) => log(`   ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}`));

  let lastRun = null;
  setInterval(() => {
    const brt  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const h    = brt.getHours();
    const m    = brt.getMinutes();
    const key  = `${brt.toDateString()}-${h}:${m}`;
    const slot = SCHEDULES.findIndex(s => s.hour === h && s.minute === m);
    if (slot !== -1 && key !== lastRun) {
      lastRun = key;
      runJob(null, slot).catch(err => log(`❌ ${err.message}`));
    }
  }, 30 * 1000);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--status')) {
  const history = loadHistory();
  console.log(`\n📋 Últimos posts (${history.length} total):\n`);
  history.slice(-20).reverse().forEach(h => {
    const cat = (h.category || '?').padEnd(8);
    const w   = h.guardWarnings > 0 ? ` ⚠️${h.guardWarnings}` : '';
    console.log(`  ${h.postedAt.slice(0,10)}  [${cat}]${w}  ${h.name || h.asin}`);
  });
  console.log('\n📅 Rotação de HOJE:');
  SCHEDULES.forEach((s, i) => {
    console.log(`  ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}`);
  });
  console.log('');
  process.exit(0);
}

if (args.includes('--now')) {
  const forcePillar = args.find(a => PILLARS.includes(a)) || null;
  log(`⚡ --now ${forcePillar ? `(pilar: ${forcePillar})` : '(rotação automática)'}`);
  runJob(forcePillar, 0).then(() => process.exit(0)).catch(err => { log(err.message); process.exit(1); });
} else {
  startScheduler();
}
