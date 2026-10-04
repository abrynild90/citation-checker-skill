# Round 8 grading, reviewer B (3D scenes slice)

Method: Playwright/SwiftShader. 10 scenes live at t=0.3/0.6/0.85 at 1440 and 375, every camera preset once per scene at 1440, reduced-motion static at both widths, live and static PNG stills, hero at both widths, keyboard test (Enter on tour button, Tab, Esc, focus return). Images are in scratchpad g8B/. I opened a representative subset at full resolution, not every one of the ~134 files. Facts were spot-checked against SWF only where noted, so I did not audit every number.

| Item | Score |
|---|---|
| Hero 3D overview | 84 |
| Scene overlay UI | 88 |
| Static/reduced-motion fallback | 86 |
| PNG still export | 90 |
| Starfish | 90 |
| Solwind | 82 |
| Fengyun | 91 |
| Burnt Frost | 85 |
| DN-2 | 86 |
| Shakti | 87 |
| Cosmos 1408 | 85 |
| GNSS | 89 |
| Viasat | 83 |
| Laser | 82 |
| Visual impact | 87 |
| Quality of graphics | 86 |
| Fun/engagement | 88 |

## Defects below 93

**Hero (84)**
- herob-1440.png: Earth fills only ~15% of a wide canvas. Large empty margins, and the LEO/MEO/GEO shells are faint.
- Labels ISS, GPS and LEO are small.
- herob-375.png: the 3D hero sits below the ledger panel and needs scrolling. Its crop cuts the LEO label.
- Keyboard: Esc closes the overlay and returns focus to #tourBtn correctly, but the hero itself has no visible affordance.

**Overlay UI (88)**
- The scale/imagery note and the source line are clipped mid-sentence at the bottom of the side panel (starfish-1440-0.6.png, burnt-frost-1440-0.6.png). There is no scroll cue.
- Long steps lists, e.g. Viasat step 5 "(11 s)", are cut at the fold (viasat-1440-0.6.png). The Laser caption is about 130 words, and its source is truncated (laser-1440-0.6.png).
- On mobile the body text is clipped behind the Related-law bar, and the scene view is only ~290 px tall (laser-375-0.3.png, cosmos1408-375-0.85.png).
- Positives: focus goes to Close, Tab is trapped, Esc works, the prev/next counter is correct.

**Static fallback (86)**
- laser-static-1440.png: the SVG does not fill the stage, leaving visible lighter bands at the left and right edges.
- Laser labels (White Sands, MSTI-3, MIRACL beam) stack and touch.
- gnss-staticstill.png: the "Airliner B" label sits on top of the link lines, and the GPS satellites label overlaps a satellite orbit.
- The static stage reads flat, with a green cartoon land map, next to the live imagery.

**PNG stills (90)**
- viasat-still.png: the GEO shell renders as a flat opaque grey disc that dulls the star background, and it is cropped at top and bottom.
- fengyun-still.png: the "Debris ring" label sits on top of the dense particle column.
- The still is taken at the current camera. It is otherwise clean, with a header banner, footer source and credit.

**Starfish (90)**
- starfish-1440-0.6.png: "Johnston Island", "Thor launch" and "Detonation" labels cluster and overlap the leaders.
- The particle belt looks uniformly random (like noise), not like field-line structure.
- On mobile the labels crowd the top.

**Solwind (82)**
- solwind-1440-0.6.png: the fragment cloud is a saturated white blob with no visible structure, and it reads as overexposed.
- The "F-15 zoom climb" label is detached from the aircraft.
- The Earth crop is awkward.
- solwind-375-0.85.png: caption "272 of 285 simulated" is fine, but the debris is a tiny smudge.

**Fengyun (91)**
- fengyun-1440-0.85.png: the debris ring runs off the top edge behind the "Illustrative" banner.
- SC-19 remains labelled after the event.
- Otherwise the best scene.

**Burnt Frost (85)**
- burnt-frost-1440-0.6.png: the Earth is pushed to the lower left. The "Larger pieces falling" label sits on the sprite cluster.
- The "SM-3" label is stacked with it.
- Sparse debris makes it visually weak.
- The caption is long, though it does correctly flag the 240 km vs 220 km discrepancy.

**DN-2 (86)**
- dn2-1440-0.6.png: the yellow GEO ring is clipped at the left canvas edge and is very thick and glowing next to the thin others.
- The "DN-2 path", "Xichang" and "10,000 km" labels are scattered.
- dn2-375-0.3.png: the "GEO" label is flush against the right edge, and the ring is cut.

**Shakti (87)**
- shakti-1440-0.6.png: the Earth is cropped at the top-left and overlapped by the banner.
- The debris is a white blob, as in Solwind.
- The mobile view (shakti-375-0.85.png) shows a tiny debris trace, and the caption occupies a third of the view.

**Cosmos 1408 (85)**
- cosmos1408-1440-0.6.png: the ISS is an oversized blocky panel that looks like a rectangle stuck on the Middle East. The "ISS" label is detached.
- The debris spray is clipped at the top edge and by the banner.

**GNSS (89)**
- gnss-375-0.6.png: "MEO ~20,200 km", "GPS satellites" and "Jammer effect zone" labels stack tightly on the right.
- The jammer zone and airliners are tiny at 375.
- The "GPS satellites" label is clipped at the right edge on desktop.

**Viasat (83)**
- viasat-cam1.png (Ground network preset): huge blurry pink sprite blobs cover Europe and look unfinished. The "Ground management network" label points at nothing.
- viasat-1440-0.6.png: the terminal region is small on the default camera.
- viasat-375-0.85.png: the attack area is tiny and labels crowd it.

**Laser (82)**
- laser-1440-0.6.png: the satellite is oversized and the beam is a fat cylinder. Three labels stack on the beam (MSTI-3, MIRACL, White Sands).
- The Russia preset (laser-cam2.png) labels "MSTI-3" and "MIRACL beam" float at the top with no referent in view. The Peresvet markers are plain pink blobs with overlapping labels.
- The caption is overlong.

**Visual impact / graphics / engagement**
- Earth imagery, atmosphere glow and camera work are strong.
- The debris/effect sprites are the weak spot: blown-out white blobs (Solwind, Shakti), blurry pink masses (Viasat), and toy-like satellite models (ISS, MSTI-3).
- Label collisions recur across scenes.
- Scenes are well paced, and the preset buttons work and add variety.

## Factual notes
Captions reviewed for Burnt Frost, Solwind and Fengyun, and the SWF text contains them. No caption error was found.

## Best single improvement
Fix the debris and effect sprites (soft additive falloff, lower alpha, size-attenuated). In the same pass add label collision avoidance with leader lines that clamp to the stage. This addresses the weakest visuals (Solwind, Shakti, Viasat, Laser) and the label clutter across all scenes.
