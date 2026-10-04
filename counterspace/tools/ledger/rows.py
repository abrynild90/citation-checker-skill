"""Ledger rows: kinetic (K), non-kinetic (NK), legal (L) and capability coding (CAP). Edit rows here."""
import pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
SWF = "SWF 2026"
SWF_URL = ("https://cdn.prod.website-files.com/66dcc6872f6ed23bce1db235/"
           "69d5402700ec843d95073a1e_SWF_Global_Counterspace_Capabilities_2026.pdf")
DEBRIS_ASOF = "2026-02"  # SWF 2026 Table 5-1 / Nudol text: "As of February 2026"


def swf(pin, pdf, what=""):
    """SWF pin: printed section-page plus PDF page index; `what` names the table or passage."""
    w = f"{what}, " if what else ""
    return dict(source=SWF, source_url=SWF_URL, pin=f"{w}p. {pin} (PDF p. {pdf})")


def swfx(pin_text):
    """SWF row whose pin spans several passages (free-text pin)."""
    return dict(source=SWF, source_url=SWF_URL, pin=pin_text)


def k(id, date, state, system, target, type, alt, kind, frag=None, orbit=None,
      conf="high", notes="", scene=None, src=None, conflicts=None, prec=None):
    row = dict(id=id, domain="kinetic", date=date, state=state, system=system,
               target=target, type=type, altitude_km=alt, altitude_kind=kind,
               fragments_cataloged=frag, fragments_in_orbit=orbit,
               fragments_as_of=DEBRIS_ASOF if frag is not None else None,
               confidence=conf, notes=notes)
    row.update(src)
    if conflicts:
        row["conflicts"] = conflicts
    if prec:
        row["date_precision"] = prec
    if scene:
        row["scene_3d"] = scene
    return row


T14a = lambda: swf("01-23", 72, "Table 1-4")   # Table 1-4, first page
T14b = lambda: swf("01-24", 73, "Table 1-4")   # Table 1-4, continued
T51 = lambda: swf("05-01", 212, "Table 5-1")   # Table 5-1 debris
T24 = lambda: swf("02-21", 134, "Table 2-4")   # Table 2-4 Nudol
T33 = lambda: swf("03-22", 183, "Table 3-3")   # Table 3-3 China
T163 = lambda: swf("16-03", 307, "Table 16-2")  # Appendix Table 16-2 Russia
T164 = lambda: swf("16-04", 308, "Table 16-3")  # Appendix Table 16-3 (China)

