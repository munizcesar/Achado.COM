# 📋 Guia Seguro para Adicionar Posts — AchadoCerto.VIP

## ✅ Forma Mais Segura de Adicionar Posts

### 1️⃣ **Estrutura Obrigatória**

Cada post **DEVE** ter exatamente estes 8 campos:

```javascript
{
  "titulo": "Seu Título Aqui",
  "resumo": "Seu resumo aqui",
  "imagem": "images/imagesposts/nome-da-imagem.webp",
  "link": "blog/seu-arquivo.html",
  "chamada": "📖 Texto do Botão",
  "categoria": "saude",
  "keywords": "palavra1 palavra2 palavra3"
}
```

---

## 📝 Guia Campo por Campo

### **1. `titulo` (Obrigatório)**
- ✅ Máximo 120 caracteres idealmente
- ✅ Pode incluir emoji no início
- ✅ Usar maiúsculas normalmente
- ❌ Não usar aspas duplas (") dentro do título
- ❌ Não deixar vazio

**Exemplos válidos:**
```
"💪 Creatina Monohidratada 500g Pura: Potencialize seu Desempenho"
"📱 Comparativo: Poco X7 Pro vs Redmi Note 14 Pro+"
"☕ Cafeteira Italiana Inox: O Segredo do Café Perfeito em Casa"
```

---

### **2. `resumo` (Obrigatório)**
- ✅ 80-150 caracteres idealmente
- ✅ Descrição concisa do post
- ✅ Vendedor, sem ser panfletário
- ❌ Não deixar vazio
- ❌ Não usar aspas duplas dentro do texto

**Exemplo válido:**
```
"Descubra por que a creatina monohidratada é o suplemento mais comprovado para ganho de força e massa muscular."
```

---

### **3. `imagem` (Obrigatório)**
- ✅ Caminho relativo partindo da raiz
- ✅ Sempre em `images/imagesposts/`
- ✅ Aceita: `.webp`, `.jpg`, `.jpeg`, `.png`
- ✅ Usar nomes descritivos em lowercase com hífen
- ❌ Não usar espaços no nome do arquivo
- ❌ Não deixar vazio

**Exemplos válidos:**
```
"images/imagesposts/creatina-soldiers-500g.webp"
"images/imagesposts/melhor-tv-55-2026.webp"
"images/imagesposts/cafeteira-italiana-inox.jpg"
```

---

### **4. `link` (Obrigatório)**
- ✅ Caminho relativo do arquivo HTML do post
- ✅ Sempre em `blog/`
- ✅ Usar nomes descritivos em lowercase com hífen
- ✅ Deve ser um arquivo `.html` que já existe
- ❌ Não usar espaços
- ❌ Não deixar vazio

**Exemplos válidos:**
```
"blog/creatina-soldiers-500g.html"
"blog/comparativo-xiaomi-poco-2026.html"
"blog/cafeteira-italiana-inox.html"
```

---

### **5. `chamada` (Obrigatório)**
- ✅ Texto do botão CTA (Call To Action)
- ✅ Máximo 30 caracteres
- ✅ Pode incluir emoji
- ✅ Texto convidativo

**Exemplos válidos:**
```
"🎯 Ler Artigo Completo"
"📖 Ver Guia Completo"
"📖 Ver Comparativo Completo"
"📖 Ver Segredo do Café"
```

---

### **6. `categoria` (Obrigatório - Restrito)**
- ✅ Deve ser **exatamente** uma destas:
  - `"saude"`
  - `"tech"`
  - `"lar"`
  - `"estilo"`
  - `"dicas"`
- ❌ Sem maiúsculas
- ❌ Sem acentos
- ❌ Sem espaços
- ❌ Sem outras categorias

**Exemplos válidos:**
```
"categoria": "saude"
"categoria": "tech"
"categoria": "lar"
```

---

### **7. `keywords` (Obrigatório - Para SEO)**
- ✅ Palavras separadas por espaço
- ✅ Mínimo 10 palavras
- ✅ Relacionadas ao conteúdo
- ✅ Sem vírgulas
- ❌ Não deixar vazio

**Exemplo válido:**
```
"keywords": "creatina monohidratada 500g suplemento academia força massa muscular hipertrofia performance treino laudo pureza importada"
```

---

## 🚀 Template Pronto para Copiar

Copie e cole este template, preenchendo apenas os valores:

```javascript
{
  "titulo": "COLOQUE_SEU_TITULO_AQUI",
  "resumo": "COLOQUE_SEU_RESUMO_AQUI",
  "imagem": "images/imagesposts/NOME-DA-IMAGEM.webp",
  "link": "blog/NOME-DO-ARQUIVO.html",
  "chamada": "📖 TEXTO_DO_BOTAO",
  "categoria": "saude",
  "keywords": "palavra1 palavra2 palavra3 palavra4 palavra5 palavra6 palavra7 palavra8 palavra9 palavra10"
}
```

---

## ⚠️ Erros Comuns a Evitar

### ❌ **ERRO 1: Aspas duplas dentro de strings**
```javascript
// ❌ ERRADO
"titulo": "iPhone 15 "Pro Max" é o melhor"

// ✅ CORRETO (use apóstrofo ou remova)
"titulo": "iPhone 15 Pro Max é o melhor"
```

### ❌ **ERRO 2: Categoria inválida**
```javascript
// ❌ ERRADO
"categoria": "Saúde"
"categoria": "produtos"
"categoria": "eletrônicos"

// ✅ CORRETO (minúsculo, exatamente estas)
"categoria": "saude"
"categoria": "tech"
```

### ❌ **ERRO 3: Vírgula faltante**
```javascript
// ❌ ERRADO (falta vírgula no final)
{
  "titulo": "Meu Post",
  "resumo": "Meu resumo"
  "imagem": "..."
}

// ✅ CORRETO (vírgula depois de cada campo)
{
  "titulo": "Meu Post",
  "resumo": "Meu resumo",
  "imagem": "..."
}
```

### ❌ **ERRO 4: Falta a vírgula entre objetos**
```javascript
// ❌ ERRADO (falta vírgula entre posts)
const postsData = [
  { "titulo": "Post 1", ... }
  { "titulo": "Post 2", ... }
];

// ✅ CORRETO (vírgula separa os posts)
const postsData = [
  { "titulo": "Post 1", ... },
  { "titulo": "Post 2", ... }
];
```

### ❌ **ERRO 5: Caminho de imagem incorreto**
```javascript
// ❌ ERRADO (com espaço, sem pasta)
"imagem": "creatina.webp"
"imagem": "images/imagesposts/minha imagem.webp"

// ✅ CORRETO (sem espaço, com pasta)
"imagem": "images/imagesposts/creatina.webp"
```

---

## 📋 Passo a Passo Seguro

### **Passo 1: Preparar a imagem**
1. Coloque a imagem em `images/imagesposts/`
2. Nomeie com lowercase e hífen: `meu-produto.webp`
3. Optimize para web (máx 500KB)

### **Passo 2: Criar o arquivo HTML**
1. Crie o arquivo em `blog/nome-descritivo.html`
2. Use a mesma estrutura dos outros posts
3. Copie um existente como template

### **Passo 3: Adicionar ao posts.js**
1. Abra `posts.js`
2. Localize o último post (antes do `]`)
3. Adicione uma **vírgula** no final do post anterior se não tiver
4. Copie o template acima
5. Preencha todos os 7 campos
6. ⚠️ **Não adicione vírgula** após o ÚLTIMO post

### **Passo 4: Validar a sintaxe**
1. Abra DevTools do navegador (F12)
2. Vá para o Console
3. Se houver erro, ele mostrará
4. Corrija e teste novamente

---

## ✨ Exemplo Real Passo a Passo

### Queremos adicionar um post sobre "Notebook Gamer 2026"

**1. Estrutura de arquivo:**
```
📁 blog/
   └─ notebook-gamer-2026.html  ← Crie este arquivo
📁 images/imagesposts/
   └─ notebook-gamer-2026.webp  ← Coloque a imagem aqui
```

**2. Adicione em `posts.js` (antes do `]` final):**
```javascript
// ... outros posts ...,
{
  "titulo": "💻 Notebook Gamer 2026: RTX 4070 vs RTX 4080",
  "resumo": "Comparação completa dos melhores notebooks gamers de 2026. Descubra qual oferece o melhor custo-benefício para seus jogos.",
  "imagem": "images/imagesposts/notebook-gamer-2026.webp",
  "link": "blog/notebook-gamer-2026.html",
  "chamada": "📖 Ver Comparativo",
  "categoria": "tech",
  "keywords": "notebook gamer 2026 rtx 4070 4080 i9 processador tela 144hz ssd performance fps gaming custo benefício melhor barato"
}
// ← Sem vírgula aqui (é o último)
];
```

---

## 🔍 Checklist Antes de Publicar

- [ ] Todos os 7 campos preenchidos
- [ ] Nenhum campo vazio
- [ ] Categoria é uma das 5 permitidas
- [ ] Vírgulas corretas entre posts
- [ ] Sem vírgula após o último post
- [ ] Caminho da imagem correto
- [ ] Caminho do link (blog/) correto
- [ ] Imagem existe e é acessível
- [ ] Arquivo HTML existe em blog/
- [ ] Sem aspas duplas dentro dos valores
- [ ] DevTools não mostra erros de sintaxe

---

## 🆘 Se Der Erro

### Erro: "Unexpected token"
→ Falta vírgula entre campos ou posts

### Erro: "Expected }"
→ Verifique aspas e vírgulas

### Erro: Imagem não carrega
→ Verifique caminho em `images/imagesposts/`

### Post não aparece em lugar nenhum
→ Verifique se a categoria está correta (exatamente)

---

## 🏠 Seção do TOPO (Header / Logo)

### **Localização:** [index.html](index.html), [blog.html](blog.html), [categorias/*.html](categorias/) - linhas iniciais

### **Estrutura obrigatória:**
```html
<header class="topo">
    <div class="header-container">
        <!-- Logo com Link para Home -->
        <a href="index.html" style="text-decoration: none;">
            <h1>
                <span style="color: #C5CAD3; font-weight: 300;">AchadoCerto</span>
                <span style="color: #D4AF37; font-weight: 600;">VIP</span>
            </h1>
        </a>
        
        <!-- Busca -->
        <form class="header-search-main" id="main-search-form">
            <input type="search" name="q" placeholder="Buscar achados…">
            <button type="submit"><i class="fas fa-search"></i></button>
        </form>
        
        <!-- Botão busca mobile -->
        <button id="mobile-search-toggle" class="mobile-only">
            <i class="fas fa-search"></i>
        </button>
    </div>
</header>
```

### **Regras Críticas do TOPO:**

✅ **Logo Link:**
- Sempre apontar para `index.html` em todas as páginas
- Cores: `#C5CAD3` (Achado) + `#D4AF37` (VIP)
- Peso: 300 (normal) + 600 (VIP negrito)

✅ **Busca:**
- `class="header-search-main"` - obrigatório para responsividade
- `id="main-search-form"` - obrigatório para JS
- Input: `type="search"` com placeholder

✅ **Mobile Toggle:**
- `id="mobile-search-toggle"` - obrigatório
- `class="mobile-only"` - mostra apenas em mobile

❌ **NÃO FAZER:**
- Mudar cores do logo
- Remover o link do logo
- Alterar estrutura da busca
- Renomear IDs (script.js depende deles)

---

## 🔗 Menu de Categorias

### **Localização:** Logo após header em todas as páginas

### **Estrutura obrigatória:**
```html
<nav class="menu-categorias">
    <div class="container">
        <div class="categorias-links">
            <a href="categorias/tech.html">Tech</a>
            <a href="categorias/saude.html">Saúde</a>
            <a href="categorias/lar.html">Lar</a>
            <a href="categorias/estilo.html">Estilo</a>
            <a href="categorias/dicas.html">Dicas</a>
        </div>
    </div>
</nav>
```

### **Regras do Menu:**

✅ **Links obrigatórios (exatamente estes 5):**
- `categorias/tech.html` → Tech
- `categorias/saude.html` → Saúde
- `categorias/lar.html` → Lar
- `categorias/estilo.html` → Estilo
- `categorias/dicas.html` → Dicas

✅ **Nomes devem corresponder às categorias** em `posts.js`

❌ **NÃO FAZER:**
- Adicionar categorias novas sem criar arquivo .html
- Mudar nomes dos links
- Remover categorias existentes

---

## 👣 Seção do RODAPÉ (Footer)

### **Localização:** Final de todas as páginas antes de `</body>`

### **Estrutura obrigatória:**
```html
<footer>
    <!-- Ícones de Redes Sociais -->
    <div class="social-icons">
        <a href="https://www.instagram.com/achadocertovip?igsh=Y2Rua2praTdha3dk" target="_blank" title="Instagram">
            <i class="fab fa-instagram"></i>
        </a>
        <a href="https://www.tiktok.com/@achadocertovip?_r=1&_t=ZS-934lRAtLp1s" target="_blank" title="TikTok">
            <i class="fab fa-tiktok"></i>
        </a>
        <a href="https://whatsapp.com/channel/0029VbC8hocDJ6H0vLWZlm2w" target="_blank" title="WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
        <a href="https://x.com/AchadoCertoVIP" target="_blank" title="X">
            <i class="fab fa-x-twitter"></i>
        </a>
    </div>

    <!-- Links Importantes -->
    <p>
        <a href="politica.html">Privacidade</a> | 
        <a href="termos.html">Termos</a> | 
        <a href="https://whatsapp.com/channel/0029VbC8hocDJ6H0vLWZlm2w" target="_blank">Contato</a>
    </p>

    <!-- Copyright -->
    <p>© 2026 AchadoCerto.VIP — Todos os Direitos Reservados</p>
</footer>

<!-- Scripts obrigatórios (ordem importa!) -->
<script src="posts.js" defer></script>
<script src="script.js" defer></script>
<script src="search-animation.js" defer></script>
<script src="drawer.js" defer></script>
```

### **Regras Críticas do FOOTER:**

✅ **Ícones de Redes Sociais:**
- `fab fa-instagram` → Instagram (obrigatório)
- `fab fa-tiktok` → TikTok (obrigatório)
- `fab fa-whatsapp` → WhatsApp (obrigatório)
- `fab fa-x-twitter` → Twitter/X (obrigatório)
- Sempre com `target="_blank"` para abrir em nova aba

✅ **Links de Navegação:**
- `politica.html` → Privacidade (página deve existir)
- `termos.html` → Termos (página deve existir)
- WhatsApp contato como terceira opção

✅ **Scripts no final (ordem obrigatória):**
1. `posts.js` ← Carrega dados dos posts
2. `script.js` ← Lógica principal
3. `search-animation.js` ← Busca
4. `drawer.js` ← Menu lateral

❌ **NÃO FAZER:**
- Remover redes sociais
- Mudar ordem dos scripts
- Adicionar `async` (use `defer`)
- Colocar scripts antes do HTML

### **Se mudar URL das redes sociais:**
```javascript
// ✅ CORRETO - Copie exatamente o novo link
<a href="https://www.instagram.com/seu-novo-usuario" target="_blank" title="Instagram">

// ❌ ERRADO - Não quebrar a estrutura
<a href="LINK">Instagram</a>  // Falta target="_blank"
```

---

## 🔒 Drawer (Menu Lateral Mobile)

### **Localização:** Logo após `<body>` de abertura

### **Estrutura obrigatória:**
```html
<div class="drawer-overlay"></div>
<div class="drawer-container">
    <button class="drawer-close"><i class="fas fa-times"></i></button>
    
    <div class="drawer-header">
        <h2><i class="fas fa-gift"></i> <span>Achados</span> VIP</h2>
    </div>
    
    <div class="drawer-content">
        <!-- Seções do drawer -->
        <div class="drawer-section">
            <h3><i class="fas fa-link"></i> Links Rápidos</h3>
            <a href="index.html"><i class="fas fa-home"></i> Home</a>
            <a href="blog.html"><i class="fas fa-newspaper"></i> Blog</a>
        </div>
    </div>
    
    <div class="drawer-footer">
        <p>© 2026 AchadoCerto.VIP</p>
    </div>
</div>

<!-- Botão para abrir drawer (no header mobile) -->
<button class="drawer-toggle" aria-label="Abrir menu">
    <i class="fas fa-bars"></i>
</button>
```

### **Regras do Drawer:**

✅ **Estrutura obrigatória:**
- `drawer-overlay` → Fundo escuro (DEVE estar antes do container)
- `drawer-container` → Container principal
- `drawer-close` → Botão X para fechar
- `drawer-header`, `drawer-content`, `drawer-footer`

✅ **JavaScript depende de:**
- `class="drawer-overlay"` (obrigatório)
- `class="drawer-container"` (obrigatório)
- `class="drawer-toggle"` (obrigatório)

---

## 🎨 **Phase 8: Características UI/UX (27 de Janeiro de 2026)**

### **Padrão Visual Atualizado — Botões em Formato Pílula**

Todos os botões do site agora seguem o padrão **pílula** com cor ouro (#D4AF37):

```css
/* Botão padrão dos posts */
.post-cta {
    color: #0A1026;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 20px;
    border-radius: 50px; /* ← Formato pílula */
    border: none;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    transition: all 0.3s ease;
    cursor: pointer;
}
```

✅ **Características dos botões:**
- Gradient ouro: #FFD700 → #FFA500
- Border-radius: 50px (forma pílula)
- Box-shadow com cor ouro (0.4 de opacidade)
- Responsive mobile: padding 8px 16px, font-size 11px

### **Favicon Padronizado em Ouro**

O favicon foi atualizado com a cor ouro (#D4AF37) em todos os formatos:
- `favicon-16x16.png` (16x16)
- `favicon-32x32.png` (32x32)
- `apple-touch-icon.png` (180x180 para iOS)
- `favicon.svg` (vetorial)
- `favicon.ico` (compatibilidade)

**Arquivo:** `gerar_favicon.py` (atualizado com `line_color='#D4AF37'`)

### **Responsividade Mobile Melhorada**

Mudanças implementadas para melhor experiência mobile:

#### 1. **Padding de Textos em Mobile (768px)**
```css
.blog-highlight-section {
    padding: 0 20px; /* Evita texto encostado nas laterais */
}
```

#### 2. **Redimensionamento de Botões em Mobile**
```css
@media (max-width: 768px) {
    .post-cta {
        padding: 8px 16px;
        font-size: 11px;
    }
}
```

✅ Textos não ficam mais encostados nas laterais  
✅ Botões são proporcionais ao tamanho da tela  
✅ Hover effect reduzido em mobile (translateY -1px ao invés de -2px)

### **Imagens Sem Molduras — Apresentação Clean**

Remoção de visual clutter nas imagens dos posts:

```css
/* Antes: */
.materia-img-principal {
    border: 1px solid #D4AF37;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border-radius: 20px;
}

/* Agora: */
.materia-img-principal {
    border-radius: 20px;
    /* Sem border, sem box-shadow */
}
```

✅ Imagens mais limpas e focadas  
✅ Removida caixa visual (border) ao redor das fotos  
✅ Removido box-shadow pesado das imagens  
✅ Mantido border-radius para proporção visual

**Aplicado em:**
- `.materia-img-principal` (imagens principais)
- `.materia-img` (imagens secundárias)
- `.banner-principal` (banners especiais como no comparativo)

### **Animações Removidas — Foco em Conteúdo**

A animação pulsante (`pulse-glow`) foi removida da seção de destaques:

```css
/* Antes: */
.offers-box {
    animation: pulse-glow 2.5s infinite; /* ← Removido */
}

/* Agora: */
.offers-box {
    /* Apenas estático com hover interativo */
}
```

✅ Menos distração visual  
✅ Foco maior no conteúdo  
✅ Hover effect mantido para interatividade

### **Tabelas Responsivas — Comparativos em Mobile**

O comparativo de produtos agora é responsivo:

```css
@media (max-width: 600px) {
    table {
        width: 100%;
        overflow: visible;
        word-break: break-word;
    }
}
```

✅ Tabelas funcionam em mobile sem scroll horizontal excessivo  
✅ Colunas distribuem proporcionalmente  
✅ Texto quebra corretamente em pequenas telas

### **Cor Ouro Padronizada (#D4AF37)**

Toda a paleta visual foi alinhada para a cor ouro:
- Favicon e theme-color dos navegadores
- Botões principais (gradient)
- Acentos visuais
- PWA manifest colors

**Theme-color em todas as páginas:**
```html
<meta name="theme-color" content="#D4AF37">
<meta name="msapplication-TileColor" content="#0B1220">
```

### **Padrão de Cores para Novos Posts**

Ao criar novos posts, respeite:
- ✅ Botões gradient ouro: #FFD700 → #FFA500
- ✅ Imagens sem molduras: apenas border-radius
- ✅ Responsive design: testar em 768px e 480px
- ✅ Texto mobile: padding lateral mínimo 20px
- ✅ Sem animações contínuas em destacados

### **Checklist Pré-Publicação (Phase 8)**

Antes de publicar um novo post:

- [ ] Botão segue formato pílula com gradient ouro
- [ ] Imagem principal não tem border ou box-shadow
- [ ] Texto responsivo testado em mobile (768px, 480px)
- [ ] Nenhuma animação `animation:` nos destaques
- [ ] Favicon com cor ouro (#D4AF37) ✓
- [ ] Meta tags theme-color presentes
- [ ] Tabelas responsivas (se houver)
- [ ] Padding lateral 20px em mobile (`.blog-highlight-section`)

### **Atualização 2: Bordas Suaves Restauradas & Animação Mantida (27 de Janeiro)**

#### ✨ **Bordas Suaves Restauradas**

Restauradas bordas **suaves e discretas** (1px com opacidade baixa) para elegância visual:

```css
/* Bordas suaves com transparência */
.botao-padrao-achado {
    border: 1px solid rgba(255, 215, 0, 0.3);  /* Bem sutil */
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.box-afiliado, .box-oferta-premium {
    border: 1px solid rgba(212, 175, 55, 0.2);  /* Muito suave */
    background: #1A1F71;
}
```

✅ **Características:**
- Espessura: 1px (fina e delicada)
- Opacidade: 30% em botões, 20% em boxes
- Não dominam o visual, apenas sutileza
- Mantêm profundidade e definição
- Box-shadow continua reforçando

**Padrão para novos posts:**
```html
<!-- Botão com borda suave -->
<a class="botao-padrao-achado" href="#">
    Ver Oferta
</a>

<!-- Box com borda suave -->
<div class="box-afiliado">
    <h3>Oferta Especial</h3>
    <p>Conteúdo da oferta...</p>
</div>
```

#### ✨ **Animação Pulse-Glow Mantida**

A animação pulsante em ouro continua no `.offers-box` (caixa de destaques/vídeos):

```css
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
    50% { box-shadow: 0 0 35px rgba(255,215,0,0.6); }
}

.offers-box {
    animation: pulse-glow 2.5s infinite;  /* Ativa */
}
```

✅ **Características:**
- Duração: 2.5 segundos
- Ciclo infinito contínuo
- Cor: ouro com opacidade variável (30% → 60%)
- Efeito: destaca seções de ofertas/vídeos importantes

### **Resumo: Bordas Suaves + Animação**

| Elemento | Estilo | Efeito |
|----------|--------|--------|
| `.botao-padrao-achado` | 1px rgba(255,215,0,0.3) | Borda elegante suave |
| `.box-afiliado` | 1px rgba(212,175,55,0.2) | Borda discreta |
| `.box-oferta-premium` | 1px rgba(212,175,55,0.2) | Borda discreta |
| `.offers-box` | animation: pulse-glow 2.5s | Brilho pulsante infinito |

---

❌ **NÃO FAZER:**
- Aumentar espessura das bordas (manter 1px)
- Aumentar opacidade das bordas (30% botão, 20% boxes)
- Remover animação do `.offers-box`
- Renomear classes
- Remover drawer-overlay
- Adicionar novo ID diferente

---

## 💡 Dicas Finais

✅ Sempre faça backup de `posts.js` antes de editar  
✅ Abra no VS Code com syntax highlighting  
✅ Use Ctrl+K Ctrl+F para formatar o JSON  
✅ Adicione posts NOVOS **antes** dos antigos (primeira posição)  
✅ Teste em DevTools depois de cada adição  
✅ Logo sempre aponta para `index.html`  
✅ Ordem dos scripts importa (não mude!)  
✅ Redes sociais: sempre `target="_blank"`  
✅ IDs e classes do JavaScript: NÃO MUDE!  

