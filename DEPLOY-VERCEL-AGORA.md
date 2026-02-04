# ⚡ Deploy Vercel - Guia Rápido (10 minutos)

**Problema:** Site depende do PC estar ligado  
**Solução:** Deploy no Vercel (grátis, 24/7 online)

---

## 📋 Checklist Rápido

- [ ] Instalar Vercel CLI
- [ ] Fazer login com GitHub
- [ ] Deploy do backend
- [ ] Copiar URL do Vercel
- [ ] Atualizar `_redirects`
- [ ] Testar site

---

## 🔧 **Passo 1: Instalar Vercel (2 minutos)**

Abra PowerShell e execute:

```powershell
npm install -g vercel
```

Espera instalação terminar.

---

## 🔑 **Passo 2: Fazer Login (1 minuto)**

```powershell
vercel login
```

Vai aparecer:
```
? Log in to Vercel (Y/n) → Y (enter)
? Which login method? → GitHub / Google / Email
```

Escolha a que você usa e autoriza no navegador.

---

## 🚀 **Passo 3: Deploy do Backend (5 minutos)**

```powershell
cd "c:\Users\Cesar Victor\Desktop\AchadoCerto.Vip\AchadoCerto.VIP\backend"
vercel --prod
```

Vai fazer perguntas:

```
? Set up and deploy? (Y/n) → Y

? Which scope? → [Seu Nome/Account]

? Link to existing project? (y/N) → N

? What's your project's name? → achadocerto-backend

? In which directory is your code? (.) → [Enter]

? Want to modify these settings? (y/N) → N
```

**ESPERA O DEPLOY TERMINAR!**

Quando terminar, aparece:
```
✅ Production: https://achadocerto-backend-xyz9w8.vercel.app
```

📌 **COPIE E GUARDE ESSA URL!**

---

## ✅ **Passo 4: Verificar Deploy**

Teste a URL que você copiou (no navegador):

```
https://achadocerto-backend-xyz9w8.vercel.app/api/health
```

Se retornar:
```json
{"status":"OK","timestamp":"...","version":"1.0.0"}
```

✅ Backend está online!

---

## 🔄 **Passo 5: Atualizar Frontend**

Abra arquivo: `frontend/_redirects`

Encontre:
```
/api/* https://<SUA-URL-VERCEL>/:splat 200
```

Substitua `<SUA-URL-VERCEL>` pela URL que você copiou.

**Exemplo:**
```
/api/* https://achadocerto-backend-xyz9w8.vercel.app/:splat 200
```

---

## 📤 **Passo 6: Deploy do Frontend (Cloudflare Pages)**

Se estiver usando Cloudflare Pages:

1. Faça um `git push` para seu repositório:
```powershell
cd "c:\Users\Cesar Victor\Desktop\AchadoCerto.Vip\AchadoCerto.VIP"
git add frontend/_redirects
git commit -m "Atualizar backend URL para Vercel"
git push origin main
```

2. Cloudflare Pages faz rebuild automaticamente (2-3 minutos)

3. Site agora funciona 24/7! ✅

---

## 🧪 **Teste Final**

1. **Desliga o PC** (ou fecha servidor local)
2. **Acessa https://seu-site.com**
3. **Verifica se carrega**
4. **Clica em um post**
5. **Verifica se os preços carregam**

Se tudo funcionar → ✅ **SUCESSO!**

---

## 🆘 **Se algo falhar:**

### Erro: "Cannot connect to backend"
- Verificar URL do Vercel está correta em `_redirects`
- Testar URL direto no navegador
- Aguardar 5 minutos para Cloudflare fazer rebuild

### Erro: "API returned 403/404"
- Verificar que `backend/server.js` está fazendo deploy
- Colocar URLs relativas `/api/...` no frontend (já feito)

### Erro: "RAPIDAPI_KEY not found"
- Adicionar variáveis de ambiente no Vercel:
  ```
  RAPIDAPI_KEY = [sua-chave]
  RAPIDAPI_HOST = [seu-host]
  GROQ_API_KEY = [sua-chave]
  ```
  (Settings → Environment Variables no Vercel Dashboard)

---

## 📊 **Resultado Final**

Seu site agora funciona assim:

```
achadocerto.vip
├─ Frontend → Cloudflare Pages (sempre online)
└─ Backend → Vercel (sempre online)

✅ PC DESLIGADO = Site funcionando normalmente!
```

---

## 💡 **Próximas Melhorias (depois)**

- [ ] Configurar domínio custom
- [ ] Database para afiliados (Supabase/MongoDB grátis)
- [ ] Cache em Cloudflare
- [ ] CDN para imagens

---

**Tempo total:** 10-15 minutos  
**Custo:** $0  
**Uptime:** 99%+ 24/7

**Faça agora e seu site nunca mais cai!** 🚀
