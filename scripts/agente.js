#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts
 *
 * O agente age como um funcionário: escolhe um produto estratégico
 * e dispara o gerador existente (novo-post.js) nos horários programados.
 *
 * NÃO altera o gerador. Só decide QUAL produto usar e QUANDO rodar.
 *
 * Uso:
 *   node scripts/agente.js              ← inicia em modo daemon (cron)
 *   node scripts/agente.js --agora      ← roda UMA vez imediatamente (teste)
 *   node scripts/agente.js --categoria tech  ← força uma categoria específica
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
// BANCO DE PRODUTOS — Edite aqui para adicionar/remover produtos
// Formato: { url, categoria }
//
// IMPORTANTE: use URLs completas de qualquer plataforma.
// O novo-post.js detecta ML, Amazon e Magalu automaticamente.
// ═══════════════════════════════════════════════════════════════════

const PRODUTOS = [

  // ── TECH ───────────────────────────────────────────────────────
  { url: 'https://www.mercadolivre.com.br/fone-bluetooth-jbl-tune-520bt/p/MLB28803428',      categoria: 'tech' },
  { url: 'https://www.mercadolivre.com.br/suporte-monitor-de-mesa-articulado/p/MLB22039803', categoria: 'tech' },
  { url: 'https://www.mercadolivre.com.br/webcam-full-hd-1080p-com-microfone/p/MLB20453882', categoria: 'tech' },
  { url: 'https://www.mercadolivre.com.br/teclado-mecanico-gamer-com-fio-usb/p/MLB21834773', categoria: 'tech' },
  { url: 'https://www.mercadolivre.com.br/caixa-de-som-bluetooth-jbl-go-3/p/MLB16665940',    categoria: 'tech' },
  { url: 'https://www.mercadolivre.com.br/cabo-usb-c-carregamento-rapido-2m/p/MLB24601052',  categoria: 'tech' },
  { url: 'https://www.mercadolivre.com.br/powerbank-10000mah-carregador-portatil/p/MLB21714989', categoria: 'tech' },

  // ── CASA ───────────────────────────────────────────────────────
  { url: 'https://www.mercadolivre.com.br/air-fryer-fritadeira-sem-oleo-4-litros/p/MLB21714990', categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/cafeteira-expresso-3-coracoes/p/MLB21835001',          categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/organizador-multiuso-para-cozinha/p/MLB18012345',      categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/garrafa-termica-de-1-litro-inox/p/MLB14912345',        categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/liquidificador-voltagem-dupla/p/MLB16612345',          categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/jogo-de-panelas-antiaderente-5-pecas/p/MLB19912345',   categoria: 'casa' },

  // ── ESPORTES ───────────────────────────────────────────────────
  { url: 'https://www.mercadolivre.com.br/tapete-de-yoga-em-borracha-natural/p/MLB21012345',     categoria: 'esportes' },
  { url: 'https://www.mercadolivre.com.br/elastico-de-musculacao-kit-5-faixas/p/MLB22012345',    categoria: 'esportes' },
  { url: 'https://www.mercadolivre.com.br/corda-de-pular-speed-rope-profissional/p/MLB17012345', categoria: 'esportes' },
  { url: 'https://www.mercadolivre.com.br/garrafa-de-agua-academia-squeeze-1l/p/MLB18512345',    categoria: 'esportes' },

  // ── SAÚDE ──────────────────────────────────────────────────────
  { url: 'https://www.magazineluiza.com.br/suplemento-vitamina-d-2000ui/p/123456789/sa/vi/', categoria: 'saude' },
  { url: 'https://www.mercadolivre.com.br/colageno-hidrolisado-300g/p/MLB23012345',          categoria: 'saude' },
  { url: 'https://www.mercadolivre.com.br/vitamina-c-1000mg-60-capsulas/p/MLB24012345',      categoria: 'saude' },

  // ── BELEZA ─────────────────────────────────────────────────────
  { url: 'https://www.mercadolivre.com.br/mascara-capilar-hidratacao-500g/p/MLB25012345',  categoria: 'beleza' },
  { url: 'https://www.mercadolivre.com.br/escova-progressiva-profissional/p/MLB26012345',  categoria: 'beleza' },

  // ── AUTOMOTIVO ─────────────────────────────────────────────────
  { url: 'https://www.mercadolivre.com.br/suporte-veicular-para-celular/p/MLB27012345',         categoria: 'automotivo' },
  { url: 'https://www.mercadolivre.com.br/organizador-de-porta-malas-automotivo/p/MLB28012345', categoria: 'automotivo' },

];

// ═══════════════════════════════════════════════════════════════════
// HORÁRIOS (Horário de Brasília)
// ═══════════════════════════════════════════════════════════════════

const AGENDA = [
  { hora: 8,  minuto: 0,  categoria: 'tech'    },
  { hora: 12, minuto: 30, categoria: 'casa'     },
  { hora: 18, minuto: 0,  categoria: 'esportes' },
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
    log(`⚠️  Todos os produtos de [${categoria}] já foram usados. Reutilizando o mais antigo.`);
    const todos = PRODUTOS.filter(p => p.categoria === categoria);
    if (todos.length === 0) { log(`❌ Nenhum produto cadastrado para [${categoria}]`); return null; }
    return todos[Math.floor(Math.random() * todos.length)];
  }

  // Sorteia entre os top 3 disponíveis para variar
  const candidatos = pool.slice(0, Math.min(3, pool.length));
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
  log(`🔗 URL: ${url}`);

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
    rodarGerador(produto).then(ok => process.exit(ok ? 0 : 1));
  } else {
    log('Nenhum produto disponível para essa categoria.');
    process.exit(1);
  }
} else {
  log('🤖 Agente iniciado em modo daemon.');
  log('📅 Agenda:');
  AGENDA.forEach(a => log(`   ${String(a.hora).padStart(2,'0')}:${String(a.minuto).padStart(2,'0')} BRT → ${a.categoria}`));
  log('Pressione Ctrl+C para parar.');
  setInterval(verificarAgenda, 30000);
  verificarAgenda();
}
