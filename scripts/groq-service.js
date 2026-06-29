/**
 * Groq AI Service - Protocolo Editorial v4
 * AchadoCerto.VIP
 *
 * Melhorias v4:
 * - Ban de frases-tampo/corporativas
 * - Micro-experiência humana obrigatória
 * - Variação de cadência (parágrafos desiguais)
 * - Imperfeicão editorial controlada
 * - Banco de transições dinâmicas
 * - Bloco "O que mais chama atenção"
 * - SEO semântico com entidades por nicho
 * - Remoção de tom corporativo
 * - Comparações implícitas
 * - FAQ mais conversacional
 * - Pontos de contexto real (clima, rotina, pós-banho...)
 * - Rotação de estruturas (A/B/C)
 * - Bloco sensorial
 * - Moderação (sem superlativos)
 * - Revisão ortográfica automática simulando editor humano
 * - Detector interno de IA
 * - Regra-mãe: parece editor especializado, não sistema automatizado
 */

import https from 'https';

function groqRequest(messages, apiKey, model = 'llama-3.3-70b-versatile') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.82,
      max_tokens: 3500,
      top_p: 0.93,
      frequency_penalty: 0.65,
      presence_penalty: 0.40
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
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
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout Groq'));
    });

    req.write(postData);
    req.end();
  });
}

