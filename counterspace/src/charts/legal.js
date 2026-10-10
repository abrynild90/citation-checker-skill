// ============================================================================
// charts/legal.js: the law timeline (sticky band, dodged symbols, 2021 to 2026 zoom, phone strip with tap-to-name), its key, glossary, list and table.
// Provides: drawLegal(), drawLegalKey(), legalGlyph(), glyphMarkup(), legalScroll(), probeBand(), GLOSSARY.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { D, DOMAIN, EXPORTING, chartWindow, KIN, LEGAL, Placer, badge, esc, fmt, fmtMY, fmtY, hasScene, isPhoneNow, layout, parse, tw } from '../app.js';
import { activate, addGuide, bindMark, legalCard, legalKindOf, legalKindWords, legend, rove, setGuide, table } from '../ui.js';
import { hooks } from '../shared.js';

// ---------------------------------------------------------------- names
// t: title for cards and the table. l, m, s: the label at three lengths (full name, shorter name, abbreviation); a missing size falls back to the next
// longer one. Soft-law names end in "(soft law)" at full length and "*" when shortened. The glossary explains every abbreviation.
const NAMES = {
  'ltbt-1963': { t: 'Limited Test Ban Treaty', s: 'Test ban' },
  'ost-1967': { t: 'Outer Space Treaty', s: 'Space Treaty' },
  'abm-1972': { t: 'ABM Treaty, Article XII', m: 'ABM Treaty Art. XII', s: 'ABM Treaty' },
  'paros-1981': {
    t: 'UN General Assembly agenda item on preventing an arms race in outer space',
    l: 'UN General Assembly agenda item on preventing an arms race in outer space, since 1981',
    m: 'UN General Assembly agenda item (PAROS), since 1981',
    s: 'PAROS agenda item, since 1981',
  },
  'cd-paros-committee': {
    t: 'Conference on Disarmament committee on PAROS',
    l: 'Conference on Disarmament committee, 1985–94',
    m: 'CD committee on PAROS, 1985–94',
    s: 'CD committee, 1985–94',
  },
  'itu-1992': { t: 'ITU Constitution, Articles 45 and 48', m: 'ITU Arts. 45 and 48', s: 'ITU rules' },
  'ppwt-2008': {
    t: 'Russia–China draft treaty on weapons in space (PPWT)',
    l: 'Russia–China draft treaty on weapons in space',
    m: 'Russia–China draft treaty',
    s: 'Draft treaty',
  },
  'ppwt-2014': { t: 'Updated Russia–China draft treaty (PPWT)', l: 'Updated Russia–China draft treaty', m: 'Updated PPWT draft', s: 'Draft treaty II' },
  'tallinn-2017': { t: 'Tallinn Manual 2.0 (soft law)', m: 'Tallinn Manual 2.0*', s: 'Cyber manual*' },
  'unga-75-36': { t: 'UN General Assembly resolution 75/36', m: 'UNGA 75/36', s: 'UN 75/36' },
  'us-moratorium-2022': {
    t: 'US moratorium on destructive anti-satellite tests',
    l: 'US moratorium on destructive tests',
    m: 'US test moratorium',
    s: 'US pledge',
  },
  'oewg-2022': {
    t: 'Open-ended Working Group on space threats',
    l: 'Open-ended Working Group on space threats, 2022–23',
    m: 'Open-ended Working Group, 2022–23',
    s: 'UN working group, 2022–23',
  },
  'milamos-2022': { t: 'McGill Manual, Volume I (soft law)', l: 'McGill Manual (soft law)', m: 'McGill Manual*', s: 'McGill Manual*' },
  'unga-77-41': { t: 'UN General Assembly resolution 77/41', m: 'UNGA 77/41', s: 'UN 77/41' },
  'woomera-2024': { t: 'Woomera Manual (soft law)', m: 'Woomera Manual*', s: 'Woomera*' },
  'unsc-veto-2024': { t: 'Russian veto: nuclear weapons in orbit', m: 'Russian veto (nuclear weapons)', s: 'Russian veto' },
  'itu-rrb-2024': { t: 'ITU Radio Regulations Board: grave concern', m: 'ITU Board: grave concern', s: 'ITU Board ’24' },
  'icao-2025': { t: 'ICAO Assembly: GNSS interference an infraction', m: 'ICAO finding on GNSS', s: 'ICAO ’25' },
  'itu-rrb-2025': {
    t: 'ITU Radio Regulations Board urges Russia to stop interference',
    l: 'ITU Radio Regulations Board urges Russia to stop',
    m: 'ITU Board urges Russia to stop',
    s: 'ITU ’25',
  },
};
// Card, table and list titles are set once, here, so ui.js and lag.js can read l.title without importing this module's tables.
LEGAL.forEach((l) => {
  l.title = NAMES[l.id]?.t ?? l.label;
});
const nameAt = (d, size) => {
  const n = NAMES[d.id] ?? {},
    t = n.t ?? d.label,
    l = n.l ?? t,
    m = n.m ?? l;
  return [l, m, n.s ?? m][size];
};
// Terms and meanings for the abbreviations the timeline uses. Shown as a two-column list under "Show the data behind this chart".
export const GLOSSARY = [
  ['Space Treaty', 'The Outer Space Treaty (1967).'],
  ['ABM Treaty', 'Anti-Ballistic Missile Treaty (1972). Article XII bars interference with the other side’s means of verifying the treaty.'],
  ['ICAO', 'The International Civil Aviation Organization, the United Nations agency for civil aviation.'],
  ['Aviation body', 'The International Civil Aviation Organization (ICAO), the United Nations agency for civil aviation.'],
  ['CD', 'Conference on Disarmament.'],
  ['Cyber manual', 'Tallinn Manual 2.0: an expert manual on how international law applies to cyber operations.'],
  ['DA-ASAT', 'Direct-ascent anti-satellite: a missile launched from Earth to destroy or damage a satellite.'],
  ['Draft treaty, Draft treaty II', 'The draft Treaty on the Prevention of the Placement of Weapons in Outer Space (PPWT), put forward by Russia and China, and its updated version.'],
  ['GNSS', 'Global navigation satellite systems, such as GPS.'],
  ['ITU', 'International Telecommunication Union, the United Nations agency for telecommunications.'],
  ['ITU Board', 'The ITU Radio Regulations Board.'],
  ['ITU rules', 'Articles 45 and 48 of the Constitution of the ITU: harmful interference; military radio services.'],
  ['McGill Manual', 'McGill Manual on International Law Applicable to Military Uses of Outer Space (MILAMOS).'],
  ['PAROS', 'Prevention of an Arms Race in Outer Space.'],
  ['Test ban', 'The Limited Test Ban Treaty (1963), which bans nuclear tests in space.'],
  ['UN 75/36, UN 77/41', 'United Nations General Assembly resolutions.'],
  ['UN working group', 'The UN Open-ended Working Group on space threats.'],
  ['US pledge', 'The 2022 United States moratorium on destructive direct-ascent anti-satellite tests.'],
  ['Russian veto', 'Russia’s April 2024 veto of a UN Security Council draft on nuclear weapons in orbit. The draft did not concern anti-satellite testing.'],
  ['Woomera', 'Woomera Manual: an expert manual on the international law of military space operations.'],
  ['Asterisk (*)', 'Soft law: an expert manual, not binding.'],
];
// The abbreviations as running text, for the saved image (the file has no glossary list).
export const ABBR_NOTE = GLOSSARY.map(([t, d]) => `${t}: ${d}`).join(' ');

