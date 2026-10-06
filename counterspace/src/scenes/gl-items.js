// ============================================================================
// scenes/gl-items.js: GLHost mixin: atmosphere shaders and the per-kind item builders (shell, curve, point, cloud, beam, dome, flash)
// (ES module bundled by esbuild from src/boot.js; the GLHost methods here are installed by installGLItems(GLHost), see app.js.)
// ============================================================================
import { beamCanvas, dotCanvas, panelCanvas } from './earth.js';
import { DEG, IS_PHONE, add, ll, scl } from './core.js';
import { modelMethods } from './gl-models.js';
import { earthMethods } from './gl-earth.js';
import { spaceMethods } from './gl-space.js';

const ATMO_VS = `varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz;
vW = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * mv; }`;

const PT_VS = `attribute vec4 aCol; uniform float uScale; uniform float uSize; uniform float uMin; uniform float uMax; uniform float uVar; uniform float uD0; varying vec4 vC;
void main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
float dz = max(-mv.z, 0.1);
float k = 1.0;
if (uVar > 0.0) { k = mix(1.0, 0.55 + 0.9 * clamp(aCol.a, 0.0, 1.0), uVar); vC.a *= mix(1.0, clamp(1.2 - 1.1 * (dz - uD0) / uD0, 0.45, 1.0), uVar); }
gl_PointSize = clamp(k * uSize * uScale / dz, uMin, uMax); }`;
// Soft gaussian falloff, normal alpha blending: dense clumps saturate to the particle colour, never to white.
const PT_FS = `uniform float uGain; varying vec4 vC;
void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float f = exp(-r * r * 3.4) * (1.0 - smoothstep(0.8, 1.0, r));
gl_FragColor = vec4(vC.rgb, vC.a * f * uGain); }`;
const SHELL_FS = `uniform vec3 uColor; uniform float uGain; varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main(){ vec3 v = normalize(-vP); float d = clamp(dot(normalize(vN), v), 0.0, 1.0); float rim = pow(1.0 - d, 5.0);
gl_FragColor = vec4(uColor, clamp(rim * uGain, 0.0, 1.0)); }`;
const TRAIL_VS = `uniform float uR; uniform float uScale; uniform float uMaxPx; uniform float uU; uniform float uLen; varying float vF;
void main(){ float lag = mod(uU - uv.x * 6.2831853, 6.2831853); vF = lag < uLen ? 1.0 - lag / uLen : 0.0;
vec3 ax = position - normal * uR; float d = max(-(modelViewMatrix * vec4(ax, 1.0)).z, 0.1);
float r = min(uR, uMaxPx * d / uScale) * (0.2 + 0.8 * vF);
gl_Position = projectionMatrix * modelViewMatrix * vec4(ax + normal * r, 1.0); }`;
const TRAIL_FS = `uniform vec3 uColor; uniform float uOp; varying float vF;
void main(){ if (vF <= 0.003) discard; gl_FragColor = vec4(uColor, uOp * pow(vF, 1.5)); }`;
const TUBE_VS = `uniform float uR; uniform float uScale; uniform float uMaxPx; uniform float uPush; uniform float uTaper; varying float vU; varying vec3 vP;
void main(){ vU = uv.x; vP = position; vec3 ax = position - normal * uR; float d = max(-(modelViewMatrix * vec4(ax, 1.0)).z, 0.1);
float r = min(uR, uMaxPx * d / uScale) * mix(uTaper, 1.0, pow(uv.x, 1.2));
vec4 mv = modelViewMatrix * vec4(ax + normal * r, 1.0); mv.z -= uPush; gl_Position = projectionMatrix * mv; }`;
// uHead > 0: the tube fades from its tail (vU = 0) to the head (vU = uHead), so a growing trail is a fading path, not a rigid rod.
const TUBE_FS = `uniform vec3 uColor; uniform float uOp; uniform float uHead; uniform float uTail;
uniform vec4 uGap0; uniform vec4 uGap1; uniform float uFar; varying float vU; varying vec3 vP;
// uTail > 0: only the last uTail of the tube length behind the head is visible (a capped wake)
void main(){ float f = uHead > 0.0 ? mix(0.05, 1.0, pow(clamp(vU / uHead, 0.0, 1.0), 1.7)) : 1.0;
if (uTail > 0.0) f *= clamp((vU - (uHead - uTail)) / uTail, 0.0, 1.0);
// uGap*: the line fades out around a craft (xyz, radius w), so an orbit never runs through a model
// uFar > 0 (opt-in): the line is thin and fades with its angle to the viewer; the far side of the orbit is dimmer and dashed
if (uFar > 0.0) { float fc = dot(normalize(vP), normalize(cameraPosition)); float far = 1.0 - smoothstep(-0.25, 0.35, fc); f *= mix(0.55, 1.0, smoothstep(-0.2, 0.8, fc)); f *= mix(1.0, 0.3 + 0.7 * step(0.5, fract(vU * 130.0)), far); }
if (uGap0.w > 0.0) f *= smoothstep(uGap0.w * 0.7, uGap0.w * 1.5, distance(vP, uGap0.xyz));
if (uGap1.w > 0.0) f *= smoothstep(uGap1.w * 0.7, uGap1.w * 1.5, distance(vP, uGap1.xyz));
gl_FragColor = vec4(uColor, uOp * f);\n#include <colorspace_fragment>\n}`;
// Glare texture: soft round core plus four thin spikes (a camera-style dazzle flare).
function glareCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const core = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.12, 'rgba(255,255,255,0.85)');
  core.addColorStop(0.35, 'rgba(255,255,255,0.22)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core;
  g.fillRect(0, 0, 128, 128);
  for (const a of [0, Math.PI / 2]) {
    g.save();
    g.translate(64, 64);
    g.rotate(a);
    const sp = g.createLinearGradient(-64, 0, 64, 0);
    sp.addColorStop(0, 'rgba(255,255,255,0)');
    sp.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp;
    g.fillRect(-64, -1.6, 128, 3.2);
    g.restore();
  }
  return c;
}
export const lerp3 = (a, b, s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];

