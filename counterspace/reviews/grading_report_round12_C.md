# Grading report, round 12, reviewer C (data, docs, accuracy, code)

Verified: `python3 tools/build_data.py` prints `validate(): OK (144 events, 19 legal items, 5 capability categories, 6 lag pairs)`. A temp copy with `"XEO"` in co_rows.py fails with `us-2003-xss10: bad orbit_regime 'XEO'` (copy deleted). `build_page.py` rebuilds index.html with no git diff. Playwright at 1440 and 375: no console errors, no horizontal overflow. I did not re-run qa.mjs or scene_check.mjs.

## Scores
| Portion | Score |
|---|---|
| Data ledger (JSON) | 96 |
| ledger.md | 94 |
| methodology.md | 94 |
| verification_log.md | 94 |
| Code quality / architecture | 92 |
| Accuracy | 95 |
| Pedagogical value | 93 |
| Fidelity to textbook-companion purpose | 94 |
| Sources & methodology section (docs + page text) | 94 |

Best single improvement: code, delete the comment-only `src/scenes.js` and replace the `import {} from` mixin side effects in `app.js` with explicit `installItems(GLHost)`-style calls, then split the 95 src lines over 160 characters.

## Round-11 defects: status
1. Schema version in methodology: FIXED (methodology.md:3, 38, 77, 83 all say 1.2.0; matches schema.py:5, schema.json:2, ledger.md:3).
2. scene_check and cameras documented: FIXED (methodology.md:103 cameras, 104 context inset, 128 scene_check.mjs with every hard-failure rule).
3. tools/TODO.md: FIXED (gone).
4. Stale "concatenated" comments: FIXED (grep of src, tools/*.py and tools/ledger returns nothing except scenes.js:19, which now says "no concatenation").
5. config.js long lines: FIXED (0 lines over 200 characters, was 46 over 250). validate() split into 17 check_* functions plus a short driver (validate.py:266).
6. verification_log 12 vs 13 and stale follow-up: FIXED (line 37 says 13 countries and lists them; "Follow-up" no longer appears in the log or the generator).
7. method.js originality claim: FIXED (method.js:102 now allows short attributed quotations of 15 words or fewer). Lede reads "on a single year axis" (template.html:364).
8. DN-2 Indian Ocean: FIXED (config.js:85-87 attributes it to US officials, with SWF's 30,000 km analysis; matches SWF text lines 20909-20917).
9. ISS altitude: FIXED in substance; the ring is labelled "ISS (illustrative orbit)" (config.js:413) and the caption says "drawn schematically". 420 km is still in code (config.js:127, 413) with no source, but it is never stated as a sourced fact.

## Defects below 93
- Code (92): `src/scenes.js` is still a 21-line comment-only file (scenes.js:15-21 documents that app.js applies three GLHost mixins). `app.js` still patches `GLHost.prototype` through side-effect imports, so import order matters. 95 lines in src/*.js and src/*/*.js exceed 160 characters.
- Pedagogy (93, borderline): captions are accurate and flag what is illustrative, but scenes do not say what the law or ledger says about the event (for example, a one-line pointer from the FY-1C scene to unga-77-41).
- No defect found in other portions. Minor only: methodology and ledger are long (698 and 159 lines) for a reader; the ISS 420 km is unpinned.

## Factual errors
None found. Caption claims that I checked against SWF text all match: DN-2 (10,000 km, "nearly to GEO", "over the Indian Ocean", 30,000 km), Solwind 555 km in text vs 530 in Table 5-1, SJ-21/Compass G2 (25 Dec 2021, "docked to it at some point", 21 Jan 2022, 290-3,100 km), GSSAP USA 270/271 "flanking" SJ-21/SJ-25 (COMSPOC), USA 271 and SKYNET 5A (Sept. 2025), X-37B OTV-7 HEO 323 x 38,838 km, X-37B "has not approached nor rendezvoused", CSS-HQ 276 days, PLA "aggressive" (quote reads "transform into an aggressive unmanned intelligent fighter in space"), Peresvet "Mobile Laser Dazzler", White Sands MIRACL. The 1.4 Mt Starfish yield is cited to DOE (SWF gives 1.4 megaton only for a W49 warhead elsewhere; the caption cites DOE for it).

## Spot checks that passed (35+)
All 68 co-orbital `evidence` quotes verified programmatically as verbatim substrings of the SWF page named by the row's PDF pin (0 misses); descriptions of at least ten rows read (XSS-10 via the failing-validation test, PAN, SJ-12/SJ-06F, OTV-2, OTV-3, SY-7, ANGELS, Luch/Olymp, Mycroft/EAGLE, SJ-23 AKM, Cosmos 2581/2583, USA 271/TJS-15, USA 324, SJ-21/SJ-25, SY-12 02/USA 336, per the verification_log pins). Lede quote matches Executive Summary (SWF line 1907, 13 words, p. xxiii). Legal: LTBT "followed" Starfish with Office of the Historian context; 2024 veto labelled as the nuclear-weapons-in-orbit draft (13-1-1, not DA-ASAT); Tallinn, MILAMOS and Woomera labelled soft law; ITU Art. 45 (harmful interference) and Art. 48 ("retain their entire freedom" for military radio); "38 countries in total" for the moratorium.
