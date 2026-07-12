#!/usr/bin/env node
/**
 * knowledge-builder.js — Knowledge Builder com RAG Editorial
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Enriquece o produto canônico com conhecimento externo:
 * - Serper.dev para contexto de mercado
 * - Benefícios, contraindicações, nomes científicos
 * - Cache persistente para evitar repetição
 *
 * Entrada: CanonicalProduct
 * Saída:   { benefits, contraindications, scientific_names,
 *            mechanisms, faq, entities, sources }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buscarContextoProduto } from '../../serper-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '..', '..', '..', 'data', 'cache-knowledge');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// ── Cache ───────────────────────────────────────────────────────

function getCachePath(key) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const safeKey = key.replace(/[^a-z0-9]/gi, '_').slice(0, 100);
  return path.join(CACHE_DIR, `${safeKey}.json`);
}

function loadCache(key) {
  try {
    const cp = getCachePath(key);
    if (fs.existsSync(cp)) {
      const data = JSON.parse(fs.readFileSync(cp, 'utf8'));
      if (Date.now() - data.ts < CACHE_TTL_MS) {
        return data.knowledge;
      }
    }
  } catch (_) {}
  return null;
}

function saveCache(key, knowledge) {
  try {
    const cp = getCachePath(key);
    fs.writeFileSync(cp, JSON.stringify({ ts: Date.now(), knowledge }, null, 2));
  } catch (_) {}
}

// ── Knowledge Base por ingrediente/categoria ──────────────────────
// Conhecimento curado manualmente para termos recorrentes.
// Isso economiza chamadas Serper e garante precisão.

const KNOWLEDGE_BASE = {
  'creatina': {
    scientific_names: ['Creatina Monohidratada', 'Creatina Etílica'],
    mechanisms: ['Aumenta a regeneração de ATP nas células musculares',
                 'Melhora a performance em exercícios de alta intensidade'],
    benefits: ['Aumento de força', 'Melhora na recuperação muscular',
               'Aumento de massa magra', 'Melhora cognitiva em idosos'],
    contraindications: ['Doenças renais preexistentes (consultar médico)'],
  },
  'whey protein': {
    scientific_names: ['Whey Protein Concentrado', 'Whey Protein Isolado', 'Whey Protein Hidrolisado'],
    mechanisms: ['Fonte de aminoácidos de rápida absorção',
                 'Estimula a síntese proteica muscular'],
    benefits: ['Recuperação muscular pós-treino', 'Aumento de massa muscular',
               'Saciedade', 'Fonte de aminoácidos essenciais'],
    contraindications: ['Intolerância à lactose (preferir isolado ou hidrolisado)'],
  },
  'omega 3': {
    scientific_names: ['Ácido Eicosapentaenoico (EPA)', 'Ácido Docosahexaenoico (DHA)'],
    mechanisms: ['Ação anti-inflamatória sistêmica',
                 'Suporte à saúde cardiovascular e neurológica'],
    benefits: ['Saúde cardiovascular', 'Função cognitiva', 'Saúde articular',
               'Ação anti-inflamatória'],
    contraindications: ['Anticoagulantes (consultar médico)'],
  },
  'colágeno': {
    scientific_names: ['Colágeno Hidrolisado Tipo I', 'Colágeno Tipo II'],
    mechanisms: ['Fornece aminoácidos para síntese de colágeno endógeno',
                 'Suporte à saúde articular e da pele'],
    benefits: ['Saúde da pele e unhas', 'Saúde articular',
               'Fortalece cabelos', 'Recuperação pós-exercício'],
    contraindications: [],
  },
  'vitamina': {
    scientific_names: [],
    mechanisms: ['Atua como cofator em reações metabólicas essenciais'],
    benefits: ['Suporte ao sistema imunológico', 'Saúde metabólica'],
    contraindications: ['Respeitar dosagem diária recomendada'],
  },
  'probiótico': {
    scientific_names: ['Lactobacillus', 'Bifidobacterium', 'Saccharomyces boulardii'],
    mechanisms: ['Modulação da microbiota intestinal',
                 'Competição com patógenos no trato intestinal'],
    benefits: ['Saúde digestiva', 'Fortalecimento imunológico',
               'Regularidade intestinal'],
    contraindications: ['Imunossuprimidos (consultar médico)'],
  },
};

// ── Heurísticas de categoria ────────────────────────────────────

const CATEGORY_KNOWLEDGE = {
  saude: {
    entities: ['biodisponibilidade', 'absorção', 'metabolismo',
               'aminoácidos essenciais', 'suplementação', 'dosagem',
               'eficácia', 'estudo clínico'],
    default_benefits: ['Suplementação nutricional', 'Saúde e bem-estar',
                        'Performance física'],
    default_faq: [
      { q: 'Como tomar?', a: 'Siga a dosagem recomendada na embalagem.' },
      { q: 'Tem efeitos colaterais?', a: 'Geralmente bem tolerado, mas consulte um médico.' },
    ],
  },
  beleza: {
    entities: ['barreira cutânea', 'hidratação', 'textura',
               'ingrediente ativo', 'fotoproteção', 'antioxidante'],
    default_benefits: ['Cuidados com a pele', 'Hidratação intensiva',
                        'Proteção contra danos externos'],
    default_faq: [
      { q: 'Qual o tipo de pele ideal?', a: 'Varía conforme o produto.' },
      { q: 'Pode usar todo dia?', a: 'Sim, salvo contraindicação específica.' },
    ],
  },
  casa: {
    entities: ['praticidade', 'durabilidade', 'eficiência',
               'consumo energético', 'capacidade'],
    default_benefits: ['Praticidade no dia a dia', 'Economia de tempo',
                        'Qualidade e durabilidade'],
    default_faq: [
      { q: 'É fácil de instalar?', a: 'Geralmente sim, seguindo o manual.' },
      { q: 'Qual a garantia?', a: 'Consulte a página do produto.' },
    ],
  },
};

/**
 * Busca conhecimento para um ingrediente específico na base local.
 */
