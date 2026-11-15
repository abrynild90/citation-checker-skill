# A Ticonderoga-class cruiser (USS Lake Erie) for the Burnt Frost poster, in metres, bow toward +X, waterline at z = 0, 170 m long: a lofted hull
# with a raked stem, the superstructure with its radar faces, two uptakes, masts, the 5-inch guns, flush missile-launcher decks, the
# helicopter hangar and a wake laid on the sea. scenes_launch.burnt_frost() places it with Shot.place and calls wake() for the foam.
import math

import bpy
from mathutils import Vector

import kit
import surface as S

LENGTH, BEAM, DRAFT, DECK = 170.0, 16.8, 6.5, 6.5


def _hull(name, material):
    rings = []
    for i in range(41):
        u = i / 40
        x = -LENGTH / 2 + LENGTH * u
        w = BEAM / 2 * (0.82 + 0.18 * min(1.0, u / 0.12)) * (1.0 if u < 0.62 else max(0.04, ((1 - u) / 0.38) ** 0.8))
        top = DECK + 19 * max(0.0, u - 0.55) ** 2  # the sheer rises to the bow
        half = [(w * (t ** 0.5) * (1 + 0.28 * t ** 2), -DRAFT + (top + DRAFT) * t) for t in (j / 8 for j in range(9))]
        ring = [(x, y, z) for y, z in half] + [(x, -y, z) for y, z in reversed(half)]
        rings.append(ring)
    return S.loft(name, rings, material, subdiv=0, smooth=False)


def cruiser(name='ship'):
    """All parts of the ship in model space."""
    hull = kit.mat(f'{name}-hull', '#7d848b', rough=0.6)
    paint = kit.mat(f'{name}-paint', '#8d949b', rough=0.6)
    dark = kit.mat(f'{name}-dark', '#1a1d21', rough=0.6)
    deck = kit.mat(f'{name}-deck', '#4c5156', rough=0.7)
    steel = kit.mat(f'{name}-steel', '#b8bdc4', metallic=0.8, rough=0.35)
    parts = [_hull(f'{name}-hull', hull)]

    def blk(n, size, loc, mat=paint):
        parts.append(kit.box(f'{name}-{n}', size, loc=loc, material=mat, bevel=0.15))

    blk('deckplate', (LENGTH * 0.9, BEAM * 0.9, 0.3), (-4, 0, DECK + 0.1), deck)
    blk('fwd-vls', (16, 8, 0.35), (45, 0, DECK + 0.4), dark)  # the launcher deck the SM-3 leaves from
    blk('aft-vls', (16, 8, 0.35), (-30, 0, DECK + 0.4), dark)
    blk('house1', (34, 13, 5), (14, 0, DECK + 2.8))
    blk('house2', (24, 11.5, 5), (14, 0, DECK + 7.5))
    blk('bridge', (11, 12, 3.5), (24, 0, DECK + 11.5))
    blk('house-aft', (20, 12, 5), (-16, 0, DECK + 3))
    for sx in (-1, 1):  # the four radar faces, two on each house
        blk(f'spy-f{sx}', (7, 0.4, 5.5), (14, sx * 5.9, DECK + 7.5), dark)
        blk(f'spy-a{sx}', (7, 0.4, 4.5), (-16, sx * 6.1, DECK + 3.2), dark)
    for k, x in enumerate((-6.0, -26.0)):  # two uptakes with caps
        blk(f'stack{k}', (11, 8, 8), (x, 0, DECK + 9))
        blk(f'cap{k}', (8, 6, 1.2), (x - 2.5, 0, DECK + 13.6), dark)
    glow = kit.mat(f'{name}-window', '#ffd9a0', emit='#ffb866', emit_strength=3.0)
    for k in range(5):  # a few lit bridge windows
        blk(f'win{k}', (0.3, 1.1, 0.7), (29.7, (k - 2) * 2.2, DECK + 12.0), glow)
    blk('hangar', (14, 11, 6), (-52, 0, DECK + 3.5))
    blk('helo-deck', (24, 14, 0.5), (-67, 0, DECK + 0.4), deck)
    parts.append(kit.cyl(f'{name}-mast1', 0.5, 20, loc=(21, 0, DECK + 22), material=steel, verts=10))
    parts.append(kit.cyl(f'{name}-mast2', 0.45, 16, loc=(-18, 0, DECK + 20), material=steel, verts=10))
    for k, (x, z) in enumerate(((21, DECK + 28), (-18, DECK + 25))):
        parts.append(kit.cyl(f'{name}-yard{k}', 0.25, 9, loc=(x, 0, z), rot=(math.pi / 2, 0, 0), material=steel, verts=8))
    for k, x in enumerate((70, -45)):  # the two 5-inch gun mounts
        blk(f'gun{k}', (6, 5.5, 2.8), (x, 0, DECK + 3))
        parts.append(kit.cyl(f'{name}-barrel{k}', 0.28, 7, loc=(x + (5 if k == 0 else -5), 0, DECK + 3.2), rot=(0, math.pi / 2, 0), material=steel, verts=10))
    return parts


