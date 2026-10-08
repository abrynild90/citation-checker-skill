// ============================================================================
// charts/lag.js: how long the law took to follow: the time from a capability to the next legal step our records link to it (order in time, not cause).
// Provides: drawL().
// ============================================================================
// Pairs come from data/lag_pairs.json (embedded as D.lag_pairs): pairs first, then open rings. Dropped pairs are never drawn.
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { D, EXPORTING, byId, esc, fmt, fmtMY, hasScene, isPhoneNow, parse, tw } from '../app.js';
import { glyphMarkup, legalGlyph } from './legal.js';
import { bindMark, hideCard, hint3d, legalKindWords, legend, openCard, rove, table } from '../ui.js';
import { hooks } from '../shared.js';
const LAG = [...D.lag_pairs.pairs.map((p) => ({ cap: p.event, law: p.law })), ...D.lag_pairs.open.map((p) => ({ cap: p.event, law: null }))];
// The two ends of each pair in a few plain words, and what the reader should know about the pair beyond the dates.
export const WORDS = {
  'us-1962-starfish-prime': {
    name: 'Starfish Prime nuclear test',
    note: 'The treaty followed the test. It is not presented as a direct response.',
  },
  'kp-2010-gps': {
    name: 'North Korean jamming of satellite navigation',
    note: 'SWF also ties this finding to the Baltic case.',
  },
  'in-2019-shakti': {
    name: 'India’s Shakti destructive test',
    note: 'The resolution is a call not to conduct destructive direct-ascent anti-satellite tests. It is not binding.',
  },
  'ru-2021-cosmos1408': {
    name: 'Russia’s Cosmos 1408 destructive test',
    note: 'The pledge is a commitment by the United States alone.',
  },
  'ru-2023-baltic': { name: 'Interference with satellite navigation in the Baltic region' },
  'ru-2024-eu-sats': { name: 'Jamming of European satellites' },
  'us-1997-miracl': { name: 'Laser fired at a satellite' },
  'ru-2022-viasat': {
    name: 'Viasat cyberattack',
    note: 'The only related legal item, the Tallinn Manual 2.0 (2017), is soft law and came before the attack.',
  },
};
export const LAW_WORDS = {
  'ltbt-1963': 'Limited Test Ban Treaty',
  'icao-2025': 'ICAO Assembly finding',
  'unga-77-41': 'UN General Assembly resolution 77/41',
  'us-moratorium-2022': 'US moratorium on destructive tests',
  'itu-rrb-2024': 'ITU Radio Regulations Board: grave concern',
};
const NONE = 'No later legal step in our records';
const capDate = (r) => parse(r.date || r.start);
const HEX = 'M0,-8L6.9,-4L6.9,4L0,8L-6.9,4L-6.9,-4Z';
const GROUND = 'var(--ground)';
const hexMarkup = (c) => `<path d="${HEX}" transform="scale(1.2)" style="fill:${c};stroke:${GROUND};stroke-width:3;paint-order:stroke;stroke-linejoin:round"/>`;
const ringMarkup = () =>
  `<circle r="7" style="fill:${GROUND};stroke:${GROUND};stroke-width:5.6"/><circle r="7" style="fill:${GROUND};stroke:var(--accent);stroke-width:2.4"/>`;
