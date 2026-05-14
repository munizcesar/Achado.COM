# Agente Autônomo — AchadoCerto.VIP

Funciona como um **funcionário autônomo** que decide qual produto postar, monta o link afiliado e executa o `novo-post.js` nos horários programados. **Não toca no código do gerador.**

## Arquivos

```
scripts/agent/
├── agent.js       ← o agente
└── history.json   ← gerado automaticamente (não commitar)
```

## Setup rápido

```bash
# 1. Sem novas dependências (usa apenas Node.js + dotenv já existente)

# 2. Variáveis de ambiente (backend/.env) — já configurado:
AMAZON_AFFILIATE_TAG=altivita-20

# 3. Ignorar arquivos de estado
echo "scripts/agent/history.json" >> .gitignore
echo "scripts/agent/agent.log"    >> .gitignore
```

## Comandos

```bash
# Testar agora (1 post imediato)
node scripts/agent/agent.js --now

# Ver histórico
node scripts/agent/agent.js --status

# Daemon (posta automaticamente 3x/dia)
node scripts/agent/agent.js

# Produção com PM2
pm2 start scripts/agent/agent.js --name agente-achadocerto
pm2 save && pm2 startup
```

## Como funciona

1. Checa a cada 30s se é hora de postar (08:00, 12:00 ou 18:00 BRT)
2. Seleciona produto do catálogo Amazon BR que:
   - Não foi postado nos últimos 60 dias
   - É de categoria diferente dos outros posts do dia
3. Monta URL: `https://www.amazon.com.br/dp/ASIN?tag=altivita-20`
4. Executa: `node scripts/novo-post.js "https://..."`
5. Registra no `history.json`

## Adicionar produtos

Edite o array `AMAZON_CATALOG` em `agent.js`:

```js
{ asin: 'B0XXXXXXXXX', name: 'Nome do Produto', category: 'casa', angle: 'praticidade_cozinha' }
```

O ASIN está na URL da Amazon: `amazon.com.br/dp/**B0XXXXXXXXX**`

## Ângulos disponíveis

| angle | Narrativa |
|---|---|
| `casa_inteligente` | Casa conectada |
| `custo_beneficio` | Vale a pena? |
| `saude_preventiva` | Hábito de saúde |
| `performance` | Resultados reais |
| `treino_em_casa` | Academia em casa |
| `praticidade_cozinha` | Menos tempo na cozinha |
| `ritual_diario` | Começa o dia bem |
| `skincare_basico` | Rotina de pele |
| `cuidado_capilar` | Cabelos saudáveis |
| `custo_beneficio` | Análise de custo |
