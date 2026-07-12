#!/usr/bin/env node
/**
 * logger.js — Logger Estruturado (Seguro)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * SEGURANÇA: NUNCA registra em logs:
 *   - GROQ_API_KEY
 *   - SERPER_API_KEY
 *   - RAPIDAPI_KEY
 *   - AMAZON_AFFILIATE_TAG (valor real)
 *
 * Apenas registra: "Affiliate OK ✓", "Groq OK ✓" sem expor valores.
 *
 * Cada execução produz: logs/YYYY-MM-DD/YYYYMMDD-HHMMSS-UUID8.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const AGENT_DIR   = path.resolve(__dirname, '..');
const LOGS_DIR    = path.join(AGENT_DIR, 'logs');

fs.mkdirSync(LOGS_DIR, { recursive: true });

// ── Padrões de secrets (nunca logar o valor) ───────────────────────────────
const SECRET_PATTERNS = [
  /(GROQ_API_KEY|SERPER_API_KEY|RAPIDAPI_KEY|AMAZON_AFFILIATE_TAG)[=:]\s*['"]?\S+['"]?/gi,
  /(gsk_|sk-)[a-zA-Z0-9]{20,}/g,       // chaves Groq/OpenAI
  /['"](?:x-rapidapi-key|authorization)['"]:\s*['"][^'"]+['"]/gi,
];

function maskSecrets(text) {
  if (!text || typeof text !== 'string') return text;
  let masked = text;
  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      const key = match.split(/[=:]/)[0]?.trim() || 'secret';
      return `${key}=***`;
    });
  }
  return masked;
}

/**
 * Cria um logger para uma execução específica.
 */
export function createExecutionLogger(meta = {}) {
  const startTime = Date.now();
  const runId     = meta.executionId || `${new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')}`;
  const entries   = [];

  const logDir = path.join(LOGS_DIR, runId.slice(0, 10));
  fs.mkdirSync(logDir, { recursive: true });

  function addEntry(level, message, data = {}) {
    // Segurança: mascarar secrets no log
    const safeData = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string' && SECRET_PATTERNS.some(p => p.test(val))) {
        safeData[key] = '***';
      } else {
        safeData[key] = val;
      }
    }

    const entry = {
      ts:      new Date().toISOString(),
      level,
      run:     runId,
      pilar:   meta.pilar || '?',
      trigger: meta.trigger || 'unknown',
      message: maskSecrets(message),
      ...safeData,
      elapsed: Date.now() - startTime,
    };
    entries.push(entry);

    // stdout com segurança
    const prefix = level === 'ERROR' ? '🔴' : level === 'WARN' ? '⚠️' : level === 'PASS' ? '✅' : level === 'FAIL' ? '❌' : level === 'STEP' ? '  ▶' : '   ';
    const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`[${ts}] ${prefix} ${maskSecrets(message)}${safeData.asin ? ` [${safeData.asin}]` : ''}`);
  }

  return {
    info:    (msg, d) => addEntry('INFO', msg, d),
    warn:    (msg, d) => addEntry('WARN', msg, d),
    error:   (msg, d) => addEntry('ERROR', msg, d),
    pass:    (msg, d) => addEntry('PASS', msg, d),
    fail:    (msg, d) => addEntry('FAIL', msg, d),
    step:    (msg, d) => addEntry('STEP', msg, d),

    /** Salva o log completo em disco */
    flush(result) {
      const filename = `${runId}.json`;
      const filepath = path.join(logDir, filename);

      const logFile = {
        meta: {
          runId,
          startTime: new Date(startTime).toISOString(),
          endTime:   new Date().toISOString(),
          duration:  Date.now() - startTime,
          pilar:     meta.pilar,
          trigger:   meta.trigger,
          executionId: meta.executionId,
        },
        // Segurança: não expor secrets no sumário
        result: {
          status: result?.status || 'unknown',
          produto: result?.produto || null,
          error: result?.error ? maskSecrets(result.error) : null,
          errors: result?.errors ? result.errors.map(e => maskSecrets(e)) : null,
        },
        entries,
      };

      try {
        fs.writeFileSync(filepath, JSON.stringify(logFile, null, 2));
      } catch (_) {}

      return filepath;
    },

    getEntries: () => entries,
    getRunId:   () => runId,
  };
}

/**
 * Lê o último log de execução.
 */
export function getLatestLog() {
  try {
    if (!fs.existsSync(LOGS_DIR)) return null;
    const dates = fs.readdirSync(LOGS_DIR).sort().reverse();
    for (const dateDir of dates) {
      const dirPath = path.join(LOGS_DIR, dateDir);
      if (!fs.statSync(dirPath).isDirectory()) continue;
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort().reverse();
      if (files.length) {
        return JSON.parse(fs.readFileSync(path.join(dirPath, files[0]), 'utf8'));
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Retorna resumo dos últimos N logs.
 */
export function getRecentLogs(n = 10) {
  const logs = [];
  try {
    if (!fs.existsSync(LOGS_DIR)) return logs;
    const dates = fs.readdirSync(LOGS_DIR).sort().reverse();
    for (const dateDir of dates) {
      const dirPath = path.join(LOGS_DIR, dateDir);
      if (!fs.statSync(dirPath).isDirectory()) continue;
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort().reverse();
      for (const file of files) {
        if (logs.length >= n) return logs;
        try {
          logs.push(JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8')));
        } catch (_) {}
      }
    }
  } catch (_) {}
  return logs;
}
