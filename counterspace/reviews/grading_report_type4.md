# Type-4 grade: Typography, Hero globe, Legal band
Method: Playwright/SwiftShader, axe 4.10.2, computed styles on every button/input/chip, about 12 images read. Scripts deleted, server stopped by PID.
Page errors (pageerror + console error, 12 contexts incl. live Rotate): **0**. axe 4.10.2 at 1440 dark: **0 violations**.

| Item | Was | Now |
|---|---|---|
| Typography | 92 | 94 |
| Hero globe | 93 | 94 |
| Legal band | 93 | 93 |

## Evidence
- Typography 94: all 29 button/input elements plus the 5 `button.chip` compute IBM Plex Sans (stack: Plex, system-ui, ... Arial), at 1440 and 375, dark and light. 0 elements fall outside Newsreader/Plex. The Arial defect is fixed. Chips (12.5px) look right in both widths. Hierarchy is clear: Newsreader h1 and h2 and the lede, Plex for UI, tables and captions. Only SVG axis groups report generic sans-serif, which is inherited and renders as Plex. Minor: the smallest text is 10 px at 1440 and 9.5 px at 375 (chart micro-labels, 51 text elements under 11 px at 1440). The muted small captions are a bit faint on dark.
- Hero 94: static and live (after Rotate, which hides the button) at 900x900, 900x700, 1024x768, 1440x900 and 375: 0 label-vs-button overlaps and 0 label-label overlaps. At 900 the GEO label sits at about y 190 and the button at 45-75, so there is about 110 px between them. The GEO label is clear at 1024 and 1440. The globe is large and uncropped at every static size. Live 900 shows the shells, labels and the "Drag to rotate" hint cleanly. The orange GEO halo is clipped at the stage sides in live mode (a natural crop). The collision is fixed.
- Legal band 93: measured 52 text items at 1440 and 28 at 375: 0 bounding-box overlaps. Tick labels are 11 px (some at 10.5 px at 1440, 12 px headers). The 1440 screenshot is clean. At 375 the dense 2022-26 cluster (77/41, Veto, ICAO '25, RRB '24/'25) is staggered with leaders and legible, though tight. The scroll hint is small.

## Fixes for anything under 93
None under 93. Polish toward 95:
- Raise the smallest sizes (10 px and 9.5 px chart micro-labels) to 11 px, and lighten `--faint` on dark.
- Give the 375 legal cluster a bit more vertical stagger between the labels.
