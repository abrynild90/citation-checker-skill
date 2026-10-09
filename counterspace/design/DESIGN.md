# Counterspace Timeline: design system and plain-language guide

This is the reference for how the page looks, reads and behaves. It is written for the people who build and review the page. Every rule here can be
checked by looking at the page or by running a tool in `tools/`.

## 1. What "excellent" means here

The main visitor is a member of the general public or a journalist with no space-law background (confirmed by the product owner); readers of the book are a
secondary audience. They are not engineers. Their first job is to see law and weapons on one timeline. In the first ten seconds they should think: this is a
carefully made piece of editorial design about something serious. In the first minute they should see how weapons and law line up in time. In the next ten
minutes they should understand, without effort, what the charts show, which events have a 3D explainer, and where every fact comes from. Explain everything
from scratch: spell out acronyms, say what a thing is before why it matters, never assume the reader knows the law.

`PRODUCT.md` (project root) holds the product truth. This guide holds the visual and wording rules. Where the Impeccable design skill's rules (next section)
conflict with anything below, the Impeccable rules win.

A reviewer scoring from screenshots and by clicking around gives 97 or more only when all of this is true:

1. **Hierarchy is obvious at a glance.** One idea per screen. Headline, then explanation, then evidence. Nothing competes with the main thing.
2. **One visual language.** The same type scale, spacing, radii, shadows, icons, controls and colour roles everywhere: page, charts, cards, 3D scene
   viewer, downloads and saved images. No component looks like it came from a different site.
3. **Charts read themselves.** Direct labels beat legends. Annotations say what to notice. Marks are crisp, separated from the background by a thin
   halo, and big enough to hit. Axes and grid lines are quiet. Empty space is composed, not left over.
4. **The 3D scenes look like a documentary graphic.** Photographic Earth with day and night, atmosphere, believable spacecraft materials, clean glows
   and trails, labels that never collide, smooth camera moves.
5. **The scene viewer feels like a good product.** Clear controls, a scrubber that shows the story's chapters, steps that follow the animation, keyboard
   shortcuts, motion that eases, and a calm layout on a phone.
6. **It works everywhere.** Light and dark themes both look designed (not inverted). 390 px, 900 px and 1440 px all look intentional. Text never
   clips. Touch targets are comfortable. Reduced motion is respected.
7. **The words are plain.** No software jargon, no internal vocabulary, no stock phrases. See section 3.

## 1b. Impeccable rules (the design skill the product owner asked us to follow)

Source: impeccable.style (skill files `SKILL.md`, `reference/craft-floor.md` and the command references). The detector (`impeccable detect`) applies 61 rules to the built page; it is
a gate, not a verdict. These are bans and floors, not tastes.

Bans:
- No kicker or eyebrow label above a heading. No section numbers (01, 02). No badge above the headline.
- No hero-metric template (big number, small label, supporting stats). Facts live in sentences and in the contents list.
- No colour border-left or border-right wider than 1px on cards, list items, callouts or alerts.
- No gradient text. No glass or blur as decoration. No zero-offset coloured halos. No hard offset shadows. No hairline border together with a wide soft shadow on the same card.
- No same-size icon-heading-text card grids as page structure. Never nested cards.
- No unicode glyphs or emoji as icons (one drawn icon set only).
- No cream or beige page background by reflex; no purple-to-cyan "AI" palette; no neon glow on dark.
- No identical scroll-in on every section. No bounce or elastic easing. No animation of layout properties. No pulsing, blinking or auto-scrolling decoration.
- Copy: no em dashes in prose, no "Not X. Y." slogan contrasts, no generic marketing words, no repeated text inside one container.

Floors:
- Contrast 4.5:1 for text (3:1 for large text). Body measure 65 to 75 characters. Body text 16px or more; nothing under 12px. Line height at least 1.3 for multi-line text.
- Display type at most 96px; tracking never tighter than -0.04em (we stay above -0.02em). Balanced headings. Obvious scale and weight steps.
- Motion: one authored moment (the hero), functional transitions elsewhere, exponential ease-out (`cubic-bezier(.16,1,.3,1)`), content visible by default, a real `prefers-reduced-motion` alternative.
- States for every control (hover, focus, active, disabled, loading, empty, error). Browser surfaces (selection, caret, scrollbars, focus ring, underline offset, tabular numerals) carry the design.
- Light or dark is chosen from the use scene, not by category: readers look at the page in daylight and in the evening, so both themes are first-class; the hero and the 3D viewer are dark because the subject is space.

