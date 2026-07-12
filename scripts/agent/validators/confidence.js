#!/usr/bin/env node
/**
 * confidence.js — Score de Confiança por Fonte
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Cada fonte de dados retorna uma nota de confiança (0-100).
 * Se a melhor fonte disponível for inferior a um limite, a publicação é cancelada.
 *
 * Scores:
 *   Amazon PA-API     → 100 (quando implementado)
 *   Amazon HTML       → 98  (dados diretos da página)
 *   Puppeteer         → 95  (renderização real com JS)
 *   Serper            → 80  (Google Search)
 *   RapidAPI (ML)     → 70  (terceira parte)
 *   Catálogo fixo     → 60  (nome do produto sem confirmação)
 *   ASIN genérico     → 0   (NUNCA PUBLICAR)
 *
 * Limite mínimo para publicação: 70
 */

const CONFIDENCE_SCORES = {
  'pa-api':       100,
  'amazon-html':   98,
  'puppeteer':     95,
  'serper':        80,
  'rapidapi-ml':   70,
  'catalog':       60,
  'proxy':         55,
  'asin-fallback':  0,
};

const MINIMUM_CONFIDENCE = 70;

/**
 * Retorna o score de confiança para uma fonte.
 */
export function getConfidenceScore(source) {
  return CONFIDENCE_SCORES[source] || 0;
}

/**
 * Valida se a fonte tem confiança suficiente para publicação.
 *
 * @param {string} source - Nome da fonte
 * @param {number} [minimum] - Score mínimo (default: 70)
 * @returns {{ pass: boolean, score: number, minimum: number, error: string|null }}
 */
export function validateConfidence(source, minimum = MINIMUM_CONFIDENCE) {
  const score = getConfidenceScore(source);

  if (score === 0) {
    return {
      pass: false,
      score,
      minimum,
      error: `Fonte "${source}" tem score 0 — NUNCA PUBLICAR`,
    };
  }

  if (score < minimum) {
    return {
      pass: false,
      score,
      minimum,
      error: `Fonte "${source}" tem score ${score} — abaixo do mínimo ${minimum}`,
    };
  }

  return {
    pass: true,
    score,
    minimum,
    error: null,
  };
}

/**
 * Lista todas as fontes disponíveis com seus scores.
 */
export function listSources() {
  return Object.entries(CONFIDENCE_SCORES).map(([source, score]) => ({
    source,
    score,
    publishable: score >= MINIMUM_CONFIDENCE,
  }));
}
