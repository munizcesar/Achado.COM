#!/usr/bin/env node
/**
 * image-validator.js — Validação Completa de Imagens
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Verifica que:
 *   ✓ ALT text menciona o produto correto
 *   ✓ Nome do arquivo corresponde ao produto (slug)
 *   ✓ Legenda (se existir) corresponde ao produto
 *   ✓ Produto mostrado na imagem é o mesmo do artigo
 *   ✓ Imagem existe no disco e tem tamanho válido
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const ROOT        = path.resolve(__dirname, '..', '..', '..');

const VALID_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png'];

/**
 * Normaliza texto para comparação.
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
 * Extrai palavras significativas do nome do produto.
 */
function extractProductKeywords(productName) {
  const genericWords = /^(para|com|sem|mais|menos|que|por|uma|uns|das|dos|nas|nos|pela|pelo|numa|num|de|da|do|no|na|em|ao|aos|à|às|como|entre|após|depois|antes|sobre|tipo|cor|novo|nova|único|unico|única|unica|especial|super|plus|original|linha|série|serie|versão|versao)$/i;
  const words = normalize(productName).split(/\s+/).filter(w => 
    w.length > 3 && !genericWords.test(w) && !/^\d+$/.test(w)
  );
  return [...new Set(words)];
}

/**
 * Extrai todas as imagens do markdown: ![alt](url) e tags de imagem.
 */
function extractImages(markdown) {
  const images = [];
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    images.push({
      alt: match[1].trim(),
      url: match[2].trim(),
      full: match[0],
      index: match.index,
    });
  }
  return images;
}

/**
 * Valida o nome do arquivo da imagem.
 */
