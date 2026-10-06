// ============================================================================
// scene-ui.js: the 3D explainer window (dialog, story steps, scrubber, views, keyboard, saved image) and the hero.
// Provides: openScene(), closeScene(), exportStill(), startHero(); owns the single WebGL host.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { REDUCED, byId, ensureLand, esc, parse } from './app.js';
import { GLHost } from './scenes/gl-host.js';
import { loadEarth } from './scenes/earth.js';
import { HERO, SCENES } from './scenes/config.js';
import { buildSim } from './scenes/sim.js';
import { renderSVG } from './scenes/svg-fallback.js';
import { setGuide } from './ui.js';
import { download } from './export.js';
import { hooks } from './shared.js';
import { SANS, SERIF, fontsReady } from './fonts.js';
export let THREE = null,
  host = null,
  glOK = null;
async function getHost() {
  ensureLand();
  if (REDUCED) return null;
  if (glOK === false) return null;
  try {
    if (!THREE) THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    if (!host) {
      host = new GLHost(THREE);
      // The scrubber mirrors scene time however it changes: playback ticks, scrubbing or programmatic host.update() calls.
      const upd = host.update.bind(host),
        pick = host.pickCam.bind(host);
      // An episode preset (RPO, Spaceplanes) restricts playback and scrubbing to its episode: epi = {a0, a1, last, name}. A time handed to update()
      // from outside the episode is mapped (0..1) into it, so a preset never shows another episode; Tour / Whole event clear it.
      host.update = (t) => {
        if (epi) {
          const lo = epi.a0 + 0.001,
            hi = epi.a1 - (epi.last ? 0 : 0.001);
          if (!(t >= epi.a0 - 1e-6 && t <= hi)) t = lo + Math.max(0, Math.min(1, t)) * (hi - lo);
        }
        upd(t);
        syncScrub(host.t);
      };
      host.pickCam = (i) => {
        const c = host.sim.cams[i],
          cc = host.sim.cfg.cameras?.[i],
          acts = host.sim.cfg.acts,
          a = acts && !c.auto ? acts[c.act] : null;
        wideSel = acts && !c.auto && c.act == null ? i : -1; // an episode scene's Wide preset: its chip is the pressed one, not the Tour's
        epi = a ? { a0: a.t0, a1: a.t1, last: a === acts.at(-1), name: cc?.episode || cc?.chip || cc?.short || c.name } : null;
        pick(i);
        if (epi)
          host.update(host.t); // bring the time into the episode now (a preset pressed at another episode's time)
        else syncScrub(host.t);
      };
    }
    glOK = true;
    return host;
  } catch (e) {
    console.warn('3D unavailable, using still diagrams', e);
    glOK = false;
    return null;
  }
}
// Earth imagery is fetched once, after the WebGL host exists (hero or scene), and skipped with reduced motion or without WebGL.
let earthStarted = false;
function prefetchEarth() {
  if (earthStarted) return;
  earthStarted = true;
  getHost().then((h) => {
    if (h)
      loadEarth(h.maxTex).then((ok) => {
        if (ok) host?.refreshEarth();
      });
  });
}
export const ORDER = [...SCENES].sort((a, b) => (a.date < b.date ? -1 : 1));

const $ = (id) => document.getElementById(id);
const overlay = $('overlay'),
  panel = $('scenePanel'),
  view = $('sceneView'),
  titleEl = $('sceneTitle'),
  countEl = $('sceneDate'),
  dotsEl = $('sceneDots'),
  captionEl = $('sceneCaption'),
  srcEl = $('sceneSrc'),
  srcLineEl = $('sceneSrcLine'),
  scaleEl = $('sceneScale'),
  stepsSection = $('sceneStepsSection'),
  stepsBox = $('sceneStepsBox'),
  stepsEl = $('sceneSteps'),
  stepsNote = $('stepsNote'),
  stepNow = $('stepNow'),
  asideBody = $('asideBody'),
  asideWrap = $('asideWrap'),
  lawBox = $('asideLaw'),
  lawBtn = $('scRelated'),
  lawTxt = $('scRelatedTxt'),
  playBtn = $('scPlay'),
  scrub = $('scScrub'),
  scrubWrap = $('scrubWrap'),
  ticksEl = $('scTicks'),
  scTime = $('scTime'),
  camsEl = $('scCams'),
  viewsEl = $('scViews'),
  staticEl = $('scStatic'),
  staticTxt = $('scStaticTxt'),
  exportBtn = $('scExport'),
  statusEl = $('scStatus'),
  stateEl = $('sceneState'),
  stateTxt = $('sceneStateTxt'),
  hintEl = $('sceneHint');
// The same queries as scenes.css: the phone layout, the layout with the picture above the story, and the short and wide layout (a phone on its side).
const PHONE = '(max-width: 760px) and (min-height: 541px), (max-width: 760px) and (max-aspect-ratio: 11/10), (max-width: 599px)',
  COMPACT = matchMedia(PHONE),
  STACKED = matchMedia(PHONE + ', (max-width: 900px) and (max-aspect-ratio: 1/1)'),
  SHORT = matchMedia('(max-height: 540px) and (min-aspect-ratio: 11/10) and (min-width: 600px)'),
  KEYBOARD = matchMedia('(hover: hover) and (pointer: fine)'),
  CLOSE_MS = 220; // the closing fade in scenes.css (--dur-2) with a little margin
