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

const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
// How many pairs the records link, in a word ("six").
export const pairWord = () => WORD[D.lag_pairs.pairs.length] || String(D.lag_pairs.pairs.length);

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
// Which of the pairs have a point in the sky to draw a line from: the ones whose weapon has a reported altitude.
const undrawn = () => D.lag_pairs.pairs.filter((p) => byId[p.event]?.altitude_km == null);
// One honest sentence about the picture: how many of the pairs are drawn on it (`drawn`, counted from the picture itself) and why the rest are not. '' when all are.
export function drawnNote(drawn) {
  const all = D.lag_pairs.pairs.length,
    rest = all - drawn,
    word = (n) => WORD[n] || String(n);
  if (rest <= 0 || drawn <= 0) return '';
  const jam = undrawn().length === rest && undrawn().every((p) => /jamming|^ew_/.test(byId[p.event]?.category || '')),
    one = rest === 1,
    what = jam ? (one ? 'a jamming campaign' : 'jamming campaigns') : one ? 'a pair' : 'pairs';
  return `${cap(word(drawn))} of the ${pairWord()} ${drawn === 1 ? 'is' : 'are'} drawn on the picture; the other ${word(rest)} ${one ? 'is' : 'are'} ${what}, which ${one ? 'has' : 'have'} no point in the sky.`;
}

// One row per pair: the weapon on the left, the law on the right, and between them a dashed link whose length follows the wait.
export function recapLinks() {
  return (
    `<ol class="rc-links" aria-label="The ${rows().length} pairs our records link, oldest first">` +
    rows()
      .map(
        (r, i) =>
          `<li style="--i:${i};--hw:${Math.round((linkText(r.g).length * 6.9 + 22) / 2 + 3)}px"><span class="rc-a">${esc(r.weapon)}</span>` +
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
  return `In all ${pairWord()} pairs our records link, the law came later: after ${say(lo.g)} at the quickest and ${say(hi.g)} at the slowest. That is the order of events, not a claim about cause.`;
}
