# 🧠 Como Integrar IA Real com FASE 17

## Opção 1: Groq API (RECOMENDADO - Gratuito)

### Por que Groq?
✅ **Gratuito** - Até 14.4k requisições/dia  
✅ **Rápido** - Respostas em <1 segundo  
✅ **Modelos open source** - Llama 2, Mixtral  
✅ **Sem cartão de crédito** necessário  

### Passo 1: Criar Conta

1. Acesse: https://console.groq.com
2. Faça login com Google ou GitHub
3. Copie sua API Key em Settings
4. Guarde em local seguro

### Passo 2: Instalar SDK

```bash
cd backend
npm install groq-sdk
```

### Passo 3: Configurar Variável de Ambiente

Crie arquivo `.env` em `/backend/`:

```bash
GROQ_API_KEY=gsk_seu_token_aqui
```

### Passo 4: Atualizar server.js

Substitua a função `gerarConteudoPost()` por:

```javascript
// Adicionar no início do server.js
const Groq = require('groq-sdk');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Função atualizada para usar IA real
async function gerarConteudoPostComIA(produto) {
  try {
    const prompt = `
Você é um especialista em criar posts de blog atraentes sobre produtos. 
Crie um post sobre este produto para um site de achados e descontos:

PRODUTO:
- Título: ${produto.titulo}
- Preço: R$ ${produto.preco?.toFixed(2) || 'Consultar'}
- Avaliação: ${produto.avaliacao}/5 (${produto.vendidos} vendedores)
- Link: ${produto.ml_url || 'Mercado Livre'}

IMPORTANTE:
1. Use linguagem casual e atrativa
2. Inclua seções: Por quê?, Benefícios, Especificações, Por que agora?, Resumo
3. Use markdown básico (negrito, itálico)
4. Máximo 1000 palavras
5. Seja honesto e útil
6. Inclua call-to-action para comprar

FORMATO ESPERADO:
Por que este produto?

[conteúdo sobre o produto]

Benefícios principais:

[benefícios em bullets]

Especificações:

[specs relevantes]

Por que comprar agora?

[argumentos de venda]

Resumo:

[conclusão]
    `;

    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768", // ou "llama2-70b-4096"
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Erro ao gerar conteúdo com IA:', error);
    // Fallback para conteúdo simulado
    return gerarConteudoPostSimulado(produto);
  }
}

// Atualizar a rota para usar IA
app.post('/api/gerar-post-ia', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        sucesso: false,
        erro: 'URL do produto é obrigatória'
      });
    }

    console.log('🤖 Gerando post com IA para:', url);

    let produtoFormatado;
    
    try {
      const produto = await mlAPI.buscarProduto(url);
      produtoFormatado = mlAPI.formatarProduto(produto);
    } catch (apiError) {
      console.warn('⚠️ API indisponível, usando dados de fallback');
      produtoFormatado = gerarFallbackProduto(url);
    }

    // ⭐ USAR IA REAL AQUI
    const conteudo = await gerarConteudoPostComIA(produtoFormatado);
    
    const titulo = `${produtoFormatado.titulo} | Achado VIP`;
    const categoria = produtoFormatado.categoria || 'tech';
    const html = gerarHTMLPost(titulo, conteudo, produtoFormatado, url);

    res.json({
      sucesso: true,
      titulo,
      categoria,
      produto: produtoFormatado,
      conteudo,
      html,
      status: 'pronto_para_salvar',
      iaUsada: 'Groq Mixtral 8x7B'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar post:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao gerar post'
    });
  }
});
```

### Passo 5: Testar

```bash
cd backend
npm start

# Em outro terminal
curl -X POST http://localhost:3001/api/gerar-post-ia \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.mercadolivre.com.br/motorola-moto-e14-64gb-preto-128gb/p/MLB3341891"}'
```

---

## Opção 2: OpenAI (ChatGPT)

### Custo
- ~$0.03 por 1000 tokens (GPT-3.5)
- ~$0.05 por 1000 tokens (GPT-4)

### Setup

