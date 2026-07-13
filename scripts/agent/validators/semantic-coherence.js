#!/usr/bin/env node
/**
 * semantic-coherence.js — Análise de Coerência Semântica + AutoAuditoria IA
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Após a IA escrever o artigo, executa:
 *   1. Análise semântica completa (título, H1, introdução, FAQ, conclusão)
 *   2. AutoAuditoria de 11 perguntas estruturadas
 *   3. Resposta SIM/NÃO: "Todo o artigo fala do mesmo produto?"
 *
 * AutoAuditoria (11 perguntas):
 *   ✓ O artigo trata exclusivamente do produto correto?
 *   ✓ O título corresponde exatamente ao produto?
 *   ✓ O H1 corresponde ao produto?
 *   ✓ Todas as imagens representam o mesmo produto?
 *   ✓ Todos os links apontam para o mesmo ASIN?
 *   ✓ Existe alguma informação não comprovada?
 *   ✓ Existe especificação inventada?
 *   ✓ Existe benefício não suportado?
 *   ✓ A categoria está correta?
 *   ✓ O CTA leva ao mesmo produto?
 *   ✓ O artigo está apto para publicação?
 */

import fs from 'fs';

/**
 * Extrai seções do markdown.
 */
function extractSections(markdown) {
  const sections = {};

  // Frontmatter title
  const fmTitleMatch = markdown.match(/^title:\s*"([^"]+)"\s*$/m);
  if (fmTitleMatch) sections.titulo = fmTitleMatch[1].trim();

  // H1
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) sections.h1 = h1Match[1].trim();

  // Introdução (primeiro parágrafo após frontmatter e H1)
  const bodyStart = markdown.replace(/---[\s\S]*?---\n*/, '').replace(/^#\s+.+$/m, '').trim();
  const paragraphs = bodyStart.split(/\n\n+/).filter(p => p.trim().length > 50 && !p.startsWith('#') && !p.startsWith('---'));
  if (paragraphs.length > 0) sections.introducao = paragraphs[0].trim();

  // H2s
  const h2Matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  sections.h2s = h2Matches.map(m => m[1].trim());

  // FAQ
  const faqMatch = markdown.match(/##\s*(?:Perguntas\s*Frequentes|FAQ|Dúvidas\s*Comuns)[\s\S]*?(?=##|$)/i);
  if (faqMatch) sections.faq = faqMatch[0].trim();

  // Conclusão
  const cleanBody = markdown.replace(/---[\s\S]*?---\n*/, '').replace(/\n---\n[\s\S]*$/, '').trim();
  const allParas = cleanBody.split(/\n\n+/).filter(p => p.trim().length > 50 && !p.startsWith('#') && !p.startsWith('---'));
  if (allParas.length > 0) sections.conclusao = allParas[allParas.length - 1].trim();

  return sections;
}

/**
 * Normaliza texto para comparação semântica.
 */
function normalize(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai palavras-chave distintivas de um nome de produto.
 */
function extractKeyTerms(productName) {
  const genericWords = ['para', 'com', 'sem', 'mais', 'menos', 'que', 'por', 'uma', 'uns', 
    'das', 'dos', 'nas', 'nos', 'pela', 'pelo', 'numa', 'num', 'de', 'da', 'do', 'no', 'na',
    'em', 'ao', 'aos', 'a', 'as', 'como', 'entre', 'apos', 'depois', 'antes', 'sobre',
    'tipo', 'cor', 'modelo', 'versao', 'linha', 'serie', 'original',
    'novo', 'nova', 'unico', 'unica', 'especial', 'super', 'plus',
    'preto', 'branco', 'azul', 'verde', 'vermelho', 'amarelo', 'rosa', 'roxo', 'laranja',
    'cinza', 'marrom', 'bege', 'dourado', 'prata', 'grafite'];

  const words = normalize(productName).split(/\s+/).filter(w => 
    w.length > 3 && !genericWords.includes(w) && !/^\d+$/.test(w)
  );
  return [...new Set(words)];
}

/**
 * Verifica se uma seção menciona o produto.
 */
function checkSectionCoherence(sectionName, sectionText, keyTerms, productName) {
  if (!sectionText) return { pass: true, detail: 'Seção vazia — ignorada' };
  const normalizedSection = normalize(sectionText);
  const matchedTerms = keyTerms.filter(t => normalizedSection.includes(t));
  const matchRatio = keyTerms.length > 0 ? matchedTerms.length / keyTerms.length : 0;
  if (matchedTerms.length === 0 && keyTerms.length >= 2) {
    return {
      pass: false,
      detail: `"${sectionName}" não menciona termos distintivos do produto`,
      matchedTerms, matchRatio,
    };
  }
  return {
    pass: true,
    detail: `"${sectionName}" coerente (${matchedTerms.length}/${keyTerms.length} termos)`,
    matchedTerms, matchRatio,
  };
}

/**
 * Detecta menções a outros produtos.
 */
function detectOtherProducts(content, productName) {
  if (!content || !productName) return [];
  const normalizedContent = normalize(content);
  const normalizedProduct = normalize(productName);
  const productTerms = normalizedProduct.split(/\s+/).filter(w => w.length > 4);
  const otherProductPatterns = [
    /\b(?:diferente\s+do|comparado\s+(?:ao|com\s+o)|em\s+comparacao\s+(?:ao|com\s+o)|ao\s+contrario\s+(?:do|da))\s+([A-Za-z][A-Za-z\s]{5,50}?)(?:\.|,|;|\n)/gi,
    /\b(?:alternativa\s+(?:ao|a|para\s+o|para\s+a))\s+([A-Za-z][A-Za-z\s]{5,50}?)(?:\.|,|;|\n)/gi,
  ];
  const mentions = [];
  for (const pattern of otherProductPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const mentioned = match[1].trim();
      const normMentioned = normalize(mentioned);
      const shareTerms = productTerms.filter(t => normMentioned.includes(t));
      if (shareTerms.length < 2 && mentioned.length > 5) {
        mentions.push(mentioned.slice(0, 60));
      }
    }
  }
  return mentions;
}

/**
 * Executa a autoauditoria estruturada de 11 perguntas.
 * 
 * @param {string} markdown - Conteudo markdown completo
 * @param {object} productData - Dados do produto
 * @param {string} [affiliateUrl] - URL de afiliado para validar CTAs
 * @returns {{
 *   passed: boolean,
 *   questions: Array<{ id: number, question: string, pass: boolean, detail: string }>,
 *   summary: string
 * }}
 */
export function runSelfAudit(markdown, productData = {}, affiliateUrl) {
  if (!markdown || markdown.length < 200) {
    return { passed: false, questions: [], summary: 'Conteudo insuficiente para auditoria' };
  }

  const productName = productData?.name || productData?.productName || productData?.title || '';
  const category = productData?.category || productData?.pillar || '';
  const keyTerms = extractKeyTerms(productName);
  const sections = extractSections(markdown);
  const questions = [];
  let passedCount = 0;
  let failedCount = 0;

  // 1. O artigo trata exclusivamente do produto correto?
  const otherProducts = detectOtherProducts(markdown, productName);
  const q1 = otherProducts.length === 0;
  questions.push({ id: 1, question: 'O artigo trata exclusivamente do produto correto?', pass: q1, detail: q1 ? 'Sim, nenhum outro produto mencionado' : `Nao: outros produtos mencionados: ${otherProducts.join(', ')}` });
  if (q1) passedCount++; else failedCount++;

  // 2. O titulo corresponde exatamente ao produto?
  const titleMatch = keyTerms.length > 0 && sections.titulo
    ? keyTerms.some(t => normalize(sections.titulo).includes(t))
    : true;
  questions.push({ id: 2, question: 'O titulo corresponde exatamente ao produto?', pass: titleMatch, detail: titleMatch ? 'Sim' : `Nao: titulo "${(sections.titulo || '').slice(0, 50)}" nao contem termos do produto` });
  if (titleMatch) passedCount++; else failedCount++;

  // 3. O H1 corresponde ao produto?
  const h1Match = keyTerms.length > 0 && sections.h1
    ? keyTerms.some(t => normalize(sections.h1).includes(t))
    : true;
  questions.push({ id: 3, question: 'O H1 corresponde ao produto?', pass: h1Match, detail: h1Match ? 'Sim' : `Nao: H1 "${(sections.h1 || '').slice(0, 50)}" nao contem termos do produto` });
  if (h1Match) passedCount++; else failedCount++;

  // 4. Todas as imagens representam o mesmo produto?
  const imgAltTexts = [...markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(m => m[1]);
  const imgsMatchProduct = imgAltTexts.length === 0 || keyTerms.length === 0 || imgAltTexts.some(alt => keyTerms.some(t => normalize(alt).includes(t)));
  questions.push({ id: 4, question: 'Todas as imagens representam o mesmo produto?', pass: imgsMatchProduct, detail: imgsMatchProduct ? `Sim (${imgAltTexts.length} imagem(ns))` : 'Nao: ALT text nao menciona o produto' });
  if (imgsMatchProduct) passedCount++; else failedCount++;

  // 5. Todos os links apontam para o mesmo ASIN?
  const links = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(m => m[2]);
  const amazonLinks = links.filter(l => l.includes('amazon') || l.includes('/dp/'));
  let allSameAsin = true;
  if (amazonLinks.length > 1 && affiliateUrl) {
    const expectedAsin = affiliateUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1];
    if (expectedAsin) {
      allSameAsin = amazonLinks.every(l => l.includes(expectedAsin));
    }
  }
  questions.push({ id: 5, question: 'Todos os links apontam para o mesmo ASIN?', pass: allSameAsin, detail: allSameAsin ? `Sim (${amazonLinks.length} link(s) Amazon)` : 'Nao: links apontam para ASINs diferentes' });
  if (allSameAsin) passedCount++; else failedCount++;

  // 6. Existe alguma informacao nao comprovada? (delegado ao anti-hallucination)
  questions.push({ id: 6, question: 'Existe alguma informacao nao comprovada?', pass: true, detail: 'Delegado ao Anti-Alucinacao' });
  passedCount++;

  // 7. Existe especificacao inventada?
  const hasSuspiciousSpecs = /(?:dimensoes|medidas|peso)\s*(?:aproximadas?|aproximados?)\s*(?::\s*)?\d+[x\s*]\d+/i.test(markdown);
  questions.push({ id: 7, question: 'Existe especificacao inventada?', pass: !hasSuspiciousSpecs, detail: hasSuspiciousSpecs ? 'Suspeita: especificacao nao verificada' : 'Nao identificado' });
  if (!hasSuspiciousSpecs) passedCount++; else failedCount++;

  // 8. Existe beneficio nao suportado?
  const hasUnsupportedBenefits = /(?:resultados\s*(?:garantidos|certos|absolutos|imediatos|rapidos)|eficacia\s*(?:comprovada|garantida|total|absoluta))/i.test(markdown);
  questions.push({ id: 8, question: 'Existe beneficio nao suportado?', pass: !hasUnsupportedBenefits, detail: hasUnsupportedBenefits ? 'Suspeita: claim absoluta de eficacia' : 'Nao identificado' });
  if (!hasUnsupportedBenefits) passedCount++; else failedCount++;

  // 9. A categoria esta correta?
  const catOk = !!(category && ['beleza', 'saude', 'casa', 'tech', 'esportes', 'automotivo'].includes(category));
  questions.push({ id: 9, question: 'A categoria esta correta?', pass: catOk, detail: catOk ? `Sim: ${category}` : 'Nao: categoria invalida ou ausente' });
  if (catOk) passedCount++; else failedCount++;

  // 10. O CTA leva ao mesmo produto?
  const ctaLeadsToProduct = amazonLinks.length === 0 || !affiliateUrl || amazonLinks.some(l => {
    const linkAsin = l.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1];
    const expectedAsin = affiliateUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1];
    return linkAsin && expectedAsin && linkAsin === expectedAsin;
  });
  questions.push({ id: 10, question: 'O CTA leva ao mesmo produto?', pass: ctaLeadsToProduct, detail: ctaLeadsToProduct ? 'Sim' : 'Nao: CTA aponta para produto diferente' });
  if (ctaLeadsToProduct) passedCount++; else failedCount++;

  // 11. O artigo esta apto para publicacao?
  const apt = failedCount === 0;
  questions.push({ id: 11, question: 'O artigo esta apto para publicacao?', pass: apt, detail: apt ? 'Sim: todas as verificacoes passaram' : `Nao: ${failedCount} verificacao(oes) falharam` });
  if (apt) passedCount++; else failedCount++;

  return {
    passed: apt,
    questions,
    summary: `AutoAuditoria: ${passedCount}/${questions.length} aprovadas — ${apt ? 'APTO' : 'REPROVAR'}`,
    details: { total: questions.length, passed: passedCount, failed: failedCount },
  };
}

