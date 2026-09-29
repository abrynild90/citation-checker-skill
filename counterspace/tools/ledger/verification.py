"""Verification state for every ledger row (hand-maintained), plus the discrepancy list.
verification_log.md is generated from this and from the data, so its pins and counts cannot drift.
Status: VERIFIED | VERIFIED (external) | PARTIAL | CORRECTED (a defect was found, fixed, then verified).
Full-length evidence for each row from the 2026-09-28/29 passes is kept in verification_history.md."""

VERIFY = {'us-1959-bold-orion': ('CORRECTED',
                        'Disc. 37: pdfplumber row: "Oct. 13, 1959 / Bold Orion / Unknown / Explorer VI / 200 km / Success (passed within kill '
                        'radius)"'),
 'us-1962-starfish-prime': ('VERIFIED (external)',
                            '"07/09/1962 ... Johnston Island area"; "250 miles"; "1.4 Mt". SWF 12-05: tests "damaged or destroyed satellites".'),
 'us-1962-nike-zeus-wsmr': ('VERIFIED', '"Dec. 17, 1962 ... WSMR ... 160 km"'),
 'us-1963-nike-zeus-feb': ('VERIFIED', '"Feb. 15, 1963 ... Kwajalein ... 241 km"'),
 'us-1964-nike-zeus-jan': ('VERIFIED', '"Jan. 4, 1964 ... 146 km"; note "intercept of a simulated satellite target"'),
 'us-1964-p437-feb': ('CORRECTED', '"Feb. 14, 1964 ... Transit 2A Rocket Body 1000 km"; W49 at p. 01-21'),
 'us-1964-p437-mar': ('VERIFIED', '"Mar. 1, 1964 ... 674 km"; "backup missile passed within kill radius"'),
 'us-1964-p437-apr': ('VERIFIED', '"Apr. 21, 1964 ... 778 km"'),
 'us-1964-p437-may': ('VERIFIED', '"May 28, 1964 ... 932 km"; "Failed (missed intercept point)"'),
 'us-1964-p437-nov': ('VERIFIED', '"Nov. 16, 1964 ... 1,148 km"; "Successful Combat Test Launch"'),
 'us-1965-p437-apr': ('VERIFIED', '"Apr. 5, 1965 ... Transit 2A Rocket Body 826 km"'),
 'us-1967-p437-mar': ('VERIFIED', '"Mar. 30, 1967 ... 484 km ... Unknown piece of space debris"'),
 'us-1968-p437-may': ('VERIFIED', '"May 15, 1968 ... 823 km"'),
 'us-1968-p437-nov': ('VERIFIED', '"Nov. 21, 1968 ... 1,158 km"'),
 'us-1970-p437-mar': ('VERIFIED', '"Mar. 28, 1970 ... Unknown satellite 1,074 km"'),
 'us-1984-asm135-jan': ('VERIFIED', '"Jan. 21, 1984 ASM-135 Aircraft None 1,000 km"'),
 'us-1985-solwind': ('VERIFIED',
                     'pdfplumber row: "Sep. 13, 1985 / US / ASM-135 / Direct-Ascent / Solwind / 530 km / 285 / 0 / 18.7 years" (tracked 285, still '
                     'on orbit 0). Prose and T1-4 say 555 km [...]'),
 'us-2008-burnt-frost': ('CORRECTED',
                         'T5-1 "USA 193 220 km 175"; prose "at an altitude of 240 km"; "took about 20 months to de-orbit entirely"; T1-4 "2,700 km". '
                         'T5-1 "0 0 [...]'),
 'cn-2005-sc19': ('VERIFIED', 'T16-3 "July 5, 2005 SC-19 ... Likely rocket test"; T3-3 "July 7, 2005"'),
 'cn-2006-sc19': ('VERIFIED', '"Feb. 6, 2006 SC-19 ... Likely near-miss of orbital target"'),
 'cn-2007-fy1c': ('VERIFIED', 'T5-1 "SC-19 ... FY-1C 880 km 3532 2351 19.1 years"; T3-3 "865 km", "3533 pieces"'),
 'cn-2010-midcourse': ('VERIFIED', '"Jan. 11, 2010 ... CSS-X-11 ... 250 km ... Destruction of suborbital target"'),
 'cn-2013-midcourse': ('VERIFIED', '"Jan. 27, 2013 Possible SC-19 ... Suborbital"'),
 'cn-2013-dn2': ('VERIFIED', '"CAS claimed the rocket reached 10,000 km"; "nearly to GEO"; "at least 30,000 km"; T3-3 "~30,000 km"'),
 'cn-2014-dn2': ('CORRECTED', '"July 23, 2014 Possible DN-2 ... Likely intercept test"'),
 'cn-2015-dn3': ('VERIFIED', '"Oct. 30, 2015 Possible DN-3 ... Likely rocket test"'),
 'cn-2017-dn3': ('VERIFIED', '"July 23, 2017 ... Suborbital, malfunctioned"'),
 'cn-2018-dn3': ('VERIFIED', '"Feb. 5, 2018 ... CSS-5" (target from T16-3)'),
 'cn-2021-dn3': ('CORRECTED', 'Prose: announced "land-based midcourse missile intercept technology test" on Feb. 4, 2021'),
 'cn-2022-dn3': ('CORRECTED', 'Prose and T16-3 "21 June 2022"; T3-3 "Jun. 19, 2022"'),
 'cn-2023-dn3': ('CORRECTED', '"April 14, 2023"; T16-3 also lists Apr. 15'),
 'ru-2014-nudol': ('VERIFIED', 'T2-4 "Aug. 12, 2014 ... Failed shortly after launch."; T16-2 "Aug. 12, 2014 ... Rocket test (unsuccessful)"'),
 'ru-2015-nudol-apr': ('VERIFIED', 'T2-4 "Apr. 22, 2015 ... Failed at launch."; T16-2 "Apr. 22, 2015 ... Rocket test (unsuccessful)"'),
 'ru-2015-nudol': ('VERIFIED', 'T2-4 "Nov. 18, 2015 ... 200 km? First successful test of missile"; T16-2 "Oct. 18, 2015"'),
 'ru-2016-nudol-may': ('VERIFIED', '"May 25, 2016 ... 100 km? ... likely rocket test"'),
 'ru-2016-nudol-dec': ('VERIFIED', '"Dec. 16, 2016 ... 100 km?"'),
 'ru-2019-nudol-jun': ('VERIFIED',
                       'pdfplumber row: "June 14, 2019 / Nudol / Direct-Ascent / Plesetsk / None / Potential KKV, no intercept". Not in T2-4. Coded '
                       'low confidence because only one SWF table lists it.'),
 'ru-2019-nudol-nov': ('CORRECTED',
                       '"Nov. 15, 2019 ... Nudol ... Plesetsk ... Likely KKV"; "first known intercept test of the Nudol" (Nov. 2021). "No intercept" '
                       'removed from the T2-4 attribution (Discrepancy 29). Not in T16-2.'),
 'ru-2018-nudol-mar': ('VERIFIED', '"Mar. 26, 2018 ... Likely KKV"; "First test from a mobile launcher"'),
 'ru-2018-nudol-dec': ('VERIFIED', '"Dec. 23, 2018 ... Likely KKV"; T16-2 "Potential KKV, no intercept"'),
 'ru-2020-nudol-apr': ('CORRECTED', 'Disc. 38: "Apr. 15, 2020 ... Likely KKV"; "Successful, nothing hit"; USSPACECOM release cited'),
 'ru-2020-nudol-dec': ('VERIFIED', '"Dec. 16, 2020"; USSPACECOM release cited'),
 'in-2019-shakti': ('CORRECTED', 'T5-1 "PDV-MK II ... Microsat-R 300 km 130"; "within 45 days at most"; "final piece ... June 2022"'),
 'ru-2021-cosmos1408': ('VERIFIED', 'T5-1 "Nudol ... Cosmos 1408 470 km 1807 5"; "more than 1,800 pieces ... 5 still in orbit"'),
 'us-1959-high-virgo': ('VERIFIED', '"Sept. 22, 1959 / High Virgo (TX-20) / Unknown / None / 12 km / Unknown results due to loss of telemetry"'),
 'us-1961-sip-oct': ('VERIFIED', '"Oct. 1, 1961 / SIP (NOTS-EV-2) / San Nicolas Island / None / Unknown / Successful rocket test"'),
 'us-1961-hiho-oct': ('VERIFIED', '"Oct. 5, 1961 / HiHo (NOTS-EV-1) / F4D-I / None / Unknown / Rocket failure"'),
 'us-1962-hiho-mar': ('VERIFIED', '"Mar. 26, 1962 / HiHo / F4D-I / None / Unknown / Rocket failure"'),
 'us-1962-sip-may': ('VERIFIED', '"May 5, 1962 / SIP / F4-C / None / Unknown / Successful rocket test"'),
 'us-1962-hiho-aug': ('VERIFIED', '"Aug. 26, 1962 / HiHo / F4-C / None / 1,600 km / Successful rocket test"'),
 'us-1963-nike-zeus-mar': ('VERIFIED',
                           '"Mar. 21, 1963 / Program 505 / Kwajalein / None / - / Unsuccessful attempt to intercept simulated satellite target"'),
 'us-1963-nike-zeus-apr': ('VERIFIED', '"Apr. 19, 1963 ... Unsuccessful attempt to intercept simulated satellite target"'),
 'us-1963-nike-zeus-may': ('VERIFIED', '"May 24, 1963 / Program 505 / Kwajalein / Agena D / Unknown / Successful close intercept"'),
 'us-1965-nike-zeus-mar': ('VERIFIED', '"Mar. 1965 / Program 505 / Kwajalein / None / - / -" (month only)'),
 'us-1965-nike-zeus-jun': ('VERIFIED',
                           '"Jun. - Jul., 1965 / ... Unknown / Four test intercepts, of which three were successful" (month range; one row)'),
 'us-1966-nike-zeus-jan': ('VERIFIED', '"Jan. 13, 1966 / Program 505 / Kwajalein / None / Unknown / Successful intercept with simulated target"'),
 'us-1984-asm135-nov': ('VERIFIED',
                        '"Nov. 13, 1984 / ASM-135 / Aircraft / Star / 1,000 km / Failed test"; fn. 177: "failed missile test directing MHV at a star '
                        'on November 13, 1984"'),
 'us-1986-asm135-aug': ('VERIFIED', '"Aug. 22, 1986 / ASM-135 / Star / 1,000 km / Successful test in tracking"'),
 'us-1986-asm135-sep': ('VERIFIED', '"Sept. 29, 1986 / ASM-135 / Star / 1,000 km / Successful test in tracking"'),
 'ru-2021-nudol-apr': ('VERIFIED', '"April 2021 / Nudol / Direct-Ascent / Plesetsk / None / Unknown" (month only; low confidence)'),
 'in-2019-shakti-feb': ('VERIFIED',
                        '"Feb. 12, 2019 / PDV-MK II / Microsat-R / Suborbital / Booster failed within 30 seconds, no intercept. Failed."; T16-4: '
                        '"Unsuccessful intercept"; text: anonymous US government sources (The Diplomat)'),
 'us-1997-miracl': ('CORRECTED',
                    '"MIRACL was fired against an orbiting satellite in October 1997"; Cohen "fully consistent" with US policy. Day 17 Oct and White '
                    'Sands from FlightGlobal / ACA (external); SWF fn. 259 cites the WSMR laser test facility.'),
 'ir-2003-telstar12': ('VERIFIED', '"Iran has been accused"; "started in 2003"; "Bulgaria and Libya in 2005/2006"'),
 'iq-2003-gps': ('VERIFIED (external)', '"We have destroyed all six of those jammers"; not in SWF (Iraq outside its 13 countries)'),
 'cn-2006-laser': ('VERIFIED', '"cited anonymous US defense officials"; "no US satellites were materially" damaged'),
 'ir-2009-eutelsat': ('CORRECTED',
                      '"ITU ordered Iran to assist in stopping the jamming"; "Eutelsat stated in October 2022". Start 2009 external (Eutelsat/HRW).'),
 'kp-2010-gps': ('CORRECTED', '"no impact on the GPS satellites themselves"; ITU/ICAO/IMO concerns; Nov. 2024. Start date external (GPS World).'),
 'ru-2014-ukraine': ('VERIFIED (external)',
                     '"nearly 10,000 suspected incidents" (SWF). The 2014 start: Breaking Defense, 1 Mar 2022 (fetched): "The Russian military has '
                     'routinely jammed GPS receivers in eastern Ukraine since the Crimean conflict in 2014" [...]'),
 'ru-2016-syria': ('VERIFIED', '"The spoofing began in 2016, peaked in 2017"'),
 'ru-2018-trident': ('CORRECTED', '"In November 2018 ... NATO exercise"; Norway "had proof" (Mar. 2019). Dates external (NATO).'),
 'ru-2018-peresvet': ('CORRECTED', 'Disc. 39: "formally named ... speech ... on March 1, 2018"'),
 'ru-2022-viasat': ('CORRECTED',
                    '"Within hours of Russian troops crossing the border"; "one hour before the first Russian troops"; US/UK/EU attribute to GRU, '
                    'May 2022'),
 'ru-2022-starlink': ('CORRECTED', '"no independent or public validation"; "Ukrainian government official" on May 2024'),
 'ru-2023-baltic': ('VERIFIED', '"picked up in late 2023 and early 2024"; Kaliningrad and St. Petersburg; ICAO Oct. 2025; RRB Nov. 2025'),
 'mideast-2023-gnss': ('CORRECTED', '"hard to distinguish ... Israel, Hamas"; IDF "in a proactive manner"; RRB Addendum 6, Israel'),
 'ru-2024-eu-sats': ('CORRECTED',
                     'RRB July 2024: "seemed to originate from earth station(s) located in the areas of Moscow, Kaliningrad and Pavlovka". '
                     'Attribution level recoded `multi_government` (Discrepancy 33).'),
 'ltbt-1963': ('VERIFIED (external)',
               'Disc. 41: Cite "14 U.S.T. 1313, 480 U.N.T.S. 43"; signed Moscow 5 Aug 1963 and in force 10 Oct 1963 (JFK Library, EBSCO, Arms '
               'Control Association; Senate consent 24 Sept. 1963, 80-19) [...]'),
 'ost-1967': ('VERIFIED (external)',
              'Cite "18 U.S.T. 2410, 610 U.N.T.S. 205" confirmed. UNOOSA: adopted by res. 2222 (XXI), opened for signature 27 Jan 1967, in force 10 '
              'Oct 1967. URL bot-blocked.'),
 'abm-1972': ('CORRECTED',
              'Cite "23 U.S.T. 3435" confirmed. Art. XII: "Each Party undertakes not to interfere with the national technical means" (ACA / State '
              'text via search). US notice of withdrawal 13 Dec 2001, effective 13 June 2002 (ACA, CRS RS21088).'),
 'paros-1981': ('VERIFIED',
                'Alternative mirror: `documents.un.org/api/symbol/access?s=A/RES/36/97` (PDF read). Resolution 36/97 part **C**, "Prevention of an '
                'arms race in outer space", adopted at the 91st plenary meeting, 9 December 1981; operative para [...]'),
 'cd-paros-committee': ('VERIFIED (external)',
                        'UNIDIR text read: "On 29 March 1985 the CD agreed to establish an Ad Hoc Committee"; "final meeting on 23 August 1994"; '
                        '"has not been re-established".'),
 'itu-1992': ('VERIFIED (external)',
              'UNTS vol. 1825 read: Art. 45 at p. 361; Art. 48 at p. 362 "Members retain their entire freedom with regard to military radio '
              'installations". Adopted 22 Dec 1992, in force 1 July 1994 (search).'),
 'ppwt-2008': ('VERIFIED',
               '`documents.un.org/api/symbol/access?s=CD/1839&l=en&t=pdf` (PDF read, 5 pp.): header "CD/1839, 29 February 2008"; "Letter dated 12 '
               'February 2008 ... transmitting the Russian and Chinese texts of the draft Treaty [...]'),
 'ppwt-2014': ('VERIFIED',
               '`documents.un.org/api/symbol/access?s=CD/1985&l=en&t=pdf` (PDF read, 6 pp.): "CD/1985, Conference on Disarmament, 12 June 2014"; '
               '"Letter dated 10 June 2014 [...]'),
 'unga-75-36': ('VERIFIED (external)',
                'DL record 3895440 title "Reducing space threats through norms, rules and principles of responsible behaviours"; adopted 7 Dec 2020 '
                '(search).'),
 'oewg-2022': ('VERIFIED (external)',
               'Res. 76/231 adopted 24 Dec 2021, 150-8-7 (DL record 3952870; UN doc A/RES/76/231, distributed 30 Dec 2021); it convenes the OEWG '
               'from 2022 and asks for a report to the 78th session. First session 9-13 May 2022 [...]'),
 'us-moratorium-2022': ('VERIFIED',
                        'URL 200. SWF p. 01-50 (PDF 99): "The United States did indeed formally announce in April 2022"; "38 countries total have '
                        'made that commitment."'),
 'milamos-2022': ('VERIFIED (external)', '"Volume I - Rules was published in July 2022"; editors Jakhu and Freeland (McGill, spacewatch.global).'),
 'unga-77-41': ('CORRECTED', 'Adopted 7 Dec 2022, 155 in favor, 9 against, 9 abstentions (DL record 3997622 via search; SpacePolicyOnline).'),
 'tallinn-2017': ('VERIFIED', 'DOI URL resolves to the Cambridge Tallinn Manual 2.0 page (HTTP 200). Year 2017 per that page.'),
 'woomera-2024': ('CORRECTED', 'OUP page: published 2024, editors Jack Beard and Dale Stephens.'),
 'unsc-veto-2024': ('VERIFIED',
                    'UN press SC/15678: "9616th Meeting", Apr. 24, 2024; 13 in favor, Russia against, China abstained. Draft S/2024/302 confirmed '
                    '(documents.un.org).'),
 'itu-rrb-2024': ('VERIFIED',
                  'ITU document RRB24-2/12-E, "Summary of Decisions of the 96th Meeting of the Radio Regulations Board, 24-28 June 2024", dated 1 '
                  'July 2024, pp. 11-12'),
 'icao-2025': ('CORRECTED',
               'SWF p. 02-30: the ICAO "passed a resolution determining that the GNSS interference originating in Russia was indeed an infraction of '
               'the 1944 Convention [...]'),
 'itu-rrb-2025': ('CORRECTED',
                  'SWF p. 02-30, fn. 245: "held November 10-14, 2025"; quote "again urge[d] the Administration of the Russian Federation". The ITU '
                  'page (200) now also carries later meeting content.'),
 'direct_ascent': ('PARTIAL',
                   'D entries (US, China, Russia, India) match SWF matrix (PDF pp. 22, 24, 26, 27) and Tables 1-4, 3-3, 2-4, 5-1. P entries: Israel, '
                   'Japan, Germany match ("uncertain") [...]'),
 'co_orbital': ('PARTIAL',
                'D entries (Russia, US, China) match the matrix. P: France, Germany match; India, Iran, Israel, Japan, North Korea, UK show "no '
                'data". See [Open items and impact](#open-items-and-impact).'),
 'electronic_warfare': ('VERIFIED',
                        '2020s D (US, Russia, China, Iran, North Korea, Israel) all "significant" in the matrix\'s operational column. P entries '
                        '(India, France, Australia, Germany, Japan, South Korea) each show "some" or "uncertain".'),
 'directed_energy': ('VERIFIED',
                     'US and Russia D (MIRACL, Peresvet) verified above. P entries (China, India, France, Germany, Israel) each show R&D '
                     '"significant", "some" or "uncertain" in the matrix [...]'),
 'cyber': ('VERIFIED',
           'The matrix has no cyber row. SWF ch. 15 (p. 15-02) and the Executive Summary name the US, Russia, China, France, Iran, Israel and North '
           'Korea as demonstrating offensive cyber capability against non-space targets [...]')}

