#!/usr/bin/env node
/**
 * audit-report.js — Relatório JSON de Auditoria
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Gera um arquivo audit-report.json contendo TODAS as validações,
 * scores, snapshots e motivos de bloqueio para rastreabilidade.
 *
 * Snapshots salvos:
 *   ✓ Título do produto usado na geração
 *   ✓ URL da imagem
 *   ✓ Link de afiliado
 *   ✓ Categoria/Pilar
 *   ✓ ASIN
 *   ✓ Hash do produto
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const ROOT        = path.resolve(__dirname, '..', '..', '..');
const REPORTS_DIR = path.join(ROOT, 'data', 'audit-reports');

/**
 * Garante que o diretório de relatórios existe.
 */
function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Gera o relatório de auditoria em JSON.
 *
 * @param {object} context - Contexto da execução
 * @param {string} context.executionId - ID da execução
 * @param {string} context.timestamp - Timestamp ISO
 * @param {object} context.product - Dados do produto (snapshot)
 * @param {string} context.pillar - Pilar/Categoria
 * @param {string} context.trigger - Trigger da execução
 *
 * @param {object} results - Resultados das validações
 * @param {object} [results.productValidation] - validateProduct()
 * @param {object} [results.catSafety] - validateCategorySafety()
 * @param {object} [results.hallucinationCheck] - analyzeHallucinations()
 * @param {object} [results.coherenceResult] - analyzeSemanticCoherence()
 * @param {object} [results.seoResult] - runSeoGates()
 * @param {object} [results.editorialResult] - runEditorialGates()
 * @param {object} [results.auditResult] - runFinalAudit()
 * @param {object} [results.ctaCheck] - validateAllCtas()
 * @param {object} [results.imgValidation] - validateImages()
 * @param {object} [results.finalScore] - calculateFinalScore()
 * @param {object} [results.productHash] - validateProductHash()
 * @param {object} [results.crossValidation] - validação cruzada
 *
 * @returns {string} Caminho do arquivo gerado
 */
export function generateAuditReport(context, results) {
  ensureReportsDir();

  const report = {
    meta: {
      executionId: context.executionId,
      timestamp: context.timestamp || new Date().toISOString(),
      trigger: context.trigger || 'unknown',
      pillar: context.pillar || 'unknown',
      dryRun: context.dryRun || false,
      duration_ms: context.durationMs || null,
    },

    snapshot: {
      product: {
        asin: context.product?.asin || null,
        name: context.product?.name || context.product?.productName || context.product?.title || null,
        brand: context.product?.brand || null,
        category: context.product?.category || context.pillar || null,
        affiliateUrl: context.affiliateUrl || null,
        imageUrl: context.product?.imageUrl || null,
      },
      generated: {
        slug: context.slug || null,
        mdPath: context.mdPath || null,
        imgPath: context.imgPath || null,
        productHash: results.productHash?.currentHash || null,
      },
    },

    validations: {
      product: results.productValidation ? {
        passed: results.productValidation.pass,
        score: results.productValidation.score,
        errors: results.productValidation.errors,
        checks: results.productValidation.checks?.map(c => ({ name: c.name, pass: c.pass, detail: c.detail })),
      } : null,

      category_safety: results.catSafety ? {
        passed: results.catSafety.pass,
        error: results.catSafety.error,
      } : null,

      confidence: results.confCheck ? {
        passed: results.confCheck.pass,
        score: results.confCheck.score,
        minimum: results.confCheck.minimum,
      } : null,

      product_hash: results.productHash ? {
        passed: results.productHash.valid,
        currentHash: results.productHash.currentHash,
        expectedHash: results.productHash.expectedHash,
        error: results.productHash.error,
      } : null,

      cross_validation: results.crossValidation ? {
        passed: results.crossValidation.pass,
        errors: results.crossValidation.errors,
      } : null,

      hallucination: results.hallucinationCheck ? {
        passed: results.hallucinationCheck.passed,
        violations: results.hallucinationCheck.violations?.map(v => ({
          text: v.text?.slice(0, 80),
          risk: v.risk,
          reason: v.reason,
        })),
        totalViolations: results.hallucinationCheck.violations?.length,
      } : null,

      semantic_coherence: results.coherenceResult ? {
        passed: results.coherenceResult.passed,
        score: results.coherenceResult.score,
        checks: results.coherenceResult.checks?.map(c => ({ name: c.name, pass: c.pass, detail: c.detail })),
        otherProducts: results.coherenceResult.otherProducts,
      } : null,

      seo: results.seoResult ? {
        passed: results.seoResult.pass,
        errors: results.seoResult.errors,
        warnings: results.seoResult.warnings,
      } : null,

      editorial: results.editorialResult ? {
        passed: results.editorialResult.passed,
        score: results.editorialResult.editorialScore?.score,
        maxScore: results.editorialResult.editorialScore?.maxScore,
      } : null,

      quality_gates: results.qualityGates ? {
        passed: results.qualityGates.pass,
        errors: results.qualityGates.errors,
      } : null,

      audit: results.auditResult ? {
        passed: results.auditResult.passed,
        score: results.auditResult.score,
        checks: results.auditResult.checks?.map(c => ({ name: c.name, pass: c.pass, detail: c.detail })),
      } : null,

      cta: results.ctaCheck ? {
        passed: results.ctaCheck.pass,
        errors: results.ctaCheck.errors,
        totalCtas: results.ctaCheck.ctas?.length,
        allSameAsin: results.ctaCheck.allSameAsin,
      } : null,

      image: results.imgValidation ? {
        passed: results.imgValidation.passed,
        score: results.imgValidation.score,
        errors: results.imgValidation.errors,
        checks: results.imgValidation.checks?.map(c => ({ name: c.name, pass: c.pass })),
      } : null,

      final_score: results.finalScore ? {
        passed: results.finalScore.passed,
        score: results.finalScore.score,
        threshold: results.finalScore.threshold,
        dimensions: results.finalScore.dimensions,
      } : null,
    },

    decision: {
      passed: Object.values(results).filter(r => r && typeof r.passed === 'boolean' || typeof r.pass === 'boolean').length > 0,
      summary: null, // Preenchido abaixo
    },
  };

  // Determina se passou globalmente
  const allChecks = [
    results.productValidation?.pass,
    results.catSafety?.pass,
    results.productHash?.valid,
    results.crossValidation?.pass,
    results.hallucinationCheck?.passed,
    results.coherenceResult?.passed,
    results.seoResult?.pass,
    results.editorialResult?.passed,
    results.qualityGates?.pass,
    results.auditResult?.passed,
    results.ctaCheck?.pass,
    results.imgValidation?.passed,
    results.finalScore?.passed,
  ].filter(b => b !== undefined && b !== null);

  report.decision.passed = allChecks.every(b => b === true);
  report.decision.totalChecks = allChecks.length;
  report.decision.passedChecks = allChecks.filter(b => b).length;

  // Salva arquivo
  const filename = `audit-${context.executionId || 'unknown'}.json`;
  const filePath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');

  return filePath;
}

/**
 * Lista relatórios de auditoria recentes.
 */
export function listRecentReports(limit = 10) {
  ensureReportsDir();
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.startsWith('audit-') && f.endsWith('.json'))
      .map(f => {
        const fp = path.join(REPORTS_DIR, f);
        return { file: f, path: fp, mtime: fs.statSync(fp).mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);
    return files;
  } catch {
    return [];
  }
}

/**
 * Carrega um relatório de auditoria.
 */
export function loadAuditReport(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {}
  return null;
}
