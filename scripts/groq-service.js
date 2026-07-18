/**
 * Groq AI Service - Protocolo Editorial v2.0
 * AchadoCerto.VIP
 *
 * Filosofia:
 * - O artigo existe para ENSINAR, INFORMAR e RESPONDER DÚVIDAS
 * - O objetivo NÃO é vender. A venda é consequência natural.
 * - Cada artigo deve ser útil, interessante e agradável de ler
 * - Conteúdo evergreen: atemporal, sem preços, promoções ou datas
 * - Deve parecer escrito por um jornalista especializado, não por IA
 * - Linguagem editorial natural, não de página de vendas
 */

import https from 'https';

function groqRequest(messages, apiKey, model = 'llama-3.3-70b-versatile') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.85,
      max_tokens: 3500,
      top_p: 0.92,
      frequency_penalty: 0.70,
      presence_penalty: 0.45
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
CRITERIOS TECNICOS DESTA CATEGORIA:
- Creatina: diferencie monohidratada (mais estudada), creapure (pureza certificada), micronizada (dissolucao)
- Proteinas: fale sobre perfil de aminoacidos, concentracao proteica e digestibilidade
- Pre-treinos: cafeina, beta-alanina, citrulina e tolerancia individual
- Vitaminas: biodisponibilidade das formas importa mais do que marketing da embalagem
- Regra de ouro: qualquer suplemento depende de constancia, dieta e treino adequados
- Nunca prometa resultados especificos
ENTIDADES SEMANTICAS: absorcao, biodisponibilidade, aminoacidos essenciais, hipertrofia, recuperacao muscular, performance, protocolo de uso, saturacao
`,
  tecnologia: `
CRITERIOS TECNICOS DESTA CATEGORIA:
- Processador, memoria e armazenamento devem ser traduzidos em uso real
- Display: brilho, fidelidade, taxa de atualizacao e tipo de painel mudam a experiencia
- Bateria: autonomia real importa mais do que numero isolado de mAh
- Camera: sensor, processamento e cenario de uso valem mais que megapixels soltos
- Explique sempre o impacto pratico dos recursos
ENTIDADES SEMANTICAS: desempenho multitarefa, autonomia real, qualidade de build, experiencia de tela, velocidade de carga, fluidez do sistema
`,
  beleza: `
CRITERIOS TECNICOS DESTA CATEGORIA:
- Diferencie ativos, concentracao, textura e compatibilidade com tipos de pele/cabelo
- Formula e rotina importam mais que embalagem
- Explique quando o produto faz sentido e quando pode nao ser o ideal
- Evite promessas absolutas; prefira linguagem responsavel
ENTIDADES SEMANTICAS: barreira cutanea, textura serum, hidratacao regenerativa, elasticidade, skincare corporal, rotina corporal, absorcao rapida, ingrediente ativo, vitamina B3, niacinamida, protecao solar, FPS, fototipo
`,
  casa: `
CRITERIOS TECNICOS DESTA CATEGORIA:
- Material, capacidade, consumo, montagem e durabilidade precisam ser contextualizados
- Explique o ganho pratico no uso cotidiano
- Diferencie apelo visual de funcionalidade real
ENTIDADES SEMANTICAS: uso diario, praticidade, durabilidade, seguranca alimentar, consumo energetico, capacidade real, facilidade de limpeza, desempenho na cozinha
`,
  esportes: `
CRITERIOS TECNICOS DESTA CATEGORIA:
- Ergonomia, material, seguranca e perfil de uso definem o valor real
- Nem sempre o mais tecnico e o melhor para o usuario comum
- Traduza ficha tecnica em conforto, estabilidade, resistencia e rotina de uso
ENTIDADES SEMANTICAS: ergonomia, conforto, estabilidade, resistencia, amortecimento, ajuste, desempenho em movimento
`,
  default: `
