#!/usr/bin/env python3
"""
Gera logo AchadoCerto.VIP em PNG com alta qualidade
Técnica 2: Renderização com PIL/Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Cores do tema
NAVY = "#142864"
BRIGHT_BLUE = "#1F90FF"
GOLD = "#D4AF37"
WHITE = "white"

# Dimensões
WIDTH, HEIGHT = 1200, 300
PADDING = 40

def create_logo_png():
    """Cria logo em PNG com renderização profissional"""
    
    # Criar imagem com fundo branco
    img = Image.new('RGB', (WIDTH, HEIGHT), WHITE)
    draw = ImageDraw.Draw(img)
    
    # Tentar usar fontes disponíveis no sistema
    try:
        font_bold = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 130)
        font_regular = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 125)
        font_badge = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 35)
    except:
        # Fallback para fontes padrão
        font_bold = ImageFont.load_default()
        font_regular = ImageFont.load_default()
        font_badge = ImageFont.load_default()
    
    y_baseline = 155
    
    # 1. "Achad" em navy bold
    draw.text((PADDING, y_baseline - 50), "Achad", fill=NAVY, font=font_bold)
    
    # 2. Lupa (magnifying glass) em bright blue
    # Centro da lupa: aproximadamente depois de "Achad"
    center_x, center_y = 240, 125
    radius = 40
    
    # Desenha círculo da lupa
    draw.ellipse(
        [(center_x - radius, center_y - radius), (center_x + radius, center_y + radius)],
        outline=BRIGHT_BLUE,
        width=9
    )
    
    # Desenha handle da lupa (45 graus)
    start_x, start_y = 268, 153
    end_x, end_y = 340, 225
    draw.line((start_x, start_y, end_x, end_y), fill=BRIGHT_BLUE, width=9)
    
    # 3. "Certo" em navy regular (depois da lupa)
    draw.text((360, y_baseline - 50), "Certo", fill=NAVY, font=font_regular)
    
    # 4. Badge VIP em dourado brilhante
    badge_x, badge_y = 815, 85
    badge_w, badge_h = 95, 70
    
    # Fundo da badge em navy
    draw.rectangle(
        [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
        fill=NAVY,
        outline=GOLD,
        width=3
    )
    
    # VIP em GOLD (maior contraste)
    vip_x = badge_x + badge_w // 2
    vip_y = badge_y + badge_h // 2
    draw.text((vip_x - 15, vip_y - 15), "VIP", fill=GOLD, font=font_badge)
    
    # Salvar múltiplos formatos
    os.makedirs("frontend/images", exist_ok=True)
    os.makedirs("public/images", exist_ok=True)
    
    # Salvar como PNG com transparência (em vez de fundo branco)
    img_transparent = Image.new('RGBA', (WIDTH, HEIGHT), (255, 255, 255, 0))
    draw_t = ImageDraw.Draw(img_transparent)
    
    # Redraw com transparência
    draw_t.text((PADDING, y_baseline - 50), "Achad", fill=(20, 40, 100, 255), font=font_bold)
    draw_t.ellipse(
        [(center_x - radius, center_y - radius), (center_x + radius, center_y + radius)],
        outline=(31, 144, 255, 255),
        width=9
    )
    draw_t.line((start_x, start_y, end_x, end_y), fill=(31, 144, 255, 255), width=9)
    draw_t.text((360, y_baseline - 50), "Certo", fill=(20, 40, 100, 255), font=font_regular)
    draw_t.rectangle(
        [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
        fill=(20, 40, 100, 255),
        outline=(212, 175, 55, 255),
        width=3
    )
    draw_t.text((vip_x - 15, vip_y - 15), "VIP", fill=(212, 175, 55, 255), font=font_badge)
    
    # Salvar versões
    file_paths = [
        "frontend/logo-achadocerto.png",
        "public/logo-achadocerto.png",
        "public/images/logo-achadocerto.png"
    ]
    
    for path in file_paths:
        img_transparent.save(path, 'PNG', quality=95)
        print(f"✓ Salvo: {path}")
    
    # Também salvar SVG melhorado
    save_improved_svg()
    
    print("\n✓ Logo PNG gerado com sucesso!")
    print("  - Transparência: sim")
    print("  - Qualidade: máxima (95%)")
    print("  - VIP Badge: DOURADO (#D4AF37)")
    
def save_improved_svg():
    """Salva versão melhorada do SVG com VIP em dourado"""
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300">
  <!-- Background -->
  <rect width="1200" height="300" fill="white" opacity="0"/>
  
  <!-- "Achad" text in bold navy-blue -->
  <text x="40" y="155" font-family="Arial, sans-serif" font-size="130" font-weight="bold" fill="#142864" letter-spacing="-2">
    Achad
  </text>
  
  <!-- Magnifying glass replacing "O" -->
  <circle cx="240" cy="125" r="40" fill="none" stroke="#1F90FF" stroke-width="9"/>
  <line x1="268" y1="153" x2="340" y2="225" stroke="#1F90FF" stroke-width="9" stroke-linecap="round"/>
  
  <!-- "Certo" text in regular navy-blue -->
  <text x="360" y="155" font-family="Arial, sans-serif" font-size="125" font-weight="normal" fill="#142864" letter-spacing="-2">
    Certo
  </text>
  
  <!-- VIP Badge with GOLD text -->
  <rect x="815" y="85" width="95" height="70" rx="12" ry="12" fill="#142864" stroke="#D4AF37" stroke-width="3"/>
  
  <!-- VIP text in GOLD - much better contrast -->
  <text x="862" y="135" font-family="Arial, sans-serif" font-size="35" font-weight="bold" fill="#D4AF37" text-anchor="middle">
    VIP
  </text>
</svg>'''
    
    svg_paths = [
        "frontend/logo-achadocerto.svg",
        "public/logo-achadocerto.svg",
        "public/images/logo-achadocerto.svg"
    ]
    
    for path in svg_paths:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"✓ SVG atualizado: {path}")

if __name__ == "__main__":
    create_logo_png()
