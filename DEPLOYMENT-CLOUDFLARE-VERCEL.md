# 🚀 Deployment: Cloudflare Pages + Vercel Backend

**Data:** 3 de Fevereiro de 2026  
**Status:** Planejamento & Documentação  
**Objetivo:** Separar Frontend e Backend para Production-Ready

---

## 📋 Sumário Executivo

- **Frontend:** Cloudflare Pages (HTML, CSS, JS, Assets)
- **Backend:** Vercel (Node.js, APIs, IA Groq)
- **Domínio:** seu-dominio.com (Cloudflare)
- **Custo:** $0 (Grátis)
- **Uptime:** 99%+ 24/7

---

## 🏗️ Arquitetura Final

```
seu-dominio.com (Cloudflare)
    │
    ├─ www.seu-dominio.com → Cloudflare Pages (Frontend)
    │  ├─ index.html
    │  ├─ /blog
    │  ├─ /categorias
    │  ├─ /admin (Fase 18)
    │  ├─ /dashboard (Fase 19)
    │  └─ JavaScript + Assets
    │
    └─ api.seu-dominio.com → Vercel (Backend)
       ├─ GET /api/health
       ├─ GET /api/post-aleatorio
       ├─ GET /api/produtos-ml-aleatorios
       ├─ POST /api/gerar-post (IA Groq)
       ├─ POST /api/produto
       └─ ... (novos endpoints Fases 18-20+)
```

---

## 📁 Estrutura de Pastas Final

```
AchadoCerto.VIP/
├── frontend/                          ← Cloudflare Pages
│   ├── index.html
│   ├── blog/
│   │   ├── cafeteira-italiana-inox.html
│   │   ├── jbl-wave-buds-2.html
│   │   └── ... (13 posts)
│   ├── categorias/
│   │   ├── tech.html
│   │   ├── saude.html
│   │   └── ...
│   ├── images/
│   ├── style.min.css
│   ├── style.css
│   ├── script.js
│   ├── script.min.js
│   ├── search-animation.js
│   ├── search-animation.min.js
│   ├── share.js
│   ├── achadocerto-produtos-simples.js
│   ├── gerador-posts-ia.js
│   ├── validador-posts.js
│   ├── site.webmanifest
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── termos.html
│   ├── politica.html
│   ├── blog.html
│   ├── drawer.js
│   ├── drawer.min.js
│   ├── _redirects                     ← Importante! Redireciona /api → Vercel
│   └── ... (outros assets)
│
├── backend/                           ← Vercel
│   ├── server.js
│   ├── mercadolivre-api.js
│   ├── comparativo.js
│   ├── affiliates.json
│   ├── package.json
│   ├── vercel.json                    ← Novo! Config Vercel
│   ├── .env                           ← Variáveis de ambiente (não fazer commit)
│   ├── .env.example                   ← Exemplo (fazer commit)
│   ├── node_modules/
│   └── ... (outros arquivos)
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml        ← Auto-deploy Cloudflare Pages
│       └── deploy-backend.yml         ← Auto-deploy Vercel
│
├── .gitignore                         ← Certifique-se de ignorar .env
├── DEPLOYMENT-CLOUDFLARE-VERCEL.md   ← Este arquivo
├── README.md
├── package.json                       ← Root (se necessário)
└── ...

```

---

## ⚙️ Configurações Necessárias

### **1. Arquivo: `backend/vercel.json`**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Localização:** `backend/vercel.json`  
**Função:** Instrui Vercel como buildar e servir Node.js  
**Importante:** Verificar `server.js` na raiz de `backend/`

---

### **2. Arquivo: `frontend/_redirects`**

```
/api/* https://api.seu-dominio.com/:splat 200
```

**Localização:** `frontend/_redirects`  
**Função:** Redireciona requisições `/api/*` para Vercel  
**Sem extensão:** É arquivo Cloudflare nativo  
**Resultado:** 
- `/api/health` → `https://api.seu-dominio.com/api/health`
- `/api/post-aleatorio` → `https://api.seu-dominio.com/api/post-aleatorio`

---

### **3. Arquivo: `frontend/achadocerto-produtos-simples.js`**

**Alterar linha 8:**

