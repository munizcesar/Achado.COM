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

❌ **NÃO FAZER:**
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

