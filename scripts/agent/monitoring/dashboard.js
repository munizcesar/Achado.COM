#!/usr/bin/env node
/**
 * dashboard.js — Dashboard de Observabilidade (HTML)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Gera um dashboard HTML com indicadores:
 *   - Taxa de sucesso (diária, semanal)
 *   - Tempo médio por etapa
 *   - Causas de falha
 *   - Número de publicações por dia
 *   - Status dos circuit breakers
 *   - Fonte utilizada (puppeteer, http, serper, etc.)
 *   - Dead Letter Queue
 *
 * Uso:
 *   node scripts/agent/monitoring/dashboard.js
 *   # Gera agent-dashboard.html na raiz do projeto
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const AGENT_DIR   = path.resolve(__dirname, '..');
const ROOT        = path.resolve(AGENT_DIR, '..', '..');

function loadMetrics() {
  try {
    const metricsFile = path.join(AGENT_DIR, 'metrics', 'metrics.json');
    if (fs.existsSync(metricsFile)) {
      return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function loadDeadLetter() {
  try {
    const dlqFile = path.join(AGENT_DIR, 'history', 'dead-letter-queue.json');
    if (fs.existsSync(dlqFile)) {
      return JSON.parse(fs.readFileSync(dlqFile, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function loadRecentLogs() {
  try {
    const logsDir = path.join(AGENT_DIR, 'logs');
    if (!fs.existsSync(logsDir)) return [];
    const dates = fs.readdirSync(logsDir).sort().reverse().slice(0, 7);
    const logs = [];
    for (const dateDir of dates) {
      const dirPath = path.join(logsDir, dateDir);
      if (!fs.statSync(dirPath).isDirectory()) continue;
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort().reverse();
      for (const file of files) {
        try {
          logs.push(JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8')));
        } catch (_) {}
        if (logs.length >= 50) break;
      }
      if (logs.length >= 50) break;
    }
    return logs;
  } catch (_) { return []; }
}

function getSuccessRate(metrics, days) {
  const cutoff = Date.now() - days * 86400000;
  const recent = metrics.filter(m => new Date(m.startedAt).getTime() > cutoff);
  if (recent.length === 0) return { rate: 0, total: 0 };
  const passed = recent.filter(m => m.result?.status === 'success').length;
  return { rate: Math.round((passed / recent.length) * 100), total: recent.length, passed };
}

/**
 * Gera o dashboard HTML.
 */
