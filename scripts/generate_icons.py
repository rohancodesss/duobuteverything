from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = int(size * 0.05)
    draw.ellipse((margin, margin, size - margin, size - margin), fill=(88, 204, 2))
    try:
        fnt = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", int(size * 0.55))
    except:
        fnt = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), "D", font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((size - tw) // 2, (size - th) // 2 - int(size * 0.03)), "D", fill=(255, 255, 255), font=fnt)
    img.save(path)

base = os.path.join(os.path.dirname(__file__), "..", "build")
os.makedirs(base, exist_ok=True)

create_icon(512, os.path.join(base, "icon.png"))
create_icon(256, os.path.join(base, "icon-256.png"))
create_icon(48, os.path.join(base, "icon-48.png"))
create_icon(32, os.path.join(base, "icon-32.png"))
create_icon(16, os.path.join(base, "icon-16.png"))

# Convert PNG to ICO for Windows
ico_img = Image.open(os.path.join(base, "icon.png"))
ico_img.save(os.path.join(base, "icon.ico"), format="ICO", sizes=[(256, 256), (48, 48), (32, 32), (16, 16)])

print("Icons generated in build/")
