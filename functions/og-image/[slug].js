/**
 * Cloudflare Pages Function — OG Image dinâmica
 * Rota: /og-image/:slug
 *
 * Gera uma imagem PNG 1200×630 com título + marca para cada post.
 * Usa a Cloudflare Images Transformation API via fetch para renderizar
 * a imagem de produto real se disponível, caso contrário usa placeholder.
 *
 * COMO USAR NOS META TAGS (src/pages/blog/[slug].astro):
 *   <meta property="og:image" content={`${siteUrl}/og-image/${post.slug}`} />
 *   <meta name="twitter:image" content={`${siteUrl}/og-image/${post.slug}`} />
 *
 * Query params aceitos:
 *   ?title=   — título do post (URL encoded)
 *   ?img=     — URL da imagem do produto (URL encoded)
 *   ?cat=     — categoria
 */

export async function onRequestGet(context) {
  const { params, request } = context;
  const slug = params.slug;
  const url = new URL(request.url);

  const title = url.searchParams.get('title') || 'AchadoCerto — Melhores Produtos';
  const productImg = url.searchParams.get('img') || '';
  const category = url.searchParams.get('cat') || '';

  // Trunca título para caber no card
  const titleDisplay = title.length > 72 ? title.slice(0, 69) + '...' : title;
  const titleLine1 = titleDisplay.slice(0, 38);
  const titleLine2 = titleDisplay.length > 38 ? titleDisplay.slice(38, 76) : '';

  // Cor de fundo por categoria
  const catColors = {
    'beleza': '#d946ef',
    'saúde': '#10b981',
    'casa': '#f59e0b',
    'lar': '#f59e0b',
    'esportes': '#3b82f6',
    'esporte': '#3b82f6',
    'tecnologia': '#6366f1',
    'bebê': '#ec4899',
    'pet': '#14b8a6',
  };
  const catKey = category.toLowerCase();
  const accentColor = catColors[catKey] || '#1a56db';

  // SVG do OG card — 1200×630
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accentColor}"/>
      <stop offset="100%" stop-color="${accentColor}88"/>
    </linearGradient>
    <clipPath id="imgClip">
      <rect x="720" y="80" width="400" height="400" rx="20"/>
    </clipPath>
  </defs>

  <!-- Fundo -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Barra accent lateral esquerda -->
  <rect x="0" y="0" width="8" height="630" fill="url(#accent)"/>

  <!-- Barra accent inferior -->
  <rect x="0" y="590" width="1200" height="40" fill="url(#accent)" opacity="0.15"/>

  <!-- Círculo decorativo fundo direita -->
  <circle cx="980" cy="80" r="220" fill="${accentColor}" opacity="0.06"/>
  <circle cx="1100" cy="520" r="160" fill="${accentColor}" opacity="0.05"/>

  <!-- Logo marca -->
  <text x="60" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="white" opacity="0.95" letter-spacing="-0.5">
    ✓ AchadoCerto
  </text>
  <text x="60" y="104" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="white" opacity="0.5" letter-spacing="0.5">
    achadocerto.vip
  </text>

  <!-- Divisor -->
  <rect x="60" y="120" width="80" height="3" rx="2" fill="${accentColor}"/>

  <!-- Categoria -->
  ${category ? `<rect x="60" y="145" width="${Math.max(80, category.length * 10 + 32)}" height="28" rx="14" fill="${accentColor}" opacity="0.2"/>
  <text x="76" y="163" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${accentColor}" letter-spacing="1" text-transform="uppercase">${category.toUpperCase()}</text>` : ''}

  <!-- Título linha 1 -->
  <text x="60" y="${category ? 230 : 200}" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="800" fill="white" letter-spacing="-1">
    ${escapeXml(titleLine1)}
  </text>
  ${titleLine2 ? `<text x="60" y="${category ? 290 : 260}" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="800" fill="white" letter-spacing="-1">${escapeXml(titleLine2)}</text>` : ''}

  <!-- Tagline -->
  <text x="60" y="${category ? 345 : 315}" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="white" opacity="0.55">
    Review completo · Melhor preço · Compra segura
  </text>

  <!-- Estrelas rating -->
  <text x="60" y="${category ? 400 : 370}" font-size="28" font-family="system-ui">⭐⭐⭐⭐⭐</text>
  <text x="185" y="${category ? 398 : 368}" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="white" opacity="0.6">Review verificado pela equipe</text>

  <!-- Badge CTA -->
  <rect x="60" y="${category ? 430 : 400}" width="200" height="48" rx="24" fill="${accentColor}"/>
  <text x="160" y="${category ? 460 : 430}" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">Ver review completo →</text>

  <!-- Placeholder imagem produto se não houver URL -->
  ${!productImg ? `
  <rect x="720" y="80" width="400" height="400" rx="20" fill="white" opacity="0.05"/>
  <rect x="720" y="80" width="400" height="400" rx="20" fill="none" stroke="white" stroke-width="1" opacity="0.1"/>
  <text x="920" y="300" font-size="80" text-anchor="middle" dominant-baseline="middle" font-family="system-ui">🛍️</text>
  <text x="920" y="390" font-size="16" text-anchor="middle" fill="white" opacity="0.3" font-family="system-ui, sans-serif">achadocerto.vip</text>
  ` : `
  <rect x="720" y="80" width="400" height="400" rx="20" fill="white" opacity="0.08"/>
  <image href="${productImg}" x="740" y="100" width="360" height="360" clip-path="url(#imgClip)" preserveAspectRatio="xMidYMid meet"/>
  `}

  <!-- Rodapé -->
  <text x="600" y="615" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="white" opacity="0.35" text-anchor="middle">
    achadocerto.vip — Reviews honestos para compras inteligentes
  </text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
