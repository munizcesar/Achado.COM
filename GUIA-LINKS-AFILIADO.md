# 🔗 Como Usar Links de Afiliado com Comissão Garantida

## 📋 Passo 1: Gere o Link no Portal do Mercado Livre

1. Acesse: https://afiliados.mercadolivre.com.br/gerar-links
2. Cole o **ID do produto** (ex: `4787968949` ou `0B1VX3-P3A0`)
3. Selecione sua etiqueta: `achadocertovip`
4. Clique em **"Gerar Link"**
5. Copie o link encurtado (geralmente começa com `https://meli.la/...`)

## 📁 Passo 2: Salve na Pasta de Links

Abra o arquivo `data/links-afiliados.json`:

```json
{
  "4787968949": "https://meli.la/XXXXX",
  "B0BGV4KKVN": "https://www.amazon.com.br/dp/B0BGV4KKVN?tag=altivita-20"
}
```

**Formato:**
- **Chave:** ID do produto (MLB + números OU ASIN da Amazon)
- **Valor:** Link de afiliado (aquele que você copiou do portal)

## 🚀 Passo 3: Use o Gerador de Posts

Agora quando você rodar:

```bash
node scripts/novo-post.js "https://produto.mercadolivre.com.br/MLB-4787968949-..."
```

O sistema vai:
1. ✅ Detectar o ID (`4787968949`)
2. ✅ Procurar no arquivo `links-afiliados.json`
3. ✅ **Usar o link de afiliado com comissão** 
4. ✅ Gerar o post normalmente

## 📊 Exemplo Prático

**Antes (sem link de afiliado):**
```
affiliateUrl: "https://produto.mercadolivre.com.br/MLB-4787968949-cafeteira..."
❌ Sem rastreamento, sem comissão
```

**Depois (com link de afiliado):**
```
affiliateUrl: "https://meli.la/2Aaknvn"
✅ Rastreado pelo Portal
✅ Comissão GARANTIDA
```

## 💡 Por Que Assim?

O Mercado Livre **não permite automação** da geração de links (anti-bot). Então:
- ❌ Não dá para fazer via API
- ❌ Puppeteer não funciona (é bloqueado)
- ✅ Gerar manualmente no portal é rápido (2 min por produto)
- ✅ Salvar em JSON é automático daí em diante

## 🔄 Workflow Recomendado

1. **Primeira vez:** 5 minutos gerando os links no portal
2. **Depois:** O agente usa automaticamente
3. **Resultado:** Posts com comissão 100% garantida

## 📝 Dúvidas Frequentes

**P: E se eu esquecer de salvar um link?**  
R: O post ainda gera, mas usa a URL simples (sem comissão). Fácil adicionar depois!

**P: Como vejo se funcionou?**  
R: Abra o post gerado em `src/content/blog/` e veja o campo `affiliateUrl`

**P: Posso usar links da Amazon também?**  
R: Sim! Salve com o ASIN como chave:
```json
{
  "B0BGV4KKVN": "https://www.amazon.com.br/dp/B0BGV4KKVN?tag=altivita-20"
}
```