// ---------------------------------------------------------------- symbols
// One definition per kind, used by the points on the chart, the key and the saved image, so a swatch is always the symbol it names.
// Each symbol is about 14 px across with a 1.5 px outline in the background colour (paint-order puts the outline under the fill).
const BG = 'var(--ground)',
  FILLED = `fill:var(--accent);stroke:${BG};stroke-width:3;paint-order:stroke;stroke-linejoin:round`,
  UNDER = (w) => `fill:${BG};stroke:${BG};stroke-width:${w};stroke-linejoin:round;stroke-linecap:round`;
const SYMBOLS = {
  treaty: `<circle r="6.75" style="${FILLED}"/>`,
  resolution: `<rect x="-6" y="-6" width="12" height="12" rx="2.2" style="${FILLED}"/>`,
  unilateral: `<path d="M0,-8.6L7.8,5.2L-7.8,5.2Z" style="${FILLED}"/>`,
  soft:
    `<path d="M0,-8.2L8.2,0L0,8.2L-8.2,0Z" style="${UNDER(5.4)}"/>` +
    `<path d="M0,-8.2L8.2,0L0,8.2L-8.2,0Z" style="fill:${BG};stroke:var(--accent-2);stroke-width:2.2;stroke-linejoin:round"/>`,
  veto:
    `<path d="M-5.6,-5.6L5.6,5.6M5.6,-5.6L-5.6,5.6" style="fill:none;stroke:${BG};stroke-width:6.6;stroke-linecap:round"/>` +
    `<path d="M-5.6,-5.6L5.6,5.6M5.6,-5.6L-5.6,5.6" style="fill:none;stroke:var(--warn);stroke-width:3.4;stroke-linecap:round"/>`,
  draft: `<circle r="6" style="${UNDER(5)}"/>` + `<circle r="6" pathLength="14" style="fill:${BG};stroke:var(--accent);stroke-width:2;stroke-dasharray:1 1"/>`,
};
// A negotiation period is a bar, not a point. Its look is shared by the chart and the key.
const BAR_STYLE = 'fill:var(--accent);fill-opacity:.42';
export const glyphMarkup = (kind) => SYMBOLS[kind] ?? SYMBOLS.draft;
export function legalGlyph(sel, l) {
  return sel
    .append('g')
    .attr('class', 'glyph')
    .html(glyphMarkup(legalKindOf(l)));
}

