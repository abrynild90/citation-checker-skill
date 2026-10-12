// ============================================================================
// scenes/svg/earth-raster.js: the photographic Earth of the still diagrams (day and night images lit by one sun, drawn pixel by pixel onto an orthographic
// disc), and the vector coastline geometry used only when no image is available.
// The pixel loop is a pure function (rasterCore). The page calls it in a worker, so the first picture never blocks the main thread (the loop is slow only
// while the browser's compiler warms up: about 100 ms on the first call); the saved image and a failed worker use it directly.
// ============================================================================
import { IS_PHONE } from '../core.js';
import { LAND, earthImg, earthNightLow, earthSource, loadEmbeddedEarth } from '../earth.js';

const DEG = Math.PI / 180;

// The sun, as a direction in the diagram's own view basis (x right, y up, z toward the viewer): from the upper left and a little toward the viewer, so every
// diagram shows a lit planet (about 70% of the disc), a soft terminator and a dark crescent with city lights at the lower right. One constant, so it can be
// aligned with the live scenes' sun in a single edit.
const SUN_RAW = [-0.74, 0.5, 0.44];
export const SUN_VIEW = SUN_RAW.map((c) => c / Math.hypot(...SUN_RAW));

export const hasEmbeddedEarth = () => !!document.getElementById('cs-earth');
// Which imagery is available now: 2 the full NASA image, 1 the small images embedded in the page, 0 none.
export const earthLevel = () => (earthImg ? 2 : hasEmbeddedEarth() ? 1 : 0);

// World (lon, lat in degrees) to unit cartesian, the frame d3.geoRotation works in.
const cart = ([lo, la]) => [Math.cos(la * DEG) * Math.cos(lo * DEG), Math.cos(la * DEG) * Math.sin(lo * DEG), Math.sin(la * DEG)];

