# Counterspace Timeline Ledger

*Ledger as of 2026-09-29. Schema 1.2.0. Generated file: edit `tools/ledger/rows.py`, not this page.*

## Preface

**Purpose.** This ledger is the reference dataset behind the Counterspace Timeline. It records 61 kinetic tests, 15 non-kinetic operations, 68 co-orbital rows and 19 legal items, and gives each one a source and a pin to the page that supports it. It exists so that any figure on the page can be traced to its source in one step, and so that places where the source disagrees with itself are visible instead of silently resolved.

**How to use it.** Start with [Key figures](#key-figures) for the destructive tests and the size of the dataset. Read [How to read the tables](#how-to-read-the-tables) once for the terms and the pin format. Then look a row up by state or year, or go to the full tables. Long explanations are collected in the numbered [Endnotes](#endnotes); a table row points to its endnote by number, for example [1](#n1). Where sources conflict, see [Conflicts inside the sources](#conflicts-inside-the-sources).

**How to cite it.** Cite the primary source for any figure, and this ledger for the coding. For a row, give its id and its pin, for example: *Counterspace Timeline Ledger, row `cn-2007-fy1c` (ledger as of 2026-09-29), citing SWF 2026, Table 5-1, p. 05-01.* Do not cite the ledger alone for a debris count or an altitude. Verification status is in `verification_log.md`; coding decisions are in `methodology.md`.

## Contents

- [Key figures](#key-figures)
- [How to read the tables](#how-to-read-the-tables)
- [Quick lookup by state or actor](#quick-lookup-by-state-or-actor)
- [Quick lookup by year](#quick-lookup-by-year)
- [Kinetic events (chronological)](#kinetic-events-chronological) (61 rows)
- [Non-kinetic events (by start date)](#non-kinetic-events-by-start-date) (15 rows)
- [Co-orbital events (by start date)](#co-orbital-events-by-start-date) (68 rows)
- [Legal items (by start date)](#legal-items-by-start-date) (19 rows)
- [Conflicts inside the sources](#conflicts-inside-the-sources) (13 rows)
- [Endnotes](#endnotes) (123 notes)
- [Capability coding (Chart B)](#capability-coding-chart-b) (5 categories)
- [Sources](#sources)

## Key figures

**Destructive direct-ascent (DA-ASAT) tests.** These are the 5 direct-ascent tests in the ledger that created cataloged fragments. Fragment counts are as of 2026-02 (SWF Table 5-1); altitude is the intercept altitude in that table.

| date | state | system | target | altitude (km) | cataloged fragments | fragments in orbit | pin | endnote |
|---|---|---|---|---|---|---|---|---|
| 1985-09-13 | United States | ASM-135 (F-15) | Solwind P78-1 | 530 | 285 | 0 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-22 (PDF p. 71); Table 1-4, p. 01-24 (PDF p. 73) | [30](#n30) |
| 2007-01-11 | China | SC-19 | Fengyun-1C | 880 | 3,532 | 2,351 | Table 5-1, p. 05-01 (PDF p. 212) | [35](#n35) |
| 2008-02-20 | United States | SM-3 (USS Lake Erie) | USA-193 | 220 | 175 | 0 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-24 (PDF p. 73); Table 1-4, p. 01-24 (PDF p. 73) | [36](#n36) |
| 2019-03-27 | India | PDV Mk-II (Mission Shakti) | Microsat-R | 300 | 130 | 0 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 04-04 (PDF p. 204) | [52](#n52) |
| 2021-11-15 | Russia | Nudol (PL-19) | Cosmos 1408 | 470 | 1,807 | 5 | Table 5-1, p. 05-01 (PDF p. 212); prose p. 02-21 (PDF p. 134) | [59](#n59) |
| **Total** | | | | | **5,929** | **2,356** | | |

**What is counted.** The table lists the 5 destructive **direct-ascent** tests, the only destructive tests that are ledger rows. SWF (Table 5-1, p. 05-01 (PDF p. 212)) lists 16 destructive ASAT tests in all: these 5 plus **11 co-orbital** destructive tests (10 Soviet/Russian, 1 US: the Delta 180 intercept of 5 Sep 1986), which created 975 cataloged fragments (417 still on orbit) and are outside the ledger's kinetic rows. Direct-ascent plus co-orbital: 5 + 11 = 16. SWF reports no destructive DA-ASAT test after 15 Nov 2021.

**Size and quality of the dataset.**

| set | rows | notes |
|---|---|---|
| Kinetic events | 61 | 5 destructive; 33 high confidence |
| Non-kinetic events | 15 | 7 high confidence |
| Co-orbital events | 68 | 46 high confidence; RPO, docking, capture/tow, release and spaceplane-mission rows (not attacks) |
| Legal items | 19 | 3 soft law |
| Documented source conflicts | 13 | listed in [Conflicts inside the sources](#conflicts-inside-the-sources) |
| Capability categories | 5 | Chart B; 2020s follows SWF, earlier decades are reconstructed |
| Schema version | 1.2.0 | `data/schema.json` |

**Sources.** Primary: Secure World Foundation, *Global Counterspace Capabilities: An Open Source Assessment*, 9th ed. (April 2026), cited as SWF 2026. CSIS *Space Threat Assessment 2025* was consulted for background only; no row, pin or citation depends on it. Verification is recorded in `verification_log.md`.

## How to read the tables

**Scope and selection.** Scope rule: every direct-ascent anti-satellite (DA-ASAT) test that SWF 2026 lists in Table 1-4 (US), Tables 2-4 and 16-2 (Russia), Tables 3-3 and 16-3 (China) and Tables 4-1 and 16-4 (India) is an entry on this page, including failures, rocket-only tests and tests against a star or no target. Exclusions, all disclosed: co-orbital tests (Table 1-4 also lists the US Delta 180 co-orbital intercept of 5 Sep 1986, which SWF's text calls a co-orbital experiment; Table 16-2's Soviet IS, Naryad, Polyot and Cosmos 2521/2536 entries), and the Table 16-3 line 'Apr. 15, 2023' (treated as a date variant of the 14 Apr 2023 test; the conflict is noted in that test's entry). Starfish Prime (not a direct-ascent test in SWF's tables) is the one nuclear test added here. The US Table 1-4 has 33 rows; 32 are ledger rows and the one omitted row is the co-orbital Delta 180 test. 3 rows give SWF's month only (`date_precision: month`).

**Pins.** An SWF pin gives the table or passage, the printed section-page (for example `p. 05-01`) and the PDF page index (`PDF p. 212`). A non-SWF pin names the passage and starts with the source key in brackets, for example `[iq-2003-gps]`; the full cite is under [Sources](#sources). Where a row cites several places, all are listed.

**Terms.** *Destructive test*: an intercept that created cataloged fragments. *Cataloged fragments*: tracked pieces created by a test (generally larger than 10 cm). *Fragments in orbit*: those still on orbit as of 2026-02. *Altitude*: the figure named in the *kind* column (below). *Confidence*: how well the row is supported (below).

**Kinetic rows**

| field | meaning |
|---|---|
| id | Stable row key used by the page and by `related_events` in the legal items. |
| date | Test date (YYYY-MM-DD); month-only SWF dates use the 1st and `date_precision: month`. An endnote explains where sources differ. |
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

**Co-orbital rows.** Co-orbital rule: every line of SWF 2026 Table 1-3 (US close approaches), Table 2-3 (Russian close approaches) and Table 3-2 (Chinese close approaches), and every flight in Table 1-1 (X-37B) and Table 3-1 (Chinese reusable experimental spacecraft), is a row dated from the table (or from SWF's text where the entry says so and gives the reason). Two exceptions, both disclosed: (a) the Jan. 2022 USA 270 / Shiyan-12 approach is listed in both Table 1-3 and Table 3-2 and is one entry; (b) where SWF's text dates separate steps that a table folds into one line (SJ-21 with Compass G2; SJ-21 with SJ-25; the Cosmos 2542 release of Cosmos 2543; the SY-7 release of Payload A Debris; the GSSAP 'flanking' of SJ-21 and SJ-25), the text-dated step is its own entry and the entry says so. RPO rows record that a close approach happened as SWF reports it; they are not attacks, and SWF's wording on intent is hedged and kept in the entry.

| field | meaning |
|---|---|
| start / end | Span of the operation or mission; `ongoing` means SWF's April 2026 edition lists it as continuing. `date_precision` `month` or `year` means SWF gives only that much: start is the 1st (or 1 Jan.) and end the last day (or 31 Dec.). |
| actor / system / target | The chaser's operator; the acting spacecraft; the approached or released object (blank for a spaceplane mission). |
| activity | `capture_tow`, `rpo` (rendezvous or proximity operation), `docking`, `release` (a spacecraft releases or separates from another object) or `spaceplane_mission` (an X-37B or CSSHQ flight, launch to landing). |
| orbit regime | `LEO`, `GEO` (the belt or its immediate vicinity, including the disposal region), `HEO` or `not_stated`. |
| description | The builder's own summary. SWF's hedges ("possibly", "appeared to", "may") are kept, and no intent is coded: an RPO is not an attack. |

**Legal rows.** `kind` is treaty, resolution, negotiation span, unilateral pledge, veto, or soft law. Soft-law manuals are marked (soft law) and are not binding.

## Quick lookup by state or actor

Row ids grouped by acting state (kinetic tests) or actor (non-kinetic operations). Counts are in brackets; ids match the tables below.

| state or actor | kinetic | non-kinetic | co-orbital |
|---|---|---|---|
| China | [13] cn-2005-sc19, cn-2006-sc19, cn-2007-fy1c, cn-2010-midcourse, cn-2013-midcourse, cn-2013-dn2, cn-2014-dn2, cn-2015-dn3, cn-2017-dn3, cn-2018-dn3, cn-2021-dn3, cn-2022-dn3, cn-2023-dn3 | [1] cn-2006-laser | [24] cn-2008-bx1-sz7, cn-2010-sj12-sj06f, cn-2013-sy7-sj15-cx3, cn-2013-sy7-release, cn-2016-sj17-chinasat, cn-2019-tjs3-akm, cn-2019-tjs3-roaming, cn-2020-sj17-chinasat6b-sj20, cn-2020-csshq1, cn-2022-sj21-compass-g2, cn-2022-sj6-05a-05b, cn-2022-csshq2, cn-2022-pts2-object-j, cn-2023-sj17-venesat1, cn-2023-csshq3, cn-2024-sj23-akm, cn-2024-sy24c-sj6, cn-2024-pts3-object-g, cn-2025-sj21-sj25-rpo, cn-2025-sj21-sj25-docking, cn-2025-sy12-02-usa336, cn-2025-sj21-sj25-undock, cn-2025-sj21-sj25-rpo-dec, cn-2026-csshq4 |
| India | [2] in-2019-shakti-feb, in-2019-shakti | - | - |
| Iran | - | [1] ir-2009-eutelsat | - |
| Iran (jamming from Cuba; later Bulgaria, Libya) | - | [1] ir-2003-telstar12 | - |
| Iraq | - | [1] iq-2003-gps | - |
| Israel (IDF) | - | [1] mideast-2023-gnss | - |
| North Korea | - | [1] kp-2010-gps | - |
| Russia | [13] ru-2014-nudol, ru-2015-nudol-apr, ru-2015-nudol, ru-2016-nudol-may, ru-2016-nudol-dec, ru-2018-nudol-mar, ru-2018-nudol-dec, ru-2019-nudol-jun, ru-2019-nudol-nov, ru-2020-nudol-apr, ru-2020-nudol-dec, ru-2021-nudol-apr, ru-2021-cosmos1408 | [7] ru-2014-ukraine, ru-2016-syria, ru-2018-peresvet, ru-2018-trident, ru-2022-viasat, ru-2022-starlink, ru-2023-baltic | [16] ru-2014-cosmos2499, ru-2014-luch-olymp, ru-2015-cosmos2504-briz, ru-2017-cosmos2504-fy1c, ru-2017-cosmos2521-2519, ru-2018-cosmos2521-2519, ru-2019-cosmos2535-2536, ru-2019-cosmos2542-2543-usa245, ru-2019-cosmos2542-release, ru-2020-cosmos2543-2535, ru-2022-cosmos2558-usa326, ru-2022-cosmos2562-resurs-p3, ru-2023-luch-olymp-2, ru-2025-cosmos2581-2583, ru-2025-cosmos2558-object-c, ru-2025-cosmos2589-2590 |
| Russia (origin locations cited by ITU RRB) | - | [1] ru-2024-eu-sats | - |
| United States | [33] us-1959-high-virgo, us-1959-bold-orion, us-1961-sip-oct, us-1961-hiho-oct, us-1962-hiho-mar, us-1962-sip-may, us-1962-starfish-prime, us-1962-hiho-aug, us-1962-nike-zeus-wsmr, us-1963-nike-zeus-feb, us-1963-nike-zeus-mar, us-1963-nike-zeus-apr, us-1963-nike-zeus-may, us-1964-nike-zeus-jan, us-1964-p437-feb, us-1964-p437-mar, us-1964-p437-apr, us-1964-p437-may, us-1964-p437-nov, us-1965-nike-zeus-mar, us-1965-p437-apr, us-1965-nike-zeus-jun, us-1966-nike-zeus-jan, us-1967-p437-mar, us-1968-p437-may, us-1968-p437-nov, us-1970-p437-mar, us-1984-asm135-jan, us-1984-asm135-nov, us-1985-solwind, us-1986-asm135-aug, us-1986-asm135-sep, us-2008-burnt-frost | [1] us-1997-miracl | [25] us-2003-xss10, us-2005-dart, us-2005-xss11, us-2007-astro-nextsat, us-2008-dsp23-mitex, us-2009-pan, us-2010-otv1, us-2011-otv2, us-2012-otv3, us-2014-angels, us-2014-gssap, us-2014-clio, us-2015-otv4, us-2017-otv5, us-2018-mycroft-eagle, us-2019-mycroft-s5, us-2020-otv6, us-2020-usa271-sj20, us-2022-usa270-sy12, us-2023-otv7, us-2024-ldpe3a-sj23, us-2025-usa271-tjs15, us-2025-usa324-tjs16-17, us-2025-gssap-flank-sj21-sj25, us-2025-otv8 |
| United States (with France) | - | - | [2] us-2025-us-france-first-rpo, us-2025-usa324-syracuse3a |
| United States (with United Kingdom) | - | - | [1] us-2025-usa271-skynet5a |

## Quick lookup by year

Counts per calendar year (kinetic by test date; non-kinetic, co-orbital and legal by start date). Years with no rows are omitted; see `methodology.md` (section 3) for the Chart A gap statement, which follows SWF's complete DA-ASAT tables.

| year | kinetic | non-kinetic | co-orbital | legal |
|---|---|---|---|---|
| 1959 | 2 | - | - | - |
| 1961 | 2 | - | - | - |
| 1962 | 5 | - | - | - |
| 1963 | 4 | - | - | 1 |
| 1964 | 6 | - | - | - |
| 1965 | 3 | - | - | - |
| 1966 | 1 | - | - | - |
| 1967 | 1 | - | - | 1 |
| 1968 | 2 | - | - | - |
| 1970 | 1 | - | - | - |
| 1972 | - | - | - | 1 |
| 1981 | - | - | - | 1 |
| 1984 | 2 | - | - | - |
| 1985 | 1 | - | - | 1 |
| 1986 | 2 | - | - | - |
| 1992 | - | - | - | 1 |
| 1997 | - | 1 | - | - |
| 2003 | - | 2 | 1 | - |
| 2005 | 1 | - | 2 | - |
| 2006 | 1 | 1 | - | - |
| 2007 | 1 | - | 1 | - |
| 2008 | 1 | - | 2 | 1 |
| 2009 | - | 1 | 1 | - |
| 2010 | 1 | 1 | 2 | - |
| 2011 | - | - | 1 | - |
| 2012 | - | - | 1 | - |
| 2013 | 2 | - | 2 | - |
| 2014 | 2 | 1 | 5 | 1 |
| 2015 | 3 | - | 2 | - |
| 2016 | 2 | 1 | 1 | - |
| 2017 | 1 | - | 3 | 1 |
| 2018 | 3 | 2 | 2 | - |
| 2019 | 4 | - | 6 | - |
| 2020 | 2 | - | 5 | 1 |
| 2021 | 3 | - | 1 | - |
| 2022 | 1 | 2 | 6 | 4 |
| 2023 | 1 | 2 | 4 | - |
| 2024 | - | 1 | 4 | 3 |
| 2025 | - | - | 15 | 2 |
| 2026 | - | - | 1 | - |

## Kinetic events (chronological)

**61 rows.**

| date | id | state | system | target | type | alt (km) | kind | cataloged | in orbit | conf | pin | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1959-09-22 | us-1959-high-virgo | United States | High Virgo (TX-20) | None | non_destructive | 12 | apogee | - | - | medium | Table 1-4, p. 01-23 (PDF p. 72) | [1](#n1) |
| 1959-10-13 | us-1959-bold-orion | United States | Bold Orion | Explorer 6 | flyby | 200 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [2](#n2) |
| 1961-10-01 | us-1961-sip-oct | United States | SIP (NOTS-EV-2) | None | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [3](#n3) |
| 1961-10-05 | us-1961-hiho-oct | United States | HiHo (NOTS-EV-1) | None | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [4](#n4) |
| 1962-03-26 | us-1962-hiho-mar | United States | HiHo (NOTS-EV-1) | None | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [5](#n5) |
| 1962-05-05 | us-1962-sip-may | United States | SIP (NOTS-EV-2) | None | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [6](#n6) |
| 1962-07-09 | us-1962-starfish-prime | United States | Thor / W49 (Operation Fishbowl) | None (high-altitude nuclear test) | nuclear | 400 | detonation | - | - | medium | [us-1962-starfish-prime]: Table of U.S. nuclear tests, Starfish Prime row (Operation Fishbowl, 07/09/1962, "High altitude - 250 miles", 1.4 Mt), PDF pp. 41-42; secondary: SWF p. 12-05 (PDF p. 269) | [7](#n7) |
| 1962-08-26 | us-1962-hiho-aug | United States | HiHo (NOTS-EV-1) | None | non_destructive | 1600 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [8](#n8) |
| 1962-12-17 | us-1962-nike-zeus-wsmr | United States | Program 505 (Nike Zeus) | None | non_destructive | 160 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [9](#n9) |
| 1963-02-15 | us-1963-nike-zeus-feb | United States | Program 505 (Nike Zeus) | None | non_destructive | 241 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [10](#n10) |
| 1963-03-21 | us-1963-nike-zeus-mar | United States | Program 505 (Nike Zeus) | None (simulated satellite target) | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [11](#n11) |
| 1963-04-19 | us-1963-nike-zeus-apr | United States | Program 505 (Nike Zeus) | None (simulated satellite target) | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [12](#n12) |
| 1963-05-24 | us-1963-nike-zeus-may | United States | Program 505 (Nike Zeus) | Agena D | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [13](#n13) |
| 1964-01-04 | us-1964-nike-zeus-jan | United States | Program 505 (Nike Zeus) | None (simulated target) | non_destructive | 146 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [14](#n14) |
| 1964-02-14 | us-1964-p437-feb | United States | Program 437 (Thor) | Transit 2A rocket body | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [15](#n15) |
| 1964-03-01 | us-1964-p437-mar | United States | Program 437 (Thor) | Unknown | non_destructive | 674 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [16](#n16) |
| 1964-04-21 | us-1964-p437-apr | United States | Program 437 (Thor) | Unknown | non_destructive | 778 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [17](#n17) |
| 1964-05-28 | us-1964-p437-may | United States | Program 437 (Thor) | Unknown | non_destructive | 932 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [18](#n18) |
| 1964-11-16 | us-1964-p437-nov | United States | Program 437 (Thor) | Unknown | non_destructive | 1148 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [19](#n19) |
| 1965-03-01 | us-1965-nike-zeus-mar | United States | Program 505 (Nike Zeus) | None | non_destructive | - | apogee | - | - | low | Table 1-4, p. 01-23 (PDF p. 72) | [20](#n20) |
| 1965-04-05 | us-1965-p437-apr | United States | Program 437 (Thor) | Transit 2A rocket body | non_destructive | 826 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [21](#n21) |
| 1965-06-01 | us-1965-nike-zeus-jun | United States | Program 505 (Nike Zeus) | None | non_destructive | - | apogee | - | - | low | Table 1-4, p. 01-23 (PDF p. 72) | [22](#n22) |
| 1966-01-13 | us-1966-nike-zeus-jan | United States | Program 505 (Nike Zeus) | None (simulated target) | non_destructive | - | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [23](#n23) |
| 1967-03-30 | us-1967-p437-mar | United States | Program 437 (Thor) | Unknown debris object | non_destructive | 484 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [24](#n24) |
| 1968-05-15 | us-1968-p437-may | United States | Program 437 (Thor) | Unknown | non_destructive | 823 | apogee | - | - | high | Table 1-4, p. 01-23 (PDF p. 72) | [25](#n25) |
| 1968-11-21 | us-1968-p437-nov | United States | Program 437 (Thor) | Unknown | non_destructive | 1158 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73) | [26](#n26) |
| 1970-03-28 | us-1970-p437-mar | United States | Program 437 (Thor) | Unknown satellite | non_destructive | 1074 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73) | [27](#n27) |
| 1984-01-21 | us-1984-asm135-jan | United States | ASM-135 (F-15) | None | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73) | [28](#n28) |
| 1984-11-13 | us-1984-asm135-nov | United States | ASM-135 (F-15) | Star | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73); fn. 177, p. 01-22 (PDF p. 71) | [29](#n29) |
| 1985-09-13 | us-1985-solwind | United States | ASM-135 (F-15) | Solwind P78-1 | destructive | 530 | intercept | 285 | 0 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-22 (PDF p. 71); Table 1-4, p. 01-24 (PDF p. 73) | [30](#n30) |
| 1986-08-22 | us-1986-asm135-aug | United States | ASM-135 (F-15) | Star | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73); fn. 177, p. 01-22 (PDF p. 71) | [31](#n31) |
| 1986-09-29 | us-1986-asm135-sep | United States | ASM-135 (F-15) | Star | non_destructive | 1000 | apogee | - | - | high | Table 1-4, p. 01-24 (PDF p. 73); fn. 177, p. 01-22 (PDF p. 71) | [32](#n32) |
| 2005-07-05 | cn-2005-sc19 | China | SC-19 | None known | non_destructive | - | apogee | - | - | medium | Table 16-3, p. 16-04 (PDF p. 308) | [33](#n33) |
| 2006-02-06 | cn-2006-sc19 | China | SC-19 | None known | non_destructive | - | apogee | - | - | medium | Table 16-3, p. 16-04 (PDF p. 308) | [34](#n34) |
| 2007-01-11 | cn-2007-fy1c | China | SC-19 | Fengyun-1C | destructive | 880 | intercept | 3532 | 2351 | high | Table 5-1, p. 05-01 (PDF p. 212) | [35](#n35) |
| 2008-02-20 | us-2008-burnt-frost | United States | SM-3 (USS Lake Erie) | USA-193 | destructive | 220 | intercept | 175 | 0 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-24 (PDF p. 73); Table 1-4, p. 01-24 (PDF p. 73) | [36](#n36) |
| 2010-01-11 | cn-2010-midcourse | China | SC-19 | CSS-X-11 ballistic missile | midcourse_intercept | 250 | intercept | - | - | high | Table 3-3, p. 03-22 (PDF p. 183) | [37](#n37) |
| 2013-01-27 | cn-2013-midcourse | China | Possible SC-19 | Unknown ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [38](#n38) |
| 2013-05-13 | cn-2013-dn2 | China | Possible DN-2 | None known | apogee_only | 30000 | apogee | - | - | medium | Prose p. 03-20 (PDF p. 181); Table 3-3, p. 03-22 (PDF p. 183) | [39](#n39) |
| 2014-07-23 | cn-2014-dn2 | China | Possible DN-2 | Likely ballistic missile | non_destructive | - | apogee | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [40](#n40) |
| 2014-08-12 | ru-2014-nudol | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307) | [41](#n41) |
| 2015-04-22 | ru-2015-nudol-apr | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307) | [42](#n42) |
| 2015-10-30 | cn-2015-dn3 | China | Possible DN-3 | None known | non_destructive | - | apogee | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [43](#n43) |
| 2015-11-18 | ru-2015-nudol | Russia | Nudol | None | non_destructive | 200 | apogee | - | - | low | Table 2-4, p. 02-21 (PDF p. 134) | [44](#n44) |
| 2016-05-25 | ru-2016-nudol-may | Russia | Nudol | None | non_destructive | 100 | apogee | - | - | low | Table 2-4, p. 02-21 (PDF p. 134) | [45](#n45) |
| 2016-12-16 | ru-2016-nudol-dec | Russia | Nudol | None | non_destructive | 100 | apogee | - | - | low | Table 2-4, p. 02-21 (PDF p. 134) | [46](#n46) |
| 2017-07-23 | cn-2017-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [47](#n47) |
| 2018-02-05 | cn-2018-dn3 | China | Possible DN-3 | CSS-5 ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [48](#n48) |
| 2018-03-26 | ru-2018-nudol-mar | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [49](#n49) |
| 2018-12-23 | ru-2018-nudol-dec | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [50](#n50) |
| 2019-02-12 | in-2019-shakti-feb | India | PDV Mk-II | Microsat-R | non_destructive | - | apogee | - | - | low | Table 4-1, p. 04-04 (PDF p. 204); Table 16-4, p. 16-04 (PDF p. 308) | [51](#n51) |
| 2019-03-27 | in-2019-shakti | India | PDV Mk-II (Mission Shakti) | Microsat-R | destructive | 300 | intercept | 130 | 0 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 04-04 (PDF p. 204) | [52](#n52) |
| 2019-06-14 | ru-2019-nudol-jun | Russia | Nudol | None | non_destructive | - | apogee | - | - | low | Table 16-2, p. 16-03 (PDF p. 307) | [53](#n53) |
| 2019-11-15 | ru-2019-nudol-nov | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); prose p. 02-21 (PDF p. 134) | [54](#n54) |
| 2020-04-15 | ru-2020-nudol-apr | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307) | [55](#n55) |
| 2020-12-16 | ru-2020-nudol-dec | Russia | Nudol | None | non_destructive | - | apogee | - | - | medium | Table 2-4, p. 02-21 (PDF p. 134) | [56](#n56) |
| 2021-02-04 | cn-2021-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183); prose p. 03-21 (PDF p. 182) | [57](#n57) |
| 2021-04-01 | ru-2021-nudol-apr | Russia | Nudol | None | non_destructive | - | apogee | - | - | low | Table 16-2, p. 16-03 (PDF p. 307) | [58](#n58) |
| 2021-11-15 | ru-2021-cosmos1408 | Russia | Nudol (PL-19) | Cosmos 1408 | destructive | 470 | intercept | 1807 | 5 | high | Table 5-1, p. 05-01 (PDF p. 212); prose p. 02-21 (PDF p. 134) | [59](#n59) |
| 2022-06-21 | cn-2022-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Prose p. 03-21 (PDF p. 182); Table 16-3, p. 16-04 (PDF p. 308); Table 3-3, p. 03-22 (PDF p. 183) | [60](#n60) |
| 2023-04-14 | cn-2023-dn3 | China | Possible DN-3 | Likely ballistic missile | midcourse_intercept | - | intercept | - | - | medium | Table 3-3, p. 03-22 (PDF p. 183) | [61](#n61) |

## Non-kinetic events (by start date)

**15 rows.**

| start | end | id | actor | category | attribution | target regime | operational | conf | pin | note |
|---|---|---|---|---|---|---|---|---|---|---|
| 1997-10-17 | 1997-10-17 | us-1997-miracl | United States | directed_energy | official_government | ISR_LEO | False | high | MIRACL passage, p. 01-35 (PDF p. 84) | [62](#n62) |
| 2003-01-01 | 2006-12-31 | ir-2003-telstar12 | Iran (jamming from Cuba; later Bulgaria, Libya) | ew_uplink | alleged | GEO_comms | False | medium | Iranian EW passage, p. 09-05 (PDF p. 247) | [63](#n63) |
| 2003-03-20 | 2003-03-25 | iq-2003-gps | Iraq | gnss_jamming | official_government | GNSS_MEO | True | medium | [iq-2003-gps]: Briefing transcript, answer on GPS jammers | [64](#n64) |
| 2006-01-01 | 2006-01-01 | cn-2006-laser | China | directed_energy | alleged | ISR_LEO | False | low | Chinese DE section, text at fn. 207, p. 03-26 (PDF p. 187) | [65](#n65) |
| 2009-01-01 | 2012-12-31 | ir-2009-eutelsat | Iran | ew_uplink | multi_government | GEO_comms | False | medium | Iranian EW passage, text above fn. 58, p. 09-06 (PDF p. 248) | [66](#n66) |
| 2010-08-23 | ongoing | kp-2010-gps | North Korea | gnss_jamming | official_government | GNSS_MEO | False | high | Section 12.3, p. 12-05 to 12-06 (PDF p. 269-270) | [67](#n67) |
| 2014-03-01 | ongoing | ru-2014-ukraine | Russia | gnss_spoofing | researcher_osint | GNSS_MEO | True | high | GNSS passages, C4ADS report at fn. 220, p. 02-27 to 02-28 (PDF p. 140-141) | [68](#n68) |
| 2016-02-01 | ongoing | ru-2016-syria | Russia | gnss_jamming | researcher_osint | GNSS_MEO | True | medium | C4ADS passage, p. 02-28 (PDF p. 141) | [69](#n69) |
| 2018-03-01 | 2018-03-01 | ru-2018-peresvet | Russia | directed_energy | official_government | ISR_LEO | False | medium | Peresvet section, p. 02-36 (PDF p. 149) | [70](#n70) |
| 2018-10-25 | 2018-11-07 | ru-2018-trident | Russia | gnss_jamming | official_government | GNSS_MEO | False | high | text above fn. 217-218, p. 02-28 (PDF p. 141) | [71](#n71) |
| 2022-02-24 | 2022-02-24 | ru-2022-viasat | Russia | cyber | multi_government | ground_segment | True | high | Viasat case study, p. 15-06 to 15-07 (PDF p. 292-293) | [72](#n72) |
| 2022-03-01 | ongoing | ru-2022-starlink | Russia | ew_downlink | alleged | LEO_constellation | True | medium | Starlink passage, fns. 259-261, p. 02-32 (PDF p. 145) | [73](#n73) |
| 2023-10-07 | ongoing | mideast-2023-gnss | Israel (IDF) | gnss_jamming | official_government | GNSS_MEO | True | medium | Section 10.3, p. 10-01 to 10-02 (PDF p. 254-255) | [74](#n74) |
| 2023-12-01 | ongoing | ru-2023-baltic | Russia | gnss_jamming | multi_government | GNSS_MEO | True | high | Baltic GNSS passages, p. 02-29 to 02-30 (PDF p. 142-143) | [75](#n75) |
| 2024-03-01 | ongoing | ru-2024-eu-sats | Russia (origin locations cited by ITU RRB) | ew_uplink | multi_government | GEO_comms | True | high | ITU RRB passage, fn. 272, p. 02-32 (PDF p. 145) | [76](#n76) |

## Co-orbital events (by start date)

**68 rows.**

| start | end | id | actor | activity | regime | system | target | conf | pin | note |
|---|---|---|---|---|---|---|---|---|---|---|
| 2003-01-01 | 2003-01-31 | us-2003-xss10 | United States | rpo | LEO | XSS-10 | Delta upper stage (R/B) that placed it in orbit | high | Table 1-3, p. 01-14 (PDF p. 63) | [77](#n77) |
| 2005-04-01 | 2005-04-30 | us-2005-dart | United States | rpo | LEO | DART | MUBLCOM satellite | high | Table 1-3, p. 01-15 (PDF p. 64) | [78](#n78) |
| 2005-04-01 | 2006-10-31 | us-2005-xss11 | United States | rpo | LEO | XSS-11 | Minotaur upper stage; other US objects in nearby LEO orbits | high | Table 1-3, p. 01-14 (PDF p. 63) | - |
| 2007-03-01 | 2007-07-31 | us-2007-astro-nextsat | United States | docking | LEO | ASTRO | NEXTSat | high | Table 1-3, p. 01-15 (PDF p. 64) | [79](#n79) |
| 2008-09-01 | 2008-09-30 | cn-2008-bx1-sz7 | China | rpo | not_stated | BX-1 | SZ-7 (Shenzhou-7) | high | Table 3-2, p. 03-14 (PDF p. 175) | [80](#n80) |
| 2008-12-23 | 2009-01-01 | us-2008-dsp23-mitex | United States | rpo | GEO | MiTEx (USA 187, USA 188) | DSP 23 (USA 197), a US early-warning satellite that had failed in orbit | medium | Table 1-3, p. 01-15 (PDF p. 64); MiTEx passage, p. 01-10 (PDF p. 59) | [81](#n81) |
| 2009-09-08 | 2013-12-31 | us-2009-pan | United States | rpo | GEO | PAN (USA 207) | Yahsat 1B and others (not identified) | medium | Table 1-3, p. 01-15 (PDF p. 64); PAN passage, p. 01-10 (PDF p. 59) | [82](#n82) |
| 2010-04-22 | 2010-12-03 | us-2010-otv1 | United States | spaceplane_mission | LEO | X-37B OTV-1 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-04 (PDF p. 53) | [83](#n83) |
| 2010-06-12 | 2010-08-19 | cn-2010-sj12-sj06f | China | rpo | LEO | SJ-12 | SJ-06F | medium | Table 3-2, p. 03-14 (PDF p. 175); passage, p. 03-02 (PDF p. 163) | [84](#n84) |
| 2011-03-05 | 2012-06-16 | us-2011-otv2 | United States | spaceplane_mission | LEO | X-37B OTV-2 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-04 (PDF p. 53) and p. 01-05 (PDF p. 54) | - |
| 2012-12-11 | 2014-10-17 | us-2012-otv3 | United States | spaceplane_mission | LEO | X-37B OTV-3 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-05 (PDF p. 54) | - |
| 2013-07-19 | 2016-05-31 | cn-2013-sy7-sj15-cx3 | China | rpo | LEO | SY-7, Payload A debris, CX-3, SJ-15 | SY-7 and CX-3 | medium | Table 3-2, p. 03-15 (PDF p. 176); passage on SY-7, p. 03-02 (PDF p. 163); Figure 3-1, p. 03-03 (PDF p. 164) | [85](#n85) |
| 2013-10-18 | 2013-10-18 | cn-2013-sy7-release | China | release | LEO | SY-7 | Payload A Debris (2013-037J) | high | Passage on SY-7, October 2013, p. 03-03 (PDF p. 164) | [86](#n86) |
| 2014-06-01 | 2016-03-31 | ru-2014-cosmos2499 | Russia | rpo | LEO | Cosmos 2499 | Briz-KM upper stage (R/B) | high | Table 2-3, p. 02-15 (PDF p. 128) | [87](#n87) |
| 2014-07-01 | 2017-11-30 | us-2014-angels | United States | rpo | GEO | ANGELS, Delta 4 upper stage (R/B) | Each other (in the GSO disposal region) | high | Table 1-3, p. 01-15 (PDF p. 64); ANGELS passage, p. 01-13 (PDF p. 62) | [88](#n88) |
| 2014-07-01 | ongoing | us-2014-gssap | United States | rpo | GEO | GSSAP satellites (multiple) | Various other objects in the GEO region | high | Table 1-3, p. 01-15 (PDF p. 64); GSSAP passage, p. 01-10 (PDF p. 59) and p. 01-11 (PDF p. 60) | - |
| 2014-09-01 | ongoing | us-2014-clio | United States | rpo | GEO | Clio | Other orbital slots | medium | Table 1-3, p. 01-15 (PDF p. 64) | [89](#n89) |
| 2014-10-01 | 2025-10-31 | ru-2014-luch-olymp | Russia | rpo | GEO | Luch (Olymp) | More than two dozen communications satellites | high | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-12 (PDF p. 125) and p. 02-13 (PDF p. 126) | [90](#n90) |
| 2015-04-01 | 2017-04-30 | ru-2015-cosmos2504-briz | Russia | rpo | LEO | Cosmos 2504 | Briz-KM upper stage (R/B) | medium | Table 2-3, p. 02-15 (PDF p. 128) | [91](#n91) |
| 2015-05-20 | 2017-05-07 | us-2015-otv4 | United States | spaceplane_mission | LEO | X-37B OTV-4 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-05 (PDF p. 54) | - |
| 2016-11-01 | 2018-08-31 | cn-2016-sj17-chinasat | China | rpo | GEO | SJ-17 | Chinasat 5A, Chinasat 20, Chinasat 1C | medium | Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-08 (PDF p. 169) and p. 03-09 (PDF p. 170) | [92](#n92) |
| 2017-03-01 | 2017-04-30 | ru-2017-cosmos2504-fy1c | Russia | rpo | LEO | Cosmos 2504 | A piece of Chinese debris from the 2007 ASAT test (Fengyun-1C) | high | Table 2-3, p. 02-15 (PDF p. 128) | [93](#n93) |
| 2017-08-01 | 2017-10-31 | ru-2017-cosmos2521-2519 | Russia | docking | LEO | Cosmos 2521 | Cosmos 2519 (and Cosmos 2523) | high | Table 2-3, p. 02-15 (PDF p. 128) | [94](#n94) |
| 2017-09-07 | 2019-10-27 | us-2017-otv5 | United States | spaceplane_mission | LEO | X-37B OTV-5 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-05 (PDF p. 54) | [95](#n95) |
| 2018-03-01 | 2018-04-30 | ru-2018-cosmos2521-2519 | Russia | rpo | LEO | Cosmos 2521 | Cosmos 2519 | high | Table 2-3, p. 02-15 (PDF p. 128) | [96](#n96) |
| 2018-05-01 | 2018-05-31 | us-2018-mycroft-eagle | United States | rpo | GEO | Mycroft | EAGLE | high | Table 1-3, p. 01-15 (PDF p. 64); Mycroft passage, p. 01-13 (PDF p. 62) | - |
| 2019-01-01 | 2019-04-30 | cn-2019-tjs3-akm | China | release | GEO | TJS-3 | TJS-3 AKM (object 43917) | medium | Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-10 (PDF p. 171) | - |
| 2019-05-01 | ongoing | cn-2019-tjs3-roaming | China | rpo | GEO | TJS-3 | Luch, USA 233, USA 263, Chinasat 10, Chinasat 16, SJ-20, Chinasat 12, TJS-10 | high | Table 3-2, p. 03-15 (PDF p. 176) | [97](#n97) |
| 2019-08-01 | 2019-12-31 | ru-2019-cosmos2535-2536 | Russia | rpo | LEO | Cosmos 2535 | Cosmos 2536 | high | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-09 (PDF p. 122) | [98](#n98) |
| 2019-10-01 | 2019-10-31 | us-2019-mycroft-s5 | United States | rpo | GEO | Mycroft | S5 (US experimental satellite that had stopped communicating) | high | Table 1-3, p. 01-15 (PDF p. 64); Mycroft/S5 passage, p. 01-14 (PDF p. 63) | - |
| 2019-12-01 | 2020-03-31 | ru-2019-cosmos2542-2543-usa245 | Russia | rpo | LEO | Cosmos 2542 and Cosmos 2543 | USA 245 (US NRO imaging satellite) | medium | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-09 (PDF p. 122) and p. 02-10 (PDF p. 123) | [99](#n99) |
| 2019-12-06 | 2019-12-06 | ru-2019-cosmos2542-release | Russia | release | LEO | Cosmos 2542 | Cosmos 2543 (subsatellite) | high | Cosmos 2542 passage, p. 02-09 (PDF p. 122) | [100](#n100) |
| 2020-01-01 | 2020-10-31 | cn-2020-sj17-chinasat6b-sj20 | China | rpo | GEO | SJ-17 | Chinasat 6B and SJ-20 | high | Table 3-2, p. 03-15 (PDF p. 176) | - |
| 2020-05-17 | 2022-11-12 | us-2020-otv6 | United States | spaceplane_mission | LEO | X-37B OTV-6 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-06 (PDF p. 55) | [101](#n101) |
| 2020-06-01 | 2020-10-31 | ru-2020-cosmos2543-2535 | Russia | rpo | LEO | Cosmos 2543 | Cosmos 2535 (with Cosmos 2536) | medium | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-10 (PDF p. 123) and p. 02-11 (PDF p. 124) | [102](#n102) |
| 2020-08-01 | 2020-08-31 | us-2020-usa271-sj20 | United States | rpo | GEO | USA 271 (GSSAP) | SJ-20 (China) | high | Table 1-3, p. 01-15 (PDF p. 64) | - |
| 2020-09-04 | 2020-09-06 | cn-2020-csshq1 | China | spaceplane_mission | LEO | China's reusable experimental spacecraft (CSSHQ), flight 1 (PRC Test Spacecraft, 2020-063A) | - | high | Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-06 (PDF p. 167) | [103](#n103) |
| 2021-12-25 | 2022-01-27 | cn-2022-sj21-compass-g2 | China | capture_tow | GEO | SJ-21 | Compass G2 (defunct Chinese navigation satellite) | medium | Table 3-2, p. 03-15 (PDF p. 176); passage on SJ-21, p. 03-11 (PDF p. 172) | [104](#n104) |
| 2022-01-01 | 2022-01-31 | us-2022-usa270-sy12 | United States | rpo | GEO | USA 270 (GSSAP) | Shiyan-12 01 and Shiyan-12 02 (China) | medium | Table 1-3, p. 01-15 (PDF p. 64); Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-11 (PDF p. 172) and p. 03-12 (PDF p. 173) | [105](#n105) |
| 2022-03-01 | 2022-10-31 | cn-2022-sj6-05a-05b | China | rpo | LEO | SJ-6 05A | SJ-6 05B | high | Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-04 (PDF p. 165) and p. 03-05 (PDF p. 166) | - |
| 2022-08-01 | 2024-05-31 | ru-2022-cosmos2558-usa326 | Russia | rpo | LEO | Cosmos 2558 | USA 326 (US NRO imaging satellite) | low | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-11 (PDF p. 124) | [106](#n106) |
| 2022-08-04 | 2023-05-08 | cn-2022-csshq2 | China | spaceplane_mission | LEO | CSSHQ flight 2 (PRC Test Spacecraft 2, 2022-093A) | - | high | Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-07 (PDF p. 168) | - |
| 2022-11-01 | 2023-03-31 | cn-2022-pts2-object-j | China | docking | LEO | PRC Test Spacecraft 2 (CSSHQ flight 2) | Object J (2022-093J) | medium | Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-07 (PDF p. 168) | [107](#n107) |
| 2022-11-01 | 2022-11-30 | ru-2022-cosmos2562-resurs-p3 | Russia | rpo | LEO | Cosmos 2562 | Resurs-P3 | high | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-16 (PDF p. 129) | [108](#n108) |
| 2023-02-01 | ongoing | cn-2023-sj17-venesat1 | China | rpo | GEO | SJ-17 | VENESAT-1 and YAMAL 300K | high | Table 3-2, p. 03-15 (PDF p. 176) | - |
| 2023-03-01 | ongoing | ru-2023-luch-olymp-2 | Russia | rpo | GEO | Luch (Olymp) 2 | Multiple American and European communications satellites | high | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-14 (PDF p. 127) | - |
| 2023-12-14 | 2024-09-05 | cn-2023-csshq3 | China | spaceplane_mission | LEO | CSSHQ flight 3 (PRC Test Spacecraft 3, 2023-195A) | - | high | Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-07 (PDF p. 168) | - |
| 2023-12-28 | 2025-03-07 | us-2023-otv7 | United States | spaceplane_mission | HEO | X-37B OTV-7 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-06 (PDF p. 55); Figure 1-3 and passage, p. 01-07 (PDF p. 56) | [109](#n109) |
| 2024-01-01 | 2024-02-29 | cn-2024-sj23-akm | China | release | GEO | SJ-23 | SJ-23 AKM (object 2023-002C) | medium | Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-12 (PDF p. 173) | [110](#n110) |
| 2024-03-01 | 2024-12-31 | cn-2024-sy24c-sj6 | China | rpo | LEO | SY-24C 01, SY-24C 02, SY-24C 03, SJ-6 05A, SJ-6 05B | Each other | high | Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-05 (PDF p. 166) | [111](#n111) |
| 2024-06-01 | 2024-06-30 | cn-2024-pts3-object-g | China | release | not_stated | PRC Test Spacecraft 3 (CSSHQ flight 3) | Object G (2023-195G) | high | Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-07 (PDF p. 168) | - |
| 2024-10-01 | 2024-11-30 | us-2024-ldpe3a-sj23 | United States | rpo | GEO | LDPE 3A (USA 342) | SJ-23 (China) | medium | Table 1-3, p. 01-15 (PDF p. 64); LDPE 3A passage, p. 01-16 (PDF p. 65) | [112](#n112) |
| 2025-02-01 | ongoing | ru-2025-cosmos2581-2583 | Russia | rpo | LEO | Cosmos 2581, Cosmos 2582, Cosmos 2583 | Each other | high | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-12 (PDF p. 125) | [113](#n113) |
| 2025-04-01 | 2025-04-30 | us-2025-us-france-first-rpo | United States (with France) | rpo | not_stated | A US and a French satellite (not identified) | A 'strategic competitor spacecraft' (not identified) | low | Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-14 (PDF p. 63) | [114](#n114) |
| 2025-04-01 | 2025-04-30 | us-2025-usa271-tjs15 | United States | rpo | GEO | USA 271 (GSSAP 4) | TJS-15 (China) | high | Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-13 (PDF p. 62) | - |
| 2025-04-01 | 2025-04-30 | us-2025-usa324-tjs16-17 | United States | rpo | GEO | USA 324 (GSSAP 5) | TJS-16 and TJS-17 (China) | high | Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-13 (PDF p. 62) | - |
| 2025-06-01 | ongoing | ru-2025-cosmos2558-object-c | Russia | release | LEO | Cosmos 2558 | Object C (released by Cosmos 2558) and USA 326 | low | Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-11 (PDF p. 124) | [115](#n115) |
| 2025-06-01 | 2025-11-30 | ru-2025-cosmos2589-2590 | Russia | release | HEO | Cosmos 2589 | Cosmos 2590 (released object) | high | Table 2-3, p. 02-15 (PDF p. 128) | [116](#n116) |
| 2025-06-09 | 2025-06-09 | us-2025-gssap-flank-sj21-sj25 | United States | rpo | GEO | USA 270 and USA 271 (GSSAP) | SJ-21 and SJ-25 (China) | medium | Passage on SJ-21 and SJ-25 in GEO, p. 03-12 (PDF p. 173); note 116 | [117](#n117) |
| 2025-06-13 | 2025-06-14 | cn-2025-sj21-sj25-rpo | China | rpo | GEO | SJ-21 | SJ-25 | medium | Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-12 (PDF p. 173) and p. 03-13 (PDF p. 174) | [118](#n118) |
| 2025-06-30 | 2025-11-25 | cn-2025-sj21-sj25-docking | China | docking | GEO | SJ-21 | SJ-25 | medium | Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-13 (PDF p. 174) | [119](#n119) |
| 2025-08-21 | ongoing | us-2025-otv8 | United States | spaceplane_mission | not_stated | X-37B OTV-8 | - | high | Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-07 (PDF p. 56) | [120](#n120) |
| 2025-09-01 | 2025-09-30 | cn-2025-sy12-02-usa336 | China | rpo | GEO | SY-12 02 | USA 336 (US SBIRS GEO 6) | medium | Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-12 (PDF p. 173) | - |
| 2025-09-05 | 2025-09-11 | us-2025-usa271-skynet5a | United States (with United Kingdom) | rpo | GEO | USA 271 (GSSAP 4) | SKYNET 5A (United Kingdom) | high | Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-14 (PDF p. 63) | [121](#n121) |
| 2025-11-11 | 2025-11-29 | us-2025-usa324-syracuse3a | United States (with France) | rpo | GEO | USA 324 (GSSAP 5) | SYRACUSE 3A (France) | high | Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-14 (PDF p. 63) | [122](#n122) |
| 2025-11-25 | 2025-11-29 | cn-2025-sj21-sj25-undock | China | release | GEO | SJ-25 | SJ-21 | high | Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-13 (PDF p. 174) | - |
| 2025-12-18 | 2026-01-16 | cn-2025-sj21-sj25-rpo-dec | China | rpo | GEO | SJ-21 | SJ-25 | high | Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-13 (PDF p. 174) | - |
| 2026-02-06 | ongoing | cn-2026-csshq4 | China | spaceplane_mission | LEO | CSSHQ flight 4 (PRC Test Spacecraft 4, 2026-024A) | - | high | Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-08 (PDF p. 169) | [123](#n123) |

## Legal items (by start date)

**19 rows.**

| start | end | id | kind | label | citation |
|---|---|---|---|---|---|
| 1963-08-05 | - | ltbt-1963 | treaty | Limited Test Ban Treaty | Treaty Banning Nuclear Weapon Tests in the Atmosphere, in Outer Space and Under Water, Aug. 5, 1963, 14 U.S.T. 1313, 480 U.N.T.S. 43. For context, see Office of the Historian, U.S. Dep't of State, Milestones: 1961-1968, The Limited Test Ban Treaty, 1963, https://history.state.gov/milestones/1961-1968/limited-ban. |
| 1967-01-27 | - | ost-1967 | treaty | Outer Space Treaty | Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205. |
| 1972-05-26 | - | abm-1972 | treaty | Anti-Ballistic Missile (ABM) Treaty, Article XII | Treaty on the Limitation of Anti-Ballistic Missile Systems, U.S.-U.S.S.R., art. XII, May 26, 1972, 23 U.S.T. 3435. |
| 1981-12-09 | - | paros-1981 | negotiation_span | Prevention of an Arms Race in Outer Space (PAROS) | G.A. Res. 36/97 (C) (Dec. 9, 1981); G.A. Res. 36/99 (Dec. 9, 1981). |
| 1985-03-29 | 1994-08-23 | cd-paros-committee | negotiation_span | Conference on Disarmament Ad Hoc Committee on PAROS | Conference on Disarmament, Report of the Ad Hoc Committee on Prevention of an Arms Race in Outer Space, CD/1271 (Aug. 24, 1994); see UNIDIR, The Conference on Disarmament and the Prevention of an Arms Race in Outer Space. |
| 1992-12-22 | - | itu-1992 | treaty | ITU Constitution, Articles 45 and 48 | Constitution of the International Telecommunication Union arts. 45, 48, Dec. 22, 1992, 1825 U.N.T.S. 331, 361-62. |
| 2008-02-12 | - | ppwt-2008 | negotiation_span | Draft treaty on weapons in space (PPWT), Russia and China | Draft Treaty on the Prevention of the Placement of Weapons in Outer Space, CD/1839 (Feb. 29, 2008) (tabled at the CD Feb. 12, 2008). |
| 2014-06-10 | - | ppwt-2014 | negotiation_span | Updated draft treaty on weapons in space (PPWT) | Updated Draft PPWT, CD/1985 (June 12, 2014) (tabled at the CD June 10, 2014). |
| 2017-02-01 | - | tallinn-2017 | unilateral (soft law) | Tallinn Manual 2.0 (soft law) | Tallinn Manual 2.0 on the International Law Applicable to Cyber Operations (Michael N. Schmitt ed., Cambridge Univ. Press 2017). |
| 2020-12-07 | - | unga-75-36 | resolution | UN General Assembly resolution 75/36 | G.A. Res. 75/36 (Dec. 7, 2020). |
| 2022-04-18 | - | us-moratorium-2022 | unilateral | US moratorium on destructive anti-satellite missile tests | The White House, Fact Sheet: Vice President Harris Advances National Security Norms in Space (Apr. 18, 2022); SWF 2026, p. 01-50. |
| 2022-05-09 | 2023-09-01 | oewg-2022 | negotiation_span | Open-ended working group on space threats (OEWG) | G.A. Res. 76/231 (Dec. 24, 2021) (establishing OEWG, 2022-2023). |
| 2022-07-01 | - | milamos-2022 | unilateral (soft law) | McGill Manual on military uses of outer space (MILAMOS), Vol. I (soft law) | McGill Manual on International Law Applicable to Military Uses of Outer Space, Vol. I - Rules (Ram S. Jakhu & Steven Freeland eds., McGill Centre for Research in Air & Space Law 2022). |
| 2022-12-07 | - | unga-77-41 | resolution | UN General Assembly resolution 77/41 (destructive anti-satellite tests) | G.A. Res. 77/41 (Dec. 7, 2022). |
| 2024-01-01 | - | woomera-2024 | unilateral (soft law) | Woomera Manual (soft law) | The Woomera Manual on the International Law of Military Space Operations (Jack Beard & Dale Stephens eds., Oxford Univ. Press 2024). |
| 2024-04-24 | - | unsc-veto-2024 | veto | Russian veto: nuclear weapons in orbit | U.N. SCOR, 79th Sess., 9616th mtg., U.N. Doc. S/PV.9616 (Apr. 24, 2024); draft S/2024/302. |
| 2024-07-01 | - | itu-rrb-2024 | resolution | ITU Radio Regulations Board: 'grave concern' (Sweden, France) | ITU Radio Regulations Board, 96th Meeting (June 24-28, 2024), Summary of Decisions (issued July 1, 2024); quoted in SWF 2026, p. 02-32 (PDF p. 145). |
| 2025-10-03 | - | icao-2025 | resolution | ICAO: interference with satellite navigation an 'infraction' of the Chicago Convention | ICAO, ICAO Assembly Condemns GNSS Radio Frequency Interference Originating from the DPRK and the Russian Federation (Oct. 3, 2025); reported in SWF 2026, pp. 02-30, 12-06. |
| 2025-11-10 | - | itu-rrb-2025 | resolution | ITU Radio Regulations Board, 100th meeting: urges Russia to stop interference with satellite navigation | ITU Radio Regulations Board, 100th Meeting (Nov. 10-14, 2025), Harmful Interference to the Radionavigation-Satellite Service (RNSS); quoted in SWF 2026, p. 02-30 (PDF p. 143), fn. 245. |

## Conflicts inside the sources

**13 rows.**

Where SWF (or a source) disagrees with itself, the row keeps one value under a stated rule and records the other here and in the row's `conflicts` field. Rule: Table 5-1 for intercept altitude and debris counts; the appendix or announcement date where two SWF places outvote a table.

| id | conflict | note |
|---|---|---|
| us-1985-solwind | Intercept altitude: 530 km (Table 5-1, p. 05-01) vs 555 km (prose p. 01-22; Table 1-4 p. 01-24) | [30](#n30) |
| cn-2005-sc19 | Date: 5 July (Table 16-3, p. 16-04) vs 7 July (Table 3-3, p. 03-22) | [33](#n33) |
| cn-2007-fy1c | Altitude/pieces: 880 km, 3,532 (Table 5-1, p. 05-01) vs 865 km apogee, 3,533 (Table 3-3, p. 03-22) | [35](#n35) |
| us-2008-burnt-frost | Intercept altitude: 220 km (Table 5-1, p. 05-01) vs 240 km (prose p. 01-24) vs 2,700 km apogee column (Table 1-4, p. 01-24) | [36](#n36) |
| us-2008-dsp23-mitex | Table 1-3 dates the two observations 23 Dec. 2008 and 1 Jan. 2009; SWF's text on p. 01-10 says 23 Dec. 2009 and 1 Jan. 2010. The ledger uses the table's dates. | [81](#n81) |
| cn-2013-dn2 | Apogee: 10,000 km (CAS) vs 'nearly to GEO' (US military; GEO is 35,786 km) vs at least ~30,000 km (analysis cited by SWF) | [39](#n39) |
| ru-2015-nudol | Date: 18 Nov 2015 (Table 2-4, p. 02-21) vs 18 Oct 2015 (Table 16-2, p. 16-03) | [44](#n44) |
| ru-2019-cosmos2542-2543-usa245 | SWF's text says Cosmos 2543 came within 20 km of USA 245 several times in January 2020; Table 2-3 says Cosmos 2542 came 'within 30 km'. The ledger uses the text's 20 km. (The table line also reads 'Cosmos 2542 did station keeping with Cosmos 2542', evidently meaning Cosmos 2543.) | [99](#n99) |
| ru-2020-nudol-apr | Outcome: 'Successful, nothing hit' (Table 2-4, p. 02-21) vs 'Potential intercept, debris created' (Table 16-2, p. 16-03) | [55](#n55) |
| cn-2022-dn3 | Date: 21 June (prose p. 03-21; Table 16-3 p. 16-04) vs 19 June (Table 3-3, p. 03-22) | [60](#n60) |
| ru-2022-cosmos2558-usa326 | Table 2-3 dates the line 'Feb. 2022 - May 2024?'; SWF's text says Cosmos 2558 launched on 1 Aug. 2022. The ledger starts the row at the launch date and keeps the table's '?' end date. | [106](#n106) |
| cn-2023-dn3 | Date: 14 April 2023 (Table 3-3, p. 03-22; prose p. 03-21) vs 14 and 15 April both listed (Table 16-3, p. 16-04) | [61](#n61) |
| cn-2023-csshq3 | Table 3-1 gives the landing as 5 Sep. 2024; SWF's text says it landed on 6 Sep. 2024, both after 268 days. The ledger uses the table. | - |

## Endnotes

**123 notes.** Numbered in table order; each table row points here by number. Format: number, row id, date, note.

<a id="n1"></a>**1. us-1959-high-virgo** (1959-09-22). Rocket test. SWF Table 1-4: "Unknown results due to loss of telemetry"; launch site Unknown.

<a id="n2"></a>**2. us-1959-bold-orion** (1959-10-13). SWF Table 1-4 (pdfplumber cell read): "Success (passed within kill radius)"; launch site listed as Unknown. (The adjacent High Virgo row, 22 Sep 1959, carries "Unknown results due to loss of telemetry".)

<a id="n3"></a>**3. us-1961-sip-oct** (1961-10-01). "Successful rocket test"; site San Nicolas Island; apogee Unknown in SWF.

<a id="n4"></a>**4. us-1961-hiho-oct** (1961-10-05). "Rocket failure"; launched from an F4D aircraft (SWF site column: F4D-I); apogee Unknown.

<a id="n5"></a>**5. us-1962-hiho-mar** (1962-03-26). "Rocket failure"; site column F4D-I; apogee Unknown.

<a id="n6"></a>**6. us-1962-sip-may** (1962-05-05). "Successful rocket test"; site column F4-C; apogee Unknown.

<a id="n7"></a>**7. us-1962-starfish-prime** (1962-07-09). 1.4 Mt at ~250 miles (~400 km) near Johnston Island. SWF p. 12-05 (PDF p. 269): such tests are known to have damaged or destroyed satellites in orbit. Not in SWF DA-ASAT tables; included only as the nuclear marker the legal band references.

<a id="n8"></a>**8. us-1962-hiho-aug** (1962-08-26). "Successful rocket test"; site column F4-C.

<a id="n9"></a>**9. us-1962-nike-zeus-wsmr** (1962-12-17). Reached designated point in space.

<a id="n10"></a>**10. us-1963-nike-zeus-feb** (1963-02-15). Intercept of designated point in space.

<a id="n11"></a>**11. us-1963-nike-zeus-mar** (1963-03-21). "Unsuccessful attempt to intercept simulated satellite target"; Kwajalein; apogee given as a dash.

<a id="n12"></a>**12. us-1963-nike-zeus-apr** (1963-04-19). "Unsuccessful attempt to intercept simulated satellite target"; Kwajalein; apogee given as a dash.

<a id="n13"></a>**13. us-1963-nike-zeus-may** (1963-05-24). "Successful close intercept" of an Agena D; Kwajalein; apogee Unknown. No debris reported.

<a id="n14"></a>**14. us-1964-nike-zeus-jan** (1964-01-04). Successful intercept of simulated satellite target.

<a id="n15"></a>**15. us-1964-p437-feb** (1964-02-14). Passed within kill radius. SWF p. 01-21 (PDF p. 70): Program 437 was designed around a 1.4 Mt W49 warhead.

<a id="n16"></a>**16. us-1964-p437-mar** (1964-03-01). Backup missile passed within kill radius.

<a id="n17"></a>**17. us-1964-p437-apr** (1964-04-21). Passed within kill radius.

<a id="n18"></a>**18. us-1964-p437-may** (1964-05-28). Failed (missed intercept point).

<a id="n19"></a>**19. us-1964-p437-nov** (1964-11-16). Combat test launch; passed within kill radius.

<a id="n20"></a>**20. us-1965-nike-zeus-mar** (1965-03-01). SWF gives only "Mar. 1965" (date shown as the 1st for sorting); apogee and notes cells are dashes. Kwajalein.

<a id="n21"></a>**21. us-1965-p437-apr** (1965-04-05). Passed within kill radius.

<a id="n22"></a>**22. us-1965-nike-zeus-jun** (1965-06-01). SWF gives "Jun. - Jul., 1965" (date shown as 1 June for sorting): "Four test intercepts, of which three were successful". Kwajalein; apogee Unknown. One row for the four tests.

<a id="n23"></a>**23. us-1966-nike-zeus-jan** (1966-01-13). "Successful intercept with simulated target"; Kwajalein; apogee Unknown.

<a id="n24"></a>**24. us-1967-p437-mar** (1967-03-30). Combat evaluation launch.

<a id="n25"></a>**25. us-1968-p437-may** (1968-05-15). Combat evaluation launch.

<a id="n26"></a>**26. us-1968-p437-nov** (1968-11-21). Combat evaluation launch.

<a id="n27"></a>**27. us-1970-p437-mar** (1970-03-28). Passed within kill radius.

<a id="n28"></a>**28. us-1984-asm135-jan** (1984-01-21). Missile test, no target.

<a id="n29"></a>**29. us-1984-asm135-nov** (1984-11-13). "Failed test": missile directed its MHV at a star (SWF p. 01-22, fn. 177).

<a id="n30"></a>**30. us-1985-solwind** (1985-09-13). Conflict inside SWF 2026: Table 5-1 gives 530 km intercept; the prose (p. 01-22, PDF p. 71) and Table 1-4 (p. 01-24, PDF p. 73) give 555 km. Builder uses Table 5-1 for all intercept altitudes. Debris figures are from Table 5-1, read cell by cell with pdfplumber (PDF p. 212): row 'Sep. 13, 1985 / US / ASM-135 / Direct-Ascent / Solwind / 530 km / 285 / 0 / 18.7 years', i.e. 285 tracked pieces, 0 still on orbit as of Feb. 2026, total debris lifespan 18.7 years (all pieces have decayed, per SWF).

<a id="n31"></a>**31. us-1986-asm135-aug** (1986-08-22). "Successful test in tracking"; MHV directed at a star (fn. 177). Not a satellite intercept.

<a id="n32"></a>**32. us-1986-asm135-sep** (1986-09-29). "Successful test in tracking"; MHV directed at a star (fn. 177). Not a satellite intercept.

<a id="n33"></a>**33. cn-2005-sc19** (2005-07-05). Likely rocket test. Altitude not reported. SWF Table 3-3 (p. 03-22) dates it 7 July; Appendix Table 16-3 (p. 16-04) dates it 5 July. Appendix date used.

<a id="n34"></a>**34. cn-2006-sc19** (2006-02-06). Likely near-miss of orbital target. Altitude not reported. Same date in Table 3-3 (p. 03-22, PDF p. 183).

<a id="n35"></a>**35. cn-2007-fy1c** (2007-01-11). Largest debris-generating event on record. Conflict inside SWF 2026: Table 5-1 gives 880 km and 3,532 tracked pieces; Table 3-3 gives 865 km apogee and 3,533 pieces. Table 5-1 used for consistency with the other intercepts.

<a id="n36"></a>**36. us-2008-burnt-frost** (2008-02-20). Missile-defense interceptor (SM-3) used against a satellite: the case shows the ballistic missile defense / ASAT overlap. Date is 20 Feb 2008 US Eastern time (21 Feb UTC). Debris did not re-enter within weeks: SWF p. 01-24 (PDF p. 73) says the 175 trackable pieces 'took about 20 months to de-orbit entirely' (Table 5-1 lifespan column: 1.7 years). Altitude conflict inside SWF: the prose on p. 01-24 says 240 km, while Table 5-1 (p. 05-01) says 220 km; Table 1-4 (p. 01-24) lists 2,700 km in its apogee column (interceptor reach, not intercept). Table 5-1 (220 km) used, per the builder rule.

<a id="n37"></a>**37. cn-2010-midcourse** (2010-01-11). Destruction of suborbital target; no orbital debris.

<a id="n38"></a>**38. cn-2013-midcourse** (2013-01-27). Suborbital intercept; altitude not reported.

<a id="n39"></a>**39. cn-2013-dn2** (2013-05-13). Not an intercept. Chinese Academy of Sciences said 10,000 km; the US military said 'nearly to GEO' (36,000 km); technical analysis cited by SWF (p. 03-20) puts apogee at least ~30,000 km. Builder plots ~30,000 km (SWF Table 3-3 value).

<a id="n40"></a>**40. cn-2014-dn2** (2014-07-23). SWF Table 3-3 lists it as a likely intercept test with a likely ballistic-missile target. Type 'non_destructive' is the builder's coding: SWF reports no debris.

<a id="n41"></a>**41. ru-2014-nudol** (2014-08-12). Failed shortly after launch (SWF Table 2-4 note). Appendix Table 16-2 lists the date as a rocket test (unsuccessful). No apogee reported.

<a id="n42"></a>**42. ru-2015-nudol-apr** (2015-04-22). Failed at launch (SWF Table 2-4 note). Appendix Table 16-2 lists the date as a rocket test (unsuccessful). No apogee reported.

<a id="n43"></a>**43. cn-2015-dn3** (2015-10-30). Likely rocket test.

<a id="n44"></a>**44. ru-2015-nudol** (2015-11-18). First successful missile test. SWF marks the 200 km apogee with '?'. Appendix Table 16-2 (p. 16-03) dates this test 18 Oct 2015; Table 2-4 gives 18 Nov 2015 (used).

<a id="n45"></a>**45. ru-2016-nudol-may** (2016-05-25). Likely rocket test. SWF marks the 100 km apogee with '?'.

<a id="n46"></a>**46. ru-2016-nudol-dec** (2016-12-16). Likely rocket test. SWF marks the 100 km apogee with '?'.

<a id="n47"></a>**47. cn-2017-dn3** (2017-07-23). Likely intercept test; reportedly malfunctioned.

<a id="n48"></a>**48. cn-2018-dn3** (2018-02-05). Likely intercept test.

<a id="n49"></a>**49. ru-2018-nudol-mar** (2018-03-26). First test from a mobile launcher.

<a id="n50"></a>**50. ru-2018-nudol-dec** (2018-12-23). Payload column: Likely KKV. Appendix Table 16-2 (p. 16-03): potential KKV, no intercept.

<a id="n51"></a>**51. in-2019-shakti-feb** (2019-02-12). Failed test: "Booster failed within 30 seconds, no intercept" (Table 4-1); Table 16-4 says "Unsuccessful intercept". Known from anonymous US government sources reported by The Diplomat (SWF p. 04-04, fn. 39); India has not confirmed it. Apogee given as "Suborbital" (no value).

<a id="n52"></a>**52. in-2019-shakti** (2019-03-27). Indian officials said most debris would re-enter within days and all of it within 45 days at most (SWF p. 04-04); per SWF the final trackable piece re-entered in June 2022, 3.2 years after the test, and some pieces were thrown up to 2,250 km.

<a id="n53"></a>**53. ru-2019-nudol-jun** (2019-06-14). Listed only in Appendix Table 16-2 (not in Table 2-4), with the note 'Potential KKV, no intercept' (note paired to the row by column order in the text extraction). No apogee reported. Coded low confidence because a single table lists it.

<a id="n54"></a>**54. ru-2019-nudol-nov** (2019-11-15). Payload column: Likely KKV. SWF describes the Nov. 2021 test as the first known Nudol intercept (p. 02-21), so no earlier intercept is recorded; no apogee reported. Not in Appendix Table 16-2.

<a id="n55"></a>**55. ru-2020-nudol-apr** (2020-04-15). Table 2-4: "Successful, nothing hit." Appendix Table 16-2 (p. 16-03) instead says "Potential intercept, debris created"; no debris count is given anywhere in SWF, so no fragments are coded. US Space Command issued a public statement on the test (SWF p. 02-20, fn. 148).

<a id="n56"></a>**56. ru-2020-nudol-dec** (2020-12-16). Successful, nothing hit. US Space Command issued a public statement (SWF p. 02-20, fn. 149).

<a id="n57"></a>**57. cn-2021-dn3** (2021-02-04). Announced by China as a 'land-based midcourse missile intercept technology test' (SWF p. 03-21, PDF p. 182).

<a id="n58"></a>**58. ru-2021-nudol-apr** (2021-04-01). Listed only in Appendix Table 16-2 as "April 2021 ... Nudol ... Unknown" (month only; date shown as the 1st for sorting). Not in Table 2-4; no apogee, target or outcome reported.

<a id="n59"></a>**59. ru-2021-cosmos1408** (2021-11-15). ISS crew sheltered in docked vehicles. SWF text: more than 1,800 cataloged pieces, 5 still in orbit as of February 2026 (p. 02-21). Last destructive DA-ASAT test listed in SWF 2026 (Table 5-1); the report lists no later destructive test.

<a id="n60"></a>**60. cn-2022-dn3** (2022-06-21). SWF Table 3-3 gives 19 June 2022; the prose (p. 03-21) and Appendix Table 16-3 (p. 16-04) give 21 June 2022, the date of China's announcement. Prose/appendix date used.

<a id="n61"></a>**61. cn-2023-dn3** (2023-04-14). Likely intercept test. Table 3-3 and prose give 14 April 2023; Appendix Table 16-3 lists both 14 and 15 April 2023. 14 April used.

<a id="n62"></a>**62. us-1997-miracl** (1997-10-17). The Secure World Foundation (SWF) gives only October 1997. The exact day, 17 Oct., comes from FlightGlobal (Oct. 1997) and Arms Control Association reporting. The laser was fired at White Sands Missile Range, New Mexico (SWF footnote 259 cites the range's High Energy Laser Systems Test Facility). MSTI-3 was a US Air Force experimental satellite that had completed its mission.

<a id="n63"></a>**63. ir-2003-telstar12** (2003-01-01). The Secure World Foundation (SWF) says Iran 'has been accused', so the claim is shown as alleged. SWF says the Telstar 12 jamming from Havana 'started in 2003' and that similar jamming occurred from Bulgaria and Libya in 2005 and 2006. SWF gives no day or month, so the span runs over whole years. The end year, 2006, is the last year SWF dates for the Bulgarian and Libyan sites.

<a id="n64"></a>**64. iq-2003-gps** (2003-03-20). The Secure World Foundation (SWF) 2026 report does not cover this case, because Iraq is not one of the 13 countries SWF assesses. It is left out of the 'Who can do what' chart.

<a id="n65"></a>**65. cn-2006-laser** (2006-01-01). The event is dated by year only. It rests on a press report from anonymous sources, so confidence is low and the claim is shown as alleged.

<a id="n66"></a>**66. ir-2009-eutelsat** (2009-01-01). The attribution is shown as coming from several governments because an intergovernmental body, the ITU, located the source in Iranian territory. The ITU did not find the Iranian state responsible. The Secure World Foundation (SWF) dates only the 2010 ITU action and Eutelsat's October 2022 report of renewed jamming from Iran. The 2009 start follows Eutelsat's appeals from May 2009 (Eutelsat and Human Rights Watch). The 2012 end is the last year of the first documented phase, so the span understates the 2022 episode.

<a id="n67"></a>**67. kp-2010-gps** (2010-08-23). This is jamming of receivers from the ground, not an attack on GPS satellites. The Secure World Foundation (SWF) says there is 'no impact on the GPS satellites themselves' (p. 12-05). The entry covers a campaign, not individual incidents. SWF does not date the first episode, so the start is the first publicly known incident, 23 Aug. 2010 (GPS World, Inside GNSS). It is treated as ongoing (SWF p. 12-06: November 2024 interference; October 2025 ICAO finding).

<a id="n68"></a>**68. ru-2014-ukraine** (2014-03-01). The attribution follows the C4ADS report, based on open sources, that the Secure World Foundation (SWF) relies on (p. 02-28). Governments have also blamed Russia, but the source for the time span is open-source research. The entry covers jamming and spoofing. SWF's cited pages do not date the start. The March 2014 start comes from outside reporting that Russia has jammed GPS in eastern Ukraine since the 2014 Crimea conflict (Breaking Defense; Foreign Policy, Oct. 2015).

<a id="n69"></a>**69. ru-2016-syria** (2016-02-01). The Secure World Foundation (SWF), p. 02-28: 'The spoofing began in 2016, peaked in 2017'. This page uses 2016 as the start, with medium confidence.

<a id="n70"></a>**70. ru-2018-peresvet** (2018-03-01). Putin named the system in his 1 March 2018 speech (SWF p. 02-36). SWF describes it as appearing designed to protect mobile intercontinental ballistic missiles (ICBMs) from being imaged. The Russian government declared the system itself, and there is no public evidence of its use against a satellite. The attribution 'official government' here records only that announcement. The entry sits in the directed-energy (laser) group as a capability announcement, not as an operation against a satellite.

<a id="n71"></a>**71. ru-2018-trident** (2018-10-25). The Secure World Foundation (SWF) does not name the exercise or give dates. It says that media reported jamming in Norway and Finland in November 2018, during a major exercise of the North Atlantic Treaty Organization (NATO), and that Norway's government claimed in March 2019 it had proof of Russian interference. The dates, 25 Oct. to 7 Nov. 2018, are those of the NATO exercise Trident Juncture. Norway's ministry put the jamming at 16 Oct. to 7 Nov. The attribution is 'official government' because of Norway's claim. Finland only expressed concern (outside reporting).

<a id="n72"></a>**72. ru-2022-viasat** (2022-02-24). On timing, the Secure World Foundation (SWF) says (p. 15-06) that the attack came 'within hours' of Russian troops crossing the border. It adds (p. 15-07) that independent analysts noted it began one hour before the first troops crossed. The United States, United Kingdom and European Union publicly attributed the attack to the GRU, Russia's military intelligence service, in May 2022 (p. 15-07).

<a id="n73"></a>**73. ru-2022-starlink** (2022-03-01). The Secure World Foundation (SWF) notes that there is no independent validation of the type or size of the jamming, so the claim is shown as alleged.

<a id="n74"></a>**74. mideast-2023-gnss** (2023-10-07). The Secure World Foundation (SWF) reports the IDF's own public statement (p. 10-02), so the attribution is recorded as official government, for Israel and for jamming only. SWF also reports regional jamming and spoofing after the 7 Oct. 2023 Hamas attack. It says it is hard to tell from open sources whether Israel, Hamas or other actors carry out the electronic warfare. No other actor is attributed, so there is no second entry (left out, and not marked 'alleged', because SWF makes no allegation against a named actor). The spoofing reports are therefore not attributed to anyone here. SWF p. 10-01 also reports interference in spring 2023 (20% of regional aircraft in April 2023), before this entry's start. The start is set to 7 Oct. 2023, the attack SWF names as the trigger of the escalation. Lebanon's claim is a government claim about Israel, not proof.

<a id="n75"></a>**75. ru-2023-baltic** (2023-12-01). The Secure World Foundation (SWF) says the interference 'picked up in late 2023 and early 2024'; the start is set to December 2023. The attribution is shown as coming from several governments because it rests on the October 2025 resolution of the International Civil Aviation Organization (ICAO) and on findings of the Radio Regulations Board (RRB) of the International Telecommunication Union (ITU) in November 2025. This is jamming of receivers from the ground, not attacks on satellites.

<a id="n76"></a>**76. ru-2024-eu-sats** (2024-03-01). The Secure World Foundation (SWF) reports (p. 02-32) that several European countries complained in spring 2024. The Board described where the interference seemed to come from but made no finding that a state was responsible. The attribution is shown as coming from several governments because the ITU, an intergovernmental body, located the source.

<a id="n77"></a>**77. us-2003-xss10** (2003-01-01). The Secure World Foundation (SWF) table gives an orbit of 800 by 800 km, which counts as low Earth orbit (LEO). SWF's limit for LEO is 2,000 km.

<a id="n78"></a>**78. us-2005-dart** (2005-04-01). The Secure World Foundation (SWF) cites this event as the model for the possible bump between SJ-12 and SJ-06F in 2010 (p. 03-02).

<a id="n79"></a>**79. us-2007-astro-nextsat** (2007-03-01). A demonstration of in-orbit servicing between two US satellites. Each satellite is the other's target.

<a id="n80"></a>**80. cn-2008-bx1-sz7** (2008-09-01). The source table gives no orbit.

<a id="n81"></a>**81. us-2008-dsp23-mitex** (2008-12-23). This reading comes from the text, not the table: the two MiTEx satellites drifted from their parking slots in geosynchronous orbit toward DSP 23 (hobbyist observations).

<a id="n82"></a>**82. us-2009-pan** (2009-09-08). SWF's table dates this entry 2009 to 2013 and lists 'Yahsat 1B, others unknown, PAN'. This entry starts at PAN's launch date, from the text, and takes Yahsat 1B as one target. SWF calls the signals-intelligence purpose 'presumed'.

<a id="n83"></a>**83. us-2010-otv1** (2010-04-22). SWF says (p. 01-09) that to date the X-37B has not approached or rendezvoused with any other space object. The orbit counts as low Earth orbit (LEO) because SWF states that earlier flights 'stayed well within LEO' (p. 01-06).

<a id="n84"></a>**84. cn-2010-sj12-sj06f** (2010-06-12). The entry starts at the first maneuver (12 June 2010) and ends at the closest approach (19 Aug. 2010), both from SWF's text; its table gives June to August 2010. The orbit was 570 to 600 km up, tilted 97.6 degrees to the equator.

<a id="n85"></a>**85. cn-2013-sy7-sj15-cx3** (2013-07-19). SWF says (p. 03-02) that SY-7 likely carried a robotic arm and that material posted in 2014 on a software-sharing website described a remotely operated arm interacting with the small satellite as it separated. The entry starts at the launch of the three payloads (19 July 2013). The orbit was about 670 km up and tilted 98 degrees.

<a id="n86"></a>**86. cn-2013-sy7-release** (2013-10-18). SWF treats the 'joined' reports as unconfirmed. The same page says a US official's claim that one satellite 'grabbed' another could not be confirmed and did not involve SY-7.

<a id="n87"></a>**87. ru-2014-cosmos2499** (2014-06-01). The orbit was between 1,480 and 1,501 km up, tilted 82.4 degrees to the equator.

<a id="n88"></a>**88. us-2014-angels** (2014-07-01). The source table says the orbit is geosynchronous (GSO); the text places the close approaches in the disposal region several hundred km above the GSO belt. The entry counts it as GEO, meaning the belt and its immediate surroundings.

<a id="n89"></a>**89. us-2014-clio** (2014-09-01). SWF's table puts the word 'multiple' in quotes.

<a id="n90"></a>**90. ru-2014-luch-olymp** (2014-10-01). The Secure World Foundation (SWF) cites Kratos and Russian sources for a likely signals-intelligence mission, done by parking close enough to pick up the signals that ground stations send up to satellites (p. 02-13). That is SWF's assessment, not an observed fact.

<a id="n91"></a>**91. ru-2015-cosmos2504-briz** (2015-04-01). The orbit was between 1,172 and 1,507 km up, tilted 82.5 degrees to the equator.

<a id="n92"></a>**92. cn-2016-sj17-chinasat** (2016-11-01). SWF reports (p. 03-08) testimony from US Space Command that SJ-17 also carried a robotic arm 'that could be used for dual use capabilities'. SWF describes no operation of the arm.

<a id="n93"></a>**93. ru-2017-cosmos2504-fy1c** (2017-03-01). The orbit was between 848 and 1,507 km up, tilted 82.6 degrees to the equator.

<a id="n94"></a>**94. ru-2017-cosmos2521-2519** (2017-08-01). The orbit was between 650 and 670 km up, tilted 97.9 degrees to the equator. The Secure World Foundation (SWF) says (p. 02-10) that the US military considers the Cosmos 2523 separation a weapons test.

<a id="n95"></a>**95. us-2017-otv5** (2017-09-07). SWF's inference that the small satellites (cubesats) were deployed by the X-37B is its own conclusion from the catalog record, not an official statement of the deployment.

<a id="n96"></a>**96. ru-2018-cosmos2521-2519** (2018-03-01). The source table leaves the orbit blank, so the entry uses low Earth orbit (LEO) from the previous line for the same pair.

<a id="n97"></a>**97. cn-2019-tjs3-roaming** (2019-05-01). SWF's Russia section says Luch (Olymp) approached TJS-3 and its apogee kick motor within 30 km in spring 2019 (p. 02-13).

<a id="n98"></a>**98. ru-2019-cosmos2535-2536** (2019-08-01). The orbit was between 621 and 623 km up, tilted 97.88 degrees to the equator. The Secure World Foundation (SWF) reports (p. 02-09) that debris objects were released near the pair before and during the close approaches.

<a id="n99"></a>**99. ru-2019-cosmos2542-2543-usa245** (2019-12-01). The Secure World Foundation (SWF) says the purpose 'strongly suggests' observing USA 245 (an amateur analysis) and its table says 'likely for the purpose of surveillance'. The orbit was between 590 and 859 km up, tilted 97.9 degrees to the equator.

<a id="n100"></a>**100. ru-2019-cosmos2542-release** (2019-12-06). This entry comes from the text of the Secure World Foundation (SWF). Its Table 2-3 folds the release into the 'Dec. 2019 - Mar. 2020' line.

<a id="n101"></a>**101. us-2020-otv6** (2020-05-17). The Russian claim of a release in Oct. 2021 (an object keeping about 200 m away for a day) is a report the Secure World Foundation (SWF) cites. SWF does not confirm it. The service module separated before landing.

<a id="n102"></a>**102. ru-2020-cosmos2543-2535** (2020-06-01). The Secure World Foundation (SWF) says US Space Command called the July 2020 object release a space-based weapons test and that Russia's Foreign Ministry denied that. The source table leaves the orbit blank, so the entry uses low Earth orbit (LEO) from the neighboring lines.

<a id="n103"></a>**103. cn-2020-csshq1** (2020-09-04). The Secure World Foundation (SWF) says the mission of the small satellite is unknown. The spaceplane and the object were not registered with the UN as of Feb. 2026.

<a id="n104"></a>**104. cn-2022-sj21-compass-g2** (2021-12-25). SWF does not describe how SJ-21 captured or docked with Compass G2, and does not describe the separation. SWF's table says SJ-21 pulled Compass G2 'well past graveyard orbit', the disposal region above the GEO belt. The dates are hedged in the text ('at some point', 'around January 21'). The end date is the 27 Jan. observation of the higher orbit. The orbit in Table 3-2 is 35,876 km up, tilted 8 degrees to the equator.

<a id="n105"></a>**105. us-2022-usa270-sy12** (2022-01-01). Listed in both Table 1-3 (US) and Table 3-2 (China); this is one entry, with the US satellite as the approaching satellite (the chaser). SWF's text dates the approach 'late January 2022'.

<a id="n106"></a>**106. ru-2022-cosmos2558-usa326** (2022-08-01). Confidence is low: the source table's end date carries a '?' and its start date disagrees with the text. The Secure World Foundation (SWF) says the pair is 'not in an actual proximity orbit'.

<a id="n107"></a>**107. cn-2022-pts2-object-j** (2022-11-01). The dates are the periods of close approaches given by LeoLabs in SWF's text (Nov.–Dec. 2022, Jan. 2023, Feb.–Mar. 2023). SWF prints LeoLabs' description as “least two and possibly three capture/docking operations” (the word 'at' is missing in SWF's text).

<a id="n108"></a>**108. ru-2022-cosmos2562-resurs-p3** (2022-11-01). The orbit was between 385 and 400 km up, tilted 97.2 degrees to the equator.

<a id="n109"></a>**109. us-2023-otv7** (2023-12-28). The Secure World Foundation (SWF) says it is unclear whether OTV-7 went back to a highly elliptical orbit (HEO) or stayed in low Earth orbit (LEO) after the aerobraking. The 38,838 km apogee (highest point) is a hobbyist tracking figure quoted by SWF. A US Space Force image gave 38,318 km on 30 Jan. 2024 near apogee.

<a id="n110"></a>**110. cn-2024-sj23-akm** (2024-01-01). The source table dates this entry Jan.–Feb. 2024. The Secure World Foundation's (SWF) text puts the launch on 8 Jan. 2023, the apparent release around 15 Jan. 2023 and the within-10-km analysis in Feb. 2024. The entry uses the table's dates.

<a id="n111"></a>**111. cn-2024-sy24c-sj6** (2024-03-01). The activity was not continuous: March to April, September and December 2024. A US Space Force fact sheet quoted by the Secure World Foundation (SWF) describes the March to April activity. This entry is not a finding on intent.

<a id="n112"></a>**112. us-2024-ldpe3a-sj23** (2024-10-01). The Secure World Foundation's (SWF) table lists only 'SJ-23' for the spacecraft involved; its text and a table note name LDPE 3A as the approaching vehicle.

<a id="n113"></a>**113. ru-2025-cosmos2581-2583** (2025-02-01). At launch the orbit was about 578 to 595 km up and tilted 82 degrees to the equator.

<a id="n114"></a>**114. us-2025-us-france-first-rpo** (2025-04-01). The source table gives '?' for the orbit. Confidence is low because SWF cannot identify the satellites or the target.

<a id="n115"></a>**115. ru-2025-cosmos2558-object-c** (2025-06-01). Confidence is low because the source table's end date carries a '?'. The orbit was about 450 km up.

<a id="n116"></a>**116. ru-2025-cosmos2589-2590** (2025-06-01). The orbit was highly elliptical (very elongated): the highest point (apogee) was 51,200 km and the lowest point (perigee) was 20,374 km.

<a id="n117"></a>**117. us-2025-gssap-flank-sj21-sj25** (2025-06-09). This entry comes from SWF's text, not from a line of its Table 1-3. The date is that of the COMSPOC observation cited in SWF note 116 (9 June 2025). SWF's own words for the monitoring purpose are 'most likely'.

<a id="n118"></a>**118. cn-2025-sj21-sj25-rpo** (2025-06-13). This entry splits the Secure World Foundation's (SWF) single Table 3-2 line (Jun. 2025–Jan. 2026) into dated steps, using SWF's text. SJ-25's declared purpose was 'satellite fuel replenishment and life extension service technology verification' (SWF p. 03-12).

<a id="n119"></a>**119. cn-2025-sj21-sj25-docking** (2025-06-30). The Secure World Foundation (SWF) hedges the early dates ('appeared', 'thought to have docked') and then says they 'remained docked'. SWF says the Chinese government has released no information about them. The end date is the SJ-25 separation burn (engine firing) on 25 Nov. Analysts quoted by SWF believe SJ-25 served as a gas station for SJ-21; SWF does not present that as confirmed.

<a id="n120"></a>**120. us-2025-otv8** (2025-08-21). SWF gives no orbit for OTV-8. The US Space Force release did not describe the mission.

<a id="n121"></a>**121. us-2025-usa271-skynet5a** (2025-09-05). Both governments announced it as a joint operation. The longitude and the closest distance come from data from COMSPOC, a commercial space-tracking company, as reported by the Secure World Foundation (SWF).

<a id="n122"></a>**122. us-2025-usa324-syracuse3a** (2025-11-11). Both governments acknowledged the maneuvers without specifics. The satellites were identified by COMSPOC, a commercial space-tracking company.

<a id="n123"></a>**123. cn-2026-csshq4** (2026-02-06). SWF's text says the flight started 'in February 2026'. Its Table 3-1 gives 6 Feb. 2026.

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