function lookupIngredient(title, category) {
  const lower = (title || '').toLowerCase();

  // Busca por ingrediente conhecido
  for (const [ingredient, data] of Object.entries(KNOWLEDGE_BASE)) {
    if (lower.includes(ingredient)) return data;
  }

  // Fallback para categoria
  const catData = CATEGORY_KNOWLEDGE[category];
  if (catData) {
    return {
      scientific_names: [],
      mechanisms: [],
      benefits: catData.default_benefits,
      contraindications: [],
    };
  }

  return {
    scientific_names: [],
    mechanisms: [],
    benefits: ['Produto de qualidade para uso diário'],
    contraindications: [],
  };
}

/**
 * Constrói conhecimento enriquecido do produto.
 */
export async function buildKnowledge(canonicalProduct) {
  if (!canonicalProduct) return null;

  const cacheKey = `${canonicalProduct.product_name}_${canonicalProduct.category}`;
  const cached = loadCache(cacheKey);
  if (cached) {
    console.log(`   🧠 Knowledge: usando cache para "${canonicalProduct.product_name.slice(0, 50)}..."`);
    return cached;
  }

  console.log(`   🧠 Knowledge: construindo para "${canonicalProduct.product_name.slice(0, 50)}..."`);

  // 1. Conhecimento base (ingredientes + categoria)
  const base = lookupIngredient(canonicalProduct.product_name, canonicalProduct.category);

  // 2. Se Serper estiver disponível, busca contexto externo
  let serperContext = null;
  try {
    const serperKey = process.env.SERPER_API_KEY;
    if (serperKey && serperKey !== 'sua-key-serper-aqui') {
      serperContext = await buscarContextoProduto(
        canonicalProduct.product_name,
        canonicalProduct.category,
        serperKey
      );
    }
  } catch (_) {
    // Fallback silencioso
  }

  // 3. Entidades semânticas da categoria
  const catData = CATEGORY_KNOWLEDGE[canonicalProduct.category];
  const entities = catData ? [...catData.entities] : [];
  if (canonicalProduct.active_ingredients && canonicalProduct.active_ingredients.length > 0) {
    entities.push(...canonicalProduct.active_ingredients.map(i => i.toLowerCase()));
  }

  // 4. FAQ Candidates
  const faqCandidates = [];
  if (catData) faqCandidates.push(...catData.default_faq);
  if (canonicalProduct.product_name) {
    faqCandidates.push({
      q: `${canonicalProduct.product_name.split(' ').slice(0, 4).join(' ')} funciona?`,
      a: 'Os resultados variam conforme o perfil de uso e consistência.',
    });
  }

  // 5. Monta resultado
  const knowledge = {
    benefits: base.benefits,
    contraindications: base.contraindications,
    scientific_names: base.scientific_names,
    mechanisms: base.mechanisms,
    faq: faqCandidates,
    entities: [...new Set(entities)],
    sources: serperContext
      ? [{ type: 'serper', data: serperContext }]
      : [],
  };

  // Salva cache
  saveCache(cacheKey, knowledge);

  console.log(`   🧠 Knowledge: ${knowledge.benefits.length} benefícios, ${knowledge.entities.length} entidades`);
  return knowledge;
}
