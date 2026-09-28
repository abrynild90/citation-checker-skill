# Methodology: Counterspace Interactive Timeline

## Source editions
- **Primary:** Secure World Foundation, *Global Counterspace Capabilities: An Open Source Assessment*, 9th ed. (April 2026). Pins name the table or passage, the printed section-page (e.g., "p. 05-01") and the PDF page. Debris counts are as of February 2026 (Table 5-1).
- **Secondary:** CSIS, *Space Threat Assessment 2025*. The 2026 edition was not published as of September 2026 (checked on the CSIS project page).
- **Legal:** UNODA treaty pages, UN Digital Library and UNOOSA resolution texts, the UN press release for the 2024 veto, the ITU Constitution (UNTS vol. 1825), the archived White House fact sheet, UNIDIR's history of the CD PAROS committee, ICAO and ITU releases (as quoted in SWF), and the publishers of the manuals.
- **Ledger as of:** 2026-09-28; verification date is the same (see `verification_log.md`).
- **Baseline:** SWF 2026 lists no destructive DA-ASAT test after 15 Nov 2021, so the "since 2021" labels stand.

## Coding rules
- **Chart A:** intercept altitude comes from SWF Table 5-1 for destructive tests. Apogee comes from Tables 1-4, 2-4 and 3-3 for other tests. Tests with no reported altitude go in a separate strip. Soviet IS co-orbital tests are excluded from the scatter (Chart B only). Starfish Prime is the only nuclear test plotted.
- **Debris:** bubble area is proportional to *cataloged* fragments. In-orbit counts appear only in cards and tables.
- **Chart C:** an event appears only when a named source documents it. Attribution follows the source's wording and is never upgraded. Campaigns are drawn as spans. Ground GNSS jamming affects receivers, not satellites. It is tagged `GNSS_MEO` for the signal it targets, and this is explained on the page.
- **Chart B:** the 2020s follow SWF 2026 chapter sections. Earlier decades are the builder's reconstruction and are labeled on the chart. A state counts as "demonstrated" once it has tested or used the capability, and stays counted in later decades. "Developing" covers programs and latent capability.
- **3D scenes:** illustrative only. Radial scale is compressed (altitude^0.45) and Earth is to scale. Particles equal cataloged fragments, capped at 5,000 on desktop and 1,500 on phones. The background starfield is decorative and sits outside that budget. Debris spreads along its orbit much faster than in reality, so that a months-long process fits a 12–16 second scene.

## Known uncertainties
- **SWF 2026 contradicts itself** on some values. Each conflict is recorded in the row's `notes` and in its `conflicts` field, and listed in `ledger.md`:
  - Fengyun-1C: 880 km / 3,532 pieces (Table 5-1) vs 865 km / 3,533 (Table 3-3).
  - Solwind: 530 km (Table 5-1) vs 555 km (prose p. 01-22 and Table 1-4).
  - **Burnt Frost (USA-193): 220 km (Table 5-1) vs 240 km (prose, p. 01-24) vs 2,700 km (Table 1-4 apogee column, interceptor reach).** The same prose says the 175 pieces "took about 20 months to de-orbit entirely" (Table 5-1 lifespan: 1.7 years), so the page must not say the debris re-entered within weeks.
  - SC-19 (5 vs 7 July 2005), Nudol (18 Nov vs 18 Oct 2015), DN-3 (19 vs 21 June 2022; the appendix also lists 15 April 2023).
- The Nudol apogees for 2015-16 carry a "?" in SWF, so those rows are low confidence.
- DN-2's apogee is disputed (10,000 km claimed by China; nearly GEO per the US military; at least ~30,000 km per analysis cited by SWF).
- Several non-kinetic start dates are approximate or come from outside SWF (Ukraine 2014, North Korea Aug. 2010, Trident Juncture window, MIRACL day); each row note says so. The Iran/Eutelsat span (2009-2012) understates the Oct. 2022 episode SWF reports.
- The 2020s Chart B D/P split follows a graphical matrix in SWF that cannot be machine-checked; only the events behind the D entries are verified (`verification_log.md`).
- Bot-blocked sites (UN Digital Library, treaties.unoda.org, ICAO, OUP) could not be fetched by script; their facts were checked through other sources, as `verification_log.md` states per row.

