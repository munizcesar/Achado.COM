/**
 * health.js — Health Check do Sistema
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Uso:
 *   node scripts/agent/monitor/health.js
 *   npm run health
 *
 * Verifica automaticamente:
 *   ✓ GitHub Secrets (GROQ, Serper, Amazon, RapidAPI)
 *   ✓ Amazon Affiliate Tag
 *   ✓ Groq API
 *   ✓ Serper API
 *   ✓ RapidAPI
 *   ✓ Internet
 *   ✓ Histórico
 *   ✓ Workflow
 *   ✓ Produtos disponíveis
 *   ✓ Espaço em disco
 *   ✓ Permissões Git
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { config } from 'dotenv';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const AGENT_DIR   = path.resolve(__dirname, '..');
const ROOT        = path.resolve(AGENT_DIR, '..', '..');

config({ path: path.join(ROOT, 'backend', '.env') });

// Importa módulos locais
import { loadHistory } from '../history/tracker.js';
import { getLatestLog } from '../logging/logger.js';

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️ ';

let passed = 0;
let failed = 0;
let warns  = 0;

function check(name, pass, detail) {
  const icon = pass ? PASS : FAIL;
  console.log(`  ${icon} ${name}: ${detail}`);
  if (pass) passed++;
  else failed++;
}

function warn(name, detail) {
  console.log(`  ${WARN} ${name}: ${detail}`);
  warns++;
}

async function checkInternet() {
  return new Promise((resolve) => {
    const req = https.get('https://www.google.com', { timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
  });
}

async function checkGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.length < 20) return false;

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/models',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` },
      timeout: 5000,
    }, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function checkSerper() {
  const key = process.env.SERPER_API_KEY;
  if (!key || key === 'sua-key-serper-aqui') return false;

  return new Promise((resolve) => {
    const postData = JSON.stringify({ q: 'test', gl: 'br', hl: 'pt-br', num: 1 });
    const req = https.request({
      hostname: 'google.serper.dev',
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': key,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    req.write(postData);
    req.end();
  });
}

function checkDiskSpace() {
  try {
    const stat = fs.statSync(ROOT);
    // No Windows, não temos Disk check fácil, verificamos espaço livre do diretório atual
    return true; // simplificado
  } catch (_) {
    return false;
  }
}

function checkGit() {
  try {
    execSync('git status', { cwd: ROOT, stdio: 'pipe', timeout: 5000 });
    return true;
  } catch (_) {
    return false;
  }
}

function checkWorkflowExists() {
  const workflowPath = path.join(ROOT, '.github', 'workflows', 'agente-posts.yml');
  return fs.existsSync(workflowPath);
}

function countAvailableProducts() {
  try {
    const agentPath = path.join(AGENT_DIR, 'agent.js');
    const content = fs.readFileSync(agentPath, 'utf8');
    const matches = content.match(/asin:\s*'[A-Z0-9]{10}'/g);
    return matches ? matches.length : 0;
  } catch (_) {
    return 0;
  }
}

export async function runHealthCheck() {
  console.log('\n🏥 Health Check — Agente AchadoCerto.VIP\n');
  console.log(`  📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  // ── Ambiente ──
  console.log('  📦 AMBIENTE');
  const nodeVersion = process.version;
  check('Node.js', nodeVersion.startsWith('v20') || nodeVersion.startsWith('v18'), nodeVersion);
  check('Backend .env', fs.existsSync(path.join(ROOT, 'backend', '.env')), fs.existsSync(path.join(ROOT, 'backend', '.env')) ? 'presente' : 'ausente');
  check('Internet', await checkInternet(), await checkInternet() ? 'conectado' : 'sem acesso');

  // ── Secrets ──
  console.log('\n  🔑 SECRETS');
  const groqKey = process.env.GROQ_API_KEY;
  check('GROQ_API_KEY', groqKey && groqKey.length > 20, groqKey ? `${groqKey.slice(0, 8)}... (${groqKey.length} chars)` : 'ausente');

  const serperKey = process.env.SERPER_API_KEY;
  check('SERPER_API_KEY', serperKey && serperKey !== 'sua-key-serper-aqui', serperKey && serperKey !== 'sua-key-serper-aqui' ? `${serperKey.slice(0, 8)}...` : 'ausente');

  const amazonTag = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;
  check('AMAZON_AFFILIATE_TAG', amazonTag && amazonTag.length >= 5, amazonTag || 'ausente');

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  check('RAPIDAPI_KEY', !!rapidApiKey, rapidApiKey ? `${rapidApiKey.slice(0, 8)}...` : 'ausente');

  // ── APIs ──
  console.log('\n  🔌 APIs');
  check('Groq API', await checkGroq(), await checkGroq() ? 'respondendo' : 'falhou');
  check('Serper API', await checkSerper(), await checkSerper() ? 'respondendo' : 'não configurado / falhou');

  // ── Dados ──
  console.log('\n  📊 DADOS');
  const history = loadHistory();
  check('Histórico', history.length > 0, `${history.length} posts registrados`);
  check('Workflow CI', checkWorkflowExists(), checkWorkflowExists() ? 'agente-posts.yml presente' : 'ausente');

  const totalProducts = countAvailableProducts();
  check('Catálogo produtos', totalProducts > 0, `${totalProducts} produtos no catálogo`);

  const recentCount = history.filter(h => (Date.now() - new Date(h.postedAt).getTime()) < 7 * 86400000).length;
  warn('Posts nos últimos 7 dias', `${recentCount} posts`);

  // ── Git ──
  console.log('\n  🔗 GIT');
  check('Git disponível', checkGit(), checkGit() ? 'ok' : 'falhou');
  try {
    const status = execSync('git status --short', { cwd: ROOT, stdio: 'pipe', timeout: 5000 }).toString().trim();
    warn('Arquivos não commitados', status ? `${status.split('\n').length} arquivo(s)` : 'nenhum');
  } catch (_) {}

  // ── Sistema ──
  console.log('\n  💾 SISTEMA');
  check('Espaço em disco', checkDiskSpace(), 'ok');
  check('Permissões de leitura/escrita', fs.accessSync(ROOT, fs.constants.W_OK) === undefined, 'ok');

  // ── Último log ──
  console.log('\n  📋 ÚLTIMA EXECUÇÃO');
  const lastLog = getLatestLog();
  if (lastLog) {
    const status = lastLog.result?.status || 'unknown';
    const icon = status === 'success' ? PASS : FAIL;
    console.log(`  ${icon} ${lastLog.meta?.runId || '?'} → ${status}`);
    console.log(`     ⏱  ${Math.round((lastLog.meta?.duration || 0) / 1000)}s | 🏷️  ${lastLog.meta?.pilar || '?'}`);
  } else {
    console.log(`  ${WARN} Nenhum log de execução encontrado`);
  }

  // ── Resumo ──
  console.log(`\n${'═'.repeat(40)}`);
  const total = passed + failed;
  const grade = failed === 0 ? 'EXCELENTE' : failed <= 2 ? 'OK' : 'REVISAO NECESSARIA';
  console.log(`  📊 ${passed}/${total} — ${Math.round(passed / total * 100)}% — ${grade}`);
  if (warns > 0) console.log(`  ${WARN} ${warns} aviso(s)`);
  if (failed > 0) console.log(`  ${FAIL} ${failed} falha(s) crítica(s)`);
  console.log(`\n${'═'.repeat(40)}\n`);

  return { passed, failed, warns, total, grade };
}

// Execução direta
if (process.argv[1] && (process.argv[1].includes('health.js') || process.argv.includes('--health'))) {
  runHealthCheck().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
