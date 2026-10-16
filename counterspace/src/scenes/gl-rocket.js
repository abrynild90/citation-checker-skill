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
const HEAT_TOP = 40; // km: no nose heating at or above this illustrative altitude (the air is too thin)
const SMOKE_TOP = 40; // km: the smoke trail exists only below this illustrative altitude and has faded out entirely a little above it
const ILL = 0.4; // illustrative altitude = 0.4 x the altitude the picture's squeezed scale stands for (so the air thins out by about the Karman line, 100 km)
const RAMP_UP = 0.005; // t: motor thrust builds over this
const RAMP_DOWN = 0.008; // t: and dies away over this at burnout
const COAST_RATE = 62; // rad per unit of scene time (3.5 degrees per 0.001): the fastest the nose turns in the coast
const PLUME_FLOOR = 1.002; // Earth radii: the exhaust is cut where it meets the surface
const AIR_FLOOR = 1.022; // Earth radii: an air-launched missile is kept at least this far from the Earth's centre (the globe's surface is at 1)
const FLASH_T = 0.012; // t: the ignition flash lasts this long
const SEP_AGE = 0.05; // t: the unit of the age of a stage separation (the lower stage drifts clear in the first fifth of it, 1% of the scene, and is gone by 1.7 of it)

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
  col *= 0.6 + 0.72 * clamp(0.5 + s * 1.9, 0.0, 1.0); // a sun-lit side and a shaded side on every puff, so the column has volume
  col = mix(col, vec3(1.0, 0.62, 0.3), 0.55 * vWarm);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.85));
}`;

// A thin soft ring (a highlight round a vehicle that waits to launch). Drawn once, in memory.
let ringCv = null;
function ringCanvas() {
  if (ringCv) return ringCv;
  const n = 128,
    c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'),
    gr = g.createRadialGradient(n / 2, n / 2, n * 0.4, n / 2, n / 2, n * 0.5);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.7, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, n, n);
  ringCv = c;
  return c;
}

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
// Straight body with thin panel lines (a darker groove ring) at the given z positions. grad [a, b]: the shade runs from a (at z0) to b (at z1), e.g. sooty
// near the engines and clean above.
function bodyProfile(r0, r1, z0, z1, lines = [], shade = 1, groove = 0.7, grad = [1, 1]) {
  const gs = (z) => shade * (grad[0] + ((grad[1] - grad[0]) * (z - z0)) / (z1 - z0)),
    pts = [[r0, z0, gs(z0)]],
    at = (z) => r0 + ((r1 - r0) * (z - z0)) / (z1 - z0);
  for (const z of lines) {
    const r = at(z);
    pts.push([at(z - 0.0003), z - 0.0003, gs(z)], [r * 0.988, z - 0.00012, gs(z) * groove], [r * 0.988, z + 0.00012, gs(z) * groove], [at(z + 0.0003), z + 0.0003, gs(z)]);
  }
  pts.push([r1, z1, gs(z1)]);
  return pts;
}
// A cool rim light (sky and Earth-shine) along the silhouette of a vehicle material, so the white body keeps its edge against the dark side of the Earth and space.
// panels (opt-in): the body is also given a little life, a slightly different tone for each skin panel (rings of panels along the axis, six round it) and faint
// streaks of grime that run down from the engines' end of the vehicle (all from the model-space position: no texture to download).
function rimify(m, k = 0.5, panels = false) {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <lights_fragment_end>',
      `#include <lights_fragment_end>
      { float rimF = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
        reflectedLight.directDiffuse += vec3(0.50, 0.68, 1.0) * rimF * ${k.toFixed(2)}; }`,
    );
    if (!panels) return;
    sh.vertexShader = 'varying vec3 vOP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vOP = position;');
    sh.fragmentShader =
      `varying vec3 vOP;
      float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn2(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hh(i), hh(i + vec2(1.0, 0.0)), f.x), mix(hh(i + vec2(0.0, 1.0)), hh(i + vec2(1.0, 1.0)), f.x), f.y); }
      ` +
      sh.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        { float ang = atan(vOP.y, vOP.x);
          float pv = hh(vec2(floor(vOP.z / 0.0032), floor(ang * 0.9549 + 3.0))) - 0.5;
          float st = vn2(vec2(ang * 9.0, vOP.z * 60.0));
          float low = clamp(0.5 - vOP.z * 12.0, 0.0, 1.0);
          diffuseColor.rgb *= 1.0 + pv * 0.09 - 0.1 * st * low; }`,
      );
  };
  m.customProgramCacheKey = () => 'rkrim' + k + (panels ? 'p' : '');
  return m;
}

