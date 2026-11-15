# The X-37B orbital test vehicle in metres (8.9 m long, 4.5 m span): a lofted fuselage with a dark carbon nose cap, white quilted blankets
# on top and black heat-shield tiles underneath, a low delta wing with elevons and dark leading edges, canted V-tails, a body flap, the
# engine bell, and the payload bay open in orbit with its doors swung back and the deployable solar array raised and tilted toward the Sun.
# Model axes: +X forward (nose at x = 4.45), +Z up. `s` is the distance aft of the nose.
import math

import bpy
from mathutils import Vector

import kit
import sats
import surface as S


def X(s):
    return 4.45 - s


def _orbiter_skin(name):
    """White quilted blankets where the surface faces up, black tiles in a brick pattern where it faces down, a wavy line between."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    sep = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Normal'], sep.inputs[0])
    wob = N('ShaderNodeTexNoise'); wob.inputs['Scale'].default_value = 1.2
    L(tc.outputs['Object'], wob.inputs['Vector'])
    edge = N('ShaderNodeMath'); edge.operation = 'MULTIPLY_ADD'; edge.inputs[1].default_value = 0.06; edge.inputs[2].default_value = -0.33
    L(wob.outputs['Fac'], edge.inputs[0])
    below = N('ShaderNodeMath'); below.operation = 'LESS_THAN'
    L(sep.outputs['Z'], below.inputs[0]); L(edge.outputs[0], below.inputs[1])
    tiles = N('ShaderNodeTexBrick'); tiles.offset = 0.5
    tiles.inputs['Scale'].default_value = 6.0; tiles.inputs['Mortar Size'].default_value = 0.025
    tiles.inputs['Color1'].default_value = kit.hexc('#141517'); tiles.inputs['Color2'].default_value = kit.hexc('#1d1e21')
    tiles.inputs['Mortar'].default_value = kit.hexc('#3a3b3f')
    quilt = N('ShaderNodeTexBrick'); quilt.offset = 0.0
    quilt.inputs['Scale'].default_value = 4.0; quilt.inputs['Mortar Size'].default_value = 0.012
    quilt.inputs['Color1'].default_value = kit.hexc('#e9e8e3'); quilt.inputs['Color2'].default_value = kit.hexc('#dedcd5')
    quilt.inputs['Mortar'].default_value = kit.hexc('#cfcdc6')
    for t in (tiles, quilt):
        L(tc.outputs['Object'], t.inputs['Vector'])
    col = N('ShaderNodeMix'); col.data_type = 'RGBA'
    L(quilt.outputs['Color'], col.inputs['A']); L(tiles.outputs['Color'], col.inputs['B']); L(below.outputs[0], col.inputs['Factor'])
    L(col.outputs['Result'], p.inputs['Base Color'])
    rough = N('ShaderNodeMapRange'); rough.inputs['To Min'].default_value = 0.6; rough.inputs['To Max'].default_value = 0.75
    L(below.outputs[0], rough.inputs['Value']); L(rough.outputs['Result'], p.inputs['Roughness'])
    hb = N('ShaderNodeMix'); hb.data_type = 'FLOAT'
    L(quilt.outputs['Fac'], hb.inputs['A']); L(tiles.outputs['Fac'], hb.inputs['B']); L(below.outputs[0], hb.inputs['Factor'])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.3
    L(hb.outputs['Result'], bump.inputs['Height']); L(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def _mirror(ob):
    ob.modifiers.new('mirror', 'MIRROR').use_axis = (False, True, False)
    return ob


def x37b(name='x37b', bay_open=True):
    skin = _orbiter_skin(name + '-skin')
    rcc = kit.mat(name + '-rcc', '#38393c', rough=0.5)
    bay = kit.mat(name + '-bay', '#c9ccd1', metallic=0.6, rough=0.4)
    nozzle = kit.mat(name + '-nozzle', '#4a4643', metallic=1.0, rough=0.35)
    m = sats.mats()
    nose = [(0.0, 0.03, 0.03, -0.03, 2.0), (0.25, 0.3, 0.22, -0.26, 2.1), (0.6, 0.5, 0.36, -0.38, 2.3)]
    body = [(0.6, 0.5, 0.36, -0.38, 2.3), (1.3, 0.7, 0.52, -0.46, 2.7), (2.4, 0.8, 0.64, -0.5, 3.2), (4.5, 0.82, 0.66, -0.5, 3.5),
            (6.6, 0.8, 0.64, -0.49, 3.5), (8.1, 0.72, 0.54, -0.44, 3.2), (8.9, 0.62, 0.44, -0.38, 3.0)]

    def rings(stations):
        out = []
        for s, hw, zt, zb, n in stations:
            zc = (zt + zb) / 2
            out.append(S.superellipse_ring(X(s), 0, zc, hw, zt - zc, zc - zb, n, 48))
        return out
    parts = [S.loft(name + '-nosecap', rings(nose), rcc, cap_end=False), S.loft(name + '-body', rings(body), skin, cap_start=False)]

    def wing_at(y):
        f = (y - 0.7) / 1.55
        return 3.6 + 3.6 * f, 8.3 - 0.1 * f, 0.09 - 0.03 * f, -0.36 + 0.08 * f  # le, te, thickness, z (slight dihedral)
    wing = []
    for y in (0.7, 2.25):
        le, te, t, z = wing_at(y)
        wing.append((y, X(le), te - le - 0.35, t, z))
    parts.append(_mirror(S.surface(name + '-wing', wing, skin)))
    elev = []
    for y in (0.75, 2.2):
        le, te, t, z = wing_at(y)
        elev.append((y, X(te - 0.33), 0.33, 0.05, z))
    parts.append(_mirror(S.surface(name + '-elevon', elev, skin)))
    for side in (1, -1):
        le_pts = []
        for t in [i / 10 for i in range(11)]:
            le, te, th, z = wing_at(0.7 + 1.55 * t)
            le_pts.append(Vector((X(le), side * (0.7 + 1.55 * t), z)))
        parts.append(kit.curve(f'{name}-wle{side}', le_pts, 0.03, rcc))
        tail = S.surface(f'{name}-tail{side}', [(0.0, X(6.9), 1.6, 0.06, 0.0), (1.35, X(7.9), 0.75, 0.05, 0.0)], skin, vertical=True)
        tail.location = (0, side * 0.45, 0.5)
        tail.rotation_euler = (side * math.radians(-38), 0, 0)
        parts.append(tail)
    parts.append(kit.box(name + '-bodyflap', (0.55, 1.15, 0.07), loc=(X(9.1), 0, -0.4), material=skin))
    parts.append(kit.cyl(name + '-bell', 0.17, 0.32, loc=(X(9.05), 0, 0.02), rot=(0, -math.pi / 2, 0), material=nozzle, r2=0.08, verts=32))
    if bay_open:
        cutter = kit.box(name + '-baycut', (3.9, 1.24, 0.7), loc=(X(4.6), 0, 0.72))  # the bay: cut out of the fuselage top
        cutter.hide_render = True
        cutter.visible_camera = False
        cutter.display_type = 'WIRE'
        cut = parts[1].modifiers.new('bay', 'BOOLEAN')
        cut.operation = 'DIFFERENCE'
        cut.object = cutter
        cut.solver = 'EXACT'
        parts.append(cutter)
        parts.append(kit.box(name + '-bayfloor', (3.9, 1.2, 0.04), loc=(X(4.6), 0, 0.39), material=bay))
        for side in (1, -1):  # the doors, hinged at the sills and swung out almost flat, radiators on their inner faces
            tilt = math.radians(70)
            c = (X(4.6), side * (0.62 + 0.41 * math.sin(tilt)), 0.6 + 0.41 * math.cos(tilt))
            rot = (-side * tilt, 0, 0)
            parts.append(kit.box(f'{name}-door{side}', (3.9, 0.04, 0.82), loc=c, rot=rot, material=skin))
            inner = (c[0], c[1] - side * 0.025 * math.cos(tilt), c[2] + 0.025 * math.sin(tilt))
            parts.append(kit.box(f'{name}-radiator{side}', (3.6, 0.01, 0.72), loc=inner, rot=rot, material=m['osr']))
        parts.append(kit.cyl(name + '-mast', 0.04, 1.0, loc=(X(4.0), 0, 0.9), material=bay, verts=12))
        parts.append(sats.plane(name + '-array', 2.6, 1.3, (X(4.0), 0, 1.42), rot=(-0.5, 0, 0), material=m['cells']))
        parts.append(sats.plane(name + '-arrayback', 2.6, 1.3, (X(4.0), 0, 1.4), rot=(math.pi - 0.5, 0, 0), material=m['back']))
        parts.append(kit.box(name + '-payload', (1.2, 0.8, 0.4), loc=(X(5.6), 0, 0.62), material=m['gold']))
    return parts
