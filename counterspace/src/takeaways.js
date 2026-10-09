// ============================================================================
// takeaways.js: one plain sentence above each chart that says what to notice, before the reader meets the marks, and the four that head "What the pattern
// shows". Every number is counted from the data. Provides: fillTakeaways(). Needs: app.js (the data).
// ============================================================================
import { CAPS, CO, D, KIN, LAST_DA, LEGAL, NK, REDUCED, byId, esc, fmtMY, fmtMonthYear, parse } from './app.js';
import { LAW_WORDS, WORDS as PAIR_WORDS, gap, yearsBetween } from './charts/lag.js';
import { capSentence } from './charts/b.js';
import { recapLinks } from './recap.js';

const WORDS = [
    'no',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ],
  word = (n) => WORDS[n] ?? String(n),
  cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function fillTakeaways() {
  const set = (id, text) => {
    const n = document.getElementById(id);
    if (n) n.textContent = text;
  };
  // Law: how many items are binding treaties.
  const treaties = LEGAL.filter((l) => l.kind === 'treaty').length,
    soft = LEGAL.filter((l) => l.soft_law).length;
  set('tkLaw', `Only ${word(treaties)} of the ${LEGAL.length} items are treaties. ${cap(word(soft))} are expert manuals, which bind no one.`);
  // Tests: how many destroyed a satellite, where, and when the last was.
  const destroyed = KIN.filter((e) => e.type === 'destructive'),
    leo = destroyed.every((e) => e.altitude_km != null && e.altitude_km <= 2000);
  set(
    'tkA',
    `${cap(word(destroyed.length))} tests have destroyed a satellite${leo ? ', every one in low Earth orbit' : ''}. The last was in ${fmtMonthYear(parse(LAST_DA))}.`,
  );
  // Jamming, lasers and cyber: how many are still going.
  const going = NK.filter((e) => !e.end).length;
  set('tkC', `${cap(word(going))} of these ${NK.length} operations are still going. Destructive tests have stopped since ${fmtMonthYear(parse(LAST_DA))}.`);
  // Close approaches: how many began in the 2020s.
  const recent = CO.filter((e) => e.start >= '2020').length;
  set(
    'tkR',
    `In our records, ${recent} of the ${CO.length} close approaches began in 2020 or later${recent * 2 > CO.length ? ', which is more than half' : ''}.`,
  );
  // Capabilities: how many states hold at least one, by decade.
  const states = (dec) => new Set(Object.values(CAPS.coding).flatMap((c) => Object.keys(c[dec] || {}).map((s) => s.replace('USSR/Russia', 'Russia')))).size,
    first = CAPS.decades[0],
    last = CAPS.decades.at(-1);
  set('tkB', capSentence('cat'));
  // The wait for the law: the range, and how often it was short.
  const waits = D.lag_pairs.pairs.map((p) =>
      yearsBetween(
        parse((D.events.find((e) => e.id === p.event) || {}).date || (D.events.find((e) => e.id === p.event) || {}).start),
        parse(D.legal.find((l) => l.id === p.law).start),
      ),
    ),
    short = waits.filter((y) => y < 2).length,
    g = (y) => {
      const x = gap(y);
      return `${x.num} ${x.unit}`;
    };
  set(
    'tkL',
    `The wait ran from ${g(Math.min(...waits))} to ${g(Math.max(...waits))}. In ${word(short)} of the ${word(waits.length)} pairs it was under two years.`,
  );
  // What the pattern shows: the four findings that open the charts of "Explore the data", in the order of the story (law late, tests stopped, close approaches, states).
  const finding = (id, lead, rest) => {
    const n = document.getElementById(id);
    if (n) n.innerHTML = `<b>${lead}</b> ${rest}`;
  };
  const pairs = D.lag_pairs.pairs,
    longI = waits.indexOf(Math.max(...waits)),
    longP = pairs[longI];
  finding(
    'pt1',
    `${cap(word(short))} of the ${word(waits.length)} waits were under two years.`,
    `The longest, from ${PAIR_WORDS[longP.event]?.name ?? byId[longP.event].system} to the ${LAW_WORDS[longP.law] ?? byId[longP.law].title}, took ${g(waits[longI])}.`,
  );
  patBig(waits, longP, g);
  finding(
    'pt2',
    'Some attacks stopped. Others did not.',
    `Tests that destroy a satellite have paused since ${fmtMonthYear(parse(LAST_DA))}, yet ${word(going)} of ${word(NK.length)} jamming, laser and cyber operations are still going.`,
  );
  finding(
    'pt3',
    recent * 2 > CO.length ? 'Close approaches are mostly recent.' : 'Close approaches span many years.',
    `${cap(word(recent))} of the ${CO.length} in our records began in 2020 or later.`,
  );
  finding(
    'pt4',
    'More states can do more.',
    `The number of states with a capability grew from ${word(states(first))} in the ${first} to ${word(states(last))} in the ${last}; only the ${last} figure is the Secure World Foundation’s own assessment.`,
  );
}

