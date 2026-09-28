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
// Roving tabindex: a chart's marks become ONE tab stop; arrow keys move in chronological order.
function rove(sel) {
  if (EXPORTING) return;
  const nodes = sel.nodes().sort((a, b) => (+a.dataset.t || 0) - (+b.dataset.t || 0));
  nodes.forEach((n, i) => n.setAttribute('tabindex', i ? -1 : 0));
  nodes.forEach((n, i) => {
    n.addEventListener('keydown', ev => {
      const k = ev.key; let j = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = Math.min(nodes.length - 1, i + 1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = Math.max(0, i - 1);
      else if (k === 'Home') j = 0; else if (k === 'End') j = nodes.length - 1;
      if (j != null) { ev.preventDefault(); nodes[j].focus(); }
    });
    n.addEventListener('focus', () => nodes.forEach(m => m.setAttribute('tabindex', m === n ? 0 : -1)));
  });
}
// Programmatic audit: overlapping or clipped text in any chart SVG (bounding-box test).
function audit() {
  drawRest();
  const out = [];
  document.querySelectorAll('#legalSvg svg, #legalZoom svg, #svgA svg, #svgB svg, #svgC svg, #svgL svg').forEach(svg => {
    const sr = svg.getBoundingClientRect(), id = svg.parentElement.id;
    const ts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[display="none"]') && t.getClientRects().length && getComputedStyle(t).display !== 'none' && !t.closest('.lbls-hidden')).map(t => { const r = t.getBoundingClientRect(); return { s: t.textContent.trim().slice(0, 28), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom }; });
    const shapes = [...svg.querySelectorAll('.mark circle:not(.hit), .mark path, .mark rect:not(.hit), .mark polygon')].map(n => ({ n, r: n.getBoundingClientRect(), m: n.closest('.mark') })).filter(o => o.r.width > 0 && !o.n.closest('.badge3d'));
    [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && getComputedStyle(t).display !== 'none' && t.getClientRects().length).forEach(t => {
      const r = t.getBoundingClientRect(), own = t.closest('.mark');
      shapes.forEach(o => { if (o.m === own && own) return; const w = Math.min(r.right, o.r.right) - Math.max(r.left, o.r.left), h = Math.min(r.bottom, o.r.bottom) - Math.max(r.top, o.r.top); if (w > 2 && h > 3.5) out.push({ chart: id, kind: 'text-on-mark', a: t.textContent.trim().slice(0, 28), b: o.m?.dataset?.id, w: Math.round(w), h: Math.round(h) }); });
    });
    ts.forEach(a => { if (a.x0 < sr.left - 0.5 || a.x1 > sr.right + 0.5 || a.y0 < sr.top - 0.5 || a.y1 > sr.bottom + 0.5) out.push({ chart: id, kind: 'clip', a: a.s }); });
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
      const a = ts[i], b = ts[j], w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (w > 1.5 && h > 3) out.push({ chart: id, kind: 'overlap', a: a.s, b: b.s, w: Math.round(w), h: Math.round(h) });
    }
  });
  return out;
}

function badge(g, x, y) { // 3D badge: an isometric cube (shape, not color)
  const b = g.append('g').attr('class', 'badge3d').attr('transform', `translate(${x},${y}) scale(0.9)`).attr('aria-hidden', 'true');
  b.append('path').attr('class', 'top').attr('d', 'M0,-6 L5.2,-3 L0,0 L-5.2,-3Z');
  b.append('path').attr('d', 'M-5.2,-3 L0,0 L0,6 L-5.2,3Z');
  b.append('path').attr('d', 'M5.2,-3 L0,0 L0,6 L5.2,3Z');
}
const star = (r) => { const p = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return 'M' + p.join('L') + 'Z'; };

// ---------------------------------------------------------------- card (hover / focus)
const card = document.getElementById('card');
function showCard(html, evt, el) {
  card.innerHTML = html; card.classList.add('on'); card.setAttribute('aria-hidden', 'false');
  card.classList.toggle('dock', innerWidth < 640);
  card.dataset.touch = touchMode ? '1' : '';
  if (innerWidth < 640) { card.style.left = ''; card.style.top = ''; return; }
  const r = el ? el.getBoundingClientRect() : { left: evt.clientX, right: evt.clientX, top: evt.clientY, bottom: evt.clientY };
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let left = r.right + 12, top = r.top - 8;
  if (left + cw > innerWidth - 8) left = Math.max(8, r.left - cw - 12);
  if (top + ch > innerHeight - 8) top = Math.max(8, innerHeight - ch - 8);
  card.style.left = left + 'px'; card.style.top = top + 'px';
}
let touchMode = false;
document.addEventListener('pointerdown', e => { touchMode = e.pointerType === 'touch'; if (touchMode && !e.target.closest('.mark') && !e.target.closest('#card')) hideCard(); }, true);
card.addEventListener('click', () => { if (card.classList.contains('dock')) hideCard(); });
function hideCard() { card.classList.remove('on'); card.setAttribute('aria-hidden', 'true'); }
const srcLine = r => `<div class="src">Source: ${esc(r.source)}, ${esc(r.pin)}</div>`;
function kinCard(e) {
  const debris = e.type === 'destructive' ? `<dt>Fragments</dt><dd>${num(e.fragments_cataloged)} cataloged · ${num(e.fragments_in_orbit)} still in orbit (as of ${fmtMY(parse(e.fragments_as_of + '-01'))})</dd>` : '';
  const alt = e.altitude_km == null ? 'not reported' : `${num(e.altitude_km)} km (${e.altitude_kind})`;
  const mdo = e.id === 'us-2008-burnt-frost' ? '<div class="hint">Missile-defense interceptor (SM-3) used against a satellite: shows the missile-defense / ASAT overlap.</div>' : '';
  return `<h4>${esc(e.system)} → ${esc(e.target)}</h4><dl><dt>Date</dt><dd>${fmt(parse(e.date))}</dd><dt>State</dt><dd>${esc(e.state)}</dd><dt>Type</dt><dd>${TYPE_LABEL[e.type]}</dd><dt>Altitude</dt><dd>${alt}</dd>${debris}<dt>Confidence</dt><dd>${e.confidence}</dd></dl>${mdo}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`;
}
function nkCard(e) {
  const span = e.end === e.start ? fmt(parse(e.start)) : `${fmtMY(parse(e.start))} – ${e.end ? fmtMY(parse(e.end)) : 'ongoing'}`;
  return `<h4>${esc(e.target_system)}</h4><dl><dt>When</dt><dd>${span}</dd><dt>Actor</dt><dd>${esc(e.actor)}</dd><dt>Attribution</dt><dd>${ATTR_LABEL[e.attribution]}</dd><dt>Category</dt><dd>${e.category.replace('_', ' ')}</dd><dt>Target</dt><dd>${REGIME_LABEL[e.target_regime]}</dd><dt>Use</dt><dd>${e.operational_use ? 'Operational (in conflict)' : 'Test, demonstration or peacetime'}</dd><dt>Effect</dt><dd>${esc(e.effect)}</dd><dt>Confidence</dt><dd>${e.confidence}</dd></dl>${e.notes ? `<div class="note">${esc(e.notes)}</div>` : ''}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`;
}
function legalCard(l) {
  const when = l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : fmt(parse(l.start));
  return `<h4>${esc(l.label)}</h4><dl><dt>Date</dt><dd>${when}</dd><dt>Kind</dt><dd>${l.soft_law ? 'Soft law (expert manual, not binding)' : l.kind.replace('_', ' ')}</dd></dl><div>${esc(l.short_note)}</div><div class="src">${esc(l.citation)}</div>${hasScene(l) ? '<div class="hint">▣ Click, tap or press Enter to open the related 3D scene</div>' : ''}`;
}
function bindMark(sel, cardFn, onActivate) {
  if (EXPORTING) return;
  sel.attr('tabindex', 0)
    .on('mouseenter', function (ev, d) { showCard(cardFn(d), ev, this); })
    .on('mouseleave', () => { if (!touchMode) hideCard(); })
    .on('focus', function (ev, d) { showCard(cardFn(d), ev, this); })
    .on('blur', () => { if (!touchMode) hideCard(); })
    .on('click', function (ev, d) { onActivate(d, this, ev); })
    .on('keydown', function (ev, d) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onActivate(d, this, ev); } if (ev.key === 'Escape') hideCard(); });
}
const activate = (d, el, ev) => { if (hasScene(d)) { hideCard(); openScene(d.scene_3d, el); } else showCard(d.domain ? (d.domain === 'kinetic' ? kinCard(d) : nkCard(d)) : legalCard(d), ev, el); };

// ---------------------------------------------------------------- shared guide line
const guides = [];
function setGuide(date) { guides.forEach(g => g(date)); }
function addGuide(svg, x, y0, y1, key) {
  if (EXPORTING) return;
  const line = svg.append('line').attr('class', 'guide').attr('y1', y0).attr('y2', y1).style('display', 'none');
  const at = key ? guides.findIndex(g => g.key === key) : -1, fn = key ? (f => (f.key = key, f)) : (f => f);
  const [r0, r1] = x.range();
  guides[at < 0 ? guides.length : at] = fn(date => date && x(date) >= r0 - 1 && x(date) <= r1 + 1 ? line.attr('x1', x(date)).attr('x2', x(date)).style('display', null) : line.style('display', 'none'));
}
function handoff(svg, x, y0, y1, label, anchorTop) {
  const X = x(parse(LAST_DA));
  const g = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  g.append('line').attr('x1', X).attr('x2', X).attr('y1', y0).attr('y2', y1);
  if (label) g.append('text').attr('x', X - 5).attr('y', anchorTop ? y0 + 10 : y1 - 6).attr('text-anchor', 'end').text(label);
}

