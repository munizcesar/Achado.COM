# 🔐 POLÍTICA DE SEGURANÇA — AchadoCerto.VIP

**Versão:** 1.0  
**Data de Criação:** 26 de janeiro de 2026  
**Status:** ATIVO  
**Objetivo:** Proteger a integridade estrutural do site e prevenir quebras acidentais

---

## 📋 Sumário Executivo

Este documento estabelece um sistema de **2 tiers de mudanças**:
- **TIER 1 (Verde):** Mudanças SEGURAS que não requerem confirmação prévia
- **TIER 2 (Vermelho):** Mudanças ESTRUTURAIS que EXIGEM confirmação explícita

O site está agora em **modo de proteção aprimorado** para garantir que apenas mudanças validadas sejam implementadas.

---

## 🟢 TIER 1: MUDANÇAS SEGURAS (Sem Confirmação)

### O que pode ser modificado diretamente:

#### 1. **posts.js** — Adicionar/Editar Posts
- ✅ Adicionar novos posts à array `postsData`
- ✅ Editar campos de posts existentes (título, resumo, imagem, link, etc.)
- ✅ Remover posts completamente
- ✅ Reordenar posts na array

**Exemplo:**
```javascript
// SEGURO: Adicionar novo post
{
    "titulo": "Novo Produto X",
    "resumo": "Descrição curta",
    "imagem": "images/imagesposts/produto.webp",
    "link": "blog/novo-produto.html",
    "chamada": "Confira agora",
    "categoria": "tech",
    "keywords": "produto, tech, novo"
}
```

#### 2. **Conteúdo de Posts (blog/\*.html)** — Criar/Editar Artigos
- ✅ Criar novos arquivos de post
- ✅ Editar texto, imagens, links dentro dos posts
- ✅ Adicionar/remover seções de conteúdo
- ✅ Atualizar links de afiliados

**Limitação:** Não modifique as classes CSS ou IDs — apenas o conteúdo dentro das tags.

#### 3. **URLs e Links**
- ✅ Atualizar links de afiliados (Amazon, Mercado Livre, etc.)
- ✅ Mudar href de links
- ✅ Adicionar novos links

#### 4. **Textos e Copys**
- ✅ Editar qualquer texto visível no site
- ✅ Atualizar descrições de categorias
- ✅ Modificar copy dos botões (mantendo o tamanho)

#### 5. **Imagens**
- ✅ Adicionar novas imagens ao site
- ✅ Substituir imagens existentes
- ✅ Atualizar paths de imagem em posts

---

## 🔴 TIER 2: MUDANÇAS ESTRUTURAIS (Exigem Confirmação)

### ⚠️ O que NUNCA deve ser alterado sem aprovação explícita:

#### 1. **style.css** — Estrutura Visual
- ❌ **Modificar media queries** (768px, 850px, 1200px, etc.)
- ❌ **Alterar display/flex/grid properties** críticas
- ❌ **Mudar z-index** de elementos de navegação
- ❌ **Remover animações e transições** essenciais
- ❌ **Alterar altura/largura de containers principais**

**O que é permitido em CSS:**
- Cores, gradientes, sombras
- Padding/margin ajustes menores
- Hover states, transitions suaves
- Fonte, size, weight

