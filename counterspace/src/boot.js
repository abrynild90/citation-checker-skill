// ============================================================================
// boot.js: first draw, lazy drawing, resize, theme toggle and the window.__cs test hooks.
// Needs: every other module. Runs last.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { drawC } from './charts/c.js';
import { drawR } from './charts/rpo.js';
import { chipsB, drawB } from './charts/b.js';
import { drawL } from './charts/lag.js';
import { drawMethod } from './method.js';
import { REDUCED, ensureLand, timed } from './app.js';
import { drawLegal, drawLegalKey, legalScroll } from './charts/legal.js';
import { hooks } from './shared.js';
import { guides, hideCard } from './ui.js';
import { drawA } from './charts/a.js';
import { buildSim } from './scenes/sim.js';
import { HERO } from './scenes/config.js';
import { ORDER, closeScene, exportStill, heroStage, host, openScene, setHeroSim, startHero } from './scene-ui.js';
import { renderSVG } from './scenes/svg-fallback.js';
import { EARTH_URL, earthReady } from './scenes/earth.js';
import { exportSVG } from './export.js';
import { audit } from './audit.js';
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { probeBand } from './charts/legal.js';
import { fontsReady } from './fonts.js';
// ---------------------------------------------------------------- page shell: theme, downloads switch, chapter rail, segmented controls
// Theme button: its icon comes from CSS; here it is named for what a press will do, and renamed when the theme changes.
const root = document.documentElement,
  themeBtn = document.getElementById('themeBtn'),
  lightQuery = matchMedia('(prefers-color-scheme: light)');
const currentTheme = () => root.dataset.theme || (lightQuery.matches ? 'light' : 'dark');
function nameThemeButton() {
  const label = `Switch to ${currentTheme() === 'light' ? 'dark' : 'light'} colours`;
  themeBtn.setAttribute('aria-label', label);
  themeBtn.title = label;
}
themeBtn.onclick = () => {
  root.dataset.theme = currentTheme() === 'light' ? 'dark' : 'light'; // every chart colour is a CSS variable, so no redraw is needed
  nameThemeButton();
};
lightQuery.addEventListener?.('change', nameThemeButton);
nameThemeButton();

// "Dark colours in downloads" sits in the top bar; on phones the bar has no room for its words, so the switch moves to the footer.
{
  const option = document.getElementById('dlOption'),
    barSlot = document.getElementById('barSlot'),
    footSlot = document.getElementById('footSlot'),
    narrow = matchMedia('(max-width: 719px)');
  const place = () => (narrow.matches ? footSlot : barSlot).appendChild(option);
  narrow.addEventListener?.('change', place);
  place();
}

// Chapter rail (wide screens): the last chapter whose start has passed the reading line, 40% down the window, is the current one. Each chapter's start is
// watched with one IntersectionObserver whose box is the top 40% of the window; an entry's own top edge says which side of the line it is on.
{
  const rail = document.getElementById('rail'),
    links = [...rail.querySelectorAll('a')],
    starts = ['timeline', 'chartA', 'chartC', 'chartR', 'chartB', 'lag', 'sources'].map((id) => document.getElementById(id)),
    passed = new Map();
  const mark = () => {
    const now = starts.reduce((n, el, i) => (el && passed.get(el) ? i : n), -1);
    links.forEach((a, i) => (i === now ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    rail.classList.toggle('on', now >= 0);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => passed.set(e.target, e.boundingClientRect.top <= innerHeight * 0.4));
        mark();
      },
      { rootMargin: '0px 0px -60% 0px' },
    );
    starts.forEach((el) => el && io.observe(el));
  }
}

// Segmented controls: the raised thumb slides to the chosen button. Without script the chosen button carries the raised look itself.
function placeThumb(seg) {
  const on = seg.querySelector('[aria-pressed="true"],[aria-selected="true"]');
  if (!on || !on.offsetWidth) return seg.classList.remove('has-thumb'); // hidden for now, or nothing chosen
  seg.style.setProperty('--seg-x', on.offsetLeft + 'px');
  seg.style.setProperty('--seg-w', on.offsetWidth + 'px');
  seg.classList.add('has-thumb');
  if (!seg.classList.contains('anim')) requestAnimationFrame(() => requestAnimationFrame(() => seg.classList.add('anim'))); // the first placement does not slide
}
function watchSegs() {
  document.querySelectorAll('.seg').forEach((seg) => {
    const place = () => placeThumb(seg);
    new MutationObserver(place).observe(seg, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'aria-selected'] });
    new ResizeObserver(place).observe(seg);
    place();
  });
}