export const rocketMethods = {
  // ------------------------------------------------------------ models
  // Two vehicles, nose along +z, about 0.062 long: the default (a white stage, a coloured ogive nose and four swept fins) and `slim` (a slender booster
  // under a narrower second body, an interstage taper, a dark nose and small dark fins). Both are built as an upper and a lower part so a scene that
  // states a separation (cfg rocket.stage) can drop the lower part away; the exhaust rig sits at the nozzle and moves to the upper nozzle after it.
  _rocketModel(color, style) {
    const T = this.T,
      slim = style === 'slim',
      asat = style === 'asat', // the default vehicle with a small dark kill vehicle in place of the nose cone (an air-launched anti-satellite missile)
      Kl = new Kit(T),
      Ku = new Kit(T),
      white = this._mat(slim ? 0xe3e7ee : 0xf2f4f9, { metalness: 0.3, roughness: 0.36, vertexColors: true, emissive: slim ? 0x2c3342 : 0x000000 }),
      whiteU = this._mat(slim ? 0xe3e7ee : 0xf2f4f9, { metalness: 0.3, roughness: 0.36, vertexColors: true, emissive: slim ? 0x2c3342 : 0x000000 }),
      tipCol = new T.Color(color).lerp(new T.Color(0xffffff), 0.1),
      nose = this._mat(slim ? 0x566074 : tipCol.getHex(), { metalness: slim ? 0.55 : 0.2, roughness: slim ? 0.4 : 0.4, vertexColors: true, emissive: 0xff5a1c, emissiveIntensity: 0 }),
      dark = this._mat(0x2a303d, { metalness: 0.6, roughness: 0.45, vertexColors: true }),
      darkU = this._mat(0x2a303d, { metalness: 0.6, roughness: 0.45, vertexColors: true }),
      fin = slim ? this._mat(0x262b36, { metalness: 0.6, roughness: 0.45, vertexColors: true }) : this._mat(0xaab2c2, { metalness: 0.45, roughness: 0.42, vertexColors: true }), // the default vehicle: grey metal fins (only the nose carries the vehicle's colour)
      bell = this._mat(0x2a303d, { metalness: 0.6, roughness: 0.45, vertexColors: true, emissive: 0xff6a1c, emissiveIntensity: 0 }), // engine bells: they glow when the motor burns
      bellU = this._mat(0x2a303d, { metalness: 0.6, roughness: 0.45, vertexColors: true, emissive: 0xff6a1c, emissiveIntensity: 0 }),
      // slim only: an accent in the vehicle's own colour (stage stripes), so the close-up reads as a built rocket and not as one white tube
      accent = slim ? this._mat(tipCol.getHex(), { metalness: 0.3, roughness: 0.42, vertexColors: true }) : null,
      accentU = slim ? this._mat(tipCol.getHex(), { metalness: 0.3, roughness: 0.42, vertexColors: true }) : null,
      rx = PI / 2;
    // dimensions (z along the axis): nozzle exit, body, split between the lower and upper part, nose tip
    const D = slim
      ? { zN: -0.0275, zB: -0.0245, zS: -0.0005, zI: 0.0035, zT: 0.0215, zNose: 0.034, rL: 0.0028, rU: 0.0021 }
      : { zN: -0.0255, zB: -0.0185, zS: -0.0045, zI: -0.0045, zT: 0.0185, zNose: 0.0385, rL: 0.0035, rU: 0.0035 }; // slimmer and longer than before (it read as stubby, with oversized fins)
    // lower part: nozzle bell, thrust skirt, booster body with panel lines and a dark band, fins
    if (slim)
      // a flared engine bell with a bright rim, a throat and a collar where it meets the skirt
      Kl.geo(bell, lathe(T, [[D.rL * 0.84, D.zN - 0.0002, 1.0], [D.rL * 0.8, D.zN + 0.0002, 0.75], [D.rL * 0.62, D.zN + 0.002, 0.6], [D.rL * 0.45, D.zN + 0.0038, 0.5], [D.rL * 0.34, D.zN + 0.0054, 0.45], [D.rL * 0.5, D.zN + 0.0058, 0.5]], 18), 0, 0, 0, rx);
    else Kl.geo(bell, lathe(T, [[D.rL * 0.58, D.zN, 0.7], [D.rL * 0.6, D.zN + 0.0004, 0.55], [D.rL * 0.4, D.zN + 0.0042, 0.5], [D.rL * 0.36, D.zN + 0.0048, 0.5]], 16), 0, 0, 0, rx);
    Kl.geo(dark, lathe(T, [[D.rL * 0.8, D.zB - 0.0035, 0.8], [D.rL * 1.0, D.zB, 0.9]], 18), 0, 0, 0, rx);
    const linesL = slim ? [-0.0185, -0.0125, -0.0065] : [-0.0125, -0.0085];
    Kl.geo(white, lathe(T, bodyProfile(D.rL, D.rL, D.zB, D.zS, linesL, 1, 0.7, [0.6, 1.0]), 22), 0, 0, 0, rx); // sooty near the engines, clean above
    if (!slim) {
      // the spent booster is a closed cylinder: a dark interstage collar with a domed top (the upper part's own base hides it until the separation)
      Kl.geo(dark, lathe(T, [[D.rL * 1.02, D.zS - 0.0016, 0.9], [D.rL * 1.02, D.zS, 0.9], [D.rL * 0.6, D.zS + 0.0006, 0.7], [0.00006, D.zS + 0.0011, 0.6]], 20), 0, 0, 0, rx);
    }
    if (slim) {
      // the interstage: a dark ring against the upper stage and, below it, a stripe in the vehicle's colour between two thin grooves
      Kl.geo(dark, lathe(T, [[D.rL * 1.02, D.zS - 0.0016, 0.9], [D.rL * 1.02, D.zS, 0.9]], 20), 0, 0, 0, rx);
      Kl.geo(accent, lathe(T, [[D.rL * 1.025, D.zS - 0.0032, 0.95], [D.rL * 1.025, D.zS - 0.0021, 0.95]], 20), 0, 0, 0, rx);
    }
    // upper part: interstage taper (slim), body, nose
    if (slim) {
      Ku.geo(whiteU, lathe(T, bodyProfile(D.rL, D.rU, D.zS, D.zI, []), 20), 0, 0, 0, rx);
      // the upper stage's own engine bell and the dark base plate it stands on (what shows once the lower stage has dropped away)
      Ku.geo(bellU, lathe(T, [[D.rU * 0.95, D.zS - 0.0004, 0.75], [D.rU * 0.8, D.zS - 0.0012, 0.65], [D.rU * 0.62, D.zS - 0.0023, 0.55], [D.rU * 0.5, D.zS - 0.0031, 0.5]], 16), 0, 0, 0, rx);
      Ku.geo(darkU, lathe(T, [[D.rL * 1.0, D.zS + 0.0001, 0.6], [D.rU * 0.9, D.zS - 0.0004, 0.6]], 20), 0, 0, 0, rx);
      Ku.geo(whiteU, lathe(T, bodyProfile(D.rU, D.rU, D.zI, D.zT, [0.0145]), 20), 0, 0, 0, rx);
      // two stripes on the body: a dark band and one in the vehicle's colour
      Ku.geo(darkU, lathe(T, [[D.rU * 1.03, 0.0086, 0.85], [D.rU * 1.03, 0.0098, 0.85]], 20), 0, 0, 0, rx);
      Ku.geo(accentU, lathe(T, [[D.rU * 1.03, 0.0104, 0.95], [D.rU * 1.03, 0.0118, 0.95]], 20), 0, 0, 0, rx);
    } else {
      Ku.geo(whiteU, lathe(T, bodyProfile(D.rU, D.rU, D.zS, D.zT, [0.0, 0.0065, 0.0135], 1, 0.7, [0.86, 1.0]), 22), 0, 0, 0, rx);
      Ku.geo(darkU, lathe(T, [[D.rU * 1.02, 0.0073, 0.85], [D.rU * 1.02, 0.0085, 0.85]], 20), 0, 0, 0, rx); // the dark band
      Ku.geo(bellU, lathe(T, [[D.rU * 0.55, D.zS - 0.0012, 0.55], [D.rU * 0.9, D.zS - 0.0003, 0.7]], 14), 0, 0, 0, rx);
    }
    const L = D.zNose - D.zT,
      np = [];
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * L; // from the tip
      np.push([Math.max(0.00004, ogive(D.rU, L, x)), D.zNose - x, i < 2 ? 0.55 : 1]); // the last bit of the tip is darker (heat shield)
    }
    np.reverse(); // base first, tip last
    let kvG = null;
    if (asat) {
      // a short adapter in the vehicle's colour, then the kill vehicle on its own: graphite body, a white thermal band, a gold band in the vehicle's colour, a ring of
      // small divert thrusters and a blue sensor dome. It is built about its own centre (its group sits at kvz on the axis) so it can fly on alone after the separation.
      const rK = 0.0033,
        lK = 0.0125,
        Kk = new Kit(T),
        graphite = this._mat(0x2f3644, { metalness: 0.7, roughness: 0.34, vertexColors: true }),
        band = this._mat(0xeceff5, { metalness: 0.3, roughness: 0.4, vertexColors: true }),
        gold = this._mat(0xd2a54a, { metalness: 0.9, roughness: 0.32, vertexColors: true }),
        glass = this._mat(0x27418a, { metalness: 0.3, roughness: 0.5, vertexColors: true, emissive: 0x0a1630 }), // a matte sensor window, not a glossy blue ball that reads as glass in front of the target
        thr = this._mat(0x262c38, { metalness: 0.7, roughness: 0.4 });
      Ku.geo(nose, lathe(T, [[D.rU, D.zT, 0.9], [D.rU * 0.96, D.zT + 0.0004, 1], [rK * 1.1, D.zT + 0.0026, 1]], 22), 0, 0, 0, rx);
      const zc = D.zT + 0.0026 + lK / 2; // the kill vehicle's centre
      Kk.geo(graphite, lathe(T, [[rK, -lK / 2, 0.8], [rK, lK / 2 - 0.0006, 1]], 20), 0, 0, 0, rx);
      Kk.geo(band, lathe(T, [[rK * 1.04, -lK / 2 + 0.0008, 1], [rK * 1.04, -lK / 2 + 0.0019, 1]], 20), 0, 0, 0, rx);
      Kk.geo(gold, lathe(T, [[rK * 1.04, -lK / 2 + 0.0023, 1], [rK * 1.04, -lK / 2 + 0.0032, 1]], 20), 0, 0, 0, rx);
      const dp = [];
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * (PI / 2);
        dp.push([Math.max(0.00004, rK * 0.96 * Math.cos(a)), lK / 2 - 0.0006 + rK * 0.96 * Math.sin(a), 1]);
      }
      Kk.geo(glass, lathe(T, dp, 20), 0, 0, 0, rx);
      for (let k = 0; k < 6; k++) {
        const a = (k * PI) / 3;
        Kk.box(thr, 0.0006, 0.0006, 0.0013, Math.cos(a) * rK * 1.1, Math.sin(a) * rK * 1.1, 0.0004, 0, 0, a);
      }
      for (const m of [graphite, band, gold, glass, thr]) rimify(m, 0.5);
      kvG = Kk.build();
      kvG.position.z = zc;
      kvG.userData.zc = zc;
      kvG.userData.mats = [graphite, band, gold, glass, thr];
    } else Ku.geo(nose, lathe(T, np, 22), 0, 0, 0, rx);
    // swept fins: a thin extruded trapezoid with a bevelled edge, tapering in thickness from the root to the tip, with a darker edge (vertex shade: the faces
    // are light, the bevel and the rim darker), four of them in a cross around the body
    const finGeo = (r0, r1, zTE, zLE0, zLE1, th) => {
      const sh = new T.Shape();
      sh.moveTo(r0, zTE);
      sh.lineTo(r1, zTE);
      sh.lineTo(r1, zLE1);
      sh.lineTo(r0, zLE0);
      sh.closePath();
      const bv = th * 0.3,
        g = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.8, bevelOffset: 0, bevelSegments: 1 });
      g.translate(0, 0, -th / 2);
      const pos = g.attributes.position,
        nor = g.attributes.normal,
        col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const shade = Math.abs(nor.getZ(i)) > 0.95 ? 1 : 0.38; // flat faces vs the bevelled rim
        col[3 * i] = col[3 * i + 1] = col[3 * i + 2] = shade;
        pos.setZ(i, pos.getZ(i) * (1 - 0.6 * clamp01((pos.getX(i) - r0) / (r1 - r0)))); // thinner towards the tip
      }
      g.setAttribute('color', new T.BufferAttribute(col, 3));
      g.computeVertexNormals();
      g.rotateX(PI / 2); // radial stays x, axial (shape y) becomes z, thickness becomes y
      return g;
    };
    for (let k = 0; k < 4; k++) {
      const a = (k * PI) / 2;
      if (slim) Kl.geo(fin, finGeo(D.rL * 0.9, 0.0068, -0.0264, -0.0165, -0.0226, 0.0009), 0, 0, 0, 0, 0, a);
      else Kl.geo(fin, finGeo(D.rL * 0.9, 0.0076, -0.0182, -0.0092, -0.0140, 0.0010), 0, 0, 0, 0, 0, a);
    }
    for (const m of [white, whiteU, nose, dark, darkU, fin, bell, bellU, accent, accentU]) if (m) rimify(m, m === nose ? 0.4 : 0.5, m === white || m === whiteU);
    const lower = Kl.build(),
      upper = Ku.build(),
      g = new T.Group(),
      inner = new T.Group(); // everything of the vehicle; lifted along its axis when it stands on a pad (the item's own position stays on the path)
    g.add(inner);
    for (const m of slim ? [white, dark, fin, accent] : [white, dark, fin]) m.transparent = true; // the lower part fades out as it falls away after a separation
    inner.add(upper, lower);
    if (kvG) {
      // the kill vehicle rides the nose until the separation, then flies on alone (the body drops away and fades): its own group, with two cold-gas thruster puffs
      g.add(kvG);
      const bodyMats = [white, whiteU, nose, dark, darkU, fin, bell, bellU];
      for (const m of bodyMats) m.transparent = true;
      kvG.userData.bodyMats = bodyMats;
      // a soft cool glow round the vehicle once it is alone (no depth test, so the satellite never hides it)
      const halo = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: 0xa9d2ff, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
      halo.renderOrder = 5;
      halo.visible = false;
      kvG.add(halo);
      kvG.userData.halo = halo;
      kvG.userData.puffs = [-1, 1].map((sd) => {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: 0xcfe2ff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        sp.position.set(sd * 0.0044, sd * 0.0008, -0.0046);
        sp.visible = false;
        kvG.add(sp);
        return sp;
      });
    }
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
            uC0: { value: new T.Color(core ? 0xffffff : 0xffa840) },
            uC1: { value: new T.Color(core ? 0xffd678 : 0xd8381a) }, // a white-hot core fading to yellow; an orange body fading to red
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
      flash = spr(0xfff0c8, 0),
      hot = spr(0xfffbe8, 0.9), // a small white-hot disc at the nozzle exit, inside the orange glow
      sepFlash = spr(0xfff6e0, 0), // the flash of the separation charges at the interstage
      bloom = spr(0xff7a2a, 0); // a wide, faint warm halo round the whole exhaust (dense air only)
    rig.add(bloom, outer, core, glow, hot, flash);
    rig.position.z = D.zN;
    inner.add(rig);
    // nose heating: a faint glow at the tip, driven with the nose material's emissive
    const heat = spr(0xff8a40, 0);
    heat.position.z = D.zNose - 0.0015;
    inner.add(heat);
    // a thin highlight ring round the vehicle while it waits to launch (fx.waitRing)
    const ring = new T.Sprite(new T.SpriteMaterial({ map: this._gtex(ringCanvas(), () => new T.CanvasTexture(ringCanvas())), color: 0xffc78f, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    ring.renderOrder = 5;
    ring.visible = false;
    inner.add(ring);
    // a puff (gas at a separation, steam at a cold launch) that rides the rig's position
    const puff = spr(0xe9edf6, 0);
    inner.add(puff);
    // pre-launch venting (fx.vent): soft white vapour (normal blending, so it reads on a bright surface) that streams off the vehicle and gathers at the pad
    const vent = [0, 1, 2, 3, 4].map(() => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: 0xf2f5fb, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
      s.renderOrder = 5;
      s.visible = false;
      inner.add(s);
      return s;
    });
    g.userData.sat = true;
    g.userData.body = lower.userData.meshes.get(white);
    inner.add(sepFlash);
    g.userData.rk = { D, slim, kv: kvG, inner, lower, upper, rig, outer, core, glow, flash, hot, bloom, sepFlash, bell, bellU, heat, puff, vent, ring, nose, lowerMats: slim ? [white, dark, fin, accent] : [white, dark, fin], allMats: [white, whiteU, nose, dark, darkU, fin, bell, bellU].concat(slim ? [accent, accentU] : []) };
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
      if (a && this._rocketAlt(rec, Math.hypot(...a)) > SMOKE_TOP * (fx.smokeTopK ?? 1) + 5) {
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
      rec.burns.push([rec.tSep + (st.gap ?? 0.016), rec.burnEnd]);
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
  // Coast attitude (after the last burnout): the nose follows the flight direction at 0.3 of the pace and never turns faster than COAST_RATE, so the reversal of
  // a straight up-and-down arc (a vertical rise and fall) is a slow tumble, not a flip. A pure function of t: the follower is stepped on a fixed grid of
  // scene time from burnout (cached per vehicle: the path never changes) and the last, partial step lands on t, so scrubbing in either direction agrees.
  _coastDir(rec, it, tb, t, p) {
    const T = this.T,
      G = 0.004,
      d = 0.008,
      c = (rec.cd ||= { dirs: [], tgt: new T.Vector3(), ax: new T.Vector3(), q: new T.Quaternion() });
    const aim = (te, out) => {
      const qa = it.pos(te - d) || p,
        qb = it.pos(te + d) || p;
      out.set(qb[0] - qa[0], qb[1] - qa[1], qb[2] - qa[2]);
      if (out.lengthSq() < 1e-14) return false;
      out.normalize();
      return true;
    };
    const turn = (a, out, max) => {
      const ang = Math.acos(Math.max(-1, Math.min(1, a.dot(c.tgt))));
      if (ang <= max) return out.copy(c.tgt);
      c.ax.crossVectors(a, c.tgt);
      if (c.ax.lengthSq() < 1e-10) c.ax.crossVectors(a, rec.up0); // a straight reversal: turn about the axis across the local vertical
      if (c.ax.lengthSq() < 1e-10) c.ax.set(1, 0, 0).cross(a);
      c.ax.normalize();
      return out.copy(a).applyQuaternion(c.q.setFromAxisAngle(c.ax, max));
    };
    if (!c.dirs.length) c.dirs.push(aim(tb, c.tgt) ? c.tgt.clone() : rec.lastDir.clone());
    const k = Math.min(Math.floor((t - tb) / G), 400);
    for (let i = c.dirs.length; i <= k; i++) {
      const prev = c.dirs[i - 1];
      c.dirs.push(aim(tb + 0.3 * i * G, c.tgt) ? turn(prev, new T.Vector3(), COAST_RATE * G) : prev.clone());
    }
    const base = c.dirs[k],
      rest = t - tb - k * G;
    if (aim(tb + 0.3 * (t - tb), c.tgt)) turn(base, rec.lastDir, COAST_RATE * Math.max(0, rest));
    else rec.lastDir.copy(base);
    return rec.lastDir;
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
    // coast: no thrust steers the vehicle, so its attitude changes slowly (it follows the flight direction at a fraction of the pace) and a pitch-over at the
    // top of the arc is a slow roll of the nose, not a flip
    const tb = rec.burns[rec.burns.length - 1][1];
    if (t > tb && !fx.follow) this._coastDir(rec, it, tb, t, p); // fx.follow (opt-in): a ballistic arc keeps the nose on the path through the coast and the fall
    else if (vel.lengthSq() > 1e-14) rec.lastDir.copy(vel).normalize();
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
  // The stage-size factor for a vehicle's pixel floor and cap: 1 up to the 1440 x 900 stage (652 px tall), then growing with it to 1.4.
  _rkStage(bh) {
    return Math.min(1.4, Math.max(1, this._stageH(bh) / 652));
  },
  _rocketFrame() {
    this._shakeA = 0; // camera vibration at lift-off (applied around the draw in render(); the labels never see it)
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
      if (vis) {
        rec.f = obj.scale.x;
        // standing on a launch pad (fx.stand): the nozzle never sinks below the plate, so the vehicle holds down until the path has climbed clear of it, then rises
        // (the vehicle is lifted inside its own group: the item's position stays on the path, whatever the camera does to the drawn size)
        if (fx.stand) {
          const need = 1.002 - rk.D.zN * obj.scale.x * 0.92;
          rec.lift = Math.max(0, need - obj.position.length()) / obj.scale.x;
        } else rec.lift = 0;
        rk.inner.position.z = rec.lift;
      } else if (!rec.fSet) {
        const p = it.pos(fx.t0 + 0.004);
        if (p) {
          const d = Math.max(0.15, Math.hypot(p[0] - cp.x, p[1] - cp.y, p[2] - cp.z)),
            px = (ud.span * ud.base * sc) / d,
            b = (this._modelBoost || 1) * this._rkStage(bh);
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
      if (rec.tSep != null) sepAge = (t - rec.tSep) / SEP_AGE;
      const sepNow = sepAge >= 0;
      if (rk.lower) {
        rk.lower.visible = vis && (!sepNow || sepAge < 1.7);
        if (sepNow && rk.lower.visible) {
          // clean separation: the two stages are collinear at the instant of separation, then the lower one drifts aft on a small relative velocity (the upper
          // one starts to accelerate away when its motor lights) and picks up a slow differential tumble about its own middle, so nothing hinges at the joint
          const u = sepAge,
            // stage.scale (opt-in): the spent lower part swells to this factor about its forward end over the first quarter of its drop-away (a far-off camera shows it as a stub)
            ss = 1 + ((fx.stage.scale ?? 1) - 1) * smooth(u / 0.25),
            sd = fx.stage.drift ?? 1, // stage.drift / stage.tumble / stage.puff (opt-in): a more visible drop-away (faster fall-back, a faster tumble, a bigger puff of gas)
            off = sd * (0.03 * u + 0.1 * u * u),
            cz = 0.5 * (D.zN + D.zS),
            e3 = rec.e3 || (rec.e3 = new T.Euler()),
            pr = rec.pr || (rec.pr = new T.Vector3()),
            tk = fx.stage.tumble ?? 1;
          e3.set(0.8 * tk * u * u, 0.5 * tk * u * u, 0.36 * tk * u * u);
          pr.set(0, 0, ss * cz).applyEuler(e3); // the middle of the lower part, turned: the part rotates about it, not about its forward end
          rk.lower.rotation.copy(e3);
          rk.lower.scale.setScalar(ss);
          rk.lower.position.set(0.0006 * sd * u - pr.x, 0.0004 * sd * u - pr.y, D.zS + ss * (cz - D.zS) - pr.z - off);
          const fade = 1 - smooth((u - 1.1) / 0.6);
          for (const m of rk.lowerMats) m.opacity = fade;
        } else if (rk.lower.position.z !== 0) {
          rk.lower.position.set(0, 0, 0);
          rk.lower.rotation.set(0, 0, 0);
          rk.lower.scale.setScalar(1);
          for (const m of rk.lowerMats) m.opacity = 1;
        }
      }
      // fx.endFade (opt-in, scene time): after the hit the spent vehicle drifts on and fades out over this span (its disappearance is deliberate, not a cut)
      if (fx.endFade) {
        const k = clamp01((t - fx.t1) / fx.endFade),
          on = k > 0;
        if (on !== !!rec.fadeOn) {
          for (const m of rk.allMats) {
            m.transparent = on;
            m.needsUpdate = true;
            if (!on) m.opacity = 1;
          }
          rec.fadeOn = on;
        }
        if (on) for (const m of rk.allMats) m.opacity = 1 - smooth(k);
      }
      rk.rig.position.z = sepNow ? D.zS - (rk.slim ? 0.0029 : 0.0008) : D.zN;
      rk.rig.visible = vis;
      // ---- plume
      const hide = vis && occluded([cp.x, cp.y, cp.z], [obj.position.x, obj.position.y, obj.position.z]);
      const thr = st.thr,
        e = 1 - Math.pow(st.rho, 0.55), // 0 in dense air, towards 1 in vacuum
        nozW = sepNow ? D.rU : D.rL,
        wob = rec.wob || [0, 0];
      const ak = fx.air ? 1.3 : 1; // an air-launched missile is small beside its carrier: its plume and ignition flash are drawn a little larger
      // the plume never runs into the globe: its length is cut where the exhaust axis meets the surface (a vehicle standing on the pad or skimming low
      // over it shows the flame ending at the ground, not a flame buried in it)
      const pk = fx.plumeK ?? 1; // fx.plumeK (opt-in): a longer, wider, brighter exhaust for a vehicle that is small in the frame
      // lift-off (the first ~10 km of the climb, illustrative): a longer, brighter, slightly wider exhaust, flickering a little (a pure function of the scene time)
      const low = 1 - smooth(st.alt / 12),
        flick = 1 + (0.07 * Math.sin(t * this.sim.cfg.duration * 53 + fx.t0 * 90) + 0.05 * Math.sin(t * this.sim.cfg.duration * 97)) * thr;
      let outerLen = pk * ak * (sepNow ? 0.8 : 1) * (0.026 + 0.062 * e) * (0.3 + 0.7 * thr) * (1 + 0.5 * low * thr) * (1 + 0.5 * (flick - 1));
      if (thr > 0.004) {
        const sc = obj.scale.x,
          dv = rec.v1.set(0, 0, 1).applyQuaternion(obj.quaternion),
          rz = (rk.rig.position.z + (rec.lift || 0)) * sc,
          px = obj.position.x + dv.x * rz,
          py = obj.position.y + dv.y * rz,
          pz = obj.position.z + dv.z * rz,
          b = -(px * dv.x + py * dv.y + pz * dv.z), // p . (-d)
          c = px * px + py * py + pz * pz - PLUME_FLOOR * PLUME_FLOOR,
          disc = b * b - c;
        if (c < 0) outerLen = 0;
        else if (disc > 0 && -b - Math.sqrt(disc) > 0) outerLen = Math.min(outerLen, (-b - Math.sqrt(disc)) / sc);
        // fx.plumeDeck (opt-in): a rocket that climbs from a warship, drawn many times larger than life, is cut where its axis meets the ship's deck, so no flame runs on past the hull over the sea
        if (fx.plumeDeck && outerLen > 0) {
          const sh = this.dyn.find((d) => d.obj.userData.uSea)?.obj;
          if (sh) {
            const fl = Math.min(1.004 + 0.0072 * sh.scale.x, Math.hypot(px, py, pz) - 0.0008),
              c2 = px * px + py * py + pz * pz - fl * fl,
              d2 = b * b - c2;
            if (c2 > 0 && d2 > 0 && -b - Math.sqrt(d2) > 0) outerLen = Math.min(outerLen, (-b - Math.sqrt(d2)) / sc);
            else if (c2 <= 0) outerLen = Math.min(outerLen, 0.002);
          }
        }
      }
      const outerW = nozW * (1 + 0.5 * (pk - 1)) * (0.62 + 0.38 * Math.sqrt(e + 0.2)) * (0.55 + 0.45 * thr) * (1 + 0.16 * low * thr);
      const tm = t * this.sim.cfg.duration,
        U = rk.outer.material.uniforms,
        C = rk.core.material.uniforms;
      U.uLen.value = outerLen;
      U.uW.value = outerW;
      U.uExp.value = e;
      U.uInt.value = (0.95 - 0.4 * e) * thr * (1 + 0.28 * low) * flick;
      U.uTime.value = tm;
      U.uWob.value.set(wob[0] * 2.4, wob[1] * 2.4);
      C.uLen.value = outerLen * (0.52 + 0.14 * (1 - e));
      C.uW.value = outerW * (0.46 + 0.1 * (1 - e));
      C.uExp.value = e * 0.8;
      C.uInt.value = (1.5 - 0.6 * e) * thr * (1 + 0.28 * low) * flick;
      C.uTime.value = tm;
      C.uDia.value = 2.0 * (1 - smooth(e / 0.6)) * thr; // shock diamonds: first stage, dense air (bright beads along the core, fading as the air thins and the plume spreads)
      C.uDiaN.value = 5.5;
      U.uDia.value = 0.5 * (1 - smooth(e / 0.5)) * thr;
      U.uDiaN.value = 5.5;
      C.uWob.value.set(wob[0] * 2.4, wob[1] * 2.4);
      rk.outer.visible = rk.core.visible = vis && thr > 0.004;
      // lift-off rumble: a low tremor that builds over the first ~0.15 s after ignition, holds for about half a second while the motor burns in the thick of the air and
      // fades out by ~1.5 s of scene time after ignition (the picture's climb is time-compressed: it covers its first ~10 km in well under a second, so the altitude alone would
      // end the tremor almost at once; the air-thin part of the climb, past ~150 km of illustrative altitude, never shakes). A pure function of the vehicle's own thrust, its
      // altitude and the scene time since ignition; never of wall-clock time
      if (vis && !hide && thr > 0.004) {
        const se = Math.max(0, (t - st.lastIg) * this.sim.cfg.duration),
          env = (1 - smooth((se - 0.35) / 1.15)) * (1 - smooth(st.alt / 150)) * smooth(se / 0.15);
        this._shakeA = Math.max(this._shakeA, thr * env);
      }
      // glow and the ignition flash (the first frames of a motor are a bright burst well beyond the plume)
      rk.glow.visible = vis && thr > 0.004 && !hide;
      rk.glow.scale.setScalar((0.013 + 0.01 * thr + 0.008 * e) * ak * (1 + 0.4 * (pk - 1)));
      rk.glow.material.opacity = (0.85 - 0.35 * e) * thr;
      rk.glow.position.z = -0.003;
      // bloom: wide and warm while the motor burns in dense air (thins out with height), brightest with the ignition flash
      rk.bloom.visible = vis && thr > 0.004 && !hide;
      rk.bloom.scale.setScalar((0.07 + 0.025 * low) * ak * (1 + 0.5 * (pk - 1)));
      rk.bloom.material.opacity = (0.2 + 0.16 * Math.min(1, st.flash * 1.5)) * thr * (1 - 0.7 * e) * (0.45 + 0.55 * low);
      rk.bloom.position.z = -0.006;
      rk.hot.visible = vis && thr > 0.004 && !hide;
      rk.hot.scale.setScalar((0.0062 + 0.003 * thr) * ak * (1 + 0.3 * (pk - 1)) * (1 - 0.35 * e));
      rk.hot.material.opacity = Math.min(1, 1.1 * thr) * (1 - 0.5 * e);
      rk.hot.position.z = -0.0016;
      // exhaust glow on the ground at low altitude: a warm pool on the surface under the vehicle that fades out over the first ~15 km of the climb
      {
        const gg = (rec.gg ||= (() => {
          const s = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: 0xff9a4a, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
          s.renderOrder = 3;
          s.visible = false;
          obj.parent?.add(s);
          return s;
        })());
        const lg = thr > 0.004 ? thr * (1 - smooth((st.alt - 0.6) / 14)) : 0;
        gg.visible = vis && lg > 0.01 && !hide;
        if (gg.visible) {
          const q = rec.v1.set(obj.position.x, obj.position.y, obj.position.z).normalize().multiplyScalar(1.0022);
          gg.position.copy(q);
          gg.scale.setScalar(Lr * (0.5 + 0.35 * lg) * (1 + 0.4 * (flick - 1)));
          gg.material.opacity = 0.5 * lg;
        }
      }
      // the engine bells glow while the motor burns (the lower one until the separation, then the upper one)
      rk.bell.emissiveIntensity = (sepNow ? 0 : 1.5) * thr;
      rk.bellU.emissiveIntensity = (sepNow ? 1.5 : 0) * thr;
      // separation flash: a bright burst at the interstage as the lower part lets go
      {
        const sf = sepNow ? Math.exp(-sepAge * 11) * clamp01(sepAge / 0.012 + 0.2) : 0;
        rk.sepFlash.visible = vis && sf > 0.02 && !hide;
        rk.sepFlash.position.z = D.zS;
        rk.sepFlash.scale.setScalar((0.012 + 0.03 * sf) * (fx.stage?.puff ?? 1) ** 0.5);
        rk.sepFlash.material.opacity = Math.min(0.95, sf);
      }
      rk.flash.visible = vis && st.flash > 0.01 && !hide;
      const reLit = sepNow && t >= rec.burns[rec.burns.length - 1][0]; // the upper stage's own ignition: a small flash, not the first launch burst
      rk.flash.scale.setScalar((0.016 + 0.03 * st.flash) * (reLit ? 0.5 : 1) * ak);
      rk.flash.material.opacity = Math.min(0.85, st.flash) * (reLit ? 0.6 : 1);
      rk.flash.position.z = -0.004;
      // puff: a pop of gas at the separation, a burst of steam at the cold-launch pop
      let puff = 0,
        puffZ = rk.rig.position.z + 0.002;
      if (sepNow && sepAge < 0.3) puff = Math.max(puff, (1 - sepAge / 0.3) * 0.7) * (sepAge < 0.03 ? sepAge / 0.03 : 1); // a small puff of gas, over about 1.5% of the scene
      if (fx.cold && t >= fx.t0 && t < fx.t0 + rec.popT + 0.01) puff = Math.max(puff, 0.8 * clamp01(1 - (t - fx.t0) / (rec.popT + 0.01)));
      rk.puff.visible = vis && puff > 0.01 && !hide;
      rk.puff.position.z = puffZ;
      const sepPuff = sepNow; // a separation puff is small (the width of the stage); the cold-launch steam keeps its larger size
      const pf = sepPuff ? (fx.stage?.puff ?? 1) : 1;
      rk.puff.scale.setScalar((sepPuff ? 0.007 + 0.013 * (1 - puff) : 0.02 + 0.05 * (1 - puff)) * pf);
      rk.puff.material.opacity = Math.min(0.9, puff * (sepPuff ? 0.4 : 0.55) * pf);
      // ---- nose heating: follows the dynamic pressure (air density x speed squared), so it is zero in vacuum: nothing above about 40 km (illustrative) and none in the coast
      // above the atmosphere. The glow is a small sprite at the nose tip, sized with the vehicle (it is a child of the model), and the nose's own emissive does the rest.
      const vrel = (rec.speed || 0) / rec.vmax,
        qdyn = st.rho * vrel * vrel,
        air = 1 - smooth((st.alt - HEAT_TOP * 0.6) / (HEAT_TOP * 0.4)), // fades to zero by the top of the air
        heat = 0.7 * clamp01(Math.sqrt(clamp01(qdyn) * 1.6) * vrel) * clamp01((st.alt - 7) / 9) * air;
      rk.nose.emissiveIntensity = heat * 1.4;
      rk.heat.visible = vis && heat > 0.04 && !hide;
      rk.heat.material.opacity = heat * 0.5;
      rk.heat.scale.setScalar(0.007 + 0.011 * heat);
      // the plain glow marker that shares the path with a drawn vehicle sat mid-body and stayed lit all the way through the vacuum: it is not drawn; the
      // nose glow above (dynamic pressure, attached to the nose) is the only halo
      if (fx.marker) {
        rec.kv ||= this.dyn.find((d) => d.it === fx.marker);
        if (rec.kv) rec.kv.obj.visible = false;
      }
      // ---- pre-launch venting (fx.vent): vapour streams off the upper body (three puffs) and rolls out along the pad (two), thinning away as the motor lights
      {
        const va = fx.vent && vis && !hide ? clamp01(t / 0.02) * (1 - smooth((t - fx.t0) / 0.012)) : 0;
        rk.vent.forEach((s, i) => {
          s.visible = va > 0.01;
          if (!s.visible) return;
          const ph = (tm * 0.55 + i * 0.37 + 0.13) % 1,
            fade = Math.sin(PI * ph) ** 1.2;
          if (i < 3) {
            // from a vent on the upper body: rises and leans away with the breeze
            // (small, faint wisps off the side of the body: a big soft puff at the top read as a halo round the nose cone)
            s.position.set(D.rU * (1.5 + 1.8 * ph), 0, D.zT - 0.014 - 0.005 * i + 0.010 * ph);
            s.scale.setScalar(0.004 + 0.009 * ph);
            s.material.opacity = va * 0.16 * fade;
          } else {
            // boil-off at the base: low clouds spreading sideways over the plate
            const sd = i === 3 ? 1 : -1;
            s.position.set(sd * (0.006 + 0.022 * ph), 0, D.zN + 0.004 + 0.003 * ph);
            s.scale.setScalar(0.011 + 0.016 * ph);
            s.material.opacity = va * 0.42 * fade;
          }
        });
      }
      // ---- the waiting highlight ring (fx.waitRing): fades as the motor lights
      const wr = fx.waitRing ? 1 - smooth((t - fx.t0) / 0.012) : 0;
      rk.ring.visible = vis && wr > 0.01 && !hide;
      if (rk.ring.visible) {
        const pulse = 0.5 + 0.5 * Math.sin(tm * 5);
        rk.ring.scale.setScalar(0.066 + 0.005 * pulse);
        rk.ring.material.opacity = wr * (0.4 + 0.2 * pulse);
      }
      if (rk.kv && fx.kv) this._kvFrame(rec, t, vis, hide);
      this._smokeFrame(rec, t, st, Lr, vis);
    }
  },
  // The kill vehicle of an anti-satellite missile (fx.kv { at }): it rides the nose until the separation time, then the spent body drops away aft (tumbling a little,
  // fading out) while the small vehicle flies on alone, easing onto the path point so it arrives on the target at the hit; cold-gas thruster puffs flicker beside it.
  // Everything is a function of t (the body offset, tumble and fade included), so scrubbing agrees.
  _kvFrame(rec, t, vis, hide) {
    const T = this.T,
      rk = rec.rk,
      kv = rk.kv,
      ts = rec.fx.kv.at,
      u = (t - ts) / (rec.fx.kv.age ?? SEP_AGE),
      sep = u >= 0,
      w = smooth((t - ts) / Math.max(1e-4, rec.fx.t1 - ts)),
      z0 = kv.userData.zc;
    kv.visible = vis;
    kv.position.z = z0 * (1 - w);
    kv.scale.setScalar(1 + (rec.fx.kv.grow ?? 0.25) * smooth((t - ts) / 0.07));
    // the spent body: aft of the vehicle, a slow tumble about its middle, fading out
    const e3 = (rec.e3 ||= new T.Euler()),
      uu = Math.max(0, u),
      off = 0.012 * uu + 0.03 * uu * uu;
    rk.inner.visible = vis && (!sep || u < 1.9);
    rk.inner.position.z = (rec.lift || 0) - (sep ? off : 0);
    rk.inner.rotation.copy(e3.set(0.3 * uu * uu, 0.45 * uu * uu, 0.18 * uu * uu));
    const fade = 1 - smooth((uu - 0.5) / 1.3);
    for (const m of kv.userData.bodyMats) m.opacity = fade;
    // cold-gas puffs
    const tm = t * this.sim.cfg.duration,
      on = vis && sep && !hide ? smooth(u / 0.4) : 0,
      ha = kv.userData.halo;
    ha.visible = on > 0.02;
    ha.material.opacity = 0.24 * on; // a faint cool glow (it was a bright blue orb over the satellite behind it)
    ha.scale.setScalar(0.013);
    kv.userData.puffs.forEach((sp, i) => {
      const v = Math.pow(Math.max(0, Math.sin(tm * (23 + 9 * i) + i * 2.1)), 5);
      sp.visible = on > 0.02 && v > 0.02;
      sp.material.opacity = 0.85 * v * on;
      sp.scale.setScalar(0.0062 + 0.0058 * v);
    });
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
    const c0 = fx.air.carry ?? 0.5; // opt-in (rocket.carry): how far under the belly it hangs, in its own lengths
    let carry = c0;
    if (tau >= 0 && tau < 1) carry = c0 + 1.6 * tau * tau;
    else if (tau >= 1) carry = (c0 + 1.6) * (1 - smooth((tau - 1) / 3.2));
    let base = tau < 0 ? apos : p;
    if (tau >= 0 && tau < 1.2) {
      // the path starts a little off the carrier's own position: the missile eases onto it over the drop instead of snapping across at the release
      const p0 = (rec.p0 ||= rec.it.pos(fx.t0)),
        w = 1 - smooth(tau / 1.2);
      if (p0) base = [p[0] - (p0[0] - apos[0]) * w, p[1] - (p0[1] - apos[1]) * w, p[2] - (p0[2] - apos[2]) * w];
    }
    // hung under the aircraft's belly (its own up axis, which a climbing aircraft has tilted), then falling along the local vertical
    const ay = (rec.vy ||= new T.Vector3()).set(0, 1, 0).applyQuaternion(acObj.quaternion),
      dn = (rec.vd ||= new T.Vector3()).copy(ay).lerp(upv, tau <= 0 ? 0 : smooth(Math.min(1, tau))).normalize();
    obj.position.set(base[0], base[1], base[2]).addScaledVector(dn, -carry * Lr);
    // the carrier flies low in the picture (a few hundredths of an Earth radius above the surface), so a missile hung a half length under its belly or dropped
    // a length or two below it would sink into the globe and vanish: its height is kept above the surface (AIR_FLOOR)
    // seen from above the carrier's airframe would hide it as well: after the release it swings out to the side, about a wing's semi-span, and trails a little
    // aft, then settles back onto its path (the offsets are in the aircraft's own frame, so they do not depend on the camera; zero at the release)
    if (tau > 0) {
      const right = (rec.vr ||= new T.Vector3()).set(1, 0, 0).applyQuaternion(acObj.quaternion),
        fwd = (rec.vf ||= new T.Vector3()).set(0, 0, 1).applyQuaternion(acObj.quaternion);
      if (rec.side == null) {
        const q = rec.it.pos(fx.t0 + 0.04) || p;
        rec.side = (q[0] - apos[0]) * right.x + (q[1] - apos[1]) * right.y + (q[2] - apos[2]) * right.z >= 0 ? 1 : -1; // toward the side its path leaves on
      }
      const lat = smooth(tau / 1.6) * (1 - smooth((tau - 2.4) / 3.6)),
        aft = smooth(tau / 1.2) * (1 - smooth((tau - 2.4) / 3.6));
      obj.position.addScaledVector(right, rec.side * 0.9 * Lr * lat).addScaledVector(fwd, -0.5 * Lr * aft);
    }
    const rr = obj.position.length();
    if (rr < AIR_FLOOR) obj.position.multiplyScalar(AIR_FLOOR / rr);
    // a released missile is smaller than the carrier: kept to 0.7 of its drawn size until it drops clear
    obj.scale.multiplyScalar(0.7 + 0.3 * smooth(tau / 1.0));
    if (tau < 0) obj.quaternion.copy(acObj.quaternion);
    else {
      const qa = rec.q1 || (rec.q1 = new T.Quaternion());
      qa.copy(acObj.quaternion);
      qa.multiply(rec.q0.setFromAxisAngle(rec.v1.set(1, 0, 0), 0.2 * Math.min(1, tau))); // nose dips as it falls
      obj.quaternion.copy((rec.q2 ||= new T.Quaternion()).copy(qa).slerp(rec.q3 ? rec.q3.copy(obj.quaternion) : (rec.q3 = obj.quaternion.clone()), smooth((tau - 0.9) / 2.5))); // the swing from the carrier's attitude onto the path is a steady turn over about 3.5 drop spans
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
      TA = fx.smokeTA ?? 0.2, // (opt-in rocket.smokeTA) e-folding age of the smoke (scene time): the trail persists through the rest of the flight and fades with age
      wind = (rec.wind ||= new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), rec.up0).normalize()),
      sk = fx.smokeK ?? 1, // opt-in (rocket.smokeK): a larger, denser trail for a scene whose launch is small in the frame
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
      const ST = SMOKE_TOP * (fx.smokeTopK ?? 1), // opt-in (rocket.smokeTopK): a longer column on a climb of several hundred km, so the trail reaches the vehicle
        fadeAlt = 1 - smooth((alt - ST * 0.55) / (ST * 0.9 - ST * 0.55)); // gone above about 40 km
      // behind the nozzle, then drifting with a fixed wind and billowing wider with age
      const gr = 1 - Math.exp(-age / 0.07),
        ph = Math.sin(k * 7.3 + 1.7),
        nearRaw = Math.exp(-(te - fx.t0) / 0.014),
        nk = fx.smokeNear ?? 1, // opt-in (rocket.smokeNear < 1): a smaller pad cloud that thins out fast, so the column follows the climb instead of a ball staying behind
        near = nk * nearRaw; // the cloud at the pad / the launch point
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        dz = b[2] - a[2],
        dl = Math.hypot(dx, dy, dz) || 1,
        back = 0.45 * Lr;
      const wl = (fx.smokeWind ?? 1) * 0.7 * Lr * gr + 0.06 * Lr * ph; // wind drift (opt-in rocket.smokeWind scales it)
      const lat = near * gr * 0.6 * Lr * (S.seed[k] - 0.5) * 2; // the pad cloud spreads sideways
      pos[3 * k] = a[0] - (dx / dl) * back + wind.x * (wl + lat);
      pos[3 * k + 1] = a[1] - (dy / dl) * back + wind.y * (wl + lat);
      pos[3 * k + 2] = a[2] - (dz / dl) * back + wind.z * (wl + lat);
      const spread = 1 + 2.4 * gr + 1.1 * near * (0.3 + gr);
      sz[k] = bodyD * 1.7 * spread * sk;
      // overlapping soft discs add up: each one carries a share of the opacity that keeps the column's density about constant whatever its length
      const dense = 0.3 + 0.7 * Math.sqrt(rho); // thinner trail in thinner air
      // opt-in (rocket.smokeLocal): each puff's share of the opacity follows the local spacing of the puffs along the path, so the slow first seconds of a lift-off do not
      // stack their puffs into one dense ball that hangs behind the climbing vehicle: the column stays one trail from the pad to the vehicle
      let spc = spacing;
      if (fx.smokeLocal) {
        const dh = (tE - t0) / S.K,
          q1 = it.pos(Math.max(t0, te - dh * 0.5)),
          q2 = it.pos(Math.min(tE, te + dh * 0.5));
        if (q1 && q2) spc = Math.max(spacing * fx.smokeLocal, Math.hypot(q2[0] - q1[0], q2[1] - q1[1], q2[2] - q1[2]));
      }
      al[k] = Math.min(0.72 * (1 + 0.3 * (sk - 1)), (2.2 * spc * (1 + 0.5 * (sk - 1))) / sz[k]) * dense * fadeAlt * Math.exp(-age / TA) * clamp01(age / (fx.smokeRamp ?? 0.012)) * Math.exp((-age * (1 - nk) * nearRaw) / 0.05) * (rec.fx.cold && te < fx.t0 + rec.popT ? 1.15 : 1);
      wm[k] = Math.exp(-age / 0.012) * 0.8;
      if (al[k] > 0.003) any = true;
    }
    S.pts.visible = any;
    S.g.attributes.position.needsUpdate = S.g.attributes.aAl.needsUpdate = S.g.attributes.aSz.needsUpdate = S.g.attributes.aWarm.needsUpdate = true;
  },
};
