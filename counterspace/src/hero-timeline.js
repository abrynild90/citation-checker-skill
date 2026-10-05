// ============================================================================
// hero-timeline.js: the first screen as the thesis. One picture of the whole history on the page's shared years: what states did in orbit, rising from the
// Earth's limb (height on a log scale), and the laws and policies as ticks on the ground. It plays once (a time marker sweeps left to right and each event
// rises at its year) and then stays as the final picture. Provides: mountHero(). Needs the data and text measurement from app.js.
// ============================================================================
import { DOMAIN, KIN, LAST_DA, LEGAL, REDUCED, fmtMonthYear, fmtY, parse, star, tw, wrap } from './app.js';
import { KIND_PLAIN } from './ui.js';
import { earthSource, loadEmbeddedEarth } from './scenes/earth.js';

const NS = 'http://www.w3.org/2000/svg',
  EASE = 'cubic-bezier(.16,1,.3,1)',
  SWEEP_MS = 5000,
  RISE_MS = 650,
  ALT_MIN = 10, // km: the Earth's edge
  ALT_MAX = 70000,
  LEO = [160, 2000],
  MEO = 20200,
  GEO = 35786,
  LINE = 19; // px between rows of ground labels
// Ground labels for the laws that get a name on the picture (every law gets a tick). The phone wording is shorter; null leaves it out there.
const LAW_NAMES = {
  'ltbt-1963': {
    text: 'Limited Test Ban Treaty, 1963',
    phone: 'Limited Test Ban Treaty',
    more: 'The earliest law here. It bans nuclear tests in space.',
    row: 1,
    prow: 1,
  },
  'ost-1967': { text: 'Outer Space Treaty, 1967', phone: null },
  'itu-1992': { text: 'ITU Constitution, Articles 45 and 48, 1992', phone: null },
  'tallinn-2017': { text: 'Tallinn Manual 2.0 (soft law), 2017', phone: null, end: true },
  'unga-77-41': { text: 'UN General Assembly resolution 77/41, 2022', phone: 'UN resolution 77/41, 2022', row: 1 },
};
const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
};
const text = (parent, attrs, str) => {
  const t = el('text', attrs, parent);
  t.textContent = str;
  return t;
};
const hits = (a, b, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
const STILL = REDUCED || /[?&]still\b/.test(location.search);

let drawn = null, // the current drawing, kept for the replay and for the Earth photograph that arrives later
  anims = [];

export function mountHero(fontsReady) {
  const stage = document.getElementById('heroPic'),
    replay = document.getElementById('heroReplay');
  if (!stage) return;
  // The id the page's tools and the audit know the picture by is set now, not in the HTML: the Earth-image prefetch hook in scenes/earth.js looks for
  // #heroStage when it loads and would start a 1.5 MB download on a mere mouse-over of this picture.
  stage.id = 'heroStage';
  replay.hidden = STILL;
  writeText(stage);
  let lastW = 0;
  const draw = (animate) => {
    lastW = stage.clientWidth;
    stopAnims();
    drawn = build(stage);
    loadEmbeddedEarth().then((ok) => ok && drawn && paintEarth(drawn));
    if (animate && !STILL) play();
  };
  fontsReady.then(() => draw(scrollY < innerHeight * 0.4)); // a deep link lands further down: the picture is finished before anyone sees it
  replay.addEventListener('click', () => {
    stopAnims();
    play();
  });
  let rz = 0;
  addEventListener('resize', () => {
    if (stage.clientWidth === lastW) return;
    clearTimeout(rz);
    rz = setTimeout(() => draw(false), 150);
  });
  addEventListener('beforeprint', stopAnims);
}

// ---------------------------------------------------------------- words for screen readers
function writeText(stage) {
  const withAlt = KIN.filter((e) => e.altitude_km != null),
    first = [...KIN].sort((a, b) => (a.date < b.date ? -1 : 1))[0],
    top = KIN.filter((e) => e.type === 'destructive').sort((a, b) => b.altitude_km - a.altitude_km)[0],
    fmt = d3.utcFormat('%-d %B %Y');
  stage.setAttribute(
    'aria-label',
    `A picture of anti-satellite tests and other tests in orbit, 1957 to 2026. Each is placed by year, left to right, and by height above the Earth's ` +
      `edge, on a scale that squeezes the high orbits. The first test in our records is from ${fmtY(parse(first.date))}. The highest test that destroyed a satellite ` +
      `reached ${top.altitude_km} km, in ${fmtY(parse(top.date))}. The last was in ${fmtMonthYear(parse(LAST_DA))}. Laws and policies stand as ticks on the ground at their ` +
      `own years, beginning with the Limited Test Ban Treaty in 1963. The charts below let you select each event with a keyboard.`,
  );
  const items = [...withAlt]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((e) => `<li>${fmt(parse(e.date))}: ${e.system}, ${e.state}, ${e.altitude_km} km. ${KIND_PLAIN[e.type]}.</li>`)
    .join('');
  const laws = [...LEGAL]
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .map((l) => `<li>${fmt(parse(l.start))}: ${l.label}</li>`)
    .join('');
  document.getElementById('heroAlt').innerHTML =
    `<p>Tests with a reported altitude, in date order. Tests with no reported altitude are not drawn here.</p><ul>${items}</ul>` +
    `<p>Laws and policies, in date order.</p><ul>${laws}</ul>`;
}

// ---------------------------------------------------------------- the drawing
function build(stage) {
  stage.querySelector('svg')?.remove();
  const W = Math.round(stage.clientWidth),
    H = Math.round(stage.clientHeight),
    phone = W < 640,
    wide = W >= 900,
    gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 24,
    edge = wide ? Math.max(gutter, (W - 1240) / 2 + gutter) : gutter,
    groundH = phone ? 150 : 190,
    sag = phone ? 8 : Math.round(Math.min(30, W * 0.02)),
    yL = H - groundH, // the limb at the middle of the picture
    bandTop = yL + sag + (phone ? 8 : 14),
    x = d3
      .scaleUtc()
      .domain(DOMAIN)
      .range([edge, W - edge]),
    limbY = (px) => yL + sag * ((2 * px) / W - 1) ** 2;
  // The words sit in the empty sky at the upper left. The height scale is chosen so the marks of the first decades stay clear below them.
  const rect = stage.getBoundingClientRect(),
    words = wide
      ? ['.hero-title', '.hero-text .lede', '.hero-text .cta'].map((s) => {
          const node = document.querySelector(s),
            r = node.getBoundingClientRect();
          let dy = 0; // the words rise into place when the page opens: measure them where they will rest, not where they are now
          for (let n = node; n && n !== document.body; n = n.parentElement) {
            const t = getComputedStyle(n).transform;
            if (t && t !== 'none') dy += new DOMMatrix(t).m42;
          }
          return { x0: r.left - rect.left - 14, y0: r.top - dy - rect.top - 8, x1: r.right - rect.left + 14, y1: r.bottom - dy - rect.top + 10 };
        })
      : [],
    wordsBottom = words.length ? Math.max(...words.map((b) => b.y1)) : 0,
    pxDec = wide ? Math.min(118, (yL - wordsBottom - 24) / Math.log10(1600 / ALT_MIN)) : (yL - 30) / Math.log10(ALT_MAX / ALT_MIN),
    yAlt = (a, px) => limbY(px) - pxDec * Math.log10(a / ALT_MIN),
    steps = d3.range(0, W + 1, 24).concat(W);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true', focusable: 'false' }),
    defs = el('defs', {}, svg),
    limbPath =
      'M' +
      d3
        .range(0, W + 1, 12)
        .concat(W)
        .map((px) => `${px},${limbY(px).toFixed(1)}`)
        .join('L'),
    S = { svg, W, H, yL, groundH, sag, limbY, tracks: [], earthImg: null };
  el('clipPath', { id: 'htEarthClip' }, defs).appendChild(el('path', { d: `${limbPath}L${W},${H}L0,${H}Z` }));

  // ---- the Earth: a flat dark ground until the photograph is drawn, and its thin atmosphere line
  const earth = el('g', { 'clip-path': 'url(#htEarthClip)' }, svg);
  el('rect', { x: 0, y: yL - 2, width: W, height: groundH + 2, fill: '#0a1730' }, earth);
  S.earthImg = el('image', { x: 0, y: yL, width: W, height: groundH, preserveAspectRatio: 'none' }, earth);
  el('path', { d: limbPath, class: 'ht-limb' }, svg);

  // ---- orbit zones: one quiet band and two thin lines, drawn along the same curve as the limb
  const curve = (a) => 'M' + steps.map((px) => `${px},${yAlt(a, px).toFixed(1)}`).join('L');
  el(
    'path',
    {
      d: `${curve(LEO[1])}L${[...steps]
        .reverse()
        .map((px) => `${px},${yAlt(LEO[0], px).toFixed(1)}`)
        .join('L')}Z`,
      class: 'ht-band-leo',
    },
    svg,
  );
  [LEO[1], MEO, GEO].forEach((a) => el('path', { d: curve(a), class: 'ht-band-line' }, svg));

  // ---- decade lines from the limb up, labelled on the ground
  const decades = d3.utcYear
    .every(10)
    .range(DOMAIN[0], DOMAIN[1])
    .filter((d) => d.getUTCFullYear() % (phone ? 20 : 10) === 0);
  decades.forEach((d) => el('line', { x1: x(d), x2: x(d), y1: limbY(x(d)), y2: 14, class: 'ht-year' }, svg));

  // ---- the flat dark band the ground labels stand on: a fixed, quiet ground for words over the photograph
  el('rect', { x: 0, y: bandTop, width: W, height: H - bandTop, fill: 'rgba(5,8,19,.8)' }, svg);
  el('line', { x1: 0, x2: W, y1: bandTop, y2: bandTop, stroke: 'rgba(150,175,230,.24)' }, svg);
  decades.forEach((d) => text(svg, { x: x(d), y: bandTop + 19, class: 'ht-year-t' }, d.getUTCFullYear()));

  // ---- events
  const obstacles = [...words],
    marks = [],
    pts = el('g', {}, svg);
  KIN.filter((e) => e.altitude_km != null).forEach((e) => {
    const px = x(parse(e.date)),
      py = yAlt(e.altitude_km, px),
      inner = el('g', {}, el('g', { transform: `translate(${px.toFixed(1)},${py.toFixed(1)})` }, pts)),
      r = e.type === 'nuclear' ? 11 : e.type === 'destructive' ? 7.5 : 5.5;
    if (e.type === 'nuclear') el('path', { d: star(11), class: 'ht-ev' }, inner);
    else el('circle', { r, class: e.type === 'destructive' ? 'ht-ev' : 'ht-ev ring' }, inner);
    marks.push({ e, px, py, r });
    obstacles.push({ x0: px - r - 3, x1: px + r + 3, y0: py - r - 3, y1: py + r + 3 });
    S.tracks.push({
      node: inner,
      at: e.date,
      lead: 350,
      dur: RISE_MS,
      keys: [
        { opacity: 0, transform: `translateY(${(yL - py).toFixed(0)}px)` },
        { opacity: 1, transform: 'none' },
      ],
    });
  });

  // ---- annotations (plain sentences, a leader and a dot on the mark) and one small tag for the nuclear test
  const noteSize = phone ? 13 : 14,
    noteW = phone ? Math.min(190, W - 2 * gutter - 8) : W < 900 ? Math.round(Math.max(176, W * 0.21)) : W < 1100 ? Math.round(Math.max(140, W * 0.15)) : Math.round(Math.min(250, Math.max(190, W * 0.2))),
    placed = [],
    // what a candidate spot costs: overlapping the words is worst, then another note, then a mark; zero means free
    clash = (box, lead) =>
      obstacles.reduce((n, o, i) => n + (hits(box, o, 4) || (lead && hits(lead, o, 1)) ? (i < words.length ? 80 : 14) : 0), 0) +
      placed.reduce((n, p) => n + (hits(box, p.box, 4) || hits(box, p.lead, 4) || (lead && (hits(lead, p.box, 1) || hits(lead, p.lead, 1))) ? 8 : 0), 0),
    markOf = (id) => marks.find((m) => m.e.id === id),
    sorted = [...KIN].sort((a, b) => (a.date < b.date ? -1 : 1)),
    topD = KIN.filter((e) => e.type === 'destructive').sort((a, b) => b.altitude_km - a.altitude_km)[0],
    lastD = KIN.find((e) => e.date === LAST_DA && e.type === 'destructive'),
    firstM = markOf('us-1959-bold-orion') || markOf(sorted.find((e) => e.altitude_km != null).id),
    nuke = marks.find((m) => m.e.type === 'nuclear'),
    specs = [
      {
        m: firstM,
        t: `${fmtY(parse(sorted[0].date))}: the first tests in our records, by the United States.`,
        order: ['down-start', 'up-start', 'right'],
        phone: false,
      },
      {
        m: markOf(topD.id),
        t: phone
          ? `${fmtY(parse(topD.date))}: China destroyed Fengyun-1C at ${topD.altitude_km} km, the highest such test.`
          : `${fmtY(parse(topD.date))}: China destroyed its Fengyun-1C satellite at ${topD.altitude_km} km, the highest test of that kind.`,
        order: ['left', 'up-end', 'up-start', 'down-end'],
        phone: true,
      },
      {
        m: markOf(lastD.id),
        t: phone
          ? `${fmtMonthYear(parse(lastD.date))}: Russia destroyed Cosmos 1408 at ${lastD.altitude_km} km, the last such test.`
          : `${fmtMonthYear(parse(lastD.date))}: Russia destroyed its Cosmos 1408 satellite at ${lastD.altitude_km} km, the last such test.`,
        order: ['up-end', 'down-end', 'left'],
        phone: true,
      },
    ]
      .filter((s) => !phone || s.phone)
      .filter((s) => W >= 1100 || phone || s.m !== markOf(topD.id)); // tablet widths: two crowded notes (2007 and 2021) collide, the chapter below carries the 2007 note
  const boxFor = (dir, al, m, L, w, h) => {
    const { px, py } = m;
    if (dir === 'up')
      return [
        { x0: al === 'end' ? px + 6 - w : px - 6, x1: al === 'end' ? px + 6 : px - 6 + w, y0: py - L - h - 2, y1: py - L },
        { x0: px - 1, x1: px + 1, y0: py - L, y1: py - 12 },
      ];
    if (dir === 'down')
      return [
        { x0: al === 'end' ? px + 6 - w : px - 6, x1: al === 'end' ? px + 6 : px - 6 + w, y0: py + L, y1: py + L + h + 2 },
        { x0: px - 1, x1: px + 1, y0: py + 12, y1: py + L },
      ];
    if (dir === 'left')
      return [
        { x0: px - L - 8 - w, x1: px - L - 8, y0: py - h / 2, y1: py + h / 2 },
        { x0: px - L - 8, x1: px - 12, y0: py - 1, y1: py + 1 },
      ];
    return [
      { x0: px + L + 8, x1: px + L + 8 + w, y0: py - h / 2, y1: py + h / 2 },
      { x0: px + 12, x1: px + L + 8, y0: py - 1, y1: py + 1 },
    ];
  };
  const inside = (b) => b.x0 >= edge - 4 && b.x1 <= W - edge + 4 && b.y0 >= 6 && b.y1 <= yL - 24;
  // ---- zone names, as close to the right edge (the left on a phone) as the marks and notes allow; a phone gives them the first choice of room
  const zones = [
    { ts: ['Low Earth orbit (up to 2,000 km)', 'Low Earth orbit'], a: LEO[1], order: ['above', 'below'] },
    { ts: ['Medium Earth orbit (GPS)'], a: MEO, order: phone ? ['below', 'above'] : ['above', 'below'] },
    { ts: ['Geostationary orbit (35,786 km)', 'Geostationary orbit'], a: GEO, order: ['above', 'below'] },
  ];
  // The longer wording is tried everywhere before the shorter one; a phone starts with the short one.
  const placeZones = () =>
    zones.forEach((z) => {
      for (const t of phone ? [...z.ts].reverse() : z.ts) {
        const w = tw(t, 12.5, 500);
        for (let shift = 0; shift < W; shift += 12)
          for (const where of z.order) {
            const px = phone ? edge + shift : W - edge - shift,
              yy = yAlt(z.a, px),
              base = where === 'above' ? yy - 7 : yy + 18,
              box = { x0: phone ? px : px - w, x1: phone ? px + w : px, y0: base - 13, y1: base + 3 };
            if (!inside(box) || clash(box)) continue;
            text(svg, { x: px, y: base, class: 'ht-zone', 'text-anchor': phone ? 'start' : 'end' }, t);
            placed.push({ box, lead: { x0: 0, x1: 0, y0: 0, y1: 0 } });
            return;
          }
      }
    });

  if (phone) placeZones();
  if (nuke) {
    // Placed before the notes: it names a symbol, so it gets first choice of room. Beside the star on one line or two, else above or below it on a short line.
    const yr = fmtY(parse(nuke.e.date)),
      variants = [['Nuclear test in space, ' + yr], ['Nuclear test', 'in space, ' + yr]],
      spots = [];
    variants.forEach((lines) => {
      for (const gap of [6, 14, 24]) spots.push({ lines, al: 'start', x: nuke.px + gap + nuke.r }, { lines, al: 'end', x: nuke.px - gap - nuke.r });
    });
    for (const gap of [18, 30, 44]) {
      const one = variants[0];
      spots.push(
        { lines: one, al: 'start', x: Math.max(edge, nuke.px - 40), line: nuke.r + gap + 10 },
        { lines: one, al: 'start', x: Math.max(edge, nuke.px - 40), line: -nuke.r - gap },
      );
    }
    for (const sp of spots) {
      const n = sp.lines.length,
        w = Math.max(...sp.lines.map((l) => tw(l, 12.5, 500))),
        base0 = nuke.py + (sp.line ?? 4) - (sp.line == null ? (n - 1) * 8 : 0),
        box = { x0: sp.al === 'start' ? sp.x : sp.x - w, x1: sp.al === 'start' ? sp.x + w : sp.x, y0: base0 - 13, y1: base0 + (n - 1) * 16 + 3 },
        down = sp.line > 0,
        lead =
          sp.line == null
            ? { x0: 0, x1: 0, y0: 0, y1: 0 }
            : { x0: nuke.px - 1, x1: nuke.px + 1, y0: down ? nuke.py + nuke.r + 5 : box.y1, y1: down ? box.y0 : nuke.py - nuke.r - 5 };
      if (box.x0 < gutter + 8 || box.x1 > W - edge || box.y0 < 6 || box.y1 > yL - 24 || clash(box, sp.line == null ? null : lead)) continue;
      const g = el('g', {}, svg);
      if (sp.line != null)
        el('line', { x1: nuke.px, x2: nuke.px, y1: nuke.py + (down ? nuke.r + 2 : -nuke.r - 2), y2: down ? box.y0 + 1 : box.y1 - 1, class: 'ht-lead' }, g);
      sp.lines.forEach((l, i) => text(g, { x: sp.x, y: base0 + i * 16, class: 'ht-note ht-tag', 'text-anchor': sp.al }, l));
      placed.push({ box, lead });
      S.tracks.push({ node: g, at: nuke.e.date, lead: -250, dur: 600, keys: [{ opacity: 0 }, { opacity: 1 }] });
      break;
    }
  }

  specs.forEach((s) => {
    const lines = wrap(s.t, noteW, noteSize, 400),
      w = Math.max(...lines.map((l) => tw(l, noteSize))),
      h = lines.length * (noteSize + 5);
    let best = null;
    search: for (const L of [24, 38, 56, 80, 110, 140, 170])
      for (const side of [...new Set([...s.order, 'up-end', 'up-start', 'down-end', 'down-start', 'left', 'right'])]) {
        const [dir, al] = side.split('-'),
          [box, lead] = boxFor(dir, al, s.m, L, w, h),
          n = clash(box, lead),
          ok = inside(box);
        if (ok && n === 0) {
          best = { dir, al, box, lead, n };
          break search;
        }
        if (ok && (!best || n < best.n)) best = { dir, al, box, lead, n };
      }
    if (!best || best.n >= 14) return; // no clean room: leave the note out rather than write over the buttons or the dots
    placed.push({ ...best, m: s.m, lines, w });
  });
  placed
    .filter((p) => p.m)
    .forEach((p) => {
      const g = el('g', {}, svg),
        { px, py } = p.m,
        anchor = p.dir === 'left' || p.al === 'end' ? 'end' : 'start',
        tx = anchor === 'end' ? p.box.x1 : p.box.x0 + (p.dir === 'right' ? 0 : 6),
        lead =
          p.dir === 'up'
            ? [px, py - 8, px, p.box.y1]
            : p.dir === 'down'
              ? [px, py + 8, px, p.box.y0]
              : p.dir === 'left'
                ? [px - 8, py, p.box.x1 + 4, py]
                : [px + 8, py, p.box.x0 - 4, py];
      el('line', { x1: lead[0], y1: lead[1], x2: lead[2], y2: lead[3], class: 'ht-lead' }, g);
      el('circle', { cx: px, cy: py, r: 2.5, class: 'ht-lead-dot' }, g);
      const t = el('text', { class: 'ht-note', 'font-size': noteSize, 'text-anchor': anchor }, g);
      const y0 = p.dir === 'up' || p.dir === 'down' ? (p.dir === 'up' ? p.box.y0 : p.box.y0 + 2) : p.box.y0;
      p.lines.forEach((l, i) => {
        const ts = el('tspan', { x: anchor === 'end' ? p.box.x1 : tx, y: y0 + noteSize + i * (noteSize + 5) - 2 }, t);
        ts.textContent = l;
      });
      S.tracks.push({ node: g, at: p.m.e.date, lead: -250, dur: 600, keys: [{ opacity: 0 }, { opacity: 1 }] });
    });
  if (!phone) placeZones();

  // ---- the law: a tick for every item on the ground, a name and a leader for a few
  let lastRow = 0;
  const rowsAvail = Math.floor((H - bandTop - (phone ? 40 : 44) - 8 - 24) / LINE),
    rowTop = (r) => bandTop + (phone ? 40 : 44) + r * LINE,
    rowBoxes = [],
    laws = el('g', {}, svg),
    tickLen = Math.max(14, bandTop - yL - sag);
  [...LEGAL].forEach((l) => {
    const px = x(parse(l.start)),
      len = bandTop - limbY(px),
      name = LAW_NAMES[l.id],
      label = name && (phone ? name.phone : name.text);
    let drop = len;
    if (label) {
      const lines = [label, ...(!phone && name.more ? [name.more] : [])],
        w = Math.max(tw(label, 13, 600), name.more && !phone ? tw(name.more, 13) : 0),
        endAnchor = name.end || px + 8 + w > W - gutter;
      for (let r = (phone ? name.prow : name.row) || 0; r + lines.length <= rowsAvail; r++) {
        const box = endAnchor
            ? { x0: px - 8 - w, x1: px - 2, y0: rowTop(r) - 12, y1: rowTop(r) + (lines.length - 1) * LINE + 3 }
            : { x0: px + 2, x1: px + 8 + w, y0: rowTop(r) - 12, y1: rowTop(r) + (lines.length - 1) * LINE + 3 },
          lead = { x0: px - 1, x1: px + 1, y0: bandTop, y1: rowTop(r) - 4 };
        if (rowBoxes.some((o) => hits(box, o, 2) || hits(lead, o, 1))) continue;
        rowBoxes.push(box, lead);
        lastRow = Math.max(lastRow, r + lines.length - 1);
        drop = rowTop(r) + (lines.length - 1) * LINE + 4 - limbY(px);
        const g = el('g', {}, laws);
        lines.forEach((ln, i) =>
          text(
            g,
            { x: endAnchor ? px - 8 : px + 8, y: rowTop(r) + i * LINE, class: i ? 'ht-law-t more' : 'ht-law-t', 'text-anchor': endAnchor ? 'end' : 'start' },
            ln,
          ),
        );
        S.tracks.push({ node: g, at: l.start, lead: -120, dur: 450, keys: [{ opacity: 0 }, { opacity: 1 }] });
        break;
      }
    }
    const tick = el('line', { x1: px, x2: px, y1: limbY(px), y2: limbY(px) + (label ? drop : tickLen), class: l.soft_law ? 'ht-law soft' : 'ht-law' }, laws);
    tick.style.transformOrigin = '50% 0';
    tick.style.transformBox = 'fill-box';
    S.tracks.push({
      node: tick,
      at: l.start,
      lead: 100,
      dur: 600,
      keys: [
        { opacity: 0, transform: 'scaleY(0)' },
        { opacity: 1, transform: 'none' },
      ],
    });
  });
  text(svg, { x: edge, y: rowTop(lastRow + 1) + 6, class: 'ht-law-h' }, 'LAW AND POLICY');

  // ---- the time marker: a thin line that moves along the years; it never crosses the words
  const clip = el('clipPath', { id: 'htMarkClip' }, defs),
    hole = words.map((b) => `M${b.x0},${b.y0}H${b.x1}V${b.y1}H${b.x0}Z`).join('');
  el('path', { d: `M0,0H${W}V${H}H0Z${hole}`, 'clip-rule': 'evenodd' }, clip);
  const mk = el('g', { 'clip-path': 'url(#htMarkClip)' }, svg),
    mkOut = el('g', { opacity: 0 }, mk), // shown only while it sweeps
    mkIn = el('g', {}, mkOut);
  el('line', { x1: x(DOMAIN[0]), x2: x(DOMAIN[0]), y1: 14, y2: bandTop, class: 'ht-marker' }, mkIn);
  S.marker = { out: mkOut, inn: mkIn, dx: x(DOMAIN[1]) - x(DOMAIN[0]) };

  stage.appendChild(svg);
  return S;
}

// ---------------------------------------------------------------- the one authored moment
function stopAnims() {
  anims.forEach((a) => a.cancel());
  anims = [];
}
function play() {
  if (!drawn) return;
  const t0 = DOMAIN[0].getTime(),
    span = DOMAIN[1].getTime() - t0,
    when = (date) => ((parse(date).getTime() - t0) / span) * SWEEP_MS;
  drawn.tracks.forEach((t) =>
    anims.push(t.node.animate(t.keys, { duration: t.dur, delay: Math.max(0, when(t.at) - t.lead), easing: EASE, fill: 'backwards' })),
  );
  const m = drawn.marker;
  anims.push(m.inn.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${m.dx}px)` }], { duration: SWEEP_MS, easing: 'linear', fill: 'both' }));
  anims.push(
    m.out.animate([{ opacity: 0 }, { opacity: 1, offset: 0.04 }, { opacity: 1, offset: 0.96 }, { opacity: 0 }], {
      duration: SWEEP_MS,
      easing: 'linear',
      fill: 'both',
    }),
  );
}

// ---------------------------------------------------------------- the photographic limb
// The embedded day image, laid out as if seen from orbit looking toward the horizon: rows near the limb squeeze many degrees of latitude into few pixels.
let texCache = null;
function texture() {
  const src = earthSource();
  if (!src) return null;
  if (texCache?.src === src) return texCache;
  const c = document.createElement('canvas'),
    w = Math.min(2048, src.naturalWidth || src.width),
    h = Math.round(w / 2);
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0, w, h);
  texCache = { src, w, h, d: g.getImageData(0, 0, w, h).data };
  return texCache;
}
function paintEarth(S) {
  const tex = texture();
  if (!tex || !S.earthImg.isConnected) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1),
    cw = Math.round(S.W * dpr),
    ch = Math.round(S.groundH * dpr),
    c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const g = c.getContext('2d'),
    img = g.createImageData(cw, ch),
    out = img.data,
    D = S.groundH - S.sag - 8,
    LAT_H = 60,
    LAT_B = 8,
    LON0 = 5,
    SPAN = 90;
  for (let j = 0; j < ch; j++) {
    const py = j / dpr;
    for (let i = 0; i < cw; i++) {
      const px = i / dpr,
        d = py - (S.limbY(px) - S.yL),
        t = Math.min(1, Math.max(0, d / D)),
        f = 1 - (1 - t) ** 2.4,
        lat = LAT_H - (LAT_H - LAT_B) * f,
        lon = LON0 + (px / S.W - 0.5) * SPAN * (1 + 1.4 * (1 - t) ** 2),
        u = (((lon + 180) / 360) * tex.w + tex.w) % tex.w,
        v = Math.min(tex.h - 1.001, Math.max(0, ((90 - lat) / 180) * tex.h)),
        u0 = Math.floor(u),
        v0 = Math.floor(v),
        fu = u - u0,
        fv = v - v0,
        u1 = (u0 + 1) % tex.w,
        k = (a, b) => (b * tex.w + a) * 4,
        p00 = k(u0, v0),
        p10 = k(u1, v0),
        p01 = k(u0, v0 + 1),
        p11 = k(u1, v0 + 1),
        o = (j * cw + i) * 4,
        haze = 0.55 * (1 - t) ** 5,
        shade = 1 - 0.45 * t;
      const hz = [120, 176, 255];
      for (let ch3 = 0; ch3 < 3; ch3++) {
        const s = (tex.d[p00 + ch3] * (1 - fu) + tex.d[p10 + ch3] * fu) * (1 - fv) + (tex.d[p01 + ch3] * (1 - fu) + tex.d[p11 + ch3] * fu) * fv;
        out[o + ch3] = s * shade * (1 - haze) + hz[ch3] * haze;
      }
      out[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  S.earthImg.setAttribute('href', c.toDataURL('image/jpeg', 0.9));
}
