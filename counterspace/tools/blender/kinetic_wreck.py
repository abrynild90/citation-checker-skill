# Wreckage of a destroyed satellite for the Fengyun and Shakti posters: torn solar-panel pieces (whole cells, ragged tear lines, curled),
# crumpled insulation blankets, tank and strut fragments, and a bus remnant with a stub of wing. Model units are metres.
import math
import random

import kinetic_fx as fx
import kit
import sats
import surface as S
from kit import Vector

CELL = 0.275  # one cell of the 8 x 6 solar map on sats' 2.2 x 1.65 m panels


def cells_mat():
    """The solar-cell map on a satin finish: lit by a soft fill the cells read as blue, where sats' mirror-coated cells reflect black space."""
    name = 'wreck-cells'
    if name in kit.bpy.data.materials:
        return kit.bpy.data.materials[name]
    m = kit.mat(name, '#ffffff', metallic=0.15, rough=0.4)
    nt = m.node_tree
    tx = nt.nodes.new('ShaderNodeTexImage')
    tx.image = S.solar_cell_map(8, 6, seed=2, style='gaas')
    nt.links.new(nt.nodes.new('ShaderNodeTexCoord').outputs['UV'], tx.inputs['Vector'])
    p = nt.nodes['Principled BSDF']
    lift = nt.nodes.new('ShaderNodeMix')  # the map's cells are near black: lift them to a mid blue so the cell grid shows
    lift.data_type, lift.blend_type = 'RGBA', 'MULTIPLY'
    lift.inputs['Factor'].default_value = 1.0
    lift.inputs['B'].default_value = (3.0, 3.0, 3.0, 1.0)
    nt.links.new(tx.outputs['Color'], lift.inputs['A'])
    nt.links.new(lift.outputs['Result'], p.inputs['Base Color'])
    nt.links.new(lift.outputs['Result'], p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value = 0.3  # earthshine and scattered light the scene does not model
    return m


def back_mat():
    """The back of a wreck panel: mid-grey, so no fragment outshines the burst."""
    if 'wreck-back' in kit.bpy.data.materials:
        return kit.bpy.data.materials['wreck-back']
    return kit.mat('wreck-back', '#5d6167', rough=0.6)


def torn_panel(name, rng):
    """A piece of a solar panel: a block of whole cells cut by a ragged tear line, curled, cells on the front and the white back behind."""
    m = sats.mats()
    cols, rows = rng.randint(3, 7), rng.randint(2, 5)
    i0, j0 = rng.randint(0, 8 - cols), rng.randint(0, 6 - rows)
    ang, cut, curl = rng.uniform(0, math.tau), rng.uniform(0.0, 0.35), rng.uniform(-0.3, 0.3)
    keep = {}
    for i in range(cols):
        for j in range(rows):
            x, y = (i + 0.5 - cols / 2) * CELL, (j + 0.5 - rows / 2) * CELL
            edge = x * math.cos(ang) + y * math.sin(ang)
            keep[i, j] = edge < (0.5 - cut) * cols * CELL * 0.5 + rng.uniform(-0.3, 0.3) * CELL
    if sum(keep.values()) < 3:
        keep = {k: True for k in keep}
    pos, V, F, uvs = {}, [], [], []
    for (i, j), k in keep.items():
        if not k:
            continue
        quad = []
        for di, dj in ((0, 0), (1, 0), (1, 1), (0, 1)):
            key = (i + di, j + dj)
            if key not in pos:
                x, y = (key[0] - cols / 2) * CELL, (key[1] - rows / 2) * CELL
                pos[key] = len(V)
                V.append((x, y, curl * x * x + rng.uniform(-0.01, 0.01)))
                uvs.append(((i0 + key[0]) / 8, (j0 + key[1]) / 6))
            quad.append(pos[key])
        F.append(tuple(quad))
    front = kit.mesh(f'{name}-cells', V, F, cells_mat())
    back = kit.mesh(f'{name}-back', [(x, y, z - 0.015) for x, y, z in V], [tuple(reversed(f)) for f in F], back_mat())
    for ob in (front, back):
        uv = ob.data.uv_layers.new(name='UVMap')
        for lp in ob.data.loops:
            uv.data[lp.index].uv = uvs[lp.vertex_index]
    return [front, back]


def blanket(name, rng, skin='gold'):
    """A small crumpled sheet of multi-layer insulation, thin and in a range of sizes."""
    k = rng.uniform(0.3, 1.0)
    w, h = k * rng.uniform(0.7, 1.3), k * rng.uniform(0.5, 1.0)
    return [sats.puffy(kit.box(name, (w, h, 0.02), material=sats.mats()[skin], bevel=0.005), 0.1 * k, 0.4)]


def titanium():
    """Scorched titanium: dull dark grey, the roughness patchy."""
    if 'wreck-titanium' in kit.bpy.data.materials:
        return kit.bpy.data.materials['wreck-titanium']
    return kit.mat('wreck-titanium', '#4a4c50', metallic=0.6, rough=0.62)


def tank(name, rng):
    """A bare propellant tank shell with a short stub of pipe, in scorched titanium."""
    r = rng.uniform(0.15, 0.24)
    shell = kit.sphere(f'{name}-shell', r, material=titanium(), seg=32)
    shell.scale = (1, 1, 0.8)
    return [shell, kit.cyl(f'{name}-pipe', 0.025, r * 1.3, loc=(0, 0, r), material=titanium(), verts=12)]


def piece(name, rng):
    """One random fragment, weighted toward panels because a satellite is mostly panel (tanks are added separately, a couple at most)."""
    kind = rng.choice(('panel', 'panel', 'panel', 'panel', 'blanket', 'blanket', 'blanket'))
    return {'panel': torn_panel, 'blanket': blanket}[kind](name, rng)


def remnant(name):
    """The largest surviving chunk, clearly broken: one side torn open on a dark interior with a tank and ribs, the top deck bent up on its hinge,
    the far wall half gone, a rail snapped and bent, foil trailing, and the wing snapped off at the root with a torn stub of panel."""
    m = sats.mats()
    sx, sy, sz = 1.5, 1.1, 1.3

    def box(tag, size, loc, mat, rot=(0, 0, 0), puff=0.0):
        ob = kit.box(f'{name}-{tag}', size, loc=loc, material=mat, bevel=0.01, rot=rot)
        return sats.puffy(ob, puff, 0.4) if puff else ob
    a = math.radians(40)
    parts = [box('xp', (0.04, sy, sz), (sx / 2, 0, 0), m['gold'], puff=0.03),
             box('xn', (0.04, sy, sz * 0.55), (-sx / 2, 0, -sz * 0.22), m['gold'], puff=0.03),  # far wall torn away over its top half
             box('yp', (sx, 0.03, sz), (0, sy / 2, 0), m['osr']),
             box('aft', (sx, sy, 0.03), (0, 0, -sz / 2), m['black'], puff=0.02),
             box('deck', (sx * 0.98, sy * 0.98, 0.03), (sx / 2 - sx / 2 * math.cos(a), 0, sz / 2 + sx / 2 * math.sin(a)), m['gold'], rot=(0, a, 0), puff=0.03),
             box('core', (sx * 0.8, sy * 0.7, sz * 0.8), (0.05, 0, 0), m['matte_black'])]
    parts.append(kit.sphere(f'{name}-tank', 0.3, (-0.15, -0.15, -0.05), titanium(), seg=24))
    for k in range(3):  # ribs and cables across the open side
        parts.append(box(f'rib{k}', (0.05, 0.05, sz * 0.9), (-0.5 + k * 0.5, -sy / 2, 0), m['alu']))
        parts.append(kit.curve(f'{name}-cab{k}', [Vector((-0.4 + k * 0.4, -sy / 2, 0.3)), Vector((-0.3 + k * 0.4, -sy / 2 - 0.25, 0.1)), Vector((-0.5 + k * 0.5, -sy / 2 - 0.5, -0.4))], 0.015, m['harness']))
    for tag, loc, size in (('r1', (0, sy / 2, -sz / 2), (sx, 0.045, 0.045)), ('r2', (sx / 2, sy / 2, 0), (0.045, 0.045, sz)),
                           ('r3', (sx / 2, 0, -sz / 2), (0.045, sy, 0.045)), ('r4', (-sx / 2, -sy / 2, -sz / 2), (0.045, 0.045, sz * 0.5))):
        parts.append(box(tag, size, loc, m['alu']))
    parts.append(kit.curve(f'{name}-bent', [Vector((sx / 2, -sy / 2, -sz / 2)), Vector((sx / 2 + 0.4, -sy / 2 - 0.15, -sz / 2 - 0.05)), Vector((sx / 2 + 0.8, -sy / 2 - 0.45, -sz / 2 - 0.35))], 0.03, m['alu']))
    parts.append(sats.puffy(kit.box(f'{name}-foil', (0.02, 0.6, 1.7), loc=(-sx / 2 - 0.45, 0.2, 0.25), material=m['gold'], rot=(0.3, 0.5, 0.4)), 0.12, 0.35))
    parts.append(kit.cyl(f'{name}-sada', 0.13, 0.22, loc=(0, sy / 2 + 0.11, 0.1), rot=(math.pi / 2, 0, 0), material=m['alu'], verts=24))
    for k, d in enumerate((-0.4, 0.4)):  # yoke struts snapped at different lengths
        parts.append(kit.curve(f'{name}-yoke{k}', [Vector((0, sy / 2 + 0.2, 0.1)), Vector((d * 0.5, sy / 2 + 0.5 + k * 0.2, 0.15))], 0.022, m['cfrp']))
    for ob in torn_panel(f'{name}-stub', random.Random(11)):
        ob.location = (0.2, sy / 2 + 1.0, 0.2)
        ob.rotation_euler = (0.2, 0.15, 0.4)
        parts.append(ob)
    return parts


def _screen(shot, p):
    """Screen position (-1..1 each way) of world point `p`; far outside if behind the camera."""
    q = shot.cam.matrix_world.inverted() @ p
    return (q.x / -q.z / shot.tx, q.y / -q.z / shot.ty) if q.z < 0 else (9.0, 9.0)


def throw(name, centre, direction, n, reach, size, color, seed, shot, fill, hero=None, features=(), tanks=2, streaks=5, trails=True, margin=0.75):
    """`n` fragments thrown out from `centre` along unit vectors given by direction(rng), tumbling at random, plus `tanks` small dull tanks.
    Pieces are redrawn if they would land nearer the camera than the burst or within `margin` of the frame edge, so nothing is cropped.
    `streaks` of them get a short soft trail behind them (drawn only with `trails`) and about a third get a glint. `features` are (direction, distance, scale) of
    larger torn panels placed by hand; `hero`, (direction, distance, aim, up, scale), is the torn bus. `fill` is (position, watts, colour)
    of a light that lights the wreckage only (light linking), so it can be strong without lighting the planet."""
    before = set(kit.bpy.data.objects)
    rng = random.Random(seed)
    cam = shot.cam.location
    slots = [('piece', None)] * n + [('tank', None)] * tanks + [('panel', f) for f in features] + ([('hero', hero)] if hero else [])
    marked = set(rng.sample(range(n), min(streaks, n)))
    lines, glints = [], []
    for i, (kind, fixed) in enumerate(slots):
        for _ in range(60):
            d = Vector(fixed[0]).normalized() if fixed else direction(rng)
            rho = fixed[1] if fixed else reach * (0.35 + rng.random() ** 1.3 * 0.65)
            p = Vector(centre) + d * rho
            sx, sy = _screen(shot, p)
            if fixed or ((p - cam).length > 0.7 * (Vector(centre) - cam).length and abs(sx) < margin and abs(sy) < margin):
                break
        s = size * rng.uniform(0.5, 1.4)
        if kind == 'hero':
            parts, gs = remnant(f'{name}{i}'), size * fixed[4]
        elif kind == 'panel':
            parts, gs = torn_panel(f'{name}{i}', rng), size * fixed[2]
        else:
            parts, gs = (tank(f'{name}{i}', rng) if kind == 'tank' else piece(f'{name}{i}', rng)), s
        rnd = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized()
        aim, up = (fixed[2], fixed[3]) if kind == 'hero' else (rnd, (cam - p).normalized() * 0.5 + Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized() * 0.9)
        kit.group(f'{name}{i}', parts, loc=p, scale=gs, aim=aim, up=up)
        if i in marked and trails:
            back = (-d + Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))) * 0.6).normalized() * size * rng.uniform(1.5, 3.5)
            lines.append(([p, p + back * 0.5, p + back], rng.uniform(0.7, 1.2)))
        if kind == 'piece' and rng.random() < 0.3:
            glints.append(p + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * s * 0.6)
    fx.streaks(name + '-trails', lines, size * 0.05, kit.glow_mat(name + '-trail-m', color, 0.9, fresnel=True, alpha=0.5, power=1.2))
    if glints:
        kit.debris(name + '-glints', lambda i, r: glints[i], len(glints), size=size * 0.12, color='#fff4e0', glow=12, seed=seed, metal_share=0.0)
    lit = kit.bpy.data.collections.new(name + '-lit')
    for ob in kit.bpy.data.objects:
        if ob not in before and ob.type in ('MESH', 'CURVE'):
            lit.objects.link(ob)
    kit._point_light(name + '-fill', fill[0], fill[1], fill[2], 0.12).light_linking.receiver_collection = lit
