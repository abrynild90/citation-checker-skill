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
import { timed } from './app.js';
import { drawLegal, drawLegalKey, legalScroll } from './charts/legal.js';
import { hooks } from './shared.js';
import { guides, hideCard } from './ui.js';
import { drawA } from './charts/a.js';
import { ORDER, closeScene, exportStill, host, openScene, startTour } from './scene-ui.js';
import { mountHero } from './hero-timeline.js';
import { EARTH_URL, earthReady } from './scenes/earth.js';
import { exportSVG } from './export.js';
import { audit } from './audit.js';
import { mountDiscover } from './discover.js';
import { mountQuiz } from './quiz.js';
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

// Sources section: the contents list marks the part being read (the last heading above the reading line, 35% down the window).
{
  const links = [...document.querySelectorAll('.sub-nav a')];
  let ticking = false;
  const spy = () => {
    ticking = false;
    const heads = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
    const box = document.getElementById('sources')?.getBoundingClientRect();
    const inside = box && box.top < innerHeight * 0.5 && box.bottom > innerHeight * 0.2;
    let now = -1;
    if (inside) heads.forEach((h, i) => h && h.getBoundingClientRect().top <= innerHeight * 0.35 && (now = i));
    links.forEach((a, i) => (i === now ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  };
  addEventListener('scroll', () => !ticking && ((ticking = true), requestAnimationFrame(spy)), { passive: true });
  addEventListener('resize', spy);
}

// Chapter rail (wide screens): the last chapter whose start has passed the reading line, 40% down the window, is the current one. Each chapter's start is
// watched with one IntersectionObserver whose box is the top 40% of the window; an entry's own top edge says which side of the line it is on.
{
  const rail = document.getElementById('rail'),
    links = [...rail.querySelectorAll('a')],
    starts = ['scenes', 'timeline', 'chartA', 'chartC', 'chartR', 'chartB', 'lag', 'sources'].map((id) => document.getElementById(id)),
    passed = new Map();
  const mark = () => {
    const now = starts.reduce((n, el, i) => (el && passed.get(el) ? i : n), -1);
    links.forEach((a, i) => (i === now ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    rail.classList.toggle('on', now >= 0 && now < links.length - 1); // hidden over the sources section and footer
    // One tab stop for the whole rail: the current chapter's dot (the first, until the reader has reached the timeline). Up and down arrows move along it.
    links.forEach((a, i) => a.setAttribute('tabindex', i === Math.max(now, 0) ? '0' : '-1'));
  };
  rail.addEventListener('keydown', (e) => {
    const at = links.indexOf(document.activeElement),
      step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key],
      to = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : step && at >= 0 ? (at + step + links.length) % links.length : -1;
    if (to < 0) return;
    e.preventDefault();
    links.forEach((a, i) => a.setAttribute('tabindex', i === to ? '0' : '-1'));
    links[to].focus();
  });
  mark();
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

// A link to something inside a closed disclosure opens it first (a chart's "How we classified these" points into the sources section, for one).
{
  const reveal = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    let t = document.getElementById(id);
    if (!t) {
      hooks.drawRest?.();
      t = document.getElementById(id);
    }
    let d = t?.closest('details'),
      opened = false;
    while (d) {
      if (!d.open) ((d.open = true), (opened = true));
      d = d.parentElement?.closest('details');
    }
    if (opened) requestAnimationFrame(() => t.scrollIntoView({ block: 'start' }));
  };
  addEventListener('hashchange', reveal);
  addEventListener('load', reveal);
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
  watchSegs(); // the chart controls exist now and their words have their final font
});
// The hero picture is drawn from the page's own data and the embedded Earth image; no 3D library is involved.
mountHero(fontsReady);
mountDiscover();
mountQuiz();
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
  startTour,
  closeScene,
  exportStill,
  memory: () => host?.memory(),
  contexts: () => document.querySelectorAll('canvas').length,
  scenes: ORDER.map((s) => s.id),
  host: () => host,
};
