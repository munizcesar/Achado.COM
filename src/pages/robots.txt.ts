export async function GET() {
  const content = `User-agent: *
Allow: /

Disallow: /api/

Crawl-delay: 2

Sitemap: https://achadocerto.vip/sitemap.xml
`;
  return new Response(content, { headers: { 'Content-Type': 'text/plain' } });
}
