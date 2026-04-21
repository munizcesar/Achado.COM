/**
 * Groq AI Service - Geração de Conteúdo Inteligente
 * Temperature 0.1 para máxima factualidade
 * AchadoCerto.VIP
 */

import https from 'https';

/**
 * Requisição para Groq API
 */
function groqRequest(messages, apiKey, model = 'llama-3.3-70b-versatile') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.1, // Máxima factualidade
      max_tokens: 2000,
      top_p: 0.9
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
          const json = JSON.parse(data);
          resolve(json.choices[0].message.content);
        } else {
          reject(new Error(`Groq retornou ${res.statusCode}: ${data}`));
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

/**
 * Constrói prompt contextualizado baseado no arquetipo
 */
function construirPrompt(produto, arquetipo, variacoes, contextoSerper) {
  
  const dadosProduto = JSON.stringify({
    nome: produto.title,
    categoria: produto.category,
    loja: produto.store,
    especificacoes: produto.specs || [],
    descricao_base: produto.description
  }, null, 2);

  const contextoExterno = contextoSerper
    ? `\n### CONTEXTO DE AVALIAÇÕES REAIS (use se relevante):\n${JSON.stringify(contextoSerper, null, 2)}`
    : '\n### CONTEXTO EXTERNO: Não disponível - use apenas dados do produto.';

  const systemPrompt = `Você é um redator especializado em SEO e copy writing de alta autoridade para o mercado brasileiro.
Seu objetivo é criar um conteúdo aprofundado, útil e envolvente para maximizar a retenção e o SEO orgânico.

ARQUÉTIPO ESCOLHIDO: ${arquetipo.nome}

ESTRUTURA DO ARQUÉTIPO (REFERÊNCIA):
${JSON.stringify(arquetipo.estrutura, null, 2)}

DIRETRIZES DE ESTILO E QUALIDADE:
- Não use metalinguagem ou explicações sobre o texto
- Evite redundâncias e generalizações
- Use linguagem natural, clara e profissional
- Nunca cite preço exato
- Evite datas específicas para manter o conteúdo evergreen
- Não invente especificações que não estejam nos dados fornecidos

ESTRUTURA OBRIGATÓRIA A SEGUIR:
1. Título persuasivo com foco na palavra-chave principal (Nome do Produto)
2. Introdução com gancho forte e promessa clara
3. Desenvolvimento com subtítulos (H2/H3) abordando:
   - Funcionalidades principais
   - Cenários de uso e benefícios práticos
   - Qualidade, material e durabilidade (se aplicável)
4. Exemplos práticos e aplicáveis (ex: "para quem serve", "como usar no dia a dia")
5. Conclusão com síntese estratégica e chamada natural para ação (CTA)

SEO E INTENÇÃO:
- Insira o nome do produto e palavras-chave relacionadas de forma natural pelo texto
- O conteúdo deve responder às dúvidas de quem busca entender se o produto vale a pena comprar

ELEMENTOS A VARIAR / INCLUIR (se pertinente):
- Título sugerido: ${variacoes.titulo}
- Abertura: ${variacoes.abertura}
- Transição: ${variacoes.transicao}
- Fechamento: ${variacoes.fechamento}
- CTA: ${variacoes.cta.texto}
- Gatilho de confiança: ${variacoes.cta.gatilho}

FORMATO DE SAÍDA:
- Apenas a resposta em Markdown (sem frontmatter)
- Use markdown adequadamente (## para H2, ### para H3)
- Listas pontuadas onde ajudar na leitura
- Termos chaves em **negrito**`;

  const userPrompt = `Reescreva e desenvolva o conteúdo como um artigo de alta autoridade sobre: ${produto.title}

Contexto:
- Público: Consumidores buscando review e análise antes da compra
- Intenção de busca: Descobrir se o ${produto.title} é bom, como funciona e se vale a pena
- Palavra-chave principal: ${produto.title}
- Palavras-chave secundárias: ${produto.category}, review, análise, vale a pena, comprar

Dados do Produto:
${dadosProduto}
${contextoExterno}

Entrega:
- Texto final pronto para publicação seguindo as diretrizes do sistema.`;

  return { systemPrompt, userPrompt };
}

/**
 * Gera conteúdo completo do post
 */
export async function gerarConteudoPost(produto, arquetipo, variacoes, contextoSerper, groqApiKey) {
  
  if (!groqApiKey || groqApiKey.length < 20) {
    throw new Error('GROQ_API_KEY não configurada no .env');
  }

  console.log(`   🤖 Gerando conteúdo com Groq (arquétipo: ${arquetipo.nome})...`);
  
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
    
    // Fallback: conteúdo básico estruturado
    console.log('   💡 Usando template de fallback básico...');
    return gerarConteudoFallback(produto, variacoes);
  }
}

/**
 * Fallback caso Groq falhe
 */
function gerarConteudoFallback(produto, variacoes) {
  const specsBlock = produto.specs && produto.specs.length > 0
    ? `\n## Especificações Principais\n\n${produto.specs.join('\n')}\n`
    : '';

  return `${variacoes.abertura}

${produto.title} é um produto disponível no ${produto.store} com entrega rápida para todo o Brasil.

${specsBlock}

## Vale a Pena?

${variacoes.transicao}

${produto.description}

## Como Comprar

${variacoes.fechamento}. ${variacoes.cta.gatilho}.

---

*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*`;
}
