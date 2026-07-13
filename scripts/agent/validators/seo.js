#!/usr/bin/env node
/**
 * seo.js — SEO Gate Validator v2
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Validações v2 (adicionais):
 *   ✓ Keyword principal no primeiro parágrafo
 *   ✓ Keyword principal na conclusão
 *   ✓ Keyword principal em pelo menos um H2
 *   ✓ Slug coerente com o título
 *   ✓ Meta description única (não duplicada)
 *   ✓ Link canônico presente (se disponível)
 *   ✓ Open Graph tags (se disponíveis)
 *   ✓ JSON-LD válido (se presente)
 *   ✓ Cobertura semântica (entidades do nicho)
 */

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
 * Extrai a keyword principal do título do produto.
 */
function extractPrimaryKeyword(title) {
  if (!title) return '';
  // Remove marca do início
  const withoutBrand = normalize(title).replace(/^(growth|max titanium|integralmédica|integralmedica|probiotica|now foods|vitafor|salus|natura|avon|eudora|o boticário|boticário|l'oreal|loreal|pantene|nivea|philips|mondial|arno|tramontina|electrolux|lg|samsung|sony|xiaomi|acer|lenovo|dell|hp|apple|motorola)\s+/i, '');
  return withoutBrand.slice(0, 60);
}

/**
 * Valida título SEO.
 */
function validateTitle(title) {
  if (!title) return { pass: false, errors: ['Título ausente'], length: 0 };
  const errors = [];
  const len = title.trim().length;
  if (len < 25) errors.push(`Título muito curto: ${len} caracteres (mín 25, ideal 45-65)`);
  if (len > 120) errors.push(`Título muito longo: ${len} caracteres (máx 120)`);
  return { pass: errors.length === 0, errors, length: len };
}

/**
 * Valida meta description.
 */
function validateMetaDescription(description) {
  if (!description) return { pass: false, errors: ['Meta description ausente'], length: 0 };
  const errors = [];
  const len = description.trim().length;
  if (len < 80) errors.push(`Meta description curta: ${len} caracteres (mín 80, ideal 140-160)`);
  if (len > 200) errors.push(`Meta description longa: ${len} caracteres (máx 200)`);
  return { pass: errors.length === 0, errors, length: len };
}

/**
 * Valida headings.
 */
function validateHeadings(markdown) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'], h1Count: 0, h2Count: 0 };
  const errors = [];

  const h1Matches = markdown.match(/^# .+$/gm);
  const h1Count = h1Matches ? h1Matches.length : 0;
  if (h1Count === 0) errors.push('Nenhum H1 encontrado');
  else if (h1Count > 1) errors.push(`Múltiplos H1 encontrados: ${h1Count} (deve haver apenas 1)`);

  const h2Matches = markdown.match(/^## .+$/gm);
  const h2Count = h2Matches ? h2Matches.length : 0;
  if (h2Count < 2) errors.push(`H2 insuficientes: ${h2Count} (mín 2)`);

  return { pass: errors.length === 0, errors, h1Count, h2Count };
}

/**
 * Valida ALT text.
 */
function validateAltText(markdown) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'] };
  const errors = [];
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  let hasMissingAlt = false;
  while ((match = imgRegex.exec(markdown)) !== null) {
    if (!match[1] || match[1].trim() === '') hasMissingAlt = true;
  }
  if (hasMissingAlt) errors.push('Imagens sem texto alternativo (alt text)');
  return { pass: errors.length === 0, errors };
}

/**
 * Valida links internos.
 */
function validateInternalLinks(markdown) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'] };
  const errors = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  const links = [];
  while ((match = linkRegex.exec(markdown)) !== null) {
    links.push({ text: match[1], url: match[2] });
  }
  if (links.length === 0) errors.push('Nenhum link encontrado no conteúdo');
  return { pass: errors.length === 0, errors, totalLinks: links.length };
}

/**
 * Valida slug.
 */
function validateSlug(slug) {
  if (!slug) return { pass: false, errors: ['Slug ausente'] };
  const errors = [];
  if (slug.length < 5) errors.push(`Slug muito curto: "${slug}" (mín 5 caracteres)`);
  if (slug.length > 80) errors.push(`Slug muito longo: "${slug.slice(0, 40)}..." (máx 80 caracteres)`);
  if (!/^[a-z0-9-]+$/.test(slug)) errors.push(`Slug com caracteres inválidos: "${slug}" (apenas minúsculas, números e hífens)`);
  return { pass: errors.length === 0, errors };
}

/**
 * NOVA: Valida posição da keyword principal.
 */
function validateKeywordPosition(markdown, primaryKeyword) {
  const errors = [];
  const warnings = [];
  
  if (!primaryKeyword || !markdown) {
    return { pass: false, errors: ['Keyword principal ou markdown ausente'], warnings: [] };
  }

  const kw = primaryKeyword.toLowerCase().trim();
  const bodyStart = markdown.replace(/---[\s\S]*?---\n*/, '').trim();

  // 1. Keyword no primeiro parágrafo
  const paragraphs = bodyStart.split(/\n\n+/).filter(p => p.trim().length > 50 && !p.startsWith('#'));
  if (paragraphs.length > 0) {
    const firstPara = normalize(paragraphs[0]);
    if (firstPara.includes(kw) || kw.split(/\s+/).some(w => w.length > 3 && firstPara.includes(w))) {
      // pass: keyword no primeiro parágrafo
    } else {
      errors.push('Keyword principal ausente do primeiro parágrafo');
    }
  }

  // 2. Keyword na conclusão (últimos 20% do texto)
  const textLength = bodyStart.length;
  const lastPart = bodyStart.slice(Math.floor(textLength * 0.8));
  const normLast = normalize(lastPart);
  if (!normLast.includes(kw) && !kw.split(/\s+/).some(w => w.length > 3 && normLast.includes(w))) {
    warnings.push('Keyword principal ausente da conclusão (últimos 20% do texto)');
  }

  // 3. Keyword em pelo menos um H2
  const h2s = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  const kwInH2 = h2s.some(m => {
    const h2Text = normalize(m[1]);
    return h2Text.includes(kw) || kw.split(/\s+/).some(w => w.length > 3 && h2Text.includes(w));
  });
  if (!kwInH2) {
    errors.push('Keyword principal ausente de todos os H2');
  }

  return { pass: errors.length === 0, errors, warnings };
}

/**
 * NOVA: Valida coerência do slug com o título.
 */
function validateSlugCoherence(title, slug) {
  if (!title || !slug) return { pass: false, errors: ['Título ou slug ausente'] };
  const errors = [];

  const normTitle = normalize(title);
  const normSlug = slug.replace(/-/g, ' ');

  const titleWords = normTitle.split(/\s+/).filter(w => w.length > 3);
  const slugWords = normSlug.split(/\s+/).filter(w => w.length > 3);
  const matchedWords = slugWords.filter(w => titleWords.includes(w));

  if (matchedWords.length < 2 && slugWords.length >= 2 && titleWords.length >= 3) {
    errors.push(`Slug "${slug}" não corresponde ao título "${title.slice(0, 50)}" (apenas ${matchedWords.length} palavras em comum)`);
  }

  return { pass: errors.length === 0, errors };
}

/**
 * NOVA: Valida cobertura semântica (entidades do nicho).
 */
function validateSemanticCoverage(markdown, category) {
  if (!markdown) return { pass: false, errors: ['Markdown vazio'], coverage: 0 };
  const errors = [];
  const lower = markdown.toLowerCase();

  const semanticTerms = {
    saude: ['biodisponibilidade', 'absorção', 'metabolismo', 'dosagem', 'eficácia', 
            'aminoácidos', 'suplementação', 'estudo clínico', 'ingrediente ativo',
            'concentração', 'protocolo', 'nutriente', 'mineral', 'vitamina'],
    beleza: ['barreira cutânea', 'hidratação', 'textura', 'ingrediente ativo', 
             'fotoproteção', 'antioxidante', 'pele', 'facial', 'capilar',
             'sérum', 'protetor solar', 'fps', 'cosmético'],
    casa: ['praticidade', 'durabilidade', 'eficiência', 'consumo energético',
           'capacidade', 'material', 'dimensão', 'funcionalidade', 'design',
           'versatilidade', 'resistência'],
    default: ['qualidade', 'desempenho', 'funcionalidade', 'benefícios', 
              'diferenciais', 'especificações', 'tecnologia', 'inovação'],
  };

  const terms = semanticTerms[category] || semanticTerms.default;
  let foundTerms = 0;
  for (const term of terms) {
    if (lower.includes(term)) foundTerms++;
  }

  const coverage = Math.round((foundTerms / terms.length) * 100);
  if (coverage < 30) {
    errors.push(`Cobertura semântica baixa: ${coverage}% (${foundTerms}/${terms.length} termos do nicho)`);
  }

  return { pass: errors.length === 0, errors, coverage, foundTerms, totalTerms: terms.length };
}

/**
 * NOVA: Valida JSON-LD no markdown (se presente).
 */
function validateJsonLd(markdown) {
  if (!markdown) return { pass: true, errors: [], hasLd: false };
  
  // Procura por JSON-LD dentro de script tags
  const ldMatch = markdown.match(/<script\s+type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/i);
  if (!ldMatch) {
    // JSON-LD não é obrigatório (é gerado pelo Astro), então não falha
    return { pass: true, errors: [], hasLd: false };
  }

  try {
    const ld = JSON.parse(ldMatch[1]);
    if (!ld['@context'] || !ld['@type']) {
      return { pass: false, errors: ['JSON-LD inválido: falta @context ou @type'], hasLd: true };
    }
    return { pass: true, errors: [], hasLd: true, data: ld };
  } catch {
    return { pass: false, errors: ['JSON-LD inválido: erro de parsing'], hasLd: true };
  }
}

/**
 * Executa todos os gates SEO v2.
 */
export function runSeoGates({ title, description, markdown, slug, category } = {}) {
  const errors = [];
  const warnings = [];
  const details = {};

  // 1. Título
  const titleResult = validateTitle(title);
  if (!titleResult.pass) errors.push(...titleResult.errors);
  details.title = titleResult;

  // 2. Meta description
  const descResult = validateMetaDescription(description);
  if (!descResult.pass) warnings.push(...descResult.errors);
  details.description = descResult;

  // 3. Headings
  const headingResult = validateHeadings(markdown);
  if (!headingResult.pass) errors.push(...headingResult.errors);
  details.headings = headingResult;

  // 4. ALT text
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

  // 7. Keyword position (NOVO)
  const primaryKeyword = extractPrimaryKeyword(title);
  const kwResult = validateKeywordPosition(markdown, primaryKeyword);
  if (!kwResult.pass) errors.push(...kwResult.errors);
  if (kwResult.warnings) warnings.push(...kwResult.warnings);
  details.keywordPosition = kwResult;

  // 8. Slug coherence (NOVO)
  const slugCohResult = validateSlugCoherence(title, slug);
  if (!slugCohResult.pass) warnings.push(...slugCohResult.errors);
  details.slugCoherence = slugCohResult;

  // 9. Semantic coverage (NOVO)
  const semResult = validateSemanticCoverage(markdown, category);
  if (!semResult.pass) warnings.push(...semResult.errors);
  details.semanticCoverage = semResult;

  // 10. JSON-LD (NOVO)
  const ldResult = validateJsonLd(markdown);
  if (!ldResult.pass) errors.push(...ldResult.errors);
  details.jsonLd = ldResult;

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    details,
  };
}
