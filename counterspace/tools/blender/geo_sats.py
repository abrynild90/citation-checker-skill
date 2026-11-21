# Satellites for the geostationary posters (scenes_geo.py), built from the shared pieces in sats.py: KA-SAT with its wings turned to the Sun,
# the Compass G2 navigation satellite (dull foil), and SJ-21 / SJ-25. No docking or capture hardware is drawn: how they dock is not public.
# Model axes as in sats.py: +X forward (along the orbit), +Z the deck, solar wings along +-Y.
import math
import re

import bpy
from mathutils import Vector

import kit
import sats
from compose import Shot, aspect
from sats import mats, strut


def turned_wings(name, sy, tilt, n, side_tilt=(0.0, 0.0), kink=0.0, cells='cells', pw=2.2, ph=1.65, yoke=1.0, z=0.1, gap=0.05):
    """Both wings on their drives, turned about the Y axis by `tilt` (radians) so the cells face the Sun; `side_tilt` adds a twist per side and
    `kink` bends the +Y wing in its own plane at the first hinge, as if a deployment latch had failed."""
    parts = []
    for side, extra in zip((1, -1), side_tilt):
        wing = sats.solar_wing(f'{name}-w{side}', side, (0, side * sy / 2, z), n=n, pw=pw, ph=ph, yoke=yoke, cells=cells, gap=gap)
        pivot = Vector((0, side * sy / 2, z))
        root = kit.group(f'{name}-wing{side}', wing, loc=pivot)
        for ob in wing:  # re-centre the wing on its drive so the turn pivots there
            ob.location = ob.location - pivot
        if kink and side == 1:
            outer = [ob for ob in wing if re.search(r'-[pbfh]([1-9])', ob.name)]
            hinge = Vector((0, yoke + ph + gap / 2, 0))  # the first hinge, in the wing's own frame
            elbow = kit.group(f'{name}-elbow', outer, loc=hinge)
            for ob in outer:
                ob.location = ob.location - hinge
            elbow.rotation_euler = (0, 0, kink)
            elbow.parent = root
            parts.append(root)
            root.rotation_euler = (extra, tilt, 0)
            continue
        root.rotation_euler = (extra, tilt, 0)
        parts.append(root)
    return parts


