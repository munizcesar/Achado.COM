#!/usr/bin/env node
/**
 * anti-hallucination.js — Guarda Anti-Alucinação
 * AchadoCerto.VIP — Agente Autônomo
 *
 * A IA não pode inventar:
 *   - Benefícios não listados nas fontes
 *   - Especificações técnicas não verificadas
 *   - Dimensões, pesos ou medidas não confirmadas
 *   - Avaliações, reviews ou depoimentos
 *   - Certificações não mencionadas nos dados
 *   - Garantia não confirmada
 *
 * Se uma informação não existir nas fontes, ela DEVE ser omitida.
 *
 * Este módulo analisa o conteúdo gerado e verifica contra os dados
 * reais do produto, sinalizando suspeitas de alucinação.
 */

/**
 * Padrões de linguagem que indicam ALTA probabilidade de alucinação.
 */
const HALLUCINATION_PATTERNS = [
  // Avaliações e depoimentos inventados
  { pattern: /"(?:[^"]{10,})"/g, risk: 'alta', reason: 'Citação direta inventada — a IA não tem acesso a reviews reais' },
  { pattern: /\b(?:avaliação|avaliacao|review|depoimento|opinião|opiniao|comentário|comentario)\s*(?:média|media|geral|dos\s*clientes|dos\s*usuários|dos\s*usuarios)\b/i, risk: 'alta', reason: 'Review genérica sem fonte — provavelmente inventada' },
  { pattern: /\b(?:clientes|usuários|usuarios|consumidores)\s*(?:relatam|dizem|afirmam|comentam|destacam|elogiam)\b/i, risk: 'alta', reason: 'Depoimento coletivo inventado — sem base real' },

  // Especificações técnicas não verificadas
  { pattern: /\b(?:dimensões|dimensoes|medidas|peso|tamanho)\s*(?:aproximadas?|aproximados?)\s*(?::\s*)?\d+[x×\s*]\d+/i, risk: 'media', reason: 'Dimensão não confirmada nas fontes — verificar se existe nos dados do produto' },
  { pattern: /\b(?:garantia)\s*(?::\s*)?\d+\s*(?:ano|anos|mês|meses|mês)\b/i, risk: 'media', reason: 'Prazo de garantia não confirmado — pode ser inventado' },

  // Certificações e selos
  { pattern: /\b(?:certificação|certificacao|selo|aprovação|aprovacao|homologação|homologacao)\s*(?:da|do|de|pela|pelo)\s+[a-zç\s]{10,}\b/i, risk: 'alta', reason: 'Certificação sem fonte — provavelmente inventada' },

  // Números precisos não verificados
  { pattern: /\b(?:mais\s*de|quase|aproximadamente)\s*\d+\s*(?:milhões|milhoes|mil|anos|clientes|usuários|usuarios|unidades)\b/i, risk: 'media', reason: 'Número absoluto sem fonte — não pode ser verificado' },

  // Comparações com concorrentes
  { pattern: /\b(?:diferente\s*de|ao\s*contrário\s*de|comparado\s*a)\s*(?:outros|muitos|grande\s*parte|a\s*maioria)\s*(?:dos|das)?\s*(?:produtos|concorrentes|marcas|modelos|versões|versoes)\b/i, risk: 'baixa', reason: 'Comparação genérica sem alvo específico — pode ser aceitável' },
];

/**
 * Lista de claims que a IA JAMAIS deve fazer sem dados nas fontes.
 */
const FORBIDDEN_CLAIMS = [
  /\b(?:ótimo|otimo|excelente|melhor|superior|incrível|incrivel|maravilhoso|perfeito)\s*(?:para|custo-benefício|custo beneficio|qualidade|resultado)\b/i,
  /\b(?:qualidade\s*superior|melhor\s*custo-benefício|melhor\s*custo beneficio)\b/i,
  /\b(?:recomendo|recomendamos?)\s*(?:de\s*olhos\s*fechados|sem\s*medo|com\s*certeza|fortemente)\b/i,
  /\b(?:resultados\s*(?:garantidos|certos|absolutos|definitivos|imediatos|rápidos|rapidos))\b/i,
  /\b(?:eficácia|eficacia)\s*(?:comprovada|garantida|total|absoluta)\b/i,
  /\b(?:clinicamente\s*(?:comprovado|testado|verificado))\b/i,
];

