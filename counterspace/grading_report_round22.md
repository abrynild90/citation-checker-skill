# Round 22 grading (laser, stills, statics, regressions)
Method: Playwright/SwiftShader (Blue Marble routed in), 0 page errors in static runs. Real titles/cites from config.js. Live stills after 3.5 s play (laser also t=0.3); static stills under reducedMotion. Laser 4 cams x t=0.2/0.4/0.6/0.85 at 1440 and 375; 26 stills viewed in live/static pairs; 13 statics x 2 widths as sheets; Starfish/Solwind/GNSS/DN-2 t=0.3/0.7 at both widths. Scripts deleted, server stopped by PID.
| Item | R21 | R22 |
|---|---|---|
| Laser dazzling scene overall | 93 | 94 |
| Laser static/still | 92 | 93 |
| PNG stills overall (26) | 92 | 92 |
| Static views overall | 93 | 92 |
| Starfish/Solwind/GNSS/DN-2 live regressions | n/a | none (about 93) |
## Round-21 defects
- Laser beam length: FIXED. Static camera now frames N. America with MSTI-3 pulled out of the globe; beam about 250 px at 1440 and about 110 px at 375 in the static view, and long in the still.
- MIRACL leader: FIXED. Label sits beside the beam end/MSTI-3 label with a short leader, no longer crossing Canada. MSTI-3 icon still sits on the orbit ring (arguably correct).
- Oversized icons: FIXED in live stills (GNSS airliners small). NOT fixed in static views/stills: large white diamonds (Xichang in Fengyun, Shakti, DN-2; Plesetsk/Nudol in Cosmos 1408), large white airliners (GNSS static two, Solwind static), red diamond in Viasat. About 40-60 px at 3000 px still width.
- Solwind still labels: live FIXED (ASM-135 top, Solwind left, F-15 bottom, spread). Starfish live still: PARTLY. Labels are in a ring but leaders still cross the field lines at centre, Artificial radiation belt leader hangs in open space. Starfish static still is clean.
- DN-2 label stack: live FIXED; static still/view NOT fixed (Apogee, GEO ring, 10,000 km boxes stacked touching at lower right, 1440 and still); at 375 shortened labels are separated but tight.
- Starfish at 375: PARTLY. Static: Satellite label touches its icon, Detonation/Johnston merged. Live: labels cluster at right with long leaders; legible, no overlap.
## Evidence per item
1. Laser overall (94): all 32 shots show beam, MSTI-3, White Sands, readable labels, caption swap at t=0.85, cam 4 pins clear. R21 dings fixed or minor: cam1 t=0.4 at 1440 MIRACL label overlaps the beam (grazes it); cam1 375 t=0.4 White Sands/MIRACL labels tight; Teykovo and Yoshkar-Ola rings at 375 still adjacent (not overlapping); cam 4 identical at all t (by design).
2. Laser static/still (93): static view and still correct title, cite, footer; globe large, beam long, labels not stacked on the limb. Live still correct at play and t=0.3 (MSTI-3 leader fine, White Sands label right at the beam end). Dings: MSTI-3 and MIRACL labels adjacent at top; white site diamond slightly large; at 375 MIRACL label sits on the globe edge.
3. Stills (92): all 26 correct banner/title/cite/Blue Marble line, uniform 3000 px. Live gains: Solwind labels spread, small GNSS airliners. Remaining: static icon oversize (above), DN-2 static stack, Starfish live leaders crossing, Spaceplanes static Earth small, Fengyun static SC-19 label next to oversized diamond.
4. Statics (92): all 13 x 2 intact, no clipping, laser improved. Carried dings: oversized diamonds/airliners (Fengyun, Shakti, Cosmos, DN-2, GNSS, Solwind), DN-2 stack, Starfish 375 crowding, Cosmos 1408 375 cluster (Impact/Nudol/Plesetsk/ISS), Spaceplanes legend near caption. One point down because the icon defect list persisted another round.
5. Regressions: Starfish, Solwind, GNSS, DN-2 at t=0.3/0.7 at 1440 and 375 render fully (field lines, debris, jammer zone, GPS beam, GEO ring, captions). No regressions. Notes: Starfish 1440 labels small; GNSS 375 t=0.3 Airliner B clipped at the left edge/under caption; Solwind 375 t=0.7 drops the Solwind label (intended).
## Fixes to reach >=93 (items below 93)
- Stills (92) and Statics (92): cap static marker size (diamond/airliner/satellite) at about 20-24 px at 1440 (about 28 px at 3000 px still) for Xichang, Plesetsk/Nudol, Viasat site, airliners; unstack DN-2 static labels (move Apogee up beside the red path, GEO ring left of the ring, 10,000 km inside the globe); in Starfish live move leaders off field lines (place labels outside the belt, drop the Artificial radiation belt vertical leader); at 375 offset the Starfish Satellite label from its icon and split Detonation/Johnston; fan out Cosmos 1408 375 labels.
- Laser static (93, at threshold): split MSTI-3 and MIRACL labels by one label height; move MIRACL label off the limb at 375.
