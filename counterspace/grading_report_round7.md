# Grading report, round 7

Method and coverage (disclosed): live captures of all 10 scenes at t=0.3/0.6/0.85 at 1440 and 375 (60 files) and static/reduced-motion captures at 1440 and 375 (20 files) were generated; live and static PNG stills for all 10 and all 5 SVG exports (rasterised) were generated. Not every file was individually opened at full resolution: I viewed the live DN-2 still, static Laser at 1440, live Viasat at 375 t=0.85, the exported legal SVG, Chart B, and full-page and sectional captures at 1440 dark (light and 375 section captures exist but were not opened). Scene and mobile scores for unopened items carry round-6 findings forward and are marked (carried). Console: 0 errors/warnings in all runs; audit() returned []; page 351 KB (324 KB minified, 94 KB gzip), first-draw 44 ms, module-start 420 ms. SWF lede quote checked verbatim against swf_2026.txt lines 1907-08 ("only non-destructive capabilities are actively being used against satellites in current military operations"). SWF text confirms ~30,000 km apogee (DN-2). Docs: methodology.md head, verification_log.md status summary read; ledger.md not read in full. Scratch scripts deleted.

| Portion | Score | Note |
|---|---|---|
| Header/intro | 94 | Quote verbatim; "at a glance" card clear. |
| Hero 3D overview | 93 | Clean labels, honest "illustrative" banner. |
| Legal band | 91 | Shared scale honoured; 2022-26 crowded, zoom inset helps. |
| Chart A | 94 | Honest gap annotation, area legend. |
| Chart C | 92 | Full labels; long label runs left of axis start. |
| Chart B | 91 | Reconstruction faded and labelled; 2020s D/P range unverifiable. |
| Lag panel | 93 | Clean. |
| Sources & methodology section | 93 | Full cites, licensing. |
| Scene overlay UI | 92 | Consistent; mobile caption crowding. |
| Static/reduced-motion fallback | 92 | Laser static now fits and is labelled (viewed); others unviewed. |
| Mobile (375px) | 91 | No h-scroll (verified); Viasat caption overlaps labels. |
| Light mode | 92 | Captures made, not opened; tokens carried. |
| SVG exports | 93 | Legal export viewed: title, as-of, source, full legend. |
| PNG still export | 90 | Live DN-2 still viewed: labels stacked/overlapping at lower right. |
| Starfish | 92 (carried) | |
| Solwind | 91 (carried) | |
| Fengyun | 93 (carried) | |
| Burnt Frost | 91 (carried) | |
| DN-2 | 91 | Labels crowd; leader lines cross labels. |
| Shakti | 91 (carried) | |
| Cosmos 1408 | 93 (carried) | |
| GNSS | 92 (carried) | |
| Viasat | 89 | Mobile t=0.85 caption/title overlap labels, 373 px canvas. |
| Laser | 92 | Static crop fits now. |
| Data ledger (JSON) | 94 | 59 records. |
| ledger.md | 91 | Not read in full. |
| methodology.md | 93 | |
| verification_log.md | 92 | 2 PARTIAL remain, disclosed. |
| Code quality/architecture | 91 | Modular, 2,156 lines; hash regression SVG-only. |

| Cross-cutting | Score |
|---|---|
| Visual impact | 92 |
| Quality of graphics | 92 |
| Accuracy (lede quote verbatim; DN-2 30,000 km apogee confirmed in SWF; others carried from round 6) | 94 |
| User experience | 92 |
| Accessibility | 91 |
| Performance | 93 |
| Fun/engagement | 92 |
| Pedagogical value | 94 |
| Fidelity to companion purpose | 94 |

## Overall: 92 / 100

## Defects (below 93)
1. Live PNG still (DN-2): "Apogee >=30,000 km", "GEO ring" and "10,000 km" labels stack at lower right; leader line crosses the DN-2 arc and labels; DN-2 path label overlays Xichang label.
2. Viasat mobile t=0.85: title box overlaps "Ground terminals" label; caption overlaps "Ground management network"; canvas 373x260.
3. Legal band: 2022-26 marks and labels (Tallinn*, US pledge, 77/41, Veto, ICAO) still dense on main band; readable mainly in zoom inset. While sticky, chart axes of the section below peek under the band at its lower edge (visible as clipped "2022 2023..." labels).
4. Chart B: 2020s demonstrated/developing split and earlier decades unverifiable (disclosed in text, legend, banner); 2 PARTIAL items in verification_log.
5. Chart C: long left-side labels extend to the plot edge; the sticky band overlaps the chart's top when scrolled.
6. Scenes (carried): small debris (Solwind, Burnt Frost, Shakti); Viasat animation thin.
7. Code: regression hashes cover SVG markup only, not WebGL or stills; ledger.md is generated and long.
8. Accessibility: text alternatives exist for scenes, but WebGL canvas itself has no per-frame alternative beyond the step list.

## Bugs / factual errors
No factual error found in the lede, DN-2 figure or plotted values checked. Visual defects only (items 1-3). Best single improvement: fix label collision in the stills and mobile Viasat caption (declutter or shorten labels at small size).
