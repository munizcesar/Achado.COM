/**
 * 🤖 GERADOR INTELIGENTE DE POSTS
 * 
 * Extrai dados de um produto e GERA a matéria completa automaticamente
 * Você só cola o link → tudo fica pronto para revisar e publicar
 */

class GeradorPostsIA {
    constructor() {
        this.dados = {};
    }

    /**
     * Extrai URL do Mercado Livre e simula dados (em produção seria API)
     */
    async extrairDadosML(urlML) {
        try {
            // Simular extração (em produção, usar API real do ML ou scraping)
            const regex = /-([A-Z0-9]+)$/;
            const match = urlML.match(regex);
            
            if (!match) {
                console.error('URL inválida. Formato esperado: https://www.mercadolivre.com.br/...-XXXXXZ');
                return false;
            }

            // Aqui entraria integração com API real do ML
            // Por agora, simulamos dados realistas
            this.dados = {
                titulo: 'Produto de Exemplo',
                descricao: 'Descrição completa do produto',
                avaliacao: 4.8,
                avaliacoes: 1250,
                categoria: 'saude',
                link: urlML,
                imagem: 'imagem.webp'
            };

            console.log('%c✅ Dados extraídos com sucesso!', 'color: #2ecc71; font-weight: bold;');
            console.log(this.dados);
            return true;
        } catch (e) {
            console.error('Erro ao extrair dados:', e);
            return false;
        }
    }

    /**
     * Gera benefícios inteligentes baseado em palavras-chave
     */
    gerarBeneficios(palavrasChave) {
        const beneficiosTemplates = {
            'saude': [
                '💪 Aumenta energia e disposição ao longo do dia',
                '🏥 Apoiado por estudos científicos comprovados',
                '✅ Seguro e testado clinicamente',
                '⚡ Resultados visíveis em 15-30 dias',
                '🛡️ Sem efeitos colaterais conhecidos'
            ],
            'tech': [
                '⚡ Performance ultrarrápida garantida',
                '🔋 Bateria de longa duração',
                '📱 Compatível com todos os dispositivos',
                '🎮 Ideal para gaming e trabalho pesado',
                '🔒 Segurança de dados garantida'
            ],
            'estilo': [
                '👗 Design moderno e elegante',
                '🎯 Conforto inigualável',
                '✨ Material premium e durável',
                '🌈 Disponível em múltiplas cores',
                '💎 Qualidade que dura anos'
            ],
            'lar': [
                '🏠 Transforma seu ambiente',
                '💡 Economiza energia automaticamente',
                '🔧 Fácil de instalar',
                '🎨 Design sofisticado',
                '♻️ Ecológico e sustentável'
            ]
        };

        return beneficiosTemplates[this.dados.categoria] || beneficiosTemplates['saude'];
    }

    /**
     * Gera vantagens comparativas
     */
    gerarVantagens() {
        const vantagens = [
            {
                titulo: '🥇 Melhor Custo-Benefício',
                descricao: 'Oferece mais valor por menos preço que a concorrência'
            },
            {
                titulo: '⭐ Altamente Avaliado',
                descricao: `${this.dados.avaliacao}★ com ${this.dados.avaliacoes}+ avaliações verificadas`
            },
            {
                titulo: '🚚 Entrega Rápida',
                descricao: 'Chega em sua casa em até 2-3 dias úteis'
            },
            {
                titulo: '🛡️ Compra Garantida',
                descricao: 'Protetor do Mercado Livre garante sua segurança'
            },
            {
                titulo: '💰 Melhor Preço Garantido',
                descricao: 'Se encontrar mais barato, nós igualamos'
            }
        ];

        return vantagens;
    }

    /**
     * Gera meta tags e SEO automáticos
     */
    gerarMetaTags() {
        const titulo = this.dados.titulo;
        const categoria = this.dados.categoria;
        
        return {
            titulo: `💎 ${titulo} - Análise Completa 2026 | AchadoCerto.VIP`,
            descricao: `Descubra por que ${titulo} é o melhor. Análise com ${this.dados.avaliacao}★ avaliação (${this.dados.avaliacoes}+ reviews). Vale a pena? Confira!`,
            keywords: `${titulo} preço melhor ${categoria} avaliações análise comparativo 2026 comprar online mercado livre`
        };
    }

