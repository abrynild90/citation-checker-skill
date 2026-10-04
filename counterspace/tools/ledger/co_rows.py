"""Co-orbital rendezvous, proximity-operation (RPO), docking, capture/tow, release and spaceplane-mission rows (domain "co_orbital").
Sources: SWF 2026 Tables 1-1, 1-3, 2-3, 3-1, 3-2 and the passages around them. Every row carries source, source_url, pin (table or passage,
printed page, PDF page). Descriptions are the builder's own words; SWF's hedges ("possibly", "appeared to", "may") are kept.
Page map (printed section-page -> PDF page): chapter 1 = +49 (01-14 = PDF 63), chapter 2 = +113 (02-15 = PDF 128), chapter 3 = +161 (03-15 = PDF 176)."""
from .rows import swf, swfx, SWF, SWF_URL


def pin(*parts):
    """Free-text SWF pin from (what, printed page, PDF page) parts."""
    return swfx("; ".join("%s, p. %s (PDF p. %s)" % p for p in parts))


def co(id, start, end, actor, system, target, activity, regime, desc, conf, src, notes="", scene=None, prec=None,
       conflicts=None, related=None):
    row = dict(id=id, domain="co_orbital", start=start, end=end, actor=actor, system=system, target=target,
               activity=activity, orbit_regime=regime, description=desc, confidence=conf, notes=notes)
    row.update(src)
    if prec:
        row["date_precision"] = prec
    if conflicts:
        row["conflicts"] = conflicts
    if related:
        row["related_events"] = related
    if scene:
        row["scene_3d"] = scene
    return row


US = "United States"
# ---- Table pins (table page only) and combined pins (table plus the passage the row also rests on)
T13a = swf("01-14", 63, "Table 1-3")
T13b = swf("01-15", 64, "Table 1-3")
T23 = swf("02-15", 128, "Table 2-3")
T32a = swf("03-14", 175, "Table 3-2")
T32b = swf("03-15", 176, "Table 3-2")
T32c = swf("03-16", 177, "Table 3-2")

