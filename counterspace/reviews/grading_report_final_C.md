# Grading report, final, reviewer C

Verified: `python3 tools/build_data.py` prints `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)` (61 kinetic, 15 non-kinetic, 68 co-orbital, 19 legal). Did not run qa.mjs or scene_check.mjs.

| Portion | Score |
|---|---|
| Data | 96 |
| ledger.md | 94 |
| methodology.md | 91 |
| verification_log | 94 |
| Code quality | 87 |
| Accuracy | 95 |
| Pedagogy | 94 |
| Brief fidelity | 95 |
| Sources | 94 |

## Evidence
- Data 96: validate OK, counts match ledger.md preface (61/15/68/19). Legal.json notes carry the Starfish "followed" wording and the State Dept sourcing.
- ledger.md 94 / log 94 / Sources 94: one as-of date (2026-09-29) in all three docs; 19 legal rows, 3 soft law marked; ITU Arts. 45 & 48 row (ledger.md:369); veto row "nuclear weapons in orbit" (:379); 41+ log discrepancies with pins. Dates are two days behind today's 2026-10-01 (fine if as-of means last data change).
- Accuracy 95: 22 checks vs SWF, all match. Starfish 1.4 Mt W49 (swf 6948; caption cites DOE for Starfish yield, SWF only gives W49 for Program 437); Solwind 555 text / 530 Table (7105); FY-1C 880 km vs 300 km Shakti (23851), 3532 cataloged and 2351 in orbit (20674-75); Burnt Frost 240 km, 175 pieces (7732); DN-2 10,000 km, "nearly to GEO", "over the Indian Ocean", 30,000 km (20912-20915); Shakti 45 days (23847); MIRACL/MSTI-3 (8956-8964); downlink jamming leaves the satellite unaffected (7980); AcidRain (34043); Peresvet shelters (16982); Cosmos 2543/USA 245 (13407-13415); GSSAP "flanking" SJ-21/SJ-25 per COMSPOC (19776-19778); X-37B OTV-7 323 x 38,838 km (4726); CSSHQ 276 days (19087); SJ-21 "docked to it at some point"; SY-7/Aolong-1 arm demos (18748). All 13 scene captions read against SWF; no factual errors. Brief cautions all pass (LTBT "followed" Starfish; 2024 veto about nuclear weapons in orbit; manuals soft law; ITU 45/48; SWF quotes short and attributed; shared time scale).
- Pedagogy 94: scene captions state limits ("drawn for legibility, not computed", "an RPO is not an attack", "no target, reach not intercept"); each scene has `related` pointers (ltbt-1963, unga-77-41, icao-2025, tallinn-2017) and a cite line. Remaining gap: 5 scenes have `related: null`.
- Brief fidelity 95: all brief cautions covered, plus the static fallback and stills.

## Defects and fixes (anything under 93)
1. Code quality 87.
   - `tools/scene_check.mjs` (522 lines) has 74 lines over 160 characters (up to 336, e.g. lines 75, 128, 108). `tools/qa.mjs` has 19 and `tools/shots.mjs` has 3. The 160 limit is met only in `src/` (0 over in src/scenes and src/*.js). Fix: run prettier `--print-width 140` on tools/*.mjs and split the long strings; split scene_check into rules and driver modules.
   - Large files: `config.js` 1,477 lines (up from 1,233), `sim.js` 1,385, `svg-fallback.js` 1,353, `gl-items.js` 950. Fix: split config.js into one file per scene under `src/scenes/scenes/`, and svg-fallback by scene family.
   - Captions in config.js are hand-wrapped mid-sentence into odd fragments (e.g. `' along field lines...` after a 40-character line), which hurts readability. Reflow them.
2. methodology.md 91. Line 128 states leader limits of 0.22 x width (0.30 at 375), but `tools/scene_check.mjs` header and rules use 0.17 (0.27 at 375). The doc and tool disagree. Fix: update methodology (or the tool) to one pair of values. Other scene rules (still cameras, static fallback, inset, acts, hard-failure list) are present and current. Also add a short quick-read summary at the top (159 dense lines; ledger.md is 698).
