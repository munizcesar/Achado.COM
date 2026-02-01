# ⚙️ AUTOMAÇÃO v2.1.0
## Sistema Automático de Validação

**Versão:** 2.1.0 | **Data:** 1 de fevereiro de 2026

---

## 🎯 3 Níveis de Automação

### 1️⃣ **CHECK ÚNICO (Manual - Mais Rápido)**
```bash
python validador-posts-auto.py blog/seu-novo-post.html
```
**Quando usar:** Criou um post novo, quer validar antes de publicar

**Saída:**
```
🔍 VALIDANDO: blog/seu-novo-post.html
====================================================

📋 Validando Open Graph Tags...
🐦 Validando Twitter Card Tags...
🖼️  Validando Imagens...

====================================================
📊 RELATÓRIO DE VALIDAÇÃO
====================================================

✅ SUCESSO (10):
   ✅ og:title: Meu Post...
   ✅ og:description: Descrição...

❌ ERROS (0):

====================================================
🟢 STATUS: PASSOU (Pronto para publicar!)
====================================================
```

---

### 2️⃣ **MONITOR EM TEMPO REAL (Assistente)**
```bash
python monitor-posts.py
```
**Quando usar:** Está trabalhando em posts novos/editando posts

**Funciona assim:**
- Roda continuamente
- Monitora pasta `blog/` e arquivos HTML
- **Valida automaticamente ao salvar** arquivo (Ctrl+S)
- Mostra resultado em tempo real

**Saída (ao salvar):**
```
🔄 Detectado: novo-post.html
✅ novo-post.html - Validação PASSOU
```

**Para parar:**
- Pressione `Ctrl+C`

---

### 3️⃣ **VALIDAR TODOS OS POSTS (Lote)**
```bash
python validar-todos-posts.py
```
**Quando usar:** Fazer manutenção mensal, revisar todos posts

**Saída:**
```
📊 VALIDANDO 12 POSTS
==========================================================

[1/12] index.html... ✅
[2/12] melhor-tv-55-polegadas-2026.html... ✅
[3/12] novo-post.html... ❌ (2 erros)
...

==========================================================
📈 RESUMO GERAL
==========================================================
✅ Passou:  10/12
⚠️  Avisos:  1/12
❌ Erros:   1/12

🔍 POSTS COM PROBLEMAS:

  📄 blog/novo-post.html
     ❌ 2 erros
     ⚠️  1 aviso

==========================================================
🔴 STATUS: Existem posts com ERROS!
```

---

### 4️⃣ **AUTOMÁTICO AO COMMITAR (Git Hook)**
```bash
git add blog/novo-post.html
git commit -m "Novo post: XYZ"
```

**Funciona assim:**
- Antes de commitar, hook automático roda validador
- Se tiver erro → **Commit é bloqueado** ✋
- Se estiver ok → Commit prossegue ✅

**Saída (erro):**
```
🔍 Validando posts antes de commitar...

❌ ERRO: blog/novo-post.html
   ❌ og:image:secure_url: NÃO ENCONTRADA!
   ❌ og:image:alt: NÃO ENCONTRADA!

🚫 Commit bloqueado! Corrija os erros acima.
   (Use 'git commit --no-verify' para forçar, não recomendado)
```

**Saída (sucesso):**
```
🔍 Validando posts antes de commitar...
✅ Todos os posts estão válidos!
[main abc1234] Novo post: XYZ
```

---

## 📋 FLUXO RECOMENDADO

### Cenário 1: Criar Novo Post
```bash
# 1. Criar arquivo
cp POST-BOILERPLATE.html blog/novo-post.html

# 2. Editar no VS Code (abrir arquivo)
code blog/novo-post.html

# 3. Monitor rodando (opcional - em outro terminal)
python monitor-posts.py
→ Valida automaticamente ao salvar

# 4. Depois de pronto:
python validador-posts-auto.py blog/novo-post.html
→ ✅ PASSOU? Pronto!
→ ❌ ERRO? Corrigir

# 5. Commitar
git add blog/novo-post.html
git commit -m "Novo post: Título"
→ Hook valida automaticamente antes de commitar
```

### Cenário 2: Editar Post Existente
```bash
# Monitor rodando em terminal separado
python monitor-posts.py

# Editar arquivo no VS Code
code blog/post-antigo.html

# Monitor valida automaticamente ao salvar (Ctrl+S)
→ ✅ ou ❌

# Quando pronto: commitar normalmente
git commit -am "Atualizar post antigo"
```

### Cenário 3: Manutenção Mensal
```bash
# Validar todos os posts de uma vez
python validar-todos-posts.py

# Ver quais têm erros
→ 📄 blog/xyz.html
   ❌ 2 erros
   ⚠️  1 aviso

# Corrigir
python validador-posts-auto.py blog/xyz.html
# Fazer as correções

# Validar de novo
python validador-posts-auto.py blog/xyz.html
→ ✅ PASSOU!
```

---

## 🚀 SETUP (Primeira Vez)

### Instalar dependências:
```bash
pip install pillow watchdog
```

### Ativar Git Hook (uma vez):
```bash
# Windows:
icacls ".git\hooks\pre-commit" /grant %username%:F

# Linux/Mac:
chmod +x .git/hooks/pre-commit
```

---

## 📊 COMPARAÇÃO DOS 3 MÉTODOS

| Método | Automático | Tempo | Melhor Para |
|--------|-----------|-------|-----------|
| **Check Único** | Manual | 2-3s | Validar antes de publicar |
| **Monitor** | Automático (ao salvar) | Contínuo | Trabalhar em posts novos |
| **Lote** | Manual | 10-30s | Manutenção mensal |
| **Git Hook** | Automático (ao commitar) | 5-10s | Evitar commits com erro |

---

## ✅ O QUE CADA UMA VALIDA

Todas validam:
- ✅ 11 meta tags Open Graph obrigatórias
- ✅ 4 meta tags Twitter Card
- ✅ Imagens (formato JPG, dimensões, existência)
- ✅ Estrutura HTML (DOCTYPE, charset, viewport)
- ✅ URLs seguras (HTTPS em og:image:secure_url)

---

## 🛠️ TROUBLESHOOTING

### "watchdog not found"
```bash
pip install watchdog
```

### "python not found"
```bash
# Verifique instalação Python:
python --version

# Se não funcionar:
python3 --version
# Use 'python3' em vez de 'python'
```

### Hook não funciona
```bash
# Windows - dar permissão:
icacls ".git\hooks\pre-commit" /grant %username%:F

# Linux/Mac:
chmod +x .git/hooks/pre-commit
```

### Forçar commit mesmo com erro (não recomendado)
```bash
git commit --no-verify -m "mensagem"
```

---

## 📈 BENEFÍCIOS

✅ **Sem esquecimentos** - Sistema valida automaticamente
✅ **Rápido** - Resultado em segundos
✅ **Confiável** - Não deixa erros passar
✅ **Produtivo** - Monitor valida enquanto edita
✅ **Seguro** - Git hook bloqueia commits errados

---

## 🎯 META

**Nunca mais publicar um post com meta tags erradas!**

---

**Próximo passo:** Comece criando um novo post:
```bash
cp POST-BOILERPLATE.html blog/seu-post.html
python monitor-posts.py  # em outro terminal
code blog/seu-post.html  # editar
```

Ao salvar, monitor valida automaticamente! 🎉
