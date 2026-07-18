#!/usr/bin/env node
/**
 * loader.js — Carregador de Catálogo Versionado
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Lê os catálogos de arquivos JSON em catalog/.
 * Fornece produtos com score, prioridade e data da última publicação.
 *
 * Uso:
 *   const produtos = loadCatalog('beleza');
 *   const pool = buildCatalogPool(history); // ordenado por score + prioridade
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const CATALOG_DIR = path.resolve(__dirname);

// Score minimo para um produto ser considerado viavel para publicacao.
// Produtos com score < MINIMUM_SCORE tem baixa relevancia/demanda e sao descartados.
const MINIMUM_SCORE = 85;

const ANGLES = {
  skincare_basico:      'O básico que transforma: por que este produto entrou na rotina de tanta gente',
  cuidado_diario:       'A proteção diária que você não pode negligenciar',
  cuidado_capilar:      'O segredo dos cabelos saudáveis que poucos conhecem',
  anti_idade:           'Ingrediente ativo que age de verdade contra o envelhecimento precoce',
  limpeza_pele:         'Pele limpa é pele saudável: o ritual que muda tudo',
  ingrediente_ativo:    'Como um único ingrediente mudou a rotina de skincare de milhares de pessoas',
  custo_beneficio:      'Custo-benefício real: vale cada centavo investir neste produto',
  saude_preventiva:     'O hábito simples que faz diferença na sua saúde a longo prazo',
  bem_estar:            'Pequenas mudanças, grandes resultados no bem-estar diário',
  performance:          'Para quem leva a sério os resultados: o que este produto entrega',
  imunidade:            'Imunidade forte começa com suplementação inteligente',
  qualidade_sono:       'O sono que você merece começa com a suplementação certa',
  saude_intestinal:     'Saúde começa no intestino: o que a ciência diz sobre probióticos',
  praticidade_cozinha:  'Menos tempo na cozinha, mais tempo para o que importa',
  praticidade_casa:     'A tecnologia que trabalha por você enquanto você descansa',
  ritual_diario:        'O ritual que começa o dia com o pé direito',
  saude_em_casa:        'Um investimento pequeno que protege toda a família',
  bem_estar_em_casa:    'Transformar o ambiente em que você vive transforma como você se sente',
};

const PILLAR_FILES = {
  beleza: 'beleza.json',
  saude:  'saude.json',
  casa:   'casa.json',
};

/**
 * Carrega o catálogo de um pilar.
 * @param {string} pillar - 'beleza' | 'saude' | 'casa'
 * @returns {Array} produtos do catálogo
 */
export function loadCatalog(pillar) {
  const filename = PILLAR_FILES[pillar];
  if (!filename) return [];

  const filepath = path.join(CATALOG_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf8');
      const products = JSON.parse(raw);
      const filtered = products
        .filter(p => p.ativo !== false)
        .filter(p => (p.score || 0) >= MINIMUM_SCORE)
        .map(p => ({
          asin:     p.asin,
          name:     p.nome,
          category: pillar,
          angle:    p.angle || 'custo_beneficio',
          priority: p.prioridade || 5,
          score:    p.score || 80,
          lastPublished: p.ultimaPublicacao || null,
        }));
      
      if (filtered.length < products.filter(p => p.ativo !== false).length) {
        const removed = products.filter(p => p.ativo !== false && (p.score || 0) < MINIMUM_SCORE);
        console.log(`   📊 ${removed.length} produto(s) com score < ${MINIMUM_SCORE} removido(s) do pilar "${pillar}"`);
        removed.forEach(p => console.log(`      ${p.nome || p.asin} (score: ${p.score || 'N/A'})`));
      }
      
      return filtered;
    }
  } catch (err) {
    console.error(`   ⚠️  Erro ao carregar catálogo ${pillar}: ${err.message}`);
  }

  return [];
}

/**
 * Constrói pool priorizado do catálogo.
 * Ordena por: ativo > score (decrescente) > prioridade (decrescente).
 * Exclui produtos postados nos últimos N dias.
 *
 * @param {string} pillar
 * @param {Array} history - histórico de posts
 * @param {number} days - janela de exclusão (default: 7)
 * @returns {Array} pool ordenado
 */
export function buildCatalogPool(pillar, history = [], days = 7) {
  const catalog = loadCatalog(pillar);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // ASINs postados recentemente
  const recentAsins = new Set(
    history
      .filter(h => new Date(h.postedAt).getTime() > cutoff)
      .map(h => h.asin)
  );

  // Filtra produtos não postados recentemente
  const available = catalog.filter(p => !recentAsins.has(p.asin));

  // Ordena por score (maior primeiro), depois prioridade
  available.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.priority || 0) - (a.priority || 0));

  return available;
}

/**
 * Retorna todos os produtos do catálogo (ignorando histórico).
 */
export function getAllCatalog() {
  const all = [];
  for (const pillar of Object.keys(PILLAR_FILES)) {
    all.push(...loadCatalog(pillar));
  }
  return all;
}

/**
 * Retorna o descritivo do ângulo.
 */
export function getAngleDescription(angle) {
  return ANGLES[angle] || angle;
}
