// ============================================================================
// explore.js: the "Explore the data" tabs. One chart shows at a time; the others stay laid out at full width but out of sight, so each is drawn at its true
// size whatever tab is open (no redraw on show). Provides: mountExplore(), showTab(), revealIn(), activeTab(), panelOf().
// Links to a chart (#chartC, #lag, a table or key inside a panel) and "Find it on the chart" open the right tab first. Print shows every tab (CSS only).
// Needs: shared.js (hooks). legal.js reads #explore[data-years] to know whether the pinned law strip lines up with the open chart.
// ============================================================================
import { FINDING_NOTES, findings } from './takeaways.js';
import { fragmentId, hooks } from './shared.js';

// years: the chart uses the shared year axis, so the pinned law strip above it lines up. svg: the box the chart is drawn into.
const TABS = [
  { id: 'chartC', svg: 'svgC', years: true, name: 'Jamming, lasers and cyber' },
  { id: 'chartR', svg: 'svgR', years: true, name: 'Close approaches' },
  { id: 'chartB', svg: 'svgB', years: false, name: 'Who can do what' },
  { id: 'lag', svg: 'svgL', years: false, name: 'How long the law took' },
];
const $ = (id) => document.getElementById(id);
let bar,
  explore,
  active = TABS[0].id;

export const activeTab = () => active;
export const panelOf = (el) => el?.closest?.('.xpanel') || null;

export function showTab(id, { focus = false } = {}) {
  const tab = TABS.find((t) => t.id === id);
  if (!tab || !bar) return false;
  const changed = id !== active;
  active = id;
  TABS.forEach((t) => {
    const on = t.id === id,
      btn = $('tab-' + t.id),
      panel = $(t.id);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    panel.toggleAttribute('data-off', !on);
  });
  explore.dataset.years = tab.years ? '1' : '0';
  if (changed && !tab.years) hooks.legalOff?.(); // before the chart is drawn: the strip must not hang over a chart with its own scale
  explore.dataset.tab = id;
  hooks.drawLazy?.(tab.svg); // drawn already unless the idle pass has not come yet
  if (focus) $('tab-' + id).focus();
  if (changed) hooks.legalScroll?.(); // the pinned law strip steps aside for a chart that does not use the years
  return true;
}

// Opens the tab that holds el (a mark, a table, a heading); true if a tab had to change.
export function revealIn(el) {
  const p = panelOf(el);
  return !!p && p.hasAttribute('data-off') && showTab(p.id);
}

// The id a link or the address bar points at, if it lives in a tab panel.
const targetOf = (id) => {
  const t = id && $(id);
  return t && (t.classList.contains('xpanel') ? t : panelOf(t)) ? t : null;
};

// Opened from the address bar or a link: show the tab, then bring its top (tabs included) or the named part into view.
function fromHash() {
  const t = targetOf(fragmentId(location.hash));
  if (!t) return;
  showTab(panelOf(t)?.id || t.id);
  requestAnimationFrame(() => t.scrollIntoView({ block: 'start', behavior: 'auto' }));
}

// ---------------------------------------------------------------- the four entry cards above the tabs
// Each card is the chart's name and one line: the finding its chart shows (with its caution, where it needs one). A card opens its tab, like the tab does.
// The cards are the tablist: one control per chart, a name and a finding each. Arrow keys move and open together, Home and End jump.
function mountCards() {
  const lines = findings(); // the four findings of "What the pattern shows": each card's line says what its chart shows
  bar = document.createElement('div');
  bar.className = 'xcards';
  bar.id = 'exploreTabs';
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', 'Charts to explore');
  bar.innerHTML = TABS.map(
    (t, i) =>
      `<button type="button" class="xcard" role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-controls="${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="xc-t" id="xct-${t.id}">${t.name}</span><span class="xc-l">${lines[t.id]}</span>${FINDING_NOTES[t.id] ? `<span class="xc-n">${FINDING_NOTES[t.id]}</span>` : ''}</button>`,
  ).join('');
  $('xpanels').before(bar);
  const cards = [...bar.children];
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('.xcard');
    if (!b) return;
    showTab(b.dataset.tab);
    const top = bar.getBoundingClientRect().top; // bring the cards and the chart under them into view only if they are not already
    if (top < 0 || top > innerHeight * 0.5) bar.scrollIntoView({ block: 'start', behavior: 'auto' });
  });
  bar.addEventListener('keydown', (e) => {
    const at = cards.indexOf(document.activeElement),
      step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key],
      to = e.key === 'Home' ? 0 : e.key === 'End' ? cards.length - 1 : step && at >= 0 ? (at + step + cards.length) % cards.length : -1;
    if (to < 0) return;
    e.preventDefault();
    showTab(cards[to].dataset.tab, { focus: true });
  });
  // Links to a chart land with its cards in view: the card row's height is the room the page leaves above the panel.
  const size = () => {
    const was = explore.style.getPropertyValue('--xt-h');
    explore.style.setProperty('--xt-h', bar.offsetHeight + 'px');
    if (was && was !== bar.offsetHeight + 'px') document.dispatchEvent(new Event('cs:cardsized')); // the room kept above the panels changed (boot.js lands an address again)
  };
  size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(bar, { box: 'border-box' }); // the row's whole height, not only its content: a padding or border that settles late counts too
}

export function mountExplore() {
  explore = $('explore');
  if (!explore || !$('xpanels')) return;
  mountCards();
  // The tabs scroll away on a tall chart, so each panel ends with the way to the next one.
  TABS.forEach((t, i) => {
    const next = TABS[(i + 1) % TABS.length],
      row = document.createElement('p');
    row.className = 'xnext';
    row.innerHTML = `<button class="btn small" type="button" data-next="${next.id}"><span>${i === TABS.length - 1 ? 'Back to' : 'Next chart:'} ${next.name}</span><svg class="ico" aria-hidden="true"><use href="#i-${i === TABS.length - 1 ? 'arrow-up' : 'next'}"/></svg></button>`;
    row.querySelector('button').addEventListener('click', () => {
      showTab(next.id);
      $(next.id).scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    const fold = $(t.id).querySelector(':scope > .refold'),
      foot = document.createElement('div');
    foot.className = 'ref-foot';
    fold.replaceWith(foot);
    foot.append(fold, row);
  });
  showTab(active);
  // A click on a link to a chart opens its tab before the browser scrolls, so the jump lands on a chart that is in place.
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      const t = a && targetOf(fragmentId(a.getAttribute('href')));
      if (t) showTab(panelOf(t)?.id || t.id);
    },
    true,
  );
  addEventListener('hashchange', fromHash);
}
