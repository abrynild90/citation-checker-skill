// ============================================================================
// discover.js: the scene gallery and "Surprise me". Pictures load at once (they are embedded in the page), so the strip is never blank.
// Needs: scene-ui.js (openScene, ORDER), posters.js, discover-data.js. Provides: mountDiscover().
// ============================================================================
import { REDUCED, esc } from './app.js';
import { drawnNote, pairWord, recapLine, recapLinks } from './recap.js';
import { ORDER, openScene } from './scene-ui.js';
import { posterURL } from './scenes/posters.js';
import { FACTS, pickSurprise } from './discover-data.js';
import { seenScenes } from './shared.js';
import { earn, freshLine, showInHero, toHero } from './rewards.js';
import { playPairs, revealCapacity, revealedCount } from './hero-timeline.js';

const yearOf = (s) => s.date.slice(0, 4);
// Titles end with the year in brackets; the card shows the year on its own line.
const nameOf = (s) => s.title.replace(/\s*\((\d{4}[^)]*)\)\s*$/, '');

// The strip opens with the scenes that land hardest; the rest follow, and every scene is in it. The year on each card keeps the dates readable.
const STRIKING = ['starfish', 'fengyun', 'cosmos1408', 'viasat', 'sj21-tug', 'laser', 'burnt-frost', 'shakti', 'solwind', 'dn2', 'gnss', 'rpo', 'spaceplanes'];
const STRIP = [...ORDER].sort((a, b) => STRIKING.indexOf(a.id) - STRIKING.indexOf(b.id));

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
  grid.innerHTML = surprise + STRIP.map((s, i) => {
    const img = posterURL(s.id);
    const fact = esc(FACTS[s.id] || '');
    return `<li class="pcard" style="--i:${i}">
  <button type="button" class="pc-btn" data-id="${esc(s.id)}" aria-labelledby="pn-${esc(s.id)}" aria-describedby="pf-${esc(s.id)}">
    <span class="pc-pic">${img ? `<img src="${img}" alt="" width="640" height="360" loading="eager" decoding="${i < 6 ? 'sync' : 'async'}">` : ''}<span class="pc-play" aria-hidden="true"><svg class="ico"><use href="#i-play"/></svg></span><span class="pc-seen" hidden><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>Seen</span><span class="pc-fact" id="pf-${esc(s.id)}"><b>Did you know</b> ${fact}</span></span>
    <span class="pc-year">${esc(yearOf(s))}</span>
    <span class="pc-name" id="pn-${esc(s.id)}">${esc(nameOf(s))}</span>
    <span class="pc-fact-s" aria-hidden="true">${fact}</span>
  </button>
</li>`;
  }).join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.pc-btn');
    if (b) openScene(b.dataset.id, b);
  });
  stripControls(grid);
  // Scenes already watched wear a small "Seen" tag, and one line says how many (in memory only)
  const count = document.getElementById('scenesSeen');
  const sync = () => {
    grid.querySelectorAll('.pc-btn').forEach((b) => {
      const on = seenScenes.has(b.dataset.id);
      b.querySelector('.pc-seen').hidden = !on;
      b.classList.toggle('seen', on);
    });
    milestone();
    if (count) {
      const line = freshLine('on the top picture');
      count.textContent = `${seenScenes.size} of ${STRIP.length} scenes seen${line ? '. ' + line : ''}`;
      if (line) {
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'ss-go';
        go.textContent = 'Show me';
        count.append('. ', go);
      }
      if (seenScenes.size) {
        const rule = document.createElement('span');
        rule.className = 'ss-rule';
        rule.textContent = RULE();
        count.append(rule);
      }
    }
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
// each draw one more. When the scene that earned a link is closed, the page brings the hero into view and pulses the new link once.
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
document.addEventListener('cs:closed', () => {
  inScene = false;
  const k = toShow;
  toShow = null;
  if (pending) return drawIn(); // the draw-in of every pair covers a link just earned
  if (k) setTimeout(() => showInHero(k), 250);
});

// The arrows move the strip by about one screenful of cards and switch off at either end; the cards themselves stay the way in for keyboards.
function stripControls(grid) {
  const prev = document.getElementById('stripPrev'),
    next = document.getElementById('stripNext');
  if (!prev || !next) return;
  const sync = () => {
    prev.disabled = grid.scrollLeft < 4;
    next.disabled = grid.scrollLeft + grid.clientWidth > grid.scrollWidth - 4;
    // a soft fade on the end that is cut off, so a half-visible card reads as "more this way", never as a mistake
    grid.classList.toggle('more-l', !prev.disabled);
    grid.classList.toggle('more-r', !next.disabled);
  };
  const go = (dir) => grid.scrollBy({ left: dir * grid.clientWidth * 0.85, behavior: REDUCED ? 'auto' : 'smooth' });
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
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
  if (go) go.textContent = all ? 'See the whole timeline' : 'See the timeline';
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
  document.getElementById('hdLinks').innerHTML = recapLinks();
  document.getElementById('hdLine').textContent = `${recapLine()} ${drawnNote(revealCapacity())}`.trim();
  c.hidden = false;
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
  shown = true;
  pending = false;
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
