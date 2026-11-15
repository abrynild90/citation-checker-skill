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
    """A star field: three scales of point stars with their own sizes, brightness and colour (blue-white to orange), thicker along a very faint
    Milky Way with dust lanes. Camera-visible only: the stars light nothing."""
    w = bpy.data.worlds.new('space')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out, bg = N('ShaderNodeOutputWorld'), N('ShaderNodeBackground')
    d = _v(nt, 'NORMALIZE', N('ShaderNodeTexCoord').outputs['Generated'])
    # the Milky Way: a tilted band, patchy, cut by dust lanes
    u = _v(nt, 'DOT_PRODUCT', d, tuple(Vector((0.25, -0.45, 0.86)).normalized()))
    band = _m(nt, 'EXPONENT', _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', u, u), -30.0))
    dd = _warp(nt, d, 3.0, 0.35)
    patch = _noise(nt, dd, 3.5, 6)
    lanes = _smooth(nt, _noise(nt, dd, 8.0, 7), 0.48, 0.68)
    grain = _noise(nt, d, 70, 4)
    way = _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', band, _m(nt, 'MULTIPLY_ADD', patch, 1.4, 0.2)),
             _m(nt, 'MULTIPLY', _m(nt, 'SUBTRACT', 1.0, _m(nt, 'MULTIPLY', lanes, 0.7)), _m(nt, 'MULTIPLY_ADD', grain, 0.8, 0.6)))
    sky = _v(nt, 'ADD', (0.0012, 0.0018, 0.0045), _v(nt, 'SCALE', _ramp(nt, patch, [(0.3, '#8fa8ff'), (0.7, '#ffd9b0')]), s=_m(nt, 'MULTIPLY', way, 0.016)))
    thick = _m(nt, 'MULTIPLY_ADD', band, 2.5, 1.0)  # more stars along the band
    for scale, share, size, gain in ((300, 0.07, 0.16, 0.6), (110, 0.035, 0.06, 1.6), (34, 0.018, 0.02, 4.0)):
        vor = N('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = scale * density
        L(d, vor.inputs['Vector'])
        rnd = N('ShaderNodeSeparateColor'); L(vor.outputs['Color'], rnd.inputs['Color'])
        present = _m(nt, 'GREATER_THAN', rnd.outputs[0], _m(nt, 'SUBTRACT', 1.0, _m(nt, 'MULTIPLY', thick, share)))
        shape = _smooth(nt, vor.outputs['Distance'], _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY_ADD', rnd.outputs[1], 0.8, 0.6), size), 0.0)  # bigger where brighter
        bright = _m(nt, 'MULTIPLY', _m(nt, 'POWER', rnd.outputs[1], 3.0), _m(nt, 'MULTIPLY', present, gain))
        hue = _ramp(nt, rnd.outputs[2], [(0.0, '#a9c4ff'), (0.45, '#ffffff'), (0.75, '#ffe4bd'), (1.0, '#ffb27a')])
        sky = _v(nt, 'ADD', sky, _v(nt, 'SCALE', hue, s=_m(nt, 'MULTIPLY', shape, bright)))
    L(sky, bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    L(bg.outputs[0], out.inputs['Surface'])
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
    _set(nt, m.inputs['From Min'], a)
    _set(nt, m.inputs['From Max'], b)
    nt.links.new(value_socket, m.inputs['Value'])
    return m.outputs['Result']


def _col(c):
    return hexc(c) if isinstance(c, str) else c


# ---------------------------------------------------------------- node helpers: each returns an output socket, operands are sockets or numbers
def _set(nt, sock, v):
    if isinstance(v, (int, float, tuple, list)):
        sock.default_value = v
    else:
        nt.links.new(v, sock)


def _m(nt, op, a, b=None, c=None, clamp=False):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op; n.use_clamp = clamp
    for i, v in enumerate((a, b, c)):
        if v is not None:
            _set(nt, n.inputs[i], v)
    return n.outputs[0]


def _v(nt, op, a, b=None, s=None):
    n = nt.nodes.new('ShaderNodeVectorMath'); n.operation = op
    _set(nt, n.inputs[0], a)
    if b is not None:
        _set(nt, n.inputs[1], b)
    if s is not None:
        _set(nt, n.inputs[3], s)
    return n.outputs['Value' if op in ('DOT_PRODUCT', 'LENGTH', 'DISTANCE') else 'Vector']


def _mix(nt, fac, a, b, kind='RGBA'):
    n = nt.nodes.new('ShaderNodeMix'); n.data_type = kind
    ia, ib, out = {'FLOAT': (2, 3, 0), 'VECTOR': (4, 5, 1), 'RGBA': (6, 7, 2)}[kind]
    _set(nt, n.inputs[0], fac); _set(nt, n.inputs[ia], a); _set(nt, n.inputs[ib], b)
    return n.outputs[out]


def _noise(nt, vec, scale, detail=6.0, rough=0.5, color=False, kind='FBM'):
    n = nt.nodes.new('ShaderNodeTexNoise'); n.noise_dimensions = '3D'; n.noise_type = kind
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = rough
    nt.links.new(vec, n.inputs['Vector'])
    return n.outputs['Color' if color else 'Fac']


def _warp(nt, vec, scale, amount, detail=3.0):
    """`vec` pushed around by a vector noise: swirls and ragged edges."""
    w = _noise(nt, vec, scale, detail, 0.5, color=True)
    return _v(nt, 'ADD', vec, _v(nt, 'SCALE', _v(nt, 'SUBTRACT', w, (0.5, 0.5, 0.5)), s=amount))


def _ramp(nt, fac, stops):
    """Colour ramp through (position, '#hex') stops."""
    n = nt.nodes.new('ShaderNodeValToRGB')
    for i, (pos, c) in enumerate(stops):
        e = n.color_ramp.elements[i] if i < len(n.color_ramp.elements) else n.color_ramp.elements.new(pos)
        e.position, e.color = pos, _col(c)
    nt.links.new(fac, n.inputs['Fac'])
    return n.outputs['Color']


def _near(nt, far=1.8, full=0.6):
    """1 for camera rays shorter than `full` Earth radii, fading to 0 at `far`: where procedural fine detail is worth having (default: full
    within ~4,000 km, gone by ~11,000 km)."""
    return _smooth(nt, nt.nodes.new('ShaderNodeLightPath').outputs['Ray Length'], far, full)


def _twilight(nt, d, albedo):
    """Light on the ground beyond the terminator that the Sun never reaches directly: scattered by the air, orange at the edge, violet beyond.
    `d` is dot(normal, Sun); returns an emission colour."""
    band = _m(nt, 'MULTIPLY', _smooth(nt, d, -0.17, 0.01), _smooth(nt, d, 0.3, 0.01))
    hue = _ramp(nt, _smooth(nt, d, -0.1, 0.01), [(0.0, '#3c3ca8'), (1.0, '#ff8a4a')])
    lit = _v(nt, 'ADD', _v(nt, 'SCALE', albedo, s=0.8), (0.03, 0.03, 0.03))
    return _v(nt, 'SCALE', _v(nt, 'MULTIPLY', hue, lit), s=_m(nt, 'MULTIPLY', band, 0.15))


def _dusk_tint(nt, d):
    """The Sun is reddened where it grazes the air: white above ~20 degrees elevation, orange at the terminator."""
    return _mix(nt, _smooth(nt, d, 0.02, 0.34), (1.0, 0.85, 0.7, 1.0), (1.0, 1.0, 1.0, 1.0))


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
TEXEL = (1 / 4096, 1 / 2048)  # one pixel of the 4K day and night images, in UV


def _lights(nt, uv, pos):
    """City lights from the night image: the blue-grey ground is dropped, the lights are softened (tight and wide blur) and, close up, broken into
    points, because the image's ~10 km pixels read as blocks on their own. Returns a 0..~1 intensity."""
    def level(taps, radius):
        acc = 0
        for dx, dy in taps:
            img = _img(nt, 'earth-night-4k.jpg')
            nt.links.new(_v(nt, 'ADD', uv, (dx * TEXEL[0] * radius, dy * TEXEL[1] * radius, 0)), img.inputs['Vector'])
            red = nt.nodes.new('ShaderNodeSeparateColor')  # the red channel only: the ground is blue-grey (R < 10/255), the lights are white-ish (R ~ 90)
            nt.links.new(img.outputs['Color'], red.inputs['Color'])
            acc = _m(nt, 'ADD', acc, red.outputs[0]) if acc else red.outputs[0]
        m = nt.nodes.new('ShaderNodeMapRange'); m.inputs['From Min'].default_value = 0.006; m.inputs['From Max'].default_value = 0.12
        nt.links.new(_m(nt, 'DIVIDE', acc, len(taps)), m.inputs['Value'])
        return _m(nt, 'POWER', m.outputs['Result'], 1.2)
    ring = tuple((math.cos(a), math.sin(a)) for a in (k * math.pi / 4 for k in range(8)))
    core, tight, wide = level(((0, 0),), 0), level(ring, 2.0), level(ring, 6.0)
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 1300  # ~5 km cells
    nt.links.new(pos, vor.inputs['Vector'])
    rnd = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(vor.outputs['Color'], rnd.inputs['Color'])
    dot = _m(nt, 'MULTIPLY', _smooth(nt, vor.outputs['Distance'], 0.6, 0.15),  # a round dot per cell, lit where the city is dense enough
             _smooth(nt, _m(nt, 'SUBTRACT', _m(nt, 'MULTIPLY', core, 1.8), rnd.outputs[0]), 0.0, 0.3))
    sharp = _m(nt, 'MULTIPLY', core, _mix(nt, _near(nt), 1.0, _m(nt, 'MULTIPLY_ADD', dot, 1.5, 0.5), 'FLOAT'))
    return _m(nt, 'ADD', _m(nt, 'ADD', _m(nt, 'MULTIPLY', sharp, 0.55), _m(nt, 'MULTIPLY', tight, 0.45)), _m(nt, 'MULTIPLY', wide, 0.3))


def _sharp_day(nt, uv):
    """The day image with an unsharp mask: it is shown ~5x larger than its pixels, so its edges (coasts, valleys) need help."""
    taps = []
    for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1), (0, 0)):
        img = _img(nt, 'earth-day-4k.jpg')
        nt.links.new(_v(nt, 'ADD', uv, (dx * TEXEL[0] * 1.6, dy * TEXEL[1] * 1.6, 0)) if dx else uv, img.inputs['Vector'])
        taps.append(img.outputs['Color'])
    blur = _v(nt, 'SCALE', _v(nt, 'ADD', _v(nt, 'ADD', taps[0], taps[1]), _v(nt, 'ADD', taps[2], taps[3])), s=0.25)
    sharp = _v(nt, 'ADD', taps[4], _v(nt, 'SCALE', _v(nt, 'SUBTRACT', taps[4], blur), s=0.6))
    return _v(nt, 'MINIMUM', _v(nt, 'MAXIMUM', sharp, _v(nt, 'SCALE', taps[4], s=0.85)), _v(nt, 'SCALE', taps[4], s=1.3))  # no black halos at coasts


def _ground_albedo(nt, pos, day_color, land, sea, mount, near):
    """The day image with procedural detail on top: eroded-looking ground texture, regional tone, darker valleys among mountains, patchy ocean."""
    q = _warp(nt, pos, 25, 0.008, 4)
    n1 = _noise(nt, q, 70, 9, 0.62)
    n2 = _noise(nt, pos, 22, 5, 0.5)
    crest = _smooth(nt, _noise(nt, q, 40, 8, 0.62, kind='RIDGED_MULTIFRACTAL'), 0.1, 0.9)
    mottle = _smooth(nt, _noise(nt, _warp(nt, pos, 90, 0.0016, 3), 260, 6, 0.68), 0.38, 0.62)  # crisp blotches a few km across: dunes, fields, outcrops
    patch = _m(nt, 'MULTIPLY_ADD', _smooth(nt, _noise(nt, q, 30, 6, 0.7), 0.42, 0.58), 0.5, 0.75)
    k = _m(nt, 'MULTIPLY', land, near)
    ridges = _m(nt, 'SUBTRACT', 1.0, _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', mount, 0.55), _m(nt, 'SUBTRACT', 1.0, crest)))
    tone = _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', patch, ridges), _m(nt, 'MULTIPLY_ADD', _m(nt, 'SUBTRACT', mottle, 0.5), _m(nt, 'MULTIPLY_ADD', mount, 0.6, 0.85), 1.0))  # more contrast in mountains than on the plains
    grit = _m(nt, 'MULTIPLY_ADD', _m(nt, 'SUBTRACT', _smooth(nt, _noise(nt, pos, 1500, 4, 0.6), 0.35, 0.65), 0.5), _m(nt, 'MULTIPLY', _near(nt, 0.45, 0.12), 0.65), 1.0)  # only within ~1,500 km
    tone = _mix(nt, k, 1.0, _m(nt, 'MULTIPLY', tone, grit), 'FLOAT')
    tint = _mix(nt, _m(nt, 'MULTIPLY', land, 0.7), (1, 1, 1, 1), _mix(nt, n2, (1.12, 1.0, 0.82, 1), (0.9, 1.0, 1.1, 1)))
    swell = _mix(nt, _m(nt, 'MULTIPLY', sea, near), 1.0, _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY_ADD', _noise(nt, pos, 26, 4), 0.5, 0.75), _m(nt, 'MULTIPLY_ADD', _m(nt, 'SUBTRACT', grit, 1.0), 0.25, 1.0)), 'FLOAT')
    return _v(nt, 'MULTIPLY', _v(nt, 'MULTIPLY', day_color, tone), _v(nt, 'MULTIPLY', tint, swell)), n1, crest


def _ground_height(nt, pos, relief, wet, mount, crest, n1, near):
    """Bump height: the relief map plus fine ridges and ground texture on land, tiny wavelets on the sea."""
    land_h = _m(nt, 'ADD', _m(nt, 'MULTIPLY', relief, 0.7), _m(nt, 'MULTIPLY', _m(nt, 'ADD', _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', mount, crest), 0.5), _m(nt, 'MULTIPLY', n1, 2.5)), near))
    wave_h = _m(nt, 'MULTIPLY', _noise(nt, pos, 300, 3), _m(nt, 'MULTIPLY', near, 0.04))
    inland = _m(nt, 'POWER', _m(nt, 'SUBTRACT', 1.0, wet), 2.0)  # rises from sea level gently, so shores do not shade like cliffs
    return _m(nt, 'ADD', _m(nt, 'MULTIPLY', land_h, inland), _m(nt, 'MULTIPLY', wave_h, wet))


def _sun_glint(nt, shader, pos, normal, strength):
    """The Sun's reflection on the sea: a tight bright core in a wide soft skirt, the core broken up by patches of rougher water.
    `strength`: Fresnel-weighted reflectance, already masked to open water. Added on top of `shader`."""
    slick = _noise(nt, pos, 55, 5, 0.6)
    for rough, gain in ((_m(nt, 'MULTIPLY_ADD', _smooth(nt, slick, 0.38, 0.62), 0.2, 0.12), 0.8), (_m(nt, 'MULTIPLY_ADD', slick, 0.2, 0.34), 0.45)):
        g = nt.nodes.new('ShaderNodeBsdfGlossy'); g.distribution = 'GGX'
        nt.links.new(rough, g.inputs['Roughness']); nt.links.new(normal, g.inputs['Normal'])
        nt.links.new(_v(nt, 'SCALE', (1, 1, 1), s=_m(nt, 'MULTIPLY', strength, gain)), g.inputs['Color'])
        add = nt.nodes.new('ShaderNodeAddShader')
        nt.links.new(shader, add.inputs[0]); nt.links.new(g.outputs[0], add.inputs[1])
        shader = add.outputs[0]
    return shader


def earth(sun_dir, night_strength=6.0, atmosphere=True, glint=0.25, clouds=0.5):
    """`glint`: strength of the Sun's reflection on the sea. `clouds`: coverage, 0 for none."""
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
    pos = N('ShaderNodeTexCoord').outputs['Object']
    near = _near(nt)
    uv = _equirect_uv(nt, _warp(nt, pos, 180, _m(nt, 'MULTIPLY', near, 0.0016), 4))  # the maps are ~10 km per pixel: ragged coastlines hide it
    water = _img(nt, 'earth-water.png', 'Non-Color')
    relief = _img(nt, 'earth-relief.png', 'Non-Color')
    for n in (water, relief):
        L(uv, n.inputs['Vector'])
    d = _sun_dot(nt, sun_dir)
    # crisp coast: the water mask, sharpened and roughened (1 on the sea)
    sea = _smooth(nt, _m(nt, 'ADD', water.outputs['Color'], _m(nt, 'MULTIPLY', _m(nt, 'SUBTRACT', _noise(nt, pos, 700, 4), 0.5), 0.14)), 0.42, 0.58)
    land = _m(nt, 'SUBTRACT', 1.0, sea)
    open_sea = _smooth(nt, water.outputs['Color'], 0.7, 0.9)  # no glint along the coast
    mount = _smooth(nt, relief.outputs['Color'], 0.2, 0.65)
    hsv = N('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = 1.15; hsv.inputs['Value'].default_value = 1.08
    L(_sharp_day(nt, uv), hsv.inputs['Color'])
    albedo, n1, crest = _ground_albedo(nt, pos, hsv.outputs['Color'], land, sea, mount, near)
    shade = 1.0  # cloud shadows: look up the cloud field where the ray from the Sun through this spot crosses the cloud deck
    if clouds:
        away = _m(nt, 'DIVIDE', 0.008, _m(nt, 'MAXIMUM', d, 0.35))
        cast = _cloud_field(nt, _v(nt, 'NORMALIZE', _v(nt, 'ADD', pos, _v(nt, 'SCALE', tuple(sun_dir), s=away))), clouds, 0.0)[0]
        shade = _m(nt, 'SUBTRACT', 1.0, _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', cast, _smooth(nt, d, 0.0, 0.15)), 0.62))
    lit = _v(nt, 'MULTIPLY', albedo, _v(nt, 'SCALE', _dusk_tint(nt, d), s=shade))
    bsdf = N('ShaderNodeBsdfPrincipled')
    L(lit, bsdf.inputs['Base Color'])
    L(_mix(nt, sea, 0.85, 0.5, 'FLOAT'), bsdf.inputs['Roughness'])  # ocean glossy, land matte
    L(_m(nt, 'MULTIPLY', _mix(nt, sea, 0.1, 0.04, 'FLOAT'), shade), bsdf.inputs['Specular IOR Level'])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.8; bump.inputs['Distance'].default_value = 0.004
    L(_ground_height(nt, pos, relief.outputs['Color'], water.outputs['Color'], mount, crest, n1, near), bump.inputs['Height'])
    L(bump.outputs['Normal'], bsdf.inputs['Normal'])
    fres = N('ShaderNodeFresnel'); fres.inputs['IOR'].default_value = 1.33
    reflect = _m(nt, 'MULTIPLY', _m(nt, 'MULTIPLY', _m(nt, 'MINIMUM', fres.outputs[0], 0.12), open_sea), _m(nt, 'MULTIPLY', shade, glint))
    shader = _sun_glint(nt, bsdf.outputs[0], pos, bump.outputs['Normal'], reflect)
    # dusk light the air scatters past the terminator, as emission on the ground itself
    L(_twilight(nt, d, hsv.outputs['Color']), bsdf.inputs['Emission Color'])  # from the plain image: no fine texture in the dusk glow
    bsdf.inputs['Emission Strength'].default_value = 1.0
    # night lights on the dark side, fading in across the terminator, sodium-warm. A mixed-in shader, so the many texture reads are skipped by day
    glow = _m(nt, 'MULTIPLY', _lights(nt, uv, pos), night_strength * 0.6)
    lamps = N('ShaderNodeEmission'); L(_ramp(nt, _m(nt, 'MULTIPLY', glow, 0.5), [(0.0, '#ff9440'), (1.0, '#ffd9a0')]), lamps.inputs['Color']); L(glow, lamps.inputs['Strength'])
    night = N('ShaderNodeAddShader'); L(shader, night.inputs[0]); L(lamps.outputs[0], night.inputs[1])
    fade = N('ShaderNodeMixShader'); L(_smooth(nt, d, 0.06, -0.16), fade.inputs['Fac']); L(shader, fade.inputs[1]); L(night.outputs[0], fade.inputs[2])
    L(fade.outputs[0], out.inputs['Surface'])
    e.data.materials.append(m)
    if clouds:
        cloud_layer(sun_dir, clouds)
    if atmosphere:
        atmo(sun_dir)
    return e


def _cloud_field(nt, p, coverage, seed):
    """Cloud opacity, core density and height at the unit-sphere position `p`: swirled synoptic systems, streaky bands, and ragged wisps at the
    edges that give way to dense cores. The cloud shell and the shadows it casts on the ground both read it."""
    q = _v(nt, 'ADD', p, (seed * 7.1, seed * 3.3, seed * 5.9))
    q = _warp(nt, _warp(nt, q, 1.7, 0.4, 4), 6.0, 0.1)
    big = _noise(nt, q, 4.0, 7, 0.58)
    streak = _noise(nt, _v(nt, 'MULTIPLY', q, (1.0, 1.0, 3.2)), 11, 5, 0.55)  # stretched along the parallels
    # latitude bands: fewer clouds near 20-30 degrees, more in the storm tracks
    z = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(p, z.inputs[0])
    band = nt.nodes.new('ShaderNodeFloatCurve')
    cv = band.mapping.curves[0]
    cv.points[0].location = (0.0, 0.55); cv.points[1].location = (1.0, 0.35)
    cv.points.new(0.4, 0.1); cv.points.new(0.8, 0.75)
    band.mapping.update()
    nt.links.new(_m(nt, 'ABSOLUTE', z.outputs['Z']), band.inputs['Value'])
    f = _m(nt, 'MULTIPLY_ADD', _m(nt, 'MULTIPLY_ADD', big, 0.75, _m(nt, 'MULTIPLY', streak, 0.25)), 1.8, -0.4)  # the noises sit tightly around 0.5: widen the spread
    f = _m(nt, 'MULTIPLY_ADD', band.outputs[0], 0.22, f)
    f = _m(nt, 'MULTIPLY_ADD', _m(nt, 'SUBTRACT', _noise(nt, q, 38, 7, 0.6), 0.5), 1.0, f)  # ragged edges ...
    f = _m(nt, 'MULTIPLY_ADD', _m(nt, 'SUBTRACT', _noise(nt, q, 190, 5, 0.6), 0.5), _m(nt, 'MULTIPLY', _near(nt), 0.35), f)  # ... and fine wisps close up
    lo = 0.8 - 0.25 * coverage
    edge = _smooth(nt, f, lo, lo + 0.17)
    core = _smooth(nt, f, lo + 0.1, lo + 0.38)
    alpha = _m(nt, 'ADD', _m(nt, 'MULTIPLY', edge, 0.55), _m(nt, 'MULTIPLY', core, 0.6), clamp=True)
    return alpha, core, f


def cloud_layer(sun_dir, coverage=0.5, seed=0.0):
    """Clouds on a shell just above the ground (see _cloud_field), lit by the Sun only: relief from the density, warm at dusk, faint at night."""
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
    p = _v(nt, 'NORMALIZE', N('ShaderNodeTexCoord').outputs['Object'])
    alpha, core, height = _cloud_field(nt, p, coverage, seed)
    d = _sun_dot(nt, sun_dir)
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.7; bump.inputs['Distance'].default_value = 0.02
    L(height, bump.inputs['Height'])
    body = N('ShaderNodeBsdfDiffuse'); L(bump.outputs['Normal'], body.inputs['Normal'])
    L(_v(nt, 'MULTIPLY', _mix(nt, core, (0.6, 0.62, 0.67, 1), (0.82, 0.83, 0.85, 1)), _dusk_tint(nt, d)), body.inputs['Color'])
    glow = N('ShaderNodeEmission')
    L(_v(nt, 'ADD', _twilight(nt, d, (0.9, 0.9, 0.9)), _v(nt, 'SCALE', (0.55, 0.62, 0.8), s=_m(nt, 'ADD', 0.006, _m(nt, 'MULTIPLY', _smooth(nt, d, -0.35, 0.1), 0.03)))), glow.inputs['Color'])  # skylight: clouds never go charcoal
    add = N('ShaderNodeAddShader'); L(body.outputs[0], add.inputs[0]); L(glow.outputs[0], add.inputs[1])
    mix = N('ShaderNodeMixShader')
    L(alpha, mix.inputs['Fac']); L(N('ShaderNodeBsdfTransparent').outputs[0], mix.inputs[1]); L(add.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    c.data.materials.append(m)
    return c


def atmo(sun_dir, r=1.05, strength=1.0):
    """The air as a shell that glows by how deep the line of sight cuts into it (its closest approach to the ground): a thin bright blue line at
    the limb, a wider faint haze above it, a bluish haze over the ground near the limb, orange at the terminator, nothing on the night side."""
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
    geo = N('ShaderNodeNewGeometry')
    P, v = geo.outputs['Position'], _v(nt, 'SCALE', geo.outputs['Incoming'], s=-1.0)  # hit point, ray direction
    b = _v(nt, 'LENGTH', _v(nt, 'CROSS_PRODUCT', P, v))  # closest approach to the Earth's centre, in Earth radii
    tangent = _v(nt, 'SUBTRACT', P, _v(nt, 'SCALE', v, s=_v(nt, 'DOT_PRODUCT', P, v)))
    spot = _mix(nt, _smooth(nt, b, 0.9, 1.0), _v(nt, 'NORMALIZE', P), _v(nt, 'NORMALIZE', tangent), 'VECTOR')  # where the Sun reaches the air we look through
    d = _v(nt, 'DOT_PRODUCT', _v(nt, 'NORMALIZE', spot), tuple(Vector(sun_dir).normalized()))
    x = _m(nt, 'SUBTRACT', b, 1.0)
    outside = _smooth(nt, x, -0.002, 0.002)
    def layer(h_in, h_out):
        return _m(nt, 'EXPONENT', _m(nt, 'DIVIDE', _m(nt, 'MULTIPLY', _m(nt, 'ABSOLUTE', x), -1.0), _mix(nt, outside, h_in, h_out, 'FLOAT')))
    sunward = _smooth(nt, d, 0.0, 0.32)
    line = _v(nt, 'MULTIPLY', _mix(nt, sunward, (1.0, 0.5, 0.2, 1), (0.22, 0.5, 1.0, 1)), (1.0,) * 3)
    haze = _v(nt, 'MULTIPLY', _mix(nt, sunward, (0.9, 0.28, 0.12, 1), (0.1, 0.3, 1.0, 1)), (0.16,) * 3)
    thin = layer(0.003, 0.0011)
    air = _v(nt, 'SCALE', (0.012, 0.045, 0.04), s=_m(nt, 'MULTIPLY', thin, _smooth(nt, d, -0.1, -0.4)))  # faint airglow line on the night side
    day = _v(nt, 'ADD', _v(nt, 'SCALE', line, s=thin), _v(nt, 'SCALE', haze, s=layer(0.02, 0.01)))
    glow = _v(nt, 'ADD', _v(nt, 'SCALE', day, s=_smooth(nt, d, -0.26, 0.2)), air)  # sunlit air only
    gain = _m(nt, 'MULTIPLY', _m(nt, 'SUBTRACT', 1.0, geo.outputs['Backfacing']),
              _m(nt, 'MULTIPLY', _smooth(nt, x, (r - 1) * 0.95, (r - 1) * 0.6), strength))  # front face only, faded out before the shell's edge
    em = N('ShaderNodeEmission')
    L(glow, em.inputs['Color']); L(gain, em.inputs['Strength'])
    add = N('ShaderNodeAddShader')
    L(N('ShaderNodeBsdfTransparent').outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1])
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
