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
 *
 * IMPORTANTE: todos os links são Amazon BR (amzn.to ou amazon.com.br).
 * Para adicionar produtos: copie seu link de afiliado e cole aqui.
 * Formato do link afiliado Amazon: https://amzn.to/XXXXXXX
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
// BANCO DE PRODUTOS — Apenas Amazon BR
//
// Adicione seus links de afiliado Amazon aqui.
// Use sempre o link curto gerado pelo SiteStripe (amzn.to/...)
// ou o link longo com sua tag (amazon.com.br/dp/ASIN?tag=suatag-20)
//
// Categorias disponíveis:
//   tech | casa | esportes | saude | beleza | automotivo
// ═══════════════════════════════════════════════════════════════════

const PRODUTOS = [

  // ── TECH ───────────────────────────────────────────────────────
  { url: 'https://www.amazon.com.br/dp/B09G9FPHY6',  categoria: 'tech' }, // Echo Dot 5ª geração
  { url: 'https://www.amazon.com.br/dp/B09WZR9ZWR',  categoria: 'tech' }, // Kindle 11ª geração
  { url: 'https://www.amazon.com.br/dp/B0BPZQHXMK',  categoria: 'tech' }, // Fire TV Stick 4K
  { url: 'https://www.amazon.com.br/dp/B09G95H5L4',  categoria: 'tech' }, // Echo Show 5 3ª geração
  { url: 'https://www.amazon.com.br/dp/B07FZ8S74R',  categoria: 'tech' }, // Fone JBL Tune 510BT
  { url: 'https://www.amazon.com.br/dp/B0BTTV5JYR',  categoria: 'tech' }, // Fone Sony WH-1000XM5
  { url: 'https://www.amazon.com.br/dp/B0CG2G7YZX',  categoria: 'tech' }, // Smartwatch Amazfit GTS 4 Mini
  { url: 'https://www.amazon.com.br/dp/B09V3KXJPB',  categoria: 'tech' }, // Carregador sem fio 15W Anker
  { url: 'https://www.amazon.com.br/dp/B07PHPXHQS',  categoria: 'tech' }, // SSD Kingston A400 480GB
  { url: 'https://www.amazon.com.br/dp/B08L5TNJHG',  categoria: 'tech' }, // Pen Drive Sandisk 128GB USB-C

  // ── CASA ───────────────────────────────────────────────────────
  { url: 'https://www.amazon.com.br/dp/B09MVQGRWW',  categoria: 'casa' }, // Air Fryer Mondial AF-31
  { url: 'https://www.amazon.com.br/dp/B07Q3NGBYS',  categoria: 'casa' }, // Cafeteira Nespresso Essenza Mini
  { url: 'https://www.amazon.com.br/dp/B07WDSD7G2',  categoria: 'casa' }, // Liquidificador Arno Power Max
  { url: 'https://www.amazon.com.br/dp/B0BN6JQBND',  categoria: 'casa' }, // Garrafa Térmica Stanley 1L
  { url: 'https://www.amazon.com.br/dp/B09W2P9Q9V',  categoria: 'casa' }, // Aspirador de pó robô Multilaser
  { url: 'https://www.amazon.com.br/dp/B08MVBQMT3',  categoria: 'casa' }, // Conjunto de potes herméticos Lock&Lock
  { url: 'https://www.amazon.com.br/dp/B0B3DHQK7G',  categoria: 'casa' }, // Jogo de panelas antiaderente Tramontina
  { url: 'https://www.amazon.com.br/dp/B09FSBNFVG',  categoria: 'casa' }, // Umidificador de ar ultrassônico
  { url: 'https://www.amazon.com.br/dp/B07MHGT4SV',  categoria: 'casa' }, // Purificador de água Electrolux PA21G
  { url: 'https://www.amazon.com.br/dp/B01N7LHVRO',  categoria: 'casa' }, // Jogo de cama Queen micropercal

  // ── ESPORTES ───────────────────────────────────────────────────
  { url: 'https://www.amazon.com.br/dp/B07QMTQKXB',  categoria: 'esportes' }, // Tapete de yoga Liveup
  { url: 'https://www.amazon.com.br/dp/B08GQ47RN8',  categoria: 'esportes' }, // Kit elásticos de musculação
  { url: 'https://www.amazon.com.br/dp/B0B2RKN7QK',  categoria: 'esportes' }, // Corda de pular Speed Rope
  { url: 'https://www.amazon.com.br/dp/B09TXW8XMH',  categoria: 'esportes' }, // Garrafa squeeze academia 1L
  { url: 'https://www.amazon.com.br/dp/B0BFXNTMQL',  categoria: 'esportes' }, // Kettlebell de ferro fundido 8kg
  { url: 'https://www.amazon.com.br/dp/B08HLFWWJW',  categoria: 'esportes' }, // Roda abdominal com apoio
  { url: 'https://www.amazon.com.br/dp/B09C5RKM2Y',  categoria: 'esportes' }, // Mini band kit 5 faixas de resistência

  // ── SAÚDE ──────────────────────────────────────────────────────
  { url: 'https://www.amazon.com.br/dp/B09MVKL9BZ',  categoria: 'saude' }, // Whey Protein Growth 900g chocolate
  { url: 'https://www.amazon.com.br/dp/B0BGV4KKVN',  categoria: 'saude' }, // Creatina Monohidratada Growth 300g
  { url: 'https://www.amazon.com.br/dp/B09MTVRXHX',  categoria: 'saude' }, // Vitamina D3 + K2 60 cápsulas
  { url: 'https://www.amazon.com.br/dp/B08H93BGVB',  categoria: 'saude' }, // Ômega 3 Fish Oil 1000mg 120 caps
  { url: 'https://www.amazon.com.br/dp/B09W5PQKQZ',  categoria: 'saude' }, // Colágeno Hidrolisado 300g Nutrify
  { url: 'https://www.amazon.com.br/dp/B0B9RKKL3M',  categoria: 'saude' }, // Coenzima Q10 200mg 60 cápsulas
  { url: 'https://www.amazon.com.br/dp/B07MZK7QBF',  categoria: 'saude' }, // Complexo B Premium 60 cápsulas
  { url: 'https://www.amazon.com.br/dp/B09NRRJ4CV',  categoria: 'saude' }, // BCAA 2:1:1 200g Growth Supplements
  { url: 'https://www.amazon.com.br/dp/B0C1GK3DGH',  categoria: 'saude' }, // Aparelho de pressão digital G-Tech

  // ── BELEZA ─────────────────────────────────────────────────────
  { url: 'https://www.amazon.com.br/dp/B09PVS9K32',  categoria: 'beleza' }, // Shampoo L'Oréal Elseve Hidra-Hialurônico
  { url: 'https://www.amazon.com.br/dp/B0BGJ24RFK',  categoria: 'beleza' }, // Secador Taiff Plástico Style 1900W
  { url: 'https://www.amazon.com.br/dp/B09B5FY3PQ',  categoria: 'beleza' }, // Protetor solar Neutrogena FPS60
  { url: 'https://www.amazon.com.br/dp/B07XK4NN1Y',  categoria: 'beleza' }, // Vitamina C sérum facial Needs
  { url: 'https://www.amazon.com.br/dp/B0BQDP7Z9S',  categoria: 'beleza' }, // Máscara capilar Kérastase Nutritive
  { url: 'https://www.amazon.com.br/dp/B08CXYMY14',  categoria: 'beleza' }, // Perfume Viktor&Rolf Flowerbomb EDP
  { url: 'https://www.amazon.com.br/dp/B07B4R3W2L',  categoria: 'beleza' }, // Óleo de argan puro 60ml Vou Cuidar
  { url: 'https://www.amazon.com.br/dp/B09N5MRSQP',  categoria: 'beleza' }, // Hidratante corporal NIVEA 400ml

  // ── AUTOMOTIVO ─────────────────────────────────────────────────
  { url: 'https://www.amazon.com.br/dp/B07YB4H7HF',  categoria: 'automotivo' }, // Suporte veicular celular para painel
  { url: 'https://www.amazon.com.br/dp/B07QR4Q48K',  categoria: 'automotivo' }, // Organizador de porta-malas dobrável
  { url: 'https://www.amazon.com.br/dp/B07SJGWWTM',  categoria: 'automotivo' }, // Tapete automotivo PVC universal
  { url: 'https://www.amazon.com.br/dp/B0BQNNBMDM',  categoria: 'automotivo' }, // Carregador veicular USB-C 65W
  { url: 'https://www.amazon.com.br/dp/B08LCZ84WG',  categoria: 'automotivo' }, // Câmera de ré com visão noturna
  { url: 'https://www.amazon.com.br/dp/B07YWBWQ1Q',  categoria: 'automotivo' }, // Cera líquida automotiva Turtle Wax

];

