// ============================================================================
// explore.js: the "Explore the data" tabs. One chart shows at a time; the others stay laid out at full width but out of sight, so each is drawn at its true
// size whatever tab is open (no redraw on show). Provides: mountExplore(), showTab(), revealIn(), activeTab(), panelOf().
// Links to a chart (#chartC, #lag, a table or key inside a panel) and "Find it on the chart" open the right tab first. Print shows every tab (CSS only).
// Needs: shared.js (hooks). legal.js reads #explore[data-years] to know whether the pinned law strip lines up with the open chart.
// ============================================================================
import { CO, D, NK, byId, parse } from './app.js';
import { gap, yearsBetween } from './links.js';
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
  if (changed && !tab.years) hooks.legalOff?.(); // before the chart is drawn: the strip must not hang over a chart with its own scale
  explore.dataset.tab = id;
  syncCards();
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


// ---------------------------------------------------------------- the four entry cards above the tabs
// Each card is a small picture of its chart, drawn from the same data, and one line saying what is in it. A card opens its tab, like the tab does.
const yr = (e) => +String(e.date || e.start).slice(0, 4),
  X0 = 1957,
  X1 = 2026,
  tx = (y) => 6 + ((y - X0) / (X1 - X0)) * 148,
  svg = (inner) => `<svg viewBox="0 0 160 64" aria-hidden="true" focusable="false">${inner}<path d="M6 58H154" class="xc-axis"/></svg>`;
const THUMBS = {
  // one dot for each operation, on the year it began
  chartC: () => {
    const rows = [0, 0, 0, 0];
    return svg(
      NK.map((e) => {
        const i = rows.reduce((m, n, k) => (n < rows[m] ? k : m), 0);
        const y = yr(e);
        rows[i] = tx(y) + 7;
        return `<circle cx="${tx(y).toFixed(1)}" cy="${14 + i * 11}" r="3.4" class="xc-a"/>`;
      }).join(''),
    );
  },
  // dots stacked in each three-year slot: a histogram of the close approaches
  chartR: () => {
    const slots = {};
    return svg(
      CO.map((e) => {
        const s = Math.floor((yr(e) - X0) / 3),
          n = (slots[s] = (slots[s] || 0) + 1);
        return `<circle cx="${tx(X0 + s * 3 + 1.5).toFixed(1)}" cy="${(54 - (n - 1) * 5.2).toFixed(1)}" r="2.1" class="xc-a"/>`;
      }).join(''),
    );
  },
  // the number of capability entries in each decade; the 2020s bar is the one SWF assessed
  chartB: () => {
    const dec = D.caps.decades,
      counts = dec.map((d) => Object.values(D.caps.coding).reduce((n, cat) => n + Object.keys(cat[d] || {}).length, 0)),
      top = Math.max(...counts);
    return svg(
      counts
        .map((n, i) => {
          const h = (n / top) * 44;
          return `<rect x="${(9 + i * 18.2).toFixed(1)}" y="${(56 - h).toFixed(1)}" width="12" height="${h.toFixed(1)}" rx="1.5" class="${i === counts.length - 1 ? 'xc-a' : 'xc-b'}"/>`;
        })
        .join(''),
    );
  },
  // one bar for each linked pair, as long as the wait
  lag: () => {
    const ws = D.lag_pairs.pairs.map((p) => yearsBetween(parse(byId[p.event].date || byId[p.event].start), parse(byId[p.law].start))),
      top = Math.max(...ws);
    return svg(ws.map((w, i) => `<rect x="6" y="${(7 + i * 8.2).toFixed(1)}" width="${((w / top) * 140 + 4).toFixed(1)}" height="5" rx="2.5" class="xc-a"/>`).join(''));
  },
};
const LINES = {
  chartC: () => `${NK.length} operations, the first in ${Math.min(...NK.map(yr))}`,
  chartR: () => `${CO.length} close approaches, the first in ${Math.min(...CO.map(yr))}`,
  chartB: () => `States and capabilities, decade by decade`,
  lag: () => {
    const ws = D.lag_pairs.pairs.map((p) => yearsBetween(parse(byId[p.event].date || byId[p.event].start), parse(byId[p.law].start)));
    return `${ws.length} pairs, ${gap(Math.min(...ws)).num} ${gap(Math.min(...ws)).unit} to ${gap(Math.max(...ws)).num} years`;
  },
};
function mountCards() {
  const wrap = document.createElement('ul');
  wrap.className = 'xcards';
  wrap.setAttribute('aria-label', 'Choose a chart');
  wrap.innerHTML = TABS.map(
    (t) =>
      `<li><button type="button" class="xcard" data-tab="${t.id}" aria-pressed="false"><span class="xc-pic">${THUMBS[t.id]()}</span><span class="xc-t">${t.name}</span><span class="xc-l">${LINES[t.id]()}</span></button></li>`,
  ).join('');
  bar.before(wrap);
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('.xcard');
    if (!b) return;
    showTab(b.dataset.tab);
    $(b.dataset.tab).scrollIntoView({ block: 'start', behavior: 'auto' });
  });
}
const syncCards = () => document.querySelectorAll('.xcard').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === active)));

export function mountExplore() {
  bar = $('exploreTabs');
  explore = $('explore');
  if (!bar || !explore) return;
  const btns = [...bar.querySelectorAll('[role="tab"]')];
  bar.hidden = false;
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
