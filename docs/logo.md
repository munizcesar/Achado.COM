# Logo — AchadoCertoVIP

## Arquivo principal

```
public/logo-achadocerto.svg
```

## Anatomia do logo

```
[⊙] achadocertovip
 └── ícone  └── tspan 1  └── tspan 2
```

| Elemento | Descrição |
|---|---|
| **Ícone** | Círculo com degradê + anel branco + checkmark |
| **achadocerto** | Texto lowercase, cinza `#555`, peso 600 |
| **vip** | Texto lowercase, degradê rosa→roxo→azul, peso 800 |

---

## Especificações técnicas

```xml
<svg viewBox="0 0 295 52" width="295" height="52">
```

### Ícone
- Círculo externo: `r=25`, fill degradê
- Anel branco: `r=22.5`, stroke white `2.2px`
- Círculo interno: `r=21`, fill degradê
- Checkmark: `stroke-width=5`, branco, round caps

### Texto (solução `tspan`)
```xml
<text x="60" y="36"
  font-family="Inter, Helvetica Neue, Arial, sans-serif"
  font-size="26" letter-spacing="-0.3">
  <tspan fill="#555" font-weight="600">achadocerto</tspan>
  <tspan fill="url(#gv)" font-weight="800" letter-spacing="0.5">vip</tspan>
</text>
```

> ⚠️ **Importante:** usar sempre `<tspan>` encadeado no mesmo `<text>` para garantir posicionamento automático e correto do "vip" após "achadocerto" em qualquer browser/OS.

---

## Paleta de cores

### Degradê do ícone (diagonal ↗)
| Stop | Cor | Posição |
|---|---|---|
| Laranja | `#F9A326` | 0% |
| Rosa | `#E1306C` | 30% |
| Roxo | `#833AB4` | 65% |
| Azul | `#405DE6` | 100% |

### Degradê do "vip" (horizontal →)
| Stop | Cor | Posição |
|---|---|---|
| Rosa | `#E1306C` | 0% |
| Roxo | `#833AB4` | 55% |
| Azul | `#405DE6` | 100% |

### Texto "achadocerto"
- Cor: `#555555` (cinza médio)
- Peso: `600` (semibold)

---

## Uso correto

```html
<!-- Header principal -->
<img src="/logo-achadocerto.svg" alt="AchadoCertoVIP"
  width="220" height="44" fetchpriority="high" />

<!-- Footer -->
<img src="/logo-achadocerto.svg" alt="AchadoCertoVIP"
  width="180" height="36" loading="lazy" />

<!-- Drawer mobile -->
<img src="/logo-achadocerto.svg" alt="AchadoCertoVIP"
  width="180" height="36" loading="lazy" />
```

### Tamanhos recomendados
| Contexto | width | height |
|---|---|---|
| Header desktop | 220px | 44px |
| Header mobile | 180px | 36px |
| Footer | 180px | 36px |
| Drawer | 180px | 36px |
| OG Image / Social | 600px | 104px |

---

## Favicon e ícones

```
public/
├── favicon.svg        → ícone circular (usado na aba do browser)
├── favicon.ico        → fallback para browsers antigos
├── icon-180x180.svg   → Apple Touch Icon
├── icon-192x192.svg   → Android / PWA
└── icon-512x512.svg   → PWA splash screen
```

O favicon usa apenas o **ícone circular** (sem texto), idêntico ao elemento do logo.

---

## Decisões de design

- **Lowercase:** escolha intencional — transmite modernidade, acessibilidade e alinhamento com padrões de branding digital (notion, figma, vercel, linear)
- **"vip" em degradê:** destaca a proposta de curadoria premium sem usar caixa alta
- **Cinza `#555` no nome:** contraste suave que faz o "vip" vibrante se destacar ainda mais
- **Sem separador:** o contraste de cor e peso entre "achadocerto" e "vip" já cria separação visual suficiente
