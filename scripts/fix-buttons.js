/**
 * fix-buttons.js
 * Migração em massa: padroniza botões + remove card duplicado do topo
 *
 * Regras aplicadas:
 * - Card do topo removido (mantido só o card de fechamento no final)
 * - Botão: display:block; width:100%; text-align:center
 * - Texto: "🛒 Ver produto"
 * - Font-size: 14px | Padding: 10px 16px
 * - Container: align-items:flex-start; gap:16px; padding:16px
 * - Imagem: 90x90px | Inner div: flex:1;min-width:0
 *
 * Uso: node scripts/fix-buttons.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const BLOG_DIR = './src/content/blog';

// Substituições simples de string
const REPLACEMENTS = [
  [
    'display:flex;gap:20px;align-items:center;background:linear-gradient(135deg,#f5f5ff,#ede7f6);border:2px solid var(--c-brand);border-radius:12px;padding:20px 24px;margin:24px 0;box-shadow:0 4px 20px rgba(100,60,200,.10);',
    'display:flex;gap:16px;align-items:flex-start;background:linear-gradient(135deg,#f5f5ff,#ede7f6);border:2px solid var(--c-brand);border-radius:12px;padding:16px;margin:24px 0;box-shadow:0 4px 20px rgba(100,60,200,.10);'
  ],
  [
    'width:110px;height:110px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid #eee;flex-shrink:0;',
    'width:90px;height:90px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid #eee;flex-shrink:0;'
  ],
  [
    '<div style="flex:1;">',
    '<div style="flex:1;min-width:0;">'
  ],
  [
    'font-size:17px;font-weight:800;color:#1a1a1a;margin-bottom:14px;line-height:1.3;',
    'font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:12px;line-height:1.3;'
  ],
  [
    'display:inline-flex;align-items:center;gap:8px;background:var(--c-brand);color:#fff;font-weight:700;font-size:15px;padding:11px 22px;border-radius:8px;text-decoration:none;',
    'display:block;width:100%;text-align:center;background:var(--c-brand);color:#fff;font-weight:700;font-size:14px;padding:10px 16px;border-radius:8px;text-decoration:none;box-sizing:border-box;'
  ],
  [
    '🛒 Ver melhor preço',
    '🛒 Ver produto'
  ],
  [
    'margin-bottom:14px;line-height:1.3;',
    'margin-bottom:12px;line-height:1.3;'
  ]
];

/**
 * Remove o primeiro bloco <div ...card...> do arquivo.
 * Detecta pelo marcador do gradient do card de produto.
 * Mantém o segundo card (fechamento).
 */
function removeFirstCard(content) {
  const CARD_START = '<div style="display:flex;gap:';
  const CARD_END = '</div>\n</div>';

  // Verifica se há mais de uma ocorrência do card
  const firstIdx = content.indexOf(CARD_START);
  if (firstIdx === -1) return content; // nenhum card

  const secondIdx = content.indexOf(CARD_START, firstIdx + 1);
  if (secondIdx === -1) return content; // só um card, não remove

  // Encontra o fim do primeiro card
  const endIdx = content.indexOf(CARD_END, firstIdx);
  if (endIdx === -1) return content;

  const cardBlock = content.slice(firstIdx, endIdx + CARD_END.length);

  // Remove o card + linha em branco antes/depois
  return content.replace('\n' + cardBlock + '\n', '\n');
}

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Remove card duplicado do topo
  const noCard = removeFirstCard(content);
  if (noCard !== content) {
    content = noCard;
    changed = true;
  }

  // 2. Aplica substituições de estilo
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

console.log('🔧 Iniciando migração dos cards...\n');
const [total, fixed] = walkDir(BLOG_DIR);
console.log(`\n✨ Concluído: ${fixed} de ${total} arquivos atualizados.`);
console.log('\n📋 Regras aplicadas:');
console.log('   Card do topo removido (mantém só o de fechamento)');
console.log('   Botão: display:block; width:100%');
console.log('   Texto: "🛒 Ver produto"');
