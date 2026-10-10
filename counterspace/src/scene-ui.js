// ============================================================================
// scene-ui.js: the 3D explainer window (dialog, story steps, scrubber, views, keyboard, saved image) and the hero.
// Provides: openScene(), closeScene(), exportStill(), startHero(); owns the single WebGL host.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { REDUCED, byId, ensureLand, esc, fmtD, parse } from './app.js';
import { GLHost } from './scenes/gl-host.js';
import { loadEarth } from './scenes/earth.js';
import { HERO, SCENES } from './scenes/config.js';
import { buildSim } from './scenes/sim.js';
import { renderSVG } from './scenes/svg-fallback.js';
import { hideCard, legalKindWords, setGuide } from './ui.js';
import { linkText, pairsAt } from './links.js';
import { drawnPara, pairWord, recapLine, recapLinks } from './recap.js';
import { revealCapacity, revealedCount } from './hero-timeline.js';
import { showInHero } from './rewards.js';
import { posterURL } from './scenes/posters.js';
import { download } from './export.js';
import { hooks, seenScenes } from './shared.js';
import { revealIn } from './explore.js';
import { SANS, SERIF, fontsReady } from './fonts.js';
import { FACTS, KIND as KINDS, SHORT as SHORT_NAME, nextScenes } from './discover-data.js';
import * as THREE from 'three';
export let host = null,
  glOK = null;
