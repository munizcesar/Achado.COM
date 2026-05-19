#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts (Amazon BR)
 *
 * 3 PILARES DE IDENTIDADE: beleza · saúde · casa
 *
 * Fluxo de seleção de produto:
 *   1. Trend Scout busca bestsellers Amazon BR para o pilar (cache 6h)
 *   2. Produtos trending têm PRIORIDADE (não exclusividade)
 *   3. Catálogo fixo é sempre o fallback — nunca fica sem produto
 *   4. Content Guard valida antes de disparar o novo-post.js
 *
 * Horários BRT:
 *   08:00 → pilar A do dia
 *   12:00 → pilar B do dia
 *   18:00 → pilar C do dia
 *
 * Uso:
 *   node scripts/agent/agent.js            ← daemon
 *   node scripts/agent/agent.js --now      ← post imediato
 *   node scripts/agent/agent.js --now beleza|saude|casa
 *   node scripts/agent/agent.js --status   ← histórico + trending cache
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { runContentGuard }  from './content-guard.js';
import { fetchTrendingProducts, mergeTrendingWithCatalog, getTrendingStatus } from './trend-scout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

// ── Configuração ─────────────────────────────────────────────────────────────

const AMAZON_TAG      = process.env.AMAZON_AFFILIATE_TAG || 'altivita-20';
const HISTORY_FILE    = path.join(__dirname, 'history.json');
const LOG_FILE        = path.join(__dirname, 'agent.log');
const HISTORY_DAYS    = 60;
const MAX_GUARD_RETRIES = 3;

const PILLARS = ['beleza', 'saude', 'casa'];

