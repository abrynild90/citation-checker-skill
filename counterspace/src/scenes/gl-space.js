// ============================================================================
// scenes/gl-space.js: GLHost mixin: the sky behind the scene (stars of different sizes and temperatures, a faint Milky Way)
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { IS_PHONE, mulberry } from './core.js';

// Stars are points with a soft round profile. The size is in CSS px (uPx scales it to the drawing buffer). Stars seen through the atmosphere ring
// around the planet are dimmed: the angle between the star and the planet's centre is compared with the angular radius of the atmosphere.
const STAR_VS = `attribute float aSize; attribute float aBright; attribute vec3 aColor; uniform float uPx; varying vec3 vC; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx;
  vec3 e = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float D = max(length(e), 1.2);
  float ang = acos(clamp(dot(normalize(mv.xyz), e / D), -1.0, 1.0));
  float ra = asin(min(1.0, 1.1 / D));
  vC = aColor;
  vA = aBright * mix(0.3, 1.0, smoothstep(ra * 0.92, ra * 1.35, ang));
}`;
const STAR_FS = `varying vec3 vC; varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float f = exp(-r * r * 4.5) * (1.0 - smoothstep(0.8, 1.0, r)); gl_FragColor = vec4(vC, vA * f); }`;
// The Milky Way: a neutral pale band along a tilted great circle, broken up by a small noise picture (dust lanes), at a few percent of full brightness.
// Dithered so the dark gradient never bands. Added to whatever dark background the page puts behind the canvas.
const SKY_VS = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FS = `uniform sampler2D uNoise; uniform vec3 uBand; varying vec3 vD;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 d = normalize(vD);
  float b = dot(d, uBand);
  vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5);
  float n = texture2D(uNoise, uv).r;
  float band = exp(-pow(b / 0.17, 2.0)) * (0.30 + 0.95 * n) + 0.18 * exp(-pow(b / 0.45, 2.0)) * n;
  float a = band * 0.050 + (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(0.80, 0.85, 0.95, max(a, 0.0));
}`;

let nebCv = null;
// 256 x 128 equirectangular fractal noise, seamless in longitude (3D value noise sampled on the sphere), computed once.
function nebulaCanvas() {
  if (nebCv) return nebCv;
  nebCv = document.createElement('canvas');
  nebCv.width = 256;
  nebCv.height = 128;
  const g = nebCv.getContext('2d'),
    img = g.createImageData(256, 128),
    rnd = mulberry(4242),
    lat = new Float32Array(16 * 16 * 16).map(() => rnd());
  const at = (x, y, z) => lat[(x & 15) + 16 * ((y & 15) + 16 * (z & 15))];
  const vn = (x, y, z) => {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      iz = Math.floor(z),
      fx = x - ix,
      fy = y - iy,
      fz = z - iz,
      sx = fx * fx * (3 - 2 * fx),
      sy = fy * fy * (3 - 2 * fy),
      sz = fz * fz * (3 - 2 * fz),
      l = (a, b, t) => a + (b - a) * t;
    return l(
      l(l(at(ix, iy, iz), at(ix + 1, iy, iz), sx), l(at(ix, iy + 1, iz), at(ix + 1, iy + 1, iz), sx), sy),
      l(l(at(ix, iy, iz + 1), at(ix + 1, iy, iz + 1), sx), l(at(ix, iy + 1, iz + 1), at(ix + 1, iy + 1, iz + 1), sx), sy),
      sz,
    );
  };
  for (let j = 0; j < 128; j++)
    for (let i = 0; i < 256; i++) {
      const lo = (i / 256) * 2 * Math.PI,
        la = (j / 128 - 0.5) * Math.PI,
        p = [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
      let s = 0,
        a = 0.5,
        f = 2.2;
      for (let k = 0; k < 4; k++, f *= 2.1, a *= 0.5) s += a * vn(p[0] * f + 8, p[1] * f + 8, p[2] * f + 8);
      const v = Math.max(0, Math.min(255, Math.round(255 * Math.pow(Math.min(1, s * 1.25), 1.6))));
      const o = 4 * (j * 256 + i);
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return nebCv;
}

// Star colour by temperature: a few blue-white, most white, then yellow, orange and a rare red one.
const STAR_RAMP = [
  [0.1, [0.7, 0.8, 1.0]],
  [0.45, [0.94, 0.96, 1.0]],
  [0.75, [1.0, 0.95, 0.84]],
  [0.92, [1.0, 0.84, 0.64]],
  [1.01, [1.0, 0.7, 0.52]],
];

export const spaceMethods = {
  _buildSpace(S) {
    const T = this.T,
      n = IS_PHONE ? 2200 : 4800,
      rnd = mulberry(99),
      band = new T.Vector3(0.34, 0.82, -0.46).normalize(),
      pos = new Float32Array(n * 3),
      size = new Float32Array(n),
      bright = new Float32Array(n),
      col = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      let x, y, z;
      // two thirds of the stars thicken toward the Milky Way band (rejection sampling), the rest are spread evenly
      for (let tries = 0; tries < 30; tries++) {
        const u = rnd() * 2 - 1,
          th = rnd() * 2 * Math.PI,
          s = Math.sqrt(1 - u * u);
        x = s * Math.cos(th);
        y = u;
        z = s * Math.sin(th);
        const b = x * band.x + y * band.y + z * band.z;
        if (k % 3 === 0 || rnd() < 0.3 + 0.7 * Math.exp(-((b / 0.3) ** 2))) break;
      }
      pos.set([40 * x, 40 * y, 40 * z], 3 * k);
      const m = Math.pow(rnd(), 6); // most stars are faint, a few are bright
      size[k] = 1.5 + 2.1 * m;
      bright[k] = 0.22 + 0.78 * m;
      const tp = rnd(),
        c = STAR_RAMP.find((r) => tp < r[0])[1];
      col.set([c[0], c[1], c[2]], 3 * k);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new T.BufferAttribute(size, 1));
    g.setAttribute('aBright', new T.BufferAttribute(bright, 1));
    g.setAttribute('aColor', new T.BufferAttribute(col, 3));
    const stars = new T.Points(
      g,
      new T.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, uniforms: { uPx: { value: 1 } } }),
    );
    stars.frustumCulled = false;
    this._starMat = stars.material;
    S.add(stars);
    this._nebTex = new T.CanvasTexture(nebulaCanvas());
    this._nebTex.wrapS = T.RepeatWrapping;
    const sky = new T.Mesh(
      new T.SphereGeometry(60, 32, 24),
      new T.ShaderMaterial({
        vertexShader: SKY_VS,
        fragmentShader: SKY_FS,
        side: T.BackSide,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        uniforms: { uNoise: { value: this._nebTex }, uBand: { value: band } },
      }),
    );
    sky.frustumCulled = false;
    S.add(sky);
  },
  // Star size follows the drawing-buffer scale (device pixel ratio, or the print-resolution still).
  _spaceFrame() {
    if (this._starMat) this._starMat.uniforms.uPx.value = this.renderer.domElement.height / (this.el?.clientHeight || this.renderer.domElement.height);
  },
  _disposeSpace() {
    this._nebTex?.dispose();
    this._nebTex = this._starMat = null;
  },
};
