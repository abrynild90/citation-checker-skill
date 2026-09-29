// ============================================================================
// scenes/gl-items.js: GLHost mixin: atmosphere shaders and the per-kind item builders (shell, curve, point, cloud, beam, dome, flash)
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
import { GLHost } from './gl-host.js';
import { beamCanvas, panelCanvas } from './earth.js';
import { DEG, IS_PHONE, add, ll, norm, scl } from './core.js';

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
const TUBE_VS = `uniform float uR; uniform float uScale; uniform float uMaxPx; varying float vU;
void main(){ vU = uv.x; vec3 ax = position - normal * uR; float d = max(-(modelViewMatrix * vec4(ax, 1.0)).z, 0.1); float r = min(uR, uMaxPx * d / uScale); gl_Position = projectionMatrix * modelViewMatrix * vec4(ax + normal * r, 1.0); }`;
// uHead > 0: the tube fades from its tail (vU = 0) to the head (vU = uHead), so a growing trail is a fading path, not a rigid rod.
const TUBE_FS = `uniform vec3 uColor; uniform float uOp; uniform float uHead; varying float vU;
void main(){ float f = uHead > 0.0 ? mix(0.05, 1.0, pow(clamp(vU / uHead, 0.0, 1.0), 1.7)) : 1.0; gl_FragColor = vec4(uColor, uOp * f);\n#include <colorspace_fragment>\n}`;
export const lerp3 = (a, b, s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];

