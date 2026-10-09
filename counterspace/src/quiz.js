// ============================================================================
// quiz.js: "Test yourself: which came first?", a short guessing game placed right after "What the pattern shows", which it echoes. Every pair is a real pair from the lag data
// (data/lag_pairs.json, through byId); every gap is computed from the two dates. Click a side to commit: the choice locks, the page says plainly whether
// it was right and shows the real gap. A small tally keeps count (nothing is stored). Needs: app.js (data), charts/lag.js (wording and gap format).
// Two of the four questions are ones where the likely guess is wrong: the cyberattack that came after its rules (Viasat), and the treaty that took
// 13 months against the jamming that has waited 15 years.
// ============================================================================
import { D, byId, esc, fmtMY, parse } from './app.js';
import { LAW_WORDS, WORDS, gap, yearsBetween } from './charts/lag.js';
import { linkText } from './links.js';
import { SHORT } from './discover-data.js';
import { openScene } from './scene-ui.js';
import { seenScenes } from './shared.js';
import { earn, showInHero } from './rewards.js';

const LAW_PLAIN = {
  ...LAW_WORDS,
  'tallinn-2017': 'Tallinn Manual 2.0, expert rules on cyber operations (soft law)',
  'icao-2025': 'Finding by the Assembly of the International Civil Aviation Organization (ICAO)',
};
// kind 'order': two things, which came first. [event id, law id, prompt, which side shows first: 'ev' or 'law']
// kind 'wait': two pairs, which waited longer for a legal step. [[event, law], [event, law], prompt]
const QUESTIONS = [
  { kind: 'order', ev: 'us-1962-starfish-prime', law: 'ltbt-1963', ask: 'A nuclear test in space and a treaty', first: 'ev' },
  { kind: 'order', ev: 'in-2019-shakti', law: 'unga-77-41', ask: 'A missile test and a UN resolution', first: 'law' },
  { kind: 'order', ev: 'ru-2022-viasat', law: 'tallinn-2017', ask: 'A cyberattack and a set of expert rules', first: 'ev' },
  { kind: 'wait', a: ['kp-2010-gps', 'icao-2025'], b: ['us-1962-starfish-prime', 'ltbt-1963'], ask: 'Which waited longer for a legal step to follow?' },
];
const when = (r) => parse(r.date || r.start);
const evName = (id) => WORDS[id]?.name || byId[id].system;
const lawName = (id) => LAW_PLAIN[id] || byId[id].label;
const span = (ev, law) => yearsBetween(when(byId[ev]), when(byId[law]));
const gapText = (y) => {
  const g = gap(y);
  return `${g.num} ${g.unit}`;
};
// The pattern the four questions point at, worked out from every linked pair in the lag data: how often the capability came first, and how long the law took.
function pattern() {
  const ys = D.lag_pairs.pairs.map((p) => span(p.event, p.law)),
    first = ys.filter((y) => y > 0).sort((a, b) => a - b);
  if (!first.length) return '';
  // Viasat is not one of the linked pairs (the rules came before the attack, so no later law pairs with it): it is named on its own, as the different case
  const odd = QUESTIONS.filter((q) => q.kind === 'order' && when(byId[q.law]) < when(byId[q.ev])).map((q) => evName(q.ev));
  const all = first.length === ys.length,
    n = NUM[ys.length] ?? String(ys.length),
    lead = all ? `In the ${n} linked pairs, the weapon came first` : `In ${NUM[first.length] ?? first.length} of the ${n} linked pairs, the weapon came first`;
  return (
    `${lead}, and the law followed after ${gapText(first[0])} to ${gapText(first.at(-1))}.` +
    (odd.length ? ` The ${odd.join(' and the ')} ${odd.length > 1 ? 'are different cases' : 'is a different case'}: the rules came first.` : '')
  );
}
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
// The little pair-line: the same drawing as the hero's links (a dot, a dashed gap with the time on it, a tick), drawn in when the answer is given.
// It repeats what the sentences say, so it is hidden from screen readers.
const endHTML = (k) => `<i class="ql-end ql-${k}"></i>`;
const lineHTML = (rows) =>
  `<div class="q-line${rows.length > 1 ? ' two' : ''}" aria-hidden="true">` +
  rows
    .map(
      (r) =>
        `<div class="ql" style="--k:${r.k.toFixed(3)}">${r.cap ? `<span class="ql-cap">${esc(r.cap)}</span>` : ''}` +
        `<span class="ql-track">${endHTML(r.left)}<span class="ql-gap"><b class="ql-pill">${esc(r.text)}</b></span>${endHTML(r.right)}</span>` +
        `<span class="ql-years"><span>${r.yl}</span><span>${r.yr}</span></span></div>`,
    )
    .join('') +
  '</div>';
