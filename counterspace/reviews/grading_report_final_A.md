# Final grading, reviewer A (2D slice, fresh)
Method: Playwright (swiftshader), 1440 and 375 x dark/light: 0 console errors/warnings, hscroll 0, audit() = [] in all four. axe 4.10.2 (1440, both themes): 0 violations, 202 color-contrast "incomplete" nodes. Perf (swiftshader): module-start 232-575 ms, first-draw-done 285-689 ms (noisy; 1440 dark 689, light 455). All 6 exports generate (title, font-family, source line, no unresolved var(--)). Viewed: 1440 dark header/legal/A/C/R/B/lag/sources, 375 dark header/legal/A/R, 375 light C/B, 1440 light header, exported light Chart A SVG. Not viewed: 900 captures, other exports, most 375 light. tools/qa.mjs crashed on a WebGL scene screenshot (out of scope); own script used instead. 3D scenes not graded.

| Portion | Score | Evidence |
|---|---|---|
| Header | 94 | Clear H1, lede with quoted SWF line + page ref, tour CTA, 6 nav cards, glance stats, source line; same at 375 and light |
| Legal band | 93 | 1440 numbered key reads cleanly; 375 scroll strip with staggered labels still readable, scroll hint present; label baselines still uneven at 375 (unchanged) |
| Chart A | 94 | Labels clear, FY-1C/DN-2 callouts, bubble legend; 375 zoom note above plot, no overlap; LEO label near FY-1C still tight |
| Chart C | 94 | Lanes/labels legible 1440; 375 light zoom labels wrap cleanly, ZOOMED badge + footer |
| Chart B | 95 | Fill-style legend, whiskers, range labels, narrow 375 fine |
| RPO strip | 94 | Round-13 right-edge defect fixed: at 375 max mark right edge 353 of 375 px, SVG 343 px wide; 68 marks, min hit 24 px (not 44) |
| Lag panel | 95 | Clear pairs, open-ring wording careful about no causation; labels right-clipped nowhere |
| Sources | 94 | 22 numbered linked sources with pins, licensing + citing text clear |
| Mobile (375) | 94 | hscroll 0, RPO edge padded, zoom defaults labelled; touch targets min 24 px, interactive elements down to 15 px high (inline links) |
| Light mode | 94 | Palette distinct, contrast good, hero/CTA fine; exports use light palette |
| SVG exports | 94 | 6/6 export, title/fonts/source; Chart A export legible with country legend and wrapped source note; export has no 3D cube badges (by design) |
| UX | 94 | Zoom toggles, data tables, collapsible 3D scenes group, theme toggle |
| Accessibility | 93 | axe 0 violations, but contrast "incomplete" rose 168 -> 202 since round 13 (regression, likely new scene-panel UI); sub-44 px targets |
| Performance | 94 | first-draw 285-689 ms (noisy, swiftshader); round 13 reported 525 ms; no console errors; 474 KB single HTML |

## Regressions since round 13
- axe color-contrast incomplete 168 -> 202 (not a violation; unverified text over backgrounds).
- First-draw-done 1440 dark 689 ms vs 525 ms in round 13 (one run; light run 455 ms, so likely noise).
- No visual or functional regression found in the 2D sections.

## Fixed since round 13
- RPO right edge at 375 (marks end 22 px inside the viewport).

## Remaining
- Touch targets all under 44 px; inline links 15 px high.
- Legal band 375 label baselines uneven.
- 202 contrast-incomplete nodes unverified.
