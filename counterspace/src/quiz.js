// ============================================================================
// quiz.js: "Which came first?", a short guessing game placed before the lag chart. Three real pairs from the lag data (one where the law came first);
// the reader picks a side, the real gap is revealed. No score, nothing stored. Needs: app.js (data), charts/lag.js (the chart's own wording and gap format).
// ============================================================================
import { byId, esc, fmtMY, parse } from './app.js';
import { LAW_WORDS, WORDS, gap, yearsBetween } from './charts/lag.js';

// event id, law id. Starfish and Shakti are pairs of the chart; Viasat is the chart's open ring, where the related law (soft law) came first.
const PAIRS = [
  ['us-1962-starfish-prime', 'ltbt-1963', 'A nuclear test and a treaty'],
  ['in-2019-shakti', 'unga-77-41', 'A missile test and a UN resolution'],
  ['ru-2022-viasat', 'tallinn-2017', 'A cyberattack and expert rules'],
];
const LAW_PLAIN = { ...LAW_WORDS, 'tallinn-2017': 'Tallinn Manual 2.0, expert rules on cyber operations (soft law)' };
const when = (r) => parse(r.date || r.start);

export function mountQuiz() {
  const host = document.getElementById('quiz');
  if (!host) return;
  const cards = PAIRS.map(([ev, lw, topic], i) => {
    const e = byId[ev],
      l = byId[lw];
    if (!e || !l) return '';
    const eName = WORDS[ev]?.name || e.system,
      lName = LAW_PLAIN[lw] || l.label;
    return `<li class="q" data-ev="${esc(ev)}" data-law="${esc(lw)}">
  <p class="q-ask" id="q${i}">${esc(topic)}</p>
  <div class="q-opts" role="group" aria-labelledby="quizH q${i}">
    <button type="button" class="q-opt" data-pick="ev" aria-pressed="false">${esc(eName)}</button>
    <button type="button" class="q-opt" data-pick="law" aria-pressed="false">${esc(lName)}</button>
  </div>
  <p class="q-out" aria-live="polite"></p>
</li>`;
  }).join('');
  host.innerHTML = `<section class="quiz" aria-labelledby="quizH">
  <h3 id="quizH">Which came first?</h3>
  <p class="quiz-lede">Three pairs from the chart below. Pick the one you think came first. There is no score: the answer shows the real gap.</p>
  <ol class="q-list">${cards}</ol></section>`;
  host.addEventListener('click', (ev) => {
    const b = ev.target.closest('.q-opt');
    if (!b) return;
    const q = b.closest('.q'),
      e = byId[q.dataset.ev],
      l = byId[q.dataset.law];
    q.querySelectorAll('.q-opt').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    const first = when(e) <= when(l) ? 'ev' : 'law',
      g = gap(yearsBetween(first === 'ev' ? when(e) : when(l), first === 'ev' ? when(l) : when(e))),
      eName = WORDS[e.id]?.name || e.system,
      lName = LAW_PLAIN[l.id] || l.label,
      note = WORDS[e.id]?.note;
    const a = first === 'ev' ? [eName, fmtMY(when(e)), lName, fmtMY(when(l))] : [lName, fmtMY(when(l)), eName, fmtMY(when(e))];
    q.querySelector('.q-out').innerHTML =
      `<b>${esc(a[0])}</b> came first (${esc(a[1])}). <b>${esc(a[2])}</b> followed <span class="q-gap">${g.num} ${g.unit}</span> later (${esc(a[3])}).` +
      (first === 'law' ? ' The manual is soft law, so it does not bind anyone.' : '') +
      ` This is order in time, not cause.${note && first === 'ev' ? ' ' + esc(note) : ''}`;
  });
}
