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
let groq;

// Inicializar Groq com tratamento de erro
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
  console.log('✅ Groq IA inicializado com sucesso');
} else {
  console.warn('⚠️ Aviso: GROQ_API_KEY não foi encontrada no .env');
}

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

// Servir arquivos estáticos (html) - da pasta PAI (raiz do projeto)
app.use(express.static(path.join(__dirname, '..')));

// Utilitário para validar links do Mercado Livre antes de exibir ao usuário
async function validarLinkMercadoLivre(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AchadoCertoBot/1.0'
      }
    });
    clearTimeout(timeout);
    const valido = response.status >= 200 && response.status < 400;
    return { valido, status: response.status };
  } catch (error) {
    clearTimeout(timeout);
    console.warn(`⚠️ Erro ao validar link (${url}):`, error.message);
    return { valido: false, erro: error.message };
  }
}

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

// 1.1. BUSCAR PRODUTOS ALEATÓRIOS COM LINK DE AFILIADO
app.get('/api/produtos-ml-aleatorios', async (req, res) => {
  try {
    // Termos populares para buscar
    const termosPopulares = [
      'smartphones',
      'fones',
      'smartwatch',
      'notebooks',
      'tvs',
      'cafeteiras',
      'produtos em destaque',
      'eletrônicos',
      'moda',
      'casa e jardim',
      'esportes',
      'beleza',
      'games',
      'acessórios'
    ];

    // Selecionar termo aleatório
    const termo = termosPopulares[Math.floor(Math.random() * termosPopulares.length)];
    
    console.log(`🔍 Buscando produtos aleatórios para: ${termo}`);

    // Buscar produtos via API
    let resultadoBusca;
    let produtos = [];
    
    try {
      resultadoBusca = await mlAPI.buscarPorTermo(termo);
      
      console.log('📦 Resultado bruto da busca:', JSON.stringify(resultadoBusca).substring(0, 200));
      
      // Tentar extrair produtos da resposta
      if (resultadoBusca && typeof resultadoBusca === 'object') {
        produtos = resultadoBusca.listings || resultadoBusca.results || resultadoBusca.data || [];
        // Se for um array diretamente
        if (Array.isArray(resultadoBusca)) {
          produtos = resultadoBusca;
        }
      }
      
      console.log(`✅ Encontrados ${produtos.length} produtos via API`);
    } catch (apiError) {
      console.error('⚠️ API retornou erro:', apiError.message);
      // Não retornar erro ainda, usar fallback
    }

    // Se a API falhar, usar produtos de fallback
    if (!produtos || produtos.length === 0) {
      console.log('📦 Usando produtos de fallback...');
      produtos = [
        {
          id: '1',
          titulo: 'iPhone 15 Pro 256GB',
          imagem: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400',
          url: 'https://www.mercadolivre.com.br/iphone-15-pro-256gb/p/MLB',
          preco: 4990
        },
        {
          id: '2',
          titulo: 'Samsung Galaxy S24 Ultra',
          imagem: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400',
          url: 'https://www.mercadolivre.com.br/samsung-galaxy-s24-ultra/p/MLB',
          preco: 5500
        },
        {
          id: '3',
          titulo: 'Fone Wireless Sony WH-1000XM5',
          imagem: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          url: 'https://www.mercadolivre.com.br/fone-sony-wh-1000xm5/p/MLB',
          preco: 1299
        },
        {
          id: '4',
          titulo: 'Apple Watch Series 9',
          imagem: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          url: 'https://www.mercadolivre.com.br/apple-watch-series-9/p/MLB',
          preco: 2499
        },
        {
          id: '5',
          titulo: 'Notebook ASUS VivoBook 15',
          imagem: 'https://images.unsplash.com/photo-1588405748450-7e77df1a3af5?w=400',
          url: 'https://www.mercadolivre.com.br/notebook-asus-vivobook/p/MLB',
          preco: 2899
        },
        {
          id: '6',
          titulo: 'Smart TV Samsung 55"',
          imagem: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
          url: 'https://www.mercadolivre.com.br/smart-tv-samsung-55/p/MLB',
          preco: 1699
        }
      ];
      console.log(`✅ Usando ${produtos.length} produtos de fallback`);
    }

    // Código de afiliado do usuário
    const codigoAfiliado = 'muc1576372';
    const urlAfiliado = `https://www.mercadolivre.com.br/social/${codigoAfiliado}`;

    // Processar produtos e adicionar link de afiliado
    const produtosProcessados = produtos.slice(0, 10).map(produto => {
      // Adicionar código de afiliado ao link
      let linkComAfiliado = produto.url || '';
      
      // Se o produto tem URL, adicionar o código de afiliado como parâmetro
      if (linkComAfiliado) {
        const separator = linkComAfiliado.includes('?') ? '&' : '?';
        linkComAfiliado = `${linkComAfiliado}${separator}affiliateCode=${codigoAfiliado}`;
      } else {
        // Fallback: usar link geral de afiliado
        linkComAfiliado = urlAfiliado;
      }

      return {
        id: produto.id,
        titulo: produto.titulo || produto.title,
        imagem: produto.imagem || produto.image || produto.thumbnail,
        link: linkComAfiliado,
        linkAfiliado: urlAfiliado,
        preco: produto.preco || null,
        descricao: produto.descricao || '',
        vendedor: produto.vendedor || ''
      };
    });

    res.json({
      sucesso: true,
      termo: termo,
      total: produtosProcessados.length,
      produtos: produtosProcessados,
      codigoAfiliado: codigoAfiliado
    });

  } catch (error) {
    console.error('❌ Erro ao buscar produtos aleatórios:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      produtos: []
    });
  }
});

