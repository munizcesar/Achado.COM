#!/usr/bin/env python3
"""
PROCESSADOR DE IMAGENS DE PRODUTOS - AchadoCerto.VIP
Adiciona padding branco para manter produto completo visível (sem crop)

Formato: 1200x1200 (1:1 quadrado) - melhor para produtos
Alternativa: 1200x900 (4:3) - mais compacto
"""

import os
from PIL import Image
import argparse

class ProductImageProcessor:
    def __init__(self, size=1200, aspect_ratio='1:1', quality=90):
        """
        size: largura/altura base
        aspect_ratio: '1:1' (quadrado) ou '4:3' (retangular)
        """
        self.size = size
        self.quality = quality
        
        if aspect_ratio == '1:1':
            self.width = size
            self.height = size
        elif aspect_ratio == '4:3':
            self.width = size
            self.height = int(size * 0.75)  # 1200x900
        else:
            raise ValueError("aspect_ratio deve ser '1:1' ou '4:3'")
    
    def process_image(self, img_path, output_path=None):
        """Processa imagem adicionando padding branco para manter proporção"""
        if output_path is None:
            output_path = img_path
        
        try:
            img = Image.open(img_path)
            original_size = img.size
            
            # Converter para RGB
            if img.mode == 'RGBA':
                # Cria fundo branco para transparências
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calcular resize mantendo aspect ratio (fit dentro do target)
            img.thumbnail((self.width, self.height), Image.Resampling.LANCZOS)
            
            # Criar canvas branco
            canvas = Image.new('RGB', (self.width, self.height), (255, 255, 255))
            
            # Centralizar imagem no canvas
            paste_x = (self.width - img.width) // 2
            paste_y = (self.height - img.height) // 2
            canvas.paste(img, (paste_x, paste_y))
            
            # Salvar
            canvas.save(output_path, 'JPEG', quality=self.quality, optimize=True)
            
            file_size_kb = os.path.getsize(output_path) / 1024
            return {
                'status': 'OK',
                'original': original_size,
                'final': (self.width, self.height),
                'size_kb': round(file_size_kb, 1)
            }
            
        except Exception as e:
            return {
                'status': 'ERRO',
                'error': str(e)
            }
    
    def process_directory(self, directory):
        """Processa todas imagens JPG de um diretório"""
        if not os.path.exists(directory):
            print(f"❌ Diretório não encontrado: {directory}")
            return
        
        jpg_files = [f for f in os.listdir(directory) 
                     if f.lower().endswith(('.jpg', '.jpeg'))]
        
        if not jpg_files:
            print(f"Nenhuma imagem JPG encontrada em {directory}")
            return
        
        print(f"🖼️  PROCESSADOR DE IMAGENS DE PRODUTOS")
        print(f"📐  Formato: {self.width}x{self.height}")
        print(f"📁  Imagens encontradas: {len(jpg_files)}\n")
        
        processed = 0
        failed = 0
        
        for filename in jpg_files:
            img_path = os.path.join(directory, filename)
            print(f"⚙️  {filename}... ", end='', flush=True)
            
            result = self.process_image(img_path)
            
            if result['status'] == 'OK':
                print(f"✅ {result['original']} → {result['final']} ({result['size_kb']}kb)")
                processed += 1
            else:
                print(f"❌ {result['error']}")
                failed += 1
        
        print(f"\n📊 Resumo:")
        print(f"   ✅ Processadas: {processed}")
        if failed:
            print(f"   ❌ Falhas: {failed}")
        print(f"\n{'='*60}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Processa imagens de produtos com padding branco',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Exemplos de uso:
  python processar_imagens_produtos.py
  python processar_imagens_produtos.py -d public/images/posts
  python processar_imagens_produtos.py --ratio 4:3
  python processar_imagens_produtos.py --size 1600 --ratio 1:1
        '''
    )
    
    parser.add_argument('-d', '--directory',
                       default='public/images/posts',
                       help='Diretório das imagens (padrão: public/images/posts)')
    
    parser.add_argument('-s', '--size',
                       type=int,
                       default=1200,
                       help='Tamanho base (padrão: 1200)')
    
    parser.add_argument('-r', '--ratio',
                       choices=['1:1', '4:3'],
                       default='1:1',
                       help='Aspect ratio (padrão: 1:1 quadrado)')
    
    parser.add_argument('-q', '--quality',
                       type=int,
                       default=90,
                       help='Qualidade JPEG 1-100 (padrão: 90)')
    
    args = parser.parse_args()
    
    processor = ProductImageProcessor(
        size=args.size,
        aspect_ratio=args.ratio,
        quality=args.quality
    )
    
    processor.process_directory(args.directory)
