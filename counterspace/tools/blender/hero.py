# Renders the Earth's limb for the hero picture: the Atlantic, Europe and Africa seen from orbit in the morning, as a very wide strip.
#   blender -b -P tools/blender/hero.py -- [--out DIR] [--samples 192]
# Writes <out>/hero.png (the picture) and <out>/hero-mask.png (the planet's silhouette, used to find the limb in each column).
# Then `python3 tools/blender/finish.py --hero` straightens the limb and writes src/assets/hero-limb.jpg, which src/hero-timeline.js bends
# back onto the page's own curve at any screen width.
import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import kit  # noqa: E402
from posters import orbit_view, base  # noqa: E402

SUN = kit.ll(22, 95)  # morning over Europe, the Sun beyond the limb
W, H, LENS = 3600, 1400, 100  # far and long: only a gentle arc of the limb crosses the strip, so every column meets the planet


def scene(mask=False):
    kit.reset((W, H), 1 if mask else 192)
    sc = kit.bpy.context.scene
    if mask:
        sc.cycles.use_denoising = False
        sc.render.film_transparent = True
        sc.render.image_settings.color_mode = 'RGBA'
        kit.world_stars(strength=0)
        kit.earth(SUN, clouds=0, atmosphere=False)
    else:
        base(SUN, clouds=0.34)
    orbit_view(0.0, -12.0, 15900, heading=24, horizon_sy=0.86, lens=LENS)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(HERE / 'out'))
    ap.add_argument('--samples', type=int, default=192)
    a = ap.parse_args(argv)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    scene(mask=True)
    kit.render(out / 'hero-mask.png')
    scene()
    kit.bpy.context.scene.cycles.samples = a.samples
    kit.render(out / 'hero.png')
    print('HERO done', flush=True)


if __name__ == '__main__':
    main()
