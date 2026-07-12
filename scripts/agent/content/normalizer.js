#!/usr/bin/env node
/**
 * normalizer.js — Normalizador de Dados do Produto
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Transforma dados brutos da Amazon em um objeto estruturado
 * que o Groq pode usar para gerar conteúdo editorial de qualidade.
 *
 * Entrada: { title, description, category, tags, specs, store }
 * Saída:   { nome, marca, categoria, ingredientes, beneficios,
 *            publico_alvo, diferenciais, cuidados, faq_sugerido }
 */

/**
 * Extrai marca do título do produto (geralmente primeira palavra de destaque).
 */
function extractBrand(title) {
  if (!title) return '';
  // Marcas conhecidas em maiúsculo ou misto
  const knownBrands = [
    'Integralmédica', 'Integralmedica', 'Growth', 'Max Titanium', 'Max',
    'Probiotica', 'Now Foods', 'Now', 'Optimum Nutrition', 'ON',
    'Universal', 'MuscleTech', 'BSN', 'Dymatize', 'Bodybuilders',
    'Darkness', 'Atlhetica', 'Synthec', 'Neo Nutri', 'Essential Nutrition',
    'Vitafor', 'Salus', 'Sundown', 'Lavitan', 'Centrum', 'Natura',
    'Avon', 'Eudora', 'O Boticário', 'Boticário', 'L\'Oréal', 'Loreal',
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
  const found = knownBrands.find(b => new RegExp(`\\b${b}\\b`, 'i').test(title));
  if (found) return found;
  // Heurística: primeira palavra >= 4 chars (se não for artigo/número)
  const firstWord = title.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 4 && !/^\d+$/.test(firstWord) && !/^(para|com|em|de|da|do|no|na|por|uma|este|essa)/i.test(firstWord)) {
    return firstWord;
  }
  return '';
}

/**
 * Extrai ingredientes/componentes das especificações.
 */
function extractIngredients(specs, category) {
  const ingredients = [];
  if (!specs || specs.length === 0) return [];

  for (const spec of specs) {
    const lower = spec.toLowerCase();
    if (category === 'saude') {
      const ingMatch = spec.match(/\*\*[^*]*(?:ingrediente|composição|composicao|componente|ativo|dosagem|concentração|concentracao)[^*]*:\*\*\s*(.+)/i);
      if (ingMatch) ingredients.push(ingMatch[1].trim());
    } else if (category === 'beleza') {
      const ingMatch = spec.match(/\*\*[^*]*(?:ingrediente|ativo|composição|composicao|fórmula|formula)[^*]*:\*\*\s*(.+)/i);
      if (ingMatch) ingredients.push(ingMatch[1].trim());
    } else {
      const matMatch = spec.match(/\*\*[^:]*material[^:]*:\*\*\s*(.+)/i);
      if (matMatch) ingredients.push(matMatch[1].trim());
    }
  }
  return ingredients;
}

/**
 * Extrai benefícios potenciais do título + specs.
 */
function extractBenefits(title, specs, category) {
  const benefits = [];
  const lower = (title || '').toLowerCase();
  const specsText = (specs || []).join(' ').toLowerCase();

  const benefitMap = {
    saude: [
      { keyword: /vitamina|nutriente|mineral/i, benefit: 'Suplementação nutricional' },
      { keyword: /imunidade|imune|defesas/i, benefit: 'Fortalecimento do sistema imunológico' },
      { keyword: /energia|disposição|disposicao/i, benefit: 'Mais energia e disposição no dia a dia' },
      { keyword: /músculo|musculo|massa|hipertrofia/i, benefit: 'Ganho e recuperação muscular' },
      { keyword: /sono|melatonina|dormir/i, benefit: 'Melhora da qualidade do sono' },
      { keyword: /pele|cabelo|unha/i, benefit: 'Saúde da pele, cabelos e unhas' },
      { keyword: /digestão|digestao|intestino|probiótico|probiotico/i, benefit: 'Saúde intestinal e digestão' },
      { keyword: /articulação|articulacao|juntas|flexibilidade/i, benefit: 'Saúde das articulações' },
      { keyword: /antioxidante|radicais livres/i, benefit: 'Ação antioxidante contra radicais livres' },
    ],
    beleza: [
      { keyword: /hidratação|hidratacao|hidratante/i, benefit: 'Hidratação profunda da pele/cabelo' },
      { keyword: /anti.?idade|rugas|envelhecimento/i, benefit: 'Combate aos sinais de envelhecimento' },
      { keyword: /proteção|protecao|fps|solar/i, benefit: 'Proteção contra danos externos' },
      { keyword: /limpeza|micelar|demaquilante/i, benefit: 'Limpeza suave e eficaz' },
      { keyword: /fortalecimento|queda|antiqueda/i, benefit: 'Fortalecimento dos fios' },
      { keyword: /volume|brilho|reconstrução|reconstrucao/i, benefit: 'Recuperação da vitalidade capilar' },
    ],
    casa: [
      { keyword: /praticidade|prático|pratico|fácil|facil|rápido|rapido/i, benefit: 'Praticidade e agilidade no uso' },
      { keyword: /econômico|economico|economia|energia/i, benefit: 'Economia de energia e recursos' },
      { keyword: /silencioso|ruído|barulho/i, benefit: 'Funcionamento silencioso' },
      { keyword: /capacidade|grande|amplo/i, benefit: 'Ótima capacidade para uso familiar' },
      { keyword: /durável|duravel|resistente|resistência|resistencia/i, benefit: 'Alta durabilidade e resistência' },
    ],
  };

  const categoryBenefits = benefitMap[category] || benefitMap.saude;
  for (const b of categoryBenefits) {
    if (b.keyword.test(lower) || b.keyword.test(specsText)) {
      if (!benefits.includes(b.benefit)) benefits.push(b.benefit);
    }
  }
  return benefits;
}

