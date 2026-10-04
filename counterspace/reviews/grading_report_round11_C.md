# Grading report, round 11, reviewer C (data, docs, accuracy, code)

Verified: `python3 tools/build_data.py` prints `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`. A temp copy with `"XEO"` in `tools/ledger/co_rows.py` line 40 fails with `us-2003-xss10: bad orbit_regime 'XEO'` (copy discarded). `build_page.py` prints "esbuild module graph, src/boot.js"; git shows no diff in index.html or data after rebuild. Playwright load at 1440 and 375: no console errors, no horizontal overflow. I did not re-run qa.mjs or scene_check.mjs.

## Scores
| Portion | Score |
|---|---|
| Data ledger (JSON) | 96 |
| ledger.md | 93 |
| methodology.md | 89 |
| verification_log.md | 92 |
| Code quality / architecture | 89 |
| Accuracy | 93 |
| Pedagogical value | 93 |
| Fidelity to textbook-companion purpose | 94 |
| Sources & methodology section (docs + page text) | 91 |

Best single improvement: methodology.md: fix the two stale "1.1.0" schema mentions, add the scene_check.mjs test line and scene-rules text, then delete tools/TODO.md. Data: none needed. Code: remove the stale "concatenated into one module scope" comments. Sources section: reword "every sentence here is original" to allow the attributed short quotations.

