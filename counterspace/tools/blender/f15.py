# An F-15A Eagle in metres (19.43 m long, 13.05 m span, 45-degree wing sweep), built from lofted cross-sections and airfoil surfaces:
# radome and forward fuselage, raked rectangular intakes with dark ducts, a wide lifting body over the engines, cropped-delta wings with
# separate flaps and ailerons, dogtooth stabilators on tail booms, twin fins with rudders and antenna fairings, petal nozzles, a glass bubble
# canopy with seat, pilot and head-up display, probes, blade antennas, lights, pylons and low-visibility markings, in Compass Ghost grey.
# Model axes: +X forward (nose at x = 10), +Z up, +Y to the left wing. `s` below is the distance aft of the nose.
import math

import bmesh
import bpy
from mathutils import Vector

import kit
import surface as S


def X(s):
    return 10.0 - s


def _mirror(ob):
    mod = ob.modifiers.new('mirror', 'MIRROR')
    mod.use_axis = (False, True, False)
    return ob


def _lofts(stations, cy=0.0, k=48, rake=None):
    """Rings from (s, half_width, z_top, z_bottom, squareness); `rake` (top_s, bottom_s) slants the first ring (an intake mouth)."""
    rings = []
    for idx, (s, hw, zt, zb, n) in enumerate(stations):
        zc = (zt + zb) / 2
        ring = S.superellipse_ring(X(s), cy, zc, hw, zt - zc, zc - zb, n, k)
        if rake and idx == 0:
            top_s, bot_s = rake
            ring = [(X(top_s + (bot_s - top_s) * (zt - z) / (zt - zb)), y, z) for _, y, z in ring]
        rings.append(ring)
    return rings


# ---------------------------------------------------------------- materials
def _materials(name):
    panels = S.panel_lines(seed=7)
    m = {
        'paint': S.aircraft_paint(name + '-paint', panels=panels),
        'paint1': S.aircraft_paint(name + '-paint1', panels=panels, two_tone=False),
        'radome': S.aircraft_paint(name + '-radome', light='#737b83', dark='#737b83', two_tone=False, rough=0.42, grime=0.15),
        'duct': S.aircraft_paint(name + '-duct', panels=panels, two_tone=False, inside='#101113'),
        'glass': S.glass(name + '-glass'),
        'hud': S.glass(name + '-hud', tint='#b8ffd6', rough=0.0),
        'frame': kit.mat(name + '-frame', '#3a3f46', metallic=0.3, rough=0.5),
        'seat': kit.mat(name + '-seat', '#1d2024', rough=0.7),
        'helmet': kit.mat(name + '-helmet', '#e3e5e7', rough=0.35, coat=0.6),
        'visor': kit.mat(name + '-visor', '#3a2a08', metallic=1.0, rough=0.08),
        'suit': kit.mat(name + '-suit', '#4b5236', rough=0.8),
        'decal': kit.mat(name + '-decal', '#59616a', rough=0.5),
        'decal_lt': kit.mat(name + '-decal-lt', '#7c848d', rough=0.5),
        'black': kit.mat(name + '-black', '#0d0e10', rough=0.6),
        'probe': kit.mat(name + '-probe', '#b9bdc2', metallic=1.0, rough=0.25),
        'red': kit.mat(name + '-red', '#ff2a1a', emit='#ff2a1a', emit_strength=6.0),
        'green': kit.mat(name + '-green', '#2aff6a', emit='#2aff6a', emit_strength=6.0),
        'white': kit.mat(name + '-white', '#ffffff', emit='#ffffff', emit_strength=5.0),
        'slime': kit.mat(name + '-slime', '#b6ff8c', emit='#b6ff8c', emit_strength=1.4),
    }
    m['nozzle'] = _burnt_metal(name + '-nozzle')
    m['titanium'] = _burnt_metal(name + '-titanium', light=True)
    return m


