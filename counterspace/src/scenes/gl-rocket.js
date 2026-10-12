// ============================================================================
// scenes/gl-rocket.js: GLHost mixin: the rocket / interceptor models and everything that makes one read as a vehicle in flight:
// layered exhaust plume (core + outer, shock diamonds in dense air, expanding in vacuum), ignition flash, burnout cut-off, a persistent smoke trail
// (atmosphere only), attitude along the velocity vector (vertical rise, pitch-over, settle and thrust-vector wobble), nose heating, stage separation,
// air-launch drop and the vertical-launch cold-gas pop.
// Everything is a pure function of the scene time t (nothing is simulated frame to frame), so scrubbing, pausing and the print stills all agree.
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// The vehicles and their trajectories are drawn for illustration: sim.js gives each rocket item an `fx` descriptor (ignition time, flight end, burn fraction).
// ============================================================================
import { GEO_ALT, IS_PHONE, clamp01, occluded, smooth } from './core.js';
import { Kit } from './gl-models.js';

const PI = Math.PI;
// Inverse of the compressed radial scale (core.js rAlt): the altitude, in km, that a radius from the Earth's centre stands for.
const invAlt = (r) => (r <= 1 ? 0 : Math.pow((r - 1) / 1.4, 1 / 0.45) * GEO_ALT);
const SCALE_H = 14; // km: air density falls to 1/e over this height in the pictures (a little taller than real, so the dense-air look lasts a visible moment)
const rhoAt = (alt) => Math.exp(-Math.max(0, alt) / SCALE_H);
const SMOKE_TOP = 40; // km: the smoke trail exists only below this illustrative altitude and has faded out entirely a little above it
const ILL = 0.4; // illustrative altitude = 0.4 x the altitude the picture's squeezed scale stands for (so the air thins out by about the Karman line, 100 km)
const RAMP_UP = 0.005; // t: motor thrust builds over this
const RAMP_DOWN = 0.008; // t: and dies away over this at burnout
const FLASH_T = 0.012; // t: the ignition flash lasts this long

// ---------------------------------------------------------------- shaders
const PLUME_VS = `attribute float aA; attribute float aTh;
uniform float uLen; uniform float uW; uniform float uExp; uniform vec2 uWob;
varying float vA; varying float vTh; varying vec3 vN; varying vec3 vV;
float prof(float a){
  float dense = (0.58 + 0.42 * smoothstep(0.0, 0.1, a)) * (1.0 - 0.7 * pow(a, 1.25));
  float vac = 0.62 + 2.3 * pow(a, 0.8);
  return mix(dense, vac, uExp);
}
void main(){
  float a = aA; float r = uW * prof(a);
  vec3 p = vec3(cos(aTh) * r + uWob.x * a * uLen, sin(aTh) * r + uWob.y * a * uLen, -a * uLen);
  vN = normalize(normalMatrix * vec3(cos(aTh), sin(aTh), 0.25));
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vV = normalize(-mv.xyz);
  vA = a; vTh = aTh; gl_Position = projectionMatrix * mv;
}`;
const PLUME_FS = `uniform vec3 uC0; uniform vec3 uC1; uniform float uInt; uniform float uTime; uniform float uDia; uniform float uDiaN; uniform float uFall;
uniform float uFlick; uniform float uExp; uniform float uSeed; uniform float uTurb;
varying float vA; varying float vTh; varying vec3 vN; varying vec3 vV;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  float edge = pow(ndv, mix(1.5, 0.85, uExp));
  float a = vA;
  float cs = cos(vTh); float sn = sin(vTh);
  float turb = 0.5 * vn(vec2(a * 6.0 - uTime * 7.0, cs * 1.7 + uSeed)) + 0.5 * vn(vec2(a * 12.0 - uTime * 11.0, sn * 1.7 + 9.0 + uSeed));
  float I = uInt * edge * pow(max(1.0 - a, 0.0), uFall) * smoothstep(0.0, 0.03, a);
  I *= (1.0 - uTurb) + uTurb * (0.45 + 1.1 * turb) * (0.55 + 0.9 * a);
  float dm = pow(0.5 + 0.5 * cos(a * uDiaN * 6.2832 - 1.3), 3.0);
  I *= 1.0 + uDia * dm * (1.0 - 0.6 * a);
  I *= 1.0 + uFlick * (h(vec2(floor(uTime * 26.0), uSeed)) - 0.5);
  vec3 col = mix(uC0, uC1, smoothstep(0.0, 0.85, a));
  gl_FragColor = vec4(col, clamp(I, 0.0, 1.0));
}`;
const SMOKE_VS = `attribute float aAl; attribute float aSz; attribute float aSeed; attribute float aWarm;
uniform float uScale; uniform float uMin; uniform float uMax; uniform vec3 uSun;
varying float vAl; varying float vSeed; varying vec3 vP; varying vec2 vSun2; varying float vWarm;
void main(){
  vAl = aAl; vSeed = aSeed; vWarm = aWarm; vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  vSun2 = normalize((viewMatrix * vec4(uSun, 0.0)).xy + vec2(1e-5));
  float dz = max(-mv.z, 0.1);
  gl_PointSize = aAl > 0.002 ? clamp(aSz * uScale / dz, uMin, uMax) : 0.0;
}`;
const SMOKE_FS = `uniform vec3 uSun; varying float vAl; varying float vSeed; varying vec3 vP; varying vec2 vSun2; varying float vWarm;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0;
  float n = 0.6 * vn(d * 3.2 + vSeed * 17.0) + 0.4 * vn(d * 7.5 + vSeed * 5.0);
  float f = smoothstep(1.0, 0.2, r + (n - 0.5) * 0.7);
  float alpha = vAl * f * (0.7 + 0.6 * n);
  float lit = smoothstep(-0.2, 0.35, dot(normalize(vP), uSun));
  vec3 col = mix(vec3(0.16, 0.19, 0.28), vec3(0.97, 0.95, 0.92), lit);
  float s = dot(vec2(d.x, -d.y), vSun2);
  col *= 0.8 + 0.4 * clamp(0.5 + s * 1.6, 0.0, 1.0);
  col = mix(col, vec3(1.0, 0.62, 0.3), 0.55 * vWarm);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.85));
}`;

