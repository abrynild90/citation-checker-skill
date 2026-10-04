# Grading report, round 4 (independent, fresh inspection)

Evidence: screenshots in /tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/grade4/ (d_*, l_*, m_* sections; s_<id>_<t>.png; r_<id>.png reduced motion; still_dn2.png; ms_*.png).
Console: no errors/warnings in desktop, mobile, scenes or reduced-motion runs. No horizontal scroll at 1440 or 375. audit() returned [].

| Portion | Score | Note / best improvement |
|---|---|---|
| Header/intro | 92 | Clear title, glance panel, as-of and CSIS caveat. "Only counterspace tools used in actual military operations" is an unhedged absolute; hedge or cite. |
| Hero 3D overview | 92 | Labels no longer collide; ISS label still sits on the globe. Nudge ISS label off the disc. |
| Legal band | 91 | Sticky band works; 2022-26 cluster needs the inset. Add tap-to-label on mobile. |
| Chart A | 94 | Log axis, area bubbles, gap now annotated, callouts clean. Nothing major. |
| Chart C | 93 | Full labels, guide lines, legend clear; on mobile the plot is cropped/scaled small. |
| Chart B | 93 | Annotation moved out of plot, reconstruction band flagged; mobile legend chips wrap tall. |
| Lag panel | 92 | Glyphs for 5 and 4 months still stack tightly (small offset). Separate the glyph pairs. |
| Sources & methodology | 94 | 22 full cites, licensing, how-to-cite. Add anchors from cards to numbered sources. |
| Scene overlay UI | 92 | Clean header, scrubber time, presets. Camera crops Earth in DN-2/Solwind/Shakti/Laser at 0.85. |
| Static/reduced-motion fallback | 90 | Works, honest note, labels legible; DN-2 labels sit on rings and the Burnt Frost caption shows "172 of 175 simulated pieces aloft" on a static frame. stillPNG is null in this mode (host absent), so Export button path untestable via hook. |
| Mobile (375) | 91 | No h-scroll, DN-2 labels shortened and legible; Chart C/B plots are small. |
| Light mode | 93 | Tokens right, contrast fine in all sections inspected. |
| SVG exports | 92 | Title/source/as-of embedded, no truncation. Visible as-of line not on every chart. |
| PNG still export | 93 | 3000x2778 with banner, title and cite captions; Earth credit included. Cropped scene framing carries over. |
| Starfish | 92 | Belt, field lines, Thor/Johnston labels clear. |
| Solwind | 91 | Arc, debris, decay tally; Earth cropped, target faint. |
| Fengyun | 94 | Dense ring, accurate 3,532/2,351. |
| Burnt Frost | 91 | Accurate 240 vs 220 km note; falling target not depicted. |
| DN-2 | 91 | Well framed as no intercept; labels stack near GEO ring, Earth cut off at left in live view. |
| Shakti | 90 | Accurate; Earth heavily cropped, intercept flash modest. |
| Cosmos 1408 | 94 | ISS crossing, 1,807/5 accurate. |
| GNSS | 93 | Receiver-not-satellite unmistakable. |
| Viasat | 91 | Careful attribution; limited animation beyond red modems. |
| Laser | 89 | Small beam/target, odd dark glow patch on the left of Earth, Peresvet only in text. |
| Data ledger (JSON) | 94 | 59 events, 19 legal, pins, confidence, schema. |
| ledger.md | 92 | Now has a TOC and counts; long. |
| methodology.md | 93 | Reconciled and honest. |
| verification_log.md | 92 | Honest statuses; a couple of PARTIAL items remain. |
| Code quality/architecture | 89 | Split charts/, build scripts; scenes.js is an 83 KB monolith; audit() does not test label overlap. |

| Cross-cutting | Score |
|---|---|
| Visual impact | 93 |
| Quality of graphics | 92 |
| Accuracy (spot-checked vs SWF text: Solwind 285/530, FY-1C 3,532/2,351/880, Burnt Frost 175/220, Shakti 130/300, Cosmos 1408 1,807/5/470, DN-2 30,000, Nov 2021 baseline, Table 5-1 pins, lag values; legal cautions) | 94 |
| User experience | 92 |
| Accessibility | 90 |
| Performance (323 KB page, deferred Earth texture, no eager work) | 91 |
| Fun/engagement | 92 |
| Pedagogical value | 94 |
| Fidelity to textbook-companion purpose | 94 |

## Overall: 92 / 100

## Defects for portions below 93
1. Scene camera framing crops Earth at left: s_dn2_0.85.png, s_solwind_0.85.png, s_shakti_0.6.png, s_laser_0.6.png (src/scenes.js camera presets).
2. Laser scene: small beam, dark glow blob left of Earth, Peresvet not depicted (s_laser_0.6.png).
3. Static fallback: DN-2 labels overlap rings (r_dn2.png); Burnt Frost static caption cites "172 of 175 simulated pieces aloft" (r_burnt-frost.png); host().stillPNG returns null in reduced motion.
4. Lag panel: overlapping glyph pairs for 5 months and 4 months (d_sec_lag.png).
5. Mobile: Chart B/C small plots, legal band lacks labels (m_sec_chartB.png).
6. Hero: ISS label overlaps globe (d_sec_s645.png); intro absolute claim "only counterspace tools used in actual military operations" (src/template.html header).
7. Code: scenes.js monolith; audit() does not detect overlaps; no automated visual check.

## Bugs / factual errors
No factual errors found in 10+ spot checks. No console errors. Only wording risk: the intro's "only tools used in actual military operations" absolute. Scratch scripts removed; no other file modified.
