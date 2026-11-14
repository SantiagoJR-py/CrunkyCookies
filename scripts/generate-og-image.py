#!/usr/bin/env python3
"""Genera la imagen Open Graph 1200x630 para previews en redes sociales."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og-image.png"
LOGO = ROOT / "public" / "fotos" / "logo.png"

# Paleta Crunky
CREMA = (245, 236, 215)
ROSA = (232, 196, 184)
ROSA_LIGHT = (242, 213, 192)
CHOCOLATE = (74, 44, 23)
CHOCOLATE_SOFT = (122, 74, 40)
DORADO = (201, 164, 122)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient_bg():
    img = Image.new("RGB", (W, H), CREMA)
    px = img.load()
    for y in range(H):
        for x in range(W):
            t = (x / W * 0.35 + y / H * 0.65)
            r = lerp(CREMA[0], ROSA_LIGHT[0], t)
            g = lerp(CREMA[1], ROSA_LIGHT[1], t)
            b = lerp(CREMA[2], ROSA[2], t)
            px[x, y] = (r, g, b)
    return img


def draw_cookie(draw, cx, cy, r, chips=True):
    draw.ellipse((cx - r - 4, cy - r - 4, cx + r + 4, cy + r + 4), fill=(92, 58, 30))
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(200, 138, 70))
    draw.ellipse((cx - r * 0.55, cy - r * 0.55, cx + r * 0.2, cy + r * 0.2), fill=(232, 200, 138))
    if chips:
        for ox, oy, cr in [(-r * 0.3, -r * 0.2, r * 0.12), (r * 0.15, -r * 0.25, r * 0.1),
                             (r * 0.25, r * 0.1, r * 0.11), (-r * 0.1, r * 0.25, r * 0.1),
                             (r * 0.05, r * 0.3, r * 0.09)]:
            draw.ellipse((cx + ox - cr, cy + oy - cr, cx + ox + cr, cy + oy + cr), fill=(44, 21, 5))


def load_font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main():
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    # Blobs decorativos
    blob = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blob)
    bd.ellipse((900, -80, 1300, 320), fill=(*ROSA, 90))
    bd.ellipse((-120, 380, 280, 780), fill=(*DORADO, 70))
    blob = blob.filter(ImageFilter.GaussianBlur(40))
    img = Image.alpha_composite(img.convert("RGBA"), blob).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Galletas decorativas
    draw_cookie(draw, 980, 420, 95)
    draw_cookie(draw, 1050, 180, 55)
    draw_cookie(draw, 880, 120, 38)

    # Logo
    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA")
        logo = logo.resize((130, 130), Image.Resampling.LANCZOS)
        img.paste(logo, (80, 80), logo)

    # Textos
    title_font = load_font(72, bold=True)
    sub_font = load_font(34, bold=False)
    body_font = load_font(26, bold=False)
    tag_font = load_font(22, bold=True)

    draw.text((80, 230), "Crunky Cookies", font=title_font, fill=CHOCOLATE)
    draw.text((80, 320), "Galletas estilo New York", font=sub_font, fill=CHOCOLATE_SOFT)
    draw.text((80, 375), "hechas a mano en Girardot", font=sub_font, fill=CHOCOLATE_SOFT)

    draw.line((80, 440, 520, 440), fill=DORADO, width=2)
    draw.text((80, 465), "Suaves por dentro · Crujientes por fuera", font=body_font, fill=CHOCOLATE_SOFT)
    draw.text((80, 510), "Pide por WhatsApp → crunkycookies.com", font=body_font, fill=CHOCOLATE)

    # Badge
    badge_text = "🍪  Haz tu pedido"
    bb = draw.textbbox((0, 0), badge_text, font=tag_font)
    bw, bh = bb[2] - bb[0] + 40, bb[3] - bb[1] + 24
    draw.rounded_rectangle((80, 555, 80 + bw, 555 + bh), radius=20, fill=CHOCOLATE)
    draw.text((100, 565), badge_text, font=tag_font, fill=CREMA)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Generada: {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
