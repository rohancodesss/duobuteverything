from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1280, 640
FONT_DIR = "/System/Library/Fonts"

def load_font(size, bold=False):
    try:
        name = "Arial Bold" if bold else "Arial"
        return ImageFont.truetype(os.path.join(FONT_DIR, "Supplemental", f"{name}.ttf"), size)
    except:
        try:
            name = "Arial Bold" if bold else "Arial"
            return ImageFont.truetype(os.path.join(FONT_DIR, f"{name}.ttf"), size)
        except:
            return ImageFont.load_default()

img = Image.new("RGB", (W, H), (88, 204, 2))
draw = ImageDraw.Draw(img)

# diagonal accent
draw.polygon([(0, 0), (W, 0), (0, H)], fill=(70, 163, 2, 100))
draw.polygon([(W, 0), (W, H), (0, H)], fill=(70, 163, 2, 60))

# decorative circles
draw.ellipse((-80, -80, 160, 160), fill=(100, 220, 20), outline=None)
draw.ellipse((W-120, H-120, W+40, H+40), fill=(100, 220, 20), outline=None)
draw.ellipse((W//2-200, -100, W//2+100, 200), fill=(100, 220, 20), outline=None)

# main title
draw.text((100, 150), "Duo for", fill=(255, 255, 255), font=load_font(72, True))
draw.text((100, 230), "Everything", fill=(255, 255, 255), font=load_font(72, True))

# tagline
draw.text((100, 330), "Fully offline, on-device micro-learning for any topic", fill=(230, 255, 200), font=load_font(24))

# feature pills
features = ["⚡ Local AI (Ollama)", "❤️ Gamification", "📱 Offline-first"]
for i, feat in enumerate(features):
    x = 100 + i * 240
    draw.rounded_rectangle((x, 390, x + 210, 430), 20, (255, 255, 255, 40))
    draw.text((x + 15, 398), feat, fill=(255, 255, 255), font=load_font(18))

# right side - mock phone frame
phone_x, phone_y = 780, 100
phone_w, phone_h = 360, 440
draw.rounded_rectangle((phone_x, phone_y, phone_x + phone_w, phone_y + phone_h), 30, (30, 30, 30))
draw.rounded_rectangle((phone_x + 10, phone_y + 10, phone_x + phone_w - 10, phone_y + phone_h - 10), 24, (240, 240, 240))

# phone screen content
inner_draw = ImageDraw.Draw(img)

# mini top bar
inner_draw.rounded_rectangle((phone_x + 20, phone_y + 25, phone_x + phone_w - 20, phone_y + 55), 10, (255, 255, 255))
inner_draw.text((phone_x + 30, phone_y + 32), "🔥 5  ❤❤❤❤❤", fill=(75, 75, 75), font=load_font(14))

# question
inner_draw.text((phone_x + 30, phone_y + 80), "Type any topic to", fill=(75, 75, 75), font=load_font(18, True))
inner_draw.text((phone_x + 30, phone_y + 105), "generate a quiz:", fill=(75, 75, 75), font=load_font(18, True))

# input field
inner_draw.rounded_rectangle((phone_x + 25, phone_y + 135, phone_x + phone_w - 25, phone_y + 170), 10, (255, 255, 255), (200, 200, 200))
inner_draw.text((phone_x + 35, phone_y + 144), "Roman History", fill=(180, 180, 180), font=load_font(16))

# button
inner_draw.rounded_rectangle((phone_x + 25, phone_y + 185, phone_x + phone_w - 25, phone_y + 225), 14, (88, 204, 2))
inner_draw.text((phone_x + 65, phone_y + 196), "GENERATE QUIZ", fill=(255, 255, 255), font=load_font(16, True))

# quiz preview below
inner_draw.rounded_rectangle((phone_x + 25, phone_y + 250, phone_x + phone_w - 25, phone_y + 310), 12, (255, 255, 255), (200, 200, 200))
inner_draw.text((phone_x + 35, phone_y + 260), "Who was the first Roman", fill=(75, 75, 75), font=load_font(14))
inner_draw.text((phone_x + 35, phone_y + 278), "emperor?", fill=(75, 75, 75), font=load_font(14))

# four mini options
for i in range(4):
    oy = phone_y + 325 + i * 32
    inner_draw.rounded_rectangle((phone_x + 25, oy, phone_x + phone_w - 25, oy + 28), 8, (255, 255, 255), (200, 200, 200))
    inner_draw.text((phone_x + 35, oy + 5), ["Augustus", "Julius Caesar", "Nero", "Marcus Aurelius"][i], fill=(75, 75, 75), font=load_font(12))

# bottom trio icons
inner_draw.text((phone_x + 120, phone_y + 405), "❤❤❤❤❤  📈  🔥", fill=(75, 75, 75), font=load_font(18))

# bottom bar
draw.rounded_rectangle((0, H - 60, W, H), 0, (70, 163, 2))
draw.text((100, H - 40), "Vite + React + TypeScript + TailwindCSS + Zustand + Ollama", fill=(200, 255, 180), font=load_font(16))

out_path = os.path.join(os.path.dirname(__file__), "..", "public", "social-preview.png")
img.save(out_path)
print(f"Banner saved to {out_path}")
