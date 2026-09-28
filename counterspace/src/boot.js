// Boot sequence, theme toggle, resize handling and test hooks.
// ---------------------------------------------------------------- theme toggle (in memory only)
document.getElementById('themeBtn').onclick = () => {
  const root = document.documentElement; const now = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.dataset.theme = now === 'light' ? 'dark' : 'light'; // every chart colour is a CSS variable, so no redraw is needed
};

// ---------------------------------------------------------------- boot
// Above-the-fold pieces draw first; the rest is drawn on the next task (or on demand by audit/export).
let pendingDraw = null;
function drawRest() { if (!pendingDraw) return; clearTimeout(pendingDraw); pendingDraw = null; drawC(); drawB(); drawL(); legalScroll(); }
function drawAll(lazy = false) {
  guides.length = 0; drawLegal(); drawLegal(document.getElementById('legalZoom'), true); drawA();
  clearTimeout(pendingDraw); pendingDraw = setTimeout(drawRest, lazy ? 30 : 0); if (!lazy) drawRest();
}
if (innerWidth < 640) document.querySelector('#chartB details.table')?.setAttribute('open', '');
chipsB(); drawLegalKey(); drawAll(true); drawMethod(); startHero();
// Earth imagery (~1.5 MB) is not part of the page: it is prefetched once the page has
// loaded and the browser is idle, and skipped entirely without WebGL or with reduced motion.
function prefetchEarth() { getHost().then(h => { if (h) loadEarth(h.maxTex).then(ok => { if (ok) host?.refreshEarth(); }); }); }
addEventListener('load', () => (window.requestIdleCallback || (f => setTimeout(f, 1200)))(prefetchEarth, { timeout: 4000 }));
let rz = 0, lastW = innerWidth; addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(drawAll, 150); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });

// Test / export hooks (no storage).
window.__cs = { earthReady, EARTH_URL, exportSVG, audit, openScene, closeScene, memory: () => host?.memory(), contexts: () => document.querySelectorAll('canvas').length, scenes: ORDER.map(s => s.id), host: () => host };

