"""Finish the Blender poster renders: a soft bloom on the bright parts (flashes, plumes, city lights), a gentle vignette, then the page's
poster size and format (960 x 540 WebP, quality 82, as tools/make_posters.mjs writes them).

    python3 tools/blender/finish.py [--src tools/blender/out] [--dst src/assets/posters] [--w 960] [--q 82] [ids...]
    python3 tools/blender/finish.py --hero     (the hero limb: tools/blender/hero.py's renders -> src/assets/hero-limb.jpg)
"""
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def bloom(img: Image.Image, threshold: int = 212, radii=(0.005, 0.02), gain: float = 0.4) -> Image.Image:
    """Screen-blend blurred copies of the pixels brighter than `threshold` back over the picture."""
    lum = img.convert('L').point(lambda v: 255 if v > threshold else int(255 * (v / threshold) ** 6))
    bright = ImageChops.multiply(img, Image.merge('RGB', (lum,) * 3))
    out = img
    for r in radii:
        glow = bright.filter(ImageFilter.GaussianBlur(max(1, img.width * r)))
        glow = glow.point(lambda v: min(255, int(v * gain * 2)))
        out = ImageChops.screen(out, glow)
    return out


def vignette(img: Image.Image, strength: float = 0.22) -> Image.Image:
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).ellipse((-w * 0.25, -h * 0.35, w * 1.25, h * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(w * 0.12))
    dark = img.point(lambda v: int(v * (1 - strength)))
    return Image.composite(img, dark, mask)


def finish(src: Path, dst: Path, width: int, quality: int) -> int:
    img = Image.open(src).convert('RGB')
    img = vignette(bloom(img))
    img = img.resize((width, round(width * 9 / 16)), Image.LANCZOS)
    img.save(dst, 'WEBP', quality=quality, method=6)
    return dst.stat().st_size


def hero(src: Path, dst: Path, width: int = 2880, quality: int = 78) -> int:
    """Straighten the limb: shift every column up so the planet's edge (found in the silhouette render) sits on the top row, then darken with
    depth so the law labels drawn over the ground keep their contrast. src/hero-timeline.js bends the strip back onto the page's curve."""
    img = Image.open(src / 'hero.png').convert('RGB')
    alpha = Image.open(src / 'hero-mask.png').getchannel('A').load()
    w, h = img.size
    tops = []
    for x in range(w):
        y = next((y for y in range(h) if alpha[x, y] > 127), None)
        if y is None:
            raise SystemExit(f'column {x} never meets the planet: lower horizon_sy in hero.py')
        tops.append(y)
    keep = h - max(tops)
    if keep < h * 0.3:
        raise SystemExit(f'only {keep}px of ground below the limb at the edges: raise horizon_sy or the lens in hero.py')
    strip = Image.new('RGB', (w, keep))
    for x, y in enumerate(tops):
        strip.paste(img.crop((x, y, x + 1, y + keep)), (x, 0))
    shade = Image.linear_gradient('L').resize((w, keep)).point(lambda v: int(255 - v * 0.5))  # 100 % at the limb to 50 % at the bottom
    strip = ImageChops.multiply(strip, Image.merge('RGB', (shade,) * 3))
    strip = strip.resize((width, round(keep * width / w)), Image.LANCZOS)
    out = dst / 'hero-limb.jpg'
    strip.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
    print(f'hero-limb.jpg {strip.size[0]}x{strip.size[1]} {out.stat().st_size // 1024} KB')
    return out.stat().st_size


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(HERE / 'out'))
    ap.add_argument('--dst', default=str(ROOT / 'src/assets/posters'))
    ap.add_argument('--w', type=int, default=960)
    ap.add_argument('--q', type=int, default=82)
    ap.add_argument('--hero', action='store_true')
    ap.add_argument('ids', nargs='*')
    a = ap.parse_args()
    src, dst = Path(a.src), Path(a.dst)
    if a.hero:
        hero(src, ROOT / 'src/assets')
        return
    files = [src / f'{i}.png' for i in a.ids] if a.ids else sorted(src.glob('*.png'))
    missing = [f for f in files if not f.exists()]
    if missing or not files:
        raise SystemExit(f'no renders to finish (missing: {[f.name for f in missing]}); run posters.py first')
    dst.mkdir(parents=True, exist_ok=True)
    for f in files:
        size = finish(f, dst / f'{f.stem}.webp', a.w, a.q)
        print(f'{f.stem}.webp {size // 1024} KB')


if __name__ == '__main__':
    main()
