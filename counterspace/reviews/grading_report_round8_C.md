# Grading report, round 8, reviewer C (data, docs, accuracy, code)

Scope: ledger.md, methodology.md, verification_log.md, data/*.json, tools/*, src/**, page text in src/template.html and src/method.js. Spot-checked against swf_2026.txt.

## Score table

| Portion | Score |
|---|---|
| Data ledger (JSON) | 91 |
| ledger.md | 89 |
| methodology.md | 85 |
| verification_log.md | 88 |
| Code quality / architecture | 83 |
| Accuracy | 90 |
| Pedagogical value | 89 |
| Fidelity to textbook-companion purpose | 91 |
| Sources & methodology section (docs + page text) | 90 |

## Spot checks that passed (21 values)
Lede quote matches SWF Exec. Summary verbatim (PDF 21, "only non-destructive capabilities are actively being used against satellites in current military operations"). Table 5-1 (PDF 212): Solwind 530 km/285; FY-1C 880/3532/2351; USA-193 220/175/0; Shakti 300/130/0; Cosmos 1408 470/1807/5; lifespans 1.7 and 3.2 yr. Sums 5,929 / 2,356 correct. Solwind 555 km in prose (PDF 71) and Table 1-4 (PDF 73). FY-1C 865 km / 3533 (Table 3-3, PDF 183). Bold Orion 200 km, Nike Zeus 160/241/146, P437 1000/674/778/932/1148/826/484/823 (PDF 72). Nudol Table 2-4 dates, 200 km? / 100 km? "?" marks, 470 km (PDF 134). Shakti "45 days" (PDF 204, p. 04-04). ICAO "indeed an infraction" (SWF). "38 countries total" present. Cosmos 1408 "5 still in orbit as of Feb 2026". No plotted-value error found.

Legal cautions all pass: LTBT "followed Starfish Prime" (legal.json short_note; lag.js "followed it"); UNSC veto labeled nuclear weapons in orbit and "did not concern DA-ASAT testing", 13-1-1; Tallinn, Woomera, MILAMOS carry `soft_law: true` and "(soft law)" in the label; ITU Constitution Arts. 45 & 48 present, "entire freedom" correct, UNTS pin 361-62.

## Factual / accuracy defects

1. **Chart A gap annotation is contradicted by SWF.** src/charts/a.js:82 prints "No tests in the ledger 1971-83 or 1986-2004 / Only the US ASM-135 program, 1984-85, falls between." SWF Table 1-4 (PDF 73) lists ASM-135 tests on Nov. 13, 1984, Aug. 22, 1986 and Sept. 29, 1986 (the last "Successful test, debris created"), none of which is in the ledger. The wording is "in the ledger", but the ledger silently omits them. methodology.md:40 says the gaps "reflect SWF's tables and this scope rule", which is false for 1986. Table 1-4 also lists Mar. 21, Apr. 19 and May 24 1963, Mar. and Jun.-Jul. 1965 and Jan. 13, 1966 Nike Zeus tests, and 1959-62 rocket tests, that are omitted. Nowhere (methodology, ledger.md, page) is it disclosed that the US Table 1-4 rows are a selection (16 of ~30), whereas Nudol is disclosed as complete. This is the main accuracy and completeness defect.
2. **Lag panel implies causation and mismatches its own ledger.** src/charts/lag.js:10 pairs `ru-2014-ukraine` with `icao-2025` ("first ICAO finding against Russia", lag 11.6 yr). Neither "first" nor the Ukraine link is sourced: legal.json `icao-2025.related_events` are ru-2023-baltic and kp-2010-gps, and the ICAO determination concerned recurring interference in the Baltic region and the DPRK. Lag.js:5 (Bold Orion 1959 -> OST 1967, 7.3 yr) and :8 (FY-1C -> UNGA 77/41, 15.9 yr) frame unrelated instruments as "the legal or policy response that addressed" the capability (template heading), while methodology.md section 9 says "No causal link between tests and law." OST Art. IV concerns WMD, not ASATs (the row's own text concedes it).
3. **Attribution level possibly stronger than source.** `mideast-2023-gnss` is coded `official_government` with actor "Israel and others (multiple actors)" (events.json; ledger.md row 57). SWF p. 10-02 says open sources cannot tell whether Israel, Hamas or others conduct the EW; only the IDF's own statement supports the level, and only for Israel. The actor label should not include "and others" under that level. `ru-2018-peresvet` `official_government` is a self-declaration of a system, not an attribution of an act.
4. **Mis-pins/mis-cites on the page.** src/scenes/config.js Shakti scene cite says "p. 04-03"; the "within 45 days" statement is on p. 04-04 (PDF 204; PDF 203 is 04-03), as events.json pins. The Starfish scene caption ("damaged several satellites in the following months") is cited only to DOE/NV-209, which does not say that; the source is SWF p. 12-05 (PDF 269). The Solwind scene caption and status line ("all have since decayed", "all since decayed") state the in-orbit zero as fact, while events.json/ledger.md endnote 17 says that cell "could not be tied to this row ... not plotted".
5. **Unsourced context in legal.json.** `ltbt-1963` short_note ("fallout concerns and the Cuban Missile Crisis were also drivers") has no source in the citation or URL.

## Documentation defects

6. **Contradiction on the Solwind cell.** verification_log.md:35, :88 and :139 say the Solwind zero was re-read with pdfplumber and is VERIFIED ("Sep. 13, 1985 / ... 530 km / 285 / 0 / 18.7 years"); methodology.md:109 says the same. But Discrepancy 35 (log :113), events.json us-1985-solwind notes and ledger.md endnote 17 say it "could not be tied to this row". Both cannot be current. The data note should be updated to the verified status (or the log corrected).
7. **methodology.md overclaims automated checks.** Section 8 (line ~101) lists "Data checks: every event has source_full; every id in related_events exists; counts in the docs match events.json" and section 12.3 says they "run on each rebuild". No such checks exist in tools/qa.mjs, build_data.py or build_page.py (grep for source_full/related_events finds only src/method.js). Only doc counts are generated. Add a `validate()` step or remove the claim.
8. **Stale/self-referential process text.** methodology.md section 12.2 says "Six independent grading rounds" and lists scores through round 6; grading_report_round7.md exists and this is round 8. Publishing reviewer scores in a scholarly methodology note is also odd for law-school readers; state the verification result, not the grades.
9. **CSIS listed as "Secondary" source** (methodology.md:21, app.js:31, method.js:17) but no row, pin or citation uses it; it is not in the cited-sources list. Say "consulted, not cited" or drop it.
10. **verification_log.md** counts (49+10+2+22 = 83) reconcile, but the log never records the Table 1-4 row-membership check (defect 1), so "every row checked" is true while coverage of the table was not audited. The log also mixes "second pass" chronology with a "follow-up after round 5" layer, which makes the current state harder to read.

## Code / architecture defects

11. **Fake modules.** src uses `import`/`export` but tools/build_page.py:10-12 strips them by regex and concatenates 23 files into one global scope; files cannot be loaded standalone, dependency order is a hand-kept list, and name collisions are unchecked (scenes.js is a file of comments only).
12. **Fragile minifier.** build_page.py `_min_js` toggles "inside template literal" by counting backticks per line (`line.count('`') - line.count('\\`') & 1`); a backtick in a regex, string or comment breaks it silently. Operator precedence in that expression relies on `&` binding looser than `-`.
13. **No validation in build_data.py** (65 KB, data + schema + 300-line markdown generator in one file): no unique-id check, no enum check against SCHEMA, no `related_events` resolution, no date-format check. SCHEMA is embedded there and re-emitted, but nothing tests rows against it. schema.json omits the "unilateral (soft law)" display distinction and `conflicts` structure.
14. **Density and hard-coding.** Many lines exceed 250 characters (config.js, lag.js, app.js); "as of" strings ("28 Sept. 2026", "SWF 9th ed.") are hard-coded in app.js:23-31 rather than read from schema.json `ledger_as_of`. qa.mjs (167 lines) has no data assertions, and the visual-regression baseline hashes SVG markup, so any deliberate change needs BASELINE=1.

## Best single improvement per portion (below 93)
- Data ledger: add the omitted Table 1-4 rows (or a `scope` field and disclosure) so Chart A's gap statement is true.
- ledger.md: state the Table 1-4 selection rule and fix endnote 17 to the verified Solwind status.
- methodology.md: make section 8/12 true by adding an automated `validate()` and drop scores; correct the round count and the CSIS claim.
- verification_log.md: resolve the Solwind contradiction and log a Table-1-4 completeness check.
- Code: replace regex concatenation with a real bundler (esbuild) and add schema validation to build_data.py.
- Accuracy: fix a.js:82 and the ICAO/Ukraine lag pair; recode `mideast-2023-gnss` actor/level.
- Pedagogical value: retitle the lag panel "chronology, not causation" and drop pairs whose link is not sourced.
- Fidelity: cite Starfish damage to SWF p. 12-05 and fix the Shakti pin.
- Sources section: list CSIS as consulted-only or remove; add the Table 1-4 selection note to the coding rules.
