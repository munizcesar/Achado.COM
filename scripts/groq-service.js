/**
 * Groq AI Service - Protocolo Editorial v3
 * AchadoCerto.VIP
 *
 * Combina:
 * - Template Coringa Evergreen (Kotler/Keller + Seth Godin + Gary Vee + Dan Kennedy)
 * - Guias técnicos reais por categoria
 * - 5 ângulos narrativos rotativos (anti-repetição)
 * - Módulos dinâmicos variáveis
 * - SEO semântico invisível + FAQ automático
 */

import https from 'https';

// ── Groq request ──────────────────────────────────────────────────────────

function groqRequest(messages, apiKey, model = 'llama-3.3-70b-versatile') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.78,      // Criativo, variado, humano
      max_tokens: 2800,
      top_p: 0.92,
      frequency_penalty: 0.52, // Penaliza repetição de palavras
      presence_penalty: 0.35,  // Incentiva variedade de tópicos
    });
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).choices[0].message.content);
        } else {
          reject(new Error(`Groq ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(35000, () => { req.destroy(); reject(new Error('Timeout Groq')); });
    req.write(postData);
    req.end();
  });
}

// ── Guias técnicos por categoria ──────────────────────────────────────────
// Profundidade técnica real injetada no prompt por categoria

const GUIAS_CATEGORIA = {
  suplementos: `
CONHECIMENTO TÉCNICO OBRIGATÓRIO PARA ESTA CATEGORIA:
- Creatina: diferencie monohidratada (mais estudada da história), creapure (pureza certificada alemã), micronizada (dissolução superior). 166 doses = comprometimento de longo prazo.
- Proteínas: perfil de aminoácidos, PDCAAS, velocidade de absorção (whey isolado > concentrado > blend)
- Pré-treinos: cafeína anidra vs. natural, beta-alanina (formigamento é normal e indica dose eficaz), citrulina > arginina para pump
- Vitaminas: biodisponibilidade importa (D3 > D2, metilcobalamina > cianocobalamina, quelatos > óxidos)
- Regra editorial: qualquer suplemento só entrega resultado com dieta e treino consistentes — diga isso. Não prometa resultados específicos.
`,
  tecnologia: `
CONHECIMENTO TÉCNICO OBRIGATÓRIO PARA ESTA CATEGORIA:
- Processadores: arquitetura e geração importam mais que GHz isolado
- Displays: nits de brilho, taxa de atualização (60Hz vs 120Hz), tipo de painel (IPS, AMOLED, VA) — explique o impacto real
- Baterias: ciclos de carga e densidade energética, não só mAh
- Câmeras: tamanho do sensor supera megapixels na prática
- Conectividade: Wi-Fi 6 (menor latência em redes congestionadas), Bluetooth 5.x (alcance e estabilidade)
- Foco: sempre traduza spec técnico em benefício cotidiano real
`,
  beleza: `
CONHECIMENTO TÉCNICO OBRIGATÓRIO PARA ESTA CATEGORIA:
- Skincare: diferencie ativos (retinol = renovação celular, niacinamida = poros e oleosidade, ácido hialurônico = hidratação profunda, vitamina C = uniformização)
- Concentração importa: 0.025% retinol ≠ 1% retinol — efeitos e irritação são diferentes
- Ordem de aplicação: mais aquoso para mais denso (sérum antes do hidratante)
- Tipo de pele determina compatibilidade — mencione pele oleosa, seca, mista
- Fale sobre rotina, não produto isolado. Um ativo potente mal integrado na rotina não performa.
`,
  casa: `
CONHECIMENTO TÉCNICO OBRIGATÓRIO PARA ESTA CATEGORIA:
- Eletrodomésticos: consumo energético (selos Procel A), capacidade real vs nominal, ruído em dB
- Móveis: MDF (resistência média, fácil acabamento) vs MDP (mais econômico) vs madeira maciça (durabilidade superior)
- Organização: dimensões reais importam — mencione verificar espaço antes de comprar
- Materiais: ABS (leveza e impacto), aço inox 304 (anticorrosão), alumínio (leveza)
- Instalação: diferencie plug-and-play de instalação profissional necessária
`,
  esportes: `
CONHECIMENTO TÉCNICO OBRIGATÓRIO PARA ESTA CATEGORIA:
- Calçados: drop (diferença calcanhar/antepé), amortecimento (corrida vs treino funcional), pronação (neutra, supinação, overpronação)
- Roupas: poliamida (durabilidade), dryfit/mesh (transpiração), compression (circulação e recuperação)
- Equipamentos: técnica e progressão importam mais que o equipamento em si — diga isso
- Segurança: capacetes, joelheiras, luvas — quando são essenciais vs opcionais por modalidade
`,
  default: `
CONHECIMENTO CONTEXTUAL:
- Identifique o critério mais decisivo de compra nesta categoria específica
- Explique o que diferencia produtos mediocres de produtos bem projetados neste segmento
- Dê contexto de uso real: quem precisa, quando vale, quando não vale
- Use termos do setor de forma natural, não decorativa
`,
};

// ── Ângulos narrativos rotativos ──────────────────────────────────────────
// 5 ângulos determinísticos (mesmo produto = mesmo ângulo sempre)
// Garantem variação real entre posts diferentes

const ANGULOS = [
  {
    nome: 'problema_invisivel',
    hook: `Comece identificando um PROBLEMA ESPECÍFICO que o consumidor típico desta categoria tem mas raramente consegue articular. Seja cirúrgico — não genérico. Ex para creatina: "Você talvez já tenha comprado creatina barata e não viu resultado — não porque creatina não funciona, mas porque pureza de fabricação importa muito mais do que o preço por grama." O produto resolve esse problema específico.`,
  },
  {
    nome: 'mito_desmontado',
    hook: `Comece quebrando um equívoco REAL e comum sobre esta categoria. Ex: "Creatina não é só para quem quer ficar enorme. É um dos compostos mais estudados da história da nutrição esportiva, com benefícios documentados em força, cognição e recuperação muscular." Posicione o produto dentro dessa realidade corrigida.`,
  },
  {
    nome: 'criterio_oculto',
    hook: `Revele um critério de compra que a maioria ignora mas que separa um produto bom de um ótimo nesta categoria. Ex para creatina: a maioria olha preço por grama. O critério oculto é o processo de fabricação e a ausência de contaminantes. Apresente o produto como quem entende esse critério.`,
  },
  {
    nome: 'contexto_uso_real',
    hook: `Descreva com detalhe uma situação de uso REAL e específica — não abstrata. Ex: "São 6h da manhã. Treino em jejum antes do trabalho. Você precisa de algo que dissolva bem, não cause desconforto gástrico e faça efeito consistente ao longo de semanas, não de dias." O produto se encaixa nesse cenário de forma orgânica.`,
  },
  {
    nome: 'custo_de_errar',
    hook: `Comece pelo custo REAL de fazer a escolha errada nesta categoria — não financeiro, mas em tempo, resultado ou experiência. Ex: "Três meses de suplemento ruim não são só dinheiro perdido — são três meses de treino sem a recuperação que você merecia." O produto elimina esse risco de forma concreta.`,
  },
];

// ── Modelos de título SEO (rotacionados) ──────────────────────────────────

const MODELOS_TITULO = [
  'Vale a pena comprar [PRODUTO]?',
  'O que ninguém fala sobre o [PRODUTO]',
  '[PRODUTO] entrega o que promete?',
  '[PRODUTO]: análise completa e opinião real',
  'Depois de analisar o [PRODUTO], isso chamou atenção',
  '[PRODUTO] ainda vale a pena hoje?',
  'Review completo do [PRODUTO]: desempenho, qualidade e custo-benefício',
  '[PRODUTO] é bom mesmo? Análise sem enrolação',
  'O [PRODUTO] se destaca — mas com ressalvas',
  'Testamos o [PRODUTO]: pontos fortes e o que poderia melhorar',
];

// ── Modelos de CTA leve (sem cara de venda) ───────────────────────────────

const MODELOS_CTA = [
  'Verificar as condições atuais pode valer a pena, já que os valores costumam variar.',
  'Comparar versões e ofertas disponíveis ajuda a encontrar a opção mais vantajosa.',
  'Dependendo das promoções disponíveis, o custo-benefício pode ficar ainda mais interessante.',
  'As condições atuais estão disponíveis na página do produto.',
  'Para quem já decidiu, conferir disponibilidade e entrega é o próximo passo natural.',
];

// ── Módulos dinâmicos disponíveis ─────────────────────────────────────────
// O modelo escolhe 4-6 dos 12 módulos abaixo por post

const MODULOS_DISPONIVEIS = `
MÓDULOS DISPONÍVEIS (escolha 4 a 6, nunca todos, nunca a mesma combinação):
A. Experiência no uso diário — como funciona na prática, não no papel
B. Principal diferencial — o que genuinamente se destaca vs. categoria
C. Ponto fraco honesto — o que poderia melhorar (aumenta credibilidade)
D. Para quem faz sentido — perfil de usuário ideal com especificidade
E. Para quem NÃO faz sentido — tão importante quanto o anterior
F. Comparativo contextual — sem citar concorrentes pelo nome
G. Detalhe técnico relevante — 1 spec explicada com impacto real
H. Experiência de longo prazo — durabilidade, consistência, recompra
I. O que chamou atenção — observação específica, não genérica
J. Custo-benefício contextual — sem citar preço, mas com contexto de valor
K. Dúvida comum respondida — algo que as pessoas realmente perguntam
L. Integração no cotidiano — como encaixa na rotina real do usuário
`;

// ── Constrói prompt master ────────────────────────────────────────────────

function construirPrompt(produto, arquetipo, variacoes, contextoSerper) {
  // Seleção determinística pelo título (mesmo produto = mesmo ângulo)
  const hash = produto.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const angulo    = ANGULOS[hash % ANGULOS.length];
  const modeloTitulo = MODELOS_TITULO[hash % MODELOS_TITULO.length];
  const modeloCta    = MODELOS_CTA[hash % MODELOS_CTA.length];

  const categoria = produto.category || 'default';
  const guia = GUIAS_CATEGORIA[categoria] || GUIAS_CATEGORIA.default;

  const dadosProduto = JSON.stringify({
    nome: produto.title,
    categoria: produto.category,
    loja: produto.store,
    especificacoes: produto.specs || [],
    descricao_base: produto.description,
  }, null, 2);

  const contextoExterno = contextoSerper
    ? `\n### CONTEXTO EXTERNO (use como referência de linguagem):\n${JSON.stringify(contextoSerper, null, 2)}`
    : '';

  const systemPrompt = `Você é um redator editorial sênior especializado em reviews de produtos para consumidores brasileiros.
Sua escrita aparece em portais editoriais reais — não em blogs automáticos.
Você combina rigor técnico com narrativa humana e fluida.

═══════════════════════════════════════════════
ÂNGULO NARRATIVO DESTE POST: ${angulo.nome}
═══════════════════════════════════════════════
${angulo.hook}

═══════════════════════════════════════════════
GUIA TÉCNICO DA CATEGORIA: ${categoria}
═══════════════════════════════════════════════
${guia}

═══════════════════════════════════════════════
PROTOCOLO EDITORIAL (INVIOLÁVEL)
═══════════════════════════════════════════════

## ESTRUTURA DO ARTIGO

Ordem dos blocos (pode variar — NÃO siga sempre a mesma ordem):
1. Título H1 SEO — use o modelo: ${modeloTitulo}
2. Introdução humanizada (ângulo: ${angulo.nome})
3. Resumo rápido — prós, contras, ideal para (escaneável, bom para featured snippet)
4. Bloco de experiência/narrativa — onde o texto deixa de parecer IA
5. Módulos dinâmicos (${MODULOS_DISPONIVEIS})
6. FAQ estratégico (5-7 perguntas reais que as pessoas fazem)
7. Conclusão evergreen natural
8. CTA leve: "${modeloCta}"

## REGRAS DE TÍTULO E H2
Proibido: "Design", "Desempenho", "Conclusão", "Introdução", "Durabilidade"
Obrigatório: H2 específicos do produto, ex:
- "O que esperar no uso diário"
- "Onde realmente se destaca"
- "O ponto que mais chamou atenção"
- "Para quem faz sentido — e para quem não faz"
- "O que considerar antes de decidir"

## REGRAS DE VOZ E ESTILO
- Voz opinativa e direta. Opine. Não use "pode ser interessante" ou "é uma opção"
- Micro-opiniões naturais: "isso chamou atenção", "na prática", "o equilíbrio aqui", "mais consistente do que impressionante"
- Parágrafos curtos (2-4 linhas) misturados com médios (5-6 linhas) — nunca uniformes
- Frases curtas intercaladas com médias — ritmo humano
- Alternância emocional/técnico ao longo do texto

## PROIBIÇÕES ABSOLUTAS
- NUNCA: "alta qualidade", "ótimo custo-benefício", "produto excelente", "vale a pena" (genérico)
- NUNCA: "Em conclusão", "Além disso" no início de parágrafo, metalinguagem ("neste artigo...")
- NUNCA: mesmo adjetivo mais de 1x no texto inteiro
- NUNCA: nome do produto mais de 4x — use pronomes e variações
- NUNCA: preço exato, datas específicas, notas numéricas ("4.8 estrelas", "nota 8.7")
- NUNCA: inventar especificações que não estão nos dados do produto
- NUNCA: superlativos exagerados ("melhor do mercado", "incomparável", "revolucionário")
- NUNCA: listas gigantes com mais de 6 itens

## SEO SEMÂNTICO INVISÍVEL
Palavra-chave principal: inserir no H1, primeiro parágrafo, 1 H2 e FAQ
Palavras semânticas a misturar naturalmente: avaliação, análise, opinião, desempenho,
experiência, custo-benefício, comparativo, recursos, qualidade, vale a pena
Técnica avançada: use perguntas naturais, entidades relacionadas, termos contextuais do setor
O texto NÃO deve parecer otimizado — o SEO é invisível.

## FAQ ESTRATÉGICO
Inclua 5-7 perguntas reais que consumidores desta categoria fazem:
- "[Produto] é bom?"
- "Vale a pena comprar?"
- "Para quem é indicado?"
- "Qual o principal diferencial?"
- "Tem bom custo-benefício?"
- "Existem alternativas?"
Responda em 2-4 linhas por pergunta — direto, sem enrolação.

## CONCLUSÃO EVERGREEN
Proibido: "Em 2026...", qualquer data, qualquer nota numérica
Use: frases atemporais baseadas em perfil de usuário
Ex: "Faz sentido principalmente para quem busca consistência sem entrar em faixas premium."
Ex: "Para uso cotidiano, entrega o que promete — sem exageros em nenhuma direção."

## TAMANHO
1800-2500 palavras. Denso mas escaneável. Nunca abaixo de 1500.

## FORMATO
- 1 H1, 6-9 H2, alguns H3 quando necessário
- Tabela ocasional para comparações ou especificações
- **Negrito** apenas em termos técnicos ou afirmações centrais
- Listas com - apenas para specs reais ou prós/contras
- FAQ com ### por pergunta

ARQUÉTIPO ESTRUTURAL: ${arquetipo.nome}
${JSON.stringify(arquetipo.estrutura, null, 2)}`;

  const userPrompt = `Escreva o artigo completo seguindo o protocolo editorial acima.

PRODUTO:
${dadosProduto}
${contextoExterno}

LEMBRETES FINAIS:
- Aplique o ângulo "${angulo.nome}" logo na abertura — seja específico, não genérico
- Use o guia técnico da categoria para profundidade real (não decorativa)
- Cada H2 deve avançar o argumento — não repetir o que já foi dito
- O leitor deve terminar sabendo mais sobre esta categoria do que quando chegou
- O texto deve parecer escrito por um especialista que também sabe comunicar`;

  return { systemPrompt, userPrompt };
}

// ── Export principal ──────────────────────────────────────────────────────

export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  const hash = produto.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const angulo = ANGULOS[hash % ANGULOS.length];
  console.log(`   🤖 Groq — ângulo: ${angulo.nome} | categoria: ${produto.category || 'default'}`);

  try {
    const { systemPrompt, userPrompt } = construirPrompt(produto, arquetipo, variacoes, contextoSerper);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ];
    const conteudo = await groqRequest(messages, groqApiKey);
    console.log(`   ✅ Conteúdo gerado (~${conteudo.length} chars | ~${Math.round(conteudo.split(' ').length)} palavras)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Groq falhou: ${error.message}`);
    console.log('   💡 Usando fallback básico...');
    return gerarConteudoFallback(produto, variacoes);
  }
}

// ── Fallback ──────────────────────────────────────────────────────────────

function gerarConteudoFallback(produto, variacoes) {
  const specsBlock = produto.specs?.length
    ? `\n## Especificações\n\n${produto.specs.join('\n')}\n`
    : '';
  return `${variacoes.abertura}\n\n${produto.title} está disponível na ${produto.store} com entrega para todo o Brasil.\n${specsBlock}\n## Vale a Pena?\n\n${variacoes.transicao}\n\n${produto.description}\n\n${variacoes.fechamento}.\n\n---\n\n*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*`;
}
