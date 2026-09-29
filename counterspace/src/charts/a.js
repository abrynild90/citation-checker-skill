// ============================================================================
// charts/a.js: Chart A, kinetic tests by altitude (log axis) with debris bubbles.
// Provides: drawA(), table().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import {
  DOMAIN,
  EXPORTING,
  KIN,
  LAST_DA,
  Placer,
  TYPE_LABEL,
  badge,
  byId,
  colorOf,
  fmtD,
  fmtMY,
  hasScene,
  isPhoneNow,
  layout,
  num,
  parse,
  star,
  tw,
  xAxis,
} from '../app.js';
import { activate, addGuide, bindMark, handoff, kinCard, legend, rove, srcCell, table } from '../ui.js';
const stateA = { zoom: true }, // phones open on the flagged 2004-2026 zoom (the toggle returns the full span); other widths ignore it
  ZOOM_A0 = '2004-01-01';
export function drawA(el = document.getElementById('svgA')) {
  el.innerHTML = '';
  const phone = isPhoneNow(),
    zoomed = phone && stateA.zoom,
    KV = zoomed ? KIN.filter((e) => e.date >= ZOOM_A0) : KIN; // phone zoom: 2004 onward, where the marks crowd
  const { W, M, x } = layout(el, zoomed ? [parse(ZOOM_A0), DOMAIN[1]] : DOMAIN);
  // zoomed: the "ZOOMED" note gets its own row above the plot, so it can never cross the plot's rules or marks
  const top = zoomed ? 34 : 18,
    plotH = phone ? 300 : 380;
  // Tests with no reported altitude sit in a strip below the axis at their true dates; marks that would overlap are dodged into extra rows (x never moves).
  const unk = KV.filter((e) => e.altitude_km == null).sort((a, b) => (a.date < b.date ? -1 : 1)),
    rowEnd = [],
    STEP = phone ? 11 : 12,
    ROWH = phone ? 12 : 13;
  unk.forEach((e) => {
    const X = x(parse(e.date));
    let r = rowEnd.findIndex((v) => v <= X - STEP);
    if (r < 0) {
      r = rowEnd.length;
      rowEnd.push(0);
    }
    rowEnd[r] = X;
    e._row = r;
  });
  const stripH = 12 + Math.max(1, rowEnd.length) * ROWH + 4,
    capH = 16,
    H = top + plotH + capH + stripH + 30;
  const y = d3
    .scaleLog()
    .domain([8, 48000])
    .range([top + plotH, top]);
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hA')
    .attr('id', 'svgA-root');
  svg
    .append('desc')
    .text(
      'Scatter of kinetic counterspace tests: year on the x axis, altitude on a log scale on the y axis, with LEO, MEO and GEO bands. ' +
        'Destructive tests have debris bubbles sized by cataloged fragments. A table view follows the chart.',
    );
  // debris scale
  const rD = d3
    .scaleSqrt()
    .domain([0, 3600])
    .range([0, phone ? 22 : 30]);
  // bands
  const bandLabels = [],
    HX = x(parse(LAST_DA));
  // The hand-off label runs vertically just right of the dotted line, so it can never meet the marks or callouts (the DN-2 mark sits under a horizontal label).
  const HT = [
      `Last destructive DA-ASAT test (${fmtMY(parse(LAST_DA))})`,
      `Last destructive test (${fmtMY(parse(LAST_DA))})`,
      'Last destructive test',
    ],
    nearX = KV.filter((e) => e.altitude_km != null && Math.abs(x(parse(e.date)) - HX) < 34).map(
      (e) => y(e.altitude_km) - (e.fragments_cataloged ? (phone ? 22 : 30) : 14),
    );
  const roomV = Math.min(top + plotH, ...nearX) - top - 14,
    handoffText = HT.find((s) => tw(s, 11, 600) <= roomV) || HT.at(-1);
  // Band labels are obstacles too: each slides right until clear of every mark, its 3D badge and every debris bubble.
  const obst = KV.filter((e) => e.altitude_km != null).map((e) => {
    const X = x(parse(e.date)),
      Y = y(e.altitude_km),
      r = e.fragments_cataloged ? rD(e.fragments_cataloged) : 0,
      R = Math.max(r, 9);
    return [X - R, Y - R, X + R + (hasScene(e) ? 8 : 0), Y + R];
  });
  const band = (a, b, fill, label, above) => {
    const ly = above ? y(b) - 4 : y(b) + (b === 35000 ? 24 : 13),
      lw = tw(label, 10.5, 600) + label.length * 0.85;
    let bx = M.l + 6;
    const hit = () => obst.some(([x0, y0, x1, y1]) => x0 < bx + lw + 2 && x1 > bx - 4 && y0 < ly + 5 && y1 > ly - 13);
    while (bx < W * 0.5 && hit()) bx += 4; // slide right until clear of the marks
    if (bx >= W * 0.5) bx = M.l + 6; // nowhere clear: stay at the edge
    bandLabels.push({ x: bx, y: ly, w: lw });
    svg
      .append('rect')
      .attr('x', M.l)
      .attr('width', W - M.l - M.r)
      .attr('y', y(b))
      .attr('height', y(a) - y(b))
      .style('fill', fill);
    svg.append('text').attr('class', 'band-label').attr('x', bx).attr('y', ly).text(label);
  };
  band(8, 100, 'var(--recon)', phone ? '<100 km' : 'BELOW 100 KM (ATMOSPHERE)');
  band(100, 2000, 'var(--leo)', phone ? 'LEO' : 'LEO (to ~2,000 km)');
  band(2000, 35000, 'var(--meo)', phone ? 'MEO' : 'MEO (GNSS ~20,200 km)');
  band(35000, 37000, 'var(--geo)', 'GEO 35,786 km', true);
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues([10, 100, 300, 1000, 3000, 10000, 30000])
        .tickSize(-(W - M.l - M.r))
        .tickFormat(''),
    );
  svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues([10, 100, 300, 1000, 3000, 10000, 30000])
        .tickSize(phone ? 4 : 6) // phone: shorter ticks leave a clear gap between the "300" label and the rotated axis title
        .tickPadding(phone ? 2 : 3)
        .tickFormat((d) => (d >= 1000 ? d / 1000 + 'k' : d)),
    );
  svg
    .append('text')
    .attr('class', 'ann-sub')
    .attr('transform', `translate(${phone ? 9.5 : 12},${top + plotH / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .style('font-size', phone ? '10px' : null)
    .text('Altitude, km (log)');
  // strip for unreported altitudes
  const sy = top + plotH + capH,
    stripY = (e) => sy + 10 + (e._row || 0) * ROWH;
  svg
    .append('rect')
    .attr('x', M.l)
    .attr('width', W - M.l - M.r)
    .attr('y', sy)
    .attr('height', stripH)
    .style('fill', 'var(--surface-2)');
  svg
    .append('text')
    .attr('class', 'band-label')
    .attr('x', M.l + 6)
    .attr('y', sy - 5)
    .text(phone ? 'ALTITUDE NOT REPORTED' : 'ALTITUDE NOT REPORTED (no point on the scale)');
  xAxis(svg, x, sy + stripH, zoomed ? 5 : undefined);
  // handoff marker
  handoff(svg, x, top, sy + stripH, null)
    .append('text')
    .attr('transform', `translate(${HX + 13},${top + 4}) rotate(90)`)
    .attr('text-anchor', 'start')
    .text(handoffText);
  // bubbles first (behind)
  const dest = KV.filter((e) => e.type === 'destructive');
  svg
    .append('g')
    .selectAll('circle')
    .data(dest)
    .join('circle')
    .attr('cx', (d) => x(parse(d.date)))
    .attr('cy', (d) => y(d.altitude_km))
    .attr('r', (d) => rD(d.fragments_cataloged))
    .style('fill', (d) => colorOf(d.state))
    .style('fill-opacity', 0.16)
    .style('stroke', (d) => colorOf(d.state))
    .style('stroke-opacity', 0.7)
    .style('stroke-dasharray', '2 2')
    .attr('aria-hidden', 'true');
  // marks
  const g = svg
    .append('g')
    .selectAll('g')
    .data(KV)
    .join('g')
    .attr('class', 'mark')
    .attr('role', 'button')
    .attr('data-id', (d) => d.id)
    .attr('transform', (d) => `translate(${x(parse(d.date))},${d.altitude_km == null ? stripY(d) : y(d.altitude_km)})`)
    .attr(
      'aria-label',
      (d) =>
        `${fmtD(d)}. ${d.state}, ${d.system} against ${d.target}. ${TYPE_LABEL[d.type]}. Altitude ` +
        `${d.altitude_km == null ? 'not reported' : d.altitude_km + ' km'}` +
        `.${d.fragments_cataloged ? ' ' + d.fragments_cataloged + ' fragments cataloged.' : ''}${hasScene(d) ? ' Opens 3D scene.' : ''}`,
    );
  g.each(function (d) {
    const s = d3.select(this),
      c = colorOf(d.state),
      r = phone ? 4 : 5;
    if (d.type === 'nuclear') s.append('path').attr('d', star(9)).style('fill', c).style('stroke', 'var(--bg)');
    else if (d.type === 'destructive')
      s.append('circle')
        .attr('r', r + 1)
        .style('fill', c)
        .style('stroke', 'var(--bg)');
    else if (d.type === 'midcourse_intercept')
      s.append('path')
        .attr('d', `M0,${-r - 1}L${r + 1},${r}L${-r - 1},${r}Z`)
        .style('fill', c);
    else s.append('circle').attr('r', r).style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2);
    if (hasScene(d)) badge(s, 10, -10);
    s.append('circle').attr('class', 'hit').attr('r', 12);
  });
  bindMark(g, kinCard, activate);
  g.attr('data-t', (d) => +parse(d.date));
  rove(g);
  // annotations: each tries several offsets and takes the first that clears band labels, the handoff label, all marks and earlier notes
  const pl = new Placer({ x0: 2, x1: W - 2, y0: 0, y1: H });
  pl.add([0, 0, M.l + 1, top + plotH + 6]); // the y-axis ticks: no annotation may sit on them
  bandLabels.forEach((b) => pl.add(pl.textRect(b.x, b.y, 'start', b.w, 10.5)));
  pl.add([HX + 2, top + 4, HX + 16, top + 8 + tw(handoffText, 11, 600)]);
  KV.forEach((d) => {
    const X = x(parse(d.date)),
      Y = d.altitude_km == null ? stripY(d) : y(d.altitude_km);
    pl.add([X - 11, Y - 19, X + 17, Y + 11], 'M');
  });
  const ann = (id, t1, t2, prefs) => {
    const e = byId[id],
      X = x(parse(e.date)),
      Y = y(e.altitude_km),
      w = Math.max(tw(t1, 12, 600), t2 ? tw(t2, 11.5) : 0);
    for (const [dx, dy, anchor] of prefs) {
      const tx = X + dx,
        ty = Y + dy,
        x0 = anchor === 'end' ? tx - w : tx,
        q = [x0, ty - 12, x0 + w, ty + (t2 ? 18 : 5)];
      if (!pl.free(q, [], 3)) continue;
      pl.add(q);
      svg
        .append('line')
        .attr('x1', X)
        .attr('y1', Y)
        .attr('x2', X + dx * 0.85)
        .attr('y2', Y + dy * 0.85 - (dy > 0 ? 0 : -4))
        .style('stroke', 'var(--muted)');
      const t = svg.append('text').attr('x', tx).attr('y', ty).attr('text-anchor', anchor);
      t.append('tspan').attr('class', 'ann').text(t1);
      if (t2) t.append('tspan').attr('class', 'ann-sub').attr('x', tx).attr('dy', 14).text(t2);
      return;
    }
    console.warn('annotation unplaced', id);
  };
  const sweep = () => {
    const o = [];
    for (let dy = -30; dy >= -200; dy -= 14) o.push([-34, dy, 'end'], [34, dy, 'start']);
    for (let dy = 30; dy <= 200; dy += 14) o.push([-34, dy, 'end'], [34, dy, 'start']);
    return o;
  };
  const around = (a, b) => [
    [-a, b, 'end'],
    [a, b, 'start'],
    [-a, -b, 'end'],
    [a, -b, 'start'],
    [-a - 30, b + 20, 'end'],
    [a + 30, b + 20, 'start'],
    [-a - 30, -b - 20, 'end'],
    [a + 30, -b - 20, 'start'],
  ];
  if (!phone) {
    ann('cn-2013-dn2', 'Demonstrated reach toward GEO: DN-2 (2013)', '~30,000 km apogee. Not an intercept (hollow mark).', [
      ...around(40, 28),
      ...sweep(),
    ]);
    ann('cn-2007-fy1c', 'Peak intercept is still Fengyun-1C (2007): 880 km', 'Intercept altitudes have not climbed since.', [
      [-34, -42, 'end'],
      [-34, -60, 'end'],
      ...around(34, 42),
      ...sweep(),
    ]);
    ann('us-1962-starfish-prime', 'Starfish Prime (nuclear, 1962)', null, [
      [18, -40, 'start'],
      [18, -60, 'start'],
      ...around(18, 30),
      ...sweep(),
    ]);
  } else {
    ann('cn-2013-dn2', 'DN-2', null, [...around(20, 24), ...sweep()]);
    ann('cn-2007-fy1c', 'Peak intercept: FY-1C', null, [[-20, -34, 'end'], [20, -34, 'start'], ...around(20, 30), ...sweep()]);
  }
  // The empty stretches of the scatter are data, not a bug: say so in-chart. The note is computed from the ledger (no hard-coded years):
  // gaps = runs of 5+ calendar years between consecutive kinetic rows of any state, plus the longest span with no destructive test.
  if (!zoomed) {
    const yr = (e) => +e.date.slice(0, 4),
      ys = KIN.slice().sort((a, b) => (a.date < b.date ? -1 : 1)),
      gaps = [];
    ys.forEach((e, i) => {
      const nx = ys[i + 1];
      if (nx && yr(nx) - yr(e) >= 6) gaps.push({ a: yr(e) + 1, b: yr(nx) - 1, x0: x(parse(e.date)) + 8, x1: x(parse(nx.date)) - 8 });
    });
    const ds = ys.filter((e) => e.type === 'destructive');
    let dg = null;
    ds.forEach((e, i) => {
      const nx = ds[i + 1];
      if (nx && (!dg || yr(nx) - yr(e) > yr(dg[1]) - yr(dg[0]))) dg = [e, nx];
    });
    const rng = (g) => (g.a === g.b ? `${g.a}` : `${g.a}–${String(g.b).slice(((g.a / 100) | 0) === ((g.b / 100) | 0) ? 2 : 0)}`);
    const nm = (e) => e.target.split(/ \(|,| P\d/)[0];
    const l1 = gaps.length ? (phone ? 'No tests ' : 'No test of any state in the ledger, ') + gaps.map(rng).join(' or ') : '',
      l2 = !phone && dg ? `No destructive test between ${nm(dg[0])} (${yr(dg[0])}) and ${nm(dg[1])} (${yr(dg[1])})` : '';
    if (gaps.length) {
      const gx0 = Math.min(...gaps.map((g) => g.x0)),
        gx1 = Math.max(...gaps.map((g) => g.x1)),
        gm = (gx0 + gx1) / 2,
        w = Math.max(tw(l1, 11.5), l2 ? tw(l2, 11.5) : 0),
        gy = y(5200);
      let placed = null;
      for (const withL2 of l2 ? [true, false] : [false]) {
        const cand = [];
        for (let dy = -126; dy <= 126; dy += 14)
          for (let dx = -240; dx <= 240; dx += 30) cand.push([dx, dy, Math.abs(dx) / 30 + (Math.abs(dy) / 14) * 1.2]);
        for (const [dx, dy] of cand.sort((p, q) => p[2] - q[2])) {
          const ty = gy + 4 + dy,
            cxx = gm + dx,
            q = [cxx - w / 2, ty - 12, cxx + w / 2, ty + (withL2 ? 18 : 4)];
          if (q[0] >= M.l + 2 && q[2] <= W - M.r - 18 && q[1] >= top + 30 && q[3] <= top + plotH - 4 && pl.free(q, [], 3)) {
            placed = { ty, q, withL2, cxx };
            break;
          }
        }
        if (placed) break;
      }
      if (placed) {
        pl.add(placed.q);
        gaps.forEach((g) => {
          if (g.x1 - g.x0 > 6 && Math.abs(placed.cxx - gm) < 1)
            svg
              .append('path')
              .attr('d', `M${g.x0},${placed.ty - 15}V${placed.ty - 20}H${g.x1}V${placed.ty - 15}`)
              .style('fill', 'none')
              .style('stroke', 'var(--faint)')
              .attr('aria-hidden', 'true');
        });
        const tt = svg.append('text').attr('class', 'ann-sub').attr('text-anchor', 'middle').attr('x', placed.cxx).attr('y', placed.ty);
        tt.append('tspan').attr('x', placed.cxx).text(l1);
        if (placed.withL2) tt.append('tspan').attr('x', placed.cxx).attr('dy', 14).text(l2);
      }
    }
  }
  addGuide(svg, x, top, sy + stripH, 'A');
  if (zoomed)
    svg
      .append('text')
      .attr('class', 'zoom-flag')
      .attr('x', W - M.r)
      .attr('y', top - 12)
      .attr('text-anchor', 'end')
      .text(`ZOOMED 2004–26 · ${KIN.length - KV.length} earlier tests hidden`);
  if (!EXPORTING) {
    const b = document.getElementById('aZoom');
    b.setAttribute('aria-pressed', !!zoomed);
    b.textContent = zoomed ? 'Show full span 1957–2026' : 'Zoom to 2004–2026';
  }
  // legend
  if (EXPORTING) return;
  const L = legend('legendA', 22, 18),
    li = L.item;
  li('<circle r="5" style="fill:var(--text)"/>', 'Intercept altitude (destructive)');
  li('<path d="M0,-6L6,5L-6,5Z" style="fill:var(--text)"/>', 'Intercept of a missile (suborbital) target');
  li('<circle r="5" style="fill:none;stroke:var(--text);stroke-width:2"/>', 'Apogee, flyby or non-intercept test');
  li(`<path d="${star(8)}" style="fill:var(--text)"/>`, 'Nuclear detonation');
  li(
    '<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>',
    'Has a 3D scene',
  );
  ['United States', 'Russia', 'China', 'India'].forEach((s) =>
    li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s === 'Russia' ? 'USSR / Russia' : s),
  );
  const sizes = [100, 1000, 3500],
    mx = rD(3500),
    bw = mx * 2 + 46;
  const bubble = (sz) => {
    const r = rD(sz),
      cy = mx * 2 + 3 - r;
    return (
      `<circle cx="${mx + 2}" cy="${cy}" r="${r}" style="fill:none;stroke:var(--muted);stroke-dasharray:2 2"/>` +
      `<text x="${mx * 2 + 8}" y="${cy - r + 9}" style="fill:var(--muted);font:10px var(--sans)">${d3.format(',')(sz)}</text>`
    );
  };
  L.raw(
    `<li class="wide"><svg width="${bw}" height="${mx * 2 + 6}" viewBox="0 0 ${bw} ${mx * 2 + 6}" aria-hidden="true">${sizes.map(bubble).join('')}</svg>` +
      '<span>Debris bubble area = cataloged fragments (as of Feb. 2026). Still-in-orbit counts appear in cards and the table, never on this scale.</span></li>',
  );
  L.done();
  // table
  table(
    'tableA',
    ['Date', 'State', 'System', 'Target', 'Type', 'Altitude (km)', 'Kind', 'Cataloged', 'In orbit', 'Conf.', 'Source'],
    KIN.map((e) => [
      e.date_precision === 'month' ? e.date.slice(0, 7) : e.date,
      e.state,
      e.system,
      e.target,
      TYPE_LABEL[e.type],
      e.altitude_km ?? '—',
      e.altitude_kind,
      num(e.fragments_cataloged),
      num(e.fragments_in_orbit),
      e.confidence,
      srcCell(e),
    ]),
  );
}
document.getElementById('aZoom').onclick = () => {
  stateA.zoom = !stateA.zoom;
  drawA();
};
