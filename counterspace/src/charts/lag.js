// ============================================================================
// charts/lag.js: the chronology panel (elapsed time from a capability milestone to a later legal or policy step; not a causal claim).
// Provides: drawL().
// ============================================================================
// Pairs come from data/lag_pairs.json (embedded as D.lag_pairs): pairs first, then open rings. Dropped pairs are never drawn.
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { D, DOMAIN, EXPORTING, byId, isPhoneNow, layout, parse, tw, wrap, xAxis } from '../app.js';
import { legalGlyph } from './legal.js';
import { addGuide, legend, rove, table } from '../ui.js';
const LAG = [
  ...D.lag_pairs.pairs.map((p) => ({ cap: p.event, law: p.law, text: p.text })),
  ...D.lag_pairs.open.map((p) => ({ cap: p.event, law: null, text: p.text })),
];
const capDate = (r) => parse(r.date || r.start);
const HEX = 'M0,-6.5L5.6,-3.25L5.6,3.25L0,6.5L-5.6,3.25L-5.6,-3.25Z';
const ELBOW = 17,
  SHORT_PX = 40;
// Geometry of one pair. Short lags (glyphs would overprint) get a taller row so the milestone can sit well above the response.
function lagRow(p, lines, x, FS) {
  const c = byId[p.cap],
    l = p.law ? byId[p.law] : null,
    xa = x(capDate(c)),
    xb = l ? x(parse(l.start)) : x(DOMAIN[1]) - 9; // open ring sits just inside the axis end
  const short = Math.abs(xb - xa) < SHORT_PX,
    w = Math.max(...lines.map((s) => tw(s, FS)));
  return { p, c, l, lines, w, xa, xb, short, rowH: lines.length * (FS + 3) + 64 + (short ? 2 * ELBOW - 8 : 0) };
}
export function drawL(el = document.getElementById('svgL')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el),
    phone = isPhoneNow();
  const FS = phone ? 11 : 12,
    top = 10,
    maxW = W - 24;
  const rowsInfo = LAG.map((p) => lagRow(p, wrap(p.text, maxW, FS), x, FS));
  const H = top + rowsInfo.reduce((s, r) => s + r.rowH, 0) + 30,
    yAx = H - 28;
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
      'Dumbbell chart: for each pair, a hexagon marks the capability milestone and a shape marks the later legal or policy step (circle for treaty, square for a resolution or body finding, triangle for a unilateral pledge). The gap is the elapsed time in years, shown as chronology, not causation. An open ring means no later legal item is paired in the ledger.',
    );
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(0,${yAx})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(d3.utcYear.every(phone ? 20 : 10))
        .tickSize(-(yAx - top))
        .tickFormat(''),
    );
  xAxis(svg, x, yAx);
  const rows = [];
  let y0 = top;
  rowsInfo.forEach(({ p, c, l, lines, w, xa, xb, short, rowH }) => {
    const a = capDate(c),
      yy = y0 + lines.length * (FS + 3) + 18 + (short ? ELBOW - 2 : 0);
    const years = l ? (parse(l.start) - a) / (365.25 * 864e5) : null;
    const col = c.domain === 'kinetic' ? 'var(--cat-da)' : 'var(--cat-ew)';
    const lagTxt = l ? (years < 1 ? `${Math.round(years * 12)} months` : `${years.toFixed(1)} years`) : 'open: none paired in ledger';
    const g = svg
      .append('g')
      .attr('class', 'mark')
      .attr('tabindex', 0)
      .attr('role', 'img')
      .attr('data-t', +a)
      .attr('aria-label', `${p.text}. ${l ? lagTxt : 'No later ledger item is paired with it'}.`);
    g.append('rect')
      .attr('class', 'hit')
      .attr('x', 6)
      .attr('y', y0 - 2)
      .attr('width', W - 12)
      .attr('height', rowH - 6)
      .attr('rx', 6);
    const tx = phone ? 12 : Math.max(12, Math.min(Math.min(xa, xb) - 6, W - 12 - w));
    lines.forEach((s, i) =>
      g
        .append('text')
        .attr('x', tx)
        .attr('y', y0 + (i + 1) * (FS + 3) - 2)
        .style('fill', 'var(--text)')
        .style('font', `${FS}px var(--sans)`)
        .text(s),
    );
    // Short lags: lift the milestone and drop the response, joined by an elbow connector; x stays truthful to the dates.
    const ya = short ? yy - ELBOW : yy,
      yb = short ? yy + ELBOW : yy;
    if (short) g.append('path').attr('d', `M${xa},${ya}H${xb}V${yb}`).style('fill', 'none').style('stroke', col).style('stroke-width', 2.5);
    else
      g.append('line')
        .attr('x1', xa)
        .attr('x2', xb)
        .attr('y1', yy)
        .attr('y2', yy)
        .style('stroke', col)
        .style('stroke-width', 2.5)
        .style('stroke-dasharray', l ? null : '3 3');
    g.append('path')
      .attr('d', HEX)
      .attr('transform', `translate(${xa},${ya}) scale(1.45)`)
      .style('fill', col)
      .style('stroke', 'var(--bg)')
      .style('stroke-width', 1);
    if (l) legalGlyph(g.append('g').attr('transform', `translate(${xb},${yb}) scale(1.7)`), l);
    else
      g.append('circle')
        .attr('cx', xb)
        .attr('cy', yb)
        .attr('r', 8)
        .style('fill', 'var(--bg)')
        .style('stroke', 'var(--accent)')
        .style('stroke-width', 2);
    const lw = tw(lagTxt, 12, 600),
      mid = Math.max(14 + lw / 2, Math.min(W - 14 - lw / 2, (xa + xb) / 2));
    if (short) {
      const lagTxtS = l && years < 1 ? `${Math.round(years * 12)} mo` : lagTxt,
        lw = tw(lagTxtS, 12, 600);
      const left = Math.min(xa, xb) - 18 - lw >= 4;
      g.append('text')
        .attr('x', left ? Math.min(xa, xb) - 18 : Math.max(xa, xb) + 18)
        .attr('y', yy + 4)
        .attr('text-anchor', left ? 'end' : 'start')
        .style('fill', 'var(--accent-2)')
        .style('font', '600 12px var(--sans)')
        .text(lagTxtS);
    } else
      g.append('text')
        .attr('x', mid)
        .attr('y', yy + 27)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--accent-2)')
        .style('font', '600 12px var(--sans)')
        .text(lagTxt);
    rows.push([
      p.text,
      c.date || c.start,
      l ? l.start : '—',
      l ? `${l.kind.replace('_', ' ')}${l.soft_law ? ' (soft law)' : ''}` : '—',
      l ? years.toFixed(1) : 'open',
      `${c.id}${l ? ' → ' + l.id : ''}`,
    ]);
    y0 += rowH;
  });
  addGuide(svg, x, top, yAx);
  rove(svg.selectAll('.mark'));
  if (EXPORTING) return;
  const L = legend('legendL', 20, 16),
    li = L.item;
  li(`<path d="${HEX}" style="fill:var(--cat-da)"/>`, 'Kinetic capability milestone');
  li(`<path d="${HEX}" style="fill:var(--cat-ew)"/>`, 'Non-kinetic milestone');
  li('<circle r="5.5" style="fill:var(--accent)"/>', 'Later step: treaty (binding)');
  li('<rect x="-5" y="-5" width="10" height="10" style="fill:var(--accent)"/>', 'Later step: resolution or body finding (non-binding)');
  li('<path d="M0,-6.5L6.5,5L-6.5,5Z" style="fill:var(--accent)"/>', 'Later step: unilateral pledge');
  li('<circle r="5" style="fill:none;stroke:var(--accent);stroke-width:2"/>', 'Open ring: no later legal item paired in the ledger');
  L.done();
  table('tableL', ['Pair', 'Capability date', 'Later legal step date', 'Legal step kind', 'Elapsed (years)', 'Ledger rows'], rows);
}
