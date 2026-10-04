# Track C2: jamming, lasers and cyber chart; close-approach chart; capability-by-decade chart

Read `design/DESIGN.md` first, all of it, especially sections 2, 3 and 5. This brief adds what is specific to you.

## What you own

- `src/charts/b.js`, `src/charts/c.js`, `src/charts/rpo.js`, `src/cards2.js` (the hover cards for the jamming and close-approach charts).
- `src/styles/charts2.css` (loaded after `charts.css`; scope every rule to `#chartC`, `#chartR` or `#chartB`).
- In `src/template.html` only: the `#chartC`, `#chartR` and `#chartB` sections. Do not touch other regions. Track C1 owns the law timeline, `#chartA`, `#lag`, `src/ui.js`
  (hover-card shell, key and table helpers), `src/export.js` and `charts.css`; track P owns the rest of the page and `base.css` (buttons, segmented control, chips, disclosure,
  chapter heading). Use their classes, do not restyle them. If you need a shared part changed, write it in your final report.

## The job

Make chapters 03 (jamming, lasers and cyber), 04 (close approaches) and 05 (who can do what) look like the best data journalism a serious publication would run.

### Chapter headings
Each of your sections opens with the new standard markup (CSS is already in `base.css`):

```html
<header class="chapter-head">
  <p class="eyebrow"><span class="num">03</span>Jamming, lasers and cyber</p>
  <h2 id="hC">Attacks that leave satellites in orbit</h2>
  <p class="lede">One plain sentence on what to look for.</p>
  <div class="tools"><span class="seg">…</span> <button class="btn small">Download chart</button></div>
</header>
```

Names, numbers and titles are in DESIGN.md 3.2: 03 `#chartC` (heading id `hC`), 04 `#chartR` (`hR`), 05 `#chartB` (`hB`). Keep heading ids and `aria-labelledby`, button ids (`cFull`, `cFocus`,
`rFull`, `rFocus`, `grpCat`, `grpKin`), `data-export` attributes and every id the code uses. Buttons that export read "Download chart" with the download icon (see C1's brief; the
behaviour is in `export.js`). Disclosure summaries read "Show the data behind this chart". The "About the coding" disclosure becomes "How we classified these".

### Jamming, lasers and cyber (chapter 03)
- Keep what it shows: sustained campaigns as bars, single events as points, fill style for how strongly the source attributes the activity, four groups (uplink and downlink jamming,
  satellite-navigation jamming and spoofing, laser dazzling and damage, cyber), the same year axis as the other charts.
- Make it beautiful: group bands with the group name set inside the band at the left in the eyebrow style; each row's label placed consistently (right-aligned against its bar or point, or
  in a clean left column, whichever reads best at 1440 and 390 px); bars with rounded ends and a thin outline in the background colour; the attribution fills (solid, outline, dashed) drawn
  identically in the key; the big empty area on the left (nothing before 1997) is composed: say so in one quiet line inside the chart and keep the space tidy.
- The in-chart quotation of the assessment must stay under 15 words and be attributed. Keep it short and well placed.

### Close approaches (chapter 04)
- Keep what it shows: one lane per actor (United States, China, Russia), marks at the start date of each operation, bar or arrow for a continuing operation, shapes for the kind of activity,
  outlined marks where the source's wording is hedged, the "Full span / Zoom" control. The default view shares the page's year axis.
- Make it beautiful: lane headers as a clean strip (actor name, a coloured dot, "28 operations"); calm lane backgrounds; marks outlined in the background colour so neighbours separate; the
  empty left half of the full-span view composed (one quiet line: first entry 2003) and the zoomed view as polished as the full one; clear hover and focus rings.
- The sentence "A proximity operation is not an attack" stays prominent: set it as a callout (the `.callout` class).

### Capabilities by decade (chapter 05)
- Keep what it shows: number of states holding each capability by decade, zero baseline, five categories stacked (or kinetic versus non-kinetic), whisker range for demonstrated versus
  demonstrated plus developing, patterns for developing and latent, faded styling for reconstructed decades, and the label "reconstructed (not SWF-assessed)" for decades before the 2020s.
  That label is a hard requirement; keep it visible on the chart.
- Make it beautiful: crisp stacked bars with rounded tops; fills and patterns that print cleanly and stay distinguishable without colour; the count above each decade as a clear figure with
  the range as a quiet second line; the 2020s bar visually emphasised as the assessed decade; filter chips (class `.chip`, `.chips`) with category colour dots; the grouping control as a
  segmented control (`.seg`); a key that explains solid, patterned, faded in one compact line.
- Spell out acronyms at first use (SWF: Secure World Foundation, the first time it appears on the page is in the hero; say it again in short form here).

### Cards
`nkCard`, `coCard`, `coWhen` in `src/cards2.js`: plain words only; no raw codes (categories like `electronic_warfare`, attribution and confidence values must be shown as words a reader
understands); same card look as the other charts (C1 owns the shell); the 3D action reads "Open the 3D explainer" with the cube icon.

## Words
Apply DESIGN.md section 3 to every string you own (chart text, annotations, keys, cards, table headers and captions, buttons, accessible names). Run `node tools/copy_lint.mjs` and clear
the hits in your area.

## Care points
- All charts share one year scale; do not break the alignment with the law timeline above.
- Do not change numbers, dates, sources or what a mark means.
- The page container is now 1240 px wide. Charts size from their container. Phone layouts (390 px, no horizontal scroll) must look designed, not squeezed.
- Chart B decades before 2020 are reconstructed and must stay labelled as such.

## Ports
Use 9120 to 9129.

## Done means
At 1440, 900 and 390 px, dark and light, these three chapters look authoritative and calm; nothing overlaps; their controls, key, cards and tables are the same family as the rest of the page;
`node tools/copy_lint.mjs` shows no errors in your strings; `node tools/qa.mjs` shows no page errors, no axe violations in your areas, no horizontal scroll.
