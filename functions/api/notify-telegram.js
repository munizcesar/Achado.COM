/**
 * Cloudflare Pages Function
 * POST /api/notify-telegram
 *
 * Recebe dados de um novo post e envia notificação no canal do Telegram.
 *
 * Secrets no Cloudflare Pages:
 *   TELEGRAM_TOKEN ou telegram_token = token do bot
 *   TELEGRAM_CHAT_ID (opcional)       = ID do canal/grupo
 *   SITE_URL (opcional)               = URL base do site
 *
 * Canal: AchadoCerto VIP (-1003821647331)
 */

const DEFAULT_CHAT_ID = '-1003821647331';
const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function onRequestPost(context) {
  const { request, env } = context;

  const botToken = env.TELEGRAM_TOKEN || env.telegram_token;
  const chatId = env.TELEGRAM_CHAT_ID || env.telegram_chat_id || DEFAULT_CHAT_ID;
  const siteUrl = env.SITE_URL || 'https://achadocerto.vip';

  if (!botToken) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_TOKEN/telegram_token não configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { title, slug, description, category, image } = body;

  if (!title || !slug) {
    return new Response(JSON.stringify({ error: 'title e slug são obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const postUrl = `${siteUrl.replace(/\/$/, '')}/blog/${slug}`;
  const photoUrl = normalizeImageUrl(image, siteUrl);
  const emoji = getCategoryEmoji(category);

  const message = buildHtmlMessage({ emoji, title, description, category, postUrl });

  try {
    let telegramResponse;
    let result;

    if (photoUrl) {
      telegramResponse = await fetch(`${TELEGRAM_API}${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Ver Review Completo', url: postUrl },
            ]],
          },
        }),
      });

      result = await telegramResponse.json();
      if (!result.ok) {
        // Fallback para texto quando a foto falhar (URL ruim, limite de caption etc.)
        console.warn('sendPhoto falhou, tentando sendMessage:', result);
        telegramResponse = null;
      }
    }

    if (!telegramResponse || !result?.ok) {
      telegramResponse = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Ver Review Completo', url: postUrl },
            ]],
          },
        }),
      });

      result = await telegramResponse.json();
    }

    if (!result.ok) {
      console.error('Telegram API error:', result);
      return new Response(JSON.stringify({ error: 'Erro ao enviar para o Telegram', detail: result }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message_id: result.result?.message_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Falha na requisição', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function getCategoryEmoji(category) {
  if (!category) return '🛍️';
  const cat = category.toLowerCase();
  if (cat.includes('beleza') || cat.includes('beauty')) return '💄';
  if (cat.includes('saúde') || cat.includes('saude') || cat.includes('health')) return '💊';
  if (cat.includes('casa') || cat.includes('lar') || cat.includes('home')) return '🏠';
  if (cat.includes('esporte') || cat.includes('fitness')) return '🏋️';
  if (cat.includes('tech') || cat.includes('eletrônico') || cat.includes('eletronico')) return '💻';
  if (cat.includes('pet') || cat.includes('animal')) return '🐾';
  if (cat.includes('infantil') || cat.includes('criança') || cat.includes('bebê')) return '👶';
  return '🛍️';
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlMessage({ emoji, title, description, category, postUrl }) {
  const lines = [
    `${emoji} <b>Novo post publicado!</b>`,
    '',
    `📌 <b>${escapeHtml(title)}</b>`,
  ];

  if (description) lines.push(escapeHtml(description));
  if (category) lines.push('', `🏷 Categoria: ${escapeHtml(category)}`);

  lines.push('', `🔗 <a href="${postUrl}">Ver review completo</a>`);
  return lines.join('\n');
}

function normalizeImageUrl(image, siteUrl) {
  if (!image || typeof image !== 'string') return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (!image.startsWith('/')) return null;
  return `${siteUrl.replace(/\/$/, '')}${image}`;
}