def _burnt_metal(name, light=False):
    """Heat-tinted titanium and steel: blue, straw and grey patches, near-black inside (seen through the open end)."""
    mt = kit.mat(name, '#6a645d', metallic=1.0, rough=0.45 if light else 0.38)
    nt = mt.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 6
    L(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = kit.hexc('#7d838c' if light else '#4a4f5c')
    ramp.color_ramp.elements[1].color = kit.hexc('#a08c6c' if light else '#8a7457')
    ramp.color_ramp.elements.new(0.5).color = kit.hexc('#8e8a84' if light else '#66625d')
    L(nz.outputs['Fac'], ramp.inputs['Fac'])
    geo = N('ShaderNodeNewGeometry')
    mix = N('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['B'].default_value = kit.hexc('#151312')
    L(ramp.outputs['Color'], mix.inputs['A']); L(geo.outputs['Backfacing'], mix.inputs['Factor'])
    L(mix.outputs['Result'], p.inputs['Base Color'])
    return mt


# ---------------------------------------------------------------- the airframe
def _fuselage(name, m):
    radome = [(0.00, 0.025, 0.095, 0.045, 2.0), (0.35, 0.16, 0.22, -0.08, 2.0), (0.9, 0.29, 0.34, -0.2, 2.0),
              (1.7, 0.42, 0.47, -0.33, 2.1), (2.6, 0.53, 0.58, -0.44, 2.2), (3.3, 0.59, 0.66, -0.5, 2.3)]
    body = [(3.3, 0.59, 0.66, -0.5, 2.3), (4.5, 0.67, 0.78, -0.57, 2.4), (5.6, 0.71, 0.86, -0.6, 2.5), (6.8, 0.73, 0.9, -0.58, 2.6),
            (8.0, 0.72, 1.02, -0.52, 2.7), (9.2, 0.69, 0.98, -0.42, 2.8), (10.4, 0.66, 0.86, -0.36, 2.9), (11.8, 0.62, 0.74, -0.3, 3.0), (13.5, 0.57, 0.66, -0.25, 3.0),
            (15.5, 0.5, 0.58, -0.22, 3.0), (17.3, 0.36, 0.44, -0.2, 3.0), (18.3, 0.18, 0.3, -0.15, 3.0)]
    parts = [S.loft(name + '-radome', _lofts(radome), m['radome'], cap_end=False),
             S.loft(name + '-fuselage', _lofts(body), m['paint'], cap_start=False)]
    duct = [(5.55, 0.56, 0.62, -0.74, 8), (6.6, 0.57, 0.6, -0.74, 8), (8.0, 0.58, 0.54, -0.72, 7), (9.6, 0.6, 0.47, -0.7, 6),
            (11.0, 0.61, 0.445, -0.69, 6), (12.0, 0.55, 0.43, -0.67, 6)]  # the duct runs back into the shoulders over the wing
    parts.append(_mirror(S.loft(name + '-intake', _lofts(duct, cy=1.5, k=40, rake=(5.45, 6.35)), m['duct'], cap_start=False, subdiv=1)))
    trunk = [(9.2, 2.1, 0.44, -0.7, 6), (11.0, 2.12, 0.44, -0.68, 6), (13.0, 2.0, 0.42, -0.64, 5.5), (15.0, 1.75, 0.4, -0.6, 5),
             (16.6, 1.45, 0.36, -0.56, 4.5)]
    aft = [(16.6, 1.45, 0.36, -0.56, 4.5), (17.7, 1.25, 0.3, -0.5, 4), (18.15, 1.18, 0.26, -0.46, 4)]  # bare titanium around the engines
    parts.append(S.loft(name + '-trunk', _lofts(trunk, k=56), m['paint'], cap_end=False))
    parts.append(S.loft(name + '-aft', _lofts(aft, k=56), m['titanium'], cap_start=False))
    for side in (1, -1):  # boundary-layer splitter plates standing off the fuselage
        parts.append(kit.box(f'{name}-splitter{side}', (1.3, 0.02, 1.1), loc=(X(6.3), side * 0.86, -0.05), material=m['paint1']))
    return parts


def _wing_geom(y):
    le = 8.4 + (y - 1.55)
    te = 15.9 - (y - 1.55) * 0.6 / 4.97
    z = 0.22 - (y - 1.55) * 0.0175  # one degree of anhedral
    t = 0.055 - (y - 1.55) * 0.02 / 4.97
    return le, te, z, t


def _wings(name, m):
    main = []
    for y, cut in ((1.55, 1.0), (3.9, 1.0), (3.92, 0.0), (4.05, 0.0), (4.07, 0.72), (6.05, 0.72), (6.07, 0.0), (6.52, 0.0)):
        le, te, z, t = _wing_geom(y)
        main.append((y, X(le), te - le - cut, t, z))
    parts = [_mirror(S.surface(name + '-wing', main, m['paint']))]

    def control(tag, y0, y1, chord):
        st = []
        for y in (y0, y1):
            le, te, z, t = _wing_geom(y)
            st.append((y, X(te - chord + 0.035), chord - 0.035, 0.05, z - 0.005))
        return _mirror(S.surface(f'{name}-{tag}', st, m['paint1']))
    parts += [control('flap', 1.62, 3.88, 1.0), control('aileron', 4.09, 6.03, 0.72)]
    stab = [(1.85, X(16.35), 3.1, 0.05, -0.1), (2.55, X(17.155), 2.445, 0.045, -0.1), (2.56, X(16.95), 2.65, 0.045, -0.1),
            (4.3, X(18.95), 1.0, 0.04, -0.1)]  # the dogtooth: the outboard leading edge steps forward
    parts.append(_mirror(S.surface(name + '-stab', stab, m['paint'])))
    boom = [(15.0, 0.06, 0.06, -0.12, 3), (15.6, 0.15, 0.17, -0.25, 4), (19.2, 0.14, 0.15, -0.22, 4), (19.9, 0.04, 0.0, -0.06, 3)]
    parts.append(_mirror(S.loft(name + '-boom', _lofts(boom, cy=1.78, k=24), m['paint'], subdiv=1)))

    def fin_edges(z):
        return 14.55 + (z - 0.35) * 0.73, 18.35 + (z - 0.35) * 0.033, 0.045 - (z - 0.35) * 0.01 / 3.05
    fin = []
    for z, cut in ((0.35, 0.0), (0.55, 0.75), (2.3, 0.75), (2.32, 0.0), (3.4, 0.0)):
        le, te, t = fin_edges(z)
        fin.append((z, X(le), te - le - cut, t, 1.6))
    parts.append(_mirror(S.surface(name + '-fin', fin, m['paint'], vertical=True)))
    rud = []
    for z in (0.57, 2.28):
        le, te, t = fin_edges(z)
        rud.append((z, X(te - 0.72), 0.72, 0.05, 1.6))
    parts.append(_mirror(S.surface(name + '-rudder', rud, m['paint1'], vertical=True)))
    parts.append(_mirror(kit.cyl(name + '-ecm', 0.075, 0.7, loc=(X(18.55), 1.6, 3.33), rot=(0, math.pi / 2, 0), material=m['paint1'], verts=20)))
    return parts


def _nozzles(name, m, afterburner):
    parts = []
    for side in (1, -1):
        y = side * 0.64
        rings = []
        for s, r in ((17.85, 0.6), (18.5, 0.57), (19.0, 0.53), (19.45, 0.48)):
            ring = []
            for i in range(48):
                a = 2 * math.pi * i / 48
                rr = r * (0.985 if (i % 3 == 0 and s > 18.4) else 1.0)  # the petals of the variable nozzle
                ring.append((X(s), y + rr * math.cos(a), -0.12 + rr * math.sin(a)))
            rings.append(ring)
        parts.append(S.loft(f'{name}-nozzle{side}', rings, m['nozzle'], cap_end=False, subdiv=1))
        glow = kit.mat(f'{name}-ab{side}', '#ff8a3a', emit='#ff8a3a', emit_strength=12.0 if afterburner else 0.0)
        parts.append(kit.cyl(f'{name}-holder{side}', 0.4, 0.02, loc=(X(19.1), y, -0.12), rot=(0, math.pi / 2, 0), material=glow))
        if afterburner:
            parts += _plume(f'{name}-plume{side}', Vector((X(19.45), y, -0.12)))
    return parts


def _plume(name, at):
    """An afterburner plume at altitude: a blue core at the nozzle, an orange flame, a soft outer glow and shock diamonds."""
    parts = []
    for k, (r0, length, col, strength, alpha, power) in enumerate((
            (0.44, 1.4, '#7fa6ff', 9.0, 0.9, 1.4), (0.42, 4.2, '#ffcf8a', 7.0, 0.85, 1.6), (0.62, 8.5, '#ff8c48', 2.0, 0.35, 2.4))):
        c = kit.cyl(f'{name}-{k}', r0, length, material=kit.glow_mat(f'{name}-m{k}', col, strength, fresnel=True, alpha=alpha, power=power),
                    r2=r0 * 0.08, verts=32)
        c.location = at + Vector((-length / 2, 0, 0))
        c.rotation_euler = (0, -math.pi / 2, 0)
        c.visible_shadow = False
        parts.append(c)
    for i in range(4):
        d = kit.sphere(f'{name}-diamond{i}', 0.11 * (1 - i * 0.15), at + Vector((-0.8 - i * 1.0, 0, 0)),
                       kit.glow_mat(f'{name}-dm{i}', '#eef3ff', 9.0 * (1 - i * 0.22), fresnel=True, alpha=0.8, power=2.0), seg=24, scale=(2.6, 1, 1))
        d.visible_shadow = False
        parts.append(d)
    return parts


def _cockpit(name, m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.0, location=(X(6.4), 0, 0.84))
    canopy = bpy.context.object
    canopy.name = name + '-canopy'
    canopy.scale = (2.05, 0.62, 0.66)
    bpy.ops.object.transform_apply(scale=True, location=False)
    bm = bmesh.new()
    bm.from_mesh(canopy.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.005], context='VERTS')
    bm.to_mesh(canopy.data)
    bm.free()
    bpy.ops.object.shade_smooth()
    canopy.data.materials.append(m['glass'])
    parts = [canopy]

    def half_width(s):
        dx = (X(s) - X(6.4)) / 2.05
        return math.sqrt(max(0.0, 1 - dx * dx))

    def arch(s, r):
        k = half_width(s)
        pts = [Vector((X(s), 0.62 * k * math.cos(a) * 1.01, 0.84 + 0.66 * k * math.sin(a) * 1.01)) for a in [math.pi * i / 24 for i in range(25)]]
        return kit.curve(f'{name}-arch{s}', pts, r, m['frame'])
    parts += [arch(5.0, 0.025), arch(8.2, 0.03)]
    for side in (1, -1):
        rail = [Vector((X(s), side * 0.62 * half_width(s) * 1.01, 0.845)) for s in [4.4 + i * 0.2 for i in range(21)]]
        parts.append(kit.curve(f'{name}-sill{side}', rail, 0.02, m['frame']))
    parts.append(kit.box(name + '-coaming', (0.5, 0.75, 0.16), loc=(X(5.25), 0, 0.9), material=m['black'], bevel=0.03))
    parts.append(kit.box(name + '-hud', (0.01, 0.2, 0.17), loc=(X(5.42), 0, 1.07), rot=(0, -0.35, 0), material=m['hud']))
    parts.append(kit.box(name + '-seat', (0.12, 0.5, 0.75), loc=(X(7.15), 0, 0.98), rot=(0, 0.28, 0), material=m['seat'], bevel=0.03))
    parts.append(kit.box(name + '-headrest', (0.16, 0.34, 0.26), loc=(X(7.32), 0, 1.38), rot=(0, 0.28, 0), material=m['seat'], bevel=0.05))
    parts.append(kit.box(name + '-handle', (0.04, 0.16, 0.03), loc=(X(7.2), 0, 1.5), material=kit.mat(name + '-yellow', '#d9b21a', rough=0.5)))
    parts.append(kit.sphere(name + '-helmet', 0.15, (X(6.75), 0, 1.25), m['helmet'], seg=32, scale=(1.1, 0.95, 1.0)))
    parts.append(kit.sphere(name + '-visor', 0.152, (X(6.73), 0, 1.24), m['visor'], seg=32, scale=(1.1, 0.95, 0.75)))
    parts.append(kit.box(name + '-torso', (0.3, 0.46, 0.4), loc=(X(6.95), 0, 1.0), material=m['suit'], bevel=0.12))
    return parts


def _details(name, m, serial):
    parts = []
    for side in (1, -1):  # pitot probes on the nose sides, angle-of-attack vanes behind them
        parts.append(kit.cyl(f'{name}-pitot{side}', 0.012, 0.55, loc=(X(3.75), side * 0.6, 0.12), rot=(0, math.pi / 2, 0), material=m['probe'], verts=10))
        parts.append(kit.box(f'{name}-aoa{side}', (0.08, 0.01, 0.06), loc=(X(4.4), side * 0.66, -0.12), material=m['probe']))
    for tag, s, z, h, up in (('uhf-top', 8.9, 0.84, 0.26, 1), ('iff-bot', 5.1, -0.58, 0.18, -1), ('tacan', 12.5, -0.66, 0.2, -1)):
        blade = S.flat_shape(f'{name}-{tag}', [(X(s), 0), (X(s + 0.35), 0), (X(s + 0.42), up * h), (X(s + 0.22), up * h)], m['paint1'], thick=0.025)
        blade.rotation_euler = (math.pi / 2, 0, 0)
        blade.location.z = z
        parts.append(blade)
    # lights: red on the left wingtip, green on the right, white on the tail, pale-green formation strips on the nose and fins
    for side, mat in ((1, m['red']), (-1, m['green'])):
        le = 8.4 + (6.52 - 1.55)
        parts.append(kit.sphere(f'{name}-navlight{side}', 0.045, (X(le + 0.45), side * 6.5, 0.14), mat, seg=12))
        parts.append(kit.box(f'{name}-slime-nose{side}', (0.5, 0.012, 0.05), loc=(X(4.9), side * 0.705, 0.05), material=m['slime']))
        parts.append(kit.box(f'{name}-slime-fin{side}', (0.6, 0.012, 0.05), loc=(X(16.6), side * 1.625, 1.9), rot=(0, -0.55, 0), material=m['slime']))
    parts.append(kit.sphere(name + '-taillight', 0.04, (X(19.1), 1.6, 3.38), m['white'], seg=12))
    # the M61 gun port on the right wing root and the air-refuelling door on the left
    parts.append(kit.cyl(name + '-gun', 0.055, 0.25, loc=(X(8.75), -1.95, 0.38), rot=(0, math.pi / 2, 0), material=m['black'], verts=16))
    parts.append(S.flat_shape(name + '-ar-door', [(X(9.1), 1.6), (X(9.6), 1.6), (X(9.6), 1.95), (X(9.1), 1.95)], m['decal'], lift=0.443))
    # pylons: the centreline adapter that carried the ASM-135, and empty wing stations with launch rails
    parts.append(kit.box(name + '-cl-pylon', (2.6, 0.22, 0.25), loc=(X(12.3), 0, -0.79), material=m['paint1'], bevel=0.05))
    for side in (1, -1):
        parts.append(kit.box(f'{name}-pylon{side}', (2.2, 0.16, 0.32), loc=(X(12.2), side * 3.4, 0.0), material=m['paint1'], bevel=0.04))
        parts.append(kit.box(f'{name}-rail{side}', (1.8, 0.06, 0.06), loc=(X(12.3), side * 3.52, -0.12), material=m['frame']))
    return parts + _markings(name, m, serial)


def _star(r_out, r_in, rot=math.pi / 2):
    return [((r_out if i % 2 == 0 else r_in) * math.cos(rot + i * math.pi / 5), (r_out if i % 2 == 0 else r_in) * math.sin(rot + i * math.pi / 5))
            for i in range(10)]


def _insignia(name, m, size):
    """A low-visibility national insignia (star and bars) centred on the origin in the XY plane; `size` is the disc diameter."""
    r = size / 2
    parts = [S.flat_shape(name + '-disc', [(r * math.cos(a), r * math.sin(a)) for a in [2 * math.pi * i / 40 for i in range(40)]], m['decal'])]
    for side in (1, -1):
        parts.append(S.flat_shape(f'{name}-bar{side}', [(side * r * 0.75, -r * 0.33), (side * r * 2.0, -r * 0.33),
                                                         (side * r * 2.0, r * 0.33), (side * r * 0.75, r * 0.33)], m['decal']))
    parts.append(S.flat_shape(name + '-star', _star(r * 0.92, r * 0.36), m['decal_lt'], lift=0.002))
    return parts


def _markings(name, m, serial):
    parts = []
    for side in (1, -1):  # on the outer intake walls
        for o in _insignia(f'{name}-ins-int{side}', m, 0.62):
            o.rotation_euler = (side * math.pi / 2, 0, 0)
            o.location = (X(7.6), side * (2.088 if o.name.endswith('star') else 2.086), -0.05)
            parts.append(o)
    for tag, y, z, flip in (('wing-l', 4.7, 0.28, False), ('wing-r', -4.7, 0.06, True)):  # upper left wing, lower right wing
        for o in _insignia(f'{name}-ins-{tag}', m, 0.9):
            o.rotation_euler = (math.pi if flip else 0, 0, math.pi / 2)
            o.location = (X(12.4), y, z)
            parts.append(o)
    usaf = S.text_mesh(name + '-usaf', 'USAF', 0.75, m['decal'])
    usaf.rotation_euler = (0, 0, -math.pi / 2)
    usaf.location = (X(12.6), -4.4, 0.275)
    parts.append(usaf)
    for side in (1, -1):
        t = S.text_mesh(f'{name}-serial{side}', serial, 0.22, m['decal'])
        t.rotation_euler = (side * math.pi / 2, 0, 0 if side > 0 else math.pi)
        t.location = (X(17.0), side * 1.66, 1.1)
        parts.append(t)
    return parts


def f15(name='f15', afterburner=True, serial='AF 76-084'):
    """All parts of the jet in model space (parent them with kit.group)."""
    m = _materials(name)
    return _fuselage(name, m) + _wings(name, m) + _nozzles(name, m, afterburner) + _cockpit(name, m) + _details(name, m, serial)
