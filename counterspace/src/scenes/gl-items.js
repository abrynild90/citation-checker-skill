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

Object.assign(GLHost.prototype, {
  _atmo(root, r, side, pow, gain, back, sunDir) {
    const T = this.T;
    root.add(new T.Mesh(new T.SphereGeometry(r, 64, 48), new T.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uColor: { value: new T.Color(0x5fa8ff) }, uSun: { value: new T.Vector3(...sunDir) }, uPow: { value: pow }, uGain: { value: gain }, uBack: { value: back } } })));
  },
  _buildItem(it, root, col) {
    const T = this.T;
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
      if (it.avoid) this.obst.push(it);
      if (it.label) this._label(it.label, t => it.dynamic ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt, null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short);
    } else if (it.kind === 'point') {
      let m;
      if (it.shape === 'kv') { // glowing interceptor head
        m = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: col(it.color), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        m.scale.setScalar(it.kvSize ?? 0.1);
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
      if (it.halo) { const hp = new T.Points(g, new T.PointsMaterial({ size: it.size * 4.2, color: col(it.color), map: this.spriteTex, transparent: true, opacity: 0.1, depthWrite: false, blending: T.AdditiveBlending })); hp.frustumCulled = false; root.add(hp); }
      if (it.label) this._label(it.label, t => it.labelAt || (it.fill(t, arr) > 0 ? [arr[0], arr[1], arr[2]] : null), null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short);
    } else if (it.kind === 'beam') {
      // Beam = bright core + wide soft halo; unit-height cylinders scaled along the beam each frame.
      const w = it.width || it.width0 || 0.004, m = new T.Group();
      const mk = (r, op) => new T.Mesh(new T.CylinderGeometry(r, r, 1, 10, 1, true), new T.MeshBasicMaterial({ color: col(it.color || '#fff'), transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending }));
      const core = mk(w * (it.width ? 0.5 : 1), it.opacity ?? 0.8); m.add(core); m.userData.core = core;
      if (it.width) { const halo = mk(w * 2.2, 0.22); m.add(halo); m.userData.halo = halo; }
      root.add(m); this.dyn.push({ it, obj: m }); if (it.avoid) this.obst.push(it);
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
  },
});
