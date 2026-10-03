// ============================================================================
// charts/rpo.js: co-orbital proximity operations (RPO) strip, on the shared year axis (same layout() scale as the law band and Charts A-C).
// One lane per actor; one mark per ledger row (shape = activity, colour = actor, outline style = how firmly SWF states it, cube badge = 3D scene).
// Provides: drawR(), stateR.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import {
  ACTIVITY,
  CO,
  DOMAIN,
  EXPORTING,
  PHONE_MAX,
  REGIME_CO,
  actorKey,
  badge,
  colorOf,
  hasScene,
  isPhoneNow,
  layout,
  parse,
  tw,
  wrap,
  xAxis,
} from '../app.js';
import { activate, addGuide, bindMark, coCard, coWhen, legend, rove, srcCell, table } from '../ui.js';
const R_LANES = [
  { key: 'United States', label: 'United States' },
  { key: 'China', label: 'China' },
  { key: 'Russia', label: 'Russia' },
];
// stateR.focus: null = the default (zoom 2000-2026 on phones, flagged in the chart and the note; the full shared 1957-2026 axis elsewhere);
// true / false = the reader's explicit choice, kept across resizes.
export const stateR = { focus: null };
export const zoomedR = () => stateR.focus ?? isPhoneNow();
// Legend and export key share one list: [svg inner (drawn in the current ink), label, glyph width].
const INK = 'var(--text)';
export const R_SHAPE_KEY = [
  [`<circle r="5.5" style="fill:${INK}"/>`, 'RPO', 16],
  [`<rect x="-5" y="-5" width="10" height="10" rx="1.5" style="fill:${INK}"/>`, 'Docking', 16],
  [`<path d="M0,-7L6.5,5L-6.5,5Z" style="fill:${INK}"/>`, 'Capture and tow', 16],
  [`<path d="M0,-6.5L6.5,0L0,6.5L-6.5,0Z" style="fill:${INK}"/>`, 'Release', 16],
  [`<rect x="-11" y="-4.5" width="22" height="9" rx="2.5" style="fill:${INK}"/>`, 'Spaceplane mission (launch to landing)', 24],
];
export const R_STYLE_KEY = [
  [`<circle r="5" style="fill:${INK};stroke:${INK}"/>`, 'Stated plainly by SWF', 16],
  [`<circle r="5" style="fill:none;stroke:${INK};stroke-width:2"/>`, 'Hedged by SWF (“possibly”, “appeared”, “may”)', 16],
  [`<circle r="5" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:3 2.2"/>`, 'Unclear or conflicted', 16],
  [`<path d="M-8,-6L2,0L-8,6Z" style="fill:${INK}"/>`, 'Ongoing', 22],
];
export const R_VERT_NOTE =
  'Vertical position inside a lane only keeps marks from overlapping; it carries no data. Time runs left to right.';
