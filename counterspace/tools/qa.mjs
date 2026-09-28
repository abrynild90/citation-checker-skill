// QA: node tools/qa.mjs  (serves ./ on :8765)
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('.'); const out = process.env.OUT || 'qa';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); } }); }).listen(8765);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });
const report = {};
async function run(name, opts, fn) {
  const ctx = await browser.newContext(opts); const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const r = await fn(page); report[name] = { errs, ...r }; await ctx.close();
}
const hscroll = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await run('desktop-dark', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, async p => {
  await p.screenshot({ path: `${out}/desktop-dark-full.png`, fullPage: true });
  const res = { hscroll: await hscroll(p), mem: [] };
  // Earth imagery must arrive after the page's load event, not as part of the page.
  const t0 = Date.now(); await p.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 20000 }).catch(() => {});
  res.earthReady = await p.evaluate(() => window.__cs.earthReady()); res.earthWaitMs = Date.now() - t0;
  res.earthAfterLoad = await p.evaluate(u => { const e = performance.getEntriesByName(u)[0], n = performance.getEntriesByType('navigation')[0]; return e ? { start: Math.round(e.startTime), loadEvent: Math.round(n.loadEventEnd), kb: Math.round((e.transferSize || e.encodedBodySize) / 1024) } : null; }, await p.evaluate(() => window.__cs.EARTH_URL));
  await p.waitForTimeout(500); await p.screenshot({ path: `${out}/hero.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  const base = await p.evaluate(() => window.__cs.memory());
  res.baseMem = base;
  for (const id of await p.evaluate(() => window.__cs.scenes)) {
    await p.evaluate(id => window.__cs.openScene(id), id); await p.waitForTimeout(2600);
    await p.screenshot({ path: `${out}/scene-${id}.png` });
    if (id === 'fengyun') res.still = await p.evaluate(async () => { const h = window.__cs.host(); const u = h.stillPNG('Test', 'cite'); const img = new Image(); img.src = u; await img.decode(); return [img.width, img.height, Math.round(u.length / 1024)]; });
    res.mem.push([id, await p.evaluate(() => window.__cs.memory()), await p.evaluate(() => window.__cs.contexts())]);
    await p.evaluate(() => window.__cs.closeScene()); await p.waitForTimeout(300);
  }
  res.afterMem = await p.evaluate(() => window.__cs.memory()); res.canvases = await p.evaluate(() => window.__cs.contexts());
  // keyboard open: focus a Chart A mark with a scene and press Enter
  await p.focus('#svgA [data-id="cn-2007-fy1c"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  res.kbOpen = await p.evaluate(() => document.getElementById('overlay').classList.contains('open'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  res.focusBack = await p.evaluate(() => document.activeElement?.dataset?.id);
  // hover legal item
  await p.hover('#legalSvg [data-id="itu-1992"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/desktop-hover-legal.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  res.svgExports = await p.evaluate(() => ['A', 'B', 'C', 'L', 'legal'].map(k => window.__cs.exportSVG(k).length));
  return res;
});
await run('desktop-light', { viewport: { width: 1440, height: 900 }, colorScheme: 'light' }, async p => {
  await p.screenshot({ path: `${out}/desktop-light-full.png`, fullPage: true });
  for (const k of ['A', 'B', 'C', 'L', 'legal']) fs.writeFileSync(`exports/chart-${k}.svg`, await p.evaluate(k => window.__cs.exportSVG(k), k));
  return { hscroll: await hscroll(p) };
});
await run('phone-dark', { viewport: { width: 375, height: 800 }, colorScheme: 'dark', hasTouch: true, isMobile: true }, async p => {
  await p.screenshot({ path: `${out}/phone-dark-full.png`, fullPage: true });
  await p.tap('#svgC [data-id="ru-2022-viasat"] .hit'); await p.waitForTimeout(2000);
  await p.screenshot({ path: `${out}/phone-scene.png` });
  return { hscroll: await hscroll(p), overlay: await p.evaluate(() => document.getElementById('overlay').classList.contains('open')) };
});
await run('phone-light-reduced', { viewport: { width: 375, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' }, async p => {
  await p.screenshot({ path: `${out}/phone-light-reduced.png`, fullPage: true });
  await p.evaluate(() => window.__cs.openScene('starfish')); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/reduced-scene.png` });
  return { hscroll: await hscroll(p), canvases: await p.evaluate(() => window.__cs.contexts()) };
});
console.log(JSON.stringify(report, null, 1));
await browser.close(); srv.close();
