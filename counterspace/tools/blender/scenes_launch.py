# Poster scenes: Solwind, Burnt Frost and DN-2: the F-15, rockets and their targets.
# Each function builds one picture with the helpers in compose.py; posters.py renders them.
from bpy_extras.object_utils import world_to_camera_view
from compose import *  # noqa: F401,F403
import launch_fx as fx
import launch_ship as ship_model


def solwind():
    """1985: an F-15 zoom-climbs over the Pacific and fires the ASM-135, which climbs toward Solwind P78-1 at 530 km."""
    sh = orbit_view(31.0, -130.0, 750, heading=20, horizon_sy=-0.05, lens=26)
    base(ll(33, -122), clouds=0.4)  # midday: the Sun high behind the camera, so the sea and cloud below are in daylight
    jet = sh.above(-0.4, -0.42, 0.2)
    sat = sh.at(0.16, 0.5, 0.24)  # drawn nearer than 530 km so the missile is not foreshortened
    to_sat = (sat - jet).normalized()
    msl = jet.lerp(sat, 0.45)
    to_cam = (sh.cam.location - jet).normalized()
    plane, _, _ = sh.place('f15', f15('f15'), 0, 0, 0, 0.44, to_sat, pos=jet, up=(jet.normalized() * 0.4 + to_cam * 0.6).normalized(), roll=0.3)
    rocket, body = fly('asm135', M.asm135('asm'), sh, 0.2, msl, to_sat, plume_len=1.3, plume_w=0.04)
    path = [jet.lerp(msl - to_sat * body * 1.0, t / 30) for t in range(3, 31)]
    fx.smoke('asm-smoke', path, body * 0.06, body * 0.008, alpha=0.22)  # fat where the smoke is old, thin behind the missile
    kit.trail('asm-tr', path, '#ffe2bf', body * 0.02, 3)
    solwind_sat, _, _ = sh.place('solwind', sats.p78('p78'), 0, 0, 0, 0.22, enu(30, -128)[0], pos=sat)
    lit = [plane, solwind_sat, bpy.data.objects['asm135']]
    fx.fill('fill', lit, -jet, 2.0)  # the cool bounce from the ocean below
    fx.fill('fill-cam', lit, to_cam, 2.2, (1.0, 0.97, 0.92))


def burnt_frost():
    """2008: at dusk over the Pacific, an SM-3 from USS Lake Erie climbs toward the failing USA-193 at about 247 km."""
    sh = orbit_view(24.0, -172.0, 330, heading=10, horizon_sy=0.05, lens=26)
    cam = sh.cam.matrix_world.to_3x3()
    right, screen_up, back = cam @ Vector((1, 0, 0)), cam @ Vector((0, 1, 0)), cam @ Vector((0, 0, 1))
    at_sea = sh.at(-0.22, -0.5, sh.ground(-0.22, -0.5))
    n = at_sea.normalized()
    low_sun = (-right * 0.78 - back * 0.63).normalized()
    sun_dir = (n * 0.18 + (low_sun - n * low_sun.dot(n)).normalized()).normalized()  # the Sun low ahead, just off the left edge: its glint lies on the sea
    kit.world_stars()
    SUN[0] = kit.sun(sun_dir, strength=6.0)
    kit.earth(SUN[0], clouds=0.42, glint=0.12)
    bow = (right * 0.85 + back * 0.5).normalized()  # three-quarter view: the bow comes toward us, the wake trails away
    boat, bp, bs = sh.place('ship', ship_model.cruiser('ship'), 0, 0, 0, 0.34, bow, pos=at_sea, up=(n * 0.85 + back * 0.15).normalized())
    ship_model.wake(at_sea, bow, bs)
    bpy.context.view_layer.update()
    vls = boat.matrix_world @ Vector((45, 0, 8))
    sat = sh.at(0.34, 0.55, 0.3)
    path = climb(vls, sat, 90, 0.15)
    k = int(len(path) * 0.6)
    tip, d = path[k], (path[k + 1] - path[k]).normalized()
    _, body = fly('sm3', M.sm3('sm3'), sh, 0.22, tip, d, plume_len=0.45, plume_w=0.035)
    kit.trail('sm3-tr', path[:k - 1], '#ffe7c4', body * 0.025, 4)
    fx.smoke('sm3-smoke', path[:40], bs * 5, bs * 14, color='#f3cf9f', alpha=0.07, seed=5, count=170, shaded=(right, '#8e8f96'))
    kit.flash('launch', vls, r=bs * 5, strength=8, halo='#ffcf8a', light=False)
    usa193, _, _ = sh.place('usa193', sats.leosat('u193', size=(4.2, 1.9, 1.9), panels=3), 0, 0, 0, 0.36, (screen_up * 0.9 + right * 0.35).normalized(), pos=sat, up=(back * 0.9 + right * 0.2 + screen_up * 0.1).normalized())
    planet = [bpy.data.objects[p] for p in kit.EARTH_PARTS if p in bpy.data.objects]
    fx.fill('rake', planet, n * 0.2 + (low_sun - n * low_sun.dot(n)).normalized(), 8.0, (1.0, 0.6, 0.3))  # warm dusk light grazing the sea and cloud tops
    lit = [boat, usa193, bpy.data.objects['sm3']]
    fx.fill('ship-key', [boat], right * 0.7 + screen_up * 0.5 + back * 0.4, 2.5, (1.0, 0.76, 0.5), shadow=True, angle=3)
    fx.fill('key', lit, right * 0.7 + screen_up * 0.5 + back * 0.55, 2.8, (1.0, 0.74, 0.5), shadow=True, angle=3)  # the low warm Sun
    fx.fill('fill', lit, -right * 0.3 + screen_up * 0.3 + back * 0.8, 0.8)  # cool light from the dusk sky and sea


