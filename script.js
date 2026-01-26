// Função para configurar a busca (independente dos posts)
function configurarBusca() {
    const searchForm = document.getElementById('main-search-form');
    const searchInput = document.querySelector('#main-search-form input');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    
    // Criar overlay fosco para mobile
    let searchOverlay = document.getElementById('search-overlay');
    if (!searchOverlay) {
        searchOverlay = document.createElement('div');
        searchOverlay.id = 'search-overlay';
        searchOverlay.className = 'search-overlay';
        document.body.appendChild(searchOverlay);
    }

    // Toggle simples baseado em classe, confiando no CSS
    if (mobileSearchToggle && searchForm) {
        // Remove .cloneNode which strips other potentially useful things, and just use the element.
        // Using replaceNode was deleting listeners, but a simple click is clearer.
        // We will keep the replace logic to ensure a clean slate, but use standard 'click'.
        
        const newToggle = mobileSearchToggle.cloneNode(true);
        mobileSearchToggle.parentNode.replaceChild(newToggle, mobileSearchToggle);

        newToggle.addEventListener('click', (e) => {
            // Prevent default button behavior (though type="button" does nothing anyway)
            e.preventDefault();
            e.stopPropagation(); // Prevent immediate closing by document click listener
            
            searchForm.classList.toggle('mobile-visible');
            searchOverlay.classList.toggle('active');
            
            if (searchForm.classList.contains('mobile-visible') && searchInput) {
                // Small delay to ensure visibility checks pass if needed, but modern browsers usually handle focus immediately
                setTimeout(() => searchInput.focus(), 50);
                // Previne scroll quando busca está aberta
                document.body.style.overflow = 'hidden';
            } else {
                // Restaura scroll quando busca fecha
                document.body.style.overflow = '';
            }
        });

        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (searchForm.classList.contains('mobile-visible')) {
                if (!e.target.closest('#main-search-form') && !e.target.closest('#mobile-search-toggle')) {
                    searchForm.classList.remove('mobile-visible');
                    searchOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
        
        // Fechar ao clicar no overlay
        searchOverlay.addEventListener('click', function() {
            searchForm.classList.remove('mobile-visible');
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Configura o envio do formulário com suporte a Enter key
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const termo = searchInput.value.trim();
            if (termo) {
                realizarBusca(termo);
            }
        });
        
        // Também permite buscar ao pressionar Enter no input
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const termo = searchInput.value.trim();
                if (termo) {
                    realizarBusca(termo);
                }
            }
        });
    }
}

// Função de busca separada
function realizarBusca(termo) {
    termo = termo.toLowerCase().trim();
    if (termo === '') return;

    if (typeof postsData === 'undefined') {
        console.warn("postsData ainda não carregado para busca.");
        return;
    }

    const data = postsData;
    const url = window.location.pathname;
    const isSubfolder = url.includes('/categorias/');
    const prefix = isSubfolder ? '../' : '';

    const containerCategoria = document.getElementById('lista-categoria');
    const containerHome = document.getElementById('latest-post');
    const containerBlog = document.getElementById('blog-lista');
    const targetContainer = containerCategoria || containerBlog || containerHome;

    const resultados = data.filter(p => 
        p.titulo.toLowerCase().includes(termo) || 
        p.resumo.toLowerCase().includes(termo) ||
        (p.categoria && p.categoria.toLowerCase().includes(termo)) ||
        (p.chamada && p.chamada.toLowerCase().includes(termo)) ||
        (p.keywords && p.keywords.toLowerCase().includes(termo))
    );
    
    if (targetContainer) {
        const tituloPagina = document.querySelector('.review-content h2');
        if (tituloPagina) tituloPagina.innerHTML = `🔍 Resultados para: "${termo}"`;
        
        renderizar(resultados, targetContainer, prefix);
        
        // Scroll inteligente com offset para não pular para o topo
        setTimeout(() => {
            const firstCard = targetContainer.querySelector('a');
            if (firstCard) {
                const headerHeight = document.querySelector('.topo').offsetHeight + document.querySelector('.menu-categorias').offsetHeight;
                const cardPosition = firstCard.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                
                window.scrollTo({
                    top: cardPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
        
        // Esconde a busca mobile após pesquisar E fecha o overlay
        const searchForm = document.getElementById('main-search-form');
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.querySelector('#main-search-form input');
        
        if (searchForm) {
            searchForm.classList.remove('mobile-visible');
            searchForm.reset(); // Limpa o campo de busca
        }
        if (searchOverlay) searchOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaura scroll
    }
}

function carregarPosts() {
    // Mecanismo de re-tentativa (Retry) APENAS para os posts
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
    // --- LÓGICA DE CARREGAMENTO INICIAL ---
    const pathParts = url.split('/');
    let fileName = pathParts[pathParts.length - 1];
    
    if (fileName === '' || fileName === 'blog') {
        if (url.includes('blog')) fileName = 'blog.html';
        else fileName = 'index.html';
    }
    fileName = fileName.split('?')[0];

    if (containerCategoria) {
        const categoriaNome = fileName.replace('.html', '');
        const filtrados = data.filter(p => p.categoria.toLowerCase() === categoriaNome.toLowerCase());
        renderizar(filtrados, containerCategoria, prefix);
    }

    if (containerHome && (fileName === 'index.html' || fileName === '')) {
        renderizar([data[0]], containerHome, prefix);
    }

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
            <a href="${prefix}${post.link}" class="post-preview-card">
                <div class="post-image-wrapper">
                    <img src="${prefix}${post.imagem}" onerror="this.style.display='none'">
                </div>
                <div class="post-content-wrapper">
                    <span class="post-category">${post.categoria}</span>
                    <h3>${post.titulo}</h3>
                    <p>${post.resumo}</p>
                    <span class="post-cta">${post.chamada} <i class="fas fa-arrow-right"></i></span>
                </div>
            </a>
        `;
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    configurarBusca(); // Configura busca imediatamente (não depende de postsData)
    carregarPosts();   // Inicia carregamento dos posts (pode ter retry)
});