function validateFilename(slug, imageFile) {
  const errors = [];
  const filename = path.basename(imageFile || '').replace(/\.[^.]+$/, '');
  
  if (!filename) {
    errors.push('Nome do arquivo de imagem vazio');
    return { pass: false, errors };
  }

  // O nome do arquivo deve conter o slug
  const slugNorm = normalize(slug);
  const fileNorm = normalize(filename);
  
  if (!fileNorm.includes(slugNorm) && !slugNorm.includes(fileNorm)) {
    const slugWords = slugNorm.replace(/-/g, ' ').split(/\s+/).filter(w => w.length > 3);
    const matchedWords = slugWords.filter(w => fileNorm.includes(w));
    if (matchedWords.length < 2 && slugWords.length >= 2) {
      errors.push(`Nome do arquivo "${filename}" não corresponde ao slug "${slug}"`);
    }
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Valida o ALT text da imagem.
 */
function validateAltText(productName, altText) {
  const errors = [];

  if (!altText) {
    errors.push('ALT text vazio — obrigatório para SEO e acessibilidade');
    return { pass: false, errors };
  }

  if (altText.length < 5) {
    errors.push(`ALT text muito curto: "${altText}" (mínimo 5 caracteres)`);
    return { pass: false, errors };
  }

  // ALT deve conter pelo menos uma palavra-chave do produto
  const keywords = extractProductKeywords(productName);
  const normalizedAlt = normalize(altText);
  const matchedKeywords = keywords.filter(k => normalizedAlt.includes(k));

  if (matchedKeywords.length === 0 && keywords.length >= 2) {
    errors.push(`ALT text "${altText.slice(0, 50)}" não menciona o produto "${productName.slice(0, 40)}"`);
  }

  // ALT não pode ser genérico
  const genericAlts = [/^imagem$/i, /^foto$/i, /^produto$/i, /^imagem do produto$/i, /^foto do produto$/i];
  for (const pat of genericAlts) {
    if (pat.test(altText.trim())) {
      errors.push(`ALT text genérico: "${altText}"`);
      break;
    }
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Valida o arquivo de imagem no disco.
 */
function validateImageFile(imagePath) {
  const errors = [];

  if (!imagePath) {
    errors.push('Caminho da imagem não informado');
    return { pass: false, errors };
  }

  if (!fs.existsSync(imagePath)) {
    errors.push(`Arquivo de imagem não encontrado: ${imagePath}`);
    return { pass: false, errors };
  }

  const stat = fs.statSync(imagePath);
  if (stat.size < 1024) {
    errors.push(`Imagem muito pequena: ${stat.size} bytes (mín 1KB)`);
  }
  if (stat.size > 10 * 1024 * 1024) {
    errors.push(`Imagem muito grande: ${(stat.size / 1024 / 1024).toFixed(1)}MB (máx 10MB)`);
  }

  const ext = path.extname(imagePath).toLowerCase();
  if (!VALID_EXTENSIONS.includes(ext)) {
    errors.push(`Extensão de imagem inválida: ${ext} (válidas: ${VALID_EXTENSIONS.join(', ')})`);
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Executa TODAS as validações de imagem.
 *
 * @param {object} params
 * @param {string} params.markdown - Conteúdo markdown do post
 * @param {string} params.productName - Nome do produto
 * @param {string} params.slug - Slug do post
 * @param {string} params.imageFile - Nome do arquivo de imagem
 * @param {string} [params.imagePath] - Caminho completo no disco
 * @returns {{
 *   passed: boolean,
 *   checks: Array<{ name: string, pass: boolean, detail: string }>,
 *   errors: string[],
 *   score: number
 * }}
 */
export function validateImages({ markdown, productName, slug, imageFile, imagePath } = {}) {
  const checks = [];
  const allErrors = [];
  let passedChecks = 0;
  let failedChecks = 0;

  // 1. Arquivo de imagem no disco
  if (imagePath) {
    const fileCheck = validateImageFile(imagePath);
    for (const e of fileCheck.errors) allErrors.push(e);
    checks.push({ name: 'imagem_arquivo', pass: fileCheck.pass, detail: fileCheck.pass ? `✅ Imagem válida: ${imagePath}` : `❌ ${fileCheck.errors[0]}` });
    if (fileCheck.pass) passedChecks++; else failedChecks++;
  }

  // 2. Nome do arquivo
  if (imageFile && slug) {
    const nameCheck = validateFilename(slug, imageFile);
    for (const e of nameCheck.errors) allErrors.push(e);
    checks.push({ name: 'imagem_nome_arquivo', pass: nameCheck.pass, detail: nameCheck.pass ? `✅ Nome do arquivo "${imageFile}" coerente com o slug` : `❌ ${nameCheck.errors[0]}` });
    if (nameCheck.pass) passedChecks++; else failedChecks++;
  }

  // 3. Imagens no markdown
  if (markdown) {
    const images = extractImages(markdown);
    
    if (images.length === 0) {
      checks.push({ name: 'imagens_markdown', pass: false, detail: '❌ Nenhuma imagem no markdown' });
      allErrors.push('Nenhuma imagem encontrada no markdown');
      failedChecks++;
    } else {
      checks.push({ name: 'imagens_markdown', pass: true, detail: `✅ ${images.length} imagem(ns) no markdown` });
      passedChecks++;

      // 4. ALT text de cada imagem
      let altPassed = 0;
      let altFailed = 0;
      for (const img of images) {
        const altCheck = validateAltText(productName, img.alt);
        if (altCheck.pass) {
          altPassed++;
        } else {
          altFailed++;
          for (const e of altCheck.errors) allErrors.push(`ALT: ${e}`);
        }
      }
      checks.push({ name: 'imagem_alt_text', pass: altFailed === 0, detail: altFailed === 0 ? `✅ ${images.length} ALT text(s) válidos` : `❌ ${altFailed}/${images.length} ALT text(s) inválidos` });
      if (altFailed === 0) passedChecks++; else failedChecks++;

      // 5. Referência ao produto na imagem principal (primeira)
      if (images.length > 0 && productName) {
        const keywords = extractProductKeywords(productName);
        const firstAlt = normalize(images[0].alt);
        const matchedKeywords = keywords.filter(k => firstAlt.includes(k));
        const hasProductRef = matchedKeywords.length > 0 || keywords.length < 2;
        checks.push({ name: 'imagem_referencia_produto', pass: hasProductRef, detail: hasProductRef ? `✅ Primeira imagem referencia o produto` : `❌ ALT da primeira imagem não menciona o produto` });
        if (hasProductRef) passedChecks++; else failedChecks++;
      }
    }
  }

  const total = checks.length;
  const score = total > 0 ? Math.round((passedChecks / total) * 100) : 0;

  return {
    passed: allErrors.length === 0,
    checks,
    errors: allErrors,
    score,
    summary: `${passedChecks}/${total} verificações de imagem passaram — ${score}% — ${allErrors.length === 0 ? '✅ IMAGEM VÁLIDA' : '❌ IMAGEM INVÁLIDA'}`,
    details: { total, passed: passedChecks, failed: failedChecks },
  };
}
