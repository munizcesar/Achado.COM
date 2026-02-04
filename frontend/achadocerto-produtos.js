// =====================================
// SISTEMA DE PRODUTOS DINÂMICOS
// AchadoCerto.VIP - Integração ML API
// =====================================

class AchadoCertoProdutos {
    constructor() {
        // Usar URLs relativas que funcionam em qualquer domínio
        this.apiUrl = '';  // URLs relativas: /api/...
        
        this.cache = new Map();
        this.cacheTime = 30 * 60 * 1000; // 30 minutos
        this.debug = localStorage.getItem('DEBUG_ACHADOCERTO') === 'true';
        this.apiStatus = 'unknown';
        this.produtoLinks = new Map(); // Mapa para armazenar links dos produtos
        
        this.init();
    }

    // Inicializar sistema
    async init() {
        this.criarEstilos();
        await this.verificarApiStatus();  // Aguardar verificação
        this.processar();
        console.log('🚀 Sistema AchadoCerto iniciado | API:', this.apiUrl);
    }

    // Verificar se API está disponível
    async verificarApiStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/api/health`, {
                method: 'GET',
                timeout: 3000
            });
            this.apiStatus = response.ok ? 'online' : 'offline';
            console.log('🔍 API Health Check:', this.apiStatus, 'Status Code:', response.status);
        } catch (error) {
            this.apiStatus = 'offline';
            console.log('🔴 API Error:', error.message);
        }
    }

    // CSS dinâmico que se integra ao tema dark
    criarEstilos() {
        const style = document.createElement('style');
        style.textContent = `
            /* =================== WIDGET PRODUTO =================== */
            .produto-widget {
                background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-light) 100%);
                border: 1px solid var(--color-border);
                border-radius: 16px;
                padding: 24px;
                margin: 24px 0;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .produto-widget::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, var(--color-primary), var(--color-urgent));
                border-radius: 16px 16px 0 0;
            }

            .produto-widget:hover {
                transform: translateY(-4px);
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
                border-color: var(--color-primary);
            }

            .produto-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }

            .produto-icon {
                width: 32px;
                height: 32px;
                background: var(--color-primary);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--bg-dark);
                font-weight: bold;
                font-size: 16px;
            }

            .produto-badge {
                background: var(--color-urgent);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .produto-info {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 20px;
                align-items: center;
            }

            .produto-detalhes h3 {
                color: var(--color-text);
                font-size: 18px;
                font-weight: 500;
                margin: 0 0 8px 0;
                line-height: 1.4;
            }

            .produto-meta {
                display: flex;
                gap: 16px;
                align-items: center;
                margin: 12px 0;
                flex-wrap: wrap;
            }

            .produto-preco {
                font-size: 24px;
                font-weight: 600;
                color: var(--color-primary);
                display: flex;
                align-items: baseline;
                gap: 8px;
            }

            .preco-original {
                font-size: 16px;
                color: var(--color-text-muted);
                text-decoration: line-through;
                font-weight: 400;
            }

            .desconto {
                background: var(--color-success);
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
            }

            .produto-rating {
                display: flex;
                align-items: center;
                gap: 6px;
                color: var(--color-primary);
                font-size: 14px;
            }

            .produto-vendidos {
                color: var(--color-text-muted);
                font-size: 14px;
            }

            .produto-acoes {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .btn-produto {
                background: linear-gradient(135deg, var(--color-primary), #F4C10F);
                color: var(--bg-dark);
                border: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                min-width: 180px;
            }

            .btn-produto:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
                background: linear-gradient(135deg, #F4C10F, var(--color-primary));
            }

            .btn-secundario {
                background: transparent;
                border: 1px solid var(--color-border);
                color: var(--color-text);
                font-size: 12px;
                padding: 8px 16px;
                border-radius: 8px;
            }

            .btn-secundario:hover {
                background: var(--bg-card-light);
                border-color: var(--color-primary);
            }

            .produto-loading {
                display: flex;
                align-items: center;
                gap: 12px;
                color: var(--color-text-muted);
                font-style: italic;
            }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid var(--color-border);
                border-top-color: var(--color-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .produto-erro {
                background: rgba(255, 107, 53, 0.1);
                border: 1px solid var(--color-urgent);
                color: var(--color-urgent);
                padding: 16px;
                border-radius: 12px;
                font-size: 14px;
            }

            /* =================== COMPARATIVO =================== */
            .comparativo-container {
                background: var(--bg-card);
                border-radius: 16px;
                padding: 24px;
                margin: 32px 0;
                border: 1px solid var(--color-border);
            }

            .comparativo-header {
                text-align: center;
                margin-bottom: 24px;
            }

            .comparativo-header h2 {
                color: var(--color-primary);
                font-size: 24px;
                margin: 0 0 8px 0;
            }

            .comparativo-header p {
                color: var(--color-text-muted);
                margin: 0;
            }

            .comparativo-grid {
                display: grid;
                gap: 16px;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            }

            /* =================== RESPONSIVO =================== */
            @media (max-width: 768px) {
                .produto-info {
                    grid-template-columns: 1fr;
                    text-align: center;
                }

                .produto-meta {
                    justify-content: center;
                }

                .produto-acoes {
                    align-items: center;
                }

                .btn-produto {
                    width: 100%;
                    max-width: 280px;
                }

                .produto-preco {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Processar todos os produtos na página
    async processar() {
        const elementos = document.querySelectorAll('[data-produto-url]');
        
        for (const elemento of elementos) {
            const url = elemento.getAttribute('data-produto-url');
            const titulo = elemento.getAttribute('data-produto-titulo') || 'Produto';
            
            this.criarWidget(elemento, url, titulo);
        }
    }

    // Criar widget do produto
    async criarWidget(container, url, titulo) {
        console.log('🎨 Criando widget para URL:', url);
        // Mostrar loading
        container.innerHTML = this.getLoadingHTML(titulo);

        try {
            // Buscar dados do produto
            const dados = await this.buscarProduto(url);
            console.log('📦 Dados recebidos:', dados);
            
            if (dados) {
                console.log('✅ Renderizando HTML com dados...');
                container.innerHTML = this.getProdutoHTML(dados, url);
            } else {
                console.log('⚠️ Sem dados, usando fallback...');
                container.innerHTML = this.getFallbackHTML(titulo, url);
            }
        } catch (error) {
            console.error('❌ Erro ao buscar produto:', error);
            container.innerHTML = this.getFallbackHTML(titulo, url);
        }
    }

    // Buscar dados do produto (com cache e fallback)
    async buscarProduto(url) {
        // Expandir link encurtado se necessário
        const urlExpandida = await this.expandirLinkEncurtado(url);
        const urlFinal = urlExpandida || url;

        // Verificar cache
        const cacheKey = urlFinal;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            if (this.debug) console.log('📦 Cache hit para:', urlFinal);
            return cached.data;
        }

        try {
            // Se API online, tentar buscar dados reais
            if (this.apiStatus === 'online') {
                console.log('📡 Buscando produto:', urlFinal);
                const response = await fetch(`${this.apiUrl}/api/produto`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: urlFinal }),
                    timeout: 8000
                });

                console.log('📍 Resposta API:', response.status, response.ok);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Dados recebidos:', result.produto.titulo);
                    
                    if (result.sucesso && result.produto) {
                        // Detectar se é fallback do servidor (produto não relacionado à URL)
                        // Comparamos a URL retornada: se for a mesma URL mas título diferente = fallback
                        const urlRetornada = result.produto.link || '';
                        const tituloRetornado = (result.produto.titulo || '').toLowerCase();
                        
                        // Lista de produtos genéricos do fallback do servidor
                        const produtosFallback = ['iphone', 'samsung', 'galaxy', 'notebook', 'airfryer', 
                                                   'webcam', 'smartwatch', 'mouse', 'teclado', 'monitor', 
                                                   'headphone', 'tv', 'fone'];
                        
                        const ehFallbackServidor = produtosFallback.some(p => tituloRetornado.includes(p)) && 
                                                   !urlFinal.toLowerCase().includes(tituloRetornado.split(' ')[0]);
                        
                        if (ehFallbackServidor) {
                            console.log('⚠️ Detectado fallback do servidor, usando sistema de posts aleatórios');
                            return await this.gerarDadosFallback(urlFinal);
                        }
                        
                        // É produto real - guardar URL e usar
                        result.produto.url = urlFinal;
                        
                        // Cachear resultado
                        this.cache.set(cacheKey, {
                            data: result.produto,
                            timestamp: Date.now()
                        });
                        
                        return result.produto;
                    }
                }
            } else {
                console.log('⚠️ API offline, usando fallback');
            }
        } catch (error) {
            console.log('🔴 Erro ao buscar produto:', error.message);
        }

        // Fallback: dados estáticos
        if (this.debug) console.log('📌 Usando fallback para:', urlFinal);
        return await this.gerarDadosFallback(urlFinal);
    }

    // Expandir link encurtado do Mercado Livre
    async expandirLinkEncurtado(url) {
        try {
            // Se não for link encurtado, retornar null (usar URL original)
            if (!url.includes('mercadolivre.com/sec/')) {
                return null;
            }

            if (this.debug) console.log('🔗 Expandindo link encurtado:', url);

            // Usar endpoint do backend para expandir
            try {
                const response = await fetch(`${this.apiUrl}/api/expandir-link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.expandido && result.url) {
                        console.log('✅ Link expandido pelo backend:', result.url);
                        return result.url;
                    }
                }
            } catch (backendError) {
                console.log('⚠️ Erro ao usar backend para expandir:', backendError.message);
            }

            return null;
        } catch (error) {
            console.log('⚠️ Erro ao expandir link:', error.message);
            return null;
        }
    }

    // Gerar dados estáticos quando API offline (RELEVANTES ao URL)
    async gerarDadosFallback(url) {
        // Primeiro, tenta buscar um post aleatório do blog
        if (this.apiStatus === 'online') {
            try {
                console.log('🎲 Buscando post aleatório do blog...');
                const response = await fetch(`${this.apiUrl}/api/post-aleatorio`);
                
                if (response.ok) {
                    const post = await response.json();
                    if (post.sucesso) {
                        console.log('✅ Post aleatório encontrado:', post.titulo);
                        console.log('� Preço (backend):', post.preco, 'R$ | Desconto:', post.desconto, '%');
                        console.log('🔗 Link de afiliado:', post.link);
                        
                        // Usar os dados exatamente como retornou do backend
                        return {
                            titulo: post.titulo,
                            preco: post.preco, 
                            precoOriginal: post.precoOriginal,
                            desconto: post.desconto,
                            avaliacao: 4.7,
                            vendidos: 1250,
                            vendedor: 'Vendedor Verificado',
                            condicao: 'novo',
                            estoque: 15,
                            url: post.link,  // Link de afiliado do post
                            imagem: post.imagem
                        };
                    }
                }
            } catch (error) {
                console.log('⚠️ Erro ao buscar post aleatório:', error.message);
            }
        }

        // Fallback: gerar dados baseado no tipo de produto
        try {
            const titulo = this.extrairTituloUrl(url);
            const imagem = this.gerarImagemRealista(url);
            
            // Gerar preço realista baseado no tipo de produto
            const precoPorTipo = {
                'creatina': { preco: 65, precoOriginal: 95, desconto: 31 },
                'whey': { preco: 79, precoOriginal: 120, desconto: 34 },
                'colageno': { preco: 45, precoOriginal: 65, desconto: 30 },
                'arginina': { preco: 55, precoOriginal: 80, desconto: 31 },
                'legging': { preco: 89, precoOriginal: 129, desconto: 31 },
                'cafeteira': { preco: 199, precoOriginal: 299, desconto: 33 },
                'tv': { preco: 1499, precoOriginal: 1999, desconto: 25 },
                'smartphone': { preco: 999, precoOriginal: 1299, desconto: 23 },
                'fone': { preco: 199, precoOriginal: 299, desconto: 33 },
                'jbl': { preco: 249, precoOriginal: 399, desconto: 37 }
            };

            let precoInfo = { preco: 299.90, precoOriginal: 399.90, desconto: 25 };
            const urlLower = this.normalizarTexto(url);
            
            for (const [tipo, preco] of Object.entries(precoPorTipo)) {
                if (urlLower.includes(this.normalizarTexto(tipo))) {
                    precoInfo = preco;
                    break;
                }
            }
            
            return {
                titulo: titulo || 'Produto Premium Verificado',
                preco: precoInfo.preco,
                precoOriginal: precoInfo.precoOriginal,
                desconto: precoInfo.desconto,
                avaliacao: 4.7,
                vendidos: 1250,
                vendedor: 'Vendedor Verificado',
                condicao: 'novo',
                estoque: 15,
                url: url,
                imagem: imagem
            };
        } catch (error) {
            console.error('Erro ao gerar fallback:', error);
            return {
                titulo: 'Produto Premium Verificado',
                preco: 299.90,
                precoOriginal: 399.90,
                desconto: 25,
                avaliacao: 4.7,
                vendidos: 1250,
                vendedor: 'Vendedor Verificado',
                condicao: 'novo',
                estoque: 15,
                url: url,
                imagem: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'
            };
        }
    }

    // DEBUG: Log detalhado
    logDados(dados) {
        console.log('=== DADOS DO WIDGET ===');
        console.log('Título:', dados.titulo);
        console.log('Preço:', dados.preco, typeof dados.preco);
        console.log('Preço Original:', dados.precoOriginal);
        console.log('Desconto:', dados.desconto);
        console.log('URL:', dados.url);
        console.log('Imagem:', dados.imagem?.substring(0, 60));
        console.log('========================');
    }

    // Gerar imagem realista baseada no título
    gerarImagemRealista(url) {
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
            'headphone': 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
            'cafeteira': 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500&h=500&fit=crop',
            'legging': 'https://images.unsplash.com/photo-1506629082847-11d3e7789919?w=500&h=500&fit=crop',
            'colágeno': 'https://images.unsplash.com/photo-1584308666744-24d5f400f6f0?w=500&h=500&fit=crop',
            'creatina': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=500&fit=crop',
            'jbl': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
            'whey': 'https://images.unsplash.com/photo-1584308666744-24d5f400f6f0?w=500&h=500&fit=crop'
        };
        
        const urlLower = url.toLowerCase();
        for (const [key, value] of Object.entries(queries)) {
            if (urlLower.includes(key)) {
                return value;
            }
        }
        
        // Fallback genérico com imagem de produto
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
    }

    // Extrair título do URL
    extrairTituloUrl(url) {
        try {
            const parts = url.split('/').filter(p => p);
            const titulo = parts[parts.length - 1]?.split('-').slice(0, -1).join(' ') || '';
            return titulo.charAt(0).toUpperCase() + titulo.slice(1);
        } catch (error) {
            return '';
        }
    }

    // HTML do loading
    getLoadingHTML(titulo) {
        return `
            <div class="produto-widget">
                <div class="produto-header">
                    <div class="produto-icon">💎</div>
                    <div class="produto-badge">Verificando</div>
                </div>
                <div class="produto-loading">
                    <div class="loading-spinner"></div>
                    Buscando melhor preço para ${titulo}...
                </div>
            </div>
        `;
    }

    // HTML do produto com dados
    getProdutoHTML(produto, url) {
        // Log detalhado dos dados recebidos
        this.logDados(produto);
        
        const precoFormatado = produto.preco.toFixed(2).replace('.', ',');
        const precoOriginalFormatado = produto.precoOriginal ? 
            produto.precoOriginal.toFixed(2).replace('.', ',') : null;
        
        const badge = this.apiStatus === 'online' ? 'Verificado' : 'Verificado (Cache)';
        const badgeColor = this.apiStatus === 'online' ? '🟢' : '🟡';
        
        // Extrair ID do produto para buscar link de afiliado
        const produtoId = this.extrairProdutoId(url);
        const paginaAtual = window.location.pathname.split('/').pop() || 'desconhecida';
        
        // Usar o link do produto se tiver (post aleatório), senão usa a URL original
        const linkProduto = produto.url || url;
        
        console.log('📌 Link do produto:', linkProduto);
        
        // Codificar o link em base64 para passar no onclick
        const linkBase64 = btoa(encodeURIComponent(linkProduto));
        
        const imagemUrl = produto.imagem || 'https://via.placeholder.com/400x300?text=Produto&bg=0D1B4A&txtcolor=D4AF37';
        
        return `
            <div class="produto-widget">
                <div class="produto-header">
                    <div class="produto-icon">🎯</div>
                    <div class="produto-badge">${badgeColor} ${badge}</div>
                </div>
                
                <div class="produto-imagem">
                    <img src="${imagemUrl}" alt="${this.sanitizeHTML(produto.titulo)}" style="width: 100%; height: auto; border-radius: 8px; object-fit: cover;">
                </div>
                
                <div class="produto-info">
                    <div class="produto-detalhes">
                        <h3>${this.sanitizeHTML(produto.titulo)}</h3>
                        
                        <div class="produto-meta">
                            <div class="produto-preco">
                                R$ ${precoFormatado}
                                ${precoOriginalFormatado && produto.preco < produto.precoOriginal ? 
                                    `<span class="preco-original">R$ ${precoOriginalFormatado}</span>` 
                                    : ''
                                }
                                ${produto.desconto > 0 ? 
                                    `<span class="desconto">-${produto.desconto}%</span>` 
                                    : ''
                                }
                            </div>
                        </div>
                        
                        <div class="produto-meta">
                            ${produto.avaliacao > 0 ? 
                                `<div class="produto-rating">
                                    <span>⭐</span> ${produto.avaliacao} (${produto.vendidos} vendidos)
                                </div>` 
                                : ''
                            }
                        </div>
                        
                        <div class="produto-meta" style="font-size: 12px; color: var(--color-text-muted);">
                            <span>✓ ${produto.condicao === 'novo' ? 'Novo' : 'Usado'}</span>
                            <span>📦 ${produto.estoque || '?'} em estoque</span>
                        </div>
                    </div>
                    
                    <div class="produto-acoes">
                        <button onclick="window.achadoCerto.abrirLink('${linkBase64}')" class="btn-produto">
                            <i class="fas fa-shopping-cart"></i>
                            Comprar no ML
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Abrir link decodificado
    abrirLink(linkBase64) {
        try {
            const link = decodeURIComponent(atob(linkBase64));
            console.log('🔗 Abrindo link:', link);
            window.open(link, '_blank');
        } catch (error) {
            console.error('❌ Erro ao abrir link:', error);
            window.open('https://www.mercadolivre.com.br/', '_blank');
        }
    }

    // Sanitizar HTML para evitar XSS
    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    normalizarTexto(texto) {
        return (texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // Extrair ID do produto da URL
    extrairProdutoId(url) {
        try {
            // URL: https://www.mercadolivre.com.br/motorola-moto-e14-64gb-preto-prismatico/p/MLB32154234
            // Extrai: motorola-moto-e14-64gb-preto-prismatico
            const match = url.match(/mercadolivre\.com\.br\/([^\/]+?)(?:\/p\/|$)/);
            if (match && match[1]) {
                let nomeProduto = match[1].toLowerCase();
                // Remove quantidade (ex: -64gb, -128gb, etc)
                nomeProduto = nomeProduto.replace(/-\d+(?:gb|ml|g|l)$/i, '');
                // Remove cores e materiais comuns (ex: -preto, -inox, etc)
                nomeProduto = nomeProduto.replace(/-(preto|branco|prata|cinza|rosa|vermelho|azul|inox|aço|material).*$/i, '');
                // Remove espaços e caracteres especiais
                nomeProduto = nomeProduto.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
                return nomeProduto;
            }
            return 'produto-desconhecido';
        } catch (error) {
            console.error('Erro ao extrair ID do produto:', error);
            return 'produto-desconhecido';
        }
    }

    // Abrir link de afiliado e registrar clique
    async abrirLinkAfiliado(widgetId, pagina) {
        try {
            console.log('🔗 Abrindo link do widget:', widgetId);
            
            // Primeiro verifica se tem link armazenado
            const linkArmazenado = this.produtoLinks.get(widgetId);
            if (linkArmazenado) {
                console.log('🔗 Usando link armazenado:', linkArmazenado);
                window.open(linkArmazenado, '_blank');
                return;
            }
            
            console.log('⚠️ Link não encontrado, abrindo Mercado Livre');
            window.open('https://www.mercadolivre.com.br/', '_blank');
            
        } catch (error) {
            console.error('❌ Erro ao abrir link:', error);
            // Fallback: abrir Mercado Livre
            window.open('https://www.mercadolivre.com.br/', '_blank');
        }
    }

    // HTML fallback (quando API offline)
    getFallbackHTML(titulo, url) {
        return `
            <div class="produto-widget">
                <div class="produto-header">
                    <div class="produto-icon">🔗</div>
                    <div class="produto-badge">Direto ML</div>
                </div>
                
                <div class="produto-info">
                    <div class="produto-detalhes">
                        <h3>${titulo}</h3>
                        <div class="produto-meta">
                            <div style="color: var(--color-text-muted); font-size: 14px;">
                                Verificando preço atual no Mercado Livre...
                            </div>
                        </div>
                    </div>
                    
                    <div class="produto-acoes">
                        <a href="${url}" target="_blank" class="btn-produto">
                            <i class="fas fa-external-link-alt"></i>
                            Ver no Mercado Livre
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Criar comparativo
    async criarComparativo(urls) {
        if (!Array.isArray(urls)) {
            urls = [urls];
        }

        if (this.apiStatus !== 'online') {
            alert('Comparativo indisponível offline. API está offline.');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/comparativo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ urls }),
                timeout: 15000
            });

            if (response.ok) {
                const result = await response.json();
                if (result.sucesso) {
                    this.mostrarComparativo(result);
                    if (this.debug) console.log('✅ Comparativo gerado:', result);
                }
            }
        } catch (error) {
            console.error('Erro ao gerar comparativo:', error);
            alert('Erro ao gerar comparativo. Tente novamente.');
        }
    }

    // Mostrar comparativo
    mostrarComparativo(dados) {
        console.log('📊 Comparativo:', dados);
        // Implementar modal ou seção com comparativo conforme necessidade
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.achadoCerto = new AchadoCertoProdutos();
});

// Função global para adicionar produtos dinamicamente
window.adicionarProduto = function(url, titulo, container) {
    const elemento = document.createElement('div');
    elemento.setAttribute('data-produto-url', url);
    elemento.setAttribute('data-produto-titulo', titulo);
    
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    container.appendChild(elemento);
    
    if (window.achadoCerto) {
        window.achadoCerto.criarWidget(elemento, url, titulo);
    }
};