let wideSel = -1,
  epi = null, // the locked episode of an episode preset (see getHost)
  curSim = null, // the simulation of the open scene (the still diagram re-draws it at a print-friendly layout width)
  cur = null,
  returnFocus = null,
  heroSim = null,
  openToken = 0, // a newer open or a close cancels an open that is still waiting for 3D to load
  closeTimer = 0,
  hintTimer = 0,
  toastTimer = 0,
  hintShown = false,
  steps = [], // [{t, text}] of the open scene: the scene's status lines in order (t is the fraction of scene time)
  stepIdx = -1,
  ticksFor,
  timeTxt = '',
  camOn = -2,
  ttlTxt = '',
  lblTxt = '',
  lastUserScroll = -Infinity, // when the reader last scrolled the story themselves
  stillOnly = false; // the open scene shows a still diagram (animation off or 3D unavailable)
export function setHeroSim(s) {
  heroSim = s;
}

// ---------------------------------------------------------------- small helpers
const sec = (s, fine) => `${fine ? String(+s.toFixed(1)) : Math.round(s)} s`;
const slug = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
// A short, plain name for a view button: the config's own short form if it has one, else the name without brackets and without anything after a colon.
function viewName(cc, name) {
  const own = cc?.short || cc?.chip;
  if (own) return own;
  let s = name.replace(/\s*\([^)]*\)/g, '').trim();
  if (s.length > 24 && s.includes(':')) s = s.split(':')[0].trim();
  // On a phone the buttons share one row: "From the north pole" becomes "North pole", "Whole scene" stays.
  if (matchMedia('(max-width: 760px)').matches && /^from (the )?/i.test(s)) s = s.replace(/^from (the )?/i, '').replace(/^./, (c) => c.toUpperCase());
  return s || name;
}
function setStatus(msg) {
  clearTimeout(toastTimer);
  statusEl.textContent = msg;
  statusEl.classList.add('sr'); // read out by screen readers, not shown
}
// A short visible note near the controls (saving an image); it clears itself, and screen readers hear it too.
function toast(msg, kind) {
  clearTimeout(toastTimer);
  statusEl.dataset.kind = kind || 'ok';
  statusEl.textContent = msg;
  statusEl.classList.remove('sr');
  toastTimer = setTimeout(() => statusEl.classList.add('sr'), kind === 'warn' ? 9000 : 3500);
}
// The picture area while 3D loads, or when nothing could be drawn.
function setState(kind, msg) {
  if (!kind) {
    stateEl.hidden = true;
    return;
  }
  stateEl.dataset.kind = kind;
  stateTxt.textContent = msg;
  stateEl.hidden = false;
}

// ---------------------------------------------------------------- scene dots: one button per scene, one tab stop (the current one)
ORDER.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'sv-dot';
  b.dataset.tip = s.title;
  b.setAttribute('aria-label', `Scene ${i + 1}: ${s.title}`);
  b.tabIndex = -1;
  b.onclick = () => {
    if (s !== cur) openScene(s.id);
  };
  dotsEl.appendChild(b);
});
// Phones have no room for the dots: a list of all scenes opens in a sheet instead.
const sheet = $('sceneSheet'),
  sheetList = $('sceneSheetList'),
  listBtn = $('scList');
ORDER.forEach((s, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" class="sheet-item"><span class="sh-n">${i + 1}</span><span class="sh-t">${esc(s.title)}</span></button>`;
  li.firstElementChild.onclick = () => {
    toggleSheet(false);
    if (s !== cur) openScene(s.id);
  };
  sheetList.appendChild(li);
});
function toggleSheet(open) {
  sheet.hidden = !open;
  listBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    const now = [...sheetList.children][ORDER.indexOf(cur)]?.firstElementChild;
    now?.setAttribute('aria-current', 'true');
    [...sheetList.querySelectorAll('[aria-current]')].forEach((b) => b !== now && b.removeAttribute('aria-current'));
    (now || sheetList.querySelector('button')).focus({ preventScroll: false });
  } else if (sheet.contains(document.activeElement)) listBtn.focus();
}
listBtn.onclick = () => toggleSheet(sheet.hidden);
$('scSheetClose').onclick = () => toggleSheet(false);
function syncDots() {
  [...dotsEl.children].forEach((b, i) => {
    const on = ORDER[i] === cur;
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
    b.tabIndex = on ? 0 : -1;
  });
}

