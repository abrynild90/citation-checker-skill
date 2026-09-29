# Import/export lines needed in src/scenes/* for the ES module graph build

Written by the page agent (owner of tools/build_page.py and every non-scenes module). The page side is done: every non-scenes module under `src/` (`app.js`, `ui.js`, `charts/*`, `export.js`, `scene-ui.js`, `boot.js`, `audit.js`, `method.js`, `shared.js`) already has real `import`/`export` lines, and `ESBUILD_GRAPH=1 python3 tools/build_page.py` bundles `src/boot.js` as a module graph.
The graph build stays OFF by default until the scene modules have their imports: `tools/build_page.py` turns it on automatically once `src/scenes/gl-host.js` contains an `import` line (`ESBUILD_GRAPH=0` forces the old joined-scope build, `=1` forces the graph). Until then the build uses the joined-scope path and behaves exactly as before.

Note on side-effect modules: `gl-items.js`, `gl-labels.js` and `gl-still.js` only extend `GLHost.prototype` and export nothing. `app.js` (page side, already done) loads them with `import {} from './scenes/gl-items.js';` (and the other two) right after the `gl-host.js` import, so they evaluate after `GLHost` exists. Do not import them from `gl-host.js` (that would be a cycle that reads `GLHost` before it is defined).

Rules: single-line imports of the exact form `import { a, b } from './x.js';` (the joined-scope path strips whole lines matching that form), and `export` in front of the declaration (`export function`, `export const`, `export class`). No behaviour changes are needed. Every file only needs the lines below; names were derived with eslint-scope (unresolved identifiers matched against top-level declarations in the other modules).
Already present and correct: `app.js` imports from config/sim/gl-host/svg-fallback/core/earth (these need the matching exports below).

Suggestion: `sim.js` uses `lerp3`, which lives in `gl-items.js` (that would make the physics module import the WebGL item code). Moving `lerp3` into `core.js` (export it, import it in both) keeps `sim.js` free of GL code. If you move it, drop `lerp3` from the lines below.
Verified: with these lines applied to a scratch copy of `src/`, `ESBUILD_GRAPH=1` builds and `tools/qa.mjs` passes with the same section hashes as the joined-scope build.

## src/scenes/core.js
- No imports needed.
- Add `export` to these top-level declarations: `GEO_ALT`, `mulberry`, `orbitThrough`, `orbitPos`, `ll`, `toLL`, `clamp01`, `lerp`, `norm`, `add`, `scl`, `len`, `gauss`, `dot`, `DEG`, `smooth`, `groundArc`, `IS_PHONE`, `sunFor`

## src/scenes/labels.js
- No imports needed.
- Add `export` to these top-level declarations: `labelW`, `offDisc`

## src/scenes/config.js
- Add after the header comment:
  `import { GEO_ALT } from './core.js';`
- Add `export` to these top-level declarations: `C`

## src/scenes/sim.js
- Add after the header comment:
  `import { DEG, GEO_ALT, IS_PHONE, PARTICLE_BUDGET, add, clamp01, dot, gauss, groundArc, len, lerp, ll, mulberry, norm, orbitPos, orbitThrough, rAlt, scl, smooth, toLL } from './core.js';`
  `import { lerp3 } from './gl-items.js';`
  `import { C } from './config.js';`
- No new exports needed.

## src/scenes/earth.js
- Add after the header comment:
  `import { IS_PHONE } from './core.js';`
- Add `export` to these top-level declarations: `earthImg`, `earthPromise`, `spriteCanvas`, `ringCanvas`, `oceanMask`, `getLandCanvas`, `panelCanvas`, `beamCanvas`, `LAND`

## src/scenes/gl-host.js
- Add after the header comment:
  `import { DEG, IS_PHONE, mulberry, norm, scl, sunFor } from './core.js';`
  `import { earthImg, earthPromise, getLandCanvas, loadEarth, oceanMask, ringCanvas, spriteCanvas } from './earth.js';`
  `import { occluded } from './gl-labels.js';`
- No new exports needed.

## src/scenes/gl-items.js
- Add after the header comment:
  `import { GLHost } from './gl-host.js';`
  `import { beamCanvas, panelCanvas } from './earth.js';`
  `import { DEG, IS_PHONE, add, ll, norm, scl } from './core.js';`
- Add `export` to these top-level declarations: `lerp3`

## src/scenes/gl-labels.js
- Add after the header comment:
  `import { GLHost } from './gl-host.js';`
  `import { DEG, dot, len, scl } from './core.js';`
  `import { labelW, offDisc, placeLabels } from './labels.js';`
- Add `export` to these top-level declarations: `occluded`

## src/scenes/gl-still.js
- Add after the header comment:
  `import { GLHost } from './gl-host.js';`
  `import { ll } from './core.js';`
  `import { earthImg } from './earth.js';`
- No new exports needed.

## src/scenes/svg-fallback.js
- Add after the header comment:
  `import { LAND, earthImg, loadEarth } from './earth.js';`
  `import { DEG, ll, mulberry, sunFor, toLL } from './core.js';`
  `import { labelW, offDisc, placeLabels } from './labels.js';`
- No new exports needed.

