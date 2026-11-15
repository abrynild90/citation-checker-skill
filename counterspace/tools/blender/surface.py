# Shared surface tools for the detailed models (f15.py, sats.py): lofted bodies, airfoil surfaces, procedural textures written with numpy
# (panel lines and rivets, solar cells), and the materials built on them. Units are metres; kit.group() scales a finished model into the scene.
import math
import random

import bpy
import numpy as np

import kit


# ---------------------------------------------------------------- geometry
def superellipse_ring(cx, cy, cz, hw, ht, hb, n=2.0, k=48):
    """One cross-section ring at x = cx: half-width hw, height ht above and hb below cz, squareness n (2 = ellipse, larger = boxier)."""
    pts = []
    for i in range(k):
        t = 2 * math.pi * i / k
        c, s = math.cos(t), math.sin(t)
        y = cy + hw * math.copysign(abs(c) ** (2 / n), c)
        h = ht if s >= 0 else hb
        pts.append((cx, y, cz + h * math.copysign(abs(s) ** (2 / n), s)))
    return pts


def loft(name, rings, material=None, cap_start=True, cap_end=True, smooth=True, subdiv=2):
    """Skin a list of equal-length rings into a body; cap_start=False leaves the first ring open (an intake mouth)."""
    k = len(rings[0])
    V = [p for r in rings for p in r]
    F = []
    for a in range(len(rings) - 1):
        for i in range(k):
            j = (i + 1) % k
            F.append((a * k + i, a * k + j, (a + 1) * k + j, (a + 1) * k + i))
    if cap_start:
        c = len(V)
        V.append(tuple(sum(p[q] for p in rings[0]) / k for q in range(3)))
        F += [(c, (i + 1) % k, i) for i in range(k)]
    if cap_end:
        c = len(V)
        last = (len(rings) - 1) * k
        V.append(tuple(sum(p[q] for p in rings[-1]) / k for q in range(3)))
        F += [(c, last + i, last + (i + 1) % k) for i in range(k)]
    ob = kit.mesh(name, V, F, material, smooth=smooth)
    outward(ob)
    if subdiv:
        mod = ob.modifiers.new('subd', 'SUBSURF')
        mod.levels = 1
        mod.render_levels = subdiv
    return ob


def outward(ob):
    """Make the faces point outward (the ring winding depends on the section's direction; shading of open ends relies on this)."""
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()


def naca(t, m=0.0, n=20):
    """A closed NACA 4-digit style section, chord 0..1, thickness ratio t, camber m: (x, z) from the trailing edge over the top and back."""
    xs = [0.5 * (1 - math.cos(math.pi * i / n)) for i in range(n + 1)]

    def thick(x):
        return 5 * t * (0.2969 * math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4)

    def camber(x):
        return m * (0.8 * x - x * x) / 0.16 if x < 0.4 else m * (0.2 + 0.8 * x - x * x) / 0.36

    top = [(x, camber(x) + thick(x)) for x in reversed(xs)]
    bot = [(x, camber(x) - thick(x)) for x in xs[1:-1]]
    return top + bot


def surface(name, stations, material=None, vertical=False, camber=0.0, n=20, subdiv=0):
    """A wing-like surface from spanwise stations (span, le_x, chord, thickness_ratio, offset). Horizontal: span is y, offset z.
    Vertical: span is z, offset y. The chord runs toward -x from the leading edge."""
    rings = []
    for span, le, chord, tr, off in stations:
        ring = []
        for u, w in naca(tr, camber, n):
            x = le - u * chord
            ring.append((x, off + w * chord, span) if vertical else (x, span, off + w * chord))
        rings.append(ring)
    ob = loft(name, rings, material, smooth=True, subdiv=subdiv)
    smooth_by_angle(ob, 40)
    return ob


def smooth_by_angle(ob, deg=35):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(deg))
    except (AttributeError, RuntimeError, TypeError):
        bpy.ops.object.shade_smooth()


def flat_shape(name, outline, material, lift=0.0, thick=0.0):
    """A flat polygon (x, y) at height `lift`: a decal (thick=0) or a thin plate."""
    n = len(outline)
    if thick:
        V = [(x, y, lift - thick / 2) for x, y in outline] + [(x, y, lift + thick / 2) for x, y in outline]
        F = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    else:
        V = [(x, y, lift) for x, y in outline]
        F = [tuple(range(n))]
    ob = kit.mesh(name, V, F, material)
    ob.visible_shadow = False
    return ob


def text_mesh(name, body, size, material):
    """Lettering as a flat mesh in the XY plane, reading along +X (Blender's built-in font)."""
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = body
    cu.size = size
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.object
    ob.data.materials.append(material)
    ob.visible_shadow = False
    return ob