const SCHEDULES = [
  { hour: 8,  minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
];

// ── Catálogo fixo Amazon BR ──────────────────────────────────────────────────

const AMAZON_CATALOG = [
  // ── BELEZA ──────────────────────────────────────────────────────────────
  { asin: 'B08L6QPNB8', name: 'Sérum Vitamina C Facial',         category: 'beleza', angle: 'skincare_basico'    },
  { asin: 'B0932TVFR9', name: 'Protetor Solar FPS 70',           category: 'beleza', angle: 'cuidado_diario'     },
  { asin: 'B07V38QYZ6', name: 'Óleo de Argan para Cabelo',       category: 'beleza', angle: 'cuidado_capilar'    },
  { asin: 'B08NWMH1CJ', name: 'Secador de Cabelo 2200W',         category: 'beleza', angle: 'custo_beneficio'    },
  { asin: 'B09BVKFXLQ', name: 'Ácido Hialurônico Sérum',         category: 'beleza', angle: 'anti_idade'         },
  { asin: 'B07WQJLX2P', name: 'Esfoliante Facial de Argila',     category: 'beleza', angle: 'limpeza_pele'       },
  { asin: 'B08KGXK3HY', name: 'Máscara Capilar Hidratação',      category: 'beleza', angle: 'cuidado_capilar'    },
  { asin: 'B09C3MRFL4', name: 'Tônico Facial Niacinamida 10%',   category: 'beleza', angle: 'ingrediente_ativo'  },

  // ── SAÚDE ────────────────────────────────────────────────────────────────
  { asin: 'B07QM5WZQG', name: 'Vitamina D3 2000UI',              category: 'saude',  angle: 'saude_preventiva'  },
  { asin: 'B00GXSNVWI', name: 'Ômega 3 Fish Oil 1000mg',         category: 'saude',  angle: 'saude_preventiva'  },
  { asin: 'B07K7BFJL8', name: 'Magnésio Quelato 300mg',          category: 'saude',  angle: 'bem_estar'         },
  { asin: 'B07BVJFMHB', name: 'Creatina Monohidratada 300g',     category: 'saude',  angle: 'performance'       },
  { asin: 'B08F7BQXCK', name: 'Colágeno Hidrolisado + Vit C',    category: 'saude',  angle: 'anti_idade'        },
  { asin: 'B07WQRG8LM', name: 'Vitamina C 1000mg Efervescente',  category: 'saude',  angle: 'imunidade'         },
  { asin: 'B09HKJLP2Q', name: 'Probiótico 10 Cepas',             category: 'saude',  angle: 'saude_intestinal'  },
  { asin: 'B08C2RFTPN', name: 'Melatonina 0,21mg Sublingual',    category: 'saude',  angle: 'qualidade_sono'    },

  // ── CASA ─────────────────────────────────────────────────────────────────
  { asin: 'B09HKD5VHX', name: 'Air Fryer 4L Digital',            category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B07VX9W8WP', name: 'Cafeteira Expresso 15 Bar',       category: 'casa',   angle: 'ritual_diario'        },
  { asin: 'B087LTZW61', name: 'Chaleira Elétrica 1,7L',          category: 'casa',   angle: 'custo_beneficio'      },
  { asin: 'B08GSH9XMQ', name: 'Panela Antiaderente 28cm',        category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B09B2KXQPL', name: 'Purificador de Água Compacto',    category: 'casa',   angle: 'saude_em_casa'        },
  { asin: 'B08KFPBWQL', name: 'Umidificador de Ar Ultrassônico', category: 'casa',   angle: 'bem_estar_em_casa'    },
  { asin: 'B07XLMBQPV', name: 'Aspirador Robô Wi-Fi',            category: 'casa',   angle: 'praticidade_casa'     },
  { asin: 'B09C5HXQRM', name: 'Difusor de Aromas 400ml',         category: 'casa',   angle: 'bem_estar_em_casa'    },
];

// ── Ângulos editoriais (evergreen) ───────────────────────────────────────────

const ANGLES = {
  // beleza
  skincare_basico:     'O básico que transforma: por que este produto entrou na rotina de tanta gente',
  cuidado_diario:      'A proteção diária que você não pode negligenciar',
  cuidado_capilar:     'O segredo dos cabelos saudáveis que poucos conhecem',
  anti_idade:          'Ingrediente ativo que age de verdade contra o envelhecimento precoce',
  limpeza_pele:        'Pele limpa é pele saudável: o ritual que muda tudo',
  ingrediente_ativo:   'Como um único ingrediente mudou a rotina de skincare de milhares de pessoas',
  custo_beneficio:     'Custo-benefício real: vale cada centavo investir neste produto',
  // saúde
  saude_preventiva:    'O hábito simples que faz diferença na sua saúde a longo prazo',
  bem_estar:           'Pequenas mudanças, grandes resultados no bem-estar diário',
  performance:         'Para quem leva a sério os resultados: o que este produto entrega',
  imunidade:           'Imunidade forte começa com suplementação inteligente',
  qualidade_sono:      'O sono que você merece começa com a suplementação certa',
  saude_intestinal:    'Saúde começa no intestino: o que a ciência diz sobre probióticos',
  // casa
  praticidade_cozinha: 'Menos tempo na cozinha, mais tempo para o que importa',
  praticidade_casa:    'A tecnologia que trabalha por você enquanto você descansa',
  ritual_diario:       'O ritual que começa o dia com o pé direito',
  saude_em_casa:       'Um investimento pequeno que protege toda a família',
  bem_estar_em_casa:   'Transformar o ambiente em que você vive transforma como você se sente',
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

function recordPost(asin, name, url, category, guardResult, isTrending, history) {
  history.push({
    asin, name, url, category,
    postedAt:      new Date().toISOString(),
    guardWarnings: guardResult.warnings.length,
    trending:      !!isTrending,
  });
  if (history.length > 300) history.splice(0, history.length - 300);
  saveHistory(history);
}

// ── Rotação de pilares ────────────────────────────────────────────────────────

function getPillarForSlot(slotIndex) {
  const brt       = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const start     = new Date(brt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((brt - start) / 86400000);
  const offset    = dayOfYear % PILLARS.length;
  return PILLARS[(slotIndex + offset) % PILLARS.length];
}

// ── Seleção de produto (com prioridade trending) ──────────────────────────────

function pickFromPool(pool, exclude = []) {
  const available = pool.filter(p => !exclude.includes(p.asin));
  if (available.length === 0) return null;
  const topN   = Math.min(3, available.length);
  const chosen = available[Math.floor(Math.random() * topN)];
  return chosen;
}

function buildAmazonUrl(asin, tag) {
  return `https://www.amazon.com.br/dp/${asin}?tag=${tag}`;
}

// ── Executa novo-post.js — captura e exibe erro detalhado ────────────────────

function runPost(affiliateUrl, productName, guardEnvVars) {
  const projectRoot = path.join(__dirname, '..', '..');
  log(`🚀 Executando: node scripts/novo-post.js "${affiliateUrl}"`);
  try {
    execSync(
      `node scripts/novo-post.js "${affiliateUrl}"`,
      {
        cwd:     projectRoot,
        stdio:   'pipe',          // captura stdout+stderr para exibir em caso de erro
        timeout: 5 * 60 * 1000,
        env:     {
          ...process.env,
          ...guardEnvVars,
          PRODUCT_NAME_HINT: productName || '',   // nome do catálogo como fallback de título
        },
      }
    );
    log('✅ Post criado com sucesso!');
    return true;
  } catch (err) {
    // Exibe stdout + stderr completos para diagnóstico
    const out = (err.stdout || Buffer.alloc(0)).toString('utf8').trim();
    const errOut = (err.stderr || Buffer.alloc(0)).toString('utf8').trim();
    if (out) {
      log('📋 stdout do novo-post.js:');
      out.split('\n').forEach(l => log('   ' + l));
    }
    if (errOut) {
      log('🔴 stderr do novo-post.js:');
      errOut.split('\n').forEach(l => log('   ' + l));
    }
    log(`❌ Erro ao criar post: ${err.message}`);
    return false;
  }
}

// ── Job principal ─────────────────────────────────────────────────────────────

async function runJob(forcePillar = null, slotIndex = 0) {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🤖 Agente + Trend Scout + Content Guard — AchadoCerto.VIP');

  const pillar  = forcePillar || getPillarForSlot(slotIndex);
  const history = loadHistory();
  const excluded = [];

  // ── 1. TREND SCOUT ──
  log(`📈 Trend Scout: buscando bestsellers de "${pillar}"...`);
  const trending = await fetchTrendingProducts(pillar);
  if (trending.length > 0) {
    log(`   ✅ ${trending.length} produtos em alta encontrados`);
    trending.slice(0, 5).forEach((t, i) =>
      log(`   #${i + 1} [${t.asin}] ${t.name.slice(0, 60)}`)
    );
  } else {
    log('   ⚠️  Trend Scout indisponível — usando catálogo fixo');
  }

  // ── 2. Pool trending > catálogo ──
  const catalogByPillar = AMAZON_CATALOG.filter(p => p.category === pillar);
  const pool = mergeTrendingWithCatalog(trending, catalogByPillar, pillar, history, ANGLES);

  if (pool.length === 0) {
    log('❌ Pool vazio. Abortando.');
    return;
  }

  log(`🏁 Pool final: ${pool.length} produtos (trending prioridade → catálogo fallback)`);

  // ── 3. Content Guard ──
  for (let attempt = 1; attempt <= MAX_GUARD_RETRIES; attempt++) {
    const product = pickFromPool(pool, excluded);
    if (!product) { log('❌ Sem produtos disponíveis no pool.'); return; }

    const trendBadge = product.isTrending
      ? (product.trendingNew ? ' 🆕 [trending novo]' : ` 📈 [trending #${product.trendingRank}]`)
      : ' [catálogo]';

    log(`\n🔍 Tentativa ${attempt}/${MAX_GUARD_RETRIES}: ${product.name}${trendBadge}`);

    const angleDesc = ANGLES[product.angle] || product.angle;

    const guard = runContentGuard({
      productName: product.name,
      pillar,
      angle:       product.angle,
      angleDesc,
      history,
    });

    guard.report.forEach(line => log(line));
    if (guard.warnings.length) guard.warnings.forEach(w => log(`   ${w}`));

    if (!guard.safe) {
      log(`🚫 Guard bloqueou tentativa ${attempt}: ${guard.blockers.join(' | ')}`);
      excluded.push(product.asin);
      if (attempt < MAX_GUARD_RETRIES) {
        log(`🔁 Próximo produto...`);
        continue;
      } else {
        log('⚠️  Máx de tentativas. Prosseguindo com aviso.');
      }
    }

    const url = buildAmazonUrl(product.asin, AMAZON_TAG);
    log(`🎨 Pilar    : ${pillar.toUpperCase()}`);
    log(`🛒 Produto  : ${product.name}${trendBadge}`);
    log(`🔗 URL      : ${url}`);
    log(`📐 Ângulo   : ${angleDesc}`);

    const success = runPost(url, product.name, guard.envVars);
    if (success) recordPost(product.asin, product.name, url, product.category, guard, product.isTrending, history);
    return;
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function startScheduler() {
  log('🕐 Agente iniciado — 08:00 | 12:00 | 18:00 (BRT)');
  log(`🏷️  Tag: ${AMAZON_TAG}  |  Pilares: ${PILLARS.join(' · ')}  |  Catálogo: ${AMAZON_CATALOG.length} produtos`);
  log('📅 Rotação de hoje:');
  SCHEDULES.forEach((s, i) => log(`   ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}  (${PILLARS.join('/')})` ));

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
  const trending_count = history.filter(h => h.trending).length;
  console.log(`\n📋 Últimos posts (${history.length} total • ${trending_count} de trending):\n`);
  history.slice(-20).reverse().forEach(h => {
    const cat  = (h.category || '?').padEnd(8);
    const w    = h.guardWarnings > 0 ? ` ⚠️${h.guardWarnings}` : '';
    const tr   = h.trending ? ' 📈' : '';
    console.log(`  ${h.postedAt.slice(0,10)}  [${cat}]${w}${tr}  ${h.name || h.asin}`);
  });
  console.log('\n📅 Rotação de HOJE:');
  SCHEDULES.forEach((s, i) => console.log(`  ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}`));
  console.log('\n📡 Trend Scout cache:');
  getTrendingStatus().forEach(l => console.log(l));
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
