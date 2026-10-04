# Round 10 grading, reviewer B2 (Shakti, Cosmos 1408, GNSS, Viasat, Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader, images in scratchpad g10B2/. Live t=0.2/0.4/0.6/0.85 at 1440 and 375, all camera presets at 1440 (new act-based presets at t=0.15/0.5/0.9), static (reduced motion) at both widths, static and live stills for the new scenes. Coverage caveat: many Read calls were dropped by the tool. I re-read and viewed the full-resolution 1440 sequences, one 375 frame per old scene plus 0.6/0.85 for the new scenes, and the presets I list. I did not view every 375 frame (0.2 for most scenes) or every act-preset time. Note: "Title"/"Cite" in live stills come from my script.

| Item | Score |
|---|---|
| Shakti | 88 |
| Cosmos 1408 | 91 |
| GNSS | 92 |
| Viasat | 89 |
| Laser | 88 |
| SJ-21 tug (new) | 87 |
| RPO (new) | 86 |
| Spaceplanes (new) | 89 |
| Visual impact | 91 |
| Quality of graphics | 90 |
| Fun/engagement | 91 |

## Round 9 defects: status
Fixed: Shakti Earth is now fully framed with the banner clear of it (shakti-1440-0.2), Microsat-R/PDV labels no longer overlap; Cosmos 1408 ISS label and cloud stay inside the canvas at 0.85; GNSS pale-green quad gone (gnss-cam1 is clean); Viasat "Ground management network" label no longer sits on the terminals, spokes thinner; Laser MSTI-3 now small (laser-1440-0.6), Peresvet markers labelled without overlap (laser-cam2).
Not fixed: Laser cam0/375 still crowd labels; Viasat terminal cluster still tiny at default zoom.

## Defects below 93
**Shakti (88)**: shakti-1440-0.4: debris burst is a single glowing orange ball with a bright white halo, reads as a blob; the Earth-facing view is dominated by an empty Eurasia and the action sits at the right edge; shakti-375-0.4: "Abdul Kalam Island" and "PDV Mk-II" labels crowd the tiny burst. Caption OK ("130 of 130 simulated" is clearly simulated).

**Cosmos 1408 (91)**: cosmos1408-1440-0.85: debris is a red column poking above the limb at the top edge; the vertical debris column is very straight and reads as a fountain, not a ring or cloud; ISS is still a small blocky truss (cam1 is acceptable). "Cosmos 1408" label vanishes after 0.2 with no satellite marker visible.

**GNSS (92)**: gnss-1440-0.6/0.85: the "Jammer effect zone" leader crosses Greenland and long GPS-link lines fan across the frame; airliners at default view are tiny green/red dots (cam1 is the fix, but not the default); gnss-375-0.6: labels overlap the zone.

**Viasat (89)**: viasat-1440-0.2 to 0.85: default camera puts the Earth in the top third with the huge GEO disc filling the lower half, so the terminals and cluster are small; the pink ring at the ground hub stays a muddy halo; viasat-375-0.6: Ground network/Terminals labels and red cluster collide; caption wraps to 3 lines at 375.

**Laser (88)**: laser-1440-0.85: MSTI-3 is at the top edge near Alaska, label nearly clipped and the beam is a long thin line; laser-375-0.4: "MIRACL beam" and "MSTI-3" labels stack on the glow; laser-cam1: no satellite in frame (the Zoom preset shows only the beam and a site), so the preset does not show the target; glow pads remain soft pink.

**SJ-21 tug (87)**: sj21-tug-1440-0.2 to 0.85 (default "Whole event" preset): there is no Earth and no GEO context, only a thin yellow arc and two small craft, so the scene reads as an empty starfield; the trail is a straight thick yellow spoke from the belt, which looks like a rod, not a path (sj21-tug-1440-0.6/0.85); at 0.85 the trail ends abruptly beside SJ-21; the docked pair are ~15 px models; sj21-tug-375-0.6 is tiny with the Earth absent. cam3 (wide) is good but is not the default. Static (sj21-tug-static-1440/375): the docked pair sits under the caption bar and the "SJ-21 + G2 docked" label runs to the left edge at 375; staticstill shows the same layout (only the label carries the height cue). Captions vs SWF p. 03-11: "docked to it at some point", 21 Jan. 2022, 290 to 3,100 km (SWF: "elliptical orbit ranging from 290 km to 3,100 km above the protected GEO zone"), "lowered back close to GEO" all match; the table quote "well past graveyard orbit" is correctly attributed. Status at 0.34/0.4 says "how is not described": no overstatement. Minor: the scene draws a link bar between the craft, i.e. an implied docking mechanism, but the caption says so. One nit: caption says 290 to 3,100 km "above the protected zone" while the status says "290–3,100 km above" without "elliptical": acceptable.

