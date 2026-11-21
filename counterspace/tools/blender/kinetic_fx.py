# Effects for the kinetic poster scenes (scenes_kinetic.py): layered fireballs, translucent curtains (field-line ribbons,
# aurora) and tapered motion streaks. Everything is pure emission, so the shapes are made by how the glow falls off, not by lighting.
import math
import random

import kit
from kit import bpy, Vector, _m, _v, _noise, _smooth, _mix, _ramp, _col


def _scaffold(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    return m, nt


def _finish(nt, emit_color, strength):
    """Add the emission to a transparent shader and connect the output."""
    N, L = nt.nodes.new, nt.links.new
    em = N('ShaderNodeEmission')
    for sock, v in ((em.inputs['Color'], emit_color), (em.inputs['Strength'], strength)):
        kit._set(nt, sock, v)
    add = N('ShaderNodeAddShader')
    L(N('ShaderNodeBsdfTransparent').outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1])
    L(add.outputs[0], N('ShaderNodeOutputMaterial').inputs['Surface'])


def _grey_ramp(nt, fac, stops):
    return _ramp(nt, fac, [(p, (v, v, v, 1.0)) for p, v in stops])


def glow(name, color, strength, r, power=1.5, rim=False, noise=0.0, scale=3.5, seed=0.0):
    """Additive emission for a sphere of radius `r`, shaped by the distance from its centre on screen (rho, 0 to 1): a gaussian bump
    exp(-power rho^2), or with `rim` a ring at 80% of the radius whose sharpness is `power`, so nothing has a hard edge. `noise` mottles it
    like turbulent plasma. It fades out toward the ground, so a big glow that dips into the Earth has no hard cut where it meets the surface."""
    m, nt = _scaffold(name)
    N = nt.nodes.new
    geo = N('ShaderNodeNewGeometry')
    face = _m(nt, 'ABSOLUTE', _v(nt, 'DOT_PRODUCT', geo.outputs['Normal'], geo.outputs['Incoming']))
    rho2 = _m(nt, 'SUBTRACT', 1.0, _m(nt, 'MULTIPLY', face, face), clamp=True)
    if rim:
        x = _m(nt, 'MULTIPLY', _m(nt, 'SUBTRACT', _m(nt, 'SQRT', rho2), 0.8), power)
        k = _m(nt, 'EXPONENT', _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', x, x), -1.0))
    else:
        k = _m(nt, 'EXPONENT', _m(nt, 'MULTIPLY', rho2, -power))
    k = _m(nt, 'MULTIPLY', k, _smooth(nt, _v(nt, 'LENGTH', geo.outputs['Position']), 1.0, 1.05))
    if noise:
        p = _v(nt, 'ADD', _v(nt, 'SCALE', N('ShaderNodeTexCoord').outputs['Object'], s=1.0 / r), (seed * 3.1, seed * 1.7, seed * 2.3))
        k = _m(nt, 'MULTIPLY', k, _mix(nt, _smooth(nt, _noise(nt, p, scale, 5, 0.6), 0.3, 0.7), 1.0 - noise, 1.0, 'FLOAT'))
    _finish(nt, _col(color), _m(nt, 'MULTIPLY', k, strength))
    return m


def _glow_only(ob):
    """Make an object a pure glow: no shadows, and invisible to diffuse and glossy rays, so it does not light or reflect in the planet."""
    ob.visible_shadow = False
    ob.visible_diffuse = False
    ob.visible_glossy = False
    return ob


def fireball(name, loc, r, strength=1.0, seed=1.0, hot='#fff4d8', mid='#ffb060', shell='#ff6a3a', halo='#ff7a4a', aura='#5affb8', body=1.0):
    """A burst of radius `r`: a small white-hot core in a mottled plasma body, a ragged bright shell, six offset lobes that make the outline irregular, and wide faint halos (the outermost tinted `aura`). `body` scales the plasma and the shell: low for a burst in vacuum."""
    layers = ((0.38, hot, 90, dict(power=8.0)),
              (0.9, mid, 5 * body, dict(power=3.0, noise=1.0, scale=5.0)),
              (1.0, shell, 2.5 * body, dict(power=7.0, rim=True, noise=1.0, scale=7.0)),
              (2.8, halo, 0.9, dict(power=5.0, noise=0.6, scale=2.0)),
              (6.0, aura, 0.04, dict(power=6.0, noise=0.5, scale=1.5)))
    rng = random.Random(seed)
    layers += tuple((rng.uniform(0.35, 0.6), mid if k % 2 else shell, 2.0 * body, dict(power=2.5, noise=1.0, scale=4.0)) for k in range(6))
    offsets = [Vector((0, 0, 0))] * 5 + [Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized() * rng.uniform(0.45, 0.8) * r for _ in range(6)]
    objs = []
    for i, (share, col, s, kw) in enumerate(layers):
        ob = kit.sphere(f'{name}-{i}', r * share, Vector(loc) + offsets[i], glow(f'{name}-m{i}', col, s * strength, r * share, seed=seed + i, **kw), seg=64)
        objs.append(_glow_only(ob))
    return objs


def strip(name, edge_a, edge_b, material):
    """A ribbon between two equally long polylines; UV u runs along it, v from edge a (0) to edge b (1)."""
    n = len(edge_a)
    V = [tuple(p) for p in edge_a] + [tuple(p) for p in edge_b]
    F = [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]
    ob = kit.mesh(name, V, F, material, smooth=True)
    uv = ob.data.uv_layers.new(name='UVMap')
    for lp in ob.data.loops:
        vi = lp.vertex_index
        uv.data[lp.index].uv = ((vi % n) / (n - 1), vi // n)
    return _glow_only(ob)


def curtain_mat(name, color, strength, along, across=((0, 0), (0.5, 1), (1, 0)), colors=None, rays=(3.0, 40.0), streak=0.6, seed=0.0, lengthwise=False):
    """Emission for a `strip`: `along` and `across` are (position, brightness) stops over u and v, `colors` optional (position, colour) stops
    over v, `lengthwise` makes `colors` run along u instead of across, `rays` the noise frequency (along, across) that streaks it into rays, `streak` how deeply."""
    m, nt = _scaffold(name)
    N = nt.nodes.new
    sep = N('ShaderNodeSeparateXYZ')
    nt.links.new(N('ShaderNodeTexCoord').outputs['UV'], sep.inputs[0])
    u, v = sep.outputs['X'], sep.outputs['Y']
    comb = N('ShaderNodeCombineXYZ')
    nt.links.new(_m(nt, 'MULTIPLY', u, rays[0]), comb.inputs['X']); nt.links.new(_m(nt, 'MULTIPLY', v, rays[1]), comb.inputs['Y'])
    comb.inputs['Z'].default_value = seed
    rough = _mix(nt, _smooth(nt, _noise(nt, comb.outputs[0], 1.0, 3, 0.6), 0.3, 0.7), 1.0 - streak, 1.0, 'FLOAT')
    k = _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', _grey_ramp(nt, u, along), _grey_ramp(nt, v, across)), rough)
    _finish(nt, _ramp(nt, u if lengthwise else v, colors) if colors else _col(color), _m(nt, 'MULTIPLY', k, strength))
    return m


def streaks(name, lines, radius, material):
    """Many tapered polylines in one curve object. Each line is (points, width); it is thickest at its first point and fades to a fine tip."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 1
    for pts, w in lines:
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (*p, 1)
            sp.points[i].radius = w * (1 - i / (len(pts) - 1) * 0.95)
    cu.materials.append(material)
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.visible_shadow = False
    return ob
