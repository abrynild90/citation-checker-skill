# Round 13 grading, reviewer A (2D slice)
Method: Playwright, 8 sections x 1440/900/375 x dark/light captured (hscroll 0, 0 console errors, audit() 0 findings in all 6); viewed 375 dark A/R/legal, 375 light C, 1440 dark A, 1440 light legal, RPO hover (1440) and tap (375). Exports: all 6 generate dark+light (title, fonts, source line present). axe 4.10.2: 0 violations both themes; 168 color-contrast incomplete (was 202). perf: first-draw 63.6 ms, module-start 457 ms, first-draw-done 525 ms (was 805). Not viewed: 900 captures, most light 375, exported SVG files.

| Portion | Score |
|---|---|
| Header | 94 |
| Legal band | 93 |
| Chart A | 94 |
| Chart C | 94 |
| Chart B | 95 |
| RPO strip | 94 |
| Lag panel | 95 |
| Sources | 94 |
| Mobile (375) | 93 |
| Light mode | 94 |
| SVG exports | 94 |
| UX | 94 |
| Accessibility | 94 |
| Performance | 95 |

## Round 12 defects
- Chart A zoom note on rule: FIXED (note above plot at 375; no strike-through). LEO label still close to FY-1C bubble, not overlapping.
- RPO desktop hover card: FIXED (260x155 px vs 340x351+; rows stay visible).
- Sticky band: FIXED (82 px vs 146).
- RPO tap card cue: FIXED (separate footer bar, no overprint; 366 px card in 800 px viewport).
- Enter on scene-less mark: FIXED (card says "Details shown - no 3D scene for this item").
- Touch targets: mostly fixed (min hit 24.0 px, none below; all 97 under 44 px).
- RPO 2025-26 right edge at 375: still open (marks and stacked cube badges in last few px).
- Legal band 375 staggered labels: unchanged, readable.
- Contrast incomplete: 202 -> 168, not eliminated.

## To raise further
- Legal 93: consistent label baseline at 375 or numbered keys as at 1440.
- Mobile 93: right padding in RPO plot; padded invisible hit circles toward 44 px.
- Accessibility 94: opaque backing/verified contrast for the 168 SVG text items.
- Chart A phone zoom: nudge/drop LEO label near FY-1C.

## Best single improvement
Pad the RPO plot's right edge and enlarge touch targets at 375.
