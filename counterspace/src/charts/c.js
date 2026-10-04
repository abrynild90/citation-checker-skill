// ============================================================================
// charts/c.js: the jamming, laser and cyber chart (chapter 03). One band per kind of attack, one line per entry, on the page's shared year axis.
// Provides: drawC(), stateC, zoomedC().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { DOMAIN, EXPORTING, LAST_DA, NK, actorKey, badge, colorOf, fmt, fmtMY, fmtY, hasScene, isPhoneNow, layout, parse, tw, xAxis } from '../app.js';
import { ATTRIBUTION_LABEL, CATEGORY_LABEL, SURE_WORD, TARGET_LABEL } from '../cards2.js';
import { activate, addGuide, bindMark, nkCard, rove, srcCell, table } from '../ui.js';
import { bar, barPath, circlePath, dot, fullNote, glyph, keyMarkup, setKey, swatch, wrapBalanced, wrapLines, zoomNote } from './kit.js';

const GROUPS = [
  {
    title: 'Jamming satellite communications',
    gloss: 'Radio noise that drowns out the signals going up to a satellite (uplink) or coming down from it (downlink).',
    cats: ['ew_uplink', 'ew_downlink'],
  },
  {
    title: 'Jamming and spoofing satellite navigation',
    gloss: 'Jamming blocks satellite navigation signals (GNSS, such as GPS); spoofing sends false ones, so a receiver shows the wrong position or time.',
    cats: ['gnss_jamming', 'gnss_spoofing'],
  },
  {
    title: 'Lasers that dazzle or damage satellites',
    gloss: 'Lasers aimed at a satellite to blind its sensors for a time, or to damage them.',
    cats: ['directed_energy'],
  },
  { title: 'Cyber attacks', gloss: 'Hacking the computers and networks that run a satellite service.', cats: ['cyber'] },
];
// SWF 2026, Executive Summary, p. xxiii (PDF p. 21): thirteen words, quoted exactly; the capital O is the only change and is shown in brackets.
const QUOTE = '“[O]nly non-destructive capabilities are actively being used against satellites in current military operations.”';
const QUOTE_BY = 'Secure World Foundation (SWF), 2026 assessment, Executive Summary, p. xxiii';
const STYLE_OF = { official_government: 'solid', multi_government: 'solid', researcher_osint: 'outline', alleged: 'dashed' };

// stateC.focus: null = the default (zoom 1995-2026 on phones, flagged in the chart and the note; the full shared 1957-2026 axis elsewhere);
// true / false = the reader's choice.
export const stateC = { focus: null };
export const zoomedC = () => stateC.focus ?? isPhoneNow();
const C_FOCUS = () => [parse('1995-01-01'), DOMAIN[1]];

const FS = 13, // label size
  LH = 18, // wrapped label line step
  MARK_R = 7, // a point's radius; a bar is 12 px tall
  CUBE = 20; // room the 3D cube takes beside a label

