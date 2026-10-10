// copy_lint.mjs: reads every piece of wording a visitor can see and flags software jargon, internal vocabulary and stock "AI" phrasing.
// It opens the page (light and phone widths too), expands every disclosure, reads the hover cards of every chart mark, reads the text inside the
// SVG downloads, then opens all 13 scenes at several moments and in every camera view (on-screen labels, captions, steps, buttons), in both the
// animated and the still-diagram versions, and on a phone. Each string is checked against RULES below.
// Usage: NODE_PATH=tools/node_modules PORT=9960 node tools/copy_lint.mjs        (exit code 1 when any "error" rule matches)
//        OUT=file.json writes every harvested string with its source, for reading the whole copy at once.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'),
  PORT = +(process.env.PORT || 9960);

// Each rule: id, severity (error fails the run), pattern, and what to write instead.
const RULES = [
  // internal / software vocabulary a reader does not need
  ['ledger', 'error', /\bledger\b/i, 'say "records", "entries" or "the data"'],
  ['implementation-copy', 'error', /\b(scrub through time|(?:group|capability) memberships|not coded|absent code|interface revision|fetched from|built into the page)\b/i, 'describe the action or finding in plain language'],
  ['stock-filler', 'error', /\b(did you know|no pressure|many people guess|fair guess|tend to surprise people|nothing here is required reading)\b/i, 'give the result or instruction directly'],
  ['file-format', 'error', /\b(SVG|PNG|CSV|JSON|HTML|API|WebGL|GPU|URL)\b/, 'name the action ("Download chart", "Save image"), not the file format'],
  ['file-name', 'error', /\b[\w-]+\.(md|json|csv|svg|png|html|mjs|js|py)\b/i, 'point to the page itself, not a file name'],
  ['schema-meta', 'error', /\b(schema|metadata|dataset version|version \d+\.\d+)\b/i, 'drop it, or say "data last updated <date>"'],
  [
    'preset-fallback',
    'error',
    /\b(presets?|fall-?back|viewport|canvas|raster|vector|texture|shader|renders?|rendered|rendering|pixels?)\b/i,
    'say "view", "drawn", "image"',
  ],
  ['builder', 'error', /\b(builder|built by|propagated|radial scale|altitude\^)/i, 'say what it means: "orbit heights are compressed to fit"'],
  ['pinned', 'error', /\bpinned?\b/i, 'say "stays in view" or "page reference"'],
  ['still-export', 'error', /\b(still image|still frame|export(ed)? still|stills)\b|\bexport\b/i, 'say "Save image" / "Download"'],
  ['chart-letters', 'error', /\bChart [A-C]\b|^[A-C] ·|\b[A-C] · /, 'name charts by what they show, not by a letter'],
  [
    'coding-jargon',
    'error',
    /\b(coded|coding|reconstructed decades|whisker|hatched? |dotted bands?|zero baseline|stack height)\b/i,
    'explain it in plain words',
  ],
  ['ui-jargon', 'error', /\b(badge|chip|lanes?|marks?|leader|toggle|tooltip|hover card|focus a)\b/i, 'say "icon", "row", "point", "label"; "tap or select"'],
  ['raw-code', 'error', /\b(ew (uplink|downlink)|negotiation span|[a-z]+_[a-z]+(_[a-z]+)*)\b/, 'show readable wording, never a stored code value'],
  ['glyph-icons', 'error', /[◀▶◐⟳⤓⚖✕❚▾▸↓⊕]/, 'use an icon from the sprite, not a text glyph'],
  ['emoji', 'error', /\p{Extended_Pictographic}/u, 'no emoji'],
  ['rows', 'error', /\b\d+ rows?\b|(?<!\bPrime )\brows?\b(?! of)(?!\s*\()/i, 'say "entries" or "operations"'],
  ['static-note', 'error', /\bstatic (diagram|view|image)|reduced motion|no WebGL/i, 'say "still diagram" and explain in a human way'],
  // stock phrasing
  [
    'ai-words',
    'error',
    new RegExp(
      '\\b(' +
        [
          'delve',
          'tapestry',
          'landscape of',
          'navigate',
          'seamless(ly)?',
          'leverag(e|es|ed|ing)',
          'robust',
          'crucial',
          'pivotal',
          'game-?changer',
          'unlock(s|ed|ing)?',
          'empower(s|ed|ing)?',
          'dive (in|into)',
          'journey',
          'comprehensive',
          'cutting-?edge',
          'state-of-the-art',
          'elevate(s|d)?',
          'unleash',
          'ultimate',
          'testament',
          'underscor(e|es|ed|ing)',
          'realm',
          'multifaceted',
          'embark',
          'in today.s',
          'it.s worth noting',
          'it is important to note',
          'at its core',
          'shed light',
        ].join('|') +
        ')\\b',
      'i',
    ),
    'plain, specific wording',
  ],
  ['not-just', 'warn', /\bnot (just|only|merely|simply) [^.;]{1,70}(,| but| it)/i, 'state the point directly'],
  ['exclaim', 'warn', /!/, 'no exclamation marks'],
  ['simulation-talk', 'warn', /\b(simulated|simulation|time compressed|illustrative)\b/i, 'say "drawn for illustration" once per scene, not in every label'],
  ['em-dash', 'error', /(?<![\d-] )\w—\w|\w — \w{2,}/, 'no em dashes in prose: use a full stop, comma or colon'],
  [
    'forced-contrast',
    'error',
    /(^|[.!?]\s)(Not|No) (a|an|the|just|only)\b[^.!?]{1,60}[.!?]\s+(It|This|That|A|An|The)\b/,
    'state the point directly, not as a slogan contrast',
  ],
  [
    'marketing',
    'error',
    /\b(supercharge\w*|world-class|game-chang\w+|revolutioni[sz]\w+|unleash\w*|next-level|best-in-class|cutting-edge|state-of-the-art|elevate[sd]?)\b/i,
    'say what it does',
  ],
  ['theater', 'error', /\b\w+ theat(er|re)\b/i, 'name what is ineffective and why'],
  ['caps-long', 'warn', /^(?:[A-Z0-9&'’.,:;\/()+-]+ ){3,}[A-Z0-9&'’.,:;\/()+-]+$/, 'uppercase only for labels of at most three words'],
  ['double-space', 'warn', /\S {2,}\S/, 'single spaces'],
];

const harvest = new Map(); // key: source + '\u0001' + text
const add = (source, text) => {
  if (!text) return;
  for (const line of String(text).split(/\n+/)) {
    const t = line.replace(/\s+/g, ' ').trim();
    if (t.length > 1) harvest.set(source + '\u0001' + t, { source, text: t });
  }
};

const server = http
  .createServer((q, r) => {
    const f = path.join(ROOT, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]);
    fs.readFile(f, (e, d) =>
      e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }), r.end(d)),
    );
  })
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });

