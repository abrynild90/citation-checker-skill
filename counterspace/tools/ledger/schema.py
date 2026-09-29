"""Enums, scope rule, schema.json content and legends. LEDGER_ASOF is the single as-of date for every document."""
from .rows import *

LEDGER_ASOF = "2026-09-29"
SCHEMA_VERSION = "1.2.0"
SOURCE_FULL = {
    "SWF 2026": "Victoria Samson & Kathleen Brett eds., Global Counterspace Capabilities: An Open Source Assessment "
                "(Secure World Foundation, 9th ed., Apr. 2026), " + SWF_URL,
    "DOE/NV-209 Rev. 16 (2015)": "U.S. Dep't of Energy, Nat'l Nuclear Sec. Admin. Nevada Field Office, United States "
                "Nuclear Tests, July 1945 through September 1992, DOE/NV-209 Rev. 16 (Sept. 2015), "
                "https://nnss.gov/wp-content/uploads/2023/08/DOE_NV-209_Rev16.pdf",
    "CENTCOM briefing (Maj. Gen. Renuart), 25 Mar 2003 (AFPS report)": "American Forces Press Service, CENTCOM Charts "
                "Operation Iraqi Freedom Progress (Mar. 25, 2003) (briefing by Maj. Gen. Victor Renuart), "
                "https://www.globalsecurity.org/wmd/library/news/iraq/2003/iraq-030325-afps03.htm",
}
CAP_STATES = ["Australia", "China", "France", "Germany", "India", "Iran", "Israel", "Japan", "North Korea", "Russia",
              "South Korea", "USSR/Russia", "United Kingdom", "United States"]
SCENE_IDS = ["starfish", "solwind", "fengyun", "burnt-frost", "dn2", "shakti", "cosmos1408", "gnss", "viasat", "laser", "sj21-tug", "rpo", "spaceplanes"]
ENUMS = {
    "domain": ["kinetic", "non_kinetic", "co_orbital"],
    "confidence": ["high", "medium", "low"],
    "type": ["destructive", "non_destructive", "midcourse_intercept", "apogee_only", "flyby", "nuclear"],
    "altitude_kind": ["intercept", "apogee", "detonation"],
    "date_precision": ["day", "month", "year"],
    "activity": ["capture_tow", "rpo", "docking", "release", "spaceplane_mission"],
    "orbit_regime": ["LEO", "GEO", "HEO", "not_stated"],
    "category": ["directed_energy", "ew_uplink", "ew_downlink", "gnss_jamming", "gnss_spoofing", "cyber"],
    "attribution": ["official_government", "multi_government", "researcher_osint", "alleged"],
    "target_regime": ["ISR_LEO", "GEO_comms", "GNSS_MEO", "LEO_constellation", "ground_segment"],
    "legal_kind": ["treaty", "resolution", "negotiation_span", "unilateral", "veto"],
    "scene_3d": SCENE_IDS,
}
SCOPE_RULE = ("Scope rule: every direct-ascent (DA-ASAT) test row that SWF 2026 lists in Table 1-4 (US), Tables 2-4 and 16-2 "
              "(Russia), Tables 3-3 and 16-3 (China) and Tables 4-1 and 16-4 (India) is a row in this ledger, including failures, "
              "rocket-only tests and tests against a star or no target. Exclusions, all disclosed: co-orbital tests "
              "(Table 1-4 also lists the US Delta 180 co-orbital intercept of 5 Sep 1986, which SWF's text calls a co-orbital "
              "experiment; Table 16-2's Soviet IS, Naryad, Polyot and Cosmos 2521/2536 entries), and the Table 16-3 line "
              "'Apr. 15, 2023' (treated as a date variant of the 14 Apr 2023 test, see that row's conflicts). "
              "Starfish Prime (not an SWF DA-ASAT table row) is the one added nuclear marker.")
CO_SCOPE_RULE = ("Co-orbital rule: every line of SWF 2026 Table 1-3 (US RPOs), Table 2-3 (Russian RPOs) and Table 3-2 (Chinese RPOs), and every flight in "
                 "Table 1-1 (X-37B) and Table 3-1 (Chinese reusable experimental spacecraft), is a row with domain co_orbital, dated from the table (or from SWF's text where the row says so "
                 "and gives the reason). Two exceptions, both disclosed: (a) the Jan. 2022 USA 270 / Shiyan-12 approach is listed in both Table 1-3 and Table 3-2 and "
                 "is one row; (b) where SWF's text dates separate steps that a table folds into one line (SJ-21 with Compass G2; SJ-21 with SJ-25; "
                 "the Cosmos 2542 release of Cosmos 2543; the SY-7 release of Payload A Debris; the GSSAP 'flanking' of SJ-21 and SJ-25), the text-dated "
                 "step is its own row and the row says so. RPO rows record that a proximity operation happened as SWF reports it; they are not attacks, "
                 "and SWF's wording on intent is hedged and kept in the row.")