// 1.2. BUSCAR POST ALEATÓRIO DOS BLOGS (para fallback inteligente)
app.get('/api/post-aleatorio', async (req, res) => {
  try {
    const blogPath = path.join(__dirname, '..', 'frontend', 'blog');
    
    // Verificar se pasta existe
    if (!fs.existsSync(blogPath)) {
      return res.status(404).json({
        erro: 'Pasta blog não encontrada',
        sucesso: false
      });
    }

    // Ler todos os arquivos HTML da pasta blog
    const arquivos = fs.readdirSync(blogPath).filter(file => file.endsWith('.html'));

    if (arquivos.length === 0) {
      return res.status(404).json({
        erro: 'Nenhum post encontrado',
        sucesso: false
      });
    }

    // Embaralhar lista de arquivos para evitar sempre o mesmo
    const arquivosAleatorios = [...arquivos];
    for (let i = arquivosAleatorios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arquivosAleatorios[i], arquivosAleatorios[j]] = [arquivosAleatorios[j], arquivosAleatorios[i]];
    }

    for (const arquivoAleatorio of arquivosAleatorios) {
      const caminhoCompleto = path.join(blogPath, arquivoAleatorio);
      const conteudoHTML = fs.readFileSync(caminhoCompleto, 'utf8');

      // Extrair dados do HTML
      const tituloMatch = conteudoHTML.match(/<title>(.*?)<\/title>/i);
      const imagemMatch = conteudoHTML.match(/<meta property="og:image" content="(.*?)"\s*\/>/i) || 
                          conteudoHTML.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
      const descricaoMatch = conteudoHTML.match(/<meta name="description" content="(.*?)"\/>/i) ||
                             conteudoHTML.match(/<meta property="og:description" content="(.*?)"\/>/i);

      let titulo = tituloMatch ? tituloMatch[1].replace(' | Achado VIP', '').replace(' — ', ' - ').trim() : arquivoAleatorio.replace('.html', '').replace(/-/g, ' ');
      
      // Limitar título a 60 caracteres
      if (titulo.length > 60) {
        titulo = titulo.substring(0, 60) + '...';
      }
      
      let imagem = imagemMatch ? imagemMatch[1] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
      
      // Converter caminho relativo para URL absoluta
      if (imagem.startsWith('../')) {
        imagem = '/' + imagem.replace('../', '');
      } else if (!imagem.startsWith('http')) {
        imagem = '/' + imagem;
      }
      
      const descricao = descricaoMatch ? descricaoMatch[1] : 'Achado Premium Verificado';

      // Extrair link de afiliado
      // Prioridade 1: Link curto (sec) dentro de href
      let linkMatch = conteudoHTML.match(/href=["'](https?:\/\/(?:www\.)?mercadolivre\.com(?:\.br)?\/sec\/[^"']+)['"]/i);
      
      // Prioridade 2: Qualquer link do ML em href
      if (!linkMatch) {
        linkMatch = conteudoHTML.match(/href=["'](https?:\/\/(?:www\.)?mercadolivre\.com(?:\.br)?[^"']+)['"]/i);
      }
      
      // Prioridade 3: Link no JSON-LD (schema markup)
      if (!linkMatch) {
        linkMatch = conteudoHTML.match(/"url":\s*"(https?:\/\/(?:www\.)?mercadolivre\.com(?:\.br)?\/sec\/[^"]+)"/i);
      }

      const link = linkMatch ? linkMatch[1] : null;

      if (!link) {
        console.warn(`⚠️ Post ${arquivoAleatorio} não possui link de afiliado.`);
        continue;
      }

      const validacaoLink = await validarLinkMercadoLivre(link);
      if (!validacaoLink.valido) {
        console.warn(`⚠️ Link inválido (${validacaoLink.status || validacaoLink.erro}): ${link}`);
        continue;
      }

      console.log(`✅ Post aleatório selecionado: ${titulo} | Link OK (${validacaoLink.status})`);

      // Expandir link encurtado se necessário (ou usar como está)
      let linkExpandido = link;
      // Links do Mercado Livre não precisam ser expandidos - já funcionam
      console.log(`🔗 Link de afiliado pronto: ${linkExpandido}`);

      // Preço é extraído dinamicamente no frontend - usar fallback aqui
      let precoInfo = { preco: 199.90, precoOriginal: 299.90, desconto: 33 };
      console.log(`💰 Preço fallback: R$ ${precoInfo.preco} (será atualizado no frontend)`);

      return res.json({
        sucesso: true,
        titulo: titulo,
        descricao: descricao,
        imagem: imagem,
        link: link,
        arquivo: arquivoAleatorio,
        url: `/blog/${arquivoAleatorio}`,
        preco: precoInfo.preco,
        precoOriginal: precoInfo.precoOriginal,
        desconto: precoInfo.desconto
      });
    }

    return res.status(502).json({
      sucesso: false,
      erro: 'Nenhum link válido encontrado nos posts',
      detalhe: 'Todos os links testados retornaram erro ou inexistente'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar post aleatório:', error);
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 1.5. EXPANDIR LINK ENCURTADO (para evitar CORS no navegador)
app.post('/api/expandir-link', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: 'URL é obrigatória',
        expandido: false
      });
    }

    console.log('🔗 Expandindo link:', url);

    // Se não for link encurtado, retornar direto
    if (!url.includes('mercadolivre.com/sec/')) {
      return res.json({
        url: url,
        expandido: false,
        razao: 'Não é link encurtado'
      });
    }

    try {
      // Tentar expandir seguindo redirects
      let response;
      try {
        response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          timeout: 5000
        });
      } catch (headError) {
        // Se HEAD falhar, tentar GET
        response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          timeout: 5000
        });
      }

      const urlExpandida = response.url;
      console.log('✅ Link expandido:', urlExpandida);
      
      res.json({
        url: urlExpandida,
        expandido: true,
        original: url
      });
    } catch (error) {
      console.log('⚠️ Erro ao expandir:', error.message);
      res.json({
        url: url,
        expandido: false,
        erro: error.message
      });
    }

  } catch (error) {
    console.error('❌ Erro no endpoint expandir-link:', error);
    res.status(500).json({
      erro: error.message,
      expandido: false
    });
  }
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
    
    try {
      const dados = await mlAPI.buscarProduto(url);
      const produto = mlAPI.formatarProduto(dados);

      res.json({
        sucesso: true,
        produto: produto,
        dadosBrutos: dados
      });
    } catch (apiError) {
      // Se API RapidAPI falhar, retornar dados mock/fallback
      console.warn('⚠️ API RapidAPI indisponível, usando fallback');
      
      // Gerar dados mock realistas baseado na URL
      const mockProduto = gerarProdutoMock(url);
      
      res.json({
        sucesso: true,
        produto: mockProduto,
        source: 'fallback',
        mensagem: 'Dados genéricos - API indisponível'
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// NOVO: 1.5 EXPANDIR LINK ENCURTADO
app.post('/api/expandir-link', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: 'URL é obrigatória'
      });
    }

    console.log('🔗 Expandindo link:', url);

    // Se não for encurtado, retorna o mesmo
    if (!url.includes('mercadolivre.com/sec/')) {
      return res.json({
        sucesso: true,
        urlOriginal: url,
        urlExpandida: url,
        expandido: false,
        mensagem: 'Link não é encurtado'
      });
    }

    // Tentar expandir o link
    try {
      const httpsAgent = new (require('https')).Agent({
        rejectUnauthorized: false
      });

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const urlExpandida = response.url || url;
      
      console.log('✅ Link expandido:', urlExpandida);

      res.json({
        sucesso: true,
        urlOriginal: url,
        urlExpandida: urlExpandida,
        expandido: urlExpandida !== url,
        mensagem: 'Link expandido com sucesso'
      });
    } catch (fetchError) {
      console.warn('⚠️ Erro ao expandir:', fetchError.message);
      
      res.json({
        sucesso: true,
        urlOriginal: url,
        urlExpandida: url,
        expandido: false,
        mensagem: 'Não foi possível expandir, usando URL original',
        erro: fetchError.message
      });
    }

  } catch (error) {
    console.error('❌ Erro ao expandir link:', error);
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

// 2. BUSCAR AVALIAÇÕES
app.post('/api/produto', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        erro: 'URL do produto é obrigatória'
      });
    }

    console.log('📥 Requisição: GET /api/produto');
    
    try {
      const dados = await mlAPI.buscarProduto(url);
      const produto = mlAPI.formatarProduto(dados);

      res.json({
        sucesso: true,
        produto: produto,
        dadosBrutos: dados
      });
    } catch (apiError) {
      // Se API RapidAPI falhar, retornar dados mock/fallback
      console.warn('⚠️ API RapidAPI indisponível, usando fallback');
      
      // Gerar dados mock realistas baseado na URL
      const mockProduto = gerarProdutoMock(url);
      
      res.json({
        sucesso: true,
        produto: mockProduto,
        source: 'fallback',
        mensagem: 'Dados genéricos - API indisponível'
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({
      erro: error.message,
      sucesso: false
    });
  }
});

