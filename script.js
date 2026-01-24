function carregarPosts() {
    // Mecanismo de re-tentativa (Retry) caso postsData não esteja definido
    // Isso corrige problemas onde o script.js carrega antes do posts.js (race condition)
    if (typeof postsData === 'undefined') {
        console.warn("Aviso: postsData ainda não está disponível. Tentando novamente em 100ms...");
        setTimeout(carregarPosts, 100);
        return;
    }

    const data = postsData;
    const url = window.location.pathname;
    const containerCategoria = document.getElementById('lista-categoria');
    const containerHome = document.getElementById('latest-post');
    const containerBlog = document.getElementById('blog-lista');

    const isSubfolder = url.includes('/categorias/');
    const prefix = isSubfolder ? '../' : '';

    // --- LÓGICA DE BUSCA ---
    const searchForm = document.querySelector('.header-actions');
    const searchInput = document.querySelector('.header-actions input');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');

    // Toggle de busca mobile
    if (mobileSearchToggle && searchForm) {
        mobileSearchToggle.addEventListener('click', () => {
            searchForm.classList.toggle('mobile-visible');
            if (searchForm.classList.contains('mobile-visible')) {
                searchInput.focus();
            }
        });
    }

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const termo = searchInput.value.toLowerCase().trim();
            
            if (termo === '') return;

            const resultados = data.filter(p => 
                p.titulo.toLowerCase().includes(termo) || 
                p.resumo.toLowerCase().includes(termo) ||
                p.categoria.toLowerCase().includes(termo) ||
                p.chamada.toLowerCase().includes(termo) ||
                (p.keywords && p.keywords.toLowerCase().includes(termo))
            );

            const targetContainer = containerCategoria || containerBlog || containerHome;
            
            if (targetContainer) {
                const tituloPagina = document.querySelector('.review-content h2');
                if (tituloPagina) tituloPagina.innerHTML = `🔍 Resultados para: "${searchInput.value}"`;
                
                renderizar(resultados, targetContainer, prefix);
                targetContainer.scrollIntoView({ behavior: 'smooth' });
                
                // Esconde a busca mobile após pesquisar
                searchForm.classList.remove('mobile-visible');
            }
        });
    }

    // --- LÓGICA DE CARREGAMENTO INICIAL ---
    // Detecção mais robusta da página atual
    const pathParts = url.split('/');
    let fileName = pathParts[pathParts.length - 1];
    
    // Tratamento para URL sem nome de arquivo (ex: /blog/)
    if (fileName === '' || fileName === 'blog') {
        if (url.includes('blog')) fileName = 'blog.html';
        else fileName = 'index.html';
    }
    
    // Remove query params se houver
    fileName = fileName.split('?')[0];

    if (containerCategoria) {
        const categoriaNome = fileName.replace('.html', '');
        const filtrados = data.filter(p => p.categoria.toLowerCase() === categoriaNome.toLowerCase());
        renderizar(filtrados, containerCategoria, prefix);
    }

    // Se for a home (index.html, / ou vazio)
    if (containerHome && (fileName === 'index.html' || fileName === '')) {
        renderizar([data[0]], containerHome, prefix);
    }

    // Se for a página de blog
    if (containerBlog && (fileName === 'blog.html' || url.includes('/blog'))) {
        renderizar(data, containerBlog, prefix);
    }
}

function renderizar(posts, container, prefix) {
    container.innerHTML = '';
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; width:100%; padding:40px;">Nenhuma matéria encontrada.</p>';
        return;
    }
    posts.forEach(post => {
        container.innerHTML += `
            <a href="${prefix}${post.link}" class="post-preview-card" style="text-decoration:none; display:flex; background:#151B4A; border-radius:15px; margin-bottom:20px; overflow:hidden; border:1px solid rgba(255,215,0,0.1); min-height: 180px;">
                <div class="post-image-wrapper" style="flex:1; min-width:140px; max-width:220px; background: #050814; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${prefix}${post.imagem}" style="width:100%; height:100%; object-fit: contain; padding: 5px;" onerror="this.src='${prefix}images/imagesposts/produtos_xiaomi.jpg'">
                </div>
                <div class="post-content-wrapper" style="flex:2; padding:20px; display: flex; flex-direction: column; justify-content: center;">
                    <span style="display:inline-block; background:rgba(255, 215, 0, 0.1); color:#FFD700; font-size:10px; font-weight:800; text-transform:uppercase; padding:4px 8px; border-radius:4px; margin-bottom:10px; width: fit-content;">${post.categoria}</span>
                    <h3 style="color:#FFD700; margin:0 0 10px; font-size:18px; line-height: 1.3;">${post.titulo}</h3>
                    <p style="color:#E0E0E0; font-size:13px; margin:0 0 15px; line-height:1.5;">${post.resumo}</p>
                    <span style="color:#FFD700; font-weight:700; font-size:12px; text-transform: uppercase; letter-spacing: 0.5px;">${post.chamada} →</span>
                </div>
            </a>
        `;
    });
}

// Inicialização com suporte a DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarPosts);
} else {
    carregarPosts();
}