// ---------------------------------------------------------------- the band
function lightLinked(lawId) {
  document.querySelectorAll('.mark.linked').forEach((n) => n.classList.remove('hl', 'linked'));
  if (!lawId) return;
  for (const p of D.lag_pairs.pairs)
    if (p.law === lawId) document.querySelectorAll(`#svgA [data-id="${p.event}"], #svgC [data-id="${p.event}"], #svgR [data-id="${p.event}"]`).forEach((n) => n.classList.add('hl', 'linked'));
}
const ZOOM = [parse('2021-06-01'), parse('2026-07-01')];
// On a wide screen the zoom's time axis starts and ends at the same page positions as the main chart's, so the panel's own padding is taken off its gutters.
function zoomGutters(el, M) {
  const cs = el.parentElement ? getComputedStyle(el.parentElement) : null,
    pl = cs ? parseFloat(cs.paddingLeft) || 0 : 0,
    pr = cs ? parseFloat(cs.paddingRight) || 0 : 0;
  return { l: Math.max(8, M.l - pl), r: Math.max(8, M.r - pr) };
}
let linkBox = null; // where the shaded window sits on the band (read when the connector to the zoom panel is drawn)
export function drawLegal(el = document.getElementById('legalSvg'), zoom = false) {
  el.innerHTML = '';
  const page = !EXPORTING && el.id === 'legalSvg',
    // On phones the band becomes a sideways-scrolling strip (desktop layout at 1100 px), scrolled to the recent cluster.
    strip = isPhoneNow() && !zoom && !EXPORTING && el.id === 'legalSvg',
    compact = legalCompact && !isPhoneNow() && !EXPORTING && !zoom,
    // On a window of 950 px or less the pinned strip gives up its names (they show on hover and focus) and keeps one thin row of symbols, so it takes about 65 px
    tight = compact && innerHeight <= 950;
  if (page) drawLawMini();
  if (page) drawOverview(strip);
  if (page) {
    const tap = document.getElementById('legalTap');
    tap.hidden = !strip;
    if (strip && !tap.dataset.on) tap.textContent = 'Tap a symbol for its name and date.';
  }
  el.style.overflowX = strip ? 'auto' : '';
  if (strip) {
    el.tabIndex = 0;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Law and policy timeline, scrolls sideways');
  } else {
    el.removeAttribute('tabindex');
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
  }
  const win = zoom ? ZOOM : compact && stripDom ? stripDom : DOMAIN,
    windowed = win !== DOMAIN,
    L = layout(el, win, strip ? 1100 : 300),
    W = L.W,
    // The zoom panel has no y axis to leave room for, so on a phone its time axis runs almost edge to edge; on a wide screen it shares the main chart's gutters so the two axes line up.
    M = zoom ? (isPhoneNow() ? { l: 18, r: 18 } : zoomGutters(el, L.M)) : L.M,
    x = zoom
      ? d3
          .scaleUtc()
          .domain(ZOOM)
          .range([M.l, W - M.r])
      : L.x;
  const FS = 13,
    PITCH = compact ? 14 : 17,
    TP = tight ? 10 : compact ? 12 : strip ? 21 : 31, // vertical distance between the rows that crowded symbols are stacked in
    SEP = compact ? 18 : 24, // symbols closer than this (in px) go into the next row; each keeps its true date on the axis
    GS = compact ? 0.7 : 1,
    OFF0 = 22; // first label row, below the line
  const spans = LEGAL.filter(
    (l) =>
      l.kind === 'negotiation_span' &&
      (l.end || l.id === 'paros-1981') &&
      (!windowed || ((l.end ? parse(l.end) : DOMAIN[1]) > win[0] && parse(l.start) < win[1])),
  );
  const pts = LEGAL.filter((l) => !spans.includes(l) && (!windowed || (x(parse(l.start)) >= M.l - 1 && x(parse(l.start)) <= W - M.r + 1))).sort((a, b) =>
    a.start < b.start ? -1 : 1,
  );
  // 1. Crowded symbols are stacked into rows (the true date stays on the axis).
  const last = [];
  let maxT = 0;
  pts.forEach((d) => {
    const cx = x(parse(d.start));
    let t = 0;
    while (last[t] != null && cx - last[t] < SEP) t++;
    last[t] = cx + (hasScene(d) ? 8 : 0);
    d._t = t;
    d._cx = cx;
    maxT = Math.max(maxT, t);
  });
  // 2. Label placement. Coordinates are relative to the symbol line: up is negative, down is positive.
  const pl = new Placer({ x0: 4, x1: W - 4, y0: -999, y1: 999 }),
    labels = [];
  let maxUp = -1,
    maxDn = -1,
    maxExt = 0; // how far above the symbol line the highest label reaches
  const zx0 = x(ZOOM[0]),
    zx1 = x(ZOOM[1]);
  // The 2021 to 2026 crowd is named in the zoom panel (and in the saved image), so it carries no labels on the band, on a phone too.
  const crowd = (d) => !zoom && d._cx >= zx0 - 2;
  if (!compact) {
    pts.forEach((d) => {
      pl.add([d._cx - 9.5, -d._t * TP - 10 - (hasScene(d) ? 12 : 0), d._cx + (hasScene(d) ? 16 : 9.5), -d._t * TP + 10], 'G');
      if (d._t) pl.add([d._cx - 1.5, -d._t * TP, d._cx + 1.5, 0], 'S');
    });
    // The shaded window belongs to the zoom panel: no other label runs into it.
    if (!zoom && !strip) pl.add([zx0 - 1, -999, zx1 + 1, 999], 'W');
    // Clusters of nearby symbols are solved together. Several deterministic strategies (labels ending at their symbol, starting at it, centred, V-shaped
    // splits) run on rows above and below the line; the one needing the fewest rows wins, and among equals the one with the longest names. Each label takes
    // the longest of its three names that fits where it is placed. Every label and leader is tested against all other labels, symbols, leaders and the edges.
    // Name lengths to try, longest first. When a cluster cannot be solved with all four, it is solved again with only the shorter ones.
    const tierSets = strip || (zoom && isPhoneNow()) ? [[3]] : [[0, 1, 2, 3], [2, 3], [3]];
    const text = (d, tier) => {
      const name = nameAt(d, [0, 1, 1, 2][tier]),
        date = tier < 2 ? `, ${zoom ? fmtMY(parse(d.start)) : fmtY(parse(d.start))}` : '';
      return { name, date, tier, w: tw(name, FS, 600) + (date ? tw(date, FS) : 0) };
    };
    // A label above the line sits just above its own symbol (and its cube icon), and climbs only where something is in the way.
    const upBase = (d) => d._t * TP + 24 + (hasScene(d) ? 7 : 0);
    const clusters = [];
    pts
      .filter((d) => !crowd(d))
      .forEach((d) => {
        const c = clusters.at(-1);
        if (c && (zoom || d._cx - c.at(-1)._cx < 200)) c.push(d);
        else clusters.push([d]);
      });
    // The preferred side comes first; the others are there so a label near an edge or in a tight cluster can still find room.
    const anchorsOf = {
      end: [
        ['end', -2],
        ['middle', 0],
        ['start', 2],
      ],
      start: [
        ['start', 2],
        ['middle', 0],
        ['end', -2],
      ],
      middle: [
        ['middle', 0],
        ['end', -2],
        ['start', 2],
      ],
    };
    // The longest name is tried first, in the rows near the symbol (further out in the zoom panel, which has room); a shorter name is used only when the
    // longer one cannot be placed without covering something. A label keeps to its preferred side at every row before it tries another side, so an early
    // label never takes a spot that would block the leader of a later neighbour.
    const place = (d, prim, tiers) => {
      for (const tier of tiers || []) {
        const t = text(d, tier),
          kmax = tier === 3 ? 11 : zoom ? 4 : 2;
        for (const [anchor, dx] of anchorsOf[prim] || [])
          for (let k = 0; k <= kmax; k++)
            // Phone strip: a raised symbol hangs its label ABOVE first (within two rows), so its leader does not run down through the symbol line.
            for (const dir of strip && d._t && k < 2 ? ['up', 'dn'] : ['dn', 'up']) {
              const off = dir === 'up' ? -(upBase(d) + k * PITCH) : OFF0 + k * PITCH,
                q = pl.textRect(d._cx + dx, off, anchor, t.w, FS);
              const ld = dir === 'up' ? [d._cx - 0.75, off + 3, d._cx + 0.75, -d._t * TP - 10] : [d._cx - 0.75, 10, d._cx + 0.75, off - FS];
              if (pl.free(q) && pl.free(ld, ['G', 'L', 'S'])) return { q, ld, hit: { d, ...t, tx: d._cx + dx, off, anchor, dir, k } };
            }
      }
      return null;
    };
    const run = (order, prim, commit, tiers) => {
      const base = pl.r.length,
        out = [];
      let mu = -1,
        md = -1,
        cross = 0,
        shortened = 0,
        ext = 0,
        ok = true;
      for (const d of order) {
        const f = place(d, prim(d), tiers);
        if (!f) {
          ok = false;
          break;
        }
        const { hit } = f;
        pl.r.push([...f.q, 'T'], [...f.ld, 'L']);
        shortened += hit.tier;
        if (hit.dir === 'up') ((mu = Math.max(mu, hit.k)), (ext = Math.max(ext, -hit.off)));
        else {
          md = Math.max(md, hit.k);
          if (d._t) cross++;
        }
        out.push(hit);
      }
      if (!commit || !ok) pl.r.length = base;
      return ok ? { out, mu, md, cost: mu + 1 + (md + 1) + (strip ? cross * 0.4 : 0) + shortened * 0.6, ext } : null;
    };
    clusters.forEach((list) => {
      const cands = [];
      for (let m = 0; m <= list.length; m++) {
        const Lf = list.slice(0, m),
          Rt = list.slice(m).reverse(),
          prim = (d) => (list.indexOf(d) < m ? 'end' : 'start');
        cands.push({ order: [...Lf, ...Rt], prim }, { order: [...Rt, ...Lf], prim });
      }
      if (list.length === 1) cands.unshift({ order: list, prim: () => 'middle' });
      let best = null,
        use = null;
      for (const tiers of tierSets) {
        cands.forEach((c) => {
          const r = run(c.order, c.prim, false, tiers);
          if (r && (!best || r.cost < best.r.cost)) best = { c, r };
        });
        if (best) {
          use = tiers;
          break;
        }
      }
      if (!best) {
        console.warn(
          'legal labels unplaced',
          list.map((d) => d.id),
        );
        return;
      }
      const r = run(best.c.order, best.c.prim, true, use);
      if (!r) return;
      labels.push(...r.out);
      maxUp = Math.max(maxUp, r.mu);
      maxDn = Math.max(maxDn, r.md);
      maxExt = Math.max(maxExt, r.ext);
    });
  }
  // Sticky (compact) band: short names sit under the line where they fit; symbols that do not fit keep the hover and focus card.
  const cLabels = [];
  if (compact && !tight) {
    const p2 = new Placer({ x0: 2, x1: W - M.r + 2, y0: -999, y1: 999 }); // labels stop at the end of the axis
    pts
      .slice()
      .reverse()
      .forEach((d) => {
        const s = nameAt(d, 2),
          w = tw(s, FS, 600);
        for (const [anchor, dx] of [
          ['middle', 0],
          ['end', 5],
          ['start', -5],
        ]) {
          const q = p2.textRect(d._cx + dx, 18, anchor, w, FS);
          if (p2.free(q, [], 6)) {
            p2.add(q);
            cLabels.push({ d, s, tx: d._cx + dx, anchor });
            break;
          }
        }
      });
  }
  const yMark = compact ? TP * Math.max(maxT, 2) + (tight ? 6 : 10) : // the pinned strip keeps one height whatever the window shows
     Math.max(maxExt ? maxExt + 16 : 0, TP * maxT + (strip ? 20 : 28)),
    dnSpace = !compact && maxDn >= 0 ? OFF0 + maxDn * PITCH + 8 : 0;
  // Negotiation periods: bars in rows below the symbol line (and below any labels hanging under it), each named just above its bar.
  const lanes = [];
  spans
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .forEach((d) => {
      const a = Math.max(M.l, x(parse(d.start))),
        b = Math.min(W - M.r, d.end ? x(parse(d.end)) : x(DOMAIN[1]));
      let i = lanes.findIndex((e) => a > e + 6);
      if (i < 0) {
        i = lanes.length;
        lanes.push(0);
      }
      lanes[i] = b;
      d._lane = i;
      d._a = a;
      d._b = b;
    });
  const laneP = tight ? 5 : compact ? 8 : 26,
    lane0 = yMark + (tight ? 10 : compact ? 20 : Math.max(32, dnSpace + 26));
  const yAx = lane0 + (compact ? (Math.max(lanes.length, 2) - 1) * laneP + (tight ? 6 : 8) : lanes.length ? (lanes.length - 1) * laneP + 14 : 8),
    H = yAx + (tight ? 27 : compact ? 31 : 38); // the pinned strip keeps its year labels a clear 8 px above its bottom edge
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-label', zoom ? 'Law and policy timeline, enlarged to 2021 to 2026' : 'Law and policy timeline, 1957 to 2026');
  if (compact) document.getElementById('legalBand')?.style.setProperty('--row-h', Math.ceil(yMark + 30) + 'px'); // the one row of symbols and names kept while a table is read
  svg.append('title').text(zoom ? 'Law and policy, enlarged to 2021 to 2026' : 'Law and policy, 1957 to 2026');
  // A quiet grid at every decade (every year in the zoom), behind everything else.
  if (!compact)
    svg
      .append('g')
      .attr('class', 'gridline')
      .attr('transform', `translate(0,${yAx})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.utcYear.every(zoom ? 1 : 10))
          .tickSize(-(yAx - 6))
          .tickFormat(''),
      );
  if (!zoom) {
    // The shaded window is what the zoom panel enlarges. It is open at the bottom, where the connector to the panel starts.
    svg
      .append('rect')
      .attr('class', 'zoombox')
      .attr('x', zx0)
      .attr('width', zx1 - zx0)
      .attr('y', 1)
      .attr('height', H - 1)
      .attr('aria-hidden', 'true');
    svg.append('path').attr('class', 'zoomedge').attr('d', `M${zx0},${H}V1.5H${zx1}V${H}`).attr('aria-hidden', 'true');
    if (page && !compact && !strip) linkBox = { zx0, zx1, W };
  }
  svg
    .append('line')
    .attr('x1', M.l)
    .attr('x2', W - M.r)
    .attr('y1', yMark)
    .attr('y2', yMark)
    .style('stroke', 'var(--line-strong)')
    .style('stroke-width', compact ? 1 : 1.5);
  if (compact)
    svg
      .append('text')
      .attr('class', 'band-label')
      .attr('x', 2)
      .attr('y', yMark - 2)
      .text('Law and')
      .append('tspan')
      .attr('x', 2)
      .attr('dy', 13)
      .text('policy');
  // labels and their leaders
  const lg = svg.append('g').attr('class', 'lbls').attr('aria-hidden', 'true');
  const TONE = { normal: ['var(--text)', 'var(--muted)'], soft: ['var(--accent-2)', 'var(--accent-2)'], quiet: ['var(--muted)', 'var(--muted)'] };
  const putLabel = (g, x0, y0, anchor, name, date, tone, fx) => {
    const t = g
      .append('text')
      .attr('class', 'lab')
      .attr('data-fx', fx) // the x of the symbol the label names: "Scrub through time" fades the whole label while that symbol is still ahead of the slider
      .attr('x', x0)
      .attr('y', y0)
      .attr('text-anchor', anchor)
      .style('fill', TONE[tone][0])
      .style('font', `600 ${FS}px var(--sans)`);
    t.append('tspan').attr('class', 'n').text(name);
    if (date) t.append('tspan').attr('class', 'd').style('font-weight', 400).style('fill', TONE[tone][1]).text(date);
  };
  labels.forEach(({ d, name, date, tx, off, anchor, dir }) => {
    // a leader only where the label is not right beside its symbol
    if (dir === 'up' && off + 3 < -d._t * TP - 16)
      lg.append('line')
        .attr('x1', d._cx)
        .attr('x2', d._cx)
        .attr('y1', yMark + off + 3)
        .attr('y2', yMark - d._t * TP - 10)
        .attr('data-fx', d._cx)
        .style('stroke', 'var(--line-strong)');
    else if (dir === 'dn' && off - FS > 10)
      lg.append('line')
        .attr('x1', d._cx)
        .attr('x2', d._cx)
        .attr('y1', yMark + 10)
        .attr('y2', yMark + off - FS)
        .attr('data-fx', d._cx)
        .style('stroke', 'var(--line-strong)');
    putLabel(lg, tx, yMark + off, anchor, name, date, d.soft_law ? 'soft' : 'normal', d._cx);
  });
  cLabels.forEach(({ d, s, tx, anchor }) => putLabel(lg, tx, yMark + 18, anchor, s, '', d.soft_law ? 'soft' : 'normal', d._cx));
  // negotiation periods: soft rounded bars with a direct label above each
  const sg = svg
    .append('g')
    .selectAll('g')
    .data(spans)
    .join('g')
    .attr('class', 'mark')
    .attr('role', 'button')
    .attr('data-id', (d) => d.id)
    .attr('data-t', (d) => +parse(d.start))
    .attr('aria-label', (d) => `${d.title}, ${fmtY(parse(d.start))} to ${d.end ? fmtY(parse(d.end)) : 'present'}. ${d.short_note}`);
  const barH = compact ? 4 : 7;
  sg.append('rect')
    .attr('class', 'hit')
    .attr('rx', 8)
    .attr('x', (d) => Math.min(d._a - 2, (d._a + d._b) / 2 - 12))
    .attr('width', (d) => Math.max(24, d._b - d._a + 4))
    .attr('y', (d) => lane0 + d._lane * laneP - (compact ? 6 : 12))
    .attr('height', compact ? 16 : 26);
  sg.append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => d._a)
    .attr('width', (d) => Math.max(4, d._b - d._a))
    .attr('y', (d) => lane0 + d._lane * laneP + (compact ? 0 : 3))
    .attr('height', barH)
    .attr('rx', barH / 2)
    .attr('style', BAR_STYLE);
  if (!compact) {
    // Each negotiation period is named just above its bar: the longest of its three names that fits beside the names already placed.
    // Names are tried longest first; if any bar cannot be named without touching another label, every bar is tried again with shorter names.
    const sizesFrom = (n) => (strip || (zoom && isPhoneNow()) ? [2] : [0, 1, 2].filter((z) => z >= n));
    const mins = spans.map(() => 0);
    const attempt = (force) => {
      const sp = new Placer({ x0: 4, x1: W - 4, y0: -999, y1: 999 }),
        out = [];
      for (const [i, d] of spans.entries()) {
        const y = lane0 + d._lane * laneP - 3;
        let done = false;
        for (const size of sizesFrom(mins[i])) {
          const name = nameAt(d, size),
            w = tw(name, FS, 600),
            spot = [
              ['start', d._a],
              ['end', Math.min(W - 6, d._b)],
            ].find(([anchor, tx]) => sp.free(sp.textRect(tx, y, anchor, w, FS), [], 8));
          if (spot || (force && size === 2)) {
            const [anchor, tx] = spot ?? (d._a + w > W - 6 ? ['end', Math.min(W - 6, d._b)] : ['start', d._a]);
            sp.add(sp.textRect(tx, y, anchor, w, FS));
            out.push([tx, y, anchor, name, d._a]);
            done = true;
            break;
          }
        }
        if (!done) return i;
      }
      return out;
    };
    let placed = attempt(false);
    // a bar that finds no room makes the nearest earlier bar with a longer name use a shorter one, then tries again
    for (let k = 0; k < 12 && typeof placed === 'number'; k++) {
      const j = [...mins.keys()].filter((q) => q < placed && mins[q] < 2).at(-1);
      if (j == null) break;
      mins[j]++;
      placed = attempt(false);
    }
    if (typeof placed === 'number') placed = attempt(true);
    placed.forEach(([tx, y, anchor, name, fx]) => putLabel(lg, tx, y, anchor, name, '', 'quiet', fx));
  }
  bindMark(sg, strip ? null : legalCard, strip ? tapLegal : activate);
  // symbols
  pts.forEach((d) => {
    d._y = yMark - d._t * TP;
  });
  svg
    .append('g')
    .selectAll('line')
    .data(pts.filter((d) => d._t))
    .join('line')
    .attr('x1', (d) => d._cx)
    .attr('x2', (d) => d._cx)
    .attr('y1', (d) => d._y)
    .attr('y2', yMark)
    .style('stroke', 'var(--line-strong)')
    .style('stroke-width', 1);
  svg
    .append('g')
    .selectAll('circle')
    .data(pts.filter((d) => d._t))
    .join('circle')
    .attr('cx', (d) => d._cx)
    .attr('cy', yMark)
    .attr('r', compact ? 1.5 : 2.5)
    .style('fill', 'var(--faint)');
  const pg = svg
    .append('g')
    .selectAll('g')
    .data(pts)
    .join('g')
    .attr('class', 'mark')
    .attr('role', 'button')
    .attr('data-id', (d) => d.id)
    .attr('data-t', (d) => +parse(d.start))
    .attr('transform', (d) => `translate(${d._cx},${d._y})${GS < 1 ? ` scale(${GS})` : ''}`)
    .attr(
      'aria-label',
      (d) => `${d.title}, ${fmt(parse(d.start))}. ${legalKindWords(d)}. ${d.short_note}${hasScene(d) ? ' Select to open a 3D explainer.' : ''}`,
    );
  pg.append('circle')
    .attr('class', 'hit')
    .attr('r', 12 / GS);
  pg.each(function (d) {
    legalGlyph(d3.select(this), d);
    if (hasScene(d)) badge(d3.select(this), 12, -16);
  });
  bindMark(pg, strip ? null : legalCard, strip ? tapLegal : activate);
  // Pointing at a law also lights the weapon points our records link to it, on the charts below (the shared years line them up with the law)
  pg.on('mouseenter.guide focus.guide', (ev, d) => (setGuide(parse(d.start)), lightLinked(d.id))).on('mouseleave.guide blur.guide', () => (setGuide(null), lightLinked(null)));
  sg.on('mouseenter.guide focus.guide', (ev, d) => (setGuide(parse(d.start)), lightLinked(d.id))).on('mouseleave.guide blur.guide', () => (setGuide(null), lightLinked(null)));
  rove(svg.selectAll('.mark'));
  svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${yAx})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(d3.utcYear.every(zoom ? 1 : 10))
        .tickFormat(fmtY)
        .tickSizeOuter(0),
    );
  addGuide(svg, x, 0, yAx, zoom ? 'legalzoom' : 'legal');
  lg.raise(); // labels (with a background outline, see CSS) sit above the guide line so it never strikes through them
  if (!EXPORTING && !strip) hooks.scrubVeil?.(svg, x, 0, yAx); // "Scrub through time" fogs the years the slider has not reached, labels included
  if (strip) {
    // Start at 1957, so the first treaties are in the first view; the line under the strip says how much is in view and which way to scroll for later years.
    el.scrollLeft = 0;
    el._x = x;
    el.onscroll = stripPos;
    stripPos();
  } else if (page) {
    el.onscroll = null;
    document.getElementById('stripPos').hidden = true;
  }
  if (page && !zoom) drawLink();
}
// The soft beam from the shaded window on the band down to the zoom panel. Only drawn where the band sits in its natural place on a wide screen.
function drawLink() {
  const box = document.getElementById('legalLink');
  if (!box) return;
  if (!linkBox || isPhoneNow()) {
    box.innerHTML = '';
    return;
  }
  const { zx0, zx1, W } = linkBox,
    h = 40,
    c1 = h * 0.55,
    c2 = h * 0.45;
  box.innerHTML =
    `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    `<path class="beam" d="M${zx0},0H${zx1}C${zx1},${c1} ${W},${c2} ${W},${h}H0C0,${c2} ${zx0},${c1} ${zx0},0Z"/>` +
    `<path class="edge" d="M${zx0},0C${zx0},${c1} 0,${c2} 0,${h}M${zx1},0C${zx1},${c1} ${W},${c2} ${W},${h}"/></svg>`;
}
// Phone only: the whole 1957 to 2026 span in two thin rows (tests above, laws below), with the window the scrolling strip shows. A tap moves the strip.
function drawOverview(strip) {
  const host = document.getElementById('legalOv');
  if (!host) return;
  host.hidden = !strip;
  if (!strip) {
    host.innerHTML = '';
    return;
  }
  const W = Math.max(300, host.clientWidth || host.parentElement.clientWidth),
    ml = 44,
    x = d3.scaleUtc().domain(DOMAIN).range([ml, W - 12]),
    H = 66,
    yT = 14,
    yL = 40;
  const g = d3.create('svg').attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
    .attr('aria-label', 'Overview of 1957 to 2026: anti-satellite tests above, laws and policies below. The outlined box is the part shown in the strip below.');
  g.append('rect').attr('class', 'ov-win').attr('x', ml).attr('y', 1).attr('width', 60).attr('height', H - 14).attr('rx', 4);
  g.append('text').attr('x', 0).attr('y', yT + 4).attr('class', 'lm-name').text('Tests');
  g.append('text').attr('x', 0).attr('y', yL + 4).attr('class', 'lm-name').text('Laws');
  KIN.forEach((e) => g.append('circle').attr('cx', x(parse(e.date))).attr('cy', yT).attr('r', 2.6).attr('class', 'ov-test'));
  LEGAL.filter((l) => l.kind !== 'negotiation_span').forEach((l) =>
    g.append('g').attr('transform', `translate(${x(parse(l.start))},${yL}) scale(.5)`).html(glyphMarkup(legalKindOf(l))),
  );
  [1960, 1980, 2000, 2020].forEach((yr) => {
    const px = x(parse(`${yr}-01-01`));
    g.append('text').attr('x', px).attr('y', H - 1).attr('text-anchor', 'middle').attr('class', 'lm-year').text(yr);
  });
  host.innerHTML = '';
  host.appendChild(g.node());
  const sv = document.getElementById('legalSvg');
  sv._ovW = W;
  g.on('click', (ev) => {
    const r = g.node().getBoundingClientRect(),
      yr = x.invert(ev.clientX - r.left),
      sx = sv._x;
    if (sx) sv.scrollTo({ left: Math.max(0, sx(yr) - sv.clientWidth / 2), behavior: 'smooth' });
  });
}
// Phone strip position: says how much of 1957 to 2026 is in view and which way to scroll.
function stripPos() {
  const el = document.getElementById('legalSvg'),
    box = document.getElementById('stripPos'),
    x = el._x;
  if (!x || !el.scrollWidth) return;
  const [r0, r1] = x.range(),
    sw = el.scrollWidth,
    a = el.scrollLeft,
    b = a + el.clientWidth,
    yr = (px) => Math.round(+fmtY(x.invert(Math.min(r1, Math.max(r0, px))))),
    y0 = a <= 2 ? 1957 : yr(a),
    y1 = b >= sw - 2 ? 2026 : yr(b);
  box.hidden = false;
  box.querySelector('.lab').textContent = `Showing ${y0} to ${y1}. Scroll sideways for ${a > 2 ? 'earlier' : 'later'} years.`;
  const hint = document.getElementById('stripEdge');
  if (hint) hint.hidden = a <= 2;
  const more = document.getElementById('stripMore');
  if (more) more.hidden = b >= sw - 2;
  const win = document.querySelector('#legalOv .ov-win');
  if (win) {
    const ox = x.range();
    win.setAttribute('x', ox[0] + ((a / sw) * (el._ovW - ox[0] - 12)));
    win.setAttribute('width', Math.max(10, (el.clientWidth / sw) * (el._ovW - ox[0] - 12)));
  }
  const f = box.querySelector('i');
  f.style.left = (100 * a) / sw + '%';
  f.style.width = (100 * el.clientWidth) / sw + '%';
}
// Phone strip: tapping a symbol names it under the strip (title, date, kind and note, plus a button for the 3D explainer if there is one).
function tapLegal(d, el) {
  const box = document.getElementById('legalTap'),
    when = d.end ? `${fmtY(parse(d.start))}–${fmtY(parse(d.end))}` : fmt(parse(d.start));
  box.innerHTML =
    `<b>${esc(d.title)}</b> · ${when} · ${legalKindWords(d)}<br>${esc(d.short_note)}` +
    `${hasScene(d) ? '<br><button class="btn small" type="button"><svg class="ico" aria-hidden="true"><use href="#i-cube"/></svg>Open the 3D explainer</button>' : ''}`;
  box.dataset.on = '1';
  box.hidden = false;
  box.querySelector('button')?.addEventListener('click', () => hooks.openScene(d.scene_3d, el));
  document.querySelectorAll('#legalSvg .mark.hl').forEach((m) => m.classList.remove('hl'));
  el.classList.add('hl');
  setGuide(parse(d.start));
}
// Phone only: a slim copy of the law timeline (about 40 px) stays at the top of the screen while the anti-satellite, jamming and close-approach charts are
// read, on the same years as those charts, so each chart can still be read against the law.
let miniFor = 'chartA';
export function drawLawMini() {
  const host = document.getElementById('lawMini'),
    inner = host?.firstElementChild;
  if (!inner) return;
  if (!isPhoneNow()) {
    inner.innerHTML = '';
    host.classList.remove('on');
    return;
  }
  const L1 = layout(host),
    W = L1.W,
    M = { l: miniFor === 'chartA' ? 50 : 40, r: L1.M.r }, // the anti-satellite chart leaves room for its altitude numbers
    x = d3.scaleUtc().domain(DOMAIN).range([M.l, W - M.r]);
  const H = 40,
    yL = 24;
  const g = d3.create('svg').attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'presentation');
  g.append('text').attr('x', 0).attr('y', 15).attr('class', 'lm-name').text('Law');
  g.append('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', yL).attr('y2', yL).attr('class', 'lm-axis');
  LEGAL.filter((l) => l.kind === 'negotiation_span' && (l.end || l.id === 'paros-1981')).forEach((l) => {
    const a = x(parse(l.start)),
      b = l.end ? x(parse(l.end)) : x(DOMAIN[1]);
    g.append('rect').attr('x', a).attr('y', yL - 2).attr('width', Math.max(3, b - a)).attr('height', 4).attr('rx', 2).attr('style', BAR_STYLE);
  });
  LEGAL.filter((l) => l.kind !== 'negotiation_span').forEach((l) => {
    g.append('g')
      .attr('transform', `translate(${x(parse(l.start))},${yL - 9}) scale(.58)`)
      .html(glyphMarkup(legalKindOf(l)));
  });
  [1960, 1980, 2000, 2020].forEach((yr) => {
    const px = x(parse(`${yr}-01-01`));
    g.append('line').attr('x1', px).attr('x2', px).attr('y1', yL).attr('y2', yL + 4).attr('class', 'lm-axis');
    g.append('text').attr('x', px).attr('y', 38).attr('text-anchor', 'middle').attr('class', 'lm-year').text(yr);
  });
  inner.innerHTML = '';
  inner.appendChild(g.node());
  miniShow();
}
// Shown from the top of the test chart to its end, and again over the jamming and close-approach tabs of "Explore the data" (the two tabs on the shared years).
function miniShow() {
  const host = document.getElementById('lawMini');
  if (!host || !isPhoneNow()) return;
  const a = document.getElementById('chartA').getBoundingClientRect(),
    ex = document.getElementById('explore'),
    e = ex.getBoundingClientRect(),
    inA = a.top <= 2 && a.bottom > 60,
    inX = ex.dataset.years === '1' && e.top <= 2 && e.bottom > 60;
  host.classList.toggle('on', inA || inX);
  const now = inX ? 'chartC' : 'chartA';
  if (now !== miniFor) {
    miniFor = now;
    drawLawMini();
  }
}
let legalCompact = false;
let bandFullH = 0;
let stripDom = null; // the window the sticky strip shows while a zoomed chart is under it
// The 2021 to 2026 zoom starts folded, so the first screen of the timeline shows laws and tests together. The button opens it; it also opens for print and for a
// keyboard or link visit to anything inside it. Folded, it stays laid out at full width (only its height is 0), so its drawing never needs redoing.
export function setZoomOpen(open, scrollTo) {
  const wrap = document.getElementById('legalZoomWrap'),
    btn = document.getElementById('zoomBtn');
  if (!wrap || !btn) return;
  const was = wrap.classList.contains('open');
  wrap.classList.toggle('open', open);
  wrap.classList.remove('settled');
  btn.setAttribute('aria-expanded', String(open));
  btn.querySelector('span').textContent = open ? 'Close the 2021–2026 zoom' : 'Zoom in on 2021–2026';
  btn.querySelector('use').setAttribute('href', open ? '#i-minus' : '#i-zoom');
  const done = () => wrap.classList.toggle('settled', wrap.classList.contains('open'));
  clearTimeout(setZoomOpen.t);
  setZoomOpen.t = setTimeout(done, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 340);
  if (open && !was && scrollTo) requestAnimationFrame(() => legalScroll());
}
export function initZoomControl() {
  document.getElementById('zoomBtn')?.addEventListener('click', () => setZoomOpen(!document.getElementById('legalZoomWrap').classList.contains('open')));
  addEventListener('beforeprint', () => setZoomOpen(true));
}
// The zoom panel scrolls up under the pinned strip: it fades out along the strip's bottom edge, so it is never cut off mid-line.
function fadeZoom() {
  const band = document.getElementById('legalBand'),
    zb = document.getElementById('legalZoomBox');
  if (!band || !zb) return;
  const bb = band.getBoundingClientRect(),
    zr = zb.getBoundingClientRect(),
    open = document.getElementById('legalZoomWrap')?.classList.contains('open') !== false,
    overlap = isPhoneNow() || !open ? 0 : bb.bottom - zr.top;
  zb.classList.toggle('under-strip', overlap > 1 && zr.bottom > bb.bottom && getComputedStyle(band).visibility !== 'hidden');
  zb.style.setProperty('--under', Math.max(0, Math.round(overlap)) + 'px');
}
// Hides the pinned strip at once (a link or a tab is about to take the reader to a chart that does not use the shared years; legalScroll puts it back if not)
let offUntil = 0; // until then the strip stays away whatever the scroll position says (the page is about to jump)
export function legalOff() {
  if (isPhoneNow()) return;
  offUntil = performance.now() + 700;
  document.getElementById('legalBand')?.classList.add('off');
}
export function legalScroll() {
  legalScrollMain();
  fadeZoom();
}
function legalScrollMain() {
  miniShow();
  const band = document.getElementById('legalBand'),
    tr = document.getElementById('timeline').getBoundingClientRect();
  // The chapter's heading names the strip; once it has scrolled off (a link lands past it in a short window) the strip carries the name itself, in its corner.
  const lh = document.getElementById('lawHead');
  band.classList.toggle('head-gone', !isPhoneNow() && !!lh && lh.getBoundingClientRect().bottom < 8);
  // The strip implies a shared calendar axis, so it stays only over charts that use it: the test chart and, in "Explore the data", the jamming and close-approach
  // tabs, from the top of the drawing. It steps aside over "What the pattern shows", over the two tabs with their own scales (decades; years to law) and at the end of the timeline.
  const pat = document.getElementById('pattern'),
    ex = document.getElementById('explore'),
    bh = band.offsetHeight + 24,
    exOver = !!ex && ex.getBoundingClientRect().bottom < innerHeight * 0.7, // the chart section has been read to its end: the sources and the footer are what is on screen
    // in "Explore the data" the strip comes only once the open chart's own drawing (the part that shares its years) reaches it, never over the heading, the cards or the notes
    xBox = ex && ex.dataset.years === '1' ? document.querySelector('.xpanel:not([data-off]) .svgbox') : null,
    exAligned = !!xBox && xBox.getBoundingClientRect().top < bh;
  band.classList.toggle('off', !isPhoneNow() && (performance.now() < offUntil || (!!pat && pat.getBoundingClientRect().top < bh && !exAligned) || (exOver && tr.top < 0)));
  // The strip shrinks to its short form only once the band's own place in the page has scrolled out by the amount it shrinks, so the space it
  // keeps for the content below stays hidden behind the pinned strip (no blank band between the strip and the zoom panel).
  const topY = document.getElementById('bandTop').getBoundingClientRect().top,
    bandH = parseFloat(document.documentElement.style.getPropertyValue('--band-h')) || 0,
    shrink = bandH ? Math.max(0, (legalCompact ? bandFullH : band.offsetHeight) - bandH) : 0;
  const stuck = !isPhoneNow() && topY <= -shrink - 0.5 && tr.top < -1 && tr.bottom > 200;
  // which chart is under the strip decides the years it shows (a zoomed chart: its own window)
  // (the chart that fills most of the view below the strip: a link can leave a zoomed chart a little under the strip's edge, not behind it)
  const bandH2 = band.offsetHeight,
    under = ['chartR', 'chartC']
      .map((id) => {
        const e = document.getElementById(id);
        if (!e || e.hasAttribute('data-off')) return null;
        const r = e.getBoundingClientRect();
        return { id, seen: Math.min(r.bottom, innerHeight) - Math.max(r.top, bandH2) };
      })
      .filter((c) => c && c.seen > 120)
      .sort((p, q) => q.seen - p.seen)[0]?.id;
  const want = stuck && under ? chartWindow[under] : null;
  const changed = stuck && want !== stripDom;
  // While a data table is open on screen the strip shrinks to its one row of names, so the table's headings and first rows stay clear of it. This happens only
  // once the strip is in its short form: its full height is measured (bandFullH, --band-full-h) with the strip whole, never while it is cut to its one row, so
  // the room kept for it below, and everything under that, is the same however the page was reached.
  const applyReading = () => {
    const reading =
      stuck &&
      legalCompact &&
      [...document.querySelectorAll('details.table[open] .tscroll, details.about[open]')].some((t) => {
        const r = t.getBoundingClientRect();
        return r.top < innerHeight - 80 && r.bottom > 140;
      });
    if (reading !== band.classList.contains('reading')) {
      band.classList.toggle('reading', reading);
      if (stuck) band.style.marginBottom = Math.max(0, bandFullH - band.offsetHeight) + 'px';
    }
  };
  if (stuck === legalCompact && !changed) return applyReading();
  if (band.contains(document.activeElement) && document.activeElement.closest('svg')) return applyReading(); // never rebuild under a focused symbol
  band.classList.remove('reading'); // the strip is measured whole; applyReading puts the one-row form back below
  const h0 = band.offsetHeight;
  if (!legalCompact) (bandFullH = h0), document.documentElement.style.setProperty('--band-full-h', h0 + 'px');
  legalCompact = stuck;
  stripDom = want;
  drawLegal();
  band.classList.toggle('compact', stuck);
  if (!stuck) band.classList.remove('reading');
  if (stuck) document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px');
  band.style.marginBottom = stuck ? Math.max(0, (bandFullH || h0) - band.offsetHeight) + 'px' : '0px';
  applyReading();
}
// "Find it on the chart": brings a mark into view under the pinned strip without ever leaving the chart's heading half under it. Where the chart's own landing (the one an
// address like #chartA gives: the heading just below the strip) shows the mark, the page lands there. Otherwise the mark is centred in the room under the strip and the
// heading is either whole below the strip or wholly behind it, never cut across by its edge. The strip's height at a candidate position is worked out from where the
// strip's own place in the page sits (the strip is whole until that place has scrolled up by the difference between its two heights), then the landing is checked once more
// when the scroll has ended, with the strip as it really is.
export function landOnMark(m, smooth) {
  const sec = m.closest('section.chart'),
    head = sec?.querySelector('h2, h3, h4'),
    band = document.getElementById('legalBand'),
    root = document.documentElement,
    num = (v) => parseFloat(v) || 0;
  if (isPhoneNow() || !sec || !head || !band) return void m.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  const doc = (el) => {
      const r = el.getBoundingClientRect();
      return { t: r.top + scrollY, b: r.bottom + scrollY };
    },
    bandH = num(root.style.getPropertyValue('--band-h')) || band.offsetHeight,
    full = num(root.style.getPropertyValue('--band-full-h')) || bandH,
    shrink = Math.max(0, full - bandH),
    topDoc = doc(document.getElementById('bandTop')).t,
    years = sec.id === 'chartA' || sec.closest('#explore')?.dataset.years === '1',
    box = sec.id === 'chartA' ? null : sec.querySelector('.svgbox'),
    yr = sec.id === 'chartA' ? document.getElementById('yrBar') : null,
    mk = doc(m),
    hd = doc(head),
    cap = doc(sec.querySelector('.chapter-head') || head).b,
    vh = innerHeight,
    maxY = Math.max(0, document.documentElement.scrollHeight - vh),
    // the strip's lower edge with the page at y (0 where the strip is not shown over this chart)
    stripAt = (y) => {
      if (!years) return 0;
      const t = topDoc - y;
      if (box && doc(box).t - y >= bandH + 24 && t > -shrink) return 0;
      return t <= -shrink ? bandH : Math.max(0, t) + full;
    },
    // the first row of the chart that is clear: under the strip and, on the test chart, under the year slider that is pinned beneath it
    topAt = (y) => stripAt(y) + (yr && y + stripAt(y) > cap ? yr.offsetHeight + 10 : 8),
    fits = (y) => mk.t - y >= topAt(y) && mk.b - y <= vh - 12,
    clear = (y) => {
      const s = stripAt(y);
      return hd.t - y >= s + 2 ? 1 : hd.b - y <= s - 2 || hd.b - y <= 0 ? 2 : 0; // 1: the heading is whole below the strip, 2: wholly behind it, 0: cut by its edge
    },
    own = Math.min(maxY, Math.max(0, Math.round(sec.getBoundingClientRect().top + scrollY - num(getComputedStyle(sec).scrollMarginTop) - num(getComputedStyle(root).scrollPaddingTop)))),
    mid = (y) => Math.abs((mk.t + mk.b) / 2 - y - (topAt(y) + (vh - topAt(y)) / 2));
  let y = own;
  if (!(fits(own) && clear(own) === 1)) {
    let best = null;
    for (let c = 0; c <= maxY; c += 4) {
      const k = clear(c);
      if (!k || !fits(c)) continue;
      const score = (k === 1 ? 0 : 1e5) + mid(c);
      if (!best || score < best.score) best = { c, score };
    }
    // no position shows the mark and keeps the heading whole: the mark is centred and the heading's edge is moved clear of the strip
    if (!best) {
      let c = Math.round(mk.t + (mk.b - mk.t) / 2 - (topAt(own) + (vh - topAt(own)) / 2));
      c = Math.min(maxY, Math.max(0, c));
      best = { c };
    }
    y = best.c;
  }
  scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
  // the check once the scroll has ended: the heading cut by the strip's real edge moves out from under it (the mark stays in view when it can)
  let done = false;
  const stop = () => ((done = true), cleanup());
  const touch = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  const cleanup = () => touch.forEach((t) => removeEventListener(t, stop));
  touch.forEach((t) => addEventListener(t, stop, { passive: true, once: true }));
  const verify = () => {
    cleanup();
    if (done) return;
    done = true;
    legalScrollMain();
    const vis = getComputedStyle(band).visibility !== 'hidden' && !band.classList.contains('off'),
      s = vis ? band.getBoundingClientRect().bottom : 0,
      h = head.getBoundingClientRect(),
      r = m.getBoundingClientRect();
    if (!(h.top < s + 2 && h.bottom > s - 2)) return;
    const down = h.bottom - s + 4, // the heading goes wholly behind the strip
      up = h.top - s - 8; // or comes whole below it
    const okAfter = (d) => r.top - d >= s + 8 && r.bottom - d <= vh - 12;
    if (okAfter(down)) scrollBy({ top: down, behavior: 'instant' });
    else if (okAfter(up)) scrollBy({ top: up, behavior: 'instant' });
  };
  // it waits for the page to come to rest at the place chosen (the scroll is smooth), and gives up on its own after a few seconds
  let last = -1,
    still = 0,
    frames = 0;
  const wait = () => {
    if (done) return;
    still = scrollY === last ? still + 1 : 0;
    last = scrollY;
    if ((Math.abs(scrollY - y) <= 2 && still >= 3) || still >= 24 || ++frames > 240) return verify();
    requestAnimationFrame(wait);
  };
  requestAnimationFrame(wait);
}

