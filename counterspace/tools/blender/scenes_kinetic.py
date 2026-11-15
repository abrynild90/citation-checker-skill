# Poster scenes: Starfish Prime, Fengyun-1C and Mission Shakti: bursts, flashes and debris over a large Earth.
# Each function builds one picture with the helpers in compose.py; posters.py renders them.
import random

import kinetic_fx as fx
import kinetic_wreck as wreck
from compose import *  # noqa: F401,F403


def _field_line(lon, L, n=120):
    """A dipole field line r = L cos^2(lat) in the meridian plane at `lon`, from its northern foot to its southern one (just above the clouds)."""
    lam = math.acos(math.sqrt(1.012 / L))
    a = math.radians(lon)
    pts = []
    for i in range(n + 1):
        t = lam - 2 * lam * i / n
        r = L * math.cos(t) ** 2
        pts.append(Vector((r * math.cos(t) * math.cos(a), r * math.cos(t) * math.sin(a), r * math.sin(t))))
    return pts


def _aurora(lat, lon, span, seed):
    """Tall soft auroral curtains standing on a wandering path: green at the base fading up through yellow to red, overlapping, different
    heights, with a soft glow on the limb beneath."""
    rng = random.Random(seed)
    parts, n = 11, 48
    for k in range(parts):
        lo, ph = lon - span / 2 + span * k / parts + rng.uniform(-0.6, 0.6), rng.uniform(0, 6)
        path = [(lat + 2.0 * math.sin((lo + i * 0.1) * 0.5) + 0.8 * math.sin(i * 0.2 + ph), lo + span / parts * 1.5 * i / n) for i in range(n + 1)]
        top = rng.uniform(700, 1300)
        tops = [top * (0.6 + 0.4 * math.sin(i * 0.25 + ph) ** 2) for i in range(n + 1)]
        mat = fx.curtain_mat(f'aurora-m{k}', '#7dffb0', rng.uniform(0.5, 1.0), ((0, 0), (0.25, 0.8), (0.5, 1), (0.8, 0.8), (1, 0)), ((0, 0), (0.2, 0.7), (0.5, 0.4), (1, 0)),
                             colors=((0, '#7dffb0'), (0.3, '#3dff8a'), (0.6, '#d8ff70'), (0.85, '#ff6a6a'), (1, '#ff3a5a')), rays=(9, 1.5), streak=0.7, seed=seed + k)
        fx.strip(f'aurora{k}', [ll(a, b, 90) for a, b in path], [ll(a, b, h) for (a, b), h in zip(path, tops)], mat)
    kit.ground_disc('aurora-glow', lat, lon, 10, '#4dff9a', 0.35, 0.14, lift_km=40)


def starfish():
    """1962: a 1.4-megaton burst 400 km over Johnston Island at night lights up the Pacific sky; its electrons spread along the magnetic field
    lines into an artificial radiation belt, with aurora at the far end of the lines near Samoa."""
    burst = ll(16.7, -169.5, 400)
    base(ll(0, 15), clouds=0.6)
    kit.sun(ll(25, -215), strength=0.7, color=(0.6, 0.72, 1.0))  # faint moonlight so the night ocean and clouds keep their form
    cam = ll(2, -212, 2600)
    Shot(cam, ll(6.5, -150, 900), lens=22, up=cam + Vector((0, 0, 1)).cross(cam) * 0.12)
    fx.fireball('burst', burst, 0.14, strength=0.32)
    kit._point_light('burst-light', burst * 1.9, 40.0, '#ffc690', 0.9)  # high and large: a broad soft warm light on the cloud tops, no hard highlight
    L0 = burst.length / math.cos(math.radians(16.7)) ** 2
    rng = random.Random(5)
    # seven ribbons at uneven spacing: two thin and bright, five wide and faint; white-pink at the burst, violet over the arch, green at the aurora
    tint = ((0, '#ffd2dc'), (0.18, '#d9a4ff'), (0.45, '#9a7cff'), (0.8, '#9a7cff'), (1.0, '#8affc0'))
    soft = ((0, 0), (0.25, 0.45), (0.5, 1), (0.75, 0.45), (1, 0))
    for k, (dlon, dl, w, strength) in enumerate(((-12, 0.07, 0.010, 0.7), (-7, -0.02, 0.003, 3.0), (-3, 0.03, 0.012, 0.55), (0.5, 0.0, 0.008, 0.8),
                                                    (4, 0.09, 0.0025, 3.2), (7.5, 0.04, 0.011, 0.6), (11, 0.02, 0.009, 0.7))):
        a, b = _field_line(-169.5 + dlon, L0 + dl - w), _field_line(-169.5 + dlon, L0 + dl + w)
        fx.strip(f'ribbon{k}', a, b, fx.curtain_mat(f'ribbon-m{k}', C['belt'], strength, ((0, 0.9), (0.12, 1), (0.4, 0.25), (0.6, 0.15), (0.85, 0.5), (1, 0.9)),
                                                    across=soft, colors=tint, lengthwise=True, rays=(2.5, 12.0), streak=0.5, seed=k))
    _aurora(-20.5, -172, 22, 3)


