# 🎯 Rastreamento de Afiliados — Guia Rápido

## ✅ O que foi feito:

Todos os links de afiliado agora incluem **parâmetros UTM automáticos**:

```
utm_source=achadocertovip     (identifica seu site)
utm_medium=blog               (identifica o tipo de conteúdo)
utm_campaign=posts-ia         (identifica a origem dos posts)
utm_id=mercado-livre/amazon   (identifica a plataforma)
```

**Exemplo de link gerado:**
```
https://produto.mercadolivre.com.br/MLB-4787968949-cafeteira-italiana?
utm_source=achadocertovip&utm_medium=blog&utm_campaign=posts-ia&utm_id=mercado-livre
```

---

## 📊 Como rastrear as conversões:

### **Opção 1: Google Analytics (Recomendado)**

1. Acesse seu Google Analytics
2. Vá para **Relatórios → Tráfego → Origem/Meio**
3. Procure por:
   - **Source:** `achadocertovip`
   - **Campaign:** `posts-ia`
   
Você verá quantos cliques cada post gerou! 📈

### **Opção 2: Mercado Livre (Painel de Afiliados)**

Mesmo sem API própria, Mercado Livre rastreia cliques via:
- **Central de Afiliados** → Relatórios
- Os cliques aparecem lá naturalmente

### **Opção 3: Próprio Link Manager**

Você pode criar um script que monitora quais links foram clicados usando cookies:

```javascript
// Adicionar ao seu template de post
<script>
  document.querySelectorAll('a[href*="utm_source=achadocertovip"]').forEach(link => {
    link.addEventListener('click', () => {
      fetch('/api/track', {
        method: 'POST',
        body: JSON.stringify({ url: link.href, post: 'nome-do-post' })
      });
    });
  });
</script>
```

---

## 🔗 Estrutura de Links Gerada:

### Mercado Livre
```
URL original → Adiciona UTM → Link rastreável
https://produto.mercadolivre.com.br/MLB-xxx → ...?utm_source=achadocertovip
```

### Amazon
```
URL original → Adiciona tag de afiliado + UTM → Link rastreável
https://amazon.com.br/dp/B0BGV4KKVN?tag=altivita-20 → ...&utm_source=achadocertovip
```

### Magalu
```
URL original → Adiciona UTM → Link rastreável
https://www.magazineluiza.com.br/produto → ...?utm_source=achadocertovip
```

---

## 🚀 Próximos Passos:

1. **Teste gerando um post** com `node scripts/novo-post.js`
2. **Verifique o link** no post gerado (veja o `affiliateUrl` no frontmatter)
3. **Configure Google Analytics** se quiser rastreamento detalhado
4. **Acompanhe conversões** e otimize (posts que vendem mais → replique)

---

## ⚠️ Importante:

- **UTM é Universal**: Funciona em qualquer plataforma
- **Não há comissão perdida**: Os links continuam normais, apenas com rastreamento
- **Pode expandir**: Se precisar de tracking ID específico da Mercado Livre depois, é fácil adicionar
