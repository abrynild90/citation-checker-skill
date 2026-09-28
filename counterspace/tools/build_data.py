"""Builds the Counterspace Timeline ledger (events.json, legal.json,
capabilities.json, ledger.md) from the rows below.

Every row carries source, source_url, and pin. SWF pins use the report's
printed section-page numbers ("p. 05-01") plus the PDF page index.
"""
import json, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "data"
SWF = "SWF 2026"
SWF_URL = ("https://cdn.prod.website-files.com/66dcc6872f6ed23bce1db235/"
           "69d5402700ec843d95073a1e_SWF_Global_Counterspace_Capabilities_2026.pdf")
DEBRIS_ASOF = "2026-02"  # SWF 2026 Table 5-1 / Nudol text: "As of February 2026"


def swf(pin, pdf):
    return dict(source=SWF, source_url=SWF_URL, pin=f"p. {pin} (PDF p. {pdf})")


def k(id, date, state, system, target, type, alt, kind, frag=None, orbit=None,
      conf="high", notes="", scene=None, src=None):
    row = dict(id=id, domain="kinetic", date=date, state=state, system=system,
               target=target, type=type, altitude_km=alt, altitude_kind=kind,
               fragments_cataloged=frag, fragments_in_orbit=orbit,
               fragments_as_of=DEBRIS_ASOF if frag is not None else None,
               confidence=conf, notes=notes)
    row.update(src)
    if scene:
        row["scene_3d"] = scene
    return row


T14a = lambda: swf("01-23", 72)   # Table 1-4, first page
T14b = lambda: swf("01-24", 73)   # Table 1-4, continued
T51 = lambda: swf("05-01", 212)   # Table 5-1 debris
T24 = lambda: swf("02-21", 134)   # Table 2-4 Nudol
T33 = lambda: swf("03-22", 183)   # Table 3-3 China
T163 = lambda: swf("16-03", 307)  # Appendix Table 16-2 Russia
T164 = lambda: swf("16-04", 308)  # Appendix Tables 16-3/16-4
T41 = lambda: swf("04-03 to 04-04", "203-204")

