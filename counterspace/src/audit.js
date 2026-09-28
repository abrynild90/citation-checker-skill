// Programmatic audit: overlapping or clipped text in any chart SVG (bounding-box test).
function audit() {
  drawRest();
  const out = [];
  document.querySelectorAll('#legalSvg svg, #legalZoom svg, #svgA svg, #svgB svg, #svgC svg, #svgL svg').forEach(svg => {
    const sr = svg.getBoundingClientRect(), id = svg.parentElement.id;
    const ts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[display="none"]') && t.getClientRects().length && getComputedStyle(t).display !== 'none' && !t.closest('.lbls-hidden')).map(t => { const r = t.getBoundingClientRect(); return { s: t.textContent.trim().slice(0, 28), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom }; });
    const shapes = [...svg.querySelectorAll('.mark circle:not(.hit), .mark path, .mark rect:not(.hit), .mark polygon')].map(n => ({ n, r: n.getBoundingClientRect(), m: n.closest('.mark') })).filter(o => o.r.width > 0 && !o.n.closest('.badge3d'));
    [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && getComputedStyle(t).display !== 'none' && t.getClientRects().length).forEach(t => {
      const r = t.getBoundingClientRect(), own = t.closest('.mark');
      shapes.forEach(o => { if (o.m === own && own) return; const w = Math.min(r.right, o.r.right) - Math.max(r.left, o.r.left), h = Math.min(r.bottom, o.r.bottom) - Math.max(r.top, o.r.top); if (w > 2 && h > 3.5) out.push({ chart: id, kind: 'text-on-mark', a: t.textContent.trim().slice(0, 28), b: o.m?.dataset?.id, w: Math.round(w), h: Math.round(h) }); });
    });
    ts.forEach(a => { if (a.x0 < sr.left - 0.5 || a.x1 > sr.right + 0.5 || a.y0 < sr.top - 0.5 || a.y1 > sr.bottom + 0.5) out.push({ chart: id, kind: 'clip', a: a.s }); });
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
      const a = ts[i], b = ts[j], w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (w > 1.5 && h > 3) out.push({ chart: id, kind: 'overlap', a: a.s, b: b.s, w: Math.round(w), h: Math.round(h) });
    }
  });
  return out.concat(auditHtml());
}
// Overlap tests for HTML boxes: scene labels (.hlabel, only those on screen) and legend items. Same record shape as the SVG checks.
function auditHtml() {
  const out = [], vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const groups = [['scene-labels', [...document.querySelectorAll('.hlabel')].filter(e => vis(e) && e.textContent.trim() && e.closest('.stage, .view') && e.closest('.overlay:not(.open)') === null)],
    ...[...document.querySelectorAll('ul.legend')].map(u => ['legend:' + u.id, [...u.children].filter(li => vis(li) && !li.classList.contains('lsep'))])];
  groups.forEach(([chart, els]) => {
    const rs = els.map(e => ({ s: e.textContent.trim().slice(0, 28), r: e.getBoundingClientRect() }));
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i].r, b = rs[j].r, w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 1.5 && h > 3) out.push({ chart, kind: 'overlap', a: rs[i].s, b: rs[j].s, w: Math.round(w), h: Math.round(h) });
    }
    if (chart === 'scene-labels') els.forEach((e, i) => { const box = e.closest('.stage, .view').getBoundingClientRect(), r = rs[i].r;
      if (r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.top < box.top - 0.5 || r.bottom > box.bottom + 0.5) out.push({ chart, kind: 'clip', a: rs[i].s }); });
  });
  return out;
}
