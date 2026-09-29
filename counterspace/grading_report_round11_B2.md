# Round 11 grading, reviewer B2 (Shakti, Cosmos 1408, GNSS, Viasat, Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader, images in scratchpad g11B2/. Full-resolution Reads of live t=0.2/0.4/0.6/0.85 at 1440 for all 8 scenes and at 375 for all 8; 1440 presets: sj21 cam1-4, laser cam1, viasat cam1/cam2, shakti cam1 at t=0.5. RPO/spaceplanes act presets were captured (t=0.15/0.5/0.9) but I did NOT view them. Not viewed: presets for cosmos1408, gnss, and remaining shakti/laser presets; spaceplanes-staticstill and sj21/rpo stills were viewed except spaceplanes-staticstill. "Live still" title/cite come from my script.

| Item | Score |
|---|---|
| Shakti | 92 |
| Cosmos 1408 | 92 |
| GNSS | 93 |
| Viasat | 89 |
| Laser | 91 |
| SJ-21 tug | 91 |
| RPO | 92 |
| Spaceplanes | 92 |
| Visual impact | 93 |
| Quality of graphics | 91 |
| Fun/engagement | 92 |

## Round 10 defects: status
Fixed: SJ-21 and RPO defaults now show Earth, GEO ring, context inset, curved trails, real craft models (sj21-tug-1440-0.2..0.85, rpo-1440-*); RPO static is now three labelled panels (rpo-static-1440/375) and stills are triptychs; Shakti burst has a ring and reads as a burst; Laser now frames MSTI-3 and White Sands at 1440; GNSS airliners readable with inset and zone.
Not fixed: Viasat default camera unchanged.

## Defects below 93
**Shakti (92)**: shakti-375-0.4 burst is clipped at the right edge and the ring runs off frame; 1440-0.85 debris nearly invisible (intended, caption explains). Caption OK.
**Cosmos 1408 (92)**: 0.4 debris is one straight orange fountain streak; at 0.6/0.85 a detached arc floats outside the limb top-left; "Cosmos 1408" label and marker vanish after 0.2; caption "debris cloud spreads across the ISS orbit" is a bit assertive for a schematic but consistent with SWF.
**Viasat (89)**: viasat-1440-0.2..0.85: Earth stays in the top third, the GEO disc fills the frame, terminals are a tiny cluster and the satellite sits on the bottom edge; caption says "the satellite kept working" while the satellite is not in view; viasat-375-*: satellite off-screen, red terminals become a solid blob at 0.6/0.85, caption wraps 3 lines at 0.2. cam1/cam2 are excellent (viasat-cam1, cam2) but are not the default.
**Laser (91)**: laser-375-0.6/0.85: MSTI-3 leaves the top of the frame, no label or satellite visible; laser-375-0.2 White Sands out of frame; 1440 is good.
**SJ-21 tug (91)**: 0.4/0.6 draw a thick white beam between the "docked" craft while they are ~300 px apart (reads as a tow beam or laser, implies mechanism; docked craft should touch); cam1 shows docked pair only ~12 px wide. Static (sj21-tug-static-1440/375, staticstill): docked pair is two tiny squares crammed under the caption bar. Captions match SWF p. 03-11 (25 Dec. rendezvous, "docked to it at some point", ~21 Jan. 2022, 290-3,100 km, lowered back close to GEO); no overstatement. Title "tows" vs SWF "pull" minor.
**RPO (92)**: rpo-livestill/staticstill: panel 3 has a stray "3 · US + UK, GEO (2025)" tag floating unattached; static Earth in panel 1 is cropped off-panel; Cosmos 2543 has no visible craft marker in the static panels; live 0.2 status "13-14 June" (SWF says June 13 within 1 km, possibly docked) is slightly beyond source; 0.6 caption wraps to 2 lines at 1440. Other captions (1 km possibly docked, just under 3 km on 13 Jan., 130 km by 16 Jan., "strongly suggests", 20 km several times Jan. 2020, 13 km Sept.) match SWF pp. 01-14, 02-09, 03-12/13 with hedging kept.
**Spaceplanes (92)**: spaceplanes-static-1440: label stack in the centre (CSSHQ flight 2, CSSHQ orbit, X-37B flights, GEO ring) is crowded and the OTV-7 orbit is a faceted polyline; static 375 labels heavily overlap orbits; livestill at OTV-7: "OTV-7 orbit" label sits on the trace and caption is clipped by Earth glow; 375 spaceplane model is oversized and sits on the limb. Captions vs SWF (OTV-7 323 x 38,838 km 59.1 deg, 607 x 597 km, Object J, Object G 24 May 2024, within 1 km on 12 June, Vandenberg/Kennedy landings) all match.
**Visual impact (93), graphics (91), fun (92)**: Strong Earth imagery and act cameras; the new scenes now match the older ones. Weak spots: Viasat/Laser default framing, blocky low-poly craft models at distance, static composites' label density, 375 framing loses key objects in Laser/Viasat.

## Best single improvement
Reframe Viasat's default camera (and Laser/Viasat at 375) to keep the terminals and the satellite both in frame (cam1/cam2 behaviour), and make docked craft actually touch with no long link beam in SJ-21.
