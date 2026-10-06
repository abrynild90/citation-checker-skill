// ============================================================================
// charts/rpo.js: the close-approach chart (chapter 04), on the shared year axis (same layout() scale as the law timeline and the other charts).
// One band per actor; one point per entry in our records (shape = activity, colour = actor, fill = how firmly SWF states it, cube = 3D explainer).
// Provides: drawR(), stateR, zoomedR(), R_SHAPE_KEY, R_STYLE_KEY, R_VERT_NOTE.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { CO, DOMAIN, EXPORTING, PHONE_MAX, actorKey, badge, colorOf, hasScene, isPhoneNow, layout, parse, tw, xAxis } from '../app.js';
import { ACTIVITY_LABEL, ACTIVITY_SHORT, ORBIT_LABEL, SURE_LABEL, SURE_WORD, datePrecise, plain } from '../cards2.js';
import { activate, addGuide, bindMark, coCard, coWhen, rove, srcCell, table } from '../ui.js';
import { arrowPath, barPath, circlePath, diamondPath, fullNote, glyph, keyMarkup, roundRectPath, setKey, trianglePath, wrapLines, zoomNote, TOP_AXIS_H, topAxis } from './kit.js';

const R_LANES = [{ key: 'United States' }, { key: 'China' }, { key: 'Russia' }];
// stateR.focus: null = the default (the zoom 2000-2026 on a phone only; wider screens open on the shared years so the sticky law strip lines up);
// true / false = the reader's explicit choice, kept across resizes.
export const stateR = { focus: null };
export const zoomedR = () => stateR.focus ?? isPhoneNow();
const R_FOCUS = () => [parse('2000-01-01'), DOMAIN[1]];

// Key lists, shared by the page key and the downloads: [svg inner (drawn in the current ink), label, glyph width].
const INK = 'var(--text)';
const solid = `fill:${INK};stroke:${INK};stroke-width:1.5`,
  outline = `fill:var(--bg);stroke:${INK};stroke-width:2`,
  dashed = `${outline};stroke-dasharray:4 3`;
export const R_SHAPE_KEY = [
  [`<path d="${circlePath(0, 0, 6)}" style="${solid}"/>`, 'Close approach', 18],
  [`<path d="${roundRectPath(-5.5, -5.5, 11, 11, 2.2)}" style="${solid}"/>`, 'Docking', 18],
  [`<path d="${trianglePath(0, 0, 7.5)}" style="${solid}"/>`, 'Capture and tow', 18],
  [`<path d="${diamondPath(0, 0, 7.5)}" style="${solid}"/>`, 'Release of an object', 18],
  [`<path d="${barPath(-12, 12, 0, 10)}" style="${solid}"/>`, 'Spaceplane mission (launch to landing)', 28],
];
export const R_STYLE_KEY = [
  [`<path d="${circlePath(0, 0, 6)}" style="${solid}"/>`, 'Stated plainly by SWF', 18],
  [`<path d="${circlePath(0, 0, 6)}" style="${outline}"/>`, 'Stated with caution by SWF (“possibly”, “appeared to”, “may”)', 18],
  [`<path d="${circlePath(0, 0, 6)}" style="${dashed}"/>`, 'Unclear or conflicting', 18],
  [
    `<path d="M-12,0H0" style="fill:none;stroke:${INK};stroke-width:3;stroke-opacity:.45;stroke-linecap:round"/><path d="${arrowPath(0, 0, 9, 6)}" style="fill:${INK}"/>`,
    'Still going',
    28,
  ],
];
export const R_VERT_NOTE = 'Height inside a band only keeps the points apart and carries no meaning. Time runs from left to right.';
const STYLE_OF = { high: 'solid', medium: 'outline', low: 'dashed' };

const ROW = 26, // every row is at least 24 px tall so each point is a comfortable target (WCAG 2.2 AA) and none overlaps the next
  HEAD = 42,
  TOP = 4;

