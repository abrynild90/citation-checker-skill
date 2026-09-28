# Methodology: Counterspace Interactive Timeline

*Ledger as of 2026-09-28. Data schema version 1.0.0 (`data/schema.json`). Companion files: `ledger.md` (generated reference tables), `verification_log.md` (row-by-row checks).*

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
- **Secondary:** CSIS, *Space Threat Assessment 2025*. The 2026 edition was not published as of September 2026 (checked on the CSIS project page).
- **Other primary documents:** DOE/NV-209 Rev. 16 (Starfish Prime) and the 25 Mar 2003 CENTCOM briefing (Iraq GPS jamming). Each has a full cite in the `source_full` field.
- **Legal:** UNODA treaty pages, UN Digital Library and UNOOSA resolution texts, the UN press release for the 2024 veto, the ITU Constitution (UNTS vol. 1825), the archived White House fact sheet, UNIDIR's history of the CD PAROS committee, ICAO and ITU releases (as quoted in SWF), and the publishers of the manuals. Every legal item has a full citation string in `citation`.
- **Baseline:** SWF 2026 lists no destructive DA-ASAT test after 15 Nov 2021, so the "since 2021" labels stand.

## 2. Dataset at a glance

| Set | Rows | File |
|---|---|---|
| Kinetic events | 44 | `data/events.json` (`domain: kinetic`) |
| Non-kinetic events | 15 | `data/events.json` (`domain: non_kinetic`) |
| Legal items | 19 | `data/legal.json` |
| Capability categories | 5 | `data/capabilities.json` |
| Schema and version | 1.0.0 | `data/schema.json` |

`events.json` and `legal.json` are top-level arrays, so consumers such as `tools/build_page.py` are unaffected by the sidecar `schema.json`. Every event has `source`, `source_full` (a full cite), `source_url` and `pin`. The 44 kinetic rows include 12 Nudol flights (11 test rows plus the Cosmos 1408 intercept; all Nudol tests in SWF Tables 2-4 and 16-2), of which four (12 Aug 2014, 22 Apr 2015, 14 Jun 2019, 15 Nov 2019) were added late and are checked in `verification_log.md` (Discrepancies 28-30).

## 3. Coding rules
- **Chart A:** intercept altitude comes from SWF Table 5-1 for destructive tests. Apogee comes from Tables 1-4, 2-4 and 3-3 for other tests. Tests with no reported altitude (including the four added Nudol rows) go in a separate strip. Soviet IS co-orbital tests are excluded from the scatter (Chart B only). Starfish Prime is the only nuclear test plotted. Co-orbital events such as Cosmos 2521 (Table 16-2) are out of scope for the kinetic ledger.
  - **Context for the gaps in Chart A.** The ledger (`data/events.json`) has no US or Soviet direct-ascent test between the US Program 437 shot of 28 Mar 1970 and the ASM-135 non-destructive test of 21 Jan 1984, and the first destructive test after 1985 (Solwind, 13 Sep 1985) is followed by no destructive test until FY-1C on 11 Jan 2007 (the 2005-06 SC-19 rows are non-destructive). Soviet IS co-orbital tests are excluded from Chart A by rule. The empty stretches reflect SWF's tables and this scope rule; the page does not claim that no other activity occurred.
- **Debris:** bubble area is proportional to *cataloged* fragments. In-orbit counts appear only in cards and tables.
- **Chart C:** an event appears only when a named source documents it. Attribution follows the source's wording and is never upgraded. Campaigns are drawn as spans. Ground GNSS jamming affects receivers, not satellites. It is tagged `GNSS_MEO` for the signal it targets, and this is explained on the page.
- **Chart B:** the 2020s follow SWF 2026 chapter sections. Earlier decades are the builder's reconstruction and are labeled on the chart. A state counts as "demonstrated" (D) once it has tested or used the capability, and stays counted in later decades. "Developing" (P) covers programs and latent capability.
- **Confidence:** `high` = date and value match SWF with no unresolved conflict; `medium` = hedged source, a missing value, or a date conflict resolved by rule; `low` = SWF itself marks the value with "?" or a single table lists the row.
- **Pins:** every row names the table or passage, printed page and PDF page.

## 4. Known uncertainties
- **SWF 2026 contradicts itself** on some values. Each conflict is recorded in the row's `notes` and `conflicts` fields and listed in `ledger.md`:
  - Fengyun-1C: 880 km / 3,532 pieces (Table 5-1) vs 865 km / 3,533 (Table 3-3).
  - Solwind: 530 km (Table 5-1) vs 555 km (prose p. 01-22 and Table 1-4).
  - Burnt Frost (USA-193): 220 km (Table 5-1) vs 240 km (prose, p. 01-24) vs 2,700 km (Table 1-4 apogee column, interceptor reach). The same prose says the 175 pieces "took about 20 months to de-orbit entirely" (Table 5-1 lifespan: 1.7 years), so the page must not say the debris re-entered within weeks.
  - SC-19 (5 vs 7 July 2005), Nudol (18 Nov vs 18 Oct 2015), DN-3 (19 vs 21 June 2022; the appendix also lists 15 April 2023).
