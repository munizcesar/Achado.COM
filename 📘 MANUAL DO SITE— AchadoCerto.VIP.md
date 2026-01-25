# 📘 MANUAL MESTRE DE PRODUÇÃO V3 — AchadoCerto.VIP

---

## ⚠️ LEIA PRIMEIRO — O QUE É ESTE DOCUMENTO?

Este é o **MANUAL OFICIAL DO SITE** AchadoCerto.VIP — um documento **vivo e evolutivo** que documenta:

✅ **Padrões de Design** — cores, tipografia, dimensões, componentes  
✅ **Padrões de UX/UI** — comportamentos, animações, responsividade  
✅ **Padrões de Conteúdo** — estrutura de posts, boxes, botões, SEO  
✅ **Padrões de Produção** — como criar, publicar, manter a qualidade  

### 🔄 Como Este Manual Funciona

**Este documento será ATUALIZADO CONTINUAMENTE:**
- Sempre que o site ganhar novos features → atualizamos aqui
- Sempre que o design mudar/evoluir → documentamos aqui
- Sempre que descobrirmos melhorias → adicionamos aqui
- **Sempre que você fizer uma mudança CSS → ATUALIZE ESTE MANUAL IMEDIATAMENTE**

### 🤖 Para Inteligências Artificiais

**Se você é uma IA lendo isto:**
1. Este documento é sua SOURCE OF TRUTH sobre como o site funciona
2. Antes de sugerir mudanças, consulte ESTE manual
3. Quando completar uma tarefa que afete design/funcionalidade, ATUALIZE ESTE MANUAL
4. Mantenha este documento SEMPRE SINCRONIZADO com o código CSS/HTML
5. Dúvidas sobre padrões? Consulte a seção correspondente aqui

### 📅 Histórico de Versões

| Versão | Data | Atualizações |
|--------|------|-------------|
| V4 | 24 jan 2026 | ✅ Busca mobile corrigida, overlay fixed, scroll inteligente, animação vídeo removida |
| V3 | 24 jan 2026 | Shimmer animation, banner contain, search white, drawer docs |
| V2 | - | Estrutura inicial de padrões |
| V1 | - | Base inicial |

**Última atualização**: 24 de janeiro de 2026 (V4 - Busca mobile crítica corrigida)

---

## 📋 CHANGELOG - ATUALIZAÇÕES RECENTES (JAN 2026)

### ✅ V4 - Correções Críticas da Busca Mobile (24 jan 2026)
- **Busca Mobile - Redirecionamento Corrigido**: Removido `method="get"` e `action="blog.html"` do formulário
  - Antes: Ao pesquisar, redirecionava para blog.html
  - Agora: Executa `realizarBusca()` sem redirecionar, ficando na mesma página
- **Overlay Desaparece Corretamente**: Adicionado fechamento do overlay em `realizarBusca()`
  - Problema: Overlay fosco ficava visível após busca
  - Solução: `searchOverlay.classList.remove('active')` + `document.body.style.overflow = ''`
- **Scroll Inteligente (Não sobe para topo)**: 
  - Implementado scroll com offset da altura do header + menu
  - Calcula: `headerHeight + menuHeight + margem de 20px`
  - Usa `getBoundingClientRect()` para posicionamento preciso
  - Scroll suave: `behavior: 'smooth'` com delay de 100ms
  - Resultado: Usuário vê o primeiro produto encontrado sem pular para topo
- **Limpeza do Campo de Busca**: Campo é resetado com `searchForm.reset()` após pesquisar
- **Animação Vídeo Removida**: Shimmer effect (`background-image`, `background-size`, `animation: shimmer`) removido do `.video-wrapper`
  - Antes: Círculo girando continuamente no vídeo
  - Agora: Vídeo exibe limpo e estático, sem animação de carregamento

