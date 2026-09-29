# Methodology: Counterspace Interactive Timeline

*Ledger as of 2026-09-29 (the single date used in every document; `LEDGER_ASOF` in `tools/ledger/schema.py`). Data schema version 1.1.0 (`data/schema.json`). Companion files: `ledger.md` and `verification_log.md` (both generated), `verification_history.md` (archive of earlier passes).*

## Contents
1. [Source editions](#1-source-editions)
2. [Dataset at a glance](#2-dataset-at-a-glance)
3. [Coding rules](#3-coding-rules)
4. [Known uncertainties](#4-known-uncertainties)
5. [Builder decisions](#5-builder-decisions)
6. [3D scene rules](#6-3d-scene-rules)
7. [Image and data credits](#7-image-and-data-credits)
8. [Testing](#8-testing)
9. [What this page does not claim](#9-what-this-page-does-not-claim)
10. [Limitations](#10-limitations)
11. [Rebuild steps](#11-rebuild-steps)
12. [Quality process](#12-quality-process)

## 1. Source editions
- **Primary:** Victoria Samson & Kathleen Brett eds., *Global Counterspace Capabilities: An Open Source Assessment* (Secure World Foundation, 9th ed., Apr. 2026), "SWF 2026". Pins name the table or passage, the printed section-page (e.g., "p. 05-01") and the PDF page. Debris counts are as of February 2026 (Table 5-1).
- **Consulted, not cited:** CSIS, *Space Threat Assessment 2025*, was read for background only. No row, pin or citation depends on it and it is not in the ledger's source list. (The 2026 edition was not yet published as of September 2026.)
- **Other primary documents:** DOE/NV-209 Rev. 16 (Starfish Prime) and the 25 Mar 2003 CENTCOM briefing (Iraq GPS jamming). Each has a full cite in the `source_full` field.
- **Legal:** UNODA treaty pages, UN Digital Library and UNOOSA resolution texts, the UN press release for the 2024 veto, the ITU Constitution (UNTS vol. 1825), the archived White House fact sheet, UNIDIR's history of the CD PAROS committee, ICAO and ITU releases (as quoted in SWF), and the publishers of the manuals. Every legal item has a full citation string in `citation`.
- **Baseline:** SWF 2026 lists no destructive DA-ASAT test after 15 Nov 2021, so the "since 2021" labels stand.
- **Destructive-test count:** SWF Table 5-1 (p. 05-01, PDF p. 212) lists 16 destructive ASAT tests in space: 5 direct-ascent (ledger rows: Solwind, FY-1C, USA-193, Shakti, Cosmos 1408) and 11 co-orbital (10 Soviet/Russian, plus the US Delta 180 of 5 Sep 1986), which are outside the ledger's kinetic rows. `ledger.md` Key figures states both counts and `validate()` checks 5 + 11 = 16.

## 2. Dataset at a glance

| Set | Rows | File |
|---|---|---|
| Kinetic events | 61 | `data/events.json` (`domain: kinetic`) |
| Non-kinetic events | 15 | `data/events.json` (`domain: non_kinetic`) |
| Legal items | 19 | `data/legal.json` |
| Capability categories | 5 | `data/capabilities.json` |
| Lag-panel pairs | 6 | `data/lag_pairs.json` (generated from `related_events`) |
| Schema and version | 1.1.0 | `data/schema.json` |

`events.json` and `legal.json` are top-level arrays, so consumers such as `tools/build_page.py` are unaffected by the sidecar `schema.json`. Every event has `source`, `source_full` (a full cite), `source_url` and `pin`. The 61 kinetic rows are 33 United States (32 from SWF Table 1-4, plus Starfish Prime from DOE/NV-209 as the nuclear marker), 13 China, 13 Russia (12 Nudol flights plus the Cosmos 1408 intercept) and 2 India. Three rows give SWF's month only and carry `date_precision: month`.

## 3. Coding rules
- **Scope rule (selection of kinetic rows).** Every direct-ascent (DA-ASAT) test that SWF 2026 lists is a ledger row: the US Table 1-4 (33 rows), Russia Tables 2-4 and 16-2, China Tables 3-3 and 16-3, India Tables 4-1 and 16-4. That includes failures, rocket-only tests (High Virgo, SIP, HiHo), Nike Zeus tests without a target, ASM-135 tests against a star, and tests with no reported apogee. Exclusions, each disclosed: (a) co-orbital tests, including the one row in Table 1-4 that is co-orbital, the US Delta 180 intercept of 5 Sep 1986 (SWF's text calls it a co-orbital experiment), and the Soviet IS, Naryad, Polyot and Cosmos 2521/2536 entries in Table 16-2; (b) the Table 16-3 line for 15 Apr 2023, treated as a date variant of the 14 Apr 2023 test (recorded in that row's `conflicts`); (c) Starfish Prime is not an SWF DA-ASAT row and is included only as the nuclear marker. Before this rule was audited (see `verification_history.md`, Table 1-4 completeness check, and `verification_log.md` section 2), 15 US rows plus the Russian April 2021 entry and India's February 2019 failed test were missing; all are now included. Where SWF gives only a month (Mar. 1965, Jun.-Jul. 1965, Apr. 2021) the date is the 1st and `date_precision` is `month`; the four Jun.-Jul. 1965 intercepts are one row because SWF lists them as one line.
- **Chart A:** intercept altitude comes from SWF Table 5-1 for destructive tests. Apogee comes from Tables 1-4, 2-4 and 3-3 for other tests, and is null where SWF says "Unknown", "?" or gives a dash; those rows go in a separate strip. Soviet IS co-orbital tests are excluded from the scatter (Chart B only). Starfish Prime is the only nuclear test plotted.
  - **Context for the gaps in Chart A.** With the scope rule above, the ledger has US rows through the Program 437 shot of 28 Mar 1970, then none until the ASM-135 non-destructive test of 21 Jan 1984, then ASM-135 tests in 1984-86, then USA-193 in 2008. There is no destructive test between Solwind (13 Sep 1985) and FY-1C (11 Jan 2007); the 2005-06 SC-19 rows are non-destructive. The ledger has no row of any state in 1971-83 or 1987-2004; these are gaps in SWF's DA-ASAT tables, not a claim that nothing else happened. Any page text stating an empty period must be consistent with this list.
- **Debris:** bubble area is proportional to *cataloged* fragments. In-orbit counts appear only in cards and tables.
- **Chart C:** an event appears only when a named source documents it. Attribution follows the source's wording and is never upgraded. Campaigns are drawn as spans. Ground GNSS jamming affects receivers, not satellites. It is tagged `GNSS_MEO` for the signal it targets, and this is explained on the page.
- **Chart B:** the 2020s follow SWF 2026 chapter sections. Earlier decades are the builder's reconstruction and are labeled on the chart. A state counts as "demonstrated" (D) once it has tested or used the capability, and stays counted in later decades. "Developing" (P) covers programs and latent capability.
- **Confidence:** `high` = date and value match SWF with no unresolved conflict; `medium` = hedged source, a missing value, or a date conflict resolved by rule; `low` = SWF itself marks the value with "?", a single SWF table lists the row, or the report is an anonymous-source press account.
- **Pins:** every row names the table or passage, printed page and PDF page.

## 4. Known uncertainties
- **SWF 2026 contradicts itself** on some values. Each conflict is recorded in the row's `notes` and `conflicts` fields and listed in `ledger.md`:
  - Fengyun-1C: 880 km / 3,532 pieces (Table 5-1) vs 865 km / 3,533 (Table 3-3).
  - Solwind: 530 km (Table 5-1) vs 555 km (prose p. 01-22 and Table 1-4). Debris: Table 5-1 (read with pdfplumber) gives 285 tracked pieces, 0 on orbit as of Feb. 2026, lifespan 18.7 years, so all Solwind pieces have decayed per SWF.
  - Burnt Frost (USA-193): 220 km (Table 5-1) vs 240 km (prose, p. 01-24) vs 2,700 km (Table 1-4 apogee column, interceptor reach). The same prose says the 175 pieces "took about 20 months to de-orbit entirely" (Table 5-1 lifespan: 1.7 years), so the page must not say the debris re-entered within weeks.
  - SC-19 (5 vs 7 July 2005), Nudol (18 Nov vs 18 Oct 2015), Nudol 15 Apr 2020 (Table 2-4 "nothing hit" vs Table 16-2 "debris created"), DN-3 (19 vs 21 June 2022; the appendix lists both 14 and 15 April 2023), and DN-2's apogee (see below). `ledger.md` lists every conflict recorded in a row's `conflicts` field.
- The Nudol apogees for 2015-16 carry a "?" in SWF, so those rows are low confidence. The 14 Jun 2019 and Apr. 2021 Nudol rows appear only in Table 16-2 and are low confidence. India's 12 Feb 2019 failed test rests on anonymous US government sources reported in SWF and is low confidence.
- DN-2's apogee is disputed (10,000 km claimed by China; nearly GEO per the US military; at least ~30,000 km per analysis cited by SWF).
- Several non-kinetic start dates are approximate or come from outside SWF (Ukraine 2014, North Korea Aug. 2010, Trident Juncture window, MIRACL day); each row note says so. The Iran/Eutelsat span (2009-2012) understates the Oct. 2022 episode SWF reports.
- The 2020s Chart B D/P split was checked against SWF's country matrix, read from the PDF's graphics. All D entries match. Some P entries for direct-ascent (South Korea, Iran, North Korea, France) and co-orbital (India, Iran, Israel, Japan, North Korea, UK) are the builder's reading of the country chapters: SWF's matrix shows "no data" for them. The matrix has no cyber row; cyber follows SWF chapter 15. These two categories remain PARTIAL in `verification_log.md`.
- Bot-blocked sites (UN Digital Library, treaties.unoda.org, ICAO, OUP) could not be fetched by script; their facts were checked through other sources, as `verification_log.md` states per row. The ITU summary of decisions (`itu-rrb-2024`) was located and read in full in the final pass, so no legal row is PARTIAL.

## 5. Builder decisions
1. **Table 5-1 used for all intercept altitudes and debris counts:** one consistent definition across tests. Other values are kept in notes and `conflicts`.
2. **Date conflicts:** where SWF's prose and appendix agree against one table, the prose/appendix date is used (DN-3, 21 June 2022). Otherwise the chapter table is used (Nudol 18 Nov 2015) and the alternative is disclosed.
3. **Iraq 2003 GPS jamming included** in Chart C but excluded from Chart B: Iraq is outside SWF's 13 countries.
4. **Iran/Eutelsat coded `multi_government`:** the ITU located the source in Iranian territory. The row note says this is not a finding of state responsibility.
5. **Attribution is never upgraded.** Levels follow the source's wording: `official_government`, `multi_government`, `researcher_osint`, `alleged`.
6. **Russia-Syria campaign starts in 2016, not 2017:** SWF p. 02-28 says the spoofing "began in 2016, peaked in 2017".
7. **All listed DA-ASAT tests included** (scope rule, section 3): every Nudol flight in Tables 2-4 and 16-2 and every US Table 1-4 direct-ascent row, including failures, rocket-only tests and star-tracking tests, typed `non_destructive` (no debris reported) with no altitude when SWF reports none. Rows found in only one table are low confidence.
8. **Related-law chips:** Shakti (2019) is linked to UNGA 77/41 (`related_events` in `legal.json`), because that resolution is the multilateral response to DA-ASAT tests generally. The US moratorium (Apr. 2022) is a US pledge that post-dates the Indian test and is linked to Cosmos 1408.
9. **No co-orbital shadowing scene:** it was optional, and no co-orbital event is in the ledger (co-orbital appears in Chart B only).
10. **Laser scene shared:** one laser scene serves MIRACL (1997, fired at White Sands, NM, against the US satellite MSTI-3) and Peresvet (2018).
11. **Light theme follows the OS setting:** the page is dark by default but switches to light when the OS prefers light. The in-memory toggle overrides it.
12. **Lag panel is chronology, not causation; pairs come from `related_events` only.** The panel shows elapsed time between a ledger event and a later legal or policy item. It does not say the test caused, prompted or was answered by the instrument, and "first" or "response" language is used only where a source says so. The rule, implemented in `tools/ledger/lagpairs.py` and written to `data/lag_pairs.json`: `legal.json` `related_events` is authoritative; each event named in the `related_events` of at least one legal item dated *later* than the event is paired with the earliest such item. Legal items that pre-date the event form no pair (Tallinn 2017 and Viasat 2022; ITU 1992 and the Baltic case). The result is six pairs: Starfish Prime to LTBT (1963), Shakti to UNGA 77/41 (2022), Cosmos 1408 to the US moratorium (2022), North Korea GNSS jamming to ICAO (2025), Baltic GNSS interference to ICAO (2025) and the 2024 jamming of European satellites to ITU RRB (2024). Two events are shown as open rings because no later related item exists in the ledger: MIRACL (no link at all; the ring states an absence in this ledger, not that no rule exists) and Viasat (only the earlier, soft-law Tallinn Manual). Two pairs the page used to draw have no sourced link and are **dropped**: Bold Orion to the Outer Space Treaty (nothing in SWF or the treaty connects them) and Fengyun-1C to UNGA 77/41 (that resolution's `related_events` are Cosmos 1408 and Shakti; a Fengyun link would be the builder's inference). The page reads `data/lag_pairs.json` instead of hard-coding the list (see `tools/PAGE_TODO.md`).
13. **Attribution cases.** `mideast-2023-gnss` is coded to what the IDF's own public statement supports: Israel, jamming, `official_government`. SWF says open sources cannot tell whether Israel, Hamas or others conduct the rest of the EW and spoofing, so no other actor is coded (a second row was considered and dropped because SWF makes no allegation against a named actor). `ru-2018-peresvet` is `official_government` because the Russian government announced the system itself; it is a capability announcement in the directed-energy lane, not an act against a satellite.
14. **Legal context sources.** `ltbt-1963` says the treaty "followed" Starfish Prime (chronology) and cites the US State Department Office of the Historian for the Cuban Missile Crisis impetus and fallout concern; that page is the source for that context.
15. **Schema version and sidecar:** `data/schema.json` carries `schema_version` (1.1.0) and field descriptions. Metadata is kept out of `events.json` and `legal.json` so they stay plain arrays. Patch = rows or values corrected; minor = new optional fields; major = shape change.
16. **ICAO legal item label:** the item reads "ICAO: GNSS interference an 'infraction' of the Chicago Convention". SWF p. 02-30 says ICAO determined the interference "was indeed an infraction of the 1944 Convention", condemned it and called for fulfilment of obligations. ICAO's release says its Assembly endorsed its Council's determination that the incidents "constitute infractions" of the Convention. "Infraction" is the source's own word, so it is used in quotes. "Breaches" was dropped because it reads like an adjudicated violation; "findings" alone was dropped because it understates a determination plus a condemnation. The note states that this is an intergovernmental finding, not a court judgment.
17. **Full cites:** every event has `source_full` and every legal item has `citation` in Bluebook-style form, for use in the page's sources list. SWF is cited with its editors (Samson and Brett), edition and URL.
18. **Coastlines** come from Natural Earth via world-atlas (public domain), simplified and inlined (~48 KB). They are used in the static diagrams and as the globe's fallback.
19. **Rendering upgrades (code only):** atmosphere glow, fixed sun with terminator, starfield, soft particles, trails, explosions, pulsing laser beam, flickering jammed GNSS links.
20. **Scene PNG export** renders at 3000 px wide (capped by the GPU) with a header band ("illustrative" banner), the scene with its labels, and a footer band with the title, the source and the imagery credit on separate lines. Nothing is drawn over the globe. Static diagrams export in the same layout.

## 6. 3D scene rules
- Scenes are illustrative only. Radial scale is compressed (altitude^0.45) and Earth is to scale.
- Particles equal cataloged fragments, capped at 5,000 on desktop and 1,500 on phones. The background starfield is decorative and outside that budget.
- Debris spreads along its orbit much faster than in reality, so that a months-long process fits a 12-16 second scene. Decay statements on the page come from SWF, not from the animation.
- Scenes that show a dispute (DN-2 apogee, Solwind and Burnt Frost altitudes) state the conflict in the panel.
- Reduced motion or missing WebGL gives a static vector diagram with no texture.

## 7. Image and data credits
- **Earth imagery:** NASA Blue Marble (U.S. government work, public domain), 4096x2048 px, 1.4 MB, loaded from a pinned copy on jsDelivr (`three-globe@2.45.0/example/img/earth-blue-marble.jpg`). It is fetched after the page's load event, skipped when reduced motion is on or WebGL is unavailable, and downscaled to 2048 px on phones.
- **Coastlines:** Natural Earth via world-atlas (public domain).
- **Report data:** SWF 2026 is licensed CC BY-NC 4.0 (Secure World Foundation). The page cites it and does not reproduce its tables wholesale.

## 8. Testing
- `tools/qa.mjs` (Playwright) checks console errors, horizontal scroll at 375 and 1440 px in light, dark and reduced-motion modes, keyboard open and focus return, and WebGL memory returning to baseline after cycling all scenes.
- `audit()` (in `src/audit.js`, also run by `qa.mjs`) tests every chart SVG, static scene diagram and live scene label for overlapping or clipped text, and the page for HTML overflow; it returns `[]` at 1440, 900 and 375 px in light and dark.
- `qa.mjs` also runs axe-core (page and scene dialog), checks the exported SVGs and stills, and compares a hash of each chart section's rendered SVG with `tools/qa-baseline.json` to flag unintended visual changes. Refresh the baseline with `BASELINE=1` after a deliberate change.
- Data checks: `validate()` (`tools/ledger/validate.py`) runs on every `python3 tools/build_data.py` and fails the build on: duplicate ids (events and legal); missing required fields per domain (kinetic: state, system, target, date, type, altitude kind; non-kinetic: actor, category, start, attribution, target regime); `capabilities.json` categories, decades, state names and values other than D or P; `lag_pairs.json` ids that do not resolve or whose legal item does not list the event in `related_events`; values outside the enums in `data/schema.json` (domain, confidence, type, altitude kind, date precision, category, attribution, target regime, legal kind); malformed or impossible dates (`YYYY-MM-DD`, `fragments_as_of` `YYYY-MM`, end before start); `related_events` or `scene_3d` that do not resolve (scene ids: starfish, solwind, fengyun, burnt-frost, dn2, shakti, cosmos1408, gnss, viasat, laser); a missing `source`, `source_full`, `source_url` or `pin` on an event, or `citation`/`source_url` on a legal item; `fragments_in_orbit` greater than `fragments_cataloged`; a row count in the table in section 2 of this file that differs from the data; counts in `ledger.md` (dataset sizes, destructive and co-orbital figures) and `verification_log.md` (one table row per data row, per-set and status totals, discrepancy count); and any "as of" date that differs from `LEDGER_ASOF`. It does not compare docs to page text, and it does not check factual accuracy; that is done in `verification_log.md`.
- Source checks are logged in `verification_log.md`.

## 9. What this page does not claim
- **No completeness claim.** It is a ledger of events named in SWF 2026 (and a few named external sources), not a census of all counterspace activity. Classified, unreported and unattributed events are absent by construction.
- **No attribution beyond the source.** Jamming, spoofing and cyber rows carry the source's attribution level. A row is not a finding of state responsibility, and no legal item is a court judgment.
- **No prediction and no ranking of capability.** Chart B counts states that have demonstrated (D) or are developing (P) a capability. It does not compare their strength, intent or readiness.
- **No physical simulation.** The 3D scenes are illustrative: compressed radial scale, accelerated debris spread and simplified geometry. Only the numbers in the panels are data.
- **No causal link between tests and law.** "Related law" chips show chronology or a stated multilateral response, not that one caused the other.
- **No claim that EW and cyber are the only methods used in operations.** The page's lede quotes SWF verbatim, Executive Summary, p. xxiii (PDF p. 21): "only non-destructive capabilities are actively being used against satellites in current military operations." SWF's category is "non-destructive", not "EW and cyber", and it concerns use against satellites. Any examples of non-destructive methods (jamming, spoofing, dazzling, cyber) stay outside the quotation, in the page's own sentence, and are not attributed to SWF. The page must not say those methods are the *only* counterspace tools used in operations.
- **No SWF-assessed pre-2020s capability coding.** Earlier decades in Chart B are the builder's reconstruction and are labeled so.

## 10. Limitations
- **Single primary source.** Most rows rest on SWF 2026. Where SWF contradicts itself (section 4) the ledger states its rule and shows both values.
- **Table extraction.** Tables 1-4, 4-1, 5-1 and 16-2 to 16-4 extract with mixed columns under plain-text extraction, so they were read cell by cell with a layout-aware extractor (pdfplumber). That check showed that the Bold Orion row's earlier note wrongly carried the High Virgo "loss of telemetry" cell (fixed), and confirmed the Solwind row: 530 km, 285 tracked, 0 on orbit, 18.7 years.
- **Graphical capability matrix.** SWF's country matrix was read from vector shapes by position and colour, not from text. Two Chart B categories (direct-ascent, co-orbital) stay PARTIAL because their 2020s P entries go beyond it (section 4).
- **Approximate dates and spans.** Some non-kinetic start dates are approximate or external (section 4). Year-only sources use 1 Jan or 31 Dec.
- **Bot-blocked primary pages.** Some URLs (ICAO, UNOOSA) cannot be fetched by script; the facts were checked through other sources, as listed in `verification_log.md`.
- **Snapshot in time.** As of 2026-09-29. Debris counts are as of Feb. 2026 and change as pieces decay. 
- **Small numbers.** With 61 kinetic rows and 15 non-kinetic rows, decade counts are sensitive to single events; read the charts as illustration, not statistics.

## 11. Rebuild steps
1. Edit rows in `tools/ledger/rows.py` and verification states in `tools/ledger/verification.py` (never the generated files). The as-of date is `LEDGER_ASOF` in `tools/ledger/schema.py`.
2. `python3 tools/build_data.py` runs `validate()` (the build stops on any failure) and writes `data/events.json`, `data/legal.json`, `data/capabilities.json`, `data/schema.json`, `data/lag_pairs.json`, `ledger.md` and `verification_log.md`. Update the counts table in section 2 of this file by hand; `validate()` checks it.
3. `python3 tools/build_page.py` rebuilds the page from `data/` and `src/`. With esbuild installed (`npm install` in `tools/`) it bundles `src/boot.js` into one minified IIFE; otherwise it falls back to concatenating the modules.
4. `node tools/qa.mjs` runs the QA checks and regenerates the SVG exports in `exports/` (light mode).

## 12. Quality process
Independent verification and reviews were run on the dataset, page and documents. `verification_log.md` is the single current state of every row (generated; earlier passes are archived in `verification_history.md`), and `grading_report*.md` holds the independent reviews. Defects those reviews found were fixed in `tools/ledger/` and re-verified. The automated checks are `validate()` (section 8) and `tools/qa.mjs` (browser and visual checks). Counts in `ledger.md` and `verification_log.md` are generated from the data.
