// QA: NODE_PATH=tools/node_modules OUT=<dir> node tools/qa.mjs   (serves ./ on PORT, default 8881)
// Checks: console errors, horizontal scroll, audit() at 3 viewports x 2 themes, live and static scene audits, exports,
// axe-core (fetched from jsdelivr for the test only, never shipped), performance marks, and a visual-regression hash file.
// Visual regression: each chart section's rendered SVG markup is hashed into $OUT/hashes.json (screenshots are saved beside it); if
// tools/qa-baseline.json exists, changed sections are listed (write a new baseline with BASELINE=1).
// WebGL scenes (paused at a fixed scene time) and PNG stills (live and static) get a perceptual hash instead: the image is downscaled to
// 24x16 luminance and compared with the baseline by mean absolute difference (PH_TOL of 255), because software GL jitters slightly.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const root = path.resolve('.'),
  out = process.env.OUT || 'qa',
  PORT = +(process.env.PORT || 8881);
const BASELINE = path.join(root, 'tools/qa-baseline.json'),
  AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
const SECTIONS = ['legalBand', 'chartA', 'chartC', 'chartR', 'chartB', 'lag'];
const VIEWPORTS = [
  ['1440', 1440, 900],
  ['900', 900, 800],
  ['375', 375, 800],
];
fs.mkdirSync(out, { recursive: true });

const srv = http
  .createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]),
      f = path.join(root, u === '/' ? 'index.html' : u);
    fs.readFile(f, (e, b) => {
      if (e) {
        r.writeHead(404);
        r.end();
      } else {
        r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
        r.end(b);
      }
    });
  })
  .listen(PORT);
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--ignore-certificate-errors'],
});
const report = {},
  hashes = {},
  PH_TOL = 18,
  PH_STILLS = ['starfish', 'fengyun', 'cosmos1408'];

async function run(name, opts, fn) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, ...opts }),
    page = await ctx.newPage(),
    errs = [];
  // Network bytes (encoded, as transferred) per URL since navigation start, read through CDP; used for the "bytes before interaction" check.
  const cdp = await ctx.newCDPSession(page),
    net = new Map(),
    urls = new Map();
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
  cdp.on('Network.loadingFinished', (e) =>
    net.set(urls.get(e.requestId) || e.requestId, (net.get(urls.get(e.requestId) || e.requestId) || 0) + e.encodedDataLength),
  );
  page.netBytes = () => {
    const list = [...net].map(([u, b]) => [u.slice(0, 90), b]).sort((a, b) => b[1] - a[1]);
    return {
      totalKB: Math.round(list.reduce((t, [, b]) => t + b, 0) / 1024),
      top: list.slice(0, 4).map(([u, b]) => `${Math.round(b / 1024)} KB ${u}`),
      heavy3d: list.filter(([u]) => /three|blue-marble|earth/i.test(u)).map(([u]) => u),
    };
  };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text());
  });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // The four "Explore the data" charts share one tabbed panel; the checks below read and scroll to each of them, so lay them all out (as print does).
  await page.addStyleTag({ content: '.xpanel[data-off]{position:static!important;height:auto!important;overflow:visible!important;visibility:visible!important;pointer-events:auto!important}' });
  const r = await fn(page);
  report[name] = { errs, ...r };
  await ctx.close();
}
const hscroll = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const audit = (p) => p.evaluate(() => window.__cs.audit());
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
// Hash of each section's rendered geometry (its serialised SVG plus legend/table text) and a saved screenshot per section.
// Pixel hashes are not used: software rasterisation jitters between runs, while the SVG markup is fully deterministic.
async function sectionHashes(p, key) {
  await p.addStyleTag({ content: '.legal-band{position:static!important;box-shadow:none!important}' });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(300);
  for (const id of SECTIONS) {
    const markup = await p.evaluate(
      (id) => [...document.querySelectorAll(`#${id} svg, #${id} ul.legend, #${id} table`)].map((n) => n.outerHTML).join('\n'),
      id,
    );
    hashes[`${key}/${id}`] = sha(Buffer.from(markup));
    const box = await p.evaluate((id) => {
      const r = document.getElementById(id).getBoundingClientRect();
      return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height };
    }, id);
    fs.writeFileSync(`${out}/${key}-${id}.png`, await p.screenshot({ fullPage: true, clip: box }));
  }
}
// Perceptual hash: 24x16 luminance grid (two-step downscale) as hex, stored under 'phash:<key>'. Input: PNG buffer or data URL.
async function phash(p, key, img) {
  const url = typeof img === 'string' ? img : 'data:image/png;base64,' + img.toString('base64');
  hashes['phash:' + key] = await p.evaluate(async (u) => {
    const im = new Image();
    im.src = u;
    await im.decode();
    const step = (src, w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingQuality = 'high';
      g.drawImage(src, 0, 0, w, h);
      return c;
    };
    const g = step(step(im, 192, 128), 24, 16).getContext('2d', { willReadFrequently: true }),
      d = g.getImageData(0, 0, 24, 16).data;
    let s = '';
    for (let i = 0; i < d.length; i += 4)
      s += Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])
        .toString(16)
        .padStart(2, '0');
    return s;
  }, url);
}
const phDiff = (a, b) => {
  let t = 0;
  for (let i = 0; i < a.length; i += 2) t += Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16));
  return +(t / (a.length / 2)).toFixed(1);
};
async function axe(p) {
  try {
    await p.addScriptTag({ url: AXE_URL });
    const r = await p.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ').slice(0, 90) }));
  } catch (e) {
    return 'axe unavailable: ' + e.message.slice(0, 80);
  }
}

