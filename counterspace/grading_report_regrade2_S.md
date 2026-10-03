# Regrade 2, slice S (Hero, Overlay UI, Starfish, Solwind, DN-2, Header), strict, fresh
Method: Playwright/SwiftShader. Live scenes at t=0.2/0.6/0.85 at 1440 and 375 (DN-2: all 4 presets), live and static stillPNG with real titles/cites (static under reducedMotion), hero live 24 s at 1440 and 375, header at 1440/900/375 dark and light. Scripts deleted, server stopped by PID.
**Page errors (pageerror + console error, all runs): 0. Export failures: 0. Horizontal scroll at header widths: none.**

| Item | Prev | Now |
|---|---|---|
| Hero globe | 92 | 93 |
| Scene overlay UI | 92 | 93 |
| Starfish | 91 | 92 |
| Solwind | 92 | 93 |
| DN-2 | 92 | 92 |
| Header | 94 | 93 |

## Evidence
- Hero: "ISS (illustrative orbit)" label shows at 1440 live and ISS/LEO/GEO/MEO chips at 375; globe now sits inside the first viewport at 1440 under the header. Rings, markers, rotate button clean. 375 hero is large, chips readable. Remaining: the 1440 hero is a small panel (about 560x240 px) so the globe is modest.
- Overlay UI: banner, caption and footer are legible at both widths; live-still caption is now close to static size; titles and cites are exact. Small gap: live-still of Starfish has a bare "Radiation belt" leader and Solwind live still has no unit context for the small globe.
- Starfish: t=0.2 flash plus field lines strong; Detonation/Johnston labels still stack over field lines and the Thor leader runs through the burst; t=0.6 "Artificial radiation belt" has a long vertical leader; 375 is good (chips, short leaders). Live still labels are readable but belt leader is bare. Static still has the tight Thor/Detonation/Belt cluster.
- Solwind: satellite icon now clear at t=0.2, plume and shock ring at 0.6/0.85, F-15 and Impact labels tidy at both widths. Live still is good (ASM-135 beside the track). Static still has a small globe and a LEO label that adds nothing.
- DN-2: all four presets frame GEO ring, 10,000 km and apogee at every t, glowing head clear, Polar/Zoom layered shells attractive. Defects: default and Profile cameras still show Earth at only about 30% of frame; at 1440 default t=0.6/0.85 and Profile the 10,000 km, Apogee and GEO leaders cross or converge near the ring; Polar t=0.6/0.85 has the Apogee label sitting on the ring edge; 375 versions have five labels converging at the right of the Earth. Static still fine (path label sits over the Earth and clips Xichang area).
- Header: 1440 and 900 layouts are clean (eyebrow, title, intro, ledger box, tour button, chips all aligned) in dark and light; 375 stacks well with large readable type and no horizontal scroll. Regression flags: at 375 the Theme and Dark SVG buttons sit far down the page (y 865) rather than with the header; at 1440 the Theme/Dark SVG buttons were not visible in the downscaled capture although the DOM reports them visible at x=1081,y=20, so they read as low-prominence. No overlap or clipping found.

## Fixes for anything under 93
- Starfish (92): move Detonation/Johnston to the left of the field-line column, route Thor off the burst, shorten the "Artificial radiation belt" leader or give it a chip.
- DN-2 (92): zoom default and Profile cameras so Earth is about 40% of frame; stagger the 10,000 km / Apogee / GEO leaders so none cross; merge Xichang/DN-2 path leaders at 375.
- Optional polish: bring Theme/Dark SVG buttons into the header on phone and give them clearer contrast at 1440.
