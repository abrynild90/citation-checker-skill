# Renders one poster picture per 3D explainer with Blender Cycles (photographic Earth, lit spacecraft, glowing trails), no labels, 16:9.
#   blender -b -P tools/blender/posters.py -- [--only starfish,rpo] [--out DIR] [--samples 160] [--w 1920]
# Writes <out>/<id>.png (default tools/blender/out). Then `python3 tools/blender/finish.py` grades them and writes src/assets/posters/<id>.webp,
# which the page build embeds (gallery cards and the picture shown while a live scene loads).
# Places, heights and colours follow src/scenes/configs/*.js. Each picture is composed on screen first (Shot): the camera is set by where the
# horizon should sit, and spacecraft are placed by screen position and sized as a share of the frame, far larger than life, as in the live scenes.
import argparse
import math
import random
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import kit  # noqa: E402
import models as M  # noqa: E402
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
def starfish():
    """1962: a 1.4-megaton burst 400 km over Johnston Island at night lights up the Pacific sky; its electrons spread along the magnetic field
    lines into an artificial radiation belt, with aurora at the far end of the lines near Samoa."""
    burst = ll(16.7, -169.5, 400)
    base(ll(-3, 40), clouds=0.42)
    sh = orbit_view(-4.0, -150.0, 6500, heading=-35, horizon_sy=0.62, lens=34)
    kit.flash('burst', burst, r=0.02, strength=40, color='#fff6e0', halo='#ffcf8a')
    kit.bpy.data.objects['burst-light'].data.energy = 0.3  # light the clouds below for hundreds of kilometres
    kit.sphere('fireball', 0.05, burst, kit.glow_mat('fireball-m', '#ff9a5a', 1.0, fresnel=True, alpha=0.5, power=4.0), seg=64)
    kit.ground_disc('sky-glow', 16.7, -169.5, 9, '#ff7a4a', 1.2, 0.35, lift_km=60)
    lines = []
    for dlon in range(-24, 25, 6):
        a = math.radians(dlon - 169.5)
        for L in (1.12, 1.16, 1.2):
            lam_max = math.acos(math.sqrt(1 / L))
            pts = []
            for i in range(81):
                lam = -lam_max + 2 * lam_max * i / 80
                r = L * math.cos(lam) ** 2
                pts.append(Vector((r * math.cos(lam) * math.cos(a), r * math.cos(lam) * math.sin(a), r * math.sin(lam))))
            lines.append(pts)
    multi_curve('belt', lines, 0.0009, kit.glow_mat('belt-m', C['belt'], 1.0, alpha=0.7))
    kit.trail('thor', climb(ll(16.7, -169.5), burst, 60, 0.6), '#ffd2a0', 0.0022, 3)
    kit.ground_disc('aurora-s', -13.8, -171.8, 6, '#7dffb0', 1.4, 0.5, lift_km=90, rings=2)  # aurora seen as far as Samoa


def solwind():
    """1985: an F-15 zoom-climbs over the Pacific and fires the ASM-135, which climbs toward Solwind P78-1 at 530 km."""
    base(ll(6, -118), clouds=0.36)
    sh = orbit_view(29.5, -124.0, 750, heading=-65, horizon_sy=0.42, lens=26)
    jet = sh.above(-0.5, -0.42, 0.55)
    sat = sh.at(0.52, 0.66, 0.42)
    msl = jet.lerp(sat, 0.42)
    to_sat = (sat - jet).normalized()
    sh.place('f15', M.f15('f15'), 0, 0, 0, 0.17, to_sat, pos=jet)
    kit.plume('ab', jet - to_sat * 0.006, -to_sat, 0.008, 0.001, '#ffb36b', 0.2)
    p, body = fly('asm135', M.rocket('asm', 1.0, 0.045, bands=1), sh, 0.07, msl, to_sat, plume_len=1.5, plume_w=0.09)
    kit.trail('asm-tr', [jet.lerp(msl, t / 30) for t in range(2, 28)], '#ffe2bf', body * 0.05, 3)
    sh.place('solwind', M.sat_drum('p78'), 0, 0, 0, 0.2, enu(30, -128)[0], pos=sat)


