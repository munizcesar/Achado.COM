# 📘 MANUAL MESTRE DE PRODUÇÃO — AchadoCerto.VIP

Este guia foi criado para que você nunca se perca, mesmo que fique muito tempo sem postar. Siga este passo a passo para manter o site sempre perfeito.

---

## 🏗️ 1. A ESTRUTURA DO SEU SITE (Onde fica cada coisa)
*   **Pasta Raiz (Principal)**: Onde ficam o `index.html`, `blog.html`, `style.css`, `script.js` e o banco de dados `posts.js`.
*   **Pasta `blog/`**: Onde você salva as páginas das matérias completas.
*   **Pasta `categorias/`**: Onde ficam as páginas que filtram os posts (tech, saude, etc).
*   **Pasta `images/imagesposts/`**: Onde você deve salvar TODAS as fotos das prévias dos posts.

---

## 🚀 2. PASSO A PASSO PARA POSTAR UMA NOVA MATÉRIA

### PASSO A: Preparar a Imagem
1. Salve a foto na pasta `images/imagesposts/`.
2. **DICA**: Use nomes simples, sem espaços ou acentos (Ex: `celular-samsung.jpg`).

### PASSO B: Criar a Página da Matéria (na pasta `blog/`)
Crie um novo arquivo `.html` dentro da pasta `blog/` e cole este código completo:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOME DO PRODUTO — AchadoCerto.VIP</title>
    <!-- O ../ serve para buscar o estilo que está na pasta de cima -->
    <link rel="stylesheet" href="../style.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body>
    <!-- CABEÇALHO PREMIUM -->
    <header class="topo">
        <a href="../index.html" style="text-decoration: none;">
            <h1 style="margin:0; font-weight:900; font-size: 42px;">
                🔍<span style="color: #FFFFFF;">AchadoCerto.</span><span style="color: #FFD700;">VIP</span>
            </h1>
        </a>
    </header>

    <main class="review-content" style="padding: 40px 20px; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #FFD700; text-align: center; font-size: 32px;">TÍTULO DA MATÉRIA</h2>
        
        <!-- FOTO PRINCIPAL -->
        <img src="../images/imagesposts/NOME_DA_FOTO.jpg" style="width: 100%; border-radius: 15px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- TEXTO DA MATÉRIA -->
        <div class="texto-materia" style="color: #E0E0E0; line-height: 1.8; font-size: 18px; text-align: justify;">
            <p>Escreva aqui sua análise detalhada sobre o produto...</p>
            <p>Você pode adicionar quantos parágrafos quiser.</p>
        </div>

        <!-- BOTÃO DE VOLTAR -->
        <div style="text-align: center; margin-top: 40px;">
            <a href="../index.html" class="botao-padrao-achado" style="text-decoration:none; border: 2px solid #FFD700; color: #FFD700; padding: 12px 35px; border-radius: 50px; font-weight: 800; display: inline-block;">VOLTAR PARA HOME</a>
        </div>
    </main>

    <footer style="text-align: center; padding: 40px; opacity: 0.5;">
        <p>© 2026 AchadoCerto.VIP</p>
    </footer>
</body>
</html>
```

### PASSO C: Registrar no "Banco de Dados" (`posts.js`)
Abra o arquivo `posts.js` na pasta principal. Adicione o novo post **no topo da lista** (para ele aparecer primeiro na Home). 

**ATENÇÃO**: Sempre coloque uma vírgula `,` após fechar a chave `}` do post anterior.

```javascript
  {
    "titulo": "TÍTULO QUE APARECE NO CARD",
    "resumo": "Resumo curto para convencer a pessoa a clicar.",
    "imagem": "images/imagesposts/NOME_DA_FOTO.jpg",
    "link": "blog/NOME_DO_ARQUIVO.html",
    "chamada": "📖 Ler Matéria Completa",
    "categoria": "tech" 
  },
```
> **Categorias Aceitas**: `tech`, `saude`, `lar`, `estilo`, `dicas`. (Escreva exatamente assim, em minúsculas).

---

## 🛠️ 3. REGRAS DE OURO (Para não quebrar o site)

1.  **O Link do Título**: Nas páginas de categorias ou blog, o link do título deve ser `../index.html`. Na página principal, é apenas `index.html`.
2.  **A Ordem dos Scripts**: No final de qualquer página que precise mostrar posts (Home, Blog ou Categorias), a ordem deve ser sempre:
    1. `<script src="posts.js"></script>` (Carrega os dados)
    2. `<script src="script.js"></script>` (Faz a mágica acontecer)
3.  **Busca Inteligente**: O campo de busca no topo do site pesquisa automaticamente no `titulo` e no `resumo` que você escreveu no `posts.js`.
4.  **Imagens Cortadas?**: O sistema agora usa `object-fit: contain`. Isso significa que a foto nunca será cortada, ela sempre aparecerá inteira dentro do cartão.

---
© 2026 AchadoCerto.VIP — Sistema Premium de Gestão de Conteúdo
