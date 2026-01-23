# 📘 MANUAL MESTRE DE PRODUÇÃO V2 — AchadoCerto.VIP

Este manual é a evolução das diretrizes de produção do **AchadoCerto.VIP**, consolidando as melhorias de design premium, experiência mobile e conversão implementadas em 2026.

---

## 1. 🖼️ PADRONIZAÇÃO DE IMAGENS (PREMIUM LOOK)

Para manter a elegância e evitar que as fotos fiquem desproporcionais (especialmente no mobile):

*   **Tamanho Máximo**: Largura de **600px a 650px**.
*   **Estilo**: Bordas arredondadas (`border-radius: 20px`), sombra suave (`box-shadow`) e borda fina dourada (`1px solid rgba(255,215,0,0.2)`).
*   **Posicionamento**: Sempre centralizadas.
*   **Nomenclatura**: Salvar em `images/imagesposts/` com nomes descritivos (ex: `whey-pro-max-titanium-premium.jpg`).

---

## 2. 🎯 BOX DE OFERTA ESTRATÉGICA (CONVERSÃO)

Toda matéria deve conter uma **Box de Oferta VIP** no meio ou final do texto, seguindo este padrão:

*   **Miniatura**: Imagem do produto centralizada e com fundo limpo.
*   **Título Chamativo**: Ex: "🎯 Achado VIP: [Nome do Produto]".
*   **Botão de Ação**: 
    *   Cor: Dourado (`#FFD700`) com texto em Azul Escuro.
    *   Ícone: Carrinho de compras (`fas fa-shopping-cart`).
    *   Texto: "APROVEITAR OFERTA NO MERCADO LIVRE" (ou loja correspondente).
*   **Selo de Confiança**: Incluir ícone de escudo e texto sobre "Compra Garantida".

---

## 3. ✍️ ESTRUTURA DE CONTEÚDO (ENGAJAMENTO)

O texto deve ser interessante e fácil de ler no celular:

*   **Tags de Benefícios**: Logo após a imagem principal, incluir 3 a 4 tags com ícones (ex: 💪 Proteína, ⚡ Energia).
*   **Títulos (H2)**: Devem ter a borda lateral dourada para destaque.
*   **Dicas VIP**: Finalizar com uma dica prática em itálico para o leitor.
*   **Links**: Valorizar links no meio e no final do texto, garantindo que sejam fáceis de clicar.

---

## 4. 📱 EXPERIÊNCIA MOBILE E BUSCA

Para garantir que a busca seja acessível em telas pequenas:

*   **Layout de Coluna**: No mobile, o container do menu deve adotar `flex-direction: column`.
*   **Menu Horizontal**: Os links das categorias (Tech, Saúde, etc.) ficam no topo, com rolagem horizontal (`overflow-x: auto`).
*   **Busca Expansível**: O campo de busca (input) deve aparecer **abaixo** dos links, ocupando a largura total, e não misturado na lista de rolagem. Isso evita que o campo fique escondido fora da tela.
*   **Responsividade dos Posts**: Cards de posts devem se ajustar para coluna única no celular.

---

## 5. 🔗 RODAPÉ E REDES SOCIAIS (IDENTIDADE VISUAL)

Para manter a consistência da marca **AchadoCerto.VIP**, siga rigorosamente:

*   **Classe Padrão**: Todo bloco de ícones sociais deve usar a classe `<div class="social-icons">`.
*   **Cor Dourada Obrigatória**:
    *   **NUNCA** use estilos inline (ex: `style="color: #E1306C"`) para colorir ícones com as cores originais das redes (rosa para Instagram, verde para WhatsApp, etc.).
    *   A cor deve ser herdada do CSS global: **Dourado (#FFD700)** para ícones e **Branco (#FFFFFF)** ao passar o mouse (hover).
*   **Links Oficiais**:
    *   Instagram: Link oficial.
    *   TikTok: Link oficial.
    *   WhatsApp: Link do canal.
    *   X (Twitter): Link oficial (https://x.com/AchadoCertoVIP).

---

## 6. 🛠️ REGISTRO TÉCNICO (POSTS.JS)

Sempre adicionar o novo post no **topo** da lista em `posts.js`.
*   **Categorias permitidas**: `tech`, `saude`, `lar`, `estilo`, `dicas`.
*   **Título com Emoji**: Usar um emoji que represente a categoria no início do título para atrair o clique.

---

## 7. 📹 SESSÃO DESTAQUE VIRAL (HOME)

Uma área estratégica na página inicial para conversão de tráfego vindo de redes sociais (TikTok/Reels).

*   **Localização (Hot Zone)**: Inserir logo após os Cards de Grupos (WhatsApp/Canal) e *antes* do conteúdo principal de texto.
*   **Estrutura Visual**:
    *   **Container**: Largura máxima de 500px (foco mobile) centralizado.
    *   **Embed**: Usar script oficial (Instagram/TikTok/YouTube Shorts) para garantir reprodução.
    *   **Botão de Conversão**: Posicionado imediatamente abaixo do vídeo, ocupando 100% da largura do container, com a chamada "COMPRAR AGORA".
*   **Identidade**:
    *   Tag "🔥 DESTAQUE VIRAL" no topo.
    *   Borda Dourada (#FFD700) arredondada.
    *   Fundo Azul Escuro (#151B4A).
*   **Responsividade**: O vídeo deve usar `min-width` e `calc(100%)` para não quebrar em telas pequenas (iPhone SE) nem esticar demais em desktops.

---

> **Nota**: Este manual deve ser consultado antes de cada publicação para garantir que o padrão de qualidade (V2) seja mantido em todas as páginas.