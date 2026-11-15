# Composition helpers shared by the poster scenes (scenes_*.py): the screen-space camera (Shot, orbit_view), geography helpers,
# curves and launch paths, the common Earth-and-Sun setup (base) and small effects. Each picture is composed on screen first: the camera is
# set by where the horizon should sit, and models are placed by screen position and sized as a share of the frame.
import math
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import kit  # noqa: E402
import models as M  # noqa: E402
from airliner import airliner  # noqa: E402
import sats  # noqa: E402
from f15 import f15  # noqa: E402
from x37b import x37b  # noqa: E402
from kit import bpy, ll, Vector  # noqa: E402

C = dict(us='#56B4E9', ru='#FF8C5A', cn='#F0C24B', int='#ff6b6b', debris='#ffb38a', iss='#8cc8ff', gps='#9be7c4',
         jam='#ff5d5d', ok='#6ee7a8', laser='#ff4fd8', geo='#ffcf6e', belt='#b28cff', ind='#ff9933')
GEO = 35786
SUN = [Vector((1, 0, 0))]  # the current scene's sun direction (set by base())


def aspect():
    r = bpy.context.scene.render
    return r.resolution_y / r.resolution_x


def enu(lat, lon):
    u = ll(lat, lon).normalized()
    e = Vector((0, 0, 1)).cross(u).normalized()
    return e, u.cross(e), u


def heading_vec(lat, lon, deg):
    e, n, _ = enu(lat, lon)
    return n * math.cos(math.radians(deg)) + e * math.sin(math.radians(deg))


class Shot:
    """A camera plus screen-space placement: at(sx, sy, d) is the point at screen position (sx, sy in -1..1, y up) and depth d."""

    def __init__(self, loc, target, lens=35, up=(0, 0, 1)):
        self.cam = kit.camera(loc, target, lens=lens, up=up)
        bpy.context.view_layer.update()
        self.tx = 18 / lens
        self.ty = self.tx * aspect()

    def ray(self, sx, sy):
        return (self.cam.matrix_world.to_3x3() @ Vector((sx * self.tx, sy * self.ty, -1))).normalized()

    def at(self, sx, sy, d):
        return self.cam.location + self.ray(sx, sy) * d

    def ground(self, sx, sy, r=1.0):
        """Distance along the ray to the sphere of radius r (None if it misses)."""
        o, v = self.cam.location, self.ray(sx, sy)
        b = o.dot(v)
        disc = b * b - (o.dot(o) - r * r)
        if disc < 0:
            return None
        t = -b - math.sqrt(disc)
        return t if t > 0 else None

    def above(self, sx, sy, f=0.5, fallback=0.3):
        """A point on the ray a share `f` of the way to the ground (or `fallback` away when the ray misses the Earth)."""
        g = self.ground(sx, sy)
        return self.at(sx, sy, g * f if g else fallback)

    def width_at(self, d):
        return 2 * d * self.tx

    def place(self, name, parts, sx, sy, d, frac, aim, up=None, roll=0.0, pos=None):
        """Put a model at screen (sx, sy) and depth d (or world `pos`), its largest side `frac` of the frame width there."""
        p = pos if pos is not None else self.at(sx, sy, d)
        dist = (p - self.cam.location).length
        scale = frac * self.width_at(dist) / model_size(parts)
        if up is None:  # turn the model's top (and a satellite's arrays) toward the camera and the Sun
            up = ((self.cam.location - p).normalized() + SUN[0] * 0.7).normalized()
        return kit.group(name, parts, loc=p, scale=scale, aim=aim, up=up, roll=roll), p, scale


def orbit_view(lat, lon, alt, heading, horizon_sy=0.45, lens=28, side=0.0):
    """A camera above (lat, lon) facing `heading` (degrees from north), pitched so the Earth's limb sits at screen height `horizon_sy`."""
    c = ll(lat, lon, alt)
    _, _, u = enu(lat, lon)
    h = heading_vec(lat, lon, heading)
    dip = math.acos(1 / c.length)
    ty = (18 / lens) * aspect()
    pitch = dip + math.atan(horizon_sy * ty)
    look = h * math.cos(pitch) - u * math.sin(pitch)
    look = (look + h.cross(u) * side).normalized()
    return Shot(c, c + look, lens, up=u)


def model_size(parts):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for ob in parts:
        if ob.type != 'MESH':
            continue
        mb = ob.matrix_basis
        for v in ob.data.vertices:
            w = mb @ v.co
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return max(hi - lo)