// ---------------------------------------------------------------- legal band
const ABBR = { 'ltbt-1963': 'LTBT', 'ost-1967': 'OST', 'abm-1972': 'ABM Art. XII', 'paros-1981': 'PAROS', 'cd-paros-committee': 'CD PAROS cttee', 'itu-1992': 'ITU Arts. 45/48', 'ppwt-2008': 'PPWT', 'ppwt-2014': 'PPWT II', 'tallinn-2017': 'Tallinn 2.0*', 'unga-75-36': 'UNGA 75/36', 'oewg-2022': 'OEWG', 'us-moratorium-2022': 'US moratorium', 'milamos-2022': 'MILAMOS*', 'unga-77-41': 'UNGA 77/41', 'unsc-veto-2024': 'UNSC veto (nukes)', 'woomera-2024': 'Woomera*', 'itu-rrb-2024': 'ITU RRB ’24', 'icao-2025': 'ICAO ’25', 'itu-rrb-2025': 'ITU RRB ’25' };
const SHORT = { 'tallinn-2017': 'Tallinn*', 'unga-75-36': '75/36', 'milamos-2022': 'MILAMOS*', 'us-moratorium-2022': 'US pledge', 'unga-77-41': '77/41', 'woomera-2024': 'Woomera*', 'unsc-veto-2024': 'Veto', 'itu-rrb-2024': 'RRB ’24', 'icao-2025': 'ICAO ’25', 'itu-rrb-2025': 'RRB ’25' };
const ABBR_NOTE = 'LTBT: Limited Test Ban Treaty. OST: Outer Space Treaty. ABM Art. XII: ABM Treaty (non-interference with national technical means). PAROS: Prevention of an Arms Race in Outer Space. CD: Conference on Disarmament. ITU Arts. 45/48: ITU Constitution (harmful interference; military radio services). PPWT: Russia-China draft treaty on the placement of weapons in outer space. UNGA 75/36 and 77/41: UN General Assembly resolutions. OEWG: Open-ended Working Group. US pledge: 2022 US DA-ASAT test moratorium. Veto: Russia’s April 2024 veto of a UN Security Council draft on nuclear weapons in orbit (it did not concern DA-ASAT testing). RRB: ITU Radio Regulations Board. ICAO: International Civil Aviation Organization. An asterisk marks soft law (expert manuals, not binding).';
const SPAN_LABEL = { 'paros-1981': 'PAROS: UNGA agenda item since 1981', 'cd-paros-committee': 'CD Ad Hoc Cttee on PAROS, 1985–94', 'oewg-2022': 'OEWG, 2022–23' };
const KIND_LABEL = { treaty: 'Treaty', resolution: 'Resolution / body finding', unilateral: 'Unilateral pledge or soft law', veto: 'Veto', negotiation_span: 'Negotiation' };
function legalGlyph(sel, l) {
  if (l.soft_law) sel.append('path').attr('d', 'M0,-6.5L6.5,0L0,6.5L-6.5,0Z').style('fill', 'var(--bg)').style('stroke', 'var(--accent-2)').style('stroke-width', 1.8);
  else if (l.kind === 'treaty') sel.append('circle').attr('r', 5.5).style('fill', 'var(--accent)').style('stroke', 'var(--bg)').style('stroke-width', 1);
  else if (l.kind === 'resolution') sel.append('rect').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10).style('fill', 'var(--accent)').style('stroke', 'var(--bg)').style('stroke-width', 1);
  else if (l.kind === 'unilateral') sel.append('path').attr('d', 'M0,-6.5L6.5,5L-6.5,5Z').style('fill', 'var(--accent)').style('stroke', 'var(--bg)').style('stroke-width', 1);
  else if (l.kind === 'veto') sel.append('path').attr('d', 'M-5,-5L5,5M5,-5L-5,5').style('stroke', 'var(--warn)').style('stroke-width', 2.8);
  else sel.append('path').attr('d', 'M0,-5.5L5.5,0L0,5.5L-5.5,0Z').style('fill', 'var(--muted)').style('stroke', 'var(--bg)').style('stroke-width', 1).attr('transform', 'scale(0.9)');
}
const ZOOM = [parse('2021-06-01'), parse('2026-07-01')];
function drawLegal(el = document.getElementById('legalSvg'), zoom = false) {
  el.innerHTML = '';
  const { W, M, x } = layout(el, zoom ? ZOOM : DOMAIN), phone = isPhoneNow() && !zoom, compact = legalCompact && !phone && !EXPORTING && !zoom, small = phone || compact;
  const FS = 10.5, PITCH = 13, TP = phone ? 12 : compact ? 10 : 12, GS = phone ? 0.85 : compact ? 0.75 : 1;
  const spans = LEGAL.filter(l => l.kind === 'negotiation_span' && (l.end || l.id === 'paros-1981') && (!zoom || ((l.end ? parse(l.end) : DOMAIN[1]) > ZOOM[0] && parse(l.start) < ZOOM[1])));
  const pts = LEGAL.filter(l => !spans.includes(l) && (!zoom || (x(parse(l.start)) >= M.l - 1 && x(parse(l.start)) <= W - M.r + 1))).sort((a, b) => a.start < b.start ? -1 : 1);
  // 1. dodge marks that would collide into tracks (the true date stays on the axis)
  const last = []; let maxT = 0;
  pts.forEach(d => { const cx = x(parse(d.start)); let t = 0; while (last[t] != null && cx - last[t] < TP) t++; last[t] = cx; d._t = t; d._cx = cx; maxT = Math.max(maxT, t); });
  // 2. label placement, coordinates relative to the mark line (up is negative, down positive)
  const pl = new Placer({ x0: 4, x1: W - 4, y0: -999, y1: 999 }), top0 = 16 + TP * maxT, labels = []; let maxUp = -1, maxDn = -1;
  if (!small) {
    pts.forEach(d => { const bw = hasScene(d) ? 15 : 8; pl.add([d._cx - 8, -d._t * TP - 9 - (hasScene(d) ? 8 : 0), d._cx + bw, -d._t * TP + 8], 'G'); });
    // Clusters of nearby marks are solved together. Several deterministic strategies (labels ending at their mark, starting at it,
    // V-shaped splits) run on rows above AND below the mark line; the one needing the fewest rows wins. Every label and leader is
    // tested against all other labels, marks, leaders and the edges.
    const clusters = []; pts.forEach(d => { const c = clusters.at(-1); if (c && d._cx - c.at(-1)._cx < 200) c.push(d); else clusters.push([d]); });
    const anchorsOf = { end: [['end', -2]], start: [['start', 2]], middle: [['middle', 0], ['end', -2], ['start', 2]] };
    const run = (order, prim, commit) => {
      const base = pl.r.length, out = []; let mu = -1, md = -1, ok = true;
      for (const d of order) {
        const t = zoom ? (isPhoneNow() ? SHORT[d.id] || ABBR[d.id] : ABBR[d.id]) || d.label : SHORT[d.id] || ABBR[d.id] || d.label, w = tw(t, FS, 600); let hit = null;
        for (let k = 0; k < 12 && !hit; k++) for (const dir of ['dn', 'up']) { if (hit) break; for (const [anchor, dx] of anchorsOf[prim(d)]) {
          const off = dir === 'up' ? -(top0 + k * PITCH) : 20 + k * PITCH, q = pl.textRect(d._cx + dx, off, anchor, w, FS);
          const ld = dir === 'up' ? [d._cx - 0.75, off + 3, d._cx + 0.75, -d._t * TP - 8] : [d._cx - 0.75, 9, d._cx + 0.75, off - FS];
          if (pl.free(q) && pl.free(ld, ['G', 'L'])) { pl.r.push([...q, 'T'], [...ld, 'L']); hit = { d, t, tx: d._cx + dx, off, anchor, dir }; if (dir === 'up') mu = Math.max(mu, k); else md = Math.max(md, k); break; }
        } }
        if (!hit) { ok = false; break; } out.push(hit);
      }
      if (!commit || !ok) pl.r.length = base;
      return ok ? { out, mu, md, cost: (mu + 1) + (md + 1) } : null;
    };
    clusters.forEach(list => {
      const cands = [];
      for (let m = 0; m <= list.length; m++) {
        const L = list.slice(0, m), Rt = list.slice(m).reverse(), prim = d => list.indexOf(d) < m ? 'end' : 'start';
        cands.push({ order: [...L, ...Rt], prim }, { order: [...Rt, ...L], prim });
      }
      if (list.length === 1) cands.unshift({ order: list, prim: () => 'middle' });
      let best = null; cands.forEach(c => { const r = run(c.order, c.prim, false); if (r && (!best || r.cost < best.r.cost)) best = { c, r }; });
      if (!best) { console.warn('legal labels unplaced', list.map(d => d.id)); return; }
      const r = run(best.c.order, best.c.prim, true); labels.push(...r.out); maxUp = Math.max(maxUp, r.mu); maxDn = Math.max(maxDn, r.md);
    });
  }
  const yMark = small ? TP * maxT + 12 : Math.max(maxUp >= 0 ? top0 + maxUp * PITCH + 12 : 0, TP * maxT + 14);
  const dnSpace = !small && maxDn >= 0 ? 20 + maxDn * PITCH + 8 : 0;
  // spans: lanes below the mark line (and below any labels hanging under it)
  const lanes = [];
  spans.sort((a, b) => a.start < b.start ? -1 : 1).forEach(d => { const a = Math.max(M.l, x(parse(d.start))), b = Math.min(W - M.r, d.end ? x(parse(d.end)) : x(DOMAIN[1])); let i = lanes.findIndex(e => a > e + 6); if (i < 0) { i = lanes.length; lanes.push(0); } lanes[i] = b; d._lane = i; d._a = a; d._b = b; });
  const laneP = phone ? 9 : compact ? 6 : 18, lane0 = yMark + (small ? (compact ? 12 : 14) : Math.max(28, dnSpace + 18));
  const yAx = lane0 + (lanes.length - 1) * laneP + (compact ? 8 : 10), H = yAx + 22;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-label', zoom ? 'Legal and policy timeline, zoom on 2021 to 2026' : 'Legal and policy timeline');
  svg.append('title').text(zoom ? 'Law and policy responses, zoom 2021–2026' : 'Law and policy responses, 1957–2026');
  if (!zoom) { const zx0 = x(ZOOM[0]), zx1 = W - M.r; svg.append('rect').attr('class', 'zoombox').attr('x', zx0).attr('width', zx1 - zx0).attr('y', 0).attr('height', yAx).attr('rx', 3).attr('aria-hidden', 'true'); }
  svg.append('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', yMark).attr('y2', yMark).style('stroke', 'var(--line)');
  if (compact) svg.append('text').attr('class', 'band-label').attr('x', 4).attr('y', yMark + 4).text('LAW');
  // labels + leaders
  const lg = svg.append('g').attr('class', 'lbls').attr('aria-hidden', 'true');
  labels.forEach(({ d, t, tx, off, anchor, dir }) => {
    if (dir === 'up') lg.append('line').attr('x1', d._cx).attr('x2', d._cx).attr('y1', yMark + off + 3).attr('y2', yMark - d._t * TP - 8).style('stroke', 'var(--line)');
    else lg.append('line').attr('x1', d._cx).attr('x2', d._cx).attr('y1', yMark + 9).attr('y2', yMark + off - FS).style('stroke', 'var(--line)');
    lg.append('text').attr('x', tx).attr('y', yMark + off).attr('text-anchor', anchor).style('fill', d.soft_law ? 'var(--accent-2)' : 'var(--text)').style('font', `600 ${FS}px var(--sans)`).text(t);
  });
  // spans
  const sg = svg.append('g').selectAll('g').data(spans).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id).attr('data-t', d => +parse(d.start))
    .attr('aria-label', d => `${d.label}, ${fmtY(parse(d.start))} to ${d.end ? fmtY(parse(d.end)) : 'present'}. ${d.short_note}`);
  sg.append('rect').attr('x', d => d._a).attr('width', d => Math.max(3, d._b - d._a)).attr('y', d => lane0 + d._lane * laneP + 2).attr('height', compact ? 3 : 4).attr('rx', 2).style('fill', 'var(--accent)').style('opacity', 0.55);
  sg.append('rect').attr('class', 'hit').attr('x', d => d._a - 2).attr('width', d => Math.max(10, d._b - d._a + 4)).attr('y', d => lane0 + d._lane * laneP - (compact ? 2 : 6)).attr('height', compact ? 10 : 16);
  if (!small) spans.forEach(d => {
    const t = SPAN_LABEL[d.id] || d.label, w = tw(t, FS, 600), y = lane0 + d._lane * laneP - 2;
    const anchor = d._a + w <= W - 6 ? 'start' : 'end', tx = anchor === 'start' ? d._a : Math.min(W - 6, d._b);
    lg.append('text').attr('x', tx).attr('y', y).attr('text-anchor', anchor).style('fill', 'var(--muted)').style('font', `600 ${FS}px var(--sans)`).text(t);
  });
  bindMark(sg, legalCard, activate);
  // points
  pts.forEach(d => { d._y = yMark - d._t * TP; });
  svg.append('g').selectAll('line').data(pts.filter(d => d._t)).join('line').attr('x1', d => d._cx).attr('x2', d => d._cx).attr('y1', d => d._y).attr('y2', yMark).style('stroke', 'var(--faint)').style('stroke-width', 1);
  const pg = svg.append('g').selectAll('g').data(pts).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id).attr('data-t', d => +parse(d.start))
    .attr('transform', d => `translate(${d._cx},${d._y})${GS < 1 ? ` scale(${GS})` : ''}`)
    .attr('aria-label', d => `${d.label}, ${fmt(parse(d.start))}.${d.soft_law ? ' Soft law.' : ''} ${d.short_note}${hasScene(d) ? ' Has 3D scene.' : ''}`);
  pg.each(function (d) { legalGlyph(d3.select(this), d); if (hasScene(d)) badge(d3.select(this), 9, -10); });
  pg.append('circle').attr('class', 'hit').attr('r', 8);
  bindMark(pg, legalCard, activate);
  pg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  sg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  rove(svg.selectAll('.mark'));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${yAx})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(zoom ? 1 : phone ? 20 : 10)).tickFormat(fmtY).tickSizeOuter(0));
  addGuide(svg, x, 0, yAx, zoom ? 'legalzoom' : 'legal');
}
let legalCompact = false;
function legalScroll() {
  const band = document.getElementById('legalBand'), tr = document.getElementById('timeline').getBoundingClientRect();
  const stuck = !isPhoneNow() && band.getBoundingClientRect().top <= 0.5 && tr.top < -1 && tr.bottom > 200;
  if (stuck === legalCompact) return;
  if (band.contains(document.activeElement) && document.activeElement.closest('svg')) return; // never rebuild under a focused mark
  const h0 = band.offsetHeight; legalCompact = stuck;
  drawLegal(); band.classList.toggle('compact', stuck);
  band.style.marginBottom = stuck ? Math.max(0, h0 - band.offsetHeight) + 'px' : '0px';
}
addEventListener('scroll', () => requestAnimationFrame(legalScroll), { passive: true });
function drawLegalList() {
  const ul = document.getElementById('legalList');
  ul.innerHTML = LEGAL.slice().sort((a, b) => a.start < b.start ? -1 : 1).map(l => `<li><span class="ld">${l.end ? fmtY(parse(l.start)) + '–' + fmtY(parse(l.end)) : fmtMY(parse(l.start))}</span> <b>${esc(l.label)}</b>${l.soft_law ? ' <i>(soft law)</i>' : ''}<span class="ls">${esc(l.short_note)}</span></li>`).join('');
}
function drawLegalKey() {
  drawLegalList();
  const L = document.getElementById('legendLegal'); L.innerHTML = '';
  const li = (inner, text) => L.insertAdjacentHTML('beforeend', `<li><svg width="20" height="16" viewBox="-10 -8 20 16" aria-hidden="true">${inner}</svg>${text}</li>`);
  li('<circle r="5.5" style="fill:var(--accent)"/>', 'Treaty');
  li('<rect x="-5" y="-5" width="10" height="10" style="fill:var(--accent)"/>', 'Resolution or body finding');
  li('<path d="M0,-6.5L6.5,5L-6.5,5Z" style="fill:var(--accent)"/>', 'Unilateral pledge');
  li('<path d="M0,-6.5L6.5,0L0,6.5L-6.5,0Z" style="fill:var(--bg);stroke:var(--accent-2);stroke-width:1.8"/>', '* Soft law (expert manual, not binding)');
  li('<path d="M-5,-5L5,5M5,-5L-5,5" style="stroke:var(--warn);stroke-width:2.8"/>', 'Veto');
  li('<rect x="-9" y="-2" width="18" height="4" rx="2" style="fill:var(--accent);opacity:.55"/>', 'Negotiation span');
  document.getElementById('abbrLegal').textContent = ABBR_NOTE; document.getElementById('abbrLegal2').textContent = ABBR_NOTE;
  table('tableLegal', ['Label', 'Full name', 'Date', 'Kind', 'What it is'], LEGAL.map(l => [ABBR[l.id] || SPAN_LABEL[l.id] || l.label, l.label, l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : l.start, l.soft_law ? 'Soft law' : KIND_LABEL[l.kind] || l.kind, l.short_note]));
}

