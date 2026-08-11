#!/usr/bin/env python3
"""Make record badge PNG corners transparent (circular crop).

Делает углы PNG-медалей прозрачными (круглая маска).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

RECORDS = Path(__file__).resolve().parents[1] / "img" / "records"


def circularize(path: Path) -> bool:
    """Set pixels outside the inscribed circle to transparent.

    Пиксели вне вписанной окружности → прозрачные.
    """
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    inset = 1
    draw.ellipse((inset, inset, w - 1 - inset, h - 1 - inset), fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask=mask)
    # Only rewrite if corners were opaque non-transparent
    before = im.getpixel((0, 0))[3]
    after = out.getpixel((0, 0))[3]
    if before == after == 0:
        return False
    out.save(path)
    return True


def main() -> None:
    """Process PNGs that have opaque white/light corners.

    Обрабатывает PNG с непрозрачными светлыми углами.
    """
    changed = []
    for path in sorted(RECORDS.glob("*.png")):
        im = Image.open(path).convert("RGBA")
        c = im.getpixel((0, 0))
        # White-ish or any fully opaque corner that isn't already transparent
        if c[3] < 10:
            continue
        if c[0] > 200 and c[1] > 200 and c[2] > 200:
            if circularize(path):
                changed.append(path.name)
        elif path.name == "ideology_autocracy_count.png":
            if circularize(path):
                changed.append(path.name)
    print("updated", changed or "(none)")


if __name__ == "__main__":
    main()
