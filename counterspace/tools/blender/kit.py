# Blender building blocks for the poster renders (tools/blender/posters.py): a photographic Earth with night lights, ocean glint and atmosphere,
# a star field, spacecraft models, glowing trails, debris and flashes. Units: one Earth radius = 1. Longitude/latitude follow the page's convention
# (x = cos lat cos lon, y = cos lat sin lon, z = sin lat), and the equirectangular textures in src/assets are mapped with the same formula.
import math
import random
from pathlib import Path

import bpy
from mathutils import Vector, Matrix

ASSETS = Path(__file__).resolve().parents[2] / 'src/assets'
R_KM = 6371.0


def hexc(h, a=1.0):
    """'#rrggbb' -> linear RGBA (Blender colours are linear)."""
    h = h.lstrip('#')
    s = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in s]
    return (*lin, a)


def ll(lat, lon, alt_km=0.0):
    r = 1 + alt_km / R_KM
    la, lo = math.radians(lat), math.radians(lon)
    return Vector((r * math.cos(la) * math.cos(lo), r * math.cos(la) * math.sin(lo), r * math.sin(la)))


def look_at(obj, target, up=(0, 0, 1)):
    """Point a camera (-Z forward, +Y up) at `target`, keeping `up` up on screen."""
    d = (Vector(target) - obj.location).normalized()
    right = d.cross(Vector(up)).normalized()
    true_up = right.cross(d).normalized()
    obj.rotation_euler = Matrix((right, true_up, -d)).transposed().to_euler()


