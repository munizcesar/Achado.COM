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

  const systemPrompt = `Você é um redator especializado em reviews de produtos para consumidores brasileiros.
Escreva um artigo que conduza naturalmente à compra, sem parecer propaganda.

ARQUÉTIPO ESCOLHIDO: ${arquetipo.nome}

ESTRUTURA DO ARQUÉTIPO:
${JSON.stringify(arquetipo.estrutura, null, 2)}

REGRAS DE INTEGRIDADE (ABSOLUTO):
1. NUNCA cite preço exato - use "custo-benefício atrativo", "posicionamento intermediário", etc
2. NUNCA invente especificações não listadas nos dados
3. Se mencionar avaliações, cite "compradores relatam que..." ou "segundo avaliações..."
4. Mantenha EVERGREEN: sem datas, sem "lançamento recente", sem versões específicas
5. NUNCA use metalinguagem ("neste artigo", "vamos falar", "vou mostrar")
6. Títulos de seção devem ser PRÁTICOS, sem genéricos como "Introdução" ou "Conclusão"
7. Use dados REAIS dos dados do produto fornecidos

VARIAÇÕES A USAR:
- Título sugerido: ${variacoes.titulo}
- Abertura: ${variacoes.abertura}
- Transição: ${variacoes.transicao}
- Fechamento: ${variacoes.fechamento}
- CTA: ${variacoes.cta.texto}
- Gatilho de confiança: ${variacoes.cta.gatilho}

FORMATO DE SAÍDA (Markdown sem frontmatter):
- Use ## para títulos principais (práticos, não genéricos)
- Use ### para subtítulos quando necessário
- Parágrafos curtos e escaneáveis
- Listas com - quando listar features
- Negrito em **termos importantes**
- SEMPRE termine com o CTA integrado naturalmente no texto

EXTENSÃO: 800-1200 palavras, denso mas legível.`;

  const userPrompt = `Escreva um artigo completo seguindo o arquétipo "${arquetipo.nome}" para este produto:

${dadosProduto}
${contextoExterno}

Lembre-se:
- Use APENAS os dados fornecidos
- Siga a estrutura do arquetipo
- Aplique as variações sugeridas
- Seja factual (temperature 0.1)
- Sem preços, sem datas, sem invenções
- CTA natural no final`;

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