def wake(at, forward, scale, length=1.5):
    """Foam behind a ship at `at` (a point on the unit sphere) heading along `forward`: one continuous V-shaped sheet of pale blue-grey foam on the
    sea, widest and brightest at the stern, fanning gently and fading smoothly to nothing about `length` ship lengths astern. `scale` is the
    ship's scale (metres to scene units)."""
    n = Vector(at).normalized()
    fwd = (Vector(forward) - n * Vector(forward).dot(n)).normalized()
    lat = n.cross(fwd)
    rows, cols, reach = 48, 17, LENGTH * length
    verts, uvs, faces = [], [], []
    for i in range(rows + 1):
        t = i / rows
        half = BEAM * 0.5 + t * reach * 0.05
        for j in range(cols):
            v = -1 + 2 * j / (cols - 1)
            verts.append((n + (fwd * (-LENGTH / 2 - t * reach) + lat * v * half) * scale).normalized() * (1 + 1.5 * scale))
            uvs.append((t, v))
    for i in range(rows):
        faces += [(i * cols + j, i * cols + j + 1, (i + 1) * cols + j + 1, (i + 1) * cols + j) for j in range(cols - 1)]
    ob = kit.mesh('wake', verts, faces, _wake_material(), smooth=True)
    layer = ob.data.uv_layers.new(name='uv')
    for lp in ob.data.loops:
        layer.data[lp.index].uv = uvs[lp.vertex_index]
    ob.visible_shadow = False


def _wake_material():
    """Foam: emission faded along the wake (u) and across it (v), brightest on the two arms with a dimmer churned centre."""
    m = bpy.data.materials.new('wake-m')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    sep = N('ShaderNodeSeparateXYZ')
    uv = N('ShaderNodeTexCoord').outputs['UV']
    L(uv, sep.inputs[0])
    stretch = N('ShaderNodeMapping')
    stretch.inputs['Scale'].default_value = (3.0, 16.0, 1.0)  # streaks run along the wake
    L(uv, stretch.inputs['Vector'])
    noise = N('ShaderNodeTexNoise')
    noise.inputs['Detail'].default_value = 4.0
    L(stretch.outputs['Vector'], noise.inputs['Vector'])
    streaks = kit._m(nt, 'MULTIPLY_ADD', noise.outputs['Fac'], 1.6, -0.25, clamp=True)
    fade = kit._m(nt, 'POWER', kit._m(nt, 'SUBTRACT', 1.0, sep.outputs[0]), 1.8)
    av = kit._m(nt, 'ABSOLUTE', sep.outputs[1])
    arms = kit._m(nt, 'EXPONENT', kit._m(nt, 'MULTIPLY', kit._m(nt, 'MULTIPLY', kit._m(nt, 'SUBTRACT', av, 0.78), kit._m(nt, 'SUBTRACT', av, 0.78)), -28.0))
    centre = kit._m(nt, 'MULTIPLY', kit._m(nt, 'SUBTRACT', 1.0, av), 0.35)
    edge = kit._m(nt, 'SUBTRACT', 1.0, kit._m(nt, 'POWER', av, 3.0))
    alpha = kit._m(nt, 'MULTIPLY', kit._m(nt, 'MULTIPLY', fade, kit._m(nt, 'ADD', arms, centre)), kit._m(nt, 'MULTIPLY', kit._m(nt, 'MULTIPLY', edge, streaks), 0.8))
    em = N('ShaderNodeEmission')
    em.inputs['Color'].default_value = kit.hexc('#7f93a3')
    em.inputs['Strength'].default_value = 1.0
    mix = N('ShaderNodeMixShader')
    L(alpha, mix.inputs['Fac'])
    L(N('ShaderNodeBsdfTransparent').outputs[0], mix.inputs[1])
    L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], N('ShaderNodeOutputMaterial').inputs['Surface'])
    return m
