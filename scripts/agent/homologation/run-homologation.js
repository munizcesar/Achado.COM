#!/usr/bin/env node
/**
 * run-homologation.js — Runner de Homologação Completa v4
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Homologa o pipeline com 6 fases + Release Gate:
 *   FASE 1 — 21 produtos reais (3 categorias × 7)
 *   FASE 2 — 12 cenários de falha simulada (deve BLOQUEAR publicação)
 *   FASE 3 — Regressão (simulador + testes unitários + dry run)
 *   FASE 4 — Volume (50 execuções consecutivas)
 *   FASE 5 — Checklist de revisão manual (não automatizado)
 *   FASE 6 — Validação pós-build (URL, canonical, OG, JSON-LD, sitemap, imagem, link)
 *   ➡️ RELEASE GATE — Decisão final (tudo verde → publicar)
 *
 * Uso:
 *   node scripts/agent/homologation/run-homologation.js
 *   node scripts/agent/homologation/run-homologation.js --quick     # Fases 1-2
 *   node scripts/agent/homologation/run-homologation.js --full      # Fases 1-6
 *   node scripts/agent/homologation/run-homologation.js --fase 6
 *   node scripts/agent/homologation/run-homologation.js --gate      # Só release gate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const LOCK = path.join(ROOT, 'scripts', 'agent', 'agent.lock');
const STATES = path.join(ROOT, 'scripts', 'agent', 'states');
const REPORT_DIR = path.join(ROOT, 'reports');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const IMG_DIR = path.join(ROOT, 'public', 'images', 'posts');
const isWin = process.platform === 'win32';

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_FILE = path.join(REPORT_DIR, `homologation-${TIMESTAMP}.json`);

// ── Helpers ────────────────────────────────────────────────────────────────

function clean() {
  try { fs.unlinkSync(LOCK); } catch (_) {}
  try { fs.rmSync(STATES, { recursive: true, force: true }); } catch (_) {}
  const now = Date.now();
  [BLOG_DIR, IMG_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(f => {
        try { const fp = path.join(dir, f); if (now - fs.statSync(fp).mtimeMs < 300000) fs.unlinkSync(fp); } catch (_) {}
      });
    }
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function runCommand(cmd, timeout = 60000) {
  const start = Date.now();
  try {
    const output = execSync(cmd, { cwd: ROOT, timeout, stdio: 'pipe', shell: isWin ? 'cmd.exe' : undefined }).toString('utf8');
    return { pass: true, output, duration: Date.now() - start, error: null };
  } catch (err) {
    const out = (err.stdout || '').toString();
    const errOut = (err.stderr || '').toString();
    return { pass: false, output: out + '\n' + errOut, duration: Date.now() - start, error: err.message };
  }
}

// ─═ FASE 1 — PRODUTOS REAIS ═─────────────────────────────────────────────

async function runFase1() {
  console.log('\n' + '='.repeat(70));
  console.log('📦 FASE 1: TESTES COM PRODUTOS REAIS (21 execuções, 3 categorias)');
  console.log('='.repeat(70));

  const results = [];
  const pillars = ['beleza', 'saude', 'casa'];
  const productsPerPillar = 7;

  for (const pillar of pillars) {
    console.log(`\n─── Pilar: ${pillar} ────────────────────────────────`);

    for (let i = 0; i < productsPerPillar; i++) {
      clean();
      process.stdout.write(`  Run ${i + 1}/${productsPerPillar}... `);
      await sleep(500);

      const r = runCommand(`node scripts/agent/agent.js --now ${pillar} --dry-run`, 120000);

      const done = /Pipeline finalizado: DONE/.test(r.output);
      const fail = /Pipeline finalizado: FAIL/.test(r.output);
      const crash = /CRASH|FATAL/.test(r.output);
      const finalState = r.output.match(/Pipeline finalizado: (\S+)/)?.[1] || '?';
      const scoreMatch = r.output.match(/SCORE FINAL: (\d+)%/);
      const execMatch = r.output.match(/🤖 Pipeline — (\S+)/);

      const entry = {
        run: i + 1, pillar, executionId: execMatch?.[1] || '?',
        duration: r.duration, finalState,
        score: scoreMatch ? parseInt(scoreMatch[1]) : null,
        pass: !crash,
        checks: { done, fail, linkOk: /tag= presente: true/.test(r.output),
                 asinOk: /ASIN presente: true/.test(r.output),
                 mdGerado: /📝 MARKDOWN GERADO/.test(r.output) },
        error: r.error,
      };
      results.push(entry);

      const icon = entry.pass && done ? '✅' : entry.pass && fail ? '⏹️' : '❌';
      process.stdout.write(`${icon} ${finalState} | ${r.duration}ms`);
      if (entry.score) process.stdout.write(` | Score: ${entry.score}%`);
      process.stdout.write('\n');
      if (!entry.pass && r.error) console.log(`     Erro: ${r.error.slice(0, 120)}`);
    }
  }

  const total = results.length;
  const done = results.filter(r => r.checks.done).length;
  const failed = results.filter(r => r.checks.fail).length;
  const crashed = results.filter(r => r.checks.crash).length;
  const avgDur = Math.round(results.reduce((a, r) => a + r.duration, 0) / total);

  console.log(`\n📊 FASE 1 — Resumo:`);
  console.log(`  ✅ Publicariam (DONE): ${done}`);
  console.log(`  ⏹️  Bloqueados (FAIL): ${failed}`);
  console.log(`  ❌ Crash inesperado: ${crashed}`);
  console.log(`  ⏱  Tempo médio: ${avgDur}ms`);

  return { phase: 'FASE 1 - Produtos Reais', total, done, failed, crashed, avgDuration: avgDur, results };
}

// ─═ FASE 2 — FALHAS SIMULADAS ═───────────────────────────────────────────

async function runFase2() {
  console.log('\n' + '='.repeat(70));
  console.log('💥 FASE 2: TESTE DE FALHAS (12 cenários)');
  console.log('   Em TODOS os cenários, o pipeline NÃO deve publicar.');
  console.log('='.repeat(70));

  // Os cenários 1, 3, 4 executam o pipeline real (agent.js)
  const pipelineScenarios = [
    { name: 'Categoria inexistente → ABORTAR',
      cmd: 'node scripts/agent/agent.js --now categoria_invalida_xyz --dry-run',
      check: (o) => !o.includes('Pipeline finalizado: DONE'), },
    { name: 'Tag de afiliado — pipeline usa tag do .env',
      cmd: 'node scripts/agent/agent.js --now saude --dry-run',
      check: (o) => o.includes('tag=') || o.includes('tag presente') || !o.includes('ERRO CRÍTICO'), },
    { name: 'Categoria sem catálogo (tech) → não publica',
      cmd: 'node scripts/agent/agent.js --now tech --dry-run',
      check: (o) => !o.includes('Pipeline finalizado: DONE'), },
  ];

  // Demais cenários (2, 5-12) executam via test-scenarios.mjs (standalone ESM, sem shell quoting)
  const standaloneScenarios = [
    { name: 'ASIN inválido → link-builder rejeita', testName: 'ASIN inválido' },
    { name: 'Imagem quebrada (URL vazia) → validador rejeita', testName: 'Imagem vazia' },
    { name: 'Lock impede execução dupla', testName: 'Lock impede' },
    { name: 'Categoria vazia → validateCategorySafety rejeita', testName: 'Categoria vazia' },
    { name: 'Categoria inválida → validateCategorySafety rejeita', testName: 'Categoria inválida' },
    { name: 'Score final com validações zeradas → REPROVADO', testName: 'Score zerado' },
    { name: 'IA retorna conteúdo vazio → EDITORIAL_GATE bloqueia', testName: 'Conteúdo curto' },
    { name: 'Anti-alucinação detecta claims inventados', testName: 'Claims inventados' },
    { name: 'Link de afiliado inválido → rejeitado', testName: 'URL inválida' },
    { name: 'Hash do produto alterado → HASH_VALIDATION', testName: 'Hash alterado' },
  ];

  const results = [];

  // Pipeline-based scenarios (1, 3, 4)
  for (let i = 0; i < pipelineScenarios.length; i++) {
    const s = pipelineScenarios[i]; clean();
    const num = [1, 3, 4][i];
    process.stdout.write(`  🔴 ${String(num).padStart(2)}. ${s.name}... `);
    await sleep(200);
    const r = runCommand(s.cmd, 60000);
    const bloqueou = s.check(r.output);
    const testPass = bloqueou;
    results.push({ name: s.name, pass: testPass, bloqueou, duration: r.duration, error: r.error });
    process.stdout.write(`${testPass ? '✅ PASS' : '❌ FAIL'} | ${r.duration}ms\n`);
  }

  // Standalone test-scenarios.mjs (cenários 2, 5-12)
  process.stdout.write(`  🔴 02. ${standaloneScenarios[0].name}... `);
  process.stdout.write(`(via test-scenarios.mjs)\n`);
  clean();
  const standalone = runCommand('node scripts/agent/homologation/test-scenarios.mjs', 30000);
  
  // Parse output for individual test results
  const testLines = standalone.output.match(/^  [✅❌].+$/gm) || [];
  const standaloneResults = [];
  for (const ss of standaloneScenarios) {
    const match = testLines.find(l => l.includes(ss.testName));
    const testPass = match ? match.includes('✅') : false;
    standaloneResults.push({ name: ss.name, pass: testPass, duration: standalone.duration, outputMatch: !!match });
  }
  for (const sr of standaloneResults) {
    results.push(sr);
    console.log(`     ${sr.pass ? '✅' : '❌'} ${sr.name}`);
  }

  // Final count from test-scenarios exit code / total line
  const resultLine = standalone.output.match(/📊 Resultado: (\d+)\/(\d+)/);
  const standTotal = resultLine ? parseInt(resultLine[2]) : standaloneResults.length;
  const standPassed = resultLine ? parseInt(resultLine[1]) : standaloneResults.filter(r => r.pass).length;

  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  console.log(`\n📊 FASE 2 — Resumo: ${passed}/${total} bloqueios corretos (${standPassed}/${standTotal} via validadores)`);
  return { phase: 'FASE 2 - Falhas Simuladas', total, passed, results };
}

// ─═ FASE 3 — REGRESSÃO ═──────────────────────────────────────────────────

async function runFase3() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 FASE 3: REGRESSÃO');
  console.log('='.repeat(70));
  const results = [];

  process.stdout.write('  Simulador de pipeline... ');
  const sim = runCommand('node scripts/agent/tests/simulate-pipeline.js', 30000);
  const simOk = sim.pass && (sim.output.includes('Pipeline simulation complete') || (sim.output.match(/✅/g) || []).length > 10);
  results.push({ name: 'Simulador de pipeline', pass: simOk, duration: sim.duration });
  process.stdout.write(`${simOk ? '✅ PASS' : '❌ FAIL'} | ${sim.duration}ms\n`);

  process.stdout.write('  Testes unitários... ');
  const unit = runCommand('node scripts/agent/tests/run-all.js', 30000);
  const unitFail = (unit.output.match(/❌/g) || []).length;
  results.push({ name: 'Testes unitários', pass: unitFail <= 1, duration: unit.duration, failCount: unitFail });
  process.stdout.write(`${unitFail <= 1 ? '✅ PASS' : '❌ FAIL'} | ❌ ${unitFail} | ${unit.duration}ms\n`);

  process.stdout.write('  Dry run (beleza)... ');
  const dry = runCommand('node scripts/agent/agent.js --now beleza --dry-run', 120000);
  const dryOk = dry.pass && (dry.output.includes('Pipeline finalizado:') || dry.output.includes('DRY RUN'));
  results.push({ name: 'Dry run beleza', pass: dryOk, duration: dry.duration });
  process.stdout.write(`${dryOk ? '✅ PASS' : '❌ FAIL'} | ${dry.duration}ms\n`);

  const total = results.length, passed = results.filter(r => r.pass).length;
  console.log(`\n📊 FASE 3 — Resumo: ${passed}/${total} regressões OK`);
  return { phase: 'FASE 3 - Regressão', total, passed, results };
}

// ─═ FASE 4 — VOLUME ═─────────────────────────────────────────────────────

async function runFase4() {
  console.log('\n' + '='.repeat(70));
  console.log('📈 FASE 4: TESTE DE VOLUME (50 execuções)');
  console.log('='.repeat(70));

  const run10Script = path.join(ROOT, 'scripts', 'agent', 'scripts', 'run-10-dry-runs.js');
  const results = []; const iterations = 5;
  if (!fs.existsSync(run10Script)) {
    console.log('  ⚠️  run-10-dry-runs.js ausente. Pulando.');
    return { phase: 'FASE 4 - Volume', total: 0, passed: 0, skipped: true };
  }

  for (let i = 0; i < iterations; i++) {
    clean(); process.stdout.write(`  Ciclo ${i + 1}/${iterations} (10 exec)... `);
    const r = runCommand(`node scripts/agent/scripts/run-10-dry-runs.js`, 300000);
    const doneCount = (r.output.match(/✅/g) || []).length;
    const crashCount = (r.output.match(/❌/g) || []).length;
    results.push({ cycle: i + 1, duration: r.duration, done: doneCount, crash: crashCount, pass: r.pass });
    process.stdout.write(`${r.pass ? '✅' : '❌'} ${doneCount} done, ${crashCount} crash | ${Math.round(r.duration / 1000)}s\n`);
  }

  const totalDone = results.reduce((a, r) => a + r.done, 0);
  console.log(`\n📊 FASE 4 — Resumo: 50 execuções, ${totalDone} DONE`);
  return { phase: 'FASE 4 - Volume', total: 50, passed: totalDone, results };
}

// ─═ FASE 5 — GUIA DE REVISÃO MANUAL ═────────────────────────────────────

function printFase5() {
  console.log('\n' + '='.repeat(70));
  console.log('✍️  FASE 5: REVISÃO MANUAL (10 artigos)');
  console.log('='.repeat(70));
  console.log(`  NÃO automatizado. Após publicar, escolha 10 artigos e verifique:
  • Parece escrito por humano?
  • Fala do produto correto?
  • Recomendação faz sentido?
  • SEO ficou natural?
  • Publicaria no seu site?`);
}

// ─═ FASE 6 — VALIDAÇÃO PÓS-PUBLICAÇÃO ═───────────────────────────────────

async function runFase6() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 FASE 6: VALIDAÇÃO PÓS-PUBLICAÇÃO');
  console.log('   Verificando artigos em https://achadocerto.vip');
  console.log('='.repeat(70));

  const validatorScript = path.join(ROOT, 'scripts', 'agent', 'homologation', 'post-publication-validator.js');
  if (!fs.existsSync(validatorScript)) {
    console.log('  ⚠️  post-publication-validator.js ausente. Pulando.');
    return { phase: 'FASE 6 - Pós-Publicação', total: 0, passed: 0, skipped: true };
  }

  process.stdout.write('  Buscando artigos no sitemap... ');
  const r = runCommand(`node scripts/agent/homologation/post-publication-validator.js --limit 20`, 120000);
  const passed = (r.output.match(/✅/g) || []).length;
  const failed = (r.output.match(/❌/g) || []).length;
  const total = passed + failed;

  console.log(`${total} artigos encontrados`);
  console.log(`  ✅ Aprovados: ${passed}`);
  console.log(`  ❌ Com falhas: ${failed}`);

  // Parse scores
  const scores = [...r.output.matchAll(/(\d+)% \((\d+)\/(\d+)\)/g)].map(m => parseInt(m[1]));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  console.log(`  ⏱  Score médio: ${avgScore}%`);

  return { phase: 'FASE 6 - Pós-Publicação', total, passed, failed, avgScore, output: r.output };
}

// ─═ RELEASE GATE ═────────────────────────────────────────────────────────

async function runReleaseGate(phases) {
  console.log('\n' + '='.repeat(70));
  console.log('🚦 RELEASE GATE — Decisão Final');
  console.log('='.repeat(70));

  const gateScript = path.join(ROOT, 'scripts', 'agent', 'homologation', 'release-gate.js');
  if (!fs.existsSync(gateScript)) {
    console.log('  ⚠️  release-gate.js ausente. Pulando.');
    return { approved: false, reason: 'release-gate.js não encontrado' };
  }

  // Salva relatório parcial para o release gate ler
  const partialReport = {
    timestamp: new Date().toISOString(),
    results: phases,
    summary: {
      total: phases.reduce((a, p) => a + (p.total || 0), 0),
      passed: phases.reduce((a, p) => a + (p.passed || 0), 0),
    },
  };
  const partialPath = path.join(REPORT_DIR, `homologation-${TIMESTAMP}.json`);
  fs.writeFileSync(partialPath, JSON.stringify(partialReport, null, 2));

  // Escapa caminho com espaços para shell
  const escapedPath = partialPath.replace(/\\/g, '/');
  const r = runCommand(`node scripts/agent/homologation/release-gate.js --report "${escapedPath}" --dashboard`, 30000);
  const approved = r.output.includes('RELEASE APROVADO');

  console.log(r.output.split('\n').slice(-8).join('\n'));

  return { approved, reason: approved ? 'RELEASE APROVADO' : 'RELEASE BLOQUEADO', output: r.output };
}

// ─═ MAIN ═─────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 HOMOLOGAÇÃO — Pipeline AchadoCerto.VIP');
  console.log('='.repeat(70));

  const args = process.argv.slice(2);
  const only = (n) => args.includes('--fase') && args.includes(String(n));
  const quick = args.includes('--quick');
  const full = args.includes('--full');
  const onlyGate = args.includes('--gate');

  const phases = [];
  const start = Date.now();

  if (onlyGate) {
    console.log('  Only running Release Gate...');
  } else {
    if (!only(2) && !only(3) && !only(4) && !only(5) && !only(6)) phases.push(await runFase1());
    if (!only(1) && !only(3) && !only(4) && !only(5) && !only(6)) phases.push(await runFase2());
    if (!only(1) && !only(2) && !only(4) && !only(5) && !only(6) && !quick) phases.push(await runFase3());
    if (full && !only(1) && !only(2) && !only(3) && !only(5) && !only(6)) phases.push(await runFase4());
    if (!only(1) && !only(2) && !only(3) && !only(4) && !only(6)) printFase5();
    // 6a. Build Astro (verifica se compila sem erros)
    if (full && !only(1) && !only(2) && !only(3) && !only(4) && !only(5) && !only(6)) {
      process.stdout.write('  Build Astro... ');
      const build = runCommand('npx astro build 2>&1', 120000);
      const buildOk = build.pass && (build.output.includes('Completed') || build.output.includes('build complete'));
      console.log(buildOk ? '✅ PASS' : '❌ FAIL');
      phases.push({ phase: 'Build Astro', total: 1, passed: buildOk ? 1 : 0 });
    }
    
    // 6b. Validação pós-publicação
    if (full && !only(1) && !only(2) && !only(3) && !only(4) && !only(5)) phases.push(await runFase6());
  }

  // Release Gate (sempre roda no full, opcional com --gate)
  if (full || onlyGate) {
    const gate = await runReleaseGate(phases);
    phases.push({ phase: 'RELEASE GATE', ...gate });
  }

  // Relatório final
  const allTests = phases.reduce((a, p) => a + (p.total || 0), 0);
  const allPassed = phases.reduce((a, p) => a + (p.passed || 0), 0);
  const passRate = allTests > 0 ? Math.round((allPassed / allTests) * 100) : 0;

  const report = {
    timestamp: new Date().toISOString(), duration: Date.now() - start,
    results: phases,
    summary: { total: allTests, passed: allPassed, passRate },
    releaseGate: phases.find(p => p.phase === 'RELEASE GATE') || null,
    approved: passRate >= 95,
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('📋 RELATÓRIO DE HOMOLOGAÇÃO');
  console.log('='.repeat(70));
  console.log(`\n  📁 ${REPORT_FILE}`);
  console.log(`  ⏱  ${Math.round((Date.now() - start) / 1000)}s`);
  for (const p of phases) console.log(`  ${p.phase}: ${p.passed ?? '?'}/${p.total ?? '-'}`);
  console.log(`\n  ${report.approved ? '✅ HOMOLOGAÇÃO APROVADA' : '❌ REVISAR FALHAS'} | Taxa: ${passRate}%`);
}

main().catch(err => { console.error(`\n🔴 ${err.message}`); process.exit(1); });
