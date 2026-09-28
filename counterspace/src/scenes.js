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

// Screen-space label de-confliction shared by the live HTML labels, the PNG still and the SVG fallback.
// list[i] = {x, y (preferred centre), px, py (object point), w, h, fixed} or null.
// Returns placements {x, y, leader, ax, ay, qx, qy}. Fixed labels are placed first; others are nudged
// up/down/sideways to the nearest free slot, clamped inside the frame, and given a leader line to the object.
export function placeLabels(list, W, H, reserved = []) {
  const boxes = reserved.map(r => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, w: r[2], h: r[3] }));
  const out = new Array(list.length).fill(null);
  const order = list.map((_, i) => i).sort((a, b) => ((list[b] && list[b].fixed) ? 1 : 0) - ((list[a] && list[a].fixed) ? 1 : 0) || a - b);
  for (const i of order) {
    const c = list[i]; if (!c) continue;
    const { w, h } = c, gap = 3;
    const cx = x => Math.max(w / 2 + 3, Math.min(W - w / 2 - 3, x)), cy = y => Math.max(h / 2 + 3, Math.min(H - h / 2 - 3, y));
    const hits = (x, y) => boxes.reduce((n, b) => n + (Math.abs(x - b.x) < (w + b.w) / 2 + gap && Math.abs(y - b.y) < (h + b.h) / 2 + 1 ? 1 : 0), 0);
    const cand = [[0, 0]];
    for (let k = 1; k <= 8; k++) cand.push([0, -k * h * 1.12], [0, k * h * 1.12]);
    for (const j of [0, -1, 1, -2, 2, -3, 3]) { cand.push([w * 0.55 + 14, j * h * 1.12], [-(w * 0.55 + 14), j * h * 1.12]); }
    let best = null, bestN = 1e9;
    for (const [dx, dy] of cand) { const x = cx(c.x + dx), y = cy(c.y + dy), n = hits(x, y) * 1000 + Math.hypot(x - c.x, y - c.y) * 0.01; if (n < bestN) { best = [x, y]; bestN = n; if (n < 1) break; } }
    const [x, y] = best; boxes.push({ x, y, w, h });
    const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)), qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py));
    out[i] = { x, y, leader: Math.hypot(qx - c.px, qy - c.py) > h * 0.9, ax: c.px, ay: c.py, qx, qy };
  }
  return out;
}
const labelW = (text, u = 1) => (text.length * 6.3 + 14) * u;

// ---------------------------------------------------------------- configs
const C = { tgt: '#ffd166', int: '#ff6b6b', debris: '#ffb38a', iss: '#8cc8ff', gps: '#9be7c4', jam: '#ff5d5d', ok: '#6ee7a8', laser: '#ff4fd8', geo: '#ffcf6e', belt: '#b28cff', ground: '#e9edf7' };

