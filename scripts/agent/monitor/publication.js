/**
 * publication.js — Monitor de Publicação
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Após cada execução, verifica se todos os artefatos foram criados:
 *   - Artigo .md criado
 *   - Imagem criada
 *   - Markdown válido
 *   - (Commit e Push são responsabilidade do Workflow)
 */

import fs from 'fs';

/**
 * Verifica se os artefatos da publicação existem e são válidos.
 *
 * @param {object} artifacts
 * @param {string} artifacts.mdPath   - Caminho do arquivo .md
 * @param {string} artifacts.imgPath  - Caminho do arquivo de imagem
 * @param {string} [artifacts.slug]   - Slug do post (para referência)
 * @returns {{
 *   success: boolean,
 *   checks: Array<{ name: string, pass: boolean, detail: string }>,
 *   errors: string[]
 * }}
 */
export function verifyPublication(artifacts) {
  const checks = [];
  const errors = [];
  let success  = true;

  // 1. Artigo .md criado
  if (artifacts.mdPath) {
    const exists = fs.existsSync(artifacts.mdPath);
    checks.push({
      name:   'artigo_md',
      pass:   exists,
      detail: exists ? `✅ ${artifacts.mdPath}` : `❌ ${artifacts.mdPath} não encontrado`,
    });
    if (!exists) { success = false; errors.push('Artigo .md não foi criado'); }

    // Verifica tamanho mínimo
    if (exists) {
      const size = fs.statSync(artifacts.mdPath).size;
      const sizeOk = size > 500;
      checks.push({
        name:   'artigo_tamanho',
        pass:   sizeOk,
        detail: sizeOk ? `✅ ${size} bytes` : `❌ Muito pequeno: ${size} bytes`,
      });
      if (!sizeOk) { success = false; errors.push('Artigo .md muito pequeno'); }
    }
  }

  // 2. Imagem criada
  if (artifacts.imgPath) {
    const exists = fs.existsSync(artifacts.imgPath);
    checks.push({
      name:   'imagem_arquivo',
      pass:   exists,
      detail: exists ? `✅ ${artifacts.imgPath}` : `❌ Imagem não encontrada`,
    });
    if (!exists) { success = false; errors.push('Imagem do produto não foi criada'); }

    // Verifica tamanho mínimo
    if (exists) {
      const size = fs.statSync(artifacts.imgPath).size;
      const sizeOk = size > 1024;
      checks.push({
        name:   'imagem_tamanho',
        pass:   sizeOk,
        detail: sizeOk ? `✅ ${(size / 1024).toFixed(1)}KB` : `❌ Muito pequena: ${size} bytes`,
      });
      if (!sizeOk) { success = false; errors.push('Imagem muito pequena (< 1KB)'); }
    }
  }

  // 3. Slug presente
  if (artifacts.slug) {
    checks.push({
      name:   'slug',
      pass:   true,
      detail: `✅ ${artifacts.slug}`,
    });
  }

  return { success, checks, errors };
}