// ---------------------------------------------------------------- geometry helpers
// A body of revolution along +z (nose at +z) with per-vertex shading: profile points are [radius, z, shade].
function lathe(T, prof, segs = 20) {
  const g = new T.LatheGeometry(
    prof.map((p) => new T.Vector2(p[0], p[1])),
    segs,
  );
  const n = prof.length,
    col = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i <= segs; i++)
    for (let j = 0; j < n; j++) {
      const k = (i * n + j) * 3,
        s = prof[j][2] ?? 1;
      col[k] = col[k + 1] = col[k + 2] = s;
    }
  g.setAttribute('color', new T.BufferAttribute(col, 3));
  return g;
}
// Tangent-ogive nose: radius at distance x from the tip, for base radius R and length L.
const ogive = (R, L, x) => {
  const rho = (R * R + L * L) / (2 * R);
  return Math.max(0, Math.sqrt(Math.max(0, rho * rho - (L - x) * (L - x))) + R - rho);
};
// Straight body with thin panel lines (a darker groove ring) at the given z positions.
function bodyProfile(r0, r1, z0, z1, lines = [], shade = 1, groove = 0.7) {
  const pts = [[r0, z0, shade]],
    at = (z) => r0 + ((r1 - r0) * (z - z0)) / (z1 - z0);
  for (const z of lines) {
    const r = at(z);
    pts.push([at(z - 0.0003), z - 0.0003, shade], [r * 0.988, z - 0.00012, shade * groove], [r * 0.988, z + 0.00012, shade * groove], [at(z + 0.0003), z + 0.0003, shade]);
  }
  pts.push([r1, z1, shade]);
  return pts;
}

