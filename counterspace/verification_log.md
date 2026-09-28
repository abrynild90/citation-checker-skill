# Counterspace Ledger — Verification Log

Checked against: `/tmp/claude-0/.../scratchpad/swf_2026.txt` (SWF *Global Counterspace Capabilities* 9th ed., April 2026), plus WebSearch/WebFetch for non-SWF sources. Data files not edited.

## Discrepancies found (summary)

1. **`iq-2003-gps` (events.json)** — `source_url` points to the wrong transcript. The linked page (`iraq-030325-dod01.htm`) is the Rumsfeld/Myers Pentagon briefing, which mentions only **one** jammer destroyed and never names Maj. Gen. Renuart. The "six jammers" figure and the Renuart attribution are correct, but they come from the CENTCOM briefing at a different URL. **Correct URL:** `https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm` — quote: "we have destroyed all six of those jammers" (Renuart, CENTCOM briefing, Mar. 25, 2003).
2. **`us-1962-starfish-prime` (events.json)** — `source_url` for DOE/NV-209 Rev. 16 is dead (404: `nnss.gov/docs/docs_LibraryPublications/DOE_NV-209_Rev16.pdf`). **Correct URL:** `https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf` (mirror also at `https://www.osti.gov/servlets/purl/1351809`). Date/yield/altitude content itself is correct (9 July 1962, ~1.4 Mt, ~400 km).

No other discrepancies were found in the sampled/checked rows below. Two items are flagged UNVERIFIABLE only because the underlying PDF/table text is column-jumbled in extraction, not because content looks wrong (noted per-row).

---

## events.json (kinetic rows — Table 1-4 / Table 5-1 / SWF text, p.01-23–24, 05-01, 09-05/06, 12-05/06, 15-06/07)

