/**
 * Groq AI Service - Protocolo Editorial v3
 * AchadoCerto.VIP
 *
 * Combina:
 * - Template Coringa Evergreen
 * - SEO semântico invisível
 * - FAQ automático
 * - Guias técnicos por categoria
 * - Ângulos narrativos rotativos
 */

import https from 'https';

function groqRequest(messages, apiKey, model = 'llama-3.3-70b-versatile') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.74,
      max_tokens: 3200,
      top_p: 0.92,
      frequency_penalty: 0.5,
      presence_penalty: 0.32
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
- Creatina: diferencie monohidratada (mais estudada), creapure (pureza certificada), micronizada (dissolução)
- Proteínas: fale sobre perfil de aminoácidos, concentração proteica e digestibilidade
- Pré-treinos: cafeína, beta-alanina, citrulina e tolerância individual
- Vitaminas: biodisponibilidade das formas importa mais do que marketing da embalagem
- Regra de ouro: qualquer suplemento depende de constância, dieta e treino adequados
- Nunca prometa resultados específicos
`,
  tecnologia: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Processador, memória e armazenamento devem ser traduzidos em uso real
- Display: brilho, fidelidade, taxa de atualização e tipo de painel mudam a experiência
- Bateria: autonomia real importa mais do que número isolado de mAh
- Câmera: sensor, processamento e cenário de uso valem mais que megapixels soltos
- Explique sempre o impacto prático dos recursos
`,
  beleza: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Diferencie ativos, concentração, textura e compatibilidade com tipos de pele/cabelo
