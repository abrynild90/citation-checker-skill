# Overlay-side needs from the 3D scenes pass (not owned by scenes code)

- Phone (375 px): the scene stage is only about 290 px tall (banner and status caption are drawn inside it). Giving `#sceneView` more height (or letting the steps/caption collapse by default) would let debris and labels breathe.
- The stage banner (`.illus`) is two lines at 375 px; a one-line version ("Illustrative · compressed radial scale") would free about 18 px of stage.
- The hero stage on phone sits below the ledger panel; the scenes code frames it for any aspect (distance follows aspect), so only its position/height is a page matter.
- Static SVG diagrams size themselves from `#sceneView` clientWidth/Height at open time; if the overlay layout changes after open, re-calling `renderSVG(sim, view)` on resize would keep them exact (no ResizeObserver exists for the static path).

## Round 9 (scenes pass B) additions

- DONE (hero stage is now 400px on phones): hero stage on phone (`.hero .stage{height:340px}`): the canvas is nearly square at 375 px, so Earth and the three shells share about 340 px. About 400 px would let the shell labels and the Earth breathe (the scenes code already frames by aspect).
- Static diagrams now embed a Blue Marble raster when the imagery has loaded (reduced motion or no WebGL); `svg.dataset.earth` is `bluemarble` or `vector`. DONE: `svgToPNG()` in scene-ui.js now prints (it used to print the Natural Earth line unconditionally) 'Earth imagery: NASA Blue Marble (public domain).' when `svg.dataset.earth === 'bluemarble'` (as GLHost.stillPNG does).
- Static SVG diagrams expose `svg.__lay` (label boxes, leaders, sprite/ring/particle obstacles) for QA; no page action needed.
- The overlay's `.illus` banner and the status caption are reserved areas in the label layout, read from the DOM; if their size changes, no scenes change is needed.