def multi_curve(name, splines, radius, material):
    """Many polylines in one curve object (field lines, beams)."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 2
    for pts in splines:
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (*p, 1)
    cu.materials.append(material)
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.visible_shadow = False
    return ob


def circle(centre, normal, r, n=120):
    nrm = Vector(normal).normalized()
    a = nrm.orthogonal().normalized()
    b = nrm.cross(a)
    return [Vector(centre) + (a * math.cos(t) + b * math.sin(t)) * r for t in (2 * math.pi * i / n for i in range(n + 1))]


def nearest(points, target):
    return min(range(len(points)), key=lambda i: (points[i] - target).length)


def orbit_through(alt, inc, target):
    """The circular orbit (given height and tilt) whose plane passes closest to `target`, and the index of its closest point."""
    raan = min(range(0, 360, 2), key=lambda ra: min((p - target).length for p in kit.orbit_points(alt, inc, ra, 180)))
    pts = kit.orbit_points(alt, inc, raan, 720)
    return pts, nearest(pts, target)


def bezier(a, ctrl, b, n=80):
    a, ctrl, b = Vector(a), Vector(ctrl), Vector(b)
    return [a * (1 - t) ** 2 + ctrl * 2 * t * (1 - t) + b * t * t for t in (i / n for i in range(n + 1))]


def climb(site, end, n=80, bow=0.35):
    """A launch path: leaves the ground nearly vertically, then bends toward `end`."""
    site, end = Vector(site), Vector(end)
    up = site.normalized()
    ctrl = site + up * ((end - site).length * bow)
    return bezier(site, ctrl, end, n)


def base(sun_dir, clouds=0.32, night=6.0, stars=1.0):
    kit.world_stars(strength=stars)
    s = kit.sun(sun_dir, strength=6.0)
    SUN[0] = s
    kit.earth(s, clouds=clouds, night_strength=night)
    return s


def belt_shell(L, color, strength=0.7):
    """A dipole radiation belt as a translucent surface of revolution r = L cos^2(lat), brightest where seen edge-on."""
    lam_max = math.acos(math.sqrt(1 / L))
    rows, cols = 48, 144
    V, F = [], []
    for i in range(rows + 1):
        lam = -lam_max + 2 * lam_max * i / rows
        r = L * math.cos(lam) ** 2
        for j in range(cols):
            a = 2 * math.pi * j / cols
            V.append((r * math.cos(lam) * math.cos(a), r * math.cos(lam) * math.sin(a), r * math.sin(lam)))
    for i in range(rows):
        for j in range(cols):
            k = i * cols + j
            F.append((k, i * cols + (j + 1) % cols, (i + 1) * cols + (j + 1) % cols, (i + 1) * cols + j))
    m = kit.bpy.data.materials.new('belt-shell')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, Lk = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')
    lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.5
    pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 5.0
    Lk(lw.outputs['Facing'], pw.inputs[0])
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = kit.hexc(color); em.inputs['Strength'].default_value = strength
    tr = N('ShaderNodeBsdfTransparent')
    k = N('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = 0.32
    Lk(pw.outputs[0], k.inputs[0])
    mix = N('ShaderNodeMixShader')
    Lk(k.outputs[0], mix.inputs['Fac']); Lk(tr.outputs[0], mix.inputs[1]); Lk(em.outputs[0], mix.inputs[2])
    Lk(mix.outputs[0], out.inputs['Surface'])
    ob = kit.mesh('belt', V, F, m, smooth=True)
    ob.visible_shadow = False
    return ob


def beam(name, a, b, color, r=0.004, strength=10, alpha=1.0):
    return kit.curve(name, [Vector(a), Vector(b)], r, kit.glow_mat(name + '-m', color, strength, fresnel=True, alpha=alpha, power=1.2))


def fly(name, parts, shot, frac, pos, aim, plume_len=1.6, plume_w=0.07, color='#ffc27a', up=None, light=1.0):
    """A rocket at `pos` aimed along `aim`, with its exhaust plume behind it (lengths in body lengths)."""
    root, p, s = shot.place(name, parts, 0, 0, 0, frac, aim, up=up, pos=pos)
    body = model_size(parts) * s
    d = Vector(aim).normalized()
    kit.plume(name + '-pl', p - d * body * 0.46, -d, body * plume_len, body * plume_w, color, light)
    return p, body


# ---------------------------------------------------------------- scenes
