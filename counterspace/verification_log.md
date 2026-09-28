# Counterspace Ledger: Verification Log

| | |
|---|---|
| **Date** | 2026-09-28 (second full pass; supersedes the first log of the same day). Later the same day, UN document mirrors were used for PAROS 36/97 and the two PPWT documents. |
| **Scope** | 83 items: 44 kinetic and 15 non-kinetic rows in `data/events.json`, 19 rows in `data/legal.json`, and 5 capability categories in `data/capabilities.json`. |
| **Method** | Each row checked against the pinned SWF page or a fetched primary source (see [Method](#method)). |
| **Result** | 74 items VERIFIED or CORRECTED, 9 PARTIAL, none UNCHECKED; 32 defects found and fixed ([Discrepancies](#discrepancies-found-and-fixed)). |
| **Regenerate** | `python3 tools/build_data.py` rebuilds the data files and `ledger.md` after any correction. |

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

## Executive summary

- **Outcome:** every event, legal item and capability category was checked; none is UNCHECKED. 74 of 83 items are VERIFIED or CORRECTED (defect fixed, then verified); 9 are PARTIAL.
- **Defects:** 32 discrepancies were found and fixed in `tools/build_data.py`. No factual error in a plotted value is known.
- **Open items:** 9 PARTIAL items (`us-1985-solwind`, `ru-2019-nudol-jun`, `ru-2014-ukraine`, `itu-rrb-2024`, and the five capability categories) plus one wording item on the page lede. Each has an impact assessment under [Open items and impact](#open-items-and-impact); none changes a plotted value.
- **This pass:** `ppwt-2008` and `ppwt-2014` moved from PARTIAL to VERIFIED against the primary documents, and `paros-1981` against the UN resolution text.
- **Bot-blocked sources:** ICAO, UNOOSA and some ITU pages block scripts; facts were checked through search snippets or UN mirrors, as recorded per row.

## Method

1. **SWF rows.** The SWF 2026 text extraction (`swf_2026.txt`, split by `=====PAGE N=====`) was searched programmatically and read by hand. Each row's date, value and pin was checked against the text of the pinned PDF page. The printed section-page (for example `02-36`) was mapped to the PDF page by reading the page-footer label, and every pinned pair was confirmed (e.g. PDF 72 = 01-23, PDF 149 = 02-36).
2. **Table 1-4 and Table 5-1 extract with scrambled columns.** Row membership was confirmed by the date and value strings on the page. Where a cell could not be tied to its row by the text alone, the row is marked PARTIAL and the cell is named.
3. **Non-SWF rows and legal rows.** Sources were fetched with WebFetch or curl, or located with WebSearch. Where a site blocks bots (HTTP 202 challenge, 403), alternative mirrors were tried (`documents.un.org` symbol access, `undocs.org`); if none worked the URL is listed as *bot-blocked* and the fact was checked through a search-index snippet or another source instead. No row is marked VERIFIED on inference, on "consistent with" reasoning, or on a neighboring row.
4. **URL checks.** Every distinct `source_url` was requested with curl (follow redirects, browser user agent) and its landing page inspected, not just its status code.

**Status vocabulary.** VERIFIED: the pinned page or fetched source shows the value (short quote given). VERIFIED (external): checked against a named non-SWF source. PARTIAL: core fields verified; the named field was not isolable or comes from outside the pin. CORRECTED: a defect was found in this pass and fixed in `build_data.py`. UNCHECKED: not re-checked in this pass (no row currently carries it).

## Results by category

| Set | Rows | VERIFIED | VERIFIED (external) | PARTIAL | CORRECTED (defect fixed, then verified) |
|---|---|---|---|---|---|
| Kinetic events | 44 | 33 | 1 | 2 | 8 |
| Non-kinetic events | 15 | 5 | 1 | 1 | 8 |
| Legal items | 19 | 6 | 7 | 1 | 5 |
| Capability categories | 5 | 0 | 0 | 5 | 0 |
| **Total** | **83** | **44** | **9** | **9** | **21** |

Each row is counted once, under its most significant status. Status definitions are in [Method](#method). The non-kinetic PARTIAL is `ru-2014-ukraine`, whose 2014 start is external.

## Open items and impact

| Item | Exactly what is unverified | Impact assessment |
|---|---|---|
| `us-1985-solwind` | The "0 pieces still in orbit" cell of Table 5-1. The extraction scrambles columns, so the cell cannot be tied to its row by text. The 530 km vs 555 km altitude conflict is verified and disclosed. | Chart A plots intercept altitude (530 km) and cataloged fragments (285), both read from the row. In-orbit counts appear only in cards and tables. |
| `ru-2019-nudol-jun` | The note "Potential KKV, no intercept" is paired to the 14 Jun 2019 row only by column order in Table 16-2. The date and "Nudol" are read directly. | The row has no altitude and no fragments; it is drawn in the no-altitude strip by its date alone. Low confidence is shown on the row. |
| `ru-2014-ukraine` | The 2014 start of the campaign is not on the SWF pages cited; it comes from Breaking Defense and Foreign Policy. "Nearly 10,000 suspected incidents" is verified on p. 02-28. | Chart C draws a span starting 2014; the note names the external source. The count is not plotted. |
| `itu-rrb-2024` (legal) | The ITU "summary of decisions" document itself. The 96th RRB meeting dates (24-28 June 2024) are confirmed on the ITU minutes page (Circular 507, `itu.int/md/R00-CR-CIR-0507`) and agenda; the summary is not retrievable (the meeting-document pages `R24-RRB24.2-SUM-0001` return an empty shell or 404 for scripts). The 1 July 2024 issue date rests on press reports. Quoted wording matches SWF p. 02-32. | The legal band plots the item at its start date, 1 Jul 2024. A date off by days would not move a mark at year scale, and the label and quote are SWF's. The ledger URL is the generic RRB page. |
| Page lede wording (`src/template.html`, not a data row) | The lede says non-kinetic methods "are the only counterspace tools used in actual military operations". SWF 2026, Executive Summary, p. xxiii (PDF p. 21), says: "only non-destructive capabilities are actively being used against satellites in current military operations." SWF does not name EW and cyber as the only such methods, and "non-destructive" is broader. | Wording risk only; no data row or chart depends on it. Recommended text: attribute the finding to SWF and use its words (non-destructive capabilities, against satellites). Pin recorded in `methodology.md` section 9. |
| `direct_ascent`, `co_orbital`, `electronic_warfare`, `directed_energy`, `cyber` (capabilities) | The 2020s D/P split follows SWF's graphical country matrix, which text extraction cannot read; P entries were not each read in the country chapters. | Chart B's 2020s counts inherit this. The chart labels pre-2020s cells as reconstruction, and the D entries rest on verified events (tables above). Only the split between D and P for P-entries is unchecked. |

## Closed items from the earlier log

| Earlier item | Status |
|---|---|
| `iq-2003-gps` wrong `source_url` (Rumsfeld/Myers page) | **Closed.** `data/events.json` now carries `https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm`. Re-fetched: Maj. Gen. Renuart, Mar. 25, 2003: "We have destroyed all six of those jammers." |
| `us-1962-starfish-prime` dead `source_url` | **Closed.** `data/events.json` carries `https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf` (HTTP 200). The PDF was downloaded and read: table row "Starfish Prime ... 250 miles ... 07/09/1962 ... Johnston Island area" and "250 miles ... 1.4 Mt" (PDF pp. 41-42). |
| Earlier "VERIFIED by consistency" rows (cn-2005, cn-2006, cn-2010, DN series, Nudol series, capabilities, several legal rows) | **Reopened and re-verified below** with page pins and quotes, or downgraded. |

## Discrepancies found and fixed

All 32 were corrected in `tools/build_data.py`.

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
| 10 | `us-1985-solwind` | Prose (p. 01-22) also says 555 km; only Table 1-4 was cited. Zero "still on orbit" cell not isolable. | Pin and note extended; PARTIAL. |
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
| 30 | `ru-2019-nudol-jun` (added) | Omitted. Only Table 16-2 lists "June 14, 2019 ... Nudol"; the note "Potential KKV, no intercept" is paired to it by column order (two such notes follow the Dec. 2018 and June 2019 rows). | Row added, low confidence, PARTIAL. |
| 31 | Legal `icao-2025` | Label "breaches Chicago Convention" overstated the finding. SWF p. 02-30: the ICAO "passed a resolution determining that the GNSS interference originating in Russia was indeed an infraction of the 1944 Convention on International Civil Aviation, condemned it ... and called for it to fulfill its obligations" (p. 12-06 says the same for North Korea). The ICAO release (through a search snippet; the page is bot-blocked) says the Assembly "endorsed the determination of its governing Council that recurring incidents of GNSS RFI originating from the DPRK and the territory of the Russian Federation constitute infractions" of the Convention, and condemned both. | Label is now "ICAO: GNSS interference an 'infraction' of the Chicago Convention" (ICAO's own word, in quotes; not "breach", not merely "findings"). The note says it is an intergovernmental finding, not a court judgment. Recorded as decision 14 in `methodology.md`. |
| 32 | Legal `itu-rrb-2024` | Citation gave only the issue date. | The 96th RRB meeting was 24-28 June 2024 (ITU agenda and minutes pages); the summary was issued 1 July 2024. Citation now gives both. |

**Scope disclosure.** SWF Appendix Table 16-2 also lists Cosmos 2521 (Burevestnik?) on 30 Oct 2017 and a "September 2019?" co-orbital entry. These are co-orbital or RPO events, not direct-ascent tests, and are outside the ledger's kinetic scope (see `methodology.md`, coding rules). After the additions, every Nudol row in Tables 2-4 and 16-2 is in the ledger (Aug 2014, Apr 2015, Nov 2015, May 2016, Dec 2016, Mar 2018, Dec 2018, Jun 2019, Nov 2019, Apr 2020, Dec 2020, Nov 2021).

## events.json: kinetic rows

Quotes are from the pinned page unless noted. "T1-4" = Table 1-4, "T5-1" = Table 5-1.

| id | status | pin checked | evidence |
|---|---|---|---|
| us-1959-bold-orion | VERIFIED | T1-4, p. 01-23 (PDF 72) | "Oct. 13, 1959 Bold Orion ... Explorer VI 200 km" |
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
| us-1985-solwind | PARTIAL | T5-1 p. 05-01; prose p. 01-22; T1-4 p. 01-24 | T5-1 "Solwind 530 km 285"; prose and T1-4 "555 km". The 0-in-orbit cell is not isolable in the scrambled table. |
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
| ru-2019-nudol-jun | PARTIAL | T16-2, p. 16-03 (PDF 307) | "June 14, 2019 ... Nudol"; note "Potential KKV, no intercept" paired by column order. Not in T2-4. Coded low confidence. |
| ru-2019-nudol-nov | CORRECTED | T2-4, p. 02-21; prose p. 02-21 | "Nov. 15, 2019 ... Nudol ... Plesetsk ... Likely KKV"; "first known intercept test of the Nudol" (Nov. 2021). "No intercept" removed from the T2-4 attribution (Discrepancy 29). Not in T16-2. |
| ru-2018-nudol-mar | VERIFIED | T2-4, p. 02-21 | "Mar. 26, 2018 ... Likely KKV"; "First test from a mobile launcher" |
| ru-2018-nudol-dec | VERIFIED | T2-4; T16-2 | "Dec. 23, 2018 ... Likely KKV"; T16-2 "Potential KKV, no intercept" |
| ru-2020-nudol-apr | VERIFIED | T2-4; fn. 148 p. 02-20 | "Apr. 15, 2020 ... Likely KKV"; "Successful, nothing hit"; USSPACECOM release cited |
| ru-2020-nudol-dec | VERIFIED | T2-4; fn. 149 p. 02-20 | "Dec. 16, 2020"; USSPACECOM release cited |
| in-2019-shakti | CORRECTED | T5-1 p. 05-01; prose p. 04-04 (PDF 204) | T5-1 "PDV-MK II ... Microsat-R 300 km 130"; "within 45 days at most"; "final piece ... June 2022" |
| ru-2021-cosmos1408 | VERIFIED | T5-1 p. 05-01; prose p. 02-21 (PDF 134) | T5-1 "Nudol ... Cosmos 1408 470 km 1807 5"; "more than 1,800 pieces ... 5 still in orbit" |

## events.json: non-kinetic rows

| id | status | pin checked | evidence |
|---|---|---|---|
| us-1997-miracl | CORRECTED | p. 01-35 (PDF 84) | "MIRACL was fired against an orbiting satellite in October 1997"; Cohen "fully consistent" with US policy. Day 17 Oct and White Sands from FlightGlobal / ACA (external); SWF fn. 259 cites the WSMR laser test facility. |
| ir-2003-telstar12 | VERIFIED | p. 09-05 (PDF 247) | "Iran has been accused"; "started in 2003"; "Bulgaria and Libya in 2005/2006" |
| iq-2003-gps | VERIFIED (external) | CENTCOM/AFPS briefing, 25 Mar 2003 | "We have destroyed all six of those jammers"; not in SWF (Iraq outside its 13 countries) |
| cn-2006-laser | VERIFIED | p. 03-26 (PDF 187) | "cited anonymous US defense officials"; "no US satellites were materially" damaged |
| ir-2009-eutelsat | CORRECTED | p. 09-06 (PDF 248) | "ITU ordered Iran to assist in stopping the jamming"; "Eutelsat stated in October 2022". Start 2009 external (Eutelsat/HRW). |
| kp-2010-gps | CORRECTED | pp. 12-05 to 12-06 | "no impact on the GPS satellites themselves"; ITU/ICAO/IMO concerns; Nov. 2024. Start date external (GPS World). |
| ru-2014-ukraine | PARTIAL | p. 02-28 (PDF 141) | "nearly 10,000 suspected incidents"; the 2014 start is external (Breaking Defense; Foreign Policy). |
| ru-2016-syria | VERIFIED | p. 02-28 | "The spoofing began in 2016, peaked in 2017" |
| ru-2018-trident | CORRECTED | p. 02-28 | "In November 2018 ... NATO exercise"; Norway "had proof" (Mar. 2019). Dates external (NATO). |
| ru-2018-peresvet | CORRECTED | p. 02-36 (PDF 149) | "formally named ... speech ... on March 1, 2018" |
| ru-2022-viasat | CORRECTED | pp. 15-06, 15-07 | "Within hours of Russian troops crossing the border"; "one hour before the first Russian troops"; US/UK/EU attribute to GRU, May 2022 |
| ru-2022-starlink | CORRECTED | p. 02-32 (PDF 145) | "no independent or public validation"; "Ukrainian government official" on May 2024 |
| ru-2023-baltic | VERIFIED | pp. 02-29, 02-30 | "picked up in late 2023 and early 2024"; Kaliningrad and St. Petersburg; ICAO Oct. 2025; RRB Nov. 2025 |
| mideast-2023-gnss | CORRECTED | pp. 10-01, 10-02 | "hard to distinguish ... Israel, Hamas"; IDF "in a proactive manner"; RRB Addendum 6, Israel |
| ru-2024-eu-sats | VERIFIED | p. 02-32 | RRB July 2024: "seemed to originate from earth station(s) located in the areas of Moscow, Kaliningrad and Pavlovka" |

## legal.json

| id | status | check |
|---|---|---|
| ltbt-1963 | VERIFIED (external) | Cite "14 U.S.T. 1313, 480 U.N.T.S. 43"; signed Moscow 5 Aug 1963 and in force 10 Oct 1963 (JFK Library, EBSCO, Arms Control Association; Senate consent 24 Sept. 1963, 80-19). "Followed Starfish Prime" is chronological only (July 1962). URL bot-blocked (202). |
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
| itu-rrb-2024 | PARTIAL | 96th RRB meeting 24-28 June 2024 (ITU Circular 507 minutes page and agenda); summary issued 1 July 2024 (press reports); quotes match SWF p. 02-32. Summary document not retrievable; see "Remaining PARTIAL items". |
| icao-2025 | CORRECTED | SWF p. 02-30: the ICAO "passed a resolution determining that the GNSS interference originating in Russia was indeed an infraction of the 1944 Convention ... condemned it for doing so, and called for it to fulfill its obligations"; p. 12-06 says the same for North Korea; fn. 243 gives the ICAO release of 3 Oct 2025. ICAO release (search snippet, page bot-blocked 403; Uniting Aviation repeat): the Assembly (23 Sept.-3 Oct. 2025) "endorsed the determination of its governing Council" that the interference "constitute[s] infractions" of the Convention, through two resolutions. Label changed (Discrepancy 31). Resolution numbers not verified and not used. |
| itu-rrb-2025 | CORRECTED | SWF p. 02-30, fn. 245: "held November 10-14, 2025"; quote "again urge[d] the Administration of the Russian Federation". The ITU page (200) now also carries later meeting content. |

## capabilities.json

| category | status | check |
|---|---|---|
| direct_ascent | PARTIAL | 2020s D for US, China, Russia, India follows Tables 1-4, 3-3, 2-4, 5-1 (all verified above). P entries rest on SWF country chapters (Israel Arrow 3 "most viable platform", p. 10-01) and were not each read. Earlier decades: reconstruction. |
| co_orbital | PARTIAL | D/P split rests on SWF's graphical country matrix (p. 01-01 ff.), which the text extraction cannot read. |
| electronic_warfare | PARTIAL | D events verified (Iran, North Korea, Russia, Israel, China rows above); P entries unread. |
| directed_energy | PARTIAL | US D (MIRACL) and Russia D (Peresvet) verified above; China P per p. 03-26 (allegation only). |
| cyber | PARTIAL | Russia D (Viasat) verified; the other P entries follow SWF ch. 15 and were not individually checked. |

Pre-2020s cells are the builder's reconstruction, not SWF-assessed, and are labeled so on the chart.
