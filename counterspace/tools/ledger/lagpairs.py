"""Lag (chronology) pairs, derived from legal.json `related_events`, which is authoritative.

Rule (methodology section 5, decision 12): for each ledger event that is named in the `related_events` of at least one legal item
dated LATER than the event, the pair is (event, earliest such legal item). Legal items that pre-date the event
(for example Tallinn 2017 for Viasat 2022) do not form a pair. Events with no later related item are listed under
`open` only when the page shows them as an open ring (no later legal step in the ledger). Pairs that the page once
drew without a `related_events` link are recorded under `dropped` with the reason; the page must not draw them.
"""
import datetime

# Neutral display text per pair (chronology only; no causal wording). Keyed by (event id, legal id).
PAIR_TEXT = {
    ("us-1962-starfish-prime", "ltbt-1963"): "Starfish Prime (1962), then the Limited Test Ban Treaty (1963), which followed it",
    ("in-2019-shakti", "unga-77-41"): "Shakti destructive test (2019), then UNGA 77/41 (2022), a non-binding call not to conduct destructive DA-ASAT tests",
    ("ru-2021-cosmos1408", "us-moratorium-2022"): "Cosmos 1408 destructive test (2021), then a US test moratorium (2022, unilateral pledge)",
    ("kp-2010-gps", "icao-2025"): "North Korean GNSS jamming (from 2010), then an ICAO Assembly finding on GNSS interference (2025), which SWF also ties to the Baltic case",
    ("ru-2023-baltic", "icao-2025"): "Baltic-region GNSS interference (from 2023), then an ICAO Assembly finding on recurring GNSS interference (2025)",
    ("ru-2024-eu-sats", "itu-rrb-2024"): "Jamming of European satellites (2024), then ITU RRB “grave concern” (2024)",
}
# Events shown as an open ring: no later related legal item in the ledger. `basis` says why.
OPEN = [
    {"event": "us-1997-miracl", "text": "Laser fired at a satellite (1997): no legal item in the ledger is related to it",
     "basis": "No related_events link; the ring states an absence in this ledger, not a finding that no rule exists."},
    {"event": "ru-2022-viasat", "text": "Viasat cyberattack (2022): the only related legal item, Tallinn Manual 2.0 (2017), is soft law and pre-dates it",
     "basis": "tallinn-2017 lists ru-2022-viasat in related_events but is earlier, so it forms no forward pair."},
]
# Pairs the page drew before round 9 that have no related_events link. They are dropped from the panel.
DROPPED = [
    {"event": "us-1959-bold-orion", "law": "ost-1967",
     "reason": "No sourced link: SWF and the treaty text do not connect the 1959 Bold Orion flyby to the Outer Space Treaty."},
    {"event": "cn-2007-fy1c", "law": "unga-77-41",
     "reason": "No sourced link: unga-77-41 relates to Cosmos 1408 and Shakti; a Fengyun-1C link would be the builder's inference."},
]
RULE = ("Pairs come from legal.json related_events only: each event is paired with the earliest later legal item that lists it. "
        "Chronology, not causation.")

# Table 5-1 (SWF 2026, p. 05-01, PDF p. 212): the 16 destructive tests in space are 5 direct-ascent and 11 co-orbital.
CO_ORBITAL = dict(count=11, cataloged=975, in_orbit=417, total_swf=16, states={"Russia": 10, "United States": 1},
                  pin="Table 5-1, p. 05-01 (PDF p. 212)")


def _d(s):
    return datetime.date.fromisoformat(s)


def build_pairs(events, legal):
    byid = {e["id"]: e for e in events}
    best = {}
    for l in legal:
        for eid in l.get("related_events", []):
            e = byid.get(eid)
            if e is None:
                continue
            ed = _d(e.get("date") or e["start"])
            if _d(l["start"]) <= ed:
                continue
            if eid not in best or l["start"] < best[eid]["start"]:
                best[eid] = l
    pairs = []
    for eid, l in sorted(best.items(), key=lambda kv: _d(byid[kv[0]].get("date") or byid[kv[0]]["start"])):
        e = byid[eid]
        ed = _d(e.get("date") or e["start"])
        months = (_d(l["start"]).year - ed.year) * 12 + _d(l["start"]).month - ed.month
        pairs.append({"event": eid, "law": l["id"], "months": months, "text": PAIR_TEXT[(eid, l["id"])]})
    return {"rule": RULE, "pairs": pairs, "open": OPEN, "dropped": DROPPED}