function gerarProdutoMock(url) {
  // Produtos reais brasileiros com dados mais realistas
  const produtosReais = [
    { titulo: 'iPhone 15 Pro Max 256GB', preco: 7999, precoOriginal: 8499, desconto: 6, avaliacao: 4.8, vendidos: 2340, estoque: 12 },
    { titulo: 'Samsung Galaxy S24 Ultra', preco: 6799, precoOriginal: 7199, desconto: 6, avaliacao: 4.7, vendidos: 1890, estoque: 8 },
    { titulo: 'Fone JBL Tune 770NC', preco: 299, precoOriginal: 399, desconto: 25, avaliacao: 4.6, vendidos: 5420, estoque: 45 },
    { titulo: 'Notebook ASUS VivoBook 15', preco: 2999, precoOriginal: 3499, desconto: 14, avaliacao: 4.5, vendidos: 1234, estoque: 6 },
    { titulo: 'TV 55 polegadas LG QNED80', preco: 3499, precoOriginal: 4299, desconto: 19, avaliacao: 4.9, vendidos: 867, estoque: 3 },
    { titulo: 'Airfryer Mondial 4.2L', preco: 249, precoOriginal: 399, desconto: 38, avaliacao: 4.8, vendidos: 8923, estoque: 28 },
    { titulo: 'Webcam Logitech C920 Pro', preco: 279, precoOriginal: 349, desconto: 20, avaliacao: 4.7, vendidos: 4156, estoque: 19 },
    { titulo: 'Smartwatch Samsung Galaxy Watch 6', preco: 1299, precoOriginal: 1599, desconto: 19, avaliacao: 4.6, vendidos: 3211, estoque: 15 },
    { titulo: 'Mouse Razer Basilisk V3', preco: 299, precoOriginal: 399, desconto: 25, avaliacao: 4.8, vendidos: 2987, estoque: 33 },
    { titulo: 'Teclado Mecânico Corsair K95', preco: 899, precoOriginal: 1199, desconto: 25, avaliacao: 4.7, vendidos: 1543, estoque: 11 },
    { titulo: 'Monitor LG 27 pol 144Hz', preco: 1199, precoOriginal: 1599, desconto: 25, avaliacao: 4.8, vendidos: 2156, estoque: 7 },
    { titulo: 'Headphone Sony WH-CH720', preco: 399, precoOriginal: 599, desconto: 33, avaliacao: 4.6, vendidos: 6234, estoque: 22 }
  ];
  
  // Selecionar um produto aleatório
  const produtoAleatorio = produtosReais[Math.floor(Math.random() * produtosReais.length)];
  
  // Extrair dados da URL
  const { titulo, imagem } = extrairTituloDeUrl(url);
  const tituloFinal = titulo && titulo !== 'Produto' ? titulo : produtoAleatorio.titulo;
  
  return {
    titulo: tituloFinal,
    imagem: imagem || gerarImagemPlaceholder(produtoAleatorio.titulo),
    preco: produtoAleatorio.preco,
    precoOriginal: produtoAleatorio.precoOriginal,
    desconto: produtoAleatorio.desconto,
    avaliacao: produtoAleatorio.avaliacao,
    vendidos: produtoAleatorio.vendidos,
    vendedor: 'Vendedor Verificado',
    condicao: 'novo',
    estoque: produtoAleatorio.estoque,
    link: url
  };
}