Process (in order): critique (two isolated assessments: design review and detector with browser evidence), audit (accessibility, performance, theming, responsive, implementation integrity; 0 to 4 each),
then the refine commands that fit the findings (typeset, layout, colorize, animate, delight, adapt, harden, optimize, clarify, distill), then polish. Verify in bounded passes: build, inspect once with desktop and mobile
together, fix in one batch, confirm once, stop.

## 2. Look and feel

**Idea: an observatory atlas.** Deep ink-blue night for the dark theme, warm paper for the light theme. Precise thin lines like a printed atlas, with
light that seems to come from the data itself. Serif for ideas, sans for facts and controls.

### 2.1 Colour (CSS variables in `src/styles/tokens.css`; both themes must define every role)

| Role | Dark | Light |
|---|---|---|
| `--bg` page | `#070b16` | `#f6f4ee` |
| `--bg-2` alternate band | `#0b1224` | `#efece3` |
| `--surface` card or panel | `#0f172b` | `#ffffff` |
| `--surface-2` control | `#16203b` | `#f1efe8` |
| `--surface-3` pressed or selected | `#1d2848` | `#e6e2d6` |
| `--line` hairline | `rgba(150,175,230,.16)` | `rgba(30,35,55,.16)` |
| `--line-strong` | `rgba(150,175,230,.30)` | `rgba(30,35,55,.30)` |
| `--grid` chart grid | `rgba(150,175,230,.10)` | `rgba(30,35,55,.10)` |
| `--text` | `#eef2fb` | `#151a28` |
| `--muted` | `#b3bdd6` | `#424a5e` |
| `--faint` | `#8791ae` | `#596176` |
| `--accent` cool | `#7cc4ff` | `#1b5aa6` |
| `--accent-2` warm | `#ffc86b` | `#8a5a00` |
| `--focus` | `#ffd24d` | `#b36b00` |

Data colours (`--c-us`, `--c-ru`, `--c-cn`, ...) keep their current colour-blind-safe values. Text contrast is at least 4.5:1 everywhere (3:1 for
text of 24 px or more). Check with `node tools/contrast_check.mjs`. Never use colour alone to carry meaning: shape, fill or a label always repeats it.

### 2.2 Type (fonts are already embedded: Newsreader and IBM Plex Sans)

| Use | Spec |
|---|---|
| Display (page title) | Newsreader 500, `clamp(40px, 6vw, 72px)`, line 1.02, tracking -0.02em |
| Section title (h2) | Newsreader 500, `clamp(28px, 3.4vw, 42px)`, line 1.12 |
| Sub-title (h3) | Plex Sans 600, 20 px, line 1.3 |
| Lede | Newsreader 400, `clamp(19px, 2vw, 23px)`, line 1.5 |
| Body prose | Newsreader 400, 18 px, line 1.6 (reading width 66ch) |
| Interface text | Plex Sans 400/500/600, 14-15 px |
| Small | Plex Sans 13 px. **Nothing smaller than 12 px anywhere, including inside charts.** |
| Short label (key group names, table headers) | Plex Sans 600, 12.5 px, uppercase only when 1 to 3 words, tracking 0.08em |
| Numerals | Plex Sans with tabular figures |
| Reference band (after the quiz) | one step down: band h2 Newsreader 500 `clamp(24px, 2.3vw, 30px)`, sans h3 600 17 px, chart title (h4) Newsreader 500 `clamp(21px, 1.9vw, 25px)`, ledes Newsreader 15 to 17 px, takeaway Newsreader 500 17 to 19.5 px, callouts 14.5 to 15.5 px |

### 2.3 Space, shape, depth, motion

