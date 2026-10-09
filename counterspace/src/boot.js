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
import { drawLegal, drawLegalKey, initZoomControl, landOnMark, legalOff, legalScroll } from './charts/legal.js';
import { hooks, markFirstDrawn, settled } from './shared.js';
import { guides, hideCard } from './ui.js';
import { drawA } from './charts/a.js';
import { ORDER, closeScene, exportStill, host, openScene, showRecap, startTour } from './scene-ui.js';
import { mountHero } from './hero-timeline.js';
import { EARTH_URL, earthReady } from './scenes/earth.js';
import { exportSVG } from './export.js';
import { audit } from './audit.js';
import { mountDiscover } from './discover.js';
import { mountQuiz } from './quiz.js';
import { fillTakeaways } from './takeaways.js';
import { mountScrub } from './scrub.js';
import { mountExplore, revealIn, showTab } from './explore.js';
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

// Chapter rail (wide screens): the last chapter whose start has passed the reading line, 40% down the window, is the current one. It is worked out from where each
// chapter's start is on every scroll (a jump over whole chapters, such as Tab wrapping from the footer to the skip link, must reset it too, and an observer only
// reports an edge that is crossed). The rail stays out of sight while the opening picture is on screen, until the first chapter has passed the reading line; the last chapter, sources and method, is current once its band is on screen or the page is at its end.
{
  const rail = document.getElementById('rail'),
    links = [...rail.querySelectorAll('a')],
    starts = ['scenes', 'timeline', 'pattern', 'quizBand', 'explore', 'sources'].map((id) => document.getElementById(id)),
    hero = document.getElementById('top');
  const mark = () => {
    const line = innerHeight * 0.4,
      heroGone = !hero || hero.getBoundingClientRect().bottom <= line, // a jump to the first chapter leaves the picture's lower edge in view, and the rail comes with the chapter
      last = starts.length - 1,
      src = starts[last],
      // the folded sources band is short: it is the current chapter as soon as most of it is on screen, and at the very end of the page whatever else is showing
      atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 8 || (!!src && src.getBoundingClientRect().top <= innerHeight * 0.8),
      now = heroGone ? (atEnd ? last : starts.reduce((n, el, i) => (el && el.getBoundingClientRect().top <= line ? i : n), -1)) : -1;
    links.forEach((a, i) => (i === now ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    rail.classList.toggle('on', now >= 0); // hidden only over the opening picture
    // One tab stop for the whole rail: the current chapter's dot (the first, until the reader has reached the timeline). Up and down arrows move along it.
    links.forEach((a, i) => a.setAttribute('tabindex', i === Math.max(now, 0) ? '0' : '-1'));
  };
  let tick = false;
  const soon = () => !tick && ((tick = true), requestAnimationFrame(() => ((tick = false), mark())));
  addEventListener('scroll', soon, { passive: true });
  addEventListener('resize', soon);
  addEventListener('scrollend', soon);
  addEventListener('hashchange', soon);
  rail.addEventListener('keydown', (e) => {
    const at = links.indexOf(document.activeElement),
      step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key],
      to = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : step && at >= 0 ? (at + step + links.length) % links.length : -1;
    if (to < 0) return;
    e.preventDefault();
    links.forEach((a, i) => a.setAttribute('tabindex', i === to ? '0' : '-1'));
    links[to].focus();
  });
  // Focus that wraps round from the end of the page onto the skip link (it comes from outside the page, and the link is fixed, so the page would stay where it was)
  // takes the reader back to the top, where the opening picture is and no chapter is current.
  document.querySelector('.skip')?.addEventListener('focus', (e) => {
    if (!e.relatedTarget && scrollY > 0) scrollTo({ top: 0, behavior: 'instant' });
    mark();
  });
  mark();
  addEventListener('load', mark);
}

// An address that names a part of the page (#legalBand, #pattern, #chartC, #srcCite ...) is a jump made once. The browser's own jump lands before the charts are
// drawn, the fonts are in and the pinned strip has been measured (--band-h, which sets how much room the page keeps at the top), so it lands in the wrong place and the
// page then moves again. Instead nothing scrolls until the page has settled (shared.js settled(): load, fonts, first draw); then everything below is drawn, any closed
// disclosure that holds the target is opened, and the page scrolls to the target in one move. A second look a moment later only corrects a landing that something
// moved, and only while the reader has not scrolled by hand.
const hashId = () => decodeURIComponent(location.hash.slice(1));
let moved = false;
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => addEventListener(t, () => (moved = true), { once: true, passive: true }));
addEventListener('hashchange', () => (moved = false));