// 1. Matrix: audit + hscroll + section hashes at three viewports, light and dark. Reduced motion keeps WebGL out of the way, so hashes are deterministic.
for (const [vname, w, h] of VIEWPORTS)
  for (const scheme of ['dark', 'light']) {
    const key = `${vname}-${scheme}`;
    await run(
      `matrix-${key}`,
      { viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', isMobile: w < 640, hasTouch: w < 640 },
      async (p) => {
        const res = { audit: await audit(p), hscroll: await hscroll(p) };
        // Chart C zoom toggle must replace the chart, never stack a second one: [after zoom, after full] SVG counts must both be 1.
        res.svgCCounts = await p.evaluate(() => {
          document.getElementById('cFocus').click();
          const a = document.querySelectorAll('#svgC svg').length;
          document.getElementById('cFull').click();
          return [a, document.querySelectorAll('#svgC svg').length];
        });
        if (res.svgCCounts.join() !== '1,1') res.svgCDouble = true;
        if (w >= 761) {
          // sticky legal band: at each section anchor nothing below it may straddle its lower edge
          res.stickyClips = [];
          for (const id of SECTIONS.slice(1)) {
            await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
            await p.waitForTimeout(350);
            await p.evaluate(() => dispatchEvent(new Event('scroll')));
            await p.waitForTimeout(350);
            for (const f of await audit(p)) if (f.kind === 'sticky-clip') res.stickyClips.push({ at: id, ...f });
          }
          await p.screenshot({ path: `${out}/${key}-sticky.png` });
        }
        await p.waitForTimeout(300);
        await sectionHashes(p, key);
        if (vname === '1440') res.axe = await axe(p);
        if (vname === '375' && scheme === 'dark') {
          // legal band: tapping a mark on the phone strip labels it inline
          await p.locator('#legalSvg [data-id="ppwt-2008"]').tap();
          res.legalTap = await p.evaluate(() => {
            const t = document.getElementById('legalTap');
            return { hidden: t.hidden, text: t.textContent.slice(0, 60) };
          });
          await p.screenshot({ path: `${out}/phone-legal-tap.png`, clip: { x: 0, y: 0, width: 375, height: 800 } });
        }
        if (scheme === 'light' && vname === '1440')
          for (const k of ['A', 'B', 'C', 'R', 'L', 'legal']) {
            const svg = await p.evaluate((k) => window.__cs.exportSVG(k), k);
            fs.writeFileSync(`exports/chart-${k}.svg`, svg);
            (res.exportAsOf ??= {})[k] = /Data as of SWF 9th ed\.,? \(?Apr\. 2026\)?/.test(svg) && /Source: SWF 2026/.test(svg);
          }
        return res;
      },
    );
  }

// 1b. Data assertions: what the page renders must equal data/*.json (counts, ids per chart, lag pairs, table rows). `problems` must be [].
await run('data-checks', { viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' }, async (p) => {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8')),
    events = J('events.json'),
    legal = J('legal.json');
  const caps = J('capabilities.json'),
    lagPairs = J('lag_pairs.json'),
    problems = [];
  for (const id of ['svgA', 'svgC', 'svgR', 'svgB', 'svgL']) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
    await p.waitForTimeout(500);
  }
  const page = await p.evaluate(() => {
    const ids = (sel) => [...document.querySelectorAll(sel)].map((n) => n.dataset.id);
    const rows = (id) => [...document.querySelectorAll(`#${id} tbody tr`)].map((tr) => [...tr.cells].map((c) => c.textContent.trim()));
    return {
      A: ids('#svgA [data-id]'),
      C: ids('#svgC [data-id]'),
      R: ids('#svgR [data-id]'),
      legal: ids('#legalSvg [data-id]'),
      tableL: rows('tableL'),
      tableB: rows('tableB'),
      tableA: rows('tableA'),
      tableC: rows('tableC'),
      tableR: rows('tableR'),
      tableLegal: rows('tableLegal'),
    };
  });
  const same = (what, got, want) => {
    const g = new Set(got),
      w = new Set(want);
    if (got.length !== g.size) problems.push(`${what}: duplicate marks`);
    const missing = [...w].filter((x) => !g.has(x)),
      extra = [...g].filter((x) => !w.has(x));
    if (missing.length || extra.length) problems.push(`${what}: missing ${missing.join(',') || '-'}; unexpected ${extra.join(',') || '-'}`);
  };
  const byDomain = (d) => events.filter((e) => e.domain === d).map((e) => e.id);
  // Every mark is a ledger id, and every ledger row of the domain has a mark (Chart A kinetic, Chart C non-kinetic, RPO chart co-orbital, legal band).
  same('#svgA kinetic marks', page.A, byDomain('kinetic'));
  same('#svgC non-kinetic marks', page.C, byDomain('non_kinetic'));
  same('#svgR co-orbital marks', page.R, byDomain('co_orbital'));
  same(
    '#legalSvg legal marks',
    page.legal,
    legal.map((l) => l.id),
  );
  // Data tables carry one row per data row.
  for (const [k, want] of [
    ['tableA', byDomain('kinetic').length],
    ['tableC', byDomain('non_kinetic').length],
    ['tableR', byDomain('co_orbital').length],
    ['tableLegal', legal.length],
    ['tableB', Object.keys(caps.coding).length],
  ])
    if (page[k].length !== want) problems.push(`${k}: ${page[k].length} rows, data has ${want}`);
  // Lag panel: the table's "Ledger rows" cell (event -> law, or the event alone for an open ring) must equal lag_pairs.json, pairs then open rings.
  const cells = page.tableL.map((r) =>
    r[r.length - 1]
      .split(' \u2192 ')
      .map((s) => s.trim())
      .join('>'),
  );
  const want = [...lagPairs.pairs.map((q) => `${q.event}>${q.law}`), ...lagPairs.open.map((q) => q.event)];
  if (cells.join('|') !== want.join('|')) problems.push(`lag table ${JSON.stringify(cells)} != lag_pairs.json ${JSON.stringify(want)}`);
  for (const q of lagPairs.dropped) if (cells.includes(`${q.event}>${q.law}`)) problems.push(`dropped lag pair drawn: ${q.event}`);
  return { counts: { kinetic: page.A.length, nonKinetic: page.C.length, coOrbital: page.R.length, legal: page.legal.length, lagRows: cells.length }, problems };
});

