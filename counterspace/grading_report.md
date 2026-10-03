# Counterspace Interactive Timeline: Independent Grading Report

Reviewer: independent critical review (Sept. 28, 2026). Method: I read the data, docs and code; ran the built page in headless Chromium (SwiftShader WebGL) at 1440 px and 375 px, in dark, light and reduced-motion modes; scrubbed all 10 scenes to t=0.55 and t=0.9; tested hover cards, Tab/Enter/Esc, the Chart B toggle, the data tables and the PNG still export; and spot-checked ledger values against the SWF 2026 text. Screenshots are in `scratchpad/grade/`.

## Score table

| Portion | Score | Justification | Most valuable improvement |
|---|---|---|---|
| Header / intro | 84 | The thesis is clear and legally framed ("the law that trailed them"). The as-of line states the edition, the debris date and the missing CSIS 2026 edition, which a scholar needs. The theme and tour buttons sit awkwardly on the as-of line. | Add a one-line "how to read this page" pointer (charts A/C/B, then the lag). |
| Hero 3D overview | 80 | Handsome Blue Marble globe with LEO/MEO/GEO shells and an "illustrative" banner. The explanatory text overlaps the globe, and labels crowd each other (GEO/MEO/GPS). It is decorative more than informative. | Declutter the shell labels and move the caption off the globe. |
| Legal band | 58 | The content is excellent: soft-law asterisks, a correct note on the veto, LTBT "followed" Starfish. But the 2017–2025 cluster is unreadable ("75/36Woomera*", "MILAMOS*ICAO '25", "US moratorium" overprint each other), and the band has no year axis. It is also sticky and covers about 240 px of the 812 px mobile viewport, hiding chart headings. | Stagger or lane the labels in the 2017–2025 cluster (or add a zoomed inset), and make the band non-sticky on phones. |
| Chart A (kinetic altitude) | 78 | Strong encoding: a log altitude axis, bubble area equal to cataloged fragments, hollow marks for apogee, a separate strip for tests with no reported altitude, and well-chosen annotations (peak is still FY-1C; DN-2 is not an intercept). At the top, the "Last destructive DA-ASAT test" label collides with the "GEO 35,786 km"/"MEO" labels at both widths. The bubble-size legend is clipped at the left. | Fix the collisions in the top band and the size legend. |
| Chart C (non-kinetic) | 60 | Separating attribution strength by fill style (official, OSINT, alleged) is exactly the right idea for law students. In practice most labels are truncated or run off the right edge ("Iran: Telstar 12 Persian-language br", "Russia: Sw", "Israel: GNS"), and labels run into bars. 1960–1995 is empty space, so the x domain squeezes all the data into the right third. | Start the axis around 1995 (or use a break), and put labels to the left of the bars or wrap them. |
| Chart B (capability diffusion) | 74 | It is honest: the zero baseline and the "RECONSTRUCTED (NOT SWF-ASSESSED)" label pre-2020s are exemplary, and the hatching separates demonstrated from latent capability. A stacked step chart of "state-capability pairs" is an abstract unit for law readers, and the "SWF 2026 (13 STAT…" label is clipped. The kinetic/non-kinetic toggle works. | Add a per-state matrix (the table) as the default mobile view, and explain the "pairs" unit in one line. |
| Lag panel | 76 | This is the most pedagogically original piece: it gives a quantified lag between capability and legal response, with an open ring for "no binding rule". The pairs are defensible and the durations are correct (Bold Orion 1959 to OST 1967 = 7.3 yr; Cosmos 1408 to the US moratorium = 5 mo). "11.6 yr" is clipped at the right edge and "no binding rule" is overprinted on the markers. Pairing a UNGA call (non-binding) as a "response" beside treaties needs a binding/non-binding marker on the endpoint. | Encode the endpoint shape by legal force (treaty, resolution, unilateral pledge, soft law). |
| Sources & methodology section | 86 | It has 20 formatted citations, coding rules, licensing and an as-of note. This is unusually rigorous for a companion site. Some citations are Bluebook-ish but inconsistent (for example, the ICAO item is cited "as reported in SWF"). | Give Bluebook-conformant cites for the ICAO and ITU RRB documents directly (primary docs). |
| Scene overlay UI | 80 | A proper `role=dialog` with aria-modal, Prev/Next, Close with focus styling, camera presets, a related-law chip and a sourced side panel. Esc closes it and returns focus to the originating mark (verified). When playback is driven by the host, the scrubber stayed at 0 (possibly a test-hook artefact, but check it). | Keep the scrubber in sync with the playhead, and show the current t/date. |
| Scene: Starfish | 72 | A radiation belt of particles around the globe reads well, and the text is careful ("damaged several satellites"). Labels collide: "LEO ≤2,000 km" sits under "Satellite in belt", "Artificial radiation b…" is truncated, and "Detonation ~400 km" is garbled by the marker. | Fix the label layout. |
| Scene: Solwind | 70 | The F-15, the ASM-135 launch and the debris stream are plausible. The text notes all 285 tracked fragments have decayed. The "F-15" and "ASM-135" labels overprint each other. | Offset the launch labels. |
| Scene: Fengyun-1C | 88 | This is the showpiece. A dense polar debris ring at 880 km, with the source pin (3,532/2,351) in the panel, is persuasive and accurate to Table 5-1. | Add a counter showing the debris that remains today (2,351) against the cataloged total. |
| Scene: Burnt Frost | 66 | Clean and correctly sourced at 220 km (Table 5-1). But the panel says fragments "re-entered within weeks", while SWF's own text says the 175 pieces "took about 20 months to de-orbit entirely" (p. 01-24 area). The SWF prose value of 240 km also goes undisclosed, although other conflicts are disclosed. | Correct the decay wording and note the 220 vs 240 km conflict. |
| Scene: DN-2 | 62 | The text is exemplary on the dispute (10,000 km claimed vs ≥30,000 km analysis, "not an intercept"). Visually, the trajectory is a faint thin line, and the "~30,000 km apogee" label sits near Earth, not at the apogee. It is the least legible scene. | Draw a bright trajectory, and anchor the label at the apogee. |
| Scene: Shakti | 74 | Accurate: 300 km, 130 cataloged, 0 in orbit, and the 45-day claim is attributed to Indian officials. The small debris puff is honest. The related-law chip points to the 2022 US moratorium, which post-dates the test and is not India's; UNGA 77/41 would be the better link. | Relink to 77/41, or show both. |
| Scene: Cosmos 1408 | 84 | The ISS orbit and shelter narrative is the most legally salient scene, with correct numbers (1,807/5; SWF prose ">1,800"). The debris plume is clear. | Animate the ISS crossing the debris shell to make the hazard explicit. |
| Scene: GNSS | 70 | It makes the key legal-technical point well: receivers are jammed, satellites are unaffected. "Jammer effect zone" and "Airliner · GNSS lost" overprint each other, and the satellite link lines are busy. | Fix the label collision and thin the link lines. |
| Scene: Viasat | 78 | It shows clearly that the ground segment was hit and the satellite was unaffected, and the attribution is carefully stated (US/UK/EU, May 2022, per SWF p. 15-06). "About an hour before the invasion" is not SWF's wording ("within hours"). | Match the SWF wording, or cite the Viasat incident report for the timing. |
| Scene: Laser | 64 | It is one generic scene for MIRACL and Peresvet. The ground site is drawn in the Pacific Northwest, whereas MIRACL was at White Sands, NM. MSTI-3 was a US test target, which the "imaging satellite" framing blurs. | Put the site at White Sands, and state that MIRACL illuminated a US satellite. |
| Static / reduced-motion fallback | 62 | It works: a static 2D diagram with a clear "Static diagram" note, and the heavy texture is not loaded. But it is a flat green disc with overlapping labels (SC-19/Xichang), and the page still offers "Play". | Use the vector coastlines in the static diagram, and fix the label overlap. |
| Mobile (375 px) | 55 | There is no horizontal scroll, and the charts reflow with shortened labels. However, the sticky legal band covers about 30% of the viewport and overlays section headings (seen over the Chart A and C titles). Chart C labels are clipped at the right edge. Load to Earth-ready took about 15 s under SwiftShader. | Un-stick the band on narrow screens. |
| Light mode | 80 | Proper token swap, with good contrast on the charts. It shares the label problems of dark mode. | None beyond the chart label fixes. |
| SVG exports | 75 | Five SVGs are present (A, B, C, L, legal), exported in light mode. They inherit the on-screen label collisions and truncation. | Export at a wider layout with full labels, and embed title/source text. |
| PNG still export | 90 | 3000 px, banner, title, source cite and NASA credit are all baked in. It is publication-ready for a slide or textbook figure. | Add the as-of date to the caption. |
| Data ledger (JSON) | 85 | 55 events with pins to printed and PDF pages, confidence, attribution levels, and conflicts recorded in notes. All 8 spot-checks matched (below). The one gap is the Burnt Frost 240 km prose conflict. | Add a structured `conflicts` field instead of free-text notes. |
| ledger.md | 78 | Complete and readable, but the SWF URL is repeated on every row, which bloats it. | Use a reference-style link. |
| methodology.md | 85 | Clear coding rules, disclosed builder decisions, known uncertainties and rebuild steps. | Add the Burnt Frost conflict and the Shakti linking rationale. |
| verification_log.md | 60 | Useful, and the two URL discrepancies it found have since been fixed in the data. But many rows are marked "VERIFIED" on grounds like "consistent with SWF's well-known…", "well-established date" or "not independently re-extracted". That is not verification. It predates the later data edits (timestamp 03:41 vs page 11:52) and still lists the fixed URLs as open discrepancies. | Re-run it: mark weak rows "PLAUSIBLE/UNCHECKED" and update the status of fixed items. |
| Code quality / architecture | 76 | Clean split into template, app.js (585 lines) and scenes.js (730 lines), with a build step, a QA script (console errors, h-scroll, WebGL disposal) and test hooks. Tables are built with `innerHTML` plus `esc()`; that is safe for this static data. | Add a label-collision pass (a shared helper) used by all charts. |