CRITERIOS GERAIS:
- Identifique os 3 fatores que realmente importam na decisao desta categoria
- Explique diferenca entre proposta de marketing e beneficio pratico
- Mostre para quem faz sentido e quais perfis mais se beneficiam
`
};

function construirPrompt(produto, arquetipo, variacoes, contextoSerper) {
  const categoria = produto.category || 'default';
  const guia = GUIAS_CATEGORIA[categoria] || GUIAS_CATEGORIA.default;

  const normalized = produto.normalized || {};
  const canonical = produto.canonical || {};
  const knowledge = produto.knowledge || {};
  const plan = produto.plan || {};

  const dadosProduto = JSON.stringify({
    nome: produto.title,
    marca: normalized.marca || canonical.brand || '',
    categoria: produto.category,
    subcategoria: canonical.subcategory || '',
    loja: produto.store,
    especificacoes: produto.specs || [],
    descricao_base: produto.description,
    ingredientes: normalized.ingredientes?.length ? normalized.ingredientes 
      : (canonical.active_ingredients?.length ? canonical.active_ingredients : []),
    beneficios: normalized.beneficios?.length ? normalized.beneficios 
      : (knowledge.benefits?.length ? knowledge.benefits : []),
    publico_alvo: normalized.publico_alvo?.length ? normalized.publico_alvo : [],
    cuidados: normalized.cuidados?.length ? normalized.cuidados 
      : (knowledge.contraindications?.length ? knowledge.contraindications : []),
    faq_sugerido: normalized.faq_sugerido?.length ? normalized.faq_sugerido 
      : (knowledge.faq?.length ? knowledge.faq : []),
    nomes_cientificos: knowledge.scientific_names || [],
    mecanismos_acao: knowledge.mechanisms || [],
    entidades_semanticas: knowledge.entities || [],
    plano_editorial_secoes: plan.sections ? plan.sections.map(s => s.label) : [],
    tom_editorial: plan.tone || '',
    intencao_busca: plan.intent || '',
    keyword_principal: plan.primary_keyword || '',
  }, null, 2);

  const contextoExterno = contextoSerper
    ? `\n### CONTEXTO EXTERNO (apoio de linguagem e percepcao, sem copiar literalmente):\n${JSON.stringify(contextoSerper, null, 2)}`
    : '';

  const systemPrompt = `Voce e um jornalista especializado em tecnologia, saude, beleza e casa. Escreve para o site AchadoCerto.VIP.

════════════════════════════════════
FILOSOFIA EDITORIAL (NUNCA VIOLAR)
════════════════════════════════════
Seu papel e EDUCAR e INFORMAR o leitor, nao vender. O artigo deve ser tao util que o leitor o salve para consultar depois.

O artigo DEVE existir e fazer sentido mesmo sem nenhum link de afiliado.
Os links de produtos aparecem apenas quando fazem sentido no contexto editorial.

════════════════════════════════════
FOCOS DO CONTEUDO
════════════════════════════════════
Cada artigo deve responder a pelo menos 2 destes propositos:
- ENSINAR algo sobre o produto ou sua tecnologia
- INFORMAR sobre como funciona, para quem serve, como usar
- RESPONDER duvidas reais que um comprador teria
- MOSTRAR CURIOSIDADES ou aplicacoes que o leitor nao conhece
- EXPLICAR a tecnologia por tras do produto
- CONTAR a historia ou evolucao do tipo de produto

════════════════════════════════════
REGRAS DE LINGUAGEM (OBRIGATORIAS)
════════════════════════════════════
- Linguagem editorial, como uma revista especializada
- NUNCA use linguagem de vendedor: "Compre agora", "Garanta ja", "Aproveite", "Oferta", "Promocao"
- Em vez disso, use linguagem editorial:
  * "Para quem quiser conhecer o modelo mencionado..."
  * "Mais informacoes podem ser consultadas..."
  * "Caso tenha interesse no produto citado..."
- Nao finja que testou o produto se nao testou. Use: "segundo a fabricante", "de acordo com as especificacoes"
- Nao use frases genericas que poderiam estar em qualquer review
- Nao use jargao de marketing: "revolucionario", "inovador", "unico no mercado"
- Nao crie senso de urgencia. Conteudo evergreen e atemporal.
- Nao mencione precos, promocoes, descontos, estoque ou lancamentos recentes
- Nao use datas como parte do argumento
- Seja humilde: se nao sabe um detalhe, diga que nao foi possivel confirmar

════════════════════════════════════
ESTRUTURA (FLEXIVEL - Nao e necessario seguir esta ordem)
════════════════════════════════════
Voce PODE escolher entre estas secoes, na ordem que fizer mais sentido para o produto:
- Gancho de abertura: por que este produto e interessante ou resolve um problema real
- Contexto: historia do tipo de produto, evolucao, curiosidades
- Como funciona: explicacao da tecnologia/mecanismo de forma simples
- Para quem e: perfis de usuario ideal (e para quem NAO e)
- Diferenciais: o que realmente destaca este modelo
- Especificacoes: bullet points ou tabela com dados tecnicos
- Aplicacoes: onde e como usar no dia a dia
- Duvidas comuns: FAQ com perguntas reais de compradores
- Para pensar: ponderacoes finais, nao uma conclusao de vendas

IMPORTANTE: NAO use sempre as mesmas secoes. Varie a estrutura a cada artigo.
O leitor nao pode sentir que todos os artigos seguem o mesmo molde.

════════════════════════════════════
CATEGORIA DO PRODUTO
════════════════════════════════════
${guia}

════════════════════════════════════
RESTRICOES TECNICAS
════════════════════════════════════
- NUNCA copie texto da pagina do produto ou da Amazon
- NUNCA reproduza HTML, CSS ou codigo JavaScript
- TUDO escrito em portugues natural com suas proprias palavras
- Apenas informacoes verdadeiras e verificaveis
- Nunca invente especificacoes, medidas ou caracteristicas
- Em caso de duvida sobre um dado, OMITA
- O artigo e markdown. Use H1 para o titulo, H2/H3 para secoes.
- Paragrafos variados: alguns curtos (1-2 linhas), alguns medios (3-4 linhas)

════════════════════════════════════
DADOS DE APOIO (use como referencia, nao como unica fonte)
════════════════════════════════════
- Arquetipo: ${arquetipo.nome}
- Estrutura-base: ${JSON.stringify(arquetipo.estrutura, null, 2)}
- Titulo sugerido: ${variacoes.titulo}
- Abertura sugerida: ${variacoes.abertura}
- Transicao sugerida: ${variacoes.transicao}
- Fechamento sugerido: ${variacoes.fechamento}
- CTA editorial sugerido: ${variacoes.cta?.texto || 'Para quem quiser conhecer o modelo mencionado, mais informacoes podem ser consultadas no link do produto'}

TAMANHO ALVO:
- Entre 1000 e 1800 palavras
- Priorize informacao util e interessante, nao volume de texto
- 700 palavras com informacao relevante valem mais que 2000 palavras de enrolacao`;

  const userPrompt = `Escreva um artigo editorial sobre este produto, como se fosse uma materia de revista especializada.

DADOS DO PRODUTO:
${dadosProduto}
${contextoExterno}

ORIENTACOES:
- Escreva um artigo que ENSINE ou INFORME o leitor sobre algo relevante sobre este produto
- Use os dados abaixo como referencia, mas escreva com suas proprias palavras
- Se MARCA existir, mencione contextualmente
- Se INGREDIENTES existir, explique o que sao e como funcionam
- Se BENEFICIOS existir, desenvolva com explicacao do mecanismo
- Se PUBLICO-ALVO existir, direcione o texto para esse perfil
- FAQ deve conter perguntas REAIS de quem pesquisa este tipo de produto
- Nao use a mesma estrutura de sempre. Varie as secoes.
- Lembre-se: o artigo existe mesmo sem links. Os links sao adicionais, nao o motivo do artigo.
- Nao use linguagem de vendedor. Use linguagem de jornalista.
- Nao repita o nome do produto muitas vezes. Use variacoes naturais.
- O artigo deve ser tao util que o leitor o indicaria para um amigo.`;

  return { systemPrompt, userPrompt };
}

