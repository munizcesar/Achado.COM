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
 * Extrai o frontmatter de um markdown.
 * Retorna o texto do frontmatter ou string vazia.
 */
function extractFrontmatter(markdown) {
  if (!markdown || !markdown.startsWith('---')) return '';
  const fmEnd = markdown.indexOf('\n---\n', 4);
  if (fmEnd < 0) return '';
  return markdown.slice(0, fmEnd + 5);
}

/**
 * Valida o Markdown final antes de salvar.
 *
 * NOTA: O título do markdown vem da Amazon (título oficial do produto),
 * enquanto o parâmetro `title` passado aqui é o nome do catálogo.
 * Eles raramente são iguais, então a verificação é flexível.
 *
 * A URL de afiliado gerada pelo novo-post.js pode conter UTMs extras,
 * então também usamos verificação flexível por ASIN.
 */
export function validateFinalMarkdown(markdown, { title, category, imageFile, affiliateUrl, slug } = {}) {
  const errors = [];

  if (!markdown) {
    return { pass: false, errors: ['Markdown vazio'], warnings: [] };
  }

  // Frontmatter básico
  if (!markdown.startsWith('---')) {
    errors.push('Markdown sem frontmatter (---)');
    // Se não tem frontmatter, não adianta continuar checando
    return { pass: false, errors, warnings: [] };
  }

  const frontmatter = extractFrontmatter(markdown);

  // ── Título no frontmatter ───
  // Verificação flexível: o título da Amazon é diferente do nome do catálogo
  const titleMatch = frontmatter.match(/^title:\s*"([^"]+)"\s*$/m) || frontmatter.match(/^title:\s*'([^']+)'\s*$/m);

  if (!titleMatch) {
    errors.push('Frontmatter sem campo title');
  } else {
    const mdTitle = titleMatch[1].trim();
    if (!mdTitle || mdTitle.length < 5) {
      errors.push('Título no frontmatter muito curto ou vazio');
    } else if (/^Produto Amazon\b/i.test(mdTitle) || /^Produto\b$/i.test(mdTitle)) {
      errors.push(`Título genérico no frontmatter: "${mdTitle.slice(0, 60)}"`);
    }
  }

  // ── Categoria no frontmatter ──
  if (category) {
    const catMatch = frontmatter.match(/^category:\s*(\S+)\s*$/m);
    if (!catMatch) {
      errors.push(`Categoria não encontrada no frontmatter`);
    } else if (!VALID_CATEGORIES.includes(catMatch[1])) {
      errors.push(`Categoria inválida no frontmatter: "${catMatch[1]}"`);
    }
  }

  // ── Imagem ──
  if (imageFile && !frontmatter.includes(imageFile)) {
    errors.push(`Imagem ${imageFile} não referenciada no frontmatter`);
  }

  // ── Link de afiliado ──
  // Verificação flexível: novo-post.js adiciona UTMs à URL
  if (affiliateUrl) {
    // Extrai ASIN da URL original
    const asinMatch = affiliateUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);

    if (asinMatch) {
      const asin = asinMatch[1];
      // Procura por qualquer URL com o mesmo ASIN no markdown inteiro
      const asinInMarkdown = new RegExp(`/dp/${asin}[/?#]`, 'i').test(markdown) ||
                             new RegExp(`/dp/${asin}"`, 'i').test(markdown) ||
                             markdown.includes(asin);
      if (!asinInMarkdown) {
        errors.push(`URL com ASIN ${asin} não encontrada no markdown`);
      }
    } else {
      // Fallback: verificação exata (para lojas não-Amazon)
      if (!markdown.includes(affiliateUrl)) {
        errors.push('URL de afiliado não encontrada no markdown');
      }
    }

    // Verifica tag= em qualquer lugar do markdown
    const hasTag = /[?&]tag=/.test(markdown) || affiliateUrl.includes('?tag=') || affiliateUrl.includes('&tag=');
    if (!hasTag) {
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