### Cross-cutting

| Dimension | Score | Note |
|---|---|---|
| Visual impact | 84 | The globe scenes and dark palette are striking. |
| Quality of graphics | 66 | Pervasive label collisions and truncation are the main drag. |
| Accuracy | 86 | Spot-checks are clean, and the legal cautions are all handled correctly. There are two minor wording/disclosure slips (Burnt Frost decay, the undisclosed 240 km). |
| User experience | 72 | Good flow and tour. The sticky band and illegible clusters hurt. |
| Accessibility | 74 | Skip link, focusable marks with rich aria-labels, a dialog with focus return, data tables and reduced-motion support. Tab order runs through 19 legal marks before Chart A, not in chronological order. |
| Performance | 70 | 228 KB page. The 1.4 MB texture is deferred. Rendering ran at 60 fps in the scene. First load took 5–6 s on desktop and about 15 s on mobile-emulated SwiftShader. |
| Fun / engagement | 80 | The scene tour and scrubbing are genuinely engaging. |
| Pedagogical value (law students) | 82 | The attribution-strength encoding, the soft-law marking, the lag panel and the related-law chips teach the right distinctions. |
| Fidelity to textbook-companion purpose | 84 | Sourcing-first, with as-of dates and exportable figures. |

## Overall score: **76 / 100**

