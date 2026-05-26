#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts
 *
 * Age como um funcionário: escolhe um produto estratégico do Mercado Livre
 * com link de afiliado válido e dispara o gerador existente (novo-post.js) nos horários programados.
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
// BANCO DE PRODUTOS — Mercado Livre com link de afiliado válido
// Usa apenas produtos configurados em data/produtos-afiliados.json
// ═══════════════════════════════════════════════════════════════════

function carregarProdutosAfiliados() {
  const filePath = path.join(ROOT, 'data', 'produtos-afiliados.json');
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.produtos)) return [];

    return data.produtos
      .map(prod => ({
        id: prod.id,
        asin: prod.id,
        titulo: prod.nome || prod.titulo || prod.id,
        categoria: prod.categoria || 'casa',
        url: prod.linkAfiliado ? prod.linkAfiliado.trim() : '',
        nome: prod.nome || prod.titulo || prod.id,
      }))
      .filter(prod => prod.url && prod.url.length > 0);
  } catch (err) {
    console.log('   ⚠️  Erro ao carregar produtos afiliados:', err.message);
    return [];
  }
}

const PRODUTOS = carregarProdutosAfiliados();

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
