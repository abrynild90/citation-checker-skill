# Independent review 1 (Impeccable critique and audit), after the visual upgrade

Scores: first impression 90, chart craft 90, 3D 91, scene viewer 86, responsive/themes/accessibility 86, words 92. Nielsen 31/40, audit 16/20. Detector: no findings.

## Fix list (P1 before launch, P2, P3)
1. P1 Scene story panel: the "What happens" step list is squeezed to 40-130 px under a 120-150 word paragraph (desktop and phone). Put steps first with the paragraph collapsed ("Read the full account") or give steps room for about 5 rows with the paragraph scrolling.
2. P1 Hero GEO label is struck through by the orbit ring and runs to the viewport edge (being replaced by the hero timeline; ignore if the hero changes).
3. P1 Phone defaults to a zoomed range, hiding the 1963 and 1967 treaties and 32 early tests in the first view. Default to the full span, or add a one-line summary above the zoom.
4. P2 No visible focus ring on top nav links and section dots (tabs 3-9); an empty h2 exists in the DOM.
5. P2 Lag chart does not read as duration: use one 0-16 year scale and a longer track, put the number at the bar end, put the hexagon/square key on the chart.
6. P2 Scene view-chip row clipped mid-word on phone (add edge fade or arrows); scene dots are 24 px (44 px targets, name tooltips, a scene list sheet on phone); dots measure 0x0 on phone.
7. P2 Chart controls float far right of headings leaving 150-300 px dead space: put toggle and Download on one aligned row under the lead; cut the three captions above the capabilities chart to one.
8. P3 Download is SVG only: add PNG; rename "Dark colours in downloads" to "Save charts with a dark background".
9. P3 Close-zoom clouds are blurry: sharpen or fade at close zoom.
10. P3 Empty areas: Sources uses 60% of the width (two columns); hero lower left.
11. P3 Wording: "ZOOMED" chip (sentence case), "Capability, then law" nav label, "SC-19" and "Pairs of a state and a capability" unexplained, "RPOs" used in the sentence that defines it, scene paragraphs of 120+ words, heavy "PDF p. 21" references.
12. Not checked: 768, 1024, 1920 px, dark reduced motion, WebGL-failure state. Law zoom panel labels collide at right (ICAO and RRB); hover card text about 10 px (must be 12 px or more); 2020s cluster on phone stacks four labels.