- Space scale (px): 4, 8, 12, 16, 24, 32, 48, 72, 112. Chapters are 96 px apart on desktop and 64 px on a phone.
- Page container: max 1240 px, side gutters 24 px (20 px on a phone). Reading column 66ch.
- Radii: 8 for controls, 14 for cards and panels, 22 for the hero and the scene viewer, 999 for pills.
- Shadows: three levels (`--shadow-1`, `--shadow-2`, `--shadow-3`), softer and wider in light, deeper in dark. No glows on text.
- Motion: `--ease: cubic-bezier(.2,.7,.2,1)`; 120 ms for hover, 200 ms for state changes, 320 ms for panels. Everything animated stops under
  `prefers-reduced-motion`.

### 2.4 Components (shared; `base.css`)

- **Buttons.** Primary is a filled pill (48 px high), secondary is a thin outline pill, tertiary is plain text with an icon. Icon buttons are 40 px
  circles. Every button has hover, pressed, disabled and a 3 px focus ring.
- **Segmented control** (year range, grouping, scene views): one rounded track, the selected item sits on a raised thumb that slides.
- **Icons.** One set only: the sprite in `src/partials/icons.html`, used as `<svg class="ico"><use href="#i-name"/></svg>`. Never use text glyphs
  (`▶ ◀ ⟳ ⤓ ⚖ ✕ ◐`) or emoji as icons. Add new icons to the sprite in the same style (24 px grid, 1.8 px stroke, round caps).
- **Hover cards.** Small, calm, serif title, a short definition list, a quiet source line. Same card on every chart.
- **Key.** A single line of swatch and label pairs at 13.5 px, grouped under short plain group names. Hidden behind "How to read this" when long.
- **Callout** (the one thing to notice): a tinted block with an icon at the start and one or two sentences of serif text. No side stripe.
- **Tables.** Tidy, 14 px, zebra-free, sticky header, comfortable padding. On a phone each row becomes a labelled card.

## 3. Words

Write like a careful editor at a good magazine explaining something to an intelligent friend. Short sentences. Active voice. Say what the thing is,
then why it matters. Never explain the software.

### 3.1 Say this, not that

| Not this | This |
|---|---|
| ledger, ledger row, "in the ledger" | the records, entries, "in our records", "the data" |
| rows (of data) | entries, events, operations |
| Export SVG / Dark SVG exports | Download chart / Dark colours in downloads |
| Export still (PNG) | Save image |
| cube badge, 3D badge | cube icon ("Select a cube icon to open a 3D explainer") |
| scene tour | 3D tour |
| preset, camera preset | view |
| compressed radial scale, orbit-propagated, altitude^0.45 | "Not to scale: orbit heights are squeezed so every orbit fits." |
| builder-assessed, coding, whisker | "our reading of the report", "classification", "range bar" |
| pinned on scroll | stays in view as you scroll |
| lane (chart) | row |
| mark (chart) | point, dot, bar (be specific) |
| static diagram, reduced motion, no WebGL | "still diagram" and a human reason ("Animation is switched off on this device.") |
| Chart A / B / C | name the chart by what it shows |
| schema 1.2.0, file names (`ledger.md`) | leave out, or "Data last updated 29 September 2026" |
| simulated, illustrative (in every label) | say "Drawn for illustration" once per scene |

### 3.2 Chapter names (use these exact words in the page, navigation, section titles and cards)

| Name | Title of the section |
|---|---|
| Law and weapons timeline | Law and weapons on one timeline (the law strip, "Scrub through time", then: How high the tests went, and the debris they left) |
| What the pattern shows | What the pattern shows (four findings, each linking to its chart) |
| The evidence, when you want it | The reference band after the quiz, in two parts: Explore the data (cards, one chart at a time) and Where every fact comes from |
| Explore the data | Explore the data (cards that are also the tabs, one chart at a time) |
| Jamming, lasers and cyber (tab) | Attacks that leave satellites in orbit |
| Close approaches (tab) | Satellites that fly close to other satellites |
| Who can do what (tab) | Which states can do what, decade by decade |
| How long the law took (tab) | How long the law took to follow |
| Sources and method | Where every fact comes from (one disclosure, "Read the sources and method") |

Spell out acronyms on first use in each section (anti-satellite, ASAT; low Earth orbit, LEO). SWF means the Secure World Foundation: say so the
first time it appears on the page. Domain terms the book itself uses (GEO, GNSS, co-orbital) stay, with a short gloss on first use.

### 3.2b Voice