def fengyun():
    """2007: an SC-19 from Xichang destroys Fengyun-1C at 865 km before dawn; the debris spreads along its orbit, then all the way around."""
    base(ll(-21, -150), clouds=0.3)
    hit = ll(35.5, 106.5, 865)
    Shot(ll(16, 128, 15000), ll(26, 104) * 0.55, lens=40)
    kit.trail('sc19', climb(ll(28.2, 102.0), hit, 90, 0.5), C['int'], 0.003, 5)
    kit.flash('hit', hit, r=0.012, strength=40)
    orb, near = orbit_through(865, 98.6, hit)
    kit.curve('fy-orbit', orb, 0.0012, kit.glow_mat('fy-orbit-m', C['debris'], 0.9, alpha=0.8))

    def place(i, rng):
        j = (near + int(rng.gauss(0, 1) * 45)) % len(orb)
        spread = 0.006 + abs(j - near) * 0.0003
        return orb[j] + Vector((rng.gauss(0, spread), rng.gauss(0, spread), rng.gauss(0, spread)))
    kit.debris('fy-debris', place, 2600, size=0.004, color=C['debris'], glow=3.0, seed=7)


def burnt_frost():
    """2008: at dusk over the Pacific, an SM-3 from USS Lake Erie climbs toward the failing USA-193 at about 247 km."""
    base(ll(-11, 128), clouds=0.38)
    sh = orbit_view(22.0, -171.0, 560, heading=4, horizon_sy=0.5, lens=26)
    ship = ll(29.0, -173.5, 2)
    sat = sh.at(0.3, 0.28, 0.17)
    tip_t = 0.72
    path = climb(ship, sat, 90, 0.45)
    k = int(len(path) * tip_t)
    kit.trail('sm3-tr', path[:k], '#ffe7c4', 0.0018, 5)
    tip, d = path[k], (path[k + 1] - path[k]).normalized()
    fly('sm3', M.rocket('sm3', 1.0, 0.05, bands=2), sh, 0.05, tip, d, plume_len=1.4)
    kit.flash('launch', ship, r=0.003, strength=30, halo='#ffcf8a', light=False)
    sh.place('usa193', M.sat_box('u193', (1.4, 1.0, 1.0), mli='gold', span=2.6, chord=0.9), 0, 0, 0, 0.3, heading_vec(29, -172, 40), pos=sat, roll=0.3)


def dn2():
    """2013: the DN-2 rocket from Xichang climbs past 10,000 km toward geostationary height (apogee at least 30,000 km), with no intercept."""
    base(ll(6, 50), clouds=0.34)
    sh = Shot(ll(26, 66, 30000), ll(14, 98) * 1.6, lens=28)
    kit.ring('geo', GEO, 0, 0, C['geo'], 0.012, 2.2)
    start, apo = ll(28.2, 102.0), ll(24, 98, 30000)
    path = climb(start, apo, 200, 0.5)
    k = 112
    kit.trail('dn2-tr', path[:k], '#ffd9a8', 0.02, 4)
    kit.curve('dn2-rest', path[k:], 0.006, kit.glow_mat('dn2-rest-m', C['cn'], 1.0, alpha=0.45))
    fly('dn2', M.rocket('dn2', 1.0, 0.055, bands=3), sh, 0.07, path[k], (path[k + 1] - path[k]), plume_len=1.2, light=0.2)


