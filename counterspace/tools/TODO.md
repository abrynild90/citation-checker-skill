# Open items (scene captions and page text; everything else from the earlier hand-off notes has been applied)

All are in `src/scenes/config.js` (line numbers as of 2026-09-29) unless noted.

1. **Starfish caption wording (config.js:10).** It says the belt "damaged several satellites in the following months". SWF p. 12-05 (PDF 269) says only that such tests "are known to have generated effects that damaged or destroyed satellites in orbit at the time". Reword to that (drop "several" and "following months"). DOE/NV-209 supports date, altitude and yield only.
2. **Unpinned scene statements.** Pin each to an SWF page or reword it:
   - "An F-15 climbs over the Pacific" (config.js:21).
   - GPS "about 20,200 km" (config.js:93 and the constellation label at :96).
   - FY-1C "the largest debris-generating event on record" (config.js:40). SWF p. 05-01 / Table 5-1 supports "most cataloged fragments" in that table; use that wording or pin it.
3. **Older scene captions (starfish, solwind)** should say in the caption itself that the belt spread and geometry are illustrative (methodology.md, scene rules, now states this for the older captions).
