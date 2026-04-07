/**
 * Cloudflare Pages Function
 * POST /api/notify-telegram
 * 
 * Recebe dados de um novo post e envia notificação no Telegram.
 * Usar em webhook do CMS (Decap/Netlify CMS) ou no build hook.
 * 
 * Secret necessário no Cloudflare Pages:
 *   TELEGRAM_TOKEN = token do bot
 * 
 * Chat ID fixo do canal: 6598356200
 */

const CHAT_ID = '6598356200';
const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Verifica se o token está configurado
  const botToken = env.TELEGRAM_TOKEN;
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_TOKEN não configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Lê o body da requisição
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

  // Monta a mensagem formatada
  const message = [
    `${emoji} *Novo post publicado!*`,
    ``,
    `📌 *${escapeMarkdown(title)}*`,
    description ? `${escapeMarkdown(description)}` : '',
    ``,
    category ? `🏷️ Categoria: ${escapeMarkdown(category)}` : '',
    ``,
    `🔗 [Ver review completo](${postUrl})`,
  ].filter(Boolean).join('\n');

  // Envia para o Telegram
  try {
    let telegramResponse;

    if (image) {
      // Envia com foto se tiver imagem do produto
      telegramResponse = await fetch(`${TELEGRAM_API}${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          photo: image,
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Ver Review', url: postUrl },
            ]],
          },
        }),
      });
    } else {
      // Envia só texto
      telegramResponse = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Ver Review', url: postUrl },
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

// Retorna emoji por categoria
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

// Escapa caracteres especiais do Markdown do Telegram
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