function extrairTituloDeUrl(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // O padrão da URL do ML é: /nome-do-produto/p/PRODUCT_ID ou /sec/SHORT_ID
    const partes = path.split('/').filter(p => p);
    
    // Se for uma URL curta (/sec/...), tentar extrair algo mais significativo
    if (partes[0] === 'sec' || partes[0] === 'SEC') {
      // Para URLs curtas, retornar null para que a API tente resolver
      return {
        titulo: null,
        palavra_chave: 'produto'
      };
    }
    
    // Para URLs normais, procurar a primeira parte que não é 'p' e não começa com 'MLA'
    for (let i = 0; i < partes.length; i++) {
      const parte = partes[i];
      if (parte !== 'p' && !parte.startsWith('MLA')) {
        const titulo = decodeURIComponent(parte).replace(/-/g, ' ');
        // Capitalizar primeira letra de cada palavra
        const tituloFormatado = titulo
          .split(' ')
          .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
          .join(' ');
        
        return {
          titulo: tituloFormatado,
          palavra_chave: parte.split('-')[0]
        };
      }
    }
    
    return {
      titulo: null,
      palavra_chave: 'produto'
    };
  } catch (e) {
    return {
      titulo: null,
      palavra_chave: 'produto'
    };
  }
}

function gerarImagemPlaceholder(keyword) {
  // Imagens reais de produtos via DuckDuckGo/Unsplash
  const queries = {
    'iphone': 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&h=500&fit=crop',
    'samsung': 'https://images.unsplash.com/photo-1610945415295-d9bbf8d33b4b?w=500&h=500&fit=crop',
    'motorola': 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500&h=500&fit=crop',
    'fone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    'tv': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=500&fit=crop',
    'notebook': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
    'smartphone': 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop',
    'airfryer': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500&h=500&fit=crop',
    'webcam': 'https://images.unsplash.com/photo-1598122045060-5c505c02e15f?w=500&h=500&fit=crop',
    'smartwatch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    'mouse': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
    'teclado': 'https://images.unsplash.com/photo-1587829191301-dc798b83add3?w=500&h=500&fit=crop',
    'monitor': 'https://images.unsplash.com/photo-1559056199-641a0ac8b8d5?w=500&h=500&fit=crop',
    'headphone': 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop'
  };
  
  const keywordLower = keyword.toLowerCase();
  for (const [key, value] of Object.entries(queries)) {
    if (keywordLower.includes(key)) {
      return value;
    }
  }
  
  // Fallback genérico com imagem de produto
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
}

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

