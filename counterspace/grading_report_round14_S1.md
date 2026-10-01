# Round 14 grading, slice S1 (hero, overlay UI, static, stills, Starfish, Solwind, Fengyun)
Viewed: hero live+static 1440 and 375; all 13 static scenes at 1440; live Starfish/Solwind/Fengyun at 0.2/0.6/0.85; 375 live/static starfish, solwind, fengyun, spaceplanes, rpo; overlay with aside scrolled to end at 1440 and 375; all 26 stills (contact sheets, plus Starfish live still at full size).
| Item | Score |
|---|---|
| Hero globe | 92 |
| Scene overlay UI | 93 |
| Static fallback (13) | 92 |
| PNG stills (26) | 90 |
| Starfish | 92 |
| Solwind | 93 |
| Fengyun-1C | 93 |
| Visual impact/fun (slice) | 92 |
## Round 13 defects
Fixed: "Scale and imagery note" and last text line no longer sit under the scroll cue (cue top is 5-6px below aside body, 1440 and 375, all three scenes; "End of text" bar shows cleanly). Solwind keeps "Impact: Solwind P78-1" and "F-15 zoom climb" labels at 0.6 and 0.85. Starfish at 375 now shows the whole belt. Live stills now centre Earth (Starfish, MIRACL, Burnt Frost, Shakti, SJ-21 all centred and fully inside frame).
Not fixed / partial: RPO panels 1 and 3 still show a tiny "Earth (off scale)" disc (live and static, 1440 and 375). Spaceplanes static is still crowded (five labels stacked on the left limb, orbit tangle). Live stills have very small labels relative to the 3000px frame and no leader lines in some (Starfish still shows only text chips, the satellite and "Satellite in belt" are absent, Earth mostly dark nightside). RPO live still is a 3-panel strip with tiny type (about 420px per panel at sheet size). DN-2 and SJ-21 static Earth still small within large rings.
## Evidence per score
- Hero 92: large Earth, GEO/MEO/LEO/ISS labels legible at 375; static hero uses Blue Marble well. Live hero Earth is a procedural stylised look next to the static photo Earth, an inconsistency; ISS icon and LEO label crowd the same corner.
- Overlay 93: cue/aside collision fixed, controls clear, mobile layout tidy with "Follow the action/Launch/Orbit/Polar" presets. Remaining: on 1440 the aside text starts mid-sentence when scrollTop persists after scene change (starfish aside opened scrolled), and the page behind is only dimmed.
- Static 92: all 13 centred, labels legible, captions and source line consistent. Fails 93 on spaceplanes clutter, RPO tiny Earth, SJ-21/DN-2 small Earth.
- Stills 90: 26 produced, all with title, source and imagery credit. Earth centred now. Weaknesses: live stills lack the in-scene satellite/labels fidelity of the static ones (Starfish live still has half its labels missing), tiny label type, RPO strip tiny.
- Starfish 92: strong field-line belt, detonation flash, drift; 375 fits. Live still weaker than static.
- Solwind 93: clear narrative (satellite, F-15, collision ring, debris plume that decays), labels persist.
- Fengyun 93: dramatic debris ring, clean at 375; ring in the 0.6 and 0.85 frames nearly identical (little progression after ring forms).
## What raises each to >=93
- Hero: unify live Earth look with static Blue Marble look; de-crowd the ISS/LEO label cluster.
- Static/stills: spaceplanes declutter (fewer labels, offset leaders); RPO panels 1/3 replace "Earth (off scale)" disc with a larger Earth limb or crop; enlarge live-still labels (about 1.5x) and add leader lines; make the live Starfish still keep the satellite and "Satellite in belt"/Thor label, and lighten the nightside.
- Starfish: show satellite in belt in the late frames and add a visible flash/aurora cue at the end.
- Overlay: reset aside scrollTop to 0 on scene change.
- Visual impact: give Fengyun a later phase (ring thinning or spread) so 0.6 to 0.85 differ.
