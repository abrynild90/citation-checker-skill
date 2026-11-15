# Missiles and rockets for the poster renders, in metres, nose toward +X, centred on the middle of the vehicle, built as lathed bodies with
# stage joints, bands, conduits, prism fins and bell nozzles (the F-15 is in f15.py, the satellites in sats.py). Builders: asm135() (the
# US anti-satellite missile of 1985), sm3() (the Aegis interceptor of 2008) and upper_stage() (a Chinese-style upper stage, for DN-2).
# kit.group() parents, scales and aims the returned parts. Illustrative shapes of the real vehicles, not engineering models.
import math

import bpy
from mathutils import Vector

import kit
import surface as S

_M = {}


def _materials():
    panels = S.panel_lines(seed=11, min_px=200, max_px=900, rivet_step=17)
    return {
        'white': S.aircraft_paint('rk-white', light='#aeb3b8', panels=panels, two_tone=False, rough=0.42, grime=0.45, tile=0.5),
        'grey': S.aircraft_paint('rk-grey', light='#8d949b', panels=panels, two_tone=False, rough=0.45, grime=0.3, tile=0.5),
        'orange': S.aircraft_paint('rk-orange', light='#c9501c', panels=panels, two_tone=False, rough=0.5, grime=0.3, tile=0.5),
        'red': kit.mat('rk-red', '#b3191c', rough=0.45, coat=0.2),
        'black': kit.mat('rk-black', '#101215', rough=0.55),
        'dark': kit.mat('rk-dark', '#383d44', metallic=0.4, rough=0.45),
        'steel': kit.mat('rk-steel', '#b9bec6', metallic=1.0, rough=0.28),
        'gold': kit.mat('rk-gold', '#c9983c', metallic=1.0, rough=0.3),
        'bell': kit.mat('rk-bell', '#2d2824', metallic=1.0, rough=0.38),
        'window': kit.mat('rk-window', '#06090f', metallic=0.6, rough=0.04, coat=1.0),
        'cable': kit.mat('rk-cable', '#26282b', rough=0.5),
    }


def m(key):
    """Shared materials, made once per scene."""
    if _M and next(iter(_M.values())).name not in bpy.data.materials:
        _M.clear()  # the scene was reset since
    if not _M:
        _M.update(_materials())
    return _M[key]


def reset_materials():
    _M.clear()


def lathe(name, profile, material, seg=48, x0=0.0):
    """A smooth body of revolution about X from (x, radius) points; the ends are capped unless the radius there is zero."""
    verts, faces, idx = [], [], []
    for x, r in profile:
        idx.append((len(verts), 1 if r <= 1e-6 else seg))
        ring = [(x0 + x, r * math.cos(2 * math.pi * j / seg), r * math.sin(2 * math.pi * j / seg)) for j in range(seg)]
        verts += ring[:1] if r <= 1e-6 else ring
    for (a, na), (b, nb) in zip(idx, idx[1:]):
        for j in range(seg):
            j1 = (j + 1) % seg
            if na == 1:
                faces.append((a, b + j, b + j1))
            elif nb == 1:
                faces.append((a + j1, a + j, b))
            else:
                faces.append((a + j, b + j, b + j1, a + j1))
    for (a, n), flip in ((idx[0], True), (idx[-1], False)):
        if n > 1:
            faces.append(tuple(reversed(range(a, a + n))) if flip else tuple(range(a, a + n)))
    ob = kit.mesh(name, verts, faces, material, smooth=True)
    return ob


def ogive(x0, x1, r0, r1, n=14):
    """Profile points of a nose from radius r0 at x0 to r1 at x1."""
    return [(x0 + (x1 - x0) * t, r0 + (r1 - r0) * (1 - (1 - t) ** 2.1)) for t in (i / n for i in range(n + 1))]


def prism(name, outline, thick, material):
    """A fin: the (x, z) outline extruded to a thickness along Y."""
    n = len(outline)
    t = thick / 2
    verts = [(x, -t, z) for x, z in outline] + [(x, t, z) for x, z in outline]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return kit.mesh(name, verts, faces, material)


def around(ob, k, n):
    """Rotate a part about the X axis to station k of n."""
    ob.rotation_euler = (2 * math.pi * k / n, 0, 0)
    return ob


def band(name, x, r, w, material, seg=48):
    return lathe(name, [(x - w / 2, r), (x - w / 2, r * 1.012), (x + w / 2, r * 1.012), (x + w / 2, r)], material, seg)


def strut(name, a, b, r, material):
    ob = kit.cyl(name, r, (b - a).length, loc=(a + b) / 2, material=material, verts=8)
    ob.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    return ob