```bash
npm install openai dotenv
```

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function gerarConteudoPostComOpenAI(produto) {
  const message = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Você é especialista em escrever posts sobre produtos para sites de descontos."
      },
      {
        role: "user",
        content: `Crie um post sobre: ${produto.titulo} - R$ ${produto.preco}`
      }
    ],
    max_tokens: 1024
  });

  return message.choices[0].message.content;
}
```

---

## Opção 3: Hugging Face (Free)

### Vantagem
- Modelos open source
- Free tier generoso
- Sem necessidade de cartão

### Setup

```bash
npm install @huggingface/inference
```

```javascript
const { HfInference } = require("@huggingface/inference");

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function gerarConteudoPostComHF(produto) {
  const result = await hf.textGeneration({
    model: "mistralai/Mistral-7B-Instruct-v0.1",
    inputs: `Crie um post sobre ${produto.titulo} no preço R$ ${produto.preco}`,
    parameters: {
      max_new_tokens: 1024
    }
  });

  return result.generated_text;
}
```

---

## Opção 4: Usar Localmente (Offline)

### Com Ollama

```bash
# Instalar Ollama: https://ollama.ai

# No terminal
ollama run mistral

# Seu app pode acessar em localhost:11434
```

```javascript
const axios = require('axios');

async function gerarConteudoPostComOllama(produto) {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'mistral',
    prompt: `Crie um post sobre ${produto.titulo}`,
    stream: false
  });

  return response.data.response;
}
```

---

## Comparação Rápida

| Serviço | Custo | Velocidade | Qualidade | Setup |
|---------|-------|-----------|-----------|-------|
| **Groq** | Grátis | Muito Rápido | Ótima | Fácil |
| **OpenAI** | $0.03-0.05/1k tokens | Rápido | Excelente | Médio |
| **Hugging Face** | Grátis | Lento | Boa | Fácil |
| **Ollama Local** | Grátis | Muito Lento | Boa | Difícil |

**Recomendação:** Comece com **Groq** (gratuito e rápido)

---

## Customizar Prompts por Categoria

```javascript
function getCategoryPrompt(categoria, produto) {
  const prompts = {
    tech: `Crie um post técnico sobre ${produto.titulo}. 
            Foque em especificações, performance e uso.`,
    
    saude: `Crie um post informativo sobre ${produto.titulo}.
            Foque em benefícios à saúde e modo de uso.`,
    
    lar: `Crie um post inspirador sobre ${produto.titulo}.
         Foque em décor e funcionalidade.`,
    
    estilo: `Crie um post estiloso sobre ${produto.titulo}.
            Foque em tendências e looks.`,
    
    dicas: `Crie um post com dicas sobre ${produto.titulo}.
           Seja criativo e útil.`
  };

  return prompts[categoria] || prompts.tech;
}
```

---

## Tratamento de Erros e Fallback

```javascript
async function gerarConteudoSeguro(produto) {
  try {
    // Tentar IA real primeiro
    return await gerarConteudoPostComIA(produto);
  } catch (error) {
    console.warn('IA falhou, usando fallback:', error.message);
    
    // Fallback 1: Conteúdo simulado
    try {
      return gerarConteudoPostSimulado(produto);
    } catch (error2) {
      // Fallback 2: Conteúdo mínimo
      return `Este é um ótimo produto: ${produto.titulo}. 
              Preço: R$ ${produto.preco}. 
              Recomendado!`;
    }
  }
}
```

---

## Monitorar Uso de API

```javascript
// Adicionar ao seu server
const apiUsage = {
  groq: { calls: 0, lastReset: Date.now() },
  openai: { calls: 0, cost: 0 }
};

async function logAPICall(service, tokens) {
  apiUsage[service].calls++;
  if (service === 'openai') {
    apiUsage[service].cost += (tokens / 1000) * 0.03;
  }
  
  console.log(`API ${service}: ${apiUsage[service].calls} chamadas`);
}

// Endpoint para ver uso
app.get('/api/usage', (req, res) => {
  res.json({
    groq: apiUsage.groq,
    openai: apiUsage.openai,
    estimatedCost: apiUsage.openai.cost
  });
});
```

---

## Dicas Finais

1. **Comece simples** - Use prompts básicos primeiro
2. **Teste diferentes modelos** - Veja qual combina melhor
3. **Customize por categoria** - Posts diferentes para nichos diferentes
4. **Guarde histórico** - Saiba qual IA gerou qual post
5. **Tenha fallback** - Sempre tenha plano B se IA cair
6. **Revise antes de publicar** - Use IA como assistente, não como verdade
7. **Rastreie custos** - Se usar OpenAI, monitore gastos

---

## Próximas Ideias

✨ Sistema de templates por categoria  
✨ Edição automática de posts com feedback  
✨ Ranking de qualidade de conteúdo  
✨ Auto-ajuste de prompts baseado em performance  
✨ Integração com redes sociais para auto-post  

---

**Pronto para integrar IA? Comece com Groq! 🚀**