// ---------------------------------------------------------------- boot
// Above-the-fold pieces draw first; the rest is drawn on the next task (or on demand by audit/export).
// Charts below the fold (C, R, B, lag) and the sources section are drawn when they come within 700 px of the viewport, or on demand by audit/export.
const idle = (f, timeout) => (window.requestIdleCallback || ((g) => setTimeout(g, 200)))(f, { timeout });
// The charts and the sources section are below the fold: drawn lazily.
const LAZY = { svgC: () => drawC(), svgR: () => drawR(), svgB: () => drawB(), svgL: () => drawL(), methodBody: drawMethod };
const drawnLazy = new Set();
let lazyIO = null;
function drawLazy(id) {
  if (drawnLazy.has(id)) return;
  drawnLazy.add(id);
  lazyIO?.unobserve(document.getElementById(id));
  timed('draw-' + id, LAZY[id]);
}
function drawRest() {
  Object.keys(LAZY).forEach(drawLazy);
  legalScroll();
}
hooks.drawRest = drawRest;
function drawAll(lazy = false) {
  guides.length = 0;
  drawnLazy.delete('svgC');
  drawnLazy.delete('svgR');
  drawnLazy.delete('svgB');
  drawnLazy.delete('svgL');
  lazyIO?.disconnect();
  lazyIO = null;
  timed('draw-legal', () => drawLegal());
  timed('draw-legal-zoom', () => drawLegal(document.getElementById('legalZoom'), true));
  timed('draw-svgA', () => drawA());
  timed('probe-band', probeBand);
  if (!lazy || !('IntersectionObserver' in window)) return drawRest();
  lazyIO = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && drawLazy(e.target.id)), { rootMargin: '700px 0px' });
  Object.keys(LAZY).forEach((id) => lazyIO.observe(document.getElementById(id)));
  // Anything still undrawn is filled in when the browser is idle, so deep links, find-in-page and tests never meet an empty chart.
  idle(
    () =>
      Object.keys(LAZY)
        .filter((id) => id !== 'methodBody')
        .forEach(drawLazy),
    1500,
  ); // the sources section waits for the viewport (or audit/export)
}
// Charts and labels are laid out by measuring text, so the first draw waits for the embedded faces (data: URIs, a local decode: a few ms).
fontsReady.then(() => {
  performance.mark('cs:fonts-ready');
  timed('first-draw', () => {
    chipsB();
    drawLegalKey();
    drawAll(true);
  });
  performance.mark('cs:first-draw-done');
  // Hero: a static diagram (vector map, ~57 KB of land data) is drawn straight away and is all that loads before the reader interacts. three.js (~1.3 MB)
  // and the Earth JPG (~1.5 MB) are fetched only on intent: pointer enter or touch on the hero, the "Rotate the globe" button, keyboard focus on it, or
  // opening a scene. Reduced motion (and no WebGL) keep the static diagram, and the button is then not offered.
  {
    ensureLand();
    const s = buildSim(HERO);
    setHeroSim(s);
    renderSVG(s, heroStage, 0.2);
  }
  watchSegs(); // the chart controls exist now and their words have their final font
});
const heroRot = document.getElementById('heroRot');
heroRot.hidden = REDUCED;
const upgradeHero = () => {
  if (REDUCED || heroStage.dataset.gl) return;
  heroStage.dataset.gl = '1';
  heroRot.hidden = true;
  fontsReady.then(startHero);
};
['pointerenter', 'pointerdown', 'touchstart'].forEach((t) => heroStage.addEventListener(t, upgradeHero, { once: true, passive: true }));
heroRot.addEventListener('click', upgradeHero);
let rz = 0,
  lastW = innerWidth;
addEventListener('resize', () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  clearTimeout(rz);
  rz = setTimeout(() => drawAll(true), 150);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideCard();
});

// Test / export hooks (no storage).
window.__cs = {
  perf: () =>
    performance
      .getEntriesByType('measure')
      .filter((m) => m.name.startsWith('cs:'))
      .map((m) => [m.name, +m.duration.toFixed(1)])
      .concat(
        performance
          .getEntriesByType('mark')
          .filter((m) => m.name.startsWith('cs:'))
          .map((m) => [m.name, +m.startTime.toFixed(1)]),
      ),
  earthReady,
  fontsReady,
  EARTH_URL,
  exportSVG,
  audit,
  openScene,
  closeScene,
  exportStill,
  memory: () => host?.memory(),
  contexts: () => document.querySelectorAll('canvas').length,
  scenes: ORDER.map((s) => s.id),
  host: () => host,
};