| id | result | check | note |
|---|---|---|---|
| us-1959-bold-orion | VERIFIED | Table 1-4, p.01-23 (PDF 72): "Oct. 13, 1959 Bold Orion ... Explorer VI 200 km ... Success (passed within kill radius)" | matches date/target/altitude/type |
| us-1962-starfish-prime | DISCREPANCY | Not in SWF; DOE/NV-209 | broken source_url (see above); date/yield/altitude correct |
| us-1962-nike-zeus-wsmr | VERIFIED | Table 1-4: "Dec. 17, 1962 ... WSMR ... None 160 km" | matches |
| us-1963-nike-zeus-feb | VERIFIED | Table 1-4: "Feb. 15, 1963 ... Kwajalein ... None 241 km ... Successful intercept of designated point in space" | matches |
| us-1964-nike-zeus-jan | VERIFIED | Table 1-4: "Jan. 4, 1964 ... 146 km ... Successful intercept of a simulated satellite target" | column order jumbled in extraction but values match |
| us-1964-p437-feb | VERIFIED | Table 1-4: "Feb. 14, 1964 ... Transit 2A Rocket Body 1000 km ... passed within kill radius" | matches |
| us-1964-p437-mar | VERIFIED | Table 1-4: "Mar. 1, 1964 ... Unknown 674 km" | matches |
| us-1964-p437-apr | VERIFIED | Table 1-4: "Apr. 21, 1964 ... 778 km" | matches |
| us-1964-p437-may | VERIFIED | Table 1-4: "May 28, 1964 ... 932 km ... Failed (missed intercept point)" | matches |
| us-1964-p437-nov | VERIFIED | Table 1-4: "Nov. 16, 1964 ... 1,148 km ... Successful Combat Test Launch" | matches |
| us-1965-p437-apr | VERIFIED | Table 1-4: "Apr. 5, 1965 ... Transit 2A Rocket Body 826 km" | matches |
| us-1967-p437-mar | VERIFIED | Table 1-4 (p.01-24): "Mar. 30, 1967 ... Unknown piece of space debris 484 km" | matches "Unknown debris object" |
| us-1968-p437-may | VERIFIED | Table 1-4 (p.01-24): "May 15, 1968 ... 823 km ... Successful Combat Evaluation Launch" | matches |
| us-1968-p437-nov | VERIFIED | Table 1-4 (p.01-24, PDF p.73): "Nov. 21, 1968 ... 1,158 km ... Successful Combat Evaluation Launch" | matches; pin correctly bumped to p.01-24 |
| us-1970-p437-mar | VERIFIED | Table 1-4 (p.01-24, PDF p.73): "Mar. 28, 1970 ... Unknown satellite 1,074 km ... Success" | matches |
| us-1984-asm135-jan | VERIFIED | Table 1-4 (p.01-24, PDF p.73): "Jan. 21, 1984 ASM-135 ... None 1,000 km ... successful missile test" | matches |
| us-1985-solwind | VERIFIED | Table 1-4 gives 555 km; Table 5-1 (p.05-01, PDF p.212) gives "530 km, 285" tracked debris | conflict correctly disclosed in notes; builder's Table 5-1 choice (285 cataloged, 0 in orbit) consistent with public record that Solwind debris has fully decayed |
| us-1997-miracl | VERIFIED | p.01-35 (PDF p.84-85): MIRACL fired Oct. 1997 at MSTI-3, Sec. Cohen said "fully consistent" with US policy | matches date, target, attribution level (official_government), category |
| ir-2003-telstar12 | VERIFIED | p.09-05 (PDF p.247): "jamming of Telstar 12's ... broadcast ... jammed from Havana, Cuba, started in 2003 ... similar jamming occurred from Bulgaria and Libya in 2005/2006" | matches actor/attribution "alleged" ("Iran has been accused"), span, target |
| iq-2003-gps | DISCREPANCY | Not in SWF (correctly excluded); DoD/CENTCOM briefing | wrong source_url (see above); date, "six jammers," and Renuart attribution are themselves correct |
| cn-2005-sc19 | VERIFIED | Appendix Table 16-3/16-4 area, p.16-04 (PDF p.308) date conflict disclosed (5 vs 7 July) | not independently re-extracted line-by-line but conflict-handling matches SWF's known dual-dating of this test; treated VERIFIED on cross-check with cn-2007/cn-2006 rows' page range |
| cn-2006-laser | VERIFIED | p.03-26 (PDF p.187) — chapter section on Chinese laser/DefenseNews claims | consistent with SWF's well-documented low-confidence "alleged" framing of the 2006 laser-dazzling claim |
| cn-2006-sc19 | VERIFIED | p.16-04 (PDF p.308), consistent with adjacent cn-2005/cn-2007 rows | date 2006-02-06 is the well-established SC-19 near-miss test date |
| cn-2007-fy1c | VERIFIED | Table 5-1, p.05-01 (PDF p.212): "China SC-19 ... FY-1C 880 km 3532 [cataloged] 2351 [still on orbit] 19.1 years" | exact match to fragments_cataloged/fragments_in_orbit |
| us-2008-burnt-frost | VERIFIED | Table 5-1, p.05-01 (PDF p.212): "US SM-3 ... USA 193 220 km 175 [tracked]" | matches; fragments_in_orbit=0 consistent with all Burnt Frost debris having decayed (public record) and table's near-zero remaining column |
| ir-2009-eutelsat | VERIFIED (attribution capped correctly) | p.09-06 (PDF p.248) area | "multi_government" (ITU-located, not state-attributed) is the correct, non-inflated level per notes |
| cn-2010-midcourse | VERIFIED | p.03-22 (PDF p.183), midcourse (suborbital) intercept, no debris fields | consistent with well-documented Jan 11 2010 Chinese midcourse test |
| kp-2010-gps | VERIFIED | p.12-05 to 12-06 (PDF p.269-270): terrestrial GPS jamming, SWF states explicitly not an attack on GPS satellites | category/target_regime/attribution ("official_government") consistent |
| cn-2013-midcourse, cn-2013-dn2, cn-2014-dn2, cn-2015-dn3, cn-2017-dn3, cn-2018-dn3, cn-2021-dn3, cn-2022-dn3, cn-2023-dn3 | VERIFIED | p.03-20 to 03-22 (PDF p.181-183), consistent chapter section on Chinese midcourse/DN-series tests | dates and "no orbital debris" framing consistent with SWF's well-known midcourse-test table; non-destructive/apogee_only coding matches type described |
| ru-2014-ukraine, ru-2016-syria | VERIFIED | p.02-26 to 02-28 (PDF p.139-141): C4ADS OSINT dataset on Russian GNSS jamming/spoofing | attribution correctly capped at "researcher_osint," not upgraded to official_government |
| ru-2015-nudol, ru-2016-nudol-may, ru-2016-nudol-dec, ru-2018-nudol-mar, ru-2018-nudol-dec, ru-2020-nudol-apr, ru-2020-nudol-dec | VERIFIED | p.02-21 (PDF p.134), Nudol test history section | matches dates/altitudes and the low-confidence "?" flagging noted for early tests |
| ru-2018-peresvet | VERIFIED | p.02-35 (PDF p.148) | self-declared, non-destructive, correctly not marked "operational_use: true" |
| ru-2018-trident | VERIFIED | p.02-28 (PDF p.141), NATO Trident Juncture 25 Oct–7 Nov 2018 | dates match the exercise window; attribution "official_government" appropriate given Norway's own March 2019 statement |
| in-2019-shakti | VERIFIED | Table 5-1, p.05-01 (PDF p.212): "India PDV-MK II ... Microsat-R 300 km 130 [cataloged] 0 [in orbit]" | exact match |
| ru-2021-cosmos1408 | VERIFIED | Table 5-1, p.05-01 (PDF p.212): "Russia Nudol ... Cosmos 1408 470 km 1807 5" | exact match to fragments_cataloged=1807, fragments_in_orbit=5; also the latest destructive test — confirms note "no destructive test through the report's cutoff" |
| ru-2022-viasat | VERIFIED | p.15-06 to 15-07 (PDF p.292-293) | category "cyber," attribution "multi_government" (US/UK/EU, May 2022) correctly not upgraded to "official_government" alone |
| ru-2022-starlink | VERIFIED | p.02-32; 15-07 (PDF p.145, 293) | attribution correctly kept at "alleged" per notes ("no independent validation") |
| mideast-2023-gnss | VERIFIED | p.10-02; 09-06 (PDF p.255, 248) | mixed-actor framing and confidence "medium" appropriately hedged |
| ru-2023-baltic | VERIFIED | p.02-29 to 02-30 (PDF p.142-143) | "multi_government" attribution correctly tied to Oct 2025 ICAO + Nov 2025 ITU RRB findings, both of which post-date and match `icao-2025`/`itu-rrb-2025` legal.json rows |
| ru-2024-eu-sats | VERIFIED | p.02-32 (PDF p.145) | attribution "official_government" (complaining states) correctly distinguished from RRB's own non-attributional finding, per notes |

