// ============================================================================
// charts/b.js: the capability chart (chapter 05). Stacked bars, one per decade, of the states that hold each kind of counterspace capability.
// Provides: drawB(), chipsB(), CATS, stateB.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { CAPS, DOMAIN, EXPORTING, isPhoneNow, layout, parse, tw } from '../app.js';
import { decadeCard } from '../cards2.js';
import { addGuide, bindMark, rove, table } from '../ui.js';
import { keyMarkup, roundRectPath, setKey, topRoundPath, wrapLines } from './kit.js';

export const CATS = [
  { key: 'direct_ascent', label: 'Direct-ascent anti-satellite', v: '--cat-da', kin: true, gloss: 'A missile launched from Earth to hit a satellite' },
  { key: 'co_orbital', label: 'Co-orbital', v: '--cat-co', kin: true, gloss: 'A satellite that maneuvers close to another satellite' },
  { key: 'electronic_warfare', label: 'Electronic warfare', v: '--cat-ew', kin: false, gloss: 'Jamming and spoofing of satellite signals' },
  { key: 'directed_energy', label: 'Directed energy', v: '--cat-de', kin: false, gloss: 'Lasers and similar beams used against satellites' },
  { key: 'cyber', label: 'Cyber', v: '--cat-cy', kin: false, gloss: 'Attacks on satellites and their ground systems through computers' },
];
// The second grouping: two groups, each state counted once per group.
const KIN = [
  {
    key: 'kin',
    label: 'Kinetic',
    v: '--cat-da',
    cats: ['direct_ascent', 'co_orbital'],
    gloss: 'Direct-ascent anti-satellite weapons and co-orbital satellites',
  },
  {
    key: 'non',
    label: 'Non-kinetic',
    v: '--cat-ew',
    cats: ['electronic_warfare', 'directed_energy', 'cyber'],
    gloss: 'Electronic warfare, directed energy and cyber',
  },
];
export const stateB = { group: 'cat', on: new Set(CATS.map((c) => c.key)), onKin: new Set(KIN.map((u) => u.key)) };
const stateSet = () => (stateB.group === 'cat' ? stateB.on : stateB.onKin);

// 2020s "developing" (P) entries for which SWF's country matrix (Executive Summary, PDF pp. 22-32) shows "no data": our reading of the country chapters,
// not the matrix. Source: verification_log.md, "Open items and impact" (direct_ascent and co_orbital, both PARTIAL).
// Hard-coded here on purpose: data/ and build_data.py are not changed by the page.
const NO_DATA_2020S = {
  direct_ascent: ['South Korea', 'Iran', 'North Korea', 'France'],
  co_orbital: ['India', 'Iran', 'Israel', 'Japan', 'North Korea', 'United Kingdom'],
};
const isNoData = (cat, dec, state) => dec === '2020s' && (NO_DATA_2020S[cat] || []).includes(state);
// Status of one state in one category and decade: 'D' (demonstrated), 'P' (developing, matrix-supported) or 'N' (developing, our reading, matrix: no data).
const statusOf = (cat, dec, state, v) => (v === 'D' ? 'D' : isNoData(cat, dec, state) ? 'N' : 'P');
// The data names Russia "Russia" under direct ascent and "USSR/Russia" elsewhere; a group counts it once.
const sameState = (k) => (k === 'Russia' ? 'USSR/Russia' : k);

function countsB() {
  const decs = CAPS.decades,
    RANK = { D: 3, P: 2, N: 1 };
  const units =
    stateB.group === 'cat'
      ? CATS.filter((c) => stateB.on.has(c.key)).map((c) => ({ key: c.key, label: c.label, v: c.v, cats: [c.key] }))
      : KIN.filter((u) => stateB.onKin.has(u.key));
  const series = units
    .flatMap((u) =>
      ['D', 'P', 'N'].map((s) => ({
        key: `${u.key}:${s}`,
        unit: u,
        status: s,
        v: u.v,
        dev: s !== 'D',
        nd: s === 'N',
        vals: decs.map((d) => {
          const st = {}; // strongest status per state across the unit's categories
          u.cats.forEach((c) =>
            Object.entries(CAPS.coding[c][d] || {}).forEach(([k, v]) => {
              const t = statusOf(c, d, k, v),
                name = sameState(k);
              if (!st[name] || RANK[t] > RANK[st[name]]) st[name] = t;
            }),
          );
          return Object.values(st).filter((q) => q === s).length;
        }),
      })),
    )
    .filter((sr) => sr.status !== 'N' || sr.vals.some((n) => n));
  return { series, units };
}

