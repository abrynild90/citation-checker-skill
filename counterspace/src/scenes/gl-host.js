// ============================================================================
// scenes/gl-host.js: GLHost core: renderer, scene loading, cameras, update loop, playback and disposal (mixins: gl-items, gl-labels, gl-still)
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================

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
    this.t = 0; this.playing = true; this.raf = 0; this.onTick = null;
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
    this._viewShift = null; this._applyBands();
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.render();
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
    const T = this.T, S = new T.Scene(); this.scene = S; this.sim = sim; this.dyn = []; this.labels = [];
    // Sun fixed in world space, set ~50 deg east of the opening camera so the event region
    // is in daylight and the terminator shows on the limb. Orbiting reveals the night side.
    const sunDir = sunFor(sim.sunRef);
    this.sunDir = sunDir;
    S.add(new T.AmbientLight(0x9fb4ff, 0.22));
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
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.leaders.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible'); this.leaders.setAttribute('aria-hidden', 'true');
    this.labelLayer.prepend(this.leaders);
    this.setCam(0, true); this.t = 0; this.update(0);
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
  setCam(i, instant) { const c = this.sim.cams[i]; this.camIdx = i; this.hideShell = !!c.hideShell; this.target.set(...(c.look || [0, 0, 0])); this.camera.position.set(...c.pos); this.camera.up.set(0, 1, 0); this.camera.lookAt(this.target); this.render(); }
  update(t) {
    const T = this.T; this.t = t;
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'curve') {
        const pts = it.pts(t), a = obj.geometry.attributes.position; const n = Math.min(pts.length, a.count);
        for (let k = 0; k < n; k++) a.array.set(pts[k], 3 * k);
        a.needsUpdate = true; obj.geometry.setDrawRange(0, n);
        const c = obj.geometry.attributes.color, rgb = obj.userData.rgb;
        if (c && rgb) { for (let k = 0; k < n; k++) { const f = n > 1 ? k / (n - 1) : 1; c.array.set([rgb.r, rgb.g, rgb.b, 0.12 + 0.88 * f * f], 4 * k); } c.needsUpdate = true; }
      } else if (it.kind === 'tube') {
        const n = it.ref.pts(t).length; obj.geometry.setDrawRange(0, n < 2 ? 0 : Math.round(Math.min(1, (n - 1) / it.segs) * it.segs) * 30);
      } else if (it.kind === 'point') {
        const p = it.pos(t); obj.visible = !!p; if (p) obj.position.set(...p);
        if (it.shape === 'aircraft' && p) { obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(p))); }
        if (obj.userData.body && p) { // keep solar wings roughly along the orbit track
          const q = it.pos(t + 0.002); if (q) { obj.lookAt(new T.Vector3(...q)); } }
        const tint = obj.userData.body ? obj.userData.body.material : obj.material;
        if (it.statusColor && tint) tint.color.set(it.statusColor(t));
        if (it.glow) { const on = it.glow(t); tint.color.set(on ? '#ffffff' : it.color);
          if (obj.userData.halo) { obj.userData.halo.material.color.set(on ? '#ff8cf0' : it.color); obj.userData.halo.scale.setScalar(on ? 0.12 + 0.02 * Math.sin(performance.now() / 60) : 0.09); obj.userData.halo.material.opacity = on ? 0.95 : 0.55; } }
      } else if (it.kind === 'cloud') {
        const a = obj.geometry.attributes.position; it.fill(t, a.array, obj.geometry.attributes.color?.array); a.needsUpdate = true;
        if (obj.geometry.attributes.color) obj.geometry.attributes.color.needsUpdate = true;
      } else if (it.kind === 'beam') {
        const A = it.a(t), B = it.b(t), on = A && B && it.on(t); obj.visible = !!on;
        if (on) { const v = new T.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]); const L = v.length();
          obj.scale.set(1, L, 1); obj.position.set((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2);
          obj.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
          const core = obj.userData.core.material, now = performance.now() / 1000;
          if (it.opFn) { const o = it.opFn(t); core.color.set(it.colorFn ? it.colorFn(t) : it.color); core.opacity = o; if (obj.userData.halo) obj.userData.halo.material.opacity = 0.22 * o; }
          else if (it.colorFn) { // GNSS links: steady green outside the zone, faint flickering red inside it
            const jam = it.dashFn(t); core.color.set(it.colorFn(t)); core.opacity = jam ? 0.12 + 0.18 * Math.abs(Math.sin(now * 13 + L * 9)) : 0.55; }
          else if (obj.userData.halo) { const pulse = 0.75 + 0.25 * Math.sin(now * 30); core.opacity = (it.opacity ?? 0.9) * pulse; obj.userData.halo.material.opacity = 0.22 * pulse; } }
      } else if (it.kind === 'flash') {
        const span = it.span ?? (it.big ? 0.3 : 0.14), dt = t - it.t0, on = dt > 0 && dt < span;
        obj.visible = on;
        if (on) { const f = dt / span, { core, ring } = obj.userData;
          core.scale.setScalar((it.size ?? (it.big ? 0.55 : 0.16)) * Math.sqrt(Math.min(1, f * 3)) + 0.01); core.material.opacity = Math.max(0, 1 - f * 1.6);
          ring.scale.setScalar((it.size ? it.size * 1.7 : it.big ? 0.9 : 0.3) * Math.pow(f, 0.6) + 0.01); ring.material.opacity = 0.9 * (1 - f); }
      }
    }
    if (this.sim.cfg.spin) this.root.rotation.y = t * Math.PI * 2;
    if (this.statusEl) { this.statusEl.textContent = this.status ? this.status.text(t) : ''; this._applyBands(); }
    this.render();
  }
  render() {
    if (!this.scene) return;
    this.renderer.render(this.scene, this.camera);
    this._renderLabels();
  }
  play(onTick) {
    cancelAnimationFrame(this.raf); this.onTick = onTick; let last = performance.now();
    const loop = now => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (this.playing && !this.dragging) { let t = this.t + dt / this.sim.cfg.duration; if (t > 1.08) t = 0; this.update(Math.min(t, 1)); this.t = t; this.onTick?.(Math.min(t, 1)); }
    };
    this.raf = requestAnimationFrame(loop);
  }
  unload() {
    cancelAnimationFrame(this.raf);
    if (this.scene) {
      // Dispose every geometry, material and texture (map, specularMap, sprites) the scene created.
      this.scene.traverse(o => { o.geometry?.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); });
      this.spriteTex?.dispose(); this.ringTex?.dispose(); this.spriteTex = this.ringTex = null;
      this.scene.clear(); this.scene = null; this.earthMat = null;
    }
    this.renderer.renderLists.dispose();
    if (this.labelLayer) this.labelLayer.innerHTML = '';
    this.labels = []; this.dyn = []; this.status = null; this.statusEl = null;
  }
  memory() { return { ...this.renderer.info.memory, programs: this.renderer.info.programs?.length }; }
  _bindDrag() {
    const cv = this.canvas; let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', e => { this.dragging = true; sx = e.clientX; sy = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointerup', () => { this.dragging = false; });
    cv.addEventListener('pointercancel', () => { this.dragging = false; });
    cv.addEventListener('pointermove', e => {
      if (!this.dragging) return; const dx = (e.clientX - sx) * 0.006, dy = (e.clientY - sy) * 0.006; sx = e.clientX; sy = e.clientY;
      const p = this.camera.position, o = p.clone().sub(this.target), r = o.length(); let th = Math.atan2(o.x, o.z) - dx, ph = Math.acos(o.y / r) - dy;
      ph = Math.max(0.1, Math.min(Math.PI - 0.1, ph));
      p.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)).add(this.target); this.camera.lookAt(this.target); this.render();
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = this.camera.position, o = p.clone().sub(this.target); const r = Math.max(this.target.length() > 0 ? 0.35 : 1.6, Math.min(12, o.length() * (1 + Math.sign(e.deltaY) * 0.08))); p.copy(o.setLength(r).add(this.target)); this.render(); }, { passive: false });
  }
}