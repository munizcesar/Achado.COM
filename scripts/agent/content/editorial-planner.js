#!/usr/bin/env node
/**
 * editorial-planner.js — Editorial Planner
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Este módulo NÃO escreve texto. Ele apenas planeja.
 *
 * Entrada: CanonicalProduct + Knowledge
 * Saída:   { intent, primary_keyword, secondary_keywords,
 *            sections, word_count, tone, cta }
 *
 * Define:
 * - Intenção de busca (informativa, comparativa, transacional)
 * - Palavra-chave principal e secundárias
 * - Seções do artigo
 * - Tom editorial
 * - CTA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);

// ── Seções padrão por categoria ─────────────────────────────────

const SECTION_TEMPLATES = {
  saude: [
    { id: 'intro',          label: 'Introdução',           default: true },
    { id: 'o_que_e',        label: 'O que é',              default: true },
    { id: 'beneficios',     label: 'Benefícios',            default: true },
    { id: 'como_funciona',  label: 'Como funciona',         default: false },
    { id: 'ingredientes',   label: 'Ingredientes ativos',   default: false },
    { id: 'como_usar',      label: 'Como usar',             default: true },
    { id: 'contraindicacoes', label: 'Contraindicações',    default: false },
    { id: 'comparativo',    label: 'Comparativo',           default: true },
    { id: 'faq',            label: 'FAQ',                   default: true },
    { id: 'conclusao',      label: 'Conclusão',             default: true },
  ],
  beleza: [
    { id: 'intro',          label: 'Introdução',           default: true },
    { id: 'o_que_e',        label: 'O que é',              default: true },
    { id: 'beneficios',     label: 'Benefícios',            default: true },
    { id: 'ingredientes',   label: 'Ingredientes',          default: false },
    { id: 'como_usar',      label: 'Como usar',             default: true },
    { id: 'para_quem',      label: 'Para quem é ideal',    default: false },
    { id: 'resultados',     label: 'Resultados esperados',  default: false },
    { id: 'comparativo',    label: 'Comparativo',           default: true },
    { id: 'faq',            label: 'FAQ',                   default: true },
    { id: 'conclusao',      label: 'Conclusão',             default: true },
  ],
  casa: [
    { id: 'intro',          label: 'Introdução',           default: true },
    { id: 'o_que_e',        label: 'O que é',              default: true },
    { id: 'diferenciais',   label: 'Principais diferenciais', default: true },
    { id: 'especificacoes', label: 'Especificações técnicas', default: false },
    { id: 'praticidade',    label: 'Praticidade no dia a dia', default: false },
    { id: 'comparativo',    label: 'Comparativo',           default: true },
    { id: 'faq',            label: 'FAQ',                   default: true },
    { id: 'conclusao',      label: 'Conclusão',             default: true },
  ],
  default: [
    { id: 'intro',          label: 'Introdução',           default: true },
    { id: 'o_que_e',        label: 'O que é',              default: true },
    { id: 'diferenciais',   label: 'Diferenciais',         default: true },
    { id: 'para_quem',      label: 'Para quem faz sentido', default: false },
    { id: 'comparativo',    label: 'Comparativo',           default: true },
    { id: 'faq',            label: 'FAQ',                   default: true },
    { id: 'conclusao',      label: 'Conclusão',             default: true },
  ],
};

// ── Intenções de busca por categoria ────────────────────────────

const SEARCH_INTENTS = {
  saude: 'informativa',
  beleza: 'informativa',
  casa: 'comparativa',
  tech: 'comparativa',
  esportes: 'informativa',
  automotivo: 'transacional',
  default: 'informativa',
};

// ── TONS editoriais por categoria ───────────────────────────────

const TONES = {
  saude: 'técnico-informativo',
  beleza: 'editorial-curador',
  casa: 'prático-funcional',
  tech: 'analítico-didático',
  esportes: 'motivacional-técnico',
  automotivo: 'técnico-diretivo',
  default: 'editorial',
};

/**
 * Gera palavra-chave principal a partir do nome do produto.
 */
