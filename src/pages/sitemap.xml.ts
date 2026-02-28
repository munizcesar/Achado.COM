import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const base = 'https://achadocerto.vip';

  const staticPages = [
    { url: base, priority: '1.0', changefreq: 'daily' },
    { url: `${base}/blog`, priority: '0.9', changefreq: 'daily' },
    { url: `${base}/sobre`, priority: '0.6', changefreq: 'monthly' },
    { url: `${base}/politica`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/termos`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/categorias/tech`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/categorias/saude`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/categorias/casa`, priority: '0.7', changefreq: 'weekly' },
    { url: `${base}/categorias/esportes`, priority: '0.7', changefreq: 'weekly' },
    { url: `${base}/categorias/dicas`, priority: '0.7', changefreq: 'weekly' },
    { url: `${base}/categorias/beleza`, priority: '0.7', changefreq: 'weekly' },
  ];

  const postPages = posts.map(post => ({
    url: `${base}/blog/${post.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: post.data.date?.toISOString().split('T')[0] ?? '',
  }));

  const allPages = [...staticPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${p.lastmod ? `
    <lastmod>${p.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
