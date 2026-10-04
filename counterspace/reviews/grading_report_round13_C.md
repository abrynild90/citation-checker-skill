# Grading report, round 13, reviewer C

Verified: `python3 tools/build_data.py` prints `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`. 0 src lines over 160 chars (was 95). src/scenes.js is gone; src/scenes/README.md holds the module map; app.js calls the three GLHost installers explicitly (app.js:17). I did not re-run qa.mjs or scene_check.mjs.

| Portion | Score |
|---|---|
| Data | 96 |
| ledger.md | 94 |
| methodology.md | 94 |
| verification_log | 94 |
| Code quality | 94 |
| Accuracy | 95 |
| Pedagogy | 93 |
| Brief fidelity | 95 |
| Sources | 94 |

Accuracy spot checks (all match SWF text): SJ-21 25 Dec 2021, "docked to it at some point", about 21 Jan 2022, 290-3,100 km by 27 Jan, back near GEO (swf 19715-19730); "well past graveyard orbit" (20275); GSSAP "flanking" SJ-21/SJ-25 per COMSPOC (19778); USA 271/SKYNET 5A, 13 km, 5-11 Sept 2025, first bilateral RPO (6298-6305); Cosmos 2543/USA 245 (13412); X-37B 224 and 908 days, OTV-7 323x38,838 km, OTV-8 Aug 2025, "has not approached nor rendezvoused" (4508, 4708, 4726, 4935, 5196); CSSHQ 276 days, fourth flight Feb 2026 (19087, 19296); PLA "transform into an aggressive unmanned..." (18931). No factual errors found. Brief cautions all pass (LTBT "followed" Starfish, 2024 veto nuclear weapons in orbit, manuals soft law, ITU Arts. 45 and 48, quotes at most 15 words, shared time scale).

Defects / fixes to reach >=93 (all already at or above):
- Pedagogy (93, borderline): scenes still lack a one-line pointer to what law or ledger says (e.g. FY-1C scene to unga-77-41; RPO scene to the legal row on RPO/due regard). Add a "Law" pointer to captions.
- ledger.md and methodology.md: 202 lines over 200 chars, long (698/159 lines). Add a one-page quick-read summary.
- Code: config.js is 1,233 lines and sim.js 1,276; split per-scene data, and unpinned ISS 420 km remains.
- Minor: docs dated 2026-09-29 while today is 2026-10-01 (fine if the ledger date means last data change).
