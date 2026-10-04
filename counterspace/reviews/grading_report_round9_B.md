# Round 9 grading, reviewer B (3D scenes slice)

Method: Playwright/SwiftShader, images in scratchpad g9B/ (about 145 files). Live scenes at t=0.3/0.6/0.85 at 1440 and 375, all camera presets at 1440, static/reduced-motion at both widths, live and static stills, hero at both widths, overlay UI shots. Coverage caveat: several Read batches were dropped by the tool (request limit) and I re-read them; I did not get a confirmed full-resolution view of every one of the ~150 files (gaps: live stills for shakti/cosmos1408/gnss/viasat/laser were seen only for viasat; static stills seen only for viasat and laser; ui-1440-focus/next and ui-375-open not viewed). Scores rest on what I did view. Note: "Title ..." and "p. 00-00" in the stills come from my capture script arguments, not the page.

| Item | Score |
|---|---|
| Hero 3D overview | 89 |
| Scene overlay UI | 90 |
| Static/reduced-motion fallback | 90 |
| PNG still export | 91 |
| Starfish | 91 |
| Solwind | 88 |
| Fengyun | 92 |
| Burnt Frost | 88 |
| DN-2 | 88 |
| Shakti | 86 |
| Cosmos 1408 | 90 |
| GNSS | 91 |
| Viasat | 88 |
| Laser | 86 |
| Visual impact | 90 |
| Quality of graphics | 89 |
| Fun/engagement | 90 |

## Round 8 defects: status
- Fixed: static SVG side bands (laser-static-1440); debris blobs (Solwind/Shakti now discrete orange particles); "Scroll for more" cue present (viasat, mobile); mobile scene view about 350 px tall; Viasat pink blobs gone; Laser beam now thin; hero labels larger and hero Earth/shells fill the canvas (hero-1440.png); Fengyun ring no longer clipped at 0.85; SC-19 label disappears after event.
- Not fixed: label collisions (below); Laser satellite model still oversized; Shakti Earth crop; Burnt Frost label on sprites.

## Defects below 93
**Hero (89)**: hero-375.png: canvas is short (~340 px), Earth small, MEO and ISS labels touch the GEO/LEO labels and shells; hero-1440.png: ISS label sits on a shell ring; still no visible "click to explore" affordance on the canvas itself (only text below).

**Overlay UI (90)**: viasat-1440-0.6.png: source line is cut under the "Scroll for more" cue, and the steps list is truncated until scrolled (ui-1440-scrolled.png shows it works but nothing shows scroll position). ui-375-scrolled.png: at 375 the scene shrinks and the controls wrap onto 3 rows (Export still wraps alone). Laser/Solwind/Burnt Frost show a disabled "No specific legal item" bar taking a full row. burnt-frost-static-375.png: "What happens" summary is faded under the scroll cue.

**Static fallback (90)**: laser-static-1440.png: "MIRACL beam" and "White Sands" labels stack and touch; the land map is still a soft green cartoon beside the photographic live scene. laser-static-375.png / gnss-static-375.png: "MIRACL beam (illustrative)" and "Airliner B" labels run flush to the left edge and are clipped; dn2-static-375.png: GEO label touches the right edge. viasat-static-1440.png: caption box overlaps the source clip line.

**PNG still (91)**: viasat-still.png: Earth occupies ~25% of the frame with lots of dead space; "Ground terminals" label sits on the red cluster; fengyun-still.png OK; burnt-frost-still.png: "Larger pieces falling" label on the sprite, and the LEO ring is a thick bar at the bottom.

**Starfish (91)**: starfish-1440-0.6.png: belt is still a random dot cloud, not field-line structured; at 375 labels crowd the top (starfish-375-0.3.png).

**Solwind (88)**: solwind-cam2.png (Polar): "F-15 zoom climb" label is offset from the aircraft and the debris tail is a thin orange smear; default view (solwind-1440-0.85.png) shows the Earth sliced awkwardly at left/bottom with a stray LEO ring stub at the right edge; debris very small at 375.

**Fengyun (92)**: fengyun-cam2.png: "Debris ring" label sits on the particle column and "Xichang" overlaps its leader; otherwise the best scene.

**Burnt Frost (88)**: burnt-frost-1440-0.6.png / 0.85: "Larger pieces falling (illustrative)" label lies across the sprite trails; the Earth is pushed to the lower-left with a fat blue LEO ring bar crossing the bottom; debris sparse. Caption (~90 words) is the longest in the set.

**DN-2 (88)**: dn2-1440-0.6.png: the yellow GEO ring is clipped at the left canvas edge; "GEO ring" and "Apogee" leaders cross the trajectory; dn2-cam1.png (Polar): "10,000 km", "Apogee" and "GEO ring" labels stack in a cluster at the bottom; dn2-375: GEO label at edge.

**Shakti (86)**: shakti-1440-0.3.png: default camera crops the Earth at left and top and the banner overlaps it; debris is a small dot cluster (shakti-1440-0.6.png) with no drama; the "Microsat-R" and "PDV Mk-II" labels overlap each other at 0.3.

**Cosmos 1408 (90)**: cosmos1408-cam1.png: ISS model still a blocky panel truss, but acceptable; default view: "Cosmos 1408" label sits on the vertical leader with no visible satellite; debris cloud at the top edge touches the canvas edge at 0.85.

**GNSS (91)**: gnss-cam1.png (Near): a large flat pale-green quadrilateral (satellite footprint/cone) sits at the bottom and reads as a rendering artifact; "Airliner A/B" labels touch; gnss-375: jammer zone and airliners tiny.

**Viasat (88)**: viasat-1440-0.6.png: "Ground management network" label lands on the terminal cluster; five thick pinkish spokes look heavy; viasat-cam0.png: "Ground terminals" label overlaps the ring. The GEO shell disc is much softer than round 8 (good).

**Laser (86)**: laser-cam0.png: MSTI-3 model is still oversized (about 130 px) and its label overlaps the solar panel; the pink glow pads around satellite and range are blurry; laser-cam2.png (Russia): Peresvet markers are twin grey/pink spheres with "Yoshkar-Ola" overlapping "Peresvet shelters: Teykovo"; caption ~130 words.

**Visual impact / graphics / engagement (90/89/90)**: Earth imagery, atmosphere and camera work are strong and the debris sprites are much improved. Remaining weak points are label collisions across scenes, toy-like models (MSTI-3, ISS, USS Lake Erie), and thick flat LEO ring bars that cut across close-up presets.

## Factual notes
Captions checked against the on-screen text for Fengyun, Solwind, Burnt Frost (240 vs 220 km flagged), Shakti, Cosmos 1408 (1,807 / 5), Viasat: no mismatches seen.

## Best single improvement
Add a per-frame screen-space label declutter pass (push apart overlapping labels, clamp to canvas, hide ones that cover sprites) shared by live view, static SVG and stills; it removes the recurring collisions in DN-2, Burnt Frost, Laser, Viasat, Fengyun and the static 375 clipping.
