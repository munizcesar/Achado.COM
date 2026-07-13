#!/usr/bin/env node
/**
 * final-score.js v2 — Score Final ELIMINATÓRIO
 * AchadoCerto.VIP — Agente Autônomo
 *
 * MODELO ELIMINATÓRIO (não apenas ponderado):
 *
 *   Critério            Mínimo    Tipo
 *   ─────────────────────────────────
 *   Produto             100%      OBRIGATÓRIO
 *   Categoria           100%      OBRIGATÓRIO
 *   Link de Afiliado    100%      OBRIGATÓRIO
 *   Coerência Semântica ≥95%      QUALIDADE
 *   SEO                 ≥90%      QUALIDADE
 *   Conteúdo Editorial  ≥90%      QUALIDADE
 *   Imagem              ≥90%      QUALIDADE
 *   CTA                 ≥70%      QUALIDADE
 *
 * Um artigo NUNCA é aprovado com 99% se o PRODUTO estiver errado.
 * Critérios OBRIGATÓRIOS falham → REPROVADO IMEDIATAMENTE.
 */

const ELIMINATORY_THRESHOLDS = {
  product_coherence:  { required: 100, type: 'mandatory', label: 'Produto' },
  category:           { required: 100, type: 'mandatory', label: 'Categoria' },
  affiliate_links:    { required: 100, type: 'mandatory', label: 'Link Afiliado' },
  semantic_coherence: { required: 95,  type: 'quality',  label: 'Coerência' },
  seo:                { required: 90,  type: 'quality',  label: 'SEO' },
  content:            { required: 90,  type: 'quality',  label: 'Conteúdo' },
  image:              { required: 90,  type: 'quality',  label: 'Imagem' },
  cta:                { required: 70,  type: 'quality',  label: 'CTA' },
};

const WEIGHTS = {
  product_coherence:  20,
  category:           10,
  image:              10,
  seo:                15,
  content:            15,
  affiliate_links:    15,
  cta:                5,
  semantic_coherence: 10,
};

function scoreProductCoherence(productValidation) {
  if (!productValidation) return 0;
  return productValidation.score || 0;
}

function scoreCategory(category) {
  if (!category) return 0;
  const valid = ['beleza', 'saude', 'casa', 'tech', 'esportes', 'automotivo'];
  if (!valid.includes(category)) return 0;
  if (category === 'casa') return 100; // Casa agora é válida (não mais fallback inseguro)
  return 100;
}

function scoreImage(imageValidation) {
  if (!imageValidation) return 0;
  return imageValidation.score || 0;
}

function scoreSeo(seoResult) {
  if (!seoResult) return 0;
  if (seoResult.pass) {
    let score = 70;
    if (seoResult.errors && seoResult.errors.length === 0) score += 20;
    if (seoResult.warnings && seoResult.warnings.length === 0) score += 10;
    return Math.min(100, score);
  }
  const errorCount = seoResult.errors?.length || 0;
  return Math.max(0, 60 - errorCount * 15);
}

function scoreContent(editorialResult) {
  if (!editorialResult || !editorialResult.editorialScore) return 0;
  const score = editorialResult.editorialScore.score || 0;
  const max = editorialResult.editorialScore.maxScore || 50;
  return Math.round((score / max) * 100);
}

function scoreAffiliateLinks(auditChecks) {
  if (!auditChecks || !Array.isArray(auditChecks)) return 0;
  const affiliateChecks = auditChecks.filter(c => 
    c.name === 'affiliate_tag' || c.name === 'affiliate_url'
  );
  if (affiliateChecks.length === 0) return 50;
  const passed = affiliateChecks.filter(c => c.pass).length;
  return Math.round((passed / affiliateChecks.length) * 100);
}

function scoreCta(markdownContent) {
  if (!markdownContent) return 0;
  const ctaPatterns = [/confira|acesse|veja|conheça|saiba\s*mais|verificar|comparar|consulte|aproveite|descubra|encontre/i];
  let score = 0;
  for (const pattern of ctaPatterns) {
    const matches = markdownContent.match(pattern);
    if (matches) score = Math.min(100, matches.length * 25);
  }
  if (score > 0) {
    const lastCtaIndex = Math.max(
      ...ctaPatterns.map(p => {
        const m = markdownContent.match(p);
        return m ? markdownContent.lastIndexOf(m[0]) : -1;
      }).filter(i => i > 0)
    );
    const contentLength = markdownContent.length;
    if (lastCtaIndex > contentLength * 0.7) score += 20;
  }
  return Math.min(100, score);
}

function scoreSemanticCoherence(coherenceResult) {
  if (!coherenceResult) return 0;
  return coherenceResult.score || 0;
}

