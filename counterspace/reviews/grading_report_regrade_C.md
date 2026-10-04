# Regrade, reviewer C (current state)

Ran `python3 tools/build_data.py`: `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`; 61 kinetic, 15 non-kinetic, 68 co-orbital, 19 legal. Did not run qa.mjs or scene_check.mjs.

| Portion | Score |
|---|---|
| Data | 96 |
| ledger.md | 94 |
| methodology.md | 92 |
| verification_log | 94 |
| Code quality | 91 |
| Accuracy | 96 |
| Pedagogy | 94 |
| Brief fidelity | 95 |
| Sources | 94 |

## Evidence
- Data 96, ledger 94, log 94, Sources 94, Pedagogy 94, Brief 95: unchanged from the last grade. Validate passes, counts agree across documents, one as-of date (2026-09-29). Not re-audited row by row.
- Accuracy 96: 14 facts re-checked against swf_2026.txt, all match. Cosmos 1408 "more than 1,800 ... 5 still in orbit" (line 15113); Solwind 555 km text / 530 km table and 285 pieces (7648, 24827, 35725); Shakti 300 km, 130 cataloged, 0 in orbit (24967), 45 days (23847); Burnt Frost 240 km text / 220 km table; DN-2 10,000 km and 30,000 km; Starfish 1.4 Mt W49 (6948); FY-1C 880 km; SJ-21 25 Dec 2021, "docked to it at some point", about 21 Jan 2022, 290 to 3,100 km above GEO, then lowered back near GEO (19717-19730); SY-7 and Aolong-1 arm demos. No errors found in configs/*.js captions.
- SJ-21 arm is honest. The caption says "SWF does not say how SJ-21 captured or docked ... the grapple boom drawn on the tug is illustrative only". The model carries the tag "Arm: illustrative (SWF does not describe the mechanism)" (short form "not in SWF"). The status line says "(how is not described)", and the cite points to real arm demos on other satellites with pages. Nothing is presented as fact. Minor residual: the arm is an invented mechanism on a real craft, so it is only as honest as the tag stays visible in stills and static output. It is flagged in code comments and ARM_TAG, so acceptable.
- Code quality 91: structure is good. config.js is 52 lines over 14 configs/* modules (largest 296); svg-fallback.js is 85 lines over src/scenes/svg/*; models and cameras are separate. Zero lines over 160 characters in src/ and in tools/*.mjs (only tools/qa-baseline.json, data). Headers and section comments are present. Remaining issues: (a) six file headers in src/scenes/*.js (e.g. sim.js:3, gl-host.js:4) say "Module map in src/scenes.js", which does not exist (the map is src/scenes/README.md); (b) tools/scene_check.mjs is 1,109 lines and sim.js 1,122, both over 1,000, so the earlier split advice (rules vs driver) is only half done; (c) some scene_check.mjs header comment lines run to the full 160 columns and are hard to scan.
- methodology.md 92: Quick read section is good and accurate. Leader limits (0.17 W, 0.27 W at 375) now match scene_check.mjs:11 and :201. Row counts, MODES list and the grouped rule list match the code. Gap: the rule `preset-match` (scene_check.mjs header: an episode camera preset shows its own episode at every t) is in the tool but not in the methodology list, so "corrected rule list" is not yet complete. Other tool-side names (`hero-live`, `still-live`, `static-skip` and similar) are mode-suffix labels, not rules, so they do not need listing.

## Fixes for anything under 93
1. Code quality 91: replace "Module map in src/scenes.js" with "see src/scenes/README.md" in the six scene file headers; split scene_check.mjs below 1,000 lines (rules and driver modules) and sim.js below 1,000 (e.g. move items or cameras helpers out).
2. methodology.md 92: add `preset-match` to the "Subjects and framing (live)" group in section 8 (line 138 area), with its definition from scene_check.mjs.
