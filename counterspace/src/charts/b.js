// ============================================================================
// charts/b.js: Chart B, capability diffusion (stacked step area by decade).
// Provides: drawB(), chipsB().
// ============================================================================
const CATS = [
  { key: 'direct_ascent', label: 'Direct-ascent ASAT', v: '--cat-da', kin: true },
  { key: 'co_orbital', label: 'Co-orbital', v: '--cat-co', kin: true },
  { key: 'electronic_warfare', label: 'Electronic warfare', v: '--cat-ew', kin: false },
  { key: 'directed_energy', label: 'Directed energy', v: '--cat-de', kin: false },
  { key: 'cyber', label: 'Cyber', v: '--cat-cy', kin: false },
];
const stateB = { group: 'cat', on: new Set(CATS.map(c => c.key)) };
function countsB() {
  const decs = CAPS.decades;
  if (stateB.group === 'cat') {
    return { series: CATS.filter(c => stateB.on.has(c.key)).flatMap(c => ['D', 'P'].map(s => ({ key: c.key + ':' + s, label: `${c.label} (${s === 'D' ? 'demonstrated' : 'developing'})`, v: c.v, dev: s === 'P',
      vals: decs.map(d => Object.values(CAPS.coding[c.key][d] || {}).filter(x => x === s).length) }))) };
  }
  const grp = [{ key: 'kin', label: 'Kinetic (direct-ascent, co-orbital)', v: '--cat-da', cats: ['direct_ascent', 'co_orbital'] }, { key: 'non', label: 'Non-kinetic (EW, directed energy, cyber)', v: '--cat-ew', cats: ['electronic_warfare', 'directed_energy', 'cyber'] }];
  return { series: grp.flatMap(gr => ['D', 'P'].map(s => ({ key: gr.key + ':' + s, label: `${gr.label} (${s === 'D' ? 'demonstrated' : 'developing'})`, v: gr.v, dev: s === 'P',
    vals: decs.map(d => { const st = {}; gr.cats.forEach(c => Object.entries(CAPS.coding[c][d] || {}).forEach(([k, v]) => { st[k] = st[k] === 'D' || v === 'D' ? 'D' : 'P'; })); return Object.values(st).filter(x => x === s).length; }) }))) };
}
function drawB(el = document.getElementById('svgB')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhoneNow();
  // annotation lives in its own band ABOVE the plot, so it never sits on the data
  const ew20 = Object.keys(CAPS.coding.electronic_warfare['2020s']).length;
  const da20 = Object.entries(CAPS.coding.direct_ascent['2020s']).filter(([, v]) => v === 'D').map(([k]) => k);
  const annHead = `Electronic warfare drives most of the crowding: ${ew20} states in the 2020s.`;
  const annSub = `Demonstrated destructive DA-ASAT capability has stayed at four states: ${da20.map(s => s === 'Russia' ? 'USSR/Russia' : s === 'United States' ? 'US' : s).join(', ')}.`;
  const annW = W - 24, annL = wrap(annHead, annW, 12, 600), annS = wrap(annSub, annW, 11.5), annH = (annL.length + annS.length) * 15 + 10;
  const top = annH + 8, plotH = phone ? 330 : 290, H = top + plotH + 30;
  const decs = CAPS.decades, starts = decs.map(d => +d.slice(0, 4));
  const xs = starts.map(s => parse(`${Math.max(1957, s)}-01-01`)).concat([DOMAIN[1]]);
  const { series } = countsB();
  const stackData = xs.map((xd, i) => { const o = { x: xd }; series.forEach(s => o[s.key] = s.vals[Math.min(i, decs.length - 1)]); return o; });
  const stack = d3.stack().keys(series.map(s => s.key)).offset(d3.stackOffsetNone)(stackData);
  const maxY = Math.max(4, d3.max(stack.at(-1) || [[0, 0]], d => d[1]) || 0);
  const y = d3.scaleLinear().domain([0, Math.ceil(maxY / (1 - 44 / plotH) / 2) * 2]).range([top + plotH, top]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'img').attr('aria-labelledby', 'hB').attr('id', 'svgB-root');
  svg.append('desc').text('Stacked step area of the number of states holding each counterspace capability per decade, zero baseline. See the data table for exact counts.');
  const defs = svg.append('defs');
  series.forEach(s => { const p = defs.append('pattern').attr('id', 'hatch-' + s.key.replace(':', '-')).attr('width', 6).attr('height', 6).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)');
    p.append('rect').attr('width', 6).attr('height', 6).style('fill', `var(${s.v})`).style('fill-opacity', 0.14); p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).style('stroke', `var(${s.v})`).style('stroke-width', 2.2); });
  const X2020 = x(parse('2020-01-01'));
  svg.append('rect').attr('x', M.l).attr('width', X2020 - M.l).attr('y', top).attr('height', plotH).style('fill', 'var(--recon)');
  svg.append('text').attr('class', 'band-label').attr('x', M.l + 6).attr('y', top + 12).text(phone ? 'RECONSTRUCTED' : 'RECONSTRUCTED (FADED, NOT SWF-ASSESSED)');
  { const t = svg.append('text').attr('class', 'band-label').attr('text-anchor', 'end').attr('x', W - M.r - 4);
    t.append('tspan').attr('x', W - M.r - 4).attr('y', top + 12).text(phone ? 'SWF 2026' : 'SWF 2026');
    t.append('tspan').attr('x', W - M.r - 4).attr('dy', 12).text(phone ? '13 states' : '13 STATES ASSESSED'); }
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')));
  svg.append('text').attr('class', 'ann-sub').attr('transform', `translate(12,${top + plotH / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(stateB.group === 'cat' ? 'State-capability pairs' : 'Unique states per group');
  const area = d3.area().x(d => x(d.data.x)).y0(d => y(d[0])).y1(d => y(d[1])).curve(d3.curveStepAfter);
  // Reconstructed decades (before 2020) are drawn faded with a dashed outline; SWF-assessed 2020s at full strength.
  defs.append('clipPath').attr('id', 'clipRecon').append('rect').attr('x', M.l).attr('y', top).attr('width', X2020 - M.l).attr('height', plotH);
  defs.append('clipPath').attr('id', 'clipSwf').append('rect').attr('x', X2020).attr('y', top).attr('width', W - M.r - X2020 + 1).attr('height', plotH);
  [['clipRecon', 0.5, '3 2'], ['clipSwf', 1, null]].forEach(([clip, op, dash]) => {
    svg.append('g').attr('clip-path', `url(#${clip})`).attr('class', clip === 'clipRecon' ? 'recon-fill' : 'swf-fill').style('opacity', op).selectAll('path').data(stack).join('path').attr('d', area)
      .style('fill', (d, i) => series[i].dev ? `url(#hatch-${series[i].key.replace(':', '-')})` : `var(${series[i].v})`).style('fill-opacity', (d, i) => series[i].dev ? 1 : 0.85)
      .style('stroke', dash ? 'var(--muted)' : 'var(--bg)').style('stroke-width', dash ? 0.9 : 0.8).style('stroke-dasharray', dash).append('title').text((d, i) => series[i].label + (dash ? ' (reconstructed decades)' : ''));
  });
  // Range marks: per decade a whisker from the lower bound (demonstrated only) to the upper bound (demonstrated + developing), with the numbers.
  const dem = decs.map((d, i) => series.filter(s => !s.dev).reduce((a, s) => a + s.vals[i], 0)), tot = decs.map((d, i) => series.reduce((a, s) => a + s.vals[i], 0));
  const rg = svg.append('g').attr('class', 'rangemarks');
  decs.forEach((d, i) => {
    const xa = x(xs[i]), xb = x(xs[i + 1]), cx = (xa + xb) / 2, lo = dem[i], hi = tot[i], unc = hi > lo, w = xb - xa;
    if (unc && w > 22) { rg.append('path').attr('d', `M${cx - 3},${y(lo)}h6M${cx},${y(lo)}V${y(hi)}M${cx - 3},${y(hi)}h6`).attr('class', 'whisker'); }
    if (w >= 34) rg.append('text').attr('class', 'range-label').attr('x', cx).attr('y', y(hi) - 6).attr('text-anchor', 'middle').text(unc ? `${lo}–${hi}` : `${hi}`);
  });
  xAxis(svg, x, top + plotH);
  addGuide(svg, x, top, top + plotH);
  { const t = svg.append('text').attr('x', 4).attr('y', 14); let n = 0;
    annL.forEach(l => t.append('tspan').attr('class', 'ann').attr('x', 4).attr('dy', n++ ? 15 : 0).text(l));
    annS.forEach(l => t.append('tspan').attr('class', 'ann-sub').attr('x', 4).attr('dy', n++ ? 15 : 0).text(l)); }
  if (EXPORTING) return;
  document.getElementById('noteB').innerHTML = (stateB.group === 'cat'
    ? 'Vertical axis: state-capability pairs. A state with two capabilities is counted twice.'
    : 'Vertical axis changed: unique states per group, not pairs. A state with both kinetic and non-kinetic capability is counted once in each group, so the two bands can sum to more than the number of states.')
    + ' Numbers above each decade give the range: demonstrated only to demonstrated plus developing (whisker). In the 2020s the states are SWF-assessed but the demonstrated/developing split is the builder’s coding of SWF text, so that range is the uncertain part. See the <a href="#codingRules">coding rules</a>.';
  // legend + chips
  legend('legendB', 18, 12)
    .item('<rect x="-9" y="-6" width="18" height="12" style="fill:var(--muted)"/>', 'Demonstrated (tested or used)')
    .item('<rect x="-9" y="-6" width="18" height="12" style="fill:var(--muted);fill-opacity:.4;stroke:var(--muted);stroke-dasharray:3 2"/>', 'Faded, dashed: reconstructed decade (not SWF-assessed)')
    .item('<path d="M-3,-6h6M0,-6V6M-3,6h6" style="stroke:var(--text);stroke-width:1.4;fill:none"/>', 'Range: demonstrated only (low) to demonstrated + developing (high)', 18)
    .item('<defs><pattern id="lh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line y2="5" style="stroke:var(--muted);stroke-width:2"/></pattern></defs><rect x="-9" y="-6" width="18" height="12" fill="url(#lh)"/>', 'Developing or latent').done();
  table('tableB', ['Category', ...CAPS.decades], CATS.map(c => [c.label, ...CAPS.decades.map(d => { const o = CAPS.coding[c.key][d] || {}; const D_ = Object.keys(o).filter(k => o[k] === 'D'), P_ = Object.keys(o).filter(k => o[k] === 'P'); return `${D_.length} demonstrated${D_.length ? ' (' + D_.join(', ') + ')' : ''}; ${P_.length} developing${P_.length ? ' (' + P_.join(', ') + ')' : ''}`; })]));
}
// Chips are built once and updated in place, so a toggle never drops keyboard focus.
function chipsB() {
  const el = document.getElementById('chipsB');
  if (!el.children.length) CATS.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.key = c.key; b.innerHTML = `<i style="background:var(${c.v})"></i>${c.label}`;
    b.onclick = () => { stateB.on.has(c.key) ? stateB.on.delete(c.key) : stateB.on.add(c.key); if (!stateB.on.size) stateB.on.add(c.key); chipsB(); drawB(); };
    el.appendChild(b);
  });
  [...el.children].forEach(b => { b.setAttribute('aria-pressed', stateB.on.has(b.dataset.key)); b.disabled = stateB.group !== 'cat'; });
}
document.getElementById('cFocus').onclick = () => { stateC.focus = true; drawC(); };
document.getElementById('cFull').onclick = () => { stateC.focus = false; drawC(); };
document.getElementById('grpCat').onclick = () => { stateB.group = 'cat'; grpBtns(); chipsB(); drawB(); };
document.getElementById('grpKin').onclick = () => { stateB.group = 'kin'; grpBtns(); chipsB(); drawB(); };
function grpBtns() { document.getElementById('grpCat').setAttribute('aria-pressed', stateB.group === 'cat'); document.getElementById('grpKin').setAttribute('aria-pressed', stateB.group === 'kin'); }

