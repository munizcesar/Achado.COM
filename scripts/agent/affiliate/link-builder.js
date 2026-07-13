/**
 * link-builder.js — Validação e Construção de Links de Afiliado (v2)
 * AchadoCerto.VIP — Agente Autônomo
 *
 * RESPONSABILIDADE:
 *   Construir e validar links de afiliado Amazon com o Partner Tag correto.
 *   NUNCA publicar um link sem tag de afiliado.
 *
 * VALIDAÇÕES v2:
 *   ✓ Domínio Amazon correto (.com.br)
 *   ✓ ASIN extraído e válido (10 caracteres)
 *   ✓ Tag de afiliado presente e correta
 *   ✓ URL responde HTTP 200/302 (validação HTTP real)
 *   ✓ Nenhum CTA aponta para URL diferente
 *   ✓ link de afiliado consistente em todo o markdown
 *
 * REGRA ABSOLUTA:
 *   Se o AMAZON_AFFILIATE_TAG não estiver configurado ou não for aplicado
 *   na URL final, a publicação DEVE ser cancelada.
 */

import https from 'https';
import http from 'http';

/**
 * Valida que a tag de afiliado está configurada corretamente.
 */
export function validateAffiliateConfig() {
  const tag = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG || '';

  if (!tag) {
    return { valid: false, tag: null, error: 'AMAZON_AFFILIATE_TAG não definida no .env' };
  }

  if (tag.length < 5) {
    return { valid: false, tag, error: `AMAZON_AFFILIATE_TAG muito curta: "${tag}" (mínimo 5 caracteres)` };
  }

  if (tag === 'altivita-20' && process.env.NODE_ENV === 'production') {
    console.log(`   ℹ️  Usando tag afiliada: ${tag}`);
  }

  return { valid: true, tag, error: null };
}

/**
 * Constrói URL de afiliado Amazon.
 */
export function buildAmazonAffiliateUrl(asin, tag) {
  const url = new URL(`https://www.amazon.com.br/dp/${asin}`);
  url.searchParams.set('tag', tag);
  url.searchParams.set('utm_source', 'achadocertovip');
  url.searchParams.set('utm_medium', 'blog');
  url.searchParams.set('utm_campaign', 'agente-afiliado');
  return url.toString();
}

/**
 * Extrai ASIN de uma URL.
 */
function extractAsin(url) {
  if (!url) return null;
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

/**
 * Extrai TODOS os links do markdown.
 */
function extractAllLinks(markdown) {
  if (!markdown) return [];
  const links = [];
  // Links markdown: [texto](url)
  const mdPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdPattern.exec(markdown)) !== null) {
    links.push({ text: match[1].trim(), url: match[2].trim(), type: 'markdown' });
  }
  // Links diretos (URLs soltas)
  const rawPattern = /https?:\/\/[^\s)\]">']+/g;
  while ((match = rawPattern.exec(markdown)) !== null) {
    const url = match[0].trim();
    if (!links.find(l => l.url === url)) {
      links.push({ text: url, url, type: 'raw' });
    }
  }
  return links;
}

/**
 * Valida domínio, ASIN e tag da URL.
 */
function validateUrlStructure(url, expectedTag) {
  if (!url) return { valid: false, error: 'URL vazia' };

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Domínio Amazon
    if (!hostname.includes('amazon')) {
      return { valid: false, error: `Domínio não é Amazon: ${hostname}` };
    }
    if (!hostname.endsWith('.com.br') && hostname !== 'www.amazon.com.br' && hostname !== 'amzn.to') {
      return { valid: false, error: `Domínio Amazon inválido para o mercado BR: ${hostname}` };
    }

    // 2. ASIN válido
    const asin = extractAsin(url);
    if (!asin) {
      return { valid: false, error: 'URL sem ASIN no formato /dp/XXXXXXXXXX' };
    }
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      return { valid: false, error: `ASIN inválido: ${asin} (deve ter 10 caracteres alfanuméricos)` };
    }

    // 3. Tag presente e correta
    const tagParam = parsed.searchParams.get('tag');
    if (!tagParam) {
      return { valid: false, error: 'URL sem parâmetro tag= — NÃO PUBLICAR' };
    }
    if (tagParam !== expectedTag) {
      return { valid: false, error: `Tag "${tagParam}" diferente da configurada "${expectedTag}" — NÃO PUBLICAR` };
    }

    return { valid: true, error: null, asin, tag: tagParam, hostname };
  } catch (err) {
    return { valid: false, error: `URL inválida: ${err.message}` };
  }
}

/**
 * Verifica se a URL responde HTTP 200/302 (HEAD request).
 */
