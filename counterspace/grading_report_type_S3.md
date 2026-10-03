# Type S3 grade (Laser, SJ-21, RPO, Spaceplanes, overall slice)

Method: Playwright/SwiftShader (Newsreader + IBM Plex embedded), fresh. Live: clicked every preset button as a user would (Laser 4, SJ-21 5, RPO 5, Spaceplanes 5) at 1440 and 375; default camera at t=0.2/0.4/0.6/0.85, every preset at t=0.3/0.7, RPO/Spaceplanes episode presets also at 0.2/0.4/0.6/0.85. Static (reducedMotion) view at 1440 and 375. Both PNG stills per scene (live via `host().stillPNG(title, cite)`, static with reducedMotion) with the real config titles/cites, all 3000x1875. **Page errors: 0** (pageerror + console errors across every context; no stillPNG throws). Scripts deleted, server stopped by PID.

Captions vs swf_2026.txt: all checked claims found and consistent: SJ-25 within 1 km on 13 June (COMSPOC), 30 June / 2-6 July docking, 25 Nov burn and 29 Nov imagery, closest just under 3 km on 13 Jan and 130 km apart by 16 Jan, Cosmos 2543 within 2 km / within 20 km, apogee 590 km by 16 Dec, USA 271 0.05 deg of SKYNET 5A near 95.3 E, 13 km, X-37B 224/469/675/718/780/908 days, OTV-7 434 days, Object G 24 May 2024 and within 1 km on 12 June, 300-400 km / 38-54 deg, Compass G2 290-3,100 km. One nit: RPO is titled "(2019-2025)" but episode 1 captions run into Jan 2026.

| Item | Score |
|---|---|
| Laser dazzling | 94 |
| SJ-21 tug (robotic arm) | 93 |
| RPO (China/US/Russia) | 93 |
| Spaceplanes (X-37B + CSSHQ) | 94 |
| Visual impact | 94 |
| Graphics quality | 92 |
| Fun | 94 |

## Episode lock
Every episode preset shows its own episode at every t tried. The slider label reads "<Episode>: x / y s (scene time a to b of 32 s)" and the host time is mapped into the episode: RPO "China + US in GEO" 0-13.4 s, "Russia in LEO" 13.5-23.0 s, "US + UK in GEO" 23.1-32 s; Spaceplanes "X-37B LEO flights" 0-9.6 s, "OTV-7" 9.6-17.3 s, "China CSSHQ" 17.3-32 s. The Wide chip now shows aria-pressed correctly (previous defect fixed). Defects: (1) requested t is remapped, so t=0.7 and t=0.6 on the first episode give near-duplicate frames (h.t 0.294 / 0.252); (2) **the "Wide" presets (RPO "Wide: Earth and GEO belt", Spaceplanes "Wide: Earth and X-37B LEO orbits") use exactly the Tour camera (`at`/`look` identical)**, so they are not wide and look the same as preset 0; at t=0.7 RPO Wide shows the close Russian LEO shot under a "GEO belt" name.

## Evidence
**Laser 94.** Bright magenta beam locks White Sands to a haloed gold MSTI-3 at every t and preset, at both widths; Follow, Side and Zoom are distinct; 375 labels shortened and clean; Peresvet pins preset honest. Live still: clear Earth, beam, MSTI-3 and real title/cite footer. Static 1440/375 and static still: Earth, beam and a labelled MSTI-3 with a clean footer. Dings: no actual dazzle/glare on the sensor (beam only); Peresvet preset is identical at t=0.3 and 0.7 (static map); static still has "MSTI-3" chip jammed against the White Sands label and the tiny satellite; beam is thin at 375.
**SJ-21 93.** Follow preset reads well (approach, docked pair with halo, tow trail, separation arc, honest "Arm: illustrative" chip); presets are distinct (follow, whole event, side, pull, wide); static view shows a large pair with a visible arm on SJ-21 and a labelled Compass G2; real titles on both stills. Dings: the arm is a thin boom that is hard to see in live 3D (reads as two bus blocks); on "Whole event" the Earth is cropped at the top and the pair is a tiny blob at the bottom; GEO orbit line passes through the craft at default t=0.2/0.6; live still pair is a small glowing blob at the ring edge; static "GEO belt" and "Compass G2" labels touch the solar panels and the craft float below their orbit; 375 Wide labels (GEO belt, Compass G2) crowd.
**RPO 93.** Episode lock is clear and correct, nation colours, USA 271 handover halo, Cosmos 2543 burn, labels fit at 375, three-panel static legible with source footer. Dings: Wide = Tour (above); "Cosmos 2543 (subsatellite)" chip overlays the Earth limb at Russia t=0.3/0.7; static 375 panels are small (craft are dots, "Earth (not to scale)" italic floats over the panel); live still craft small in a three-panel layout; at t=0.6/0.7 default the context inset overlaps the Earth limb.
**Spaceplanes 94.** X-37B (blue) and gold CSSHQ with a wake are distinct; OTV-7 against the GEO ring is the standout; LEO fan, OTV-7 and CSSHQ presets each tell their story; captions accurate; static view clean with a legend. Dings: Wide = Tour (above); CSSHQ white wake is overbright and long, and the spaceplane models are oversized relative to Earth; live still has a large odd-angled X-37B beside a small Earth; static X-37B/CSSHQ marks are tiny; at 375 the static legend sits on the Earth and the OTV-7 orbit is clipped at the top edge.
**Visual impact 94 / Graphics 92 / Fun 94.** Blue Marble Earth with rim glow, bloom, beams, wakes, halos, nation colours; episode presets with episode-named slider are real user control. Graphics held under 93-95 by low-poly craft, orbit lines drawn through models, oversized wake streaks, leader/label crowding at 375 static, and duplicate/idle presets (Wide = Tour, Peresvet static).

## Fixes for anything under 93
- Graphics (92): fade orbit lines within the craft radius (SJ-21 default, RPO/Spaceplanes tours); cap the CSSHQ wake length/brightness; reduce X-37B/CSSHQ model scale vs Earth in live stills.
- Make the Wide presets actually wide: RPO `at` about [30,90,8], `look` [0,121,0] so the Earth and full GEO ring show; Spaceplanes `at` about [40,-25,8]; also fix the RPO Wide name or its t mapping so it does not show the Russian LEO close-up.
- (Polish toward 95+) SJ-21: thicker/longer boom with a contrasting colour on the follow camera; tighten the "Whole event" camera so Earth is not cropped. RPO: raise 375 static panel label/craft size; move the Cosmos 2543 label off the limb. Spaceplanes: move the static legend off the Earth at 375 and keep OTV-7 inside the frame. Laser: add a glare/bloom flare on MSTI-3 so "dazzling" reads.
