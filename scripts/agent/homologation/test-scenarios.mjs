#!/usr/bin/env node
/**
 * test-scenarios.mjs — Testes Standalone de Validadores (Fase 2)
 * AchadoCerto.VIP
 *
 * Arquivo .mjs independente (sem shell quoting issues).
 * Executa cada cenário de falha importando os validadores diretamente.
 *
 * Uso: node scripts/agent/homologation/test-scenarios.mjs
 */

import { validateAffiliateUrl, validateFinalAffiliateUrl } from '../affiliate/link-builder.js';
import { validateProduct, validateCategorySafety } from '../validators/product-validator.js';
import { calculateFinalScore } from '../validators/final-score.js';
import { analyzeHallucinations } from '../validators/anti-hallucination.js';
import { generateProductHash } from '../validators/product-hash.js';
import { acquireLock, releaseLock } from '../core/execution.js';
import { runEditorialGates } from '../validators/editorial-gate.js';

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    const result = fn();
    const ok = result === true;
    if (ok) passed++;
    console.log(`  ${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — ${result}`}`);
  } catch (e) {
    console.log(`  ❌ ${name} — EXCEPTION: ${e.message}`);
  }
}

function testAsync(name, fn) {
  total++;
  return Promise.resolve().then(() => fn()).then(ok => {
    if (ok) passed++;
    console.log(`  ${ok ? '✅' : '❌'} ${name}${ok ? '' : ' — falhou'}`);
  }).catch(e => {
    console.log(`  ❌ ${name} — EXCEPTION: ${e.message}`);
  });
}

console.log('🧪 TESTES DE VALIDAÇÃO (Fase 2 — Standalone)');
console.log('='.repeat(60));

// ─── 2. ASIN inválido ────────────────────────────────────────
console.log('\n📌 Validação de Links');
test('ASIN inválido → rejeitado', () => {
  const r = validateAffiliateUrl('https://www.amazon.com.br/dp/INVALID?tag=teste', 'teste');
  return !r.valid || 'validateAffiliateUrl aceitou ASIN inválido';
});

// ─── 5. Imagem quebrada ──────────────────────────────────────
console.log('\n📌 Validação de Produto');
test('Imagem vazia → product-validator rejeita', () => {
  const r = validateProduct({
    name: 'Teste', title: 'Teste', imageUrl: '',
    description: 'Desc', affiliateUrl: 'https://amazon.com.br/dp/B08L6QPNB8?tag=x'
  }, { expectedCategory: 'beleza' });
  return !r.pass || 'validateProduct aceitou imagem vazia';
});

// ─── 6. Lock concorrente ─────────────────────────────────────
console.log('\n📌 Lock');
test('Lock impede execução dupla', () => {
  const l1 = acquireLock();
  const l2 = acquireLock();
  releaseLock();
  return l1.acquired && !l2.acquired || 'Lock2 deveria ter sido recusado';
});

// ─── 7. Categoria vazia ──────────────────────────────────────
console.log('\n📌 Segurança de Categoria');
test('Categoria vazia → validateCategorySafety rejeita', () => {
  const r = validateCategorySafety('', 'Produto Teste');
  return !r.pass || 'validateCategorySafety aceitou categoria vazia';
});
test('Categoria inválida → validateCategorySafety rejeita', () => {
  const r = validateCategorySafety('categoria_inexistente', 'Produto Teste');
  return !r.pass || 'validateCategorySafety aceitou categoria inválida';
});

// ─── 8. Score final zerado ────────────────────────────────────
console.log('\n📌 Score Final');
test('Score zerado → REPROVADO', () => {
  const r = calculateFinalScore({
    productValidation: null, category: null,
    imageValidation: null, seoResult: null,
    editorialResult: null, markdownContent: null
  });
  return !r.passed || 'calculateFinalScore deveria ter reprovado';
});

// ─── 9. IA vazia ─────────────────────────────────────────────
console.log('\n📌 Editorial Gate');
test('Conteúdo curto → EDITORIAL_GATE bloqueia', () => {
  const r = runEditorialGates('Conteudo curto.', {
    title: 'Produto', category: 'beleza', slug: 'produto'
  });
  return !r.passed || 'editorial-gate deveria ter bloqueado';
});

// ─── 10. Anti-alucinação ──────────────────────────────────────
console.log('\n📌 Anti-alucinação');
test('Claims inventados → detectados', () => {
  // Texto que ativa MULTIPLOS padrões de alucinação:
  //   - Citação direta: "Este produto é incrível!"
  //   - Review genérica: avaliação média dos clientes
  //   - Depoimento coletivo: clientes relatam
  //   - Garantia não confirmada: garantia de 5 anos
  //   - Certificação sem fonte: certificação do INMETRO
  //   - Número absoluto: mais de 2 milhões de clientes
  //   - Claim proibido: clinicamente comprovado, melhor qualidade, resultados garantidos
  const r = analyzeHallucinations(
    'A avaliação média dos clientes é excelente. "Este produto é incrível e mudou minha vida!" '
    + 'Nossos clientes relatam resultados surpreendentes após apenas 3 dias de uso. '
    + 'A certificação do INMETRO comprova a qualidade superior deste produto. '
    + 'Oferecemos garantia de 5 anos para sua tranquilidade. '
    + 'Mais de 2 milhões de clientes satisfeitos em todo o Brasil. '
    + 'Este é clinicamente comprovado e possui a melhor qualidade do mercado. '
    + 'Resultados garantidos ou seu dinheiro de volta.'
      .repeat(5),
    { specs: ['Ingrediente A', 'Ingrediente B'], brand: 'MarcaX' }
  );
  return !r.passed || 'anti-hallucination deveria ter detectado, violations=' + r.violations.length;
});

// ─── 11. Link inválido ────────────────────────────────────────
console.log('\n📌 Link Afiliado');
test('URL inválida → validateFinalAffiliateUrl rejeita', () => {
  const r = validateFinalAffiliateUrl('https://www.amazon.com.br/dp/ZZZZZZZZZZ?tag=teste');
  return !r.valid || 'validateFinalAffiliateUrl aceitou URL inválida';
});

// ─── 12. Hash alterado ────────────────────────────────────────
console.log('\n📌 Hash do Produto');
test('Hash alterado → detectado', () => {
  const h1 = generateProductHash({ asin: 'B08L6QPNB8', title: 'Original', brand: 'Marca', category: 'beleza' });
  const h2 = generateProductHash({ asin: 'B08L6QPNB8', title: 'Trocado', brand: 'Marca', category: 'beleza' });
  return h1 !== h2 || 'generateProductHash deveria ter retornado hashes diferentes';
});

// ─── Resumo ────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log(`📊 Resultado: ${passed}/${total} — ${Math.round(passed/total*100)}%`);
process.exit(passed === total ? 0 : 1);
