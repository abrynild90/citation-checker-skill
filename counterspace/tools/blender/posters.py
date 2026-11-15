# Renders one poster picture per 3D explainer with Blender Cycles (photographic Earth, lit spacecraft, glowing trails), no labels, 16:9.
#   blender -b -P tools/blender/posters.py -- [--only starfish,rpo] [--out DIR] [--samples 160] [--w 1920]
# Writes <out>/<id>.png (default tools/blender/out). Then `python3 tools/blender/finish.py` grades them and writes src/assets/posters/<id>.webp,
# which the page build embeds (gallery cards and the picture shown while a live scene loads).
# Places, heights and colours follow src/scenes/configs/*.js. The scenes are in scenes_*.py, the composition helpers in compose.py.
import argparse
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import kit  # noqa: E402
import models as M  # noqa: E402
import scenes_geo as G  # noqa: E402
import scenes_kinetic as Kn  # noqa: E402
import scenes_launch as L  # noqa: E402
import scenes_leo as Le  # noqa: E402

SCENES = {
    'starfish': Kn.starfish, 'solwind': L.solwind, 'fengyun': Kn.fengyun, 'burnt-frost': L.burnt_frost, 'dn2': L.dn2, 'shakti': Kn.shakti,
    'cosmos1408': Le.cosmos1408, 'gnss': Le.gnss, 'viasat': G.viasat, 'laser': Le.laser, 'sj21-tug': G.sj21_tug, 'rpo': G.rpo, 'spaceplanes': Le.spaceplanes,
}


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--out', default=str(HERE / 'out'))
    ap.add_argument('--samples', type=int, default=160)
    ap.add_argument('--w', type=int, default=1920)
    a = ap.parse_args(argv)
    ids = a.only.split(',') if a.only else list(SCENES)
    unknown = [i for i in ids if i not in SCENES]
    if unknown:
        raise SystemExit(f'unknown scene ids: {unknown}; known: {list(SCENES)}')
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for sid in ids:
        t = time.time()
        kit.reset((a.w, round(a.w * 9 / 16)), a.samples)
        M.reset_materials()
        SCENES[sid]()
        kit.render(out / f'{sid}.png')
        print(f'POSTER {sid} {time.time() - t:.1f}s', flush=True)


if __name__ == '__main__':
    main()