// ---------------------------------------------------------------- open
export async function openScene(id, originEl) {
  const cfg = SCENES.find((s) => s.id === id);
  if (!cfg) return;
  clearTimeout(closeTimer);
  const wasOpen = overlay.classList.contains('open'),
    onDot = wasOpen && dotsEl.contains(document.activeElement),
    token = ++openToken;
  if (!wasOpen) returnFocus = originEl || document.activeElement;
  cur = cfg;
  epi = null;
  wideSel = -1;
  stillOnly = false;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setInert(true);
  fillStory(cfg);
  syncDots();
  const sim = buildSim(cfg);
  curSim = sim;
  camsEl.textContent = '';
  view.querySelector(':scope > svg')?.remove();
  if (!host && !REDUCED && glOK !== false) setState('loading', 'Loading the 3D view. You can read the story while you wait.');
  else setState(null);
  if (!wasOpen) {
    // Focus starts on the dialog's title, so a screen reader names the scene and the first Tab lands on the first control.
    const ttl = $('sceneTitle');
    ttl.tabIndex = -1;
    ttl.focus({ preventScroll: true });
  }
  const h = await getHost();
  if (token !== openToken) return; // closed, or another scene was chosen, while 3D was loading
  if (h) prefetchEarth();
  view.querySelector(':scope > svg')?.remove();
  if (h) {
    unloadHero();
    h.mount(view);
    h.load(sim);
    h.playing = true;
    setPlayBtn(true);
    buildViews(cfg, sim);
    h.play();
    h.handEl && (h.handEl.style.visibility = 'hidden');
    setState(null);
  } else {
    try {
      renderSVG(sim, view);
      setState(null);
    } catch (e) {
      console.warn('Still diagram failed', e);
      setState('error', 'The picture could not be drawn. You can still read the story.');
    }
  }
  stillOnly = !h;
  staticMode(!h);
  syncScrub(h ? h.t : 0);
  asideBody.scrollTop = 0;
  panel.scrollTop = 0; // a short window scrolls the whole panel
  requestAnimationFrame(() => {
    asideBody.scrollTop = 0; // layout of the new text is settled: a scene never opens scrolled
    updateFades();
  });
  setStatus(`Scene ${ORDER.indexOf(cfg) + 1} of ${ORDER.length}: ${cfg.title}.${h ? ' Playing.' : ''}`);
  if (onDot) dotsEl.querySelector('[aria-current="true"]')?.focus();
  if (!wasOpen) showHint();
}

// The account is folded to a few lines so "What happens" gets the room; the button opens the whole text.
const moreBtn = $('sceneMore');
function setMore(open) {
  captionEl.classList.toggle('clamped', !open);
  moreBtn.setAttribute('aria-expanded', String(open));
  moreBtn.querySelector('span').textContent = open ? 'Show less' : 'Read the full account';
  moreBtn.classList.toggle('open', open);
  updateFades();
}
moreBtn.onclick = () => setMore(moreBtn.getAttribute('aria-expanded') !== 'true');

// Text of the open scene: title, count, story, source, related law, picture note and the steps.
function fillStory(cfg) {
  const n = ORDER.indexOf(cfg) + 1;
  // Names such as X-37B or SJ-21 stay on one line instead of breaking at their hyphen.
  titleEl.innerHTML = esc(cfg.title).replace(/[^\s(]+-[^\s)]+/g, (m) => `<span class="nb">${m}</span>`);
  panel.setAttribute('aria-label', `3D explainer: ${cfg.title}`);
  countEl.textContent = `${n} / ${ORDER.length}`;
  captionEl.textContent = cfg.caption;
  setMore(false);
  moreBtn.hidden = cfg.caption.split(/\s+/).length < 36;
  if (moreBtn.hidden) captionEl.classList.remove('clamped');
  const ev = byId[cfg.event];
  srcEl.innerHTML =
    `<span class="sv-cite">Source: ${esc(cfg.cite)}</span>` +
    (ev
      ? `<a href="${esc(ev.source_url)}" target="_blank" rel="noopener">Open the source<svg class="ico" aria-hidden="true" focusable="false">` +
        `<use href="#i-external"/></svg><span class="sr"> (opens in a new tab)</span></a>`
      : '') +
    (cfg.related ? '' : '<span class="sv-nolaw">No related law on the timeline.</span>');
  // The phone's pinned source line carries the link too, so "Open the source" is reachable without scrolling the story.
  srcLineEl.innerHTML =
    `Source: ${esc(cfg.cite)}` +
    (ev ? ` <a href="${esc(ev.source_url)}" target="_blank" rel="noopener">Open the source<span class="sr"> (opens in a new tab)</span></a>` : '');
  scaleEl.textContent = [
    'Drawn for illustration. Orbit heights are squeezed so every orbit fits.',
    cfg.scaleNote,
    'Earth imagery: NASA Blue Marble and Black Marble (public domain). A simple map is drawn if the photograph cannot load.',
    REDUCED ? 'Animation is switched off on this device, so a still diagram is shown.' : '',
  ]
    .filter(Boolean)
    .join(' ');
  lawBtn.disabled = !cfg.related;
  lawBox.classList.toggle('none', !cfg.related); // no related law: the button gives way to a plain sentence in the source
  lawTxt.textContent = cfg.related ? `Related law: ${byId[cfg.related]?.label}` : 'Related law';
  renderSteps(cfg);
}

// While the dialog is open the page behind it is inert (no focus, not read out).
function setInert(on) {
  [...document.body.children].forEach((n) => {
    if (n !== overlay && !/^(script|style|svg|link)$/i.test(n.tagName)) n.inert = on;
  });
}

// ---------------------------------------------------------------- close
export function closeScene() {
  sheet.hidden = true;
  if (!cur) return;
  const closing = cur;
  cur = null;
  epi = null;
  openToken++;
  clearTimeout(hintTimer);
  hintEl.classList.remove('on');
  setInert(false);
  setStatus('');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // The picture stays until the panel has faded out; with reduced motion it goes at once.
  const finish = () => {
    if (cur) return;
    if (host && host.el === view) host.unload();
    view.querySelector(':scope > svg')?.remove();
    setState(null);
    if (heroWanted && host?.el !== heroStage) startHero();
  };
  if (REDUCED) finish();
  else closeTimer = setTimeout(finish, CLOSE_MS);
  // Focus goes back to whatever opened the scene. If nothing did (opened from code, so focus was on <body>), fall back to the scene's own timeline
  // mark (by data-id), then to the tour button, so keyboard users never lose their place.
  const live = (n) => n && n !== document.body && document.contains(n) && !n.inert;
  const byMark = (id) => id && document.querySelector(`#svgA [data-id="${id}"], #svgC [data-id="${id}"], #svgR [data-id="${id}"]`);
  const target = [returnFocus, byMark(returnFocus?.dataset?.id), byMark(closing.event), $('tourBtn')].find(live);
  returnFocus = null;
  target?.focus();
}