```javascript
// ANTES (localhost - desenvolvimento)
this.apiUrl = 'http://localhost:3001';

// DEPOIS (production com seu domínio)
this.apiUrl = 'https://api.seu-dominio.com';
```

**Arquivo completo:** `frontend/achadocerto-produtos-simples.js`  
**Linhas:** ~8  
**Função:** Aponta widget para API real em produção

---

### **4. Arquivo: `backend/.env.example`** (fazer commit)

```env
# Groq IA API (gratuito)
GROQ_API_KEY=sua-chave-groq-aqui

# RapidAPI (Mercado Livre)
RAPIDAPI_KEY=sua-chave-rapidapi-aqui
RAPIDAPI_HOST=mercado-libre7.p.rapidapi.com

# Environment
NODE_ENV=production
PORT=3000
```

**Localização:** `backend/.env.example`  
**Função:** Template para quem clona o repo  
**Git:** FAZER COMMIT (sensível é .env, não .env.example)

---

### **5. Arquivo: `backend/.env`** (NÃO fazer commit)

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
RAPIDAPI_KEY=xxxxxxxxxxxxxx
RAPIDAPI_HOST=mercado-libre7.p.rapidapi.com
NODE_ENV=production
```

**Localização:** `backend/.env`  
**Git:** Adicionar a `.gitignore` (já deve estar)  
**Função:** Variáveis reais (secretas)  
**No Vercel:** Adicionar via Dashboard → Settings → Environment Variables

---

## 🌐 Configuração de Domínio (Cloudflare)

### **Pré-requisito:**
- Domínio registrado e apontado para Cloudflare (já tem? Qual é?)

### **DNS Records no Cloudflare:**

#### **Para Frontend (Cloudflare Pages):**
```
Type:    CNAME
Name:    @ (ou www)
Content: seu-projeto.pages.dev
TTL:     Auto
Proxy:   ☑ Proxied (orange cloud)
```

**Resultado:** `seu-dominio.com` → Cloudflare Pages

---

#### **Para Backend (Vercel):**
```
Type:    CNAME
Name:    api
Content: seu-projeto.vercel.app
TTL:     Auto
Proxy:   ☐ DNS only (gray cloud) ← IMPORTANTE!
```

**Por que Gray Cloud (DNS only)?**
- Vercel tem seu próprio SSL/TLS
- Não deixar Cloudflare "proxied" (orange)
- Se não: conflito de certificados

**Resultado:** `api.seu-dominio.com` → Vercel

---

## 🔑 Variáveis de Ambiente (Vercel)

### **No Dashboard Vercel:**

1. Selecionar projeto backend
2. Settings → Environment Variables
3. Adicionar:

```
GROQ_API_KEY         = gsk_...
RAPIDAPI_KEY         = xxxxxxx...
RAPIDAPI_HOST        = mercado-libre7.p.rapidapi.com
ALLOWED_ORIGIN       = https://seu-dominio.com,https://www.seu-dominio.com
NODE_ENV             = production
```

---

## 📤 Passo a Passo Implementação

### **FASE 1: Preparar Estrutura Local (agora)**

```powershell
# 1. Cria pasta frontend/
mkdir frontend

# 2. Move arquivos HTML, CSS, JS (NÃO backend/)
# Use File Explorer ou PowerShell

# 3. Cria vercel.json em backend/
# (arquivo será criado por script)

# 4. Cria _redirects em frontend/
# (arquivo será criado por script)

# 5. Atualiza achadocerto-produtos-simples.js
# Muda localhost:3001 → api.seu-dominio.com