function checkUrlHttp(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const lib = parsedUrl.protocol === 'https:' ? https : http;
      const req = lib.request(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
        },
        timeout: timeoutMs,
      }, (res) => {
        res.resume();
        const ok = res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302;
        resolve({ ok, status: res.statusCode });
      });
      req.on('error', () => resolve({ ok: false, status: 0 }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
      req.end();
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

/**
 * VALIDAÇÃO FORTE — verifica domínio, ASIN, tag.
 */
export function validateAffiliateUrl(url, expectedTag) {
  return validateUrlStructure(url, expectedTag);
}

/**
 * Valida que a URL final contém a tag correta.
 */
export function validateFinalAffiliateUrl(affiliateUrl) {
  const config = validateAffiliateConfig();
  if (!config.valid) {
    return { valid: false, error: config.error, asin: null };
  }
  const result = validateUrlStructure(affiliateUrl, config.tag);
  return { valid: result.valid, error: result.error, asin: result.asin };
}

/**
 * Verifica se a URL responde HTTP — validação real.
 * Retorna PROMISE, use com await.
 */
export async function validateAffiliateUrlHttp(affiliateUrl) {
  const httpResult = await checkUrlHttp(affiliateUrl);
  return {
    valid: httpResult.ok,
    status: httpResult.status,
    error: httpResult.ok ? null : `URL não respondeu HTTP 200/302 (status: ${httpResult.status})`,
  };
}

/**
 * Verifica que TODOS os CTAs no markdown usam a mesma URL de afiliado.
 * 
 * @param {string} markdown - Conteúdo markdown completo
 * @param {string} expectedUrl - URL de afiliado esperada
 * @param {string} expectedTag - Tag de afiliado esperada
 * @returns {{
 *   pass: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   ctas: Array<{ text: string, url: string, valid: boolean }>,
 *   allSameAsin: boolean
 * }}
 */
export function validateAllCtas(markdown, expectedUrl, expectedTag) {
  const errors = [];
  const warnings = [];
  const ctas = [];

  if (!markdown) {
    return { pass: false, errors: ['Markdown vazio'], warnings: [], ctas: [], allSameAsin: false };
  }

  const links = extractAllLinks(markdown);
  const expectedAsin = extractAsin(expectedUrl);

  if (links.length === 0) {
    errors.push('Nenhum link encontrado no markdown — CTA ausente');
    return { pass: false, errors, warnings, ctas, allSameAsin: false };
  }

  // Filtra links que parecem CTAs (links Amazon)
  const amazonLinks = links.filter(l => l.url.includes('amazon'));
  
  if (amazonLinks.length === 0) {
    errors.push('Nenhum link Amazon encontrado no markdown — CTA de afiliado ausente');
    return { pass: false, errors, warnings, ctas, allSameAsin: false };
  }

  let allSameAsin = true;
  for (const link of amazonLinks) {
    const linkAsin = extractAsin(link.url);
    const linkValid = linkAsin === expectedAsin;
    const structureValid = expectedTag ? validateUrlStructure(link.url, expectedTag) : { valid: linkAsin === expectedAsin };

    ctas.push({
      text: link.text.slice(0, 60),
      url: link.url,
      valid: linkValid && (typeof structureValid.valid === 'boolean' ? structureValid.valid : true),
      asin: linkAsin,
    });

    if (!linkValid) {
      allSameAsin = false;
    }
  }

  // Verifica se algum CTA aponta para ASIN diferente
  const differentAsin = ctas.filter(c => c.asin && c.asin !== expectedAsin);
  if (differentAsin.length > 0) {
    errors.push(`${differentAsin.length} CTA(s) apontam para ASIN diferente do esperado (${expectedAsin}): ${differentAsin.map(c => c.asin).join(', ')}`);
  }

  // Verifica se a URL esperada está presente em pelo menos um link
  const hasExpectedUrl = ctas.some(c => c.url.includes(expectedAsin));
  if (!hasExpectedUrl) {
    errors.push(`Nenhum CTA contém o ASIN esperado (${expectedAsin})`);
  }

  // Verifica se a tag está presente em todos os links Amazon
  const missingTag = ctas.filter(c => c.url.includes('amazon') && !c.url.includes('tag='));
  if (missingTag.length > 0) {
    errors.push(`${missingTag.length} link(s) Amazon sem tag= de afiliado`);
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    ctas,
    allSameAsin,
    summary: `${ctas.length} CTA(s) encontrados — ${errors.length === 0 ? '✅ TODOS VÁLIDOS' : `❌ ${errors.length} erro(s)`}`,
  };
}