export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY nao configurada no .env');
  }

  console.log(`   📰 Gerando conteudo editorial v2.0...`);

  try {
    const { systemPrompt, userPrompt } = construirPrompt(produto, arquetipo, variacoes, contextoSerper);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const conteudo = await groqRequest(messages, groqApiKey);

    if (!conteudo || conteudo.length < 200) {
      console.error('   ❌ Conteudo gerado e muito curto ou vazio. Abortando.');
      return null;
    }

    console.log(`   ✅ Conteudo gerado com sucesso (~${conteudo.length} caracteres)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Erro ao gerar conteudo: ${error.message}`);
    // NUNCA publicar fallback generico. Se a IA falhou, o pipeline deve abortar.
    console.log('   ⚠️ A IA falhou. Retornando null para que o pipeline aborte. NÃO publicar fallback generico.');
    return null;
  }
}

/**
 * Reescreve o conteudo com base no relatorio de melhoria editorial.
 */
export async function reescreverConteudo(conteudoOriginal, improvementReport, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY nao configurada no .env');
  }

  console.log(`   🔄 Reescrevendo conteudo com base em feedback editorial...`);

  const melhorias = improvementReport?.improvements || ['Melhorar originalidade e naturalidade do texto'];
  const dimensoes = improvementReport?.editorialFeedback?.dimensions || {};
  const scoreAtual = improvementReport?.editorialFeedback?.score ?? 40;

  const systemPrompt = `Voce e um redator editorial especializado.
Sua funcao e reescrever o artigo abaixo para torna-lo mais natural e interessante.

REGRAS:
- Escreva como um jornalista, nao como um vendedor
- Remova qualquer frase generica que nao agregue informacao especifica
- NAO use linguagem de "compre agora", "aproveite", "oferta"
- NAO adicione HTML, CSS ou codigo
- Reescreva com suas proprias palavras
- Mantenha o formato Markdown
- O artigo deve ser agradavel de ler e informativo

MELHORIAS SOLICITADAS:
${melhorias.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}`;

  const userPrompt = `Reescreva o artigo abaixo aplicando todas as melhorias listadas acima.

ARTIGO ATUAL:
${conteudoOriginal}

Foque em tornar o texto mais original, bem estruturado e informativo.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const conteudo = await groqRequest(messages, groqApiKey);
    if (!conteudo || conteudo.length < 200) {
      console.log('   ⚠️ Conteudo reescrito e muito curto. Ignorando.');
      return null;
    }
    console.log(`   ✅ Conteudo reescrito com sucesso (~${conteudo.length} caracteres)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Erro ao reescrever conteudo: ${error.message}`);
    return null;
  }
}
