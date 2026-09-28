// ============================================================================
// Scene library. Scenes are data (SCENES configs) interpreted by one simulator
// (buildSim) that feeds two renderers: a single shared WebGL host (three.js)
// and a static SVG fallback (reduced motion / no WebGL). Illustrative only.
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

// ---------------------------------------------------------------- configs
const C = { tgt: '#ffd166', int: '#ff6b6b', debris: '#ffb38a', iss: '#8cc8ff', gps: '#9be7c4', jam: '#ff5d5d', ok: '#6ee7a8', laser: '#ff4fd8', geo: '#ffcf6e', belt: '#b28cff', ground: '#e9edf7' };

export const SCENES = [
  { id: 'starfish', date: '1962-07-09', title: 'Starfish Prime (1962)', shells: ['LEO'], duration: 14,
    caption: 'A 1.4-megaton warhead detonates about 400 km above Johnston Island. Electrons from the blast are trapped by Earth’s magnetic field. They spread along field lines and drift around the planet, forming an artificial radiation belt that damaged several satellites in the following months.',
    cite: 'DOE/NV-209 Rev. 16 (Starfish Prime, 9 July 1962).', related: 'ltbt-1963', event: 'us-1962-starfish-prime',
    actors: [
      { type: 'site', at: [16.7, -169.5], label: 'Johnston Island', color: C.ground },
      { type: 'suborbital', from: [16.7, -169.5], to: [16.5, -169.0], apex: 400, t0: 0.02, t1: 0.14, color: C.int, label: 'Thor launch' },
      { type: 'flash', at: [16.5, -169.2, 400], t0: 0.14, color: '#fff3c4', label: 'Detonation ~400 km' },
      { type: 'belt', at: [16.5, -169.2], L: [1.12, 1.7], t0: 0.18, t1: 0.9, count: 2600, color: C.belt, label: 'Artificial radiation belt' },
      { type: 'ring', alt: 800, inc: 44.8, raan: 40, color: '#8cc8ff', sat: { phase: 0, speed: 2.2, label: 'Satellite in belt' } },
    ], still: 0.7 },
  { id: 'solwind', date: '1985-09-13', title: 'ASM-135 vs. Solwind (1985)', shells: ['LEO'], duration: 12,
    caption: 'An F-15 climbs over the Pacific and releases an ASM-135 missile. The missile’s miniature homing vehicle rises to meet the Solwind P78-1 satellite at about 530 km and destroys it by collision. SWF counts 285 tracked fragments; all have since decayed.',
    cite: 'SWF 2026, Table 5-1, p. 05-01; Table 1-4, p. 01-24.', related: null, event: 'us-1985-solwind',
    hit: { lat: 36.0, lon: -126.0, alt: 530, inc: 97.6, t: 0.45 },
    actors: [
      { type: 'aircraft', path: [[34.0, -119.0], [35.4, -124.0]], alt: 12, t0: 0.0, t1: 0.28, label: 'F-15' },
      { type: 'target', label: 'Solwind P78-1', color: C.tgt },
      { type: 'intercept', from: 'aircraft', t0: 0.28, color: C.int, label: 'ASM-135' },
      { type: 'debris', count: 285, spreadAlt: 120, spreadInc: 0.6, dv: 0.05, decay: 0.15, color: C.debris },
    ], still: 0.62 },
  { id: 'fengyun', date: '2007-01-11', title: 'Fengyun-1C (2007)', shells: ['LEO'], duration: 16,
    caption: 'China’s SC-19 interceptor strikes the Fengyun-1C weather satellite at about 880 km (SWF Table 5-1). At that altitude, fragments stay up for decades. They spread along the old orbit into a ring around the planet. It remains the largest debris-generating event on record.',
    cite: 'SWF 2026, Table 5-1, p. 05-01 (3,532 cataloged; 2,351 in orbit as of Feb. 2026).', related: 'unga-77-41', event: 'cn-2007-fy1c',
    hit: { lat: 34.0, lon: 104.5, alt: 880, inc: 98.6, t: 0.28 },
    actors: [
      { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
      { type: 'target', label: 'Fengyun-1C', color: C.tgt },
      { type: 'intercept', from: [28.2, 102.0], t0: 0.12, color: C.int, label: 'SC-19' },
      { type: 'debris', count: 3532, spreadAlt: 260, spreadInc: 1.1, dv: 0.09, decay: 0, color: C.debris, label: 'Debris ring' },
    ], still: 0.85 },
  { id: 'burnt-frost', date: '2008-02-20', title: 'Burnt Frost: SM-3 vs. USA-193 (2008)', shells: ['LEO'], duration: 12,
    caption: 'A US Navy cruiser fires a modified SM-3 missile-defense interceptor at the failing USA-193 satellite at about 220 km. The low altitude meant most fragments re-entered within weeks. The event shows the overlap between missile defense and anti-satellite capability.',
    cite: 'SWF 2026, Table 5-1, p. 05-01 (175 cataloged; 0 in orbit).', related: null, event: 'us-2008-burnt-frost',
    hit: { lat: 25.0, lon: -166.0, alt: 220, inc: 58.5, t: 0.35 },
    actors: [
      { type: 'ship', at: [22.0, -163.0], label: 'USS Lake Erie' },
      { type: 'target', label: 'USA-193', color: C.tgt },
      { type: 'intercept', from: [22.0, -163.0], t0: 0.2, color: C.int, label: 'SM-3' },
      { type: 'debris', count: 175, spreadAlt: 70, spreadInc: 0.8, dv: 0.06, decay: 1.6, color: C.debris },
    ], still: 0.5 },
  { id: 'dn2', date: '2013-05-13', title: 'DN-2 “high-altitude science” launch (2013)', shells: ['LEO', 'MEO', 'GEO'], duration: 14,
    caption: 'A rocket from Xichang climbs on a suborbital path toward the geostationary belt and falls back over the Indian Ocean. China said it reached 10,000 km. US officials said it went nearly to GEO. SWF cites an analysis putting the apogee at 30,000 km or more. There was no target. The launch showed reach, not an intercept.',
    cite: 'SWF 2026, pp. 03-20, 03-22.', related: null, event: 'cn-2013-dn2',
    actors: [
      { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
      { type: 'suborbital', from: [28.2, 102.0], to: [-20.0, 78.0], apex: 30000, t0: 0.05, t1: 0.9, color: C.int, label: '~30,000 km apogee (not an intercept)', head: true },
      { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, label: 'GEO belt', sats: 10 },
    ], still: 0.5, camDist: 7.5 },
  { id: 'shakti', date: '2019-03-27', title: 'Mission Shakti (2019)', shells: ['LEO'], duration: 12,
    caption: 'India’s PDV Mk-II interceptor destroys the Microsat-R satellite at about 300 km. Indian officials said the debris would re-enter within 45 days. SWF counts 130 cataloged fragments, none still in orbit.',
    cite: 'SWF 2026, Table 5-1, p. 05-01; p. 04-03.', related: 'us-moratorium-2022', event: 'in-2019-shakti',
    hit: { lat: 23.0, lon: 89.0, alt: 300, inc: 96.6, t: 0.3 },
    actors: [
      { type: 'site', at: [20.75, 87.08], label: 'Abdul Kalam Island', color: C.ground },
      { type: 'target', label: 'Microsat-R', color: C.tgt },
      { type: 'intercept', from: [20.75, 87.08], t0: 0.18, color: C.int, label: 'PDV Mk-II' },
      { type: 'debris', count: 130, spreadAlt: 110, spreadInc: 0.8, dv: 0.06, decay: 1.2, color: C.debris },
    ], still: 0.5 },
  { id: 'cosmos1408', date: '2021-11-15', title: 'Nudol vs. Cosmos 1408 (2021)', shells: ['LEO'], duration: 16,
    caption: 'Russia’s Nudol interceptor destroys the defunct Cosmos 1408 at about 470 km. The debris cloud spreads across altitudes that cross the International Space Station’s orbit (about 420 km), and the ISS crew sheltered in their docked spacecraft. SWF counts 1,807 cataloged fragments, 5 still in orbit as of February 2026.',
    cite: 'SWF 2026, Table 5-1, p. 05-01; Table 2-4, p. 02-21.', related: 'us-moratorium-2022', event: 'ru-2021-cosmos1408',
    hit: { lat: 66.0, lon: 52.0, alt: 470, inc: 82.6, t: 0.3 },
    actors: [
      { type: 'site', at: [62.9, 40.6], label: 'Plesetsk', color: C.ground },
      { type: 'ring', alt: 420, inc: 51.6, raan: 110, color: C.iss, label: 'ISS orbit', sat: { phase: 1.2, speed: 1.8, label: 'ISS' } },
      { type: 'target', label: 'Cosmos 1408', color: C.tgt },
      { type: 'intercept', from: [62.9, 40.6], t0: 0.17, color: C.int, label: 'Nudol' },
      { type: 'debris', count: 1807, spreadAlt: 150, spreadInc: 1.0, dv: 0.08, decay: 0.25, color: C.debris },
    ], still: 0.8 },
  { id: 'gnss', date: '2023-12-01', title: 'GNSS jamming over the Baltic', shells: ['LEO', 'MEO'], duration: 16,
    caption: 'GPS satellites orbit about 20,200 km up. A jammer on the ground swamps their weak signals only inside its local effect zone. Aircraft crossing the zone lose their position fix, while aircraft outside it and the satellites themselves are unaffected. This is interference with receivers, not an attack on a satellite.',
    cite: 'SWF 2026, pp. 02-29 to 02-30; p. 12-05 (downlink jamming has no effect on the satellites).', related: 'icao-2025', event: 'ru-2023-baltic',
    actors: [
      { type: 'constellation', alt: 20200, inc: 55, planes: 6, per: 4, color: C.gps, speed: 0.25, label: 'GPS (MEO)' },
      { type: 'zone', at: [57.5, 21.0], radius: 5, color: C.jam, label: 'Jammer effect zone' },
      { type: 'aircraft', path: [[53.0, 8.0], [61.0, 32.0]], alt: 11, t0: 0, t1: 1, label: 'Airliner', gnss: true },
      { type: 'aircraft', path: [[48.0, 2.0], [50.5, 30.0]], alt: 11, t0: 0, t1: 1, label: 'Airliner (outside zone)', gnss: true },
    ], still: 0.45, camDist: 5.6, focus: [55, 18] },
  { id: 'viasat', date: '2022-02-24', title: 'Viasat KA-SAT cyberattack (2022)', shells: ['GEO'], duration: 14,
    caption: 'About an hour before Russia’s invasion of Ukraine, attackers pushed destructive “AcidRain” malware through KA-SAT’s ground management network. Tens of thousands of user modems in Ukraine and across Europe went dark. The satellite itself kept working: the attack hit the ground segment.',
    cite: 'SWF 2026, pp. 15-06 to 15-07 (attributed to Russia by the US, UK and EU, May 2022).', related: 'tallinn-2017', event: 'ru-2022-viasat',
    actors: [
      { type: 'geo', lon: 9, label: 'KA-SAT (GEO, unaffected)', color: C.geo, beams: [[50, 30], [48, 10], [52, 0], [46, 20], [55, 15]] },
      { type: 'terminals', boxes: [[44, 52, 22, 40, 0.55], [43, 56, -5, 22, 0.45]], count: 700, t0: 0.3, t1: 0.62, label: 'User terminals (ground segment)' },
    ], still: 0.75, camDist: 6.2, focus: [35, 15] },
  { id: 'laser', date: '1997-10-17', title: 'Laser dazzling of an imaging satellite', shells: ['LEO'], duration: 12,
    caption: 'A ground-based laser tracks an imaging satellite as it passes overhead. A low-power beam can dazzle or blind the satellite’s optical sensor; a high-power beam could damage it. The US fired the MIRACL laser at its own MSTI-3 satellite in 1997, and Russia says its Peresvet system is built to dazzle satellites.',
    cite: 'SWF 2026, p. 01-35 (MIRACL); p. 02-35 (Peresvet).', related: null, event: 'us-1997-miracl',
    hit: { lat: 32.4, lon: -106.4, alt: 420, inc: 97.0, t: 0.5 },
    actors: [
      { type: 'site', at: [32.4, -106.4], label: 'Ground laser site', color: C.ground },
      { type: 'target', label: 'Imaging satellite', color: C.tgt, noHit: true },
      { type: 'beam', from: [32.4, -106.4], window: 0.16, color: C.laser, label: 'Beam' },
    ], still: 0.5 },
];
export const HERO = { id: 'hero', title: 'Overview', shells: ['LEO', 'MEO', 'GEO'], duration: 40, spin: true,
  actors: [
    { type: 'ring', alt: 420, inc: 51.6, raan: 30, color: C.iss, sat: { phase: 0, speed: 3, label: 'ISS ~420 km' } },
    { type: 'constellation', alt: 20200, inc: 55, planes: 6, per: 3, color: C.gps, speed: 0.4, label: 'GPS ~20,200 km' },
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, label: 'GEO ~35,786 km', sats: 14 },
  ], still: 0.2, camDist: 7.2, focus: [22, -30] };

// ---------------------------------------------------------------- simulator
// Items: {kind, ...} with time functions. Kinds: shell, curve, point, cloud, beam, dome, flash.
export function buildSim(cfg) {
  const items = [];
  const rnd = mulberry(cfg.id.length * 7919 + 17);
  const shellDefs = { LEO: [2000, '#78a8ff', 'LEO ≤2,000 km'], MEO: [20200, '#a88cff', 'MEO (GPS)'], GEO: [GEO_ALT, '#ffcf6e', 'GEO'] };
  (cfg.shells || []).forEach(s => items.push({ kind: 'shell', r: rAlt(shellDefs[s][0]), color: shellDefs[s][1], label: shellDefs[s][2] }));
  let tgt = null, focus = cfg.focus || null;
  const H = cfg.hit;
  if (H) {
    const o = orbitThrough(H.lat, H.lon, H.inc);
    tgt = { ...H, raan: o.raan, uHit: o.u, w: 2 * Math.PI * 0.9 * Math.sqrt(1 / Math.pow(rAlt(H.alt), 3)) };
    tgt.pos = t => orbitPos(H.alt, H.inc, tgt.raan, tgt.uHit + tgt.w * (t - H.t));
    tgt.hitPos = tgt.pos(H.t);
    focus = focus || [H.lat, H.lon];
  }
  let aircraftPos = null;
  for (const a of cfg.actors) {
    if (a.type === 'site') items.push({ kind: 'point', shape: 'site', pos: () => ll(a.at[0], a.at[1], 1.003), color: a.color, label: a.label });
    if (a.type === 'ship') items.push({ kind: 'point', shape: 'ship', pos: () => ll(a.at[0], a.at[1], 1.004), color: '#cfd8ea', label: a.label });
    if (a.type === 'ring') {
      const pts = []; for (let k = 0; k <= 180; k++) pts.push(orbitPos(a.alt, a.inc, a.raan, k / 180 * 2 * Math.PI));
      items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.55, label: a.label, labelAt: pts[45] });
      if (a.sat) items.push({ kind: 'point', shape: 'sat', color: a.color, label: a.sat.label, pos: t => orbitPos(a.alt, a.inc, a.raan, a.sat.phase + t * 2 * Math.PI * a.sat.speed) });
      if (a.sats) for (let s = 0; s < a.sats; s++) { const ph = s / a.sats * 2 * Math.PI; items.push({ kind: 'point', shape: 'sat', small: true, color: a.color, pos: () => orbitPos(a.alt, a.inc, a.raan, ph) }); }
    }
    if (a.type === 'target' && tgt) {
      const pts = []; for (let k = 0; k <= 180; k++) pts.push(orbitPos(tgt.alt, tgt.inc, tgt.raan, k / 180 * 2 * Math.PI));
      items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.35 });
      items.push({ kind: 'point', shape: 'sat', color: a.color, label: a.label,
        pos: t => (a.noHit || t < tgt.t) ? tgt.pos(t) : null,
        glow: a.noHit ? (t => Math.abs(t - tgt.t) < 0.08) : null });
    }
    if (a.type === 'aircraft') {
      const r = 1.012 + a.alt / 6371;
      const P = s => { const la = lerp(a.path[0][0], a.path[1][0], s), lo = lerp(a.path[0][1], a.path[1][1], s); return ll(la, lo, r); };
      const pos = t => (t >= a.t0 - 1e-6 && t <= a.t1 + 1e-6) ? P(clamp01((t - a.t0) / (a.t1 - a.t0))) : (t > a.t1 && !a.gnss ? null : null);
      const item = { kind: 'point', shape: 'aircraft', color: '#e9edf7', label: a.label, pos: t => pos(Math.min(t, a.t1)) };
      if (!a.gnss) aircraftPos = t => P(clamp01((Math.min(t, a.t1) - a.t0) / (a.t1 - a.t0)));
      if (a.gnss) { item.gnss = true; item.path = a.path; }
      items.push(item);
    }
    if (a.type === 'intercept' && tgt) {
      const from = a.from === 'aircraft' ? aircraftPos(a.t0) : ll(a.from[0], a.from[1], 1.005);
      const to = tgt.hitPos;
      const mid = norm(add(from, to)); const ctrl = scl(mid, Math.max(len(from), len(to)) + 0.12);
      const bez = s => add(add(scl(from, (1 - s) * (1 - s)), scl(ctrl, 2 * (1 - s) * s)), scl(to, s * s));
      const N = 60, all = []; for (let k = 0; k <= N; k++) all.push(bez(k / N));
      items.push({ kind: 'curve', dynamic: true, color: a.color, width: 2, label: a.label, labelAt: bez(0.5),
        pts: t => { const s = clamp01((t - a.t0) / (tgt.t - a.t0)); return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1)); } });
      items.push({ kind: 'point', shape: 'kv', color: a.color, pos: t => (t > a.t0 && t < tgt.t) ? bez(clamp01((t - a.t0) / (tgt.t - a.t0))) : null });
      items.push({ kind: 'flash', pos: to, t0: tgt.t, color: '#fff1c1' });
    }
    if (a.type === 'debris' && tgt) {
      const n = Math.min(a.count, PARTICLE_BUDGET);
      const P = []; for (let k = 0; k < n; k++) P.push({ da: gauss(rnd) * a.spreadAlt, di: gauss(rnd) * a.spreadInc, dr: gauss(rnd) * 0.4, dw: 1 + gauss(rnd) * a.dv, du: gauss(rnd) * 0.02, dec: a.decay * (0.4 + rnd() * 1.4) });
      items.push({ kind: 'cloud', n, color: a.color, size: n > 2000 ? 0.012 : 0.018, label: a.label,
        fill(t, out) {
          const dt = t - tgt.t; let vis = 0;
          for (let k = 0; k < n; k++) {
            const p = P[k]; let x = 0, y = 0, z = 0;
            if (dt > 0) {
              const alt = tgt.alt + p.da * Math.min(1, dt * 12) - p.dec * dt * tgt.alt;
              if (alt > 60) { const q = orbitPos(alt, tgt.inc + p.di, tgt.raan + p.dr, tgt.uHit + p.du + tgt.w * dt * p.dw); x = q[0]; y = q[1]; z = q[2]; vis++; }
            }
            out[3 * k] = x; out[3 * k + 1] = y; out[3 * k + 2] = z;
          }
          return vis;
        } });
    }
    if (a.type === 'suborbital') {
      const N = 120, all = [];
      const g0 = ll(a.from[0], a.from[1]), g1 = ll(a.to[0], a.to[1]);
      const om = Math.acos(Math.max(-1, Math.min(1, dot(g0, g1))));
      for (let k = 0; k <= N; k++) {
        const s = k / N; const w0 = Math.sin((1 - s) * om) / Math.sin(om || 1), w1 = Math.sin(s * om) / Math.sin(om || 1);
        const d = om < 1e-3 ? g0 : norm(add(scl(g0, w0), scl(g1, w1)));
        all.push(scl(d, rAlt(a.apex * Math.sin(Math.PI * s))));
      }
      items.push({ kind: 'curve', dynamic: true, color: a.color, width: 2, label: a.label, labelAt: all[N >> 1],
        pts: t => { const s = clamp01((t - a.t0) / (a.t1 - a.t0)); return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1)); } });
      if (a.head) items.push({ kind: 'point', shape: 'kv', color: a.color, pos: t => { const s = clamp01((t - a.t0) / (a.t1 - a.t0)); return s > 0 && s < 1 ? all[Math.round(s * N)] : null; } });
      focus = focus || a.from;
    }
    if (a.type === 'flash') items.push({ kind: 'flash', pos: ll(a.at[0], a.at[1], rAlt(a.at[2])), t0: a.t0, color: a.color, big: true, label: a.label });
    if (a.type === 'belt') {
      const n = Math.min(a.count, PARTICLE_BUDGET);
      const P = []; for (let k = 0; k < n; k++) { const L = lerp(a.L[0], a.L[1], rnd()); const lm = Math.acos(Math.sqrt(1 / L)) / DEG; P.push({ L, lat: (rnd() * 2 - 1) * lm * 0.95, side: rnd() * 2 - 1, j: rnd() }); }
      items.push({ kind: 'cloud', n, color: a.color, size: 0.014, label: a.label, labelAt: ll(0, a.at[1] + 60, 1.6),
        fill(t, out) {
          const s = clamp01((t - a.t0) / (a.t1 - a.t0)); let vis = 0;
          for (let k = 0; k < n; k++) {
            const p = P[k]; let x = 0, y = 0, z = 0;
            if (s > p.j * 0.25) {
              const rr = p.L * Math.cos(p.lat * DEG) ** 2; const alt = (rr - 1) * 6371;
              const q = ll(p.lat, a.at[1] + p.side * 180 * Math.min(1, s * 1.3), rAlt(alt)); x = q[0]; y = q[1]; z = q[2]; vis++;
            }
            out[3 * k] = x; out[3 * k + 1] = y; out[3 * k + 2] = z;
          }
          return vis;
        } });
      focus = focus || a.at;
    }
    if (a.type === 'constellation') {
      const sats = [];
      for (let p = 0; p < a.planes; p++) {
        const raan = p * 360 / a.planes, pts = [];
        for (let k = 0; k <= 120; k++) pts.push(orbitPos(a.alt, a.inc, raan, k / 120 * 2 * Math.PI));
        items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.22, label: p === 0 ? a.label : null, labelAt: pts[20] });
        for (let s = 0; s < a.per; s++) { const ph = s / a.per * 2 * Math.PI + p * 0.5; const pos = t => orbitPos(a.alt, a.inc, raan, ph + t * a.speed * 2 * Math.PI); sats.push(pos); items.push({ kind: 'point', shape: 'sat', small: true, color: a.color, pos }); }
      }
      items._gps = sats;
    }
    if (a.type === 'zone') { items.push({ kind: 'dome', at: a.at, radius: a.radius, color: a.color, label: a.label }); items._zone = a; }
    if (a.type === 'geo') {
      const g = ll(0, a.lon, rAlt(GEO_ALT));
      items.push({ kind: 'point', shape: 'sat', color: a.color, label: a.label, pos: () => g });
      a.beams.forEach(b => items.push({ kind: 'beam', a: () => g, b: () => ll(b[0], b[1], 1.003), on: () => true, color: a.color, opacity: 0.35 }));
      focus = focus || [30, a.lon];
    }
    if (a.type === 'terminals') {
      const P = [];
      a.boxes.forEach(([la0, la1, lo0, lo1, frac], bi) => { const m = Math.round(a.count * frac); for (let k = 0; k < m; k++) P.push({ p: ll(lerp(la0, la1, rnd()), lerp(lo0, lo1, rnd()), 1.004), off: lerp(a.t0, a.t1, bi === 0 ? rnd() * 0.6 : 0.3 + rnd() * 0.7) }); });
      const n = P.length;
      items.push({ kind: 'cloud', n, size: 0.022, label: a.label, labelAt: ll(49, 30, 1.05), colored: true,
        fill(t, out, col) {
          for (let k = 0; k < n; k++) { const q = P[k].p; out[3 * k] = q[0]; out[3 * k + 1] = q[1]; out[3 * k + 2] = q[2];
            const dark = t > P[k].off; col[3 * k] = dark ? 0.25 : 0.43; col[3 * k + 1] = dark ? 0.27 : 0.9; col[3 * k + 2] = dark ? 0.32 : 0.66; }
          return n;
        } });
      items.push({ kind: 'status', text: t => t < a.t0 ? 'Network normal' : t < a.t1 ? 'Malware spreading through ground network…' : 'Modems offline · satellite still operating' });
    }
    if (a.type === 'beam' && tgt) {
      const from = ll(a.from[0], a.from[1], 1.004);
      items.push({ kind: 'beam', a: () => from, b: t => tgt.pos(t), on: t => Math.abs(t - tgt.t) < a.window, color: a.color, opacity: 0.95, width: 0.012, label: a.label });
    }
  }
  // GNSS links: aircraft <-> 4 highest GPS satellites; red when inside zone.
  if (items._gps && items._zone) {
    const z = items._zone, zc = ll(z.at[0], z.at[1]);
    items.filter(i => i.gnss).forEach(ac => {
      const inZone = t => { const p = ac.pos(t); return p && Math.acos(Math.min(1, dot(norm(p), zc))) / DEG < z.radius; };
      ac.statusColor = t => inZone(t) ? C.jam : C.ok;
      ac.labelFn = t => inZone(t) ? ac.label + ' · GNSS lost' : ac.label + ' · GNSS OK';
      for (let k = 0; k < 4; k++) items.push({ kind: 'beam', link: true, opacity: 0.7,
        a: t => ac.pos(t), b: t => { const p = ac.pos(t); if (!p) return null; const s = items._gps.map(f => f(t)).map(q => [q, dot(norm(q), norm(p))]).sort((x, y) => y[1] - x[1]); return s[k][0]; },
        on: t => !!ac.pos(t), colorFn: t => inZone(t) ? C.jam : C.ok, dashFn: inZone });
    });
  }
  const f = focus || [20, 0];
  const dist = cfg.camDist || 4.2;
  const cams = cfg.cameras || [
    { name: 'Wide', pos: ll(f[0] * 0.6 + 10, f[1] - 25, dist) },
    { name: 'Near', pos: ll(f[0], f[1] - 8, Math.max(2.3, dist * 0.55)) },
    { name: 'Polar', pos: ll(80, f[1], dist * 1.05) },
  ];
  return { cfg, items, cams, still: cfg.still ?? 0.5 };
}