// ═══════════════════════════════════════════════════════════════════
// HORÁRIOS (Horário de Brasília)
// Varie as categorias para não concentrar temas no mesmo dia.
// ═══════════════════════════════════════════════════════════════════

const AGENDA = [
  { hora: 8,  minuto: 0,  categoria: 'saude'      }, // manhã: saúde/suplementos
  { hora: 12, minuto: 0,  categoria: 'tech'        }, // meio-dia: tecnologia
  { hora: 18, minuto: 30, categoria: 'casa'        }, // fim de tarde: casa/cozinha
  // Descomente para adicionar mais rodadas:
  // { hora: 21, minuto: 0,  categoria: 'beleza'    },
  // { hora: 10, minuto: 0,  categoria: 'esportes'  },
  // { hora: 15, minuto: 0,  categoria: 'automotivo'},
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

function foiUsadoRecentemente(url) {
  const historico = carregarHistorico();
  const limite    = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return historico.some(h => h.url === url && new Date(h.data).getTime() > limite);
}

function registrarUso(url, categoria) {
  const historico = carregarHistorico();
  historico.push({ url, categoria, data: new Date().toISOString() });
  salvarHistorico(historico);
}

// ═══════════════════════════════════════════════════════════════════
// SELEÇÃO ESTRATÉGICA DE PRODUTO
// ═══════════════════════════════════════════════════════════════════

function selecionarProduto(categoria) {
  const pool = PRODUTOS.filter(p => p.categoria === categoria && !foiUsadoRecentemente(p.url));

  if (pool.length === 0) {
    log(`⚠️  Todos os produtos de [${categoria}] já foram usados recentemente. Reutilizando o mais antigo.`);
    const todos = PRODUTOS.filter(p => p.categoria === categoria);
    if (todos.length === 0) { log(`❌ Nenhum produto cadastrado para [${categoria}]`); return null; }
    return todos[Math.floor(Math.random() * todos.length)];
  }

  // Sorteia entre os disponíveis para variar
  const candidatos = pool.slice(0, Math.min(4, pool.length));
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

// ═══════════════════════════════════════════════════════════════════
// EXECUÇÃO DO GERADOR
// ═══════════════════════════════════════════════════════════════════

function log(msg) {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[${ts}] ${msg}`);
}

async function rodarGerador(produto) {
  const { url, categoria } = produto;
  log(`🚀 Iniciando gerador — categoria: ${categoria}`);
  log(`🔗 URL Amazon: ${url}`);

  const comando = `node scripts/novo-post.js "${url}"`;
  log(`⚙️  Executando: ${comando}`);

  try {
    execSync(comando, { cwd: ROOT, stdio: 'inherit', timeout: 120000 });
    registrarUso(url, categoria);
    log(`✅ Post criado com sucesso! [${categoria}]`);
    return true;
  } catch (err) {
    log(`❌ Erro ao executar o gerador: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODO DAEMON — verifica horários a cada 30 segundos
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

  // Limpa tarefas de dias anteriores
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
  log(`🧪 Modo manual — rodando agora com categoria: ${cat}`);
  const produto = selecionarProduto(cat);
  if (produto) {
    log(`🔗 Produto selecionado: ${produto.url}`);
    rodarGerador(produto).then(ok => process.exit(ok ? 0 : 1));
  } else {
    log('Nenhum produto disponível para essa categoria.');
    process.exit(1);
  }
} else {
  log('🤖 Agente AchadoCerto.VIP iniciado em modo daemon (Amazon BR).');
  log('📅 Agenda:');
  AGENDA.forEach(a => log(`   ${String(a.hora).padStart(2,'0')}:${String(a.minuto).padStart(2,'0')} BRT → ${a.categoria}`));
  log(`📦 ${PRODUTOS.length} produtos cadastrados em ${[...new Set(PRODUTOS.map(p=>p.categoria))].join(', ')}`);
  log('Pressione Ctrl+C para parar.');
  setInterval(verificarAgenda, 30000);
  verificarAgenda();
}
