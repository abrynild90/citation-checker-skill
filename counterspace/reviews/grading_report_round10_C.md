# Grading report, round 10, reviewer C (data, docs, accuracy, code)

Verified: `python3 tools/build_data.py` prints `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`. A temp copy with `orbit_regime "XEO"` in `co_rows.py` failed with `us-2003-xss10: bad orbit_regime 'XEO'`; copy discarded. (Editing `data/*.json` alone is overwritten by the builder, so the test must change the row source.) `build_page.py` prints "module graph bundle (src/boot.js)" and its output is byte-identical to index.html.

## Scores
| Portion | Score |
|---|---|
| Data ledger (JSON) | 95 |
| ledger.md | 93 |
| methodology.md | 92 |
| verification_log.md | 93 |
| Code quality / architecture | 88 |
| Accuracy | 91 |
| Pedagogical value | 92 |
| Fidelity to textbook-companion purpose | 94 |
| Sources & methodology section (docs + page text) | 93 |

Best single improvement: Data: add a co-orbital `evidence` quote field. ledger.md: state the Delta 180 point beside the Key-figures table title. methodology.md: split the 2 KB validate() paragraph (line 114) into a list. Log: none needed beyond a per-row-count cross-link. Code: delete the dead fallback minifier and the stale docstring and PAGE_TODO files. Accuracy: fix the Starfish caption. Pedagogy: label the illustrative elements in the scene captions. Fidelity/Sources: fine.

## Round-9 defects: status
- Lag pairs vs related_events: FIXED. `lag_pairs.json` is generated from `related_events`; Bold Orion and FY-1C are in `dropped` with reasons; validate() checks that each pair's legal item lists the event. Six pairs, two open rings.
- Lede wording: FIXED. template.html:336 now says "the technology and the law on one year axis"; the quote matches Exec. Summary (PDF 21, "only non-destructive capabilities are actively being used against satellites in current military operations").
- Single as-of date: FIXED. 2026-09-29 in ledger.md, methodology.md:3, verification_log.md:3, schema.json:96; validate() enforces it.
- Log single layer: FIXED. Five sections (Summary, Method, Current state, Open items, Discrepancies), 168 rows, totals table that validate() checks.
- Key figures destructive count: FIXED. ledger.md "What is counted" gives 5 + 11 co-orbital = 16 (10 Russian/Soviet, 1 US Delta 180), 975 fragments, 417 on orbit.
- Methodology numbering: FIXED (12a/12b gone).
- Real module bundling: FIXED in effect (esbuild graph via boot.js; 22 modules carry imports).
- validate() gaps: FIXED. Covers capabilities.json categories, decades, states, values; required fields per domain; lag pairs; log and ledger counts.
- Starfish caption overreach: NOT FIXED (defect 1).
- Unsourced scene statements: NOT FIXED (defect 2).
- Minifier: NOT FIXED (defect 4).
- Density/QA: NOT FIXED (defect 5).

## Defects below 93
1. Accuracy (91). `src/scenes/config.js:10` still says the belt "damaged several satellites in the following months". The cite at :11 (SWF p. 12-05, PDF 269) says only that such tests "are known to have generated effects that damaged or destroyed satellites in orbit at the time". "Several" and "following months" are unsupported. The log (discrepancy 41) says the source was fixed but the caption was not.
2. Accuracy/Sources (91/93). Flat scene statements outside their cites remain: "An F-15 climbs over the Pacific" (config.js:21), "GPS satellites orbit about 20,200 km up" (config.js:93 and the constellation label at :96), and "the largest debris-generating event on record" (config.js:40). SWF's Table 5-1 supports only that FY-1C has the most cataloged fragments in that table. True in the world, but unpinned on a page whose rule is that every statement is pinned.
3. Code (88). `tools/build_page.py:1-9` docstring still says src/ "cannot be bundled as a module graph yet" and describes a hand-kept `ORDER` and regex import strip. Those are now a fallback path. `tools/PAGE_TODO_BUNDLER.md` lists "missing imports" that no longer exist. `tools/build_page.py:69-88` keeps the line-based `_min_js` (backtick-counting) as dead-by-default code. The fallback is reachable with NOESBUILD=1, so the silent-break risk persists. Three PAGE_TODO*.md files in tools/ are stale hand-off notes.
4. Code (88). 169 lines in src/ exceed 250 characters (config.js status arrays, lag.js, a.js). `qa.mjs` hashes SVG markup and needs `BASELINE=1` for any deliberate change; it has no assertion on data values (for example the six lag pairs or the 144 count).
5. methodology.md (92). Line 114 is a single ~2,000-character bullet listing every validate() rule; unciteable and hard to audit. Sections 5 and 12 are long. Otherwise accurate.
6. Data (95, minor). Co-orbital rows carry paraphrase plus notes but no short verbatim `evidence` field. Attribution checks needed me to re-read SWF each time. The verification log holds the quotes, so this is a convenience gap, not an error.
7. Pedagogy (92). Scene captions mix SWF fact and illustration. Scale notes exist for the new scenes (good) but the older scenes (starfish, solwind) do not flag the spread and belt geometry as illustrative in the caption itself.

## Spot checks that passed (35)
Co-orbital rows vs SWF (13 read in full): XSS-10 "within 50 meters", Delta R/B, 800 x 800 km 39.6 deg (Table 1-3, PDF 63); XSS-11 Minotaur, "12-18 months" (PDF 63); DART "ended up bumping into" MUBLCOM (PDF 64); ASTRO/NEXTSat "dockings" (PDF 64); Yahsat 1B/PAN 2009-2013 (PDF 64); OTV-1..6 days 224/469/675/718/780/908 (Table 1-1, PDF 57); Cosmos 2499 1501 x 1480 km 82.4 deg, Cosmos 2504 "may have had a slight impact" (Table 2-3, PDF 128); Cosmos 2535/2536 "at least 25 ... within 2 km ... 380 km"; Luch "1.8 km of Intelsat 36" (p. 02-13, PDF 126), Luch graveyard Oct. 2025; SJ-12/SJ-06F "less than 300 meters", "may have bumped" (PDF 163, Table 3-2 PDF 175); BX-1/SZ-7 (PDF 175); SJ-21 "maneuvered to dock with Compass G2" kept hedged as "at some point"; SY-24C/SJ-6 "tens of meters" five times; Cosmos 2581/2583 "within 80 m" per COMSPOC; LDPE 3A "possibly to 30 km ... 0.68 degrees west"; USA 271/TJS-15 33 km; USA 324 17 km/12 km; CSS-HQ 348 x 331 km 50.2 deg, 220 days, 268 days, 519 days, Feb. 6, 2026 (Table 3-1, PDF 169); DSP 23 = USA 197 "flybys" (PDF 59); TJS-3 object 43917 "appears to be a subsatellite" (PDF 171). Hedges ("possibly", "appeared to", "may have") carried into the rows and notes.
Other: Table 5-1 Solwind 530 km / 285 (PDF 212); lede quote (PDF 21); LTBT "followed" with Office of the Historian context; ITU citation arts. 45 and 48, 1825 U.N.T.S. 331; 2024 veto labeled as the nuclear-weapons-in-orbit draft (S/2024/302); Woomera 2024 unilateral/soft-law kind; ITU RRB 2024/2025 pinned to SWF pp. 02-32 and 02-30.

## Factual errors
- Starfish caption "damaged several satellites in the following months" exceeds its cite (defect 1).
- No numerical or attribution errors found in the 13 co-orbital rows read in full or in the other checks.
