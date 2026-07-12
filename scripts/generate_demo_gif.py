from PIL import Image, ImageDraw, ImageFont
import os

W, H = 520, 700
FONT_DIR = "/System/Library/Fonts"
COLORS = {
    "green": (88, 204, 2),
    "green_dark": (70, 163, 2),
    "blue": (28, 176, 246),
    "red": (255, 75, 75),
    "orange": (255, 150, 0),
    "yellow": (255, 200, 0),
    "bg": (240, 240, 240),
    "text": (75, 75, 75),
    "text_light": (119, 119, 119),
    "white": (255, 255, 255),
    "border": (229, 229, 229),
}

def load_font(size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, "Supplemental", "Arial.ttf"), size)
    except:
        try:
            return ImageFont.truetype(os.path.join(FONT_DIR, "Arial.ttf"), size)
        except:
            return ImageFont.load_default()

def rounded_rect(draw, xy, r, fill, outline=None, outline_width=2):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, r, fill=fill, outline=outline or fill, width=outline_width)

def draw_top_bar(draw):
    rounded_rect(draw, (10, 10, W - 10, 50), 14, COLORS["white"], COLORS["border"])
    # streak fire
    draw.rounded_rectangle((20, 16, 70, 44), 10, (255, 240, 230), COLORS["orange"])
    draw.text((32, 23), "🔥 3", fill=COLORS["orange"], font=load_font(16))
    # hearts
    draw.text((100, 23), "❤❤❤❤❤", fill=COLORS["red"], font=load_font(16))
    # level + XP bar
    draw.rounded_rectangle((280, 18, 410, 42), 10, (220, 220, 220))
    draw.rounded_rectangle((280, 18, 350, 42), 10, COLORS["green"])
    draw.text((420, 23), "120 XP", fill=COLORS["green"], font=load_font(14))

