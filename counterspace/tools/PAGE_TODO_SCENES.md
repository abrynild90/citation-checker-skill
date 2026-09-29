# Overlay-side needs from the 3D scenes pass (not owned by scenes code)

- Phone (375 px): the scene stage is only about 290 px tall (banner and status caption are drawn inside it). Giving `#sceneView` more height (or letting the steps/caption collapse by default) would let debris and labels breathe.
- The stage banner (`.illus`) is two lines at 375 px; a one-line version ("Illustrative · compressed radial scale") would free about 18 px of stage.
- The hero stage on phone sits below the ledger panel; the scenes code frames it for any aspect (distance follows aspect), so only its position/height is a page matter.
- Static SVG diagrams size themselves from `#sceneView` clientWidth/Height at open time; if the overlay layout changes after open, re-calling `renderSVG(sim, view)` on resize would keep them exact (no ResizeObserver exists for the static path).