def conduit(name, x0, x1, r, material, k=2):
    """Thin cable runs along the body."""
    return [kit.cyl(f'{name}-c{i}', 0.022, x1 - x0, loc=((x0 + x1) / 2, math.cos(2.5 + i * math.pi) * (r + 0.01), math.sin(2.5 + i * math.pi) * (r + 0.01)),
                    rot=(0, math.pi / 2, 0), material=material, verts=10) for i in range(k)]


def nozzle(name, x, r, length, material, seg=40):
    """An exhaust bell opening aft from its throat at x."""
    prof = [(0, r * 0.38), (-length * 0.35, r * 0.5), (-length * 0.8, r * 0.78), (-length, r * 0.92), (-length * 1.02, r * 0.88)]
    return lathe(name, prof, material, seg, x0=x)


def asm135(name='asm'):
    """The ASM-135 ASAT, 5.4 m long and 0.5 m across: an SRAM booster with four tail fins, a short interstage, the Altair III second stage and
    the Miniature Homing Vehicle with a blunt infrared-seeker nose, ringed by its small attitude rockets. Carried on the F-15's centreline."""
    X0 = -2.7
    parts = [lathe(f'{name}-s1', [(X0, 0.2), (X0, 0.25), (X0 + 2.9, 0.25), (X0 + 3.1, 0.25), (X0 + 3.35, 0.19)], m('white'))]
    parts.append(nozzle(f'{name}-nz', X0 + 0.1, 0.22, 0.35, m('bell')))
    for x, key in ((0.28, 'dark'), (1.0, 'red'), (1.95, 'dark'), (2.9, 'dark')):
        parts.append(band(f'{name}-b{x}', X0 + x, 0.25, 0.06, m(key)))
    parts.append(lathe(f'{name}-s2', [(X0 + 3.3, 0.19), (X0 + 3.55, 0.185), (X0 + 4.25, 0.185), (X0 + 4.35, 0.17)], m('white')))
    parts.append(band(f'{name}-b2', X0 + 3.55, 0.185, 0.04, m('black')))
    parts.append(lathe(f'{name}-mhv', [(X0 + 4.3, 0.17), (X0 + 4.3, 0.2), (X0 + 4.8, 0.2), (X0 + 4.9, 0.17)], m('dark')))
    for k in range(24):  # the vehicle's ring of tiny rockets
        a = 2 * math.pi * k / 24
        parts.append(kit.cyl(f'{name}-ar{k}', 0.018, 0.14, loc=(X0 + 4.62, 0.205 * math.cos(a), 0.205 * math.sin(a)), rot=(0, math.pi / 2, 0), material=m('gold'), verts=8))
    parts.append(lathe(f'{name}-nose', [(X0 + 4.9, 0.17), (X0 + 5.12, 0.13), (X0 + 5.3, 0.08), (X0 + 5.4, 0.0)], m('window')))
    parts += conduit(f'{name}-cd', X0 + 0.4, X0 + 3.2, 0.25, m('cable'))
    for k in range(4):  # cropped delta tail fins at the booster's aft end
        parts.append(around(prism(f'{name}-fin{k}', [(X0 + 0.05, 0.24), (X0 + 0.9, 0.25), (X0 + 0.35, 0.6), (X0 + 0.05, 0.6)], 0.035, m('grey')), k, 4))
    for k in range(4):  # small control fins on the second stage
        parts.append(around(prism(f'{name}-cf{k}', [(X0 + 3.6, 0.18), (X0 + 3.95, 0.18), (X0 + 3.8, 0.34), (X0 + 3.62, 0.34)], 0.025, m('dark')), k + 0.5, 4))
    return parts


