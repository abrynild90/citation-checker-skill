# Grading, slice S2 (type/Newsreader+Plex pass): Burnt Frost, DN-2, Shakti, Cosmos 1408, GNSS jamming, Viasat

Method: live WebGL (SwiftShader), window.__cs.openScene / host().pickCam/update(t). Per scene: default camera at t=0.2/0.4/0.6/0.85 plus every preset at t=0.3/0.7, at 1440 and 375 (141 screenshots, 12 contact sheets viewed). Presets: BF 4, DN-2 4, Shakti 4, Cosmos 4, GNSS 3, Viasat 4.
**Page/console errors: 0** (pageerror + console.error, both widths, all scenes).
Captions vs swf_2026.txt: BF "~20 months to de-orbit" (l.7733) and 175 pieces match; DN-2 "apogee >=30,000 km", "over the Indian Ocean", no-target framing match (l.20914-17); Shakti ~300 km, 130 cataloged, none in orbit match; Cosmos ~470 km and "5 of more than 1,800 still in orbit (Feb. 2026)" match (l.15113; the earlier "1,807" is gone); Viasat ~45 min modem overwrite matches (l.34040). No caption mismatches found. Fonts render as Newsreader/Plex with no clipping or wrapping at either width (banner and status lines single-line at 375).

| Scene | Score |
|---|---|
| Burnt Frost | 95 |
| DN-2 | 94 |
| Shakti | 94 |
| Cosmos 1408 | 95 |
| GNSS jamming | 92 |
| Viasat | 93 |
| Visual impact / graphics / fun (slice) | 95 |

## Evidence
**Burnt Frost 95**: SM-3 plus trail and glowing USA-193 from t=0.2, shockwave ring at 0.4, orange debris streak to the end, persistent Impact marker; counts 125/89/48 of 175 consistent; Polar preset is a striking top view; 375 uses short labels ("Pieces falling (illustr.)"). Weak: 1440 Orbit t=0.7 "Larger pieces falling" label sits on the limb; 375 Polar t=0.3 USA-193/SM-3/Lake Erie labels stack tightly at the globe bottom.
**DN-2 94**: Earth now fills more of the frame than before; rocket head is a large pink glow, clearly visible at all t; GEO ring, 10,000 km and apogee markers fully framed on default; Orbit/Polar layered shells attractive. Weak: Profile t=0.3 has no apogee/DN-2 label and the 10,000 km/GEO leaders run near each other; Zoom t=0.7 rings tight against frame edge with the Apogee leader crossing the GEO label at the 1440 Zoom; 375 Orbit t=0.3 "Xichang" label sits on the caption.
**Shakti 94**: PDV rise, golden blast at 0.4, debris cloud over Asia, persistent wreck marker; 1440 Launch clean. Weak: 375 Launch/Orbit t=0.3 PDV Mk-II / Microsat-R / Abdul Kalam labels in a tight stack with converging leaders; 1440 Orbit t=0.3 same three leaders fan from one point.
**Cosmos 1408 95**: densest, most dramatic debris cloud, ISS crossing, Zoom close-up with Nudol arc and ISS silhouette, strong colour. Weak: 375 Orbit/Polar t=0.3 leaders to Cosmos 1408/Nudol/Plesetsk/ISS converge; 1440 Orbit t=0.3 Nudol/Cosmos 1408 labels adjacent.
**GNSS 92**: red dome, red/green aircraft states, pulsing jammer, GPS beam, Europe+GPS orbit preset reads well. Weak: at 1440 default t=0.2-0.4 Airliner B sits on the bottom edge under/against the caption and beside the inset; the "GPS signal" label floats well away from the beam at t=0.6/0.85 (1440); 375 default t=0.2 Airliner B label also touches caption zone; Close-up differs little from default; the inset eats the bottom-left corner.
**Viasat 93**: vivid green-to-red wipe, ground-network arcs, KA-SAT beams; Wide preset keeps KA-SAT "unaffected" visible; counts 0/387/891/900 consistent. Weak: no KA-SAT label on the default or Ground-network preset beyond the inset (inset KA-SAT label is tiny); Europe+KA-SAT t=0.3 and Wide at 1440 have no ground-network label; 375 inset overlaps the globe top on presets 2-4; the 1440 Europe zoom ground label sits on the glow at t=0.4.
**Visual impact 95**: consistent red/green/orange language, glowing atmosphere, rich particles, every key actor visible by t=0.2, type is crisp and uniform. Held back by GNSS edge placement and 375 label crowding.

## Fixes (GNSS under 93; others short of 95)
- GNSS: shift default camera/Airliner B path up ~8% so B clears the caption and inset at t=0.2-0.4; anchor "GPS signal" to the beam midpoint; make Close-up ~30% tighter on the dome.
- Viasat: add a "KA-SAT (GEO)" label on the default or enlarge the inset label; add a ground-network label on 1440 Wide; shrink or move the 375 inset off the globe.
- DN-2: label apogee on Profile t=0.3; offset 10,000 km/GEO leaders; back the Zoom camera off so rings are not edge-tight; lift 375 Orbit "Xichang" off the caption.
- Shakti/Cosmos/BF: fan out leaders at 375 Launch/Orbit/Polar t=0.3 (Shakti PDV/Microsat-R/Abdul Kalam; Cosmos Cosmos 1408/Nudol/Plesetsk/ISS; BF USA-193/SM-3/Lake Erie); move the 1440 BF Orbit t=0.7 label off the limb.
