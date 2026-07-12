#!/usr/bin/env node
/**
 * execution.js — Execution ID + Lock + Idempotência
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Gera ExecutionID único: YYYYMMDD-HHMMSS-UUID8
 * Garante que execuções concorrentes não interfiram via lock file.
 *
 * Uso:
 *   const exec = createExecution({ pilar: 'beleza', trigger: 'schedule' });
 *   if (!exec.lock.acquired) { console.log('Já existe execução rodando'); process.exit(0); }
 *   // ... pipeline ...
 *   exec.lock.release();
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const AGENT_DIR   = path.resolve(__dirname, '..');
const LOCK_FILE   = path.join(AGENT_DIR, 'agent.lock');

/**
 * Gera um ExecutionID único.
 * Formato: YYYYMMDD-HHMMSS-XXXXXXXX (ex: 20260711-080000-a1b2c3d4)
 */
export function generateExecutionId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const uid  = crypto.randomBytes(4).toString('hex');
  return `${date}-${time}-${uid}`;
}

/**
 * Tenta adquirir o lock de execução.
 * Se outro processo já tiver o lock há menos de 30min, retorna false.
 * Se o lock estiver expirado (>30min), assume que o processo morreu e libera.
 *
 * @returns {{ acquired: boolean, reason: string }}
 */
export function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      const age = Date.now() - new Date(lock.acquiredAt).getTime();

      if (age < 30 * 60 * 1000) {
        // Lock recente — outro processo está rodando
        return {
          acquired: false,
          reason: `Lock ocupado por ${lock.executionId} desde ${lock.acquiredAt} (${Math.round(age / 1000)}s atrás)`,
        };
      }

      // Lock expirado — processo anterior morreu
      console.log(`   ⚠️  Lock expirado (${Math.round(age / 1000)}s) — removendo lock órfão de ${lock.executionId}`);
    }
  } catch (_) {}

  // Adquire lock
  const executionId = generateExecutionId();
  try {
    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
    fs.writeFileSync(LOCK_FILE, JSON.stringify({
      executionId,
      acquiredAt: new Date().toISOString(),
      pid: process.pid,
      host: process.env.HOSTNAME || 'local',
    }, null, 2));
    return { acquired: true, reason: 'ok', executionId };
  } catch (err) {
    return { acquired: false, reason: `Erro ao criar lock: ${err.message}` };
  }
}

/**
 * Libera o lock de execução.
 */
export function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Cria um contexto de execução completo com ID + lock.
 *
 * @param {object} options
 * @param {string} options.pilar
 * @param {string} options.trigger - 'schedule' | 'manual' | 'workflow_dispatch'
 * @returns {object} { executionId, lock, meta }
 */
export function createExecution({ pilar, trigger } = {}) {
  const lock = acquireLock();

  if (!lock.acquired) {
    return {
      executionId: null,
      lock: { acquired: false, reason: lock.reason },
      meta: null,
    };
  }

  const executionId = lock.executionId;

  const meta = {
    executionId,
    pilar: pilar || 'auto',
    trigger: trigger || 'unknown',
    startedAt: new Date().toISOString(),
    tag: 'afiliado-ok',
  };

  return { executionId, lock, meta };
}
