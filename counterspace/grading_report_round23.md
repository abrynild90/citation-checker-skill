# Round 23 grading (stills, statics, laser, regressions)
Method: Playwright/SwiftShader, no page errors. Real titles/cites from config.js (SCENES imported in page). 26 stills (live after 4.5 s play; static under reducedMotion) viewed as live|static pairs; 13 static views x 1440 and 375 as sheets; SJ-21 / DN-2 / Starfish live t=0.3/0.7 at both widths; laser live t=0.2/0.4/0.6/0.85 at both widths. Scripts deleted, server stopped by PID.
earthReady: true in all 26 stills and views once a scene is open. A real user (normal load, no routing) has earthReady false on the bare page after 6 s (texture is lazy), and true about 6 s after opening any scene, so they get the Earth texture. Not a defect.
| Item | R22 | R23 |
|---|---|---|
| PNG stills overall (26) | 92 | 93 |
| Static views overall (13 x 2) | 92 | 93 |
| Laser static/still | 93 | 94 |
| Laser scene overall (spot-checked) | 94 | 94 |
| SJ-21 / DN-2 / Starfish regressions | about 93 | none (about 93) |
## Round-22 defects
- Oversized static markers: FIXED. Diamonds (Xichang in Fengyun/DN-2/Shakti, Plesetsk/Nudol, White Sands) are about 16-20 px at 1440 in views and small in stills; airliners (GNSS, Solwind) and the Viasat marker are small. Slightly prominent only in the Shakti/Fengyun views.
- DN-2 static label stack: FIXED. GEO ring, 10,000 km and Apogee are separate in the view (1440 and 375) and in the still (GEO ring above, Apogee below, 10,000 km left). Nit: the 10,000 km box sits on the GEO ring line in the still.
- Starfish live-still leaders: PARTLY. Radiation belt leader is short and clean, but Satellite/Detonation/Thor leaders still drop through the centre column of field lines. Labels are large and stacked over the globe.
- Starfish at 375: FIXED in static (Satellite label has a leader and clear of icon; Detonation and Johnston Is. are separate). Live is tidy at t=0.3/0.7 (labels outside belt, short leaders); Detonation leader crosses field lines at t=0.7.
- Laser MSTI-3/MIRACL label separation: FIXED. Live, labels are far apart at every t and both widths. Static still/view: MSTI-3 at left and MIRACL right of the beam at the same height range, a clear gap. At 375 the MIRACL label sits over the beam on the globe edge but is legible.
## Evidence and fixes to reach >=93
1. Stills (93): all 26 have correct banner, title, cite and Blue Marble line, 3000 px. Remaining dings: Starfish live leaders (above); RPO live still shows three cramped panels with tiny in-panel captions; Spaceplanes static Earth small with legend close to the caption; Fengyun static Debris ring leader crosses the globe. Fixes for 94+: route Starfish live-still labels to the left/right outside the belt with leaders off the field lines; enlarge RPO live-still captions.
2. Statics (93): all 13 x 2 render, no clipping, no overlap. Dings: Spaceplanes 1440 GEO ring and OTV-7 orbit clipped by the frame and legend near the caption; Cosmos 1408 375 Impact/Nudol/Plesetsk are tight (distinct); GNSS 375 GPS label sits across the lower limb; laser 375 beam short (about 110 px). Fixes for 94+: fit Spaceplanes ring inside frame, fan the Cosmos labels at 375.
3. Laser static/still (94): titles, cite, footer right; globe large, beam long; MSTI-3 and MIRACL separated. Ding: White Sands diamond a little large; 375 MIRACL on limb.
4. Laser overall (94): 8 spot shots show beam, MSTI-3, White Sands, readable labels, caption swap at t=0.85; nothing overlaps the beam; leaders short. Dings: labels small at 1440, 375 leaders thin.
5. Regressions: SJ-21, DN-2, Starfish live at t=0.3/0.7 at 1440 and 375, plus their statics, all fully render (arm note, docked pair, DN-2 path/GEO ring/apogee, field lines/ring). No regressions. Notes: Starfish 1440 labels small; DN-2 375 t=0.7 Apogee label near the 10,000 km label (distinct).
