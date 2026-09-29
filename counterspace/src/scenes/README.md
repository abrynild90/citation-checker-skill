# Scene library (module map)

Scenes are data (`config.js`) interpreted by one simulator (`sim.js`) that feeds two renderers: a single shared WebGL host
(`gl-host.js`, three.js) and a static SVG fallback (`svg-fallback.js`) used for reduced motion / no WebGL. Illustrative only.

| File | Role |
|---|---|
| `core.js` | constants, vector/orbit math, seeded RNG, compressed radial scale `rAlt()` |
| `co-sim.js` | anchors, keyframed crafts and Kepler ellipses for the co-orbital scenes |
| `labels.js` | `placeLabels()`: label de-confliction shared by all renderers |
| `config.js` | `SCENES` + `HERO` data (per-scene framing, actors, captions) |
| `sim.js` | `buildSim(cfg)`: items + cameras |
| `earth.js` | land canvas, Blue Marble loader, sprites |
| `gl-host.js` | `GLHost` class (live render, camera, model/glow fitting) |
| `gl-items.js` | GLHost mixin: item builders (`installGLItems`) |
| `gl-labels.js` | GLHost mixin: HTML labels, leaders, context inset (`installGLLabels`) |
| `gl-still.js` | GLHost mixin: print-resolution PNG still (`installGLStill`) |
| `svg-fallback.js` | `renderSVG()`: static diagram |

Each file is an ES module that imports what it uses; `tools/build_page.py` bundles `src/boot.js` and everything it imports with esbuild
into one IIFE (no shared scope, no concatenation). `src/app.js` applies the three GLHost mixins explicitly, in one visible line
(`[installGLItems, installGLLabels, installGLStill].forEach((install) => install(GLHost))`); the mixins only add methods, so their order is irrelevant.
