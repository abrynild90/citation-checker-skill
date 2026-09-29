"""validate(): fails the build when rows, generated data or documents disagree."""
import re, sys, json, datetime
from .rows import *
from .schema import *
from .lagpairs import CO_ORBITAL
from .verification import DISCREPANCIES

ROOT = OUT.parent
KIN_REQ = ("state", "system", "target", "date", "type", "altitude_kind")
NK_REQ = ("actor", "category", "start", "attribution", "target_regime")
CO_REQ = ("actor", "system", "start", "activity", "orbit_regime", "description")


def validate(events, legal, caps, pairs, docs):
    """Fail the build (SystemExit) if the rows, generated data or documents disagree. `docs` = {"ledger": text, "log": text}."""
    err = []
    date_re, ym_re = re.compile(r"^\d{4}-\d{2}-\d{2}$"), re.compile(r"^\d{4}-\d{2}$")

    def good_date(v):
        if not isinstance(v, str) or not date_re.match(v):
            return False
        try:
            datetime.date.fromisoformat(v)
            return True
        except ValueError:
            return False

    def enum(row, field, key=None):
        if row.get(field) not in ENUMS[key or field]:
            err.append("%s: bad %s %r" % (row["id"], field, row.get(field)))

    ids = [r["id"] for r in events]
    lids = [r["id"] for r in legal]
    for label, lst in (("event", ids), ("legal", lids)):
        for d in sorted({x for x in lst if lst.count(x) > 1}):
            err.append("duplicate %s id %s" % (label, d))
    idset = set(ids)
    for r in events:
        for f in ("source", "source_url", "pin", "source_full"):
            if not r.get(f):
                err.append("%s: missing %s" % (r["id"], f))
        enum(r, "domain"); enum(r, "confidence")
        if r.get("scene_3d") and r["scene_3d"] not in SCENE_IDS:
            err.append("%s: unknown scene_3d %r" % (r["id"], r["scene_3d"]))
        need = KIN_REQ if r["domain"] == "kinetic" else CO_REQ if r["domain"] == "co_orbital" else NK_REQ
        for f in need:
            if r.get(f) in (None, ""):
                err.append("%s: missing required %s field %s" % (r["id"], r["domain"], f))
        if r["domain"] == "kinetic":
            enum(r, "type"); enum(r, "altitude_kind")
            if not good_date(r.get("date")):
                err.append("%s: bad date %r" % (r["id"], r.get("date")))
            if "date_precision" in r:
                enum(r, "date_precision")
                if r["date_precision"] == "month" and not r["date"].endswith("-01"):
                    err.append("%s: month-precision date must be the 1st" % r["id"])
            fa = r.get("fragments_as_of")
            if fa is not None and not ym_re.match(fa):
                err.append("%s: bad fragments_as_of %r" % (r["id"], fa))
            c, o = r.get("fragments_cataloged"), r.get("fragments_in_orbit")
            if (c is None) != (fa is None):
                err.append("%s: fragments_as_of must accompany fragments_cataloged" % r["id"])
            if c is not None and o is not None and o > c:
                err.append("%s: fragments_in_orbit %s > fragments_cataloged %s" % (r["id"], o, c))
        elif r["domain"] == "non_kinetic":
            enum(r, "category"); enum(r, "attribution"); enum(r, "target_regime")
            if not good_date(r.get("start")):
                err.append("%s: bad start %r" % (r["id"], r.get("start")))
            if r.get("end") is not None and not good_date(r["end"]):
                err.append("%s: bad end %r" % (r["id"], r["end"]))
            if good_date(r.get("start")) and r.get("end") and good_date(r["end"]) and r["end"] < r["start"]:
                err.append("%s: end before start" % r["id"])
        elif r["domain"] == "co_orbital":
            enum(r, "activity"); enum(r, "orbit_regime")
            words = len(str(r.get("evidence", "")).split())
            if not 1 <= words <= 15:
                err.append("%s: co_orbital needs a verbatim evidence quotation of 1-15 words (has %d)" % (r["id"], words))
            if r["activity"] != "spaceplane_mission" and not r.get("target"):
                err.append("%s: co_orbital %s row needs a target" % (r["id"], r["activity"]))
            if not good_date(r.get("start")):
                err.append("%s: bad start %r" % (r["id"], r.get("start")))
            if r.get("end") is not None and not good_date(r["end"]):
                err.append("%s: bad end %r" % (r["id"], r["end"]))
            if good_date(r.get("start")) and r.get("end") and good_date(r["end"]) and r["end"] < r["start"]:
                err.append("%s: end before start" % r["id"])
            if "date_precision" in r:
                enum(r, "date_precision")
                if good_date(r.get("start")):
                    d0 = datetime.date.fromisoformat(r["start"])
                    if r["date_precision"] == "month" and d0.day != 1:
                        err.append("%s: month-precision start must be the 1st" % r["id"])
                    if r["date_precision"] == "year" and (d0.month, d0.day) != (1, 1):
                        err.append("%s: year-precision start must be 1 Jan." % r["id"])
                if good_date(r.get("end") or ""):
                    d1 = datetime.date.fromisoformat(r["end"])
                    last = (d1 + datetime.timedelta(days=1)).day == 1
                    if r["date_precision"] == "month" and not last:
                        err.append("%s: month-precision end must be the last day of the month" % r["id"])
                    if r["date_precision"] == "year" and (d1.month, d1.day) != (12, 31):
                        err.append("%s: year-precision end must be 31 Dec." % r["id"])
            if r["activity"] == "spaceplane_mission" and r.get("target"):
                err.append("%s: a spaceplane_mission row has no target (use a separate release or rpo row)" % r["id"])
        for rid in r.get("related_events", []):
            if rid not in idset:
                err.append("%s: related_events %s does not resolve" % (r["id"], rid))
    for r in legal:
        for f in ("source_url", "citation", "label", "short_note"):
            if not r.get(f):
                err.append("%s: missing %s" % (r["id"], f))
        enum(r, "kind", "legal_kind")
        if not good_date(r.get("start")):
            err.append("%s: bad start %r" % (r["id"], r.get("start")))
        if r.get("end") is not None and not good_date(r["end"]):
            err.append("%s: bad end %r" % (r["id"], r["end"]))
        if r.get("scene_3d") and r["scene_3d"] not in SCENE_IDS:
            err.append("%s: unknown scene_3d %r" % (r["id"], r["scene_3d"]))
        for rid in r.get("related_events", []):
            if rid not in idset:
                err.append("%s: related_events %s does not resolve" % (r["id"], rid))
    # ---- capabilities.json
    if set(caps["coding"]) != set(CAP_SOURCES) or set(caps["sources"]) != set(caps["coding"]):
        err.append("capabilities: coding and sources categories differ")
    if caps["decades"] != DEC:
        err.append("capabilities: decades list differs from DEC")
    for cat, by_dec in caps["coding"].items():
        for dec, states in by_dec.items():
            if dec not in caps["decades"]:
                err.append("capabilities.%s: unknown decade %r" % (cat, dec))
            for st, v in states.items():
                if st not in CAP_STATES:
                    err.append("capabilities.%s.%s: unknown state %r" % (cat, dec, st))
                if v not in ("D", "P"):
                    err.append("capabilities.%s.%s.%s: value %r is not D or P" % (cat, dec, st, v))
        if "2020s" not in by_dec:
            err.append("capabilities.%s: no 2020s coding" % cat)
    # ---- lag_pairs.json
    lset = set(lids)
    for p in pairs["pairs"]:
        if p["event"] not in idset or p["law"] not in lset:
            err.append("lag_pairs: %s -> %s does not resolve" % (p["event"], p["law"]))
            continue
        law = next(l for l in legal if l["id"] == p["law"])
        if p["event"] not in law.get("related_events", []):
            err.append("lag_pairs: %s is not in related_events of %s" % (p["event"], p["law"]))
    for o in pairs["open"]:
        if o["event"] not in idset:
            err.append("lag_pairs.open: %s does not resolve" % o["event"])
        if any(p["event"] == o["event"] for p in pairs["pairs"]):
            err.append("lag_pairs.open: %s also has a pair" % o["event"])
    for d in pairs["dropped"]:
        if d["event"] not in idset or d["law"] not in lset:
            err.append("lag_pairs.dropped: %s -> %s does not resolve" % (d["event"], d["law"]))
        if any(p["event"] == d["event"] and p["law"] == d["law"] for p in pairs["pairs"]):
            err.append("lag_pairs.dropped: %s -> %s is also a pair" % (d["event"], d["law"]))
    # ---- co-orbital figures (SWF Table 5-1)
    dest = [r for r in events if r["domain"] == "kinetic" and r["type"] == "destructive"]
    if len(dest) + CO_ORBITAL["count"] != CO_ORBITAL["total_swf"]:
        err.append("destructive tests: %d ledger + %d co-orbital != SWF total %d" % (len(dest), CO_ORBITAL["count"], CO_ORBITAL["total_swf"]))
    # ---- documents
    nk_n = sum(r["domain"] == "non_kinetic" for r in events)
    co_n = sum(r["domain"] == "co_orbital" for r in events)
    kin_n = len(events) - nk_n - co_n
    m = (ROOT / "methodology.md").read_text()
    for lab, n in (("Kinetic events", kin_n), ("Non-kinetic events", nk_n), ("Co-orbital events", co_n), ("Legal items", len(legal)), ("Capability categories", len(caps["coding"]))):
        if not re.search(r"\| %s \| %d \|" % (lab, n), m):
            err.append("methodology.md: '%s' row count is not %d" % (lab, n))
    led, log = docs["ledger"], docs["log"]
    for lab, txt in (("methodology.md", m), ("ledger.md", led), ("verification_log.md", log), ("verification_history.md", (ROOT / "verification_history.md").read_text())):
        for d in set(re.findall(r"(?:[Aa]s of|Ledger as of) (\d{4}-\d{2}-\d{2})", txt)):
            if d != LEDGER_ASOF:
                err.append("%s: as-of date %s differs from LEDGER_ASOF %s" % (lab, d, LEDGER_ASOF))
    for lab, txt in (("methodology.md", m), ("ledger.md", led), ("verification_log.md", log)):
        if LEDGER_ASOF not in txt:
            err.append("%s: does not state the ledger as-of date %s" % (lab, LEDGER_ASOF))
    if SCHEMA["ledger_as_of"] != LEDGER_ASOF or datetime.date.fromisoformat(LEDGER_ASOF).strftime("%-d") + " " not in SCHEMA["page_strings"]["ledger_as_of_display"]:
        err.append("schema.json: ledger_as_of / display string disagree with LEDGER_ASOF")
    for frag in ("records %d kinetic tests, %d non-kinetic operations, %d co-orbital rows and %d legal items" % (kin_n, nk_n, co_n, len(legal)),
                 "| Kinetic events | %d |" % kin_n, "| Non-kinetic events | %d |" % nk_n, "| Co-orbital events | %d |" % co_n, "| Legal items | %d |" % len(legal),
                 "| Capability categories | %d |" % len(caps["coding"]),
                 "the %d direct-ascent tests" % len(dest) if False else "These are the %d direct-ascent tests" % len(dest),
                 "**%d co-orbital** destructive tests" % CO_ORBITAL["count"], "lists %d destructive ASAT tests in all" % CO_ORBITAL["total_swf"]):
        if frag not in led:
            err.append("ledger.md: expected text not found: %r" % frag)
    # verification_log.md: one table row per data row, per-set counts, status totals
    from .logmd import log_rows, counts, STATUSES
    lrows = [tuple(c.strip() for c in l.strip().strip("|").split(" | ")) for l in log.split("\n")
             if re.match(r"\| (kinetic|non-kinetic|co-orbital|legal|capability) \| `", l)]
    want = [(s, i) for s, i, *_ in log_rows(events, legal)]
    got = [(c[0], c[1].strip("`")) for c in lrows]
    if got != want:
        err.append("verification_log.md: row table differs from data (%d rows vs %d expected; missing %s, extra %s)" % (
            len(got), len(want), sorted(set(want) - set(got))[:3], sorted(set(got) - set(want))[:3]))
    cnt = counts(log_rows(events, legal))
    tot = "| **Total** | **%d** | %s |" % (len(want), " | ".join("**%d**" % sum(v[x] for v in cnt.values()) for x in STATUSES))
    if tot not in log:
        err.append("verification_log.md: totals row is not %r" % tot)
    if "%d items = %d kinetic + %d non-kinetic + %d co-orbital" % (len(want), kin_n, nk_n, co_n) not in log:
        err.append("verification_log.md: scope line counts differ from data")
    nd = len(re.findall(r"^\| \d+ ", log, flags=re.M))
    if nd != len(DISCREPANCIES) or ("%d found and fixed in total" % nd) not in log:
        err.append("verification_log.md: discrepancy count %d does not match" % nd)
    if err:
        sys.exit("VALIDATION FAILED (%d):\n  " % len(err) + "\n  ".join(err))
    print("validate(): OK (%d events, %d legal items, %d capability categories, %d lag pairs)" % (len(events), len(legal), len(caps["coding"]), len(pairs["pairs"])))

