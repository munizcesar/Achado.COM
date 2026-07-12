#!/usr/bin/env node
/**
 * config.js — Carregador de Configuração Centralizada
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Lê parâmetros de scripts/agent/config.json.
 * Fornece valores com fallback para defaults embutidos.
 *
 * Uso:
 *   const cfg = loadConfig();
 *   cfg.retry.amazon.intervals_ms  // [5000, 15000, 45000, 90000]
 *   cfg.confidence.minimum_to_publish  // 70
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

// ── Defaults (usados se config.json não existir ou campo faltar) ────────────

const DEFAULTS = {
  agent: {
    pillars: ['beleza', 'saude', 'casa'],
    history_days: 7,
    max_guard_retries: 3,
    max_history_size: 500,
    default_affiliate_tag: 'altivita-20',
  },
  schedule: {
    slots: [
      { hour: 8, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 18, minute: 0 },
    ],
    interval_ms: 30000,
    timezone: 'America/Sao_Paulo',
  },
  retry: {
    amazon:  { intervals_ms: [5000, 15000, 45000, 90000], max_attempts: 4 },
    groq:    { intervals_ms: [3000, 10000, 30000], max_attempts: 3 },
    serper:  { intervals_ms: [3000, 10000, 30000], max_attempts: 3 },
    network: { intervals_ms: [2000, 5000, 15000], max_attempts: 3 },
  },
  confidence: {
    scores: {
      'pa-api': 100, 'amazon-html': 98, 'puppeteer': 95,
      'serper': 80, 'rapidapi-ml': 70, 'catalog': 60, 'proxy': 55, 'asin-fallback': 0,
    },
    minimum_to_publish: 70,
  },
  lock: { ttl_ms: 1800000, file: 'agent.lock' },
  seo: {
    title_min_chars: 25, title_ideal_min: 45, title_ideal_max: 65,
    title_max_chars: 120, meta_min_chars: 80, meta_ideal_min: 140,
    meta_ideal_max: 160, meta_max_chars: 200, min_h2_count: 2,
    require_internal_links: true, slug_min_chars: 5, slug_max_chars: 80,
  },
  quality: {
    title_min_length: 10, image_min_bytes: 1024, image_max_bytes: 10485760,
    content_min_chars: 200, validation_pass_percent: 60,
  },
  circuit_breaker: {
    failure_threshold: 5, reset_timeout_ms: 300000, half_open_max_requests: 1,
  },
  pipeline: {
    stages: ['PENDING','PRODUCT_SELECTED','PRODUCT_VALIDATED','CONTENT_GENERATED',
             'QUALITY_APPROVED','FILES_WRITTEN','READY_TO_COMMIT','COMMITTED',
             'DEPLOYED','VERIFIED','AUDIT','DONE'],
  },
  dashboard: { output_file: 'agent-dashboard.html', max_recent_executions: 50 },
};

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Carrega a configuração do arquivo config.json.
 * Faz merge com defaults para garantir que todos os campos existam.
 *
 * @returns {object} Configuração completa
 */
export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(raw);
      return deepMerge(DEFAULTS, config);
    }
  } catch (err) {
    console.error(`   ⚠️  Erro ao carregar config.json: ${err.message} — usando defaults`);
  }
  return { ...DEFAULTS };
}

/**
 * Retorna apenas os slots de horário do scheduler.
 */
export function getSchedule() {
  const cfg = loadConfig();
  return cfg.schedule.slots;
}

/**
 * Retorna a estratégia de retry para um serviço.
 */
export function getRetryStrategy(service) {
  const cfg = loadConfig();
  return cfg.retry[service] || cfg.retry.network;
}

/**
 * Retorna o score de confiança para uma fonte.
 */
export function getConfidenceScore(source) {
  const cfg = loadConfig();
  return cfg.confidence.scores[source] || 0;
}

/**
 * Retorna o score mínimo para publicação.
 */
export function getMinimumConfidence() {
  const cfg = loadConfig();
  return cfg.confidence.minimum_to_publish;
}
