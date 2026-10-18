// ============================================================================
// discover.js: the scene gallery and "Surprise me". Pictures load at once (they are embedded in the page), so the strip is never blank.
// Needs: scene-ui.js (openScene, ORDER), posters.js, discover-data.js. Provides: mountDiscover().
// ============================================================================
import { REDUCED, esc, escNb } from './app.js';
import { drawnPara, pairWord, recapLine, recapLinks } from './recap.js';
import { ORDER, openScene } from './scene-ui.js';
import { posterURL } from './scenes/posters.js';
import { FACTS, pickSurprise } from './discover-data.js';
import { seenScenes } from './shared.js';
import { earn, freshCount, freshLine, heroInView, offerLink, pulseInPlace, showInHero, toHero } from './rewards.js';
import { playPairs, revealCapacity, revealedCount } from './hero-timeline.js';

const yearOf = (s) => s.date.slice(0, 4);
// Titles end with the year in brackets; the card shows the year on its own line.
const nameOf = (s) => s.title.replace(/\s*\((\d{4}[^)]*)\)\s*$/, '');

// The strip runs in date order, oldest first (the order of ORDER, the same as the scene window's own 1 / 13 count and its Previous / Next buttons), so the cards read as a
// timeline; the year on each card keeps the dates readable. "Surprise me" closes the strip.
const STRIP = ORDER;

function drawGallery() {
  const grid = document.getElementById('posterGrid');
  if (!grid) return;
  const surprise = `<li class="pcard pc-surprise">
  <button type="button" class="ps-btn" id="surpriseBtn2" >
    <span class="ps-pic" aria-hidden="true"><svg viewBox="0 0 160 90" focusable="false"><path class="ps-orbit" d="M14 70C44 18 112 8 148 30"/><circle class="ps-dot" cx="148" cy="30" r="4"/><circle class="ps-dot" cx="14" cy="70" r="3"/><circle class="ps-dot" cx="80" cy="25" r="2.4"/></svg><span class="ps-ico"><svg class="ico"><use href="#i-shuffle"/></svg></span></span>
    <span class="pc-year">One at random</span>
    <span class="pc-name">Surprise me</span>
  </button>
</li>`;
  grid.innerHTML = STRIP.map((s, i) => {
    const img = posterURL(s.id);
    const fact = esc(FACTS[s.id] || '');
    return `<li class="pcard" style="--i:${i}">
  <button type="button" class="pc-btn" data-id="${esc(s.id)}" aria-labelledby="pn-${esc(s.id)}" aria-describedby="pf-${esc(s.id)}">
    <span class="pc-pic">${img ? `<img src="${img}" alt="" width="640" height="360" loading="eager" decoding="${i < 6 ? 'sync' : 'async'}">` : ''}<span class="pc-play" aria-hidden="true"><svg class="ico"><use href="#i-play"/></svg></span><span class="pc-seen" hidden><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>Seen</span><span class="pc-fact" id="pf-${esc(s.id)}">${fact}</span></span>
    <span class="pc-year">${esc(yearOf(s))}</span>
    <span class="pc-name" id="pn-${esc(s.id)}">${escNb(nameOf(s))}</span>
    <span class="pc-fact-s" aria-hidden="true">${fact}</span>
  </button>
</li>`;
  }).join('') + surprise;
  const chooser = document.getElementById('sceneChoose');
  chooser.innerHTML += STRIP.map(s => `<option value="${esc(s.id)}">${esc(yearOf(s))} · ${esc(nameOf(s))}</option>`).join('');
  chooser.addEventListener('change', () => { if (chooser.value) { openScene(chooser.value, chooser); chooser.value = ''; } });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.pc-btn');
    if (b) openScene(b.dataset.id, b);
  });
  stripControls(grid);
  rovingTiles(grid);
  fitFacts(grid);
  // Scenes already watched wear a small "Seen" tag (in memory only); the count and the new links are told once, under the hero's actions (heroSeen)
  const sync = () => {
    grid.querySelectorAll('.pc-btn').forEach((b) => {
      const on = seenScenes.has(b.dataset.id);
      b.querySelector('.pc-seen').hidden = !on;
      b.classList.toggle('seen', on);
    });
    milestone();
    heroSeen();
  };
  document.addEventListener('cs:seen', sync);
  document.addEventListener('cs:reward', sync);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ss-go')) return;
    showInHero();
    sync();
  });
  sync();
}

