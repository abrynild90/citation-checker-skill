// The lag panel: capability milestone to legal response.
// ---------------------------------------------------------------- Lag panel
const LAG = [
  { cap: 'us-1959-bold-orion', law: 'ost-1967', text: 'First DA-ASAT flyby → Outer Space Treaty (silent on conventional ASATs)' },
  { cap: 'us-1962-starfish-prime', law: 'ltbt-1963', text: 'Starfish Prime → Limited Test Ban Treaty (followed it)' },
  { cap: 'cn-2007-fy1c', law: 'unga-77-41', text: 'Fengyun-1C debris → UNGA 77/41 call to stop destructive tests (non-binding)' },
  { cap: 'ru-2021-cosmos1408', law: 'us-moratorium-2022', text: 'Cosmos 1408 → US test moratorium (unilateral pledge)' },
  { cap: 'ru-2014-ukraine', law: 'icao-2025', text: 'Russian GNSS interference (from 2014) → first ICAO finding against Russia' },
  { cap: 'ru-2024-eu-sats', law: 'itu-rrb-2024', text: 'Jamming of European satellites → ITU RRB “grave concern”' },
  { cap: 'us-1997-miracl', law: null, text: 'Laser fired at a satellite → no specific rule on lasers against satellites' },
  { cap: 'ru-2022-viasat', law: null, text: 'Viasat cyberattack → attributions only; Tallinn 2.0 is soft law' },
];
const capDate = r => parse(r.date || r.start);
const HEX = 'M0,-6.5L5.6,-3.25L5.6,3.25L0,6.5L-5.6,3.25L-5.6,-3.25Z';
const ELBOW = 17, SHORT_PX = 40;
// Geometry of one pair. Short lags (glyphs would overprint) get a taller row so the milestone can sit well above the response.
function lagRow(p, lines, x, FS) {
  const c = byId[p.cap], l = p.law ? byId[p.law] : null, xa = x(capDate(c)), xb = x(l ? parse(l.start) : DOMAIN[1]);
  const short = !!l && Math.abs(xb - xa) < SHORT_PX, w = Math.max(...lines.map(s => tw(s, FS)));
  return { p, c, l, lines, w, xa, xb, short, rowH: lines.length * (FS + 3) + 64 + (short ? 2 * ELBOW - 8 : 0) };
}
function drawL(el = document.getElementById('svgL')) {
  el.innerHTML = '';
  const { W, M, x } = layout(el), phone = isPhoneNow();
  const FS = phone ? 11 : 12, top = 10, maxW = W - 24;
  const rowsInfo = LAG.map(p => lagRow(p, wrap(p.text, maxW, FS), x, FS));
  const H = top + rowsInfo.reduce((s, r) => s + r.rowH, 0) + 30, yAx = H - 28;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-labelledby', 'hL').attr('id', 'svgL-root');
  svg.append('desc').text('Dumbbell chart: for each pair, a hexagon marks the capability milestone and a shape marks the legal or policy response (circle for treaty, square for a resolution or body finding, triangle for a unilateral pledge). The gap is the lag in years. An open ring means no binding rule yet.');
  svg.append('g').attr('class', 'gridline').attr('transform', `translate(0,${yAx})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(phone ? 20 : 10)).tickSize(-(yAx - top)).tickFormat(''));
  xAxis(svg, x, yAx);
  const rows = []; let y0 = top;
  rowsInfo.forEach(({ p, c, l, lines, w, xa, xb, short, rowH }) => {
    const a = capDate(c), yy = y0 + lines.length * (FS + 3) + 18 + (short ? ELBOW - 2 : 0);
    const years = l ? ((parse(l.start) - a) / (365.25 * 864e5)) : null;
    const col = c.domain === 'kinetic' ? 'var(--cat-da)' : 'var(--cat-ew)';
    const lagTxt = l ? (years < 1 ? `${Math.round(years * 12)} months` : `${years.toFixed(1)} years`) : 'no binding rule yet';
    const g = svg.append('g').attr('class', 'mark').attr('tabindex', 0).attr('role', 'img').attr('data-t', +a).attr('aria-label', `${p.text}. ${l ? lagTxt : 'No binding response yet'}.`);
    g.append('rect').attr('class', 'hit').attr('x', 6).attr('y', y0 - 2).attr('width', W - 12).attr('height', rowH - 6).attr('rx', 6);
    const tx = phone ? 12 : Math.max(12, Math.min(Math.min(xa, xb) - 6, W - 12 - w));
    lines.forEach((s, i) => g.append('text').attr('x', tx).attr('y', y0 + (i + 1) * (FS + 3) - 2).style('fill', 'var(--text)').style('font', `${FS}px var(--sans)`).text(s));
    // Short lags: lift the milestone and drop the response, joined by an elbow connector; x stays truthful to the dates.
    const ya = short ? yy - ELBOW : yy, yb = short ? yy + ELBOW : yy;
    if (short) g.append('path').attr('d', `M${xa},${ya}H${xb}V${yb}`).style('fill', 'none').style('stroke', col).style('stroke-width', 2.5);
    else g.append('line').attr('x1', xa).attr('x2', xb - (l ? 0 : 9)).attr('y1', yy).attr('y2', yy).style('stroke', col).style('stroke-width', 2.5).style('stroke-dasharray', l ? null : '3 3');
    g.append('path').attr('d', HEX).attr('transform', `translate(${xa},${ya}) scale(1.45)`).style('fill', col).style('stroke', 'var(--bg)').style('stroke-width', 1);
    if (l) legalGlyph(g.append('g').attr('transform', `translate(${xb},${yb}) scale(1.7)`), l);
    else g.append('circle').attr('cx', xb - 9).attr('cy', yy).attr('r', 8).style('fill', 'var(--bg)').style('stroke', 'var(--accent)').style('stroke-width', 2);
    const lw = tw(lagTxt, 12, 600), mid = Math.max(14 + lw / 2, Math.min(W - 14 - lw / 2, (xa + xb) / 2));
    if (short) { const lagTxtS = years < 1 ? `${Math.round(years * 12)} mo` : lagTxt, lw = tw(lagTxtS, 12, 600); const left = Math.min(xa, xb) - 18 - lw >= 4; g.append('text').attr('x', left ? Math.min(xa, xb) - 18 : Math.max(xa, xb) + 18).attr('y', yy + 4).attr('text-anchor', left ? 'end' : 'start').style('fill', 'var(--accent-2)').style('font', '600 12px var(--sans)').text(lagTxtS); }
    else g.append('text').attr('x', mid).attr('y', yy + 27).attr('text-anchor', 'middle').style('fill', 'var(--accent-2)').style('font', '600 12px var(--sans)').text(lagTxt);
    rows.push([p.text, c.date || c.start, l ? l.start : '—', l ? `${l.kind.replace('_', ' ')}${l.soft_law ? ' (soft law)' : ''}` : '—', l ? years.toFixed(1) : 'open', `${c.id}${l ? ' → ' + l.id : ''}`]);
    y0 += rowH;
  });
  addGuide(svg, x, top, yAx);
  rove(svg.selectAll('.mark'));
  if (EXPORTING) return;
  const L = document.getElementById('legendL'); L.innerHTML = '';
  const li = (inner, text) => L.insertAdjacentHTML('beforeend', `<li><svg width="20" height="16" viewBox="-10 -8 20 16" aria-hidden="true">${inner}</svg>${text}</li>`);
  li(`<path d="${HEX}" style="fill:var(--cat-da)"/>`, 'Kinetic capability milestone');
  li(`<path d="${HEX}" style="fill:var(--cat-ew)"/>`, 'Non-kinetic milestone');
  li('<circle r="5.5" style="fill:var(--accent)"/>', 'Response: treaty (binding)');
  li('<rect x="-5" y="-5" width="10" height="10" style="fill:var(--accent)"/>', 'Response: resolution or body finding (non-binding)');
  li('<path d="M0,-6.5L6.5,5L-6.5,5Z" style="fill:var(--accent)"/>', 'Response: unilateral pledge');
  li('<circle r="5" style="fill:none;stroke:var(--accent);stroke-width:2"/>', 'No binding rule yet');
  table('tableL', ['Pair', 'Capability date', 'Response date', 'Response kind', 'Lag (years)', 'Ledger rows'], rows);
}

