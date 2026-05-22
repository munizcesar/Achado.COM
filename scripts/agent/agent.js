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

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG;
if (!AMAZON_TAG) {
  console.error('❌ ERRO CRÍTICO: variável AMAZON_AFFILIATE_TAG não definida no .env!');
  process.exit(1);
}

const HISTORY_FILE     = path.join(__dirname, 'history.json');
const LOG_FILE         = path.join(__dirname, 'agent.log');
const HISTORY_DAYS     = 7;   // FIX: era 60 — bloqueava todo o catálogo no CI sem cache persistente
const MAX_GUARD_RETRIES = 3;

const PILLARS = ['beleza', 'saude', 'casa'];

const SCHEDULES = [
  { hour: 8,  minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
];

// ── Catálogo fixo Amazon BR (16 produtos por pilar) ──────────────────────────

const AMAZON_CATALOG = [
  // ── BELEZA ──────────────────────────────────────────────────────────────
  { asin: 'B08L6QPNB8', name: 'Sérum Vitamina C Facial',              category: 'beleza', angle: 'skincare_basico'   },
  { asin: 'B0932TVFR9', name: 'Protetor Solar FPS 70',                category: 'beleza', angle: 'cuidado_diario'    },
  { asin: 'B07V38QYZ6', name: 'Óleo de Argan para Cabelo',            category: 'beleza', angle: 'cuidado_capilar'   },
  { asin: 'B08NWMH1CJ', name: 'Secador de Cabelo 2200W',              category: 'beleza', angle: 'custo_beneficio'   },
  { asin: 'B09BVKFXLQ', name: 'Ácido Hialurônico Sérum',              category: 'beleza', angle: 'anti_idade'        },
  { asin: 'B07WQJLX2P', name: 'Esfoliante Facial de Argila',          category: 'beleza', angle: 'limpeza_pele'      },
  { asin: 'B08KGXK3HY', name: 'Máscara Capilar Hidratação',           category: 'beleza', angle: 'cuidado_capilar'   },
  { asin: 'B09C3MRFL4', name: 'Tônico Facial Niacinamida 10%',        category: 'beleza', angle: 'ingrediente_ativo' },
  { asin: 'B09XK2VLBJ', name: 'Retinol Sérum Antienvelhecimento',     category: 'beleza', angle: 'anti_idade'        },
  { asin: 'B08RV8WQBZ', name: 'Protetor Térmico Capilar 230°C',       category: 'beleza', angle: 'cuidado_capilar'   },
  { asin: 'B07THHQMHM', name: 'Água Micelar Demaquilante 500ml',      category: 'beleza', angle: 'limpeza_pele'      },
  { asin: 'B09NW1KXPQ', name: 'Creme Facial FPS 30 Hidratante',       category: 'beleza', angle: 'cuidado_diario'    },
  { asin: 'B08B6MG18J', name: 'Shampoo Antiqueda com Biotina',        category: 'beleza', angle: 'cuidado_capilar'   },
  { asin: 'B07YFK4S4L', name: 'Base Líquida Cobertura Total',         category: 'beleza', angle: 'custo_beneficio'   },
  { asin: 'B09PQK3WBN', name: 'Vitamina E Sérum Facial Noturno',      category: 'beleza', angle: 'skincare_basico'   },
  { asin: 'B08FT2PVNX', name: 'Condicionador Hidratação Intensa',     category: 'beleza', angle: 'cuidado_capilar'   },

  // ── SAÚDE ────────────────────────────────────────────────────────────────
  { asin: 'B07QM5WZQG', name: 'Vitamina D3 2000UI',                   category: 'saude',  angle: 'saude_preventiva' },
  { asin: 'B00GXSNVWI', name: 'Ômega 3 Fish Oil 1000mg',              category: 'saude',  angle: 'saude_preventiva' },
  { asin: 'B07K7BFJL8', name: 'Magnésio Quelato 300mg',               category: 'saude',  angle: 'bem_estar'        },
  { asin: 'B07BVJFMHB', name: 'Creatina Monohidratada 300g',          category: 'saude',  angle: 'performance'      },
  { asin: 'B08F7BQXCK', name: 'Colágeno Hidrolisado com Vitamina C',  category: 'saude',  angle: 'anti_idade'       },
  { asin: 'B07WQRG8LM', name: 'Vitamina C 1000mg Efervescente',       category: 'saude',  angle: 'imunidade'        },
  { asin: 'B09HKJLP2Q', name: 'Probiótico 10 Cepas 60 cápsulas',     category: 'saude',  angle: 'saude_intestinal' },
  { asin: 'B08C2RFTPN', name: 'Melatonina 0,21mg Sublingual',         category: 'saude',  angle: 'qualidade_sono'   },
  { asin: 'B09VLGZ8WK', name: 'Whey Protein Isolado 900g',            category: 'saude',  angle: 'performance'      },
  { asin: 'B08HKQPWBV', name: 'Zinco Quelato 30mg 60 cápsulas',      category: 'saude',  angle: 'imunidade'        },
  { asin: 'B07NQKX8TL', name: 'Coenzima Q10 100mg Antioxidante',     category: 'saude',  angle: 'saude_preventiva' },
  { asin: 'B09FK2MNVP', name: 'Spirulina 500mg 120 comprimidos',      category: 'saude',  angle: 'bem_estar'        },
  { asin: 'B08W4LQXBT', name: 'Biotina 10000mcg para Cabelo e Unhas', category: 'saude',  angle: 'saude_preventiva' },
  { asin: 'B07X4GLPKM', name: 'Vitamina B12 1000mcg Sublingual',      category: 'saude',  angle: 'bem_estar'        },
  { asin: 'B09CKPQV2N', name: 'Glutamina em Pó 300g',                 category: 'saude',  angle: 'performance'      },
  { asin: 'B08MNPWQRV', name: 'Cúrcuma com Piperina 500mg',           category: 'saude',  angle: 'saude_intestinal' },

  // ── CASA ─────────────────────────────────────────────────────────────────
  { asin: 'B09HKD5VHX', name: 'Air Fryer 4L Digital',                 category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B07VX9W8WP', name: 'Cafeteira Expresso 15 Bar',            category: 'casa',   angle: 'ritual_diario'        },
  { asin: 'B087LTZW61', name: 'Chaleira Elétrica 1,7L',               category: 'casa',   angle: 'custo_beneficio'      },
  { asin: 'B08GSH9XMQ', name: 'Panela Antiaderente 28cm',             category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B09B2KXQPL', name: 'Purificador de Água Compacto',         category: 'casa',   angle: 'saude_em_casa'        },
  { asin: 'B08KFPBWQL', name: 'Umidificador de Ar Ultrassônico',      category: 'casa',   angle: 'bem_estar_em_casa'    },
  { asin: 'B07XLMBQPV', name: 'Aspirador Robô Wi-Fi',                 category: 'casa',   angle: 'praticidade_casa'     },
  { asin: 'B09C5HXQRM', name: 'Difusor de Aromas 400ml',              category: 'casa',   angle: 'bem_estar_em_casa'    },
  { asin: 'B08R4KXQPL', name: 'Fritadeira Elétrica sem Óleo 5,5L',   category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B07WPZQKLM', name: 'Mixer Vertical 600W Inox',             category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B09NXKQWPB', name: 'Panela de Pressão Elétrica 5L',        category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B08LVQXPNM', name: 'Ferro de Passar a Vapor 2400W',        category: 'casa',   angle: 'custo_beneficio'      },
  { asin: 'B07QLPXKMN', name: 'Liquidificador de Alta Potência 900W', category: 'casa',   angle: 'praticidade_cozinha'  },
  { asin: 'B09TQKWXVB', name: 'Ventilador de Torre com Timer',        category: 'casa',   angle: 'bem_estar_em_casa'    },
  { asin: 'B08PNQKXVL', name: 'Organizador de Gaveta Modulável',      category: 'casa',   angle: 'praticidade_casa'     },
  { asin: 'B09WKQXPNR', name: 'Esteira Elétrica Dobrável para Casa',  category: 'casa',   angle: 'saude_em_casa'        },
];

// ── Ângulos editoriais (evergreen) ───────────────────────────────────────────

const ANGLES = {
  // beleza
  skincare_basico:      'O básico que transforma: por que este produto entrou na rotina de tanta gente',
  cuidado_diario:       'A proteção diária que você não pode negligenciar',
  cuidado_capilar:      'O segredo dos cabelos saudáveis que poucos conhecem',
  anti_idade:           'Ingrediente ativo que age de verdade contra o envelhecimento precoce',
  limpeza_pele:         'Pele limpa é pele saudável: o ritual que muda tudo',
  ingrediente_ativo:    'Como um único ingrediente mudou a rotina de skincare de milhares de pessoas',
  custo_beneficio:      'Custo-benefício real: vale cada centavo investir neste produto',
  // saúde
  saude_preventiva:     'O hábito simples que faz diferença na sua saúde a longo prazo',
  bem_estar:            'Pequenas mudanças, grandes resultados no bem-estar diário',
  performance:          'Para quem leva a sério os resultados: o que este produto entrega',
  imunidade:            'Imunidade forte começa com suplementação inteligente',
  qualidade_sono:       'O sono que você merece começa com a suplementação certa',
  saude_intestinal:     'Saúde começa no intestino: o que a ciência diz sobre probióticos',
  // casa
  praticidade_cozinha:  'Menos tempo na cozinha, mais tempo para o que importa',
  praticidade_casa:     'A tecnologia que trabalha por você enquanto você descansa',
  ritual_diario:        'O ritual que começa o dia com o pé direito',
  saude_em_casa:        'Um investimento pequeno que protege toda a família',
  bem_estar_em_casa:    'Transformar o ambiente em que você vive transforma como você se sente',
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

function isTitleInPortuguese(title) {
  if (!title) return false;
  const spanishOnly = /\b(juego|el |los |las |del |una |unos |unas |también|además|después|entonces|cuando|donde|pero|sino|aunque|siempre|algo|alguien|nadie|todo|todos|cada|otro|otra|muy|más|menos|poco|mucho|grande|pequeño|mismo|misma|tamaño|precio|envío|gratis|nuevo|nueva|usado|usada)\b/i;
  const ptIndicators = /\b(para|com|sem|não|mais|menos|que|por|uma|uns|umas|também|além|depois|quando|onde|porque|mas|sempre|nunca|algo|alguém|ninguém|nada|tudo|todos|cada|outro|outra|cor|tamanho|tipo|preço|frete|grátis|novo|nova|produto|disponível|entrega|compra|oferta|promoção|cápsulas|comprimidos|pó|ml|mg|ui)\b/i;
  if (spanishOnly.test(title) && !ptIndicators.test(title)) return false;
  return true;
}

function getPillarForSlot(slotIndex) {
  const brt       = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const start     = new Date(brt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((brt - start) / 86400000);
  const offset    = dayOfYear % PILLARS.length;
  return PILLARS[(slotIndex + offset) % PILLARS.length];
}

function pickFromPool(pool, exclude = []) {
  const available = pool.filter(p => !exclude.includes(p.asin));
  if (available.length === 0) return null;
  const topN   = Math.min(3, available.length);
  return available[Math.floor(Math.random() * topN)];
}

function buildAmazonUrl(asin, tag) {
  return `https://www.amazon.com.br/dp/${asin}?tag=${tag}`;
}

function postHasRealImage(slug) {
  try {
    const mdPath = path.join(__dirname, '..', '..', 'src', 'content', 'blog', `${slug}.md`);
    if (!fs.existsSync(mdPath)) return true;
    const content = fs.readFileSync(mdPath, 'utf8');
    return !content.includes('placeholder.webp');
  } catch(_) {
    return true;
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60);
}

function runPost(affiliateUrl, productName, guardEnvVars) {
  const projectRoot = path.join(__dirname, '..', '..');
  log(`🚀 Executando: node scripts/novo-post.js "${affiliateUrl}"`);
  try {
    execSync(
      `node scripts/novo-post.js "${affiliateUrl}"`,
      {
        cwd:     projectRoot,
        stdio:   'pipe',
        timeout: 5 * 60 * 1000,
        env: { ...process.env, ...guardEnvVars, PRODUCT_NAME_HINT: productName || '' },
      }
    );
    log('✅ Post criado com sucesso!');
    return true;
  } catch (err) {
    const out    = (err.stdout || Buffer.alloc(0)).toString('utf8').trim();
    const errOut = (err.stderr || Buffer.alloc(0)).toString('utf8').trim();
    if (out)    out.split('\n').forEach(l => log('   ' + l));
    if (errOut) errOut.split('\n').forEach(l => log('🔴 ' + l));
    log(`❌ Erro ao criar post: ${err.message}`);
    return false;
  }
}

// ── Job principal ─────────────────────────────────────────────────────────────

async function runJob(forcePillar = null, slotIndex = 0) {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🤖 Agente + Trend Scout + Content Guard — AchadoCerto.VIP');
  log(`🏷️  Tag afiliada: ${AMAZON_TAG}`);

  const pillar   = forcePillar || getPillarForSlot(slotIndex);
  const history  = loadHistory();
  const excluded = [];

  // ── 1. TREND SCOUT ──
  log(`📈 Trend Scout: buscando bestsellers de "${pillar}"...`);
  const trending = await fetchTrendingProducts(pillar);
  if (trending.length > 0) {
    log(`   ✅ ${trending.length} produtos em alta encontrados`);
    trending.slice(0, 5).forEach((t, i) => log(`   #${i+1} [${t.asin}] ${t.name.slice(0,60)}`));
  } else {
    log('   ⚠️  Trend Scout indisponível — usando catálogo fixo');
  }

  // ── 2. Pool: trending > catálogo ──
  const catalogByPillar = AMAZON_CATALOG.filter(p => p.category === pillar);
  log(`   📦 Catálogo "${pillar}": ${catalogByPillar.length} produtos disponíveis`);

  let pool = mergeTrendingWithCatalog(trending, catalogByPillar, pillar, history, ANGLES);

  // ── FALLBACK DE EMERGÊNCIA: se pool ainda vazio, usa todo o catálogo do pilar ──
  if (pool.length === 0) {
    log('   ⚠️  mergeTrendingWithCatalog retornou vazio — ativando fallback de emergência');
    pool = [...catalogByPillar];
    log(`   🆘 Fallback: ${pool.length} produtos do catálogo direto (ignorando histórico)`);
  }

  if (pool.length === 0) {
    log(`❌ Pool vazio mesmo após fallback. Pilar "${pillar}" sem produtos no catálogo.`);
    return;
  }

  log(`🏁 Pool final: ${pool.length} produtos (trending → catálogo)`);

  // ── 3. Content Guard + Validação de idioma + Imagem ──
  for (let attempt = 1; attempt <= MAX_GUARD_RETRIES; attempt++) {
    const product = pickFromPool(pool, excluded);
    if (!product) { log('❌ Sem produtos disponíveis no pool.'); return; }

    const badge = product.isTrending ? ` 📈 [trending #${product.trendingRank}]` : ' [catálogo]';
    log(`\n🔍 Tentativa ${attempt}/${MAX_GUARD_RETRIES}: ${product.name}${badge}`);

    if (!isTitleInPortuguese(product.name)) {
      log(`🚫 Rejeitado: título fora do PT-BR — "${product.name}"`);
      excluded.push(product.asin);
      continue;
    }

    const angleDesc = ANGLES[product.angle] || product.angle;
    const guard = runContentGuard({ productName: product.name, pillar, angle: product.angle, angleDesc, history });

    guard.report.forEach(line => log(line));
    if (guard.warnings.length) guard.warnings.forEach(w => log(`   ${w}`));

    if (!guard.safe) {
      log(`🚫 Guard bloqueou tentativa ${attempt}: ${guard.blockers.join(' | ')}`);
      excluded.push(product.asin);
      if (attempt < MAX_GUARD_RETRIES) { log('🔁 Próximo produto...'); continue; }
      else log('⚠️  Máx de tentativas. Prosseguindo com aviso.');
    }

    const url = buildAmazonUrl(product.asin, AMAZON_TAG);
    log(`🎨 Pilar    : ${pillar.toUpperCase()}`);
    log(`🛒 Produto  : ${product.name}${badge}`);
    log(`🔗 URL      : ${url}`);
    log(`📐 Ângulo   : ${angleDesc}`);

    const success = runPost(url, product.name, guard.envVars);

    if (success) {
      const productSlug = slugify(product.name);
      if (!postHasRealImage(productSlug)) {
        log('⚠️  Post com placeholder.webp — BLOQUEANDO publicação!');
        try {
          const mdPath = path.join(__dirname, '..', '..', 'src', 'content', 'blog', `${productSlug}.md`);
          if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
          execSync('git reset --soft HEAD~1', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
          execSync('git restore --staged .', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
          log('♻️  Commit revertido.');
        } catch(e) { log(`⚠️  Não revertido: ${e.message}`); }
        excluded.push(product.asin);
        if (attempt < MAX_GUARD_RETRIES) continue;
        return;
      }
      recordPost(product.asin, product.name, url, product.category, guard, product.isTrending, history);
    }
    return;
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function startScheduler() {
  log('🕐 Agente iniciado — 08:00 | 12:00 | 18:00 (BRT)');
  log(`🏷️  Tag: ${AMAZON_TAG}  |  Pilares: ${PILLARS.join(' · ')}  |  Catálogo: ${AMAZON_CATALOG.length} produtos`);
  SCHEDULES.forEach((s, i) => log(`   ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}`));

  let lastRun = null;
  setInterval(() => {
    const brt  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const h = brt.getHours(), m = brt.getMinutes();
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
    const tr  = h.trending ? ' 📈' : '';
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
