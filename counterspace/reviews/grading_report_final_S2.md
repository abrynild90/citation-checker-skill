# Final grading, slice S2 (Burnt Frost, DN-2, Shakti, Cosmos 1408, GNSS jamming, Viasat)

Method: live WebGL (SwiftShader) via window.__cs.openScene / host().update(t). Each scene viewed at t=0.2/0.4/0.6/0.85 (default camera) and every preset at t=0.3 and 0.7, at 1440 and 375 (140 screenshots, 12 contact sheets). Presets: BF 4, DN-2 4, Shakti 4, Cosmos 4, GNSS 3, Viasat 4 (scene ids: burnt-frost, dn2, shakti, cosmos1408, gnss, viasat). Captions checked against swf_2026.txt: BF 175 pieces / ~20 months match (caption honestly notes text 240 km vs Table 5-1 220 km); Shakti ~300 km, PDV Mk-II, Microsat-R match; Cosmos ~470 km and "5 still in orbit" match; Viasat ~45 min, KA-SAT, AcidRain-era modem wipe match; DN-2 "apogee >=30,000 km", "not flown again", no-target framing consistent. Minor wording: Cosmos caption says "1,807 pieces" but SWF says "more than 1,800" (exact figure not in the SWF text); Shakti "130 pieces, none in orbit" comes from SWF line ~23852 (130 catalogued). Page/console errors: not captured separately (output truncated); no visible breakage.

| Scene | Score |
|---|---|
| Burnt Frost | 94 |
| DN-2 | 92 |
| Shakti | 94 |
| Cosmos 1408 | 95 |
| GNSS jamming | 93 |
| Viasat | 93 |
| Visual impact / graphics / fun (slice) | 94 |

## Evidence
**Burnt Frost 94**: SM-3 head plus trail visible from 0.2, flash at 0.4, shockwave ring at 0.6, orange debris streak and persistent Impact marker; counts 125/89/48 of 175 consistent. Polar preset is a striking top view. Weak: 375 Orbit/Polar t=0.3 stack USA-193 / SM-3 / USS Lake Erie labels closely; 1440 Orbit t=0.7 "Larger pieces falling" label sits on the limb.
**DN-2 92**: GEO ring, 10,000 km marker and arc fully framed at every t; Orbit/Polar presets have attractive layered shells. Defects: rocket head still a small dim red dot; Earth only ~25% of frame width on the default at both widths (375 even smaller); long leaders cross the GEO ring (10,000 km / GEO labels run into each other at 375 Polar and 1440 Zoom t=0.7); Zoom preset is cropped by the ring edges.
**Shakti 94**: PDV rise, big golden blast at 0.4, debris cloud over Asia to the end, persistent wreck marker; clear Launch/Orbit/Polar. Weak: PDV Mk-II / Microsat-R / Abdul Kalam labels in a tight column on Launch t=0.3 (1440 and 375) and Orbit t=0.3 (375).
**Cosmos 1408 95**: densest, most dramatic debris cloud, ISS crossing, Zoom close-up with Nudol arc, strong colour. Weak: 375 default t=0.6 and Orbit/Polar leaders to Impact/Plesetsk/ISS converge; 1440 Polar t=0.3 Cosmos 1408 and Nudol labels adjacent.
**GNSS 93**: full red dome in frame, red/green aircraft state, pulsing jammer, GPS beam, Europe+GPS orbits preset reads well. Weak: Airliner B sits at the bottom-left edge beside the inset and under the caption at t=0.2-0.4 (1440 default); "GPS signal" label floats away from the beam at t=0.85; Close-up preset differs little from default; 375 Europe+GPS labels crowd the globe.
**Viasat 93**: Europe zoom is vivid (green-to-red wipe, ground-network arcs, KA-SAT beams), Wide preset keeps KA-SAT unaffected, counts consistent (0/387/891/900 of 900). Weak: no KA-SAT label on the default (only in the inset); 375 inset covers top of the globe/"Terminals" label on presets 2-4; Wide 1440 has no ground-network label; 1440 default t=0.2 "Ground terminals" label floats off its cluster.
**Visual impact 94**: consistent red/green/orange language, glowing atmosphere, rich debris particles, every key actor visible by t=0.2. Held back by DN-2 scale and label crowding at 375.

## Fixes for scores under 93 or short of 95
- DN-2 (92): enlarge and brighten the rocket head (about 2x, short trail); tighten default camera so Earth is ~35% of frame; offset the 10,000 km and GEO leaders so they do not cross at 375 Polar / 1440 Zoom; pull Zoom camera back so rings are not cropped.
- Shakti: merge PDV/Microsat-R into one label before the hit, or fan leaders out at Launch/Orbit t=0.3.
- GNSS: move Airliner B/inset clear of caption at t=0.2-0.4; anchor "GPS signal" to the beam midpoint; make Close-up tighter on the dome.
- Viasat: add a "KA-SAT (GEO)" cue on the default or inset-link; shrink or move the 375 inset off the globe; add a ground-network label on 1440 Wide.
- Cosmos/BF: separate Impact/Plesetsk/ISS leaders at 375; space USA-193/SM-3/Lake Erie labels at 375 Orbit.
- Caption: change "1,807" to "more than 1,800" for SWF fidelity.