// ---------------------------------------------------------------- the pixel loop
// Self-contained on purpose (no outer names): its source text is also what the worker runs.
// P: {SW, SH, wx0, wy0, k, CX, CY, invR, rmax2, e: 9 numbers (view axes in world coordinates), sun: [3], half: [3]}; day, night: {w, h, d} pixel arrays.
// Every pixel of the disc is inverted to a longitude and a latitude, sampled bilinearly, lit by the sun (diffuse day side, soft terminator, city lights and a
// dim blue glow on the dark side, a glint on the ocean, blue haze at the limb). Returns RGBA bytes.
function rasterCore(P, day, night) {
  // polynomial atan2 and asin (errors under 1e-4 rad, far below one texel)
  const atan2f = (y, x) => {
    const ax = x < 0 ? -x : x,
      ay = y < 0 ? -y : y,
      mx = ax > ay ? ax : ay,
      a = (ax > ay ? ay : ax) / (mx || 1e-30),
      s = a * a;
    let r = (-0.0464964749 * s + 0.15931422) * s * s * a - 0.327622764 * s * a + a;
    if (ay > ax) r = 1.5707963 - r;
    if (x < 0) r = 3.1415927 - r;
    return y < 0 ? -r : r;
  };
  const asinf = (x) => {
    const ax = x < 0 ? -x : x,
      r = 1.5707963 - Math.sqrt(1 - ax) * (1.5707288 + ax * (-0.2121144 + ax * (0.074261 - 0.0187293 * ax)));
    return x < 0 ? -r : r;
  };
  const { SW, SH, wx0, wy0, k, CX, CY, invR, rmax2, e, sun, half } = P,
    [e0x, e0y, e0z, e1x, e1y, e1z, e2x, e2y, e2z] = e,
    [sx, sy, sz] = sun,
    [hx, hy, hz] = half,
    { w: dW, h: dH, d: dD } = day,
    nW = night ? night.w : 0,
    nH = night ? night.h : 0,
    nD = night ? night.d : null,
    INV2PI = 0.5 / Math.PI,
    INVPI = 1 / Math.PI,
    o = new Uint8ClampedArray(SW * SH * 4);
  let seed = 12345;
  for (let j = 0; j < SH; j++) {
    const yy0 = -((wy0 + (j + 0.5) * k - CY) * invR);
    for (let i = 0; i < SW; i++) {
      let xx = (wx0 + (i + 0.5) * k - CX) * invR,
        yy = yy0,
        zz;
      const r2 = xx * xx + yy * yy;
      if (r2 >= 1) {
        // a pixel or two beyond the rim carries the rim's colours outward, so the anti-aliased clip edge never shows a dark fringe
        if (r2 > rmax2) continue;
        const s = 1 / Math.sqrt(r2);
        xx *= s;
        yy *= s;
        zz = 0;
      } else zz = Math.sqrt(1 - r2);
      const wx = xx * e0x + yy * e1x + zz * e2x,
        wy = xx * e0y + yy * e1y + zz * e2y,
        wz = xx * e0z + yy * e1z + zz * e2z,
        ul = atan2f(wy, wx) * INV2PI + 0.5, // 0..1 across the image
        vl = 0.5 - asinf(wz < -1 ? -1 : wz > 1 ? 1 : wz) * INVPI; // 0 at the north pole
      // --- day image, bilinear
      const u = ul * dW - 0.5,
        v = vl * dH - 0.5;
      let u0 = ((u + 1) | 0) - 1;
      const fx = u - u0;
      if (u0 < 0) u0 += dW;
      else if (u0 >= dW) u0 -= dW;
      const ib = u0 + 1 === dW ? 0 : u0 + 1;
      let v0 = ((v + 1) | 0) - 1,
        fy = v - v0;
      if (v0 < 0) {
        v0 = 0;
        fy = 0;
      } else if (v0 > dH - 2) {
        v0 = dH - 2;
        fy = 1;
      }
      const a = (v0 * dW + u0) * 4,
        b = (v0 * dW + ib) * 4,
        cc = ((v0 + 1) * dW + u0) * 4,
        dd = ((v0 + 1) * dW + ib) * 4,
        w00 = (1 - fx) * (1 - fy),
        w10 = fx * (1 - fy),
        w01 = (1 - fx) * fy,
        w11 = fx * fy;
      const tr = dD[a] * w00 + dD[b] * w10 + dD[cc] * w01 + dD[dd] * w11,
        tg = dD[a + 1] * w00 + dD[b + 1] * w10 + dD[cc + 1] * w01 + dD[dd + 1] * w11,
        tb = dD[a + 2] * w00 + dD[b + 2] * w10 + dD[cc + 2] * w01 + dD[dd + 2] * w11;
      // --- light
      const ndl = xx * sx + yy * sy + zz * sz;
      let t = ndl / 0.34;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const lam = ndl > 0 ? (ndl > 0.9 ? 1 : ndl / 0.9) : 0,
        dayK = t * t * (3 - 2 * t) * (0.6 + 0.40 * lam); // soft terminator, gentle form shading
      // dim blue light on the dark side keeps the continents readable
      let r = tr * (dayK + 0.03),
        gr = tg * (dayK + 0.05),
        bl = tb * (dayK + 0.11);
      // warm band along the terminator
      if (ndl > -0.08 && ndl < 0.3) {
        const tw = 1 - Math.abs(ndl - 0.09) / 0.21,
          tk = tw * tw * 0.1 * (tr + tg + tb);
        r += tk * 0.62;
        gr += tk * 0.2;
        bl -= tk * 0.12;
      }
      // --- city lights on the dark side
      if (nD && ndl < 0.2) {
        let nt = (0.2 - ndl) / 0.3;
        nt = nt > 1 ? 1 : nt;
        const un = ul * nW - 0.5,
          vn = vl * nH - 0.5;
        let n0 = ((un + 1) | 0) - 1;
        const nfx = un - n0;
        if (n0 < 0) n0 += nW;
        else if (n0 >= nW) n0 -= nW;
        const nb2 = n0 + 1 === nW ? 0 : n0 + 1;
        let m0 = ((vn + 1) | 0) - 1,
          nfy = vn - m0;
        if (m0 < 0) {
          m0 = 0;
          nfy = 0;
        } else if (m0 > nH - 2) {
          m0 = nH - 2;
          nfy = 1;
        }
        const pa = (m0 * nW + n0) * 4,
          pb = (m0 * nW + nb2) * 4,
          pc = ((m0 + 1) * nW + n0) * 4,
          pd = ((m0 + 1) * nW + nb2) * 4,
          q00 = (1 - nfx) * (1 - nfy),
          q10 = nfx * (1 - nfy),
          q01 = (1 - nfx) * nfy,
          q11 = nfx * nfy;
        let L =
          nD[pa] * q00 + nD[pb] * q10 + nD[pc] * q01 + nD[pd] * q11 + (nD[pa + 1] * q00 + nD[pb + 1] * q10 + nD[pc + 1] * q01 + nD[pd + 1] * q11) * 0.6 -
          (nD[pa + 2] * q00 + nD[pb + 2] * q10 + nD[pc + 2] * q01 + nD[pd + 2] * q11) * 1.1 -
          10;
        if (L > 0) {
          L = Math.min(255, L * 1.9) * nt * nt * (3 - 2 * nt);
          r += L;
          gr += L * 0.78;
          bl += L * 0.42;
        }
      }
      // --- ocean glint
      if (ndl > 0) {
        const ch = xx * hx + yy * hy + zz * hz;
        if (ch > 0.97) {
          let wat = (tb - tr * 1.1 - 8) / 55;
          wat = wat < 0 ? 0 : wat > 1 ? 1 : wat;
          if (wat > 0) {
            const c2 = ch * ch,
              c4 = c2 * c2,
              c8 = c4 * c4,
              c16 = c8 * c8,
              c32 = c16 * c16,
              sp = c32 * c32 * c32 * c8 * wat * 42; // a small soft highlight (about ch^200)
            r += sp;
            gr += sp * 0.96;
            bl += sp * 0.88;
          }
        }
      }
      // --- haze at the limb (atmosphere seen edge-on), brighter where the sun lights it
      const f = 1 - zz;
      if (f > 0.08) {
        const fr = f * f * Math.sqrt(f);
        let lit = (ndl + 0.25) / 0.75;
        lit = lit < 0 ? 0 : lit > 1 ? 1 : lit;
        const rim = fr * (0.12 + 0.88 * lit * lit * (3 - 2 * lit));
        r += rim * 40;
        gr += rim * 85;
        bl += rim * 140;
      }
      // --- write (tiny dither against banding in the dark gradients)
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const dn = (seed >>> 24) / 255 - 0.5,
        q = (j * SW + i) * 4;
      const lum = 0.2126 * r + 0.7152 * gr + 0.0722 * bl;
      o[q] = r * 0.9 + lum * 0.1 + dn;
      o[q + 1] = gr * 0.9 + lum * 0.1 + dn;
      o[q + 2] = bl * 0.9 + lum * 0.1 + dn;
      o[q + 3] = 255;
    }
  }
  return o;
}

