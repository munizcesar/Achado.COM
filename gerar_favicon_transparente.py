from PIL import Image, ImageDraw
import os

# Criar imagem com fundo transparente
size = 512
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Cores (baseadas na imagem: azul claro, azul médio, azul escuro, branco)
colors = [
    (173, 216, 255, 255),  # Azul claro
    (30, 144, 255, 255),   # Azul médio
    (0, 51, 153, 255),     # Azul escuro
    (255, 255, 255, 255),  # Branco
]

center = size // 2
line_width = 20

# Desenhar círculos concêntricos
radii = [200, 160, 120, 80]
for i, radius in enumerate(radii):
    color = colors[i]
    bbox = [center - radius, center - radius, center + radius, center + radius]
    draw.ellipse(bbox, outline=color, width=line_width)

# Desenhar círculo central branco
circle_radius = 40
bbox_center = [center - circle_radius, center - circle_radius, center + circle_radius, center + circle_radius]
draw.ellipse(bbox_center, fill=(255, 255, 255, 255))

# Desenhar a lupa (haste da lupa)
# Haste diagonal em preto
lupa_start_x = center + 65
lupa_start_y = center + 65
lupa_end_x = center + 180
lupa_end_y = center + 180
draw.line([(lupa_start_x, lupa_start_y), (lupa_end_x, lupa_end_y)], fill=(0, 0, 0, 255), width=25)

# Salvar como PNG
output_path = 'frontend/favicon-transparent.png'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG')
print(f"✓ Favicon PNG criado: {output_path}")

# Converter para ICO (16x16, 32x32, 64x64)
ico_sizes = [(16, 16), (32, 32), (64, 64), (128, 128), (256, 256)]
ico_images = []

for ico_size in ico_sizes:
    resized = img.resize(ico_size, Image.Resampling.LANCZOS)
    ico_images.append(resized)

ico_path = 'frontend/favicon.ico'
ico_images[0].save(ico_path, 'ICO', sizes=[(16, 16), (32, 32), (64, 64)])
print(f"✓ Favicon ICO criado: {ico_path}")

# Criar também em vários tamanhos para Web App Manifest
for size, px in [(180, 180), (192, 192), (512, 512)]:
    resized = img.resize((px, px), Image.Resampling.LANCZOS)
    output_name = f'frontend/apple-touch-icon-{px}x{px}.png'
    resized.save(output_name, 'PNG')
    print(f"✓ Apple touch icon criado: {output_name}")

print("\n✓ Todos os favicons foram criados com sucesso!")
