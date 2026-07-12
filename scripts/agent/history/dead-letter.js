#!/usr/bin/env node
/**
 * dead-letter.js — Dead Letter Queue (DLQ)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Publicações que falharam definitivamente (ex: after max retries, qualidade rejeitada)
 * ficam registradas para reprocessamento manual ou automático posterior.
 *
 * Cada entrada contém motivo da falha, estágio onde falhou e dados do produto.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const DLQ_FILE    = path.join(__dirname, 'dead-letter-queue.json');

/**
 * Adiciona uma publicação falha à DLQ.
 *
 * @param {object} entry
 * @param {string} entry.asin
 * @param {string} entry.productName
 * @param {string} entry.pillar
 * @param {string} entry.stage - Estágio onde falhou (ex: 'QUALITY_APPROVED', 'FETCH_DATA')
 * @param {string} entry.error - Motivo da falha
 * @param {object} [entry.meta] - Metadados extras
 */
export function addToDeadLetter(entry) {
  let dlq = [];

  try {
    if (fs.existsSync(DLQ_FILE)) {
      dlq = JSON.parse(fs.readFileSync(DLQ_FILE, 'utf8'));
    }
  } catch (_) {}

  dlq.push({
    asin:         entry.asin,
    productName:  entry.productName,
    pillar:       entry.pillar,
    stage:        entry.stage,
    error:        entry.error,
    meta:         entry.meta || {},
    failedAt:     new Date().toISOString(),
    retryCount:   0,
    status:       'pending', // pending | reprocessado | descartado
  });

  // Mantém últimos 200
  if (dlq.length > 200) dlq = dlq.slice(-200);

  try {
    fs.mkdirSync(path.dirname(DLQ_FILE), { recursive: true });
    fs.writeFileSync(DLQ_FILE, JSON.stringify(dlq, null, 2));
  } catch (_) {}
}

/**
 * Lista itens na DLQ, opcionalmente filtrados por status.
 */
export function listDeadLetter(status = null) {
  try {
    if (!fs.existsSync(DLQ_FILE)) return [];
    const dlq = JSON.parse(fs.readFileSync(DLQ_FILE, 'utf8'));
    if (status) return dlq.filter(e => e.status === status);
    return dlq;
  } catch {
    return [];
  }
}

/**
 * Marca um item como reprocessado.
 */
export function markAsReprocessed(asin) {
  try {
    if (!fs.existsSync(DLQ_FILE)) return false;
    const dlq = JSON.parse(fs.readFileSync(DLQ_FILE, 'utf8'));
    let found = false;
    for (const entry of dlq) {
      if (entry.asin === asin && entry.status === 'pending') {
        entry.status = 'reprocessado';
        entry.retryCount++;
        entry.reprocessedAt = new Date().toISOString();
        found = true;
        break;
      }
    }
    if (found) fs.writeFileSync(DLQ_FILE, JSON.stringify(dlq, null, 2));
    return found;
  } catch {
    return false;
  }
}

/**
 * Remove itens antigos (>30 dias).
 */
export function cleanDeadLetter() {
  try {
    if (!fs.existsSync(DLQ_FILE)) return 0;
    const dlq = JSON.parse(fs.readFileSync(DLQ_FILE, 'utf8'));
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = dlq.filter(e => new Date(e.failedAt).getTime() > cutoff);
    fs.writeFileSync(DLQ_FILE, JSON.stringify(filtered, null, 2));
    return dlq.length - filtered.length;
  } catch {
    return 0;
  }
}

/**
 * Resumo da DLQ para --status e dashboard.
 */
export function getDeadLetterSummary() {
  const dlq = listDeadLetter();
  const pending = dlq.filter(e => e.status === 'pending').length;
  const reprocessed = dlq.filter(e => e.status === 'reprocessado').length;
  const discarded = dlq.filter(e => e.status === 'descartado').length;

  // Falhas por estágio
  const byStage = {};
  for (const entry of dlq) {
    byStage[entry.stage] = (byStage[entry.stage] || 0) + 1;
  }

  return {
    total: dlq.length,
    pending,
    reprocessed,
    discarded,
    byStage,
  };
}
