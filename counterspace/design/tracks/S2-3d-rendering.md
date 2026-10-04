# Track S2: how the 3D pictures look (Earth, space, spacecraft, effects, labels, hero globe)

Read `design/DESIGN.md` first, all of it, especially sections 3 and 7. Read `src/scenes/README.md` and the files you own before changing anything. This brief adds what is specific to you.

## What you own

- `src/scenes/earth.js`, `gl-host.js`, `gl-items.js`, `gl-models.js`, `gl-labels.js`, `core.js`, `sim.js`, `sim-space.js`, `co-sim.js`, `cameras.js`, `labels.js`, `config.js`.
- The live hero globe (the overview scene that starts from `#heroRot`; look for `HERO` in `config.js` and the hero start-up code in `src/app.js` or `src/boot.js`: read it, and if the hero start-up lives
  in a file you do not own, keep your changes inside the scene modules and describe what you need in the report).
- Do not edit `src/scenes/svg/*`, `svg-fallback.js`, `gl-still.js`, `still-config.js` (track S3), `scene-ui.js`, `overlay.html`, `scenes.css` (track S1), or the scene text in `src/scenes/configs/*` (a later copy pass; you
  may change camera, framing and visual fields if a visual defect needs it, and say so in the report).

## The job

Make the 3D look like a documentary graphic: this is the part a reviewer will judge hardest. Work in this order and show your results as screenshots (`tools/shots.mjs` captures scenes at chosen moments; read its header;
set `OUT`, and use its own port by editing a copy named `tools/tmp_shots.mjs` if you need a different one).

1. **Earth.** Photographic day side; the night side shows city lights from the night image; a soft terminator (the sun direction is fixed and chosen so most scenes show both a lit and an unlit part of the planet;
   choose it, put it in one place, and keep it consistent in every scene); ocean glint from the water mask; a thin atmosphere rim (a fresnel shell, additive, blue-white on the lit limb, almost invisible on the dark side);
   optional soft clouds if you can make them cheaply (procedural noise in the shader is fine; do not download anything new). Use the embedded small day and night images first (`loadEmbeddedEarth()`, `earthLow`,
   `earthNightLow`, `earthSource()` in `earth.js`: the page starts with them, no download) and swap to the full textures when they arrive, with no visible pop. If the high-resolution night texture is not
   already fetched anywhere, you may fetch it lazily from the same CDN location the Blue Marble image uses (look at `earth.js` for the host and path pattern; three-globe's `earth-night.jpg`); only jsDelivr or cdnjs are allowed.
2. **Space.** A fine star field (several sizes and temperatures, no banding, a hint of density toward one band), slightly dimmed behind the Earth's atmosphere. Optional very faint nebula-like gradient in the background.
3. **Spacecraft and sites** (`gl-models.js`). Better silhouettes and materials: a bus with gold or silver foil and a matte panel, solar arrays with a visible cell grid (a small canvas texture), antennas and thrusters, the ISS with
   its truss and radiators, the spaceplane, aircraft, ground sites, jammers, ships. Use `MeshStandardMaterial` with a small generated environment map so metal reads as metal. Keep geometry cheap (they are small on screen);
   the picture matters more than the polygon count. Each craft gets a faint rim light so it separates from dark space.
4. **Effects.** Clean additive glows with a smooth falloff; beams with a bright core and soft falloff (and a gentle travelling pulse if cheap); debris as depth-faded points; trails that taper and fade; the nuclear flash and
   radiation belt (Starfish) as luminous, believable structures; laser and jamming beams that look intentional. Nothing should look like a debug primitive.
5. **Labels** (`gl-labels.js`). Use exactly the label look in DESIGN.md section 7. The label placement guarantee must hold: `tools/scene_check.mjs` reports no overlaps, clipping, or hidden labels. Larger text can
   force a different layout; keep the de-confliction logic (`labels.js`) working and re-run the checker.
6. **Camera** (`cameras.js`, `gl-host.js`). Smooth ease between views (about 700 ms, ease-in-out), a very slight drift while a scene plays, no motion under reduced motion. Framing that never crops the Earth awkwardly: at
   900x700 (desktop window) and 390x440 (phone picture area) check every scene's first and last frame.
7. **Hero globe.** The live overview shows orbit shells (low, medium and geostationary Earth orbit) as thin glowing rings with the label look from section 7, a few satellites with trails, a slow turn, drag to rotate with
   a little inertia. The stage can be any shape from 0.8 to 1.6 (width over height): fit the Earth with a margin so nothing is cropped. The page puts the stage in the right part of a full-bleed dark hero (track P).
   Provide a switch for automatic start: when the device is capable (window at least 900 px wide, no reduced motion, no Save-Data, `hardwareConcurrency` at least 4) and the browser is idle shortly after first paint, load
   three.js and cross-fade from the static picture to the live globe; otherwise it starts on the "Rotate the globe" press as now. Gate it behind one constant in one place (`AUTO_HERO`) and the query string
   `?still` (forces the old behaviour, used by test tools). Report what it costs (milliseconds to first live frame, bytes) so the orchestrator can decide whether to ship it on.
8. **Performance and memory.** Pixel ratio capped at 2; no per-frame allocations in hot paths; textures and geometries disposed when a scene closes. Opening and closing every scene must leave `window.__cs.memory()`
   and `window.__cs.contexts()` at their starting values (run the existing check in `tools/qa.mjs` or `tools/scene_check.mjs`; read how it measures). Keep first-load weight sensible: the page is now about 720 KB; stay under 1.2 MB.

## Care points
- Never change a scene's simulation data, timing or meaning; only how it looks.
- Software rendering in the test machine is slow (swiftshader). Judge speed by operation counts and by `window.__cs.perf`; do not make shaders needlessly heavy. Real GPUs are far faster, but phones are not.
- Three.js and its helpers load only from jsDelivr or cdnjs, already wired in the host. Keep it that way.
- Scene texts are still the old wording; a later pass rewrites them.

## Ports
Use 9140 to 9149.

## Done means
Screenshots of at least these scenes at two moments each, at 900x700 and 390x440, would pass for a documentary: `starfish`, `fengyun`, `laser`, `gnss`, `rpo`, `sj21-tug`, `spaceplanes`, `viasat`, plus the hero globe at 1440x900.
`node tools/scene_check.mjs` with `ONLY=` for all scenes you touched (`VPS=1440,375`, `MODES=live,hero`) shows no failures. `node tools/qa.mjs` shows no page errors and flat memory and contexts.
