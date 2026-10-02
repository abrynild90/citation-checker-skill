# Grade (type C, fresh): fonts, Starfish camOff/staticDrop, label tuning

Ran `python3 tools/build_data.py`: `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`; 61 kinetic, 15 non-kinetic, 68 co-orbital, 19 legal. Did not run qa.mjs or scene_check.mjs. git status clean.

| Portion | Score |
|---|---|
| Data | 96 |
| ledger.md | 94 |
| methodology.md | 88 |
| verification log | 94 |
| Code quality | 93 |
| Accuracy | 96 |
| Pedagogy | 94 |
| Brief fidelity | 95 |
| Sources | 92 |

## Evidence
- Fonts code: good. fonts.js (13 lines) has a header, stacks with fallbacks and a `fontsReady` gate. build_page.py has a documented `FONT_FACES` table, `font_css()` and a `/*__FONTS__*/` placeholder. subset_fonts.py has a docstring with install and usage notes and explains the hinting and glyph-range choices. Nits: it writes `/tmp/_nr.ttf` (hardcoded, use tempfile). The `U()` lambda and the `PF` string are terse. The FONT_FACES comment ("unicode-range-free") is garbled. There is no error check for a missing `NM` argument (a bare IndexError). Source fonts (woff2) are committed, so the build does not need the subsetter.
- Line length: 0 lines over 160 in src/*.js, tools/*.py and tools/*.mjs (I did not check subdirectories). template.html has 1 line over 160 (was 36), a big improvement. Nothing is over 1,000 lines.
- Starfish camOff/staticDrop: `camOff` (gl-labels.js:224-226, starfish.js:88) and `staticDrop` (draw-state.js:40, starfish.js:102) are commented where they are used. `camOff` is desktop-only (w>=700), and the comment says so. Minor: `staticDrop` and `staticDropPhone` match by exact text, so renaming a label would silently stop the drop. `staticDrop` has no scene_check rule (not checked whether the schema or README documents it).
- methodology.md: GAP. grep for font, typograph, woff, OFL, Plex, Newsreader and subset returns only static-font and still-font rule names (lines 141-142). Nothing mentions the typefaces (Newsreader, IBM Plex), the embedded base64 subsets, the `tools/subset_fonts.py` step, the build_page.py inlining, or the `fontsReady` ordering requirement. A reader reproducing the build cannot learn the font pipeline. Same for ledger.md and verification_log (not expected there).
- License attribution: partial. fonts/OFL-IBMPlex.txt and OFL-Newsreader.txt are present, with copyright lines and the OFL 1.1 text. But the shipped artifact (index.html, a single self-contained file with the fonts inlined) carries no copyright or licence notice. `grep -i "OFL|open font"` in the template and index.html finds nothing. No credits line in the page or the README. The OFL requires the notice to travel with redistributed copies. Also, the OFL-Newsreader Reserved Font Name issue is unaddressed: the files are modified subsets.
- Spot-checks against swf_2026.txt (all match): Starfish Prime 1.4 Mt W49 (line 6948; event us-1962-starfish-prime, 1962-07-09). Burnt Frost used an SM-3 Block IA (line 7730). Nudol DA-ASAT (lines 2173, 12363, 14629). Cosmos 1408 / Nudol (event ru-2021-cosmos1408, 2021-11-15). Shakti (events in-2019-shakti-feb and in-2019-shakti are both present). I did not re-verify the exact wording for Mission Shakti or Cosmos 1408 in this run (the grep of those two phrases found no literal hit, only the Nudol lines), so I rely on the prior regrade's lines (15103, 23671) for those.
- Data, ledger, log, Pedagogy, Brief: no regression. Validate passes and counts agree.

## Fixes for anything under 93
- methodology.md (88): add a "Typography and font build" subsection. Cover Newsreader (serif, opsz, wght 400-600) and IBM Plex Sans/Mono. State that the fonts are Latin subsets in fonts/*.woff2, produced by `python3 tools/subset_fonts.py <node_modules>`. State that build_page.py inlines them as base64 @font-face in `<style id="cs-fonts">`, that src/fonts.js `fontsReady` gates text measurement, and that export.js depends on the exact `font-family:"IBM Plex Sans"` text. Add one sentence on the file-size and line-length conventions, plus the camOff/staticDrop cfg options.
- Sources (92): add a licence and credits line. Either put a `<!-- fonts: Newsreader, Copyright 2020 The Newsreader Project Authors; IBM Plex, Copyright 2017 IBM Corp.; SIL OFL 1.1, see fonts/OFL-*.txt -->` comment in the template, or add a "Fonts" footnote or About-panel line. Name the OFL files in methodology.md.
- Code quality (93): use `tempfile` in subset_fonts.py, add an argv usage check, fix the garbled comment in build_page.py, and wrap the last over-length template.html line.