# ---------------------------------------------------------------- numpy textures
def _image(name, arr):
    """arr: H x W x 4 floats in 0..1 -> a packed Blender image (top row first)."""
    h, w = arr.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=True, float_buffer=False)
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1], dtype=np.float32).ravel())
    img.pack()
    return img


def panel_lines(size=2048, seed=4, min_px=120, max_px=820, line=3, rivet_step=13):
    """An aircraft skin map: recursive rectangular panels with recessed seams, rows of rivets and screwed access hatches.
    R: seam/rivet darkness (1 = clean skin). G: panel-to-panel tone. B: fastener mask. Made once per scene and shared."""
    if bpy.data.images.get(f'panels-{seed}'):
        return bpy.data.images[f'panels-{seed}']
    rng = random.Random(seed)
    seam = np.ones((size, size), np.float32)
    tone = np.ones((size, size), np.float32)
    fast = np.zeros((size, size), np.float32)

    def rivets(x0, y0, x1, y1):
        off = line + 5
        for x in range(x0 + off, x1 - off, rivet_step):
            for y in (y0 + off, y1 - off):
                seam[y % size, x % size] = min(seam[y % size, x % size], 0.62)
                fast[y % size, x % size] = 1
        for y in range(y0 + off, y1 - off, rivet_step):
            for x in (x0 + off, x1 - off):
                seam[y % size, x % size] = min(seam[y % size, x % size], 0.62)
                fast[y % size, x % size] = 1

    def hatch(x0, y0, w, h):
        hx, hy = x0 + rng.randrange(20, w - 80), y0 + rng.randrange(20, h - 80)
        hw, hh = rng.randrange(40, 70), rng.randrange(30, 60)
        seam[hy, hx:hx + hw] = 0.45
        seam[hy + hh, hx:hx + hw] = 0.45
        seam[hy:hy + hh, hx] = 0.45
        seam[hy:hy + hh, hx + hw] = 0.45
        for cx, cy in ((hx + 4, hy + 4), (hx + hw - 4, hy + 4), (hx + 4, hy + hh - 4), (hx + hw - 4, hy + hh - 4)):
            seam[cy - 1:cy + 2, cx - 1:cx + 2] = 0.5

    def split(x0, y0, x1, y1, depth=0):
        w, h = x1 - x0, y1 - y0
        if (w < max_px and h < max_px and rng.random() < 0.55) or w < min_px * 2 or h < min_px * 2 or depth > 9:
            tone[y0:y1, x0:x1] = 0.94 + rng.random() * 0.1
            seam[y0:y0 + line, x0:x1] = 0.35
            seam[y0:y1, x0:x0 + line] = 0.35
            rivets(x0, y0, x1, y1)
            if rng.random() < 0.18 and w > 120 and h > 120:
                hatch(x0, y0, w, h)
            return
        if w > h or (w == h and rng.random() < 0.5):
            c = x0 + int(w * rng.uniform(0.3, 0.7))
            split(x0, y0, c, y1, depth + 1)
            split(c, y0, x1, y1, depth + 1)
        else:
            c = y0 + int(h * rng.uniform(0.3, 0.7))
            split(x0, y0, x1, c, depth + 1)
            split(x0, c, x1, y1, depth + 1)

    split(0, 0, size, size)
    return _image(f'panels-{seed}', np.stack([seam, tone, fast, np.ones_like(seam)], -1))


