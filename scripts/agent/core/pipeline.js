/**
 * pipeline.js — Pipeline de Publicação (Stage-based)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Módulo de orquestração para execução do pipeline de publicação.
 * Cada etapa retorna { status: 'SUCCESS' | 'FAIL', data: {}, error: string }
 *
 * NOTA: O agent.js já implementa o pipeline inline.
 * Este módulo fornece os helpers e tipos para as etapas,
 * podendo ser usado como referência para testes e refatoração futura.
 *
 * Etapas do pipeline:
 *   1. SELECT_PRODUCT       → pickFromPool()
 *   2. VALIDATE_HISTORY     → checkDuplicate()
 *   3. VALIDATE_AFFILIATE   → validateAffiliateConfig() + validateFinalAffiliateUrl()
 *   4. CONTENT_GUARD        → runContentGuard()
 *   5. GENERATE_FILES       → novo-post.js (execSync, sem git)
 *   6. VERIFY_ARTIFACTS     → verifyPublication()
 *   7. RECORD_HISTORY       → recordPost()
 *
 * Regras:
 *   - Git add/commit/push é EXCLUSIVO do Workflow
 *   - Link de afiliado sem tag= CANCELA a publicação
 *   - "Produto Amazon B08XXXXX" nunca é publicado
 *   - Cada etapa retorna SUCCESS ou FAIL — nunca continua após FAIL
 */

/**
 * Cria o contexto inicial do pipeline.
 */
export function createPipelineContext({ pillar, slotIndex, trigger, tag }) {
  return {
    pillar,
    slotIndex,
    trigger: trigger || 'schedule',
    tag,
    startedAt: Date.now(),
    stages: [],
    errors: [],
    warnings: [],
  };
}

/**
 * Registra o resultado de uma etapa no contexto.
 */
export function recordStage(context, stageName, status, detail = '') {
  context.stages.push({
    stage: stageName,
    status,
    detail,
    elapsed: Date.now() - context.startedAt,
    ts: new Date().toISOString(),
  });
}

/**
 * Verifica se o pipeline deve continuar.
 */
export function shouldContinue(context) {
  const lastStage = context.stages[context.stages.length - 1];
  return !lastStage || lastStage.status === 'SUCCESS';
}

/**
 * Retorna resumo do pipeline.
 */
export function getPipelineSummary(context) {
  const passed = context.stages.filter(s => s.status === 'SUCCESS').length;
  const failed = context.stages.filter(s => s.status === 'FAIL').length;
  const total  = context.stages.length;
  const duration = Math.round((Date.now() - context.startedAt) / 1000);

  return {
    total,
    passed,
    failed,
    duration,
    success: failed === 0,
    lastStage: context.stages[context.stages.length - 1],
  };
}
