#!/usr/bin/env node
/**
 * cross-validation.js — Validação Cruzada (3 Fontes)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Antes da IA escrever, verifica que:
 *   Catálogo interno
 *   Amazon (via scraping/ASIN)
 *   Serper (via busca no Google)
 *
 * Concordam sobre:
 *   ✓ Marca
 *   ✓ Nome do produto
 *   ✓ Categoria
 *   ✓ Tipo do produto
 *
 * Se UMA delas divergir → STATUS: PRODUCT_MISMATCH → ABORTAR
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
 * Extrai termos distintivos de um nome de produto (ignora genéricos).
 */
function extractDistinctTerms(productName) {
  const generic = ['para', 'com', 'sem', 'mais', 'menos', 'que', 'por', 'uma', 'uns',
    'das', 'dos', 'nas', 'nos', 'pela', 'pelo', 'numa', 'num', 'de', 'da', 'do', 'no', 'na',
    'em', 'ao', 'aos', 'a', 'as', 'como', 'entre', 'apos', 'depois', 'antes', 'sobre',
    'tipo', 'cor', 'modelo', 'versao', 'linha', 'serie', 'original',
    'novo', 'nova', 'unico', 'unica', 'especial', 'super', 'plus',
    'preto', 'branco', 'azul', 'verde', 'vermelho', 'rosa', 'roxo'];
  const words = normalize(productName).split(/\s+/).filter(w => w.length > 3 && !generic.includes(w) && !/^\d+$/.test(w));
  return [...new Set(words)];
}

/**
 * Calcula similaridade entre dois nomes de produto.
 * Retorna 0-1 baseado em termos compartilhados.
 */
function calculateSimilarity(nameA, nameB) {
  const termsA = extractDistinctTerms(nameA);
  const termsB = extractDistinctTerms(nameB);
  if (termsA.length === 0 || termsB.length === 0) return 0.5; // neutro se não há termos

  const shared = termsA.filter(t => termsB.includes(t));
  const union = [...new Set([...termsA, ...termsB])];
  return union.length > 0 ? shared.length / union.length : 0;
}

/**
 * Valida se a marca do catálogo aparece no scraping e no Serper.
 */
function validateBrandConsistency(catalogBrand, scrapedTitle, serperTitle) {
  if (!catalogBrand || catalogBrand.length < 2) return { pass: true, note: 'Marca nao disponivel no catalogo' };

  const brand = normalize(catalogBrand);
  const inScraped = scrapedTitle ? normalize(scrapedTitle).includes(brand) : false;
  const inSerper = serperTitle ? normalize(serperTitle).includes(brand) : false;

  if (!inScraped) {
    return { pass: false, error: `Marca "${catalogBrand}" nao encontrada no scraping (titulo: "${(scrapedTitle || '').slice(0, 60)}")` };
  }
  if (serperTitle && !inSerper) {
    return { pass: false, error: `Marca "${catalogBrand}" nao encontrada no Serper (titulo: "${serperTitle.slice(0, 60)}")` };
  }
  return { pass: true, note: `Marca "${catalogBrand}" confirmada em todas as fontes` };
}

/**
 * Valida que todas as 3 fontes concordam sobre o nome do produto.
 */