DISCREPANCIES = [('1', '`ru-2018-peresvet`', 'Pin said p. 02-35 (PDF 148). The Peresvet section is on **p. 02-36 (PDF 149)**.', 'Pin corrected.'),
 ('2',
  '`us-2008-burnt-frost`',
  'Missing SWF\'s decay fact and altitude conflict. SWF p. 01-24: "took about 20 months to de-orbit entirely"; Table 5-1 lifespan 1.7 years. Prose '
  'says **240 km**; Table 5-1 says **220 km**.',
  'Both added to the note and a `conflicts` field; pins name prose and tables.'),
 ('3',
  '`ru-2022-viasat`',
  '"About an hour before the invasion" is not SWF\'s main wording. p. 15-06: "Within hours of Russian troops crossing the border." The one-hour '
  'figure is on p. 15-07, attributed to independent analysts.',
  'Effect text and note now give both.'),
 ('4', '`us-1959-bold-orion`', 'Note said "Air-launched from B-47". Not in SWF.', 'Removed; note now quotes Table 1-4.'),
 ('5',
  '`us-1964-p437-feb`',
  'Note said "test unarmed". Not in SWF (p. 01-21 says only that Program 437 used a 1.4 Mt W49).',
  'Reworded to what SWF says.'),
 ('6',
  '`cn-2014-dn2`',
  'Note said "US State Department called it a non-destructive ASAT test". Not in SWF.',
  "Removed; the `non_destructive` type is described as the builder's coding."),
 ('7',
  '`in-2019-shakti`',
  'Note said pieces "were tracked above the ISS". Not in SWF. SWF p. 04-04: final trackable piece re-entered June 2022 (3.2 years); some pieces '
  'thrown to 2,250 km.',
  'Replaced; pin now includes p. 04-04.'),
 ('8',
  '`cn-2022-dn3`',
  'Date used 19 June (Table 3-3). SWF prose p. 03-21 and Table 16-3 both give 21 June.',
  'Date set to 2022-06-21; conflict recorded.'),
 ('9', '`cn-2023-dn3`', 'Appendix Table 16-3 lists both 14 and 15 April 2023. Not disclosed.', 'Added to note.'),
 ('10',
  '`us-1985-solwind`',
  'Prose (p. 01-22) also says 555 km; only Table 1-4 was cited. Zero "still on orbit" cell not isolable by plain-text extraction.',
  'Pin and note extended; cell later read with pdfplumber (VERIFIED).'),
 ('11',
  '`ru-2018-trident`',
  'Note said "Norway and Finland both raised it". SWF names no exercise and no dates; only Norway\'s government made a claim.',
  'Note rewritten; dates marked external.'),
 ('12',
  '`ir-2009-eutelsat`',
  'Note said ITU "asked" Iran; SWF says "ordered". Span (2009-2012) understates the Oct. 2022 episode SWF reports.',
  'Wording and note corrected; span left, disclosed.'),
 ('13',
  '`kp-2010-gps`',
  'Start 1 Aug 2010 was not sourced. First public incident: 23 Aug 2010 (GPS World, Inside GNSS).',
  'Start set to 2010-08-23.'),
 ('14', '`ru-2014-ukraine`', 'The 2014 start is not on the SWF pages cited.', 'External source named in the note.'),
 ('15', '`ru-2022-starlink`', '"Claimed by SpaceX" was loose. SWF: Musk claimed the jamming.', 'Wording fixed; pin narrowed to p. 02-32.'),
 ('16',
  'Legal `abm-1972`',
  'URL returned HTTP 200 with a "Technical Difficulties" page, not the treaty.',
  'Replaced by the Arms Control Association ABM fact sheet.'),
 ('17',
  'Legal `cd-paros-committee`',
  'URL was 404. Dates 1985-01-01/1994-12-31 were loose.',
  'UNIDIR paper (read): established 29 Mar 1985, last meeting 23 Aug 1994.'),
 ('18',
  'Legal `woomera-2024`',
  'URL redirected to an unrelated Adelaide Law Review page. Editors listed as "Beard et al."',
  'OUP product page; editors Beard and Stephens.'),
 ('19', 'Legal `unga-77-41`', 'DL record 3996915 could not be tied to the resolution.', 'Record 3997622, whose title and text search confirmed.'),
 ('20', 'Legal `itu-1992`', 'Quote "complete freedom" is wrong. Art. 48 reads "entire freedom".', 'Fixed; UNTS pin 361-62.'),
 ('21',
  'Legal `icao-2025`',
  'Cited only through SWF; also condemned the DPRK. Date 2025-10-01 was loose.',
  'Primary ICAO release cited (dated 3 Oct 2025; SWF pp. 02-30, 12-06).'),
 ('22', 'Legal `itu-rrb-2025`', 'Generic RRB URL; date 2025-11-01.', '100th meeting 10-14 Nov 2025 (SWF fn. 245); dated 2025-11-10; ITU RNSS page.'),
 ('23',
  'Legal `paros-1981`, `ppwt-2008`',
  'DL records 28200 and 622364 could not be tied to the documents (bot-blocked).',
  'UNOOSA text of 36/97 C; DL record 633470 (letter of 12 Feb 2008 transmitting CD/1839). Later replaced by direct `documents.un.org` links for '
  'CD/1839 and CD/1985.'),
 ('24', 'Legal `milamos-2022`', 'Year-only date.', 'Published July 2022; start 2022-07-01.'),
 ('25', 'Legal `us-moratorium-2022`', 'Note listed follower states not in the cited sources.', 'Removed; SWF\'s "38 countries total" retained.'),
 ('26', 'All SWF pins', 'Pins named page numbers only.', 'Each now names the table or passage.'),
 ('27',
  'Earlier log',
  'Claimed `us-1967-p437-mar` and `us-1968-p437-may` sit on p. 01-24. They are on **p. 01-23 (PDF 72)**, as the ledger pins them.',
  'Log corrected.'),
 ('28',
  '`ru-2014-nudol`, `ru-2015-nudol-apr` (added)',
  'Omitted Nudol tests. SWF Table 2-4 (p. 02-21, PDF 134): "Aug. 12, 2014 ... Failed shortly after launch"; "Apr. 22, 2015 ... Failed at launch". '
  'Table 16-2 (p. 16-03, PDF 307) lists both dates with "Rocket test (unsuccessful)".',
  'Rows added, medium confidence, no apogee; both tables pinned.'),
 ('29',
  '`ru-2019-nudol-nov` (added)',
  'Omitted; the first draft of the row said "no intercept (SWF Table 2-4)". Table 2-4 gives the date and payload "Likely KKV" but the notes cell is '
  '"-" (column-order reading), so "no intercept" was not shown by that table.',
  'Row added; note now rests on p. 02-21, which calls Nov. 2021 the "first known intercept test of the Nudol".'),
 ('30',
  '`ru-2019-nudol-jun` (added)',
  'Omitted. Only Table 16-2 lists "June 14, 2019 ... Nudol"; the note "Potential KKV, no intercept" could not be paired to it by plain-text '
  'extraction (two such notes follow the Dec. 2018 and June 2019 rows).',
  'Row added, low confidence; pairing later confirmed with pdfplumber (VERIFIED).'),
 ('31',
  'Legal `icao-2025`',
  'Label "breaches Chicago Convention" overstated the finding. SWF p. 02-30: the ICAO "passed a resolution determining that the GNSS interference '
  'originating in Russia was indeed an infraction of the 1944 Convention on International Civil Aviation, condemned it ... and called for it to '
  'fulfill its obligations" (p. 12-06 says the same for North Korea). The ICAO release (through a search snippet; the page is bot-blocked) says the '
  'Assembly "endorsed the determination of its governing Council that recurring incidents of GNSS RFI originating from the DPRK and the territory of '
  'the Russian Federation constitute infractions" of the Convention, and condemned both.',
  'Label is now "ICAO: GNSS interference an \'infraction\' of the Chicago Convention" (ICAO\'s own word, in quotes; not "breach", not merely '
  '"findings"). The note says it is an intergovernmental finding, not a court judgment. Recorded as decision 14 in `methodology.md`.'),
 ('32',
  'Legal `itu-rrb-2024`',
  'Citation gave only the issue date.',
  'The 96th RRB meeting was 24-28 June 2024 (ITU agenda and minutes pages); the summary was issued 1 July 2024. Citation now gives both.'),
 ('33',
  '`ru-2024-eu-sats`',
  'Coded `official_government` on the ground that the ITU RRB "is a governmental body". The ledger\'s own rule gives intergovernmental findings '
  '(ITU, ICAO) `multi_government`, as for `ir-2009-eutelsat`. The RRB located earth stations; it made no state-responsibility finding.',
  'Recoded `multi_government`; note reworded. Chart C fill is unchanged (both levels draw solid).'),
 ('34',
  '`cn-2023-dn3`',
  "The 14 vs 14-and-15 April 2023 discrepancy (Discrepancy 9) was in the note but not in the row's `conflicts` field, so `ledger.md` listed 7 "
  'conflicts, not 8.',
  "`conflicts` entry added; the ledger's conflicts table now has 8 rows."),
 ('35 (superseded for Solwind by 40)',
  '`us-1985-solwind`, `ru-2016-syria`, `in-2019-shakti`, `cn-2013-dn2` (notes)',
  'Solwind: the note said the zero in-orbit figure "reflects the debris having decayed", an inference. Syria: the note referred to "an earlier '
  'draft". Shakti: the note discussed an unsourced 400-piece estimate. DN-2: the conflict entry gave "~36,000 km" for the US military, whose words '
  'were "nearly to GEO".',
  'Solwind note (at that time) said the cell was not tied to its row; this was resolved in Discrepancy 40 (verified 0); the process language and the '
  'unsourced estimate are removed; the DN-2 entry quotes "nearly to GEO" (GEO is 35,786 km).'),
 ('36',
  'Kinetic scope: US Table 1-4',
  'Round-8 review: the ledger silently omitted 15 US Table 1-4 rows (High Virgo, SIP, HiHo x3, Nike Zeus 21 Mar/19 Apr/24 May 1963, Mar. 1965, '
  "Jun.-Jul. 1965, 13 Jan 1966, ASM-135 13 Nov 1984, 22 Aug 1986, 29 Sep 1986); also Russia's Apr. 2021 Table 16-2 line and India's 12 Feb 2019 "
  'failed test (Tables 4-1, 16-4).',
  '17 rows added; scope rule recorded (methodology section 3, ledger.md, schema.json). See the completeness check above.'),
 ('37',
  '`us-1959-bold-orion` (note)',
  'Note paired "Unknown results due to loss of telemetry" with Bold Orion; pdfplumber shows that cell belongs to the High Virgo row above it '
  '(plain-text column scramble).',
  'Note corrected.'),
 ('38',
  '`ru-2020-nudol-apr`',
  'Table 16-2 says "Potential intercept, debris created"; Table 2-4 says "Successful, nothing hit". Only Table 2-4 was cited.',
  'Both pinned; conflict recorded; no fragment count coded (none given).'),
 ('39',
  '`ru-2018-peresvet`, `mideast-2023-gnss` (attribution)',
  "Peresvet's `official_government` is the government's own announcement of a system, not an attributed act. `mideast-2023-gnss` was "
  '`official_government` with actor "Israel and others", stronger than SWF p. 10-02, which says open sources cannot tell whether Israel, Hamas or '
  'others conduct the EW; only the IDF statement (jamming) supports a level, only for Israel.',
  'Peresvet: effect and note say capability announcement, self-declared. Mideast: recoded to Israel (IDF), `gnss_jamming`, `official_government`; '
  '"others" dropped (no source allegation); start moved from 1 Oct to 7 Oct 2023 (SWF: escalation after the 7 Oct attack).'),
 ('40',
  '`us-1985-solwind` (in-orbit cell)',
  'Contradiction: the log said the Solwind zero was verified with pdfplumber, while the row note and ledger endnote said the cell "could not be tied '
  'to this row".',
  'Re-read 2026-09-29, PDF 212 table row: "Sep. 13, 1985 / US / ASM-135 / Direct-Ascent / Solwind / 530 km / 285 / 0 / 18.7 years". The zero is '
  'verified: no Solwind piece remains on orbit. Row note and ledger endnote updated.'),
 ('41',
  '`ltbt-1963` (legal note), `us-1962-starfish-prime` (source)',
  'The note\'s "fallout concerns and the Cuban Missile Crisis" had no source. Starfish satellite damage was cited to DOE/NV-209, which does not say '
  'that.',
  "Context sourced to Office of the Historian, U.S. Dep't of State (history.state.gov/milestones/1961-1968/limited-ban; fetched 2026-09-29: the "
  'crisis "provided the impetus for an agreement"; worldwide concern about radioactive fallout), cite added to the citation; "followed" wording '
  'kept. Starfish `source_full` now also cites SWF p. 12-05 (PDF 269), verified: such tests "damaged or destroyed satellites in orbit". Shakti pin: '
  '45-day statement is on p. 04-04 (PDF 204) in the data; the page cite (p. 04-03) is a page-side fix.')]
