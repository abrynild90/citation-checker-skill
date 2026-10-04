# Re-grade, slice S1 (strict, fresh)
Method: Playwright/SwiftShader, real titles/cites imported from SCENES. 26 stills (live after ~4.5 s play, static under reducedMotion) opened as pairs: 13 of 13 pairs examined via 7 individually (Starfish, Solwind, Fengyun, RPO, Burnt Frost, MIRACL, Cosmos 1408) plus the matching 1440/375 view sheets for the rest (sj21, gnss, viasat, shakti, dn2, spaceplanes judged via sheets; export succeeded for all 26, titles/cites/Blue Marble line correct). Hero live at 1440/375. Starfish/Solwind/Fengyun live at t=0.2/0.6/0.85 at 1440 and 375. Scripts deleted, server stopped by PID.
**Page errors (pageerror + console error, live and static, both widths): 0. Failed exports: 0.**
| Item | Prev | Now |
|---|---|---|
| Hero globe | 91 | 92 |
| Scene overlay UI | 92 | 92 |
| Static fallback (13 x 2) | 94 | 95 |
| PNG stills (26) | 92 | 93 |
| Starfish | 91 | 91 |
| Solwind | 92 | 92 |
| Fengyun-1C | 93 | 94 |
| Visual impact / graphics / fun (slice) | 93 | 93 |
## Previous defects, status
1. Live stills oversized labels/long leaders: partly fixed. Fengyun live still now labels Debris ring and Impact (fixed); Cosmos, MIRACL (now shows a normal crop) and Burnt Frost live stills are clean; Starfish live still still stacks Detonation/Johnston in one column over the field lines and "Radiation belt" is a bare leader (not fixed).
2. Starfish leaders: not fixed at t=0.6 (Detonation/Thor leaders still cross field lines; labels are tiny in the 1440 captures). 375 version better (Radiation belt chip, Johnston Is. short).
3. Solwind: partly fixed. ASM-135 still sits above the globe on a long vertical leader in the live still; but the crossing-leader problem is gone, and "Solwind P78-1" is retained in the 375 view and "Impact: Solwind P78-1" shows at t=0.6/0.85.
4. RPO live still: fixed. Three panels now side by side with larger titles; static has 2+1 layout at 375 and readable captions.
5. Hero live: partly fixed. 375 shows ISS/LEO/GEO/MEO colour chips; 1440 live has LEO/GEO/MEO but no ISS chip. Globe still starts below the fold at 1440 (needs scroll).
6. Static: Burnt Frost "Larger pieces falling" now beside the debris, shortened to "Pieces falling" at 375 (fixed); Cosmos 1408 375 labels are spaced (fixed); DN-2 10,000 km label off the GEO ring line (fixed, leader still brushes the path).
7. Live caption size vs static: not fixed. Live still captions are still small (about half the static caption).
## Evidence
- Hero: live chips colour-coded, orbit rings and shells attractive; 375 is the better composition. ISS missing at 1440; fold position unchanged.
- Overlay UI: banner always legible, captions clear of globe, correct titles/cites. Live caption is small in stills and Starfish live labels are small at 1440 views; hence no gain.
- Static: all 13 at both widths have separated, colour-coded labels with leaders; 375 chips readable, spaceplane legend and RPO stacks clean. Small nits: Starfish 1440 Johnston/Thor/Detonation stack tight; GNSS 375 "GPS signal" chip sits over the lower globe edge; Shakti Impact/Abdul Kalam labels crowd the plume.
- Stills: static 3000 px strong and consistent; live now good for Fengyun, Cosmos, MIRACL, RPO, Burnt Frost; weaker for Starfish and Solwind.
- Starfish: glowing field lines, belt and detonation flash striking at t=0.2; t=0.6 leaders cross lines; t=0.85 pink damaged-satellite label clear.
- Solwind: dramatic orange plume and shock ring at t=0.6/0.85; t=0.2 satellite small; labels tidy and not crossing; 375 clear.
- Fengyun: best of slice; ring reads at every t and width; Debris ring label now persists at 0.85; Impact and Xichang labelled; ring thin at 375.
## Fixes to reach >=93 (items under 93)
- Hero (92): add ISS chip at 1440 live; shorten the hero stage offset or reorder so the globe sits within the first viewport at 1440.
- Overlay UI (92): raise live caption size in stills/views to match static caption (about 1.6x); enlarge Starfish live label type at 1440.
- Starfish (91): move Detonation/Johnston labels left of the field-line column, route Thor leader outside lines, anchor "Radiation belt" with a chip like the 375 version.
- Solwind (92): put ASM-135 beside the missile track (shorter leader, not above the globe); enlarge the satellite icon at t=0.2.
