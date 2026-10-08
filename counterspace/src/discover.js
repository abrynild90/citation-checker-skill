// ============================================================================
// discover.js: the scene gallery and "Surprise me". Pictures load at once (they are embedded in the page), so the strip is never blank.
// Needs: scene-ui.js (openScene, ORDER), posters.js, discover-data.js. Provides: mountDiscover().
// ============================================================================
import { REDUCED, esc } from './app.js';
import { recapLine, recapLinks } from './recap.js';
import { ORDER, openScene, startTour } from './scene-ui.js';
import { posterURL } from './scenes/posters.js';
import { FACTS, pickSurprise } from './discover-data.js';
import { seenScenes } from './shared.js';

const yearOf = (s) => s.date.slice(0, 4);
// Titles end with the year in brackets; the card shows the year on its own line.
const nameOf = (s) => s.title.replace(/\s*\((\d{4}[^)]*)\)\s*$/, '');

// The strip opens with the scenes that land hardest; the rest follow, and every scene is in it. The year on each card keeps the dates readable.
const STRIKING = ['starfish', 'fengyun', 'cosmos1408', 'viasat', 'sj21-tug', 'laser', 'burnt-frost', 'shakti', 'solwind', 'dn2', 'gnss', 'rpo', 'spaceplanes'];
const STRIP = [...ORDER].sort((a, b) => STRIKING.indexOf(a.id) - STRIKING.indexOf(b.id));

function drawGallery() {
  const grid = document.getElementById('posterGrid');
  if (!grid) return;
  grid.innerHTML = STRIP.map((s, i) => {
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
    if (count) count.textContent = `${seenScenes.size} of ${STRIP.length} scenes seen`;
    heroSeen();
  };
  document.addEventListener('cs:seen', sync);
  sync();
}

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
  const tour = (e) => startTour(e.currentTarget);
  document.getElementById('tourBtn2')?.addEventListener('click', tour);
  ['surpriseBtn', 'surpriseBtn2'].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.onclick = go;
  });
}

// Under the hero's actions: once a scene has been watched, a quiet "Seen N of 13". At 13 of 13, when the last scene is closed, the page returns to the top and
// a card above the buttons shows the real pairs as links, the plain line and where to go next (unless the tour's own closing slide just showed them).
// Everything is counted from the scenes opened in this visit and from the linked pairs in the data; nothing is stored.
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
  if (!all) {
    el.textContent = `Seen ${n} of ${STRIP.length} scenes`;
    return;
  }
  el.innerHTML = `You have seen all ${STRIP.length} scenes. <button type="button" class="hs-again">Show what you found</button>`;
  if (!shown) pending = true;
}
function showDone() {
  const card = document.getElementById('heroDone');
  if (!card) return;
  shown = true;
  pending = false;
  document.getElementById('hdLinks').innerHTML = recapLinks();
  document.getElementById('hdLine').textContent = recapLine();
  card.hidden = false;
  if (innerWidth >= 640)
    card.style.bottom = Math.round(card.parentElement.getBoundingClientRect().bottom - document.getElementById('start').getBoundingClientRect().top) + 'px';
  card.classList.remove('in');
  void card.offsetWidth;
  card.classList.add('in');
  scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  document.getElementById('hdH').focus({ preventScroll: true });
}
function hideDone() {
  const card = document.getElementById('heroDone');
  if (card) card.hidden = true;
}
document.addEventListener('cs:closed', () => pending && showDone());
document.addEventListener('cs:recap', () => ((shown = true), (pending = false)));
document.addEventListener('click', (e) => {
  if (e.target.closest('#hdClose')) {
    hideDone();
    document.getElementById('heroGo')?.closest('a')?.focus({ preventScroll: true });
  } else if (e.target.closest('.hs-again')) showDone();
  else if (e.target.closest('#heroDone a')) hideDone();
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && !document.getElementById('heroDone')?.hidden && hideDone());
