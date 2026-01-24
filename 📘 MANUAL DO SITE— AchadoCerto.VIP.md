# 📘 MANUAL MESTRE DE PRODUÇÃO V3 — AchadoCerto.VIP

Este manual é a evolução das diretrizes de produção do **AchadoCerto.VIP**, consolidando as melhorias de design premium, experiência mobile e conversão implementadas em 2026.

**Última atualização**: 24 de janeiro de 2026

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

Sistema de busca otimizado para mobile:

*   **Botão Mobile Toggle**: 
    *   ID: `#mobile-search-toggle`
    *   Ícone dourado (`#D4AF37`), fundo transparente
    *   Posição: Absoluto à direita do header
*   **Campo de Busca Expandido**:
    *   Altura: `50px` (desktop) / `54px` (mobile)
    *   Background: `#1C2333` (sólido)
    *   Border-radius: `25px`
    *   Animação: slide-in da direita
*   **Botão de Busca (Lupa)**:
    *   Formato circular: `40px x 40px` (desktop) / `44px x 44px` (mobile)
    *   Background: gradiente dourado
    *   Posição: `absolute; right: 5px; top: 50%; transform: translateY(-50%)`
*   **Botão X (Limpar)**:
    *   Estilo iOS: círculo cinza (`#8E8E93`) com X branco
    *   Tamanho: `20px` (desktop) / `22px` (mobile)
*   **Z-index**: `10000` para sobrepor outros elementos

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

Área estratégica para conversão de tráfego de redes sociais:

*   **Localização**: Após botões VIP, antes do conteúdo principal
*   **Container**: Largura máxima 500px, centralizado
*   **Embed**: Script oficial (Instagram/TikTok)
*   **Botão**: 100% largura, abaixo do vídeo
*   **Identidade**: Tag "🔥 DESTAQUE", borda dourada, fundo azul escuro

---

## 12. 🎨 PALETA DE CORES

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