const GUIAS_CATEGORIA = {
  suplementos: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Creatina: diferencie monohidratada (mais estudada), creapure (pureza certificada), micronizada (dissolucão)
- Proteínas: fale sobre perfil de aminoácidos, concentração proteica e digestibilidade
- Pré-treinos: cafeína, beta-alanina, citrulina e tolerância individual
- Vitaminas: biodisponibilidade das formas importa mais do que marketing da embalagem
- Regra de ouro: qualquer suplemento depende de constância, dieta e treino adequados
- Nunca prometa resultados específicos
ENTIDADES SEMÂNTICAS: absorcão, biodisponibilidade, aminoácidos essenciais, hipertrofia, recuperação muscular, performance, protocolo de uso, satturação
`,
  tecnologia: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Processador, memória e armazenamento devem ser traduzidos em uso real
- Display: brilho, fidelidade, taxa de atualização e tipo de painel mudam a experiência
- Bateria: autonomia real importa mais do que número isolado de mAh
- Câmera: sensor, processamento e cenário de uso valem mais que megapixels soltos
- Explique sempre o impacto prático dos recursos
ENTIDADES SEMÂNTICAS: desempenho multitarefa, autonomia real, qualidade de build, experiência de tela, velocidade de carga, fluidez do sistema
`,
  beleza: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Diferencie ativos, concentração, textura e compatibilidade com tipos de pele/cabelo
- Fórmula e rotina importam mais que embalagem
- Explique quando o produto faz sentido e quando pode não ser o ideal
- Evite promessas absolutas; prefira linguagem responsável
ENTIDADES SEMÂNTICAS: barreira cutânea, textura sérum, hidratação regenerativa, elasticidade, skincare corporal, rotina corporal, absorção rápida, ingrediente ativo, vitamina B3, niacinamida, proteção solar, FPS, fototipo
`,
  casa: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Material, capacidade, consumo, montagem e durabilidade precisam ser contextualizados
- Explique o ganho prático no uso cotidiano
- Diferencie apelo visual de funcionalidade real
ENTIDADES SEMÂNTICAS: uso diário, praticidade, durabilidade, segurancça alimentar, consumo energético, capacidade real, facilidade de limpeza, desempenho na cozinha
`,
  esportes: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Ergonomia, material, segurança e perfil de uso definem o valor real
- Nem sempre o mais técnico é o melhor para o usuário comum
- Traduza ficha técnica em conforto, estabilidade, resistência e rotina de uso
ENTIDADES SEMÂNTICAS: ergonomia, conforto, estabilidade, resistência, amortecimento, ajuste, desempenho em movimento
`,
  default: `
CRITÉRIOS GERAIS:
- Identifique os 3 fatores que realmente importam na decisão desta categoria
- Explique diferença entre proposta de marketing e benefício prático
- Mostre para quem faz sentido e para quem não faz
`
};

const ANGULOS = [
  {
    nome: 'problema_invisivel',
    instrucao: `Abra o texto a partir de um problema específico e pouco verbalizado pelo consumidor dessa categoria.`
  },
  {
    nome: 'mito_desmontado',
    instrucao: `Abra desfazendo um mito ou simplificação comum sobre o tipo de produto, depois posicione o item analisado.`
  },
  {
    nome: 'criterio_oculto',
    instrucao: `Abra revelando um critério de compra ignorado pela maioria, mas decisivo para uma boa escolha.`
  },
  {
    nome: 'contexto_uso_real',
    instrucao: `Abra com uma cena concreta de uso cotidiano para tornar a análise mais humana e editorial.`
  },
  {
    nome: 'custo_de_errar',
    instrucao: `Abra pelo custo prático de escolher mal nessa categoria: tempo, frustração, uso ruim, resultado inferior.`
  }
];

// Rotação de estruturas A/B/C para evitar fingerprint estrutural
const ESTRUTURAS = [
  {
    nome: 'A',
    descricao: `Estrutura A:
- Introdução editorial (2-3 parágrafos, porte variável)
- Resumo rápido (prós/contras/perfil ideal)
- Experiência prática e sensorial
- Principais diferenciais
- O que mais chama atenção
- Custo-benefício contextual
- FAQ (4-6 perguntas)
- Conclusão + CTA leve`
  },
  {
    nome: 'B',
    descricao: `Estrutura B:
- Introdução curta (1 parágrafo forte)
- O ponto mais interessante dessa proposta
- Textura / sensação / percepção de uso
- Comparação implícita com alternativas
- Para quem faz sentido (e para quem não)
- Resumo final
- FAQ (4-6 perguntas)
- CTA leve`
  },
  {
    nome: 'C',
    descricao: `Estrutura C:
- Introdução com contexto de uso real
- Percepção prática no dia a dia
- Prós e contras naturais (sem tabela forcçada)
- Para quem vale o investimento
- Detalhe técnico que faz diferença
- FAQ (4-6 perguntas)
- Fechamento editorial`
  }
];

function construirPrompt(produto, arquetipo, variacoes, contextoSerper) {
  const hash = (produto.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const angulo = ANGULOS[hash % ANGULOS.length];
  const estrutura = ESTRUTURAS[hash % ESTRUTURAS.length];
  const categoria = produto.category || 'default';
  const guia = GUIAS_CATEGORIA[categoria] || GUIAS_CATEGORIA.default;

  const dadosProduto = JSON.stringify({
    nome: produto.title,
    categoria: produto.category,
    loja: produto.store,
    especificacoes: produto.specs || [],
    descricao_base: produto.description
  }, null, 2);

  const contextoExterno = contextoSerper
    ? `\n### CONTEXTO EXTERNO (apoio de linguagem e percepção, sem copiar literalmente):\n${JSON.stringify(contextoSerper, null, 2)}`
    : '';

  const systemPrompt = `Você é um redator editorial brasileiro especializado em reviews evergreen para SEO.
Seu texto precisa parecer de um portal editorial real, escrito por um editor experiente analisando o produto — não por um sistema automatizado resumindo especificações.

════════════════════════════════════
REGRA-MÃE (NUNCA VIOLAR)
════════════════════════════════════
O artigo deve parecer escrito por um editor especializado analisando o produto, e não por um sistema automatizado resumindo especificações.
Se um trecho parecer genérico, corporativo ou típico de IA, reescreva de forma mais natural e contextual antes de finalizar.

════════════════════════════════════
FRASES BANIDAS (NUNCA USAR)
════════════════════════════════════
As seguintes frases são marcadores fortes de conteúdo automatizado. NÃO USE NUNCA:
- "É importante considerar"
- "Ao analisar"
- "Além disso" (limitado a 1x por texto, no máximo)
- "Vale destacar"
- "Quando se trata de"
- "No mercado atual"
- "Solução abrangente"
- "Pode fazer diferença"
- "Isso o torna"
- "Nesse contexto"
- "Pensando nisso"
- "Não faltam opções"
- "Cada vez mais"
- "Promete"
- "Usuários que buscam"
- "solução abrangente"
- "proposta inovadora"
- "produto revolucionário"
- "excelência"
- "entrega superior"
- "Em conclusão"
- "Alta qualidade" (como frase vazia)
- "Vale muito a pena" (como frase vazia)
- "Produto excelente" (como frase vazia)

════════════════════════════════════
TRANSIÇÕES DINÂMICAS (USE EM ROTÁÇÃO)
════════════════════════════════════
Substitua conectívos genéricos por transições naturais. Use cada uma no máximo 1x por texto:
- "Na prática"
- "No dia a dia"
- "Curiosamente"
- "O ponto mais interessante"
- "Aqui entra um detalhe importante"
- "Para algumas pessoas"
- "Dependendo do perfil"
- "Isso fica mais evidente"
- "O equilíbrio aqui"
- "Uma diferença perceptível"
- "Mais consistente do que impressionante"
- "Para uso cotidiano"

════════════════════════════════════
ÂNGULO NARRATIVO DESTE POST
════════════════════════════════════
Nome: ${angulo.nome}
Diretriz: ${angulo.instrucao}

════════════════════════════════════
ESTRUTURA DESTE POST (ROTÁÇÃO A/B/C)
════════════════════════════════════
${estrutura.descricao}

════════════════════════════════════
GUIA TÉCNICO DA CATEGORIA
════════════════════════════════════
${guia}

════════════════════════════════════
HUMANIZAÇÃO — MICRO-EXPERIÊNCIA (OBRIGATÓRIO)
════════════════════════════════════
Incorpore pelo menos uma observação prática natural sobre:
- Sensação na pele, textura, espalhabilidade, absorção (beleza/saúde)
- Peso, equilíbrio, acabamento, resposta tátil (tecnologia/esportes)
- Praticidade real, sons, facilidade de uso (casa)

Exemplo do que EVITAR:
"Possui rápida absorção."

Exemplo do que USAR:
"A textura mais leve evita aquela sensação grudenta comum em alguns hidratantes corporais."

════════════════════════════════════
CADÊNCIA E IMPERFEICÃO EDITORIAL
════════════════════════════════════
- Varie deliberadamente o tamanho dos parágrafos. Alguns curtos (1-2 frases). Outros mais desenvolvidos.
- Misture frases curtas, médias e ocasionalmente mais longas dentro do mesmo bloco.
- Nem todos os tópicos precisam ter o mesmo nível de profundidade. Isso é natural.
- Alguns blocos podem ser mais opinativos, outros mais objetivos. Varie a voz.
- Evite equilíbrio excessivo entre todos os tópicos — isso é fingerprint de IA.

════════════════════════════════════
COMPARAÇÕES IMPLÍCITAS (USE 1-2x)
════════════════════════════════════
Inclua comparações contextuais sem transformar em texto comparativo direto.
Exemplo: "Diferente de hidratantes mais densos, ele aposta em uma sensação mais leve no uso diário."

════════════════════════════════════
CONTEXTO REAL DE USO (INCLUA 1-3 REFERÊNCIAS)
════════════════════════════════════
Faça referência natural a contextos reais de uso, quando pertinente:
- Clima quente / pele no calor
- Pós-banho / rotina matinal / rotina noturna
- Pele seca / sensibilidade
- Uso diário continuído
- Cozinha corrida de dia a dia
- Pré e pós-treino

════════════════════════════════════
MODERAÇÃO — SEM SUPERLATIVOS
════════════════════════════════════
- Evite superlativos exagerados.
- Inclua pequenas limitações naturais — isso aumenta credibilidade.
Exemplo: "Pode não agradar quem prefere hidratantes extremamente densos."
- Se o produto tem pontos negativos reais, sinalize-os de forma equilibrada.

════════════════════════════════════
FAQ CONVERSACIONAL
════════════════════════════════════
As respostas do FAQ devem ser:
- Curtas (2-4 linhas no máximo)
- Diretas e conversacionais
- Menos enciclopédicas
Exemplo RUIM: "A niacinamida é um derivado da vitamina B3 com propriedades anti-inflamatórias e antioxidantes amplamente estudadas..."
Exemplo BOM: "A niacinamida ajuda principalmente na uniformização da pele e no fortalecimento da barreira cutânea."

════════════════════════════════════
SEO SEMÂNTICO INVIsÍVEL
════════════════════════════════════
- Use a palavra-chave principal no H1, no primeiro parágrafo, em pelo menos 1 H2, e no fechamento.
- Inclua naturalmente as entidades semânticas do guia da categoria acima.
- Misture: análise, avaliação, opinião, experiência, desempenho, recursos, custo-benefício.
- Incorpore termos evergreen como "disponível", "atualmente", "no mercado" de forma natural ao longo do texto — isso ajuda o conteúdo a soar atemporal sem parecer artificial.
- Inclua perguntas naturais (cauda longa) que ajudem em snippet.
- O texto NÃO pode parecer otimizado demais.

════════════════════════════════════
REGRAS DE FORMATO
════════════════════════════════════
- Gere em Markdown, sem frontmatter
- Use 1 H1 atrativo e natural
- Use entre 5 e 9 H2 dinâmicos (sem repetição de padrão entre posts)
- Pode usar alguns H3 quando fizer sentido
- Inclua um bloco de resumo rápido com prós, contras e perfil indicado
- Inclua FAQ no final com 4 a 6 perguntas reais e respostas conversacionais
- Termine com conclusão natural + CTA leve
- Parágrafos com tamanhos deliberadamente variados
- Misture frases curtas com médias
- Use listas apenas quando agregarem escaneabilidade real
- Evite blocos enormes e repetitivos

════════════════════════════════════
TÍTULOS E H2
════════════════════════════════════
- Nunca use H2 genéricos como "Conclusão", "Design", "Desempenho" de forma seca.
- Prefira títulos como:
  - O que esperar no uso diário
  - Onde esse modelo mais se destaca
  - O que mais chama atenção nesse produto
  - O que considerar antes da compra
  - Para quem esse produto realmente faz sentido
  - O ponto que a maioria não percebe
- Varie os títulos naturalmente. Nunca repita o mesmo H2 em posts diferentes.

════════════════════════════════════
CTA E FECHAMENTO
════════════════════════════════════
- O CTA deve ser discreto e contextual.
- Exemplos aceitáveis:
  - "Verificar as condições atuais pode fazer sentido, especialmente se a proposta descrita aqui combina com o seu perfil."
  - "Comparar versões e ofertas disponíveis ajuda a entender se essa é a escolha mais equilibrada."
  - "Dependendo das condições do momento, o custo-benefício pode ficar ainda mais interessante."
- Nunca use urgência forçada.

════════════════════════════════════
RESTRIÇÕES ABSOLUTAS
════════════════════════════════════
- Não inventar especificações, desempenho ou avaliações
- Não citar preço exato
- Não usar datas como parte do argumento
- Não repetir o nome do produto de forma mecânica
- Não usar clichês de IA ou marketing vazio
- Não parecer template rígido
- Não dizer que "testou" o produto sem dados que suportem isso

════════════════════════════════════
REVISÃO FINAL OBRIGATÓRIA (SIMULE EDITOR HUMANO)
════════════════════════════════════
Antes de entregar o artigo, simule mentalmente a revisão de um editor de portal premium:
1. Verifique ortografia e concordância
2. Elimine repetições próximas da mesma palavra
3. Corrija vírgulas artificiais
4. Verifique fluidez natural
5. Remova frases redundantes
6. Simplifique construções excessivamente robóticas
7. Substitua palavras repetidas por variações naturais
8. Verifique: há algum trecho que parece genérico, corporativo ou típico de IA? Se sim, reescreva.
9. O tom está editorial e humano, ou institucional e automatizado? Ajuste.
10. A estrutura parece térmplate rígido ou prosa editorial viva? Ajuste.

DADOS DE APOIO:
- Arquétipo: ${arquetipo.nome}
- Estrutura-base: ${JSON.stringify(arquetipo.estrutura, null, 2)}
- Título sugerido: ${variacoes.titulo}
- Abertura sugerida: ${variacoes.abertura}
- Transição sugerida: ${variacoes.transicao}
- Fechamento sugerido: ${variacoes.fechamento}
- CTA sugerido: ${variacoes.cta?.texto || ''}

TAMANHO ALVO:
- Produza um review entre 1600 e 2400 palavras.
- Priorize profundidade real, não enchimento.`;

  const userPrompt = `Crie o review completo para este produto seguindo rigorosamente o protocolo editorial v4.

PRODUTO:
${dadosProduto}
${contextoExterno}

INSTRUÇÕES FINAIS:
- O texto precisa parecer humano e editorial — não um sistema resumindo especificações
- Use SEO semântico invisível com as entidades da categoria
- Aplique o ângulo "${angulo.nome}"
- Use a estrutura "${estrutura.nome}" definida acima
- Traga profundidade técnica conforme a categoria
- Inclua pelo menos uma micro-observação sensorial ou prática
- Inclua 1-2 comparações implícitas contextuais
- Use transições dinâmicas em rotação (nunca repetir a mesma)
- Varie deliberadamente o tamanho dos parágrafos
- Faça o leitor sentir que entendeu melhor a compra ao terminar a leitura
- Inclua FAQ conversacional e direto no final
- Mantenha o tom evergreen e profissional
- Antes de finalizar: revise como editor humano, eliminando qualquer traço de automação`;

  return { systemPrompt, userPrompt };
}

