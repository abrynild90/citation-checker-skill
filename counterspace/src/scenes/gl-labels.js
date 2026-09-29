// ============================================================================
// scenes/gl-labels.js: GLHost mixin: HTML labels, leader lines, screen-space label placement and limb geometry
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
import { GLHost } from './gl-host.js';
import { DEG, dot, len, scl } from './core.js';
import { labelW, offDisc, placeLabels } from './labels.js';

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
  // Shell label anchor: the limb point at `deg`, moved around the shell to the nearest angle that is comfortably inside the stage (never off-screen).
  _limbVis(r, deg) {
    const T = this.T, ks = [0]; for (let k = 15; k <= 180; k += 15) ks.push(k, -k);
    for (const k of ks) { const p = this._limb(r, deg + k), v = new T.Vector3(...p).project(this.camera); if (Math.abs(v.x) < 0.8 && v.y > -0.72 && v.y < 0.72) return p; }
    return null;
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
      if (occluded([cam.x, cam.y, cam.z], p) || v.z > 1 || Math.abs(v.x) > 0.985 || Math.abs(v.y) > 0.985) { raw.push(null); continue; } // hidden: behind Earth, or its referent is off the stage
      const text = L.item?.labelFn ? L.item.labelFn(this.t) : (L.short && this.el.clientWidth < 520 ? L.short : L.text), color = L.item?.labelFn ? L.item.statusColor(this.t) : null;
      const px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h; let lx = px + L.dx * k, ly = py + (L.dy - 12) * k;
      const hu = this.sim.cfg.spin ? 1.22 : 1, lw = labelW(text, u * hu * (noBanner ? 1.1 : 1)), lh = 19 * u * hu;
      if (L.item?.offGlobe) { const c0 = new T.Vector3(0, 0, 0).project(this.camera), lm = this._limb(1, 0), c1 = new T.Vector3(...lm).project(this.camera), gx = (c0.x + 1) / 2 * w, gy = (1 - c0.y) / 2 * h, gr = Math.hypot((c1.x + 1) / 2 * w - gx, (1 - c1.y) / 2 * h - gy); [lx, ly] = offDisc(px, py, lw, lh, gx, gy, gr * 1.05); }
      raw.push({ x: lx, y: ly, px, py, w: lw, h: lh, fixed: L.cls === 'shell', opt: !!L.opt, text, color, avoidDisc: !!L.item?.offGlobe });
    }
    // Reserved areas are the real DOM boxes in the live view (banner, status caption); stills pass their own caption box.
    const er = this.el.getBoundingClientRect(), rel = e => { const b = e.getBoundingClientRect(); return [b.left - er.left - 3, b.top - er.top - 3, b.width + 6, b.height + 6]; }, bn = noBanner ? null : this.el.querySelector('.illus');
    const banner = noBanner || (this.sim.cfg.spin && !bn) ? [] : [bn ? rel(bn) : [8, 8, Math.min(w - 16, 430), 32]], status = noBanner ? statusBox : (this.status && this.statusEl ? rel(this.statusEl) : null);
    let disc = null; if (raw.some(r => r && r.avoidDisc)) { const c0 = new T.Vector3(0, 0, 0).project(this.camera), c1 = new T.Vector3(...this._limb(1, 0)).project(this.camera), gx = (c0.x + 1) / 2 * w, gy = (1 - c0.y) / 2 * h; disc = { cx: gx, cy: gy, r: Math.hypot((c1.x + 1) / 2 * w - gx, (1 - c1.y) / 2 * h - gy) * 1.05 }; }
    const obst = [], vp = p => { const v = new T.Vector3(...p).project(this.camera); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h, occluded([cam.x, cam.y, cam.z], p) || v.z > 1]; };
    for (const it of this.obst || []) { let pts = it.kind === 'beam' ? (it.on(this.t) && it.a(this.t) && it.b(this.t) ? [it.a(this.t), it.b(this.t)] : []) : it.pts(this.t), cur = [];
      const st = Math.max(1, Math.ceil(pts.length / 40)), flush = () => { if (cur.length > 1) { cur.soft = !!it.soft; obst.push(cur); } cur = []; }; for (let k = 0; k < pts.length; k += st) { const q = vp(pts[k]); if (q[2]) flush(); else cur.push(q); } flush(); }
    const objs = this._sceneObjects(w, h); objs.scale = u; this._lastObjs = objs; this._lastObst = obst;
    const chip = !noBanner && this.chipEl && this.chipEl.style.opacity !== '0' ? [rel(this.chipEl)] : [];
    const pl = placeLabels(raw, w, h, (status ? banner.concat([status]) : banner).concat(chip), disc, obst, noBanner ? null : (this._lm ||= {}), objs);
    return raw.map((r, i) => r && pl[i] && { ...pl[i], text: r.text, color: r.color, w: r.w, h: r.h });
  },
  // Everything drawn that a label must stay off, in screen px for a w x h canvas: sprites (marks, with their drawn radius), dense particle
  // clumps (a count grid) and ring lines (shell rings and thick orbit rings). Shared by live labels, the PNG still and the QA checker.
  _sceneObjects(w, h) {
    const T = this.T, cam = this.camera, cp = cam.position, k = h / (this.el.clientHeight || h), sc = h / (2 * Math.tan(cam.fov * DEG / 2)), V = new T.Vector3(), M = this.root.matrixWorld;
    const me = cam.matrixWorldInverse.elements, pm = cam.projectionMatrix.elements;
    const scr = p => { const x = p[0], y = p[1], z = p[2], vx = me[0] * x + me[4] * y + me[8] * z + me[12], vy = me[1] * x + me[5] * y + me[9] * z + me[13], vz = me[2] * x + me[6] * y + me[10] * z + me[14], d = -vz;
      if (d <= 0.05) return [0, 0, d, true]; return [((pm[0] * vx + pm[8] * vz) / d + 1) / 2 * w, (1 - (pm[5] * vy + pm[9] * vz) / d) / 2 * h, d, false]; };
    const marks = [], rings = [], W3 = new T.Vector3();
    for (const { it, obj } of this.dyn) {
      if (!obj.visible) continue;
      if (it.kind === 'point') { obj.getWorldPosition(W3); const p = [W3.x, W3.y, W3.z]; if (occluded([cp.x, cp.y, cp.z], p)) continue; const q = scr(p); if (q[3]) continue;
        const u = obj.userData, wr = u.span ? u.span * obj.scale.x * (it.shape === 'ship' ? 0.42 : 0.5) : (u.wr ?? 0.012); marks.push({ x: q[0], y: q[1], r: Math.max(wr * sc / q[2], 3 * k), it }); }
      else if (it.kind === 'flash') { obj.getWorldPosition(W3); const p = [W3.x, W3.y, W3.z]; const q = scr(p); if (!q[3]) marks.push({ x: q[0], y: q[1], r: Math.max(obj.userData.core.scale.x * 0.35 * sc / q[2], 4 * k), it }); }
    }
    const grid = { cell: 8 * k, nx: Math.ceil(w / (8 * k)), ny: Math.ceil(h / (8 * k)) }; grid.c = new Uint16Array(grid.nx * grid.ny); grid.d = new Uint16Array(grid.nx * grid.ny);
    for (const { it, obj } of this.dyn) { if (it.kind !== 'cloud' || !obj.visible || it.bg) continue; const a = obj.geometry.attributes.position.array;
      for (let i = 0; i < it.n; i++) { const p = [a[3 * i], a[3 * i + 1], a[3 * i + 2]]; if (!p[0] && !p[1] && !p[2]) continue; if (this.sim.cfg.spin) { W3.set(...p).applyMatrix4(M); p[0] = W3.x; p[1] = W3.y; p[2] = W3.z; }
        const q = scr(p); if (q[3] || occluded([cp.x, cp.y, cp.z], p)) continue; const gx = Math.floor(q[0] / grid.cell), gy = Math.floor(q[1] / grid.cell); if (gx >= 0 && gy >= 0 && gx < grid.nx && gy < grid.ny) { grid.c[gy * grid.nx + gx]++; if (it.dynCol && !it.colored) grid.d[gy * grid.nx + gx]++; } } }
    const parts = { grid, count: (x0, y0, x1, y1, deb) => { const g = grid, arr = deb ? g.d : g.c, a = Math.max(0, Math.floor(x0 / g.cell)), b = Math.min(g.nx - 1, Math.floor(x1 / g.cell)), c = Math.max(0, Math.floor(y0 / g.cell)), d = Math.min(g.ny - 1, Math.floor(y1 / g.cell)); let n = 0; for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) n += arr[j * g.nx + i]; return n; } };
    for (const pts of this.ringPts || []) { if (pts.shell && this.hideShell) continue; const st = Math.max(1, Math.floor(pts.length / 160)); let cur = [];
      for (let i = 0; i < pts.length; i += st) { const p = W3.set(...pts[i]).applyMatrix4(M).toArray(), q = scr(p); if (q[3] || occluded([cp.x, cp.y, cp.z], p)) { if (cur.length > 1) rings.push(cur); cur = []; } else cur.push([q[0], q[1]]); }
      if (cur.length > 1) rings.push(cur); }
    return { marks, parts, rings, scale: 1 };
  },
  _label(text, posFn, cls, item, dy = 0, dx = 0, short = null, opt = false) {
    const d = document.createElement('div'); d.className = 'hlabel'; d.textContent = text; if (this.sim?.cfg.spin) d.style.fontSize = '13.5px'; this.labelLayer.appendChild(d);
    this.labels.push({ d, posFn, item, text, dy, dx, short, cls, opt });
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
export function occluded(cam, p) {
  // Does the segment cam->p pass through the unit sphere before reaching p?
  const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]], L = len(d), u = scl(d, 1 / L);
  const b = dot(cam, u), c = dot(cam, cam) - 1, disc = b * b - c;
  if (disc < 0) return false; const t0 = -b - Math.sqrt(disc);
  return t0 > 0 && t0 < L - 1e-3;
}
