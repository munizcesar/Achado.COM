/**
 * quality.js — Quality Gates do Pipeline
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Cada gate retorna { pass: boolean, errors: string[], warnings: string[] }
 * Se qualquer gate critical falhar, a publicação é cancelada.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

const VALID_CATEGORIES = ['beleza', 'saude', 'casa', 'tech', 'esportes', 'automotivo'];

/**
 * Valida dados brutos do produto.
 */
export function validateProductData(product) {
  const errors   = [];
  const warnings = [];

  if (!product) {
    return { pass: false, errors: ['Produto é null/undefined'], warnings: [] };
  }

  // Título
  if (!product.title || product.title.trim().length < 10) {
    errors.push(`Título inválido: "${product.title?.slice(0, 60) || 'vazio'}" (mín 10 caracteres)`);
  } else if (product.title.trim().length < 25) {
    warnings.push(`Título curto: "${product.title.slice(0, 60)}" (${product.title.length} chars, ideal 25+)`);
  }

  // Título genérico — NUNCA publicar
  const genericPatterns = [
    /^produto amazon\b/i,
    /^produto mercad(o|a) livre\b/i,
    /^produto magalu\b/i,
  ];
  for (const pat of genericPatterns) {
    if (pat.test(product.title?.trim())) {
      errors.push(`Título genérico detectado: "${product.title.slice(0, 60)}" — NÃO PUBLICAR`);
    }
  }

  // Categoria
  if (!product.category || !VALID_CATEGORIES.includes(product.category)) {
    errors.push(`Categoria inválida: "${product.category || 'vazia'}"`);
  }

  // Imagem
  if (!product.imageUrl) {
    errors.push('URL de imagem ausente');
  }

  // Loja
  if (!product.store) {
    warnings.push('Loja não identificada');
    product.store = 'Amazon';
  }

  return { pass: errors.length === 0, errors, warnings };
}

/**
 * Valida o conteúdo gerado pela IA.
 */
export function validateGeneratedContent(content, productTitle) {
  const errors   = [];
  const warnings = [];

  if (!content) {
    return { pass: false, errors: ['Conteúdo gerado é null/undefined'], warnings: [] };
  }

  if (content.length < 200) {
    errors.push(`Conteúdo muito curto: ${content.length} caracteres (mín 200)`);
  }

  // Verifica se o nome do produto aparece no conteúdo
  if (productTitle) {
    const words = productTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const found = words.some(w => content.toLowerCase().includes(w));
    if (!found && words.length > 1) {
      warnings.push(`Nome do produto não aparece no conteúdo gerado`);
    }
  }

  // Verifica presença de markdown básico
  if (!content.includes('#')) {
    warnings.push('Conteúdo sem títulos markdown');
  }

  // Verifica presença de CTA
  const hasCTA = /confira|acesse|veja|conheça|saiba mais|clique|visite|confira no|verificar/i.test(content);
  if (!hasCTA) {
    warnings.push('Conteúdo sem CTA natural');
  }

  return { pass: errors.length === 0, errors, warnings };
}

/**
 * Valida o Markdown final antes de salvar.
 */
export function validateFinalMarkdown(markdown, { title, category, imageFile, affiliateUrl, slug } = {}) {
  const errors = [];

  if (!markdown) {
    return { pass: false, errors: ['Markdown vazio'], warnings: [] };
  }

  // Frontmatter básico
  if (!markdown.startsWith('---')) {
    errors.push('Markdown sem frontmatter (---)');
  }

  // Título no frontmatter
  if (title && !markdown.includes(`title: "${title}"`) && !markdown.includes(`title: '${title}'`)) {
    errors.push('Título do produto não encontrado no frontmatter');
  }

  // Categoria no frontmatter
  if (category && !markdown.includes(`category: ${category}`)) {
    errors.push(`Categoria ${category} não encontrada no frontmatter`);
  }

  // Imagem
  if (imageFile && !markdown.includes(imageFile)) {
    errors.push(`Imagem ${imageFile} não referenciada no frontmatter`);
  }

  // Link de afiliado
  if (affiliateUrl) {
    if (!markdown.includes(affiliateUrl)) {
      errors.push('URL de afiliado não encontrada no markdown');
    }
    // Verifica tag=
    if (!affiliateUrl.includes('?tag=') && !affiliateUrl.includes('&tag=')) {
      errors.push('URL de afiliado sem tag= — NÃO PUBLICAR');
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

/**
 * Valida o arquivo de imagem baixado.
 */
export function validateImageFile(filePath) {
  const errors = [];

  if (!filePath) {
    return { pass: false, errors: ['Caminho da imagem não informado'], warnings: [] };
  }

  if (!fs.existsSync(filePath)) {
    return { pass: false, errors: [`Arquivo de imagem não encontrado: ${filePath}`], warnings: [] };
  }

  const stat = fs.statSync(filePath);
  if (stat.size < 1024) {
    errors.push(`Imagem muito pequena: ${stat.size} bytes (mín 1KB)`);
  }

  if (stat.size > 10 * 1024 * 1024) {
    errors.push(`Imagem muito grande: ${(stat.size / 1024 / 1024).toFixed(1)}MB (máx 10MB)`);
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

/**
 * Gate único que executa todas as validações e retorna resultado consolidado.
 */
export function runQualityGates(stage, data) {
  let result;

  switch (stage) {
    case 'product_data':
      result = validateProductData(data.product);
      break;
    case 'generated_content':
      result = validateGeneratedContent(data.content, data.productTitle);
      break;
    case 'final_markdown':
      result = validateFinalMarkdown(data.markdown, data);
      break;
    case 'image_file':
      result = validateImageFile(data.filePath);
      break;
    default:
      result = { pass: true, errors: [], warnings: [] };
  }

  return result;
}
