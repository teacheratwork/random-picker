"""Generate the app icons (PNG) used by the manifest.

Run from the project folder:  python tools/make_icons.py
Output: src/icons/icon-192.png, icon-512.png, icon-maskable-512.png

The icon is a die face showing five dots on a blue background.
The "maskable" variant keeps the drawing inside the central safe zone (80%),
because Android may crop it to a circle or a rounded square.
"""
from pathlib import Path

from PIL import Image, ImageDraw

BLUE = (47, 111, 222)
WHITE = (255, 255, 255)
OUT = Path(__file__).resolve().parent.parent / "src" / "icons"
SCALE = 4  # draw 4x larger, then shrink: smooth edges


def die(size: int, die_fraction: float, rounded_bg: bool) -> Image.Image:
    big = size * SCALE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded_bg:
        d.rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.22, fill=BLUE)
    else:
        d.rectangle((0, 0, big, big), fill=BLUE)

    # White die in the middle
    s = big * die_fraction
    x0 = (big - s) / 2
    d.rounded_rectangle((x0, x0, x0 + s, x0 + s), radius=s * 0.2, fill=WHITE)

    # Five dots, like the "5" face
    r = s * 0.09
    for fx, fy in [(0.27, 0.27), (0.73, 0.27), (0.5, 0.5), (0.27, 0.73), (0.73, 0.73)]:
        cx, cy = x0 + s * fx, x0 + s * fy
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BLUE)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    die(192, 0.62, rounded_bg=True).save(OUT / "icon-192.png")
    die(512, 0.62, rounded_bg=True).save(OUT / "icon-512.png")
    die(512, 0.50, rounded_bg=False).save(OUT / "icon-maskable-512.png")
    print("Icons written to", OUT)


if __name__ == "__main__":
    main()
