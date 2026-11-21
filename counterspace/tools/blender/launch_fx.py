# Effects for the launch posters (scenes_launch.py): a fill light that touches only the models (the planet is lit by its own Sun twin, see
# kit.split_sun_shadows) and a puffy exhaust smoke trail.
import math
import random

import bpy
from mathutils import Vector

import kit


def _descendants(ob):
    yield ob
    for c in ob.children:
        yield from _descendants(c)


def fill(name, roots, direction, strength=1.2, color=(0.55, 0.7, 1.0), shadow=False, angle=25):
    """A Sun lamp from `direction` (toward the lamp) that lights only the given model roots; shadowless unless `shadow` (a key light), so a fill can be soft."""
    lit = bpy.data.collections.new(name + '-lit')
    for r in roots:
        for ob in _descendants(r):
            if ob.type in ('MESH', 'CURVE'):
                lit.objects.link(ob)
    data = bpy.data.lights.new(name, 'SUN')
    data.energy, data.color, data.use_shadow, data.angle = strength, color, shadow, math.radians(angle)
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    ob.rotation_euler = (-Vector(direction).normalized()).to_track_quat('-Z', 'Y').to_euler()
    ob.light_linking.receiver_collection = lit
    return ob


def smoke(name, points, r0, r1, color='#e9e4dc', strength=1.6, alpha=0.3, seed=3, count=46, shaded=None):
    """A smoke trail of overlapping soft puffs along `points`, radius r0 at the first point and r1 at the last, drifting a little sideways.
    With `shaded` = (toward_sun, grey_color) the puffs on the side away from the Sun are tinted grey and the others keep `color` (warm)."""
    rng = random.Random(seed)
    n = len(points) - 1
    tan = (Vector(points[-1]) - Vector(points[0])).normalized()
    side = tan.orthogonal().normalized()
    up = tan.cross(side)
    mat = kit.glow_mat(name + '-m', color, strength, fresnel=True, alpha=alpha, power=1.3)
    grey = kit.glow_mat(name + '-g', shaded[1], strength * 0.7, fresnel=True, alpha=alpha, power=1.3) if shaded else mat
    for i in range(count):
        t = i / (count - 1)
        k = min(n, int(t * n))
        r = r0 + (r1 - r0) * t ** 1.3
        off = (side * rng.uniform(-1, 1) + up * rng.uniform(-1, 1)) * r * 0.6
        lit = not shaded or off.dot(shaded[0]) + rng.uniform(-0.3, 0.3) * r > 0
        s = kit.sphere(f'{name}-p{i}', r * rng.uniform(0.7, 1.2), Vector(points[k]) + off, mat if lit else grey, seg=16)
        s.visible_shadow = False


def frame(shot, point, sx, sy, iterations=4):
    """Re-aim the shot's camera, without moving it, so that `point` lands at screen position (sx, sy)."""
    for _ in range(iterations):
        bpy.context.view_layer.update()
        cam = shot.cam
        axes = cam.matrix_world.to_3x3()
        d = (point - cam.location).length
        target = point - (axes @ Vector((sx * shot.tx, sy * shot.ty, 0))) * d
        kit.look_at(cam, target, (0, 0, 1))
