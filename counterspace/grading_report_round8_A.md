# Round 8 grading, reviewer A (2D page slice)

Method: Playwright/Chromium (swiftshader). Full-resolution captures of every section at 1440 dark, 1440 light, 900 dark, 375 dark, 375 light, all opened with Read. Also viewed: sticky band while scrolling (Chart A/B/C), Chart C Full span, Chart B Kinetic-vs-non-kinetic and a chip filter, Chart A hover card, keyboard Tab flow, Chart A data table. All 5 SVG exports (window.__cs.exportSVG) rendered and viewed. axe-core 4.10.2 run. Screenshots in scratchpad/g8A/. Not done: Enter/Esc/arrow-key behaviour and tap cards on mobile were not exercised; Chart B and lag at 900/375 light not separately opened.

| Portion | Score |
|---|---|
| Header/intro | 94 |
| Legal band | 93 |
| Chart A | 92 |
| Chart C | 90 |
| Chart B | 91 |
| Lag panel | 94 |
| Sources & methodology | 94 |
| Mobile (375) | 91 |
| Light mode | 93 |
| SVG exports | 90 |
| User experience | 92 |
| Accessibility | 94 |
| Performance | 92 |

## Notes and defects (below 93)

**Legal band 93.** Unpinned it is excellent (numbered 2021-26 marks, zoom inset, abbreviations). Pinned it shrinks to bare glyphs with no labels, so labels are only reachable by hover/scroll back. Best improvement: none required.

**Chart A 92.** Data, annotations and gap note are clear. Defects: (1) at 900 px the "Only the US ASM-135 program..." line touches "Peak intercept is still Fengyun-1C" (chartA-900d.png, #svgA annotation text); (2) at 900 px the Export SVG button sits flush against/overhangs the right edge (chartA-900d.png); (3) hover card (hoverA.png) covers the x-axis and neighbouring points. Best improvement: collision-check the gap annotation against the peak callout at 700-1000 px.

**Chart C 90.** (1) Default "Focus 1995-2026" uses a different time domain from the pinned legal band and Charts A/B: pinned screenshot (sticky-C.png) shows 1995 at x=210 under the band's 1995 at ~x=780. Disclosed in the note, but it works against the one-shared-scale brief. (2) In Full span, my element screenshot (C-full.png) shows two stacked chart bodies (old focus render plus new). I could not confirm whether this is a transient transition artefact or a real duplicated SVG; please verify #svgC child count after toggling. (3) In Full span the inline SWF callout in the EW lane sits close to labels. (4) At 375 the labels and the "last destructive test" guide line cross the lane headers/text (chartC-375d.png). Best improvement: make Full span the default, or draw the focus view as an explicit zoom of the shared scale; verify the double render.

**Chart B 91.** (1) In Kinetic-vs-non-kinetic mode (B-kin.png) the stack colours (orange/blue) are not keyed: legend shows only fill styles and the chips still show the five category colours, so a reader cannot tell which colour is kinetic. (2) Pre-2020 decades remain a disclosed reconstruction (banner, legend, note), acceptable. (3) The note above the chart is long (five lines) before the chart appears. Best improvement: add a two-swatch key in kinetic mode.

**Mobile 91.** No horizontal scroll at any width (hscroll 0). Chart A at 375 has crowded markers 2013-2023 and truncated "ALT. N/R"; Chart C is very tall (about 1,800 px) with labels crossing the guide line; the legal phone view places the Export SVG button over the top label area (legal-375d.png). Best improvement: separate the phone legal Export button from the plot.

**Light mode 93 (no defect beyond dark equivalents).** Tokens carry, contrast good.

**SVG exports 90.** All five render standalone with title, as-of, source and caption; legal and lag are complete. Defects: Chart A, B and C exports (expimg-A/B/C.png) omit the colour key (country colours, capability-category colours, actor colours are never explained in the footer caption), so a detached figure cannot be decoded. Exports are dark-theme only. Best improvement: append a colour legend row to the A/B/C exports.

**User experience 92.** Sticky band, jump cards, toggles, chips and tables all work; chip filter recomputes ranges correctly. Tables are open-on-demand and narrow (dates wrap at 1440). Focus ring is 3 px solid and visible.

**Accessibility 94.** axe-core: 0 violations at 1440 dark. Keyboard order is logical, focus visible. Residual: canvas scenes only have step lists (outside my slice).

**Performance 92.** HTML 346 KB (102 KB gzipped); d3 280 KB; three.js 1.27 MB and Blue Marble JPG 1.46 MB load right after first render (about 3.4 MB total, before axe). window.__cs.perf(): first-draw 43 ms, first-draw-done 483 ms, per-chart draws 7-21 ms; 1 WebGL context; no console errors. Best improvement: defer three.js and the JPG until the scene tour or hero is near the viewport.

No factual errors found in the 2D page slice; the lede quote and counts (44/5/15/19, Nov 2021) are consistent across header, charts and tables.
