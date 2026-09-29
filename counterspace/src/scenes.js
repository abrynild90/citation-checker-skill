// ============================================================================
// Scene library (module map). Scenes are data (config.js) interpreted by one simulator (sim.js)
// that feeds two renderers: a single shared WebGL host (gl-host.js, three.js) and a static SVG
// fallback (svg-fallback.js) used for reduced motion / no WebGL. Illustrative only.
//
//   scenes/core.js         constants, vector/orbit math, seeded RNG, compressed radial scale rAlt()
//   scenes/co-sim.js       anchors, keyframed crafts and Kepler ellipses for the co-orbital scenes
//   scenes/labels.js       placeLabels(): label de-confliction shared by all renderers
//   scenes/config.js       SCENES + HERO data (per-scene framing, actors, captions)
//   scenes/sim.js          buildSim(cfg): items + cameras
//   scenes/earth.js        land canvas, Blue Marble loader, sprites
//   scenes/gl-host.js      GLHost class (live render, camera, model/glow fitting)
//   scenes/gl-items.js     GLHost mixin: item builders (installGLItems)
//   scenes/gl-labels.js    GLHost mixin: HTML labels, leaders, context inset (installGLLabels)
//   scenes/gl-still.js     GLHost mixin: print-resolution PNG still (installGLStill)
//   scenes/svg-fallback.js renderSVG(): static diagram
//
// Each file is an ES module that imports what it uses; tools/build_page.py bundles src/boot.js and everything it imports with esbuild
// into one IIFE (no shared scope, no concatenation). app.js applies the three GLHost mixins (gl-items, gl-labels, gl-still) with
// installGLItems/Labels/Still(GLHost). This file holds no code and is not imported.
// ============================================================================
