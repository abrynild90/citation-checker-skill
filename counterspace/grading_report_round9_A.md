# Round 9 grading, reviewer A (2D page slice)

Method: Playwright/Chromium (swiftshader, machine heavily loaded by parallel reviewers). Full-resolution captures opened with Read: all sections at 1440 dark; 1440 light (legal, A, C; B/lag/hdr shots taken but only partly viewed); 900 dark (legal, A, B, C); 375 dark (top, legal, A, C, B). Also: sticky band over Chart C, Chart B kinetic mode, Chart C zoom, keyboard Tab/Arrow/Enter/Esc, all 5 exports in light and dark (rasterized; viewed A-light, C-dark, B-dark, legal-light). axe-core 4.10.2: 0 violations (1440 dark). Not done: 375 light (run did not finish under load), 900 light, lag/sources at 900/375, mobile tap cards, dark-export view of L, hover card next to axis (my hover missed a mark).

| Portion | Score |
|---|---|
| Header/intro | 94 |
| Legal band | 93 |
| Chart A | 92 |
| Chart C | 93 |
| Chart B | 92 |
| Lag panel | 94 |
| Sources & methodology | 94 |
| Mobile (375) | 92 |
| Light mode | 93 |
| SVG exports | 92 |
| User experience | 92 |
| Accessibility | 94 |
| Performance | 92 |

## Round 8 defects: status
Fixed: Chart A gap annotation no longer collides with the peak callout at 900 (now a bracketed note); Export SVG button at 900 sits inside the column; Chart C default is now Full span on the shared scale, Zoom is labelled "ZOOMED" and states it no longer aligns; #svgC has one child after toggling (no duplicate render); Chart C at 375 reflowed with wrapped labels, no lane-header crossings; Chart B kinetic mode now has a two-swatch key and chips are disabled with an explanatory line; legal Export button no longer over the plot at 375; A/B/C exports now carry a colour key and exist in light and dark.
Not fixed: hover card still covers neighbouring marks/axis (not verified this round); Chart A crowding 2013-2023 at 375 persists (acceptable).

## Defects (below 93)
- **Chart A 92.** (1) At 900 px the legend caption "Debris bubble area = ... never on" is clipped at the right edge (A-900d.png). (2) At 375 the "Peak intercept: FY-1C" label sits on the LEO band near markers and the 2013-2023 marks crowd (A-375d.png). Improvement: wrap the bubble legend at <=900.
- **Chart B 92.** At 900 the legend shows Solid/Hatched/Dotted but the "Faded, dashed edge" and range-whisker rows are absent (B-900d.png), though present at 1440 and 375; the reconstruction disclosure at that width rests on the banner only. Export B caption explains solid and hatched but not dotted (expimg-B-d.png). Improvement: add dotted and faded to the export caption; check the 900 legend.
- **Mobile 92.** Phone legal band uses a cropped window (about 2003-2026; legal-375d.png) with stemmed labels, so it is not on the shared scale (reasonable but should be flagged on the band). Chart A crowding above. 375 light not verified.
- **SVG exports 92.** Exports include title, as-of, source, key and caption in both themes. Gaps: dotted fill unexplained (B); cube "3D scene" glyphs remain in A/C/legal exports with no key and no meaning in a static figure; Chart B kinetic mode has no export path check.
- **Legal band 93 / Light 93.** Fine; the sticky band shows glyphs without labels (unchanged). The yellow zoom-window stem crosses the "OEWG, 2022-23" label (kbEsc.png).
- **User experience 92.** Keyboard: Tab order sane; Esc dismisses the card; Enter on a focused non-scene mark opened nothing (expected). A stale card (Woomera) persisted while focus ring was on OST after Arrow key (kbEnter.png), so hover/focus card state can disagree. Sticky band works over A/C/B.
- **Performance 92.** perf(): first-draw 52 ms, first-draw-done 513 ms, per-chart draws 9-21 ms, no console errors. Three.js/JPG loading was not re-measured this round; round 8 recommendation (defer until near viewport) not verified.
- **Chart C 93, Header 94, Lag 94, Sources 94, Accessibility 94:** no concrete defect found in what I inspected. Chart C zoom is explicitly flagged as required.

Best single improvement: fix the 900 px legend defects (Chart A caption clip, Chart B missing rows) and add dotted-fill to the B export caption.
