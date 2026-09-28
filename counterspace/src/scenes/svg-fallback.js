// ============================================================================
// scenes/svg-fallback.js: static SVG renderer for reduced motion / no WebGL
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================

// ---------------------------------------------------------------- SVG fallback (static)
// A polished 2D diagram: orthographic globe with vector coastlines, shells, paths and markers,
// with the same screen-space label de-confliction (pills + leader lines) as the live scene.
let svgSeq = 0; // unique gradient/clip ids per SVG (several static SVGs can be in the document at once)
export function renderSVG(sim, el, t = sim.still) {
  const U = 'sf' + (++svgSeq);
  const W = el.clientWidth || 640, H = el.clientHeight || 420;
  const cam = sim.cams[0].pos, zoomed = !!(sim.items._arc && sim.cams[0].look), cl = toLL(sim.cfg.staticCenter ? ll(sim.cfg.staticCenter[0], sim.cfg.staticCenter[1]) : zoomed ? sim.items._arc.mid : cam);
  const rot = d3.geoRotation([-cl.lon, -cl.lat]);
  // Unit projection (globe radius 1, origin at the globe centre, y down); scaled and shifted below once the fit is known.
  const unit = p => { const q = toLL(p); const [lo, la] = rot([q.lon, q.lat]); const x = Math.cos(la * DEG) * Math.sin(lo * DEG), y = Math.sin(la * DEG); const front = Math.cos(la * DEG) * Math.cos(lo * DEG);
    return { x: x * q.r, y: -y * q.r, hidden: front < 0 && Math.hypot(x * q.r, y * q.r) < 1 }; };
  // Status text is wrapped first: its height is part of the fit.
  const st = sim.items.find(i => i.kind === 'status'), stTxt = st ? st.text(t, true) : '', maxCh = Math.floor((W - 40) / 6.6), stLines = [];
  if (st) { let cur = ''; for (const wd of stTxt.split(' ')) { if ((cur + ' ' + wd).trim().length > maxCh && cur) { stLines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); } if (cur) stLines.push(cur); }
  const stH = stLines.length * 16 + 10, stY = H - 34 - stH, stW = Math.min(W - 16, Math.max(...stLines.map(l => l.length), 1) * 6.6 + 24);
  // General fit rule (all scenes, all widths): the globe with its glow and every drawn subject (paths, points, debris, beams)
  // must sit inside the free area: below the banner, above the status/caption band, inside the side margins. The globe is never cropped.
  let x0 = -1.08, x1 = 1.08, y0 = -1.08, y1 = 1.08;
  const grow = p => { if (!p || p.hidden) return; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); };
  { for (const it of sim.items) {
      if (it.kind === 'curve') it.pts(t).forEach(q => grow(unit(q)));
      else if (it.kind === 'point' && !it.liveOnly) { const q = it.pos(t); if (q) grow(unit(q)); }
      else if (it.kind === 'beam') { const A = it.a(t), B = it.b(t); if (A && B && it.on(t)) { grow(unit(A)); grow(unit(B)); } }
      else if (it.kind === 'cloud') { const arr = new Float32Array(it.n * 3), col = it.colored ? new Float32Array(it.n * 3) : null; it.fill(t, arr, col);
        for (let k = 0; k < it.n; k += Math.max(1, Math.floor(it.n / 400))) if (arr[3 * k] || arr[3 * k + 1] || arr[3 * k + 2]) grow(unit([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]])); }
    } }
  // Real banner box (the page's "illustrative" note sits over the diagram) and the footer strip are reserved for labels and the fit.
  let bRes = [8, 8, Math.min(W - 16, 380), W < 520 ? 40 : 26]; { const bn = el.querySelector(':scope > .illus'), er = el.getBoundingClientRect(), br = bn?.getBoundingClientRect(); if (br && br.width && er.width) bRes = [br.left - er.left - 3, br.top - er.top - 3, br.width + 6, br.height + 6]; }
  const ftxt = `${sim.cfg.title} · compressed radial scale (Earth radius = 1; altitude^0.45)`, fw = Math.min(W - 12, ftxt.length * 5.6 + 16);
  const fx = 14, fTop = Math.max(W < 520 ? 56 : 42, bRes[1] + bRes[3] + 4), fBot = stY - 8;
  const R = Math.max(20, Math.min((W - 2 * fx) / (x1 - x0), (fBot - fTop) / (y1 - y0)));
  const CX = W / 2 - (x0 + x1) / 2 * R, CY = (fTop + fBot) / 2 - (y0 + y1) / 2 * R;
  const proj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([CX, CY]).scale(R).clipAngle(90);
  const project = p => { const u = unit(p); return { x: CX + u.x * R, y: CY + u.y * R, hidden: u.hidden }; };
  const path = d3.geoPath(proj);
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${sim.cfg.title}: static diagram`);
  const defs = svg.append('defs');
  const bg = defs.append('radialGradient').attr('id', `${U}-bg`).attr('cx', '50%').attr('cy', '50%').attr('r', '75%');
  bg.append('stop').attr('offset', 0).attr('stop-color', '#0f1a33'); bg.append('stop').attr('offset', 1).attr('stop-color', '#05070f');
  const gl = defs.append('radialGradient').attr('id', `${U}-glow`); gl.append('stop').attr('offset', 0.9).attr('stop-color', '#5fa8ff').attr('stop-opacity', 0.5); gl.append('stop').attr('offset', 1).attr('stop-color', '#5fa8ff').attr('stop-opacity', 0);
  const oc = defs.append('radialGradient').attr('id', `${U}-ocean`).attr('cx', '38%').attr('cy', '35%').attr('r', '80%');
  oc.append('stop').attr('offset', 0).attr('stop-color', '#1a4a7c'); oc.append('stop').attr('offset', 1).attr('stop-color', '#0a2040');
  // Lit globe: soft sphere shading + a blurred night side, from the same sun direction as the live scene.
  const sh = defs.append('radialGradient').attr('id', `${U}-shade`).attr('gradientUnits', 'userSpaceOnUse').attr('cx', CX - 0.28 * R).attr('cy', CY - 0.3 * R).attr('r', 1.55 * R);
  sh.append('stop').attr('offset', 0).attr('stop-color', '#fff').attr('stop-opacity', 0.16); sh.append('stop').attr('offset', 0.45).attr('stop-color', '#fff').attr('stop-opacity', 0); sh.append('stop').attr('offset', 0.45).attr('stop-color', '#000').attr('stop-opacity', 0);
  sh.append('stop').attr('offset', 1).attr('stop-color', '#000').attr('stop-opacity', 0.5);
  defs.append('filter').attr('id', `${U}-blur`).attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%').append('feGaussianBlur').attr('stdDeviation', Math.max(4, R * 0.05));
  defs.append('clipPath').attr('id', `${U}-clip`).append('path').datum({ type: 'Sphere' }).attr('d', path);
  svg.append('rect').attr('width', W).attr('height', H).attr('fill', `url(#${U}-bg)`);
  { const rs = mulberry(99); for (let k = 0; k < 90; k++) { const x = rs() * W, y = rs() * H, b = 0.25 + rs() * 0.5; svg.append('circle').attr('cx', x).attr('cy', y).attr('r', rs() < 0.15 ? 1.1 : 0.7).attr('fill', '#dfe8ff').attr('fill-opacity', b); } }
  const shells = sim.items.filter(i => i.kind === 'shell'), cands = [], obst = [];
  shells.forEach(it => svg.append('circle').attr('cx', CX).attr('cy', CY).attr('r', it.r * R).attr('fill', it.color).attr('fill-opacity', 0.05).attr('stroke', it.color).attr('stroke-opacity', 0.55).attr('stroke-dasharray', '3 4'));
  svg.append('circle').attr('cx', CX).attr('cy', CY).attr('r', R * 1.08).attr('fill', `url(#${U}-glow)`);
  svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', `url(#${U}-ocean)`).attr('stroke', '#7fb6ff').attr('stroke-opacity', 0.6);
  svg.append('path').datum(d3.geoGraticule10()).attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(140,190,255,0.16)');
  // Ring winding is data-dependent: any ring that d3 reads as "more than a hemisphere" is reversed so it fills land, not the complement.
  const landGeo = { type: 'MultiPolygon', coordinates: (LAND || []).map(r => { const c = []; for (let k = 0; k < r.length; k += 2) c.push([r[k], r[k + 1]]); if (c.length > 2 && d3.geoArea({ type: 'Polygon', coordinates: [c] }) > 2 * Math.PI) c.reverse(); return [c]; }) };
  svg.append('path').datum(landGeo).attr('d', path).attr('fill', '#3b7a5e').attr('stroke', '#5fae8a').attr('stroke-width', 0.5).attr('stroke-opacity', 0.7);
  { // Sun direction in the view basis; the terminator crosses the view axis at a = -sz (units of R), night is on the far side.
    const sd = toLL(sunFor(sim.sunRef)), [slo, sla] = rot([sd.lon, sd.lat]), sx = Math.cos(sla * DEG) * Math.sin(slo * DEG), sy = Math.sin(sla * DEG), sz = Math.cos(sla * DEG) * Math.cos(slo * DEG), pm = Math.hypot(sx, sy) || 1e-6;
    const ux = sx / pm, uy = -sy / pm, cx = CX, cyy = CY, at = a => [cx + ux * a * R, cyy + uy * a * R];
    const [x1, y1] = at(-sz - 0.55), [x2, y2] = at(-sz + 0.25);
    const ng = defs.append('linearGradient').attr('id', `${U}-night`).attr('gradientUnits', 'userSpaceOnUse').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
    ng.append('stop').attr('offset', 0).attr('stop-color', '#01030a').attr('stop-opacity', 0.78); ng.append('stop').attr('offset', 1).attr('stop-color', '#01030a').attr('stop-opacity', 0);
    const cg = svg.append('g').attr('clip-path', `url(#${U}-clip)`);
    cg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', `url(#${U}-shade)`);
    cg.append('rect').attr('x', 0).attr('y', 0).attr('width', W).attr('height', H).attr('fill', `url(#${U}-night)`).attr('opacity', pm < 0.06 && sz > 0 ? 0 : 1);
    svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'none').attr('stroke', '#8cc8ff').attr('stroke-opacity', 0.55).attr('stroke-width', 1.2); }
  const g = svg.append('g').attr('font-family', 'system-ui').attr('font-size', 11);
  // Labels are collected, de-conflicted, then drawn as pills with leader lines to their objects.
  shells.forEach((it, i) => { if (!it.label) return; const a = (it.ang ?? 35 + i * 14) * DEG, px = CX + it.r * R * Math.cos(a), py = CY - it.r * R * Math.sin(a); cands.push({ x: px, y: py, px, py, w: labelW(it.label), h: 19, fixed: true, text: it.label, color: it.color }); });
  const label = (p, text, color = '#dfe6f7', dx = 0, dy = 0, at = null) => { if (!p || p.hidden || !text) return; cands.push({ x: at ? at[0] * W : p.x + dx, y: at ? at[1] * H : p.y - 14 + dy, px: p.x, py: p.y, w: labelW(text), h: 19, text, color }); };
  for (const it of sim.items) {
    if (it.kind === 'dome') g.append('path').datum(d3.geoCircle().center([it.at[1], it.at[0]]).radius(it.radius)()).attr('d', path).attr('fill', it.color).attr('fill-opacity', 0.32).attr('stroke', it.color).attr('stroke-width', 1.6);
    if (it.kind === 'curve') {
      const pts = it.pts(t).map(project); let seg = [];
      const flush = () => { if (seg.length > 1) g.append('path').attr('d', d3.line()(seg)).attr('fill', 'none').attr('stroke', it.color).attr('stroke-linecap', 'round').attr('stroke-opacity', it.thick ? Math.max(0.85, it.opacity ?? 1) : (it.opacity ?? 1)).attr('stroke-width', it.thick ? Math.max(2.2, it.thick * R * 1.8) : (it.width || 1.2)); seg = []; };
      if (it.avoid) { let cur = []; pts.forEach(p => { if (p.hidden) { if (cur.length > 1) obst.push(cur); cur = []; } else cur.push([p.x, p.y]); }); if (cur.length > 1) obst.push(cur); }
      pts.forEach(p => { if (p.hidden) flush(); else seg.push([p.x, p.y]); }); flush();
      if (it.label && it.labelAt && pts.length > 2) label(project(it.labelAt), (it.short && W < 520) ? it.short : it.label, it.color, it.labelDx, it.labelDy, it.staticAt);
    }
    if (it.kind === 'cloud') {
      const arr = new Float32Array(it.n * 3), col = it.colored ? new Float32Array(it.n * 3) : null; it.fill(t, arr, col);
      const step = Math.max(1, Math.floor(it.n / 900));
      for (let k = 0; k < it.n; k += step) { if (!arr[3 * k] && !arr[3 * k + 1] && !arr[3 * k + 2]) continue; const p = project([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]); if (p.hidden) continue;
        g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', it.halo ? 2.6 : 1.4).attr('fill', col ? d3.rgb(col[3 * k] * 255, col[3 * k + 1] * 255, col[3 * k + 2] * 255) : it.color).attr('fill-opacity', 0.85); }
      if (it.label && (it.labelAt || arr[0] || arr[1] || arr[2])) label(project(it.labelAt || [arr[0], arr[1], arr[2]]), (it.short && W < 520) ? it.short : it.label, it.color || '#dfe6f7');
    }
    if (it.kind === 'beam') { const A = it.a(t), B = it.b(t); if (A && B && it.on(t)) { const a = project(A), b = project(B); if (it.avoid && !a.hidden && !b.hidden) obst.push([[a.x, a.y], [b.x, b.y]]); if (!a.hidden && !b.hidden) g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y).attr('stroke', it.colorFn ? it.colorFn(t) : it.color).attr('stroke-opacity', it.opFn ? it.opFn(t) : (it.opacity ?? 0.8)).attr('stroke-dasharray', it.dashFn?.(t) ? '3 3' : null).attr('stroke-width', it.width ? 5 : 1.2); if (it.label) label({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, it.label, it.color); } }
    if (it.kind === 'point') { const q = it.liveOnly ? null : it.pos(t); if (!q) continue; const p = project(q); if (p.hidden) continue;
      const c = it.statusColor ? it.statusColor(t) : it.color;
      if (it.shape === 'sat') { const q = it.small ? (it.scale ? Math.min(10, 2 + it.scale * 1.3) : 4) : 9 * Math.min(1.6, it.scale ? 1 + it.scale * 0.25 : 1); g.append('rect').attr('x', p.x - q / 2).attr('y', p.y - q / 2).attr('width', q).attr('height', q).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 0.8); }
      else if (it.shape === 'tick') g.append('path').attr('d', `M${p.x},${p.y - 5}L${p.x + 5},${p.y}L${p.x},${p.y + 5}L${p.x - 5},${p.y}Z`).attr('fill', c).attr('stroke', '#070b17');
      else if (it.shape === 'aircraft') g.append('path').attr('d', `M${p.x},${p.y - 7}L${p.x + 5},${p.y + 5}L${p.x - 5},${p.y + 5}Z`).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 0.8);
      else if (it.shape === 'kv') g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 4).attr('fill', c);
      else g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 4).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 1);
      if (it.label) { const n0 = cands.length; label(p, it.labelFn ? it.labelFn(t) : (it.short && W < 520 ? it.short : it.label), c, it.labelDx, it.labelDy, it.staticAt); if (it.offGlobe && cands.length > n0) cands.at(-1).off = true; } }
    if (it.kind === 'flash' && it.big && t >= it.t0 && !it.ringColor) { const p = project(it.pos); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 11).attr('fill', '#fff3c4').attr('fill-opacity', 0.35); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 5).attr('fill', '#fff3c4'); label(p, it.label, '#fff3c4', it.labelDx, it.labelDy); }
    if (it.kind === 'flash' && !it.big && t >= it.t0 && t < it.t0 + (it.span ?? 0.14)) { const p = project(it.pos); g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 7).attr('fill', '#fff1c1').attr('fill-opacity', 0.7); }
  }
  const reserved = [bRes, [(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6], [6, H - 27, fw + 2, 22]];
  cands.forEach(c => { if (c.off) [c.x, c.y] = offDisc(c.px, c.py, c.w, c.h, CX, CY, R * 1.08); });
  cands.forEach(c => { c.avoidDisc = !!c.off; });
  const pl = placeLabels(cands, W, H, reserved, { cx: CX, cy: CY, r: R * 1.08 }, obst);
  cands.forEach((c, i) => { const q = pl[i]; if (!q) return;
    if (q.leader) { g.append('line').attr('x1', q.ax).attr('y1', q.ay).attr('x2', q.qx).attr('y2', q.qy).attr('stroke', c.color).attr('stroke-opacity', 0.8); g.append('circle').attr('cx', q.ax).attr('cy', q.ay).attr('r', 2).attr('fill', c.color); }
    g.append('rect').attr('x', q.x - c.w / 2).attr('y', q.y - c.h / 2).attr('width', c.w).attr('height', c.h).attr('rx', 4).attr('fill', 'rgba(5,8,18,0.78)').attr('stroke', c.color).attr('stroke-opacity', 0.35);
    g.append('text').attr('x', q.x).attr('y', q.y + 4).attr('text-anchor', 'middle').attr('font-weight', 600).attr('fill', c.color).text(c.text); });
  if (st) {
    g.append('rect').attr('x', (W - stW) / 2).attr('y', stY).attr('width', stW).attr('height', stH).attr('rx', 5).attr('fill', 'rgba(5,8,18,0.85)');
    stLines.forEach((l, k) => g.append('text').attr('x', W / 2).attr('y', stY + 17 + k * 16).attr('text-anchor', 'middle').attr('fill', '#ffe08a').attr('font-size', 12).text(l)); }
  { const ft = ftxt;
    svg.append('rect').attr('x', 6).attr('y', H - 26).attr('width', fw).attr('height', 20).attr('rx', 4).attr('fill', 'rgba(5,8,18,0.82)');
    svg.append('text').attr('x', 14).attr('y', H - 12).attr('fill', '#a9b3cc').attr('font-size', Math.min(10.5, (W - 32) / (ft.length * 0.56))).attr('font-family', 'system-ui').text(ft); }
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  return svg.node();
}

