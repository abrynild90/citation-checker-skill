# Type-3 grade: Performance, Hero globe, Solwind, regression spot-checks
Method: Playwright/SwiftShader, axe 4.10.2, CDP CSS.getPlatformFontsForNode on every text node. About 11 images read. Scripts deleted, server stopped by PID. Page errors (pageerror + console error, all contexts): **0**. axe 4.10.2 at 1440 dark and light: **0 violations** (1 incomplete, 47 passes each).

| Item | Was | Now |
|---|---|---|
| Performance | 92 | 93 |
| Hero globe | 92 | 93 |
| Solwind | 92 | 93 |
| Typography and Legal band (regression) | 94 / 93 | 92 / 93 |
| Starfish (regression) | 93 | 94 |
| PNG stills, 13 (regression) | 93 | 93 |

## Evidence
- Performance 93: index.html is 563,532 B (down from 667 KB). Transfer 563,832 B uncompressed. 5 runs at 1440: module-start 246, 419, 444, 466 and 414 ms; first-draw-done 339-548 ms; first-draw 53-88 ms; FCP 92-276 ms; DCL 424-692 ms; per-chart draws 4-30 ms (legal 15-40 ms). 0 errors. The cost is still the inline parse. Compression or moving land.json out is the only remaining lever.
- Hero 93: at 1440 the stage is 1146x460 and the globe is clearly larger. The full GEO ring, LEO, GEO, MEO and ISS labels are all inside and nothing is cropped. 375 is excellent (tall stage, big globe, short labels). DEFECT at 900: the GEO label and its leader run into the "Rotate the globe" button at the top right.
- Solwind 93: the live view is centred at t=0.2/0.6/0.85 at 1440 and 375. The shock ring, fragment cloud and labels are tidy. At 0.85 the debris cloud runs off the top edge, and the 375 t=0.2 globe is cropped on the left. Both stills (1440 and 375, 3000x1875) are correct: the real title and cite are present, the globe is now large and centred (about 55% of frame width), and the chips are separated. The satellite is still small, and the 1440 and 375 stills are visually the same composition.
- Typography 92: **no serif text falls back.** Platform fonts across all text nodes are Newsreader 16pt (regular 1,812 glyphs, italic 8), Plex Sans and Plex Sans SmBld. h1, h2, the lede, captions and still titles are clean. Plex Mono has no users (0 elements) and the tables use Plex Sans. The Plex italic is a synthetic oblique, which looks acceptable ("Space Security Law", "Global Counterspace Capabilities"). **DEFECT:** `button.chip` computes `font-family: Arial` (Liberation Sans, 66 glyphs: "Direct-ascent ASAT", "Co-orbital", "Electronic warfare", "Directed energy", "Cyber"). The chip rule has no `font-family: inherit`. Also ▶ ◐ ⟳ and one SVG text glyph fall to DejaVu, which is acceptable for icons.
- Legal band 93: unchanged from the last report, with 11 px ticks and no regressions seen. It was checked only through the hero screenshot (law band bottom), not re-measured.
- Starfish 94: Wide, Near and Polar at t=0.3/0.7 all keep Detonation, Johnston and Thor, including Near t=0.7. Labels are separated. Remaining: the Polar leaders are long verticals and Near is crowded.
- Stills 93: all 13 open and the titles, cites and Blue Marble line are right. The serif titles are clean. The Starfish, Fengyun, Burnt Frost and Shakti globes fill only about 30% of the frame, with a lot of dead space. SJ-21 is mostly empty.

## Fixes for anything under 93
- Typography (92): add `font-family: inherit` to `.chip` (and to all `button` and `input` in the base reset). This removes the Arial fallback and brings the 5-chip text into Plex Sans.
- Hero at 900 (polish): move the GEO label away from `.hero-rot`, either by putting the button bottom-right or by offsetting the GEO label below the ring at widths between 640 and 1000.
- Polish toward 95: zoom the Starfish, Fengyun, Burnt Frost, Shakti and SJ-21 stills about 1.4x. Add compression or move land.json out for a Performance gain.