- Fórmula e rotina importam mais que embalagem
- Explique quando o produto faz sentido e quando pode não ser o ideal
- Evite promessas absolutas; prefira linguagem responsável
`,
  casa: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Material, capacidade, consumo, montagem e durabilidade precisam ser contextualizados
- Explique o ganho prático no uso cotidiano
- Diferencie apelo visual de funcionalidade real
`,
  esportes: `
CRITÉRIOS TÉCNICOS DESTA CATEGORIA:
- Ergonomia, material, segurança e perfil de uso definem o valor real
- Nem sempre o mais técnico é o melhor para o usuário comum
- Traduza ficha técnica em conforto, estabilidade, resistência e rotina de uso
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

function construirPrompt(produto, arquetipo, variacoes, contextoSerper) {
  const hash = (produto.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const angulo = ANGULOS[hash % ANGULOS.length];
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
Seu texto precisa parecer de um portal editorial real, não de um gerador automático.
Você combina análise prática, leitura escaneável, opinião equilibrada e linguagem humana.

════════════════════════════════════
OBJETIVO CENTRAL
════════════════════════════════════
Criar um review profissional, evergreen e otimizado para SEO sobre um produto.
O texto deve parecer humano, editorial, confiável e atual, sem cara de IA.

════════════════════════════════════
ÂNGULO NARRATIVO DESTE POST
════════════════════════════════════
Nome: ${angulo.nome}
Diretriz: ${angulo.instrucao}

════════════════════════════════════
GUIA TÉCNICO DA CATEGORIA
════════════════════════════════════
${guia}

════════════════════════════════════
PROTOCOLO EDITORIAL PADRÃO
════════════════════════════════════
1. O texto NÃO pode parecer template, mesmo seguindo uma lógica modular.
2. A estrutura deve variar: ordem de blocos, ritmo, tamanho dos parágrafos, títulos e transições.
3. Misture análise técnica com percepção de experiência de uso.
4. O SEO deve ser invisível: natural, sem repetição artificial de palavra-chave.
5. O texto deve soar profissional, humano e editorial.
6. O review deve ser atemporal: nada de datas, hype temporal, “este ano”, “últimos meses”, “lançamento recente”.
7. Não use marketing exagerado, urgência artificial ou tom de vendedor.
8. Não use “em conclusão”, “além disso” repetidamente, “produto excelente”, “alta qualidade”, “vale muito a pena” como frases vazias.
9. Evite frases genéricas que servem para qualquer produto.
10. Cada seção deve acrescentar algo novo. Não repetir benefício com palavras diferentes.

════════════════════════════════════
SEO INVISÍVEL
════════════════════════════════════
- Use a palavra-chave principal no título, no primeiro parágrafo, em pelo menos 1 H2, na conclusão e naturalmente no texto.
- Misture termos semânticos como: análise, avaliação, opinião, experiência, desempenho, recursos, qualidade, custo-benefício, comparativo, vale a pena.
- Inclua perguntas naturais que ajudem em snippet e cauda longa.
- O texto não pode parecer “otimizado demais”.

════════════════════════════════════
ESTRUTURA RECOMENDADA
════════════════════════════════════
Você NÃO deve usar sempre todos os blocos nem sempre na mesma ordem.
Escolha dinamicamente entre 4 e 7 blocos centrais, além da abertura, FAQ, conclusão e CTA.

Blocos possíveis:
- Resumo rápido com prós, contras e perfil ideal
- Experiência geral / percepção prática
- Principais diferenciais
- Desempenho no uso diário
- Design e construção
- Facilidade de uso
- Recursos principais
- Durabilidade / consistência
- Custo-benefício contextual
- Comparação contextual com concorrentes
- O que poderia ser melhor
- Para quem faz sentido
- Pontos que a maioria ignora
- O que esperar no longo prazo

════════════════════════════════════
REGRAS DE FORMATO
════════════════════════════════════
- Gere em Markdown, sem frontmatter
- Use 1 H1 atrativo e natural
- Use entre 5 e 9 H2 dinâmicos
- Pode usar alguns H3 quando fizer sentido
- Inclua um bloco de resumo rápido com prós, contras e perfil indicado
- Inclua FAQ no final com 4 a 6 perguntas reais e respostas objetivas
- Termine com conclusão natural + CTA leve
- Parágrafos com tamanhos variados
- Misture frases curtas com médias
- Use listas apenas quando agregarem escaneabilidade real
- Evite blocos enormes e repetitivos

════════════════════════════════════
TÍTULOS E H2
════════════════════════════════════
- Nunca use H2 genéricos como “Conclusão”, “Design”, “Desempenho” de forma seca e repetitiva.
- Prefira títulos como:
  - O que esperar do [produto] no uso diário
  - Onde esse modelo mais se destaca
  - O ponto mais interessante dessa proposta
  - O que considerar antes da compra
  - Para quem esse produto realmente faz sentido
- Varie os títulos naturalmente.

════════════════════════════════════
ABERTURA HUMANIZADA
════════════════════════════════════
- A abertura é obrigatoriamente variável.
- Pode seguir uma linha de dor, curiosidade, contexto, comparativo ou observação prática.
- Aplique o ângulo narrativo já definido.
- O primeiro parágrafo deve parecer editorial e prender a leitura.

════════════════════════════════════
PONTOS DE ESTILO ANTI-IA
════════════════════════════════════
- Use micro-observações como “na prática”, “dependendo do perfil”, “o equilíbrio aqui”, “isso chama atenção”, “para uso cotidiano”, “mais consistente do que impressionante”, quando fizer sentido.
- Alterne cadência e formalidade com naturalidade.
- Evite adjetivos repetidos.
- Não pareça catálogo nem ficha técnica reescrita.
- Não diga que “testou” o produto se isso não estiver comprovado.
- Se não houver dado, não invente.

════════════════════════════════════
CTA E FECHAMENTO
════════════════════════════════════
- O CTA deve ser discreto e contextual.
- Exemplos de linha final aceitável:
  - Verificar as condições atuais pode fazer sentido, especialmente se a proposta descrita aqui combina com o seu perfil.
  - Comparar versões e ofertas disponíveis ajuda a entender se essa é a escolha mais equilibrada.
  - Dependendo das condições do momento, o custo-benefício pode ficar ainda mais interessante.
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

DADOS DE APOIO DE VARIAÇÃO:
- Arquétipo: ${arquetipo.nome}
- Estrutura-base do arquétipo: ${JSON.stringify(arquetipo.estrutura, null, 2)}
- Título sugerido: ${variacoes.titulo}
- Abertura sugerida: ${variacoes.abertura}
- Transição sugerida: ${variacoes.transicao}
- Fechamento sugerido: ${variacoes.fechamento}
- CTA sugerido: ${variacoes.cta?.texto || ''}

TAMANHO ALVO:
- Produza um review entre 1600 e 2400 palavras.
- Priorize profundidade real, não enchimento.`;

  const userPrompt = `Crie o review completo para este produto seguindo rigorosamente o protocolo editorial.

PRODUTO:
${dadosProduto}
${contextoExterno}

INSTRUÇÕES FINAIS:
- O texto precisa parecer humano e editorial
- Use SEO semântico invisível
- Aplique o ângulo "${angulo.nome}"
- Traga profundidade técnica conforme a categoria
- Faça o leitor sentir que entendeu melhor a compra ao terminar a leitura
- Inclua FAQ estratégico no final
- Mantenha o tom evergreen e profissional`;

  return { systemPrompt, userPrompt };
}

export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  console.log(`   🤖 Groq — protocolo editorial v3 carregado...`);

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
