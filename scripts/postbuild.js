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
const SITE_URL   = process.env.TELEGRAM_NOTIFY_SITE_URL || process.env.SITE_URL || 'https://achadocerto.pages.dev';
const NOTIFY_URL = `${SITE_URL}/api/notify-telegram`;
const NOTIFY_URL_FALLBACK = process.env.TELEGRAM_NOTIFY_URL || 'https://achadocerto.pages.dev/api/notify-telegram';
const CF_PAGES_URL = process.env.CF_PAGES_URL || process.env.CLOUDFLARE_PAGES_URL || '';
const MAX_AGE_HOURS = Number(process.env.TELEGRAM_NOTIFY_MAX_HOURS || 168);
const FORCE_NOTIFY = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.TELEGRAM_NOTIFY_FORCE || '').toLowerCase()
);

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
    return;
  }

  console.log(`📌 Post mais recente: "${post.title}" (${post.pubDate})`);

  // Por padrão, notifica posts até 7 dias (168h). Ajustável por env.
  const diffHours = (Date.now() - new Date(post.pubDate).getTime()) / 36e5;
  const maxAgeHours = Number.isFinite(MAX_AGE_HOURS) && MAX_AGE_HOURS > 0 ? MAX_AGE_HOURS : 168;

  if (!FORCE_NOTIFY && diffHours > maxAgeHours) {
    console.log(`⏱️  Post tem ${Math.round(diffHours)}h — pulando notificação (limite: ${maxAgeHours}h).`);
    return;
  }

  if (FORCE_NOTIFY) {
    console.log('⚙️  TELEGRAM_NOTIFY_FORCE ativo — enviando mesmo fora da janela de idade.');
  }

  console.log('🚀 Enviando notificação para o Telegram...');

  const cfPagesNotifyUrl = CF_PAGES_URL
    ? `${CF_PAGES_URL.startsWith('http') ? CF_PAGES_URL : `https://${CF_PAGES_URL}`}`.replace(/\/$/, '') + '/api/notify-telegram'
    : '';

  const notifyUrls = [...new Set([NOTIFY_URL, NOTIFY_URL_FALLBACK, cfPagesNotifyUrl].filter(Boolean))];

  for (const url of notifyUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });

      if (res.status === 404) {
        console.warn(`⚠️  Endpoint não encontrado em ${url} (404). Tentando próximo...`);
        continue;
      }

      // Verifica o status da resposta
      if (!res.ok) {
        const text = await res.text();
        console.warn(`⚠️  API retornou ${res.status} em ${url}: ${text.slice(0, 100)}`);
        continue;
      }

      // Tenta fazer parse de JSON, com fallback seguro
      let result;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        console.warn(`⚠️  Resposta não é JSON (${contentType}) em ${url}: ${text.slice(0, 100)}`);
        continue;
      }

      if (result.success) {
        console.log(`✅ Notificação enviada! Message ID: ${result.message_id}`);
        return;
      }

      console.warn(`⚠️  Erro ao enviar em ${url}:`, result.error);
    } catch (err) {
      console.warn(`⚠️  Falha na requisição em ${url}:`, err.message);
    }
  }

  console.log('💡 Não foi possível enviar automaticamente. Você pode reenviar manualmente depois.');
  return; // Permite que o build passe mesmo se a notificação falhar
}

main().catch((err) => {
  console.warn('⚠️  Erro inesperado no postbuild:', err.message);
});
