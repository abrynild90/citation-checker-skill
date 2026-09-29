# Round 10 grading, reviewer A (2D page slice, incl. RPO strip)

Method: Playwright/Chromium. Full-res captures opened with Read: sections at 1440/900/375 in dark and light (glance, legal, A, C, RPO, B, lag, sources; not every image of every combination was opened). Hover cards (A near axis and in a cluster; RPO edge and mid), tap cards at 375 (A, RPO), keyboard (Tab/Arrow/Enter/Esc on RPO), toggles (RPO zoom desktop and phone, C zoom, A phone zoom, B kinetic), data table R, sticky band, all 6 exports light and dark rasterised (viewed A-light, R both, B both, L-dark, legal-light, C-dark). axe-core 4.10.2 on 1440 dark and light, details open.

| Portion | Score |
|---|---|
| Header/intro | 94 |
| Legal band | 93 |
| Chart A | 93 |
| Chart C | 93 |
| Chart B | 94 |
| RPO strip (new) | 91 |
| Lag panel | 94 |
| Sources & methodology | 92 |
| Mobile (375) | 91 |
| Light mode | 94 |
| SVG exports | 93 |
| User experience | 92 |
| Accessibility | 94 |
| Performance | 91 |

## Round 9 defects: status
- Chart B legend at 900 missing rows: FIXED.
- B export caption missing dotted: FIXED.
- Cube glyphs in A/C/legal exports: FIXED.
- Phone legal band cropped without flag: FIXED (caption "Scrollable strip, full 1957-2026, showing 2004-2026").
- Chart A 900 legend caption: DOM shows no overflow and text wraps; it only has zero right padding at 900.
- Chart A 375 crowding: persists, but a labelled "Zoom 2004-2026" phone toggle now exists.
- Hover card vs neighbours/axis: verified acceptable (covers annotation text, not marks).
- Stale card vs focus: not reproduced.

## Defects (below 93)
- RPO strip 91. (1) At 375 the zoom note "ZOOMED: axis 2000-2026, not the shared 1957-202" is truncated at the right edge. (2) Full span is about 75 percent empty; at 375 all marks jam into the last ~40 px and the 24 China rows form one staircase, so the default phone view is nearly unreadable until Zoom is pressed. (3) Vertical position within a lane is greedy packing, not data, and nothing says so. (4) Cube glyphs and end arrows sit against the plot's right edge at 900/375. (5) Hover card sits 300+ px from the mark (China spaceplane edge mark) and covers the lane intro. (6) Export R has an Actor key but the shape key exists only as caption prose. Improvement: default phone to Zoom, fix the note wrap, add a "vertical order is packing only" note.
- Sources & methodology 92. Very long Coding rules list; the Co-orbital bullet is a ~200-word paragraph. Bullet reads "Scope rule: Scope rule:". Source 2 is a long raw URL block that wraps badly at 375 (6500 px column).
- Mobile 91. RPO full span (above); C at 375 has labels crossing the last-destructive dotted rule; A default view still crowded. Tap card persists after scrolling and covers content until tapped. No horizontal scroll at 375.
- User experience 92. Enter on a mark with no 3D scene is silent; tap card persists on scroll; RPO hover card distance. Keyboard order, roving tabindex, Esc, focus ring good.
- Performance 91. Before interaction: index.html 474 KB, d3 92 KB, three.module.js 255 KB, Earth JPG 1.46 MB (about 2.3 MB; hero is above the fold, so not lazy). perf(): first-draw 58 ms, first-draw-done 543 ms, chart draws 7-19 ms, 1 WebGL context, no console errors. Improvement: lower-res Earth texture first or skip on phones.
- Legal 93, A 93, C 93: nits only (A caption zero padding at 900; sticky band labels PPWT II / MILAMOS* touching at 900).
- SVG exports 93. Nits: A export has no bubble-size scale key; C export "Iran: Telstar 12" label brushes the dashed bar; nested svg aria-labelledby="hA" points to a missing id.
- Header, B, Lag, Light, Accessibility 94: axe 0 violations dark and light (196 color-contrast "incomplete" checks need manual review).

Best single improvement: make the RPO strip usable on phones (default to Zoom, fix the truncated note, explain packing), then trim the Sources co-orbital paragraph.