# 6. Commit
git add .
git commit -m "feat: estrutura production-ready (Cloudflare Pages + Vercel)"
git push origin main
```

### **FASE 2: Deploy Cloudflare Pages**

1. Abrir https://dash.cloudflare.com
2. Clicar em domínio
3. Esquerda: **Pages** → **Create a project** → **Connect to Git**
4. Autorizar GitHub
5. Selecionar repo: `munizcesar/AchadoCerto.VIP`
6. Configurar:
   - **Build command:** `echo "Sem build necessário"`
   - **Build output directory:** `frontend`
   - **Environment:** Production
7. **Deploy** → Automático a cada push

---

### **FASE 3: Deploy Vercel**

1. Abrir https://vercel.com
2. Clicar **Add New Project**
3. Importar repo GitHub: `munizcesar/AchadoCerto.VIP`
4. Configurar:
   - **Framework:** Node.js
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. **Environment Variables:** (adicionar as chaves listadas acima)
6. **Deploy** → Automático

---

### **FASE 4: Apontar DNS (Cloudflare)**

1. No Cloudflare Dashboard
2. Domínio → **DNS**
3. Adicionar/Editar CNAME:
   - `@` ou `www` → Cloudflare Pages
   - `api` → Vercel
4. Salvar
5. Aguardar propagação DNS (até 48h, geralmente 5-10min)

---

## ✅ Checklist de Implementação

- [ ] Pasta `frontend/` criada e arquivos movidos
- [ ] Arquivo `backend/vercel.json` criado
- [ ] Arquivo `frontend/_redirects` criado
- [ ] `achadocerto-produtos-simples.js` atualizado (apiUrl)
- [ ] `backend/.env.example` criado e comitado
- [ ] `.gitignore` contém `backend/.env`
- [ ] GitHub: `git push origin main`
- [ ] Cloudflare Pages: Conectado e deployando
- [ ] Vercel: Backend importado e rodando
- [ ] DNS Cloudflare: CNAME apontando para Cloudflare Pages e Vercel
- [ ] Teste: `https://seu-dominio.com` carrega
- [ ] Teste: Widget carrega dados (checa DevTools F12)
- [ ] Teste: Clica no botão → vai para Mercado Livre ✅

---

## 🔍 Testes de Validação

### **Test 1: Frontend Carrega**
```
https://seu-dominio.com
Esperado: Homepage carrega, logo VIP visível
```

### **Test 2: Backend Responde**
```
https://api.seu-dominio.com/api/health
Esperado: {"status":"OK","timestamp":"...","version":"1.0.0"}
```

### **Test 3: Widget Funciona**
```
Abrir: https://seu-dominio.com
F12 → Console
Esperado: ✅ Widget carregado, mensagem de sucesso
```

### **Test 4: Clique em Botão**
```
Homepage → Widget → Clica "📖 Ler o Post"
Esperado: Abre post da homepage em nova aba
```

### **Test 5: Mobile**
```
Smartphone: https://seu-dominio.com
Esperado: Funciona, widget aparece, cliques funcionam
```

---

## 🚨 Troubleshooting

### **Problema: `/api/*` retorna 404**
- Verificar arquivo `frontend/_redirects` existe
- Verificar conteúdo correto
- Cloudflare Pages foi feito deploy? (status verde)

### **Problema: `api.seu-dominio.com` não responde**
- Verificar DNS CNAME existe
- Verificar Vercel deployment bem-sucedido (green check)
- Aguardar propagação DNS (~10min)

### **Problema: Widget não carrega dados**
- DevTools → Network → checar requisições `/api/...`
- Verificar URL em `achadocerto-produtos-simples.js`
- Verificar `backend/.env` tem chaves corretas

---

## 📈 Próximas Fases (Após Deploy)

| Fase | Título | Afetado |
|------|--------|---------|
| 18 | Admin Dashboard | Frontend + Backend |
| 19 | Analytics Real | Novo endpoint Backend |
| 20 | Integrações (Amazon, Shopify) | Backend apenas |
| 21 | App Mobile (React Native) | Reutiliza Backend API |

**Com separação frontend/backend: Cada fase = mudanças isoladas**

---

## 📞 Referências

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Vercel Docs:** https://vercel.com/docs
- **Express.js:** https://expressjs.com/
- **Groq IA:** https://console.groq.com/

---

## 🎯 Resumo Executivo

**O que fazer agora:**
1. Estruturar pastas (frontend/ vs backend/)
2. Criar configs (vercel.json, _redirects)
3. Atualizar URLs JavaScript
4. Fazer commit
5. Conectar Cloudflare Pages (deploy frontend)
6. Conectar Vercel (deploy backend)
7. Apontar DNS
8. Testar

**Resultado:** Site rodando 24/7, sem seu PC ligado, gratuitamente.

**Tempo estimado:** 30 minutos setup + 10 minutos deploy

---

**Versão:** 1.0  
**Última atualização:** 3 de Fevereiro de 2026  
**Status:** Pronto para implementação
