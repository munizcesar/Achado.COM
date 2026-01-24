// Animação elegante de busca com redirecionamento inteligente
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('main-search-form');
    // A lógica de TOGGLE (abrir/fechar) foi movida para script.js para evitar conflitos.
    // Este arquivo agora foca apenas nas animações de SUBMIT e click em cards.
    
    // Adicionar estilos de animação ao head
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
        }
    `;
    document.head.appendChild(style);
    
    /* CONFLITO CORRIGIDO: Esta animação recarregava a página (submit) enquanto o script.js
       tentava fazer a busca via AJAX/SPA. Desativando para priorizar a busca rápida do script.js.
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            // ... (código original comentado) ...
        });
    }
    */
            
            if (searchTerm === '') {
                return;
            }
            
            // Criar overlay de transição com efeito mais dramático
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(11, 18, 32, 0.98) 0%, rgba(21, 27, 74, 0.98) 50%, rgba(212, 175, 55, 0.05) 100%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                backdrop-filter: blur(5px);
            `;
            
            overlay.innerHTML = `
                <div style="text-align: center; animation: fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;">
                    <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 30px;">
                        <i class="fas fa-search" style="font-size: 60px; color: #D4AF37; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></i>
                    </div>
                    <p style="color: #F5F7FA; margin-top: 20px; font-size: 20px; font-weight: 400; letter-spacing: 0.5px;">Buscando achados...</p>
                    <p style="color: #D4AF37; margin-top: 15px; font-size: 16px; font-weight: 500; letter-spacing: 0.3px;">"${searchTerm}"</p>
                    <div style="margin-top: 30px; display: flex; gap: 8px; justify-content: center;">
                        <div style="width: 8px; height: 8px; background: #D4AF37; border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0s;"></div>
                        <div style="width: 8px; height: 8px; background: #D4AF37; border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0.2s;"></div>
                        <div style="width: 8px; height: 8px; background: #D4AF37; border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0.4s;"></div>
                    </div>
                </div>
                <style>
                    @keyframes fadeInScale {
                        from {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    
                    @keyframes bounce {
                        0%, 80%, 100% {
                            transform: translateY(0);
                            opacity: 0.8;
                        }
                        40% {
                            transform: translateY(-15px);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes pulse {
                        0%, 100% {
                            transform: translate(-50%, -50%) scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: translate(-50%, -50%) scale(1.15);
                            opacity: 0.6;
                        }
                    }
                </style>
            `;
            
            document.body.appendChild(overlay);
            
            // Forçar reflow para ativar animação
            overlay.offsetHeight;
            overlay.style.opacity = '1';
            
            // Buscar nos posts disponíveis
            if (typeof postsData !== 'undefined') {
                const resultados = postsData.filter(post => {
                    const termo = searchTerm.toLowerCase();
                    const tituloMatch = post.titulo.toLowerCase().includes(termo);
                    const resumoMatch = post.resumo.toLowerCase().includes(termo);
                    const categoriaMatch = post.categoria.toLowerCase().includes(termo);
                    const chamadaMatch = post.chamada.toLowerCase().includes(termo);
                    const keywordsMatch = post.keywords && post.keywords.toLowerCase().includes(termo);
                    return tituloMatch || resumoMatch || categoriaMatch || chamadaMatch || keywordsMatch;
                });
                
                // Se encontrou exatamente 1 resultado, vai direto pro post
                if (resultados.length === 1) {
                    setTimeout(() => {
                        window.location.href = resultados[0].link;
                    }, 1200);
                    return;
                }
            }
            
            // Se não encontrou ou tem múltiplos resultados, vai pra página de busca
            setTimeout(() => {
                window.location.href = `blog.html?q=${encodeURIComponent(searchTerm)}`;
            }, 1200);
        });
    }
    */
    
    // Adicionar animação ao clicar nos cards de blog
    document.addEventListener('click', function(e) {
        const blogCard = e.target.closest('.blog-card');
        if (blogCard && blogCard.hasAttribute('onclick')) {
            e.preventDefault();
            const onclickAttr = blogCard.getAttribute('onclick');
            const urlMatch = onclickAttr.match(/window\.location\.href='([^']+)'/);
            
            if (urlMatch) {
                const targetUrl = urlMatch[1];
                
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(11, 18, 32, 0.95) 0%, rgba(21, 27, 74, 0.95) 100%);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                
                overlay.innerHTML = `
                    <div style="text-align: center;">
                        <i class="fas fa-arrow-right" style="font-size: 48px; color: #D4AF37; animation: slideRight 0.6s ease-out infinite;"></i>
                        <p style="color: #F5F7FA; margin-top: 20px; font-size: 18px; font-weight: 300;">Abrindo produto...</p>
                    </div>
                    <style>
                        @keyframes slideRight {
                            0% { transform: translateX(-20px); opacity: 0.5; }
                            50% { transform: translateX(0); opacity: 1; }
                            100% { transform: translateX(20px); opacity: 0.5; }
                        }
                    </style>
                `;
                
                document.body.appendChild(overlay);
                setTimeout(() => overlay.style.opacity = '1', 10);
                
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 500);
            }
        }
    });
});
