#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts
 *
 * Age como um funcionário: escolhe um produto estratégico da Amazon BR
 * e dispara o gerador existente (novo-post.js) nos horários programados.
 *
 * NÃO altera o gerador. Só decide QUAL produto usar e QUANDO rodar.
 *
 * Uso:
 *   node scripts/agente.js              ← inicia em modo daemon (cron)
 *   node scripts/agente.js --agora      ← roda UMA vez imediatamente (teste)
 *   node scripts/agente.js --categoria tech  ← força categoria específica
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');

config({ path: path.join(ROOT, 'backend', '.env') });

// ═══════════════════════════════════════════════════════════════════
// TAG DE AFILIADO
// ═══════════════════════════════════════════════════════════════════

const AFFILIATE_TAG = 'altivita-20';

// Garante que qualquer URL Amazon sempre carregue a tag correta
function urlAfiliado(asin) {
  return `https://www.amazon.com.br/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

// ═══════════════════════════════════════════════════════════════════
// BANCO DE PRODUTOS — ASIN + Categoria
// Para adicionar: basta colocar o ASIN do produto (código da página Amazon)
// A tag altivita-20 é aplicada automaticamente em todos.
// ═══════════════════════════════════════════════════════════════════

const CATALOGO = [

  // ── TECH ───────────────────────────────────────────────────────
  { asin: 'B09G9FPHY6', categoria: 'tech'      }, // Echo Dot 5ª geração
  { asin: 'B09WZR9ZWR', categoria: 'tech'      }, // Kindle 11ª geração
  { asin: 'B0BPZQHXMK', categoria: 'tech'      }, // Fire TV Stick 4K
  { asin: 'B09G95H5L4', categoria: 'tech'      }, // Echo Show 5 3ª geração
  { asin: 'B07FZ8S74R', categoria: 'tech'      }, // Fone JBL Tune 510BT
  { asin: 'B0BTTV5JYR', categoria: 'tech'      }, // Fone Sony WH-1000XM5
  { asin: 'B0CG2G7YZX', categoria: 'tech'      }, // Smartwatch Amazfit GTS 4 Mini
  { asin: 'B09V3KXJPB', categoria: 'tech'      }, // Carregador sem fio 15W Anker
  { asin: 'B07PHPXHQS', categoria: 'tech'      }, // SSD Kingston A400 480GB
  { asin: 'B08L5TNJHG', categoria: 'tech'      }, // Pen Drive Sandisk 128GB USB-C

  // ── CASA ───────────────────────────────────────────────────────
  { asin: 'B09MVQGRWW', categoria: 'casa'      }, // Air Fryer Mondial AF-31
  { asin: 'B07Q3NGBYS', categoria: 'casa'      }, // Cafeteira Nespresso Essenza Mini
  { asin: 'B07WDSD7G2', categoria: 'casa'      }, // Liquidificador Arno Power Max
  { asin: 'B0BN6JQBND', categoria: 'casa'      }, // Garrafa Térmica Stanley 1L
  { asin: 'B09W2P9Q9V', categoria: 'casa'      }, // Aspirador robô Multilaser
  { asin: 'B08MVBQMT3', categoria: 'casa'      }, // Potes herméticos Lock&Lock
  { asin: 'B0B3DHQK7G', categoria: 'casa'      }, // Panelas antiaderente Tramontina
  { asin: 'B09FSBNFVG', categoria: 'casa'      }, // Umidificador de ar
  { asin: 'B07MHGT4SV', categoria: 'casa'      }, // Purificador água Electrolux PA21G
  { asin: 'B01N7LHVRO', categoria: 'casa'      }, // Jogo de cama Queen micropercal

  // ── ESPORTES ───────────────────────────────────────────────────
  { asin: 'B07QMTQKXB', categoria: 'esportes'  }, // Tapete de yoga Liveup
  { asin: 'B08GQ47RN8', categoria: 'esportes'  }, // Kit elásticos musculação
  { asin: 'B0B2RKN7QK', categoria: 'esportes'  }, // Corda de pular Speed Rope
  { asin: 'B09TXW8XMH', categoria: 'esportes'  }, // Garrafa squeeze 1L
  { asin: 'B0BFXNTMQL', categoria: 'esportes'  }, // Kettlebell ferro fundido 8kg
  { asin: 'B08HLFWWJW', categoria: 'esportes'  }, // Roda abdominal com apoio
  { asin: 'B09C5RKM2Y', categoria: 'esportes'  }, // Mini band kit 5 faixas

  // ── SAÚDE ──────────────────────────────────────────────────────
  { asin: 'B0BGV4KKVN', categoria: 'saude', nome: 'Creatina Growth 300g' }, // Creatina Growth 300g
  { asin: 'B09MTVRXHX', categoria: 'saude', nome: 'Vitamina D3 + K2 60 caps' }, // Vitamina D3 + K2 60 caps
  { asin: 'B08H93BGVB', categoria: 'saude', nome: 'Ômega 3 Fish Oil 120 caps' }, // Ômega 3 Fish Oil 120 caps
  { asin: 'B09W5PQKQZ', categoria: 'saude', nome: 'Colágeno Hidrolisado 300g' }, // Colágeno Hidrolisado 300g
  { asin: 'B0B9RKKL3M', categoria: 'saude', nome: 'Coenzima Q10 200mg' }, // Coenzima Q10 200mg
  { asin: 'B07MZK7QBF', categoria: 'saude', nome: 'Complexo B Premium' }, // Complexo B Premium
  { asin: 'B09NRRJ4CV', categoria: 'saude', nome: 'BCAA 2:1:1 200g Growth' }, // BCAA 2:1:1 200g Growth
  { asin: 'B0C1GK3DGH', categoria: 'saude', nome: 'Aparelho de pressão G-Tech' }, // Aparelho de pressão G-Tech

  // ── BELEZA ─────────────────────────────────────────────────────
  { asin: 'B09PVS9K32', categoria: 'beleza'    }, // Shampoo L'Oréal Hidra-Hialurônico
  { asin: 'B0BGJ24RFK', categoria: 'beleza'    }, // Secador Taiff 1900W
  { asin: 'B09B5FY3PQ', categoria: 'beleza'    }, // Protetor solar Neutrogena FPS60
  { asin: 'B07XK4NN1Y', categoria: 'beleza'    }, // Vitamina C sérum facial
  { asin: 'B0BQDP7Z9S', categoria: 'beleza'    }, // Máscara capilar Kérastase
  { asin: 'B08CXYMY14', categoria: 'beleza'    }, // Perfume Viktor&Rolf Flowerbomb
  { asin: 'B07B4R3W2L', categoria: 'beleza'    }, // Óleo de argan 60ml
  { asin: 'B09N5MRSQP', categoria: 'beleza'    }, // Hidratante corporal NIVEA 400ml

  // ── AUTOMOTIVO ─────────────────────────────────────────────────
  { asin: 'B07YB4H7HF', categoria: 'automotivo'}, // Suporte veicular celular
  { asin: 'B07QR4Q48K', categoria: 'automotivo'}, // Organizador porta-malas
  { asin: 'B07SJGWWTM', categoria: 'automotivo'}, // Tapete automotivo PVC
  { asin: 'B0BQNNBMDM', categoria: 'automotivo'}, // Carregador veicular USB-C 65W
  { asin: 'B08LCZ84WG', categoria: 'automotivo'}, // Câmera de ré visão noturna
  { asin: 'B07YWBWQ1Q', categoria: 'automotivo'}, // Cera líquida automotiva Turtle Wax

];

// Gera lista de produtos com URL afiliada pronta
const PRODUTOS = CATALOGO.map(p => ({
  ...p,
  url: urlAfiliado(p.asin),
}));

// ═══════════════════════════════════════════════════════════════════
// HORÁRIOS (Horário de Brasília)
// ═══════════════════════════════════════════════════════════════════

const AGENDA = [
  { hora: 8,  minuto: 0,  categoria: 'saude'      }, // manhã: saúde
  { hora: 12, minuto: 0,  categoria: 'tech'        }, // meio-dia: tech
  { hora: 18, minuto: 30, categoria: 'casa'        }, // fim de tarde: casa
  // Descomente para mais rodadas:
  // { hora: 10, minuto: 0,  categoria: 'esportes'  },
  // { hora: 15, minuto: 0,  categoria: 'beleza'    },
  // { hora: 21, minuto: 0,  categoria: 'automotivo'},
];

// ═══════════════════════════════════════════════════════════════════
// HISTÓRICO — evita repetir produto nos últimos 30 dias
// ═══════════════════════════════════════════════════════════════════

const HISTORY_PATH = path.join(ROOT, 'data', 'agente-historico.json');

function carregarHistorico() {
  try {
    if (!fs.existsSync(HISTORY_PATH)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch { return []; }
}

function salvarHistorico(historico) {
  const dir = path.dirname(HISTORY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(historico.slice(-500), null, 2));
}

function foiUsadoRecentemente(asin) {
  const historico = carregarHistorico();
  const limite    = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return historico.some(h => h.asin === asin && new Date(h.data).getTime() > limite);
}

function registrarUso(asin, categoria) {
  const historico = carregarHistorico();
  historico.push({ asin, categoria, data: new Date().toISOString() });
  salvarHistorico(historico);
}

// ═══════════════════════════════════════════════════════════════════
// SELEÇÃO ESTRATÉGICA
// ═══════════════════════════════════════════════════════════════════

function selecionarProduto(categoria) {
  const pool = PRODUTOS.filter(p => p.categoria === categoria && !foiUsadoRecentemente(p.asin));

  if (pool.length === 0) {
    log(`⚠️  Todos os produtos de [${categoria}] usados recentemente. Reutilizando o mais antigo.`);
    const todos = PRODUTOS.filter(p => p.categoria === categoria);
    if (!todos.length) { log(`❌ Nenhum produto para [${categoria}]`); return null; }
    return todos[Math.floor(Math.random() * todos.length)];
  }

  const candidatos = pool.slice(0, Math.min(4, pool.length));
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

// ═══════════════════════════════════════════════════════════════════
// LOG + EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════

function log(msg) {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[${ts}] ${msg}`);
}

