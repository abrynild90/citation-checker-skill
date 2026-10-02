# Regrade 2, reviewer C (current state)

Ran `python3 tools/build_data.py`: `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`; 61 kinetic, 15 non-kinetic, 68 co-orbital, 19 legal. Did not run qa.mjs or scene_check.mjs.

| Portion | Score |
|---|---|
| Data | 96 |
| ledger.md | 94 |
| methodology.md | 95 |
| verification_log | 94 |
| Code quality | 93 |
| Accuracy | 96 |
| Pedagogy | 94 |
| Brief fidelity | 95 |
| Sources | 94 |

## Evidence
- Structure: no file over 1,000 lines. Largest are sim.js 737, bundled-scene gl-host.js 693, charts/legal.js 697, ledger/rows.py 586 and scene_check.mjs 477 (rules.mjs 399, collectors.mjs 237). sim-space.js (396) has a clear header, and its imports and `buildSpaceActor` are documented. scenes/README.md lists both sim files.
- Headers: all seven "Module map" headers now say src/scenes/README.md. No stale "src/scenes.js" pointer remains (methodology.md:102 mentions it only as "gone").
- Line length: 0 lines over 160 in all src/*.js, tools/*.mjs, scene_check/*.mjs and tools/*.py. Remaining issue: src/template.html has 36 lines over 160 (longest 501 characters), all CSS rules and meta tags. This is why Code quality is 93 and not higher.
- methodology.md vs code: every rule name in section 8 is found in tools/scene_check.mjs, rules.mjs or collectors.mjs. `preset-match` is now present (line 139) and matches scene_check.mjs:34 and :160-165. Leader limits 0.17 W and 0.27 W match rules.mjs:125. The scene_check/rules.mjs and collectors.mjs split is described at line 136. File references resolve. The other backticked names (mideast-2023-gnss, ru-2018-peresvet, etc.) are event or scene ids, not rules. Gap: the "1,000 lines" and "160 columns" convention is not stated in methodology.md, so a reader cannot tell what the code limits are. That costs a few points.
- Data, ledger, log, Sources, Pedagogy, Brief: no regression. Validate passes, counts agree across the documents, and the git status of data files is clean of changes.
- Accuracy 96: five facts spot-checked against swf_2026.txt, all match. Cosmos 1408 destroyed by Nudol (line 15103); Mission Shakti KKV (23671-23679); Burnt Frost SM-3 Block IA (7730); FY-1C debris section (14110, 21188); Starfish 1.4 Mt W49 (6948).

## Fixes for anything under 93
None under 93. To lift Code quality above 93: wrap or move to a `<style>` file the 36 over-length lines in src/template.html (split CSS rules one declaration per line). To lift methodology.md further: add one sentence to section 8 or 25 stating the file-size (under 1,000 lines) and line-length (160) conventions, and which tool checks them.
