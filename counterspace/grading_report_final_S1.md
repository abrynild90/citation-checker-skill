# Final grading, slice S1 (hero, overlay UI, static, stills, Starfish, Solwind, Fengyun-1C)
Method: Playwright/SwiftShader, real titles/cites imported from src/scenes/config.js (SCENES). 26 stills (live after 4.5 s play, static under reducedMotion) viewed as live|static pairs; hero live+static at 1440 and 375; 13 static views at 1440 and 375 (4 sheets); Starfish/Solwind/Fengyun live at t=0.2/0.6/0.85 at both widths. Not all 26 pairs were opened (viewed 11 of 13 pairs plus all statics on sheets; sj21, gnss, viasat, shakti, cosmos1408 stills judged via the matching views). Scripts deleted, server stopped by PID. Page errors: none observed (errs line not captured in the backgrounded log; no failed exports, all 26 stills produced).
| Item | Score |
|---|---|
| Hero globe | 91 |
| Scene overlay UI | 92 |
| Static fallback (13 x 2) | 94 |
| PNG stills (26) | 92 |
| Starfish | 91 |
| Solwind | 92 |
| Fengyun-1C | 93 |
| Visual impact / graphics / fun (slice) | 93 |
## Evidence
- Hero: static hero at 375 is polished (colour-coded LEO/GEO/ISS/MEO labels with leaders, orbit rings, readable caption panel). At 1440 the globe is below the fold; hero live and static look the same size and style, the live one has a lighter Earth texture early (lazy). Live labels are chips LEO/GEO only at 1440 (fewer than static: no ISS/MEO visible in crop). Fine, not exceptional.
- Overlay UI: banner "Illustrative, not orbit-propagated" always legible; captions sit at the bottom clear of the globe in live and static; real titles/cites/Blue Marble line correct in all stills. Ding: live captions are small (tiny in stills) vs the big static caption.
- Static views: all 13 at 1440 and 375 have separated labels with leaders; DN-2 stack clear (10,000 km box still touches GEO ring line); RPO 3 panels clean; Spaceplanes legend ok. Nits: Shakti/Fengyun Xichang diamond slightly large; Cosmos 1408 label cluster (Impact/Plesetsk/Nudol) tight at 375; Burnt Frost "Larger pieces falling" box covers the debris cloud.
- Stills: static stills strong (3000 px, title/cite/credit correct). Live stills have very large label type with long leaders that cross the globe: Starfish live still (Satellite/Detonation/Thor/Johnston stacked in one vertical column over the field lines, leaders overlap the lines and the radiation belt label is a bare leader off to the right); Solwind live (ASM-135 label far from its object, leader crosses the F-15 vertical leader); Fengyun live (only Xichang labelled, impact diamond unlabelled, debris ring unlabelled); Burnt Frost live (SM-3 / USS Lake Erie leaders overlap); RPO live has three tall cramped panels with tiny in-panel captions and small panel titles; MIRACL live crop heavily zoomed (Earth cut off) though labels are clean.
- Starfish live: 1440 t=0.2 good detonation glow; t=0.6 leaders cross field lines (Thor launch/Detonation lines converge); t=0.85 satellite-damaged label pink and clear. 375: tidy, labels outside belt, "Detonation" leader crosses lines at t=0.6. Good visual (glowing purple field lines, belt shell).
- Solwind live: strong (dramatic orange debris plume, shock ring, F-15 icon); labels fine; t=0.2 Earth only half-lit and the satellite icon small; 375 "Impact" label loses the "Solwind P78-1" name.
- Fengyun live: best of the three; debris ring is striking and reads at every t and width; t=0.2 view is a close zoom with SC-19 label clear; Debris ring label disappears at t=0.85; ring thin at 375.
## Fixes to reach >=93
1. Live stills: reduce label font (about 60% of current) and anchor labels to the side of the globe with short leaders; avoid stacking four labels in one column (Starfish), and add Impact/Debris ring labels to the Fengyun live still.
2. Starfish: route Thor/Detonation/Johnston leaders outside the field-line column; keep Detonation leader off the lines at t=0.6.
3. Solwind: place ASM-135 label next to the missile track, remove the crossing leaders; keep "Solwind P78-1" label in the 375 t=0.85 view.
4. RPO live still: make panels wider (2 + 1 layout or taller labels) and enlarge panel titles/captions.
5. Hero live: add the ISS and MEO labels in live view to match static and colour-code chips; show the globe higher in the 1440 viewport.
6. Burnt Frost static: move "Larger pieces falling" label off the debris; Cosmos 1408 375 label spacing; DN-2 10,000 km label off the ring line.
7. Live caption size in stills to match the static caption size.