/**
 * Analisa o conteúdo gerado e retorna suspeitas de alucinação.
 *
 * @param {string} content - Conteúdo markdown gerado pela IA
 * @param {object} productData - Dados estruturados do produto (do catálogo/scraping)
 * @returns {{
 *   passed: boolean,
 *   violations: Array<{ text: string, risk: string, reason: string, context: string }>,
 *   warnings: string[],
 *   summary: string
 * }}
 */
export function analyzeHallucinations(content, productData = {}) {
  if (!content || content.length < 100) {
    return { passed: true, violations: [], warnings: ['Conteúdo muito curto para análise'], summary: 'Conteúdo insuficiente' };
  }

  const violations = [];
  const warnings = [];

  // ── 1. Padrões de alucinação ─────────────────────────────────
  for (const rule of HALLUCINATION_PATTERNS) {
    let match;
    // Reset regex
    rule.pattern.lastIndex = 0;
    while ((match = rule.pattern.exec(content)) !== null) {
      const context = content.slice(Math.max(0, match.index - 40), match.index + match[0].length + 40).replace(/\n/g, ' ');
      violations.push({
        text: match[0].slice(0, 80),
        risk: rule.risk,
        reason: rule.reason,
        context: context.slice(0, 120),
      });
      // Limita a 3 ocorrências do mesmo padrão
      if (violations.filter(v => v.reason === rule.reason).length >= 3) break;
    }
  }

  // ── 2. Claims proibidos ─────────────────────────────────────
  for (const pattern of FORBIDDEN_CLAIMS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(content);
    if (match) {
      const context = content.slice(Math.max(0, match.index - 40), match.index + match[0].length + 40).replace(/\n/g, ' ');
      violations.push({
        text: match[0].slice(0, 80),
        risk: 'alta',
        reason: 'Claim absoluta proibida — a IA não tem dados para afirmar isso',
        context: context.slice(0, 120),
      });
    }
  }

  // ── 3. Verificação contra dados do produto ─────────────────
  // Se o produto tem especificações, verifica se o conteúdo as menciona corretamente
  if (productData.specs && productData.specs.length > 0) {
    const specsText = Array.isArray(productData.specs) ? productData.specs.join(' ') : productData.specs;
    const specValues = specsText.match(/\d+[.,]?\d*\s*(?:mm|cm|m|kg|g|mg|ml|l|unidades|cápsulas|capsulas|comprimidos|tabletes|ui|w|v|a|hz|rpm|°c)/gi);
    if (specValues) {
      for (const val of specValues.slice(0, 5)) {
        // Procura o mesmo valor no conteúdo
        const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const found = new RegExp(escaped.replace(/\s+/g, '\\s*'), 'i').test(content);
        if (!found) {
          warnings.push(`Especificação "${val.trim()}" dos dados do produto não aparece no conteúdo gerado`);
        }
      }
    }
  }

  // ── 4. Verificação de marca no conteúdo ────────────────────
  if (productData.brand || (productData.normalized && productData.normalized.marca)) {
    const brand = productData.brand || productData.normalized.marca;
    if (brand && brand.length > 2 && !content.toLowerCase().includes(brand.toLowerCase())) {
      warnings.push(`Marca "${brand}" não mencionada no conteúdo gerado`);
    }
  }

  // ── Resultado ──────────────────────────────────────────────
  const criticalViolations = violations.filter(v => v.risk === 'alta');
  const passed = criticalViolations.length === 0;

  return {
    passed,
    violations,
    warnings,
    summary: `${violations.length} suspeita(s) de alucinação (${criticalViolations.length} críticas) — ${passed ? '✅ APROVADO' : '❌ REPROVADO'}`,
  };
}

/**
 * Verifica se o conteúdo parece conter informações copiadas da Amazon HTML.
 */
export function detectAmazonCopyPaste(content) {
  if (!content) return { passed: true, patterns: [] };

  const amazonPatterns = [
    /aplus-/i, /celwidget/i, /data-\w+=/i,
    /\.a-spacing/i, /\.a-section/i, /\.a-row/i,
    /logShoppableMetrics/i,
    /Amazon\s+A\+\s*Content/i,
    /<div/i, /<span/i, /<style/i,
  ];

  const found = [];
  for (const pat of amazonPatterns) {
    if (pat.test(content)) {
      found.push(pat.source.slice(0, 40));
    }
  }

  return {
    passed: found.length === 0,
    patterns: found,
    summary: found.length > 0 ? `❌ Conteúdo copiado da Amazon: ${found.join(', ')}` : '✅ Conteúdo original',
  };
}