async function getHost() {
  ensureLand();
  if (REDUCED) return null;
  if (glOK === false) return null;
  try {
    if (!host) {
      host = new GLHost(THREE);
      host.onPlaybackChange = (on) => {
        if (cur && host.el === view) {
          setPlayBtn(on);
          if (!on && host._ended) setStatus('Finished. Replay starts this event again.');
        }
      };
      host.onInteraction = () => {
        if (!cur) return;
        if (tour) { clearTimeout(tour.timer); tour.timer = 0; }
        setStatus('Paused.');
      };
      host.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        const failed = host;
        if (!failed) return;
        failed.interrupt();
        endTour(false);
        const inScene = !!cur && failed.el === view;
        failed.unload();
        failed.ro.disconnect();
        failed.canvas.remove();
        failed.labelLayer?.remove();
        failed.renderer.dispose();
        host = null;
        glOK = false;
        if (inScene) {
          stillOnly = true;
          renderSVG(curSim, view);
          staticMode(true);
          setStatus('The animation stopped. A still diagram is shown.');
        }
      });
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
        const wasEnded = host._ended;
        upd(t);
        if (wasEnded) setPlayBtn(host.playing);
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
// Where a scene opens (a fraction of its length) when the first frame is a plain stretch of ocean or a dark limb: the telling moment the poster shows. The scene
// plays on from there and holds the last diagram. Replay and a tour start at the beginning. Chosen by viewing the frames at 0 to 0.6.
const OPEN_AT = { starfish: 0.16, laser: 0.2, spaceplanes: 0.3 };
export const ORDER = [...SCENES].sort((a, b) => (a.date < b.date ? -1 : 1));

const $ = (id) => document.getElementById(id);
const overlay = $('overlay'),
  panel = $('scenePanel'),
  view = $('sceneView'),
  titleEl = $('sceneTitle'),
  countEl = $('sceneDate'),
  dotsEl = $('sceneDots'),
  captionEl = $('sceneCaption'),
  dykEl = $('sceneDyk'),
  srcEl = $('sceneSrc'),
  scaleEl = $('sceneScale'),
  stepsSection = $('sceneStepsSection'),
  stepsBox = $('sceneStepsBox'),
  stepsEl = $('sceneSteps'),
  stepsNote = $('stepsNote'),
  asideBody = $('asideBody'),
  footEl = $('sceneFoot'),
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
  hintEl = $('sceneHint'),
  srcRow = $('sceneSrcLine'),
  slBtn = $('slSource'),
  slLinks = $('slLinks'),
  slPop = $('slPop'),
  slNextPop = $('slNextPop');
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
  if (open && cur) host?.interrupt();
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
export async function openScene(id, originEl, viaTour) {
  const cfg = SCENES.find((s) => s.id === id);
  if (!cfg) return;
  if (!viaTour) endTour(false); // choosing a scene by hand ends the tour
  recapEl.hidden = true;
  clearTimeout(closeTimer);
  const wasOpen = overlay.classList.contains('open'),
    onDot = wasOpen && dotsEl.contains(document.activeElement),
    token = ++openToken;
  if (!wasOpen) {
    returnFocus = originEl || document.activeElement;
    document.dispatchEvent(new CustomEvent('cs:opening')); // a chart card or the hero's card left open behind the window goes away now
  }
  cur = cfg;
  epi = null;
  wideSel = -1;
  stillOnly = false;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setInert(true);
  fillStory(cfg);
  markSeen(cfg);
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
    if (!viaTour && OPEN_AT[cfg.id]) h.update(OPEN_AT[cfg.id]);
    h.playing = true;
    setPlayBtn(true);
    buildViews(cfg, sim);
    h.play();
    if (tour) h.onTick = tourTick; // the tour moves on when the scene has played to its end
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
  if (tour && !h) tour.timer = setTimeout(tourNext, REDUCED ? 12000 : 9000); // a still diagram has no run: it stays up for a while, then the tour moves on
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

// The account shows its first sentences, whole (never cut mid-sentence); the button opens the rest. How many sentences show depends on the room:
// fitSteps() tries two sentences, then one, then none, so the step list always keeps at least three or four whole rows.
const WIDE = matchMedia('(min-width: 1500px)');
const moreBtn = $('sceneMore');
const stepChoose = $('sceneStepChoose');
stepChoose.onchange = () => {
  if (stillOnly) {
    setMore(true);
    const li = stepsEl.children[+stepChoose.value];
    li?.scrollIntoView({ block: 'nearest' });
    li?.querySelector('button')?.focus();
  } else {
    jumpToStep(+stepChoose.value);
    if (host) { host.playing = false; setPlayBtn(false); }
  }
};
let expanded = false,
  sentences = [];
const ABBR = /\b(?:U\.S|U\.K|U\.N|No|Nos|St|Dr|Mr|Ms|Gen|Lt|Col|vs|approx|e\.g|i\.e|etc|Fig|ca|Jan|Feb|Aug|Sept|Oct|Nov|Dec)\.$/;
function splitSentences(text) {
  const out = [];
  for (const part of text.split(/(?<=[.!?]["”')\]]?)\s+(?=["“(]?[A-Z0-9])/)) {
    if (out.length && ABBR.test(out.at(-1))) out[out.length - 1] += ' ' + part;
    else out.push(part);
  }
  return out;
}
// Two sentences say the same thing when most of their longer words are shared.
const words = (t) => new Set(t.toLowerCase().match(/[a-z0-9]{4,}/g) || []),
  same = (a, b) => {
    const A = words(a),
      B = words(b);
    let n = 0;
    A.forEach((w) => B.has(w) && n++);
    return n / Math.max(1, Math.min(A.size, B.size)) >= 0.5;
  };
// level 0: two sentences (one on a phone), 1: one sentence, 2: none; a number above that (from fitSteps, when there is room to spare) adds sentences
function setLede(level, count) {
  const full = cur?.caption || '';
  // The first sentence always shows, at every width: it says what the scene is before the steps say what happens. (The lede gives way from two sentences to one.)
  // The intro is two sentences at every width (one when the room is tight); the full account is behind "Read the full account".
  const max = expanded ? Infinity : Math.max(1, count ?? (level === 0 ? 2 : 1));
  // On a wide window the story opens with a "Did you know" line; an intro sentence that says the same thing is left out of the intro (the full account keeps it)
  const dyk = WIDE.matches && !dykEl.hidden,
    pool = dyk ? (expanded ? splitSentences(full) : sentences).filter((t, i) => !i || !same(t, FACTS[cur.id])) : sentences;
  // The full account leaves out the sentence the "Did you know" line above it already says, so no sentence shows twice
  let shown = expanded ? (dyk ? pool.join(' ') : full) : pool.slice(0, max).join(' ');
  if (!expanded && max === 2 && shown.length > 340) shown = pool[0];
  if (!expanded) shown = SCENE_SUMMARIES[cur.id] || shown;
  captionEl.textContent = shown;
  captionEl.hidden = !shown;
  moreBtn.classList.toggle('lone', !shown); // nothing above it: the button stands alone
  syncMore();
}
// One fold for the whole story: the full account and every step open together. The button shows only while something is folded (a longer account than
// the intro, or steps beyond the window), and says which; once open it stays, as "Show less".
let hasMore = false;
function syncMore() {
  const full = (cur?.caption || '').trim(),
    capFolded = !!cur?.lede && cur.lede.trim() !== full,
    stepsHidden = !expanded && !STACKED.matches && !!stepsEl.style.height && listScrolls();
  if (!expanded) hasMore = capFolded || stepsHidden;
  moreBtn.hidden = !hasMore;
  moreBtn.querySelector('span').textContent = expanded ? 'Show less' : capFolded ? (steps.length > 4 ? 'Read the full account and every step' : 'Read the full account') : 'Show every step';
}
function setMore(open) {
  expanded = open;
  asideBody.classList.toggle('expanded', open);
  panel.classList.toggle('reading-account', open);
  if (open && host) { host.playing = false; setPlayBtn(false); }
  moreBtn.setAttribute('aria-expanded', String(open));
  moreBtn.classList.toggle('open', open);
  setLede(0); // the full account replaces the intro (fitSteps stops short when open, so the text is set here)
  if (!open) asideBody.scrollTop = 0;
  fitSteps();
  updateFades();
}
moreBtn.onclick = () => setMore(!expanded);

// Text of the open scene: title, count, story, source, related law, picture note and the steps.
// "SWF" appears in the steps; the source line is where the reader learns what it stands for.
const citeText = (c) => c.replace(/^Secure World Foundation,/, 'Secure World Foundation (SWF),');
const SCENE_SUMMARIES = {
  starfish: 'A U.S. nuclear test about 400 km up trapped electrons in Earth’s magnetic field.',
  fengyun: 'China destroyed its Fengyun-1C weather satellite, leaving long-lived debris.',
  cosmos1408: 'Russia destroyed Cosmos 1408. Debris crossed the International Space Station’s orbit.',
  viasat: 'A cyberattack disabled users’ ground modems; the KA-SAT satellite stayed in orbit.',
  'sj21-tug': 'China’s SJ-21 docked with defunct Compass G2 and towed it above the working GEO belt.',
  laser: 'The U.S. aimed MIRACL at MSTI-3 in 1997. Peresvet is a separate Russian case.',
  'burnt-frost': 'A U.S. ship-launched interceptor destroyed USA-193 in a low orbit; its debris decayed quickly.',
  shakti: 'India intercepted Microsat-R at about 300 km in Mission Shakti.',
  solwind: 'A missile launched from a U.S. F-15 destroyed the Solwind satellite.',
  dn2: 'DN-2 had no target. China reported 10,000 km; an analysis cited by SWF estimated 30,000 km or more.',
  gnss: 'A ground jammer disrupts GPS receivers on aircraft; it does not attack the GPS satellites.',
  rpo: 'Three episodes of spacecraft coming close. A close approach does not establish hostile intent.',
  spaceplanes: 'Reusable U.S. and Chinese craft fly unusual missions; their purpose is not established here.'
};
const PHONE_TITLES = {
  starfish: 'Starfish Prime (1962)', solwind: 'Solwind intercept (1985)', fengyun: 'Fengyun-1C intercept (2007)',
  'burnt-frost': 'Operation Burnt Frost (2008)', dn2: 'DN-2 high-altitude test (2013)', shakti: 'Mission Shakti (2019)',
  cosmos1408: 'Cosmos 1408 intercept (2021)', gnss: 'Baltic GPS jamming', viasat: 'Viasat cyberattack (2022)',
  laser: 'MIRACL laser test (1997)', 'sj21-tug': 'SJ-21 satellite tow (2022)', rpo: 'Three close approaches',
  spaceplanes: 'Reusable spaceplanes'
};
function syncSceneTitle(cfg) {
  const phone = matchMedia('(max-width: 760px)').matches;
  titleEl.innerHTML = esc(phone ? PHONE_TITLES[cfg.id] || cfg.title : cfg.title).replace(/[^\s(]+-[^\s)]+/g, m => `<span class="nb">${m}</span>`);
  titleEl.setAttribute('aria-label', cfg.title);
}
function fillStory(cfg) {
  const n = ORDER.indexOf(cfg) + 1;
  // Names such as X-37B or SJ-21 stay on one line instead of breaking at their hyphen.
  syncSceneTitle(cfg);
  panel.setAttribute('aria-label', `3D explainer: ${cfg.title}`);
  countEl.textContent = `${n} / ${ORDER.length}`;
  sentences = splitSentences(cfg.lede || cfg.caption);
  dykEl.innerHTML = FACTS[cfg.id] ? `${esc(FACTS[cfg.id])}` : '';
  // the "Did you know" line is left out when the account's own first sentence already says it
  dykEl.hidden = !FACTS[cfg.id] || same(splitSentences(cfg.caption || cfg.lede || '')[0] || '', FACTS[cfg.id]);
  expanded = false;
  asideBody.classList.remove('expanded');
  panel.classList.remove('reading-account');
  moreBtn.setAttribute('aria-expanded', 'false');
  moreBtn.classList.remove('open');
  hasMore = false;
  setLede(0);
  const ev = byId[cfg.event];
  srcEl.innerHTML =
    `<span class="sv-cite">Source: ${esc(citeText(cfg.cite))}</span>` +
    (ev
      ? `<a href="${esc(ev.source_url)}" target="_blank" rel="noopener">Open the source<svg class="ico" aria-hidden="true" focusable="false">` +
        `<use href="#i-external"/></svg><span class="sr"> (opens in a new tab)</span></a>`
      : '') +
    (cfg.related ? '' : '<span class="sv-nolaw">No related law on the timeline.</span>');
  // Stacked layouts: one row of pills (Source, Open the source, Related law); the citation and the picture note open from "Source".
  slLinks.innerHTML =
    (ev ? `<a class="pill" href="${esc(ev.source_url)}" target="_blank" rel="noopener">Open the source<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr"> (opens in a new tab)</span></a>` : '') +
    (cfg.related ? `<button type="button" class="pill sl-law">Related law</button>` : '');
  const slLaw = slLinks.querySelector('.sl-law');
  if (slLaw) slLaw.onclick = () => lawBtn.click();
  toggleSrc(false);
  scaleEl.textContent = [
    'Drawn for illustration. Orbit heights are squeezed so every orbit fits.',
    cfg.scaleNote,
    'Earth imagery: NASA Blue Marble and Black Marble (public domain). A simple map is drawn if the photograph cannot load.',
    REDUCED ? 'Your device is set to limit animation, so a still diagram is shown.' : '',
  ]
    .filter(Boolean)
    .join(' ');
  slPop.innerHTML = `<p><strong>Source.</strong> ${esc(citeText(cfg.cite))}</p><p><strong>About this picture.</strong> ${esc(scaleEl.textContent)}</p>`;
  fillNext(cfg);
  lawBtn.disabled = !cfg.related;
  lawBox.classList.toggle('none', !cfg.related); // no related law: the button gives way to a plain sentence in the source
  // a related law that our records also pair with this event (the first law that followed it) is simply "Related law"; one that is related in general, not a pair
  // in data/lag_pairs.json, says so, so it cannot read as a contradiction of the picture card's "No law in our records follows this test as a pair"
  lawTxt.textContent = cfg.related ? `Related law${pairedLaw(cfg) ? '' : ' (general, not a paired follow-up)'}: ${byId[cfg.related]?.label}` : 'Related law';
  fillLawCard(cfg);
  renderSteps(cfg);
}

// "Where to go next": up to three other scenes (the next of the same kind, then the nearest by date of a different kind) and, when the scene's event is
// drawn on a chart, a button that closes the window and shows it there.
const markOf = (id) => id && document.querySelector(`#svgA [data-id="${id}"], #svgC [data-id="${id}"], #svgR [data-id="${id}"]`);
function nextSceneBtn(id, tag) {
  const s = SCENES.find((c) => c.id === id);
  if (!s) return null;
  const b = document.createElement('button'),
    name = `${SHORT_NAME[id] || s.title}, ${s.date.slice(0, 4)}`;
  b.type = 'button';
  b.className = 'sv-next-btn';
  b.textContent = name;
  b.title = tag;
  b.setAttribute('aria-label', `${name}: ${tag.charAt(0).toLowerCase()}${tag.slice(1)}`);
  b.onclick = () => openScene(id);
  return b;
}
function findOnChart(cfg) {
  const m = markOf(cfg.event);
  closeScene(true);
  if (!m) return;
  revealIn(m); // a mark in "Explore the data" sits in a tab: open that tab first
  if (hooks.landOnMark) hooks.landOnMark(m, !REDUCED);
  else m.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
  m.classList.add('hl', 'flash-hl');
  m.focus({ preventScroll: true });
  setTimeout(() => m.classList.remove('hl', 'flash-hl'), 3500);
}
const CHART_ICON = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-chart"/></svg>';
function fillNext(cfg) {
  const box = $('nextLinks'),
    popBox = $('slNextLinks');
  box.textContent = '';
  popBox.textContent = '';
  togglePair(null); // each scene starts with both notes closed, so the story keeps its room
  toggleNextPop(false);
  const next = nextScenes(cfg, ORDER);
  next.forEach(({ id, tag }) => {
    const b = nextSceneBtn(id, tag),
      c = nextSceneBtn(id, tag);
    if (b) (box.appendChild(b), popBox.appendChild(c));
  });
  const onChart = !!markOf(cfg.event);
  if (onChart) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sv-next-btn chart';
    b.innerHTML = CHART_ICON + 'Find it on the chart';
    b.onclick = () => findOnChart(cfg);
    box.appendChild(b);
  }
  // A short desktop window has no "About this picture / Where to go next" row (the story column keeps its room for the steps): the same two ways on are two
  // pills in the source row ("Where to go next" opens the scenes; "Find it on the chart" closes the window and shows the event there). They are shown by scenes.css only there.
  if (next.length) {
    const n = document.createElement('button');
    n.type = 'button';
    n.className = 'pill sl-x sl-next';
    n.id = 'slNext';
    n.setAttribute('aria-expanded', 'false');
    n.setAttribute('aria-controls', 'slNextPop');
    n.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-arrow-right"/></svg>Where to go next';
    n.onclick = () => toggleNextPop(slNextPop.hidden);
    slLinks.appendChild(n);
  }
  if (onChart) {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'pill sl-x sl-chart';
    c.innerHTML = CHART_ICON + 'Find it on the chart';
    c.onclick = () => findOnChart(cfg);
    slLinks.appendChild(c);
  }
}

// A note that opens over the story column docks below the "About this picture / Where to go next" row, over the source line and the related-law button (the
// related-law card also takes the row's place), so it can never cover the list of steps. Where there is too little room below the row, the note keeps its
// place at the foot.
function anchorNote(note) {
  note.style.top = '';
  note.style.bottom = '';
  note.style.maxHeight = '';
  note.style.minHeight = '';
  const wr = $('asideWrap').getBoundingClientRect(),
    pr = $('svPair').getBoundingClientRect();
  if (!pr.height || pr.top < wr.top + 140 || pr.top > wr.bottom) return;
  const edge = note === lawCard ? pr.top : pr.bottom + 4,
    room = wr.bottom - edge - 8;
  if (room < 90) return;
  note.style.top = Math.round(edge - wr.top) + 'px';
  note.style.bottom = 'auto';
  note.style.maxHeight = Math.round(room) + 'px';
  // The related-law card ends where its text ends. When that is on or inside its own button's box (the button rests at the foot of the column in a tall window and its
  // label can take two lines), a strip of the button would show under the card: the card reaches down over the whole button, or stays clear of it.
  if (note === lawCard) {
    // a card whose text does not fit the room (a long citation in a short window) takes a little more: down to the foot's edge, and up into the gap above the row
    const over = note.scrollHeight - note.clientHeight;
    if (over > 1) {
      const up = Math.min(Math.max(0, over - 6), 12);
      note.style.top = Math.round(edge - wr.top - up) + 'px';
      note.style.maxHeight = Math.round(room + 6 + up) + 'px';
    }
    const nr = note.getBoundingClientRect(),
      br = lawBtn.getBoundingClientRect();
    if (br.height && nr.bottom > br.top - 4 && nr.bottom < br.bottom + 8) note.style.minHeight = Math.round(Math.min(br.bottom + 8, wr.bottom - 8) - nr.top) + 'px';
  }
}
function toggleSrc(open) {
  if (open && cur) host?.interrupt();
  if (open) toggleNextPop(false); // one note at a time over the story column
  slPop.hidden = !open;
  slBtn.setAttribute('aria-expanded', String(open));
}
slBtn.onclick = () => toggleSrc(slPop.hidden);
// Short desktop window: the scenes to go to next open from a pill in the source row, over the end of the story column like the source note
function toggleNextPop(open) {
  if (open && cur) host?.interrupt();
  if (open) toggleSrc(false);
  slNextPop.hidden = !open;
  $('slNext')?.setAttribute('aria-expanded', String(!!open));
}
// "About this picture" and "Where to go next" share one row; the one opened shows its text in the story column under the row (never over the steps or the source).
const pairBtns = { about: $('svAboutBtn'), next: $('svNextBtn') },
  pairBodies = { about: $('svAboutBody'), next: $('sceneNext') };
function togglePair(which) {
  if (which && cur) host?.interrupt();
  if (which) (toggleSrc(false), toggleNextPop(false), toggleLawCard(false)); // one note at a time over the story column
  asideBody.classList.toggle('has-note', !!which); // the list of steps keeps its own height; the column scrolls to the note (see scenes.css)
  Object.keys(pairBtns).forEach((k) => {
    const on = k === which;
    pairBtns[k].setAttribute('aria-expanded', String(on));
    pairBodies[k].hidden = !on;
    if (on) pairBodies[k].scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
}
Object.keys(pairBtns).forEach((k) => (pairBtns[k].onclick = () => togglePair(pairBodies[k].hidden ? k : null)));
document.addEventListener('pointerdown', (e) => {
  if (!srcRow.contains(e.target)) (toggleSrc(false), toggleNextPop(false));
  // a note open over the story column closes on a press anywhere outside it and its button
  if (!e.target.closest?.('.sv-pbody, .sv-pbtn, #scRelated, .sl-law')) {
    if (!pairBodies.about.hidden || !pairBodies.next.hidden) togglePair(null);
    if (!lawCard.hidden) toggleLawCard(false);
  }
});

// While the dialog is open the page behind it is inert (no focus, not read out).
function setInert(on) {
  document.documentElement.classList.toggle('scene-open', on); // the page behind is also not painted, so no stale tile of it can show through the window
  [...document.body.children].forEach((n) => {
    if (n !== overlay && !/^(script|style|svg|link)$/i.test(n.tagName)) n.inert = on;
  });
}

// ---------------------------------------------------------------- close
// `nav` is true when the close is the first half of a jump somewhere else on the page (a chart, the timeline, the quiz, the top): the page must then stay where
// that jump puts it, so the close does not bring the hero back into view (the new link waits there for the reader's return).
export function closeScene(nav) {
  sheet.hidden = true;
  endTour(false);
  recapEl.hidden = true;
  if (!cur) return;
  const closing = cur;
  if (host?.el === view) host.interrupt();
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
  // Focus goes back to whatever opened the scene, if it is still on the page and showing. If nothing did (opened from code, so focus was on <body>, or the
  // opener has gone, like the hero's card), it goes to the scene's own card in the strip of scenes, then to the tour button. Never to a mark on a chart: a
  // focused mark opens its card, which would be left open over the page.
  const live = (n) => n && n !== document.body && document.contains(n) && !n.inert && n.getClientRects().length > 0;
  const inStrip = (id) => id && document.querySelector(`#scenes .pc-btn[data-id="${id}"]`);
  const target = [returnFocus, inStrip(closing.id), $('tourBtn')].find(live);
  returnFocus = null;
  target?.focus();
  if (target?.matches?.('.mark, [data-id]:not(.pc-btn)')) hideCard(); // a chart mark that opened the scene takes focus back without showing its card again
  document.dispatchEvent(new CustomEvent('cs:closed', { detail: { nav: nav === true } }));
}

// ---------------------------------------------------------------- steps: what happens, as a timeline that follows the animation
function renderSteps(cfg) {
  const dur = cfg.duration || 0;
  steps = (cfg.status || cfg.steps || []).filter(Array.isArray).map(([t, text]) => ({ t, text }));
  const fine = steps.some((s, i) => i && Math.round(s.t * dur) === Math.round(steps[i - 1].t * dur)); // two steps would read the same: show tenths
  stepIdx = -1;
  stepChoose.innerHTML = steps.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.text)}</option>`).join('');
  stepsSection.hidden = !steps.length;
  stepsEl.innerHTML = steps
    .map(
      (s, i) =>
        `<li data-i="${i}"><button type="button" class="step"><span class="st-time">${dur ? sec(s.t * dur, fine) : ''}</span>` +
        `<span class="st-rail" aria-hidden="true"></span><span class="st-text">${esc(s.text)}</span></button></li>`,
    )
    .join('');
  [...stepsEl.children].forEach((li) => liRO?.observe(li)); // (the old rows are gone: their observations end with them)
  stepsBox.open = true; // the list is always there; fitSteps() decides how many whole rows fit
  stepsEl.scrollTop = 0;
  requestAnimationFrame(fitSteps);
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
function markStep(k) {
  $('sceneCurrentStep').textContent = steps[k]?.text || '';
  if (document.activeElement !== stepChoose) stepChoose.value = String(k);
  [...stepsEl.children].forEach((li, i) => {
    li.classList.toggle('done', i < k);
    li.classList.toggle('now', i === k);
    const b = li.firstElementChild;
    if (i === k) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
}
function syncSteps(t) {
  if (!steps.length || stillOnly) return;
  const k = stepAt(t);
  if (k === stepIdx) return;
  const first = stepIdx < 0;
  stepIdx = k;
  markStep(k);
  const li = stepsEl.children[k];
  if (first && STACKED.matches) asideBody.scrollTop = 0; // Keep the opening explanation visible; playback follows subsequent steps.
  else if (first) requestAnimationFrame(() => followStep(li, true));
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
  if (!stepsBox.open || !r.height) return;
  if (STACKED.matches && !expanded && own === asideBody) return; // The live caption follows the action; the reader controls the account’s scroll position. // the list is folded away (phone)
  if (own === stepsEl) {
    // move to a step boundary so the list rests on whole steps: the active step lands fully in view
    const y = stepsEl.scrollTop,
      maxY = stepsEl.scrollHeight - stepsEl.clientHeight,
      need = li.offsetTop + li.offsetHeight - stepsEl.clientHeight;
    let to = y;
    if (li.offsetTop < y - 1) to = li.offsetTop;
    else if (need > y + 1) {
      to = maxY;
      for (const c of stepsEl.children) if (c.offsetTop >= need - 1) {
          to = Math.min(maxY, c.offsetTop);
          break;
        }
    }
    if (Math.abs(to - y) > 1) {
      // The active row is never seen half-way: a row below the window jumps in at once; the glide is only for a row already whole in view
      const inView = li.offsetTop >= y - 1 && li.offsetTop + li.offsetHeight <= y + stepsEl.clientHeight - (parseFloat(stepsEl.style.clipPath?.split(' ')[2]) || 0) + 1;
      const smooth = inView && !(REDUCED || instant || Math.abs(to - y) > stepsEl.clientHeight * 1.5);
      stepsEl.scrollTo({ top: to, behavior: smooth ? 'smooth' : 'auto' });
      if (!smooth) trimSteps(); // the clip follows the jump at once, so the active row is whole on the very next frame
      // a smooth scroll that did not arrive (a busy page, a browser that skips it) is finished at once, so the list always rests on its row
      if (smooth)
        setTimeout(() => {
          if (Math.abs(stepsEl.scrollTop - to) > 1 && performance.now() - lastUserScroll > 1500 && stepIdx === +li.dataset.i) stepsEl.scrollTo({ top: to, behavior: 'auto' });
        }, 700);
    }
    return;
  }
  const top = box.top + (own === stepsEl ? 4 : 56),
    bottom = box.bottom - (own === stepsEl ? 4 : 96);
  let dy = 0;
  if (r.bottom > bottom) dy = r.bottom - bottom;
  else if (r.top < top) dy = r.top - top;
  if (dy && own === asideBody) {
    // The column rests on a block boundary (a paragraph, a button, a step), never mid-line, so no half line shows under the picture.
    const pos = (n) => n.getBoundingClientRect().top - box.top + own.scrollTop,
      cap = own.scrollHeight - own.clientHeight,
      want = Math.min(cap, own.scrollTop + dy),
      cuts = [...own.children, ...own.querySelectorAll('.sv-steps h3'), ...stepsEl.children]
        .filter((n) => n.getClientRects().length)
        .flatMap((n) => {
          // a paragraph can also rest on any of its own lines
          const lh = parseFloat(getComputedStyle(n).lineHeight) || 0,
            lines = lh && n.matches('p, .sv-lede') ? Math.round(n.getBoundingClientRect().height / lh) : 1;
          return Array.from({ length: Math.max(1, lines) }, (_, k) => pos(n) + k * lh - 6);
        })
        .filter((v) => v >= want - 44 && v <= pos(li) - 2 && v <= cap + 0.5),
      ahead = cuts.filter((v) => v >= want - 0.5),
      pick = ahead.length ? Math.min(...ahead) : cuts.length ? Math.max(...cuts) : want, // the active row keeps 44 px of the 96 px margin below it at worst
      to = Math.min(own.scrollHeight - own.clientHeight, Math.max(0, pick));
    own.scrollTo({ top: to, behavior: REDUCED || instant ? 'auto' : 'smooth' });
    return;
  }
  if (dy) own.scrollBy({ top: dy, behavior: REDUCED || instant ? 'auto' : 'smooth' });
}
const listScrolls = () => stepsEl.scrollHeight > stepsEl.clientHeight + 2 && getComputedStyle(stepsEl).overflowY !== 'visible';
// The list shows whole steps at rest. The story column is a flex column whose list takes what the lede and the foot leave; this measures how many whole
// rows that is and cuts the list to the last row boundary, so no row is ever sliced. If fewer than three or four rows would fit, the lede gives way
// (two sentences, one, none). A fade appears at an edge only while rows are hidden there.
const MAX_ROWS = 5; // at most five whole steps show at once on a desktop window; the "Read the full account" fold and the scene's own progress carry the rest
function rowsFit() {
  stepsEl.style.removeProperty('--sp');
  stepsEl.style.height = '';
  stepsEl.style.flex = '';
  const avail = stepsEl.clientHeight;
  let n = 0,
    h = 0;
  const cap = STACKED.matches ? Infinity : MAX_ROWS; // a long list shows about six rows at a time on a desktop window, never a list taller than the picture
  if (stepsEl.scrollHeight <= avail + 1 && steps.length <= cap) return { n: steps.length, h: 0, avail };
  const first = stepsEl.firstElementChild;
  for (const li of stepsEl.children) {
    const b = li.offsetTop + li.offsetHeight;
    if (b <= avail + 1 && n < cap) {
      n++;
      h = b;
    } else break;
  }
  if (!n && first) {
    n = 1; // never less than one whole row: the column scrolls a little rather than slice it
    h = first.offsetHeight;
  }
  return { n, h, avail };
}
// A note opened under "About this picture" or "Where to go next" sits in the column, so the column scrolls; it is measured as if the note were closed.
function fitSteps() {
  const noted = asideBody.classList.contains('has-note'),
    at = asideBody.scrollTop;
  if (noted) asideBody.classList.remove('has-note');
  try {
    fitStepsClosed();
  } finally {
    if (noted) {
      asideBody.classList.add('has-note');
      asideBody.scrollTop = at;
    }
  }
}
function fitStepsClosed() {
  if (!cur) return;
  stepsEl.style.height = '';
  stepsEl.style.flex = '';
  stepsEl.style.removeProperty('--sp');
  stepsEl.style.paddingBottom = '';
  asideBody.classList.remove('pin'); // measured with the foot in its natural place; pinned to the bottom at the end
  // a phone with more than four steps, or a short phone screen: the list shows the playing step only and the picture keeps the height
  // The steps are read-only here: every row is drawn whole, at its natural height, and the story column scrolls if it must (no fixed-height window).
  const one = false;
  overlay.classList.toggle('steps-one', one);
  if (!steps.length) return;
  if (expanded) return fadeSteps(); // the whole account is open: the column scrolls and the list keeps its full height
  // Phone with more than four steps: the list shows the playing step only (more height for the picture); a phone with fewer shows up to three rows.
  const want = one ? 1 : Math.min(steps.length, COMPACT.matches ? 3 : 4);
  let r;
  for (let lvl = 0; lvl <= 1; lvl++) {
    setLede(lvl);
    r = rowsFit();
    if (asideBody.scrollHeight <= asideBody.clientHeight + 1) break; // every row fits whole, with nothing to scroll
    if (lvl === 1) break;
  }
  if (STACKED.matches) r.h = 0; // phone and tablet: every row at its natural height, the column scrolls; desktop: a window of whole rows
  if (r.h && !STACKED.matches) {
    // The window rests on a row at every step of the story, so the rows left under the last resting place can be shorter than the window and leave a blank band
    // above the cue. Of the heights that are a whole number of consecutive rows, take the one that leaves the least blank at any resting place.
    const kids = [...stepsEl.children],
      top = kids.map((k) => k.offsetTop),
      bot = kids.map((k) => k.offsetTop + k.offsetHeight),
      total = bot.at(-1),
      blank = (H) => {
        let worst = 0;
        for (let k = 0; k < kids.length; k++) {
          let end = top[k];
          for (let m = k; m < kids.length && bot[m] - top[k] <= H + 0.5; m++) end = bot[m];
          worst = Math.max(worst, H - (end - top[k]));
          if (total - top[k] <= H + 0.5) break;
        }
        return worst;
      };
    let best = r.h,
      bestCost = blank(r.h);
    for (let i = 0; i < kids.length; i++)
      for (let j = i; j < kids.length; j++) {
        const H = bot[j] - top[i];
        if (H > r.avail + 0.5 || H < r.avail * 0.7 || j - i + 1 > MAX_ROWS) continue;
        const c = blank(H);
        if (c < bestCost - 1 || (Math.abs(c - bestCost) <= 1 && H > best)) (best = H), (bestCost = c);
      }
    if (best < r.h || best > r.h) {
      r.h = best;
      r.n = 0;
      for (const b of bot) if (b <= best + 0.5) r.n++;
      r.n = Math.max(1, r.n);
    }
  }
  if (r.h) {
    stepsEl.style.flex = '0 0 auto';
    stepsEl.style.height = r.h + 'px';
    r.sp = Math.min(8, Math.max(0, Math.floor(((r.avail - r.h) / (2 * r.n)) * 50) / 50 - 0.02));
  } else if (r.n < steps.length) r.sp = 0;
  else if (!r.h) {
    // every row fits: a share of what is left under the content goes into the rows, so the column has no gap at its foot
    const last = [...asideBody.children].filter((c) => c.getClientRects().length).at(-1),
      ab = asideBody.getBoundingClientRect(),
      slack = last ? ab.bottom - parseFloat(getComputedStyle(asideBody).paddingBottom) - last.getBoundingClientRect().bottom : 0;
    r.sp = slack > 16 ? Math.min(WIDE.matches ? 18 : 10, (slack * 0.75) / (2 * steps.length)) : 0;
  }
  if (r.sp > 0.5) {
    stepsEl.style.setProperty('--sp', r.sp.toFixed(2) + 'px');
    if (r.h) stepsEl.style.height = r.h + r.sp * 2 * r.n + 0.8 + 'px';
  }
  if (r.h) {
    // so that every row can rest at the top of the list (also the last ones), the end of the list gets the room the last whole window leaves
    const kids = [...stepsEl.children],
      H = parseFloat(stepsEl.style.height),
      total = kids.at(-1).offsetTop + kids.at(-1).offsetHeight;
    let pad = 0;
    for (let k = kids.length - 1; k >= 0; k--) {
      const left = total - kids[k].offsetTop;
      if (left > H + 1.5) break;
      pad = H - left;
    }
    if (pad > 0.5) stepsEl.style.paddingBottom = pad + 'px';
  }
  // desktop: if the column still overflows (a rounding, a late font), take the last whole row out of the window rather than let the column scroll under the cue
  if (r.h && !STACKED.matches) {
    const kids = [...stepsEl.children];
    for (let k = r.n; k > 1 && asideBody.scrollHeight > asideBody.clientHeight + 0.5; k--) {
      stepsEl.style.height = kids[k - 2].offsetTop + kids[k - 2].offsetHeight + 'px';
    }
  }
  asideBody.classList.toggle('pin', WIDE.matches && !STACKED.matches && !expanded); // the source and the related law rest at the foot of the column
  const li = stepsEl.children[Math.max(0, stepIdx)];
  if (li && stepIdx >= 0) followStep(li, true);
  snapList(li);
  fadeSteps();
  trimSteps();
  requestAnimationFrame(() => requestAnimationFrame(trimSteps)); // and again once the rows have settled at their final sizes
}
// After a re-fit the list may rest between two rows (the rows changed size): move it to the nearest row edge that keeps the active row in view.
function snapList(active) {
  if (!stepsEl.style.height || !listScrolls()) return;
  const H = stepsEl.clientHeight,
    y = stepsEl.scrollTop,
    kids = [...stepsEl.children];
  if (kids.some((k) => Math.abs(k.offsetTop - y) < 1)) return;
  const ok = (t) => !active || stillOnly === undefined || (active.offsetTop >= t - 0.5 && active.offsetTop + active.offsetHeight <= t + H + 0.5);
  const maxY = stepsEl.scrollHeight - H;
  const c = kids
    .map((k) => k.offsetTop)
    .filter((t) => t <= maxY + 0.5 && ok(t))
    .sort((a, b) => Math.abs(a - y) - Math.abs(b - y))[0];
  if (c !== undefined) stepsEl.scrollTo({ top: c, behavior: 'auto' });
}
// Rows differ in height, so the window of a fixed height can show a sliver of the row after the last whole one: the box is clipped at that row's edge.
function trimSteps() {
  if (!stepsEl.style.height) {
    stepsEl.style.clipPath = '';
    return;
  }
  const H = stepsEl.clientHeight,
    y = stepsEl.scrollTop;
  let end = 0;
  for (const li of stepsEl.children) {
    const b = li.offsetTop + li.offsetHeight - y;
    if (b <= H + 1.5) end = Math.max(end, b);
  }
  const gap = Math.max(0, H - end);
  stepsEl.style.clipPath = gap > 1 && end > 0 ? `inset(0 0 ${gap}px 0)` : '';
}
let trimTimer = 0;
function fadeSteps() {
  syncMore();
  clearTimeout(trimTimer);
  trimTimer = setTimeout(trimSteps, 90);
  const sc = listScrolls() && stepsEl.clientHeight > 120; // a window of a single row is not faded away
  stepsEl.classList.toggle('can-up', sc && stepsEl.scrollTop > 3);
  stepsEl.classList.toggle('can-down', sc && stepsEl.scrollHeight - stepsEl.clientHeight - stepsEl.scrollTop > 3);
}
let snapTimer = 0,
  liRO = null; // watches the rows: a row that wraps differently (a font arriving, a new width) re-fits the list
stepsEl.addEventListener(
  'scroll',
  () => {
    fadeSteps();
    clearTimeout(snapTimer);
    if (performance.now() - lastUserScroll > 1500) return; // the list moved by itself: it already stops on a step
    snapTimer = setTimeout(() => {
      // settle on a step boundary at the top so no step is cut mid-line at rest
      if (!listScrolls() || stepsEl.scrollTop < 3) return;
      const end = stepsEl.scrollHeight - stepsEl.clientHeight - stepsEl.scrollTop < 3;
      if (end) return;
      const y = stepsEl.scrollTop;
      let best = 0;
      for (const li of stepsEl.children) if (Math.abs(li.offsetTop - y) < Math.abs(best - y)) best = li.offsetTop;
      if (Math.abs(best - y) > 1) stepsEl.scrollTo({ top: Math.max(0, best), behavior: REDUCED ? 'auto' : 'smooth' });
    }, 140);
  },
  { passive: true },
);
addEventListener('resize', fitSteps);
WIDE.addEventListener('change', () => (setLede(0), fitSteps()));
document.fonts?.ready.then(() => fitSteps());
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
COMPACT.addEventListener('change', () => fitSteps());
STACKED.addEventListener('change', () => fitSteps());
addEventListener('resize', () => toggleSrc(false));

// ---------------------------------------------------------------- scrubber, time and views
// A tick on the scrubber at the start of each step (re-drawn when an episode preset narrows the scrubber to its episode).
function drawTicks() {
  ticksFor = epi;
  const a0 = epi ? epi.a0 + 0.001 : 0,
    a1 = epi ? epi.a1 - (epi.last ? 0 : 0.001) : 1;
  // Ticks closer than a spacing that allows about eight along the bar merge into one (the first step of a cluster marks it), so a scene with many steps
  // does not draw a crowd (every step is still reachable from the list and the keys).
  const wpx = scrub.clientWidth || 300,
    gap = Math.max(48, wpx / 8);
  let lastX = -99;
  ticksEl.innerHTML = steps
    .filter((s) => s.t > a0 + 0.004 && s.t < a1 - 0.004)
    .filter((s) => {
      const px = ((s.t - a0) / (a1 - a0)) * wpx;
      if (px - lastX < gap) return false;
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
  [...camsEl.querySelectorAll('button[data-i]'), ...(moreMenu?.querySelectorAll('[data-i]') || [])].forEach((b) => {
    const i = +b.dataset.i,
      inMenu = b.getAttribute('role') === 'menuitemradio';
    if (inMenu) b.setAttribute('aria-checked', String(i === on));
    else b.setAttribute('aria-pressed', String(i === on));
    b.title = `${b.dataset.name ? b.dataset.name + ' ' : ''}(key ${i + 1})`;
    if (i === on && !inMenu && camsEl.scrollWidth > camsEl.clientWidth) b.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  });
  if (moreBtn2) moreBtn2.classList.toggle('on', !!moreMenu?.querySelector(`[data-i="${on}"]`));
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
    staticTxt.textContent = REDUCED
      ? 'Your device is set to limit animation, so this is a still diagram.'
      : 'The animation could not start, so a still diagram is shown. Try again, or read the account and steps below.';
    $('scRetry').hidden = REDUCED; // with animation switched off, trying again changes nothing
    setPlayBtn(false);
  } else setPlayBtn(true);
  stepsNote.textContent = on ? 'The diagram shows the highlighted step. Steps are for reading only, because the animation is not running.' : 'Select a step to jump to it.';
  if (on && curSim) {
    stepIdx = stepAt(curSim.cfg.staticT ?? curSim.still ?? 0);
    markStep(stepIdx); // the step the still shows
    requestAnimationFrame(fitSteps);
  }
  exportBtn.querySelector('span').textContent = on ? 'Save this diagram' : 'Save image';
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
    host.interrupt();
    setPlayBtn(false);
    host.update(epi ? epi.a0 + 0.001 + (scrub.value / 1000) * (epi.a1 - (epi.last ? 0 : 0.001) - epi.a0 - 0.001) : scrub.value / 1000);
  }
};
// Play/pause: an icon button whose accessible name is the action it will do.
function setPlayBtn(on) {
  if (!on && tour) { clearTimeout(tour.timer); tour.timer = 0; }
  playBtn.classList.toggle('playing', !!on);
  const action = on ? 'Pause' : (host?._ended || host?.t >= 1) ? 'Replay' : 'Play';
  playBtn.setAttribute('aria-label', action);
  playBtn.title = `${action} (Space)`;
  playBtn.querySelector('use').setAttribute('href', on ? '#i-pause' : (host?._ended || host?.t >= 1) ? '#i-replay' : '#i-play');
  playBtn.disabled = false;
}
function togglePlay() {
  if (!host || !cur || !glOK || stillOnly) return;
  if (tour) { clearTimeout(tour.timer); tour.timer = 0; }
  const on = !host.playing;
  if (on && (host._ended || host.t >= 1)) host.update(epi ? epi.a0 + 0.001 : 0);
  host.playing = on;
  hideHint();
  setPlayBtn(host.playing);
  setStatus(host.playing ? 'Playing.' : 'Paused.');
}
playBtn.onclick = togglePlay;
const narrowViews = matchMedia('(max-width: 1180px)'),
  phoneViews = matchMedia('(max-width: 760px)');
narrowViews.addEventListener?.('change', () => host && cur && buildViews(cur, host.sim));
phoneViews.addEventListener?.('change', () => { if (cur) syncSceneTitle(cur); if (host && cur) buildViews(cur, host.sim); });
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
// Desktop shows at most two view pills (the scene's own first view comes first); any others sit in a "More views" menu button (ARIA menu button pattern:
// Enter, Space or the arrow keys open it, the arrows, Home and End move, Enter chooses, Escape and Tab close it). The keys 1 to 5 still reach every view.
const MAX_PILLS = 2;
let moreBtn2 = null,
  moreMenu = null;
// The menu opens upward over the end of the story column and does not move anything.
const reserveMenu = () => {}; // the menu floats over the end of the column; the column keeps its size, so the steps never jump while the scene plays
function closeMore(focus) {
  if (!moreMenu || moreMenu.hidden) return;
  moreMenu.hidden = true;
  reserveMenu(false);
  moreBtn2.setAttribute('aria-expanded', 'false');
  if (focus) moreBtn2.focus();
}
function openMore(first) {
  host?.interrupt();
  moreMenu.hidden = false;
  reserveMenu(true);
  moreBtn2.setAttribute('aria-expanded', 'true');
  moreMenu.style.left = Math.max(0, Math.min(moreBtn2.getBoundingClientRect().left - viewsEl.getBoundingClientRect().left, viewsEl.clientWidth - moreMenu.offsetWidth)) + 'px';
  const items = [...moreMenu.children];
  (first === 'last' ? items.at(-1) : items.find((b) => b.getAttribute('aria-checked') === 'true' && first !== 'first') || items[0]).focus();
}
function buildViews(cfg, sim) {
  camsEl.textContent = '';
  moreMenu?.remove();
  panel.style.setProperty('--menu-reserve', '0px');
  moreBtn2 = moreMenu = null;
  camOn = -2;
  const pills = Math.min(sim.cams.length, MAX_PILLS);
  $('sceneCtrl')?.toggleAttribute('data-many-views', sim.cams.length >= 4); // four or more views: they take their own row on a wide window so the time bar keeps its length
  const names = sim.cams.map((c, i) => viewName(cfg.cameras?.[i], c.name));
  sim.cams.forEach((c, i) => {
    if (i >= pills) return;
    const label = names[i],
      b = document.createElement('button');
    b.type = 'button';
    const short = phoneViews.matches ? phoneLabel(label) : narrowViews.matches ? label.replace(/^From (the |a )?/i, '').replace(/^Follow the action$/i, 'Follow').replace(/^./, (m) => m.toUpperCase()) : label;
    b.textContent = short;
    if (short !== label) b.setAttribute('aria-label', label);
    b.title = label;
    b.dataset.i = i;
    b.dataset.name = label === c.name ? '' : c.name;
    b.setAttribute('aria-keyshortcuts', String(i + 1));
    b.onclick = () => chooseView(i);
    camsEl.appendChild(b);
  });
  if (pills < sim.cams.length) {
    moreBtn2 = document.createElement('button');
    moreBtn2.type = 'button';
    moreBtn2.className = 'more-views';
    moreBtn2.id = 'scMoreViews';
    moreBtn2.setAttribute('aria-haspopup', 'menu');
    moreBtn2.setAttribute('aria-expanded', 'false');
    moreBtn2.setAttribute('aria-controls', 'scMoreMenu');
    moreBtn2.innerHTML = '<span>More views</span><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-down"/></svg>';
    camsEl.appendChild(moreBtn2);
    moreMenu = document.createElement('div');
    moreMenu.id = 'scMoreMenu';
    moreMenu.className = 'more-menu';
    moreMenu.setAttribute('role', 'menu');
    moreMenu.setAttribute('aria-labelledby', 'scMoreViews');
    moreMenu.hidden = true;
    for (let i = pills; i < sim.cams.length; i++) {
      const it = document.createElement('button');
      it.type = 'button';
      it.setAttribute('role', 'menuitemradio');
      it.setAttribute('aria-checked', 'false');
      it.tabIndex = -1;
      it.dataset.i = i;
      it.dataset.name = names[i] === sim.cams[i].name ? '' : sim.cams[i].name;
      it.setAttribute('aria-keyshortcuts', String(i + 1));
      it.innerHTML = `<span>${esc(names[i])}</span><kbd aria-hidden="true">${i + 1}</kbd>`;
      it.onclick = () => {
        chooseView(i);
        closeMore(true);
      };
      moreMenu.appendChild(it);
    }
    viewsEl.appendChild(moreMenu);
    moreBtn2.onclick = () => (moreMenu.hidden ? openMore() : closeMore(true));
    moreBtn2.onkeydown = (e) => {
      if (e.key === 'ArrowDown') (e.preventDefault(), openMore('first'));
      else if (e.key === 'ArrowUp') (e.preventDefault(), openMore('last'));
    };
    moreMenu.onkeydown = (e) => {
      const items = [...moreMenu.children],
        k = items.indexOf(document.activeElement);
      const go = (n) => (e.preventDefault(), items[(n + items.length) % items.length].focus());
      if (e.key === 'ArrowDown') go(k + 1);
      else if (e.key === 'ArrowUp') go(k - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(items.length - 1);
      else if (e.key === 'Escape') (e.preventDefault(), e.stopPropagation(), closeMore(true));
      else if (e.key === 'Tab') closeMore(false);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') (e.preventDefault(), e.stopPropagation()); // they change scene elsewhere, not inside a menu
    };
  }
  requestAnimationFrame(camFade);
  setTimeout(camFade, 400); // after the panel's opening transition
  setTimeout(camFade, 1200);
}
document.addEventListener('pointerdown', (e) => {
  if (moreMenu && !moreMenu.hidden && !e.target.closest('#scMoreMenu, #scMoreViews')) closeMore(false);
});
function chooseView(i) {
  if (!host || !cur || !glOK || stillOnly || !host.sim.cams[i]) return;
  host.interrupt();
  host.pickCam(i);
  syncCams();
  setStatus(`View: ${host.sim.cams[i].name}.`);
}
// Phone: the views scroll sideways; a fade on the right edge says more lie beyond it.
function camFade() {
  camsEl.classList.toggle('at-end', camsEl.scrollWidth - camsEl.clientWidth - camsEl.scrollLeft <= 1);
  camsEl.classList.toggle('at-start', camsEl.scrollLeft <= 1);
}
camsEl.addEventListener('scroll', camFade, { passive: true });
if (window.ResizeObserver) new ResizeObserver(() => camFade()).observe(camsEl); // the row's width settles after the panel has opened: the edge fade follows it
addEventListener('resize', camFade);

// ---------------------------------------------------------------- previous, next, close, related law
$('scClose').onclick = closeScene;
// The previous and next arrows (and the arrow keys) move one scene along. During the tour they move the tour: it carries on from the new scene, with its
// chip and its own advance, and only "Stop the tour" or choosing a scene from the dots ends it. Past the last scene the tour finishes with its closing slide.
const go = (d) => {
  const i = ORDER.indexOf(cur);
  if (i < 0) return;
  if (tour) {
    clearTimeout(tour.timer);
    tour.timer = 0;
    showNextUp(false);
    if (i + d >= ORDER.length) return tourNext();
    tour.i = (i + d + ORDER.length) % ORDER.length;
    return openScene(ORDER[tour.i].id, null, true);
  }
  openScene(ORDER[(i + d + ORDER.length) % ORDER.length].id);
};
$('scPrev').onclick = () => go(-1);
$('scNext').onclick = () => go(1);
// The related law opens as a card in the scene: its date, whether it binds, its source, and a quiet way to see it on the timeline. Nothing scrolls away.
const lawCard = $('lawCard');
const BINDS = { treaty: 'A treaty: it binds the states that joined it.', resolution: 'Not binding: a call or a finding, not a rule that carries enforcement.', unilateral: 'A pledge by one country, not a treaty.' };
const pairedLaw = (cfg) => !!(cfg.event && cfg.related && pairsAt(cfg.event).some((p) => p.law === cfg.related));
function fillLawCard(cfg) {
  const l = byId[cfg.related];
  toggleLawCard(false);
  if (!l) return void (lawCard.innerHTML = '');
  const when = l.end ? `${fmtD({ date: l.start })} to ${fmtD({ date: l.end })}` : fmtD({ date: l.start });
  const binds = l.soft_law ? 'Soft law: an expert manual, not binding.' : BINDS[l.kind] || legalKindWords(l) + '.';
  const link = cfg.event && pairsAt(cfg.event).find((p) => p.law === l.id),
    src = l.source_url
      ? `<a class="btn small quiet" href="${esc(l.source_url)}" target="_blank" rel="noopener">Open the source<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr"> (opens in a new tab)</span></a>`
      : '';
  lawCard.innerHTML =
    `<p class="lc-title">${esc(l.title || l.label)}</p>` +
    `<p class="lc-when">${esc(legalKindWords(l))} · ${esc(when)}${link ? `<span class="gap-pill" title="The first law our records link to this event">${esc(linkText(link.g))}</span>` : ''}</p>` +
    (l.soft_law ? '' : `<p class="lc-bind">${esc(binds)}</p>`) +
    (link ? '' : `<p class="lc-bind">General background: our records do not pair this event with a later law.</p>`) +
    `<p class="lc-src"><span class="lc-cite"><b>Source:</b> ${esc((l.citation || '').replace(/\s*https?:\/\/\S+/g, ''))}</span></p>` +
    `<div class="lc-acts"><button type="button" class="btn small" id="lcTimeline"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-clock"/></svg>See it on the timeline</button>` +
    `${src}<button type="button" class="btn small quiet" id="lcClose">Close</button></div>`;
  lawCard.querySelector('#lcClose').onclick = () => (toggleLawCard(false), lawBtn.focus());
  lawCard.querySelector('#lcTimeline').onclick = (e) => seeLawOnTimeline(e.detail === 0);
}
function toggleLawCard(open) {
  lawCard.hidden = !open;
  lawBtn.setAttribute('aria-expanded', String(!!open));
  if (open) (togglePair(null), toggleSrc(false), toggleNextPop(false), anchorNote(lawCard));
}
lawBtn.onclick = () => {
  if (!cur?.related) return;
  toggleLawCard(lawCard.hidden);
  if (!lawCard.hidden) lawCard.querySelector('#lcTimeline')?.focus({ preventScroll: true });
};
// Only when asked: close the window and bring the law to the reader on the sticky timeline. The page scrolls so the strip and the chapter heading are both in
// view, and the law's own card (which opens by keyboard focus) appears only for a keyboard user, so it never covers the strip for someone with a mouse.
function seeLawOnTimeline(byKeyboard) {
  const id = cur?.related;
  if (!id) return;
  closeScene(true);
  showLawOnTimeline(id, byKeyboard);
}
// The same arrival for the hero's "See it on the timeline" button: the page scrolls to the chapter heading with the strip under it, the law's symbol is ringed
// and flashes, and the card opens only for a keyboard user.
export function showLawOnTimeline(id, byKeyboard) {
  const m = document.querySelector(`#legalSvg [data-id="${id}"]`);
  if (!m) return;
  $('lawHead')?.scrollIntoView({ block: 'start', behavior: 'auto' });
  hooks.legalScroll?.(); // the strip and the zoom panel settle for the new place at once, not on the next scroll event
  m.classList.add('hl', 'flash-hl');
  m.focus({ preventScroll: true });
  if (!byKeyboard) hideCard();
  setGuide(parse(byId[id].start));
  setTimeout(() => {
    m.classList.remove('hl', 'flash-hl');
  }, 3500);
}

// ---------------------------------------------------------------- story edges: a soft fade at the top and bottom says there is more to scroll
function updateFades() {
  const max = asideBody.scrollHeight - asideBody.clientHeight;
  asideWrap.classList.toggle('can-up', asideBody.scrollTop > 4);
  asideWrap.classList.toggle('can-down', max - asideBody.scrollTop > 56); // the last 48 px are only padding: no fade over them
}
asideBody.addEventListener('scroll', updateFades, { passive: true });
addEventListener('resize', updateFades);
asideBody.addEventListener('toggle', updateFades, true);
if ('ResizeObserver' in window) {
  new ResizeObserver(updateFades).observe(asideBody);
  let raf = 0;
  liRO = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => fitSteps());
  });
  [asideBody, captionEl, stepsNote, moreBtn, footEl, $('svPair')].forEach((n) => n && liRO.observe(n)); // anything that changes the room the list has
}