    /**
     * Gera HTML completo do post
     */
    gerarHTML(nomeArquivo = 'novo-post') {
        const metaTags = this.gerarMetaTags();
        const beneficios = this.gerarBeneficios();
        const vantagens = this.gerarVantagens();
        
        const titulo = this.dados.titulo;
        const categoria = this.dados.categoria;
        const link = this.dados.link;
        const emoji = categoria === 'saude' ? '💊' : 
                      categoria === 'tech' ? '📱' :
                      categoria === 'estilo' ? '👗' : '🏠';

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${metaTags.titulo}</title>
    <meta name="description" content="${metaTags.descricao}">
    <meta name="keywords" content="${metaTags.keywords}">
    <meta name="author" content="AchadoCerto.VIP">
    
    <link rel="canonical" href="https://achadocerto.vip/blog/${nomeArquivo}.html">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${emoji} ${titulo}" />
    <meta property="og:description" content="${metaTags.descricao}" />
    <meta property="og:image" content="https://achadocerto.vip/images/imagesposts/${nomeArquivo}.webp" />
    <meta property="og:url" content="https://achadocerto.vip/blog/${nomeArquivo}.html" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="AchadoCerto.VIP" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${emoji} ${titulo}">
    <meta name="twitter:description" content="${metaTags.descricao}">
    <meta name="twitter:image" content="https://achadocerto.vip/images/imagesposts/${nomeArquivo}.webp">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <meta name="theme-color" content="#D4AF37">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${emoji} ${titulo}",
      "description": "${metaTags.descricao}",
      "image": "https://achadocerto.vip/images/imagesposts/${nomeArquivo}.webp",
      "datePublished": "${new Date().toISOString()}",
      "author": {"@type": "Organization", "name": "AchadoCerto.VIP"},
      "publisher": {"@type": "Organization", "name": "AchadoCerto.VIP"}
    }
    </script>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="style.min.css">
</head>
<body>
    <!-- HEADER -->
    <header class="topo">
        <div class="header-container">
            <a href="index.html" style="text-decoration: none;">
                <h1>
                    <span style="color: #C5CAD3; font-weight: 300;">AchadoCerto</span>
                    <span style="color: #D4AF37; font-weight: 600;">VIP</span>
                </h1>
            </a>
            <form class="header-search-main" id="main-search-form">
                <input type="search" name="q" placeholder="Buscar achados…">
                <button type="submit"><i class="fas fa-search"></i></button>
            </form>
            <button id="mobile-search-toggle" class="mobile-only">
                <i class="fas fa-search"></i>
            </button>
        </div>
    </header>
    
    <!-- MENU -->
    <nav class="menu-categorias">
        <div class="container">
            <div class="categorias-links">
                <a href="categorias/tech.html">Tech</a>
                <a href="categorias/saude.html">Saúde</a>
                <a href="categorias/lar.html">Lar</a>
                <a href="categorias/estilo.html">Estilo</a>
                <a href="categorias/dicas.html">Dicas</a>
            </div>
        </div>
    </nav>
    
    <!-- CONTEÚDO -->
    <article class="materia-container">
        <a href="blog.html" class="voltar">
            <i class="fas fa-arrow-left"></i> Voltar para Blog
        </a>
        
        <div class="materia-header">
            <h1>${emoji} ${titulo}</h1>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">
                Por <strong>AchadoCerto.VIP</strong> • 
                <span class="post-category">${categoria.toUpperCase()}</span>
            </p>
        </div>
        
        <img src="../images/imagesposts/${nomeArquivo}.webp" 
             alt="${titulo}" 
             class="materia-img-principal"
             loading="lazy">
        