## Builder decisions
1. **Table 5-1 used for all intercept altitudes and debris counts:** one consistent definition across tests. Other values are kept in notes and `conflicts`.
2. **Date conflicts:** where SWF's prose and appendix agree against one table, the prose/appendix date is used (DN-3, 21 June 2022). Otherwise the chapter table is used (Nudol 18 Nov 2015) and the alternative is disclosed.
3. **Iraq 2003 GPS jamming included** in Chart C but excluded from Chart B: Iraq is outside SWF's 13 countries.
4. **Iran/Eutelsat coded `multi_government`:** the ITU located the source in Iranian territory. The row note says this is not a finding of state responsibility.
5. **Attribution is never upgraded.** Levels follow the source's wording: `official_government`, `multi_government`, `researcher_osint`, `alleged`.
6. **Russia-Syria campaign starts in 2016, not 2017:** SWF p. 02-28 says the spoofing "began in 2016, peaked in 2017".
7. **Nudol scope:** the ledger plots the Nudol tests with a reported or estimated apogee that SWF dates consistently. SWF Table 2-4 also lists two failed launches (12 Aug 2014, 22 Apr 2015) and a 15 Nov 2019 test, and Appendix Table 16-2 lists 14 June 2019 and Cosmos 2521 (30 Oct 2017). They are left out because dates or purposes conflict between tables; this is a scope choice, not a claim that they did not happen.
8. **Related-law chips:** Shakti (2019) is linked to UNGA 77/41 (`related_events` in `legal.json`), because that resolution is the multilateral response to DA-ASAT tests generally. The US moratorium (Apr. 2022) is a US pledge that post-dates the Indian test and is linked to Cosmos 1408.
9. **No co-orbital shadowing scene:** it was optional, and no co-orbital event is in the ledger (co-orbital appears in Chart B only).
10. **Laser scene shared:** one laser scene serves MIRACL (1997, fired at White Sands, NM, against the US satellite MSTI-3) and Peresvet (2018).
11. **Light theme follows the OS setting:** the page is dark by default but switches to light when the OS prefers light. The in-memory toggle overrides it.
12. **Lag panel pairs chosen by the builder** (8 pairs, each traced to ledger ids). An open ring means no binding rule has followed yet.
13. **Coastlines** come from Natural Earth via world-atlas (public domain), simplified and inlined (~48 KB). They are used in the static diagrams and as the globe's fallback.
14. **Test tooling:** `tools/qa.mjs` (Playwright) checks console errors, horizontal scroll at 375 and 1440 px in light, dark and reduced-motion modes, keyboard open and focus return, and WebGL memory returning to baseline after cycling all scenes.
15. **Earth imagery:** NASA Blue Marble (U.S. government work, public domain), 4096x2048 px, 1.4 MB, loaded from a pinned copy on jsDelivr (`three-globe@2.45.0/example/img/earth-blue-marble.jpg`). It is fetched after the page's load event, skipped when reduced motion is on or WebGL is unavailable, and downscaled to 2048 px on phones.
16. **Rendering upgrades (code only):** atmosphere glow, fixed sun with terminator, starfield, soft particles, trails, explosions, pulsing laser beam, flickering jammed GNSS links.
17. **Scene PNG export** renders at 3000 px wide (capped by the GPU) and bakes in the labels, the "illustrative" banner, the caption and the source cite.

## Rebuild
`python3 tools/build_data.py && python3 tools/build_page.py`. `build_data.py` writes `data/*.json` and `ledger.md`. The SVG exports in `exports/` are regenerated by `tools/qa.mjs` in light mode.
