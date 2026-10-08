// ============================================================================
// explore.js: the "Explore the data" tabs. One chart shows at a time; the others stay laid out at full width but out of sight, so each is drawn at its true
// size whatever tab is open (no redraw on show). Provides: mountExplore(), showTab(), revealIn(), activeTab(), panelOf().
// Links to a chart (#chartC, #lag, a table or key inside a panel) and "Find it on the chart" open the right tab first. Print shows every tab (CSS only).
// Needs: shared.js (hooks). legal.js reads #explore[data-years] to know whether the pinned law strip lines up with the open chart.
// ============================================================================
import { hooks } from './shared.js';

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
  const t = targetOf(decodeURIComponent(location.hash.slice(1)));
  if (!t) return;
  showTab(panelOf(t)?.id || t.id);
  requestAnimationFrame(() => t.scrollIntoView({ block: 'start', behavior: 'auto' }));
}

export function mountExplore() {
  bar = $('exploreTabs');
  explore = $('explore');
  if (!bar || !explore) return;
  const btns = [...bar.querySelectorAll('[role="tab"]')];
  bar.hidden = false;
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
    $(t.id).append(row);
  });
  showTab(active);
  btns.forEach((b) => b.addEventListener('click', () => showTab(b.id.slice(4))));
  bar.addEventListener('keydown', (e) => {
    const at = btns.indexOf(document.activeElement),
      step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key],
      to = e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : step && at >= 0 ? (at + step + btns.length) % btns.length : -1;
    if (to < 0) return;
    e.preventDefault();
    showTab(btns[to].id.slice(4), { focus: true }); // arrows move and open together: each tab is one chart, there is nothing to wait for
  });
  // A click on a link to a chart opens its tab before the browser scrolls, so the jump lands on a chart that is in place.
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      const t = a && targetOf(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (t) showTab(panelOf(t)?.id || t.id);
    },
    true,
  );
  addEventListener('hashchange', fromHash);
  if (location.hash) addEventListener('load', () => setTimeout(fromHash, 60));
}
