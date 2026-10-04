// Load performance of a built page: node tools/perf.mjs   (FILE=index.html PORT=9311 VP=1440x900 RUNS=3)
// Prints median first contentful paint, largest contentful paint, layout shift, long-task time, page weight and DOM size. Software rendering, so compare runs, not absolutes.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.env.FILE || 'index.html');
const PORT = +(process.env.PORT || 9311);
const [W, H] = (process.env.VP || '1440x900').split('x').map(Number);
const RUNS = +(process.env.RUNS || 3);
const srv = http
  .createServer((q, r) => {
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(r);
  })
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const rows = [];
try {
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    const page = await ctx.newPage();
    let bytes = 0;
    page.on('response', async (r) => {
      try {
        bytes += (await r.body()).length;
      } catch {}
    });
    await page.addInitScript(() => {
      window.__perf = { lcp: 0, cls: 0, longMs: 0 };
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__perf.lcp = e.startTime))).observe({
        type: 'largest-contentful-paint',
        buffered: true,
      });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (window.__perf.cls += e.value))).observe({
        type: 'layout-shift',
        buffered: true,
      });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__perf.longMs += Math.max(0, e.duration - 50)))).observe({
        type: 'longtask',
        buffered: true,
      });
    });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => ({
      ...window.__perf,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      nodes: document.getElementsByTagName('*').length,
    }));
    rows.push({ ...m, bytes });
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.close();
}
const f = (k) => med(rows.map((r) => r[k]));
console.log(
  `fcp ${Math.round(f('fcp'))} ms | lcp ${Math.round(f('lcp'))} ms | cls ${f('cls').toFixed(3)} | blocking ${Math.round(f('longMs'))} ms | transferred ${Math.round(f('bytes') / 1024)} KB | dom ${f('nodes')} nodes`,
);
