#!/usr/bin/env node
/**
 * metrics.js — Observabilidade e Métricas
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Coleta métricas por execução:
 *   - tempo por etapa (ms)
 *   - fonte utilizada (puppeteer, http, serper, ml, catalog)
 *   - número de retries por serviço
 *   - motivo da falha
 *   - score de confiança
 *   - taxa de sucesso (diária, semanal)
 *
 * Armazena em: agent/metrics/
 * Formato: JSON array de execuções
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const METRICS_DIR = path.resolve(__dirname, '..', 'metrics');
fs.mkdirSync(METRICS_DIR, { recursive: true });

const METRICS_FILE = path.join(METRICS_DIR, 'metrics.json');

/**
 * Cria um coletor de métricas para uma execução.
 */
export function createMetricsCollector(executionId, pillar) {
  const stages = [];
  const startTime = Date.now();

  return {
    /** Registra o início de uma etapa */
    startStage: (name) => {
      stages.push({ name, startedAt: Date.now(), endedAt: null, duration: null, success: null, error: null });
      return stages.length - 1; // index
    },

    /** Finaliza uma etapa com sucesso */
    endStage: (index, data = {}) => {
      if (stages[index]) {
        stages[index].endedAt = Date.now();
        stages[index].duration = stages[index].endedAt - stages[index].startedAt;
        stages[index].success = true;
        Object.assign(stages[index], data);
      }
    },

    /** Finaliza uma etapa com falha */
    failStage: (index, error, data = {}) => {
      if (stages[index]) {
        stages[index].endedAt = Date.now();
        stages[index].duration = stages[index].endedAt - stages[index].startedAt;
        stages[index].success = false;
        stages[index].error = error;
        Object.assign(stages[index], data);
      }
    },

    /** Gera o relatório de métricas */
    generateReport: (result = {}) => {
      const totalTime = Date.now() - startTime;
      const successCount = stages.filter(s => s.success === true).length;
      const failCount = stages.filter(s => s.success === false).length;

      return {
        executionId,
        pillar,
        startedAt: new Date(startTime).toISOString(),
        totalTime,
        stages,
        summary: {
          total: stages.length,
          passed: successCount,
          failed: failCount,
          successRate: stages.length > 0 ? Math.round((successCount / stages.length) * 100) : 100,
        },
        result,
      };
    },

    /** Salva o relatório no arquivo de métricas */
    saveReport: (report) => {
      try {
        let metrics = [];
        if (fs.existsSync(METRICS_FILE)) {
          metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
        }
        metrics.push({
          ...report,
          savedAt: new Date().toISOString(),
        });
        // Mantém apenas últimos 1000 registros
        if (metrics.length > 1000) metrics = metrics.slice(-1000);
        fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
      } catch (_) {}
    },

    getStages: () => stages,
    getTotalTime: () => Date.now() - startTime,
  };
}

/**
 * Calcula taxa de sucesso das últimas execuções.
 */
export function getSuccessRate(days = 7) {
  try {
    if (!fs.existsSync(METRICS_FILE)) return { rate: 0, total: 0, passed: 0 };

    const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = metrics.filter(m => new Date(m.startedAt).getTime() > cutoff);

    if (recent.length === 0) return { rate: 0, total: 0, passed: 0 };

    const passed = recent.filter(m => m.result?.status === 'success').length;
    return {
      rate: Math.round((passed / recent.length) * 100),
      total: recent.length,
      passed,
      failed: recent.length - passed,
    };
  } catch {
    return { rate: 0, total: 0, passed: 0 };
  }
}

/**
 * Retorna as últimas N execuções para análise.
 */
export function getRecentExecutions(n = 20) {
  try {
    if (!fs.existsSync(METRICS_FILE)) return [];
    const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    return metrics.slice(-n).reverse();
  } catch {
    return [];
  }
}
