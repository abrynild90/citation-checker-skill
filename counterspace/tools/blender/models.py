# Spacecraft, rockets and aircraft for the poster renders, built from primitives. Each builder returns the list of parts in model space
# (+X forward/nose, +Z up, about one unit across); kit.group() parents, scales and aims them. Illustrative shapes, not engineering models.
import math

import bpy

import kit

_M = {}


def m(key):
    """Shared materials, made once per scene."""
    if key in _M and _M[key].name in bpy.data.materials:
        return _M[key]
    make = {
        'gold': lambda: kit.mli_gold('mli-gold'),
        'silver': lambda: kit.mli_gold('mli-silver', '#8e939c', '#e6e8ee'),
        'cells': lambda: kit.solar_cells(),
        'cells-iss': lambda: kit.solar_cells('#5a3d14', 5.0, '#7a5520'),
        'white': lambda: kit.mat('white', '#c9cdd3', rough=0.5, coat=0.15),
        'grey': lambda: kit.mat('grey', '#8a9099', metallic=0.2, rough=0.5),
        'darkgrey': lambda: kit.mat('darkgrey', '#3a3f47', metallic=0.3, rough=0.45),
        'black': lambda: kit.mat('black', '#121418', rough=0.6),
        'alu': lambda: kit.mat('alu', '#c8ccd3', metallic=1.0, rough=0.22),
        'dish': lambda: kit.mat('dish', '#f4f4f0', rough=0.3, coat=0.4),
        'glass': lambda: kit.mat('glass', '#0d1622', metallic=0.8, rough=0.08, coat=1.0),
        'nozzle': lambda: kit.mat('nozzle', '#2a2420', metallic=1.0, rough=0.35),
    }[key]
    _M[key] = make()
    return _M[key]


def reset_materials():
    _M.clear()


def _wing(name, span, chord, thick=0.012, gap=0.08, side=1, segments=3, mat_key='cells'):
    """A solar array wing along ±Y: a boom then `segments` panels."""
    parts = [kit.cyl(f'{name}-boom', 0.012, gap, loc=(0, side * gap / 2, 0), rot=(math.pi / 2, 0, 0), material=m('alu'), verts=12)]
    seg = span / segments
    for i in range(segments):
        y = side * (gap + seg * (i + 0.5))
        parts.append(kit.box(f'{name}-p{i}', (chord, seg * 0.97, thick), loc=(0, y, 0), material=m(mat_key)))
    return parts


def sat_box(name, size=(1.0, 0.9, 1.1), mli='gold', span=2.4, chord=0.8, dish=True, dish_r=0.32, panels=2, reflectors=0):
    """A box bus in foil with one or two solar wings and a dish on its forward face."""
    sx, sy, sz = size
    parts = [kit.box(f'{name}-bus', size, material=m(mli), bevel=0.02)]
    parts.append(kit.box(f'{name}-deck', (sx * 1.02, sy * 1.02, 0.05), loc=(0, 0, sz / 2 + 0.02), material=m('white')))
    for side in ((1, -1) if panels == 2 else (1,)):
        for p in _wing(f'{name}-w{side}', span, chord, side=side):
            p.location.y += side * sy / 2
            parts.append(p)
    if dish:
        parts.append(kit.sphere(f'{name}-dish', dish_r, loc=(sx / 2 + 0.06, 0, sz * 0.12), material=m('dish'), scale=(0.28, 1, 1)))
        parts.append(kit.cyl(f'{name}-feed', 0.018, 0.22, loc=(sx / 2 + 0.16, 0, sz * 0.12), rot=(0, math.pi / 2, 0), material=m('alu'), verts=12))
    for k in range(reflectors):  # large reflectors on GEO communications satellites
        y = (k - (reflectors - 1) / 2) * sy * 1.1
        parts.append(kit.sphere(f'{name}-rf{k}', 0.42, loc=(sx * 0.2, y, sz / 2 + 0.25), material=m('dish'), scale=(1, 1, 0.22)))
    parts.append(kit.cyl(f'{name}-nz', 0.07, 0.12, loc=(-sx / 2 - 0.05, 0, 0), rot=(0, math.pi / 2, 0), material=m('nozzle'), r2=0.04, verts=24))
    parts.append(kit.cyl(f'{name}-ant', 0.008, 0.35, loc=(sx * 0.3, sy * 0.3, sz / 2 + 0.2), material=m('alu'), verts=8))
    return parts


