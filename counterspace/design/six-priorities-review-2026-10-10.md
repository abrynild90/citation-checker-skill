# Counterspace: first six priorities

Scope: the first six recommendations accepted by the user. Based on main `b0a222b67fa3d84de2f5bcb0b4a9a9b99bf62a45`; implemented in PR #8. No numerical design score is asserted.

## Changes

1. **Phone validation and enlarged text.** Added a Chromium/WebKit CI matrix with touch emulation, orientation changes, 375 × 667 and 390 × 844 portrait layouts, 844 × 390 landscape, keyboard navigation, and axe checks. Chromium also uses a synthetic 4× CPU slowdown. A 200% CSS text-size check exposed off-screen controls and overflowing headings: titles and actions now wrap, the scene sheet stays within the visible phone width, view controls wrap, and tall headings yield picture space to the scrollable account. Diagram labels retain their measured size under automatic text inflation; browser zoom still enlarges the diagram. This is not a physical iPhone, Safari-on-iOS, Dynamic Type, or VoiceOver validation.
2. **First-minute introduction.** An optional, reader-paced sequence moves from Starfish Prime to the later Limited Test Ban Treaty to the qualification that chronology does not establish causation. Every stage links to the underlying test, treaty or historical context. The timeline and tour remain directly available. No timer, modal, forced completion or stored preference.
3. **Phone scene viewer.** “Full account” sits beside “Source” outside the fading scroll region. Opening it pauses the scene. Source links, related law and image saving remain available in the source disclosure. Desktop placement and keyboard focus are preserved.
4. **Phone capability comparison.** A native decade selector and horizontal comparisons replace mandatory sideways chart scrolling. The same aggregation, deduplication and filters feed both views. Tested/used, developing, and cases where SWF’s table has no data remain distinct. The scale is constant across decades. Reconstructed decades are clearly identified. The complete historical chart, sources, data table and downloads remain available.
5. **Scene composition and motion.** Reviewed opening, action and later states across all 13 scenes. Continuous camera fitting replaces quantized distance steps. Solwind’s early phone framing leaves room for the spacecraft above its caption. Shakti and Burnt Frost use smaller, more restrained fragments. Removed decorative anonymous satellites from DN-2’s contextual GEO ring and moved Viasat’s ground-network label clear of the moving signal graphics. Removed generated debris/modem counters that could resemble observations; sourced totals remain. Corrected the opening GPS caption to describe the color key without claiming that both aircraft still have a signal. The OTV-8 caption now explicitly introduces the next flight.
6. **Spacecraft silhouettes.** Solwind now has a wheel body and upright solar sail; Fengyun-1C has a compact box body and two long solar arrays. Both have matching still-diagram glyphs. Shape references and illustrative qualifications are available with the scene. Other vehicles retain their existing sourced or explicitly generic representations. Regenerated Solwind, Fengyun and Shakti gallery pictures, including a less crowded Solwind crop.

Historical records, legal qualifications, event counts and citations were not recoded. The new introduction reuses the existing event/treaty source links. The distinction between a reconstructed picture and established evidence remains explicit.

## Reference basis for shapes

- NASA HEASARC, [P78-1](https://heasarc.gsfc.nasa.gov/docs/heasarc/missions/p78-1.html): OSO-type wheel and solar-oriented sail.
- NASA Imagine, [Solwind photograph](https://imagine.gsfc.nasa.gov/science/toolbox/missions/solwind.html), credited to the USAF: overall outline and broad surface divisions.
- NASA Orbital Debris Quarterly News, [July 2009, pp. 5–6](https://orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/odqnv13i3.pdf): two 1.5 × 4 m FY-1C solar panels. Details beyond the broad silhouette are deliberately omitted.

The model dimensions, attitudes, relative distances, motion and trajectories are explanatory, not reconstructions. No claim of newly established physical accuracy is made.

## Review and checks

- Used the available upstream Impeccable guidance: craft floor, onboarding, adaptation, animation, clarity and polish. No independent re-grade was requested for this implementation; no fresh third-party score is implied.
- Baseline and revised scene compositions were captured at 390 and 1440 px, at three moments per scene. The revised 129-state live/still review found one Viasat label collision; a focused 12-state recheck of Viasat and Solwind passed after the correction. All 13 still diagrams and their print compositions were included in the broad review.
- Captured every scene in desktop/phone and light/dark contexts, the three introduction stages and the capability chart. Reviewed desktop/phone motion recordings. Refreshed enlarged-text screenshots after fixing the defects they exposed.
- Data validation: 144 events, 19 legal items, five capability categories, six lag pairs. No changes to the generated data records.
- Smoke and behavioral regression checks passed locally, including 375, 900, 1024 and 1440 px, offline operation, chart downloads and axe checks.
- Initial Chromium and WebKit CI phone checks passed. The expanded final checks include real control bounds at 200% text size, rather than treating `innerWidth` as proof that nothing overflows.
- A local 4× CPU run recorded DOMContentLoaded around 2.1–2.6 seconds and load around 2.2–2.7 seconds. These are synthetic observations on this runner, not iPhone performance measurements or a field-performance claim. Reported layout-shift sums include the whole scripted session and orientation changes; they are not field Core Web Vitals.
- Copy checking now explicitly traverses all three introduction stages and every selected decade. Its existing warnings for historical acronyms and simulated *historical test targets* are retained; those are source terminology, not software instructions.
- CI requires the committed `index.html` to match a fresh build byte for byte. The final PR must pass website behavior/motion/accessibility/copy checks, both mobile-engine jobs and the repository’s Python/package checks before merge. The temporary page-generation workflow is removed before the merge.

Useful reproduction commands, from `counterspace/`:

```sh
python3 tools/build_data.py
python3 tools/build_page.py
node tools/smoke.mjs
node tools/regression.mjs
node tools/motion_check.mjs
node tools/copy_lint.mjs
BROWSER=chromium OUT=mobile-evidence node tools/mobile_check.mjs
BROWSER=webkit OUT=mobile-evidence node tools/mobile_check.mjs
PRESETS=0 VPS=390,1440 VH=844 TS=0.2,0.51,0.82 CAMS=0 MODES=live,static SHOT=1 node tools/scene_check.mjs
```

## Remaining limits

Physical iPhone/Safari behavior, VoiceOver announcements, OS text settings, thermal throttling and real mobile network performance remain unverified. Local WebKit installation was blocked by unavailable host libraries and system package permissions; Linux WebKit is covered in CI. Very large text necessarily gives the picture less room and makes the account scroll. The complete prose and sourced steps remain available. These limitations prevent claiming that item 1 is fully complete on physical hardware.
