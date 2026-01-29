#!/usr/bin/env python3
"""Adicionar Google Analytics em todos os HTMLs"""

import os

ga_code = '''    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-B170HB38GJ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-B170HB38GJ');
    </script>
</head>'''

arquivos = [
    'politica.html',
    'termos.html',
    'categorias/tech.html',
    'categorias/saude.html',
    'categorias/lar.html',
    'categorias/estilo.html',
    'categorias/dicas.html',
    'blog/whey-pro-max-titanium.html',
    'blog/melhor-tv-55-polegadas-2026.html',
    'blog/legging-fitness-zero-transparencia-selene.html',
    'blog/guia-seguranca-mercado-livre.html',
    'blog/guia-creatina-performance.html',
    'blog/guia-arginina.html',
    'blog/creatina-soldiers-500g.html',
    'blog/comparativo-xiaomi-poco-2026.html',
    'blog/cafeteira-italiana-inox.html',
]

atualizados = 0

for arquivo in arquivos:
    try:
        with open(arquivo, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        if 'G-B170HB38GJ' in conteudo:
            print(f'✓ {arquivo:45} já tem GA')
            continue
        
        conteudo = conteudo.replace('</head>', ga_code)
        
        with open(arquivo, 'w', encoding='utf-8') as f:
            f.write(conteudo)
        
        print(f'✅ {arquivo:45} adicionado GA')
        atualizados += 1
    except Exception as e:
        print(f'❌ {arquivo:45} ERRO: {e}')

print(f'\n✅ Total: {atualizados} arquivos atualizados')
