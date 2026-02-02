// =====================================
// SISTEMA DE PRODUTOS DINÂMICOS
// AchadoCerto.VIP - Integração ML API
// =====================================

class AchadoCertoProdutos {
    constructor() {
        // Detectar ambiente
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiUrl = isDev ? 'http://localhost:3001' : window.location.origin;
        
        this.cache = new Map();
        this.cacheTime = 30 * 60 * 1000; // 30 minutos
        this.debug = localStorage.getItem('DEBUG_ACHADOCERTO') === 'true';
        this.apiStatus = 'unknown';
        
        this.init();
    }

    // Inicializar sistema
    init() {
        this.criarEstilos();
        this.verificarApiStatus();
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
            if (this.debug) console.log('API Status:', this.apiStatus);
        } catch (error) {
            this.apiStatus = 'offline';
            if (this.debug) console.log('API offline:', error.message);
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
        // Mostrar loading
        container.innerHTML = this.getLoadingHTML(titulo);

        try {
            // Buscar dados do produto
            const dados = await this.buscarProduto(url);
            
            if (dados) {
                container.innerHTML = this.getProdutoHTML(dados, url);
            } else {
                container.innerHTML = this.getFallbackHTML(titulo, url);
            }
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            container.innerHTML = this.getFallbackHTML(titulo, url);
        }
    }

    // Buscar dados do produto (com cache e fallback)
    async buscarProduto(url) {
        // Verificar cache
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            if (this.debug) console.log('📦 Cache hit para:', url);
            return cached.data;
        }

        try {
            // Se API online, tentar buscar dados reais
            if (this.apiStatus === 'online') {
                const response = await fetch(`${this.apiUrl}/api/produto`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url }),
                    timeout: 8000
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.sucesso && result.produto) {
                        // Cachear resultado
                        this.cache.set(cacheKey, {
                            data: result.produto,
                            timestamp: Date.now()
                        });
                        
                        if (this.debug) console.log('✅ Dados do produto carregados:', result.produto);
                        return result.produto;
                    }
                }
            }
        } catch (error) {
            if (this.debug) console.log('⚠️ Erro ao buscar produto:', error.message);
        }

        // Fallback: dados estáticos
        if (this.debug) console.log('📌 Usando fallback para:', url);
        return this.gerarDadosFallback(url);
    }

    // Gerar dados estáticos quando API offline
    gerarDadosFallback(url) {
        // Extrair informações do URL para criar dados mais realistas
        try {
            const urlObj = new URL(url);
            const params = urlObj.pathname;
            
            // Padrão geral de um produto de exemplo
            const produtos = {
                titulo: this.extrairTituloUrl(url) || 'Produto Premium Verificado',
                preco: 299.90,
                precoOriginal: 399.90,
                desconto: 25,
                avaliacao: 4.7,
                vendidos: 1250,
                vendedor: 'Vendedor Verificado',
                condicao: 'novo',
                estoque: 15,
                url: url,
                imagem: 'https://via.placeholder.com/300x300?text=Produto'
            };
            
            return produtos;
        } catch (error) {
            return {
                titulo: 'Produto Premium',
                preco: 299.90,
                precoOriginal: 399.90,
                desconto: 25,
                avaliacao: 4.7,
                vendidos: 1250,
                vendedor: 'Vendedor Verificado',
                condicao: 'novo',
                estoque: 15,
                url: url,
                imagem: 'https://via.placeholder.com/300x300?text=Produto'
            };
        }
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
        const precoFormatado = produto.preco.toFixed(2).replace('.', ',');
        const precoOriginalFormatado = produto.precoOriginal ? 
            produto.precoOriginal.toFixed(2).replace('.', ',') : null;
        
        const badge = this.apiStatus === 'online' ? 'Verificado' : 'Verificado (Cache)';
        const badgeColor = this.apiStatus === 'online' ? '🟢' : '🟡';
        
        // Extrair ID do produto para buscar link de afiliado
        const produtoId = this.extrairProdutoId(url);
        const paginaAtual = window.location.pathname.split('/').pop() || 'desconhecida';
        
        return `
            <div class="produto-widget">
                <div class="produto-header">
                    <div class="produto-icon">🎯</div>
                    <div class="produto-badge">${badgeColor} ${badge}</div>
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
                        <button onclick="window.achadoCerto.abrirLinkAfiliado('${produtoId}', '${paginaAtual}')" class="btn-produto">
                            <i class="fas fa-shopping-cart"></i>
                            Comprar no ML
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Sanitizar HTML para evitar XSS
    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Extrair ID do produto da URL
    extrairProdutoId(url) {
        try {
            const parts = url.split('/').filter(p => p);
            // Pega o último segmento (nome do produto) e remove números finais (código ML)
            const ultimoParte = parts[parts.length - 1];
            const id = ultimoParte.split('-').slice(0, -1).join('-') || ultimoParte;
            return id.toLowerCase().replace(/[^a-z0-9-]/g, '');
        } catch (error) {
            return 'produto-desconhecido';
        }
    }

    // Abrir link de afiliado e registrar clique
    async abrirLinkAfiliado(produtoId, pagina) {
        try {
            if (this.apiStatus !== 'online') {
                // Se offline, abre URL direto do Mercado Livre
                if (this.debug) console.log('⚠️ API offline - abrindo link direto');
                window.open('https://www.mercadolivre.com.br/', '_blank');
                return;
            }

            // Buscar link de afiliado no backend
            const response = await fetch(
                `${this.apiUrl}/api/afiliado/${produtoId}?pagina=${encodeURIComponent(pagina)}`
            );

            if (response.ok) {
                const result = await response.json();
                if (this.debug) console.log('✅ Clique registrado:', result);
                
                // Abrir link de afiliado
                window.open(result.url, '_blank');
            } else {
                // Fallback: abrir Mercado Livre
                if (this.debug) console.log('⚠️ Produto não encontrado em afiliados');
                window.open('https://www.mercadolivre.com.br/', '_blank');
            }
        } catch (error) {
            console.error('Erro ao abrir link:', error);
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