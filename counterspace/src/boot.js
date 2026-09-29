// ============================================================================
// boot.js: first draw, lazy drawing, resize, theme toggle and the window.__cs test hooks.
// Needs: every other module. Runs last.
// ============================================================================
document.getElementById('themeBtn').onclick = () => {
  const root = document.documentElement; const now = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.dataset.theme = now === 'light' ? 'dark' : 'light'; // every chart colour is a CSS variable, so no redraw is needed
};

// ---------------------------------------------------------------- boot
// Above-the-fold pieces draw first; the rest is drawn on the next task (or on demand by audit/export).
// Charts below the fold (C, B, lag) and the sources section are drawn when they come within 700 px of the viewport, or on demand by audit/export.
const idle = (f, timeout) => (window.requestIdleCallback || (g => setTimeout(g, 200)))(f, { timeout });
const LAZY = { svgC: () => drawC(), svgB: () => drawB(), svgL: () => drawL(), methodBody: drawMethod }; // the sources section is below the fold too
const drawnLazy = new Set();
let lazyIO = null;
function drawLazy(id) { if (drawnLazy.has(id)) return; drawnLazy.add(id); lazyIO?.unobserve(document.getElementById(id)); timed('draw-' + id, LAZY[id]); }
function drawRest() { Object.keys(LAZY).forEach(drawLazy); legalScroll(); }
function drawAll(lazy = false) {
  guides.length = 0; drawnLazy.delete('svgC'); drawnLazy.delete('svgB'); drawnLazy.delete('svgL'); lazyIO?.disconnect(); lazyIO = null;
  timed('draw-legal', () => drawLegal()); timed('draw-legal-zoom', () => drawLegal(document.getElementById('legalZoom'), true)); timed('draw-svgA', () => drawA());
  if (!lazy || !('IntersectionObserver' in window)) return drawRest();
  lazyIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && drawLazy(e.target.id)), { rootMargin: '700px 0px' });
  Object.keys(LAZY).forEach(id => lazyIO.observe(document.getElementById(id)));
  // Anything still undrawn is filled in when the browser is idle, so deep links, find-in-page and tests never meet an empty chart.
  idle(() => Object.keys(LAZY).forEach(drawLazy), 1500);
}
timed('first-draw', () => { chipsB(); drawLegalKey(); drawAll(true); });
performance.mark('cs:first-draw-done');
// Hero: a static diagram (vector map, ~57 KB of land data) is drawn straight away so the stage is never empty. three.js (~1.3 MB) and the Earth
// JPG (~1.5 MB) are NOT fetched at first paint: they load only after the page has loaded and the browser has gone idle AND the hero is near the
// viewport (IntersectionObserver with a 300 px margin), or as soon as the user opens a scene. Reduced motion / no WebGL keep the static diagram.
{ ensureLand(); heroSim = buildSim(HERO); renderSVG(heroSim, heroStage, 0.2); }
let heroSeen = false, heroReady = false;
const heroGo = () => { if (heroSeen && heroReady) { heroIO.disconnect(); startHero(); } };
const heroIO = new IntersectionObserver(es => { heroSeen = es.some(e => e.isIntersecting); heroGo(); }, { rootMargin: '300px 0px' });
heroIO.observe(heroStage);
(f => document.readyState === 'complete' ? f() : addEventListener('load', f, { once: true }))(() => idle(() => { heroReady = true; heroGo(); }, 3000));
// Earth imagery is fetched once, after the WebGL host exists (hero or scene), and skipped with reduced motion or without WebGL.
let earthStarted = false;
function prefetchEarth() { if (earthStarted) return; earthStarted = true; getHost().then(h => { if (h) loadEarth(h.maxTex).then(ok => { if (ok) host?.refreshEarth(); }); }); }
let rz = 0, lastW = innerWidth; addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(() => drawAll(true), 150); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });

// Test / export hooks (no storage).
window.__cs = { perf: () => performance.getEntriesByType('measure').filter(m => m.name.startsWith('cs:')).map(m => [m.name, +m.duration.toFixed(1)]).concat(performance.getEntriesByType('mark').filter(m => m.name.startsWith('cs:')).map(m => [m.name, +m.startTime.toFixed(1)])), earthReady, EARTH_URL, exportSVG, audit, openScene, closeScene, exportStill, memory: () => host?.memory(), contexts: () => document.querySelectorAll('canvas').length, scenes: ORDER.map(s => s.id), host: () => host };