def sat_drum(name, r=0.45, h=1.0, paddles=True):
    """A cylindrical body covered in cells (Solwind P78-1, Cosmos 1408 class) with two paddles."""
    parts = [kit.cyl(f'{name}-body', r, h, rot=(0, math.pi / 2, 0), material=m('cells'), verts=16, smooth=False)]
    for k, x in (('A', h / 2), ('B', -h / 2)):
        parts.append(kit.cyl(f'{name}-cap{k}', r * 1.02, 0.06, loc=(x, 0, 0), rot=(0, math.pi / 2, 0), material=m('silver'), verts=16))
    parts.append(kit.cyl(f'{name}-mast', 0.03, 0.7, loc=(h / 2 + 0.35, 0, 0), rot=(0, math.pi / 2, 0), material=m('alu'), verts=12))
    if paddles:
        for side in (1, -1):
            for p in _wing(f'{name}-pd{side}', 1.4, 0.55, side=side, segments=2):
                p.location.y += side * r
                parts.append(p)
    return parts


def rocket(name, length=1.0, r=0.05, body='white', bands=2, fins=True):
    """A slender rocket, nose toward +X, nozzle at x = -length/2."""
    parts = [kit.cyl(f'{name}-body', r, length * 0.82, rot=(0, math.pi / 2, 0), material=m(body), verts=32)]
    parts.append(kit.cyl(f'{name}-nose', r, length * 0.18, loc=(length * 0.5, 0, 0), rot=(0, math.pi / 2, 0), material=m(body), r2=0.002, verts=32))
    for i in range(bands):
        x = -length * 0.3 + i * length * 0.32
        parts.append(kit.cyl(f'{name}-band{i}', r * 1.01, length * 0.03, loc=(x, 0, 0), rot=(0, math.pi / 2, 0), material=m('black'), verts=32))
    parts.append(kit.cyl(f'{name}-ring', r * 1.03, length * 0.02, loc=(length * 0.12, 0, 0), rot=(0, math.pi / 2, 0), material=m('darkgrey'), verts=32))
    parts.append(kit.cyl(f'{name}-bell', r * 0.75, length * 0.06, loc=(-length * 0.44, 0, 0), rot=(0, -math.pi / 2, 0), material=m('nozzle'), r2=r * 0.45, verts=24))
    if fins:
        for k in range(4):
            fin = kit.mesh(f'{name}-fin{k}', [(-length * 0.41, 0, 0), (-length * 0.25, 0, 0), (-length * 0.41, 0, r * 2.2)], [(0, 1, 2)], m('darkgrey'))
            fin.rotation_euler = (k * math.pi / 2, 0, 0)
            parts.append(fin)
    return parts


def _plate(name, outline, thick, mat_obj, z=0.0):
    """Extrude a flat outline (list of (x, y)) into a thin plate."""
    n = len(outline)
    V = [(x, y, z - thick / 2) for x, y in outline] + [(x, y, z + thick / 2) for x, y in outline]
    F = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return kit.mesh(name, V, F, mat_obj)


def f15(name):
    """An F-15-like fighter, nose +X (about 1 unit long)."""
    grey = kit.mat(name + '-paint', '#9aa3ad', metallic=0.25, rough=0.45)
    fus = kit.cyl(f'{name}-fus', 0.055, 0.8, rot=(0, math.pi / 2, 0), material=grey, verts=24)
    fus.scale = (1, 1.35, 0.9)
    parts = [fus]
    parts.append(kit.cyl(f'{name}-nose', 0.055, 0.22, loc=(0.51, 0, 0), rot=(0, math.pi / 2, 0), material=grey, r2=0.004, verts=24))
    parts.append(kit.sphere(f'{name}-canopy', 0.05, loc=(0.27, 0, 0.045), material=m('glass'), scale=(2.2, 0.8, 0.8)))
    parts.append(_plate(f'{name}-wing', [(0.12, 0), (-0.22, 0.42), (-0.32, 0.42), (-0.3, 0), (-0.32, -0.42), (-0.22, -0.42)], 0.016, grey))
    parts.append(_plate(f'{name}-stab', [(-0.3, 0), (-0.42, 0.2), (-0.47, 0.2), (-0.45, 0), (-0.47, -0.2), (-0.42, -0.2)], 0.012, grey))
    for side in (1, -1):
        t = _plate(f'{name}-tail{side}', [(-0.28, 0), (-0.42, 0), (-0.47, 0.2), (-0.41, 0.2)], 0.01, grey)
        t.rotation_euler = (math.pi / 2 - side * 0.12, 0, 0)
        t.location = (0, side * 0.07, 0.04)
        parts.append(t)
        parts.append(kit.cyl(f'{name}-eng{side}', 0.035, 0.08, loc=(-0.44, side * 0.04, 0), rot=(0, math.pi / 2, 0), material=m('nozzle'), verts=16))
    return parts


