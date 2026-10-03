# Grade, slice S1 (strict, fresh) - Newsreader / IBM Plex embedded
Method: Playwright/SwiftShader. Stills exported with real SCENES titles/cites after reducedMotion 'reduce' (26 PNG, 3000x1875, all exported, titles and cites correct, Blue Marble line present). Live Solwind/Fengyun/Starfish captured at t=0.2/0.6/0.85 at 1440 and 375; Starfish for all 3 presets (Wide/Near/Polar). Static views of all 13 at both widths. About 24 images read (budget 45). Scripts deleted, server stopped by PID.
**Page errors (pageerror + console error, all contexts): 0. Failed exports: 0.**
Note: 13 of 26 stills (laser, rpo, sj21, spaceplanes) are byte-identical at 1440 and 375; the others differ slightly. Stills were read in pairs for 6 scenes (starfish, solwind, fengyun, rpo, gnss, spaceplanes); the rest judged from the matching static views.
| Item | Score |
|---|---|
| Hero globe | 92 |
| Scene overlay UI | 92 |
| Static fallback (13 x 2) | 93 |
| PNG stills (26) | 93 |
| Starfish | 92 |
| Solwind | 90 |
| Fengyun-1C | 94 |
| Visual impact / graphics / fun (slice) | 93 |
## Evidence
- Hero: 1440 now has ISS, LEO, GEO and MEO chips with leaders, clean orbit rings and shells; 375 is a tighter composition with colour-coded chips. The globe still sits below the text block at 1440 (the first viewport shows headline, cards and the stage's top edge; the globe needs scroll). MEO label sits low in the stage, partly near the edge.
- Overlay UI: banner, caption and footer always legible and clear of the globe; type is Plex/Newsreader and renders cleanly. Live captions at 1440 are small relative to the stage (about half the static caption size). Starfish Wide at 1440 stacks Detonation/Johnston/Thor labels tightly over the field-line column.
- Static: all 13 have separated, colour-coded labels with leaders at 1440. DN-2 leaders still brush the path; Burnt Frost "USS Lake Erie" chip floats away from its referent; GNSS "GPS signal" chip sits low on the globe edge. Solwind static: globe is small and off-centre in a mostly empty frame, with three labels packed at the north edge and the craft barely visible. 375 sheet is legible but labels are small; Solwind 375 labels (Solwind/ASM-135/F-15) crowd at the top.
- Stills: pairs read for Starfish, Solwind, Fengyun, RPO, GNSS, Spaceplanes: header, caption, title (Newsreader), source and Blue Marble line are consistent and crisp. Fengyun and RPO are strongest. Solwind still repeats the small-globe/empty-frame problem; Starfish still has Johnston and Detonation leaders crossing the field lines and the globe.
- Starfish: Wide t=0.2 detonation flash with field lines, t=0.6 belt fills in, t=0.85 pink "Satellite damaged (SWF: such tests did this)" label is clear. Near preset is very zoomed: Thor label drops after t=0.2 and Detonation/Johnston leaders become long verticals through the field lines. Polar is attractive (belt rings, clear labels) but Johnston/Detonation leaders overlap at t=0.6/0.85 and "Satellite damaged" leader crosses the globe. 375 Wide is clean, chips short.
- Solwind: orange fragment cloud and shock ring at t=0.6/0.85 are dramatic and labels (Impact: Solwind P78-1, F-15 zoom climb) are tidy at both widths; t=0.2 satellite is small at 1440 but now labelled; the 375 caption is shortened well. The static/still version is the weak point.
- Fengyun: best of slice; ring reads at every t and width, Debris ring/Impact/Xichang labelled, 375 labels a bit long but clear.
## Fixes for items under 93
- Hero (92): bring the globe into the first 900 px at 1440 (reduce intro/card height or place stage beside the headline); raise MEO chip off the bottom edge.
- Overlay UI (92): raise live caption size at 1440 about 1.4x; open Starfish Wide labels apart (Detonation up-left, Johnston left, Thor below) instead of one tight column.
- Starfish (92): in Near, keep Thor label after t=0.2 or shorten Detonation leader; in Polar offset Johnston and Detonation so leaders do not overlap; route "Satellite damaged" leader off the globe.
- Solwind (90): static/still camera: centre the globe and zoom (about 1.5x) toward the North American impact so ASM-135, F-15 and the satellite are legible; spread the three north-edge labels; enlarge the satellite icon at t=0.2 live.
- Static (93)/Stills (93): meet the bar only with the Solwind reframe above; also move USS Lake Erie next to its ship marker and the GNSS "GPS signal" chip clear of the globe edge.