// ---------------------------------------------------------------- keyboard hint, shown once per visit; it sits in the control bar zone, never over the picture
function showHint() {
  if (hintShown || stillOnly || !KEYBOARD.matches || COMPACT.matches || SHORT.matches) return;
  hintShown = true;
  hintEl.classList.add('on');
  // The hint sits in the scrubber's cell: where its three notes do not fit that cell, the last ones are left out (never printed over the time or the views).
  const spans = [...hintEl.children];
  spans.forEach((n) => (n.hidden = false));
  for (let k = spans.length - 1; k > 0 && hintEl.scrollWidth > hintEl.clientWidth + 1; k--) spans[k].hidden = true;
  hintTimer = setTimeout(hideHint, 3000);
}
function hideHint() {
  clearTimeout(hintTimer);
  hintEl.classList.remove('on');
}
overlay.addEventListener('pointerdown', hideHint, { passive: true });
let hintX = null,
  hintY = 0;
overlay.addEventListener(
  'pointermove',
  (e) => {
    if (!hintEl.classList.contains('on')) return (hintX = null);
    if (hintX === null) {
      hintX = e.clientX;
      hintY = e.clientY;
    } else if (Math.hypot(e.clientX - hintX, e.clientY - hintY) > 6) hideHint(); // the first real pointer movement dismisses it
  },
  { passive: true },
);
overlay.addEventListener('keydown', hideHint, { passive: true });