/**
 * Executa a analise semantica completa do artigo.
 */
export function analyzeSemanticCoherence(markdown, productData = {}) {
  if (!markdown || markdown.length < 200) {
    return { passed: false, checks: [], otherProducts: [], score: 0, summary: 'Conteudo insuficiente para analise' };
  }

  const productName = productData?.name || productData?.productName || productData?.title || '';
  if (!productName) {
    return { passed: false, checks: [], otherProducts: [], score: 0, summary: 'Nome do produto nao disponivel' };
  }

  const keyTerms = extractKeyTerms(productName);
  if (keyTerms.length === 0) {
    return { passed: true, checks: [{ name: 'termos', pass: true, detail: 'Produto muito curto — analise ignorada' }], otherProducts: [], score: 100, summary: 'Analise ignorada' };
  }

  const sections = extractSections(markdown);
  const checks = [];
  let passedChecks = 0, failedChecks = 0;

  const titleCheck = checkSectionCoherence('titulo', sections.titulo, keyTerms, productName);
  checks.push({ name: 'coerencia_titulo', ...titleCheck });
  if (titleCheck.pass) passedChecks++; else failedChecks++;

  const h1Check = checkSectionCoherence('H1', sections.h1, keyTerms, productName);
  checks.push({ name: 'coerencia_h1', ...h1Check });
  if (h1Check.pass) passedChecks++; else failedChecks++;

  const introCheck = checkSectionCoherence('introducao', sections.introducao, keyTerms, productName);
  checks.push({ name: 'coerencia_introducao', ...introCheck });
  if (introCheck.pass) passedChecks++; else failedChecks++;

  const faqCheck = checkSectionCoherence('FAQ', sections.faq, keyTerms, productName);
  checks.push({ name: 'coerencia_faq', ...faqCheck });
  if (faqCheck.pass) passedChecks++; else failedChecks++;

  const concCheck = checkSectionCoherence('conclusao', sections.conclusao, keyTerms, productName);
  checks.push({ name: 'coerencia_conclusao', ...concCheck });
  if (concCheck.pass) passedChecks++; else failedChecks++;

  const otherProducts = detectOtherProducts(markdown, productName);
  if (otherProducts.length > 0) {
    checks.push({ name: 'outros_produtos', pass: false, detail: `Mencao a outros produtos: ${otherProducts.join(', ')}` });
    failedChecks++;
  } else {
    checks.push({ name: 'outros_produtos', pass: true, detail: 'Nenhum outro produto mencionado' });
    passedChecks++;
  }

  if (sections.titulo && sections.h1) {
    const normTitle = normalize(sections.titulo);
    const normH1 = normalize(sections.h1);
    const titleWords = normTitle.split(/\s+/).filter(w => w.length > 3);
    const h1Words = normH1.split(/\s+/).filter(w => w.length > 3);
    const sharedWords = titleWords.filter(w => h1Words.includes(w));
    const titleH1Ratio = titleWords.length > 0 ? sharedWords.length / titleWords.length : 0;
    const consistent = titleH1Ratio >= 0.3 || titleWords.length < 3;
    checks.push({
      name: 'titulo_h1_consistencia', pass: consistent,
      detail: consistent ? `Titulo e H1 consistentes (${Math.round(titleH1Ratio * 100)}% termos em comum)` : `Titulo e H1 divergentes`,
    });
    if (consistent) passedChecks++; else failedChecks++;
  }

  const total = checks.length;
  const score = total > 0 ? Math.round((passedChecks / total) * 100) : 0;

  return {
    passed: failedChecks === 0,
    checks, otherProducts, score,
    summary: `${passedChecks}/${total} verificacoes semanticas passaram — ${score}% — ${failedChecks === 0 ? 'COERENTE' : 'INCOERENTE'}`,
    details: { total, passed: passedChecks, failed: failedChecks },
    sections: { hasTitle: !!sections.titulo, hasH1: !!sections.h1, hasIntro: !!sections.introducao, hasFaq: !!sections.faq, hasConclusion: !!sections.conclusao, h2Count: (sections.h2s || []).length },
  };
}

/**
 * Versao simplificada que responde SIM/NAO.
 */
export function quickCoherenceCheck(markdown, productName) {
  const result = analyzeSemanticCoherence(markdown, { name: productName });
  return {
    pass: result.passed,
    answer: result.passed ? 'SIM' : 'NAO',
    score: result.score,
    summary: result.summary,
  };
}