def sm3(name='sm3'):
    """The SM-3 Block IA, 6.5 m long: the wider Mk 72 booster with its four tail fins, the 0.34 m Mk 104 second stage with strakes, the Mk 136
    third stage and the kinetic warhead under a white nose cone with a dark tip."""
    X0 = -3.27
    parts = [lathe(f'{name}-bst', [(X0, 0.24), (X0, 0.265), (X0 + 2.4, 0.265), (X0 + 2.7, 0.17)], m('white'))]
    parts.append(nozzle(f'{name}-nz', X0 + 0.1, 0.24, 0.4, m('bell')))
    for x, key in ((0.28, 'dark'), (1.2, 'orange'), (2.3, 'dark')):
        parts.append(band(f'{name}-bb{x}', X0 + x, 0.265, 0.07, m(key)))
    parts.append(lathe(f'{name}-s2', [(X0 + 2.7, 0.17), (X0 + 4.3, 0.17)], m('white')))
    parts.append(band(f'{name}-b23', X0 + 4.3, 0.17, 0.06, m('black')))
    parts.append(lathe(f'{name}-s3', [(X0 + 4.3, 0.17), (X0 + 5.4, 0.17), (X0 + 5.45, 0.145)], m('grey')))
    parts.append(lathe(f'{name}-kw', [(X0 + 5.4, 0.145), (X0 + 5.75, 0.14)] + ogive(X0 + 5.75, X0 + 6.54, 0.14, 0.0, 12)[1:], m('white')))
    parts.append(lathe(f'{name}-tip', [(X0 + 6.38, 0.03), (X0 + 6.46, 0.016), (X0 + 6.54, 0.0)], m('black')))
    parts += conduit(f'{name}-cd', X0 + 0.5, X0 + 2.5, 0.265, m('cable'))
    for k in range(4):  # the booster's tail fins
        parts.append(around(prism(f'{name}-fin{k}', [(X0, 0.26), (X0 + 0.9, 0.265), (X0 + 0.45, 0.72), (X0, 0.72)], 0.04, m('grey')), k, 4))
    for k in range(4):  # the second stage's long strakes
        parts.append(around(prism(f'{name}-st{k}', [(X0 + 2.75, 0.17), (X0 + 4.1, 0.17), (X0 + 3.6, 0.27), (X0 + 2.95, 0.27)], 0.02, m('dark')), k + 0.5, 4))
    return parts


def upper_stage(name='dn2'):
    """A Chinese-style kick stage, 10 m long and 2.8 m across: a white lower stage with thin dark bands and a bell, an open truss interstage
    showing the engine dome, a smaller third stage with thruster pods, and a blunt payload fairing with a gold seam."""
    X0 = -5.0
    parts = [lathe(f'{name}-s2', [(X0, 1.0), (X0, 1.4), (X0 + 3.9, 1.4), (X0 + 4.0, 1.35)], m('white'), seg=64)]
    parts.append(nozzle(f'{name}-nz', X0 + 0.15, 1.1, 1.0, m('bell')))
    for x, w in ((0.45, 0.1), (1.3, 0.06), (2.55, 0.08), (3.8, 0.1)):
        parts.append(band(f'{name}-b{x}', X0 + x, 1.4, w, m('dark'), seg=64))
    for k in range(10):  # the open interstage: struts from the lower stage's rim to the upper stage's, around a bare dome
        a = 2 * math.pi * k / 10
        a0 = Vector((X0 + 4.0, 1.28 * math.cos(a), 1.28 * math.sin(a)))
        a1 = Vector((X0 + 5.2, 0.92 * math.cos(a + 0.35), 0.92 * math.sin(a + 0.35)))
        parts.append(strut(f'{name}-ts{k}', a0, a1, 0.05, m('steel')))
    parts.append(lathe(f'{name}-dome', [(X0 + 4.0, 0.0), (X0 + 4.2, 0.55), (X0 + 4.5, 0.9), (X0 + 4.9, 1.0), (X0 + 5.2, 0.95)], m('dark')))
    parts.append(lathe(f'{name}-s3', [(X0 + 5.2, 0.92), (X0 + 5.35, 0.95), (X0 + 7.2, 0.95), (X0 + 7.3, 0.9)], m('white'), seg=64))
    parts.append(band(f'{name}-b3', X0 + 5.4, 0.95, 0.1, m('dark'), seg=64))
    parts.append(band(f'{name}-b4', X0 + 7.2, 0.95, 0.08, m('dark'), seg=64))
    for k in range(4):  # attitude-control thruster pods on the third stage
        a = 2 * math.pi * k / 4 + math.pi / 4
        parts.append(kit.box(f'{name}-pod{k}', (0.5, 0.16, 0.16), loc=(X0 + 6.9, 0.99 * math.cos(a), 0.99 * math.sin(a)), material=m('dark'), bevel=0.02, rot=(a, 0, 0)))
        parts.append(kit.cyl(f'{name}-rn{k}', 0.05, 0.12, loc=(X0 + 6.6, 1.06 * math.cos(a), 1.06 * math.sin(a)), rot=(0, -math.pi / 2, 0), material=m('bell'), r2=0.025, verts=12))
    parts.append(lathe(f'{name}-fair', [(X0 + 7.3, 0.9), (X0 + 7.45, 0.95), (X0 + 8.2, 0.95)] + ogive(X0 + 8.2, X0 + 10.0, 0.95, 0.0, 16)[1:], m('white'), seg=64))
    parts.append(band(f'{name}-seam', X0 + 8.2, 0.95, 0.07, m('gold'), seg=64))
    parts += conduit(f'{name}-cd', X0 + 0.6, X0 + 3.7, 1.4, m('cable'), k=2)
    return parts
