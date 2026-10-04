# Type-pass grading, reviewer A (2D slice, fresh, after Newsreader / IBM Plex Sans / Plex Mono)
Method: Playwright (swiftshader), 1440 and 375 x dark/light; screenshots viewed: 1440 dark hero/legal/A/C/R/B/L/Sources, 375 dark hero/A/C, 1440 light A, exported Chart A SVG opened standalone. 3D scenes not graded. Scripts deleted, server stopped by PID.

Font checks (all 4 viewport/theme combos): document.fonts.check true for Newsreader 400/600/italic, Plex Sans 400/500/600/italic, Plex Mono 400; all 7 FontFace entries status "loaded". Computed: h1 and h2 = Newsreader 600 (46px, 28px at 375), .lede = Newsreader 19.5px, chart-head p = Newsreader 17px; body, UI, legends, table text, notes, buttons = Plex Sans; all SVG text = Plex Sans (10-11px). Table date cells use Plex Mono per CSS (td[data-label=Date]; tables collapsed, not rendered). 0 console errors/warnings, hscroll 0 at 1440 and 375.
Chart label geometry (getBoundingClientRect on every SVG text, pairwise): 0 overlapping label pairs in legal, A, C, R, B, L at 1440 dark/light and 375 dark/light. Only "clip" hits are the legal band at 375 (1960-2000 ticks, ABM Art. XII), which is the intentional horizontal scroll strip. Min SVG text size 10 px (legal 1440, Chart A 375), 10.5 elsewhere.
Exports: 6/6 download. Each embeds 2 Plex Sans woff2 faces (400, 600) plus a sans-serif fallback. Opened standalone via file://: document.fonts.check Plex 600 true, 2/2 faces loaded, 0 overlaps, 0 clipping in all six. Chart A export viewed: Plex renders, legend/callouts clean. Not embedded: weight 500, Newsreader, Mono (none used in exports).

| Portion | Score | Evidence |
|---|---|---|
| Header | 95 | Newsreader H1 at 46px with tight tracking and balanced wrap, serif lede with bold Plex-bold-weight "November 2021" reads like an editorial dek; spaced-caps eyebrow with italic title. At 375 H1 breaks "1957–/2026" across a line (en-dash split), minor. |
| Legal band | 93 | No overlaps; numbered key crisp. 10 px SVG labels at 1440 are the smallest text on the page; 375 strip scrolls by design. |
| Chart A | 94 | No overlaps/clipping at either width with Plex metrics; callouts with bold/regular pairing clean. Y-axis title "Altitude, km (log)" is ~10 px and the weakest text. |
| Chart C | 94 | Lane labels and 28 text nodes clean at 1440; 375 zoom labels wrap into 2-3 lines with no collisions. |
| Chart B | 95 | Range labels, whiskers and legend clean; hatches readable; y-axis title 10.5 px. |
| RPO strip | 94 | 11 text nodes, no overlap; lane headers legible. Marks unchanged from prior grade (24 px hit size). |
| Lag panel | 95 | Long one-line captions (up to ~150 chars) fit without right clipping at 1440; Plex's width did not cause overflow; 11 px min. |
| Sources | 94 | Newsreader title, Plex list; 22 linked sources readable at 13-14 px; dense but well hierarchised. Links underlined in accent. |
| Mobile (375) | 94 | hscroll 0; H1 28px, lede 16px serif comfortable; SVG text 10-10.5 px with ~343 px charts is small; touch targets unchanged (<44 px). |
| Light mode | 94 | Fonts identical in light; contrast good, Newsreader headings strong on warm paper background. |
| SVG exports | 95 | 6/6 render in Plex standalone, no overlap or clipping, fonts embedded (400/600). Title and long source note use Plex; no Newsreader in exports so export headings are sans (consistent but differs from page). |
| UX | 94 | Typography aids scanning (serif for titles/dek, sans for controls); no behaviour regressions found. |
| Accessibility | 93 | Not re-run axe; no new issues seen. Small text (10 px SVG, 11 px eyebrow, 11.5 px mono dates) and sub-44 px targets still stand. |
| Performance | 91 | index.html grew to 773 KB (was 474 KB) because of ~300 KB base64 fonts inline; fonts load with display:swap and all loaded before first check; no console errors. |
| Typography | 93 | Newsreader + Plex Sans/Mono is a coherent, authoritative law-and-data pairing; Newsreader gives scholarly weight to titles and deks, Plex gives technical clarity in charts; clear hierarchy (46/30/19.5/17/15/12.5 px); fonts actually render everywhere including exports. Deductions: prose in Sources, notes, chart sub-notes and cards is Plex Sans, not Newsreader, so "serif prose" applies only to deks (a split, not a flaw but inconsistent with the brief); many small chart/eyebrow sizes at 10-11 px; bold weights fake-free but only 400/600 are embedded in exports. |

## Fixes for anything under 93
- Performance 91: subset Newsreader further (it is the bulk) or drop the italic face if only used in a few spots; consider font-display:optional is not needed, but loading fonts as separate cacheable files would cut the 773 KB HTML (trade-off: single-file design).
## Suggested polish (93-95 items)
- Raise SVG axis titles and legal-band labels from 10 to 11 px; check Chart A y-title first.
- Keep "1957–2026" unbreakable in the H1 at 375 (white-space:nowrap on the range or a word-joiner after the en dash).
- Optionally embed Newsreader 600 in exports for the title so export headings match the page.
- Decide whether long-form notes (chart sub-notes, Sources body) should use Newsreader for consistency with the deks.