// ---------------------------------------------------------------- keyboard: Space plays or pauses, Left and Right change scene, 1 to 5 choose a view, Esc closes
const TABBABLE = 'button:not([disabled]),input:not([disabled]),a[href],summary,[tabindex]';
function trapTab(e) {
  const list = [...(recapEl && !recapEl.hidden ? recapEl : panel).querySelectorAll(TABBABLE)].filter( // the closing slide covers the controls: Tab stays on the slide
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
  host.interrupt();
  setPlayBtn(false);
  host.update(Math.max(a0, Math.min(a1, host.t + ((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 5 : 1)) / dur)));
}
document.addEventListener('keydown', (e) => {
  if (!cur || e.defaultPrevented) return;
  hideHint();
  if (e.key === 'Escape') {
    e.preventDefault();
    if (!sheet.hidden) return toggleSheet(false);
    if (!slPop.hidden) {
      toggleSrc(false);
      slBtn.focus();
      return;
    }
    if (!slNextPop.hidden) {
      toggleNextPop(false);
      $('slNext')?.focus();
      return;
    }
    if (!lawCard.hidden) return (toggleLawCard(false), lawBtn.focus());
    if (!pairBodies.about.hidden || !pairBodies.next.hidden) {
      const was = pairBodies.about.hidden ? pairBtns.next : pairBtns.about;
      togglePair(null);
      was.focus();
      return;
    }
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
if (tourBtn) tourBtn.onclick = (e) => startTour(e.currentTarget);

// ---------------------------------------------------------------- the tour, and the scenes seen so far
// The tour plays every scene in date order, each to its end, then moves on; "Stop the tour" is always in the header. After the last scene a short
// summary says what the reader saw and links back to the charts. Which scenes have been opened is kept in memory only (nothing is stored).
const seen = seenScenes,
  tourEl = $('svTour'),
  seenEl = $('svSeen'),
  recapEl = $('svRecap');
let tour = null; // { i, timer } while the tour runs
function markSeen(cfg) {
  seen.add(cfg.id);
  document.dispatchEvent(new CustomEvent('cs:seen', { detail: cfg.id }));
  seenEl.textContent = `${seen.size} of ${ORDER.length} scenes viewed`;
  tourEl.hidden = !tour;
  if (tour) $('svTourTxt').textContent = `Tour: scene ${tour.i + 1} of ${ORDER.length}`;
}
export function startTour(originEl) {
  tour = { i: 0, timer: 0 };
  openScene(ORDER[0].id, originEl, true);
}
// While the tour plays, the last fifth of each scene shows a small "Next up" card with the next scene's picture and name; pressing it moves on at once.
const nextUp = $('svNextUp');
function showNextUp(on) {
  const n = tour && ORDER[tour.i + 1];
  if (!on || !n) return void (nextUp.hidden = true);
  if (nextUp.dataset.id !== n.id) {
    nextUp.dataset.id = n.id;
    const pic = nextUp.querySelector('.nu-pic'),
      src = posterURL(n.id);
    pic.textContent = '';
    if (src) pic.appendChild(Object.assign(new Image(64, 36), { src, alt: '' }));
    pic.hidden = !src;
    $('svNextUpName').textContent = `${SHORT_NAME[n.id] || n.title}, ${n.date.slice(0, 4)}`;
  }
  nextUp.hidden = false;
}
nextUp.onclick = () => tour && (showNextUp(false), tourNext());
function tourTick(t) {
  if (tour) showNextUp(t > 0.8);
  if (!tour || t < 1 || tour.timer) return;
  host.playing = false; // hold the last frame for a moment; the run would otherwise start over
  setPlayBtn(false);
  tour.timer = setTimeout(tourNext, 1600);
}
function tourNext() {
  if (!tour || !cur) return;
  clearTimeout(tour.timer);
  tour.timer = 0;
  showNextUp(false);
  if (tour.i + 1 < ORDER.length) {
    tour.i++;
    openScene(ORDER[tour.i].id, null, true);
  } else {
    endTour(true);
  }
}
function endTour(finished) {
  if (!tour) return;
  clearTimeout(tour.timer);
  tour = null;
  showNextUp(false);
  tourEl.hidden = true;
  if (host) host.onTick = null;
  if (finished) showRecap();
  else setStatus('The tour has stopped.');
}
$('svTourStop').onclick = () => {
  endTour(false);
  if (host && cur && !stillOnly && glOK) {
    host.interrupt();
    setPlayBtn(false);
  }
  playBtn.focus();
};
// What the 13 scenes are, counted from the same kinds the "Where to go next" row uses.
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
export function showRecap() {
  const n = (k) => ORDER.filter((s) => KINDS[s.id] === k).length,
    w = (k) => NUM[n(k)] || String(n(k));
  const year = (s) => s.date.slice(0, 4);
  $('svRecapSum').textContent =
    `You watched all ${ORDER.length} events, oldest first: ${w('test')} tests that destroyed a satellite, ${w('high')} high-altitude events (a nuclear explosion and a rocket launch), ` +
    `${w('attack')} attacks that leave satellites in orbit and ${w('near')} cases of satellites flying close to others.`;
  $('svRecapPairs').innerHTML = recapLinks() + drawnPara(revealCapacity());
  $('svRecapLine').textContent = recapLine();
  $('svRecapList').innerHTML = ORDER.map((s) => `<li><button type="button" data-id="${esc(s.id)}">${esc(SHORT_NAME[s.id] || s.title)}, ${year(s)}</button></li>`).join('');
  // the hand-off back to the picture: how many pairs are drawn on it now
  const linked = revealedCount();
  $('svRecapHero').hidden = !linked;
  $('svRecapHeroTxt').textContent = `Back to the picture: ${NUM[linked] || linked} of the ${pairWord()} pairs ${linked === 1 ? 'is' : 'are'} drawn there`;
  recapEl.hidden = false;
  recapMore();
  document.dispatchEvent(new CustomEvent('cs:recap'));
  setStatus('The tour is over. Here is what you saw.');
  $('svRecapH').focus();
}
// While more of the slide's body lies below (the "Revisit" block opened on a short window): a soft fade at its foot and a small button that says how many
// of the scene and chart links are still out of sight and takes the reader down to them.
const recapBody = recapEl.querySelector('.sv-recap-body'),
  recapCue = $('svRecapCue'),
  recapMore = () => {
    const edge = recapBody.getBoundingClientRect().bottom - 2,
      below = recapBody.lastElementChild.getBoundingClientRect().bottom > edge + 2, // content of the body (not its padding) still out of sight
      hidden = below ? [...recapBody.querySelectorAll('.sv-recap-more[open] button[data-id], .sv-recap-more[open] .sv-recap-links a')].filter((n) => n.getBoundingClientRect().bottom > edge).length : 0;
    recapBody.classList.toggle('more', below);
    recapCue.hidden = !below;
    if (below) $('svRecapCueTxt').textContent = hidden ? `${hidden} more below` : 'More below';
  };
recapBody.addEventListener('scroll', recapMore, { passive: true });
const recapDetails = recapEl.querySelector('.sv-recap-more');
// opening the block brings it to the top of the slide, so the scenes and the chart links are in view at once
recapDetails.addEventListener('toggle', () => {
  if (recapDetails.open) {
    const top = recapDetails.getBoundingClientRect().top - recapBody.getBoundingClientRect().top + recapBody.scrollTop - 8;
    recapBody.scrollTo({ top: Math.max(0, top), behavior: REDUCED ? 'auto' : 'smooth' });
  }
  requestAnimationFrame(recapMore);
});
recapCue.addEventListener('click', () => recapBody.scrollBy({ top: Math.round(recapBody.clientHeight * 0.7), behavior: REDUCED ? 'auto' : 'smooth' }));
addEventListener('resize', recapMore);
recapEl.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (b) return openScene(b.dataset.id);
  if (e.target.closest('#svRecapAgain')) return startTour();
  if (e.target.closest('#svRecapClose')) return closeScene();
  if (e.target.closest('#svRecapQuiz')) return closeScene(true); // the link then scrolls to the quiz
  if (e.target.closest('#svRecapTop')) {
    e.preventDefault();
    closeScene(true);
    return showInHero(); // up to the picture, and its newest link pulses once
  }
  if (e.target.closest('a[href^="#"]')) closeScene(true); // the link then scrolls to the chart
});

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
hooks.showLaw = showLawOnTimeline;
hooks.prefetchEarth = prefetchEarth;

// Returning to a background tab never advances an event or resumes movement without consent.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) host?.interrupt();
});
