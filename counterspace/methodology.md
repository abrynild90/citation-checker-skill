# Methodology: Counterspace Interactive Timeline

## Source editions
- **Primary:** Secure World Foundation, *Global Counterspace Capabilities: An Open Source Assessment*, 9th ed. (April 2026). Pins give the printed section-page (e.g., "p. 05-01") and the PDF page. Debris counts are as of February 2026 (Table 5-1).
- **Secondary:** CSIS, *Space Threat Assessment 2025*. The 2026 edition was not published as of September 2026 (checked on the CSIS project page).
- **Legal:** UNODA treaty pages, UN Digital Library, the UN press release for the 2024 veto, the ITU Constitution, a White House (archived) fact sheet, and the publishers of the manuals.
- **Baseline:** SWF 2026 lists no destructive DA-ASAT test after 15 Nov 2021, so the "since 2021" labels stand.

## Coding rules
- **Chart A:** intercept altitude comes from SWF Table 5-1 for destructive tests. Apogee comes from Tables 1-4, 2-4 and 3-3 for other tests. Tests with no reported altitude go in a separate strip. Soviet IS co-orbital tests are excluded from the scatter (Chart B only). Starfish Prime is the only nuclear test plotted.
- **Debris:** bubble area is proportional to *cataloged* fragments. In-orbit counts appear only in cards and tables.
- **Chart C:** an event appears only when a named source documents it. Attribution follows the source's wording and is never upgraded. Campaigns are drawn as spans. Ground GNSS jamming affects receivers, not satellites. It is tagged `GNSS_MEO` for the signal it targets, and this is explained on the page.
- **Chart B:** the 2020s follow SWF 2026 chapter sections. Earlier decades are the builder's reconstruction and are labeled on the chart. A state counts as "demonstrated" once it has tested or used the capability, and stays counted in later decades. "Developing" covers programs and latent capability.
- **3D scenes:** illustrative only. Radial scale is compressed (altitude^0.45) and Earth is to scale. Particles equal cataloged fragments, capped at 5,000 on desktop and 1,500 on phones. The background starfield is decorative and sits outside that budget. Debris spreads along its orbit much faster than in reality, so that a months-long process fits a 12–16 second scene.

## Known uncertainties
- SWF 2026 contradicts itself on some values: Fengyun-1C is 880 km/3,532 pieces (Table 5-1) vs. 865 km/3,533 (Table 3-3); Solwind is 530 vs. 555 km; some SC-19, DN-3 and Nudol dates differ between chapter tables and the appendix. Both values are recorded in the row notes.
- The Nudol apogees for 2015–16 carry a "?" in SWF, so those rows are low confidence.
- DN-2's apogee is disputed (10,000 km claimed by China; ≥30,000 km per analysis cited by SWF).
- The start dates of several non-kinetic campaigns are approximate (year or month).

## Builder decisions
1. **Table 5-1 used for all intercept altitudes:** one consistent definition across tests.
2. **Iraq 2003 GPS jamming included** in Chart C but excluded from Chart B: Iraq is outside SWF's 13 countries.
3. **Iran/Eutelsat coded `multi_government`:** the ITU located the source in Iranian territory. The row note says this is not a finding of state responsibility.
4. **Russia–Syria campaign starts in 2016, not 2017:** that is the start of the C4ADS dataset SWF relies on.
5. **No co-orbital shadowing scene:** that scene was optional, and no co-orbital event is in the ledger (co-orbital appears in Chart B only).
6. **Laser scene shared:** one laser scene serves both MIRACL (1997) and Peresvet (2018).
7. **Light theme follows the OS setting:** the page is dark by default but switches to light when the OS prefers light, as the brief's `prefers-color-scheme` rule requires. The in-memory toggle overrides it.
8. **Lag panel pairs chosen by the builder** (8 pairs, each traced to ledger ids). An open ring means no binding rule has followed yet.
9. **Coastlines** come from Natural Earth via world-atlas (public domain), simplified and inlined (~48 KB). They are used in the static diagrams and as the globe's fallback.
10. **Test tooling:** `tools/qa.mjs` (Playwright) checks for console errors, horizontal scroll at 375 and 1440 px in light, dark and reduced-motion modes, keyboard open and focus return, and WebGL memory returning to baseline after cycling all scenes (1 canvas).
11. **Earth imagery:** NASA Blue Marble (U.S. government work, public domain), 4096×2048 px, 1.4 MB, loaded from a pinned copy on jsDelivr (`three-globe@2.45.0/example/img/earth-blue-marble.jpg`). The package carries no credit line, so the NASA identification is visual. The image is not part of the page download: it is fetched after the page's load event, while the browser is idle. It is skipped entirely when reduced motion is on or WebGL is unavailable. Phones downscale it to 2048 px. Scenes show the vector map until it arrives, or if it fails to load. Each scene makes its own GPU texture and disposes of it on close.
12. **Rendering upgrades (code only, no extra download):** atmosphere glow, a fixed sun with a day/night terminator and ocean glint, starfield, soft round particles, fading trajectory trails, glowing interceptor heads, explosions with shock rings, a pulsing laser beam, and flickering jammed GNSS links.
13. **Scene PNG export** renders at 3000 px wide (capped by the GPU) and draws the labels, the "illustrative" banner, the caption and the source cite into the image.

## Rebuild
`python3 tools/build_data.py && python3 tools/build_page.py`. The SVG exports in `exports/` are regenerated by `tools/qa.mjs` in light mode.
