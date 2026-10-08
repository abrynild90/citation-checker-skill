// ============================================================================
// rewards.js: the small payoffs that draw real pairs on the hero's resting picture (memory only, nothing is stored). A scene watched whose weapon has a pair
// draws that pair at once; three scenes seen, seven scenes seen and three or four quiz answers right each draw one more, preferring a pair whose scene was
// watched. Each one is a real pair from data/lag_pairs.json; the picture picks it (hero-timeline.js, revealPair).
// Provides: earn(key), earnWatched(id), freshReward(), freshLine(), showInHero(), toHero(). A "cs:reward" event on the document announces each new one.
// ============================================================================
import { REDUCED } from './app.js';
import { pulseReveal, revealPair } from './hero-timeline.js';
import { SHORT } from './discover-data.js';
import { seenScenes } from './shared.js';

const earned = new Set(); // keys already given this visit ('seen3', 'seen7', 'quiz3', 'quiz4', 'scene:starfish' ...)
let fresh = []; // the links the reader has not looked at yet: [{ key, event, law, label, at }]; a scene opened since then retires them

// "Mission Shakti to UN resolution 77/41": the link in a few plain words.
const lawShort = (s) => s.replace('UN General Assembly resolution', 'UN resolution');
const labelOf = (r) => `${(r.scene && SHORT[r.scene]) || r.event} to ${lawShort(r.law)}`;
const give = (r) => {
  if (!r) return null;
  const f = { ...r, label: labelOf(r), at: seenScenes.size };
  fresh.push(f);
  document.dispatchEvent(new CustomEvent('cs:reward', { detail: f }));
  return f;
};

// Give the reward for `key` once. Returns { key, event, law } in plain words, or null (given before, or no pair is left to draw).
export function earn(key) {
  if (earned.has(key)) return null;
  earned.add(key);
  return give(revealPair([...seenScenes]));
}
// A scene that has just been opened: when its weapon has a pair on the picture, that pair is drawn (once).
export function earnWatched(id) {
  const k = 'scene:' + id;
  if (earned.has(k)) return null;
  earned.add(k);
  return give(revealPair([id], true));
}
// The links the reader has not looked at yet (a scene opened since then retires them).
export const freshReward = () => ((fresh = fresh.filter((f) => seenScenes.size <= f.at)), fresh.at(-1) || null);
// "1 new link on the picture: Mission Shakti to UN resolution 77/41", or '' when there is none. `where` names the picture ("on the picture", "on the top picture").
export function freshLine(where = 'on the picture') {
  freshReward();
  if (!fresh.length) return '';
  return `${fresh.length === 1 ? '1 new link' : `${fresh.length} new links`} ${where}: ${fresh.map((f) => f.label).join(' and ')}`;
}
// A scene opened by hand draws the pair it has, as soon as it opens (the hero is behind the scene; closing the scene brings the link into view).
document.addEventListener('cs:seen', (e) => earnWatched(e.detail));

// Bring the hero into view, then run `done`. Runs it when the scroll has settled (at once under reduced motion).
export function toHero(done) {
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
// Bring the hero into view and pulse the link once. (The counter keeps saying which link it was until the next scene is opened.)
export function showInHero(key = fresh.at(-1)?.key) {
  toHero(() => {
    pulseReveal(key);
    document.dispatchEvent(new CustomEvent('cs:reward', { detail: null }));
  });
}
