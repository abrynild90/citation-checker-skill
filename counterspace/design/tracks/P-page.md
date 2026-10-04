# Track P: page shell and design system

Read `design/DESIGN.md` first, all of it. This brief adds what is specific to you.

## What you own

- `src/template.html`: everything outside the three chart blocks. You own `<head>`, the header, the hero, the chapter navigation, the sources section, the footer, the
  hover-card element and the scripts. The law-and-policy block (`#timeline` down to the end of `#chartA`, plus `#lag`) belongs to track C1. `#chartC`, `#chartR` and
  `#chartB` belong to track C2. Do not edit their markup. You may change the id-free wrapper structure around them only if you tell the orchestrator.
- `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/page.css`.
- `src/boot.js` (theme switch and page start-up only), `src/app.js` (the "at a glance" numbers and their words), `src/method.js` (the Sources and method section),
  `src/partials/icons.html`.
- `design/DESIGN.md` (keep it true to what you build).

## The job

Turn the top of the page and everything around the charts into the most polished editorial page you can, in both themes, from 390 to 1920 px wide.

1. **Hero.** Full-bleed (edge to edge), dark in both themes (`.scope-dark` re-declares the dark colours). The Earth is the picture: `#heroStage` fills the right part of
   the hero on wide screens (about 62% of the width, full height) and the lower part on phones, so the title never sits on top of it. Large display title, lede, one
   primary button ("Take the 3D tour", `#tourBtn`) and one secondary ("Jump to the charts"), then a row of five large figures. Keep `#heroStage`, `#heroRot`, `.illus`,
   `#tourBtn` and their behaviour (the hero 3D code and the scene viewer use them). The caption `.illus` must say, in plain words, that the picture is drawn for
   illustration and orbit heights are squeezed (see DESIGN.md 3.1); keep it short. Add a restrained entrance (title and lede fade up over 500 ms; nothing moves under
   reduced motion). Add a subtle star field to the hero background (CSS only, tiny). No hero image files; the Earth comes from the scene code.
2. **Five large figures** (from `#glance` in `src/app.js`): keep every number exactly as computed today; change only the words so a non-specialist understands each
   (for example "Anti-satellite tests", "Destructive intercepts", "Jamming, laser and cyber operations", "Close approaches in orbit", "Laws and policies"). Numerals in
   Plex Sans 600 at 44 to 56 px with tabular figures, labels at 14 px muted. A thin hairline between figures. The "Last destructive test: Nov 2021" fact moves into the
   lede or a caption line; it must stay on the page.
3. **Top bar and controls.** A slim bar: small wordmark at left ("Counterspace" and, in smaller text, "Companion to *Space Security Law*" with the author and book
   title kept exactly as in the current kicker), theme button at right (`#themeBtn`, an icon button with the sun and moon icons and an accessible name "Switch to
   light colours" or "Switch to dark colours" that updates), and the dark-downloads option (`#expDark` must stay a checkbox with that id; label it "Dark colours in
   downloads"; make it a real switch). Remove the words "Export", "SVG" from page-level text.
4. **Chapter navigation.** Seven numbered chapters with the exact names and titles in DESIGN.md 3.2. In the hero area a clean 7-item grid or list (number, name, a
   few words). On screens at least 1360 px wide also a slim fixed rail on the right edge with seven small dots (name shows on hover and focus, the current
   chapter is highlighted via IntersectionObserver); hide it below 1360 px. The rail must not overlap any chart or the sticky law timeline. Links keep the existing
   targets: `#legalBand`, `#chartA`, `#chartC`, `#chartR`, `#chartB`, `#lag`, `#sources`.
5. **Sources and method** (`src/method.js` builds it). Make it genuinely readable: a two-column layout on wide screens (short navigation of subsections at left, text
   at right, 66ch measure), clear subheads, tidy accordions for the coding rules, a "How to cite this page" block with a "Copy citation" button (clipboard API, with a
   graceful fallback that selects the text), licensing and credits in a quiet panel, the source list in a compact numbered list with hanging indents. Say what each
   part is for in one plain sentence. Remove internal vocabulary ("ledger", "rows", "builder", "schema", "coding", file names). Keep every citation, edition, licence
   statement, the CC BY-NC and 15-word-quote policy statements and the legal cautions exactly true.
6. **Footer.** Three short columns (about this page, data and licence, type and images). Keep the type credits and the licence sentence. Plain words.
7. **Design system.** `tokens.css` is yours to refine (never remove a name; keep the three colour sets identical in their names). `base.css` holds the shared components;
   the other tracks use them by class name, so keep every existing class name working: `.btn` (default, `.primary`, `.small`, `.quiet`, `.icon`), `.seg`, `.chip`, `.chips`,
   `details.table` and `details.about` summaries, `.callout`, `.tag`, `kbd`, `.chapter-head`, `.eyebrow`, `.lede`. Polish them (states, focus, density, touch sizes) and
   add what the page needs (a `.stat`, a `.panel-card` and so on). Set a calm vertical rhythm for the whole page. Add the page's `<title>`, a theme-colour meta and an inline SVG favicon.
8. **Words.** Apply DESIGN.md section 3 to every string you own. Run `node tools/copy_lint.mjs` and clear every hit in your area.

## Care points

- `.wrap` is now 1240 px wide with 24 px gutters (20 px on phones). The charts size themselves from their container, so check each chart still looks right at 1240.
- The sticky law timeline (`.legal-band`) sticks to the top on screens wider than 760 px. Nothing of yours may cover it, and chapter headings must not hide behind it
  when a link scrolls there (`scroll-margin-top` is set in `base.css` for `section.chart`).
- Light theme: warm paper. The hero stays dark. Check contrast of every text colour on every surface (4.5:1; 3:1 for text of 24 px or more).
- Text must never clip at 200% zoom or at 390 px. No horizontal scroll at 375 px.
- Keep the page's start cheap: no new images; fonts are already embedded; no new network requests.

## Ports

Use 9100 to 9109.

## Done means

At 1440, 900 and 390 px, dark and light, the first screen looks like a magazine cover for a serious piece of space-law journalism; the chapters read as a clean sequence;
the sources section is pleasant to read; `node tools/copy_lint.mjs` shows no errors in your strings; `node tools/qa.mjs` shows no page errors and no horizontal scroll.
