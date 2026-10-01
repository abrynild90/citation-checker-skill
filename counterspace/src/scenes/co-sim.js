// ============================================================================
// scenes/co-sim.js: helpers for the co-orbital scenes: orbit anchors with a local frame, keyframed offsets, Kepler ellipse, act windows
// (ES module; imported by sim.js. See src/scenes.js for the module map.)
// ============================================================================
// A scene may define anchors (a GEO longitude, a circular orbit or an ellipse). A craft is an anchor position plus keyframed offsets in the
// anchor's local frame [along-track, radial, cross-track] in Earth radii. Offsets are exaggerated on purpose (spacecraft that are metres or
// kilometres apart could not be seen at Earth scale); labels and status lines give the distances SWF reports.
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { DEG, GEO_ALT, add, dot, lerp, ll, norm, orbitPos, orbitThrough, rAlt, scl, smooth } from './core.js';
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const RE_KM = 6371;
function keyAt(keys, t) {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i],
        s = smooth((t - a[0]) / (b[0] - a[0]));
      return [lerp(a[1], b[1], s), lerp(a[2], b[2], s), lerp(a[3], b[3], s)];
    }
  const l = keys[keys.length - 1];
  return [l[1], l[2], l[3]];
}
// Kepler ellipse. The timing is Kepler's (real eccentricity, mean and eccentric anomaly), but the radius is drawn in the page's compressed radial scale:
// perigee and apogee altitudes are mapped through rAlt() and the orbit between them is a true ellipse in that scale (so it reads as a smooth ellipse,
// not a polygon-like spiral that compressing every radius separately would give).
function ellipseGeom(a) {
  const rp = RE_KM + a.perigee,
    ra = RE_KM + a.apogee;
  return { A: (rp + ra) / 2, e: (ra - rp) / (ra + rp) };
}
function ellipseAt(a, nu) {
  const u = nu + a.argp * DEG,
    i = a.inc * DEG,
    O = a.raan * DEG;
  const x = Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i),
    y = Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i),
    z = Math.sin(u) * Math.sin(i);
  const pc = rAlt(a.perigee),
    ac = rAlt(a.apogee),
    ec = (ac - pc) / (ac + pc),
    R = (pc * (1 + ec)) / (1 + ec * Math.cos(nu));
  return [R * x, R * z, -R * y];
}
function ellipsePos(a, t) {
  const { e } = ellipseGeom(a),
    M = (a.m0 ?? 0) + 2 * Math.PI * a.revs * t;
  let E = M;
  for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  return ellipseAt(a, nu);
}
export function ellipsePath(a, N = 160) {
  const out = [];
  for (let k = 0; k <= N; k++) out.push(ellipseAt(a, (2 * Math.PI * k) / N));
  return out;
}
export function makeAnchor(a) {
  if (a.geo) {
    const lon = a.geo.lon,
      P = ll(a.geo.lat ?? 0, lon, a.geo.r ?? rAlt(GEO_ALT)),
      rad = norm(P),
      along = norm([-Math.sin(lon * DEG), 0, -Math.cos(lon * DEG)]),
      fr = { rad, along, cross: cross3(rad, along) };
    return { pos: () => P, frame: () => fr };
  }
  if (a.orbit && a.orbit.through) {
    const o = orbitThrough(a.orbit.through[0], a.orbit.through[1], a.orbit.inc);
    a.orbit.raan = o.raan;
    a.orbit.u0 = o.u - a.orbit.du * (a.orbit.tThrough ?? 0.5);
  }
  const pos = a.orbit ? (t) => orbitPos(a.orbit.alt, a.orbit.inc, a.orbit.raan, a.orbit.u0 + a.orbit.du * t) : (t) => ellipsePos(a.ellipse, t);
  const frame = (t) => {
    const p = pos(t),
      q = pos(t + 0.004),
      rad = norm(p);
    let al = add(q, scl(p, -1));
    al = norm(add(al, scl(rad, -dot(al, rad))));
    return { rad, along: al, cross: cross3(rad, al) };
  };
  // Sample times for a trail: on an ellipse they are uniform in eccentric anomaly (dense near perigee where the craft is fast), so the trail is smooth.
  const times = a.ellipse
    ? (t0, t1, N) => {
        const { e } = ellipseGeom(a.ellipse),
          m0 = a.ellipse.m0 ?? 0,
          k = 2 * Math.PI * a.ellipse.revs,
          solve = (M) => {
            let E = M;
            for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            return E;
          },
          E0 = solve(m0 + k * t0),
          E1 = solve(m0 + k * t1);
        return Array.from({ length: N + 1 }, (_, i) => {
          const E = E0 + ((E1 - E0) * i) / N;
          return (E - e * Math.sin(E) - m0) / k;
        });
      }
    : null;
  return { pos, frame, times };
}
// arcs: [{t0, t1, o:[along, rad, cross]}] bend a leg of the path: the offset grows and fades as sin(pi * progress), so a transfer is a curve, not a
// straight line.
export function craftPos(anc, keys, t, arcs = null) {
  const p = anc.pos(t),
    f = anc.frame(t),
    o = keyAt(keys, t);
  if (arcs)
    for (const ar of arcs) {
      const u = (t - ar.t0) / (ar.t1 - ar.t0);
      if (u > 0 && u < 1) {
        const w = Math.sin(Math.PI * u);
        o[0] += ar.o[0] * w;
        o[1] += ar.o[1] * w;
        o[2] += ar.o[2] * w;
      }
    }
  return add(add(add(p, scl(f.along, o[0])), scl(f.rad, o[1])), scl(f.cross, o[2]));
}
