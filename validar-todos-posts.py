#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VALIDADOR EM LOTE
Valida todos os posts do site de uma vez
Uso: python validar-todos-posts.py
"""

import os
import sys
import subprocess
from pathlib import Path

def validar_todos():
    """Valida todos os posts HTML"""
    
    # Encontrar todos os posts
    posts = []
    
    # Posts na raiz
    for arquivo in Path('.').glob('*.html'):
        if arquivo.name not in ['index.html', 'blog.html', 'politica.html', 'termos.html']:
            continue
        posts.append(str(arquivo))
    
    # Posts no blog/
    for arquivo in Path('blog').glob('*.html'):
        posts.append(str(arquivo))
    
    if not posts:
        print("❌ Nenhum post encontrado!")
        return
    
    print(f"\n📊 VALIDANDO {len(posts)} POSTS")
    print("=" * 60)
    
    resultados = {
        'passou': 0,
        'avisos': 0,
        'erro': 0,
        'detalhes': []
    }
    
    for i, post in enumerate(posts, 1):
        print(f"\n[{i}/{len(posts)}] {Path(post).name}...", end=' ', flush=True)
        
        try:
            resultado = subprocess.run(
                ['python', 'validador-posts-auto.py', post],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if resultado.returncode == 0:
                print("✅")
                resultados['passou'] += 1
            else:
                # Contar erros
                erros = resultado.stdout.count('❌')
                avisos = resultado.stdout.count('⚠️')
                
                if erros > 0:
                    print(f"❌ ({erros} erros)")
                    resultados['erro'] += 1
                elif avisos > 0:
                    print(f"⚠️  ({avisos} avisos)")
                    resultados['avisos'] += 1
                
                resultados['detalhes'].append({
                    'arquivo': post,
                    'erros': erros,
                    'avisos': avisos,
                    'saida': resultado.stdout
                })
        
        except subprocess.TimeoutExpired:
            print("⏱️  (timeout)")
            resultados['erro'] += 1
        except Exception as e:
            print(f"❌ (erro: {str(e)[:30]})")
            resultados['erro'] += 1
    
    # Resumo
    print("\n" + "=" * 60)
    print("📈 RESUMO GERAL")
    print("=" * 60)
    print(f"✅ Passou:  {resultados['passou']}/{len(posts)}")
    print(f"⚠️  Avisos:  {resultados['avisos']}/{len(posts)}")
    print(f"❌ Erros:   {resultados['erro']}/{len(posts)}")
    
    # Detalhes de erros
    if resultados['detalhes']:
        print("\n🔍 POSTS COM PROBLEMAS:")
        for detalhe in resultados['detalhes']:
            print(f"\n  📄 {detalhe['arquivo']}")
            if detalhe['erros'] > 0:
                print(f"     ❌ {detalhe['erros']} erros")
            if detalhe['avisos'] > 0:
                print(f"     ⚠️  {detalhe['avisos']} avisos")
    
    # Status final
    print("\n" + "=" * 60)
    if resultados['erro'] > 0:
        print("🔴 STATUS: Existem posts com ERROS!")
        return False
    elif resultados['avisos'] > 0:
        print(f"🟡 STATUS: {resultados['avisos']} posts com avisos (revisar)")
        return True
    else:
        print("🟢 STATUS: Todos os posts validados com sucesso!")
        return True

if __name__ == '__main__':
    sucesso = validar_todos()
    sys.exit(0 if sucesso else 1)