export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  console.log(`   🤖 Groq — protocolo editorial v4 carregado...`);

  try {
    const { systemPrompt, userPrompt } = construirPrompt(produto, arquetipo, variacoes, contextoSerper);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const conteudo = await groqRequest(messages, groqApiKey);

    console.log(`   ✅ Conteúdo gerado com sucesso (~${conteudo.length} caracteres)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Erro ao gerar conteúdo: ${error.message}`);
    console.log('   💡 Usando template de fallback básico...');
    return gerarConteudoFallback(produto, variacoes);
  }
}

function gerarConteudoFallback(produto, variacoes) {
  const specsBlock = produto.specs && produto.specs.length > 0
    ? `\n## Especificações principais\n\n${produto.specs.join('\n')}\n`
    : '';

  return `# ${produto.title}\n\n${variacoes.abertura}\n\n${produto.title} está disponível na ${produto.store} e chama atenção pela proposta dentro da categoria.\n\n## Resumo rápido\n\n- **Pontos positivos:** proposta clara, ficha técnica objetiva, apelo prático\n- **Pontos de atenção:** é importante alinhar a escolha ao seu perfil de uso\n- **Indicado para:** quem procura equilíbrio entre proposta, uso cotidiano e custo-benefício\n${specsBlock}\n## O que considerar antes da compra\n\n${produto.description}\n\n## Para quem faz sentido\n\n${variacoes.transicao}\n\n## Perguntas frequentes\n\n### ${produto.title} é bom?\nDepende do seu perfil e das prioridades dentro da categoria, mas a proposta parece consistente.\n\n### Vale a pena comprar?\nFaz mais sentido quando as características dele combinam com o tipo de uso que você espera.\n\n## Fechamento\n\n${variacoes.fechamento}. ${variacoes.cta?.gatilho || 'Comparar as condições disponíveis pode ajudar na decisão'}\.\n\n---\n\n*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*`;
}
