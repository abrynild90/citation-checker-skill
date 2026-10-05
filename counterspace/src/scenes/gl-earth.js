// ============================================================================
// scenes/gl-earth.js: GLHost mixin: the planet (day picture with relief, city lights, soft terminator, clouds), its atmosphere, the cloud map
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { IS_PHONE } from './core.js';
import {
  earthImg,
  earthLow,
  earthNightLow,
  earthNightSource,
  earthPromise,
  earthReliefImg,
  earthSource,
  getLandCanvas,
  landCanvas,
  lightsFor,
  lightsIfReady,
  loadEarth,
  loadEarthNight,
  loadEmbeddedEarth,
  oceanMaskSource,
} from './earth.js';

// ---------------------------------------------------------------- shaders
const EARTH_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vP;
void main(){ vUv = uv; vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// Day side: the photograph, shaded by the relief map and lit with a wide, soft terminator and reddened sunlight near it. Night side: a faint cool copy of
// the land and the city lights (a one-channel picture, see lightsFor). Sea: a sky reflection at grazing angles. Clouds come from the
// generated map (R, thin and wispy); its G channel is fine noise that adds detail to the land when the camera is close (mipmapping fades it out at a distance).
const EARTH_FS = `uniform sampler2D uDayA; uniform sampler2D uDayB; uniform sampler2D uLightA; uniform sampler2D uLightB; uniform sampler2D uMask; uniform sampler2D uRelief; uniform sampler2D uCloud;
uniform vec3 uSun; uniform float uFade; uniform float uCloudAmt; uniform float uLights; uniform float uBump; uniform float uNight;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vP;
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 0.0)), h13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
              mix(mix(h13(i + vec3(0.0, 0.0, 1.0)), h13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 1.0)), h13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
// The relief map tilts the surface normal: height steps over two texels become a slope (8848 m is full white on a 6371 km planet), exaggerated by uBump. The
// samples are taken at the mip level that matches the pixel, so the shading never turns to noise when the globe is small.
vec3 relief(vec3 N){
  if (uBump <= 0.0) return N;
  vec2 e = vec2(1.0 / 2048.0, 1.0 / 1024.0);
  float tpp = max(fwidth(vUv.x) * 2048.0, fwidth(vUv.y) * 1024.0);
  float lod = max(0.0, log2(max(tpp, 1.0)));
  vec2 s = e * exp2(lod);
  float hx = textureLod(uRelief, vUv + vec2(s.x, 0.0), lod).r - textureLod(uRelief, vUv - vec2(s.x, 0.0), lod).r;
  float hy = textureLod(uRelief, vUv + vec2(0.0, s.y), lod).r - textureLod(uRelief, vUv - vec2(0.0, s.y), lod).r;
  float cosLat = max(sqrt(max(1.0 - N.y * N.y, 0.0)), 0.06);
  vec3 T = normalize(vec3(N.z, 0.0, -N.x) + vec3(1e-5, 0.0, 0.0));
  vec3 B = cross(N, T);
  vec3 g = (hx * T * (0.00139 / (2.0 * s.x * 6.2831853 * cosLat)) + hy * B * (0.00139 / (2.0 * s.y * 3.14159265))) * uBump;
  return normalize(N - g);
}
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(uSun);
  float ndl = dot(N, L), ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 Nb = relief(N);
  vec3 day = mix(texture2D(uDayA, vUv).rgb, texture2D(uDayB, vUv).rgb, uFade);
  float water = smoothstep(0.35, 0.65, texture2D(uMask, vUv).r);
  float dt = texture2D(uCloud, vUv * vec2(26.0, 13.0)).g + 0.5 * texture2D(uCloud, vUv * vec2(71.0, 35.5) + 0.37).g - 0.75;
  float magL = 1.0 - smoothstep(0.25, 1.0, max(fwidth(vUv.x), fwidth(vUv.y)) * 4096.0);
  if (magL > 0.0) {
    vec3 qd = normalize(vP);
    dt += magL * (0.50 * (vn(qd * 700.0) - 0.5) + 0.35 * (vn(qd * 1700.0 + 5.3) - 0.5) + 0.25 * (vn(qd * 4200.0 + 2.1) - 0.5));
  }
  day *= 1.0 + dt * (0.7 + 0.45 * magL) * (1.0 - 0.75 * water);
  day = pow(day, vec3(0.93)) * vec3(1.04, 1.01, 0.98);
  float dif = max(dot(Nb, L), 0.0);
  float dayAmt = smoothstep(-0.10, 0.26, ndl);
  float tw = exp(-pow((ndl - 0.04) / 0.13, 2.0));
  vec3 sunCol = mix(vec3(1.0, 0.985, 0.95), vec3(1.0, 0.6, 0.38), clamp(tw * 0.9, 0.0, 1.0));
  vec3 lit = day * (0.10 + 1.45 * pow(dif, 0.85)) * sunCol;
  float lt = smoothstep(0.10, 0.95, mix(texture2D(uLightA, vUv).r, texture2D(uLightB, vUv).r, uFade));
  vec3 lamp = mix(vec3(1.0, 0.46, 0.16), vec3(1.0, 0.88, 0.58), smoothstep(0.25, 0.9, lt)) * lt * (1.0 - 0.9 * water); // no warm patches on the open ocean (cloud and airglow in the night picture)
  vec3 dark = (vec3(0.006, 0.010, 0.024) + day * vec3(0.036, 0.054, 0.100)) * uNight + lamp * 1.15 * uLights;
  vec3 col = mix(dark, lit, dayAmt);
  float cl = smoothstep(0.08, 0.85, texture2D(uCloud, vUv).r);
  // Close up the baked map (1024 px) is magnified: add detail noise on the sphere, only where a map texel covers more than ~a pixel.
  float mag = 1.0 - smoothstep(0.4, 1.2, max(fwidth(vUv.x), fwidth(vUv.y)) * 1024.0);
  if (mag > 0.0 && cl > 0.0) {
    vec3 q = normalize(vP);
    float n = 0.45 * vn(q * 90.0) + 0.30 * vn(q * 210.0 + 3.7) + 0.25 * vn(q * 470.0 + 9.1);
    cl = clamp(cl + (n - 0.5) * mag * (1.3 * 4.0 * cl * (1.0 - cl) + 0.45 * cl), 0.0, 1.0);
  }
  cl *= uCloudAmt;
  float fr = pow(1.0 - ndv, 4.0);
  col += (vec3(0.20, 0.36, 0.62) * fr * 0.5) * water * dayAmt * (1.0 - cl);
  vec3 cLit = vec3(1.0, 0.99, 0.97) * (0.10 + 1.30 * pow(max(ndl, 0.0), 0.8)) * sunCol;
  vec3 cloudCol = mix(vec3(0.030, 0.042, 0.075), cLit, dayAmt);
  // cloud albedo fades to nothing at the terminator and on the night side, and stays a soft blue-grey over dark ocean
  col = mix(col, cloudCol * vec3(0.84, 0.90, 1.0), cl * 0.5 * smoothstep(0.6, 1.0, ndl));
  float limb = 1.0 - ndv;
  vec3 haze = mix(vec3(0.16, 0.38, 0.85), vec3(0.46, 0.73, 1.0), clamp(ndl * 1.5 + 0.3, 0.0, 1.0));
  haze = mix(haze, vec3(1.0, 0.5, 0.25), tw * 0.5);
  float sunny = 0.10 + 0.90 * dayAmt;
  col = mix(col, col * 0.5 + haze * 0.9, pow(limb, 3.0) * 0.62 * sunny);
  col += haze * pow(limb, 6.0) * 0.85 * sunny;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
// Atmosphere: seen from outside the planet a ray that misses it is brightest where it grazes the surface and fades with the height of its closest point
// (an exponential atmosphere); blue-white on the lit limb, orange near the terminator, almost nothing on the dark side.
const ATMO_VS = `varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const ATMO_FS = `uniform vec3 uSun; uniform float uGain; uniform float uScale; uniform float uFloor;
varying vec3 vW;
void main(){
  vec3 ro = cameraPosition, rd = normalize(vW - ro);
  float b = dot(-ro, rd);
  vec3 pc = ro + rd * max(b, 0.0);
  float alt = max(length(pc) - 1.0, 0.0);
  float dens = exp(-alt / (0.020 * uScale)) + 0.16 * exp(-alt / (0.075 * uScale));
  float sd = dot(normalize(pc), uSun);
  float lit = smoothstep(-0.30, 0.55, sd);
  float tw = exp(-pow((sd - 0.02) / 0.16, 2.0));
  vec3 col = mix(vec3(0.20, 0.45, 1.0), vec3(0.62, 0.82, 1.0), lit * lit);
  col = mix(col, vec3(1.0, 0.52, 0.24), tw * 0.65);
  gl_FragColor = vec4(col, clamp(dens * (uFloor + (1.0 - uFloor) * lit) * uGain, 0.0, 1.0));
}`;
// Cloud map, drawn once into a texture. Large swirls decide where the weather is (about a third of the sphere, wetter at the equator and in the mid-latitudes);
// inside them a finer, strongly warped noise draws wisps and filaments, and a faint veil thins out around the masses. No hard edges, no round blobs.
const CLOUD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const CLOUD_FS = `varying vec2 vUv;
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 0.0)), h13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
              mix(mix(h13(i + vec3(0.0, 0.0, 1.0)), h13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 1.0)), h13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 5; k++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 3; k++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
void main(){
  float lon = vUv.x * 6.2831853, lat = (vUv.y - 0.5) * 3.14159265;
  vec3 p = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
  vec3 w1 = vec3(fbm3(p * 1.3 + 1.7), fbm3(p * 1.3 + 8.3), fbm3(p * 1.3 + 3.1)) - 0.5;
  float al = abs(lat);
  float belt = 0.55 + 0.32 * exp(-pow(lat / 0.20, 2.0)) - 0.36 * exp(-pow((al - 0.45) / 0.17, 2.0)) + 0.30 * exp(-pow((al - 0.98) / 0.28, 2.0)) - 0.28 * exp(-pow((al - 1.50) / 0.18, 2.0));
  float cov = fbm(p * 2.6 + w1 * 1.8) + (belt - 0.55) * 0.30;
  vec3 w2 = vec3(fbm3(p * 5.0 + w1 * 2.0 + 2.2), fbm3(p * 5.0 + w1 * 2.0 + 6.6), fbm3(p * 5.0 + w1 * 2.0 + 4.4)) - 0.5;
  float fine = fbm(p * 11.0 + w2 * 3.4);
  float mass = smoothstep(0.50, 0.77, cov);
  float d = mass * smoothstep(0.27, 0.72, fine);
  float veil = smoothstep(0.44, 0.66, cov) * smoothstep(0.52, 0.86, fbm(p * 7.0 + w2 * 2.2 + 9.0)) * 0.34;
  float g = fbm3(p * 7.0 + 3.0) * 0.6 + fbm3(p * 23.0) * 0.4;
  gl_FragColor = vec4(clamp(d + veil, 0.0, 1.0), g, 0.0, 1.0);
}`;

const raf = () => new Promise((r) => requestAnimationFrame(r));

export const earthMethods = {
  // Persistent per host: the cloud map is generated on the GPU once (a few ms on a real GPU) and kept for every scene.
  _cloudTexture() {
    if (this._cloud !== undefined) return this._cloud?.texture || null;
    const T = this.T,
      w = IS_PHONE ? 512 : 1024;
    this._cloud = null;
    try {
      const rt = new T.WebGLRenderTarget(w, w / 2, {
          depthBuffer: false,
          minFilter: T.LinearMipmapLinearFilter,
          magFilter: T.LinearFilter,
          generateMipmaps: true,
          wrapS: T.RepeatWrapping,
          wrapT: T.MirroredRepeatWrapping,
        }),
        mat = new T.ShaderMaterial({ vertexShader: CLOUD_VS, fragmentShader: CLOUD_FS, depthTest: false, depthWrite: false }),
        quad = new T.Mesh(new T.PlaneGeometry(2, 2), mat),
        sc = new T.Scene(),
        r = this.renderer,
        keep = r.getRenderTarget();
      quad.frustumCulled = false;
      sc.add(quad);
      r.setRenderTarget(rt);
      r.render(sc, new T.Camera());
      r.setRenderTarget(keep);
      quad.geometry.dispose();
      mat.dispose();
      this._cloud = rt;
    } catch (e) {
      console.warn('Cloud map unavailable', e);
    }
    return this._cloud?.texture || null;
  },
  // One GPU texture per picture, kept for the life of the page (uploading a 4096 px picture takes far longer than the rest of opening a scene).
  _gtex(src, make) {
    const c = (this._tc ||= new Map());
    let t = c.get(src);
    if (!t) c.set(src, (t = make()));
    return t;
  },
  _imgTex(src, srgb = true) {
    return this._gtex(src, () => {
      const T = this.T,
        t = new T.Texture(src);
      t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
      t.wrapS = T.RepeatWrapping;
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      t.needsUpdate = true;
      return t;
    });
  },
  _lightTex(levels) {
    return this._gtex(levels, () => {
      const T = this.T,
        t = new T.DataTexture(levels[0].data, levels[0].width, levels[0].height, T.RedFormat, T.UnsignedByteType);
      t.mipmaps = levels;
      t.generateMipmaps = false;
      t.minFilter = T.LinearMipmapLinearFilter;
      t.magFilter = T.LinearFilter;
      t.wrapS = T.RepeatWrapping;
      t.unpackAlignment = 1;
      t.needsUpdate = true;
      return t;
    });
  },
  _flatTex(key, rgba, srgb = false) {
    return this._gtex(key, () => {
      const T = this.T,
        t = new T.DataTexture(new Uint8Array(rgba), 1, 1);
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      t.needsUpdate = true;
      return t;
    });
  },
  // The best pictures available right now, as source objects (the GPU textures are made from them by _texturesFor).
  _wantedPictures() {
    const night = earthNightSource();
    return {
      day: earthSource() || getLandCanvas(),
      lights: lightsIfReady(night),
      mask: oceanMaskSource(),
      relief: earthReliefImg,
    };
  },
  _texturesFor(w) {
    return {
      day: w.day ? this._imgTex(w.day) : this._flatTex('flat-day', [6, 10, 22, 255], true),
      lights: w.lights ? this._lightTex(w.lights) : this._flatTex('flat-lights', [0, 0, 0, 255]),
      mask: w.mask ? this._imgTex(w.mask, false) : this._flatTex('flat-mask', [0, 0, 0, 255]),
      relief: w.relief ? this._imgTex(w.relief, false) : this._flatTex('flat-relief', [0, 0, 0, 255]),
    };
  },
  // The planet and its atmosphere. Pictures: the small embedded ones at once, the full-size ones as soon as they are decoded (cross-faded, see refreshEarth).
  _buildEarth(root, sunDir) {
    const T = this.T,
      S = this.scene,
      u = {
        uDayA: { value: null },
        uDayB: { value: null },
        uLightA: { value: null },
        uLightB: { value: null },
        uMask: { value: null },
        uRelief: { value: null },
        uCloud: { value: this._cloudTexture() || this._flatTex('flat-cloud', [0, 128, 0, 255]) },
        uSun: { value: new T.Vector3(...sunDir) },
        uFade: { value: 1 },
        uCloudAmt: { value: 1 },
        uLights: { value: 1 },
        uNight: { value: this.sim.cfg.nightK ?? 1 }, // a scene on the dark side can lift the night ambient so land, ocean and craft separate
        uBump: { value: 0 },
      };
    this._eu = u;
    this._ep = { day: null, lights: null, mask: null, relief: null };
    this._efade = null;
    this._ebusy = false;
    const mat = new T.ShaderMaterial({ vertexShader: EARTH_VS, fragmentShader: EARTH_FS, uniforms: u });
    this.earthMat = mat;
    this._bindPictures(this._wantedPictures(), false);
    root.add(new T.Mesh(new T.SphereGeometry(1, IS_PHONE ? 72 : 96, IS_PHONE ? 48 : 64), mat));
    // Atmosphere glow: a shell far enough out that its edge is fully faded
    const au = { uSun: { value: new T.Vector3(...sunDir) }, uGain: { value: this.sim.cfg.atmoK ?? (this.sim.cfg.spin ? 1.1 : 1) }, uScale: { value: 1 }, uFloor: { value: this.sim.cfg.atmoFloor ?? 0.03 } };
    this._au = au;
    root.add(
      new T.Mesh(
        new T.SphereGeometry(1.26, 64, 48),
        new T.ShaderMaterial({
          vertexShader: ATMO_VS,
          fragmentShader: ATMO_FS,
          side: T.BackSide,
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
          uniforms: au,
        }),
      ),
    );
    // Better pictures: decode the small embedded ones, then the full-size ones (embedded too; fetched only if the page lacks them)
    const again = () => this.scene === S && this.refreshEarth();
    loadEmbeddedEarth().then(again);
    (earthPromise || loadEarth(this.maxTex)).then(again);
    this.refreshEarth();
  },
  // Bind pictures to the shader. fade: keep what is on screen as the "A" side and blend to the new pictures over 0.7 s, so a swap has no visible jump.
  _bindPictures(w, fade) {
    const u = this._eu,
      p = this._ep,
      tx = this._texturesFor(w),
      dayNew = w.day !== p.day,
      lightsNew = w.lights !== p.lights;
    if (fade && (dayNew || lightsNew)) {
      u.uDayA.value = u.uDayB.value;
      u.uLightA.value = u.uLightB.value;
      u.uFade.value = 0;
      this._efade = performance.now();
    } else {
      u.uDayA.value = tx.day;
      u.uLightA.value = tx.lights;
      u.uFade.value = 1;
    }
    u.uDayB.value = tx.day;
    u.uLightB.value = tx.lights;
    u.uMask.value = tx.mask;
    u.uRelief.value = tx.relief;
    this._ebump = w.relief ? 14 : 0; // relief shading ramps in with the fade
    u.uBump.value = fade && w.relief && !p.relief ? 0 : this._ebump;
    Object.assign(p, w);
    if (this._efade != null) this._efadeTick();
  },
  _efadeTick() {
    cancelAnimationFrame(this._efadeRaf);
    const step = (now) => {
      const u = this._eu;
      if (!u || this._efade == null) return;
      const f = Math.min(1, (now - this._efade) / 700),
        e = f * f * (3 - 2 * f);
      u.uFade.value = e;
      u.uBump.value = this._ebump * e;
      if (f >= 1) {
        u.uDayA.value = u.uDayB.value;
        u.uLightA.value = u.uLightB.value;
        u.uFade.value = 1;
        u.uBump.value = this._ebump;
        this._efade = null;
        this._ebusy = false;
        this._retire();
        this.render();
        if (this._epending) {
          this._epending = false;
          this.refreshEarth();
        }
        return;
      }
      this.render();
      this._efadeRaf = requestAnimationFrame(step);
    };
    this._efadeRaf = requestAnimationFrame(step);
  },
  // The small stand-in pictures are not needed once the full-size ones are on screen.
  _retire() {
    const c = this._tc,
      p = this._ep;
    if (!c) return;
    const keep = new Set([p.day, p.lights, p.mask, p.relief]);
    for (const old of [earthLow, earthNightLow, lightsIfReady(earthNightLow), landCanvas]) {
      if (old && !keep.has(old) && c.has(old)) {
        c.get(old).dispose();
        c.delete(old);
      }
    }
  },
  // A better picture has arrived (small embedded decoded, full-size day, lights built): upload the new textures one per frame, then blend to them.
  refreshEarth() {
    if (!this.earthMat) return;
    if (this._ebusy) {
      this._epending = true;
      return;
    }
    const S = this.scene,
      night = earthNightSource();
    // the lights are built from the night picture in slices; ask for them once the picture exists
    if (night && !lightsIfReady(night) && !this._lightsAsked?.has(night)) {
      (this._lightsAsked ||= new Set()).add(night);
      lightsFor(night).then(() => this.scene === S && this.refreshEarth());
    }
    if (earthImg && !this._nightAsked) {
      this._nightAsked = true;
      loadEarthNight(this.maxTex).then(() => this.scene === S && this.refreshEarth());
    }
    const w = this._wantedPictures(),
      p = this._ep;
    if (w.day === p.day && w.lights === p.lights && w.mask === p.mask && w.relief === p.relief) return;
    this._ebusy = true;
    const first = !p.day;
    (async () => {
      const tx = this._texturesFor(w);
      for (const t of [tx.day, tx.lights, tx.relief, tx.mask]) {
        if (this.scene !== S) return;
        await raf();
        this.renderer.initTexture(t);
      }
      await raf();
      if (this.scene !== S) return;
      this._bindPictures(w, !first);
      if (this._efade == null) {
        this._ebusy = false;
        this.render();
      }
    })();
  },
  // Per frame: clouds fade out as the camera comes close to the surface (they would hide the ground the scene is about, and the small cloud map looks soft up close).
  _earthFrame() {
    const u = this._eu;
    if (!u) return;
    const alt = this.camera.position.length() - 1;
    u.uCloudAmt.value = (this.sim.cfg.cloudK ?? 0.6) * Math.min(1, Math.max(0, (alt - 0.6) / 1.6));
  },
  // The textures belong to the host for the life of the page; only the running fade stops with the scene.
  _disposeEarth() {
    cancelAnimationFrame(this._efadeRaf);
    this._efade = null;
    this._ebusy = false;
    this._epending = false;
    this._eu = this._au = null;
  },
};