// ---------------------------------------------------------------- steps: what happens, as a timeline that follows the animation
function renderSteps(cfg) {
  const dur = cfg.duration || 0;
  steps = (cfg.status || cfg.steps || []).map(([t, text]) => ({ t, text }));
  const fine = steps.some((s, i) => i && Math.round(s.t * dur) === Math.round(steps[i - 1].t * dur)); // two steps would read the same: show tenths
  stepIdx = -1;
  stepsSection.hidden = !steps.length;
  stepsEl.innerHTML = steps
    .map(
      (s, i) =>
        `<li data-i="${i}"><button type="button" class="step"><span class="st-time">${dur ? sec(s.t * dur, fine) : ''}</span>` +
        `<span class="st-rail" aria-hidden="true"></span><span class="st-text">${esc(s.text)}</span></button></li>`,
    )
    .join('');
  stepsBox.open = !COMPACT.matches;
  stepsEl.scrollTop = 0;
  requestAnimationFrame(fitSteps);
  stepNow.textContent = '';
  lastUserScroll = -Infinity;
  ticksFor = undefined; // forces the scrubber ticks to be drawn for this scene
}
function stepAt(t) {
  let k = 0;
  steps.forEach((s, i) => {
    if (t >= s.t - 1e-6) k = i;
  });
  return k;
}
function syncSteps(t) {
  if (!steps.length || stillOnly) return;
  const k = stepAt(t);
  if (k === stepIdx) return;
  const first = stepIdx < 0;
  stepIdx = k;
  [...stepsEl.children].forEach((li, i) => {
    li.classList.toggle('done', i < k);
    li.classList.toggle('now', i === k);
    const b = li.firstElementChild;
    if (i === k) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
  // Phones show the current step and the one after it; the whole list is behind "All steps".
  const li = stepsEl.children[k],
    nx = stepsEl.children[k + 1];
  stepNow.innerHTML =
    `<li class="now"><div class="step">${li.firstElementChild.innerHTML}</div></li>` +
    (nx ? `<li class="next"><div class="step">${nx.firstElementChild.innerHTML}</div></li>` : '');
  if (first) requestAnimationFrame(() => followStep(li, true));
  else followStep(li);
}
// Keep the current step in view as the animation moves on, moving the list as little as possible so the reader keeps their place: the step stays
// inside a band with room for the next one below it. Nothing moves for a moment after the reader has scrolled the story themselves.
function followStep(li, instant) {
  if (!instant && performance.now() - lastUserScroll < 4000) return;
  // The list moves inside its own fixed-height region when it has one, so the story's first paragraph and the title never scroll away.
  const own = listScrolls() ? stepsEl : asideBody,
    box = own.getBoundingClientRect(),
    r = li.getBoundingClientRect();
  if (!stepsBox.open || !r.height) return; // the list is folded away (phone)
  const top = box.top + (own === stepsEl ? 4 : 56),
    bottom = box.bottom - (own === stepsEl ? 4 : 96);
  let dy = 0;
  if (r.bottom > bottom) dy = r.bottom - bottom;
  else if (r.top < top) dy = r.top - top;
  if (dy) own.scrollBy({ top: dy, behavior: REDUCED || instant ? 'auto' : 'smooth' });
}
const listScrolls = () => stepsEl.scrollHeight > stepsEl.clientHeight + 2 && getComputedStyle(stepsEl).overflowY !== 'visible';
// The list shows whole steps at rest: its height is cut to the last step that fits in full, and a fade appears at an edge only while steps are hidden there.
function fitSteps() {
  stepsEl.style.height = '';
  stepsEl.style.maxHeight = '';
  if (!stepsBox.open || !stepsEl.children.length) return stepsEl.classList.remove('can-up', 'can-down');
  const max = parseFloat(getComputedStyle(stepsEl).maxHeight);
  if (max && stepsEl.scrollHeight > max + 1 && getComputedStyle(stepsEl).overflowY !== 'visible') {
    let h = 0;
    for (const li of stepsEl.children) {
      const b = li.offsetTop + li.offsetHeight;
      if (b <= max) h = b;
      else break;
    }
    if (h > 80) stepsEl.style.maxHeight = h + 14 + 'px';
  }
  fadeSteps();
}
function fadeSteps() {
  const sc = listScrolls();
  stepsEl.classList.toggle('can-up', sc && stepsEl.scrollTop > 3);
  stepsEl.classList.toggle('can-down', sc && stepsEl.scrollHeight - stepsEl.clientHeight - stepsEl.scrollTop > 3);
}
let snapTimer = 0;
stepsEl.addEventListener(
  'scroll',
  () => {
    fadeSteps();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      // settle on a step boundary at the top so no step is cut mid-line at rest
      if (!listScrolls() || stepsEl.scrollTop < 3) return;
      const end = stepsEl.scrollHeight - stepsEl.clientHeight - stepsEl.scrollTop < 3;
      if (end) return;
      const y = stepsEl.scrollTop;
      let best = 0;
      for (const li of stepsEl.children) if (Math.abs(li.offsetTop - 4 - y) < Math.abs(best - y)) best = li.offsetTop - 4;
      if (Math.abs(best - y) > 1) stepsEl.scrollTo({ top: Math.max(0, best), behavior: REDUCED ? 'auto' : 'smooth' });
    }, 140);
  },
  { passive: true },
);
addEventListener('resize', fitSteps);
['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((ev) =>
  asideBody.addEventListener(
    ev,
    () => {
      lastUserScroll = performance.now();
    },
    { passive: true },
  ),
);
// Selecting a step plays the scene from the start of that step (the tour camera takes over if the step lies outside a locked episode).
function jumpToStep(i) {
  const s = steps[i];
  if (!s || !host || !glOK || stillOnly || !cur) return;
  const tour = host.sim.cams.findIndex((c) => c.auto);
  if (epi && (s.t < epi.a0 || s.t >= epi.a1) && tour >= 0) host.pickCam(tour);
  host.update(Math.min(s.t, 1));
  setStatus(`Step ${i + 1} of ${steps.length}: ${s.text}`);
}
stepsEl.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-i]');
  if (li) jumpToStep(+li.dataset.i);
});
// With the picture above the story, the source and the related law sit at the end of the story's scroll so the story keeps the room; elsewhere they stay in view below it.
const storyEl = $('sceneStory'),
  footEl = $('sceneFoot');
