// ============================================================================
// Counterspace Timeline: charts, legal band, lag panel, scene overlay.
// ============================================================================
import { SCENES, HERO, buildSim, GLHost, renderSVG, setLand, PARTICLE_BUDGET, loadEarth, earthReady, EARTH_URL } from './scenes.js';

const D = JSON.parse(document.getElementById('cs-data').textContent);
setLand(D.land);
const EVENTS = D.events, LEGAL = D.legal, CAPS = D.caps;
const KIN = EVENTS.filter(e => e.domain === 'kinetic');
const NK = EVENTS.filter(e => e.domain === 'non_kinetic');
const byId = Object.fromEntries([...EVENTS, ...LEGAL].map(r => [r.id, r]));
const parse = d3.utcParse('%Y-%m-%d');
const fmt = d3.utcFormat('%b %-d, %Y'), fmtY = d3.utcFormat('%Y'), fmtMY = d3.utcFormat('%b %Y');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DOMAIN = [parse('1957-01-01'), parse('2027-01-01')];
const AS_OF = 'SWF 9th ed., Apr. 2026';
const LAST_DA = KIN.filter(e => e.type === 'destructive').map(e => e.date).sort().at(-1);

document.getElementById('asof').innerHTML = `Data as of: <b>${AS_OF}</b> (debris counts as of Feb. 2026) · CSIS <i>Space Threat Assessment 2025</i> (2026 ed. not yet published) · Page built Sept. 2026`;

{ const nDest = KIN.filter(e => e.type === 'destructive').length;
  document.getElementById('glance').innerHTML = `<h2>The ledger at a glance</h2><div><dt>Kinetic tests and nuclear marker</dt><dd>${KIN.length}</dd></div><div><dt>Destructive intercepts</dt><dd>${nDest}</dd></div><div><dt>Non-kinetic operations</dt><dd>${NK.length}</dd></div><div><dt>Law and policy items</dt><dd>${LEGAL.length}</dd></div><div><dt>Last destructive test</dt><dd>${fmtMY(parse(LAST_DA))}</dd></div>`; }
// ---------------------------------------------------------------- palette & helpers
const STATE_VAR = { 'United States': '--c-us', 'Russia': '--c-ru', 'China': '--c-cn', 'India': '--c-in', 'Iran': '--c-ir', 'North Korea': '--c-kp', 'Israel': '--c-il', 'Iraq': '--c-iq' };
const actorKey = a => Object.keys(STATE_VAR).find(k => a.startsWith(k) || (k === 'Iran' && a.startsWith('Iran'))) || (a.startsWith('Israel') ? 'Israel' : null);
const colorOf = name => `var(${STATE_VAR[actorKey(name)] || '--c-multi'})`;
const TYPE_LABEL = { destructive: 'Destructive intercept', non_destructive: 'Non-destructive test', flyby: 'Flyby (no intercept)', midcourse_intercept: 'Intercept of suborbital (missile) target', nuclear: 'Nuclear detonation', apogee_only: 'Apogee only (no target)' };
const ATTR_LABEL = { official_government: 'Official (single government)', multi_government: 'Multiple governments / intergovernmental body', researcher_osint: 'Researcher / open-source analysis', alleged: 'Alleged (unconfirmed)' };
const REGIME_LABEL = { GNSS_MEO: 'GNSS receivers (MEO signals)', GEO_comms: 'GEO communications', LEO_constellation: 'LEO constellation', ground_segment: 'Ground segment', ISR_LEO: 'LEO imaging / ISR' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => n == null ? '—' : d3.format(',')(n);
const isPhone = () => isPhoneNow();
const hasScene = r => r.scene_3d && SCENES.some(s => s.id === r.scene_3d);

let FORCE_DESKTOP = false, EXPORTING = false;
const isPhoneNow = () => !FORCE_DESKTOP && innerWidth < 640;
function layout(el, domain = DOMAIN) {
  const W = Math.max(300, el.clientWidth), ph = isPhoneNow();
  const M = { l: ph ? 40 : 64, r: ph ? 12 : 68 };
  const x = d3.scaleUtc().domain(domain).range([M.l, W - M.r]);
  return { W, M, x };
}
function xAxis(g, x, y, every) {
  const ax = d3.axisBottom(x).ticks(d3.utcYear.every(every || (isPhoneNow() ? 20 : 10))).tickFormat(fmtY).tickSizeOuter(0);
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${y})`).call(ax);
}
// ---- shared text measurement + label placement (greedy, collision-aware)
const mctx = document.createElement('canvas').getContext('2d');
let sansCache = null;
function tw(text, size, weight = 400) {
  sansCache ??= getComputedStyle(document.documentElement).getPropertyValue('--sans').trim() || 'sans-serif';
  mctx.font = `${weight} ${size}px ${sansCache}`;
  return mctx.measureText(text).width * 1.04 + 1;
}
function fit(text, maxW, size, weight) {
  if (tw(text, size, weight) <= maxW) return text;
  let t = text; while (t.length > 3 && tw(t + '…', size, weight) > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}
function wrap(text, maxW, size, weight) {
  const words = text.split(' '), lines = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (cur && tw(t, size, weight) > maxW) { lines.push(cur); cur = w; } else cur = t; });
  if (cur) lines.push(cur); return lines;
}
// Rectangles of already-placed things. free() tests a candidate rectangle against them.
class Placer {
  constructor(b) { this.b = b; this.r = []; }
  textRect(x, y, anchor, w, size) { const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x; return [x0, y - size * 0.95, x0 + w, y + size * 0.25]; }
  free(q, ignore = [], pad = 1.5) {
    const b = this.b; if (q[0] < b.x0 || q[2] > b.x1 || q[1] < b.y0 || q[3] > b.y1) return false;
    return this.r.every(o => ignore.includes(o[4]) || q[2] + pad <= o[0] || q[0] - pad >= o[2] || q[3] + pad <= o[1] || q[1] - pad >= o[3]);
  }
  add(q, kind = 'T') { this.r.push([q[0], q[1], q[2], q[3], kind]); return q; }
}
function badge(g, x, y) { // 3D badge: an isometric cube (shape, not color)
  const b = g.append('g').attr('class', 'badge3d').attr('transform', `translate(${x},${y}) scale(0.9)`).attr('aria-hidden', 'true');
  b.append('path').attr('class', 'top').attr('d', 'M0,-6 L5.2,-3 L0,0 L-5.2,-3Z');
  b.append('path').attr('d', 'M-5.2,-3 L0,0 L0,6 L-5.2,3Z');
  b.append('path').attr('d', 'M5.2,-3 L0,0 L0,6 L5.2,3Z');
}
const star = (r) => { const p = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return 'M' + p.join('L') + 'Z'; };

