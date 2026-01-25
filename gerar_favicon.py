#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para gerar favicons em múltiplos tamanhos
"""

from PIL import Image, ImageDraw
import os

def create_favicon_image(size=100, background_color=None, line_color='#3B82F6', line_width=6):
    """
    Cria uma imagem com o logo da lupa (transparente)
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))  # Transparente
    draw = ImageDraw.Draw(img)
    
    # Escala para o tamanho da imagem
    scale = size / 100
    
    # Desenhar círculo da lupa (magnifying glass circle)
    circle_x1 = 12 * scale
    circle_y1 = 12 * scale
    circle_x2 = 68 * scale
    circle_y2 = 68 * scale
    
    draw.ellipse(
        [circle_x1, circle_y1, circle_x2, circle_y2],
        outline=line_color,
        width=int(line_width * scale)
    )
    
    # Desenhar haste da lupa (magnifying glass handle)
    x1, y1 = 60 * scale, 60 * scale
    x2, y2 = 88 * scale, 88 * scale
    
    draw.line(
        [(x1, y1), (x2, y2)],
        fill=line_color,
        width=int(line_width * scale)
    )
    
    return img

def generate_favicons():
    """
    Gera todos os arquivos de favicon necessários
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(base_dir, 'images')
    
    # Criar diretório se não existir
    os.makedirs(images_dir, exist_ok=True)
    
    # Tamanhos e nomes dos arquivos
    favicon_configs = [
        (16, 'favicon-16x16.png'),
        (32, 'favicon-32x32.png'),
        (180, 'apple-touch-icon.png'),
    ]
    
    # Gerar cada tamanho
    for size, filename in favicon_configs:
        img = create_favicon_image(size)
        filepath = os.path.join(images_dir, filename)
        img.save(filepath, 'PNG')
        print(f"✓ Criado: {filename} ({size}x{size})")
    
    # Gerar favicon.ico a partir do arquivo 32x32
    img_32 = create_favicon_image(32)
    
    # Criar versões menores para o ICO
    img_16 = create_favicon_image(16)
    
    ico_path = os.path.join(base_dir, 'favicon.ico')
    img_32.save(ico_path, 'ICO', sizes=[(16, 16), (32, 32)])
    print(f"✓ Criado: favicon.ico")
    
    print("\n✅ Todos os favicons foram gerados com sucesso!")
    print(f"   Salvos em: {images_dir}")

if __name__ == '__main__':
    generate_favicons()
