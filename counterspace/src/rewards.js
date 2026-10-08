// ============================================================================
// rewards.js: the small payoffs that draw one more real pair on the hero's resting picture (memory only, nothing is stored): three scenes seen, seven scenes
// seen, three or four quiz answers right. Each one is a real pair from data/lag_pairs.json; the picture picks it (hero-timeline.js, revealPair).
// Provides: earn(key), freshReward(), showInHero(). A "cs:reward" event on the document announces each new one.
// ============================================================================
import { REDUCED } from './app.js';
import { pulseReveal, revealPair } from './hero-timeline.js';
import { seenScenes } from './shared.js';

const earned = new Set(); // keys already given this visit ('seen3', 'seen7', 'quiz3', 'quiz4')
let fresh = null; // the latest reward until the reader has looked at it or opened another scene: { key, event, law, at }

// Give the reward for `key` once. Returns { key, event, law } in plain words, or null (given before, or no clear pair is left to draw).
export function earn(key) {
  if (earned.has(key)) return null;
  earned.add(key);
  const r = revealPair([...seenScenes]);
  if (!r) return null;
  fresh = { ...r, at: seenScenes.size };
  document.dispatchEvent(new CustomEvent('cs:reward', { detail: fresh }));
  return fresh;
}
// The newest reward the reader has not looked at yet (a scene opened since then retires it).
export const freshReward = () => (fresh && seenScenes.size > fresh.at ? (fresh = null) : fresh);

// Bring the hero into view and pulse the link once. Runs the pulse when the scroll has settled (at once under reduced motion).
export function showInHero(key = fresh?.key) {
  const done = () => {
    pulseReveal(key);
    document.dispatchEvent(new CustomEvent('cs:reward', { detail: null }));
  };
  if (fresh && fresh.key === key) fresh = null;
  if (REDUCED || scrollY < 4) {
    scrollTo({ top: 0, behavior: 'auto' });
    return done();
  }
  scrollTo({ top: 0, behavior: 'smooth' });
  let last = -1,
    still = 0;
  const t0 = performance.now(),
    tick = () => {
      still = scrollY === last ? still + 1 : 0;
      last = scrollY;
      if (scrollY < 2 || still > 4 || performance.now() - t0 > 2500) return done();
      requestAnimationFrame(tick);
    };
  requestAnimationFrame(tick);
}