// Measures the sticky (compact) band's height once per layout so section anchors clear it exactly (--band-h drives scroll-margin-top), and how far the
// band sits below the top of its chapter heading so a link to the band keeps that heading in view (--law-head-h).
export function probeBand() {
  const law = document.getElementById('law');
  if (law) {
    const pad = parseFloat(getComputedStyle(law).paddingTop) || 0;
    document.documentElement.style.setProperty('--law-head-h', Math.round(law.offsetHeight - pad + 16) + 'px');
  }
  if (isPhoneNow()) return;
  // "See the timeline" lands with the chapter heading at the top, which in a short window leaves the cluster of tests in low Earth orbit below the fold. The landing
  // moves down by the height of the heading, so the pinned strip, the test chart's heading and slider and the low-orbit tests arrive together.
  const tl = document.getElementById('timeline'),
    leo = document.querySelector('#svgA [data-zone="100"]');
  if (tl && leo) {
    const top = tl.getBoundingClientRect().top + scrollY,
      low = leo.getBoundingClientRect().bottom + scrollY - (top + 23), // where the bottom of the low-orbit zone sits on arrival (the timeline lands 23 px above the window)
      cap = (document.getElementById('lawHead')?.offsetHeight || 0) + 24;
    document.documentElement.style.setProperty('--land-extra', (low - innerHeight + 24 > 40 ? cap : 0) + 'px'); // all or nothing: a heading cut across its middle looks worse than either. 40 px: a cluster that ends under the window's lower edge (1920x1080 by 43 px) gets the same landing as 1440x900, heading above, cluster whole
  }
  const band = document.getElementById('legalBand'),
    was = legalCompact,
    root = document.documentElement.style;
  // The strip's two heights are measured here, once it is drawn, whatever state a scroll found it in: a jump made while the page was still loading (an address
  // with a #hash) can reach legalScroll before the strip has any content, and the full height it noted then (a few pixels) would leave no room kept under the
  // short form, so the sections below would sit higher than they do on any other visit.
  if (was) {
    legalCompact = false;
    band.classList.remove('compact', 'reading');
    drawLegal();
  }
  bandFullH = band.offsetHeight;
  root.setProperty('--band-full-h', bandFullH + 'px'); // the strip as it stands over the test chart's heading (see #chartA in charts.css)
  legalCompact = true;
  band.classList.add('compact');
  drawLegal();
  root.setProperty('--band-h', band.offsetHeight + 'px');
  if (was) return void (band.style.marginBottom = Math.max(0, bandFullH - band.offsetHeight) + 'px'); // back as it was: the short form, with its room kept
  legalCompact = false;
  band.classList.remove('compact');
  drawLegal();
}
let scrollTick = false, // at most one legalScroll per frame
  settleT = 0;