def shakti():
    """2019: a PDV Mk-II from Abdul Kalam Island destroys Microsat-R at about 283 km, late morning over north-east India."""
    base(ll(2, 70), clouds=0.3)
    sh = orbit_view(14.5, 88.5, 950, heading=28, horizon_sy=0.5, lens=26)
    hit = ll(26.0, 95.0, 300)
    kit.trail('pdv', climb(ll(20.76, 87.08), hit, 90, 0.5), C['ind'], 0.0026, 5)
    kit.flash('hit', hit, r=0.006, strength=32)
    kit.curve('shock', circle(hit, (hit - sh.cam.location), 0.028), 0.0009, kit.glow_mat('shock-m', '#ffe0b0', 4, alpha=0.9))
    n = enu(26, 95)[1]

    def place(i, rng):
        v = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized() * (0.004 + rng.random() ** 0.7 * 0.035)
        return hit + v + n * rng.random() * 0.03
    kit.debris('sh-debris', place, 1200, size=0.0016, color=C['debris'], glow=4, seed=3)


def cosmos1408():
    """2021: Russia's Nudol destroys Cosmos 1408 at 470 km; its debris cloud crosses the orbit of the International Space Station."""
    base(ll(-18, 5), clouds=0.36)
    sh = orbit_view(47.0, 36.0, 620, heading=32, horizon_sy=0.18, lens=24)
    orb, near = orbit_through(470, 82.6, ll(66, 52, 470))

    def place(i, rng):
        while True:
            j = (near + int(rng.gauss(0, 1) * 90)) % len(orb)
            sp = 0.004 + abs(j - near) * 0.00008
            q = orb[j] + Vector((rng.gauss(0, sp), rng.gauss(0, sp), rng.gauss(0, sp)))
            if (q - sh.cam.location).length > 0.18:
                return q
    kit.debris('c-debris', place, 3500, size=0.0016, color=C['debris'], glow=3.2, seed=11)
    kit.curve('c-orbit', orb, 0.0008, kit.glow_mat('c-orbit-m', C['ru'], 1.2, alpha=0.7))
    kit.trail('nudol', climb(ll(62.9, 40.6), orb[near], 80, 0.5), C['ru'], 0.0018, 3)
    issp = sh.at(-0.32, -0.3, 0.07)
    sh.place('iss', M.iss('iss'), 0, 0, 0, 0.42, heading_vec(47, 36, 20), pos=issp, up=issp.normalized(), roll=0.15)


def gnss():
    """Jamming satellite navigation over the Baltic: a ground jammer near Kaliningrad, one airliner losing GPS inside the zone, one fine outside it."""
    base(ll(4, -40), clouds=0.28)
    sh = orbit_view(47.0, 13.0, 1000, heading=38, horizon_sy=0.6, lens=26)
    kit.ground_disc('jam', 54.7, 20.5, 3.6, C['jam'], 1.4, 0.5, rings=4)
    kit.flash('jammer', ll(54.7, 20.5, 3), r=0.0035, strength=25, color='#ffd0d0', halo=C['jam'], light=False)
    for name, lat, lon, hdg, col, wobble in (('a1', 55.6, 18.4, 62, C['jam'], 0.0025), ('a2', 51.5, 12.5, 40, C['ok'], 0.0)):
        e, n, u = enu(lat, lon)
        f = heading_vec(lat, lon, hdg)
        p = ll(lat, lon, 25)
        _, p, s = sh.place(name, M.airliner(name), 0, 0, 0, 0.085, f, pos=p, up=u)
        step = 0.006
        kit.trail(name + '-tr', [p - f * (0.006 + step * i) + e * wobble * math.sin(i * 1.1) * (i / 8) for i in range(16)][::-1], col, 0.0012, 4)
    for k, (lat, lon) in enumerate(((66, 4), (42, 36), (71, 48))):
        beam(f'sig{k}', ll(lat, lon, 20200), ll(54.7, 20.5, 30), C['gps'], 0.0007, 1.2, alpha=0.5)