// ============ ATUALIZAR AFILIADOS (NOVO) ============
// Endpoint para atualizar links de afiliados em massa
app.post('/api/atualizar-afiliados', (req, res) => {
  try {
    const dados = req.body; // { "produto-id": { "mercadolivre": "url", "amazon": "url", ... }, ... }

    // Atualizar cada produto com os novos URLs
    Object.keys(dados).forEach(produtoId => {
      if (!affiliatesData.produtos[produtoId]) {
        affiliatesData.produtos[produtoId] = {
          titulo: produtoId.replace(/-/g, ' ').toUpperCase(),
          categoria: 'geral',
          afiliados: {},
          ativo: true,
          cliques: 0,
          criado_em: new Date().toISOString()
        };
      }

      // Garantir que existe a estrutura de afiliados
      if (!affiliatesData.produtos[produtoId].afiliados) {
        affiliatesData.produtos[produtoId].afiliados = {};
      }

      // Atualizar cada afiliado se URL foi fornecida
      ['mercadolivre', 'amazon', 'magalu'].forEach(afiliado => {
        const url = dados[produtoId][afiliado];
        if (url) {
          affiliatesData.produtos[produtoId].afiliados[afiliado] = {
            ativo: true,
            url: url,
            codigo: url // Usar a URL como código (já tem o tracking)
          };
        }
      });
    });

    // Salvar em arquivo
    fs.writeFileSync(affiliatesPath, JSON.stringify(affiliatesData, null, 2));

    console.log('✅ Afiliados atualizados com sucesso');
    res.json({
      sucesso: true,
      mensagem: '✅ Afiliados atualizados com sucesso! Todos os 9 produtos foram configurados.'
    });

  } catch (error) {
    console.error('Erro ao atualizar afiliados:', error);
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

    const caminhoArquivo = path.join(__dirname, '..', 'frontend', 'blog', nomeArquivo);

    // Criar diretório se não existir
    const blogDir = path.join(__dirname, '..', 'frontend', 'blog');
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
      url: `/blog/${nomeArquivo}`
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

    // Validar se Groq está inicializado
    if (!groq) {
      console.warn('⚠️ Groq não está inicializado, usando fallback');
      return gerarConteudoPostFallback(produto);
    }

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
  // Obter link de afiliado se disponível - suporta múltiplos afiliados
  const produtoId = url.split('/')[3].split('-').slice(0, -1).join('-');
  const affiliate = affiliatesData.produtos[produtoId];
  
  // Priorizar Mercado Livre, depois Amazon, depois Magalu
  let linkVenda = url;
  if (affiliate?.afiliados) {
    if (affiliate.afiliados.mercadolivre?.ativo) {
      linkVenda = affiliate.afiliados.mercadolivre.url;
    } else if (affiliate.afiliados.amazon?.ativo) {
      linkVenda = affiliate.afiliados.amazon.url;
    } else if (affiliate.afiliados.magalu?.ativo) {
      linkVenda = affiliate.afiliados.magalu.url;
    }
  } else if (affiliate?.afiliado_url) {
    // Fallback para estrutura antiga
    linkVenda = affiliate.afiliado_url;
  }


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

// ============ INICIAR SERVIDOR (LOCAL APENAS) ============

// No Vercel, o runtime cria o listener automaticamente. Evita erro de porta ocupada.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const apiKeyDisplay = process.env.RAPIDAPI_KEY 
      ? process.env.RAPIDAPI_KEY.substring(0, 10) + '...' 
      : 'Não configurado';
    const hostDisplay = process.env.RAPIDAPI_HOST || 'Não configurado';
    
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 ACHADOCERTO BACKEND INICIADO        ║
╠════════════════════════════════════════════╣
║ 🌐 Server: http://localhost:${PORT}          ║
║ 🔑 API Key: ${apiKeyDisplay}  ║
║ 📡 Host: ${hostDisplay}        ║
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
} else {
  console.log('➡️ Rodando em ambiente Vercel (serverless) - listener automático');
}

module.exports = app;
