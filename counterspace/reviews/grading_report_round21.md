# Round 21 grading (laser, stills, statics, regressions)
Method: Playwright/SwiftShader (earth texture routed in), 0 page errors. Real titles/cites from config.js. Live stills after 3.5 s play (laser also at t=0.3); static stills/views under reducedMotion. Laser 4 cams x t=0.2/0.4/0.6/0.85 at 1440 and 375 (2x2 sheets); 26 stills viewed 2 per image; 13 statics x 2 widths viewed as sheets; Starfish/Solwind/Burnt Frost t=0.3/0.7 at both widths. Scripts deleted, server stopped by PID.
| Item | R20 | R21 |
|---|---|---|
| Laser dazzling scene overall | 92 | 93 |
| Laser static/still | 91 | 92 |
| PNG stills overall (26) | 92 | 92 |
| Static views overall | 94 | 93 |
| Starfish/Solwind/Burnt Frost live regressions | n/a | no regressions (about 93) |
## Round-20 defects
- Laser static recentred, longer beam: FIXED in part. N. America centred, three labels spread (MIRACL top right, MSTI-3 left, White Sands left) and no longer stacked on the limb. But the beam is still short (about 100 px at 1440, about 50 px at 375) because the whole globe plus LEO ring is shown; the MIRACL leader crosses Canada; at 375 the Earth is about 165 px and White Sands/MIRACL labels crowd the beam. Still: MSTI-3 icon sits on the orbit ring.
- Laser live label collision: FIXED at 375 cam 2 t=0.4 (labels stacked adjacent, not overlapping). Remaining: 1440 cam 1 t=0.4 MSTI-3 label still sits on the beam-end glow; 375 cam 1 t=0.4 MIRACL label tight under White Sands.
- Laser cam 4 empty: FIXED. Peresvet pins are now clear rings with labels at both widths. Dings: at 375 Teykovo and Yoshkar-Ola rings overlap; scene is identical at all t (static by design).
- Burnt Frost live still SM-3 label: FIXED (SM-3 and USS Lake Erie labelled). Static still also has SM-3 label.
- GNSS airliner size: live still FIXED (small). Static still and static view NOT fixed: two huge white airliner icons over the Baltic, one covers the jammer ring (1440 and 375).
- Starfish/Solwind static satellite icons: NOT fixed. Starfish static still shows large panel satellite over Asia; Solwind static shows oversized airliner over N. America plus big satellite; 375 Starfish crowds satellite, Johnston, Thor and Detonation.
- Starfish live still labels off field lines: partly. Labels still cluster at the centre with long crossing leaders; "Artificial radiation belt" sits on field lines.
- DN-2 label stack: NOT fixed (Apogee, GEO ring, 10,000 km stacked at lower right in still and 1440 view).
- Viasat clipped ring: FIXED (ring fits in still and views).
## Evidence per item
1. Laser overall (93): all 32 preset shots show beam, MSTI-3, White Sands, legible labels, correct caption swap at t=0.85, cam 4 pins readable. Dings above; beam sparkle fine. Earth crops are good.
2. Laser static/still (92): both stills correct titles/cites/footers, 3000x1875; live still frames site, beam, MSTI-3 identically at play and at t=0.3. Static diagram readable but beam short and globe-small at 375.
3. Stills (92): all 26 uniform and correct (banner, title, cite, Blue Marble line). Live gains: Burnt Frost SM-3 label, small GNSS airliners, Viasat labels clear of the edge. Remaining: Starfish and Solwind live label clusters (Solwind Earth small, three labels on one blob), static icon oversize (Starfish, Solwind, GNSS), DN-2 stack.
4. Statics (93): all 13 x 2 intact, no broken layouts, no clipping; sim.js static-position change caused no regression (Viasat ring now fits, laser recentred). Carried dings: airliner/satellite icons oversize, DN-2 stack, Starfish 375 crowding, Spaceplanes legend near caption. Score drop 1 point because the icon defects were listed last round and remain.
5. Regressions: Starfish, Solwind, Burnt Frost at t=0.3/0.7 at 1440 and 375 render fully (field lines, debris, labels, captions). None found. Notes: Starfish labels tiny at 1440, Solwind t=0.7 at 375 drops the Solwind label (intended post-impact).
## Fixes to reach >=93 (items below 93)
- Stills (92): cap airliner and satellite icon size in Starfish, Solwind and GNSS static (e.g. max about 28 px at 3000 px width); spread Solwind live-still labels around the blob; move Starfish live labels off the field lines; unstack DN-2 labels.
- Laser static (92): zoom the static camera to N. America so the beam is >=200 px at 1440 and >=100 px at 375; route the MIRACL leader clear of the Canada limb; shift MSTI-3 icon off the orbit ring.
- Laser overall (93, at threshold): move cam 1 t=0.4 MSTI-3 label off the beam end; separate Teykovo/Yoshkar-Ola rings at 375.
