#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para gerar favicons em múltiplos tamanhos
"""


import os
import cairosvg

def generate_favicons():
    """
    Gera PNGs de favicon em múltiplos tamanhos a partir do SVG com fundo azul e lupa dourada
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(base_dir, 'images')
    svg_path = os.path.join(images_dir, 'favicon.svg')

    # Tamanhos e nomes dos arquivos PNG
    favicon_configs = [
        (16, 'favicon-16x16.png'),
        (32, 'favicon-32x32.png'),
        (180, 'apple-touch-icon.png'),
        (192, 'favicon-192x192.png'),
        (512, 'favicon-512x512.png'),
    ]

    # Gerar cada tamanho PNG a partir do SVG
    for size, filename in favicon_configs:
        png_path = os.path.join(images_dir, filename)
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
        print(f"✓ Criado: {filename} ({size}x{size})")

    print("\n✅ Todos os favicons PNG foram gerados com sucesso!")
    print(f"   PNGs salvos em: {images_dir}")

if __name__ == '__main__':
    generate_favicons()

...existing code...
