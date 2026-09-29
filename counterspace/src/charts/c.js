// ============================================================================
// charts/c.js: Chart C, non-kinetic operations as swimlanes.
// Provides: drawC(), stateC.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import {
  ATTR_LABEL,
  DOMAIN,
  EXPORTING,
  LAST_DA,
  NK,
  Placer,
  REGIME_LABEL,
  actorKey,
  badge,
  colorOf,
  fmt,
  fmtMY,
  fmtY,
  hasScene,
  isPhoneNow,
  layout,
  parse,
  tw,
  wrap,
  xAxis,
} from '../app.js';
import { activate, addGuide, bindMark, legend, nkCard, rove, srcCell, table } from '../ui.js';
const LANES = [
  { key: 'ew', label: 'EW: uplink / downlink jamming', cats: ['ew_uplink', 'ew_downlink'] },
  { key: 'gnss', label: 'GNSS jamming & spoofing', cats: ['gnss_jamming', 'gnss_spoofing'] },
  { key: 'de', label: 'Directed energy (lasers)', cats: ['directed_energy'] },
  { key: 'cy', label: 'Cyber', cats: ['cyber'] },
];
function regimeIcon(g, regime) {
  const s = g.append('g').attr('class', 'regime').style('fill', 'var(--muted)').style('stroke', 'var(--muted)');
  if (regime === 'GNSS_MEO') s.append('path').attr('d', 'M0,-4.5L4.5,3.5L-4.5,3.5Z').style('stroke', 'none');
  else if (regime === 'GEO_comms') {
    s.append('circle').attr('r', 4).style('fill', 'none').style('stroke-width', 1.5);
    s.append('circle').attr('r', 1.3).style('stroke', 'none');
  } else if (regime === 'LEO_constellation')
    [-3.5, 0, 3.5].forEach((dx) => s.append('circle').attr('cx', dx).attr('r', 1.5).style('stroke', 'none'));
  else if (regime === 'ground_segment') {
    s.append('rect').attr('x', -4).attr('y', 0).attr('width', 8).attr('height', 4).style('stroke', 'none');
    s.append('path').attr('d', 'M0,0V-5M-3,-3L0,-5L3,-3').style('fill', 'none').style('stroke-width', 1.2);
  } else s.append('path').attr('d', 'M0,-4.5L4.5,0L0,4.5L-4.5,0Z').style('stroke', 'none');
  return s;
}
function attrStyle(sel, d) {
  const c = colorOf(d.actor);
  if (d.attribution === 'official_government' || d.attribution === 'multi_government')
    sel.style('fill', c).style('stroke', c).style('stroke-width', 1.5);
  else if (d.attribution === 'researcher_osint') sel.style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2);
  else sel.style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', 2).style('stroke-dasharray', '4 2.5');
}
// stateC.focus: null = the default (zoom 1995-2026 on phones, flagged in the chart and the note; the full shared 1957-2026 axis elsewhere);
// true / false = the reader's choice.
export const stateC = { focus: null };
export const zoomedC = () => stateC.focus ?? isPhoneNow();
const C_FOCUS = () => [parse('1995-01-01'), DOMAIN[1]];
const LINE_H = 12.5,
  LINE_H_PHONE = 14.5;