export const SCENES = [
  { id: 'starfish', date: '1962-07-09', title: 'Starfish Prime (1962)', shells: ['LEO'], duration: 14,
    caption: 'A 1.4-megaton warhead detonates about 400 km above Johnston Island. Electrons from the blast are trapped by Earth’s magnetic field. They spread along field lines and drift around the planet, forming an artificial radiation belt that damaged several satellites in the following months.',
    cite: 'DOE/NV-209 Rev. 16 (Starfish Prime, 9 July 1962).', related: 'ltbt-1963', event: 'us-1962-starfish-prime',
    actors: [
      { type: 'site', at: [16.7, -169.5], label: 'Johnston Island', color: C.ground, dx: -84, dy: 40 },
      { type: 'suborbital', from: [16.7, -169.5], to: [16.5, -169.0], apex: 400, t0: 0.02, t1: 0.14, color: C.int, label: 'Thor launch', dx: -96, dy: 4 },
      { type: 'flash', at: [16.5, -169.2, 400], t0: 0.14, color: '#fff3c4', label: 'Detonation ~400 km', dx: 34, dy: -34 },
      { type: 'field', lon: -169.2, Ls: [1.18, 1.4, 1.7], color: '#c9b0ff', t0: 0.14 },
      { type: 'belt', at: [16.5, -169.2], L: [1.12, 1.7], t0: 0.18, t1: 0.9, count: 2600, color: C.belt, size: 0.02, label: 'Artificial radiation belt' },
      { type: 'ring', alt: 800, inc: 44.8, raan: 40, color: '#8cc8ff', sat: { phase: 0, speed: 2.2, label: 'Satellite in belt' } },
    ], still: 0.7, camDist: 3.5, status: [[0, 'Thor rocket climbs toward ~400 km'], [0.14, 'Detonation: electrons trapped on Earth’s field lines'], [0.3, 'Trapped electrons spread in longitude and latitude along field lines'], [0.75, 'Belt has drifted around Earth (illustrative spread)']] },
  { id: 'solwind', date: '1985-09-13', title: 'ASM-135 vs. Solwind (1985)', shells: ['LEO'], duration: 12,
    caption: 'An F-15 climbs over the Pacific and releases an ASM-135 missile. The missile’s miniature homing vehicle rises to meet the Solwind P78-1 satellite at about 530 km and destroys it by collision. SWF counts 285 tracked fragments; all have since decayed.',
    cite: 'SWF 2026, Table 5-1, p. 05-01; Table 1-4, p. 01-24.', related: null, event: 'us-1985-solwind',
    camScale: 1.2, hit: { lat: 37.5, lon: -135.0, alt: 530, inc: 97.6, t: 0.5, wa: 0.15, wf: 0.5 },
    actors: [
      { type: 'aircraft', path: [[32.5, -114.0], [35.0, -124.0]], alt: 12, t0: 0.0, t1: 0.24, label: 'F-15 zoom climb' },
      { type: 'target', label: 'Solwind P78-1', color: C.tgt, big: true },
      { type: 'intercept', from: 'aircraft', t0: 0.24, color: C.int, label: 'ASM-135' },
      { type: 'debris', count: 285, spreadAlt: 120, spreadInc: 0.9, dv: 0.6, decay: 0.9, color: C.debris },
    ], still: 0.56, status: [[0, 'F-15 climbs over the Pacific'], [0.24, 'Missile released; homing vehicle rises to the satellite'], [0.5, 'Collision at ~530 km; fragments spread and decay'], [0.75, 'Time compressed: SWF counts 285 tracked fragments, all since decayed']] },
  { id: 'fengyun', date: '2007-01-11', title: 'Fengyun-1C (2007)', shells: ['LEO'], duration: 16,
    caption: 'China’s SC-19 interceptor strikes the Fengyun-1C weather satellite at about 880 km (SWF Table 5-1). At that altitude, fragments stay up for decades. They spread along the old orbit into a ring around the planet. It remains the largest debris-generating event on record.',
    cite: 'SWF 2026, Table 5-1, p. 05-01 (3,532 cataloged; 2,351 in orbit as of Feb. 2026).', related: 'unga-77-41', event: 'cn-2007-fy1c',
    hit: { lat: 35.5, lon: 106.5, alt: 880, inc: 98.6, t: 0.3, wa: 0.4 }, launchCam: 'second', noSimCount: true,
    actors: [
      { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
      { type: 'target', label: 'Fengyun-1C', color: C.tgt, big: true },
      { type: 'intercept', from: [28.2, 102.0], t0: 0.14, color: C.int, label: 'SC-19' },
      { type: 'debris', count: 3532, spreadAlt: 260, spreadInc: 1.1, dv: 0.9, decay: 0, color: C.debris, label: 'Debris ring' },
    ], still: 0.85,
    status: [[0, 'SC-19 rises toward Fengyun-1C'], [0.3, 'Collision at ~880 km: debris spreads along the old orbit'], [0.6, 'Ring forms · SWF: 2,351 of 3,532 cataloged pieces still in orbit (Feb. 2026)']] },
  { id: 'burnt-frost', date: '2008-02-20', title: 'Burnt Frost: SM-3 vs. USA-193 (2008)', shells: ['LEO'], duration: 12,
    caption: 'A US Navy cruiser fires a modified SM-3 missile-defense interceptor at the failing USA-193 satellite at about 220 km. The low altitude sped up decay: SWF says the 175 trackable pieces took about 20 months to de-orbit entirely (the animation compresses that time). SWF’s text gives the intercept altitude as 240 km, while its Table 5-1 lists 220 km. The event shows the overlap between missile defense and anti-satellite capability.',
    cite: 'SWF 2026, Table 5-1, p. 05-01 (175 cataloged; 0 in orbit); decay time and 240 km in text, p. 01-24.', related: null, event: 'us-2008-burnt-frost',
    camScale: 1.15, hit: { lat: 29.0, lon: -173.0, alt: 220, inc: 58.5, t: 0.42, wa: 0.15, wf: 0.5 },
    actors: [
      { type: 'ship', at: [22.0, -163.0], label: 'USS Lake Erie' },
      { type: 'target', label: 'USA-193', color: C.tgt, big: true },
      { type: 'intercept', from: [22.0, -163.0], t0: 0.2, color: C.int, label: 'SM-3' },
      { type: 'debris', count: 175, spreadAlt: 70, spreadInc: 1.0, dv: 0.6, decay: 4.5, color: C.debris },
    ], still: 0.47, status: [[0, 'Interceptor rises toward the satellite'], [0.42, 'Collision at ~220 km; low-altitude fragments decay quickly'], [0.6, 'Time compressed: SWF reports ~20 months to de-orbit entirely']] },
  { id: 'dn2', date: '2013-05-13', title: 'DN-2 “high-altitude science” launch (2013)', shells: ['LEO', 'MEO', 'GEO'], duration: 14,
    caption: 'A rocket from Xichang climbs on a suborbital path toward the geostationary belt and falls back over the Indian Ocean. China said it reached 10,000 km. US officials said it went nearly to GEO. SWF cites an analysis putting the apogee at 30,000 km or more. There was no target. The launch showed reach, not an intercept.',
    cite: 'SWF 2026, pp. 03-20, 03-22.', related: null, event: 'cn-2013-dn2',
    actors: [
      { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
      { type: 'suborbital', from: [28.2, 102.0], to: [-20.0, 78.0], apex: 30000, t0: 0.05, t1: 0.9, color: '#ff7a7a', thick: 0.011, label: 'DN-2 path (no target: not an intercept)', labelIdx: 0.12, dx: -40, dy: -50, head: true, apexT: 0.47,
        marks: [{ alt: 10000, label: '10,000 km: China’s stated figure', short: '10,000 km · China', color: '#ffd9a0', dx: -70, dy: 52 }, { alt: 30000, label: 'Apogee ≥30,000 km (analysis cited by SWF)', short: '≥30,000 km · SWF-cited', color: '#ff9c9c', apex: true, dx: -96, dy: -58 }, { alt: GEO_ALT, label: 'GEO ring · 35,786 km', short: 'GEO · 35,786 km', color: C.geo, dx: 24, dy: 58 }] },
      { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, thick: 0.012, opacity: 0.95, sats: 10 },
    ], still: 0.62, camDist: 7.5, status: [[0, 'Rocket climbs from Xichang on a suborbital path'], [0.4, 'Analysis cited by SWF: apogee ≥30,000 km, toward GEO (35,786 km)'], [0.8, 'Falls back over the Indian Ocean · no target: reach, not an intercept']], shellLabels: { MEO: null, GEO: null },
    cameras: [{ name: 'Profile', at: [9, 2, 4.9], look: [4, 91, 1.45] }, { name: 'Polar', at: [78, 80, 8.4] }, { name: 'Zoom', at: [20, 45, 5.6] }] },
  { id: 'shakti', date: '2019-03-27', title: 'Mission Shakti (2019)', shells: ['LEO'], duration: 12,
    caption: 'India’s PDV Mk-II interceptor destroys the Microsat-R satellite at about 300 km. Indian officials said the debris would re-enter within 45 days. SWF counts 130 cataloged fragments, none still in orbit.',
    cite: 'SWF 2026, Table 5-1, p. 05-01; p. 04-03.', related: 'unga-77-41', event: 'in-2019-shakti',
    camScale: 1.45, hit: { lat: 26.0, lon: 95.0, alt: 300, inc: 96.6, t: 0.38, wa: 0.15, wf: 0.5 },
    actors: [
      { type: 'site', at: [20.75, 87.08], label: 'Abdul Kalam Island', color: C.ground },
      { type: 'target', label: 'Microsat-R', color: C.tgt, big: true },
      { type: 'intercept', from: [20.75, 87.08], t0: 0.16, color: C.int, label: 'PDV Mk-II' },
      { type: 'debris', count: 130, spreadAlt: 110, spreadInc: 1.0, dv: 0.6, decay: 2.4, color: C.debris },
    ], still: 0.43, status: [[0, 'PDV Mk-II rises from Abdul Kalam Island'], [0.38, 'Collision at ~300 km; fragments spread and decay quickly'], [0.65, 'Time compressed: SWF counts 130 cataloged pieces, none still in orbit']] },
  { id: 'cosmos1408', date: '2021-11-15', title: 'Nudol vs. Cosmos 1408 (2021)', shells: ['LEO'], duration: 16,
    caption: 'Russia’s Nudol interceptor destroys the defunct Cosmos 1408 at about 470 km. The debris cloud spreads across altitudes that cross the International Space Station’s orbit (about 420 km), and the ISS crew sheltered in their docked spacecraft. SWF counts 1,807 cataloged fragments, 5 still in orbit as of February 2026.',
    cite: 'SWF 2026, Table 5-1, p. 05-01; Table 2-4, p. 02-21.', related: 'us-moratorium-2022', event: 'ru-2021-cosmos1408',
    hit: { lat: 66.0, lon: 52.0, alt: 470, inc: 82.6, t: 0.3, wa: 0.4, wf: 0.6 }, launchCam: 'second', noSimCount: true,
    actors: [
      { type: 'site', at: [62.9, 40.6], label: 'Plesetsk', color: C.ground },
      { type: 'ring', alt: 420, inc: 51.6, color: C.iss, crossHit: 0.55, thick: 0.0032, opacity: 0.85, sat: { speed: 0.16, label: 'ISS (~420 km)', big: 1.7 } },
      { type: 'target', label: 'Cosmos 1408', color: C.tgt, big: true },
      { type: 'intercept', from: [62.9, 40.6], t0: 0.17, color: C.int, label: 'Nudol' },
      { type: 'debris', count: 1807, spreadAlt: 150, spreadInc: 1.0, dv: 0.6, decay: 0.25, color: C.debris },
    ], still: 0.8,
    status: [[0, 'Nudol rises toward Cosmos 1408; the ISS orbits below (~420 km)'], [0.3, 'Collision at ~470 km: debris cloud spreads across the ISS orbit'], [0.6, 'Cloud crosses the ISS altitude · SWF: 5 of 1,807 cataloged pieces still in orbit (Feb. 2026)']] },
  { id: 'gnss', date: '2023-12-01', title: 'GNSS jamming over the Baltic', shells: ['LEO', 'MEO'], shellLabels: { MEO: 'MEO ~20,200 km' }, duration: 16,
    caption: 'GPS satellites orbit about 20,200 km up. A jammer on the ground swamps their weak signals only inside its local effect zone. Aircraft crossing the zone lose their position fix, while aircraft outside it and the satellites themselves are unaffected. This is interference with receivers, not an attack on a satellite.',
    cite: 'SWF 2026, pp. 02-29 to 02-30; p. 12-05 (downlink jamming has no effect on the satellites).', related: 'icao-2025', event: 'ru-2023-baltic',
    actors: [
      { type: 'constellation', alt: 20200, inc: 55, planes: 6, per: 3, color: C.gps, speed: 0.25, label: 'GPS satellites' },
      { type: 'zone', at: [57.5, 21.0], radius: 5, color: C.jam, label: 'Jammer effect zone', dx: 78, dy: -36 },
      { type: 'aircraft', path: [[53.0, 8.0], [61.0, 32.0]], alt: 11, t0: 0, t1: 1, label: 'Airliner A', gnss: true, dx: -96, dy: -14 },
      { type: 'aircraft', path: [[44.0, 0.0], [46.5, 30.0]], alt: 11, t0: 0, t1: 1, label: 'Airliner B', gnss: true, labelDy: 34, dx: 92 },
    ], still: 0.45, camDist: 3.5, focus: [55, 18], status: [[0, 'Both airliners have GNSS (green) · jammer zone in red · satellites unaffected'], [0.3, 'Inside the zone GNSS is lost (red); outside it stays OK (green). Satellites unaffected']] },
  { id: 'viasat', date: '2022-02-24', title: 'Viasat KA-SAT cyberattack (2022)', shells: ['GEO'], duration: 14,
    caption: 'Within hours of Russian troops crossing into Ukraine in February 2022, attackers pushed destructive “AcidRain” malware through KA-SAT’s ground management network. Tens of thousands of user modems in Ukraine and across Europe went dark. The satellite itself kept working: the attack hit the ground segment.',
    cite: 'SWF 2026, pp. 15-06 to 15-07 (attributed to Russia by the US, UK and EU, May 2022).', related: 'tallinn-2017', event: 'ru-2022-viasat',
    actors: [
      { type: 'geo', lon: 9, label: 'KA-SAT (GEO, unaffected)', color: C.geo, beams: [[50, 30], [48, 10], [52, 0], [46, 20], [55, 15]] },
      { type: 'terminals', boxes: [[44, 52, 22, 40, 0.55], [43, 56, -5, 22, 0.45]], count: 900, t0: 0.3, t1: 0.62, label: 'Ground terminals (modems)' },
          { type: 'flash', at: [49, 20, 0], t0: 0.3, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.42, span: 0.3 },
    ], still: 0.75, camDist: 4.9, focus: [33, 12], shellLabels: { GEO: null } },
  { id: 'laser', date: '1997-10-17', title: 'MIRACL laser test on MSTI-3 (1997)', shells: ['LEO'], duration: 12,
    caption: 'In October 1997 the US fired the MIRACL chemical laser at MSTI-3, a retired US Air Force experimental satellite that carried infrared sensors. MIRACL is now part of a test facility at White Sands Missile Range, New Mexico, where this diagram places the site. A low-power beam can dazzle a satellite’s optical sensor; a high-power beam could damage it. Russia says its Peresvet system is built to dazzle satellites.',
    cite: 'SWF 2026, p. 01-35 (MIRACL); p. 02-35 (Peresvet).', related: null, event: 'us-1997-miracl',
    hit: { lat: 32.4, lon: -106.4, alt: 420, inc: 97.0, t: 0.5, wa: 0.3, wf: 0.3 },
    actors: [
      { type: 'site', at: [32.4, -106.4], label: 'White Sands Missile Range, NM', color: C.ground },
      { type: 'target', label: 'MSTI-3 (US test target)', color: C.tgt, noHit: true, big: true },
      { type: 'beam', from: [32.4, -106.4], window: 0.42, color: C.laser, label: 'Laser beam' },
    ], still: 0.5,
    status: [[0, 'MSTI-3 rises over White Sands'], [0.15, 'MIRACL beam tracks the satellite while it is above the horizon'], [0.8, 'Same principle: SWF describes Russia’s Peresvet (named in 2018) as a mobile laser dazzler']], cameras: [{ name: 'Side view', at: [33, -158, 2.7], look: [33, -110, 1.12] }, { name: 'Zoom', at: [36, -146, 1.9], look: [33, -108, 1.15] }, { name: 'Overhead', at: [60, -106, 3.0] }] },
];
export const HERO = { id: 'hero', title: 'Overview', shells: ['LEO', 'MEO', 'GEO'], duration: 40, spin: true,
  shellLabels: { LEO: 'LEO ≤2,000 km', MEO: 'MEO · GPS ~20,200 km', GEO: 'GEO ~35,786 km' }, shellAng: { LEO: 205, MEO: 12, GEO: 62 }, shellOff: { LEO: [-150, 50], MEO: [120, 24], GEO: [70, -40] },
  actors: [
    { type: 'ring', alt: 420, inc: 51.6, raan: 30, color: C.iss, sat: { phase: 0, speed: 3, label: 'ISS ~420 km', dx: -30, dy: 46 } },
    { type: 'constellation', alt: 20200, inc: 55, planes: 6, per: 3, color: C.gps, speed: 0.4 },
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, sats: 14 },
  ], still: 0.2, camDist: 7.2, focus: [22, -30] };

// ---------------------------------------------------------------- simulator
// Items: {kind, ...} with time functions. Kinds: shell, curve, point, cloud, beam, dome, flash.
export function buildSim(cfg) {
  const items = [];
  const rnd = mulberry(cfg.id.length * 7919 + 17);
  const shellDefs = { LEO: [2000, '#78a8ff', 'LEO ≤2,000 km'], MEO: [20200, '#a88cff', 'MEO (GPS)'], GEO: [GEO_ALT, '#ffcf6e', 'GEO'] };
  const sl = cfg.shellLabels || {}, sa = cfg.shellAng || {}, angDef = { LEO: 150, MEO: 38, GEO: 60 };
  (cfg.shells || []).forEach(s => items.push({ kind: 'shell', r: rAlt(shellDefs[s][0]), color: shellDefs[s][1], label: s in sl ? sl[s] : shellDefs[s][2], ang: sa[s] ?? angDef[s], dx: cfg.shellOff?.[s]?.[0] ?? 0, dy: cfg.shellOff?.[s]?.[1] ?? 0 }));
  let tgt = null, focus = cfg.focus || null;
  const H = cfg.hit;
  if (H) {
    const o = orbitThrough(H.lat, H.lon, H.inc);
    const wBase = 2 * Math.PI * 0.9 * Math.sqrt(1 / Math.pow(rAlt(H.alt), 3));
    // Approach speed (wa) and post-impact drift (wf) are scaled so the target stays in view before the hit (illustrative).
    tgt = { ...H, raan: o.raan, uHit: o.u, w: wBase * (H.wf ?? 1), wa: wBase * (H.wa ?? 0.4) };
    tgt.pos = t => orbitPos(H.alt, H.inc, tgt.raan, tgt.uHit + (t < H.t ? tgt.wa : tgt.w) * (t - H.t));
    tgt.hitPos = tgt.pos(H.t);
    focus = focus || [H.lat, H.lon];
  }
  let aircraftPos = null;
  if (cfg.status) items.push({ kind: 'status', text: t => { let s = cfg.status[0][1]; for (const [t0, tx] of cfg.status) if (t >= t0) s = tx; const c = items._decayCloud; return c && !cfg.noSimCount && tgt && t >= tgt.t ? `${s} · ${c.vis} of ${c.n} simulated pieces aloft` : s; } });
  for (const a of cfg.actors) {
    if (a.type === 'site') items.push({ kind: 'point', shape: 'site', pos: () => ll(a.at[0], a.at[1], 1.003), color: a.color, label: a.label, labelDx: a.dx, labelDy: a.dy });
    if (a.type === 'ship') items.push({ kind: 'point', shape: 'ship', pos: () => ll(a.at[0], a.at[1], 1.004), color: '#cfd8ea', label: a.label });
    if (a.type === 'ring') {
      let raan = a.raan, phase = a.sat?.phase ?? 0;
      if (a.crossHit && tgt) { // orbit that crosses the target's orbit a little before the hit point, with the satellite passing that crossing mid-scene
        const X = toLL(orbitPos(tgt.alt, tgt.inc, tgt.raan, tgt.uHit - a.crossHit)), oc = orbitThrough(X.lat, X.lon, a.inc);
        raan = oc.raan; phase = oc.u - 0.5 * 2 * Math.PI * (a.sat?.speed ?? 0); items._cross = ll(X.lat, X.lon, rAlt(a.alt));
      }
      const pts = []; for (let k = 0; k <= 180; k++) pts.push(orbitPos(a.alt, a.inc, raan, k / 180 * 2 * Math.PI));
      items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: a.opacity ?? 0.55, thick: a.thick, label: a.label, labelAt: pts[a.sat ? 118 : 45] });
      if (a.sat) items.push({ kind: 'point', shape: 'sat', color: a.color, label: a.sat.label, labelDx: a.sat.dx, labelDy: a.sat.dy, scale: a.sat.big, pos: t => orbitPos(a.alt, a.inc, raan, phase + t * 2 * Math.PI * a.sat.speed) });
      if (a.sats) for (let s = 0; s < a.sats; s++) { const ph = s / a.sats * 2 * Math.PI; items.push({ kind: 'point', shape: 'sat', small: true, color: a.color, pos: () => orbitPos(a.alt, a.inc, a.raan, ph) }); }
    }
    if (a.type === 'target' && tgt) {
      const pts = []; for (let k = 0; k <= 180; k++) pts.push(orbitPos(tgt.alt, tgt.inc, tgt.raan, k / 180 * 2 * Math.PI));
      items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.35 });
      items.push({ kind: 'point', shape: 'sat', color: a.color, label: a.label, scale: a.big ? 1.3 : null,
        pos: t => (a.noHit || t <= tgt.t) ? tgt.pos(t) : null,
        glow: a.noHit ? (t => Math.abs(t - tgt.t) < 0.08) : null });
    }
    if (a.type === 'aircraft') {
      const r = 1.012 + a.alt / 6371;
      const P = s => { const la = lerp(a.path[0][0], a.path[1][0], s), lo = lerp(a.path[0][1], a.path[1][1], s); return ll(la, lo, r); };
      const pos = t => (t >= a.t0 - 1e-6 && t <= a.t1 + 1e-6) ? P(clamp01((t - a.t0) / (a.t1 - a.t0))) : (t > a.t1 && !a.gnss ? null : null);
      const item = { kind: 'point', shape: 'aircraft', scale: a.gnss ? null : 0.6, color: '#e9edf7', label: a.label, labelDy: a.labelDy, labelDx: a.dx, pos: t => pos(Math.min(t, a.t1)) };
      if (!a.gnss) {
        aircraftPos = t => P(clamp01((Math.min(t, a.t1) - a.t0) / (a.t1 - a.t0)));
        // Climb: altitude rises along the path (exaggerated) and a trail shows where the F-15 has been.
        const Pc = s => { const la = lerp(a.path[0][0], a.path[1][0], s), lo = lerp(a.path[0][1], a.path[1][1], s); return ll(la, lo, r + 0.03 * s); };
        aircraftPos = t => Pc(clamp01((Math.min(t, a.t1) - a.t0) / (a.t1 - a.t0)));
        item.pos = t => t >= a.t0 - 1e-6 ? aircraftPos(t) : null;
        const all = []; for (let k = 0; k <= 30; k++) all.push(Pc(k / 30));
        items.push({ kind: 'curve', dynamic: true, all, thick: 0.004, color: '#e9edf7', width: 2, pts: t => { const s = clamp01((t - a.t0) / (a.t1 - a.t0)); return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * 30) + 1)); } });
      }
      if (a.gnss) items.push({ kind: 'curve', pts: () => { const q = []; for (let k = 0; k <= 30; k++) q.push(P(k / 30)); return q; }, color: '#cfd8ea', opacity: 0.4 });
      if (a.gnss) { item.gnss = true; item.path = a.path; }
      items.push(item);
    }
    if (a.type === 'intercept' && tgt) {
      const from = a.from === 'aircraft' ? aircraftPos(a.t0) : ll(a.from[0], a.from[1], 1.005);
      const to = tgt.hitPos;
      const mid = norm(add(from, to)); const ctrl = scl(mid, Math.max(len(from), len(to)) + 0.2);
      const bez = s => add(add(scl(from, (1 - s) * (1 - s)), scl(ctrl, 2 * (1 - s) * s)), scl(to, s * s));
      const N = 60, all = []; for (let k = 0; k <= N; k++) all.push(bez(k / N));
      items._arc = { from, to, mid: bez(0.5) };
      // Faint predicted path (whole arc, always visible) under the bright growing trail.
      items.push({ kind: 'curve', pts: () => all, color: a.color, opacity: 0.32, thick: 0.0028 });
      items.push({ kind: 'curve', dynamic: true, all, thick: 0.0065, color: a.color, width: 2, label: a.label, labelAt: bez(0.5),
        pts: t => { const s = clamp01((t - a.t0) / (tgt.t - a.t0)); return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1)); } });
      items.push({ kind: 'point', shape: 'kv', color: a.color, pos: t => (t > a.t0 && t < tgt.t) ? bez(clamp01((t - a.t0) / (tgt.t - a.t0))) : null });
      items.push({ kind: 'flash', pos: to, t0: tgt.t, color: '#fff1c1', big: true, size: 0.3, span: 0.16 });
    }
    if (a.type === 'debris' && tgt) {
      const n = Math.min(a.count, PARTICLE_BUDGET);
      const P = []; for (let k = 0; k < n; k++) P.push({ da: gauss(rnd) * a.spreadAlt, di: gauss(rnd) * a.spreadInc, dr: gauss(rnd) * 0.4, dw: 1 + gauss(rnd) * a.dv, du: gauss(rnd) * 0.02, dec: a.decay * (0.4 + rnd() * 1.4) });
      const cloud = { kind: 'cloud', n, color: a.color, size: n > 2000 ? 0.012 : n > 400 ? 0.018 : 0.03, label: a.label, vis: 0,
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
          cloud.vis = vis; return vis;
        } };
      items.push(cloud); if (a.decay > 0) items._decayCloud = cloud;
      if (a.decay > 0 && !cfg.status) items.push({ kind: 'status', text: t => t < tgt.t ? 'Approaching intercept' : `Illustrative fragments still aloft: ${cloud.vis} of ${n} (decay time-compressed)` });
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
      items.push({ kind: 'curve', dynamic: true, all, thick: a.thick, color: a.color, width: 2, label: a.label, labelDx: a.dx, labelDy: a.dy, labelAt: all[Math.round(N * (a.labelIdx ?? 0.5))],
        pts: t => { const s = clamp01((t - a.t0) / (a.t1 - a.t0)); return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1)); } });
      if (a.marks) { // altitude ruler along the apogee direction: ticks at stated/analysed altitudes + GEO
        const d = norm(all[N >> 1]), tApex = a.t0 + (a.t1 - a.t0) * (a.apexT ?? 0.5);
        items.push({ kind: 'curve', pts: () => [scl(d, 1), scl(d, rAlt(GEO_ALT) * 1.02)], color: '#dfe6f7', opacity: 0.5 });
        a.marks.forEach(m => items.push({ kind: 'point', shape: 'tick', color: m.color, label: m.label, short: m.short, labelDx: m.dx ?? 0, labelDy: m.dy ?? 0, pos: t => (m.apex && t < tApex) ? null : scl(d, rAlt(m.alt)) }));
      }
      if (a.head) items.push({ kind: 'point', shape: 'kv', color: a.color, pos: t => { const s = clamp01((t - a.t0) / (a.t1 - a.t0)); return s > 0 && s < 1 ? all[Math.round(s * N)] : null; } });
      focus = focus || a.from;
    }
    if (a.type === 'flash') items.push({ kind: 'flash', pos: ll(a.at[0], a.at[1], rAlt(a.at[2])), t0: a.t0, color: a.color, big: true, size: a.size, span: a.span, ringColor: a.ringColor, label: a.label, labelDx: a.dx, labelDy: a.dy });
    if (a.type === 'belt') {
      const n = Math.min(a.count, PARTICLE_BUDGET);
      const P = []; for (let k = 0; k < n; k++) { const L = lerp(a.L[0], a.L[1], rnd()); const lm = Math.acos(Math.sqrt(1 / L)) / DEG; P.push({ L, lat: (rnd() * 2 - 1) * lm * 0.95, side: rnd() * 2 - 1, j: rnd() }); }
      items.push({ kind: 'cloud', n, color: a.color, size: a.size ?? 0.014, label: a.label, labelAt: ll(0, a.at[1] + 70, 1.7), labelDx: 60, labelDy: 30,
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
    if (a.type === 'field') {
      a.Ls.forEach(L => { const pts = [], lm = Math.acos(Math.sqrt(1 / L)) * 0.98;
        for (let k = 0; k <= 60; k++) { const la = -lm + 2 * lm * k / 60, rr = L * Math.cos(la) ** 2; pts.push(ll(la / DEG, a.lon, rAlt((rr - 1) * 6371))); }
        items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.6, thick: 0.0035 }); });
    }
    if (a.type === 'constellation') {
      const sats = [];
      for (let p = 0; p < a.planes; p++) {
        const raan = p * 360 / a.planes, pts = [];
        for (let k = 0; k <= 120; k++) pts.push(orbitPos(a.alt, a.inc, raan, k / 120 * 2 * Math.PI));
        items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.13, label: p === 0 ? a.label : null, labelAt: pts[20] });
        for (let s = 0; s < a.per; s++) { const ph = s / a.per * 2 * Math.PI + p * 0.5; const pos = t => orbitPos(a.alt, a.inc, raan, ph + t * a.speed * 2 * Math.PI); sats.push(pos); items.push({ kind: 'point', shape: 'sat', small: true, color: a.color, pos }); }
      }
      items._gps = sats;
    }
    if (a.type === 'zone') { items.push({ kind: 'dome', at: a.at, radius: a.radius, color: a.color, label: a.label, labelDx: a.dx, labelDy: a.dy }); items._zone = a;
      const c = ll(a.at[0], a.at[1]), e1 = norm([c[2], 0, -c[0]]), e2 = [c[1] * e1[2] - c[2] * e1[1], c[2] * e1[0] - c[0] * e1[2], c[0] * e1[1] - c[1] * e1[0]], q = [], rho = a.radius * DEG;
      for (let k = 0; k <= 72; k++) { const th = k / 72 * 2 * Math.PI; q.push(add(scl(c, Math.cos(rho) * 1.006), scl(add(scl(e1, Math.cos(th)), scl(e2, Math.sin(th))), Math.sin(rho) * 1.006))); }
      items.push({ kind: 'curve', pts: () => q, color: '#ff8080', opacity: 1, thick: 0.004 }); }
    if (a.type === 'geo') {
      const g = ll(0, a.lon, rAlt(GEO_ALT));
      items.push({ kind: 'point', shape: 'sat', color: a.color, label: a.label, labelDy: -30, pos: () => g });
      a.beams.forEach(b => items.push({ kind: 'beam', a: () => g, b: () => ll(b[0], b[1], 1.003), on: () => true, color: a.color, opacity: 0.35 }));
      focus = focus || [30, a.lon];
    }
    if (a.type === 'terminals') {
      const P = [];
      a.boxes.forEach(([la0, la1, lo0, lo1, frac], bi) => { const m = Math.round(a.count * frac); for (let k = 0; k < m; k++) P.push({ p: ll(lerp(la0, la1, rnd()), lerp(lo0, lo1, rnd()), 1.004), off: lerp(a.t0, a.t1, bi === 0 ? rnd() * 0.6 : 0.3 + rnd() * 0.7) }); });
      const n = P.length;
      items.push({ kind: 'cloud', n, size: 0.03, label: a.label, labelAt: ll(49, 30, 1.05), labelDx: 40, labelDy: -34, colored: true,
        fill(t, out, col) {
          for (let k = 0; k < n; k++) { const q = P[k].p; out[3 * k] = q[0]; out[3 * k + 1] = q[1]; out[3 * k + 2] = q[2];
            const dark = t > P[k].off, blink = dark && t < P[k].off + 0.05; col[3 * k] = blink ? 1 : dark ? 0.9 : 0.35; col[3 * k + 1] = blink ? 0.9 : dark ? 0.2 : 1.0; col[3 * k + 2] = blink ? 0.8 : dark ? 0.2 : 0.62; }
          return n;
        } });
      items.push({ kind: 'status', text: t => t < a.t0 ? 'Before the attack: user modems online (green), KA-SAT serving Europe' : t < a.t1 ? 'Malware spreads through the ground management network: modems go dark (red)' : 'Modems offline (red) · the satellite itself kept working: the attack hit the ground segment' });
    }
    if (a.type === 'beam' && tgt) {
      const from = ll(a.from[0], a.from[1], 1.004);
      const su = norm(from); // beam is on while the satellite is above the site's horizon, within the window
      items.push({ kind: 'beam', a: () => from, b: t => tgt.pos(t), on: t => Math.abs(t - tgt.t) < a.window && dot(tgt.pos(t), su) > 1.02, color: a.color, opacity: 0.95, width: 0.02, label: a.label });
    }
  }
  // GNSS links: aircraft <-> 4 highest GPS satellites; red when inside zone.
  if (items._gps && items._zone) {
    const z = items._zone, zc = ll(z.at[0], z.at[1]);
    items.filter(i => i.gnss).forEach(ac => {
      const inZone = t => { const p = ac.pos(t); return p && Math.acos(Math.min(1, dot(norm(p), zc))) / DEG < z.radius; };
      ac.statusColor = t => inZone(t) ? C.jam : C.ok;
      ac.labelFn = t => inZone(t) ? ac.label + ' · GNSS lost' : ac.label + ' · GNSS OK';
      for (let k = 0; k < 2; k++) items.push({ kind: 'beam', link: true, opacity: 0.7, width0: 0.0018,
        a: t => ac.pos(t), b: t => { const p = ac.pos(t); if (!p) return null; const s = items._gps.map(f => f(t)).map(q => [q, dot(norm(q), norm(p))]).sort((x, y) => y[1] - x[1]); return s[k][0]; },
        on: t => !!ac.pos(t), colorFn: t => inZone(t) ? C.jam : C.ok, dashFn: inZone });
    });
  }
  const f = focus || [20, 0];
  const dist = cfg.camDist || 4.2;
  const wide = { name: 'Wide', pos: ll(f[0] * 0.6 + 10, f[1] - 25, dist) }, polar = { name: 'Polar', pos: ll(80, f[1], dist * 1.05) };
  let cams;
  if (cfg.cameras) cams = cfg.cameras.map(c => ({ name: c.name, pos: ll(...c.at), look: c.look ? ll(...c.look) : null, hideShell: !!c.look }));
  else if (H && !items._arc) cams = [{ name: 'Zoom', pos: ll(f[0] * 0.8 + 6, f[1] - 12, Math.max(2.5, dist * 0.72)) }, wide, polar];
  else if (items._arc) { // launch site through the intercept: a side-on camera looking at the middle of the arc
    const { from, to, mid } = items._arc, md = norm(mid), e1 = norm(add(to, scl(from, -1))), nrm = norm([md[1] * e1[2] - md[2] * e1[1], md[2] * e1[0] - md[0] * e1[2], md[0] * e1[1] - md[1] * e1[0]]);
    const look = add(mid, scl(md, -0.03)), launch = { name: 'Launch', pos: add(look, add(scl(nrm, 0.78 * (cfg.camScale || 1) * (IS_PHONE ? 0.8 : 1)), scl(md, 0.34 * (cfg.camScale || 1) * (IS_PHONE ? 0.8 : 1)))), look, hideShell: true };
    const orbit = { name: 'Orbit', pos: ll(f[0] * 0.5 + 12, f[1] - 30, Math.max(3.2, dist * 0.8)) };
    cams = cfg.launchCam === 'second' ? [orbit, launch, polar] : [launch, orbit, polar];
  } else cams = [wide, { name: 'Near', pos: ll(f[0], f[1] - 8, Math.max(2.3, dist * 0.55)) }, polar];
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

