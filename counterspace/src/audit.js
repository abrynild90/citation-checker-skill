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
  return out;
}

