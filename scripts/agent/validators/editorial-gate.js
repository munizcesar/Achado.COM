#!/usr/bin/env node
/**
 * editorial-gate.js — AI Content Quality Gate + Editorial Score v2
 * AchadoCerto.VIP — Agente Autônomo
 *
 * 1. AI CONTENT QUALITY GATE:
 *    - HTML/CSS/JS garbage detection (20+ patterns)
 *    - Placeholder phrases (15+ patterns)
 *    - Generic filler phrases (25+ patterns)
 *    - Semantic repetition detection (Jaccard similarity between paragraphs)
 *
 * 2. EDITORIAL SCORE (0-50):
 *    - Originalidade: texto original vs reescrito
 *    - Naturalidade: fluxo humano vs robótico
 *    - SEO: palavras-chave, entidades, estrutura
 *    - Legibilidade: parágrafos variados, FAQ, CTA
 *    - Especialização: profundidade técnica do nicho
 *    Threshold: 45/50
 *
 * 3. STRUCTURED FEEDBACK:
 *    Gera relatório de melhorias específicas para o rewrite loop
 */

// ── HTML/CSS/JS GARBAGE (20+ patterns) ─────────────────────────
const GARBAGE_PATTERNS = [
  /aplus-/i, /padding[-:\s]/i, /margin[-:\s]/i,
  /display\s*:\s*(flex|block|grid|inline)/i,
  /font-size/i, /class\s*=\s*["']/i, /style\s*=\s*["']/i,
  /<div/i, /<span/i, /<[a-z]+[^>]*>/i,
  /logShoppableMetrics/i, /celwidget/i, /data-\w+=/i,
  /\.a-spacing/i, /\.a-section/i, /\.a-row/i, /\.a-column/i,
  /#aplus/i, /Amazon\s+A\+\s*Content/i,
  /\.a-price/i, /\.a-text/i, /\.a-size/i, /\.a-link/i,
  /\.a-button/i, /\.a-list/i, /\.a-box/i,
];

// ── PLACEHOLDER PHRASES (15+ patterns) ─────────────────────────
const PLACEHOLDER_PATTERNS = [
  /O resumo do produto apresenta/i,
  /Este produto oferece/i,
  /Produto de alta qualidade/i,
  /Excelente escolha/i,
  /Muito bom, recomendo/i,
  /Vale cada centavo/i,
  /Entregou o que promete/i,
  /Atendeu minhas expectativas/i,
  /Produto excelente/i,
  /Custo-benefício incrível/i,
  /Não tenho do que reclamar/i,
  /Produto nota \d+/i,
  /Recomendo para todos/i,
  /Simplesmente incrível/i,
  /Simplesmente maravilhoso/i,
  /O produto é muito bom/i,
  /Atendeu às necessidades/i,
];

// ── GENERIC FILLER PHRASES (25+ patterns) ─────────────────────
const FILLER_PATTERNS = [
  /É importante considerar/i,
  /É importante destacar/i,
  /Vale ressaltar/i,
  /Ao analisar/i,
  /Vale destacar/i,
  /Quando se trata de/i,
  /No mercado atual/i,
  /Solução abrangente/i,
  /Pode fazer diferença/i,
  /Isso o torna/i,
  /Nesse contexto/i,
  /Pensando nisso/i,
  /Não faltam opções/i,
  /Cada vez mais/i,
  /Usuários que buscam/i,
  /proposta inovadora/i,
  /produto revolucionário/i,
  /Em conclusão/i,
  /De maneira geral/i,
  /Foi desenvolvido para/i,
  /Possui design moderno/i,
  /Atende às necessidades/i,
  /Com certeza/i,
  /Sem dúvida alguma/i,
  /Pode ser uma boa opção/i,
  /É uma escolha interessante/i,
  /Não poderia ser diferente/i,
  /Vale mencionar/i,
  /Um dos melhores/i,
  /Com toda certeza/i,
];

/**
 * Detecta repetição semântica entre parágrafos.
 * Usa similaridade de Jaccard nos conjuntos de palavras.
 * Retorna { hasRepetition, similarPairs[], score }
 */
function detectSemanticRepetition(markdown) {
  const paragraphs = markdown
    .split(/\n\n+/)
    .filter(p => p.trim().length > 50 && !p.trim().startsWith('---') && !p.trim().startsWith('#'));

  if (paragraphs.length < 3) {
    return { hasRepetition: false, similarPairs: [], score: 10 };
  }

  const similarPairs = [];
  let totalSimilarity = 0;
  let pairCount = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      const wordsA = new Set(paragraphs[i].toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const wordsB = new Set(paragraphs[j].toLowerCase().split(/\s+/).filter(w => w.length > 3));

      if (wordsA.size < 5 || wordsB.size < 5) continue;

      const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
      const union = new Set([...wordsA, ...wordsB]);
      const jaccard = intersection.size / union.size;

      totalSimilarity += jaccard;
      pairCount++;

      if (jaccard > 0.35) {
        similarPairs.push({ i, j, similarity: Math.round(jaccard * 100) });
      }
    }
  }

  // Score: 10 = sem repetição, 0 = altamente repetitivo
  const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
  const score = Math.max(0, Math.min(10, 10 - Math.round(avgSimilarity * 20)));

  return {
    hasRepetition: similarPairs.length > 0,
    similarPairs,
    score,
    avgSimilarity: Math.round(avgSimilarity * 100),
  };
}