export function drawB(el = document.getElementById('svgB')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el),
    phone = isPhoneNow(),
    R = W - M.r,
    decs = CAPS.decades,
    kin = stateB.group === 'kin';
  const starts = decs.map((d) => +d.slice(0, 4)),
    xs = starts.map((s) => parse(`${Math.max(1957, s)}-01-01`)).concat([DOMAIN[1]]),
    bandsX = decs.map((d, i) => [x(xs[i]), x(xs[i + 1])]),
    X2020 = x(parse('2020-01-01'));
  const { series, units } = countsB();
  const stack = d3
    .stack()
    .keys(series.map((s) => s.key))
    .offset(d3.stackOffsetNone)(
    decs.map((d, i) => {
      const o = {};
      series.forEach((s) => (o[s.key] = s.vals[i]));
      return o;
    }),
  );
  const dem = decs.map((d, i) => series.filter((s) => !s.dev).reduce((a, s) => a + s.vals[i], 0)),
    tot = decs.map((d, i) => series.reduce((a, s) => a + s.vals[i], 0)),
    maxY = Math.max(4, ...tot);
  // The tallest bar leaves room above it for its figure and the label of the assessed decade.
  const plotH = phone ? 300 : 340,
    top = 54,
    lead = phone ? 62 : 58,
    ymax = maxY / (1 - lead / plotH),
    y = d3
      .scaleLinear()
      .domain([0, ymax])
      .range([top + plotH, top]),
    base = top + plotH,
    H = base + (phone ? 54 : 40),
    inset = phone ? 3 : 8;

  const svg = d3
    .select(el)
    .append('svg')
    .attr('class', 'k2 k2b')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'group')
    .attr('aria-labelledby', 'hB')
    .attr('id', 'svgB-root');
  svg
    .append('desc')
    .text(
      `Stacked bars of the number of ${kin ? 'states in each of two groups' : 'pairs of a state and a capability'} for each decade from the 1950s to the 2020s. ` +
        'Solid fills are demonstrated capabilities, striped fills are developing or latent ones and faded bars are decades reconstructed without an SWF assessment. ' +
        'A data table follows the chart.',
    );

  // stripes for developing, dots for developing by our reading (SWF's table has no data)
  const defs = svg.append('defs');
  series
    .filter((s) => s.dev)
    .forEach((s) => {
      const p = defs
        .append('pattern')
        .attr('id', `hatch-${s.key.replace(':', '-')}`)
        .attr('patternUnits', 'userSpaceOnUse');
      if (s.nd) {
        p.attr('width', 6).attr('height', 6);
        p.append('rect').attr('width', 6).attr('height', 6).style('fill', `var(${s.v})`).style('fill-opacity', 0.1);
        p.append('circle').attr('cx', 3).attr('cy', 3).attr('r', 1.6).style('fill', `var(${s.v})`);
      } else {
        p.attr('width', 6).attr('height', 6).attr('patternTransform', 'rotate(45)');
        p.append('rect').attr('width', 6).attr('height', 6).style('fill', `var(${s.v})`).style('fill-opacity', 0.16);
        p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).style('stroke', `var(${s.v})`).style('stroke-width', 2.4);
      }
    });

  // two panels: the reconstructed decades, and the assessed 2020s set apart
  svg
    .append('path')
    .attr('class', 'band')
    .attr('d', topRoundPath(M.l, top, X2020 - M.l, plotH, 10));
  svg
    .append('path')
    .attr('class', 'panel-swf')
    .attr('d', topRoundPath(X2020, top, R - X2020, plotH, 10));
  const yticks = d3.range(0, Math.ceil(maxY / 10) * 10 + 1, 10); // the axis stops at the last round number the data reaches; the room above is for the labels
  const gy = svg.append('g').attr('class', 'gridline');
  yticks.forEach((t) => gy.append('line').attr('x1', M.l).attr('x2', R).attr('y1', y(t)).attr('y2', y(t)));
  const ay = svg.append('g').attr('class', 'axis');
  yticks.forEach((t) =>
    ay
      .append('text')
      .attr('x', M.l - 10)
      .attr('y', y(t) + 4)
      .attr('text-anchor', 'end')
      .text(t),
  );
  svg
    .append('text')
    .attr('class', 'axis-title')
    .attr('x', phone ? 0 : 12)
    .attr('y', 14)
    .text(kin ? 'States in each group' : 'Capabilities held, counted by state');
  // decade boundaries share the other charts' year ticks
  const gx = svg.append('g').attr('class', 'gridline');
  bandsX.slice(1).forEach(([xa]) =>
    gx
      .append('line')
      .attr('x1', xa)
      .attr('x2', xa)
      .attr('y1', top + 6)
      .attr('y2', base),
  );

  // bars
  const decadeInfo = (i) => {
    const d = decs[i],
      ours = series.filter((q) => q.nd).reduce((a, q) => a + q.vals[i], 0);
    return {
      title: d === '1950s' ? '1950s (1957 to 1959)' : d === '2020s' ? '2020s (to 2026)' : d,
      note:
        d === '2020s'
          ? `Assessed by SWF (13 states).${ours ? ` Of the developing pairs, ${ours} are our reading where SWF’s table has no data.` : ''}`
          : 'Reconstructed from SWF’s test tables and country chapters; not assessed by SWF.',
      lines: units.map((u) => {
        const n = (s) => series.find((q) => q.unit === u && q.status === s)?.vals[i] || 0,
          dv = n('D'),
          pv = n('P') + n('N');
        return {
          color: `var(${u.v})`,
          name: u.label,
          text: dv || pv ? [dv && `${dv} demonstrated`, pv && `${pv} developing`].filter(Boolean).join(', ') : 'None demonstrated or developing',
        };
      }),
      total: `${tot[i]} ${kin ? 'in all (a state in both groups counts twice)' : tot[i] === 1 ? 'pair in all' : 'pairs in all'}${dem[i] < tot[i] ? `, ${dem[i]} demonstrated` : ''}.`,
    };
  };
  const g = svg
    .append('g')
    .selectAll('g')
    .data(decs.map((d, i) => ({ i, d, t: +xs[i], info: decadeInfo(i) })))
    .join('g')
    .attr('class', 'mark')
    .attr('role', 'button')
    .attr('data-t', (d) => d.t)
    .attr(
      'aria-label',
      (d) =>
        `${d.info.title}: ${tot[d.i]} ${kin ? 'states counted across the groups' : 'pairs of a state and a capability'}, ${dem[d.i]} demonstrated. ${d.info.note}`,
    );
  g.each(function (d) {
    const s = d3.select(this),
      i = d.i,
      [xa, xb] = bandsX[i],
      bx = xa + inset,
      bw = Math.max(6, xb - xa - 2 * inset),
      cx = bx + bw / 2,
      recon = decs[i] !== '2020s',
      hiY = tot[i] > 0 ? Math.min(y(tot[i]), y(0) - 9) : y(tot[i]); // a bar of one or two states still shows at least 9 px
    if (!EXPORTING)
      s.append('rect')
        .attr('class', 'rowhl hit')
        .attr('x', xa + 2)
        .attr('y', top + 2)
        .attr('width', xb - xa - 4)
        .attr('height', plotH - 2)
        .attr('rx', 8);
    const bar = s.append('g').attr('class', recon ? 'bar recon' : 'bar');
    if (tot[i] > 0) {
      const id = `bclip-${i}`;
      defs
        .append('clipPath')
        .attr('id', id)
        .append('path')
        .attr('d', roundRectPath(bx, hiY, bw, base - hiY + 12, Math.min(7, bw / 2)));
      const seg = bar.append('g').attr('clip-path', `url(#${id})`);
      const topJ = series.reduce((a, sr, j) => (stack[j][i][1] > stack[j][i][0] ? j : a), -1);
      series.forEach((sr, j) => {
        const [y0, y1] = stack[j][i];
        if (y1 <= y0) return;
        const yt = j === topJ ? hiY : y(y1);
        seg
          .append('rect')
          .attr('x', bx - 1)
          .attr('width', bw + 2)
          .attr('y', yt)
          .attr('height', y(y0) - yt)
          .style('fill', sr.dev ? `url(#hatch-${sr.key.replace(':', '-')})` : `var(${sr.v})`)
          .style('fill-opacity', sr.dev ? 1 : 0.9)
          .style('stroke', 'var(--bg)')
          .style('stroke-width', 1.2);
      });
      if (recon)
        bar
          .append('path')
          .attr('class', 'bar-edge')
          .attr('d', roundRectPath(bx, hiY, bw, base - hiY, Math.min(7, bw / 2)));
      // the range bar: from the demonstrated-only count up to demonstrated plus developing
      if (dem[i] < tot[i] && bw > 24) {
        const wd = `M${cx - 4.5},${y(dem[i])}h9M${cx},${y(dem[i])}V${y(tot[i])}M${cx - 4.5},${y(tot[i])}h9`;
        s.append('path').attr('class', 'whisker-halo').attr('d', wd).attr('stroke-linecap', 'round');
        s.append('path').attr('class', 'whisker').attr('d', wd).attr('stroke-linecap', 'round');
      }
      // the figure above the bar, and the range as a quiet second line
      let range = dem[i] < tot[i] ? `${dem[i]}–${tot[i]}` : 'no range';
      if (range && range !== 'no range' && !phone && xb - xa >= 100) range = `range ${range}`;
      if (range && tw(range, 12.5, 400) > xb - xa + 14) range = '';
      s.append('text')
        .attr('class', 'fig')
        .attr('x', cx)
        .attr('y', hiY - (range ? 26 : 9))
        .attr('text-anchor', 'middle')
        .text(tot[i]);
      if (range)
        s.append('text')
          .attr('class', 'range')
          .attr('x', cx)
          .attr('y', hiY - 9)
          .attr('text-anchor', 'middle')
          .text(range);
    }
    if (!EXPORTING)
      s.append('rect')
        .attr('class', 'hit')
        .attr('x', xa + 2)
        .attr('y', top + 2)
        .attr('width', xb - xa - 4)
        .attr('height', plotH - 2)
        .attr('rx', 8);
  });

  // panel labels (the wording "reconstructed (not SWF-assessed)" is required), then the axis under the bars
  {
    // the label starts to the right of the 1950s bar, so that bar's focus ring never crosses it
    const lx = Math.max(M.l + 14, bandsX[0][1] + 12),
      lim = Math.max(150, X2020 - lx - 14 - (phone ? 92 : 0)),
      ls = wrapLines('Earlier decades are reconstructed (not SWF-assessed)', lim, (q) => tw(q, 12.5, 600)),
      t = svg
        .append('text')
        .attr('class', 'panel-label panel-in')
        .attr('x', lx)
        .attr('y', top + 22);
    ls.forEach((ln, i) =>
      t
        .append('tspan')
        .attr('x', lx)
        .attr('dy', i ? 17 : 0)
        .text(ln),
    );
    const cxR = phone ? R - 6 : (X2020 + R) / 2,
      a = svg
        .append('text')
        .attr('class', 'panel-label')
        .attr('x', cxR)
        .attr('y', top - 24)
        .attr('text-anchor', phone ? 'end' : 'middle');
    a.append('tspan').attr('x', cxR).text('SWF-assessed');
    a.append('tspan').attr('class', 'panel-sub').attr('x', cxR).attr('dy', 17).text('13 states');
  }
  const ax = svg.append('g').attr('class', 'axis xaxis').attr('transform', `translate(0,${base})`);
  ax.append('line').attr('class', 'domain').attr('x1', M.l).attr('x2', R);
  decs.forEach((d, i) => {
    const [xa, xb] = bandsX[i];
    if (i) ax.append('line').attr('class', 'tick').attr('x1', xa).attr('x2', xa).attr('y1', 0).attr('y2', 6);
    if (phone && i === 0) {
      // the 1950s band is only three years wide: its name sits on a second row so it never touches the 1960s name
      ax.append('text').attr('x', M.l - 2).attr('y', 42).attr('text-anchor', 'start').text(d);
    } else if ((phone ? i % 2 === 1 : true) && tw(d, 12, 500) <= xb - xa + 14)
      ax.append('text')
        .attr('x', (xa + xb) / 2)
        .attr('y', 24)
        .attr('text-anchor', 'middle')
        .text(d);
  });
  rove(g);
  addGuide(svg, x, top, base);
  if (EXPORTING) return;
  bindMark(
    g,
    (d) => decadeCard(d.info),
    () => {},
  );

  // ---------------------------------------------------------------- notes, key and data table
  const ew20 = Object.keys(CAPS.coding.electronic_warfare['2020s']).length,
    da20 = Object.entries(CAPS.coding.direct_ascent['2020s'])
      .filter(([, v]) => v === 'D')
      .map(([k]) => k),
    WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  document.getElementById('calloutB').textContent =
    `Electronic warfare (jamming and spoofing) is held by the most states: ${ew20} in the 2020s. Demonstrated destructive direct-ascent anti-satellite ` +
    `(DA-ASAT) capability, meaning a missile launched from Earth that can hit a satellite, has stayed at ${WORD[da20.length] ?? da20.length} states: ` +
    `${da20.slice(0, -1).join(', ')} and ${da20.at(-1)}.`;
  document.getElementById('noteB').textContent = kin
    ? 'A state that holds both kinds appears in both groups. Kinetic means missiles and satellites that maneuver close to another; non-kinetic means ' +
      'jamming, lasers and cyber attacks.'
    : 'A state that holds two capabilities is counted twice. What each kind means is explained under “How we classified these”.';
  const ink = 'var(--muted)',
    sw = (extra) => `<rect x="-12" y="-7" width="24" height="14" rx="3" ${extra}/>`;
  setKey(
    'legendB',
    keyMarkup([
      {
        head: 'Fill',
        items: [
          [sw(`style="fill:${ink};fill-opacity:.9"`), 'Demonstrated: tested or used', 28],
          [
            `<defs><pattern id="kH" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:${ink};fill-opacity:.16"/><line y2="6" style="stroke:${ink};stroke-width:2.4"/></pattern></defs>` +
              sw(`fill="url(#kH)" style="stroke:${ink};stroke-width:1"`),
            'Developing or latent',
            28,
          ],
          [
            `<defs><pattern id="kD" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" style="fill:${ink};fill-opacity:.1"/><circle cx="3" cy="3" r="1.6" style="fill:${ink}"/></pattern></defs>` +
              sw(`fill="url(#kD)" style="stroke:${ink};stroke-width:1"`),
            'Developing, our reading (SWF’s table has no data)',
            28,
          ],
          [sw(`style="fill:${ink};fill-opacity:.4;stroke:${ink};stroke-width:1;stroke-dasharray:3 3"`), 'Faded: reconstructed (not SWF-assessed)', 28],
        ],
      },
      {
        head: 'Range bar',
        items: [
          [
            '<path d="M-4.5,-8h9M0,-8V8M-4.5,8h9" style="stroke:var(--text);stroke-width:1.6;fill:none;stroke-linecap:round"/>',
            'Demonstrated only (low end) to demonstrated plus developing (high end)',
            18,
          ],
        ],
      },
    ]),
  );
  const cnt = (d, p, long) => `<span class="cn-long">${long}</span><span class="cn-short" aria-hidden="true">${d} + ${p}</span>`;
  table(
    'tableB',
    ['Kind of capability', ...CAPS.decades.map((d) => (d === CAPS.decades[CAPS.decades.length - 1] ? `${d}<span class="th-sub"> (SWF-assessed)</span>` : d))],
    CATS.map((c) => [
      c.label,
      ...CAPS.decades.map((d) => {
        const o = CAPS.coding[c.key][d] || {};
        const D_ = Object.keys(o).filter((k) => o[k] === 'D'),
          P_ = Object.keys(o).filter((k) => o[k] === 'P' && !isNoData(c.key, d, k)),
          N_ = Object.keys(o).filter((k) => o[k] === 'P' && isNoData(c.key, d, k));
        const plural = (n, w) => `${n} ${w}`,
          counts = [plural(D_.length, 'demonstrated'), plural(P_.length + N_.length, 'developing')].join(', '),
          groups = [
            ['Demonstrated', D_],
            ['Developing', P_],
            ['Developing, our reading (SWF’s table has no data)', N_],
          ].filter(([, l]) => l.length);
        return groups.length
          ? `<span class="cnt-line"><span class="cn">${cnt(D_.length, P_.length + N_.length, counts)}</span><details class="st"><summary>States</summary>${groups.map(([h, l]) => `<p><b>${h}:</b> ${l.join(', ')}</p>`).join('')}</details></span>`
          : `<span class="cnt-line"><span class="cn">${cnt(0, 0, counts)}</span></span>`;
      }),
    ]),
    'States that hold each kind of counterspace capability, by decade. On a wide screen each cell reads "demonstrated + developing".',
  );
}

