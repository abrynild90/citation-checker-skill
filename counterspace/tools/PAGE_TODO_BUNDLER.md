# For the page agent: bundler and lag-pair items

## 1. Lag panel: read data/lag_pairs.json (generated from legal.json related_events)
`data/lag_pairs.json` is now embedded in the page data blob as `lag_pairs` (`tools/build_page.py`). Replace the hard-coded `LAG` in `src/charts/lag.js` with it:
- `pairs[]`: `{event, law, months, text}` (6 pairs: Starfish->LTBT, Shakti->UNGA 77/41, Cosmos 1408->US moratorium, kp-2010-gps->ICAO 2025, Baltic->ICAO 2025, EU-sats->ITU RRB 2024). Draw `cap: event`, `law: law`, caption `text`.
- `open[]`: `{event, text, basis}` (MIRACL, Viasat) drawn as open rings; `text` already avoids claiming that no rule exists.
- `dropped[]`: Bold Orion->OST and FY-1C->UNGA 77/41 have no sourced link. Do not draw them (methodology section 5, decision 12).
Rows are ordered by event date already. Then run `BASELINE=1` for qa.mjs after review.

## 2. Bundler status
`tools/build_page.py` now minifies with esbuild (`npm install` in `tools/`; esbuild is in `tools/package.json`). The modules are still joined in `ORDER` first, because `src/` shares top-level names across files without importing them (only `app.js` has real imports), so esbuild cannot bundle `src/boot.js` as a module graph yet (a graph bundle builds but fails at runtime with `GEO_ALT is not defined`). The join uses whole-line import removal plus `export ` removal, and the build checks the import count against esbuild's metafile. The old fallback (line-based minifier) runs when esbuild is missing or `NOESBUILD=1`.

To switch to a real graph (`ESBUILD_GRAPH=1 python3 tools/build_page.py` bundles `src/boot.js` directly), each file needs `import` lines for the shared names it uses and matching `export`s. Undeclared names per file (from eslint `no-undef`, browser globals plus `d3`/`THREE` allowed):
- `scenes/config.js`: GEO_ALT. `scenes/earth.js`: IS_PHONE. `scenes/gl-host.js`: IS_PHONE, DEG, sunFor, scl, mulberry, earthImg, earthPromise, loadEarth, spriteCanvas, ringCanvas, oceanMask, getLandCanvas, norm. `scenes/gl-items.js`: GLHost, panelCanvas, norm, IS_PHONE, beamCanvas, scl, add, ll, DEG. `scenes/gl-labels.js`: GLHost, DEG, labelW, offDisc, placeLabels, len, scl, dot. `scenes/gl-still.js`: GLHost, ll, earthImg. `scenes/sim.js`: mulberry, GEO_ALT, rAlt, orbitThrough, orbitPos, ll, toLL, clamp01, lerp, norm, add, scl, len, PARTICLE_BUDGET, gauss, lerp3, dot, DEG, smooth, groundArc, C, IS_PHONE. `scenes/svg-fallback.js`: toLL, ll, DEG, mulberry, LAND, sunFor, labelW, offDisc, placeLabels.
- `ui.js`: PHONE_MAX, esc, num, fmtMY, parse, fmtD, TYPE_LABEL, hasScene, fmt, ATTR_LABEL, REGIME_LABEL, fmtY, EXPORTING, openScene, LAST_DA.
- `charts/*.js`: parse, DOMAIN, layout, isPhoneNow, tw, wrap, xAxis, addGuide, rove, bindMark, badge, legend, table, activate, colorOf, Placer, byId, EXPORTING, esc, num, fmt/fmtY/fmtMY/fmtD, hasScene, KIN/NK/LEGAL/CAPS, LAST_DA, TYPE_LABEL, ATTR_LABEL, REGIME_LABEL, actorKey, stateC, setGuide, srcCell, kinCard/nkCard/legalCard, legalGlyph, drawC (from b.js).
- `app.js`, `export.js`, `method.js`, `scene-ui.js`, `boot.js`, `audit.js`: everything they call from the files above (drawA/B/C/L/Legal, drawRest, guides, timed, AS_OF, LEDGER_AS_OF, SCHEMA, EVENTS, LEGAL, REDUCED, FORCE_DESKTOP, download, prefetchEarth, ensureLand, getHost, host, heroSim, heroStage, ...). `boot.js` also references `ORDER` only in a comment.
A shared `src/shared.js` (formatters, parse, esc, DOM helpers, data constants) would remove most of the chart-file entries. Until then the concatenation path stays active.
