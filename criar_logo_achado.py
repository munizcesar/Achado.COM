from PIL import Image, ImageDraw, ImageFont
import math
import os

# Cores definidas
NAVY_BLUE = (20, 40, 100)  # #142864
BRIGHT_BLUE = (31, 144, 255)  # #1F90FF
WHITE = (255, 255, 255)

# Dimensões
WIDTH = 1200
HEIGHT = 300
img = Image.new('RGB', (WIDTH, HEIGHT), WHITE)
draw = ImageDraw.Draw(img, 'RGBA')

# Tentar carregar fonte bold (sistema)
try:
    font_bold = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 100)
    font_regular = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 90)
    font_vip = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 28)
except:
    font_bold = ImageFont.load_default()
    font_regular = ImageFont.load_default()
    font_vip = ImageFont.load_default()

# Posições
x_start = 50
y_center = HEIGHT // 2
y_text = y_center - 35

# Desenhar "Achado" em bold
text_achado = "Achado"
draw.text((x_start, y_text), text_achado, font=font_bold, fill=NAVY_BLUE)

# Calcular a posição da lupa (substitui o O)
# Primeiro, obter largura de "Achad"
bbox = draw.textbbox((x_start, y_text), "Achad", font=font_bold)
achad_width = bbox[2] - bbox[0]
lupa_x = x_start + achad_width + 20
lupa_y = y_center

# Desenhar a lupa (círculo + haste)
lupa_radius = 35
# Círculo da lupa em azul brilhante
draw.ellipse(
    [lupa_x - lupa_radius, lupa_y - lupa_radius, 
     lupa_x + lupa_radius, lupa_y + lupa_radius],
    outline=BRIGHT_BLUE,
    width=8
)

# Haste da lupa (45 graus, para baixo-direita)
handle_length = 35
handle_angle = 45
handle_rad = math.radians(handle_angle)
handle_end_x = lupa_x + lupa_radius * math.cos(handle_rad) + handle_length * math.cos(handle_rad)
handle_end_y = lupa_y + lupa_radius * math.sin(handle_rad) + handle_length * math.sin(handle_rad)

draw.line(
    [(lupa_x + lupa_radius * math.cos(handle_rad), 
      lupa_y + lupa_radius * math.sin(handle_rad)),
     (handle_end_x, handle_end_y)],
    fill=BRIGHT_BLUE,
    width=8
)

# Posição de "Certo" (após a lupa)
x_certo = lupa_x + lupa_radius + 35
draw.text((x_certo, y_text), "Certo", font=font_regular, fill=NAVY_BLUE)

# Badge VIP (arredondado)
bbox_certo = draw.textbbox((x_certo, y_text), "CertoV", font=font_regular)
x_vip_badge = bbox_certo[2] + 30
y_vip_center = y_center

# Dimensões do badge
badge_width = 70
badge_height = 55
badge_radius = 8

# Desenhar retângulo arredondado (simplificado com retângulo + círculos)
draw.rectangle(
    [x_vip_badge - badge_width//2, y_vip_center - badge_height//2,
     x_vip_badge + badge_width//2, y_vip_center + badge_height//2],
    fill=NAVY_BLUE
)

# Desenhar círculos nos cantos para arredondar
corners = [
    (x_vip_badge - badge_width//2 + badge_radius, y_vip_center - badge_height//2 + badge_radius),
    (x_vip_badge + badge_width//2 - badge_radius, y_vip_center - badge_height//2 + badge_radius),
    (x_vip_badge - badge_width//2 + badge_radius, y_vip_center + badge_height//2 - badge_radius),
    (x_vip_badge + badge_width//2 - badge_radius, y_vip_center + badge_height//2 - badge_radius),
]

for corner in corners:
    draw.ellipse([corner[0] - badge_radius, corner[1] - badge_radius,
                  corner[0] + badge_radius, corner[1] + badge_radius],
                 fill=NAVY_BLUE)

# Adicionar texto "VIP" no badge
draw.text((x_vip_badge, y_vip_center - 15), "VIP", font=font_vip, fill=WHITE, anchor="mm")

# Salvar como PNG
output_path = 'frontend/logo-achadocerto.png'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG')
print(f"✓ Logo PNG criado: {output_path}")

# Copiar também para public
import shutil
shutil.copy(output_path, 'public/logo-achadocerto.png')
print(f"✓ Logo copiado para: public/logo-achadocerto.png")

print("\n✓ Logo profissional criado com sucesso!")
