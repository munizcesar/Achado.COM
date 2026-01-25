/**
 * DRAWER ANIMATION - Abre/Fecha Painel Lateral com Animação
 * Cores: Dourado (#FFD700) e Azul Escuro (#0B1220)
 */

class DrawerManager {
    constructor() {
        this.drawer = null;
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createDrawer();
        this.attachEventListeners();
    }

    createDrawer() {
        // Criar overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'drawer-overlay';
        document.body.appendChild(this.overlay);

        // Criar drawer container
        this.drawer = document.createElement('div');
        this.drawer.className = 'drawer-container';
        this.drawer.innerHTML = `
            <button class="drawer-close" aria-label="Fechar menu">×</button>
            
            <div class="drawer-header">
                <h2><i class="fas fa-bolt"></i>AchadoCerto<span>VIP</span></h2>
            </div>
            
            <div class="drawer-content">
                <div class="drawer-section">
                    <h3><i class="fas fa-tag"></i> Categorias de Ofertas</h3>
                    <p>Explore nossas categorias selecionadas com os melhores achados do mercado.</p>
                    <a href="categorias/tech.html"><i class="fas fa-laptop"></i> Tecnologia</a>
                    <a href="categorias/saude.html"><i class="fas fa-heart-pulse"></i> Saúde & Bem-estar</a>
                    <a href="categorias/lar.html"><i class="fas fa-home"></i> Casa & Lar</a>
                    <a href="categorias/estilo.html"><i class="fas fa-shirt"></i> Estilo & Moda</a>
                    <a href="categorias/dicas.html"><i class="fas fa-lightbulb"></i> Dicas & Guias</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3><i class="fas fa-newspaper"></i> Blog</h3>
                    <p>Confira guias, reviews e comparativos de produtos premium.</p>
                    <a href="blog.html"><i class="fas fa-arrow-right"></i> Ver todos os posts</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3><i class="fas fa-users"></i> Comunidade VIP</h3>
                    <p>Junte-se ao nosso grupo e receba ofertas exclusivas em tempo real.</p>
                    <a href="https://whatsapp.com/channel/0029VbC8hocDJ6H0vLWZlm2w" target="_blank"><i class="fab fa-whatsapp"></i> Canal WhatsApp</a>
                    <a href="https://chat.whatsapp.com/E6kgRRbyoiP99NoIANB81t" target="_blank"><i class="fas fa-user-group"></i> Entrar no Grupo</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3><i class="fas fa-share-nodes"></i> Siga-nos</h3>
                    <p>Acompanhe nossas redes sociais para atualizações diárias.</p>
                    <a href="https://www.instagram.com/achadocertovip?igsh=Y2Rua2praTdha3dk" target="_blank"><i class="fab fa-instagram"></i> Instagram</a>
                    <a href="https://www.tiktok.com/@achadocertovip?_r=1&_t=ZS-934lRAtLp1s" target="_blank"><i class="fab fa-tiktok"></i> TikTok</a>
                    <a href="https://x.com/AchadoCertoVIP" target="_blank"><i class="fab fa-x-twitter"></i> X (Twitter)</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3><i class="fas fa-circle-info"></i> Informações</h3>
                    <p>Tudo o que você precisa saber sobre o AchadoCerto.VIP.</p>
                    <a href="termos.html"><i class="fas fa-file-lines"></i> Termos de Uso</a>
                    <a href="politica.html"><i class="fas fa-shield"></i> Política de Privacidade</a>
                </div>
            </div>

            <div class="drawer-footer">
                <p>© 2026 AchadoCerto.VIP • Ofertas Verificadas</p>
            </div>
        `;
        document.body.appendChild(this.drawer);
    }

    attachEventListeners() {
        // Botão de fechar
        const closeBtn = this.drawer.querySelector('.drawer-close');
        closeBtn.addEventListener('click', () => this.close());

        // Overlay
        this.overlay.addEventListener('click', () => this.close());

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Procurar por botões que abrem o drawer (classe 'drawer-toggle')
        document.addEventListener('click', (e) => {
            if (e.target.closest('.drawer-toggle')) {
                this.toggle();
            }
        });
    }

    open() {
        this.drawer.classList.add('active');
        this.overlay.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.drawer.classList.remove('active');
        this.overlay.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

// Inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.drawerManager = new DrawerManager();
    });
} else {
    window.drawerManager = new DrawerManager();
}
