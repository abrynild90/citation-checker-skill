# Track C1: law timeline, anti-satellite test chart, "how long the law took" chart, shared chart parts

Read `design/DESIGN.md` first, all of it, especially sections 2, 3 and 5. This brief adds what is specific to you.

## What you own

- `src/charts/legal.js`, `src/charts/a.js`, `src/charts/lag.js`.
- `src/ui.js` (hover card, legend and table helpers, mark binding), `src/export.js` (chart downloads).
- `src/styles/charts.css`.
- In `src/template.html` only: the `#timeline` wrapper's law-and-policy part (the sticky `.legal-band`, its key, the 2021 to 2026 zoom, the phone list, the abbreviation
  note and table), the `#chartA` section and the `#lag` section. Do not touch other regions. Another track (C2) owns `#chartC`, `#chartR`, `#chartB` and `src/cards2.js`;
  the page-shell track (P) owns the rest including `base.css` (buttons, segmented control, chips, disclosure, chapter heading). Use their classes, do not restyle them.

## The job

Make chapters 01 (law and policy), 02 (anti-satellite tests) and 06 (how long the law took) look like the best data journalism a serious publication would run, and make the
parts shared by all charts (hover card, key, data table, download) consistent and refined.

### Chapter headings
Each of your sections opens with the new standard markup (CSS is already in `base.css`):

```html
<header class="chapter-head">
  <p class="eyebrow"><span class="num">02</span>Anti-satellite tests</p>
  <h2 id="hA">How high anti-satellite tests have reached, and the debris they left</h2>
  <p class="lede">One plain sentence on what to look for.</p>
  <div class="tools">…buttons…</div>
</header>
```

Names, numbers and titles are in DESIGN.md 3.2: 01 Law and policy (the law timeline gets its own heading above the sticky band, inside `#timeline`, before `.legal-band`; check
that the band still sticks correctly), 02 Anti-satellite tests (`#chartA`, heading id `hA`), 06 Capability, then law (`#lag`, heading id `hL`). Keep heading ids and `aria-labelledby`.
Remove the old `.chart-head` rules from `charts.css` once no section uses them (C2 converts its sections in the same way; coordinate only through the final report).

### Law timeline (chapter 01)
- Marks are too small and labels too terse. Use larger marks (about 14 px across, 24 px hit areas), a 1.5 px outline in the background colour around each mark so overlaps separate,
  one glyph per kind (treaty, resolution or body finding, unilateral pledge, soft law, veto) that is distinct in shape and fill so colour is never the only signal.
- Where there is room, spell names out ("Outer Space Treaty, 1967" rather than "OST"); abbreviations remain where space is tight and the glossary explains them.
- The crowded 2021 to 2026 marks: keep the zoom, but make it clearly connected to the dashed window (a soft translucent connector between the window and the zoom panel), give it a plain
  title ("Zoom: 2021 to 2026") and one plain sentence of help. Replace the long explanatory paragraph.
- Replace the dense abbreviation paragraph under the band with a tidy glossary (a two-column definition list inside the "Show the data" disclosure, or a chip list). Nothing
  about the content may change: every abbreviation stays explained.
- Axis: year labels 12 px, decade ticks, quiet grid; negotiation spans are soft rounded bars with direct labels.
- The compact (stuck) band must stay compact and legible. Phone behaviour (strip with tap-to-label, full list) must remain, and look good.
- Legal cautions stay exactly true: the Limited Test Ban Treaty "followed" Starfish Prime and is not a "direct response"; the 2024 veto concerned nuclear weapons in orbit, not
  anti-satellite testing; expert manuals are soft law; ITU Constitution Arts. 45 and 48 are included.

### Anti-satellite test chart (chapter 02)
- Keep what it shows: altitude on a log scale, intercepts as filled circles with bubble area proportional to cataloged fragments, missile targets, apogee and flyby tests, the nuclear
  test, a strip for tests with no reported altitude, the "last destructive test" marker, the same year axis as every other chart.
- Make it beautiful: soft tinted orbit zones (low, medium, geostationary) with the labels set inside the zone at the left; axis labels as "10 km", "100 km", "1,000 km", "10,000 km";
  marks with a thin background-coloured outline and a soft ring on hover; direct annotations drawn as a leader line with a small dot at the data end, text in two weights; the bubble-size
  key drawn as a compact, well-aligned legend. No overlapping text anywhere at 1440, 900 or 390 px (check the phone layout and its "Zoom" button).
- Spell out "DA-ASAT" as "direct-ascent anti-satellite" at first use, then say "anti-satellite". Never show raw data codes to a reader.

### "How long the law took" (chapter 06)
- Redesign for clarity: one row per pair, the capability event at the left end of a thin bar and the later legal step at the right end, the elapsed time as a large readable figure
  at the bar's centre or end, the pair named in one short line above the bar (not a long sentence). Rows that have no later legal item show an open ring and the words "no later legal step in our records".
  Same year axis as the other charts. The caveat stays: this shows order in time, not cause.

### Shared parts
- **Hover and focus card** (all charts use it): serif title, a tidy definition list in plain words ("How sure we are", not "Confidence: medium" if the value is a code), a quiet source line,
  a clear "Open the 3D explainer" action with the cube icon instead of a text glyph. Same card on every chart; calm entrance (120 ms); on phones it docks at the bottom as it does now.
  `nkCard`, `coCard` live in `src/cards2.js` (C2 owns them); you own `kinCard`, `legalCard` and the card shell (`showCard`, `.card` styles).
- **Key** (legend lists): one compact line per group with swatches that are drawn identically to the marks; group labels as small eyebrow text.
- **Data tables** (`ui.js` `table()` and the disclosure): comfortable padding, sticky header, right-aligned numbers, dates not wrapping on desktop, phone cards stay. The disclosure summary
  reads "Show the data behind this chart" (use it in all your sections; C2 will do the same).
- **Downloads** (`export.js`): the button reads "Download chart" with the download icon. The SVG that is saved must look finished: title, one-line subtitle, the chart, a source line and a
  credit line ("Counterspace timeline, companion to Space Security Law by Aaron Brynildson") in the page's fonts and colours, light colours by default and dark when the "Dark colours in
  downloads" switch is on. The file name should read well. The export must never include hover or focus artefacts. Keep the embedded-fonts behaviour.
- **Accessibility**: every mark keyboard reachable as now; names in plain words; visible focus; targets at least 24 px.

## Words
Apply DESIGN.md section 3 to every string you own (chart text, annotations, keys, cards, table headers and captions, buttons, accessible names). Do not show data codes. Run
`node tools/copy_lint.mjs` and clear the hits in your area.

## Care points
- All charts share one year scale; do not break the alignment between the law timeline and the charts below.
- Do not change numbers, dates, sources or what a mark means.
- The page container is now 1240 px wide. Charts size from their container.
- `src/ui.js` is imported by other modules; keep the exported names (`bindMark`, `legend`, `table`, `rove`, `addGuide`, `setGuide`, `handoff`, `hideCard`, `kinCard`, `legalCard`, and the
  re-export of `nkCard`, `coWhen`, `coCard`).

## Ports
Use 9110 to 9119.

## Done means
At 1440, 900 and 390 px, dark and light, these three chapters look authoritative and calm; nothing overlaps; the card, key, table and download are the same family as the rest of the page;
`node tools/copy_lint.mjs` shows no errors in your strings; `node tools/qa.mjs` shows no page errors, no axe violations in your areas, no horizontal scroll.
