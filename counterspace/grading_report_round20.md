# Round 20 grading (laser focus, stills, statics)
Method: Playwright/SwiftShader (CDN earth texture routed in), 0 page errors. Real titles/cites from config.js. Live stills exported after PLAY (3.5 s) and, for laser, after scrub to t=0.3 and 0.85. Static stills/views under reducedMotion. Laser presets 4 cams x t=0.2/0.4/0.6/0.85 at 1440 and 375. 13 live + 13 static stills, 13 statics x 2 widths viewed as sheets (stills at 2-up/4-up sheets, not one image each; image budget). Scripts deleted, server stopped by PID.
| Item | R19 | R20 |
|---|---|---|
| Laser dazzling scene overall | 90 | 92 |
| Laser static/still | 90 | 91 |
| PNG stills overall (26) | 91 | 92 |
| Static views overall | 94 | 94 |
## Round-19 defect: live laser still - FIXED
Live still after play and after scrub (t=0.3, 0.85) all frame White Sands, MIRACL beam and MSTI-3 with leaders, caption and footer; identical regardless of playback time. Earth is a regional crop (N. America), beam diagonal and readable.
## Evidence
- Laser live presets: all 4 cams x 4 t at 1440 and 375 show beam, MSTI-3, White Sands, legible labels; cam 4 shows Peresvet pins with "shelter sites" caption (intended); t=0.85 caption swaps correctly. Dings: cam 2 t=0.4 at 375 "MIRACL beam" label overlaps "White Sands"; cam 2 t=0.4 at 1440 MSTI-3 label sits on the beam end; cam 4 pins are tiny pink/white blobs with offset duplicate markers, no beam (reads empty); some 1440 leaders long/faint.
- Laser static (1440/375/still): thin beam, no blob. But the diagram is weak: beam only ~25 px, MSTI-3 and White Sands crowd the limb at the top right, three labels stack there, Earth centre/Pacific is unused dark ocean, orbit ring clips the limb.
- Stills: all 26 uniform (correct titles/cites/footers, banner, 3000x1875). Live: Starfish labels cluster at centre and overlap field lines; Solwind small Earth, ASM-135 label leader crosses sprite; Burnt Frost has no SM-3 label; Shakti/Burnt Frost halos clipped; Viasat labels at top edge; rpo composite fine. Static stills: GNSS airliner icons huge over Baltic, Starfish/Solwind satellite icons cover Earth centre, DN-2 label stack at lower right dense.
- Statics (13 x 2): all intact; same carried dings (airliner/satellite icons large, Viasat outer ring clipped at 1440, DN-2 labels crowded, Spaceplanes legend close to caption).
## Fixes to reach >=93
1. Laser static: rotate/zoom the static camera to centre N. America, lengthen beam and push MSTI-3 clear of the limb (>=60 px beam), spread the three labels.
2. Laser live: de-collide MIRACL/White Sands/MSTI labels at t=0.4 (375 cam 2); give cam 4 a visible beam/ring or larger site pins.
3. Cap airliner and satellite icon size in Starfish, Solwind, GNSS statics and stills; label SM-3 in Burnt Frost live still; move Starfish still labels off the field lines.
4. Declutter DN-2 and Viasat label stacks and clipped rings.
