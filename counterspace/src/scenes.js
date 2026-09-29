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
//   scenes/gl-host.js      GLHost class (live render, model/glow fitting, labels, stillPNG)
//   scenes/svg-fallback.js renderSVG(): static diagram
//
// app.js and scene-ui.js use these names from a single scope: tools/build_page.py concatenates the
// modules above (in that order) and strips import/export keywords. This file holds no code.
// ============================================================================