- The Nudol apogees for 2015-16 carry a "?" in SWF, so those rows are low confidence. The 14 Jun 2019 Nudol row appears only in Table 16-2 and is also low confidence.
- DN-2's apogee is disputed (10,000 km claimed by China; nearly GEO per the US military; at least ~30,000 km per analysis cited by SWF).
- Several non-kinetic start dates are approximate or come from outside SWF (Ukraine 2014, North Korea Aug. 2010, Trident Juncture window, MIRACL day); each row note says so. The Iran/Eutelsat span (2009-2012) understates the Oct. 2022 episode SWF reports.
- The 2020s Chart B D/P split follows a graphical matrix in SWF that cannot be machine-checked; only the events behind the D entries are verified.
- Bot-blocked sites (UN Digital Library, treaties.unoda.org, ICAO, OUP) could not be fetched by script; their facts were checked through other sources, as `verification_log.md` states per row. One legal row (`itu-rrb-2024`) remains PARTIAL for that reason.

## 5. Builder decisions
1. **Table 5-1 used for all intercept altitudes and debris counts:** one consistent definition across tests. Other values are kept in notes and `conflicts`.
2. **Date conflicts:** where SWF's prose and appendix agree against one table, the prose/appendix date is used (DN-3, 21 June 2022). Otherwise the chapter table is used (Nudol 18 Nov 2015) and the alternative is disclosed.
3. **Iraq 2003 GPS jamming included** in Chart C but excluded from Chart B: Iraq is outside SWF's 13 countries.
4. **Iran/Eutelsat coded `multi_government`:** the ITU located the source in Iranian territory. The row note says this is not a finding of state responsibility.
5. **Attribution is never upgraded.** Levels follow the source's wording: `official_government`, `multi_government`, `researcher_osint`, `alleged`.
6. **Russia-Syria campaign starts in 2016, not 2017:** SWF p. 02-28 says the spoofing "began in 2016, peaked in 2017".
7. **All Nudol tests included.** The ledger lists every Nudol flight test in SWF Tables 2-4 and 16-2, including failures and rocket-only tests, typed `non_destructive` with no altitude when SWF reports none. Rows found in only one table are low confidence.
8. **Related-law chips:** Shakti (2019) is linked to UNGA 77/41 (`related_events` in `legal.json`), because that resolution is the multilateral response to DA-ASAT tests generally. The US moratorium (Apr. 2022) is a US pledge that post-dates the Indian test and is linked to Cosmos 1408.
9. **No co-orbital shadowing scene:** it was optional, and no co-orbital event is in the ledger (co-orbital appears in Chart B only).
10. **Laser scene shared:** one laser scene serves MIRACL (1997, fired at White Sands, NM, against the US satellite MSTI-3) and Peresvet (2018).
11. **Light theme follows the OS setting:** the page is dark by default but switches to light when the OS prefers light. The in-memory toggle overrides it.
12. **Lag panel pairs chosen by the builder** (8 pairs, each traced to ledger ids). An open ring means no binding rule has followed yet.
13. **Schema version and sidecar:** `data/schema.json` carries `schema_version` (1.0.0) and field descriptions. Metadata is kept out of `events.json` and `legal.json` so they stay plain arrays. Patch = rows or values corrected; minor = new optional fields; major = shape change.
14. **ICAO legal item label:** the item reads "ICAO: GNSS interference an 'infraction' of the Chicago Convention". SWF p. 02-30 says ICAO determined the interference "was indeed an infraction of the 1944 Convention", condemned it and called for fulfilment of obligations. ICAO's release says its Assembly endorsed its Council's determination that the incidents "constitute infractions" of the Convention. "Infraction" is the source's own word, so it is used in quotes. "Breaches" was dropped because it reads like an adjudicated violation; "findings" alone was dropped because it understates a determination plus a condemnation. The note states that this is an intergovernmental finding, not a court judgment.
15. **Full cites:** every event has `source_full` and every legal item has `citation` in Bluebook-style form, for use in the page's sources list. SWF is cited with its editors (Samson and Brett), edition and URL.
16. **Coastlines** come from Natural Earth via world-atlas (public domain), simplified and inlined (~48 KB). They are used in the static diagrams and as the globe's fallback.
17. **Rendering upgrades (code only):** atmosphere glow, fixed sun with terminator, starfield, soft particles, trails, explosions, pulsing laser beam, flickering jammed GNSS links.
18. **Scene PNG export** renders at 3000 px wide (capped by the GPU) and bakes in the labels, the "illustrative" banner, the caption and the source cite.

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
- Data checks: every event has `source_full`; every id in `related_events` exists; counts in the docs match `events.json` (44 kinetic, 15 non-kinetic, 19 legal).
- Source checks are logged in `verification_log.md`.

