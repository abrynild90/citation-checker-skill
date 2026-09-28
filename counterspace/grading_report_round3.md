# Counterspace Timeline: Independent Grading Report, Round 3

Method: fresh Playwright review (SwiftShader), 1440 and 375 px, dark/light/reduced-motion. All 10 scenes at t=0.3/0.6/0.85. Screenshots in scratchpad/grade3/. audit() returned [] in all four modes; no console or page errors; no horizontal scroll (scrollWidth 1440 and 375). Spot-checks vs SWF text (all match): FY-1C 880 km/3,532/2,351; Solwind 530 km/285 (Table 5-1 row); Burnt Frost 175, "about 20 months" (prose), 220 vs 240 km conflict disclosed; Shakti 300 km/130/0; Cosmos 1408 1,807/5; DN-2 30,000 km attributed as "analysis cited by SWF"; Bold Orion; Starfish (DOE); ICAO label now "infraction" in quotes (SWF p. 02-30 wording). Doc counts (44/15/19) now reconcile; schema_version present in schema.json. Round 2 defects: Chart C truncation FIXED; "Close" preset renamed "Zoom" FIXED; GNSS chip FIXED; 40/44 counts FIXED; legal band now has zoom inset and phone list FIXED (mostly); hero duplicate GPS label merged FIXED; Solwind/Burnt Frost/Laser/Cosmos scenes now have arcs, targets, ISS, attached beam FIXED.
Not exhaustively re-tested: PNG still, static fallback and SVG export were checked by file inspection only (exports have no truncation, carry title/source/as-of), so those scores are capped.

## Scores

| Portion | Score | Note / best improvement |
|---|---|---|
| Header/intro | 92 | Controls now top-right, glance panel, as-of and CSIS caveat. Improve: nothing major; tighten the "How to read" paragraph. |
| Hero 3D overview | 91 | Labels de-duplicated, but the LEO/ISS/MEO labels still cluster near the limb. Offset labels. |
| Legal band | 90 | Zoom inset resolves the 2022-25 cluster; on mobile it is marks-only (phone list below). Add tap-to-label. |
| Chart A | 92 | Log axis, area bubbles, sourced callouts; 1970-2000 gap unexplained; upper-right "Has a 3D scene" cube touches DN-2 label edge. Annotate the gap. |
| Chart C | 92 | Full labels, no truncation, wraps on mobile. "last destructive test" mobile label sits mid-chart; Alleged/Ongoing legend wraps awkwardly. |
| Chart B | 89 | Honest reconstruction flag and zero baseline; annotation still sits over plot top; mobile table wide. Reserve a band. |
| Lag panel | 90 | Clear legal-force encoding; Cosmos 1408 and RRB markers still tiny/overlapped (glyphs overlap at 5 and 4 months). Enlarge glyphs. |
| Sources & methodology | 92 | 22 full cites; SWF cite full. Rows for DOE/ICAO fine. Add a short "how to cite this page" line. |
| Scene overlay UI | 90 | Preset rename fixed; scrubber timing shown; mobile header compact; DN-2 labels still stack tightly. Scrubber does not expose aria-valuetext with time (unverified). |
| Static/reduced-motion fallback | 86 | Not fully re-inspected; earlier flat disc/label crowding likely improved but unverified. Verify Play hidden. |
| Mobile (375) | 89 | No h-scroll, Chart C wraps; scene labels crowd on DN-2 (ms_dn2.png) and legal band marks-only. |
| Light mode | 91 | Tokens correct; sticky band contrast fine. |
| SVG exports | 90 | No truncation, title/source/as-of embedded. Some exports lack a visible on-canvas as-of line (Chart C has it in text). |
| PNG still export | 87 | Hook works; banner/caption fix not visually re-verified. |
| Starfish | 89 | Good; labels spread. |
| Solwind | 91 | Arc, debris, decay tally now visible; target satellite still faint. |
| Fengyun | 93 | Dense ring, accurate pins. |
| Burnt Frost | 90 | Arc, USS Lake Erie, accurate decay wording; falling target not depicted. |
| DN-2 | 88 | Correctly framed "not an intercept", but three labels crowd at the right edge and clip past the canvas at 1440 (Apogee label at x~957) and on mobile. Stagger/anchor left. |
| Shakti | 90 | Accurate; intercept flash modest. |
| Cosmos 1408 | 93 | ISS crossing shown, cloud crosses ISS altitude, still-in-orbit stated. |
| GNSS | 91 | Receiver-not-satellite clear; label wording fixed. |
| Viasat | 89 | Careful attribution; limited animation. |
| Laser | 91 | Beam persists to 0.85, target label attached, Peresvet mentioned in caption (not depicted). |
| Data ledger JSON | 93 | 59 events + 19 legal, pins, confidence, conflicts, schema.json with version. |
| ledger.md | 88 | Complete; no table of contents. Add TOC. |
| methodology.md | 92 | Numbering and counts reconciled, decision 14 documents ICAO wording. |
| verification_log.md | 91 | Honest statuses; a few sub-details remain UNCHECKED. |
| Code quality/architecture | 88 | Clean separation, build scripts, hooks; app.js 85 KB monolith; audit() still does not test overlap. |

### Cross-cutting
| Dimension | Score |
|---|---|
| Visual impact | 92 |
| Quality of graphics | 90 |
| Accuracy (10+ checks, legal cautions) | 93 |
| User experience | 90 |
| Accessibility | 89 |
| Performance (313 KB page, ~6 s under SwiftShader) | 86 |
| Fun/engagement | 91 |
| Pedagogical value | 93 |
| Fidelity to textbook-companion purpose | 93 |

## Overall: 90 / 100

## Defects blocking 93 (below-93 portions)
1. DN-2 scene labels: right-edge stacking/clipping (s_dn2_0.85.png, ms_dn2.png; scenes.js DN-2 label config).
2. Chart B: annotation overlays plot top; wide mobile table (d1440_chartB.png, m375_chartB.png).
3. Lag panel: overlapping glyphs for 5-month and 4-month rows (d1440_lag.png).
4. Legal band on mobile: unlabeled marks (m375_legalBand.png); inset only on desktop.
5. Static fallback and PNG still: not re-verified visually this round (score capped); confirm label overlap, Play hidden, banner clipping.
6. Hero: LEO/ISS/MEO labels still clustered (d1440_top.png).
7. ledger.md has no TOC; verification_log has UNCHECKED sub-details.
8. Performance: no lazy texture deferral measurable at ~6 s to earthReady in SwiftShader; app.js monolith; audit() cannot detect overlaps.
9. Chart A 1970-2000 gap unexplained.

## Bugs / factual errors
No factual errors found in spot-checks. No console errors. Minor: DN-2 label clipping at 1440; mobile "last destructive test" label placed mid-chart in Chart C.