def draw_dashboard(draw, topic="", show_typing=False):
    # header
    draw.text((W//2 - 70, 90), "⚡", fill=COLORS["green"], font=load_font(40))
    draw.text((W//2 - 130, 140), "Duo for Everything", fill=COLORS["text"], font=load_font(26))
    draw.text((W//2 - 120, 175), "Type any topic. Learn anything.", fill=COLORS["text_light"], font=load_font(14))

    # input card
    rounded_rect(draw, (30, 220, W-30, 320), 16, COLORS["white"], COLORS["border"])
    draw.text((50, 235), "WHAT DO YOU WANT TO LEARN?", fill=COLORS["text"], font=load_font(11))
    rounded_rect(draw, (50, 258, W-50, 292), 12, (245, 245, 245), COLORS["border"])
    placeholder = topic if topic else "e.g. Advanced Git, Baking Science..."
    col = COLORS["text"] if topic else (180, 180, 180)
    text_w = draw.textlength(placeholder, font=load_font(18))
    text_x = 65
    draw.text((text_x, 265), placeholder, fill=col, font=load_font(18))
    if show_typing and topic:
        draw.rectangle((text_x + text_w + 2, 265, text_x + text_w + 6, 280), fill=COLORS["text"])
    # button
    btn_color = COLORS["green"] if topic else (200, 200, 200)
    btn_dark = COLORS["green_dark"] if topic else (180, 180, 180)
    rounded_rect(draw, (50, 300, W-50, 345), 14, btn_color)
    draw.text((W//2 - 60, 312), "GENERATE QUIZ", fill=(255, 255, 255), font=load_font(16))
    # bottom info
    rounded_rect(draw, (30, 370, W-30, 430), 14, COLORS["white"], COLORS["border"])
    draw.text((50, 385), "✓ Connected to Ollama", fill=COLORS["green"], font=load_font(13))
    draw.text((50, 405), "📦 Model: llama3.2:1b (cached)", fill=COLORS["text_light"], font=load_font(12))

def draw_loading(img):
    draw = ImageDraw.Draw(img)
    draw_dashboard(draw, "Baking Science", False)
    overlay = Image.new("RGBA", (W, H), (255, 255, 255, 180))
    draw_over = ImageDraw.Draw(overlay)
    draw_over.text((W//2 - 80, H//2 - 40), "⏳", fill=COLORS["green"], font=load_font(50))
    draw_over.text((W//2 - 100, H//2 + 10), "Generating quiz...", fill=COLORS["text"], font=load_font(18))
    draw_over.text((W//2 - 110, H//2 + 35), "Local AI is crafting questions", fill=COLORS["text_light"], font=load_font(13))
    img.paste(overlay, (0, 0), overlay)

def draw_quiz(draw, selected=-1, correct=False):
    # top bar area placeholder
    draw_top_bar(draw)
    # progress
    draw.rounded_rectangle((20, 68, W-20, 82), 6, (220, 220, 220))
    draw.rounded_rectangle((20, 68, 180, 82), 6, COLORS["green"])
    draw.text((24, 70), "3 / 10", fill=COLORS["text_light"], font=load_font(13))

    # question card
    rounded_rect(draw, (20, 98, W-20, 170), 14, COLORS["white"], COLORS["border"])
    draw.text((35, 110), "What is the primary function of", fill=COLORS["text"], font=load_font(18))
    draw.text((35, 133), "baking powder in a cake recipe?", fill=COLORS["text"], font=load_font(18))

    options = [
        "Add sweetness to the batter",
        "Create air pockets for rising",
        "Provide golden-brown color",
        "Bind ingredients together",
    ]
    correct_idx = 1

    for i, opt in enumerate(options):
        y = 188 + i * 60
        is_correct = i == correct_idx
        is_selected = i == selected

        if selected >= 0:
            if is_correct:
                c = (220, 255, 220)
                oc = COLORS["green"]
            elif is_selected and not is_correct:
                c = (255, 220, 220)
                oc = COLORS["red"]
            else:
                c = (245, 245, 245)
                oc = (200, 200, 200)
        else:
            c = COLORS["white"]
            oc = COLORS["border"]

        rounded_rect(draw, (20, y, W-20, y + 50), 12, c, oc)
        # circle indicator
        pygame = (COLORS["green"] if (selected >= 0 and is_correct) else
                  COLORS["red"] if (selected >= 0 and is_selected and not is_correct) else
                  (220, 220, 220))
        pygame2 = (COLORS["green_dark"] if (selected >= 0 and is_correct) else
                   (180, 50, 50) if (selected >= 0 and is_selected and not is_correct) else
                   (200, 200, 200))
        draw.rounded_rectangle((35, y + 10, 55, y + 30), 6, pygame)
        label = chr(65 + i)
        draw.text((41, y + 13), label, fill=(255, 255, 255), font=load_font(13))
        draw.text((65, y + 14), opt, fill=COLORS["text"], font=load_font(15))

    if selected >= 0 and correct:
        rounded_rect(draw, (20, 450, W-20, 500), 12, (220, 255, 220), COLORS["green"])
        draw.text((35, 460), "✓ Correct! +10 XP", fill=COLORS["green"], font=load_font(16))
        draw.text((35, 480), "Baking powder releases CO to help the cake rise.", fill=COLORS["text_light"], font=load_font(12))
        # next button
        rounded_rect(draw, (20, 515, W-20, 560), 14, COLORS["green"], COLORS["green_dark"])
        draw.text((W//2 - 50, 526), "Next Question →", fill=(255, 255, 255), font=load_font(16))
    elif selected >= 0 and not correct:
        rounded_rect(draw, (20, 450, W-20, 500), 12, (255, 220, 220), COLORS["red"])
        draw.text((35, 460), "✗ Incorrect! -1 Heart", fill=COLORS["red"], font=load_font(16))
        draw.text((35, 480), "Baking powder creates air pockets for rising.", fill=COLORS["text_light"], font=load_font(12))
        rounded_rect(draw, (20, 515, W-20, 560), 14, COLORS["green"], COLORS["green_dark"])
        draw.text((W//2 - 50, 526), "Next Question →", fill=(255, 255, 255), font=load_font(16))

def create_frames():
    frames = []
    draw_functions = [
        ("dashboard_empty", lambda img: draw_dashboard(ImageDraw.Draw(img))),
        ("dashboard_typing", lambda img: draw_dashboard(ImageDraw.Draw(img), "Baking Science", True)),
        ("loading", lambda img: draw_loading(img)),
        ("quiz", lambda img: draw_quiz(ImageDraw.Draw(img))),
        ("quiz_correct", lambda img: draw_quiz(ImageDraw.Draw(img), 1, True)),
        ("quiz_incorrect", lambda img: draw_quiz(ImageDraw.Draw(img), 2, False)),
    ]

    for name, fn in draw_functions:
        img = Image.new("RGB", (W, H), COLORS["bg"])
        fn(img)
        frames.append(img)
        img.save(f"/tmp/duo_frame_{name}.png")

    # duplicate some frames for timing
    expanded = []
    delays = [1500, 1000, 2000, 2500, 2000, 2000]
    for i, f in enumerate(frames):
        # show each frame multiple times based on delay
        repeat = delays[i] // 100
        for _ in range(repeat):
            expanded.append(f)
    return expanded

frames = create_frames()
out_path = os.path.join(os.path.dirname(__file__), "..", "public", "demo.gif")
frames[0].save(
    out_path,
    save_all=True,
    append_images=frames[1:],
    duration=100,
    loop=0,
)
print(f"GIF saved to {out_path} ({len(frames)} frames)")
