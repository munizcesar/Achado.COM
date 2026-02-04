# 🎯 DEPLOY VERCEL - ÚLTIMOS 3 PASSOS (2 MINUTOS)

**Tudo no GitHub já!** Agora é só 3 cliques e seu site fica online 24/7.

---

## 📋 Passo 1: Abrir Vercel (30 segundos)

1. Abra: **https://vercel.com**
2. Clique em **"Sign Up"** (ou "Log In" se já tem conta)
3. Escolha **"Continue with GitHub"**
4. Autoriza Vercel a acessar seu GitHub (clica em **"Authorize Vercel"**)

---

## 🚀 Passo 2: Criar Projeto (1 minuto)

1. Depois de logar, você vê a página "New Project"
2. Procura o repositório: **AchadoCerto.VIP**
3. Clica em **"Import"**
4. Vai abrir tela de configuração:
   - **Project Name:** `achadocerto-backend` (ou deixa automático)
   - **Framework Preset:** `Node.js`
   - **Root Directory:** `./backend` (⚠️ IMPORTANTE! Mude para backend/)

---

## 🔑 Passo 3: Adicionar Variáveis de Ambiente (30 segundos)

Na tela de configuração, você vai ver **"Environment Variables"**:

Adicione estas 3:

| Nome | Valor |
|------|-------|
| `RAPIDAPI_KEY` | `f0f6a6a86msh49a3313ae042cc4p1777dbjsn21481bd9f7b7` |
| `RAPIDAPI_HOST` | `mercado-libre7.p.rapidapi.com` |
| `GROQ_API_KEY` | `gsk_...Mqzu` |

(Copiei do seu `.env`)

---

## ✅ Passo 4: Deploy! (Automático)

1. Clica em **"Deploy"**
2. **Espera 2-3 minutos** (vai aparecer um progresso)
3. Quando terminar, aparece:
   ```
   ✅ Production: https://achadocerto-backend-xxxxx.vercel.app
   ```

---

## 📌 Passo 5: Atualizar `_redirects` (1 minuto)

Depois que você tiver a URL do Vercel (ex: `https://achadocerto-backend-abc123.vercel.app`):

1. Abra arquivo: `frontend/_redirects`
2. Encontre:
   ```
   /api/* https://<SUA-URL-VERCEL>/:splat 200
   ```
3. Substitua `<SUA-URL-VERCEL>` pela URL que você recebeu
4. Salva o arquivo
5. Faz commit e push:
   ```bash
   git add frontend/_redirects
   git commit -m "Atualizar URL backend Vercel"
   git push
   ```

---

## 🧪 Teste Final

1. **Desliga o PC** (ou fecha o servidor local)
2. **Acessa seu site** (ex: https://achadocerto.vip)
3. **Clica em um post**
4. **Verifica se carrega preço e imagens**

Se funcionar → ✅ **PRONTO! Site 24/7 online!**

---

## 🆘 Se precisar de ajuda entretanto:

**Erro no Deploy?**
- Verificar que `Root Directory` é `./backend`
- Checar se Environment Variables estão todas preenchidas

**Site não carrega API?**
- Verificar que `_redirects` tem a URL correta do Vercel
- Aguardar 5 minutos para Cloudflare Pages fazer rebuild

**Precisa alterar código depois?**
- Só fazer git push
- Vercel faz deploy automático em 2 minutos!

---

**Você consegue fazer esses 5 passos agora?** 🚀

Se precisar de ajuda em algum passo, avisa que eu resolvo!
