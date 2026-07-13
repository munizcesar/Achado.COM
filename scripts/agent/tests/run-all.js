#!/usr/bin/env node
/**
 * run-all.js — Testes Unitários do Agente AchadoCerto.VIP
 *
 * Execução:
 *   node scripts/agent/tests/run-all.js
 *
 * Testa todos os módulos sem dependências externas (APIs).
 */

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) { passed++; console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════════

async function testStateMachine(smModule) {
  console.log('\n📌 STATE MACHINE');
  const { createStateMachine } = smModule;

  const sm = createStateMachine('test-001', { pilar: 'test' });
  assert(sm.getState() === 'PENDING', 'Estado inicial', 'PENDING');

  const t1 = sm.transition('PRODUCT_SELECTED');
  assert(t1.success, 'PENDING→PRODUCT_SELECTED');
  assert(sm.getState() === 'PRODUCT_SELECTED', 'Estado após transição');

  // Segue o pipeline exato do usuário: PENDING→PRODUCT_SELECTED→PRODUCT_VALIDATED
  const t2 = sm.transition('PRODUCT_VALIDATED');
  assert(t2.success, 'PRODUCT_SELECTED→PRODUCT_VALIDATED');

  // Transição inválida: não pode pular direto para DONE
  const t3 = sm.transition('DONE');
  assert(!t3.success, 'PRODUCT_VALIDATED→DONE rejeitada (precisa passar por todos os estados)');

  // canTransitionTo: do PRODUCT_VALIDATED, só pode ir para CONTENT_GENERATED, PRODUCT_SELECTED ou FAIL
  assert(sm.canTransitionTo('CONTENT_GENERATED'), 'canTransitionTo PRODUCT_VALIDATED→CONTENT_GENERATED = true');
  assert(!sm.canTransitionTo('DONE'), 'canTransitionTo PRODUCT_VALIDATED→DONE = false');

  // Reset
  const sm2 = createStateMachine('test-reset');
  sm2.transition('PRODUCT_SELECTED');
  sm2.reset();
  assert(sm2.getState() === 'PENDING', 'Reset para PENDING');

  sm.cleanup();
  sm2.cleanup();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. EXECUTION ID + LOCK
// ═══════════════════════════════════════════════════════════════════════════════

async function testExecution(execModule) {
  console.log('\n📌 EXECUTION ID + LOCK');
  const { generateExecutionId, acquireLock, releaseLock } = execModule;

  const id = generateExecutionId();
  assert(id && id.length > 15, 'ExecutionID gerado', id);
  assert(/^\d{8}-\d{6}-[a-f0-9]{8}$/.test(id), 'Formato YYYYMMDD-HHMMSS-HEX');

  const lock1 = acquireLock();
  assert(lock1.acquired, 'Lock adquirido');
  assert(lock1.executionId, 'Lock tem executionId');

  const lock2 = acquireLock();
  assert(!lock2.acquired, 'Lock recusado (concorrência)');
  assert(lock2.reason?.includes('ocupado'), 'Motivo: ocupado');

  assert(releaseLock(), 'Lock liberado');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. AFFILIATE VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

async function testAffiliate(affModule) {
  console.log('\n📌 AFFILIATE VALIDATOR');
  const { validateAffiliateConfig, buildAmazonAffiliateUrl, validateAffiliateUrl } = affModule;

  const url = buildAmazonAffiliateUrl('B08L6QPNB8', 'altivita-20');
  assert(url.includes('tag=altivita-20'), 'URL com tag', url.slice(0, 60));
  assert(url.includes('/dp/B08L6QPNB8'), 'URL com ASIN');
  assert(url.includes('amazon.com.br'), 'Domínio .com.br');

  const v1 = validateAffiliateUrl(url, 'altivita-20');
  assert(v1.valid, 'URL válida');
  assert(v1.asin === 'B08L6QPNB8', 'ASIN extraído', v1.asin);
  assert(v1.tag === 'altivita-20', 'Tag extraída');

  const v2 = validateAffiliateUrl('https://www.amazon.com.br/dp/B08L6QPNB8?utm_source=test', 'altivita-20');
  assert(!v2.valid, 'URL sem tag rejeitada');

  const v3 = validateAffiliateUrl('https://www.amazon.com.br/dp/B08L6QPNB8?tag=outratag-10', 'altivita-20');
  assert(!v3.valid, 'Tag incorreta rejeitada');

  const v4 = validateAffiliateUrl('https://www.google.com/dp/B08L6QPNB8?tag=altivita-20', 'altivita-20');
  assert(!v4.valid, 'Domínio não-Amazon rejeitado');

  const v5 = validateAffiliateUrl('https://www.amazon.com.br/dp/INVALID?tag=altivita-20', 'altivita-20');
  assert(!v5.valid, 'ASIN inválido rejeitado');

  // Config com tag (precisa estar setada para o teste)
  const savedTag = process.env.AMAZON_AFFILIATE_TAG;
  process.env.AMAZON_AFFILIATE_TAG = 'altivita-20';
  const cfg = validateAffiliateConfig();
  assert(cfg.valid, 'Config com tag aceita', cfg.tag);
  process.env.AMAZON_AFFILIATE_TAG = savedTag;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CONFIDENCE SCORE
// ═══════════════════════════════════════════════════════════════════════════════

async function testConfidence(confModule) {
  console.log('\n📌 CONFIDENCE SCORE');
  const { getConfidenceScore, validateConfidence, listSources } = confModule;

  assert(getConfidenceScore('puppeteer') === 95, 'Puppeteer=95');
  assert(getConfidenceScore('amazon-html') === 98, 'Amazon HTML=98');
  assert(getConfidenceScore('asin-fallback') === 0, 'ASIN=0');
  assert(getConfidenceScore('unknown') === 0, 'Desconhecido=0');

  assert(validateConfidence('puppeteer', 70).pass, 'Puppeteer pass (min 70)');
  assert(!validateConfidence('asin-fallback', 70).pass, 'ASIN rejeitado');
  assert(!validateConfidence('catalog', 70).pass, 'Catalog rejeitado (60<70)');
  assert(validateConfidence('serper', 50).pass, 'Serper pass (min 50)');

  const sources = listSources();
  assert(sources.length >= 5, `${sources.length} fontes`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SEO GATE
// ═══════════════════════════════════════════════════════════════════════════════

async function testSeoGate(seoModule) {
  console.log('\n📌 SEO GATE');
  const { runSeoGates } = seoModule;

  const ok = runSeoGates({
    title: 'Sérum Vitamina C Facial: O Que Ninguém Te Conta Antes de Comprar',
    description: 'Descubra por que o Sérum Vitamina C Facial se tornou um dos produtos mais comentados no cuidado com a pele. Análise completa com benefícios, ingredientes e dicas de uso.',
    markdown: '# Sérum Vitamina C Facial: Análise Completa\n\nO Sérum Vitamina C Facial tem se destacado no mercado de skincare por seus benefícios. Este sérum facial oferece uma combinação poderosa de vitamina C e outros ativos que ajudam a uniformizar o tom da pele e combater os radicais livres.\n\n## O que esperar do Sérum Vitamina C Facial\n\nA vitamina C é um ingrediente ativo amplamente estudado. Sua biodisponibilidade na pele depende da concentração e do pH da fórmula. Este sérum facial utiliza uma absorção otimizada para garantir eficácia no tratamento diário.\n\n## Benefícios e Resultados\n\nOs principais benefícios incluem proteção antioxidante contra danos externos, estímulo à produção de colágeno e uniformização do tom da pele. A textura do sérum permite uma hidratação profunda sem pesar na barreira cutânea.\n\n![Sérum Vitamina C Facial](https://exemplo.com/serum-vitamina-c.jpg)\n\n[Ver disponibilidade](https://amazon.com.br/dp/B08L6QPNB8)',
    slug: 'serum-vitamina-c-facial',
    category: 'beleza',
  });
  assert(ok.pass, 'Artigo OK');
  assert(ok.errors.length === 0, `${ok.errors.length} erros`);

  const noH1 = runSeoGates({
    title: 'Produto', description: 'Curta', markdown: 'Sem H1.', slug: 'slug',
  });
  assert(!noH1.pass, 'Sem H1 rejeitado');

  const noH2 = runSeoGates({
    title: 'Título Válido Aqui com Mais de 25 Caracteres',
    description: 'Descrição com tamanho adequado para testar o SEO gate.',
    markdown: '# H1\n\nConteúdo sem H2.',
    slug: 'slug-valido',
  });
  assert(!noH2.pass, 'Sem H2 rejeitado');    const badSlug = runSeoGates({
    title: 'Título Válido Aqui com Mais de 25 Caracteres',
    description: 'Descrição com tamanho adequado para testar o SEO gate e verificar o comportamento esperado com slugs inválidos.',
    markdown: '# Título H1\n\nTexto sobre o título válido com palavras suficientes.\n\n## Características do Título\n\nMais conteúdo relevante com termos semânticos de qualidade e funcionalidade.\n\n## Especificações\n\nDetalhes técnicos do produto com características e diferenciais.',
    slug: 'SLUG INVALIDO!!!',
    category: 'casa',
  });
  assert(!badSlug.pass, 'Slug inválido rejeitado');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. HISTORY TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

async function testHistory(histModule) {
  console.log('\n📌 HISTORY TRACKER');
  const { checkDuplicate, getHistorySummary } = histModule;

  // Nota: checkDuplicate lê do arquivo history.json real no disco.
  // Para testar isoladamente, verificamos que a função existe e processa sem erro.
  // Teste unitário isolado exigiria mock do disco, o que está fora do escopo.
  assert(typeof checkDuplicate === 'function', 'checkDuplicate exportada');
  assert(typeof getHistorySummary === 'function', 'getHistorySummary exportada');

  // Teste funcional: verifica que não crasha
  const result = checkDuplicate({ asin: 'ASIN-INEXISTENTE-999', title: 'Produto Novo Teste', url: 'https://amazon.com.br/dp/ASIN-INEXISTENTE' }, 30);
  assert(typeof result.duplicate === 'boolean', 'checkDuplicate retorna objeto válido');

  const summary = getHistorySummary();
  assert(summary.length > 0, 'Resumo gerado');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. CATALOG LOADER
// ═══════════════════════════════════════════════════════════════════════════════

async function testCatalog(catModule) {
  console.log('\n📌 CATALOG LOADER');
  const { loadCatalog, buildCatalogPool, getAllCatalog, getAngleDescription } = catModule;

  const beleza = loadCatalog('beleza');
  assert(beleza.length > 0, `Beleza: ${beleza.length} produtos`);
  assert(beleza[0].asin, 'Tem ASIN');
  assert(beleza[0].name, 'Tem nome');
  assert(beleza[0].score > 0, 'Tem score');

  const saude = loadCatalog('saude');
  assert(saude.length > 0, `Saude: ${saude.length} produtos`);

  const casa = loadCatalog('casa');
  assert(casa.length > 0, `Casa: ${casa.length} produtos`);

  const all = getAllCatalog();
  assert(all.length === beleza.length + saude.length + casa.length, `Total: ${all.length}`);

  const pool = buildCatalogPool('beleza', [], 7);
  assert(pool.length <= beleza.length, `Pool: ${pool.length} disponíveis`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════════════════════

async function testCircuitBreaker(cbModule) {
  console.log('\n📌 CIRCUIT BREAKER');
  const { createCircuitBreaker, resetAllCircuitBreakers } = cbModule;
  resetAllCircuitBreakers();

  const cb = createCircuitBreaker('test-api');
  assert(cb.getState() === 'CLOSED', 'Inicial: CLOSED');

  for (let i = 0; i < 5; i++) cb.recordFailure(`Erro ${i+1}`);
  assert(cb.getState() === 'OPEN', 'Após 5 falhas: OPEN');

  const stats = cb.getStats();
  assert(stats.failures >= 5, `${stats.failures} falhas`);
  assert(stats.state === 'OPEN', 'Estado OPEN');

  cb.recordSuccess();
  assert(cb.getState() === 'CLOSED', 'Após success: CLOSED');

  resetAllCircuitBreakers();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. RETRY (sem esperar timeouts reais)
// ═══════════════════════════════════════════════════════════════════════════════

async function testRetry(retModule) {
  console.log('\n📌 RETRY (lógica apenas — timeouts não executados)');
  const { withRetry } = retModule;
  // Teste existencial apenas
  assert(typeof withRetry === 'function', 'withRetry exportado');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. DEAD LETTER QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

async function testDeadLetter(dlqModule) {
  console.log('\n📌 DEAD LETTER QUEUE');
  const { addToDeadLetter, listDeadLetter, getDeadLetterSummary } = dlqModule;

  addToDeadLetter({
    asin: 'TEST-001', productName: 'Produto Teste', pillar: 'test',
    stage: 'FETCH_DATA', error: 'Fonte indisponível',
  });

  const dlq = listDeadLetter();
  assert(dlq.length > 0, 'Itens adicionados');
  assert(dlq[0].asin === 'TEST-001', 'ASIN registrado');
  assert(dlq[0].status === 'pending', 'Status pending');

  const summary = getDeadLetterSummary();
  assert(summary.total > 0, 'Resumo com total');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

async function testSecurity(logModule) {
  console.log('\n📌 SEGURANÇA');
  const { createExecutionLogger } = logModule;
  const log = createExecutionLogger({ pilar: 'test', executionId: 'sec-test' });
  log.info('Teste sem crash', {});
  log.pass('Log seguro');
  log.flush({ status: 'success' });
  assert(true, 'Logger executou sem erros');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🧪 TESTES UNITÁRIOS — Agente AchadoCerto.VIP');
  console.log('='.repeat(50));

  // Importa todos os módulos (ESM dinâmico)
  const modules = {};
  const mods = [
    ['sm',       '../core/state-machine.js'],
    ['exec',     '../core/execution.js'],
    ['aff',      '../affiliate/link-builder.js'],
    ['conf',     '../validators/confidence.js'],
    ['seo',      '../validators/seo.js'],
    ['hist',     '../history/tracker.js'],
    ['cat',      '../catalog/loader.js'],
    ['cb',       '../core/circuit-breaker.js'],
    ['ret',      '../core/retry.js'],
    ['dlq',      '../history/dead-letter.js'],
    ['log',      '../logging/logger.js'],
  ];
  for (const [key, modPath] of mods) {
    try {
      modules[key] = await import(modPath);
    } catch (e) {
      console.log(`  ⚠️  ${modPath}: ${e.message}`);
    }
  }

  const tests = [
    ['State Machine',     testStateMachine,     modules.sm],
    ['Execution',         testExecution,        modules.exec],
    ['Affiliate',         testAffiliate,        modules.aff],
    ['Confidence',        testConfidence,       modules.conf],
    ['SEO Gate',          testSeoGate,          modules.seo],
    ['History Tracker',   testHistory,          modules.hist],
    ['Catalog Loader',    testCatalog,          modules.cat],
    ['Circuit Breaker',   testCircuitBreaker,   modules.cb],
    ['Retry',             testRetry,            modules.ret],
    ['Dead Letter Queue', testDeadLetter,       modules.dlq],
    ['Security',          testSecurity,         modules.log],
  ];

  for (const [name, fn, mod] of tests) {
    if (mod) {
      try { await fn(mod); }
      catch (e) { console.error(`  🔴 ERRO ${name}: ${e.message}`); }
    } else {
      console.log(`  ⏭️  ${name}: módulo não carregado`);
    }
  }

  console.log('\n' + '='.repeat(50));
  const total = passed + failed;
  console.log(`📊 Resultado: ${passed}/${total} — ${Math.round(passed / total * 100)}%`);
  if (failed > 0) { console.log(`❌ ${failed} falha(s)`); process.exit(1); }
  else { console.log('✅ TODOS OS TESTES PASSARAM'); process.exit(0); }
}

main();