// ---------------------------------------------------------------- Chart A
function drawA(el = document.getElementById('svgA')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  const top = 18, plotH = phone ? 300 : 380, stripH = 30, H = top + plotH + stripH + 30;
  const y = d3.scaleLog().domain([90, 48000]).range([top + plotH, top]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hA').attr('id', 'svgA-root');
  svg.append('desc').text('Scatter of kinetic counterspace tests: year on the x axis, altitude on a log scale on the y axis, with LEO, MEO and GEO bands. Destructive tests have debris bubbles sized by cataloged fragments. A table view follows the chart.');
  // bands
  const bandLabels = [], handoffText = phone ? 'Last destructive test' : `Last destructive DA-ASAT test (as of ${AS_OF})`;
  const band = (a, b, fill, label, above) => { const ly = above ? y(b) - 4 : y(b) + (b === 35000 ? 24 : 13); bandLabels.push({ x: M.l + 6, y: ly, w: tw(label, 10.5, 600) + label.length * 0.85 }); svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', y(b)).attr('height', y(a) - y(b)).style('fill', fill);
    svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', ly).text(label); };
  band(90, 2000, 'var(--leo)', phone ? 'LEO' : 'LEO (to ~2,000 km)');
  band(2000, 35000, 'var(--meo)', phone ? 'MEO' : 'MEO (GNSS ~20,200 km)');
  band(35000, 37000, 'var(--geo)', 'GEO 35,786 km', true);
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).tickValues([100, 300, 1000, 3000, 10000, 30000]).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).tickValues([100, 300, 1000, 3000, 10000, 30000]).tickFormat(d => d >= 1000 ? d / 1000 + 'k' : d));
  svg.append('text').attr('class', 'ann-sub').attr('transform', `translate(12,${top + plotH / 2}) rotate(-90)`).attr('text-anchor', 'middle').text('Altitude, km (log)');
  // strip for unreported altitudes
  const sy = top + plotH + 6;
  svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', sy).attr('height', stripH - 6).style('fill', 'var(--surface-2)');
  svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', sy + 15).text(phone ? 'ALT. N/R' : 'ALTITUDE NOT REPORTED (no point on the scale)');
  xAxis(svg, x, top + plotH + stripH);
  // debris scale
  const rD = d3.scaleSqrt().domain([0, 3600]).range([0, phone ? 22 : 30]);
  // handoff marker
  handoff(svg, x, top, top + plotH + stripH, handoffText, true);
  // bubbles first (behind)
  const dest = KIN.filter(e => e.type === 'destructive');
  svg.append('g').selectAll('circle').data(dest).join('circle').attr('cx', d => x(parse(d.date))).attr('cy', d => y(d.altitude_km)).attr('r', d => rD(d.fragments_cataloged))
    .style('fill', d => colorOf(d.state)).style('fill-opacity', 0.16).style('stroke', d => colorOf(d.state)).style('stroke-opacity', 0.7).style('stroke-dasharray', '2 2').attr('aria-hidden', 'true');
  // marks
  const unk = KIN.filter(e => e.altitude_km == null);
  const stackIdx = new Map(); unk.forEach((e, i) => { const key = Math.round(x(parse(e.date)) / 9); const n = stackIdx.get(key) || 0; stackIdx.set(key, n + 1); e._sx = n; });
  const g = svg.append('g').selectAll('g').data(KIN).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id)
    .attr('transform', d => `translate(${x(parse(d.date)) + (d.altitude_km == null ? 0 : 0)},${d.altitude_km == null ? sy + 12 - (d._sx % 2) * 0 : y(d.altitude_km)})`)
    .attr('aria-label', d => `${fmt(parse(d.date))}. ${d.state}, ${d.system} against ${d.target}. ${TYPE_LABEL[d.type]}. Altitude ${d.altitude_km == null ? 'not reported' : d.altitude_km + ' km'}.${d.fragments_cataloged ? ' ' + d.fragments_cataloged + ' fragments cataloged.' : ''}${hasScene(d) ? ' Opens 3D scene.' : ''}`);
  g.each(function (d) {
    const s = d3.select(this), c = colorOf(d.state), r = phone ? 4 : 5;
    if (d.altitude_km == null) s.attr('transform', `translate(${x(parse(d.date))},${sy + 12 + (d._sx % 2 ? 0 : 0)})`);
    if (d.type === 'nuclear') s.append('path').attr('d', star(9)).style('fill', c).style('stroke', 'var(--bg)');
    else if (d.type === 'destructive') s.append('circle').attr('r', r + 1).style('fill', c).style('stroke', 'var(--bg)');
    else if (d.type === 'midcourse_intercept') s.append('path').attr('d', `M0,${-r - 1}L${r + 1},${r}L${-r - 1},${r}Z`).style('fill', c);
    else s.append('circle').attr('r', r).style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2);
    if (hasScene(d)) badge(s, 10, -10);
    s.append('circle').attr('class', 'hit').attr('r', 10);
  });
  bindMark(g, kinCard, activate); g.attr('data-t', d => +parse(d.date)); rove(g);
  // annotations: each tries several offsets and takes the first that clears band labels, the handoff label, all marks and earlier notes
  const pl = new Placer({ x0: 2, x1: W - 2, y0: 0, y1: H });
  bandLabels.forEach(b => pl.add(pl.textRect(b.x, b.y, 'start', b.w, 10.5)));
  pl.add(pl.textRect(x(parse(LAST_DA)) - 5, top + 10, 'end', tw(handoffText, 11, 600), 11));
  KIN.forEach(d => { const X = x(parse(d.date)), Y = d.altitude_km == null ? sy + 12 : y(d.altitude_km); pl.add([X - 11, Y - 19, X + 17, Y + 11], 'M'); });
  const ann = (id, t1, t2, prefs) => {
    const e = byId[id], X = x(parse(e.date)), Y = y(e.altitude_km), w = Math.max(tw(t1, 12, 600), t2 ? tw(t2, 11.5) : 0);
    for (const [dx, dy, anchor] of prefs) {
      const tx = X + dx, ty = Y + dy, x0 = anchor === 'end' ? tx - w : tx, q = [x0, ty - 12, x0 + w, ty + (t2 ? 18 : 5)];
      if (!pl.free(q, [], 3)) continue;
      pl.add(q);
      svg.append('line').attr('x1', X).attr('y1', Y).attr('x2', X + dx * 0.85).attr('y2', Y + dy * 0.85 - (dy > 0 ? 0 : -4)).style('stroke', 'var(--muted)');
      const t = svg.append('text').attr('x', tx).attr('y', ty).attr('text-anchor', anchor);
      t.append('tspan').attr('class', 'ann').text(t1); if (t2) t.append('tspan').attr('class', 'ann-sub').attr('x', tx).attr('dy', 14).text(t2);
      return;
    }
    console.warn('annotation unplaced', id);
  };
  const sweep = () => { const o = []; for (let dy = -30; dy >= -200; dy -= 14) o.push([-34, dy, 'end'], [34, dy, 'start']); for (let dy = 30; dy <= 200; dy += 14) o.push([-34, dy, 'end'], [34, dy, 'start']); return o; };
  const around = (a, b) => [[-a, b, 'end'], [a, b, 'start'], [-a, -b, 'end'], [a, -b, 'start'], [-a - 30, b + 20, 'end'], [a + 30, b + 20, 'start'], [-a - 30, -b - 20, 'end'], [a + 30, -b - 20, 'start']];
  if (!phone) {
    ann('cn-2013-dn2', 'Demonstrated reach toward GEO: DN-2 (2013)', '~30,000 km apogee. Not an intercept (hollow mark).', [...around(40, 28), ...sweep()]);
    ann('cn-2007-fy1c', 'Peak intercept is still Fengyun-1C (2007): 880 km', 'Intercept altitudes have not climbed since.', [[-34, -42, 'end'], [-34, -60, 'end'], ...around(34, 42), ...sweep()]);
    ann('us-1962-starfish-prime', 'Starfish Prime (nuclear, 1962)', null, [[18, -40, 'start'], [18, -60, 'start'], ...around(18, 30), ...sweep()]);
  } else {
    ann('cn-2013-dn2', 'DN-2 reach (apogee)', null, around(20, 24));
    ann('cn-2007-fy1c', 'Peak intercept: FY-1C', null, [[-20, -34, 'end'], [20, -34, 'start'], ...around(20, 30), ...sweep()]);
  }
  addGuide(svg, x, top, top + plotH + stripH);
  // legend
  if (EXPORTING) return;
  const L = document.getElementById('legendA'); L.innerHTML = '';
  const li = (svgInner, text, w = 22, h = 18) => { L.insertAdjacentHTML('beforeend', `<li><svg width="${w}" height="${h}" viewBox="${-w / 2} ${-h / 2} ${w} ${h}" aria-hidden="true">${svgInner}</svg>${text}</li>`); };
  li('<circle r="5" style="fill:var(--text)"/>', 'Intercept altitude (destructive)');
  li('<path d="M0,-6L6,5L-6,5Z" style="fill:var(--text)"/>', 'Intercept of a missile (suborbital) target');
  li('<circle r="5" style="fill:none;stroke:var(--text);stroke-width:2"/>', 'Apogee, flyby or non-intercept test');
  li(`<path d="${star(8)}" style="fill:var(--text)"/>`, 'Nuclear detonation');
  li('<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>', 'Has a 3D scene');
  ['United States', 'Russia', 'China', 'India'].forEach(s => li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s === 'Russia' ? 'USSR / Russia' : s));
  const sizes = [100, 1000, 3500], mx = rD(3500), bw = mx * 2 + 46;
  L.insertAdjacentHTML('beforeend', `<li class="wide"><svg width="${bw}" height="${mx * 2 + 6}" viewBox="0 0 ${bw} ${mx * 2 + 6}" aria-hidden="true">${sizes.map(sz => `<circle cx="${mx + 2}" cy="${mx * 2 + 3 - rD(sz)}" r="${rD(sz)}" style="fill:none;stroke:var(--muted);stroke-dasharray:2 2"/><text x="${mx * 2 + 8}" y="${mx * 2 + 3 - rD(sz) * 2 + 9}" style="fill:var(--muted);font:10px var(--sans)">${d3.format(',')(sz)}</text>`).join('')}</svg><span>Debris bubble area = cataloged fragments (as of Feb. 2026). Still-in-orbit counts appear in cards and the table, never on this scale.</span></li>`);
  // table
  table('tableA', ['Date', 'State', 'System', 'Target', 'Type', 'Altitude (km)', 'Kind', 'Cataloged', 'In orbit', 'Conf.', 'Source'],
    KIN.map(e => [e.date, e.state, e.system, e.target, TYPE_LABEL[e.type], e.altitude_km ?? '—', e.altitude_kind, num(e.fragments_cataloged), num(e.fragments_in_orbit), e.confidence, srcCell(e)]));
}
const srcCell = r => `<a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source)}</a>, ${esc(r.pin)}`;
function table(id, head, rows) {
  document.getElementById(id).innerHTML = `<table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${typeof c === 'string' && c.startsWith('<a') ? c : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// ---------------------------------------------------------------- Chart C
const LANES = [
  { key: 'ew', label: 'EW: uplink / downlink jamming', cats: ['ew_uplink', 'ew_downlink'] },
  { key: 'gnss', label: 'GNSS jamming & spoofing', cats: ['gnss_jamming', 'gnss_spoofing'] },
  { key: 'de', label: 'Directed energy (lasers)', cats: ['directed_energy'] },
  { key: 'cy', label: 'Cyber', cats: ['cyber'] },
];
function regimeIcon(g, regime) {
  const s = g.append('g').attr('class', 'regime').style('fill', 'var(--muted)').style('stroke', 'var(--muted)');
  if (regime === 'GNSS_MEO') s.append('path').attr('d', 'M0,-4.5L4.5,3.5L-4.5,3.5Z').style('stroke', 'none');
  else if (regime === 'GEO_comms') { s.append('circle').attr('r', 4).style('fill', 'none').style('stroke-width', 1.5); s.append('circle').attr('r', 1.3).style('stroke', 'none'); }
  else if (regime === 'LEO_constellation') [-3.5, 0, 3.5].forEach(dx => s.append('circle').attr('cx', dx).attr('r', 1.5).style('stroke', 'none'));
  else if (regime === 'ground_segment') { s.append('rect').attr('x', -4).attr('y', 0).attr('width', 8).attr('height', 4).style('stroke', 'none'); s.append('path').attr('d', 'M0,0V-5M-3,-3L0,-5L3,-3').style('fill', 'none').style('stroke-width', 1.2); }
  else s.append('path').attr('d', 'M0,-4.5L4.5,0L0,4.5L-4.5,0Z').style('stroke', 'none');
  return s;
}
function attrStyle(sel, d) {
  const c = colorOf(d.actor);
  if (d.attribution === 'official_government' || d.attribution === 'multi_government') sel.style('fill', c).style('stroke', c).style('stroke-width', 1.5);
  else if (d.attribution === 'researcher_osint') sel.style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2);
  else sel.style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2).style('stroke-dasharray', '4 2.5');
}
const stateC = { focus: true };
const C_FOCUS = () => [parse('1995-01-01'), DOMAIN[1]];
const C_LINE = 12.5;
function drawC(el = document.getElementById('svgC')) {
  const dom = stateC.focus ? C_FOCUS() : DOMAIN;
  const { W, M, x } = layout(el, dom), phone = isPhoneNow();
  const FS = 10.5, laneHead = 24, lanePad = 10, top = 8, R = W - M.r, HX = x(parse(LAST_DA)), RIGHT = W - 8;
  const XS = e => Math.max(M.l, x(parse(e.start)));
  const pl = new Placer({ x0: 2, x1: W - 2, y0: 0, y1: 99999 });
  let yCur = top; const placed = [];
  // Labels are never truncated: each one is wrapped (up to 3 lines when it fits, more only as a last resort) and is kept clear of the 2021 hand-off line.
  // Candidates: (A) above the bar, starting at its left end; (B) to the left of the mark; (G) in the gutter left of the hand-off line, joined to the mark by a dotted leader.
  const plan = e => {
    const point = e.end === e.start, X0 = XS(e), X1 = point ? X0 : e.end ? x(parse(e.end)) : R - 8;
    const short = actorKey(e.actor) ? (actorKey(e.actor) === 'United States' ? 'US' : actorKey(e.actor)) : e.actor.split(' ')[0];
    const full = `${short}: ${e.target_system.split(' (')[0]}`;
    let lx = X0 + (point ? 12 : 4) + (hasScene(e) ? 12 : 0); if (lx >= HX - 8 && lx < HX + 6) lx = HX + 6;
    const cands = [{ mode: 'above', anchor: 'start', tx: lx, limit: (lx < HX - 8 ? HX - 8 : RIGHT) - lx }];
    { const tx = X0 - 22; cands.push({ mode: 'left', anchor: 'end', tx, limit: tx - (tx > HX + 8 ? HX + 8 : M.l + 2) }); }
    if (X0 > HX + 8) cands.push({ mode: 'gutter', anchor: 'end', tx: HX - 8, limit: HX - 8 - (M.l + 4) });
    const opts = cands.map((c, i) => { const lines = wrap(full, Math.max(60, c.limit), FS); const w = Math.max(...lines.map(s => tw(s, FS)));
      return { ...c, lines, w, bad: c.limit < 70 || w > c.limit + 0.5, cost: lines.length + (lines.length > 3 ? 10 : 0) + i * 0.1 }; });
    opts.forEach(o => { if (o.bad) o.cost += 50; });
    const best = opts.reduce((a, b) => b.cost < a.cost ? b : a);
    const lx0 = best.anchor === 'start' ? best.tx : best.tx - best.w;
    const ext = [Math.min(lx0, X0 - 16) - 6, Math.max(lx0 + best.w, X1 + (e.end ? 6 : 12), best.mode === 'gutter' ? X0 : 0) + 6];
    return { e, point, X0, X1, ...best, lx0, ext };
  };
  const laneRows = LANES.map(l => {
    const rows = [];
    NK.filter(e => l.cats.includes(e.category)).sort((a, b) => a.start < b.start ? -1 : 1).forEach(e => {
      const p = plan(e); let r = rows.findIndex(row => row.items.every(q => p.ext[0] > q.ext[1] || p.ext[1] < q.ext[0]));
      if (r < 0) { r = rows.length; rows.push({ items: [] }); } rows[r].items.push(p);
    });
    return rows;
  });
  LANES.forEach((l, li) => {
    const rows = laneRows[li]; let yy = yCur + laneHead;
    rows.forEach(row => {
      const nA = Math.max(0, ...row.items.filter(p => p.mode === 'above').map(p => p.lines.length)), nC = Math.max(0, ...row.items.filter(p => p.mode !== 'above').map(p => p.lines.length));
      const off = Math.max(16, nA ? (nA - 1) * C_LINE + 22 : 0, nC ? nC * C_LINE / 2 + 9 : 0);
      row.y = yy + off; yy += off + 14;
      row.items.forEach(p => {
        p.y = row.y; p.lane = l.key; p.base = p.mode === 'above' ? p.y - 8 - (p.lines.length - 1) * C_LINE : p.y + 4 - (p.lines.length - 1) * C_LINE / 2; placed.push(p);
        pl.add([p.lx0, p.base - FS * 0.95, p.lx0 + p.w, p.base + (p.lines.length - 1) * C_LINE + FS * 0.25]); pl.add([Math.min(p.X0 - 16, p.lx0), p.y - 7, Math.max(p.X1 + 12, 0), p.y + 8], 'B');
      });
    });
    l.y0 = yCur; l.y1 = Math.max(yy, yCur + laneHead + 32) + lanePad; yCur = l.y1;
  });
  const H = yCur + 28;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hC').attr('id', 'svgC-root');
  svg.append('desc').text('Swimlane chart of non-kinetic counterspace operations by category. Bars are sustained campaigns; points are discrete events; arrowheads mark ongoing campaigns. Solid fill means official or multi-government attribution, outline means researcher or open-source attribution, dashed outline means alleged. A data table follows the chart.');
  LANES.forEach((l, i) => {
    svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', l.y0).attr('height', l.y1 - l.y0).style('fill', i % 2 ? 'transparent' : 'var(--recon)');
    svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', l.y0 + 14).text(l.label.toUpperCase());
  });
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(0,${yCur})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(stateC.focus ? (phone ? 10 : 5) : 10)).tickSize(-(yCur - top)).tickFormat(''));
  xAxis(svg, x, yCur, stateC.focus ? (phone ? 10 : 5) : undefined);
  LANES.forEach(l => { const t = l.label.toUpperCase(); pl.add(pl.textRect(M.l + 6, l.y0 + 14, 'start', tw(t, 10.5, 600) + t.length * 0.85, 10.5)); });
  // handoff line + label placed where it collides with nothing
  const hg = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  hg.append('line').attr('x1', HX).attr('x2', HX).attr('y1', top).attr('y2', yCur);
  { const t = phone ? 'last destructive test' : 'Last destructive DA-ASAT test (Nov 2021)', w = tw(t, 11, 600); let ok = false;
    for (let yy = top + 12; yy < yCur - 4 && !ok; yy += 4) for (const [a, dx] of [['end', -5], ['start', 5]]) {
      const q = pl.textRect(HX + dx, yy, a, w, 11); if (pl.free(q)) { hg.append('text').attr('x', HX + dx).attr('y', yy).attr('text-anchor', a).text(t); pl.add(q); ok = true; break; } } 
    if (!ok) hg.append('text').attr('x', HX - 5).attr('y', yCur - 6).attr('text-anchor', 'end').text(t); }
  if (!phone && !stateC.focus) {
    const ax = x(parse('1959-01-01')), t = svg.append('text').attr('x', ax).attr('y', LANES[0].y0 + 40);
    ['Non-kinetic effects are reversible, deniable, and used', 'repeatedly in real conflicts. The rules that govern them', 'are soft law (expert manuals) or carry military', 'exemptions (ITU Constitution Art. 48). See legal band.'].forEach((s, i) => t.append('tspan').attr('x', ax).attr('dy', i ? 15 : 0).attr('class', 'ann-sub').style('font-weight', i === 0 ? 600 : null).style('fill', 'var(--text)').text(s));
  }
  const g = svg.append('g').selectAll('g').data(placed).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.e.id).attr('data-t', d => +parse(d.e.start))
    .attr('aria-label', d => { const e = d.e; return `${e.actor}: ${e.target_system}. ${e.end === e.start ? fmt(parse(e.start)) : `${fmtY(parse(e.start))} to ${e.end ? fmtY(parse(e.end)) : 'ongoing'}`}. Attribution: ${ATTR_LABEL[e.attribution]}.${hasScene(e) ? ' Opens 3D scene.' : ''}`; });
  g.each(function (d) {
    const e = d.e, s = d3.select(this), X0 = d.X0;
    if (d.point) attrStyle(s.append('circle').attr('cx', X0).attr('cy', d.y).attr('r', 6), e);
    else {
      attrStyle(s.append('rect').attr('x', X0).attr('y', d.y - 5).attr('width', Math.max(4, d.X1 - X0)).attr('height', 10).attr('rx', 2), e);
      if (!e.end) s.append('path').attr('d', `M${d.X1},${d.y - 7}L${d.X1 + 8},${d.y}L${d.X1},${d.y + 7}Z`).style('fill', colorOf(e.actor));
    }
    regimeIcon(s, e.target_regime).attr('transform', `translate(${X0 - 11},${d.y})`);
    if (hasScene(e)) badge(s, X0 + (d.point ? 12 : 9), d.y - 8);
    if (d.mode === 'gutter') s.append('line').attr('x1', d.tx + 4).attr('x2', X0 - 16).attr('y1', d.y).attr('y2', d.y).style('stroke', 'var(--faint)').style('stroke-dasharray', '1 3');
    const t = s.append('text').attr('x', d.tx).attr('y', d.base).attr('text-anchor', d.anchor).style('fill', 'var(--text)').style('font', `${FS}px var(--sans)`);
    d.lines.forEach((ln, i) => t.append('tspan').attr('x', d.tx).attr('dy', i ? C_LINE : 0).text(ln));
    s.append('rect').attr('class', 'hit').attr('x', X0 - 18).attr('y', d.y - 12).attr('width', d.point ? 36 : Math.max(36, d.X1 - X0 + 30)).attr('height', 24);
  });
  bindMark(g, d => nkCard(d.e), (d, el, ev) => activate(d.e, el, ev));
  rove(g);
  addGuide(svg, x, top, yCur);
  if (EXPORTING) return;
  document.getElementById('noteC').textContent = stateC.focus
    ? 'This chart’s axis starts in 1995, not 1957: the ledger’s earliest non-kinetic entry is the 1997 MIRACL laser test, so 1957–1994 would be blank and would squeeze every label. Guide lines still follow the shared year axis. Choose “Full span” to align the axis with Charts A and B.'
    : 'Full span 1957–2026, on the same axis as Charts A and B. Until the late 1990s the ledger records no non-kinetic operations.';
  document.getElementById('cFocus').setAttribute('aria-pressed', stateC.focus); document.getElementById('cFull').setAttribute('aria-pressed', !stateC.focus);
  const L = document.getElementById('legendC'); L.innerHTML = '';
  const li = (inner, text, w = 26) => L.insertAdjacentHTML('beforeend', `<li><svg width="${w}" height="16" viewBox="${-w / 2} -8 ${w} 16" aria-hidden="true">${inner}</svg>${text}</li>`);
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:var(--text)"/>', 'Official or multi-government attribution');
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:none;stroke:var(--text);stroke-width:2"/>', 'Researcher / OSINT attribution');
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:none;stroke:var(--text);stroke-width:2;stroke-dasharray:4 2.5"/>', 'Alleged');
  li('<path d="M-8,-6L2,0L-8,6Z" style="fill:var(--text)"/>', 'Ongoing');
  L.insertAdjacentHTML('beforeend', '<li class="lsep" aria-hidden="true"></li>');
  li('<path d="M0,-4.5L4.5,3.5L-4.5,3.5Z" style="fill:var(--muted)"/>', 'GNSS (MEO signals)', 14);
  li('<circle r="4" style="fill:none;stroke:var(--muted);stroke-width:1.5"/><circle r="1.3" style="fill:var(--muted)"/>', 'GEO comms', 14);
  li('<circle cx="-3.5" r="1.5" style="fill:var(--muted)"/><circle r="1.5" style="fill:var(--muted)"/><circle cx="3.5" r="1.5" style="fill:var(--muted)"/>', 'LEO constellation', 14);
  li('<rect x="-4" y="0" width="8" height="4" style="fill:var(--muted)"/><path d="M0,0V-5M-3,-3L0,-5L3,-3" style="fill:none;stroke:var(--muted)"/>', 'Ground segment', 14);
  li('<path d="M0,-4.5L4.5,0L0,4.5L-4.5,0Z" style="fill:var(--muted)"/>', 'LEO imaging / ISR', 14);
  L.insertAdjacentHTML('beforeend', '<li class="lsep" aria-hidden="true"></li>');
  ['Russia', 'China', 'United States', 'Iran', 'North Korea', 'Israel', 'Iraq'].forEach(s => li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s, 14));
  table('tableC', ['Start', 'End', 'Actor', 'Category', 'Attribution (as source states)', 'Target', 'Operational', 'Conf.', 'Source'],
    NK.map(e => [e.start, e.end === e.start ? '(discrete)' : e.end || 'ongoing', e.actor, e.category, ATTR_LABEL[e.attribution], `${e.target_system} [${REGIME_LABEL[e.target_regime]}]`, e.operational_use ? 'yes' : 'no', e.confidence, srcCell(e)]));
}

// ---------------------------------------------------------------- Chart B
const CATS = [
  { key: 'direct_ascent', label: 'Direct-ascent ASAT', v: '--cat-da', kin: true },
  { key: 'co_orbital', label: 'Co-orbital', v: '--cat-co', kin: true },
  { key: 'electronic_warfare', label: 'Electronic warfare', v: '--cat-ew', kin: false },
  { key: 'directed_energy', label: 'Directed energy', v: '--cat-de', kin: false },
  { key: 'cyber', label: 'Cyber', v: '--cat-cy', kin: false },
];
const stateB = { group: 'cat', on: new Set(CATS.map(c => c.key)) };
function countsB() {
  const decs = CAPS.decades;
  if (stateB.group === 'cat') {
    return { series: CATS.filter(c => stateB.on.has(c.key)).flatMap(c => ['D', 'P'].map(s => ({ key: c.key + ':' + s, label: `${c.label} (${s === 'D' ? 'demonstrated' : 'developing'})`, v: c.v, dev: s === 'P',
      vals: decs.map(d => Object.values(CAPS.coding[c.key][d] || {}).filter(x => x === s).length) }))) };
  }
  const grp = [{ key: 'kin', label: 'Kinetic (direct-ascent, co-orbital)', v: '--cat-da', cats: ['direct_ascent', 'co_orbital'] }, { key: 'non', label: 'Non-kinetic (EW, directed energy, cyber)', v: '--cat-ew', cats: ['electronic_warfare', 'directed_energy', 'cyber'] }];
  return { series: grp.flatMap(gr => ['D', 'P'].map(s => ({ key: gr.key + ':' + s, label: `${gr.label} (${s === 'D' ? 'demonstrated' : 'developing'})`, v: gr.v, dev: s === 'P',
    vals: decs.map(d => { const st = {}; gr.cats.forEach(c => Object.entries(CAPS.coding[c][d] || {}).forEach(([k, v]) => { st[k] = st[k] === 'D' || v === 'D' ? 'D' : 'P'; })); return Object.values(st).filter(x => x === s).length; }) }))) };
}
function drawB(el = document.getElementById('svgB')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  // annotation lives in its own band ABOVE the plot, so it never sits on the data
  const ew20 = Object.keys(CAPS.coding.electronic_warfare['2020s']).length;
  const da20 = Object.entries(CAPS.coding.direct_ascent['2020s']).filter(([, v]) => v === 'D').map(([k]) => k);
  const annHead = `Electronic warfare drives most of the crowding: ${ew20} states in the 2020s.`;
  const annSub = `Demonstrated destructive DA-ASAT capability has stayed at four states: ${da20.map(s => s === 'Russia' ? 'USSR/Russia' : s === 'United States' ? 'US' : s).join(', ')}.`;
  const annW = W - 24, annL = wrap(annHead, annW, 12, 600), annS = wrap(annSub, annW, 11.5), annH = (annL.length + annS.length) * 15 + 10;
  const top = annH + 8, plotH = phone ? 230 : 290, H = top + plotH + 30;
  const decs = CAPS.decades, starts = decs.map(d => +d.slice(0, 4));
  const xs = starts.map(s => parse(`${Math.max(1957, s)}-01-01`)).concat([DOMAIN[1]]);
  const { series } = countsB();
  const stackData = xs.map((xd, i) => { const o = { x: xd }; series.forEach(s => o[s.key] = s.vals[Math.min(i, decs.length - 1)]); return o; });
  const stack = d3.stack().keys(series.map(s => s.key)).offset(d3.stackOffsetNone)(stackData);
  const maxY = Math.max(4, d3.max(stack.at(-1) || [[0, 0]], d => d[1]) || 0);
  const y = d3.scaleLinear().domain([0, Math.ceil(maxY / (1 - 44 / plotH) / 2) * 2]).range([top + plotH, top]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'img').attr('aria-labelledby', 'hB').attr('id', 'svgB-root');
  svg.append('desc').text('Stacked step area of the number of states holding each counterspace capability per decade, zero baseline. See the data table for exact counts.');
  const defs = svg.append('defs');
  series.forEach(s => { const p = defs.append('pattern').attr('id', 'hatch-' + s.key.replace(':', '-')).attr('width', 6).attr('height', 6).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)');
    p.append('rect').attr('width', 6).attr('height', 6).style('fill', `var(${s.v})`).style('fill-opacity', 0.14); p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).style('stroke', `var(${s.v})`).style('stroke-width', 2.2); });
  const X2020 = x(parse('2020-01-01'));
  svg.append('rect').attr('x', M.l).attr('width', X2020 - M.l).attr('y', top).attr('height', plotH).style('fill', 'var(--recon)');
  svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', top + 12).text(phone ? 'RECONSTRUCTED' : 'RECONSTRUCTED (NOT SWF-ASSESSED)');
  { const t = svg.append('text').attr('class', 'band-label').attr('text-anchor', 'end').attr('x', W - M.r - 4);
    t.append('tspan').attr('x', W - M.r - 4).attr('y', top + 12).text(phone ? 'SWF 2026' : 'SWF 2026');
    t.append('tspan').attr('x', W - M.r - 4).attr('dy', 12).text(phone ? '13 states' : '13 STATES ASSESSED'); }
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')));
  svg.append('text').attr('class', 'ann-sub').attr('transform', `translate(12,${top + plotH / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(stateB.group === 'cat' ? 'State-capability pairs' : 'Unique states per group');
  const area = d3.area().x(d => x(d.data.x)).y0(d => y(d[0])).y1(d => y(d[1])).curve(d3.curveStepAfter);
  svg.append('g').selectAll('path').data(stack).join('path').attr('d', area)
    .style('fill', (d, i) => series[i].dev ? `url(#hatch-${series[i].key.replace(':', '-')})` : `var(${series[i].v})`).style('fill-opacity', (d, i) => series[i].dev ? 1 : 0.85)
    .style('stroke', 'var(--bg)').style('stroke-width', 0.8).append('title').text((d, i) => series[i].label);
  xAxis(svg, x, top + plotH);
  addGuide(svg, x, top, top + plotH);
  { const t = svg.append('text').attr('x', 4).attr('y', 14); let n = 0;
    annL.forEach(l => t.append('tspan').attr('class', 'ann').attr('x', 4).attr('dy', n++ ? 15 : 0).text(l));
    annS.forEach(l => t.append('tspan').attr('class', 'ann-sub').attr('x', 4).attr('dy', n++ ? 15 : 0).text(l)); }
  if (EXPORTING) return;
  document.getElementById('noteB').textContent = stateB.group === 'cat'
    ? 'Vertical axis: state-capability pairs. A state with two capabilities is counted twice.'
    : 'Vertical axis changed: unique states per group, not pairs. A state with both kinetic and non-kinetic capability is counted once in each group, so the two bands can sum to more than the number of states.';
  // legend + chips
  const L = document.getElementById('legendB'); L.innerHTML = '';
  L.insertAdjacentHTML('beforeend', `<li><svg width="18" height="12" aria-hidden="true"><rect width="18" height="12" style="fill:var(--muted)"/></svg>Demonstrated (tested or used)</li><li><svg width="18" height="12" aria-hidden="true"><defs><pattern id="lh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line y2="5" style="stroke:var(--muted);stroke-width:2"/></pattern></defs><rect width="18" height="12" fill="url(#lh)"/></svg>Developing or latent</li>`);
  table('tableB', ['Category', ...CAPS.decades], CATS.map(c => [c.label, ...CAPS.decades.map(d => { const o = CAPS.coding[c.key][d] || {}; const D_ = Object.keys(o).filter(k => o[k] === 'D'), P_ = Object.keys(o).filter(k => o[k] === 'P'); return `${D_.length} demonstrated${D_.length ? ' (' + D_.join(', ') + ')' : ''}; ${P_.length} developing${P_.length ? ' (' + P_.join(', ') + ')' : ''}`; })]));
}
function chipsB() {
  const el = document.getElementById('chipsB'); el.innerHTML = '';
  CATS.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', stateB.on.has(c.key)); b.innerHTML = `<i style="background:var(${c.v})"></i>${c.label}`;
    b.disabled = stateB.group !== 'cat';
    b.onclick = () => { stateB.on.has(c.key) ? stateB.on.delete(c.key) : stateB.on.add(c.key); if (!stateB.on.size) stateB.on.add(c.key); chipsB(); drawB(); }; el.appendChild(b); });
}
document.getElementById('cFocus').onclick = () => { stateC.focus = true; drawC(); };
document.getElementById('cFull').onclick = () => { stateC.focus = false; drawC(); };
document.getElementById('grpCat').onclick = () => { stateB.group = 'cat'; grpBtns(); chipsB(); drawB(); };
document.getElementById('grpKin').onclick = () => { stateB.group = 'kin'; grpBtns(); chipsB(); drawB(); };
function grpBtns() { document.getElementById('grpCat').setAttribute('aria-pressed', stateB.group === 'cat'); document.getElementById('grpKin').setAttribute('aria-pressed', stateB.group === 'kin'); }

