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

// ---------------------------------------------------------------- palette & helpers
const STATE_VAR = { 'United States': '--c-us', 'Russia': '--c-ru', 'China': '--c-cn', 'India': '--c-in', 'Iran': '--c-ir', 'North Korea': '--c-kp', 'Israel': '--c-il', 'Iraq': '--c-iq' };
const actorKey = a => Object.keys(STATE_VAR).find(k => a.startsWith(k) || (k === 'Iran' && a.startsWith('Iran'))) || (a.startsWith('Israel') ? 'Israel' : null);
const colorOf = name => `var(${STATE_VAR[actorKey(name)] || '--c-multi'})`;
const TYPE_LABEL = { destructive: 'Destructive intercept', non_destructive: 'Non-destructive test', flyby: 'Flyby (no intercept)', midcourse_intercept: 'Intercept of suborbital (missile) target', nuclear: 'Nuclear detonation', apogee_only: 'Apogee only (no target)' };
const ATTR_LABEL = { official_government: 'Official (single government)', multi_government: 'Multiple governments / intergovernmental body', researcher_osint: 'Researcher / open-source analysis', alleged: 'Alleged (unconfirmed)' };
const REGIME_LABEL = { GNSS_MEO: 'GNSS receivers (MEO signals)', GEO_comms: 'GEO communications', LEO_constellation: 'LEO constellation', ground_segment: 'Ground segment', ISR_LEO: 'LEO imaging / ISR' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => n == null ? '—' : d3.format(',')(n);
const isPhone = () => innerWidth < 640;
const hasScene = r => r.scene_3d && SCENES.some(s => s.id === r.scene_3d);

function layout(el) {
  const W = Math.max(300, el.clientWidth);
  const M = { l: isPhone() ? 40 : 64, r: isPhone() ? 12 : 22 };
  const x = d3.scaleUtc().domain(DOMAIN).range([M.l, W - M.r]);
  return { W, M, x };
}
function xAxis(g, x, y, ticks = true) {
  const ax = d3.axisBottom(x).ticks(d3.utcYear.every(isPhone() ? 20 : 10)).tickFormat(fmtY).tickSizeOuter(0);
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${y})`).call(ax);
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
  const r = el ? el.getBoundingClientRect() : { left: evt.clientX, right: evt.clientX, top: evt.clientY, bottom: evt.clientY };
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let left = r.right + 12, top = r.top - 8;
  if (left + cw > innerWidth - 8) left = Math.max(8, r.left - cw - 12);
  if (top + ch > innerHeight - 8) top = Math.max(8, innerHeight - ch - 8);
  card.style.left = left + 'px'; card.style.top = top + 'px';
}
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
  sel.attr('tabindex', 0)
    .on('mouseenter', function (ev, d) { showCard(cardFn(d), ev, this); })
    .on('mouseleave', hideCard)
    .on('focus', function (ev, d) { showCard(cardFn(d), ev, this); })
    .on('blur', hideCard)
    .on('click', function (ev, d) { onActivate(d, this, ev); })
    .on('keydown', function (ev, d) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onActivate(d, this, ev); } if (ev.key === 'Escape') hideCard(); });
}
const activate = (d, el, ev) => { if (hasScene(d)) { hideCard(); openScene(d.scene_3d, el); } else showCard(d.domain ? (d.domain === 'kinetic' ? kinCard(d) : nkCard(d)) : legalCard(d), ev, el); };

// ---------------------------------------------------------------- shared guide line
const guides = [];
function setGuide(date) { guides.forEach(g => g(date)); }
function addGuide(svg, x, y0, y1) {
  const line = svg.append('line').attr('class', 'guide').attr('y1', y0).attr('y2', y1).style('display', 'none');
  guides.push(date => date ? line.attr('x1', x(date)).attr('x2', x(date)).style('display', null) : line.style('display', 'none'));
}
function handoff(svg, x, y0, y1, label, anchorTop) {
  const X = x(parse(LAST_DA));
  const g = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  g.append('line').attr('x1', X).attr('x2', X).attr('y1', y0).attr('y2', y1);
  if (label) g.append('text').attr('x', X - 5).attr('y', anchorTop ? y0 + 30 : y1 - 6).attr('text-anchor', 'end').text(label);
}

// ---------------------------------------------------------------- legal band
const ABBR = { 'ltbt-1963': 'LTBT', 'ost-1967': 'OST', 'abm-1972': 'ABM XII', 'paros-1981': 'PAROS', 'cd-paros-committee': 'CD PAROS cttee', 'itu-1992': 'ITU Arts 45/48', 'ppwt-2008': 'PPWT', 'ppwt-2014': 'PPWT II', 'tallinn-2017': 'Tallinn 2.0*', 'unga-75-36': '75/36', 'oewg-2022': 'OEWG', 'us-moratorium-2022': 'US moratorium', 'milamos-2022': 'MILAMOS*', 'unga-77-41': '77/41', 'unsc-veto-2024': 'UNSC veto (nukes)', 'woomera-2024': 'Woomera*', 'itu-rrb-2024': 'RRB ’24', 'icao-2025': 'ICAO ’25', 'itu-rrb-2025': 'RRB ’25' };
function legalGlyph(sel, l) {
  if (l.soft_law) sel.append('path').attr('d', 'M0,-6L6,0L0,6L-6,0Z').style('fill', 'var(--bg)').style('stroke', 'var(--accent-2)').style('stroke-width', 1.6);
  else if (l.kind === 'treaty') sel.append('circle').attr('r', 5.5).style('fill', 'var(--accent)');
  else if (l.kind === 'resolution') sel.append('rect').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10).style('fill', 'var(--accent)');
  else if (l.kind === 'unilateral') sel.append('path').attr('d', 'M0,-6L6,5L-6,5Z').style('fill', 'var(--accent)');
  else if (l.kind === 'veto') sel.append('path').attr('d', 'M-5,-5L5,5M5,-5L-5,5').style('stroke', 'var(--warn)').style('stroke-width', 2.6);
  else sel.append('circle').attr('r', 4).style('fill', 'var(--accent)');
}
function drawLegal() {
  const el = document.getElementById('legalSvg'); el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  const H = phone ? 40 : 82, yMark = phone ? 16 : 52, spanY = phone ? 30 : 68;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'group').attr('aria-label', 'Legal and policy timeline');
  svg.append('title').text('Law and policy responses, 1957–2026');
  svg.append('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', yMark).attr('y2', yMark).style('stroke', 'var(--line)');
  // spans
  const spans = LEGAL.filter(l => l.kind === 'negotiation_span' && (l.end || l.id === 'paros-1981'));
  const sg = svg.append('g').selectAll('g').data(spans).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id)
    .attr('aria-label', d => `${d.label}, ${fmtY(parse(d.start))} to ${d.end ? fmtY(parse(d.end)) : 'present'}. ${d.short_note}`);
  sg.append('rect').attr('x', d => x(parse(d.start))).attr('width', d => Math.max(3, x(d.end ? parse(d.end) : DOMAIN[1]) - x(parse(d.start)))).attr('y', (d, i) => spanY - 3 + (i % 2) * 5 - 2).attr('height', 4).attr('rx', 2)
    .style('fill', 'var(--accent)').style('opacity', 0.45);
  sg.append('rect').attr('class', 'hit').attr('x', d => x(parse(d.start))).attr('width', d => Math.max(8, x(d.end ? parse(d.end) : DOMAIN[1]) - x(parse(d.start)))).attr('y', spanY - 8).attr('height', 14);
  bindMark(sg, legalCard, activate);
  // points
  const pts = LEGAL.filter(l => !spans.includes(l));
  const pg = svg.append('g').selectAll('g').data(pts).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id)
    .attr('transform', d => `translate(${x(parse(d.start))},${yMark})`)
    .attr('aria-label', d => `${d.label}, ${fmt(parse(d.start))}.${d.soft_law ? ' Soft law.' : ''} ${d.short_note}${hasScene(d) ? ' Has 3D scene.' : ''}`);
  pg.each(function (d) { legalGlyph(d3.select(this), d); if (hasScene(d)) badge(d3.select(this), 8, -9); });
  pg.append('circle').attr('class', 'hit').attr('r', 9);
  bindMark(pg, legalCard, activate);
  pg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  sg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  // labels: greedy placement in 3 rows above marks (desktop only)
  if (!phone) {
    const rows = [[], [], []], rowY = [14, 26, 38];
    pts.sort((a, b) => a.start < b.start ? -1 : 1).forEach(d => {
      const t = ABBR[d.id] || d.label, w = t.length * 6.1 + 6, cx = x(parse(d.start));
      for (let r = 0; r < 3; r++) {
        const x0 = cx - w / 2; if (rows[r].every(([a, b]) => x0 > b || x0 + w < a)) {
          rows[r].push([x0, x0 + w]);
          svg.append('line').attr('x1', cx).attr('x2', cx).attr('y1', rowY[r] + 3).attr('y2', yMark - 7).style('stroke', 'var(--line)');
          svg.append('text').attr('x', Math.max(M.l - 10, Math.min(W - w / 2, cx))).attr('y', rowY[r]).attr('text-anchor', 'middle').style('fill', d.soft_law ? 'var(--accent-2)' : 'var(--muted)').style('font', '600 10.5px var(--sans)').text(t);
          break;
        }
      }
    });
    svg.append('text').attr('x', W - M.r).attr('y', H - 1).attr('text-anchor', 'end').style('fill', 'var(--faint)').style('font', '10px var(--sans)').text('* soft law (expert manual) · bars = negotiation spans');
  }
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${yMark})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(10)).tickFormat('').tickSize(3));
  addGuide(svg, x, 0, H);
}

// ---------------------------------------------------------------- Chart A
function drawA() {
  const el = document.getElementById('svgA'); el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  const top = 18, plotH = phone ? 300 : 380, stripH = 30, H = top + plotH + stripH + 30;
  const y = d3.scaleLog().domain([90, 48000]).range([top + plotH, top]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hA').attr('id', 'svgA-root');
  svg.append('desc').text('Scatter of kinetic counterspace tests: year on the x axis, altitude on a log scale on the y axis, with LEO, MEO and GEO bands. Destructive tests have debris bubbles sized by cataloged fragments. A table view follows the chart.');
  // bands
  const band = (a, b, fill, label) => { svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', y(b)).attr('height', y(a) - y(b)).style('fill', fill);
    svg.append('text').attr('class', 'band-label').attr('x', W - M.r - 6).attr('y', y(b) + 13).attr('text-anchor', 'end').text(label); };
  band(90, 2000, 'var(--leo)', 'LEO');
  band(2000, 35000, 'var(--meo)', 'MEO');
  band(35000, 37000, 'var(--geo)', 'GEO 35,786 km');
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).tickValues([100, 300, 1000, 3000, 10000, 30000]).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).tickValues([100, 300, 1000, 3000, 10000, 30000]).tickFormat(d => d >= 1000 ? d / 1000 + 'k' : d));
  svg.append('text').attr('class', 'ann-sub').attr('transform', `translate(12,${top + plotH / 2}) rotate(-90)`).attr('text-anchor', 'middle').text('Altitude, km (log)');
  // strip for unreported altitudes
  const sy = top + plotH + 6;
  svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', sy).attr('height', stripH - 6).style('fill', 'var(--surface-2)');
  svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', sy + 15).text(phone ? 'ALT. N/R' : 'ALTITUDE NOT REPORTED');
  xAxis(svg, x, top + plotH + stripH);
  // debris scale
  const rD = d3.scaleSqrt().domain([0, 3600]).range([0, phone ? 22 : 30]);
  // handoff marker
  handoff(svg, x, top, top + plotH + stripH, phone ? 'Last destructive test' : `Last destructive DA-ASAT test (as of ${AS_OF})`, true);
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
  bindMark(g, kinCard, activate);
  // annotations
  const ann = (id, dx, dy, t1, t2, anchor = 'start') => { const e = byId[id]; const X = x(parse(e.date)), Y = y(e.altitude_km);
    svg.append('line').attr('x1', X).attr('y1', Y).attr('x2', X + dx * 0.85).attr('y2', Y + dy * 0.85).style('stroke', 'var(--muted)');
    const t = svg.append('text').attr('x', X + dx).attr('y', Y + dy).attr('text-anchor', anchor);
    t.append('tspan').attr('class', 'ann').text(t1); if (t2) t.append('tspan').attr('class', 'ann-sub').attr('x', X + dx).attr('dy', 14).text(t2); };
  if (!phone) {
    ann('cn-2013-dn2', -40, 28, 'Demonstrated reach toward GEO: DN-2 (2013)', '~30,000 km apogee. Not an intercept (hollow mark).', 'end');
    ann('cn-2007-fy1c', -34, -42, 'Peak intercept is still Fengyun-1C (2007): 880 km', 'Intercept altitudes have not climbed since.', 'end');
    ann('us-1962-starfish-prime', 18, -26, 'Starfish Prime (nuclear, 1962)');
  } else {
    ann('cn-2013-dn2', -20, 24, 'DN-2 reach (apogee)', null, 'end');
    ann('cn-2007-fy1c', -20, -30, 'Peak intercept: FY-1C', null, 'end');
  }
  addGuide(svg, x, top, top + plotH + stripH);
  // legend
  const L = document.getElementById('legendA'); L.innerHTML = '';
  const li = (svgInner, text, w = 22, h = 18) => { L.insertAdjacentHTML('beforeend', `<li><svg width="${w}" height="${h}" viewBox="${-w / 2} ${-h / 2} ${w} ${h}" aria-hidden="true">${svgInner}</svg>${text}</li>`); };
  li('<circle r="5" style="fill:var(--text)"/>', 'Intercept altitude (destructive)');
  li('<path d="M0,-6L6,5L-6,5Z" style="fill:var(--text)"/>', 'Intercept of a missile (suborbital) target');
  li('<circle r="5" style="fill:none;stroke:var(--text);stroke-width:2"/>', 'Apogee, flyby or non-intercept test');
  li(`<path d="${star(8)}" style="fill:var(--text)"/>`, 'Nuclear detonation');
  li('<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>', 'Has a 3D scene');
  ['United States', 'Russia', 'China', 'India'].forEach(s => li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s === 'Russia' ? 'USSR / Russia' : s));
  const sizes = [100, 1000, 3500], mx = rD(3500);
  L.insertAdjacentHTML('beforeend', `<li><svg width="${mx * 2 + 70}" height="${mx * 2 + 4}" aria-hidden="true">${sizes.map((s, i) => `<circle cx="${mx}" cy="${mx * 2 + 2 - rD(s)}" r="${rD(s)}" style="fill:none;stroke:var(--muted);stroke-dasharray:2 2"/><text x="${mx * 2 + 6}" y="${mx * 2 + 4 - rD(s) * 2 + 8}" style="fill:var(--muted);font:10px var(--sans)">${d3.format(',')(s)}</text>`).join('')}</svg>Debris bubble area = cataloged fragments (as of Feb. 2026). Still-in-orbit counts appear in cards and the table, never on this scale.</li>`);
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
function drawC() {
  const el = document.getElementById('svgC'); el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  const rowH = phone ? 24 : 26, laneHead = 18, lanePad = 10, top = 8;
  let yCur = top; const placed = [];
  LANES.forEach(l => {
    const evs = NK.filter(e => l.cats.includes(e.category)).sort((a, b) => a.start < b.start ? -1 : 1);
    const rows = [];
    evs.forEach(e => {
      const x0 = x(parse(e.start)) - 12, x1 = (e.end === e.start ? x(parse(e.start)) + 8 : x(e.end ? parse(e.end) : DOMAIN[1])) + (phone ? 40 : 190);
      let r = rows.findIndex(end => x0 > end); if (r < 0) { r = rows.length; rows.push(0); } rows[r] = x1;
      placed.push({ e, lane: l.key, y: yCur + laneHead + r * rowH + rowH / 2 });
    });
    l.y0 = yCur; l.y1 = yCur + laneHead + Math.max(1, rows.length) * rowH + lanePad; yCur = l.y1;
  });
  const H = yCur + 28;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hC').attr('id', 'svgC-root');
  svg.append('desc').text('Swimlane chart of non-kinetic counterspace operations by category. Bars are sustained campaigns; points are discrete events; arrowheads mark ongoing campaigns. Solid fill means official or multi-government attribution, outline means researcher or open-source attribution, dashed outline means alleged.');
  LANES.forEach((l, i) => {
    svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', l.y0).attr('height', l.y1 - l.y0).style('fill', i % 2 ? 'transparent' : 'var(--recon)');
    svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', l.y0 + 13).text(l.label.toUpperCase());
  });
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(0,${yCur})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(10)).tickSize(-(yCur - top)).tickFormat(''));
  xAxis(svg, x, yCur);
  handoff(svg, x, top, yCur, phone ? '↑ last destructive test' : '↑ last destructive DA-ASAT test (Nov 2021)', false);
  // required annotation in the empty early decades
  if (!phone) {
    const ax = x(parse('1959-01-01')), t = svg.append('text').attr('x', ax).attr('y', LANES[0].y0 + 34);
    ['Non-kinetic effects are reversible, deniable, and used', 'repeatedly in real conflicts. The rules that govern them', 'are soft law (expert manuals) or carry military', 'exemptions (ITU Constitution Art. 48). See legal band.'].forEach((s, i) => t.append('tspan').attr('x', ax).attr('dy', i ? 15 : 0).attr('class', i ? 'ann-sub' : 'ann-sub').style('font-weight', i === 0 ? 600 : null).style('fill', 'var(--text)').text(s));
  }
  const g = svg.append('g').selectAll('g').data(placed).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.e.id)
    .attr('aria-label', d => { const e = d.e; return `${e.actor}: ${e.target_system}. ${e.end === e.start ? fmt(parse(e.start)) : `${fmtY(parse(e.start))} to ${e.end ? fmtY(parse(e.end)) : 'ongoing'}`}. Attribution: ${ATTR_LABEL[e.attribution]}.${hasScene(e) ? ' Opens 3D scene.' : ''}`; });
  g.each(function (d) {
    const e = d.e, s = d3.select(this), X0 = x(parse(e.start));
    const point = e.end === e.start;
    if (point) { attrStyle(s.append('circle').attr('cx', X0).attr('cy', d.y).attr('r', 6), e); }
    else {
      const X1 = e.end ? x(parse(e.end)) : x(DOMAIN[1]) - 8;
      attrStyle(s.append('rect').attr('x', X0).attr('y', d.y - 5).attr('width', Math.max(4, X1 - X0)).attr('height', 10).attr('rx', 2), e);
      if (!e.end) s.append('path').attr('d', `M${X1},${d.y - 7}L${X1 + 8},${d.y}L${X1},${d.y + 7}Z`).style('fill', colorOf(e.actor));
    }
    regimeIcon(s, e.target_regime).attr('transform', `translate(${X0 - 11},${d.y})`);
    if (hasScene(e)) badge(s, X0 + (point ? 10 : 8), d.y - 11);
    const short = actorKey(e.actor) ? (actorKey(e.actor) === 'United States' ? 'US' : actorKey(e.actor)) : e.actor.split(' ')[0];
    s.append('text').attr('x', X0 + (point ? 18 : 14)).attr('y', d.y - 7).style('fill', 'var(--muted)').style('font', '10.5px var(--sans)').text(phone ? short : `${short}: ${e.target_system.split(' (')[0].slice(0, 30)}`);
    s.append('rect').attr('class', 'hit').attr('x', X0 - 16).attr('y', d.y - 12).attr('width', point ? 32 : Math.max(32, (e.end ? x(parse(e.end)) : x(DOMAIN[1])) - X0 + 24)).attr('height', 24);
  });
  bindMark(g, d => nkCard(d.e), (d, el, ev) => activate(d.e, el, ev));
  addGuide(svg, x, top, yCur);
  const L = document.getElementById('legendC'); L.innerHTML = '';
  const li = (inner, text, w = 26) => L.insertAdjacentHTML('beforeend', `<li><svg width="${w}" height="16" viewBox="${-w / 2} -8 ${w} 16" aria-hidden="true">${inner}</svg>${text}</li>`);
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:var(--text)"/>', 'Official or multi-government attribution');
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:none;stroke:var(--text);stroke-width:2"/>', 'Researcher / OSINT attribution');
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:none;stroke:var(--text);stroke-width:2;stroke-dasharray:4 2.5"/>', 'Alleged');
  li('<path d="M-8,-6L2,0L-8,6Z" style="fill:var(--text)"/>', 'Ongoing');
  li('<path d="M0,-4.5L4.5,3.5L-4.5,3.5Z" style="fill:var(--muted)"/>', 'GNSS (MEO signals)', 14);
  li('<circle r="4" style="fill:none;stroke:var(--muted);stroke-width:1.5"/><circle r="1.3" style="fill:var(--muted)"/>', 'GEO comms', 14);
  li('<circle cx="-3.5" r="1.5" style="fill:var(--muted)"/><circle r="1.5" style="fill:var(--muted)"/><circle cx="3.5" r="1.5" style="fill:var(--muted)"/>', 'LEO constellation', 14);
  li('<rect x="-4" y="0" width="8" height="4" style="fill:var(--muted)"/><path d="M0,0V-5M-3,-3L0,-5L3,-3" style="fill:none;stroke:var(--muted)"/>', 'Ground segment', 14);
  li('<path d="M0,-4.5L4.5,0L0,4.5L-4.5,0Z" style="fill:var(--muted)"/>', 'LEO imaging / ISR', 14);
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
function drawB() {
  const el = document.getElementById('svgB'); el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  const top = 16, plotH = phone ? 230 : 290, H = top + plotH + 30;
  const decs = CAPS.decades, starts = decs.map(d => +d.slice(0, 4));
  const xs = starts.map(s => parse(`${Math.max(1957, s)}-01-01`)).concat([DOMAIN[1]]);
  const { series } = countsB();
  const stackData = xs.map((xd, i) => { const o = { x: xd }; series.forEach(s => o[s.key] = s.vals[Math.min(i, decs.length - 1)]); return o; });
  const stack = d3.stack().keys(series.map(s => s.key)).offset(d3.stackOffsetNone)(stackData);
  const maxY = Math.max(4, d3.max(stack.at(-1) || [[0, 0]], d => d[1]) || 0);
  const y = d3.scaleLinear().domain([0, Math.ceil(maxY / 4) * 4 + 2]).range([top + plotH, top]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'img').attr('aria-labelledby', 'hB').attr('id', 'svgB-root');
  svg.append('desc').text('Stacked step area of the number of states holding each counterspace capability per decade, zero baseline. See the data table for exact counts.');
  const defs = svg.append('defs');
  series.forEach(s => { const p = defs.append('pattern').attr('id', 'hatch-' + s.key.replace(':', '-')).attr('width', 6).attr('height', 6).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)');
    p.append('rect').attr('width', 6).attr('height', 6).style('fill', `var(${s.v})`).style('fill-opacity', 0.14); p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).style('stroke', `var(${s.v})`).style('stroke-width', 2.2); });
  const X2020 = x(parse('2020-01-01'));
  svg.append('rect').attr('x', M.l).attr('width', X2020 - M.l).attr('y', top).attr('height', plotH).style('fill', 'var(--recon)');
  svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', top + 12).text(phone ? 'RECONSTRUCTED' : 'RECONSTRUCTED (NOT SWF-ASSESSED)');
  svg.append('text').attr('class', 'band-label').attr('x', X2020 + 4).attr('y', top + 12).text(phone ? 'SWF' : 'SWF 2026 (13 STATES)');
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')));
  svg.append('text').attr('class', 'ann-sub').attr('transform', `translate(12,${top + plotH / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(stateB.group === 'cat' ? 'State-capability pairs' : 'States');
  const area = d3.area().x(d => x(d.data.x)).y0(d => y(d[0])).y1(d => y(d[1])).curve(d3.curveStepAfter);
  svg.append('g').selectAll('path').data(stack).join('path').attr('d', area)
    .style('fill', (d, i) => series[i].dev ? `url(#hatch-${series[i].key.replace(':', '-')})` : `var(${series[i].v})`).style('fill-opacity', (d, i) => series[i].dev ? 1 : 0.85)
    .style('stroke', 'var(--bg)').style('stroke-width', 0.8).append('title').text((d, i) => series[i].label);
  xAxis(svg, x, top + plotH);
  addGuide(svg, x, top, top + plotH);
  // annotation (computed from data)
  const ew20 = Object.keys(CAPS.coding.electronic_warfare['2020s']).length;
  const da20 = Object.entries(CAPS.coding.direct_ascent['2020s']).filter(([, v]) => v === 'D').map(([k]) => k);
  if (!phone) {
    const t = svg.append('text').attr('x', x(parse('1960-01-01'))).attr('y', top + 44);
    t.append('tspan').attr('class', 'ann').text(`Electronic warfare drives most of the crowding: ${ew20} states in the 2020s.`);
    t.append('tspan').attr('class', 'ann-sub').attr('x', x(parse('1960-01-01'))).attr('dy', 16).text(`Demonstrated destructive DA-ASAT capability has stayed at four states: ${da20.map(s => s === 'Russia' ? 'USSR/Russia' : s === 'United States' ? 'US' : s).join(', ')}.`);
  } else {
    svg.append('text').attr('class', 'ann-sub').attr('x', M.l + 6).attr('y', top + 28).text(`EW drives crowding (${ew20} states); DA-ASAT: 4.`);
  }
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
document.getElementById('grpCat').onclick = () => { stateB.group = 'cat'; grpBtns(); chipsB(); drawB(); };
document.getElementById('grpKin').onclick = () => { stateB.group = 'kin'; grpBtns(); chipsB(); drawB(); };
function grpBtns() { document.getElementById('grpCat').setAttribute('aria-pressed', stateB.group === 'cat'); document.getElementById('grpKin').setAttribute('aria-pressed', stateB.group === 'kin'); }

// ---------------------------------------------------------------- Lag panel
const LAG = [
  { cap: 'us-1959-bold-orion', law: 'ost-1967', text: 'First DA-ASAT flyby → Outer Space Treaty (silent on conventional ASATs)' },
  { cap: 'us-1962-starfish-prime', law: 'ltbt-1963', text: 'Starfish Prime → Limited Test Ban Treaty (followed it)' },
  { cap: 'cn-2007-fy1c', law: 'unga-77-41', text: 'Fengyun-1C debris → UNGA 77/41 call to stop destructive tests' },
  { cap: 'ru-2021-cosmos1408', law: 'us-moratorium-2022', text: 'Cosmos 1408 → US test moratorium' },
  { cap: 'ru-2014-ukraine', law: 'icao-2025', text: 'Russian GNSS interference (from 2014) → first ICAO finding against Russia' },
  { cap: 'ru-2024-eu-sats', law: 'itu-rrb-2024', text: 'Jamming of European satellites → ITU RRB “grave concern”' },
  { cap: 'us-1997-miracl', law: null, text: 'Laser fired at a satellite → no specific rule on lasers against satellites' },
  { cap: 'ru-2022-viasat', law: null, text: 'Viasat cyberattack → attributions only; Tallinn 2.0 is soft law' },
];
const capDate = r => parse(r.date || r.start);
function drawL() {
  const el = document.getElementById('svgL'); el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhone();
  const rowH = phone ? 44 : 38, top = 10, H = top + LAG.length * rowH + 28;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hL').attr('id', 'svgL-root');
  svg.append('desc').text('Dumbbell chart: for each pair, a filled circle marks the capability milestone and a square marks the legal or policy response; the gap is the lag in years.');
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(0,${H - 28})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(10)).tickSize(-(H - 28 - top)).tickFormat(''));
  xAxis(svg, x, H - 28);
  const rows = [];
  LAG.forEach((p, i) => {
    const c = byId[p.cap], l = p.law ? byId[p.law] : null, yy = top + i * rowH + rowH - 12;
    const a = capDate(c), b = l ? parse(l.start) : DOMAIN[1];
    const years = l ? ((b - a) / (365.25 * 864e5)) : null;
    const col = c.domain === 'kinetic' ? 'var(--cat-da)' : 'var(--cat-ew)';
    const g = svg.append('g').attr('class', 'mark').attr('tabindex', 0).attr('role', 'img').attr('aria-label', `${p.text}. ${l ? years.toFixed(1) + ' years' : 'no binding response yet'}.`);
    g.append('line').attr('x1', x(a)).attr('x2', x(b) - (l ? 0 : 6)).attr('y1', yy).attr('y2', yy).style('stroke', col).style('stroke-width', 2.5).style('stroke-dasharray', l ? null : '3 3');
    g.append('circle').attr('cx', x(a)).attr('cy', yy).attr('r', 5.5).style('fill', col);
    if (l) g.append('rect').attr('x', x(b) - 5).attr('y', yy - 5).attr('width', 10).attr('height', 10).style('fill', 'var(--accent)');
    else g.append('circle').attr('cx', x(b) - 6).attr('cy', yy).attr('r', 5).style('fill', 'var(--bg)').style('stroke', 'var(--accent)').style('stroke-width', 2);
    const lx = x(a) > W * 0.55 ? Math.min(x(a), x(b)) - 8 : Math.min(x(a), x(b));
    g.append('text').attr('x', lx).attr('y', yy - 10).attr('text-anchor', x(a) > W * 0.55 ? 'end' : 'start').style('fill', 'var(--text)').style('font', `${phone ? 11 : 12}px var(--sans)`).text(p.text);
    g.append('text').attr('x', l ? Math.max(x(a), x(b)) + 10 : x(b) - 16).attr('y', yy + 4).attr('text-anchor', l ? 'start' : 'end').style('fill', 'var(--accent-2)').style('font', '600 12px var(--sans)')
      .text(l ? (years < 1 ? `${Math.round(years * 12)} mo` : `${years.toFixed(1)} yr`) : (phone ? '' : 'no binding rule'));
    rows.push([p.text, c.date || c.start, l ? l.start : '—', l ? years.toFixed(1) : 'open', `${c.id}${l ? ' → ' + l.id : ''}`]);
  });
  addGuide(svg, x, top, H - 28);
  table('tableL', ['Pair', 'Capability date', 'Response date', 'Lag (years)', 'Ledger rows'], rows);
}

// ---------------------------------------------------------------- methodology section
function drawMethod() {
  const cites = [...new Map(EVENTS.concat(LEGAL).map(r => [r.source_url, r])).values()];
  document.getElementById('methodBody').innerHTML = `
  <h3>Editions and “as of” dates</h3>
  <ul><li><b>Primary:</b> Secure World Foundation, <i>Global Counterspace Capabilities: An Open Source Assessment</i> (Brian Weeden &amp; Victoria Samson eds., 9th ed., Apr. 2026). 13 countries, five categories. The 13-country count is a 2026 figure, not a historical constant. Debris counts as of Feb. 2026 (SWF Table 5-1).</li>
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
  <ol class="cites">${cites.map(r => `<li><a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source || r.citation)}</a>${r.source ? '' : ''}</li>`).join('')}</ol>
  <p class="note">The full ledger (every row with its pin), the verification log and the builder decisions are in <code>ledger.md</code>, <code>verification_log.md</code> and <code>methodology.md</code>.</p>`;
}