addEventListener(
  'scroll',
  () => {
    clearTimeout(settleT);
    settleT = setTimeout(legalScroll, 200); // and once more when the scroll has stopped: a jump to a chapter that was not drawn yet still ends with the right strip
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      legalScroll();
    });
  },
  { passive: true },
);
// A jump that ends without a wheel (a link, an address, a tab) is checked again when it lands.
for (const ev of ['scrollend', 'hashchange', 'popstate']) addEventListener(ev, () => (clearTimeout(settleT), (settleT = setTimeout(legalScroll, ev === 'scrollend' ? 30 : 120))));
addEventListener('load', () => setTimeout(legalScroll, 400));

// ---------------------------------------------------------------- key, list, glossary and table
const dateWords = (l) => (l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : fmt(parse(l.start)));
function drawLegalList() {
  const ul = document.getElementById('legalList');
  ul.innerHTML = LEGAL.slice()
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .map(
      (l) =>
        `<li><span class="ld">${l.end ? fmtY(parse(l.start)) + '–' + fmtY(parse(l.end)) : fmtMY(parse(l.start))}</span> <b>${esc(l.title)}</b>` +
        `<span class="ls">${esc(l.short_note)}</span></li>`,
    )
    .join('');
}
export function drawLegalKey() {
  drawLegalList();
  const K = legend('legendLegal', 22, 18),
    li = K.item;
  li(glyphMarkup('treaty'), 'Treaty');
  li(glyphMarkup('draft'), 'Draft treaty put forward');
  li(glyphMarkup('resolution'), 'Resolution or finding by an international body (not binding)');
  li(glyphMarkup('unilateral'), 'Pledge by one country');
  li(glyphMarkup('soft'), 'Expert manual (soft law, not binding)');
  li(glyphMarkup('veto'), 'Veto in the UN Security Council');
  li(`<rect x="-9" y="-3.5" width="18" height="7" rx="3.5" style="${BAR_STYLE}"/>`, 'Years of negotiation');
  li(
    '<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>',
    'Select a cube icon to open a 3D explainer',
  );
  K.done();
  // The key is folded at every width; its summary opens it.
  const kb = document.getElementById('keyLegal'),
    mq = matchMedia('(max-width: 640px)');
  if (kb && !kb.dataset.set) {
    kb.dataset.set = '1';
    kb.open = false; // the key is one click away at every width, so the whole timeline fits in one view
    void mq;
  }
  document.getElementById('glossaryLegal').innerHTML = GLOSSARY.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('');
  // app.js writes this summary once when the page loads; say it again here so the wording lives with the list it introduces
  const s = document.querySelector('#legalPhone summary');
  if (s) s.textContent = `All ${LEGAL.length} law and policy items, in date order`;
  table(
    'tableLegal',
    ['Short name', 'Full name', 'Date', 'Kind', 'What it is'],
    LEGAL.map((l) => [nameAt(l, 2), l.title, dateWords(l), legalKindWords(l), l.short_note]),
  );
}
