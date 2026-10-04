// ============================================================================
// scenes/svg/upgrade.js: the photographic Earth arrives in two steps and is painted into the diagram that is already on the page, so nothing is redrawn and
// nothing jumps: first the small day and night images embedded in the page (drawn by a worker within a fraction of a second), then, in the scene viewer
// and for a reduced-motion hero, the full NASA image (fetched once). Only the Earth's picture is replaced; the layout, labels and stars stay as they were.
// ============================================================================
import { earthImg, loadEarth } from '../earth.js';
import { earthLevel, earthRaster, prewarmEarth } from './earth-raster.js';

const tracked = new Set(); // diagram <svg> nodes whose Earth is not yet painted with the best imagery they will get
let fullPending = false;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVGNS = 'http://www.w3.org/2000/svg';

// Puts a raster into a diagram's Earth slot: the first time it is added (and dissolves in unless motion is reduced), later it replaces the picture in place.
export function applyEarth(node, ras, level) {
  const e = node.__earth;
  const first = !e.image;
  if (first) {
    e.image = document.createElementNS(SVGNS, 'image');
    e.image.setAttribute('preserveAspectRatio', 'none');
    e.layer.appendChild(e.image);
  }
  const im = e.image;
  im.setAttribute('x', ras.x);
  im.setAttribute('y', ras.y);
  im.setAttribute('width', ras.w);
  im.setAttribute('height', ras.h);
  if (first && e.fade && !reducedMotion()) {
    im.style.opacity = '0';
    im.setAttribute('href', ras.url);
    requestAnimationFrame(() => {
      im.style.transition = 'opacity .3s ease-out';
      im.style.opacity = '1';
    });
  } else im.setAttribute('href', ras.url);
  if (e.vec) {
    const vec = e.vec;
    e.vec = null;
    setTimeout(() => vec.remove(), first && e.fade && !reducedMotion() ? 340 : 0);
  }
  e.level = level;
  node.dataset.earth = level >= 2 ? 'bluemarble' : 'embedded';
  node.dataset.ss = ras.ss.toFixed(2);
  if (e.root) {
    e.root.dataset.earth = node.dataset.earth;
    e.root.dataset.ss = node.dataset.ss;
  }
}

// Paints (or re-paints) one diagram's Earth with the best imagery available now, without blocking the page.
export function paintEarth(node) {
  const e = node.__earth,
    level = earthLevel();
  if (!e || level < 1 || e.level >= level || e.busy >= level) return;
  e.busy = level;
  earthRaster(e.rot, e.GX, e.GY, e.GR, e.win, e.ss, level).then((ras) => {
    if (e.busy === level) e.busy = 0;
    if (ras && node.isConnected && e.level < level) applyEarth(node, ras, level);
  });
}

export function refreshEarth() {
  for (const node of [...tracked]) {
    const e = node.__earth;
    if (!e || (e.level >= (e.full ? 2 : 1) && !e.busy)) tracked.delete(node);
    else if (!node.isConnected && e.age++ > 2) tracked.delete(node);
    else paintEarth(node);
  }
}

// A diagram announces its Earth slot: node.__earth = { rot, GX, GY, GR, win, ss, layer, full, level, image, vec, root }. It is painted at once when imagery is
// available, and again when better imagery arrives.
export function trackEarth(node) {
  node.__earth.age = 0;
  tracked.add(node);
  prewarmEarth();
  paintEarth(node);
}

// The scene viewer upgrades to the full image; the hero does only under reduced motion (it is then the final picture), and only after the page has loaded
// and gone idle: the first paint never waits for it.
export const wantsFullEarth = (el, sim) => el.id === 'sceneView' || (reducedMotion() && !!sim.cfg.spin);

export function requestFullEarth(sim) {
  if (earthImg || fullPending) return;
  fullPending = true;
  const go = () =>
    loadEarth(2048).then((ok) => {
      fullPending = false;
      if (ok) refreshEarth();
    });
  const idle = (f) => (window.requestIdleCallback || setTimeout)(f);
  if (sim.cfg.spin && document.readyState !== 'complete') addEventListener('load', () => idle(go), { once: true });
  else if (sim.cfg.spin) idle(go);
  else go();
}