// 2. Desktop scenes: memory, live-scene audit, still export, keyboard flow.
await run('desktop-scenes', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, async (p) => {
  const res = { mem: [], sceneAudit: [] };
  // Before any interaction only the static hero (vector map) is on the page: no three.js, no Earth JPG, no canvas.
  res.bytesBeforeInteraction = p.netBytes();
  res.canvasesBeforeInteraction = await p.evaluate(() => window.__cs.contexts());
  await p.screenshot({ path: `${out}/desktop-dark-full.png`, fullPage: true });
  // The hero is a still picture drawn from the data (no WebGL), and its hit layer lies over #heroStage, so a hover goes to a dot through the layer:
  // Playwright's own hover('#heroStage') waits for a target the layer intercepts. Pointing at a dot must load no 3D library.
  const dot = await p.locator('.ht-hit.ev').first().boundingBox();
  await p.mouse.move(dot.x + dot.width / 2, dot.y + dot.height / 2);
  await p.waitForTimeout(600);
  await p.waitForFunction(() => window.__cs.contexts() > 0, null, { timeout: 1500 }).catch(() => {});
  res.bytesAfterHeroIntent = p.netBytes();
  res.heroRotateHidden = await p.evaluate(() => document.getElementById('heroRot')?.hidden ?? true);
  const t0 = Date.now();
  await p.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 3000 }).catch(() => {});
  res.earthReady = await p.evaluate(() => window.__cs.earthReady());
  res.earthWaitMs = Date.now() - t0;
  res.earthAfterLoad = await p.evaluate(
    (u) => {
      const e = performance.getEntriesByName(u)[0],
        n = performance.getEntriesByType('navigation')[0];
      return e ? { start: Math.round(e.startTime), loadEvent: Math.round(n.loadEventEnd), kb: Math.round((e.transferSize || e.encodedBodySize) / 1024) } : null;
    },
    await p.evaluate(() => window.__cs.EARTH_URL),
  );
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/hero.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  res.baseMem = await p.evaluate(() => window.__cs.memory());
  res.heroAudit = await audit(p);
  for (const id of await p.evaluate(() => window.__cs.scenes)) {
    await p.evaluate((id) => window.__cs.openScene(id), id);
    await p.waitForTimeout(2600);
    await p.screenshot({ path: `${out}/scene-${id}.png` });
    for (const f of await audit(p)) res.sceneAudit.push({ scene: id, ...f });
    // Visual regression for the WebGL scene: pause at a fixed scene time so the frame is comparable between runs.
    await p.evaluate(() => {
      const h = window.__cs.host();
      h.playing = false;
      h.update(0.6);
    });
    await p.waitForTimeout(700);
    await phash(p, `scene-${id}`, await p.locator('#sceneView').screenshot());
    if (PH_STILLS.includes(id)) await phash(p, `still-live-${id}`, await p.evaluate(() => window.__cs.exportStill()));
    (res.sceneText ??= {})[id] = await p.evaluate(() => ({
      steps: document.querySelectorAll('#sceneSteps li').length,
      describedby: document.getElementById('sceneView').getAttribute('aria-describedby'),
    }));
    if (id === 'fengyun')
      res.still = await p.evaluate(async () => {
        const u = await window.__cs.exportStill();
        const img = new Image();
        img.src = u;
        await img.decode();
        return [img.width, img.height, Math.round(u.length / 1024)];
      });
    res.mem.push([id, await p.evaluate(() => window.__cs.memory()), await p.evaluate(() => window.__cs.contexts())]);
    await p.evaluate(() => window.__cs.closeScene());
    await p.waitForTimeout(300);
  }
  res.afterMem = await p.evaluate(() => window.__cs.memory());
  res.canvases = await p.evaluate(() => window.__cs.contexts());
  await p.focus('#svgA [data-id="cn-2007-fy1c"]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(800);
  res.kbOpen = await p.evaluate(() => document.getElementById('overlay').classList.contains('open'));
  res.inertWhileOpen = await p.evaluate(() => document.querySelector('main').inert);
  res.status = await p.evaluate(() => document.getElementById('scStatus').textContent);
  res.axeDialog = await axe(p);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  res.focusBack = await p.evaluate(() => document.activeElement?.dataset?.id);
  await p.hover('#legalSvg [data-id="itu-1992"]');
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/desktop-hover-legal.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  // Shared time scale: the guide line for a legal item must sit at the same screen x in the legal band and in Chart A.
  res.guideX = await p.evaluate(() => {
    const x = (sel) => {
      const l = document.querySelector(sel + ' line.guide');
      return l && l.style.display !== 'none' ? l.getBoundingClientRect().left : null;
    };
    return { legal: x('#legalSvg'), chartA: x('#svgA') };
  });
  res.guideEqual = res.guideX.legal != null && Math.abs(res.guideX.legal - res.guideX.chartA) < 0.6;
  await p.screenshot({ path: `${out}/legal-band-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 400 } });
  res.svgExports = await p.evaluate(() => ['A', 'B', 'C', 'R', 'L', 'legal'].map((k) => window.__cs.exportSVG(k).length));
  res.perf = await p.evaluate(() => window.__cs.perf());
  return res;
});

// 3. Phone: scene opens from a chart tap; reduced motion gives static diagrams whose labels, export and dialog are audited.
await run('phone-scene', { viewport: { width: 375, height: 800 }, colorScheme: 'dark', hasTouch: true, isMobile: true }, async (p) => {
  await p.tap('#svgC [data-id="ru-2022-viasat"] .hit');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${out}/phone-scene.png` });
  return { overlay: await p.evaluate(() => document.getElementById('overlay').classList.contains('open')), hscroll: await hscroll(p) };
});
for (const [name, vp, mobile] of [
  ['static-375', { width: 375, height: 800 }, true],
  ['static-1440', { width: 1440, height: 900 }, false],
]) {
  await run(name, { viewport: vp, colorScheme: 'light', reducedMotion: 'reduce', isMobile: mobile, hasTouch: mobile }, async (p) => {
    const res = { sceneAudit: [], stills: [], hscroll: await hscroll(p), pageAudit: await audit(p) };
    for (const id of await p.evaluate(() => window.__cs.scenes)) {
      await p.evaluate((id) => window.__cs.openScene(id), id);
      await p.waitForTimeout(400);
      for (const f of await audit(p)) res.sceneAudit.push({ scene: id, ...f });
      if (name === 'static-1440') {
        const url = await p.evaluate(() => window.__cs.exportStill());
        res.stills.push([
          id,
          await p.evaluate(async (u) => {
            const img = new Image();
            img.src = u;
            await img.decode();
            return img.width + 'x' + img.height;
          }, url),
        ]);
        await phash(p, `still-static-${id}`, url);
      }
      if (name === 'static-1440' || name === 'static-375') await phash(p, `static-${name}-${id}`, await p.locator('#sceneView').screenshot());
      await p.evaluate(() => window.__cs.closeScene());
    }
    await p.evaluate(() => window.__cs.openScene('starfish'));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${out}/${name}-scene.png` });
    res.axeDialog = await axe(p);
    return res;
  });
}

// 3b. Round-10 UX checks: focus return after a programmatic scene, Enter feedback on a mark without a scene, phone RPO default zoom, tap card closes on scroll.
await run('ux-checks', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' }, async (p) => {
  const res = {};
  await p.evaluate(() => window.__cs.openScene('fengyun'));
  await p.waitForTimeout(500);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  res.focusAfterProgrammaticEsc = await p.evaluate(() => {
    const a = document.activeElement;
    return a?.dataset?.id || a?.id || a?.tagName;
  });
  await p.evaluate(() => document.getElementById('svgR').scrollIntoView());
  await p.waitForTimeout(400);
  const id = await p.evaluate(() => [...document.querySelectorAll('#svgR .mark')].find((m) => !/Opens 3D scene/.test(m.getAttribute('aria-label'))).dataset.id);
  await p.focus(`#svgR [data-id="${id}"]`);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  res.enterFeedback = await p.evaluate(() => ({
    cardOn: document.getElementById('card').classList.contains('on'),
    live: document.getElementById('cardLive').textContent.slice(0, 80),
  }));
  res.rpoExportKeys = await p.evaluate(() => {
    const s = window.__cs.exportSVG('R');
    return { shapeKey: s.includes('>Shape:<') && s.includes('>Docking<'), noDanglingLabelledby: !s.includes('aria-labelledby') };
  });
  res.aExportBubbleKey = await p.evaluate(() => window.__cs.exportSVG('A').includes('Debris bubble area = cataloged fragments'));
  return res;
});
await run('ux-phone', { viewport: { width: 375, height: 800 }, colorScheme: 'dark', hasTouch: true, isMobile: true }, async (p) => {
  await p.evaluate(() => document.getElementById('svgR').scrollIntoView());
  await p.waitForTimeout(500);
  const res = {
    rpoDefault: await p.evaluate(() => ({
      zoomPressed: document.getElementById('rFocus').getAttribute('aria-pressed'),
      flag: document.querySelector('#svgR .zoom-flag')?.textContent.slice(0, 60),
      flagOverflow: (() => {
        const t = document.querySelector('#svgR .zoom-flag'),
          s = document.querySelector('#svgR svg');
        if (!t) return false; // phones open the close-approach chart on the full span, so there is no zoom flag
        return t.getBoundingClientRect().right > s.getBoundingClientRect().right + 0.5;
      })(),
    })),
    aDefault: await p.evaluate(() => document.getElementById('aZoom').getAttribute('aria-pressed')),
  };
  await p.tap('#svgR [data-id="cn-2025-sy12-02-usa336"] .hit').catch(() => {});
  await p.waitForTimeout(400);
  res.cardBeforeScroll = await p.evaluate(() => document.getElementById('card').classList.contains('on'));
  await p.evaluate(() => scrollBy(0, 300));
  await p.waitForTimeout(500);
  res.cardAfterScroll = await p.evaluate(() => document.getElementById('card').classList.contains('on'));
  return res;
});

