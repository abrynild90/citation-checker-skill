# Poster scenes: Cosmos 1408, GNSS jamming, MIRACL and the spaceplanes: close views in low orbit.
# Each function builds one picture with the helpers in compose.py; posters.py renders them.
from compose import *  # noqa: F401,F403
from leo_fx import dim, dome, fill, matte, stream, sun_from, wreckage
from leo_gps import gps
from mathutils import Matrix


def cosmos1408():
    """2021: Russia's Nudol destroys Cosmos 1408 at 470 km; its debris stream crosses the orbit of the International Space Station."""
    sh = orbit_view(46.0, 28.0, 620, heading=40, horizon_sy=-0.25, lens=24)
    m = sh.cam.matrix_world.to_3x3()
    base(sun_from(sh, -0.8, 0.35, 0.45), clouds=0.4)
    parts = sats.iss('iss')
    dim(parts, 0.62)
    matte(sats.mats()['cells_iss'], 0.0, 0.5)
    dim([o for o in parts if 'arr' in o.name and 'arrb' not in o.name], 2.4)  # the cell faces keep their tone beside the dimmed white backs
    sh.place('iss', parts, 0, 0, 0, 0.34, m @ Vector((0.5, 0.0, -0.9)), up=m @ Vector((0.0, 0.75, 0.65)), pos=sh.at(-0.25, -0.15, 0.16))
    path = bezier(sh.at(0.95, 0.8, 0.42), sh.at(0.1, 0.72, 0.9), sh.at(-0.95, 0.45, 2.4), 120)  # near end first: a band from the upper right across the top, clear above the station (it crossed the station's orbit, not the station)
    stream('c-sparks', path, 13000, 0.025, 0.0011, depth_exp=0.0, grow=0.0, glint=0.1)
    stream('c-shards', path, 60, 0.025, 0.005, seed=8, depth_exp=0.0, grow=0.0, glint=0.3)
    spots = [(path[int(t * 119)] + m @ Vector((dx, dy, 0)), s) for t, dx, dy, s in
             ((0.1, -0.012, -0.015, 0.02), (0.17, 0.014, 0.012, 0.026), (0.24, -0.015, 0.014, 0.022),
              (0.31, 0.012, -0.015, 0.028), (0.38, -0.01, 0.015, 0.024), (0.45, 0.014, -0.012, 0.03))]
    big = wreckage('c-big', spots)
    kit.curve('c-orbit', path, 0.00006, kit.glow_mat('c-orbit-m', C['ru'], 2.0, alpha=0.3))
    fill('c-rim', parts + big, sun_from(sh, 0.7, 0.3, -0.7), 0.8, (0.75, 0.85, 1.0))
    fill('c-earthshine', parts + big, sun_from(sh, 0.0, -1.0, 0.2), 0.6, (0.55, 0.7, 1.0))
    fill('c-key', big, sun_from(sh, -0.8, 0.35, 0.45), 2.0, (1.0, 0.95, 0.9))


