# Counterspace: independent-review corrections

This pass addresses the findings in the independent 87/100 review of main commit `ac2ece947619884af636ae99543330f978ae4b54`. That score describes the earlier version. No replacement numerical score is claimed here.

## Changes

- **Chart composition:** recent law details are immediately available; the phone altitude plot starts with recent years, keeps a route to the full history, and uses a horizontal final-test annotation. The selected close-approach view gives each entry its own named row. Repeated year axes reduce backtracking in grouped charts. Entry finders follow the graphics instead of delaying the first read.
- **Phone controls:** seeking gets a full-width track (302 px at a 390 px viewport), with time and view controls in separate positions. Short step names retain the complete sourced explanation below. Image export remains available under Source. Titles wrap.
- **Editorial hierarchy:** six paired timelines on a shared scale replace the oversized takeaway metric panel. The quiz uses question-and-answer rows, source descriptions are larger, the desktop scene-browser gap is smaller, and the phone opening retains two explanatory facts.
- **Scene graphics:** stronger Starfish field lines; larger Solwind, DN-2 and spaceplane subjects; quieter Fengyun, Burnt Frost and Shakti flashes; smaller Cosmos debris points; restrained GNSS, Viasat and MIRACL effects; tighter SJ-21 and close-approach framing. Compact labels were checked at approach, impact and aftermath, including the ship and aircraft labels.
- **Story continuity:** explicit episode buttons keep the picture, selected step and visible account together in close approaches and spaceplanes. The complete account still exposes every step. MIRACL and Peresvet view selection stays within the matching account, and selecting a step restores the appropriate view. Selecting a step interrupts motion. On phones, the current explanation precedes the longer-account disclosure.

Historical data, citations, legal qualifications and distinctions between sourced facts and illustrative geometry remain intact. The capability chart deliberately scrolls horizontally on phones to retain readable bars and decade labels.

## Review and verification

Used the upstream Impeccable guidance available in the working environment: craft floor, polish, adapt and distill, informed by the independent review's critique, typography and motion rubric. This was a bounded correction and confirmation pass, not a new numerical audit.

- Fresh desktop and phone renders in both themes: every section and all 13 scenes, with 52 initial scene captures and focused retakes after corrections.
- Recorded desktop and phone playback, seeking and episode changes; reviewed sampled frames and tested interruption and state continuity.
- A 545-state scene sweep was followed by targeted rechecks. The checker now cancels camera transitions when seeking, matching the visible controls instead of inspecting a moving intermediate camera. Remaining framing and label failures were corrected and rechecked. Static diagrams and 3000 × 1875 still exports were also exercised.
- Episode checks covered all three episodes in both multi-episode scenes, both themes and both sizes. Final phone checks additionally require the entire current explanation to fit inside the story viewport.
- Keyboard focus remains visible after the page's normal layout frame. A 400-Tab check found no focus target covered by the navigation band.
- Contrast checks found zero axe violations in four desktop/phone and light/dark configurations; lowest measured ratios were 5.87, 4.91, 6.26 and 5.28 respectively. All measured nodes met their applicable threshold.
- The existing build, behavior, accessibility and copy gates remain required before merge. Behavior coverage includes all 13 scene controls at desktop and phone sizes, reduced motion, failed graphics, replay and automatic-tour interruption.
- The generated page was verified against the reviewed local build by Git blob hash: `cc81f5731a62d69d274e24af29831e41d2bf40a5`.

The Impeccable detector reported one padding warning on the takeaway wrapper. Its final styles remove the wrapper's border and background; the visible paired rows are intentionally unboxed. The warning refers to superseded container styling, not text against a visible box.

## Limits

Testing used software-rendered Chromium and emulated phone viewports. It does not establish physical-phone frame rate, thermal behavior, or Safari compatibility. Satellite models and trajectories remain explanatory illustrations rather than engineering reconstructions. The unchanged evidence and historical assertions were preserved, not independently re-researched in this design pass.