// ---------------------------------------------------------------- SVG export
const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-anchor', 'display', 'paint-order'];
function exportSVG(which) {
  const map = { A: 'svgA', B: 'svgB', C: 'svgC', L: 'svgL', legal: 'legalSvg' };
  const src = document.querySelector(`#${map[which]} svg`); if (!src) return '';
  const clone = src.cloneNode(true); const a = src.querySelectorAll('*'), b = clone.querySelectorAll('*');
  a.forEach((n, i) => { const cs = getComputedStyle(n); b[i].setAttribute('style', STYLE_PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); b[i].removeAttribute('class'); b[i].removeAttribute('tabindex'); });
  clone.querySelectorAll('.hit, [class="hit"]').forEach(n => n.remove());
  const vb = clone.getAttribute('viewBox').split(' ').map(Number);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', vb[2]); clone.setAttribute('height', vb[3] + 22);
  clone.setAttribute('viewBox', `${vb[0]} ${vb[1]} ${vb[2]} ${vb[3] + 22}`);
  const title = { A: 'Chart A · Kinetic tests: altitude over time', B: 'Chart B · Capability diffusion', C: 'Chart C · Non-kinetic operations', L: 'The lag', legal: 'Legal band' }[which];
  const ns = 'http://www.w3.org/2000/svg', t = document.createElementNS(ns, 'text');
  t.setAttribute('x', 4); t.setAttribute('y', vb[3] + 16); t.setAttribute('style', `fill:${getComputedStyle(document.body).color};font:10px sans-serif`);
  t.textContent = `${title}. Data: ledger built from SWF Global Counterspace Capabilities (9th ed., Apr. 2026) and cited sources. Companion to Space Security Law.`;
  clone.appendChild(t);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
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
    if (!host) host = new GLHost(THREE);
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
  document.getElementById('sceneDate').textContent = `Scene ${ORDER.indexOf(cfg) + 1} of ${ORDER.length}`;
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
    h.play(t => { scrub.value = Math.round(t * 1000); });
  } else {
    renderSVG(sim, view); setPlayBtn(false);
    document.getElementById('scPlay').disabled = true;
  }
  scrub.disabled = !h; document.getElementById('scClose').focus();
}
function closeScene() {
  if (!cur) return;
  cur = null; overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  if (host) { host.unload(); }
  view.querySelector(':scope > svg')?.remove();
  startHero();
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus(); else { const m = document.querySelector(`[data-id="${returnFocus?.dataset?.id}"]`); m?.focus(); }
}
const scrub = document.getElementById('scScrub');
scrub.oninput = () => { if (host && cur) { host.playing = false; setPlayBtn(false); host.update(scrub.value / 1000); } };
function setPlayBtn(on) { const b = document.getElementById('scPlay'); b.setAttribute('aria-pressed', on); b.textContent = on ? '❚❚ Pause' : '▶ Play'; b.disabled = false; }
document.getElementById('scPlay').onclick = () => { if (!host || !cur) return; host.playing = !host.playing; if (host.playing && host.t >= 1) host.t = 0; setPlayBtn(host.playing); };
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
  root.dataset.theme = now === 'light' ? 'dark' : 'light'; drawAll();
};

// ---------------------------------------------------------------- boot
function drawAll() { guides.length = 0; drawLegal(); drawA(); drawC(); drawB(); drawL(); }
chipsB(); drawAll(); drawMethod(); startHero();
// Earth imagery (~1.5 MB) is not part of the page: it is prefetched once the page has
// loaded and the browser is idle, and skipped entirely without WebGL or with reduced motion.
function prefetchEarth() { getHost().then(h => { if (h) loadEarth(h.maxTex).then(ok => { if (ok) host?.refreshEarth(); }); }); }
addEventListener('load', () => (window.requestIdleCallback || (f => setTimeout(f, 1200)))(prefetchEarth, { timeout: 4000 }));
let rz = 0, lastW = innerWidth; addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(drawAll, 150); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });

// Test / export hooks (no storage).
window.__cs = { earthReady, EARTH_URL, exportSVG, openScene, closeScene, memory: () => host?.memory(), contexts: () => document.querySelectorAll('canvas').length, scenes: ORDER.map(s => s.id), host: () => host };