function placeFoot() {
  const into = STACKED.matches || SHORT.matches ? asideBody : storyEl;
  if (footEl.parentElement !== into) into.appendChild(footEl);
  updateFades();
}
COMPACT.addEventListener('change', () => {
  stepsBox.open = !COMPACT.matches;
  updateFades();
});
STACKED.addEventListener('change', placeFoot);
SHORT.addEventListener('change', placeFoot);
placeFoot();

// ---------------------------------------------------------------- scrubber, time and views
// A tick on the scrubber at the start of each step (re-drawn when an episode preset narrows the scrubber to its episode).
function drawTicks() {
  ticksFor = epi;
  const a0 = epi ? epi.a0 + 0.001 : 0,
    a1 = epi ? epi.a1 - (epi.last ? 0 : 0.001) : 1;
  // Ticks closer than 13 px merge into one, so a scene with many steps does not draw a crowd (every step is still reachable from the list and the keys).
  const wpx = scrub.clientWidth || 300;
  let lastX = -99;
  ticksEl.innerHTML = steps
    .filter((s) => s.t > a0 + 0.004 && s.t < a1 - 0.004)
    .filter((s) => {
      const px = ((s.t - a0) / (a1 - a0)) * wpx;
      if (px - lastX < 13) return false;
      lastX = px;
      return true;
    })
    .map((s) => `<i style="--t:${((s.t - a0) / (a1 - a0)).toFixed(4)}"></i>`)
    .join('');
}
// The view button that matches the camera on screen is pressed: when a locked episode preset hands over, the highlight moves with it.
function syncCams() {
  if (!host || !cur) return;
  const tour = host.sim.cfg.acts && host.lock == null ? host.sim.cams.findIndex((c) => c.auto) : -1,
    on = wideSel >= 0 && host.lock == null ? wideSel : tour >= 0 ? tour : host.camIdx;
  if (on === camOn) return;
  camOn = on;
  [...camsEl.children].forEach((b, i) => {
    b.setAttribute('aria-pressed', String(i === on));
    b.title = `${b.dataset.name ? b.dataset.name + ' ' : ''}(key ${i + 1})`;
    if (i === on && camsEl.scrollWidth > camsEl.clientWidth) b.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  });
}
function syncScrub(t) {
  if (!cur) return;
  syncCams();
  if (ticksFor !== epi) drawTicks();
  const dur = cur.duration || 0,
    a0 = epi ? epi.a0 + 0.001 : 0,
    a1 = epi ? epi.a1 - (epi.last ? 0 : 0.001) : 1,
    v = Math.max(0, Math.min(1, (t - a0) / (a1 - a0))),
    len = (a1 - a0) * dur,
    txt = `${Math.round(v * len)} s of ${Math.round(len)} s`;
  scrub.value = v * 1000;
  scrub.style.setProperty('--f', v.toFixed(4));
  if (txt !== timeTxt) {
    timeTxt = txt;
    scTime.textContent = txt;
    scrub.setAttribute('aria-valuetext', `${Math.round(v * len)} of ${Math.round(len)} seconds`);
  }
  const lbl = epi ? `Time within ${epi.name}` : 'Time in the scene',
    ttl = epi ? `${epi.name}: part of the whole scene, from ${Math.round(a0 * dur)} s to ${Math.round(epi.a1 * dur)} s of ${dur} s` : '';
  if (lbl !== lblTxt) scrub.setAttribute('aria-label', (lblTxt = lbl));
  if (ttl !== ttlTxt) scrubWrap.title = ttlTxt = ttl;
  syncSteps(t);
}
// A still diagram has no timeline: Play, the scrubber and the views give way to one plain sentence; the steps stay, for reading.
function staticMode(on) {
  [playBtn, scrubWrap, scTime, viewsEl].forEach((n) => {
    n.hidden = on;
  });
  staticEl.hidden = !on;
  overlay.classList.toggle('is-static', on);
  if (on) {
    staticTxt.textContent = COMPACT.matches
      ? REDUCED
        ? 'Animation is off, so this is a still diagram.'
        : 'The 3D view could not start here.'
      : REDUCED
        ? 'Animation is off on this device, so this is a still diagram.'
        : 'The 3D view could not start here, so this is a still diagram.';
    $('scRetry').hidden = REDUCED; // with animation switched off, trying again changes nothing
    setPlayBtn(false);
  } else setPlayBtn(true);
  stepsNote.textContent = on ? 'Steps are for reading only, because the animation is not running.' : 'Select a step to jump to it.';
  if (on) {
    stepsBox.open = true;
    stepNow.textContent = '';
  }
  stepsEl.querySelectorAll('.step').forEach((b) => (on ? b.setAttribute('aria-disabled', 'true') : b.removeAttribute('aria-disabled')));
}
// "Try again": forget that 3D failed and open the same scene once more.
$('scRetry').onclick = () => {
  if (!cur) return;
  glOK = null;
  openScene(cur.id);
};
scrub.oninput = () => {
  if (host && cur && !stillOnly) {
    host.playing = false;
    setPlayBtn(false);
    host.update(epi ? epi.a0 + 0.001 + (scrub.value / 1000) * (epi.a1 - (epi.last ? 0 : 0.001) - epi.a0 - 0.001) : scrub.value / 1000);
  }
};
// Play/pause: an icon button whose accessible name is the action it will do.
function setPlayBtn(on) {
  playBtn.classList.toggle('playing', !!on);
  playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
  playBtn.title = on ? 'Pause (Space)' : 'Play (Space)';
  playBtn.querySelector('use').setAttribute('href', on ? '#i-pause' : '#i-play');
  playBtn.disabled = false;
}
function togglePlay() {
  if (!host || !cur || !glOK || stillOnly) return;
  host.playing = !host.playing;
  hideHint();
  if (host.playing && host.t >= 1) host.t = 0;
  setPlayBtn(host.playing);
  setStatus(host.playing ? 'Playing.' : 'Paused.');
}
playBtn.onclick = togglePlay;
const narrowViews = matchMedia('(max-width: 1180px)'),
  phoneViews = matchMedia('(max-width: 760px)');
