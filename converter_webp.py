#!/usr/bin/env python3
"""
Converter imagens para WebP com fallback JPG
Estratégia: Mantém originais, cria .webp em paralelo
"""

from PIL import Image
import os
import sys

# Mapear imagens que queremos converter (principais)
IMAGENS_PRINCIPAIS = [
    ('images/imagem_celular.png', 'images/imagem_celular.webp'),
    ('images/imagem_desktop.webp', 'images/imagem_desktop.webp'),
    ('images/produtos_ofertas.png', 'images/produtos_ofertas.webp'),
    ('images/imagesposts/creatinarefil.webp', None),  # Já é WebP
]

def converter_para_webp(origem, destino, qualidade=80):
    """Converter imagem para WebP com qualidade controlada"""
    try:
        if destino and os.path.exists(origem):
            img = Image.open(origem)
            
            # Converter para RGB se necessário (para WebP)
            if img.mode == 'RGBA':
                # Para PNG com transparência, manter RGBA em WebP
                img.save(destino, 'WEBP', quality=qualidade)
            else:
                img.save(destino, 'WEBP', quality=qualidade)
            
            tamanho_orig = os.path.getsize(origem) / 1024
            tamanho_novo = os.path.getsize(destino) / 1024
            economia = ((tamanho_orig - tamanho_novo) / tamanho_orig) * 100
            
            return True, tamanho_orig, tamanho_novo, economia
    except Exception as e:
        return False, 0, 0, str(e)

print("🎨 CONVERTENDO IMAGENS PARA WEBP")
print("=" * 70)

convertidas = 0
total = 0

for origem, destino in IMAGENS_PRINCIPAIS:
    if not destino:  # Pular se já é WebP
        print(f"✓ {origem:40} (já é WebP)")
        continue
    
    total += 1
    
    if not os.path.exists(origem):
        print(f"❌ {origem:40} NÃO ENCONTRADO")
        continue
    
    sucesso, orig_kb, novo_kb, economia = converter_para_webp(origem, destino, qualidade=85)
    
    if sucesso:
        print(f"✅ {os.path.basename(destino):35} {orig_kb:6.1f}KB → {novo_kb:6.1f}KB (-{economia:.1f}%)")
        convertidas += 1
    else:
        print(f"❌ {origem:40} ERRO: {economia}")

print("\n" + "=" * 70)
print(f"📊 Resumo: {convertidas}/{total} imagens convertidas com sucesso")
print("💡 Próximo passo: Atualizar HTML com <picture> tags")
