/**
 * Cloudflare Pages Function
 * POST /api/notify-telegram
 *
 * Recebe dados de um novo post e envia notificação no canal do Telegram.
 *
 * Secret necessário no Cloudflare Pages:
 *   TELEGRAM_TOKEN = token do bot
 *
 * Canal: AchadoCerto VIP (-1003821647331)
 */

const CHAT_ID = '-1003821647331';
const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function onRequestPost(context) {
  const { request, env } = context;

  const botToken = env.TELEGRAM_TOKEN;
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_TOKEN não configurado' }), {
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

  const postUrl = `https://achadocerto.vip/blog/${slug}`;
  const emoji = getCategoryEmoji(category);

  const message = [
    `${emoji} *Novo post publicado\!*`,
    ``,
    `📌 *${escapeMarkdown(title)}*`,
    description ? escapeMarkdown(description) : '',
    ``,
    category ? `🏷 Categoria: ${escapeMarkdown(category)}` : '',
    ``,
    `🔗 [Ver review completo](${postUrl})`,
  ].filter(Boolean).join('\n');

  try {
    let telegramResponse;

    if (image) {
      telegramResponse = await fetch(`${TELEGRAM_API}${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          photo: image,
          caption: message,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Ver Review Completo', url: postUrl },
            ]],
          },
        }),
      });
    } else {
      telegramResponse = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: false,
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Ver Review Completo', url: postUrl },
            ]],
          },
        }),
      });
    }

    const result = await telegramResponse.json();

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

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}