SCHEMA = {
    "schema_version": SCHEMA_VERSION,
    "scope_rule": SCOPE_RULE,
    "co_scope_rule": CO_SCOPE_RULE,
    "page_strings": {"ledger_as_of_display": "29 Sept. 2026", "swf_edition_label": "SWF 9th ed. (Apr. 2026)"},
    "enums": ENUMS,
    "generated_by": "tools/build_data.py",
    "ledger_as_of": LEDGER_ASOF,
    "description": "Data files for the Counterspace Timeline. events.json and legal.json are top-level arrays "
                   "(unchanged shape); capabilities.json is an object. Version bumps: patch = new rows or "
                   "corrected values; minor = new optional fields; major = shape change.",
    "files": {
        "events.json": {"shape": "array of event rows, sorted by date/start; domain is 'kinetic', 'non_kinetic' or 'co_orbital'",
            "common_fields": {"id": "stable key", "domain": "kinetic | non_kinetic | co_orbital", "confidence": "high | medium | low",
                "notes": "free-text caveats", "source": "short source label", "source_full": "full citation string for a sources list",
                "source_url": "link to the source", "pin": "table/passage plus printed page and PDF page",
                "conflicts": "optional list of disagreements inside the sources", "scene_3d": "optional 3D scene key"},
            "kinetic_fields": {"date": "YYYY-MM-DD (first of the month when date_precision is month)", "date_precision": "optional: day (default) | month, where SWF gives only a month", "state": "acting state", "system": "weapon system", "target": "target object",
                "type": "destructive | non_destructive | midcourse_intercept | apogee_only | flyby | nuclear",
                "altitude_km": "number or null", "altitude_kind": "intercept | apogee | detonation",
                "fragments_cataloged": "int or null", "fragments_in_orbit": "int or null", "fragments_as_of": "YYYY-MM or null"},
            "non_kinetic_fields": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD or null (ongoing)", "actor": "string",
                "category": "directed_energy | ew_uplink | ew_downlink | gnss_jamming | gnss_spoofing | cyber",
                "attribution": "official_government | multi_government | researcher_osint | alleged",
                "target_system": "string", "target_regime": "ISR_LEO | GEO_comms | GNSS_MEO | LEO_constellation | ground_segment",
                "operational_use": "bool", "effect": "string"},
            "co_orbital_fields": {"start": "YYYY-MM-DD (first of the month or 1 Jan. when date_precision is month or year)", "end": "YYYY-MM-DD, last day of the month or 31 Dec. under month or year precision, or null (ongoing in SWF's Apr. 2026 edition)",
                "date_precision": "optional: day (default) | month | year; applies to start and end", "actor": "the chaser's operator: string",
                "system": "the acting spacecraft (chaser, releasing vehicle or spaceplane)", "target": "the approached or released object, or null for a spaceplane mission",
                "activity": "capture_tow | rpo | docking | release | spaceplane_mission",
                "orbit_regime": "LEO | GEO (belt or its immediate vicinity, incl. the disposal region) | HEO | not_stated",
                "description": "the builder's own summary, keeping SWF's hedges", "related_events": "optional list of event ids"},
            "validation": "tools/build_data.py validate() enforces this schema on every build: unique ids, enums, date formats, required fields per domain, required source fields, id resolution, fragments_in_orbit <= fragments_cataloged, capabilities.json states/decades/D-P values, lag_pairs.json ids, and the counts and as-of dates in methodology.md, ledger.md and verification_log.md."},
        "legal.json": {"shape": "array of legal items, sorted by start",
            "fields": {"id": "stable key", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD or null",
                "kind": "treaty | resolution | negotiation_span | unilateral | veto", "label": "short display label",
                "short_note": "one-paragraph description", "citation": "full (Bluebook-style) citation string",
                "source_url": "link", "soft_law": "bool", "scene_3d": "optional", "related_events": "optional list of event ids"}},
        "lag_pairs.json": {"shape": "object", "fields": {"rule": "how pairs are chosen",
            "pairs": "list of {event, law, months, text}: each law lists the event in related_events and is dated later",
            "open": "events shown as an open ring (no later related legal item), with basis",
            "dropped": "pairs once drawn that have no related_events link; the page must not draw them"}},
        "capabilities.json": {"shape": "object", "fields": {"decades": "list", "reconstructed_before": "decade label",
            "coding": "category -> decade -> state -> 'D' (demonstrated) | 'P' (developing/latent)",
            "sources": "category -> source text", "note": "string"}},
    },
}

ATTR_LEGEND = [
    ("official_government", "A government (or its military) has said so itself, or a government has publicly made the claim."),
    ("multi_government", "Several governments or an intergovernmental body (ITU, ICAO) made or located the attribution; not a finding of state responsibility."),
    ("researcher_osint", "Open-source researchers or a nonprofit are the source; no government attribution relied on."),
    ("alleged", "Reported or claimed without independent validation; kept at the source's own hedge."),
]
CONF_LEGEND = [
    ("high", "Date and value match SWF tables or text with no unresolved internal conflict."),
    ("medium", "Source is hedged ('likely', 'possible'), a value is missing, or a date conflict was resolved by a builder rule."),
    ("low", "SWF itself marks the value with '?', only one SWF table lists the row, or the report is an anonymous-source press account."),
]
TYPE_LEGEND = [
    ("destructive", "Intercept that created cataloged debris (SWF Table 5-1)"),
    ("non_destructive", "Test with no debris reported, or no target; includes rocket-only tests"),
    ("midcourse_intercept", "Suborbital intercept of a missile target; no orbital debris"),
    ("apogee_only", "Launch to high altitude; not an intercept (DN-2, 2013)"),
    ("flyby", "Pass within a kill radius of a satellite without a kill"),
    ("nuclear", "High-altitude nuclear detonation (Starfish Prime only)"),
]
KIND_LEGEND = [
    ("intercept", "Altitude of the intercept (SWF Table 5-1 for destructive tests)"),
    ("apogee", "Maximum altitude of the missile or rocket (SWF Tables 1-4, 2-4, 3-3)"),
    ("detonation", "Burst altitude of the nuclear test"),
]

