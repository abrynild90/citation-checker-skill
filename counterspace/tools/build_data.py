"""Builds the Counterspace Timeline data and generated docs. Entry point: `python3 tools/build_data.py`.

Package `tools/ledger/`: rows.py (all rows, edit here), schema.py (enums, schema.json, LEDGER_ASOF = the single as-of date),
lagpairs.py (lag panel pairs derived from related_events), co_rows.py (co-orbital rows), markdown.py (ledger.md), verification.py + logmd.py
(verification_log.md), validate.py (fails the build when data and documents disagree).
Writes data/{events,legal,capabilities,schema,lag_pairs}.json, ledger.md and verification_log.md.
"""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ledger.rows import *
from ledger.co_rows import CO
from ledger.schema import *
from ledger.lagpairs import build_pairs
from ledger.markdown import ledger_md
from ledger.logmd import render as log_md
from ledger.validate import validate


def main():
    OUT.mkdir(exist_ok=True)
    root = OUT.parent
    events = sorted(K + NK + CO, key=lambda r: r.get("date") or r.get("start"))
    for r in events:
        r["source_full"] = SOURCE_FULL[r["source"]]
        extra = r.pop("_sf_extra", None)
        if extra:
            r["source_full"] += "; also " + extra
    legal = sorted(L, key=lambda r: r["start"])
    caps = dict(decades=DEC, reconstructed_before="2020s", coding=CAP, sources=CAP_SOURCES,
                note="2020s = SWF 2026 assessment (13 countries). Earlier decades reconstructed by builder; "
                     "'D' = demonstrated (tested or used), 'P' = developing or latent.")
    pairs = build_pairs(events, legal)
    docs = {"ledger": ledger_md(events), "log": log_md(events, legal)}
    validate(events, legal, caps, pairs, docs)
    dump = lambda name, obj: (OUT / name).write_text(json.dumps(obj, indent=1, ensure_ascii=False))
    dump("schema.json", SCHEMA)
    dump("events.json", events)
    dump("legal.json", legal)
    dump("capabilities.json", caps)
    dump("lag_pairs.json", pairs)
    (root / "ledger.md").write_text(docs["ledger"])
    (root / "verification_log.md").write_text(docs["log"])
    print(len(K), "kinetic", len(NK), "non-kinetic", len(CO), "co-orbital", len(L), "legal", len(pairs["pairs"]), "lag pairs")


if __name__ == "__main__":
    main()