const R_FOCUS = () => [parse('2000-01-01'), DOMAIN[1]];
// Marks: circle = RPO, square = docking, triangle = capture and tow, diamond = release, bar = spaceplane mission (span = launch to landing).
function coMark(s, e, X0, X1, y, k) {
  const c = colorOf(e.actor),
    hi = e.confidence === 'high',
    lo = e.confidence === 'low';
  const paint = (sel) => (
    hi
      ? sel.style('fill', c).style('stroke', c).style('stroke-width', 1.5)
      : sel
          .style('fill', 'var(--bg)')
          .style('stroke', c)
          .style('stroke-width', 2)
          .style('stroke-dasharray', lo ? '3 2.2' : null),
    sel
  );
  const span = X1 - X0;
  if (e.activity === 'spaceplane_mission')
    paint(
      s
        .append('rect')
        .attr('x', X0)
        .attr('y', y - 4.5 * k)
        .attr('width', Math.max(8, span))
        .attr('height', 9 * k)
        .attr('rx', 2.5),
    );
  else {
    if (span > 4)
      s.append('line')
        .attr('x1', X0)
        .attr('x2', X1)
        .attr('y1', y)
        .attr('y2', y)
        .style('stroke', c)
        .style('stroke-width', 3)
        .style('stroke-opacity', 0.45)
        .style('stroke-linecap', 'round');
    const g = s.append('g').attr('transform', `translate(${X0},${y})`);
    if (e.activity === 'docking')
      paint(
        g
          .append('rect')
          .attr('x', -5 * k)
          .attr('y', -5 * k)
          .attr('width', 10 * k)
          .attr('height', 10 * k)
          .attr('rx', 1.5),
      );
    else if (e.activity === 'capture_tow') paint(g.append('path').attr('d', `M0,${-7 * k}L${6.5 * k},${5 * k}L${-6.5 * k},${5 * k}Z`));
    else if (e.activity === 'release') paint(g.append('path').attr('d', `M0,${-6.5 * k}L${6.5 * k},0L0,${6.5 * k}L${-6.5 * k},0Z`));
    else paint(g.append('circle').attr('r', 5.5 * k));
  }
}
export function drawR(el = document.getElementById('svgR')) {
  el.innerHTML = ''; // a re-draw replaces the chart (never stacks a second one)
  const zoomed = zoomedR(),
    dom = zoomed ? R_FOCUS() : DOMAIN;
  const { W, M, x } = layout(el, dom),
    phone = isPhoneNow();
  const k = phone ? 0.95 : 1,
    rowH = 24, // rows are 24 px tall so every mark's hit target is at least 24 px (WCAG 2.2 target size, AA) and none overlaps the next
    laneHead = 24,
    lanePad = 8,
    top = 4,
    PR = W - M.r,
    x0min = M.l;
  const lane = (e) => R_LANES.findIndex((l) => l.key === actorKey(e.actor));
  const lanes = R_LANES.map((l, li) => {
    const rows = [];
    CO.filter((e) => lane(e) === li)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.id < b.id ? -1 : 1))
      .forEach((e) => {
        // a mark's outer edge stays 8 px inside the plot edge (late marks shift a few px left)
        const X0 = Math.min(PR - 8 - 6.5 * k, Math.max(x0min, x(parse(e.start)))),
          X1 = e.end ? Math.max(X0, x(parse(e.end))) : Math.max(X0, PR - 16), // an end arrow's tip stays 8 px inside the plot edge
          bar = e.activity === 'spaceplane_mission',
          sc = hasScene(e),
          // the cube badge sits right of the mark, or left of it when that would put it within 8 px of the plot edge
          bx = bar ? X0 + 3 : X0 + 12,
          flip = sc && !bar && bx + 5 > PR - 8;
        const pad = phone ? 12 : 9,
          tail = Math.max(X1 + (e.end ? 0 : 8), X0 + (bar ? 8 : 0));
        // Phones: the packing extent IS the tap target (>= 24 px wide, room for the badge on either side), so no two targets in a row overlap.
        const p = {
          e,
          X0,
          X1,
          bx: flip ? X0 - 12 : bx,
          ext: phone ? [X0 - pad - (sc ? 5 : 0), tail + pad + (sc ? 5 : 0)] : [X0 - pad - (flip ? 8 : 0), tail + (sc && !flip ? 17 : 8)],
        };
        let r = rows.findIndex((row) => row.every((q) => p.ext[0] > q.ext[1] || p.ext[1] < q.ext[0]));
        if (r < 0) {
          r = rows.length;
          rows.push([]);
        }
        rows[r].push(p);
        p.row = r;
      });
    return rows;
  });
  let yCur = top;
  const placed = [];
  R_LANES.forEach((l, li) => {
    l.y0 = yCur;
    const n = Math.max(1, lanes[li].length);
    l.rowsN = n;
    l.head = li === 0 && !zoomed && !EXPORTING ? laneHead + 8 : laneHead; // room for the full-span annotation above the first lane's marks
    l.y1 = yCur + l.head + n * rowH + lanePad;
    lanes[li].forEach((row, ri) =>
      row.forEach((p) => {
        p.y = l.y0 + l.head + ri * rowH + rowH / 2;
        p.lane = li;
        placed.push(p);
      }),
    );
    yCur = l.y1;
  });
  // Cube badges: try the default spot (right, above), then left/below variants, and take the first that touches no other mark or badge; if none is
  // free the badge is left off (the card and the aria-label still say "opens 3D scene", and the export never draws badges).
  const dyb = phone ? 6.5 : 9; // badge offset from the mark's row centre; on phones the badge stays inside its 24 px tap row
  const box = (p) => [p.X0 - 6.5, p.X1 + (p.e.end ? 0 : 8) + 6.5, p.y - 6.5, p.y + 6.5];
  const boxes = placed.map(box),
    bad = [];
  const clash = (a, b) => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2];
  placed.forEach((p, i) => {
    if (!hasScene(p.e) || EXPORTING) return;
    const bar = p.e.activity === 'spaceplane_mission',
      right = bar ? p.X0 + 3 : p.X0 + 12,
      left = p.X0 - 12,
      opts = (p.bx === left ? [left, right] : [right, left]).flatMap((bx) => [
        [bx, -dyb],
        [bx, dyb],
      ]);
    const ok = opts.find(([bx, dy]) => {
      const q = [bx - 4.8, bx + 4.8, p.y + dy - 5.5, p.y + dy + 5.5];
      return bx + 4.8 <= PR - 8 && bx - 4.8 >= M.l + 2 && !boxes.some((b, j) => j !== i && clash(q, b)) && !bad.some((b) => clash(q, b));
    });
    if (ok) {
      p.bx = ok[0];
      p.by = p.y + ok[1];
      bad.push([ok[0] - 4.8, ok[0] + 4.8, p.by - 5.5, p.by + 5.5]);
    } else p.bx = null;
  });
  const flagText = `ZOOMED: axis 2000–2026, not the shared 1957–2026 scale${phone ? '. Use “Full span” for the shared scale.' : ''}`,
    flagLines = zoomed && !EXPORTING ? wrap(flagText, W - M.l - 8, 11, 600) : [],
    H = yCur + 28 + (flagLines.length ? 8 + flagLines.length * 14 : 0);
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hR')
    .attr('id', 'svgR-root');
  svg
    .append('desc')
    .text(
      'Strip chart of co-orbital rendezvous and proximity operations, dockings, a capture and tow, releases and spaceplane missions, one ' +
        'lane per actor. Marks are placed at the start date of each ledger row; a line or bar runs to the end date. Solid marks are stated ' +
        'plainly by the source, outlined marks are hedged in the source, dashed outlines are unclear or conflicted. A data table follows the chart.',
    );
  R_LANES.forEach((l, i) => {
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
      .attr('y', l.y0 + 15)
      .text(`${l.label.toUpperCase()} · ${CO.filter((e) => lane(e) === i).length} ROWS`);
  });
  const ev = zoomed ? (phone ? 10 : 5) : undefined;
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(0,${yCur})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(d3.utcYear.every(zoomed ? (phone ? 10 : 5) : 10))
        .tickSize(-(yCur - top))
        .tickFormat(''),
    );
  xAxis(svg, x, yCur, ev);
  if (flagLines.length) {
    const t = svg
      .append('text')
      .attr('class', 'zoom-flag')
      .attr('x', M.l)
      .attr('y', yCur + 40);
    flagLines.forEach((ln, i) =>
      t
        .append('tspan')
        .attr('x', M.l)
        .attr('dy', i ? 14 : 0)
        .text(ln),
    );
  }
  // Full span: most rows start after 2005, so the left is empty by design (the axis is shared with the law band). Say so, and offer the zoom.
  if (!zoomed && !EXPORTING) {
    const x05 = x(parse('2005-01-01')),
      l0 = R_LANES[0],
      labW = tw(`${l0.label.toUpperCase()} · ${CO.filter((e) => lane(e) === 0).length} ROWS`, 10.5, 600) + 14,
      cands = ['Most co-orbital activity since 2005 · zoom to enlarge ▸', 'Most activity since 2005 · zoom ▸', 'Since 2005 ▸'],
      txt = cands.find((c) => PR - 8 - tw(c, 11) > M.l + labW + 10);
    if (txt) {
      const a = svg.append('g').attr('class', 'r-dense').style('cursor', 'pointer').attr('aria-hidden', 'true');
      a.append('path')
        .attr('d', `M${x05},${l0.y0 + 26}V${l0.y0 + 21}H${PR - 4}V${l0.y0 + 26}`)
        .style('fill', 'none')
        .style('stroke', 'var(--faint)');
      a.append('text')
        .attr('class', 'ann-sub')
        .attr('x', PR - 8)
        .attr('y', l0.y0 + 13)
        .attr('text-anchor', 'end')
        .text(txt);
      a.on('click', () => {
        stateR.focus = true;
        drawR();
      });
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
        `${e.actor}: ${e.system}${e.target ? ' and ' + e.target : ''}. ${ACTIVITY[e.activity]}. ${coWhen(e)}. Confidence: ` +
        `${e.confidence}.${hasScene(e) ? ' Opens 3D scene.' : ''}`
      );
    });
  g.each(function (d) {
    const e = d.e,
      s = d3.select(this);
    coMark(s, e, d.X0, d.X1, d.y, k);
    if (!e.end)
      s.append('path')
        .attr('d', `M${d.X1},${d.y - 6}L${d.X1 + 8},${d.y}L${d.X1},${d.y + 6}Z`)
        .style('fill', colorOf(e.actor));
    if (hasScene(e) && d.bx != null) badge(s, d.bx, d.by ?? d.y - dyb);
    // Hit target: the mark, its arrow or bar, and its cube badge (the badge sits outside the mark; a tap on it must count).
    const hx0 = phone ? d.ext[0] : Math.min(d.X0 - 12, d.bx != null ? d.bx - 8 : Infinity),
      hx1 = phone ? d.ext[1] : Math.max(d.X1 + 12, d.bx != null ? d.bx + 8 : -Infinity, d.X0 + 12);
    s.append('rect')
      .attr('class', 'hit')
      .attr('x', hx0)
      .attr('y', d.y - rowH / 2)
      .attr('width', hx1 - hx0)
      .attr('height', rowH);
  });
  bindMark(
    g,
    (d) => coCard(d.e, innerWidth >= PHONE_MAX),
    (d, elx, evt) => activate(d.e, elx, evt),
  );
  rove(g);
  addGuide(svg, x, top, yCur, 'R');
  if (EXPORTING) return;
  document.getElementById('noteR').innerHTML = zoomed
    ? `<span class="zbadge">Zoomed</span> Axis 2000–2026${stateR.focus === null ? ' (the default on phones)' : ''}: an enlargement, no ` +
      `longer aligned with the Law band above or Charts A to C. Choose “Full span” to return to the shared scale.`
    : `Full span 1957–2026, on the same year axis as the Law band and Charts A to C. The earliest entry is 2003 (XSS-10) and most rows ` +
      `start after 2005, so the left is empty by design. Choose “Zoom 2000–2026” to enlarge the recent years.`;
  document.getElementById('rFocus').setAttribute('aria-pressed', zoomed);
  document.getElementById('rFull').setAttribute('aria-pressed', !zoomed);
  const L = legend('legendR', 26, 16),
    li = L.item;
  R_SHAPE_KEY.forEach(([inner, label, w]) => li(inner, label, w));
  L.raw('<li class="lsep" aria-hidden="true"></li>');
  R_STYLE_KEY.forEach(([inner, label, w]) => li(inner, label, w));
  li(
    '<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>',
    'Has a 3D scene',
    16,
  );
  L.raw('<li class="lsep" aria-hidden="true"></li>');
  ['United States', 'China', 'Russia'].forEach((s) =>
    li(`<rect x="-6" y="-6" width="12" height="12" rx="2" style="fill:${colorOf(s)}"/>`, s, 14),
  );
  L.raw(`<li class="wide"><span>${R_VERT_NOTE}</span></li>`);
  L.done();
  table(
    'tableR',
    ['Start', 'End', 'Actor', 'Activity', 'Chaser / system', 'Target', 'Orbit', 'Conf.', 'Description', 'Source'],
    CO.slice()
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
      .map((e) => [
        e.start,
        e.end || 'ongoing',
        e.actor,
        ACTIVITY[e.activity],
        e.system,
        e.target || '—',
        REGIME_CO[e.orbit_regime],
        e.confidence,
        e.description,
        srcCell(e),
      ]),
  );
}
document.getElementById('rFocus').onclick = () => {
  stateR.focus = true;
  drawR();
};
document.getElementById('rFull').onclick = () => {
  stateR.focus = false;
  drawR();
};
