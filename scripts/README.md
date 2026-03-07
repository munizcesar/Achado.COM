# Scripts — AchadoCertoVIP

## novo-post.js — Gerador automático de posts

Gera um post `.md` completo a partir de um link de afiliado, sem precisar digitar nada manualmente.

### Instalação (apenas primeira vez)

```bash
npm install  # já tem tudo no Node.js padrão, sem deps extras
```

### Como usar

```bash
# Mercado Livre
node scripts/novo-post.js "https://www.mercadolivre.com.br/produto/MLB..."

# Amazon (link curto ou completo)
node scripts/novo-post.js "https://amzn.to/xyz"

# Forçar categoria manualmente
node scripts/novo-post.js "https://..." Tech
node scripts/novo-post.js "https://..." Saúde
node scripts/novo-post.js "https://..." Casa
node scripts/novo-post.js "https://..." Esportes
node scripts/novo-post.js "https://..." Beleza
```

### O que é gerado automaticamente

- ✅ Arquivo `.md` em `src/content/blog/`
- ✅ Imagem do produto baixada em `public/images/posts/`
- ✅ Frontmatter completo (title, description, date, category, image, tags, affiliateUrl)
- ✅ Box de produto com foto + botão "Ver na Loja" (sem preço = evergreen)
- ✅ Seção de specs (quando disponível via API)
- ✅ OG image e Twitter card via frontmatter
- ✅ Aviso de afiliado

### Após gerar

```bash
git add .
git commit -m "post: nome-do-produto"
git push
# Deploy automático! ✅
```

### Componente ProductBox

O componente `src/components/ProductBox.astro` pode ser usado em qualquer post:

```mdx
<ProductBox
  name="Nome do Produto"
  image="/images/posts/nome-do-produto.jpg"
  store="Mercado Livre"
  url="https://link-afiliado"
  badge="Destaque"  {/* opcional */}
/>
```