// ---------------------------------------------------------------- geometry
// Everything the loop needs for one view: the raster's size and position, and the view basis in world coordinates.
// win: only the part of the disc inside this window (svg px) is rasterised (a big limb arc in a small panel). ss: raster pixels per CSS pixel.
function viewParams(rot, CX, CY, R, win, ss) {
  const S = Math.max(64, Math.min(Math.round(2 * R * ss), 2400)),
    k = (2 * R) / S,
    pad = 2 * k,
    wx0 = win ? Math.max(CX - R - pad, win.x0) : CX - R - pad,
    wy0 = win ? Math.max(CY - R - pad, win.y0) : CY - R - pad,
    wx1 = win ? Math.min(CX + R + pad, win.x1) : CX + R + pad,
    wy1 = win ? Math.min(CY + R + pad, win.y1) : CY + R + pad,
    invR = 1 / R,
    [sx, sy, sz] = SUN_VIEW,
    hl = Math.hypot(sx, sy, sz + 1);
  return {
    SW: Math.max(1, Math.ceil((wx1 - wx0) / k)),
    SH: Math.max(1, Math.ceil((wy1 - wy0) / k)),
    wx0,
    wy0,
    k,
    CX,
    CY,
    invR,
    rmax2: (1 + pad * invR) * (1 + pad * invR),
    // view basis -> world: the world vectors of the view's right, up and toward-viewer axes
    e: [...cart(rot.invert([90, 0])), ...cart(rot.invert([0, 90])), ...cart(rot.invert([0, 0]))],
    sun: SUN_VIEW,
    half: [sx / hl, sy / hl, (sz + 1) / hl], // half vector between the sun and the viewer (ocean glint)
    ss: S / (2 * R),
  };
}
const resultOf = (P, url) => ({ url, x: P.wx0, y: P.wy0, w: P.SW * P.k, h: P.SH * P.k, ss: P.ss });
const keyOf = (P, level) =>
  [level, P.SW, P.SH, P.wx0.toFixed(1), P.wy0.toFixed(1), P.CX.toFixed(1), P.CY.toFixed(1), P.k.toFixed(4), ...P.e.map((v) => v.toFixed(5))].join('|');