## 9. What this page does not claim
- **No completeness claim.** It is a ledger of events named in SWF 2026 (and a few named external sources), not a census of all counterspace activity. Classified, unreported and unattributed events are absent by construction.
- **No attribution beyond the source.** Jamming, spoofing and cyber rows carry the source's attribution level. A row is not a finding of state responsibility, and no legal item is a court judgment.
- **No prediction and no ranking of capability.** Chart B counts states that have demonstrated (D) or are developing (P) a capability. It does not compare their strength, intent or readiness.
- **No physical simulation.** The 3D scenes are illustrative: compressed radial scale, accelerated debris spread and simplified geometry. Only the numbers in the panels are data.
- **No causal link between tests and law.** "Related law" chips show chronology or a stated multilateral response, not that one caused the other.
- **No claim that EW and cyber are the only methods used in operations.** The page may say that destructive testing has paused and that jamming, spoofing, dazzling and cyber operations continue. It must not say those are the *only* counterspace tools used in operations, because SWF does not say so. The exact SWF passage is Executive Summary, p. xxiii (PDF p. 21): "only non-destructive capabilities are actively being used against satellites in current military operations." SWF's category is "non-destructive", not "EW and cyber", and it concerns use against satellites. Any page wording should attribute the finding to SWF and use its terms.
- **No SWF-assessed pre-2020s capability coding.** Earlier decades in Chart B are the builder's reconstruction and are labeled so.

## 10. Limitations
- **Single primary source.** Most rows rest on SWF 2026. Where SWF contradicts itself (section 4) the ledger states its rule and shows both values.
- **Scrambled table extraction.** Table 1-4 and Table 5-1 extract with mixed columns. Two cells are paired by column order and are marked PARTIAL in `verification_log.md` (the Solwind in-orbit cell and the 14 Jun 2019 Nudol note). Neither is a plotted value: bubble area uses cataloged fragments, and the Nudol row is plotted in the no-altitude strip.
- **Graphical capability matrix.** The 2020s D/P split in Chart B follows an SWF graphic that cannot be machine-checked. Only the events behind the D entries are verified.
- **Approximate dates and spans.** Some non-kinetic start dates are approximate or external (section 4). Year-only sources use 1 Jan or 31 Dec.
- **Bot-blocked primary pages.** Some URLs (ICAO, UNOOSA, ITU summary of decisions) cannot be fetched by script; the facts were checked through other sources, as listed in `verification_log.md`.
- **Snapshot in time.** As of 2026-09-28. Debris counts are as of Feb. 2026 and change as pieces decay. CSIS 2026 was not yet available.
- **Small numbers.** With 44 kinetic rows and 15 non-kinetic rows, decade counts are sensitive to single events; read the charts as illustration, not statistics.

## 11. Rebuild steps
1. Edit rows in `tools/build_data.py` (never the generated files).
2. `python3 tools/build_data.py` writes `data/events.json`, `data/legal.json`, `data/capabilities.json`, `data/schema.json` and `ledger.md`.
3. `python3 tools/build_page.py` rebuilds the page from `data/` and `src/`.
4. `node tools/qa.mjs` runs the QA checks and regenerates the SVG exports in `exports/` (light mode).

## 12. Quality process
The dataset and page were checked in two independent ways, and the results are kept in the repository.
1. **Independent verification (`verification_log.md`).** On 2026-09-28 every row (83 items) was re-checked against the pinned SWF page or a fetched primary source, not against the builder's own notes. The pass found and fixed 32 defects and leaves 9 items PARTIAL, each with an impact assessment. No row is marked VERIFIED on inference.
2. **Four independent grading rounds.** A reviewer with no part in the build inspected the built page, data and docs from scratch each time and wrote a scored report: `grading_report.md` (round 1, 76/100), `grading_report_round2.md` (86), `grading_report_round3.md` (90) and `grading_report_round4.md` (92). Each report lists defects by portion of the page; these were fixed before the next round. Round 4 found no factual error in 10+ spot checks against the SWF text, and its one wording risk (the absolute claim on EW and cyber, section 9) is recorded above.
3. **Automated checks.** `tools/qa.mjs` and the data checks in section 8 run on each rebuild; doc counts are generated from the data by `tools/build_data.py`, so `ledger.md` cannot drift from `events.json`.
