// ============================================================================
// scenes/earth.js: Earth textures: vector land canvas, NASA Blue Marble loader, sprite canvases
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes.js.)
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

// NASA Blue Marble (public domain), pinned on jsDelivr. Fetched lazily after the page
// has rendered (never part of the initial page); the vector land map is used until
// it arrives or if it fails. Decoded pixels are cached on the CPU side only; each scene
// creates its own GPU texture and disposes it on close.
export const EARTH_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.0/example/img/earth-blue-marble.jpg';
export let earthPromise = null,
  earthImg = null,
  oceanMask = null;
export function loadEarth(maxTex = 4096) {
  if (earthPromise) return earthPromise;
  earthPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      // Downscale on phones or GPUs that cannot hold a 4096 px texture.
      const w = Math.min(img.naturalWidth, IS_PHONE ? 2048 : maxTex);
      if (w < img.naturalWidth) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = w / 2;
        c.getContext('2d').drawImage(img, 0, 0, w, w / 2);
        earthImg = c;
      } else earthImg = img;
      // Low-res ocean mask (for sun glint): blue-dominant pixels are water.
      const m = document.createElement('canvas');
      m.width = 1024;
      m.height = 512;
      const g = m.getContext('2d');
      g.drawImage(img, 0, 0, 1024, 512);
      const d = g.getImageData(0, 0, 1024, 512),
        p = d.data;
      for (let k = 0; k < p.length; k += 4) {
        const water = p[k + 2] > p[k] * 1.25 && p[k + 2] > p[k + 1] * 1.05 && p[k] < 150;
        const v = water ? 200 : 18;
        p[k] = p[k + 1] = p[k + 2] = v;
      }
      g.putImageData(d, 0, 0);
      oceanMask = m;
      resolve(true);
    };
    img.onerror = () => {
      console.warn('Earth imagery unavailable; using vector map');
      resolve(false);
    };
    img.src = EARTH_URL;
  });
  return earthPromise;
}
export const earthReady = () => !!earthImg;

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
