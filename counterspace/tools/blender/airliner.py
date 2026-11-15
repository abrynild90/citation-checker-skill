# A twin-engine narrow-body airliner in metres (37.6 m long, 35.8 m span with wingtip sharklets), built from lofted cross-sections and airfoil
# surfaces: a tapered fuselage with a cabin window row and cockpit glazing, swept low wings with sharklets and flap-track fairings, underslung
# turbofans on pylons (open intakes, fan discs, core cones), fin and tailplane, and the exterior lights. Plain livery (white, light-grey belly,
# a blue cheat line and tail), no lettering. Model axes: +X forward (nose at x = 18.8), +Z up, +Y to the left wing.
import math

import bpy

import kit
import surface as S

HALF_SPAN, WING_ROOT, DIHEDRAL = 16.9, 1.6, 0.08  # wing half-span before the sharklet, root station, rise per metre of span
WING_Z0 = -1.45  # height of the wing section at the root
BLUE = '#1f4e8c'
CHORDS = [(WING_ROOT, 6.3), (5.6, 4.9), (12.0, 3.0), (HALF_SPAN, 1.6)]


def _mirror(ob):
    ob.modifiers.new('mirror', 'MIRROR').use_axis = (False, True, False)
    return ob


def wing_z(y):
    return WING_Z0 + (y - WING_ROOT) * DIHEDRAL


def wing_le(y):
    return 5.4 - math.tan(math.radians(26)) * (y - WING_ROOT)


def chord_at(y):
    for (ya, ca), (yb, cb) in zip(CHORDS, CHORDS[1:]):
        if ya <= y <= yb:
            return ca + (cb - ca) * (y - ya) / (yb - ya)
    return CHORDS[-1][1]


