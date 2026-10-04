# Grading report, round 9, reviewer C (data, docs, accuracy, code)

Verified: `python3 tools/build_data.py` prints `validate(): OK (76 events, 19 legal items)`. A temp copy with `1984-13-21` failed with `VALIDATION FAILED ... bad date`; copy discarded. `build_page.py` output is byte-identical to the committed index.html.

## Score table

| Portion | Score |
|---|---|
| Data ledger (JSON) | 94 |
| ledger.md | 91 |
| methodology.md | 92 |
| verification_log.md | 88 |
| Code quality / architecture | 84 |
| Accuracy | 92 |
| Pedagogical value | 91 |
| Fidelity to textbook-companion purpose | 93 |
| Sources & methodology section (docs + page text) | 93 |

Best single improvement per item: Data: make the lag pairs come from `related_events`. ledger.md: one "as of" date everywhere. methodology.md: reconcile section 12 with the lag list. Log: collapse to one current layer. Code: real bundler plus validate() coverage of capabilities. Accuracy: fix the Starfish caption. Pedagogy: drop or caveat Bold Orion to OST and FY-1C to 77/41. Fidelity: fine. Sources: fine.

## Round-8 defects: status
- Table 1-4 completeness: FIXED. pdfplumber on PDF 72-73 gives 33 rows. 32 are ledger rows and the Delta 180 co-orbital row is excluded and disclosed. Rows added: High Virgo, SIP, HiHo, Nike Zeus, ASM-135. Also added: Russia Apr 2021 and India Feb 2019. Counts 33 US / 13 CN / 13 RU / 2 IN match methodology.
- Solwind consistency: FIXED. Table 5-1 row "530 km / 285 / 0 / 18.7 years" confirmed. Row note, ledger endnote 30 and log agree.
- Attribution: FIXED. `mideast-2023-gnss` is Israel (IDF), jamming only. Peresvet is labeled a self-declared capability announcement.
- Lag panel: mostly FIXED. It is retitled as chronology and the ICAO/Ukraine pair is gone. Two pairs are still not in `related_events` (defect 1).
- LTBT context: FIXED. Sourced to the Office of the Historian; "followed" kept.
- Starfish/Shakti cites: Shakti pin fixed (p. 04-04 in events.json; scene cite "p. 04-04"). Starfish now cites SWF p. 12-05, but the caption goes beyond it (defect 2).
- validate(): FIXED and real (ids, enums, dates, source fields, id resolution, fragment counts, methodology row counts).
- Methodology claims match reality: yes for section 8. CSIS is now "consulted, not cited" in the three places it appears. Grade history is removed from methodology section 12.

## Spot checks that passed (24)
- Lede vs Exec. Summary (PDF 21): verbatim.
- Table 1-4 (pdfplumber): High Virgo 12 km; Bold Orion 200 km, Explorer VI; SIP/HiHo rocket tests; HiHo Aug 1962 1,600 km; Nike Zeus 160/241/146 km; P437 1000/674/778/932/1148/826/484/823/1158/1074; ASM-135 Jan 1984 1,000 km; Nov 1984 "Failed test"; Aug 22 and Sep 29 1986 "Successful test in tracking" (ledger matches; earlier "debris created" belongs to Solwind); Solwind 555 km.
- Table 5-1 (PDF 212): Solwind 530/285/0; FY-1C 880/3532/2351; USA-193 220/175/0/1.7; Shakti 300/130/0/3.2; Cosmos 1408 470/1807/5. Sums 5,929 and 2,356 are correct.
- Shakti "within 45 days at most" is on PDF 204 = p. 04-04. Cosmos 1408 ISS crew sheltering (PDF 134). Viasat "tens of thousands of modems", "within hours", AcidRain (PDF 292-293). "38 countries total" (PDF 99). Printed page labels 04-03/04-04/02-21/12-05/03-21 map to PDF 203/204/134/269/182.
- Legal: LTBT 14 U.S.T. 1313, 480 U.N.T.S. 43; OST 18 U.S.T. 2410, 610 U.N.T.S. 205; ITU 1825 U.N.T.S. 331 with "entire freedom"; 2024 veto labeled nuclear weapons in orbit and "did not concern DA-ASAT testing", 13-1-1; Tallinn, Woomera and MILAMOS `soft_law` with "(soft law)" labels; ICAO "infraction" quoted.