CO = [
    # ---------------------------------------------------------------- United States (Table 1-3)
    co("us-2003-xss10", "2003-01-01", "2003-01-31", US, "XSS-10", "Delta upper stage (R/B) that placed it in orbit", "rpo", "LEO",
       "XSS-10 made a series of maneuvers that brought it within 50 m of the Delta upper stage that had placed it in orbit.",
       "high", T13a, prec="month", notes="The Secure World Foundation (SWF) table gives an orbit of 800 by 800 km, which counts as low Earth orbit (LEO). SWF's "
         "limit for LEO is 2,000 km."),
    co("us-2005-xss11", "2005-04-01", "2006-10-31", US, "XSS-11", "Minotaur upper stage; other US objects in nearby LEO orbits", "rpo", "LEO",
       "XSS-11 maneuvered close to the Minotaur upper stage that launched it, then made further close approaches to other US objects in nearby orbits over the next 12-18 months.",
       "high", T13a, prec="month"),
    co("us-2005-dart", "2005-04-01", "2005-04-30", US, "DART", "MUBLCOM satellite", "rpo", "LEO",
       "DART's self-guided maneuvers brought it close to the MUBLCOM satellite and it bumped into it.",
       "high", T13b, prec="month", notes="The Secure World Foundation (SWF) cites this event as the model for the possible bump between SJ-12 and SJ-06F in 2010 "
         "(p. 03-02)."),
    co("us-2007-astro-nextsat", "2007-03-01", "2007-07-31", US, "ASTRO", "NEXTSat", "docking", "LEO",
       "ASTRO and NEXTSat, launched together, performed separations, close approaches and dockings with each other.",
       "high", T13b, prec="month", notes="A demonstration of in-orbit servicing between two US satellites. Each satellite is the other's target."),
    co("us-2008-dsp23-mitex", "2008-12-23", "2009-01-01", US, "MiTEx (USA 187, USA 188)", "DSP 23 (USA 197), a US early-warning satellite that had failed in orbit", "rpo", "GEO",
       "Table 1-3 of the Secure World Foundation (SWF) report records an inspection and close rendezvous with a failed US "
         "satellite (the table lists DSP-23 and the two MiTEx satellites). SWF's text says the MiTEx satellites made 'flybys' of "
         "DSP 23 and adds that other demonstrations and tests in geosynchronous orbit (GSO) are possible.",
       "medium", swfx("Table 1-3, p. 01-15 (PDF p. 64); MiTEx passage, p. 01-10 (PDF p. 59)"),
       conflicts=["Table 1-3 dates the two observations 23 Dec. 2008 and 1 Jan. 2009; SWF's text on p. 01-10 says 23 Dec. 2009 and 1 Jan. 2010. The ledger uses the table's dates."],
       notes="This reading comes from the text, not the table: the two MiTEx satellites drifted from their parking slots in "
         "geosynchronous orbit toward DSP 23 (hobbyist observations)."),
    co("us-2009-pan", "2009-09-08", "2013-12-31", US, "PAN (USA 207)", "Yahsat 1B and others (not identified)", "rpo", "GEO",
       "PAN, a classified satellite of the Nemesis series launched 8 Sept. 2009, relocated about every six months until late "
         "2013, placing it near several other satellites. The Secure World Foundation (SWF) says it presumably collected signals "
         "intelligence, meaning information from their radio signals.",
       "medium", swfx("Table 1-3, p. 01-15 (PDF p. 64); PAN passage, p. 01-10 (PDF p. 59)"),
       notes="SWF's table dates this entry 2009 to 2013 and lists 'Yahsat 1B, others unknown, PAN'. This entry starts at PAN's "
         "launch date, from the text, and takes Yahsat 1B as one target. SWF calls the signals-intelligence purpose 'presumed'."),
    co("us-2014-gssap", "2014-07-01", None, US, "GSSAP satellites (multiple)", "Various other objects in the GEO region", "rpo", "GEO",
       "Multiple pairs of GSSAP (Geosynchronous Space Situational Awareness Program) satellites have been making close "
         "approaches to various other objects in the geostationary (GEO) region. The Secure World Foundation (SWF), in its April "
         "2026 edition, lists the activity as ongoing.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); GSSAP passage, p. 01-10 (PDF p. 59) and p. 01-11 (PDF p. 60)"), prec="month"),
    co("us-2014-angels", "2014-07-01", "2017-11-30", US, "ANGELS, Delta 4 upper stage (R/B)", "Each other (in the GSO disposal region)", "rpo", "GEO",
       "ANGELS separated from the Delta 4 upper stage that placed the first pair of GSSAP (Geosynchronous Space Situational "
         "Awareness Program) satellites in orbit. It then made a series of close approaches in the geosynchronous (GSO) disposal "
         "region until it was decommissioned in Nov. 2017.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); ANGELS passage, p. 01-13 (PDF p. 62)"), prec="month",
       notes="The source table says the orbit is geosynchronous (GSO); the text places the close approaches in the disposal region "
         "several hundred km above the GSO belt. The entry counts it as GEO, meaning the belt and its immediate surroundings."),
    co("us-2014-clio", "2014-09-01", None, US, "Clio", "Other orbital slots", "rpo", "GEO",
       "The Secure World Foundation (SWF) says Clio approached other orbital slots 'multiple' times (the table gives no "
         "targets or dates). Listed as ongoing.",
       "medium", T13b, prec="month", notes="SWF's table puts the word 'multiple' in quotes."),
    co("us-2018-mycroft-eagle", "2018-05-01", "2018-05-31", US, "Mycroft", "EAGLE", "rpo", "GEO",
       "EAGLE separated from its upper stage. Mycroft then separated from EAGLE and made close approaches around EAGLE in the "
         "geostationary (GEO) region.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); Mycroft passage, p. 01-13 (PDF p. 62)"), prec="month"),
    co("us-2019-mycroft-s5", "2019-10-01", "2019-10-31", US, "Mycroft", "S5 (US experimental satellite that had stopped communicating)", "rpo", "GEO",
       "Mycroft maneuvered to meet S5 in orbit after S5 stopped communicating. The US Air Force said Mycroft would make close "
         "approaches over several weeks to check S5's solar arrays and antennas.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); Mycroft/S5 passage, p. 01-14 (PDF p. 63)"), prec="month"),
    co("us-2020-usa271-sj20", "2020-08-01", "2020-08-31", US, "USA 271 (GSSAP)", "SJ-20 (China)", "rpo", "GEO",
       "USA 271 approached China's SJ-20 and shadowed it. The Secure World Foundation (SWF) says the Chinese spacecraft "
         "detected the US satellite and moved away rapidly.",
       "high", T13b, prec="month"),
    co("us-2022-usa270-sy12", "2022-01-01", "2022-01-31", US, "USA 270 (GSSAP)", "Shiyan-12 01 and Shiyan-12 02 (China)", "rpo", "GEO",
       "USA 270 approached the two Shiyan-12 satellites, which maneuvered away into drifting orbits (Table 1-3 of the Secure "
         "World Foundation (SWF) report puts the closest approach near 73 km). SWF's China section adds that SY-12 02 apparently "
         "also had an opportunity to image USA 270.",
       "medium", swfx("Table 1-3, p. 01-15 (PDF p. 64); Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-11 (PDF p. 172) and p. 03-12 (PDF p. 173)"), prec="month",
       notes="Listed in both Table 1-3 (US) and Table 3-2 (China); this is one entry, with the US satellite as the approaching "
         "satellite (the chaser). SWF's text dates the approach 'late January 2022'."),
    co("us-2024-ldpe3a-sj23", "2024-10-01", "2024-11-30", US, "LDPE 3A (USA 342)", "SJ-23 (China)", "rpo", "GEO",
       "LDPE 3A maneuvered to approach SJ-23, possibly to 30 km on 4 or 5 Nov., then synchronized itself with SJ-23 and drifted with it about 0.68 degrees west per day.",
       "medium", swfx("Table 1-3, p. 01-15 (PDF p. 64); LDPE 3A passage, p. 01-16 (PDF p. 65)"), prec="month",
       notes="The Secure World Foundation's (SWF) table lists only 'SJ-23' for the spacecraft involved; its text and a table note "
         "name LDPE 3A as the approaching vehicle."),
    co("us-2025-usa271-tjs15", "2025-04-01", "2025-04-30", US, "USA 271 (GSSAP 4)", "TJS-15 (China)", "rpo", "GEO",
       "USA 271 approached the recently launched TJS-15. COMSPOC, a commercial space-tracking company, estimates the distance "
         "at about 33 km, as reported by the Secure World Foundation (SWF).",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-13 (PDF p. 62)"), prec="month"),
    co("us-2025-usa324-tjs16-17", "2025-04-01", "2025-04-30", US, "USA 324 (GSSAP 5)", "TJS-16 and TJS-17 (China)", "rpo", "GEO",
       "USA 324 approached two recently launched Chinese satellites, to about 17 km of TJS-16 and 12 km of TJS-17.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-13 (PDF p. 62)"), prec="month"),
    co("us-2025-us-france-first-rpo", "2025-04-01", "2025-04-30", "United States (with France)", "A US and a French satellite (not identified)", "A 'strategic competitor spacecraft' (not identified)", "rpo", "not_stated",
       "First joint close approach by the US and France: a US and a French satellite approached each other near a spacecraft "
         "described only as a 'strategic competitor'. The Secure World Foundation (SWF) says it is unclear which satellites took "
         "part or whose spacecraft it was.",
       "low", swfx("Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-14 (PDF p. 63)"), prec="month",
       notes="The source table gives '?' for the orbit. Confidence is low because SWF cannot identify the satellites or the target."),
    co("us-2025-usa271-skynet5a", "2025-09-05", "2025-09-11", "United States (with United Kingdom)", "USA 271 (GSSAP 4)", "SKYNET 5A (United Kingdom)", "rpo", "GEO",
       "First jointly coordinated close approach by the US and the UK: after drifting west since July, USA 271 made a maneuver "
         "along its orbit on 4 Sept., stopped within 0.05 degrees of SKYNET 5A near 95.3° E (about 13 km at closest), and stayed "
         "roughly 5 to 11 Sept.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-14 (PDF p. 63)"),
       notes="Both governments announced it as a joint operation. The longitude and the closest distance come from data from "
         "COMSPOC, a commercial space-tracking company, as reported by the Secure World Foundation (SWF).", scene="rpo"),
    co("us-2025-usa324-syracuse3a", "2025-11-11", "2025-11-29", "United States (with France)", "USA 324 (GSSAP 5)", "SYRACUSE 3A (France)", "rpo", "GEO",
       "Part of Operation Olympic Defender: three sets of maneuvers (11–14, 22–23 and 28–29 Nov.) in which SYRACUSE 3A "
         "appeared to lead and USA 324 to follow a day later. The closest approach was a little over 25 km.",
       "high", swfx("Table 1-3, p. 01-15 (PDF p. 64); passage, p. 01-14 (PDF p. 63)"),
       notes="Both governments acknowledged the maneuvers without specifics. The satellites were identified by COMSPOC, a commercial "
         "space-tracking company."),
    co("us-2025-gssap-flank-sj21-sj25", "2025-06-09", "2025-06-09", US, "USA 270 and USA 271 (GSSAP)", "SJ-21 and SJ-25 (China)", "rpo", "GEO",
       "Two GSSAP (Geosynchronous Space Situational Awareness Program) satellites moved along the geostationary (GEO) belt to "
         "positions that COMSPOC, a commercial space-tracking company, described as 'flanking' SJ-21 and SJ-25. The Secure World "
         "Foundation (SWF) says this was most likely to monitor the two Chinese satellites. SWF gives no distances.",
       "medium", swfx("Passage on SJ-21 and SJ-25 in GEO, p. 03-12 (PDF p. 173); note 116"),
       notes="This entry comes from SWF's text, not from a line of its Table 1-3. The date is that of the COMSPOC observation cited "
         "in SWF note 116 (9 June 2025). SWF's own words for the monitoring purpose are 'most likely'.", scene="rpo"),
    # ---------------------------------------------------------------- China (Table 3-2)
    co("cn-2008-bx1-sz7", "2008-09-01", "2008-09-30", "China", "BX-1", "SZ-7 (Shenzhou-7)", "rpo", "not_stated",
       "BX-1 was deployed from Shenzhou-7 and orbited the spacecraft, taking images.",
       "high", T32a, prec="month", notes="The source table gives no orbit."),
    co("cn-2010-sj12-sj06f", "2010-06-12", "2010-08-19", "China", "SJ-12", "SJ-06F", "rpo", "LEO",
       "SJ-12 made deliberate maneuvers over several weeks to meet SJ-06F in orbit, coming within about 300 m. The Secure "
         "World Foundation (SWF) says the two may have bumped at a very slow relative speed.",
       "medium", swfx("Table 3-2, p. 03-14 (PDF p. 175); passage, p. 03-02 (PDF p. 163)"),
       notes="The entry starts at the first maneuver (12 June 2010) and ends at the closest approach (19 Aug. 2010), both from SWF's "
         "text; its table gives June to August 2010. The orbit was 570 to 600 km up, tilted 97.6 degrees to the equator."),
    co("cn-2013-sy7-sj15-cx3", "2013-07-19", "2016-05-31", "China", "SY-7, Payload A debris, CX-3, SJ-15", "SY-7 and CX-3", "rpo", "LEO",
       "A multi-satellite demonstration in low Earth orbit (LEO): SY-7 released an extra object and maneuvered with it. The "
         "Secure World Foundation (SWF) says SY-7 'may have had a telerobotic arm'. CX-3 did optical surveillance (watching with "
         "cameras), and SJ-15 changed its altitude and the tilt of its orbit to approach other satellites.",
       "medium", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage on SY-7, p. 03-02 (PDF p. 163); Figure 3-1, p. 03-03 (PDF p. 164)"),
       notes="SWF says (p. 03-02) that SY-7 likely carried a robotic arm and that material posted in 2014 on a software-sharing "
         "website described a remotely operated arm interacting with the small satellite as it separated. The entry starts at "
         "the launch of the three payloads (19 July 2013). The orbit was about 670 km up and tilted 98 degrees.",
       related=["cn-2013-sy7-release"]),
    co("cn-2013-sy7-release", "2013-10-18", "2013-10-18", "China", "SY-7", "Payload A Debris (2013-037J)", "release", "LEO",
       "SY-7 made a small maneuver to raise its orbit and shortly after released an object. The two stayed within a few km, "
         "then hundreds of meters, for days. The Secure World Foundation (SWF) says the publicly available tracking is not "
         "accurate enough to confirm reports that the objects physically joined.",
       "high", pin(("Passage on SY-7, October 2013", "03-03", 164)),
       notes="SWF treats the 'joined' reports as unconfirmed. The same page says a US official's claim that one satellite 'grabbed' "
         "another could not be confirmed and did not involve SY-7."),
    co("cn-2016-sj17-chinasat", "2016-11-01", "2018-08-31", "China", "SJ-17", "Chinasat 5A, Chinasat 20, Chinasat 1C", "rpo", "GEO",
       "SJ-17 circled Chinasat 5A at 50 to 100 km (closing to a few km), later approached Chinasat 20, and met up with "
         "Chinasat 1C for about a week after it developed an anomaly (an unexpected problem). The Secure World Foundation (SWF) "
         "says this strongly suggests SJ-17 inspected the anomaly in Chinasat 1C and monitored its recovery.",
       "medium", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-08 (PDF p. 169) and p. 03-09 (PDF p. 170)"), prec="month",
       notes="SWF reports (p. 03-08) testimony from US Space Command that SJ-17 also carried a robotic arm 'that could be used for "
         "dual use capabilities'. SWF describes no operation of the arm."),
    co("cn-2019-tjs3-akm", "2019-01-01", "2019-04-30", "China", "TJS-3", "TJS-3 AKM (object 43917)", "release", "GEO",
       "An object listed in the tracking catalog as TJS-3's apogee kick motor (the rocket motor that lifts a satellite into "
         "its final orbit) separated in the geostationary (GEO) belt. Both objects made small maneuvers to keep close slots, "
         "then moved apart. The Secure World Foundation (SWF) says the object appears to be a small satellite, not a motor.",
       "medium", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-10 (PDF p. 171)"), prec="month"),
    co("cn-2019-tjs3-roaming", "2019-05-01", None, "China", "TJS-3", "Luch, USA 233, USA 263, Chinasat 10, Chinasat 16, SJ-20, Chinasat 12, TJS-10", "rpo", "GEO",
       "TJS-3 drifts around the geostationary (GEO) belt, stopping periodically to make close approaches to other satellites. "
         "The Secure World Foundation (SWF) lists the activity as ongoing.",
       "high", T32b, prec="month", notes="SWF's Russia section says Luch (Olymp) approached TJS-3 and its apogee kick motor within 30 km in spring 2019 (p. "
         "02-13)."),
    co("cn-2020-sj17-chinasat6b-sj20", "2020-01-01", "2020-10-31", "China", "SJ-17", "Chinasat 6B and SJ-20", "rpo", "GEO",
       "SJ-17 made close approaches to Chinasat 6B in January 2020 and to SJ-20 in October 2020.",
       "high", T32b, prec="month"),
    co("cn-2022-sj21-compass-g2", "2021-12-25", "2022-01-27", "China", "SJ-21", "Compass G2 (defunct Chinese navigation satellite)", "capture_tow", "GEO",
       "SJ-21 met up with the defunct Compass G2 on 25 Dec. 2021 and stayed very close for weeks. The Secure World Foundation "
         "(SWF) says it 'docked to it at some point'. Around 21 Jan. 2022 SJ-21 used its own propulsion to pull both objects "
         "above the geostationary (GEO) belt. By 27 Jan. they were in an orbit 290 to 3,100 km above the protected GEO zone. "
         "SJ-21 later came back down close to GEO.",
       "medium", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage on SJ-21, p. 03-11 (PDF p. 172)"),
       notes="SWF does not describe how SJ-21 captured or docked with Compass G2, and does not describe the separation. SWF's table "
         "says SJ-21 pulled Compass G2 'well past graveyard orbit', the disposal region above the GEO belt. The dates are hedged "
         "in the text ('at some point', 'around January 21'). The end date is the 27 Jan. observation of the higher orbit. The "
         "orbit in Table 3-2 is 35,876 km up, tilted 8 degrees to the equator.", scene="sj21-tug"),
    co("cn-2022-sj6-05a-05b", "2022-03-01", "2022-10-31", "China", "SJ-6 05A", "SJ-6 05B", "rpo", "LEO",
       "From March 2022 SJ-6 05A repeatedly maneuvered to within 1 km of SJ-6 05B. In October the pair finished the close "
         "approaches and raised their orbits by about 100 km.",
       "high", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-04 (PDF p. 165) and p. 03-05 (PDF p. 166)"), prec="month"),
    co("cn-2022-pts2-object-j", "2022-11-01", "2023-03-31", "China", "PRC Test Spacecraft 2 (CSSHQ flight 2)", "Object J (2022-093J)", "docking", "LEO",
       "After raising its orbit, the spaceplane released Object J and made multiple close approaches to it, including repeated "
         "docking, deployment and formation flying. This comes from tracking by the company LeoLabs, as reported by the Secure "
         "World Foundation (SWF).",
       "medium", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-07 (PDF p. 168)"),
       notes="The dates are the periods of close approaches given by LeoLabs in SWF's text (Nov.–Dec. 2022, Jan. 2023, Feb.–Mar. "
         "2023). SWF prints LeoLabs' description as “least two and possibly three capture/docking operations” (the word 'at' is "
         "missing in SWF's text)."),
    co("cn-2024-sj23-akm", "2024-01-01", "2024-02-29", "China", "SJ-23", "SJ-23 AKM (object 2023-002C)", "release", "GEO",
       "SJ-23 appeared to release an object listed in the tracking catalog as an apogee kick motor (the rocket motor that "
         "lifts a satellite into its final orbit) that may be a working satellite. Orbital analysis suggests the two objects "
         "came within 10 km of each other.",
       "medium", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-12 (PDF p. 173)"), prec="month",
       notes="The source table dates this entry Jan.–Feb. 2024. The Secure World Foundation's (SWF) text puts the launch on 8 Jan. "
         "2023, the apparent release around 15 Jan. 2023 and the within-10-km analysis in Feb. 2024. The entry uses the table's "
         "dates."),
    co("cn-2024-pts3-object-g", "2024-06-01", "2024-06-30", "China", "PRC Test Spacecraft 3 (CSSHQ flight 3)", "Object G (2023-195G)", "release", "not_stated",
       "The spaceplane released Object G (24 May 2024, about 620 km up) and made several close approaches to it in June. The "
         "Secure World Foundation (SWF) gives approaches within several km on 8 June and within 1 km or less on 12 June.",
       "high", swfx("Table 3-2, p. 03-15 (PDF p. 176); passage, p. 03-07 (PDF p. 168)"), prec="month",
       related=["cn-2023-csshq3"]),
    co("cn-2023-sj17-venesat1", "2023-02-01", None, "China", "SJ-17", "VENESAT-1 and YAMAL 300K", "rpo", "GEO",
       "SJ-17 began drifting east in Feb. 2023, made a brief close approach to VENESAT-1 in Nov. 2023, moved above and below "
         "the geostationary (GEO) belt, rejoined it in Nov. 2024 and appears stable at 178° W near YAMAL 300K. The Secure World "
         "Foundation (SWF) lists the activity as ongoing.",
       "high", T32b, prec="month"),
    co("cn-2024-sy24c-sj6", "2024-03-01", "2024-12-31", "China", "SY-24C 01, SY-24C 02, SY-24C 03, SJ-6 05A, SJ-6 05B", "Each other", "rpo", "LEO",
       "Five satellites made close approaches from March to April 2024 (at times under 1 km apart), made further approaches in "
         "September, and in December 2024 SY-24C 03 and SJ-6 05A came within 'tens of meters' five times.",
       "high", swfx("Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-05 (PDF p. 166)"), prec="month",
       notes="The activity was not continuous: March to April, September and December 2024. A US Space Force fact sheet quoted by "
         "the Secure World Foundation (SWF) describes the March to April activity. This entry is not a finding on intent."),
    co("cn-2025-sy12-02-usa336", "2025-09-01", "2025-09-30", "China", "SY-12 02", "USA 336 (US SBIRS GEO 6)", "rpo", "GEO",
       "SY-12 02 got within about 60 km of USA 336, possibly in an attempt to image it. The Secure World Foundation (SWF) "
         "quotes an analyst saying it is unknown whether the maneuver was meant to optimize imaging.",
       "medium", swfx("Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-12 (PDF p. 173)"), prec="month"),
    co("cn-2025-sj21-sj25-rpo", "2025-06-13", "2025-06-14", "China", "SJ-21", "SJ-25", "rpo", "GEO",
       "After SJ-21 drifted west along the geostationary (GEO) belt toward SJ-25 in early June 2025, the two made close "
         "approaches on 13–14 June. At times they could not be told apart. On 13 June they got within 1 km, possibly docked, "
         "then separated.",
       "medium", swfx("Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-12 (PDF p. 173) and p. 03-13 (PDF p. 174)"),
       notes="This entry splits the Secure World Foundation's (SWF) single Table 3-2 line (Jun. 2025–Jan. 2026) into dated steps, "
         "using SWF's text. SJ-25's declared purpose was 'satellite fuel replenishment and life extension service technology "
         "verification' (SWF p. 03-12).", scene="rpo"),
    co("cn-2025-sj21-sj25-docking", "2025-06-30", "2025-11-25", "China", "SJ-21", "SJ-25", "docking", "GEO",
       "The pair appeared close enough to dock on 30 June, were thought to have docked between 2 and 6 July, and remained "
         "docked until November 2025. In August they made maneuvers together that changed the tilt of their orbit, and by 16 "
         "Aug. they sat 3 km below the belt at 127° E.",
       "medium", swfx("Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-13 (PDF p. 174)"),
       notes="The Secure World Foundation (SWF) hedges the early dates ('appeared', 'thought to have docked') and then says they "
         "'remained docked'. SWF says the Chinese government has released no information about them. The end date is the SJ-25 "
         "separation burn (engine firing) on 25 Nov. Analysts quoted by SWF believe SJ-25 served as a gas station for SJ-21; SWF "
         "does not present that as confirmed.",
       scene="rpo"),
    co("cn-2025-sj21-sj25-undock", "2025-11-25", "2025-11-29", "China", "SJ-25", "SJ-21", "release", "GEO",
       "SJ-25 fired its engine on 25 Nov. in a way that COMSPOC, a commercial space-tracking company, called consistent with "
         "an undocking or separation. Imagery dated 29 Nov. showed two distinguishable satellites about 10 km apart.",
       "high", swfx("Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-13 (PDF p. 174)")),
    co("cn-2025-sj21-sj25-rpo-dec", "2025-12-18", "2026-01-16", "China", "SJ-21", "SJ-25", "rpo", "GEO",
       "After undocking the pair kept making close approaches: within 1.3 km on 18 Dec., not distinguishable on 20 Dec., often "
         "within 5 km in early Jan. 2026 with a closest approach just under 3 km on 13 Jan. By 16 Jan. they were 130 km apart.",
       "high", swfx("Table 3-2, p. 03-16 (PDF p. 177); passage, p. 03-13 (PDF p. 174)")),
    # ---------------------------------------------------------------- Russia (Table 2-3)
    co("ru-2014-cosmos2499", "2014-06-01", "2016-03-31", "Russia", "Cosmos 2499", "Briz-KM upper stage (R/B)", "rpo", "LEO",
       "Cosmos 2499 made a series of maneuvers to bring it close to, and then away from, the Briz-KM upper stage.",
       "high", T23, prec="month", notes="The orbit was between 1,480 and 1,501 km up, tilted 82.4 degrees to the equator."),
    co("ru-2015-cosmos2504-briz", "2015-04-01", "2017-04-30", "Russia", "Cosmos 2504", "Briz-KM upper stage (R/B)", "rpo", "LEO",
       "Cosmos 2504 maneuvered to approach the Briz-KM upper stage and may have had a slight impact before separating again.",
       "medium", T23, prec="month", notes="The orbit was between 1,172 and 1,507 km up, tilted 82.5 degrees to the equator."),
    co("ru-2017-cosmos2504-fy1c", "2017-03-01", "2017-04-30", "Russia", "Cosmos 2504", "A piece of Chinese debris from the 2007 ASAT test (Fengyun-1C)", "rpo", "LEO",
       "After a year of dormancy, Cosmos 2504 made a close approach to a piece of Chinese debris from the 2007 anti-satellite "
         "test.",
       "high", T23, prec="month", notes="The orbit was between 848 and 1,507 km up, tilted 82.6 degrees to the equator."),
    co("ru-2014-luch-olymp", "2014-10-01", "2025-10-31", "Russia", "Luch (Olymp)", "More than two dozen communications satellites", "rpo", "GEO",
       "Luch parked near more than two dozen communications satellites (owned by Russia, China, the US, Pakistan, Turkey, the "
         "United Arab Emirates, France and Italy), coming within 1.8 km of Intelsat 36 at closest. It was moved to a graveyard "
         "orbit, a disposal orbit above the geostationary belt, in October 2025 and was reported to have broken into fragments "
         "in January 2026.",
       "high", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-12 (PDF p. 125) and p. 02-13 (PDF p. 126)"), prec="month",
       notes="The Secure World Foundation (SWF) cites Kratos and Russian sources for a likely signals-intelligence mission, done by "
         "parking close enough to pick up the signals that ground stations send up to satellites (p. 02-13). That is SWF's "
         "assessment, not an observed fact."),
    co("ru-2017-cosmos2521-2519", "2017-08-01", "2017-10-31", "Russia", "Cosmos 2521", "Cosmos 2519 (and Cosmos 2523)", "docking", "LEO",
       "Cosmos 2521 separated from Cosmos 2519, made small inspection maneuvers, then redocked with it; Cosmos 2523 separated from Cosmos 2521 and did not maneuver on its own.",
       "high", T23, prec="month",
       notes="The orbit was between 650 and 670 km up, tilted 97.9 degrees to the equator. The Secure World Foundation (SWF) says "
         "(p. 02-10) that the US military considers the Cosmos 2523 separation a weapons test."),
    co("ru-2018-cosmos2521-2519", "2018-03-01", "2018-04-30", "Russia", "Cosmos 2521", "Cosmos 2519", "rpo", "LEO",
       "Cosmos 2521 made close approaches to Cosmos 2519.",
       "high", T23, prec="month", notes="The source table leaves the orbit blank, so the entry uses low Earth orbit (LEO) from the previous line for the same "
         "pair."),
    co("ru-2019-cosmos2535-2536", "2019-08-01", "2019-12-31", "Russia", "Cosmos 2535", "Cosmos 2536", "rpo", "LEO",
       "Cosmos 2535 and Cosmos 2536 made at least 25 individual close approaches, coming to within 2 km and ranging as far "
         "apart as 380 km.",
       "high", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-09 (PDF p. 122)"), prec="month",
       notes="The orbit was between 621 and 623 km up, tilted 97.88 degrees to the equator. The Secure World Foundation (SWF) "
         "reports (p. 02-09) that debris objects were released near the pair before and during the close approaches."),
    co("ru-2019-cosmos2542-release", "2019-12-06", "2019-12-06", "Russia", "Cosmos 2542", "Cosmos 2543 (subsatellite)", "release", "LEO",
       "On 6 Dec. 2019 Cosmos 2542 released a small satellite, listed in the tracking catalog as Cosmos 2543 and announced by "
         "Russia. Cosmos 2543 stayed within 2 km of Cosmos 2542 for three days, then raised its apogee (the highest point of its "
         "orbit) to 590 km by 16 Dec.",
       "high", pin(("Cosmos 2542 passage", "02-09", 122)), notes="This entry comes from the text of the Secure World Foundation (SWF). Its Table 2-3 folds the release into the 'Dec. "
         "2019 - Mar. 2020' line.", scene="rpo"),
    co("ru-2019-cosmos2542-2543-usa245", "2019-12-01", "2020-03-31", "Russia", "Cosmos 2542 and Cosmos 2543", "USA 245 (US NRO imaging satellite)", "rpo", "LEO",
       "Cosmos 2543 moved to an orbit synchronized with USA 245, came within 20 km several times in January 2020 and then "
         "periodically within 150 to 300 km while USA 245 was in sunlight. The US called the behavior 'unusual and disturbing' "
         "and Russia's Foreign Ministry denied any threat.",
       "medium", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-09 (PDF p. 122) and p. 02-10 (PDF p. 123)"), prec="month",
       conflicts=["SWF's text says Cosmos 2543 came within 20 km of USA 245 several times in January 2020; Table 2-3 says Cosmos 2542 came 'within 30 km'. The ledger uses the text's 20 km. (The table line also reads 'Cosmos 2542 did station keeping with Cosmos 2542', evidently meaning Cosmos 2543.)"],
       notes="The Secure World Foundation (SWF) says the purpose 'strongly suggests' observing USA 245 (an amateur analysis) and its "
         "table says 'likely for the purpose of surveillance'. The orbit was between 590 and 859 km up, tilted 97.9 degrees to "
         "the equator.", scene="rpo"),
    co("ru-2020-cosmos2543-2535", "2020-06-01", "2020-10-31", "Russia", "Cosmos 2543", "Cosmos 2535 (with Cosmos 2536)", "rpo", "LEO",
       "Cosmos 2543 met up with Cosmos 2535 and released a small object at high relative speed. In September Cosmos 2536 "
         "joined and may have docked with Cosmos 2535.",
       "medium", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-10 (PDF p. 123) and p. 02-11 (PDF p. 124)"), prec="month",
       notes="The Secure World Foundation (SWF) says US Space Command called the July 2020 object release a space-based weapons test "
         "and that Russia's Foreign Ministry denied that. The source table leaves the orbit blank, so the entry uses low Earth "
         "orbit (LEO) from the neighboring lines."),
    co("ru-2022-cosmos2558-usa326", "2022-08-01", "2024-05-31", "Russia", "Cosmos 2558", "USA 326 (US NRO imaging satellite)", "rpo", "LEO",
       "Cosmos 2558 matched the orbital plane of USA 326 and made repeat close approaches, within 50 km about once a week. US "
         "Space Command called the launch behavior 'dangerous and irresponsible'.",
       "low", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-11 (PDF p. 124)"),
       conflicts=["Table 2-3 dates the line 'Feb. 2022 - May 2024?'; SWF's text says Cosmos 2558 launched on 1 Aug. 2022. The ledger starts the row at the launch date and keeps the table's '?' end date."],
       notes="Confidence is low: the source table's end date carries a '?' and its start date disagrees with the text. The "
         "Secure World Foundation (SWF) says the pair is 'not in an actual proximity orbit'."),
    co("ru-2022-cosmos2562-resurs-p3", "2022-11-01", "2022-11-30", "Russia", "Cosmos 2562", "Resurs-P3", "rpo", "LEO",
       "A formerly inactive Resurs-P3 lowered its orbit by 20 km on 15 Nov. On 22 Nov. Cosmos 2562 maneuvered to make a close "
         "approach to it.",
       "high", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-16 (PDF p. 129)"), prec="month", notes="The orbit was between 385 and 400 km up, tilted 97.2 degrees to the equator."),
    co("ru-2023-luch-olymp-2", "2023-03-01", None, "Russia", "Luch (Olymp) 2", "Multiple American and European communications satellites", "rpo", "GEO",
       "Luch 2 has parked next to multiple American and European communications satellites, moving along the geostationary "
         "(GEO) belt every two to four months (closest approaches from about 20 km in Slingshot's June 2024 list). The Secure "
         "World Foundation (SWF) lists the activity as ongoing.",
       "high", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-14 (PDF p. 127)"), prec="month"),
    co("ru-2025-cosmos2581-2583", "2025-02-01", None, "Russia", "Cosmos 2581, Cosmos 2582, Cosmos 2583", "Each other", "rpo", "LEO",
       "The three satellites have been making close approaches since launch, taking turns as the target and as the approaching "
         "satellite (the chaser). At times they were under 1 km apart and, according to COMSPOC (a commercial space-tracking "
         "company), within 80 m in October 2025. The Secure World Foundation (SWF) lists the activity as ongoing.",
       "high", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-12 (PDF p. 125)"), prec="month", notes="At launch the orbit was about 578 to 595 km up and tilted 82 degrees to the equator."),
    co("ru-2025-cosmos2558-object-c", "2025-06-01", None, "Russia", "Cosmos 2558", "Object C (released by Cosmos 2558) and USA 326", "release", "LEO",
       "Cosmos 2558 released Object C in June 2025. Object C made close approaches around Cosmos 2558 and by July 2025 was "
         "approaching USA 326 closely. The source table's end date is 'present?'.",
       "low", swfx("Table 2-3, p. 02-15 (PDF p. 128); passage, p. 02-11 (PDF p. 124)"), prec="month",
       notes="Confidence is low because the source table's end date carries a '?'. The orbit was about 450 km up."),
    co("ru-2025-cosmos2589-2590", "2025-06-01", "2025-11-30", "Russia", "Cosmos 2589", "Cosmos 2590 (released object)", "release", "HEO",
       "Cosmos 2589 released an object later listed in the tracking catalog as Cosmos 2590, which made close approaches around "
         "Cosmos 2589. In November 2025 Cosmos 2589 began making its orbit more circular to reach geostationary orbit (GEO).",
       "high", T23, prec="month", notes="The orbit was highly elliptical (very elongated): the highest point (apogee) was 51,200 km and the lowest point "
         "(perigee) was 20,374 km."),
    # ---------------------------------------------------------------- Spaceplane missions (US Table 1-1, China Table 3-1)
    co("us-2010-otv1", "2010-04-22", "2010-12-03", US, "X-37B OTV-1", None, "spaceplane_mission", "LEO",
       "First flight of the X-37B spaceplane: launched from Cape Canaveral, landed at Vandenberg Air Force Base after 224 days "
         "in orbit. The Secure World Foundation (SWF) says the specifics of the mission were not given.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-04 (PDF p. 53)"),
       notes="SWF says (p. 01-09) that to date the X-37B has not approached or rendezvoused with any other space object. The orbit "
         "counts as low Earth orbit (LEO) because SWF states that earlier flights 'stayed well within LEO' (p. 01-06)."),
    co("us-2011-otv2", "2011-03-05", "2012-06-16", US, "X-37B OTV-2", None, "spaceplane_mission", "LEO",
       "Second X-37B flight, using the second vehicle: launched from Cape Canaveral, landed at Vandenberg Air Force Base after "
         "469 days. The mission was extended after about 270 days for 'additional experimentation opportunities'.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-04 (PDF p. 53) and p. 01-05 (PDF p. 54)")),
    co("us-2012-otv3", "2012-12-11", "2014-10-17", US, "X-37B OTV-3", None, "spaceplane_mission", "LEO",
       "Third X-37B flight, the first to reuse a vehicle (the one flown on the first flight, OTV-1): launched from Cape "
         "Canaveral, landed at Vandenberg Air Force Base after 675 days.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-05 (PDF p. 54)")),
    co("us-2015-otv4", "2015-05-20", "2017-05-07", US, "X-37B OTV-4", None, "spaceplane_mission", "LEO",
       "Fourth X-37B flight: launched from Cape Canaveral with an experiment on a Hall thruster (an electric engine) and NASA "
         "tests of how materials stand up to space; landed at Kennedy Space Center after 718 days, the first landing there.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-05 (PDF p. 54)")),
    co("us-2017-otv5", "2017-09-07", "2019-10-27", US, "X-37B OTV-5", None, "spaceplane_mission", "LEO",
       "Fifth X-37B flight, the first on a Falcon 9 rocket and the first into an orbit tilted more steeply to the equator: "
         "landed at Kennedy Space Center after a then-record 780 days. Three satellites were listed in the tracking catalog as "
         "associated with it in Feb. 2020 (USA 295 to 297), with no orbital data. The Secure World Foundation (SWF) concludes "
         "they were deployed from the X-37B itself.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-05 (PDF p. 54)"),
       notes="SWF's inference that the small satellites (cubesats) were deployed by the X-37B is its own conclusion from the catalog "
         "record, not an official statement of the deployment."),
    co("us-2020-otv6", "2020-05-17", "2022-11-12", US, "X-37B OTV-6", None, "spaceplane_mission", "LEO",
       "Sixth X-37B flight, the first with a new service module (an add-on section): launched from Cape Canaveral, landed at "
         "Kennedy Space Center after 908 days (a record). It released a small satellite (USA 300) in May 2020 and FalconSAT-8 in "
         "October 2021. Russian reports claimed a further small object was released in Oct. 2021.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-06 (PDF p. 55)"),
       notes="The Russian claim of a release in Oct. 2021 (an object keeping about 200 m away for a day) is a report the Secure "
         "World Foundation (SWF) cites. SWF does not confirm it. The service module separated before landing."),
    co("us-2023-otv7", "2023-12-28", "2025-03-07", US, "X-37B OTV-7", None, "spaceplane_mission", "HEO",
       "Seventh X-37B flight: launched from Kennedy Space Center. An amateur astronomer located it in Feb. 2024 in a highly "
         "elliptical (very elongated) orbit, from 323 to 38,838 km up and tilted 59.1 degrees to the equator, far higher than "
         "earlier flights. The US Space Force announced in Oct. 2024 that it would use air drag to lower its orbit "
         "(aerobraking). It landed at Vandenberg Space Force Base on 7 Mar. 2025 after 434 days.",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-06 (PDF p. 55); Figure 1-3 and passage, p. 01-07 (PDF p. 56)"),
       notes="The Secure World Foundation (SWF) says it is unclear whether OTV-7 went back to a highly elliptical orbit (HEO) or "
         "stayed in low Earth orbit (LEO) after the aerobraking. The 38,838 km apogee (highest point) is a hobbyist tracking "
         "figure quoted by SWF. A US Space Force image gave 38,318 km on 30 Jan. 2024 near apogee.", scene="spaceplanes"),
    co("us-2025-otv8", "2025-08-21", None, US, "X-37B OTV-8", None, "spaceplane_mission", "not_stated",
       "Eighth X-37B flight: launched on a Falcon 9 rocket from Launch Complex 39A at Kennedy Space Center. The Secure World "
         "Foundation (SWF) says it was still in orbit as of Feb. 2026 and that Boeing described technology demonstrations "
         "including laser communications and a quantum inertial sensor (a type of motion sensor).",
       "high", swfx("Table 1-1, p. 01-08 (PDF p. 57); passage, p. 01-07 (PDF p. 56)"), notes="SWF gives no orbit for OTV-8. The US Space Force release did not describe the mission."),
    co("cn-2020-csshq1", "2020-09-04", "2020-09-06", "China", "China's reusable experimental spacecraft (CSSHQ), flight 1 (PRC Test Spacecraft, 2020-063A)", None, "spaceplane_mission", "LEO",
       "First flight: launched from Jiuquan on a Long March-2F and listed in the tracking catalog in an orbit between 331 and "
         "348 km up, tilted 50.2 degrees to the equator. It re-entered the atmosphere after 2 days (outside experts suggested a "
         "landing at Lop Nur), and an unidentified payload (Object A) was cataloged.",
       "high", swfx("Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-06 (PDF p. 167)"),
       notes="The Secure World Foundation (SWF) says the mission of the small satellite is unknown. The spaceplane and the object "
         "were not registered with the UN as of Feb. 2026."),
    co("cn-2022-csshq2", "2022-08-04", "2023-05-08", "China", "CSSHQ flight 2 (PRC Test Spacecraft 2, 2022-093A)", None, "spaceplane_mission", "LEO",
       "Second flight: launched from Jiuquan into an orbit between 346 and 593 km up, tilted 49.99 degrees to the equator. On "
         "23 Oct. 2022 it raised its perigee (the lowest point of its orbit), leaving an orbit of about 597 to 607 km, and an "
         "object (Object J) was listed in the tracking catalog. State media announced re-entry on 8 May 2023 after 276 days (697 "
         "days after the prior flight ended).",
       "high", swfx("Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-07 (PDF p. 168)"),
       related=["cn-2022-pts2-object-j"], scene="spaceplanes"),
    co("cn-2023-csshq3", "2023-12-14", "2024-09-05", "China", "CSSHQ flight 3 (PRC Test Spacecraft 3, 2023-195A)", None, "spaceplane_mission", "LEO",
       "Third flight: launched from Jiuquan into an orbit between 333 and 348 km up, tilted 49.99 degrees to the equator (220 "
         "days after the prior flight). It was raised to about 601 to 609 km in late Jan. 2024, released Object G on 24 May 2024 "
         "and landed after 268 days.",
       "high", swfx("Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-07 (PDF p. 168)"),
       conflicts=["Table 3-1 gives the landing as 5 Sep. 2024; SWF's text says it landed on 6 Sep. 2024, both after 268 days. The ledger uses the table."]),
    co("cn-2026-csshq4", "2026-02-06", None, "China", "CSSHQ flight 4 (PRC Test Spacecraft 4, 2026-024A)", None, "spaceplane_mission", "LEO",
       "Fourth flight: launched from Jiuquan on a Long March-2F (519 days after the prior flight). It was first listed in the "
         "tracking catalog in an orbit between 344 and 590 km up, tilted 50 degrees to the equator, and about five days later in "
         "an orbit between 588 and 597 km. Xinhua, the Chinese state news agency, said it would verify reusable-spacecraft "
         "technology for 'the peaceful use of space'. The Secure World Foundation (SWF) had not yet reported a landing (April "
         "2026 edition).",
       "high", swfx("Table 3-1, p. 03-08 (PDF p. 169); passage, p. 03-08 (PDF p. 169)"),
       notes="SWF's text says the flight started 'in February 2026'. Its Table 3-1 gives 6 Feb. 2026."),
]