// The opening statement of "What the pattern shows": the range of the waits in one large line, and under it the longest pair drawn as a thin line between its two
// dates. The line draws itself once, when the panel scrolls into view (with reduced motion it is simply there). Every figure is counted from the pairs.
function patBig(waits, longP, g) {
  const box = document.getElementById('patBig');
  if (!box) return;
  document.getElementById('pbNum').innerHTML = `<span>${esc(g(Math.min(...waits)))}</span> to <span>${esc(g(Math.max(...waits)))}</span>`;
  const ev = byId[longP.event],
    law = byId[longP.law],
    from = parse(ev.date || ev.start);
  document.getElementById('pbTrack').innerHTML =
    `<span class="pb-end a"><b>${esc(fmtMY(from))}</b><span>${esc(PAIR_WORDS[ev.id]?.name ?? ev.system)} begins</span></span>` +
    `<span class="pb-rail"><i class="pb-dot"></i><i class="pb-draw"></i><b class="pb-pill">${esc(g(Math.max(...waits)))} later</b><i class="pb-tick"></i></span>` +
    `<span class="pb-end b"><b>${esc(fmtMY(parse(law.start)))}</b><span>${esc(LAW_WORDS[law.id] ?? law.title)}</span></span>`;
  // narrow: the one line drawn here shows the longest wait. Wide (the list of every pair stands beside it): the line would repeat the list, so it is left out and the list marks the longest.
  document.getElementById('pbNote').innerHTML =
    `<span class="pb-n1">${cap(word(waits.length))} pairs from our records. The line shows the longest wait. This is order in time, not cause.</span>` +
    `<span class="pb-n2">${cap(word(waits.length))} pairs from our records, listed beside it. The longest wait is marked. This is order in time, not cause.</span>`;
  // on a wide window the right of the panel carries all the pairs, one dashed line each (the same drawing as the hero's links)
  document.getElementById('pbPairs').innerHTML = `<p class="pb-ph">Every pair, oldest first</p>${recapLinks()}`;
  document.querySelector(`#pbPairs li[data-ev="${longP.event}"]`)?.classList.add('is-long');
  box.hidden = false;
  // The pairs are always there as words; only the dashed lines and the time pills draw in, in under a second. The drawing starts while the panel is still a screen
  // below the window, so it is under way or done when the panel arrives. An address (#pattern), a link or a jump that lands on the panel before that shows it
  // complete at once, and so does a panel that is already in reach when the page loads.
  const near = () => {
    const r = box.getBoundingClientRect();
    return r.top < innerHeight * 1.4 && r.bottom > -innerHeight * 0.5;
  };
  if (!REDUCED && 'IntersectionObserver' in window && !location.hash && !near()) {
    box.dataset.armed = '';
    let io;
    const stop = () => (io?.disconnect(), removeEventListener('scroll', jump));
    const jump = () => {
      if (box.classList.contains('in')) return stop();
      if (box.getBoundingClientRect().top < innerHeight * 0.95) (box.classList.add('in', 'snap'), stop());
    };
    io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        box.classList.add('in');
        stop();
      },
      { rootMargin: '0px 0px 40% 0px', threshold: 0 },
    );
    io.observe(box);
    addEventListener('scroll', jump, { passive: true });
  }
}
