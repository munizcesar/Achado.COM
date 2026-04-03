/**
 * fix-buttons.js
 * Migração em massa: padroniza botões do card de produto em todos os .md
 * 
 * Regras aplicadas:
 * - Botão: display:block; width:100%; text-align:center (nunca inline-flex)
 * - Texto: "🛒 Ver produto" (curto, não quebra em mobile)
 * - Font-size: 14px | Padding: 10px 16px
 * - Container: align-items:flex-start; gap:16px; padding:16px
 * - Imagem: 90x90px
 * - Inner div: flex:1;min-width:0
 * - Título do produto: font-size:15px
 * 
 * Uso: node scripts/fix-buttons.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const BLOG_DIR = './src/content/blog';

// Mapeamento de substituições (busca exata de string)
const REPLACEMENTS = [
  // 1. Estilo do container externo
  [
    'display:flex;gap:20px;align-items:center;background:linear-gradient(135deg,#f5f5ff,#ede7f6);border:2px solid var(--c-brand);border-radius:12px;padding:20px 24px;margin:24px 0;box-shadow:0 4px 20px rgba(100,60,200,.10);',
    'display:flex;gap:16px;align-items:flex-start;background:linear-gradient(135deg,#f5f5ff,#ede7f6);border:2px solid var(--c-brand);border-radius:12px;padding:16px;margin:24px 0;box-shadow:0 4px 20px rgba(100,60,200,.10);'
  ],
  // 2. Tamanho da imagem
  [
    'width:110px;height:110px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid #eee;flex-shrink:0;',
    'width:90px;height:90px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid #eee;flex-shrink:0;'
  ],
  // 3. Inner div: adiciona min-width:0
  [
    '<div style="flex:1;">',
    '<div style="flex:1;min-width:0;">'
  ],
  // 4. Font-size do título do produto
  [
    'font-size:17px;font-weight:800;color:#1a1a1a;margin-bottom:14px;line-height:1.3;',
    'font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:12px;line-height:1.3;'
  ],
  // 5. Botão: estilo + texto (padrão antigo completo)
  [
    'display:inline-flex;align-items:center;gap:8px;background:var(--c-brand);color:#fff;font-weight:700;font-size:15px;padding:11px 22px;border-radius:8px;text-decoration:none;',
    'display:block;width:100%;text-align:center;background:var(--c-brand);color:#fff;font-weight:700;font-size:14px;padding:10px 16px;border-radius:8px;text-decoration:none;box-sizing:border-box;'
  ],
  // 6. Texto do botão
  [
    '🛒 Ver melhor preço',
    '🛒 Ver produto'
  ],
  // 7. Margem do título (caso venha com margin-bottom:14px isolado)
  [
    'margin-bottom:14px;line-height:1.3;',
    'margin-bottom:12px;line-height:1.3;'
  ]
];

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = readdirSync(dir);
  let total = 0;
  let fixed = 0;

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const [t, f] = walkDir(fullPath);
      total += t;
      fixed += f;
    } else if (extname(file) === '.md') {
      total++;
      if (fixFile(fullPath)) {
        fixed++;
        console.log(`  ✅ ${file}`);
      }
    }
  }

  return [total, fixed];
}

console.log('🔧 Iniciando migração de botões do card...\n');
const [total, fixed] = walkDir(BLOG_DIR);
console.log(`\n✨ Concluído: ${fixed} de ${total} arquivos atualizados.`);
console.log('\n📋 Regra aplicada:');
console.log('   Botão: display:block; width:100% (não quebra em mobile)');
console.log('   Texto: "🛒 Ver produto"');
console.log('   Imagem: 90×90px | Padding: 16px | align-items: flex-start');
