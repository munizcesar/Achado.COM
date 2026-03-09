# Guia Rápido - Sistema de Posts AchadoCerto.VIP

## 🚀 Criar Novo Post (1 comando)

```bash
node scripts/novo-post.js "URL-DO-PRODUTO"
```

### Exemplos:
```bash
# Mercado Livre
node scripts/novo-post.js "https://meli.la/2BzsSat"

# Amazon
node scripts/novo-post.js "https://amzn.to/xyz123"

# Magazine Luiza
node scripts/novo-post.js "https://maga.lu/abc456"
```

---

## ✨ O que o Script Faz Automaticamente

1. ✅ Detecta plataforma (ML, Amazon, Magalu)
2. ✅ Extrai dados do produto (nome, imagem, specs)
3. ✅ **Detecta categoria automaticamente** (800+ keywords)
4. ✅ Busca contexto via Serper.dev (opcional)
5. ✅ **Gera conteúdo único** com IA (Groq)
6. ✅ **Aplica títulos de seção variados** por categoria
7. ✅ Valida qualidade (9 critérios)
8. ✅ Baixa imagem do produto (1200x1200)
9. ✅ Cria arquivo .md completo
10. ✅ Faz commit e push automático

---

## 📊 Sistema de Qualidade

### Pontuação (0-9):
- **9/9 (100%)**: Perfeito! ✨
- **8/9 (89%)**: Excelente ✅
- **7/9 (78%)**: Bom ✅
- **6/9 (67%)**: Aceitável ⚠️
- **5/9 (56%)**: Baixo - revisar ❌

### Critérios Validados:
1. Sem preços exatos
2. Conteúdo evergreen (sem datas)
3. Títulos específicos (não genéricos)
4. Sem metalinguagem ("neste artigo...")
5. Contém prova social
6. CTA natural presente
7. Linguagem evergreen
8. Extensão adequada (400+ palavras)
9. Especificações presentes

---

## 🎨 Sistema de Variação de Conteúdo

### Arquétipos (4 tipos):
- **A**: A Dúvida do Comprador
- **B**: A Experiência de Quem Comprou
- **C**: O Guia da Decisão Certa
- **D**: O Contexto de Mercado

### Variações por Post:
- 12 opções de **títulos**
- 15 opções de **aberturas**
- 10 opções de **transições**
- 9 opções de **fechamentos**
- 25+ opções de **títulos de seções** (por categoria)

### Resultado:
**Cada post é único** - mesmo produtos similares terão abordagens diferentes!

---

## 📂 Estrutura de Arquivos

### Entrada (você fornece):
```
URL do produto
```

### Saída (script cria):
```
src/content/blog/{slug}.md           # Post markdown
public/images/posts/{slug}.jpg        # Imagem do produto
```

### Exemplo de Frontmatter:
```yaml
---
title: "Título Gerado"
description: "Descrição gerada"
date: 2026-03-08
category: "Beleza"           # Detectado automaticamente
image: "/images/posts/slug.jpg"
affiliateUrl: "URL original"
featured: true
draft: false
---
```

---

## 🎯 Categorias Automáticas

### 5 Categorias + Geral:
1. **Tech** - Smartphones, notebooks, fones, smartwatches...
2. **Beleza** - Perfumes, maquiagem, skincare, cabelo...
3. **Casa & Lar** - Cozinha, decoração, organização...
4. **Esportes** - Suplementos, equipamentos, roupas...
5. **Automotivo** - Aditivos, fluidos, acessórios...
6. **Geral** - Fallback se não detectar

### Sistema de Score:
Cada keyword encontrada = +2 pontos
Categoria com maior score vence!

---

## 🔧 Configuração (já feita)

### Variáveis de Ambiente (.env no backend/):
```env
GROQ_API_KEY=gsk_...          # IA para gerar conteúdo
SERPER_API_KEY=...            # Buscar contexto (opcional)
```

### APIs Usadas:
- **Groq AI**: Geração de conteúdo (temperature 0.1)
- **Serper.dev**: Contexto de avaliações (limite: 2500/mês)
- **Mercado Livre**: Scraping direto (API dá 403)

---

## 📝 Fluxo Completo