narrowViews.addEventListener?.('change', () => host && cur && buildViews(cur, host.sim));
phoneViews.addEventListener?.('change', () => host && cur && buildViews(cur, host.sim));
// A short label for a phone button (about 12 characters at most, always whole words); the full name stays as the button's accessible name.
const STOP = /^(the|and|in|of|a|to|at|on|for|from)$/i;
function phoneLabel(label) {
  if (/^whole scene/i.test(label)) return 'Whole';
  let s = label
    .replace(/\s*\([^)]*\)/g, '')
    .split(':')[0]
    .replace(/^(From|Follow) (the |a )?(.+)$/i, (m, f, a, rest) => (/^follow$/i.test(f) ? 'Follow' : rest))
    .replace(/^(the) /i, '')
    .replace(/\s+in\s+(GEO|LEO|low Earth orbit)$/i, '')
    .trim();
  if (s.length <= 12) return s.replace(/^./, (m) => m.toUpperCase());
  s = s.replace(/^all (three|\w+) \w+$/i, 'All $1').replace(/\s+(?:and the|and)\s+/i, ', ').replace(/\s+(of|with|at|on)\s+.*$/i, '');
  if (s.length > 12) {
    const out = [];
    for (const w of s.split(/\s+/)) {
      if ([...out, w].join(' ').length > 12) break;
      out.push(w);
    }
    while (out.length > 1 && STOP.test(out.at(-1).replace(/,$/, ''))) out.pop();
    s = (out.join(' ') || s.split(/\s+/)[0]).replace(/,$/, '');
  }
  return s.replace(/^./, (m) => m.toUpperCase());
}
function buildViews(cfg, sim) {
  camsEl.textContent = '';
  camOn = -2;
  sim.cams.forEach((c, i) => {
    const label = viewName(cfg.cameras?.[i], c.name),
      b = document.createElement('button');
    b.type = 'button';
    const short = phoneViews.matches ? phoneLabel(label) : narrowViews.matches ? label.replace(/^From (the |a )?/i, '').replace(/^Follow the action$/i, 'Follow').replace(/^./, (m) => m.toUpperCase()) : label;
    b.textContent = short;
    if (short !== label) b.setAttribute('aria-label', label);
    b.dataset.name = label === c.name ? '' : c.name;
    b.setAttribute('aria-keyshortcuts', String(i + 1));
    b.onclick = () => chooseView(i);
    camsEl.appendChild(b);
  });
  requestAnimationFrame(camFade);
}
function chooseView(i) {
  if (!host || !cur || !glOK || stillOnly || !host.sim.cams[i]) return;
  host.pickCam(i);
  syncCams();
  setStatus(`View: ${host.sim.cams[i].name}.`);
}
// Phone: the views scroll sideways; a fade on the right edge says more lie beyond it.
function camFade() {
  camsEl.classList.toggle('at-end', camsEl.scrollWidth - camsEl.clientWidth - camsEl.scrollLeft <= 4);
  camsEl.classList.toggle('at-start', camsEl.scrollLeft <= 4);
}
camsEl.addEventListener('scroll', camFade, { passive: true });
addEventListener('resize', camFade);

