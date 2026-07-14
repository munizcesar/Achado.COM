/**
 * Groq AI Service - Protocolo de Conteúdo Direto v1.1
 * AchadoCerto.VIP
 *
 * Filosofia:
 * - Cada frase entrega informação útil sobre o produto
 * - Nada de enrolação, contexto genérico ou fingimento de voz humana
 * - Specs primeiro, FAQ com dúvidas reais, veredito direto
 * - Conteúdo evergreen: atemporal, sem preços ou datas
 * - Regras obrigatórias: verdadeiro, positivo, completo, sem alucinação
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
    // Dados enriquecidos (Fase 1)
    nomes_cientificos: knowledge.scientific_names || [],
    mecanismos_acao: knowledge.mechanisms || [],
    entidades_semanticas: knowledge.entities || [],
    plano_editorial_secoes: plan.sections ? plan.sections.map(s => s.label) : [],
    tom_editorial: plan.tone || '',
    intencao_busca: plan.intent || '',
    keyword_principal: plan.primary_keyword || '',
  }, null, 2);

  const contextoExterno = contextoSerper
    ? `\n### CONTEXTO EXTERNO (apoio de linguagem e percepção, sem copiar literalmente):\n${JSON.stringify(contextoSerper, null, 2)}`
    : '';

  const systemPrompt = `Você é um redator técnico brasileiro especializado em análises de produto para SEO.

════════════════════════════════════
REGRA-MÃE (NUNCA VIOLAR)
════════════════════════════════════
Seja DIRETO e POSITIVO. Cada frase deve entregar informação útil sobre o produto.
Se uma frase pode ser removida sem perder informação relevante, remova.
Nada de enrolação, contexto genérico, frases corporativas ou fingimento de voz humana.
O leitor quer saber: o que é, para quem serve, quais as specs, e se vale a pena.

REGRAS OBRIGATÓRIAS:
- Apenas informações verdadeiras, verificáveis e coerentes
- Nunca invente — se não puder confirmar, OMITA
- Tom positivo, informativo e útil — sem exageros ou sensacionalismo
- Não destaque pontos negativos nem faça comparações depreciativas
- Explique: o que é, para quem, benefícios, como funciona, características, diferenciais, dúvidas comuns
- Texto completo o bastante para reduzir a necessidade de buscar outras fontes
- Linguagem natural, SEO-friendly, fácil de ler
- Transmita confiança e ajude o leitor a decidir
- NUNCA alucine — em caso de dúvida, omita

════════════════════════════════════
ESTRUTURA OBRIGATÓRIA (seguir nesta ordem)
════════════════════════════════════
1. H1: "[Nome do Produto] — Análise Completa" ou similar direto
2. Introdução (1-2 parágrafos): O que é + spec principal + diferencial
3. Especificações Técnicas: TODAS as specs em bullet points ou tabela
4. Principais Características: O que realmente importa no uso (bullet points)
5. Para Quem é Ideal: Perfis de usuário que mais se beneficiam do produto
6. Dúvidas Comuns (FAQ — 5+ perguntas reais com respostas diretas)
7. Veredito Final + CTA: Vale a pena? Para quem?

════════════════════════════════════
FRASES BANIDAS (NUNCA USAR — geram enrolação)
════════════════════════════════════
- É importante considerar
- Ao analisar
- Além disso (máx 1x no texto todo)
- Vale destacar
- Quando se trata de
- No mercado atual
- Solução abrangente
- Pode fazer diferença
- Isso o torna
- Nesse contexto
- Pensando nisso
- Não faltam opções
- Cada vez mais
- Usuários que buscam
- Promete
- solução abrangente
- proposta inovadora
- produto revolucionário
- excelência
- entrega superior
- Em conclusão
- Alta qualidade (como frase vazia)
- Vale muito a pena (como frase vazia)
- Produto excelente (como frase vazia)
- QUALQUER frase genérica que poderia estar em qualquer review de qualquer produto

════════════════════════════════════
GUIA TÉCNICO DA CATEGORIA
════════════════════════════════════
${guia}

════════════════════════════════════
REGRAS DE CONTEÚDO
════════════════════════════════════
- Use TODOS os dados do produto disponíveis: specs, ingredientes, benefícios, público-alvo
- Se specs estiverem disponíveis, exiba-as em formato de lista ou tabela com TODOS os detalhes
- Se ingredientes/ativos estiverem disponíveis, liste e explique cada um (1-2 linhas cada)
- Se benefícios estiverem disponíveis, desenvolva cada um com contexto prático
- FAQ deve conter perguntas que um comprador REAL faria (não perguntas genéricas de SEO)
- Respostas do FAQ: curtas (2-4 linhas), diretas, informativas — sem enrolação
- Inclua 1 parágrafo sobre "Para quem é ideal" — perfis que mais se beneficiam
- Use linguagem clara, descritiva e direta, sempre em tom positivo e construtivo
- Evite metáforas, storytelling ou qualquer tentativa de soar humano
- Prefira fatos e especificações a opiniões vagas
- O texto deve ser completo o bastante para que o leitor não precise buscar outras fontes

════════════════════════════════════
REGRAS DE FORMATO
════════════════════════════════════
- Gere em Markdown, sem frontmatter
- Use 1 H1 direto e informativo
- Use entre 4 e 7 H2 descritivos (nunca genéricos como "Introdução" ou "Conclusão")
- Use bullet points para specs e características
- Parágrafos curtos (máx 3-4 linhas)
- FAQ com 5+ perguntas no final
- Termine com veredito + CTA leve

════════════════════════════════════
CTA E FECHAMENTO
════════════════════════════════════
- CTA direto e sem urgência
- Exemplo: "Disponível na Amazon — confira o preço atual"
- Exemplo: "Vale a pena conferir as condições atuais do produto"
- NUNCA use urgência forçada ou frases de pressão

════════════════════════════════════
RESTRIÇÕES TÉCNICAS
════════════════════════════════════
- Não citar preço exato (use "preço atual" ou "consulte o link")
- Não usar datas como parte do argumento
- Não repetir o nome do produto de forma mecânica
- Não usar clichês de IA ou marketing vazio

════════════════════════════════════
PROIBIÇÃO DE CÓDIGO E HTML
════════════════════════════════════
- NUNCA copie texto da página do produto
- NUNCA reproduza HTML, CSS ou código
- TUDO escrito em português natural com suas próprias palavras

════════════════════════════════════
REVISÃO FINAL (OBRIGATÓRIA)
════════════════════════════════════
Antes de entregar, verifique:
1. Toda informação aqui é verdadeira e verificável?
2. Alguma especificação foi inventada? Se sim, remova ou corrija
3. Cada parágrafo entrega informação útil E exclusiva sobre este produto?
4. Alguma frase genérica pode ser removida sem perder informação? Se sim, remova.
5. As specs estão todas lá?
6. FAQ responde dúvidas reais de compradores (não perguntas de SEO)?
7. O texto está direto, positivo e informativo, ou parece enrolação de IA?
8. Se você substituísse o nome do produto por outro, o texto ainda faria sentido? Se sim, está genérico demais — reescreva.
9. O texto transmite confiança e ajuda o leitor a decidir?

DADOS DE APOIO:
- Arquétipo: ${arquetipo.nome}
- Estrutura-base: ${JSON.stringify(arquetipo.estrutura, null, 2)}
- Título sugerido: ${variacoes.titulo}
- Abertura sugerida: ${variacoes.abertura}
- Transição sugerida: ${variacoes.transicao}
- Fechamento sugerido: ${variacoes.fechamento}
- CTA sugerido: ${variacoes.cta?.texto || ''}

TAMANHO ALVO:
- Produza entre 1200 e 2000 palavras
- Priorize informação densa, não volume de texto
- Um texto de 800 palavras com informação útil vale mais que 2000 palavras de enrolação`;

  const userPrompt = `Crie a análise completa para este produto seguindo rigorosamente o Protocolo de Conteúdo Direto v1.

PRODUTO (use TODOS os campos abaixo na análise):
${dadosProduto}
${contextoExterno}

INSTRUÇÕES:
- Use TODOS os dados disponíveis: specs, ingredientes, benefícios, público-alvo
- Estrutura obrigatória: specs → características → público → FAQ → veredito
- Se MARCA existir, mencione naturalmente no texto
- Se INGREDIENTES existir, liste e explique cada um
- Se BENEFÍCIOS existir, desenvolva cada um com contexto prático
- Se PÚBLICO-ALVO existir, direcione o texto para esse perfil
- Se FAQ_SUGERIDO existir, use como base para as perguntas — reescreva com suas palavras
- FAQ deve conter perguntas que um comprador REAL faria
- Seja direto e POSITIVO: cada frase deve agregar informação útil sobre o produto
- Nada de enrolação, contexto genérico ou opiniões vagas
- Prefira bullet points e listas a parágrafos longos
- Antes de finalizar: verifique se toda informação é verdadeira e remova qualquer frase genérica
- Mantenha o tom evergreen e atemporal
- O texto deve ser completo o bastante para que o leitor não precise buscar outras fontes`;

  return { systemPrompt, userPrompt };
}

export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  console.log(`   🤖 Groq — Protocolo de Conteúdo Direto v1.1 carregado...`);

  try {
    const { systemPrompt, userPrompt } = construirPrompt(produto, arquetipo, variacoes, contextoSerper);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // [AUDIT] Log completo do prompt enviado
    console.log('\n[AUDIT] === SYSTEM PROMPT ENVIADO ===');
    console.log(systemPrompt.substring(0, 500) + '...');
    console.log('\n[AUDIT] === USER PROMPT ENVIADO ===');
    console.log(userPrompt.substring(0, 500) + '...');
    console.log('\n[AUDIT] === PAYLOAD COMPLETO (dadosProduto JSON) ===');
    // Extrai o JSON do userPrompt
    const jsonMatch = userPrompt.match(/PRODUTO \(use TODOS os campos abaixo na análise\):\n(\{[\s\S]*?\})\n\nINSTRUÇÕES/);
    if (jsonMatch) {
      console.log(jsonMatch[1]);
    }
    console.log('\n[AUDIT] === FIM DO PAYLOAD ===\n');

    const conteudo = await groqRequest(messages, groqApiKey);

    console.log(`   ✅ Conteúdo gerado com sucesso (~${conteudo.length} caracteres)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Erro ao gerar conteúdo: ${error.message}`);
    console.log('   💡 Usando template de fallback básico...');
    return gerarConteudoFallback(produto, variacoes);
  }
}

/**
 * Reescreve o conteúdo com base no relatório de melhoria editorial.
 * Usado no rewrite loop quando Editorial Score < 45/50.
 */
