# Round 19 grading (laser focus, stills, statics)
Method: Playwright/SwiftShader, no page errors. Real titles/cites from config.js SCENES to `host().stillPNG`. Laser live presets (4 cams x t=0.2/0.4/0.6/0.85) at 1440 and 375, static at both widths, live+static stills; 13 live stills, 13 statics x 2 widths as contact sheets. Script deleted, server stopped by PID.
| Item | R18 | R19 |
|---|---|---|
| Laser dazzling scene overall | - | 90 |
| Laser static/still | 92 | 90 |
| PNG stills (13 live re-viewed) | 93 | 91 |
| Static views (13 x 1440/375) | 94 | 94 |
## Round-18 laser defects
- Static beam thin and tapered: FIXED (thin magenta line, no blob at 1440 or 375).
- MSTI-3 off the limb: MOSTLY FIXED at 1440 (satellite drawn outside the disc on the orbit ring, clear label). At 375 the icon still sits on the atmosphere glow, touching the limb, with the beam very short.
- Live still beam and MSTI-3 restored: NOT FIXED. Live still is a zoomed Earth crop showing only the White Sands label and caption "MSTI-3 rises over White Sands"; no satellite, beam or laser visible. Still-time/camera still frames a pre-pass moment (stillCam/still t must be ~0.5-0.6 with both ends in frame).
## Evidence
- Laser live presets are strong: all 4 cams show beam, MSTI-3, White Sands with leaders at 1440 and 375, labels legible; t=0.85 shows "Same principle" caption. Cam 4 (Russia) shows Peresvet pins only (intended). Minor: 375 labels sit on the beam at t=0.4 (MIRACL beam / White Sands crowd) and 1440 leaders are long and faint.
- Laser static: good composition, thin beam; MSTI-3 and beam are small (~4% of diagram), Earth shows a lot of unused dark ocean.
- Stills (13 live): all uniform with correct real titles/cites/footers, no regression elsewhere. Held back by the Laser live still, Solwind (ASM-135 unlabelled, small Earth), Burnt Frost/Shakti short stubs, DN-2 glow clipped by bands, Viasat labels crowd the top edge.
- Statics: all 13 intact at both widths; remaining dings carried over: GNSS airliner icons large over the Baltic, Starfish/Solwind satellite icons cover Earth centre, Viasat outer ring clipped at 1440.
## Fixes to reach >=93
1. Live laser still: set still time ~0.55 with a camera that includes both White Sands and MSTI-3 (like preset 1/2) and keep beam drawn; this alone lifts Laser to ~93 and stills to ~93.
2. 375 static: push MSTI-3 further out (staticK phone) so it clears the glow; lengthen beam.
3. Cap static airliner/satellite icon area; label ASM-135 in Solwind still.