// ---------------------------------------------------------------- previous, next, close, related law
$('scClose').onclick = closeScene;
const go = (d) => {
  const i = ORDER.indexOf(cur);
  if (i >= 0) openScene(ORDER[(i + d + ORDER.length) % ORDER.length].id);
};
$('scPrev').onclick = () => go(-1);
$('scNext').onclick = () => go(1);
lawBtn.onclick = () => {
  const id = cur?.related;
  if (!id) return;
  closeScene();
  const m = document.querySelector(`#legalSvg [data-id="${id}"]`);
  if (!m) return;
  $('legalBand').scrollIntoView({ block: 'nearest' });
  m.classList.add('hl', 'flash-hl');
  m.focus();
  setGuide(parse(byId[id].start));
  setTimeout(() => {
    m.classList.remove('hl', 'flash-hl');
  }, 3500);
};

// ---------------------------------------------------------------- story edges: a soft fade at the top and bottom says there is more to scroll
function updateFades() {
  const max = asideBody.scrollHeight - asideBody.clientHeight;
  asideWrap.classList.toggle('can-up', asideBody.scrollTop > 4);
  asideWrap.classList.toggle('can-down', max - asideBody.scrollTop > 56); // the last 48 px are only padding: no fade over them
}
asideBody.addEventListener('scroll', updateFades, { passive: true });
addEventListener('resize', updateFades);
asideBody.addEventListener('toggle', updateFades, true);
if ('ResizeObserver' in window) new ResizeObserver(updateFades).observe(asideBody);

// ---------------------------------------------------------------- keyboard hint, shown once per visit
function showHint() {
  if (hintShown || stillOnly || !KEYBOARD.matches || COMPACT.matches || SHORT.matches) return;
  hintShown = true;
  // bottom left, just above the caption pill: no inset (top right) and no label of the picture sits there
  const capH = host?.statusEl?.offsetHeight || 28;
  hintEl.style.bottom = capH + 22 + 'px';
  hintEl.classList.add('on');
  hintTimer = setTimeout(hideHint, 3000);
}
function hideHint() {
  clearTimeout(hintTimer);
  hintEl.classList.remove('on');
}
overlay.addEventListener('pointerdown', hideHint, { passive: true });
overlay.addEventListener('keydown', hideHint, { passive: true });

// ---------------------------------------------------------------- keyboard: Space plays or pauses, Left and Right change scene, 1 to 5 choose a view, Esc closes
const TABBABLE = 'button:not([disabled]),input:not([disabled]),a[href],summary,[tabindex]';
function trapTab(e) {
  const list = [...panel.querySelectorAll(TABBABLE)].filter(
    (n) => n.tabIndex >= 0 && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden' && !n.closest('[hidden],[aria-hidden="true"]'),
  );
  if (!list.length) return;
  const i = list.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) {
    e.preventDefault();
    list.at(-1).focus();
  } else if (!e.shiftKey && i === list.length - 1) {
    e.preventDefault();
    list[0].focus();
  }
}
// Left and Right on the scrubber move one second (five with Shift); everywhere else they change scene.
function seek(e) {
  const dur = cur?.duration || 0;
  if (!dur || !host || !glOK || stillOnly) return;
  e.preventDefault();
  const a0 = epi ? epi.a0 + 0.001 : 0,
    a1 = epi ? epi.a1 - (epi.last ? 0 : 0.001) : 1;
  host.playing = false;
  setPlayBtn(false);
  host.update(Math.max(a0, Math.min(a1, host.t + ((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 5 : 1)) / dur)));
}
document.addEventListener('keydown', (e) => {
  if (!cur || e.defaultPrevented) return;
  hideHint();
  if (e.key === 'Escape') {
    e.preventDefault();
    if (!sheet.hidden) return toggleSheet(false);
    closeScene();
    return;
  }
  if (e.key === 'Tab') return trapTab(e);
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target instanceof Element ? e.target : document.body;
  if (t.matches('input:not([type=range]),textarea,select,[contenteditable]')) return;
  if (e.key === ' ') {
    if (t.matches('button,summary,a[href]')) return; // the control takes Space itself
    e.preventDefault();
    togglePlay();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    if (t === scrub) return seek(e);
    e.preventDefault();
    go(e.key === 'ArrowLeft' ? -1 : 1);
  } else if (/^[1-9]$/.test(e.key) && host && host.sim.cams[+e.key - 1]) {
    e.preventDefault();
    chooseView(+e.key - 1);
  }
});
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeScene();
});

