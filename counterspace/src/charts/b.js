// ============================================================================
// charts/b.js: Chart B, capability diffusion (stacked step area by decade).
// Provides: drawB(), chipsB().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { CAPS, DOMAIN, EXPORTING, isPhoneNow, layout, parse, wrap, xAxis } from '../app.js';
import { addGuide, legend, table } from '../ui.js';
import { drawC, stateC } from './c.js';
export const CATS = [
  { key: 'direct_ascent', label: 'Direct-ascent ASAT', v: '--cat-da', kin: true },
  { key: 'co_orbital', label: 'Co-orbital', v: '--cat-co', kin: true },
  { key: 'electronic_warfare', label: 'Electronic warfare', v: '--cat-ew', kin: false },
  { key: 'directed_energy', label: 'Directed energy', v: '--cat-de', kin: false },
  { key: 'cyber', label: 'Cyber', v: '--cat-cy', kin: false },
];
export const stateB = { group: 'cat', on: new Set(CATS.map((c) => c.key)) };
// 2020s "developing" (P) entries for which SWF's country matrix (Executive Summary, PDF pp. 22-32) shows "no data": the builder's reading of the
// country chapters, not the matrix. Source: verification_log.md, "Open items and impact" (direct_ascent and co_orbital, both PARTIAL).
// Hard-coded here on purpose: data/ and build_data.py are not changed by the page.
const NO_DATA_2020S = {
  direct_ascent: ['South Korea', 'Iran', 'North Korea', 'France'],
  co_orbital: ['India', 'Iran', 'Israel', 'Japan', 'North Korea', 'United Kingdom'],
};
const isNoData = (cat, dec, state) => dec === '2020s' && (NO_DATA_2020S[cat] || []).includes(state);
// Status of one state in one category and decade: 'D', 'P' (developing, matrix-supported) or 'N' (developing, builder-assessed, matrix: no data).
const statusOf = (cat, dec, state, v) => (v === 'D' ? 'D' : isNoData(cat, dec, state) ? 'N' : 'P');
const STATUS_LABEL = { D: 'demonstrated', P: 'developing', N: 'developing, builder-assessed (SWF matrix: no data)' };
function countsB() {
  const decs = CAPS.decades,
    RANK = { D: 3, P: 2, N: 1 };
  const mk = (key, label, v, s, vals) => ({
    key: key + ':' + s,
    label: `${label} (${STATUS_LABEL[s]})`,
    v,
    dev: s !== 'D',
    nd: s === 'N',
    vals,
  });
  const units =
    stateB.group === 'cat'
      ? CATS.filter((c) => stateB.on.has(c.key)).map((c) => ({ key: c.key, label: c.label, v: c.v, cats: [c.key] }))
      : [
          { key: 'kin', label: 'Kinetic (direct-ascent, co-orbital)', v: '--cat-da', cats: ['direct_ascent', 'co_orbital'] },
          {
            key: 'non',
            label: 'Non-kinetic (EW, directed energy, cyber)',
            v: '--cat-ew',
            cats: ['electronic_warfare', 'directed_energy', 'cyber'],
          },
        ];
  const series = units
    .flatMap((u) =>
      ['D', 'P', 'N'].map((s) =>
        mk(
          u.key,
          u.label,
          u.v,
          s,
          decs.map((d) => {
            const st = {}; // strongest status per state across the unit's categories
            u.cats.forEach((c) =>
              Object.entries(CAPS.coding[c][d] || {}).forEach(([k, v]) => {
                const t = statusOf(c, d, k, v);
                if (!st[k] || RANK[t] > RANK[st[k]]) st[k] = t;
              }),
            );
            return Object.values(st).filter((x) => x === s).length;
          }),
        ),
      ),
    )
    .filter((sr) => sr.key.endsWith(':D') || sr.key.endsWith(':P') || sr.vals.some((n) => n));
  return { series };
}
export function drawB(el = document.getElementById('svgB')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el),
    phone = isPhoneNow();
  // annotation lives in its own band ABOVE the plot, so it never sits on the data
  const ew20 = Object.keys(CAPS.coding.electronic_warfare['2020s']).length;
  const da20 = Object.entries(CAPS.coding.direct_ascent['2020s'])
    .filter(([, v]) => v === 'D')
    .map(([k]) => k);
  const annHead = `Electronic warfare drives most of the crowding: ${ew20} states in the 2020s.`;
  const annSub =
    `Demonstrated destructive DA-ASAT capability has stayed at four states: ` +
    `${da20.map((s) => (s === 'Russia' ? 'USSR/Russia' : s === 'United States' ? 'US' : s)).join(', ')}.`;
  const annW = W - 24,
    annL = wrap(annHead, annW, 12, 600),
    annS = wrap(annSub, annW, 11.5),
    annH = (annL.length + annS.length) * 15 + 10;
  const top = annH + 8,
    plotH = phone ? 330 : 290,
    H = top + plotH + 30;
  const decs = CAPS.decades,
    starts = decs.map((d) => +d.slice(0, 4));
  const xs = starts.map((s) => parse(`${Math.max(1957, s)}-01-01`)).concat([DOMAIN[1]]);
  const { series } = countsB();
  const stackData = xs.map((xd, i) => {
    const o = { x: xd };
    series.forEach((s) => (o[s.key] = s.vals[Math.min(i, decs.length - 1)]));
    return o;
  });
  const stack = d3
    .stack()
    .keys(series.map((s) => s.key))
    .offset(d3.stackOffsetNone)(stackData);
  const maxY = Math.max(4, d3.max(stack.at(-1) || [[0, 0]], (d) => d[1]) || 0);
  const y = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxY / (1 - 44 / plotH) / 2) * 2])
    .range([top + plotH, top]);
  const svg = d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .attr('height', H)
    .attr('role', 'img')
    .attr('aria-labelledby', 'hB')
    .attr('id', 'svgB-root');
  svg
    .append('desc')
    .text(
      'Stacked step area of the number of states holding each counterspace capability per decade, zero baseline. See the data table for exact counts.',
    );
  const defs = svg.append('defs');
  series.forEach((s) => {
    const p = defs
      .append('pattern')
      .attr('id', 'hatch-' + s.key.replace(':', '-'))
      .attr('width', 6)
      .attr('height', 6)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)');
    p.append('rect')
      .attr('width', 6)
      .attr('height', 6)
      .style('fill', `var(${s.v})`)
      .style('fill-opacity', s.nd ? 0.06 : 0.14);
    if (s.nd) {
      p.attr('width', 5).attr('height', 5).attr('patternTransform', null);
      p.select('rect').attr('width', 5).attr('height', 5);
      p.append('circle').attr('cx', 2.5).attr('cy', 2.5).attr('r', 1).style('fill', `var(${s.v})`);
    } else
      p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).style('stroke', `var(${s.v})`).style('stroke-width', 2.2);
  });
  const X2020 = x(parse('2020-01-01'));
  svg
    .append('rect')
    .attr('x', M.l)
    .attr('width', X2020 - M.l)
    .attr('y', top)
    .attr('height', plotH)
    .style('fill', 'var(--recon)');
  svg
    .append('text')
    .attr('class', 'band-label')
    .attr('x', M.l + 6)
    .attr('y', top + 12)
    .text(phone ? 'RECONSTRUCTED' : 'RECONSTRUCTED (FADED, NOT SWF-ASSESSED)');
  {
    const t = svg
      .append('text')
      .attr('class', 'band-label')
      .attr('text-anchor', 'end')
      .attr('x', W - M.r - 4);
    t.append('tspan')
      .attr('x', W - M.r - 4)
      .attr('y', top + 12)
      .text(phone ? 'SWF 2026' : 'SWF 2026');
    t.append('tspan')
      .attr('x', W - M.r - 4)
      .attr('dy', 12)
      .text(phone ? '13 states' : '13 STATES ASSESSED');
  }
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(6)
        .tickSize(-(W - M.l - M.r))
        .tickFormat(''),
    );
  svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')));
  svg
    .append('text')
    .attr('class', 'ann-sub')
    .attr('transform', `translate(12,${top + plotH / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .text(stateB.group === 'cat' ? 'State-capability pairs' : 'Unique states per group');
  const area = d3
    .area()
    .x((d) => x(d.data.x))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveStepAfter);
  // Reconstructed decades (before 2020) are drawn faded with a dashed outline; SWF-assessed 2020s at full strength.
  defs
    .append('clipPath')
    .attr('id', 'clipRecon')
    .append('rect')
    .attr('x', M.l)
    .attr('y', top)
    .attr('width', X2020 - M.l)
    .attr('height', plotH);
  defs
    .append('clipPath')
    .attr('id', 'clipSwf')
    .append('rect')
    .attr('x', X2020)
    .attr('y', top)
    .attr('width', W - M.r - X2020 + 1)
    .attr('height', plotH);
  [
    ['clipRecon', 0.5, '3 2'],
    ['clipSwf', 1, null],
  ].forEach(([clip, op, dash]) => {
    svg
      .append('g')
      .attr('clip-path', `url(#${clip})`)
      .attr('class', clip === 'clipRecon' ? 'recon-fill' : 'swf-fill')
      .style('opacity', op)
      .selectAll('path')
      .data(stack)
      .join('path')
      .attr('d', area)
      .style('fill', (d, i) => (series[i].dev ? `url(#hatch-${series[i].key.replace(':', '-')})` : `var(${series[i].v})`))
      .style('fill-opacity', (d, i) => (series[i].dev ? 1 : 0.85))
      .style('stroke', dash ? 'var(--muted)' : 'var(--bg)')
      .style('stroke-width', dash ? 0.9 : 0.8)
      .style('stroke-dasharray', dash)
      .append('title')
      .text((d, i) => series[i].label + (dash ? ' (reconstructed decades)' : ''));
  });
  // Range marks: per decade a whisker from the lower bound (demonstrated only) to the upper bound (demonstrated + developing), with the numbers.
  const dem = decs.map((d, i) => series.filter((s) => !s.dev).reduce((a, s) => a + s.vals[i], 0)),
    tot = decs.map((d, i) => series.reduce((a, s) => a + s.vals[i], 0));
  const rg = svg.append('g').attr('class', 'rangemarks');
  decs.forEach((d, i) => {
    const xa = x(xs[i]),
      xb = x(xs[i + 1]),
      cx = (xa + xb) / 2,
      lo = dem[i],
      hi = tot[i],
      unc = hi > lo,
      w = xb - xa;
    if (unc && w > 22) {
      rg.append('path')
        .attr('d', `M${cx - 3},${y(lo)}h6M${cx},${y(lo)}V${y(hi)}M${cx - 3},${y(hi)}h6`)
        .attr('class', 'whisker');
    }
    if (w >= 34)
      rg.append('text')
        .attr('class', 'range-label')
        .attr('x', cx)
        .attr('y', y(hi) - 6)
        .attr('text-anchor', 'middle')
        .text(unc ? `${w >= 84 && !phone ? 'range ' : ''}${lo}–${hi}` : `${hi}`);
  });
  xAxis(svg, x, top + plotH);
  addGuide(svg, x, top, top + plotH);
  {
    const t = svg.append('text').attr('x', 4).attr('y', 14);
    let n = 0;
    annL.forEach((l) =>
      t
        .append('tspan')
        .attr('class', 'ann')
        .attr('x', 4)
        .attr('dy', n++ ? 15 : 0)
        .text(l),
    );
    annS.forEach((l) =>
      t
        .append('tspan')
        .attr('class', 'ann-sub')
        .attr('x', 4)
        .attr('dy', n++ ? 15 : 0)
        .text(l),
    );
  }
  if (EXPORTING) return;
  document.getElementById('noteB').textContent =
    stateB.group === 'cat'
      ? 'Stack height counts state-capability pairs: a state with two capabilities counts twice. The number above each decade is a range (whisker).'
      : 'Unique states per group, not pairs. A state with both kinds is counted once in each band, so the bands can sum to more than the ' +
        'number of states. The number above each decade is a range (whisker).';
  {
    const kk = document.getElementById('kinKeyB'),
      kin = stateB.group === 'kin';
    kk.hidden = !kin;
    kk.innerHTML = kin
      ? '<span><i style="background:var(--cat-da)"></i>Kinetic (direct-ascent, co-orbital)</span><span><i ' +
        'style="background:var(--cat-ew)"></i>Non-kinetic (EW, directed energy, cyber)</span>'
      : '';
  }
  // legend + chips
  {
    const L = legend('legendB', 26, 16),
      C = 'var(--cat-ew)',
      sw = (inner, extra = '') => `<rect x="-12" y="-7" width="24" height="14" rx="1.5" ${extra}/>${inner}`;
    L.raw(
      '<li class="lhead" aria-hidden="true">Fill style = strength of evidence (colour = ' +
        (stateB.group === 'cat' ? 'capability category' : 'kinetic or non-kinetic group, keyed above') +
        ')</li>',
    )
      .item(sw('', `style="fill:${C};fill-opacity:.85"`), '<b>Solid</b>: demonstrated, tested or used (verified against SWF)')
      .item(
        `<defs><pattern id="lgH" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" ` +
          `height="6" style="fill:${C};fill-opacity:.14"/><line y2="6" style="stroke:${C};stroke-width:2.2"/></pattern></defs>` +
          sw('', 'fill="url(#lgH)"'),
        '<b>Hatched</b>: developing or latent',
      )
      .item(
        `<defs><pattern id="lgD" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" style="fill:${C}` +
          `;fill-opacity:.06"/><circle cx="2.5" cy="2.5" r="1" style="fill:${C}"/></pattern></defs>` +
          sw('', 'fill="url(#lgD)"'),
        '<b>Dotted</b>: developing, builder-assessed (2020s; SWF matrix: no data)',
      )
      .item(
        sw('', `style="fill:${C};fill-opacity:.42;stroke:var(--muted);stroke-dasharray:3 2"`),
        '<b>Faded, dashed edge</b>: reconstructed decades (before 2020, not SWF-assessed)',
      )
      .raw('<li class="lhead" aria-hidden="true">Range whisker above each decade</li>')
      .item(
        '<path d="M-4,-8h8M0,-8V8M-4,8h8" style="stroke:var(--text);stroke-width:1.5;fill:none"/>',
        '<b>Low end</b> = demonstrated only; <b>high end</b> = demonstrated + developing. The label reads low–high, e.g. 13–25.',
        26,
      )
      .done();
  }
  table(
    'tableB',
    ['Category', ...CAPS.decades],
    CATS.map((c) => [
      c.label,
      ...CAPS.decades.map((d) => {
        const o = CAPS.coding[c.key][d] || {};
        const D_ = Object.keys(o).filter((k) => o[k] === 'D'),
          P_ = Object.keys(o).filter((k) => o[k] === 'P' && !isNoData(c.key, d, k)),
          N_ = Object.keys(o).filter((k) => o[k] === 'P' && isNoData(c.key, d, k));
        return (
          `${D_.length} demonstrated${D_.length ? ' (' + D_.join(', ') + ')' : ''}; ${P_.length} ` +
          `developing${P_.length ? ' (' + P_.join(', ') + ')' : ''}` +
          `${N_.length ? `; ${N_.length} developing, builder-assessed, SWF matrix: no data (${N_.join(', ')})` : ''}`
        );
      }),
    ]),
  );
}
// Chips are built once and updated in place, so a toggle never drops keyboard focus.
export function chipsB() {
  const el = document.getElementById('chipsB');
  if (![...el.children].some((c) => c.dataset.key))
    CATS.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.key = c.key;
      b.innerHTML = `<i style="background:var(${c.v})"></i>${c.label}`;
      b.onclick = () => {
        stateB.on.has(c.key) ? stateB.on.delete(c.key) : stateB.on.add(c.key);
        if (!stateB.on.size) stateB.on.add(c.key);
        chipsB();
        drawB();
      };
      el.appendChild(b);
    });
  [...el.children]
    .filter((b) => b.dataset.key)
    .forEach((b) => {
      b.setAttribute('aria-pressed', stateB.on.has(b.dataset.key));
      b.disabled = stateB.group !== 'cat';
    });
  el.classList.toggle('mode-kin', stateB.group !== 'cat');
  let nt = el.querySelector('.chip-off-note');
  if (stateB.group !== 'cat' && !nt) {
    nt = document.createElement('span');
    nt.className = 'chip-off-note';
    nt.textContent = 'Category filter applies to the five-category view only; colours here show the two groups above.';
    el.appendChild(nt);
  } else if (stateB.group === 'cat' && nt) nt.remove();
}
document.getElementById('cFocus').onclick = () => {
  stateC.focus = true;
  drawC();
};
document.getElementById('cFull').onclick = () => {
  stateC.focus = false;
  drawC();
};
document.getElementById('grpCat').onclick = () => {
  stateB.group = 'cat';
  grpBtns();
  chipsB();
  drawB();
};
document.getElementById('grpKin').onclick = () => {
  stateB.group = 'kin';
  grpBtns();
  chipsB();
  drawB();
};
function grpBtns() {
  document.getElementById('grpCat').setAttribute('aria-pressed', stateB.group === 'cat');
  document.getElementById('grpKin').setAttribute('aria-pressed', stateB.group === 'kin');
}
