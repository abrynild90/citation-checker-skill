# A GPS navigation satellite (about 2 m cube bus, two three-panel wings, a phased array of L-band helix antennas on the Earth-facing deck, a
# crosslink dish), built from the sats.py parts. Model axes as in sats.py: +Z the Earth-facing deck, wings along +-Y.
import math

import kit
import sats


def gps(name='gps'):
    m = sats.mats()
    sx, sy, sz = 1.9, 1.9, 2.4
    parts = sats.bus(name, sx, sy, sz)
    parts += sats.deck_kit(name + '-dk', sx, sy, sz, horns=0, trackers=1, omni=False)
    for k, (rad, cnt, i) in enumerate([(0.62, 9, i) for i in range(9)] + [(0.22, 3, i) for i in range(3)]):  # nine helix elements round the rim, three inside
        a = 2 * math.pi * i / cnt
        parts.append(kit.cyl(f'{name}-helix{k}', 0.1, 0.34, loc=(rad * math.cos(a), rad * math.sin(a), sz / 2 + 0.2), material=m['gold'], r2=0.04, verts=16))
    parts.append(kit.cyl(f'{name}-xlink', 0.22, 0.06, loc=(-0.6, 0.55, sz / 2 + 0.5), material=m['dish'], r2=0.2, verts=24))
    for side in (1, -1):
        parts += sats.solar_wing(f'{name}-w{side}', side, (0, side * sy / 2, 0), n=3, pw=2.0, ph=2.4, yoke=0.7)
    return parts