def _livery(name, base='#eef0f2', belly='#aab0b7', fuselage=False, solid=None):
    """Painted skin with panel seams and rivets: white above, pale grey below, and on the fuselage a blue cheat line along the windows.
    `solid` paints it one colour instead (the tail)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    nrm = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Normal'], nrm.inputs[0])
    obj = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Object'], obj.inputs[0])
    neg = N('ShaderNodeMath'); neg.operation = 'MULTIPLY'; neg.inputs[1].default_value = -1.0
    L(nrm.outputs['Z'], neg.inputs[0])
    col = N('ShaderNodeMix'); col.data_type = 'RGBA'
    col.inputs['A'].default_value = kit.hexc(solid or base); col.inputs['B'].default_value = kit.hexc(solid or belly)
    L(kit._smooth(nt, neg.outputs[0], 0.3, 0.8), col.inputs['Factor'])
    out = col.outputs['Result']
    if fuselage:  # a stripe just under the window row, on the flanks only
        off = N('ShaderNodeMath'); off.operation = 'SUBTRACT'; off.inputs[1].default_value = -0.3
        L(obj.outputs['Z'], off.inputs[0])
        d = N('ShaderNodeMath'); d.operation = 'ABSOLUTE'; L(off.outputs[0], d.inputs[0])
        ab = N('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; L(nrm.outputs['Y'], ab.inputs[0])
        ln = N('ShaderNodeMath'); ln.operation = 'MULTIPLY'
        L(kit._smooth(nt, d.outputs[0], 0.2, 0.1), ln.inputs[0]); L(kit._smooth(nt, ab.outputs[0], 0.3, 0.6), ln.inputs[1])
        stripe = N('ShaderNodeMix'); stripe.data_type = 'RGBA'
        L(out, stripe.inputs['A']); stripe.inputs['B'].default_value = kit.hexc(BLUE); L(ln.outputs[0], stripe.inputs['Factor'])
        out = stripe.outputs['Result']
    tx = S._box_tex(nt, S.panel_lines(seed=11), 0.28)
    sep = N('ShaderNodeSeparateColor'); L(tx.outputs['Color'], sep.inputs['Color'])
    sv = N('ShaderNodeMapRange'); sv.inputs['To Min'].default_value = 0.55; sv.inputs['To Max'].default_value = 1.0
    L(sep.outputs['Red'], sv.inputs['Value'])
    L(S._multiply(nt, out, S._grey(nt, sv.outputs['Result'])), p.inputs['Base Color'])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.25; bump.inputs['Distance'].default_value = 0.004
    L(sep.outputs['Red'], bump.inputs['Height']); L(bump.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Roughness'].default_value = 0.34
    p.inputs['Coat Weight'].default_value = 0.35
    p.inputs['Coat Roughness'].default_value = 0.12
    return m


def _materials(name, lit):
    win = bpy.data.materials.new(name + '-win')
    win.use_nodes = True
    wp = win.node_tree.nodes['Principled BSDF']
    wp.inputs['Base Color'].default_value = kit.hexc('#0b1118')
    wp.inputs['Roughness'].default_value = 0.05
    wp.inputs['Emission Color'].default_value = kit.hexc('#ffd9a0')
    wp.inputs['Emission Strength'].default_value = 5.0 if lit else 0.0
    return {
        'body': _livery(name + '-body', fuselage=True), 'wing': _livery(name + '-wing'), 'tail': _livery(name + '-tail', solid=BLUE),
        'nacelle': S.backface_dark(name + '-nacelle', front='#e4e7ea', back='#0c0d0f', rough=0.35),
        'metal': kit.mat(name + '-metal', '#6a7078', metallic=1.0, rough=0.3),
        'dark': kit.mat(name + '-dark', '#15171a', metallic=0.4, rough=0.45),
        'glass': win,
        'cone': kit.mat(name + '-cone', '#4b4f55', metallic=1.0, rough=0.4),
    }


# fuselage stations: (x, half width, top, bottom, centre z, squareness)
FUSE = [(18.75, 0.22, 0.25, 0.25, -0.5, 2.0), (18.2, 0.8, 0.85, 0.8, -0.42, 2.0), (17.0, 1.4, 1.45, 1.25, -0.25, 2.0),
        (15.2, 1.84, 1.9, 1.74, -0.06, 2.0), (13.0, 1.98, 2.0, 1.97, 0.0, 2.05), (-8.0, 1.98, 2.0, 1.97, 0.0, 2.05),
        (-12.0, 1.74, 1.8, 1.55, 0.16, 2.0), (-15.0, 1.2, 1.35, 1.0, 0.55, 2.0), (-17.5, 0.55, 0.62, 0.42, 1.05, 2.0),
        (-18.75, 0.12, 0.14, 0.1, 1.35, 2.0)]


def _fuse_at(x):
    """Half width and centre height of the fuselage at x."""
    for (xa, wa, _, _, za, _), (xb, wb, _, _, zb, _) in zip(FUSE, FUSE[1:]):
        if xb <= x <= xa:
            t = (x - xa) / (xb - xa)
            return wa + (wb - wa) * t, za + (zb - za) * t
    return 1.98, 0.0


def _fuselage(name, mt):
    rings = [S.superellipse_ring(x, 0, zc, hw, ht, hb, n, 56) for x, hw, ht, hb, zc, n in FUSE]
    return S.loft(name + '-fuse', [[(x, y, z) for x, y, z in r] for r in [[(px, py, pz) for px, py, pz in ring] for ring in rings]], mt['body'], subdiv=2)


def _windows(name, mt):
    """A row of cabin windows down each side, one mesh."""
    V, F = [], []
    for side in (1, -1):
        x = 14.0
        while x > -11.5:
            r, zc = _fuse_at(x)
            z = zc + 0.42
            y = side * (math.sqrt(max(r * r - 0.42 ** 2, 0.01)) + 0.012)
            k = len(V)
            V += [(x - 0.11, y, z - 0.15), (x + 0.11, y, z - 0.15), (x + 0.11, y, z + 0.15), (x - 0.11, y, z + 0.15)]
            F.append((k, k + 1, k + 2, k + 3) if side > 0 else (k + 3, k + 2, k + 1, k))
            x -= 0.508
    ob = kit.mesh(name + '-windows', V, F, mt['glass'])
    ob.visible_shadow = False
    return ob


def _cockpit(name, mt):
    parts = []
    for side in (1, -1):
        parts.append(kit.box(f'{name}-wind{side}', (0.5, 0.42, 0.03), loc=(17.5, side * 0.5, 0.62), rot=(side * 0.45, 0.62, side * 0.28), material=mt['glass']))
        parts.append(kit.box(f'{name}-side{side}', (0.5, 0.03, 0.34), loc=(16.6, side * 1.38, 0.62), rot=(0, 0, side * -0.12), material=mt['glass']))
    return parts


def _wing(name, mt):
    st = [(y, wing_le(y), c, 0.13 - 0.03 * (y - WING_ROOT) / 15.3, wing_z(y)) for y, c in CHORDS]
    parts = [_mirror(S.surface(name + '-wing', st, mt['wing'], camber=0.02))]
    shark = S.surface(name + '-shark', [(0.0, wing_le(HALF_SPAN) + 0.1, 1.55, 0.09, HALF_SPAN - 0.05), (2.4, wing_le(HALF_SPAN) - 1.9, 0.8, 0.06, HALF_SPAN + 0.45)],
                      mt['wing'], vertical=True)
    shark.location = (0, 0, wing_z(HALF_SPAN) - 0.05)
    parts.append(_mirror(shark))
    for y in (4.6, 9.2):  # flap-track fairings under the trailing edge
        parts.append(_mirror(kit.sphere(f'{name}-track{y}', 0.22, loc=(wing_le(y) - chord_at(y) * 0.78, y, wing_z(y) - 0.42), material=mt['wing'], seg=16, scale=(3.2, 0.5, 0.5))))
    return parts


def _engines(name, mt):
    parts = []
    prof = [(0.0, 0.9), (-0.1, 1.0), (-0.7, 1.04), (-2.0, 1.0), (-3.4, 0.86), (-4.5, 0.62)]
    for side in (1, -1):
        y, z, x0 = side * 5.75, -2.28, 5.3
        rings = [[(x0 + dx, y + r * math.cos(2 * math.pi * i / 40), z + r * math.sin(2 * math.pi * i / 40)) for i in range(40)] for dx, r in prof]
        parts.append(S.loft(f'{name}-nac{side}', rings, mt['nacelle'], cap_start=False, subdiv=2))
        parts.append(kit.cyl(f'{name}-fan{side}', 0.84, 0.06, loc=(x0 - 0.45, y, z), rot=(0, math.pi / 2, 0), material=mt['metal'], verts=40))
        parts.append(kit.cyl(f'{name}-spin{side}', 0.3, 0.55, loc=(x0 - 0.2, y, z), rot=(0, -math.pi / 2, 0), material=mt['metal'], r2=0.02, verts=24))
        parts.append(kit.cyl(f'{name}-core{side}', 0.6, 1.7, loc=(x0 - 5.3, y, z), rot=(0, -math.pi / 2, 0), material=mt['cone'], r2=0.14, verts=32))
        parts.append(kit.cyl(f'{name}-duct{side}', 0.66, 0.5, loc=(x0 - 4.5, y, z), rot=(0, math.pi / 2, 0), material=mt['dark'], verts=32))
        parts.append(kit.box(f'{name}-pylon{side}', (3.4, 0.2, 0.9), loc=(x0 - 2.2, y, z + 1.15), material=mt['wing'], bevel=0.03))
    return parts


def _tail(name, mt):
    fin = S.surface(name + '-fin', [(1.2, -9.6, 6.6, 0.11, 0.0), (4.3, -12.3, 4.2, 0.09, 0.0), (7.5, -15.2, 2.7, 0.08, 0.0)], mt['tail'], vertical=True)
    stab = [(0.8, -13.3, 3.4, 0.10, 0.65), (3.6, -15.0, 2.2, 0.09, 0.75), (6.2, -16.6, 1.3, 0.08, 0.85)]
    fillet = kit.box(name + '-fillet', (4.0, 0.2, 1.3), loc=(-9.8, 0, 2.3), rot=(0, 0.08, 0), material=mt['body'], bevel=0.05)
    return [fin, _mirror(S.surface(name + '-stab', stab, mt['wing'])), fillet]


def _lights(name, lit):
    """Nav lights (red left, green right), white strobes and red beacons, landing lights in the wing roots."""
    tip_z = wing_z(HALF_SPAN) + 2.38
    spots = [((-4.0, 17.4, tip_z), '#ff2a1a', 1.0), ((-4.0, -17.4, tip_z), '#2dff6a', 1.0), ((-18.7, 0.0, 1.55), '#fff6e0', 0.8),
             ((-3.9, 0.0, 2.1), '#ff3320', 0.7), ((-1.0, 0.0, -2.0), '#ff3320', 0.7)]
    parts = []
    for k, (loc, col, s) in enumerate(spots):
        parts += kit.flash(f'{name}-lt{k}', loc, r=0.2 * s, color=col, strength=60 if lit else 4, halo=col, light=False)
    for side in (1, -1):
        parts += kit.flash(f'{name}-land{side}', (wing_le(3.0) - 0.3, side * 3.0, wing_z(3.0) - 0.36), r=0.1, color='#ffffff', strength=60 if lit else 4, halo='#fff0d0', light=False)
    return parts


def airliner(name, lit=True):
    """The airliner (about 38 m long); `lit` switches the cabin windows and exterior lights on (dusk or night)."""
    mt = _materials(name, lit)
    parts = [_fuselage(name, mt), _windows(name, mt)] + _cockpit(name, mt) + _wing(name, mt) + _engines(name, mt) + _tail(name, mt) + _lights(name, lit)
    parts.append(kit.sphere(name + '-belly', 1.0, loc=(2.2, 0, -1.55), material=mt['body'], seg=32, scale=(4.2, 1.7, 0.75)))
    return parts