export const rocketMethods = {
  // ------------------------------------------------------------ models
  // Two vehicles, nose along +z, about 0.062 long: the default (a white stage, a coloured ogive nose and four swept fins) and `slim` (a slender booster
  // under a narrower second body, an interstage taper, a dark nose and small dark fins). Both are built as an upper and a lower part so a scene that
  // states a separation (cfg rocket.stage) can drop the lower part away; the exhaust rig sits at the nozzle and moves to the upper nozzle after it.
  _rocketModel(color, style) {
    const T = this.T,
      slim = style === 'slim',
      Kl = new Kit(T),
      Ku = new Kit(T),
      white = this._mat(slim ? 0xd6dae2 : 0xf2f4f9, { metalness: 0.3, roughness: 0.36, vertexColors: true }),
      whiteU = this._mat(slim ? 0xd6dae2 : 0xf2f4f9, { metalness: 0.3, roughness: 0.36, vertexColors: true }),
      tipCol = new T.Color(color).lerp(new T.Color(0xffffff), 0.1),
      nose = this._mat(slim ? 0x3a4050 : tipCol.getHex(), { metalness: slim ? 0.55 : 0.2, roughness: slim ? 0.4 : 0.4, vertexColors: true, emissive: 0xff5a1c, emissiveIntensity: 0 }),
      dark = this._mat(0x2a303d, { metalness: 0.6, roughness: 0.45, vertexColors: true }),
      darkU = this._mat(0x2a303d, { metalness: 0.6, roughness: 0.45, vertexColors: true }),
      fin = slim ? this._mat(0x262b36, { metalness: 0.6, roughness: 0.45 }) : this._mat(tipCol.getHex(), { metalness: 0.2, roughness: 0.4 }),
      rx = PI / 2;
    // dimensions (z along the axis): nozzle exit, body, split between the lower and upper part, nose tip
    const D = slim
      ? { zN: -0.0275, zB: -0.0245, zS: -0.0005, zI: 0.0035, zT: 0.0215, zNose: 0.034, rL: 0.0028, rU: 0.0021 }
      : { zN: -0.0255, zB: -0.0185, zS: -0.0045, zI: -0.0045, zT: 0.0185, zNose: 0.034, rL: 0.0042, rU: 0.0042 };
    // lower part: nozzle bell, thrust skirt, booster body with panel lines and a dark band, fins
    Kl.geo(dark, lathe(T, [[D.rL * 0.58, D.zN, 0.7], [D.rL * 0.6, D.zN + 0.0004, 0.55], [D.rL * 0.4, D.zN + 0.0042, 0.5], [D.rL * 0.36, D.zN + 0.0048, 0.5]], 16), 0, 0, 0, rx);
    Kl.geo(dark, lathe(T, [[D.rL * 0.8, D.zB - 0.0035, 0.8], [D.rL * 1.0, D.zB, 0.9]], 18), 0, 0, 0, rx);
    const linesL = slim ? [-0.0185, -0.0125, -0.0065] : [-0.0125, -0.0085];
    Kl.geo(white, lathe(T, bodyProfile(D.rL, D.rL, D.zB, D.zS, linesL), 22), 0, 0, 0, rx);
    if (slim) Kl.geo(dark, lathe(T, [[D.rL * 1.02, D.zS - 0.0016, 0.9], [D.rL * 1.02, D.zS, 0.9]], 20), 0, 0, 0, rx);
    // upper part: interstage taper (slim), body, nose
    if (slim) {
      Ku.geo(whiteU, lathe(T, bodyProfile(D.rL, D.rU, D.zS, D.zI, []), 20), 0, 0, 0, rx);
      Ku.geo(darkU, lathe(T, [[D.rU * 0.55, D.zS - 0.0013, 0.55], [D.rU * 0.9, D.zS - 0.0004, 0.7]], 14), 0, 0, 0, rx); // the upper stage's own nozzle
      Ku.geo(whiteU, lathe(T, bodyProfile(D.rU, D.rU, D.zI, D.zT, [0.009, 0.0145]), 20), 0, 0, 0, rx);
    } else {
      Ku.geo(whiteU, lathe(T, bodyProfile(D.rU, D.rU, D.zS, D.zT, [0.0, 0.0065, 0.0135]), 22), 0, 0, 0, rx);
      Ku.geo(darkU, lathe(T, [[D.rU * 1.02, 0.0073, 0.85], [D.rU * 1.02, 0.0085, 0.85]], 20), 0, 0, 0, rx); // the dark band
      Ku.geo(darkU, lathe(T, [[D.rU * 0.55, D.zS - 0.0012, 0.55], [D.rU * 0.9, D.zS - 0.0003, 0.7]], 14), 0, 0, 0, rx);
    }
    const L = D.zNose - D.zT,
      np = [];
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * L; // from the tip
      np.push([Math.max(0.00004, ogive(D.rU, L, x)), D.zNose - x, i < 2 ? 0.55 : 1]); // the last bit of the tip is darker (heat shield)
    }
    np.reverse(); // base first, tip last
    Ku.geo(nose, lathe(T, np, 22), 0, 0, 0, rx);
    // swept fins (a thin extruded trapezoid): radial, axial; four around the body
    const finGeo = (r0, r1, zTE, zLE0, zLE1, th) => {
      const sh = new T.Shape();
      sh.moveTo(r0, zTE);
      sh.lineTo(r1, zTE);
      sh.lineTo(r1, zLE1);
      sh.lineTo(r0, zLE0);
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false });
      g.translate(0, 0, -th / 2);
      g.rotateX(PI / 2); // radial stays x, axial (shape y) becomes z, thickness becomes y
      return g;
    };
    for (let k = 0; k < 4; k++) {
      const a = (k * PI) / 2;
      if (slim) Kl.geo(fin, finGeo(D.rL * 0.9, 0.0062, -0.0262, -0.016, -0.0222, 0.0005), 0, 0, 0, 0, 0, a);
      else Kl.geo(fin, finGeo(D.rL * 0.9, 0.0112, -0.0182, -0.0072, -0.0128, 0.0007), 0, 0, 0, 0, 0, a);
    }
    const lower = Kl.build(),
      upper = Ku.build(),
      g = new T.Group();
    for (const m of [white, dark, fin]) m.transparent = true; // the lower part fades out as it falls away after a separation
    g.add(upper, lower);
    // ---- exhaust rig at the nozzle: outer plume, bright core, a glow and an ignition flash
    const rig = new T.Group(),
      mk = (core) => {
        const m = new T.ShaderMaterial({
          vertexShader: PLUME_VS,
          fragmentShader: PLUME_FS,
          transparent: true,
          depthWrite: false,
          side: T.DoubleSide,
          blending: T.AdditiveBlending,
          uniforms: {
            uLen: { value: 0.05 },
            uW: { value: 0.003 },
            uExp: { value: 0 },
            uWob: { value: new T.Vector2() },
            uC0: { value: new T.Color(core ? 0xfff6d2 : 0xff9a3c) },
            uC1: { value: new T.Color(core ? 0xffc66a : 0xe2431a) },
            uInt: { value: 1 },
            uTime: { value: 0 },
            uDia: { value: 0 },
            uDiaN: { value: 4.5 },
            uFall: { value: core ? 1.3 : 1.1 },
            uFlick: { value: 0.35 },
            uSeed: { value: core ? 3.1 : 0.7 },
            uTurb: { value: core ? 0.5 : 0.85 },
          },
        });
        const mesh = new T.Mesh(this._plumeGeo(), m);
        mesh.frustumCulled = false;
        mesh.renderOrder = 4;
        return mesh;
      },
      outer = mk(false),
      core = mk(true),
      spr = (c, op) => {
        const s = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: c, transparent: true, opacity: op, depthWrite: false, depthTest: false, blending: T.AdditiveBlending })); // no depth test: the surface never cuts a glow in half; _rocketFrame hides them while the Earth is in the way
        s.renderOrder = 5;
        return s;
      },
      glow = spr(0xffb060, 0.8),
      flash = spr(0xfff0c8, 0);
    rig.add(outer, core, glow, flash);
    rig.position.z = D.zN;
    g.add(rig);
    // nose heating: a faint glow at the tip, driven with the nose material's emissive
    const heat = spr(0xff8a40, 0);
    heat.position.z = D.zNose - 0.001;
    g.add(heat);
    // a puff (gas at a separation, steam at a cold launch) that rides the rig's position
    const puff = spr(0xe9edf6, 0);
    g.add(puff);
    g.userData.sat = true;
    g.userData.body = lower.userData.meshes.get(white);
    g.userData.rk = { D, slim, lower, upper, rig, outer, core, glow, flash, heat, puff, nose, lowerMats: [white, dark, fin] };
    Object.assign(g.userData, { span: 0.0615, minPx: 30, maxPx: 52 });
    return g;
  },
  // Open tube along -z: aA runs 0 at the nozzle to 1 at the plume's tip, aTh is the angle round the axis (the shader turns them into a plume).
  _plumeGeo() {
    const T = this.T;
    if (this._pg) return this._pg;
    const SA = 14,
      SR = 16,
      pos = new Float32Array((SA + 1) * (SR + 1) * 3),
      aA = new Float32Array((SA + 1) * (SR + 1)),
      aTh = new Float32Array((SA + 1) * (SR + 1)),
      idx = [];
    for (let i = 0; i <= SA; i++)
      for (let j = 0; j <= SR; j++) {
        const k = i * (SR + 1) + j,
          a = Math.pow(i / SA, 1.25),
          th = (j / SR) * PI * 2;
        pos.set([Math.cos(th), Math.sin(th), -a], k * 3);
        aA[k] = a;
        aTh[k] = th;
        if (i < SA && j < SR) {
          const b = k + SR + 1;
          idx.push(k, b, k + 1, k + 1, b, b + 1);
        }
      }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('aA', new T.BufferAttribute(aA, 1));
    g.setAttribute('aTh', new T.BufferAttribute(aTh, 1));
    g.setIndex(idx);
    this._pg = g;
    return g;
  },
  // ------------------------------------------------------------ set-up (called once per rocket item, after its model exists)
  _rocketInit(it, obj, root) {
    const T = this.T,
      fx = it.fx,
      t0 = fx.t0,
      t1 = fx.t1,
      rk = obj.userData.rk,
      p0 = it.pos(t0 + 1e-4) || it.pos(t0 + 0.004);
    if (!p0 || !rk) return;
    const r0 = Math.hypot(...p0);
    const rec = {
      it,
      obj,
      rk,
      fx,
      r0,
      base: invAlt(r0),
      a0: fx.alt0 ?? 0,
      burnEnd: t0 + (fx.burn ?? 0.5) * (t1 - t0),
      popT: fx.cold ? 0.012 : 0,
      f: 1,
      up0: new T.Vector3(...p0).normalize(),
      lastDir: new T.Vector3(0, 0, 1),
      q0: new T.Quaternion(),
      v1: new T.Vector3(),
      v2: new T.Vector3(),
      v3: new T.Vector3(),
    };
    // top speed along the path (the nose heating is relative to it) and the time the vehicle climbs out of the smoke altitude
    let vmax = 1e-6,
      tSmoke = t1;
    const N = 80;
    for (let k = 0; k < N; k++) {
      const ta = t0 + ((t1 - t0) * k) / N,
        tb = ta + (t1 - t0) / N,
        a = it.pos(ta),
        b = it.pos(tb);
      if (a && b) vmax = Math.max(vmax, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / (tb - ta));
    }
    for (let k = 0; k <= 240; k++) {
      const ta = t0 + ((t1 - t0) * k) / 240,
        a = it.pos(Math.max(ta, t0 + 1e-4));
      if (a && this._rocketAlt(rec, Math.hypot(...a)) > SMOKE_TOP + 5) {
        tSmoke = ta;
        break;
      }
    }
    rec.vmax = vmax;
    rec.tSmoke = Math.min(tSmoke, rec.burnEnd);
    // burn segments (ignition, burnout); a stage splits the burn in two
    const st = fx.stage;
    rec.burns = [[t0 + rec.popT, st ? t0 + st.s * (t1 - t0) - 0.004 : rec.burnEnd]];
    if (st) {
      rec.tSep = t0 + st.s * (t1 - t0);
      rec.burns.push([rec.tSep + (st.gap ?? 0.012), rec.burnEnd]);
    }
    // the smoke trail: soft billboards at emission times along the part of the flight inside the atmosphere, aged and faded from the scene time
    const K = IS_PHONE ? 36 : 56,
      g = new T.BufferGeometry(),
      seed = new Float32Array(K),
      warm = new Float32Array(K);
    for (let k = 0; k < K; k++) seed[k] = (Math.sin(k * 12.9898 + (fx.seed ?? 1) * 78.233) * 43758.5453) % 1;
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(K * 3), 3));
    g.setAttribute('aAl', new T.BufferAttribute(new Float32Array(K), 1));
    g.setAttribute('aSz', new T.BufferAttribute(new Float32Array(K), 1));
    g.setAttribute('aSeed', new T.BufferAttribute(Float32Array.from(seed, Math.abs), 1));
    g.setAttribute('aWarm', new T.BufferAttribute(warm, 1));
    const m = new T.ShaderMaterial({
      vertexShader: SMOKE_VS,
      fragmentShader: SMOKE_FS,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uScale: { value: 800 },
        uMin: { value: 0 },
        uMax: { value: 240 },
        uD0: { value: 3 },
        uSun: { value: new T.Vector3(...this.sunDir) },
      },
    });
    m.userData = { minPx: 0, maxPx: 240 };
    (this.ptMats ||= []).push(m);
    const pts = new T.Points(g, m);
    pts.frustumCulled = false;
    pts.renderOrder = 3;
    root.add(pts);
    rec.smoke = { pts, K, g, seed: Float32Array.from(seed, Math.abs) };
    obj.userData.rec = rec;
    (this._rkt ||= []).push(rec);
  },
  // Illustrative altitude (km) at a radius from the Earth's centre: the launch altitude plus the climb the squeezed picture stands for, scaled by ILL.
  _rocketAlt(rec, r) {
    return (rec.a0 + Math.max(0, invAlt(r) - rec.base)) * ILL;
  },
  // ------------------------------------------------------------ state at time t (shared by the pose, the plume and the smoke)
  _rocketState(rec, t) {
    const fx = rec.fx,
      p = rec.it.pos(t);
    const r = p ? Math.hypot(...p) : rec.r0;
    const alt = this._rocketAlt(rec, r),
      rho = rhoAt(alt);
    let thr = 0,
      lastIg = -1;
    for (const [a, b] of rec.burns) {
      if (t < a || t > b) continue;
      thr = Math.max(thr, clamp01((t - a) / RAMP_UP) * clamp01((b - t) / RAMP_DOWN));
      lastIg = a;
    }
    // ignition flashes: the first ignition and, with a stage, the upper stage's
    let flash = 0;
    for (const [a] of rec.burns) if (t >= a && t < a + FLASH_T * 2.5) flash = Math.max(flash, Math.exp(-(t - a) / (FLASH_T * 0.45)) * clamp01((t - a) / 0.0012 + 0.35));
    return { p, alt, rho, thr, flash, lastIg, sec: (t - fx.t0) * this.sim.cfg.duration };
  },
  // ------------------------------------------------------------ pose: position is already set by the dyn loop; this orients the vehicle
  _rocketPose(it, obj, t, p) {
    const rec = obj.userData.rec;
    if (!rec) return false;
    const T = this.T,
      fx = rec.fx,
      d = 0.008,
      pa = it.pos(t - d) || p,
      pb = it.pos(t + d) || p,
      vel = rec.v1.set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]);
    const speed = vel.length() / (2 * d);
    if (vel.lengthSq() > 1e-14) rec.lastDir.copy(vel).normalize();
    const dir = rec.v2.copy(rec.lastDir),
      up = rec.v3.set(p[0], p[1], p[2]).normalize();
    rec.speed = speed;
    // vertical rise, then the pitch-over onto the path: the hold is a short fraction of the flight
    const span = Math.max(1e-4, fx.t1 - fx.t0),
      tau = t - fx.t0,
      pitchT = Math.max(0.012, 0.12 * span);
    if (!fx.air && tau < pitchT * 1.4) {
      const w = smooth((tau - pitchT * 0.35) / pitchT);
      dir.multiplyScalar(w).addScaledVector(up, 1 - w);
      if (dir.lengthSq() < 1e-10) dir.copy(up);
      dir.normalize();
    }
    // attitude settle after ignition and a few tenths of a degree of thrust-vector wobble early in the burn
    const sec = Math.max(0, tau * this.sim.cfg.duration),
      st = this._rocketState(rec, t),
      on = tau >= 0 ? 1 : 0;
    const settle = 0.011 * Math.exp(-sec / 0.45) * Math.cos(PI * 2 * 1.3 * sec),
      wob = 0.0062 * Math.exp(-sec / 1.6) * Math.sin(PI * 2 * 2.6 * sec) * (0.3 + 0.7 * st.thr),
      wx = (settle + wob) * on,
      wy = (0.6 * settle - 0.8 * wob) * on;
    rec.wob = [wx, wy];
    // basis: z along the flight direction, x across it (level with the local horizon), y completes
    const x = new T.Vector3().crossVectors(up, dir);
    if (x.lengthSq() < 1e-8) x.set(1, 0, 0).cross(dir);
    x.normalize();
    const y = new T.Vector3().crossVectors(dir, x);
    obj.quaternion.setFromRotationMatrix((rec.m4 ||= new T.Matrix4()).makeBasis(x, y, dir));
    // a small tilt from the wobble, about the body's own axes
    rec.q0.setFromEuler((rec.e ||= new T.Euler()).set(wy, wx, 0));
    obj.quaternion.multiply(rec.q0);
    obj.userData.oriented = true;
    return true;
  },
  // ------------------------------------------------------------ per frame, after the models are sized: plume, flash, heat, staging, air launch, smoke
  _rocketFrame() {
    if (!this._rkt?.length) return;
    const T = this.T,
      t = this.t,
      bh = this.renderer.domElement.height,
      k = bh / (this.el?.clientHeight || bh),
      sc = bh / (2 * Math.tan((this.camera.fov * PI) / 180 / 2)),
      cp = this.camera.position;
    for (const rec of this._rkt) {
      const { obj, rk, fx, it } = rec,
        vis = obj.visible;
      const ud = obj.userData;
      // the displayed scale is kept when the vehicle is not drawn (the smoke trail is sized from it)
      if (vis) rec.f = obj.scale.x;
      else if (!rec.fSet) {
        const p = it.pos(fx.t0 + 0.004);
        if (p) {
          const d = Math.max(0.15, Math.hypot(p[0] - cp.x, p[1] - cp.y, p[2] - cp.z)),
            px = (ud.span * ud.base * sc) / d,
            b = this._modelBoost || 1;
          rec.f = (ud.base * Math.min(Math.max(px, ud.minPx * k * b), ud.maxPx * k * b)) / px;
        }
      }
      const st = this._rocketState(rec, t),
        Lr = ud.span * rec.f; // the vehicle's drawn length (world units)
      // ---- air launch: carried under the aircraft until release, then a short free fall before the motor lights
      if (vis && fx.air) this._rocketAir(rec, st, t, Lr);
      // ---- cold launch (vertical launch from a ship): a gas pop lifts the missile out of its cell before the motor lights
      // ---- staging: the lower part drops away tumbling slowly, with a brief puff; the exhaust moves to the upper stage's nozzle
      const D = rk.D;
      let sepAge = -1;
      if (rec.tSep != null) sepAge = (t - rec.tSep) / 0.05;
      const sepNow = sepAge >= 0;
      if (rk.lower) {
        rk.lower.visible = vis && (!sepNow || sepAge < 1.7);
        if (sepNow && rk.lower.visible) {
          const u = sepAge,
            off = 0.0035 * u + 0.034 * u * u; // it coasts while the upper stage accelerates away
          rk.lower.position.set(0.0006 * u, 0.0004 * u, -off);
          rk.lower.rotation.set(0.9 * u, 0.55 * u, 0.4 * u); // slow tumble
          const fade = 1 - smooth((u - 1.1) / 0.6);
          for (const m of rk.lowerMats) m.opacity = fade;
        } else if (rk.lower.position.z !== 0) {
          rk.lower.position.set(0, 0, 0);
          rk.lower.rotation.set(0, 0, 0);
          for (const m of rk.lowerMats) m.opacity = 1;
        }
      }
      rk.rig.position.z = sepNow ? D.zS - 0.0008 : D.zN;
      rk.rig.visible = vis;
      // ---- plume
      const hide = vis && occluded([cp.x, cp.y, cp.z], [obj.position.x, obj.position.y, obj.position.z]);
      const thr = st.thr,
        e = 1 - Math.pow(st.rho, 0.55), // 0 in dense air, towards 1 in vacuum
        nozW = sepNow ? D.rU : D.rL,
        wob = rec.wob || [0, 0];
      const outerLen = (sepNow ? 0.8 : 1) * (0.026 + 0.062 * e) * (0.3 + 0.7 * thr),
        outerW = nozW * (0.62 + 0.38 * Math.sqrt(e + 0.2)) * (0.55 + 0.45 * thr);
      const tm = t * this.sim.cfg.duration,
        U = rk.outer.material.uniforms,
        C = rk.core.material.uniforms;
      U.uLen.value = outerLen;
      U.uW.value = outerW;
      U.uExp.value = e;
      U.uInt.value = (0.95 - 0.4 * e) * thr;
      U.uTime.value = tm;
      U.uDia.value = 0;
      U.uWob.value.set(wob[0] * 2.4, wob[1] * 2.4);
      C.uLen.value = outerLen * (0.5 + 0.1 * (1 - e));
      C.uW.value = outerW * (0.5 + 0.1 * (1 - e));
      C.uExp.value = e * 0.8;
      C.uInt.value = (1.25 - 0.45 * e) * thr;
      C.uTime.value = tm;
      C.uDia.value = 1.25 * (1 - smooth(e / 0.55)) * thr; // shock diamonds: first stage, dense air
      C.uDiaN.value = 4.5;
      C.uWob.value.set(wob[0] * 2.4, wob[1] * 2.4);
      rk.outer.visible = rk.core.visible = vis && thr > 0.004;
      // glow and the ignition flash (the first frames of a motor are a bright burst well beyond the plume)
      rk.glow.visible = vis && thr > 0.004 && !hide;
      rk.glow.scale.setScalar(0.013 + 0.01 * thr + 0.008 * e);
      rk.glow.material.opacity = (0.85 - 0.35 * e) * thr;
      rk.glow.position.z = -0.003;
      rk.flash.visible = vis && st.flash > 0.01 && !hide;
      rk.flash.scale.setScalar(0.016 + 0.03 * st.flash);
      rk.flash.material.opacity = Math.min(0.85, st.flash);
      rk.flash.position.z = -0.004;
      // puff: a pop of gas at the separation, a burst of steam at the cold-launch pop
      let puff = 0,
        puffZ = rk.rig.position.z + 0.002;
      if (sepNow && sepAge < 0.5) puff = Math.max(puff, (1 - sepAge / 0.5) * 0.7) * (sepAge < 0.02 ? sepAge / 0.02 : 1);
      if (fx.cold && t >= fx.t0 && t < fx.t0 + rec.popT + 0.01) puff = Math.max(puff, 0.8 * clamp01(1 - (t - fx.t0) / (rec.popT + 0.01)));
      rk.puff.visible = vis && puff > 0.01 && !hide;
      rk.puff.position.z = puffZ;
      rk.puff.scale.setScalar(0.02 + 0.05 * (1 - puff));
      rk.puff.material.opacity = puff * 0.55;
      // ---- nose heating: high speed in the dense part of the atmosphere
      const vrel = (rec.speed || 0) / rec.vmax,
        heat = 0.7 * clamp01(Math.sqrt(st.rho) * vrel * vrel * vrel * 1.1) * clamp01((st.alt - 7) / 9);
      rk.nose.emissiveIntensity = heat * 1.4;
      rk.heat.visible = vis && heat > 0.04 && !hide;
      rk.heat.material.opacity = heat * 0.7;
      rk.heat.scale.setScalar(0.014 + 0.026 * heat);
      this._smokeFrame(rec, t, st, Lr, vis);
    }
  },
  // Carried under the aircraft until release (it.fx.air: the aircraft item), then released: a free fall of a short span before the motor lights.
  _rocketAir(rec, st, t, Lr) {
    const fx = rec.fx,
      T = this.T,
      obj = rec.obj,
      ac = fx.air.it,
      acObj = this.dyn.find((x) => x.it === ac)?.obj;
    const tau = (t - fx.t0) / Math.max(1e-4, fx.air.drop ?? 0.014),
      p = rec.it.pos(t);
    if (!acObj || !p) return;
    const apos = ac.pos(Math.min(t, fx.t0)) || p,
      upv = rec.v3.set(apos[0], apos[1], apos[2]).normalize();
    // the shift of the missile from where the path puts it: under the aircraft at first (a pylon), dropping away at release, then back onto the path
    let carry = 0.5;
    if (tau >= 0 && tau < 1) carry = 0.5 + 1.6 * tau * tau;
    else if (tau >= 1) carry = 2.1 * (1 - smooth((tau - 1) / 3.2));
    const base = tau < 0 ? apos : p;
    obj.position.set(base[0], base[1], base[2]).addScaledVector(upv, -carry * Lr);
    // a released missile is smaller than the carrier: kept to 0.7 of its drawn size until it drops clear
    obj.scale.multiplyScalar(0.7 + 0.3 * smooth(tau / 1.5));
    if (tau < 0) obj.quaternion.copy(acObj.quaternion);
    else {
      const qa = rec.q1 || (rec.q1 = new T.Quaternion());
      qa.copy(acObj.quaternion);
      qa.multiply(rec.q0.setFromAxisAngle(rec.v1.set(1, 0, 0), 0.2 * Math.min(1, tau))); // nose dips as it falls
      obj.quaternion.copy((rec.q2 ||= new T.Quaternion()).copy(qa).slerp(rec.q3 ? rec.q3.copy(obj.quaternion) : (rec.q3 = obj.quaternion.clone()), smooth((tau - 0.9) / 1.6)));
    }
  },
  // ------------------------------------------------------------ smoke trail
  _smokeFrame(rec, t, st, Lr, vis) {
    const T = this.T,
      fx = rec.fx,
      S = rec.smoke,
      pos = S.g.attributes.position.array,
      al = S.g.attributes.aAl.array,
      sz = S.g.attributes.aSz.array,
      wm = S.g.attributes.aWarm.array,
      it = rec.it,
      t0 = fx.t0 + rec.popT * 0.4,
      tE = Math.max(t0 + 1e-4, rec.tSmoke),
      TA = 0.2, // e-folding age of the smoke (scene time): the trail persists through the rest of the flight and fades with age
      wind = (rec.wind ||= new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), rec.up0).normalize()),
      bodyD = 0.0084 * rec.f * (rec.rk.slim ? 0.62 : 1); // the vehicle's drawn diameter
    let any = false;
    const pa = it.pos(t0 + 1e-4),
      pe = it.pos(tE),
      spacing = pa && pe ? Math.max(1e-4, Math.hypot(pe[0] - pa[0], pe[1] - pa[1], pe[2] - pa[2]) / S.K) : 0.002;
    for (let k = 0; k < S.K; k++) {
      const te = t0 + ((tE - t0) * (k + 0.5)) / S.K,
        age = t - te;
      if (age <= 0 || age > 1.3) {
        al[k] = 0;
        continue;
      }
      const a = it.pos(te),
        b = it.pos(Math.min(te + 0.004, fx.t1)) || a;
      if (!a) {
        al[k] = 0;
        continue;
      }
      const alt = this._rocketAlt(rec, Math.hypot(...a)),
        rho = rhoAt(alt);
      const fadeAlt = 1 - smooth((alt - SMOKE_TOP * 0.55) / (SMOKE_TOP * 0.9 - SMOKE_TOP * 0.55)); // gone above about 40 km
      // behind the nozzle, then drifting with a fixed wind and billowing wider with age
      const gr = 1 - Math.exp(-age / 0.07),
        ph = Math.sin(k * 7.3 + 1.7),
        near = Math.exp(-(te - fx.t0) / 0.014); // the cloud at the pad / the launch point
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        dz = b[2] - a[2],
        dl = Math.hypot(dx, dy, dz) || 1,
        back = 0.45 * Lr;
      const wl = 0.7 * Lr * gr + 0.06 * Lr * ph; // wind drift
      const lat = near * gr * 0.6 * Lr * (S.seed[k] - 0.5) * 2; // the pad cloud spreads sideways
      pos[3 * k] = a[0] - (dx / dl) * back + wind.x * (wl + lat);
      pos[3 * k + 1] = a[1] - (dy / dl) * back + wind.y * (wl + lat);
      pos[3 * k + 2] = a[2] - (dz / dl) * back + wind.z * (wl + lat);
      const spread = 1 + 2.4 * gr + 1.1 * near * (0.3 + gr);
      sz[k] = bodyD * 1.7 * spread;
      // overlapping soft discs add up: each one carries a share of the opacity that keeps the column's density about constant whatever its length
      const dense = 0.3 + 0.7 * Math.sqrt(rho); // thinner trail in thinner air
      al[k] = Math.min(0.72, (2.2 * spacing) / sz[k]) * dense * fadeAlt * Math.exp(-age / TA) * clamp01(age / 0.003) * (rec.fx.cold && te < fx.t0 + rec.popT ? 1.15 : 1);
      wm[k] = Math.exp(-age / 0.012) * 0.8;
      if (al[k] > 0.003) any = true;
    }
    S.pts.visible = any;
    S.g.attributes.position.needsUpdate = S.g.attributes.aAl.needsUpdate = S.g.attributes.aSz.needsUpdate = S.g.attributes.aWarm.needsUpdate = true;
  },
};
