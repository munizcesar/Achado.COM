#!/usr/bin/env node
/**
 * post-publication-validator.js — Fase 6: Validação de Artigos Publicados
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Verifica cada artigo publicado contra o site ao vivo:
 *   ✓ HTTP 200 · Slug · Canonical · OG tags · JSON-LD · Breadcrumb
 *   ✓ Imagem · ALT · Link afiliado · Sitemap · Meta description
 *   ✓ RSS feed · Página indexável · Nenhum 404
 *
 * Ambiente:
 *   SITE_URL    (default: https://achadocerto.vip)
 *   AMAZON_AFFILIATE_TAG (lê do .env)
 *
 * Uso:
 *   node scripts/agent/homologation/post-publication-validator.js --all
 *   node scripts/agent/homologation/post-publication-validator.js --limit 20
 *   node scripts/agent/homologation/post-publication-validator.js slug1 slug2
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const REPORT_DIR = path.join(ROOT, 'reports');
config({ path: path.join(ROOT, 'backend', '.env') });

const SITE = process.env.SITE_URL || 'https://achadocerto.vip';
const AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG || 'altivita-20';

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

// ── HTTP Helper ───────────────────────────────────────────────────────────

async function httpGet(urlStr, timeout = 15000, maxRedirects = 3) {
  let currentUrl = urlStr;
  for (let i = 0; i <= maxRedirects; i++) {
    const result = await httpGetSingle(currentUrl, timeout);
    if (result.status >= 300 && result.status < 400 && result.headers.location) {
      const location = result.headers.location;
      // Lida com redirect relativo
      currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
      continue;
    }
    return result;
  }
  return { status: 0, headers: {}, body: '', url: currentUrl };
}

function httpGetSingle(urlStr, timeout) {
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const parsed = new URL(urlStr);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (urlStr.startsWith('https') ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AchadoCerto-Homologation/1.0',
        'Accept': 'text/html,application/xml,application/json,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    };
    const req = lib.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data,
        url: urlStr,
      }));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ── Extractors ────────────────────────────────────────────────────────────

function extractMetaTag(html, name) {
  // Tenta property= e name= para cada nome
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  }
  return null;
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function extractJsonLd(html) {
  const scripts = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!scripts) return [];
  return scripts.map(s => {
    const m = s.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  }).filter(Boolean);
}

function extractBreadcrumb(jsonLdItems) {
  for (const item of jsonLdItems) {
    const arr = Array.isArray(item) ? item : [item];
    for (const el of arr) if (el['@type'] === 'BreadcrumbList') return el;
  }
  return null;
}

function extractImages(html) {
  const imgs = [];
  const re = /<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) imgs.push({ src: m[1], alt: m[2] });
  return imgs;
}

function extractAffiliateLinks(html) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*data-affiliate[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) links.push(m[1]);
  return links;
}

function extractAsin(url) {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

function extractTag(url) {
  const m = url.match(/[?&]tag=([^&]+)/);
  return m ? m[1] : null;
}

// ── Validador por Artigo ─────────────────────────────────────────────────

async function validateArticle(slug, expectedCategory = null) {
  const url = `${SITE}/blog/${slug}`;
  const checks = [];

  try {
    const res = await httpGet(url, 15000);
    const html = res.body;

    // 1. HTTP 200
    const statusOk = res.status === 200;
    checks.push({ name: 'HTTP 200', pass: statusOk, detail: `${res.status}` });
    if (!statusOk) return { slug, url, pass: false, checks, errors: [`HTTP ${res.status}`] };

    // 2. Slug correto
    const slugOk = html.includes(`/blog/${slug}`);
    checks.push({ name: 'Slug na URL', pass: slugOk, detail: slug });

    // 3. Canonical
    const canonical = extractCanonical(html);
    const canonicalOk = canonical && (canonical === `${SITE}/blog/${slug}/` || canonical === `${SITE}/blog/${slug}`);
    checks.push({ name: 'Canonical', pass: canonicalOk, detail: canonical || 'ausente' });

    // 4. OG tags
    const ogTitle = extractMetaTag(html, 'og:title');
    const ogDesc = extractMetaTag(html, 'og:description');
    const ogImage = extractMetaTag(html, 'og:image');
    const ogUrl = extractMetaTag(html, 'og:url');
    const ogOk = ogTitle && ogDesc && ogImage && ogUrl;
    checks.push({ name: 'Open Graph', pass: ogOk,
      detail: ogOk ? 'OK' : `Falta: ${!ogTitle ? 'title ' : ''}${!ogDesc ? 'desc ' : ''}${!ogImage ? 'image ' : ''}${!ogUrl ? 'url ' : ''}` });

    // 5. OG Image válida
    let ogImageOk = false;
    if (ogImage) {
      try {
        const imgRes = await httpGet(ogImage.startsWith('http') ? ogImage : `${SITE}${ogImage}`, 8000);
        ogImageOk = imgRes.status === 200 && (imgRes.headers['content-type'] || '').startsWith('image/');
      } catch { ogImageOk = false; }
    }
    checks.push({ name: 'OG Image', pass: ogImageOk, detail: ogImageOk ? 'carrega' : 'não carrega' });

    // 6. JSON-LD Article
    const jsonLd = extractJsonLd(html);
    const hasArticle = jsonLd.some(i => {
      const arr = Array.isArray(i) ? i : [i];
      return arr.some(e => e['@type'] === 'Article' && e.headline);
    });
    const hasBreadcrumb = !!extractBreadcrumb(jsonLd);
    checks.push({ name: 'JSON-LD Article', pass: hasArticle, detail: hasArticle ? 'presente' : 'ausente' });
    checks.push({ name: 'JSON-LD Breadcrumb', pass: hasBreadcrumb, detail: hasBreadcrumb ? 'presente' : 'ausente' });

    // 7. Categoria no Breadcrumb
    const breadcrumb = extractBreadcrumb(jsonLd);
    let catOk = false, catName = null;
    if (breadcrumb?.itemListElement) {
      const catItem = breadcrumb.itemListElement.find(e => e.position === 3);
      if (catItem) { catName = catItem.name; catOk = expectedCategory ? catItem.name?.toLowerCase() === expectedCategory.toLowerCase() : true; }
    }
    checks.push({ name: 'Categoria Breadcrumb', pass: catOk, detail: catName || 'ausente' });

    // 8. ALT text
    const images = extractImages(html);
    const mainAlt = images[0]?.alt?.trim().length > 0;
    checks.push({ name: 'ALT text', pass: mainAlt, detail: mainAlt ? images[0].alt.slice(0, 60) : 'ausente' });

    // 9. Links afiliado
    const affLinks = extractAffiliateLinks(html);
    const hasAff = affLinks.length > 0;
    const allAffValid = affLinks.every(l => {
      const asin = extractAsin(l);
      const tag = extractTag(l);
      return l.includes('amazon.com.br') && tag && tag === AFFILIATE_TAG && asin && /^[A-Z0-9]{10}$/.test(asin);
    });
    checks.push({ name: 'Links Afiliado', pass: hasAff && allAffValid,
      detail: `${affLinks.length} link(s)` + (allAffValid ? ' ✅' : ' ❌') });

    // 10. Sitemap
    let sitemapOk = false;
    try {
      const sm = await httpGet(`${SITE}/sitemap.xml`, 15000);
      sitemapOk = sm.status === 200 && sm.body.includes(`/blog/${slug}`);
    } catch { sitemapOk = false; }
    checks.push({ name: 'Sitemap', pass: sitemapOk, detail: sitemapOk ? 'listado' : 'não encontrado' });

    // 11. Meta description
    const metaDesc = extractMetaTag(html, 'description');
    const metaDescOk = metaDesc && metaDesc.length >= 80;
    checks.push({ name: 'Meta Description', pass: metaDescOk, detail: metaDesc ? `${metaDesc.length} chars` : 'ausente' });

    // 12. RSS feed contém a página
    let rssOk = false;
    try {
      const feed = await httpGet(`${SITE}/rss.xml`, 10000);
      rssOk = feed.status === 200 && feed.body.includes(`/blog/${slug}`);
    } catch { rssOk = false; }
    checks.push({ name: 'RSS Feed', pass: rssOk, detail: rssOk ? 'listado' : 'não encontrado/inexistente' });

    // 13. Página indexável (sem noindex)
    const robotsMeta = extractMetaTag(html, 'robots');
    const indexable = !robotsMeta || (!robotsMeta.includes('noindex') && !robotsMeta.includes('none'));
    checks.push({ name: 'Indexável', pass: indexable, detail: indexable ? 'indexável' : `robots: ${robotsMeta}` });

    // Score final
    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;
    const allPassed = passed === total;
    const errors = checks.filter(c => !c.pass).map(c => `${c.name}: ${c.detail}`);

    return { slug, url, pass: allPassed, score: Math.round((passed / total) * 100),
      checks, errors, passedCount: passed, totalCount: total };
  } catch (err) {
    return { slug, url, pass: false, score: 0,
      checks: [{ name: 'HTTP', pass: false, detail: err.message }],
      errors: [err.message], passedCount: 0, totalCount: 1 };
  }
}

// ── Sitemap Parser ────────────────────────────────────────────────────────

async function fetchSitemapSlugs() {
  try {
    const res = await httpGet(`${SITE}/sitemap.xml`, 15000);
    if (res.status !== 200) return [];
    const slugs = [];
    const re = /<loc>https:\/\/achadocerto\.vip\/blog\/([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(res.body)) !== null) slugs.push(m[1].replace(/\/$/, ''));
    return slugs;
  } catch { return []; }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1]) || 100
    : 100;

  console.log('='.repeat(70));
  console.log(`🔍 FASE 6: VALIDAÇÃO DE ARTIGOS PUBLICADOS`);
  console.log(`   Site: ${SITE}  |  Tag: ${AFFILIATE_TAG}`);
  console.log('='.repeat(70));

  let slugs;
  if (args.includes('--all')) {
    slugs = await fetchSitemapSlugs();
  } else if (args[0] && !args[0].startsWith('--')) {
    slugs = args.filter(a => !a.startsWith('--'));
  } else {
    slugs = await fetchSitemapSlugs();
  }

  if (slugs.length === 0) {
    console.log('  ⚠️  Nenhum slug encontrado. Passe slugs como argumento.');
    process.exit(1);
  }

  if (slugs.length > limit) {
    console.log(`  📊 Limitando a ${limit} artigos (${slugs.length} disponíveis)`);
    slugs = slugs.slice(0, limit);
  }
  console.log(`  📊 ${slugs.length} artigos\n`);

  const results = [];
  for (let i = 0; i < slugs.length; i++) {
    process.stdout.write(`  ${String(i + 1).padStart(3)}/${slugs.length} ${slugs[i]}... `);
    const r = await validateArticle(slugs[i]);
    results.push(r);
    process.stdout.write(`${r.pass ? '✅' : '❌'} ${r.score}% (${r.passedCount}/${r.totalCount})\n`);
  }

  const total = results.length, passed = results.filter(r => r.pass).length;
  const avgScore = Math.round(results.reduce((a, r) => a + r.score, 0) / total);
  const errorCounts = {};
  for (const r of results) for (const e of r.errors) {
    const key = e.split(':')[0].slice(0, 60);
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  }

  console.log(`\n📊 RESULTADO:`);
  console.log(`  ✅ Aprovados: ${passed}/${total} | Score médio: ${avgScore}%`);
  if (Object.keys(errorCounts).length > 0) {
    console.log(`\n  🔴 Erros:`);
    Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .forEach(([err, c]) => console.log(`    ${err}: ${c}x`));
  }

  const reportFile = path.join(REPORT_DIR, `post-publication-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(), site: SITE,
    total, passed, failed: total - passed, avgScore,
    results, commonErrors: Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
  }, null, 2));
  console.log(`\n  📁 ${reportFile}`);
  console.log(`\n  ${passed === total ? '✅ APROVADO' : '❌ REVISAR'}`);
}

main().catch(err => { console.error(`\n🔴 ${err.message}`); process.exit(1); });
