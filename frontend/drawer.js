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
                <h2><span style="color: #C5CAD3; font-weight: 300;">AchadoCerto</span><span style="color: #D4AF37; font-weight: 600; margin-left: -2px;">VIP</span></h2>
            </div>
            
            <div class="drawer-content">
                <div class="drawer-section" style="background: #FFED00; padding: 15px; border-radius: 8px;">
                    <h3 style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #003366;"><span style="background: #003366; color: #FFED00; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 700;">ML</span> <span style="font-weight: 300;">Ofertas</span> <span style="font-weight: 700;">Mercado Livre</span></h3>
                    <p style="color: #000000; font-size: 12px; font-weight: 300; margin-bottom: 12px;">Parceiro Oficial - Maior Marketplace</p>
                    <p style="font-weight: 300; color: #000000;">Descubra milhões de produtos com as melhores ofertas do Mercado Livre. Envio rápido e compra protegida.</p>
                    <a href="https://mercadolivre.com/sec/2kreXQc" target="_blank" rel="noopener noreferrer" title="Suplementos Mercado Livre" class="drawer-btn drawer-btn-mercadolivre"><i class="fas fa-flask"></i> <span>Suplementos</span></a>
                    <a href="https://www.mercadolivre.com.br/social/muc1576372" target="_blank" rel="noopener noreferrer" title="Explorar ofertas no Mercado Livre" class="drawer-btn drawer-btn-mercadolivre"><i class="fas fa-fire"></i> <span>Explorar Tudo</span></a>
                    <a href="https://mercadolivre.com/sec/2AfMec7" target="_blank" rel="noopener noreferrer" title="Creatina com melhor preço" class="drawer-btn drawer-btn-mercadolivre"><i class="fas fa-capsules"></i> <span>Creatina</span></a>
                    <a href="https://mercadolivre.com/sec/31G3D4M" target="_blank" rel="noopener noreferrer" title="Smart TVs com ofertas especiais" class="drawer-btn drawer-btn-mercadolivre"><i class="fas fa-tv"></i> <span>Smart TV</span></a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section" style="background: #0066FF; padding: 15px; border-radius: 8px;">
                    <h3 style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #FFFFFF;"><span style="background: #FFFFFF; color: #0066FF; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 700;">M</span> Ofertas <span style="color: #001A40; font-weight: 700;">Magalu</span></h3>
                    <p style="color: #FFFFFF; font-size: 12px; font-weight: 600; margin-bottom: 12px;">Parceiro Oficial - Melhores Preços</p>
                    <p style="font-weight: 300; color: #FFFFFF;">Encontre os melhores tênis, suplementos esportivos, SmartTV e celulares com desconto no Magalu. Ofertas verificadas e entrega garantida.</p>
                    <a href="https://www.magazinevoce.com.br/magazinevantagensmax/busca/tenis/" target="_blank" rel="noopener noreferrer" title="Comprar tênis com desconto no Magalu" class="drawer-btn drawer-btn-magalu"><i class="fas fa-shoe-prints"></i> <span>Tênis Premium</span></a>
                    <a href="https://divulgador.magalu.com/P-zXy4Ya" target="_blank" rel="noopener noreferrer" title="Suplementos esportivos com melhor preço" class="drawer-btn drawer-btn-magalu"><i class="fas fa-flask"></i> <span>Suplementos</span></a>
                    <a href="https://www.magazinevoce.com.br/magazinevantagensmax/busca/tvs/" target="_blank" rel="noopener noreferrer" title="SmartTV com ofertas imperdíveis" class="drawer-btn drawer-btn-magalu"><i class="fas fa-tv"></i> <span>SmartTV</span></a>
                    <a href="https://divulgador.magalu.com/dfeB0D53" target="_blank" rel="noopener noreferrer" title="Celulares e smartphones com desconto" class="drawer-btn drawer-btn-magalu"><i class="fas fa-mobile"></i> <span>Celular</span></a>
                    <a href="https://divulgador.magalu.com/bwHpcLD5" target="_blank" rel="noopener noreferrer" title="Produtos PET com desconto no Magalu" class="drawer-btn drawer-btn-magalu"><i class="fas fa-paw"></i> <span>Produtos PET</span></a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section" style="background: #232F3E; padding: 15px; border-radius: 8px;">
                    <h3 style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #FFFFFF;"><span style="background: #FFFFFF; color: #FF9900; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 700;">A</span> <span style="font-weight: 300;">Ofertas</span> <span style="font-weight: 700;">Amazon</span></h3>
                    <p style="color: #FF9900; font-size: 12px; font-weight: 600; margin-bottom: 12px;">Parceiro Oficial - Ofertas Exclusivas</p>
                    <p style="font-weight: 300; color: #FFFFFF; opacity: 0.95;">Aproveite as melhores ofertas da Amazon com entrega rápida e frete grátis para clientes Prime.</p>
                    <a href="https://amzn.to/3YV6t3h" target="_blank" rel="noopener noreferrer" title="Ver ofertas do dia na Amazon" class="drawer-btn drawer-btn-amazon"><i class="fas fa-shopping-cart"></i> <span>OFERTAS DO DIA</span></a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3 style="font-weight: 700;"><i class="fas fa-newspaper"></i> Blog</h3>
                    <p style="font-weight: 300;">Confira guias, reviews e comparativos de produtos premium.</p>
                    <a href="blog.html" style="font-weight: 500;"><i class="fas fa-arrow-right"></i> Ver todos os posts</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3 style="font-weight: 700;"><i class="fas fa-users"></i> Comunidade VIP</h3>
                    <p style="font-weight: 300;">Junte-se ao nosso grupo e receba ofertas exclusivas em tempo real.</p>
                    <a href="https://whatsapp.com/channel/0029VbC8hocDJ6H0vLWZlm2w" target="_blank" style="font-weight: 500;"><i class="fab fa-whatsapp"></i> Canal WhatsApp</a>
                    <a href="https://chat.whatsapp.com/E6kgRRbyoiP99NoIANB81t" target="_blank" style="font-weight: 500;"><i class="fas fa-user-group"></i> Entrar no Grupo</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3 style="font-weight: 700;"><i class="fas fa-share-nodes"></i> Siga-nos</h3>
                    <p style="font-weight: 300;">Acompanhe nossas redes sociais para atualizações diárias.</p>
                    <a href="https://www.instagram.com/achadocertovip?igsh=Y2Rua2praTdha3dk" target="_blank" style="font-weight: 500;"><i class="fab fa-instagram"></i> Instagram</a>
                    <a href="https://www.tiktok.com/@achadocertovip?_r=1&_t=ZS-934lRAtLp1s" target="_blank" style="font-weight: 500;"><i class="fab fa-tiktok"></i> TikTok</a>
                    <a href="https://x.com/achadocertovip" target="_blank" style="font-weight: 500;"><i class="fab fa-x-twitter"></i> X (Twitter)</a>
                </div>

                <div class="drawer-divider"></div>

                <div class="drawer-section">
                    <h3 style="font-weight: 700;"><i class="fas fa-circle-info"></i> Informações</h3>
                    <p style="font-weight: 300;">Tudo o que você precisa saber sobre o AchadoCerto.VIP.</p>
                    <a href="termos.html" style="font-weight: 500;"><i class="fas fa-file-lines"></i> Termos de Uso</a>
                    <a href="politica.html" style="font-weight: 500;"><i class="fas fa-shield"></i> Política de Privacidade</a>
                </div>
            </div>

            <div class="drawer-footer">
                <p style="font-size: 11px; font-weight: 400; line-height: 1.4; color: #A8AEB8;">Afiliados: Ganhamos comissão, mas você economiza. Selecionamos apenas cupons e ofertas em destaque.</p>
                <p style="font-size: 11px; margin-top: 8px;">© 2026 AchadoCerto.VIP • Ofertas Verificadas</p>
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

        // Swipe para fechar (arrasto com dedo)
        this.setupSwipeDetection();
    }

    setupSwipeDetection() {
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50; // Distância mínima para considerar swipe (em pixels)

        // Swipe para fechar (no drawer)
        this.drawer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, false);

        this.drawer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            this.handleSwipeClose(touchStartX, touchEndX, swipeThreshold);
        }, false);

        // Swipe para abrir (em qualquer lugar da tela)
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, false);

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            this.handleSwipeOpen(touchStartX, touchEndX, swipeThreshold);
        }, false);
    }

    handleSwipeClose(startX, endX, threshold) {
        const distance = startX - endX; // Positivo = swipe para esquerda

        // Se arrastar mais de 'threshold' pixels para esquerda
        if (distance > threshold) {
            this.close();
        }
    }

    handleSwipeOpen(startX, endX, threshold) {
        const distance = endX - startX; // Positivo = swipe para direita

        // Se arrastar mais de 'threshold' pixels para direita E drawer está fechado
        // E começou perto da borda esquerda (primeiros 30px)
        if (distance > threshold && !this.isOpen && startX < 30) {
            this.open();
        }
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