// ---------------------------------------------------------------- land texture
let LAND = null, landCanvas = null;
export function setLand(l) { LAND = l; }
function drawLand(ctx, W, H, ocean, land, grat) {
  ctx.fillStyle = ocean; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = grat; ctx.lineWidth = 1;
  for (let lo = -180; lo <= 180; lo += 30) { const x = (lo + 180) / 360 * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let la = -60; la <= 60; la += 30) { const y = (90 - la) / 180 * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = land;
  for (const ring of LAND || []) {
    ctx.beginPath();
    for (let k = 0; k < ring.length; k += 2) { const x = (ring[k] + 180) / 360 * W, y = (90 - ring[k + 1]) / 180 * H; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill();
  }
}
function getLandCanvas() {
  if (landCanvas) return landCanvas;
  landCanvas = document.createElement('canvas'); landCanvas.width = IS_PHONE ? 1024 : 2048; landCanvas.height = landCanvas.width / 2;
  drawLand(landCanvas.getContext('2d'), landCanvas.width, landCanvas.height, '#0d2a4d', '#2c5a4a', 'rgba(140,190,255,0.18)');
  return landCanvas;
}

// ---------------------------------------------------------------- WebGL host (single shared renderer)
export class GLHost {
  constructor(THREE) {
    this.T = THREE;
    this.renderer = new THREE.WebGLRenderer({ antialias: !IS_PHONE, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_PHONE ? 1.5 : 2));
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    this.target = new THREE.Vector3(0, 0, 0);
    this.t = 0; this.playing = true; this.raf = 0; this.onTick = null;
    this._bindDrag();
    this.ro = new ResizeObserver(() => this.resize());
  }
  mount(el) {
    if (this.el) { this.ro.unobserve(this.el); this.labelLayer?.remove(); }
    this.el = el; el.prepend(this.canvas);
    this.labelLayer = document.createElement('div'); this.labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    el.appendChild(this.labelLayer);
    this.ro.observe(el); this.resize();
  }
  resize() {
    if (!this.el) return;
    const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.render();
  }
  load(sim) {
    this.unload();
    const T = this.T, S = new T.Scene(); this.scene = S; this.sim = sim; this.dyn = []; this.labels = [];
    S.add(new T.AmbientLight(0xffffff, 0.55));
    const sun = new T.DirectionalLight(0xffffff, 1.3); sun.position.set(5, 3, 4); S.add(sun);
    const root = new T.Group(); S.add(root); this.root = root;
    const tex = new T.CanvasTexture(getLandCanvas()); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    root.add(new T.Mesh(new T.SphereGeometry(1, 64, 48), new T.MeshPhongMaterial({ map: tex, shininess: 8, specular: 0x223344 })));
    root.add(new T.Mesh(new T.SphereGeometry(1.025, 48, 32), new T.MeshBasicMaterial({ color: 0x5aa0ff, transparent: true, opacity: 0.08, side: T.BackSide })));
    const col = c => new T.Color(c);
    for (const it of sim.items) {
      if (it.kind === 'shell') {
        root.add(new T.Mesh(new T.SphereGeometry(it.r, 48, 32), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.06, depthWrite: false })));
        const ring = new T.Mesh(new T.TorusGeometry(it.r, 0.004, 6, 160), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.5 }));
        ring.rotation.x = Math.PI / 2; root.add(ring);
        this._label(it.label, () => [it.r * 0.72, it.r * 0.72, 0], 'shell');
      } else if (it.kind === 'curve') {
        const g = new T.BufferGeometry(); const pts = it.dynamic ? [] : it.pts(0);
        const max = it.dynamic ? 200 : pts.length; const arr = new Float32Array(max * 3);
        pts.forEach((p, k) => arr.set(p, 3 * k));
        g.setAttribute('position', new T.BufferAttribute(arr, 3)); g.setDrawRange(0, pts.length);
        const line = new T.Line(g, new T.LineBasicMaterial({ color: col(it.color), transparent: true, opacity: it.opacity ?? 1 }));
        root.add(line); if (it.dynamic) this.dyn.push({ it, obj: line });
        if (it.label) this._label(it.label, t => it.dynamic ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt);
      } else if (it.kind === 'point') {
        let geo;
        if (it.shape === 'sat') geo = it.small ? new T.OctahedronGeometry(0.018) : new T.BoxGeometry(0.035, 0.035, 0.035);
        else if (it.shape === 'aircraft') geo = new T.ConeGeometry(0.014, 0.05, 8);
        else if (it.shape === 'ship') geo = new T.BoxGeometry(0.05, 0.015, 0.02);
        else if (it.shape === 'kv') geo = new T.SphereGeometry(0.014, 10, 8);
        else geo = new T.CylinderGeometry(0.012, 0.012, 0.03, 10);
        const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color) })); root.add(m);
        if (it.shape === 'sat' && !it.small) { const p = new T.Mesh(new T.BoxGeometry(0.1, 0.004, 0.028), new T.MeshBasicMaterial({ color: 0x3b6fb6 })); m.add(p); }
        this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => it.pos(t), null, it);
      } else if (it.kind === 'cloud') {
        const g = new T.BufferGeometry(); const arr = new Float32Array(it.n * 3);
        g.setAttribute('position', new T.BufferAttribute(arr, 3));
        let mat;
        if (it.colored) { g.setAttribute('color', new T.BufferAttribute(new Float32Array(it.n * 3), 3)); mat = new T.PointsMaterial({ size: it.size, vertexColors: true }); }
        else mat = new T.PointsMaterial({ size: it.size, color: col(it.color), transparent: true, opacity: 0.9, depthWrite: false });
        const pts = new T.Points(g, mat); pts.frustumCulled = false; root.add(pts); this.dyn.push({ it, obj: pts });
        if (it.label) this._label(it.label, t => it.labelAt || (it.fill(t, arr) > 0 ? [arr[0], arr[1], arr[2]] : null));
      } else if (it.kind === 'beam') {
        const m = new T.Mesh(new T.CylinderGeometry(it.width || 0.004, it.width || 0.004, 1, 8, 1, true), new T.MeshBasicMaterial({ color: col(it.color || '#fff'), transparent: true, opacity: it.opacity ?? 0.8, depthWrite: false }));
        root.add(m); this.dyn.push({ it, obj: m });
      } else if (it.kind === 'dome') {
        const c = ll(it.at[0], it.at[1]);
        const m = new T.Mesh(new T.SphereGeometry(it.radius * DEG * 1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide }));
        m.position.set(...c); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...c)); root.add(m);
        this._label(it.label, () => scl(c, 1.12));
      } else if (it.kind === 'flash') {
        const m = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0, depthWrite: false }));
        m.position.set(...it.pos); root.add(m); this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => t > it.t0 ? it.pos : null);
      } else if (it.kind === 'status') { this.status = it; }
    }
    this.statusEl = document.createElement('div'); this.statusEl.className = 'hlabel'; this.statusEl.style.cssText += ';left:50%;bottom:14px;top:auto;transform:translateX(-50%);font-size:12px;color:#ffe08a';
    this.labelLayer.appendChild(this.statusEl);
    this.setCam(0, true); this.t = 0; this.update(0);
  }
  _label(text, posFn, cls, item) {
    const d = document.createElement('div'); d.className = 'hlabel'; d.textContent = text; this.labelLayer.appendChild(d);
    this.labels.push({ d, posFn, item, text });
  }
  setCam(i, instant) { const c = this.sim.cams[i]; this.camIdx = i; this.camera.position.set(...c.pos); this.camera.up.set(0, 1, 0); this.camera.lookAt(this.target); this.render(); }
  update(t) {
    const T = this.T; this.t = t;
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'curve') {
        const pts = it.pts(t), a = obj.geometry.attributes.position; const n = Math.min(pts.length, a.count);
        for (let k = 0; k < n; k++) a.array.set(pts[k], 3 * k);
        a.needsUpdate = true; obj.geometry.setDrawRange(0, n);
      } else if (it.kind === 'point') {
        const p = it.pos(t); obj.visible = !!p; if (p) obj.position.set(...p);
        if (it.shape === 'aircraft' && p) { obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(p))); }
        if (it.statusColor) obj.material.color.set(it.statusColor(t));
        if (it.glow) obj.material.color.set(it.glow(t) ? '#ffffff' : it.color);
      } else if (it.kind === 'cloud') {
        const a = obj.geometry.attributes.position; it.fill(t, a.array, obj.geometry.attributes.color?.array); a.needsUpdate = true;
        if (obj.geometry.attributes.color) obj.geometry.attributes.color.needsUpdate = true;
      } else if (it.kind === 'beam') {
        const A = it.a(t), B = it.b(t), on = A && B && it.on(t); obj.visible = !!on;
        if (on) { const v = new T.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]); const L = v.length();
          obj.scale.set(1, L, 1); obj.position.set((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2);
          obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
          if (it.colorFn) { obj.material.color.set(it.colorFn(t)); obj.material.opacity = it.dashFn(t) ? 0.25 : 0.7; } }
      } else if (it.kind === 'flash') {
        const dt = t - it.t0; const on = dt > 0 && dt < (it.big ? 0.25 : 0.12);
        obj.visible = on; if (on) { const s = (it.big ? 0.35 : 0.08) * Math.sqrt(dt / (it.big ? 0.25 : 0.12)); obj.scale.setScalar(s + 0.01); obj.material.opacity = 0.85 * (1 - dt / (it.big ? 0.25 : 0.12)); }
      }
    }
    if (this.sim.cfg.spin) this.root.rotation.y = t * Math.PI * 2;
    if (this.statusEl) this.statusEl.textContent = this.status ? this.status.text(t) : '';
    this.render();
  }
  render() {
    if (!this.scene) return;
    this.renderer.render(this.scene, this.camera);
    // HTML labels with Earth occlusion
    const w = this.el.clientWidth, h = this.el.clientHeight, cam = this.camera.position, T = this.T;
    for (const L of this.labels) {
      let p = L.posFn(this.t); if (p && this.sim.cfg.spin) { const v = new T.Vector3(...p).applyMatrix4(this.root.matrixWorld); p = [v.x, v.y, v.z]; }
      if (!p) { L.d.style.display = 'none'; continue; }
      const occl = occluded([cam.x, cam.y, cam.z], p);
      const v = new T.Vector3(...p).project(this.camera);
      if (occl || v.z > 1) { L.d.style.display = 'none'; continue; }
      L.d.style.display = ''; L.d.style.left = ((v.x + 1) / 2 * w) + 'px'; L.d.style.top = ((1 - v.y) / 2 * h - 12) + 'px';
      if (L.item?.labelFn) { L.d.textContent = L.item.labelFn(this.t); L.d.style.color = L.item.statusColor(this.t); }
    }
  }
  play(onTick) {
    cancelAnimationFrame(this.raf); this.onTick = onTick; let last = performance.now();
    const loop = now => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (this.playing && !this.dragging) { let t = this.t + dt / this.sim.cfg.duration; if (t > 1.08) t = 0; this.update(Math.min(t, 1)); this.t = t; this.onTick?.(Math.min(t, 1)); }
    };
    this.raf = requestAnimationFrame(loop);
  }
  unload() {
    cancelAnimationFrame(this.raf);
    if (this.scene) {
      this.scene.traverse(o => { o.geometry?.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; ms.forEach(m => { m.map?.dispose(); m.dispose(); }); });
      this.scene.clear(); this.scene = null;
    }
    this.renderer.renderLists.dispose();
    if (this.labelLayer) this.labelLayer.innerHTML = '';
    this.labels = []; this.dyn = []; this.status = null; this.statusEl = null;
  }
  stillPNG(title, cite) {
    this.render();
    const c = document.createElement('canvas'); c.width = this.canvas.width; c.height = this.canvas.height;
    const g = c.getContext('2d'); g.fillStyle = '#070b17'; g.fillRect(0, 0, c.width, c.height); g.drawImage(this.canvas, 0, 0);
    const s = c.width / 1000; g.fillStyle = '#ffe08a'; g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
    g.fillText('Illustrative, not orbit-propagated · compressed radial scale', 14 * s, 24 * s);
    g.fillStyle = '#e9edf7'; g.font = `600 ${Math.round(18 * s)}px system-ui,sans-serif`; g.fillText(title, 14 * s, c.height - 34 * s);
    g.fillStyle = '#a9b3cc'; g.font = `${Math.round(12 * s)}px system-ui,sans-serif`; g.fillText(cite, 14 * s, c.height - 14 * s);
    return c.toDataURL('image/png');
  }
  memory() { return { ...this.renderer.info.memory, programs: this.renderer.info.programs?.length }; }
  _bindDrag() {
    const cv = this.canvas; let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', e => { this.dragging = true; sx = e.clientX; sy = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointerup', () => { this.dragging = false; });
    cv.addEventListener('pointercancel', () => { this.dragging = false; });
    cv.addEventListener('pointermove', e => {
      if (!this.dragging) return; const dx = (e.clientX - sx) * 0.006, dy = (e.clientY - sy) * 0.006; sx = e.clientX; sy = e.clientY;
      const p = this.camera.position, r = p.length(); let th = Math.atan2(p.x, p.z) - dx, ph = Math.acos(p.y / r) - dy;
      ph = Math.max(0.1, Math.min(Math.PI - 0.1, ph));
      p.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)); this.camera.lookAt(this.target); this.render();
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = this.camera.position; const r = Math.max(1.6, Math.min(12, p.length() * (1 + Math.sign(e.deltaY) * 0.08))); p.setLength(r); this.render(); }, { passive: false });
  }
}
function occluded(cam, p) {
  // Does the segment cam->p pass through the unit sphere before reaching p?
  const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]], L = len(d), u = scl(d, 1 / L);
  const b = dot(cam, u), c = dot(cam, cam) - 1, disc = b * b - c;
  if (disc < 0) return false; const t0 = -b - Math.sqrt(disc);
  return t0 > 0 && t0 < L - 1e-3;
}