const methods = {
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
          uVar: { value: 0 },
          uD0: { value: 3 },
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
          uTaper: { value: 1 },
          uTail: { value: 0 },
          uGap0: { value: new T.Vector4(0, 0, 0, 0) },
          uGap1: { value: new T.Vector4(0, 0, 0, 0) },
          uPush: { value: 0 },
          uFar: { value: 0 },
        },
      });
    m.userData = { maxPx };
    (this.tubeMats ||= []).push(m);
    return m;
  },
  // Craft materials: painted panel, wrapped foil (the item's colour), and the solar-cell glass. All read the scene's generated environment map.
  _mat(c, o = {}) {
    return new this.T.MeshStandardMaterial({ color: c, metalness: 0.12, roughness: 0.58, ...o });
  },
  _foil(c, o = {}) {
    return new this.T.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: 0.34, bumpMap: this._foilBump(), bumpScale: 1.6, ...o });
  },
  _panelMat(o = {}) {
    return new this.T.MeshStandardMaterial({ map: this._panelTexture(), color: 0x9fb0d8, metalness: 0.2, roughness: 0.6, emissive: 0x040a1a, emissiveIntensity: 1, ...o });
  },
  _panelTexture() {
    if (!this._pt) {
      this._pt = new this.T.CanvasTexture(panelCanvas());
      this._pt.colorSpace = this.T.SRGBColorSpace;
      this._pt.anisotropy = 4;
    }
    return this._pt;
  },
  // A comet-style trail behind a satellite on a circular orbit: the whole orbit as a tube whose brightness and width fall from the satellite back along the
  // path (the shader needs only the satellite's current angle), so nothing is rebuilt per frame.
  _trail(it, root) {
    const T = this.T,
      { pts, u0, speed, len } = it.trailOf,
      vp = pts.slice(0, -1).map((q) => new T.Vector3(...q)),
      geo = new T.TubeGeometry(new T.CatmullRomCurve3(vp, true), Math.max(120, vp.length), it.iss ? 0.006 : 0.004, 5, true),
      m = new T.ShaderMaterial({
        vertexShader: TRAIL_VS,
        fragmentShader: TRAIL_FS,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        uniforms: {
          uColor: { value: new T.Color(it.color) },
          uOp: { value: it.iss ? 0.9 : 0.6 },
          uR: { value: it.iss ? 0.006 : 0.004 },
          uScale: { value: 800 },
          uMaxPx: { value: it.iss ? 2.4 : 1.6 },
          uU: { value: 0 },
          uLen: { value: len },
        },
      });
    m.userData = { maxPx: it.iss ? 2.4 : 1.6 };
    (this.tubeMats ||= []).push(m);
    root.add(new T.Mesh(geo, m));
    (this.trails ||= []).push({ m, u0, speed });
  },
  // Models are low-poly and exaggerated so they read next to Earth; each carries userData.span (world size at scale 1) and a px range:
  _buildItem(it, root, col) {
    const T = this.T;
    if (it.kind === 'shell') {
      // Shell: a thin ring in the equatorial plane (and, in the hero, a soft halo around it), so LEO / MEO / GEO read as nested layers.
      const c = col(it.color);
      if (!it.noRing) {
        const ring = new T.Mesh(
          new T.TorusGeometry(it.r, it.strong ? 0.0075 : 0.0055, 6, 200),
          this._tubeMat(c, it.strong ? 0.95 : 0.7, T.NormalBlending, it.strong ? 0.0075 : 0.0055, it.strong ? 1.8 : 1.2, true),
        );
        ring.rotation.x = Math.PI / 2;
        root.add(ring);
        (this.shellRings ||= []).push(ring); // hidden with the labels when a camera hides the shells
        if (it.strong) {
          const halo = new T.Mesh(new T.TorusGeometry(it.r, 0.02, 6, 200), this._tubeMat(c, 0.2, T.AdditiveBlending, 0.02, 6, false));
          halo.rotation.x = Math.PI / 2;
          root.add(halo);
          this.shellRings.push(halo);
        }
        {
          const rp = [];
          for (let a = 0; a <= 120; a++) rp.push([it.r * Math.cos((a / 120) * 2 * Math.PI), 0, it.r * Math.sin((a / 120) * 2 * Math.PI)]);
          rp.shell = true;
          (this.ringPts ||= []).push(rp);
        }
      }
      // Hero: a shell's label sits on its own ring (ang = degrees round the ring from the point facing the camera), not on the sphere's limb.
      if (it.label)
        this._label(
          it.label,
          this.sim?.cfg.spin && !it.noRing ? () => this._ringPt(it.r, it.ang ?? 45) : () => this._limbVis(it.r, it.ang ?? 45),
          'shell',
          null,
          it.dy ?? 0,
          it.dx ?? 0,
          it.short,
          it.opt,
        );
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
        line = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
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
        if (it.dynamic && it.byIndex) {
          // byIndex: the tube's segments follow the samples (not equal arc length), so the revealed head sits exactly on the moving craft
          curve.getPointAt = (u, o) => curve.getPoint(u, o);
          curve.getTangentAt = (u, o) => curve.getTangent(u, o);
        }
        const segs = it.dynamic ? src.length - 1 : Math.max(60, vp.length),
          geo = new T.TubeGeometry(curve, segs, it.thick, 5, closed);
        const tube = new T.Mesh(
          geo,
          this._tubeMat(
            col(it.color),
            it.dynamic ? (it.wakeOp ?? 0.9) : (it.opacity ?? 1),
            it.dynamic ? T.AdditiveBlending : T.NormalBlending,
            it.thick,
            it.dynamic ? 1.9 : it.fade ? 0.8 : 1.4,
          ),
        );
        if (it.fade) tube.material.uniforms.uFar.value = 1; // opt-in thin line, dimmer and dashed on the far side
        if (it.gapIds) (this.gapRings ||= []).push({ mat: tube.material, ids: it.gapIds });
        if (it.tail) tube.material.uniforms.uTail.value = it.tail; // capped wake length (fraction of the whole path)
        if (it.taper != null) tube.material.uniforms.uTaper.value = it.taper; // thin at the start, full width at the far end: reads apart from the orbit line it crosses
        if (it.push) tube.material.uniforms.uPush.value = it.push; // orbit line pushed back from the camera: craft on it are drawn in front
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
          (t) => (it.labelEnd != null && t > it.labelEnd ? null : it.dynamic || it.gate ? (it.pts(t).length > 2 ? it.labelAt : null) : it.labelAt),
          null,
          null,
          it.labelDy ?? 0,
          it.labelDx ?? 0,
          it.short,
          it.opt,
          { hue: it.color, place: !!(it.orbit || it.gate) },
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
        // glow heads keep a bounded on-screen size
        Object.assign(m.userData, { span: 1, baseScale: it.kvSize ?? 0.1, minPx: it.kvMin ?? (it.kvSize ? 5 : 13), maxPx: it.kvMax ?? (it.kvSize ? 22 : 32) });
      } else if (it.shape === 'sat' && (!it.small || (it.label && !it.ctx))) {
        m = it.iss ? this._issModel(it.color) : this._satModel(it.color, !!(it.state || it.glow), it.bright, it.variant);
        if (it.small) Object.assign(m.userData, { minPx: 11, maxPx: 30 }); // a released sub-satellite: smaller than its parent, still a model
      } else if (it.shape === 'plane') m = it.variant === 'winged' ? this._wingedModel(it.color, it.bright, !!(it.state || it.glow)) : this._planeModel(it.color, it.bright, !!(it.state || it.glow));
      else if (it.shape === 'rocket') m = this._rocketModel(it.color);
      else if (it.shape === 'aircraft') m = this._aircraftModel(!!it.state);
      else if (it.shape === 'site') m = it.pin ? this._pinModel(it.color, it.pos(0)) : this._siteModel(it.color, it.pos(0), !!it.state);
      else if (it.shape === 'ship') m = this._shipModel(it.pos(0));
      else if (it.shape === 'jammer') m = this._jammerModel(it.color, it.pos(0));
      else {
        if (it.shape === 'sat') {
          // a small satellite is a crisp dot in its colour, kept a few pixels across
          m = new T.Sprite(new T.SpriteMaterial({ map: this._gtex(dotCanvas(), () => new T.CanvasTexture(dotCanvas())), color: col(it.color), transparent: true, depthWrite: false }));
          m.scale.setScalar(0.03);
          Object.assign(m.userData, { span: 1, baseScale: 0.03, minPx: 5, maxPx: 8 });
        } else {
          const geo = it.shape === 'tick' ? new T.OctahedronGeometry(0.03) : new T.CylinderGeometry(0.012, 0.012, 0.03, 10);
          m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col(it.color) }));
          Object.assign(m.userData, it.shape === 'tick' ? { span: 0.06, minPx: 7, maxPx: 12 } : { span: 0.03, minPx: 6, maxPx: 12 });
        }
      }
      if (m.userData.span) {
        if (it.minPx) m.userData.minPx = it.minPx;
        if (it.maxPx) m.userData.maxPx = it.maxPx;
        m.userData.base = it.scale ?? m.userData.baseScale ?? 1;
        m.scale.setScalar(m.userData.base);
      } else if (it.scale) m.scale.setScalar(it.scale);
      root.add(m);
      this.dyn.push({ it, obj: m });
      if (it.trailOf) this._trail(it, root);
      if (it.label)
        this._label(
          it.label,
          (t) => it.pos(t),
          null,
          it,
          it.labelDy ?? (it.shape === 'site' || it.shape === 'ship' || it.shape === 'jammer' ? 28 : 0),
          it.labelDx ?? 0,
          it.short,
          it.opt,
          { hue: it.color, place: (it.shape === 'site' && !it.ctx) || it.shape === 'none' },
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
      const pm = this._ptMat(it.size, IS_PHONE ? mn + 1 : mn, it.maxPx ?? (deb ? 11 : 9), IS_PHONE ? 1.15 : 1);
      if (deb) pm.uniforms.uVar.value = 1; // debris: dots differ in size and brightness, and fade with distance from the camera
      if (it.additive) pm.blending = T.AdditiveBlending; // opt-in: bright additive sprites read against dark terrain
      const pts = new T.Points(g, pm);
      pts.frustumCulled = false;
      pts.renderOrder = 2;
      root.add(pts);
      this.dyn.push({ it, obj: pts });
      if (it.trail && deb) {
        // opt-in short trails: earlier positions of every fragment (it.trail.n steps of it.trail.dt) drawn smaller and fainter behind it
        const K = it.trail.n,
          tg = new T.BufferGeometry();
        tg.setAttribute('position', new T.BufferAttribute(new Float32Array(n * K * 3), 3));
        tg.setAttribute('aCol', new T.BufferAttribute(new Float32Array(n * K * 4), 4));
        const tm = this._ptMat(it.size * 0.8, Math.max(2, mn - 1), it.maxPx ?? 11, 1);
        tm.uniforms.uVar.value = 1;
        tm.blending = T.AdditiveBlending;
        const tp = new T.Points(tg, tm);
        tp.frustumCulled = false;
        tp.renderOrder = 1;
        root.add(tp);
        pts.userData.trail = { tg, K, pos: new Float32Array(n * 3), col: new Float32Array(n * 4) };
      }
      if (deb) {
        const hm = this._ptMat(it.size * 3.4, (IS_PHONE ? mn + 1 : mn) * 2.6, 34, it.additive ? 0.2 : 0.11);
        if (it.additive) hm.blending = T.AdditiveBlending;
        const hz = new T.Points(g, hm);
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
          it.labelOffDisc ? { offGlobe: true, stillOnly: true } : null,
          it.labelDy ?? 0,
          it.labelDx ?? 0,
          it.short,
          it.opt,
          { hue: it.hue || it.color },
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
        if (it.edgeFade) {
          // the beam fades out toward every edge of the frame, so it never ends in a hard streak at the border
          const res = (this._edgeRes ||= new T.Vector2(1, 1));
          q.material.onBeforeCompile = (sh) => {
            sh.uniforms.uRes = { value: res };
            sh.fragmentShader = 'uniform vec2 uRes;\n' + sh.fragmentShader.replace(
              '#include <dithering_fragment>',
              'vec2 eq = gl_FragCoord.xy / uRes; float ee = min(min(eq.x, 1.0 - eq.x), min(eq.y, 1.0 - eq.y)); gl_FragColor.a *= smoothstep(0.0, 0.2, ee);\n#include <dithering_fragment>',
            );
          };
        }
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
            return A && B && it.on(t) ? add(scl(A, 1 - (it.labelFrac ?? 0.5)), scl(B, it.labelFrac ?? 0.5)) : null;
          },
          null,
          it.labelOffDisc ? { offGlobe: true, stillOnly: true } : null,
          it.labelDy ?? 0,
          it.labelDx ?? 0,
          it.short,
          it.opt,
          { hue: it.color },
        );
    } else if (it.kind === 'dome') {
      const c = ll(it.at[0], it.at[1]),
        rho = it.radius * DEG,
        up = new T.Vector3(...c);
      // The dome fades toward its silhouette (strong where the surface faces the camera) so its edge has a falloff, not a hard shell.
      // it.soft (opt-in): a soft dome, brightest low and fading upward and toward its silhouette, with a few faint noise rings; a thin ring marks its base
      const softMat = it.soft
        ? new T.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: T.DoubleSide,
            uniforms: { uColor: { value: col(it.color) }, uRho: { value: rho } },
            vertexShader:
              'uniform float uRho; varying vec3 vN; varying vec3 vV; varying vec3 vL; void main(){ vL = position / uRho; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
            fragmentShader:
              'uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying vec3 vL; float hh(float x){ return fract(sin(x * 91.3458) * 47453.5453); } void main(){ float d = abs(dot(normalize(vN), normalize(vV))); float h = clamp(vL.y, 0.0, 1.0); float th = acos(h); float az = atan(vL.z, vL.x); float ring = 0.0; for (int k = 0; k < 4; k++){ float fk = float(k); float c = 0.28 + 0.2 * fk + 0.05 * (hh(fk + floor(az * 2.0)) - 0.5); ring += exp(-pow((th - c * 1.5708) / 0.035, 2.0)) * (0.5 + 0.5 * hh(fk * 7.0 + floor(az * 5.0))); } float a = (0.05 + 0.30 * pow(1.0 - h, 1.4) * smoothstep(0.0, 0.7, d) + 0.05 * ring) * (1.0 - smoothstep(0.7, 1.0, 1.0 - h * 0.0) * 0.0) * smoothstep(0.0, 0.08, h + 0.02 * d); gl_FragColor = vec4(uColor * (1.0 + 0.35 * ring), a);\n#include <colorspace_fragment>\n}',
          })
        : null;
      const m = new T.Mesh(
        new T.SphereGeometry(rho, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        softMat || new T.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: T.DoubleSide,
          uniforms: { uColor: { value: col(it.color) } },
          vertexShader:
            'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
          fragmentShader:
            'uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main(){ float d = abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(uColor, 0.05 + 0.3 * smoothstep(0.0, 0.8, d));\n#include <colorspace_fragment>\n}',
        }),
      );
      m.position.set(...c);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), up);
      root.add(m);
      if (it.soft) {
        const pts = [];
        for (let k = 0; k <= 96; k++) {
          const a = (k / 96) * Math.PI * 2;
          pts.push(new T.Vector3(Math.cos(a) * rho, 0, Math.sin(a) * rho));
        }
        const base = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col(it.color), transparent: true, opacity: 0.55, depthWrite: false }));
        base.position.copy(m.position);
        base.quaternion.copy(m.quaternion);
        root.add(base);
      }
      // Ground contact: a dark red cap on the surface, darkest at the centre and fading out toward the zone's edge, so the terrain under the zone dims.
      const cap = new T.Mesh(
        new T.SphereGeometry(1.004, 48, 10, 0, Math.PI * 2, 0, rho),
        new T.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: { uColor: { value: new T.Color(0x2a0307) }, uRho: { value: rho } },
          vertexShader:
            'uniform float uRho; varying float vT; void main(){ vT = acos(clamp(normalize(position).y, -1.0, 1.0)) / uRho; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader:
            'uniform vec3 uColor; varying float vT; void main(){ gl_FragColor = vec4(uColor, 0.46 * (1.0 - smoothstep(0.3, 1.0, vT)));\n#include <colorspace_fragment>\n}',
        }),
      );
      cap.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), up);
      cap.renderOrder = 1;
      root.add(cap);
      // the label's referent is the zone's east edge on the ground (a point of the drawn red ring), so its leader always ends on something drawn
      const edge = ll(it.at[0], it.at[1] + it.radius / Math.max(0.3, Math.cos(it.at[0] * DEG)), 1.006);
      this._label(it.label, () => edge, null, null, it.labelDy ?? 0, it.labelDx ?? 0, null, it.opt, { place: true });
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
      if (it.strong) {
        // a second, white shock ring (it.strong): a clearly visible intercept, not a faint puff
        const ring2 = new T.Sprite(
          new T.SpriteMaterial({
            map: this.ringTex,
            color: col('#ffffff'),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            blending: T.AdditiveBlending,
          }),
        );
        m.add(ring2);
        m.userData.ring2 = ring2;
      }
      root.add(m);
      this.dyn.push({ it, obj: m });
      if (it.label)
        this._label(it.label, (t) => (t > it.t0 ? it.pos : null), null, null, it.labelDy ?? 0, it.labelDx ?? 0, it.short, it.opt, { hue: it.color });
    } else if (it.kind === 'glare') {
      // Dazzle glare: a bright core with four diffraction spikes, pulsing; sized in screen px by _fitModels
      const m = new T.Sprite(
        new T.SpriteMaterial({
          map: (this.glareTex ||= new T.CanvasTexture(glareCanvas())),
          color: col(it.color),
          transparent: true,
          opacity: 0.5, // translucent: the craft's shape stays visible through the flare
          depthWrite: false,
          depthTest: false,
          blending: T.AdditiveBlending,
        }),
      );
      m.visible = false;
      root.add(m);
      this.dyn.push({ it, obj: m });
    } else if (it.kind === 'status') {
      this.status = it;
    }
  },
};

// Adds this file's methods to GLHost.prototype. Called once from app.js, after gl-host.js is loaded and before any scene opens.
export function installGLItems(GLHost) {
  Object.assign(GLHost.prototype, methods, modelMethods, earthMethods, spaceMethods);
}
