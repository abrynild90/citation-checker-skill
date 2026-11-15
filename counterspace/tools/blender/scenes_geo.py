# Poster scenes: Viasat KA-SAT, SJ-21 and the close approaches: the geostationary belt.
# Each function builds one picture with the helpers in compose.py; posters.py renders them.
from compose import *  # noqa: F401,F403
import geo_sats


def _cone(name, apex, foot, r, color, strength, alpha):
    """A soft translucent spot beam from `apex` widening to radius `r` at `foot`, brightest along its rim and fading toward the ground."""
    d = Vector(apex) - Vector(foot)
    ob = kit.cyl(name, r, d.length, material=geo_sats.beam_mat(name + '-m', color, strength, alpha), r2=0.003, verts=48)
    ob.location = (Vector(apex) + Vector(foot)) / 2
    ob.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    ob.visible_shadow = False
    return ob


def viasat():
    """2022: at 05:00 in Ukraine a cyberattack knocks tens of thousands of KA-SAT modems offline across Europe; the satellite itself keeps working."""
    sun = base(ll(-9, 135), clouds=0.26, night=12.0)
    geo_sats.coast_glow(sun, 0.9)
    e, n, u = enu(0, 9)
    g = ll(0, 9, GEO)
    cam = g + e * 1.4 + n * 5.5 + u * 0.3  # on the Sun's side and above the equator, so Europe is seen from nearer overhead
    sh = geo_sats.aimed(cam, ll(47, 22), 0.2, 0.1, 72, n * math.cos(math.radians(30)) + e * math.sin(math.radians(30)))
    sat = sh.at(-0.5, -0.05, 2.5)
    down = (-g).normalized()
    tilt = geo_sats.face_light(sun, (sh.cam.location - sat).normalized(), e, down, lean=1.3)
    root = geo_sats.put(sh, 'kasat', geo_sats.ka_sat(tilt=tilt), sat, geo_sats.KA_SPAN, 0.6, e, down)
    geo_sats.fill_light('earthshine', sat + (sh.cam.location - sat).normalized() * 2.2 + n * 1.0, sat, [root], 500.0, 3.0, (0.7, 0.82, 1.0))
    rng = random.Random(5)
    # spot-beam footprints on a staggered grid over Europe: blue-white where the network is up, red over Ukraine and its neighbours, a few flickering out
    for row, lat in enumerate(range(38, 62, 4)):
        for lon in range(-8 + 3 * (row % 2), 42, 6):
            down_here = lon > 20 and 43 < lat < 55
            if down_here and rng.random() < 0.2:
                continue
            kit.ground_disc(f'fp{lat}-{lon}', lat, lon, 3.0, C['jam'] if down_here else C['us'], 1.6 if down_here else 1.0, 0.45 if down_here else 0.3)
    for k, (lat, lon) in enumerate(((54, 12), (50, 2), (46, 12), (42, 4), (57, 22), (40, 18))):
        _cone(f'beam-ok{k}', sat, ll(lat, lon, 10), 0.075, C['us'], 2.0, 0.2)
    for k, (lat, lon) in enumerate(((51, 33), (47, 30), (49, 38))):
        _cone(f'beam-bad{k}', sat, ll(lat, lon, 10), 0.075, C['jam'], 2.6, 0.26)

    def modem(red):
        def f(i, rng):
            if red:
                return ll(rng.gauss(49, 2.2), rng.gauss(31, 4.0), 8)
            return ll(rng.uniform(38, 60), rng.uniform(-9, 24), 8)
        return f
    kit.ring('geo-belt', GEO, 0, 0, C['geo'], 0.0012, 0.9, a0=-30, a1=50)
    kit.debris('modem-red', modem(True), 900, size=0.0035, color=C['jam'], glow=7, seed=2, metal_share=0)
    kit.debris('modem-ok', modem(False), 900, size=0.003, color='#bfe3ff', glow=5, seed=4, metal_share=0)


def _frame(sh, z):
    """A model frame with Z along `z` and X toward the camera, so the wings can be turned to face the Sun and the lens. Returns (X, Z)."""
    back, z = sh.cam.matrix_world.to_3x3().col[2], z.normalized()
    return (back - z * back.dot(z)).normalized(), z


def _tow_path(lon, lift_km, span_deg, dashes=70, radius=0.0016):
    """The tow from the belt to the graveyard orbit: a hair-thin dashed arc leaving the belt westward (a higher orbit is slower) and rising."""
    segs = []
    for k in range(dashes):
        pts = []
        for j in range(4):
            t = (k + j * 0.22) / dashes
            alt = GEO + lift_km * (3 * t * t - 2 * t ** 3)
            pts.append(ll(0, lon - span_deg * t, alt))
        segs.append(pts)
    return multi_curve('tow-path', segs, radius, kit.glow_mat('tow-m', C['cn'], 5.0))


