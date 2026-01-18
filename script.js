fetch('posts.json')
    .then(response => response.json())
    .then(data => {
        const containerHome = document.getElementById('latest-post');
        const containerBlog = document.getElementById('blog-lista');
        const searchInput = document.getElementById('search-input');

        // 1. FUNÇÃO PARA RENDERIZAR OS CARDS
        function renderizar(lista, targetContainer) {
            if (!targetContainer) return;
            const isBlogPage = window.location.pathname.includes('blog.html');
            targetContainer.innerHTML = lista.map(post => {
                if (isBlogPage) {
                    // Para blog.html, usar estrutura com tags
                    const tagClass = post.titulo.includes('TV') ? 'tag-eletronicos' : post.titulo.includes('Mercado') ? 'tag-guia' : 'tag-guia';
                    const tagText = post.titulo.includes('TV') ? 'Eletrônicos' : post.titulo.includes('Mercado') ? 'Guia do Achado' : 'Guia do Achado';
                    return `
                        <a href="${post.link}" class="post-card">
                            <img src="${post.imagem}" alt="${post.titulo}">
                            <div class="post-info">
                                <span class="tag ${tagClass}">${tagText}</span>
                                <h3>${post.titulo}</h3>
                                <p>${post.resumo}</p>
                                <span class="card-link">${post.chamada} <i class="fas fa-arrow-right"></i></span>
                            </div>
                        </a>
                    `;
                } else {
                    // Para index.html, estrutura existente
                    return `
                        <a href="${post.link}" class="card-post">
                            <img src="${post.imagem}" alt="${post.titulo}">
                            <div class="card-body">
                                <span class="tag ${post.titulo.includes('TV') ? 'tag-eletronicos' : 'tag-guia'}">${post.titulo.includes('TV') ? 'Eletrônicos' : 'Guia do Achado'}</span>
                                <h3 class="card-title">${post.titulo}</h3>
                                <span class="card-link">${post.chamada} <i class="fas fa-arrow-right"></i></span>
                            </div>
                        </a>
                    `;
                }
            }).join('');
        }

        // 2. LÓGICA DE INICIALIZAÇÃO
        // Se estiver na Home, mostra apenas os 2 últimos posts
        if (containerHome) {
            const ultimosDois = data.slice(-2);
            renderizar(ultimosDois, containerHome);
        }

        // Se estiver na página do Blog, mostra tudo
        if (containerBlog) {
            renderizar(data, containerBlog);
            // Adicionar banner VIP após os posts
            const bannerHTML = `
                <div class="banner-inline-vip">
                    <div class="banner-content">
                        <div class="banner-text-group">
                            <i class="fab fa-whatsapp"></i>
                            <div>
                                <h4>Não perca nenhum achado!</h4>
                                <p style="margin:0; font-size:14px; opacity:0.9;">Entre no nosso Grupo VIP e receba ofertas em tempo real.</p>
                            </div>
                        </div>
                        <a href="https://chat.whatsapp.com/E6kgRRbyoiP99NoIANB81t" target="_blank" class="btn-banner-vip">ENTRAR NO GRUPO</a>
                    </div>
                </div>
            `;
            containerBlog.insertAdjacentHTML('beforeend', bannerHTML);
        }

        // 3. LÓGICA DO FILTRO (Funciona em qualquer uma das páginas se houver o input)
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const termo = e.target.value.toLowerCase();
                const baseData = containerHome ? data.slice(-2) : data;
                const filtrados = baseData.filter(p => 
                    p.titulo.toLowerCase().includes(termo) || 
                    p.resumo.toLowerCase().includes(termo)
                );
                
                // Aplica o filtro no container que estiver ativo na página
                if (containerHome) renderizar(filtrados, containerHome);
                if (containerBlog) renderizar(filtrados, containerBlog);
            });
        }
    })
    .catch(err => console.error('Erro ao carregar matérias:', err));