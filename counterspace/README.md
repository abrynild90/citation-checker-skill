# Counterspace website

A single-file interactive timeline of counterspace events and the legal and policy record. The built `index.html` includes D3, Three.js, Earth imagery, fonts, data, and diagrams. Charts and scenes work without CDN access; source links require a connection.

## Build and check

Use Node.js 22 or later and Python 3.9 or later:

```sh
cd counterspace/tools
npm ci
npx playwright install chromium
npm run build
npm test
```

`npm test` checks desktop and phone boot, scene opening/closing, offline operation, malformed fragments, chart-tab and sources navigation, SVG downloads, and automated accessibility at 375, 900, and 1440 px. The GitHub Actions website workflow runs these checks on website changes.

For broader visual QA, run `npm run qa`. For scene framing and label checks, run `npm run test:scenes`. Reports and screenshots can be kept outside the checkout with `OUT=/tmp/counterspace-qa`; the QA harness can regenerate chart exports. These checks use local axe-core rather than downloading a test dependency at runtime.

Edit `src/`, then rebuild; do not edit the generated `index.html` directly. To validate and regenerate the underlying data and verification documents, run `python3 tools/build_data.py` from `counterspace/`. The website reports its source edition and data cutoff; it does not claim to be a live feed.

The source data and interpretation rules are documented in `methodology.md` and `ledger.md`. Fonts retain their OFL licenses under `fonts/`; D3 and Three.js license notices are reproduced in `THIRD_PARTY_NOTICES.md`.
