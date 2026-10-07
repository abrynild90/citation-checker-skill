// ============================================================================
// charts/a.js: anti-satellite tests by altitude (log axis) with debris bubbles.
// Provides: drawA(), kinMarkup().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import {
  DOMAIN,
  EXPORTING,
  KIN,
  LAST_DA,
  Placer,
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
import { KIND_PLAIN, quiet, activate, addGuide, bindMark, handoff, kinCard, legend, rove, srcCell, table, targetWords } from '../ui.js';
const stateA = { zoom: false }, // phones open on the full span so the early treaties and tests show; the toggle zooms to 2004-2026; other widths ignore it
  ZOOM_A0 = '2004-01-01';
const ALT_AT = { intercept: 'Intercept', apogee: 'Highest point', detonation: 'Detonation' };
const CONFIDENCE = { high: 'High', medium: 'Medium', low: 'Low' };
// ---------------------------------------------------------------- marks
// One definition per kind of test, used by the chart and by the key. Each mark has a 1.5 px outline in the colour behind the chart, so overlapping
// marks stay apart; hollow marks get the outline as a separate shape underneath.
const GROUND = 'var(--ground)',
  OUTLINE = `stroke:${GROUND};stroke-width:3;paint-order:stroke;stroke-linejoin:round`;
export function kinMarkup(type, c) {
  if (type === 'nuclear') return `<path d="${star(9.5)}" style="fill:${c};${OUTLINE}"/>`;
  if (type === 'destructive') return `<circle r="7" style="fill:${c};${OUTLINE}"/>`;
  if (type === 'midcourse_intercept') return `<path d="M0,-8.6L7.8,5.2L-7.8,5.2Z" style="fill:${c};${OUTLINE}"/>`;
  return (
    `<circle r="5.6" style="fill:${GROUND};stroke:${GROUND};stroke-width:5.6"/>` + // outline under the ring
    `<circle r="5.6" style="fill:${GROUND};stroke:${c};stroke-width:2.2"/>`
  );
}
export function drawA(el = document.getElementById('svgA')) {
  el.innerHTML = '';
  const phone = isPhoneNow(),
    zoomed = phone && stateA.zoom,
    KV = zoomed ? KIN.filter((e) => e.date >= ZOOM_A0) : KIN; // phone zoom: 2004 onward, where the marks crowd
  const L0 = layout(el, zoomed ? [parse(ZOOM_A0), DOMAIN[1]] : DOMAIN),
    W = L0.W,
    // On a phone the altitude numbers need a little more room than the other charts leave (those charts have no vertical axis).
    M = phone ? { l: 50, r: 12 } : L0.M,
    x = phone
      ? d3
          .scaleUtc()
          .domain(L0.x.domain())
          .range([M.l, W - M.r])
      : L0.x;
  // Rows above the plot: the zoom note (phones) and the axis title.
  const top = zoomed ? 50 : 34,
    plotH = phone ? 330 : 410;
  // Tests with no reported altitude sit in a strip below the plot at their true dates; marks that would overlap are dodged into extra rows (x never moves).
  const unk = KV.filter((e) => e.altitude_km == null).sort((a, b) => (a.date < b.date ? -1 : 1)),
    rowEnd = [],
    STEP = 16,
    ROWH = 17;
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
  const stripH = 16 + Math.max(1, rowEnd.length) * ROWH,
    capH = 28,
    H = top + plotH + capH + stripH + 32;
  const y = d3
    .scaleLog()
    .domain([8, 60000])
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
      'Anti-satellite tests placed by year, left to right, and by altitude on a logarithmic scale, bottom to top, with low, medium and geostationary ' +
        'orbit zones. Destructive tests have debris bubbles sized by cataloged fragments. A data table follows the chart.',
    );
  // debris scale: bubble area is proportional to cataloged fragments
  const rD = d3
    .scaleSqrt()
    .domain([0, 3600])
    .range([0, phone ? 22 : 30]);
  // ---- orbit zones, each named inside the zone at the left (the names are placed after the notes, so the notes keep the clearest spots)
  const HX = x(parse(LAST_DA));
  // The label for the last destructive test runs vertically just right of its dotted line (its name, then its date beside it), so it can never meet the
  // marks or notes. The date is dropped if there is not room for it.
  const HN = 'Last destructive test',
    HD = d3.utcFormat('%B %Y')(parse(LAST_DA)),
    nearX = KV.filter((e) => e.altitude_km != null && Math.abs(x(parse(e.date)) - HX) < 34).map(
      (e) => y(e.altitude_km) - (e.fragments_cataloged ? (phone ? 22 : 30) : 14),
    );
  const roomV = Math.min(top + plotH, ...nearX) - top - 14,
    handoffLines = Math.max(tw(HN, 12, 600), tw(HD, 12)) <= roomV ? [HN, HD] : [HN],
    handoffLen = Math.max(...handoffLines.map((t, i) => tw(t, 12, i ? 400 : 600)));
  // Zone labels are obstacles too: each takes the longest of its wordings that finds room clear of every mark, its cube icon and every debris bubble,
  // looking near the top of its zone first and as far left as it can.
  const obst = KV.filter((e) => e.altitude_km != null).map((e) => {
    const X = x(parse(e.date)),
      Y = y(e.altitude_km),
      r = e.fragments_cataloged ? rD(e.fragments_cataloged) : 0,
      R = Math.max(r, 10);
    return [X - R, Y - R, X + R + (hasScene(e) ? 10 : 0), Y + R];
  });
  const zoneJobs = [];
  const zone = (a, b, fill, labels, ly0, depth = 140) => {
    svg
      .append('rect')
      .attr('x', M.l)
      .attr('width', W - M.l - M.r)
      .attr('y', y(b))
      .attr('height', y(a) - y(b))
      .style('fill', fill);
    zoneJobs.push({ a, labels, ly0, depth });
  };
  zone(8, 100, 'var(--recon)', phone ? ['Below 100 km'] : ['Below 100 km: the atmosphere', 'Below 100 km'], y(100) + 18);
  zone(
    100,
    2000,
    'var(--leo)',
    phone ? ['Low Earth orbit'] : ['Low Earth orbit (LEO), up to about 2,000 km', 'Low Earth orbit (LEO)', 'Low Earth orbit'],
    y(2000) + 18,
  );
  zone(
    2000,
    35000,
    'var(--meo)',
    phone
      ? ['Medium Earth orbit']
      : ['Medium Earth orbit (MEO), including navigation satellites at about 20,200 km', 'Medium Earth orbit (MEO)', 'Medium Earth orbit'],
    y(35000) + 26,
  );
  zone(
    35000,
    37000,
    'var(--geo)',
    phone ? ['Geostationary orbit'] : ['Geostationary orbit (GEO), 35,786 km', 'Geostationary orbit (GEO)', 'Geostationary orbit'],
    y(37000) - 6,
    0,
  );
  // ---- altitude axis: plain numbers with the unit, a full-width rule at each tens step and a fainter one between
  const major = [10, 100, 1000, 10000],
    minor = [30, 300, 3000, 30000];
  svg
    .append('g')
    .attr('class', 'gridline minor')
    .attr('transform', `translate(${M.l},0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues(minor)
        .tickSize(-(W - M.l - M.r))
        .tickFormat(''),
    );
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues(major)
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
        .tickValues(major)
        .tickSize(0)
        .tickPadding(4)
        .tickFormat((d) => (phone ? d3.format(',')(d) : `${d3.format(',')(d)} km`)),
    )
    .select('.domain')
    .remove();
  svg
    .append('text')
    .attr('class', 'axis-title')
    .attr('x', 0)
    .attr('y', 14)
    .text(phone ? 'Altitude in km, logarithmic scale' : 'Altitude above Earth, logarithmic scale');
  // ---- strip for unreported altitudes
  const sy = top + plotH + capH,
    stripY = (e) => sy + 16 + (e._row || 0) * ROWH;
  svg
    .append('rect')
    .attr('x', M.l)
    .attr('width', W - M.l - M.r)
    .attr('y', sy)
    .attr('height', stripH)
    .attr('rx', 6)
    .style('fill', 'var(--surface-2)');
  svg
    .append('text')
    .attr('class', 'band-label')
    .attr('x', M.l)
    .attr('y', sy - 9)
    .text(phone ? 'Altitude not reported' : 'Altitude not reported: placed by date only');
  xAxis(svg, x, sy + stripH, zoomed ? 5 : undefined);
  // ---- the last destructive test
  const hg = handoff(svg, x, top, sy + stripH, null);
  handoffLines.forEach((t, i) =>
    hg
      .append('text')
      .attr('transform', `translate(${HX + 13 + i * 16},${top + 4}) rotate(90)`)
      .attr('text-anchor', 'start')
      .style('font-weight', i ? 400 : null)
      .text(t),
  );
  // ---- debris bubbles first (behind the marks)
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
    .style('fill-opacity', 0.15)
    .style('stroke', (d) => colorOf(d.state))
    .style('stroke-opacity', 0.75)
    .style('stroke-dasharray', '2 2')
    .attr('aria-hidden', 'true');
  // ---- marks
  const tgt = (d) => targetWords(d.target);
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
        `${fmtD(d)}. ${d.state}, ${d.system}. Target: ${tgt(d)}. ${KIND_PLAIN[d.type]}. Altitude ` +
        `${d.altitude_km == null ? 'not reported' : d.altitude_km + ' km'}` +
        `.${d.fragments_cataloged ? ' ' + d.fragments_cataloged + ' fragments cataloged.' : ''}${hasScene(d) ? ' Select to open a 3D explainer.' : ''}`,
    );
  g.append('circle').attr('class', 'hit').attr('r', 12);
  g.each(function (d) {
    const s = d3.select(this);
    s.append('g')
      .attr('class', 'glyph')
      .html(kinMarkup(d.type, colorOf(d.state)));
    if (hasScene(d)) badge(s, 11, -11);
  });
  bindMark(g, kinCard, activate);
  g.attr('data-t', (d) => +parse(d.date));
  rove(g);
  // ---- annotations: each tries several offsets and takes the first that clears zone labels, the label of the last destructive test, all marks and earlier notes
  const pl = new Placer({ x0: 2, x1: W - 2, y0: top, y1: top + plotH });
  pl.add([0, 0, M.l + 1, top + plotH + 6]); // the altitude numbers: no note may sit on them
  pl.add([HX + 2, top + 4, HX + 17 + (handoffLines.length - 1) * 16, top + 8 + handoffLen]);
  KV.forEach((d) => {
    const X = x(parse(d.date)),
      Y = d.altitude_km == null ? stripY(d) : y(d.altitude_km);
    pl.add([X - 12, Y - 21, X + 21, Y + 12], 'M');
  });
  // A leader line may cross marks (it starts at one) but never text, a zone label or the axis numbers.
  const segClear = (x1, y1, x2, y2) => {
    const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 4);
    for (let i = 1; i < n; i++) {
      const px = x1 + ((x2 - x1) * i) / n,
        py = y1 + ((y2 - y1) * i) / n;
      if (pl.r.some((o) => o[4] !== 'M' && px > o[0] - 2 && px < o[2] + 2 && py > o[1] - 2 && py < o[3] + 2)) return false;
    }
    return true;
  };
  const ann = (id, t1, t2, prefs, relaxed = false) => {
    const e = byId[id],
      X = x(parse(e.date)),
      Y = y(e.altitude_km),
      w = Math.max(tw(t1, 13, 600), t2 ? tw(t2, 12.5) : 0);
    for (const [dx, dy, anchor] of prefs) {
      let tx = X + dx,
        x0 = anchor === 'end' ? tx - w : tx;
      const ty = Y + dy,
        IN = 12; // a note stays 12 px inside the plot edges, never on the band's border or across it
      if (!relaxed && (x0 < M.l + IN || x0 + w > W - M.r - IN)) continue;
      if (relaxed) {
        const sh = Math.max(0, M.l + IN - x0) - Math.max(0, x0 + w - (W - M.r - IN));
        tx += sh;
        x0 += sh;
      }
      const q = [x0, ty - 13, x0 + w, ty + (t2 ? 19 : 5)];
      if (!relaxed && !pl.free(q, [], 3)) continue;
      // The leader starts at the edge of the mark (with a small dot there) and ends beside the first line of the note.
      const ex = tx + (anchor === 'end' ? 5 : -5),
        ey = ty - 4,
        len = Math.hypot(ex - X, ey - Y) || 1,
        sx = X + ((ex - X) / len) * 10,
        sy2 = Y + ((ey - Y) / len) * 10;
      if (!relaxed && !segClear(sx, sy2, ex, ey)) continue;
      pl.add(q);
      for (let i = 0; i <= Math.ceil(len / 8); i++) {
        const px = sx + ((ex - sx) * i) / Math.ceil(len / 8),
          py = sy2 + ((ey - sy2) * i) / Math.ceil(len / 8);
        pl.add([px - 2, py - 2, px + 2, py + 2], 'L');
      }
      svg.append('line').attr('class', 'ann-leader').attr('x1', sx).attr('y1', sy2).attr('x2', ex).attr('y2', ey);
      svg.append('circle').attr('class', 'ann-dot').attr('cx', sx).attr('cy', sy2).attr('r', 2.5);
      const t = svg.append('text').attr('x', tx).attr('y', ty).attr('text-anchor', anchor);
      t.append('tspan').attr('class', 'ann').text(t1);
      if (t2) t.append('tspan').attr('class', 'ann-sub').attr('x', tx).attr('dy', 16).text(t2);
      return;
    }
    // crowded view (a phone showing the full span): the note may touch a neighbour rather than be dropped
    if (!relaxed) return ann(id, t1, t2, prefs.slice(0, 1), true);
    console.warn('annotation unplaced', id);
  };
  const sweep = () => {
    const o = [];
    for (let dy = -30; dy >= -200; dy -= 14) o.push([-36, dy, 'end'], [36, dy, 'start'], [-80, dy, 'end'], [80, dy, 'start']);
    for (let dy = 30; dy <= 200; dy += 14) o.push([-36, dy, 'end'], [36, dy, 'start'], [-80, dy, 'end'], [80, dy, 'start']);
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
    ann(
      'cn-2013-dn2',
      'China’s DN-2 rocket, 2013: toward geostationary orbit',
      'About 30,000 km at its highest point. It did not hit a target (hollow circle).',
      [...around(40, 28), ...sweep()],
    );
    ann('cn-2007-fy1c', 'Highest intercept: China’s Fengyun-1C satellite, 2007, at 880 km', 'No intercept has reached that height since.', [
      [-36, -44, 'end'],
      [-36, -62, 'end'],
      ...around(36, 44),
      ...sweep(),
    ]);
    ann('us-1962-starfish-prime', 'Starfish Prime, 1962: a nuclear explosion at 400 km', null, [
      [20, -42, 'start'],
      [20, -62, 'start'],
      ...around(20, 32),
      ...sweep(),
    ]);
  } else {
    ann('cn-2013-dn2', '30,000 km', 'in 2013', [...around(20, 24), ...sweep()]);
    ann('cn-2007-fy1c', 'Highest intercept: 880 km', null, [[-20, -34, 'end'], [20, -34, 'start'], ...around(20, 30), ...sweep()]);
  }
  // The empty stretches of the plot are data, not a mistake: say so in the chart. The note is worked out from the records (no years are typed in):
  // gaps are runs of 5 or more calendar years between consecutive tests of any country, plus the longest span with no destructive test.
  if (!zoomed) {
    const yr = (e) => +e.date.slice(0, 4),
      ys = KIN.slice().sort((a, b) => (a.date < b.date ? -1 : 1)),
      gaps = [];
    ys.forEach((e, i) => {
      const nx = ys[i + 1];
      if (nx && yr(nx) - yr(e) >= 6) gaps.push({ a: yr(e) + 1, b: yr(nx) - 1, x0: x(parse(e.date)) + 9, x1: x(parse(nx.date)) - 9 });
    });
    const ds = ys.filter((e) => e.type === 'destructive');
    let dg = null;
    ds.forEach((e, i) => {
      const nx = ds[i + 1];
      if (nx && (!dg || yr(nx) - yr(e) > yr(dg[1]) - yr(dg[0]))) dg = [e, nx];
    });
    const rng = (g) => (g.a === g.b ? `${g.a}` : `${g.a}–${String(g.b).slice(((g.a / 100) | 0) === ((g.b / 100) | 0) ? 2 : 0)}`);
    const nm = (e) => e.target.split(/ \(|,| P\d/)[0];
    const l1 = gaps.length ? (phone ? 'No tests, ' : 'No test by any country in our records, ') + gaps.map(rng).join(' or ') : '',
      l2 = !phone && dg ? `No destructive test between ${nm(dg[0])} (${yr(dg[0])}) and ${nm(dg[1])} (${yr(dg[1])})` : '';
    if (gaps.length) {
      const gx0 = Math.min(...gaps.map((q) => q.x0)),
        gx1 = Math.max(...gaps.map((q) => q.x1)),
        gm = (gx0 + gx1) / 2,
        w = Math.max(tw(l1, 12.5), l2 ? tw(l2, 12.5) : 0),
        gy = y(32); // the empty lower part of the plot: a calm place for the note, away from the marks
      let placed = null;
      for (const withL2 of l2 ? [true, false] : [false]) {
        const cand = [];
        for (let dy = -(gy + 4 - top - 30); dy <= top + plotH - 4 - gy - 4; dy += 7)
          for (let dx = -480; dx <= 480; dx += 30) cand.push([dx, dy, Math.abs(dx) / 30 + (Math.abs(dy) / 14) * 1.2]);
        for (const [dx, dy] of cand.sort((p, q) => p[2] - q[2])) {
          const ty = gy + 4 + dy,
            cxx = gm + dx,
            q = [cxx - w / 2, ty - 31, cxx + w / 2, ty + (withL2 ? 19 : 4)];
          if (q[0] >= M.l + 2 && q[2] <= W - M.r - 18 && q[1] >= top + 24 && q[3] <= top + plotH - 4 && pl.free(q, [], 3)) {
            placed = { ty, q, withL2, cxx };
            break;
          }
        }
        if (placed) break;
      }
      if (placed) {
        pl.add(placed.q);
        gaps.forEach((q) => {
          if (q.x1 - q.x0 > 6 && Math.abs(placed.cxx - gm) < 1)
            svg
              .append('path')
              .attr('d', `M${q.x0},${placed.ty - 22}V${placed.ty - 28}H${q.x1}V${placed.ty - 22}`)
              .style('fill', 'none')
              .style('stroke', 'var(--faint)')
              .attr('aria-hidden', 'true');
        });
        const tt = svg.append('text').attr('class', 'empty-note').attr('text-anchor', 'middle').attr('x', placed.cxx).attr('y', placed.ty);
        tt.append('tspan').attr('x', placed.cxx).text(l1);
        if (placed.withL2) tt.append('tspan').attr('x', placed.cxx).attr('dy', 16).text(l2);
      }
    }
  }
  zoneJobs.forEach(({ a, labels, ly0, depth }) => {
    const left = M.l + 8,
      yMax = Math.min(y(a) - 8, ly0 + depth);
    let best = null;
    labels.forEach((label, vi) => {
      const lw = tw(label, 12, 600);
      for (let ly = ly0; ly <= Math.max(ly0, yMax); ly += 14)
        for (let bx = left; bx + lw <= W - M.r - 8 && bx < W * 0.7; bx += 4) {
          const q = pl.textRect(bx, ly, 'start', lw, 12);
          if (!pl.free(q, [], 3) || obst.some(([x0, y0, x1, y1]) => x0 < q[2] + 3 && x1 > q[0] - 3 && y0 < q[3] + 2 && y1 > q[1] - 2)) continue;
          const cost = bx - left + (ly - ly0) * 0.8 + vi * 120;
          if (!best || cost < best.cost) best = { bx, ly, label, lw, cost };
        }
    });
    best ??= { bx: left, ly: ly0, label: labels.at(-1), lw: tw(labels.at(-1), 12, 600) };
    pl.add(pl.textRect(best.bx, best.ly, 'start', best.lw, 12));
    svg.append('text').attr('class', 'band-label').attr('x', best.bx).attr('y', best.ly).text(best.label);
  });
  addGuide(svg, x, top, sy + stripH, 'A');
  if (zoomed)
    svg
      .append('text')
      .attr('class', 'zoom-flag')
      .attr('x', 0)
      .attr('y', 36)
      .text(`Zoomed to 2004–2026: ${KIN.length - KV.length} earlier tests hidden`);
  if (!EXPORTING) {
    const b = document.getElementById('aZoom');
    b.setAttribute('aria-pressed', !!zoomed);
    b.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-zoom"/></svg>${zoomed ? 'Show full span 1957–2026' : 'Zoom to 2004–2026'}`;
  }
  // ---- key
  if (EXPORTING) return;
  const K = legend('legendA', 24, 20),
    li = K.item,
    ink = 'var(--text)';
  K.group('What happened');
  li(kinMarkup('destructive', ink), 'Destroyed a satellite (a destructive intercept)');
  li(kinMarkup('midcourse_intercept', ink), 'Intercepted a ballistic missile in flight');
  li(kinMarkup('apogee_only', ink), 'Test that destroyed nothing (rocket-only flight, flyby or other)');
  li(kinMarkup('nuclear', ink), 'Nuclear explosion in space');
  K.group('Country');
  ['United States', 'Russia', 'China', 'India'].forEach((s) =>
    li(`<rect x="-6" y="-6" width="12" height="12" rx="2.5" style="fill:${colorOf(s)}"/>`, s === 'Russia' ? 'USSR and Russia' : s, 16),
  );
  K.group('Debris');
  const sizes = [100, 1000, 3500],
    mx = rD(3500),
    bh = mx * 2 + 4,
    bw = mx * 2 + 62;
  const bubble = (sz) => {
    const r = rD(sz),
      cy = bh - 2 - r,
      top = cy - r;
    return (
      `<circle cx="${mx + 1}" cy="${cy}" r="${r}" style="fill:none;stroke:var(--muted);stroke-dasharray:2 2"/>` +
      `<path d="M${mx + 1},${top}H${mx * 2 + 8}" style="fill:none;stroke:var(--line-strong)"/>` +
      `<text x="${mx * 2 + 12}" y="${top + 4}" style="fill:var(--muted);font:12px var(--sans)">${d3.format(',')(sz)}</text>`
    );
  };
  K.raw(
    `<li class="bubbles"><svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" aria-hidden="true">${sizes.map(bubble).join('')}</svg>` +
      '<span>Bubble area shows cataloged fragments (as of February 2026). Fragments still in orbit are in each card and in the table.</span></li>',
  );
  K.group('3D explainers');
  li(
    '<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>',
    'Select a cube icon to open a 3D explainer',
  );
  K.done();
  // ---- data table
  table(
    'tableA',
    ['Date', 'Country', 'System', 'Target', 'Kind of test', 'Altitude and debris', 'How sure we are', 'Source'],
    KIN.map((e) => {
      const cat = e.fragments_cataloged,
        orb = e.fragments_in_orbit;
      return [
        fmtD(e),
        e.state,
        e.system,
        targetWords(e.target),
        e.type === 'non_destructive' ? quiet(KIND_PLAIN[e.type]) : KIND_PLAIN[e.type],
        `<span class="tl">${e.altitude_km == null ? '—' : `${e.altitude_km} km, ${(ALT_AT[e.altitude_kind] || e.altitude_kind).toLowerCase()}`}${cat == null && orb == null ? '' : `<span class="obj-b">${cat == null ? 'unknown' : num(cat)} fragments cataloged, ${orb == null ? 'unknown' : num(orb)} in orbit</span>`}</span>`,
        CONFIDENCE[e.confidence] || e.confidence,
        srcCell(e, 'tableA', `${e.system}, ${fmtD(e)}`),
      ];
    }),
  );
}
document.getElementById('aZoom').onclick = () => {
  stateA.zoom = !stateA.zoom;
  drawA();
};
