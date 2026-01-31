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
    
    // Adicionar animação ao clicar nos cards de blog
    document.addEventListener('click', function(e) {
        const blogCard = e.target.closest('.blog-card');
        if (blogCard && blogCard.hasAttribute('onclick')) {
            e.preventDefault();
            const onclickAttr = blogCard.getAttribute('onclick');
            const urlMatch = onclickAttr.match(/window\.location\.href='([^']+)'/);
            if (urlMatch) {
                window.location.href = urlMatch[1];
            }
        }
    });
});