export async function reescreverConteudo(conteudoOriginal, improvementReport, groqApiKey) {
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  console.log(`   🔄 Reescrevendo conteúdo com base em feedback editorial...`);

  // Safety: fallback se improvementReport for malformado
  const melhorias = improvementReport?.improvements || ['Melhorar originalidade e naturalidade do texto'];
  const dimensoes = improvementReport?.editorialFeedback?.dimensions || {};
  const scoreAtual = improvementReport?.editorialFeedback?.score ?? 40;

  const systemPrompt = `Você é um redator técnico especializado em análises de produto.
Sua função é reescrever o artigo abaixo para torná-lo mais direto e informativo.

REGRAS:
- Seja direto: cada frase deve entregar informação útil sobre o produto
- Remova qualquer frase genérica que não agregue informação específica
- NÃO adicione HTML, CSS ou código
- Reescreva com suas próprias palavras — não copie da Amazon
- Mantenha o formato Markdown
- Nada de enrolação, contexto genérico ou opiniões vagas

MELHORIAS SOLICITADAS:
${melhorias.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

SCORE MÍNIMO NECESSÁRIO: 45/50
SCORE ATUAL: ${scoreAtual}/50

Se o texto tiver frases genéricas ou que poderiam estar em qualquer review, REMOVA-AS completamente.`;

  const userPrompt = `Reescreva o artigo abaixo aplicando todas as melhorias listadas acima.

ARTIGO ATUAL:
${conteudoOriginal}

Lembre-se: o score editorial atual é ${scoreAtual}/50. Precisamos de no mínimo 45/50.
Foque em tornar o texto mais original, bem estruturado e informativo.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const conteudo = await groqRequest(messages, groqApiKey);
    console.log(`   ✅ Conteúdo reescrito com sucesso (~${conteudo.length} caracteres)`);
    return conteudo;
  } catch (error) {
    console.error(`   ❌ Erro ao reescrever conteúdo: ${error.message}`);
    return null;
  }
}

function gerarConteudoFallback(produto, variacoes) {
  const { title, description, specs, store, category } = produto;

  // Specs como bullet points
  const specsBlock = specs && specs.length > 0
    ? specs.join('\n')
    : '- **Categoria:** ' + (category || 'geral') + '\n- **Disponível em:** ' + store;

  // CTA direto
  const ctaDireto = 'Disponível na ' + store + ' — consulte o preço atual e as condições de entrega.';

  // Título curto para referência
  const nomeCurto = title.length > 80 ? title.substring(0, 77) + '...' : title;

  return '# ' + nomeCurto + ' — Análise Completa\n\n' +
    '## O Que É\n\n' +
    title + ' é um produto da categoria ' + category + ', disponível na ' + store + '. ' + description + '\n\n' +
    '## Especificações Técnicas\n\n' + specsBlock + '\n\n' +
    '## Principais Características\n\n' +
    '- Disponível na loja ' + store + '\n' +
    '- Categoria: ' + category + '\n' +
    '- Produto analisado com base nas especificações disponíveis\n' +
    '- Verifique a página do produto para detalhes completos\n\n' +
    '## Para Quem é Ideal\n\n' +
    variacoes.transicao + '\n\n' +
    '## Dúvidas Comuns\n\n' +
    '### O que é este produto?\n' +
    title + ' é um produto classificado na categoria ' + category + ', vendido pela ' + store + '. As especificações listadas acima trazem os principais detalhes técnicos.\n\n' +
    '### Para quem é indicado?\n' +
    'Este produto é indicado para consumidores que buscam uma opção na categoria ' + category + '. Recomenda-se verificar as especificações completas na página do produto para confirmar se atende às suas necessidades.\n\n' +
    '### Onde comprar?\n' +
    'O produto está disponível na ' + store + '. Os preços e condições podem variar — vale a pena consultar a página oficial para informações atualizadas.\n\n' +
    '### Qual a garantia?\n' +
    'Consulte a página do produto na ' + store + ' para informações sobre garantia, prazo de entrega e política de devolução. Esses detalhes podem variar conforme o vendedor e a região.\n\n' +
    '### Como escolher o modelo ideal?\n' +
    'Compare as especificações de diferentes modelos dentro da mesma categoria. O ideal é avaliar tamanho, capacidade, potência e funcionalidades que atendam ao seu perfil de uso específico.\n\n' +
    '### Vale a pena?\n' +
    'A avaliação depende do seu perfil de uso. Confira as especificações e compare com outras opções da mesma categoria antes de decidir. Verifique também as avaliações de outros compradores na página do produto.\n\n' +
    '## Veredito Final\n\n' +
    variacoes.fechamento + '. ' + ctaDireto;
}
