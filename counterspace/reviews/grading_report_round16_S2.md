# Round 16 grading, slice S2 (Burnt Frost, DN-2, Shakti, Cosmos 1408, GNSS jamming, Viasat)

Viewed: 24 contact sheets (each scene at t=0.2/0.4/0.6/0.85 on the default camera at 1440 and 375, and every preset at t=0.3/0.7 at both widths). Captions re-checked against the SWF text: Viasat "~45 min" (found in SWF), KA-SAT network and the Cosmos/DN-2/Shakti figures are unchanged from R15 and still match. Presets: BF 4, DN-2 4, Shakti 4, Cosmos 4, GNSS 3 (Baltic, Close-up, Europe+GPS orbits), Viasat 4. Console/page errors across all runs: none (0 console errors, 0 page errors, 12 scene opens). Note: the scene id is "gnss" (the "gnss_jamming" id in the brief does not exist).

| Scene | R15 | R16 |
|---|---|---|
| Burnt Frost | 93 | 94 |
| DN-2 | 93 | 93 |
| Shakti | 93 | 93 |
| Cosmos 1408 | 95 | 95 |
| GNSS jamming | 92 | 94 |
| Viasat | 93 | 93 |
| Visual impact / graphics / fun (slice) | 93 | 94 |

## R15 defects: fixed?
- BF SM-3 invisible at t=0.2: FIXED. A red SM-3 head with a short trail is visible at 0.2 and a bright flash at 0.4 (both widths); a shockwave ring is visible at 0.6.
- GNSS dome cropped at top (1440 default): FIXED. The whole dome and "Jammer effect zone" label are inside the frame at 0.2 to 0.85.
- GNSS inset top-right: FIXED. It is now bottom-left (~75 px, "GPS orbits (top view)") and no longer sits on the dome. It is hidden at 375. New minor issue: at t=0.2/0.4 on the 1440 default, Airliner B sits at the bottom-left edge right next to the inset and under the status caption.
- GNSS preset-3 leader crossing: MOSTLY FIXED. At 1440 the airliner/zone labels are now spread; at 375 Europe+GPS labels are clean.
- DN-2 head tiny and Earth small: NOT FIXED. The rocket head is still a small dim red dot; the Earth is still ~25% of the frame width on the default.
- DN-2 Zoom path label on disc at 375: CHANGED. The path label is simply absent on 375 Zoom (Xichang, LEO and 10,000 km only).
- Shakti label stacks at 375 (Launch/Orbit): PARTLY FIXED. Launch t=0.3 is now staggered (Microsat-R, PDV, Abdul Kalam each separate), but Orbit t=0.3 at 375 still has PDV Mk-II and Microsat-R touching.
- Cosmos Impact/Plesetsk crowding at 0.6: NOT FIXED at 375 default (Impact and Plesetsk leaders converge near the ISS marker); at 1440 default they are still tight.
- Viasat default KA-SAT off frame, no label: NOT FIXED (still only beams run off the bottom). Ground-network leader is short now on presets 3 and 4: FIXED. Counts identical across viewports (0/900, 387, 891, 900): holds.

## Evidence and fixes to reach >=93 (>=95 where noted)
**Burnt Frost 94**: SM-3 now visible from the start, big flash, shockwave ring, orange debris trail and a persistent Impact marker; caption "125/175 aloft" then "48/175 aloft" matches the SWF 175-piece story. Weak spots: 375 Orbit t=0.3 stacks USA-193/SM-3/USS Lake Erie close together; the debris count differs between default (125/175 at 0.6) and presets at 0.7 (89/175), which is correct but looks jumpy. Fix to 95: spread the 375 Orbit labels and add a faint SM-3 exhaust to the Launch preset.
**DN-2 93**: whole GEO ring and arc framed at every t, four distinct presets, Polar and Zoom attractive. Defects: rocket head still tiny and dim; Earth small on default; 375 Polar t=0.3 puts the status caption over the Xichang/rocket area. Fix: brighter, 2x-size head with a short trail; scale Earth up ~25% (or tighten the default camera); restore the "DN-2 path" label on 375 Zoom, off the disc.
**Shakti 93**: PDV rise, big flash at 0.4, persistent wreck marker, debris fills the sky to the end, 4 clear presets. Defects: 375 Orbit t=0.3 label collision (PDV Mk-II/Microsat-R); 1440 Launch/Orbit at 0.3 have PDV, Microsat-R and Abdul Kalam labels in a tight column. Fix: merge PDV/Microsat-R into one label before the hit, or fan the leaders out.
**Cosmos 1408 95**: still the best scene: dense debris cloud, ISS crossing, Launch close-up with Nudol arc, strong colour. Remaining: 375 default t=0.6 and 375 Orbit/Polar leaders to Impact/Plesetsk/ISS cross or converge; 375 Polar t=0.3 Cosmos 1408 and Nudol labels sit on top of each other. Fix: separate Impact/Plesetsk by more than ~40 px and shorten the 375 leaders.
**GNSS jamming 94**: 3D red dome fully framed, red-to-green aircraft state, pulsing jammer, labelled GPS beam, strong Europe+GPS orbits preset with 375 labels clean. Remaining: Airliner B at t=0.2 overlaps the inset/caption corner on the 1440 default; the 375 default shows no inset (fine) but the "GPS signal" label floats away from the beam at t=0.85; the Close-up preset is only slightly different from the default. Fix: move the airliner start slightly inland or the caption right; attach the GPS label to the beam midpoint; make Close-up zoom on the dome edge where an airliner crosses.
**Viasat 93**: Europe zoom is dramatic (green-to-red wipe, ground-network arcs, KA-SAT beams), the Wide preset keeps KA-SAT visibly unaffected, counts are consistent, 4 presets. Remaining: no KA-SAT marker or "to KA-SAT (GEO)" label on the default; at 375 the context inset covers the top of the globe and the "Terminals" leader on presets 2 to 4; the 1440 Wide preset has no ground-network label. Fix: add the beam label on the default; shrink or relocate the 375 inset (bottom-right) so it does not overlay the Earth; add a "Ground network" label on Wide.
**Visual impact 94**: consistent polish, strong red/green/orange colour language, every scene now has its key actor visible from t=0.2 (SM-3 fixed), GNSS framing fixed. To reach 95+: DN-2 rocket head/Earth size, 375 label collisions (Shakti Orbit, Cosmos default, BF Orbit), Viasat 375 inset.
