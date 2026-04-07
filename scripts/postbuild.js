#!/usr/bin/env node
/**
 * scripts/postbuild.js
 * Executa após o build do Astro e notifica o Telegram com o post mais recente.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR   = path.join(__dirname, '..', 'src', 'content', 'blog');
const SITE_URL   = process.env.SITE_URL   || 'https://achadocerto.vip';
const NOTIFY_URL = `${SITE_URL}/api/notify-telegram`;

/**
 * Parser de frontmatter robusto:
 * suporta valores com e sem aspas, incluindo datas YAML nativas (2026-02-08)
 */
function parseFrontmatter(content) {
  const match = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key   = line.slice(0, colonIdx).trim();
    let   value = line.slice(colonIdx + 1).trim();
    // Remove aspas simples ou duplas envolvendo o valor
    value = value.replace(/^(["'])(.*?)\1$/, '$2');
    if (key) fm[key] = value;
  }
  return fm;
}

function getLatestPost() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  let latest     = null;
  let latestDate = null;

  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const fm      = parseFrontmatter(content);

    // Aceita tanto "date" quanto "pubDate"
    const dateStr = (fm.pubDate || fm.date || '').trim();
    if (!dateStr) continue;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue; // data inválida, pula

    if (!latestDate || date > latestDate) {
      latestDate = date;
      latest = {
        slug:        file.replace(/\.md$/, ''),
        title:       fm.title       || file.replace(/\.md$/, ''),
        description: fm.description || '',
        category:    fm.category    || '',
        image:       fm.image       || fm.heroImage || fm.thumbnail || '',
        pubDate:     dateStr,
      };
    }
  }

  return latest;
}

async function main() {
  console.log('🔍 Verificando post mais recente...');

  const post = getLatestPost();

  if (!post) {
    console.log('⚠️  Nenhum post encontrado com data válida.');
    process.exit(0);
  }

  console.log(`📌 Post mais recente: "${post.title}" (${post.pubDate})`);

  // Só notifica se o post foi publicado nas últimas 24h
  const diffHours = (Date.now() - new Date(post.pubDate).getTime()) / 36e5;
  if (diffHours > 24) {
    console.log(`⏱️  Post tem ${Math.round(diffHours)}h — pulando notificação (limite: 24h).`);
    process.exit(0);
  }

  console.log('🚀 Enviando notificação para o Telegram...');

  try {
    const res    = await fetch(NOTIFY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(post),
    });
    const result = await res.json();

    if (result.success) {
      console.log(`✅ Notificação enviada! Message ID: ${result.message_id}`);
    } else {
      console.error('❌ Erro ao enviar:', result);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Falha na requisição:', err.message);
    process.exit(1);
  }
}

main();