## Top 5 improvements (ranked)
1. **Label collision/truncation pass across the legal band, Charts A, C and lag, and the scenes** (Starfish, Solwind, GNSS, DN-2). A shared greedy label-placement helper, plus wider right margins or narrower x-domains. *Effort: 1–1.5 days.*
2. **Make the legal band non-sticky (or collapsible) below about 700 px, and add a year axis to it.** *Effort: 2–3 h.*
3. **Re-domain Chart C to about 1995–2026** (with a note), and move labels left or wrap them. *Effort: 3–4 h.*
4. **Fix the content slips:** Burnt Frost decay wording ("about 20 months", SWF); disclose the 220 vs 240 km conflict; relink Shakti to UNGA 77/41; move the laser site to White Sands; match the Viasat timing to the source. *Effort: 1–2 h.*
5. **Redo verification_log.md honestly:** downgrade inference-based "VERIFIED" rows, and close out the two already-fixed URL items. *Effort: 3–4 h.*

## Bugs and factual errors (with evidence)
- **Sticky legal band covers content on mobile.** In the 375 px screenshots (`m-chartA.png`, `m-chartC.png`), the "LAW & POLICY" band overlays the "A · Kinetic tests…" and "C · Non-kinetic operations" headings.
- **Legal band labels overprint.** `el-legalSvg.png` shows "75/36Woomera*", "MILAMOS*ICAO '25" and "US moratorium" drawn over the markers.
- **Chart C labels truncated or clipped at the right edge.** `el-chartC.png`: "Russia: Starlink" is cut at the edge, along with "Russia: Sw", "Israel: GNS" and "Russia: GPS receivers in n".
- **Chart A top-band collision.** The "Last destructive DA-ASAT test (as of SWF 9th ed., Apr. 2026)" label overlaps "GEO 35,786 km" and "MEO".
- **Lag panel.** "11.6 yr" is clipped, and "no binding rule" is overprinted on its markers (`el-lag.png`).
- **Chart B.** The "SWF 2026 (13 STAT…" label is clipped.
- **Burnt Frost scene text vs source.** The scene says fragments "re-entered within weeks". SWF says "175 pieces of trackable debris which took about 20 months to de-orbit entirely", and gives 240 km in prose against 220 km in Table 5-1 (swf_2026.txt around line 7732 vs the Table 5-1 row "USA 193 220 km 175"). The conflict is not disclosed, although the ledger note discusses a different conflict (2,700 km).
- **Shakti related-law chip.** It points to the US moratorium (Apr. 2022, a US pledge), which is weak as the legal hook for a 2019 Indian test.
- **Laser scene geography.** The ground site is drawn on the North American Pacific coast; MIRACL is at White Sands, NM.
- **Scene label overlaps.** Starfish ("Artificial radiation b…" truncated; LEO label under "Satellite in belt"), Solwind (F-15/ASM-135), GNSS ("Jammer effect zone" over "Airliner · GNSS lost"), and the reduced-motion static diagram (SC-19/Xichang).
- **verification_log.md is stale.** It still lists the Starfish and Iraq URLs as discrepancies, but events.json now carries the corrected URLs.
- **Minor (to confirm).** The scene scrubber did not move when `host().update(t)` was called with playing=false.

