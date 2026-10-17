// Quiz layout-shift check: answering the four questions must change neither the page's scrollHeight nor the top of any card, the score row or the Sources heading.
//   node tools/quiz_shift_check.mjs        (FILE=index.html  PORT=9820  VPS=1152x900,1280x900,1440x900,1920x1080,375x800)
// Each width is run in both colour schemes and twice: two of four right (no flourish) and all four right (the flourish, the reward line and the primary buttons arrive).
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.env.FILE || 'index.html'),
  PORT = +(process.env.PORT || 9820),
  VPS = (process.env.VPS || '1100x900,1152x900,1280x900,1440x900,1600x900,1920x1080,375x800').split(',').map((v) => v.split('x').map(Number)),
  // option index of the right answer in each card (the options are laid out in display order): all four right, or the first option each time
  WINS = { all: [0, 1, 1, 0], some: [0, 0, 0, 0] };
const srv = http
  .createServer((q, r) =>
    fs.readFile(file, (e, b) => {
      r.writeHead(e ? 404 : 200, { 'content-type': 'text/html' });
      r.end(b);
    }),
  )
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
for (const [w, h] of VPS)
  for (const scheme of ['dark', 'light'])
    for (const [name, picks] of Object.entries(WINS)) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme }),
        p = await ctx.newPage();
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
      await p.evaluate((s) => (document.documentElement.dataset.theme = s), scheme);
      await p.waitForTimeout(500);
      const measure = () =>
        p.evaluate(() => {
          const top = (e) => Math.round(e.getBoundingClientRect().top + scrollY);
          return {
            scrollHeight: document.documentElement.scrollHeight,
            scrollWidth: document.documentElement.scrollWidth,
            cards: [...document.querySelectorAll('#quiz .q')].map(top),
            cardHeights: [...document.querySelectorAll('#quiz .q')].map((e) => Math.round(e.getBoundingClientRect().height)),
            foot: top(document.querySelector('#quiz .q-foot')),
            sources: top(document.getElementById('sources')),
          };
        });
      await p.evaluate(() => document.getElementById('quizBand').scrollIntoView());
      await p.waitForTimeout(300);
      const before = await measure();
      for (let i = 0; i < 4; i++) {
        await p.evaluate(([i, k]) => document.querySelectorAll('#quiz .q')[i].querySelectorAll('.q-opt')[k].click(), [i, picks[i]]);
        await p.waitForTimeout(120);
      }
      await p.waitForTimeout(2600);
      const after = await measure(),
        same = JSON.stringify(before) === JSON.stringify(after);
      if (!same || after.scrollWidth > w) bad++;
      console.log(`${w}x${h} ${scheme} ${name}: ${same ? 'no shift' : 'SHIFT ' + JSON.stringify(before) + ' -> ' + JSON.stringify(after)} (scrollHeight ${before.scrollHeight}, cards ${before.cards.join('/')})`);
      await ctx.close();
    }
await browser.close();
srv.close();
console.log(bad ? `quiz shift check FAILED (${bad})` : 'quiz shift check OK');
process.exit(bad ? 1 : 0);