def dn2():
    """2013: the DN-2 rocket from Xichang climbs past 10,000 km toward geostationary height (apogee at least 30,000 km), with no intercept."""
    base(ll(6, 50), clouds=0.34)
    start, apo = ll(28.2, 102.0), ll(24, 98, 30000)
    path = climb(start, apo, 200, 0.5)
    k = 150
    pos, d = path[k], (path[k + 1] - path[k]).normalized()
    sh = Shot(ll(32, 60, 9.0 * kit.R_KM), pos * 0.5, lens=40)  # a view from high above the north-west: the rocket between the Earth and the belt
    fx.frame(sh, pos, 0.3, -0.14)
    kit.ring('geo', GEO, 0, 0, C['geo'], 0.01, 2.2)
    kit.trail('dn2-tr', path[:k], '#ffd9a8', 0.024, 4)
    kit.curve('dn2-rest', path[k:], 0.005, kit.glow_mat('dn2-rest-m', C['cn'], 1.0, alpha=0.45))
    stage, _, scale = sh.place('dn2', M.upper_stage('dn2'), 0, 0, 0, 0.36, d, pos=pos)
    fx.exhaust('dn2-thrust', pos - d * 6.6 * scale, -d, 4.0 * scale, 0.9 * scale)
    fx.fill('stage-fill', [stage], -pos, 0.9)  # cool light off the Earth lifts the shadow side
    geo_sats(sh)


def geo_sats(sh, n=9):
    """Small communications satellites strung along the belt where it crosses the picture, sized to look smaller with distance; every third is larger."""
    pts = []
    for deg in range(0, 360, 4):
        p = kit.orbit_points(GEO, 0, 0, 360, deg, deg + 1)[0]
        ndc = world_to_camera_view(bpy.context.scene, sh.cam, p)
        if 0.04 < ndc.x < 0.8 and 0.08 < ndc.y < 0.92 and ndc.z > 0:
            pts.append((deg, p, ndc.z))
    roots = []
    for i in range(n):
        deg, p, z = pts[min(len(pts) - 1, round((i + 0.5) * len(pts) / n))]
        tangent = (kit.orbit_points(GEO, 0, 0, 360, deg, deg + 1)[1] - p).normalized()
        frac = 0.05 * pts[0][2] / z * (1.9 if i % 3 == 1 else 1.0)
        roots.append(sh.place(f'geosat{i}', sats.comsat(f'gs{i}', panels=3, reflectors=2), 0, 0, 0, frac, tangent, pos=p)[0])
    fx.fill('belt-key', roots, (sh.cam.location - roots[0].location).normalized(), 2.0, (1.0, 0.97, 0.92))
