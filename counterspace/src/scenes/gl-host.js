// ============================================================================
// scenes/gl-host.js: single shared WebGL host (three.js): scene building, labels, cameras, playback and the PNG still
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================

const ATMO_VS = `varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; vW = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * mv; }`;
const ATMO_FS = `uniform vec3 uColor; uniform vec3 uSun; uniform float uPow; uniform float uGain; uniform float uBack; varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vec3 v = normalize(-vP); float d = dot(normalize(vN), v);
  // Front: brightest at the limb. Back (halo shell): brightest just outside the limb, 0 at the shell edge.
  float rim = uBack > 0.5 ? pow(clamp(-d * 2.6, 0.0, 1.0), uPow) : pow(clamp(1.0 - d, 0.0, 1.0), uPow);
  float day = 0.25 + 0.75 * smoothstep(-0.35, 0.6, dot(normalize(vW), uSun));
  gl_FragColor = vec4(uColor, clamp(rim * uGain * day, 0.0, 1.0)); }`;

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
    // Keep at least a 1.5:1 horizontal field of view so narrow (phone) frames do not crop the action.
    this.camera.fov = 2 * Math.atan(Math.tan(20 * DEG) * Math.max(1, 1.5 / (w / h))) / DEG; this.camera.updateProjectionMatrix();
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.render();
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
    const atmo = (r, side, pow, gain, back) => new T.Mesh(new T.SphereGeometry(r, 64, 48), new T.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uColor: { value: new T.Color(0x5fa8ff) }, uSun: { value: new T.Vector3(...sunDir) }, uPow: { value: pow }, uGain: { value: gain }, uBack: { value: back } } }));
    root.add(atmo(1.004, T.FrontSide, 3.2, 0.9, 0));
    root.add(atmo(1.07, T.BackSide, 2.4, 0.75, 1));
    this.spriteTex = new T.CanvasTexture(spriteCanvas()); this.ringTex = new T.CanvasTexture(ringCanvas());
    const col = c => new T.Color(c);
    for (const it of sim.items) {
      if (it.kind === 'shell') {
        root.add(new T.Mesh(new T.SphereGeometry(it.r, 48, 32), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.06, depthWrite: false })));
        const ring = new T.Mesh(new T.TorusGeometry(it.r, 0.004, 6, 160), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.5 }));
        ring.rotation.x = Math.PI / 2; root.add(ring);
        if (it.label) this._label(it.label, () => this._limb(it.r, it.ang ?? 45), 'shell', null, it.dy ?? 0, it.dx ?? 0);
      } else if (it.kind === 'curve') {
        const g = new T.BufferGeometry(); const pts = it.dynamic ? [] : it.pts(0);
        const max = it.dynamic ? 200 : pts.length; const arr = new Float32Array(max * 3);
        pts.forEach((p, k) => arr.set(p, 3 * k));
        g.setAttribute('position', new T.BufferAttribute(arr, 3)); g.setDrawRange(0, pts.length);
        let line;
        if (it.dynamic) { // fading trail: per-vertex RGBA, brightest at the head
          g.setAttribute('color', new T.BufferAttribute(new Float32Array(max * 4), 4));
          line = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
          line.userData.rgb = col(it.color);
        } else line = new T.Line(g, new T.LineBasicMaterial({ color: col(it.color), transparent: true, opacity: it.opacity ?? 1 }));
        root.add(line); if (it.dynamic) this.dyn.push({ it, obj: line });
        if (it.thick) { // bright tube so the path reads at any zoom; dynamic ones are revealed with drawRange
          const src = it.dynamic ? it.all : pts, closed = !it.dynamic && src.length > 3 && Math.hypot(src[0][0] - src[src.length - 1][0], src[0][1] - src[src.length - 1][1], src[0][2] - src[src.length - 1][2]) < 1e-6;
          const vp = (closed ? src.slice(0, -1) : src).map(q => new T.Vector3(...q)), curve = new T.CatmullRomCurve3(vp, closed);
          const segs = it.dynamic ? src.length - 1 : Math.max(60, vp.length), geo = new T.TubeGeometry(curve, segs, it.thick, 5, closed);
          const tube = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: it.dynamic ? 0.9 : (it.opacity ?? 1), depthWrite: false, blending: it.dynamic ? T.AdditiveBlending : T.NormalBlending }));
          root.add(tube); if (it.dynamic) this.dyn.push({ it: { kind: 'tube', ref: it, segs }, obj: tube });
          line.visible = !it.dynamic ? false : line.visible; if (!it.dynamic) line.material.opacity = 0; }
        if (it.label) this._label(it.label, t => it.dynamic ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt, null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'point') {
        let m;
        if (it.shape === 'kv') { // glowing interceptor head
          m = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
          m.scale.setScalar(0.07);
        } else if (it.shape === 'sat' && !it.small) { // body + two solar wings + glow halo
          m = new T.Group();
          const body = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.04), new T.MeshBasicMaterial({ color: col(it.color) })); m.add(body); m.userData.body = body;
          const panelMat = new T.MeshBasicMaterial({ color: 0x2f5fa8 }), frameMat = new T.MeshBasicMaterial({ color: 0x9fb3d6 });
          [-1, 1].forEach(s => { const p = new T.Mesh(new T.BoxGeometry(0.055, 0.003, 0.026), panelMat); p.position.x = s * 0.045; m.add(p);
            const f = new T.Mesh(new T.BoxGeometry(0.012, 0.004, 0.004), frameMat); f.position.x = s * 0.018; m.add(f); });
          const halo = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
          halo.scale.setScalar(it.bright ? 0.13 : 0.09); if (it.bright) halo.material.opacity = 0.85; m.add(halo); m.userData.halo = halo;
        } else {
          let geo;
          if (it.shape === 'sat') geo = new T.OctahedronGeometry(0.018);
          else if (it.shape === 'tick') geo = new T.OctahedronGeometry(0.03);
          else if (it.shape === 'aircraft') geo = new T.ConeGeometry(0.022, 0.075, 8);
          else if (it.shape === 'ship') geo = new T.BoxGeometry(0.09, 0.025, 0.035);
          else geo = new T.CylinderGeometry(0.012, 0.012, 0.03, 10);
          m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color) }));
        }
        if (it.scale) m.scale.setScalar(it.scale);
        root.add(m);
        this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => it.pos(t), null, it, it.labelDy ?? ((it.shape === 'site' || it.shape === 'ship') ? 28 : 0), it.labelDx ?? 0, it.short);
      } else if (it.kind === 'cloud') {
        const g = new T.BufferGeometry(); const arr = new Float32Array(it.n * 3);
        g.setAttribute('position', new T.BufferAttribute(arr, 3));
        let mat;
        // Soft round sprites (were square pixels); additive for debris/belt so dense regions glow.
        if (it.colored) { g.setAttribute('color', new T.BufferAttribute(new Float32Array(it.n * 3), 3)); mat = new T.PointsMaterial({ size: it.size * 2.4, vertexColors: true, map: this.spriteTex, transparent: true, alphaTest: 0.05, depthWrite: false }); }
        else mat = new T.PointsMaterial({ size: it.size * 2.1, color: col(it.color), map: this.spriteTex, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending });
        const pts = new T.Points(g, mat); pts.frustumCulled = false; root.add(pts); this.dyn.push({ it, obj: pts });
        if (it.label) this._label(it.label, t => it.labelAt || (it.fill(t, arr) > 0 ? [arr[0], arr[1], arr[2]] : null), null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'beam') {
        // Beam = bright core + wide soft halo; unit-height cylinders scaled along the beam each frame.
        const w = it.width || it.width0 || 0.004, m = new T.Group();
        const mk = (r, op) => new T.Mesh(new T.CylinderGeometry(r, r, 1, 10, 1, true), new T.MeshBasicMaterial({ color: col(it.color || '#fff'), transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending }));
        const core = mk(w * (it.width ? 0.5 : 1), it.opacity ?? 0.8); m.add(core); m.userData.core = core;
        if (it.width) { const halo = mk(w * 2.2, 0.22); m.add(halo); m.userData.halo = halo; }
        root.add(m); this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => { const A = it.a(t), B = it.b(t); return A && B && it.on(t) ? scl(add(A, B), 0.5) : null; }, null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'dome') {
        const c = ll(it.at[0], it.at[1]);
        const m = new T.Mesh(new T.SphereGeometry(it.radius * DEG * 1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide }));
        m.position.set(...c); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...c)); root.add(m);
        this._label(it.label, () => scl(c, 1.12), null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'flash') {
        // Explosion: white-hot core sprite (fast fade) + expanding shock ring (slower).
        const m = new T.Group(); m.position.set(...it.pos);
        const core = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        const ring = new T.Sprite(new T.SpriteMaterial({ map: this.ringTex, color: col(it.ringColor || (it.big ? '#ffd9a0' : '#ffb38a')), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        m.add(core, ring); m.userData = { core, ring }; root.add(m); this.dyn.push({ it, obj: m });
        if (it.label) this._label(it.label, t => t > it.t0 ? it.pos : null, null, null, it.labelDy ?? 0, it.labelDx ?? 0);
      } else if (it.kind === 'status') { this.status = it; }
    }
    this.statusEl = document.createElement('div'); this.statusEl.className = 'hlabel'; this.statusEl.style.cssText += ';left:50%;bottom:10px;top:auto;transform:translateX(-50%);font-size:12px;color:#ffe08a;white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 16px);line-height:1.3';
    this.labelLayer.appendChild(this.statusEl);
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.leaders.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible'); this.leaders.setAttribute('aria-hidden', 'true');
    this.labelLayer.prepend(this.leaders);
    this.setCam(0, true); this.t = 0; this.update(0);
  }
  refreshEarth() { if (this.earthMat && earthImg && this.earthMat.map?.image !== earthImg) { this._applyEarth(this.earthMat); this.render(); } }
  // Point on a sphere of radius r at the visible silhouette, `deg` counter-clockwise from screen-right.
  _limb(r, deg) {
    const T = this.T, cam = this.camera, d = cam.position.clone().normalize();
    const cr = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), cu = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const right = cr.sub(d.clone().multiplyScalar(cr.dot(d))).normalize(), up = cu.sub(d.clone().multiplyScalar(cu.dot(d))).normalize();
    const L = cam.position.length(), rr = r * Math.sqrt(Math.max(0, 1 - (r / L) ** 2)); // tangent circle for a perspective camera
    const p = right.multiplyScalar(Math.cos(deg * DEG) * rr).add(up.multiplyScalar(Math.sin(deg * DEG) * rr)).add(d.multiplyScalar(r * r / L));
    return [p.x, p.y, p.z];
  }
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
  // Screen positions of visible labels for a given canvas size (shared by live render and PNG export).
  // u = font scale relative to the live 11 px label. Overlaps are resolved by placeLabels().
  _labelPositions(w, h, u = 1, noBanner = false) {
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
      raw.push({ x: lx, y: ly, px, py, w: lw, h: lh, fixed: L.cls === 'shell', text, color });
    }
    const banner = noBanner ? [] : [[8 * u, 8 * u, Math.min(w - 16 * u, 430 * u), 32 * u]], status = this.status ? (w < 520 * u ? [8 * u, h - 56 * u, w - 16 * u, 48 * u] : [(w - 470 * u) / 2, h - 40 * u, 470 * u, 30 * u]) : null;
    const pl = placeLabels(raw, w, h, status ? banner.concat([status]) : banner);
    return raw.map((r, i) => r && { ...pl[i], text: r.text, color: r.color, w: r.w, h: r.h });
  }
  _label(text, posFn, cls, item, dy = 0, dx = 0, short = null) {
    const d = document.createElement('div'); d.className = 'hlabel'; d.textContent = text; this.labelLayer.appendChild(d);
    this.labels.push({ d, posFn, item, text, dy, dx, short, cls });
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
    if (this.statusEl) this.statusEl.textContent = this.status ? this.status.text(t) : '';
    this.render();
  }
  render() {
    if (!this.scene) return;
    this.renderer.render(this.scene, this.camera);
    // HTML labels with Earth occlusion
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
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and
  // the illustrative banner, caption and source into the PNG, then restore the live size.
  stillPNG(title, cite, targetW = 3000) {
    const vw = this.el.clientWidth, vh = this.el.clientHeight, pr = this.renderer.getPixelRatio();
    const maxDim = Math.min(this.maxTex, 4096), W = Math.min(targetW, maxDim, Math.floor(maxDim * vw / vh)), H = Math.round(W * vh / vw);
    // A scene may define its own still framing (cfg.stillCam) so the print image shows the whole subject and its labels, whatever the live camera shows.
    const cam = this.camera, keep = { pos: cam.position.clone(), tgt: this.target.clone(), hide: this.hideShell }, sc = this.sim.cfg.stillCam;
    if (sc) { this.hideShell = !!sc.hideShell; this.target.set(...(sc.look ? ll(...sc.look) : [0, 0, 0])); cam.position.set(...ll(...sc.at)); cam.up.set(0, 1, 0); cam.lookAt(this.target); cam.updateMatrixWorld(); }
    this.renderer.setPixelRatio(1); this.renderer.setSize(W, H, false); this.renderer.render(this.scene, this.camera);
    // Layout: header band (banner) | render | footer band (title, source, imagery credit). Nothing is drawn over the globe.
    const s = W / 1000, hb = Math.round(40 * s), fb = Math.round(92 * s);
    const c = document.createElement('canvas'); c.width = W; c.height = H + hb + fb;
    const g = c.getContext('2d'); g.fillStyle = '#070b17'; g.fillRect(0, 0, W, c.height); g.drawImage(this.canvas, 0, hb);
    g.textAlign = 'center'; g.lineJoin = 'round';
    const lp = this._labelPositions(W, H, s, true);
    for (const q of lp) { if (!q || !q.leader) continue; g.strokeStyle = q.color || '#dfe6f7'; g.globalAlpha = 0.75; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(q.ax, q.ay + hb); g.lineTo(q.qx, q.qy + hb); g.stroke(); g.globalAlpha = 1; }
    for (const q of lp) { if (!q) continue;
      g.font = `600 ${Math.round(11 * s)}px system-ui,sans-serif`; const tw = g.measureText(q.text).width + 12 * s; g.fillStyle = 'rgba(5,8,18,0.8)'; g.beginPath(); g.roundRect(q.x - tw / 2, q.y + hb - 9 * s, tw, 18 * s, 4 * s); g.fill(); g.textBaseline = 'middle';
      g.fillStyle = q.color || '#dfe6f7'; g.fillText(q.text, q.x, q.y + hb); g.textBaseline = 'alphabetic'; }
    const status = this.status?.text(Math.min(this.t, 1));
    if (status) { g.font = `${Math.round(12 * s)}px system-ui,sans-serif`; const tw = g.measureText(status).width + 24 * s;
      g.fillStyle = 'rgba(5,8,18,0.78)'; g.fillRect(W / 2 - tw / 2, hb + H - 36 * s, tw, 26 * s); g.fillStyle = '#ffe08a'; g.textBaseline = 'middle'; g.fillText(status, W / 2, hb + H - 23 * s); g.textBaseline = 'alphabetic'; }
    g.textAlign = 'left';
    g.fillStyle = '#0b1120'; g.fillRect(0, 0, W, hb); g.fillRect(0, hb + H, W, fb);
    g.strokeStyle = 'rgba(255,224,138,0.28)'; g.lineWidth = Math.max(1, s); g.beginPath(); g.moveTo(0, hb - 0.5); g.lineTo(W, hb - 0.5); g.moveTo(0, hb + H + 0.5); g.lineTo(W, hb + H + 0.5); g.stroke();
    g.textBaseline = 'middle'; g.fillStyle = '#ffe08a'; g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
    g.fillText('Illustrative, not orbit-propagated · compressed radial scale', 16 * s, hb / 2);
    g.fillStyle = '#e9edf7'; g.font = `600 ${Math.round(22 * s)}px system-ui,sans-serif`; g.fillText(title, 16 * s, hb + H + 24 * s);
    // Source line (cite) and imagery credit each on their own line, at a readable size (shrunk only if a line would overflow).
    const credit = earthImg ? 'Earth imagery: NASA Blue Marble (public domain).' : 'Vector land map: Natural Earth (public domain).';
    const fit = (txt, px, y, col) => { let f = Math.round(px * s); g.font = `${f}px system-ui,sans-serif`; while (g.measureText(txt).width > W - 32 * s && f > 10 * s) { f -= 0.5 * s; g.font = `${f}px system-ui,sans-serif`; } g.fillStyle = col; g.fillText(txt, 16 * s, y); };
    fit(`Source: ${String(cite || '').trim().replace(/[.;,\s]+$/, '')}.`, 15, hb + H + 54 * s, '#c3cbe0');
    fit(credit, 15, hb + H + 77 * s, '#c3cbe0'); g.textBaseline = 'alphabetic';
    const url = c.toDataURL('image/png');
    if (sc) { cam.position.copy(keep.pos); this.target.copy(keep.tgt); this.hideShell = keep.hide; cam.lookAt(this.target); }
    this.renderer.setPixelRatio(pr); this.resize();
    return url;
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
function occluded(cam, p) {
  // Does the segment cam->p pass through the unit sphere before reaching p?
  const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]], L = len(d), u = scl(d, 1 / L);
  const b = dot(cam, u), c = dot(cam, cam) - 1, disc = b * b - c;
  if (disc < 0) return false; const t0 = -b - Math.sqrt(disc);
  return t0 > 0 && t0 < L - 1e-3;
}
