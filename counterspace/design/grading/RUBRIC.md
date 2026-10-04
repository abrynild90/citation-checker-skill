# Independent review rubric (graphics quality, interface, wording)

You are an independent reviewer with no stake in this work. You have not seen earlier reviews and you are not told earlier scores. Score only what you can see and verify.

## What you are reviewing

The Counterspace Interactive Timeline: one web page (`index.html`) that accompanies the law book *Space Security Law* by Aaron Brynildson. Readers are law students, lecturers and policy
readers, not engineers. The page has a hero, seven chapters (law timeline, anti-satellite tests, jamming/lasers/cyber, close approaches, capabilities by decade, how long the law took, sources),
thirteen 3D explainers (a window with an animated 3D scene, a story panel and controls), saved images and downloadable charts. It has a dark and a light theme.

## How to look

Do not rely on reading code. Open the real page. Playwright with Chromium is installed (see `tools/snap.mjs` for page screenshots with the right flags: `FILE=<index.html> OUT=<dir> VPS=1440x900,900x1000,390x844
THEMES=dark,light SECTIONS=top,legalBand,chartA,chartC,chartR,chartB,lag,sources node tools/snap.mjs`; `tools/shots.mjs` shows how scenes are captured and opened with `window.__cs.openScene('<id>')`; `?still` on the
address forces the still picture in the hero; scene ids: starfish, solwind, fengyun, burnt-frost, dn2, shakti, cosmos1408, gnss, viasat, laser, sj21-tug, rpo, spaceplanes). Open the PNG files with the Read tool and look at them
the way a design director would. Hover and click things with scripts when you need to (hover cards, scene controls, keyboard). The machine renders WebGL in software, so it is slow; allow time and wait for scenes to settle.
Use your own ports and scratch folder named in your task. Do not edit any project file.

## Scoring (0 to 100, one score per dimension, integers)

Anchors, applied strictly:
- 100: would win a design award; nothing to fix.
- 97: a professional would call it flawless at normal viewing; only nitpicks that need a magnifying glass or an unusual situation.
- 93: polished, with a few noticeable flaws a careful reader sees in the first minutes.
- 85: good, clearly designed, with several visible rough edges.
- 70: functional but plain or inconsistent.
- 50 or less: broken or confusing in important ways.
A score of 97 or more requires that you looked at the thing in both themes and at phone, tablet and desktop sizes (where relevant to the dimension) and found no flaw that you would mention to the
designer as "fix this before launch". Do not round up. Do not give credit for intent: score the pixels and the behaviour. Every deduction needs evidence: the screenshot file, where in it, and what is wrong.

Dimensions (score those named in your task):
1. **First impression and page design**: hero, hierarchy, typography, colour, spacing and rhythm, consistency of components, navigation, footer, sources section.
2. **Chart craft**: clarity, marks and labels, annotation, colour use and colour-independence, empty-space handling, axes and grid, keys, hover and focus cards, tables behind the charts, downloads.
3. **3D graphics quality**: Earth, lighting, atmosphere, space, spacecraft and effects, labels, camera, framing, legibility, how convincing and beautiful the pictures are (live scenes, hero globe, still diagrams, saved images).
4. **Scene viewer interface**: window, header, controls, scrubber, story panel and steps, keyboard, transitions, loading and error states, phone layout, accessibility.
5. **Responsive behaviour, themes and accessibility basics**: 390, 768, 1024, 1440 and 1920 px; dark and light; no horizontal scroll; no clipped or overlapping text; contrast; touch targets; focus visibility; reduced motion.
6. **Words**: every visible string. Is it plain, accurate and free of software jargon (for example "ledger", "rows", "SVG", "PNG", "preset", "WebGL", chart letters, file names) and free of stock phrases and filler? Are acronyms explained? Is the tone that of a careful editor?

## What to report

1. A score for each dimension you were assigned, with one paragraph of justification each.
2. A numbered list of every flaw you found, most serious first, each with: where (page area or scene id and time, theme, viewport), evidence (screenshot path), what is wrong in one sentence, and a concrete fix.
   Mark each as BLOCKER (would stop a 97), MAJOR, or MINOR. Be complete: the builders fix from your list.
3. What is genuinely excellent (briefly), so it is not damaged by fixes.
4. The exact commands and files you used so your findings can be reproduced.
Keep the report plain and free of padding. Write it to the path given in your task, and reply with only the scores and the path.
