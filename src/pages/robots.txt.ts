export async function GET() {
  const content = `User-agent: *
Allow: /

Disallow: /backend/
Disallow: /debug-*
Disallow: /teste-*
Disallow: /validador-*
Disallow: /relatorio-*

Sitemap: https://achadocerto.vip/sitemap.xml
`;
  return new Response(content, { headers: { 'Content-Type': 'text/plain' } });
}
