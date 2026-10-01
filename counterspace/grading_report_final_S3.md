# Final grading, slice S3 (Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader, fresh. Live t=0.2/0.4/0.6/0.85 at 1440 and 375; every preset at t=0.3/0.7 (1440; Laser 4, SJ-21 5, RPO 5, Spaceplanes 5); static (reduced motion) 1440/375; live PNG still; static-mode `stillPNG(title, cite)` at 1440 and 375 (all resolved, no throw). No page errors. Captions checked against swf_2026.txt: SJ-21 docked/"remained docked until November 2025", "flanking", Cosmos 2543 "no threat", Object G 24 May 2024 / within 1 km 12 June, OTV-7 323 x 38,838 km 59.1 deg, eight flights, CSSHQ fourth launch Feb 2026, Peresvet mobile dazzler. No contradictions found. Stills used placeholder title/cite in the harness (real title and source line appear in the static still footers). Scripts deleted, server stopped by PID.

| Item | Score |
|---|---|
| Laser dazzling | 95 |
| SJ-21 tug | 91 |
| RPO | 92 |
| Spaceplanes | 92 |
| Visual impact | 94 |
| Graphics quality | 91 |
| Fun/engagement | 93 |

## Evidence
**Laser 95.** Glowing magenta beam locked White Sands to MSTI-3 at every t and preset; MSTI-3 is a readable gold bus with halo; Peresvet preset pins on Russia are clear with an honest caption. 375 live is clean (short captions). Static 1440/375 and static still: large Earth, big labelled MSTI-3 and beam, no overlaps. Live-still tile is cropped to a limb with small caption. Dings: Peresvet preset t=0.3 and 0.7 are identical frames (beam off); live still has tiny caption.

**SJ-21 91.** Approach, docking, pull-with-tow-trail and separation arc all read at 1440 and 375; context inset helps; "Arm: not shown (SWF does not describe the mechanism)" chip is honest. Defects: (1) static diagram pair is a flat strip of panels ~30 px wide beside a huge ring, tiny against the Earth, in both static view and still; (2) in the live default camera the GEO orbit line cuts straight through the craft bodies (t=0.2, 0.4); (3) craft are still two bus-and-panel blocks with no arm/boom; (4) presets 2 and 3 at t=0.3/0.7 are near-duplicates, and the "Approach" preset at 0.7 shows the pair already pulled away; (5) live-still tile has the pair as a glow smudge at the ring edge.

**RPO 92.** Colour-coded nations, good handover chip, crisp labels, 375 labels fit, three-panel static is legible at 1440 and the still has real captions. Defects: (1) preset buttons do not frame their named episode: at t=0.3 "Russia in LEO" (c2) shows the China GEO episode, "US + UK in GEO" (c3) and "Wide" (c4) show China at 0.3 and Russia at 0.7, so the named US/UK episode is never seen at 0.3/0.7; the chip then names a different thing than the pressed button (unchanged from R16); (2) the tour at t=0.4 and 0.6 shows the same China scene; (3) 375 static panels are small (font ~9 px), "Earth (not to scale)" italic text sits on top of craft area in panel 1-2; (4) in the live-still tile craft are tiny and "USA 245 (US satellite)" sits on the limb.

**Spaceplanes 92.** X-37B and gold CSSHQ delta are distinct with wake; OTV-7 elliptical orbit against the GEO ring is the standout; Object J/G released-object story reads; captions accurate. Defects: (1) same preset problem: "X-37B: LEO flights" (c1) at t=0.3 shows OTV-7 and at 0.7 CSSHQ, so the LEO-flights framing with the 4-orbit fan only appears in the tour at t=0.2; (2) the live still has the X-37B as a tiny blue sliver and CSSHQ an unreadable dot; (3) static stills have X-37B and CSSHQ as 5 px marks, only labelled boxes carry the story; (4) the CSSHQ flight 2 label sits on the craft/trail at c3 t=0.7.

**Visual impact 94 / Graphics 91 / Fun 93.** Blue Marble Earth, rim glow, bloom on craft, beams, trails, nation colours and handovers are strong, and no preset goes empty. Graphics held back by low-poly craft with no detail (no arm, plain boxes), flat static craft icons, and orbit lines passing through models. Fun: the tour and handover chip give a story; presets that do not jump to their named episode reduce user control.

## Fixes for anything under 93
- SJ-21 static (and its still): draw the pair at 2-3x size with a visible gap, offset off the ring, and mark panel/body so it does not read as a strip; cap live-still glow.
- SJ-21 live: lift the orbit line behind the craft (depth-offset or fade near craft); add a boom/dish or tow-line geometry to the tug; make presets 2/3 differ (tighter vs angled by more than a few degrees).
- RPO and Spaceplanes presets: make a pressed preset lock its episode (episode-pinned time/camera) or rename the buttons "Camera: China/US in GEO etc." and show the chip as "Tour is at ..."; add a "back to tour" action on the chip.
- RPO static 375: raise panel label font to >= 10 px and move "Earth (not to scale)" to the panel corner; enlarge craft in the live-still tile.
- Spaceplanes: raise X-37B/CSSHQ minPx in the live still and static icons to >= 12 px; show the LEO-flights fan when preset c1 is pressed.
