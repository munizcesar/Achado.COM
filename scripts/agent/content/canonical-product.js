#!/usr/bin/env node
/**
 * canonical-product.js — Canonical Product Builder
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Transforma qualquer produto bruto (Amazon, ML, Magalu) em um
 * objeto padronizado. NENHUM outro módulo deve interpretar
 * diretamente HTML da Amazon — todos consomem este objeto.
 *
 * Entrada: { title, description, category, specs, store, imageUrl, ... }
 * Saída:   { asin, brand, product_name, category, subcategory,
 *            volume, manufacturer, ean, active_ingredients,
 *            dosage, market, specs, store, imageUrl, affiliateUrl }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);

// ── Marcas conhecidas (expandido do normalizer.js) ────────────────
const KNOWN_BRANDS = [
  'Integralmédica', 'Integralmedica', 'Growth', 'Max Titanium', 'Max',
  'Probiotica', 'Now Foods', 'Now', 'Optimum Nutrition', 'ON',
  'Universal', 'MuscleTech', 'BSN', 'Dymatize', 'Bodybuilders',
  'Darkness', 'Atlhetica', 'Synthec', 'Neo Nutri', 'Essential Nutrition',
  'Vitafor', 'Salus', 'Sundown', 'Lavitan', 'Centrum', 'Natura',
  'Avon', 'Eudora', 'O Boticário', 'Boticário', "L'Oréal", 'Loreal',
  'Pantene', 'Tresemmé', 'Kérastase', 'Kerastase', 'Elseve',
  'Dove', 'Seda', 'Nivea', 'Neutrogena', 'La Roche-Posay', 'Vichy',
  'Cetaphil', 'Avene', 'Bioderma', 'Mantecorp', 'Granado', 'Botox Capilar',
  'Wella', 'Schwarzkopf', 'Colgate', 'Oral-B', 'Sensodyne',
  'Philips', 'Philips Walita', 'Walita', 'Mondial', 'Britânia', 'Britania',
  'Arno', 'Cadence', 'Fischer', 'Tramontina', 'Rochedo', 'Oxford',
  'Electrolux', 'Consul', 'Brastemp', 'LG', 'Samsung', 'Panasonic',
  'Sony', 'JBL', 'Xiaomi', 'Multilaser', 'Positivo', 'Acer', 'Lenovo',
  'Dell', 'HP', 'Apple', 'Motorola',
];

// ── Subcategorias por pilar ──────────────────────────────────────
const SUBCATEGORIES = {
  saude: [
    'suplementos', 'vitaminas', 'minerais', 'proteínas', 'aminoácidos',
    'pré-treino', 'pós-treino', 'emagrecimento', 'saúde-articular',
    'saúde-intestinal', 'sono', 'imunidade', 'energia',
  ],
  beleza: [
    'skincare', 'cabelos', 'maquiagem', 'perfumes', 'corpo',
    'higiene', 'facial', 'capilar', 'protetor-solar', 'anti-idade',
  ],
  casa: [
    'cozinha', 'eletrodomésticos', 'decoração', 'organização',
    'cama-mesa-banho', 'limpeza', 'ferramentas', 'jardim',
  ],
};

/**
 * Extrai marca do título.
 */
function extractBrand(title) {
  if (!title) return '';
  const found = KNOWN_BRANDS.find(b =>
    new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(title)
  );
  if (found) return found;
  const firstWord = title.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 4 && !/^\d+$/.test(firstWord) &&
      !/^(para|com|em|de|da|do|no|na|por|uma|este|essa)/i.test(firstWord)) {
    return firstWord;
  }
  return '';
}

/**
 * Extrai subcategoria baseada no título + categoria.
 */
