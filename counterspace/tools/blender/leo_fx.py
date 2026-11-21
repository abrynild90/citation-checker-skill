# Helpers for the low-orbit posters (scenes_leo.py): lamps that light only the models, a camera-relative Sun, a fine debris stream with a few
# large tumbling pieces, and a soft jamming dome.
import math
import random

import bpy
from mathutils import Vector

import kit
import sats


def sun_from(sh, right=0.0, up=0.0, toward=0.0):
    """A Sun direction given in the camera's frame: `toward` > 0 puts the Sun behind the camera, < 0 behind the scene."""
    m = sh.cam.matrix_world.to_3x3()
    return (m @ Vector((right, up, toward))).normalized()


def fill(name, parts, direction, energy, color=(1.0, 1.0, 1.0)):
    """A soft Sun-type lamp that lights only `parts` (the models), never the planet, whose own Sun is a linked twin (see kit.split_sun_shadows)."""
    col = bpy.data.collections.new(name)
    for ob in parts:
        col.objects.link(ob)
    lamp = bpy.data.lights.new(name, 'SUN')
    lamp.energy, lamp.color, lamp.angle, lamp.use_shadow = energy, color, math.radians(12), False
    ob = bpy.data.objects.new(name, lamp)
    bpy.context.collection.objects.link(ob)
    ob.rotation_euler = (-Vector(direction).normalized()).to_track_quat('-Z', 'Y').to_euler()
    ob.light_linking.receiver_collection = col
    return ob


def _sliver(c, s, rng):
    """Four vertices of a thin, elongated shard around c."""
    a = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized()
    b = a.orthogonal().normalized()
    d = a.cross(b)
    return [c + a * s, c - a * s * rng.uniform(0.4, 1.0), c + b * s * 0.28, c + d * s * 0.28]


def stream(name, path, n, spread, size, seed=3, hot='#ffc08a', depth_exp=0.7, grow=1.6, glint=0.12):
    """n fine fragments along `path` (a list of points, near end first): a dense core that widens with distance, each piece scaled with its
    depth from the camera (`depth_exp` 0 keeps them one size, so perspective shrinks the far ones) and its spread grows along the path by `grow`. Three kinds: white-hot glints, warm embers and dull metal."""
    rng = random.Random(seed)
    cam = bpy.context.scene.camera.location
    kinds = {'glint': ([], kit.glow_mat(name + '-glint', '#fff4e0', 40.0)), 'ember': ([], kit.glow_mat(name + '-ember', hot, 6.0)),
             'metal': ([], kit.mat(name + '-metal', '#c9ccd2', metallic=1.0, rough=0.22))}
    for _ in range(n):
        t = rng.random() ** 1.25
        i = min(int(t * (len(path) - 1)), len(path) - 2)
        c = path[i].lerp(path[i + 1], t * (len(path) - 1) - i)
        w = spread * (0.25 + grow * t)
        c = c + Vector((rng.gauss(0, w), rng.gauss(0, w), rng.gauss(0, w)))
        s = size * ((c - cam).length / 0.3) ** depth_exp * (0.5 + rng.random() ** 3 * 2.2)
        r = rng.random()
        kinds['glint' if r < glint else 'ember' if r < glint + 0.28 else 'metal'][0].append(_sliver(c, s, rng))
    out = []
    for tag, (shards, m) in kinds.items():
        V, F = [], []
        for vs in shards:
            k = len(V)
            V += vs
            F += [(k, k + 1, k + 2), (k, k + 1, k + 3), (k, k + 2, k + 3), (k + 1, k + 2, k + 3)]
        ob = kit.mesh(f'{name}-{tag}', V, F, m)
        ob.visible_shadow = False
        out.append(ob)
    return out


def _transform(ob, c, s, rng):
    ob.location, ob.scale = c, (s, s, s)
    ob.rotation_euler = (rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(0, 6.3))
    ob.visible_shadow = False
    return ob


def wreckage(name, spots, seed=5):
    """Large debris at `spots` [(point, size)], cycling through three kinds: a torn solar-array panel (ragged outline, bent, with a twisted frame
    rail), a crumpled sheet of torn foil, and a broken strut with a stub. Built at unit size so materials keep their pattern scale, then scaled
    and tumbled."""
    rng = random.Random(seed)
    m = sats.mats()
    parts = []
    for k, (c, s) in enumerate(spots):
        kind = k % 3
        if kind == 0:
            n = 9
            ang = sorted(rng.uniform(0, 6.28) for _ in range(n))
            rim = [(1.3 * math.cos(t) * r, 0.8 * math.sin(t) * r) for t, r in ((t, rng.uniform(0.55, 1.0)) for t in ang)]
            bend = lambda x, y: 0.3 * x * x + 0.15 * y
            V = [(x, y, bend(x, y) + dz) for dz in (-0.025, 0.025) for x, y in rim]
            F = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
            panel = _transform(kit.mesh(f'{name}{k}-panel', V, F, m['silver']), c, s, rng)
            rail = [Vector((x, y, bend(x, y) + 0.04)) for x, y in rim[:6]]
            frame = kit.curve(f'{name}{k}-rail', rail, 0.035, m['alu'], resolution=3)
            frame.location, frame.scale, frame.rotation_euler, frame.visible_shadow = panel.location, panel.scale, panel.rotation_euler, False
            parts += [panel, frame]
        elif kind == 1:
            cols, rows = 7, 5
            V = [(1.3 * (i / (cols - 1) - 0.5) * 2, 0.9 * (j / (rows - 1) - 0.5) * 2, 0.25 * math.sin(3 * i + j) + rng.uniform(-0.12, 0.12)) for j in range(rows) for i in range(cols)]
            F = [(j * cols + i, j * cols + i + 1, (j + 1) * cols + i + 1, (j + 1) * cols + i) for j in range(rows - 1) for i in range(cols - 1) if rng.random() > 0.15]
            foil = kit.mesh(f'{name}{k}-foil', V, F, m['gold'], smooth=True)
            _transform(foil, c, s, rng)
            parts.append(foil)
        else:
            pts = [Vector((-1.2 + 0.6 * i, 0.12 * math.sin(2.1 * i) + rng.uniform(-0.05, 0.05), 0.15 * i * i * 0.2 + rng.uniform(-0.05, 0.05))) for i in range(5)]
            strut = kit.curve(f'{name}{k}-strut', pts, 0.05, m['alu'], resolution=3)
            stub = kit.curve(f'{name}{k}-stub', [pts[2], pts[2] + Vector((0.1, 0.45, 0.25))], 0.035, m['alu'], resolution=3)
            for ob in (strut, stub):
                ob.location, ob.scale, ob.visible_shadow = c, (s,) * 3, False
            stub.rotation_euler = strut.rotation_euler = (rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(0, 6.3))
            parts += [strut, stub]
    return parts


