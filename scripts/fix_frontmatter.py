import pathlib

root = pathlib.Path('src/content/blog')
files = [
    'complexo-b-premium-intera-daily-energia-soldiers-nutrition-n.md',
    'garrafa-termica-quick-flip-stanley-preto-710ml.md',
    'l-glutamina-500g-100-pura-importada-soldiers-nutrition.md',
    'multivitaminico-12-vitaminas-5-minerais-60-capsulas-soldiers.md',
    'multivitaminico-az-homem-premium-intera-daily-soldiers-nutri.md',
    'omega-3-1000mg-60-capsulas-soldiers-nutrition-coracao-vitami.md',
    'suplemento-alimentar-vitasay-a-z-mulher-30-comprimidos-reves.md',
    'vitamina-c-em-po-acido-ascobico-500g-100-puro-soldiers-nutri.md',
    'vitamina-d-intera-daily-imunidade-soldiers-nutrition-natural.md',
]

for fn in files:
    p = root / fn
    txt = p.read_text(encoding='utf-8')
    if not txt.startswith('---\n'):
        p.write_text('---\n' + txt, encoding='utf-8')
        print('fixed', fn)
    else:
        print('already', fn)
