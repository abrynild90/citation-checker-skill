# Counterspace Timeline: Independent Grading Report, Round 2

Method: fresh review. Headless Chromium (SwiftShader) at 1440 and 375 px in dark, light and reduced-motion modes. All 10 scenes were scrubbed at t=0.3 and 0.75. I tested hover cards, Tab order, the Chart B toggle, the data tables, the PNG still and the `audit()` hook. `audit()` returned [] everywhere, but it does not catch truncated ("…") labels or cluster crowding. No console errors and no horizontal scroll at either width. Spot-checks against SWF text: FY-1C 880 km / 3,532 / 2,351 (Table 5-1), Burnt Frost 175 pieces / "about 20 months" (p. 01-24), Solwind 530 km / 285, Shakti 300 km / 130, Cosmos 1408 1,807 / 5, Bold Orion, Starfish (DOE NV-209). All match the ledger. Screenshots are in `scratchpad/grade2/`.

## Score table

| Portion | Score | Justification | Most valuable improvement |
|---|---|---|---|
| Header / intro | 90 | Clear thesis, an added "How to read this page" paragraph, and an as-of line with the CSIS caveat. The Theme and Tour buttons are still tucked under the as-of line, and the title block leaves the right 40% of the header empty. | Move the controls to a top-right toolbar. |
| Hero 3D overview | 86 | The globe with LEO/MEO/GEO shells and an "illustrative" banner is handsome, and the caption now sits below the globe. The GEO/GPS/MEO(GPS)/ISS/LEO labels are still crowded in the top-right. "MEO (GPS)" and "GPS ~20,200 km" are redundant. | Merge the duplicate labels and offset LEO. |
| Legal band | 88 | Much improved. The year axis, lane-staggered labels, legend and abbreviation key are in, and it is now compact and sticky (121 px) on desktop. The 2022-25 cluster (77/41, US pledge, Veto, ICAO '25, RRB, Woomera) is still a dense pile of markers with leader lines. On mobile the band shows marks only, with no labels. | Add a zoomed inset for 2021-26, or tap-to-label on mobile. |
| Chart A | 90 | The log axis, area-proportional bubbles and the sourced annotations are strong. The top-band collision is fixed, and the size legend is intact. On mobile the "Last destructive test" label touches the DN-2 marker. The 1970-2000 gap is empty and unexplained. | Nudge the mobile label. |
| Chart C | 86 | Default focus is now 1995-2026 with an explanatory note, and the attribution fill styles are the right idea. Several labels still truncate with "…" (Syria/Mediterranean, Norway/Finland, North Korea "…South…", Baltic). The label text crosses the dotted 2021 line. On mobile most labels truncate ("Iran: Telstar 12 Persian-lang…"). | Wrap labels to two lines, or use short names with the full text in the hover card. |
| Chart B | 88 | The zero baseline, the "RECONSTRUCTED (NOT SWF-ASSESSED)" label, the hatching and the "pairs" explanation are honest. The toggle works. The y-axis label changes to "States" in the kinetic/non-kinetic mode. The annotation text overlays the plot area. On mobile the annotation is abbreviated to "EW: 12 states in 2020s". | Reserve the top plot band for annotations. |
| Lag panel | 88 | The shape encodes legal force (treaty, resolution, pledge, open ring), and the durations are correct. The "Cosmos 1408 → moratorium" and "Jamming → ITU RRB" markers are tiny and overprint their text. Bar labels sit close to the previous row's duration text. | Increase the row pitch and marker size. |
| Sources & methodology section | 91 | Editions, coding rules, licensing and 22 cites with treaty cites in Bluebook form. It is well organised. The list items in the source list are only short link labels for SWF and DOE. | Add full Bluebook-style cites for SWF, ICAO and ITU RRB. |
| Scene overlay UI | 84 | A proper dialog with Prev/Next/Close, focus return, camera presets, related-law chips and a source line. One camera preset is named "Close", which duplicates the dialog's "Close" (a bug in `scenes.js` line 121, 167 and 353). The scrubber does not follow `host.update()` (it does follow live playback). On mobile the header wraps to three lines and the buttons stack. | Rename the "Close" preset to "Zoom", and show date/time on the scrubber. |
| Static / reduced-motion fallback | 80 | A vector diagram with coastlines, and no texture is loaded. It is a flat green disc. The LEO / GPS / GEO labels overlap (r_s1_0.png), and the Play control is still offered. | Declutter the labels and hide Play in static mode. |
| Mobile (375 px) | 84 | No h-scroll. The legal band is no longer sticky and no longer covers the headings. Chart labels are short forms. Chart C labels are truncated, Chart B's table is wide and scrolls inside its own container, and the scene view is cramped (DN-2 labels stack). | Wrap Chart C labels, and simplify the DN-2 labels on mobile. |
| Light mode | 90 | Correct token swap, good contrast, no clashes. The translucent sticky band lets scrolled text ghost through behind it. | Make the sticky band background opaque. |
| SVG exports | 82 | Five SVGs, exported in light mode, with the same truncated Chart C labels. | Export with full labels and an embedded title, source and as-of text. |
| PNG still export | 84 | 3000 px, with title, source and credit baked in. The "Illustrative..." banner runs over the globe edge and gets cut ("radial scale" over the limb). The caption lacks a separator ("p. 01-35 Earth imagery"). | Fix the banner and caption spacing. |
| Scene: Starfish | 86 | The belt particles and the detonation read well. The labels are decluttered (a "Thor launch" leader and "Satellite in belt"). The Detonation and Johnston Island labels stack closely. | Spread the Detonation, Thor and Johnston labels. |
| Scene: Solwind | 82 | The F-15 and ASM-135 labels no longer overprint, but the climb is only a short white stub on a large empty Earth. The satellite is barely visible. | Show the missile arc and the target satellite. |
| Scene: Fengyun-1C | 92 | The dense polar debris ring at 880 km reads well. The panel gives the 3,532 / 2,351 pin and a UNGA 77/41 chip. There is no readout of what is still in orbit. | Add a "still in orbit" counter. |
| Scene: Burnt Frost | 84 | The decay wording is now correct ("about 20 months"), and the 240 vs 220 km conflict is disclosed. The scene is sparse, with a small launch mark and a single ring. | Draw the interceptor arc and the falling target. |
| Scene: DN-2 | 82 | It is now legible, with a bright trajectory, a GEO ring and a well-worded dispute. The "Apogee ≥30,000 km" label sits on the "10,000 km" line and the GEO ring label. On mobile the labels crowd. | Stagger the three claim labels. |
| Scene: Shakti | 84 | Accurate (300 km, 130, 0), the 45-day claim is attributed, and the chip is linked to UNGA 77/41. The launch is a small pink stub. | Show the intercept flash. |
| Scene: Cosmos 1408 | 89 | The debris plume and the ISS narrative are the most legally salient. The ISS does not appear in the scene. | Animate the ISS crossing the shell. |
| Scene: GNSS | 88 | The receiver-not-satellite point is clear, and the labels are now separated. The "Airliner A / Jammer zone" labels sit very close. The related-law chip says "breaches Chicago Convention" (the label wording is stronger than an ICAO finding). | Change the chip to "ICAO: interference findings vs Chicago Convention". |
| Scene: Viasat | 88 | The text says "within hours" (matches SWF) and the attribution is careful. The ground/satellite split is clear. Few visual events beyond static beams. | Animate the modem outage. |
| Scene: Laser | 82 | White Sands is placed correctly and MSTI-3 is labelled a US test target. The beam is visible only near t=0.5 and the target label sits far from the target at t=0.75. Peresvet is not depicted. | Keep the beam and label attached to the target, and add a Peresvet variant. |
| Data ledger (JSON) | 90 | 59 events plus 19 legal items, pinned to the printed and PDF pages, with confidence, attribution and conflicts. The spot-checks all matched. There is no top-level schema or version field. | Add `schema_version` and a JSON Schema. |
| ledger.md | 85 | Complete, with a field legend and a conflicts section. It is long. | Add a table of contents. |
| methodology.md | 82 | It states the sources, coding rules, builder decisions and conflicts. The builder-decision numbering skips 7. It says the verification covers "40 kinetic rows" while the data has 44. | Fix the numbering and counts. |
| verification_log.md | 84 | It is now honest (status vocabulary, UNCHECKED and PARTIAL rows, closed items). It says "40 kinetic rows" though the ledger has 44, and the summary table says 40. Some sub-details stay UNCHECKED. | Reconcile the counts (44), and re-check the UNCHECKED legal sub-details. |
| Code quality / architecture | 82 | Template, `app.js`, `scenes.js`, a data build script and a QA script are separate, and the test hooks are useful. The `audit()` helper misses truncation. `app.js` is large. Duplicate camera names are a copy-paste bug. | Add truncation and duplicate-label checks to `qa.mjs`. |

### Cross-cutting

| Dimension | Score | Note |
|---|---|---|
| Visual impact | 88 | The scenes and dark palette are striking. |
| Quality of graphics | 82 | Far better than round 1. Remaining Chart C truncation, the 2022-25 legal cluster and the sparse launch scenes hold it back. |
| Accuracy | 91 | 10+ spot-checks matched. The legal cautions are handled (soft-law asterisks, veto scope, "not an intercept"). One chip label ("breaches") is too strong. The count mismatches are minor. |
| User experience | 84 | Good flow. The remaining issues are the duplicate "Close" preset, the mobile scene cramping and the Play control offered in static mode. |
| Accessibility | 86 | Skip link, focusable marks with aria-labels, dialog focus return, data tables and reduced motion. Tab order still runs the legal marks before Chart A. |
| Performance | 82 | 277 KB page, texture deferred. First load took several seconds under SwiftShader. |
| Fun / engagement | 86 | The tour, scrubbing and camera presets are engaging. |
| Pedagogical value | 89 | The attribution encoding, the legal force in the lag panel and the related-law chips teach the right distinctions. |
| Fidelity to textbook-companion purpose | 90 | Sourcing-first, with as-of dates, exports and a licensing note. |

## Overall: 86 / 100

## Defects that keep each below 93 (for fixing)

1. **Chart C** (`#chartC`): labels truncated with "…" at 1440 and 375 (Syria, Norway/Finland, North Korea, Baltic, Iran/Telstar); labels cross the dotted 2021 line. SVG export inherits this. Fix: wrap labels or use short names.
2. **Legal band**: 2022-25 cluster overprints (d/lb_d_top.png); mobile shows marks only with no labels; the translucent sticky band lets text ghost through (v_legal.png). Fix: inset or tap-to-label; opaque background.
3. **Scene UI**: camera preset "Close" duplicates the dialog Close (`scenes.js` lines 121, 167, 353); the mobile header wraps to 3 lines; the scrubber does not follow the hook (live playback is fine).
4. **PNG still** (still.png): the banner runs over the globe limb; the caption lacks a separator between the source and the imagery credit.
5. **Static fallback** (r_s1_0.png): LEO/GPS/GEO labels overlap; a flat green disc; Play is offered.
6. **Hero**: duplicate GPS labels and a crowded top-right.
7. **Sparse scenes** (Solwind, Burnt Frost, Shakti): the launch is a tiny stub with no arc or target. **Laser**: the beam only shows near t=0.5, the label is detached at 0.75, and Peresvet is not shown. **DN-2**: three claim labels overlap. **Cosmos 1408**: no ISS.
8. **GNSS chip wording**: "breaches Chicago Convention" (`data/legal.json` line 218) overstates an ICAO finding.
9. **Docs**: verification_log.md and methodology.md say 40 kinetic rows, but the ledger has 44; methodology builder decisions skip #7; JSON has no schema version.
10. **Chart B**: the y-axis label changes to "States" in kinetic/non-kinetic mode without a note; annotation overlays the plot; the mobile annotation is abbreviated.
11. **Lag panel**: small markers and tight row pitch (Cosmos 1408, RRB rows).
12. **Sources list**: SWF and DOE entries are label-only links, not full cites.

## Bugs / factual errors
- No factual errors were found in the spot-checked values.
- The duplicate camera preset name is a real bug.
- The count mismatch (40 vs 44) is a documentation error.
- The "breaches" chip label is a legal-wording risk.