## Factual and accuracy defects
1. Lag panel versus its own rule. `methodology.md` 12 says `legal.json` `related_events` "is the authoritative pairing". Two of the six LAG pairs in `src/charts/lag.js:6,8` are not in it. `ost-1967` has no `related_events`, so Bold Orion to OST is not there. `unga-77-41` lists cosmos1408 and shakti, not `cn-2007-fy1c`. The row text discloses this, but the methodology claim is false as written. Either add the links or say the panel is builder-selected.
2. Starfish scene caption `src/scenes/config.js:10` says the belt "damaged several satellites in the following months". The cited SWF p. 12-05 (PDF 269) says only that such tests "are known to have generated effects that damaged or destroyed satellites in orbit at the time." "Several" and "following months" are not in the cite. The cite at :11 implies they are.
3. Unsourced scene facts stated flatly, all true but not in the pinned sources: "F-15 climbs over the Pacific" (Solwind, :21), GPS "about 20,200 km" (:84), and FY-1C "largest debris-generating event on record" (:31). SWF's Table 5-1 supports only "most cataloged fragments in the table".
4. Lede "puts the technology and the legal response on one year axis" (template.html:318) suggests response, against methodology 9 ("no causal link"). Minor.

## Documentation defects
5. "As of" dates disagree. `ledger.md:3`, `schema.json ledger_as_of`, methodology.md:3 and `page_strings` say 2026-09-28. `verification_log.md:3` says 2026-09-29, and the rows changed on 09-29.
6. `verification_log.md` still layers three states. The "Discrepancies" heading says "All 35 were corrected" (~line 96) but 41 rows follow. The "Executive summary" and "Results by category" (44 kinetic, 83 items, 35 defects) are stale, labeled only by a parenthesis. The `Closed items` and `Scope disclosure` text predate the current scope. A reader wanting the current per-row count has to combine three sections. Round-8's readability complaint is only half fixed.
7. `ledger.md` Key figures counts only 5 destructive tests but Table 5-1 lists co-orbital destructive tests; a note says so. The Key-figures caption should give the co-orbital count (Delta 180 is the only US one) to avoid a reader thinking the US has one destructive test in the 1980s.
8. methodology.md is 21 KB, and section 12a/12b/14 bury coding decisions inside a numbered list ("12a", "12b"); harder to cite.

## Code / architecture defects
9. Fake modules persist. `tools/build_page.py:10-12` strips `import`/`export` by regex and concatenates 23 files in a hand-kept `ORDER`. Name collisions are unchecked and `scenes.js` is comments only.
10. `_min_js` (build_page.py:22-32) still toggles template-literal state by counting backticks per line. A backtick in a regex, string or comment breaks it silently. The expression relies on `&` binding looser than `-`.
11. `validate()` covers events and legal only. It does not check `capabilities.json` (a state in an unknown category, an unknown state name). It does not check required fields such as actor/target/date for kinetic rows. It does not check that `schema.json` field docs match row keys. It does not check the ledger.md counts (only methodology counts). Row data, the schema, a 300-line markdown generator and validate() all live in one 78 KB `build_data.py`.
12. 118 lines exceed 250 characters in `src/` (lag.js:37, 39, 45; config.js status arrays; a.js:82-110). `qa.mjs` has no data assertions and its baseline hashes SVG markup, so any deliberate change needs `BASELINE=1`.

## Verdict
Data and sourcing now meet a 93+ standard (94). The remaining gaps are mostly documentation hygiene (log layering, as-of dates), two unsourced lag pairs, one over-stated scene caption, and build architecture.