def solar_cell_map(cols=8, rows=6, px=1024, seed=2, style='gaas'):
    """A panel of solar cells. RGB: colour. Alpha: 1 on cell glass, 0 on the substrate (drives roughness and coat).
    'gaas': deep blue triple-junction cells with cropped corners, busbars and grid fingers. 'si': older dark-blue silicon cells with a faint violet cast."""
    if bpy.data.images.get(f'cells-{style}-{seed}'):
        return bpy.data.images[f'cells-{style}-{seed}']
    rng = np.random.default_rng(seed)
    h = int(px * rows / cols)
    img = np.zeros((h, px, 4), np.float32)
    img[..., :3] = (0.8, 0.81, 0.83)  # white Kapton substrate
    img[..., 3] = 0.0
    cw, ch = px / cols, h / rows
    gap = max(2, int(cw * 0.035))
    base = np.array({'gaas': (0.025, 0.04, 0.14), 'si': (0.05, 0.075, 0.2), 'iss': (0.2, 0.11, 0.03)}[style])
    yy, xx = np.mgrid[0:int(ch) - gap, 0:int(cw) - gap]
    hh, ww = yy.shape
    cut = 0.13 * min(cw, ch)
    corner = ((xx + yy) < cut) | ((ww - xx + yy) < cut) | ((xx + hh - yy) < cut) | ((ww - xx + hh - yy) < cut)
    fingers = (yy % max(4, int(hh / 14))) == 0
    bus = (np.abs(xx - ww * 0.33) < 0.8) | (np.abs(xx - ww * 0.67) < 0.8)
    grad = 1 + 0.05 * (xx / ww - 0.5) + 0.03 * (yy / hh - 0.5)
    for r in range(rows):
        for c in range(cols):
            x0, y0 = int(c * cw + gap / 2), int(r * ch + gap / 2)
            shade = base * (0.97 + 0.06 * rng.random())
            cell = shade[None, None, :] * grad[..., None]
            cell = np.where(fingers[..., None], cell * 1.18 + 0.004, cell)
            cell = np.where(bus[..., None], np.array((0.2, 0.21, 0.24)), cell)
            alpha = np.ones_like(grad)
            if style == 'gaas':
                cell = np.where(corner[..., None], np.array((0.8, 0.81, 0.83)), cell)
                alpha = np.where(corner, 0.0, 1.0)
            img[y0:y0 + hh, x0:x0 + ww, :3] = cell
            img[y0:y0 + hh, x0:x0 + ww, 3] = alpha
    return _image(f'cells-{style}-{seed}', img)


