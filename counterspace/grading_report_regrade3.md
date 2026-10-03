# Regrade 3 (Starfish, DN-2, Spaceplanes, Code quality), strict, fresh
Method: Playwright/SwiftShader, Earth texture served through a route. Starfish (3 presets) and DN-2 (4 presets) live at t=0.2/0.4/0.6/0.85 at 1440 and 375. Live still and static still (reducedMotion) exported with real titles/cites. Spaceplanes live at t=0.3/0.7 at 1440/375 plus live still. Scripts deleted, server stopped by PID.
**Page errors (pageerror + console error): 0. Export failures: 0.**

| Item | Prev | Now |
|---|---|---|
| Starfish | 92 | 92 |
| DN-2 | 92 | 93 |
| Spaceplanes | 94 | 94 |
| Code quality | 93 | 93 |

## Evidence
- Starfish: default cam t=0.2 flash plus field lines strong; Thor leader still runs straight through the burst, Detonation/Johnston labels sit on field lines; t=0.6 "Artificial radiation belt" still has a long bare leader. Close-up cam: Earth fills frame, Detonation leader crosses Thor label at t=0.2. Polar cam: Johnston Island label collides with the caption at t=0.2/0.6 and the flash is cropped at the bottom; Satellite leader crosses field rings at 0.4/0.6. 375 clean overall (short labels), Thor label dropped. Live still tidy (Radiation belt leader short, titles exact). Static still: Thor leader cuts across the Earth, the Thor/Belt/Detonation labels stack at right, but legible.
- DN-2: improved. Default cam Earth about 35% of frame, Profile about 45%; GEO ring, 10,000 km and glow head clear at every t. Remaining at 1440: default t=0.85 the path crosses the Apogee label text; Profile Apogee leader is a tall vertical line crossing the 10,000 km leader; Polar apogee label sits on the ring edge. 375: Polar t=0.4/0.6 path and Xichang label touch the caption; Profile/Zoom 10,000 km and SWF labels crowd at right. Live and static stills good (static: path label over Earth, Apogee/GEO/10,000 km leaders converge but do not overlap text).
- Spaceplanes (regression): t=0.3 and 0.7 at 1440 and 375 clean, labels exact, inset "top view" fine, no clipping, no regression. Live still good; minor: X-37B label leader runs across the craft model and the LEO orbit lines tangle left of Earth; at t=0.3 the caption overlaps the blue orbit line.
- Code quality: template.html has 752 lines, max 169 (a single meta description string, line 10), 1 line over 160, 75 over 120, so the wrap is effective. src/**/*.js: max line 160, 0 over 160, 313 over 140, 783 over 120, 1251 over 100. No stray files, working tree untouched. Not perfect: JS still runs long for comments and one-line config entries; 160 is a loose limit.

## Fixes for anything under 93
- Starfish (92): route Thor leader off the burst (anchor it above, not through); shorten or chip the "Artificial radiation belt" leader; Polar cam: move Johnston Island label above the caption zone and reduce flash crop; static still: move Thor/Belt labels apart so leaders do not cross the Earth.
- Optional (all 93-94): DN-2 offset the Apogee label from the path at default t=0.85 and stagger Apogee vs 10,000 km leaders on Profile; Spaceplanes shift the X-37B label leader to the craft's side; code: cap JS lines at 140 (313 offenders) and template meta at 160.
