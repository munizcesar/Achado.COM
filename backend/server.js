require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const MercadoLivreAPI = require('./mercadolivre-api');
const Comparativo = require('./comparativo');

// Integração com Groq API para IA
const Groq = require('groq-sdk');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3001;

// Carregar dados de afiliados
const affiliatesPath = path.join(__dirname, 'affiliates.json');
let affiliatesData = {};

try {
  const affiliatesRaw = fs.readFileSync(affiliatesPath, 'utf8');
  affiliatesData = JSON.parse(affiliatesRaw);
  console.log('✅ Dados de afiliados carregados');
} catch (error) {
  console.warn('⚠️ Erro ao carregar affiliates.json:', error.message);
  affiliatesData = { produtos: {}, cliques_por_pagina: {} };
}

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Servir arquivos estáticos (html)
app.use(express.static(path.join(__dirname)));

// Inicializar API do Mercado Livre
const mlAPI = new MercadoLivreAPI(
  process.env.RAPIDAPI_KEY,
  process.env.RAPIDAPI_HOST
);

// ============ ROTAS ============

// 1. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 2. BUSCAR PRODUTO POR URL
app.post('/api/produto', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: 'URL do produto é obrigatória'
      });
    }

    console.log('📥 Requisição: GET /api/produto');
    const dados = await mlAPI.buscarProduto(url);
    const produto = mlAPI.formatarProduto(dados);

    res.json({
      sucesso: true,
      produto: produto,
      dadosBrutos: dados
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 3. BUSCAR AVALIAÇÕES
app.post('/api/avaliacoes', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: 'URL do produto é obrigatória'
      });
    }

    const avaliacoes = await mlAPI.buscarAvaliacoes(url);

    res.json({
      sucesso: true,
      avaliacoes: avaliacoes
    });

  } catch (error) {
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 4. BUSCAR POR TERMO
app.get('/api/buscar/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    const { limit = 10 } = req.query;

    const resultados = await mlAPI.buscarPorTermo(termo);

    res.json({
      sucesso: true,
      termo: termo,
      resultados: resultados
    });

  } catch (error) {
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 5. CRIAR COMPARATIVO
app.post('/api/comparativo', async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        erro: 'Forneça um array de URLs de produtos'
      });
    }

    console.log(`📊 Criando comparativo com ${urls.length} produtos...`);

    const comparativo = new Comparativo();
    const produtos = [];

    // Buscar todos os produtos em paralelo
    const promises = urls.map(url => 
      mlAPI.buscarProduto(url)
        .then(dados => {
          const produto = mlAPI.formatarProduto(dados);
          produtos.push(produto);
          return produto;
        })
        .catch(err => {
          console.error(`Erro ao buscar ${url}:`, err);
          return null;
        })
    );

    await Promise.all(promises);

    // Remover nulos
    const produtosValidos = produtos.filter(p => p !== null);
    comparativo.adicionarProdutos(produtosValidos);

    const resumo = comparativo.gerarResumo();
    const tabela = comparativo.gerarTabelaHTML();

    res.json({
      sucesso: true,
      resumo: resumo,
      produtos: produtosValidos,
      tabelaHTML: tabela
    });

  } catch (error) {
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 6. GERAR TEMPLATE DE POST COM DADOS DO PRODUTO
app.post('/api/gerar-post', async (req, res) => {
  try {
    const { titulo, url, categoria } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: 'URL é obrigatória'
      });
    }

    const dados = await mlAPI.buscarProduto(url);
    const produto = mlAPI.formatarProduto(dados);

    // Template HTML para post
    const post = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${produto.titulo}</title>
    <meta name="description" content="Achado no Mercado Livre: ${produto.titulo} por R$ ${produto.preco.toFixed(2)}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${produto.titulo}" />
    <meta property="og:description" content="Achado: ${produto.titulo} | R$ ${produto.preco.toFixed(2)}" />
    <meta property="og:image" content="${produto.imagem}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
</head>
<body>
    <article class="post">
        <h1>${produto.titulo}</h1>
        
        <div class="produto-info">
            <img src="${produto.imagem}" alt="${produto.titulo}">
            
            <div class="detalhes">
                <p class="preco">
                    <strong>R$ ${produto.preco.toFixed(2)}</strong>
                    ${produto.desconto > 0 ? `<span class="desconto">-${produto.desconto}%</span>` : ''}
                </p>
                
                <p class="avaliacao">⭐ ${produto.avaliacao} estrelas</p>
                <p class="vendidos">✓ ${produto.vendidos} vendidos</p>
                <p class="vendedor">Vendedor: ${produto.vendedor}</p>
                
                <a href="${produto.url}" target="_blank" class="btn-comprar">
                    Comprar no Mercado Livre
                </a>
            </div>
        </div>
        
        <div class="descricao">
            <h2>Sobre o Produto</h2>
            <p>${produto.descricao || 'Confira os detalhes completos no Mercado Livre.'}</p>
        </div>
    </article>
</body>
</html>
    `;

    res.json({
      sucesso: true,
      produto: produto,
      postHTML: post
    });

  } catch (error) {
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 7. LIMPAR CACHE
app.get('/api/cache/limpar', (req, res) => {
  mlAPI.limparCache();
  res.json({
    sucesso: true,
    mensagem: 'Cache limpo com sucesso'
  });
});

// ============ ROTAS DE AFILIADOS ============

// 8. OBTER LINK DE AFILIADO E REGISTRAR CLIQUE
app.get('/api/afiliado/:produtoId', (req, res) => {
  try {
    const { produtoId } = req.params;
    const { pagina } = req.query; // Qual página gerou o clique

    // Buscar produto nos afiliados
    const produto = affiliatesData.produtos[produtoId];

    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Produto não encontrado na base de afiliados'
      });
    }

    if (!produto.ativo) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Produto não está ativo'
      });
    }

    // Registrar clique
    produto.cliques = (produto.cliques || 0) + 1;

    // Registrar página que gerou clique
    if (pagina) {
      if (!affiliatesData.cliques_por_pagina[pagina]) {
        affiliatesData.cliques_por_pagina[pagina] = {
          produto: produtoId,
          cliques: 0,
          ultima_atualizacao: new Date().toISOString()
        };
      }
      affiliatesData.cliques_por_pagina[pagina].cliques++;
      affiliatesData.cliques_por_pagina[pagina].ultima_atualizacao = new Date().toISOString();
    }

    // Salvar dados atualizados
    fs.writeFileSync(affiliatesPath, JSON.stringify(affiliatesData, null, 2));

    console.log(`📊 Clique registrado: ${produtoId} | Página: ${pagina || 'desconhecida'} | Total: ${produto.cliques}`);

    res.json({
      sucesso: true,
      url: produto.afiliado_url,
      produto: produto.titulo,
      cliques: produto.cliques,
      pagina: pagina || null
    });

  } catch (error) {
    console.error('Erro ao obter link de afiliado:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

// 9. OBTER ESTATÍSTICAS DE AFILIADOS
app.get('/api/afiliados/stats', (req, res) => {
  try {
    const stats = {
      total_cliques: 0,
      produtos_totais: Object.keys(affiliatesData.produtos).length,
      produtos: [],
      paginas: [],
      top_produtos: [],
      top_paginas: []
    };

    // Contar cliques por produto
    Object.entries(affiliatesData.produtos).forEach(([id, prod]) => {
      const cliques = prod.cliques || 0;
      stats.total_cliques += cliques;
      stats.produtos.push({
        id,
        titulo: prod.titulo,
        categoria: prod.categoria,
        cliques,
        taxa_conversao: `${(cliques * 0.01).toFixed(2)}%` // Aproximação
      });
    });

    // Contar cliques por página
    Object.entries(affiliatesData.cliques_por_pagina || {}).forEach(([pagina, data]) => {
      stats.paginas.push({
        pagina,
        produto: data.produto,
        cliques: data.cliques,
        ultima_atualizacao: data.ultima_atualizacao
      });
    });

    // Top produtos por cliques
    stats.top_produtos = stats.produtos
      .sort((a, b) => b.cliques - a.cliques)
      .slice(0, 10);

    // Top páginas por cliques
    stats.top_paginas = stats.paginas
      .sort((a, b) => b.cliques - a.cliques)
      .slice(0, 10);

    res.json({
      sucesso: true,
      stats
    });

  } catch (error) {
    console.error('Erro ao obter stats:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

// 10. ADICIONAR/ATUALIZAR LINK DE AFILIADO
app.post('/api/afiliado/adicionar', (req, res) => {
  try {
    const { produtoId, titulo, categoria, ml_url, afiliado_url } = req.body;

    if (!produtoId || !afiliado_url) {
      return res.status(400).json({
        sucesso: false,
        erro: 'produtoId e afiliado_url são obrigatórios'
      });
    }

    affiliatesData.produtos[produtoId] = {
      titulo: titulo || 'Produto',
      categoria: categoria || 'geral',
      ml_url: ml_url || '',
      afiliado_url,
      ativo: true,
      cliques: 0,
      criado_em: new Date().toISOString()
    };

    fs.writeFileSync(affiliatesPath, JSON.stringify(affiliatesData, null, 2));

    res.json({
      sucesso: true,
      mensagem: 'Produto adicionado/atualizado com sucesso',
      produto: affiliatesData.produtos[produtoId]
    });

  } catch (error) {
    console.error('Erro ao adicionar afiliado:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

// ============ ROTAS DE GERAÇÃO DE POSTS COM IA ============

// 11. GERAR POST COM IA
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
    
    // Tentar buscar dados da API
    try {
      const produto = await mlAPI.buscarProduto(url);
      produtoFormatado = mlAPI.formatarProduto(produto);
    } catch (apiError) {
      console.warn('⚠️ API indisponível, usando dados de fallback');
      // Se API falhar, gerar dados simulados a partir da URL
      produtoFormatado = gerarFallbackProduto(url);
    }

    // Gerar conteúdo com IA (Groq ou fallback)
    const titulo = `${produtoFormatado.titulo} | Achado VIP`;
    const categoria = produtoFormatado.categoria || 'tech';
    const conteudo = await gerarConteudoPost(produtoFormatado);

    // Gerar HTML do post
    const html = gerarHTMLPost(titulo, conteudo, produtoFormatado, url);

    res.json({
      sucesso: true,
      titulo,
      categoria,
      produto: produtoFormatado,
      conteudo,
      html,
      status: 'pronto_para_salvar',
      apiDisponivel: produtoFormatado.apiDisponivel !== false,
      iaUsada: process.env.GROQ_API_KEY ? 'Groq IA (Mixtral)' : 'Simulada (Fallback)',
      modelo: process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar post:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao gerar post'
    });
  }
});

// 12. SALVAR POST COMO ARQUIVO
app.post('/api/salvar-post', (req, res) => {
  try {
    const { titulo, categoria, conteudo, produto, html } = req.body;

    if (!html) {
      return res.status(400).json({
        sucesso: false,
        erro: 'HTML é obrigatório'
      });
    }

    // Gerar nome do arquivo a partir do produto
    const nomeArquivo = produto.titulo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.html';

    const caminhoArquivo = path.join(__dirname, '..', 'blog', nomeArquivo);

    // Criar diretório se não existir
    const blogDir = path.join(__dirname, '..', 'blog');
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // Salvar arquivo
    fs.writeFileSync(caminhoArquivo, html);

    console.log('✅ Post salvo:', nomeArquivo);

    res.json({
      sucesso: true,
      mensagem: 'Post salvo com sucesso',
      arquivo: nomeArquivo,
      caminho: caminhoArquivo,
      url: `http://localhost/AchadoCerto.VIP/blog/${nomeArquivo}`
    });

  } catch (error) {
    console.error('❌ Erro ao salvar post:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

// ============ FUNÇÕES AUXILIARES ============

// Gerar dados de fallback quando API não responde
function gerarFallbackProduto(url) {
  // Extrair informações da URL
  const partes = url.split('/');
  const nomeArquivo = partes[partes.length - 2] || 'produto-mercado-livre';
  
  return {
    titulo: nomeArquivo
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()),
    preco: 299.90,
    desconto: 15,
    avaliacao: 4.5,
    vendidos: 1250,
    condicao: 'novo',
    estoque: 'Disponível',
    categoria: 'tech',
    apiDisponivel: false,
    descricao: 'Produto de qualidade com ótimo custo-benefício. Altamente recomendado!'
  };
}
// Gerar conteúdo com IA (Groq)
async function gerarConteudoPost(produto) {
  try {
    // Se não tiver API key, usar fallback
    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️ GROQ_API_KEY não configurada, usando fallback');
      return gerarConteudoPostFallback(produto);
    }

    const prompt = `Você é um especialista em criar posts de blog atraentes sobre produtos para um site de achados e descontos.

Crie um post ÚNICO e ORIGINAL sobre este produto:

PRODUTO:
- Título: ${produto.titulo}
- Preço: R$ ${produto.preco?.toFixed(2) || 'Consultar'}
- Avaliação: ${produto.avaliacao || 4.5}/5 estrelas
- Vendedores/Clientes: ${produto.vendidos || 1000}+
- Condição: ${produto.condicao || 'Novo'}
- Categoria: ${produto.categoria || 'geral'}

INSTRUÇÕES:
1. Use linguagem casual, amigável e persuasiva
2. Crie seções claras: "Por que este produto?", "Benefícios principais", "Especificações", "Por que comprar agora?", "Resumo"
3. Seja honesto e útil - não exagere
4. Máximo 800 palavras
5. Use emojis ocasionalmente para tornar legível
6. Inclua call-to-action para comprar
7. Foco em valor e benefícios reais
8. Cada parágrafo curto (máx 3 linhas)

RESPONDA APENAS COM O CONTEÚDO DO POST, SEM MARKDOWN, SEM HASHTAGS, SEM "---", SEM TÍTULOS ADICIONAIS.`;

    const message = await groq.messages.create({
      model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
      max_tokens: 1024,
      temperature: parseFloat(process.env.GROQ_TEMPERATURE || 0.7),
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const conteudo = message.content[0].text.trim();
    console.log('✅ Conteúdo gerado com sucesso via Groq');
    return conteudo;

  } catch (error) {
    console.warn('⚠️ Erro ao gerar com Groq:', error.message);
    // Fallback se Groq falhar
    return gerarConteudoPostFallback(produto);
  }
}

// Função de fallback quando Groq não está disponível
function gerarConteudoPostFallback(produto) {
  return `
Por que este produto?

${produto.titulo} é uma excelente escolha para quem busca qualidade e melhor preço no Mercado Livre.

Benefícios principais:
✨ Preço competitivo: R$ ${produto.preco.toFixed(2)}
⭐ Altamente avaliado: ${produto.avaliacao} estrelas
✓ ${produto.vendidos} clientes satisfeitos
🏪 Vendedor verificado

Especificações:
- Condição: ${produto.condicao === 'novo' ? 'Novo' : 'Usado'}
- Estoque disponível: ${produto.estoque || 'Verificar'}
- Frete: Consultar no Mercado Livre

Por que comprar agora?

Este é um dos melhores preços encontrados no Mercado Livre. O desconto de ${produto.desconto}% representa uma oportunidade interessante para economizar.

Resumo:

${produto.titulo} é uma ótima oportunidade para aproveitar um bom preço com qualidade garantida. 
Recomendamos conferir o anúncio completo no Mercado Livre para mais detalhes e confirmar a disponibilidade.
  `.trim();
}

// Gerar HTML do post
function gerarHTMLPost(titulo, conteudo, produto, url) {
  // Obter link de afiliado se disponível
  const produtoId = url.split('/')[3].split('-').slice(0, -1).join('-');
  const affiliate = affiliatesData.produtos[produtoId];
  const linkVenda = affiliate?.afiliado_url || url;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo} | AchadoCerto.VIP</title>
    <meta name="description" content="${titulo} - ${produto.titulo} por R$ ${produto.preco.toFixed(2)}">
    
    <link rel="icon" type="image/svg+xml" href="../images/favicon.svg">
    <link rel="stylesheet" href="../style.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

    <style>
        .materia-container { max-width: 900px; margin: 40px auto; padding: 0 20px; color: #E0E0E0; line-height: 1.8; }
        .materia-header { text-align: center; margin-bottom: 40px; }
        .materia-header h1 { color: #D4AF37; font-size: 36px; margin-bottom: 10px; font-weight: 900; }
        .conteudo-texto { font-size: 18px; text-align: justify; }
        .conteudo-texto h2 { color: #D4AF37; margin-top: 40px; font-size: 26px; border-left: 4px solid #D4AF37; padding-left: 15px; }
        .beneficio-tag { background: rgba(255, 215, 0, 0.1); color: #D4AF37; padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: 14px; margin-right: 10px; display: inline-block; margin-bottom: 10px; }
        .box-oferta-premium { background: linear-gradient(135deg, #1A1F71, #151B4A); border: 1px solid rgba(212, 175, 55, 0.2); padding: 30px; border-radius: 15px; margin: 50px 0; text-align: center; }
        .botao-oferta-vip { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #0A1026; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4); transition: all 0.3s ease; border: none; cursor: pointer; }
        .botao-oferta-vip:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6); }
        .voltar { display: inline-block; margin-bottom: 20px; color: #D4AF37; text-decoration: none; font-weight: bold; }
    </style>

    <meta property="og:title" content="${titulo}" />
    <meta property="og:description" content="${titulo}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://achadocerto.vip/blog/" />
    <meta property="article:published_time" content="${new Date().toISOString()}" />
</head>
<body>

    <header class="topo">
        <div class="header-container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <a href="../index.html" style="text-decoration: none;">
                <h1 style="margin:0; font-size: 22px;">
                    <span style="color: #C5CAD3; font-weight: 300;">AchadoCerto</span><span style="color: #D4AF37; font-weight: 600;">VIP</span>
                </h1>
            </a>
        </div>
    </header>

    <article class="materia-container">
        <a href="../index.html" class="voltar"><i class="fas fa-arrow-left"></i> Voltar</a>

        <header class="materia-header">
            <h1>${titulo}</h1>
            <p style="color: #B0B0B0;">Gerado com IA | ${new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <div class="conteudo-texto">
            ${conteudo.split('\\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}

            <div class="box-oferta-premium">
                <h3>🎁 Aprovoveitar Oferta</h3>
                <p style="color: #E0E0E0; margin-bottom: 25px;">Preço: <strong>R$ ${produto.preco.toFixed(2)}</strong></p>
                <a href="${linkVenda}" target="_blank" class="botao-oferta-vip">
                    <i class="fas fa-shopping-cart"></i> COMPRAR NO MERCADO LIVRE
                </a>
                <p style="font-size:13px; margin-top:20px; opacity:0.9; color: #2ecc71; font-weight: 800;">
                    <i class="fas fa-shield-alt"></i> COMPRA GARANTIDA | LOJA OFICIAL
                </p>
            </div>
        </div>
    </article>

    <footer style="text-align: center; padding: 30px; color: #666; margin-top: 40px;">
        <p>© 2026 AchadoCerto.VIP — Todos os Direitos Reservados</p>
    </footer>

    <script src="../posts.js" defer></script>
    <script src="../script.min.js" defer></script>
</body>
</html>`;
}

// ============ TRATAMENTO DE ERROS ============

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: err.message
  });
});

// ============ INICIAR SERVIDOR ============

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 ACHADOCERTO BACKEND INICIADO        ║
╠════════════════════════════════════════════╣
║ 🌐 Server: http://localhost:${PORT}          ║
║ 🔑 API Key: ${process.env.RAPIDAPI_KEY.substring(0, 10)}...  ║
║ 📡 Host: ${process.env.RAPIDAPI_HOST}        ║
╚════════════════════════════════════════════╝

📍 Endpoints Principais:
  POST   /api/produto              - Buscar produto por URL
  POST   /api/avaliacoes           - Buscar avaliações
  GET    /api/buscar/:termo        - Buscar por termo
  POST   /api/comparativo          - Comparar produtos
  POST   /api/gerar-post           - Gerar post com dados
  GET    /api/cache/limpar         - Limpar cache
  GET    /api/health               - Status do servidor

📍 Endpoints de AFILIADOS (Novo):
  GET    /api/afiliado/:id         - Obter link + registrar clique
  GET    /api/afiliados/stats      - Ver estatísticas de cliques
  POST   /api/afiliado/adicionar   - Adicionar novo afiliado

🎯 Para usar:
  1. Edite backend/affiliates.json com seus links
  2. Use GET /api/afiliado/produto-id?pagina=seu-post.html
  3. Veja stats em GET /api/afiliados/stats
  `);
});

module.exports = app;