const ORBIT_SHORT = { LEO: 'Low Earth', GEO: 'Geostationary', HEO: 'Elliptical', not_stated: 'Not stated' };
export function drawR(el = document.getElementById('svgR')) {
  el.innerHTML = ''; // a re-draw replaces the chart (never stacks a second one)
  const zoomed = zoomedR(),
    dom = zoomed ? R_FOCUS() : DOMAIN,
    { W, M, x } = layout(el, dom),
    phone = isPhoneNow();
  const k = phone ? 0.95 : 1,
    R = W - M.r,
    L = phone ? 0 : M.l,
    PADX = 14,
    INSET = L + PADX,
    lane = (e) => R_LANES.findIndex((l) => l.key === actorKey(e.actor));

  // ---------------------------------------------------------------- pack the entries of each actor into rows that never overlap
  const lanes = R_LANES.map((l, li) => {
    const rows = [];
    CO.filter((e) => lane(e) === li)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.id < b.id ? -1 : 1))
      .forEach((e) => {
        // a mark's outer edge stays 10 px inside the band edge (late marks shift a few px left)
        const ongoing = !e.end,
          bar = e.activity === 'spaceplane_mission',
          X0 = Math.min(R - 10 - 7.5 * k - (ongoing ? 9 : 0), Math.max(M.l + 8, x(parse(e.start)))),
          X1 = ongoing ? Math.max(X0, R - 22) : Math.max(X0, x(parse(e.end))),
          sc = hasScene(e),
          pad = phone ? 12 : 9,
          tail = Math.max(X1 + (ongoing ? 9 : 0), X0 + (bar ? 12 : 0));
        // Phones: the packing extent IS the tap target (>= 24 px wide, room for the cube on either side), so no two targets in a row overlap.
        const p = { e, X0, X1, ongoing, bar, ext: phone ? [X0 - pad - (sc ? 5 : 0), tail + pad + (sc ? 5 : 0)] : [X0 - pad, tail + (sc ? 17 : 8)] };
        let r = rows.findIndex((row) => row.every((q) => p.ext[0] > q.ext[1] || p.ext[1] < q.ext[0]));
        if (r < 0) {
          r = rows.length;
          rows.push([]);
        }
        rows[r].push(p);
      });
    return rows;
  });
  let yCur = TOP + (zoomed && !EXPORTING ? TOP_AXIS_H : 0);
  const placed = [];
  const bands = R_LANES.map((l, li) => {
    const n = Math.max(1, lanes[li].length),
      b = { l, li, y0: yCur, n, count: CO.filter((e) => lane(e) === li).length };
    b.y1 = yCur + HEAD + n * ROW + 10;
    lanes[li].forEach((row, ri) =>
      row.forEach((p) => {
        p.y = b.y0 + HEAD + ri * ROW + ROW / 2;
        placed.push(p);
      }),
    );
    yCur = b.y1 + 10;
    return b;
  });

  // Cube badges: try the default spot (right, above), then left and below variants, and take the first that touches no other mark or badge; if none is
  // free the badge is left off (the card and the aria-label still say the 3D explainer opens, and downloads never draw badges).
  const dyb = phone ? 6.5 : 8;
  const box = (p) => [p.X0 - 7.5, p.X1 + (p.ongoing ? 9 : 0) + 7.5, p.y - 7.5, p.y + 7.5];
  const boxes = placed.map(box),
    taken = [];
  const clash = (a, b) => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2];
  placed.forEach((p, i) => {
    if (!hasScene(p.e) || EXPORTING) return;
    const right = p.bar ? p.X0 + 4 : p.X0 + 12,
      left = p.X0 - 12,
      opts = [right, left].flatMap((bx) => [
        [bx, -dyb],
        [bx, dyb],
      ]);
    const ok = opts.find(([bx, dy]) => {
      const q = [bx - 5.6, bx + 5.6, p.y + dy - 6.4, p.y + dy + 6.4];
      return bx + 5.6 <= R - 6 && bx - 5.6 >= M.l + 2 && !boxes.some((b, j) => j !== i && clash(q, b)) && !taken.some((b) => clash(q, b));
    });
    if (ok) {
      p.bx = ok[0];
      p.by = p.y + ok[1];
      taken.push([ok[0] - 5.6, ok[0] + 5.6, p.by - 6.4, p.by + 6.4]);
    }
  });

  const zoomLines = [], // the zoom message lives once, in the note above the chart
    axisY = yCur - 4,
    H = axisY + 34 + (zoomLines.length ? 8 + zoomLines.length * 17 : 0);

  // ---------------------------------------------------------------- draw
  const svg = d3
    .select(el)
    .append('svg')
    .attr('class', 'k2 k2r')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hR')
    .attr('id', 'svgR-root');
  svg
    .append('desc')
    .text(
      'Chart of close approaches between satellites, dockings, a capture and tow, releases and spaceplane missions, in one band for each of three states. ' +
        'Each shape sits at the start date of an entry and a line or bar runs to its end date; an arrow means the operation is still going. A solid ' +
        'shape is stated plainly by the source, an outlined shape is stated with caution and a dashed outline is unclear or conflicting. A data table follows the chart.',
    );
  const ticks = x.ticks(d3.utcYear.every(zoomed ? (phone ? 10 : 5) : 10));
  bands.forEach((b) => {
    svg
      .append('rect')
      .attr('class', 'band')
      .attr('x', L)
      .attr('y', b.y0)
      .attr('width', R - L)
      .attr('height', b.y1 - b.y0)
      .attr('rx', 10);
    const gl = svg.append('g').attr('class', 'gridline');
    ticks.forEach((tk) => {
      const tx = x(tk);
      if (tx > M.l + 1 && tx < R - 1)
        gl.append('line')
          .attr('x1', tx)
          .attr('x2', tx)
          .attr('y1', b.y0 + HEAD - 6)
          .attr('y2', b.y1 - 8);
    });
    // header: a dot in the actor's colour, the name and how many operations
    const hy = b.y0 + 27;
    svg
      .append('circle')
      .attr('class', 'band-dot')
      .attr('cx', INSET + 5)
      .attr('cy', hy - 4.5)
      .attr('r', 5)
      .style('fill', colorOf(b.l.key));
    svg
      .append('text')
      .attr('class', 'band-title')
      .attr('x', INSET + 18)
      .attr('y', hy)
      .text(b.l.key);
    svg
      .append('text')
      .attr('class', 'band-gloss')
      .attr('x', INSET + 18 + tw(b.l.key, 14, 600) + 12)
      .attr('y', hy)
      .text(`${b.count} operations`);
  });
  xAxis(svg, x, axisY, zoomed ? (phone ? 10 : 5) : undefined);
  if (zoomed && !EXPORTING) topAxis(svg, x, TOP + TOP_AXIS_H - 6, phone ? 10 : 5);
  if (zoomLines.length) {
    const t = svg
      .append('text')
      .attr('class', 'zoom-flag')
      .attr('x', PADX)
      .attr('y', axisY + 56);
    zoomLines.forEach((ln, i) =>
      t
        .append('tspan')
        .attr('x', PADX)
        .attr('dy', i ? 17 : 0)
        .text(ln),
    );
  }
  // Full view: the left of every band is empty, so the earliest entry says so, with a dotted leader to its point.
  if (!zoomed && !EXPORTING && !phone) {
    const first = placed.reduce((a, b) => (b.e.start < a.e.start ? b : a)),
      txt = 'No earlier entries in our records',
      tW = tw(txt, 13, 400);
    if (INSET + tW + 40 < first.X0 - 24) {
      const fg = svg.append('g').attr('class', 'first-note').attr('aria-hidden', 'true');
      fg.append('text')
        .attr('x', INSET)
        .attr('y', first.y + 4.6)
        .text(txt);
      fg.append('line')
        .attr('x1', INSET + tW + 12)
        .attr('x2', first.X0 - 16)
        .attr('y1', first.y)
        .attr('y2', first.y)
        .attr('stroke-linecap', 'round');
    }
  }

  // Direct labels for a few headline operations (wording taken from the entries themselves). A label goes to the left of its mark, or after it,
  // only where no other mark in the same row is in the way; otherwise it is left off (the card still names the operation).
  const HEADLINES = {
    'us-2010-otv1': 'X-37B OTV-1',
    'cn-2022-sj21-compass-g2': 'SJ-21 tow of Compass G2',
    'ru-2014-luch-olymp': 'Luch (Olymp)',
    'us-2014-gssap': 'GSSAP',
    'cn-2019-tjs3-roaming': 'TJS-3',
    'us-2003-xss10': 'XSS-10',
    'us-2005-xss11': 'XSS-11',
    'us-2007-astro-nextsat': 'ASTRO',
    'us-2008-dsp23-mitex': 'MiTEx',
    'us-2018-mycroft-eagle': 'Mycroft',
    'us-2019-mycroft-s5': 'Mycroft',
    'us-2023-otv7': 'OTV-7',
    'us-2024-ldpe3a-sj23': 'LDPE 3A',
    'us-2020-usa271-sj20': 'USA 271',
    'us-2005-dart': 'DART',
    'us-2009-pan': 'PAN',
    'us-2011-otv2': 'OTV-2',
    'us-2012-otv3': 'OTV-3',
    'us-2015-otv4': 'OTV-4',
    'us-2017-otv5': 'OTV-5',
    'us-2020-otv6': 'OTV-6',
    'us-2025-otv8': 'OTV-8',
    'us-2014-angels': 'ANGELS',
    'us-2014-clio': 'Clio',
    'cn-2013-sy7-sj15-cx3': 'SY-7 / SJ-15',
    'cn-2016-sj17-chinasat': 'SJ-17',
    'cn-2020-csshq1': 'CSSHQ-1',
    'cn-2022-csshq2': 'CSSHQ-2',
    'cn-2023-csshq3': 'CSSHQ-3',
    'cn-2026-csshq4': 'CSSHQ-4',
    'cn-2024-sy24c-sj6': 'SY-24C / SJ-6',
    'cn-2022-pts2-object-j': 'PTS-2',
    'cn-2025-sj21-sj25-docking': 'SJ-21 / SJ-25',
    'ru-2014-cosmos2499': 'Cosmos 2499',
    'ru-2015-cosmos2504-briz': 'Cosmos 2504',
    'ru-2022-cosmos2558-usa326': 'Cosmos 2558',
    'ru-2023-luch-olymp-2': 'Luch/Olymp-2',
    'ru-2019-cosmos2542-2543-usa245': 'Cosmos 2542',
  };
  if (!EXPORTING) {
    const lg = svg.append('g').attr('class', 'dlabels').attr('aria-hidden', 'true'),
      lbox = []; // [x0, x1, y] of every label drawn so far: labels keep 6 px apart
    const clear = (a, b, yy) => lbox.every((q) => Math.abs(q[2] - yy) > 13 || q[1] < a - 6 || q[0] > b + 6);
    placed.forEach((p) => {
      const t = HEADLINES[p.e.id];
      if (!t) return;
      const w = tw(t, 12.5, 600),
        sameRow = placed.filter((q) => q !== p && Math.abs(q.y - p.y) < 2),
        free = (a, b) => sameRow.every((q) => q.ext[1] < a - 4 || q.ext[0] > b + 4) && !(p.bx != null && p.bx > a && p.bx < b);
      const edge = p.bx != null && p.bx < p.X0 ? p.bx - 14 : p.X0 - 14, // a 3D cube left of the mark pushes the label further left
        left = [edge - w, edge],
        right = [p.X1 + (p.ongoing ? 30 : 16), p.X1 + (p.ongoing ? 30 : 16) + w];
      const side = left[0] > INSET + 8 && free(left[0], left[1]) && clear(left[0], left[1], p.y) ? 'l' : right[1] < R - 8 && free(right[0], right[1]) && clear(right[0], right[1], p.y) && !p.ongoing ? 'r' : null;
      let dy = 0,
        ax = null;
      if (!side) {
        // no room in the row: try just above or below the mark, ending where the mark ends, when nothing is there
        const hi = (p.bx != null && p.bx > p.X1 ? p.X0 - 10 : Math.max(p.X1, p.bx ?? 0) + 4); // ends before a cube on the mark's right
        for (const off of [-15, 15]) {
          const a = hi - w,
            yy = p.y + off;
          if (a > INSET + 8 && hi < R - 4 && clear(a, hi, yy) && placed.every((q) => q === p || Math.abs(q.y - yy) > 11 || q.ext[1] < a - 4 || q.ext[0] > hi + 4)) {
            dy = off;
            ax = hi;
            lbox.push([a, hi, yy]);
            break;
          }
        }
        if (ax != null) return lg.append('text').attr('class', 'dlabel').attr('x', ax).attr('y', p.y + dy + 4.4).attr('text-anchor', 'end').text(t);
      }
      if (side) lbox.push(side === 'l' ? [left[0], left[1], p.y] : [right[0], right[1], p.y]);
      if (side) lg.append('text').attr('class', 'dlabel').attr('x', side === 'l' ? left[1] : right[0]).attr('y', p.y + 4.4).attr('text-anchor', side === 'l' ? 'end' : 'start').text(t);
    });
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
        `${e.actor}: ${e.system}${e.target ? ' and ' + plain(e.target) : ''}. ${ACTIVITY_LABEL[e.activity]}. ${coWhen(e)}. ` +
        `How sure we are: ${SURE_WORD[e.confidence]}.${hasScene(e) ? ' Opens the 3D explainer.' : ''}`
      );
    });
  g.each(function (d) {
    const e = d.e,
      s = d3.select(this),
      color = colorOf(e.actor),
      y = d.y;
    // duration: a soft line from the start to the end, and an arrow when the operation is still going
    if (!d.bar && d.X1 - d.X0 > 4)
      s.append('line')
        .attr('class', 'span')
        .attr('x1', d.X0)
        .attr('x2', d.X1)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke-linecap', 'round')
        .style('stroke', color);
    if (d.ongoing && !d.bar) glyph(s, arrowPath(d.X1, y, 9, 6 * k), color, 'solid', 'tip');
    // the shape itself
    let path;
    if (d.bar) path = barPath(d.X0, Math.max(d.X1, d.X0 + 12), y, 10 * k, d.ongoing ? 9 : 0);
    else if (e.activity === 'docking') path = roundRectPath(d.X0 - 5.5 * k, y - 5.5 * k, 11 * k, 11 * k, 2.2);
    else if (e.activity === 'capture_tow') path = trianglePath(d.X0, y, 7.5 * k);
    else if (e.activity === 'release') path = diamondPath(d.X0, y, 7.5 * k);
    else path = circlePath(d.X0, y, 6 * k);
    glyph(s, path, color, STYLE_OF[e.confidence], d.bar ? 'bar' : 'pt', 'var(--band)');
    if (hasScene(e) && d.bx != null) {
      badge(s, d.bx, d.by);
      s.select('.badge3d').attr('transform', `translate(${d.bx},${d.by}) scale(.95)`);
    }
    // Hit target: the mark, its line or bar, and its cube (the cube sits outside the shape; a tap on it must count).
    if (!EXPORTING) {
      const hx0 = phone ? d.ext[0] : Math.min(d.X0 - 12, d.bx != null ? d.bx - 8 : Infinity),
        hx1 = phone ? d.ext[1] : Math.max(d.X1 + (d.ongoing ? 12 : 10), d.bx != null ? d.bx + 8 : -Infinity, d.X0 + 12);
      s.append('rect')
        .attr('class', 'hit')
        .attr('x', hx0)
        .attr('y', y - ROW / 2)
        .attr('width', hx1 - hx0)
        .attr('height', ROW)
        .attr('rx', 8);
    }
  });
  bindMark(
    g,
    (d) => coCard(d.e, innerWidth >= PHONE_MAX),
    (d, elx, evt) => activate(d.e, elx, evt),
  );
  rove(g);
  addGuide(svg, x, TOP, axisY, 'R');
  if (EXPORTING) return;

  // ---------------------------------------------------------------- note, key and data table
  document.getElementById('noteR').innerHTML = zoomed ? zoomNote('2000 to 2026', stateR.focus === null, 'the first entry in our records is from 2003') : fullNote();
  document.getElementById('rFocus').setAttribute('aria-pressed', zoomed);
  document.getElementById('rFull').setAttribute('aria-pressed', !zoomed);
  const cube =
    '<g class="badge3d" transform="scale(1.15)"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>';
  const ink = (s) => s.replaceAll(INK, 'var(--muted)').replace(/;stroke:var\(--muted\);stroke-width:1\.5/, ';stroke:var(--muted);stroke-width:1.5');
  setKey(
    'legendR',
    keyMarkup([
      { head: 'Kind of operation', items: R_SHAPE_KEY.map(([inner, label, w]) => [ink(inner), label, w]) },
      { head: 'How firmly SWF states it', items: R_STYLE_KEY.slice(0, 3) },
      { head: 'Also', items: [R_STYLE_KEY[3], [cube, '3D explainer', 18]] },
    ]) + `<li class="kwide">${R_VERT_NOTE}</li>`,
  );
  table(
    'tableR',
    ['Start', 'End', 'Actor', 'Activity', 'Spacecraft', 'Other object', 'Orbit', 'How sure we are', 'What happened', 'Source'],
    CO.slice()
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
      .map((e) => [
        datePrecise(e, e.start),
        e.end ? datePrecise(e, e.end) : 'Ongoing',
        e.actor,
        `<span class="tl" title="${ACTIVITY_LABEL[e.activity]}">${ACTIVITY_SHORT[e.activity].replace('Spaceplane mission (launch to landing)', 'Spaceplane mission')}</span>`,
        plain(e.system),
        plain(e.target) || '—',
        `<span class="tl" title="${ORBIT_LABEL[e.orbit_regime]}">${ORBIT_SHORT[e.orbit_regime]}</span>`,
        `<span class="tl" title="${SURE_LABEL[e.confidence]}">${SURE_WORD[e.confidence]}</span>`,
        plain(e.description),
        srcCell(e, 'tableR', `${plain(e.system)}, ${datePrecise(e, e.start)}`),
      ]),
    'Close approaches, dockings, a capture and tow, releases and spaceplane missions, one line per entry',
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
