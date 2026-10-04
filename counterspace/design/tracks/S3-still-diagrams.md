# Track S3: still diagrams, the first picture of the Earth, and saved images

Read `design/DESIGN.md` first, all of it, especially sections 3 and 7. Read `src/scenes/README.md` and the files you own before changing anything. This brief adds what is specific to you.

## What you own

- `src/scenes/svg/*` (layout, globe, earth-raster, craft, draw-state, items, label-layer, panels, upgrade) and `src/scenes/svg-fallback.js`: the still diagrams drawn without 3D (when animation is switched
  off, when 3D is unavailable, and for the very first picture of the Earth in the page hero before any 3D library loads).
- `src/scenes/gl-still.js` and `src/scenes/still-config.js`: the saved image ("Save image", exported at exactly 3000 x 1875 pixels; `tools/scene_check.mjs` mode `stillapi` checks the size).
- Do not edit the live 3D renderer (`gl-host.js`, `gl-items.js`, `gl-models.js`, `gl-labels.js`, `earth.js`, `core.js`, `sim*.js`, `cameras.js`: track S2), the viewer window (`scene-ui.js`, `overlay.html`, `scenes.css`: track S1), the page
  shell (track P) or scene text in `src/scenes/configs/*` (a later copy pass; you may change `static`-diagram settings inside a config if a visual defect needs it, and say so in the report). If you need something from S2's
  files, write the request in your report. `earth.js` exports `earthLow`, `earthNightLow`, `loadEmbeddedEarth()`, `earthSource()` (read them; do not edit).

## The job

Make the still pictures beautiful enough to stand alone, and make the very first picture of the page (the hero Earth) a showpiece.

1. **Photographic Earth in the diagrams.** `svg/earth-raster.js` re-projects an equirectangular image onto an orthographic disc. Make it use `earthSource()` so the diagram has a photographic Earth immediately
   (the embedded day image, 1280 x 640, and night image, 1024 x 512, are in the page already), and keep the existing upgrade to the full image when it arrives (`svg/upgrade.js`), without a visible jump.
   Blend the day and night images by the sun direction with a soft terminator (city lights on the night side), add a thin atmosphere ring (a gradient stroke, brighter on the lit limb) and a very soft outer glow. The sun direction
   must match the live 3D scenes (track S2 fixes it in one constant in the scene code; for now use a direction from the upper left and slightly toward the viewer, and make it one named constant so it is easy to align).
2. **Hero first picture.** The page hero shows the Earth drawn by `svg/globe.js` before anything else loads. It sits on a dark starry background in the right part of a full-bleed hero (track P sets the stage size; it can be any
   shape from 0.8 to 1.6 wide over high). Make it gorgeous: photographic day and night Earth, atmosphere, three thin orbit shells (low, medium and geostationary Earth orbit) as soft luminous ellipses with the label look from
   DESIGN.md section 7, a handful of small bright satellites on those shells, a fine star field. It must look intentional at 390 px and at 1920 px wide, and be drawn within about 150 ms of the first paint on a typical laptop.
3. **Diagram polish.** All 13 scene diagrams: cleaner craft silhouettes (`svg/craft.js`), crisper sites and markers, orbit lines with soft glow, debris and beams that look intentional, and labels in exactly the label look from
   DESIGN.md section 7 (pill, dot, leader). Keep the `__lay` probe and all collision rules working: run `node tools/scene_check.mjs` with `MODES=static,hero ONLY=<ids>` and `VPS=1440,375`, then once for all scenes before you finish.
   Static text must stay at least 12 px (the checker's own floor is 9 px, ours is higher).
4. **Saved image.** `gl-still.js` and `still-config.js`: the PNG gets a finished frame: the picture, a bottom band with the scene title in Newsreader (serif, large), one line of context, the source line, and the credit
   "Counterspace timeline · companion to Space Security Law by Aaron Brynildson" with a small orbit mark, all in the page's fonts, with generous margins and the same label look. The size stays exactly 3000 x 1875. The same frame
   is used for the live and the diagram versions of the save (`window.__cs.exportStill`, `host().stillPNG(title, cite)`; read how both are called). File name: the scene title in lower case with hyphens and "counterspace" first.
5. **Words.** Apply DESIGN.md section 3 to every string you own: "Earth (not to scale)" becomes plain and short, key and caption texts avoid jargon ("radial scale", "illustrative" in every label). One calm line per diagram says
   what is drawn for illustration (DESIGN.md 3.1). Run `node tools/copy_lint.mjs` and clear the hits in your area.

## Care points
- The page must stay light: embedded images are already in the page; do not add images. Draw with canvas and SVG only.
- Projecting an image to an SVG-embedded raster takes time; keep it cheap (reuse canvases, reduce resolution to the drawn size times the device pixel ratio, cache by view).
- Never change a scene's simulation data, timing or meaning; only how it looks.
- Reduced-motion and no-3D fallbacks must remain fully functional and accessible (the figure has a text description; text in the SVG is real text).

## Ports
Use 9150 to 9159.

## Done means
Screenshots of the hero first picture at 1920, 1440, 900 and 390 px, of all 13 diagrams at 1440 and 375, and of two saved images look like a documentary graphic. `node tools/scene_check.mjs` with `MODES=static,still,stillapi,hero`
for all scenes (`VPS=1440,375`) shows no failures. `node tools/copy_lint.mjs` shows no errors in your strings. `node tools/qa.mjs` shows no page errors.
