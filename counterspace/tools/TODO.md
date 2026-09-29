# Open items for the overlay and docs owners (scene code in src/scenes/ is done; these need edits outside it)

The scene captions and sourcing items that used to be listed here (Starfish wording, F-15 "over the Pacific", GPS altitude, FY-1C "largest") are applied in `src/scenes/config.js`.
Details: the Starfish caption now quotes SWF p. 12-05; the F-15 line says "supersonic zoom climb" (SWF text, no Pacific); the GPS altitude claim is gone (SWF has no
figure and gps.gov could not be fetched from the build sandbox, so the caption says "medium Earth orbit" and no number); FY-1C says "most cataloged fragments of any test in SWF's Table 5-1".

## methodology.md (section 7, testing) and section 6 (3D scene rules)
1. **Testing, add one line:** `tools/scene_check.mjs` (Playwright) runs the scene collision and framing checks over all 13 scenes x every camera preset x t in {0.2..0.9} x
   {1440, 900, 375} px (live), the static SVG diagrams at the same widths, and the live and static PNG stills. Hard failures: label boxes overlapping each other, the banner,
   the status caption, the context inset or a drawn sprite; a label within 8 px of the frame edge; a label on the Earth disc when a clear slot exists within reach (0.10 x width, leader within the limit, no overlap or crossing); a leader longer
   than 0.22 x width (0.30 x at 375); a leader that ends on empty space or on another referent; a labelled craft drawn under 6 px on the default camera; an action region (craft,
   trails, debris, target path) under 20% of the frame on the default camera (each side of the region counts at least 40% of the frame, so a long thin trail is not penalised for being thin); a labelled craft off frame or behind the Earth on a preset;
   the banner wrapping at 375. Run `NODE_PATH=tools/node_modules OUT=<dir> PORT=9122 node tools/scene_check.mjs` (`ONLY=`, `VPS=`, `TS=`, `MODES=live,static,still`, `SHOT=1`).
2. **Scene rules, describe the new camera and layout behaviour:** hit scenes open on a "Follow the action" dolly camera that is fitted to the launch site, target and debris at key
   times and glides between them; co-orbital scenes use tight follow cameras plus a small "context inset" (a top-down schematic of the Earth, the orbit lines and one dot per craft)
   so the Earth and the GEO belt stay in view; trails are thin curved fading paths (crafts carry curved `arcs`); the static RPO diagram is three labelled panels (one per episode)
   and its live PNG still is a three-tile composite; on a phone the static diagram fits the Earth first and lets orbit lines run off the frame.

## Overlay (src/template.html, src/scene-ui.js)
3. `.illus` has `max-width:70%` in CSS, which wraps the banner on narrow views. `src/scenes` now forces one line inline (`fitBanner`); the CSS could simply use `max-width:calc(100% - 20px);white-space:nowrap`.
4. From round 10 B1 (not scene code): at 375 the source line is cut behind the "Scroll for more" bar, the Export button sits alone on its row, the disabled "No specific legal item" bar takes a full row, and Esc returns focus to BODY when the scene was opened without an origin element.