def viasat():
    """2022: at 05:00 in Ukraine a cyberattack knocks tens of thousands of KA-SAT modems offline across Europe; the satellite itself keeps working."""
    base(ll(-9, 135), clouds=0.26)
    sat_real = ll(0, 9, GEO)
    sh = Shot(sat_real + sat_real.normalized() * 1.4 + Vector((0, 0, 1.5)) + enu(0, 9)[0] * 0.7, ll(33, 16), lens=62)
    sat = sh.at(-0.56, 0.16, 0.95)
    sh.place('kasat', M.sat_box('ka', (1.4, 1.2, 1.6), span=3.2, chord=1.0, dish=False, reflectors=3), 0, 0, 0, 0.4,
             enu(0, 9)[0], pos=sat, up=(sh.cam.location - sat).normalized(), roll=0.2)  # aim across the view so the arrays can face the camera
    kit._point_light('fill', sh.cam.location.lerp(sat, 0.3) + Vector((0, 0, 0.3)), 10.0, '#dfe8ff', 0.2)  # the satellite only: the Earth is eight radii away
    rng = random.Random(5)
    ok, bad = [], []
    for _ in range(60):
        lat, lon = rng.uniform(37, 60), rng.uniform(-8, 40)
        hit = (lon > 22 and 44 < lat < 53) or rng.random() < 0.15
        (bad if hit else ok).append([sat, ll(lat, lon, 10)])
    multi_curve('beams-ok', ok, 0.0012, kit.glow_mat('bok-m', C['us'], 0.7, alpha=0.3))
    multi_curve('beams-bad', bad, 0.0012, kit.glow_mat('bbad-m', C['jam'], 0.9, alpha=0.4))

    def modem(red):
        def f(i, rng):
            if red and rng.random() < 0.65:
                return ll(rng.gauss(49, 2.2), rng.gauss(31, 4.0), 8)
            if red:
                return ll(rng.uniform(44, 56), rng.uniform(2, 22), 8)
            return ll(rng.uniform(38, 62), rng.uniform(-9, 26), 8)
        return f
    kit.debris('modem-red', modem(True), 1100, size=0.0035, color=C['jam'], glow=7, seed=2, metal_share=0)
    kit.debris('modem-ok', modem(False), 600, size=0.003, color=C['ok'], glow=4, seed=4, metal_share=0)


def laser():
    """1997: the MIRACL laser at White Sands, New Mexico, fires at the MSTI-3 test satellite at about 420 km; dusk on the ground, the satellite still in sunlight."""
    base(ll(-9, 168), clouds=0.28)
    sh = orbit_view(24.0, -116.0, 1900, heading=48, horizon_sy=0.55, lens=30)
    site = ll(32.4, -106.4, 1)
    sat = sh.at(0.28, 0.32, 0.36)
    beam('miracl', site, sat, C['laser'], 0.0012, 14)
    beam('miracl-glow', site, sat, C['laser'], 0.006, 0.8, alpha=0.5)
    kit.flash('site', site, r=0.0035, strength=25, color='#ffd6f5', halo=C['laser'], light=False)
    kit.flash('spot', sat, r=0.004, strength=18, color='#ffd6f5', halo=C['laser'], light=False)
    sh.place('msti3', M.sat_box('msti', (1, 0.8, 0.8), mli='gold', span=1.6, chord=0.6), 0, 0, 0, 0.17, heading_vec(36, -101, 100), pos=sat, roll=0.4)


def _geo_pair(names, lon, sun_side, cam_off, lens, a_xy, b_xy, d, fracs, look_lat=0.0):
    """Two satellites in the geostationary belt, seen from just outside it, the belt line and the Earth beyond, lit from one side."""
    g = ll(0, lon, GEO)
    e, n, u = enu(0, lon)
    base((e * sun_side[0] + u * sun_side[1] + n * sun_side[2]).normalized(), clouds=0.36)
    kit.ring('geo-belt', GEO, 0, 0, C['geo'], 0.01, 1.8)
    sh = Shot(g + u * cam_off[0] + e * cam_off[1] + n * cam_off[2], ll(look_lat, lon), lens=lens)
    a = sh.at(*a_xy, d)
    b = sh.at(*b_xy, d)
    sh.place(names[0], M.sat_box(names[0], (1.2, 1.0, 1.3), mli='gold', span=2.8, chord=0.9), 0, 0, 0, fracs[0], (b - a).normalized(), pos=a)
    sh.place(names[1], M.sat_box(names[1], (1.0, 0.9, 1.1), mli='silver', span=2.2, chord=0.8, reflectors=1), 0, 0, 0, fracs[1], (a - b).normalized(), pos=b)
    return sh, a, b


