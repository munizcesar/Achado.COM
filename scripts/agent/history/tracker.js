/**
 * tracker.js — Histórico Inteligente com Multi-Key Dedup
 * AchadoCerto.VIP — Agente Autônomo
 *
 * O histórico impede repetição por:
 *   - ASIN (código do produto)
 *   - Slug (URL amigável do post)
 *   - URL (link de afiliado completo)
 *   - Hash do título (similaridade textual)
 *
 * Cada entrada registra a fonte do dado para auditoria.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const HISTORY_DIR = path.resolve(__dirname, '..');
const HISTORY_FILE = path.join(HISTORY_DIR, 'history.json');

// ── Utilitários ─────────────────────────────────────────────────────────────

function titleHash(title) {
  if (!title) return '';
  const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 12);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60);
}

// ── API do Histórico ────────────────────────────────────────────────────────

const RECENT_DAYS = 7; // Mesmo valor do HISTORY_DAYS em agent.js

/**
 * Carrega o histórico completo.
 */
export function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (_) {}
  return [];
}

/**
 * Salva o histórico (mantém últimos 500 registros).
 */
export function saveHistory(history) {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  const trimmed = history.slice(-500);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

/**
 * Registra um post no histórico com múltiplas chaves de dedup.
 *
 * @param {object} entry
 * @param {string} entry.asin
 * @param {string} entry.title
 * @param {string} entry.url
 * @param {string} entry.slug
 * @param {string} entry.category
 * @param {string} entry.source - 'trending' | 'catalog' | 'fallback'
 * @param {number} entry.guardWarnings
 * @param {object} [entry.meta] - metadados extras
 */
export function recordPost(entry, history) {
  const h = history || loadHistory();

  h.push({
    asin:         entry.asin,
    title:        entry.title,
    name:         entry.title,          // compat com Content Guard
    url:          entry.url,
    slug:         entry.slug || slugify(entry.title || ''),
    titleHash:    titleHash(entry.title),
    category:     entry.category,
    source:       entry.source || 'catalog',
    guardWarnings: entry.guardWarnings || 0,
    trending:     !!entry.trending,
    postedAt:     new Date().toISOString(),
    affiliateTagValid: true,
    ...(entry.meta || {}),
  });

  return saveHistory(h);
}

/**
 * Verifica se um produto já foi postado recentemente.
 * Checa por ASIN, slug, URL e hash do título.
 *
 * @param {object} params
 * @param {string} params.asin
 * @param {string} params.title
 * @param {string} params.url
 * @param {number} [params.days] - janela em dias (default: RECENT_DAYS)
 * @returns {{ duplicate: boolean, reason: string|null, existing: object|null }}
 */
export function checkDuplicate({ asin, title, url }, days = RECENT_DAYS) {
  const history   = loadHistory();
  const cutoff    = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent    = history.filter(h => new Date(h.postedAt).getTime() > cutoff);
  const slug      = slugify(title || '');

  // 1. Checa por ASIN
  if (asin) {
    const hit = recent.find(h => h.asin === asin);
    if (hit) {
      return { duplicate: true, reason: `ASIN ${asin} já postado em ${hit.postedAt.slice(0, 10)}`, existing: hit };
    }
  }

  // 2. Checa por slug
  if (slug) {
    const hit = recent.find(h => h.slug === slug);
    if (hit) {
      return { duplicate: true, reason: `Slug "${slug}" já usado em ${hit.postedAt.slice(0, 10)}`, existing: hit };
    }
  }

  // 3. Checa por URL
  if (url) {
    const cleanUrl = url.split('?')[0]; // compara sem query params
    const hit = recent.find(h => (h.url || '').split('?')[0] === cleanUrl);
    if (hit) {
      return { duplicate: true, reason: `URL já publicada em ${hit.postedAt.slice(0, 10)}`, existing: hit };
    }
  }

  // 4. Checa por hash do título (similaridade textual)
  if (title) {
    const hash = titleHash(title);
    const hits = recent.filter(h => h.titleHash === hash && h.titleHash);
    if (hits.length > 0) {
      return { duplicate: true, reason: `Título similar a "${hits[0].title?.slice(0, 40)}" (hash duplicado)`, existing: hits[0] };
    }
  }

  return { duplicate: false, reason: null, existing: null };
}

/**
 * Retorna os posts de um pilar nos últimos N dias.
 */
export function getRecentByPillar(pillar, days = RECENT_DAYS) {
  const history = loadHistory();
  const cutoff  = Date.now() - days * 24 * 60 * 60 * 1000;
  return history.filter(h =>
    h.category === pillar &&
    new Date(h.postedAt).getTime() > cutoff
  );
}

/**
 * Resumo do histórico para --status.
 */
export function getHistorySummary() {
  const history = loadHistory();
  const last20  = history.slice(-20).reverse();

  const lines = [`📋 Histórico: ${history.length} posts registrados`];
  last20.forEach(h => {
    const cat = (h.category || '?').padEnd(8);
    const w = h.guardWarnings > 0 ? ` ⚠️${h.guardWarnings}` : '';
    const tr = h.trending ? ' 📈' : '';
    const src = h.source === 'trending' ? '📈' : h.source === 'fallback' ? '🆘' : '📦';
    lines.push(`  ${h.postedAt?.slice(0, 10) || '?'}  ${src} [${cat}]${w}${tr}  ${h.name || h.title || h.asin}`);
  });

  return lines;
}