// Rewards, in memory only (see rewards.js): a scene watched whose weapon has a pair draws that pair on the hero's resting picture; the third and the seventh scene seen
// each draw one more. Closing a scene never moves the page: the link is already drawn, so when most of the hero is on screen it pulses where it is, and otherwise a small
// note near the strip says "1 new link on the hero picture" and its "Show me" button (the reader's own click) scrolls up and pulses it.
const MILES = [3, 7];
let given = 0,
  toShow = null, // the reward to show when the scene on screen is closed
  inScene = false;
function milestone() {
  const n = seenScenes.size;
  if (given < MILES.length && n >= MILES[given]) earn('seen' + MILES[given++]);
}
// The one-line rule near each counter: how more links get drawn, or that the picture has shown every link it can.
const RULE = () => (revealedCount() >= revealCapacity() && revealCapacity() ? 'Every link this picture can draw is on it.' : 'Watch scenes or answer the quiz to draw more links.');
document.addEventListener('cs:opening', () => (inScene = true));
document.addEventListener('cs:reward', (e) => inScene && e.detail && (toShow = e.detail.key));
document.addEventListener('cs:closed', (e) => {
  inScene = false;
  const k = toShow;
  toShow = null;
  // A close that is the first half of a jump elsewhere (a chart, the timeline, the quiz) leaves the page where the jump puts it: the link is already drawn, and the
  // hero's own note names it for when the reader comes back (the draw-in of all the pairs waits for the next ordinary close).
  if (e.detail?.nav) return;
  if (pending) {
    // 13 of 13: the pairs draw themselves in on the hero. In place when the hero is on screen; otherwise the reader is offered the draw-in, and the page stays put.
    shown = true;
    pending = false;
    if (heroInView()) return setTimeout(() => playPairs(), 250);
    return offerLink(`All ${STRIP.length} scenes seen. The pairs draw themselves on the hero picture.`, () => drawIn());
  }
  if (!k) return;
  if (heroInView()) return setTimeout(() => pulseInPlace(k), 250);
  const n = freshCount() || 1;
  offerLink(`${n === 1 ? '1 new link' : `${n} new links`} on the hero picture.`, () => showInHero(k));
});