export function drawC(el = document.getElementById('svgC')) {
  el.innerHTML = ''; // a re-draw replaces the chart (never stacks a second one)
  const zoom = zoomedC(),
    { W, M, x } = layout(el, zoom ? C_FOCUS() : DOMAIN),
    phone = isPhoneNow();
  const R = W - M.r, // right end of the plot (and of every band)
    L = phone ? 0 : M.l, // left end of every band
    PADX = 14, // text inset inside a band
    INSET = L + PADX,
    HX = x(parse(LAST_DA)),
    barH = MARK_R * 2 - 2;
  const wLine = (who, bold) => (s) => tw(s, FS, 400) + (s.startsWith(who) ? bold : 0);

  // ---------------------------------------------------------------- the quotation and the hand-off label (strip above the bands)
  const qSize = phone ? 16 : 17,
    qLH = qSize + 7,
    qW = Math.min(phone ? W - 2 * PADX : 600, HX - INSET - 24),
    qLines = wrapBalanced(QUOTE, Math.max(220, qW), (s) => tw(s, qSize, 400)),
    byLines = wrapLines(QUOTE_BY, W - INSET - PADX, (s) => tw(s, 12.5, 400)),
    hand = phone ? 'Last destructive test, Nov 2021' : 'Last destructive anti-satellite test, Nov 2021',
    handW = tw(hand, 12.5, 600),
    byW = Math.max(...byLines.map((s) => tw(s, 12.5, 400)));
  const sameRow = !phone && byLines.length === 1 && INSET + byW + 36 < HX - 14 - handW; // the hand-off label fits beside the attribution
  const qTop = 4,
    byY = qTop + qLines.length * qLH + 2,
    handY = sameRow ? byY + 12 : byY + byLines.length * 17 + 14,
    stripBottom = handY + 12;

  // ---------------------------------------------------------------- entries, planned one line each
  const planEntry = (e) => {
    const point = e.start === e.end,
      ongoing = !e.end,
      X0 = Math.max(L + 12, x(parse(e.start))),
      X1 = point ? X0 : ongoing ? R - 12 : Math.max(X0 + 10, x(parse(e.end))),
      cube = hasScene(e) ? CUBE : 0,
      who = actorKey(e.actor) || e.actor.split(' ')[0],
      full = `${who}: ${e.target_system.split(' (')[0]}`,
      bold = tw(`${who}:`, FS, 600) - tw(`${who}:`, FS, 400),
      measure = wLine(who, bold),
      markL = point ? X0 - MARK_R : X0,
      markR = point ? X0 + MARK_R : ongoing ? X1 + 9 : X1;
    const p = { e, point, ongoing, X0, X1, who, cube, markL, markR, style: STYLE_OF[e.attribution], color: colorOf(e.actor) };
    if (phone) {
      // Phones: the label sits above its bar, always at the left edge of the band, so the labels read as one tidy column.
      const lines = wrapLines(full, W - 2 * PADX, measure);
      return { ...p, mode: 'above', lines, tx: INSET, anchor: 'start', h: 12 + lines.length * LH + 8 + MARK_R * 2 + 14 };
    }
    // Desktop: the label sits left of its mark and ends against it. Where that does not fit it wraps, then moves right of the mark, then above it.
    const end = markL - 12 - cube,
      room = end - INSET;
    if (measure(full) <= room) return { ...p, mode: 'left', lines: [full], tx: end, anchor: 'end', h: 34 };
    if (room >= 170) {
      const lines = wrapLines(full, room, measure);
      if (lines.length <= 2) return { ...p, mode: 'left', lines, tx: end, anchor: 'end', h: Math.max(34, 16 + lines.length * LH) };
    }
    const start = markR + 12 + cube,
      roomR = R - 12 - start;
    if (!ongoing && roomR >= 150) {
      const lines = wrapLines(full, roomR, measure);
      return { ...p, mode: 'right', lines, tx: start, anchor: 'start', h: Math.max(34, 16 + lines.length * LH) };
    }
    const lines = wrapLines(full, R - 12 - INSET, measure);
    return {
      ...p,
      mode: 'above',
      lines,
      tx: Math.min(Math.max(INSET, markL), R - 12 - tw(lines[0], FS, 400)),
      anchor: 'start',
      h: 12 + lines.length * LH + 8 + MARK_R * 2 + 14,
    };
  };

  // ---------------------------------------------------------------- band headers: the title, then a one-sentence gloss for a reader new to the subject
  const titleSize = 14;
  const planHeader = (g) => {
    const avail = Math.min(R - L - 2 * PADX, 760),
      title = wrapBalanced(g.title, avail, (s) => tw(s, titleSize, 600)),
      gloss = wrapBalanced(g.gloss, avail, (s) => tw(s, 12.5, 400));
    return { title, gloss, h: 18 + title.length * LH + 3 + gloss.length * 17 + 10 };
  };

  // ---------------------------------------------------------------- vertical layout
  const bands = GROUPS.map((g) => ({
    g,
    head: planHeader(g),
    rows: NK.filter((e) => g.cats.includes(e.category))
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
      .map(planEntry),
  }));
  let y = stripBottom + 14;
  bands.forEach((b) => {
    b.y0 = y;
    let yy = y + b.head.h;
    b.rows.forEach((r) => {
      r.top = yy;
      r.y = r.mode === 'above' ? yy + 12 + r.lines.length * LH + 8 + MARK_R : yy + r.h / 2;
      yy += r.h;
    });
    b.y1 = yy + 8;
    y = b.y1 + 10;
  });
  const axisY = bands.at(-1).y1 + 6;
  const zoomLines = zoom && !EXPORTING ? wrapLines('Zoomed view: 1995–2026, not the shared 1957–2026 years', W - 2 * PADX, (s) => tw(s, 12.5, 600)) : [];
  const H = axisY + 34 + (zoomLines.length ? 8 + zoomLines.length * 17 : 0);

  // ---------------------------------------------------------------- draw
  const svg = d3
    .select(el)
    .append('svg')
    .attr('class', 'k2 k2c')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hC')
    .attr('id', 'svgC-root');
  svg
    .append('desc')
    .text(
      'Chart of jamming, laser and cyber operations against satellites, in four groups, one line per entry. Bars are campaigns over a period, ' +
        'dots are single events and an arrow means the campaign is still going. A solid fill means governments or an international body attribute ' +
        'the activity, an outline means researchers or open-source analysts, and a dashed outline means it is alleged. A data table follows the chart.',
    );
  const lines = (parent, cls, xx, y0, arr, step) => {
    const t = parent.append('text').attr('class', cls).attr('x', xx).attr('y', y0);
    arr.forEach((ln, i) =>
      t
        .append('tspan')
        .attr('x', xx)
        .attr('dy', i ? step : 0)
        .text(ln),
    );
    return t;
  };

  // the quotation, attributed
  lines(svg, 'quote', INSET, qTop + qSize, qLines, qLH);
  lines(svg, 'quote-by', INSET, byY + 13, byLines, 17);

  // bands, and the year grid inside them
  const ticks = x.ticks(d3.utcYear.every(zoom ? (phone ? 10 : 5) : 10));
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
          .attr('y1', b.y0 + b.head.h - 4)
          .attr('y2', b.y1 - 8);
    });
  });

  // hand-off line: from its label, through every band, to the axis
  {
    const hg = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
    hg.append('line')
      .attr('x1', HX)
      .attr('x2', HX)
      .attr('y1', handY - 4)
      .attr('y2', bands.at(-1).y1 - 6);
    hg.append('circle')
      .attr('cx', HX)
      .attr('cy', handY - 4)
      .attr('r', 3.5);
    hg.append('text')
      .attr('x', HX - 10)
      .attr('y', handY)
      .attr('text-anchor', 'end')
      .text(hand);
  }

  // band titles and glosses
  bands.forEach((b) => {
    const h = b.head;
    lines(svg, 'band-title', INSET, b.y0 + 27, h.title, LH);
    lines(svg, 'band-gloss', INSET, b.y0 + 27 + (h.title.length - 1) * LH + 21, h.gloss, 17);
  });

  // year axis
  xAxis(svg, x, axisY, zoom ? (phone ? 10 : 5) : undefined);
  if (zoomLines.length) lines(svg, 'zoom-flag', PADX, axisY + 56, zoomLines, 17);

  // entries
  const rows = bands.flatMap((b) => b.rows);
  const g = svg
    .append('g')
    .selectAll('g')
    .data(rows)
    .join('g')
    .attr('class', 'mark')
    .attr('role', 'button')
    .attr('data-id', (d) => d.e.id)
    .attr('data-t', (d) => +parse(d.e.start))
    .attr('aria-label', (d) => {
      const e = d.e,
        when = d.point ? fmt(parse(e.start)) : `${fmtY(parse(e.start))} to ${e.end ? fmtY(parse(e.end)) : 'now, still going'}`;
      return `${e.actor}: ${e.target_system}. ${when}. Attribution: ${ATTRIBUTION_LABEL[e.attribution]}.${hasScene(e) ? ' Opens the 3D explainer.' : ''}`;
    });
  g.each(function (d) {
    const s = d3.select(this),
      e = d.e,
      lw = Math.max(...d.lines.map((ln) => tw(ln, FS, 400))) + 6,
      lh = d.lines.length * LH,
      ty = d.mode === 'above' ? d.top + 12 + 13 : d.y - ((d.lines.length - 1) * LH) / 2 + 4.6;
    // where the text sits, so a plate in the band's colour can hide any line that passes behind it
    const lx0 = d.anchor === 'end' ? d.tx - lw : d.tx - 3,
      ly0 = ty - 14;
    s.append('rect')
      .attr('class', 'plate')
      .attr('x', lx0 - 3)
      .attr('y', ly0 - 1)
      .attr('width', lw + 6)
      .attr('height', lh + 2)
      .attr('rx', 4);
    // hit area: the label, the mark and the cube are one target
    const hx0 = d.mode === 'above' ? L + 6 : d.mode === 'left' ? lx0 - d.cube - 6 : d.markL - 10,
      hx1 = d.mode === 'above' ? R - 6 : d.mode === 'left' ? d.markR + 10 : Math.min(R - 4, lx0 + lw + 8);
    const hit = (cls) =>
      s
        .append('rect')
        .attr('class', cls)
        .attr('x', hx0)
        .attr('y', d.top + 2)
        .attr('width', hx1 - hx0)
        .attr('height', d.h - 4)
        .attr('rx', 8);
    if (!EXPORTING) hit('rowhl hit');
    // the mark
    glyph(
      s,
      d.point ? circlePath(d.X0, d.y, MARK_R) : barPath(d.X0, d.X1, d.y, barH, d.ongoing ? 9 : 0),
      d.color,
      d.style,
      d.point ? 'pt' : 'bar',
      'var(--band)',
    );
    // the 3D cube sits next to the mark: between label and mark on desktop; on phones left of the mark, or right of it near the band's edge
    if (hasScene(e)) {
      const left = d.markL - 15,
        cx = d.mode === 'left' ? left : d.mode === 'right' ? d.markR + 15 : left > L + 22 ? left : d.markR + 15;
      badge(s, cx, d.y);
      s.select('.badge3d').attr('transform', `translate(${cx},${d.y}) scale(1.15)`);
    }
    // the label: actor in semibold, then what was targeted
    const t = s.append('text').attr('class', 'lbl').attr('x', d.tx).attr('y', ty).attr('text-anchor', d.anchor).attr('stroke-linejoin', 'round');
    d.lines.forEach((ln, i) => {
      const tl = t
        .append('tspan')
        .attr('x', d.tx)
        .attr('dy', i ? LH : 0);
      if (i === 0) {
        tl.append('tspan').attr('class', 'who').text(`${d.who}:`);
        tl.append('tspan').text(ln.slice(d.who.length + 1));
      } else tl.text(ln);
    });
    if (!EXPORTING) hit('hit');
  });
  // Full view: the left of the chart is empty, so the earliest entry says so, with a dotted leader to its label.
  if (!phone && !zoom) {
    const first = rows.reduce((a, b) => (b.e.start < a.e.start ? b : a)),
      txt = 'No earlier entries in our records',
      tW = tw(txt, FS, 400),
      labelX = first.tx - Math.max(...first.lines.map((ln) => tw(ln, FS, 400))) - 12;
    if (first.mode === 'left' && INSET + tW + 40 < labelX) {
      const fg = svg.append('g').attr('class', 'first-note').attr('aria-hidden', 'true');
      fg.append('text')
        .attr('x', INSET)
        .attr('y', first.y + 4.6)
        .text(txt);
      fg.append('line')
        .attr('x1', INSET + tW + 12)
        .attr('x2', labelX)
        .attr('y1', first.y)
        .attr('y2', first.y)
        .attr('stroke-linecap', 'round');
    }
  }
  bindMark(
    g,
    (d) => nkCard(d.e),
    (d, elx, ev) => activate(d.e, elx, ev),
  );
  rove(g);
  addGuide(svg, x, bands[0].y0, axisY);
  if (EXPORTING) return;

  // ---------------------------------------------------------------- note, key and data table
  document.getElementById('noteC').innerHTML = zoom ? zoomNote('1995 to 2026', stateC.focus === null) : fullNote();
  document.getElementById('cFocus').setAttribute('aria-pressed', zoom);
  document.getElementById('cFull').setAttribute('aria-pressed', !zoom);
  const ink = (shape) => shape.replace('{p}', 'style="fill:var(--muted);stroke:var(--muted);stroke-width:1.5"'),
    cube =
      '<g class="badge3d" transform="scale(1.15)"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>';
  setKey(
    'legendC',
    keyMarkup([
      {
        head: 'Attribution',
        items: [
          [swatch.solid(bar()), 'Governments or an international body', 26],
          [swatch.outline(bar()), 'Researchers or open-source analysts', 26],
          [swatch.dashed(bar()), 'Alleged, not confirmed', 26],
        ],
      },
      {
        head: 'Shape',
        items: [
          [ink(bar()), 'Campaign', 26],
          [ink(dot(6)), 'Single event', 18],
          [ink(bar(-12, 4, 12, 9)), 'Still going', 26],
          [cube, '3D explainer', 18],
        ],
      },
    ]),
  );
  table(
    'tableC',
    ['Start', 'End', 'Actor', 'Type', 'Attribution', 'Target', 'Setting', 'How sure we are', 'Source'],
    NK.map((e) => [
      e.start === e.end ? fmt(parse(e.start)) : fmtMY(parse(e.start)),
      e.end === e.start ? 'Single event' : e.end ? fmtMY(parse(e.end)) : 'Ongoing',
      e.actor,
      CATEGORY_LABEL[e.category],
      ATTRIBUTION_LABEL[e.attribution],
      `${e.target_system} · ${TARGET_LABEL[e.target_regime]}`,
      e.operational_use ? 'In a conflict' : 'A test, a demonstration or peacetime',
      SURE_WORD[e.confidence],
      srcCell(e),
    ]),
    'Jamming, laser and cyber operations against satellites, one line per entry or campaign',
  );
}
document.getElementById('cFocus').onclick = () => {
  stateC.focus = true;
  drawC();
};
document.getElementById('cFull').onclick = () => {
  stateC.focus = false;
  drawC();
};
