# Round 16 grading, slice S3 (Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader. Live t=0.2/0.4/0.6/0.85 at 1440 and 375, every preset at t=0.3/0.7 (1440; Laser 4, SJ-21 5, RPO 5, Spaceplanes 5 presets), static (reduced motion) 1440/375, live PNG still 1440/375, and static-mode PNG still via `await host().stillPNG()` at 1440/375. No page errors. Captions checked against swf_2026.txt: "remained docked until November 2025", "flanking" SJ-21/SJ-25, Object G June 5-8 and June 11-12 (within 1 km), Cosmos 2543 / "no threat", eighth X-37B, SJ-21 January 2022. All match. Test scripts deleted.

| Item | R15 | R16 |
|---|---|---|
| Laser dazzling | 95 | 95 |
| SJ-21 tug | 92 | 93 |
| RPO | 94 | 94 |
| Spaceplanes | 93 | 94 |
| Visual impact | 94 | 94 |
| Graphics quality | 93 | 93 |
| Fun/engagement | 94 | 94 |

## Last round's defects
- Static-mode stillPNG (threw in R14/R15): FIXED. It now resolves at 1440 and 375 for all four scenes and returns a complete diagram still.
- SJ-21 arm: FIXED honestly. A blue chip "Arm: not shown (SWF does not describe the mechanism)" ("not in SWF" at 375) sits under the banner on the tug presets, and the static source line points to the robotic-arm satellites SJ-7, Aolong-1 and SJ-17. The craft are still two bus-and-panel blocks with no visible arm.
- SJ-21 live pair: FIXED. At 1440 and 375 the docked pair is at believable size, inside frame, with one grouped label and a tow trail. At t=0.85 Compass G2 drifts with a separation arc.
- SJ-21 static pair: PARTLY. The 1440 static still has the pair off the ring with a leader, but the pair is small and flat (panels read as a strip) and the ring runs through the 375 still pair. In the 375 live-still tile the pair is oversized with a big glow.
- Episode handover chip: still works ("Showing: China + US in GEO" / "Russia in LEO"). Residual from R15 unchanged: the pressed preset button and the chip name different things, with no "back to my preset" action.
- CSSHQ flat wedge: FIXED live. It reads as a gold delta craft with fuselage and wake, correctly sized against Object J and Object G (preset 3 at t=0.3/0.7). Static still shows it as a small glowing craft, no giant wedge. Static labels (Obj. G / Obj. J / CSSHQ flight 2) stack on the right limb but do not collide.
- Laser static Earth/craft: PARTLY. Static still Earth now fills the frame, but MSTI-3 and the beam are small, and in the 375 static the MSTI-3 and beam-label boxes touch.
- RPO 375 USA 245 label/leader and crowded static: no crossing seen in live; the 375 static panels are still tiny, and the third static panel's "Earth (not to scale)" text overlaps the craft/leader in the 375 live still.

## Scores and fixes to reach 93+/95
**Laser 95**: magenta beam, White Sands marker, orbit shell and Peresvet preset all show action at every preset; captions correct. Dings: MSTI-3 tiny in static still; 375 static label boxes touch. Fix: enlarge MSTI-3 and beam in static still; separate the MIRACL and MSTI-3 labels at 375.
**SJ-21 93**: honest arm tag, good live pair, approach/pull/separation story, 5 useful presets. Dings: craft remain low-poly with no arm or boom; static pair small and flat; 375 live still pair oversized. Fixes: add a boom or dish silhouette to the tug model, cap pair size in the live still, move the ring behind the static pair.
**RPO 94**: three-episode tour, readable handover chip, colour coding by nation, 1440 and 375 clean. Dings: 375 static panels small; "Earth (not to scale)" overlaps the craft in panel 3 of the 375 live still. Fix: move that label to the panel corner and raise the 375 static font size.
**Spaceplanes 94**: X-37B and CSSHQ models are distinct and well scaled, the OTV-7 38,838 km orbit is dramatic, and there are five presets and three static views. Dings: X-37B small in tour; limb label stack in static; legend box large at 375 still. Fix: raise the tour X-37B minPx, offset the static labels, shrink the 375 still legend.
**Visual impact 94 / Graphics 93 / Fun 94**: Blue Marble Earth, glows, beam, wakes and handovers are strong, and presets never go empty. Ding: craft models are still low-poly and there is no on-screen "back to my preset" action. Fix: one "return to my preset" button on the chip, and a tiny detail pass on the tug and CSSHQ models (95 reachable).

## Path to >=93 for all
All scored items are at or above 93 this round (SJ-21 now at the threshold). To get a margin on SJ-21: add model detail and clean the static pair.
