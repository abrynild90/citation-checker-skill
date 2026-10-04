// ============================================================================
// charts/legal.js: the law timeline (sticky band, dodged symbols, 2021 to 2026 zoom, phone strip with tap-to-name), its key, glossary, list and table.
// Provides: drawLegal(), drawLegalKey(), legalGlyph(), glyphMarkup(), legalScroll(), probeBand(), GLOSSARY.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { DOMAIN, EXPORTING, LEGAL, Placer, badge, esc, fmt, fmtMY, fmtY, hasScene, isPhoneNow, layout, parse, tw } from '../app.js';
import { activate, addGuide, bindMark, legalCard, legalKindOf, legalKindWords, legend, rove, setGuide, table } from '../ui.js';
import { hooks } from '../shared.js';

// ---------------------------------------------------------------- names
// t: title for cards and the table. l, m, s: the label at three lengths (full name, shorter name, abbreviation); a missing size falls back to the next
// longer one. Soft-law names end in "(soft law)" at full length and "*" when shortened. The glossary explains every abbreviation.
const NAMES = {
  'ltbt-1963': { t: 'Limited Test Ban Treaty', s: 'LTBT' },
  'ost-1967': { t: 'Outer Space Treaty', s: 'OST' },
  'abm-1972': { t: 'ABM Treaty, Article XII', m: 'ABM Treaty Art. XII', s: 'ABM Art. XII' },
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
  'itu-1992': { t: 'ITU Constitution, Articles 45 and 48', m: 'ITU Arts. 45 and 48', s: 'ITU Arts. 45/48' },
  'ppwt-2008': {
    t: 'Russia–China draft treaty on weapons in space (PPWT)',
    l: 'Russia–China draft treaty on weapons in space',
    m: 'Russia–China draft treaty',
    s: 'PPWT',
  },
  'ppwt-2014': { t: 'Updated Russia–China draft treaty (PPWT)', l: 'Updated Russia–China draft treaty', m: 'Updated PPWT draft', s: 'PPWT II' },
  'tallinn-2017': { t: 'Tallinn Manual 2.0 (soft law)', m: 'Tallinn Manual 2.0*', s: 'Tallinn*' },
  'unga-75-36': { t: 'UN General Assembly resolution 75/36', m: 'UNGA 75/36', s: '75/36' },
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
    s: 'OEWG, 2022–23',
  },
  'milamos-2022': { t: 'McGill Manual, Volume I (soft law)', l: 'McGill Manual (soft law)', m: 'McGill Manual*', s: 'MILAMOS*' },
  'unga-77-41': { t: 'UN General Assembly resolution 77/41', m: 'UNGA 77/41', s: '77/41' },
  'woomera-2024': { t: 'Woomera Manual (soft law)', m: 'Woomera Manual*', s: 'Woomera*' },
  'unsc-veto-2024': { t: 'Russian veto: nuclear weapons in orbit', m: 'Russian veto (nuclear weapons)', s: 'Veto' },
  'itu-rrb-2024': { t: 'ITU Radio Regulations Board: grave concern', m: 'ITU Board: grave concern', s: 'RRB ’24' },
  'icao-2025': { t: 'ICAO Assembly: GNSS interference an infraction', m: 'ICAO finding on GNSS', s: 'ICAO ’25' },
  'itu-rrb-2025': {
    t: 'ITU Radio Regulations Board urges Russia to stop interference',
    l: 'ITU Radio Regulations Board urges Russia to stop',
    m: 'ITU Board urges Russia to stop',
    s: 'RRB ’25',
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
  ['ABM Art. XII', 'Article XII of the Anti-Ballistic Missile (ABM) Treaty: non-interference with national technical means of verification.'],
  ['CD', 'Conference on Disarmament.'],
  ['DA-ASAT', 'Direct-ascent anti-satellite: a missile launched from Earth to destroy or damage a satellite.'],
  ['GNSS', 'Global navigation satellite systems, such as GPS.'],
  ['ICAO', 'International Civil Aviation Organization.'],
  [
    'ITU Arts. 45 and 48',
    'Articles 45 and 48 of the Constitution of the International Telecommunication Union (ITU): harmful interference; military radio services.',
  ],
  ['LTBT', 'Limited Test Ban Treaty.'],
  ['MILAMOS', 'McGill Manual on International Law Applicable to Military Uses of Outer Space.'],
  ['OEWG', 'Open-ended Working Group.'],
  ['OST', 'Outer Space Treaty.'],
  ['PAROS', 'Prevention of an Arms Race in Outer Space.'],
  ['PPWT', 'The draft Treaty on the Prevention of the Placement of Weapons in Outer Space, put forward by Russia and China.'],
  ['RRB', 'ITU Radio Regulations Board.'],
  ['UNGA 75/36, 77/41', 'United Nations General Assembly resolutions.'],
  ['US pledge', 'The 2022 United States moratorium on destructive direct-ascent anti-satellite tests.'],
  ['Veto', 'Russia’s April 2024 veto of a UN Security Council draft on nuclear weapons in orbit. The draft did not concern anti-satellite testing.'],
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
const ZOOM = [parse('2021-06-01'), parse('2026-07-01')];
let linkBox = null; // where the shaded window sits on the band (read when the connector to the zoom panel is drawn)
export function drawLegal(el = document.getElementById('legalSvg'), zoom = false) {
  el.innerHTML = '';
  const page = !EXPORTING && el.id === 'legalSvg',
    // On phones the band becomes a sideways-scrolling strip (desktop layout at 1100 px), scrolled to the recent cluster.
    strip = isPhoneNow() && !zoom && !EXPORTING && el.id === 'legalSvg',
    compact = legalCompact && !isPhoneNow() && !EXPORTING && !zoom;
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
  const L = layout(el, zoom ? ZOOM : DOMAIN, strip ? 1100 : 300),
    W = L.W,
    // The zoom panel has no y axis to leave room for, so its time axis runs almost edge to edge.
    M = zoom ? { l: isPhoneNow() ? 18 : 28, r: isPhoneNow() ? 18 : 30 } : L.M,
    x = zoom
      ? d3
          .scaleUtc()
          .domain(ZOOM)
          .range([M.l, W - M.r])
      : L.x;
  const FS = 12,
    PITCH = compact ? 14 : 17,
    TP = compact ? 12 : 27, // vertical distance between the rows that crowded symbols are stacked in
    SEP = compact ? 18 : 24, // symbols closer than this (in px) go into the next row; each keeps its true date on the axis
    GS = compact ? 0.7 : 1,
    OFF0 = 22; // first label row, below the line
  const spans = LEGAL.filter(
    (l) =>
      l.kind === 'negotiation_span' &&
      (l.end || l.id === 'paros-1981') &&
      (!zoom || ((l.end ? parse(l.end) : DOMAIN[1]) > ZOOM[0] && parse(l.start) < ZOOM[1])),
  );
  const pts = LEGAL.filter((l) => !spans.includes(l) && (!zoom || (x(parse(l.start)) >= M.l - 1 && x(parse(l.start)) <= W - M.r + 1))).sort((a, b) =>
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
  // On the full band the 2021 to 2026 crowd is named in the zoom panel (and in the saved image), so it carries no labels here.
  const crowd = (d) => !zoom && !strip && d._cx >= zx0 - 2;
  if (!compact) {
    pts.forEach((d) => {
      pl.add([d._cx - 9.5, -d._t * TP - 10 - (hasScene(d) ? 9 : 0), d._cx + (hasScene(d) ? 16 : 9.5), -d._t * TP + 10], 'G');
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
    const upBase = (d) => d._t * TP + 24;
    const clusters = [];
    pts
      .filter((d) => !crowd(d))
      .forEach((d) => {
        const c = clusters.at(-1);
        if (c && d._cx - c.at(-1)._cx < 200) c.push(d);
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
      for (const tier of tiers) {
        const t = text(d, tier),
          kmax = tier === 3 ? 11 : zoom ? 4 : 2;
        for (const [anchor, dx] of anchorsOf[prim])
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
      labels.push(...r.out);
      maxUp = Math.max(maxUp, r.mu);
      maxDn = Math.max(maxDn, r.md);
      maxExt = Math.max(maxExt, r.ext);
    });
  }
  // Sticky (compact) band: short names sit under the line where they fit; symbols that do not fit keep the hover and focus card.
  const cLabels = [];
  if (compact) {
    const p2 = new Placer({ x0: 2, x1: W - 2, y0: -999, y1: 999 });
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
  const yMark = compact ? TP * maxT + 12 : Math.max(maxExt ? maxExt + 16 : 0, TP * maxT + 28),
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
  const laneP = compact ? 8 : 26,
    lane0 = yMark + (compact ? 24 : Math.max(32, dnSpace + 26));
  const yAx = lane0 + (lanes.length ? (lanes.length - 1) * laneP + (compact ? 8 : 14) : 8),
    H = yAx + (compact ? 27 : 38);
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-label', zoom ? 'Law and policy timeline, enlarged to 2021 to 2026' : 'Law and policy timeline, 1957 to 2026');
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
  const putLabel = (g, x0, y0, anchor, name, date, tone) => {
    const t = g
      .append('text')
      .attr('class', 'lab')
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
        .style('stroke', 'var(--line-strong)');
    else if (dir === 'dn' && off - FS > 10)
      lg.append('line')
        .attr('x1', d._cx)
        .attr('x2', d._cx)
        .attr('y1', yMark + 10)
        .attr('y2', yMark + off - FS)
        .style('stroke', 'var(--line-strong)');
    putLabel(lg, tx, yMark + off, anchor, name, date, d.soft_law ? 'soft' : 'normal');
  });
  cLabels.forEach(({ d, s, tx, anchor }) => putLabel(lg, tx, yMark + 18, anchor, s, '', d.soft_law ? 'soft' : 'normal'));
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
    const sp = new Placer({ x0: 4, x1: W - 4, y0: -999, y1: 999 });
    spans.forEach((d) => {
      const y = lane0 + d._lane * laneP - 3;
      for (const size of strip || (zoom && isPhoneNow()) ? [2] : [0, 1, 2]) {
        const name = nameAt(d, size),
          w = tw(name, FS, 600),
          spot = [
            ['start', d._a],
            ['end', Math.min(W - 6, d._b)],
          ].find(([anchor, tx]) => sp.free(sp.textRect(tx, y, anchor, w, FS), [], 8));
        if (spot || size === 2) {
          const [anchor, tx] = spot ?? ['start', d._a];
          sp.add(sp.textRect(tx, y, anchor, w, FS));
          putLabel(lg, tx, y, anchor, name, '', 'quiet');
          break;
        }
      }
    });
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
    if (hasScene(d)) badge(d3.select(this), 10, -11);
  });
  bindMark(pg, strip ? null : legalCard, strip ? tapLegal : activate);
  pg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  sg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
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
  if (strip) {
    el.scrollLeft = el.scrollWidth;
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
let legalCompact = false;
export function legalScroll() {
  const band = document.getElementById('legalBand'),
    tr = document.getElementById('timeline').getBoundingClientRect();
  const stuck = !isPhoneNow() && band.getBoundingClientRect().top <= 0.5 && tr.top < -1 && tr.bottom > 200;
  if (stuck === legalCompact) return;
  if (band.contains(document.activeElement) && document.activeElement.closest('svg')) return; // never rebuild under a focused symbol
  const h0 = band.offsetHeight;
  legalCompact = stuck;
  drawLegal();
  band.classList.toggle('compact', stuck);
  if (stuck) document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px');
  band.style.marginBottom = stuck ? Math.max(0, h0 - band.offsetHeight) + 'px' : '0px';
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
  const band = document.getElementById('legalBand'),
    was = legalCompact;
  if (was) return; // already stuck: legalScroll keeps --band-h current
  legalCompact = true;
  band.classList.add('compact');
  drawLegal();
  document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px');
  legalCompact = false;
  band.classList.remove('compact');
  drawLegal();
}
let scrollTick = false; // at most one legalScroll per frame
addEventListener(
  'scroll',
  () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      legalScroll();
    });
  },
  { passive: true },
);

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
  li(glyphMarkup('resolution'), 'Resolution or body finding');
  li(glyphMarkup('unilateral'), 'Unilateral pledge');
  li(glyphMarkup('soft'), 'Soft law (expert manual, not binding)');
  li(glyphMarkup('veto'), 'Veto');
  li(`<rect x="-9" y="-3.5" width="18" height="7" rx="3.5" style="${BAR_STYLE}"/>`, 'Negotiation period');
  li(
    '<g class="badge3d"><path class="top" d="M0,-6 L5.2,-3 L0,0 L-5.2,-3Z"/><path d="M-5.2,-3 L0,0 L0,6 L-5.2,3Z"/><path d="M5.2,-3 L0,0 L0,6 L5.2,3Z"/></g>',
    'Select a cube icon to open a 3D explainer',
  );
  K.done();
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