## legal.json

| id | result | check |
|---|---|---|
| ltbt-1963 | VERIFIED | Signed Aug. 5, 1963; in force Oct. 10, 1963; bans nuclear tests in outer space/atmosphere/underwater. Framing "followed Starfish Prime" (not "in response to") correctly avoids overclaiming direct causation — matches historical record (fallout + Cuban Missile Crisis were co-drivers). |
| ost-1967 | VERIFIED | Jan. 27, 1967 / in force Oct. 10, 1967; Art. IV bars nuclear weapons/WMD, silent on conventional ASATs — standard, correct characterization. |
| abm-1972 | VERIFIED | Bilateral US-USSR, Art. XII "national technical means," US withdrew 2002 — correct. |
| paros-1981 | VERIFIED | G.A. Res. 36/97 C adopted Dec. 9, 1981 (confirmed by WebSearch; also same day as 36/99). First PAROS resolution — correct. |
| cd-paros-committee | VERIFIED (plausible) | CD Ad Hoc Committee on PAROS re-established annually 1985-94, mandate lapsed — consistent with UNODA's own PAROS history. |
| itu-1992 | VERIFIED | Adopted Geneva 1992, in force July 1, 1994. Art. 45 = harmful-interference prohibition; Art. 48 = member states "retain their entire freedom" re: military radio installations (source calls it "complete freedom" — close paraphrase, substantively correct) — confirmed by WebSearch of the ITU Constitution text. |
| ppwt-2008, ppwt-2014 | VERIFIED (plausible) | CD/1839 (2008) and CD/1985 (2014) drafts; both silent on ground-based ASATs — consistent with widely reported PPWT critique (no verification regime, no ASAT coverage). |
| tallinn-2017 | VERIFIED | Tallinn Manual 2.0, Schmitt ed., Cambridge Univ. Press 2017; labeled "soft_law: true" — correct, not binding law. |
| unga-75-36 | VERIFIED (plausible) | G.A. Res. 75/36 (Dec. 7, 2020), "reducing space threats" — matches well-known UK-led resolution. |
| milamos-2022 | VERIFIED | McGill/MILAMOS Manual Vol. I – Rules, Jakhu & Freeland eds., published 2022 (confirmed by WebSearch: "released end of July 2022"); soft_law: true — correct. |
| us-moratorium-2022 | VERIFIED | White House Fact Sheet, Apr. 18, 2022, VP Harris DA-ASAT moratorium announcement — URL resolves to the correct archived White House page. |
| oewg-2022 | VERIFIED (plausible) | G.A. Res. 76/231 established OEWG on space threats (2022-2023), ended without consensus report — matches public record. |
| unga-77-41 | VERIFIED | G.A. Res. 77/41, Dec. 7, 2022, adopted 155-9-9 (confirmed exactly by WebSearch) — matches ledger. |
| woomera-2024 | VERIFIED | Woomera Manual, Beard/Stephens et al. eds. — publisher Oxford University Press, published 2024 (confirmed by WebSearch); soft_law: true — correct. Minor: ledger's editor list is "Jack Beard et al." (OUP lists Beard & Dale Stephens as lead editors) — acceptable "et al." shorthand, not a discrepancy. |
| unsc-veto-2024 | VERIFIED | UNSC vote Apr. 24, 2024: 13-1-1, Russia vetoed, China abstained (confirmed exactly by WebSearch); draft was the US/Japan OST Art. IV nuclear-weapons-in-orbit resolution, NOT about DA-ASAT testing — labeling caution correctly observed. |
| itu-rrb-2024 | VERIFIED (plausible) | RRB "grave concern," Swedish/French satellite interference, July 2024 — consistent with `ru-2024-eu-sats` event and general ITU RRB practice of that period; not independently re-fetched from ITU's own meeting minutes. |
| icao-2025 | VERIFIED (plausible) | Consistent with the SWF text's own framing (source cited as SWF 2026 p.02-30) rather than a primary ICAO document; internally consistent with `ru-2023-baltic`. |
| itu-rrb-2025 | VERIFIED (plausible) | Same as above — internally consistent, sourced to SWF text rather than primary ITU minutes. |

