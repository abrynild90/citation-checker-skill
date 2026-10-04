// ============================================================================
// scenes/gl-earth.js: GLHost mixin: the planet (day and night pictures, soft terminator, sea glint, clouds), its atmosphere, and the cloud map
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { IS_PHONE } from './core.js';
import {
  earthImg,
  earthNightSource,
  earthPromise,
  earthSource,
  getLandCanvas,
  loadEarth,
  loadEarthNight,
  loadEmbeddedEarth,
  onNightArrived,
  oceanMaskSource,
} from './earth.js';

// ---------------------------------------------------------------- shaders
const EARTH_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// Day side: the photograph, lit with a wide, soft terminator and reddened sunlight near it. Night side: a faint cool copy of the land and the city lights
// (only the warm pixels of the night picture count as lights). Sea: a sharp sun glint plus a broad sheen and a sky reflection at grazing angles. Clouds come
// from the generated map (R); its G channel is fine noise that adds detail to the land when the camera is close (mipmapping fades it out at a distance).
const EARTH_FS = `uniform sampler2D uDayA; uniform sampler2D uDayB; uniform sampler2D uNightA; uniform sampler2D uNightB; uniform sampler2D uMask; uniform sampler2D uCloud;
uniform vec3 uSun; uniform float uFade; uniform float uCloudAmt; uniform float uLights;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float lightsOf(vec3 c){ return max(0.0, c.r * 1.25 - c.b * 0.75 + c.g * 0.25 - 0.012); }
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(uSun);
  float ndl = dot(N, L), ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 day = mix(texture2D(uDayA, vUv).rgb, texture2D(uDayB, vUv).rgb, uFade);
  float water = smoothstep(0.35, 0.65, texture2D(uMask, vUv).r);
  float dt = texture2D(uCloud, vUv * vec2(26.0, 13.0)).g + 0.5 * texture2D(uCloud, vUv * vec2(71.0, 35.5) + 0.37).g - 0.75;
  day *= 1.0 + dt * 0.7 * (1.0 - 0.75 * water);
  day = pow(day, vec3(0.93)) * vec3(1.04, 1.01, 0.98);
  float dif = max(ndl, 0.0);
  float dayAmt = smoothstep(-0.10, 0.26, ndl);
  float tw = exp(-pow((ndl - 0.04) / 0.13, 2.0));
  vec3 sunCol = mix(vec3(1.0, 0.985, 0.95), vec3(1.0, 0.6, 0.38), clamp(tw * 0.9, 0.0, 1.0));
  vec3 lit = day * (0.10 + 1.45 * pow(dif, 0.85)) * sunCol;
  float l0 = lightsOf(mix(texture2D(uNightA, vUv).rgb, texture2D(uNightB, vUv).rgb, uFade));
  float l1 = lightsOf(textureLod(uNightB, vUv, 2.4).rgb);
  float lights = (pow(l0, 0.72) * 3.4 + pow(l1, 0.8) * 5.5) * uLights;
  vec3 dark = vec3(0.006, 0.010, 0.024) + day * vec3(0.036, 0.054, 0.100) + vec3(1.0, 0.70, 0.40) * lights;
  vec3 col = mix(dark, lit, dayAmt);
  float cl = smoothstep(0.10, 0.90, texture2D(uCloud, vUv).r) * uCloudAmt;
  vec3 H = normalize(L + V);
  float nh = max(dot(N, H), 0.0);
  float glint = pow(nh, 140.0) * 0.24 + pow(nh, 16.0) * 0.04;
  float fr = pow(1.0 - ndv, 4.0);
  col += (vec3(1.0, 0.96, 0.88) * glint + vec3(0.20, 0.36, 0.62) * fr * 0.5) * water * dayAmt * (1.0 - cl);
  vec3 cLit = vec3(1.0, 0.99, 0.97) * (0.10 + 1.30 * pow(dif, 0.8)) * sunCol;
  vec3 cloudCol = mix(vec3(0.012, 0.018, 0.040), cLit, dayAmt);
  col = mix(col, cloudCol, cl * 0.72);
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
const ATMO_FS = `uniform vec3 uSun; uniform float uGain; uniform float uScale;
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
  gl_FragColor = vec4(col, clamp(dens * (0.03 + 0.97 * lit) * uGain, 0.0, 1.0));
}`;
// Cloud map, drawn once into a texture: swirling noise with weather belts (wet at the equator and in the mid-latitudes, dry in the subtropics).
const CLOUD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const CLOUD_FS = `varying vec2 vUv;
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 0.0)), h13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
              mix(mix(h13(i + vec3(0.0, 0.0, 1.0)), h13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 1.0)), h13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 6; k++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