Warm, sharp and plainly spoken. The subject is weapons and law, so the warmth comes from clarity and from the reader being treated as someone who can take a straight
fact, never from jokes about harm. Rules of thumb, in order of importance:

1. **Accuracy first.** A line is only as lively as the claim allows. If wit would stretch a fact or the legal cautions (order in time, not cause; soft law binds no one; the
   2024 veto was about nuclear weapons in orbit), the plain sentence wins.
2. **Short sentences, concrete numbers.** "Only four of the 19 items are treaties. Three are expert manuals, which bind no one." beats a long sentence with "and".
3. **One surprising fact a section, said once.** The scenes (a fighter jet as the launch pad), the timeline (four treaties of 19), the pattern (4 months to 15.1 years), the quiz
   (two answers catch people out) and the reference band (nothing there is required reading) each get one. Do not stack several.
4. **Dry, not clever.** A little understatement is welcome: "Nothing here is required reading." "Four questions, no pressure." "The strip follows you down." No puns, no
   exclamation marks, no addressing the reader as "folks", no jokes at the expense of the events or the people in them.
5. **Say what the reader will see, then let them look.** Section ledes name what is on the screen and what to do with it, in one or two sentences, and stop.
6. **Wrong answers are fair guesses.** The quiz says "A fair guess, but no." and then gives the true order; it never scolds.
7. **Same claim, new words.** Rewriting for voice never changes a number, a date, a name, a hedge or a source. When in doubt, keep the old wording and add nothing.

### 3.3 Never

Stock phrases and filler: delve, tapestry, landscape, navigate, seamless, leverage, robust, crucial, pivotal, unlock, empower, journey,
comprehensive, cutting-edge, "it's worth noting", "not just X but Y", exclamation marks, rhetorical questions as headings that are not answered
immediately. Do not pad. If a sentence can go without losing a fact, it goes.

`node tools/copy_lint.mjs` opens every screen, hover card, download and scene (animated, still and phone) and fails on any of the above. It must report
no wording errors.

## 4. Page anatomy