// Decoded pixels of an equirectangular image at up to maxW wide, cached per image object and width (the embedded images and the full NASA image are
// different objects).
const pixCache = new WeakMap();
function pixels(img, maxW) {
  if (!img) return null;
  const iw = img.naturalWidth || img.width,
    sw = Math.min(maxW, iw),
    per = pixCache.get(img) || pixCache.set(img, new Map()).get(img);
  if (per.has(sw)) return per.get(sw);
  const ih = img.naturalHeight || img.height,
    sh = Math.max(2, Math.round((sw * ih) / iw)),
    c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, sw, sh);
  const p = { w: sw, h: sh, d: g.getImageData(0, 0, sw, sh).data };
  per.set(sw, p);
  return p;
}
// The widest day image any raster uses: 4096 px where memory allows (the saved image magnifies the Earth about 12 times per degree), 2048 on a phone.
const MAX_TEX = IS_PHONE ? 2048 : 4096;

// ---------------------------------------------------------------- synchronous raster (the saved image, and the fallback when no worker is available)
export function earthRasterSync(rot, CX, CY, R, win, ss = 2, hi = false) {
  const src = earthSource();
  if (!src) return null;
  const t0 = performance.now();
  try {
    const P = viewParams(rot, CX, CY, R, win, ss),
      px = rasterCore(P, pixels(src, hi ? MAX_TEX : 2048), pixels(earthNightLow, hi ? MAX_TEX : 2048)),
      // a CPU-backed canvas: the pixels are encoded without a round trip through the graphics card
      c = document.createElement('canvas');
    c.width = P.SW;
    c.height = P.SH;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.putImageData(new ImageData(px, P.SW, P.SH), 0, 0);
    const url = c.toDataURL('image/jpeg', 0.92);
    performance.measure('cs:earth-raster', { start: t0, end: performance.now() }); // shows in window.__cs.perf()
    return resultOf(P, url);
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------- the worker
// It decodes the embedded images itself (off the main thread), keeps them, and answers raster requests with a JPEG data URL.
function workerMain(core) {
  const tex = {};
  const prep = async (src, maxW) => {
    const bmp = typeof src === 'string' ? await createImageBitmap(await (await fetch(src)).blob()) : src,
      sw = Math.min(maxW, bmp.width),
      sh = Math.max(2, Math.round((sw * bmp.height) / bmp.width)),
      g = new OffscreenCanvas(sw, sh).getContext('2d', { willReadFrequently: true });
    g.drawImage(bmp, 0, 0, sw, sh);
    if (bmp.close) bmp.close();
    return { w: sw, h: sh, d: g.getImageData(0, 0, sw, sh).data };
  };
  self.onmessage = async (ev) => {
    const m = ev.data;
    try {
      if (m.type === 'tex') {
        tex[m.name] = prep(m.src, m.maxW);
        await tex[m.name];
      } else if (m.type === 'raster') {
        const day = await tex.day,
          night = tex.night ? await tex.night : null,
          px = core(m.P, day, night),
          c = new OffscreenCanvas(m.P.SW, m.P.SH);
        c.getContext('2d', { willReadFrequently: true }).putImageData(new ImageData(px, m.P.SW, m.P.SH), 0, 0);
        const blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
        self.postMessage({ id: m.id, url: new FileReaderSync().readAsDataURL(blob) });
      }
    } catch (err) {
      self.postMessage({ id: m.id, error: String(err) });
    }
  };
}

let worker = null,
  workerLevel = 0,
  workerDead = false,
  seq = 0;
const waiting = new Map();
const cache = new Map(); // key -> data URL, newest last (a handful of views: a resize back to a size already drawn costs nothing)

function failWorker(why) {
  workerDead = true;
  worker = null;
  for (const [, w] of waiting) w.reject(new Error(why));
  waiting.clear();
}
function startWorker() {
  if (worker || workerDead) return worker;
  try {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') throw new Error('no worker');
    const code = `const core = ${rasterCore.toString()};\n(${workerMain.toString()})(core);`,
      url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = (ev) => {
      const w = waiting.get(ev.data.id);
      if (!w) return;
      waiting.delete(ev.data.id);
      if (ev.data.error) w.reject(new Error(ev.data.error));
      else w.resolve(ev.data.url);
    };
    worker.onerror = () => failWorker('worker error');
    const data = JSON.parse(document.getElementById('cs-earth').textContent);
    worker.postMessage({ type: 'tex', name: 'day', src: data.day, maxW: 2048 });
    worker.postMessage({ type: 'tex', name: 'night', src: data.night, maxW: 2048 });
    workerLevel = 1;
  } catch (e) {
    failWorker(String(e));
  }
  return worker;
}
// Starts the worker (and its decoding of the embedded images) now, so it is ready when the first diagram asks.
export function prewarmEarth() {
  if (hasEmbeddedEarth()) startWorker();
}
async function sendFullImage() {
  // the full NASA image replaces the embedded day image in the worker (decoded there too)
  const bmp = await createImageBitmap(earthImg);
  worker.postMessage({ type: 'tex', name: 'day', src: bmp, maxW: MAX_TEX }, [bmp]);
  workerLevel = 2;
}

// The Earth for one view, as a promise of {url, x, y, w, h, ss} (null when no imagery can be drawn). `level` is the imagery wanted (1 embedded, 2 full).
export async function earthRaster(rot, CX, CY, R, win, ss = 2, level = earthLevel()) {
  if (level < 1) return null;
  const P = viewParams(rot, CX, CY, R, win, ss),
    key = keyOf(P, level);
  if (cache.has(key)) return resultOf(P, cache.get(key));
  if (startWorker()) {
    try {
      if (level >= 2 && workerLevel < 2 && earthImg) await sendFullImage();
      const url = await new Promise((resolve, reject) => {
        const id = ++seq;
        waiting.set(id, { resolve, reject });
        worker.postMessage({ type: 'raster', id, P });
      });
      cache.set(key, url);
      if (cache.size > 8) cache.delete(cache.keys().next().value);
      return resultOf(P, url);
    } catch (e) {
      failWorker(String(e));
    }
  }
  // no worker: the same loop on the main thread, once the browser has had a moment to draw the page
  await loadEmbeddedEarth();
  await new Promise((r) => setTimeout(r, 0));
  const ras = earthRasterSync(rot, CX, CY, R, win, ss);
  if (ras) cache.set(key, ras.url);
  return ras;
}
// A raster already computed for this view, or null (so a redraw at an unchanged size paints the Earth at once).
export function cachedEarth(rot, CX, CY, R, win, ss = 2, level = earthLevel()) {
  const P = viewParams(rot, CX, CY, R, win, ss),
    full = cache.get(keyOf(P, 2)),
    url = full || cache.get(keyOf(P, level));
  return url ? { ...resultOf(P, url), level: full ? 2 : level } : null;
}

// Land as one MultiPolygon. Ring winding is data-dependent: any ring that d3 reads as "more than a hemisphere" is reversed so it fills land,
// not the complement.
export function landGeometry() {
  return {
    type: 'MultiPolygon',
    coordinates: (LAND || []).map((r) => {
      const c = [];
      for (let k = 0; k < r.length; k += 2) c.push([r[k], r[k + 1]]);
      if (c.length > 2 && d3.geoArea({ type: 'Polygon', coordinates: [c] }) > 2 * Math.PI) c.reverse();
      return [c];
    }),
  };
}
