# Agente Autônomo de Posts — AchadoCerto.VIP

## O que faz
Roda `node scripts/novo-post.js <URL>` nos horários programados,  
escolhendo produtos estratégicos sem repetição e sem tocar no gerador.

## Uso

```bash
# Modo daemon (produção) — roda nos horários da agenda
node scripts/agente.js

# Teste rápido — roda UMA vez agora com a primeira categoria da agenda
node scripts/agente.js --agora

# Teste por categoria específica
node scripts/agente.js --categoria tech
node scripts/agente.js --categoria casa
node scripts/agente.js --categoria esportes
node scripts/agente.js --categoria saude
node scripts/agente.js --categoria beleza
node scripts/agente.js --categoria automotivo
```

## Manter rodando em background (PM2)

```bash
npm install -g pm2
pm2 start scripts/agente.js --name "agente-achadocerto"
pm2 save
pm2 startup    # configura para iniciar no boot
```

## Adicionar produtos

Edite o array `PRODUTOS` no início do `scripts/agente.js`:

```js
{ url: 'https://www.mercadolivre.com.br/url-do-produto', categoria: 'tech' },
```

Categorias disponíveis: `tech`, `casa`, `esportes`, `saude`, `beleza`, `automotivo`

## Alterar horários

Edite o array `AGENDA` no `scripts/agente.js`:

```js
{ hora: 8,  minuto: 0,  categoria: 'tech'    },
{ hora: 12, minuto: 30, categoria: 'casa'    },
{ hora: 18, minuto: 0,  categoria: 'esportes'},
```

## Histórico

O agente salva cada URL usada em `data/agente-historico.json`.  
Produtos não se repetem por **30 dias** na mesma URL.  
Esse arquivo é gerado automaticamente — adicione ao `.gitignore`.
