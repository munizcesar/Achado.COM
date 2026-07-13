# 🧪 Guia de Homologação — Pipeline de Publicação
## AchadoCerto.VIP — Agente Autônomo

> **Objetivo:** Validar que o pipeline publica **apenas** artigos 100% consistentes
> com o produto selecionado, bloqueando qualquer conteúdo duvidoso.

---

## 📋 Checklist de Homologação

### Fase 1 — Testes com Produtos Reais (21 execuções)

| # | Cenário | Categoria | Verificações | Status |
|---|---------|-----------|--------------|--------|
| 1-7 | Produtos catálogo beleza | `beleza` | ✅ ASIN ✅ Título ✅ Categoria ✅ Imagem ✅ Link | ⬜ |
| 8-14 | Produtos catálogo saúde | `saude` | ✅ ASIN ✅ Título ✅ Categoria ✅ Imagem ✅ Link | ⬜ |
| 15-21 | Produtos catálogo casa | `casa` | ✅ ASIN ✅ Título ✅ Categoria ✅ Imagem ✅ Link | ⬜ |

**Critério de aceite:** 0 publicações em categoria errada · 0 links incorretos · 0 troca de produto

### Fase 2 — Teste de Falhas (12 cenários)

| # | Falha Simulada | Resultado Esperado | Status |
|---|----------------|-------------------|--------|
| 1 | Categoria inexistente | ABORTAR | ⬜ |
| 2 | ASIN inválido | Link-builder rejeita | ⬜ |
| 3 | Tag de afiliado ausente | ERRO CRÍTICO → ABORTAR | ⬜ |
| 4 | Categoria sem catálogo | Pipeline falha graciosamente | ⬜ |
| 5 | Imagem quebrada (URL vazia) | Product-validator rejeita | ⬜ |
| 6 | Lock concorrente | Lock2 recusado | ⬜ |
| 7 | Categoria vazia | validateCategorySafety rejeita | ⬜ |
| 8 | Score zerado | Final-score REPROVADO | ⬜ |
| 9 | IA retorna vazio | EDITORIAL_GATE bloqueia | ⬜ |
| 10 | Alucinação (claims inventados) | ANTI_HALLUCINATION bloqueia | ⬜ |
| 11 | Link afiliado inválido (404) | validateFinalAffiliateUrl rejeita | ⬜ |
| 12 | Hash do produto alterado | HASH_VALIDATION bloqueia | ⬜ |

**Critério de aceite:** NÃO PUBLICAR em TODOS os casos

### Fase 3 — Regressão

| # | Cenário | Resultado Esperado | Status |
|---|---------|-------------------|--------|
| 1 | Simulador de pipeline (12 estados) | Completa sem erro | ⬜ |
| 2 | Testes unitários | 62/63 passam (98%) | ⬜ |
| 3 | Dry run beleza | Execução sem crash | ⬜ |

**Critério de aceite:** 0 regressões · mesma saída para produtos já funcionais

### Fase 4 — Volume

| # | Cenário | Resultado Esperado | Status |
|---|---------|-------------------|--------|
| 1 | 50 dry runs (5 ciclos × 10) | Pipeline não degrada | ⬜ |
| 2 | Verificar tempo médio | < 2 min por execução | ⬜ |
| 3 | Verificar repetição de slug | Nenhum slug duplicado | ⬜ |

**Critério de aceite:** 100% das execuções completadas · sem degradação de performance

### Fase 5 — Revisão Manual (10 artigos)

| # | Pergunta | Artigo 1 | Artigo 2 | ... | Artigo 10 |
|---|----------|----------|----------|-----|-----------|
| 1 | Parece escrito por humano? | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | Está falando do produto correto? | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | A recomendação faz sentido? | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | O SEO ficou natural? | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | Publicaria no seu próprio site? | ⬜ | ⬜ | ⬜ | ⬜ |

**Critério de aceite:** 100% SIM em todas as perguntas para todos os 10 artigos

### Fase 6 — Validação dos Artigos Publicados (pós-build)

Após o build do Astro, verifica cada artigo publicado contra o site ao vivo.

| # | Verificação | Descrição | Severidade |
|---|-------------|-----------|------------|
| 1 | HTTP 200 | Página responde corretamente | 🔴 Crítico |
| 2 | Slug correto | URL contém o slug esperado | 🔴 Crítico |
| 3 | Canonical | Link canônico aponta para a URL correta | 🟠 Alto |
| 4 | Open Graph | OG:title, OG:description, OG:image, OG:url presentes | 🟠 Alto |
| 5 | OG Image | Imagem do Open Graph carrega (HTTP 200, content-type image) | 🟠 Alto |
| 6 | JSON-LD Article | Schema Article presente com headline, description, image | 🟠 Alto |
| 7 | JSON-LD Breadcrumb | BreadcrumbList com 4 níveis | 🟠 Alto |
| 8 | Categoria no Breadcrumb | Categoria do post no breadcrumb (position 3) | 🟡 Médio |
| 9 | ALT text | Imagem principal tem texto alternativo | 🟡 Médio |
| 10 | Links Afiliado | Links Amazon com tag de afiliado correta | 🔴 Crítico |
| 11 | Sitemap | Página listada no sitemap.xml | 🟡 Médio |
| 12 | Meta Description | Description com ≥ 80 caracteres | 🟡 Médio |

