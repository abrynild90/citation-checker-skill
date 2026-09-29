# Round 12 grading, reviewer A (2D page slice, incl. RPO strip)

Method: Playwright/Chromium. Full-res element captures of header, legal, A, C, RPO, B, lag, sources at 1440/900/375 x dark/light (all 48 captured; hscroll 0 and no console errors in all six configs; opened with Read: 1440 dark all 8, 375 dark RPO/C/A/legal/B/header, 375 light C/lag, 900 light A, 1440 light RPO. NOT viewed at full res: the remaining 900 dark/light and 375 light captures other than those listed, so those are scored only via hscroll/console checks). Hover (A: Starfish Prime, Fengyun-1C; RPO: dense 2024-25 mark, Cosmos 2581), 375 tap card (RPO, A), keyboard (arrows, Enter with and without scene, Esc), toggles (C, RPO, B kinetic + chips; A zoom is phone-only and viewed at 375), nav jumps (all 8 anchors; #codingRules link not exposed as a visible link), all 6 SVG exports light and dark generated (viewed R-light, A-dark, B-light, legal-light; the other 8 not viewed), axe-core 4.10.2 from jsdelivr dark and light, perf().

| Portion | Score |
|---|---|
| Header/intro | 94 |
| Legal band | 93 |
| Chart A | 92 |
| Chart C | 94 |
| Chart B | 95 |
| RPO strip | 93 |
| Lag panel | 95 |
| Sources & methodology | 94 |
| Mobile (375) | 92 |
| Light mode | 94 |
| SVG exports | 94 |
| User experience | 92 |
| Accessibility | 94 |
| Performance | 94 |

## Round 11 defects: status
- Coding rules wall of text: FIXED (per-chart collapsibles; only Scope/Chart A open by default).
- RPO tap card cut off at 375: FIXED (card overflow-y auto, 372 px visible of 413, "Scroll for more, tap to dismiss" cue). Cue slightly overprints the last text line.
- Chart C phone default: FIXED (Zoom 1995-2026 with ZOOMED badge and axis note; Starlink label no longer crosses the rule).
- RPO right-edge clipping at 375: FIXED in zoom default (China square inside plot, tight).
- Chart A hover card over "Starfish Prime" annotation: FIXED (card sits beside label, ends before text). RPO hover card still large (see UX).
- Sticky band covering headings on jump: FIXED for chart sections (headings land at y=172 below 146 px band).

## Defects (below 93)
- Chart A 92: at 375 zoom, the "ZOOMED 2004-26 - 32 earlier tests hidden" label sits on the dotted last-destructive rule and on the x-edge of the plot ("tests hidden" struck through); the "LEO" band label collides with the FY-1C bubble/cube; the "300" tick abuts the rotated y-axis title. Improvement: move the zoom note outside the plot (below axis or in the toolbar) and drop the band label when it overlaps a mark.
- Mobile 92: same Chart A collisions; RPO 375 marks in the last 2-3 px of the plot and stacked cube badges in the 2025-26 column are hard to tap individually (touch targets under 24 px); the tap-card scroll cue overprints text.
- User experience 92: RPO hover card at 1440 is 340x351-432 px and hides the neighbouring rows to its left (US 2013-2020 marks hidden while inspecting a China mark); the sticky band consumes 146 px (16 percent of a 900 px viewport) permanently; Enter on a scene-less mark shows the card only, with no announcement to confirm.
- Legal band 93 is a hold: 375 strip labels (MILAMOS*, Woomera*, RRB '24/'25) sit at different heights with leader lines through the axis; still readable.
- Accessibility 94: axe 0 violations dark and light; 202 color-contrast checks "incomplete" in each theme (SVG text on gradient/alpha fills, not verifiable). Improvement: give band labels opaque backing or verified contrast.
- Performance 94: before interaction only index.html (about 438 KB raw) plus d3.min.js (92 KB transferred, 280 KB raw); no three.js or Earth texture; perf(): first-draw 76.6 ms, module-start 723 ms, first-draw-done 805 ms (software render, not scored as fps).

## Best single improvement
Fix the Chart A phone-zoom note collision (move outside the plot) and cap the RPO desktop hover card width/offset so it does not cover the row being compared.
