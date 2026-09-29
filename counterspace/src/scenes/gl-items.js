// ============================================================================
// scenes/gl-items.js: GLHost mixin: atmosphere shaders and the per-kind item builders (shell, curve, point, cloud, beam, dome, flash)
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

const PT_VS = `attribute vec4 aCol; uniform float uScale; uniform float uSize; uniform float uMin; uniform float uMax; varying vec4 vC;
void main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uSize * uScale / max(-mv.z, 0.1), uMin, uMax); }`;
// Soft gaussian falloff, normal alpha blending: dense clumps saturate to the particle colour, never to white.
const PT_FS = `uniform float uGain; varying vec4 vC;
void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float f = exp(-r * r * 3.4) * (1.0 - smoothstep(0.8, 1.0, r)); gl_FragColor = vec4(vC.rgb, vC.a * f * uGain); }`;
const SHELL_FS = `uniform vec3 uColor; uniform float uGain; varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vec3 v = normalize(-vP); float d = clamp(dot(normalize(vN), v), 0.0, 1.0); float rim = pow(1.0 - d, 2.2); gl_FragColor = vec4(uColor, clamp(0.015 + rim * uGain, 0.0, 1.0)); }`;
const lerp3 = (a, b, s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];

Object.assign(GLHost.prototype, {
  _atmo(root, r, side, pow, gain, back, sunDir, color = 0x5fa8ff) {
    const T = this.T;
    root.add(new T.Mesh(new T.SphereGeometry(r, 64, 48), new T.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uColor: { value: new T.Color(color) }, uSun: { value: new T.Vector3(...sunDir) }, uPow: { value: pow }, uGain: { value: gain }, uBack: { value: back } } })));
  },
  // Point material: size in world units, attenuated with distance, clamped to [min, max] CSS px (scaled to the drawing buffer in render()).
  _ptMat(size, minPx, maxPx, gain = 1) {
    const T = this.T, m = new T.ShaderMaterial({ vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false,
      uniforms: { uScale: { value: 800 }, uSize: { value: size }, uMin: { value: minPx }, uMax: { value: maxPx }, uGain: { value: gain } } });
    m.userData = { minPx, maxPx }; (this.ptMats ||= []).push(m); return m;
  },
  _mat(c, o = {}) { return new this.T.MeshLambertMaterial({ color: c, ...o }); },
  _panelTexture() { if (!this._pt) { this._pt = new this.T.CanvasTexture(panelCanvas()); this._pt.colorSpace = this.T.SRGBColorSpace; } return this._pt; },
  // Small spacecraft: gold-foil bus, boom, two cell-textured wings, dish. Span about 0.06 (exaggerated so it reads next to Earth).
  _satModel(color, halo, bright) {
    const T = this.T, g = new T.Group(), foil = this._mat(color), gray = this._mat(0xb8c0d0), pan = new T.MeshLambertMaterial({ map: this._panelTexture(), color: 0xffffff, emissive: 0x0a1a3a });
    const body = new T.Mesh(new T.BoxGeometry(0.013, 0.013, 0.017), foil); g.add(body); g.userData.body = body; g.userData.sat = true;
    const bus = new T.Mesh(new T.BoxGeometry(0.0145, 0.0145, 0.004), gray); bus.position.z = -0.0085; g.add(bus);
    [-1, 1].forEach(s => {
      const boom = new T.Mesh(new T.CylinderGeometry(0.0008, 0.0008, 0.012, 6), gray); boom.rotation.z = Math.PI / 2; boom.position.x = s * 0.0125; g.add(boom);
      const p = new T.Mesh(new T.BoxGeometry(0.026, 0.0012, 0.0115), pan); p.position.x = s * 0.0325; g.add(p); });
    const dish = new T.Mesh(new T.SphereGeometry(0.0052, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshLambertMaterial({ color: 0xe8ecf5, side: T.DoubleSide })); dish.position.set(0, 0.0075, 0.002); dish.rotation.x = -0.5; g.add(dish);
    const ant = new T.Mesh(new T.CylinderGeometry(0.0004, 0.0004, 0.009, 4), gray); ant.position.set(0.004, -0.0095, 0.003); g.add(ant);
    const h = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: bright ? 0.5 : 0.32, depthWrite: false, blending: T.AdditiveBlending }));
    h.scale.setScalar(bright ? 0.085 : 0.06); g.add(h); g.userData.halo = h; return g;
  },
  _c(c) { return new this.T.Color(c); },
  // ISS: integrated truss with four solar-array pairs, radiators and a pressurised module cluster. Span about 0.1.
  _issModel(color) {
    const T = this.T, g = new T.Group(), gray = this._mat(0xc9ced9), white = this._mat(0xf1f3f8), pan = new T.MeshLambertMaterial({ map: this._panelTexture(), emissive: 0x0a1a3a });
    const truss = new T.Mesh(new T.BoxGeometry(0.1, 0.0026, 0.0026), gray); g.add(truss);
    const mod = new T.Mesh(new T.CylinderGeometry(0.0038, 0.0038, 0.036, 10), white); mod.rotation.x = Math.PI / 2; mod.position.z = 0.006; g.add(mod); g.userData.body = mod;
    const mod2 = new T.Mesh(new T.CylinderGeometry(0.003, 0.003, 0.022, 8), white); mod2.rotation.z = Math.PI / 2; mod2.position.z = 0.014; g.add(mod2);
    const node = new T.Mesh(new T.SphereGeometry(0.0045, 8, 6), gray); node.position.z = -0.011; g.add(node);
    [-1, 1].forEach(s => {
      [0.044, 0.028].forEach(x => { const p = new T.Mesh(new T.BoxGeometry(0.0075, 0.0009, 0.032), pan); p.position.x = s * x; g.add(p); });
      const r = new T.Mesh(new T.BoxGeometry(0.011, 0.0008, 0.010), white); r.position.set(s * 0.0135, 0, -0.0075); g.add(r); });
    g.userData.iss = true; g.userData.tintMat = mod.material;
    const h = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending })); h.scale.setScalar(0.09); g.add(h); g.userData.halo = h;
    return g;
  },
  _aircraftModel() {
    const T = this.T, g = new T.Group(), m = new T.MeshBasicMaterial({ color: 0xe9edf7, side: T.DoubleSide });
    const fus = new T.Mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.026, 8), m); fus.rotation.x = Math.PI / 2; g.add(fus);
    const nose = new T.Mesh(new T.ConeGeometry(0.0022, 0.006, 8), m); nose.rotation.x = Math.PI / 2; nose.position.z = 0.016; g.add(nose);
    const sh = new T.Shape(); sh.moveTo(0, 0.004); sh.lineTo(0.02, -0.006); sh.lineTo(0.02, -0.0085); sh.lineTo(0, -0.0035); sh.lineTo(-0.02, -0.0085); sh.lineTo(-0.02, -0.006); sh.closePath();
    const wing = new T.Mesh(new T.ShapeGeometry(sh), m); wing.rotation.x = Math.PI / 2; wing.position.z = 0.002; g.add(wing);
    const tail = new T.Mesh(new T.BoxGeometry(0.0009, 0.0075, 0.006), m); tail.position.set(0, 0.0035, -0.011); g.add(tail);
    const stab = new T.Mesh(new T.BoxGeometry(0.014, 0.0009, 0.004), m); stab.position.set(0, 0, -0.012); g.add(stab);
    g.userData.tintMat = m;
    const h = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: 0xe9edf7, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); h.scale.setScalar(0.06); g.add(h); g.userData.halo = h;
    return g;
  },
  // Ground site: base plate, mast and a tilted dish (small pylon/dish glyph), standing on the local vertical.
  _siteModel(color, pos) {
    const T = this.T, g = new T.Group(), m = new T.MeshLambertMaterial({ color: this._c(color), side: T.DoubleSide, emissive: this._c(color), emissiveIntensity: 0.35 }), dm = new T.MeshLambertMaterial({ color: 0xf2f4fa, side: T.DoubleSide, emissive: 0x556070 });
    const base = new T.Mesh(new T.CylinderGeometry(0.008, 0.009, 0.0022, 12), m); g.add(base);
    const mast = new T.Mesh(new T.CylinderGeometry(0.0013, 0.0019, 0.022, 6), m); mast.position.y = 0.0115; g.add(mast);
    const dish = new T.Mesh(new T.SphereGeometry(0.0085, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), dm); dish.position.y = 0.024; dish.rotation.x = -0.75; g.add(dish);
    const feed = new T.Mesh(new T.CylinderGeometry(0.0004, 0.0004, 0.008, 4), m); feed.position.set(0, 0.0285, 0.0045); feed.rotation.x = 0.6; g.add(feed);
    const h = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending })); h.scale.setScalar(0.04); h.position.y = 0.012; g.add(h);
    g.userData.tintMat = m; g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos))); return g;
  },
  _shipModel(pos) {
    const T = this.T, g = new T.Group(), hull = this._mat(0xc8d0e0), up = this._mat(0xe8ecf5);
    const h = new T.Mesh(new T.BoxGeometry(0.02, 0.006, 0.07), hull); g.add(h);
    const bow = new T.Mesh(new T.ConeGeometry(0.0141, 0.02, 4), hull); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.z = 0.045; bow.scale.y = 1; g.add(bow);
    const sup = new T.Mesh(new T.BoxGeometry(0.014, 0.008, 0.024), up); sup.position.set(0, 0.007, -0.004); g.add(sup);
    const mast = new T.Mesh(new T.CylinderGeometry(0.0008, 0.0008, 0.012, 4), up); mast.position.set(0, 0.015, -0.004); g.add(mast);
    g.userData.tintMat = hull; g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos))); g.rotateY(0.6); g.scale.setScalar(0.85); return g;
  },
  _buildItem(it, root, col) {
    const T = this.T;
    if (it.kind === 'shell') {
      // Shell: fresnel bubble (bright at its limb) + a clear equatorial ring, so LEO / MEO / GEO read as nested layers.
      const c = col(it.color);
      root.add(new T.Mesh(new T.SphereGeometry(it.r, 64, 40), new T.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: SHELL_FS, side: T.FrontSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uColor: { value: c }, uGain: { value: it.strong ? 0.5 : it.r > 1.6 ? 0.2 : 0.36 } } })));
      const ring = new T.Mesh(new T.TorusGeometry(it.r, it.strong ? 0.0075 : 0.0055, 6, 200), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: it.strong ? 0.95 : 0.7 }));
      ring.rotation.x = Math.PI / 2; root.add(ring);
      if (it.label) this._label(it.label, () => this._limbVis(it.r, it.ang ?? 45), 'shell', null, it.dy ?? 0, it.dx ?? 0);
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
      if (it.avoid) this.obst.push(it);
      if (it.label) this._label(it.label, t => it.labelEnd != null && t > it.labelEnd ? null : it.dynamic ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt, null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short);
    } else if (it.kind === 'point') {
      let m;
      if (it.shape === 'kv') { // glowing interceptor head
        m = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }));
        m.scale.setScalar(it.kvSize ?? 0.1);
      } else if (it.shape === 'sat' && !it.small) m = it.iss ? this._issModel(it.color) : this._satModel(it.color, true, it.bright);
      else if (it.shape === 'aircraft') m = this._aircraftModel();
      else if (it.shape === 'site') m = this._siteModel(it.color, it.pos(0));
      else if (it.shape === 'ship') m = this._shipModel(it.pos(0));
      else {
        let geo;
        if (it.shape === 'sat') geo = new T.OctahedronGeometry(0.018);
        else if (it.shape === 'tick') geo = new T.OctahedronGeometry(0.03);
        else geo = new T.CylinderGeometry(0.012, 0.012, 0.03, 10);
        m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color) }));
      }
      if (it.scale) m.scale.setScalar(it.scale);
      root.add(m);
      this.dyn.push({ it, obj: m });
      if (it.label) this._label(it.label, t => it.pos(t), null, it, it.labelDy ?? ((it.shape === 'site' || it.shape === 'ship') ? 28 : 0), it.labelDx ?? 0, it.short);
    } else if (it.kind === 'cloud') {
      const n = it.n, g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
      const ca = new Float32Array(n * 4), b = col(it.color || '#ffffff'); for (let k = 0; k < n; k++) ca.set([b.r, b.g, b.b, it.alpha ?? 0.7], 4 * k);
      g.setAttribute('aCol', new T.BufferAttribute(ca, 4));
      const pts = new T.Points(g, this._ptMat(it.size, IS_PHONE ? (it.minPx ?? 2.6) + 0.6 : (it.minPx ?? 2), it.maxPx ?? 9, IS_PHONE ? 1.15 : 1));
      pts.frustumCulled = false; pts.renderOrder = 2; root.add(pts); this.dyn.push({ it, obj: pts });
      if (it.label) this._label(it.label, t => it.labelAt || (it.fill(t, g.attributes.position.array) > 0 ? [g.attributes.position.array[0], g.attributes.position.array[1], g.attributes.position.array[2]] : null), null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short);
    } else if (it.kind === 'beam') {
      // Beam = thin bright core ribbon + soft halo ribbon, both camera-facing gradient quads; optional glow at the ends.
      const w = it.width || it.width0 || 0.004, m = new T.Group(); this.beamTex ||= new T.CanvasTexture(beamCanvas());
      const mk = (hw, op, c) => { const q = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: col(c || it.color || '#fff'), map: this.beamTex, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); q.userData.hw = hw; return q; };
      const hwC = it.width ? Math.max(0.0026, it.width * 0.16) : w, core = mk(hwC, it.opacity ?? 0.8, it.coreColor); m.add(core); m.userData.core = core;
      if (it.width) { const halo = mk(it.width * 0.75, 0.22); m.add(halo); m.userData.halo = halo; }
      if (it.ends) { m.userData.ends = [0, 1].map(() => { const s = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending })); s.scale.setScalar(it.ends); m.add(s); return s; }); }
      root.add(m); this.dyn.push({ it, obj: m }); if (it.avoid) this.obst.push(it);
      if (it.label) this._label(it.label, t => { const A = it.a(t), B = it.b(t); return A && B && it.on(t) ? scl(add(A, B), 0.5) : null; }, null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short);
    } else if (it.kind === 'dome') {
      const c = ll(it.at[0], it.at[1]);
      const m = new T.Mesh(new T.SphereGeometry(it.radius * DEG * 1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide }));
      m.position.set(...c); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...c)); root.add(m);
      this._label(it.label, () => scl(c, 1.12), null, null, it.labelDy ?? 0, it.labelDx ?? 0);
    } else if (it.kind === 'flash') {
      // Explosion: warm core sprite (fast fade) + expanding shock ring (slower).
      const m = new T.Group(); m.position.set(...it.pos);
      const core = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      const ring = new T.Sprite(new T.SpriteMaterial({ map: this.ringTex, color: col(it.ringColor || (it.big ? '#ffd9a0' : '#ffb38a')), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      m.add(core, ring); m.userData = { core, ring }; root.add(m); this.dyn.push({ it, obj: m });
      if (it.label) this._label(it.label, t => t > it.t0 ? it.pos : null, null, null, it.labelDy ?? 0, it.labelDx ?? 0);
    } else if (it.kind === 'status') { this.status = it; }
  },
});
