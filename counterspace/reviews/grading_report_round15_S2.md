# Round 15 grading, slice S2 (Burnt Frost, DN-2, Shakti, Cosmos 1408, GNSS jamming, Viasat)

Viewed: 24 contact sheets (each scene at t=0.2/0.4/0.6/0.85 on the default camera at 1440 and 375, and every preset at t=0.3/0.7 at both widths). Captions checked against the SWF text: Burnt Frost 175 pieces / ~20 months, DN-2 10,000 km / apogee >=30,000 km / "over the Indian Ocean", Viasat ~45 min, Cosmos 5 of 1,807. All match. Presets: BF, Shakti, Cosmos 4 each; DN-2 4; GNSS 3; Viasat 4 (Europe zoom default, Europe+KA-SAT, Ground network, Wide). The script only read the on-canvas status line; no fresh console-error check was run.

| Scene | R14 | R15 |
|---|---|---|
| Burnt Frost | 93 | 93 |
| DN-2 | 92 | 93 |
| Shakti | 92 | 93 |
| Cosmos 1408 | 95 | 95 |
| GNSS jamming | 91 | 92 |
| Viasat | 90 | 93 |
| Visual impact / graphics / fun (slice) | 92 | 93 |

## R14 defects: fixed?
- Viasat counts differ by viewport: FIXED. Status at 1440 vs 375 for the same t: 0/900 (t=0.3), 387 (0.4), 891 (0.6), 900 (0.7, 0.85) are identical. The 375 caption is only shortened ("387/900 offline").
- Viasat default camera whole-Earth: FIXED. Default is now "Europe (zoom)"; the terminal cluster fills ~40% of the frame at both widths, with a strong green-to-red wipe, ground-network arcs and KA-SAT beams.
- Viasat leaders crossing at top: MOSTLY FIXED on the default; on Ground network and Wide at 1440 the "Ground management network" leader still runs long past the globe.
- DN-2 t=0.2 crop and path label on the disc: FIXED. The whole GEO ring is framed at t=0.2 and the "DN-2 path" label sits off the disc on the default camera. The Earth is still only ~30% of the frame width.
- Shakti late debris faint, Microsat-R vanishes: FIXED. At 0.6/0.85 orange debris is larger and visible, and "Impact: Microsat-R (wreck)" persists.
- GNSS inset: NOT FIXED. It is still top-right and shows "GPS orbits", which is useful context, but it does not hit the jammer zone at 1440. At 375 it sits over empty sky only. Beams are now labelled "GPS signal (from a MEO satellite, off view)". The "Jammer effect zone" label no longer abuts the banner.
- BF SM-3 not visible at t=0.2: NOT FIXED. Nothing is drawn for SM-3 at 0.2 (only the faint arc). Intercept flash at 0.4 is still modest.
- Cosmos label crowding at t=0.6: PARTLY FIXED (Impact/Plesetsk are still tight on the default at 1440 and 375).

## Evidence and fixes to reach >=93 (or >=95)
**Burnt Frost 93**: clear story, clean labels, strong orange debris trail at 0.6/0.85, 4 distinct presets, Orbit preset at 375 reads. Remaining: SM-3 invisible at 0.2; the intercept flash is small. Fix: draw an SM-3 head plus exhaust at t<0.3 and a larger flash or shockwave ring at the hit.
**DN-2 93**: whole arc and GEO ring framed at all t on the default; Polar/Zoom are good. Remaining: the rocket head is a tiny dim dot, the Earth is small, and 375 Polar and Zoom crowd the Xichang, 10,000 km and path labels (Zoom's "DN-2 path" label sits on the disc). Fix: brighter, larger rocket head with a trail; scale the Earth up ~25% on the default; move the Zoom path label off the disc at 375.
**Shakti 93**: PDV Mk-II rise, large flash at 0.4, persistent wreck marker, debris visible to the end. Remaining: Orbit and Launch at t=0.3 stack Microsat-R/PDV/Abdul Kalam labels at 375 (leaders converge). Fix: stagger or merge the label stack for the overlapping Microsat-R and PDV in presets 2 and 3.
**Cosmos 1408 95**: best scene. The debris cloud, ISS crossing and Launch close-up (Nudol arc, ISS and debris) are all excellent. Fix for more: separate Impact/Plesetsk at t=0.6; at 375 the Orbit and Polar leaders to ISS and Cosmos 1408 run long and cross, so shorten them.
**GNSS 92**: 3D jammer, red dome, airliners, labelled GPS beam and a good Europe+GPS orbits preset. Remaining: the red dome is cropped by the top edge at 1440 on the default at t=0.2/0.4; the inset is still top-right at 1440; in preset 3 at t=0.7 the airliner/zone leaders cross. Fix: lower the default camera target so the whole dome is in frame; shrink the inset to ~120 px or move it bottom-left; reroute the preset-3 leaders.
**Viasat 93**: counts are consistent, the default is framed on Europe, the red wipe is dramatic, and KA-SAT stays unaffected on the Wide preset. Remaining: KA-SAT is off frame on the default camera (only the beams reach it); the inset repeats the Wide view. Fix: add a small "to KA-SAT (GEO)" beam label on the default; shorten the long "Ground management network" leader on presets 3 and 4.
**Visual impact 93**: consistent polish, strong colour language (red/green, orange debris), every scene has a readable default and 3-4 distinct presets, and the previous weak spots (small late action, Viasat framing) are fixed. To reach 95: brighter small objects (SM-3, DN-2 head), GNSS dome crop and inset, and label stacks at 375.
