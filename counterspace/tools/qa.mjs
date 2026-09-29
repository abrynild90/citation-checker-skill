// QA: NODE_PATH=tools/node_modules OUT=<dir> node tools/qa.mjs   (serves ./ on PORT, default 8881)
// Checks: console errors, horizontal scroll, audit() at 3 viewports x 2 themes, live and static scene audits, exports,
// axe-core (fetched from jsdelivr for the test only, never shipped), performance marks, and a visual-regression hash file.
// Visual regression: each chart section's rendered SVG markup is hashed into $OUT/hashes.json (screenshots are saved beside it); if
// tools/qa-baseline.json exists, changed sections are listed (write a new baseline with BASELINE=1).
// WebGL scenes (paused at a fixed scene time) and PNG stills (live and static) get a perceptual hash instead: the image is downscaled to
// 24x16 luminance and compared with the baseline by mean absolute difference (PH_TOL of 255), because software GL jitters slightly.
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path'; import crypto from 'crypto';

const root = path.resolve('.'), out = process.env.OUT || 'qa', PORT = +(process.env.PORT || 8881);
const BASELINE = path.join(root, 'tools/qa-baseline.json'), AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
const SECTIONS = ['legalBand', 'chartA', 'chartC', 'chartB', 'lag'];
const VIEWPORTS = [['1440', 1440, 900], ['900', 900, 800], ['375', 375, 800]];
fs.mkdirSync(out, { recursive: true });

const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); } });
}).listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });
const report = {}, hashes = {}, PH_TOL = 18, PH_STILLS = ['starfish', 'fengyun', 'cosmos1408'];

async function run(name, opts, fn) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, ...opts }), page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const r = await fn(page); report[name] = { errs, ...r }; await ctx.close();
}
const hscroll = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const audit = p => p.evaluate(() => window.__cs.audit());
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
// Hash of each section's rendered geometry (its serialised SVG plus legend/table text) and a saved screenshot per section.
// Pixel hashes are not used: software rasterisation jitters between runs, while the SVG markup is fully deterministic.
async function sectionHashes(p, key) {
  await p.addStyleTag({ content: '.legal-band{position:static!important;box-shadow:none!important}' });
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  for (const id of SECTIONS) {
    const markup = await p.evaluate(id => [...document.querySelectorAll(`#${id} svg, #${id} ul.legend, #${id} table`)].map(n => n.outerHTML).join('\n'), id);
    hashes[`${key}/${id}`] = sha(Buffer.from(markup));
    const box = await p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; }, id);
    fs.writeFileSync(`${out}/${key}-${id}.png`, await p.screenshot({ fullPage: true, clip: box }));
  }
}
// Perceptual hash: 24x16 luminance grid (two-step downscale) as hex, stored under 'phash:<key>'. Input: PNG buffer or data URL.
async function phash(p, key, img) {
  const url = typeof img === 'string' ? img : 'data:image/png;base64,' + img.toString('base64');
  hashes['phash:' + key] = await p.evaluate(async u => {
    const im = new Image(); im.src = u; await im.decode();
    const step = (src, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h); return c; };
    const g = step(step(im, 192, 128), 24, 16).getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, 24, 16).data; let s = '';
    for (let i = 0; i < d.length; i += 4) s += Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]).toString(16).padStart(2, '0');
    return s;
  }, url);
}
const phDiff = (a, b) => { let t = 0; for (let i = 0; i < a.length; i += 2) t += Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)); return +(t / (a.length / 2)).toFixed(1); };
async function axe(p) {
  try {
    await p.addScriptTag({ url: AXE_URL });
    const r = await p.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
    return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ').slice(0, 90) }));
  } catch (e) { return 'axe unavailable: ' + e.message.slice(0, 80); }
}

