"""Convert near-black background to transparent for storybook overlay assets.

Run from repo root:
    python3 scripts/key_black_to_alpha.py

Reads JPEG-on-disk images at public/assets/<name>.png and rewrites them as
true PNG with alpha. Asset 1 is left untouched (it is the opaque backdrop).

Note: ``03-couple-wide.png`` was keyed once with tighter thresholds (LOW=4,
HIGH=14) because the figures contain dark navy clothing the default LOW/HIGH
treats as semi-transparent. It is intentionally not in TARGETS to avoid being
re-keyed with the wrong thresholds; if you ever need to redo it from the
original JPEG, run with LOW=4 HIGH=14.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS = REPO_ROOT / "public" / "assets"

# Pixels whose max(R, G, B) is below LOW are fully transparent.
# Pixels whose max(R, G, B) is above HIGH are fully opaque.
# In between we feather linearly so edges are not aliased.
LOW = 18
HIGH = 48

TARGETS = [
    "02-arch.png",
    "03-couple.png",
    "04-puppy.png",
]


def key_out_black(src: Path) -> None:
    img = Image.open(src).convert("RGB")
    pixels = img.load()
    w, h = img.size
    out = Image.new("RGBA", (w, h))
    out_pixels = out.load()
    span = max(1, HIGH - LOW)
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            m = max(r, g, b)
            if m <= LOW:
                a = 0
            elif m >= HIGH:
                a = 255
            else:
                a = int(round((m - LOW) * 255 / span))
            out_pixels[x, y] = (r, g, b, a)
    out.save(src, format="PNG", optimize=True)


def main() -> None:
    for name in TARGETS:
        path = ASSETS / name
        print(f"Keying {path.name} ...")
        key_out_black(path)
    print("Done.")


if __name__ == "__main__":
    main()