// ---------------------------------------------------------------- Lag panel
const LAG = [
  { cap: 'us-1959-bold-orion', law: 'ost-1967', text: 'First DA-ASAT flyby → Outer Space Treaty (silent on conventional ASATs)' },
  { cap: 'us-1962-starfish-prime', law: 'ltbt-1963', text: 'Starfish Prime → Limited Test Ban Treaty (followed it)' },
  { cap: 'cn-2007-fy1c', law: 'unga-77-41', text: 'Fengyun-1C debris → UNGA 77/41 call to stop destructive tests (non-binding)' },
  { cap: 'ru-2021-cosmos1408', law: 'us-moratorium-2022', text: 'Cosmos 1408 → US test moratorium (unilateral pledge)' },
  { cap: 'ru-2014-ukraine', law: 'icao-2025', text: 'Russian GNSS interference (from 2014) → first ICAO finding against Russia' },
  { cap: 'ru-2024-eu-sats', law: 'itu-rrb-2024', text: 'Jamming of European satellites → ITU RRB “grave concern”' },
  { cap: 'us-1997-miracl', law: null, text: 'Laser fired at a satellite → no specific rule on lasers against satellites' },
  { cap: 'ru-2022-viasat', law: null, text: 'Viasat cyberattack → attributions only; Tallinn 2.0 is soft law' },
];
const capDate = r => parse(r.date || r.start);
const HEX = 'M0,-6.5L5.6,-3.25L5.6,3.25L0,6.5L-5.6,3.25L-5.6,-3.25Z';
function drawL(el = document.getElementById('svgL')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhoneNow();
  const FS = phone ? 11 : 12, top = 10, maxW = W - 24;
  const rowsInfo = LAG.map(p => { const lines = wrap(p.text, maxW, FS); return { p, lines, w: Math.max(...lines.map(s => tw(s, FS))), rowH: lines.length * (FS + 3) + 64 }; });
  const H = top + rowsInfo.reduce((s, r) => s + r.rowH, 0) + 30, yAx = H - 28;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hL').attr('id', 'svgL-root');
  svg.append('desc').text('Dumbbell chart: for each pair, a hexagon marks the capability milestone and a shape marks the legal or policy response (circle for treaty, square for a resolution or body finding, triangle for a unilateral pledge). The gap is the lag in years. An open ring means no binding rule yet.');
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(0,${yAx})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(phone ? 20 : 10)).tickSize(-(yAx - top)).tickFormat(''));
  xAxis(svg, x, yAx);
  const rows = []; let y0 = top;
  const gs = rowsInfo.map(({ p, lines, w, rowH }) => {
    const c = byId[p.cap], l = p.law ? byId[p.law] : null, yy = y0 + lines.length * (FS + 3) + 18;
    const a = capDate(c), b = l ? parse(l.start) : DOMAIN[1], xa = x(a), xb = x(b);
    const years = l ? ((b - a) / (365.25 * 864e5)) : null;
    const col = c.domain === 'kinetic' ? 'var(--cat-da)' : 'var(--cat-ew)';
    const lagTxt = l ? (years < 1 ? `${Math.round(years * 12)} months` : `${years.toFixed(1)} years`) : 'no binding rule yet';
    const g = svg.append('g').attr('class', 'mark').attr('tabindex', 0).attr('role', 'img').attr('data-t', +a).attr('aria-label', `${p.text}. ${l ? lagTxt : 'No binding response yet'}.`);
    g.append('rect').attr('class', 'hit').attr('x', 6).attr('y', y0 - 2).attr('width', W - 12).attr('height', rowH - 6).attr('rx', 6);
    const tx = phone ? 12 : Math.max(12, Math.min(Math.min(xa, xb) - 6, W - 12 - w));
    lines.forEach((s, i) => g.append('text').attr('x', tx).attr('y', y0 + (i + 1) * (FS + 3) - 2).style('fill', 'var(--text)').style('font', `${FS}px var(--sans)`).text(s));
    g.append('line').attr('x1', xa).attr('x2', xb - (l ? 0 : 9)).attr('y1', yy).attr('y2', yy).style('stroke', col).style('stroke-width', 2.5).style('stroke-dasharray', l ? null : '3 3');
    g.append('path').attr('d', HEX).attr('transform', `translate(${xa},${yy}) scale(1.45)`).style('fill', col).style('stroke', 'var(--bg)').style('stroke-width', 1);
    if (l) legalGlyph(g.append('g').attr('transform', `translate(${xb},${yy}) scale(1.7)`), l);
    else g.append('circle').attr('cx', xb - 9).attr('cy', yy).attr('r', 8).style('fill', 'var(--bg)').style('stroke', 'var(--accent)').style('stroke-width', 2);
    const lw = tw(lagTxt, 12, 600), mid = Math.max(14 + lw / 2, Math.min(W - 14 - lw / 2, (xa + xb) / 2));
    g.append('text').attr('x', mid).attr('y', yy + 27).attr('text-anchor', 'middle').style('fill', 'var(--accent-2)').style('font', '600 12px var(--sans)').text(lagTxt);
    rows.push([p.text, c.date || c.start, l ? l.start : '—', l ? `${l.kind.replace('_', ' ')}${l.soft_law ? ' (soft law)' : ''}` : '—', l ? years.toFixed(1) : 'open', `${c.id}${l ? ' → ' + l.id : ''}`]);
    y0 += rowH; return g;
  });
  addGuide(svg, x, top, yAx);
  rove(svg.selectAll('.mark'));
  gs.forEach(g => g.on('mouseenter', null));
  if (EXPORTING) return;
  const L = document.getElementById('legendL'); L.innerHTML = '';
  const li = (inner, text) => L.insertAdjacentHTML('beforeend', `<li><svg width="20" height="16" viewBox="-10 -8 20 16" aria-hidden="true">${inner}</svg>${text}</li>`);
  li(`<path d="${HEX}" style="fill:var(--cat-da)"/>`, 'Kinetic capability milestone');
  li(`<path d="${HEX}" style="fill:var(--cat-ew)"/>`, 'Non-kinetic milestone');
  li('<circle r="5.5" style="fill:var(--accent)"/>', 'Response: treaty (binding)');
  li('<rect x="-5" y="-5" width="10" height="10" style="fill:var(--accent)"/>', 'Response: resolution or body finding (non-binding)');
  li('<path d="M0,-6.5L6.5,5L-6.5,5Z" style="fill:var(--accent)"/>', 'Response: unilateral pledge');
  li('<circle r="5" style="fill:none;stroke:var(--accent);stroke-width:2"/>', 'No binding rule yet');
  table('tableL', ['Pair', 'Capability date', 'Response date', 'Response kind', 'Lag (years)', 'Ledger rows'], rows);
}

