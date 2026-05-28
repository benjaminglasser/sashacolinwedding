"""Generate WebP variants (and small mobile sizes) of the scene/modal art.

Run from repo root:
    python3 scripts/optimize_images.py

For each PNG/JPG asset we produce:
  * <name>.webp          — full-size WebP, lossy quality 82, alpha preserved
  * <name>-sm.webp       — narrower variant (max width 900px) for phones

The originals stay on disk and remain the fallback used by the <picture>
elements when the browser doesn't support WebP. We don't ship WebP-from-source
for ``look-book.png`` because it's already a flat illustration that compresses
well; we still generate it for consistency.

Tuning notes:
  * `02-arch.png`, `03-couple.png`, `04-puppy.png` all have alpha edges
    feathered down to anti-alias the keyed-out backgrounds. WebP lossy at
    q=82 keeps those edges crisp; q<70 starts to introduce ringing around
    the puppy's fur. Don't drop quality below 80 without re-checking.
  * The mobile width target of 900px matches the largest phone viewport we
    care about at 2x DPR (450 CSS pixels). Anything wider just wastes bytes.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS = REPO_ROOT / "public" / "assets"

# (filename, large_quality, small_quality, mobile_max_width)
TARGETS = [
    ("01-bg-house.png", 82, 78, 1100),
    ("01-bg-house-wide.jpg", 82, 78, 1400),
    ("02-arch.png", 84, 80, 900),
    ("03-couple.png", 84, 80, 900),
    ("03-couple-wide.png", 84, 80, 1400),
    ("04-puppy.png", 84, 80, 900),
    ("look-book.png", 86, 82, 900),
]


def write_webp(img: Image.Image, dest: Path, quality: int) -> None:
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    if has_alpha:
        img = img.convert("RGBA")
        img.save(dest, format="WEBP", quality=quality, method=6)
    else:
        img.convert("RGB").save(dest, format="WEBP", quality=quality, method=6)


def resize_keep_aspect(img: Image.Image, max_width: int) -> Image.Image:
    w, h = img.size
    if w <= max_width:
        return img
    new_h = round(h * max_width / w)
    return img.resize((max_width, new_h), Image.LANCZOS)


def process(name: str, large_q: int, small_q: int, mobile_w: int) -> None:
    src = ASSETS / name
    if not src.exists():
        print(f"  skip (missing): {name}")
        return
    stem = src.stem
    big_dest = ASSETS / f"{stem}.webp"
    sm_dest = ASSETS / f"{stem}-sm.webp"
    with Image.open(src) as img:
        img.load()
        write_webp(img, big_dest, large_q)
        small = resize_keep_aspect(img, mobile_w)
        write_webp(small, sm_dest, small_q)
    big_kb = big_dest.stat().st_size / 1024
    sm_kb = sm_dest.stat().st_size / 1024
    src_kb = src.stat().st_size / 1024
    print(f"  {name}: {src_kb:.0f} KB -> {big_kb:.0f} KB webp ({sm_kb:.0f} KB sm)")


def main() -> None:
    print("Generating WebP variants in public/assets/ ...")
    for name, lq, sq, mw in TARGETS:
        process(name, lq, sq, mw)
    print("Done.")


if __name__ == "__main__":
    main()
