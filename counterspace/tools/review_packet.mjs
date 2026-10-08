// Evidence packet for design review: one run captures the page and the 3D explainers in the sizes and themes a reviewer needs.
//   FILE=index.html OUT=dir PORT=9340 SCENES=starfish,fengyun,rpo,laser,sj21-tug,spaceplanes node tools/review_packet.mjs
// Writes (dark and light unless THEMES says otherwise):
//   page-<theme>-<w>x<h>-<section>.png   window captures of the top, each chapter and the sources
//   full-<theme>-<w>.png                 whole page (for the squint test)
//   reduced-<theme>-top.png              the top with reduced motion switched on
//   scene-<id>-<w>x<h>-t<time>.png       the open 3D explainer window at two moments
// Prints the list of files. The machine renders WebGL in software, so a full run takes several minutes.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.env.FILE || 'index.html');
const out = path.resolve(process.env.OUT || 'packet');
const PORT = +(process.env.PORT || 9340);
const themes = (process.env.THEMES || 'dark,light').split(',');
const scenes = (process.env.SCENES || 'starfish,fengyun,rpo,laser,sj21-tug,spaceplanes').split(',').filter(Boolean);
const sections = (process.env.SECTIONS || 'top,legalBand,chartA,pattern,chartC,chartR,chartB,lag,sources').split(',');
const times = (process.env.TIMES || '0.25,0.7').split(',').map(Number);
const sizes = [
  [1440, 900],
  [390, 844],
];
fs.mkdirSync(out, { recursive: true });
const srv = http
  .createServer((q, r) => {
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(r);
  })
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
const written = [];
const save = async (page, name, opts = {}) => {
  const f = path.join(out, name);
  await page.screenshot({ path: f, ...opts });
  written.push(f);
};
const ready = async (page) => {
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
};
try {
  for (const theme of themes) {
    for (const [w, h] of sizes) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
      await ready(page);
      for (const s of sections) {
        await page.evaluate(
          (id) => {
            window.__cs?.showTab?.(id); // a chart in "Explore the data" is a tab: open it first
            return id === 'top' ? window.scrollTo(0, 0) : document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
          },
          s,
        );
        await page.waitForTimeout(500);
        await save(page, `page-${theme}-${w}x${h}-${s}.png`);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await save(page, `full-${theme}-${w}.png`, { fullPage: true });
      await ctx.close();
    }
    const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    const rp = await rm.newPage();
    await ready(rp);
    await save(rp, `reduced-${theme}-top.png`);
    await rm.close();
  }
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await ready(page);
    for (const id of scenes) {
      await page.evaluate((id) => window.__cs.openScene(id), id);
      await page.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(1800);
      for (const t of times) {
        await page.evaluate((t) => {
          const hst = window.__cs.host?.();
          if (hst) {
            hst.playing = false;
            hst.update(t);
          }
        }, t);
        await page.waitForTimeout(500);
        await save(page, `scene-${id}-${w}x${h}-t${t}.png`);
      }
      await page.evaluate(() => window.__cs.closeScene());
      await page.waitForTimeout(500);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.close();
}
console.log(written.join('\n'));
