# Round 13 grading, slice S2 (Burnt Frost, DN-2, Shakti, Cosmos 1408, GNSS jamming, Viasat)

Viewed: contact sheets (t=0.2/0.4/0.6/0.85 at 1440 and 375, plus every camera preset at t=0.6, 1440 and 375) for all 6 scenes; captions and sources checked against SWF text (175 pieces/240 km/20 months; 45 minutes; 1,807/5 all consistent).

| Scene | Score |
|---|---|
| Burnt Frost | 92 |
| DN-2 | 92 |
| Shakti | 91 |
| Cosmos 1408 | 94 |
| GNSS jamming | 86 |
| Viasat | 88 |
| Visual impact / graphics / fun (slice) | 91 |

## Evidence and fixes to reach >=93
**Burnt Frost 92**: clear story, labelled Impact/USS Lake Erie, debris counter, 4 good presets. Defects: t=0.2/0.4 interceptor and USA-193 tiny, low contrast, globe fills frame with little action; t=0.85 remaining 48 pieces are faint specks. Fix: zoom Follow preset closer on the intercept at t<0.5; brighten/enlarge SM-3 and late debris.

**DN-2 92**: trajectory, 10,000 km and GEO marks, captions match SWF pp. 03-20/22. Defects: default view crops the arc and GEO ring runs off-frame (t=0.2, 0.4); Polar at 375 shrinks the scene to a small ball with overlapping labels (Xichang/10,000 km/DN-2 path); only Polar was detected as preset in my probe while Follow/Profile/Zoom exist, so preset set differs per scene. Fix: dedupe Polar labels, frame full arc at t>=0.4.

**Shakti 91**: good flash at t=0.4 and debris spread. Defects: Microsat-R vanishes after t=0.2 with no marker; at t=0.85 debris nearly invisible while caption says 25 of 130 aloft; Polar puts Impact/Abdul Kalam labels overlapping with the action a few pixels wide. Fix: keep a faded target/debris ring, enlarge late debris sprites, de-collide polar labels.

**Cosmos 1408 94**: best scene: dramatic cloud, ISS orbit crossing, distinct readable presets. Minor: Launch preset at 1440 is a flat horizon with piled labels (Impact/Plesetsk).

**GNSS 86**: jammer itself is never drawn (only a zone circle and a "Jammer effect zone" label with no emitter); GPS satellites appear only in a small top-right inset that covers the map, none in the main 3D view; Airliner B clipped by caption bar at t=0.2 and half out of frame at 0.4; at 375 the second preset button is truncated ("Europe +"); flat map tile, no globe curvature, less 3D than other scenes. Fix: add ground jammer mast with pulsing rings, 2-3 MEO satellites with signal lines in the main view, keep airliners inside frame, shorten preset labels at 375, move inset to bottom-right.

**Viasat 88**: strong red-vs-green modem wipe, KA-SAT beams. Defects: default "Europe + KA-SAT" shows the whole Earth with the Europe cluster about 80 px wide at 1440 (60 px at 375), so the key action is tiny, while the "Ground network" preset reads well but is not default; terminal counts differ between 1440 ("889 of 900") and 375 ("537/540"); step list cut at "5. Attributed to Russia (GRU)..." behind the scroll cue at 1440. Fix: default frame nearer Europe, consistent counts, fit step list.

**Visual impact / fun 91**: consistent polish (textured Earth, glow, labelled markers, steps, scrubber, presets). Weak spots: scenes where action is small on arrival (Viasat, Burnt Frost early, GNSS missing satellites/jammer) and inconsistent preset sets across scenes.
