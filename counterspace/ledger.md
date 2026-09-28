# Counterspace Timeline Ledger

*Ledger as of 2026-09-28. Schema 1.0.0. Generated file: edit `tools/build_data.py`, not this page.*

## Preface

**Purpose.** This ledger is the reference dataset behind the Counterspace Timeline. It records 44 kinetic tests, 15 non-kinetic operations and 19 legal items, and gives each one a source and a pin to the page that supports it. It exists so that any figure on the page can be traced to its source in one step, and so that places where the source disagrees with itself are visible instead of silently resolved.

**How to use it.** Start with [Key figures](#key-figures) for the destructive tests and the size of the dataset. Read [How to read the tables](#how-to-read-the-tables) once for the terms and the pin format. Then look a row up by state or year, or go to the full tables. Long explanations are collected in the numbered [Endnotes](#endnotes); a table row points to its endnote by number, for example [1](#n1). Where sources conflict, see [Conflicts inside the sources](#conflicts-inside-the-sources).

**How to cite it.** Cite the primary source for any figure, and this ledger for the coding. For a row, give its id and its pin, for example: *Counterspace Timeline Ledger, row `cn-2007-fy1c` (ledger as of 2026-09-28), citing SWF 2026, Table 5-1, p. 05-01.* Do not cite the ledger alone for a debris count or an altitude. Verification status is in `verification_log.md`; coding decisions are in `methodology.md`.

## Contents

- [Key figures](#key-figures)
- [How to read the tables](#how-to-read-the-tables)
- [Quick lookup by state or actor](#quick-lookup-by-state-or-actor)
- [Quick lookup by year](#quick-lookup-by-year)
- [Kinetic events (chronological)](#kinetic-events-chronological) (44 rows)
- [Non-kinetic events (by start date)](#non-kinetic-events-by-start-date) (15 rows)
- [Legal items (by start date)](#legal-items-by-start-date) (19 rows)
- [Conflicts inside the sources](#conflicts-inside-the-sources) (8 rows)
- [Endnotes](#endnotes) (59 notes)
- [Capability coding (Chart B)](#capability-coding-chart-b) (5 categories)
- [Sources](#sources)

## Key figures

**Destructive direct-ascent (DA-ASAT) tests.** These are the 5 tests in the ledger that created cataloged fragments. Fragment counts are as of 2026-02 (SWF Table 5-1); altitude is the intercept altitude in that table.

| date | state | system | target | altitude (km) | cataloged fragments | fragments in orbit | pin | endnote |
|---|---|---|---|---|---|---|---|---|
| 1985-09-13 | United States | ASM-135 (F-15) | Solwind P78-1 | 530 | 285 | 0 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-22 (PDF p. 71); Table 1-4, p. 01-24 (PDF p. 73) | [17](#n17) |
| 2007-01-11 | China | SC-19 | Fengyun-1C | 880 | 3,532 | 2,351 | Table 5-1, p. 05-01 (PDF p. 212) | [20](#n20) |
| 2008-02-20 | United States | SM-3 (USS Lake Erie) | USA-193 | 220 | 175 | 0 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-24 (PDF p. 73); Table 1-4, p. 01-24 (PDF p. 73) | [21](#n21) |
| 2019-03-27 | India | PDV Mk-II (Mission Shakti) | Microsat-R | 300 | 130 | 0 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 04-04 (PDF p. 204) | [36](#n36) |
| 2021-11-15 | Russia | Nudol (PL-19) | Cosmos 1408 | 470 | 1,807 | 5 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 02-21 (PDF p. 134) | [42](#n42) |
| **Total** | | | | | **5,929** | **2,356** | | |

SWF reports no destructive DA-ASAT test after 15 Nov 2021. Table 5-1 also lists co-orbital tests that created fragments; they are outside this ledger's kinetic rows.

**Size and quality of the dataset.**

| set | rows | notes |
|---|---|---|
| Kinetic events | 44 | 5 destructive; 21 high confidence |
| Non-kinetic events | 15 | 7 high confidence |
| Legal items | 19 | 3 soft law |
| Documented source conflicts | 8 | listed in [Conflicts inside the sources](#conflicts-inside-the-sources) |
| Capability categories | 5 | Chart B; 2020s follows SWF, earlier decades are reconstructed |
| Schema version | 1.0.0 | `data/schema.json` |

**Sources.** Primary: Secure World Foundation, *Global Counterspace Capabilities: An Open Source Assessment*, 9th ed. (April 2026), cited as SWF 2026. CSIS *Space Threat Assessment 2026* had not been published when this was checked. Verification is recorded in `verification_log.md`.

## How to read the tables

**Pins.** An SWF pin gives the table or passage, the printed section-page (for example `p. 05-01`) and the PDF page index (`PDF p. 212`). A non-SWF pin names the passage and starts with the source key in brackets, for example `[iq-2003-gps]`; the full cite is under [Sources](#sources). Where a row cites several places, all are listed.

**Terms.** *Destructive test*: an intercept that created cataloged fragments. *Cataloged fragments*: tracked pieces created by a test (generally larger than 10 cm). *Fragments in orbit*: those still on orbit as of 2026-02. *Altitude*: the figure named in the *kind* column (below). *Confidence*: how well the row is supported (below).

**Kinetic rows**

| field | meaning |
|---|---|
| id | Stable row key used by the page and by `related_events` in the legal items. |
| date | Test date (YYYY-MM-DD); an endnote explains where sources differ. |
| type | Test outcome class (below). |
| alt (km) / kind | Altitude and what it measures (below). Blank when SWF reports none. |
| cataloged / in orbit | Cataloged fragments created / fragments still in orbit as of 2026-02 (destructive tests only). |
| conf | Confidence in the row (below). |
| note | Endnote number, where the row has one. |

| type | meaning |
|---|---|
| `destructive` | Intercept that created cataloged debris (SWF Table 5-1). |
| `non_destructive` | Test with no debris reported, or no target; includes rocket-only tests. |
| `midcourse_intercept` | Suborbital intercept of a missile target; no orbital debris. |
| `apogee_only` | Launch to high altitude; not an intercept (DN-2, 2013). |
| `flyby` | Pass within a kill radius of a satellite without a kill. |
| `nuclear` | High-altitude nuclear detonation (Starfish Prime only). |

| altitude kind | meaning |
|---|---|
| `intercept` | Altitude of the intercept (SWF Table 5-1 for destructive tests). |
| `apogee` | Maximum altitude of the missile or rocket (SWF Tables 1-4, 2-4, 3-3). |
| `detonation` | Burst altitude of the nuclear test. |

**Non-kinetic rows**

| field | meaning |
|---|---|
| start / end | Campaign or event span; `ongoing` means no end is documented. Year-only sources use 1 Jan or 31 Dec. |
| category | `directed_energy`, `ew_uplink`, `ew_downlink`, `gnss_jamming`, `gnss_spoofing` or `cyber`. |
| attribution | How firmly the source attributes the act (below). Never upgraded beyond the source. |
| target regime | What the effect hit: `ISR_LEO`, `GEO_comms`, `GNSS_MEO`, `LEO_constellation` or `ground_segment`. GNSS jamming hits receivers, not satellites; the code names the signal. |
| operational | `True` if used in a real conflict or operation, `False` if a test, a dispute or a non-conflict interference case. |

| attribution level | meaning |
|---|---|
| `official_government` | A government (or its military) has said so itself, or a government has publicly made the claim. |
| `multi_government` | Several governments or an intergovernmental body (ITU, ICAO) made or located the attribution; not a finding of state responsibility. |
| `researcher_osint` | Open-source researchers or a nonprofit are the source; no government attribution relied on. |
| `alleged` | Reported or claimed without independent validation; kept at the source's own hedge. |

| confidence | meaning |
|---|---|
| `high` | Date and value match SWF tables or text with no unresolved internal conflict. |
| `medium` | Source is hedged ('likely', 'possible'), a value is missing, or a date conflict was resolved by a builder rule. |
| `low` | SWF itself marks the value with '?', only one SWF table lists the row, or the report is an anonymous-source press account. |

**Legal rows.** `kind` is treaty, resolution, negotiation span, unilateral pledge, veto, or soft law. Soft-law manuals are marked (soft law) and are not binding.

## Quick lookup by state or actor

Row ids grouped by acting state (kinetic tests) or actor (non-kinetic operations). Counts are in brackets; ids match the tables below.

| state or actor | kinetic | non-kinetic |
|---|---|---|
| China | [13] cn-2005-sc19, cn-2006-sc19, cn-2007-fy1c, cn-2010-midcourse, cn-2013-midcourse, cn-2013-dn2, cn-2014-dn2, cn-2015-dn3, cn-2017-dn3, cn-2018-dn3, cn-2021-dn3, cn-2022-dn3, cn-2023-dn3 | [1] cn-2006-laser |
| India | [1] in-2019-shakti | - |
| Iran | - | [1] ir-2009-eutelsat |
| Iran (jamming from Cuba; later Bulgaria, Libya) | - | [1] ir-2003-telstar12 |
| Iraq | - | [1] iq-2003-gps |
| Israel and others (multiple actors) | - | [1] mideast-2023-gnss |
| North Korea | - | [1] kp-2010-gps |
| Russia | [12] ru-2014-nudol, ru-2015-nudol-apr, ru-2015-nudol, ru-2016-nudol-may, ru-2016-nudol-dec, ru-2018-nudol-mar, ru-2018-nudol-dec, ru-2019-nudol-jun, ru-2019-nudol-nov, ru-2020-nudol-apr, ru-2020-nudol-dec, ru-2021-cosmos1408 | [7] ru-2014-ukraine, ru-2016-syria, ru-2018-peresvet, ru-2018-trident, ru-2022-viasat, ru-2022-starlink, ru-2023-baltic |
| Russia (origin locations cited by ITU RRB) | - | [1] ru-2024-eu-sats |
| United States | [18] us-1959-bold-orion, us-1962-starfish-prime, us-1962-nike-zeus-wsmr, us-1963-nike-zeus-feb, us-1964-nike-zeus-jan, us-1964-p437-feb, us-1964-p437-mar, us-1964-p437-apr, us-1964-p437-may, us-1964-p437-nov, us-1965-p437-apr, us-1967-p437-mar, us-1968-p437-may, us-1968-p437-nov, us-1970-p437-mar, us-1984-asm135-jan, us-1985-solwind, us-2008-burnt-frost | [1] us-1997-miracl |

## Quick lookup by year

Counts per calendar year (kinetic by test date; non-kinetic and legal by start date). Years with no rows are omitted; see the Chart A gap note in `methodology.md` (section 3) for the quiet stretches after 1970 and 1985.

| year | kinetic | non-kinetic | legal |
|---|---|---|---|
| 1959 | 1 | - | - |
| 1962 | 2 | - | - |
| 1963 | 1 | - | 1 |
| 1964 | 6 | - | - |
| 1965 | 1 | - | - |
| 1967 | 1 | - | 1 |
| 1968 | 2 | - | - |
| 1970 | 1 | - | - |
| 1972 | - | - | 1 |
| 1981 | - | - | 1 |
| 1984 | 1 | - | - |
| 1985 | 1 | - | 1 |
| 1992 | - | - | 1 |
| 1997 | - | 1 | - |
| 2003 | - | 2 | - |
| 2005 | 1 | - | - |
| 2006 | 1 | 1 | - |
| 2007 | 1 | - | - |
| 2008 | 1 | - | 1 |
| 2009 | - | 1 | - |
| 2010 | 1 | 1 | - |
| 2013 | 2 | - | - |
| 2014 | 2 | 1 | 1 |
| 2015 | 3 | - | - |
| 2016 | 2 | 1 | - |
| 2017 | 1 | - | 1 |
| 2018 | 3 | 2 | - |
| 2019 | 3 | - | - |
| 2020 | 2 | - | 1 |
| 2021 | 2 | - | - |
| 2022 | 1 | 2 | 4 |
| 2023 | 1 | 2 | - |
| 2024 | - | 1 | 3 |
| 2025 | - | - | 2 |

## Kinetic events (chronological)

**44 rows.**

| date | id | state | system | target | type | alt (km) | kind | cataloged | in orbit | conf | pin | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1959-10-13 | us-1959-bold-orion | United States | Bold Orion | Explorer 6 | flyby | 200 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [1](#n1) |
| 1962-07-09 | us-1962-starfish-prime | United States | Thor / W49 (Operation Fishbowl) | None (high-altitude nuclear test) | nuclear | 400 | detonation | - | - | medium | [us-1962-starfish-prime]: Table of U.S. nuclear tests, Starfish Prime row (Operation Fishbowl, 07/09/1962, "High altitude - 250 miles", 1.4 Mt), PDF pp. 41-42; secondary: SWF p. 12-05 (PDF p. 269) | [2](#n2) |
| 1962-12-17 | us-1962-nike-zeus-wsmr | United States | Program 505 (Nike Zeus) | None | non_destructive | 160 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [3](#n3) |
| 1963-02-15 | us-1963-nike-zeus-feb | United States | Program 505 (Nike Zeus) | None | non_destructive | 241 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [4](#n4) |
| 1964-01-04 | us-1964-nike-zeus-jan | United States | Program 505 (Nike Zeus) | None (simulated target) | non_destructive | 146 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [5](#n5) |
| 1964-02-14 | us-1964-p437-feb | United States | Program 437 (Thor) | Transit 2A rocket body | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [6](#n6) |
| 1964-03-01 | us-1964-p437-mar | United States | Program 437 (Thor) | Unknown | non_destructive | 674 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [7](#n7) |
| 1964-04-21 | us-1964-p437-apr | United States | Program 437 (Thor) | Unknown | non_destructive | 778 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [8](#n8) |
| 1964-05-28 | us-1964-p437-may | United States | Program 437 (Thor) | Unknown | non_destructive | 932 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [9](#n9) |
| 1964-11-16 | us-1964-p437-nov | United States | Program 437 (Thor) | Unknown | non_destructive | 1148 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [10](#n10) |
| 1965-04-05 | us-1965-p437-apr | United States | Program 437 (Thor) | Transit 2A rocket body | non_destructive | 826 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [11](#n11) |
| 1967-03-30 | us-1967-p437-mar | United States | Program 437 (Thor) | Unknown debris object | non_destructive | 484 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [12](#n12) |
| 1968-05-15 | us-1968-p437-may | United States | Program 437 (Thor) | Unknown | non_destructive | 823 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [13](#n13) |
| 1968-11-21 | us-1968-p437-nov | United States | Program 437 (Thor) | Unknown | non_destructive | 1158 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73) | [14](#n14) |
| 1970-03-28 | us-1970-p437-mar | United States | Program 437 (Thor) | Unknown satellite | non_destructive | 1074 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73) | [15](#n15) |
| 1984-01-21 | us-1984-asm135-jan | United States | ASM-135 (F-15) | None | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73) | [16](#n16) |
| 1985-09-13 | us-1985-solwind | United States | ASM-135 (F-15) | Solwind P78-1 | destructive | 530 | intercept | 285 | 0 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-22 (PDF p. 71); Table 1-4, p. 01-24 (PDF p. 73) | [17](#n17) |
| 2005-07-05 | cn-2005-sc19 | China | SC-19 | None known | non_destructive | - | apogee | - | - | medium | Table 16-3, p. 16-04 (PDF p. 308) | [18](#n18) |
| 2006-02-06 | cn-2006-sc19 | China | SC-19 | None known | non_destructive | - | apogee | - | - | medium | Table 16-3, p. 16-04 (PDF p. 308) | [19](#n19) |
| 2007-01-11 | cn-2007-fy1c | China | SC-19 | Fengyun-1C | destructive | 880 | intercept | 3532 | 2351 | high | Table 5-1, p. 05-01 (PDF p. 212) | [20](#n20) |
| 2008-02-20 | us-2008-burnt-frost | United States | SM-3 (USS Lake Erie) | USA-193 | destructive | 220 | intercept | 175 | 0 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-24 (PDF p. 73); Table 1-4, p. 01-24 (PDF p. 73) | [21](#n21) |
| 2010-01-11 | cn-2010-midcourse | China | SC-19 | CSS-X-11 ballistic missile | midcourse_intercept | 250 | intercept | - | - | high | Table 3-3, p. 03-22 (PDF p. 183) | [22](#n22) |
| 2013-01-27 | cn-2013-midcourse | China | Possible SC-19 | Unknown ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [23](#n23) |
| 2013-05-13 | cn-2013-dn2 | China | Possible DN-2 | None known | apogee_only | 30000 | apogee | - | - | medium | Prose p. 03-20 (PDF p. 181); Table 3-3, p. 03-22 (PDF p. 183) | [24](#n24) |
| 2014-07-23 | cn-2014-dn2 | China | Possible DN-2 | Likely ballistic missile | non_destructive | - | apogee | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [25](#n25) |
| 2014-08-12 | ru-2014-nudol | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307) | [26](#n26) |
| 2015-04-22 | ru-2015-nudol-apr | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307) | [27](#n27) |
| 2015-10-30 | cn-2015-dn3 | China | Possible DN-3 | None known | non_destructive | - | apogee | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [28](#n28) |
| 2015-11-18 | ru-2015-nudol | Russia | Nudol | None | non_destructive | 200 | apogee | - | - | low | Table 2-4, p. 02-21 (PDF p. 134) | [29](#n29) |
| 2016-05-25 | ru-2016-nudol-may | Russia | Nudol | None | non_destructive | 100 | apogee | - | - | low | Table 2-4, p. 02-21 (PDF p. 134) | [30](#n30) |
| 2016-12-16 | ru-2016-nudol-dec | Russia | Nudol | None | non_destructive | 100 | apogee | - | - | low | Table 2-4, p. 02-21 (PDF p. 134) | [31](#n31) |
| 2017-07-23 | cn-2017-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [32](#n32) |
| 2018-02-05 | cn-2018-dn3 | China | Possible DN-3 | CSS-5 ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [33](#n33) |
| 2018-03-26 | ru-2018-nudol-mar | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [34](#n34) |
| 2018-12-23 | ru-2018-nudol-dec | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [35](#n35) |
| 2019-03-27 | in-2019-shakti | India | PDV Mk-II (Mission Shakti) | Microsat-R | destructive | 300 | intercept | 130 | 0 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 04-04 (PDF p. 204) | [36](#n36) |
| 2019-06-14 | ru-2019-nudol-jun | Russia | Nudol | None | non_destructive | - | apogee | - | - | low | Table 16-2, p. 16-03 (PDF p. 307) | [37](#n37) |
| 2019-11-15 | ru-2019-nudol-nov | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); prose p. 02-21 (PDF p. 134) | [38](#n38) |
| 2020-04-15 | ru-2020-nudol-apr | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [39](#n39) |
| 2020-12-16 | ru-2020-nudol-dec | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [40](#n40) |
| 2021-02-04 | cn-2021-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183); prose p. 03-21 (PDF p. 182) | [41](#n41) |
| 2021-11-15 | ru-2021-cosmos1408 | Russia | Nudol (PL-19) | Cosmos 1408 | destructive | 470 | intercept | 1807 | 5 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 02-21 (PDF p. 134) | [42](#n42) |
| 2022-06-21 | cn-2022-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Prose p. 03-21 (PDF p. 182); Table 16-3, p. 16-04 (PDF p. 308); Table 3-3, p. 03-22 (PDF p. 183) | [43](#n43) |
| 2023-04-14 | cn-2023-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [44](#n44) |

## Non-kinetic events (by start date)

**15 rows.**

| start | end | id | actor | category | attribution | target regime | operational | conf | pin | note |
|---|---|---|---|---|---|---|---|---|---|---|
| 1997-10-17 | 1997-10-17 | us-1997-miracl | United States | directed_energy | official_government | ISR_LEO | False | high | MIRACL passage, p. 01-35 (PDF p. 84) | [45](#n45) |
| 2003-01-01 | 2006-12-31 | ir-2003-telstar12 | Iran (jamming from Cuba; later Bulgaria, Libya) | ew_uplink | alleged | GEO_comms | False | medium | Iranian EW passage, p. 09-05 (PDF p. 247) | [46](#n46) |
| 2003-03-20 | 2003-03-25 | iq-2003-gps | Iraq | gnss_jamming | official_government | GNSS_MEO | True | medium | [iq-2003-gps]: Briefing transcript, answer on GPS jammers | [47](#n47) |
| 2006-01-01 | 2006-01-01 | cn-2006-laser | China | directed_energy | alleged | ISR_LEO | False | low | Chinese DE section, text at fn. 207, p. 03-26 (PDF p. 187) | [48](#n48) |
| 2009-01-01 | 2012-12-31 | ir-2009-eutelsat | Iran | ew_uplink | multi_government | GEO_comms | False | medium | Iranian EW passage, text above fn. 58, p. 09-06 (PDF p. 248) | [49](#n49) |
| 2010-08-23 | ongoing | kp-2010-gps | North Korea | gnss_jamming | official_government | GNSS_MEO | False | high | Section 12.3, p. 12-05 to 12-06 (PDF p. 269-270) | [50](#n50) |
| 2014-03-01 | ongoing | ru-2014-ukraine | Russia | gnss_spoofing | researcher_osint | GNSS_MEO | True | high | GNSS passages, C4ADS report at fn. 220, p. 02-27 to 02-28 (PDF p. 140-141) | [51](#n51) |
| 2016-02-01 | ongoing | ru-2016-syria | Russia | gnss_jamming | researcher_osint | GNSS_MEO | True | medium | C4ADS passage, p. 02-28 (PDF p. 141) | [52](#n52) |
| 2018-03-01 | 2018-03-01 | ru-2018-peresvet | Russia | directed_energy | official_government | ISR_LEO | False | medium | Peresvet section, p. 02-36 (PDF p. 149) | [53](#n53) |
| 2018-10-25 | 2018-11-07 | ru-2018-trident | Russia | gnss_jamming | official_government | GNSS_MEO | False | high | text above fn. 217-218, p. 02-28 (PDF p. 141) | [54](#n54) |
| 2022-02-24 | 2022-02-24 | ru-2022-viasat | Russia | cyber | multi_government | ground_segment | True | high | Viasat case study, p. 15-06 to 15-07 (PDF p. 292-293) | [55](#n55) |
| 2022-03-01 | ongoing | ru-2022-starlink | Russia | ew_downlink | alleged | LEO_constellation | True | medium | Starlink passage, fns. 259-261, p. 02-32 (PDF p. 145) | [56](#n56) |
| 2023-10-01 | ongoing | mideast-2023-gnss | Israel and others (multiple actors) | gnss_spoofing | official_government | GNSS_MEO | True | medium | Section 10.3, p. 10-01 to 10-02 (PDF p. 254-255) | [57](#n57) |
| 2023-12-01 | ongoing | ru-2023-baltic | Russia | gnss_jamming | multi_government | GNSS_MEO | True | high | Baltic GNSS passages, p. 02-29 to 02-30 (PDF p. 142-143) | [58](#n58) |
| 2024-03-01 | ongoing | ru-2024-eu-sats | Russia (origin locations cited by ITU RRB) | ew_uplink | multi_government | GEO_comms | True | high | ITU RRB passage, fn. 272, p. 02-32 (PDF p. 145) | [59](#n59) |

## Legal items (by start date)

**19 rows.**

| start | end | id | kind | label | citation |
|---|---|---|---|---|---|
| 1963-08-05 | - | ltbt-1963 | treaty | Limited Test Ban Treaty | Treaty Banning Nuclear Weapon Tests in the Atmosphere, in Outer Space and Under Water, Aug. 5, 1963, 14 U.S.T. 1313, 480 U.N.T.S. 43. |
| 1967-01-27 | - | ost-1967 | treaty | Outer Space Treaty | Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205. |
| 1972-05-26 | - | abm-1972 | treaty | ABM Treaty Art. XII | Treaty on the Limitation of Anti-Ballistic Missile Systems, U.S.-U.S.S.R., art. XII, May 26, 1972, 23 U.S.T. 3435. |
| 1981-12-09 | - | paros-1981 | negotiation_span | PAROS (UNGA agenda item) | G.A. Res. 36/97 (C) (Dec. 9, 1981); G.A. Res. 36/99 (Dec. 9, 1981). |
| 1985-03-29 | 1994-08-23 | cd-paros-committee | negotiation_span | CD Ad Hoc Committee on PAROS | Conference on Disarmament, Report of the Ad Hoc Committee on Prevention of an Arms Race in Outer Space, CD/1271 (Aug. 24, 1994); see UNIDIR, The Conference on Disarmament and the Prevention of an Arms Race in Outer Space. |
| 1992-12-22 | - | itu-1992 | treaty | ITU Constitution Arts. 45 & 48 | Constitution of the International Telecommunication Union arts. 45, 48, Dec. 22, 1992, 1825 U.N.T.S. 331, 361-62. |
| 2008-02-12 | - | ppwt-2008 | negotiation_span | PPWT draft (Russia-China) | Draft Treaty on the Prevention of the Placement of Weapons in Outer Space, CD/1839 (Feb. 29, 2008) (tabled at the CD Feb. 12, 2008). |
| 2014-06-10 | - | ppwt-2014 | negotiation_span | PPWT updated draft | Updated Draft PPWT, CD/1985 (June 12, 2014) (tabled at the CD June 10, 2014). |
| 2017-02-01 | - | tallinn-2017 | unilateral (soft law) | Tallinn Manual 2.0 (soft law) | Tallinn Manual 2.0 on the International Law Applicable to Cyber Operations (Michael N. Schmitt ed., Cambridge Univ. Press 2017). |
| 2020-12-07 | - | unga-75-36 | resolution | UNGA 75/36 | G.A. Res. 75/36 (Dec. 7, 2020). |
| 2022-04-18 | - | us-moratorium-2022 | unilateral | US DA-ASAT test moratorium | The White House, Fact Sheet: Vice President Harris Advances National Security Norms in Space (Apr. 18, 2022); SWF 2026, p. 01-50. |
| 2022-05-09 | 2023-09-01 | oewg-2022 | negotiation_span | OEWG on space threats | G.A. Res. 76/231 (Dec. 24, 2021) (establishing OEWG, 2022-2023). |
| 2022-07-01 | - | milamos-2022 | unilateral (soft law) | McGill (MILAMOS) Manual Vol. I (soft law) | McGill Manual on International Law Applicable to Military Uses of Outer Space, Vol. I - Rules (Ram S. Jakhu & Steven Freeland eds., McGill Centre for Research in Air & Space Law 2022). |
| 2022-12-07 | - | unga-77-41 | resolution | UNGA 77/41 (DA-ASAT tests) | G.A. Res. 77/41 (Dec. 7, 2022). |
| 2024-01-01 | - | woomera-2024 | unilateral (soft law) | Woomera Manual (soft law) | The Woomera Manual on the International Law of Military Space Operations (Jack Beard & Dale Stephens eds., Oxford Univ. Press 2024). |
| 2024-04-24 | - | unsc-veto-2024 | veto | Russian veto: nuclear weapons in orbit | U.N. SCOR, 79th Sess., 9616th mtg., U.N. Doc. S/PV.9616 (Apr. 24, 2024); draft S/2024/302. |
| 2024-07-01 | - | itu-rrb-2024 | resolution | ITU RRB: 'grave concern' (Sweden, France) | ITU Radio Regulations Board, 96th Meeting (June 24-28, 2024), Summary of Decisions (issued July 1, 2024); quoted in SWF 2026, p. 02-32 (PDF p. 145). |
| 2025-10-03 | - | icao-2025 | resolution | ICAO: GNSS interference an 'infraction' of the Chicago Convention | ICAO, ICAO Assembly Condemns GNSS Radio Frequency Interference Originating from the DPRK and the Russian Federation (Oct. 3, 2025); reported in SWF 2026, pp. 02-30, 12-06. |
| 2025-11-10 | - | itu-rrb-2025 | resolution | ITU RRB 100th meeting: urges Russia to cease RNSS interference | ITU Radio Regulations Board, 100th Meeting (Nov. 10-14, 2025), Harmful Interference to the Radionavigation-Satellite Service (RNSS); quoted in SWF 2026, p. 02-30 (PDF p. 143), fn. 245. |

## Conflicts inside the sources

**8 rows.**

Where SWF (or a source) disagrees with itself, the row keeps one value under a stated rule and records the other here and in the row's `conflicts` field. Rule: Table 5-1 for intercept altitude and debris counts; the appendix or announcement date where two SWF places outvote a table.

| id | conflict | note |
|---|---|---|
| us-1985-solwind | Intercept altitude: 530 km (Table 5-1, p. 05-01) vs 555 km (prose p. 01-22; Table 1-4 p. 01-24) | [17](#n17) |
| cn-2005-sc19 | Date: 5 July (Table 16-3, p. 16-04) vs 7 July (Table 3-3, p. 03-22) | [18](#n18) |
| cn-2007-fy1c | Altitude/pieces: 880 km, 3,532 (Table 5-1, p. 05-01) vs 865 km apogee, 3,533 (Table 3-3, p. 03-22) | [20](#n20) |
| us-2008-burnt-frost | Intercept altitude: 220 km (Table 5-1, p. 05-01) vs 240 km (prose p. 01-24) vs 2,700 km apogee column (Table 1-4, p. 01-24) | [21](#n21) |
| cn-2013-dn2 | Apogee: 10,000 km (CAS) vs 'nearly to GEO' (US military; GEO is 35,786 km) vs at least ~30,000 km (analysis cited by SWF) | [24](#n24) |
| ru-2015-nudol | Date: 18 Nov 2015 (Table 2-4, p. 02-21) vs 18 Oct 2015 (Table 16-2, p. 16-03) | [29](#n29) |
| cn-2022-dn3 | Date: 21 June (prose p. 03-21; Table 16-3 p. 16-04) vs 19 June (Table 3-3, p. 03-22) | [43](#n43) |
| cn-2023-dn3 | Date: 14 April 2023 (Table 3-3, p. 03-22; prose p. 03-21) vs 14 and 15 April both listed (Table 16-3, p. 16-04) | [44](#n44) |

## Endnotes

**59 notes.** Numbered in table order; each table row points here by number. Format: number, row id, date, note.

<a id="n1"></a>**1. us-1959-bold-orion** (1959-10-13). SWF Table 1-4: "Success (passed within kill radius)" alongside "Unknown results due to loss of telemetry"; launch site listed as Unknown.

<a id="n2"></a>**2. us-1962-starfish-prime** (1962-07-09). 1.4 Mt at ~250 miles (~400 km) near Johnston Island. SWF p. 12-05 (PDF p. 269): such tests are known to have damaged or destroyed satellites in orbit. Not in SWF DA-ASAT tables; included only as the nuclear marker the legal band references.

<a id="n3"></a>**3. us-1962-nike-zeus-wsmr** (1962-12-17). Reached designated point in space.

<a id="n4"></a>**4. us-1963-nike-zeus-feb** (1963-02-15). Intercept of designated point in space.

<a id="n5"></a>**5. us-1964-nike-zeus-jan** (1964-01-04). Successful intercept of simulated satellite target.

<a id="n6"></a>**6. us-1964-p437-feb** (1964-02-14). Passed within kill radius. SWF p. 01-21 (PDF p. 70): Program 437 was designed around a 1.4 Mt W49 warhead.

<a id="n7"></a>**7. us-1964-p437-mar** (1964-03-01). Backup missile passed within kill radius.

<a id="n8"></a>**8. us-1964-p437-apr** (1964-04-21). Passed within kill radius.

<a id="n9"></a>**9. us-1964-p437-may** (1964-05-28). Failed (missed intercept point).

<a id="n10"></a>**10. us-1964-p437-nov** (1964-11-16). Combat test launch; passed within kill radius.

<a id="n11"></a>**11. us-1965-p437-apr** (1965-04-05). Passed within kill radius.

<a id="n12"></a>**12. us-1967-p437-mar** (1967-03-30). Combat evaluation launch.

<a id="n13"></a>**13. us-1968-p437-may** (1968-05-15). Combat evaluation launch.

<a id="n14"></a>**14. us-1968-p437-nov** (1968-11-21). Combat evaluation launch.

<a id="n15"></a>**15. us-1970-p437-mar** (1970-03-28). Passed within kill radius.

<a id="n16"></a>**16. us-1984-asm135-jan** (1984-01-21). Missile test, no target.

<a id="n17"></a>**17. us-1985-solwind** (1985-09-13). Conflict inside SWF 2026: Table 5-1 gives 530 km intercept; the prose (p. 01-22, PDF p. 71) and Table 1-4 (p. 01-24, PDF p. 73) give 555 km. Builder uses Table 5-1 for all intercept altitudes. Tracked-debris count (285) is from Table 5-1. The zero 'still on orbit' figure could not be tied to this row in the jumbled Table 5-1 text extraction, so it is shown in tables only and is not plotted.

<a id="n18"></a>**18. cn-2005-sc19** (2005-07-05). Likely rocket test. Altitude not reported. SWF Table 3-3 (p. 03-22) dates it 7 July; Appendix Table 16-3 (p. 16-04) dates it 5 July. Appendix date used.

<a id="n19"></a>**19. cn-2006-sc19** (2006-02-06). Likely near-miss of orbital target. Altitude not reported. Same date in Table 3-3 (p. 03-22, PDF p. 183).

<a id="n20"></a>**20. cn-2007-fy1c** (2007-01-11). Largest debris-generating event on record. Conflict inside SWF 2026: Table 5-1 gives 880 km and 3,532 tracked pieces; Table 3-3 gives 865 km apogee and 3,533 pieces. Table 5-1 used for consistency with the other intercepts.

<a id="n21"></a>**21. us-2008-burnt-frost** (2008-02-20). Missile-defense interceptor (SM-3) used against a satellite: the case shows the ballistic missile defense / ASAT overlap. Date is 20 Feb 2008 US Eastern time (21 Feb UTC). Debris did not re-enter within weeks: SWF p. 01-24 (PDF p. 73) says the 175 trackable pieces 'took about 20 months to de-orbit entirely' (Table 5-1 lifespan column: 1.7 years). Altitude conflict inside SWF: the prose on p. 01-24 says 240 km, while Table 5-1 (p. 05-01) says 220 km; Table 1-4 (p. 01-24) lists 2,700 km in its apogee column (interceptor reach, not intercept). Table 5-1 (220 km) used, per the builder rule.

<a id="n22"></a>**22. cn-2010-midcourse** (2010-01-11). Destruction of suborbital target; no orbital debris.

<a id="n23"></a>**23. cn-2013-midcourse** (2013-01-27). Suborbital intercept; altitude not reported.

<a id="n24"></a>**24. cn-2013-dn2** (2013-05-13). Not an intercept. Chinese Academy of Sciences said 10,000 km; the US military said 'nearly to GEO' (36,000 km); technical analysis cited by SWF (p. 03-20) puts apogee at least ~30,000 km. Builder plots ~30,000 km (SWF Table 3-3 value).

<a id="n25"></a>**25. cn-2014-dn2** (2014-07-23). SWF Table 3-3 lists it as a likely intercept test with a likely ballistic-missile target. Type 'non_destructive' is the builder's coding: SWF reports no debris.

<a id="n26"></a>**26. ru-2014-nudol** (2014-08-12). Failed shortly after launch (SWF Table 2-4 note). Appendix Table 16-2 lists the date as a rocket test (unsuccessful). No apogee reported.

<a id="n27"></a>**27. ru-2015-nudol-apr** (2015-04-22). Failed at launch (SWF Table 2-4 note). Appendix Table 16-2 lists the date as a rocket test (unsuccessful). No apogee reported.

<a id="n28"></a>**28. cn-2015-dn3** (2015-10-30). Likely rocket test.

<a id="n29"></a>**29. ru-2015-nudol** (2015-11-18). First successful missile test. SWF marks the 200 km apogee with '?'. Appendix Table 16-2 (p. 16-03) dates this test 18 Oct 2015; Table 2-4 gives 18 Nov 2015 (used).

<a id="n30"></a>**30. ru-2016-nudol-may** (2016-05-25). Likely rocket test. SWF marks the 100 km apogee with '?'.

<a id="n31"></a>**31. ru-2016-nudol-dec** (2016-12-16). Likely rocket test. SWF marks the 100 km apogee with '?'.

<a id="n32"></a>**32. cn-2017-dn3** (2017-07-23). Likely intercept test; reportedly malfunctioned.

<a id="n33"></a>**33. cn-2018-dn3** (2018-02-05). Likely intercept test.

<a id="n34"></a>**34. ru-2018-nudol-mar** (2018-03-26). First test from a mobile launcher.

<a id="n35"></a>**35. ru-2018-nudol-dec** (2018-12-23). Payload column: Likely KKV. Appendix Table 16-2 (p. 16-03): potential KKV, no intercept.

<a id="n36"></a>**36. in-2019-shakti** (2019-03-27). Indian officials said most debris would re-enter within days and all of it within 45 days at most (SWF p. 04-04); per SWF the final trackable piece re-entered in June 2022, 3.2 years after the test, and some pieces were thrown up to 2,250 km.

<a id="n37"></a>**37. ru-2019-nudol-jun** (2019-06-14). Listed only in Appendix Table 16-2 (not in Table 2-4), with the note 'Potential KKV, no intercept' (note paired to the row by column order in the text extraction). No apogee reported. Coded low confidence because a single table lists it.

<a id="n38"></a>**38. ru-2019-nudol-nov** (2019-11-15). Payload column: Likely KKV. SWF describes the Nov. 2021 test as the first known Nudol intercept (p. 02-21), so no earlier intercept is recorded; no apogee reported. Not in Appendix Table 16-2.

<a id="n39"></a>**39. ru-2020-nudol-apr** (2020-04-15). Successful, nothing hit. US Space Command issued a public statement on the test (SWF p. 02-20, fn. 148).

<a id="n40"></a>**40. ru-2020-nudol-dec** (2020-12-16). Successful, nothing hit. US Space Command issued a public statement (SWF p. 02-20, fn. 149).

<a id="n41"></a>**41. cn-2021-dn3** (2021-02-04). Announced by China as a 'land-based midcourse missile intercept technology test' (SWF p. 03-21, PDF p. 182).

<a id="n42"></a>**42. ru-2021-cosmos1408** (2021-11-15). ISS crew sheltered in docked vehicles. SWF text: more than 1,800 cataloged pieces, 5 still in orbit as of February 2026 (p. 02-21). Last destructive DA-ASAT test listed in SWF 2026 (Table 5-1); the report lists no later destructive test.

<a id="n43"></a>**43. cn-2022-dn3** (2022-06-21). SWF Table 3-3 gives 19 June 2022; the prose (p. 03-21) and Appendix Table 16-3 (p. 16-04) give 21 June 2022, the date of China's announcement. Prose/appendix date used.

<a id="n44"></a>**44. cn-2023-dn3** (2023-04-14). Likely intercept test. Table 3-3 and prose give 14 April 2023; Appendix Table 16-3 lists both 14 and 15 April 2023. 14 April used.

<a id="n45"></a>**45. us-1997-miracl** (1997-10-17). SWF gives October 1997 only. The exact day (17 Oct) is from FlightGlobal (Oct. 1997) and Arms Control Association reporting. The laser was fired at White Sands Missile Range, NM (SWF fn. 259 cites the WSMR High Energy Laser Systems Test Facility); MSTI-3 was a USAF experimental satellite that had completed its mission.

<a id="n46"></a>**46. ir-2003-telstar12** (2003-01-01). SWF: Iran 'has been accused'; the Telstar 12 jamming from Havana 'started in 2003' and similar jamming occurred from Bulgaria and Libya in 2005/2006. Attribution kept at 'alleged'. Day/month not given; span uses whole years (2006 end year = last year SWF dates for these third-country sites).

<a id="n47"></a>**47. iq-2003-gps** (2003-03-20). Not covered in SWF 2026 (Iraq is not one of SWF's 13 countries). Excluded from Chart B.

<a id="n48"></a>**48. cn-2006-laser** (2006-01-01). Point event (year only). Anonymous-source press report; kept low confidence and 'alleged'.

<a id="n49"></a>**49. ir-2009-eutelsat** (2009-01-01). Attribution coded 'multi_government' because an intergovernmental body (ITU) located the source in Iranian territory; ITU did not find the Iranian state responsible. SWF dates only the 2010 ITU action and Eutelsat's Oct. 2022 report of renewed jamming from Iran; the 2009 start follows Eutelsat's appeals from May 2009 (Eutelsat/HRW) and the 2012 end is the last year of the first documented phase, so the span understates the 2022 episode.

<a id="n50"></a>**50. kp-2010-gps** (2010-08-23). Terrestrial jamming of receivers, not an attack on GPS satellites (SWF p. 12-05: 'no impact on the GPS satellites themselves'). Campaign span, not individual incidents. SWF does not date the first episode; start is the first publicly known incident, 23 Aug 2010 (GPS World, Inside GNSS). Treated as ongoing (SWF p. 12-06: Nov. 2024 interference; Oct. 2025 ICAO finding).

<a id="n51"></a>**51. ru-2014-ukraine** (2014-03-01). Attribution level follows the C4ADS open-source report SWF relies on (p. 02-28: nearly 10,000 suspected incidents in Russia, Crimea and Syria); governments have also blamed Russia, but the source for the span is OSINT. Covers jamming and spoofing. SWF's cited pages do not date the start: the March 2014 start is from external reporting that Russia has jammed GPS in eastern Ukraine since the 2014 Crimea conflict (Breaking Defense; Foreign Policy, Oct. 2015).

<a id="n52"></a>**52. ru-2016-syria** (2016-02-01). SWF p. 02-28: 'The spoofing began in 2016, peaked in 2017'. The ledger uses 2016 at medium confidence.

<a id="n53"></a>**53. ru-2018-peresvet** (2018-03-01). Named in Putin's 1 March 2018 speech (SWF p. 02-36); SWF describes it as appearing designed to protect mobile ICBMs from being imaged. Self-declared by the Russian government; no public evidence of use against a satellite.

<a id="n54"></a>**54. ru-2018-trident** (2018-10-25). SWF does not name the exercise or give dates: it says (Nov. 2018) media reported jamming in Norway and Finland during a major NATO exercise, and that Norway's government claimed in March 2019 it had proof of Russian interference. Dates 25 Oct - 7 Nov 2018 are the Trident Juncture exercise window (NATO; Norway's ministry put the jamming at 16 Oct - 7 Nov). Coded 'official_government' on Norway's claim; Finland only expressed concern (external reporting).

<a id="n55"></a>**55. ru-2022-viasat** (2022-02-24). Timing: SWF p. 15-06 says 'within hours' of Russian troops crossing the border; p. 15-07 adds that independent analysts noted it began one hour before the first troops crossed. Publicly attributed to the GRU by the United States, United Kingdom and European Union in May 2022 (p. 15-07).

<a id="n56"></a>**56. ru-2022-starlink** (2022-03-01). SWF notes no independent validation of the type or magnitude of the jamming; coded 'alleged'.

<a id="n57"></a>**57. mideast-2023-gnss** (2023-10-01). Actor set is mixed: SWF p. 10-02 says it is hard to tell from open sources whether Israel, Hamas or others conduct the EW. The IDF stated publicly it was jamming GPS 'in a proactive manner for various operational needs'; Lebanon blamed Israel (Mar. 2024). Coded at the level SWF supports for Israel; other actors not attributed. SWF (p. 10-01) also reports interference before the row's start, in spring 2023 (20% of regional aircraft in April 2023); the row starts at the Oct. 2023 escalation.

<a id="n58"></a>**58. ru-2023-baltic** (2023-12-01). SWF: interference 'picked up in late 2023 and early 2024'; start set to Dec 2023. Multi-government coding rests on the October 2025 ICAO resolution and ITU RRB findings (Nov 2025). Terrestrial jamming of receivers, not attacks on satellites.

<a id="n59"></a>**59. ru-2024-eu-sats** (2024-03-01). SWF p. 02-32: several European countries complained in spring 2024; the RRB (July 2024) said the interference 'seemed to originate' from earth stations near Moscow, Kaliningrad and Pavlovka. It described origin locations but made no state-responsibility finding; coded 'multi_government' because the ITU, an intergovernmental body, located the source.

## Capability coding (Chart B)

Cells give the number of states coded **D** (demonstrated) and **P** (developing or latent) per decade.

Rules:

1. **D** = the state has tested or used the capability. Once D, a state stays counted as D in later decades.
2. **P** = programs, R&D or latent capability (for example, missile defense with inherent ASAT reach).
3. The **2020s** column follows the SWF 2026 chapter sections for its 13 countries. **Earlier decades are the builder's reconstruction** and are labeled that way on the chart; they are not SWF-assessed.
4. Iraq is outside SWF's 13 countries, so the 2003 GNSS-jamming event is excluded from this chart.
5. SWF's 2020s country matrix (Executive Summary) was read from the PDF's graphics. D entries all match it; some P entries for direct-ascent and co-orbital go beyond it (SWF shows "no data"), and the matrix has no cyber row. See `verification_log.md`, Open items and impact.

| category | 1950s | 1960s | 1970s | 1980s | 1990s | 2000s | 2010s | 2020s |
|---|---|---|---|---|---|---|---|---|
| direct_ascent | 1D/0P | 1D/0P | 1D/0P | 1D/0P | 1D/0P | 2D/1P | 4D/0P | 4D/7P |
| co_orbital | - | 1D/1P | 1D/0P | 2D/0P | 1D/1P | 2D/1P | 3D/0P | 3D/8P |
| electronic_warfare | - | - | - | 0D/2P | 1D/1P | 3D/1P | 4D/4P | 6D/6P |
| directed_energy | - | - | 0D/2P | 0D/2P | 1D/1P | 1D/2P | 2D/1P | 2D/5P |
| cyber | - | - | - | - | - | 0D/3P | 0D/7P | 1D/6P |

**2020s membership.**

- direct_ascent: D = United States, China, Russia, India; P = Israel, Japan, South Korea, Iran, North Korea, France, Germany.
- co_orbital: D = USSR/Russia, United States, China; P = India, France, Germany, Iran, Israel, Japan, North Korea, United Kingdom.
- electronic_warfare: D = United States, USSR/Russia, China, Iran, North Korea, Israel; P = India, France, Australia, Germany, Japan, South Korea.
- directed_energy: D = United States, USSR/Russia; P = China, India, France, Germany, Israel.
- cyber: D = USSR/Russia; P = United States, China, Iran, North Korea, Israel, France.

Category sources:

- **direct_ascent**: SWF 2026 Tables 1-4, 2-4, 3-3, 4-1 and Appendix 16; chapter sections x.2 (pp. 06-01 to 14-01).
- **co_orbital**: SWF 2026 Table 2-1, Appendix Table 16-1/16-2 (Delta 180, IS, Naryad), chapter sections x.1.
- **electronic_warfare**: SWF 2026 chapter sections x.3 (e.g., pp. 01-26, 02-25, 09-05, 10-02, 12-05); Telstar 12 (09-05).
- **directed_energy**: SWF 2026 chapter sections x.4 (pp. 01-33 to 01-35 US incl. MIRACL, 02-34 to 02-36 Russia incl. Peresvet, 03-26 China).
- **cyber**: SWF 2026 ch. 15, p. 15-02 (US, Russia, China, France, Iran, Israel, North Korea); Viasat pp. 15-06 to 15-07.

## Sources

- [SWF]: Victoria Samson & Kathleen Brett eds., Global Counterspace Capabilities: An Open Source Assessment (Secure World Foundation, 9th ed., Apr. 2026), https://cdn.prod.website-files.com/66dcc6872f6ed23bce1db235/69d5402700ec843d95073a1e_SWF_Global_Counterspace_Capabilities_2026.pdf
- [iq-2003-gps]: American Forces Press Service, CENTCOM Charts Operation Iraqi Freedom Progress (Mar. 25, 2003) (briefing by Maj. Gen. Victor Renuart), https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm
- [us-1962-starfish-prime]: U.S. Dep't of Energy, Nat'l Nuclear Sec. Admin. Nevada Field Office, United States Nuclear Tests, July 1945 through September 1992, DOE/NV-209 Rev. 16 (Sept. 2015), https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf

Legal items carry their own full citation in the table above (`citation` field in `data/legal.json`).