// ---------------------------------------------------------------- SVG fallback (static)
export function renderSVG(sim, el, t = sim.still) {
  const W = el.clientWidth || 640, H = el.clientHeight || 420;
  const cam = sim.cams[0].pos, cl = toLL(cam);
  const R = Math.min(W, H) / (2 * Math.max(2.2, Math.max(...sim.items.filter(i => i.kind === 'shell').map(i => i.r), 1.4) + 0.25));
  const proj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([W / 2, H / 2]).scale(R).clipAngle(90);
  const dcam = norm(cam);
  // Project any 3D point: orthographic along camera dir, scaled by radius.
  const rot = d3.geoRotation([-cl.lon, -cl.lat]);
  const project = p => { const q = toLL(p); const [lo, la] = rot([q.lon, q.lat]); const x = Math.cos(la * DEG) * Math.sin(lo * DEG), y = Math.sin(la * DEG); const front = Math.cos(la * DEG) * Math.cos(lo * DEG);
    const sx = W / 2 + x * q.r * R, sy = H / 2 - y * q.r * R; const hidden = front < 0 && Math.hypot(x * q.r, y * q.r) < 1; return { x: sx, y: sy, hidden }; };
  const path = d3.geoPath(proj);
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${sim.cfg.title}: static diagram`);
  svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#070b17');
  for (const it of sim.items.filter(i => i.kind === 'shell')) {
    svg.append('circle').attr('cx', W / 2).attr('cy', H / 2).attr('r', it.r * R).attr('fill', it.color).attr('fill-opacity', 0.05).attr('stroke', it.color).attr('stroke-opacity', 0.45).attr('stroke-dasharray', '3 4');
    svg.append('text').attr('x', W / 2 + it.r * R * 0.71 + 4).attr('y', H / 2 - it.r * R * 0.71).attr('fill', '#dfe6f7').attr('font-size', 11).attr('font-family', 'system-ui').text(it.label);
  }
  svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', '#0d2a4d').attr('stroke', '#5aa0ff').attr('stroke-opacity', 0.4);
  svg.append('path').datum(d3.geoGraticule10()).attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(140,190,255,0.18)');
  const landGeo = { type: 'MultiPolygon', coordinates: (LAND || []).map(r => { const c = []; for (let k = 0; k < r.length; k += 2) c.push([r[k], r[k + 1]]); return [c.reverse()]; }) };
  svg.append('path').datum(landGeo).attr('d', path).attr('fill', '#2c5a4a');
  const g = svg.append('g').attr('font-family', 'system-ui').attr('font-size', 11);
  const label = (p, text, color = '#dfe6f7') => { if (!p || p.hidden) return; g.append('text').attr('x', p.x + 6).attr('y', p.y - 6).attr('fill', color).attr('paint-order', 'stroke').attr('stroke', '#070b17').attr('stroke-width', 3).text(text); };
  for (const it of sim.items) {
    if (it.kind === 'dome') g.append('path').datum(d3.geoCircle().center([it.at[1], it.at[0]]).radius(it.radius)()).attr('d', path).attr('fill', it.color).attr('fill-opacity', 0.35).attr('stroke', it.color);
    if (it.kind === 'curve') {
      const pts = it.pts(t).map(project); let seg = [];
      const flush = () => { if (seg.length > 1) g.append('path').attr('d', d3.line()(seg)).attr('fill', 'none').attr('stroke', it.color).attr('stroke-opacity', it.opacity ?? 1).attr('stroke-width', it.width || 1.2); seg = []; };
      pts.forEach(p => { if (p.hidden) flush(); else seg.push([p.x, p.y]); }); flush();
      if (it.label && it.labelAt && pts.length > 2) label(project(it.labelAt), it.label, it.color);
    }
    if (it.kind === 'cloud') {
      const arr = new Float32Array(it.n * 3), col = it.colored ? new Float32Array(it.n * 3) : null; it.fill(t, arr, col);
      const step = Math.max(1, Math.floor(it.n / 900));
      for (let k = 0; k < it.n; k += step) { if (!arr[3 * k] && !arr[3 * k + 1] && !arr[3 * k + 2]) continue; const p = project([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]); if (p.hidden) continue;
        g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 1.3).attr('fill', col ? d3.rgb(col[3 * k] * 255, col[3 * k + 1] * 255, col[3 * k + 2] * 255) : it.color).attr('fill-opacity', 0.85); }
      if (it.label) label(project(it.labelAt || [arr[0], arr[1], arr[2]]), it.label, it.color || '#dfe6f7');
    }
    if (it.kind === 'beam') { const A = it.a(t), B = it.b(t); if (A && B && it.on(t)) { const a = project(A), b = project(B); if (!a.hidden && !b.hidden) g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y).attr('stroke', it.colorFn ? it.colorFn(t) : it.color).attr('stroke-opacity', it.opacity ?? 0.8).attr('stroke-dasharray', it.dashFn?.(t) ? '3 3' : null).attr('stroke-width', it.width ? 3 : 1.2); } }
    if (it.kind === 'point') { const q = it.pos(t); if (!q) continue; const p = project(q); if (p.hidden) continue;
      const c = it.statusColor ? it.statusColor(t) : it.color;
      if (it.shape === 'sat') g.append('rect').attr('x', p.x - (it.small ? 2 : 4)).attr('y', p.y - (it.small ? 2 : 4)).attr('width', it.small ? 4 : 8).attr('height', it.small ? 4 : 8).attr('fill', c);
      else if (it.shape === 'aircraft') g.append('path').attr('d', `M${p.x},${p.y - 6}L${p.x + 4},${p.y + 4}L${p.x - 4},${p.y + 4}Z`).attr('fill', c);
      else g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 3.5).attr('fill', c);
      if (it.label) label(p, it.labelFn ? it.labelFn(t) : it.label, c); }
    if (it.kind === 'flash' && it.big) { const p = project(it.pos); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 9).attr('fill', '#fff3c4').attr('fill-opacity', 0.8); label(p, it.label, '#fff3c4'); }
    if (it.kind === 'status') g.append('text').attr('x', W / 2).attr('y', H - 14).attr('text-anchor', 'middle').attr('fill', '#ffe08a').text(it.text(t));
  }
  svg.append('text').attr('x', 12).attr('y', H - 12).attr('fill', '#a9b3cc').attr('font-size', 10.5).attr('font-family', 'system-ui').text('Static diagram · illustrative, not orbit-propagated · compressed radial scale');
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  return svg.node();
}
