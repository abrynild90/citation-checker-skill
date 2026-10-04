# Type2 S grade (hero, overlay UI, Solwind, Starfish, GNSS, SJ-21, RPO, Spaceplanes, Laser, static, stills, graphics)

Method: Playwright/SwiftShader, fresh. Live default camera at t=0.2/0.4/0.6/0.85 at 1440 and 375 for Solwind, Starfish, GNSS, SJ-21, RPO, Spaceplanes, Laser. Every preset clicked through the chip buttons at t=0.3/0.7 at both widths. Hero live and static at both widths. Static (reducedMotion) views of all 13 at 1440 and 375. All 26 stills via `host().stillPNG(title, cite)` with the real titles from src/scenes/configs (RPO reads "(2019–2026)"), exported under reducedMotion; all 26 exported, all 3000x1875, with correct title, cite and Blue Marble line. Contact sheets, about 45 images read. **Page errors (pageerror + console error, all contexts): 0.** Scripts deleted, server stopped by PID.

| Item | Prev | Score |
|---|---|---|
| Hero globe | 92 | 92 |
| Scene overlay UI | 92 | 93 |
| Solwind | 90 | 92 |
| Starfish | 92 | 93 |
| GNSS jamming | 92 | 94 |
| SJ-21 tug | 93 | 94 |
| RPO | 93 | 95 |
| Spaceplanes | 94 | 95 |
| Laser | 94 | 95 |
| Static fallback, 13 views | 93 | 94 |
| PNG stills, 26 | 93 | 93 |
| Graphics, laser/new-scenes group | 92 | 94 |

## Round-defect check
- Solwind static reframe: **fixed in the static view** (globe now large, ASM-135, F-15, Solwind and LEO chips separated, no longer empty). Partly open in the still (see below).
- Starfish Near/Polar/Wide labels: **fixed.** Wide opens Detonation, Johnston and Thor apart. Near keeps Johnston and Detonation labels at every t. Polar labels are readable. Leftovers: Near t=0.7 drops the Thor label, and Polar leaders still run as long verticals.
- Status captions 14 px on desktop: **fixed.** Captions read clearly in 1440 frames, single line at 1440 and 375.
- GNSS: **fixed.** Airliner B clears the caption (t=0.2 still sits near the inset), the GPS signal label sits on the beam, and Close-up is much tighter on the dome.
- RPO and Spaceplanes Wide: **fixed.** Both now show the whole Earth and GEO belt or orbits. They are distinct from Tour and keep their own labels.
- SJ-21: **fixed.** The orbit line fades at the craft, and the arm is now a visible boom with a hand on both craft (still thin in the Compass G2 live view).
- CSSHQ wake and model scale: **fixed.** The wake is short and bounded, and the models are in proportion to Earth in the tour and episode presets.
- Laser: **fixed.** Starburst glare is on MSTI-3 in every preset, and the Peresvet pins drift between t=0.3 and 0.7.
- RPO title "(2019–2026)": **fixed** in the still and the static view.

## Evidence
- **Hero 92.** 1440 live has ISS, LEO, GEO and MEO leaders, clean rings and shells, but the stage is wide and short, so the globe is small and the rings are cut by the top edge. 375 is a large, tidy composition. Static 1440 is clear, with the ISS chip floating low. Unchanged from the last grade.
- **Overlay UI 93.** The banner, caption and footer stay clear of the subject at every preset. Chips are pressed correctly and the 375 labels are short. Dings: the Starfish Near/Polar leaders are long, the GNSS 375 Close-up caption touches Airliner B at the bottom edge, and the RPO context inset overlaps the limb in some presets.
- **Solwind 92.** The live fragment cloud and shock ring are strong at both widths, and the labels are tidy. The static view is much improved. The still stays weak: the globe is about 30% of the frame width and sits left of centre with the right half empty. The satellite is also tiny, and the "Solwind P78-1" chip sits a little away from it.
- **Starfish 93.** The detonation, belt build-up and pink damaged-satellite label read well. The Wide/Near/Polar labels are separated. Dings: the Near t=0.7 Thor label is missing, the Polar vertical leaders overlap the field lines, and the static view still has leaders crossing the field lines.
- **GNSS 94.** The red dome, red/green airliners, GPS beam and Europe+GPS preset are clear. Dings: the inset still takes the lower-left corner, and the 375 Close-up bottom edge is tight.
- **SJ-21 94.** Presets are distinct. The orbit no longer skewers the craft, the arm is visible, and the docked pair and tow trail read well. Dings: the "Whole event" craft is small at the bottom, and in the static view the "GEO belt" and "Compass G2" chips touch the solar panels.
- **RPO 95.** Episode lock is correct and Wide now shows the full GEO belt with all craft. The nation colours, USA 271 halo and Cosmos 2543 burn read well, and the 375 captions are shortened. Minor: the Wide labels crowd at 375 and "Cosmos 2543" sits on the limb. The static three-panel still has small craft.
- **Spaceplanes 95.** X-37B and CSSHQ are in proportion with a short wake. The OTV-7 episode and Wide read well, and the static legend is clean. Minor: at 375 Wide the OTV-7 and GEO labels are small.
- **Laser 95.** The beam, the MSTI-3 glare, the Follow/Side/Zoom presets and the Peresvet pins all read well. Minor: the static still has no glare, and the beam is thin at 375.
- **Static 94.** All 13 have separated, coloured chips with leaders at 1440 and legible chips at 375. Solwind is repaired. Remaining: SJ-21 chips on the panels, and the Starfish leaders crossing field lines.
- **Stills 93.** Titles, cites and the Blue Marble line are correct on all 26. Solwind is under-filled, and 13 of 26 are byte-identical across 1440 and 375 (checked for laser). Strong stills: Fengyun, Laser, GNSS, SJ-21, RPO and Spaceplanes.
- **Graphics 94.** Earth, glow, beams, halos and models are consistent, and the earlier oversize wake and orbit-through-craft problems are gone.

## Fixes for anything under 93
- Hero (92): make the 1440 stage taller or zoom the camera so the globe and outer ring fit the stage without the top-edge crop.
- Stills (93): reframe the Solwind still (centre the globe, zoom about 1.5x). Optionally make the 375 stills differ from the 1440 ones, since 13 of 26 are identical.
- Polish toward 95: SJ-21 static chip offsets (GEO belt and Compass G2 off the panels). Starfish Near t=0.7 should keep the Thor label, and the Polar leaders should be offset. Add the MSTI-3 glare to the static still.