```
1. Você: node scripts/novo-post.js "URL"
         ↓
2. Script detecta: Mercado Livre
         ↓
3. Extrai dados: "Floratta Gold O Boticário 75ml"
         ↓
4. Detecta categoria: "Beleza" (score: 6)
         ↓
5. Seleciona arquétipo: "A Dúvida do Comprador"
         ↓
6. Sorteia variações: 
   - Título: "O que ninguém te conta..."
   - Abertura: "Pesquisar muito antes..."
   - Seção: "Duração e Rendimento do Produto"
         ↓
7. Busca contexto: Serper (3 buscas)
         ↓
8. Gera conteúdo: Groq AI (2000 palavras)
         ↓
9. Valida: 8/9 pontos ✅
         ↓
10. Baixa imagem: 1200x1200 JPG
         ↓
11. Cria arquivo: blog/floratta-gold-...md
         ↓
12. Git commit + push
         ↓
13. ✨ Post no ar em 2-3 minutos!
```

---

## 🎨 Visual Hero (Primeira Impressão)

### Como Aparece no Site:
- **Seção Hero** no topo da homepage
- Post mais recente em destaque
- Imagem grande (4:3) com produto completo
- Background branco limpo
- Zoom suave no hover (1.15x)
- Borda e sombra premium

### CSS Usado:
```css
aspect-ratio: 4/3;
object-fit: contain;     /* Produto inteiro */
padding: 12px;           /* Respiro interno */
background: #FFFFFF;      /* Branco limpo */
```

---

## 🚨 Troubleshooting

### "Categoria errada detectada"
→ Adicione keywords em `scripts/novo-post.js` (função `detectCategory`)

### "Qualidade baixa (< 6/9)"
→ Verifique se:
- Produto tem descrição rica
- Título não é muito genérico
- Tem especificações técnicas

### "Imagem não baixou"
→ Verifique conexão e URL da imagem

### "Erro no Groq API"
→ Verifique GROQ_API_KEY no .env

### "Conteúdo muito curto"
→ Normal em produtos com poucas specs
→ IA compensa com mais análise de uso

---

## 📊 Métricas de Uso

### Custos (por post):
- Groq AI: ~$0.001 (1 request)
- Serper: ~$0.005 (3 searches)
- **Total**: ~$0.006 por post

### Limites:
- Serper: 2500 buscas/mês (≈ 833 posts)
- Groq: Ilimitado (free tier generoso)

### Tempo:
- Extração: ~2s
- Contexto: ~3s
- Geração IA: ~5s
- Download imagem: ~2s
- **Total**: ~12-15 segundos

---

## 🎓 Boas Práticas

### ✅ FAÇA:
- Gere posts de produtos com boa descrição
- Verifique categoria após geração
- Leia o post antes de publicar (qualidade)
- Use URLs oficiais das lojas

### ❌ NÃO FAÇA:
- Gerar posts em massa sem revisar
- Usar URLs encurtadas genéricas
- Editar manualmente o markdown (?)
- Ignorar warnings de qualidade baixa

---

## 🔄 Atualizações Futuras

### Em Desenvolvimento:
- [ ] Regenerar posts antigos automaticamente
- [ ] A/B test de títulos
- [ ] Mais categorias (Moda, Games, Livros)
- [ ] Sistema de revisão manual simplificado

### Concluído:
- [x] Sistema de categorização inteligente (800+ keywords)
- [x] Títulos de seção variados por categoria
- [x] Visual hero otimizado
- [x] Qualidade 9/9 consistente

---

## 📞 Comandos Úteis

```bash
# Criar post
node scripts/novo-post.js "URL"

# Ver status git
git status

# Ver últimos commits
git log --oneline -5

# Ver posts criados
ls src/content/blog/

# Rodar servidor local
npm run dev

# Build produção
npm run build
```

---

## 📚 Arquivos Importantes

### Scripts:
- `scripts/novo-post.js` - Script principal
- `scripts/content-archetypos.js` - Variações e títulos
- `scripts/groq-service.js` - Integração IA
- `scripts/serper-service.js` - Busca contexto
- `scripts/content-validator.js` - Validação qualidade

### Estilos:
- `src/styles/global.css` - CSS do hero
- `src/pages/index.astro` - Homepage

### Configuração:
- `backend/.env` - API keys
- `astro.config.mjs` - Config Astro

---

*Guia criado em 08/03/2026*
*Sistema pronto para produção!* ✨
