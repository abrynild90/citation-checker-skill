# Counterspace Ledger: Verification History

*Archive. Superseded layers of the log, kept for the record (passes of 2026-09-28 and 2026-09-29, with full-length evidence). Counts and states below are historical and may differ from the current state, which is in `verification_log.md` (generated, as of the ledger date). Do not cite this file for current counts.*


## Current state (as of 2026-09-29)

| | |
|---|---|
| **Scope** | 100 items: 61 kinetic and 15 non-kinetic rows in `data/events.json`, 19 rows in `data/legal.json`, 5 capability categories in `data/capabilities.json`. |
| **Status** | Every item VERIFIED or CORRECTED except 2 PARTIAL (the `direct_ascent` and `co_orbital` capability categories; see [Open items](#open-items-and-impact)). None UNCHECKED. 41 discrepancies found and fixed. |
| **Automated** | `python3 tools/build_data.py` runs `validate()` (ids, enums, dates, source fields, id resolution, fragment counts, methodology row counts) and stops on failure. |
| **Method** | Each row checked against the pinned SWF page (tables read with pdfplumber) or a fetched primary source ([Method](#method)). |

**Table 1-4 completeness check (2026-09-29).** SWF Table 1-4 (PDF 72-73) has 33 rows. Before this check the ledger held 17 of them. Now 32 are ledger rows; the 33rd, the US Delta 180 intercept of 5 Sep 1986, is co-orbital (SWF text, Delta 180 section; Table 5-1 lists it as Co-orbital) and is excluded by the scope rule. Rows added: High Virgo (22 Sep 1959), SIP (1 Oct 1961, 5 May 1962), HiHo (5 Oct 1961, 26 Mar 1962, 26 Aug 1962), Nike Zeus (21 Mar, 19 Apr, 24 May 1963; Mar. 1965; Jun.-Jul. 1965; 13 Jan 1966), ASM-135 (13 Nov 1984, 22 Aug 1986, 29 Sep 1986). Other countries: Russia Tables 2-4 and 16-2 (all Nudol rows now in; Table 16-2 "April 2021" added; co-orbital entries excluded), China Tables 3-3 and 16-3 (all in; Table 16-3's 15 Apr 2023 is treated as a date variant of 14 Apr 2023, recorded in that row's conflicts), India Tables 4-1 and 16-4 (12 Feb 2019 failed test added). Scope rule: all SWF-listed DA-ASAT tests are included; co-orbital tests are not.

**Solwind in-orbit cell (resolved).** Table 5-1 (PDF 212), pdfplumber: Solwind / 530 km / 285 tracked / 0 on orbit / 18.7 years. The zero is verified; all Solwind fragments have decayed per SWF. Earlier entries that said "could not be tied" are superseded (Discrepancy 40).

**Changes in the 2026-09-29 pass** (Discrepancies 36-41): 17 rows added; Bold Orion note fixed; Nudol 15 Apr 2020 conflict recorded; `mideast-2023-gnss` recoded to Israel/IDF/jamming and its "others" dropped; Peresvet marked a capability announcement; LTBT context sourced to the Office of the Historian; Starfish adds SWF p. 12-05; validation added.

## History (earlier passes, kept for the record)

| | |
|---|---|
| **2026-09-28** | Second full pass (supersedes the first log of the day): 83 items, 35 defects. Later the same day, UN document mirrors were used for PAROS 36/97 and the two PPWT documents, and a follow-up corrected three more items (Discrepancies 33-35). Counts below in [Executive summary](#executive-summary) and [Results by category](#results-by-category) are as of that pass (44 kinetic rows), before the 2026-09-29 additions. |

## Contents

1. [Executive summary](#executive-summary)
2. [Method](#method)
3. [Results by category](#results-by-category)
4. [Open items and impact](#open-items-and-impact)
5. [Closed items from the earlier log](#closed-items-from-the-earlier-log)
6. [Discrepancies found and fixed](#discrepancies-found-and-fixed)
7. [Kinetic rows](#eventsjson-kinetic-rows)
8. [Non-kinetic rows](#eventsjson-non-kinetic-rows)
9. [Legal rows](#legaljson)
10. [Capability categories](#capabilitiesjson)

## Executive summary (2026-09-28 pass; current state is at the top)

- **Outcome:** every event, legal item and capability category was checked; none is UNCHECKED. 81 of 83 items are VERIFIED or CORRECTED (defect fixed, then verified); 2 are PARTIAL.
- **Defects:** 35 discrepancies were found and fixed in `tools/build_data.py`. No factual error in a plotted value is known.
- **Open items:** 2 PARTIAL items remain, the `direct_ascent` and `co_orbital` capability categories, where the builder's 2020s "developing" (P) entries go beyond what SWF's country matrix shows (details under [Open items and impact](#open-items-and-impact)). Neither changes an event, a date or a plotted altitude or fragment count.
- **Final pass (grading round 6 follow-up):** seven of the nine earlier PARTIAL items were resolved. The SWF PDF was re-read with a layout-aware extractor (pdfplumber 0.11), which recovers Table 5-1 and Table 16-2 cell by cell and reads the capability matrix (Executive Summary, PDF pp. 22-32) from its vector shapes. The ITU summary of decisions was found at `itu.int/dms_pub/itu-r/md/24/rrb24.2/c/R24-RRB24.2-C-0012!!PDF-E.pdf`. Earlier the same day, `ppwt-2008`, `ppwt-2014` and `paros-1981` had moved from PARTIAL to VERIFIED against the UN documents, and the page lede was closed ([Closed items](#closed-items-from-the-earlier-log)).
- **Bot-blocked sources:** ICAO, UNOOSA and some ITU pages block scripts; facts were checked through search snippets or UN mirrors, as recorded per row.

## Method

1. **SWF rows.** The SWF 2026 text extraction (`swf_2026.txt`, split by `=====PAGE N=====`) was searched programmatically and read by hand. Each row's date, value and pin was checked against the text of the pinned PDF page. The printed section-page (for example `02-36`) was mapped to the PDF page by reading the page-footer label, and every pinned pair was confirmed (e.g. PDF 72 = 01-23, PDF 149 = 02-36).
2. **Table 1-4 and Table 5-1 extract with scrambled columns.** Row membership was confirmed by the date and value strings on the page. The cells that plain-text extraction could not pair (Solwind and Burnt Frost "still on orbit", the 14 Jun 2019 Nudol note) were re-read with pdfplumber, which returns the table as rows and columns; both are now resolved.
3. **Non-SWF rows and legal rows.** Sources were fetched with WebFetch or curl, or located with WebSearch. Where a site blocks bots (HTTP 202 challenge, 403), alternative mirrors were tried (`documents.un.org` symbol access, `undocs.org`); if none worked the URL is listed as *bot-blocked* and the fact was checked through a search-index snippet or another source instead. No row is marked VERIFIED on inference, on "consistent with" reasoning, or on a neighboring row.
4. **URL checks.** Every distinct `source_url` was requested with curl (follow redirects, browser user agent) and its landing page inspected, not just its status code.

**Status vocabulary.** VERIFIED: the pinned page or fetched source shows the value (short quote given). VERIFIED (external): checked against a named non-SWF source. PARTIAL: core fields verified; the named field was not isolable or comes from outside the pin. CORRECTED: a defect was found in this pass and fixed in `build_data.py`. UNCHECKED: not re-checked in this pass (no row currently carries it).

## Results by category

| Set | Rows | VERIFIED | VERIFIED (external) | PARTIAL | CORRECTED (defect fixed, then verified) |
|---|---|---|---|---|---|
| Kinetic events | 44 | 35 | 1 | 0 | 8 |
| Non-kinetic events | 15 | 4 | 2 | 0 | 9 |
| Legal items | 19 | 7 | 7 | 0 | 5 |
| Capability categories | 5 | 3 | 0 | 2 | 0 |
| **Total** | **83** | **49** | **10** | **2** | **22** |

Each row is counted once, under its most significant status. Status definitions are in [Method](#method). The two PARTIAL items are the `direct_ascent` and `co_orbital` capability categories.

## Open items and impact

Two items remain PARTIAL. Both concern the 2020s "developing" (P) coding in Chart B, checked this pass against SWF's own country matrix (Executive Summary, PDF pp. 22-32, read from the PDF's vector shapes). The matrix has seven rows (LEO and MEO/GEO direct-ascent, LEO and MEO/GEO co-orbital, directed energy, electronic warfare, space situational awareness) and four columns (R&D, testing, operational, use in conflict). It has no cyber row.

| Item | Exactly what is unverified | Impact assessment |
|---|---|---|
| `direct_ascent` | Demonstrated (D) entries for the US, China, Russia and India match the matrix (testing "significant" or "some"). Of the 2020s P entries, Israel, Japan and Germany match ("uncertain" R&D). South Korea, Iran, North Korea and France show "no data" in the matrix, so their P entries rest on the builder's reading of the country chapters, not on the matrix. | Chart B's 2020s direct-ascent count includes those four P states. No event, date or altitude depends on them. The chart already labels earlier decades as reconstruction; the 2020s P entries above are the builder's judgment and should be read that way. |
| `co_orbital` | D entries for Russia, the US and China match the matrix. Of the P entries, France ("some" R&D) and Germany ("uncertain") match; India, Iran, Israel, Japan, North Korea and the UK show "no data" in the matrix. | Same as above: six P states in the 2020s co-orbital count are the builder's judgment. No plotted event depends on them. |

Recommended follow-up for the page owner: either drop the unsupported P states from `CAP` in `tools/build_data.py` (then rebuild the data and the page), or label them on the chart as builder-assessed. This log does not change the data, because the page must be rebuilt together with it.

## Closed items from the earlier log

| Earlier item | Status |
|---|---|
| `iq-2003-gps` wrong `source_url` (Rumsfeld/Myers page) | **Closed.** `data/events.json` now carries `https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm`. Re-fetched: Maj. Gen. Renuart, Mar. 25, 2003: "We have destroyed all six of those jammers." |
| `us-1962-starfish-prime` dead `source_url` | **Closed.** `data/events.json` carries `https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf` (HTTP 200). The PDF was downloaded and read: table row "Starfish Prime ... 250 miles ... 07/09/1962 ... Johnston Island area" and "250 miles ... 1.4 Mt" (PDF pp. 41-42). |
| Page lede wording (`src/template.html`): an earlier lede said non-kinetic methods "are the only counterspace tools used in actual military operations", which SWF does not say | **Closed.** The lede now quotes SWF 2026, Executive Summary, p. xxiii (PDF p. 21) verbatim: "only non-destructive capabilities are actively being used against satellites in current military operations." The examples of non-destructive methods (jamming, spoofing, dazzling, cyber) sit in the page's own sentence before the quotation and are not attributed to SWF. Rule recorded in `methodology.md` section 9. |
| Earlier "VERIFIED by consistency" rows (cn-2005, cn-2006, cn-2010, DN series, Nudol series, capabilities, several legal rows) | **Reopened and re-verified below** with page pins and quotes, or downgraded. |

## Discrepancies found and fixed

All 35 were corrected in `tools/build_data.py`.

| # | Row | Defect | Fix |
|---|---|---|---|
| 1 | `ru-2018-peresvet` | Pin said p. 02-35 (PDF 148). The Peresvet section is on **p. 02-36 (PDF 149)**. | Pin corrected. |
| 2 | `us-2008-burnt-frost` | Missing SWF's decay fact and altitude conflict. SWF p. 01-24: "took about 20 months to de-orbit entirely"; Table 5-1 lifespan 1.7 years. Prose says **240 km**; Table 5-1 says **220 km**. | Both added to the note and a `conflicts` field; pins name prose and tables. |
| 3 | `ru-2022-viasat` | "About an hour before the invasion" is not SWF's main wording. p. 15-06: "Within hours of Russian troops crossing the border." The one-hour figure is on p. 15-07, attributed to independent analysts. | Effect text and note now give both. |
| 4 | `us-1959-bold-orion` | Note said "Air-launched from B-47". Not in SWF. | Removed; note now quotes Table 1-4. |
| 5 | `us-1964-p437-feb` | Note said "test unarmed". Not in SWF (p. 01-21 says only that Program 437 used a 1.4 Mt W49). | Reworded to what SWF says. |
| 6 | `cn-2014-dn2` | Note said "US State Department called it a non-destructive ASAT test". Not in SWF. | Removed; the `non_destructive` type is described as the builder's coding. |
| 7 | `in-2019-shakti` | Note said pieces "were tracked above the ISS". Not in SWF. SWF p. 04-04: final trackable piece re-entered June 2022 (3.2 years); some pieces thrown to 2,250 km. | Replaced; pin now includes p. 04-04. |
| 8 | `cn-2022-dn3` | Date used 19 June (Table 3-3). SWF prose p. 03-21 and Table 16-3 both give 21 June. | Date set to 2022-06-21; conflict recorded. |
| 9 | `cn-2023-dn3` | Appendix Table 16-3 lists both 14 and 15 April 2023. Not disclosed. | Added to note. |
| 10 | `us-1985-solwind` | Prose (p. 01-22) also says 555 km; only Table 1-4 was cited. Zero "still on orbit" cell not isolable by plain-text extraction. | Pin and note extended; cell later read with pdfplumber (VERIFIED). |
| 11 | `ru-2018-trident` | Note said "Norway and Finland both raised it". SWF names no exercise and no dates; only Norway's government made a claim. | Note rewritten; dates marked external. |
| 12 | `ir-2009-eutelsat` | Note said ITU "asked" Iran; SWF says "ordered". Span (2009-2012) understates the Oct. 2022 episode SWF reports. | Wording and note corrected; span left, disclosed. |
| 13 | `kp-2010-gps` | Start 1 Aug 2010 was not sourced. First public incident: 23 Aug 2010 (GPS World, Inside GNSS). | Start set to 2010-08-23. |
| 14 | `ru-2014-ukraine` | The 2014 start is not on the SWF pages cited. | External source named in the note. |
| 15 | `ru-2022-starlink` | "Claimed by SpaceX" was loose. SWF: Musk claimed the jamming. | Wording fixed; pin narrowed to p. 02-32. |
| 16 | Legal `abm-1972` | URL returned HTTP 200 with a "Technical Difficulties" page, not the treaty. | Replaced by the Arms Control Association ABM fact sheet. |
| 17 | Legal `cd-paros-committee` | URL was 404. Dates 1985-01-01/1994-12-31 were loose. | UNIDIR paper (read): established 29 Mar 1985, last meeting 23 Aug 1994. |
| 18 | Legal `woomera-2024` | URL redirected to an unrelated Adelaide Law Review page. Editors listed as "Beard et al." | OUP product page; editors Beard and Stephens. |
| 19 | Legal `unga-77-41` | DL record 3996915 could not be tied to the resolution. | Record 3997622, whose title and text search confirmed. |
| 20 | Legal `itu-1992` | Quote "complete freedom" is wrong. Art. 48 reads "entire freedom". | Fixed; UNTS pin 361-62. |
| 21 | Legal `icao-2025` | Cited only through SWF; also condemned the DPRK. Date 2025-10-01 was loose. | Primary ICAO release cited (dated 3 Oct 2025; SWF pp. 02-30, 12-06). |
| 22 | Legal `itu-rrb-2025` | Generic RRB URL; date 2025-11-01. | 100th meeting 10-14 Nov 2025 (SWF fn. 245); dated 2025-11-10; ITU RNSS page. |
| 23 | Legal `paros-1981`, `ppwt-2008` | DL records 28200 and 622364 could not be tied to the documents (bot-blocked). | UNOOSA text of 36/97 C; DL record 633470 (letter of 12 Feb 2008 transmitting CD/1839). Later replaced by direct `documents.un.org` links for CD/1839 and CD/1985. |
| 24 | Legal `milamos-2022` | Year-only date. | Published July 2022; start 2022-07-01. |
| 25 | Legal `us-moratorium-2022` | Note listed follower states not in the cited sources. | Removed; SWF's "38 countries total" retained. |
| 26 | All SWF pins | Pins named page numbers only. | Each now names the table or passage. |
| 27 | Earlier log | Claimed `us-1967-p437-mar` and `us-1968-p437-may` sit on p. 01-24. They are on **p. 01-23 (PDF 72)**, as the ledger pins them. | Log corrected. |
| 28 | `ru-2014-nudol`, `ru-2015-nudol-apr` (added) | Omitted Nudol tests. SWF Table 2-4 (p. 02-21, PDF 134): "Aug. 12, 2014 ... Failed shortly after launch"; "Apr. 22, 2015 ... Failed at launch". Table 16-2 (p. 16-03, PDF 307) lists both dates with "Rocket test (unsuccessful)". | Rows added, medium confidence, no apogee; both tables pinned. |
| 29 | `ru-2019-nudol-nov` (added) | Omitted; the first draft of the row said "no intercept (SWF Table 2-4)". Table 2-4 gives the date and payload "Likely KKV" but the notes cell is "-" (column-order reading), so "no intercept" was not shown by that table. | Row added; note now rests on p. 02-21, which calls Nov. 2021 the "first known intercept test of the Nudol". |
| 30 | `ru-2019-nudol-jun` (added) | Omitted. Only Table 16-2 lists "June 14, 2019 ... Nudol"; the note "Potential KKV, no intercept" could not be paired to it by plain-text extraction (two such notes follow the Dec. 2018 and June 2019 rows). | Row added, low confidence; pairing later confirmed with pdfplumber (VERIFIED). |
| 31 | Legal `icao-2025` | Label "breaches Chicago Convention" overstated the finding. SWF p. 02-30: the ICAO "passed a resolution determining that the GNSS interference originating in Russia was indeed an infraction of the 1944 Convention on International Civil Aviation, condemned it ... and called for it to fulfill its obligations" (p. 12-06 says the same for North Korea). The ICAO release (through a search snippet; the page is bot-blocked) says the Assembly "endorsed the determination of its governing Council that recurring incidents of GNSS RFI originating from the DPRK and the territory of the Russian Federation constitute infractions" of the Convention, and condemned both. | Label is now "ICAO: GNSS interference an 'infraction' of the Chicago Convention" (ICAO's own word, in quotes; not "breach", not merely "findings"). The note says it is an intergovernmental finding, not a court judgment. Recorded as decision 14 in `methodology.md`. |
| 32 | Legal `itu-rrb-2024` | Citation gave only the issue date. | The 96th RRB meeting was 24-28 June 2024 (ITU agenda and minutes pages); the summary was issued 1 July 2024. Citation now gives both. |
| 33 | `ru-2024-eu-sats` | Coded `official_government` on the ground that the ITU RRB "is a governmental body". The ledger's own rule gives intergovernmental findings (ITU, ICAO) `multi_government`, as for `ir-2009-eutelsat`. The RRB located earth stations; it made no state-responsibility finding. | Recoded `multi_government`; note reworded. Chart C fill is unchanged (both levels draw solid). |
| 34 | `cn-2023-dn3` | The 14 vs 14-and-15 April 2023 discrepancy (Discrepancy 9) was in the note but not in the row's `conflicts` field, so `ledger.md` listed 7 conflicts, not 8. | `conflicts` entry added; the ledger's conflicts table now has 8 rows. |
| 35 (superseded for Solwind by 40) | `us-1985-solwind`, `ru-2016-syria`, `in-2019-shakti`, `cn-2013-dn2` (notes) | Solwind: the note said the zero in-orbit figure "reflects the debris having decayed", an inference. Syria: the note referred to "an earlier draft". Shakti: the note discussed an unsourced 400-piece estimate. DN-2: the conflict entry gave "~36,000 km" for the US military, whose words were "nearly to GEO". | Solwind note (at that time) said the cell was not tied to its row; this was resolved in Discrepancy 40 (verified 0); the process language and the unsourced estimate are removed; the DN-2 entry quotes "nearly to GEO" (GEO is 35,786 km). |
| 36 | Kinetic scope: US Table 1-4 | Round-8 review: the ledger silently omitted 15 US Table 1-4 rows (High Virgo, SIP, HiHo x3, Nike Zeus 21 Mar/19 Apr/24 May 1963, Mar. 1965, Jun.-Jul. 1965, 13 Jan 1966, ASM-135 13 Nov 1984, 22 Aug 1986, 29 Sep 1986); also Russia's Apr. 2021 Table 16-2 line and India's 12 Feb 2019 failed test (Tables 4-1, 16-4). | 17 rows added; scope rule recorded (methodology section 3, ledger.md, schema.json). See the completeness check above. |
| 37 | `us-1959-bold-orion` (note) | Note paired "Unknown results due to loss of telemetry" with Bold Orion; pdfplumber shows that cell belongs to the High Virgo row above it (plain-text column scramble). | Note corrected. |
| 38 | `ru-2020-nudol-apr` | Table 16-2 says "Potential intercept, debris created"; Table 2-4 says "Successful, nothing hit". Only Table 2-4 was cited. | Both pinned; conflict recorded; no fragment count coded (none given). |
| 39 | `ru-2018-peresvet`, `mideast-2023-gnss` (attribution) | Peresvet's `official_government` is the government's own announcement of a system, not an attributed act. `mideast-2023-gnss` was `official_government` with actor "Israel and others", stronger than SWF p. 10-02, which says open sources cannot tell whether Israel, Hamas or others conduct the EW; only the IDF statement (jamming) supports a level, only for Israel. | Peresvet: effect and note say capability announcement, self-declared. Mideast: recoded to Israel (IDF), `gnss_jamming`, `official_government`; "others" dropped (no source allegation); start moved from 1 Oct to 7 Oct 2023 (SWF: escalation after the 7 Oct attack). |
| 40 | `us-1985-solwind` (in-orbit cell) | Contradiction: the log said the Solwind zero was verified with pdfplumber, while the row note and ledger endnote said the cell "could not be tied to this row". | Re-read 2026-09-29, PDF 212 table row: "Sep. 13, 1985 / US / ASM-135 / Direct-Ascent / Solwind / 530 km / 285 / 0 / 18.7 years". The zero is verified: no Solwind piece remains on orbit. Row note and ledger endnote updated. |
| 41 | `ltbt-1963` (legal note), `us-1962-starfish-prime` (source) | The note's "fallout concerns and the Cuban Missile Crisis" had no source. Starfish satellite damage was cited to DOE/NV-209, which does not say that. | Context sourced to Office of the Historian, U.S. Dep't of State (history.state.gov/milestones/1961-1968/limited-ban; fetched 2026-09-29: the crisis "provided the impetus for an agreement"; worldwide concern about radioactive fallout), cite added to the citation; "followed" wording kept. Starfish `source_full` now also cites SWF p. 12-05 (PDF 269), verified: such tests "damaged or destroyed satellites in orbit". Shakti pin: 45-day statement is on p. 04-04 (PDF 204) in the data; the page cite (p. 04-03) is a page-side fix. |

**Scope disclosure (earlier pass).** SWF Appendix Table 16-2 also lists Cosmos 2521 (Burevestnik?) on 30 Oct 2017 and a "September 2019?" co-orbital entry. These are co-orbital or RPO events, not direct-ascent tests, and are outside the ledger's kinetic scope (see `methodology.md`, coding rules). After the additions, every Nudol row in Tables 2-4 and 16-2 is in the ledger (Aug 2014, Apr 2015, Nov 2015, May 2016, Dec 2016, Mar 2018, Dec 2018, Jun 2019, Nov 2019, Apr 2020, Dec 2020, Nov 2021).

## events.json: kinetic rows

Quotes are from the pinned page unless noted. "T1-4" = Table 1-4, "T5-1" = Table 5-1.

| id | status | pin checked | evidence |
|---|---|---|---|
| us-1959-bold-orion | CORRECTED (Disc. 37) | T1-4, p. 01-23 (PDF 72) | pdfplumber row: "Oct. 13, 1959 / Bold Orion / Unknown / Explorer VI / 200 km / Success (passed within kill radius)" |
| us-1962-starfish-prime | VERIFIED (external) | DOE/NV-209 PDF pp. 41-42; SWF p. 12-05 | "07/09/1962 ... Johnston Island area"; "250 miles"; "1.4 Mt". SWF 12-05: tests "damaged or destroyed satellites". |
| us-1962-nike-zeus-wsmr | VERIFIED | T1-4, p. 01-23 | "Dec. 17, 1962 ... WSMR ... 160 km" |
| us-1963-nike-zeus-feb | VERIFIED | T1-4, p. 01-23 | "Feb. 15, 1963 ... Kwajalein ... 241 km" |
| us-1964-nike-zeus-jan | VERIFIED | T1-4, p. 01-23 | "Jan. 4, 1964 ... 146 km"; note "intercept of a simulated satellite target" |
| us-1964-p437-feb | CORRECTED | T1-4, p. 01-23 | "Feb. 14, 1964 ... Transit 2A Rocket Body 1000 km"; W49 at p. 01-21 |
| us-1964-p437-mar | VERIFIED | T1-4, p. 01-23 | "Mar. 1, 1964 ... 674 km"; "backup missile passed within kill radius" |
| us-1964-p437-apr | VERIFIED | T1-4, p. 01-23 | "Apr. 21, 1964 ... 778 km" |
| us-1964-p437-may | VERIFIED | T1-4, p. 01-23 | "May 28, 1964 ... 932 km"; "Failed (missed intercept point)" |
| us-1964-p437-nov | VERIFIED | T1-4, p. 01-23 | "Nov. 16, 1964 ... 1,148 km"; "Successful Combat Test Launch" |
| us-1965-p437-apr | VERIFIED | T1-4, p. 01-23 | "Apr. 5, 1965 ... Transit 2A Rocket Body 826 km" |
| us-1967-p437-mar | VERIFIED | T1-4, p. 01-23 | "Mar. 30, 1967 ... 484 km ... Unknown piece of space debris" |
| us-1968-p437-may | VERIFIED | T1-4, p. 01-23 | "May 15, 1968 ... 823 km" |
| us-1968-p437-nov | VERIFIED | T1-4, p. 01-24 (PDF 73) | "Nov. 21, 1968 ... 1,158 km" |
| us-1970-p437-mar | VERIFIED | T1-4, p. 01-24 | "Mar. 28, 1970 ... Unknown satellite 1,074 km" |
| us-1984-asm135-jan | VERIFIED | T1-4, p. 01-24 | "Jan. 21, 1984 ASM-135 Aircraft None 1,000 km" |
| us-1985-solwind | VERIFIED | T5-1 p. 05-01 (PDF 212); prose p. 01-22; T1-4 p. 01-24 | pdfplumber row: "Sep. 13, 1985 / US / ASM-135 / Direct-Ascent / Solwind / 530 km / 285 / 0 / 18.7 years" (tracked 285, still on orbit 0). Prose and T1-4 say 555 km. The same table gives USA 193: "220 km / 175 / 0 / 1.7 years", so Burnt Frost's zero in-orbit count is also confirmed. |
| us-2008-burnt-frost | CORRECTED | T5-1; prose and T1-4 p. 01-24 | T5-1 "USA 193 220 km 175"; prose "at an altitude of 240 km"; "took about 20 months to de-orbit entirely"; T1-4 "2,700 km". T5-1 "0 0 ... 1.7 years" supports 0 in orbit (cell pairing inferred from column order, so treat as strong but not certain). |
| cn-2005-sc19 | VERIFIED | Table 16-3, p. 16-04 (PDF 308); T3-3 p. 03-22 | T16-3 "July 5, 2005 SC-19 ... Likely rocket test"; T3-3 "July 7, 2005" |
| cn-2006-sc19 | VERIFIED | Table 16-3, p. 16-04; T3-3 p. 03-22 | "Feb. 6, 2006 SC-19 ... Likely near-miss of orbital target" |
| cn-2007-fy1c | VERIFIED | T5-1 p. 05-01; T3-3 p. 03-22 | T5-1 "SC-19 ... FY-1C 880 km 3532 2351 19.1 years"; T3-3 "865 km", "3533 pieces" |
| cn-2010-midcourse | VERIFIED | T3-3, p. 03-22 | "Jan. 11, 2010 ... CSS-X-11 ... 250 km ... Destruction of suborbital target" |
| cn-2013-midcourse | VERIFIED | T3-3, p. 03-22 | "Jan. 27, 2013 Possible SC-19 ... Suborbital" |
| cn-2013-dn2 | VERIFIED | Prose p. 03-20 (PDF 181); T3-3 | "CAS claimed the rocket reached 10,000 km"; "nearly to GEO"; "at least 30,000 km"; T3-3 "~30,000 km" |
| cn-2014-dn2 | CORRECTED | T3-3, p. 03-22 | "July 23, 2014 Possible DN-2 ... Likely intercept test" |
| cn-2015-dn3 | VERIFIED | T3-3, p. 03-22 | "Oct. 30, 2015 Possible DN-3 ... Likely rocket test" |
| cn-2017-dn3 | VERIFIED | T3-3, p. 03-22 | "July 23, 2017 ... Suborbital, malfunctioned" |
| cn-2018-dn3 | VERIFIED | T3-3, p. 03-22 | "Feb. 5, 2018 ... CSS-5" (target from T16-3) |
| cn-2021-dn3 | CORRECTED | T3-3 p. 03-22; prose p. 03-21 | Prose: announced "land-based midcourse missile intercept technology test" on Feb. 4, 2021 |
| cn-2022-dn3 | CORRECTED | prose p. 03-21; T16-3 p. 16-04; T3-3 | Prose and T16-3 "21 June 2022"; T3-3 "Jun. 19, 2022" |
| cn-2023-dn3 | CORRECTED | prose p. 03-21; T3-3 | "April 14, 2023"; T16-3 also lists Apr. 15 |
| ru-2014-nudol | VERIFIED | T2-4, p. 02-21 (PDF 134); T16-2 p. 16-03 (PDF 307) | T2-4 "Aug. 12, 2014 ... Failed shortly after launch."; T16-2 "Aug. 12, 2014 ... Rocket test (unsuccessful)" |
| ru-2015-nudol-apr | VERIFIED | T2-4, p. 02-21; T16-2 p. 16-03 | T2-4 "Apr. 22, 2015 ... Failed at launch."; T16-2 "Apr. 22, 2015 ... Rocket test (unsuccessful)" |
| ru-2015-nudol | VERIFIED | Table 2-4, p. 02-21 (PDF 134); T16-2 p. 16-03 | T2-4 "Nov. 18, 2015 ... 200 km? First successful test of missile"; T16-2 "Oct. 18, 2015" |
| ru-2016-nudol-may | VERIFIED | T2-4, p. 02-21 | "May 25, 2016 ... 100 km? ... likely rocket test" |
| ru-2016-nudol-dec | VERIFIED | T2-4, p. 02-21 | "Dec. 16, 2016 ... 100 km?" |
| ru-2019-nudol-jun | VERIFIED | T16-2, p. 16-03 (PDF 307) | pdfplumber row: "June 14, 2019 / Nudol / Direct-Ascent / Plesetsk / None / Potential KKV, no intercept". Not in T2-4. Coded low confidence because only one SWF table lists it. |
| ru-2019-nudol-nov | CORRECTED | T2-4, p. 02-21; prose p. 02-21 | "Nov. 15, 2019 ... Nudol ... Plesetsk ... Likely KKV"; "first known intercept test of the Nudol" (Nov. 2021). "No intercept" removed from the T2-4 attribution (Discrepancy 29). Not in T16-2. |
| ru-2018-nudol-mar | VERIFIED | T2-4, p. 02-21 | "Mar. 26, 2018 ... Likely KKV"; "First test from a mobile launcher" |
| ru-2018-nudol-dec | VERIFIED | T2-4; T16-2 | "Dec. 23, 2018 ... Likely KKV"; T16-2 "Potential KKV, no intercept" |
| ru-2020-nudol-apr | CORRECTED (Disc. 38) | T2-4; fn. 148 p. 02-20 | "Apr. 15, 2020 ... Likely KKV"; "Successful, nothing hit"; USSPACECOM release cited |
| ru-2020-nudol-dec | VERIFIED | T2-4; fn. 149 p. 02-20 | "Dec. 16, 2020"; USSPACECOM release cited |
| in-2019-shakti | CORRECTED | T5-1 p. 05-01; prose p. 04-04 (PDF 204) | T5-1 "PDV-MK II ... Microsat-R 300 km 130"; "within 45 days at most"; "final piece ... June 2022" |
| ru-2021-cosmos1408 | VERIFIED | T5-1 p. 05-01; prose p. 02-21 (PDF 134) | T5-1 "Nudol ... Cosmos 1408 470 km 1807 5"; "more than 1,800 pieces ... 5 still in orbit" |
| **Added 2026-09-29 (Table 1-4 completeness; all read with pdfplumber, PDF 72-73)** | | | |
| us-1959-high-virgo | VERIFIED | T1-4 p. 01-23 | "Sept. 22, 1959 / High Virgo (TX-20) / Unknown / None / 12 km / Unknown results due to loss of telemetry" |
| us-1961-sip-oct | VERIFIED | T1-4 p. 01-23 | "Oct. 1, 1961 / SIP (NOTS-EV-2) / San Nicolas Island / None / Unknown / Successful rocket test" |
| us-1961-hiho-oct | VERIFIED | T1-4 p. 01-23 | "Oct. 5, 1961 / HiHo (NOTS-EV-1) / F4D-I / None / Unknown / Rocket failure" |
| us-1962-hiho-mar | VERIFIED | T1-4 p. 01-23 | "Mar. 26, 1962 / HiHo / F4D-I / None / Unknown / Rocket failure" |
| us-1962-sip-may | VERIFIED | T1-4 p. 01-23 | "May 5, 1962 / SIP / F4-C / None / Unknown / Successful rocket test" |
| us-1962-hiho-aug | VERIFIED | T1-4 p. 01-23 | "Aug. 26, 1962 / HiHo / F4-C / None / 1,600 km / Successful rocket test" |
| us-1963-nike-zeus-mar | VERIFIED | T1-4 p. 01-23 | "Mar. 21, 1963 / Program 505 / Kwajalein / None / - / Unsuccessful attempt to intercept simulated satellite target" |
| us-1963-nike-zeus-apr | VERIFIED | T1-4 p. 01-23 | "Apr. 19, 1963 ... Unsuccessful attempt to intercept simulated satellite target" |
| us-1963-nike-zeus-may | VERIFIED | T1-4 p. 01-23 | "May 24, 1963 / Program 505 / Kwajalein / Agena D / Unknown / Successful close intercept" |
| us-1965-nike-zeus-mar | VERIFIED | T1-4 p. 01-23 | "Mar. 1965 / Program 505 / Kwajalein / None / - / -" (month only) |
| us-1965-nike-zeus-jun | VERIFIED | T1-4 p. 01-23 | "Jun. - Jul., 1965 / ... Unknown / Four test intercepts, of which three were successful" (month range; one row) |
| us-1966-nike-zeus-jan | VERIFIED | T1-4 p. 01-23 | "Jan. 13, 1966 / Program 505 / Kwajalein / None / Unknown / Successful intercept with simulated target" |
| us-1984-asm135-nov | VERIFIED | T1-4 p. 01-24; fn. 177 p. 01-22 | "Nov. 13, 1984 / ASM-135 / Aircraft / Star / 1,000 km / Failed test"; fn. 177: "failed missile test directing MHV at a star on November 13, 1984" |
| us-1986-asm135-aug | VERIFIED | T1-4 p. 01-24; fn. 177 | "Aug. 22, 1986 / ASM-135 / Star / 1,000 km / Successful test in tracking" |
| us-1986-asm135-sep | VERIFIED | T1-4 p. 01-24; fn. 177 | "Sept. 29, 1986 / ASM-135 / Star / 1,000 km / Successful test in tracking" |
| ru-2021-nudol-apr | VERIFIED | T16-2 p. 16-03 (PDF 307) | "April 2021 / Nudol / Direct-Ascent / Plesetsk / None / Unknown" (month only; low confidence) |
| in-2019-shakti-feb | VERIFIED | T4-1 p. 04-04 (PDF 204); T16-4 p. 16-04 (PDF 308) | "Feb. 12, 2019 / PDV-MK II / Microsat-R / Suborbital / Booster failed within 30 seconds, no intercept. Failed."; T16-4: "Unsuccessful intercept"; text: anonymous US government sources (The Diplomat) |

## events.json: non-kinetic rows

| id | status | pin checked | evidence |
|---|---|---|---|
| us-1997-miracl | CORRECTED | p. 01-35 (PDF 84) | "MIRACL was fired against an orbiting satellite in October 1997"; Cohen "fully consistent" with US policy. Day 17 Oct and White Sands from FlightGlobal / ACA (external); SWF fn. 259 cites the WSMR laser test facility. |
| ir-2003-telstar12 | VERIFIED | p. 09-05 (PDF 247) | "Iran has been accused"; "started in 2003"; "Bulgaria and Libya in 2005/2006" |
| iq-2003-gps | VERIFIED (external) | CENTCOM/AFPS briefing, 25 Mar 2003 | "We have destroyed all six of those jammers"; not in SWF (Iraq outside its 13 countries) |
| cn-2006-laser | VERIFIED | p. 03-26 (PDF 187) | "cited anonymous US defense officials"; "no US satellites were materially" damaged |
| ir-2009-eutelsat | CORRECTED | p. 09-06 (PDF 248) | "ITU ordered Iran to assist in stopping the jamming"; "Eutelsat stated in October 2022". Start 2009 external (Eutelsat/HRW). |
| kp-2010-gps | CORRECTED | pp. 12-05 to 12-06 | "no impact on the GPS satellites themselves"; ITU/ICAO/IMO concerns; Nov. 2024. Start date external (GPS World). |
| ru-2014-ukraine | VERIFIED (external) | p. 02-28 (PDF 141) | "nearly 10,000 suspected incidents" (SWF). The 2014 start: Breaking Defense, 1 Mar 2022 (fetched): "The Russian military has routinely jammed GPS receivers in eastern Ukraine since the Crimean conflict in 2014". The Foreign Policy (Oct. 2015) piece named in the row note could not be fetched. The month (March) is the builder's coding of the Crimea conflict start; the year is sourced. |
| ru-2016-syria | VERIFIED | p. 02-28 | "The spoofing began in 2016, peaked in 2017" |
| ru-2018-trident | CORRECTED | p. 02-28 | "In November 2018 ... NATO exercise"; Norway "had proof" (Mar. 2019). Dates external (NATO). |
| ru-2018-peresvet | CORRECTED (Disc. 39) | p. 02-36 (PDF 149) | "formally named ... speech ... on March 1, 2018" |
| ru-2022-viasat | CORRECTED | pp. 15-06, 15-07 | "Within hours of Russian troops crossing the border"; "one hour before the first Russian troops"; US/UK/EU attribute to GRU, May 2022 |
| ru-2022-starlink | CORRECTED | p. 02-32 (PDF 145) | "no independent or public validation"; "Ukrainian government official" on May 2024 |
| ru-2023-baltic | VERIFIED | pp. 02-29, 02-30 | "picked up in late 2023 and early 2024"; Kaliningrad and St. Petersburg; ICAO Oct. 2025; RRB Nov. 2025 |
| mideast-2023-gnss | CORRECTED | pp. 10-01, 10-02 | "hard to distinguish ... Israel, Hamas"; IDF "in a proactive manner"; RRB Addendum 6, Israel |
| ru-2024-eu-sats | CORRECTED | p. 02-32 (PDF 145) | RRB July 2024: "seemed to originate from earth station(s) located in the areas of Moscow, Kaliningrad and Pavlovka". Attribution level recoded `multi_government` (Discrepancy 33). |

## legal.json

| id | status | check |
|---|---|---|
| ltbt-1963 | VERIFIED (external; context sourced 2026-09-29, Disc. 41) | Cite "14 U.S.T. 1313, 480 U.N.T.S. 43"; signed Moscow 5 Aug 1963 and in force 10 Oct 1963 (JFK Library, EBSCO, Arms Control Association; Senate consent 24 Sept. 1963, 80-19). "Followed Starfish Prime" is chronological only (July 1962). URL bot-blocked (202). |
| ost-1967 | VERIFIED (external) | Cite "18 U.S.T. 2410, 610 U.N.T.S. 205" confirmed. UNOOSA: adopted by res. 2222 (XXI), opened for signature 27 Jan 1967, in force 10 Oct 1967. URL bot-blocked. |
| abm-1972 | CORRECTED | Cite "23 U.S.T. 3435" confirmed. Art. XII: "Each Party undertakes not to interfere with the national technical means" (ACA / State text via search). US notice of withdrawal 13 Dec 2001, effective 13 June 2002 (ACA, CRS RS21088). |
| paros-1981 | VERIFIED | Alternative mirror: `documents.un.org/api/symbol/access?s=A/RES/36/97` (PDF read). Resolution 36/97 part **C**, "Prevention of an arms race in outer space", adopted at the 91st plenary meeting, 9 December 1981; operative para. 3 requests the Committee on Disarmament to consider the question "as from the beginning of its session in 1982". Same source for 36/99, "Conclusion of a treaty on the prohibition of the stationing of weapons of any kind in outer space", 9 December 1981. The UNOOSA page remains the ledger URL. |
| cd-paros-committee | VERIFIED (external) | UNIDIR text read: "On 29 March 1985 the CD agreed to establish an Ad Hoc Committee"; "final meeting on 23 August 1994"; "has not been re-established". |
| itu-1992 | VERIFIED (external) | UNTS vol. 1825 read: Art. 45 at p. 361; Art. 48 at p. 362 "Members retain their entire freedom with regard to military radio installations". Adopted 22 Dec 1992, in force 1 July 1994 (search). |
| ppwt-2008 | VERIFIED | `documents.un.org/api/symbol/access?s=CD/1839&l=en&t=pdf` (PDF read, 5 pp.): header "CD/1839, 29 February 2008"; "Letter dated 12 February 2008 ... transmitting the Russian and Chinese texts of the draft Treaty ... (PPWT) introduced by the Russian Federation and China"; signed by Loshchinin and Wang Qun. Ledger URL now this document. |
| ppwt-2014 | VERIFIED | `documents.un.org/api/symbol/access?s=CD/1985&l=en&t=pdf` (PDF read, 6 pp.): "CD/1985, Conference on Disarmament, 12 June 2014"; "Letter dated 10 June 2014 ... transmitting the updated Russian and Chinese texts of the draft treaty ... (PPWT)"; signed by Borodavkin and Wu Haitao. The earlier DL record 774287 (403) was dropped as the ledger URL. |
| unga-75-36 | VERIFIED (external) | DL record 3895440 title "Reducing space threats through norms, rules and principles of responsible behaviours"; adopted 7 Dec 2020 (search). |
| oewg-2022 | VERIFIED (external) | Res. 76/231 adopted 24 Dec 2021, 150-8-7 (DL record 3952870; UN doc A/RES/76/231, distributed 30 Dec 2021); it convenes the OEWG from 2022 and asks for a report to the 78th session. First session 9-13 May 2022; final session ended 1 Sept 2023 with no consensus report (search; SWF fact sheet). |
| us-moratorium-2022 | VERIFIED | URL 200. SWF p. 01-50 (PDF 99): "The United States did indeed formally announce in April 2022"; "38 countries total have made that commitment." |
| milamos-2022 | VERIFIED (external) | "Volume I - Rules was published in July 2022"; editors Jakhu and Freeland (McGill, spacewatch.global). |
| unga-77-41 | CORRECTED | Adopted 7 Dec 2022, 155 in favor, 9 against, 9 abstentions (DL record 3997622 via search; SpacePolicyOnline). |
| tallinn-2017 | VERIFIED | DOI URL resolves to the Cambridge Tallinn Manual 2.0 page (HTTP 200). Year 2017 per that page. |
| woomera-2024 | CORRECTED | OUP page: published 2024, editors Jack Beard and Dale Stephens. |
| unsc-veto-2024 | VERIFIED | UN press SC/15678: "9616th Meeting", Apr. 24, 2024; 13 in favor, Russia against, China abstained. Draft S/2024/302 confirmed (documents.un.org). |
| itu-rrb-2024 | VERIFIED | ITU document RRB24-2/12-E, "Summary of Decisions of the 96th Meeting of the Radio Regulations Board, 24-28 June 2024", dated 1 July 2024, pp. 11-12 | Fetched from `itu.int/dms_pub/itu-r/md/24/rrb24.2/c/R24-RRB24.2-C-0012!!PDF-E.pdf` (17 pp.). "The Board expressed its grave concern regarding the use of signals to cause intentional harmful interference ... and condemned such actions in the strictest terms"; interference to French and Swedish satellite networks in the 13/14 GHz and 18 GHz ranges "seemed to originate from earth station(s) located in the areas of Moscow, Kaliningrad and Pavlovka". Matches SWF p. 02-32. The row's `source_url` now points to this document. |
| icao-2025 | CORRECTED | SWF p. 02-30: the ICAO "passed a resolution determining that the GNSS interference originating in Russia was indeed an infraction of the 1944 Convention ... condemned it for doing so, and called for it to fulfill its obligations"; p. 12-06 says the same for North Korea; fn. 243 gives the ICAO release of 3 Oct 2025. ICAO release (search snippet, page bot-blocked 403; Uniting Aviation repeat): the Assembly (23 Sept.-3 Oct. 2025) "endorsed the determination of its governing Council" that the interference "constitute[s] infractions" of the Convention, through two resolutions. Label changed (Discrepancy 31). Resolution numbers not verified and not used. |
| itu-rrb-2025 | CORRECTED | SWF p. 02-30, fn. 245: "held November 10-14, 2025"; quote "again urge[d] the Administration of the Russian Federation". The ITU page (200) now also carries later meeting content. |

## capabilities.json

| category | status | check |
|---|---|---|
| direct_ascent | PARTIAL | D entries (US, China, Russia, India) match SWF matrix (PDF pp. 22, 24, 26, 27) and Tables 1-4, 3-3, 2-4, 5-1. P entries: Israel, Japan, Germany match ("uncertain"); South Korea, Iran, North Korea, France show "no data" in the matrix. See [Open items and impact](#open-items-and-impact). |
| co_orbital | PARTIAL | D entries (Russia, US, China) match the matrix. P: France, Germany match; India, Iran, Israel, Japan, North Korea, UK show "no data". See [Open items and impact](#open-items-and-impact). |
| electronic_warfare | VERIFIED | 2020s D (US, Russia, China, Iran, North Korea, Israel) all "significant" in the matrix's operational column. P entries (India, France, Australia, Germany, Japan, South Korea) each show "some" or "uncertain". |
| directed_energy | VERIFIED | US and Russia D (MIRACL, Peresvet) verified above. P entries (China, India, France, Germany, Israel) each show R&D "significant", "some" or "uncertain" in the matrix. The matrix also shows "some" or "uncertain" R&D for Australia, Japan and South Korea, which the coding omits (a minor undercount). |
| cyber | VERIFIED | The matrix has no cyber row. SWF ch. 15 (p. 15-02) and the Executive Summary name the US, Russia, China, France, Iran, Israel and North Korea as demonstrating offensive cyber capability against non-space targets; Russia D rests on Viasat (pp. 15-06, 15-07). |

Matrix reading method: pdfplumber returns each country's table as coloured shapes (green none, yellow some, red significant, dark "?" uncertain, dash no data), matched to the row labels by position. It was run over all 12 country tables (PDF pp. 22-32). Because the matrix is graphical, the reading is by position and colour, not by text.

Pre-2020s cells are the builder's reconstruction, not SWF-assessed, and are labeled so on the chart.