// The arrows move the strip by about one screenful of cards and switch off at either end; the cards themselves stay the way in for keyboards.
// The strip is one tab stop: Tab lands on the tile last used (the first, at the start), the arrow keys move along the tiles and Enter opens one.
function rovingTiles(grid) {
  const tiles = [...grid.querySelectorAll('button.ps-btn, button.pc-btn')];
  if (!tiles.length) return;
  grid.setAttribute('aria-label', `${STRIP.length} scenes. Tab once to enter; the arrow keys move between them and Enter opens one.`);
  const set = (t) => tiles.forEach((b) => b.setAttribute('tabindex', b === t ? '0' : '-1'));
  set(tiles[0]);
  grid.addEventListener('focusin', (e) => tiles.includes(e.target) && set(e.target));
  grid.addEventListener('keydown', (e) => {
    const i = tiles.indexOf(e.target);
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tiles.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    tiles[Math.min(tiles.length - 1, Math.max(0, to))].focus();
  });
}
// The hover caption over a poster is a strip over its lower part (at most CAPTION_SHARE of the picture): its text is set so that every line is whole. If the fact is too long at 14 px it steps down to 13 px and 12 px,
// and a fact that still does not fit stops at a whole line with an ellipsis (never cut through a line). The measure is redone when the cards change size.
const CAPTION_SHARE = 0.6; // the hover caption covers at most the lower 60% of a poster, so the picture stays in view
function fitFacts(grid) {
  const fit = () => {
    for (const f of grid.querySelectorAll('.pc-fact')) {
      const pic = f.parentElement,
        room = Math.round(pic.clientHeight * CAPTION_SHARE);
      if (!room) continue;
      f.classList.remove('clamp');
      f.style.maxHeight = 'none';
      let done = false;
      for (const px of ['', '13px', '12px']) {
        f.style.fontSize = px;
        if (f.offsetHeight <= room - 1) {
          done = true;
          break;
        }
      }
      f.style.maxHeight = '';
      if (done) continue;
      const cs = getComputedStyle(f),
        lines = Math.max(1, Math.floor((room - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight)));
      f.style.setProperty('--fl', String(lines));
      f.classList.add('clamp');
    }
  };
  fit();
  document.fonts?.ready.then(fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(grid);
}
function stripControls(grid) {
  const prev = document.getElementById('stripPrev'),
    next = document.getElementById('stripNext');
  if (!prev || !next) return;
  if (!grid.querySelector(':scope > .pad')) {
    const pad = document.createElement('li');
    pad.className = 'pad';
    pad.setAttribute('aria-hidden', 'true');
    grid.append(pad);
    grid.style.setProperty('--cards', String(grid.children.length - 1));
    grid.classList.add('has-pad');
  }
  // The same two arrows again at the picture's edges (aria-hidden and out of the tab order: the pair above is the one for assistive technology and keyboards), and a count
  // of the cards in view ("1 to 4 of 13"), so the strip says both that it goes on and how far.
  const ePrev = document.getElementById('pstripPrev'),
    eNext = document.getElementById('pstripNext'),
    count = document.getElementById('stripCount');
  const sync = () => {
    prev.disabled = grid.scrollLeft < 4;
    next.disabled = grid.scrollLeft + grid.clientWidth > grid.scrollWidth - 4;
    if (ePrev) ePrev.disabled = prev.disabled;
    if (eNext) eNext.disabled = next.disabled;
    const pic = grid.querySelector('.pc-pic');
    if (pic && grid.parentElement) grid.parentElement.style.setProperty('--edge-top', Math.round(pic.offsetTop + pic.offsetHeight * 0.2) + 'px');
    // a card cut by either edge shows its picture only: its title never ends in half a word
    for (const c of grid.querySelectorAll('.pcard')) {
      const r = c.getBoundingClientRect(),
        b = grid.getBoundingClientRect();
      c.classList.toggle('cut', r.left < b.left - 4 || r.right > b.right + 4);
    }
    if (count) {
      const cards = [...grid.querySelectorAll('.pcard:has(.pc-btn)')],
        box = grid.getBoundingClientRect(),
        seen = cards.map((c, i) => [c.getBoundingClientRect(), i]).filter(([r]) => r.left >= box.left - 4 && r.right <= box.right + 4).map(([, i]) => i + 1);
      count.textContent = seen.length ? (seen.length === 1 ? `${seen[0]} of ${cards.length}` : `${seen[0]} to ${seen[seen.length - 1]} of ${cards.length}`) : '';
    }
    // a soft fade on the end that is cut off, so a half-visible card reads as "more this way", never as a mistake
    grid.classList.toggle('more-l', !prev.disabled);
    grid.classList.toggle('more-r', !next.disabled);
  };
  // A page is a whole number of cards: the strip snaps to a card's start (charts: .posters in discover.css), so the card at the left edge is never cut mid-word.
  const go = (dir) => {
    const cards = [...grid.children].filter((c) => !c.classList.contains('pad')),
      box = grid.getBoundingClientRect().left,
      at = cards.map((c) => c.getBoundingClientRect().left - box + grid.scrollLeft - 8), // where the strip rests with this card first (8 px: its scroll-padding)
      pitch = cards.length > 1 ? at[1] - at[0] : grid.clientWidth,
      gap = pitch - cards[0].getBoundingClientRect().width,
      page = Math.max(1, Math.floor((grid.clientWidth - 16 + gap) / pitch)),
      now = at.reduce((n, x, i) => (Math.abs(x - grid.scrollLeft) < Math.abs(at[n] - grid.scrollLeft) ? i : n), 0),
      to = Math.min(cards.length - 1, Math.max(0, now + dir * page));
    grid.scrollTo({ left: Math.max(0, at[to]), behavior: REDUCED ? 'auto' : 'smooth' });
  };
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  if (ePrev) ePrev.onclick = () => go(-1);
  if (eNext) eNext.onclick = () => go(1);
  grid.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
  // A card that takes focus (Tab) is scrolled fully into view by the browser; the arrows then catch up through the scroll event.
}

export function mountDiscover() {
  drawGallery();
  const go = (e) => {
    const s = pickSurprise(ORDER);
    openScene(s.id, e.currentTarget);
  };
  const b = document.getElementById('surpriseBtn2');
  if (b) b.onclick = go;
}

// Under the hero's actions: once a scene has been watched, a quiet "Seen N of 13" with the links it earned and the one-line rule. At 13 of 13, when the last scene is
// closed, the six pairs draw themselves in one at a time on the picture (skippable), then settle to one row: "See the six pairs" opens them as a card over the lower
// picture, never pushing it (unless the tour's own closing slide just showed them). Everything is counted from the scenes opened in this visit and from the linked
// pairs in the data; nothing is stored.
let pending = false,
  shown = false;
function heroSeen() {
  const el = document.getElementById('heroSeen'),
    go = document.getElementById('heroGo'),
    n = seenScenes.size;
  if (!el) return;
  el.hidden = n === 0;
  const all = n >= STRIP.length;
  el.classList.toggle('done', all);
  if (go) go.textContent = all ? 'Whole timeline' : 'Timeline';
  const main = document.createElement('span');
  main.className = 'hs-main';
  if (!all) {
    const line = freshLine();
    main.append(`Seen ${n} of ${STRIP.length} scenes.${line ? ' ' + line + '. ' : ''}`);
    if (line) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ss-go hs-go';
      b.textContent = 'Show me';
      main.append(b);
    }
    const rule = document.createElement('span');
    rule.className = 'hs-rule';
    rule.textContent = RULE();
    el.replaceChildren(main, rule);
    return;
  }
  main.append(`You have seen all ${STRIP.length} scenes. In every pair our records link, the law came later. `);
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'hs-again';
  b.setAttribute('aria-expanded', String(!card()?.hidden));
  b.setAttribute('aria-controls', 'heroDone');
  b.textContent = `See the ${pairWord()} pairs`;
  main.append(b);
  el.replaceChildren(main);
  if (!shown) pending = true;
}
const card = () => document.getElementById('heroDone');
// The pairs, as a card standing over the lower part of the picture, just above the buttons. It is out of the page's flow, so the picture keeps its height.
function openPairs(focus = true) {
  const c = card();
  if (!c) return;
  document.getElementById('hdH').textContent = `The ${pairWord()} pairs our records link`;
  document.getElementById('hdLinks').innerHTML = recapLinks() + drawnPara(revealCapacity());
  document.getElementById('hdLine').textContent = recapLine();
  c.hidden = false;
  document.body.classList.add('pairs-open');
  placePairs();
  c.classList.remove('in');
  void c.offsetWidth;
  c.classList.add('in');
  document.querySelector('.hs-again')?.setAttribute('aria-expanded', 'true');
  if (focus) document.getElementById('hdH').focus({ preventScroll: true });
}
function closePairs(back = false) {
  const c = card();
  if (!c || c.hidden) return;
  c.hidden = true;
  document.body.classList.remove('pairs-open');
  const b = document.querySelector('.hs-again');
  b?.setAttribute('aria-expanded', 'false');
  if (back) b?.focus({ preventScroll: true });
}
// stands just above the row of buttons, whatever height that row has
function placePairs() {
  const c = card(),
    grid = c?.closest('.hero-grid'),
    acts = document.getElementById('start');
  if (!c || c.hidden || !grid || !acts || innerWidth < 640) return c && (c.style.bottom = '');
  c.style.bottom = Math.round(grid.getBoundingClientRect().bottom - acts.getBoundingClientRect().top + 8) + 'px';
}
addEventListener('resize', placePairs);
// At 13 of 13 (when the scene that made it 13 is closed): the pairs draw themselves in, then the row says where they are.
function drawIn() {
  toHero(() => playPairs());
}
document.addEventListener('cs:recap', () => ((shown = true), (pending = false)));
document.addEventListener('cs:reward', () => heroSeen());
document.addEventListener('click', (e) => {
  const again = e.target.closest('.hs-again');
  if (again) return card()?.hidden ? openPairs() : closePairs(true);
  if (e.target.closest('#hdClose')) return closePairs(true);
  if (e.target.closest('#hdAgain')) {
    closePairs();
    return playPairs();
  }
  if (e.target.closest('#heroDone a')) return closePairs();
  // a click anywhere else on the page puts the card away
  if (!card()?.hidden && !e.target.closest('#heroDone')) closePairs();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || card()?.hidden) return;
  if (document.querySelector('.overlay.open')) return;
  e.stopPropagation();
  closePairs(true);
});