**RPO (86)**: rpo-1440-0.6 (Russia act): Cosmos 2543 is a tiny diamond at the end of a thick orange rod-like trail that spans the frame, and its label sits under the trail start; Cosmos 2542 label overlaps the Earth limb. rpo-1440-0.85: the "3 · US + UK, GEO (2025)" tag has a stray floating leader dot detached from anything, and USA 271 arrives on a thick blue rod. rpo-1440-0.2/0.4: episode 1 shows the four craft on a bare arc with no Earth, thin context; docked SJ-21/SJ-25 are separated by a few pixels so docking is barely visible. Static (rpo-static-1440, rpo-static-375): the composite crams three unrelated episodes on one GEO ring plus a LEO satellite, labels overlap heavily (USA 271 appears twice, "SJ-21 + SJ-25 (docked)" sits on USA 271 and USA 270), and the LEO episode is drawn at the GEO ring; at 375 it is close to unreadable. The status line does flag "three separate episodes", but the diagram itself suggests one place. Live still (rpo-livestill, t=0.3 = Russia act): clean, but shows only episode 2, and the header still reads only "Illustrative" with no episode note. Captions vs SWF: hedging is preserved ("appear to dock", "possibly docked", "strongly suggests", "thought to have docked"); I verified the SJ-21/SJ-25 and Cosmos 2542 wording against the on-screen status text; USA 270/271 as the "flanking" satellites and "13 km" closest approach in the Sept. USA 271 / SKYNET 5A episode are stated as SWF figures. No overstatement found. Act presets: each preset shows its own episode at t=0.15/0.5/0.9 but with the act boundary jumping the camera between episodes at 0.42 and 0.72.

**Spaceplanes (89)**: spaceplanes-1440-0.2 (LEO act): several inclination rings are drawn as thin overlapping hairlines behind the globe and "X-37B (US)" and the flights label sit at the top edge of the frame while the craft is a faint smudge; spaceplanes-1440-0.6 (OTV-7): orbit and labels are clear, good; spaceplanes-cam2-t0.5/cam3-t0.9 show the correct act but at t=0.5 the OTV-7 close-up has no craft in frame (only an orbit line); China act (spaceplanes-1440-0.85 / cam3-t0.9): the delta-wing model is big and yellow and reads well, Object G is a 6 px diamond; label "CSSHQ orbit" overlaps the limb. Static (spaceplanes-static-1440): busy but legible, though "CSSHQ orbit" text sits on the orbit line and Object G/J labels stack; at 375 the labels "300–400 km · 38°–54°", "~600 km · 50°" and "Obj. G" overlap the orbits. staticstill is good. Captions vs SWF: "eight missions since 2010", OTV-7 323 x 38,838 km at 59.1 degrees, 434 days landing 7 Mar. 2025, OTV-8 21 Aug. 2025, CSSHQ flights 2/276/268 days plus fourth 6 Feb. 2026, "at least two and possibly three capture/docking operations" quoted as LeoLabs, and the 2019 PLA analysis attributed to the PLA are all consistent with the tables I checked; the flights-of-2-days figure for flight 1 is in the caption but not in the status line (status lists only 276 and 268). "SWF says the X-37B has not approached any other object" is present as a quote. No overstatement.

**Visual impact (91), graphics (90), fun (91)**: strong Earth imagery, atmosphere and glow, and the new act-based cameras add drama. Weak points: the three new scenes are much emptier than the old ones (no Earth in the SJ-21/RPO defaults, thick rod-like trails, tiny craft), label collisions in static composites (rpo, spaceplanes at 375), and Viasat/Laser default cameras leave the action small.

## Best single improvement
Give the SJ-21 and RPO default cameras an Earth-and-belt context frame (Earth limb or full GEO ring behind the craft) and replace the rigid straight trails with thin curved, fading paths; then split the RPO static fallback into three small labelled panels instead of one composite ring.
