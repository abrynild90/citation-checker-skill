// ============================================================================
// scenes/gl-labels.js: GLHost mixin: HTML labels, leader lines, screen-space label placement and limb geometry
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
Object.assign(GLHost.prototype, {
  // Point on a sphere of radius r at the visible silhouette, `deg` counter-clockwise from screen-right.
  _limb(r, deg) {
    const T = this.T, cam = this.camera, d = cam.position.clone().normalize();
    const cr = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), cu = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const right = cr.sub(d.clone().multiplyScalar(cr.dot(d))).normalize(), up = cu.sub(d.clone().multiplyScalar(cu.dot(d))).normalize();
    const L = cam.position.length(), rr = r * Math.sqrt(Math.max(0, 1 - (r / L) ** 2)); // tangent circle for a perspective camera
    const p = right.multiplyScalar(Math.cos(deg * DEG) * rr).add(up.multiplyScalar(Math.sin(deg * DEG) * rr)).add(d.multiplyScalar(r * r / L));
    return [p.x, p.y, p.z];
  },
  // Screen positions of visible labels for a given canvas size (shared by live render and PNG export).
  // u = font scale relative to the live 11 px label. Overlaps are resolved by placeLabels().
  _labelPositions(w, h, u = 1, noBanner = false, statusBox = null) {
    const cam = this.camera.position, T = this.T, raw = [], k = h / (this.el.clientHeight || h);
    for (const L of this.labels) {
      if (L.cls === 'shell' && this.hideShell) { raw.push(null); continue; }
      let p = L.posFn(this.t); if (p && this.sim.cfg.spin && L.cls !== 'shell') { const v = new T.Vector3(...p).applyMatrix4(this.root.matrixWorld); p = [v.x, v.y, v.z]; }
      if (!p) { raw.push(null); continue; }
      const v = new T.Vector3(...p).project(this.camera);
      if (occluded([cam.x, cam.y, cam.z], p) || v.z > 1) { raw.push(null); continue; }
      const text = L.item?.labelFn ? L.item.labelFn(this.t) : (L.short && this.el.clientWidth < 520 ? L.short : L.text), color = L.item?.labelFn ? L.item.statusColor(this.t) : null;
      const px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h; let lx = px + L.dx * k, ly = py + (L.dy - 12) * k;
      const lw = labelW(text, u * (noBanner ? 1.1 : 1)), lh = 19 * u;
      if (L.item?.offGlobe) { const c0 = new T.Vector3(0, 0, 0).project(this.camera), lm = this._limb(1, 0), c1 = new T.Vector3(...lm).project(this.camera), gx = (c0.x + 1) / 2 * w, gy = (1 - c0.y) / 2 * h, gr = Math.hypot((c1.x + 1) / 2 * w - gx, (1 - c1.y) / 2 * h - gy); [lx, ly] = offDisc(px, py, lw, lh, gx, gy, gr * 1.05); }
      raw.push({ x: lx, y: ly, px, py, w: lw, h: lh, fixed: L.cls === 'shell', text, color, avoidDisc: !!L.item?.offGlobe });
    }
    // Reserved areas are the real DOM boxes in the live view (banner, status caption); stills pass their own caption box.
    const er = this.el.getBoundingClientRect(), rel = e => { const b = e.getBoundingClientRect(); return [b.left - er.left - 3, b.top - er.top - 3, b.width + 6, b.height + 6]; }, bn = noBanner ? null : this.el.querySelector('.illus');
    const banner = noBanner ? [] : [bn ? rel(bn) : [8, 8, Math.min(w - 16, 430), 32]], status = noBanner ? statusBox : (this.status && this.statusEl ? rel(this.statusEl) : null);
    let disc = null; if (raw.some(r => r && r.avoidDisc)) { const c0 = new T.Vector3(0, 0, 0).project(this.camera), c1 = new T.Vector3(...this._limb(1, 0)).project(this.camera), gx = (c0.x + 1) / 2 * w, gy = (1 - c0.y) / 2 * h; disc = { cx: gx, cy: gy, r: Math.hypot((c1.x + 1) / 2 * w - gx, (1 - c1.y) / 2 * h - gy) * 1.05 }; }
    const obst = [], vp = p => { const v = new T.Vector3(...p).project(this.camera); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h, occluded([cam.x, cam.y, cam.z], p) || v.z > 1]; };
    for (const it of this.obst || []) { let pts = it.kind === 'beam' ? (it.on(this.t) && it.a(this.t) && it.b(this.t) ? [it.a(this.t), it.b(this.t)] : []) : it.pts(this.t), cur = [];
      const st = Math.max(1, Math.ceil(pts.length / 40)); for (let k = 0; k < pts.length; k += st) { const q = vp(pts[k]); if (q[2]) { if (cur.length > 1) obst.push(cur); cur = []; } else cur.push(q); } if (cur.length > 1) obst.push(cur); }
    const pl = placeLabels(raw, w, h, status ? banner.concat([status]) : banner, disc, obst, noBanner ? null : (this._lm ||= {}));
    return raw.map((r, i) => r && pl[i] && { ...pl[i], text: r.text, color: r.color, w: r.w, h: r.h });
  },
  _label(text, posFn, cls, item, dy = 0, dx = 0, short = null) {
    const d = document.createElement('div'); d.className = 'hlabel'; d.textContent = text; this.labelLayer.appendChild(d);
    this.labels.push({ d, posFn, item, text, dy, dx, short, cls });
  },
  _renderLabels() {
    const pos = this._labelPositions(this.el.clientWidth, this.el.clientHeight);
    this.labels.forEach((L, i) => { const q = pos[i];
      if (!q || (L.cls === 'shell' && this.hideShell)) { L.d.style.display = 'none'; if (L.ln) L.ln.style.display = L.dot.style.display = 'none'; return; }
      L.d.style.display = ''; L.d.style.left = q.x + 'px'; L.d.style.top = q.y + 'px';
      if (L.d.textContent !== q.text) L.d.textContent = q.text;
      if (L.item?.labelFn) L.d.style.color = q.color;
      if (!L.ln && this.leaders) { L.ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); L.ln.setAttribute('stroke-width', '1'); this.leaders.appendChild(L.ln); L.dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); L.dot.setAttribute('r', '2'); this.leaders.appendChild(L.dot); }
      if (L.ln) { const c = q.color || '#dfe6f7'; L.ln.style.display = L.dot.style.display = q.leader ? '' : 'none';
        if (q.leader) { L.ln.setAttribute('x1', q.ax); L.ln.setAttribute('y1', q.ay); L.ln.setAttribute('x2', q.qx); L.ln.setAttribute('y2', q.qy); L.ln.setAttribute('stroke', c); L.ln.setAttribute('stroke-opacity', '0.75');
          L.dot.setAttribute('cx', q.ax); L.dot.setAttribute('cy', q.ay); L.dot.setAttribute('fill', c); } } });
  },
});
function occluded(cam, p) {
  // Does the segment cam->p pass through the unit sphere before reaching p?
  const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]], L = len(d), u = scl(d, 1 / L);
  const b = dot(cam, u), c = dot(cam, cam) - 1, disc = b * b - c;
  if (disc < 0) return false; const t0 = -b - Math.sqrt(disc);
  return t0 > 0 && t0 < L - 1e-3;
}