// ---------------------------------------------------------------- methodology section
function drawMethod() {
  // one entry per distinct source URL: a full citation (legal rows carry their own; event sources are expanded below) plus the pin(s)
  const bare = t => esc(t).replace(/,\s*https?:\/\/\S+$/, '');
  const groups = new Map(); EVENTS.concat(LEGAL).forEach(r => { if (!groups.has(r.source_url)) groups.set(r.source_url, []); groups.get(r.source_url).push(r); });
  const cites = [...groups.values()].map(rs => { const r = rs[0], url = esc(r.source_url);
    if (!r.source_full && r.citation) return `<li><a href="${url}" target="_blank" rel="noopener">${esc(r.citation)}</a></li>`;
    const head = bare(r.source_full || r.source);
    const pins = rs.length > 1 ? `; ${rs.length} ledger rows, each pinned to its table or page (see the card, the data table or <code>ledger.md</code>)` : `, ${esc(r.pin)}`;
    return `<li><a href="${url}" target="_blank" rel="noopener">${head}</a>${pins}.</li>`; });
  document.getElementById('methodBody').innerHTML = `
  <h3>Editions and “as of” dates</h3>
  <ul><li><b>Primary:</b> Secure World Foundation, <i>Global Counterspace Capabilities: An Open Source Assessment</i> (Victoria Samson &amp; Kathleen Brett eds., 9th ed., Apr. 2026). 13 countries, five categories. The 13-country count is a 2026 figure, not a historical constant. Debris counts as of Feb. 2026 (SWF Table 5-1).</li>
  <li><b>Secondary:</b> CSIS Aerospace Security Project, <i>Space Threat Assessment 2025</i>. The 2026 edition was not published when this page was built (Sept. 2026).</li>
  <li><b>Baseline check:</b> no destructive DA-ASAT test appears after ${fmt(parse(LAST_DA))} in SWF 2026 (Table 5-1 ends with Cosmos 1408).</li></ul>
  <h3>Coding rules</h3>
  <ul><li><b>Chart A:</b> altitude is the intercept altitude from SWF Table 5-1 for destructive tests, and the apogee from Tables 1-4, 2-4 and 3-3 for other tests. Tests without a reported altitude sit in a separate strip and are not placed on the scale. Soviet co-orbital (IS) tests are excluded from the scatter and counted only in Chart B. Starfish Prime is the only nuclear test shown.</li>
  <li><b>Debris:</b> bubble area is proportional to <i>cataloged</i> fragments. Fragments still in orbit are a different quantity, so they appear only in cards and tables.</li>
  <li><b>Chart C:</b> an event is recorded only when a named source documents it. Attribution is coded exactly as the source states it and is never upgraded. Sustained campaigns are spans, not incident counts. Ground-based GNSS jamming affects receivers within range of the jammer, not the satellites. It is tagged <code>GNSS_MEO</code> because the targeted signals come from MEO, and the scene and cards say this expressly.</li>
  <li><b>Chart B:</b> the 2020s follow SWF 2026 chapter sections. Earlier decades are the builder’s reconstruction from SWF test tables, country chapters and fact sheets, labeled “reconstructed.” A state counts as “demonstrated” once it has tested or used the capability, and it stays counted in later decades; “developing” covers programs and latent capability. In category mode the stack counts state-capability pairs. In kinetic vs. non-kinetic mode it counts unique states per group.</li>
  <li><b>3D scenes:</b> illustrative only, never orbit-propagated. Radial distance is compressed (altitude<sup>0.45</sup>); Earth is to scale. Particle counts equal cataloged fragments up to a budget of ${PARTICLE_BUDGET.toLocaleString()} on this device. No quantity should be read from a scene.</li></ul>
  <h3>Licensing</h3>
  <p>SWF material is licensed CC BY-NC 4.0. This page uses facts only. Every chart, graphic and sentence here is original; no SWF or CSIS figures, graphics or prose are reproduced. Earth imagery in the 3D scenes is NASA’s Blue Marble (a U.S. government work, public domain), loaded from a pinned copy on jsDelivr only after the page has rendered and never with reduced motion. Vector coastlines (static diagrams and fallback) come from Natural Earth (public domain) via world-atlas.</p>
  <h3>All cited sources (${cites.length})</h3>
  <ol class="cites">${cites.join('')}</ol>
  <p class="note">The full ledger (every row with its pin), the verification log and the builder decisions are in <code>ledger.md</code>, <code>verification_log.md</code> and <code>methodology.md</code>.</p>`;
}

