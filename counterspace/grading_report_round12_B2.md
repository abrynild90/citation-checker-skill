# Round 12 grading, reviewer B2

Method: Playwright/SwiftShader, images in scratchpad g12B2/. VIEWED at full resolution: laser, sj21-tug, rpo, spaceplanes (live t=0.2/0.4/0.6/0.85 at 1440 and 375; all camera presets at 1440 (act presets at episode midpoints); static fallback 1440/375; live still and static still).
NOT VIEWED (image reads failed with "request limit"): Shakti, Cosmos 1408, GNSS, Viasat default camera at 1440/375 and their presets. These are NOT scored. Only Viasat "Ground network" and "Wide" presets were seen; the default Viasat framing (round 11's main defect) could not be re-checked. "Live still" title/cite come from my script.

| Item | Score |
|---|---|
| Shakti | not viewed |
| Cosmos 1408 | not viewed |
| GNSS | not viewed |
| Viasat | not viewed (cam presets only) |
| Laser | 92 |
| SJ-21 tug | 92 |
| RPO | 92 |
| Spaceplanes | 91 |
| Visual impact (viewed scenes) | 92 |
| Quality of graphics (viewed scenes) | 91 |
| Fun/engagement (viewed scenes) | 92 |

## Round 11 defects, status
Fixed: Laser 375 now frames MSTI-3 and White Sands at every t; SJ-21 docked craft now touch, no tow beam; RPO stray panel-3 tag gone; RPO 0.2 status now "13-14 June: RPOs; on 13 June within 1 km, possibly docked, then separated (COMSPOC)" (matches SWF p. 03-12/13). Not fixed: SJ-21 static docked pair is still two tiny squares; spaceplanes static label density; live stills crop Earth. Not checkable: Viasat default, Shakti, Cosmos.

## Defects below 93
**Laser (92)**: cam "Russia: Peresvet sites" (cam3) keeps the status "MIRACL beam tracks the satellite..." while showing only Russian pins (mismatched caption); "Zoom on MSTI-3" (cam2) has the "MIRACL beam" label sitting under the beam/craft and the White Sands label leader nearly flat; MSTI-3 only ~15 px at 1440-0.2 and 0.4. Captions match SWF (1997 test, Peresvet named 2018, shelter sites only). Fix: swap the status line on the Russia camera and enlarge MSTI-3 in default view.
**SJ-21 tug (92)**: static 1440/375/staticstill: docked pair is two ~12 px squares outside the GEO ring at the right edge, label pressed to the frame edge, Earth drawn to a different scale than the live view; live still crops Earth at the top and pair is small; cam1 pair ~40 px wide. Title verb "tows" vs SWF "pull"; step list scroll hides most steps at 1440/375 (only two visible). Captions OK vs SWF p. 03-11 (25 Dec 2021, "docked to it at some point" with "(how is not described)", ~21 Jan 2022, 290-3,100 km by 27 Jan, lowered back near GEO). No overstatement. Fix: enlarge the static docked pair and pull it inside the frame with a zoom callout.
**RPO (92)**: step list reads "1. 1 · GEO, June 2025..." (doubled number, first step carries the panel prefix); static panel 1 has no Earth and a stray blue arc top-left with a GEO ring cut off; static markers are plain squares (Cosmos 2543 marker ~8 px); live still text is tiny (labels ~8 px at 3000 px width). Captions check out vs SWF: 13 June within 1 km possibly docked, just under 3 km on 13 Jan, 130 km by 16 Jan, "strongly suggests", within 20 km several times Jan 2020, 2 km for three days, 590 km by 16 Dec, 13 km 5-11 Sept. "Dec.-Jan." status is fine. Fix: drop the "1 ·" prefix from step 1 and give static panels a small Earth.
**Spaceplanes (91)**: static 1440: label stack (Obj. J, ~600 km, 300-400 km, CSSHQ flight 2, GEO, Obj. G) crowds the Earth; CSSHQ orbit is a straight line through the disc with a marker at Earth's centre; "Obj. G" leader runs horizontally to the flight-2 marker (Obj. G belongs to flight 3); "OTV-7 orbit" label sits beside the banner and touches it at 1440; OTV-7 orbit is a faceted polyline. Live 0.2/cam1: a landing icon at bottom-left is half hidden by the caption; "X-37B flights" label sits over orbit lines; live still crops the Earth under the caption and the geo ring off-frame. 375 static labels overlap orbits. Captions match SWF: OTV-7 323 x 38,838 km 59.1 deg, 607 x 597 km, Object J, Object G 24 May 2024, within 1 km 12 June, Vandenberg 7 Mar 2025 434 days, Vandenberg/Kennedy landings; hedged "may have tested".
**Visual impact / graphics / fun (92 / 91 / 92, viewed scenes only)**: Strong Earth imagery and act cameras, curved trails, real craft models; weaknesses are the static composites' low-fidelity square markers and label density, and small craft in wide cameras.

## Best single improvement
Rebuild the static fallbacks (SJ-21 tug and spaceplanes) with the same craft silhouettes and a de-crowded label layout as the live scenes; and fix the RPO "1. 1 ·" step text.
