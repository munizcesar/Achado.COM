/**
 * src/pages/api/notify-telegram.js
 *
 * Recebe POST do scripts/postbuild.js e envia mensagem ao canal do Telegram.
 *
 * Variáveis de ambiente (Cloudflare Pages Secrets):
 *   telegram_token   = token do bot (minúsculo, como está no Cloudflare)
 *   TELEGRAM_CHAT_ID = ID do canal
 *   SITE_URL         = URL do site (ex: https://achadocerto.vip)
 */

export const prerender = false;

export async function POST({ request }) {
  try {
    // Aceita tanto minúsculo quanto maiúsculo
    const token   = import.meta.env.telegram_token || import.meta.env.TELEGRAM_TOKEN;
    const chatId  = import.meta.env.TELEGRAM_CHAT_ID;
    const siteUrl = import.meta.env.SITE_URL || 'https://achadocerto.vip';

    if (!token || !chatId) {
      return Response.json(
        { success: false, error: 'telegram_token ou TELEGRAM_CHAT_ID não configurados.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, slug, description, category, image } = body;

    if (!title || !slug) {
      return Response.json(
        { success: false, error: 'title e slug são obrigatórios.' },
        { status: 400 }
      );
    }

    const postUrl       = `${siteUrl}/blog/${slug}`;
    const categoryLabel = category    ? `\n🏷 *Categoria:* ${category}` : '';
    const descText      = description ? `\n\n${description}`            : '';

    const text = [
      `🔥 *Novo post no Achado Certo VIP!*`,
      ``,
      `*${title}*${descText}`,
      `${categoryLabel}`,
      ``,
      `👉 [Leia agora](${postUrl})`,
    ].join('\n');

    // Se tiver imagem, envia como foto com caption
    if (image) {
      const photoUrl     = image.startsWith('http') ? image : `${siteUrl}${image}`;
      const sendPhotoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;

      const photoRes    = await fetch(sendPhotoUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    chatId,
          photo:      photoUrl,
          caption:    text,
          parse_mode: 'Markdown',
        }),
      });
      const photoResult = await photoRes.json();

      if (photoResult.ok) {
        return Response.json({ success: true, message_id: photoResult.result.message_id });
      }
      // Se falhar com foto, tenta enviar só o texto abaixo
    }

    // Envio somente texto
    const res    = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:    chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });
    const result = await res.json();

    if (result.ok) {
      return Response.json({ success: true, message_id: result.result.message_id });
    } else {
      return Response.json(
        { success: false, error: result.description },
        { status: 502 }
      );
    }

  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
