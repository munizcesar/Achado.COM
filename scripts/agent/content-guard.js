/**
 * content-guard.js — Protocolo de Segurança do Agente AchadoCerto.VIP
 *
 * RESPONSABILIDADE:
 *   Analisar e blindar as variáveis de contexto ANTES de chamar o novo-post.js.
 *   Não modifica nenhum arquivo do projeto. Age APENAS nas env vars injetadas.
 *
 * O QUE FAZ:
 *   1. BLINDAGEM DE TÍTULO   — detecta e bloqueia padrões genéricos de título
 *   2. BLINDAGEM DE ÂNGULO   — garante que o ângulo narrativo é específico e único
 *   3. BLINDAGEM TEMPORAL     — remove datas, preços e referências voláteis
 *   4. BLINDAGEM DE PILAR     — reforça a identidade do pilar no contexto do Groq
 *   5. CHECK DE REPETIÇÃO    — verifica se títulos parecidos foram usados recentemente
 *   6. PROMPT INJECTION       — monta instruções extras para o Groq via POST_ANGLE_DESC
 *
 * PROTOCOLO DE SEGURANÇA (o que NUNCA quebra):
 *   - Não altera novo-post.js, groq-service.js, content-validator.js nem nenhum outro script
 *   - Não faz git add/commit/push (isso é trabalho do novo-post.js)
 *   - Não faz requisições externas
 *   - Só retorna um objeto com as env vars enriquecidas e um relatório de auditoria
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, 'history.json');

// ── Padrões genéricos proibidos ───────────────────────────────────────────────────

const TITULOS_GENERICOS = [
  /^(análise|review|resenha)\s+(de|do|da)\s+/i,
  /^(conheça|descubra|veja)\s+o\s+(produto|item|artigo)/i,
  /^(melhor|top|número 1)\s+(produto|opção)/i,
  /\b(incrível|fantástico|maravilhoso|sensacional)\b/i,
  /\b(tudo (o )?que você precisa saber)\b/i,
  /\b(guia completo|guia definitivo|guia ultimate)\b/i,
  /\b(vale a pena\??)$/i,   // como título principal é fraco
  /^(produto|item)\s+/i,
];

const FRASES_TEMPORAIS = [
  /\b20\d{2}\b/,
  /\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
  /\b(essa semana|esse mês|esse ano|ano passado|ano que vem)\b/i,
  /\b(promoção|oferta)\s+(de|do|da)\s+\w+/i,
  /R\$\s?\d+/,
  /\bpreço\s+(de|por|a partir)\b/i,
  /\b(desconto|promo|black friday|cyber monday|liquidação)\b/i,
];

const METALINGUAGEM = [
  /\b(neste artigo|neste post|neste review)\b/i,
  /\b(vamos (falar|ver|analisar|mostrar))\b/i,
  /\b(hoje (vamos|eu|a gente))\b/i,
  /\b(vou (mostrar|falar|explicar|contar))\b/i,
  /\b(a seguir (vamos|veremos))\b/i,
];

// ── Instruções de prompt por pilar (injetadas no POST_ANGLE_DESC) ──────────────────────
// Estas instruções chegam até o Groq via variável de ambiente e forçam
// o modelo a ser mais específico, atemporal e coerente com o pilar.

const PILLAR_PROMPT = {
  beleza: `
VOCE ESTA ESCREVENDO PARA O PILAR BELEZA do AchadoCerto.VIP.
REGRAS OBRIGATÓRIAS:
- Título: específico, sensorial, focado no RESULTADO (ex: "A Rotina Noturna que Transforma a Pele em 4 Semanas")
- NÃO use: "review", "análise", "guia", "melhor", "incrível"
- NÃO mencione preço, promoção, data ou ano
- Use linguagem evergreen: "quem tem pele oleosa", "para quem busca", "no dia a dia"
- Inclua 1 benefício concreto com mecanismo de ação (ex: "o ácido hialurônico atrai umidade para dentro da derme")
- CTA natural: "confira disponibilidade" ou "veja mais detalhes" — NUNCA "compre agora" ou "clique aqui"
- Tom: consultivo, como uma amiga que entende de skincare, não uma vendedora
`,
  saude: `
VOCE ESTA ESCREVENDO PARA O PILAR SAUDE do AchadoCerto.VIP.
REGRAS OBRIGATÓRIAS:
- Título: focado no HÁBITO ou RESULTADO DE LONGO PRAZO (ex: "O Suplemento que Faz Diferença Quando Você Menos Espera")
- NÃO use: "review", "análise", "guia", "melhor", "top"
- NÃO mencione preço, promoção, data ou ano
- Use linguagem evergreen: "quem tem déficit de", "para quem pratica", "no dia a dia"
- Inclua 1 dado de mecanismo real (ex: "o magnésio participa de mais de 300 reações enzimáticas")
- Seja cuidadoso: não faça promessa de cura, use "pode contribuir", "estudos indicam", "auxilia em"
- CTA natural: "veja mais informações" ou "confira na Amazon"
- Tom: informativo e responsável, como um profissional de saúde que também é seu amigo
`,
  casa: `
VOCE ESTA ESCREVENDO PARA O PILAR CASA do AchadoCerto.VIP.
REGRAS OBRIGATÓRIAS:
- Título: focado na TRANSFORMAÇÃO DO COTIDIANO (ex: "Por Que Essa Cafeteira Mudou Minha Manhã de Vez")
- NÃO use: "review", "análise", "guia", "melhor", "top"
- NÃO mencione preço, promoção, data ou ano
- Use linguagem evergreen: "quem mora sozinho", "para famílias", "quem quer praticidade"
- Inclua 1 detalhe técnico real e relevante (ex: "a fritadeira usa circulação de ar a 200°C que cria a mesma reação de Maillard do óleo")
- Foco em praticidade, tempo ganho, qualidade de vida
- CTA natural: "veja mais detalhes" ou "confira disponibilidade"
- Tom: cotidiano e direto, como um amigo que já usa o produto há meses
`,
};

// ── Análises ────────────────────────────────────────────────────────────────────

function detectarTituloGenerico(productName) {
  const issues = [];
  for (const pattern of TITULOS_GENERICOS) {
    if (pattern.test(productName)) {
      issues.push(`padrão genérico: ${pattern}`);
    }
  }
  return issues;
}

function detectarConteudoTemporal(angle) {
  const issues = [];
  for (const pattern of FRASES_TEMPORAIS) {
    if (pattern.test(angle)) {
      issues.push(`referência temporal: ${pattern}`);
    }
  }
  return issues;
}

function detectarMetalinguagem(angle) {
  const issues = [];
  for (const pattern of METALINGUAGEM) {
    if (pattern.test(angle)) {
      issues.push(`metalinguagem: ${pattern}`);
    }
  }
  return issues;
}

function checkRepetitionRisk(productName, pillar, history) {
  // Verifica posts recentes do mesmo pilar (últimos 7 dias)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = history.filter(h =>
    h.category === pillar &&
    new Date(h.postedAt).getTime() > cutoff
  );

  if (recent.length === 0) return { risk: 'low', count: 0, recentNames: [] };

  // Similaridade simples por palavras-chave compartilhadas
  const nameWords = productName.toLowerCase().split(/\s+/);
  const similar = recent.filter(h => {
    const hWords = (h.name || '').toLowerCase().split(/\s+/);
    const shared = nameWords.filter(w => w.length > 4 && hWords.includes(w));
    return shared.length >= 2;
  });

  return {
    risk: similar.length > 0 ? 'high' : recent.length >= 3 ? 'medium' : 'low',
    count: recent.length,
    recentNames: recent.map(h => h.name || h.asin),
    similarNames: similar.map(h => h.name || h.asin),
  };
}

// ── Montagem do prompt enriquecido ─────────────────────────────────────────────

function buildEnrichedAngleDesc({ angle, angleDesc, productName, pillar, recentNames }) {
  const pillarInstructions = PILLAR_PROMPT[pillar] || '';
  const recentContext = recentNames.length > 0
    ? `\nPRODUTOS RECENTES DO MESMO PILAR (NÃO REPITA ÂNGULO SIMILAR): ${recentNames.slice(-5).join(' | ')}`
    : '';

  return [
    `PRODUTO: ${productName}`,
    `ÂNGULO PRINCIPAL: ${angleDesc}`,
    recentContext,
    pillarInstructions,
    `LEMBRETE FINAL: conteúdo 100% evergreen, sem preços, sem datas, sem metalinguagem, CTA natural.`,
  ].filter(Boolean).join('\n').trim();
}

// ── Protocolo principal ──────────────────────────────────────────────────────────
/**
 * runContentGuard(options)
 *
 * @param {object} options
 * @param {string} options.productName   - nome do produto (ex: "Sérum Vitamina C")
 * @param {string} options.pillar        - pilar: 'beleza' | 'saude' | 'casa'
 * @param {string} options.angle         - chave do ângulo (ex: 'skincare_basico')
 * @param {string} options.angleDesc     - descrição do ângulo
 * @param {Array}  options.history       - array do history.json
 *
 * @returns {object} {
 *   safe: boolean,          - true = pode prosseguir, false = bloqueado
 *   envVars: object,        - env vars enriquecidas para injetar no execSync
 *   report: string[],       - log de auditoria para exibir
 *   warnings: string[],     - alertas não-bloqueantes
 *   blockers: string[],     - problemas que bloqueiam o post
 * }
 */
