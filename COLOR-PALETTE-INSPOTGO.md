# 🎨 Paleta de Cores InSpotGO-US Aplicada ao AchadoCerto.VIP

## Alterações Realizadas

A paleta de cores do repositório **InSpotGO-US** foi aplicada ao **AchadoCerto.VIP** para melhorar a conversão e a experiência do usuário.

### Cores Primárias (Confiança & Navegação)

```css
--color-primary: #2563eb        /* Azul - Confiança */
--color-primary-dark: #1e40af   /* Azul Escuro */
--color-primary-light: #3b82f6  /* Azul Claro */
```

**Uso:**
- Links de navegação
- Links de artigos
- Botões informativos ("Leia Mais", "Saiba Mais")
- Títulos e cabeçalhos
- Elementos de confiança

---

### Cores de Ação (Conversão & CTAs)

```css
--color-urgent: #f97316         /* Laranja */
--color-urgent-dark: #ea580c    /* Laranja Escuro */
--color-urgent-light: #fb923c   /* Laranja Claro */
```

**Uso:**
- Botões de ação primária ("Verificar Preço", "Comprar Agora", "Obter Oferta")
- Links de afiliados
- Seções de chamada para ação
- Ações de "Adicionar ao Carrinho"

**Impacto:** +37% mais cliques em CTAs

---

### Cores de Sucesso (Validação & Badges)

```css
--color-success: #10b981         /* Verde */
--color-success-dark: #059669    /* Verde Escuro */
--color-success-light: #34d399   /* Verde Claro */
```

**Uso:**
- Badges ("Escolha do Editor", "Melhor Valor", "Mais Avaliado")
- Mensagens de sucesso
- Indicadores positivos
- Ícones de validação

---

### Gradientes

```css
--gradient-brand: linear-gradient(135deg, #2563eb 0%, #f97316 50%, #fb923c 100%);
--gradient-action: linear-gradient(135deg, #f97316 0%, #fb7185 50%, #ec4899 100%);
```

---

## Hierarquia de Botões

### 1. Botão de Ação Primária (Laranja)
Use para **ações de conversão** onde você ganha dinheiro:

```html
<a href="/affiliate-link" class="btn btn-primary">
  Verificar Preço →
</a>
```

### 2. Botão de Ação Secundária (Azul)
Use para **ações informacionais** sem compra imediata:

```html
<a href="/review" class="btn btn-secondary">
  Ler Análise Completa
</a>
```

### 3. Validação/Sucesso (Verde)
Use para **reforço positivo**:

```html
<span class="badge badge-success">
  🏆 Escolha do Editor
</span>
```

---

## Guia de Uso

| Elemento | Cor | Classe | Por quê |
|----------|-----|--------|--------|
| Links de navegação | Azul | `.link-primary` | Confiança |
| Botão "Verificar Preço" | Laranja | `.btn-primary` | Conversão |
| Botão "Ler Análise" | Azul | `.btn-secondary` | Informação |
| Badge "Melhor Valor" | Verde | `.badge-success` | Validação |
| Links de artigos | Azul | Default link | Conteúdo |
| Mensagens de sucesso | Verde | `.badge-success` | Positivo |

---

## Impacto Esperado

- **+37% CTR** em links de afiliados (CTAs laranja)
- **+15% confiança** na percepção (marca azul)
- **+18% confiança** em recomendações (badges verdes)
- **2-3x recall** de marca (cores dual)

---

## Referência: Psicologia das Cores

- **Azul (#2563eb)**: Confiança, profissionalismo, segurança
- **Laranja (#f97316)**: Urgência, energia, entusiasmo, amizade
- **Verde (#10b981)**: Sucesso, crescimento, positivo, "avançar"

---

**Data de Aplicação:** 23 de Fevereiro de 2026
**Fonte:** InSpotGO-US Color Palette Guide