async function rodarGerador(produto) {
  const { url, asin, categoria, nome } = produto;
  log(`🚀 Categoria: ${categoria} | ASIN: ${asin}`);
  log(`🔗 URL afiliada: ${url}`);

  const comando = `node scripts/novo-post.js "${url}"`;
  log(`⚙️  Executando: ${comando}`);

  try {
    execSync(comando, {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 120000,
      env: { ...process.env, PRODUCT_NAME_HINT: nome || '' },
    });
    registrarUso(asin, categoria);
    log(`✅ Post criado! [${categoria}]`);
    return true;
  } catch (err) {
    log(`❌ Erro: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// DAEMON — verifica horários a cada 30s
// ═══════════════════════════════════════════════════════════════════

const tarefasRodadas = new Set();

function verificarAgenda() {
  const agora  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hora   = agora.getHours();
  const minuto = agora.getMinutes();
  const dia    = agora.toDateString();

  for (const item of AGENDA) {
    const chave = `${dia}-${item.hora}-${item.minuto}-${item.categoria}`;
    if (item.hora === hora && item.minuto === minuto && !tarefasRodadas.has(chave)) {
      tarefasRodadas.add(chave);
      const produto = selecionarProduto(item.categoria);
      if (produto) rodarGerador(produto);
    }
  }

  for (const k of tarefasRodadas) {
    if (!k.startsWith(dia)) tarefasRodadas.delete(k);
  }
}

// ═══════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

const args    = process.argv.slice(2);
const modoNow = args.includes('--agora');
const idxCat  = args.indexOf('--categoria');
const catForc = idxCat >= 0 ? args[idxCat + 1] : null;

if (modoNow || catForc) {
  const cat = catForc || AGENDA[0].categoria;
  log(`🧪 Modo manual — categoria: ${cat}`);
  const produto = selecionarProduto(cat);
  if (produto) {
    log(`🔗 Selecionado: ${produto.url}`);
    rodarGerador(produto).then(ok => process.exit(ok ? 0 : 1));
  } else {
    log('Nenhum produto disponível.');
    process.exit(1);
  }
} else {
  log('🤖 Agente AchadoCerto.VIP iniciado — tag: altivita-20');
  log('📅 Agenda:');
  AGENDA.forEach(a => log(`   ${String(a.hora).padStart(2,'0')}:${String(a.minuto).padStart(2,'0')} BRT → ${a.categoria}`));
  log(`📦 ${PRODUTOS.length} produtos | tag: ${AFFILIATE_TAG}`);
  log('Ctrl+C para parar.');
  setInterval(verificarAgenda, 30000);
  verificarAgenda();
}