void main(){
  float lon = vUv.x * 6.2831853, lat = (vUv.y - 0.5) * 3.14159265;
  vec3 p = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
  vec3 w = vec3(fbm(p * 1.5 + 1.3), fbm(p * 1.5 + 5.7), fbm(p * 1.5 + 9.1)) - 0.5;
  float n = fbm(p * 4.6 + w * 2.8);
  float al = abs(lat);
  float belt = 0.55 + 0.32 * exp(-pow(lat / 0.20, 2.0)) - 0.36 * exp(-pow((al - 0.45) / 0.17, 2.0)) + 0.30 * exp(-pow((al - 0.98) / 0.28, 2.0)) - 0.28 * exp(-pow((al - 1.50) / 0.18, 2.0));
  float th = 0.64 - 0.20 * clamp(belt, 0.0, 1.0);
  float mass = smoothstep(th, th + 0.32, n);
  float grain = fbm(p * 15.0 + w * 3.0);
  float streak = fbm(p * 44.0 + w * 6.0);
  float d = mass * (0.40 + 0.85 * smoothstep(0.28, 0.72, grain)) * (0.75 + 0.5 * streak);
  float g = fbm(p * 7.0 + 3.0) * 0.6 + fbm(p * 23.0) * 0.4;
  gl_FragColor = vec4(clamp(d, 0.0, 1.0), g, 0.0, 1.0);
}`;

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
  _etex(src, srgb = true) {
    const T = this.T,
      t = new T.Texture(src);
    t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
    t.wrapS = T.RepeatWrapping;
    t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    t.needsUpdate = true;
    return t;
  },
  _eflat(rgba) {
    const T = this.T,
      t = new T.DataTexture(new Uint8Array(rgba), 1, 1);
    t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  },
  // The planet and its atmosphere. Pictures: the embedded ones at once, the full-size ones as they arrive (cross-faded, see refreshEarth).
  _buildEarth(root, sunDir) {
    const T = this.T,
      S = this.scene,
      u = {
        uDayA: { value: null },
        uDayB: { value: null },
        uNightA: { value: null },
        uNightB: { value: null },
        uMask: { value: null },
        uCloud: { value: this._cloudTexture() },
        uSun: { value: new T.Vector3(...sunDir) },
        uFade: { value: 1 },
        uCloudAmt: { value: 1 },
        uLights: { value: 1 },
      };
    this._eu = u;
    this._et = { dayA: null, dayB: null, nightA: null, nightB: null, mask: null, flat: null };
    this._eSrc = { day: null, night: null };
    this._efade = null;
    const mat = new T.ShaderMaterial({ vertexShader: EARTH_VS, fragmentShader: EARTH_FS, uniforms: u });
    this.earthMat = mat;
    this._setEarthPictures(false);
    root.add(new T.Mesh(new T.SphereGeometry(1, IS_PHONE ? 72 : 96, IS_PHONE ? 48 : 64), mat));
    // Atmosphere glow: a shell far enough out that its edge is fully faded
    const au = { uSun: { value: new T.Vector3(...sunDir) }, uGain: { value: this.sim.cfg.spin ? 1.1 : 1 }, uScale: { value: 1 } };
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
    // Pictures that are not there yet: decode the embedded ones, then ask for the full-size ones (the hero waits for the page's idle prefetch)
    loadEmbeddedEarth().then(() => this.scene === S && this.refreshEarth());
    if (!earthImg) {
      const p = earthPromise || (this.sim.cfg.spin ? null : loadEarth(this.maxTex));
      p?.then((ok) => ok && this.scene === S && this.refreshEarth());
    }
    this._offNight = onNightArrived(() => this.scene === S && this.refreshEarth());
  },
  // Bind the best pictures now. `fade`: keep the ones on screen as the "A" side and blend to the new ones over 0.7 s, so the swap has no visible jump.
  _setEarthPictures(fade) {
    const T = this.T,
      u = this._eu,
      et = this._et,
      day = earthSource() || getLandCanvas(),
      night = earthNightSource();
    et.mask ||= (() => {
      const m = oceanMaskSource();
      return m ? this._etex(m, false) : this._eflat([0, 0, 0, 255]);
    })();
    if (et.mask.isDataTexture && oceanMaskSource()) {
      et.mask.dispose();
      et.mask = this._etex(oceanMaskSource(), false);
    }
    u.uMask.value = et.mask;
    const dispose = (t) => t && t !== et.dayB && t !== et.nightB && t.dispose();
    const dayNew = day !== this._eSrc.day,
      nightNew = night !== this._eSrc.night;
    if (dayNew) {
      const old = et.dayB;
      et.dayB = day ? this._etex(day) : (et.flat ||= this._eflat([6, 10, 22, 255]));
      et.dayA = fade && old ? old : et.dayB;
      this._eSrc.day = day;
    }
    if (nightNew) {
      const old = et.nightB;
      et.nightB = night ? this._etex(night) : (et.flat ||= this._eflat([6, 10, 22, 255]));
      et.nightA = fade && old ? old : et.nightB;
      this._eSrc.night = night;
    }
    if (!dayNew) et.dayA = et.dayB;
    if (!nightNew) et.nightA = et.nightB;
    u.uDayA.value = et.dayA;
    u.uDayB.value = et.dayB;
    u.uNightA.value = et.nightA;
    u.uNightB.value = et.nightB;
    if (fade && (dayNew || nightNew) && (et.dayA !== et.dayB || et.nightA !== et.nightB)) {
      u.uFade.value = 0;
      this._efade = performance.now();
      this._efadeTick();
    } else u.uFade.value = 1;
    void dispose;
  },
  _efadeTick() {
    cancelAnimationFrame(this._efadeRaf);
    const step = (now) => {
      const u = this._eu;
      if (!u || this._efade == null) return;
      const f = Math.min(1, (now - this._efade) / 700);
      u.uFade.value = f * f * (3 - 2 * f);
      if (f >= 1) {
        const et = this._et;
        for (const t of [et.dayA, et.nightA]) if (t && t !== et.dayB && t !== et.nightB && t !== et.flat) t.dispose();
        et.dayA = et.dayB;
        et.nightA = et.nightB;
        u.uDayA.value = et.dayB;
        u.uNightA.value = et.nightB;
        u.uFade.value = 1;
        this._efade = null;
        this.render();
        if (this._efadePending) {
          this._efadePending = false;
          this.refreshEarth();
        }
        return;
      }
      this.render();
      this._efadeRaf = requestAnimationFrame(step);
    };
    this._efadeRaf = requestAnimationFrame(step);
  },
  // A better picture has arrived (embedded decoded, full-size day, full-size night): blend to it.
  refreshEarth() {
    if (!this.earthMat) return;
    if (this._efade != null) {
      this._efadePending = true;
      return;
    }
    if (earthImg && !this._nightAsked) {
      this._nightAsked = true;
      loadEarthNight(this.maxTex);
    }
    const day = earthSource() || getLandCanvas(),
      night = earthNightSource();
    if (day === this._eSrc.day && night === this._eSrc.night) return;
    this._setEarthPictures(true);
    this.render();
  },
  // Per frame: clouds thin out as the camera comes close to the surface (they would hide the ground the scene is about).
  _earthFrame() {
    const u = this._eu;
    if (!u) return;
    const alt = this.camera.position.length() - 1;
    u.uCloudAmt.value = (this.sim.cfg.cloudK ?? 0.6) * Math.min(1, Math.max(0, (alt - 0.3) / 1.4));
  },
  _disposeEarth() {
    cancelAnimationFrame(this._efadeRaf);
    this._efade = null;
    this._efadePending = false;
    this._offNight?.();
    this._offNight = null;
    const et = this._et;
    if (et) for (const k of ['dayA', 'dayB', 'nightA', 'nightB', 'mask', 'flat']) et[k]?.dispose();
    this._et = this._eu = this._au = null;
  },
};
