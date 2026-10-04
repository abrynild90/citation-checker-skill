// ============================================================================
// scenes/earth.js: Earth textures: vector land canvas, NASA Blue Marble loader, sprite canvases
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
// ============================================================================
import { IS_PHONE } from './core.js';

export let LAND = null,
  landCanvas = null;
export function setLand(l) {
  LAND = l;
}
function drawLand(ctx, W, H, ocean, land, grat) {
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = grat;
  ctx.lineWidth = 1;
  for (let lo = -180; lo <= 180; lo += 30) {
    const x = ((lo + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let la = -60; la <= 60; la += 30) {
    const y = ((90 - la) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.fillStyle = land;
  for (const ring of LAND || []) {
    ctx.beginPath();
    for (let k = 0; k < ring.length; k += 2) {
      const x = ((ring[k] + 180) / 360) * W,
        y = ((90 - ring[k + 1]) / 180) * H;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
export function getLandCanvas() {
  if (landCanvas) return landCanvas;
  landCanvas = document.createElement('canvas');
  landCanvas.width = IS_PHONE ? 1024 : 2048;
  landCanvas.height = landCanvas.width / 2;
  drawLand(landCanvas.getContext('2d'), landCanvas.width, landCanvas.height, '#0d2a4d', '#2c5a4a', 'rgba(140,190,255,0.18)');
  return landCanvas;
}

// NASA Blue Marble and Black Marble (public domain) at 4096 x 2048, with the water mask and a relief map, are embedded in the page (<script id="cs-earth-hd">,
// see tools/build_page.py) and decoded the first time a 3D view needs them, so a scene never waits for a download. If they are missing the same day and night
// images are fetched from jsDelivr. Decoded pixels are cached on the CPU side; the GL host keeps one set of GPU textures for the life of the page.
export const EARTH_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.0/example/img/earth-blue-marble.jpg';
export const EARTH_NIGHT_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.0/example/img/earth-night.jpg';
export let earthPromise = null,
  earthImg = null,
  earthNightImg = null,
  earthWaterImg = null,
  earthReliefImg = null,
  nightPromise = null,
  hdPromise = null,
  oceanMask = null;
// Large pictures are downscaled on phones or GPUs that cannot hold a 4096 px texture.
function fit(img, maxTex) {
  const w = Math.min(img.naturalWidth, IS_PHONE ? 2048 : maxTex);
  if (w >= img.naturalWidth) return img;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = w / 2;
  c.getContext('2d').drawImage(img, 0, 0, w, w / 2);
  return c;
}
// Fetch one image from jsDelivr (the fallback when the embedded copies are missing).
function fetchImage(url, maxTex) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(fit(img, maxTex));
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
const decodeUrl = (src) =>
  new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
// Decode the embedded full-resolution pictures (once). Resolves true when the day picture is there.
export function loadEmbeddedHD(maxTex = 4096) {
  if (hdPromise) return hdPromise;
  const el = document.getElementById('cs-earth-hd');
  let data = null;
  try {
    data = el && el.textContent.trim() ? JSON.parse(el.textContent) : null;
  } catch (e) {
    data = null;
  }
  hdPromise = data?.day
    ? Promise.all([data.day, data.night, data.water, data.relief].map((u) => (u ? decodeUrl(u) : null))).then(([d, n, w, r]) => {
        if (d) earthImg = fit(d, maxTex);
        if (n) earthNightImg = fit(n, maxTex);
        earthWaterImg = w;
        earthReliefImg = r;
        return !!d;
      })
    : Promise.resolve(false);
  return hdPromise;
}
export function loadEarth(maxTex = 4096) {
  if (earthPromise) return earthPromise;
  earthPromise = loadEmbeddedHD(maxTex).then((ok) => {
    if (ok) return true;
    return fetchImage(EARTH_URL, maxTex).then((im) => {
      if (!im) {
        console.warn('Earth imagery unavailable; using the embedded small picture');
        return false;
      }
      earthImg = im;
      return true;
    });
  });
  return earthPromise;
}
export function loadEarthNight(maxTex = 4096) {
  nightPromise ||= loadEmbeddedHD(maxTex).then(() => {
    if (earthNightImg) return true;
    return fetchImage(EARTH_NIGHT_URL, maxTex).then((im) => {
      earthNightImg = im;
      return !!im;
    });
  });
  return nightPromise;
}
// Start decoding as soon as a visitor shows intent to open a 3D view (pointer over the hero, the tour button, a keyboard visit), so the first frame of
// the first view is already sharp. Nothing is decoded before that.
if (typeof document !== 'undefined')
  for (const [id, evs] of [
    ['heroStage', ['pointerenter', 'touchstart', 'pointerdown']],
    ['heroRot', ['pointerenter', 'focus', 'click']],
    ['tourBtn', ['pointerenter', 'focus', 'touchstart']],
  ]) {
    const el = document.getElementById(id);
    el && evs.forEach((e) => el.addEventListener(e, () => loadEmbeddedHD(), { once: true, passive: true }));
  }
export const earthReady = () => !!earthImg;
// Water mask (for the sun glint on the sea): the embedded water picture when it is there (white is water), otherwise blue-dominant pixels of the day
// picture, built once from whichever picture is available first.
export function oceanMaskSource() {
  if (earthWaterImg) return earthWaterImg;
  if (oceanMask) return oceanMask;
  const src = earthImg || earthLow;
  if (!src) return null;
  const m = document.createElement('canvas');
  m.width = 1024;
  m.height = 512;
  const g = m.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0, 1024, 512);
  const d = g.getImageData(0, 0, 1024, 512),
    p = d.data;
  for (let k = 0; k < p.length; k += 4) {
    const water = p[k + 2] > p[k] * 1.25 && p[k + 2] > p[k + 1] * 1.05 && p[k] < 150;
    const v = water ? 200 : 18;
    p[k] = p[k + 1] = p[k + 2] = v;
  }
  g.putImageData(d, 0, 0);
  oceanMask = m;
  return m;
}

// City lights: the warm pixels of a night picture as one 8-bit channel (row 0 is the south pole, ready for an un-flipped data texture), with its own mip
// levels where each texel is the brightest of its 2 x 2 block. Averaging would dim the lights as the Earth gets smaller; this keeps them crisp at any
// size without a glow. Built once per picture in slices, so the page never stalls.
const lightsCache = new Map(),
  lightsDone = new Map();
export const lightsIfReady = (img) => (img ? lightsDone.get(img) || null : null);
const idle = () => new Promise((r) => setTimeout(r, 0));
export function lightsFor(img) {
  if (!img) return Promise.resolve(null);
  if (lightsCache.has(img)) return lightsCache.get(img);
  const job = (async () => {
    const W = img.naturalWidth || img.width,
      H = img.naturalHeight || img.height,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, W, H).data,
      base = new Uint8Array(W * H),
      rows = Math.max(16, Math.floor(1_000_000 / W));
    for (let y0 = 0; y0 < H; y0 += rows) {
      for (let y = y0; y < Math.min(H, y0 + rows); y++) {
        let o = 4 * y * W,
          q = (H - 1 - y) * W;
        for (let x = 0; x < W; x++, o += 4, q++) {
          const v = (1.25 * px[o] - 0.75 * px[o + 2] + 0.25 * px[o + 1]) / 255 - 0.012;
          base[q] = v <= 0 ? 0 : Math.min(255, Math.pow(v, 0.72) * 3 * 255);
        }
      }
      await idle();
    }
    const levels = [{ data: base, width: W, height: H }];
    for (let w = W, h = H, prev = base; w > 1 || h > 1;) {
      const nw = Math.max(1, w >> 1),
        nh = Math.max(1, h >> 1),
        out = new Uint8Array(nw * nh);
      for (let y = 0; y < nh; y++)
        for (let x = 0; x < nw; x++) {
          const x0 = Math.min(w - 1, 2 * x),
            x1 = Math.min(w - 1, 2 * x + 1),
            y0 = Math.min(h - 1, 2 * y),
            y1 = Math.min(h - 1, 2 * y + 1);
          out[y * nw + x] = Math.max(prev[y0 * w + x0], prev[y0 * w + x1], prev[y1 * w + x0], prev[y1 * w + x1]);
        }
      levels.push({ data: out, width: nw, height: nh });
      prev = out;
      w = nw;
      h = nh;
      if (levels.length % 3 === 0) await idle();
    }
    lightsDone.set(img, levels);
    return levels;
  })();
  lightsCache.set(img, job);
  return job;
}

// Small day and night images of the Earth are embedded in the page (<script id="cs-earth">, about 120 KB), so the first picture of the planet never waits
// for the network. earthLow / earthNightLow are decoded images (null until loadEmbeddedEarth() resolves); the full-size NASA images above replace them
// when they arrive. earthSource() is whichever is best right now (full-size, else embedded).
export let earthLow = null,
  earthNightLow = null,
  embeddedPromise = null;
export function loadEmbeddedEarth() {
  if (embeddedPromise) return embeddedPromise;
  const el = document.getElementById('cs-earth'),
    data = el ? JSON.parse(el.textContent) : null,
    decode = (src) =>
      new Promise((res) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = src;
      });
  embeddedPromise = data
    ? Promise.all([decode(data.day), decode(data.night)]).then(([d, n]) => {
        earthLow = d;
        earthNightLow = n;
        return !!d;
      })
    : Promise.resolve(false);
  return embeddedPromise;
}
export const earthSource = () => earthImg || earthLow;
export const earthNightSource = () => earthNightImg || earthNightLow;

// Soft round sprite + shock-ring sprite, drawn once on the CPU.
let spriteCv = null,
  ringCv = null;
export function spriteCanvas() {
  if (spriteCv) return spriteCv;
  spriteCv = document.createElement('canvas');
  spriteCv.width = spriteCv.height = 64;
  const g = spriteCv.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return spriteCv;
}
export function ringCanvas() {
  if (ringCv) return ringCv;
  ringCv = document.createElement('canvas');
  ringCv.width = ringCv.height = 128;
  const g = ringCv.getContext('2d');
  const r = g.createRadialGradient(64, 64, 40, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0)');
  r.addColorStop(0.7, 'rgba(255,255,255,0.9)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return ringCv;
}

// Beam ribbon texture: soft gaussian falloff across the width (used for the core and the halo of every beam).
let beamCv = null;
export function beamCanvas() {
  if (beamCv) return beamCv;
  beamCv = document.createElement('canvas');
  beamCv.width = 64;
  beamCv.height = 4;
  const g = beamCv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 64, 0);
  for (let k = 0; k <= 16; k++) {
    const x = k / 16,
      a = Math.exp(-Math.pow((x - 0.5) / 0.5, 2) * 3.6) * (1 - Math.pow(Math.abs(x - 0.5) * 2, 6));
    gr.addColorStop(x, `rgba(255,255,255,${a.toFixed(3)})`);
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 4);
  return beamCv;
}
// Solar-panel cell texture for the satellite models.
let panelCv = null;
export function panelCanvas() {
  if (panelCv) return panelCv;
  panelCv = document.createElement('canvas');
  panelCv.width = 64;
  panelCv.height = 32;
  const g = panelCv.getContext('2d');
  g.fillStyle = '#2c5db0';
  g.fillRect(0, 0, 64, 32);
  g.strokeStyle = 'rgba(190,215,255,0.65)';
  g.lineWidth = 1;
  for (let x = 0; x <= 64; x += 8) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, 32);
    g.stroke();
  }
  for (let y = 0; y <= 32; y += 8) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(64, y + 0.5);
    g.stroke();
  }
  return panelCv;
}