def gnss():
    """Jamming satellite navigation over the Baltic: a ground jammer near Kaliningrad, one airliner losing GPS inside the zone, one fine outside it."""
    sh = orbit_view(48.0, 14.0, 700, heading=12, horizon_sy=0.55, lens=28)
    m = sh.cam.matrix_world.to_3x3()
    base(ll(-5, -57), clouds=0.28, night=10.0)
    kit.ground_disc('jam-wash', 54.7, 20.5, 1.7, '#c04a42', strength=0.6, alpha=0.22, lift_km=3)
    dome('jam-hint', 54.7, 20.5, 0.016, 0.02, '#a84640', shells=1, strength=1.0, alpha=0.1)
    plane = sh.at(-0.42, -0.1, 0.08)
    fwd = m @ Vector((0.85, -0.2, -0.5))
    liner = airliner('a1')
    dim(liner, 0.85)
    sh.place('a1', liner, 0, 0, 0, 0.42, fwd, up=m @ Vector((0.0, 0.8, 0.6)), pos=plane, roll=0.45)
    kit.trail('a1-track', [plane - fwd.normalized() * (0.01 + 0.007 * i) + m @ Vector((0, 0.002 * math.sin(i * 1.3) * i / 10, 0)) for i in range(10)][::-1], C['jam'], 0.0003, 3)
    far_pos = sh.above(-0.02, 0.3, 0.6)
    far = airliner('a2')
    dim(far, 0.62)
    sh.place('a2', far, 0, 0, 0, 0.1, m @ Vector((0.8, -0.1, -0.5)), up=far_pos.normalized(), pos=far_pos)
    kit.trail('a2-track', [far_pos - m @ Vector((0.8, -0.1, -0.5)).normalized() * (0.004 + 0.003 * i) for i in range(8)][::-1], C['ok'], 0.0003, 4)
    sats_up = []
    for k, (sx, sy, d, frac, tilt) in enumerate(((-0.62, 0.76, 1.3, 0.055, 0.35), (-0.3, 0.6, 1.9, 0.045, -0.5))):
        p = sh.at(sx, sy, d)
        g = gps(f'gps{k}')
        sh.place(f'gps{k}', g, 0, 0, 0, frac, m @ Vector((0, 1, 0)), up=(sh.cam.location - p).normalized() - p.normalized() * 0.25, pos=p, roll=tilt)
        sats_up.append((p, g))
    cells = [o for _, g in sats_up for o in g if o.active_material and o.active_material.name.startswith('cells')]
    matte(sats.mats()['cells'], 0.0, 0.4, 0.1)
    dim(cells, 2.2)
    sig = lambda name, a, b, r, taper: kit.curve(name, [a.lerp(b, i / 30) for i in range(31)], r, kit.glow_mat(name + '-m', C['gps'], 2.0, fresnel=True, alpha=0.7, power=1.0), taper=taper, resolution=3)
    lost = lambda p: p.lerp(plane, 0.8)  # the signals to the airliner inside the zone stop short of it: a visible break, no reception
    sig('sig-a', sats_up[0][0], lost(sats_up[0][0]), 0.0022, (1.0, 0.3))
    sig('sig-b', sats_up[1][0], lost(sats_up[1][0]), 0.0028, (1.0, 0.3))
    sig('sig-c', sats_up[1][0], far_pos, 0.0028, (1.0, 0.1))
    fill('a-key', liner, sun_from(sh, -0.9, 0.4, -0.1), 4.2, (1.0, 0.72, 0.5))
    fill('a-cool', liner, sun_from(sh, 0.6, 0.5, 0.6), 1.0, (0.55, 0.7, 1.0))
    fill('a2-key', far, sun_from(sh, -0.6, 0.7, 0.5), 2.5, (1.0, 0.7, 0.5))
    for k, (p, g) in enumerate(sats_up):
        fill(f'g{k}-key', g, sun_from(sh, -0.9, 0.5, 0.2), 3.0, (1.0, 0.85, 0.7))


