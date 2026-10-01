# Scene library (module map)

Scenes are data (`config.js`, one module per scene in `configs/`) interpreted by one simulator (`sim.js`) that feeds two renderers: a single shared
WebGL host (`gl-host.js`, three.js) and a static SVG fallback (`svg-fallback.js`, with its parts in `svg/`) used for reduced motion / no WebGL.
Illustrative only.

## Shared

| File | Role |
|---|---|
| `core.js` | constants, vector/orbit math, seeded RNG, compressed radial scale `rAlt()` |
| `co-sim.js` | anchors, keyframed crafts and Kepler ellipses for the co-orbital scenes |
| `labels.js` | `placeLabels()`: label de-confliction shared by all renderers |
| `earth.js` | land canvas, Blue Marble loader, sprites |
| `still-config.js` | per-scene PNG still settings (camera, field of view, label scale) |

## Scene data

| File | Role |
|---|---|
| `config.js` | `SCENES` (in picker order) + `HERO`; re-exports the palette `C` |
| `configs/shared.js` | palette `C` and the phone scale `PK` used by several scenes |
| `configs/<scene>.js` | one scene each: `starfish`, `solwind`, `fengyun`, `burnt-frost`, `dn2`, `shakti`, `cosmos1408`, `gnss`, `viasat`, `laser`, `sj21-tug`, `rpo`, `spaceplanes` (framing, actors, captions, static-diagram settings) |

## Simulator

| File | Role |
|---|---|
| `sim.js` | `buildSim(cfg)`: items (one builder per actor type) |
| `cameras.js` | `buildCameras()`: wide / polar / frame / follow / dolly camera presets and the still-frame camera |

## WebGL renderer

| File | Role |
|---|---|
| `gl-host.js` | `GLHost` class (live render, camera, model/glow fitting) |
| `gl-items.js` | GLHost mixin: shaders, materials and item builders (`installGLItems`) |
| `gl-models.js` | GLHost mixin: low-poly craft and site models (satellite, ISS, spaceplane, aircraft, site, pin, jammer, ship); installed by `installGLItems` |
| `gl-labels.js` | GLHost mixin: HTML labels, leaders, context inset (`installGLLabels`) |
| `gl-still.js` | GLHost mixin: print-resolution PNG still (`installGLStill`) |

## Static SVG renderer

`svg-fallback.js` exports `renderSVG()` and runs the passes in order; each pass lives in `svg/`.

| File | Role |
|---|---|
| `svg-fallback.js` | `renderSVG()`: setup, then fit, globe, shells, items, labels, status, probe |
| `svg/layout.js` | `fitFrame()`: status caption, craft base size, banner/footer reservations, globe radius and centre |
| `svg/globe.js` | which globe is drawn (disc or limb arc), gradients/filters, star field, Earth raster or vector land, sun lighting, "Earth (not to scale)" tag |
| `svg/earth-raster.js` | Blue Marble re-projection onto the orthographic disc; vector land geometry |
| `svg/craft.js` | 2D craft and site silhouettes, their measured extent and the size caps (area share, marker cap) |
| `svg/draw-state.js` | the shared working state (label candidates, obstacles, marks, debris grid), shell rings and shell labels |
| `svg/items.js` | one drawer per sim item kind (dome, curve, cloud, beam, point, flash) |
| `svg/label-layer.js` | label placement and pills, legend key, status caption, panel title / footer note, the `__lay` probe read by `tools/scene_check.mjs` |
| `svg/panels.js` | scenes with `cfg.panels` (RPO): one labelled panel per episode |
| `svg/upgrade.js` | fetch the Blue Marble once and redraw the diagram with it |

Each file is an ES module that imports what it uses; `tools/build_page.py` bundles `src/boot.js` and everything it imports with esbuild
into one IIFE (no shared scope, no concatenation). `src/app.js` applies the three GLHost mixins explicitly, in one visible line
(`[installGLItems, installGLLabels, installGLStill].forEach((install) => install(GLHost))`); the mixins only add methods, so their order is irrelevant.