Object.assign(GLHost.prototype, {
  _atmo(root, r, side, pow, gain, back, sunDir, color = 0x5fa8ff) {
    const T = this.T;
    root.add(
      new T.Mesh(
        new T.SphereGeometry(r, 64, 48),
        new T.ShaderMaterial({
          vertexShader: ATMO_VS,
          fragmentShader: ATMO_FS,
          side,
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
          uniforms: {
            uColor: { value: new T.Color(color) },
            uSun: { value: new T.Vector3(...sunDir) },
            uPow: { value: pow },
            uGain: { value: gain },
            uBack: { value: back },
          },
        }),
      ),
    );
  },
  // Point material: size in world units, attenuated with distance, clamped to [min, max] CSS px (scaled to the drawing buffer in render()).
  _ptMat(size, minPx, maxPx, gain = 1) {
    const T = this.T,
      m = new T.ShaderMaterial({
        vertexShader: PT_VS,
        fragmentShader: PT_FS,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uScale: { value: 800 },
          uSize: { value: size },
          uMin: { value: minPx },
          uMax: { value: maxPx },
          uGain: { value: gain },
        },
      });
    m.userData = { minPx, maxPx };
    (this.ptMats ||= []).push(m);
    return m;
  },
  // Tube/ring material: the tube keeps its world radius at long range but its on-screen radius is capped (maxPx), so a ring seen from close by
  // becomes a thin line instead of a fat flat bar.
  _tubeMat(color, opacity, blending, radius, maxPx = 1.5, depthWrite = false) {
    const T = this.T,
      m = new T.ShaderMaterial({
        vertexShader: TUBE_VS,
        fragmentShader: TUBE_FS,
        transparent: true,
        depthWrite,
        blending,
        uniforms: {
          uColor: { value: color },
          uOp: { value: opacity },
          uR: { value: radius },
          uScale: { value: 800 },
          uMaxPx: { value: maxPx },
          uHead: { value: 0 },
        },
      });
    m.userData = { maxPx };
    (this.tubeMats ||= []).push(m);
    return m;
  },
  _mat(c, o = {}) {
    return new this.T.MeshLambertMaterial({ color: c, ...o });
  },
  _panelTexture() {
    if (!this._pt) {
      this._pt = new this.T.CanvasTexture(panelCanvas());
      this._pt.colorSpace = this.T.SRGBColorSpace;
    }
    return this._pt;
  },
  // Models are low-poly and exaggerated so they read next to Earth; each carries userData.span (world size at scale 1) and a px range:
  // _fitModels() rescales them every frame so a model is never a giant blob when the camera is close, nor a speck when it is far.
  // Small spacecraft (MSTI-3 class): octagonal foil-wrapped bus, dark sensor aperture, aft ring, yoke + two-segment cell-textured wings, mast and dish.
  _satModel(color, halo, bright) {
    const T = this.T,
      g = new T.Group(),
      foil = this._mat(color),
      gray = this._mat(0xb8c0d0),
      dark = this._mat(0x39415a),
      pan = new T.MeshLambertMaterial({ map: this._panelTexture(), color: 0xffffff, emissive: 0x0a1a3a });
    const cyl = (r0, r1, l, m, z, y = 0) => {
      const q = new T.Mesh(new T.CylinderGeometry(r0, r1, l, 8), m);
      q.rotation.x = Math.PI / 2;
      q.position.set(0, y, z);
      g.add(q);
      return q;
    };
    const body = cyl(0.0062, 0.0062, 0.015, foil, 0);
    g.userData.body = body;
    g.userData.sat = true;
    cyl(0.0067, 0.0067, 0.0015, gray, -0.0082);
    cyl(0.0034, 0.0046, 0.0042, dark, 0.0092);
    cyl(0.0064, 0.0064, 0.0006, gray, 0.0046);
    [-1, 1].forEach((s) => {
      const yoke = new T.Mesh(new T.BoxGeometry(0.0046, 0.0007, 0.0007), gray);
      yoke.position.x = s * 0.0086;
      g.add(yoke);
      [0, 1].forEach((i) => {
        const p = new T.Mesh(new T.BoxGeometry(0.0072, 0.0007, 0.0104), pan);
        p.position.x = s * (0.0114 + 0.0075 * i + 0.0036);
        g.add(p);
      });
    });
    const mast = new T.Mesh(new T.CylinderGeometry(0.00045, 0.00045, 0.0058, 5), gray);
    mast.position.set(0, 0.0088, -0.003);
    g.add(mast);
    const dish = new T.Mesh(
      new T.SphereGeometry(0.0034, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshLambertMaterial({ color: 0xe8ecf5, side: T.DoubleSide }),
    );
    dish.position.set(0, 0.0122, -0.003);
    dish.rotation.x = -0.6;
    g.add(dish);
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: this._c(color),
        transparent: true,
        opacity: bright ? 0.5 : 0.32,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(bright ? 0.075 : 0.055);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.052, minPx: 15, maxPx: 50 });
    return g;
  },
  _c(c) {
    return new this.T.Color(c);
  },
  // ISS: long integrated truss, four solar-array pairs (a blanket either side of each mast), white radiators, and the pressurised stack
  // (Zvezda-Zarya-Unity-Destiny in line, Harmony/Columbus/Kibo crossing at the node). Span about 0.11.
  _issModel(color) {
    const T = this.T,
      g = new T.Group(),
      gray = this._mat(0xc9ced9),
      white = this._mat(0xf1f3f8),
      gold = this._mat(0xd9b96a),
      pan = new T.MeshLambertMaterial({ map: this._panelTexture(), emissive: 0x0a1a3a, side: T.DoubleSide });
    const box = (w, h, d, m, x, y, z) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      q.position.set(x, y, z);
      g.add(q);
      return q;
    };
    const cyl = (r, l, m, x, y, z, alongX) => {
      const q = new T.Mesh(new T.CylinderGeometry(r, r, l, 10), m);
      if (alongX) q.rotation.z = Math.PI / 2;
      else q.rotation.x = Math.PI / 2;
      q.position.set(x, y, z);
      g.add(q);
      return q;
    };
    box(0.11, 0.0022, 0.0022, gray, 0, 0, 0.004);
    [-1, 1].forEach((s) => {
      [0.046, 0.027].forEach((x) => {
        box(0.0012, 0.0012, 0.0045, gray, s * x, 0, 0.004);
        [-1, 1].forEach((e) => box(0.0074, 0.0005, 0.0165, pan, s * x, 0, 0.004 + e * 0.0105));
      });
      box(0.0115, 0.0006, 0.0085, white, s * 0.0125, 0, -0.0042);
    });
    const main = cyl(0.0034, 0.024, white, 0, 0, 0.001);
    g.userData.body = main;
    cyl(0.0027, 0.012, white, 0, 0, -0.0135);
    cyl(0.0025, 0.012, gray, 0, 0, 0.0155);
    cyl(0.0031, 0.014, white, 0, 0, 0.0255);
    cyl(0.0022, 0.02, white, 0, 0, 0.0155, true);
    cyl(0.0017, 0.012, gold, 0, 0.0038, 0.0255, true);
    const node = new T.Mesh(new T.SphereGeometry(0.0038, 10, 6), gray);
    node.position.z = 0.0155;
    g.add(node);
    g.userData.iss = true;
    g.userData.tintMat = main.material;
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: this._c(color),
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(0.085);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.11, minPx: 24, maxPx: 62 });
    return g;
  },
  // Spaceplane (X-37B / CSSHQ class): delta planform, short fuselage, one canted fin pair; span about 0.05 (exaggerated).
  _planeModel(color, bright) {
    const T = this.T,
      g = new T.Group(),
      body = this._mat(color),
      dark = this._mat(0x2b3140);
    const sh = new T.Shape();
    sh.moveTo(0, 0.026);
    sh.lineTo(0.021, -0.014);
    sh.lineTo(0.008, -0.019);
    sh.lineTo(-0.008, -0.019);
    sh.lineTo(-0.021, -0.014);
    sh.closePath();
    const wing = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.0035, bevelEnabled: false }), body);
    wing.rotation.x = Math.PI / 2;
    wing.position.y = 0.0018;
    g.add(wing);
    const belly = new T.Mesh(new T.BoxGeometry(0.011, 0.0025, 0.03), dark);
    belly.position.set(0, -0.0018, 0.002);
    g.add(belly);
    const nose = new T.Mesh(new T.ConeGeometry(0.0052, 0.012, 8), body);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.0015, 0.027);
    g.add(nose);
    [-1, 1].forEach((s) => {
      const f = new T.Mesh(new T.BoxGeometry(0.0012, 0.0085, 0.008), body);
      f.position.set(s * 0.006, 0.0068, -0.014);
      f.rotation.z = -s * 0.35;
      g.add(f);
    });
    g.userData.body = wing;
    g.userData.sat = true;
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: this._c(color),
        transparent: true,
        opacity: bright ? 0.5 : 0.34,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(0.07);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.052, minPx: 22, maxPx: 60 });
    return g;
  },
  _aircraftModel() {
    const T = this.T,
      g = new T.Group(),
      m = new T.MeshBasicMaterial({ color: 0xe9edf7, side: T.DoubleSide });
    const fus = new T.Mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.026, 8), m);
    fus.rotation.x = Math.PI / 2;
    g.add(fus);
    const nose = new T.Mesh(new T.ConeGeometry(0.0022, 0.006, 8), m);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 0.016;
    g.add(nose);
    const sh = new T.Shape();
    sh.moveTo(0, 0.004);
    sh.lineTo(0.02, -0.006);
    sh.lineTo(0.02, -0.0085);
    sh.lineTo(0, -0.0035);
    sh.lineTo(-0.02, -0.0085);
    sh.lineTo(-0.02, -0.006);
    sh.closePath();
    const wing = new T.Mesh(new T.ShapeGeometry(sh), m);
    wing.rotation.x = Math.PI / 2;
    wing.position.z = 0.002;
    g.add(wing);
    [-1, 1].forEach((s) => {
      const tail = new T.Mesh(new T.BoxGeometry(0.0009, 0.0075, 0.006), m);
      tail.position.set(s * 0.0035, 0.0035, -0.011);
      tail.rotation.z = -s * 0.2;
      g.add(tail);
    });
    const stab = new T.Mesh(new T.BoxGeometry(0.014, 0.0009, 0.004), m);
    stab.position.set(0, 0, -0.012);
    g.add(stab);
    g.userData.tintMat = m;
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: 0xe9edf7,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(0.06);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.042, minPx: 19, maxPx: 44 });
    return g;
  },
  // Ground site: base plate, mast and a tilted dish (small pylon/dish glyph), standing on the local vertical.
  _siteModel(color, pos) {
    const T = this.T,
      g = new T.Group(),
      m = new T.MeshLambertMaterial({ color: this._c(color), side: T.DoubleSide, emissive: this._c(color), emissiveIntensity: 0.35 }),
      dm = new T.MeshLambertMaterial({ color: 0xf2f4fa, side: T.DoubleSide, emissive: 0x556070 });
    const base = new T.Mesh(new T.CylinderGeometry(0.008, 0.009, 0.0022, 12), m);
    g.add(base);
    const mast = new T.Mesh(new T.CylinderGeometry(0.0013, 0.0019, 0.022, 6), m);
    mast.position.y = 0.0115;
    g.add(mast);
    const dish = new T.Mesh(new T.SphereGeometry(0.0085, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), dm);
    dish.position.y = 0.024;
    dish.rotation.x = -0.75;
    g.add(dish);
    const feed = new T.Mesh(new T.CylinderGeometry(0.0004, 0.0004, 0.008, 4), m);
    feed.position.set(0, 0.0285, 0.0045);
    feed.rotation.x = 0.6;
    g.add(feed);
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: this._c(color),
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(0.04);
    h.position.y = 0.012;
    g.add(h);
    g.userData.tintMat = m;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    Object.assign(g.userData, { span: 0.03, minPx: 9, maxPx: 26 });
    return g;
  },
  // Guided-missile cruiser (Ticonderoga class, about 10:1 hull): pointed-bow hull extrusion, dark deck, forward and aft deckhouses with a mast, two stacks, a gun and a helicopter pad.
  _shipModel(pos) {
    const T = this.T,
      g = new T.Group(),
      hull = this._mat(0x8b95a8),
      deck = this._mat(0x5d6779),
      up = this._mat(0xdde2ee),
      gun = this._mat(0x9aa3b5);
    const sh = new T.Shape();
    sh.moveTo(-0.0036, -0.036);
    sh.lineTo(0.0036, -0.036);
    sh.lineTo(0.0043, 0.008);
    sh.quadraticCurveTo(0.0034, 0.03, 0, 0.042);
    sh.quadraticCurveTo(-0.0034, 0.03, -0.0043, 0.008);
    sh.closePath();
    const hg = new T.ExtrudeGeometry(sh, { depth: 0.0038, bevelEnabled: false });
    hg.rotateX(Math.PI / 2);
    hg.translate(0, 0.0038, 0);
    g.add(new T.Mesh(hg, hull));
    const box = (w, h, d, m, x, y, z) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      q.position.set(x, 0.0038 + h / 2 + y, z);
      g.add(q);
      return q;
    };
    box(0.0058, 0.0004, 0.014, deck, 0, 0, -0.026); // helicopter pad
    box(0.0056, 0.0042, 0.0125, up, 0, 0, 0.0035); // forward deckhouse
    box(0.0046, 0.0032, 0.0085, up, 0, 0, -0.0105); // aft deckhouse
    box(0.0034, 0.0038, 0.0034, up, 0, 0.0042, 0.006); // bridge
    [-0.0038, -0.0072].forEach((z) => {
      const st = new T.Mesh(new T.CylinderGeometry(0.0011, 0.0013, 0.0034, 6), gun);
      st.position.set(0, 0.0038 + 0.0032 + 0.0017, z);
      g.add(st);
    });
    const mast = new T.Mesh(new T.CylinderGeometry(0.00035, 0.00035, 0.008, 4), up);
    mast.position.set(0, 0.0038 + 0.0042 + 0.0038 + 0.004, 0.006);
    g.add(mast);
    const turret = new T.Mesh(new T.CylinderGeometry(0.0013, 0.0016, 0.0016, 8), gun);
    turret.position.set(0, 0.0038 + 0.0008, 0.022);
    g.add(turret);
    const barrel = new T.Mesh(new T.CylinderGeometry(0.00035, 0.00035, 0.005, 4), gun);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.0038 + 0.0018, 0.0255);
    g.add(barrel);
    g.position.y = 0;
    g.userData.tintMat = hull;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    g.rotateY(0.6);
    Object.assign(g.userData, { span: 0.078, baseScale: 0.85, minPx: 18, maxPx: 70 });
    return g;
  },
  _buildItem(it, root, col) {
    const T = this.T;
    if (it.kind === 'shell') {
      // Shell: fresnel bubble (bright at its limb) + a clear equatorial ring, so LEO / MEO / GEO read as nested layers.
      const c = col(it.color);
      root.add(
        new T.Mesh(
          new T.SphereGeometry(it.r, 64, 40),
          new T.ShaderMaterial({
            vertexShader: ATMO_VS,
            fragmentShader: SHELL_FS,
            side: T.FrontSide,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
            uniforms: { uColor: { value: c }, uGain: { value: it.strong ? 0.5 : it.r > 1.6 ? 0.2 : 0.36 } },
          }),
        ),
      );
      if (!it.noRing) {
        const ring = new T.Mesh(
          new T.TorusGeometry(it.r, it.strong ? 0.0075 : 0.0055, 6, 200),
          this._tubeMat(c, it.strong ? 0.95 : 0.7, T.NormalBlending, it.strong ? 0.0075 : 0.0055, it.strong ? 1.8 : 1.2, true),
        );
        ring.rotation.x = Math.PI / 2;
        root.add(ring);
        (this.shellRings ||= []).push(ring);
        {
          const rp = [];
          for (let a = 0; a <= 120; a++) rp.push([it.r * Math.cos((a / 120) * 2 * Math.PI), 0, it.r * Math.sin((a / 120) * 2 * Math.PI)]);
          rp.shell = true;
          (this.ringPts ||= []).push(rp);
        }
      }
      if (it.label) this._label(it.label, () => this._limbVis(it.r, it.ang ?? 45), 'shell', null, it.dy ?? 0, it.dx ?? 0, it.short, it.opt);
    } else if (it.kind === 'curve') {
      const g = new T.BufferGeometry();
      const pts = it.dynamic ? [] : it.all || it.pts(0);
      const max = it.dynamic ? 200 : pts.length;
      const arr = new Float32Array(max * 3);
      pts.forEach((p, k) => arr.set(p, 3 * k));
      g.setAttribute('position', new T.BufferAttribute(arr, 3));
      g.setDrawRange(0, pts.length);
      let line;
      if (it.dynamic) {
        // fading trail: per-vertex RGBA, brightest at the head
        g.setAttribute('color', new T.BufferAttribute(new Float32Array(max * 4), 4));
        line = new T.Line(
          g,
          new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }),
        );
        line.userData.rgb = col(it.color);
      } else line = new T.Line(g, new T.LineBasicMaterial({ color: col(it.color), transparent: true, opacity: it.opacity ?? 1 }));
      root.add(line);
      if (it.dynamic || it.gate) this.dyn.push({ it, obj: line });
      if (it.thick) {
        // bright tube so the path reads at any zoom; dynamic ones are revealed with drawRange
        const src = it.dynamic ? it.all : pts,
          closed =
            !it.dynamic &&
            src.length > 3 &&
            Math.hypot(src[0][0] - src[src.length - 1][0], src[0][1] - src[src.length - 1][1], src[0][2] - src[src.length - 1][2]) < 1e-6;
        const vp = (closed ? src.slice(0, -1) : src).map((q) => new T.Vector3(...q)),
          curve = new T.CatmullRomCurve3(vp, closed);
        const segs = it.dynamic ? src.length - 1 : Math.max(60, vp.length),
          geo = new T.TubeGeometry(curve, segs, it.thick, 5, closed);
        const tube = new T.Mesh(
          geo,
          this._tubeMat(
            col(it.color),
            it.dynamic ? 0.9 : (it.opacity ?? 1),
            it.dynamic ? T.AdditiveBlending : T.NormalBlending,
            it.thick,
            it.dynamic ? 1.9 : 1.4,
          ),
        );
        if (!it.dynamic && it.orbit) (this.ringPts ||= []).push(pts);
        root.add(tube);
        if (it.dynamic) this.dyn.push({ it: { kind: 'tube', ref: it, segs }, obj: tube });
        else if (it.gate) this.dyn.push({ it: { kind: 'gtube', ref: it }, obj: tube });
        line.visible = !it.dynamic ? false : line.visible;
        if (!it.dynamic) line.material.opacity = 0;
      }
      if (it.avoid) this.obst.push(it);
      if (it.label)
        this._label(
          it.label,
          (t) =>
            it.labelEnd != null && t > it.labelEnd ? null : it.dynamic || it.gate ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt,
          null,
          null,
          it.labelDy ?? 0,
          it.labelDx ?? 0,
          it.short,
          it.opt,
        );
    } else if (it.kind === 'point') {
      let m;
      if (it.shape === 'none') m = new T.Object3D();
      else if (it.shape === 'kv') {
        // glowing interceptor head
        m = new T.Sprite(
          new T.SpriteMaterial({
            map: this.spriteTex,
            color: col(it.color),
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: T.AdditiveBlending,
          }),
        );
        m.scale.setScalar(it.kvSize ?? 0.1);
        Object.assign(m.userData, { span: 1, baseScale: it.kvSize ?? 0.1, minPx: 5, maxPx: 22 }); // glow heads keep a bounded on-screen size
      } else if (it.shape === 'sat' && (!it.small || (it.label && !it.ctx))) {
        m = it.iss ? this._issModel(it.color) : this._satModel(it.color, true, it.bright);
        if (it.small) Object.assign(m.userData, { minPx: 11, maxPx: 30 }); // a released sub-satellite: smaller than its parent, still a model
      }
      else if (it.shape === 'plane') m = this._planeModel(it.color, it.bright);
      else if (it.shape === 'aircraft') m = this._aircraftModel();
      else if (it.shape === 'site') m = this._siteModel(it.color, it.pos(0));
      else if (it.shape === 'ship') m = this._shipModel(it.pos(0));
      else {
        let geo;
        if (it.shape === 'sat') geo = new T.OctahedronGeometry(0.018);
        else if (it.shape === 'tick') geo = new T.OctahedronGeometry(0.03);
        else geo = new T.CylinderGeometry(0.012, 0.012, 0.03, 10);
        m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color) }));
        Object.assign(
          m.userData,
          it.shape === 'sat'
            ? { span: 0.036, minPx: 6, maxPx: 10 }
            : it.shape === 'tick'
              ? { span: 0.06, minPx: 7, maxPx: 12 }
              : { span: 0.03, minPx: 6, maxPx: 12 },
        );
      }
      if (m.userData.span) {
        if (it.minPx) m.userData.minPx = it.minPx;
        if (it.maxPx) m.userData.maxPx = it.maxPx;
        m.userData.base = it.scale ?? m.userData.baseScale ?? 1;
        m.scale.setScalar(m.userData.base);
      } else if (it.scale) m.scale.setScalar(it.scale);
      root.add(m);
      this.dyn.push({ it, obj: m });
      if (it.label)
        this._label(
          it.label,
          (t) => it.pos(t),
          null,
          it,
          it.labelDy ?? (it.shape === 'site' || it.shape === 'ship' ? 28 : 0),
          it.labelDx ?? 0,
          it.short,
          it.opt,
        );
    } else if (it.kind === 'cloud') {
      const n = it.n,
        g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
      const ca = new Float32Array(n * 4),
        b = col(it.color || '#ffffff');
      for (let k = 0; k < n; k++) ca.set([b.r, b.g, b.b, it.alpha ?? 0.7], 4 * k);
      g.setAttribute('aCol', new T.BufferAttribute(ca, 4));
      const deb = it.dynCol && !it.colored,
        mn = it.minPx ?? (deb ? 3 : 2);
      const pts = new T.Points(g, this._ptMat(it.size, IS_PHONE ? mn + 1 : mn, it.maxPx ?? (deb ? 11 : 9), IS_PHONE ? 1.15 : 1));
      pts.frustumCulled = false;
      pts.renderOrder = 2;
      root.add(pts);
      this.dyn.push({ it, obj: pts });
      if (deb) {
        const hz = new T.Points(g, this._ptMat(it.size * 3.4, (IS_PHONE ? mn + 1 : mn) * 2.6, 34, 0.2));
        hz.frustumCulled = false;
        hz.renderOrder = 1;
        root.add(hz);
        pts.userData.haze = hz;
      }
      if (it.label)
        this._label(
          it.label,
          (t) =>
            t < (it.labelFrom ?? -1)
              ? null
              : (typeof it.labelAt === 'function' ? it.labelAt(t) : it.labelAt) ||
            (it.fill(t, g.attributes.position.array) > 0
              ? [3 * (it.labelIdx ?? 0), 3 * (it.labelIdx ?? 0) + 1, 3 * (it.labelIdx ?? 0) + 2].map((i) => g.attributes.position.array[i])
              : null),
          null,
          null,
          it.labelDy ?? 0,
          it.labelDx ?? 0,
          it.short,
          it.opt,
        );
    } else if (it.kind === 'beam') {
      // Beam = thin bright core ribbon + soft halo ribbon, both camera-facing gradient quads; optional glow at the ends.
      const w = it.width || it.width0 || 0.004,
        m = new T.Group();
      this.beamTex ||= new T.CanvasTexture(beamCanvas());
      const mk = (hw, op, c) => {
        const q = new T.Mesh(
          new T.PlaneGeometry(1, 1),
          new T.MeshBasicMaterial({
            color: col(c || it.color || '#fff'),
            map: this.beamTex,
            transparent: true,
            opacity: op,
            depthWrite: false,
            blending: T.AdditiveBlending,
            side: T.DoubleSide,
          }),
        );
        q.userData.hw = hw;
        return q;
      };
      const hwC = it.width ? Math.max(0.0026, it.width * 0.16) : w,
        core = mk(hwC, it.opacity ?? 0.8, it.coreColor);
      m.add(core);
      m.userData.core = core;
      if (it.width) {
        const halo = mk(it.width * 0.75, 0.22);
        m.add(halo);
        m.userData.halo = halo;
      }
      if (it.ends) {
        m.userData.ends = [0, 1].map(() => {
          const s = new T.Sprite(
            new T.SpriteMaterial({
              map: this.spriteTex,
              color: col(it.color),
              transparent: true,
              opacity: 0.8,
              depthWrite: false,
              depthTest: false,
              blending: T.AdditiveBlending,
            }),
          );
          s.scale.setScalar(it.ends);
          m.add(s);
          return s;
        });
      }
      root.add(m);
      this.dyn.push({ it, obj: m });
      if (it.avoid) this.obst.push(it);
      if (it.label)
        this._label(
          it.label,
          (t) => {
            const A = it.a(t),
              B = it.b(t);
            return A && B && it.on(t) ? scl(add(A, B), 0.5) : null;
          },
          null,
          null,
          it.labelDy ?? 0,
          it.labelDx ?? 0,
          it.short,
          it.opt,
        );
    } else if (it.kind === 'dome') {
      const c = ll(it.at[0], it.at[1]);
      const m = new T.Mesh(
        new T.SphereGeometry(it.radius * DEG * 1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new T.MeshBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide }),
      );
      m.position.set(...c);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...c));
      root.add(m);
      this._label(it.label, () => scl(c, 1.12), null, null, it.labelDy ?? 0, it.labelDx ?? 0, null, it.opt);
    } else if (it.kind === 'flash') {
      // Explosion: warm core sprite (fast fade) + expanding shock ring (slower).
      const m = new T.Group();
      m.position.set(...it.pos);
      const core = new T.Sprite(
        new T.SpriteMaterial({
          map: this.spriteTex,
          color: col(it.color),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: false,
          blending: T.AdditiveBlending,
        }),
      );
      const ring = new T.Sprite(
        new T.SpriteMaterial({
          map: this.ringTex,
          color: col(it.ringColor || (it.big ? '#ffd9a0' : '#ffb38a')),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: false,
          blending: T.AdditiveBlending,
        }),
      );
      m.add(core, ring);
      m.userData = { core, ring };
      root.add(m);
      this.dyn.push({ it, obj: m });
      if (it.label)
        this._label(it.label, (t) => (t > it.t0 ? it.pos : null), null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short, it.opt);
    } else if (it.kind === 'status') {
      this.status = it;
    }
  },
});