def sj21_tug():
    """2022: China's SJ-21 docks with the dead Compass G2 and tows it from the geostationary belt to a graveyard orbit about 3,000 km higher."""
    sh, a, b = _geo_pair(('sj21', 'g2'), 105, (-1.0, 0.45, 0.3), (1.6, 0.9, 0.55), 55, (-0.3, 0.14), (0.04, 0.18), 0.9, (0.28, 0.24))
    u = enu(0, 105)[2]
    e = enu(0, 105)[0]
    kit.curve('tow', [b + e * (0.03 + 0.012 * t) + u * 0.0006 * t * t for t in range(40)], 0.0018, kit.glow_mat('tow-m', C['cn'], 2.5, alpha=0.9))


def rpo():
    """2025: SJ-21 and SJ-25 appear to dock in the geostationary belt (one of three close approaches in this explainer)."""
    sh, a, b = _geo_pair(('sj25', 'sj21b'), 95.3, (1.0, 0.25, 0.35), (1.4, -0.6, 0.35), 60, (-0.1, 0.06), (0.18, 0.01), 0.8, (0.3, 0.25))
    for k in range(1, 8):
        kit.sphere(f'dot{k}', 0.0025, a.lerp(b, k / 8), kit.glow_mat(f'dot{k}-m', C['geo'], 5))


def spaceplanes():
    """2010-2026: the US X-37B on its long missions; OTV-7 flew a high, tilted orbit (323 to 38,838 km, 59.1 degrees)."""
    base(ll(16, -18), clouds=0.38)
    sh = orbit_view(22.0, -42.0, 520, heading=95, horizon_sy=0.2, lens=26)
    p = sh.at(0.05, 0.22, 0.11)
    fwd = heading_vec(22, -40, 235)
    sh.place('x37b', M.x37b('x37b'), 0, 0, 0, 0.4, fwd, pos=p, up=p.normalized(), roll=-0.35)
    axis = p.cross(fwd).normalized()
    from mathutils import Matrix
    pts = [Matrix.Rotation(math.radians(-a / 2), 3, axis) @ p * (1 + a ** 2 * 0.00012) for a in range(3, 160)]
    kit.curve('otv7', pts, 0.0012, kit.glow_mat('otv7-m', C['us'], 2.0, alpha=0.85))


SCENES = {
    'starfish': starfish, 'solwind': solwind, 'fengyun': fengyun, 'burnt-frost': burnt_frost, 'dn2': dn2, 'shakti': shakti,
    'cosmos1408': cosmos1408, 'gnss': gnss, 'viasat': viasat, 'laser': laser, 'sj21-tug': sj21_tug, 'rpo': rpo, 'spaceplanes': spaceplanes,
}


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--out', default=str(HERE / 'out'))
    ap.add_argument('--samples', type=int, default=160)
    ap.add_argument('--w', type=int, default=1920)
    a = ap.parse_args(argv)
    ids = a.only.split(',') if a.only else list(SCENES)
    unknown = [i for i in ids if i not in SCENES]
    if unknown:
        raise SystemExit(f'unknown scene ids: {unknown}; known: {list(SCENES)}')
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for sid in ids:
        t = time.time()
        kit.reset((a.w, round(a.w * 9 / 16)), a.samples)
        M.reset_materials()
        SCENES[sid]()
        kit.render(out / f'{sid}.png')
        print(f'POSTER {sid} {time.time() - t:.1f}s', flush=True)


if __name__ == '__main__':
    main()
