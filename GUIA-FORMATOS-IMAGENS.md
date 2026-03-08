# 📐 Guia de Formatos de Imagens - AchadoCerto.VIP

## 🎯 Resumo Rápido

| Uso | Formato | Dimensões | Comando |
|-----|---------|-----------|---------|
| **Produtos (recomendado)** | 1:1 (quadrado) | 1200x1200 | `python processar_imagens_produtos.py` |
| **Produtos (alternativa)** | 4:3 | 1200x900 | `python processar_imagens_produtos.py -r 4:3` |
| **Open Graph (social)** | 1.9:1 | 1200x630 | `python otimizar_og.py` |

---

## 📊 Comparação de Formatos

### 🟦 **1:1 (Quadrado) - 1200x1200** ⭐ RECOMENDADO
```bash
python processar_imagens_produtos.py
```

**✅ Vantagens:**
- Produto sempre completamente visível (sem crop)
- Funciona perfeitamente com produtos verticais
- Padding branco mantém foco no produto
- Ótimo para thumbnails e cards
- Alta compatibilidade com layouts responsivos

**❌ Desvantagens:**
- Ocupa mais espaço vertical em listas
- Arquivo ligeiramente maior que 16:9

**📱 Melhor para:**
- Cards de produtos
- Artigos relacionados
- Thumbnails de categorias
- Produtos com embalagem vertical (garrafas, caixas)

---

### 🟩 **4:3 - 1200x900** ⚡ ALTERNATIVA COMPACTA
```bash
python processar_imagens_produtos.py -r 4:3
```

**✅ Vantagens:**
- Produto completo visível (sem crop)
- Mais compacto que 1:1
- Arquivo menor
- Bom balanço entre altura e largura

**❌ Desvantagens:**
- Produtos muito verticais ficam pequenos
- Padding maior nas laterais

**📱 Melhor para:**
- Produtos horizontais ou quadrados
- Páginas com muitos produtos
- Economia de banda

---

### 🟧 **1.9:1 (Open Graph) - 1200x630** 📢 SOCIAL MEDIA
```bash
python otimizar_og.py
```

**✅ Vantagens:**
- Padrão Facebook, Twitter, LinkedIn
- Otimizado para compartilhamento
- Menos espaço vertical

**❌ Desvantagens:**
- **FAZ CROP** em produtos verticais
- Pode cortar partes importantes
- Não recomendado para produtos

**📱 Melhor para:**
- Meta tags Open Graph APENAS
- SEO de compartilhamento social
- Não usar para exibição no site

---

## 🔧 Implementação Atual vs Recomendada

### ❌ Problema Atual
```
Imagem produto: 800x1200 (vertical) → Crop 1200x630 
Resultado: Produto cortado, apenas parte central visível ⚠️
```

### ✅ Solução Recomendada
```
Imagem produto: 800x1200 (vertical) → Padding 1200x1200
Resultado: Produto completo + fundo branco nas laterais ✨
```

---

## 🚀 Como Migrar

### 1️⃣ Processar imagens existentes
```bash
# Backup primeiro (recomendado)
cp -r public/images/posts public/images/posts-backup

# Processar todas em 1:1
python processar_imagens_produtos.py -d public/images/posts
```

### 2️⃣ Ajustar CSS para 1:1
```css
/* Antes (cortava produtos) */
.product-card img {
  aspect-ratio: 16/9;
  object-fit: cover; /* ❌ crop */
}

/* Depois (mostra completo) */
.product-card img {
  aspect-ratio: 1/1;
  object-fit: contain; /* ✅ sem crop */
  background: white;
}
```

### 3️⃣ Atualizar script de posts
No `scripts/novo-post.js`, após baixar imagem:
```javascript
// Processar com padding branco
execSync(`python processar_imagens_produtos.py -d public/images/posts`);
```

---

## 📝 Exemplo Prático

### Produto Bardahl (embalagem vertical)

**Com 1.9:1 (atual):**
```
┌──────────────┐
│   [CORTADO]  │ ← Topo cortado
│   BARDAHL    │
│   [LOGO]     │
│   [TEXTO]    │
│   [CORTADO]  │ ← Base cortada
└──────────────┘
```

**Com 1:1 (recomendado):**
```
┌──────────────┐
│ [BRANCO] │ [PRODUTO COMPLETO] │ [BRANCO]  │
│          │      BARDAHL        │           │
│          │      [LOGO]         │           │
│          │      [TEXTO]        │           │
│          │      200ML          │           │
└──────────────┘
```

---

## 🎨 Ferramentas

### Processar Produtos (novo)
```bash
python processar_imagens_produtos.py          # Padrão 1:1
python processar_imagens_produtos.py -r 4:3   # Compacto
python processar_imagens_produtos.py -s 1600  # Alta resolução
```

### Otimizar Open Graph (existente)
```bash
python otimizar_og.py                         # Para meta tags apenas
```

---

## 🎯 Recomendação Final

1. **Migre para 1:1** - Melhor experiência visual, produtos sempre completos
2. **Use otimizar_og.py** apenas se precisar de compartilhamento social otimizado
3. **Mantenha object-fit: contain** no CSS para evitar crops

**Trade-off:** Arquivos ligeiramente maiores, mas qualidade visual muito superior! ✨
