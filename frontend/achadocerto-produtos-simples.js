// ======================================
// SISTEMA DE PRODUTOS SIMPLIFICADO
// Apenas mostra posts aleatórios com preço real
// ======================================

class AchadoCertoProdutos {
    constructor() {
        // Usar URLs relativas para funcionar em qualquer domínio
        // O backend está no mesmo servidor (na pasta pai)
        this.apiUrl = '/api';
        this.apiStatus = 'online';
        
        console.log('🚀 Sistema AchadoCerto Simplificado iniciado');
        console.log('📡 Conectando ao backend em:', this.apiUrl);
        this.criarEstilos();
        this.processar();
    }

    criarEstilos() {
        const style = document.createElement('style');
        style.textContent = `
            .produto-widget {
                background: linear-gradient(135deg, #1a2f6a 0%, #0d1b4a 100%);
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 16px;
                padding: 24px;
                margin: 24px 0;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                color: #fff;
            }

            .produto-widget:hover {
                transform: translateY(-4px);
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
                border-color: #D4AF37;
            }

            .produto-imagem img {
                width: 100%;
                height: auto;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .produto-widget h3 {
                margin: 0 0 12px 0;
                font-size: 18px;
                color: #fff;
            }

            .produto-preco {
                font-size: 24px;
                font-weight: bold;
                color: #FFD700;
                margin-bottom: 12px;
            }

            .preco-original {
                text-decoration: line-through;
                color: #888;
                margin-left: 12px;
                font-size: 16px;
            }

            .desconto {
                background: #FF6B6B;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                margin-left: 8px;
                font-size: 12px;
            }

            .btn-produto {
                background: linear-gradient(135deg, #fbd35d 0%, #f0b93d 100%);
                border: none;
                color: #0B1220;
                padding: 12px 22px;
                border-radius: 999px;
                font-weight: 700;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                cursor: pointer;
                width: 100%;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-align: center;
                text-decoration: none;
                box-shadow: 0 8px 22px rgba(240, 185, 61, 0.3);
            }

            .btn-produto::before {
                content: attr(data-icon);
                font-size: 14px;
                color: #0B1220;
            }

            .btn-produto:hover {
                transform: translateY(-1px);
                box-shadow: 0 14px 32px rgba(212,175,55,0.35);
                background: linear-gradient(135deg, #ffe07e, #f7c24c);
            }

            .btn-produto + .btn-produto {
                margin-top: 10px;
                border: 1px solid rgba(251, 211, 93, 0.7);
                background: transparent;
                color: #F5F7FA;
            }

            .produto-botoes {
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: 100%;
            }

            .produto-loading {
                text-align: center;
                padding: 20px;
                color: #888;
            }

            .spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(212, 175, 55, 0.3);
                border-top: 3px solid #D4AF37;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    processar() {
        const elementos = document.querySelectorAll('[data-produto-url]');
        console.log('🔍 Encontrados', elementos.length, 'elementos com widget');
        
        elementos.forEach((el, idx) => {
            this.criarWidget(el, idx);
        });
    }

    criarWidget(container, idx) {
        console.log(`📦 Widget #${idx}: Criando...`);
        container.innerHTML = '<div class="produto-loading"><div class="spinner"></div> Carregando produto...</div>';

        this.buscarPostAleatorio().then(post => {
            if (post) {
                console.log(`✅ Widget #${idx}: Renderizando`, post.titulo);
                container.innerHTML = this.renderizarProduto(post);
            } else {
                // Fallback: usar posts locais
                this.usarFallbackLocal(container, idx);
            }
        }).catch(err => {
            console.warn(`⚠️ Widget #${idx}: Backend indisponível, usando fallback local`);
            this.usarFallbackLocal(container, idx);
        });
    }

    usarFallbackLocal(container, idx) {
        // Fallback usando postsData se disponível
        if (typeof postsData !== 'undefined' && postsData.length > 0) {
            const randomPost = postsData[Math.floor(Math.random() * postsData.length)];
            const post = {
                titulo: randomPost.titulo,
                imagem: randomPost.imagem,
                link: randomPost.link,
                linkProduto: randomPost.linkProduto,
                resumo: randomPost.resumo
            };
            console.log(`✅ Widget #${idx}: Usando fallback local:`, post.titulo);
            container.innerHTML = this.renderizarProduto(post);
        } else {
            container.innerHTML = `
                <div class="produto-widget" style="text-align: center;">
                    <h3 style="color: #D4AF37;">🔥 Confira nossos achados!</h3>
                    <p style="color: #C5CAD3; margin: 15px 0;">As melhores ofertas selecionadas para você</p>
                    <a href="blog.html" class="btn-produto">📖 Ver Todos os Posts</a>
                </div>
            `;
        }
    }

    async buscarPostAleatorio() {
        try {
            console.log('📡 Buscando post aleatório do site...');
            const response = await fetch(`${this.apiUrl}/api/post-aleatorio`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Resposta completa:', data);

            if (!data.sucesso || !data.titulo || !data.url) {
                throw new Error('Nenhum post válido retornado');
            }

            console.log(`✅ Post selecionado: ${data.titulo}`);
            console.log(`🔗 Link do post: ${data.url}`);

            return data;
        } catch (error) {
            console.error('❌ Erro ao buscar:', error);
            throw error;
        }
    }

    renderizarProduto(produto) {
        const botoes = [];

        botoes.push(`
            <a href="${produto.link}" target="_blank" class="btn-produto" data-icon="📖">
                Ler o Post Completo
            </a>
        `);

        if (produto.linkProduto) {
            botoes.push(`
                <a href="${produto.linkProduto}" target="_blank" class="btn-produto" data-icon="🛒">
                    Ver Oferta no Mercado Livre
                </a>
            `);
        }

        const tituloComMarca = this.aplicarMarca(produto.titulo);

        return `
            <div class="produto-widget">
                <div class="produto-imagem">
                    <img src="${produto.imagem}" alt="${tituloComMarca}" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'">
                </div>

                <h3>${tituloComMarca}</h3>

                <div class="produto-botoes">
                    ${botoes.join('')}
                </div>
            </div>
        `;
    }

    sanitize(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    aplicarMarca(titulo) {
        const base = this.sanitize(titulo || 'AchadoCerto');
        return base.includes('AchadoCerto.VIP') ? base : `${base} | AchadoCerto.VIP`;
    }
}

// Inicializar quando documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.achadoCerto = new AchadoCertoProdutos();
    });
} else {
    window.achadoCerto = new AchadoCertoProdutos();
}