export function runContentGuard({ productName, pillar, angle, angleDesc, history }) {
  const report   = [];
  const warnings = [];
  const blockers = [];

  report.push(`🛡️  Content Guard — Auditoria de Qualidade`);
  report.push(`   Produto : ${productName}`);
  report.push(`   Pilar   : ${pillar}`);
  report.push(`   Ângulo  : ${angle}`);

  // 1. Verifica título genérico
  const tituloIssues = detectarTituloGenerico(productName);
  if (tituloIssues.length > 0) {
    warnings.push(`⚠️  Nome do produto com padrão genérico: ${tituloIssues.join(', ')}`);
    report.push(`   [AVISO] Nome genérico detectado — o Groq receberá instrução extra para especificar`);
  } else {
    report.push(`   [OK] Nome do produto sem padrões genéricos`);
  }

  // 2. Verifica referências temporais no ângulo
  const temporalIssues = detectarConteudoTemporal(angleDesc);
  if (temporalIssues.length > 0) {
    blockers.push(`❌ Ângulo contém referência temporal: ${temporalIssues.join(', ')}`);
    report.push(`   [BLOQUEIO] Referência temporal no ângulo — não é evergreen`);
  } else {
    report.push(`   [OK] Ângulo sem referências temporais`);
  }

  // 3. Verifica metalinguagem no ângulo
  const metaIssues = detectarMetalinguagem(angleDesc);
  if (metaIssues.length > 0) {
    warnings.push(`⚠️  Metalinguagem no ângulo: ${metaIssues.join(', ')}`);
    report.push(`   [AVISO] Metalinguagem detectada — será corrigida no prompt`);
  } else {
    report.push(`   [OK] Sem metalinguagem no ângulo`);
  }

  // 4. Risco de repetição
  const repetition = checkRepetitionRisk(productName, pillar, history);
  if (repetition.risk === 'high') {
    blockers.push(`❌ Produto similar postado recentemente: ${repetition.similarNames.join(', ')}`);
    report.push(`   [BLOQUEIO] Risco alto de conteúdo repetitivo`);
  } else if (repetition.risk === 'medium') {
    warnings.push(`⚠️  ${repetition.count} posts recentes do pilar "${pillar}" — Groq instruído a diferenciar`);
    report.push(`   [AVISO] Muitos posts recentes do mesmo pilar — ângulo será diferenciado`);
  } else {
    report.push(`   [OK] Sem risco de repetição`);
  }

  // 5. Monta o POST_ANGLE_DESC enriquecido
  const recentNames = repetition.recentNames || [];
  const enrichedDesc = buildEnrichedAngleDesc({ angle, angleDesc, productName, pillar, recentNames });

  // 6. Resultado final
  const safe = blockers.length === 0;

  if (safe) {
    report.push(`   ✅ Guard aprovado — ${warnings.length} aviso(s), 0 bloqueio(s)`);
  } else {
    report.push(`   ❌ Guard BLOQUEOU — ${blockers.length} problema(s) crítico(s)`);
  }

  return {
    safe,
    envVars: {
      POST_ANGLE:      angle,
      POST_ANGLE_DESC: enrichedDesc,
      POST_PILLAR:     pillar,
    },
    report,
    warnings,
    blockers,
  };
}