K = [
    k("us-1959-bold-orion", "1959-10-13", "United States", "Bold Orion", "Explorer 6",
      "flyby", 200, "apogee", notes="SWF: passed within kill radius. Air-launched from B-47.",
      src=T14a()),
    k("us-1962-starfish-prime", "1962-07-09", "United States", "Thor / W49 (Operation Fishbowl)",
      "None (high-altitude nuclear test)", "nuclear", 400, "detonation", conf="medium",
      notes="1.4 Mt at ~400 km over Johnston Island. Created artificial radiation belt that "
            "damaged several satellites. Not in SWF DA-ASAT tables; included only as the nuclear "
            "marker the legal band references.",
      scene="starfish",
      src=dict(source="DOE/NV-209 Rev. 16 (2015)",
               source_url="https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf",
               pin="Operation Dominic/Fishbowl entry, 9 July 1962")),
    k("us-1962-nike-zeus-wsmr", "1962-12-17", "United States", "Program 505 (Nike Zeus)", "None",
      "non_destructive", 160, "apogee", notes="Reached designated point in space.", src=T14a()),
    k("us-1963-nike-zeus-feb", "1963-02-15", "United States", "Program 505 (Nike Zeus)", "None",
      "non_destructive", 241, "apogee", notes="Intercept of designated point in space.", src=T14a()),
    k("us-1964-nike-zeus-jan", "1964-01-04", "United States", "Program 505 (Nike Zeus)", "None (simulated target)",
      "non_destructive", 146, "apogee", notes="Successful intercept of simulated satellite target.", src=T14a()),
    k("us-1964-p437-feb", "1964-02-14", "United States", "Program 437 (Thor)", "Transit 2A rocket body",
      "non_destructive", 1000, "apogee", notes="Passed within kill radius (nuclear-armed system; test unarmed).", src=T14a()),
    k("us-1964-p437-mar", "1964-03-01", "United States", "Program 437 (Thor)", "Unknown",
      "non_destructive", 674, "apogee", notes="Backup missile passed within kill radius.", src=T14a()),
    k("us-1964-p437-apr", "1964-04-21", "United States", "Program 437 (Thor)", "Unknown",
      "non_destructive", 778, "apogee", notes="Passed within kill radius.", src=T14a()),
    k("us-1964-p437-may", "1964-05-28", "United States", "Program 437 (Thor)", "Unknown",
      "non_destructive", 932, "apogee", notes="Failed (missed intercept point).", src=T14a()),
    k("us-1964-p437-nov", "1964-11-16", "United States", "Program 437 (Thor)", "Unknown",
      "non_destructive", 1148, "apogee", notes="Combat test launch; passed within kill radius.", src=T14a()),
    k("us-1965-p437-apr", "1965-04-05", "United States", "Program 437 (Thor)", "Transit 2A rocket body",
      "non_destructive", 826, "apogee", notes="Passed within kill radius.", src=T14a()),
    k("us-1967-p437-mar", "1967-03-30", "United States", "Program 437 (Thor)", "Unknown debris object",
      "non_destructive", 484, "apogee", notes="Combat evaluation launch.", src=T14a()),
    k("us-1968-p437-may", "1968-05-15", "United States", "Program 437 (Thor)", "Unknown",
      "non_destructive", 823, "apogee", notes="Combat evaluation launch.", src=T14a()),
    k("us-1968-p437-nov", "1968-11-21", "United States", "Program 437 (Thor)", "Unknown",
      "non_destructive", 1158, "apogee", notes="Combat evaluation launch.", src=T14b()),
    k("us-1970-p437-mar", "1970-03-28", "United States", "Program 437 (Thor)", "Unknown satellite",
      "non_destructive", 1074, "apogee", notes="Passed within kill radius.", src=T14b()),
    k("us-1984-asm135-jan", "1984-01-21", "United States", "ASM-135 (F-15)", "None",
      "non_destructive", 1000, "apogee", notes="Missile test, no target.", src=T14b()),
    k("us-1985-solwind", "1985-09-13", "United States", "ASM-135 (F-15)", "Solwind P78-1",
      "destructive", 530, "intercept", frag=285, orbit=0,
      notes="Conflict inside SWF 2026: Table 5-1 gives 530 km intercept; Table 1-4 gives 555 km "
            "(apogee column). Builder uses Table 5-1 for all intercept altitudes.",
      scene="solwind", src=T51()),
    k("us-2008-burnt-frost", "2008-02-20", "United States", "SM-3 (USS Lake Erie)", "USA-193",
      "destructive", 220, "intercept", frag=175, orbit=0,
      notes="Missile-defense interceptor (SM-3) used against a satellite: the case shows the "
            "ballistic missile defense / ASAT overlap. Date is 20 Feb 2008 US Eastern time "
            "(21 Feb UTC). Table 1-4 lists 2,700 km in its apogee column (interceptor reach, "
            "not intercept); Table 5-1 intercept altitude used.",
      scene="burnt-frost", src=T51()),
    k("cn-2005-sc19", "2005-07-05", "China", "SC-19", "None known", "non_destructive", None, "apogee",
      conf="medium", notes="Likely rocket test. Altitude not reported. SWF Table 3-3 dates it 7 July; "
            "Appendix Table 16-3 dates it 5 July. Appendix date used.", src=T164()),
    k("cn-2006-sc19", "2006-02-06", "China", "SC-19", "None known", "non_destructive", None, "apogee",
      conf="medium", notes="Likely near-miss of orbital target. Altitude not reported.", src=T164()),
    k("cn-2007-fy1c", "2007-01-11", "China", "SC-19", "Fengyun-1C", "destructive", 880, "intercept",
      frag=3532, orbit=2351,
      notes="Largest debris-generating event on record. Conflict inside SWF 2026: Table 5-1 gives "
            "880 km and 3,532 tracked pieces; Table 3-3 gives 865 km apogee and 3,533 pieces. "
            "Table 5-1 used for consistency with the other intercepts.",
      scene="fengyun", src=T51()),
    k("cn-2010-midcourse", "2010-01-11", "China", "SC-19", "CSS-X-11 ballistic missile", "midcourse_intercept",
      250, "intercept", notes="Destruction of suborbital target; no orbital debris.", src=T33()),
    k("cn-2013-midcourse", "2013-01-27", "China", "Possible SC-19", "Unknown ballistic missile",
      "midcourse_intercept", None, "intercept", conf="medium",
      notes="Suborbital intercept; altitude not reported.", src=T33()),
    k("cn-2013-dn2", "2013-05-13", "China", "Possible DN-2", "None known", "apogee_only", 30000, "apogee",
      conf="medium",
      notes="Not an intercept. Chinese Academy of Sciences said 10,000 km; US officials said 'nearly "
            "to GEO'; technical analysis cited by SWF puts apogee at least ~30,000 km. Builder "
            "plots ~30,000 km (SWF Table 3-3 value).",
      scene="dn2", src=swf("03-20, 03-22", "181, 183")),
    k("cn-2014-dn2", "2014-07-23", "China", "Possible DN-2", "Likely ballistic missile", "non_destructive",
      None, "apogee", conf="medium",
      notes="Likely intercept test; US State Department called it a non-destructive ASAT test.",
      src=T33()),
    k("cn-2015-dn3", "2015-10-30", "China", "Possible DN-3", "None known", "non_destructive", None, "apogee",
      conf="medium", notes="Likely rocket test.", src=T33()),
    k("cn-2017-dn3", "2017-07-23", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Likely intercept test; reportedly malfunctioned.", src=T33()),
    k("cn-2018-dn3", "2018-02-05", "China", "Possible DN-3", "CSS-5 ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Likely intercept test.", src=T33()),
    k("cn-2021-dn3", "2021-02-04", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Announced by China as a land-based midcourse interception test.", src=T33()),
    k("cn-2022-dn3", "2022-06-19", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium",
      notes="SWF Table 3-3 gives 19 June 2022; Appendix Table 16-3 gives 21 June 2022. Table 3-3 used.",
      src=T33()),
    k("cn-2023-dn3", "2023-04-14", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Likely intercept test.", src=T33()),
    k("ru-2015-nudol", "2015-11-18", "Russia", "Nudol", "None", "non_destructive", 200, "apogee", conf="low",
      notes="First successful missile test. SWF marks the 200 km apogee with '?'. Appendix Table 16-2 "
            "dates this test 18 Oct 2015; Table 2-4 gives 18 Nov 2015.", src=T24()),
    k("ru-2016-nudol-may", "2016-05-25", "Russia", "Nudol", "None", "non_destructive", 100, "apogee", conf="low",
      notes="Likely rocket test. SWF marks the 100 km apogee with '?'.", src=T24()),
    k("ru-2016-nudol-dec", "2016-12-16", "Russia", "Nudol", "None", "non_destructive", 100, "apogee", conf="low",
      notes="Likely rocket test. SWF marks the 100 km apogee with '?'.", src=T24()),
    k("ru-2018-nudol-mar", "2018-03-26", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="First test from a mobile launcher.", src=T24()),
    k("ru-2018-nudol-dec", "2018-12-23", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="Likely KKV; no intercept.", src=T24()),
    k("ru-2020-nudol-apr", "2020-04-15", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="Successful, nothing hit. US Space Command publicly criticized the test.", src=T24()),
    k("ru-2020-nudol-dec", "2020-12-16", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="Successful, nothing hit.", src=T24()),
    k("in-2019-shakti", "2019-03-27", "India", "PDV Mk-II (Mission Shakti)", "Microsat-R", "destructive",
      300, "intercept", frag=130, orbit=0,
      notes="Indian officials said debris would decay within 45 days; some pieces were tracked "
            "above the ISS and lasted longer. Seed '~400 estimated' pieces not found in SWF; not used.",
      scene="shakti", src=T51()),
    k("ru-2021-cosmos1408", "2021-11-15", "Russia", "Nudol (PL-19)", "Cosmos 1408", "destructive",
      470, "intercept", frag=1807, orbit=5,
      notes="ISS crew sheltered in docked vehicles. SWF text: more than 1,800 cataloged pieces, 5 still "
            "in orbit as of February 2026. Latest destructive DA-ASAT test in SWF 2026 (no destructive "
            "test through the report's cutoff).",
      scene="cosmos1408", src=T51()),
]

# ---------------------------------------------------------------- non-kinetic

def nk(id, start, end, actor, category, attribution, target_system, regime, operational,
       effect, conf, src, notes="", scene=None):
    row = dict(id=id, domain="non_kinetic", category=category, start=start, end=end,
               actor=actor, attribution=attribution, target_system=target_system,
               target_regime=regime, operational_use=operational, effect=effect,
               confidence=conf, notes=notes)
    row.update(src)
    if scene:
        row["scene_3d"] = scene
    return row


NK = [
    nk("us-1997-miracl", "1997-10-17", "1997-10-17", "United States", "directed_energy", "official_government",
       "MSTI-3 (retired USAF experimental satellite)", "ISR_LEO", False,
       "Test of MIRACL chemical laser (and a low-power laser) against an orbiting satellite; detailed "
       "results not public. Secretary of Defense Cohen called it consistent with US policy.",
       "high", swf("01-35", 84),
       notes="Exact day (17 Oct) from contemporaneous DoD reporting; SWF gives October 1997.",
       scene="laser"),
    nk("ir-2003-telstar12", "2003-01-01", "2006-12-31", "Iran (jamming from Cuba; later Bulgaria, Libya)",
       "ew_uplink", "alleged", "Telstar 12 Persian-language broadcasts", "GEO_comms", False,
       "Uplink jamming of Persian-language programming originating in California.",
       "medium", swf("09-05", 247),
       notes="SWF: Iran 'has been accused'; jamming from Havana began 2003, similar jamming from "
             "Bulgaria and Libya 2005/2006. Attribution kept at 'alleged'. Day/month not given; "
             "span uses whole years."),
    nk("iq-2003-gps", "2003-03-20", "2003-03-25", "Iraq", "gnss_jamming", "official_government",
       "GPS receivers of coalition munitions and aircraft", "GNSS_MEO", True,
       "Russian-made GPS jammers fielded against coalition forces; US officials reported destroying "
       "six jammers (and said they had no effect on US weapons).",
       "medium",
       dict(source="CENTCOM briefing (Maj. Gen. Renuart), 25 Mar 2003 (AFPS report)",
            source_url="https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm",
            pin="Briefing transcript, answer on GPS jammers"),
       notes="Not covered in SWF 2026 (Iraq is not one of SWF's 13 countries). Excluded from Chart B."),
    nk("cn-2006-laser", "2006-01-01", "2006-01-01", "China", "directed_energy", "alleged",
       "US optical imaging satellites", "ISR_LEO", False,
       "DefenseNews cited anonymous US officials claiming lasers 'dazzled' US satellites; later "
       "reporting suggested only illumination; senior officials said no satellite was materially damaged.",
       "low", swf("03-26", 187),
       notes="Point event (year only). Anonymous-source press report; kept low confidence and 'alleged'."),
    nk("ir-2009-eutelsat", "2009-01-01", "2012-12-31", "Iran", "ew_uplink", "multi_government",
       "Eutelsat satellites carrying BBC Persian and Voice of America", "GEO_comms", False,
       "Uplink jamming of Persian-language broadcasts. In 2010 the ITU, acting on Eutelsat complaints, "
       "asked Iran to help stop jamming originating from its territory.",
       "medium", swf("09-06", 248),
       notes="Attribution coded 'multi_government' because an intergovernmental body (ITU) located the "
             "source in Iranian territory; ITU did not find the Iranian state responsible. Start/end "
             "years follow the brief's seed and are not dated precisely in SWF (it cites 2010 ITU action "
             "and 2022 renewed jamming)."),
    nk("kp-2010-gps", "2010-08-01", None, "North Korea", "gnss_jamming", "official_government",
       "GPS receivers of aircraft, ships and vehicles in South Korea", "GNSS_MEO", False,
       "Repeated downlink (terrestrial) GPS jamming near the inter-Korean border; South Korea raised it "
       "with the ITU, ICAO and IMO; further interference reported in November 2024.",
       "high", swf("12-05 to 12-06", "269-270"),
       notes="Terrestrial jamming of receivers, not an attack on GPS satellites (SWF 12-05 says so "
             "expressly). Campaign span, not individual incidents. Start month from South Korean "
             "government reporting of the 2010 campaign; treated as ongoing."),
    nk("ru-2014-ukraine", "2014-03-01", None, "Russia", "gnss_spoofing", "researcher_osint",
       "GNSS receivers in Ukraine, Crimea and the Black Sea", "GNSS_MEO", True,
       "Jamming and spoofing of GNSS in occupied territory and conflict zones; C4ADS logged nearly "
       "10,000 suspected spoofing incidents across Russia, Crimea and Syria.",
       "high", swf("02-26 to 02-28", "139-141"),
       notes="Attribution level follows the C4ADS open-source report SWF relies on; governments have also "
             "blamed Russia, but the source for the span is OSINT. Covers jamming and spoofing."),
    nk("ru-2016-syria", "2016-02-01", None, "Russia", "gnss_jamming", "researcher_osint",
       "GNSS receivers in and around Syria and the eastern Mediterranean", "GNSS_MEO", True,
       "GNSS spoofing/jamming around Russian bases in Syria; reported effects on aircraft in the region.",
       "medium", swf("02-28", 141),
       notes="Start date is the earliest period in the C4ADS dataset as summarized by SWF (2016); the seed "
             "said 2017. Builder uses 2016 at medium confidence."),
    nk("ru-2018-trident", "2018-10-25", "2018-11-07", "Russia", "gnss_jamming", "official_government",
       "GPS receivers in northern Norway and Finland during NATO Trident Juncture", "GNSS_MEO", False,
       "GPS disruption affecting civil aviation during the exercise; Norway said in March 2019 it had "
       "proof of Russian interference.",
       "high", swf("02-28", 141),
       notes="Exercise dates 25 Oct - 7 Nov 2018 (NATO). Norway and Finland both raised it; coded "
             "'official_government' (each state spoke for itself)."),
    nk("ru-2018-peresvet", "2018-03-01", "2018-03-01", "Russia", "directed_energy", "official_government",
       "Satellites overflying Russian mobile ICBM units (stated purpose)", "ISR_LEO", False,
       "Peresvet mobile laser announced by President Putin; later described as dazzling satellites. "
       "Deployment status announced, not demonstrated against a satellite.",
       "medium", swf("02-35", 148),
       notes="Self-declared by the Russian government; no public evidence of use against a satellite.",
       scene="laser"),
    nk("ru-2022-viasat", "2022-02-24", "2022-02-24", "Russia", "cyber", "multi_government",
       "Viasat KA-SAT user terminals (modems) and management network", "ground_segment", True,
       "AcidRain wiper disabled tens of thousands of modems in Ukraine and Europe about an hour before "
       "the invasion; satellite itself unaffected.",
       "high", swf("15-06 to 15-07", "292-293"),
       notes="Publicly attributed to the GRU by the United States, United Kingdom and European Union in "
             "May 2022.",
       scene="viasat"),
    nk("ru-2022-starlink", "2022-03-01", None, "Russia", "ew_downlink", "alleged",
       "Starlink user terminals in Ukraine", "LEO_constellation", True,
       "Jamming claimed by SpaceX (March 2022); Ukrainian official attributed May 2024 outages to Russian "
       "EW testing.",
       "medium", swf("02-32; 15-07", "145, 293"),
       notes="SWF notes no independent validation of the type or magnitude of the jamming; coded 'alleged'."),
    nk("ru-2023-baltic", "2023-12-01", None, "Russia", "gnss_jamming", "multi_government",
       "GNSS receivers of civil aircraft and ships over the Baltic region", "GNSS_MEO", True,
       "Widespread jamming and spoofing affecting Finland, Sweden, Poland and the Baltic states, often "
       "traced to Kaliningrad and St. Petersburg; Finnair paused Tartu flights (Apr 2024).",
       "high", swf("02-29 to 02-30", "142-143"),
       notes="SWF: interference 'picked up in late 2023 and early 2024'; start set to Dec 2023. Multi-"
             "government coding rests on the October 2025 ICAO resolution and ITU RRB findings (Nov 2025). "
             "Terrestrial jamming of receivers, not attacks on satellites.",
       scene="gnss"),
    nk("mideast-2023-gnss", "2023-10-01", None, "Israel and others (multiple actors)", "gnss_spoofing",
       "official_government", "GNSS receivers of aircraft over Israel and neighboring states", "GNSS_MEO", True,
       "Extensive jamming/spoofing in the Eastern Mediterranean and Middle East affecting air traffic "
       "management; Israel's own submission to the ITU RRB (Nov 2025) addressed interference cases.",
       "medium", swf("10-02; 09-06", "255, 248"),
       notes="Actor set is mixed. Israel has acknowledged defensive GNSS disruption; spoofing near Iran "
             "was reported by aviation-security sources (AIN, Sept 2023). Coded at the level SWF supports "
             "for Israel; other actors not attributed here."),
    nk("ru-2024-eu-sats", "2024-03-01", None, "Russia (origin locations cited by ITU RRB)", "ew_uplink",
       "official_government", "Swedish and French broadcasting satellites", "GEO_comms", True,
       "Hijacked/jammed broadcasts over Ukrainian channels; European states complained; RRB (July 2024) "
       "said interference 'seemed to originate' from earth stations near Moscow, Kaliningrad and Pavlovka.",
       "high", swf("02-32", 145),
       notes="Attribution rests on complaining governments (Sweden, France and others); the RRB described "
             "origin locations but did not make a state-responsibility finding."),
]

# ---------------------------------------------------------------- legal

def lg(id, start, end, kind, label, short_note, citation, url, scene=None, related=None, soft=False):
    row = dict(id=id, start=start, end=end, kind=kind, label=label, short_note=short_note,
               citation=citation, source_url=url, soft_law=soft)
    if scene:
        row["scene_3d"] = scene
    if related:
        row["related_events"] = related
    return row


L = [
    lg("ltbt-1963", "1963-08-05", None, "treaty", "Limited Test Ban Treaty",
       "Signed Aug 5, 1963; in force Oct 10, 1963. Bans nuclear tests in outer space. It followed "
       "Starfish Prime; fallout concerns and the Cuban Missile Crisis were also drivers.",
       "Treaty Banning Nuclear Weapon Tests in the Atmosphere, in Outer Space and Under Water, "
       "Aug. 5, 1963, 14 U.S.T. 1313, 480 U.N.T.S. 43.",
       "https://treaties.unoda.org/t/test_ban", scene="starfish", related=["us-1962-starfish-prime"]),
    lg("ost-1967", "1967-01-27", None, "treaty", "Outer Space Treaty",
       "Opened Jan 27, 1967; in force Oct 10, 1967. Art. IV bars nuclear weapons and WMD in orbit; "
       "silent on conventional ASATs.",
       "Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer "
       "Space, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205.",
       "https://treaties.unoda.org/t/outer_space"),
    lg("abm-1972", "1972-05-26", None, "treaty", "ABM Treaty Art. XII",
       "Bars interference with the other party's 'national technical means' of verification "
       "(bilateral; US withdrew 2002).",
       "Treaty on the Limitation of Anti-Ballistic Missile Systems, U.S.-U.S.S.R., art. XII, "
       "May 26, 1972, 23 U.S.T. 3435.",
       "https://2009-2017.state.gov/t/avc/trty/101888.htm"),
    lg("paros-1981", "1981-12-09", None, "negotiation_span", "PAROS (UNGA agenda item)",
       "First PAROS resolutions adopted Dec 9, 1981 (UNGA 36/97 C; 36/99). CD Ad Hoc Committee on "
       "PAROS met 1985-94. No treaty has resulted.",
       "G.A. Res. 36/97 (C) (Dec. 9, 1981); G.A. Res. 36/99 (Dec. 9, 1981).",
       "https://digitallibrary.un.org/record/28200"),
    lg("cd-paros-committee", "1985-01-01", "1994-12-31", "negotiation_span", "CD Ad Hoc Committee on PAROS",
       "Conference on Disarmament committee re-established annually 1985-1994; mandate lapsed.",
       "Conference on Disarmament, Ad Hoc Committee on the Prevention of an Arms Race in Outer Space (1985-1994).",
       "https://disarmament.unoda.org/topics/outerspace/paros/"),
    lg("itu-1992", "1992-12-22", None, "treaty", "ITU Constitution Arts. 45 & 48",
       "Adopted Geneva 1992; in force July 1, 1994. Art. 45 prohibits harmful interference; Art. 48 "
       "gives military radio installations 'complete freedom' (the core gap for jamming). The Radio "
       "Regulations sit beneath the Constitution.",
       "Constitution of the International Telecommunication Union arts. 45, 48, Dec. 22, 1992, "
       "1825 U.N.T.S. 331.",
       "https://www.itu.int/en/council/Documents/basic-texts/Constitution-E.pdf",
       scene="gnss", related=["ru-2023-baltic", "ru-2024-eu-sats"]),
    lg("tallinn-2017", "2017-02-01", None, "unilateral", "Tallinn Manual 2.0 (soft law)",
       "Expert manual on international law applicable to cyber operations. Not binding law.",
       "Tallinn Manual 2.0 on the International Law Applicable to Cyber Operations (Michael N. Schmitt "
       "ed., Cambridge Univ. Press 2017).",
       "https://doi.org/10.1017/9781316822524", soft=True, related=["ru-2022-viasat"]),
    lg("ppwt-2008", "2008-02-12", None, "negotiation_span", "PPWT draft (Russia-China)",
       "Draft treaty on preventing placement of weapons in outer space, tabled at the CD. Does not "
       "cover ground-based (direct-ascent) ASATs.",
       "Draft Treaty on the Prevention of the Placement of Weapons in Outer Space, CD/1839 (Feb. 29, 2008).",
       "https://digitallibrary.un.org/record/622364"),
    lg("ppwt-2014", "2014-06-10", None, "negotiation_span", "PPWT updated draft",
       "Revised draft; still silent on ground-based ASATs and testing.",
       "Updated Draft PPWT, CD/1985 (June 12, 2014).",
       "https://digitallibrary.un.org/record/774287"),
    lg("unga-75-36", "2020-12-07", None, "resolution", "UNGA 75/36",
       "Reducing space threats through norms, rules and principles of responsible behaviour.",
       "G.A. Res. 75/36 (Dec. 7, 2020).", "https://digitallibrary.un.org/record/3895440"),
    lg("oewg-2022", "2022-05-09", "2023-09-01", "negotiation_span", "OEWG on space threats",
       "Open-ended working group under Res. 76/231; ended without a consensus report.",
       "G.A. Res. 76/231 (Dec. 24, 2021) (establishing OEWG, 2022-2023).",
       "https://meetings.unoda.org/open-ended-working-group-on-reducing-space-threats-2022"),
    lg("us-moratorium-2022", "2022-04-18", None, "unilateral", "US DA-ASAT test moratorium",
       "US commits not to conduct destructive direct-ascent ASAT missile tests. Followed by Canada, "
       "New Zealand, Japan, Germany, UK, France and others; SWF counts 38 states in total.",
       "The White House, Fact Sheet: Vice President Harris Advances National Security Norms in Space "
       "(Apr. 18, 2022); SWF 2026, p. 01-50.",
       "https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2022/04/18/fact-sheet-vice-president-harris-advances-national-security-norms-in-space/",
       scene="cosmos1408", related=["ru-2021-cosmos1408"]),
    lg("milamos-2022", "2022-01-01", None, "unilateral", "McGill (MILAMOS) Manual Vol. I (soft law)",
       "Expert manual on international law applicable to military uses of outer space. Not binding law.",
       "McGill Manual on International Law Applicable to Military Uses of Outer Space, Vol. I - Rules "
       "(Ram S. Jakhu & Steven Freeland eds., McGill Centre for Research in Air & Space Law 2022).",
       "https://www.mcgill.ca/milamos/", soft=True),
    lg("unga-77-41", "2022-12-07", None, "resolution", "UNGA 77/41 (DA-ASAT tests)",
       "Calls on states to commit not to conduct destructive direct-ascent ASAT missile tests. "
       "Adopted 155-9-9.",
       "G.A. Res. 77/41 (Dec. 7, 2022).", "https://digitallibrary.un.org/record/3996915",
       related=["ru-2021-cosmos1408"]),
    lg("unsc-veto-2024", "2024-04-24", None, "veto", "Russian veto: nuclear weapons in orbit",
       "Russia vetoed a US-Japan draft reaffirming OST Art. IV (no nuclear weapons in orbit). Vote "
       "13-1-1 (China abstained). The draft did not concern DA-ASAT testing.",
       "U.N. SCOR, 79th Sess., 9616th mtg., U.N. Doc. S/PV.9616 (Apr. 24, 2024); draft S/2024/302.",
       "https://press.un.org/en/2024/sc15678.doc.htm"),
    lg("woomera-2024", "2024-01-01", None, "unilateral", "Woomera Manual (soft law)",
       "Expert manual on international law of military space operations. Not binding law.",
       "The Woomera Manual on the International Law of Military Space Activities and Operations "
       "(Jack Beard et al. eds., Oxford Univ. Press 2024).",
       "https://law.adelaide.edu.au/woomera/", soft=True),
    lg("itu-rrb-2024", "2024-07-01", None, "resolution", "ITU RRB: 'grave concern' (Sweden, France)",
       "Radio Regulations Board expressed grave concern about intentional harmful interference to "
       "Swedish and French satellites that seemed to originate from earth stations in Russia.",
       "ITU Radio Regulations Board, 96th meeting (July 2024), summary of decisions; SWF 2026, p. 02-32.",
       "https://www.itu.int/en/ITU-R/conferences/RRB/Pages/default.aspx",
       scene="gnss", related=["ru-2024-eu-sats"]),
    lg("icao-2025", "2025-10-01", None, "resolution", "ICAO: Russia's GNSS interference breaches Chicago Convention",
       "ICAO found GNSS interference originating in Russia infringed the 1944 Chicago Convention, "
       "condemned it, and called on Russia to meet its obligations.",
       "ICAO action on GNSS radio frequency interference (Oct. 2025), as reported in SWF 2026, p. 02-30.",
       SWF_URL, scene="gnss", related=["ru-2023-baltic"]),
    lg("itu-rrb-2025", "2025-11-01", None, "resolution", "ITU RRB 100th meeting: urges Russia to cease RNSS interference",
       "Board again urged Russia to immediately cease harmful interference to radionavigation-satellite "
       "service receivers in Estonia, Finland, Latvia and Lithuania.",
       "ITU Radio Regulations Board, 100th meeting (Nov. 2025); SWF 2026, p. 02-30.",
       "https://www.itu.int/en/ITU-R/conferences/RRB/Pages/default.aspx",
       scene="gnss", related=["ru-2023-baltic"]),
]

# ---------------------------------------------------------------- capability coding (Chart B)
# D = demonstrated, P = developing/latent. States are counted per decade.
DEC = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]
CAP = {
    "direct_ascent": {
        "1950s": {"United States": "D"},
        "1960s": {"United States": "D"},
        "1970s": {"United States": "D"},
        "1980s": {"United States": "D"},
        "1990s": {"United States": "D"},
        "2000s": {"United States": "D", "China": "D", "Russia": "P"},
        "2010s": {"United States": "D", "China": "D", "Russia": "D", "India": "D"},
        "2020s": {"United States": "D", "China": "D", "Russia": "D", "India": "D",
                  "Israel": "P", "Japan": "P", "South Korea": "P", "Iran": "P", "North Korea": "P",
                  "France": "P", "Germany": "P"},
    },
    "co_orbital": {
        "1960s": {"USSR/Russia": "D", "United States": "P"},
        "1970s": {"USSR/Russia": "D"},
        "1980s": {"USSR/Russia": "D", "United States": "D"},
        "1990s": {"USSR/Russia": "D", "United States": "P"},
        "2000s": {"USSR/Russia": "D", "United States": "D", "China": "P"},
        "2010s": {"USSR/Russia": "D", "United States": "D", "China": "D"},
        "2020s": {"USSR/Russia": "D", "United States": "D", "China": "D", "India": "P",
                  "France": "P", "Germany": "P", "Iran": "P", "Israel": "P", "Japan": "P",
                  "North Korea": "P", "United Kingdom": "P"},
    },
    "electronic_warfare": {
        "1980s": {"United States": "P", "USSR/Russia": "P"},
        "1990s": {"United States": "D", "USSR/Russia": "P"},
        "2000s": {"United States": "D", "USSR/Russia": "D", "China": "P", "Iran": "D"},
        "2010s": {"United States": "D", "USSR/Russia": "D", "China": "P", "Iran": "D",
                  "North Korea": "D", "Israel": "P", "India": "P", "France": "P"},
        "2020s": {"United States": "D", "USSR/Russia": "D", "China": "D", "Iran": "D",
                  "North Korea": "D", "Israel": "D", "India": "P", "France": "P", "Australia": "P",
                  "Germany": "P", "Japan": "P", "South Korea": "P"},
    },
    "directed_energy": {
        "1970s": {"United States": "P", "USSR/Russia": "P"},
        "1980s": {"United States": "P", "USSR/Russia": "P"},
        "1990s": {"United States": "D", "USSR/Russia": "P"},
        "2000s": {"United States": "D", "USSR/Russia": "P", "China": "P"},
        "2010s": {"United States": "D", "USSR/Russia": "D", "China": "P"},
        "2020s": {"United States": "D", "USSR/Russia": "D", "China": "P", "India": "P",
                  "France": "P", "Germany": "P", "Israel": "P"},
    },
    "cyber": {
        "2000s": {"United States": "P", "USSR/Russia": "P", "China": "P"},
        "2010s": {"United States": "P", "USSR/Russia": "P", "China": "P", "Iran": "P",
                  "North Korea": "P", "Israel": "P", "France": "P"},
        "2020s": {"United States": "P", "USSR/Russia": "D", "China": "P", "Iran": "P",
                  "North Korea": "P", "Israel": "P", "France": "P"},
    },
}
CAP_SOURCES = {
    "direct_ascent": "SWF 2026 Tables 1-4, 2-4, 3-3, 4-1 and Appendix 16; chapter sections x.2 (pp. 06-01 to 14-01).",
    "co_orbital": "SWF 2026 Table 2-1, Appendix Table 16-1/16-2 (Delta 180, IS, Naryad), chapter sections x.1.",
    "electronic_warfare": "SWF 2026 chapter sections x.3 (e.g., pp. 01-26, 02-25, 09-05, 10-02, 12-05); Telstar 12 (09-05).",
    "directed_energy": "SWF 2026 chapter sections x.4 (pp. 01-33 MIRACL, 02-34 Terra-3/Peresvet, 03-26).",
    "cyber": "SWF 2026 ch. 15, p. 15-02 (US, Russia, China, France, Iran, Israel, North Korea); Viasat p. 15-07.",
}


def main():
    OUT.mkdir(exist_ok=True)
    events = sorted(K + NK, key=lambda r: r.get("date") or r.get("start"))
    (OUT / "events.json").write_text(json.dumps(events, indent=1, ensure_ascii=False))
    (OUT / "legal.json").write_text(json.dumps(sorted(L, key=lambda r: r["start"]), indent=1, ensure_ascii=False))
    caps = dict(decades=DEC, reconstructed_before="2020s", coding=CAP, sources=CAP_SOURCES,
                note="2020s = SWF 2026 assessment (13 countries). Earlier decades reconstructed by builder; "
                     "'D' = demonstrated (tested or used), 'P' = developing or latent.")
    (OUT / "capabilities.json").write_text(json.dumps(caps, indent=1, ensure_ascii=False))

    md = ["# Counterspace Timeline Ledger", "",
          f"Primary source: Secure World Foundation, *Global Counterspace Capabilities* (9th ed., April 2026). "
          f"Debris counts as of {DEBRIS_ASOF}. Pins give SWF printed page (section-page) and PDF page.", "",
          "## Kinetic events", "",
          "| id | date | state | system | target | type | alt (km) | kind | cataloged | in orbit | conf | source | pin |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in [e for e in events if e["domain"] == "kinetic"]:
        md.append("| {id} | {date} | {state} | {system} | {target} | {type} | {a} | {altitude_kind} | {f} | {o} | "
                  "{confidence} | [{source}]({source_url}) | {pin} |".format(
                      a=r["altitude_km"] if r["altitude_km"] is not None else "—",
                      f=r["fragments_cataloged"] if r["fragments_cataloged"] is not None else "—",
                      o=r["fragments_in_orbit"] if r["fragments_in_orbit"] is not None else "—", **r))
    md += ["", "## Non-kinetic events", "",
           "| id | start | end | actor | category | attribution | target regime | operational | conf | source | pin |",
           "|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in [e for e in events if e["domain"] == "non_kinetic"]:
        md.append("| {id} | {start} | {e} | {actor} | {category} | {attribution} | {target_regime} | {operational_use} | "
                  "{confidence} | [{source}]({source_url}) | {pin} |".format(e=r["end"] or "ongoing", **r))
    md += ["", "## Legal items", "", "| id | start | end | kind | label | citation |", "|---|---|---|---|---|---|"]
    for r in sorted(L, key=lambda r: r["start"]):
        md.append(f"| {r['id']} | {r['start']} | {r['end'] or ''} | {r['kind']}{' (soft law)' if r['soft_law'] else ''} | "
                  f"{r['label']} | [{r['citation']}]({r['source_url']}) |")
    md += ["", "## Notes by row", ""]
    for r in events:
        if r.get("notes"):
            md.append(f"- **{r['id']}**: {r['notes']}")
    md += ["", "## Capability coding (Chart B)", "", "| category | " + " | ".join(DEC) + " |",
           "|---" * (len(DEC) + 1) + "|"]
    for c, d in CAP.items():
        cells = []
        for dec in DEC:
            s = d.get(dec, {})
            cells.append(f"{sum(v=='D' for v in s.values())}D/{sum(v=='P' for v in s.values())}P")
        md.append(f"| {c} | " + " | ".join(cells) + " |")
    md += ["", "Sources: " + "; ".join(f"**{c}**: {s}" for c, s in CAP_SOURCES.items()), "",
           "See `verification_log.md` for the independent verification pass."]
    (OUT.parent / "ledger.md").write_text("\n".join(md) + "\n")
    print(len(K), "kinetic", len(NK), "non-kinetic", len(L), "legal")


if __name__ == "__main__":
    main()
