"""Generates ledger.md from the rows."""
from .rows import *
from .schema import *
from .lagpairs import CO_ORBITAL


def _ref(row):
    return "[%s]" % ("SWF" if row["source"] == SWF else row["id"])


def _anchor(t):
    return "".join(ch for ch in t.lower().replace(" ", "-") if ch.isalnum() or ch == "-")


def ledger_md(events):
    kin = sorted([e for e in events if e["domain"] == "kinetic"], key=lambda r: r["date"])
    nk_ = sorted([e for e in events if e["domain"] == "non_kinetic"], key=lambda r: r["start"])
    leg = sorted(L, key=lambda r: r["start"])
    nconf = sum(len(r.get("conflicts", [])) for r in events)
    # endnote numbers follow table order (kinetic, then non-kinetic)
    enum = {}
    for r in kin + nk_:
        if r.get("notes"):
            enum[r["id"]] = len(enum) + 1

    def nref(r):
        return "[%d](#n%d)" % (enum[r["id"]], enum[r["id"]]) if r["id"] in enum else "-"

    dest = [r for r in kin if r["type"] == "destructive"]
    o = []
    a = o.append
    a("# Counterspace Timeline Ledger")
    a("")
    a("*Ledger as of %s. Schema %s. Generated file: edit `tools/ledger/rows.py`, not this page.*" % (LEDGER_ASOF, SCHEMA_VERSION))
    a("")
    a("## Preface")
    a("")
    a("**Purpose.** This ledger is the reference dataset behind the Counterspace Timeline. It records %d kinetic tests, "
      "%d non-kinetic operations and %d legal items, and gives each one a source and a pin to the page that supports it. "
      "It exists so that any figure on the page can be traced to its source in one step, and so that places where the "
      "source disagrees with itself are visible instead of silently resolved." % (len(kin), len(nk_), len(leg)))
    a("")
    a("**How to use it.** Start with [Key figures](#key-figures) for the destructive tests and the size of the dataset. "
      "Read [How to read the tables](#how-to-read-the-tables) once for the terms and the pin format. Then look a row up "
      "by state or year, or go to the full tables. Long explanations are collected in the numbered "
      "[Endnotes](#endnotes); a table row points to its endnote by number, for example [1](#n1). "
      "Where sources conflict, see [Conflicts inside the sources](#conflicts-inside-the-sources).")
    a("")
    a("**How to cite it.** Cite the primary source for any figure, and this ledger for the coding. For a row, give its id "
      "and its pin, for example: *Counterspace Timeline Ledger, row `cn-2007-fy1c` (ledger as of %s), citing SWF 2026, "
      "Table 5-1, p. 05-01.* Do not cite the ledger alone for a debris count or an altitude. Verification status is in "
      "`verification_log.md`; coding decisions are in `methodology.md`." % LEDGER_ASOF)
    a("")
    a("## Contents")
    a("")
    toc = [("Key figures", ""), ("How to read the tables", ""),
           ("Quick lookup by state or actor", ""), ("Quick lookup by year", ""),
           ("Kinetic events (chronological)", "%d rows" % len(kin)),
           ("Non-kinetic events (by start date)", "%d rows" % len(nk_)),
           ("Legal items (by start date)", "%d rows" % len(leg)),
           ("Conflicts inside the sources", "%d rows" % nconf),
           ("Endnotes", "%d notes" % len(enum)),
           ("Capability coding (Chart B)", "%d categories" % len(CAP)), ("Sources", "")]
    for t, n in toc:
        a("- [%s](#%s)%s" % (t, _anchor(t), " (%s)" % n if n else ""))
    a("")
    a("## Key figures")
    a("")
    a("**Destructive direct-ascent (DA-ASAT) tests.** These are the %d direct-ascent tests in the ledger that created cataloged "
      "fragments. Fragment counts are as of %s (SWF Table 5-1); altitude is the intercept altitude in that table." % (len(dest), DEBRIS_ASOF))
    a("")
    a("| date | state | system | target | altitude (km) | cataloged fragments | fragments in orbit | pin | endnote |")
    a("|---|---|---|---|---|---|---|---|---|")
    for r in dest:
        a("| %s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
            r["date"], r["state"], r["system"], r["target"], r["altitude_km"], "{:,}".format(r["fragments_cataloged"]),
            "{:,}".format(r["fragments_in_orbit"]), r["pin"], nref(r)))
    a("| **Total** | | | | | **{:,}** | **{:,}** | | |".format(
        sum(r["fragments_cataloged"] for r in dest), sum(r["fragments_in_orbit"] for r in dest)))
    a("")
    a("**What is counted.** The table lists the %d destructive **direct-ascent** tests, the only destructive tests that are "
      "ledger rows. SWF (%s) lists %d destructive ASAT tests in all: these %d plus **%d co-orbital** destructive tests "
      "(%d Soviet/Russian, %d US: the Delta 180 intercept of 5 Sep 1986), which created %s cataloged fragments "
      "(%s still on orbit) and are outside the ledger's kinetic rows. Direct-ascent plus co-orbital: %d + %d = %d. "
      "SWF reports no destructive DA-ASAT test after 15 Nov 2021." % (
          len(dest), CO_ORBITAL["pin"], CO_ORBITAL["total_swf"], len(dest), CO_ORBITAL["count"],
          CO_ORBITAL["states"]["Russia"], CO_ORBITAL["states"]["United States"],
          "{:,}".format(CO_ORBITAL["cataloged"]), "{:,}".format(CO_ORBITAL["in_orbit"]),
          len(dest), CO_ORBITAL["count"], len(dest) + CO_ORBITAL["count"]))
    a("")
    a("**Size and quality of the dataset.**")
    a("")
    a("| set | rows | notes |")
    a("|---|---|---|")
    a("| Kinetic events | %d | %d destructive; %d high confidence |" % (
        len(kin), len(dest), sum(r["confidence"] == "high" for r in kin)))
    a("| Non-kinetic events | %d | %d high confidence |" % (len(nk_), sum(r["confidence"] == "high" for r in nk_)))
    a("| Legal items | %d | %d soft law |" % (len(leg), sum(r["soft_law"] for r in leg)))
    a("| Documented source conflicts | %d | listed in [Conflicts inside the sources](#conflicts-inside-the-sources) |" % nconf)
    a("| Capability categories | %d | Chart B; 2020s follows SWF, earlier decades are reconstructed |" % len(CAP))
    a("| Schema version | %s | `data/schema.json` |" % SCHEMA_VERSION)
    a("")
    a("**Sources.** Primary: Secure World Foundation, *Global Counterspace Capabilities: An Open Source Assessment*, 9th ed. "
      "(April 2026), cited as SWF 2026. CSIS *Space Threat Assessment 2025* was consulted for background only; no row, pin or citation depends on it. "
      "Verification is recorded in `verification_log.md`.")
    a("")
    a("## How to read the tables")
    a("")
    a("**Scope and selection.** " + SCOPE_RULE + " The US Table 1-4 has 33 rows; %d are ledger rows and the one omitted row is the co-orbital Delta 180 test. "
      "%d rows give SWF's month only (`date_precision: month`)." % (sum(r["state"] == "United States" and r["source"] == SWF for r in kin), sum(r.get("date_precision") == "month" for r in kin)))
    a("")
    a("**Pins.** An SWF pin gives the table or passage, the printed section-page (for example `p. 05-01`) and the PDF page "
      "index (`PDF p. 212`). A non-SWF pin names the passage and starts with the source key in brackets, for example "
      "`[iq-2003-gps]`; the full cite is under [Sources](#sources). Where a row cites several places, all are listed.")
    a("")
    a("**Terms.** *Destructive test*: an intercept that created cataloged fragments. *Cataloged fragments*: tracked "
      "pieces created by a test (generally larger than 10 cm). *Fragments in orbit*: those still on orbit as of %s. "
      "*Altitude*: the figure named in the *kind* column (below). *Confidence*: how well the row is supported (below)." % DEBRIS_ASOF)
    a("")
    a("**Kinetic rows**")
    a("")
    a("| field | meaning |")
    a("|---|---|")
    a("| id | Stable row key used by the page and by `related_events` in the legal items. |")
    a("| date | Test date (YYYY-MM-DD); month-only SWF dates use the 1st and `date_precision: month`. An endnote explains where sources differ. |")
    a("| type | Test outcome class (below). |")
    a("| alt (km) / kind | Altitude and what it measures (below). Blank when SWF reports none. |")
    a("| cataloged / in orbit | Cataloged fragments created / fragments still in orbit as of %s (destructive tests only). |" % DEBRIS_ASOF)
    a("| conf | Confidence in the row (below). |")
    a("| note | Endnote number, where the row has one. |")
    a("")
    a("| type | meaning |")
    a("|---|---|")
    for x in TYPE_LEGEND:
        a("| `%s` | %s. |" % x)
    a("")
    a("| altitude kind | meaning |")
    a("|---|---|")
    for x in KIND_LEGEND:
        a("| `%s` | %s. |" % x)
    a("")
    a("**Non-kinetic rows**")
    a("")
    a("| field | meaning |")
    a("|---|---|")
    a("| start / end | Campaign or event span; `ongoing` means no end is documented. Year-only sources use 1 Jan or 31 Dec. |")
    a("| category | `directed_energy`, `ew_uplink`, `ew_downlink`, `gnss_jamming`, `gnss_spoofing` or `cyber`. |")
    a("| attribution | How firmly the source attributes the act (below). Never upgraded beyond the source. |")
    a("| target regime | What the effect hit: `ISR_LEO`, `GEO_comms`, `GNSS_MEO`, `LEO_constellation` or `ground_segment`. GNSS jamming hits receivers, not satellites; the code names the signal. |")
    a("| operational | `True` if used in a real conflict or operation, `False` if a test, a dispute or a non-conflict interference case. |")
    a("")
    a("| attribution level | meaning |")
    a("|---|---|")
    for x in ATTR_LEGEND:
        a("| `%s` | %s |" % x)
    a("")
    a("| confidence | meaning |")
    a("|---|---|")
    for x in CONF_LEGEND:
        a("| `%s` | %s |" % x)
    a("")
    a("**Legal rows.** `kind` is treaty, resolution, negotiation span, unilateral pledge, veto, or soft law. "
      "Soft-law manuals are marked (soft law) and are not binding.")
    a("")
    a("## Quick lookup by state or actor")
    a("")
    a("Row ids grouped by acting state (kinetic tests) or actor (non-kinetic operations). Counts are in brackets; ids match the tables below.")
    a("")
    a("| state or actor | kinetic | non-kinetic |")
    a("|---|---|---|")
    actors = sorted({r["state"] for r in kin} | {r["actor"] for r in nk_})
    for ac in actors:
        ks = [r["id"] for r in kin if r["state"] == ac]
        ns = [r["id"] for r in nk_ if r["actor"] == ac]
        a("| %s | %s | %s |" % (ac, ("[%d] " % len(ks) + ", ".join(ks)) if ks else "-",
                                ("[%d] " % len(ns) + ", ".join(ns)) if ns else "-"))
    a("")
    a("## Quick lookup by year")
    a("")
    a("Counts per calendar year (kinetic by test date; non-kinetic and legal by start date). Years with no rows are omitted; "
      "see `methodology.md` (section 3) for the Chart A gap statement, which follows SWF's complete DA-ASAT tables.")
    a("")
    a("| year | kinetic | non-kinetic | legal |")
    a("|---|---|---|---|")
    yrs = sorted({r["date"][:4] for r in kin} | {r["start"][:4] for r in nk_} | {r["start"][:4] for r in leg})
    for y in yrs:
        a("| %s | %s | %s | %s |" % (y, sum(r["date"][:4] == y for r in kin) or "-",
                                    sum(r["start"][:4] == y for r in nk_) or "-",
                                    sum(r["start"][:4] == y for r in leg) or "-"))
    a("")
    # kinetic
    a("## Kinetic events (chronological)")
    a("")
    a("**%d rows.**" % len(kin))
    a("")
    a("| date | id | state | system | target | type | alt (km) | kind | cataloged | in orbit | conf | pin | note |")
    a("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    refs = {}
    for r in kin:
        if r["source"] != SWF:
            refs[r["id"]] = (r["source"], r["source_url"])
        pn = r["pin"] if r["source"] == SWF else "%s: %s" % (_ref(r), r["pin"])
        a("| {date} | {id} | {state} | {system} | {target} | {type} | {a} | {altitude_kind} | {f} | {o} | {confidence} | {pn} | {nr} |".format(
            nr=nref(r), a=r["altitude_km"] if r["altitude_km"] is not None else "-",
            f=r["fragments_cataloged"] if r["fragments_cataloged"] is not None else "-",
            o=r["fragments_in_orbit"] if r["fragments_in_orbit"] is not None else "-", pn=pn, **r))
    a("")
    a("## Non-kinetic events (by start date)")
    a("")
    a("**%d rows.**" % len(nk_))
    a("")
    a("| start | end | id | actor | category | attribution | target regime | operational | conf | pin | note |")
    a("|---|---|---|---|---|---|---|---|---|---|---|")
    for r in nk_:
        if r["source"] != SWF:
            refs[r["id"]] = (r["source"], r["source_url"])
        pn = r["pin"] if r["source"] == SWF else "%s: %s" % (_ref(r), r["pin"])
        a("| {start} | {e} | {id} | {actor} | {category} | {attribution} | {target_regime} | {operational_use} | {confidence} | {pn} | {nr} |".format(
            e=r["end"] or "ongoing", pn=pn, nr=nref(r), **r))
    a("")
    a("## Legal items (by start date)")
    a("")
    a("**%d rows.**" % len(leg))
    a("")
    a("| start | end | id | kind | label | citation |")
    a("|---|---|---|---|---|---|")
    for r in leg:
        a("| %s | %s | %s | %s%s | %s | %s |" % (
            r["start"], r["end"] or "-", r["id"], r["kind"], " (soft law)" if r["soft_law"] else "",
            r["label"], r["citation"]))
    a("")
    a("## Conflicts inside the sources")
    a("")
    a("**%d rows.**" % nconf)
    a("")
    a("Where SWF (or a source) disagrees with itself, the row keeps one value under a stated rule and records the other here "
      "and in the row's `conflicts` field. Rule: Table 5-1 for intercept altitude and debris counts; the appendix or "
      "announcement date where two SWF places outvote a table.")
    a("")
    a("| id | conflict | note |")
    a("|---|---|---|")
    for r in events:
        for c in r.get("conflicts", []):
            a("| %s | %s | %s |" % (r["id"], c, nref(r)))
    a("")
    a("## Endnotes")
    a("")
    a("**%d notes.** Numbered in table order; each table row points here by number. Format: number, row id, date, note." % len(enum))
    a("")
    for r in kin + nk_:
        if r["id"] in enum:
            n = enum[r["id"]]
            a('<a id="n%d"></a>**%d. %s** (%s). %s' % (n, n, r["id"], r.get("date") or r.get("start"), r["notes"]))
            a("")
    a("## Capability coding (Chart B)")
    a("")
    a("Cells give the number of states coded **D** (demonstrated) and **P** (developing or latent) per decade.")
    a("")
    a("Rules:")
    a("")
    a("1. **D** = the state has tested or used the capability. Once D, a state stays counted as D in later decades.")
    a("2. **P** = programs, R&D or latent capability (for example, missile defense with inherent ASAT reach).")
    a("3. The **2020s** column follows the SWF 2026 chapter sections for its 13 countries. **Earlier decades are the "
      "builder's reconstruction** and are labeled that way on the chart; they are not SWF-assessed.")
    a("4. Iraq is outside SWF's 13 countries, so the 2003 GNSS-jamming event is excluded from this chart.")
    a("5. SWF's 2020s country matrix (Executive Summary) was read from the PDF's graphics. D entries all match it; some P entries for direct-ascent and co-orbital go beyond it (SWF shows \"no data\"), and the matrix has no cyber row. See `verification_log.md`, Open items and impact.")
    a("")
    a("| category | " + " | ".join(DEC) + " |")
    a("|---" * (len(DEC) + 1) + "|")
    for c, d in CAP.items():
        cells = []
        for dec in DEC:
            st = d.get(dec, {})
            nd, np_ = sum(v == "D" for v in st.values()), sum(v == "P" for v in st.values())
            cells.append("%dD/%dP" % (nd, np_) if st else "-")
        a("| %s | " % c + " | ".join(cells) + " |")
    a("")
    a("**2020s membership.**")
    a("")
    for c, d in CAP.items():
        st = d["2020s"]
        a("- %s: D = %s; P = %s." % (c, ", ".join(k for k, v in st.items() if v == "D") or "none",
                                     ", ".join(k for k, v in st.items() if v == "P") or "none"))
    a("")
    a("Category sources:")
    a("")
    for c, t in CAP_SOURCES.items():
        a("- **%s**: %s" % (c, t))
    a("")
    a("## Sources")
    a("")
    a("- [SWF]: " + SOURCE_FULL[SWF])
    for i, (src, url) in sorted(refs.items()):
        a("- [%s]: %s" % (i, SOURCE_FULL[src]))
    a("")
    a("Legal items carry their own full citation in the table above (`citation` field in `data/legal.json`).")
    a("")
    return "\n".join(o)