// Text of the page as a visitor can read or hear it: visible text, plus labels read out by screen readers.
const pageText = () => {
  document.querySelectorAll('.xpanel[data-off]').forEach((e) => e.removeAttribute('data-off')); // the tabbed charts of "Explore the data": read them all
  document.querySelectorAll('details').forEach((d) => (d.open = true));
  // A bare dash in a table cell is the empty-cell mark, not prose.
  document.querySelectorAll('td,th').forEach((c) => {
    if (c.textContent.trim() === '—') c.textContent = 'none';
  });
  const attrs = [];
  document.querySelectorAll('[aria-label],[title],img[alt]').forEach((e) => {
    for (const a of ['aria-label', 'title', 'alt']) if (e.getAttribute(a)) attrs.push(e.getAttribute(a));
  });
  document.querySelectorAll('svg > title, svg > desc').forEach((e) => attrs.push(e.textContent));
  return { text: document.body.innerText, attrs: attrs.join('\n') };
};

async function pagePass(label, opts) {
  const p = await browser.newPage(opts);
  await p.goto(`http://localhost:${PORT}/`);
  await p.waitForTimeout(2500);
  const t = await p.evaluate(pageText);
  add(`${label} page`, t.text);
  add(`${label} page (read aloud)`, t.attrs);
  await p.evaluate(() => document.getElementById('firstLookOpen').click());
  for (const step of [0, 1, 2]) {
    await p.evaluate((step) => document.querySelector(`[data-look="${step}"]`).click(), step);
    add(`${label} introduction ${step + 1}`, await p.locator('#firstLook').innerText());
  }
  await p.evaluate(() => {
    document.getElementById('firstLook').hidden = true;
    document.getElementById('firstLookOpen').setAttribute('aria-expanded', 'false');
  });
  for (const decade of await p.locator('#capDecade option').allTextContents()) {
    await p.locator('#capDecade').evaluate((n, d) => { n.value = d; n.dispatchEvent(new Event('change', { bubbles: true })); }, decade);
    add(`${label} phone comparison ${decade}`, await p.locator('#capPhone').textContent());
  }
  console.log(`${label} page checked`);
  return p;
}

