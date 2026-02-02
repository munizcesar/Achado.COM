# 🚀 Teste Rápido do Backend - 3 Passos!

## ✅ Passo 1: Instalar Node.js
Baixe em: **https://nodejs.org/** (escolha a versão LTS)

Clique em "Next, Next, Finish..." e instale.

---

## ✅ Passo 2: Executar o Instalador

1. Abra a pasta: `backend/`
2. Procure pelo arquivo: **`instalar-e-testar.bat`**
3. **Clique 2x** nele

Vai aparecer uma janela preta. **DEIXE RODANDO** - vai instalar tudo automaticamente.

---

## ✅ Passo 3: Testar

Quando terminar a instalação (e aparecer "Iniciando servidor..."), **abra uma NOVA aba do PowerShell** (Ctrl+Shift+T se estiver no Windows Terminal).

Na nova aba, execute:

```powershell
cd "c:\Users\Cesar Victor\Desktop\AchadoCerto.Vip\AchadoCerto.VIP\backend"
node teste.js
```

---

## 🎯 Resultado Esperado

Você verá algo assim:

```
╔════════════════════════════════════════════╗
║     🧪 TESTES DO BACKEND ACHADOCERTO      ║
╚════════════════════════════════════════════╝

🔍 TESTE 1: Health Check
✅ Servidor está funcionando!

🔍 TESTE 2: Buscar Produto
✅ Produto encontrado!

📦 Motorola Moto E14
💰 Preço: R$ 599.90
🏷️  Desconto: 25%
...

✅ Sucessos: 5
❌ Falhas: 0

🎉 TUDO FUNCIONANDO! Pronto para integrar no site.
```

---

## 🖥️ Alternativa: Teste no Navegador

Se preferir um teste visual mais bonito:

1. **Deixe o servidor rodando** (primeira aba do PowerShell)
2. Abra seu navegador
3. Cole este endereço na barra de URL:

```
file:///c:/Users/Cesar%20Victor/Desktop/AchadoCerto.Vip/AchadoCerto.VIP/backend/teste.html
```

Vai abrir uma página roxinha e linda com botões para testar tudo! ✨

---

## ❌ Se der erro...

### "Node.js não encontrado"
→ Baixe e instale: https://nodejs.org/

### "EADDRINUSE" (Porta em uso)
→ Feche outras abas do PowerShell que rodem o servidor
→ Ou execute em outra porta:
```powershell
$env:PORT=3002; npm start
```

### Outro erro?
→ Copie o erro completo e cole aqui pra eu ajudar!

---

## 💡 Dica

**Mantenha 2 abas abertas:**

| Aba 1 | Aba 2 |
|-------|-------|
| `npm start` | `node teste.js` |
| Servidor rodando | Testes executando |

Quando terminar os testes (aba 2), o servidor (aba 1) continua rodando para integrar no site!

---

**Conseguiu testar? Avise quando funcionar! 🎉**
