#!/usr/bin/env node
/**
 * product-hash.js — Hash de Integridade do Produto
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Gera uma assinatura criptográfica baseada em:
 *   ASIN + título normalizado + marca + categoria
 *
 * TODO o pipeline valida este hash para impedir troca silenciosa
 * de produto entre etapas (catálogo → scraping → IA → publicação).
 *
 * Se o hash mudar entre etapas → PRODUTO TROCADO → ABORTAR.
 */

import crypto from 'crypto';

/**
 * Normaliza texto para hash (consistente e determinístico).
 */
function normalizeForHash(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Gera o hash SHA256 de um produto.
 *
 * @param {object} product - Dados do produto
 * @param {string} product.asin - ASIN Amazon
 * @param {string} product.title - Título do produto
 * @param {string} [product.brand] - Marca
 * @param {string} [product.name] - Nome alternativo
 * @param {string} [product.category] - Categoria/pilar
 * @param {string} [product.pillar] - Pilar alternativo
 * @returns {string} Hash SHA256 em hex
 */
export function generateProductHash(product) {
  if (!product) return '';

  const asin = (product.asin || '').toUpperCase().trim();
  const title = normalizeForHash(product.title || product.name || product.productName || '');
  const brand = normalizeForHash(product.brand || '');
  const category = normalizeForHash(product.category || product.pillar || '');

  // Pega as primeiras 8 palavras do título (suficiente para identificar unicamente)
  const titleWords = title.split(/\s+/).slice(0, 8).join('');

  const canonicalString = `${asin}|${titleWords}|${brand}|${category}`;
  
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Verifica se o hash de um produto corresponde ao hash de referência.
 *
 * @param {object} product - Produto atual
 * @param {string} expectedHash - Hash de referência
 * @returns {{ valid: boolean, currentHash: string, expectedHash: string }}
 */
export function validateProductHash(product, expectedHash) {
  const currentHash = generateProductHash(product);

  // Se não há hash de referência, aceita e registra
  if (!expectedHash) {
    return {
      valid: true,
      currentHash,
      expectedHash: null,
      error: null,
      note: 'Hash de referência não definido — registrando hash atual',
    };
  }

  const valid = currentHash === expectedHash;

  return {
    valid,
    currentHash,
    expectedHash,
    error: valid ? null : `Hash do produto mudou! (${currentHash.slice(0, 12)}... vs ${expectedHash.slice(0, 12)}...) — produto pode ter sido trocado`,
  };
}

/**
 * Gera hash a partir de dados extraídos de scraping (Amazon HTML).
 */
export function generateScrapedProductHash(scrapedData) {
  const asin = scrapedData.asin || '';
  const title = normalizeForHash(scrapedData.title || scrapedData.name || '');
  const brand = normalizeForHash(scrapedData.brand || '');
  const category = normalizeForHash(scrapedData.category || scrapedData.pillar || '');
  const titleWords = title.split(/\s+/).slice(0, 8).join('');

  const canonicalString = `${asin}|${titleWords}|${brand}|${category}`;
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Retorna um resumo legível do hash (primeiros 12 caracteres).
 */
export function hashSummary(hash) {
  if (!hash) return 'sem hash';
  return `${hash.slice(0, 12)}...`;
}