#### 2. **script.js** — Lógica da Aplicação
- ❌ **Mudar IDs/classes de containers** (#latest-post, #blog-lista, etc.)
- ❌ **Alterar ordem de carregamento de scripts**
- ❌ **Remover funções críticas** (carregarPosts, renderizar)
- ❌ **Modificar seletores jQuery/DOM**

#### 3. **Estrutura HTML** — Elemento Raiz
- ❌ **Remover sections ou divs principais**
- ❌ **Mudar IDs de containers** (afeta o script.js)
- ❌ **Reorganizar header, menu, footer**
- ❌ **Alterar nomes de classes críticas**

#### 4. **Ordem de Scripts no HTML**
- ❌ **posts.js DEVE ser carregado ANTES de script.js**
- ❌ **Remover ou reordenar tags `<script>`**
- ❌ **Adicionar scripts async sem validação** (afeta carregamento)

#### 5. **Configuração de Categorias**
- ❌ **Mudar nome de arquivos de categorias** (dicas.html, saude.html, etc.)
- ❌ **Remover categorias da lista de 5 válidas**
- ❌ **Alterar paths de navegação**

---

## 📝 PROCEDIMENTO: Como Solicitar Mudança Estrutural

Quando você precisar fazer uma mudança TIER 2, siga este template:

### Template de Solicitação

```
🔧 SOLICITAÇÃO DE MUDANÇA ESTRUTURAL

📌 TÍTULO: [Descrição breve da mudança]

📄 DESCRIÇÃO DETALHADA:
[Explique o que será alterado e por quê]

📂 ARQUIVOS AFETADOS:
- style.css (linhas X-Y)
- script.js (função Z)
- index.html (linha W)

⚙️ IMPACTO ESPERADO:
[Descreva como isso afeta o funcionamento do site]

🎯 MOTIVO:
[Por que essa mudança é necessária?]

✅ CONFIRMA? (Digite SIM ou CONFIRMA)
```

### Exemplo Real

```
🔧 SOLICITAÇÃO DE MUDANÇA ESTRUTURAL

📌 TÍTULO: Aumentar altura do hero section no mobile

📄 DESCRIÇÃO DETALHADA:
O hero section está muito comprimido em celulares. Preciso aumentar a altura máxima de 220px para 280px apenas no mobile.

📂 ARQUIVOS AFETADOS:
- style.css: @media (max-width: 768px) { .hero img { max-height: 280px; } }

⚙️ IMPACTO ESPERADO:
- Hero visualmente maior no mobile
- Pode deslocar um pouco o CTA container
- Sem impacto em desktop

🎯 MOTIVO:
Melhorar visualização da imagem herói e aumentar engajamento inicial

✅ CONFIRMA? SIM
```

---

## 🛡️ PROCEDIMENTO DE BACKUP E ROLLBACK

### Antes de Qualquer Mudança Estrutural:

#### 1. **Criar Commit de Segurança**
```bash
git add .
git commit -m "BACKUP: Antes de [descrição da mudança]"
git push origin main
```

#### 2. **Testar Localmente PRIMEIRO**
- Faça a mudança em um arquivo local
- Abra o site em navegadores diferentes (Chrome, Firefox, Safari, Edge)
- Teste em mobile (responsivo)
- Teste em desktop (1200px+)

#### 3. **Se Algo Quebrar:**
```bash
# Voltar para o último commit
git reset --hard HEAD~1
git push origin main --force
```

#### 4. **Depois de Validado**
```bash
git add .
git commit -m "FEAT: [descrição aprovada da mudança]"
git push origin main
```

---

## 🔍 CHECKLIST DE SEGURANÇA

### Antes de Fazer Qualquer Mudança:

- [ ] É uma mudança TIER 1 (posts, conteúdo)?
  - SIM → Prossiga sem confirmação
  - NÃO → Continue checklist

- [ ] É uma mudança TIER 2 (estrutura, CSS, JS)?
  - SIM → Envie template de solicitação

- [ ] Tenho confirmação explícita? (SIM/CONFIRMA)
  - NÃO → AGUARDE CONFIRMAÇÃO
  - SIM → Continue

- [ ] Fiz backup (git commit)?
  - NÃO → Faça agora
  - SIM → Continue

- [ ] Testei localmente em pelo menos 2 navegadores?
  - NÃO → Teste agora
  - SIM → Continue

- [ ] Testei responsividade (mobile, tablet, desktop)?
  - NÃO → Teste agora
  - SIM → Continue

- [ ] Tudo funciona perfeitamente?
  - NÃO → Reverta com git reset
  - SIM → Faça push para production

---

## 📊 MAPEAMENTO DE RISCO

| Arquivo | Tipo | Risco | Ação |
|---------|------|-------|------|
| posts.js | Conteúdo | Baixo | Modificar livremente (TIER 1) |
| blog/\*.html | Conteúdo | Baixo | Modificar livremente (TIER 1) |
| style.css | Estrutura | **ALTO** | Exigir confirmação (TIER 2) |
| script.js | Lógica | **CRÍTICO** | Exigir confirmação (TIER 2) |
| index.html | Estrutura | **ALTO** | Exigir confirmação (TIER 2) |
| categorias/\*.html | Estrutura | **ALTO** | Exigir confirmação (TIER 2) |

---

## 🚨 SITUAÇÕES DE EMERGÊNCIA

### Se o site quebrar após uma mudança:

1. **Identifique o problema** (qual página/feature não funciona?)
2. **Reverta imediatamente:**
   ```bash
   git log --oneline  # Veja últimos commits
   git reset --hard [hash do commit anterior ao problema]
   git push origin main --force
   ```
3. **Documente o erro** (o que aconteceu, qual mudança causou)
4. **Próxima tentativa:** Faça backup melhor e teste mais cuidadosamente

---

## 📚 REFERÊNCIA RÁPIDA

### Mudanças TIER 1 (Verde - Seguro)
```
✅ Adicionar posts a posts.js
✅ Editar conteúdo de posts (blog/*.html)
✅ Atualizar links de afiliados
✅ Mudar textos/copys
✅ Adicionar/substituir imagens
```

### Mudanças TIER 2 (Vermelho - Requer Confirmação)
```
❌ Alterar media queries em CSS
❌ Mudar IDs/classes de containers
❌ Modificar ordem de scripts
❌ Reorganizar HTML estrutural
❌ Remover ou adicionar seções críticas
```

---

## 🎯 DECISÃO FINAL

**A partir de hoje, o site está protegido.**

- Mudanças TIER 1 (posts e conteúdo) → **Direto, sem espera**
- Mudanças TIER 2 (estrutura) → **Envie template, aguarde SIM/CONFIRMA**

Isso garante que:
✅ Você continua ágil adicionando posts e conteúdo  
✅ Estrutura crítica fica protegida contra acidentes  
✅ Há sempre um registro (git history) de cada mudança  
✅ Sempre há possibilidade de rollback em segundos  

**Segurança e agilidade juntas.** 🛡️⚡

---

## 📞 DÚVIDAS?

Se não tiver certeza se uma mudança é TIER 1 ou TIER 2, **sempre** peça confirmação usando o template. É melhor ser seguro do que desculpar-se depois.

---

**Última atualização:** 26 de janeiro de 2026  
**Próxima revisão:** Quando surgir nova situação de risco  
**Status:** 🟢 ATIVO E MONITORADO
