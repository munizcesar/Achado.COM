#!/usr/bin/env node
/**
 * fix-disclaimer.js
 * Corrige todas as variações do disclaimer de afiliado nos posts .md
 * Uso: node scripts/fix-disclaimer.js
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// Texto correto (padrão definitivo)
const DISCLAIMER_CORRETO = '*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site no ar.*';

// Padrões a substituir (regex case-insensitive)
const PADROES = [
  /\*Links deste post são afiliados\. Você não paga nada a mais, mas nos ajuda a manter o site gratuito\.\*/gi,
  /\*Este post contém links afiliados\. Ao comprar por eles, você apoia nosso trabalho sem pagar nada a mais por isso\. Obrigado por ajudar a manter o site gratuito e com conteúdo de qualidade!\*/gi,
  /\*Este conteúdo é informativo\. Links de produtos podem ser afiliados — você não paga nada a mais e nos ajuda a manter o site gratuito\.\*/gi,
  /Os links são de afiliado — você não paga nada a mais, e isso nos ajuda a manter o site gratuito\./gi,
  /nos ajuda a manter este site funcionando e com conteúdo gratuito\.\*/gi,
];

let arquivosAlterados = 0;
let totalArquivos = 0;

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
totalArquivos = files.length;

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const pattern of PADROES) {
    if (pattern.test(content)) {
      content = content.replace(pattern, DISCLAIMER_CORRETO);
      modified = true;
    }
    // reset lastIndex para regex com flag g
    pattern.lastIndex = 0;
  }

  // Caso especial: disclaimer dentro de blockquote (Nota do Editor)
  const blockquotePattern = /> \*\*[^*]+\*\*[^\n]*Os links são de afiliado[^\n]*/g;
  if (blockquotePattern.test(content)) {
    content = content.replace(
      /> \*\*([^*]+)\*\* Este conteúdo é informativo e independente\. Os links são de afiliado — você não paga nada a mais, e isso nos ajuda a manter o site gratuito\./g,
      (match, emoji) => `> **${emoji}** Este conteúdo é informativo e independente. Os links são de afiliado — você não paga nada a mais, e isso nos ajuda a manter o site no ar.`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    arquivosAlterados++;
    console.log(`✅ Corrigido: ${file}`);
  }
}

console.log(`\n📊 Resultado: ${arquivosAlterados}/${totalArquivos} arquivos corrigidos.`);
