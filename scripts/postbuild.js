#!/usr/bin/env node
/**
 * scripts/postbuild.js
 * Executa após o build do Astro — loga o post mais recente.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR  = path.join(__dirname, '..', 'src', 'content', 'blog');

function parseFrontmatter(content) {
  const match = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key   = line.slice(0, colonIdx).trim();
    let   value = line.slice(colonIdx + 1).trim();
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
    const dateStr = (fm.pubDate || fm.date || '').trim();
    if (!dateStr) continue;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    if (!latestDate || date > latestDate) {
      latestDate = date;
      latest = {
        slug:    file.replace(/\.md$/, ''),
        title:   fm.title || file.replace(/\.md$/, ''),
        pubDate: dateStr,
      };
    }
  }
  return latest;
}

function main() {
  const post = getLatestPost();
  if (!post) {
    console.log('⚠️  Nenhum post encontrado com data válida.');
    return;
  }
  console.log(`✅ Post mais recente: "${post.title}" (${post.pubDate})`);
  console.log('Finished');
}

main();
