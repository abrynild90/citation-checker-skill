# Round 18 grading (static views, 26 PNG stills, SJ-21 overall, regression)
Method: Playwright/SwiftShader, no page errors. Real titles/cites imported from src/scenes/config.js SCENES and passed to `await host().stillPNG(title, cite)`; static stills via emulated reducedMotion (host() stand-in). All 26 stills 3000x1875 and viewed (<=2 per image, 1500 px wide). Statics: 13 x 1440 (2 sheets) and 13 x 375 (3 sheets), DN-2/SJ-21/RPO also individually at 1440. SJ-21 live: 5 presets x t=0.3/0.7 at 1440 and 375. Solwind live t=0.3/0.6. Scripts deleted, server stopped by PID.
| Item | Score |
|---|---|
| Static fallback views (13 x 1440/375) | 94 |
| PNG stills (26) | 93 |
| SJ-21 tug overall | 94 |
| Regression: overlay UI | 94 |
| Regression: Laser static | 92 |
| Regression: RPO static | 94 |
| Regression: Spaceplanes static | 94 |
| Regression: Solwind live | 94 |
## Round-17 defects
- DN-2 / SJ-21 rings clipped: FIXED at 1440 and 375 (rings fully inside the panel; SJ-21 pair inside at 375; DN-2 outer glow still crops at frame edges, acceptable).
- RPO cramped/cropped panel 3: FIXED. 1440 view is a 2+1 layout, panel 3 is a limb at the bottom with the "Earth (not to scale)" tag in a corner; 375 is three stacked strips. Panel 2 is still a heavy close-up and the tags sit just above the caption.
- Solwind live still labels: FIXED (Solwind P78-1 and F-15 zoom climb now shown, Earth about 70% of frame height). ASM-135 itself is still not labelled in the still (labelled in live t=0.3 and static).
- Live still dead margins: FIXED (Starfish, Solwind, Fengyun, Burnt Frost, Shakti Earth about 70% of frame height).
- Live SJ-21 ring clipped: FIXED (full ring, pair and GEO belt chip inside the frame). Live Cosmos ring no longer touches the caption (ISS chip sits about 20 px above it).
- Nudol ISS icon huge: FIXED (small ISS icon in static and still).
- Laser MSTI-3 on Earth, chunky beam: NOT fixed (static still: satellite on the Earth edge, thick magenta blob).
- Live leaders: partly. Starfish, Fengyun, Viasat, GNSS have clear leaders; Solwind, Burnt Frost, Shakti live stills use stubs or none.
## Evidence and fixes
- Static views 94: Blue Marble, notice, Export still on all 13 at both widths; rings and RPO fixed. Dings: GNSS static airliner icons are large and cover the Baltic/Earth; Viasat dashed outer ring clipped by panel edges (1440 and 375); Starfish and Solwind static satellite icons cover the Earth centre; 375 Starfish labels cluster ("Johnston Is." / "Detonation"). Fix to 96: cap airliner/satellite icon area (about 3% of disc), fit Viasat outer ring, spread Starfish 375 chips.
- Stills 93: all 26 uniform, correct footers, real titles and cites, static set consistent and strong. Live set now framed well. Held back by: live Laser still (zoomed close-up shows White Sands label but no visible MSTI-3, beam or laser; was "excellent" in R17), live DN-2 ring glow cut by header and caption bands, live Viasat/Burnt Frost/Shakti short stubs, static Laser blob and satellite on the limb, static Starfish/GNSS oversized icons. Fix to 95: restore the beam and MSTI-3 in the live Laser still (frame the pair), extend live leaders, thin static beam and move MSTI-3 off the limb.
- SJ-21 94 (live presets 1440 and 375 clean: labels do not overlap, docked label switches at t=0.7, "Arm: not shown" tag present; static 1440 and 375 ring and pair fit; stills both fully framed with long title/cite intact). Dings: 375 GEO-wide preset clips the docked pair at the right edge; Whole-event preset at 1440 shows the pair small/faint with the GEO chip far left; static pair icon overlaps the ring line. Fix: pad the 375 wide-preset camera, enlarge the pair in Whole event.
- Overlay UI 94: title, prev/next, close, scroll cue, source, law link, Export still all intact at 1440 and 375; 375 text area still short but scroll cue works.
- Laser static 92 (was 93): beam still a chunky blob and MSTI-3 on the Earth edge; live still lost its beam and satellite. Fix: as above.
- RPO static 94: coloured episodes, real caption, 3 framed panels, tags in corners, uniform still. Panel 2 Earth is a large crop.
- Spaceplanes static 94: legend clear of Earth, OTV-7 orbit prominent, labels readable; live still intact.
- Solwind live 94: t=0.3 shows ASM-135, F-15 zoom climb, Solwind P78-1 with leaders; t=0.6 shows debris cloud, "Impact: Solwind P78-1" and F-15; new still time (frame shows approach with Earth at 70% height) is good.
## To reach >=93 everywhere
Already at or above 93 in every item except Laser static (92): thin the beam, move MSTI-3 off the limb, and restore the Laser live still's beam/MSTI-3.
