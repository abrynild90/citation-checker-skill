// Fast health check of a built page (about 30 s): node tools/smoke.mjs   (FILE=index.html PORT=9310 SCENE=starfish)
// Fails on: page errors, console errors, horizontal scroll at 390 and 1440, a missing landmark id, a scene that will not open or close.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.env.FILE || 'index.html');
const PORT = +(process.env.PORT || 9310);
const scene = process.env.SCENE || 'starfish';
const IDS = [
  'tourBtn',
  'themeBtn',
  'expDark',
  'heroStage',
  'legalBand',
  'chartA',
  'chartC',
  'chartR',
  'chartB',
  'lag',
  'sources',
  'overlay',
  'card',
  'svgA',
  'svgB',
  'svgC',
  'svgR',
  'svgL',
];
const srv = http
  .createServer((q, r) => {
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(r);
  })
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
let bad = 0;
const fail = (m) => {
  bad++;
  console.log('FAIL', m);
};
try {
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => fail(`${w}: page error: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') fail(`${w}: console error: ${m.text().slice(0, 200)}`);
    });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(
      (ids) => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, missing: ids.filter((i) => !document.getElementById(i)) }),
      IDS,
    );
    if (r.sw > r.iw) fail(`${w}: horizontal scroll (${r.sw} > ${r.iw})`);
    if (r.missing.length) fail(`${w}: missing ids ${r.missing.join(', ')}`);
    if (w === 1440) {
      await page.evaluate((id) => window.__cs.openScene(id), scene);
      await page.waitForTimeout(2500);
      const open = await page.evaluate(() => document.getElementById('overlay').getAttribute('aria-hidden'));
      if (open !== 'false') fail(`scene ${scene} did not open (aria-hidden=${open})`);
      await page.evaluate(() => window.__cs.closeScene());
      await page.waitForTimeout(600);
      const closed = await page.evaluate(() => document.getElementById('overlay').getAttribute('aria-hidden'));
      if (closed !== 'true') fail(`scene ${scene} did not close (aria-hidden=${closed})`);
    }
    await page.close();
    console.log(`${w}x${h} checked`);
  }
} finally {
  await browser.close();
  srv.close();
}
console.log(bad ? `${bad} problem(s)` : 'smoke OK');
process.exit(bad ? 1 : 0);