// A link to something inside a closed disclosure opens it first (a chart's "How we classified these" points into the sources section, for one).
// The sources section keeps its long reading in one disclosure that starts closed: an address or a link that names the section (the footer's "Sources", the
// chapter rail) or one of its parts opens it, so the reader lands on the material and not on a closed bar.
const SRC = new Set(['sources', 'srcEditions', 'codingRules', 'srcCite', 'srcLicence', 'srcList']);
const openSources = () => {
  hooks.drawRest?.();
  const f = document.getElementById('srcDetails');
  if (!f || f.open) return false;
  f.open = true;
  return true;
};
// Opens whatever closed disclosure holds the named part; true if one had to open.
function openAround(id) {
  if (!id) return false;
  let opened = SRC.has(id) && openSources();
  let t = document.getElementById(id);
  if (!t) {
    hooks.drawRest?.();
    t = document.getElementById(id);
  }
  let d = t?.closest('details');
  while (d) {
    if (!d.open) ((d.open = true), (opened = true));
    d = d.parentElement?.closest('details');
  }
  return opened;
}
// Where the named part belongs: the strip's chapter heading for the strip itself (the strip is sticky, so it cannot be scrolled to), the part otherwise.
const anchorOf = (id) => document.getElementById(id === 'legalBand' ? 'lawHead' : id);
let landed = null; // where the jump put the target, for the one correction
function jumpToHash(again) {
  const id = hashId(),
    t = id && anchorOf(id);
  if (!t || moved) return;
  if (!again) {
    // everything below is drawn first only when the target sits at or under the charts that are drawn lazily; above them, drawing waits for the idle pass and
    // the landing does not wait for it (the target is where it will stay: nothing drawn below it can move it)
    const ex = document.getElementById('explore');
    if (!ex || ex.contains(t) || ex.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) hooks.drawRest?.();
    openAround(id);
    revealIn(t); // a chart in "Explore the data" sits in a tab: show the tab first
  }
  if (t.closest('[data-off]')) return;
  const r = t.getBoundingClientRect();
  if (!r.width && !r.height) return;
  if (again && !(landed && landed.id === id && Math.abs(r.top - landed.top) > 2)) return;
  t.scrollIntoView({ block: 'start', behavior: 'auto' });
  hooks.legalScroll?.();
  landed = { id, top: t.getBoundingClientRect().top };
}
addEventListener('hashchange', () => {
  const id = hashId();
  if (id === 'legalBand' || openAround(id)) requestAnimationFrame(() => jumpToHash());
});
if (location.hash)
  settled().then(() => {
    jumpToHash();
    // once more after two frames and again after the page has been idle for a moment: normally nothing has moved, and nothing happens
    requestAnimationFrame(() => requestAnimationFrame(() => jumpToHash(true)));
    setTimeout(() => jumpToHash(true), 1200);
  });
// a link to the address already in the bar fires no hashchange, so the click itself opens the section
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  const id = a && decodeURIComponent(a.getAttribute('href').slice(1));
  if (id && SRC.has(id) && openSources()) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
});

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
// Charts below the fold (C, R, B, lag) and the sources section are drawn when they come within 700 px of the viewport, when the browser is idle, or on demand by audit/export.
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
hooks.drawLazy = drawLazy;
hooks.legalScroll = legalScroll;
hooks.legalOff = legalOff;
hooks.landOnMark = landOnMark;
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
  // The sources section is built here too, so the page's height is final within the first second and never changes under a reader who is scrolling.
  idle(() => Object.keys(LAZY).forEach(drawLazy), 1500);
}
// Charts and labels are laid out by measuring text, so the first draw waits for the embedded faces (data: URIs, a local decode: a few ms).
fontsReady.then(() => {
  performance.mark('cs:fonts-ready');
  timed('first-draw', () => {
    chipsB();
    drawLegalKey();
    initZoomControl();
    drawAll(true);
  });
  performance.mark('cs:first-draw-done');
  markFirstDrawn();
  watchSegs(); // the chart controls exist now and their words have their final font
});
// The hero picture is drawn from the page's own data and the embedded Earth image; no 3D library is involved.
mountHero(fontsReady, { openScene, showLaw: (id, kb) => hooks.showLaw?.(id, kb) });
mountDiscover();
mountQuiz();
fillTakeaways();
mountScrub();
mountExplore();
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
  showTab,
  startTour,
  showRecap,
  closeScene,
  exportStill,
  memory: () => host?.memory(),
  contexts: () => document.querySelectorAll('canvas').length,
  scenes: ORDER.map((s) => s.id),
  host: () => host,
};
