// Page screenshots for design review.
//   FILE=path/to/index.html OUT=dir VPS=1440x900,390x844 THEMES=dark,light SECTIONS=top,legalBand,chartA node tools/snap.mjs
// FILE defaults to ./index.html. SECTIONS are element ids (or "top"); each is scrolled to the top of the window and the window is captured.
// FULL=1 also writes a full-page image per theme and size. Names: <OUT>/<theme>-<w>x<h>-<section>.png. Prints one line per file.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.env.FILE || 'index.html');
const out = path.resolve(process.env.OUT || 'snaps');
const vps = (process.env.VPS || '1440x900,390x844').split(',').map((v) => v.split('x').map(Number));
const themes = (process.env.THEMES || 'dark,light').split(',');
const sections = (process.env.SECTIONS || 'top,legalBand,chartA,chartC,chartR,chartB,lag,sources').split(',');
fs.mkdirSync(out, { recursive: true });

const srv = http.createServer((q, r) => {
  if (q.url === '/' || q.url.startsWith('/?')) {
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return fs.createReadStream(file).pipe(r);
  }
  r.writeHead(404);
  r.end();
});
await new Promise((ok) => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
try {
  for (const theme of themes) {
    for (const [w, h] of vps) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        const f = window.__cs?.fontsReady;
        return typeof f === 'function' ? f() : f;
      });
      await page.waitForTimeout(800);
      for (const s of sections) {
        await page.evaluate((id) => {
          if (id === 'top') return window.scrollTo(0, 0);
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' }); // honours the section's scroll-margin-top, like a real link
        }, s);
        await page.waitForTimeout(450);
        const f = `${out}/${theme}-${w}x${h}-${s}.png`;
        await page.screenshot({ path: f });
        console.log(f);
      }
      if (process.env.FULL) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const f = `${out}/${theme}-${w}x${h}-full.png`;
        await page.screenshot({ path: f, fullPage: true });
        console.log(f);
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  srv.close();
}