function generatePrimaryKeyword(productName, category) {
  const name = (productName || '').toLowerCase();
  // Remove marca do início se presente (ex: "Growth Creatina" → "Creatina")
  const withoutBrand = name.replace(/^(growth|max titanium|integralmédica|integralmedica|probiotica|now foods|vitafor|salus|natura|avon|eudora|o boticário|boticário|l'oreal|loreal|pantene|nivea|philips|mondial|arno|tramontina|electrolux|lg|samsung|sony|xiaomi|acer|lenovo|dell|hp|apple|motorola)\s+/i, '');
  return withoutBrand.slice(0, 60);
}

/**
 * Gera keywords secundárias baseadas na categoria.
 */
function generateSecondaryKeywords(productName, category) {
  const keywords = [category];
  const lower = (productName || '').toLowerCase();

  if (category === 'saude') {
    keywords.push('suplemento', `melhor ${category}`, `${category} bem-estar`);
    if (/vitamina/.test(lower)) keywords.push('vitamina', 'suplementação');
    if (/whey|proteína|proteina/.test(lower)) keywords.push('proteína', 'musculação');
    if (/creatina/.test(lower)) keywords.push('creatina', 'força', 'performance');
    if (/cápsula|capsula/.test(lower)) keywords.push('cápsulas', 'suplemento em cápsulas');
  } else if (category === 'beleza') {
    keywords.push('cosmético', `produto de ${category}`, `cuidados com a ${category}`);
    if (/shampoo/.test(lower)) keywords.push('shampoo', 'cabelo', 'higiene capilar');
    if (/protetor/.test(lower)) keywords.push('protetor solar', 'fps', 'pele');
    if (/perfume|colônia|colonia/.test(lower)) keywords.push('perfume', 'fragrância');
  } else if (category === 'casa') {
    keywords.push('casa', 'lar', 'praticidade');
    if (/air.?fryer|fritadeira/.test(lower)) keywords.push('air fryer', 'fritadeira elétrica');
    if (/cafeteira/.test(lower)) keywords.push('cafeteira', 'café');
  }

  return [...new Set(keywords)].slice(0, 5);
}

/**
 * Seleciona seções para o artigo baseadas no produto e conhecimento.
 */
function selectSections(canonicalProduct, knowledge) {
  const templates = SECTION_TEMPLATES[canonicalProduct.category] || SECTION_TEMPLATES.default;

  // Começa com as seções padrão
  const sections = templates.filter(s => s.default).map(s => ({
    id: s.id,
    label: s.label,
    word_count: estimateSectionWords(s.id, canonicalProduct.category),
    has_ingredients: !!(
      (canonicalProduct.active_ingredients && canonicalProduct.active_ingredients.length > 0) ||
      (knowledge && knowledge.scientific_names && knowledge.scientific_names.length > 0)
    ),
  }));

  // Adiciona seções extras baseadas no produto
  if (canonicalProduct.active_ingredients && canonicalProduct.active_ingredients.length > 0) {
    addSectionIfMissing(sections, 'ingredientes', 'Ingredientes ativos', 150);
  }
  if (knowledge && knowledge.mechanisms && knowledge.mechanisms.length > 0) {
    addSectionIfMissing(sections, 'como_funciona', 'Como funciona', 200);
  }
  if (knowledge && knowledge.contraindications && knowledge.contraindications.length > 0) {
    addSectionIfMissing(sections, 'contraindicacoes', 'Contraindicações', 120);
  }

  return sections;
}

function addSectionIfMissing(sections, id, label, wordCount) {
  if (!sections.find(s => s.id === id)) {
    sections.push({ id, label, word_count: wordCount, has_ingredients: false });
  }
}

/**
 * Estima contagem de palavras por seção.
 */
function estimateSectionWords(sectionId, category) {
  const wordMap = {
    intro: 120,
    o_que_e: 150,
    beneficios: 250,
    como_funciona: 200,
    ingredientes: 150,
    como_usar: 120,
    contraindicacoes: 100,
    comparativo: 250,
    faq: 300,
    conclusao: 100,
    diferenciais: 200,
    especificacoes: 180,
    praticidade: 150,
    para_quem: 120,
    resultados: 150,
  };
  return wordMap[sectionId] || 150;
}

/**
 * Gera descrição meta para SEO.
 */
function generateMetaDescription(productName, primaryKeyword, sections) {
  const name = productName ? productName.split(' ').slice(0, 6).join(' ') : 'produto';
  const sectionLabels = sections.filter(s => s.id !== 'intro' && s.id !== 'conclusao')
    .slice(0, 3).map(s => s.label.toLowerCase()).join(', ');
  return `Análise completa do ${name}. ${sectionLabels}. Descubra se vale a pena e para quem é ideal.`;
}

/**
 * Planeja a estratégia editorial do artigo.
 * NÃO escreve conteúdo — apenas define o plano.
 */
export function createEditorialPlan(canonicalProduct, knowledge) {
  if (!canonicalProduct) return null;

  const productName = canonicalProduct.product_name;
  const category = canonicalProduct.category || 'default';

  const primaryKeyword = generatePrimaryKeyword(productName, category);
  const secondaryKeywords = generateSecondaryKeywords(productName, category);
  const sections = selectSections(canonicalProduct, knowledge);
  const intent = SEARCH_INTENTS[category] || SEARCH_INTENTS.default;
  const tone = TONES[category] || TONES.default;

  const totalWords = sections.reduce((sum, s) => sum + s.word_count, 0);

  return {
    // Estratégia de busca
    intent,
    primary_keyword: primaryKeyword,
    secondary_keywords: secondaryKeywords,

    // Estrutura editorial
    sections,
    word_count: Math.max(1200, Math.min(2500, totalWords)),

    // Tom e estilo
    tone,
    cta_hint: category === 'saude' ? 'Consultar ofertas' :
              category === 'beleza' ? 'Conferir na loja' :
              category === 'casa' ? 'Ver produtos similares' : 'Verificar disponibilidade',

    // Meta
    meta_description: generateMetaDescription(productName, primaryKeyword, sections),

    // Flags para geração
    has_knowledge: !!(knowledge && knowledge.benefits && knowledge.benefits.length > 0),
  };
}
