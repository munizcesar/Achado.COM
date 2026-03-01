from PIL import Image
import os
from pathlib import Path

# Diretório de imagens
img_dir = "frontend/images/imagesposts"
backup_dir = "frontend/images/imagesposts_backup"

# Padrão ideal para OG
TARGET_WIDTH = 1200
TARGET_HEIGHT = 630

# Criar backup
os.makedirs(backup_dir, exist_ok=True)

print("=" * 80)
print("REDIMENSIONAMENTO DE IMAGENS OG - AchadoCerto.VIP")
print("=" * 80)
print(f"\nTamanho alvo: {TARGET_WIDTH}x{TARGET_HEIGHT}px")
print(f"Criando backup em: {backup_dir}\n")

jpg_files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.jpg', '.jpeg'))]

processed = 0
errors = []

for img_file in sorted(jpg_files):
    img_path = os.path.join(img_dir, img_file)
    backup_path = os.path.join(backup_dir, img_file)
    
    try:
        # Fazer backup do original
        if not os.path.exists(backup_path):
            import shutil
            shutil.copy2(img_path, backup_path)
        
        # Abrir imagem
        img = Image.open(img_path)
        original_size = img.size
        
        # Converter para RGB se necessário (RGBA, etc)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar com aspect ratio mantido + crop inteligente
        # 1. Calcular a proporção
        target_ratio = TARGET_WIDTH / TARGET_HEIGHT
        current_ratio = img.width / img.height
        
        if current_ratio > target_ratio:
            # Imagem muito larga - crop na largura
            new_height = TARGET_HEIGHT
            new_width = int(new_height * current_ratio)
        else:
            # Imagem muito alta - crop na altura
            new_width = TARGET_WIDTH
            new_height = int(new_width / current_ratio)
        
        # Redimensionar primeiro
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Cortar para tamanho exato (centra a imagem)
        left = (new_width - TARGET_WIDTH) // 2
        top = (new_height - TARGET_HEIGHT) // 2
        right = left + TARGET_WIDTH
        bottom = top + TARGET_HEIGHT
        
        img_final = img_resized.crop((left, top, right, bottom))
        
        # Salvar com qualidade otimizada
        img_final.save(img_path, 'JPEG', quality=85, optimize=True)
        
        file_size_kb = os.path.getsize(img_path) / 1024
        print(f"[OK] {img_file:<38} {original_size[0]:4}x{original_size[1]:4} -> {TARGET_WIDTH}x{TARGET_HEIGHT} ({file_size_kb:6.0f}KB)")
        processed += 1
        
    except Exception as e:
        print(f"[ERRO] {img_file:<38} {str(e)}")
        errors.append((img_file, str(e)))

print("\n" + "=" * 80)
print("RESUMO")
print("=" * 80)
print(f"\nImagens processadas: {processed}/{len(jpg_files)}")
print(f"Backup criado em: {backup_dir}")

if errors:
    print(f"\nErros encontrados: {len(errors)}")
    for img, err in errors:
        print(f"  - {img}: {err}")
else:
    print("\nTodas as imagens foram redimensionadas com sucesso!")

print("\n" + "=" * 80)
