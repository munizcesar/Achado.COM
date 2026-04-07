#!/usr/bin/env node
/**
 * scripts/postbuild.js
 *
 * Executa após o build do Astro.
 * Lê o post mais recente de src/content/blog/ e notifica o canal do Telegram.
 *
 * Uso: node scripts/postbuild.js
 *
 * Variáveis de ambiente necessárias (Cloudflare Pages Secrets):
 *   TELEGRAM_TOKEN   = token do bot
 *   SITE_URL         = URL do site (ex: https://achadocerto.vip) [opcional]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const SITE_URL = process.env.SITE_URL || 'https://achadocerto.vip';
const NOTIFY_URL = `${SITE_URL}/api/notify-telegram`;

// Lê o frontmatter de um arquivo markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove aspas simples ou duplas
    value = value.replace(/^["']|["']$/g, '');
    fm[key] = value;
  }
  return fm;
}

// Encontra o post mais recente por pubDate
function getLatestPost() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  let latest = null;
  let latestDate = null;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(content);

    if (!fm.pubDate && !fm.date) continue;

    const dateStr = fm.pubDate || fm.date;
    const date = new Date(dateStr);

    if (!latestDate || date > latestDate) {
      latestDate = date;
      latest = {
        slug: file.replace(/\.md$/, ''),
        title: fm.title || fm.name || file.replace(/\.md$/, ''),
        description: fm.description || fm.excerpt || '',
        category: fm.category || fm.categories || '',
        image: fm.image || fm.heroImage || fm.thumbnail || '',
        pubDate: dateStr,
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

  // Verifica se o post é recente (publicado nas últimas 24h)
  const postDate = new Date(post.pubDate);
  const now = new Date();
  const diffHours = (now - postDate) / (1000 * 60 * 60);

  if (diffHours > 24) {
    console.log(`⏱️  Post tem ${Math.round(diffHours)}h. Pulando notificação (só notifica posts das últimas 24h).`);
    process.exit(0);
  }

  console.log(`🚀 Enviando notificação para o Telegram...`);

  try {
    const response = await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: post.title,
        slug: post.slug,
        description: post.description,
        category: post.category,
        image: post.image,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Notificação enviada com sucesso! Message ID: ${result.message_id}`);
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
