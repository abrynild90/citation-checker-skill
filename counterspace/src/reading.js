// Reading aids keep dense charts usable without pointing at a tiny SVG mark.
import { KIN, NK, CO, CAPS, D, byId, esc, fmtD } from './app.js';
import { kinCard, nkCard, coCard, legalCard } from './ui.js';
import { statusOf } from './charts/b.js';
import { openScene } from './scene-ui.js';

const chapters = [
  ['scenes', '3D scenes'],
  ['law', 'Law and policy'],
  ['chartA', 'Altitude and debris'],
  ['pattern', 'What the pattern shows'],
  ['quizBand', 'Test yourself'],
  ['explore', 'Explore the data'],
  ['sources', 'Sources and method'],
];
const title = (e) => e.system || e.target_system || e.label || e.id;
const label = (e) => `${(e.date || e.start).slice(0, 4)} · ${e.state || e.actor || ''} · ${title(e)}`;
const card = (e) => (e.domain === 'kinetic' ? kinCard(e) : e.domain === 'non_kinetic' ? nkCard(e) : coCard(e, false));

function finder(id, entries, render = card) {
  const section = document.getElementById(id),
    fold = document.createElement('details');
  fold.className = 'record-find';
  fold.innerHTML = `<summary>Find an entry <span>${entries.length} records</span></summary><div class="record-tools"><label>Search records<input type="search" placeholder="Name, state or year" aria-controls="find-${id}"></label><label>Choose an entry<select id="find-${id}"></select></label></div><p class="record-count" role="status"></p><div class="record-result" hidden></div>`;
  section.querySelector('.refold').before(fold);
  const input = fold.querySelector('input'),
    select = fold.querySelector('select'),
    result = fold.querySelector('.record-result'),
    count = fold.querySelector('.record-count');
  const ordered = [...entries].sort((a, b) => (a.date || a.start).localeCompare(b.date || b.start));
  function fill() {
    const words = input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = ordered.filter((e) =>
      words.every((w) => `${label(e)} ${e.target || ''} ${e.description || e.effect || ''}`.toLocaleLowerCase().includes(w)),
    );
    select.innerHTML =
      `<option value="">${matches.length ? 'Choose an entry…' : 'No matching entries'}</option>` +
      matches.map((e) => `<option value="${esc(e.id)}">${esc(label(e))}</option>`).join('');
    select.disabled = !matches.length;
    count.textContent = `${matches.length} of ${ordered.length} records${matches.length ? '' : '. Try a different name, state or year'}`;
    result.hidden = true;
    result.replaceChildren();
  }
  input.addEventListener('input', fill);
  select.addEventListener('change', () => {
    const e = byId[select.value];
    result.hidden = !e;
    result.innerHTML = e ? render(e) : '';
    if (!e) return;
    result.querySelectorAll('.hint').forEach((n) => n.remove());
    if (e.source_url && ![...result.querySelectorAll('a')].some((a) => a.getAttribute('href') === e.source_url)) {
      const a = document.createElement('a');
      a.href = e.source_url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'btn small';
      a.innerHTML = 'Open the source<span class="sr"> (opens in a new tab)</span>';
      result.append(a);
    }
    if (e.scene_3d) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn small';
      b.textContent = 'Open the 3D explainer';
      b.onclick = () => openScene(e.scene_3d, b);
      result.append(b);
    }
  });
  fill();
}

function stateCode(k, state) {
  const coding = CAPS.coding[k]['2020s'] || {};
  const key = state in coding ? state : state === 'Russia' ? 'USSR/Russia' : state;
  return coding[key] ? statusOf(k, '2020s', key, coding[key]) : null;
}
function capabilities() {
  const names = {
    direct_ascent: 'Direct-ascent weapons',
    co_orbital: 'Co-orbital capabilities',
    electronic_warfare: 'Electronic warfare',
    directed_energy: 'Directed energy',
    cyber: 'Cyber',
  };
  const states = [
    ...new Set(Object.values(CAPS.coding).flatMap((dec) => Object.keys(dec['2020s'] || {}).map((s) => (s === 'USSR/Russia' ? 'Russia' : s)))),
  ].sort();
  const fold = document.createElement('details');
  fold.className = 'record-find';
  fold.innerHTML = `<summary>Read the 2020s assessment by state <span>${states.length} states</span></summary><label class="state-choose">Choose a state<select id="stateAssessment"><option value="">Choose a state…</option>${states.map((s) => `<option>${esc(s)}</option>`).join('')}</select></label><div class="record-result" hidden></div>`;
  document.querySelector('#chartB .refold').before(fold);
  const result = fold.querySelector('.record-result');
  fold.querySelector('select').onchange = (e) => {
    const state = e.target.value;
    result.hidden = !state;
    result.innerHTML = state
      ? `<h5>${esc(state)} · 2020s</h5><dl>${Object.entries(names)
          .map(
            ([k, n]) =>
              `<dt>${n}</dt><dd>${{ D: 'Demonstrated: tested or used', P: 'Developing', N: 'Developing: our reading of the country chapter; SWF’s summary table has no data' }[stateCode(k, state)] || 'Not classified in this assessment'}</dd>`,
          )
          .join(
            '',
          )}</dl><p class="note">Our classification of SWF’s 2026 text. An unclassified capability does not mean the state lacks it. <a href="#codingRules">Read the classification rules</a>.</p>`
      : '';
  };
}

export function mountReading() {
  finder('chartA', KIN);
  finder('chartC', NK);
  finder('chartR', CO);
  const pairs = new Map(D.lag_pairs.pairs.map((p) => [p.event, p]));
  finder(
    'lag',
    [...D.lag_pairs.pairs, ...D.lag_pairs.open].map((p) => byId[p.event]),
    (e) => {
      const pair = pairs.get(e.id),
        law = pair && byId[pair.law];
      return `<h5>${esc(title(e))}</h5><p>${esc(fmtD(e))}</p>${law ? `<p><b>${pair.months} months</b> to the first later legal step linked in these records.</p>${legalCard(law)}` : '<p>No later legal step is paired with this event in these records.</p>'}<p class="note">Chronology and a recorded connection, not a finding of causation.</p>`;
    },
  );
  capabilities();
  const nav = document.createElement('nav');
  nav.className = 'reading-nav';
  nav.setAttribute('aria-label', 'Jump to a chapter');
  nav.innerHTML = `<label><span>On this page</span><select aria-label="Jump to a chapter">${chapters.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label><a href="#top" aria-label="Back to the top">↑</a>`;
  document.body.append(nav);
  const choose = nav.querySelector('select');
  choose.onchange = () => {
    const target = document.getElementById(choose.value);
    target.tabIndex = -1;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.focus({ preventScroll: true });
  };
  const sync = () => {
    const visible = document.getElementById('top').getBoundingClientRect().bottom < 0;
    nav.hidden = !visible;
    if (document.activeElement === choose) return;
    const active = chapters.filter(([id]) => document.getElementById(id).getBoundingClientRect().top < innerHeight * 0.45).at(-1);
    if (active) choose.value = active[0];
  };
  addEventListener('scroll', sync, { passive: true });
  sync();
  document.addEventListener('focusin', (e) => {
    if (nav.hidden || !matchMedia('(max-width:760px)').matches || e.target.closest('.reading-nav, #overlay')) return;
    requestAnimationFrame(() => {
      const r = e.target.getBoundingClientRect(),
        n = nav.getBoundingClientRect();
      if (document.activeElement === e.target && r.bottom > n.top && r.top < innerHeight) scrollBy({ top: r.bottom - n.top + 12, behavior: 'instant' });
    });
  });
}
