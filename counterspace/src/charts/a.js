// ============================================================================
// charts/a.js: Chart A, kinetic tests by altitude (log axis) with debris bubbles.
// Provides: drawA(), table().
// ============================================================================
function drawA(el = document.getElementById('svgA')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhoneNow();
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
    s.append('circle').attr('class', 'hit').attr('r', 12);
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
  // The empty stretch of the scatter is data, not a bug: say so in-chart (dates verified against events.json)
  { const gx0 = x(parse('1971-01-01')), gx1 = x(parse('2004-12-31')), gy = y(5200), gm = (gx0 + gx1) / 2;
    const l1 = phone ? 'No tests 1971–83, 1986–2004' : 'No tests in the ledger 1971–83 or 1986–2004', l2 = phone ? '' : 'Only the US ASM-135 program, 1984–85, falls between';
    if (tw(l1, 11.5) < gx1 - gx0 + 40) {
      svg.append('path').attr('d', `M${gx0},${gy - 16}V${gy - 11}H${gx1}V${gy - 16}`).style('fill', 'none').style('stroke', 'var(--faint)').attr('aria-hidden', 'true');
      const t = svg.append('text').attr('class', 'ann-sub').attr('text-anchor', 'middle').attr('x', gm).attr('y', gy + 4);
      t.append('tspan').attr('x', gm).text(l1); if (l2) t.append('tspan').attr('x', gm).attr('dy', 14).text(l2);
    } }
  addGuide(svg, x, top, top + plotH + stripH);
  // legend
  if (EXPORTING) return;
  const L = legend('legendA', 22, 18), li = L.item;
  li('<circle r="5" style="fill:var(--text)"/>', 'Intercept altitude (destructive)');
  li('<path d="M0,-6L6,5L-6,5Z" style="fill:var(--text)"/>', 'Intercept of a missile (suborbital) target');
  li('<circle r="5" style="fill:none;stroke:var(--text);stroke-width:2"/>', 'Apogee, flyby or non-intercept test');
  li(`<path d="${star(8)}" style="fill:var(--text)"/>`, 'Nuclear detonation');
  li('<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>', 'Has a 3D scene');
  ['United States', 'Russia', 'China', 'India'].forEach(s => li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s === 'Russia' ? 'USSR / Russia' : s));
  const sizes = [100, 1000, 3500], mx = rD(3500), bw = mx * 2 + 46;
  L.raw(`<li class="wide"><svg width="${bw}" height="${mx * 2 + 6}" viewBox="0 0 ${bw} ${mx * 2 + 6}" aria-hidden="true">${sizes.map(sz => `<circle cx="${mx + 2}" cy="${mx * 2 + 3 - rD(sz)}" r="${rD(sz)}" style="fill:none;stroke:var(--muted);stroke-dasharray:2 2"/><text x="${mx * 2 + 8}" y="${mx * 2 + 3 - rD(sz) * 2 + 9}" style="fill:var(--muted);font:10px var(--sans)">${d3.format(',')(sz)}</text>`).join('')}</svg><span>Debris bubble area = cataloged fragments (as of Feb. 2026). Still-in-orbit counts appear in cards and the table, never on this scale.</span></li>`);
  L.done();
  // table
  table('tableA', ['Date', 'State', 'System', 'Target', 'Type', 'Altitude (km)', 'Kind', 'Cataloged', 'In orbit', 'Conf.', 'Source'],
    KIN.map(e => [e.date, e.state, e.system, e.target, TYPE_LABEL[e.type], e.altitude_km ?? '—', e.altitude_kind, num(e.fragments_cataloged), num(e.fragments_in_orbit), e.confidence, srcCell(e)]));
}
const srcCell = r => `<a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source)}</a>, ${esc(r.pin)}`;
// Accessible data table. Each cell carries data-label so CSS can stack rows as cards on phones (no horizontal scroll).
const CAPTIONS = { tableA: 'Chart A data: kinetic counterspace tests, one row per event', tableB: 'Chart B data: states holding each capability, by decade', tableC: 'Chart C data: non-kinetic operations, one row per event or campaign', tableL: 'The lag: capability and response dates for each pair', tableLegal: 'Law and policy items with abbreviations' };
function table(id, head, rows, caption = CAPTIONS[id]) {
  setOnce(id, `<table>${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td data-label="${esc(head[i])}">${typeof c === 'string' && c.startsWith('<a') ? c : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
}

