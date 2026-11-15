# Detailed spacecraft in metres, built the way real ones are: a bus wrapped in crinkled multi-layer insulation (displaced geometry plus taped
# seams), mirror-tile radiators, aluminium edge rails, solar wings on a yoke with cropped-corner cells, frames, hinges and white backs,
# ribbed parabolic reflectors on arms, feed horns, star trackers with baffles, an omni antenna, thruster clusters, the apogee engine and the
# launch adapter ring, cable harnesses. Builders: comsat() (geostationary), leosat() (large low-orbit), msti() (small), p78() (Solwind P78-1).
# Model axes: +X forward (along the orbit), +Z the face turned to the camera, solar wings along +-Y.
import math

import bpy
from mathutils import Vector

import kit
import surface as S


# ---------------------------------------------------------------- materials (made once per scene)
_M = {}


def mats():
    try:
        if _M and next(iter(_M.values())).name in bpy.data.materials:
            return _M
    except ReferenceError:  # the scene was reset since: the cached materials are gone
        pass
    _M.clear()
    gaas, si = S.solar_cell_map(8, 6, seed=2, style='gaas'), S.solar_cell_map(6, 6, seed=5, style='si')
    iss_cells = S.solar_cell_map(4, 16, px=512, seed=9, style='iss')
    _M.update({
        'gold': S.mli('mli-gold', 'gold'), 'silver': S.mli('mli-silver', 'silver'), 'black': S.mli('mli-black', 'black'),
        'osr': S.osr_radiator('osr'),
        'cells': S.cells_material('cells-gaas', gaas), 'cells_si': S.cells_material('cells-si', si),
        'cells_iss': S.cells_material('cells-iss', iss_cells), 'beta': _beta_cloth('beta-cloth'),
        'back': _panel_back('panel-back'),
        'alu': kit.mat('alu-frame', '#b7bcc4', metallic=1.0, rough=0.28),
        'cfrp': kit.mat('cfrp', '#1b1c1f', metallic=0.2, rough=0.32, coat=0.5),
        'white': kit.mat('white-paint', '#e2e3e1', rough=0.55),
        'dish': kit.mat('dish-white', '#ecebe5', rough=0.45),
        'dish_gold': kit.mat('dish-mesh', '#d6a650', metallic=1.0, rough=0.35),
        'horn': kit.mat('horn', '#c9a24e', metallic=1.0, rough=0.25),
        'nozzle': kit.mat('nozzle-nb', '#4c4844', metallic=1.0, rough=0.4),
        'lens': kit.mat('lens', '#0a0e14', metallic=0.4, rough=0.03, coat=1.0),
        'matte_black': kit.mat('matte-black', '#09090a', rough=0.8),
        'harness': kit.mat('harness', '#2a2b2e', rough=0.6),
    })
    return _M


