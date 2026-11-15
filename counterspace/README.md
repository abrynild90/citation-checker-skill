# Counterspace website

A single-file interactive timeline of counterspace events and the legal and policy record. The built `index.html` includes D3, Three.js, Earth imagery, fonts, data, and diagrams. Charts and scenes work without CDN access; source links require a connection.

## Build and check

Use Node.js 22 or later and Python 3.9 or later:

```sh
cd counterspace/tools
npm ci
npx playwright install chromium
npm run build
npm test
```

`npm test` checks desktop and phone boot, scene opening/closing, offline operation, malformed fragments, chart-tab and sources navigation, SVG downloads, and automated accessibility at 375, 900, and 1440 px. The GitHub Actions website workflow runs these checks on website changes.

For broader visual QA, run `npm run qa`. For scene framing and label checks, run `npm run test:scenes`. Reports and screenshots can be kept outside the checkout with `OUT=/tmp/counterspace-qa`; the QA harness can regenerate chart exports. These checks use local axe-core rather than downloading a test dependency at runtime.

Edit `src/`, then rebuild; do not edit the generated `index.html` directly. To validate and regenerate the underlying data and verification documents, run `python3 tools/build_data.py` from `counterspace/`. The website reports its source edition and data cutoff; it does not claim to be a live feed.

## Rendered pictures (Blender)

The thirteen 3D-explainer posters (`src/assets/posters/*.webp`) and the hero's Earth limb (`src/assets/hero-limb.jpg`) are rendered with Blender (Cycles; made with 5.3) from the NASA textures in `src/assets`. To regenerate them, from `counterspace/`:

```sh
blender -b -P tools/blender/posters.py          # add -- --only starfish,rpo for some scenes
blender -b -P tools/blender/hero.py
python3 tools/blender/finish.py                 # posters: bloom, vignette, 960 px WebP
python3 tools/blender/finish.py --hero          # hero limb: straightened strip
```

Then rebuild. `tools/make_posters.mjs` still captures posters from the live WebGL scenes, if you prefer those.

How the Blender code is laid out, all in `tools/blender/`:

- `kit.py` is the shared Earth, atmosphere, stars and effects; `compose.py` is the camera and screen-placement helpers; `surface.py` is the lofting, texture and material tools.
- The thirteen pictures are in four files by kind: `scenes_kinetic.py` (Starfish Prime, Fengyun-1C, Mission Shakti), `scenes_launch.py` (Solwind, Burnt Frost, DN-2), `scenes_leo.py` (Cosmos 1408, GNSS jamming, MIRACL, spaceplanes) and `scenes_geo.py` (Viasat, SJ-21, the close approaches). Each has its own helper modules (`kinetic_*.py`, `launch_*.py`, `leo_*.py`, `geo_sats.py`).
- The models are built in code at real dimensions: `f15.py` (the F-15A), `sats.py` (satellites and the International Space Station), `x37b.py`, `airliner.py`, and `models.py` (the ASM-135, the SM-3 and the DN-2 upper stage).

The source data and interpretation rules are documented in `methodology.md` and `ledger.md`. Fonts retain their OFL licenses under `fonts/`; D3 and Three.js license notices are reproduced in `THIRD_PARTY_NOTICES.md`.
