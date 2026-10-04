# Track S1: the 3D scene viewer (window, controls, story panel)

Read `design/DESIGN.md` first, all of it, especially sections 2, 3, 6 and 7. Read `src/scenes/README.md`. This brief adds what is specific to you.

## What you own

- `src/styles/scenes.css`, `src/partials/overlay.html`, `src/scene-ui.js`.
- The viewer's wording: every visible and spoken string in those files (button names, captions of controls, status messages, accessible names).
- You may edit `tools/scene_check/collectors.mjs` and `tools/qa.mjs` only to keep them working if you change element structure; the meaning of every rule must stay the same.
- Do not edit the 3D renderer (`src/scenes/gl-*.js`, `sim*.js`, `cameras.js`, `earth.js`: track S2), the static diagrams (`src/scenes/svg/*`, `svg-fallback.js`, `gl-still.js`: track S3),
  `base.css` (track P) or the scene text in `src/scenes/configs/*` (a later copy pass). Use the shared component classes from `base.css`; style them for the viewer in `scenes.css`
  with selectors scoped to `.overlay`.

## The job

Make the scene viewer feel like a polished product, not a debug panel. It is a dark window in both themes (put `scope-dark` on `.overlay` in `overlay.html`; that re-declares the dark colours).

1. **Frame.** The panel is larger and calmer: up to 1480 px wide and 92% of the window height on desktop, radius 22 px, `--shadow-3`, a soft backdrop blur and dim behind it. Open and close with a
   200 to 320 ms fade and slight scale (`--ease`); none under reduced motion. Focus moves into the panel on open, stays trapped, and returns to the control that opened it on close (check what
   exists and keep it working).
2. **Header.** At the left, a small eyebrow ("3D explainer") and the scene title in Newsreader at 26 px (22 px on phones). At the right, previous and next as 40 px round icon buttons (icons from the
   sprite: `i-prev`, `i-next`), then close (`i-close`). In the middle or under the title a row of small dots, one per scene, the current one filled in the accent colour; each dot is a button that
   jumps to that scene (24 px hit area, accessible name "Scene 4: <title>"). Replace the glyphs ◀ ▶ ✕ ❚❚ ⤓ ⚖ with icons.
3. **Picture area.** Fills the left column; the caption chip ("Drawn for illustration. Orbit heights are squeezed to fit." or the scene's own wording from the config) sits at the top left in the label
   style from DESIGN.md section 7; a loading state while three.js or textures load (a calm shimmer plus the words "Loading the 3D view"); an error state in plain words if 3D is unavailable.
   Keep `#sceneView` as the element the renderer draws into and keep every id used by the code (`scPrev`, `scNext`, `scClose`, `scPlay`, `scScrub`, `scTime`, `scCams`, `scStatus`, `scExport`, `scRelated`,
   `sceneTitle`, `sceneCaption`, `sceneSteps`, `sceneSrc`, `sceneDate`, and so on; search the code before renaming anything).
4. **Story panel (right column).** The scene's text in Newsreader 18 px with a 66-character line, comfortable spacing. Under it "What happens" as a vertical timeline: each step is a button with
   its time ("0 s", "2 s") in a quiet tabular figure, a dot on a thin line, the current step highlighted and followed as the animation plays, completed steps dimmed less than upcoming ones;
   selecting a step jumps the scene to the start of that step. The source is a small quiet block at the bottom with a proper link (external icon). "Related law" is a clear secondary button with the law icon.
   The panel scrolls inside itself on short windows with a soft fade at the edges; the old "Scroll for more" cue is replaced by that fade (keep screen reader access and keyboard scrolling).
5. **Control bar.** Large play and pause button (48 px round, icon swaps), a scrubber with its track drawn in the accent colour up to the handle, small tick marks at the start of each step, a 20 px
   handle with a focus ring, the time as "8 s of 14 s" (tabular figures); a segmented control (`.seg`) for the views (the view buttons are built in `scene-ui.js` from the scene's camera presets; plain names);
   and "Save image" (icon `i-image`) which calls the existing still export. All controls at least 40 px high on touch screens (44 px if you can).
6. **Keyboard.** Space plays or pauses, Left and Right arrows change scene (when focus is not in the scrubber or a text control), Escape closes, 1 to 5 choose a view. Show a one-time quiet hint chip the
   first time the viewer opens in a session (no storage: keep it in memory). The dialog still announces itself properly to screen readers; status text (live region) is in plain words ("Scene 3 of 13: Fengyun-1C").
7. **Phones (390 px).** Picture on top (about 52% of the height), the story below in its own scroll area, the control bar pinned at the bottom with big targets; the step timeline collapses to the current step
   plus a "All steps" disclosure; scene dots become a compact "3 / 13". Nothing clips; no horizontal scroll; safe-area insets respected.
8. **Static fallback state.** When animation is switched off or 3D is unavailable the viewer shows the still diagram; the control bar then hides the scrubber and explains in one plain sentence ("Animation is
   switched off on this device. This is a still diagram."), keeps the steps list (selecting a step is disabled and explained), and keeps Save image.
9. **Words.** Apply DESIGN.md section 3 to every string you own. No "scene" jargon beyond "3D explainer" and the scene's own title; no "preset", "WebGL", "static diagram", "PNG". Run `node tools/copy_lint.mjs`
   and clear the hits in your area.

## Care points
- The renderer, step data and camera presets come from other modules through `window.__cs` and imports. Read how `scene-ui.js` talks to them and keep that contract intact. If you need something new from the
  renderer (for example the current step index or the step times), derive it from the scene config in `scene-ui.js`; ask S2 only if impossible and say so in your report.
- Contrast 4.5:1 on every text, 3:1 for large text, focus ring visible on every control, targets at least 24 px (more on touch), reduced motion respected.
- `tools/scene_check.mjs` measures label collisions in the picture; changing the picture area's size changes the label layout. Run it for a few scenes (`ONLY=starfish,rpo,laser,fengyun VPS=1440,375 MODES=live`; see
  the file header of that tool for the exact options) to make sure nothing regressed, and report anything that did.

## Ports
Use 9130 to 9139.

## Done means
Opening any of the 13 scenes at 1440, 900 and 390 px looks like a well-made product: calm hierarchy, no glyph icons, clear controls, a story panel that follows the animation, smooth open and close,
and a keyboard route through everything. `node tools/copy_lint.mjs` shows no errors in your strings; `node tools/qa.mjs` shows no page errors or axe violations; `scene_check` for the scenes you tried shows no new failures.