K = [
    k("us-1959-bold-orion", "1959-10-13", "United States", "Bold Orion", "Explorer 6",
      "flyby", 200, "apogee", notes="SWF Table 1-4 (pdfplumber cell read): \"Success (passed within kill radius)\"; launch site listed as Unknown. (The adjacent High Virgo row, 22 Sep 1959, carries \"Unknown results due to loss of telemetry\".)",
      src=T14a()),
    k("us-1962-starfish-prime", "1962-07-09", "United States", "Thor / W49 (Operation Fishbowl)",
      "None (high-altitude nuclear test)", "nuclear", 400, "detonation", conf="medium",
      notes="1.4 Mt at ~250 miles (~400 km) near Johnston Island. SWF p. 12-05 (PDF p. 269): such "
            "tests are known to have damaged or destroyed satellites in orbit. Not in SWF DA-ASAT tables; "
            "included only as the nuclear marker the legal band references.",
      scene="starfish",
      src=dict(_sf_extra="SWF 2026, p. 12-05 (PDF p. 269), for the statement that such tests damaged or destroyed satellites in orbit (SWF 2026: " + SWF_URL + ")", source="DOE/NV-209 Rev. 16 (2015)",
               source_url="https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf",
               pin="Table of U.S. nuclear tests, Starfish Prime row (Operation Fishbowl, 07/09/1962, \"High altitude - 250 miles\", 1.4 Mt), PDF pp. 41-42; secondary: SWF p. 12-05 (PDF p. 269)")),
    k("us-1962-nike-zeus-wsmr", "1962-12-17", "United States", "Program 505 (Nike Zeus)", "None",
      "non_destructive", 160, "apogee", notes="Reached designated point in space.", src=T14a()),
    k("us-1963-nike-zeus-feb", "1963-02-15", "United States", "Program 505 (Nike Zeus)", "None",
      "non_destructive", 241, "apogee", notes="Intercept of designated point in space.", src=T14a()),
    k("us-1964-nike-zeus-jan", "1964-01-04", "United States", "Program 505 (Nike Zeus)", "None (simulated target)",
      "non_destructive", 146, "apogee", notes="Successful intercept of simulated satellite target.", src=T14a()),
    k("us-1964-p437-feb", "1964-02-14", "United States", "Program 437 (Thor)", "Transit 2A rocket body",
      "non_destructive", 1000, "apogee", notes="Passed within kill radius. SWF p. 01-21 (PDF p. 70): Program 437 was designed around a 1.4 Mt W49 warhead.", src=T14a()),
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
    # ---- Table 1-4 completeness additions (US rows omitted from the first build)
    k("us-1959-high-virgo", "1959-09-22", "United States", "High Virgo (TX-20)", "None", "non_destructive", 12, "apogee",
      conf="medium", notes="Rocket test. SWF Table 1-4: \"Unknown results due to loss of telemetry\"; launch site Unknown.", src=T14a()),
    k("us-1961-sip-oct", "1961-10-01", "United States", "SIP (NOTS-EV-2)", "None", "non_destructive", None, "apogee",
      notes="\"Successful rocket test\"; site San Nicolas Island; apogee Unknown in SWF.", src=T14a()),
    k("us-1961-hiho-oct", "1961-10-05", "United States", "HiHo (NOTS-EV-1)", "None", "non_destructive", None, "apogee",
      notes="\"Rocket failure\"; launched from an F4D aircraft (SWF site column: F4D-I); apogee Unknown.", src=T14a()),
    k("us-1962-hiho-mar", "1962-03-26", "United States", "HiHo (NOTS-EV-1)", "None", "non_destructive", None, "apogee",
      notes="\"Rocket failure\"; site column F4D-I; apogee Unknown.", src=T14a()),
    k("us-1962-sip-may", "1962-05-05", "United States", "SIP (NOTS-EV-2)", "None", "non_destructive", None, "apogee",
      notes="\"Successful rocket test\"; site column F4-C; apogee Unknown.", src=T14a()),
    k("us-1962-hiho-aug", "1962-08-26", "United States", "HiHo (NOTS-EV-1)", "None", "non_destructive", 1600, "apogee",
      notes="\"Successful rocket test\"; site column F4-C.", src=T14a()),
    k("us-1963-nike-zeus-mar", "1963-03-21", "United States", "Program 505 (Nike Zeus)", "None (simulated satellite target)",
      "non_destructive", None, "apogee", notes="\"Unsuccessful attempt to intercept simulated satellite target\"; Kwajalein; apogee given as a dash.", src=T14a()),
    k("us-1963-nike-zeus-apr", "1963-04-19", "United States", "Program 505 (Nike Zeus)", "None (simulated satellite target)",
      "non_destructive", None, "apogee", notes="\"Unsuccessful attempt to intercept simulated satellite target\"; Kwajalein; apogee given as a dash.", src=T14a()),
    k("us-1963-nike-zeus-may", "1963-05-24", "United States", "Program 505 (Nike Zeus)", "Agena D",
      "non_destructive", None, "apogee", notes="\"Successful close intercept\" of an Agena D; Kwajalein; apogee Unknown. No debris reported.", src=T14a()),
    k("us-1965-nike-zeus-mar", "1965-03-01", "United States", "Program 505 (Nike Zeus)", "None",
      "non_destructive", None, "apogee", conf="low", prec="month",
      notes="SWF gives only \"Mar. 1965\" (date shown as the 1st for sorting); apogee and notes cells are dashes. Kwajalein.", src=T14a()),
    k("us-1965-nike-zeus-jun", "1965-06-01", "United States", "Program 505 (Nike Zeus)", "None",
      "non_destructive", None, "apogee", conf="low", prec="month",
      notes="SWF gives \"Jun. - Jul., 1965\" (date shown as 1 June for sorting): \"Four test intercepts, of which three were successful\". Kwajalein; apogee Unknown. One row for the four tests.", src=T14a()),
    k("us-1966-nike-zeus-jan", "1966-01-13", "United States", "Program 505 (Nike Zeus)", "None (simulated target)",
      "non_destructive", None, "apogee", notes="\"Successful intercept with simulated target\"; Kwajalein; apogee Unknown.", src=T14a()),
    k("us-1984-asm135-nov", "1984-11-13", "United States", "ASM-135 (F-15)", "Star",
      "non_destructive", 1000, "apogee", notes="\"Failed test\": missile directed its MHV at a star (SWF p. 01-22, fn. 177).", src=swfx("Table 1-4, p. 01-24 (PDF p. 73); fn. 177, p. 01-22 (PDF p. 71)")),
    k("us-1986-asm135-aug", "1986-08-22", "United States", "ASM-135 (F-15)", "Star",
      "non_destructive", 1000, "apogee", notes="\"Successful test in tracking\"; MHV directed at a star (fn. 177). Not a satellite intercept.", src=swfx("Table 1-4, p. 01-24 (PDF p. 73); fn. 177, p. 01-22 (PDF p. 71)")),
    k("us-1986-asm135-sep", "1986-09-29", "United States", "ASM-135 (F-15)", "Star",
      "non_destructive", 1000, "apogee", notes="\"Successful test in tracking\"; MHV directed at a star (fn. 177). Not a satellite intercept.", src=swfx("Table 1-4, p. 01-24 (PDF p. 73); fn. 177, p. 01-22 (PDF p. 71)")),
    k("us-1985-solwind", "1985-09-13", "United States", "ASM-135 (F-15)", "Solwind P78-1",
      "destructive", 530, "intercept", frag=285, orbit=0,
      notes="Conflict inside SWF 2026: Table 5-1 gives 530 km intercept; the prose (p. 01-22, PDF p. 71) and "
            "Table 1-4 (p. 01-24, PDF p. 73) give 555 km. Builder uses Table 5-1 for all intercept "
            "altitudes. Debris figures are from Table 5-1, read cell by cell with pdfplumber (PDF p. 212): "
            "row 'Sep. 13, 1985 / US / ASM-135 / Direct-Ascent / Solwind / 530 km / 285 / 0 / 18.7 years', "
            "i.e. 285 tracked pieces, 0 still on orbit as of Feb. 2026, total debris lifespan 18.7 years "
            "(all pieces have decayed, per SWF).",
      conflicts=["Intercept altitude: 530 km (Table 5-1, p. 05-01) vs 555 km (prose p. 01-22; Table 1-4 p. 01-24)"],
      scene="solwind", src=swfx("Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-22 (PDF p. 71); Table 1-4, p. 01-24 (PDF p. 73)")),
    k("us-2008-burnt-frost", "2008-02-20", "United States", "SM-3 (USS Lake Erie)", "USA-193",
      "destructive", 220, "intercept", frag=175, orbit=0,
      notes="Missile-defense interceptor (SM-3) used against a satellite: the case shows the "
            "ballistic missile defense / ASAT overlap. Date is 20 Feb 2008 US Eastern time "
            "(21 Feb UTC). Debris did not re-enter within weeks: SWF p. 01-24 (PDF p. 73) says the 175 "
            "trackable pieces 'took about 20 months to de-orbit entirely' (Table 5-1 lifespan column: 1.7 years). "
            "Altitude conflict inside SWF: the prose on p. 01-24 says 240 km, while Table 5-1 (p. 05-01) "
            "says 220 km; Table 1-4 (p. 01-24) lists 2,700 km in its apogee column (interceptor reach, "
            "not intercept). Table 5-1 (220 km) used, per the builder rule.",
      conflicts=["Intercept altitude: 220 km (Table 5-1, p. 05-01) vs 240 km (prose p. 01-24) vs 2,700 km apogee column (Table 1-4, p. 01-24)"],
      scene="burnt-frost",
      src=swfx("Table 5-1, p. 05-01 (PDF p. 212); prose p. 01-24 (PDF p. 73); Table 1-4, p. 01-24 (PDF p. 73)")),
    k("cn-2005-sc19", "2005-07-05", "China", "SC-19", "None known", "non_destructive", None, "apogee",
      conf="medium", notes="Likely rocket test. Altitude not reported. SWF Table 3-3 (p. 03-22) dates it 7 July; "
            "Appendix Table 16-3 (p. 16-04) dates it 5 July. Appendix date used.",
      conflicts=["Date: 5 July (Table 16-3, p. 16-04) vs 7 July (Table 3-3, p. 03-22)"], src=T164()),
    k("cn-2006-sc19", "2006-02-06", "China", "SC-19", "None known", "non_destructive", None, "apogee",
      conf="medium", notes="Likely near-miss of orbital target. Altitude not reported. Same date in Table 3-3 "
            "(p. 03-22, PDF p. 183).", src=T164()),
    k("cn-2007-fy1c", "2007-01-11", "China", "SC-19", "Fengyun-1C", "destructive", 880, "intercept",
      frag=3532, orbit=2351,
      notes="Largest debris-generating event on record. Conflict inside SWF 2026: Table 5-1 gives "
            "880 km and 3,532 tracked pieces; Table 3-3 gives 865 km apogee and 3,533 pieces. "
            "Table 5-1 used for consistency with the other intercepts.",
      conflicts=["Altitude/pieces: 880 km, 3,532 (Table 5-1, p. 05-01) vs 865 km apogee, 3,533 (Table 3-3, p. 03-22)"],
      scene="fengyun", src=T51()),
    k("cn-2010-midcourse", "2010-01-11", "China", "SC-19", "CSS-X-11 ballistic missile", "midcourse_intercept",
      250, "intercept", notes="Destruction of suborbital target; no orbital debris.", src=T33()),
    k("cn-2013-midcourse", "2013-01-27", "China", "Possible SC-19", "Unknown ballistic missile",
      "midcourse_intercept", None, "intercept", conf="medium",
      notes="Suborbital intercept; altitude not reported.", src=T33()),
    k("cn-2013-dn2", "2013-05-13", "China", "Possible DN-2", "None known", "apogee_only", 30000, "apogee",
      conf="medium",
      notes="Not an intercept. Chinese Academy of Sciences said 10,000 km; the US military said 'nearly "
            "to GEO' (36,000 km); technical analysis cited by SWF (p. 03-20) puts apogee at least ~30,000 km. "
            "Builder plots ~30,000 km (SWF Table 3-3 value).",
      conflicts=["Apogee: 10,000 km (CAS) vs 'nearly to GEO' (US military; GEO is 35,786 km) vs at least ~30,000 km (analysis cited by SWF)"],
      scene="dn2", src=swfx("Prose p. 03-20 (PDF p. 181); Table 3-3, p. 03-22 (PDF p. 183)")),
    k("cn-2014-dn2", "2014-07-23", "China", "Possible DN-2", "Likely ballistic missile", "non_destructive",
      None, "apogee", conf="medium",
      notes="SWF Table 3-3 lists it as a likely intercept test with a likely ballistic-missile target. "
            "Type 'non_destructive' is the builder's coding: SWF reports no debris.",
      src=T33()),
    k("cn-2015-dn3", "2015-10-30", "China", "Possible DN-3", "None known", "non_destructive", None, "apogee",
      conf="medium", notes="Likely rocket test.", src=T33()),
    k("cn-2017-dn3", "2017-07-23", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Likely intercept test; reportedly malfunctioned.", src=T33()),
    k("cn-2018-dn3", "2018-02-05", "China", "Possible DN-3", "CSS-5 ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Likely intercept test.", src=T33()),
    k("cn-2021-dn3", "2021-02-04", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium", notes="Announced by China as a 'land-based midcourse missile intercept technology test' (SWF p. 03-21, PDF p. 182).", src=swfx("Table 3-3, p. 03-22 (PDF p. 183); prose p. 03-21 (PDF p. 182)")),
    k("cn-2022-dn3", "2022-06-21", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium",
      notes="SWF Table 3-3 gives 19 June 2022; the prose (p. 03-21) and Appendix Table 16-3 (p. 16-04) give 21 June "
            "2022, the date of China's announcement. Prose/appendix date used.",
      conflicts=["Date: 21 June (prose p. 03-21; Table 16-3 p. 16-04) vs 19 June (Table 3-3, p. 03-22)"],
      src=swfx("Prose p. 03-21 (PDF p. 182); Table 16-3, p. 16-04 (PDF p. 308); Table 3-3, p. 03-22 (PDF p. 183)")),
    k("cn-2023-dn3", "2023-04-14", "China", "Possible DN-3", "Likely ballistic missile", "midcourse_intercept",
      None, "intercept", conf="medium",
      notes="Likely intercept test. Table 3-3 and prose give 14 April 2023; Appendix Table 16-3 lists both 14 and "
            "15 April 2023. 14 April used.",
      conflicts=["Date: 14 April 2023 (Table 3-3, p. 03-22; prose p. 03-21) vs 14 and 15 April both listed (Table 16-3, p. 16-04)"], src=T33()),
    k("ru-2014-nudol", "2014-08-12", "Russia", "Nudol", "None", "non_destructive", None, "apogee", conf="medium",
      notes="Failed shortly after launch (SWF Table 2-4 note). Appendix Table 16-2 lists the date as a rocket test (unsuccessful). "
            "No apogee reported.",
      src=swfx("Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307)")),
    k("ru-2015-nudol-apr", "2015-04-22", "Russia", "Nudol", "None", "non_destructive", None, "apogee", conf="medium",
      notes="Failed at launch (SWF Table 2-4 note). Appendix Table 16-2 lists the date as a rocket test (unsuccessful). "
            "No apogee reported.",
      src=swfx("Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307)")),
    k("ru-2019-nudol-jun", "2019-06-14", "Russia", "Nudol", "None", "non_destructive", None, "apogee", conf="low",
      notes="Listed only in Appendix Table 16-2 (not in Table 2-4), with the note 'Potential KKV, no intercept' "
            "(note paired to the row by column order in the text extraction). No apogee reported. Coded low confidence "
            "because a single table lists it.", src=T163()),
    k("ru-2019-nudol-nov", "2019-11-15", "Russia", "Nudol", "None", "non_destructive", None, "apogee", conf="medium",
      notes="Payload column: Likely KKV. SWF describes the Nov. 2021 test as the first known Nudol intercept "
            "(p. 02-21), so no earlier intercept is recorded; no apogee reported. Not in Appendix Table 16-2.",
      src=swfx("Table 2-4, p. 02-21 (PDF p. 134); prose p. 02-21 (PDF p. 134)")),
    k("ru-2015-nudol", "2015-11-18", "Russia", "Nudol", "None", "non_destructive", 200, "apogee", conf="low",
      notes="First successful missile test. SWF marks the 200 km apogee with '?'. Appendix Table 16-2 "
            "(p. 16-03) dates this test 18 Oct 2015; Table 2-4 gives 18 Nov 2015 (used).",
      conflicts=["Date: 18 Nov 2015 (Table 2-4, p. 02-21) vs 18 Oct 2015 (Table 16-2, p. 16-03)"], src=T24()),
    k("ru-2016-nudol-may", "2016-05-25", "Russia", "Nudol", "None", "non_destructive", 100, "apogee", conf="low",
      notes="Likely rocket test. SWF marks the 100 km apogee with '?'.", src=T24()),
    k("ru-2016-nudol-dec", "2016-12-16", "Russia", "Nudol", "None", "non_destructive", 100, "apogee", conf="low",
      notes="Likely rocket test. SWF marks the 100 km apogee with '?'.", src=T24()),
    k("ru-2018-nudol-mar", "2018-03-26", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="First test from a mobile launcher.", src=T24()),
    k("ru-2018-nudol-dec", "2018-12-23", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="Payload column: Likely KKV. Appendix Table 16-2 (p. 16-03): potential KKV, no intercept.", src=T24()),
    k("ru-2020-nudol-apr", "2020-04-15", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="Table 2-4: \"Successful, nothing hit.\" Appendix Table 16-2 (p. 16-03) instead says \"Potential intercept, debris created\"; no debris count is given anywhere in SWF, so no fragments are coded. US Space Command issued a public statement on the test (SWF p. 02-20, fn. 148).",
      conflicts=["Outcome: 'Successful, nothing hit' (Table 2-4, p. 02-21) vs 'Potential intercept, debris created' (Table 16-2, p. 16-03)"],
      src=swfx("Table 2-4, p. 02-21 (PDF p. 134); Table 16-2, p. 16-03 (PDF p. 307)")),
    k("ru-2020-nudol-dec", "2020-12-16", "Russia", "Nudol", "None", "non_destructive", None, "apogee",
      conf="medium", notes="Successful, nothing hit. US Space Command issued a public statement (SWF p. 02-20, fn. 149).",
      src=T24()),
    k("ru-2021-nudol-apr", "2021-04-01", "Russia", "Nudol", "None", "non_destructive", None, "apogee", conf="low", prec="month",
      notes="Listed only in Appendix Table 16-2 as \"April 2021 ... Nudol ... Unknown\" (month only; date shown as the 1st for sorting). Not in Table 2-4; no apogee, target or outcome reported.", src=T163()),
    k("in-2019-shakti-feb", "2019-02-12", "India", "PDV Mk-II", "Microsat-R", "non_destructive", None, "apogee", conf="low",
      notes="Failed test: \"Booster failed within 30 seconds, no intercept\" (Table 4-1); Table 16-4 says \"Unsuccessful intercept\". "
            "Known from anonymous US government sources reported by The Diplomat (SWF p. 04-04, fn. 39); India has not confirmed it. "
            "Apogee given as \"Suborbital\" (no value).",
      src=swfx("Table 4-1, p. 04-04 (PDF p. 204); Table 16-4, p. 16-04 (PDF p. 308)")),
    k("in-2019-shakti", "2019-03-27", "India", "PDV Mk-II (Mission Shakti)", "Microsat-R", "destructive",
      300, "intercept", frag=130, orbit=0,
      notes="Indian officials said most debris would re-enter within days and all of it within 45 days at most "
            "(SWF p. 04-04); per SWF the final trackable piece re-entered in June 2022, 3.2 years after the test, "
            "and some pieces were thrown up to 2,250 km.",
      scene="shakti",
      src=swfx("Table 5-1, p. 05-01 (PDF p. 212); prose p. 04-04 (PDF p. 204)")),
    k("ru-2021-cosmos1408", "2021-11-15", "Russia", "Nudol (PL-19)", "Cosmos 1408", "destructive",
      470, "intercept", frag=1807, orbit=5,
      notes="ISS crew sheltered in docked vehicles. SWF text: more than 1,800 cataloged pieces, 5 still "
            "in orbit as of February 2026 (p. 02-21). Last destructive DA-ASAT test listed in SWF 2026 "
            "(Table 5-1); the report lists no later destructive test.",
      scene="cosmos1408", src=swfx("Table 5-1, p. 05-01 (PDF p. 212); prose p. 02-21 (PDF p. 134)")),
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
       "The US tested the MIRACL chemical laser, and a low-power laser, against an orbiting satellite. Detailed results are "
         "not public. Secretary of Defense Cohen called the test consistent with US policy.",
       "high", swf("01-35", 84, "MIRACL passage"),
       notes="The Secure World Foundation (SWF) gives only October 1997. The exact day, 17 Oct., comes from FlightGlobal (Oct. 1997) "
         "and Arms Control Association reporting. The laser was fired at White Sands Missile Range, New Mexico (SWF footnote 259 "
         "cites the range's High Energy Laser Systems Test Facility). MSTI-3 was a US Air Force experimental satellite that had "
         "completed its mission.",
       scene="laser"),
    nk("ir-2003-telstar12", "2003-01-01", "2006-12-31", "Iran (jamming from Cuba; later Bulgaria, Libya)",
       "ew_uplink", "alleged", "Telstar 12 Persian-language broadcasts", "GEO_comms", False,
       "Uplink jamming, which means jamming the signal sent up to a satellite, aimed at Persian-language programming that "
         "originated in California.",
       "medium", swf("09-05", 247, "Iranian EW passage"),
       notes="The Secure World Foundation (SWF) says Iran 'has been accused', so the claim is shown as alleged. SWF says the Telstar "
         "12 jamming from Havana 'started in 2003' and that similar jamming occurred from Bulgaria and Libya in 2005 and 2006. "
         "SWF gives no day or month, so the span runs over whole years. The end year, 2006, is the last year SWF dates for the "
         "Bulgarian and Libyan sites."),
    nk("iq-2003-gps", "2003-03-20", "2003-03-25", "Iraq", "gnss_jamming", "official_government",
       "GPS receivers of coalition munitions and aircraft", "GNSS_MEO", True,
       "Iraq used Russian-made GPS jammers against coalition forces. US officials reported destroying six jammers and said "
         "they had no effect on US weapons.",
       "medium",
       dict(source="CENTCOM briefing (Maj. Gen. Renuart), 25 Mar 2003 (AFPS report)",
            source_url="https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm",
            pin="Briefing transcript, answer on GPS jammers"),
       notes="The Secure World Foundation (SWF) 2026 report does not cover this case, because Iraq is not one of the 13 countries "
         "SWF assesses. It is left out of the 'Who can do what' chart."),
    nk("cn-2006-laser", "2006-01-01", "2006-01-01", "China", "directed_energy", "alleged",
       "US optical imaging satellites", "ISR_LEO", False,
       "DefenseNews cited anonymous US officials who claimed that lasers had 'dazzled' (briefly blinded) US satellites. Later "
         "reporting suggested only illumination. Senior officials said no satellite was materially damaged.",
       "low", swf("03-26", 187, "Chinese DE section, text at fn. 207"),
       notes="The event is dated by year only. It rests on a press report from anonymous sources, so confidence is low and the claim "
         "is shown as alleged."),
    nk("ir-2009-eutelsat", "2009-01-01", "2012-12-31", "Iran", "ew_uplink", "multi_government",
       "Eutelsat satellites carrying BBC Persian and Voice of America", "GEO_comms", False,
       "Uplink jamming (jamming the signal sent up to a satellite) of Persian-language broadcasts. In 2010 the International "
         "Telecommunication Union (ITU), acting on two Eutelsat complaints, ordered Iran (the Secure World Foundation's word) to "
         "assist in stopping jamming originating from its territory.",
       "medium", swf("09-06", 248, "Iranian EW passage, text above fn. 58"),
       notes="The attribution is shown as coming from several governments because an intergovernmental body, the ITU, located the "
         "source in Iranian territory. The ITU did not find the Iranian state responsible. The Secure World Foundation (SWF) "
         "dates only the 2010 ITU action and Eutelsat's October 2022 report of renewed jamming from Iran. The 2009 start follows "
         "Eutelsat's appeals from May 2009 (Eutelsat and Human Rights Watch). The 2012 end is the last year of the first "
         "documented phase, so the span understates the 2022 episode."),
    nk("kp-2010-gps", "2010-08-23", None, "North Korea", "gnss_jamming", "official_government",
       "GPS receivers of aircraft, ships and vehicles in South Korea", "GNSS_MEO", False,
       "Repeated jamming of GPS receivers from the ground (known as downlink jamming) near the border between North and South "
         "Korea. South Korea raised it with the International Telecommunication Union (ITU), the International Civil Aviation "
         "Organization (ICAO) and the International Maritime Organization (IMO). Further interference was reported in November "
         "2024.",
       "high", swf("12-05 to 12-06", "269-270", "Section 12.3"),
       notes="This is jamming of receivers from the ground, not an attack on GPS satellites. The Secure World Foundation (SWF) says "
         "there is 'no impact on the GPS satellites themselves' (p. 12-05). The entry covers a campaign, not individual "
         "incidents. SWF does not date the first episode, so the start is the first publicly known incident, 23 Aug. 2010 (GPS "
         "World, Inside GNSS). It is treated as ongoing (SWF p. 12-06: November 2024 interference; October 2025 ICAO finding)."),
    nk("ru-2014-ukraine", "2014-03-01", None, "Russia", "gnss_spoofing", "researcher_osint",
       "GNSS receivers in Ukraine, Crimea and the Black Sea", "GNSS_MEO", True,
       "Jamming and spoofing of satellite navigation (GNSS) signals in occupied territory and conflict zones. Spoofing means "
         "sending false signals. The research organization C4ADS logged nearly 10,000 suspected spoofing incidents across "
         "Russia, Crimea and Syria.",
       "high", swf("02-27 to 02-28", "140-141", "GNSS passages, C4ADS report at fn. 220"),
       notes="The attribution follows the C4ADS report, based on open sources, that the Secure World Foundation (SWF) relies on (p. "
         "02-28). Governments have also blamed Russia, but the source for the time span is open-source research. The entry "
         "covers jamming and spoofing. SWF's cited pages do not date the start. The March 2014 start comes from outside "
         "reporting that Russia has jammed GPS in eastern Ukraine since the 2014 Crimea conflict (Breaking Defense; Foreign "
         "Policy, Oct. 2015)."),
    nk("ru-2016-syria", "2016-02-01", None, "Russia", "gnss_jamming", "researcher_osint",
       "GNSS receivers in and around Syria and the eastern Mediterranean", "GNSS_MEO", True,
       "Spoofing (sending false signals) and jamming of satellite navigation (GNSS) around Russian bases in Syria, with "
         "reported effects on aircraft in the region.",
       "medium", swf("02-28", 141, "C4ADS passage"),
       notes="The Secure World Foundation (SWF), p. 02-28: 'The spoofing began in 2016, peaked in 2017'. This page uses 2016 as the "
         "start, with medium confidence."),
    nk("ru-2018-trident", "2018-10-25", "2018-11-07", "Russia", "gnss_jamming", "official_government",
       "GPS receivers in northern Norway and Finland during NATO Trident Juncture", "GNSS_MEO", False,
       "GPS disruption affected civil aviation during the exercise. In March 2019 Norway said it had proof of Russian "
         "interference.",
       "high", swf("02-28", 141, "text above fn. 217-218"),
       notes="The Secure World Foundation (SWF) does not name the exercise or give dates. It says that media reported jamming in "
         "Norway and Finland in November 2018, during a major exercise of the North Atlantic Treaty Organization (NATO), and "
         "that Norway's government claimed in March 2019 it had proof of Russian interference. The dates, 25 Oct. to 7 Nov. "
         "2018, are those of the NATO exercise Trident Juncture. Norway's ministry put the jamming at 16 Oct. to 7 Nov. The "
         "attribution is 'official government' because of Norway's claim. Finland only expressed concern (outside reporting)."),
    nk("ru-2018-peresvet", "2018-03-01", "2018-03-01", "Russia", "directed_energy", "official_government",
       "Satellites overflying Russian mobile ICBM units (stated purpose)", "ISR_LEO", False,
       "This is an announcement of a capability, not an act. President Putin announced the Peresvet mobile laser. The Secure "
         "World Foundation (SWF) describes it as appearing designed to blind imaging satellites. It has not been demonstrated "
         "against a satellite.",
       "medium", swf("02-36", 149, "Peresvet section"),
       notes="Putin named the system in his 1 March 2018 speech (SWF p. 02-36). SWF describes it as appearing designed to protect "
         "mobile intercontinental ballistic missiles (ICBMs) from being imaged. The Russian government declared the system "
         "itself, and there is no public evidence of its use against a satellite. The attribution 'official government' here "
         "records only that announcement. The entry sits in the directed-energy (laser) group as a capability announcement, not "
         "as an operation against a satellite.",
       scene="laser"),
    nk("ru-2022-viasat", "2022-02-24", "2022-02-24", "Russia", "cyber", "multi_government",
       "Viasat KA-SAT user terminals (modems) and management network", "ground_segment", True,
       "AcidRain, a program that erases data (a wiper), disabled tens of thousands of modems in Ukraine and Europe in the "
         "first hours of the invasion. The satellite itself was unaffected.",
       "high", swf("15-06 to 15-07", "292-293", "Viasat case study"),
       notes="On timing, the Secure World Foundation (SWF) says (p. 15-06) that the attack came 'within hours' of Russian troops "
         "crossing the border. It adds (p. 15-07) that independent analysts noted it began one hour before the first troops "
         "crossed. The United States, United Kingdom and European Union publicly attributed the attack to the GRU, Russia's "
         "military intelligence service, in May 2022 (p. 15-07).",
       scene="viasat"),
    nk("ru-2022-starlink", "2022-03-01", None, "Russia", "ew_downlink", "alleged",
       "Starlink user terminals in Ukraine", "LEO_constellation", True,
       "SpaceX chief executive Elon Musk said in March 2022 that Russia had jammed a Starlink terminal. A Ukrainian official "
         "attributed outages in May 2024 to Russian electronic warfare testing.",
       "medium", swf("02-32", "145", "Starlink passage, fns. 259-261"),
       notes="The Secure World Foundation (SWF) notes that there is no independent validation of the type or size of the jamming, so "
         "the claim is shown as alleged."),
    nk("ru-2023-baltic", "2023-12-01", None, "Russia", "gnss_jamming", "multi_government",
       "GNSS receivers of civil aircraft and ships over the Baltic region", "GNSS_MEO", True,
       "Widespread jamming and spoofing (sending false signals) affected Finland, Sweden, Poland and the Baltic states and was "
         "often traced to Kaliningrad and St. Petersburg. Finnair paused its Tartu flights in April 2024.",
       "high", swf("02-29 to 02-30", "142-143", "Baltic GNSS passages"),
       notes="The Secure World Foundation (SWF) says the interference 'picked up in late 2023 and early 2024'; the start is set to "
         "December 2023. The attribution is shown as coming from several governments because it rests on the October 2025 "
         "resolution of the International Civil Aviation Organization (ICAO) and on findings of the Radio Regulations Board "
         "(RRB) of the International Telecommunication Union (ITU) in November 2025. This is jamming of receivers from the "
         "ground, not attacks on satellites.",
       scene="gnss"),
    nk("mideast-2023-gnss", "2023-10-07", None, "Israel (IDF)", "gnss_jamming",
       "official_government", "GNSS receivers of aircraft over Israel and neighboring states", "GNSS_MEO", True,
       "The Israel Defense Forces (IDF) stated publicly that it was jamming GPS in the region \"in a proactive manner for "
         "various operational needs\". Lebanon's foreign minister blamed Israel (March 2024).",
       "medium", swf("10-01 to 10-02", "254-255", "Section 10.3"),
       notes="The Secure World Foundation (SWF) reports the IDF's own public statement (p. 10-02), so the attribution is recorded as "
         "official government, for Israel and for jamming only. SWF also reports regional jamming and spoofing after the 7 Oct. "
         "2023 Hamas attack. It says it is hard to tell from open sources whether Israel, Hamas or other actors carry out the "
         "electronic warfare. No other actor is attributed, so there is no second entry (left out, and not marked 'alleged', "
         "because SWF makes no allegation against a named actor). The spoofing reports are therefore not attributed to anyone "
         "here. SWF p. 10-01 also reports interference in spring 2023 (20% of regional aircraft in April 2023), before this "
         "entry's start. The start is set to 7 Oct. 2023, the attack SWF names as the trigger of the escalation. Lebanon's claim "
         "is a government claim about Israel, not proof."),
    nk("ru-2024-eu-sats", "2024-03-01", None, "Russia (origin locations cited by ITU RRB)", "ew_uplink",
       "multi_government", "Swedish and French broadcasting satellites", "GEO_comms", True,
       "Broadcasts on Ukrainian channels were hijacked or jammed. European states complained. The Radio Regulations Board "
         "(RRB) of the International Telecommunication Union (ITU) said in July 2024 that the interference 'seemed to originate' "
         "from earth stations (ground stations) near Moscow, Kaliningrad and Pavlovka.",
       "high", swf("02-32", 145, "ITU RRB passage, fn. 272"),
       notes="The Secure World Foundation (SWF) reports (p. 02-32) that several European countries complained in spring 2024. The "
         "Board described where the interference seemed to come from but made no finding that a state was responsible. The "
         "attribution is shown as coming from several governments because the ITU, an intergovernmental body, located the "
         "source."),
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
       "Signed Aug 5, 1963; in force Oct 10, 1963. Bans nuclear tests in outer space. It followed Starfish Prime, a US nuclear "
         "test in space in 1962. The US State Department's Office of the Historian says the Cuban Missile Crisis provided the "
         "impetus for an agreement and that worldwide concern about radioactive fallout from atmospheric tests built support for "
         "it.",
       "Treaty Banning Nuclear Weapon Tests in the Atmosphere, in Outer Space and Under Water, "
       "Aug. 5, 1963, 14 U.S.T. 1313, 480 U.N.T.S. 43. For context, see Office of the Historian, U.S. Dep't of State, "
       "Milestones: 1961-1968, The Limited Test Ban Treaty, 1963, https://history.state.gov/milestones/1961-1968/limited-ban.",
       "https://treaties.unoda.org/t/test_ban", scene="starfish", related=["us-1962-starfish-prime"]),
    lg("ost-1967", "1967-01-27", None, "treaty", "Outer Space Treaty",
       "Opened for signature Jan 27, 1967; in force Oct 10, 1967. Article IV bars nuclear weapons and other weapons of mass "
         "destruction in orbit. It is silent on conventional (non-nuclear) anti-satellite weapons.",
       "Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer "
       "Space, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205.",
       "https://treaties.unoda.org/t/outer_space"),
    lg("abm-1972", "1972-05-26", None, "treaty", "Anti-Ballistic Missile (ABM) Treaty, Article XII",
       "Bars interference with the other party's 'national technical means' of verification, meaning its own monitoring tools. "
         "It is a treaty between the US and the Soviet Union; the US withdrew in 2002.",
       "Treaty on the Limitation of Anti-Ballistic Missile Systems, U.S.-U.S.S.R., art. XII, "
       "May 26, 1972, 23 U.S.T. 3435.",
       "https://www.armscontrol.org/factsheets/anti-ballistic-missile-abm-treaty-glance"),
    lg("paros-1981", "1981-12-09", None, "negotiation_span", "Prevention of an Arms Race in Outer Space (PAROS)",
       "The UN General Assembly adopted the first PAROS resolutions on Dec 9, 1981 (36/97 C and 36/99). The Conference on "
         "Disarmament's ad hoc committee on PAROS met from 1985 to 1994. No treaty has resulted.",
       "G.A. Res. 36/97 (C) (Dec. 9, 1981); G.A. Res. 36/99 (Dec. 9, 1981).",
       "https://www.unoosa.org/oosa/oosadoc/data/resolutions/1981/general_assembly_36th_session/res_3697c.html"),
    lg("cd-paros-committee", "1985-03-29", "1994-08-23", "negotiation_span", "Conference on Disarmament Ad Hoc Committee on PAROS",
       "Established by the Conference on Disarmament on Mar. 29, 1985; met annually from 1985 to 1994; final meeting Aug. 23, "
         "1994; never re-established.",
       "Conference on Disarmament, Report of the Ad Hoc Committee on Prevention of an Arms Race in Outer Space, "
       "CD/1271 (Aug. 24, 1994); see UNIDIR, The Conference on Disarmament and the Prevention of an Arms Race in "
       "Outer Space.",
       "https://unidir.org/files/publication/pdfs/the-conference-on-disarmament-and-the-prevention-of-an-arms-race-in-outer-space-370.pdf"),
    lg("itu-1992", "1992-12-22", None, "treaty", "ITU Constitution, Articles 45 and 48",
       "The Constitution of the International Telecommunication Union (ITU) was adopted in Geneva in 1992 and entered into "
         "force on July 1, 1994. Article 45 prohibits harmful interference. Article 48 lets member states 'retain their entire "
         "freedom' regarding military radio installations, which is the core gap for jamming. The ITU's Radio Regulations sit "
         "beneath the Constitution.",
       "Constitution of the International Telecommunication Union arts. 45, 48, Dec. 22, 1992, "
       "1825 U.N.T.S. 331, 361-62.",
       "https://www.itu.int/en/council/Documents/basic-texts/Constitution-E.pdf",
       scene="gnss", related=["ru-2023-baltic", "ru-2024-eu-sats"]),
    lg("tallinn-2017", "2017-02-01", None, "unilateral", "Tallinn Manual 2.0 (soft law)",
       "An expert manual on international law applicable to cyber operations. It is soft law, meaning it is not binding.",
       "Tallinn Manual 2.0 on the International Law Applicable to Cyber Operations (Michael N. Schmitt "
       "ed., Cambridge Univ. Press 2017).",
       "https://doi.org/10.1017/9781316822524", soft=True, related=["ru-2022-viasat"]),
    lg("ppwt-2008", "2008-02-12", None, "negotiation_span", "Draft treaty on weapons in space (PPWT), Russia and China",
       "A draft treaty on preventing the placement of weapons in outer space, tabled at the Conference on Disarmament (CD). It "
         "does not cover ground-based, or direct-ascent, anti-satellite weapons.",
       "Draft Treaty on the Prevention of the Placement of Weapons in Outer Space, CD/1839 (Feb. 29, 2008) "
       "(tabled at the CD Feb. 12, 2008).",
       "https://documents.un.org/api/symbol/access?s=CD/1839&l=en&t=pdf"),
    lg("ppwt-2014", "2014-06-10", None, "negotiation_span", "Updated draft treaty on weapons in space (PPWT)",
       "A revised draft of the same treaty. It is still silent on ground-based anti-satellite weapons and on testing.",
       "Updated Draft PPWT, CD/1985 (June 12, 2014) (tabled at the CD June 10, 2014).",
       "https://documents.un.org/api/symbol/access?s=CD/1985&l=en&t=pdf"),
    lg("unga-75-36", "2020-12-07", None, "resolution", "UN General Assembly resolution 75/36",
       "A General Assembly resolution on reducing space threats through norms, rules and principles of responsible behaviour.",
       "G.A. Res. 75/36 (Dec. 7, 2020).", "https://digitallibrary.un.org/record/3895440"),
    lg("oewg-2022", "2022-05-09", "2023-09-01", "negotiation_span", "Open-ended working group on space threats (OEWG)",
       "An open-ended working group set up under UN General Assembly resolution 76/231. It ended without a consensus report.",
       "G.A. Res. 76/231 (Dec. 24, 2021) (establishing OEWG, 2022-2023).",
       "https://meetings.unoda.org/open-ended-working-group-on-reducing-space-threats-2022"),
    lg("us-moratorium-2022", "2022-04-18", None, "unilateral", "US moratorium on destructive anti-satellite missile tests",
       "The US committed not to conduct destructive direct-ascent anti-satellite missile tests, meaning tests launched from "
         "Earth. Other states followed; the Secure World Foundation (SWF) counts 38 countries in total.",
       "The White House, Fact Sheet: Vice President Harris Advances National Security Norms in Space "
       "(Apr. 18, 2022); SWF 2026, p. 01-50.",
       "https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2022/04/18/fact-sheet-vice-president-harris-advances-national-security-norms-in-space/",
       scene="cosmos1408", related=["ru-2021-cosmos1408"]),
    lg("milamos-2022", "2022-07-01", None, "unilateral", "McGill Manual on military uses of outer space (MILAMOS), Vol. I (soft law)",
       "An expert manual on international law applicable to military uses of outer space. It is soft law, meaning it is not "
         "binding.",
       "McGill Manual on International Law Applicable to Military Uses of Outer Space, Vol. I - Rules "
       "(Ram S. Jakhu & Steven Freeland eds., McGill Centre for Research in Air & Space Law 2022).",
       "https://www.mcgill.ca/milamos/", soft=True),
    lg("unga-77-41", "2022-12-07", None, "resolution", "UN General Assembly resolution 77/41 (destructive anti-satellite tests)",
       "Calls on states to commit not to conduct destructive direct-ascent anti-satellite missile tests, meaning tests "
         "launched from Earth. Adopted by 155 votes to 9, with 9 abstentions. The call is not binding.",
       "G.A. Res. 77/41 (Dec. 7, 2022).", "https://digitallibrary.un.org/record/3997622",
       related=["ru-2021-cosmos1408", "in-2019-shakti"]),
    lg("unsc-veto-2024", "2024-04-24", None, "veto", "Russian veto: nuclear weapons in orbit",
       "Russia vetoed a US-Japan draft resolution in the UN Security Council that reaffirmed Article IV of the Outer Space "
         "Treaty (no nuclear weapons in orbit). The vote was 13 in favor, 1 against and 1 abstention (China). The draft did not "
         "concern anti-satellite testing.",
       "U.N. SCOR, 79th Sess., 9616th mtg., U.N. Doc. S/PV.9616 (Apr. 24, 2024); draft S/2024/302.",
       "https://press.un.org/en/2024/sc15678.doc.htm"),
    lg("woomera-2024", "2024-01-01", None, "unilateral", "Woomera Manual (soft law)",
       "An expert manual on international law for military space operations. It is soft law, meaning it is not binding.",
       "The Woomera Manual on the International Law of Military Space Operations "
       "(Jack Beard & Dale Stephens eds., Oxford Univ. Press 2024).",
       "https://global.oup.com/academic/product/the-woomera-manual-on-the-international-law-of-military-space-operations-9780192870667",
       soft=True),
    lg("itu-rrb-2024", "2024-07-01", None, "resolution", "ITU Radio Regulations Board: 'grave concern' (Sweden, France)",
       "The Radio Regulations Board of the International Telecommunication Union (ITU) expressed grave concern about "
         "intentional harmful interference to Swedish and French satellites that seemed to originate from earth stations (ground "
         "stations) near Moscow, Kaliningrad and Pavlovka.",
       "ITU Radio Regulations Board, 96th Meeting (June 24-28, 2024), Summary of Decisions (issued July 1, 2024); quoted in SWF 2026, p. 02-32 (PDF p. 145).",
       "https://www.itu.int/dms_pub/itu-r/md/24/rrb24.2/c/R24-RRB24.2-C-0012!!PDF-E.pdf",
       scene="gnss", related=["ru-2024-eu-sats"]),
    lg("icao-2025", "2025-10-03", None, "resolution", "ICAO: interference with satellite navigation an 'infraction' of the Chicago Convention",
       "The Assembly of the International Civil Aviation Organization (ICAO), meeting from 23 Sept. to 3 Oct. 2025, endorsed "
         "its Council's determination that recurring interference with satellite navigation (GNSS) originating in North Korea "
         "and in Russian territory constitutes 'infractions' of the 1944 Chicago Convention. It condemned both states and urged "
         "them to comply with their obligations. This is a finding by an intergovernmental body. It is not a judgment of a court "
         "and carries no enforcement.",
       "ICAO, ICAO Assembly Condemns GNSS Radio Frequency Interference Originating from the DPRK and the Russian "
       "Federation (Oct. 3, 2025); reported in SWF 2026, pp. 02-30, 12-06.",
       "https://www.icao.int/news/icao-assembly-condemns-gnss-radio-frequency-interference-originating-dprk-and-russian",
       scene="gnss", related=["ru-2023-baltic", "kp-2010-gps"]),
    lg("itu-rrb-2025", "2025-11-10", None, "resolution", "ITU Radio Regulations Board, 100th meeting: urges Russia to stop interference with satellite navigation",
       "The Radio Regulations Board of the International Telecommunication Union (ITU) again urged Russia to cease immediately "
         "its harmful interference with radionavigation-satellite service (RNSS) receivers, meaning satellite-navigation "
         "receivers, in Estonia, Finland, Latvia and Lithuania.",
       "ITU Radio Regulations Board, 100th Meeting (Nov. 10-14, 2025), Harmful Interference to the Radionavigation-Satellite "
       "Service (RNSS); quoted in SWF 2026, p. 02-30 (PDF p. 143), fn. 245.",
       "https://www.itu.int/harmful-interference-to-rnss/",
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
    "directed_energy": "SWF 2026 chapter sections x.4 (pp. 01-33 to 01-35 US incl. MIRACL, 02-34 to 02-36 Russia incl. Peresvet, 03-26 China).",
    "cyber": "SWF 2026 ch. 15, p. 15-02 (US, Russia, China, France, Iran, Israel, North Korea); Viasat pp. 15-06 to 15-07.",
}

