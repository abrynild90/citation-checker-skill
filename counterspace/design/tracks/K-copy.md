# Track K: plain-language rewrite of the scene texts and the reader-facing data text

Read `design/DESIGN.md` first, especially sections 3 (words) and 9 (working rules). This brief adds what is specific to you.

## What you own

- `src/scenes/configs/*.js` (13 scene files plus `shared.js`): captions, step texts, labels, status lines, scale notes, source lines, related-law labels, camera and view names, anything a reader
  sees or hears. Not the numbers, timings, positions, colours or any simulation field.
- Reader-facing text in `data/*.json` only where `node tools/copy_lint.mjs` flags it or it is plainly jargon: `description`, `notes`, `effect`, `short_note`, labels and similar. Never change a name, number,
  date, enumerated value, source, source URL, pin (page reference), citation or id. Never change the *meaning* or the hedging of a sentence (words such as "possibly", "appeared to", "alleged", "SWF assesses"
  stay, in plain form). If a sentence cannot be made plainer without risking its meaning, leave it and list it in your report.
- You may not edit any other file. Other builders are rewriting the charts (`src/charts/*`, `src/ui.js`, `src/cards2.js`), the page (`template.html`, `method.js`, `app.js`), the viewer (`scene-ui.js`,
  `overlay.html`), and the renderers; their wording is theirs.

## The job

Rewrite the words so that a law student or a lecturer reads them easily and finds nothing that sounds like software or like a stock phrase. Follow DESIGN.md section 3 exactly (say-this-not-that table, never-list,
chapter names, first-use rules for acronyms). In scenes, each acronym is spelled out the first time it appears in that scene (ASAT: anti-satellite; LEO: low Earth orbit; GNSS: satellite navigation, such as GPS;
RPO: close approach; SWF: Secure World Foundation). Prefer short sentences and active voice. Say what happens, then why it matters. Keep each scene's caption to what the picture shows.

Specific things to fix (the wording checker reports them as `ledger`, `rows`, `builder`, `static-note`, `preset-fallback`, `file-format`, `ui-jargon`, `coding-jargon`, `raw-code` and others):
- Every "Illustrative, not orbit-propagated · compressed radial scale" style note becomes one plain sentence ("Drawn for illustration. Orbit heights are squeezed so every orbit fits." or a scene-specific version).
- "Scale and imagery note" texts: plain, short, accurate (the Earth imagery credit stays: NASA Blue Marble, public domain; keep what is true about each scene's scale).
- Camera or view names: plain ("Whole scene", "Close up", "From the pole", "Follow the satellite"), not "Wide", "Near", "Polar", "Tour (auto)" unless the plain word is exactly that.
- Source lines: keep every citation and pin exactly; lead with the short name ("Secure World Foundation, 2026, p. 05-01"); never "SWF 2026 Tables 1-3 (p. 01-15), 2-3 ..." in a long run if it can be formatted as a tidy list separated by semicolons.
- Status lines (the line that narrates the current moment) stay short: **the scene checker fails a status line that wraps to a second line at any width, or that describes an event before it happens**, so keep their
  length at or below the old one and keep the order of facts.
- Legal cautions stay true: the Limited Test Ban Treaty "followed" Starfish Prime (not "a direct response"); the 2024 veto concerned nuclear weapons in orbit, not anti-satellite testing; expert manuals are soft law.
  SWF is under CC BY-NC: facts only, quotations of at most 15 words, always attributed.
- No emoji, no glyph icons, no exclamation marks, no stock phrases.

## Checks you must run
1. `python3 tools/build_page.py` after editing, then `node tools/copy_lint.mjs` (set `PORT`): no wording errors from scene configs or data text (hits belonging to other builders' files will remain until they finish; ignore those and say so).
2. **`node tools/scene_check.mjs` for every scene you edit**, because label and status lengths affect layout: `ONLY=<id>` one scene at a time, `VPS=1440,375`, `MODES=live,static` (add `still` for scenes whose still text changed). Zero failures
   required (a few known exemptions are built into the checker; do not weaken any rule). If a longer label causes a collision, shorten the label, never the rule.
3. `node tools/qa.mjs` once at the end for page errors.

## Ports
Use 9160 to 9169.

## Done means
Every string a reader meets in the 13 scenes and in the cards and tables built from `data/*.json` reads plainly; `copy_lint` reports nothing from your files; `scene_check` is clean for all 13 scenes at 1440 and 375;
your final report lists every sentence you left unchanged because of legal or factual risk.
