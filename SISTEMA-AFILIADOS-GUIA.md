# 🎯 SISTEMA DE AFILIADOS — INSTRUÇÕES COMPLETAS

**Status:** ✅ Implementado e Testado  
**Data:** 1 de fevereiro de 2026  

---

## 📋 RESUMO

Sistema completo de rastreamento de links de afiliado + cliques para cada produto. 

**O que funciona:**
- ✅ Cada produto tem seu link de afiliado único
- ✅ Rastreia qual página gerou quantos cliques
- ✅ Dashboard de stats em tempo real
- ✅ Frontend integrado (clique automático registra)
- ✅ Fallback para Mercado Livre se API offline

---

## 🚀 COMO USAR

### 1️⃣ ADICIONAR SEUS LINKS DE AFILIADO

**Arquivo:** `backend/affiliates.json`

Procure a seção `"produtos"` e substitua:

```json
"motorola-moto-e14": {
  "titulo": "Motorola Moto E14",
  "categoria": "tech",
  "ml_url": "https://www.mercadolivre.com.br/motorola-moto-e14-64gb-preto-prismatico/p/MLB32154234",
  "afiliado_url": "🔴 COLE SEU LINK COM CODE DE AFILIADO AQUI 🔴",
  "ativo": true,
  "cliques": 0
}
```

**Substitua `"afiliado_url"`** com seu link do Mercado Livre que já tem seu código de afiliado.

**Exemplo real:**
```json
"afiliado_url": "https://www.mercadolivre.com.br/motorola-moto-e14-64gb-preto-prismatico/p/MLB32154234?ref=SEU_CODIGO_DE_AFILIADO"
```

### 2️⃣ REGENERAR FRONT END

O JavaScript (`achadocerto-produtos.js`) já está pronto! Quando usuario clica em "Comprar", ele:

1. Extrai ID do produto da URL
2. Chama `GET /api/afiliado/{id}?pagina=seu-post.html`
3. Backend registra o clique
4. Abre seu link de afiliado em nova aba

---

## 📊 VER ESTATÍSTICAS

**Endpoint:** `GET http://localhost:3001/api/afiliados/stats`

**Retorna:**
```json
{
  "sucesso": true,
  "stats": {
    "total_cliques": 125,
    "produtos_totais": 9,
    "top_produtos": [
      {
        "id": "motorola-moto-e14",
        "titulo": "Motorola Moto E14",
        "cliques": 45,
        "categoria": "tech"
      },
      ...
    ],
    "top_paginas": [
      {
        "pagina": "blog/jbl-wave-buds-2.html",
        "produto": "jbl-wave-buds-2",
        "cliques": 32,
        "ultima_atualizacao": "2026-02-01T19:30:00Z"
      },
      ...
    ]
  }
}
```

---

## 🔧 ENDPOINTS DISPONÍVEIS

### 1. Obter Link de Afiliado + Registrar Clique
```
GET /api/afiliado/:produtoId?pagina=seu-post.html
```

**Parâmetros:**
- `produtoId`: ID do produto (ex: `motorola-moto-e14`)
- `pagina`: Página que gerou clique (ex: `blog/seu-post.html`)

**Resposta:**
```json
{
  "sucesso": true,
  "url": "https://www.mercadolivre.com.br/...?ref=seu-codigo",
  "produto": "Motorola Moto E14",
  "cliques": 45,
  "pagina": "blog/seu-post.html"
}
```

### 2. Ver Estatísticas Completas
```
GET /api/afiliados/stats
```

**Retorna:** Top produtos, top páginas, total de cliques

### 3. Adicionar Novo Afiliado (via API)
```
POST /api/afiliado/adicionar
Content-Type: application/json

{
  "produtoId": "novo-produto",
  "titulo": "Novo Produto",
  "categoria": "tech",
  "afiliado_url": "https://..."
}
```

---

## 💡 FLUXO COMPLETO

```
Usuario em blog/seu-post.html
         ↓
Vê widget do produto (ex: Motorola)
         ↓
Clica em "Comprar no ML"
         ↓
JavaScript:
  - Extrai ID: "motorola-moto-e14"
  - Extrai página: "seu-post.html"
  - Chama GET /api/afiliado/motorola-moto-e14?pagina=seu-post.html
         ↓
Backend registra clique e retorna:
  {
    "url": "https://ml.com/...?ref=SEU_CODIGO",
    "cliques": 46
  }
         ↓
JavaScript abre URL em nova aba
         ↓
Usuario vai para Mercado Livre COM seu código de afiliado
         ↓
Se comprar = COMISSÃO PARA VOCÊ ✅
```

---

## 🎯 ONDE USAR

### Em Posts HTML

Você já tem a estrutura pronta em `POST-BOILERPLATE.html`. Os produtos são carregados dinamicamente via:

```html
<div data-produto-url="https://www.mercadolivre.com.br/...">
```

Quando a página carrega:
1. JavaScript identifica o URL
2. Cria o widget com botão "Comprar"
3. Quando clica, rastreia e abre seu link de afiliado

### Em FASE 17 (Geração Automática de Posts)

Quando criar posts automaticamente, o sistema vai:
1. Extrair ID do produto
2. Buscar link de afiliado em `affiliates.json`
3. Inserir automaticamente no botão "Comprar"

---

## 📈 MONETIZAÇÃO

**Como funciona:**

1. Usuario clica em "Comprar" no seu post
2. Seu código de afiliado vai na URL
3. Usuario compra na ML
4. **Você recebe comissão** (depende de seu acordo com ML)

**Cada clique é rastreado:**
- `backend/affiliates.json` atualiza contador
- `/api/afiliados/stats` mostra os melhores posts
- Você sabe qual post gera mais vendas

---

## 🔒 SEGURANÇA

- ✅ Links armazenados em JSON (não expostos em HTML)
- ✅ Cliques registrados no backend (não no cliente)
- ✅ Fallback para ML se link inválido
- ✅ Sem rastreamento de usuários (apenas contagem de cliques)

---

## ✅ CHECKLIST

- [ ] Edite `backend/affiliates.json` com seus links
- [ ] Reinicie o servidor: `npm start` em `/backend`
- [ ] Teste: `GET http://localhost:3001/api/afiliados/stats`
- [ ] Acesse um post e clique "Comprar"
- [ ] Verifique se cliques foram registrados nas stats
- [ ] Pronto para FASE 17! 🚀

---

## 📞 PRÓXIMAS ETAPAS

**FASE 17: Gerador Automático de Posts**
- Cole link ML
- Sistema extrai dados
- IA gera conteúdo
- Insere link de afiliado automaticamente
- Salva HTML pronto
- ETA: 3-4 dias

Quer começar? 🚀