export function drawC(el = document.getElementById('svgC')) {
  el.innerHTML = ''; // a re-draw replaces the chart (never stacks a second one)
  const dom = zoomedC() ? C_FOCUS() : DOMAIN;
  const { W, M, x } = layout(el, dom),
    phone = isPhoneNow();
  const FS = phone ? 11.5 : 10.5,
    LH = phone ? LINE_H_PHONE : LINE_H,
    rowGap = phone ? 14 : 14,
    markK = phone ? 1.3 : 1,
    laneHead = phone ? 26 : 24,
    lanePad = phone ? 10 : 10,
    top = phone ? 22 : 8,
    R = W - M.r,
    HX = x(parse(LAST_DA)),
    RIGHT = W - 8;
  const XS = (e) => Math.max(M.l, x(parse(e.start)));
  const pl = new Placer({ x0: 2, x1: W - 2, y0: 0, y1: 99999 });
  let yCur = top;
  const placed = [];
  // Labels are never truncated: each one is wrapped (up to 3 lines when it fits, more only as a last resort) and is kept clear of the 2021 hand-off line.
  // Candidates: (A) above the bar, starting at its left end; (B) to the left of the mark;
  // (G) in the gutter left of the hand-off line, joined to the mark by a dotted leader.
  const plan = (e) => {
    const point = e.end === e.start,
      X0 = XS(e),
      X1 = point ? X0 : e.end ? x(parse(e.end)) : R - 8;
    const short = actorKey(e.actor) ? (actorKey(e.actor) === 'United States' ? 'US' : actorKey(e.actor)) : e.actor.split(' ')[0];
    const full = `${short}: ${e.target_system.split(' (')[0]}`;
    let lx = Math.max(M.l + 8, X0 + (point ? 12 : 4) + (hasScene(e) ? 12 : 0));
    if (!phone && lx >= HX - 8 && lx < HX + 6) lx = HX + 6;
    if (phone) {
      // phones: the label sits above its bar, full width (at most 2-3 lines), shifted left just enough to fit
      // The label never crosses the dotted hand-off line: it is wrapped to the space left of it and shifted left of the line if the mark is beyond it.
      const lim = Math.max(120, Math.min(RIGHT, HX - 8) - M.l - 8),
        lines = wrap(full, lim, FS),
        w = Math.max(...lines.map((s) => tw(s, FS))),
        tx = Math.max(M.l + 8, Math.min(lx, Math.max(Math.min(RIGHT, HX - 8), M.l + 8 + lim) - w));
      return {
        e,
        point,
        X0,
        X1,
        mode: 'above',
        anchor: 'start',
        tx,
        limit: lim,
        lines,
        w,
        bad: false,
        cost: lines.length,
        lx0: tx,
        ext: [Math.min(tx, X0 - 16) - 6, Math.max(tx + w, X1 + (e.end ? 6 : 12)) + 6],
      };
    }
    const cands = [{ mode: 'above', anchor: 'start', tx: lx, limit: (lx < HX - 8 ? HX - 8 : RIGHT) - lx }];
    {
      const tx = X0 - 22;
      cands.push({ mode: 'left', anchor: 'end', tx, limit: tx - (tx > HX + 8 ? HX + 8 : M.l + 10) });
    }
    if (X0 > HX + 8) cands.push({ mode: 'gutter', anchor: 'end', tx: HX - 8, limit: HX - 8 - (M.l + 10) });
    const opts = cands.map((c, i) => {
      const lines = wrap(full, Math.max(60, c.limit), FS);
      const w = Math.max(...lines.map((s) => tw(s, FS)));
      return { ...c, lines, w, bad: c.limit < 70 || w > c.limit + 0.5, cost: lines.length + (lines.length > 3 ? 10 : 0) + i * 0.1 };
    });
    opts.forEach((o) => {
      if (o.bad) o.cost += 50;
    });
    const best = opts.reduce((a, b) => (b.cost < a.cost ? b : a));
    const lx0 = best.anchor === 'start' ? best.tx : best.tx - best.w;
    const ext = [Math.min(lx0, X0 - 16) - 6, Math.max(lx0 + best.w, X1 + (e.end ? 6 : 12), best.mode === 'gutter' ? X0 : 0) + 6];
    return { e, point, X0, X1, ...best, lx0, ext };
  };
  const laneRows = LANES.map((l) => {
    const rows = [];
    NK.filter((e) => l.cats.includes(e.category))
      .sort((a, b) => (a.start < b.start ? -1 : 1))
      .forEach((e) => {
        const p = plan(e);
        let r = rows.findIndex((row) => row.items.every((q) => p.ext[0] > q.ext[1] || p.ext[1] < q.ext[0]));
        if (r < 0) {
          r = rows.length;
          rows.push({ items: [] });
        }
        rows[r].items.push(p);
      });
    return rows;
  });
  LANES.forEach((l, li) => {
    const rows = laneRows[li];
    let yy = yCur + laneHead;
    rows.forEach((row) => {
      const nA = Math.max(0, ...row.items.filter((p) => p.mode === 'above').map((p) => p.lines.length)),
        nC = Math.max(0, ...row.items.filter((p) => p.mode !== 'above').map((p) => p.lines.length));
      const off = Math.max(16, nA ? (nA - 1) * LH + 25 : 0, nC ? (nC * LH) / 2 + 9 : 0);
      row.y = yy + off;
      yy += off + rowGap;
      row.items.forEach((p) => {
        p.y = row.y;
        p.lane = l.key;
        p.base = p.mode === 'above' ? p.y - (phone ? 14 : 11) - (p.lines.length - 1) * LH : p.y + 4 - ((p.lines.length - 1) * LH) / 2;
        placed.push(p);
        pl.add([p.lx0, p.base - FS * 0.95, p.lx0 + p.w, p.base + (p.lines.length - 1) * LH + FS * 0.25]);
        pl.add([Math.min(p.X0 - 16, p.lx0), p.y - 7, Math.max(p.X1 + 12, 0), p.y + 8], 'B');
      });
    });
    l.y0 = yCur;
    l.y1 = Math.max(yy, yCur + laneHead + 32) + lanePad;
    yCur = l.y1;
  });
  const flagLines = zoomedC() && !EXPORTING ? wrap('ZOOMED: axis 1995–2026, not the shared 1957–2026 scale', W - M.l - 8, 11, 600) : [],
    H = yCur + 28 + (flagLines.length ? 8 + flagLines.length * 14 : 0);
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hC')
    .attr('id', 'svgC-root');
  svg
    .append('desc')
    .text(
      'Swimlane chart of non-kinetic counterspace operations by category. Bars are sustained campaigns; points are discrete events; ' +
        'arrowheads mark ongoing campaigns. Solid fill means official or multi-government attribution, outline means researcher or ' +
        'open-source attribution, dashed outline means alleged. A data table follows the chart.',
    );
  LANES.forEach((l, i) => {
    svg
      .append('rect')
      .attr('x', M.l)
      .attr('width', W - M.l - M.r)
      .attr('y', l.y0)
      .attr('height', l.y1 - l.y0)
      .style('fill', i % 2 ? 'transparent' : 'var(--recon)');
    svg
      .append('text')
      .attr('class', 'band-label')
      .attr('x', M.l + 6)
      .attr('y', l.y0 + 14)
      .text(l.label.toUpperCase());
  });
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(0,${yCur})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(d3.utcYear.every(zoomedC() ? (phone ? 10 : 5) : 10))
        .tickSize(-(yCur - top))
        .tickFormat(''),
    );
  xAxis(svg, x, yCur, zoomedC() ? (phone ? 10 : 5) : undefined);
  LANES.forEach((l) => {
    const t = l.label.toUpperCase();
    pl.add(pl.textRect(M.l + 6, l.y0 + 14, 'start', tw(t, 10.5, 600) + t.length * 0.85, 10.5));
  });
  // handoff line + label placed where it collides with nothing
  const hg = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  // The hand-off line is drawn in pieces so it never runs through a lane header.
  {
    const segs = [];
    let ys = phone ? 16 : top;
    LANES.forEach((l) => {
      const hx0 = M.l + 6,
        hw = tw(l.label.toUpperCase(), 10.5, 600) + l.label.length * 0.85 + 8;
      if (HX > hx0 - 4 && HX < hx0 + hw) {
        segs.push([ys, l.y0 + 2]);
        ys = l.y0 + 22;
      }
    });
    segs.push([ys, yCur]);
    segs.forEach(([a, b]) => hg.append('line').attr('x1', HX).attr('x2', HX).attr('y1', a).attr('y2', b));
  }
  if (flagLines.length) {
    const t = svg
      .append('text')
      .attr('class', 'zoom-flag')
      .attr('x', M.l)
      .attr('y', yCur + 42);
    flagLines.forEach((ln, i) =>
      t
        .append('tspan')
        .attr('x', M.l)
        .attr('dy', i ? 14 : 0)
        .text(ln),
    );
  }
  {
    const t = phone ? 'last destructive test' : `Last destructive DA-ASAT test (${fmtMY(parse(LAST_DA))})`,
      w = tw(t, 11, 600);
    let ok = false;
    if (phone) {
      hg.append('text')
        .attr('y', 13)
        .attr('text-anchor', HX + 5 + w > W - 4 ? 'end' : 'start')
        .attr('x', HX + 5 + w > W - 4 ? W - 4 : HX + 5)
        .text(t);
      ok = true;
    }
    for (let yy = top + 12; yy < yCur - 4 && !ok; yy += 4)
      for (const [a, dx] of [
        ['end', -5],
        ['start', 5],
      ]) {
        const q = pl.textRect(HX + dx, yy, a, w, 11);
        if (pl.free(q)) {
          hg.append('text')
            .attr('x', HX + dx)
            .attr('y', yy)
            .attr('text-anchor', a)
            .text(t);
          pl.add(q);
          ok = true;
          break;
        }
      }
    if (!ok)
      hg.append('text')
        .attr('x', HX - 5)
        .attr('y', yCur - 6)
        .attr('text-anchor', 'end')
        .text(t);
  }
  if (!phone && !zoomedC()) {
    // SWF framing callout: put it in the first lane where it clears every label and mark
    const CL = [
        'SWF 2026: only non-destructive capabilities are actively',
        'used against satellites in current military operations.',
        'The rules that govern them are soft law (expert manuals)',
        'or carry military exemptions (ITU Constitution Art. 48).',
      ],
      cw = Math.max(...CL.map((s, i) => tw(s, i ? 11.5 : 12, i ? 400 : 600))),
      ax = x(parse('1959-01-01'));
    for (const li of [0, 3, 2, 1]) {
      const y0 = LANES[li].y0 + 40,
        q = [ax - 2, y0 - 13, ax + cw + 2, y0 + 15 * 3 + 6];
      if (q[3] < LANES[li].y1 - 2 && pl.free(q, [], 4)) {
        pl.add(q);
        const tt = svg.append('text').attr('x', ax).attr('y', y0);
        CL.forEach((s, i) =>
          tt
            .append('tspan')
            .attr('x', ax)
            .attr('dy', i ? 15 : 0)
            .attr('class', 'ann-sub')
            .style('font-weight', i === 0 ? 600 : null)
            .style('fill', 'var(--text)')
            .text(s),
        );
        break;
      }
    }
  }
  const g = svg
    .append('g')
    .selectAll('g')
    .data(placed)
    .join('g')
    .attr('class', 'mark')
    .attr('role', 'button')
    .attr('data-id', (d) => d.e.id)
    .attr('data-t', (d) => +parse(d.e.start))
    .attr('aria-label', (d) => {
      const e = d.e;
      return (
        `${e.actor}: ${e.target_system}. ` +
        `${e.end === e.start ? fmt(parse(e.start)) : `${fmtY(parse(e.start))} to ${e.end ? fmtY(parse(e.end)) : 'ongoing'}`}. Attribution: ` +
        `${ATTR_LABEL[e.attribution]}.${hasScene(e) ? ' Opens 3D scene.' : ''}`
      );
    });
  g.each(function (d) {
    const e = d.e,
      s = d3.select(this),
      X0 = d.X0;
    if (d.point)
      attrStyle(
        s
          .append('circle')
          .attr('cx', X0)
          .attr('cy', d.y)
          .attr('r', 6 * markK),
        e,
      );
    else {
      attrStyle(
        s
          .append('rect')
          .attr('x', X0)
          .attr('y', d.y - 5 * markK)
          .attr('width', Math.max(4, d.X1 - X0))
          .attr('height', 10 * markK)
          .attr('rx', 2),
        e,
      );
      if (!e.end)
        s.append('path')
          .attr('d', `M${d.X1},${d.y - 7}L${d.X1 + 8},${d.y}L${d.X1},${d.y + 7}Z`)
          .style('fill', colorOf(e.actor));
    }
    regimeIcon(s, e.target_regime).attr('transform', `translate(${X0 - 11},${d.y})`);
    if (hasScene(e)) badge(s, X0 + (d.point ? 12 : 9), d.y - 8);
    if (d.mode === 'gutter')
      s.append('line')
        .attr('x1', d.tx + 4)
        .attr('x2', X0 - 16)
        .attr('y1', d.y)
        .attr('y2', d.y)
        .style('stroke', 'var(--faint)')
        .style('stroke-dasharray', '1 3');
    const t = s
      .append('text')
      .attr('x', d.tx)
      .attr('y', d.base)
      .attr('text-anchor', d.anchor)
      .style('fill', 'var(--text)')
      .style('font', `${FS}px var(--sans)`);
    if (phone) t.style('paint-order', 'stroke').style('stroke', 'var(--bg)').style('stroke-width', 3).style('stroke-linejoin', 'round');
    d.lines.forEach((ln, i) =>
      t
        .append('tspan')
        .attr('x', d.tx)
        .attr('dy', i ? LH : 0)
        .text(ln),
    );
    s.append('rect')
      .attr('class', 'hit')
      .attr('x', X0 - 18)
      .attr('y', d.y - 12)
      .attr('width', d.point ? 36 : Math.max(36, d.X1 - X0 + 30))
      .attr('height', 24);
  });
  bindMark(
    g,
    (d) => nkCard(d.e),
    (d, el, ev) => activate(d.e, el, ev),
  );
  rove(g);
  addGuide(svg, x, top, yCur);
  if (EXPORTING) return;
  document.getElementById('noteC').innerHTML = zoomedC()
    ? `<span class="zbadge">Zoomed</span> Axis 1995–2026${stateC.focus === null ? ' (the default on phones)' : ''}: an enlargement of the ` +
      `recent decades, no longer aligned with the Law band above or Charts A and B. Choose “Full span” to return to the shared scale.`
    : 'Full span 1957–2026, on the same year axis as the Law band and Charts A and B. The ledger’s earliest non-kinetic entry is the 1997 ' +
      'MIRACL laser test, so the left of the chart is empty. Choose “Zoom 1995–2026” to enlarge the recent decades.';
  document.getElementById('cFocus').setAttribute('aria-pressed', zoomedC());
  document.getElementById('cFull').setAttribute('aria-pressed', !zoomedC());
  const L = legend('legendC', 26, 16),
    li = L.item;
  li('<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:var(--text)"/>', 'Official or multi-government attribution');
  li(
    '<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:none;stroke:var(--text);stroke-width:2"/>',
    'Researcher / OSINT attribution',
  );
  li(
    '<rect x="-11" y="-5" width="22" height="10" rx="2" style="fill:none;stroke:var(--text);stroke-width:2;stroke-dasharray:4 2.5"/>',
    'Alleged',
  );
  li('<path d="M-8,-6L2,0L-8,6Z" style="fill:var(--text)"/>', 'Ongoing');
  L.raw('<li class="lsep" aria-hidden="true"></li>');
  li('<path d="M0,-4.5L4.5,3.5L-4.5,3.5Z" style="fill:var(--muted)"/>', 'GNSS (MEO signals)', 14);
  li('<circle r="4" style="fill:none;stroke:var(--muted);stroke-width:1.5"/><circle r="1.3" style="fill:var(--muted)"/>', 'GEO comms', 14);
  li(
    '<circle cx="-3.5" r="1.5" style="fill:var(--muted)"/><circle r="1.5" style="fill:var(--muted)"/><circle cx="3.5" r="1.5" style="fill:var(--muted)"/>',
    'LEO constellation',
    14,
  );
  li(
    '<rect x="-4" y="0" width="8" height="4" style="fill:var(--muted)"/><path d="M0,0V-5M-3,-3L0,-5L3,-3" style="fill:none;stroke:var(--muted)"/>',
    'Ground segment',
    14,
  );
  li('<path d="M0,-4.5L4.5,0L0,4.5L-4.5,0Z" style="fill:var(--muted)"/>', 'LEO imaging / ISR', 14);
  L.raw('<li class="lsep" aria-hidden="true"></li>');
  ['Russia', 'China', 'United States', 'Iran', 'North Korea', 'Israel', 'Iraq'].forEach((s) =>
    li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s, 14),
  );
  L.done();
  table(
    'tableC',
    ['Start', 'End', 'Actor', 'Category', 'Attribution (as source states)', 'Target', 'Operational', 'Conf.', 'Source'],
    NK.map((e) => [
      e.start,
      e.end === e.start ? '(discrete)' : e.end || 'ongoing',
      e.actor,
      e.category,
      ATTR_LABEL[e.attribution],
      `${e.target_system} [${REGIME_LABEL[e.target_regime]}]`,
      e.operational_use ? 'yes' : 'no',
      e.confidence,
      srcCell(e),
    ]),
  );
}
