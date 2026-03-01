#!/usr/bin/env python3
"""
OTIMIZADOR DE IMAGENS OG - AchadoCerto.VIP
Redimensiona e otimiza imagens para compartilhamento social

Uso:
    python otimizar_og.py                    # Processa pasta padrão
    python otimizar_og.py -d seu/caminho     # Processa caminho customizado
    python otimizar_og.py -v -w 1600         # Modo verbose + largura customizada
"""

import argparse
import os
from PIL import Image
import shutil
from pathlib import Path
from datetime import datetime

class OGImageOptimizer:
    def __init__(self, width=1200, height=630, quality=85):
        self.target_width = width
        self.target_height = height
        self.quality = quality
        self.processed = 0
        self.failed = 0
        self.skipped = 0
        
    def resize_and_crop(self, img_path, output_path=None):
        """Redimensiona e corta imagem para manter proporção"""
        if output_path is None:
            output_path = img_path
            
        try:
            img = Image.open(img_path)
            original_size = img.size
            
            # Converter para RGB
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calcular proporções
            target_ratio = self.target_width / self.target_height
            current_ratio = img.width / img.height
            
            # Redimensionar mantendo aspect ratio
            if current_ratio > target_ratio:
                new_height = self.target_height
                new_width = int(new_height * current_ratio)
            else:
                new_width = self.target_width
                new_height = int(new_width / current_ratio)
            
            # Resize
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Crop ao centro
            left = (new_width - self.target_width) // 2
            top = (new_height - self.target_height) // 2
            right = left + self.target_width
            bottom = top + self.target_height
            
            img_final = img_resized.crop((left, top, right, bottom))
            
            # Salvar
            img_final.save(output_path, 'JPEG', quality=self.quality, optimize=True)
            
            file_size_kb = os.path.getsize(output_path) / 1024
            return {
                'status': 'OK',
                'original': original_size,
                'final': (self.target_width, self.target_height),
                'size_kb': file_size_kb
            }
            
        except Exception as e:
            return {
                'status': 'ERRO',
                'error': str(e)
            }
    
    def process_directory(self, directory, create_backup=True, verbose=True):
        """Processa todos os JPGs numa pasta"""
        
        if not os.path.exists(directory):
            print(f"ERRO: Diretorio nao encontrado: {directory}")
            return False
        
        # Criar backup
        if create_backup:
            backup_dir = os.path.join(directory, "backup_" + datetime.now().strftime("%Y%m%d_%H%M%S"))
            os.makedirs(backup_dir, exist_ok=True)
        
        jpg_files = [f for f in os.listdir(directory) 
                     if f.lower().endswith(('.jpg', '.jpeg'))]
        
        if not jpg_files:
            print(f"Nenhuma imagem JPG encontrada em {directory}")
            return False
        
        print("=" * 90)
        print(f"OTIMIZADOR DE IMAGENS OG - AchadoCerto.VIP")
        print("=" * 90)
        print(f"Diretorio: {directory}")
        print(f"Tamanho alvo: {self.target_width}x{self.target_height}px")
        print(f"Qualidade: {self.quality}%")
        print(f"Backup: {'Sim (em ' + backup_dir + ')' if create_backup else 'Nao'}")
        print(f"Imagens encontradas: {len(jpg_files)}\n")
        
        for img_file in sorted(jpg_files):
            img_path = os.path.join(directory, img_file)
            
            # Backup
            if create_backup:
                shutil.copy2(img_path, os.path.join(backup_dir, img_file))
            
            # Process
            result = self.resize_and_crop(img_path)
            
            if result['status'] == 'OK':
                orig_w, orig_h = result['original']
                size = result['size_kb']
                status = "[OK]"
                self.processed += 1
                
                if verbose:
                    print(f"{status} {img_file:<40} {orig_w:4}x{orig_h:4} -> {self.target_width}x{self.target_height} ({size:6.0f}KB)")
            
            elif result['status'] == 'ERRO':
                status = "[ERRO]"
                self.failed += 1
                print(f"{status} {img_file:<40} {result['error']}")
        
        # Summary
        print("\n" + "=" * 90)
        print("RESUMO")
        print("=" * 90)
        print(f"Processadas: {self.processed}")
        print(f"Erros: {self.failed}")
        print(f"Total: {len(jpg_files)}\n")
        
        if create_backup:
            print(f"Backup criado em: {backup_dir}")
            print("(Voce pode restaurar daqui se necessario)\n")
        
        return self.failed == 0

def main():
    parser = argparse.ArgumentParser(
        description="Otimiza imagens para Open Graph (redes sociais)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:

  # Processar pasta padrao
  python otimizar_og.py

  # Especificar diretorio
  python otimizar_og.py -d frontend/images/imagesposts

  # Tamanho customizado (ex: 1600x900)
  python otimizar_og.py -w 1600 -e 900

  # Qualidade menor (mais comprimido)
  python otimizar_og.py -q 75

  # Modo verbose + sem backup
  python otimizar_og.py -v --no-backup
        """
    )
    
    parser.add_argument('-d', '--directory', 
                       default='frontend/images/imagesposts',
                       help='Diretorio com imagens (padrao: frontend/images/imagesposts)')
    parser.add_argument('-w', '--width', type=int, default=1200,
                       help='Largura alvo em pixels (padrao: 1200)')
    parser.add_argument('-e', '--height', type=int, default=630,
                       help='Altura alvo em pixels (padrao: 630)')
    parser.add_argument('-q', '--quality', type=int, default=85,
                       help='Qualidade JPEG 1-100 (padrao: 85)')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Modo verbose (mostra detalhes de cada imagem)')
    parser.add_argument('--no-backup', action='store_true',
                       help='Nao cria backup das imagens originais')
    
    args = parser.parse_args()
    
    # Validar
    if args.quality < 1 or args.quality > 100:
        print("ERRO: Qualidade deve estar entre 1 e 100")
        return 1
    
    # Processar
    optimizer = OGImageOptimizer(args.width, args.height, args.quality)
    success = optimizer.process_directory(
        args.directory,
        create_backup=not args.no_backup,
        verbose=args.verbose
    )
    
    return 0 if success else 1

if __name__ == '__main__':
    exit(main())
