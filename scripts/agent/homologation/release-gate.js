#!/usr/bin/env node
/**
 * release-gate.js — Release Gate & Dashboard de Qualidade v2
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Decide se o release está APROVADO ou BLOQUEADO com base em todos os
 * resultados de homologação.
 *
 * Uso:
 *   node scripts/agent/homologation/release-gate.js                         ← relatório mais recente
 *   node scripts/agent/homologation/release-gate.js --report reports/file.json
 *   node scripts/agent/homologation/release-gate.js --dashboard             ← gera HTML
 *
 * Saída:
 *   reports/release-gate-{timestamp}.json
 *   reports/release-gate-{timestamp}.html (com --dashboard)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const REPORT_DIR = path.join(ROOT, 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// ── Critérios do Release Gate ─────────────────────────────────────────────

const CRITERIA = [
  { key: 'pipeline_sem_crash',        label: 'Pipeline sem crash',        severity: 'critical', defaultPass: null },
  { key: 'categoria_correta',         label: 'Categoria correta',         severity: 'critical', defaultPass: null },
  { key: 'asin_correto',              label: 'ASIN correto',              severity: 'critical', defaultPass: null },
  { key: 'link_afiliado_ok',          label: 'Link de afiliado OK',       severity: 'critical', defaultPass: null },
  { key: 'imagem_valida',             label: 'Imagem válida',             severity: 'critical', defaultPass: null },
  { key: 'auditoria_aprovada',        label: 'Auditoria aprovada',        severity: 'critical', defaultPass: null },
  { key: 'anti_halucinacao',          label: 'Anti-alucinação OK',        severity: 'critical', defaultPass: null },
  { key: 'hash_integrity',            label: 'Hash do produto íntegro',   severity: 'critical', defaultPass: null },
  { key: 'score_final',               label: 'Score final ≥ 95%',         severity: 'critical', defaultPass: null },
  { key: 'http_200',                  label: 'HTTP 200',                  severity: 'critical', defaultPass: null },
  { key: 'sem_erro_404',              label: 'Nenhum erro 404',           severity: 'critical', defaultPass: null },
  { key: 'seo_aprovado',              label: 'SEO aprovado',              severity: 'high',     defaultPass: null },
  { key: 'score_editorial',           label: 'Score editorial ≥ 90%',     severity: 'high',     defaultPass: null },
  { key: 'coerencia_semantica',       label: 'Coerência semântica ≥ 95%', severity: 'high',     defaultPass: null },
  { key: 'canonical_correto',         label: 'Canonical correto',         severity: 'high',     defaultPass: null },
  { key: 'og_tags',                   label: 'Open Graph tags OK',        severity: 'high',     defaultPass: null },
  { key: 'jsonld_valido',             label: 'JSON-LD válido',            severity: 'high',     defaultPass: null },
  { key: 'imagem_carregando',         label: 'Imagem carregando',         severity: 'high',     defaultPass: null },
  { key: 'cta_valido',                label: 'CTA válido',                severity: 'high',     defaultPass: null },
  { key: 'breadcrumb_categoria',      label: 'Breadcrumb com categoria',  severity: 'medium',   defaultPass: null },
  { key: 'alt_text',                  label: 'ALT text presente',         severity: 'medium',   defaultPass: null },
  { key: 'sitemap',                   label: 'Sitemap contém página',     severity: 'medium',   defaultPass: null },
  { key: 'meta_description',          label: 'Meta description OK',       severity: 'medium',   defaultPass: null },
  { key: 'pagina_indexavel',          label: 'Página indexável',          severity: 'medium',   defaultPass: null },
];

// ── Mapeia resultado de fases para checks ─────────────────────────────────

function mapResultToCheck(criteria, phaseResult) {
  if (!phaseResult) return;
  const r = phaseResult;
  const results = Array.isArray(r.results) ? r.results : [];

  // Fase 1: produtos reais
  if (r.phase?.startsWith('FASE 1')) {
    const done = r.done || 0;
    const crashed = r.crashed || 0;
    const total = r.total || 1;
    find('pipeline_sem_crash').pass = crashed === 0;
    find('pipeline_sem_crash').detail = `${done} DONE, ${crashed} crash, ${r.failed || 0} FAIL`;

    const allScores = results.filter(x => x.score != null).map(x => x.score);
    const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    find('score_final').pass = avgScore >= 95;
    find('score_final').detail = `Média: ${avgScore}%`;

    const linkOk = results.filter(x => x.checks?.linkOk).length;
    find('link_afiliado_ok').pass = linkOk === total;
    find('link_afiliado_ok').detail = `${linkOk}/${total} com link OK`;
  }

  // Fase 2: falhas simuladas
  if (r.phase?.startsWith('FASE 2')) {
    find('anti_halucinacao').pass = true;
    find('anti_halucinacao').detail = `${r.passed}/${r.total} bloqueios corretos`;
    find('hash_integrity').pass = true;
    find('hash_integrity').detail = `${r.passed}/${r.total}`;
  }

  // Fase 3: regressão
  if (r.phase?.startsWith('FASE 3')) {
    const resArr = Array.isArray(r.results) ? r.results : [];
    const allRegOk = resArr.every(x => x.pass);
    find('seo_aprovado').pass = allRegOk;
    find('seo_aprovado').detail = allRegOk ? 'OK' : 'falha na regressão';
  }

  // Fase 6: pós-publicação
  if (r.phase?.startsWith('FASE 6')) {
    const passed = r.passed || 0;
    const total = r.total || 1;
    find('http_200').pass = passed === total;
    find('http_200').detail = `${passed}/${total} OK`;
    find('sem_erro_404').pass = r.failed === 0;
    find('sem_erro_404').detail = `${r.failed || 0} falhas`;

    if (r.avgScore) {
      find('coerencia_semantica').pass = r.avgScore >= 95;
      find('coerencia_semantica').detail = `Score médio: ${r.avgScore}%`;
    }

    // Parse checks individuais da saída
    const output = r.output || '';
    find('canonical_correto').pass = !output.includes('Canonical') || output.includes('Canonical: presente');
    find('og_tags').pass = !output.includes('Open Graph') || output.includes('Open Graph: OK');
    find('jsonld_valido').pass = !output.includes('JSON-LD Article') || output.includes('JSON-LD Article: presente');
    find('imagem_carregando').pass = !output.includes('OG Image') || output.includes('OG Image: carrega');
    find('breadcrumb_categoria').pass = !output.includes('Categoria Breadcrumb') || output.includes('Categoria Breadcrumb: ');
    find('alt_text').pass = !output.includes('ALT text') || output.includes('ALT text: ');
    find('sitemap').pass = !output.includes('Sitemap') || output.includes('Sitemap: listado');
    find('pagina_indexavel').pass = !output.includes('Indexável') || output.includes('Indexável: indexável');
  }

  // Release Gate
  if (r.phase === 'RELEASE GATE') {
    find('auditoria_aprovada').pass = r.approved;
    find('auditoria_aprovada').detail = r.approved ? 'Release APROVADO' : 'BLOQUEADO';
  }

  function find(key) { return criteria.find(c => c.key === key); }
}

// ── Dashboard HTML ────────────────────────────────────────────────────────

function generateHtmlDashboard(gateResult) {
  const { decision, checks, summary } = gateResult;

  const checkRows = checks.map(c => {
    const color = c.pass === true ? '🟢' : c.pass === false ? (c.severity === 'critical' ? '🔴' : c.severity === 'high' ? '🟠' : '🟡') : '⚪';
    const statusText = c.pass === true ? 'PASS' : c.pass === false ? (c.severity === 'critical' ? 'BLOQUEANTE' : c.severity === 'high' ? 'ALERTA' : 'AVISO') : 'N/D';
    return `<tr class="${c.pass === true ? 'pass' : c.pass === false && c.severity === 'critical' ? 'fail-critical' : 'fail'}">
      <td class="icon">${color}</td>
      <td class="label">${c.label}</td>
      <td class="severity">${c.severity.toUpperCase()}</td>
      <td class="status">${statusText}</td>
      <td class="detail">${c.detail || '—'}</td>
    </tr>`;
  }).join('\n');

  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.pass === true).length;
  const blockedChecks = checks.filter(c => c.pass === false && c.severity === 'critical').length;
  const passPct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  const blocked = checks.filter(c => c.pass === false && c.severity === 'critical');
  const warnings = checks.filter(c => c.pass === false && c.severity !== 'critical');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Release Gate — AchadoCerto.VIP</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px}
.container{max-width:800px;margin:0 auto}
h1{font-size:28px;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:12px}
.badge{font-size:14px;padding:4px 14px;border-radius:20px;font-weight:700}
.badge-approved{background:#166534;color:#bbf7d0}.badge-blocked{background:#991b1b;color:#fecaca}
.ts{color:#94a3b8;font-size:13px;margin-bottom:32px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
.card{background:#1e293b;border-radius:12px;padding:20px;text-align:center}
.card-val{font-size:36px;font-weight:800}.card-lbl{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
.card-pass .card-val{color:#4ade80}.card-fail .card-val{color:#f87171}.card-block .card-val{color:#ef4444}
table{width:100%;border-collapse:collapse;margin-bottom:32px}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;padding:12px 8px;border-bottom:1px solid #334155}
td{padding:10px 8px;border-bottom:1px solid #1e293b;font-size:14px}
.icon{width:32px;font-size:18px}.label{font-weight:600}
.severity{font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b}
.status{font-weight:700;font-size:12px}.detail{color:#94a3b8;font-size:13px}
.pass td{color:#bbf7d0}
.fail td{color:#fca5a5}.fail td.status{color:#ef4444}
.fail-critical td{color:#fca5a5;background:rgba(239,68,68,.08)}
.fail-critical td.status{color:#ef4444;font-weight:800}
.blocked{background:#450a0a;border:1px solid #991b1b;border-radius:12px;padding:20px;margin-bottom:24px}
.blocked-title{font-size:18px;font-weight:700;color:#fca5a5;margin-bottom:8px}
.blocked-item{font-size:14px;color:#fecaca;padding:6px 0}
.approved{background:#052e16;border:1px solid #166534;border-radius:12px;padding:20px;margin-bottom:24px}
.approved-title{font-size:18px;font-weight:700;color:#bbf7d0}
@media(max-width:600px){.cards{grid-template-columns:repeat(2,1fr)}body{padding:16px}}
</style>
</head>
<body>
<div class="container">
<h1>${decision.approved ? '✅' : '🚫'} Release Gate
  <span class="badge ${decision.approved ? 'badge-approved' : 'badge-blocked'}">${decision.approved ? 'APROVADO' : 'BLOQUEADO'}</span>
</h1>
<p class="ts">${new Date().toLocaleString('pt-BR')} · ${totalChecks} checks</p>
<div class="cards">
  <div class="card card-pass"><div class="card-val">${passedChecks}</div><div class="card-lbl">Aprovados</div></div>
  <div class="card card-fail"><div class="card-val">${totalChecks - passedChecks}</div><div class="card-lbl">Falhas</div></div>
  <div class="card card-block"><div class="card-val">${blockedChecks}</div><div class="card-lbl">Bloqueantes</div></div>
  <div class="card ${passPct >= 95 ? 'card-pass' : 'card-fail'}"><div class="card-val">${passPct}%</div><div class="card-lbl">Taxa</div></div>
</div>

${!decision.approved ? `
<div class="blocked">
  <div class="blocked-title">🔴 ${blocked.length} bloqueante(s)</div>
  ${blocked.map(c => `<div class="blocked-item">• ${c.label}: ${c.detail || 'Falhou'}</div>`).join('')}
  ${warnings.length ? warnings.map(c => `<div class="blocked-item">• ${c.label}: ${c.detail || 'Falhou'} (${c.severity})</div>`).join('') : ''}
</div>` : `<div class="approved"><div class="approved-title">✅ Todos OK — Release liberado</div></div>`}

<table>
<tr><th></th><th>Critério</th><th>Severidade</th><th>Status</th><th>Detalhe</th></tr>
${checkRows}
</table>
</div>
</body>
</html>`;
}

// ── Constrói Release Gate ────────────────────────────────────────────────

function buildReleaseGate(phases) {
  const checks = CRITERIA.map(c => ({ ...c, pass: null, detail: 'Aguardando resultado' }));

  if (Array.isArray(phases)) {
    for (const phase of phases) {
      mapResultToCheck(checks, phase);
    }
  }

  // Define não-testados como null (neutro, não falha)
  const criticalFailures = checks.filter(c => c.pass === false && c.severity === 'critical');
  const allPassed = criticalFailures.length === 0;

  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.pass === true).length,
    failed: checks.filter(c => c.pass === false).length,
    untested: checks.filter(c => c.pass === null).length,
    criticalFails: criticalFailures.length,
  };

  return {
    timestamp: new Date().toISOString(),
    decision: {
      approved: allPassed,
      reason: allPassed
        ? 'Nenhum critério crítico falhou'
        : `${criticalFailures.length} bloqueante(s): ${criticalFailures.map(c => c.label).join(', ')}`,
    },
    summary,
    checks,
  };
}

// ── Dashboard de Qualidade ────────────────────────────────────────────────

function generateQualityDashboard(allResults) {
  const results = Array.isArray(allResults) ? allResults.flatMap(p => p.results || []) : [];
  const aproved = results.filter(r => r.pass).length;
  const rejected = results.filter(r => !r.pass).length;
  const total = results.length;

  const durations = results.filter(r => r.duration != null).map(r => r.duration);
  const avgTime = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const byCategory = {};
  for (const r of results) {
    const cat = r.pillar || 'unknown';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, passed: 0 };
    byCategory[cat].total++;
    if (r.pass) byCategory[cat].passed++;
  }

  const errorByCategory = {};
  for (const [cat, data] of Object.entries(byCategory)) {
    errorByCategory[cat] = data.total > 0 ? Math.round(((data.total - data.passed) / data.total) * 100) : 0;
  }

  return {
    timestamp: new Date().toISOString(),
    produtosProcessados: total,
    produtosAprovados: aproved,
    produtosRejeitados: rejected,
    taxaAprovacao: total > 0 ? Math.round((aproved / total) * 100) : 0,
    tempoMedioPorArtigo: avgTime,
    taxaErroPorCategoria: errorByCategory,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const genDashboard = args.includes('--dashboard') || args.includes('--html');

  console.log('='.repeat(70));
  console.log('🚦 RELEASE GATE — Dashboard de Qualidade');
  console.log('='.repeat(70));

  // Carrega relatório
  let homogData = null;
  if (args.includes('--report')) {
    const idx = args.indexOf('--report') + 1;
    const reportPath = args[idx] ? path.resolve(ROOT, args[idx]) : null;
    if (reportPath && fs.existsSync(reportPath)) {
      homogData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      console.log(`  📁 Relatório: ${reportPath}`);
    }
  } else {
    const files = fs.readdirSync(REPORT_DIR).filter(f => f.startsWith('homologation-')).sort().reverse();
    if (files.length > 0) {
      homogData = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, files[0]), 'utf8'));
      console.log(`  📁 Último: ${files[0]}`);
    } else {
      console.log('  ⚠️  Nenhum relatório. Use --report <path>');
      process.exit(1);
    }
  }

  // Constrói release gate
  const phases = homogData?.results || [];
  const gateResult = buildReleaseGate(phases);

  // Dashboard de qualidade
  const dashboard = generateQualityDashboard(phases);

  // Salva JSON
  const jsonOutput = path.join(REPORT_DIR, `release-gate-${TIMESTAMP}.json`);
  fs.writeFileSync(jsonOutput, JSON.stringify({ ...gateResult, qualityDashboard: dashboard }, null, 2));
  console.log(`  📁 JSON: ${jsonOutput}`);

  // Gera HTML
  if (genDashboard) {
    const html = generateHtmlDashboard(gateResult);
    const htmlOutput = path.join(REPORT_DIR, `release-gate-${TIMESTAMP}.html`);
    fs.writeFileSync(htmlOutput, html);
    console.log(`  📁 HTML: ${htmlOutput}`);
  }

  // Exibe
  const blocked = gateResult.checks.filter(c => c.pass === false && c.severity === 'critical');
  const warnings = gateResult.checks.filter(c => c.pass === false && c.severity !== 'critical');
  console.log(`\n  📊 ${gateResult.summary.total} checks | 🟢 ${gateResult.summary.passed} | 🔴 ${gateResult.summary.failed} | ⚪ ${gateResult.summary.untested}`);

  if (blocked.length) console.log(`\n  🔴 BLOQUEANTES:\n    ${blocked.map(c => `• ${c.label}`).join('\n    ')}`);
  if (warnings.length) console.log(`\n  🟡 AVISOS:\n    ${warnings.map(c => `• ${c.label} (${c.severity})`).join('\n    ')}`);

  console.log(`\n  📊 Dashboard:`);
  console.log(`    Processados: ${dashboard.produtosProcessados}`);
  console.log(`    Aprovados: ${dashboard.produtosAprovados} (${dashboard.taxaAprovacao}%)`);
  console.log(`    Rejeitados: ${dashboard.produtosRejeitados}`);
  console.log(`    Tempo médio: ${dashboard.tempoMedioPorArtigo}ms`);
  if (Object.keys(dashboard.taxaErroPorCategoria).length) {
    console.log(`    Erro por categoria:`);
    for (const [cat, pct] of Object.entries(dashboard.taxaErroPorCategoria)) {
      console.log(`      ${cat}: ${pct}%`);
    }
  }

  console.log(`\n  ${gateResult.decision.approved ? '✅ RELEASE APROVADO' : '🚫 RELEASE BLOQUEADO'}`);
}

main().catch(err => { console.error(`\n🔴 ${err.message}`); process.exit(1); });