// 3b2. Table width balance: the Source column must stay under 40% of the scroller at desktop widths.
for (const w of [1024, 1280, 1440, 1920]) {
  await run(`table-source-width-${w}`, { viewport: { width: w, height: 900 }, colorScheme: 'dark' }, async (p) => {
    await p.evaluate(() => document.querySelectorAll('details.table').forEach((d) => (d.open = true)));
    const r = await p.evaluate(() => ['tableA', 'tableC', 'tableR'].map((id) => {
      const sc = document.getElementById(id);
      const th = sc.querySelector('th:last-child');
      return { id, pct: Math.round((th.getBoundingClientRect().width / sc.clientWidth) * 100) };
    }));
    return { widths: r, tooWide: r.filter((x) => x.pct >= 40).map((x) => x.id) };
  });
}

// 3c. Keyboard walk: Tab from the top and record what takes focus; each stop class must be reached and the focus must stay visible below the sticky band.
await run('keyboard-walk', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' }, async (p) => {
  await p.evaluate(() => document.querySelectorAll('details.table').forEach((d) => (d.open = true))); // tables are reachable once their disclosure is open
  const seen = new Set(),
    hidden = [];
  const kind = (a) =>
    a.matches('a.skip') ? 'skip link' :
    a.closest('.scope-dark, header') && a.matches('button') && /theme|dark|light/i.test(a.getAttribute('aria-label') || a.textContent) ? 'theme button' :
    a.closest('.hero-cap, .cta') ? 'hero buttons' :
    a.closest('.hero-contents, .toc') ? 'contents list' :
    a.closest('#legalSvg, #legalBand') && a.classList.contains('mark') ? 'law marks' :
    a.classList.contains('mark') ? 'chart marks' :
    a.closest('.tscroll') ? 'tables' :
    a.matches('summary') ? 'disclosures' : '';
  for (let i = 0; i < 400; i++) {
    await p.keyboard.press('Tab');
    const r = await p.evaluate((src) => {
      const a = document.activeElement;
      const k = eval('(' + src + ')')(a);
      const band = document.getElementById('legalBand')?.getBoundingClientRect();
      const b = a.getBoundingClientRect();
      const stuck = band && band.top <= 1 && band.bottom > 0;
      return { k, covered: !!stuck && b.top >= 0 && b.top < band.bottom - 2 && b.bottom > band.top };
    }, kind.toString());
    if (r.k) seen.add(r.k);
    if (r.covered) hidden.push(i);
  }
  const want = ['skip link', 'theme button', 'hero buttons', 'contents list', 'law marks', 'chart marks', 'tables', 'disclosures'];
  return { missing: want.filter((w) => !seen.has(w)), seen: [...seen], coveredByBand: hidden.length };
});

// 4. Visual regression against the saved baseline (hashes of SVG sections).
fs.writeFileSync(`${out}/hashes.json`, JSON.stringify(hashes, null, 1));
if (process.env.BASELINE) fs.writeFileSync(BASELINE, JSON.stringify(hashes, null, 1));
if (fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const ks = Object.keys(hashes),
    isP = (k) => k.startsWith('phash:'),
    perceptual = {};
  ks.filter((k) => isP(k) && base[k]).forEach((k) => {
    perceptual[k] = phDiff(hashes[k], base[k]);
  });
  report.visualRegression = {
    changed: ks.filter((k) => !isP(k) && base[k] && base[k] !== hashes[k]),
    perceptualChanged: Object.keys(perceptual).filter((k) => perceptual[k] > PH_TOL),
    perceptualMaxDiff: Math.max(0, ...Object.values(perceptual)),
    perceptualChecked: Object.keys(perceptual).length,
    tolerance: PH_TOL,
    missing: ks.filter((k) => !base[k]),
  };
} else report.visualRegression = 'no baseline (run with BASELINE=1 to create tools/qa-baseline.json)';

console.log(JSON.stringify(report, null, 1));
await browser.close();
srv.close();
