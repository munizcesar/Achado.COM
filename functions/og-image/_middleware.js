/**
 * Middleware para a rota /og-image/*
 * Adiciona headers de cache e CORS corretos para crawlers de redes sociais.
 */
export async function onRequest(context) {
  const response = await context.next();

  // Clone para poder modificar headers
  const newResponse = new Response(response.body, response);

  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');

  return newResponse;
}