def matte(material, metallic, rough, coat=0.0):
    """Make a glossy or metallic finish read in a dark scene: with little to reflect but black sky it goes black, so it is given diffuse body."""
    nt = material.node_tree
    p = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    for name, value in (('Metallic', metallic), ('Roughness', rough), ('Coat Weight', coat)):
        for link in list(p.inputs[name].links):
            nt.links.remove(link)
        p.inputs[name].default_value = value
    return material


def rim_glow(name, color, strength, alpha, power=2.2, floor=0.06):
    """Emission that is faint where the surface faces the viewer and brightens toward its silhouette (the opposite of kit.glow_mat's fresnel
    beams), so a closed shell reads as a thin glowing skin around a clear volume."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = kit.hexc(color); em.inputs['Strength'].default_value = strength
    lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.5
    pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = power
    k = N('ShaderNodeMath'); k.operation = 'MULTIPLY_ADD'; k.inputs[1].default_value = alpha; k.inputs[2].default_value = floor * alpha; k.use_clamp = True
    L(lw.outputs['Facing'], pw.inputs[0]); L(pw.outputs[0], k.inputs[0])
    mix = N('ShaderNodeMixShader')
    L(k.outputs[0], mix.inputs['Fac']); L(N('ShaderNodeBsdfTransparent').outputs[0], mix.inputs[1]); L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    return m


def dome(name, lat, lon, radius, height, color, shells=4, strength=2.0, alpha=0.22):
    """A jamming dome standing on the ground at (lat, lon): nested translucent shells that glow toward their edge (fresnel), each wider, taller and
    fainter than the last, so it reads as a swelling volume with ripples, and a faint wash on the ground beneath. Sizes in Earth radii."""
    c = kit.ll(lat, lon).normalized()
    east = Vector((0, 0, 1)).cross(c).normalized()
    north = c.cross(east)
    out = []
    rows, cols = 14, 72
    for s in range(shells):
        k = (s + 1) / shells
        V, F = [], []
        for i in range(rows + 1):
            th = (math.pi / 2) * i / rows
            for j in range(cols):
                ph = 2 * math.pi * j / cols
                base = (c + (east * math.cos(ph) + north * math.sin(ph)) * radius * k * math.sin(th)).normalized()
                V.append(base * (1 + height * k ** 0.8 * math.cos(th)))
        for i in range(rows):
            for j in range(cols):
                a = i * cols + j
                F.append((a, i * cols + (j + 1) % cols, (i + 1) * cols + (j + 1) % cols, (i + 1) * cols + j))
        ob = kit.mesh(f'{name}-{s}', V, F, rim_glow(f'{name}-m{s}', color, strength, alpha * (1.15 - 0.6 * k), power=2.2), smooth=True)
        ob.visible_shadow = False
        out.append(ob)
    out.append(kit.ground_disc(name + '-wash', lat, lon, math.degrees(radius), color, strength=0.9, alpha=0.38, lift_km=3))
    return out


def dim(parts, k):
    """Scale the base colour of every paint in `parts` by k: the shared models are tuned for a darker setting and clip to white under the poster's Sun."""
    seen = set()
    for ob in parts:
        for slot in getattr(ob, 'material_slots', ()):
            mat = slot.material
            if mat is None or mat.name in seen or not mat.use_nodes:
                continue
            seen.add(mat.name)
            nt = mat.node_tree
            p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if p is None:
                continue
            inp = p.inputs['Base Color']
            if inp.is_linked:
                src = inp.links[0].from_socket
                mix = nt.nodes.new('ShaderNodeMix')
                mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
                mix.inputs['Factor'].default_value = 1.0
                mix.inputs['B'].default_value = (k, k, k, 1.0)
                nt.links.new(src, mix.inputs['A'])
                nt.links.new(mix.outputs['Result'], inp)
            else:
                c = inp.default_value
                inp.default_value = (c[0] * k, c[1] * k, c[2] * k, c[3])
