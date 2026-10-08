// ============================================================================
// discover.js: the scene gallery, "Surprise me", and the gentle reveal of the gallery cards as they scroll into view.
// Needs: scene-ui.js (openScene, ORDER), posters.js, discover-data.js. Provides: mountDiscover().
// ============================================================================
import { REDUCED, esc } from './app.js';
import { ORDER, openScene } from './scene-ui.js';
import { posterURL } from './scenes/posters.js';
import { FACTS, pickSurprise } from './discover-data.js';

const yearOf = (s) => s.date.slice(0, 4);
// Titles end with the year in brackets; the card shows the year on its own line.
const nameOf = (s) => s.title.replace(/\s*\((\d{4}[^)]*)\)\s*$/, '');

function drawGallery() {
  const grid = document.getElementById('posterGrid');
  if (!grid) return;
  grid.innerHTML = ORDER.map((s, i) => {
    const img = posterURL(s.id);
    const fact = esc(FACTS[s.id] || '');
    return `<li class="pcard" style="--i:${i}">
  <button type="button" class="pc-btn" data-id="${esc(s.id)}" aria-labelledby="pn-${esc(s.id)}" aria-describedby="pf-${esc(s.id)}">
    <span class="pc-pic">${img ? `<img src="${img}" alt="" width="640" height="360" loading="lazy" decoding="async">` : ''}<span class="pc-play" aria-hidden="true"><svg class="ico"><use href="#i-play"/></svg></span><span class="pc-fact" id="pf-${esc(s.id)}"><b>Did you know</b> ${fact}</span></span>
    <span class="pc-year">${esc(yearOf(s))}</span>
    <span class="pc-name" id="pn-${esc(s.id)}">${esc(nameOf(s))}</span>
    <span class="pc-fact-s" aria-hidden="true">${fact}</span>
  </button>
</li>`;
  }).join('') +
    `<li class="ptile"><p class="pt-h">Not sure where to start?</p><p class="pt-t">Let the page pick a scene for you.</p><button class="btn primary lg" id="surpriseBtn2" type="button"><svg class="ico" aria-hidden="true"><use href="#i-shuffle"/></svg>Surprise me</button></li>`;
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.pc-btn');
    if (b) openScene(b.dataset.id, b);
  });
}

// Cards slide up a few pixels and fade in the first time they are seen, one after another within a row. With reduced motion, or without
// IntersectionObserver, they are simply there.
function reveal() {
  const cards = [...document.querySelectorAll('.pcard')];
  if (REDUCED || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  cards.forEach((c) => io.observe(c));
}

export function mountDiscover() {
  drawGallery();
  reveal();
  const go = (e) => {
    const s = pickSurprise(ORDER);
    openScene(s.id, e.currentTarget);
  };
  ['surpriseBtn', 'surpriseBtn2'].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.onclick = go;
  });
}