### ✅ Atualizações Anteriores (V3)
- **Banner com `object-fit: contain`** — imagens aparecem inteiras sem cortes
- **Mobile Search UX** — removido border/background, design pílula puro
- **Video Container** — background azul (#1C3A5C) com overflow visible
- **Favicon** — magnifying glass azul (#3B82F6) em SVG
- **Botão Hamburger** — harmonizado para branco semitransparent (rgba(255,255,255,0.85))

### 📐 Dimensões Banner
- **Recomendado**: 1920 × 960 px
- **Proporção**: 16:8 (2:1)
- **Formato**: JPG ou WebP, máx 300KB
- **Configuração CSS**: `object-fit: contain` para aparecer inteiro

---

## 1. 🎨 TIPOGRAFIA PREMIUM (FONTES LEVES)

O site utiliza fontes premium com traços leves, seguindo referências Apple/Google:

*   **Fontes Principais**: 
    *   `Inter` (300, 400, 500)
    *   `DM Sans` (300, 400, 500)
    *   Fallback: `-apple-system, BlinkMacSystemFont, sans-serif`
*   **Pesos Permitidos**:
    *   `300` — Light (textos secundários, descrições)
    *   `400` — Regular (corpo do texto)
    *   `500` — Medium (botões, títulos, destaques)
*   **Pesos Proibidos**: `600`, `700`, `800`, `900`, `bold` — NÃO USAR
*   **Exceção**: Logo "AchadoCerto**VIP**" usa `600` no "VIP" para destaque da marca
*   **Propriedades Globais**:
    *   `letter-spacing: 0.2px` — espaçamento sutil
    *   `line-height: 1.6` — altura de linha respirada
    *   `-webkit-font-smoothing: antialiased` — renderização premium
    *   `text-transform: none` — sem uppercase forçado (exceto tags)

---

## 2. 🖼️ PADRONIZAÇÃO DE IMAGENS (PREMIUM LOOK)

Para manter a elegância e evitar que as fotos fiquem desproporcionais:

*   **Tamanho Máximo**: Largura de **600px a 650px**.
*   **Estilo**: Bordas arredondadas (`border-radius: 20px`), sombra suave (`box-shadow`) e borda fina dourada (`1px solid rgba(255,215,0,0.2)`).
*   **Posicionamento**: Sempre centralizadas.
*   **Nomenclatura**: Salvar em `images/imagesposts/` com nomes descritivos.
*   **Fundo das Imagens nos Posts**: 
    *   Cor: **Branco Gelo** (`#F5F7FA`)
    *   `object-fit: contain` — mostra imagem inteira com barras laterais
    *   Aplicado em `.post-image-wrapper` e `.post-image-wrapper img`

---

## 3. 🔘 BOTÕES VIP (CANAL E GRUPO)

Botões de ação para Canal e Grupo WhatsApp seguem padrão pílula compacto:

*   **Formato**: Pílula (`border-radius: 50px`)
*   **Tamanho**: `padding: 12px 24px`, `font-size: 13px`
*   **Layout**: `display: inline-flex; align-items: center; gap: 8px`
*   **Botão Canal (Dourado)**:
    *   Background: `linear-gradient(135deg, #D4AF37, #C9A24D)`
    *   Texto: **Branco** (`color: #fff`) com `text-shadow: 0 1px 2px rgba(0,0,0,0.3)`
    *   Ícone: `fas fa-bullhorn`
    *   Texto: "Seguir Canal"
*   **Botão Grupo (Verde)**:
    *   Background: `linear-gradient(135deg, #25D366, #1EAA52)`
    *   Texto: **Branco** (`color: #fff`)
    *   Ícone: `fas fa-users`
    *   Texto: "Entrar no Grupo"
*   **Sombra**: `box-shadow: 0 4px 15px rgba(cor, 0.4)`
*   **Posição nas Páginas**:
    *   **index.html**: Logo após a hero section
    *   **blog.html e categorias**: Apenas no rodapé, antes do footer

---

## 4. 📄 ESTRUTURA DAS PÁGINAS DE CATEGORIA

Todas as páginas de categoria seguem esta estrutura:

1. **Header** (logo centralizado)
2. **Menu de categorias** (links horizontais)
3. **Título da categoria** (centralizado, com descrição)
   *   H2: `font-size: 32px; color: #D4AF37`
   *   Descrição: `font-size: 18px; color: #C5CAD3`
4. **Conteúdo/Posts** (`#lista-categoria`)
5. **Botões VIP** (formato pílula, no rodapé)
6. **Footer**

*   **Páginas**: tech.html, saude.html, lar.html, estilo.html, dicas.html

---

## 5. 🎯 BOX DE OFERTA ESTRATÉGICA (CONVERSÃO)

Toda matéria deve conter uma **Box de Oferta VIP** no meio ou final do texto:

*   **Miniatura**: Imagem do produto centralizada e com fundo limpo.
*   **Título Chamativo**: Ex: "🎯 Achado VIP: [Nome do Produto]".
*   **Botão de Ação**: 
    *   Cor: Dourado (`#FFD700`) com texto escuro.
    *   Ícone: Carrinho de compras (`fas fa-shopping-cart`).
    *   Texto: "APROVEITAR OFERTA NO MERCADO LIVRE".
    *   `font-weight: 500` (não usar bold)
*   **Selo de Confiança**: Incluir ícone de escudo e texto sobre "Compra Garantida".

---

## 6. ✍️ ESTRUTURA DE CONTEÚDO (ENGAJAMENTO)

O texto deve ser interessante e fácil de ler no celular:

*   **Tags de Benefícios**: 3 a 4 tags com ícones (ex: 💪 Proteína, ⚡ Energia).
*   **Títulos (H2)**: Borda lateral dourada para destaque.
*   **Dicas VIP**: Finalizar com uma dica prática em itálico.
*   **Links**: Fáceis de clicar, no meio e no final do texto.

---

## 7. 🔍 BUSCA E HEADER (MOBILE-FIRST)

### Comportamento da Busca (V4 Otimizado)

Sistema de busca otimizado para mobile com redirecionamento fixo:

**Formulário Principal:**
- ID: `#main-search-form`
- **IMPORTANTE**: Sem atributos `method` ou `action` — redireciona via JavaScript apenas
- Executa `realizarBusca(termo)` ao envio ou pressionar Enter
- Filtra posts por: `titulo`, `resumo`, `categoria`, `chamada`, `keywords`

**Fluxo de Busca (V4):**
1. Usuário digita e pressiona Enter ou clica em 🔍
2. `realizarBusca(termo)` é executado
3. Posts são renderizados no container apropriado (nunca redireciona)
4. **Scroll inteligente**: Posiciona no primeiro resultado COM offset do header
   - Calcula altura: `headerHeight + menuHeight + 20px margem`
   - Usa `getBoundingClientRect()` para precisão
   - Suavidade: `behavior: 'smooth'` com delay 100ms
5. **Overlay fecha automaticamente**
6. **Campo limpo** com `searchForm.reset()`
7. **Body scroll restaurado** com `document.body.style.overflow = ''`

**Botão Mobile Toggle**: 
*   ID: `#mobile-search-toggle`
*   Ícone branco semitransparente: `rgba(255,255,255,0.85)`
*   Fundo transparente, sem círculo
*   Posição: Absoluto à direita do header

**Campo de Busca Expandido**:
*   Altura: `50px` (desktop) / `54px` (mobile)
*   Background: `#1C2333` (sólido)
*   Border-radius: `25px`
*   Animação: slide-in da direita (cubic-bezier)
*   Sem border/box-shadow na versão mobile (formato pílula puro)

**Botão de Busca (Lupa)**:
*   Formato circular: `40px x 40px` (desktop) / `44px x 44px` (mobile)
*   Cor: branco semitransparente `rgba(255,255,255,0.85)`
*   Posição: `absolute; right: 5px; top: 50%; transform: translateY(-50%)`

**Botão X (Limpar)**:
*   Estilo iOS: círculo cinza (`#8E8E93`) com X branco
*   Tamanho: `20px` (desktop) / `22px` (mobile)

**Overlay Fosco** (`.search-overlay`):
*   Position: `fixed`, cobre 100% da tela
*   Background: `rgba(11, 18, 32, 0.85)` com blur
*   Z-index: `999`
*   **Importante**: `pointer-events: none` quando inativo, `pointer-events: auto` quando `.active`
*   Fecha ao clicar fora ou ao pesquisar

**Z-index**: `10000` para sobrepor outros elementos

---

## 8. 📱 EXPERIÊNCIA MOBILE

Regras para garantir boa experiência em telas pequenas:

*   **Menu Categorias**: Links horizontais com rolagem (`overflow-x: auto`)
*   **Posts**: Cards em coluna única no mobile
*   **Imagens**: `object-fit: contain` com fundo branco gelo
*   **Botões**: Formato pílula, centralizados, com `flex-wrap: wrap`

---

## 9. 🔗 RODAPÉ E REDES SOCIAIS

Identidade visual consistente:

*   **Classe Padrão**: `<div class="social-icons">`
*   **Cor dos Ícones**: Dourado (`#FFD700`), branco no hover
*   **Links Oficiais**:
    *   Instagram: @achadocertovip
    *   TikTok: @achadocertovip
    *   WhatsApp: Canal oficial
    *   X: @AchadoCertoVIP

---

## 10. 🛠️ REGISTRO TÉCNICO (POSTS.JS)

*   Adicionar novo post no **topo** da lista
*   **Categorias**: `tech`, `saude`, `lar`, `estilo`, `dicas`
*   **Título com Emoji**: Para atrair cliques
*   **Race Condition Fix**: Mecanismo de retry no script.js

---

## 11. 📹 SESSÃO DESTAQUE VIRAL (HOME)

Área estratégica para conversão de tráfego de redes sociais com design limpo (V4):

*   **Localização**: Após botões VIP, antes do conteúdo principal
*   **Container**: Largura máxima 500px, centralizado
*   **Embed**: Script oficial (Instagram/TikTok)
*   **Fundo**: Azul escuro `#1C3A5C` com padding 15px e border-radius 12px
*   **Animação de Carregamento**: **REMOVIDA na V4** (antes era shimmer effect)
*   **Overflow**: `visible` para evitar clipping de animações
*   **Botão**: 100% largura, abaixo do vídeo
*   **Identidade**: Tag "🔥 DESTAQUE", borda dourada, fundo azul

---

## 12. � DRAWER (MENU LATERAL MOBILE)

Menu lateral responsivo que abre da esquerda com animação premium:

**Ativação:**
- Botão: `.drawer-toggle` (ícone hamburger no header mobile)
- Cor do botão: Branco semitransparente `rgba(255,255,255,0.85)`
- Posição: Canto superior esquerdo do header

**Container Principal:**
- Classe: `.drawer-container`
- Largura: 100% (mobile), máx 420px
- Background: Gradiente azul escuro `linear-gradient(135deg, rgba(15,20,45,0.98), rgba(11,18,32,0.98))`
- Borda direita: Fina dourada `2px solid rgba(212,175,55,0.3)`
- Sombra: `8px 0 32px rgba(0,0,0,0.6)`
- Animação: Slide-in da esquerda (cubic-bezier 0.34, 1.56, 0.64, 1)
- Z-index: `9999`

**Overlay (Fundo Escuro):**
- Classe: `.drawer-overlay`
- Background: Preto semitransparente com blur `rgba(11,18,32,0.75)` + `backdrop-filter: blur(4px)`
- Z-index: `9998`
- Fecha ao clicar

**Cabeçalho do Drawer:**
- Classe: `.drawer-header`
- Padding: `40px 25px 30px`
- Borda inferior: `1px solid rgba(212,175,55,0.15)`
- Background: Gradiente sutil `linear-gradient(180deg, rgba(212,175,55,0.1), transparent)`

**Título (H2):**
- Cor: Branco `#FFFFFF`
- Tamanho: `28px`
- Peso: `300` (light)
- Inclui ícone dourado à esquerda
- Espaçamento: `gap: 12px`

**Botão Fechar (X):**
- Posição: Canto superior direito
- Formato: Círculo `40px x 40px`
- Background: `rgba(255,215,0,0.15)` no estado normal
- Cor: Dourado `#FFD700`
- Animação no hover: Rotação 90° + scale 1.1
- Z-index: `10000`

**Conteúdo do Drawer:**
- Classe: `.drawer-content`
- Padding: `25px`
- Scroll vertical: `overflow-y: auto`
- Flex: `1` (ocupa espaço disponível)

**Seções (`.drawer-section`):**
- Margin-bottom: `35px`
- Animação staggered: `slideInLeft` com delays (0.1s, 0.2s, 0.3s, 0.4s)
- Cada seção com H3 + P + links

**H3 das Seções:**
- Cor: Dourado `#FFD700`
- Uppercase e espaçamento: `letter-spacing: 1.2px`
- Borda inferior dourada: `1px solid rgba(212,175,55,0.2)`
- Inclui ícone ao lado

**Links no Drawer:**
- Format: Pílula `display: inline-flex` com `border-radius: 10px`
- Background: Gradiente dourado semitransparente
- Cor: Dourado `#FFD700`
- Padding: `12px 18px`
- Gap com ícone: `gap: 10px`
- Hover: Desliza direita + brilha

**Divisor (`.drawer-divider`):**
- Altura: `1px`
- Background: Gradiente horizontal com fade
- Margin: `30px 0`

**Footer do Drawer:**
- Classe: `.drawer-footer`
- Padding: `20px 25px`
- Background: Gradiente superior `linear-gradient(to top, rgba(11,18,32,0.9), transparent)`
- Borda superior: `1px solid rgba(212,175,55,0.15)`
- Texto pequeno: `12px`, cor `#888`
- Posição: No final com `margin-top: auto`

**Responsividade:**
- Mobile (max-width: 480px): Reduz padding para `30px 20px 25px`
- H2 reduzido: `24px`
- Botão X: `36px x 36px`

**Estados:**
- Normal: Fora da tela (`transform: translateX(-100%)`)
- Ativo (`.active`): Visível (`transform: translateX(0)`)
- Animação: `0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`

---

## 13. �🎨 PALETA DE CORES

| Elemento | Cor | Hex |
|----------|-----|-----|
| Fundo principal | Azul Escuro | `#0B1220` |
| Fundo cards | Azul Marinho | `#151B4A` |
| Fundo busca | Cinza Azulado | `#1C2333` |
| Fundo imagens | Branco Gelo | `#F5F7FA` |
| Dourado principal | Ouro | `#D4AF37` |
| Dourado claro | Ouro Claro | `#FFD700` |
| Verde WhatsApp | Verde | `#25D366` |
| Texto principal | Branco | `#F5F7FA` |
| Texto secundário | Cinza Claro | `#C5CAD3` |
| Botão X (iOS) | Cinza | `#8E8E93` |

---

> **Nota**: Este manual deve ser consultado antes de cada publicação para garantir que o padrão de qualidade (V3) seja mantido em todas as páginas.