function extractSubcategory(title, category) {
  const lower = (title || '').toLowerCase();
  const cats = SUBCATEGORIES[category];
  if (!cats) return 'geral';
  for (const sub of cats) {
    const pattern = new RegExp(sub.replace(/-/g, '[\\s-]?'), 'i');
    if (pattern.test(lower)) return sub;
  }
  // Heurística por categoria
  if (category === 'saude') {
    if (/vitamina|vitamin/i.test(lower)) return 'vitaminas';
    if (/proteína|proteina|whey/i.test(lower)) return 'proteínas';
    if (/creatina/i.test(lower)) return 'suplementos';
    if (/cápsula|capsula|softgel/i.test(lower)) return 'suplementos';
    return 'suplementos';
  }
  return 'geral';
}

/**
 * Extrai volume/unidade do título (ex: "300g", "1000mg", "60 cápsulas").
 */
function extractVolume(title) {
  if (!title) return '';
  // Procura padrões como "300g", "1000mg", "60 cápsulas", "1L", "500ml"
  const match = title.match(/(\d+[\s-]*(?:g|mg|ml|l|cápsulas|capsulas|comprimidos|tabletes|ui|kg|unidades))/i);
  return match ? match[1].trim() : '';
}

/**
 * Extrai fabricante do título + specs.
 */
function extractManufacturer(title, specs) {
  const brand = extractBrand(title);
  if (brand) return brand;
  // Tenta extrair de specs
  if (specs && specs.length > 0) {
    for (const spec of specs) {
      const m = spec.match(/\*\*[^*]*(?:fabricante|marca|laboratório|fabricado\s*por)[^*]*:\*\*\s*(.+)/i);
      if (m) return m[1].trim();
    }
  }
  return '';
}

/**
 * Extrai ingredientes ativos do título + specs.
 */
function extractActiveIngredients(specs, category) {
  const ingredients = [];
  if (!specs || specs.length === 0) return [];

  for (const spec of specs) {
    const lower = spec.toLowerCase();
    const patterns = ['ingrediente', 'composição', 'composicao', 'componente', 'ativo',
                       'dosagem', 'concentração', 'concentracao', 'fórmula', 'formula',
                       'cada\s*\d+\s*(g|ml|cápsula|capsula|comprimido)'];
    for (const p of patterns) {
      const re = new RegExp(`\\*\\*[^*]*(?:${p})[^*]*:\\*\\*\\s*(.+)`, 'i');
      const m = spec.match(re);
      if (m) {
        ingredients.push(m[1].trim());
        break;
      }
    }
  }
  return ingredients;
}

/**
 * Extrai dosagem do título (ex: "1000mg", "300mg").
 */
function extractDosage(title) {
  if (!title) return '';
  const match = title.match(/(\d+\s*(?:mg|g|ml|ui|cápsulas|capsulas|comprimidos))/i);
  return match ? match[1].trim().toLowerCase() : '';
}

/**
 * Constrói o objeto canônico do produto.
 * Qualquer fonte (Amazon, ML, Magalu) deve passar por aqui.
 */
export function buildCanonicalProduct(rawProduct) {
  if (!rawProduct) return null;

  const title = rawProduct.title || rawProduct.product_name || '';
  const category = rawProduct.category || 'default';
  const specs = rawProduct.specs || [];

  return {
    // Identificação
    asin: rawProduct.asin || rawProduct.id || '',
    brand: extractBrand(title),
    product_name: title,
    category: category.toLowerCase(),

    // Classificação
    subcategory: extractSubcategory(title, category),
    volume: extractVolume(title),
    manufacturer: extractManufacturer(title, specs),
    ean: rawProduct.ean || '',

    // Conteúdo técnico
    active_ingredients: extractActiveIngredients(specs, category),
    dosage: extractDosage(title),

    // Metadados
    market: 'Brasil',
    description: rawProduct.description || '',
    specs: specs,
    store: rawProduct.store || '',
    imageUrl: rawProduct.imageUrl || '',
    affiliateUrl: rawProduct.affiliateUrl || '',
    tags: rawProduct.tags || [],
    normalized: rawProduct.normalized || null,
  };
}
