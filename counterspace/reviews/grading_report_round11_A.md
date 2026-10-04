# Round 11 grading, reviewer A (2D page slice, incl. RPO strip)

Method: Playwright/Chromium. Full-res captures of glance, legal, A, C, RPO, B, lag, sources at 1440/900/375, dark and light (all captured; about 18 opened with Read, the rest spot-checked by hscroll = 0 and error-free console). Hover cards (A, RPO), tap card at 375 (RPO), keyboard (Tab order, arrows, Enter on a mark without a scene, Esc), toggles (RPO zoom, C zoom, B kinetic), sticky band, tap-card close on scroll, all 6 exports light and dark rasterised (viewed R-light, A-dark, C-light, legal-dark), axe-core 4.10.2 dark, perf().

| Portion | Score |
|---|---|
| Header/intro | 94 |
| Legal band | 94 |
| Chart A | 93 |
| Chart C | 93 |
| Chart B | 95 |
| RPO strip | 93 |
| Lag panel | 95 |
| Sources & methodology | 91 |
| Mobile (375) | 92 |
| Light mode | 94 |
| SVG exports | 94 |
| User experience | 92 |
| Accessibility | 94 |
| Performance | 94 |

## Round 10 defects: status
- RPO 375 zoom note truncated: FIXED (wraps fully; phone now defaults to Zoom 2000-2026 with a ZOOMED badge).
- RPO phone default nearly unreadable: FIXED (default Zoom).
- "Vertical position is packing only": FIXED (legend note, also in export caption).
- RPO export shape key: FIXED (Shape/Outline/Actor key row).
- "Scope rule: Scope rule:" duplication: FIXED. Source 2 URL block now compact.
- Tap card persists on scroll: FIXED (opacity 0 after scroll). Enter on scene-less mark: card shows, overlay stays closed (acceptable).
- Nested svg aria-labelledby, A export size key: A export now has bubble key. FIXED.
- Before-interaction bytes: 708 KB uncompressed measured (index.html 429 KB + d3 280 KB; no three.js, no Earth JPG). FIXED (hero static-first).

## Defects (below 93)
- Sources & methodology 91. Coding rules is still a wall of text at every width: Scope-rule bullet about 130 words, Co-orbital strip is a three-level nested list (bullet, circle, square) that at 375 is a 2000+ px narrow column. Chart B bullet about 130 words. Improvement: move Coding rules into per-chart collapsible details or a table (rule, chart, source table).
- Mobile 92. (1) Tap card on the RPO strip at 375 is taller than the docked area: text cut off at the bottom ("...Approx. 670 km, 98") with no scroll cue and it covers the legend. (2) Chart C default at 375 (full span) still puts Starlink label across the last-destructive dotted rule and all marks in the last 40 px; no phone-default zoom as on A and RPO. (3) RPO marks touch the plot's right edge at 375 (China square clipped).
- User experience 92. Hover card on Chart A sits over the "Starfish Prime" annotation and the BELOW 100 KM band label (covers annotation text, not marks); RPO hover card at 1440 covers about 40 percent of the plot to the left of the mark it describes (Cosmos 2581 card spans lanes and hides the neighbouring rows). Sticky band covers the top of the section heading when jumping by scroll.
- Performance 94, Accessibility 94: axe 0 violations dark; 197 color-contrast "incomplete" need manual review. Slowest first-draw pieces: draw-svgL 98 ms, methodBody 83 ms (perf marks; first-draw-done 803 ms under software GL).
- Chart A 93, C 93, RPO 93: nits only. A: 375 crowding remains in full-span (a zoom toggle exists). C: 375 full span dense. RPO zoomed 1440: cube glyphs overlap neighbouring marks (US row, 2024-25 cluster).

## Best single improvement
Restructure Sources & methodology "Coding rules" into short, per-chart collapsibles (or a table), and cap the tap-card height at 375 with internal scroll.