const mark =
  '<span class="q-mark" aria-hidden="true"><svg class="ico q-yes"><use href="#i-check"/></svg><svg class="ico q-no"><use href="#i-close"/></svg></span>';

// Four short ways to say a guess was wrong, so a run of misses does not repeat one phrase. Each card takes the one at its own place (the same card always says the same thing).
const MISS = ['Not quite.', 'A fair guess, but no.', 'Many people guess the same, but no.', 'Not this time.'];
const miss = (i) => MISS[i % MISS.length];

// What each question shows: the two options (in display order, flagged right or not) and the sentence that explains the truth.
function build(q, i) {
  if (q.kind === 'order') {
    const e = byId[q.ev],
      l = byId[q.law],
      evFirst = when(e) <= when(l),
      opts = [
        { key: 'ev', text: evName(q.ev), right: evFirst },
        { key: 'law', text: lawName(q.law), right: !evFirst },
      ];
    if (q.first === 'law') opts.reverse();
    const a = evFirst ? [evName(q.ev), when(e), lawName(q.law), when(l)] : [lawName(q.law), when(l), evName(q.ev), when(e)],
      note = WORDS[e.id]?.note;
    const years = Math.abs(yearsBetween(a[1], a[3])),
      g = gap(years);
    // two short sentences: the dates (the gap itself is drawn and named in the little line above them)
    const truth =
      `<b>${esc(a[0])}</b> came first (${esc(fmtMY(a[1]))}). <b>${esc(a[2])}</b> followed in ${esc(fmtMY(a[3]))}.` +
      (!evFirst ? ' The manual is soft law, so it does not bind anyone.' : '') +
      ` This is order in time, not cause.${note && evFirst ? ' ' + esc(note) : ''}`;
    // the pair drawn the way the hero draws it: a dot for the weapon, a tick for the law, the first one on the left
    const line = [
      { left: evFirst ? 'dot' : 'tick', right: evFirst ? 'tick' : 'dot', yl: a[1].getUTCFullYear(), yr: a[3].getUTCFullYear(), text: linkText(g), k: 1 },
    ];
    const verdict = (ok) =>
      evFirst
        ? ok
          ? 'Right. The weapon came first.'
          : `${miss(i)} The weapon came first and the law followed.`
        : ok
          ? 'Right. This time the rules came first.'
          : `${miss(i)} This time the rules came first.`;
    return { opts, truth, line, verdict, scene: e.scene_3d };
  }
  const [ea, la] = q.a,
    [eb, lb] = q.b,
    ya = span(ea, la),
    yb = span(eb, lb),
    opts = [
      { key: 'a', text: `${evName(ea)} (${when(byId[ea]).getUTCFullYear()})`, right: ya >= yb },
      { key: 'b', text: `${evName(eb)} (${when(byId[eb]).getUTCFullYear()})`, right: yb > ya },
    ];
  const [longP, shortP] =
    ya >= yb
      ? [
          [ea, la, ya],
          [eb, lb, yb],
        ]
      : [
          [eb, lb, yb],
          [ea, la, ya],
        ];
  // each sentence names the legal step after a colon, so it reads the same whatever the step is called ("Finding by the Assembly...", "Limited Test Ban Treaty")
  const truth =
    `<b>${esc(evName(longP[0]))}</b> waited ${gapText(longP[2])} for a legal step: ${esc(lawName(longP[1]))} (${esc(fmtMY(when(byId[longP[1]])))}). ` +
    `<b>${esc(evName(shortP[0]))}</b> waited ${gapText(shortP[2])}: ${esc(lawName(shortP[1]))} (${esc(fmtMY(when(byId[shortP[1]])))}). This is order in time, not cause.`;
  const top = Math.max(ya, yb),
    one = (e, l, y) => ({
      cap: evName(e),
      left: 'dot',
      right: 'tick',
      yl: when(byId[e]).getUTCFullYear(),
      yr: when(byId[l]).getUTCFullYear(),
      text: linkText(gap(y)),
      k: Math.max(0.74, y / top),
    }),
    line = [one(ea, la, ya), one(eb, lb, yb)];
  const verdict = (ok) => (ok ? 'Right. That one waited longest.' : `${miss(i)} The other one waited longest.`);
  return { opts, truth, line, verdict, scene: [longP[0], shortP[0]].map((id) => byId[id].scene_3d).find(Boolean) };
}
// After a wrong answer: the scene that shows the event, and whether it has been watched yet (in memory only).
const watchLabel = (id) => `Watch ${SHORT[id] || 'the scene'}`;
const watchNote = (id) => (seenScenes.has(id) ? 'watched already' : 'not watched yet');

