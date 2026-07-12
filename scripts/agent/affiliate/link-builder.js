/**
 * link-builder.js — Validação e Construção de Links de Afiliado
 * AchadoCerto.VIP — Agente Autônomo
 *
 * RESPONSABILIDADE:
 *   Construir e validar links de afiliado Amazon com o Partner Tag correto.
 *   NUNCA publicar um link sem tag de afiliado.
 *
 * REGRA ABSOLUTA:
 *   Se o AMAZON_AFFILIATE_TAG não estiver configurado ou não for aplicado
 *   na URL final, a publicação DEVE ser cancelada.
 */

/**
 * Valida que a tag de afiliado está configurada corretamente.
 *
 * @returns {{ valid: boolean, tag: string|null, error: string|null }}
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
    // Tag padrão do exemplo — válida, apenas avisar
    console.log(`   ℹ️  Usando tag afiliada: ${tag}`);
  }

  return { valid: true, tag, error: null };
}

/**
 * Constrói URL de afiliado Amazon.
 *
 * @param {string} asin - Código ASIN de 10 caracteres
 * @param {string} tag  - Partner Tag
 * @returns {string} URL completa com tag e utm
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
 * VALIDAÇÃO FORTE — verifica domínio, ASIN, tag e ausência de redirect.
 * Chamada ANTES de gerar o artigo e ANTES de salvar o arquivo.
 *
 * @param {string} url - URL final do link de afiliado
 * @param {string} expectedTag - Tag esperada
 * @returns {{ valid: boolean, error: string|null, asin: string|null, tag: string|null }}
 */
export function validateAffiliateUrl(url, expectedTag) {
  if (!url) {
    return { valid: false, error: 'URL vazia — impossível validar' };
  }

  // 1. Domínio Amazon correto
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (!hostname.includes('amazon')) {
      return { valid: false, error: `Domínio não é Amazon: ${hostname}` };
    }

    if (!hostname.endsWith('.com.br') && !hostname.includes('amazon.com.br')) {
      // amazon.com.br é o único domínio BR
      if (!hostname.endsWith('amazon.com.br') && hostname !== 'www.amazon.com.br') {
        // URLs curtas amzn.to são permitidas se resolvem para amazon.com.br
        if (hostname !== 'amzn.to') {
          return { valid: false, error: `Domínio Amazon inválido para o mercado BR: ${hostname}` };
        }
      }
    }

    // 2. ASIN válido na URL
    const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    const asin = asinMatch?.[1] || null;
    if (!asin) {
      return { valid: false, error: `URL sem ASIN válido no formato /dp/XXXXXXXXXX` };
    }

    // 3. Parâmetro tag= presente e exatamente igual ao configurado
    const tagParam = parsed.searchParams.get('tag');
    if (!tagParam) {
      return { valid: false, error: `URL sem parâmetro tag= — NÃO PUBLICAR` };
    }

    if (tagParam !== expectedTag) {
      return {
        valid: false,
        error: `Tag na URL ("${tagParam}") diferente da configurada ("${expectedTag}") — NÃO PUBLICAR`,
      };
    }

    // 4. Verifica se há redirecionamento explícito que pode remover a tag
    // Redirecionamentos HTTP (301/302) preservam query params na maioria dos casos,
    // mas redirecionamentos via JavaScript ou meta refresh podem perder.
    // URLs amzn.to são seguras pois resolvem para amazon.com.br preservando params.
    const hasRedirectInPath = parsed.pathname.includes('redirect') || parsed.pathname.includes('goto');
    if (hasRedirectInPath) {
      return { valid: false, error: `URL contém redirecionamento (${parsed.pathname}) — pode perder a tag=` };
    }

    return { valid: true, error: null, asin, tag: tagParam };
  } catch (err) {
    return { valid: false, error: `URL inválida: ${err.message}` };
  }
}

/**
 * Valida que a URL final do artigo contém a tag correta.
 * Chamado pelo pipeline como gate final antes da publicação.
 *
 * @param {string} affiliateUrl
 * @returns {{ valid: boolean, error: string|null, asin: string|null }}
 */
export function validateFinalAffiliateUrl(affiliateUrl) {
  const config = validateAffiliateConfig();
  if (!config.valid) {
    return { valid: false, error: config.error, asin: null };
  }

  return validateAffiliateUrl(affiliateUrl, config.tag);
}
