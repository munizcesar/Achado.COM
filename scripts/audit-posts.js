#!/usr/bin/env node
/**
 * audit-posts.js
 * Audita todos os posts .md e gera relatório de problemas encontrados.
 * Uso: node scripts/audit-posts.js
 * Saída: audit-report.md (na raiz do projeto)
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// ─── REGRAS DE AUDITORIA ───────────────────────────────────────────────────
const REGRAS = [
  {
    id: 'disclaimer-desatualizado',
    descricao: 'Disclaimer com "site gratuito" (deve ser "site no ar")',
    teste: (content) => /manter o site gratuito/i.test(content),
  },
  {
    id: 'preco-fixo',
    descricao: 'Preço fixo no texto (ex: R$99, R$ 150, por apenas R$)',
    teste: (content) => /R\$\s?\d+[\.,]?\d*/i.test(content),
  },
  {
    id: 'sem-disclaimer',
    descricao: 'Post sem nenhum disclaimer de afiliado',
    teste: (content) => !/afiliado|afiliados/i.test(content),
  },
  {
    id: 'link-morto-suspeito',
    descricao: 'Link hardcoded com domínio (pode ter expirado)',
    teste: (content) => /\]\(https?:\/\/(?!meli\.la|amzn\.to|mercadolivre\.com|amazon\.com\.br)[^)]+\)/i.test(content),
  },
  {
    id: 'nota-estrelas',
    descricao: 'Nota em estrelas hardcoded (ex: ⭐⭐⭐⭐⭐ ou 4.8/5)',
    teste: (content) => /⭐{3,}|\d\.\d\/5|\d\/5\s*\*\*/.test(content),
  },
  {
    id: 'disponibilidade-estoque',
    descricao: 'Menção a estoque/disponibilidade atual (pode ficar desatualizado)',
    teste: (content) => /em estoque|disponível agora|últimas unidades|apenas \d+ (restantes|disponíveis)/i.test(content),
  },
  {
    id: 'conclusao-resumo',
    descricao: 'Seção de conclusão genérica (pode indicar conteúdo fraco)',
    teste: (content) => /^## (Conclusão|Resumo Final|Considerações Finais)/im.test(content),
  },
  {
    id: 'titulo-preco',
    descricao: 'Título da seção menciona preço (ex: ## Preço, ## Custo)',
    teste: (content) => /^## ?(Preço|Custo|Valor|Quanto custa)/im.test(content),
  },
];

// ─── EXECUÇÃO ──────────────────────────────────────────────────────────────
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

const problemas = [];

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const errosDoArquivo = [];

  for (const regra of REGRAS) {
    if (regra.teste(content)) {
      errosDoArquivo.push(regra);
    }
  }

  if (errosDoArquivo.length > 0) {
    problemas.push({ file, erros: errosDoArquivo });
  }
}

// ─── RELATÓRIO ─────────────────────────────────────────────────────────────
const data = new Date().toLocaleDateString('pt-BR');
const linhas = [
  `# Relatório de Auditoria de Posts`,
  ``,
  `**Data:** ${data}  `,
  `**Total de posts:** ${files.length}  `,
  `**Posts com problemas:** ${problemas.length}  `,
  ``,
  `---`,
  ``,
];

if (problemas.length === 0) {
  linhas.push('✅ **Nenhum problema encontrado!**');
} else {
  for (const { file, erros } of problemas) {
    linhas.push(`## 📄 \`${file}\``);
    linhas.push('');
    for (const e of erros) {
      linhas.push(`- ⚠️ **[${e.id}]** ${e.descricao}`);
    }
    linhas.push('');
  }

  // Resumo por tipo
  linhas.push('---');
  linhas.push('');
  linhas.push('## 📊 Resumo por tipo de problema');
  linhas.push('');
  const contagem = {};
  for (const { erros } of problemas) {
    for (const e of erros) {
      contagem[e.id] = (contagem[e.id] || 0) + 1;
    }
  }
  for (const [id, qtd] of Object.entries(contagem).sort((a, b) => b[1] - a[1])) {
    const regra = REGRAS.find(r => r.id === id);
    linhas.push(`| \`${id}\` | ${qtd} posts | ${regra.descricao} |`);
  }
}

const reportPath = path.join(__dirname, '../audit-report.md');
fs.writeFileSync(reportPath, linhas.join('\n'), 'utf8');

console.log(`\n📋 Relatório gerado: audit-report.md`);
console.log(`📊 ${problemas.length}/${files.length} posts com problemas encontrados.`);

if (problemas.length > 0) process.exit(1); // exit code 1 para o CI detectar
