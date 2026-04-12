/**
 * Cloudflare Pages Function
 * GET /api/health-telegram
 *
 * Uso:
 * - /api/health-telegram
 * - /api/health-telegram?checkTelegram=1
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const token = env.TELEGRAM_TOKEN || env.telegram_token || '';
  const chatId = env.TELEGRAM_CHAT_ID || env.telegram_chat_id || '';
  const siteUrl = env.SITE_URL || 'https://achadocerto.vip';
  const checkTelegram = ['1', 'true', 'yes', 'on'].includes((url.searchParams.get('checkTelegram') || '').toLowerCase());

  const diagnostics = {
    ok: true,
    service: 'health-telegram',
    timestamp: new Date().toISOString(),
    env: {
      hasTelegramToken: Boolean(token),
      hasTelegramChatId: Boolean(chatId),
      siteUrl,
    },
  };

  if (!token || !chatId) {
    diagnostics.ok = false;
    diagnostics.error = 'Secrets ausentes: configure TELEGRAM_TOKEN (ou telegram_token) e TELEGRAM_CHAT_ID.';
    return json(diagnostics, 500);
  }

  if (!checkTelegram) {
    diagnostics.note = 'Health local OK. Para validar o bot na API do Telegram, use ?checkTelegram=1';
    return json(diagnostics, 200);
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/getMe`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    diagnostics.telegramApi = {
      status: response.status,
      ok: Boolean(result?.ok),
      botUsername: result?.result?.username || null,
      botId: result?.result?.id || null,
      description: result?.description || null,
    };

    if (!result?.ok) {
      diagnostics.ok = false;
      diagnostics.error = 'Falha ao validar token na API do Telegram.';
      return json(diagnostics, 502);
    }

    diagnostics.note = 'Token validado com sucesso na API do Telegram.';
    return json(diagnostics, 200);
  } catch (error) {
    diagnostics.ok = false;
    diagnostics.error = `Falha de rede ao consultar Telegram: ${error.message}`;
    return json(diagnostics, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
