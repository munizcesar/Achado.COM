# 🚀 Guia de Produção — AchadoCerto.VIP

Este documento contém os modelos oficiais para manter a identidade visual premium e o funcionamento automático do site.

---

## 1. 📝 Nova Matéria (Pasta `blog/`)
Sempre que criar uma matéria nova, use este modelo para garantir que o design e os links funcionem.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TÍTULO DA MATÉRIA — AchadoCerto.VIP</title>
    <link rel="stylesheet" href="../style.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body>
    <header class="topo">
        <a href="../index.html" style="text-decoration: none;">
            <h1 style="margin:0; font-weight:900; font-size: 42px;">
                🔍<span style="color: #FFFFFF;">AchadoCerto.</span><span style="color: #FFD700;">VIP</span>
            </h1>
        </a>
    </header>

    <main class="review-content" style="padding: 40px 20px; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #FFD700; text-align: center;">TÍTULO DA MATÉRIA</h2>
        <img src="../images/imagesposts/NOME_DA_FOTO.jpg" style="width: 100%; border-radius: 15px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <div class="texto-materia" style="color: #E0E0E0; line-height: 1.8; font-size: 18px;">
            <p>Seu texto começa aqui...</p>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <a href="../index.html" class="botao-padrao-achado" style="text-decoration:none; border: 2px solid #FFD700; color: #FFD700; padding: 10px 30px; border-radius: 50px; font-weight: 800;">VOLTAR PARA HOME</a>
        </div>
    </main>
</body>
</html>
```

---

## 2. 📂 Cadastro no Banco de Dados (Arquivo `posts.js`)
Para a matéria aparecer no site, adicione este bloco ao final da lista no arquivo `posts.js`.

```javascript
  {
    "titulo": "TÍTULO CHAMATIVO AQUI",
    "resumo": "Uma breve descrição para atrair o clique do leitor.",
    "imagem": "images/imagesposts/NOME_DA_FOTO.jpg",
    "link": "blog/NOME_DO_ARQUIVO.html",
    "chamada": "📖 Ler Matéria Completa",
    "categoria": "tech" 
  }
```
> **Categorias Válidas:** `tech`, `saude`, `lar`, `estilo`, `dicas`.

---

## 3. 🛠️ Estrutura das Páginas de Categoria (Pasta `categorias/`)
Se precisar recriar ou criar uma nova categoria, use esta estrutura de scripts no final do arquivo.

```html
<!-- No final do arquivo, antes do </body> -->
<script src="../posts.js"></script>
<script src="../script.js"></script>
```

---

## 💡 Dicas de Ouro para o Sucesso:
1. **Imagens**: Sempre coloque as fotos na pasta `images/imagesposts/`.
2. **Nomes de Arquivos**: Evite espaços ou acentos nos nomes dos arquivos (ex: use `melhor-tv.jpg` em vez de `melhor tv.jpg`).
3. **Busca**: O sistema de busca agora é automático! Ele lê o que você escreve no `titulo` e no `resumo` dentro do `posts.js`.
4. **Cache**: Se fizer uma mudança e não aparecer na hora, aperte `CTRL + F5` no seu navegador.

---
© 2026 AchadoCerto.VIP — Sistema de Gestão Premium