def fengyun():
    """2007: an SC-19 from Xichang destroys Fengyun-1C at 865 km before dawn; the debris spreads along its orbit, then all the way around."""
    base(ll(-22, -148), clouds=0.3)
    kit.sun(ll(30, 20), strength=2.6, color=(0.35, 0.5, 1.0))  # faint cool moonlight on the night side, so it is blue-grey with cloud form, not brown
    hit = ll(35.5, 106.5, 865)
    orb, near = orbit_through(865, 98.6, hit)
    t = (orb[near + 2] - orb[near - 2]).normalized()
    t = t if t.z > 0 else -t
    up, side = hit.normalized(), hit.normalized().cross(t)
    cam = hit - t * 0.1 + up * 0.36 + side * 0.34
    sh = Shot(cam, hit + up * 0.02, lens=34, up=up)
    R, U = (sh.cam.matrix_world.to_3x3() @ Vector(v) for v in ((1, 0, 0), (0, 1, 0)))  # screen right and up
    kit.trail('sc19', climb(ll(28.2, 102.0), hit, 90, 0.5), C['int'], 0.0012, 8)
    kit.curve('sc19-smoke', climb(ll(28.2, 102.0), hit, 90, 0.5), 0.004, kit.glow_mat('sc19-smoke-m', C['int'], 0.8, fresnel=True, alpha=0.25, power=2.0), taper=(0.1, 1.0))
    fx.fireball('hit', hit, 0.03, strength=0.14, halo='#ffb070', aura='#ffd0a0', body=0.5)
    fx.ring_disc('shock', hit, cam - hit, 0.03, '#ffd9b0', 0.25, 0.03, 0.8)

    def fan(rng):  # mostly along the orbit, either way, with a wide spread
        phi, az = abs(rng.gauss(0, 0.6)), rng.uniform(0, math.tau)
        return (t * rng.choice((-1, 1)) * math.cos(phi) + (up * math.cos(az) + side * math.sin(az)) * math.sin(phi)).normalized()
    wreck.throw('wreck', hit, fan, 14, 0.17, 0.022, C['debris'], 4, sh, (hit + (cam - hit).normalized() * 0.12 + up * 0.05, 1.5, '#e8f0ff'), hero=(t * 0.9 + side * 0.3 + up * 0.2, 0.12, t, up + side, 0.8), trails=False,
                features=((R * -1.0 + U * 0.1, 0.075, 1.8), (R * 1.0 + U * -0.15, 0.08, 1.9), (R * 0.2 + U * -0.6, 0.07, 1.6)))

    def stream(i, rng):  # a band that thins with distance from the impact, with a sparse thread all the way round
        k = int(rng.expovariate(1 / 60)) if i < 6200 else rng.randint(0, len(orb) - 1)
        j = (near + rng.choice((-1, 1)) * k) % len(orb)
        spread = 0.002 + 0.012 * math.exp(-k / 120)
        return orb[j] + Vector((rng.gauss(0, spread), rng.gauss(0, spread), rng.gauss(0, spread)))
    kit.debris('fy-debris', stream, 7000, size=0.0015, color=C['debris'], glow=1.6, seed=7, metal_share=0.2)


def shakti():
    """2019: a PDV Mk-II from Abdul Kalam Island destroys Microsat-R at about 283 km, late morning over north-east India."""
    base(ll(2.5, 94), clouds=0.3)
    hit = ll(21.0, 88.4, 283)
    sh = orbit_view(12.5, 89.5, 450, heading=-18, horizon_sy=-0.1, lens=28)
    cam = sh.cam.location
    R, U, B = (sh.cam.matrix_world.to_3x3() @ Vector(v) for v in ((1, 0, 0), (0, 1, 0), (0, 0, 1)))  # screen right, up, and toward the camera
    path = climb(ll(20.76, 87.08), hit, 90, 0.5)
    kit.trail('pdv', path, C['ind'], 0.0014, 10)
    kit.curve('pdv-smoke', path, 0.0035, kit.glow_mat('pdv-smoke-m', C['ind'], 0.7, fresnel=True, alpha=0.2, power=2.0), taper=(0.1, 1.0))
    kit.plume('pdv-head', path[88], path[78] - path[88], 0.03, 0.0009, C['ind'], light=0.0)
    fx.fireball('hit', hit, 0.02, strength=0.09, halo='#ffd09a', aura='#ffe0b0', body=0.0)
    fx.ring_disc('shock', hit, cam - hit, 0.02, '#fff0d8', 0.1, 0.02, 0.9)

    def burst(rng):
        return Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized()
    wreck.throw('wreck', hit, burst, 18, 0.1, 0.010, C['debris'], 3, sh, (hit + (cam - hit).normalized() * 0.08, 0.6, '#fff4e8'), hero=(R * -0.85 + U * 0.0 + B * -0.3, 0.08, R * 0.6 + U * 0.3, B * 1.0 + U * 0.5 + R * 0.2, 1.0), margin=0.65)

    def sparks(i, rng):
        return hit + burst(rng) * 0.14 * rng.random() ** 0.8
    kit.debris('sh-debris', sparks, 700, size=0.0005, color=C['debris'], glow=1.5, seed=3, metal_share=0.3)
