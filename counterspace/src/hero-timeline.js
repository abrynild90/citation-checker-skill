// ============================================================================
// hero-timeline.js: the first screen as the thesis. One picture of the whole history on the page's shared years: what states did in orbit, rising from the
// Earth's limb (height on a log scale), and the laws and policies as ticks on the ground. It plays once (a time marker sweeps left to right and each event
// rises at its year) and then stays as the final picture. Provides: mountHero(). Needs the data and text measurement from app.js.
// ============================================================================
import { DOMAIN, KIN, LAST_DA, chartScale, LEGAL, REDUCED, esc, fmtD, fmtMonthYear, fmtY, hasScene, num, parse, star, tw, wrap } from './app.js';
import { KIND_PLAIN, legalKindWords, targetWords } from './ui.js';
import { NO_LATER, hasLaterLaw, linkText, pairsAt, tagSpot } from './links.js';
import { SCENES } from './scenes/config.js';
import { SHORT } from './discover-data.js';
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
  LINE0 = 19; // px between rows of ground labels (scaled by K where it is used)
// Ground labels for the laws that get a name on the picture (every law gets a tick). The phone wording is shorter; null leaves it out there.
const LAW_NAMES = {
  'ltbt-1963': {
    text: 'Limited Test Ban Treaty, 1963',
    phone: 'Test Ban Treaty, 1963',
    more: 'The earliest law here. It bans nuclear tests in space.',
    row: 1,
    prow: 1,
  },
  'ost-1967': { text: 'Outer Space Treaty, 1967', phone: 'Outer Space Treaty, 1967', prow: 0 },
  'itu-1992': { text: 'ITU Constitution, Articles 45 and 48, 1992', phone: null },
  'tallinn-2017': { text: 'Tallinn Manual 2.0 (soft law), 2017', phone: null, end: true },
  'unga-77-41': { text: 'UN General Assembly resolution 77/41, 2022', phone: 'UN resolution, 2022', row: 1, prow: 1 },
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

let K = 1; // type and tag scale: 1, rising to 1.1 on a window of 1600 px and more, so the words keep their size next to the larger screen
let drawn = null, // the current drawing, kept for the replay and for the Earth photograph that arrives later
  anims = [];

export function mountHero(fontsReady, actions = {}) {
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
    mountHits(stage, drawn, actions);
    loadEmbeddedEarth().then((ok) => ok && drawn && paintEarth(drawn));
    if (animate && !STILL) play();
  };
  // The picture appears finished (every dot and tick at once); the replay button runs the history as an animation.
  fontsReady.then(() => draw(false));
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
    _k = (K = phone ? 1 : chartScale()),
    gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 24,
    edge = wide ? Math.max(gutter, (W - (document.querySelector('.topbar-in')?.getBoundingClientRect().width || Math.min(1240, W))) / 2 + gutter) : gutter,
    groundH = Math.round((phone ? 150 : wide ? 165 : 190) * K),
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
      ? ['.hero-title', '.hero-text .lede'].map((s) => {
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

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true', focusable: 'false', style: `--htk:${K}` }),
    defs = el('defs', {}, svg),
    limbPath =
      'M' +
      d3
        .range(0, W + 1, 12)
        .concat(W)
        .map((px) => `${px},${limbY(px).toFixed(1)}`)
        .join('L'),
    S = { svg, W, H, yL, groundH, sag, limbY, tracks: [], earthImg: null, hits: [], phone };
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
  // A named law drops its tick through the ground band: a year label that sits on one of those ticks steps aside, to the left of it.
  const named = LEGAL.filter((l) => LAW_NAMES[l.id] && (phone ? LAW_NAMES[l.id].phone : LAW_NAMES[l.id].text)).map((l) => x(parse(l.start)));
  decades.forEach((d) => {
    const cx = x(d),
      yl = String(d.getUTCFullYear()),
      half = tw(yl, 13 * K, 500) / 2 + 3,
      cross = named.find((px) => Math.abs(px - cx) < half + 2);
    text(svg, cross === undefined ? { x: cx, y: bandTop + 19, class: 'ht-year-t' } : { x: cross - 6, y: bandTop + 19, class: 'ht-year-t', style: 'text-anchor:end' }, yl);
  });

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
    if (hasScene(e)) el('circle', { r: r + 4.5, class: 'ht-scene' }, inner); // a thin outer ring: this one has a 3D scene
    marks.push({ e, px, py, r });
    S.hits.push({ k: 'ev', id: e.id, date: e.date, e, px, py, r });
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
  const noteSize = (phone ? 13 : 14) * K,
    noteW = K * (phone ? Math.min(190, W - 2 * gutter - 8) : W < 900 ? Math.round(Math.max(236, W * 0.3)) : W < 1100 ? Math.round(Math.max(200, W * 0.25)) : Math.round(Math.min(250, Math.max(190, W * 0.2)))),
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
        const w = tw(t, 13 * K, 500);
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
        w = Math.max(...sp.lines.map((l) => tw(l, 13 * K, 500))),
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

  const placeNote = (s, tol = phone || W < 900 ? 14 : 13) => {
    let best = null,
      lines = [],
      w = 0;
    // A phone tries narrower notes (taller, but they fit between the zone names and the edge) before it gives the note up.
    for (const nw of phone ? [noteW, 150, 126] : W < 900 ? [noteW, 190, 160] : [noteW]) {
      lines = wrap(s.t, nw, noteSize, 400);
      w = Math.max(...lines.map((l) => tw(l, noteSize)));
      const h = lines.length * (noteSize + 5);
      best = null;
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
      if (best && best.n <= tol) break;
    }
    if (!best || best.n > tol) return false; // no clean room: leave the note out rather than write over the buttons or the dots
    placed.push({ ...best, m: s.m, lines, w });
    return true;
  };
  specs.forEach((s) => placeNote(s));
  // A phone shows at least one weapons note: if none found clean room, the last test's note may lie across a mark or two (never across words).
  if (phone && !placed.some((p) => p.m)) specs.slice().reverse().some((s) => placeNote(s, 60));
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
  const LINE = LINE0 * K;
  let lastRow = 0;
  const rowsAvail = Math.floor((H - bandTop - (phone ? 40 : 44) - 8 - (phone || !wide ? 24 : 10)) / LINE),
    rowTop = (r) => bandTop + (phone ? 40 : 44) + r * LINE,
    rowBoxes = [],
    laws = el('g', {}, svg),
    tickLen = Math.max(14, bandTop - yL - sag);
  [...LEGAL].forEach((l, li) => {
    const px = x(parse(l.start)),
      len = bandTop - limbY(px),
      name = LAW_NAMES[l.id],
      label = name && (phone ? name.phone : name.text);
    let drop = len;
    if (label) {
      const lines = [label, ...(!phone && name.more ? [name.more] : [])],
        w = Math.max(tw(label, 13 * K, 600), name.more && !phone ? tw(name.more, 13 * K) : 0),
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
        S.tracks.push({ node: g, at: l.start, delay: 350 + li * 28, dur: 450, keys: [{ opacity: 0 }, { opacity: 1 }] });
        break;
      }
    }
    const tick = el('line', { x1: px, x2: px, y1: limbY(px), y2: limbY(px) + (label ? drop : tickLen), class: l.soft_law ? 'ht-law soft' : 'ht-law' }, laws);
    S.hits.push({ k: 'law', id: l.id, date: l.start, l, px, py: limbY(px), y1: limbY(px) + (label ? drop : tickLen) });
    if (hasScene(l)) {
      const ring = el('circle', { cx: px, cy: limbY(px), r: 6, class: 'ht-scene' }, laws);
      S.tracks.push({ node: ring, at: l.start, delay: 100 + li * 28, dur: 500, keys: [{ opacity: 0 }, { opacity: 1 }] });
    }
    tick.style.transformOrigin = '50% 0';
    tick.style.transformBox = 'fill-box';
    S.tracks.push({
      node: tick,
      at: l.start,
      delay: 100 + li * 28, // the ground is drawn first, one tick after another in the first second, before the sweep brings in the dots
      dur: 500,
      keys: [
        { opacity: 0, transform: 'scaleY(0)' },
        { opacity: 1, transform: 'none' },
      ],
    });
  });

  S.words = words;
  S.avoid = placed.map((p) => p.box).concat(words, rowBoxes); // the notes, zone names, title words and law names: a card never stands on them
  // ---- the time marker: a thin line that moves along the years; it never crosses the words
  const clip = el('clipPath', { id: 'htMarkClip' }, defs),
    hole = words.map((b) => `M${b.x0},${b.y0}H${b.x1}V${b.y1}H${b.x0}Z`).join('');
  el('path', { d: `M0,0H${W}V${H}H0Z${hole}`, 'clip-rule': 'evenodd' }, clip);
  const mk = el('g', { 'clip-path': 'url(#htMarkClip)' }, svg),
    mkOut = el('g', { opacity: 0 }, mk), // shown only while it sweeps
    mkIn = el('g', {}, mkOut);
  el('line', { x1: x(DOMAIN[0]), x2: x(DOMAIN[0]), y1: 14, y2: bandTop, class: 'ht-marker' }, mkIn);
  S.marker = { out: mkOut, inn: mkIn, dx: x(DOMAIN[1]) - x(DOMAIN[0]) };

  // the ring and the bar that mark the point or law being looked at (moved by mountHits)
  S.ring = el('circle', { r: 13, class: 'ht-ring', opacity: 0 }, svg);
  S.bar = el('line', { class: 'ht-law-hi', opacity: 0 }, svg);
  S.links = el('g', { 'aria-hidden': 'true' }, svg); // the dashed line from a weapon to the first later law, with the time between (moved by mountHits)
  stage.appendChild(svg);
  return S;
}


// ---------------------------------------------------------------- the picture answers to a pointer or a keyboard
// Every dot and every tick on the ground can be pointed at, tapped or reached with the arrow keys; a small card says what it is and, where a 3D scene
// exists, offers "Watch in 3D". The picture itself stays a still image for screen readers (its description lists everything): this layer sits beside
// it, so the buttons are not inside the picture's image role. The layer has one tab stop; the arrow keys step through the history in date order.
const sceneOf = (id) => SCENES.find((s) => s.id === id);
const sceneName = (id) => (sceneOf(id)?.title || '').replace(/\s*\((\d{4}[^)]*)\)\s*$/, '');
const watch = (id, text) =>
  `<button type="button" class="btn small primary hp-3d" data-scene="${esc(id)}"><svg class="ico" aria-hidden="true"><use href="#i-play"/></svg>${esc(text)}</button>`;
