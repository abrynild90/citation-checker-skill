// ============================================================================
// takeaways.js: one plain sentence above each chart that says what to notice, before the reader meets the marks, and the four that head "What the pattern
// shows". Every number is counted from the data. Provides: fillTakeaways(). Needs: app.js (the data).
// ============================================================================
import { CAPS, CO, D, KIN, LAST_DA, LEGAL, NK, fmtMonthYear, parse } from './app.js';
import { gap, yearsBetween } from './charts/lag.js';

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
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
  set('tkLaw', `${cap(word(treaties))} of the ${LEGAL.length} items are treaties, and ${word(soft)} are expert manuals that bind no one.`);
  // Tests: how many destroyed a satellite, where, and when the last was.
  const destroyed = KIN.filter((e) => e.type === 'destructive'),
    leo = destroyed.every((e) => e.altitude_km != null && e.altitude_km <= 2000);
  set('tkA', `${cap(word(destroyed.length))} tests have destroyed a satellite${leo ? ', all in low Earth orbit' : ''}, and the last was in ${fmtMonthYear(parse(LAST_DA))}.`);
  // Jamming, lasers and cyber: how many are still going.
  const going = NK.filter((e) => !e.end).length;
  set('tkC', `${cap(word(going))} of these ${NK.length} operations are still going, while destructive tests have stopped since ${fmtMonthYear(parse(LAST_DA))}.`);
  // Close approaches: how many began in the 2020s.
  const recent = CO.filter((e) => e.start >= '2020').length;
  set('tkR', `In our records, ${recent} of the ${CO.length} close approaches began in 2020 or later.`);
  // Capabilities: how many states hold at least one, by decade.
  const states = (dec) => new Set(Object.values(CAPS.coding).flatMap((c) => Object.keys(c[dec] || {}).map((s) => s.replace('USSR/Russia', 'Russia')))).size,
    first = CAPS.decades[0],
    last = CAPS.decades.at(-1);
  set('tkB', `The number of states with a capability grew from ${word(states(first))} in the ${first} to ${word(states(last))} in the ${last}, though only the ${last} figure is the Secure World Foundation’s own assessment.`);
  // The wait for the law: the range, and how often it was short.
  const waits = D.lag_pairs.pairs.map((p) => yearsBetween(parse((D.events.find((e) => e.id === p.event) || {}).date || (D.events.find((e) => e.id === p.event) || {}).start), parse(D.legal.find((l) => l.id === p.law).start))),
    short = waits.filter((y) => y < 2).length,
    g = (y) => {
      const x = gap(y);
      return `${x.num} ${x.unit}`;
    };
  set('tkL', `The wait for a legal step ran from ${g(Math.min(...waits))} to ${g(Math.max(...waits))}, and in ${word(short)} of the ${word(waits.length)} pairs it was under two years.`);
  // What the pattern shows: the four findings that open the charts of "Explore the data", in the order of the story (law late, tests stopped, close approaches, states).
  const finding = (id, lead, rest) => {
    const n = document.getElementById(id);
    if (n) n.innerHTML = `<b>${lead}</b> ${rest}`;
  };
  finding('pt1', 'The law came later.', `The wait for a legal step ran from ${g(Math.min(...waits))} to ${g(Math.max(...waits))}; in ${word(short)} of the ${word(waits.length)} pairs it was under two years.`);
  finding('pt2', 'Some attacks stopped. Others did not.', `Tests that destroy a satellite have paused since ${fmtMonthYear(parse(LAST_DA))}, yet ${word(going)} of ${word(NK.length)} jamming, laser and cyber operations are still going.`);
  finding('pt3', recent * 2 > CO.length ? 'Close approaches are mostly recent.' : 'Close approaches span many years.', `${cap(word(recent))} of the ${CO.length} in our records began in 2020 or later.`);
  finding('pt4', 'More states can do more.', `The number of states with a capability grew from ${word(states(first))} in the ${first} to ${word(states(last))} in the ${last}; only the ${last} figure is the Secure World Foundation’s own assessment.`);
}
