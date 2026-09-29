// ============================================================================
// charts/legal.js: legal band (sticky, dodged marks, 2021-26 zoom, phone strip with tap-to-label), key and list.
// Provides: drawLegal(), drawLegalKey(), legalGlyph(), legalScroll().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { DOMAIN, EXPORTING, LEGAL, Placer, badge, esc, fmt, fmtMY, fmtY, hasScene, isPhoneNow, layout, parse, tw } from '../app.js';
import { activate, addGuide, bindMark, legalCard, legend, rove, setGuide, table } from '../ui.js';
import { hooks } from '../shared.js';
const ABBR = { 'ltbt-1963': 'LTBT', 'ost-1967': 'OST', 'abm-1972': 'ABM Art. XII', 'paros-1981': 'PAROS', 'cd-paros-committee': 'CD PAROS cttee', 'itu-1992': 'ITU Arts. 45/48', 'ppwt-2008': 'PPWT', 'ppwt-2014': 'PPWT II', 'tallinn-2017': 'Tallinn 2.0*', 'unga-75-36': 'UNGA 75/36', 'oewg-2022': 'OEWG', 'us-moratorium-2022': 'US moratorium', 'milamos-2022': 'MILAMOS*', 'unga-77-41': 'UNGA 77/41', 'unsc-veto-2024': 'UNSC veto (nukes)', 'woomera-2024': 'Woomera*', 'itu-rrb-2024': 'ITU RRB ’24', 'icao-2025': 'ICAO ’25', 'itu-rrb-2025': 'ITU RRB ’25' };
const SHORT = { 'tallinn-2017': 'Tallinn*', 'unga-75-36': '75/36', 'milamos-2022': 'MILAMOS*', 'us-moratorium-2022': 'US pledge', 'unga-77-41': '77/41', 'woomera-2024': 'Woomera*', 'unsc-veto-2024': 'Veto', 'itu-rrb-2024': 'RRB ’24', 'icao-2025': 'ICAO ’25', 'itu-rrb-2025': 'RRB ’25' };
export const ABBR_NOTE = 'LTBT: Limited Test Ban Treaty. OST: Outer Space Treaty. ABM Art. XII: ABM Treaty (non-interference with national technical means). PAROS: Prevention of an Arms Race in Outer Space. CD: Conference on Disarmament. ITU Arts. 45/48: ITU Constitution (harmful interference; military radio services). PPWT: Russia-China draft treaty on the placement of weapons in outer space. UNGA 75/36 and 77/41: UN General Assembly resolutions. OEWG: Open-ended Working Group. US pledge: 2022 US DA-ASAT test moratorium. Veto: Russia’s April 2024 veto of a UN Security Council draft on nuclear weapons in orbit (it did not concern DA-ASAT testing). RRB: ITU Radio Regulations Board. ICAO: International Civil Aviation Organization. An asterisk marks soft law (expert manuals, not binding).';
const SPAN_LABEL = { 'paros-1981': 'PAROS: UNGA agenda item since 1981', 'cd-paros-committee': 'CD Ad Hoc Cttee on PAROS, 1985–94', 'oewg-2022': 'OEWG, 2022–23' };
const KIND_LABEL = { treaty: 'Treaty', resolution: 'Resolution / body finding', unilateral: 'Unilateral pledge or soft law', veto: 'Veto', negotiation_span: 'Negotiation' };
export function legalGlyph(sel, l) {
  if (l.soft_law) sel.append('path').attr('d', 'M0,-6.5L6.5,0L0,6.5L-6.5,0Z').style('fill', 'var(--bg)').style('stroke', 'var(--accent-2)').style('stroke-width', 1.8);
  else if (l.kind === 'treaty') sel.append('circle').attr('r', 5.5).style('fill', 'var(--accent)').style('stroke', 'var(--bg)').style('stroke-width', 1);
  else if (l.kind === 'resolution') sel.append('rect').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10).style('fill', 'var(--accent)').style('stroke', 'var(--bg)').style('stroke-width', 1);
  else if (l.kind === 'unilateral') sel.append('path').attr('d', 'M0,-6.5L6.5,5L-6.5,5Z').style('fill', 'var(--accent)').style('stroke', 'var(--bg)').style('stroke-width', 1);
  else if (l.kind === 'veto') sel.append('path').attr('d', 'M-5,-5L5,5M5,-5L-5,5').style('stroke', 'var(--warn)').style('stroke-width', 2.8);
  else sel.append('path').attr('d', 'M0,-5.5L5.5,0L0,5.5L-5.5,0Z').style('fill', 'var(--muted)').style('stroke', 'var(--bg)').style('stroke-width', 1).attr('transform', 'scale(0.9)');
}
const ZOOM = [parse('2021-06-01'), parse('2026-07-01')];
export function drawLegal(el = document.getElementById('legalSvg'), zoom = false) {
  el.innerHTML = '';
  // On phones the band becomes a horizontally scrollable, fully labelled strip (desktop layout at STRIP_W px), scrolled to the recent cluster.
  const strip = isPhoneNow() && !zoom && !EXPORTING && el.id === 'legalSvg';
  { const tap = document.getElementById('legalTap'); tap.hidden = !strip; if (strip && !tap.dataset.on) tap.textContent = 'Tap a mark on the strip for its label.'; }
  el.style.overflowX = strip ? 'auto' : ''; el.tabIndex = strip ? 0 : -1; if (!strip) el.removeAttribute('tabindex');
  if (strip) { el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Law and policy timeline, scrolls sideways'); } else { el.removeAttribute('role'); el.removeAttribute('aria-label'); }
  const { W, M, x } = layout(el, zoom ? ZOOM : DOMAIN, strip ? 1100 : 300);
  const phone = isPhoneNow() && !zoom && !strip, compact = legalCompact && !phone && !EXPORTING && !zoom, small = phone || compact;
  const FS = 10.5, PITCH = 13, TP = phone ? 16 : compact ? 14 : 25, SEP = phone ? 20 : compact ? 16 : 32, GS = phone ? 0.85 : compact ? 0.75 : 1;
  const spans = LEGAL.filter(l => l.kind === 'negotiation_span' && (l.end || l.id === 'paros-1981') && (!zoom || ((l.end ? parse(l.end) : DOMAIN[1]) > ZOOM[0] && parse(l.start) < ZOOM[1])));
  const pts = LEGAL.filter(l => !spans.includes(l) && (!zoom || (x(parse(l.start)) >= M.l - 1 && x(parse(l.start)) <= W - M.r + 1))).sort((a, b) => a.start < b.start ? -1 : 1);
  // 1. dodge marks that would collide into tracks (the true date stays on the axis)
  const last = []; let maxT = 0;
  pts.forEach(d => { const cx = x(parse(d.start)); let t = 0; while (last[t] != null && cx - last[t] < SEP) t++; last[t] = cx + (hasScene(d) ? 6 : 0); d._t = t; d._cx = cx; maxT = Math.max(maxT, t); });
  // 2. label placement, coordinates relative to the mark line (up is negative, down positive)
  const pl = new Placer({ x0: 4, x1: W - 4, y0: -999, y1: 999 }), top0 = 16 + TP * maxT, labels = []; let maxUp = -1, maxDn = -1;
  // The 2021-26 crowd is NUMBERED on the main band (marks keep their true dates on the shared scale) and keyed in a two-column list in the empty
  // band area left of the dashed window; full labels live in the zoom inset below. Falls back to plain labels if the list or a number does not fit.
  const zx0 = x(ZOOM[0]); let key = null; pts.forEach(d => { d._n = d._num = null; });
  if (!small && !zoom && !strip) {
    const cand = pts.filter(d => d._cx >= zx0 - 2), rows = Math.ceil(cand.length / 2), cw = [0, 0];
    const ents = cand.map((d, i) => ({ d, n: i + 1, col: Math.floor(i / rows), row: i % rows, t: ABBR[d.id] || d.label, when: fmtMY(parse(d.start)) }));
    ents.forEach(e => { e.w = 17 + tw(e.t, FS, 600) + 8 + tw(e.when, FS - 1); cw[e.col] = Math.max(cw[e.col], e.w); });
    const total = cw[0] + (cw[1] ? cw[1] + 20 : 0), hgt = 16 + rows * PITCH;
    if (cand.length >= 3 && zx0 - M.l - 20 >= total) key = { ents, cw, total, hgt, x0: zx0 - 14 - total, rel: -34 - hgt };
  }
  if (!small) {
    pts.forEach(d => { const bw = hasScene(d) ? 15 : 8; pl.add([d._cx - 8, -d._t * TP - 9 - (hasScene(d) ? 8 : 0), d._cx + bw, -d._t * TP + 8], 'G'); });
    if (key) {
      const base = pl.r.length; let ok = true;
      pts.filter(d => d._t).forEach(d => pl.add([d._cx - 1.5, -d._t * TP, d._cx + 1.5, 0], 'S'));
      pl.add([key.x0 - 4, key.rel - 2, key.x0 + key.total + 4, key.rel + key.hgt + 2], 'K');
      key.ents.forEach(({ d, n }) => {
        const w = tw(String(n), FS, 700), bw = hasScene(d) ? 18 : 11; let hit = null;
        for (const [anchor, dx, dy] of [['end', -10.5, 3.7], ['start', bw, 3.7], ['end', -10.5, 12], ['start', bw, 12], ['middle', 0, -12], ['end', -10.5, -8], ['middle', 0, 18]]) { const q = pl.textRect(d._cx + dx, -d._t * TP + dy, anchor, w, FS); if (pl.free(q, [], 0.5)) { pl.add(q, 'N'); hit = { anchor, dx, dy }; break; } }
        if (!hit) { ok = false; console.warn('num fail', d.id, d._t, d._cx); } d._num = hit; d._n = n;
      });
      if (!ok) { console.warn('legal numbering fell back to labels'); pl.r.length = base; pts.forEach(d => { d._n = d._num = null; }); key = null; }
    }
    // Clusters of nearby marks are solved together. Several deterministic strategies (labels ending at their mark, starting at it,
    // V-shaped splits) run on rows above AND below the mark line; the one needing the fewest rows wins. Every label and leader is
    // tested against all other labels, marks, leaders and the edges.
    const clusters = []; pts.filter(d => !d._n).forEach(d => { const c = clusters.at(-1); if (c && d._cx - c.at(-1)._cx < 200) c.push(d); else clusters.push([d]); });
    const anchorsOf = { end: [['end', -2]], start: [['start', 2]], middle: [['middle', 0], ['end', -2], ['start', 2]] };
    const run = (order, prim, commit) => {
      const base = pl.r.length, out = []; let mu = -1, md = -1, ok = true;
      for (const d of order) {
        const t = zoom ? (isPhoneNow() ? SHORT[d.id] || ABBR[d.id] : ABBR[d.id]) || d.label : SHORT[d.id] || ABBR[d.id] || d.label, w = tw(t, FS, 600); let hit = null;
        for (let k = 0; k < 12 && !hit; k++) for (const dir of ['dn', 'up']) { if (hit) break; for (const [anchor, dx] of anchorsOf[prim(d)]) {
          const off = dir === 'up' ? -(top0 + k * PITCH) : 20 + k * PITCH, q = pl.textRect(d._cx + dx, off, anchor, w, FS);
          const ld = dir === 'up' ? [d._cx - 0.75, off + 3, d._cx + 0.75, -d._t * TP - 8] : [d._cx - 0.75, 9, d._cx + 0.75, off - FS];
          if (pl.free(q) && pl.free(ld, ['G', 'L'])) { pl.r.push([...q, 'T'], [...ld, 'L']); hit = { d, t, tx: d._cx + dx, off, anchor, dir }; if (dir === 'up') mu = Math.max(mu, k); else md = Math.max(md, k); break; }
        } }
        if (!hit) { ok = false; break; } out.push(hit);
      }
      if (!commit || !ok) pl.r.length = base;
      return ok ? { out, mu, md, cost: (mu + 1) + (md + 1) } : null;
    };
    clusters.forEach(list => {
      const cands = [];
      for (let m = 0; m <= list.length; m++) {
        const L = list.slice(0, m), Rt = list.slice(m).reverse(), prim = d => list.indexOf(d) < m ? 'end' : 'start';
        cands.push({ order: [...L, ...Rt], prim }, { order: [...Rt, ...L], prim });
      }
      if (list.length === 1) cands.unshift({ order: list, prim: () => 'middle' });
      let best = null; cands.forEach(c => { const r = run(c.order, c.prim, false); if (r && (!best || r.cost < best.r.cost)) best = { c, r }; });
      if (!best) { console.warn('legal labels unplaced', list.map(d => d.id)); return; }
      const r = run(best.c.order, best.c.prim, true); labels.push(...r.out); maxUp = Math.max(maxUp, r.mu); maxDn = Math.max(maxDn, r.md);
    });
  }
  // Sticky (compact) band: abbreviated labels sit under the line where they fit; marks that do not fit keep the hover/focus card.
  const cLabels = [];
  if (compact) { const p2 = new Placer({ x0: 2, x1: W - 2, y0: -999, y1: 999 });
    pts.slice().reverse().forEach(d => { const s = SHORT[d.id] || ABBR[d.id] || d.label, w = tw(s, 10, 600);
      for (const [anchor, dx] of [['middle', 0], ['end', 5], ['start', -5]]) { const q = p2.textRect(d._cx + dx, 11, anchor, w, 10); if (p2.free(q, [], 2.5)) { p2.add(q); cLabels.push({ d, s, tx: d._cx + dx, anchor }); break; } } }); }
  const yMark = small ? TP * maxT + 12 : Math.max(maxUp >= 0 ? top0 + maxUp * PITCH + 12 : 0, TP * maxT + 24, key ? -key.rel + 8 : 0);
  const dnSpace = !small && maxDn >= 0 ? 20 + maxDn * PITCH + 8 : 0;
  // spans: lanes below the mark line (and below any labels hanging under it)
  const lanes = [];
  spans.sort((a, b) => a.start < b.start ? -1 : 1).forEach(d => { const a = Math.max(M.l, x(parse(d.start))), b = Math.min(W - M.r, d.end ? x(parse(d.end)) : x(DOMAIN[1])); let i = lanes.findIndex(e => a > e + 6); if (i < 0) { i = lanes.length; lanes.push(0); } lanes[i] = b; d._lane = i; d._a = a; d._b = b; });
  const laneP = phone ? 9 : compact ? 6 : 18, lane0 = yMark + (small ? (compact ? 23 : 14) : Math.max(28, dnSpace + 18));
  const yAx = lane0 + (lanes.length - 1) * laneP + (compact ? 8 : 10), H = yAx + 22;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group').attr('aria-label', zoom ? 'Legal and policy timeline, zoom on 2021 to 2026' : 'Legal and policy timeline');
  svg.append('title').text(zoom ? 'Law and policy responses, zoom 2021–2026' : 'Law and policy responses, 1957–2026');
  if (!zoom) { const zx0 = x(ZOOM[0]), zx1 = W - M.r; svg.append('rect').attr('class', 'zoombox').attr('x', zx0).attr('width', zx1 - zx0).attr('y', 0).attr('height', yAx).attr('rx', 3).attr('aria-hidden', 'true'); }
  svg.append('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', yMark).attr('y2', yMark).style('stroke', 'var(--line)');
  if (compact) svg.append('text').attr('class', 'band-label').attr('x', 4).attr('y', yMark + 4).text('LAW');
  // labels + leaders
  const lg = svg.append('g').attr('class', 'lbls').attr('aria-hidden', 'true');
  labels.forEach(({ d, t, tx, off, anchor, dir }) => {
    if (dir === 'up') lg.append('line').attr('x1', d._cx).attr('x2', d._cx).attr('y1', yMark + off + 3).attr('y2', yMark - d._t * TP - 8).style('stroke', 'var(--line)');
    else lg.append('line').attr('x1', d._cx).attr('x2', d._cx).attr('y1', yMark + 9).attr('y2', yMark + off - FS).style('stroke', 'var(--line)');
    lg.append('text').attr('x', tx).attr('y', yMark + off).attr('text-anchor', anchor).style('fill', d.soft_law ? 'var(--accent-2)' : 'var(--text)').style('font', `600 ${FS}px var(--sans)`).text(t);
  });
  cLabels.forEach(({ d, s, tx, anchor }) => lg.append('text').attr('x', tx).attr('y', yMark + 11).attr('text-anchor', anchor).style('fill', d.soft_law ? 'var(--accent-2)' : 'var(--text)').style('font', '600 10px var(--sans)').text(s));
  if (key) {
    const ky = yMark + key.rel;
    lg.append('text').attr('class', 'band-label').attr('x', key.x0).attr('y', ky + 8).text('2021–26 MARKS, NUMBERED');
    key.ents.forEach(e => {
      const cx0 = key.x0 + (e.col ? key.cw[0] + 20 : 0), yy = ky + 16 + (e.row + 1) * PITCH - 3, soft = e.d.soft_law;
      lg.append('text').attr('x', cx0).attr('y', yy).style('fill', 'var(--accent)').style('font', `700 ${FS}px var(--sans)`).text(e.n);
      lg.append('text').attr('x', cx0 + 17).attr('y', yy).style('fill', soft ? 'var(--accent-2)' : 'var(--text)').style('font', `600 ${FS}px var(--sans)`).text(e.t);
      lg.append('text').attr('x', cx0 + e.w).attr('y', yy).attr('text-anchor', 'end').style('fill', 'var(--muted)').style('font', `${FS - 0.5}px var(--sans)`).text(e.when);
    });
  }
  // spans
  const sg = svg.append('g').selectAll('g').data(spans).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id).attr('data-t', d => +parse(d.start))
    .attr('aria-label', d => `${d.label}, ${fmtY(parse(d.start))} to ${d.end ? fmtY(parse(d.end)) : 'present'}. ${d.short_note}`);
  sg.append('rect').attr('x', d => d._a).attr('width', d => Math.max(3, d._b - d._a)).attr('y', d => lane0 + d._lane * laneP + 2).attr('height', compact ? 3 : 4).attr('rx', 2).style('fill', 'var(--accent)').style('opacity', 0.55);
  sg.append('rect').attr('class', 'hit').attr('x', d => d._a - 2).attr('width', d => Math.max(10, d._b - d._a + 4)).attr('y', d => lane0 + d._lane * laneP - (compact ? 2 : 10)).attr('height', compact ? 10 : 24);
  if (!small) spans.forEach(d => {
    const t = SPAN_LABEL[d.id] || d.label, w = tw(t, FS, 600), y = lane0 + d._lane * laneP - 2;
    const anchor = d._a + w <= W - 6 ? 'start' : 'end', tx = anchor === 'start' ? d._a : Math.min(W - 6, d._b);
    lg.append('text').attr('x', tx).attr('y', y).attr('text-anchor', anchor).style('fill', 'var(--muted)').style('font', `600 ${FS}px var(--sans)`).text(t);
  });
  bindMark(sg, strip ? null : legalCard, strip ? tapLegal : activate);
  // points
  pts.forEach(d => { d._y = yMark - d._t * TP; });
  svg.append('g').selectAll('line').data(pts.filter(d => d._t)).join('line').attr('x1', d => d._cx).attr('x2', d => d._cx).attr('y1', d => d._y).attr('y2', yMark).style('stroke', 'var(--faint)').style('stroke-width', 1.25);
  svg.append('g').selectAll('circle').data(pts.filter(d => d._t)).join('circle').attr('cx', d => d._cx).attr('cy', yMark).attr('r', 2).style('fill', 'var(--faint)');
  const pg = svg.append('g').selectAll('g').data(pts).join('g').attr('class', 'mark').attr('role', 'button').attr('data-id', d => d.id).attr('data-t', d => +parse(d.start))
    .attr('transform', d => `translate(${d._cx},${d._y})${GS < 1 ? ` scale(${GS})` : ''}`)
    .attr('aria-label', d => `${d.label}, ${fmt(parse(d.start))}.${d.soft_law ? ' Soft law.' : ''} ${d.short_note}${hasScene(d) ? ' Has 3D scene.' : ''}`);
  pg.each(function (d) { legalGlyph(d3.select(this), d); if (hasScene(d)) badge(d3.select(this), 9, -10);
    if (d._n && d._num) d3.select(this).append('text').attr('class', 'mnum').attr('x', d._num.dx).attr('y', d._num.dy).attr('text-anchor', d._num.anchor).attr('aria-hidden', 'true').text(d._n); });
  pg.append('circle').attr('class', 'hit').attr('r', 12 / GS);
  bindMark(pg, strip ? null : legalCard, strip ? tapLegal : activate);
  pg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  sg.on('mouseenter.guide focus.guide', (ev, d) => setGuide(parse(d.start))).on('mouseleave.guide blur.guide', () => setGuide(null));
  rove(svg.selectAll('.mark'));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${yAx})`).call(d3.axisBottom(x).ticks(d3.utcYear.every(zoom ? 1 : phone ? 20 : 10)).tickFormat(fmtY).tickSizeOuter(0));
  addGuide(svg, x, 0, yAx, zoom ? 'legalzoom' : 'legal');
  lg.raise(); // labels (with a background halo, see CSS) sit above the guide line so it never strikes through them
  if (strip) { el.scrollLeft = el.scrollWidth; el._x = x; el.onscroll = stripPos; stripPos(); } else { el.onscroll = null; document.getElementById('stripPos').hidden = true; }
}
// Phone strip position: says the strip is a scrollable 1957–2026 window and shows which years are in view.
function stripPos() {
  const el = document.getElementById('legalSvg'), box = document.getElementById('stripPos'), x = el._x; if (!x || !el.scrollWidth) return;
  const [r0, r1] = x.range(), sw = el.scrollWidth, a = el.scrollLeft, b = a + el.clientWidth, yr = px => Math.round(+fmtY(x.invert(Math.min(r1, Math.max(r0, px))))), y0 = a <= 2 ? 1957 : yr(a), y1 = b >= sw - 2 ? 2026 : yr(b);
  box.hidden = false; box.querySelector('.lab').textContent = `Scrollable strip · full 1957–2026 · showing ${y0}–${y1}${a > 2 ? ' · scroll left for earlier items' : ' · scroll right for later items'}`;
  const f = box.querySelector('i'); f.style.left = (100 * a / sw) + '%'; f.style.width = (100 * el.clientWidth / sw) + '%';
}
// Phone strip: tapping a mark labels it inline under the strip (card text plus a button for the 3D scene, if any).
function tapLegal(d, el) {
  const box = document.getElementById('legalTap'), when = d.end ? `${fmtY(parse(d.start))}–${fmtY(parse(d.end))}` : fmt(parse(d.start));
  box.innerHTML = `<b>${esc(d.label)}</b> · ${when}${d.soft_law ? ' · soft law' : ''}<br>${esc(d.short_note)}${hasScene(d) ? ' <button class="btn small" type="button">Open 3D scene</button>' : ''}`;
  box.dataset.on = '1'; box.hidden = false; box.querySelector('button')?.addEventListener('click', () => hooks.openScene(d.scene_3d, el));
  document.querySelectorAll('#legalSvg .mark.hl').forEach(m => m.classList.remove('hl')); el.classList.add('hl'); setGuide(parse(d.start));
}
let legalCompact = false;
export function legalScroll() {
  const band = document.getElementById('legalBand'), tr = document.getElementById('timeline').getBoundingClientRect();
  const stuck = !isPhoneNow() && band.getBoundingClientRect().top <= 0.5 && tr.top < -1 && tr.bottom > 200;
  if (stuck === legalCompact) return;
  if (band.contains(document.activeElement) && document.activeElement.closest('svg')) return; // never rebuild under a focused mark
  const h0 = band.offsetHeight; legalCompact = stuck;
  drawLegal(); band.classList.toggle('compact', stuck);
  if (stuck) document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px');
  band.style.marginBottom = stuck ? Math.max(0, h0 - band.offsetHeight) + 'px' : '0px';
}
// Measures the sticky (compact) band's height once per layout so section anchors clear it exactly (--band-h drives scroll-margin-top).
export function probeBand() {
  if (isPhoneNow()) return;
  const band = document.getElementById('legalBand'), was = legalCompact; if (was) return; // already stuck: legalScroll keeps --band-h current
  legalCompact = true; band.classList.add('compact'); drawLegal();
  document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px');
  legalCompact = false; band.classList.remove('compact'); drawLegal();
}
let scrollTick = false; // at most one legalScroll per frame
addEventListener('scroll', () => { if (scrollTick) return; scrollTick = true; requestAnimationFrame(() => { scrollTick = false; legalScroll(); }); }, { passive: true });
function drawLegalList() {
  const ul = document.getElementById('legalList');
  ul.innerHTML = LEGAL.slice().sort((a, b) => a.start < b.start ? -1 : 1).map(l => `<li><span class="ld">${l.end ? fmtY(parse(l.start)) + '–' + fmtY(parse(l.end)) : fmtMY(parse(l.start))}</span> <b>${esc(l.label)}</b>${l.soft_law ? ' <i>(soft law)</i>' : ''}<span class="ls">${esc(l.short_note)}</span></li>`).join('');
}
export function drawLegalKey() {
  drawLegalList();
  const L = legend('legendLegal', 20, 16), li = L.item;
  li('<circle r="5.5" style="fill:var(--accent)"/>', 'Treaty');
  li('<rect x="-5" y="-5" width="10" height="10" style="fill:var(--accent)"/>', 'Resolution or body finding');
  li('<path d="M0,-6.5L6.5,5L-6.5,5Z" style="fill:var(--accent)"/>', 'Unilateral pledge');
  li('<path d="M0,-6.5L6.5,0L0,6.5L-6.5,0Z" style="fill:var(--bg);stroke:var(--accent-2);stroke-width:1.8"/>', '* Soft law (expert manual, not binding)');
  li('<path d="M-5,-5L5,5M5,-5L-5,5" style="stroke:var(--warn);stroke-width:2.8"/>', 'Veto');
  li('<rect x="-9" y="-2" width="18" height="4" rx="2" style="fill:var(--accent);opacity:.55"/>', 'Negotiation span');
  L.done();
  document.getElementById('abbrLegal').textContent = ABBR_NOTE; document.getElementById('abbrLegal2').textContent = ABBR_NOTE;
  table('tableLegal', ['Label', 'Full name', 'Date', 'Kind', 'What it is'], LEGAL.map(l => [ABBR[l.id] || SPAN_LABEL[l.id] || l.label, l.label, l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : l.start, l.soft_law ? 'Soft law' : KIND_LABEL[l.kind] || l.kind, l.short_note]));
}

