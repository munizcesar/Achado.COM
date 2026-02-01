# ⚡ QUICK START - AUTOMAÇÃO v2.1.0

## 🚀 Começar Agora (Em 10 segundos)

### Setup (1x):
```bash
pip install pillow watchdog
```

---

## 3 Comandos Principais

### ✅ Validar Um Post
```bash
python validador-posts-auto.py blog/seu-post.html
```
**Resultado:** `🟢 PASSOU` ou `🔴 ERROS`

---

### 🔄 Monitor em Tempo Real
```bash
python monitor-posts.py
```
**Rodando:** Valida automaticamente ao salvar arquivo  
**Parar:** Ctrl+C

---

### 📊 Validar Todos os Posts
```bash
python validar-todos-posts.py
```
**Resultado:** Relatório completo de todos posts

---

## 📋 Fluxo Prático

```
1. Criar post
   cp POST-BOILERPLATE.html blog/novo.html

2. Editar no VS Code
   code blog/novo.html

3. Em outro terminal (monitor)
   python monitor-posts.py
   → Valida ao salvar (Ctrl+S)

4. Quando pronto
   python validador-posts-auto.py blog/novo.html
   → 🟢 PASSOU? Publicar!
   → 🔴 ERROS? Corrigir

5. Commitar
   git commit -am "Novo post"
   → Git hook valida antes de commitar
```

---

## ✅ Validações Automáticas

- Meta tags Open Graph (11)
- Meta tags Twitter Card (4)
- Imagens (JPG, dimensões, existência)
- Estrutura HTML
- HTTPS seguro

---

## 🎯 Nunca Esqueça

**Monitor roda = Validação automática ao salvar**  
**Commitar = Git hook valida antes**  
**Mensal = `validar-todos-posts.py`**

---

**Próximo:** Criar novo post:
```bash
cp POST-BOILERPLATE.html blog/seu-post.html
```

Salve o arquivo → Monitor valida automaticamente! 🎉
