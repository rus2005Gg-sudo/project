"""Рисует lock.png — простой замок-картинку для импорта в GIMP.

    python3 make_lock.py [путь_к_png]
"""
import sys

from PIL import Image, ImageDraw

SS = 3  # суперсэмплинг для сглаживания


def main(out):
    w, h = 220 * SS, 240 * SS
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = SS
    # дужка
    d.arc((50 * s, 14 * s, 170 * s, 150 * s), 180, 360, fill=(200, 240, 58, 255), width=22 * s)
    d.rectangle((50 * s, 80 * s, 72 * s, 110 * s), fill=(200, 240, 58, 255))
    d.rectangle((148 * s, 80 * s, 170 * s, 110 * s), fill=(200, 240, 58, 255))
    # корпус
    d.rounded_rectangle((20 * s, 100 * s, 200 * s, 232 * s), radius=24 * s, fill=(166, 222, 30, 255))
    # замочная скважина
    d.ellipse((92 * s, 132 * s, 128 * s, 168 * s), fill=(8, 36, 10, 255))
    d.polygon([(100 * s, 160 * s), (120 * s, 160 * s), (124 * s, 200 * s), (96 * s, 200 * s)],
              fill=(8, 36, 10, 255))
    img.resize((220, 240), Image.LANCZOS).save(out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "lock.png")