/**
 * Calcula o score final ELIMINATÓRIO.
 *
 * Critérios OBRIGATÓRIOS (100%) falham → REPROVADO imediatamente,
 * independente dos outros scores.
 *
 * @param {object} scores
 * @returns {{
 *   score: number,
 *   passed: boolean,
 *   dimensions: object,
 *   mandatoryPassed: boolean,
 *   failures: Array<{ dimension: string, label: string, score: number, required: number, type: string }>,
 *   summary: string
 * }}
 */
export function calculateFinalScore(scores = {}) {
  const dimensionScores = {};
  const failures = [];

  // 1. Produto
  const productScore = scoreProductCoherence(scores.productValidation);
  dimensionScores.product_coherence = { score: productScore, weight: WEIGHTS.product_coherence, required: 100, type: 'mandatory' };

  // 2. Categoria
  const catScore = scoreCategory(scores.category);
  dimensionScores.category = { score: catScore, weight: WEIGHTS.category, required: 100, type: 'mandatory' };

  // 3. Imagem
  const imgScore = scoreImage(scores.imageValidation);
  dimensionScores.image = { score: imgScore, weight: WEIGHTS.image, required: 90, type: 'quality' };

  // 4. SEO
  const seoScore = scoreSeo(scores.seoResult);
  dimensionScores.seo = { score: seoScore, weight: WEIGHTS.seo, required: 90, type: 'quality' };

  // 5. Conteúdo
  const contentScore = scoreContent(scores.editorialResult);
  dimensionScores.content = { score: contentScore, weight: WEIGHTS.content, required: 90, type: 'quality' };

  // 6. Links afiliado
  const linkScore = scoreAffiliateLinks(scores.auditChecks);
  dimensionScores.affiliate_links = { score: linkScore, weight: WEIGHTS.affiliate_links, required: 100, type: 'mandatory' };

  // 7. CTA
  const ctaScore = scoreCta(scores.markdownContent);
  dimensionScores.cta = { score: ctaScore, weight: WEIGHTS.cta, required: 70, type: 'quality' };

  // 8. Coerência semântica
  const coherenceScore = scoreSemanticCoherence(scores.coherenceResult);
  dimensionScores.semantic_coherence = { score: coherenceScore, weight: WEIGHTS.semantic_coherence, required: 95, type: 'quality' };

  // ── VALIDAÇÃO ELIMINATÓRIA ─────────────────────────────────
  for (const [dim, data] of Object.entries(dimensionScores)) {
    if (data.score < data.required) {
      failures.push({
        dimension: dim,
        label: ELIMINATORY_THRESHOLDS[dim]?.label || dim,
        score: data.score,
        required: data.required,
        type: data.type,
      });
    }
  }

  // Critérios obrigatórios
  const mandatoryFailures = failures.filter(f => f.type === 'mandatory');
  const mandatoryPassed = mandatoryFailures.length === 0;

  // Score ponderado (apenas informativo — decisão é eliminatória)
  const totalWeight = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
  const weightedSum = Object.values(dimensionScores).reduce((s, d) => s + Math.round((d.score * d.weight) / 100), 0);
  const finalScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  // Decisão final
  const passed = failures.length === 0;

  // Build summary
  const summaryLines = [];
  summaryLines.push(`📊 SCORE FINAL: ${finalScore}% (${passed ? 'APROVADO' : 'REPROVADO'})`);
  for (const [dim, data] of Object.entries(dimensionScores)) {
    const label = ELIMINATORY_THRESHOLDS[dim]?.label || dim;
    const icon = data.score >= data.required ? '✅' : (data.type === 'mandatory' ? '🔴' : '🟡');
    const reqText = data.type === 'mandatory' ? 'OBRIGATÓRIO' : `mín ${data.required}%`;
    summaryLines.push(`  ${icon} ${label.padEnd(18)} ${String(data.score).padStart(3)}% (${reqText})`);
  }
  if (failures.length > 0) {
    summaryLines.push(`   ─${'─'.repeat(35)}`);
    for (const f of failures) {
      summaryLines.push(`   ${f.type === 'mandatory' ? '🔴' : '🟡'} ${f.label}: ${f.score}% < ${f.required}% (${f.type === 'mandatory' ? 'OBRIGATÓRIO' : 'QUALIDADE'})`);
    }
  }

  return {
    score: finalScore,
    passed,
    mandatoryPassed,
    failures,
    dimensions: dimensionScores,
    summary: summaryLines.join('\n'),
    details: {
      totalWeight,
      weightedSum,
      totalDimensions: Object.keys(dimensionScores).length,
      failedDimensions: failures.length,
    },
  };
}

/**
 * Versão resumida para logs do pipeline.
 */
export function formatScoreSummary(finalScore) {
  return finalScore.summary;
}
