// ============================================================================
// scenes/gl-host.js: GLHost core: renderer, scene loading, cameras, update loop, playback and disposal (mixins: gl-items, gl-labels, gl-still)
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
import { DEG, IS_PHONE, mulberry, norm, occluded, scl, sunFor } from './core.js';
import { earthImg, earthPromise, getLandCanvas, loadEarth, oceanMask, ringCanvas, spriteCanvas } from './earth.js';


// ---------------------------------------------------------------- WebGL host (single shared renderer)
export class GLHost {
  constructor(THREE) {
    this.T = THREE;
    this.renderer = new THREE.WebGLRenderer({ antialias: !IS_PHONE, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_PHONE ? 1.5 : 2));
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    this.target = new THREE.Vector3(0, 0, 0);
    this.t = 0; this.playing = true; this.raf = 0; this.onTick = null; this.lock = null; this._act = null;
    this._bindDrag();
    this.ro = new ResizeObserver(() => this.resize());
  }
  mount(el) {
    if (this.el) { this.ro.unobserve(this.el); this.labelLayer?.remove(); }
    this.el = el; el.prepend(this.canvas);
    this.labelLayer = document.createElement('div'); this.labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    el.appendChild(this.labelLayer);
    this.ro.observe(el); this.resize();
  }
  resize() {
    if (!this.el) return;
    const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    // Narrow (phone) frames keep about a 1.1:1 horizontal field of view (was 1.5:1): subjects render ~35% larger while the action still fits.
    this.camera.fov = 2 * Math.atan(Math.tan(20 * DEG) * Math.max(1, 1.1 / (w / h))) / DEG; this.camera.updateProjectionMatrix();
    this._viewShift = null; this._applyBands(); this._heroFit();
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.render();
  }
  // Hero: the camera distance follows the stage aspect so Earth and the shells fill the stage (wide stage: close and centred; phone: far enough for the GEO ring).
  _heroFit() {
    if (!this.sim?.cfg.spin || !this.camIdx && this.camIdx !== 0) return;
    const d = Math.max(4.9, 7.3 / Math.max(this.camera.aspect, 1.1)), p = this.camera.position.clone().sub(this.target); p.setLength(d); this.camera.position.copy(p.add(this.target)); this.camera.lookAt(this.target);
  }
  // Reserve room for the banner (top) and the status caption (bottom): the projection centre moves to the middle of the free band, so subjects never sit under the caption.
  _applyBands() {
    if (!this.el) return;
    const w = this.el.clientWidth, h = this.el.clientHeight, top = w < 520 ? 46 : 36, bot = (this.statusEl && this.status ? this.statusEl.offsetHeight : 0) + 14;
    const s = Math.round(Math.max(0, (bot - top) / 2) + (this.sim?.cfg.lift ?? 0));
    if (s === this._viewShift) return; this._viewShift = s;
    if (s) this.camera.setViewOffset(w, h, 0, s, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }
  load(sim) {
    this.unload();
    const T = this.T, S = new T.Scene(); this.scene = S; this.sim = sim; this.dyn = []; this.labels = []; this.obst = []; this._lm = {}; this.ptMats = []; this.tubeMats = []; this.ringPts = []; this.shellRings = []; this.beamTex = null; this._pt = null;
    // Sun fixed in world space, set ~50 deg east of the opening camera so the event region
    // is in daylight and the terminator shows on the limb. Orbiting reveals the night side.
    const sunDir = sunFor(sim.sunRef);
    this.sunDir = sunDir;
    S.add(new T.AmbientLight(0x9fb4ff, 0.32));
    const sun = new T.DirectionalLight(0xfff4e0, 2.1); sun.position.set(...scl(sunDir, 10)); S.add(sun);
    const root = new T.Group(); S.add(root); this.root = root;
    // Starfield (background only; not part of the per-scene particle budget).
    { const n = IS_PHONE ? 500 : 1200, rnd = mulberry(99), a = new Float32Array(n * 3), c = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { const u = rnd() * 2 - 1, th = rnd() * 2 * Math.PI, s = Math.sqrt(1 - u * u); a.set([40 * s * Math.cos(th), 40 * u, 40 * s * Math.sin(th)], 3 * k); const b = 0.35 + rnd() * 0.65; c.set([b * (0.85 + rnd() * 0.15), b * 0.92, b], 3 * k); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(a, 3)); g.setAttribute('color', new T.BufferAttribute(c, 3));
      S.add(new T.Points(g, new T.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, depthWrite: false }))); }
    // Earth: Blue Marble when available, vector land map otherwise (swapped in when it arrives).
    const earthMat = new T.MeshPhongMaterial({ shininess: 18, specular: 0x6b87a8 });
    this.earthMat = earthMat; this._applyEarth(earthMat);
    // Event scenes fetch the imagery at once if needed; the hero waits for the idle prefetch (app.js).
    if (!earthImg) { const p = earthPromise || (sim.cfg.spin ? null : loadEarth(this.maxTex)); p?.then(ok => { if (ok && this.scene === S) this.refreshEarth(); }); }
    root.add(new T.Mesh(new T.SphereGeometry(1, 96, 64), earthMat));
    // Atmosphere: thin inner rim + outer halo, brighter on the day side.
    this._atmo(root, 1.004, T.FrontSide, 3.2, 0.9, 0, sunDir); this._atmo(root, 1.07, T.BackSide, 2.4, 0.75, 1, sunDir);
    this.spriteTex = new T.CanvasTexture(spriteCanvas()); this.ringTex = new T.CanvasTexture(ringCanvas());
    const col = c => new T.Color(c);    for (const it of sim.items) this._buildItem(it, root, col);
    this.statusEl = document.createElement('div'); this.statusEl.className = 'hlabel'; this.statusEl.style.cssText += ';left:50%;bottom:10px;top:auto;transform:translateX(-50%);font-size:12px;color:#ffe08a;white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 16px);line-height:1.3';
    this.labelLayer.appendChild(this.statusEl);
    // Hero: an on-canvas hint that the stage is interactive (fades once the visitor drags it).
    this.chipEl = null;
    if (sim.cfg.spin) { const c = document.createElement('div'); c.className = 'hlabel'; c.textContent = '⟲ Drag to rotate · pick an event below'; c.style.cssText += ';left:50%;bottom:9px;top:auto;transform:translateX(-50%);font-size:12px;font-weight:500;color:#cfd8ee;background:rgba(5,8,18,.55);white-space:nowrap;transition:opacity .7s'; this.labelLayer.appendChild(c); this.chipEl = c; }
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.leaders.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible'); this.leaders.setAttribute('aria-hidden', 'true');
    this.labelLayer.prepend(this.leaders);
    this.lock = null; this._act = null; this.setCam(0, true); this.t = 0; this.update(0);
  }
  refreshEarth() { if (this.earthMat && earthImg && this.earthMat.map?.image !== earthImg) { this._applyEarth(this.earthMat); this.render(); } }
  get maxTex() { return this.renderer.capabilities.maxTextureSize || 4096; }
  _applyEarth(mat) {
    const T = this.T, old = [mat.map, mat.specularMap];
    let map;
    if (earthImg) { map = new T.Texture(earthImg); map.needsUpdate = true;
      const spec = new T.CanvasTexture(oceanMask); mat.specularMap = spec; mat.shininess = 1; mat.specular.set(0x000000); }
    else { map = new T.CanvasTexture(getLandCanvas()); mat.specularMap = null; mat.specular.set(0x223344); mat.shininess = 8; }
    map.colorSpace = T.SRGBColorSpace; map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    mat.map = map; mat.needsUpdate = true;
    old.forEach(t => t?.dispose());
  }
  _syncShell() { for (const r of this.shellRings || []) r.visible = !this.hideShell; }
  // Act scenes (cfg.acts): the camera cuts to each act's preset unless the viewer picked one (lock). A locked preset loops its own act.
  pickCam(i) {
    const c = this.sim.cams[i], acts = this.sim.cfg.acts; this.lock = null;
    if (acts && c.auto) { this._act = null; this.update(this.t); return; }
    if (acts && c.act != null) { this.lock = c.act; const a = acts[c.act]; if (this.t < a.t0 || this.t >= a.t1) { this.setCam(i); this.update(a.t0 + 0.001); return; } }
    this.setCam(i);
  }
  setCam(i, instant) { const c = this.sim.cams[i]; this.camIdx = i; this.hideShell = !!c.hideShell; this._syncShell(); this.target.set(...(c.look || [0, 0, 0])); this.camera.position.set(...c.pos); this.camera.up.set(...(c.up || [0, 1, 0])); this.camera.lookAt(this.target); this._heroFit(); this.render(); }
  update(t) {
    const T = this.T; this.t = t;
    const acts = this.sim.cfg.acts;
    if (acts && this.lock == null) { let ai = acts.findIndex((a, k) => t >= a.t0 && (t < a.t1 || k === acts.length - 1)); ai = Math.max(0, ai); if (this._act !== ai) { this._act = ai; this.setCam(acts[ai].cam, true); } }
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'curve') {
        const pts = it.pts(t), a = obj.geometry.attributes.position; const n = Math.min(pts.length, a.count);
        for (let k = 0; k < n; k++) a.array.set(pts[k], 3 * k);
        a.needsUpdate = true; obj.geometry.setDrawRange(0, n);
        const c = obj.geometry.attributes.color, rgb = obj.userData.rgb;
        if (c && rgb) { for (let k = 0; k < n; k++) { const f = n > 1 ? k / (n - 1) : 1; c.array.set([rgb.r, rgb.g, rgb.b, it.uniformA ?? (0.12 + 0.88 * f * f)], 4 * k); } c.needsUpdate = true; }
      } else if (it.kind === 'gtube') { obj.visible = it.ref.pts(t).length > 1;
      } else if (it.kind === 'tube') {
        const n = it.ref.pts(t).length; obj.geometry.setDrawRange(0, n < 2 ? 0 : Math.round(Math.min(1, (n - 1) / it.segs) * it.segs) * 30);
      } else if (it.kind === 'point') {
        const p = it.pos(t); obj.visible = !!p; if (p) obj.position.set(...p);
        const ud = obj.userData;
        if (it.orient && p) { const o = it.orient(t); obj.up.set(...o.up); obj.lookAt(p[0] + o.dir[0], p[1] + o.dir[1], p[2] + o.dir[2]); ud.oriented = true; }
        if (it.shape === 'aircraft' && p) { // wings level, nose along the ground track
          const up = new T.Vector3(...norm(p)), a2 = it.pos(Math.min(1, t + 0.004)), a1 = it.pos(Math.max(0, t - 0.004));
          const f = new T.Vector3(...a2).sub(new T.Vector3(...a1)); f.addScaledVector(up, -f.dot(up));
          if (f.lengthSq() > 1e-12) { f.normalize(); ud.f = f; } else if (!ud.f) { ud.f = new T.Vector3(0, 0, 1).addScaledVector(up, -up.z).normalize(); }
          const side = new T.Vector3().crossVectors(up, ud.f).normalize(); obj.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side, up, ud.f)); }
        if (ud.sat && p && !ud.oriented) { const q = it.pos(t + 0.002); if (q) obj.lookAt(new T.Vector3(...q)); } // keep solar wings across the orbit track
        if (ud.iss && p) { const q = it.pos(t + 0.002); if (q) obj.lookAt(new T.Vector3(...q)); }
        const tint = ud.body ? ud.body.material : ud.tintMat ? ud.tintMat : obj.material;
        if (it.statusColor && tint) { const c = it.statusColor(t); tint.color.set(c); if (ud.halo) ud.halo.material.color.set(c); }
        if (it.glow && tint) { const on = it.glow(t); tint.color.set(on ? '#ffffff' : it.color);
          if (ud.halo) { ud.halo.material.color.set(on ? '#ff8cf0' : it.color); ud.halo.scale.setScalar(on ? 0.1 + 0.015 * Math.sin(performance.now() / 60) : 0.06); ud.halo.material.opacity = on ? 0.8 : 0.32; } }
      } else if (it.kind === 'cloud') {
        const g = obj.geometry, a = g.attributes.position; it.fill(t, a.array, it.dynCol ? g.attributes.aCol.array : null); a.needsUpdate = true;
        if (it.dynCol) g.attributes.aCol.needsUpdate = true;
      } else if (it.kind === 'beam') {
        const A = it.a(t), B = it.b(t), on = A && B && it.on(t); obj.visible = !!on;
        if (on) { const v = new T.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]); const L = v.length(); v.normalize();
          const mid = new T.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), cd = mid.clone().sub(this.camera.position).normalize();
          const right = new T.Vector3().crossVectors(v, cd); if (right.lengthSq() < 1e-8) right.set(1, 0, 0); right.normalize(); const nz = new T.Vector3().crossVectors(right, v);
          obj.position.copy(mid); obj.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right, v, nz));
          obj.children.forEach(ch => { if (ch.isMesh) ch.scale.set(2 * ch.userData.hw, L, 1); });
          if (obj.userData.ends) { const e = it.ends * 0.3; obj.userData.ends[0].position.set(0, -L / 2 + e, 0); obj.userData.ends[1].position.set(0, L / 2 - e, 0); }
          const core = obj.userData.core.material, now = performance.now() / 1000;
          if (it.opFn) { const o = it.opFn(t); core.color.set(it.colorFn ? it.colorFn(t) : it.color); core.opacity = o; if (obj.userData.halo) obj.userData.halo.material.opacity = 0.22 * o; }
          else if (it.colorFn) { // GNSS links: steady green outside the zone, faint flickering red inside it
            const jam = it.dashFn(t); core.color.set(it.colorFn(t)); core.opacity = jam ? 0.12 + 0.18 * Math.abs(Math.sin(now * 13 + L * 9)) : 0.55; }
          else if (obj.userData.halo) { const pulse = 0.8 + 0.2 * Math.sin(now * 30); core.opacity = (it.opacity ?? 0.9) * pulse; obj.userData.halo.material.opacity = 0.24 * pulse; } }
      } else if (it.kind === 'flash') {
        const span = it.span ?? (it.big ? 0.3 : 0.14), dt = t - it.t0, on = dt > 0 && dt < span;
        obj.visible = on; obj.userData.on = on;
        if (on) { const f = dt / span, { core, ring } = obj.userData;
          core.scale.setScalar((it.size ?? (it.big ? 0.55 : 0.16)) * Math.sqrt(Math.min(1, f * 3)) + 0.01); core.userData.s0 = core.scale.x; core.material.opacity = 0.85 * Math.max(0, 1 - f * 1.6);
          ring.scale.setScalar((it.size ? it.size * 1.7 : it.big ? 0.9 : 0.3) * Math.pow(f, 0.6) + 0.01); ring.userData.s0 = ring.scale.x; ring.material.opacity = 0.9 * (1 - f); }
      }
    }
    if (this.sim.cfg.spin) this.root.rotation.y = t * Math.PI * 2;
    if (this.statusEl) { this.statusEl.textContent = this.status ? this.status.text(t) : ''; this._applyBands(); }
    this.render();
  }
  // Point sprite sizes follow the drawing-buffer height (live canvas or the print-resolution still).
  _ptUniforms() {
    const bh = this.renderer.domElement.height, k = bh / (this.el?.clientHeight || bh), sc = bh / (2 * Math.tan(this.camera.fov * DEG / 2));
    for (const m of this.tubeMats || []) { m.uniforms.uScale.value = sc; m.uniforms.uMaxPx.value = m.userData.maxPx * k; }
    for (const m of this.ptMats || []) { m.uniforms.uScale.value = sc; m.uniforms.uMin.value = m.userData.minPx * k; m.uniforms.uMax.value = m.userData.maxPx * k; }
  }
  // Models keep a sensible on-screen size: scaled down when the camera is close, up (a little) when it is far.
  _fitModels() {
    const bh = this.renderer.domElement.height, k = bh / (this.el?.clientHeight || bh), sc = bh / (2 * Math.tan(this.camera.fov * DEG / 2)), cp = this.camera.position, v = this._v3 ||= new this.T.Vector3();
    for (const { obj } of this.dyn) { const u = obj.userData; if (!u.span || !obj.visible) continue;
      obj.updateWorldMatrix(true, false); v.setFromMatrixPosition(obj.matrixWorld); const d = Math.max(0.15, v.distanceTo(cp)), px = u.span * u.base * sc / d, f = Math.min(Math.max(px, u.minPx * k), u.maxPx * k) / px;
      obj.scale.setScalar(u.base * f); }
    // Glows drawn without a depth test (so the surface never cuts them in half) are hidden while the Earth is between them and the camera.
    const c3 = [cp.x, cp.y, cp.z];
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'flash' && obj.userData.on) { obj.updateWorldMatrix(true, false); v.setFromMatrixPosition(obj.matrixWorld); obj.visible = !occluded(c3, [v.x, v.y, v.z]);
        const d = Math.max(0.15, v.distanceTo(cp)), { core, ring } = obj.userData; if (core.userData.s0) { core.scale.setScalar(Math.min(core.userData.s0, 110 * k * d / sc)); ring.scale.setScalar(Math.min(ring.userData.s0, 190 * k * d / sc)); } }
      else if (it.kind === 'beam' && obj.visible && obj.userData.ends) obj.userData.ends.forEach(s => { s.updateWorldMatrix(true, false); v.setFromMatrixPosition(s.matrixWorld); s.visible = !occluded(c3, [v.x, v.y, v.z]); s.scale.setScalar(Math.min(it.ends, 38 * k * Math.max(0.15, v.distanceTo(cp)) / sc)); });
    }
  }
  render() {
    if (!this.scene) return;
    this._fitModels(); this._ptUniforms();
    this.renderer.render(this.scene, this.camera);
    this._renderLabels();
  }
  play(onTick) {
    cancelAnimationFrame(this.raf); this.onTick = onTick; let last = performance.now();
    const loop = now => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (this.playing && !this.dragging) { let t = this.t + dt / this.sim.cfg.duration; if (t > 1.08) t = 0;
        if (this.lock != null) { const a = this.sim.cfg.acts[this.lock]; if (t >= a.t1 || t < a.t0 - 1e-6) t = a.t0; } this.update(Math.min(t, 1)); this.t = t; this.onTick?.(Math.min(t, 1)); }
    };
    this.raf = requestAnimationFrame(loop);
  }
  unload() {
    cancelAnimationFrame(this.raf);
    if (this.scene) {
      // Dispose every geometry, material and texture (map, specularMap, sprites) the scene created.
      this.scene.traverse(o => { o.geometry?.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); });
      this.spriteTex?.dispose(); this.ringTex?.dispose(); this.beamTex?.dispose(); this._pt?.dispose(); this.spriteTex = this.ringTex = this.beamTex = this._pt = null; this.ptMats = []; this.tubeMats = [];
      this.scene.clear(); this.scene = null; this.earthMat = null;
    }
    this.renderer.renderLists.dispose();
    if (this.labelLayer) this.labelLayer.innerHTML = '';
    this.labels = []; this.dyn = []; this.status = null; this.statusEl = null; this.chipEl = null;
  }
  memory() { return { ...this.renderer.info.memory, programs: this.renderer.info.programs?.length }; }
  _bindDrag() {
    const cv = this.canvas; let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', e => { this.dragging = true; sx = e.clientX; sy = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointerup', () => { this.dragging = false; });
    cv.addEventListener('pointercancel', () => { this.dragging = false; });
    cv.addEventListener('pointermove', e => {
      if (!this.dragging) return; if (this.chipEl) this.chipEl.style.opacity = '0'; const dx = (e.clientX - sx) * 0.006, dy = (e.clientY - sy) * 0.006; sx = e.clientX; sy = e.clientY;
      const p = this.camera.position, o = p.clone().sub(this.target), r = o.length(); let th = Math.atan2(o.x, o.z) - dx, ph = Math.acos(o.y / r) - dy;
      ph = Math.max(0.1, Math.min(Math.PI - 0.1, ph));
      p.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)).add(this.target); this.camera.up.set(0, 1, 0); this.camera.lookAt(this.target); this.render();
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = this.camera.position, o = p.clone().sub(this.target); const r = Math.max(this.target.length() > 0 ? 0.35 : 1.6, Math.min(12, o.length() * (1 + Math.sign(e.deltaY) * 0.08))); p.copy(o.setLength(r).add(this.target)); this.render(); }, { passive: false });
  }
}