// ---------------------------------------------------------------- SVG export (rendered fresh at a fixed 1200 px desktop layout, light or dark as displayed)
const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-anchor', 'display', 'paint-order'];
const EXPORT_SPEC = {
  A: { id: 'svgA', draw: () => drawA, title: 'Chart A · Kinetic tests: altitude over time', key: 'Filled circle: destructive intercept at its intercept altitude. Triangle: intercept of a missile (suborbital) target. Ring: apogee, flyby or non-intercept test. Star: nuclear detonation. Dashed bubble: area proportional to cataloged fragments (as of Feb. 2026). Altitude axis is logarithmic; tests with no reported altitude sit in the strip below the axis.' },
  B: { id: 'svgB', draw: () => drawB, title: 'Chart B · Capability diffusion', key: 'Solid: capability demonstrated (tested or used). Hatched: developing or latent. Stack height counts state-capability pairs (a state with two capabilities counts twice). Decades before 2020 are reconstructed by the page builder, not assessed by SWF.' },
  C: { id: 'svgC', draw: () => drawC, title: 'Chart C · Non-kinetic operations', get key() { return (stateC.focus ? 'Axis starts in 1995 because the ledger has no earlier non-kinetic entry (earliest: 1997 MIRACL laser test). ' : '') + 'Bars: sustained campaigns. Points: discrete events. Arrowhead: ongoing. Solid: official or multi-government attribution. Outline: researcher / open-source attribution. Dashed outline: alleged. Attribution is recorded as the source states it.'; } },
  L: { id: 'svgL', draw: () => drawL, title: 'The lag between capability and legal response', key: 'Hexagon: capability milestone. Circle: treaty. Square: resolution or body finding (non-binding). Triangle: unilateral pledge. Open ring: no binding rule yet.' },
  legal: { id: 'legalSvg', draw: () => drawLegal, title: 'Law and policy responses, 1957–2026', key: 'Circle: treaty. Square: resolution or body finding. Triangle: unilateral pledge. Diamond: soft law (expert manual, not binding). Cross: veto. Bars: negotiation spans. Marks that would collide are stacked vertically; each stays at its true date on the axis. ' + ABBR_NOTE },
};
function exportSVG(which) {
  drawRest();
  const spec = EXPORT_SPEC[which]; if (!spec) return '';
  const ns = 'http://www.w3.org/2000/svg', savedGuides = guides.length, EW = 1200;
  FORCE_DESKTOP = true; EXPORTING = true;
  const box = document.createElement('div'); box.className = 'xbox'; box.style.cssText = `position:absolute;left:-99999px;top:0;width:${EW}px`; document.body.appendChild(box);
  try {
    spec.draw()(box);
    const src = box.querySelector('svg'), clone = src.cloneNode(true), a = src.querySelectorAll('*'), b = clone.querySelectorAll('*');
    a.forEach((n, i) => { const cs = getComputedStyle(n); b[i].setAttribute('style', STYLE_PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); b[i].removeAttribute('class'); b[i].removeAttribute('tabindex'); b[i].removeAttribute('role'); });
    clone.querySelectorAll('.hit, [class="hit"]').forEach(n => n.remove());
    clone.querySelectorAll('title').forEach(n => { if (n.parentNode === clone) n.remove(); });
    const vb = clone.getAttribute('viewBox').split(' ').map(Number), bodyCS = getComputedStyle(document.body), fg = bodyCS.color, bg = bodyCS.backgroundColor, muted = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || fg;
    const sans = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif';
    const foot = wrap(spec.key, EW - 32, 10.5).concat(wrap(`Source: Secure World Foundation, Global Counterspace Capabilities: An Open Source Assessment (9th ed., Apr. 2026) and the primary sources cited in the ledger. Data as of ${AS_OF}. Companion to Space Security Law: Governance Beyond the Atmosphere.`, EW - 32, 10.5));
    const HDR = 40, FT = foot.length * 14 + 16, HT = HDR + vb[3] + FT;
    const out = document.createElementNS(ns, 'svg');
    out.setAttribute('xmlns', ns); out.setAttribute('width', EW); out.setAttribute('height', HT); out.setAttribute('viewBox', `0 0 ${EW} ${HT}`); out.setAttribute('role', 'img'); out.setAttribute('aria-label', spec.title);
    const mk = (tag, at, txt) => { const e = document.createElementNS(ns, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); if (txt != null) e.textContent = txt; out.appendChild(e); return e; };
    mk('title', {}, spec.title); mk('desc', {}, spec.key);
    mk('rect', { width: EW, height: HT, style: `fill:${bg}` });
    mk('text', { x: 16, y: 26, style: `fill:${fg};font:600 17px ${sans}` }, spec.title);
    clone.setAttribute('x', 0); clone.setAttribute('y', HDR); clone.setAttribute('width', EW); clone.setAttribute('height', vb[3]); clone.removeAttribute('id');
    out.appendChild(clone);
    foot.forEach((s, i) => mk('text', { x: 16, y: HDR + vb[3] + 18 + i * 14, style: `fill:${muted};font:10.5px ${sans}` }, s));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(out);
  } finally { EXPORTING = false; FORCE_DESKTOP = false; box.remove(); guides.length = savedGuides; }
}
function download(name, data, type) { const a = document.createElement('a'); a.href = data.startsWith('data:') ? data : URL.createObjectURL(new Blob([data], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
document.querySelectorAll('[data-export]').forEach(b => b.onclick = () => download(`counterspace-${b.dataset.export}.svg`, exportSVG(b.dataset.export), 'image/svg+xml'));

// ---------------------------------------------------------------- scenes: host, overlay, hero
let THREE = null, host = null, glOK = null;
async function getHost() {
  if (REDUCED) return null;
  if (glOK === false) return null;
  try {
    if (!THREE) THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    if (!host) {
      host = new GLHost(THREE);
      // The scrubber mirrors scene time however it changes: playback ticks, scrubbing or programmatic host.update() calls.
      const upd = host.update.bind(host); host.update = t => { upd(t); syncScrub(t); };
    }
    glOK = true; return host;
  } catch (e) { console.warn('WebGL unavailable, using static diagrams', e); glOK = false; return null; }
}
const ORDER = [...SCENES].sort((a, b) => a.date < b.date ? -1 : 1);
const overlay = document.getElementById('overlay'), view = document.getElementById('sceneView');
let cur = null, returnFocus = null, heroSim = null;
async function openScene(id, originEl) {
  const cfg = SCENES.find(s => s.id === id); if (!cfg) return;
  if (!overlay.classList.contains('open')) { returnFocus = originEl || document.activeElement; }
  cur = cfg;
  overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  document.getElementById('sceneTitle').textContent = cfg.title;
  document.getElementById('sceneDate').textContent = `${ORDER.indexOf(cfg) + 1} / ${ORDER.length}`;
  document.getElementById('sceneCaption').textContent = cfg.caption;
  const ev = byId[cfg.event];
  document.getElementById('sceneSrc').innerHTML = `Source: ${esc(cfg.cite)}${ev ? ` · <a href="${esc(ev.source_url)}" target="_blank" rel="noopener">${esc(ev.source)}</a>` : ''}`;
  document.getElementById('sceneScale').textContent = `Illustrative, not orbit-propagated. Radial distances compressed (altitude^0.45); Earth to scale. Earth imagery: NASA Blue Marble (public domain); a vector map is shown if it cannot load. ${REDUCED ? 'Reduced motion is on, so a static diagram is shown.' : ''}`;
  const rel = document.getElementById('scRelated'); rel.disabled = !cfg.related; rel.textContent = cfg.related ? `⚖ Related law: ${byId[cfg.related]?.label}` : '⚖ No specific legal item';
  const sim = buildSim(cfg); const cams = document.getElementById('scCams'); cams.innerHTML = '';
  const h = await getHost();
  view.querySelector(':scope > svg')?.remove();
  if (h) {
    unloadHero();
    h.mount(view); h.load(sim); h.playing = true; setPlayBtn(true);
    sim.cams.forEach((c, i) => { const b = document.createElement('button'); b.className = 'btn small'; b.type = 'button'; b.textContent = c.name; b.onclick = () => h.setCam(i); cams.appendChild(b); });
    h.play(); syncScrub(h.t);
  } else {
    renderSVG(sim, view);
  }
  staticMode(!h);
  document.getElementById('scClose').focus();
}
function closeScene() {
  if (!cur) return;
  cur = null; overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  if (host) { host.unload(); }
  view.querySelector(':scope > svg')?.remove();
  startHero();
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus(); else { const m = document.querySelector(`[data-id="${returnFocus?.dataset?.id}"]`); m?.focus(); }
}
const scrub = document.getElementById('scScrub'), scTime = document.getElementById('scTime');
function syncScrub(t) {
  if (!cur) return;
  const v = Math.max(0, Math.min(1, t)), dur = cur?.duration || 0;
  scrub.value = Math.round(v * 1000); scrub.setAttribute('aria-valuetext', `${(v * dur).toFixed(1)} of ${dur} seconds`);
  scTime.textContent = `${(v * dur).toFixed(1)} / ${dur} s`;
}
// Static diagrams (reduced motion, no WebGL) have no timeline: hide Play, the scrubber and the camera presets.
function staticMode(on) {
  ['scPlay', 'scScrub', 'scTime', 'scCams'].forEach(id => { document.getElementById(id).hidden = on; });
  document.getElementById('scStatic').hidden = !on;
  if (!on) setPlayBtn(true);
}
scrub.oninput = () => { if (host && cur && !scrub.hidden) { host.playing = false; setPlayBtn(false); host.update(scrub.value / 1000); } };
function setPlayBtn(on) { const b = document.getElementById('scPlay'); b.setAttribute('aria-pressed', on); b.textContent = on ? '❚❚ Pause' : '▶ Play'; b.disabled = false; }
document.getElementById('scPlay').onclick = () => { if (!host || !cur || scrub.hidden) return; host.playing = !host.playing; if (host.playing && host.t >= 1) host.t = 0; setPlayBtn(host.playing); };
document.getElementById('scClose').onclick = closeScene;
document.getElementById('scPrev').onclick = () => { const i = ORDER.indexOf(cur); openScene(ORDER[(i - 1 + ORDER.length) % ORDER.length].id); };
document.getElementById('scNext').onclick = () => { const i = ORDER.indexOf(cur); openScene(ORDER[(i + 1) % ORDER.length].id); };
document.getElementById('scRelated').onclick = () => {
  const id = cur?.related; if (!id) return; closeScene();
  const m = document.querySelector(`#legalSvg [data-id="${id}"]`); if (!m) return;
  document.getElementById('legalBand').scrollIntoView({ block: 'nearest' });
  m.classList.add('hl', 'flash-hl'); m.focus(); setGuide(parse(byId[id].start));
  setTimeout(() => { m.classList.remove('hl', 'flash-hl'); }, 3500);
};
document.getElementById('scExport').onclick = () => {
  if (!cur) return;
  if (host && glOK) download(`scene-${cur.id}.png`, host.stillPNG(cur.title, cur.cite), 'image/png');
  else { const s = view.querySelector('svg'); const xml = new XMLSerializer().serializeToString(s); const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = s.viewBox.baseVal.width * 2; c.height = s.viewBox.baseVal.height * 2; const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height); download(`scene-${cur.id}.png`, c.toDataURL('image/png')); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); }
};
document.getElementById('tourBtn').onclick = e => openScene(ORDER[0].id, e.currentTarget);
overlay.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeScene(); }
  if (e.key === 'Tab') { const f = [...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')]; const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
});
overlay.addEventListener('click', e => { if (e.target === overlay) closeScene(); });

