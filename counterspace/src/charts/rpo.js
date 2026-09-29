// ============================================================================
// charts/rpo.js: co-orbital proximity operations (RPO) strip, on the shared year axis (same layout() scale as the law band and Charts A-C).
// One lane per actor; one mark per ledger row (shape = activity, colour = actor, outline style = how firmly SWF states it, cube badge = 3D scene).
// Provides: drawR(), stateR.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { ACTIVITY, CO, DOMAIN, EXPORTING, REGIME_CO, actorKey, badge, colorOf, hasScene, isPhoneNow, layout, parse, xAxis } from '../app.js';
import { activate, addGuide, bindMark, coCard, coWhen, legend, rove, srcCell, table } from '../ui.js';
const R_LANES = [{ key: 'United States', label: 'United States' }, { key: 'China', label: 'China' }, { key: 'Russia', label: 'Russia' }];
export const stateR = { focus: false }; // default: the full shared 1957-2026 axis; 'focus' is the explicit 2000-2026 zoom
const R_FOCUS = () => [parse('2000-01-01'), DOMAIN[1]];
// Marks: circle = RPO, square = docking, triangle = capture and tow, diamond = release, bar = spaceplane mission (span = launch to landing).
function coMark(s, e, X0, X1, y, k) {
  const c = colorOf(e.actor), hi = e.confidence === 'high', lo = e.confidence === 'low';
  const paint = sel => (hi ? sel.style('fill', c).style('stroke', c).style('stroke-width', 1.5)
    : sel.style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2).style('stroke-dasharray', lo ? '3 2.2' : null), sel);
  const span = X1 - X0;
  if (e.activity === 'spaceplane_mission') paint(s.append('rect').attr('x', X0).attr('y', y - 4.5 * k).attr('width', Math.max(8, span)).attr('height', 9 * k).attr('rx', 2.5));
  else {
    if (span > 4) s.append('line').attr('x1', X0).attr('x2', X1).attr('y1', y).attr('y2', y).style('stroke', c).style('stroke-width', 3).style('stroke-opacity', 0.45).style('stroke-linecap', 'round');
    const g = s.append('g').attr('transform', `translate(${X0},${y})`);
    if (e.activity === 'docking') paint(g.append('rect').attr('x', -5 * k).attr('y', -5 * k).attr('width', 10 * k).attr('height', 10 * k).attr('rx', 1.5));
    else if (e.activity === 'capture_tow') paint(g.append('path').attr('d', `M0,${-7 * k}L${6.5 * k},${5 * k}L${-6.5 * k},${5 * k}Z`));
    else if (e.activity === 'release') paint(g.append('path').attr('d', `M0,${-6.5 * k}L${6.5 * k},0L0,${6.5 * k}L${-6.5 * k},0Z`));
    else paint(g.append('circle').attr('r', 5.5 * k));
  }
}
export function drawR(el = document.getElementById('svgR')) {
  el.innerHTML = ''; // a re-draw replaces the chart (never stacks a second one)
  const dom = stateR.focus ? R_FOCUS() : DOMAIN;
  const { W, M, x } = layout(el, dom), phone = isPhoneNow();
  const k = phone ? 0.95 : 1, rowH = phone ? 18 : 17, laneHead = 24, lanePad = 8, top = 4, PR = W - M.r, x0min = M.l;
  const lane = e => R_LANES.findIndex(l => l.key === actorKey(e.actor));
  const lanes = R_LANES.map((l, li) => {
    const rows = [];
    CO.filter(e => lane(e) === li).sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : a.id < b.id ? -1 : 1).forEach(e => {
      const X0 = Math.max(x0min, x(parse(e.start))), X1 = e.end ? Math.max(X0, x(parse(e.end))) : PR - 8, bar = e.activity === 'spaceplane_mission';
      const p = { e, X0: bar ? X0 : X0, X1, ext: [X0 - 9, Math.max(X1 + (e.end ? 0 : 8), X0 + (bar ? 8 : 0)) + (hasScene(e) ? 17 : 8)] };
      let r = rows.findIndex(row => row.every(q => p.ext[0] > q.ext[1] || p.ext[1] < q.ext[0])); if (r < 0) { r = rows.length; rows.push([]); } rows[r].push(p); p.row = r;
    });
    return rows;
  });
  let yCur = top; const placed = [];
  R_LANES.forEach((l, li) => { l.y0 = yCur; const n = Math.max(1, lanes[li].length); l.rowsN = n; l.y1 = yCur + laneHead + n * rowH + lanePad;
    lanes[li].forEach((row, ri) => row.forEach(p => { p.y = l.y0 + laneHead + ri * rowH + rowH / 2; p.lane = li; placed.push(p); })); yCur = l.y1; });
  const H = yCur + 28 + (stateR.focus && !EXPORTING ? 22 : 0);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hR').attr('id', 'svgR-root');
  svg.append('desc').text('Strip chart of co-orbital rendezvous and proximity operations, dockings, a capture and tow, releases and spaceplane missions, one lane per actor. Marks are placed at the start date of each ledger row; a line or bar runs to the end date. Solid marks are stated plainly by the source, outlined marks are hedged in the source, dashed outlines are unclear or conflicted. A data table follows the chart.');
  R_LANES.forEach((l, i) => {
    svg.append('rect').attr('x', M.l).attr('width', W - M.l - M.r).attr('y', l.y0).attr('height', l.y1 - l.y0).style('fill', i % 2 ? 'transparent' : 'var(--recon)');
    svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', l.y0 + 15).text(`${l.label.toUpperCase()} · ${CO.filter(e => lane(e) === i).length} ROWS`);
  });
  const ev = stateR.focus ? (phone ? 10 : 5) : undefined;
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(0,${yCur})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(stateR.focus ? (phone ? 10 : 5) : 10)).tickSize(-(yCur - top)).tickFormat(''));
  xAxis(svg, x, yCur, ev);
  if (stateR.focus && !EXPORTING) svg.append('text').attr('class', 'zoom-flag').attr('x', M.l).attr('y', yCur + 40).text('ZOOMED: axis 2000–2026, not the shared 1957–2026 scale');
  const g = svg.append('g').selectAll('g').data(placed).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.e.id).attr('data-t', d => +parse(d.e.start))
    .attr('aria-label', d => { const e = d.e; return `${e.actor}: ${e.system}${e.target ? ' and ' + e.target : ''}. ${ACTIVITY[e.activity]}. ${coWhen(e)}. Confidence: ${e.confidence}.${hasScene(e) ? ' Opens 3D scene.' : ''}`; });
  g.each(function (d) {
    const e = d.e, s = d3.select(this);
    coMark(s, e, d.X0, d.X1, d.y, k);
    if (!e.end) s.append('path').attr('d', `M${d.X1},${d.y - 6}L${d.X1 + 8},${d.y}L${d.X1},${d.y + 6}Z`).style('fill', colorOf(e.actor));
    if (hasScene(e)) badge(s, d.X0 + (e.activity === 'spaceplane_mission' ? 3 : 12), d.y - 9);
    s.append('rect').attr('class', 'hit').attr('x', d.X0 - 12).attr('y', d.y - rowH / 2).attr('width', Math.max(24, d.X1 - d.X0 + 24)).attr('height', rowH);
  });
  bindMark(g, d => coCard(d.e), (d, elx, evt) => activate(d.e, elx, evt));
  rove(g);
  addGuide(svg, x, top, yCur, 'R');
  if (EXPORTING) return;
  document.getElementById('noteR').innerHTML = stateR.focus
    ? '<span class="zbadge">Zoomed</span> Axis 2000–2026: an enlargement, no longer aligned with the Law band above or Charts A to C. Choose “Full span” to return to the shared scale.'
    : 'Full span 1957–2026, on the same year axis as the Law band and Charts A to C. The earliest entry is 2003 (XSS-10), so the left is empty. Choose “Zoom 2000–2026” to enlarge the recent years.';
  document.getElementById('rFocus').setAttribute('aria-pressed', stateR.focus); document.getElementById('rFull').setAttribute('aria-pressed', !stateR.focus);
  const L = legend('legendR', 26, 16), li = L.item, ink = 'var(--text)';
  li(`<circle r="5.5" style="fill:${ink}"/>`, 'RPO', 16);
  li(`<rect x="-5" y="-5" width="10" height="10" rx="1.5" style="fill:${ink}"/>`, 'Docking', 16);
  li(`<path d="M0,-7L6.5,5L-6.5,5Z" style="fill:${ink}"/>`, 'Capture and tow', 16);
  li(`<path d="M0,-6.5L6.5,0L0,6.5L-6.5,0Z" style="fill:${ink}"/>`, 'Release', 16);
  li(`<rect x="-11" y="-4.5" width="22" height="9" rx="2.5" style="fill:${ink}"/>`, 'Spaceplane mission');
  L.raw('<li class="lsep" aria-hidden="true"></li>');
  li(`<circle r="5" style="fill:${ink};stroke:${ink}"/>`, 'Stated plainly by SWF', 16);
  li(`<circle r="5" style="fill:none;stroke:${ink};stroke-width:2"/>`, 'Hedged by SWF ("possibly", "appeared", "may")', 16);
  li(`<circle r="5" style="fill:none;stroke:${ink};stroke-width:2;stroke-dasharray:3 2.2"/>`, 'Unclear or conflicted', 16);
  li('<path d="M-8,-6L2,0L-8,6Z" style="fill:var(--text)"/>', 'Ongoing');
  li('<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>', 'Has a 3D scene', 16);
  L.raw('<li class="lsep" aria-hidden="true"></li>');
  ['United States', 'China', 'Russia'].forEach(s => li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s, 14));
  L.done();
  table('tableR', ['Start', 'End', 'Actor', 'Activity', 'Chaser / system', 'Target', 'Orbit', 'Conf.', 'Description', 'Source'],
    CO.slice().sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0).map(e => [e.start, e.end || 'ongoing', e.actor, ACTIVITY[e.activity], e.system, e.target || '—', REGIME_CO[e.orbit_regime], e.confidence, e.description, srcCell(e)]));
}
document.getElementById('rFocus').onclick = () => { stateR.focus = true; drawR(); };
document.getElementById('rFull').onclick = () => { stateR.focus = false; drawR(); };
