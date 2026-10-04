# Round 14 grading, slice S3 (Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader; contact sheets of live t=0.2/0.4/0.6/0.85 at 1440 and 375, every preset at t=0.3/0.7 (1440), static (reduced motion) 1440/375, live still PNG (static still not separately captured: stillPNG under reduced motion returned no image to the harness). Preset status/caption text dumped for all 38 preset x time states; captions match SWF text (spot-checked MIRACL 1997, SJ-21 Dec 2021/21 Jan 2022, OTV-7 38,838 km, CSSHQ 2/3, Object J/G, USA 271/SKYNET 5A).

| Item | Score |
|---|---|
| Laser dazzling | 94 |
| SJ-21 tug | 92 |
| RPO | 92 |
| Spaceplanes | 92 |
| Visual impact | 93 |
| Graphics quality | 92 |
| Fun/engagement | 93 |

## Round 13 defects
Fixed: no preset now shows an empty frame (RPO "China + US in GEO" t=0.7, "US + UK" t=0.3, spaceplanes "OTV-7" t=0.7, "China: CSSHQ" t=0.3 all show a craft with a matching caption); SJ-21 live still now frames the pair and Earth fully with legible labels; spaceplanes live still shows the whole Earth, craft and Object J label no longer touch; SJ-21 cam1 pair is larger; RPO "Russia in LEO" keeps craft in frame.
Not fixed / partly: SJ-21 static pair still sits on the GEO ring (labels "GEO belt" and "docked" stacked under it); RPO 375 static panel titles still collide with craft labels; live CSSHQ still a large flat gold delta wedge; Laser static beam still a short stub.

## Episode-locked handover (new)
Behaviour works: scrubbing outside an episode swaps to the on-screen episode's camera, so frames are never empty and captions match. It is NOT clear to a viewer: the preset button label stays the same (e.g. "China + US in GEO" at t=0.7 shows Cosmos 2543 over Europe; "X-37B: LEO flights" at 0.3 shows OTV-7 in GEO), with no note that the camera was handed over. Looks like a bug. Fix: show a small chip ("Showing episode 2 camera; preset applies to episode 1") or move the active-preset highlight to "Tour/Auto" while handed over, and re-apply the preset when scrubbing back.

## Defects below 93
**SJ-21 (92)**: static pair on ring (above); live "pair" and "robotic arm": no arm is drawn, caption honestly says SWF does not say; text panel is long and the steps list is hidden behind scroll at 1440 and 375; craft models still low-poly blocks. Fix: move static pair inside the ring with a leader, add a small "arm: not shown (SWF does not describe)" tag, surface step list above the long paragraph.
**RPO (92)**: handover unlabelled (above); 375 static: panel titles ("SJ-21 + SJ-25 dock, GSSAP flank") overlap USA 271/SKYNET labels; 1440 static craft tiny and tangled in LEO panel (Cosmos 2543/2542 labels overlap). Fix: shorten titles to one line, enlarge craft, offset labels.
**Spaceplanes (92)**: CSSHQ delta wedge oversized/flat (still), X-37B small in tour t=0.2; static labels crowd the left limb (CSSHQ 2 / Obj. J / X-37B stack); handover unlabelled. Fix: scale CSSHQ model and give it thickness/shading, spread static labels with leaders.
**Laser (94)**: minor only: static beam stub; MSTI-3 small in static; 375 static Earth small. Reaching 96: draw full beam in static, enlarge Earth at 375.
**Visual/graphics/fun**: Blue Marble Earth, beams, glows strong, presets now always show action; remaining dings are low-poly craft, unlabelled handover, cramped static diagrams. Fun 93: scrubbing is rewarding; add handover cue and a simple "follow" highlight to hit 95.

## Path to >=93 for all
1. Handover chip/highlight (RPO, spaceplanes, SJ-21).
2. SJ-21 static pair off ring.
3. RPO 375 static title overlap fix.
4. CSSHQ model refinement and static label spread.
