#!/usr/bin/env node
/**
 * circuit-breaker.js — Circuit Breaker Pattern
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Se Amazon, Groq ou Serper falharem repetidamente (threshold = 5),
 * interrompe chamadas temporariamente (reset = 5min).
 *
 * Estados: CLOSED (normal) → OPEN (falhando) → HALF_OPEN (testando) → CLOSED
 *
 * Evita bloqueios e desperdício de recursos em caso de falha sistêmica.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const CB_FILE     = path.join(__dirname, 'circuit-breaker-state.json');

const DEFAULT_CONFIG = {
  failure_threshold: 5,
  reset_timeout_ms: 300000,
  half_open_max_requests: 1,
};

const SERVICES = ['amazon', 'groq', 'serper', 'rapidapi', 'network'];

function loadState() {
  try {
    if (fs.existsSync(CB_FILE)) {
      return JSON.parse(fs.readFileSync(CB_FILE, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function saveState(state) {
  try {
    fs.writeFileSync(CB_FILE, JSON.stringify(state, null, 2));
  } catch (_) {}
}

/**
 * Cria um circuit breaker para um serviço.
 */
export function createCircuitBreaker(serviceName) {
  const config = loadConfig()?.circuit_breaker || DEFAULT_CONFIG;
  const state = loadState();
  const key = `cb_${serviceName}`;

  if (!state[key]) {
    state[key] = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      lastSuccess: null,
      openedAt: null,
    };
    saveState(state);
  }

  const svc = state[key];

  function persist() {
    saveState(state);
  }

  return {
    /** Nome do serviço */
    name: serviceName,

    /** Estado atual: CLOSED | OPEN | HALF_OPEN */
    getState: () => {
      // Se OPEN e já passou reset_timeout, transiciona para HALF_OPEN
      if (svc.state === 'OPEN' && svc.openedAt) {
        const elapsed = Date.now() - svc.openedAt;
        if (elapsed >= config.reset_timeout_ms) {
          svc.state = 'HALF_OPEN';
          persist();
        }
      }
      return svc.state;
    },

    /** Verifica se pode fazer requisição */
    canRequest: () => {
      const currentState = this?.getState?.() || svc.state;
      if (currentState === 'CLOSED') return true;
      if (currentState === 'HALF_OPEN') {
        // No HALF_OPEN, permite apenas 1 requisição para testar
        return svc.failures < config.failure_threshold + config.half_open_max_requests;
      }
      return false;
    },

    /** Registra sucesso — reseta contador */
    recordSuccess: () => {
      svc.state = 'CLOSED';
      svc.failures = 0;
      svc.lastSuccess = Date.now();
      svc.lastFailure = null;
      svc.openedAt = null;
      persist();
    },

    /** Registra falha — pode abrir o circuito */
    recordFailure: (error) => {
      svc.failures++;
      svc.lastFailure = Date.now();

      if (svc.failures >= config.failure_threshold) {
        const wasOpen = svc.state === 'OPEN';
        svc.state = 'OPEN';
        svc.openedAt = Date.now();
        if (!wasOpen) {
          console.log(`   ⚠️  Circuit Breaker ABERTO para "${serviceName}" após ${svc.failures} falhas consecutivas`);
        }
      }
      persist();
    },

    /** Reseta manualmente */
    reset: () => {
      svc.state = 'CLOSED';
      svc.failures = 0;
      svc.lastFailure = null;
      svc.lastSuccess = null;
      svc.openedAt = null;
      persist();
    },

    /** Estatísticas */
    getStats: () => ({
      service: serviceName,
      state: svc.state,
      failures: svc.failures,
      lastFailure: svc.lastFailure ? new Date(svc.lastFailure).toISOString() : null,
      lastSuccess: svc.lastSuccess ? new Date(svc.lastSuccess).toISOString() : null,
      openedAt: svc.openedAt ? new Date(svc.openedAt).toISOString() : null,
      threshold: config.failure_threshold,
      resetTimeout: config.reset_timeout_ms,
    }),
  };
}

/**
 * Factory: cria circuit breakers para todos os serviços.
 */
export function createAllCircuitBreakers() {
  const breakers = {};
  for (const svc of SERVICES) {
    breakers[svc] = createCircuitBreaker(svc);
  }
  return breakers;
}

/**
 * Reseta todos os circuit breakers.
 */
export function resetAllCircuitBreakers() {
  try {
    if (fs.existsSync(CB_FILE)) fs.unlinkSync(CB_FILE);
  } catch (_) {}
}

/**
 * Retorna status de todos os circuit breakers.
 */
export function getAllCircuitBreakerStates() {
  const state = loadState();
  const result = {};
  for (const key of Object.keys(state)) {
    const svcName = key.replace('cb_', '');
    result[svcName] = state[key];
  }
  return result;
}
