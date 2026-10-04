# Round 11 grading, reviewer B1

Images: scratchpad g11B1/. Viewed at full resolution: hero (static+live, 1440+375), overlay UI (solwind: 1440 default/next/tab/esc, 375 default/scrolled/next/esc), live stills for starfish, solwind, laser, fengyun, burnt-frost, dn2 and static (exportStill) for rpo and spaceplanes, reduced-motion overlay for starfish/rpo/spaceplanes/dn2 at 1440 and 375, reduced-motion stills for rpo, spaceplanes, starfish-375, and all t/cam shots for the five scenes (1440 t=.3/.6/.85, 375 t=.3/.6/.85, all presets). NOT viewed (generated, not opened): live stills for shakti, cosmos1408, sj21-tug, viasat, gnss, spaceplanes, rpo (live), 8 of 13 static scenes at each width, and the other 9 static stills. Static/still scores are therefore capped.

| Item | Score |
|---|---|
| Hero 3D overview | 89 |
| Scene overlay UI | 91 |
| Static/reduced-motion fallback | 88 (partial coverage) |
| PNG still export | 87 (partial coverage) |
| Starfish | 91 |
| Solwind | 91 |
| Fengyun | 91 |
| Burnt Frost | 90 |
| DN-2 | 90 |

## Round 10 defects
Fixed: 375 source line no longer clipped behind the scroll cue (ui-375-solwind.png wraps fully); Esc now returns focus (to an element, not BODY; 375 returns to the tour button); Fengyun labels no longer stack over the Earth (fengyun-cam2/-cam1); Burnt Frost pieces label is shorter and nearer; DN-2 375 labels less stacked.
Not fixed: "No specific legal item" bar still a full row; Export is icon-only at 375; static 375 label clutter (RPO, spaceplanes).

## Below-93 defects
**Hero (89)**: hero-live-1440.png: MEO/GEO shell glow is cropped at the top and sides of the stage, the ISS marker is gone, and the GEO/MEO labels float away from their rings. hero-static-1440.png: the "Overview..." caption is a dark box that reads as a stray strip at the bottom of the stage. hero-*-375.png: the cube icon drops below the heading and the "Select any event" title wraps beside it.

**Overlay UI (91)**: ui-1440-solwind.png: last source line ("· SWF 2026") is cut by the panel edge. ui-375-next-solwind.png: camera preset row clips "Zoom on M…" at the right edge. Export is icon-only at 375; the "No specific legal item" bar wastes a row. Focus after Esc at 1440 lands on a chart element ("g"), not the scene's opener.

**Static fallback (88)**: rm-spaceplanes-1440.png: OTV/CSSHQ/X-37B/GEO labels crowd over orbit lines, and "Object J/G" sit on the Earth. rm-spaceplanes-375.png and rm-rpo-375.png: labels cover most of each panel, the footer text is tiny, and the RPO panel titles overlap Earth and orbits. rm-starfish-1440.png: the source line is clipped at the panel bottom, and leader/orbit lines cross the Earth. 375 banner still wraps to two lines.

**PNG still (87)**: rmstill-starfish-375.png: the Earth texture is visibly pixelated when a 375 canvas is upscaled, and labels are oversized. still-live-rpo (rmstill-rpo-1440.png via API is static; still-api-rpo.png is the live composite): panel labels are tiny and a stray "1 · China + US, GEO (2025)" and "3 · US + UK" text floats inside the panels. Footer "Earth imagery" line uses a larger font than the "Source" line (all stills). still-live-starfish.png: Earth off-centre, belt clipped at the right, and three overlapping labels ("Thor launch", "Detonation", "Johnston Island") at a tiny detonation icon. still-live-fengyun.png: the outer shell is cropped by the footer band. rmstill-spaceplanes-1440.png: a label overlaps its own orbit.

**Starfish (91)**: starfish-cam2.png: "Johnston Island" label is clipped against the status caption. starfish-375-0.3/0.6.png: the Thor, Johnston and Detonation labels stack with crossing leaders. starfish-cam0.png: zoom view is sparse, with no detonation glow.

**Solwind (91)**: solwind-1440-0.6.png/0.85: the Solwind satellite label and sprite vanish after collision and nothing marks the impact point except a ring. solwind-cam0.png: the F-15 label leader is long. Caption wraps to two lines at 375.

**Fengyun (91)**: fengyun-1440-0.3.png: caption reads "Collision at ~880 km" before any collision is visible; "Fengyun-1C" and "SC-19" labels are stacked and detached from sprites. fengyun-375-0.3.png: same cluster.

**Burnt Frost (90)**: burnt-frost-1440-0.85.png: debris almost gone and the "Larger pieces" leader is long. burnt-frost-cam2.png: label leader crosses debris. burnt-frost-375-0.6/0.85.png: caption wraps to two lines and the label sits on the debris/limb.

**DN-2 (90)**: dn2-cam1.png/dn2-cam2.png: Apogee, GEO ring, 10,000 km and DN-2 path labels cluster at the right/bottom with crossing leaders. dn2-375-0.6/0.85.png: "10,000 km", "GEO" leaders cross orbits and each other. Captions match SWF (apogee >=30,000 km, no target).

## Best single improvement
A shared screen-space label declutter (push apart, clamp, shorten leaders, hide secondary labels on narrow widths) across live, static SVG and stills, plus supersampling the Earth texture in the static still at narrow widths.
