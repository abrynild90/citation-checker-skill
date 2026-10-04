# Regrade S3 (Laser, SJ-21, RPO, Spaceplanes, DN-2, overall)

Method: Playwright/SwiftShader, fresh. Live default camera at t=0.2/0.4/0.6/0.85 and every preset at t=0.3/0.7, at 1440 and 375, for all five scenes (Laser 4 presets, SJ-21 5, RPO 5, Spaceplanes 5, DN-2 4). RPO/Spaceplanes episode presets also at t=0.2/0.4/0.6/0.85. Static (reducedMotion) view at 1440 and 375, static stillPNG and live stillPNG with REAL titles/cites. **Page errors: 0** (pageerror over all contexts, no stillPNG throws). Captions checked against swf_2026.txt: "within 20 km of USA 245 several times in January 2020", 908/434 days, OTV-7, Object G, Cosmos 2543 2 km, 13 km, 0.05 deg, "three capture/docking operations" all found; no contradictions. Scripts deleted, server stopped by PID.

| Item | Old | New |
|---|---|---|
| Laser dazzling | 95 | 95 |
| SJ-21 tug / arm | 91 | 94 |
| RPO | 92 | 94 |
| Spaceplanes | 92 | 94 |
| DN-2 | 92 | 92 |
| Visual impact | 94 | 95 |
| Graphics quality | 91 | 93 |
| Fun | 93 | 94 |

## Episode lock verification (RPO and Spaceplanes)
Every preset shows its named episode at every t tested. Host time is clamped into the episode and the slider label reads "<Episode>: x / y s". RPO: "China + US in GEO" (t 0.2-0.4 map to 6.4-12.8 of 13.4 s; shows SJ-21/SJ-25 docked + GSSAP), "Russia in LEO" (0.48-0.70, Cosmos 2543 over Russia, 9.5 s), "US + UK in GEO" (0.78-0.92, USA 271 near SKYNET 5A, 8.9 s). Spaceplanes: "X-37B LEO flights" (0.09-0.25, 4-orbit fan, 9.5 s), "OTV-7" (0.30-0.50, elliptical orbit, 7.6 s), "China CSSHQ" (0.60-0.85, Object J/G, 14.7 s). This fixes the previous R16 defect. Clarity: good (the label names the episode, the status caption matches, and a chip highlights). Weak points: (1) the requested t is silently remapped (t=0.3 on "Russia in LEO" shows 0.51), fine for users but the slider has no visible episode bounds; (2) the "Wide" preset on RPO unlocks the tour and the Tour chip, not Wide, is highlighted (aria-pressed follows tour), so the pressed Wide button does not look pressed; (3) the Tour/Wide frames at 0.3 vs 0.7 in Spaceplanes Wide repeat the Tour.

## Evidence
**Laser 95.** Bright magenta beam locks White Sands to MSTI-3 at every t and preset, MSTI-3 gold bus with halo clear at both widths, Russia pins preset honest with its own caption, 375 labels shortened and clean. Static 1440/375 and static still: large Earth, beam and labelled MSTI-3, real title/source footer. Dings: live still is a cropped-limb close-up with a small caption; Peresvet preset t=0.3 and 0.7 identical (static map).
**SJ-21 94.** Static diagram now has the pair at large size off the ring, with a visible robot arm on SJ-21 and a labelled Compass G2 (fixes the old strip defect), and the still reads well. Live: approach, docked pair, tow trail and separation arc readable at 1440/375; "Arm: illustrative (SWF does not describe the mechanism)" chip is honest; presets are now distinct (follow, whole event, side, pull, wide). Defects: GEO orbit line still passes through craft in default t=0.2/0.6 and p0; the live arm is not obviously visible in live 3D (reads as two bus blocks); live-still pair is a small glow at the ring edge; 375 p4 Wide labels (Compass G2, GEO belt, SJ-21) stack closely.
**RPO 94.** Episode lock works and is clear; nation colours, handover, crisp labels; 375 labels fit; three-panel static legible with real source footer. Defects: static 375 panel labels small and "Earth (not to scale)" italic sits over the panel; live still craft are small; "Cosmos 2543 (subsatellite)" label overlays the Earth limb at p2 t=0.3 (1440).
**Spaceplanes 94.** X-37B and gold CSSHQ with wake distinct; OTV-7 against the GEO ring is the standout; the LEO fan is now reachable via preset 1; captions accurate. Defects: the live still shows an oversized, odd-angled X-37B next to a small Earth; static X-37B/CSSHQ marks are tiny (labels carry the story); at 375 "300-400 km" label has no unit context for its orbit set.
**DN-2 92.** Live in all four presets: GEO ring, 10,000 km and apogee markers framed at every t; Polar/Zoom layered shells attractive; rocket head now a glowing pink sphere (better than before). Defects: Earth is only ~25-30% of frame on default and Profile at both widths, with large empty ring space; 1440 default t=0.6/0.85 and Polar t=0.7 "10,000 km" and GEO/Apogee leaders cross each other; 375 default t=0.6/0.85 has 5 leaders converging at the Earth's right (Xichang, 10,000 km, GEO, DN-2 path). Rocket trail is thin on 0.2.
**Visual impact 95 / Graphics 93 / Fun 94.** Blue Marble Earth with rim glow, bloom, beams, wakes, nation colours, episode presets that actually tell a story. Graphics held from higher by simple low-poly craft, orbit lines through models, leader crowding in DN-2/375. Fun: locked episodes with an episode-named slider give real user control; hint that Wide chip state is inconsistent.

## Fixes for anything under 93
- DN-2: tighten the default and Profile cameras so Earth is ~40% of the frame; offset 10,000 km/GEO/Apogee leaders and merge Xichang/DN-2 path leaders at 375; thicken the early trail.
- (Under 95 polish) SJ-21: fade orbit line near craft, show arm/boom in live 3D at the follow preset; enlarge live-still pair.
- RPO/Spaceplanes: highlight the Wide chip when active; show episode bounds on the slider; raise 375 static label size; scale the live-still craft sensibly.