# Short verbatim SWF 2026 quotation per row (at most 15 words, a substring of the extracted SWF text; checked when the row was verified).
# The fuller cell-by-cell evidence is in co_verify.py and verification_history.md.
EVIDENCE = {
    "us-2003-xss10": "within 50 meters of the Delta upper stage",
    "us-2005-xss11": "over the next 12-18 months",
    "us-2005-dart": "ended up bumping into it",
    "us-2007-astro-nextsat": "separations, close approaches, and dockings with each other",
    "us-2008-dsp23-mitex": "maneuvered from their parking slots in GSO to drift towards the location of DSP 23",
    "us-2009-pan": "launched on September 8, 2009",
    "us-2014-gssap": "performing RPO with various other objects in the GEO region",
    "us-2014-angels": "decommissioned in November 2017",
    "us-2014-clio": "approached other orbital slots",
    "us-2018-mycroft-eagle": "Mycroft conducted RPO of EAGLE in the GEO region",
    "us-2019-mycroft-s5": "conduct a series of RPO maneuvers with S5 over a period of weeks",
    "us-2020-usa271-sj20": "The Chinese spacecraft detected the US satellite and rapidly moved away.",
    "us-2022-usa270-sy12": "apparently also getting an imaging opportunity on USA 270",
    "us-2024-ldpe3a-sj23": "started maneuvering close to China's SJ-23",
    "us-2025-usa271-tjs15": "estimated to have been 33 km",
    "us-2025-usa324-tjs16-17": "getting within 17 km of TJS-16 and 12 km of TJS-17",
    "us-2025-us-france-first-rpo": "unclear which country that spacecraft belonged to",
    "us-2025-usa271-skynet5a": "at its closest point, was 13 km away",
    "us-2025-usa324-syracuse3a": "three sets of maneuvers observed",
    "us-2025-gssap-flank-sj21-sj25": "most likely to monitor",
    "cn-2008-bx1-sz7": "BX-1 was deployed from SZ-7",
    "cn-2010-sj12-sj06f": "may have bumped into each other",
    "cn-2013-sy7-sj15-cx3": "likely carried a robotic arm",
    "cn-2013-sy7-release": "On October 18, 2013, the SY-7 initiated a small maneuver",
    "cn-2016-sj17-chinasat": "strongly suggests that SJ-17 was used to inspect Chinasat 1",
    "cn-2019-tjs3-akm": "object 43917 appears to be a subsatellite, not an AKM",
    "cn-2019-tjs3-roaming": "periodically stopping to conduct RPO with other satellites",
    "cn-2020-sj17-chinasat6b-sj20": "January 2020 and SJ-20 in October 2020",
    "cn-2022-sj21-compass-g2": "290 km to 3,100 km above the protected GEO zone",
    "cn-2022-sj6-05a-05b": "get within 1 km of SJ-6 05B repeatedly",
    "cn-2022-pts2-object-j": "including repeated docking, deployment, and formation flying",
    "cn-2024-sj23-akm": "the SJ-23 appeared to release another object",
    "cn-2024-pts3-object-g": "bring it within several kilometers of Object G on June 8",
    "cn-2023-sj17-venesat1": "made a brief RPO in Nov. 2023 with VENESAT-1",
    "cn-2024-sy24c-sj6": "SY-24C 03 and SJ6 5A came within “tens of meters” of each other",
    "cn-2025-sy12-02-usa336": "getting within 60 km of USA 336, possibly in an attempt to image it",
    "cn-2025-sj21-sj25-rpo": "got within 1 km of each, possibly docked, and then separated",
    "cn-2025-sj21-sj25-docking": "They again appeared to come close enough to dock on June 30",
    "cn-2025-sj21-sj25-undock": "consistent with an undock or separation maneuver",
    "cn-2025-sj21-sj25-rpo-dec": "closest approach - just under 3 km - on January 13",
    "ru-2014-cosmos2499": "close to, and then away from",
    "ru-2015-cosmos2504-briz": "may have had a slight impact before separating again",
    "ru-2017-cosmos2504-fy1c": "close approach with a piece of Chinese space debris",
    "ru-2014-luch-olymp": "closest known approach was with 1.8 km of Intelsat 36",
    "ru-2017-cosmos2521-2519": "before redocking with Cosmos 2519",
    "ru-2018-cosmos2521-2519": "Cosmos 2521 conducted close approaches of Cosmos 2519.",
    "ru-2019-cosmos2535-2536": "to within 2 km and as far apart as 380 km",
    "ru-2019-cosmos2542-release": "On December 6, Cosmos 2542 released a small subsatellite",
    "ru-2019-cosmos2542-2543-usa245": "within 20 km of USA 245 several times in January 2020",
    "ru-2020-cosmos2543-2535": "close approaches within 60 kilometers",
    "ru-2022-cosmos2558-usa326": "getting within 50 km of USA 326 once a week",
    "ru-2022-cosmos2562-resurs-p3": "on November 22, Cosmos 2562 maneuvered to conduct an RPO",
    "ru-2023-luch-olymp-2": "Luch 2 has parked next to multiple American and European communications satellites",
    "ru-2025-cosmos2581-2583": "within 80 m of each other",
    "ru-2025-cosmos2558-object-c": "Cosmos 2558 released Object C in June 2025",
    "ru-2025-cosmos2589-2590": "Cosmos 2590 conducted RPOs around Cosmos 2589",
    "us-2010-otv1": "The specifics were not given.",
    "us-2011-otv2": "additional experimentation opportunities",
    "us-2012-otv3": "first to reuse a flight vehicle",
    "us-2015-otv4": "the first time the vehicle had landed at that site",
    "us-2017-otv5": "no orbital information was provided for those three satellites",
    "us-2020-otv6": "released another subsatellite",
    "us-2023-otv7": "323 x 38,838 km x 59.1 deg inclination",
    "us-2025-otv8": "As of February 2026, OTV-8 is still in orbit.",
    "cn-2020-csshq1": "in a 348 km by 331 km and 50.2° inclination orbit",
    "cn-2022-csshq2": "346 km by 593 km at 49.99",
    "cn-2023-csshq3": "It landed on September 6, 2024, after 268 days",
    "cn-2026-csshq4": "588 km x 597 km orbit",
}
for _r in CO:
    _r["evidence"] = EVIDENCE[_r["id"]]