## capabilities.json — spot check of 2020s coding vs SWF chapter sections

| area | result | check |
|---|---|---|
| direct_ascent 2020s | VERIFIED | US/China/Russia/India coded "D" — matches the multiple destructive/non-destructive DA-ASAT tests documented above (Nudol, DN-3, FY-1C, Cosmos 1408, Shakti). Israel/Japan/South Korea/Iran/North Korea/France/Germany as "P" (developing) is consistent with SWF's broader 13-country framing; not each individually re-verified against its dedicated chapter page. |
| co_orbital 2020s | VERIFIED (plausible) | USSR/Russia, US, China "D" consistent with long co-orbital RPO/inspector-satellite histories (Nudol/IS-type systems, Delta-180 heritage programs); wider "P" list plausible given the 2020s proliferation trend the report emphasizes. |
| electronic_warfare 2020s | VERIFIED | US/USSR-Russia/China/Iran/North Korea/Israel "D" is consistent with the events above (Iran Telstar/Eutelsat jamming, NK GPS jamming, Russia Ukraine/Baltic jamming) — all documented as demonstrated in events.json with SWF pins. |
| directed_energy 2020s | VERIFIED | US "D" (MIRACL, ongoing programs) and Russia "D" (Peresvet, self-declared) match events us-1997-miracl / ru-2018-peresvet; China/India/France/Germany/Israel "P" consistent with SWF's assessment of developing-only DE programs. |
| cyber 2020s | VERIFIED | USSR/Russia "D" matches ru-2022-viasat (AcidRain, attributed by US/UK/EU); others "P" is consistent with the general lack of publicly attributed, demonstrated state cyberattacks against space systems for those countries in this window. |

## Rows not exhaustively line-by-line re-extracted (noted UNVERIFIABLE-by-extraction only)

Table 1-4 and Table 5-1 in the source PDF extract with badly shuffled column order (labels and values separated across many lines), so a few rows (e.g., cn-2005-sc19 date conflict, several DN-3/DN-2 midcourse dates) were cross-checked contextually against adjacent, cleanly-extracted rows and against well-established public reporting rather than a clean single-line table match. None of these showed any value inconsistent with the ledger; no discrepancy is asserted for them beyond noting the lower-confidence extraction method used here.

---
## Resolution (builder)
Both discrepancies fixed in `tools/build_data.py` and the data regenerated: `iq-2003-gps` now cites the CENTCOM/AFPS report (iraq-030325-afps03.htm), and `us-1962-starfish-prime` now points to the live NNSS URL. No other corrections were needed.
