# Grading report, round 5 (independent review)

Method: fresh live captures of all 10 scenes at t=0.3/0.6/0.85 (1440), 5 scenes at 375, reduced-motion static fallback for all 10, live and static PNG stills, all 5 SVG exports rasterised, light/dark section shots, ledger/methodology/verification_log read (log in full at head plus status tables), SWF text spot checks. Console: no errors or warnings in any run; audit() returned []; no horizontal scroll at 375.

| Portion | Score | Note |
|---|---|---|
| Header/intro | 92 | Lede now paraphrases SWF p. xxiii, but the "such as jamming, spoofing, dazzling and cyber" list sits inside the SWF attribution although SWF gives no list (methodology.md itself warns against this). |
| Hero 3D overview | 93 | Labels clear, ISS label off the disc. |
| Legal band | 92 | Zoom inset works; 2022-26 marks still overprint (relies on inset/tap). |
| Chart A | 94 | Clean, annotated gap, log axis, area bubbles. |
| Chart C | 93 | Full labels, legend; mobile labels wrap into tall narrow columns (North Korea label collides with next row). |
| Chart B | 92 | Reconstruction band flagged; mobile legend chips overflow off-screen ("Electronic warfa..."). |
| Lag panel | 94 | Glyph pairs fixed. |
| Sources & methodology section | 93 | Full cites and licensing. |
| Scene overlay UI | 93 | Clean; framing now shows Earth in nearly all scenes. On mobile the legal pill is clipped by the control dock. |
| Static/reduced-motion fallback | 91 | All 10 render with honest note; Burnt Frost static Earth over-cropped and spills past panel; stillPNG (host) not available but exportStill works. |
| Mobile (375) | 91 | No h-scroll, scenes usable; Chart B chips clipped, Chart C label wrapping, Viasat caption overlaps KA-SAT. |
| Light mode | 93 | Tokens and contrast fine. |
| SVG exports | 94 | Title, as-of and source on every chart, no truncation. |
| PNG still export | 92 | 3000x2778 live / 3000x2550 static with credit; live still inherits cropped scene framing (DN-2 drops LEO/Xichang labels, Earth left-cropped); footer text small. |
| Starfish | 93 | Belt, labels, accurate. |
| Solwind | 91 | Earth fully visible now; target faint, F-15 label sits on land, debris small. |
| Fengyun | 94 | Ring and 3,532/2,351 accurate. |
| Burnt Frost | 92 | Falling pieces now depicted; still small. |
| DN-2 | 92 | Good "no intercept" framing; Earth and GEO ring still cut at left; labels crowd. |
| Shakti | 92 | Earth framed; debris trail runs to the Arctic, far from a 300 km intercept. |
| Cosmos 1408 | 94 | ISS crossing clear, 1,807/5 accurate. |
| GNSS | 93 | Receiver-not-satellite clear; two-line law pill tight. |
| Viasat | 91 | Careful attribution; caption crowds KA-SAT, thin animation. |
| Laser | 93 | Big improvement: readable beam, MSTI-3, Peresvet camera preset. |
| Data ledger (JSON) | 94 | 59 events, 19 legal, pins, confidence. |
| ledger.md | 92 | Complete, long. |
| methodology.md | 93 | Honest, but its recommended lede wording is not fully followed. |
| verification_log.md | 90 | Stale: still lists the old lede sentence ("only counterspace tools used in actual military operations") as open, though the page changed; 9 PARTIAL. |
| Code quality/architecture | 89 | scenes.js is a 90 KB monolith; audit() does not test overlap; no automated visual regression. |

| Cross-cutting | Score |
|---|---|
| Visual impact | 93 |
| Quality of graphics | 93 |
| Accuracy (SWF spot checks: 285/530, 3,532/2,351, 175/220 and 240, 130/300, 1,807/5, DN-2 30,000, Nov 2021, lag values, exec summary quote verified at SWF PDF p. 21) | 93 |
| User experience | 93 |
| Accessibility | 91 |
| Performance (338 KB page, deferred Earth texture) | 92 |
| Fun/engagement | 93 |
| Pedagogical value | 94 |
| Fidelity to companion purpose | 94 |

## Overall: 93 / 100

## Defects for portions below 93
1. Header: "such as jamming, spoofing, dazzling and cyber operations" inside "SWF finds" attribution (template lede). SWF p. xxiii says only "non-destructive capabilities ... against satellites".
2. verification_log.md lines 28 and 61 describe an old lede that no longer exists; documentation drift.
3. Mobile: Chart B legend chips clipped (m_sec chartB); Chart C labels wrap to 5-6 lines and North Korea label touches the next row; Viasat caption overlaps KA-SAT (ms_viasat); legal pill clipped under dock in ms_dn2.
4. Static fallback: Burnt Frost Earth overflows panel (r_burnt-frost).
5. Live still: inherits camera crop (DN-2 still lacks LEO/Xichang labels, Earth cut at left); footer credit tiny.
6. Scenes: Solwind target faint and F-15 label on land; Viasat animation thin; Shakti debris trail extends to the Arctic; DN-2 left crop.
7. Legal band: 2022-26 marks overprint on the main band.
8. Code: scenes.js monolith, no overlap test.

## Bugs / factual errors
No factual error in a plotted value found. Only wording risk is the lede list attribution above and the stale verification_log entry. Scratch scripts deleted; no other file modified.
