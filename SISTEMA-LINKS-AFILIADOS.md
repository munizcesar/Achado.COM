# 🔗 Sistema de Links de Afiliado - Modo Fácil

## 🎯 Como Funciona

```
PRODUTO NOVO
     ↓
[Você gera link no Portal] ← https://afiliados.mercadolivre.com.br/gerar-links
     ↓
[Salva em data/produtos-afiliados.json]
     ↓
[Agente automático usa] ← node scripts/agente.js
     ↓
[Post gerado COM comissão garantida] ✅ 12%
```

---

## ⚡ Passo 1: Gerar Link do Produto

**Exemplo: Creatina Growth 300g (ID: 19603205)**

1. Abra: https://afiliados.mercadolivre.com.br/gerar-links
2. Cole o ID: `19603205`
3. Etiqueta: `muc1576372` 
4. Clique em **"Gerar Link"**
5. Copie: `https://meli.la/2fk9MmR`

---

## 📝 Passo 2: Adicionar ao Arquivo de Configuração

Abra `data/produtos-afiliados.json`:

```json
{
  "produtos": [
    {
      "id": "19603205",
      "nome": "Creatina Growth 300g",
      "categoria": "saude",
      "linkAfiliado": "https://meli.la/2fk9MmR",
      "status": "✅ Pronto para usar"
    },
    {
      "id": "4787968949",
      "nome": "Cafeteira Italiana",
      "categoria": "casa",
      "linkAfiliado": "https://meli.la/2Aaknvn",
      "status": "✅ Pronto para usar"
    }
  ]
}
```

**Importante:** Use o **ID do produto** como chave (sem "MLB-"):
- ✅ `"19603205"` 
- ❌ `"MLB-19603205"`

---

## 🚀 Passo 3: Executar o Agente

Agora basta rodar:

```bash
node scripts/agente.js --agora --categoria saude
```

**O que acontece:**
1. ✅ Detecta que produto é ID `19603205`
2. ✅ Procura no arquivo
3. ✅ Encontra o link: `https://meli.la/2fk9MmR`
4. ✅ Gera post COM comissão garantida

---

## 📊 Exemplo de Post Gerado

```markdown
---
title: "Creatina Growth 300g - Suplemento"
affiliateUrl: "https://meli.la/2fk9MmR"  ← Link com comissão!
---
```

Quando o leitor clica → Você ganha **12% de comissão** 💰

---

## 🔴 E Se Eu Não Gerar o Link?

Se o produto **não estiver** em `data/produtos-afiliados.json`:

```bash
   ⚠️  Link não salvo para 19603205. Usando URL simples.
      Para gerar: https://afiliados.mercadolivre.com.br/gerar-links
```

Post vai usar URL simples **SEM comissão**. Fácil adicionar depois!

---

## ✅ Checklist de Configuração

- [ ] Acesso ao Portal: https://afiliados.mercadolivre.com.br
- [ ] Etiqueta configurada: `muc1576372`
- [ ] Pelo menos 1 produto com link gerado
- [ ] Link salvo em `data/produtos-afiliados.json`
- [ ] Testado: `node scripts/novo-post.js "URL-do-produto"`

---

## 💡 Dicas Práticas

**Gerar links em lote:**
1. Abra o Portal
2. Gere links de 5-10 produtos
3. Copie-cole rapidinho em `data/produtos-afiliados.json`
4. Pronto! Seus posts gerados terão comissão

**Rastrear ganhos:**
- Acesse: https://afiliados.mercadolivre.com.br/metricas
- Veja cliques e comissões em tempo real

**Adicionar produtos depois:**
- Sem problemas! É só gerar o link e adicionar ao JSON
- O agente vai usar automaticamente no próximo post

---

## 🎁 Resultado Final

✅ Posts gerados automaticamente **COM links de afiliado**  
✅ Comissão de **12%** garantida  
✅ Rastreamento completo no Portal  
✅ Tudo salvo em um arquivo simples
