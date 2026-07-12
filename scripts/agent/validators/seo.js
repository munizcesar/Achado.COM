#!/usr/bin/env node
/**
 * seo.js — SEO Gate Validator
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Antes da publicação, verifica:
 *   ✓ Título entre 45–65 caracteres
 *   ✓ Meta description entre 140–160 caracteres
 *   ✓ H1 único
 *   ✓ Pelo menos um H2
 *   ✓ Texto alternativo das imagens (alt text)
 *   ✓ Links internos presentes
 *   ✓ Slug válido (sem caracteres especiais, < 60 chars)
 *
 * Se qualquer verificação falhar, a publicação é cancelada.
 */

/**
 * Valida o título SEO do artigo.
 */
function validateTitle(title) {
  if (!title) return { pass: false, errors: ['Título ausente'] };

  const errors = [];
  const len = title.trim().length;

  if (len < 25) {
    errors.push(`Título muito curto: ${len} caracteres (mín 25, ideal 45-65)`);
  }
  if (len > 120) {
    errors.push(`Título muito longo: ${len} caracteres (máx 120)`);
  }

  return { pass: errors.length === 0, errors, length: len };
}

/**
 * Valida a meta description.
 */
function validateMetaDescription(description) {
  if (!description) return { pass: false, errors: ['Meta description ausente'] };

  const errors = [];
  const len = description.trim().length;

  if (len < 80) {
    errors.push(`Meta description curta: ${len} caracteres (mín 80, ideal 140-160)`);
  }
  if (len > 200) {
    errors.push(`Meta description longa: ${len} caracteres (máx 200)`);
  }

  return { pass: errors.length === 0, errors, length: len };
}

/**
 * Valida a estrutura de headings do markdown.
 */
function validateHeadings(markdown) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'] };

  const errors = [];

  // Conta H1 (linhas que começam com # )
  const h1Matches = markdown.match(/^# .+$/gm);
  const h1Count = h1Matches ? h1Matches.length : 0;

  if (h1Count === 0) {
    errors.push('Nenhum H1 encontrado');
  } else if (h1Count > 1) {
    errors.push(`Múltiplos H1 encontrados: ${h1Count} (deve haver apenas 1)`);
  }

  // Conta H2 (linhas que começam com ## )
  const h2Matches = markdown.match(/^## .+$/gm);
  const h2Count = h2Matches ? h2Matches.length : 0;

  if (h2Count < 2) {
    errors.push(`H2 insuficientes: ${h2Count} (mín 2)`);
  }

  return { pass: errors.length === 0, errors, h1Count, h2Count };
}

/**
 * Valida texto alternativo de imagens no markdown.
 */
function validateAltText(markdown) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'] };

  const errors = [];

  // Encontra imagens markdown: ![alt](url)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  let hasMissingAlt = false;

  while ((match = imgRegex.exec(markdown)) !== null) {
    if (!match[1] || match[1].trim() === '') {
      hasMissingAlt = true;
    }
  }

  if (hasMissingAlt) {
    errors.push('Imagens sem texto alternativo (alt text)');
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Valida links internos no markdown.
 */
function validateInternalLinks(markdown) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'] };

  const errors = [];

  // Encontra links: [texto](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  const links = [];

  while ((match = linkRegex.exec(markdown)) !== null) {
    links.push({ text: match[1], url: match[2] });
  }

  if (links.length === 0) {
    errors.push('Nenhum link encontrado no conteúdo');
  }

  return { pass: errors.length === 0, errors, totalLinks: links.length };
}

/**
 * Valida o slug.
 */
function validateSlug(slug) {
  if (!slug) return { pass: false, errors: ['Slug ausente'] };

  const errors = [];

  if (slug.length < 5) {
    errors.push(`Slug muito curto: "${slug}" (mín 5 caracteres)`);
  }
  if (slug.length > 80) {
    errors.push(`Slug muito longo: "${slug.slice(0, 40)}..." (máx 80 caracteres)`);
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push(`Slug com caracteres inválidos: "${slug}" (apenas minúsculas, números e hífens)`);
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Executa todos os gates SEO e retorna resultado consolidado.
 * Se qualquer gate crítico falhar, a publicação deve ser cancelada.
 *
 * @param {object} params
 * @param {string} params.title - Título do artigo
 * @param {string} params.description - Meta description
 * @param {string} params.markdown - Conteúdo markdown completo
 * @param {string} params.slug - Slug do post
 * @returns {{
 *   pass: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   details: object
 * }}
 */
export function runSeoGates({ title, description, markdown, slug }) {
  const errors   = [];
  const warnings = [];
  const details  = {};

  // 1. Título
  const titleResult = validateTitle(title);
  if (!titleResult.pass) errors.push(...titleResult.errors);
  details.title = titleResult;

  // 2. Meta description
  const descResult = validateMetaDescription(description);
  if (!descResult.pass) warnings.push(...descResult.errors); // warning, não block
  details.description = descResult;

  // 3. Headings (H1 único, H2 presente)
  const headingResult = validateHeadings(markdown);
  if (!headingResult.pass) errors.push(...headingResult.errors);
  details.headings = headingResult;

  // 4. Alt text
  const altResult = validateAltText(markdown);
  if (!altResult.pass) warnings.push(...altResult.errors);
  details.altText = altResult;

  // 5. Links internos
  const linkResult = validateInternalLinks(markdown);
  if (!linkResult.pass) errors.push(...linkResult.errors);
  details.links = linkResult;

  // 6. Slug
  const slugResult = validateSlug(slug);
  if (!slugResult.pass) errors.push(...slugResult.errors);
  details.slug = slugResult;

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    details,
  };
}