// ---------------------------------------------------------------- saved image
// Still export. WebGL scenes use the host's renderer; still diagrams are rasterised from their SVG at print width (3000 px) with header and footer bands.
const PRINT_W = 3000;
// Same layout as the live image (GLHost.stillPNG): a header band with the note on illustration, the diagram, then a footer band with the title,
// the source and the imagery credit on separate lines. Sizes are in units of PRINT_W / 1000.
function svgToPNG(svg, title, cite) {
  return new Promise((resolve, reject) => {
    const vb = svg.viewBox.baseVal,
      xml = new XMLSerializer().serializeToString(svg),
      img = new Image();
    img.onload = () => {
      const s = PRINT_W / 1000,
        hb = Math.round(40 * s),
        fb = Math.round(92 * s),
        H = Math.round(PRINT_W * 0.625) - hb - fb; // the same 3000 x 1875 total as the live images (the diagram is laid out at this aspect)
      const c = document.createElement('canvas'),
        g = c.getContext('2d');
      c.width = PRINT_W;
      c.height = H + hb + fb;
      g.fillStyle = '#060912';
      g.fillRect(0, 0, c.width, c.height);
      const fit = Math.min(PRINT_W / vb.width, H / vb.height); // contain (exact fit for the off-screen stage laid out at this aspect)
      g.drawImage(img, (PRINT_W - vb.width * fit) / 2, hb + (H - vb.height * fit) / 2, vb.width * fit, vb.height * fit);
      g.fillStyle = '#0b1120';
      g.fillRect(0, 0, PRINT_W, hb);
      g.fillRect(0, hb + H, PRINT_W, fb);
      g.strokeStyle = 'rgba(150,175,230,0.3)';
      g.lineWidth = Math.max(1, s);
      g.beginPath();
      g.moveTo(0, hb - 0.5);
      g.lineTo(PRINT_W, hb - 0.5);
      g.moveTo(0, hb + H + 0.5);
      g.lineTo(PRINT_W, hb + H + 0.5);
      g.stroke();
      g.textBaseline = 'middle';
      g.fillStyle = '#ffc86b';
      g.font = `600 ${Math.round(14 * s)}px ${SANS}`;
      g.fillText('Drawn for illustration. Orbit heights are squeezed to fit.', 16 * s, hb / 2);
      g.fillStyle = '#eef2fb';
      g.font = `600 ${Math.round(25 * s)}px ${SERIF}`;
      g.fillText(title, 16 * s, hb + H + 24 * s);
      const srcTxt = `Source: ${String(cite || '')
        .trim()
        .replace(/[.;,\s]+$/, '')}.`;
      const credit = svg.dataset.earth === 'bluemarble' ? 'Earth imagery: NASA Blue Marble (public domain).' : 'Land map: Natural Earth (public domain).';
      // Both footer lines share one font size: the largest (up to 15 px units) at which the longer line still fits.
      let f = Math.round(15 * s);
      for (; f > 10 * s; f -= 0.5 * s) {
        g.font = `${f}px ${SANS}`;
        if (Math.max(g.measureText(srcTxt).width, g.measureText(credit).width) <= PRINT_W - 32 * s) break;
      }
      g.font = `${f}px ${SANS}`;
      g.fillStyle = '#c3cbe0';
      g.fillText(srcTxt, 16 * s, hb + H + 54 * s);
      g.fillText(credit, 16 * s, hb + H + 77 * s);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('The diagram could not be turned into an image'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
}
export async function exportStill() {
  if (!cur) return null;
  await fontsReady; // the print layout measures and draws text on canvas
  if (host && glOK) return host.stillPNG(cur.title, cur.cite);
  const svg = view.querySelector(':scope > svg');
  if (!svg) throw new Error('No diagram to save');
  // The diagram is laid out afresh in an off-screen stage 760 px wide (so the Earth fills more of the frame): its 11 px labels then
  // come out at about 43 px in the 3000 px print, instead of the 25 to 30 px a wide desktop stage would give. Same layout engine as on screen.
  if (curSim) {
    // The diagram is laid out at the live image's body aspect (3000 x 1479: the whole image is 3000 x 1875 with its bands), so both sets match.
    const vw = 760,
      vh = Math.round((vw * 1479) / 3000),
      tmp = document.createElement('div');
    tmp.setAttribute('aria-hidden', 'true');
    tmp.style.cssText = `position:fixed;left:-10000px;top:0;width:${vw}px;height:${vh}px;overflow:hidden`;
    document.body.appendChild(tmp);
    try {
      const node = renderSVG(curSim, tmp, undefined, { print: true });
      if (window.__cs) window.__cs.lastStillLay = node?.__lay; // test hook: the print layout's probe (craft sizes, Earth disc)
      if (node?.viewBox) return await svgToPNG(node, cur.title, cur.cite);
    } catch (e) {
      /* fall back to the on-screen diagram */
    } finally {
      tmp.remove();
    }
  }
  return svgToPNG(svg, cur.title, cur.cite);
}
exportBtn.onclick = async () => {
  const c = cur;
  if (!c) return;
  try {
    toast('Saving image…');
    const url = await exportStill();
    download(`counterspace-${slug(c.title)}.png`, url, 'image/png');
    toast('Image saved.');
  } catch (e) {
    toast('The image could not be saved. Try your browser’s screenshot tool instead.', 'warn');
  }
};
const tourBtn = $('tourBtn');
if (tourBtn) tourBtn.onclick = (e) => openScene(ORDER[0].id, e.currentTarget);

// ---------------------------------------------------------------- hero
// Hero overview uses the same single renderer; it is unloaded whenever a scene opens.
export const heroStage = $('heroStage');
let heroWanted = false; // the hero has been upgraded to WebGL (on user intent); only then does closing a scene restart it
export async function startHero() {
  heroWanted = true;
  heroSim = buildSim(HERO);
  const h = await getHost();
  if (cur) return;
  if (h) {
    heroStage.querySelector('svg')?.remove();
    h.mount(heroStage);
    h.load(heroSim);
    h.setCam(0);
    h.playing = true;
    h.play();
    prefetchEarth();
  } else if (!heroStage.querySelector('svg')) renderSVG(heroSim, heroStage, 0.2);
}
function unloadHero() {
  if (host && host.el === heroStage) host.unload();
}

// Still diagrams size themselves from the stage at open time: redraw them if the window is resized while open.
let srz = 0;
addEventListener('resize', () => {
  clearTimeout(srz);
  srz = setTimeout(() => {
    if (cur && !(host && glOK)) {
      view.querySelector(':scope > svg')?.remove();
      renderSVG(buildSim(cur), view);
    }
  }, 200);
});
hooks.openScene = openScene;
hooks.prefetchEarth = prefetchEarth;
