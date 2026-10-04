# Round 17 grading (static views, 26 PNG stills, regression spot-check)
Method: Playwright/SwiftShader, no page errors. Real titles/cites read from src/scenes/config.js (SCENES) and passed to `await host().stillPNG(title, cite)`. Live stills with the GL host at t=0.6, 1440x900. Static stills under reducedMotion 'reduce' (host() stand-in). Static views: all 13 at 1440 (2 sheets) and 375 (2 sheets). All 26 stills opened individually (live over static, 1500 px wide). Test scripts deleted, server stopped by PID.
| Item | Score |
|---|---|
| Static fallback views (13 x 1440/375) | 92 |
| PNG stills (26) | 93 |
| Regression: overlay UI | 94 |
| Regression: Laser static | 93 |
| Regression: SJ-21 static | 92 |
| Regression: RPO static | 93 |
| Regression: Spaceplanes static | 94 |
## Round-16 defects
- Uniform sizes: FIXED. All 26 stills are exactly 3000x1875 (live and static, RPO included). Footers (real title, Source, "Earth imagery: NASA Blue Marble") identical in both sets; real titles/cites render correctly (long SJ-21 and Spaceplanes titles fit).
- Framing: mostly fixed. Static stills keep the Earth centred with ring and labels inside the frame. Live stills still leave dead margin: Earth is about 1/3 of frame width in Starfish, Solwind, Fengyun, Burnt Frost, Shakti (about 40% of frame height). Live Cosmos 1408 ring runs into the caption band; live SJ-21 gold ring is clipped at the left and bottom edges.
- Leaders: PARTLY. Static stills have coloured, readable leaders on every chip. Live stills use short stubs, and the Starfish, Solwind, Fengyun and Shakti live labels sit on the Earth with little or no leader. Solwind live shows only "F-15 zoom climb" (no Solwind or ASM-135 label).
- RPO panels: FIXED in the stills. The static still has 3 framed panels with coloured chips and the Earth is no longer a tiny disc; the live still is a 3-panel row. Not fixed: static panel 3 still shows a cropped Earth with the "Earth (not to scale)" tag, and panel 1 Earth is small. In the 1440 and 375 static views the three panels are narrow and cramped.
- DN-2 / SJ-21 static Earth: PARTLY. In the stills the full ring now fits and the Earth is about 27% of the frame width (was 1/3 of a clipped ring), the SJ-21 pair sits off the ring with a leader. In the static views the ring is still clipped at the left and right panel edges (DN-2 1440 and 375, SJ-21 1440 and 375), and the 375 SJ-21 pair is clipped at the right edge.
## Evidence and fixes
- Static views 92: Blue Marble Earth, "Static diagram" notice, Export still, scroll cue on all 13 at both widths. Dings: DN-2 and SJ-21 rings clipped at panel edges; RPO narrow panels with cropped Earth; Nudol ISS icon is huge and covers the Earth (also in the still); 375 GNSS label cluster; Laser MSTI-3 sits on the Earth with a chunky beam. Fix: fit rings to the panel (scale to the shorter side), cap ISS icon size, drop the cropped-Earth panel 3 in favour of a limb at the panel bottom with the tag in a corner, enlarge RPO panels (stack at 1440 aside width or 2+1 layout).
- Stills 93: uniform and complete, real titles and cites, static set is strong and consistent. Held back by the live set: Earth small with dead margins, short leaders, SJ-21 ring clipped, Cosmos ring touching the caption, Solwind live missing its Solwind/ASM-135 labels. Fix: zoom live stills so the Earth fills at least 60% of frame height, extend live leaders to chips like the static set, fit the SJ-21 and Cosmos rings, label Solwind and ASM-135 in the live still.
- Overlay UI 94 (no regression): title, prev/next, close, scroll-for-more cue, source, law link, Export still all intact at 1440 and 375. 375 aside text area is still short.
- Laser 93: static Earth fills well, beam in magenta, labels clean; MSTI-3 over the Earth edge and beam blob chunky. Live still excellent (beam and satellite clear). Fix: thin the static beam, move MSTI-3 off the limb.
- SJ-21 92 (was 93 in R16 S3): the still is improved (full ring, pair off the ring), but the live still ring clips and the 375 static Earth/ring/pair are clipped at both edges. Fix: fit ring and pair in the 375 static viewBox, scale down the live still ring.
- RPO 93: three coloured episodes, real caption, uniform still. Cropped "Earth (not to scale)" panel and cramped static view remain.
- Spaceplanes 94 (no regression): static legend now sits clear of the Earth, labels offset and readable, OTV-7 orbit prominent, live still shows OTV-7 orbit and CSSHQ.
## Regression note
No regressions in overlay UI, Laser or Spaceplanes. SJ-21 static at 375 is the only weaker spot (ring/pair clipped) and RPO/SJ-21 live still framing are the remaining blockers for >=94.
## To reach >=93 everywhere
Static views: fit rings (DN-2, SJ-21) inside the panel at both widths and fix RPO panel 3 Earth. Everything else is already at or above 92-93.
