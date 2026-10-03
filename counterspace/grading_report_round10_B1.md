# Round 10 grading, reviewer B1

Images: scratchpad g10B1/ (119 files). COVERAGE CAVEAT: the Read tool dropped many batches (request limit) and I stopped re-reading. NOT viewed: hero (both widths, both stage crops), live 1440 UI shots (solwind, viasat, scrolled, tab, next, afteresc), all 375 live UI shots, all Starfish live (t and cams), all Solwind live (t, cams), Fengyun 1440 t=0.3, static stills (13), live stills for cosmos1408/sj21/viasat/gnss/spaceplanes/rpo (not in my slice). Viewed: Fengyun (all but 1440 t=0.3), Burnt Frost (all), DN-2 (all), static 1440 (13) and 375 (13), reduced-motion overlay at 1440 and 375 (solwind), live stills for starfish, solwind, laser, fengyun, burnt-frost, dn2, shakti. Scores for unseen items are provisional and capped.

| Item | Score |
|---|---|
| Hero 3D overview | not verified (provisional 90) |
| Scene overlay UI | 90 (static-mode shots only) |
| Static/reduced-motion fallback | 90 |
| PNG still export | 88 (live only; static stills not viewed) |
| Starfish | not verified live (static seen: 91) |
| Solwind | not verified live (static seen: 90) |
| Fengyun | 92 |
| Burnt Frost | 89 |
| DN-2 | 89 |

Note: "Test Title" / "p. 00-00" in stills come from my script arguments.

## Below-93 defects
**Overlay UI**: rm-ui-375-solwind.png: source line is cut mid-sentence ("Table 1-4, p. 01-24. · SWF 2026" clipped) behind the "Scroll for more" bar; the Export button is icon-only and sits alone on its own row under the wrapped "Static diagram..." note; disabled "No specific legal item" bar still takes a full row (rm-ui-1440-solwind.png). 1440 layout is clean. Esc closes and returns focus to BODY when the scene was opened programmatically (no origin element), so focus is lost. Earth imagery did not finish loading within 40 s at 375 on page load (network, not verified as a page bug).

**Static fallback**: static-*-1440.png are now photographic and clean, but static-spaceplanes-1440.png and static-rpo-1440.png have crowded, touching labels (Object G/J, CSSHQ orbit, USA 271 x2, SJ-21 label on GEO). At 375 the Earth is small and labels sit on it: static-starfish-375.png (four labels stacked over the globe), static-laser-375.png, static-rpo-375.png (about ten labels overlapping, unreadable), static-dn2-375.png (DN-2 path label covers the trajectory), static-spaceplanes-375.png. The banner wraps to two lines at 375 in every scene.

**PNG still (live)**: starfish-still-live.png uses a top-down polar view with the belt as radial spokes, Johnston Island label at the bottom edge and a vertical rod through the status caption; shakti-still-live.png crops the Earth left/top, drops the PDV Mk-II label, debris is faint; laser-still-live.png "MIRACL beam" label leader is detached from the beam and Earth is cropped left; fengyun-still-live.png "Xichang" label is far from its marker and "Debris ring" leader lands on land; burnt-frost-still-live.png leader for "Larger pieces falling" ends mid-Earth with no sprite under it. Footer band is clean and consistent.

**Fengyun (92)**: fengyun-cam2.png: "Debris ring" and "Xichang" labels stack over the bottom of the Earth, ring column jammed against the top edge; fengyun-375-0.3.png: "Fengyun-1C", "Xichang" and "SC-19" labels bunch at the impact point.

**Burnt Frost (89)**: burnt-frost-1440-0.6/0.85.png: "Larger pieces falling (illustrative)" label leader is long and lands on the trail; Earth is pushed to the left with the LEO shell cut off at the canvas edge; debris nearly vanishes at 0.85. burnt-frost-cam1.png: label sits on the Earth limb; cam2: vertical leader crosses the Earth. burnt-frost-375-0.6.png: "Pieces falling (illustr.)" label sits on the debris.

**DN-2 (89)**: dn2-cam1.png and dn2-cam2.png: "Apogee", "GEO ring", "10,000 km" labels cluster at the bottom/right with long crossing leaders, and cam2 clips the GEO ring at the right edge; dn2-375-*.png: "DN-2 path", "10,000 km" and "GEO" labels stack on the trajectory and GEO markers, and the "≥30,000 km (SWF)" leader at 0.85 crosses the whole Earth. Caption text matches SWF (apogee ≥30,000 km, no target).

## Round 9 items
Fixed: static Earth now photographic with no side bands; hero-adjacent items not verified. Not fixed: label collisions (DN-2, Burnt Frost, 375 static), still label placement.

## Best single improvement
A shared screen-space label declutter (push apart, clamp to canvas, shorten leaders, hide on narrow widths) used by live view, static SVG and stills.
