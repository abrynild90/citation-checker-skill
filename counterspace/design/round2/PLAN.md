# Round 2 plan: the layer that makes it feel award-winning

Round 1 gives the page a consistent, polished design system. Round 2 adds what separates a polished page from a memorable one: imagery that sells the subject, motion that explains, and
interactions that feel considered. Every item has a reduced-motion version (no movement, same information), keeps the page accessible, and does not slow the first screen.

## Principles

1. **Imagery carries the story.** Charts alone are dry. Each chapter is connected to a 3D explainer through a real picture (a poster rendered from the live scene) so the reader sees what the data is about.
2. **Motion explains, never decorates.** Entrances reveal order (earlier events first); the cursor shows one time across all charts; the hero responds to where the reader is.
3. **Everything is reachable and shareable.** Any explainer has a link (`#scene=<id>`), opens from the thing that was clicked, and closes back to it.
4. **Stillness is respected.** `prefers-reduced-motion`, `?still`, print and downloads never animate.
5. **Cheap first screen.** No new network requests; images are embedded and small; animations use transform and opacity only.

## Tracks

### R2-N: narrative layer (page)
- **Explainer gallery.** After the hero and before chapter 01: "Thirteen 3D explainers" as a scroll-snap row of cards (poster 16:9, year, title, one plain line), arrows on desktop, swipe on phones,
  keyboard reachable, the card opens the viewer. Cards use `posterURL(id)` (see Assets). A small "Play all as a tour" button starts the tour.
- **Chapter openers.** Chapters 02 to 05 open with a slim banner (about 200 px) behind the heading: the most relevant poster, darkened and softly blurred at the edge, with "Watch the 3D explainer: <title>" as a
  button. Chapter 01 and 06 use a calm gradient and orbit-line artwork drawn in SVG.
- **Scroll-linked hero.** While the hero scrolls out, the Earth drifts and dims slightly (transform only); as each chapter enters view the matching orbit shell glows in the hero picture (the hero stays behind
  as a fixed, small "orbit indicator" in the chapter rail: low, medium, geostationary).
- **Reveal on scroll.** Chapter headings fade and rise 12 px once, when 20% visible. Nothing hides content from search or assistive technology.
- **Details.** Number counters in the five large figures count up once (400 ms), selection colour, thin scrollbars, a subtle paper grain in light mode, balanced text wrapping.

### R2-M: chart motion and the year cursor
- **Entrance.** The first time a chart is 25% in view, its marks appear in date order over at most 900 ms (opacity and a 6 px rise; bars grow from their start); the axis draws first. Mark the finished state with
  `data-ready="1"` on the chart box so tests can wait. No entrance under reduced motion, in downloads, or when the page is printed.
- **Year cursor.** Pointer movement over any chart or the law timeline shows a hairline at that year across every chart and the law timeline, with a year label chip on the chart under the pointer and on the law
  timeline. Touch: tap shows it. Keyboard: arrow keys move through marks and set it. It never blocks hover cards.
- **Cross-highlight.** Hovering or focusing a capability event softly highlights its paired law item on the law timeline (and the reverse), using the existing pairing data.
- **Chart details.** Number formatting, hover easing, consistent mark sizes, a calm "nothing here" state.

### R2-V: scene viewer finish
- **Opens from the click.** The viewer grows from the mark, card or button that opened it (transform origin at that point) and shrinks back to it on close; fade only under reduced motion.
- **Instant picture.** The poster fills the picture area immediately while three.js and textures load, then cross-fades to the live scene.
- **Deep links.** `#scene=<id>` opens that explainer on page load; opening and closing update the address (replace, no history spam); a "Copy link" button copies it.
- **Tour.** "Play all as a tour" advances through the explainers with a quiet progress indicator and a pause control; Escape ends it.
- **Polish.** Scrubber hover preview of the step name; step jump animation; focus ring consistency.

### R2-D: 3D finishing
- Filmic tone mapping and gentle exposure per scene; a cheap bloom-style glow for bright effects (a downsampled additive pass, only on capable devices); sun glare near the limb; soft cloud layer; aurora and
  radiation glow for Starfish; faint Milky Way band; film-grain-free, banding-free gradients. Hero live globe: gentle parallax with the pointer.
- Budget: median frame time must not rise by more than 25% on the test machine's software renderer; phones keep the old cheaper path.

### Assets (done by the orchestrator before the tracks start)
- `tools/make_posters.mjs` renders one 16:9 WebP per scene from the live scene (labels hidden); `src/assets/posters/*.webp` are embedded by `tools/build_page.py` into `<script id="cs-posters">`;
  `src/scenes/posters.js` exports `posterURL(id)`.

## Checks (every track)
`node tools/smoke.mjs`, `node tools/qa.mjs`, `node tools/copy_lint.mjs`, `node tools/contrast_check.mjs`; `node tools/scene_check.mjs` for any scene touched; screenshots in both themes at 1440, 900 and 390 px;
reduced-motion run (`colorScheme` unchanged, `reducedMotion: 'reduce'`) shows the same content with no movement.
