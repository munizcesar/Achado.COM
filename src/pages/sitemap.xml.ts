import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const base = 'https://achadocerto.vip';
  const now = new Date().toISOString().split('T')[0];

  // Categorias: apenas as que têm posts publicados são incluídas no sitemap
  // Evita thin content penalty do Google em páginas de categoria vazias
  const categoryCounts: Record<string, number> = {};
  for (const post of posts) {
    const cat = (post.data.category || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const mapped = cat === 'lar' ? 'casa' : cat === 'esporte' ? 'esportes' : cat;
    categoryCounts[mapped] = (categoryCounts[mapped] || 0) + 1;
  }

  const allCategories = ['beleza', 'saude', 'casa', 'tech', 'esportes', 'automotivo', 'dicas'];
  const activeCategories = allCategories.filter(c => (categoryCounts[c] || 0) > 0);

  const pilarSlugs = ['beleza', 'saude', 'casa'];

  const categoryPages = activeCategories.map(slug => ({
    url: `${base}/categorias/${slug}`,
    priority: pilarSlugs.includes(slug) ? '0.9' : '0.7',
    changefreq: 'weekly',
    lastmod: now,
  }));

  const staticPages = [
    { url: base,           priority: '1.0', changefreq: 'daily',   lastmod: now },
    { url: `${base}/blog`, priority: '0.9', changefreq: 'daily',   lastmod: now },
    ...categoryPages,
    { url: `${base}/faq`,      priority: '0.6', changefreq: 'monthly', lastmod: now },
    { url: `${base}/sobre`,    priority: '0.5', changefreq: 'monthly' },
    { url: `${base}/politica`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/termos`,   priority: '0.3', changefreq: 'yearly' },
  ];

  const postPages = posts.map(post => ({
    url: `${base}/blog/${post.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: post.data.date?.toISOString().split('T')[0] ?? now,
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