# ---------------------------------------------------------------- materials
def _box_tex(nt, image, scale):
    """An image laid on the object by box projection (no UVs needed), `scale` repeats per metre."""
    N, L = nt.nodes.new, nt.links.new
    tc = N('ShaderNodeTexCoord')
    mp = N('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale,) * 3
    L(tc.outputs['Object'], mp.inputs['Vector'])
    tx = N('ShaderNodeTexImage')
    tx.image = image
    tx.image.colorspace_settings.name = 'Non-Color'
    tx.projection = 'BOX'
    tx.projection_blend = 0.25
    tx.interpolation = 'Linear'
    L(mp.outputs['Vector'], tx.inputs['Vector'])
    return tx


def _grey(nt, value_socket):
    c = nt.nodes.new('ShaderNodeCombineColor')
    for ch in ('Red', 'Green', 'Blue'):
        nt.links.new(value_socket, c.inputs[ch])
    return c.outputs['Color']


def _multiply(nt, a, b):
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    nt.links.new(a, mix.inputs['A'])
    nt.links.new(b, mix.inputs['B'])
    return mix.outputs['Result']


def aircraft_paint(name, light='#7b838b', dark='#68717a', panels=None, tile=0.22, two_tone=True, grime=0.35, rough=0.55, inside=None):
    """Matte military paint: two greys with an irregular boundary on the upper surfaces, recessed panel seams and rivets,
    panel-to-panel tone, dirt streaks trailing aft."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    sep_n = N('ShaderNodeSeparateXYZ')
    L(tc.outputs['Normal'], sep_n.inputs[0])
    blot = N('ShaderNodeTexNoise'); blot.inputs['Scale'].default_value = 0.22; blot.inputs['Detail'].default_value = 1.5
    L(tc.outputs['Object'], blot.inputs['Vector'])
    top = kit._smooth(nt, sep_n.outputs['Z'], 0.05, 0.45)
    pat = N('ShaderNodeMapRange'); pat.interpolation_type = 'SMOOTHSTEP'
    pat.inputs['From Min'].default_value = 0.47; pat.inputs['From Max'].default_value = 0.52
    L(blot.outputs['Fac'], pat.inputs['Value'])
    mask = N('ShaderNodeMath'); mask.operation = 'MULTIPLY'
    L(top, mask.inputs[0]); L(pat.outputs['Result'], mask.inputs[1])
    col = N('ShaderNodeMix'); col.data_type = 'RGBA'
    col.inputs['A'].default_value = kit.hexc(light); col.inputs['B'].default_value = kit.hexc(dark)
    if two_tone:
        L(mask.outputs[0], col.inputs['Factor'])
    else:
        col.inputs['Factor'].default_value = 0.0
    out_col = col.outputs['Result']
    if panels is not None:
        tx = _box_tex(nt, panels, tile)
        sep = N('ShaderNodeSeparateColor'); L(tx.outputs['Color'], sep.inputs['Color'])
        sv = N('ShaderNodeMapRange'); sv.inputs['To Min'].default_value = 0.3; sv.inputs['To Max'].default_value = 1.0
        L(sep.outputs['Red'], sv.inputs['Value'])
        tone = N('ShaderNodeMath'); tone.operation = 'MULTIPLY'
        L(sv.outputs['Result'], tone.inputs[0]); L(sep.outputs['Green'], tone.inputs[1])
        out_col = _multiply(nt, out_col, _grey(nt, tone.outputs[0]))
        bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.35; bump.inputs['Distance'].default_value = 0.003
        L(sep.outputs['Red'], bump.inputs['Height'])
        L(bump.outputs['Normal'], p.inputs['Normal'])
        rr = N('ShaderNodeMapRange'); rr.inputs['From Min'].default_value = 0.35
        rr.inputs['To Min'].default_value = rough + 0.15; rr.inputs['To Max'].default_value = rough
        L(sep.outputs['Red'], rr.inputs['Value'])
        L(rr.outputs['Result'], p.inputs['Roughness'])
    else:
        p.inputs['Roughness'].default_value = rough
    mp = N('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.25, 9.0, 9.0)  # streaks run along the airflow (x)
    L(tc.outputs['Object'], mp.inputs['Vector'])
    streak = N('ShaderNodeTexNoise'); streak.inputs['Scale'].default_value = 1.4; streak.inputs['Detail'].default_value = 6
    L(mp.outputs['Vector'], streak.inputs['Vector'])
    sr = N('ShaderNodeMapRange'); sr.inputs['From Min'].default_value = 0.45; sr.inputs['From Max'].default_value = 0.75
    sr.inputs['To Min'].default_value = 1.0; sr.inputs['To Max'].default_value = 1.0 - 0.28 * grime
    L(streak.outputs['Fac'], sr.inputs['Value'])
    painted = _multiply(nt, out_col, _grey(nt, sr.outputs['Result']))
    if inside:  # near-black where the surface is seen from inside (intake ducts)
        geo = N('ShaderNodeNewGeometry')
        mix = N('ShaderNodeMix'); mix.data_type = 'RGBA'
        mix.inputs['B'].default_value = kit.hexc(inside)
        L(painted, mix.inputs['A']); L(geo.outputs['Backfacing'], mix.inputs['Factor'])
        painted = mix.outputs['Result']
    L(painted, p.inputs['Base Color'])
    p.inputs['Specular IOR Level'].default_value = 0.35
    return m


def glass(name, tint='#d6e2ea', rough=0.02):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = kit.hexc(tint)
    p.inputs['Transmission Weight'].default_value = 1.0
    p.inputs['Roughness'].default_value = rough
    p.inputs['IOR'].default_value = 1.49
    p.inputs['Coat Weight'].default_value = 0.4
    return m


def backface_dark(name, front='#8d949c', back='#0b0c0e', rough=0.5, metallic=0.0):
    """Paint outside, near-black inside (intake ducts, nozzle interiors seen through an open end)."""
    m = kit.mat(name, front, metallic=metallic, rough=rough)
    nt = m.node_tree
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = kit.hexc(front); mix.inputs['B'].default_value = kit.hexc(back)
    nt.links.new(geo.outputs['Backfacing'], mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    return m


def cells_material(name, image):
    """Solar cells on a UV-mapped panel face: glassy dark cells, matte white substrate between them."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    tx = N('ShaderNodeTexImage'); tx.image = image; tx.interpolation = 'Linear'
    L(tc.outputs['UV'], tx.inputs['Vector'])
    L(tx.outputs['Color'], p.inputs['Base Color'])
    r = N('ShaderNodeMapRange'); r.inputs['To Min'].default_value = 0.65; r.inputs['To Max'].default_value = 0.08
    L(tx.outputs['Alpha'], r.inputs['Value'])
    L(r.outputs['Result'], p.inputs['Roughness'])
    c = N('ShaderNodeMath'); c.operation = 'MULTIPLY'; c.inputs[1].default_value = 0.9
    L(tx.outputs['Alpha'], c.inputs[0])
    L(c.outputs[0], p.inputs['Coat Weight'])
    p.inputs['Coat Roughness'].default_value = 0.03
    p.inputs['Specular IOR Level'].default_value = 0.6
    return m


def mli(name, kind='gold', wrinkle=1.0):
    """Multi-layer insulation: one film colour, the look comes from its creases. A network of sharp crease lines (Voronoi distance to edge)
    over broad stretched folds tilts the normal so the film breaks the light into broad facets: one continuous sheet with soft wrinkles and a few
    sharp creases; seams are taped. kind: 'gold', 'silver' or 'black'."""
    tones = {'gold': ('#a8741c', '#d9a43a', 0.75, 0.3), 'silver': ('#7e838a', '#a9aeb5', 0.7, 0.34), 'black': ('#0b0b0c', '#1b1c1e', 0.0, 0.45)}  # not full mirrors: turned from the Sun they fall to a dark tone of the film, not black
    c0, c1, metal, rough = tones[kind]
    m = kit.mat(name, c1, metallic=metal, rough=rough)
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    mp = N('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 3.0, 1.6)  # broad folds, stretched one way
    L(tc.outputs['Object'], mp.inputs['Vector'])
    fold = N('ShaderNodeTexNoise'); fold.inputs['Scale'].default_value = 1.5; fold.inputs['Detail'].default_value = 3
    L(mp.outputs['Vector'], fold.inputs['Vector'])
    crease = N('ShaderNodeTexVoronoi'); crease.feature = 'DISTANCE_TO_EDGE'; crease.inputs['Scale'].default_value = 3.8
    crease.inputs['Randomness'].default_value = 0.9
    warp = N('ShaderNodeTexNoise'); warp.inputs['Scale'].default_value = 3.0
    wmix = N('ShaderNodeMix'); wmix.data_type = 'VECTOR'; wmix.inputs['Factor'].default_value = 0.25
    L(tc.outputs['Object'], warp.inputs['Vector'])
    L(tc.outputs['Object'], wmix.inputs['A']); L(warp.outputs['Color'], wmix.inputs['B'])
    L(wmix.outputs['Result'], crease.inputs['Vector'])
    sharp = N('ShaderNodeMath'); sharp.operation = 'POWER'; sharp.inputs[1].default_value = 0.45
    L(crease.outputs['Distance'], sharp.inputs[0])
    h = N('ShaderNodeMath'); h.operation = 'MULTIPLY_ADD'; h.inputs[1].default_value = 0.4
    L(sharp.outputs[0], h.inputs[0]); L(fold.outputs['Fac'], h.inputs[2])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.4 * wrinkle; bump.inputs['Distance'].default_value = 0.05
    L(h.outputs[0], bump.inputs['Height'])
    seam = N('ShaderNodeTexWave'); seam.wave_type = 'BANDS'; seam.bands_direction = 'X'  # taped seams
    seam.inputs['Scale'].default_value = 1.2; seam.inputs['Distortion'].default_value = 0.0
    L(tc.outputs['Object'], seam.inputs['Vector'])
    seam_r = N('ShaderNodeMapRange'); seam_r.inputs['From Min'].default_value = 0.965; seam_r.inputs['From Max'].default_value = 0.985
    L(seam.outputs['Fac'], seam_r.inputs['Value'])
    tint = N('ShaderNodeMix'); tint.data_type = 'RGBA'  # a slight tone shift with the folds, not blotches
    tint.inputs['A'].default_value = kit.hexc(c0); tint.inputs['B'].default_value = kit.hexc(c1)
    tr = N('ShaderNodeMapRange'); tr.inputs['To Min'].default_value = 0.55; tr.inputs['To Max'].default_value = 1.0
    L(fold.outputs['Fac'], tr.inputs['Value']); L(tr.outputs['Result'], tint.inputs['Factor'])
    tape = N('ShaderNodeMix'); tape.data_type = 'RGBA'
    tape.inputs['B'].default_value = kit.hexc({'gold': '#c9a24e', 'silver': '#a3a8af', 'black': '#3b3d41'}[kind])
    L(tint.outputs['Result'], tape.inputs['A']); L(seam_r.outputs['Result'], tape.inputs['Factor'])
    L(tape.outputs['Result'], p.inputs['Base Color'])
    L(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def osr_radiator(name):
    """Optical solar reflector tiles: small silvered-glass mirrors in a grid."""
    m = kit.mat(name, '#d9dde3', metallic=1.0, rough=0.04)
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    tc = N('ShaderNodeTexCoord')
    br = N('ShaderNodeTexBrick'); br.offset = 0.0
    br.inputs['Scale'].default_value = 22.0; br.inputs['Mortar Size'].default_value = 0.04
    br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 1.0
    br.inputs['Color1'].default_value = kit.hexc('#dfe3e8'); br.inputs['Color2'].default_value = kit.hexc('#cfd4db')
    br.inputs['Mortar'].default_value = kit.hexc('#3c3f44')
    L(tc.outputs['Object'], br.inputs['Vector'])
    L(br.outputs['Color'], p.inputs['Base Color'])
    rr = N('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = 0.04; rr.inputs['To Max'].default_value = 0.5
    L(br.outputs['Fac'], rr.inputs['Value'])
    L(rr.outputs['Result'], p.inputs['Roughness'])
    return m