## Round-10 defects: status
- Starfish caption vs SWF p. 12-05: FIXED. config.js:19 now says "SWF says such tests are known to have generated effects that damaged or destroyed satellites in orbit at the time", which matches SWF PDF 269 line for line; the belt spread is flagged illustrative.
- F-15 "Pacific": FIXED ("supersonic zoom climb", SWF PDF 71-ish text). GPS altitude: FIXED (caption says "medium Earth orbit", no number). FY-1C "largest": FIXED ("most cataloged fragments of any test in SWF's Table 5-1", true: 3,532 is the max of the 16 rows I read).
- Stale build docs and TODO files: MOSTLY FIXED. build_page.py docstring is current, PAGE_TODO*.md are gone. But see defects 3 and 4.
- Fallback minifier: FIXED (removed; docstring says there is no fallback build; methodology item 25 agrees).
- Line density: PARTLY FIXED. Lines over 250 characters in src/ fell from 169 to 86 (46 are in config.js caption and status rows).
- QA data assertions: FIXED. qa.mjs "data-checks" (line 105-134) compares rendered marks, table rows and the lag panel to data/*.json, and asserts dropped pairs are not drawn.
- methodology validate() bullet: FIXED (now a nine-item sub-list, lines 115-125).
- Co-orbital `evidence` field: FIXED and excellent. All 68 rows carry a 1-15 word quote; schema.json:79 and validate.py:75-77 enforce it. I checked every quote programmatically: all 68 are verbatim substrings (after ligature and whitespace normalisation) of the SWF page named in the row's `PDF p.` pin. 0 misses, 0 wrong pages.

## Defects below 93
1. methodology.md (89), stale schema version. Line 38 (table) and line 83 (item 15) say schema 1.1.0; `tools/ledger/schema.py:5`, `data/schema.json:2`, ledger.md:3 and the page (method.js) say 1.2.0. validate() does not check this file's version.
2. methodology.md (89), missing testing and scene documentation. Nothing in methodology.md mentions `tools/scene_check.mjs`, the "Follow the action" dolly cameras or the context inset (grep returns no hits). `tools/TODO.md:6-18` says these edits are still to be made, and draft text is there. Section 8 therefore under-describes what tests the scenes.
3. tools/TODO.md is itself a stale hand-off note tracked in git (first paragraph describes fixes as done; items 1-2 are doc edits nobody applied; item 3 is CSS the code no longer needs; item 4 is a B1 UI list). This repeats the round-10 "stale TODO files" complaint in a smaller form.
4. Code (89), stale module comments. `src/scenes.js:15-16` says "tools/build_page.py concatenates the modules above (in that order) and strips import/export keywords"; that is false now (esbuild graph). The same "(Concatenated into one module scope by tools/build_page.py...)" header remains in config.js:3, core.js:3, earth.js:3, gl-host.js:3, gl-items.js:3, gl-labels.js:3, gl-still.js:3, labels.js:3, sim.js:3, svg-fallback.js:3. `src/scenes.js` is a comment-only file. `app.js:8-13` uses `import {} from` side-effect imports to patch `GLHost.prototype` from three files, an ordering trap.
5. Code (89), density and function size. config.js has 46 lines over 250 characters (captions and status arrays run to about 1,300 characters per line); `validate()` in validate.py is one function from line 14 to 205.
6. verification_log.md (92), stale follow-up. Section 4 ends "Follow-up for the page owner: drop those P states from `CAP` or label them on the chart as builder-assessed." The chart already does this (b.js:25-27, 320, 344 status "N: developing, builder-assessed"). Method item 5 (line 37) says "all 12 country tables" while ledger.md:664-665, methodology and the log's own row 110 say SWF has 13 countries (SWF ToC has Australia in Section 2). I did not resolve which is right; the two counts need reconciling.
7. Sources section (91), overclaim. method.js:63 says "Every chart, graphic and sentence here is original; no SWF or CSIS figures, graphics or prose are reproduced." The page quotes SWF verbatim (lede quote, PLA "aggressive unmanned intelligent fighter in space", "flanking", "damaged or destroyed"). Short attributed quotes are fine under CC BY-NC, but the blanket statement is untrue as written. The lede (template.html:351) also reads "on one year axis" (missing article).
8. ledger.md (93, minor). Nothing wrong found; Key figures, 5 + 11 = 16, 975 and 417 all match Table 5-1 (I summed the 11 co-orbital rows: 975 and 417).
9. Accuracy (93, minor). config.js:61 says the DN-2 rocket "falls back over the Indian Ocean" as fact; SWF (PDF near p. 03-20) gives that as China's claim and reports an analysis that the location required an apogee of 30,000 km or more. The ISS "about 420 km" (config.js:81, 86) is not in SWF (grep finds no 420 km), and it is cited to none.
10. Pedagogy (93). Captions now flag illustration well; no single new defect. Could add one line per scene on what the law/ledger says about it.

## Factual errors
- None in data or captions that contradict SWF. Items in defect 9 are unpinned or stated more firmly than the source, not wrong.
- Documentation errors: methodology.md schema "1.1.0" (lines 38, 83) vs 1.2.0; verification_log.md "12 country tables" vs 13 elsewhere; the page's "every sentence is original".

## Spot checks that passed (35+)
Co-orbital: all 68 evidence quotes verbatim and on the pinned PDF page (automated); descriptions read for XSS-10, BX-1, SJ-12/SJ-06F, SY-7, Clio, SJ-17/Chinasat, Cosmos 2521, 2535/2536 (2 km, 380 km), SJ-17/Chinasat 6B/SJ-20, CSS-HQ1 (348 x 331 km, 50.2 deg), Cosmos 2558/USA 326 (50 km weekly, "dangerous and irresponsible", Object C June 2025), SJ-17/VENESAT-1, SJ-23 AKM, Cosmos 2581/2583 (80 m), SJ-21/SJ-25 (30 June), SYRACUSE 3A/USA 324 (a little over 25 km); GSSAP "flanking" (COMSPOC, SWF p. 03-13). Table 5-1 (pdfplumber, PDF 212): Solwind 530/285/0, FY-1C 880/3532/2351, USA 193 220/175/0, Shakti 300/130/0, Cosmos 1408 470/1807/5; 5,929 and 2,356 totals; 16 rows. Table 1-4 Bold Orion 200 km, Solwind 555 km, USA 193 2,700 km apogee (conflicts recorded). Lede quote vs Exec. Summary (PDF 21, xxiii). Starfish, F-15 climb, 45 days (Shakti), 20 months (USA-193), MIRACL Oct. 1997 and MSTI-3, KA-SAT "tens of thousands" of modems, SJ-21 "docked to it at some point" and 290-3,100 km, 276 days (CSS-HQ). Legal: LTBT "followed" with Office of the Historian context; 2024 veto correctly labelled nuclear-weapons-in-orbit (S/2024/302, 13-1-1); Tallinn, MILAMOS and Woomera labelled soft law; ITU arts. 45 and 48, 1825 U.N.T.S. 331; "38 countries total" (SWF PDF ~ line 10613); CC BY-NC 4.0 licence (SWF front matter).
