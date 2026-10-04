# Counterspace Timeline: design system and plain-language guide

This is the reference for how the page looks, reads and behaves. It is written for the people who build and review the page. Every rule here can be
checked by looking at the page or by running a tool in `tools/`.

## 1. What "excellent" means here

A visitor is a law student, a lecturer or a policy reader who owns the book. They are not engineers. In the first ten seconds they should think: this
is a carefully made piece of editorial design about something serious. In the next ten minutes they should understand, without effort, what the
charts show, which events have a 3D explainer, and where every fact comes from.

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
| Eyebrow label | Plex Sans 600, 12.5 px, uppercase, tracking 0.14em |
| Numerals | Plex Sans with tabular figures |

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
- **Key.** A single line of swatch and label pairs at 13.5 px, grouped under small eyebrow labels. Hidden behind "How to read this" when long.
- **Callout** ("What to notice"): a 3 px accent rule on the left and one or two sentences of serif text.
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

| No. | Name | Title of the section |
|---|---|---|
| 01 | Law and policy | Law and policy on one timeline |
| 02 | Anti-satellite tests | How high anti-satellite tests have reached, and the debris they left |
| 03 | Jamming, lasers and cyber | Attacks that leave satellites in orbit |
| 04 | Close approaches | Satellites that fly close to other satellites |
| 05 | Who can do what | Which states hold which counterspace capabilities, by decade |
| 06 | Capability, then law | How long the law took to follow |
| 07 | Sources and method | Where every fact comes from |

Spell out acronyms on first use in each section (anti-satellite, ASAT; low Earth orbit, LEO). SWF means the Secure World Foundation: say so the
first time it appears on the page. Domain terms the book itself uses (GEO, GNSS, co-orbital) stay, with a short gloss on first use.

### 3.3 Never

Stock phrases and filler: delve, tapestry, landscape, navigate, seamless, leverage, robust, crucial, pivotal, unlock, empower, journey,
comprehensive, cutting-edge, "it's worth noting", "not just X but Y", exclamation marks, rhetorical questions as headings that are not answered
immediately. Do not pad. If a sentence can go without losing a fact, it goes.

`node tools/copy_lint.mjs` opens every screen, hover card, download and scene (animated, still and phone) and fails on any of the above. It must report
no wording errors.

## 4. Page anatomy

1. **Hero.** Full width, dark in both themes. Large display title and lede on the left, the Earth large on the right (the photographic Earth, lit,
   with the three orbit shells and their labels). One primary action ("Take the 3D tour") and one secondary ("Jump to the charts"). A slim row of five
   large figures underneath (tests, destructive intercepts, jamming and cyber operations, close approaches, laws and policies). Before any interaction
   no 3D library is loaded: the first picture is drawn from the embedded Earth image.
2. **Chapter navigation.** Seven numbered chapters (section 3.2). Sticky on scroll without competing with the sticky law timeline.
3. **Chapters.** Each has: eyebrow (`02  Anti-satellite tests`), title, one plain-language sentence saying what to look for, the chart, a one-line key,
   an optional callout, and a "Show the data" disclosure.
4. **Law and policy timeline** (chapter 01) stays in view as the reader scrolls, so every chart can be read against it.
5. **Sources and method.** Readable at 66ch: what the data is, what is counted, what is not, how to cite, licences and credits.
6. **Footer.** Three short columns: about this page, data and licence, type and images.

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