def laser():
    """1997: the MIRACL laser at White Sands, New Mexico, fires at the MSTI-3 test satellite at about 420 km; dusk over the south-west, night beyond."""
    sh = orbit_view(32.0, -97.0, 700, heading=265, horizon_sy=0.35, lens=28)
    m = sh.cam.matrix_world.to_3x3()
    base(ll(-9, 158), clouds=0.28, night=9.0)
    site = ll(32.4, -106.4, 1)
    sat = sh.at(0.12, 0.4, 0.15)
    to_site, to_cam = (site - sat).normalized(), (sh.cam.location - sat).normalized()
    root, p, _ = sh.place('msti3', sats.msti('msti'), 0, 0, 0, 0.36, m @ Vector((-0.3, 1.0, 0.0)), up=to_site * 0.7 + to_cam * 0.55, pos=sat)
    parts = list(root.children)
    matte(sats.mats()['gold'], 0.55, 0.4)
    matte(sats.mats()['black'], 0.0, 0.5)
    bpy.context.view_layer.update()
    aim = root.matrix_world.translation
    # one muted, dashed sightline from the ground site up toward the satellite, thinning upward and stopping short of it: the beam is sourced,
    # its effect on MSTI-3 is not public, so nothing glows at the satellite end and nothing flares at the site
    dashes = [[site.lerp(aim, (k + j * 0.18) / 16 * 0.66) for j in range(4)] for k in range(16)]
    beam = multi_curve('miracl', dashes, 0.0006, kit.glow_mat('miracl-m', C['laser'], 1.2, alpha=0.7))
    for k, sp in enumerate(beam.data.splines):  # wide at the ground, thin toward the satellite: the beam goes up
        for pt in sp.points:
            pt.radius = 1.5 - 0.9 * k / 15
    up_beam = (aim - site).normalized()
    tip = kit.cyl('miracl-head', 0.0022, 0.0065, material=kit.glow_mat('miracl-head-m', C['laser'], 1.2, alpha=0.8), r2=0.0001, verts=16)
    tip.location = site.lerp(aim, 0.66) + up_beam * 0.003
    tip.rotation_euler = up_beam.to_track_quat('Z', 'Y').to_euler()
    tip.visible_shadow = False
    kit.curve('site', circle(ll(32.4, -106.4, 5), site.normalized(), 0.003), 0.0004, kit.glow_mat('site-m', C['laser'], 1.2, alpha=0.8))  # a hollow marker
    fill('m-key', parts, sun_from(sh, -0.6, 0.6, 0.5), 8.0, (1.0, 0.92, 0.82))
    fill('m-front', parts, sun_from(sh, 0.3, 0.2, 1.0), 3.0, (1.0, 0.9, 0.8))
    fill('m-rim', parts, sun_from(sh, 0.8, 0.2, -0.5), 1.2, (0.7, 0.8, 1.0))


def spaceplanes():
    """2010-2026: the US X-37B on its long missions (OTV-7 flew a high, tilted orbit, 323 to 38,838 km at 59.1 degrees) and, far behind on its own
    orbit, China's experimental craft as a point of light: its shape is not sourced, so it gets no model."""
    sh = orbit_view(26.0, -88.0, 520, heading=70, horizon_sy=-0.05, lens=26)
    m = sh.cam.matrix_world.to_3x3()
    base(sun_from(sh, -0.7, 0.5, 0.55), clouds=0.55)

    def spaceplane(name, p, fwd, frac, up, bay_open, roll=0.0):
        parts = x37b(name, bay_open=bay_open)
        dim(parts, 0.66)
        matte(sats.mats()['osr'], 0.4, 0.35)
        matte(sats.mats()['cells'], 0.0, 0.35, 0.1)
        dim([o for o in parts if o.name.endswith('-array')], 6.0)
        sh.place(name, parts, 0, 0, 0, frac, fwd, up=up, pos=p, roll=roll)
        return parts

    def orbit_line(name, pts, color):
        kit.curve(name + '-orbit', pts, 0.00006, kit.glow_mat(name + '-orbit-m', color, 6.0, alpha=0.9))
    parts = spaceplane('x37b', sh.at(-0.1, 0.24, 0.09), m @ Vector((0.7, -0.3, 0.65)), 0.56, m @ Vector((0.0, 0.7, 0.7)), True, roll=0.3)
    far_pos, far_fwd = sh.at(0.7, 0.1, 0.8), m @ Vector((-0.7, 0.1, -0.7))
    kit.sphere('cn', 0.003, far_pos, kit.glow_mat('cn-m', C['cn'], 10))
    orbit_line('x37b', bezier(sh.at(-1.0, 0.12, 0.7), sh.at(-0.1, 0.5, 1.5), sh.at(1.0, 0.3, 2.6), 100), C['us'])  # one smooth arc passing behind the craft and receding
    axis = far_pos.cross(far_fwd).normalized()
    orbit_line('cn', [Matrix.Rotation(math.radians(a), 3, axis) @ far_pos for a in range(-30, 46)], C['cn'])
    fill('x-key', parts, sun_from(sh, -0.9, 0.5, 0.3), 1.2)
    fill('x-fill', parts, sun_from(sh, 0.8, -0.4, 0.5), 0.5, (0.6, 0.72, 1.0))
