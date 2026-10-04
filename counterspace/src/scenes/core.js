// ============================================================================
// scenes/core.js: shared constants and math (vectors, orbits, seeded RNG, compressed radial scale)
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
// ============================================================================
export const DEG = Math.PI / 180;
export const GEO_ALT = 35786;
// Compressed radial scale: Earth radius = 1; altitude compressed as alt^0.45.
export const rAlt = (alt) => 1 + 1.4 * Math.pow(Math.max(alt, 0) / GEO_ALT, 0.45);
export const IS_PHONE = matchMedia('(max-width: 760px)').matches;
export const PARTICLE_BUDGET = IS_PHONE ? 1500 : 5000;

// three.js frame: Y = north; X toward lon 0; Z toward lon -90.
export const ll = (lat, lon, r = 1) => [r * Math.cos(lat * DEG) * Math.cos(lon * DEG), r * Math.sin(lat * DEG), -r * Math.cos(lat * DEG) * Math.sin(lon * DEG)];
export const toLL = (p) => {
  const r = Math.hypot(p[0], p[1], p[2]);
  return { lat: Math.asin(p[1] / r) / DEG, lon: Math.atan2(-p[2], p[0]) / DEG, r };
};
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => scl(a, 1 / (len(a) || 1));
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const lerp = (a, b, s) => a + (b - a) * s;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};
// Great-circle arc hugging the surface between two [lat, lon] points, lifted slightly at mid-span.
export function groundArc(a, b, N = 40, lift = 0.03) {
  const g0 = ll(a[0], a[1]),
    g1 = ll(b[0], b[1]),
    om = Math.acos(Math.max(-1, Math.min(1, dot(g0, g1)))) || 1e-3,
    out = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N,
      d = norm(add(scl(g0, Math.sin((1 - u) * om) / Math.sin(om)), scl(g1, Math.sin(u * om) / Math.sin(om))));
    out.push(scl(d, 1.004 + lift * Math.sin(Math.PI * u)));
  }
  return out;
}

// The one sun for every picture: live scenes, the hero, stills and the diagrams all call sunFor(opening camera position).
// Seen from a scene's opening camera the light comes from `az` degrees to the left of the line of sight and `el` degrees above it, so the first frame
// always shows a bright day side, a soft terminator and a dark side with city lights. The direction then stays fixed in space while the camera moves.
export const SUN_VIEW = { az: 56, el: 24 };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function sunFor(cam) {
  const c0 = norm(cam),
    f = scl(c0, -1);
  let r = cross(f, [0, 1, 0]);
  if (len(r) < 1e-3) r = [1, 0, 0]; // a camera right above a pole: any horizontal axis will do
  r = norm(r);
  const u = cross(r, f),
    az = SUN_VIEW.az * DEG,
    el = SUN_VIEW.el * DEG;
  return norm(add(add(scl(c0, Math.cos(az) * Math.cos(el)), scl(r, -Math.sin(az) * Math.cos(el))), scl(u, Math.sin(el))));
}
// Orbit: astro ECI -> three frame. u = argument of latitude (rad).
export function orbitPos(alt, inc, raan, u, rOverride) {
  const r = rOverride ?? rAlt(alt),
    i = inc * DEG,
    O = raan * DEG;
  const x = Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i);
  const y = Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i);
  const z = Math.sin(u) * Math.sin(i);
  return [r * x, r * z, -r * y];
}
// Orbit (raan, u) that passes over (lat, lon) on an ascending pass.
export function orbitThrough(lat, lon, inc) {
  const i = inc * DEG,
    u = Math.asin(Math.max(-1, Math.min(1, Math.sin(lat * DEG) / Math.sin(i))));
  const dl = Math.atan2(Math.cos(i) * Math.sin(u), Math.cos(u));
  return { raan: lon - dl / DEG, u };
}
export function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (rnd) => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
export function occluded(cam, p) {
  // Does the segment cam->p pass through the unit sphere before reaching p?
  const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]],
    L = len(d),
    u = scl(d, 1 / L);
  const b = dot(cam, u),
    c = dot(cam, cam) - 1,
    disc = b * b - c;
  if (disc < 0) return false;
  const t0 = -b - Math.sqrt(disc);
  return t0 > 0 && t0 < L - 1e-3;
}