/**
 * Gera relatório de melhorias estruturado para o rewrite loop.
 */
export function generateImprovementReport(markdown, editorialScore, qualityGate) {
  const improvements = [];

  if (qualityGate.errors.length > 0) {
    improvements.push(`Remover conteúdo genérico: ${qualityGate.errors.join('; ')}`);
  }

  const dims = editorialScore.dimensions;
  if (dims.originalidade && dims.originalidade.score < 7) {
    improvements.push('Substituir abertura genérica por um gancho editorial original');
    improvements.push('Escrever cada frase com palavras próprias, sem recorrer a chavões');
  }
  if (dims.naturalidade && dims.naturalidade.score < 7) {
    improvements.push('Variar mais o tamanho dos parágrafos (alguns curtos, outros médios)');
    improvements.push('Evitar frases muito longas; quebrar em períodos menores');
  }
  if (dims.seo && dims.seo.score < 7) {
    improvements.push('Inserir a palavra-chave principal no H1 e no primeiro parágrafo');
    improvements.push('Adicionar H2 sobre benefícios e diferenciais do produto');
    improvements.push('Incluir termos técnicos da categoria (entidades semânticas)');
  }
  if (dims.especializacao && dims.especializacao.score < 7) {
    improvements.push('Aprofundar os diferenciais técnicos do produto');
    improvements.push('Adicionar comparação com alternativas da mesma categoria');
    improvements.push('Incluir especificações técnicas detalhadas');
  }
  if (dims.legibilidade && dims.legibilidade.score < 7) {
    improvements.push('Adicionar seção de perguntas frequentes (FAQ)');
    improvements.push('Garantir que o texto tenha call-to-action natural no final');
  }

  // Detecta repetição semântica
  const repetition = detectSemanticRepetition(markdown);
  if (repetition.hasRepetition) {
    improvements.push(`Evitar repetição de conteúdo: ${repetition.similarPairs.length} pares de parágrafos similares detectados`);
  }

  return {
    improvements,
    repetition,
    editorialFeedback: {
      dimensions: dims,
      score: editorialScore.score,
      needed: 45 - editorialScore.score,
    },
  };
}

/**
 * Executa o AI Content Quality Gate (v2).
 */
