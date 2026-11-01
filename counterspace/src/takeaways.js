// ============================================================================
// takeaways.js: one plain sentence above each chart that says what to notice, before the reader meets the marks, the opening of "What the pattern shows"
// and its four findings (the lines of the chart cards). Every number is counted from the data. Provides: fillTakeaways(), findings(). Needs: app.js (the data).
// ============================================================================
import { CO, D, KIN, LAST_DA, LEGAL, NK, byId, esc, fmtMY, fmtMonthYear, parse } from './app.js';
import { LAW_WORDS, WORDS as PAIR_WORDS, gap, yearsBetween } from './charts/lag.js';
import { capSentence } from './charts/b.js';

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
  set('tkB', capSentence('cat'));
  // The wait for the law: the range, and how often it was short.
  const waits = pairWaits(),
    short = waits.filter((y) => y < 2).length,
    g = (y) => {
      const x = gap(y);
      return `${x.num} ${x.unit}`;
    };
  set(
    'tkL',
    `The wait ran from ${g(Math.min(...waits))} to ${g(Math.max(...waits))}. In ${word(short)} of the ${word(waits.length)} pairs it was under two years.`,
  );
  // What the pattern shows: the display line, the longest pair and its caution. The four findings are the lines of the chart cards (findings(), read by explore.js).
  const pairs = D.lag_pairs.pairs,
    longI = waits.indexOf(Math.max(...waits));
  patBig(waits, g, pairs[longI], waits[longI]);
}

// The waits between each linked weapon and the first later legal step, in years, in the order of the pair data.
function pairWaits() {
  const at = (id) => D.events.find((e) => e.id === id) || {};
  return D.lag_pairs.pairs.map((p) => yearsBetween(parse(at(p.event).date || at(p.event).start), parse(D.legal.find((l) => l.id === p.law).start)));
}
// The four findings, in the order of the story (law late, tests stopped, close approaches, states); each is the line of the card that opens its chart.
export function findings() {
  const waits = pairWaits(),
    short = waits.filter((y) => y < 2).length,
    recent = CO.filter((e) => e.start >= '2020').length;
  return {
    lag: `${cap(word(short))} of the ${word(waits.length)} waits were under two years.`,
    chartC: 'Some attacks stopped. Others did not.',
    chartR: recent * 2 > CO.length ? 'Close approaches are mostly recent.' : 'Close approaches span many years.',
    chartB: 'More states can do more.',
  };
}

// The range of the waits in one serif sentence, then the longest pair drawn on the shared year axis (1957 to 2026) between its two dates, and the caution.
// The sentence already says how long the wait was, so the drawing carries no time tag of its own: an axis, the weapon's dot, the law's tick, the dashed link and the
// two dated names as direct labels (each led by its own small mark, so on a phone, where the names stack under the axis, they still read as the dot's and the tick's).
const AX0 = 1957,
  AX1 = 2026;
function patBig(waits, g, longP, longW) {
  const box = document.getElementById('patBig');
  if (!box) return;
  document.getElementById('pbNum').textContent = `${g(Math.min(...waits))} to ${g(Math.max(...waits))}.`;
  const ev = byId[longP.event],
    law = byId[longP.law],
    evName = PAIR_WORDS[longP.event]?.name ?? ev.system,
    lawName = LAW_WORDS[longP.law] ?? law.title,
    t0 = parse(ev.date || ev.start),
    t1 = parse(law.start),
    yf = (d) => d.getUTCFullYear() + d.getUTCMonth() / 12,
    pc = (d) => (((yf(d) - AX0) / (AX1 - AX0)) * 100).toFixed(2) + '%',
    decades = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
  document.getElementById('pbTrack').innerHTML =
    `<div class="pb-axis">${decades.map((y) => `<span class="pb-yr" style="left:${(((y - AX0) / (AX1 - AX0)) * 100).toFixed(2)}%">${y}</span>`).join('')}` +
    `<span class="pb-span" style="left:${pc(t0)};right:calc(100% - ${pc(t1)})"><i class="pb-draw"></i></span>` +
    `<i class="pb-dot" style="left:${pc(t0)}"></i><i class="pb-tick" style="left:${pc(t1)}"></i></div>` +
    `<p class="pb-end a" style="--at:${pc(t0)}"><b><i class="pb-k dot"></i>${esc(evName)}</b><span>${esc(fmtMY(t0))}</span></p>` +
    `<p class="pb-end b" style="--at:${pc(t1)}"><b><i class="pb-k tick"></i>${esc(lawName)}</b><span>${esc(fmtMY(t1))}</span></p>`;
  document.getElementById('pbNote').textContent = `The longest, from ${evName} to the ${lawName}, took ${g(longW)}. This is order in time, not cause.`;
  box.hidden = false;
}