/**
 * Determina público-alvo com base na categoria.
 */
function extractTargetAudience(category, title) {
  const lower = (title || '').toLowerCase();
  const audiences = [];

  if (/masculino|male|men|man\b/.test(lower)) audiences.push('Público masculino');
  if (/feminino|female|women|woman\b/.test(lower)) audiences.push('Público feminino');
  if (/infantil|criança|crianca|kids|baby|bebê|bebe/.test(lower)) audiences.push('Crianças');
  if (/profissional|pro\b|salão|salao|uso profissional/i.test(lower)) audiences.push('Profissionais do setor');
  if (/iniciante|iniciantes|começando|comecando/.test(lower)) audiences.push('Iniciantes');

  const defaultAudiences = {
    saude: 'Adultos que buscam suplementação para saúde e bem-estar',
    beleza: 'Pessoas que cuidam da aparência e bem-estar pessoal',
    casa: 'Quem busca praticidade e qualidade no dia a dia doméstico',
    default: 'Consumidores que valorizam qualidade e custo-benefício',
  };

  if (audiences.length === 0) {
    audiences.push(defaultAudiences[category] || defaultAudiences.default);
  }
  return audiences;
}

/**
 * Gera sugestões de FAQ baseadas no produto.
 */
function generateSuggestedFAQ(title, category) {
  const name = title ? title.split(' ').slice(0, 4).join(' ') : 'Este produto';
  const faqs = [
    { pergunta: `${name} é bom?`, resposta: `Depende do seu perfil e do que você busca, mas as características dele são consistentes com a proposta da categoria.` },
    { pergunta: `Para que serve ${name}?`, resposta: `O produto foi desenvolvido para atender necessidades específicas dentro da categoria ${category}.` },
    { pergunta: `Vale a pena comprar ${name}?`, resposta: `Faz sentido principalmente se as características dele se alinham com seu perfil de uso.` },
    { pergunta: `Quanto tempo dura ${name}?`, resposta: `Isso depende da frequência de uso, mas a composição segue padrões de mercado.` },
    { pergunta: `Qual a diferença entre ${name} e outras opções?`, resposta: `O diferencial está na combinação de características que poucos concorrentes oferecem juntas.` },
  ];
  return faqs;
}

/**
 * Normaliza dados do produto para formato estruturado.
 */
export function normalizeProductData(product) {
  if (!product) return null;

  const category = product.category || 'default';

  return {
    nome_oficial: product.title || '',
    marca: extractBrand(product.title || ''),
    categoria: category,
    descricao: product.description || '',
    especificacoes: product.specs || [],
    ingredientes: extractIngredients(product.specs, category),
    beneficios: extractBenefits(product.title, product.specs, category),
    publico_alvo: extractTargetAudience(category, product.title),
    cuidados: [],  // Preenchido por dados da Amazon ou heurística
    faq_sugerido: generateSuggestedFAQ(product.title, category),
    loja: product.store || 'Amazon',
    url_afiliado: product.affiliateUrl || '',
  };
}