const catColor = (c) => (c.domain === 'kinetic' ? 'var(--cat-da)' : 'var(--cat-ew)');
// The elapsed time as a number and a unit: months under a year, years with one decimal after that.
export function gap(years) {
  if (years < 1) {
    const n = Math.round(years * 12);
    return { num: String(n), unit: n === 1 ? 'month' : 'months' };
  }
  return { num: years.toFixed(1), unit: 'years' };
}
export const yearsBetween = (a, b) => (b - a) / (365.25 * 864e5);
// Title line as runs of text (names in the strong weight, dates and the arrow quiet), wrapped to a width.
function wrapRuns(runs, maxW, size) {
  const lines = [[]];
  let w = 0;
  runs.forEach((r) => {
    r.t.split(/(?<=\s)/).forEach((word) => {
      const ww = tw(word, size, r.strong ? 600 : 400);
      if (w + ww > maxW && w > 0 && word.trim()) {
        lines.push([]);
        w = 0;
        word = word.trimStart();
      }
      const line = lines.at(-1);
      if (line.length && line.at(-1).strong === r.strong && line.at(-1).quiet === r.quiet) line.at(-1).t += word;
      else line.push({ ...r, t: word });
      w += tw(word, size, r.strong ? 600 : 400);
    });
  });
  return lines.map((l) => ({ runs: l, w: l.reduce((s, r) => s + tw(r.t, size, r.strong ? 600 : 400), 0) }));
}
const dateWords = (c) => (c.end === null && c.start ? `from ${fmtMY(capDate(c))}` : fmtMY(capDate(c)));
function pairInfo(p) {
  const c = byId[p.cap],
    l = p.law ? byId[p.law] : null,
    w = WORDS[p.cap] ?? { name: c.system },
    a = capDate(c),
    years = l ? yearsBetween(a, parse(l.start)) : null;
  return { p, c, l, w, a, years, g: l ? gap(years) : null, lawName: l ? (LAW_WORDS[l.id] ?? l.title) : null };
}
// The card for a row: the pair, the time between, the two dates and where each comes from.
const lagCard = (p) => {
  const { c, l, w, g, lawName } = pairInfo(p);
  const scene = c.scene_3d && hasScene(c) ? c : l && hasScene(l) ? l : null;
  return (
    `<p class="card-title">${esc(w.name)}</p>` +
    `<p class="when">${l ? `${g.num} ${g.unit} until the ${esc(lawName)}` : NONE}</p>` +
    `<dl><dt>Capability</dt><dd>${c.end === null && c.start ? 'From ' : ''}${fmt(capDate(c))}</dd><dt>Legal step</dt><dd>${l ? `${fmt(parse(l.start))} · ${legalKindWords(l)}` : 'None linked in our records'}</dd></dl>` +
    `${w.note ? `<p class="note">${esc(w.note)}</p>` : ''}` +
    `<div class="src">Source for the capability: ${esc(c.source)}, ${esc(c.pin)}</div>` +
    `${scene ? hint3d() : ''}`
  );
};
// Every row shares one scale from 0 to 16 years, so a longer bar is a longer wait. The longest pair in our records is 15.1 years.
const MAX_YEARS = 16;
export function drawL(el = document.getElementById('svgL')) {
  el.innerHTML = '';
  const phone = isPhoneNow(),
    W = Math.max(300, el.clientWidth),
    PAD = phone ? 8 : 12,
    ROOM = 12, // right of the 16 year mark; a number that does not fit beyond its bar is set on the bar instead
    x = d3
      .scaleLinear()
      .domain([0, MAX_YEARS])
      .range([PAD + 26, W - PAD - ROOM]);
  const TS = 13, // title size
    NS = 13, // note size
    TL = 19, // title line height
    NL = 17;
  const info = LAG.map(pairInfo);
  // The symbols are explained on the chart itself, in rows that wrap to the width.
  // (on a phone the names are shorter and sit in two columns)
  const KEY = [
    [hexMarkup('var(--cat-da)'), phone ? 'Physical attack' : 'Physical attack, such as a missile test'],
    [hexMarkup('var(--cat-ew)'), phone ? 'Jamming, laser or cyber' : 'Jamming, laser or cyber operation'],
    [glyphMarkup('treaty'), 'Treaty (binding)'],
    [glyphMarkup('resolution'), phone ? 'Resolution (not binding)' : 'Resolution or finding (not binding)'],
    [glyphMarkup('unilateral'), 'Pledge by one country'],
  ];
  let kx = PAD,
    ky = 14;
  const keyAt = KEY.map(([m, label], i) => {
    const wd = 24 + tw(label, 13, 500) + 20;
    if (phone) {
      const at = { m, label, x: PAD + (i % 2) * Math.round((W - 2 * PAD) * 0.46), y: 14 + Math.floor(i / 2) * 24 };
      ky = at.y;
      return at;
    }
    if (kx > PAD && kx + wd > W - PAD) {
      kx = PAD;
      ky += 24;
    }
    const at = { m, label, x: kx, y: ky };
    kx += wd;
    return at;
  });
  const top = EXPORTING ? 6 : ky + 26 + 24; // the page repeats the years scale above the first row (24 px)
  // Geometry of each row: the words first, then a track from 0 to 16 years with the bar on it.
  info.forEach((r) => {
    const runs = [
      { t: r.w.name, strong: true },
      { t: `, ${dateWords(r.c)}`, quiet: true },
      { t: '  →  ', quiet: true },
      r.l ? { t: r.lawName, strong: true } : { t: NONE, strong: true },
      ...(r.l ? [{ t: `, ${fmtMY(parse(r.l.start))}`, quiet: true }] : []),
    ];
    r.title = wrapRuns(runs, W - 2 * PAD, TS);
    r.note = r.w.note ? wrapRuns([{ t: r.w.note, quiet: true }], W - 2 * PAD, NS) : [];
    r.block = 10 + TL * r.title.length + (r.note.length ? 4 + NL * r.note.length : 0);
    r.rowH = r.block + 24 + 22 + 16;
  });
  const H = top + info.reduce((s, r) => s + r.rowH, 0) + 46,
    yAx = H - 38;
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hL')
    .attr('id', 'svgL-root');
  svg
    .append('desc')
    .text(
      'One line for each pair, all on the same scale from 0 to 16 years. A hexagon shows the weapon or attack and a second symbol shows the later legal step: ' +
        'a circle for a treaty, a square for a resolution or body finding, a triangle for a unilateral pledge. The length of the bar is the time that ' +
        'passed, with the number of years or months at its end. It shows the order of events and says nothing about cause. An open ring means our ' +
        'records link no later legal step to the capability.',
    );
  if (!EXPORTING)
    keyAt.forEach((k) => {
      const g = svg.append('g').attr('class', 'lag-key').attr('aria-hidden', 'true').attr('transform', `translate(${k.x},${k.y})`);
      g.append('g').attr('transform', 'translate(8,0)').append('g').attr('class', 'glyph').html(k.m);
      g.append('text').attr('x', 22).attr('y', 4.5).text(k.label);
    });
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(0,${yAx})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(d3.range(0, MAX_YEARS + 1, phone ? 4 : 2))
        .tickSize(-(yAx - top))
        .tickFormat(''),
    );
  svg
    .append('g')
    .attr('class', 'axis xaxis')
    .attr('transform', `translate(0,${yAx})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(d3.range(0, MAX_YEARS + 1, phone ? 4 : 2))
        .tickFormat((d) => d)
        .tickSizeOuter(0),
    );
  if (!EXPORTING)
    svg
      .append('g')
      .attr('class', 'axis xaxis top-axis')
      .attr('aria-hidden', 'true')
      .attr('transform', `translate(0,${top - 8})`)
      .call(
        d3
          .axisTop(x)
          .tickValues(d3.range(0, MAX_YEARS + 1, phone ? 4 : 2))
          .tickFormat((d) => (d === 0 ? '0 years' : d))
          .tickSizeOuter(0),
      );
  svg
    .append('text')
    .attr('class', 'axis-title')
    .attr('x', x(0))
    .attr('y', yAx + 34)
    .text(phone ? 'Years until the later legal step' : 'Years between the weapon or attack and the later legal step');
  let y0 = top;
  const rows = [];
  info.forEach((r, i) => {
    const { p, c, l, w, years, g } = r;
    const col = catColor(c),
      yy = y0 + r.block + 24,
      xe = l ? Math.max(x(0) + 26, x(Math.min(years, MAX_YEARS))) : x(0);
    const say = l ? `${g.num} ${g.unit}` : NONE;
    const row = svg
      .append('g')
      .attr('class', 'mark lagrow')
      .attr('tabindex', 0)
      .attr('role', 'img')
      .attr('data-t', +r.a)
      .attr(
        'aria-label',
        `${w.name}, ${dateWords(c)}, then ${l ? r.lawName + ', ' + fmtMY(parse(l.start)) + '. ' + say + ' between the two' : NONE.toLowerCase()}.${w.note ? ' ' + w.note : ''}`,
      );
    row
      .append('rect')
      .attr('class', 'hit')
      .attr('x', 0)
      .attr('y', y0)
      .attr('width', W)
      .attr('height', r.rowH - 8)
      .attr('rx', 10);
    r.title.forEach((line, k) => {
      const t = row
        .append('text')
        .attr('class', 'lag-title')
        .attr('x', PAD)
        .attr('y', y0 + 10 + TL * (k + 1) - 5);
      line.runs.forEach((run) =>
        t
          .append('tspan')
          .attr('class', run.strong ? 'strong' : 'quiet')
          .text(run.t),
      );
    });
    r.note.forEach((line, k) => {
      row
        .append('text')
        .attr('class', 'lag-note')
        .attr('x', PAD)
        .attr('y', y0 + 10 + TL * r.title.length + 4 + NL * (k + 1) - 4)
        .text(line.runs.map((q) => q.t).join(''));
    });
    // the track (0 to 16 years), then the bar from the weapon (left) to the legal step
    row.append('line').attr('class', 'lag-track').attr('x1', x(0)).attr('x2', x(MAX_YEARS)).attr('y1', yy).attr('y2', yy);
    if (l) row.append('line').attr('class', 'lag-bar').attr('x1', x(0)).attr('x2', xe).attr('y1', yy).attr('y2', yy).style('stroke', col);
    row
      .append('g')
      .attr('transform', `translate(${x(0) - 18},${yy})`)
      .append('g')
      .attr('class', 'glyph')
      .html(hexMarkup(col));
    if (l) legalGlyph(row.append('g').attr('transform', `translate(${xe},${yy}) scale(1.1)`), l);
    else
      row
        .append('g')
        .attr('transform', `translate(${x(0) + 12},${yy})`)
        .append('g')
        .attr('class', 'glyph')
        .html(ringMarkup());
    // the elapsed time at the end of the bar: the largest figure in the row
    const figW = l ? tw(g.num, 22, 600) + 4 + tw(g.unit, 13, 600) : 0,
      flip = l && xe + (phone ? 20 : 16) + figW > W - PAD;
    const t = row
      .append('text')
      .attr('class', 'lag-fig')
      .attr('x', l ? (flip ? xe + 8 : xe + (phone ? 20 : 16)) : x(0) + 34)
      .attr('y', flip ? yy + 29 : yy + 8)
      .style('text-anchor', flip ? 'end' : null);
    if (l) {
      t.append('tspan').attr('class', 'num').text(g.num);
      t.append('tspan').attr('class', 'unit').attr('dx', 4).text(g.unit);
    } else t.append('tspan').attr('class', 'unit').text('None linked');
    if (i < info.length - 1)
      svg
        .append('line')
        .attr('class', 'lag-rule')
        .attr('x1', 0)
        .attr('x2', W)
        .attr('y1', y0 + r.rowH - 4)
        .attr('y2', y0 + r.rowH - 4);
    rows.push([
      w.name,
      c.end === null && c.start ? `From ${fmt(capDate(c))}` : fmt(capDate(c)),
      l ? r.lawName : '—',
      l ? fmt(parse(l.start)) : '—',
      l ? legalKindWords(l) : '—',
      l ? `${g.num} ${g.unit}` : '—',
      `${c.id}${l ? ' → ' + l.id : ''}`,
    ]);
    row.datum(p);
    y0 += r.rowH;
  });
  const marks = svg.selectAll('.lagrow');
  bindMark(marks, lagCard, (p, node, ev) => {
    const c = byId[p.cap],
      l = p.law ? byId[p.law] : null,
      s = c.scene_3d && hasScene(c) ? c : l && hasScene(l) ? l : null;
    if (s) {
      hideCard();
      hooks.openScene(s.scene_3d, node);
    } else
      openCard(
        '<div class="ack-line"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>Details shown. No 3D explainer for this item.</div>' +
          lagCard(p),
        ev,
        node,
      );
  });
  rove(marks);
  if (EXPORTING) return;
  // ---- key
  const K = legend('legendL', 22, 18),
    li = K.item;
  K.group('No later step');
  li(ringMarkup(), 'Open ring: our records link no later legal step to it. This does not mean that no rule applies.');
  K.done();
  // The last column holds the record ids of the pair. It is hidden from readers and kept only for tools/qa.mjs, which checks the pairs against the data.
  table('tableL', ['Capability', 'Capability date', 'Later legal step', 'Legal step date', 'Kind of legal step', 'Time between', ''], rows, undefined, true);
}