export function runAIContentQualityGate(markdown) {
  const errors = [];
  const warnings = [];

  if (!markdown || markdown.length < 100) {
    return { pass: false, errors: ['Conteúdo vazio ou muito curto'], warnings: [] };
  }

  // 1. HTML/CSS/JS garbage
  for (const pattern of GARBAGE_PATTERNS) {
    if (pattern.test(markdown)) {
      errors.push(`Conteúdo contém código: ${pattern.source.slice(0, 40)}`);
      break;
    }
  }

  // 2. Placeholders
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(markdown)) {
      errors.push(`Placeholder detectado: "${pattern.source.slice(0, 50)}"`);
      break;
    }
  }

  // 3. Filler genérico
  let fillerCount = 0;
  const fillerFound = [];
  for (const pattern of FILLER_PATTERNS) {
    if (pattern.test(markdown)) {
      fillerCount++;
      if (fillerFound.length < 5) fillerFound.push(pattern.source.slice(0, 40));
    }
  }
  if (fillerCount > 0) {
    warnings.push(`${fillerCount} frase(s) genérica(s): ${fillerFound.join(', ')}`);
  }
  if (fillerCount > 3) {
    errors.push(`Excesso de frases genéricas: ${fillerCount} encontradas`);
  }

  // 4. Repetição semântica
  const repetition = detectSemanticRepetition(markdown);
  if (repetition.hasRepetition) {
    warnings.push(`Repetição semântica: ${repetition.similarPairs.length} pares similares (Jaccard >35%)`);
  }

  // 5. Repetição excessiva de palavras
  const words = markdown.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const wordFreq = {};
  for (const w of words) wordFreq[w] = (wordFreq[w] || 0) + 1;
  const repeatedWords = Object.entries(wordFreq)
    .filter(([w, c]) => c > 5 && w.length > 3)
    .map(([w, c]) => `${w} (${c}x)`);
  if (repeatedWords.length > 3) {
    warnings.push(`Palavras repetidas: ${repeatedWords.slice(0, 5).join(', ')}`);
  }

  return { pass: errors.length === 0, errors, warnings };
}

/**
 * Calcula Editorial Score (0-50) v2 com feedback extendido.
 */
