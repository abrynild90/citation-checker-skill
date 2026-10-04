# Round 15 grading, slice S1 (hero, overlay UI, static, stills, Starfish, Solwind, Fengyun)
Viewed: hero live+static at 1440 and 375; all 13 static scenes at 1440 (contact sheets); live Starfish/Solwind/Fengyun at 0.2/0.6/0.85; 375 live/static Starfish; all 26 stills (live at t=1 default via exportStill, static under reducedMotion via window.__cs.exportStill).
| Item | Score |
|---|---|
| Hero globe | 93 |
| Scene overlay UI | 93 |
| Static fallback (13) | 91 |
| PNG stills (26) | 89 |
| Starfish | 92 |
| Solwind | 93 |
| Fengyun-1C | 94 |
| Visual impact/fun (slice) | 92 |
## Round 14 defects
Fixed: live hero Earth now uses the Blue Marble look, matching static; ISS label moved off the LEO label (live and static). Aside opens at scrollTop 0 on scene change (Starfish text starts at sentence one). Fengyun 0.6 and 0.85 now differ (ring thick and closed at 0.6, spread into wider thinner band at 0.85). Starfish late frames show "Satellite in belt" then pink "Satellite damaged" with a detonation flash at 0.2; static Starfish shows satellite, "Satellite in belt" and Thor label.
Not fixed: RPO panels 1 and 3 still show a small green "Earth (off scale)" disc (static and static still). Spaceplanes static remains busy (many orbit lines, OTV-7 label at the top edge). DN-2 and SJ-21 static Earth still small inside large rings (SJ-21 Earth about 1/4 of frame width). Live stills still have small labels vs the 3000px frame and mostly no leader lines; RPO live still is a tall 3-panel strip (2400x4817) with tiny type.
New or noted: live stills are taken at the end state with camera not matched to the scene's view. MIRACL live still is a heavily zoomed, blurry crop of North America (Earth not shown whole, texture upscaled), a regression versus round 13's centred Earth. Spaceplanes live still shows only CSSHQ/Object J and no X-37B orbits. SJ-21 live still has a shorter frame with the orbit running out the bottom. Live Starfish at 375 (t=0.85) is zoomed so Earth fills the frame and the belt is cropped (static 375 shows whole belt).
## Evidence per score
- Hero 93: live globe now photo Earth with glowing LEO/MEO/GEO shells, readable labels, "Drag to rotate" hint; 375 clean (LEO/ISS/GEO/GPS labels legible). Static hero has ISS icon and clear labels. Remaining: live labels are plain dark chips unlike static's colour-coded ones; hero GL only starts on hover.
- Overlay 93: header/prev/next/close, scrub, cams, PNG button, scroll cue, source and related law all tidy at 1440 and 375; aside scroll reset works. Background page only dimmed; 375 aside is half the height so text is cut after 7 lines.
- Static 91: 13 render, centred, labelled, consistent captions. Held back by RPO "Earth (off scale)" discs, spaceplanes clutter, small Earth in DN-2/SJ-21, large empty aside area in several scenes, SJ-21 aside long and truncated.
- Stills 89: all 26 export with banner, title, source, imagery credit. Static stills are good (labels, leader lines, satellite). Live stills weaker: small type, missing leader lines, MIRACL blurry crop, spaceplanes missing orbits, RPO strip tiny, wide variation in frame heights (SJ-21, RPO).
- Starfish 92: strong field-line belt, flash, drifting satellite then damage cue; 375 live too tight.
- Solwind 93: F-15, satellite, ring flash, debris plume decaying; labels persist at 0.6 and 0.85; at 0.2 the "Impact" label is absent but F-15 and satellite labelled.
- Fengyun 94: clear progression from rising SC-19 to closed ring to widened band; Debris ring label at 0.6; fits at 375.
- Visual impact 92: Blue Marble Earth plus glow, debris and field lines are attractive; static fallback looks good.
## What raises each to >=93
- Static: replace RPO "Earth (off scale)" disc with a limb crop or proper Earth; declutter spaceplanes (fewer orbits/labels, keep OTV-7 label inside frame); enlarge Earth in DN-2 and SJ-21 (zoom to ring or shrink ring).
- Stills: for live stills set a per-scene still camera (whole Earth centred, like MIRACL/spaceplanes in static), scale labels about 1.5x, add leader lines, show X-37B orbits, cap RPO strip to a legible size or lay panels in a row; equalise frame heights.
- Starfish: at 375 live keep Wide camera showing the full belt at late t.
- Overlay: give 375 aside more height or collapse the steps box by default; dim or blur page behind.
- Hero: colour-code live labels like static; optionally start GL without hover when idle.
- Visual impact: add Solwind early impact label; make live stills match the in-scene drama.