export function mountQuiz() {
  const host = document.getElementById('quiz');
  if (!host) return;
  const N = QUESTIONS.length;
  const built = QUESTIONS.map((q, i) => build(q, i));
  const cards = QUESTIONS.map((q, i) => {
    const b = built[i];
    return `<li class="q" data-i="${i}">
  <p class="q-ask" id="q${i}">${esc(q.ask)}</p>
  <p class="q-hint">${q.kind === 'order' ? 'Which came first?' : 'Pick one.'}</p>
  <div class="q-opts" role="group" aria-labelledby="q${i}">
    ${b.opts.map((o, k) => `<button type="button" class="q-opt" data-k="${k}" aria-pressed="false">${mark}<span class="q-t">${esc(o.text)}</span></button>`).join('')}
  </div>
  <div class="q-out" aria-live="polite"></div>
</li>`;
  }).join('');
  host.innerHTML = `<div class="quiz"><ol class="q-list">${cards}</ol>
  <div class="q-trail" id="qTrail" aria-hidden="true" hidden></div>
  <div class="q-foot"><div class="q-sum"><p class="q-tally" id="qTally" aria-live="polite">Four questions, no pressure. Your guesses are not stored.</p>
    <p class="q-pattern" id="qPattern" hidden></p><p class="q-reward" id="qReward" aria-live="polite" hidden></p></div>
    <button type="button" class="btn small q-again" id="qAgain" hidden><svg class="ico" aria-hidden="true"><use href="#i-replay"/></svg>Try again</button>
    <button type="button" class="btn small primary" id="qHero" hidden><svg class="ico" aria-hidden="true"><use href="#i-arrow-up"/></svg>Show me the new link</button>
    <a class="btn small" id="qGaps" href="#lag"><span>See all the gaps</span><svg class="ico" aria-hidden="true"><use href="#i-arrow-down"/></svg></a></div></div>`;
  const tally = host.querySelector('#qTally'),
    again = host.querySelector('#qAgain'),
    pat = host.querySelector('#qPattern'),
    gaps = host.querySelector('#qGaps'),
    trail = host.querySelector('#qTrail'),
    rew = host.querySelector('#qReward'),
    toHero = host.querySelector('#qHero'),
    got = new Map(), // the reward earned at each score ('quiz3', 'quiz4'): each is given once per visit
    state = new Array(N).fill(null); // null (open), true (called it) or false
  const sync = () => {
    const done = state.filter((s) => s !== null).length,
      right = state.filter(Boolean).length;
    if (!done) tally.textContent = 'Four questions, no pressure. Your guesses are not stored.';
    else tally.textContent = done < N ? `You called ${right} of ${done} so far.` : `You called ${right} of ${N}.`;
    tally.classList.toggle('done', done === N);
    // all answered: the score is joined by what the four pairs have in common, and the way to the chart that shows every pair becomes the main step
    pat.textContent = done === N ? pattern() : '';
    pat.hidden = done !== N || !pat.textContent;
    gaps.classList.toggle('primary', done === N);
    gaps.querySelector('span').textContent = done === N ? 'See every gap' : 'See all the gaps';
    again.hidden = !done;
    // three or four right: a short drawn flourish (one dot per question joined by a dashed line, ending in a tick) and a new link on the hero's picture
    const win = done === N && right >= 3;
    trail.hidden = !win;
    trail.replaceChildren();
    rew.hidden = toHero.hidden = true;
    if (!win) return;
    const key = 'quiz' + right;
    if (!got.has(key)) got.set(key, earn(key));
    const r = got.get(key);
    trail.className = 'q-trail' + (right === N ? ' perfect' : '');
    trail.innerHTML =
      '<span class="qt-line"></span>' +
      // small beads along the dashed line, three in each stretch between one dot and the next (the last stretch ends at the tick): the line reads as a line of
      // dots even in a still picture
      state
        .map((s, i) => {
          const a = ((i + 0.5) / N) * 100,
            z = i + 1 < N ? ((i + 1.5) / N) * 100 : 100;
          return (
            [1, 2, 3].map((k) => `<i class="qt-bead" style="--p:${(a + ((z - a) * k) / 4).toFixed(2)}%;--i:${i * 3 + k}"></i>`).join('') +
            `<i class="qt-dot ${s ? 'ok' : 'miss'}" style="--p:${a}%;--i:${i}"></i>`
          );
        })
        .join('') +
      '<i class="qt-tick"></i>';
    if (r) {
      rew.textContent = `${right === N ? 'All four right.' : 'Three right.'} That earns a new link on the picture at the top of the page: ${r.event} and ${r.law}.`;
      rew.hidden = toHero.hidden = false;
      toHero.dataset.key = r.key;
    }
  };
  host.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.q-opt');
    if (!btn) return;
    const li = btn.closest('.q'),
      i = +li.dataset.i;
    if (state[i] !== null) return; // committed: the answer stands
    const b = built[i],
      k = +btn.dataset.k,
      ok = b.opts[k].right;
    state[i] = ok;
    li.classList.add('done');
    li.querySelectorAll('.q-opt').forEach((o, j) => {
      o.setAttribute('aria-pressed', String(j === k));
      o.disabled = true;
      o.classList.toggle('pick', j === k);
      o.classList.toggle('right', b.opts[j].right);
      o.classList.toggle('wrong', j === k && !ok);
      o.querySelector('.q-t').insertAdjacentHTML('beforeend', b.opts[j].right ? '<span class="sr"> (the right answer)</span>' : '');
    });
    li.querySelector('.q-out').innerHTML =
      `<p class="q-verdict ${ok ? 'yes' : 'no'}">${esc(b.verdict(ok))}</p>${lineHTML(b.line)}<p class="q-truth">${b.truth}</p>` +
      (!ok && b.scene
        ? `<span class="q-watch">Want to see it? <button type="button" class="q-go" data-scene="${esc(b.scene)}"><svg class="ico" aria-hidden="true"><use href="#i-play"/></svg>` +
          `${esc(watchLabel(b.scene))}</button> <span class="q-seen">(${watchNote(b.scene)})</span></span>`
        : '');
    sync();
  });
  toHero.addEventListener('click', () => showInHero(toHero.dataset.key));
  host.addEventListener('click', (ev) => {
    const w = ev.target.closest('.q-go');
    if (w) openScene(w.dataset.scene, w);
  });
  document.addEventListener('cs:seen', () =>
    host.querySelectorAll('.q-watch').forEach((n) => (n.querySelector('.q-seen').textContent = `(${watchNote(n.querySelector('.q-go').dataset.scene)})`)),
  );
  again.addEventListener('click', () => {
    state.fill(null);
    host.querySelectorAll('.q').forEach((li) => {
      li.classList.remove('done');
      li.querySelector('.q-out').replaceChildren();
      li.querySelectorAll('.q-opt').forEach((o) => {
        o.disabled = false;
        o.setAttribute('aria-pressed', 'false');
        o.classList.remove('pick', 'right', 'wrong');
        o.querySelector('.sr')?.remove();
      });
    });
    sync();
    host.querySelector('.q-opt')?.focus();
  });
}