// NASA Blue Marble (public domain), pinned on jsDelivr. Fetched lazily after the page
// has rendered (never part of the initial page); the vector land map is used until
// it arrives or if it fails. Decoded pixels are cached on the CPU side only; each scene
// creates its own GPU texture and disposes it on close.
export const EARTH_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.0/example/img/earth-blue-marble.jpg';
let earthPromise = null, earthImg = null, oceanMask = null;
export function loadEarth(maxTex = 4096) {
  if (earthPromise) return earthPromise;
  earthPromise = new Promise(resolve => {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async';
    img.onload = () => {
      // Downscale on phones or GPUs that cannot hold a 4096 px texture.
      const w = Math.min(img.naturalWidth, IS_PHONE ? 2048 : maxTex);
      if (w < img.naturalWidth) { const c = document.createElement('canvas'); c.width = w; c.height = w / 2; c.getContext('2d').drawImage(img, 0, 0, w, w / 2); earthImg = c; }
      else earthImg = img;
      // Low-res ocean mask (for sun glint): blue-dominant pixels are water.
      const m = document.createElement('canvas'); m.width = 1024; m.height = 512; const g = m.getContext('2d');
      g.drawImage(img, 0, 0, 1024, 512); const d = g.getImageData(0, 0, 1024, 512), p = d.data;
      for (let k = 0; k < p.length; k += 4) { const water = p[k + 2] > p[k] * 1.25 && p[k + 2] > p[k + 1] * 1.05 && p[k] < 150; const v = water ? 200 : 18; p[k] = p[k + 1] = p[k + 2] = v; }
      g.putImageData(d, 0, 0); oceanMask = m;
      resolve(true);
    };
    img.onerror = () => { console.warn('Earth imagery unavailable; using vector map'); resolve(false); };
    img.src = EARTH_URL;
  });
  return earthPromise;
}
export const earthReady = () => !!earthImg;