# ---------------------------------------------------------------- scene, render, world
def reset(res=(1920, 1080), samples=96):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for dev_type in ('METAL', 'OPTIX', 'CUDA', 'HIP'):
        try:
            prefs.compute_device_type = dev_type
        except TypeError:
            continue
        prefs.get_devices()
        if any(d.type == dev_type for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == dev_type
            sc.cycles.device = 'GPU'
            break
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.transparent_max_bounces = 24
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '8'
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass
    return sc


def world_stars(density=1.0, strength=1.0):
    w = bpy.data.worlds.new('space')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputWorld')
    bg = N('ShaderNodeBackground')
    tc = N('ShaderNodeTexCoord')
    vor = N('ShaderNodeTexVoronoi')
    vor.inputs['Scale'].default_value = 420 * density
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = 0.035
    ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    sep = N('ShaderNodeSeparateColor')  # random brightness per star from the cell colour
    pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 6.0
    mul = N('ShaderNodeMixRGB'); mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
    base = N('ShaderNodeMixRGB'); base.blend_type = 'ADD'; base.inputs[0].default_value = 1.0
    base.inputs[1].default_value = (0.0012, 0.0018, 0.0045, 1)  # a faint deep blue, so space is not pure black
    L(tc.outputs['Generated'], vor.inputs['Vector'])
    L(vor.outputs['Distance'], ramp.inputs['Fac'])
    L(vor.outputs['Color'], sep.inputs['Color'])
    L(sep.outputs[0], pw.inputs[0])
    L(ramp.outputs['Color'], mul.inputs[1])
    L(pw.outputs[0], mul.inputs[2])
    L(mul.outputs[0], base.inputs[2])
    L(base.outputs[0], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 1.6 * strength
    L(bg.outputs[0], out.inputs['Surface'])
    # the stars light nothing
    for k in ('diffuse', 'glossy', 'transmission', 'scatter'):
        setattr(w.cycles_visibility, k, False)
    return w


def sun(direction, strength=4.5, color=(1.0, 0.97, 0.92), angle_deg=0.53):
    """`direction`: vector pointing from the scene toward the Sun."""
    d = Vector(direction).normalized()
    data = bpy.data.lights.new('sun', 'SUN')
    data.energy = strength
    data.color = color
    data.angle = math.radians(angle_deg)
    ob = bpy.data.objects.new('sun', data)
    bpy.context.collection.objects.link(ob)
    ob.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    return d


def camera(loc, target, lens=50, up=(0, 0, 1)):
    data = bpy.data.cameras.new('cam')
    data.lens = lens
    data.sensor_width = 36
    data.clip_start = 0.0005
    data.clip_end = 400
    ob = bpy.data.objects.new('cam', data)
    bpy.context.collection.objects.link(ob)
    ob.location = Vector(loc)
    look_at(ob, target, up)
    bpy.context.scene.camera = ob
    return ob


# ---------------------------------------------------------------- materials
def _img(nt, name, colorspace='sRGB'):
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = bpy.data.images.load(str(ASSETS / name), check_existing=True)
    n.image.colorspace_settings.name = colorspace
    n.interpolation = 'Cubic'
    n.extension = 'REPEAT'
    return n


def _equirect_uv(nt, coord_socket):
    """Object-space position -> equirectangular UV with the page's lon/lat convention."""
    N, L = nt.nodes.new, nt.links.new
    nrm = N('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'
    sep = N('ShaderNodeSeparateXYZ')
    at = N('ShaderNodeMath'); at.operation = 'ARCTAN2'
    u1 = N('ShaderNodeMath'); u1.operation = 'MULTIPLY_ADD'; u1.inputs[1].default_value = 1 / (2 * math.pi); u1.inputs[2].default_value = 0.5
    asn = N('ShaderNodeMath'); asn.operation = 'ARCSINE'
    v1 = N('ShaderNodeMath'); v1.operation = 'MULTIPLY_ADD'; v1.inputs[1].default_value = 1 / math.pi; v1.inputs[2].default_value = 0.5
    comb = N('ShaderNodeCombineXYZ')
    L(coord_socket, nrm.inputs[0])
    L(nrm.outputs[0], sep.inputs[0])
    L(sep.outputs['Y'], at.inputs[0])
    L(sep.outputs['X'], at.inputs[1])
    L(at.outputs[0], u1.inputs[0])
    L(sep.outputs['Z'], asn.inputs[0])
    L(asn.outputs[0], v1.inputs[0])
    L(u1.outputs[0], comb.inputs['X'])
    L(v1.outputs[0], comb.inputs['Y'])
    return comb.outputs[0]


def _sun_dot(nt, sun_dir):
    """dot(surface normal, sun direction) as a shader value."""
    N, L = nt.nodes.new, nt.links.new
    dot = N('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = tuple(sun_dir)
    L(N('ShaderNodeNewGeometry').outputs['Normal'], dot.inputs[0])
    return dot.outputs['Value']


def _smooth(nt, value_socket, a, b):
    m = nt.nodes.new('ShaderNodeMapRange')
    m.interpolation_type = 'SMOOTHSTEP'
    m.inputs['From Min'].default_value = a
    m.inputs['From Max'].default_value = b
    nt.links.new(value_socket, m.inputs['Value'])
    return m.outputs['Result']


def _col(c):
    return hexc(c) if isinstance(c, str) else c


def mat(name, color='#ffffff', metallic=0.0, rough=0.5, emit=None, emit_strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = _col(color)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = _col(emit)
        p.inputs['Emission Strength'].default_value = emit_strength
    return m


def glow_mat(name, color, strength=8.0, fresnel=False, alpha=1.0, power=2.2):
    """Pure emission; with `fresnel`, fading toward the silhouette (soft beams, plumes, halos)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    em = N('ShaderNodeEmission')
    em.inputs['Color'].default_value = _col(color)
    em.inputs['Strength'].default_value = strength
    tr = N('ShaderNodeBsdfTransparent')
    mix = N('ShaderNodeMixShader')
    if fresnel:
        lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.5
        inv = N('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
        pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = power
        k = N('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = alpha
        L(lw.outputs['Facing'], inv.inputs[1])
        L(inv.outputs[0], pw.inputs[0])
        L(pw.outputs[0], k.inputs[0])
        L(k.outputs[0], mix.inputs['Fac'])
    else:
        mix.inputs['Fac'].default_value = alpha
    L(tr.outputs[0], mix.inputs[1])
    L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    return m


def mli_gold(name='mli', c0='#a8711a', c1='#f2cf72'):
    """Crinkled multi-layer insulation (gold by default; pass silver tones for Kapton-free blankets)."""
    m = mat(name, c1, metallic=1.0, rough=0.28)
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 60; nz.inputs['Detail'].default_value = 6; nz.inputs['Roughness'].default_value = 0.65
    vor = N('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 25
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.5; bump.inputs['Distance'].default_value = 0.02
    mr = N('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.12; mr.inputs['To Max'].default_value = 0.4
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = _col(c0)
    ramp.color_ramp.elements[1].color = _col(c1)
    L(tc.outputs['Object'], nz.inputs['Vector'])
    L(tc.outputs['Object'], vor.inputs['Vector'])
    L(nz.outputs['Fac'], bump.inputs['Height'])
    L(vor.outputs['Distance'], mr.inputs['Value'])
    L(mr.outputs['Result'], p.inputs['Roughness'])
    L(nz.outputs['Fac'], ramp.inputs['Fac'])
    L(ramp.outputs['Color'], p.inputs['Base Color'])
    L(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def solar_cells(tint='#14224f', scale=8.0, tint2='#1b2d68'):
    """Dark blue cells in a silver grid (needs UVs: cubes and planes have them)."""
    m = mat('cells', tint, metallic=0.5, rough=0.16, coat=0.7)
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    br = N('ShaderNodeTexBrick')
    br.offset = 0.0
    br.inputs['Scale'].default_value = scale
    br.inputs['Mortar Size'].default_value = 0.03
    br.inputs['Brick Width'].default_value = 0.5
    br.inputs['Row Height'].default_value = 0.25
    br.inputs['Color1'].default_value = _col(tint)
    br.inputs['Color2'].default_value = _col(tint2)
    br.inputs['Mortar'].default_value = _col('#c9ccd4')
    L(tc.outputs['UV'], br.inputs['Vector'])
    L(br.outputs['Color'], p.inputs['Base Color'])
    L(br.outputs['Fac'], p.inputs['Metallic'])
    return m


# ---------------------------------------------------------------- the Earth
def earth(sun_dir, night_strength=6.0, atmosphere=True, glint=0.25, clouds=0.5):
    sun_dir = Vector(sun_dir).normalized()
    bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=1.0)
    e = bpy.context.object
    e.name = 'earth'
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new('earth')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    tc = N('ShaderNodeTexCoord')
    uv = _equirect_uv(nt, tc.outputs['Object'])
    day = _img(nt, 'earth-day-4k.jpg')
    night = _img(nt, 'earth-night-4k.jpg')
    water = _img(nt, 'earth-water.png', 'Non-Color')
    relief = _img(nt, 'earth-relief.png', 'Non-Color')
    for n in (day, night, water, relief):
        L(uv, n.inputs['Vector'])
    hsv = N('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = 1.15; hsv.inputs['Value'].default_value = 1.08
    L(day.outputs['Color'], hsv.inputs['Color'])
    bsdf = N('ShaderNodeBsdfPrincipled')
    L(hsv.outputs['Color'], bsdf.inputs['Base Color'])
    rough = N('ShaderNodeMapRange'); rough.inputs['To Min'].default_value = 0.92; rough.inputs['To Max'].default_value = 0.45  # ocean glossy, land matte
    L(water.outputs['Color'], rough.inputs['Value'])
    L(rough.outputs['Result'], bsdf.inputs['Roughness'])
    spec = N('ShaderNodeMapRange'); spec.inputs['To Min'].default_value = 0.08; spec.inputs['To Max'].default_value = glint
    L(water.outputs['Color'], spec.inputs['Value'])
    L(spec.outputs['Result'], bsdf.inputs['Specular IOR Level'])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.3; bump.inputs['Distance'].default_value = 0.004
    L(relief.outputs['Color'], bump.inputs['Height'])
    L(bump.outputs['Normal'], bsdf.inputs['Normal'])
    # night lights on the dark side, fading in across the terminator
    dark = _smooth(nt, _sun_dot(nt, sun_dir), 0.06, -0.16)
    # the night image is dim (median 13/255, lights near 50): drop its grey ground, stretch the lights, colour them sodium-warm
    bw = N('ShaderNodeRGBToBW')
    L(night.outputs['Color'], bw.inputs['Color'])
    lights = N('ShaderNodeMapRange'); lights.inputs['From Min'].default_value = 0.028; lights.inputs['From Max'].default_value = 0.3
    L(bw.outputs['Val'], lights.inputs['Value'])
    curve = N('ShaderNodeMath'); curve.operation = 'POWER'; curve.inputs[1].default_value = 1.6
    L(lights.outputs['Result'], curve.inputs[0])
    k = N('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = night_strength
    k2 = N('ShaderNodeMath'); k2.operation = 'MULTIPLY'
    L(curve.outputs[0], k.inputs[0])
    L(k.outputs[0], k2.inputs[0]); L(dark, k2.inputs[1])
    bsdf.inputs['Emission Color'].default_value = hexc('#ffbe73')
    L(k2.outputs[0], bsdf.inputs['Emission Strength'])
    L(bsdf.outputs[0], out.inputs['Surface'])
    e.data.materials.append(m)
    if clouds:
        cloud_layer(sun_dir, clouds)
    if atmosphere:
        atmo(sun_dir)
    return e


def cloud_layer(sun_dir, coverage=0.5, seed=0.0):
    """Procedural clouds on a shell just above the ground: banded by latitude (fewer over the subtropics), swirled, lit by the Sun only."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=1.006)
    c = bpy.context.object
    c.name = 'clouds'
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new('clouds')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    tc = N('ShaderNodeTexCoord')
    warp = N('ShaderNodeTexNoise'); warp.noise_dimensions = '4D'
    warp.inputs['Scale'].default_value = 1.6; warp.inputs['Detail'].default_value = 3; warp.inputs['W'].default_value = seed
    mixv = N('ShaderNodeMix'); mixv.data_type = 'VECTOR'; mixv.inputs['Factor'].default_value = 0.35
    L(tc.outputs['Object'], mixv.inputs['A']); L(warp.outputs['Color'], mixv.inputs['B'])
    L(tc.outputs['Object'], warp.inputs['Vector'])
    nz = N('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'; nz.inputs['Scale'].default_value = 5.5; nz.inputs['Detail'].default_value = 14
    nz.inputs['Roughness'].default_value = 0.62; nz.inputs['Distortion'].default_value = 0.25
    nz.inputs['W'].default_value = seed + 3
    L(mixv.outputs['Result'], nz.inputs['Vector'])
    # latitude bands: |z| -> fewer clouds near 20-30 degrees, more in the storm tracks
    sep = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Object'], sep.inputs[0])
    ab = N('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; L(sep.outputs['Z'], ab.inputs[0])
    band = N('ShaderNodeFloatCurve')
    cv = band.mapping.curves[0]
    cv.points[0].location = (0.0, 0.55); cv.points[1].location = (1.0, 0.35)
    cv.points.new(0.4, 0.1); cv.points.new(0.8, 0.75)
    band.mapping.update()
    L(ab.outputs[0], band.inputs['Value'])
    add = N('ShaderNodeMath'); add.operation = 'MULTIPLY_ADD'
    add.inputs[1].default_value = 0.22
    L(band.outputs[0], add.inputs[0]); L(nz.outputs['Fac'], add.inputs[2])
    thr = N('ShaderNodeMapRange'); thr.interpolation_type = 'SMOOTHSTEP'
    lo = 0.72 - 0.25 * coverage
    thr.inputs['From Min'].default_value = lo; thr.inputs['From Max'].default_value = lo + 0.16
    L(add.outputs[0], thr.inputs['Value'])
    bsdf = N('ShaderNodeBsdfDiffuse'); bsdf.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1)
    tr = N('ShaderNodeBsdfTransparent')
    mix = N('ShaderNodeMixShader')
    k = N('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = 0.92
    L(thr.outputs['Result'], k.inputs[0])
    L(k.outputs[0], mix.inputs['Fac']); L(tr.outputs[0], mix.inputs[1]); L(bsdf.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    c.data.materials.append(m)
    return c


def atmo(sun_dir, r=1.02, strength=5.0):
    """A thin shell glowing at the limb on the day side, warming at the terminator."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=96, radius=r)
    a = bpy.context.object
    a.name = 'atmosphere'
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new('atmo')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.5
    edge = N('ShaderNodeMath'); edge.operation = 'POWER'; edge.inputs[1].default_value = 7.0  # Facing: 0 face-on, 1 at the grazing limb
    L(lw.outputs['Facing'], edge.inputs[0])
    nd = _sun_dot(nt, sun_dir)
    lit = _smooth(nt, nd, -0.12, 0.35)
    warm = _smooth(nt, nd, -0.05, 0.3)
    col = N('ShaderNodeMixRGB'); col.inputs[1].default_value = hexc('#ff8a4a'); col.inputs[2].default_value = hexc('#4f9dff')
    L(warm, col.inputs[0])
    f = N('ShaderNodeMath'); f.operation = 'MULTIPLY'
    L(edge.outputs[0], f.inputs[0]); L(lit, f.inputs[1])
    em = N('ShaderNodeEmission')
    L(col.outputs[0], em.inputs['Color'])
    s = N('ShaderNodeMath'); s.operation = 'MULTIPLY'; s.inputs[1].default_value = strength
    L(f.outputs[0], s.inputs[0])
    L(s.outputs[0], em.inputs['Strength'])
    tr = N('ShaderNodeBsdfTransparent')
    add = N('ShaderNodeAddShader')
    L(tr.outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1])
    L(add.outputs[0], out.inputs['Surface'])
    a.data.materials.append(m)
    a.visible_shadow = False
    return a


# ---------------------------------------------------------------- geometry helpers
def _link_new(name, data):
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    return ob


def mesh(name, verts, faces, material=None, smooth=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    if material:
        me.materials.append(material)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return _link_new(name, me)


def group(name, children, loc=(0, 0, 0), scale=1.0, aim=None, up=(0, 0, 1), roll=0.0):
    """Parent `children` to an empty, then place and aim the model (model axes: +X forward, +Z up)."""
    root = _link_new(name, None)
    for c in children:
        c.parent = root
    root.location = Vector(loc)
    root.scale = (scale,) * 3
    if aim is not None:
        f = Vector(aim).normalized()
        u = Vector(up)
        u = u - f * f.dot(u)
        u = u.normalized() if u.length > 1e-3 else f.orthogonal().normalized()  # `up` along the aim: any perpendicular will do
        m = Matrix((f, u.cross(f), u)).transposed()
        root.rotation_euler = (m @ Matrix.Rotation(roll, 3, 'X')).to_euler()
    return root


def box(name, size, loc=(0, 0, 0), material=None, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = ob.modifiers.new('bevel', 'BEVEL'); mod.width = bevel; mod.segments = 3
    if material:
        ob.data.materials.append(material)
    return ob


def cyl(name, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), material=None, verts=48, r2=None, smooth=True):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    if smooth:
        bpy.ops.object.shade_smooth()
    if material:
        ob.data.materials.append(material)
    return ob


def sphere(name, r, loc=(0, 0, 0), material=None, seg=48, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    ob = bpy.context.object
    ob.name = name
    bpy.ops.object.shade_smooth()
    if scale:
        ob.scale = scale
    if material:
        ob.data.materials.append(material)
    return ob


# ---------------------------------------------------------------- trails, rings, beams, effects
def curve(name, points, radius=0.003, material=None, taper=None, resolution=4):
    """A tube along `points`. `taper`: (start, end) multiples of `radius`."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = resolution
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(points) - 1)
    n = len(points)
    for i, p in enumerate(points):
        sp.points[i].co = (*p, 1)
        if taper:
            t = i / max(1, n - 1)
            sp.points[i].radius = taper[0] + (taper[1] - taper[0]) * t
    if material:
        cu.materials.append(material)
    ob = _link_new(name, cu)
    ob.visible_shadow = False
    return ob


def orbit_points(alt_km, inc, raan, n=360, a0=0.0, a1=360.0, apo_km=None):
    """Points on a circular orbit, or (with apo_km) an ellipse with its perigee at angle 0."""
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        if apo_km is not None:
            rp, ra = 1 + alt_km / R_KM, 1 + apo_km / R_KM
            e = (ra - rp) / (ra + rp)
            r = rp * (1 + e) / (1 + e * math.cos(a))
        else:
            r = 1 + alt_km / R_KM
        v = Vector((r * math.cos(a), r * math.sin(a), 0))
        v = Matrix.Rotation(math.radians(raan), 3, 'Z') @ (Matrix.Rotation(math.radians(inc), 3, 'X') @ v)
        pts.append(v)
    return pts


def ring(name, alt_km, inc=0, raan=0, color='#ffcf6e', radius=0.0025, strength=3.0, a0=0, a1=360, apo_km=None):
    return curve(name, orbit_points(alt_km, inc, raan, 720, a0, a1, apo_km), radius, glow_mat(name + '-m', color, strength))


def arc(a, b, lift=0.15, n=96):
    """A ballistic-looking arc from a to b, bowed away from the Earth's centre."""
    a, b = Vector(a), Vector(b)
    pts = []
    for i in range(n + 1):
        t = i / n
        r = a.length + (b.length - a.length) * t + lift * math.sin(math.pi * t)
        pts.append(a.lerp(b, t).normalized() * r)
    return pts


def trail(name, points, color, radius=0.004, strength=6.0, fade_in=True):
    """A glowing exhaust trail: thin and faint at its old end, full at the vehicle."""
    return curve(name, points, radius, glow_mat(name + '-m', color, strength, fresnel=True, alpha=0.95, power=1.4),
                 taper=(0.15, 1.0) if fade_in else None)


def _point_light(name, loc, energy, color, size=0.01):
    pt = bpy.data.lights.new(name, 'POINT')
    pt.energy = energy
    pt.color = _col(color)[:3]
    pt.shadow_soft_size = size
    ob = _link_new(name, pt)
    ob.location = Vector(loc)
    return ob


def plume(name, base, direction, length=0.06, width=0.012, color='#ffb36b', light=1.0):
    """Rocket exhaust: a white-hot core inside a soft coloured cone, pointing along `direction` (away from the vehicle)."""
    d = Vector(direction).normalized()
    objs = []
    for k, (w, l, c, s, a) in enumerate(((width, length, '#fff3d6', 12, 1.0), (width * 1.5, length * 1.5, color, 3, 0.35))):
        ob = cyl(f'{name}-{k}', w, l, material=glow_mat(f'{name}-m{k}', c, s, fresnel=True, alpha=a, power=1.6), r2=w * 0.05, verts=32)
        ob.location = Vector(base) + d * (l / 2)
        ob.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()  # the cone narrows toward +Z: its tip trails away from the nozzle
        ob.visible_shadow = False
        objs.append(ob)
    if light:
        objs.append(_point_light(name + '-light', Vector(base) + d * width, 2500 * width ** 2 * light, color, width))
    return objs


def flash(name, loc, r=0.02, color='#fff1cf', strength=60.0, halo='#ffb070', light=True):
    core = sphere(name, r, loc, glow_mat(name + '-m', color, strength, fresnel=True, alpha=1.0, power=1.2), seg=32)
    hal = sphere(name + '-halo', r * 3.2, loc, glow_mat(name + '-hm', halo, strength * 0.08, fresnel=True, alpha=0.35, power=4.0), seg=32)
    for o in (core, hal):
        o.visible_shadow = False
    if light:
        _point_light(name + '-light', loc, 0.8 * strength * r ** 2, halo, r)
    return core, hal


def debris(name, centre_fn, n, size=0.0025, color='#ffb38a', glow=2.5, seed=1, metal_share=0.45):
    """n small irregular fragments placed by centre_fn(i, rng) -> Vector; some glow warm, the rest are dull metal."""
    rng = random.Random(seed)
    hot, cold = [], []
    for i in range(n):
        c = Vector(centre_fn(i, rng))
        s = size * (0.4 + rng.random() ** 2 * 1.6)
        verts = [c + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized() * s * rng.uniform(0.5, 1.2) for _ in range(4)]
        (cold if rng.random() < metal_share else hot).append(verts)
    out = []
    for tag, lst, m in (('h', hot, glow_mat(name + '-hot', color, glow)), ('c', cold, mat(name + '-cold', '#c3c7d0', metallic=0.9, rough=0.3))):
        V, F = [], []
        for vs in lst:
            k = len(V)
            V += vs
            F += [(k, k + 1, k + 2), (k, k + 1, k + 3), (k, k + 2, k + 3), (k + 1, k + 2, k + 3)]
        if V:
            ob = mesh(f'{name}-{tag}', V, F, m)
            ob.visible_shadow = False
            out.append(ob)
    return out


def ground_disc(name, lat, lon, radius_deg, color, strength=2.0, alpha=0.6, lift_km=4, rings=0):
    """A glowing translucent cap on the Earth (a jamming zone, a footprint), brightest at the centre, optional ripples."""
    c = ll(lat, lon)
    n = 96
    east = Vector((0, 0, 1)).cross(c).normalized()
    north = c.cross(east).normalized()
    V, F = [ll(lat, lon, lift_km)], []
    for ri in range(1, 13):
        ang = math.radians(radius_deg) * ri / 12
        for k in range(n):
            th = 2 * math.pi * k / n
            d = east * math.cos(th) + north * math.sin(th)
            V.append((c * math.cos(ang) + d * math.sin(ang)) * (1 + lift_km / R_KM))
    for k in range(n):
        F.append((0, 1 + k, 1 + (k + 1) % n))
    for ri in range(1, 12):
        b0, b1 = 1 + (ri - 1) * n, 1 + ri * n
        for k in range(n):
            F.append((b0 + k, b0 + (k + 1) % n, b1 + (k + 1) % n, b1 + k))
    m = bpy.data.materials.new(name + '-m')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    tc = N('ShaderNodeTexCoord')
    dist = N('ShaderNodeVectorMath'); dist.operation = 'DISTANCE'; dist.inputs[1].default_value = tuple(c)
    L(tc.outputs['Object'], dist.inputs[0])
    span = 2 * math.sin(math.radians(radius_deg) / 2)
    fall = N('ShaderNodeMapRange'); fall.inputs['From Max'].default_value = span
    fall.inputs['To Min'].default_value = 1; fall.inputs['To Max'].default_value = 0
    L(dist.outputs['Value'], fall.inputs['Value'])
    pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 0.8
    L(fall.outputs['Result'], pw.inputs[0])
    fac = pw.outputs[0]
    if rings:
        sc = N('ShaderNodeMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = rings * 2 * math.pi / span
        wave = N('ShaderNodeMath'); wave.operation = 'COSINE'
        rr = N('ShaderNodeMapRange'); rr.inputs['From Min'].default_value = 0.55; rr.inputs['From Max'].default_value = 1.0
        rr.inputs['To Min'].default_value = 0.3; rr.inputs['To Max'].default_value = 1.6
        mm = N('ShaderNodeMath'); mm.operation = 'MULTIPLY'
        L(dist.outputs['Value'], sc.inputs[0]); L(sc.outputs[0], wave.inputs[0]); L(wave.outputs[0], rr.inputs['Value'])
        L(fac, mm.inputs[0]); L(rr.outputs['Result'], mm.inputs[1])
        fac = mm.outputs[0]
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = _col(color); em.inputs['Strength'].default_value = strength
    tr = N('ShaderNodeBsdfTransparent')
    k = N('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = alpha; k.use_clamp = True
    L(fac, k.inputs[0])
    mix = N('ShaderNodeMixShader')
    L(k.outputs[0], mix.inputs['Fac'])
    L(tr.outputs[0], mix.inputs[1]); L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    ob = mesh(name, V, F, m, smooth=True)
    ob.visible_shadow = False
    return ob


EARTH_PARTS = ('earth', 'clouds', 'atmosphere')


def split_sun_shadows():
    """The models are drawn hundreds of times life size, so their shadows on the planet would be the size of countries. Light the Earth with a
    shadowless copy of the Sun and keep the shadowed Sun for the models (Cycles light linking)."""
    sun = bpy.data.objects.get('sun')
    if sun is None:
        return
    planet, models = bpy.data.collections.new('lit-planet'), bpy.data.collections.new('lit-models')
    for ob in bpy.context.scene.objects:
        if ob.type in ('MESH', 'CURVE'):
            (planet if ob.name in EARTH_PARTS else models).objects.link(ob)
    twin = bpy.data.objects.new('sun-planet', sun.data.copy())
    twin.data.use_shadow = False
    twin.rotation_euler = sun.rotation_euler
    bpy.context.collection.objects.link(twin)
    sun.light_linking.receiver_collection = models
    twin.light_linking.receiver_collection = planet


def render(path):
    split_sun_shadows()
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