// 1. Desktop page: text, hover cards of every mark, downloads, hero labels, scenes (animated).
{
  const p = await pagePass('desktop', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  // Inline readers expose text that cannot be reached by hovering chart points.
  const readers = await p.evaluate(() => {
    const out = [];
    for (const select of document.querySelectorAll('.record-find select')) {
      for (const option of [...select.options].filter(o => o.value)) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        out.push([select.id, select.closest('.record-find').querySelector('.record-result').innerText]);
      }
    }
    return out;
  });
  readers.forEach(([id, text]) => add(`reader ${id}`, text));
  const cards = await p.evaluate(async () => {
    const out = [];
    for (const m of document.querySelectorAll('.mark')) {
      const id = m.closest('[id]')?.id || 'chart';
      m.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 200, clientY: 200 }));
      out.push([id, document.getElementById('card').innerText]);
      m.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }
    return out;
  });
  cards.forEach(([id, t]) => add(`card in ${id}`, t));
  for (const which of ['A', 'B', 'C', 'L', 'legal', 'R']) {
    const svg = await p.evaluate((w) => window.__cs.exportSVG(w), which);
    add(`download ${which}`, (svg.match(/<(text|tspan|title|desc)[^>]*>([^<]*)</g) || []).map((s) => s.replace(/<[^>]*>/g, '')).join('\n'));
  }
  await p.hover('#heroStage').catch(() => {});
  await p.waitForTimeout(5000);
  add('hero live labels', await p.evaluate(() => [...document.querySelectorAll('#heroStage .hlabel')].map((e) => e.textContent).join('\n')));
  const ids = await p.evaluate(() => window.__cs.scenes);
  for (const id of ids) {
    await p.evaluate((id) => window.__cs.openScene(id), id);
    await p.waitForTimeout(2800);
    const grab = async (tag) => {
      add(`scene ${id} ${tag}`, await p.evaluate(() => document.getElementById('overlay').innerText));
      add(
        `scene ${id} ${tag} (read aloud)`,
        await p.evaluate(() =>
          [...document.querySelectorAll('#overlay [aria-label],#overlay [title]')]
            .map((e) => e.getAttribute('aria-label') || e.getAttribute('title'))
            .join('\n'),
        ),
      );
      add(
        `scene ${id} ${tag} labels`,
        await p.evaluate(() =>
          [...document.querySelectorAll('#sceneView .hlabel')]
            .filter((e) => e.style.display !== 'none')
            .map((e) => e.textContent)
            .join('\n'),
        ),
      );
    };
    for (const t of [0.1, 0.35, 0.6, 0.9]) {
      await p.evaluate((t) => {
        const h = window.__cs.host();
        h.playing = false;
        h.update(t);
      }, t);
      await p.waitForTimeout(250);
      await grab(`t=${t}`);
    }
    const cams = await p.evaluate(() => document.querySelectorAll('#scCams button').length);
    for (let i = 0; i < cams; i++) {
      await p.evaluate((i) => document.querySelectorAll('#scCams button')[i].click(), i);
      await p.waitForTimeout(500);
      await p.evaluate(() => window.__cs.host().update(0.6));
      await p.waitForTimeout(250);
      await grab(`view ${i + 1}`);
    }
    console.log(`scene ${id} checked`);
    await p.evaluate(() => window.__cs.closeScene());
    await p.waitForTimeout(250);
  }
  await p.close();
}

// 2. Light theme and phone: page text, then scenes on a phone.
{
  const p = await pagePass('phone', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  const ids = await p.evaluate(() => window.__cs.scenes);
  for (const id of ids) {
    await p.evaluate((id) => window.__cs.openScene(id), id);
    await p.waitForTimeout(2500);
    await p.evaluate(() => {
      const h = window.__cs.host();
      h.playing = false;
      h.update(0.6);
    });
    await p.waitForTimeout(300);
    add(`phone scene ${id}`, await p.evaluate(() => document.getElementById('overlay').innerText));
    add(
      `phone scene ${id} labels`,
      await p.evaluate(() =>
        [...document.querySelectorAll('#sceneView .hlabel')]
          .filter((e) => e.style.display !== 'none')
          .map((e) => e.textContent)
          .join('\n'),
      ),
    );
    console.log(`scene ${id} checked`);
    await p.evaluate(() => window.__cs.closeScene());
    await p.waitForTimeout(200);
  }
  await p.close();
}

// 3. Still-diagram versions (animation switched off).
{
  const p = await pagePass('still-diagram', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const ids = await p.evaluate(() => window.__cs.scenes);
  for (const id of ids) {
    await p.evaluate((id) => window.__cs.openScene(id), id);
    await p.waitForTimeout(1500);
    add(`still diagram ${id}`, await p.evaluate(() => document.getElementById('overlay').innerText));
    console.log(`scene ${id} checked`);
    await p.evaluate(() => window.__cs.closeScene());
    await p.waitForTimeout(150);
  }
  await p.close();
}
await browser.close();
server.close();

// Lint
const findings = new Map(); // rule id -> [{source,text}]
for (const { source, text } of harvest.values())
  for (const [id, sev, re, advice] of RULES) {
    if (re.test(text)) {
      if (!findings.has(id)) findings.set(id, { sev, advice, hits: [] });
      findings.get(id).hits.push({ source, text });
    }
  }
if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify([...harvest.values()], null, 1));
let errors = 0;
console.log(`checked ${harvest.size} distinct pieces of text`);
for (const [id, f] of [...findings].sort((a, b) => (a[1].sev === 'error' ? 0 : 1) - (b[1].sev === 'error' ? 0 : 1))) {
  if (f.sev === 'error') errors += f.hits.length;
  console.log(`\n[${f.sev}] ${id}: ${f.hits.length} hit${f.hits.length > 1 ? 's' : ''}. ${f.advice}`);
  const seen = new Set();
  for (const h of f.hits) {
    const k = h.text.slice(0, 90);
    if (seen.has(k)) continue;
    seen.add(k);
    if (seen.size <= (process.env.ALL ? 999 : 6)) console.log(`   · ${h.source}: ${h.text.slice(0, 150)}`);
  }
}
console.log(errors ? `\n${errors} wording errors` : '\nno wording errors');
process.exit(errors ? 1 : 0);
