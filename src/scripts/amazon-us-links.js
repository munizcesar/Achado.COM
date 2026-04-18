/**
 * amazon-us-links.js
 * Gera e injeta links Amazon US com tag achadocertovip-20
 * Ativado apenas para visitantes fora do Brasil (classe geo-intl no body)
 *
 * USO nos templates Astro:
 *   <script src="/scripts/amazon-us-links.js" is:inline></script>
 * OU importado no geo script do Layout.
 */

(function () {
  var TAG = 'achadocertovip-20';

  // ─── Tabela de links por tipo ───────────────────────────────────────────────
  var LINKS = {
    homepage:          { url: 'https://www.amazon.com/?tag=' + TAG,                                          label: 'Shop on Amazon.com',             desc: 'Millions of products' },
    search:            { url: 'https://www.amazon.com/s?k={query}&tag=' + TAG,                               label: 'Search on Amazon.com',            desc: 'Find on Amazon' },
    bestsellersTech:   { url: 'https://www.amazon.com/best-sellers-electronics/?tag=' + TAG,                 label: 'Best Sellers - Electronics',      desc: 'Top tech products' },
    bestsellersSaude:  { url: 'https://www.amazon.com/best-sellers-health-personal-care/?tag=' + TAG,        label: 'Best Sellers - Health',           desc: 'Top health products' },
    bestsellersBeleza: { url: 'https://www.amazon.com/best-sellers-beauty/?tag=' + TAG,                      label: 'Best Sellers - Beauty',           desc: 'Top beauty products' },
    bestsellersHome:   { url: 'https://www.amazon.com/best-sellers-home-kitchen/?tag=' + TAG,                label: 'Best Sellers - Home & Kitchen',   desc: 'Top home products' },
    bestsellersEsport: { url: 'https://www.amazon.com/best-sellers-sports-outdoors/?tag=' + TAG,             label: 'Best Sellers - Sports',           desc: 'Top sports products' },
    deals:             { url: 'https://www.amazon.com/deals?tag=' + TAG,                                     label: 'Today\'s Deals on Amazon',        desc: 'Limited-time offers' },
    primeDay:          { url: 'https://www.amazon.com/primeday?tag=' + TAG,                                  label: 'Prime Day Deals',                 desc: 'Exclusive Prime offers' },
  };

  // ─── Mapa categoria do site → link correto ──────────────────────────────────
  var CATEGORY_MAP = {
    'tech':       'bestsellersTech',
    'saude':      'bestsellersSaude',
    'beleza':     'bestsellersBeleza',
    'casa':       'bestsellersHome',
    'esportes':   'bestsellersEsport',
    'dicas':      'homepage',
    'automotivo': 'homepage',
  };

  /**
   * Retorna o link correto baseado no path atual
   * /categorias/tech  → bestsellersTech
   * /blog             → deals
   * /                 → homepage
   */
  function getLinkForPage() {
    var path = window.location.pathname;
    // Tenta detectar categoria
    var catMatch = path.match(/\/categorias\/([\w-]+)/);
    if (catMatch) {
      var cat = catMatch[1];
      var key = CATEGORY_MAP[cat] || 'homepage';
      return LINKS[key];
    }
    if (path.startsWith('/blog') || path.startsWith('/post') || path.startsWith('/review')) {
      return LINKS.deals;
    }
    return LINKS.homepage;
  }

  /**
   * Gera URL de busca com o termo do produto (lê data-product ou title do post)
   */
  function getSearchLink(query) {
    var encoded = encodeURIComponent(query || '');
    return LINKS.search.url.replace('{query}', encoded);
  }

  /**
   * Injeta link nos elementos com data-amazon-us="tipo"
   * Exemplo: <a data-amazon-us="deals">Ver Deals</a>
   *          <a data-amazon-us="search" data-query="fone bluetooth">Buscar</a>
   */
  function injectDataAttributes() {
    document.querySelectorAll('[data-amazon-us]').forEach(function (el) {
      var tipo = el.getAttribute('data-amazon-us');
      var query = el.getAttribute('data-query') || '';
      var linkObj;
      if (tipo === 'search' && query) {
        el.href = getSearchLink(query);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener sponsored');
        return;
      }
      linkObj = LINKS[tipo] || LINKS.homepage;
      el.href = linkObj.url;
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener sponsored');
    });
  }

  /**
   * Atualiza todos os banners .amazon-us-banner e .amazon-us-sidebar
   * com o link correto para a página atual
   */
  function updateBannerLinks() {
    var pageLink = getLinkForPage();
    // Banners inline (amazon-us-banner)
    document.querySelectorAll('.amazon-us-banner a.amazon-us-cta').forEach(function (a) {
      if (!a.getAttribute('data-amazon-us')) { // não sobrescreve se já tem data-amazon-us
        a.href = pageLink.url;
      }
    });
    // Sidebar
    document.querySelectorAll('.amazon-us-sidebar a.amazon-us-cta').forEach(function (a) {
      if (!a.getAttribute('data-amazon-us')) {
        a.href = pageLink.url;
      }
    });
  }

  /**
   * Injeta um bloco de links rápidos Amazon US em containers com id="amazon-us-quicklinks"
   * Útil para colocar no footer ou sidebar
   */
  function injectQuickLinks() {
    var containers = document.querySelectorAll('#amazon-us-quicklinks, .amazon-us-quicklinks');
    if (!containers.length) return;

    var items = [
      LINKS.homepage,
      LINKS.deals,
      LINKS.bestsellersTech,
      LINKS.bestsellersSaude,
      LINKS.bestsellersBeleza,
      LINKS.bestsellersHome,
    ];

    var html = '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;">';
    items.forEach(function (item) {
      html += '<li><a href="' + item.url + '" target="_blank" rel="noopener sponsored" '
            + 'style="display:flex;align-items:center;gap:8px;font-size:.9rem;color:#FF9900;text-decoration:none;font-weight:600;">'
            + item.label
            + '</a></li>';
    });
    html += '</ul>';

    containers.forEach(function (el) {
      el.innerHTML = html;
    });
  }

  // ─── Executa tudo ───────────────────────────────────────────────────────────
  function run() {
    if (!document.body.classList.contains('geo-intl')) return; // só para intl
    injectDataAttributes();
    updateBannerLinks();
    injectQuickLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Expõe helpers globais para uso em outros scripts/componentes
  window.AmazonUS = {
    TAG: TAG,
    LINKS: LINKS,
    getSearchLink: getSearchLink,
    getLinkForPage: getLinkForPage,
  };
})();