// Soft round sprite + shock-ring sprite, drawn once on the CPU.
let spriteCv = null, ringCv = null;
function spriteCanvas() {
  if (spriteCv) return spriteCv;
  spriteCv = document.createElement('canvas'); spriteCv.width = spriteCv.height = 64; const g = spriteCv.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.75)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return spriteCv;
}
function ringCanvas() {
  if (ringCv) return ringCv;
  ringCv = document.createElement('canvas'); ringCv.width = ringCv.height = 128; const g = ringCv.getContext('2d');
  const r = g.createRadialGradient(64, 64, 40, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.7, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return ringCv;
}

const ATMO_VS = `varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; vW = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * mv; }`;
const ATMO_FS = `uniform vec3 uColor; uniform vec3 uSun; uniform float uPow; uniform float uGain; uniform float uBack; varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vec3 v = normalize(-vP); float d = dot(normalize(vN), v);
  // Front: brightest at the limb. Back (halo shell): brightest just outside the limb, 0 at the shell edge.
  float rim = uBack > 0.5 ? pow(clamp(-d * 2.6, 0.0, 1.0), uPow) : pow(clamp(1.0 - d, 0.0, 1.0), uPow);
  float day = 0.25 + 0.75 * smoothstep(-0.35, 0.6, dot(normalize(vW), uSun));
  gl_FragColor = vec4(uColor, clamp(rim * uGain * day, 0.0, 1.0)); }`;

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
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    // Keep at least a 1.5:1 horizontal field of view so narrow (phone) frames do not crop the action.
    this.camera.fov = 2 * Math.atan(Math.tan(20 * DEG) * Math.max(1, 1.5 / (w / h))) / DEG; this.camera.updateProjectionMatrix();
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.render();
  }
  load(sim) {
    this.unload();
    const T = this.T, S = new T.Scene(); this.scene = S; this.sim = sim; this.dyn = []; this.labels = [];
    // Sun fixed in world space, set ~50 deg east of the opening camera so the event region
    // is in daylight and the terminator shows on the limb. Orbiting reveals the night side.
    const sunDir = sunFor(sim.cams[0].pos);
    this.sunDir = sunDir;
    S.add(new T.AmbientLight(0x9fb4ff, 0.22));
    const sun = new T.DirectionalLight(0xfff4e0, 2.1); sun.position.set(...scl(sunDir, 10)); S.add(sun);
    const root = new T.Group(); S.add(root); this.root = root;
    // Starfield (background only; not part of the per-scene particle budget).
    { const n = IS_PHONE ? 500 : 1200, rnd = mulberry(99), a = new Float32Array(n * 3), c = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { const u = rnd() * 2 - 1, th = rnd() * 2 * Math.PI, s = Math.sqrt(1 - u * u); a.set([40 * s * Math.cos(th), 40 * u, 40 * s * Math.sin(th)], 3 * k); const b = 0.35 + rnd() * 0.65; c.set([b * (0.85 + rnd() * 0.15), b * 0.92, b], 3 * k); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(a, 3)); g.setAttribute('color', new T.BufferAttribute(c, 3));
      S.add(new T.Points(g, new T.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, depthWrite: false }))); }
    // Earth: Blue Marble when available, vector land map otherwise (swapped in when it arrives).
    const earthMat = new T.MeshPhongMaterial({ shininess: 18, specular: 0x6b87a8 });
    this.earthMat = earthMat; this._applyEarth(earthMat);
    // Event scenes fetch the imagery at once if needed; the hero waits for the idle prefetch (app.js).
    if (!earthImg) { const p = earthPromise || (sim.cfg.spin ? null : loadEarth(this.maxTex)); p?.then(ok => { if (ok && this.scene === S) this.refreshEarth(); }); }
    root.add(new T.Mesh(new T.SphereGeometry(1, 96, 64), earthMat));
    // Atmosphere: thin inner rim + outer halo, brighter on the day side.
    const atmo = (r, side, pow, gain, back) => new T.Mesh(new T.SphereGeometry(r, 64, 48), new T.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uColor: { value: new T.Color(0x5fa8ff) }, uSun: { value: new T.Vector3(...sunDir) }, uPow: { value: pow }, uGain: { value: gain }, uBack: { value: back } } }));
    root.add(atmo(1.004, T.FrontSide, 3.2, 0.9, 0));
    root.add(atmo(1.07, T.BackSide, 2.4, 0.75, 1));
    this.spriteTex = new T.CanvasTexture(spriteCanvas()); this.ringTex = new T.CanvasTexture(ringCanvas());
    const col = c => new T.Color(c);
    for (const it of sim.items) {
      if (it.kind === 'shell') {
        root.add(new T.Mesh(new T.SphereGeometry(it.r, 48, 32), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.06, depthWrite: false })));
        const ring = new T.Mesh(new T.TorusGeometry(it.r, 0.004, 6, 160), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.5 }));
        ring.rotation.x = Math.PI / 2; root.add(ring);
        if (it.label) this._label(it.label, () => this._limb(it.r, it.ang ?? 45), 'shell', null, it.dy ?? 0, it.dx ?? 0);
      } else if (it.kind === 'curve') {
        const g = new T.BufferGeometry(); const pts = it.dynamic ? [] : it.pts(0);
        const max = it.dynamic ? 200 : pts.length; const arr = new Float32Array(max * 3);
        pts.forEach((p, k) => arr.set(p, 3 * k));
        g.setAttribute('position', new T.BufferAttribute(arr, 3)); g.setDrawRange(0, pts.length);
        let line;
        if (it.dynamic) { // fading trail: per-vertex RGBA, brightest at the head
          g.setAttribute('color', new T.BufferAttribute(new Float32Array(max * 4), 4));
          line = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
          line.userData.rgb = col(it.color);
        } else line = new T.Line(g, new T.LineBasicMaterial({ color: col(it.color), transparent: true, opacity: it.opacity ?? 1 }));
        root.add(line); if (it.dynamic) this.dyn.push({ it, obj: line });
        if (it.thick) { // bright tube so the path reads at any zoom; dynamic ones are revealed with drawRange
          const src = it.dynamic ? it.all : pts, closed = !it.dynamic && src.length > 3 && Math.hypot(src[0][0] - src[src.length - 1][0], src[0][1] - src[src.length - 1][1], src[0][2] - src[src.length - 1][2]) < 1e-6;
          const vp = (closed ? src.slice(0, -1) : src).map(q => new T.Vector3(...q)), curve = new T.CatmullRomCurve3(vp, closed);
          const segs = it.dynamic ? src.length - 1 : Math.max(60, vp.length), geo = new T.TubeGeometry(curve, segs, it.thick, 5, closed);
          const tube = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: it.dynamic ? 0.9 : (it.opacity ?? 1), depthWrite: false, blending: it.dynamic ? T.AdditiveBlending : T.NormalBlending }));
          root.add(tube); if (it.dynamic) this.dyn.push({ it: { kind: 'tube', ref: it, segs }, obj: tube });
          line.visible = !it.dynamic ? false : line.visible; if (!it.dynamic) line.material.opacity = 0; }
        if (it.label) this._label(it.label, t => it.dynamic ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt, null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'point') {
        let m;
        if (it.shape === 'kv') { // glowing interceptor head
          m = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
          m.scale.setScalar(0.07);
        } else if (it.shape === 'sat' && !it.small) { // body + two solar wings + glow halo
          m = new T.Group();
          const body = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.04), new T.MeshBasicMaterial({ color: col(it.color) })); m.add(body); m.userData.body = body;
          const panelMat = new T.MeshBasicMaterial({ color: 0x2f5fa8 }), frameMat = new T.MeshBasicMaterial({ color: 0x9fb3d6 });
          [-1, 1].forEach(s => { const p = new T.Mesh(new T.BoxGeometry(0.055, 0.003, 0.026), panelMat); p.position.x = s * 0.045; m.add(p);
            const f = new T.Mesh(new T.BoxGeometry(0.012, 0.004, 0.004), frameMat); f.position.x = s * 0.018; m.add(f); });
          const halo = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
          halo.scale.setScalar(0.09); m.add(halo); m.userData.halo = halo;
        } else {
          let geo;
          if (it.shape === 'sat') geo = new T.OctahedronGeometry(0.018);
          else if (it.shape === 'tick') geo = new T.OctahedronGeometry(0.03);
          else if (it.shape === 'aircraft') geo = new T.ConeGeometry(0.022, 0.075, 8);
          else if (it.shape === 'ship') geo = new T.BoxGeometry(0.09, 0.025, 0.035);
          else geo = new T.CylinderGeometry(0.012, 0.012, 0.03, 10);
          m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color) }));
        }
        if (it.scale) m.scale.setScalar(it.scale);
        root.add(m);
        this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => it.pos(t), null, it, it.labelDy ?? ((it.shape === 'site' || it.shape === 'ship') ? 28 : 0), it.labelDx ?? 0, it.short);
      } else if (it.kind === 'cloud') {
        const g = new T.BufferGeometry(); const arr = new Float32Array(it.n * 3);
        g.setAttribute('position', new T.BufferAttribute(arr, 3));
        let mat;
        // Soft round sprites (were square pixels); additive for debris/belt so dense regions glow.
        if (it.colored) { g.setAttribute('color', new T.BufferAttribute(new Float32Array(it.n * 3), 3)); mat = new T.PointsMaterial({ size: it.size * 2.4, vertexColors: true, map: this.spriteTex, transparent: true, alphaTest: 0.05, depthWrite: false }); }
        else mat = new T.PointsMaterial({ size: it.size * 2.1, color: col(it.color), map: this.spriteTex, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending });
        const pts = new T.Points(g, mat); pts.frustumCulled = false; root.add(pts); this.dyn.push({ it, obj: pts });
        if (it.label) this._label(it.label, t => it.labelAt || (it.fill(t, arr) > 0 ? [arr[0], arr[1], arr[2]] : null), null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'beam') {
        // Beam = bright core + wide soft halo; unit-height cylinders scaled along the beam each frame.
        const w = it.width || it.width0 || 0.004, m = new T.Group();
        const mk = (r, op) => new T.Mesh(new T.CylinderGeometry(r, r, 1, 10, 1, true), new T.MeshBasicMaterial({ color: col(it.color || '#fff'), transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending }));
        const core = mk(w * (it.width ? 0.5 : 1), it.opacity ?? 0.8); m.add(core); m.userData.core = core;
        if (it.width) { const halo = mk(w * 2.2, 0.22); m.add(halo); m.userData.halo = halo; }
        root.add(m); this.dyn.push({ it, obj: m });
      } else if (it.kind === 'dome') {
        const c = ll(it.at[0], it.at[1]);
        const m = new T.Mesh(new T.SphereGeometry(it.radius * DEG * 1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide }));
        m.position.set(...c); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...c)); root.add(m);
        this._label(it.label, () => scl(c, 1.12), null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'flash') {
        // Explosion: white-hot core sprite (fast fade) + expanding shock ring (slower).
        const m = new T.Group(); m.position.set(...it.pos);
        const core = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        const ring = new T.Sprite(new T.SpriteMaterial({ map: this.ringTex, color: col(it.ringColor || (it.big ? '#ffd9a0' : '#ffb38a')), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        m.add(core, ring); m.userData = { core, ring }; root.add(m); this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => t > it.t0 ? it.pos : null, null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'status') { this.status = it; }
    }
    this.statusEl = document.createElement('div'); this.statusEl.className = 'hlabel'; this.statusEl.style.cssText += ';left:50%;bottom:10px;top:auto;transform:translateX(-50%);font-size:12px;color:#ffe08a;white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 16px);line-height:1.3';
    this.labelLayer.appendChild(this.statusEl);
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.leaders.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible'); this.leaders.setAttribute('aria-hidden', 'true');
    this.labelLayer.prepend(this.leaders);
    this.setCam(0, true); this.t = 0; this.update(0);
  }
  refreshEarth() { if (this.earthMat && earthImg && this.earthMat.map?.image !== earthImg) { this._applyEarth(this.earthMat); this.render(); } }
  // Point on a sphere of radius r at the visible silhouette, `deg` counter-clockwise from screen-right.
  _limb(r, deg) {
    const T = this.T, cam = this.camera, d = cam.position.clone().normalize();
    const cr = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), cu = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const right = cr.sub(d.clone().multiplyScalar(cr.dot(d))).normalize(), up = cu.sub(d.clone().multiplyScalar(cu.dot(d))).normalize();
    const L = cam.position.length(), rr = r * Math.sqrt(Math.max(0, 1 - (r / L) ** 2)); // tangent circle for a perspective camera
    const p = right.multiplyScalar(Math.cos(deg * DEG) * rr).add(up.multiplyScalar(Math.sin(deg * DEG) * rr)).add(d.multiplyScalar(r * r / L));
    return [p.x, p.y, p.z];
  }
  get maxTex() { return this.renderer.capabilities.maxTextureSize || 4096; }
  _applyEarth(mat) {
    const T = this.T, old = [mat.map, mat.specularMap];
    let map;
    if (earthImg) { map = new T.Texture(earthImg); map.needsUpdate = true;
      const spec = new T.CanvasTexture(oceanMask); mat.specularMap = spec; mat.shininess = 60; mat.specular.set(0x1c2838); }
    else { map = new T.CanvasTexture(getLandCanvas()); mat.specularMap = null; mat.specular.set(0x223344); mat.shininess = 8; }
    map.colorSpace = T.SRGBColorSpace; map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    mat.map = map; mat.needsUpdate = true;
    old.forEach(t => t?.dispose());
  }
  // Screen positions of visible labels for a given canvas size (shared by live render and PNG export).
  // u = font scale relative to the live 11 px label. Overlaps are resolved by placeLabels().
  _labelPositions(w, h, u = 1, noBanner = false) {
    const cam = this.camera.position, T = this.T, raw = [], k = h / (this.el.clientHeight || h);
    for (const L of this.labels) {
      if (L.cls === 'shell' && this.hideShell) { raw.push(null); continue; }
      let p = L.posFn(this.t); if (p && this.sim.cfg.spin && L.cls !== 'shell') { const v = new T.Vector3(...p).applyMatrix4(this.root.matrixWorld); p = [v.x, v.y, v.z]; }
      if (!p) { raw.push(null); continue; }
      const v = new T.Vector3(...p).project(this.camera);
      if (occluded([cam.x, cam.y, cam.z], p) || v.z > 1) { raw.push(null); continue; }
      const text = L.item?.labelFn ? L.item.labelFn(this.t) : (L.short && this.el.clientWidth < 520 ? L.short : L.text), color = L.item?.labelFn ? L.item.statusColor(this.t) : null;
      const px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h;
      raw.push({ x: px + L.dx * k, y: py + (L.dy - 12) * k, px, py, w: labelW(text, u * (noBanner ? 1.1 : 1)), h: 19 * u, fixed: L.cls === 'shell', text, color });
    }
    const banner = noBanner ? [] : [[8 * u, 8 * u, Math.min(w - 16 * u, 430 * u), 32 * u]], status = this.status ? (w < 520 * u ? [8 * u, h - 56 * u, w - 16 * u, 48 * u] : [(w - 470 * u) / 2, h - 40 * u, 470 * u, 30 * u]) : null;
    const pl = placeLabels(raw, w, h, status ? banner.concat([status]) : banner);
    return raw.map((r, i) => r && { ...pl[i], text: r.text, color: r.color, w: r.w, h: r.h });
  }
  _label(text, posFn, cls, item, dy = 0, dx = 0, short = null) {
    const d = document.createElement('div'); d.className = 'hlabel'; d.textContent = text; this.labelLayer.appendChild(d);
    this.labels.push({ d, posFn, item, text, dy, dx, short, cls });
  }
  setCam(i, instant) { const c = this.sim.cams[i]; this.camIdx = i; this.hideShell = !!c.hideShell; this.target.set(...(c.look || [0, 0, 0])); this.camera.position.set(...c.pos); this.camera.up.set(0, 1, 0); this.camera.lookAt(this.target); this.render(); }
  update(t) {
    const T = this.T; this.t = t;
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'curve') {
        const pts = it.pts(t), a = obj.geometry.attributes.position; const n = Math.min(pts.length, a.count);
        for (let k = 0; k < n; k++) a.array.set(pts[k], 3 * k);
        a.needsUpdate = true; obj.geometry.setDrawRange(0, n);
        const c = obj.geometry.attributes.color, rgb = obj.userData.rgb;
        if (c && rgb) { for (let k = 0; k < n; k++) { const f = n > 1 ? k / (n - 1) : 1; c.array.set([rgb.r, rgb.g, rgb.b, 0.12 + 0.88 * f * f], 4 * k); } c.needsUpdate = true; }
      } else if (it.kind === 'tube') {
        const n = it.ref.pts(t).length; obj.geometry.setDrawRange(0, n < 2 ? 0 : Math.round(Math.min(1, (n - 1) / it.segs) * it.segs) * 30);
      } else if (it.kind === 'point') {
        const p = it.pos(t); obj.visible = !!p; if (p) obj.position.set(...p);
        if (it.shape === 'aircraft' && p) { obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(p))); }
        if (obj.userData.body && p) { // keep solar wings roughly along the orbit track
          const q = it.pos(t + 0.002); if (q) { obj.lookAt(new T.Vector3(...q)); } }
        const tint = obj.userData.body ? obj.userData.body.material : obj.material;
        if (it.statusColor && tint) tint.color.set(it.statusColor(t));
        if (it.glow) { const on = it.glow(t); tint.color.set(on ? '#ffffff' : it.color);
          if (obj.userData.halo) { obj.userData.halo.material.color.set(on ? '#ff8cf0' : it.color); obj.userData.halo.scale.setScalar(on ? 0.12 + 0.02 * Math.sin(performance.now() / 60) : 0.09); obj.userData.halo.material.opacity = on ? 0.95 : 0.55; } }
      } else if (it.kind === 'cloud') {
        const a = obj.geometry.attributes.position; it.fill(t, a.array, obj.geometry.attributes.color?.array); a.needsUpdate = true;
        if (obj.geometry.attributes.color) obj.geometry.attributes.color.needsUpdate = true;
      } else if (it.kind === 'beam') {
        const A = it.a(t), B = it.b(t), on = A && B && it.on(t); obj.visible = !!on;
        if (on) { const v = new T.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]); const L = v.length();
          obj.scale.set(1, L, 1); obj.position.set((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2);
          obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
          const core = obj.userData.core.material, now = performance.now() / 1000;
          if (it.colorFn) { // GNSS links: steady green outside the zone, faint flickering red inside it
            const jam = it.dashFn(t); core.color.set(it.colorFn(t)); core.opacity = jam ? 0.12 + 0.18 * Math.abs(Math.sin(now * 13 + L * 9)) : 0.55; }
          else if (obj.userData.halo) { const pulse = 0.75 + 0.25 * Math.sin(now * 30); core.opacity = (it.opacity ?? 0.9) * pulse; obj.userData.halo.material.opacity = 0.22 * pulse; } }
      } else if (it.kind === 'flash') {
        const span = it.span ?? (it.big ? 0.3 : 0.14), dt = t - it.t0, on = dt > 0 && dt < span;
        obj.visible = on;
        if (on) { const f = dt / span, { core, ring } = obj.userData;
          core.scale.setScalar((it.size ?? (it.big ? 0.55 : 0.16)) * Math.sqrt(Math.min(1, f * 3)) + 0.01); core.material.opacity = Math.max(0, 1 - f * 1.6);
          ring.scale.setScalar((it.size ? it.size * 1.7 : it.big ? 0.9 : 0.3) * Math.pow(f, 0.6) + 0.01); ring.material.opacity = 0.9 * (1 - f); }
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
    const pos = this._labelPositions(this.el.clientWidth, this.el.clientHeight);
    this.labels.forEach((L, i) => { const q = pos[i];
      if (!q || (L.cls === 'shell' && this.hideShell)) { L.d.style.display = 'none'; if (L.ln) L.ln.style.display = L.dot.style.display = 'none'; return; }
      L.d.style.display = ''; L.d.style.left = q.x + 'px'; L.d.style.top = q.y + 'px';
      if (L.d.textContent !== q.text) L.d.textContent = q.text;
      if (L.item?.labelFn) L.d.style.color = q.color;
      if (!L.ln && this.leaders) { L.ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); L.ln.setAttribute('stroke-width', '1'); this.leaders.appendChild(L.ln); L.dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); L.dot.setAttribute('r', '2'); this.leaders.appendChild(L.dot); }
      if (L.ln) { const c = q.color || '#dfe6f7'; L.ln.style.display = L.dot.style.display = q.leader ? '' : 'none';
        if (q.leader) { L.ln.setAttribute('x1', q.ax); L.ln.setAttribute('y1', q.ay); L.ln.setAttribute('x2', q.qx); L.ln.setAttribute('y2', q.qy); L.ln.setAttribute('stroke', c); L.ln.setAttribute('stroke-opacity', '0.75');
          L.dot.setAttribute('cx', q.ax); L.dot.setAttribute('cy', q.ay); L.dot.setAttribute('fill', c); } } });
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
      // Dispose every geometry, material and texture (map, specularMap, sprites) the scene created.
      this.scene.traverse(o => { o.geometry?.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); });
      this.spriteTex?.dispose(); this.ringTex?.dispose(); this.spriteTex = this.ringTex = null;
      this.scene.clear(); this.scene = null; this.earthMat = null;
    }
    this.renderer.renderLists.dispose();
    if (this.labelLayer) this.labelLayer.innerHTML = '';
    this.labels = []; this.dyn = []; this.status = null; this.statusEl = null;
  }
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and
  // the illustrative banner, caption and source into the PNG, then restore the live size.
  stillPNG(title, cite, targetW = 3000) {
    const vw = this.el.clientWidth, vh = this.el.clientHeight, pr = this.renderer.getPixelRatio();
    const maxDim = Math.min(this.maxTex, 4096), W = Math.min(targetW, maxDim, Math.floor(maxDim * vw / vh)), H = Math.round(W * vh / vw);
    this.renderer.setPixelRatio(1); this.renderer.setSize(W, H, false); this.renderer.render(this.scene, this.camera);
    // Layout: header band (banner) | render | footer band (title, source, imagery credit). Nothing is drawn over the globe.
    const s = W / 1000, hb = Math.round(40 * s), fb = Math.round(64 * s);
    const c = document.createElement('canvas'); c.width = W; c.height = H + hb + fb;
    const g = c.getContext('2d'); g.fillStyle = '#070b17'; g.fillRect(0, 0, W, c.height); g.drawImage(this.canvas, 0, hb);
    g.textAlign = 'center'; g.lineJoin = 'round';
    const lp = this._labelPositions(W, H, s, true);
    for (const q of lp) { if (!q || !q.leader) continue; g.strokeStyle = q.color || '#dfe6f7'; g.globalAlpha = 0.75; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(q.ax, q.ay + hb); g.lineTo(q.qx, q.qy + hb); g.stroke(); g.globalAlpha = 1; }
    for (const q of lp) { if (!q) continue;
      g.font = `600 ${Math.round(11 * s)}px system-ui,sans-serif`; const tw = g.measureText(q.text).width + 12 * s; g.fillStyle = 'rgba(5,8,18,0.8)'; g.beginPath(); g.roundRect(q.x - tw / 2, q.y + hb - 9 * s, tw, 18 * s, 4 * s); g.fill(); g.textBaseline = 'middle';
      g.fillStyle = q.color || '#dfe6f7'; g.fillText(q.text, q.x, q.y + hb); g.textBaseline = 'alphabetic'; }
    const status = this.status?.text(Math.min(this.t, 1));
    if (status) { g.font = `${Math.round(12 * s)}px system-ui,sans-serif`; const tw = g.measureText(status).width + 24 * s;
      g.fillStyle = 'rgba(5,8,18,0.78)'; g.fillRect(W / 2 - tw / 2, hb + H - 36 * s, tw, 26 * s); g.fillStyle = '#ffe08a'; g.textBaseline = 'middle'; g.fillText(status, W / 2, hb + H - 23 * s); g.textBaseline = 'alphabetic'; }
    g.textAlign = 'left';
    g.fillStyle = '#0b1120'; g.fillRect(0, 0, W, hb); g.fillRect(0, hb + H, W, fb);
    g.strokeStyle = 'rgba(255,224,138,0.28)'; g.lineWidth = Math.max(1, s); g.beginPath(); g.moveTo(0, hb - 0.5); g.lineTo(W, hb - 0.5); g.moveTo(0, hb + H + 0.5); g.lineTo(W, hb + H + 0.5); g.stroke();
    g.textBaseline = 'middle'; g.fillStyle = '#ffe08a'; g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
    g.fillText('Illustrative, not orbit-propagated · compressed radial scale', 16 * s, hb / 2);
    g.fillStyle = '#e9edf7'; g.font = `600 ${Math.round(19 * s)}px system-ui,sans-serif`; g.fillText(title, 16 * s, hb + H + 21 * s);
    // Source line: cite, then the imagery credit as its own sentence (single separator).
    const credit = earthImg ? 'Earth imagery: NASA Blue Marble (public domain).' : 'Vector land map: Natural Earth (public domain).';
    const src = `${String(cite || '').trim().replace(/[.;,\s]+$/, '')}. ${credit}`;
    let fs = Math.round(11.5 * s); g.font = `${fs}px system-ui,sans-serif`; while (g.measureText(src).width > W - 32 * s && fs > 7 * s) { fs -= 0.5 * s; g.font = `${fs}px system-ui,sans-serif`; }
    g.fillStyle = '#a9b3cc'; g.fillText(src, 16 * s, hb + H + 46 * s); g.textBaseline = 'alphabetic';
    const url = c.toDataURL('image/png');
    this.renderer.setPixelRatio(pr); this.resize();
    return url;
  }
  memory() { return { ...this.renderer.info.memory, programs: this.renderer.info.programs?.length }; }
  _bindDrag() {
    const cv = this.canvas; let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', e => { this.dragging = true; sx = e.clientX; sy = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointerup', () => { this.dragging = false; });
    cv.addEventListener('pointercancel', () => { this.dragging = false; });
    cv.addEventListener('pointermove', e => {
      if (!this.dragging) return; const dx = (e.clientX - sx) * 0.006, dy = (e.clientY - sy) * 0.006; sx = e.clientX; sy = e.clientY;
      const p = this.camera.position, o = p.clone().sub(this.target), r = o.length(); let th = Math.atan2(o.x, o.z) - dx, ph = Math.acos(o.y / r) - dy;
      ph = Math.max(0.1, Math.min(Math.PI - 0.1, ph));
      p.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)).add(this.target); this.camera.lookAt(this.target); this.render();
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = this.camera.position, o = p.clone().sub(this.target); const r = Math.max(this.target.length() > 0 ? 0.35 : 1.6, Math.min(12, o.length() * (1 + Math.sign(e.deltaY) * 0.08))); p.copy(o.setLength(r).add(this.target)); this.render(); }, { passive: false });
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
// A polished 2D diagram: orthographic globe with vector coastlines, shells, paths and markers,
// with the same screen-space label de-confliction (pills + leader lines) as the live scene.
export function renderSVG(sim, el, t = sim.still) {
  const W = el.clientWidth || 640, H = el.clientHeight || 420;
  const cam = sim.cams[0].pos, zoomed = !!(sim.items._arc && sim.cams[0].look), cl = toLL(zoomed ? sim.items._arc.mid : cam);
  const shellR = Math.max(...sim.items.filter(i => i.kind === 'shell').map(i => i.r), 1.4);
  const R = Math.min(W, H * 0.94) / (2 * Math.max(2.2, shellR + 0.3)) * (zoomed ? 1.9 : 1);
  const proj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([W / 2, H / 2 - 4]).scale(R).clipAngle(90);
  const rot = d3.geoRotation([-cl.lon, -cl.lat]), CY = H / 2 - 4;
  // Project any 3D point: orthographic along the camera direction, scaled by radius.
  const project = p => { const q = toLL(p); const [lo, la] = rot([q.lon, q.lat]); const x = Math.cos(la * DEG) * Math.sin(lo * DEG), y = Math.sin(la * DEG); const front = Math.cos(la * DEG) * Math.cos(lo * DEG);
    return { x: W / 2 + x * q.r * R, y: CY - y * q.r * R, hidden: front < 0 && Math.hypot(x * q.r, y * q.r) < 1 }; };
  const path = d3.geoPath(proj);
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${sim.cfg.title}: static diagram`);
  const defs = svg.append('defs');
  const bg = defs.append('radialGradient').attr('id', 'sf-bg').attr('cx', '50%').attr('cy', '50%').attr('r', '75%');
  bg.append('stop').attr('offset', 0).attr('stop-color', '#0f1a33'); bg.append('stop').attr('offset', 1).attr('stop-color', '#05070f');
  const gl = defs.append('radialGradient').attr('id', 'sf-glow'); gl.append('stop').attr('offset', 0.9).attr('stop-color', '#5fa8ff').attr('stop-opacity', 0.5); gl.append('stop').attr('offset', 1).attr('stop-color', '#5fa8ff').attr('stop-opacity', 0);
  const oc = defs.append('radialGradient').attr('id', 'sf-ocean').attr('cx', '38%').attr('cy', '35%').attr('r', '80%');
  oc.append('stop').attr('offset', 0).attr('stop-color', '#1a4a7c'); oc.append('stop').attr('offset', 1).attr('stop-color', '#0a2040');
  // Lit globe: soft sphere shading + a blurred night side, from the same sun direction as the live scene.
  const sh = defs.append('radialGradient').attr('id', 'sf-shade').attr('cx', '36%').attr('cy', '32%').attr('r', '78%');
  sh.append('stop').attr('offset', 0).attr('stop-color', '#fff').attr('stop-opacity', 0.16); sh.append('stop').attr('offset', 0.45).attr('stop-color', '#fff').attr('stop-opacity', 0);
  sh.append('stop').attr('offset', 1).attr('stop-color', '#000').attr('stop-opacity', 0.5);
  defs.append('filter').attr('id', 'sf-blur').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%').append('feGaussianBlur').attr('stdDeviation', Math.max(4, R * 0.05));
  defs.append('clipPath').attr('id', 'sf-clip').append('path').datum({ type: 'Sphere' }).attr('d', path);
  svg.append('rect').attr('width', W).attr('height', H).attr('fill', 'url(#sf-bg)');
  { const rs = mulberry(99); for (let k = 0; k < 90; k++) { const x = rs() * W, y = rs() * H, b = 0.25 + rs() * 0.5; svg.append('circle').attr('cx', x).attr('cy', y).attr('r', rs() < 0.15 ? 1.1 : 0.7).attr('fill', '#dfe8ff').attr('fill-opacity', b); } }
  const shells = sim.items.filter(i => i.kind === 'shell'), cands = [];
  shells.forEach(it => svg.append('circle').attr('cx', W / 2).attr('cy', CY).attr('r', it.r * R).attr('fill', it.color).attr('fill-opacity', 0.05).attr('stroke', it.color).attr('stroke-opacity', 0.55).attr('stroke-dasharray', '3 4'));
  svg.append('circle').attr('cx', W / 2).attr('cy', CY).attr('r', R * 1.08).attr('fill', 'url(#sf-glow)');
  svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'url(#sf-ocean)').attr('stroke', '#7fb6ff').attr('stroke-opacity', 0.6);
  svg.append('path').datum(d3.geoGraticule10()).attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(140,190,255,0.16)');
  // Ring winding is data-dependent: any ring that d3 reads as "more than a hemisphere" is reversed so it fills land, not the complement.
  const landGeo = { type: 'MultiPolygon', coordinates: (LAND || []).map(r => { const c = []; for (let k = 0; k < r.length; k += 2) c.push([r[k], r[k + 1]]); if (c.length > 2 && d3.geoArea({ type: 'Polygon', coordinates: [c] }) > 2 * Math.PI) c.reverse(); return [c]; }) };
  svg.append('path').datum(landGeo).attr('d', path).attr('fill', '#3b7a5e').attr('stroke', '#5fae8a').attr('stroke-width', 0.5).attr('stroke-opacity', 0.7);
  { // Sun direction in the view basis; the terminator crosses the view axis at a = -sz (units of R), night is on the far side.
    const sd = toLL(sunFor(cam)), [slo, sla] = rot([sd.lon, sd.lat]), sx = Math.cos(sla * DEG) * Math.sin(slo * DEG), sy = Math.sin(sla * DEG), sz = Math.cos(sla * DEG) * Math.cos(slo * DEG), pm = Math.hypot(sx, sy) || 1e-6;
    const ux = sx / pm, uy = -sy / pm, cx = W / 2, cyy = CY, at = a => [cx + ux * a * R, cyy + uy * a * R];
    const [x1, y1] = at(-sz - 0.55), [x2, y2] = at(-sz + 0.25);
    const ng = defs.append('linearGradient').attr('id', 'sf-night').attr('gradientUnits', 'userSpaceOnUse').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
    ng.append('stop').attr('offset', 0).attr('stop-color', '#01030a').attr('stop-opacity', 0.78); ng.append('stop').attr('offset', 1).attr('stop-color', '#01030a').attr('stop-opacity', 0);
    const cg = svg.append('g').attr('clip-path', 'url(#sf-clip)');
    cg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'url(#sf-shade)');
    cg.append('rect').attr('x', 0).attr('y', 0).attr('width', W).attr('height', H).attr('fill', 'url(#sf-night)').attr('opacity', pm < 0.06 && sz > 0 ? 0 : 1);
    svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'none').attr('stroke', '#8cc8ff').attr('stroke-opacity', 0.55).attr('stroke-width', 1.2); }
  const g = svg.append('g').attr('font-family', 'system-ui').attr('font-size', 11);
  // Labels are collected, de-conflicted, then drawn as pills with leader lines to their objects.
  shells.forEach((it, i) => { if (!it.label) return; const a = (it.ang ?? 35 + i * 14) * DEG, px = W / 2 + it.r * R * Math.cos(a), py = CY - it.r * R * Math.sin(a); cands.push({ x: px, y: py, px, py, w: labelW(it.label), h: 19, fixed: true, text: it.label, color: it.color }); });
  const label = (p, text, color = '#dfe6f7', dx = 0, dy = 0) => { if (!p || p.hidden || !text) return; cands.push({ x: p.x + dx, y: p.y - 14 + dy, px: p.x, py: p.y, w: labelW(text), h: 19, text, color }); };
  for (const it of sim.items) {
    if (it.kind === 'dome') g.append('path').datum(d3.geoCircle().center([it.at[1], it.at[0]]).radius(it.radius)()).attr('d', path).attr('fill', it.color).attr('fill-opacity', 0.32).attr('stroke', it.color).attr('stroke-width', 1.6);
    if (it.kind === 'curve') {
      const pts = it.pts(t).map(project); let seg = [];
      const flush = () => { if (seg.length > 1) g.append('path').attr('d', d3.line()(seg)).attr('fill', 'none').attr('stroke', it.color).attr('stroke-linecap', 'round').attr('stroke-opacity', it.thick ? Math.max(0.85, it.opacity ?? 1) : (it.opacity ?? 1)).attr('stroke-width', it.thick ? Math.max(2.2, it.thick * R * 1.8) : (it.width || 1.2)); seg = []; };
      pts.forEach(p => { if (p.hidden) flush(); else seg.push([p.x, p.y]); }); flush();
      if (it.label && it.labelAt && pts.length > 2) label(project(it.labelAt), it.label, it.color, it.labelDx, it.labelDy);
    }
    if (it.kind === 'cloud') {
      const arr = new Float32Array(it.n * 3), col = it.colored ? new Float32Array(it.n * 3) : null; it.fill(t, arr, col);
      const step = Math.max(1, Math.floor(it.n / 900));
      for (let k = 0; k < it.n; k += step) { if (!arr[3 * k] && !arr[3 * k + 1] && !arr[3 * k + 2]) continue; const p = project([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]); if (p.hidden) continue;
        g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 1.4).attr('fill', col ? d3.rgb(col[3 * k] * 255, col[3 * k + 1] * 255, col[3 * k + 2] * 255) : it.color).attr('fill-opacity', 0.85); }
      if (it.label) label(project(it.labelAt || [arr[0], arr[1], arr[2]]), it.label, it.color || '#dfe6f7');
    }
    if (it.kind === 'beam') { const A = it.a(t), B = it.b(t); if (A && B && it.on(t)) { const a = project(A), b = project(B); if (!a.hidden && !b.hidden) g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y).attr('stroke', it.colorFn ? it.colorFn(t) : it.color).attr('stroke-opacity', it.opacity ?? 0.8).attr('stroke-dasharray', it.dashFn?.(t) ? '3 3' : null).attr('stroke-width', it.width ? 3.5 : 1.2); } }
    if (it.kind === 'point') { const q = it.pos(t); if (!q) continue; const p = project(q); if (p.hidden) continue;
      const c = it.statusColor ? it.statusColor(t) : it.color;
      if (it.shape === 'sat') { const q = it.small ? 4 : 9 * Math.min(1.6, it.scale ? 1 + it.scale * 0.25 : 1); g.append('rect').attr('x', p.x - q / 2).attr('y', p.y - q / 2).attr('width', q).attr('height', q).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 0.8); }
      else if (it.shape === 'tick') g.append('path').attr('d', `M${p.x},${p.y - 5}L${p.x + 5},${p.y}L${p.x},${p.y + 5}L${p.x - 5},${p.y}Z`).attr('fill', c).attr('stroke', '#070b17');
      else if (it.shape === 'aircraft') g.append('path').attr('d', `M${p.x},${p.y - 7}L${p.x + 5},${p.y + 5}L${p.x - 5},${p.y + 5}Z`).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 0.8);
      else if (it.shape === 'kv') g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 4).attr('fill', c);
      else g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 4).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 1);
      if (it.label) label(p, it.labelFn ? it.labelFn(t) : (it.short && W < 520 ? it.short : it.label), c, it.labelDx, it.labelDy); }
    if (it.kind === 'flash' && it.big && t >= it.t0 && !it.ringColor) { const p = project(it.pos); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 11).attr('fill', '#fff3c4').attr('fill-opacity', 0.35); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 5).attr('fill', '#fff3c4'); label(p, it.label, '#fff3c4', it.labelDx, it.labelDy); }
    if (it.kind === 'flash' && !it.big && t >= it.t0 && t < it.t0 + (it.span ?? 0.14)) { const p = project(it.pos); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 7).attr('fill', '#fff1c1').attr('fill-opacity', 0.7); }
  }
  // Status line: wrapped to the frame width so nothing clips on phones.
  const st = sim.items.find(i => i.kind === 'status'), stTxt = st ? st.text(t) : '', maxCh = Math.floor((W - 40) / 6.6), stLines = [];
  if (st) { let cur = ''; for (const wd of stTxt.split(' ')) { if ((cur + ' ' + wd).trim().length > maxCh && cur) { stLines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); } if (cur) stLines.push(cur); }
  const stH = stLines.length * 16 + 10, stY = H - 34 - stH, stW = Math.min(W - 16, Math.max(...stLines.map(l => l.length), 1) * 6.6 + 24);
  const reserved = [[8, 8, Math.min(W - 16, 380), W < 520 ? 40 : 26], [(W - stW) / 2, stY, stW, stH]];
  const pl = placeLabels(cands, W, H, reserved);
  cands.forEach((c, i) => { const q = pl[i]; if (!q) return;
    if (q.leader) { g.append('line').attr('x1', q.ax).attr('y1', q.ay).attr('x2', q.qx).attr('y2', q.qy).attr('stroke', c.color).attr('stroke-opacity', 0.8); g.append('circle').attr('cx', q.ax).attr('cy', q.ay).attr('r', 2).attr('fill', c.color); }
    g.append('rect').attr('x', q.x - c.w / 2).attr('y', q.y - c.h / 2).attr('width', c.w).attr('height', c.h).attr('rx', 4).attr('fill', 'rgba(5,8,18,0.78)').attr('stroke', c.color).attr('stroke-opacity', 0.35);
    g.append('text').attr('x', q.x).attr('y', q.y + 4).attr('text-anchor', 'middle').attr('font-weight', 600).attr('fill', c.color).text(c.text); });
  if (st) {
    g.append('rect').attr('x', (W - stW) / 2).attr('y', stY).attr('width', stW).attr('height', stH).attr('rx', 5).attr('fill', 'rgba(5,8,18,0.85)');
    stLines.forEach((l, k) => g.append('text').attr('x', W / 2).attr('y', stY + 17 + k * 16).attr('text-anchor', 'middle').attr('fill', '#ffe08a').attr('font-size', 12).text(l)); }
  { const ft = `${sim.cfg.title} · compressed radial scale (Earth radius = 1; altitude^0.45)`, fw = Math.min(W - 16, ft.length * 5.6 + 16);
    svg.append('rect').attr('x', 6).attr('y', H - 26).attr('width', fw).attr('height', 20).attr('rx', 4).attr('fill', 'rgba(5,8,18,0.82)');
    svg.append('text').attr('x', 14).attr('y', H - 12).attr('fill', '#a9b3cc').attr('font-size', Math.min(10.5, (W - 32) / (ft.length * 0.56))).attr('font-family', 'system-ui').text(ft); }
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  return svg.node();
}
