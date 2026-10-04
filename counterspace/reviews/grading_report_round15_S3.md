# Round 15 grading, slice S3 (Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader. Live t=0.2/0.4/0.6/0.85 at 1440 and 375, every preset at t=0.3/0.7 (1440), static (reduced motion) 1440/375, live PNG still 1440/375. Static-mode stillPNG still throws under reduced motion (host not available), so the static PNG still was not captured (same as R14). Captions spot-checked against SWF text: OTV-7 323 x 38,838 km 59.1 deg, Object J 607 x 597 km, SJ-21/25 "just under 3 km" 13 Jan and 130 km by 16 Jan, 290-3,100 km above GEO, Peresvet. All match. Test scripts deleted.

| Item | R14 | R15 |
|---|---|---|
| Laser dazzling | 94 | 95 |
| SJ-21 tug | 92 | 92 |
| RPO | 92 | 94 |
| Spaceplanes | 92 | 93 |
| Visual impact | 93 | 94 |
| Graphics quality | 92 | 93 |
| Fun/engagement | 93 | 94 |

## Last round's defects
- Episode handover: FIXED and clear. A blue chip "Showing: <episode>" appears top-left whenever the camera was handed over (RPO "Showing: China + US in GEO" / "Russia in LEO"; spaceplanes "Showing: X-37B OTV-7" / "China CSSHQ"); absent when the preset matches. Readable at 1440; at 375 it sits under the banner without collision. Residual: the pressed preset button still names the requested preset (e.g. Russia in LEO) while chip names the other episode, so the two disagree on screen; also no hint that scrubbing back restores the preset. Not a bug look any more, only mildly redundant.
- CSSHQ model: PARTLY. Live it now reads as a delta craft with fuselage, gold shading and a proper wake (good at t=0.6/0.85). Spaceplanes live still at 375/1440 and static still (CSSHQ flight 3 at 1440) show a large flat gold wedge, bigger than Object G and the Earth limb scale suggests; looks flat and cartoonish up close.
- SJ-21 static pair: PARTLY. 1440 and 375 static diagram now puts the pair off the ring with a leader and the "height exaggerated" note is in the caption (SWF 290-3,100 km above GEO is true, so the exaggeration does not mislead). But the pair is drawn larger than any scale (craft wider than the ring offset), and in the live still the pair is huge and cropped at the right edge, with "Compass G2" and "SJ-21" labels floating above, ring passing through craft. No robotic arm drawn (caption honest). Static only: pair dot at ring in the 1440 first panel still touches the ring end.
- RPO 375 static titles: FIXED. Panel titles are one line ("1 - GEO, 2025 - SJ-21 + SJ-25"), no label collisions; title clipped by label box slightly but legible. 1440 static panels have clean separated labels.
- Laser static beam: FIXED. Static now draws full beam from White Sands to MSTI-3 with labelled leaders at 1440 and 375; static still is small but complete.

## Scores and fixes to reach 93+/95
**Laser 95**: beams, Peresvet pins and presets all show action; no empty frames. Dings: static Earth stays small in the static still (Earth ~1/3 frame), MSTI-3 tiny in static. Fix: enlarge static Earth/craft, 97 reachable.
**SJ-21 92**: live is good (docking pair, tow trail, consistent captions), 375 live clean. Dings: no arm drawn and nothing in the tug model suggests "robotic arm" (caption honest but the preset named "robotic arm" shows only two blocks side by side); live still pair oversized/cropped; static pair exaggerated size unlabelled beyond "height exaggerated"; craft low-poly. Fixes: add a small "arm: not shown (SWF does not describe)" tag on that preset, scale pair down in still and keep it inside frame with its three labels grouped, shrink static pair to match ring thickness, add craft detail (boom, dish).
**RPO 94**: handover chip works; 375 titles fixed; 1440 live presets show craft and captions; Cosmos 2543 tour/LEO labels no longer overlap. Dings: 375 live LEO view has USA 245 label crossing the leader line; 375 static panels crowded. Fix: nudge USA 245 label, spacing in static panel 1.
**Spaceplanes 93**: handover chip, orbits and wake strong; X-37B model good. Dings: CSSHQ flat wedge in still/static, static labels still stack on the left limb (CSSHQ / Obj. J / Obj. G with a long label box over the Earth), X-37B small in tour. Fix: give CSSHQ thickness/shading and reduce size in still, shorten "CSSHQ (China): flights 2 and 3" static label and offset it.
**Visual impact 94 / Graphics 93 / Fun 94**: Blue Marble Earth, glows, beams, wakes, handover chip give a strong live experience; presets always show action. Ding: craft models remain low-poly and the still/static views over-scale craft. Fun to 95: add a chip hover/tooltip explaining handover and a "back to my preset" action.

## Path to >=93 for all
SJ-21 only: fix pair size/cropping in the still, add arm-not-shown tag, finish craft detail. Others pass.