export function calculateEditorialScore(markdown, { title, category, slug } = {}) {
  if (!markdown || markdown.length < 100) {
    return { score: 0, dimensions: {}, passed: false, summary: 'Conteúdo insuficiente' };
  }

  const text = markdown;
  const lower = text.toLowerCase();

  // ── 1. ORIGINALIDADE (0-10) ──
  let originalidade = 10;
  for (const p of PLACEHOLDER_PATTERNS) {
    if (p.test(text)) { originalidade -= 3; break; }
  }
  let fillerHits = 0;
  for (const p of FILLER_PATTERNS) { if (p.test(text)) fillerHits++; }
  originalidade -= Math.min(fillerHits, 4);
  for (const p of GARBAGE_PATTERNS) { if (p.test(text)) { originalidade -= 4; break; } }

  // Penaliza por repetição semântica
  const repetition = detectSemanticRepetition(text);
  if (repetition.hasRepetition) originalidade -= 2;

  originalidade = Math.max(0, Math.min(10, originalidade));

  // ── 2. NATURALIDADE (0-10) ──
  let naturalidade = 10;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    : 0;
  if (avgSentenceLen > 30) naturalidade -= 2;
  if (avgSentenceLen > 40) naturalidade -= 2;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 4) naturalidade -= 2;
  const paraLens = paragraphs.map(p => p.split(/\s+/).length);
  const uniqueLens = new Set(paraLens.map(l => Math.round(l / 10) * 10));
  if (uniqueLens.size < 3) naturalidade -= 2;
  if (repetition.hasRepetition) naturalidade -= 1;
  naturalidade = Math.max(0, Math.min(10, naturalidade));

  // ── 3. SEO (0-10) ──
  let seo = 10;
  const hasH1 = /^#\s+.+$/m.test(text);
  if (!hasH1) seo -= 3;
  const h2Count = (text.match(/^##\s+.+$/gm) || []).length;
  if (h2Count < 2) seo -= 3;
  if (h2Count > 8) seo -= 1;
  if (title && hasH1) {
    const h1Text = text.match(/^#\s+(.+)$/m)?.[1] || '';
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const kwInH1 = titleWords.some(w => h1Text.toLowerCase().includes(w));
    if (!kwInH1) seo -= 2;
  }
  const semanticTerms = /biodisponibilidade|eficácia|eficacia|desempenho|duração|duracao|resistência|resistencia|compatibilidade|ergonomia|textura|acabamento|estabilidade|performance|praticidade|versatilidade|funcionalidade|qualidade|confiabilidade|segurança|seguranca|conforto|durabilidade|inovação|inovacao|tecnologia|sustentabilidade|design|material/i;
  if (!semanticTerms.test(lower)) seo -= 2;
  seo = Math.max(0, Math.min(10, seo));

  // ── 4. LEGIBILIDADE (0-10) ──
  let legibilidade = 10;
  const totalWords = text.split(/\s+/).length;
  if (totalWords < 300) legibilidade -= 3;
  if (totalWords < 600) legibilidade -= 2;
  if (totalWords > 3000) legibilidade -= 2;
  const hasFAQ = /perguntas\s*frequentes|faq|dúvidas|duvidas/gi.test(text);
  if (hasFAQ) legibilidade += 1;
  const hasCTA = /confira|acesse|verifique|veja|conheça|saiba\s*mais|verificar/i.test(text);
  if (!hasCTA) legibilidade -= 1;
  const hasComparative = /comparad|diferente|alternativa|versus|vs\b|melhor que|superior|inferior/i.test(text);
  if (hasComparative) legibilidade += 1;
  legibilidade = Math.max(0, Math.min(10, legibilidade));

  // ── 5. ESPECIALIZAÇÃO (0-10) ──
  let especializacao = 10;
  const techTerms = /especificações|especificacoes|características|caracteristicas|diferenciais|tecnologia|material|composição|composicao|ingrediente|ativos|fórmula|formula|concentração|concentracao|dosagem|prazo|validade|fabricação|fabricacao|processo|mecanismo|funcionamento|desempenho|performance|resultados|benefícios|beneficios|vantagens|limitações|limitacoes|cuidados|recomendação|recomendacao|uso\s*diário|uso\s*diario|rotina|tratamento|prevenção|prevencao|manutenção|manutencao|duração|duracao/i;
  if (!techTerms.test(lower)) especializacao -= 3;
  const hasSpecs = /\*\*[^*]+:\*\*/i.test(text);
  if (hasSpecs) especializacao += 1;
  const nicheTerms = category === 'saude' ? /vitamina|suplemento|mg\b|ui\b|cápsulas|capsulas|comprimido|dosagem|miligrama/i :
    (category === 'beleza' ? /pele|cabelo|fps|fator|protetor|hidratação|hidratacao|textura|sérum|serum|facial|capilar|cosmético|cosmetico|maquiagem/i :
    (category === 'casa' ? /cozinha|eletro|elétrico|eletrico|digital|potência|potencia|capacidade|material|inox|plástico|plastico|antiaderente|dimensão|dimensao|montagem/i :
    /modelo|versão|versao|linha|série|serie|recurso|função|funcao|configuração|configuracao|compatível|compativel/i));
  if (!nicheTerms.test(lower)) especializacao -= 2;
  especializacao = Math.max(0, Math.min(10, especializacao));

  // ── SCORE FINAL ──
  const score = originalidade + naturalidade + seo + legibilidade + especializacao;
  const passed = score >= 45;

  const dimensions = {
    originalidade: { score: originalidade, max: 10 },
    naturalidade: { score: naturalidade, max: 10 },
    seo: { score: seo, max: 10 },
    legibilidade: { score: legibilidade, max: 10 },
    especializacao: { score: especializacao, max: 10 },
  };

  return {
    score,
    maxScore: 50,
    threshold: 45,
    passed,
    dimensions,
    summary: `${score}/50 — ${passed ? 'APROVADO' : 'REPROVADO'} (mín 45/50)`,
  };
}

/**
 * Gate único que executa AI Content Quality + Editorial Score + Feedback.
 */
export function runEditorialGates(markdown, { title, category, slug } = {}) {
  const qualityGate = runAIContentQualityGate(markdown);
  const editorialScore = calculateEditorialScore(markdown, { title, category, slug });

  const passed = qualityGate.pass && editorialScore.passed;

  // Gera relatório de melhorias
  const improvementReport = passed ? null : generateImprovementReport(markdown, editorialScore, qualityGate);

  return {
    passed,
    qualityGate,
    editorialScore,
    improvementReport,
    summary: `${editorialScore.score}/50 editorial · ${qualityGate.pass ? '✅ Quality OK' : '❌ Quality falhou'}`,
  };
}