// 1. Matrix: audit + hscroll + section hashes at three viewports, light and dark. Reduced motion keeps WebGL out of the way, so hashes are deterministic.
for (const [vname, w, h] of VIEWPORTS) for (const scheme of ['dark', 'light']) {
  const key = `${vname}-${scheme}`;
  await run(`matrix-${key}`, { viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', isMobile: w < 640, hasTouch: w < 640 }, async p => {
    const res = { audit: await audit(p), hscroll: await hscroll(p) };
    // Chart C zoom toggle must replace the chart, never stack a second one: [after zoom, after full] SVG counts must both be 1.
    res.svgCCounts = await p.evaluate(() => { document.getElementById('cFocus').click(); const a = document.querySelectorAll('#svgC svg').length; document.getElementById('cFull').click(); return [a, document.querySelectorAll('#svgC svg').length]; });
    if (res.svgCCounts.join() !== '1,1') res.svgCDouble = true;
    if (w >= 761) { // sticky legal band: at each section anchor nothing below it may straddle its lower edge
      res.stickyClips = [];
      for (const id of SECTIONS.slice(1)) {
        await p.evaluate(id => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(350);
        await p.evaluate(() => dispatchEvent(new Event('scroll'))); await p.waitForTimeout(350);
        for (const f of await audit(p)) if (f.kind === 'sticky-clip') res.stickyClips.push({ at: id, ...f });
      }
      await p.screenshot({ path: `${out}/${key}-sticky.png` });
    }
    await p.waitForTimeout(300); await sectionHashes(p, key);
    if (vname === '1440') res.axe = await axe(p);
    if (vname === '375' && scheme === 'dark') {
      // legal band: tapping a mark on the phone strip labels it inline
      await p.locator('#legalSvg [data-id="ppwt-2008"]').tap();
      res.legalTap = await p.evaluate(() => { const t = document.getElementById('legalTap'); return { hidden: t.hidden, text: t.textContent.slice(0, 60) }; });
      await p.screenshot({ path: `${out}/phone-legal-tap.png`, clip: { x: 0, y: 0, width: 375, height: 800 } });
    }
    if (scheme === 'light' && vname === '1440') for (const k of ['A', 'B', 'C', 'L', 'legal']) {
      const svg = await p.evaluate(k => window.__cs.exportSVG(k), k); fs.writeFileSync(`exports/chart-${k}.svg`, svg);
      (res.exportAsOf ??= {})[k] = /Data as of SWF 9th ed\., Apr\. 2026/.test(svg) && /Source: SWF 2026/.test(svg);
    }
    return res;
  });
}

// 2. Desktop scenes: memory, live-scene audit, still export, keyboard flow.
await run('desktop-scenes', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, async p => {
  const res = { mem: [], sceneAudit: [] };
  await p.screenshot({ path: `${out}/desktop-dark-full.png`, fullPage: true });
  const t0 = Date.now(); await p.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 20000 }).catch(() => {});
  res.earthReady = await p.evaluate(() => window.__cs.earthReady()); res.earthWaitMs = Date.now() - t0;
  res.earthAfterLoad = await p.evaluate(u => { const e = performance.getEntriesByName(u)[0], n = performance.getEntriesByType('navigation')[0]; return e ? { start: Math.round(e.startTime), loadEvent: Math.round(n.loadEventEnd), kb: Math.round((e.transferSize || e.encodedBodySize) / 1024) } : null; }, await p.evaluate(() => window.__cs.EARTH_URL));
  await p.waitForTimeout(500); await p.screenshot({ path: `${out}/hero.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  res.baseMem = await p.evaluate(() => window.__cs.memory());
  res.heroAudit = await audit(p);
  for (const id of await p.evaluate(() => window.__cs.scenes)) {
    await p.evaluate(id => window.__cs.openScene(id), id); await p.waitForTimeout(2600);
    await p.screenshot({ path: `${out}/scene-${id}.png` });
    for (const f of await audit(p)) res.sceneAudit.push({ scene: id, ...f });
    // Visual regression for the WebGL scene: pause at a fixed scene time so the frame is comparable between runs.
    await p.evaluate(() => { const h = window.__cs.host(); h.playing = false; h.update(0.6); }); await p.waitForTimeout(700);
    await phash(p, `scene-${id}`, await p.locator('#sceneView').screenshot());
    if (PH_STILLS.includes(id)) await phash(p, `still-live-${id}`, await p.evaluate(() => window.__cs.exportStill()));
    (res.sceneText ??= {})[id] = await p.evaluate(() => ({ steps: document.querySelectorAll('#sceneSteps li').length, describedby: document.getElementById('sceneView').getAttribute('aria-describedby') }));
    if (id === 'fengyun') res.still = await p.evaluate(async () => { const u = await window.__cs.exportStill(); const img = new Image(); img.src = u; await img.decode(); return [img.width, img.height, Math.round(u.length / 1024)]; });
    res.mem.push([id, await p.evaluate(() => window.__cs.memory()), await p.evaluate(() => window.__cs.contexts())]);
    await p.evaluate(() => window.__cs.closeScene()); await p.waitForTimeout(300);
  }
  res.afterMem = await p.evaluate(() => window.__cs.memory()); res.canvases = await p.evaluate(() => window.__cs.contexts());
  await p.focus('#svgA [data-id="cn-2007-fy1c"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  res.kbOpen = await p.evaluate(() => document.getElementById('overlay').classList.contains('open'));
  res.inertWhileOpen = await p.evaluate(() => document.querySelector('main').inert);
  res.status = await p.evaluate(() => document.getElementById('scStatus').textContent);
  res.axeDialog = await axe(p);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  res.focusBack = await p.evaluate(() => document.activeElement?.dataset?.id);
  await p.hover('#legalSvg [data-id="itu-1992"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/desktop-hover-legal.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  // Shared time scale: the guide line for a legal item must sit at the same screen x in the legal band and in Chart A.
  res.guideX = await p.evaluate(() => { const x = sel => { const l = document.querySelector(sel + ' line.guide'); return l && l.style.display !== 'none' ? l.getBoundingClientRect().left : null; }; return { legal: x('#legalSvg'), chartA: x('#svgA') }; });
  res.guideEqual = res.guideX.legal != null && Math.abs(res.guideX.legal - res.guideX.chartA) < 0.6;
  await p.screenshot({ path: `${out}/legal-band-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 400 } });
  res.svgExports = await p.evaluate(() => ['A', 'B', 'C', 'L', 'legal'].map(k => window.__cs.exportSVG(k).length));
  res.perf = await p.evaluate(() => window.__cs.perf());
  return res;
});

