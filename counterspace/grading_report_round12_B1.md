# Round 12 grading, reviewer B1

Images: scratchpad g12B1/. VIEWED at full resolution: hero static+live at 1440 and 375 (4); overlay UI starfish->solwind default/next/tab/esc at 1440 and 375 (8); reduced-motion overlay for all 13 scenes at 1440 and 375 (26); stills: still-live-starfish and still-static-starfish; live shots dn2-1440-0.6, fengyun-1440-0.3, burnt-frost-1440-0.85, starfish-375-0.6.
NOT VIEWED (generated, not opened): the other 24 stills (12 live, 12 static); all other t=0.3/0.6/0.85 shots (Starfish, Solwind, Fengyun, Burnt Frost, DN-2 at 1440 and 375) and all camera-preset shots. Scene and still scores are therefore capped and provisional.
Harness note: my live stills passed the #sceneSrc text as the cite, so "Source: Source: ..." and the trailing link text in still-live-starfish.png come from my script, not the app (still-static-starfish.png, using the app's own cite, is correct).

| Item | Score |
|---|---|
| Hero 3D overview | 91 |
| Scene overlay UI | 92 |
| Static/reduced-motion fallback | 90 (all 26 viewed) |
| PNG still export | 86 (2 of 26 viewed, capped) |
| Starfish | 89 (partial) |
| Solwind | 90 (partial; overlay/UI only) |
| Fengyun | 91 (partial) |
| Burnt Frost | 91 (partial) |
| DN-2 | 91 (partial) |

## Round 11 defects, verified
Fixed: hero live shells no longer cropped, ISS marker and labelled rings present, cube icon inline with heading at 375 (hero-*-375.png); 1440 source line no longer cut (ui-1440-next.png); 375 preset row fits, export is labelled "PNG" (ui-375-next.png); "No specific legal item" is now an inline note, not a bar; Fengyun t=0.3 caption reads "SC-19 rises toward Fengyun-1C" (fengyun-1440-0.3.png); Burnt Frost 0.85 debris visible with "48 of 175 simulated pieces aloft"; static banner fits one line at 375; static spaceplanes/RPO 375 now legible and less crowded; DN-2 static labels tidy (rm-dn2-1440/375).
Not fixed: focus after Esc at 1440 still lands on a chart mark ("g.mark", by design the opener, acceptable).

## Below-93 defects
**Hero (91)**: hero-live-1440.png: globe and shells occupy only about 40% of the stage width, with wide empty flanks. hero-static-1440.png and live differ in ring tilt and label placement (static GEO/MEO labels touch and overlap at top right). hero-static-1440: "Rotate the globe" button sits on the GEO ring.

**Overlay UI (92)**: ui-1440-default.png: "Scale and imagery note" is half-clipped under the scroll cue on Starfish. ui-375-default.png: the scroll cue sits on the last visible text line of the description. rm-fengyun-375.png: "Scale and imagery note" is cut by the cue.

**Static fallback (90)**: rm-spaceplanes-1440.png: "OTV-7 orbit" label sits at the very top beside the banner, "Obj. J / Obj. G / 300-400 km / CSSHQ flight 2" labels stack with crossing leaders, Earth is small. rm-spaceplanes-375.png and rm-cosmos1408-375.png: five or six labels crowd a small globe. rm-starfish-1440.png: the radiation-belt dotted lines are visually busy and cross the Earth. rm-rpo-1440.png: panel 1 orbit arcs are cut off and the "SJ-21 + SJ-25 docked" label sits on USA 270. 375 diagram footer text is about 6 px.

**PNG still (86, mostly unviewed)**: still-live-starfish.png: Earth off-centre, belt clipped at the right edge, a large empty band above the globe, and "Detonation"/"Thor launch"/"Johnston Island" labels bunch at a tiny icon. still-static-starfish.png: label leaders cross the belt. 24 other stills not inspected.

**Starfish (89)**: starfish-375-0.6.png: the Detonation, Johnston and Satellite labels cluster with crossing leaders, and "Radiation belt" is clipped at the right edge.

**Solwind (90)**: only ui-1440-next.png and the static views viewed; the satellite label still disappears after collision (round 11, not re-verified).

**Fengyun (91)**, **Burnt Frost (91)**, **DN-2 (91)**: only one live frame each viewed. Burnt Frost 0.85: the "Larger pieces falling" leader is long. DN-2 0.6: the "Xichang" and "Apogee" labels sit far from their points, and the GEO ring label floats away from the ring.

## Best single improvement
Fit-to-stage for the static diagram and the stills (scale Earth to fill at 375 and in spaceplanes/cosmos), plus one shared label declutter pass that shortens leaders and drops secondary labels on narrow widths.