function popHTML(h) {
  if (h.k === 'ev') {
    const e = h.e,
      alt = e.altitude_km == null ? '' : ` At ${num(e.altitude_km)} km.`,
      scene = hasScene(e),
      title = scene ? sceneName(e.scene_3d) || e.system : e.system;
    return (
      `<p class="hp-title">${esc(title)}</p><p class="hp-when">${esc(e.state)} · ${esc(fmtD(e))}</p>` +
      `<p class="hp-line">${esc(KIND_PLAIN[e.type] || '')}.${esc(alt)}${scene ? ' Weapon: ' + esc(e.system) + '.' : ''}</p>` +
      (hasLaterLaw(e.id) ? '' : `<p class="hp-none">${NO_LATER}</p>`) +
      (scene ? `<div class="hp-acts">${watch(e.scene_3d, 'Watch in 3D')}</div>` : '')
    );
  }
  const l = h.l,
    when = l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : fmtD({ date: l.start }),
    scene = hasScene(l);
  return (
    `<p class="hp-title">${esc(l.title || l.label)}</p><p class="hp-when">${esc(legalKindWords(l))} · ${esc(when)}</p>` +
    `<div class="hp-acts">${scene ? watch(l.scene_3d, `Watch ${SHORT[l.scene_3d] || 'the event'} in 3D`) : ''}` +
    `<a class="btn small" href="#legalBand">See it on the timeline</a></div>`
  );
}
function mountHits(stage, S, actions) {
  const fig = stage.parentElement;
  fig.querySelector('.ht-layer')?.remove();
  const layer = document.createElement('div');
  layer.className = 'ht-layer';
  layer.style.height = S.H + 'px';
  const group = document.createElement('div');
  group.className = 'ht-group';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Events and laws in the picture. Use the arrow keys to step through them in date order; Enter shows the card.');
  const hits = [...S.hits].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.k === 'ev' ? -1 : 1));
  const pop = document.createElement('div');
  pop.className = 'ht-pop';
  pop.setAttribute('role', 'region');
  pop.hidden = true;
  const GRACE = 260; // the card stays this long after the pointer leaves, so the way to its button is never cut short
  const stopHide = () => (clearTimeout(hideT), (hideT = 0));
  let active = null,
    hideT = 0,
    switchT = 0,
    switchFor = null,
    pinned = false;
  const btns = hits.map((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ht-hit ' + (h.k === 'ev' ? 'ev' : 'law');
    b.tabIndex = i === 0 ? 0 : -1;
    b.setAttribute('aria-label', h.k === 'ev' ? `${h.e.system}, ${fmtD(h.e)}` : `${h.l.title || h.l.label}, ${fmtD({ date: h.l.start })}`);
    const w = h.k === 'ev' ? 28 : 18,
      top = h.k === 'ev' ? h.py - 14 : h.py,
      ht = h.k === 'ev' ? 28 : Math.max(24, h.y1 - h.py);
    Object.assign(b.style, { left: h.px - w / 2 + 'px', top: top + 'px', width: w + 'px', height: ht + 'px' });
    h.btn = b;
    group.appendChild(b);
    return b;
  });
  layer.append(group, pop);
  fig.insertBefore(layer, stage.nextSibling);

  // Where the card stands: on the clearest spot of the sky nearest the point or tick. Every position on a coarse grid is scored; a card never stands on a
  // dot, a tick, a note, a zone name, a year, a law name, the headline words, the dashed line or its time tag (each costs a lot), and distance from the
  // point costs a little, so it sits as close as the clear room allows. Only when no clear room exists does the least-bad spot win.
  const overlap = (a, b, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
  let fixed = null;
  const fixedBoxes = () =>
    (fixed ||= [
      ...(S.avoid || []).map((o) => (S.words.includes(o) ? { ...o, soft: 1 } : o)),
      ...[...S.svg.querySelectorAll('text')].map((n) => {
        const r = n.getBBox();
        return { x0: r.x, x1: r.x + r.width, y0: r.y, y1: r.y + r.height };
      }),
      ...S.hits.map((o) =>
        o.k === 'ev'
          ? { x0: o.px - o.r - 5, x1: o.px + o.r + 5, y0: o.py - o.r - 5, y1: o.py + o.r + 5, o }
          : { x0: o.px - 3, x1: o.px + 3, y0: o.py, y1: o.y1, o },
      ),
    ]);
  const place = (h) => {
    const pw = pop.offsetWidth,
      ph = pop.offsetHeight,
      cx = h.px,
      cy = h.k === 'ev' ? h.py : (h.py + h.y1) / 2;
    if (S.phone) {
      const x = Math.min(Math.max(8, cx - pw / 2), S.W - pw - 8),
        ys = h.k === 'ev' ? [cy + 18, cy - 18 - ph] : [S.yL - ph - 6],
        y = ys.find((v) => v >= 8 && v + ph <= S.H - 8) ?? ys[0];
      pop.style.left = x + 'px';
      pop.style.top = Math.max(8, y) + 'px';
      return;
    }
    const lk = tagOf(h).flatMap(({ ev, law, w, sp }) => {
        const n = Math.max(1, Math.round(Math.hypot(law.px - ev.px, law.py - ev.py) / 12)),
          box = (x, y, hw, hh) => ({ x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh });
        return [
          box(ev.px, ev.py, 16, 16),
          box(law.px, (law.py + law.y1) / 2, 5, (law.y1 - law.py) / 2),
          box(sp.x, sp.y, w / 2 + 3, 11 * K + 3),
          ...Array.from({ length: n + 1 }, (_, i) => box(ev.px + ((law.px - ev.px) * i) / n, ev.py + ((law.py - ev.py) * i) / n, 4, 4)),
        ];
      }),
      obs = fixedBoxes().filter((o) => o.o !== h),
      self = { x0: cx - 9, x1: cx + 9, y0: h.py - 9, y1: h.k === 'ev' ? h.py + 9 : h.y1 },
      maxY = S.yL - 14 - ph;
    let best = null;
    for (let y = 8; y <= Math.max(8, maxY); y += 10)
      for (let x = 8; x <= S.W - pw - 8; x += 12) {
        const R = { x0: x, x1: x + pw, y0: y, y1: y + ph },
          dx = Math.max(R.x0 - cx, 0, cx - R.x1),
          dy = Math.max(R.y0 - cy, 0, cy - R.y1);
        let cost = Math.hypot(dx, dy) * 0.6;
        if (best && cost >= best.cost) continue;
        if (overlap(R, self, 4)) cost += 1000;
        for (const o of obs) if (overlap(R, o, 5)) cost += o.soft ? 300 : 1000;
        for (const o of lk) if (overlap(R, o, 2)) cost += 1000;
        if (!best || cost < best.cost) best = { cost, x, y };
      }
    pop.style.left = best.x + 'px';
    pop.style.top = best.y + 'px';
    pop.dataset.clear = best.cost < 300 ? '1' : best.cost < 1000 ? 'w' : '0'; // 1: clear, w: over the headline words only
  };
  // The real links (data/lag_pairs.json) of the point or tick being looked at: a dashed line from each weapon dot to its first later law, the time between
  // them on a small tag, and a ring on the dot or a bar on the tick at the other end.
  const linksOf = (h) =>
    h
      ? pairsAt(h.k === 'ev' ? h.e.id : h.l.id)
          .map((p) => ({ p, ev: S.hits.find((k) => k.k === 'ev' && k.id === p.event), law: S.hits.find((k) => k.k === 'law' && k.id === p.law) }))
          .filter((q) => q.ev && q.law)
      : [];
  const RING = (h) => (h.e.type === 'nuclear' ? 17 : h.e.type === 'destructive' ? 13 : 11);
  // Where each pair's time tag sits: slid along the dashed line to the first spot clear of every word in the picture (notes, zone names, year numbers, law
  // names, the headline); a word it cannot avoid is quietened while the link shows.
  const tagOf = (h) => {
    const words = [
      ...S.avoid,
      ...[...S.svg.querySelectorAll('text:not(.ht-lk-tag)')].map((n) => {
        const r = n.getBBox();
        return { x0: r.x, x1: r.x + r.width, y0: r.y, y1: r.y + r.height, node: n };
      }),
    ];
    return linksOf(h).map(({ p, ev, law }) => {
      const w = tw(linkText(p.g), 12.5 * K, 600) + 16 * K,
        sp = tagSpot({ x: ev.px, y: ev.py }, { x: law.px, y: law.py }, w, 22 * K, words, { x0: 0, x1: S.W, y0: 4, y1: S.H - 4 });
      return { p, ev, law, w, sp };
    });
  };
  let textsCache = null;
  const textBoxes = () =>
    (textsCache ||= [...S.svg.querySelectorAll('text:not(.ht-lk-tag)')].map((node) => {
      const r = node.getBBox();
      return { node, x0: r.x, x1: r.x + r.width, y0: r.y, y1: r.y + r.height };
    }));
  let dimmed = [];
  const undim = () => {
    dimmed.forEach((n) => n.classList.remove('ht-dim'));
    dimmed = [];
  };
  const drawLinks = (h) => {
    S.links.replaceChildren();
    undim();
    tagOf(h).forEach(({ p, ev, law, w, sp }) => {
      const dx = law.px - ev.px,
        dy = law.py - ev.py,
        d = Math.hypot(dx, dy),
        r0 = RING(ev) + 1;
      if (d > r0 + 4) el('line', { x1: ev.px + (dx / d) * r0, y1: ev.py + (dy / d) * r0, x2: law.px, y2: law.py, class: 'ht-lk-line' }, S.links);
      if (ev !== h) el('circle', { cx: ev.px, cy: ev.py, r: RING(ev), class: 'ht-ring' }, S.links);
      if (law !== h) el('line', { x1: law.px, x2: law.px, y1: law.py, y2: law.y1, class: 'ht-law-hi' }, S.links).setAttribute('opacity', 0.45);
      const t = text(S.links, { x: sp.x, y: sp.y, class: 'ht-lk-tag', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, linkText(p.g));
      S.links.insertBefore(el('rect', { x: sp.x - w / 2, y: sp.y - 11 * K, width: w, height: 22 * K, rx: 11 * K, class: 'ht-lk-pill' }), t);
      sp.hit.forEach((o) => o.node && (o.node.classList.add('ht-dim'), dimmed.push(o.node)));
      // a caption the dashed line itself crosses is quietened too, so the line never runs through words
      const n = Math.ceil(d / 5);
      for (const o of textBoxes()) {
        if (dimmed.includes(o.node)) continue;
        for (let i = 0; i <= n; i++) {
          const x = ev.px + (dx * i) / n,
            y = ev.py + (dy * i) / n;
          if (x > o.x0 - 3 && x < o.x1 + 3 && y > o.y0 - 2 && y < o.y1 + 2) {
            o.node.classList.add('ht-dim');
            dimmed.push(o.node);
            break;
          }
        }
      }
    });
  };
  const mark = (h) => {
    drawLinks(h);
    if (h?.k === 'ev') {
      S.ring.setAttribute('transform', `translate(${h.px},${h.py})`);
      S.ring.setAttribute('r', h.e.type === 'nuclear' ? 17 : h.e.type === 'destructive' ? 13 : 11);
      S.ring.setAttribute('opacity', 1);
      S.bar.setAttribute('opacity', 0);
    } else if (h) {
      S.bar.setAttribute('x1', h.px);
      S.bar.setAttribute('x2', h.px);
      S.bar.setAttribute('y1', h.py);
      S.bar.setAttribute('y2', h.y1);
      S.bar.setAttribute('opacity', 1);
      S.ring.setAttribute('opacity', 0);
    } else {
      S.ring.setAttribute('opacity', 0);
      S.bar.setAttribute('opacity', 0);
    }
  };
  // The card shows at once (a short fade, never longer than 120 ms). Moving to another point swaps its words in place without fading again; leaving fades it
  // out quickly, and a card that is fading out cannot be touched, so nothing ghosts.
  let fadeT = 0;
  const show = (h) => {
    stopHide();
    clearTimeout(fadeT);
    clearTimeout(switchT);
    switchT = 0;
    if (active !== h) {
      const fresh = pop.hidden || !pop.classList.contains('on');
      active = h;
      pop.dataset.hit = h.k + ':' + h.id;
      pop.innerHTML = popHTML(h);
      pop.hidden = false;
      place(h);
      if (fresh) {
        pop.classList.remove('on');
        void pop.offsetWidth;
      }
      pop.classList.add('on');
      mark(h);
    }
  };
  const hide = (now, grace = GRACE) => {
    stopHide();
    const go = () => {
      hideT = 0;
      if (pinned || pop.contains(document.activeElement)) return;
      active = null;
      pop.classList.remove('on');
      mark(null);
      clearTimeout(fadeT);
      fadeT = setTimeout(() => !active && (pop.hidden = true), 100);
    };
    if (now) go();
    else hideT = setTimeout(go, grace);
  };
  // The path from the point to its card: every pointer position inside this shape belongs to the journey, so crossing a neighbouring dot on the way
  // neither swaps the card nor starts it fading. (The convex hull of the point and the card, a little padded.)
  const onWay = (x, y) => {
    if (!active || pop.hidden) return false;
    const h = active,
      ax = h.px,
      ay = h.k === 'ev' ? h.py : (h.py + h.y1) / 2,
      L = pop.offsetLeft - 6,
      T = pop.offsetTop - 6,
      R = pop.offsetLeft + pop.offsetWidth + 6,
      B = pop.offsetTop + pop.offsetHeight + 6;
    if (x >= L && x <= R && y >= T && y <= B) return true;
    const pts = [[ax, ay], [L, T], [R, T], [R, B], [L, B]];
    // convex hull (monotone chain), then a point-in-polygon test with a 10 px margin
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]),
      lo = [],
      up = [];
    for (const q of pts) {
      while (lo.length > 1 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop();
      lo.push(q);
    }
    for (const q of [...pts].reverse()) {
      while (up.length > 1 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop();
      up.push(q);
    }
    const hull = lo.slice(0, -1).concat(up.slice(0, -1));
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i],
        b = hull[(i + 1) % hull.length],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      if (cr(a, b, [x, y]) / len < -10) return false;
    }
    return true;
  };
  // the nearest dot or tick to the pointer, within a small reach (dots are close together in the 1960s)
  const nearest = (ev) => {
    const r = layer.getBoundingClientRect(),
      x = ev.clientX - r.left,
      y = ev.clientY - r.top;
    let best = null,
      bd = Infinity;
    for (const h of hits) {
      const d =
        h.k === 'ev'
          ? Math.hypot(x - h.px, y - h.py) - 2
          : Math.abs(x - h.px) * 1.6 + Math.max(0, h.py - y, y - h.y1) * 1.2 + 2;
      if (d < bd) (bd = d), (best = h);
    }
    return bd <= (ev.pointerType === 'touch' ? 24 : 15) ? best : null;
  };
  // The pointer's last few positions: is it heading for the card (its buttons), or merely passing over the picture?
  const trail = [];
  let nearH = null;
  const headingForCard = (x, y) => {
    const a = trail[0],
      b = trail.at(-1),
      dt = b[0] - a[0];
    if (trail.length < 2 || dt < 16) return false;
    const vx = (b[1] - a[1]) / dt,
      vy = (b[2] - a[2]) / dt,
      sp = Math.hypot(vx, vy),
      cx = pop.offsetLeft + pop.offsetWidth / 2 - x,
      cy = pop.offsetTop + pop.offsetHeight - 24 - y, // the card's buttons are at its foot
      d = Math.hypot(cx, cy) || 1;
    return sp > 0.12 && (vx * cx + vy * cy) / (sp * d) > 0.8;
  };
  layer.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch' || pinned) return;
    const now = performance.now();
    trail.push([now, ev.clientX, ev.clientY]);
    while (trail.length > 1 && now - trail[0][0] > 110) trail.shift();
    if (pop.contains(ev.target)) return void (stopHide(), clearTimeout(switchT)); // on the card: it stays, whatever lies beneath it
    const r = layer.getBoundingClientRect(),
      x = ev.clientX - r.left,
      y = ev.clientY - r.top,
      h = nearest(ev);
    nearH = h;
    layer.style.cursor = h ? 'pointer' : '';
    if (h === active) return void (stopHide(), clearTimeout(switchT));
    if (!active || pop.hidden || !pop.classList.contains('on')) return void (h ? show(h) : active && !hideT && hide());
    // A card is open and the pointer is over something else (or nothing). Another dot or tick replaces the card at once, unless the pointer is plainly on
    // its way to the card's buttons across that dot: then it must stay over the new one for a moment before the card changes.
    const way = onWay(x, y),
      toward = way && headingForCard(x, y);
    if (h) {
      if (!toward) return void show(h);
      stopHide();
      if (switchT && switchFor === h) return;
      clearTimeout(switchT);
      switchFor = h;
      switchT = setTimeout(() => ((switchT = 0), nearH === h && show(h)), 150);
    } else {
      clearTimeout(switchT);
      switchT = 0;
      if (toward) hide(false, 700);
      else if (way) hide(false, 380);
      else if (!hideT) hide();
    }
  });
  layer.addEventListener('pointerleave', (ev) => !pop.contains(ev.relatedTarget) && hide());
  pop.addEventListener('pointerenter', () => (stopHide(), clearTimeout(switchT)));
  pop.addEventListener('pointerleave', () => !pinned && hide());
  layer.addEventListener('click', (ev) => {
    if (ev.target.closest('.ht-pop')) return;
    const h = ev.target.closest('.ht-hit') && ev.detail === 0 ? hits[btns.indexOf(ev.target.closest('.ht-hit'))] : nearest(ev);
    if (h) {
      pinned = true;
      show(h);
    } else {
      pinned = false;
      hide(true);
    }
  });
  // tap anywhere else, or press Escape: the card goes away
  document.addEventListener(
    'pointerdown',
    (ev) => {
      if (!layer.isConnected || layer.contains(ev.target)) return;
      pinned = false;
      hide(true);
    },
    { passive: true },
  );
  pop.addEventListener('click', (ev) => {
    const b = ev.target.closest('.hp-3d');
    if (b) {
      pinned = false;
      actions.openScene?.(b.dataset.scene, b);
    }
    if (ev.target.closest('a')) hide(true);
  });
  group.addEventListener('focusin', (ev) => {
    const i = btns.indexOf(ev.target);
    if (i < 0) return;
    btns.forEach((b, k) => (b.tabIndex = k === i ? 0 : -1));
    pinned = false;
    show(hits[i]);
  });
  group.addEventListener('keydown', (ev) => {
    const i = btns.indexOf(document.activeElement);
    if (ev.key === 'Escape') {
      pinned = false;
      hide(true);
      return;
    }
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      pinned = true;
      show(hits[i]);
      pop.querySelector('.hp-3d, a')?.focus();
      return;
    }
    const to = ev.key === 'Home' ? 0 : ev.key === 'End' ? btns.length - 1 : { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1 }[ev.key];
    if (to == null || i < 0) return;
    ev.preventDefault();
    btns[Math.min(btns.length - 1, Math.max(0, to))].focus();
  });
  pop.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      pinned = false;
      const b = active?.btn;
      hide(true);
      b?.focus();
    }
  });
  group.addEventListener('focusout', (ev) => {
    if (!layer.contains(ev.relatedTarget)) hide();
  });
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
    anims.push(t.node.animate(t.keys, { duration: t.dur, delay: t.delay ?? Math.max(0, when(t.at) - t.lead), easing: EASE, fill: 'backwards' })),
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
