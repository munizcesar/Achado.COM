fetch('posts.json')
    .then(response => response.json())
    .then(data => {
        
        // --- LÓGICA DA HOME (index.html) ---
        const containerHome = document.getElementById('latest-post');
        if (containerHome && data.length > 0) {
            const post = data[0]; // Pega o mais recente
            containerHome.innerHTML = `
                <a href="${post.link}" class="post-preview-card">
                    <div class="post-image-wrapper">
                        <img src="${post.imagem}" alt="${post.titulo}">
                    </div>
                    <div class="post-content-wrapper">
                        <h3>${post.titulo}</h3>
                        <p>${post.resumo}</p>
                        <span class="post-btn">${post.chamada} →</span>
                    </div>
                </a>
            `;
        }

        // --- LÓGICA DO BLOG (blog.html) ---
        const containerBlog = document.getElementById('blog-lista');
        if (containerBlog) {
            containerBlog.innerHTML = ''; 
            data.forEach(post => {
                containerBlog.innerHTML += `
                    <a href="${post.link}" class="post-preview-card">
                        <div class="post-image-wrapper">
                            <img src="${post.imagem}" alt="${post.titulo}">
                        </div>
                        <div class="post-content-wrapper">
                            <h3>${post.titulo}</h3>
                            <p>${post.resumo}</p>
                            <span class="post-btn">${post.chamada} →</span>
                        </div>
                    </a>
                `;
            });
        }
    })
    .catch(err => console.error('Erro ao carregar matérias:', err));