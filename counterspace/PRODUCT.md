# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary (confirmed by the product owner): members of the general public and journalists with no space-law background. They reach the page from news stories, shared links, teaching material or the book, and they
want to understand how anti-satellite weapons, jamming, cyber operations and close approaches in orbit relate in time to the treaties, resolutions and policies that followed, or did not.
Their first job, confirmed: see law and weapons on one timeline, within about a minute.
Secondary (from the build brief): readers of the book, including law students and lecturers, who need citations and page references one click away.

## Product Purpose

An interactive companion to *Space Security Law: Governance Beyond the Atmosphere* by Aaron Brynildson. It plots counterspace capabilities (tests, jamming, lasers, cyber operations, close approaches in orbit,
which states hold which capabilities) from 1957 to 2026 against the law and policy that trailed them, on one shared year axis, and explains thirteen key events in short 3D scenes. Success: a first-time
visitor sees the pattern (capability first, law later), can open an explainer for any marked event, and can trace every plotted value to a source with a page reference.

## Positioning

No other page puts weapons and law on one shared time axis, with each point traceable to a pinned source, with soft law (expert manuals) kept distinct from binding law, and with 3D explainers for the events
that matter. The page is a teaching and reference companion, not news and not advocacy.

## Operating Context

Read on laptops and phones, often shared as a link; charts are downloaded for articles and classes. Data come from the Secure World Foundation's *Global Counterspace Capabilities* (9th ed., April 2026; Creative
Commons BY-NC: facts only, quotations of at most 15 words, always attributed), cross-checked against CSIS where noted. The page ships as one self-contained HTML file and stores nothing in the browser.

## Capabilities and Constraints

- One self-contained `index.html`; D3 v7 and three.js load only from jsDelivr or cdnjs; no cookies, no localStorage. Page size is not a constraint: quality comes first (confirmed).
- One shared year scale across the law timeline and every chart. Decades before the 2020s in the capabilities chart are labelled "reconstructed (not SWF-assessed)".
- Legal cautions that must hold wherever they appear: the Limited Test Ban Treaty followed Starfish Prime and was not a "direct response"; the 2024 Russian veto concerned nuclear weapons in orbit, not
  anti-satellite testing; expert manuals (Tallinn, Woomera, MILAMOS) are soft law; ITU Constitution Arts. 45 and 48 are included.
- Every plotted value traces to a source with a page reference (a pin). Never invent data, quotations, counts or claims.
- Dark theme by default plus a light theme; 375 px without horizontal scroll; keyboard and screen-reader access; reduced motion honoured.
- Terminology: say "anti-satellite" with the acronym ASAT after first use; "close approach" for RPO; "Secure World Foundation" before SWF.

## Brand Commitments

None fixed (confirmed: no fixed branding). The name is "Counterspace Interactive Timeline", companion to the book and its author. Typefaces, colours and layout are open to design.

## Evidence on Hand

`data/*.json` (generated from `tools/ledger/`): 61 kinetic tests and the nuclear marker, 15 non-kinetic operations, 68 close-approach and mission entries, 19 law and policy items, capabilities by decade, lag pairs.
`src/scenes/configs/`: thirteen scene scripts. NASA Blue Marble and Black Marble imagery (public domain) for the Earth. No photographs, testimonials or press are available; none may be invented.

## Product Principles

1. Evidence before decoration: every mark, number and sentence earns its place by pointing to a source.
2. The timeline is the spine: weapons and law are always seen against the same years.
3. Plain words first: a reader with no background understands every label, chart and caption without help; terms are defined where they first appear.
4. Calm authority: a serious subject treated without drama, fear or advocacy; caveats are stated plainly where they apply.
5. Look closer on demand: the page works at a glance, and every mark opens more (a card, a source, a 3D explainer, the data table).

## Accessibility & Inclusion

WCAG 2.2 AA at minimum (contrast, focus, names, targets of at least 24 px and 44 px for touch controls); never colour alone to carry meaning; full keyboard operation; `prefers-reduced-motion` gives a still but
complete experience; text can be enlarged to 200% without loss.