def _panel_back(name):
    """The back of a solar panel: white substrate over a carbon honeycomb, with a faint grid of the cell layout showing through."""
    m = kit.mat(name, '#c7cace', rough=0.6)
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    tc = N('ShaderNodeTexCoord')
    br = N('ShaderNodeTexBrick'); br.offset = 0.0
    br.inputs['Scale'].default_value = 8.0; br.inputs['Mortar Size'].default_value = 0.02
    br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 0.75
    br.inputs['Color1'].default_value = kit.hexc('#cfd2d6'); br.inputs['Color2'].default_value = kit.hexc('#c3c6cb')
    br.inputs['Mortar'].default_value = kit.hexc('#8d9096')
    L(tc.outputs['UV'], br.inputs['Vector'])
    L(br.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    return m


def _beta_cloth(name):
    """The white beta-cloth blankets on station modules, quilted in a diamond stitch."""
    m = kit.mat(name, '#e4e0d3', rough=0.72)
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    tc = N('ShaderNodeTexCoord')
    mp = N('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, math.radians(45))
    L(tc.outputs['Object'], mp.inputs['Vector'])
    br = N('ShaderNodeTexBrick'); br.offset = 0.5
    br.inputs['Scale'].default_value = 1.6; br.inputs['Mortar Size'].default_value = 0.03
    L(mp.outputs['Vector'], br.inputs['Vector'])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.25
    L(br.outputs['Fac'], bump.inputs['Height'])
    L(bump.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])
    return m


# ---------------------------------------------------------------- helpers
def plane(name, w, h, loc=(0, 0, 0), rot=(0, 0, 0), material=None):
    """A UV-mapped rectangle (u along its width), for faces carrying image textures."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True, location=False, rotation=False)
    if material:
        ob.data.materials.append(material)
    return ob


def puffy(ob, strength=0.018, scale=0.22):
    """Turn a thin box into a crinkled insulation blanket: simple subdivision, then cloud-noise displacement along the normals."""
    sub = ob.modifiers.new('subd', 'SUBSURF')
    sub.subdivision_type = 'SIMPLE'
    sub.levels = 2
    sub.render_levels = 4
    tex = bpy.data.textures.get('wrinkle') or bpy.data.textures.new('wrinkle', 'CLOUDS')
    tex.noise_scale = scale
    tex.noise_depth = 2
    d = ob.modifiers.new('wrinkle', 'DISPLACE')
    d.texture = tex
    d.strength = strength
    d.texture_coords = 'LOCAL'
    return ob


def aim(ob, direction):
    """Point an object's local +Z along `direction`."""
    ob.rotation_euler = Vector(direction).normalized().to_track_quat('Z', 'Y').to_euler()
    return ob


def strut(name, a, b, r=0.02, material=None):
    return kit.curve(name, [Vector(a), Vector(b)], r, material, resolution=3)


# ---------------------------------------------------------------- subassemblies
def solar_wing(name, side, root, n=4, pw=2.2, ph=1.65, yoke=1.0, cells='cells', gap=0.05):
    """A deployed wing along +-Y from `root` on the bus: drive, triangular yoke, `n` framed panels (cells forward, white backs), hinges."""
    m = mats()
    root = Vector(root)
    parts = [kit.cyl(f'{name}-sada', 0.13, 0.22, loc=root + Vector((0, side * 0.11, 0)), rot=(math.pi / 2, 0, 0), material=m['alu'], verts=24)]
    y0 = root.y + side * yoke
    for dx in (-pw * 0.42, pw * 0.42):
        parts.append(strut(f'{name}-yoke{dx:+.1f}', root + Vector((0, side * 0.2, 0)), (root.x + dx, y0, root.z), 0.022, m['cfrp']))
    parts.append(strut(f'{name}-yoke-x', (root.x - pw * 0.42, y0, root.z), (root.x + pw * 0.42, y0, root.z), 0.018, m['cfrp']))
    for i in range(n):
        yc = y0 + side * (i * (ph + gap) + ph / 2)
        c = Vector((root.x, yc, root.z))
        parts.append(plane(f'{name}-p{i}', pw, ph, c + Vector((0, 0, 0.014)), material=m[cells]))
        parts.append(plane(f'{name}-b{i}', pw, ph, c - Vector((0, 0, 0.014)), rot=(math.pi, 0, 0), material=m['back']))
        for k, (sx, sy, off) in enumerate(((pw + 0.03, 0.03, (0, ph / 2, 0)), (pw + 0.03, 0.03, (0, -ph / 2, 0)),
                                           (0.03, ph, (pw / 2, 0, 0)), (0.03, ph, (-pw / 2, 0, 0)))):
            parts.append(kit.box(f'{name}-f{i}{k}', (sx, sy, 0.034), loc=c + Vector(off), material=m['alu']))
        if i:  # hinges across the gap
            for hx in (-pw * 0.3, pw * 0.3):
                parts.append(kit.box(f'{name}-h{i}{hx:+.1f}', (0.09, gap + 0.04, 0.05), loc=(root.x + hx, yc - side * (ph + gap) / 2, root.z),
                                     material=m['alu']))
    return parts


def reflector(name, d, at, normal, gold=False, ribs=12, depth=0.18):
    """A deployed parabolic reflector: dish of diameter `d` whose concave side faces `normal`, with back ribs and a rim."""
    m = mats()
    R = d / 2
    f = R * R / (4 * depth)
    V, F, segs, rings = [(0, 0, 0)], [], 64, 14
    for i in range(1, rings + 1):
        r = R * i / rings
        for j in range(segs):
            a = 2 * math.pi * j / segs
            V.append((r * math.cos(a), r * math.sin(a), r * r / (4 * f)))
    for j in range(segs):
        F.append((0, 1 + j, 1 + (j + 1) % segs))
    for i in range(rings - 1):
        b0, b1 = 1 + i * segs, 1 + (i + 1) * segs
        for j in range(segs):
            F.append((b0 + j, b0 + (j + 1) % segs, b1 + (j + 1) % segs, b1 + j))
    dish = kit.mesh(f'{name}-dish', V, F, m['dish_gold'] if gold else m['dish'], smooth=True)
    dish.modifiers.new('thick', 'SOLIDIFY').thickness = 0.02
    parts = [dish]
    rim = [Vector((R * math.cos(a), R * math.sin(a), depth)) for a in [2 * math.pi * j / 96 for j in range(97)]]
    parts.append(kit.curve(f'{name}-rim', rim, 0.025, m['alu']))
    for k in range(ribs):
        a = 2 * math.pi * k / ribs
        pts = [Vector(((R * t) * math.cos(a), (R * t) * math.sin(a), (R * t) ** 2 / (4 * f) - 0.04)) for t in [i / 10 for i in range(11)]]
        parts.append(kit.curve(f'{name}-rib{k}', pts, 0.018, m['cfrp']))
    parts.append(kit.cyl(f'{name}-hub', 0.14, 0.12, loc=(0, 0, -0.06), material=m['alu'], verts=24))
    root = kit.group(name, parts, loc=at)
    aim(root, normal)
    return [root]


def bus(name, sx, sy, sz, skin='gold', deck='gold'):
    """The spacecraft body: blankets on +-X, mirror radiators on +-Y (where the wings attach), an instrumented deck on +Z, the adapter
    ring and apogee engine on -Z, rails on every edge and thruster clusters at the lower corners."""
    m = mats()
    parts = [kit.box(f'{name}-core', (sx - 0.04, sy - 0.04, sz - 0.04), material=m['alu'])]
    for side in (1, -1):
        parts.append(puffy(kit.box(f'{name}-mli-x{side}', (0.03, sy * 0.98, sz * 0.98), loc=(side * sx / 2, 0, 0), material=m[skin], bevel=0.01)))
        parts.append(kit.box(f'{name}-osr-y{side}', (sx * 0.86, 0.02, sz * 0.8), loc=(0, side * sy / 2, 0.02 * sz), material=m['osr']))
        parts.append(puffy(kit.box(f'{name}-border-y{side}', (sx * 0.98, 0.018, sz * 0.98), loc=(0, side * (sy / 2 - 0.006), 0), material=m[skin]), 0.008))
    parts.append(puffy(kit.box(f'{name}-deck', (sx * 0.98, sy * 0.98, 0.03), loc=(0, 0, sz / 2), material=m[deck], bevel=0.01)))
    parts.append(puffy(kit.box(f'{name}-aft', (sx * 0.98, sy * 0.98, 0.03), loc=(0, 0, -sz / 2), material=m['black'], bevel=0.01)))
    for ex in (-1, 1):
        for ey in (-1, 1):
            parts.append(kit.box(f'{name}-rz{ex}{ey}', (0.045, 0.045, sz), loc=(ex * sx / 2, ey * sy / 2, 0), material=m['alu']))
            parts.append(kit.box(f'{name}-ry{ex}{ey}', (0.045, sy, 0.045), loc=(ex * sx / 2, 0, ey * sz / 2), material=m['alu']))
            parts.append(kit.box(f'{name}-rx{ex}{ey}', (sx, 0.045, 0.045), loc=(0, ex * sy / 2, ey * sz / 2), material=m['alu']))
            bx, by, bz = ex * (sx / 2 + 0.05), ey * (sy / 2 - 0.15), -sz / 2 + 0.12  # three small thrusters on a bracket at each lower corner
            parts.append(kit.box(f'{name}-tb{ex}{ey}', (0.1, 0.18, 0.1), loc=(bx, by, bz), material=m['alu']))
            for k, d in enumerate(((ex, 0, 0), (0, 0, -1), (ex * 0.7, ey * 0.7, 0))):
                nz = kit.cyl(f'{name}-tn{ex}{ey}{k}', 0.028, 0.08, loc=(bx + d[0] * 0.07, by + d[1] * 0.07, bz + d[2] * 0.07), material=m['nozzle'],
                             r2=0.012, verts=16)
                aim(nz, (-d[0], -d[1], -d[2]))
                parts.append(nz)
    parts.append(kit.cyl(f'{name}-adapter', min(sx, sy) * 0.33, 0.16, loc=(0, 0, -sz / 2 - 0.08), material=m['alu'], verts=48))
    parts.append(kit.cyl(f'{name}-apogee', 0.22, 0.45, loc=(0, 0, -sz / 2 - 0.35), material=m['nozzle'], r2=0.08, verts=32))
    return parts


def deck_kit(name, sx, sy, sz, horns=6, trackers=2, omni=True):
    """Equipment on the +Z deck: a feed-horn cluster, star trackers with baffles and lenses, an omni antenna, an Earth sensor, harnesses."""
    m = mats()
    top = sz / 2 + 0.02
    parts = []
    cols = max(1, horns // 2)
    for i in range(horns):
        hx = (i % cols - (cols - 1) / 2) * 0.24 + sx * 0.18
        hy = (i // cols - 0.5) * 0.24
        parts.append(kit.cyl(f'{name}-horn{i}', 0.1, 0.32, loc=(hx, hy, top + 0.16), material=m['horn'], r2=0.04, verts=24))
        parts.append(kit.cyl(f'{name}-hornmouth{i}', 0.092, 0.01, loc=(hx, hy, top + 0.33), material=m['matte_black'], verts=24))
    for k in range(trackers):
        bx, by = -sx * 0.32, (k - 0.5) * sy * 0.5
        body = kit.cyl(f'{name}-st{k}', 0.07, 0.22, loc=(bx, by, top + 0.13), material=m['matte_black'], verts=24)
        baffle = kit.cyl(f'{name}-stb{k}', 0.07, 0.18, loc=(bx - 0.04, by, top + 0.31), material=m['matte_black'], r2=0.12, verts=24)
        lens = kit.cyl(f'{name}-stl{k}', 0.065, 0.01, loc=(bx, by, top + 0.24), material=m['lens'], verts=24)
        for o in (body, baffle, lens):
            o.rotation_euler = (0, -0.35, 0)
        parts += [body, baffle, lens]
    if omni:
        parts.append(kit.cyl(f'{name}-omast', 0.025, 0.7, loc=(-sx * 0.15, sy * 0.3, top + 0.35), material=m['white'], verts=12))
        parts.append(kit.cyl(f'{name}-ocone1', 0.09, 0.12, loc=(-sx * 0.15, sy * 0.3, top + 0.76), material=m['white'], r2=0.01, verts=24))
        parts.append(kit.cyl(f'{name}-ocone2', 0.01, 0.12, loc=(-sx * 0.15, sy * 0.3, top + 0.88), material=m['white'], r2=0.09, verts=24))
    parts.append(kit.box(f'{name}-esensor', (0.18, 0.14, 0.12), loc=(sx * 0.05, -sy * 0.32, top + 0.06), material=m['black'], bevel=0.01))
    for k in range(2):
        parts.append(kit.cyl(f'{name}-eslens{k}', 0.035, 0.03, loc=(sx * 0.05 + (k - 0.5) * 0.08, -sy * 0.32, top + 0.13), material=m['lens'], verts=16))
    for k in range(3):  # cable bundles running over the deck
        y = (k - 1) * 0.12
        pts = [Vector((-sx * 0.4 + t * sx * 0.8, y + 0.05 * math.sin(t * 6 + k), top + 0.02)) for t in [i / 12 for i in range(13)]]
        parts.append(kit.curve(f'{name}-harness{k}', pts, 0.015, m['harness']))
    return parts


# ---------------------------------------------------------------- satellites
def comsat(name='comsat', size=(2.2, 1.9, 2.6), panels=4, reflectors=2, deck_reflector=False, skin='gold', deck='gold', cells='cells'):
    """A geostationary communications satellite: box bus, two long wings, deployed reflectors on the east and west faces, a deck farm."""
    sx, sy, sz = size
    m = mats()
    parts = bus(name, sx, sy, sz, skin, deck) + deck_kit(name, sx, sy, sz)
    for side in (1, -1):
        parts += solar_wing(f'{name}-w{side}', side, (0, side * sy / 2, 0.1), n=panels, cells=cells)
    for k in range(reflectors):
        side = 1 if k % 2 == 0 else -1
        at = Vector((side * (sx / 2 + 1.1), 0, sz * 0.15 + 0.25 * (k // 2)))
        parts += reflector(f'{name}-rf{k}', 2.3 - 0.3 * (k // 2), at, (-side * 0.55, 0, 1.0), gold=(k // 2 == 1))
        for dy in (-0.35, 0.35):
            parts.append(strut(f'{name}-arm{k}{dy:+}', (side * sx / 2, dy, sz * 0.25), at + Vector((-side * 0.3, dy * 0.4, -0.3)), 0.03, m['cfrp']))
    if deck_reflector:
        parts += reflector(f'{name}-rfdeck', 1.4, Vector((-sx * 0.1, 0, sz / 2 + 0.7)), (0.35, 0, 1.0), ribs=8, depth=0.12)
        parts.append(strut(f'{name}-deckarm', (-sx * 0.1, 0, sz / 2), (-sx * 0.1, 0, sz / 2 + 0.6), 0.04, m['cfrp']))
    return parts


def leosat(name='leosat', size=(3.2, 1.6, 1.6), panels=3, skin='silver', dish=True):
    """A large low-orbit satellite: long bus, instrument boxes, a dish on a boom, two wings, magnetorquer rods and patch antennas."""
    sx, sy, sz = size
    m = mats()
    parts = bus(name, sx, sy, sz, skin, 'gold') + deck_kit(name, sx, sy, sz, horns=0, trackers=2, omni=False)
    for side in (1, -1):
        parts += solar_wing(f'{name}-w{side}', side, (-sx * 0.15, side * sy / 2, 0.0), n=panels, pw=2.0, ph=1.5)
    for k, (x, w, h) in enumerate(((sx * 0.28, 0.6, 0.4), (sx * 0.05, 0.45, 0.3), (-sx * 0.15, 0.5, 0.35))):
        parts.append(puffy(kit.box(f'{name}-inst{k}', (w, sy * 0.55, h), loc=(x, 0, sz / 2 + h / 2), material=m['black' if k == 1 else 'gold'], bevel=0.02), 0.006))
    parts.append(kit.cyl(f'{name}-aperture', 0.22, 0.4, loc=(sx / 2 + 0.2, 0, 0.2), rot=(0, math.pi / 2, 0), material=m['matte_black'], verts=32))
    parts.append(kit.cyl(f'{name}-apl', 0.2, 0.01, loc=(sx / 2 + 0.41, 0, 0.2), rot=(0, math.pi / 2, 0), material=m['lens'], verts=32))
    if dish:
        parts.append(strut(f'{name}-boom', (-sx / 2, 0, sz * 0.3), (-sx / 2 - 0.8, 0, sz * 0.3 + 0.9), 0.04, m['cfrp']))
        parts += reflector(f'{name}-dish', 1.2, Vector((-sx / 2 - 0.9, 0, sz * 0.3 + 1.0)), (-0.3, 0, 1.0), ribs=8, depth=0.1)
    for k in (-1, 1):
        parts.append(kit.cyl(f'{name}-mtq{k}', 0.035, 1.0, loc=(k * sx * 0.25, sy / 2 + 0.06, -sz * 0.3), rot=(0, math.pi / 2, 0), material=m['harness'], verts=12))
    for k in range(4):
        parts.append(kit.cyl(f'{name}-patch{k}', 0.06, 0.02, loc=((k - 1.5) * 0.35, sy * 0.3, sz / 2 + 0.03), material=m['white'], verts=16))
    return parts


def msti(name='msti'):
    """MSTI-3, a small 1990s US test satellite: a compact eight-sided body in foil, one deployed wing, a sensor telescope on top."""
    m = mats()
    parts = [puffy(kit.cyl(f'{name}-body', 0.5, 0.9, material=m['gold'], verts=8, smooth=False), 0.006, 0.07)]
    parts.append(kit.cyl(f'{name}-top', 0.51, 0.04, loc=(0, 0, 0.47), material=m['black'], verts=8, smooth=False))
    parts.append(kit.cyl(f'{name}-bot', 0.51, 0.04, loc=(0, 0, -0.47), material=m['alu'], verts=8, smooth=False))
    parts.append(kit.cyl(f'{name}-scope', 0.17, 0.6, loc=(0.15, 0, 0.75), material=m['white'], verts=32))
    parts.append(kit.cyl(f'{name}-baffle', 0.17, 0.25, loc=(0.15, 0, 1.15), material=m['matte_black'], r2=0.22, verts=32))
    parts.append(kit.cyl(f'{name}-lens', 0.16, 0.01, loc=(0.15, 0, 1.05), material=m['lens'], verts=32))
    parts += solar_wing(f'{name}-w', 1, (0, 0.5, 0), n=2, pw=1.0, ph=0.9, yoke=0.35)
    parts.append(kit.cyl(f'{name}-ant', 0.012, 0.5, loc=(-0.3, -0.3, 0.72), material=m['alu'], verts=8))
    return parts


def p78(name='p78'):
    """Solwind P78-1 (1979): a spinning drum covered in silicon cells (the wheel) under a sun-pointed platform (the sail) carrying the
    coronagraph and the other instruments, with two solar paddles."""
    m = mats()
    parts = [kit.cyl(f'{name}-wheel', 1.05, 1.3, material=m['cells_si'], verts=12, smooth=False)]
    for z in (0.66, -0.66):
        parts.append(kit.cyl(f'{name}-ring{z:+}', 1.07, 0.06, loc=(0, 0, z), material=m['alu'], verts=12, smooth=False))
    parts.append(puffy(kit.cyl(f'{name}-wheeltop', 1.0, 0.05, loc=(0, 0, 0.7), material=m['black'], verts=12, smooth=False), 0.005))
    parts.append(kit.cyl(f'{name}-mast', 0.25, 0.5, loc=(0, 0, 0.95), material=m['alu'], verts=24))
    parts.append(puffy(kit.box(f'{name}-sail', (2.6, 1.3, 0.3), loc=(0, 0, 1.35), material=m['gold'], bevel=0.02), 0.008))
    parts.append(kit.cyl(f'{name}-corona', 0.16, 1.6, loc=(0.6, 0.35, 1.68), rot=(0, math.pi / 2, 0), material=m['white'], verts=32))
    parts.append(kit.cyl(f'{name}-occ', 0.16, 0.01, loc=(1.41, 0.35, 1.68), rot=(0, math.pi / 2, 0), material=m['lens'], verts=32))
    for k, (x, y, w) in enumerate(((-0.7, -0.3, 0.5), (-0.1, -0.35, 0.35), (-0.9, 0.35, 0.3))):
        parts.append(kit.box(f'{name}-inst{k}', (w, 0.35, 0.25), loc=(x, y, 1.62), material=m['black' if k else 'silver'], bevel=0.02))
    for side in (1, -1):
        parts += solar_wing(f'{name}-w{side}', side, (0, side * 0.65, 1.35), n=2, pw=1.2, ph=1.0, yoke=0.3, cells='cells_si')
    return parts


def lattice(name, length, width, segs, strut_r, material):
    """A square truss along Y: rings of four corners joined by longerons, battens and diagonals, as real struts (wireframe)."""
    V, F = [], []
    for i in range(segs + 1):
        y = -length / 2 + length * i / segs
        V += [(-width / 2, y, -width / 2), (width / 2, y, -width / 2), (width / 2, y, width / 2), (-width / 2, y, width / 2)]
    for i in range(segs):
        a, b = 4 * i, 4 * (i + 1)
        for k in range(4):
            F.append((a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k))
    ob = kit.mesh(name, V, F, material)
    ob.modifiers.new('tri', 'TRIANGULATE')
    w = ob.modifiers.new('wire', 'WIREFRAME')
    w.thickness = strut_r
    w.use_even_offset = False
    return ob


def iss(name='iss'):
    """The International Space Station, about 109 m across: the integrated truss as a lattice, four pairs of golden-brown array wings on
    their masts, six big radiators, the pressurised modules in quilted beta cloth (US Lab, the nodes, Columbus, Kibo with its exposed
    platform, Zarya and Zvezda with Zvezda's own blue wings) and the Canadarm2 robotic arm. +Y along the truss, +X along the modules."""
    m = mats()
    parts = [lattice(f'{name}-truss', 92, 4.5, 30, 0.18, m['alu'])]
    for side in (1, -1):
        for k, y in enumerate((36.0, 44.0)):
            yy = side * y
            parts.append(kit.cyl(f'{name}-sarj{side}{k}', 2.6, 1.2, loc=(0, yy, 0), rot=(math.pi / 2, 0, 0), material=m['alu'], verts=32))
            for zs in (1, -1):  # each wing: two blankets either side of a mast, 35 m out from the truss
                for xs in (-1, 1):
                    c = Vector((xs * 3.1, yy, zs * 19.0))
                    parts.append(plane(f'{name}-arr{side}{k}{zs}{xs}', 5.4, 33.0, c, rot=(math.pi / 2, 0, math.pi / 2), material=m['cells_iss']))
                    parts.append(plane(f'{name}-arrb{side}{k}{zs}{xs}', 5.4, 33.0, c + Vector((0, -0.05 * side, 0)), rot=(-math.pi / 2, 0, math.pi / 2),
                                       material=m['back']))
                parts.append(kit.cyl(f'{name}-mast{side}{k}{zs}', 0.25, 34.0, loc=(0, yy, zs * 19.0), material=m['alu'], verts=8))
                parts.append(kit.box(f'{name}-box{side}{k}{zs}', (2.0, 1.2, 1.4), loc=(0, yy, zs * 2.2), material=m['white']))
        for r in range(3):  # radiators hanging below the truss near the middle
            parts.append(kit.box(f'{name}-rad{side}{r}', (3.2, 0.12, 12.0), loc=(0, side * (12 + r * 3.6), -9.0), material=m['white']))
    mods = [  # (x along the modules, radius, length, name)
        (0.0, 2.2, 6.0, 'node1'), (8.5, 2.2, 8.5, 'lab'), (15.5, 2.2, 6.5, 'node2'), (-8.0, 2.05, 12.5, 'zarya'), (-20.5, 2.05, 13.0, 'zvezda')]
    for x, r, ln, tag in mods:
        parts.append(kit.cyl(f'{name}-{tag}', r, ln, loc=(x, 0, -6.0), rot=(0, math.pi / 2, 0), material=m['beta'], verts=32))
        for e in (-1, 1):
            parts.append(kit.cyl(f'{name}-{tag}-ring{e}', r * 1.03, 0.25, loc=(x + e * ln / 2, 0, -6.0), rot=(0, math.pi / 2, 0), material=m['alu'], verts=32))
    parts.append(kit.cyl(f'{name}-columbus', 2.2, 6.5, loc=(15.5, -5.5, -6.0), rot=(math.pi / 2, 0, 0), material=m['beta'], verts=32))
    parts.append(kit.cyl(f'{name}-kibo', 2.2, 11.0, loc=(15.5, 7.5, -6.0), rot=(math.pi / 2, 0, 0), material=m['beta'], verts=32))
    parts.append(kit.box(f'{name}-kibo-ef', (5.0, 5.5, 0.5), loc=(15.5, 15.5, -6.0), material=m['silver']))
    parts.append(kit.cyl(f'{name}-node3', 2.2, 6.5, loc=(0, -5.5, -6.0), rot=(math.pi / 2, 0, 0), material=m['beta'], verts=32))
    parts.append(kit.cyl(f'{name}-cupola', 1.5, 1.6, loc=(0, -9.5, -6.0), rot=(math.pi / 2, 0, 0), material=m['alu'], r2=1.0, verts=7))
    for side in (1, -1):  # Zvezda's own wings
        for k in range(3):
            c = Vector((-22.0, side * (5.5 + k * 3.3), -6.0))
            parts.append(plane(f'{name}-zv{side}{k}', 3.1, 3.0, c, rot=(math.pi / 2, 0, 0), material=m['cells']))
    arm = [Vector((8.5, 0, -3.5)), Vector((8.5, 2.0, 4.0)), Vector((5.0, 6.0, 9.0)), Vector((1.0, 9.0, 7.5))]
    parts.append(kit.curve(f'{name}-canadarm', arm, 0.22, m['white']))
    for k, p in enumerate(arm[1:-1]):
        parts.append(kit.sphere(f'{name}-joint{k}', 0.45, p, m['alu'], seg=16))
    return parts