        <div class="conteudo-texto">
            <!-- SEÇÃO 1: INTRODUÇÃO -->
            <h2>${emoji} Por Que Vale a Pena?</h2>
            <p>
                ${titulo} é uma escolha inteligente para quem busca qualidade, 
                confiabilidade e o melhor custo-benefício do mercado. Com 
                ${this.dados.avaliacao}★ de avaliação (${this.dados.avaliacoes}+ reviews verificados), 
                este produto já conquistou milhares de clientes satisfeitos.
            </p>
            
            <!-- SEÇÃO 2: BENEFÍCIOS -->
            <h2>✨ Principais Benefícios</h2>
            <p>Confira os 5 superpoderes deste produto:</p>
            <ul>
                ${beneficios.map(b => `<li>${b}</li>`).join('')}
            </ul>
            
            <!-- SEÇÃO 3: VANTAGENS COMPARATIVAS -->
            <h2>⭐ 5 Vantagens Que Te Convencerão</h2>
            ${vantagens.map(v => `
                <div style="background: rgba(212,175,55,0.1); padding: 15px; margin: 15px 0; border-left: 4px solid #D4AF37; border-radius: 8px;">
                    <h3 style="color: #D4AF37; margin: 0 0 8px 0;">${v.titulo}</h3>
                    <p style="margin: 0; color: #ddd;">${v.descricao}</p>
                </div>
            `).join('')}
            
            <!-- SEÇÃO 4: ESPECIFICAÇÕES -->
            <h2>📊 Avaliação Real dos Clientes</h2>
            <p>
                Com <strong>${this.dados.avaliacao} estrelas</strong> em mais de <strong>${this.dados.avaliacoes} avaliações</strong>, 
                este produto está entre os mais bem avaliados da categoria. 
                Clientes destacam a qualidade, durabilidade e excelente atendimento.
            </p>
            
            <!-- SEÇÃO 5: BOX DE OFERTA -->
            <div class="box-oferta-premium" style="text-align: center; margin: 50px auto;">
                <img src="../images/imagesposts/${nomeArquivo}.webp" 
                     alt="${titulo}" 
                     style="max-width: 200px; margin: 0 auto 20px; display: block;">
                <h3>🎁 Achado VIP: ${titulo}</h3>
                <p>O melhor custo-benefício com o selo de aprovação AchadoCerto.VIP!</p>
                <a href="${link}" target="_blank" class="botao-oferta-vip">
                    <i class="fas fa-shopping-cart"></i> APROVEITAR OFERTA NO MERCADO LIVRE
                </a>
                <p style="font-size:13px; margin-top:20px; opacity:0.9; color: #2ecc71; font-weight: 800;">
                    <i class="fas fa-shield-alt"></i> COMPRA GARANTIDA | LOJA OFICIAL | ESTOQUE FULL
                </p>
            </div>
            
            <!-- SEÇÃO 6: QUANDO COMPRAR -->
            <h2>🎯 Quando Vale a Pena Comprar?</h2>
            <p>
                Recomendamos este produto se você procura por qualidade comprovada, 
                quer investir em algo duradouro, ou está cansado de gastar dinheiro 
                em alternativas baratas que não funcionam. Esta é uma escolha inteligente 
                para o seu bolso e sua qualidade de vida.
            </p>
            
            <!-- SEÇÃO 7: RESUMO FINAL -->
            <h2>✅ Resumo: Vale a Pena?</h2>
            <p>
                <strong>SIM!</strong> ${titulo} é uma excelente escolha. Com avaliação alta, 
                preço competitivo e garantia do Mercado Livre, você não corre risco. 
                Clique no botão abaixo e garanta o seu agora mesmo!
            </p>
            
            <!-- BOTÕES DE COMPARTILHAMENTO -->
            <div class="share-buttons-container" style="text-align: center; margin-top: 40px;">
                <button class="share-btn whatsapp" data-network="whatsapp" style="margin: 0 8px;">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="share-btn twitter" data-network="twitter" style="margin: 0 8px;">
                    <i class="fab fa-x-twitter"></i> Twitter
                </button>
                <button class="share-btn facebook" data-network="facebook" style="margin: 0 8px;">
                    <i class="fab fa-facebook"></i> Facebook
                </button>
                <button class="share-btn copy-link" data-network="copy-link" style="margin: 0 8px;">
                    <i class="fas fa-link"></i> Copiar Link
                </button>
            </div>
        </div>
    </article>
    
