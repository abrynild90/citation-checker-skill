// ============================================================================
// scenes/core.js: shared constants and math (vectors, orbits, seeded RNG, compressed radial scale)
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
const DEG = Math.PI / 180;
const GEO_ALT = 35786;
// Compressed radial scale: Earth radius = 1; altitude compressed as alt^0.45.
export const rAlt = alt => 1 + 1.4 * Math.pow(Math.max(alt, 0) / GEO_ALT, 0.45);
const IS_PHONE = matchMedia('(max-width: 760px)').matches;
export const PARTICLE_BUDGET = IS_PHONE ? 1500 : 5000;

// three.js frame: Y = north; X toward lon 0; Z toward lon -90.
const ll = (lat, lon, r = 1) => [r * Math.cos(lat * DEG) * Math.cos(lon * DEG), r * Math.sin(lat * DEG), -r * Math.cos(lat * DEG) * Math.sin(lon * DEG)];
const toLL = p => { const r = Math.hypot(p[0], p[1], p[2]); return { lat: Math.asin(p[1] / r) / DEG, lon: Math.atan2(-p[2], p[0]) / DEG, r }; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => scl(a, 1 / (len(a) || 1));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lerp = (a, b, s) => a + (b - a) * s;
const clamp01 = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
// Great-circle arc hugging the surface between two [lat, lon] points, lifted slightly at mid-span.
function groundArc(a, b, N = 40, lift = 0.03) {
  const g0 = ll(a[0], a[1]), g1 = ll(b[0], b[1]), om = Math.acos(Math.max(-1, Math.min(1, dot(g0, g1)))) || 1e-3, out = [];
  for (let k = 0; k <= N; k++) { const u = k / N, d = norm(add(scl(g0, Math.sin((1 - u) * om) / Math.sin(om)), scl(g1, Math.sin(u * om) / Math.sin(om)))); out.push(scl(d, 1.004 + lift * Math.sin(Math.PI * u))); }
  return out;
}

// Sun direction: fixed in world space, ~50 deg east of the opening camera so the event region is lit.
function sunFor(cam) { const c0 = norm(cam), cy = Math.cos(22 * DEG), sy = Math.sin(22 * DEG); return norm([c0[0] * cy + c0[2] * sy, c0[1] + 0.35, -c0[0] * sy + c0[2] * cy]); }
// Orbit: astro ECI -> three frame. u = argument of latitude (rad).
function orbitPos(alt, inc, raan, u, rOverride) {
  const r = rOverride ?? rAlt(alt), i = inc * DEG, O = raan * DEG;
  const x = Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i);
  const y = Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i);
  const z = Math.sin(u) * Math.sin(i);
  return [r * x, r * z, -r * y];
}
// Orbit (raan, u) that passes over (lat, lon) on an ascending pass.
function orbitThrough(lat, lon, inc) {
  const i = inc * DEG, u = Math.asin(Math.max(-1, Math.min(1, Math.sin(lat * DEG) / Math.sin(i))));
  const dl = Math.atan2(Math.cos(i) * Math.sin(u), Math.cos(u));
  return { raan: lon - dl / DEG, u };
}
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const gauss = rnd => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());

