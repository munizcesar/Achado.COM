# 📋 Guia de Melhorias para Posts e Artigos - AchadoCerto.VIP

## ✅ O que foi melhorado

### 1. **Botões de Oferta - Sempre Alinhados**
- ✓ Botões agora ficam fixos no final de cada card, independente do tamanho do texto
- ✓ Usa `flex-direction: column` com `flex: 1` para push o botão para baixo
- ✓ Mantém altura consistente em todos os cards
- ✓ Responsivo em mobile - ocupa 100% da largura

**Antes:** Botões pulavam de posição com textos diferentes  
**Depois:** Todos os botões alinhados na mesma altura

### 2. **Tabelas Responsivas**
- ✓ Tabelas com scroll horizontal automático em mobile
- ✓ Header fixo com fundo degradado (destaca melhor)
- ✓ Hover em linhas para melhor usabilidade
- ✓ Fonte ajustada para mobile (não fica minúscula)
- ✓ Padding otimizado para diferentes telas

**Novo container:** Uso de `.table-wrapper` para melhor controle do scroll

```html
<div class="table-wrapper">
    <table class="tabela-comparativa">
        <!-- conteúdo -->
    </table>
</div>
```

### 3. **Layout de Produtos - Grid Flexível**
- ✓ Grid `auto-fit` que redimensiona automaticamente
- ✓ Mínimo 200px, máximo flexível
- ✓ Em tablets: 2 colunas
- ✓ Em mobile: 1 coluna apenas

```css
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

### 4. **Espaçamento e Tipografia Consistente**
- ✓ Títulos (h2, h3) com border dourada padronizada
- ✓ Linha 1.8 para melhor legibilidade
- ✓ Fontes ajustadas por breakpoint
- ✓ Cores padronizadas (D4AF37 para CTA, 1A1F71 para fundos)

### 5. **Acessibilidade Melhorada**
- ✓ `aria-label` nos botões
- ✓ `alt` em todas as imagens
- ✓ `loading="lazy"` para performance
- ✓ Contrast ratio adequado (WCAG AA)
- ✓ Touch targets de 44px mínimo em mobile

---

## 📌 Como usar o novo template

### Step 1: Copiar o template
```bash
cp frontend/POST-TEMPLATE-MELHORADO.html frontend/blog/seu-novo-artigo.html
```

### Step 2: Substituir placeholders
- `[TÍTULO DO ARTIGO]` → Seu título
- `[DESCRIÇÃO]` → Meta description (max 160 chars)
- `[PALAVRAS-CHAVE]` → SEO keywords
- `[DATA]` → Data de publicação
- `[URL-DO-ARTIGO]` → slug do artigo (ex: comparativo-produtos-2026)

### Step 3: Adicionar conteúdo
- Imagens com `../` (relativo ao blog/)
- Links de afiliado em `href="[LINK-AFILIADO-X]"`
- Textos descritivos em cada `<p>`

### Step 4: Grid de Produtos
Copie e adapte quantas linhas precisar:
```html
<div class="produto-card">
    <div class="produto-content">
        <img src="..." alt="... loading="lazy">
        <h4>[NOME]</h4>
        <p class="preco">Preço: R$ [VALOR]</p>
        <p>[DESCRIÇÃO]</p>
        <div class="spacer"></div>
    </div>
    <a href="[LINK]" target="_blank" rel="noopener" class="btn-oferta">
        <i class="fas fa-shopping-cart"></i> Ver Oferta
    </a>
</div>
```

**Importante:** Não remova `<div class="spacer"></div>` - ele empurra o botão para baixo!

### Step 5: Tabelas
Use o wrapper:
```html
<div class="table-wrapper">
    <table class="tabela-comparativa">
        <!-- tabela aqui -->
    </table>
</div>
```

---

## 🎨 Breakpoints Responsivos

| Dispositivo | Resolução | Comportamento |
|---|---|---|
| Desktop | >768px | 4 colunas (grid-produtos), tabela normal |
| Tablet | 600-768px | 2 colunas |
| Mobile | <600px | 1 coluna, botões fullwidth, scroll tabela |

---

## 💡 Boas Práticas

✅ **Sempre fazer:**
- Usar `.spacer` nos cards de produto
- Envolver tabelas em `.table-wrapper`
- Adicionar `loading="lazy"` em imagens
- Testar em mobile antes de publicar
- Usar alt text descritivo

❌ **Nunca fazer:**
- Remover `flex-direction: column` dos cards
- Colocar divs sem propósito entre conteúdo e botão
- Usar tabelas em viewport <600px sem scroll
- Textos sem quebra de linha em mobile
- Imagens maiores que 500KB

---

## 🧪 Checklist Antes de Publicar

- [ ] Título em h1 com formato `📱 [EMOJI] Título Completo`
- [ ] Descrição meta com max 160 caracteres
- [ ] Banner principal com imagem (max 1200x630px)
- [ ] Tags de benefícios preenchidas
- [ ] Grid de produtos com 4 items (ou ajuste o grid)
- [ ] Botões de oferta com links válidos
- [ ] Tabela com wrapper responsive
- [ ] Testado no mobile (Chrome DevTools)
- [ ] Links de afiliado verificados
- [ ] Redes sociais no rodapé corretas
- [ ] Schema.org (breadcrumb) atualizado

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se copiou o `<div class="spacer"></div>`
2. Teste com `npm run dev` ou Vercel preview
3. Abra as DevTools (F12) e procure por erros
4. Verifique links de imagem (devem estar com `../`)

---

**Data de criação:** 28 de fevereiro de 2026  
**Versão:** 1.0  
**Status:** Pronto para produção
