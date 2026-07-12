#!/usr/bin/env node
/**
 * retry.js — Retry Inteligente com Exponential Backoff
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Cada serviço tem sua própria estratégia de retry:
 *   Amazon:  5s → 15s → 45s → 90s (4 tentativas)
 *   Groq:    3s → 10s → 30s       (3 tentativas)
 *   Serper:  3s → 10s → 30s       (3 tentativas)
 *   Rede:    2s → 5s → 15s        (3 tentativas)
 *
 * Uso:
 *   const result = await withRetry('amazon', () => fetchPuppeteer(asin));
 *   if (result.success) { ... }
 */

/**
 * Estratégias de retry por serviço.
 * Cada estratégia define os intervalos em ms entre tentativas.
 */
const STRATEGIES = {
  amazon:   { intervals: [5000, 15000, 45000, 90000], label: 'Amazon' },
  groq:     { intervals: [3000, 10000, 30000],        label: 'Groq' },
  serper:   { intervals: [3000, 10000, 30000],        label: 'Serper' },
  network:  { intervals: [2000, 5000, 15000],         label: 'Rede' },
  generic:  { intervals: [3000, 10000, 30000],        label: 'Genérico' },
};

/**
 * Executa uma função com retry inteligente.
 *
 * @param {string} service - Nome do serviço ('amazon', 'groq', 'serper', 'network', 'generic')
 * @param {Function} fn - Função assíncrona a ser executada
 * @param {object} [options]
 * @param {boolean} [options.retryOnNull] - Se true, retry também quando retorna null (não só throw)
 * @returns {Promise<{ success: boolean, data: any, error: string|null, attempts: number, totalTime: number }>}
 */
export async function withRetry(service, fn, options = {}) {
  const strategy = STRATEGIES[service] || STRATEGIES.generic;
  const intervals = strategy.intervals;
  const startTime = Date.now();
  let lastError = null;

  for (let attempt = 1; attempt <= intervals.length + 1; attempt++) {
    try {
      const result = await fn();

      // Se retornou null e devemos retentar
      if (result === null && options.retryOnNull && attempt <= intervals.length) {
        lastError = new Error('Retornou null');
        const wait = intervals[attempt - 1];
        console.log(`   ⏳ ${strategy.label}: tentativa ${attempt} retornou null — aguardando ${wait}ms...`);
        await sleep(wait);
        continue;
      }

      return {
        success: true,
        data: result,
        error: null,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    } catch (err) {
      lastError = err;

      if (attempt <= intervals.length) {
        const wait = intervals[attempt - 1];
        console.log(`   ⏳ ${strategy.label}: tentativa ${attempt}/${intervals.length + 1} falhou — "${err.message.slice(0, 80)}" — aguardando ${wait}ms...`);
        await sleep(wait);
      } else {
        console.log(`   ❌ ${strategy.label}: todas as ${intervals.length + 1} tentativas esgotadas`);
      }
    }
  }

  return {
    success: false,
    data: null,
    error: lastError?.message || 'Todas as tentativas esgotadas',
    attempts: intervals.length + 1,
    totalTime: Date.now() - startTime,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Estratégia de retry para Amazon (puppeteer + HTTP).
 * Tenta Puppeteer com retry, depois HTTP com retry.
 */
export async function withAmazonRetry(puppeteerFn, httpFn) {
  // Tenta Puppeteer (com retry)
  const puppeteerResult = await withRetry('amazon', puppeteerFn, { retryOnNull: true });

  if (puppeteerResult.success) {
    return { ...puppeteerResult, source: 'puppeteer', confidence: 95 };
  }

  // Fallback: HTTP chain (com retry)
  console.log('   🔄 Fallback para HTTP chain...');
  const httpResult = await withRetry('amazon', httpFn, { retryOnNull: true });

  if (httpResult.success) {
    return { ...httpResult, source: 'amazon-http', confidence: 80 };
  }

  return {
    success: false,
    data: null,
    error: 'Amazon: Puppeteer + HTTP esgotados',
    attempts: puppeteerResult.attempts + httpResult.attempts,
    totalTime: puppeteerResult.totalTime + httpResult.totalTime,
    source: 'none',
    confidence: 0,
  };
}
