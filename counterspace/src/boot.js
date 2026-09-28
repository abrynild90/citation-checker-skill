// Boot sequence, theme toggle, resize handling and test hooks.
// ---------------------------------------------------------------- theme toggle (in memory only)
document.getElementById('themeBtn').onclick = () => {
  const root = document.documentElement; const now = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.dataset.theme = now === 'light' ? 'dark' : 'light'; // every chart colour is a CSS variable, so no redraw is needed
};

// ---------------------------------------------------------------- boot
// Above-the-fold pieces draw first; the rest is drawn on the next task (or on demand by audit/export).
// Charts below the fold (C, B, lag) are drawn when they come within 700 px of the viewport, or on demand by audit/export.
const LAZY = { svgC: () => drawC(), svgB: () => drawB(), svgL: () => drawL() };
const drawnLazy = new Set();
let lazyIO = null;
function drawLazy(id) { if (drawnLazy.has(id)) return; drawnLazy.add(id); lazyIO?.unobserve(document.getElementById(id)); LAZY[id](); }
function drawRest() { Object.keys(LAZY).forEach(drawLazy); legalScroll(); }
function drawAll(lazy = false) {
  guides.length = 0; drawnLazy.clear(); lazyIO?.disconnect(); lazyIO = null;
  drawLegal(); drawLegal(document.getElementById('legalZoom'), true); drawA();
  if (!lazy || !('IntersectionObserver' in window)) return drawRest();
  lazyIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && drawLazy(e.target.id)), { rootMargin: '700px 0px' });
  Object.keys(LAZY).forEach(id => lazyIO.observe(document.getElementById(id)));
  // Anything still undrawn is filled in when the browser is idle, so deep links, find-in-page and tests never meet an empty chart.
  (window.requestIdleCallback || (f => setTimeout(f, 300)))(() => Object.keys(LAZY).forEach(drawLazy), { timeout: 1500 });
}
chipsB(); drawLegalKey(); drawAll(true); drawMethod();
// Three.js is fetched only once the hero is on screen.
new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); startHero(); } }).observe(heroStage);
// Earth imagery (~1.5 MB) is not part of the page: it is prefetched once the page has
// loaded and the browser is idle, and skipped entirely without WebGL or with reduced motion.
function prefetchEarth() { getHost().then(h => { if (h) loadEarth(h.maxTex).then(ok => { if (ok) host?.refreshEarth(); }); }); }
addEventListener('load', () => (window.requestIdleCallback || (f => setTimeout(f, 1200)))(prefetchEarth, { timeout: 4000 }));
let rz = 0, lastW = innerWidth; addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(() => drawAll(true), 150); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });

// Test / export hooks (no storage).
window.__cs = { earthReady, EARTH_URL, exportSVG, audit, openScene, closeScene, memory: () => host?.memory(), contexts: () => document.querySelectorAll('canvas').length, scenes: ORDER.map(s => s.id), host: () => host };

