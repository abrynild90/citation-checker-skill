# Track H: the first viewport as the thesis (hero timeline)

Read `design/DESIGN.md` (section 1b, the Impeccable rules, is binding), `PRODUCT.md` (root) and the Impeccable references at
`/tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/impeccable/reference/` (`craft-floor.md` first, then `animate.md`, `layout.md`, `typeset.md`).

## Why

The visitor is the general public or a journalist. Their first job: see law and weapons on one timeline within about a minute. Today the first screen is a title, a lede and a wireframe of orbit rings: the idea of the
page lives only in text. Impeccable's rule for this kind of surface: the first viewport is a thesis, not a header; demonstrate the mechanism immediately, at the scale it has in life.

## The idea

A single picture that shows the whole history at once: **what states did in orbit, rising from the Earth, and when the law spoke, resting on the ground.**

- Left to right: years 1957 to 2026 (the same year scale as the law timeline and the charts below, same domain, same tick years).
- Up from the Earth's limb: altitude on a logarithmic scale. Anti-satellite tests and other kinetic events with a reported altitude are points placed by year and altitude (the same data as the anti-satellite test
  chart). Destructive intercepts are larger and filled; tests with no destructive result are rings; the one nuclear test is a distinct mark. Orbit regions are drawn as quiet bands with plain labels at the
  left: "Low Earth orbit (up to 2,000 km)", "Medium Earth orbit (GPS)", "Geostationary orbit (35,786 km)". This replaces the three-ring wireframe and teaches the orbit regions directly from the data.
- Along the limb, on the ground: the law and policy items as short ticks at their years, with plain names for about five (for example Limited Test Ban Treaty 1963, Outer Space Treaty 1967, ITU Constitution
  Articles 45 and 48 in 1992, UN General Assembly resolution 77/41 in 2022). "Law and policy" labelled once at the left.
- The Earth: a photographic limb across the bottom of the picture (the embedded day image, `earthSource()` in `src/scenes/earth.js`, projected by the code in `src/scenes/svg/earth-raster.js`; or a simple
  curved crop of the same image), with a thin atmosphere line and stars above. It is the horizon the marks stand on. No decorative glow, halo or gradient behind the text.
- Three or four annotations written as plain sentences with a leader line and a small dot on the mark: the first tests (1959), the highest intercept (Fengyun-1C, 2007, 880 km), the last destructive test
  (Cosmos 1408, November 2021), and the first law (1963). Wording for a first-time reader; every number from the data; legal cautions intact.
- A line under the picture in plain words: "Each dot is one event in orbit. The ticks on the ground are laws and policies. Scroll for the detail." Keep it to one sentence.

## The one authored motion moment

On first load the history plays once, left to right over about five seconds: a thin time marker moves along the years; points rise from the limb at their year and altitude as it passes; law ticks appear on the
ground at their years. The sweep ends and the full picture stays. Replay by a small icon button ("Replay the history"). Under `prefers-reduced-motion`, with `?still` in the address, in print and in downloads: the final
picture appears at once, no movement. Easing: exponential ease-out (`cubic-bezier(.16,1,.3,1)`). Content is visible by default: if the script fails, the final picture (or the lede and contents list) is still there.
Use transform and opacity only. The sweep must not delay or block the title, the lede or the buttons.

## Layout

- Desktop (900 px and wider): the hero is one full-bleed picture that fills the first viewport under the top bar (about 100vh minus the bar, between 620 and 800 px tall). The title, lede and the two buttons sit in the empty
  sky at the upper left: the first decades of the space age happened low, so the upper left of a log-altitude picture is naturally empty. Keep the marks clear of the text block (the block ends about 45% down and
  50% across; choose the altitude scale so the 1960s and 1970s marks stay below it) and never put a mark under text. The contents list (seven rows, already built by track P) follows the hero, after the fold.
- Phone (390 px): the title block comes first, the picture below it as a compact version (about 380 px tall): two annotations, the same bands, the limb, the ticks; no horizontal scroll; labels at least 12 px.
- The picture is `role="img"` with a text alternative that says what it shows in two or three sentences, plus a visually hidden list of the plotted events for screen readers (or a link to the data table of the
  anti-satellite chapter). The marks are not individually focusable here (the charts below carry the keyboard and hover cards); the caption says so.
- The "Rotate the globe" live 3D hero and its button are retired from the hero. The 3D orbit overview stays available as an explainer: open it from a plain link under the title block ("See the orbit regions in 3D")
  using `window.__cs.openScene` with the hero overview scene (read `src/scenes/config.js` for `HERO` and how `scene-ui.js` starts it; if it cannot open as a normal scene, report what is needed).
- The static picture from track S3 (`src/scenes/svg/globe.js`, the stage-shaped Earth with three shells) is no longer the hero picture; keep its code working for the viewer and reuse its Earth drawing for the limb where useful.

## Rules that bind this work (Impeccable)

No kicker or eyebrow, no section numbers, no big-number hero metrics, no gradient text, no glow or halo, no glass, no cards. One edge treatment per surface. Text at least 12 px (labels), body 16 px or more,
contrast at least 4.5:1 on whatever is behind it (check over the photographic limb: put a flat dark band under the law labels). Display type at most 56 px for the title here (48 px on tablets, 36 px on phones). Motion only as above.
Wording: plain, no em dashes, no slogan contrasts, no jargon (say "anti-satellite test", not "kinetic event"; "altitude", not "apogee", unless explained).

## Files you may touch

New: `src/hero-timeline.js`, `src/styles/hero.css` (add `hero` to `STYLE_ORDER` in `tools/build_page.py` after `page`). Edit: the hero section of `src/template.html`, the hero rules in `src/styles/page.css`, the hero start-up in
`src/app.js` or `src/boot.js` (only to mount your module and retire the live-globe hero), `src/scenes/svg/earth-raster.js` read-only unless you need a helper (then add a new function, do not change existing ones).
Read `src/charts/a.js` for how the anti-satellite chart gets and filters its data and for the shared time scale; reuse its helpers rather than re-deriving.

## Checks
`node tools/smoke.mjs`; `node tools/impeccable_check.mjs` (no findings); `node tools/copy_lint.mjs` (no errors in your strings); screenshots with `tools/snap.mjs` at 1440x900, 900x1000, 390x844 in both themes (the hero is dark in both),
and a frame sequence of the sweep (script it: capture at 0 s, 1 s, 2.5 s, 5 s, 6 s); reduced-motion screenshot; `node tools/qa.mjs`. Ports 9170 to 9179.

## Done means
At 1440 x 900 a stranger sees, without scrolling and without reading more than the title and one sentence: the Earth at the bottom, a cloud of events rising into space over decades, and a row of laws and policies
on the ground, each at its own year. (Never imply a ratio or a cause: the picture shows when things happened, not how many.) They can say in one sentence what the page is about. It looks like it was made for this subject and could not belong to another product.