1. **Hero.** Full width, dark in both themes (the subject is space). Display title and lede at the upper left of the picture, which is the page's thesis: every test with a reported
   altitude as a dot rising from the Earth's limb, every law as a tick on the ground, on the shared years. Under it one key line with a small drawn sign for each mark (dot: a test in
   orbit; tick on the ground: a law or policy; dashed line: a test and the first law after it; ring: a 3D scene) and one row of two actions: "See the timeline" (primary) and "Take the 3D tour". ("Surprise me" is the first tile of the 3D strip, and the quiz is a chapter, not a hero button.) On a window of 900 px or more the hero fills the first screen exactly and the picture takes the spare height. On windows of 1600 px and more, three plain sentences counted from the data fill the empty sky at the top right; where a dot stands in that corner (the 2013 rocket does at 1800 px and more), they stand
   in one column in the sky between the headline's words and that dot instead. Once, after the first paint and only at the top of
   the page, a sweep draws each linked pair (dashed line growing from the weapon to the law, then "N years later") one after another, with that pair's sentence from
   the data replacing the key line and ending in "Watch ... in 3D" where the pair has a scene (the key leaves before the sentence arrives and the other way round, so the two never overlap).
   It ends on one beat: the longest wait in the pair data (15.1 years), drawn along the horizon between its two dates and named in the caption; the Replay button becomes "Skip" while it runs, and Replay runs the history and then the sweep again. It is off under reduced motion and ends at the first
   pointer on a dot or tick. Pointing at a dot or tick opens a short, wide card on the clearest spot of the sky (never over a dot, tick, note, zone name, year, law name or the headline words; a dot or tick with a 3D scene shows that scene's picture as a small thumbnail beside the words),
   rings both ends of a link, draws the dashed line with the time between, and hides any caption the line crosses and quietens any its tag would cross. A new card replaces the open one at once; the old one is
   kept for 700 ms while the pointer stays in the corridor between the dot and the card, and Escape closes a card pinned by a click. After 3 and after 7 scenes seen, one more real pair is drawn
   on the resting picture as a thin dashed link (memory only), with a note beside the "seen" count. When all 13 scenes have been seen, closing the last one opens a card docked under the buttons
   (never over the picture) with the real pairs drawn as links, one plain line and "Where to next" (the quiz, or the full timeline); the tour's closing slide carries the same recap. Before any interaction no 3D library is loaded.
2. **Chapter navigation.** The slim rail on the right edge (screens at least 1360 px wide) with six dots; the name shows on hover and focus. It is the page's contents list: 3D scenes,
   the timeline, the pattern, the quiz, "Explore the data" and "Sources and method" (the last two are the two halves of the reference band, see item 3).
3. **Two layers, the second one quiet.** Layer one is what everyone reads, about five screens at 1440 x 900: hero and start row, the 3D strip, one timeline chapter (the law strip and the
   anti-satellite test chart on the same years), "What the pattern shows" (it opens on one large line, the range of the waits, with the longest pair drawn between its dates, then four findings computed from the data, each linking to its chart) and the quiz, which sits just after the pattern it echoes. Layer two is the **reference band**, headed "The evidence, when you want it": a hairline, an h2 of 24 to 32 px and one line, then two parts set a size down
   (sans h3 of 17 px, ledes of 15 to 17 px, chart titles of 21 to 25 px, tighter spacing, no background change so every chart keeps the page as its ground). The first part is "Explore the data":
   four compact cards (a small picture, a name and one line each, about 80 px high) that are also the tabs, one for each remaining chart (jamming, lasers and cyber; close approaches; who can do what; how long the law took). One chart shows at a time, with its own title, one-sentence takeaway, any notes, and then one disclosure,
   "Key, data table and download" (the key, the table and the download button together, with the entry count on it), sharing a row with the way on to the next chart. The second part is "Where every fact
   comes from": one line and one disclosure, "Read the sources and method", with the copy-citation button at its end. The whole page is about 6,800 px tall at 1440 x 900 with the first chart open. Nothing is removed: every chart, table and download stays, and print shows every tab. The cards follow the ARIA tabs pattern
   (arrow keys, Home, End, one tab stop), and an address that names a chart or something inside one (`#chartC`, `#lag`, `#tableC`) opens its tab first. Panels not chosen stay laid out at full width,
   out of sight (`data-off`), so every chart is drawn at its true size whichever tab is open. The order of the page: hero, 3D strip, law and weapons timeline (with "Scrub through time"), pattern, quiz, the reference band (explore, then sources).
4. **Chapters.** Each has: a title (h2), one plain-language sentence saying what to look for, the chart, an optional callout, and one disclosure, "Key, data table and download" (the key, the table and the download button together; the law timeline keeps its key beside the strip and its own "Show the data behind this chart"). No label above
   the title, no number. A chart inside a chapter takes an h3 and a quieter lede; inside the reference band it takes an h4 (the band is h2, its two parts h3).
5. **Law strip and "Scrub through time".** Beside "How to read this chart" the chapter head offers "Scrub through time"; the control itself is a thin row above the test chart that stays under the pinned strip while the chart is read
   (hidden on a phone). Its line starts and ends where the charts' year axes do. Dragging it, the arrow keys (one year; Page Up and Page Down ten; Home and End the ends) or Play (1957 to 2026 in about twelve
   seconds; the button becomes "Skip") fog the years it has not reached on the strip, the zoom panel and the test chart together, with a running tally ("1968: 25 tests, 2 laws") counted from the same entries;
   the thumb sitting at the end means no fog. Play ends on the longest wait in the pair data, drawn along the slider's own line the way the hero draws a link, and named in a sentence. Reduced motion has no
   Play: the slider is moved by hand. It adds no data of its own.
   The row is two short lines about 45 px tall (6 px of air above the title so it clears the strip's hairline; a round Play button in the axis's left margin, the title or a caption over the line, the tally at the right; 3 px between the words and the line so the thumb never touches them) and keeps that height in rest, drag, Play and the closing sentence (on a tablet window the closing sentence is set a size smaller to stay on one line). Play first brings the page to where the row is already pinned, so nothing shifts when it starts. A caption names an event only while the playhead is within a year of it, then fades. The strip and the row together stay near 120 px of a 900 px window; it
   lets go of the top while the chart's "Key, data table and download" fold is open and ends with its chart. Its ids and classes all start with `yr` (the 3D scene controls own `sc*`, `scrub`, `scrubWrap`; tools/check_ids.mjs fails on a
   repeated id). While the slider passes an event the page has a 3D scene for, a one-line caption (year, name, what it was, "Watch in 3D") takes the title's place for about three seconds, or for as long as the slider rests on that year
   (always, under reduced motion). Notes on the charts carry the x of the event they name and fade whole while it is ahead of the slider; the fog sits under them and never cuts a word.
   The strip stays in view as the reader scrolls the test chart and, in "Explore the data", from the top of the drawing of the two tabs that share its years (jamming; close approaches), never over their headings, cards or notes, with the years it shows following the chart under it. It steps
   aside over the findings and the quiz, over the two tabs with their own scales (decades; years to law), and once "Explore the data" has been read to its end (by that section's own bounds, at any window height).
6. **Sources and method.** The second part of the reference band: a one-line head, then one row: the closed "Read the sources and method" disclosure with the copy-citation button at its end. Inside, readable at 66ch: what the data is, what is counted, what is not, how to cite, licences and credits.
7. **Footer.** Three short columns: about this page, data and licence, type and images.

## 5. Charts

- Same year axis in every chart (1957 to 2026) so years line up vertically. Zoomed views are labelled as zoomed.
- Axis text 12 px Plex Sans 500 in `--muted`; grid lines `--grid`, 1 px; no chart frame; band fills at low opacity; category bands labelled inside.
- Marks: a 1.5 px outline in `--bg` around every mark so overlapping marks separate. Hover or focus enlarges to 115% and adds a soft ring.
- Direct labels for the few things that matter. Use annotation lines with a small dot at the data end.
- Controls: a segmented control for ranges and groupings; a quiet "Download" button with the download icon.
- Empty space is composed. Where a chart is empty by design (before 2003, say), say so in the chart in one short line, set in `--faint`.
- Every chart has an accessible name, a data table behind a disclosure, and keyboard access to every mark.

## 6. 3D scene viewer

- A dark panel in both themes. Header: scene number as small dots, the title, previous, next, close (icon buttons).
- Left: the picture. Right: the story in serif at a comfortable size. "What happens" is a vertical timeline whose current step follows the animation;
  selecting a step jumps to it.
- Control bar: play or pause (icon), a scrubber with a tick for each step, the time, a segmented control for views, and "Save image".
- Keyboard: Space plays or pauses, Left and Right change scene, Esc closes, 1 to 5 choose a view. A small hint is shown once.
- The tour: Previous and Next (and the arrow keys) move the tour along and it keeps running; only "Stop the tour" or choosing a scene from the dots ends it. Its closing slide is one column (two from 1500 px: the words at the left, the six pairs at the right; from 1800 px a size up, with the story centred in the room above the buttons and the buttons resting on the foot of the panel, so there is no empty band above and below): the six pairs, one plain line, a "Revisit a scene or a chart" disclosure (the 13 scenes and the 4 chart links), and the actions pinned at the foot so they are never clipped.
- Open and close with a short fade and scale. Phones: picture on top, story below, controls pinned at the bottom with 44 px targets.

## 7. 3D picture quality

- Earth: photographic day side, city lights on the night side with a soft terminator, ocean glint, a thin atmosphere rim, optional soft clouds.
  Embedded images (`src/assets/earth-day.jpg`, `earth-night.jpg`, read with `loadEmbeddedEarth()` in `src/scenes/earth.js`) appear instantly; the full
  NASA images replace them when they arrive.
- Sky: fine stars of different sizes and colours, no banding.
- Spacecraft: believable materials (metal, foil, glass solar cells, gloss), a faint reflection of the Earth, small details (antennas, thrusters).
- Light effects: clean additive glows, beams with a soft core and falloff, debris with depth and fade, trails that taper.
- Labels (live 3D, still diagrams and saved images all use this one look): a pill with a 1 px border `rgba(150,175,230,.35)` on `rgba(8,13,28,.72)`, radius 8 px,
  padding 4 px 9 px, Plex Sans 600 at 12.5 px (never below 12 px, 13 px or more on touch screens), text `#eef2fb`, a 7 px dot of the item's colour at the left, a 1 px leader
  `rgba(238,242,251,.55)` ending in a 3 px dot on the item. Secondary labels (places, orbit names) are the same without the dot and at 85% opacity. Warning or analysis captions use the
  warm accent `#ffc86b` text on the same pill. Labels never overlap each other, the Earth's bright limb or the caption.
- Keep memory flat (open and close every scene and the counts must return to baseline) and keep initial page weight under 1.2 MB.

## 8. Accessibility floor (non-negotiable)

Contrast as in 2.1. Targets at least 24 px, and 44 px for page-level controls on touch screens. Visible focus on everything. Reduced motion respected.
Text can be enlarged to 200% without losing content. Screen-reader names in plain words (no jargon).

## 9. Working rules for everyone building

You work in your own checkout of the repository (a git worktree), so other people's unfinished edits never break your build.

- **Where.** Run `pwd` and `git rev-parse --show-toplevel` first. The site is the `counterspace/` folder of your checkout. Use relative paths. Never read from
  or write to `/home/user/citation-checker-skill` (that is the orchestrator's copy) and never run git commands there.
- **Once, at the start.** `ln -s /home/user/citation-checker-skill/counterspace/tools/node_modules counterspace/tools/node_modules` (the shared tool
  installation), then `git checkout -b track/<your-track-name>`.
- **Build.** `cd counterspace && python3 tools/build_page.py` writes `./index.html` in your checkout. Never commit `index.html` (the orchestrator rebuilds it
  once after merging). Commit with `git add -A . ':(exclude)index.html' && git commit -m "..."`. Do not push. Commit after each finished item so work is never lost.
- **Own files only.** Edit only the files your track brief lists. For `src/template.html` edit only your own regions. If you need a change elsewhere, make
  your side work without it and write the request in your final report. Do not restyle the shared components in `base.css` (buttons, segmented control, chips,
  disclosure, chapter heading); the page-shell track owns them. Use their class names.
- **Icons.** Use `<svg class="ico"><use href="#i-name"/></svg>` from `src/partials/icons.html` (41 icons). If a missing icon is essential, add one
  `<symbol>` at the end of the sprite in the same style and say so in your report.
- **Ports.** Tools start a local server. Use `PORT=<n>` from the range in your brief, a different number for each tool you run at the same time. Stop
  servers you start by their process id (`kill <pid>`); never use `pkill -f`.
- **Scratch files** (screenshots, test scripts, notes) go in `/tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/<track>/`.
  Scripts you want to keep as tools go in `counterspace/tools/` named `tmp_*.mjs` or `_*.mjs` (git ignores them) unless your brief says otherwise.
- **Look at your work.** `OUT=<scratch> VPS=1440x900,900x1000,390x844 THEMES=dark,light SECTIONS=top,chartA node tools/snap.mjs` (see the file header) writes
  screenshots. Open the PNG files with the Read tool and judge them as a design reviewer would: hierarchy, spacing, alignment, clipping, contrast, consistency.
  Fix what you see. Check dark and light and at 1440, 900 and 390 px wide.
- **Code style.** Lines at most 160 characters. Run `tools/node_modules/.bin/prettier --print-width 160 --single-quote --write <file>` on JavaScript you touched.
  Match the surrounding comment style: say why, not what; no change-log comments.
- **Do not change facts.** Data files (`data/*.json`), numbers, dates, sources, citations and the legal cautions stay exactly as they are in meaning. Wording
  changes are for plain language only.
- **Checks to run for your area before you finish.** `node tools/copy_lint.mjs` (wording; no errors in your area), `node tools/qa.mjs` once at the end
  (page errors, axe, horizontal scroll; ignore visual-regression differences in your own area, never refresh the baseline), `node tools/scene_check.mjs` with
  `ONLY=<scene ids>` for any scene you touched (the 3D and scene viewer tracks; the full run is the orchestrator's job), `node tools/contrast_check.mjs`.
- **Progress file.** Keep `counterspace/.progress_<track>.md` (git ignores it): what is done, what is next, commit hashes. Update it after each item.
- **Final report** (short, plain): what changed and why it looks better; files touched; commits; checks and results; anything you could not finish; requests for
  other tracks; any decision the orchestrator must make. Do not paste code.