def x37b(name):
    """An X-37B-like spaceplane: white upper body, black heat-shield belly, small delta wing, V-tail, bay doors open with a small array."""
    white = m('white')
    fus = kit.cyl(f'{name}-fus', 0.1, 0.9, rot=(0, math.pi / 2, 0), material=white, verts=32)
    fus.scale = (1, 1.3, 0.85)
    parts = [fus]
    parts.append(kit.sphere(f'{name}-nose', 0.1, loc=(0.45, 0, 0), material=m('black'), scale=(1.6, 1.3, 0.85)))
    parts.append(kit.box(f'{name}-belly', (0.92, 0.25, 0.04), loc=(0, 0, -0.075), material=m('black'), bevel=0.01))
    parts.append(_plate(f'{name}-wing', [(0.05, 0.1), (-0.35, 0.42), (-0.46, 0.42), (-0.46, -0.42), (-0.35, -0.42), (0.05, -0.1)], 0.02, m('black'), z=-0.06))
    for side in (1, -1):
        t = _plate(f'{name}-tail{side}', [(-0.32, 0), (-0.47, 0), (-0.5, 0.2), (-0.42, 0.2)], 0.012, white)
        t.rotation_euler = (math.pi / 2 - side * 0.55, 0, 0)
        t.location = (0, side * 0.08, 0.05)
        parts.append(t)
        parts.append(kit.box(f'{name}-door{side}', (0.5, 0.11, 0.01), loc=(0.02, side * 0.15, 0.13), rot=(side * 0.9, 0, 0), material=m('alu')))
    parts.append(kit.box(f'{name}-array', (0.34, 0.5, 0.008), loc=(0.02, 0, 0.18), material=m('cells')))
    parts.append(kit.cyl(f'{name}-eng', 0.04, 0.06, loc=(-0.47, 0, 0), rot=(0, math.pi / 2, 0), material=m('nozzle'), verts=16))
    return parts


def iss(name):
    """A space-station silhouette: a long truss, eight gold-brown arrays, pressurised modules and white radiators."""
    parts = [kit.box(f'{name}-truss', (0.08, 2.2, 0.08), material=m('alu'))]
    for side in (1, -1):
        for k in range(2):
            y = side * (0.82 + k * 0.28)
            for z in (1, -1):
                parts.append(kit.box(f'{name}-arr{side}{k}{z}', (0.012, 0.22, 0.8), loc=(0, y, z * 0.47), material=m('cells-iss')))
        parts.append(kit.box(f'{name}-rad{side}', (0.3, 0.02, 0.22), loc=(0.1, side * 0.4, -0.2), material=m('white')))
    parts.append(kit.cyl(f'{name}-mod', 0.07, 1.1, rot=(0, math.pi / 2, 0), material=m('white'), verts=24))
    parts.append(kit.cyl(f'{name}-mod2', 0.06, 0.5, loc=(0.2, 0, 0), rot=(math.pi / 2, 0, 0), material=m('white'), verts=24))
    return parts


def airliner(name, paint='#f2f4f7'):
    w = kit.mat(name + '-paint', paint, rough=0.35, coat=0.3)
    parts = [kit.cyl(f'{name}-fus', 0.05, 0.9, rot=(0, math.pi / 2, 0), material=w, verts=24)]
    parts.append(kit.sphere(f'{name}-nose', 0.05, loc=(0.45, 0, 0), material=w, scale=(1.8, 1, 1)))
    parts.append(kit.cyl(f'{name}-tailc', 0.05, 0.16, loc=(-0.53, 0, 0.01), rot=(0, -math.pi / 2, 0), material=w, r2=0.012, verts=24))
    parts.append(_plate(f'{name}-wing', [(0.1, 0), (-0.12, 0.5), (-0.2, 0.5), (-0.08, 0), (-0.2, -0.5), (-0.12, -0.5)], 0.012, w))
    parts.append(_plate(f'{name}-stab', [(-0.48, 0), (-0.56, 0.16), (-0.6, 0.16), (-0.58, 0), (-0.6, -0.16), (-0.56, -0.16)], 0.01, w))
    fin = _plate(f'{name}-fin', [(-0.44, 0), (-0.6, 0), (-0.64, 0.2), (-0.57, 0.2)], 0.01, w)
    fin.rotation_euler = (math.pi / 2, 0, 0)
    parts.append(fin)
    for side in (1, -1):
        parts.append(kit.cyl(f'{name}-eng{side}', 0.025, 0.1, loc=(0.02, side * 0.2, -0.04), rot=(0, math.pi / 2, 0), material=m('grey'), verts=16))
    return parts