export function generateDashboard() {
  const metrics = loadMetrics();
  const dlq = loadDeadLetter();
  const logs = loadRecentLogs();

  const daily = getSuccessRate(metrics, 1);
  const weekly = getSuccessRate(metrics, 7);

  // Falhas por causa
  const failReasons = {};
  for (const m of metrics) {
    if (m.result?.status !== 'success' && m.result?.error) {
      const key = m.result.error.slice(0, 60);
      failReasons[key] = (failReasons[key] || 0) + 1;
    }
  }

  // Fontes utilizadas
  const sources = {};
  for (const m of metrics) {
    for (const stage of (m.stages || [])) {
      if (stage.source) {
        sources[stage.source] = (sources[stage.source] || 0) + 1;
      }
    }
  }

  // Publicações por dia
  const byDay = {};
  for (const m of metrics) {
    const day = (m.startedAt || '').slice(0, 10);
    if (day) {
      byDay[day] = (byDay[day] || 0) + 1;
    }
  }

  // Tempo médio por etapa
  const stageTimes = {};
  for (const m of metrics) {
    for (const stage of (m.stages || [])) {
      if (stage.duration) {
        if (!stageTimes[stage.name]) stageTimes[stage.name] = [];
        stageTimes[stage.name].push(stage.duration);
      }
    }
  }
  const avgStageTimes = {};
  for (const [name, times] of Object.entries(stageTimes)) {
    avgStageTimes[name] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  const dlqPending = dlq.filter(e => e.status === 'pending').length;
  const dlqTotal = dlq.length;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>📊 Agente AchadoCerto.VIP — Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #f8fafc; }
  .subtitle { color: #94a3b8; margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: #1e293b; border-radius: 12px; padding: 1.25rem; border: 1px solid #334155; }
  .card h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.5rem; }
  .card .value { font-size: 2rem; font-weight: 700; }
  .card .value.green { color: #22c55e; }
  .card .value.yellow { color: #eab308; }
  .card .value.red { color: #ef4444; }
  .card .detail { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  th { text-align: left; padding: 0.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #334155; }
  td { padding: 0.5rem; border-bottom: 1px solid #1e293b; font-size: 0.85rem; }
  .section-title { font-size: 1.2rem; margin: 2rem 0 1rem; color: #f1f5f9; }
  .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
  .badge.success { background: #166534; color: #86efac; }
  .badge.fail { background: #7f1d1d; color: #fca5a5; }
  .badge.warning { background: #713f12; color: #fde68a; }
  @media (max-width: 640px) { body { padding: 1rem; } .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<h1>📊 Agente AchadoCerto.VIP</h1>
<p class="subtitle">Gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>

<div class="grid">
  <div class="card">
    <h3>Taxa de Sucesso (Hoje)</h3>
    <div class="value ${daily.rate >= 80 ? 'green' : daily.rate >= 50 ? 'yellow' : 'red'}">${daily.rate}%</div>
    <div class="detail">${daily.passed}/${daily.total} publicações</div>
  </div>
  <div class="card">
    <h3>Taxa de Sucesso (7 dias)</h3>
    <div class="value ${weekly.rate >= 80 ? 'green' : weekly.rate >= 50 ? 'yellow' : 'red'}">${weekly.rate}%</div>
    <div class="detail">${weekly.passed}/${weekly.total} publicações</div>
  </div>
  <div class="card">
    <h3>Total de Execuções</h3>
    <div class="value">${metrics.length}</div>
    <div class="detail">${Object.keys(byDay).length} dias com atividade</div>
  </div>
  <div class="card">
    <h3>Dead Letter Queue</h3>
    <div class="value ${dlqPending > 0 ? 'yellow' : 'green'}">${dlqTotal}</div>
    <div class="detail">${dlqPending} pendentes · ${dlqTotal - dlqPending} processados</div>
  </div>
</div>

<h2 class="section-title">📈 Publicações por Dia</h2>
<div class="card">
  <table>
    <tr><th>Data</th><th>Posts</th></tr>
    ${Object.entries(byDay).sort().reverse().slice(0, 14).map(([day, count]) =>
      `<tr><td>${day}</td><td><span class="badge ${count > 0 ? 'success' : 'warning'}">${count}</span></td></tr>`
    ).join('')}
  </table>
</div>

<h2 class="section-title">⏱ Tempo Médio por Etapa</h2>
<div class="card">
  <table>
    <tr><th>Etapa</th><th>Tempo Médio</th></tr>
    ${Object.entries(avgStageTimes).map(([stage, ms]) =>
      `<tr><td>${stage}</td><td>${(ms / 1000).toFixed(1)}s</td></tr>`
    ).join('')}
  </table>
</div>

<h2 class="section-title">🔌 Fontes Utilizadas</h2>
<div class="card">
  <table>
    <tr><th>Fonte</th><th>Score</th><th>Usos</th></tr>
    ${Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([src, count]) =>
      `<tr><td>${src}</td><td>${({'puppeteer':95,'amazon-http':80,'serper':80,'rapidapi-ml':70,'catalog':60,'proxy':55})[src] || '-'}</td><td>${count}</td></tr>`
    ).join('')}
  </table>
</div>

<h2 class="section-title">❌ Causas de Falha</h2>
<div class="card">
  <table>
    <tr><th>Motivo</th><th>Ocorrências</th></tr>
    ${Object.entries(failReasons).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([reason, count]) =>
      `<tr><td>${reason.slice(0, 80)}</td><td><span class="badge fail">${count}</span></td></tr>`
    ).join('')}
  </table>
</div>

<h2 class="section-title">📋 Últimas Execuções</h2>
<div class="card">
  <table>
    <tr><th>ID</th><th>Pilar</th><th>Status</th><th>Duração</th></tr>
    ${logs.slice(0, 20).map(log =>
      `<tr><td style="font-family:monospace;font-size:0.75rem">${(log.meta?.runId || log.meta?.executionId || '?').slice(0, 20)}</td><td>${log.meta?.pilar || '-'}</td><td><span class="badge ${(log.result?.status === 'success') ? 'success' : 'fail'}">${log.result?.status || '?'}</span></td><td>${Math.round((log.meta?.duration || 0) / 1000)}s</td></tr>`
    ).join('')}
  </table>
</div>

<p style="text-align:center;margin-top:2rem;color:#475569;font-size:0.8rem">
  Dashboard gerado automaticamente pelo Agente AchadoCerto.VIP
</p>
</body>
</html>`;

  const outputPath = path.join(ROOT, 'agent-dashboard.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Dashboard gerado: ${outputPath}`);
  return outputPath;
}

// Execução direta
if (process.argv[1]?.includes('dashboard.js') || process.argv.includes('--dashboard')) {
  generateDashboard();
}