// 3. Phone: scene opens from a chart tap; reduced motion gives static diagrams whose labels, export and dialog are audited.
await run('phone-scene', { viewport: { width: 375, height: 800 }, colorScheme: 'dark', hasTouch: true, isMobile: true }, async p => {
  await p.tap('#svgC [data-id="ru-2022-viasat"] .hit'); await p.waitForTimeout(2000);
  await p.screenshot({ path: `${out}/phone-scene.png` });
  return { overlay: await p.evaluate(() => document.getElementById('overlay').classList.contains('open')), hscroll: await hscroll(p) };
});
for (const [name, vp, mobile] of [['static-375', { width: 375, height: 800 }, true], ['static-1440', { width: 1440, height: 900 }, false]]) {
  await run(name, { viewport: vp, colorScheme: 'light', reducedMotion: 'reduce', isMobile: mobile, hasTouch: mobile }, async p => {
    const res = { sceneAudit: [], stills: [], hscroll: await hscroll(p), pageAudit: await audit(p) };
    for (const id of await p.evaluate(() => window.__cs.scenes)) {
      await p.evaluate(id => window.__cs.openScene(id), id); await p.waitForTimeout(400);
      for (const f of await audit(p)) res.sceneAudit.push({ scene: id, ...f });
      if (name === 'static-1440') {
        const url = await p.evaluate(() => window.__cs.exportStill());
        res.stills.push([id, await p.evaluate(async u => { const img = new Image(); img.src = u; await img.decode(); return img.width + 'x' + img.height; }, url)]);
        await phash(p, `still-static-${id}`, url);
      }
      if (name === 'static-1440' || name === 'static-375') await phash(p, `static-${name}-${id}`, await p.locator('#sceneView').screenshot());
      await p.evaluate(() => window.__cs.closeScene());
    }
    await p.evaluate(() => window.__cs.openScene('starfish')); await p.waitForTimeout(500);
    await p.screenshot({ path: `${out}/${name}-scene.png` });
    res.axeDialog = await axe(p);
    return res;
  });
}

// 4. Visual regression against the saved baseline (hashes of SVG sections).
fs.writeFileSync(`${out}/hashes.json`, JSON.stringify(hashes, null, 1));
if (process.env.BASELINE) fs.writeFileSync(BASELINE, JSON.stringify(hashes, null, 1));
if (fs.existsSync(BASELINE)) { const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')); 
  const ks = Object.keys(hashes), isP = k => k.startsWith('phash:'), perceptual = {};
  ks.filter(k => isP(k) && base[k]).forEach(k => { perceptual[k] = phDiff(hashes[k], base[k]); });
  report.visualRegression = { changed: ks.filter(k => !isP(k) && base[k] && base[k] !== hashes[k]), perceptualChanged: Object.keys(perceptual).filter(k => perceptual[k] > PH_TOL), perceptualMaxDiff: Math.max(0, ...Object.values(perceptual)), perceptualChecked: Object.keys(perceptual).length, tolerance: PH_TOL, missing: ks.filter(k => !base[k]) }; }
else report.visualRegression = 'no baseline (run with BASELINE=1 to create tools/qa-baseline.json)';

console.log(JSON.stringify(report, null, 1));
await browser.close(); srv.close();