**Critério de aceite:** 100% dos artigos validados · 0 erros críticos · score médio ≥ 95%

---

## 🚦 Release Gate

O Release Gate é o guardião final. Ele agrega TODOS os resultados de validação
e toma a decisão final: **PUBLICAR** ou **BLOQUEAR**.

### Critérios do Release Gate

```
Critério                            Severidade   Mínimo   Status
─────────────────────────────────────────────────────────────────
Produto correto                     🔴 Crítico   100%     ⬜
Categoria correta                   🔴 Crítico   100%     ⬜
ASIN correto                        🔴 Crítico   100%     ⬜
Link de afiliado correto            🔴 Crítico   100%     ⬜
Hash do produto íntegro             🔴 Crítico   100%     ⬜
Anti-alucinação OK                  🔴 Crítico   100%     ⬜
Auditoria aprovada                  🔴 Crítico   100%     ⬜
Score final ≥ 95%                   🔴 Crítico   95%      ⬜
HTTP 200                            🔴 Crítico   200      ⬜
Nenhum erro 404                     🔴 Crítico   0        ⬜
─────────────────────────────────────────────────────────────────
Score editorial ≥ 90%               🟠 Alto      90%      ⬜
SEO aprovado                        🟠 Alto      90%      ⬜
Coerência semântica ≥ 95%           🟠 Alto      95%      ⬜
Canonical correto                   🟠 Alto      ✓        ⬜
Open Graph tags OK                  🟠 Alto      ✓        ⬜
JSON-LD válido                      🟠 Alto      ✓        ⬜
Imagem carregando                   🟠 Alto      ✓        ⬜
CTA válido                          🟠 Alto      ✓        ⬜
─────────────────────────────────────────────────────────────────
Breadcrumb com categoria            🟡 Médio     ✓        ⬜
ALT text presente                   🟡 Médio     ✓        ⬜
Sitemap contém página               🟡 Médio     ✓        ⬜
Meta description OK                 🟡 Médio     ✓        ⬜
```

**Regra:** Se UM ÚNICO item crítico falhar → **RELEASE BLOQUEADO**. Sem exceções.

---

## 📊 Dashboard de Qualidade

Após cada execução do pipeline, o dashboard registra:

```yaml
produtosProcessados:    21
produtosAprovados:      18
produtosRejeitados:      3
motivosRejeicao:
  QUALITY_APPROVED:      2
  SCORE_FINAL:           1
tempoMedioPorArtigo:   34000ms
taxaReescrita:         14.3%
taxaAlucinacao:         0.0%
taxaErroPorCategoria:
  beleza:                0%
  saude:                 9.5%
  casa:                  4.8%
hashDivergente:          0
falhasSEO:               1
falhasImagem:            0
falhasLink:              0
```

Isso permite identificar regressões ao longo do tempo.

---

## ✅ Critérios de Aceite — Projeto Pronto

O pipeline é declarado **finalizado** quando TODOS os critérios forem atendidos:

| # | Critério | Alvo | Atual |
|---|----------|------|-------|
| 1 | Nenhum artigo publicado na categoria errada | **0** | — |
| 2 | Nenhum artigo publicado com produto diferente do ASIN | **0** | — |
| 3 | Nenhum link de afiliado incorreto | **0** | — |
| 4 | Nenhuma alucinação detectada nos testes | **0** | — |
| 5 | Build do Astro sem erros | ✅ | — |
| 6 | Sitemap contém todas as páginas publicadas | ✅ | — |
| 7 | Canonical, Open Graph e JSON-LD válidos | 100% | — |
| 8 | Testes automatizados | ≥95% | 98% ✅ |
| 9 | Homologação com amostra representativa sem falhas críticas | ✅ | — |
| 10 | Revisão humana da amostra confirma conteúdo correto | 100% | — |

### Declaração de Aceite

> *"O pipeline publica automaticamente **apenas** artigos consistentes com o produto selecionado. Em qualquer situação de dúvida, divergência ou erro, a publicação é bloqueada e encaminhada para revisão, nunca publicada parcialmente."*

**Assinatura:** ____________________  **Data:** ____________________

---

## 🚀 Como Executar a Homologação Completa

```bash
# 1. Testes unitários (rápido)
node scripts/agent/tests/run-all.js

# 2. Simulador de pipeline (mock)
node scripts/agent/tests/simulate-pipeline.js

# 3. Homologação automatizada (Fases 1-5)
node scripts/agent/homologation/run-homologation.js          # Fases 1-3
node scripts/agent/homologation/run-homologation.js --full   # Fases 1-4

# 4. Validação pós-publicação (Fase 6)
node scripts/agent/homologation/post-publication-validator.js --all

# 5. Release Gate + Dashboard
node scripts/agent/homologation/release-gate.js --dashboard

# 6. Ver dashboard no navegador
# Abra reports/release-gate-{timestamp}.html
```