// Hero overview uses the same single renderer; it is unloaded whenever a scene opens.
const heroStage = document.getElementById('heroStage');
async function startHero() {
  heroSim = buildSim(HERO);
  const h = await getHost();
  if (cur) return;
  if (h) { heroStage.querySelector('svg')?.remove(); h.mount(heroStage); h.load(heroSim); h.setCam(0); h.playing = true; h.play(); }
  else renderSVG(heroSim, heroStage, 0.2);
}
function unloadHero() { if (host && host.el === heroStage) host.unload(); }

// ---------------------------------------------------------------- theme toggle (in memory only)
document.getElementById('themeBtn').onclick = () => {
  const root = document.documentElement; const now = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.dataset.theme = now === 'light' ? 'dark' : 'light'; // every chart colour is a CSS variable, so no redraw is needed
};

// ---------------------------------------------------------------- boot
// Above-the-fold pieces draw first; the rest is drawn on the next task (or on demand by audit/export).
let pendingDraw = null;
function drawRest() { if (!pendingDraw) return; clearTimeout(pendingDraw); pendingDraw = null; drawC(); drawB(); drawL(); legalScroll(); }
function drawAll(lazy = false) {
  guides.length = 0; drawLegal(); drawLegal(document.getElementById('legalZoom'), true); drawA();
  clearTimeout(pendingDraw); pendingDraw = setTimeout(drawRest, lazy ? 30 : 0); if (!lazy) drawRest();
}
if (innerWidth < 640) document.querySelector('#chartB details.table')?.setAttribute('open', '');
chipsB(); drawLegalKey(); drawAll(true); drawMethod(); startHero();
// Earth imagery (~1.5 MB) is not part of the page: it is prefetched once the page has
// loaded and the browser is idle, and skipped entirely without WebGL or with reduced motion.
function prefetchEarth() { getHost().then(h => { if (h) loadEarth(h.maxTex).then(ok => { if (ok) host?.refreshEarth(); }); }); }
addEventListener('load', () => (window.requestIdleCallback || (f => setTimeout(f, 1200)))(prefetchEarth, { timeout: 4000 }));
let rz = 0, lastW = innerWidth; addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(drawAll, 150); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });

// Test / export hooks (no storage).
window.__cs = { earthReady, EARTH_URL, exportSVG, audit, openScene, closeScene, memory: () => host?.memory(), contexts: () => document.querySelectorAll('canvas').length, scenes: ORDER.map(s => s.id), host: () => host };