## Accuracy spot-checks (SWF 2026 text)
| Value | Ledger | SWF | Result |
|---|---|---|---|
| FY-1C altitude/cataloged/in orbit | 880 / 3,532 / 2,351 | Table 5-1: 880 km, 3532, 2351 | Match |
| Cosmos 1408 | 470 / 1,807 / 5 | Table 5-1 row; prose ">1,800 … 5 still in orbit" (Feb 2026) | Match |
| Shakti | 300 / 130 / 0 | Table 5-1: 300 km, 130, 0 | Match |
| Burnt Frost | 220 / 175 | Table 5-1: 220 km, 175; prose 240 km | Match (the 240 km conflict is undisclosed) |
| Solwind | 530 / 285 (555 disclosed) | Table 5-1: 530 km, 285; prose 555 km | Match, conflict disclosed |
| US moratorium count | 38 states | "38 countries total have made that commitment" | Match |
| Viasat attribution | US/UK/EU, GRU, May 2022 | p. 15-06: same | Match, not overstated |
| ICAO GNSS finding | Oct 2025 | "In October 2025, the ICAO passed a resolution…" | Match |
| Bold Orion | 1959-10-13, 200 km | Table 1-4 | Match (per log and chart) |

Legal cautions: LTBT is labeled as having "followed" Starfish, with fallout and the Cuban Missile Crisis also named as drivers (correct, not causal). The 2024 veto is described as concerning nuclear weapons in orbit, "did not concern DA-ASAT testing", with the 13-1-1 vote and China abstaining (correct). Tallinn 2.0, MILAMOS and Woomera are all tagged "(soft law)" with asterisks. Attribution levels in Chart C are capped at the source's wording: Iran/Eutelsat is explicitly "not a finding of state responsibility", Starlink jamming is "alleged", and the Russian GNSS campaigns are coded as OSINT. UNGA 77/41 is correctly given as 155-9-9. There are no overstatements.
