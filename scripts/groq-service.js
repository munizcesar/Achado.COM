/**
 * Groq AI Service - Geração de Conteúdo Editorial Profissional
 * AchadoCerto.VIP
 *
 * PROTOCOLO EDITORIAL v2
 * - Voz opinativa e direta (não genérica)
 * - Profundidade técnica real por categoria
 * - Evergreen verdadeiro (sem datas, notas, rankings)
 * - Gatilhos de confiança sem invenção de dados
 * - Variações de ângulo narrativo por post
 */

import https from 'https';

// ── Groq request ────────────────────────────────────────────────────────────

function groqRequest(messages, apiKey, model = 'llama-3.3-70b-versatile') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.72, // Criativo mas controlado
      max_tokens: 2200,
      top_p: 0.92,
      frequency_penalty: 0.45, // Reduz repetição de frases
      presence_penalty: 0.3,
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout Groq')); });
    req.write(postData);
    req.end();
  });
}

// ── Guias técnicos por categoria ────────────────────────────────────────────
// Cada categoria tem seus próprios critérios técnicos reais
// para forçar profundidade editorial genuína

const GUIAS_CATEGORIA = {
  suplementos: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Creatina: diferencie monohidratada (mais estudada), creapure (pureza certificada), micronizada (dissolução)
- Proteínas: fale sobre perfil de aminoácidos, PDCAAS, velocidade de absorção
- Pré-treinos: cafeína anidra vs. natural, beta-alanina (formigamento normal), citrulina x arginina
- Vitaminas: biodisponibilidade das formas (ex: D3 > D2, metilcobalamina > cianocobalamina)
- Regra de ouro: qualquer suplemento só funciona com dieta e treino consistentes — mencione isso
- Nunca prometa resultados específicos como "ganhe X kg" ou "perca Y% de gordura"
`,
  tecnologia: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Processadores: mencione arquitetura, não só GHz
- Displays: nits, taxa de atualização, painel tipo (IPS/AMOLED/VA) fazem diferença real
- Baterias: ciclos de carga, não só mAh
- Câmeras: tamanho do sensor > megapixels na prática
- Conectividade: Wi-Fi 6 vs 5, Bluetooth 5.x — explique o benefício real
- Foque no uso prático: "o que isso significa no dia a dia"
`,
  beleza: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Skincare: diferencie princípios ativos (retinol, niacinamida, ácido hialurônico, vitamina C)
- Concentração importa: 0.1% retinol ≠ 1% retinol
- Ordem de aplicação: mais leve para mais denso
- Tipo de pele: um produto pode ser ótimo para oleosa e ruim para seca
- Fale sobre rotina, não sobre uso isolado
- Evite promessas de "reverter" ou "eliminar" — prefira "minimizar", "suavizar"
`,
  casa: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Eletrodomésticos: consumo de energia (selos Procel), capacidade real vs. nominal
- Móveis: MDF vs. MDP vs. madeira maciça — qual a diferença prática
- Organização: meça espaço antes de comprar, mencione isso
- Qualidade de materiais: ABS, aço inox 304, alumínio — o que cada um significa
- Instalação: diga se precisa de profissional ou é plug-and-play
`,
  esportes: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Calçados: drop, amortecimento, pronação — explique de forma acessível
- Roupas: tecidos técnicos (poliamida, dryfit, compression) e quando fazem diferença
- Equipamentos: não basta ter o equipamento, precisa de técnica — mencione isso
- Segurança: capacetes, joelheiras, luvas — quando são essenciais vs. opcionais
`,
  default: `
CRITÉRIOS GERAIS:
- Identifique o critério de compra mais importante desta categoria específica
- Explique o que diferencia produtos bons de ruins neste segmento
- Dê contexto de uso real: quem precisa, quando vale, quando não vale
`,
};

// ── Ângulos narrativos (anti-repetição) ─────────────────────────────────────
// Rotacionados automaticamente para evitar posts com mesma estrutura

const ANGULOS = [
  {
    nome: 'problema_invisivel',
    instrucao: `Comece identificando um PROBLEMA ESPECÍFICO que o consumidor típico desta categoria tem mas raramente articula.
Não diga "muita gente busca..." — seja cirúrgico. Ex para creatina: "Você talvez já tenha comprado creatina barata e não viu resultado — não porque creatina não funciona, mas porque pureza importa."
O produto resolve esse problema específico.`,
  },
  {
    nome: 'mito_desmontado',
    instrucao: `Comece quebrando um mito ou equívoco REAL e comum sobre esta categoria ou produto.
Ex: "Creatina não é só para quem quer ficar enorme. É um dos suplementos mais estudados da história, com benefícios documentados para força, memória e até saúde cardiovascular."
Depois posicione o produto dentro dessa realidade correta.`,
  },
  {
    nome: 'criterio_oculto',
    instrucao: `Revele um critério de compra que a maioria ignora mas que separa um produto bom de um ótimo nesta categoria.
Ex para creatina: a maioria olha o preço por grama. O critério oculto é a pureza e o processo de fabricação.
Apresente o produto como alguém que entende esse critério.`,
  },
  {
    nome: 'contexto_uso_real',
    instrucao: `Descreva com detalhe uma situação de uso REAL e específica — não abstrata.
Ex: "São 6h da manhã. Treino em jejum antes do trabalho. Você precisa de algo que dissolva bem, não cause desconforto gástrico e faça efeito consistente ao longo de semanas."
O produto se encaixa nesse cenário de forma natural.`,
  },
  {
    nome: 'custo_de_errar',
    instrucao: `Comece pelo custo REAL de fazer a escolha errada nesta categoria — não o custo financeiro, mas o custo em tempo, resultado ou saúde.
Ex: "Três meses de suplemento ruim não são só dinheiro perdido — são três meses de treino sem a recuperação que você merecia."
Depois apresente o produto como a escolha que elimina esse risco.`,
  },
];

// ── Constrói prompt editorial ────────────────────────────────────────────────

function construirPrompt(produto, arquetipo, variacoes, contextoSerper) {
  // Seleciona ângulo de forma determinística baseado no título do produto
  // (mesmo produto = mesmo ângulo; produtos diferentes = ângulos diferentes)
  const hash = produto.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const angulo = ANGULOS[hash % ANGULOS.length];

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
    ? `\n### CONTEXTO EXTERNO (use como referência de linguagem, não cite fontes):\n${JSON.stringify(contextoSerper, null, 2)}`
    : '';

  const systemPrompt = `Você é um redator editorial especializado em reviews de produtos para consumidores brasileiros.
Sua escrita tem VOZ PRÓPRIA — opinativa, direta, tecnicamente fundamentada.
Você não escreve marketing: você ajuda o leitor a tomar uma decisão melhor.

═══════════════════════════════════════════
ÂNGULO NARRATIVO DESTE POST: ${angulo.nome}
═══════════════════════════════════════════
${angulo.instrucao}

═══════════════════════════════════════════
GUIA TÉCNICO DA CATEGORIA
═══════════════════════════════════════════
${guia}

═══════════════════════════════════════════
REGRAS EDITORIAIS (INVIOLÁVEIS)
═══════════════════════════════════════════

1. VOZ: Opine. Não use "pode ser interessante", "pode ser uma boa opção", "é uma alternativa".
   Use: "faz sentido para quem...", "vale especialmente se...", "não é para todo mundo, mas se X, então sim."

2. ESPECIFICIDADE: Nunca escreva frases que servem para qualquer produto.
   PROIBIDO: "alta qualidade", "ótimo custo-benefício", "produto excelente", "vale a pena".
   OBRIGADO: conectar cada qualidade a um benefício concreto e específico.

3. EVERGREEN REAL: Sem datas, notas numéricas de avaliação, rankings, preços.
   Em vez de "nota 4.8": "a consistência nos relatos de quem usa é o que mais chama atenção".
   Em vez de "lançado em 2024": simplesmente ignore a data.

4. REPETIÇÃO ZERO: Cada seção deve fazer uma afirmação diferente.
   Se já disse que o produto tem boa absorção, não repita nas seções seguintes.
   Avance a argumentação — cada parágrafo deve agregar algo novo.

5. PROIBIÇÕES ABSOLUTAS:
   - Nunca cite preço exato ou faixa de preço
   - Nunca invente especificações que não estão nos dados do produto
   - Nunca use metalinguagem: "neste artigo", "vamos ver", "aqui você vai aprender"
   - Nunca comece parágrafos com "Além disso," ou "Ademais,"
   - Nunca use o nome do produto mais de 3x no texto inteiro — use pronomes e variações
   - Nunca repita o mesmo adjetivo mais de 1x no texto

6. ESTRUTURA:
   - Use ## para títulos de seção (títulos específicos, não genéricos como "Conclusão")
   - Parágrafos máximos de 4 linhas — escanável
   - Listas com - apenas para especificações reais
   - **Negrito** apenas em termos técnicos ou afirmações centrais
   - Extensão: 900-1100 palavras (nem mais, nem menos)

7. FECHAMENTO:
   O CTA deve ser consequência natural do texto — não um botão colado.
   Ex: "Se o que foi descrito aqui conversa com o que você busca, as condições atuais estão na Amazon."
   NUNCA use: "não perca essa oportunidade", "aproveite agora", "clique e compre".

ARQUÉTIPO ESTRUTURAL: ${arquetipo.nome}
ESTRUTURA:
${JSON.stringify(arquetipo.estrutura, null, 2)}

VARIAÇÕES:
- Título: ${variacoes.titulo}
- Abertura: ${variacoes.abertura}
- Transição: ${variacoes.transicao}
- Fechamento: ${variacoes.fechamento}
- CTA: ${variacoes.cta.texto}`;

  const userPrompt = `Escreva o artigo completo para este produto, seguindo todas as regras editoriais.

PRODUTO:
${dadosProduto}
${contextoExterno}

IMPORTANTE:
- Aplique o ângulo "${angulo.nome}" logo na abertura
- Use o guia técnico da categoria para dar profundidade real
- Cada seção deve avançar o argumento (não repetir)
- O leitor deve terminar sabendo mais sobre esta categoria do que quando chegou`;

  return { systemPrompt, userPrompt };
}

// ── Export principal ─────────────────────────────────────────────────────────

export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  console.log(`   🤖 Groq — ângulo e categoria carregados...`);

  try {
    const { systemPrompt, userPrompt } = construirPrompt(produto, arquetipo, variacoes, contextoSerper);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
    const conteudo = await groqRequest(messages, groqApiKey);
    console.log(`   ✅ Conteúdo gerado (~${conteudo.length} chars)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Groq falhou: ${error.message}`);
    console.log('   💡 Usando fallback básico...');
    return gerarConteudoFallback(produto, variacoes);
  }
}

// ── Fallback ─────────────────────────────────────────────────────────────────

function gerarConteudoFallback(produto, variacoes) {
  const specsBlock = produto.specs?.length
    ? `\n## Especificações\n\n${produto.specs.join('\n')}\n`
    : '';
  return `${variacoes.abertura}\n\n${produto.title} está disponível na ${produto.store} com entrega para todo o Brasil.\n${specsBlock}\n## Vale a Pena?\n\n${variacoes.transicao}\n\n${produto.description}\n\n${variacoes.fechamento}. ${variacoes.cta.gatilho}.\n\n---\n\n*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*`;
}
