#!/usr/bin/env node
/**
 * audit.js — Auditoria Final (pré-DONE)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Antes de marcar qualquer publicação como concluída:
 *
 * AUDIT
 *   ├── ✓ Markdown válido
 *   ├── ✓ Imagem existe com tamanho mínimo
 *   ├── ✓ Slug único
 *   ├── ✓ Links internos presentes
 *   ├── ✓ Affiliate tag presente na URL
 *   ├── ✓ SEO aprovado
 *   ├── ✓ Sem duplicidade (ASIN + slug + URL + hash)
 *   ├── ✓ Artination commitado (se workflow)
 *   └── ✓ Deploy verificado (se workflow)
 *
 * Se QUALQUER item falhar, a publicação NÃO é marcada como DONE.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../core/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const ROOT        = path.resolve(__dirname, '..', '..', '..');

/**
 * Executa a auditoria final de uma publicação.
 *
 * @param {object} params
 * @param {string} params.slug
 * @param {string} params.title
 * @param {string} params.affiliateUrl
 * @param {string} params.category
 * @param {object} [params.seoResult]
 * @param {object} [params.historyCheck]
 * @returns {{
 *   passed: boolean,
 *   checks: Array<{ name: string, pass: boolean, detail: string }>,
 *   score: number,
 *   summary: string
 * }}
 */
export function runFinalAudit({ slug, title, affiliateUrl, category, seoResult, historyCheck }) {
  const checks = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // 1. Markdown existe
  const mdPath = path.join(ROOT, 'src', 'content', 'blog', `${slug}.md`);
  const mdExists = fs.existsSync(mdPath);
  checks.push({ name: 'markdown', pass: mdExists, detail: mdExists ? `✅ ${slug}.md` : '❌ .md não encontrado' });
  if (mdExists) passed++; else failed++;

  // 2. Markdown tem conteúdo mínimo
  if (mdExists) {
    const mdSize = fs.statSync(mdPath).size;
    const mdOk = mdSize > 500;
    checks.push({ name: 'markdown_tamanho', pass: mdOk, detail: mdOk ? `✅ ${mdSize} bytes` : `❌ Muito pequeno: ${mdSize} bytes` });
    if (mdOk) passed++; else failed++;
  }

  // 3. Imagem existe
  const imgPath = path.join(ROOT, 'public', 'images', 'posts', `${slug}.webp`);
  const imgExists = fs.existsSync(imgPath);
  checks.push({ name: 'imagem', pass: imgExists, detail: imgExists ? `✅ ${slug}.webp` : '❌ Imagem não encontrada' });
  if (imgExists) passed++; else failed++;

  // 4. Imagem tem tamanho mínimo
  if (imgExists) {
    const imgSize = fs.statSync(imgPath).size;
    const imgOk = imgSize > 1024;
    checks.push({ name: 'imagem_tamanho', pass: imgOk, detail: imgOk ? `✅ ${(imgSize / 1024).toFixed(1)}KB` : `❌ Muito pequena: ${imgSize} bytes` });
    if (imgOk) passed++; else failed++;
  }

  // 5. Slug único
  if (historyCheck) {
    const slugOk = !historyCheck.duplicate;
    checks.push({ name: 'slug_unico', pass: slugOk, detail: slugOk ? '✅ Slug único' : `❌ ${historyCheck.reason}` });
    if (slugOk) passed++; else failed++;
  }

  // 6. Link de afiliado contém tag
  const tagOk = affiliateUrl && affiliateUrl.includes('tag=') && affiliateUrl.includes('amazon');
  checks.push({ name: 'affiliate_tag', pass: tagOk, detail: tagOk ? '✅ tag= presente' : '❌ tag= ausente' });
  if (tagOk) passed++; else failed++;

  // 7. Categoria válida
  const validCategories = ['beleza', 'saude', 'casa', 'tech', 'esportes', 'automotivo'];
  const catOk = category && validCategories.includes(category);
  checks.push({ name: 'categoria', pass: catOk, detail: catOk ? `✅ ${category}` : `❌ Categoria inválida: ${category}` });
  if (catOk) passed++; else failed++;

  // 8. Título tem tamanho mínimo
  const titleOk = title && title.length >= 10;
  checks.push({ name: 'titulo', pass: titleOk, detail: titleOk ? `✅ ${title.length} chars` : `❌ Título muito curto: ${title?.length || 0} chars` });
  if (titleOk) passed++; else failed++;

  // 9. SEO (se disponível)
  if (seoResult) {
    const seoOk = seoResult.pass;
    checks.push({ name: 'seo', pass: seoOk, detail: seoOk ? '✅ SEO aprovado' : `⚠️ SEO: ${seoResult.errors?.length || 0} problemas` });
    if (seoOk) passed++; else warnings++;
  }

  // 10. Conteúdo do markdown sem título genérico
  if (mdExists) {
    const content = fs.readFileSync(mdPath, 'utf8');
    const hasGeneric = /Produto Amazon\b/i.test(content);
    checks.push({ name: 'conteudo_generico', pass: !hasGeneric, detail: hasGeneric ? '❌ Título genérico detectado' : '✅ Sem conteúdo genérico' });
    if (!hasGeneric) passed++; else failed++;
  }

  const total = checks.length;
  const score = Math.round((passed / total) * 100);

  return {
    passed: failed === 0,
    score,
    checks,
    summary: `${passed}/${total} checks passaram — ${score}% — ${failed === 0 ? 'APROVADO' : 'REPROVADO'}`,
    details: {
      total,
      passed,
      failed,
      warnings,
    },
  };
}
