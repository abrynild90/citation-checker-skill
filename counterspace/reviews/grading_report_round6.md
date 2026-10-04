# Grading report, round 6

Method: fresh live captures of all 10 scenes at t=0.3/0.6/0.85 at 1440 and 375; reduced-motion static fallback for all 10 at 1440 and 375; live stillPNG (DN-2) and static exportStill (Cosmos 1408) written to PNG and viewed; SVG exports rasterised (legal, C, L viewed; A and B not viewed as rasters); sections at 1440 dark, 1440 light, 375; methodology.md read, ledger.md and verification_log.md read at head and status tables; SWF quote and values spot-checked. Console: 0 errors/warnings in live, static and section runs; audit() returned []. audit.js (bbox overlap, clip, text-on-mark) and qa.mjs (axe-core plus SVG-markup hash regression) confirmed by reading. Regression hashes cover chart SVG markup only, not WebGL scenes or PNG stills. Scratch scripts deleted.

| Portion | Score | Note |
|---|---|---|
| Header/intro | 94 | Lede fixed: example list now outside the SWF attribution; quote verbatim vs SWF text. |
| Hero 3D overview | 93 | Clean labels. |
| Legal band | 92 | Tracks and zoom inset work; 2022-26 marks still crowd the main band. |
| Chart A | 94 | Clear, honest gap annotation, area legend. |
| Chart C | 93 | Full labels; category header touches a gridline in export. |
| Chart B | 92 | Reconstruction flagged; 2020s D/P split unverifiable (disclosed). |
| Lag panel | 94 | Clean, mobile stacks well. |
| Sources & methodology section | 93 | 22 full cites, licensing, framing claim pinned. |
| Scene overlay UI | 93 | Consistent; mobile description area clips a line mid-sentence. |
| Static/reduced-motion fallback | 91 | All 10 honest and labelled; Laser and Burnt Frost static Earth oversize, runs past panel bottom. |
| Mobile (375) | 92 | No h-scroll; Viasat caption crowds KA-SAT at t=0.85; canvases small. |
| Light mode | 93 | Tokens and contrast fine. |
| SVG exports | 93 | Title, as-of, source on all; Chart C header/gridline collision. |
| PNG still export | 91 | Live DN-2 still: leader lines cross labels, label on Earth disc, big empty margins; static still labels cramped. |
| Starfish | 93 | |
| Solwind | 91 | Faint target, small debris. |
| Fengyun | 94 | |
| Burnt Frost | 91 | Small debris; poor static crop. |
| DN-2 | 92 | Good framing; labels crowd. |
| Shakti | 92 | Small marks. |
| Cosmos 1408 | 94 | |
| GNSS | 93 | |
| Viasat | 91 | Two-line caption crowds KA-SAT; thin animation. |
| Laser | 92 | Good beam; poor static crop. |
| Data ledger (JSON) | 94 | 59 events, 19 legal, pins, confidence. |
| ledger.md | 92 | |
| methodology.md | 93 | |
| verification_log.md | 92 | Lede item closed; 9 PARTIAL remain with impact notes. |
| Code quality/architecture | 91 | Scenes split into modules (gl-host.js 31 KB); audit tests overlap; hash regression SVG-only. |

| Cross-cutting | Score |
|---|---|
| Visual impact | 93 |
| Quality of graphics | 93 |
| Accuracy (Solwind 530/285, FY-1C 880/3,532, Burnt Frost 220/240/175, Shakti 300/130, Cosmos 1,807/5, DN-2 ~30,000, Nov 2021, lede quote vs SWF text) | 94 |
| User experience | 93 |
| Accessibility | 91 |
| Performance (348 KB page, deferred Earth texture, first draw ~490 ms) | 92 |
| Fun/engagement | 93 |
| Pedagogical value | 94 |
| Fidelity to companion purpose | 94 |

## Overall: 93 / 100

## Defects for portions below 93
1. Static fallback: Laser and Burnt Frost static Earth overflows the panel bottom; caption overprints land.
2. Mobile: Viasat caption overlaps KA-SAT at t=0.85; description scroll clips a line; canvases small.
3. PNG still: live DN-2 still has leader lines crossing Apogee/DN-2 labels, "10,000 km" label on Earth disc, empty margins; static still Plesetsk/Nudol/ISS cramped.
4. Legal band: 2022-26 marks overprint on the main band.
5. Chart B: 2020s D/P split and earlier decades unverifiable (disclosed).
6. Scenes: Solwind target faint; Burnt Frost and Shakti debris small; Viasat thin.
7. Code: visual regression hashes SVG markup only; gl-host.js large.
8. ledger.md long and generated; verification_log keeps 9 PARTIAL.

## Bugs / factual errors
No factual error in a plotted value or the lede found. Only visual defects above.
