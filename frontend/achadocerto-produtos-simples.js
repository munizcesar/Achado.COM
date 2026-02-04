// ======================================
// SISTEMA DE PRODUTOS SIMPLIFICADO
// Apenas mostra posts aleatórios com preço real
// ======================================

class AchadoCertoProdutos {
    constructor() {
        // Usa API em produção (Vercel) ou localhost em desenvolvimento
        this.apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001' 
            : 'https://api.achadocerto.vip';
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
                background: linear-gradient(135deg, #D4AF37, #FFD700);
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                width: 100%;
                font-size: 16px;
                display: block;
                text-align: center;
                text-decoration: none;
            }

            .btn-produto:hover {
                background: linear-gradient(135deg, #FFD700, #D4AF37);
            }

            .btn-produto + .btn-produto {
                margin-top: 10px;
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
                container.innerHTML = '<div class="produto-loading" style="color: red;">Erro ao carregar produto</div>';
            }
        }).catch(err => {
            console.error(`❌ Widget #${idx}:`, err);
            container.innerHTML = '<div class="produto-loading" style="color: red;">Erro: ' + err.message + '</div>';
        });
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
            <a href="${produto.url}" target="_blank" class="btn-produto">
                📖 Ler o Post Completo
            </a>
        `);

        if (produto.link) {
            botoes.push(`
                <a href="${produto.link}" target="_blank" class="btn-produto">
                    🛒 Ver Oferta no Mercado Livre
                </a>
            `);
        }

        return `
            <div class="produto-widget">
                <div class="produto-imagem">
                    <img src="${produto.imagem}" alt="${this.sanitize(produto.titulo)}" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'">
                </div>

                <h3>${this.sanitize(produto.titulo)}</h3>

                ${botoes.join('')}
            </div>
        `;
    }

    sanitize(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
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