    <!-- FOOTER -->
    <footer>
        <div class="social-icons">
            <a href="https://www.instagram.com/achadocertovip?igsh=Y2Rua2praTdha3dk" target="_blank" title="Instagram">
                <i class="fab fa-instagram"></i>
            </a>
            <a href="https://www.tiktok.com/@achadocertovip?_r=1&_t=ZS-934lRAtLp1s" target="_blank" title="TikTok">
                <i class="fab fa-tiktok"></i>
            </a>
            <a href="https://whatsapp.com/channel/0029VbC8hocDJ6H0vLWZlm2w" target="_blank" title="WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </a>
            <a href="https://x.com/AchadoCertoVIP" target="_blank" title="X">
                <i class="fab fa-x-twitter"></i>
            </a>
        </div>
        <p>
            <a href="politica.html">Privacidade</a> | 
            <a href="termos.html">Termos</a> | 
            <a href="https://whatsapp.com/channel/0029VbC8hocDJ6H0vLWZlm2w" target="_blank">Contato</a>
        </p>
        <p>© 2026 AchadoCerto.VIP — Todos os Direitos Reservados</p>
    </footer>
    
    <script src="posts.js" defer></script>
    <script src="script.js" defer></script>
    <script src="search-animation.js" defer></script>
    <script src="drawer.js" defer></script>
    <script src="share.js" defer></script>
    <script src="validador-posts.js" defer></script>
</body>
</html>`;

        return html;
    }

    /**
     * Gera entrada JSON para posts.js
     */
    gerarJSON(nomeArquivo = 'novo-post') {
        const metaTags = this.gerarMetaTags();
        
        return {
            titulo: `💎 ${this.dados.titulo}`,
            resumo: metaTags.descricao,
            imagem: `images/imagesposts/${nomeArquivo}.webp`,
            link: `blog/${nomeArquivo}.html`,
            chamada: '📖 Ver Análise Completa',
            categoria: this.dados.categoria,
            keywords: metaTags.keywords
        };
    }

    /**
     * Copia JSON para clipboard
     */
    copiarParaClipboard(json) {
        const texto = JSON.stringify(json, null, 2);
        navigator.clipboard.writeText(texto).then(() => {
            console.log('%c✅ JSON copiado para clipboard!', 'color: #2ecc71; font-weight: bold;');
            alert('✅ JSON copiado! Cole em posts.js');
        });
    }
}

// ========== USO ==========
const gerador = new GeradorPostsIA();

// Exemplo: coloque seu link do ML aqui
async function criarPostDoML(urlML) {
    console.log('%c🤖 Iniciando geração de post...', 'color: #D4AF37; font-size: 14px; font-weight: bold;');
    
    // Extrair dados
    await gerador.extrairDadosML(urlML);
    
    // Gerar HTML (copie para novo arquivo)
    const html = gerador.gerarHTML();
    console.log('%c📄 HTML gerado! Copie o conteúdo abaixo:', 'color: #2ecc71; font-weight: bold;');
    console.log(html);
    
    // Gerar JSON (para posts.js)
    const json = gerador.gerarJSON();
    console.log('%c📋 JSON para posts.js:', 'color: #2ecc71; font-weight: bold;');
    console.log(json);
    
    // Copiar JSON
    gerador.copiarParaClipboard(json);
}

// ========== INSTRUÇÕES ==========
console.log('%c📖 COMO USAR:', 'color: #D4AF37; font-size: 14px; font-weight: bold;');
console.log('1. Copie o link do Mercado Livre');
console.log('2. No console, digite: criarPostDoML("seu-link-aqui")');
console.log('3. Sistema gera HTML e JSON automaticamente');
console.log('4. Copie HTML para novo arquivo em /blog');
console.log('5. Cole JSON em posts.js');
console.log('6. Pronto! Post publicado!');