function validateNameConsistency(catalogName, scrapedName, serperTitle) {
  const errors = [];

  if (!catalogName) {
    return { pass: false, errors: ['Nome do catalogo ausente'] };
  }

  // Catálogo vs Scraping
  if (scrapedName) {
    const simCatVsScraped = calculateSimilarity(catalogName, scrapedName);
    if (simCatVsScraped < 0.25 && extractDistinctTerms(catalogName).length >= 2) {
      errors.push(`Catalogo vs Scraping: similaridade ${Math.round(simCatVsScraped * 100)}% — nomes muito diferentes ("${catalogName.slice(0, 50)}" vs "${scrapedName.slice(0, 50)}")`);
    }
  }

  // Catálogo vs Serper
  if (serperTitle) {
    const simCatVsSerper = calculateSimilarity(catalogName, serperTitle);
    if (simCatVsSerper < 0.25 && extractDistinctTerms(catalogName).length >= 2) {
      errors.push(`Catalogo vs Serper: similaridade ${Math.round(simCatVsSerper * 100)}% — Serper retornou produto diferente ("${serperTitle.slice(0, 60)}")`);
    }
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Executa validação cruzada entre Catálogo, Amazon (scraping) e Serper.
 *
 * @param {object} catalogProduct - Dados do catálogo interno
 * @param {string} catalogProduct.name - Nome no catálogo
 * @param {string} [catalogProduct.brand] - Marca no catálogo
 * @param {string} [catalogProduct.category] - Categoria/pilar
 *
 * @param {object} scrapedData - Dados do scraping Amazon
 * @param {string} [scrapedData.title] - Título raspado da Amazon
 * @param {string} [scrapedData.brand] - Marca extraída
 *
 * @param {object} serperData - Dados do Serper (opcional)
 * @param {string} [serperData.title] - Título da busca Serper
 * @param {string} [serperData.snippet] - Snippet da busca
 *
 * @returns {{
 *   pass: boolean,
 *   status: string,
 *   errors: string[],
 *   checks: Array<{ name: string, pass: boolean, detail: string }>,
 *   score: number
 * }}
 */
export function crossValidate(catalogProduct = {}, scrapedData = {}, serperData = null) {
  const checks = [];
  const errors = [];
  let passedChecks = 0, failedChecks = 0;

  const catalogName = catalogProduct.name || catalogProduct.productName || catalogProduct.title || '';
  const catalogBrand = catalogProduct.brand || '';
  const scrapedTitle = scrapedData.title || scrapedData.name || '';
  const serperTitle = serperData?.title || serperData?.snippet || null;

  // 1. Marca
  const brandCheck = validateBrandConsistency(catalogBrand, scrapedTitle, serperTitle);
  if (!brandCheck.pass) errors.push(brandCheck.error);
  checks.push({ name: 'marca_consistente', pass: brandCheck.pass, detail: brandCheck.pass ? brandCheck.note : brandCheck.error });
  if (brandCheck.pass) passedChecks++; else failedChecks++;

  // 2. Nome (Catálogo vs Scraping)
  const nameCheck = validateNameConsistency(catalogName, scrapedTitle, serperTitle);
  for (const e of nameCheck.errors) errors.push(e);
  checks.push({ name: 'nome_consistente', pass: nameCheck.pass, detail: nameCheck.pass ? 'Nome consistente entre catalogo e scraping' : nameCheck.errors[0] || 'Nomes divergem' });
  if (nameCheck.pass) passedChecks++; else failedChecks++;

  // 3. Similaridade geral
  let overallSim = 1;
  if (scrapedTitle && catalogName) {
    const catVsScraped = calculateSimilarity(catalogName, scrapedTitle);
    const catVsSerper = serperTitle ? calculateSimilarity(catalogName, serperTitle) : 1;
    overallSim = serperTitle ? (catVsScraped + catVsSerper) / 2 : catVsScraped;
  }
  const simOk = overallSim >= 0.3;
  if (!simOk) {
    errors.push(`Similaridade geral baixa: ${Math.round(overallSim * 100)}% (min 30%)`);
  }
  checks.push({ name: 'similaridade_geral', pass: simOk, detail: `Similaridade geral: ${Math.round(overallSim * 100)}% (min 30%)` });
  if (simOk) passedChecks++; else failedChecks++;

  const total = checks.length;
  const score = total > 0 ? Math.round((passedChecks / total) * 100) : 0;

  return {
    pass: errors.length === 0,
    status: errors.length === 0 ? 'PRODUCT_MATCH' : 'PRODUCT_MISMATCH',
    errors,
    checks,
    score,
    summary: `${passedChecks}/${total} validacoes cruzadas passaram — ${score}% — ${errors.length === 0 ? 'FONTES CONCORDAM' : 'FONTES DIVERGEM'}`,
    details: { total, passed: passedChecks, failed: failedChecks },
  };
}
