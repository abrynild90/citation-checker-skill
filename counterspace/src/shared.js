// ============================================================================
// shared.js: late-bound hooks that break import cycles between modules.
// The chart, card and export modules need to call into the scene overlay (openScene, prefetchEarth) and the boot code (drawRest), which in turn import
// them. Each provider registers itself here at load; callers use hooks.name(...) at event time, never at module-evaluation time.
// ============================================================================
export const hooks = { openScene: null, prefetchEarth: null, drawRest: null, drawLazy: null, legalScroll: null, legalOff: null, landOnMark: null, showLaw: null, scrubVeil: null };
// The scenes opened so far in this visit (kept in memory only; nothing is stored). Whoever adds one announces it with a "cs:seen" event on the document.
export const seenScenes = new Set();
// The page is "settled" for an address that names a part of it (#legalBand, #chartC, #sources ...) once everything that can change the page's height or the room kept
// clear at the top has happened: the load event, the embedded fonts, the first draw (which measures the pinned strip and sets --band-h) and, in boot.js, the drawing of
// the charts below. A jump made before that lands, and then the page moves again; one made after it lands once and stays.
let firstDrawDone;
export const firstDrawn = new Promise((r) => (firstDrawDone = r));
export const markFirstDrawn = () => firstDrawDone();
export const settled = () =>
  Promise.race([
    Promise.all([
      document.readyState === 'complete' ? 0 : new Promise((r) => addEventListener('load', r, { once: true })),
      document.fonts?.ready,
      firstDrawn,
    ]),
    new Promise((r) => setTimeout(r, 12000)), // never wait for ever on a failed font or draw
  ]);

// Malformed percent escapes are valid URL fragments but must not crash navigation.
export const fragmentId = (hash) => {
  const raw = hash.replace(/^#/, '');
  try { return decodeURIComponent(raw); } catch { return raw; }
};