// Chips: one per kind of capability (or per group). Built once per grouping and updated in place, so a toggle never drops keyboard focus.
export function chipsB() {
  const el = document.getElementById('chipsB'),
    items = stateB.group === 'kin' ? KIN : CATS,
    want = items.map((c) => c.key).join();
  if (el.dataset.built !== want) {
    el.dataset.built = want;
    el.innerHTML = '';
    items.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.key = c.key;
      b.title = c.gloss;
      b.innerHTML = `<i style="background:var(${c.v})"></i><span>${c.label.replace(/(\S+)$/, '<span class="nb">$1</span>')}</span>`;
      b.onclick = () => {
        const on = stateSet();
        on.has(c.key) ? on.delete(c.key) : on.add(c.key);
        if (!on.size) on.add(c.key);
        chipsB();
        drawB();
      };
      el.appendChild(b);
    });
  }
  [...el.children].forEach((b) => b.setAttribute('aria-pressed', stateSet().has(b.dataset.key)));
}
const pick = (group) => () => {
  stateB.group = group;
  document.getElementById('grpCat').setAttribute('aria-pressed', group === 'cat');
  document.getElementById('grpKin').setAttribute('aria-pressed', group === 'kin');
  chipsB();
  drawB();
};
document.getElementById('grpCat').onclick = pick('cat');
document.getElementById('grpKin').onclick = pick('kin');
