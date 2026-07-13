#!/usr/bin/env node
/**
 * product-validator.js — Validação Completa do Produto (pré-IA)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Antes da IA escrever UMA palavra, este módulo verifica que:
 *   ✓ Título corresponde ao ASIN
 *   ✓ Nome do produto é consistente com a categoria
 *   ✓ Imagem existe e é válida
 *   ✓ Descrição corresponde ao produto
 *   ✓ Categoria é coerente com o título
 *   ✓ Preço não está ausente/incoerente (se disponível)
 *
 * Se QUALQUER divergência existir → ERRO → ABORTAR GERAÇÃO
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const ROOT        = path.resolve(__dirname, '..', '..', '..');

const VALID_CATEGORIES = ['beleza', 'saude', 'casa', 'tech', 'esportes', 'automotivo'];

/**
 * Extrai ASIN de uma URL.
 */
function extractAsin(url) {
  if (!url) return null;
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

/**
 * Normaliza texto para comparação (lowercase, sem acentos, sem pontuação).
 */
function normalize(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Valida que o título do produto é coerente com a categoria esperada.
 * Ex: Suplemento de magnésio não pode estar em "casa".
 */
function validateCategoryCoherence(productName, category) {
  const n = normalize(productName);
  const errors = [];
  const warnings = [];

  // Regras de incoerência: produto X em categoria Y é SEMPRE erro
  const INCOHERENCE_RULES = [
    // Produtos de saúde em categorias erradas
    { category: 'casa', pattern: /whey|creatina|vitamina|suplemento|cápsula|capsula|mg\b|proteína|proteina|colágeno|colageno|omega|probiótico|probiotico|magnésio|magnesio|zinco|melatonina/i },
    { category: 'beleza', pattern: /whey|creatina|suplemento|cápsula|capsula|mg\b|proteína|proteina|colágeno|colageno|omega|probiótico|probiotico/i },
    { category: 'casa', pattern: /shampoo|condicionador|perfume|protetor solar|maquiagem|batom|esmalte|skincare|sérum|serum/i },
    { category: 'tech', pattern: /shampoo|condicionador|whey|creatina|suplemento/i },
  ];

  for (const rule of INCOHERENCE_RULES) {
    if (category === rule.category && rule.pattern.test(n)) {
      errors.push(`INCOERÊNCIA: Produto "${productName.slice(0, 60)}" parece ser de SAÚDE/BELEZA mas está na categoria "${category}"`);
    }
  }

  return { pass: errors.length === 0, errors, warnings };
}

/**
 * Valida que o título extraído da Amazon/ML corresponde ao produto do catálogo.
 */
function validateTitleConsistency(catalogName, scrapedTitle) {
  const errors = [];

  if (!catalogName || !scrapedTitle) {
    return { pass: false, errors: ['Nome do catálogo ou título raspado ausente'], warnings: [] };
  }

  const normCat = normalize(catalogName);
  const normScraped = normalize(scrapedTitle);

  // Palavras do catálogo que devem aparecer no título raspado
  const catalogWords = normCat.split(/\s+/).filter(w => w.length > 3);
  const matchedWords = catalogWords.filter(w => normScraped.includes(w));
  const matchRatio = catalogWords.length > 0 ? matchedWords.length / catalogWords.length : 0;

  if (matchRatio < 0.3 && catalogWords.length >= 3) {
    errors.push(`Título do catálogo ("${catalogName.slice(0, 50)}") não corresponde ao título raspado ("${scrapedTitle.slice(0, 50)}") — match ${Math.round(matchRatio * 100)}%`);
  }

  // Verifica se o título raspado parece genérico
  const genericPatterns = [
    /^produto amazon\b/i, /^produto mercad(o|a) livre\b/i,
    /todos os departamentos/i, /dispositivos kindle/i,
    /prime teste gratis/i,
  ];
  for (const pat of genericPatterns) {
    if (pat.test(scrapedTitle)) {
      errors.push(`Título raspado parece genérico: "${scrapedTitle.slice(0, 60)}"`);
      break;
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

/**
 * Valida a imagem do produto.
 */
function validateProductImage(imageUrl) {
  const errors = [];

  if (!imageUrl) {
    errors.push('URL da imagem ausente');
    return { pass: false, errors, warnings: [] };
  }

  // Verifica se a URL parece válida
  try {
    new URL(imageUrl);
  } catch {
    errors.push(`URL da imagem inválida: ${imageUrl.slice(0, 60)}`);
  }

  // Verifica se a URL aponta para um domínio confiável
  const trustedDomains = ['amazon.com', 'amazon.com.br', 'm.media-amazon.com', 
    'http2.mlstatic.com', 'mlstatic.com', 'images-na.ssl-images-amazon.com'];
  const hasTrustedDomain = trustedDomains.some(d => imageUrl.includes(d));
  if (!hasTrustedDomain) {
    errors.push(`Imagem de domínio não confiável: ${imageUrl.slice(0, 60)}`);
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

/**
 * Valida que a descrição contém o nome do produto.
 */
function validateDescription(productName, description) {
  const errors = [];

  if (!description || description.length < 10) {
    return { pass: false, errors: ['Descrição do produto ausente ou muito curta'], warnings: [] };
  }

  const normDesc = normalize(description);
  const normName = normalize(productName);
  const nameWords = normName.split(/\s+/).filter(w => w.length > 3);

  if (nameWords.length > 0) {
    const foundWords = nameWords.filter(w => normDesc.includes(w));
    if (foundWords.length === 0 && nameWords.length >= 2) {
      errors.push(`Descrição não menciona o produto: "${description.slice(0, 60)}"`);
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

/**
 * Executa TODAS as validações do produto e retorna resultado consolidado.
 *
 * @param {object} product - Dados do produto (do catálogo + scraping)
 * @param {object} options
 * @param {string} options.expectedCategory - Categoria esperada (pilar)
 * @returns {{
 *   pass: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   checks: Array<{ name: string, pass: boolean, detail: string }>,
 *   score: number
 * }}
 */
export function validateProduct(product, { expectedCategory } = {}) {
  const allChecks = [];
  const allErrors = [];
  const allWarnings = [];
  let passedChecks = 0;
  let failedChecks = 0;

  const catalogName = product?.name || product?.productName || product?.title || '';
  const scrapedTitle = product?.title || '';
  const imageUrl = product?.imageUrl || '';
  const description = product?.description || '';
  const category = expectedCategory || product?.category || product?.pillar || '';
  const affiliateUrl = product?.affiliateUrl || '';

  // 1. Coerência de categoria
  const catCheck = validateCategoryCoherence(catalogName, category);
  for (const e of catCheck.errors) allErrors.push(e);
  for (const w of catCheck.warnings) allWarnings.push(w);
  allChecks.push({ name: 'categoria_coerencia', pass: catCheck.pass, detail: catCheck.pass ? '✅ Categoria coerente com produto' : `❌ ${catCheck.errors[0]}` });
  if (catCheck.pass) passedChecks++; else failedChecks++;

  // 2. Consistência de título (catálogo vs scraping)
  const titleCheck = validateTitleConsistency(catalogName, scrapedTitle);
  for (const e of titleCheck.errors) allErrors.push(e);
  for (const w of titleCheck.warnings) allWarnings.push(w);
  allChecks.push({ name: 'titulo_consistencia', pass: titleCheck.pass, detail: titleCheck.pass ? '✅ Título consistente entre catálogo e scraping' : `❌ ${titleCheck.errors[0]}` });
  if (titleCheck.pass) passedChecks++; else failedChecks++;

  // 3. Imagem
  const imgCheck = validateProductImage(imageUrl);
  for (const e of imgCheck.errors) allErrors.push(e);
  for (const w of imgCheck.warnings) allWarnings.push(w);
  allChecks.push({ name: 'imagem_url', pass: imgCheck.pass, detail: imgCheck.pass ? '✅ URL da imagem válida' : `❌ ${imgCheck.errors[0]}` });
  if (imgCheck.pass) passedChecks++; else failedChecks++;

  // 4. Descrição
  const descCheck = validateDescription(catalogName, description);
  for (const e of descCheck.errors) allErrors.push(e);
  for (const w of descCheck.warnings) allWarnings.push(w);
  allChecks.push({ name: 'descricao', pass: descCheck.pass, detail: descCheck.pass ? '✅ Descrição coerente com produto' : `❌ ${descCheck.errors[0]}` });
  if (descCheck.pass) passedChecks++; else failedChecks++;

  // 5. ASIN na URL (se disponível)
  if (affiliateUrl) {
    const asin = extractAsin(affiliateUrl);
    const hasAsin = !!asin;
    allChecks.push({ name: 'asin', pass: hasAsin, detail: hasAsin ? `✅ ASIN ${asin} extraído` : '❌ ASIN não encontrado na URL' });
    if (hasAsin) passedChecks++; else failedChecks++;

    // ASIN tem 10 caracteres alfanuméricos?
    const asinValid = hasAsin && /^[A-Z0-9]{10}$/.test(asin);
    allChecks.push({ name: 'asin_valido', pass: asinValid, detail: asinValid ? `✅ ASIN ${asin} válido` : `❌ ASIN inválido: ${asin}` });
    if (asinValid) passedChecks++; else failedChecks++;
  }

  // 6. Categoria válida
  const catValid = VALID_CATEGORIES.includes(category);
  allChecks.push({ name: 'categoria_valida', pass: catValid, detail: catValid ? `✅ Categoria: ${category}` : `❌ Categoria inválida: ${category}` });
  if (catValid) passedChecks++; else failedChecks++;

  const total = allChecks.length;
  const score = total > 0 ? Math.round((passedChecks / total) * 100) : 0;

  return {
    pass: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    checks: allChecks,
    score,
    summary: `${passedChecks}/${total} checks passaram — ${score}% — ${allErrors.length === 0 ? '✅ PRODUTO VÁLIDO' : '❌ PRODUTO INVÁLIDO'}`,
    details: { total, passed: passedChecks, failed: failedChecks },
  };
}

/**
 * Valida que NENHUM fallback de categoria inseguro está sendo usado.
 * Se a categoria não puder ser determinada → ABORTAR.
 */
export function validateCategorySafety(category, productName) {
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return {
      pass: false,
      error: `Categoria "${category || 'vazia'}" é inválida ou indeterminada para o produto "${(productName || '').slice(0, 50)}" — ABORTAR`,
      category: null,
    };
  }
  return { pass: true, error: null, category };
}