def sj21_tug():
    """2022: China's SJ-21 docks with the dead Compass G2 and tows it from the geostationary belt to a graveyard orbit about 3,000 km higher."""
    lon = 105
    e, n, u = enu(0, lon)
    g = ll(0, lon, GEO)
    cam = g + u * 2.4 - n * 1.5
    sh = geo_sats.aimed(cam, g, -0.15, 0.3, 34, n * math.cos(math.radians(55)) + e * math.sin(math.radians(55)))
    right, up, back = (sh.cam.matrix_world.to_3x3().col[i] for i in range(3))
    sun = base((right * 0.85 + up * 0.2 + back * 0.45).normalized(), clouds=0.3, night=8.0)  # from the right and a little behind the lens
    kit.ring('geo-belt', GEO, 0, 0, C['geo'], 0.0012, 0.9, a0=lon - 35, a1=lon + 35)
    _tow_path(lon - 4, 3000, 5)  # starts just ahead of Compass G2
    kit.ring('graveyard', GEO + 3000, 0, 0, C['cn'], 0.0008, 0.8, a0=lon - 13, a1=lon - 9)  # the higher orbit the tow ends on, a short faint line
    x, z = _frame(sh, -e - sh.cam.matrix_world.to_3x3().col[2] * 0.3)  # the pair turned a little toward the lens, SJ-21 nearest
    y = z.cross(x)
    ang = math.radians(25)  # SJ-21 rolled against G2, so their wings cross
    x_sj = x * math.cos(ang) + y * math.sin(ang)
    to_cam = (cam - g).normalized()
    z_g2 = 3.975  # G2's centre along the pair axis, with the probe seated in its engine nozzle
    arms = [[(s * 0.7, 0, 1.06), (s * 1.25, 0, 1.75), (s * 0.75, 0, 2.62)] for s in (1, -1)]
    g2 = kit.group('g2', geo_sats.compass_g2(tilt=geo_sats.face_light(sun, to_cam, x, z), droop=0.3, kink=0.5), loc=(0, 0, z_g2))
    sj = kit.group('sj21', geo_sats.sj21(tilt=geo_sats.face_light(sun, to_cam, x_sj, z), probe=1.4))
    sj.rotation_euler = (0, 0, ang)
    parts = [g2, sj] + [p for k, a in enumerate(arms) for p in geo_sats.robot_arm(f'arm{k}', a, (0, 1, 0))]
    parts += geo_sats.soft_plume('thrust', (0, 0, -1.65), (0, 0, -1), 1.5, 0.3, '#9fbcff')
    pair = geo_sats.put(sh, 'tug', parts, g, geo_sats.G2_SPAN, 0.56, x, z, mid=(0, 0, 1.6))
    geo_sats.fill_light('earthshine', g + to_cam * 2.0 + n * 0.6, g, [pair], 90.0, 3.0, (0.7, 0.82, 1.0))
    _glints(lon, (-9, 7, 13, 21))


def _glints(lon, offsets):
    """A few other geostationary satellites as tiny points of light on the belt line."""
    for k, d in enumerate(offsets):
        kit.sphere(f'glint{k}', 0.005, ll(0, lon + d, GEO), kit.glow_mat(f'glint{k}-m', '#ffe6b0', 16))


def rpo():
    """2025: SJ-21 and SJ-25 appear to dock in the geostationary belt (one of three close approaches in this explainer). The last metres of the
    approach, the probe reaching for the funnel, are centred in a three-quarter view; the Earth, a day-lit globe about 17 degrees across as seen
    from the belt, is the backdrop at lower left."""
    lon = 95.3
    e, n, u = enu(0, lon)
    g = ll(0, lon, GEO)
    gap = g + n * 0.35  # the pair sits a little north of the belt, so the belt line passes below the buses
    cam = g + u * 3.34 - e * 0.92 - n * 0.06  # 10 Earth radii out: through the 50 mm lens the Earth fills half the frame height, close to the 17 degrees it spans from the belt
    sh = geo_sats.aimed(cam, gap, 0, 0.1, 50, n)
    right, up, back = (sh.cam.matrix_world.to_3x3().col[i] for i in range(3))
    sun = base((-right * 0.65 + up * 0.45 + back * 0.6).normalized(), clouds=0.34, night=8.0)  # a strong key from the upper left and the lens side
    bpy.context.scene.view_settings.exposure = -0.4
    kit.ring('geo-belt', GEO, 0, 0, C['geo'], 0.0012, 0.9, a0=lon - 35, a1=lon + 35)
    x, z = _frame(sh, right * math.cos(math.radians(30)) - back * math.sin(math.radians(30)))  # the pair axis turned away from the lens, SJ-21 farther
    y = z.cross(x)
    x = x * math.cos(math.radians(40)) - y * math.sin(math.radians(40))  # and seen from above, which also foreshortens the tall wings
    y = z.cross(x)
    to_cam = (cam - gap).normalized()
    roll_a, roll_b = math.radians(-15), 0.0  # the two wing sets lean differently
    x_a, x_b = x * math.cos(roll_a) + y * math.sin(roll_a), x * math.cos(roll_b) + y * math.sin(roll_b)
    z_b = 6.4  # SJ-21's centre; its funnel faces back along the axis, a metre beyond the probe tip
    a = kit.group('sj25', geo_sats.sj25(tilt=geo_sats.face_light(sun, to_cam, x_a, z, 0.5)))
    a.rotation_euler = (0, 0, roll_a)
    flip = kit.group('sj21', geo_sats.sj21(tilt=geo_sats.face_light(sun, to_cam, x_b, -z, 0.25), panels=2), loc=(0, 0, z_b))
    flip.rotation_euler = (math.pi, 0, roll_b)  # turned end for end: +Z toward SJ-25
    pair = geo_sats.put(sh, 'rpo', [a, flip], gap, 9.7, 0.58, x, z, mid=(0, 0, 4.8))  # the gap between probe tip and funnel is at `gap`, a little above the frame centre
    geo_sats.fill_light('fill', gap + to_cam * 1.2 + right * 1.5, gap, [pair], 150.0, 3.0, (0.7, 0.82, 1.0))  # cool fill from the shaded side
    geo_sats.fill_light('earthshine', gap - up * 2.5 - right * 1.5, gap, [pair], 160.0, 4.0, (0.55, 0.72, 1.0))  # light off the Earth, a rim from below-left
    for k, d in enumerate((3.5, 6.5, 9.0)):  # a few other geostationary satellites on the belt line, to the right where the sky is black
        kit.sphere(f'glint{k}', 0.0045, ll(0, lon + d, GEO), kit.glow_mat(f'glint{k}-m', '#ffe6b0', 16))