def ka_sat(name='kasat', tilt=math.radians(50)):
    """KA-SAT: a big Ka-band communications satellite, foil bus, four side reflectors and one on the deck, four-panel wings turned to the Sun."""
    sx, sy, sz = 2.4, 2.0, 3.2
    tune_materials()
    parts = sats.bus(name, sx, sy, sz) + sats.deck_kit(name, sx, sy, sz)
    parts += turned_wings(name, sy, tilt, 4)
    m = mats()
    for k in range(4):
        side = 1 if k % 2 == 0 else -1
        at = Vector((side * (sx / 2 + 1.1), 0, sz * 0.15 + 0.25 * (k // 2)))
        parts += sats.reflector(f'{name}-rf{k}', 2.3 - 0.3 * (k // 2), at, (-side * 0.55, 0, 1.0), gold=(k // 2 == 1))
        for dy in (-0.35, 0.35):
            parts.append(strut(f'{name}-arm{k}{dy:+}', (side * sx / 2, dy, sz * 0.25), at + Vector((-side * 0.3, dy * 0.4, -0.3)), 0.03, m['cfrp']))
    parts += sats.reflector(f'{name}-rfdeck', 1.4, Vector((-sx * 0.1, 0, sz / 2 + 0.7)), (0.35, 0, 1.0), ribs=8, depth=0.12)
    parts.append(strut(f'{name}-deckarm', (-sx * 0.1, 0, sz / 2), (-sx * 0.1, 0, sz / 2 + 0.6), 0.04, m['cfrp']))
    return parts


KA_SPAN = 17.5  # wingtip to wingtip, metres (four panels)


def put(shot, name, parts, pos, span, frac, aim, up, mid=(0, 0, 0)):
    """Place a model so its local point `mid` sits at world `pos`, its overall `span` (metres) `frac` of the frame width there. (compose.model_size
    reads local meshes only, so it misjudges models whose wings sit under a turned parent.)"""
    dist = (pos - shot.cam.location).length
    scale = frac * shot.width_at(dist) / span
    root = kit.group(name, parts, loc=pos, scale=scale, aim=aim, up=up)
    root.location = pos - root.rotation_euler.to_matrix() @ (Vector(mid) * scale)
    return root


def fill_light(name, loc, target, roots, energy, size, color):
    """A soft area light at `loc` aimed at `target` that lights only the models under `roots` (the planet is lit by the Sun alone)."""
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.size, data.color = energy, size, color
    lamp = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(lamp)
    lamp.location = Vector(loc)
    lamp.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    recv = bpy.data.collections.new(name + '-receivers')
    for root in roots:
        for ob in (root, *root.children_recursive):
            recv.objects.link(ob)
    lamp.light_linking.receiver_collection = recv
    return lamp


def face_light(sun, to_cam, x, z, lean=0.45):
    """The turn of a model's wings about its Y axis (X, Z given in world space) that points the cells mostly at the Sun, a little toward the camera."""
    t = (sun + to_cam * lean).normalized()  # leaning to the Sun: facing the half-way direction would put its mirror image in the lens
    return math.atan2(t.dot(x), t.dot(z))


def aimed(loc, point, sx, sy, lens, up):
    """A Shot from `loc` that puts `point` at screen position (sx, sy), -1..1 with y up."""
    d = (Vector(point) - Vector(loc)).normalized()
    r = d.cross(Vector(up)).normalized()
    u = r.cross(d)
    tx = 18 / lens
    ty = tx * aspect()
    return Shot(loc, Vector(loc) + (d - r * sx * tx - u * sy * ty).normalized(), lens=lens, up=up)


# ---------------------------------------------------------------- the Chinese pair and Compass G2
SJ21_BUS = (1.8, 1.6, 2.0)
G2_BUS = (2.0, 1.8, 2.2)
G2_SPAN = 13.8  # wingtip to wingtip, metres


def sj21(name='sj21', tilt=0.0, panels=3):
    """SJ-21: gold bus, three-panel wings and a camera pod on the +Z deck. No capture hardware: the Secure World Foundation says it docked
    with Compass G2 but not how."""
    sx, sy, sz = SJ21_BUS
    m = mats()
    tune_materials()
    parts = sats.bus(name, sx, sy, sz, 'gold', 'black')
    parts += turned_wings(name, sy, tilt, panels, cells='cells_si', pw=1.7, ph=1.4, yoke=0.9)
    parts.append(kit.cyl(f'{name}-cam', 0.09, 0.16, loc=(-sx * 0.3, sy * 0.28, sz / 2 + 0.1), material=m['matte_black'], verts=24))
    parts.append(kit.cyl(f'{name}-camlens', 0.07, 0.01, loc=(-sx * 0.3, sy * 0.28, sz / 2 + 0.19), material=m['lens'], verts=24))
    return parts


def tune_materials():
    """Two fixes for the poster lighting. The mirror-tile radiators reflect only black sky, so a face turned to the lens reads as a hole in the
    bus: let them take some diffuse light. The white dishes burn out under the full Sun: tone them down."""
    m = mats()
    m['osr'].node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.75
    m['dish'].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = kit.hexc('#88857e')


def dull(material, value=0.35):
    """Darken a material's base colour in place: foil that has weathered for years in the Sun, or is simply lit very hard."""
    nt = material.node_tree
    bsdf = nt.nodes['Principled BSDF']
    link = bsdf.inputs['Base Color'].links[0]
    hsv = nt.nodes.new('ShaderNodeHueSaturation')
    hsv.inputs['Value'].default_value = value
    hsv.inputs['Saturation'].default_value = 0.8
    nt.links.new(link.from_socket, hsv.inputs['Color'])
    nt.links.new(hsv.outputs['Color'], bsdf.inputs['Base Color'])


def compass_g2(name='g2', tilt=0.0, droop=0.0, kink=0.0):
    """Compass G2, the dead navigation satellite: a silver foil bus on the DFH-3 pattern, an antenna farm on the deck and two three-panel wings
    (straight by default: the state of its wings is not sourced)."""
    sx, sy, sz = G2_BUS
    tune_materials()
    dull(mats()['silver'], 0.2)
    parts = sats.bus(name, sx, sy, sz, 'silver', 'silver') + sats.deck_kit(name, sx, sy, sz, horns=4)
    return parts + turned_wings(name, sy, tilt, 3, side_tilt=(droop, 0.0), kink=kink, cells='cells_si', pw=2.0, ph=1.6, yoke=1.0)


SJ25_BUS = (1.5, 1.4, 2.2)


def sj25(name='sj25', tilt=0.0):
    """SJ-25: a taller bus in silver foil, two-panel wings and a dish on a short boom. No probe or other docking hardware: the reports say the
    pair appeared to dock, not how."""
    sx, sy, sz = SJ25_BUS
    m = mats()
    tune_materials()
    top = sz / 2
    parts = sats.bus(name, sx, sy, sz, 'silver', 'black') + turned_wings(name, sy, tilt, 2, cells='cells', pw=1.8, ph=1.4, yoke=0.9)
    parts.append(strut(f'{name}-dishboom', (-sx * 0.3, 0, top), (-sx * 0.45, 0.2, top + 0.7), 0.035, m['cfrp']))
    parts += sats.reflector(f'{name}-dish', 0.9, Vector((-sx * 0.45, 0.2, top + 0.75)), (-0.2, 0.2, 1.0), ribs=8, depth=0.09)
    parts.append(kit.cyl(f'{name}-st', 0.07, 0.2, loc=(sx * 0.3, -sy * 0.28, top + 0.1), material=m['matte_black'], verts=20))
    return parts


def coast_glow(sun_dir, strength=1.0, color='#8fb4ff'):
    """A faint pale-blue line along the coasts on the night side (moon- and airglow-lit shores), so a dark continent still shows its outline.
    A transparent shell just above the ground that glows where the water mask changes."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=1.002)
    ob = bpy.context.object
    ob.name = 'coast-glow'
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new('coast-glow')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    uv = kit._equirect_uv(nt, N('ShaderNodeTexCoord').outputs['Object'])
    taps = []
    for dx, dy in ((0, 0), (3, 0), (-3, 0), (0, 3), (0, -3)):
        img = kit._img(nt, 'earth-water.png', 'Non-Color')
        L(kit._v(nt, 'ADD', uv, (dx * kit.TEXEL[0], dy * kit.TEXEL[1], 0)), img.inputs['Vector'])
        taps.append(img.outputs['Color'])
    ring = kit._m(nt, 'MULTIPLY', kit._m(nt, 'ADD', kit._m(nt, 'ADD', taps[1], taps[2]), kit._m(nt, 'ADD', taps[3], taps[4])), 0.25)
    edge = kit._smooth(nt, kit._m(nt, 'ABSOLUTE', kit._m(nt, 'SUBTRACT', taps[0], ring)), 0.05, 0.4)
    night = kit._smooth(nt, kit._sun_dot(nt, sun_dir), 0.0, -0.25)
    em = N('ShaderNodeEmission')
    em.inputs['Color'].default_value = kit.hexc(color)
    L(kit._m(nt, 'MULTIPLY', kit._m(nt, 'MULTIPLY', edge, night), strength), em.inputs['Strength'])
    add = N('ShaderNodeAddShader')
    L(N('ShaderNodeBsdfTransparent').outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1])
    L(add.outputs[0], N('ShaderNodeOutputMaterial').inputs['Surface'])
    ob.data.materials.append(m)
    ob.visible_shadow = False
    return ob
