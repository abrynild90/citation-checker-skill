// ============================================================================
// shared.js: late-bound hooks that break import cycles between modules.
// The chart, card and export modules need to call into the scene overlay (openScene, prefetchEarth) and the boot code (drawRest), which in turn import
// them. Each provider registers itself here at load; callers use hooks.name(...) at event time, never at module-evaluation time.
// ============================================================================
export const hooks = { openScene: null, prefetchEarth: null, drawRest: null, drawLazy: null, legalScroll: null, legalOff: null, showLaw: null };
// The scenes opened so far in this visit (kept in memory only; nothing is stored). Whoever adds one announces it with a "cs:seen" event on the document.
export const seenScenes = new Set();
