// ============================================================================
// recap.js: the payoff once all thirteen scenes have been seen, and the tour's closing slide: the real pairs from data/lag_pairs.json drawn as links, a weapon,
// a dashed line as long as the wait, and the law. Everything is counted from the data. Provides: recapLinks(), recapLine().
// ============================================================================
import { byId, esc, fmtY, parse } from './app.js';
import { D } from './app.js';
import { LAW_WORDS, WORDS } from './charts/lag.js';
import { gap, linkText, yearsBetween } from './links.js';

const MAX = 16; // years: the longest wait in our records is about fifteen
const rows = () =>
  D.lag_pairs.pairs
    .map((p) => {
      const ev = byId[p.event],
        law = byId[p.law],
        a = parse(ev.date || ev.start),
        years = yearsBetween(a, parse(law.start));
      return {
        a,
        years,
        g: gap(years),
        weapon: `${WORDS[p.event]?.name ?? ev.system}, ${fmtY(a)}`,
        law: `${LAW_WORDS[p.law] ?? law.title}, ${fmtY(parse(law.start))}`,
      };
    })
    .sort((p, q) => p.a - q.a);

// One row per pair: the weapon on the left, the law on the right, and between them a dashed link whose length follows the wait.
export function recapLinks() {
  return (
    `<ol class="rc-links" aria-label="The ${rows().length} pairs our records link, oldest first">` +
    rows()
      .map(
        (r, i) =>
          `<li style="--i:${i}"><span class="rc-a">${esc(r.weapon)}</span>` +
          `<span class="rc-track"><span class="rc-link" style="--k:${(0.42 + 0.58 * Math.min(1, r.years / MAX)).toFixed(3)}"><i class="rc-dot"></i><b class="rc-pill">${esc(linkText(r.g))}</b><i class="rc-tick"></i></span>` +
          `<span class="rc-b">${esc(r.law)}</span></span></li>`,
      )
      .join('') +
    '</ol>'
  );
}

// The plain line under it: in every pair the law came later, and by how much at the least and the most.
export function recapLine() {
  const r = rows(),
    say = (g) => `${g.num} ${g.unit}`,
    lo = r.reduce((m, x) => (x.years < m.years ? x : m)),
    hi = r.reduce((m, x) => (x.years > m.years ? x : m));
  return `In all ${['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][r.length] || r.length} pairs our records link, the law came later: after ${say(lo.g)} at the quickest and ${say(hi.g)} at the slowest. That is the order of events, not a claim about cause.`;
}
