# 🚀 Backend AchadoCerto - Instruções de Uso

## 📋 Instalação

### 1. Instalar Node.js (se ainda não tem)
Baixe em: https://nodejs.org/ (versão LTS)

### 2. Instalar dependências
No terminal, na pasta `/backend`, execute:

```bash
npm install
```

### 3. Arquivo `.env` já está pronto
A chave API já foi preenchida automaticamente no arquivo `.env`

### 4. Iniciar o servidor

**Modo desenvolvimento:**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor iniciará em: **http://localhost:3001**

---

## 📡 Endpoints da API

### 1. **Health Check** ✅
```
GET /api/health
```
Verifica se o servidor está funcionando.

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-01T19:13:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. **Buscar Produto por URL** 🔍
```
POST /api/produto
Content-Type: application/json

{
  "url": "https://www.mercadolivre.com.br/motorola-moto-e14..."
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "produto": {
    "titulo": "Motorola Moto E14",
    "preco": 599.90,
    "precoOriginal": 799.90,
    "desconto": 25,
    "imagem": "...",
    "url": "...",
    "avaliacao": 4.5,
    "vendidos": 1250,
    "vendedor": "Loja X",
    "condicao": "novo",
    "estoque": 50
  }
}
```

---

### 3. **Buscar Avaliações** ⭐
```
POST /api/avaliacoes
Content-Type: application/json

{
  "url": "https://www.mercadolivre.com.br/..."
}
```

---

### 4. **Buscar por Termo** 🔎
```
GET /api/buscar/notebook?limit=10
```

Busca produtos por um termo específico.

---

### 5. **Criar Comparativo** 📊
```
POST /api/comparativo
Content-Type: application/json

{
  "urls": [
    "https://www.mercadolivre.com.br/produto1",
    "https://www.mercadolivre.com.br/produto2",
    "https://www.mercadolivre.com.br/produto3"
  ]
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "resumo": {
    "totalProdutos": 3,
    "precoMinimo": 299.90,
    "precoMaximo": 599.90,
    "precoMedio": "399.90",
    "avaliacaoMedia": "4.5",
    "maiorDesconto": 30,
    "produtoMaisBarato": {...},
    "produtoMelhorAvaliado": {...},
    "melhorCustoBeneficio": {...}
  },
  "produtos": [...],
  "tabelaHTML": "<table>..."
}
```

---

### 6. **Gerar Post com Dados** 📝
```
POST /api/gerar-post
Content-Type: application/json

{
  "url": "https://www.mercadolivre.com.br/...",
  "titulo": "Seu Título Aqui",
  "categoria": "tech"
}
```

Retorna um template HTML pronto para publicar como post no site.

---

### 7. **Limpar Cache** 🧹
```
GET /api/cache/limpar
```

---

## 🔌 Integração no Frontend

### Exemplo com JavaScript:

```javascript
// Buscar produto
async function buscarProduto(urlProduto) {
  const response = await fetch('http://localhost:3001/api/produto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: urlProduto })
  });

  const data = await response.json();
  console.log(data.produto);
}

// Criar comparativo
async function criarComparativo(urls) {
  const response = await fetch('http://localhost:3001/api/comparativo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ urls })
  });

  const data = await response.json();
  console.log(data.resumo);
  console.log(data.tabelaHTML);
}
```

---

## 🔒 Segurança

✅ **Chave API protegida** em `.env`
✅ **CORS configurado** para seu domínio
✅ **Sem exposição** de credenciais no frontend

---

## 🐛 Troubleshooting

### Porta 3001 já está em uso?
```bash
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```

### API retorna erro?
1. Verifique sua internet
2. Confirme que a chave API está correta em `.env`
3. Verifique se o URL do produto é válido

### CORS error?
Adicione seu domínio em `ALLOWED_ORIGIN` no `.env`:
```
ALLOWED_ORIGIN=http://localhost:3000,https://achadocerto.vip,https://seu-dominio.com
```

---

## 📚 Próximos passos

1. Deploy em servidor (Heroku, AWS, DigitalOcean)
2. Integrar no seu site HTML
3. Criar dashboard com dados dos produtos
4. Automatizar geração de posts

---

**Dúvidas?** Revise a documentação da API RapidAPI: https://rapidapi.com/

