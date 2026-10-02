// Lists the characters the page sets in Newsreader (serif), so tools/subset_fonts.py can trim the font to exactly those.
//   NODE_PATH=tools/node_modules node tools/serif_chars.mjs <built index.html>   (writes fonts/newsreader-chars.json)
// Sources: every rendered text node whose computed font-family is Newsreader (h1, h2, lede, chart-head p, scene caption, methodology), after
// opening the methodology and each scene so lazily built text exists, plus the scene configs' title and caption (the canvas still draws the
// title in Newsreader 600; the live caption is the cfg.caption). Roman and italic are reported separately.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const html = fs.readFileSync(process.argv[2]);
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(html); }).listen(0);
const port = srv.address().port;
const CFG = path.join(R, 'src/scenes/configs');
const ids = fs.readdirSync(CFG).flatMap((f) => [...fs.readFileSync(path.join(CFG, f), 'utf8').matchAll(/^  id: '([\w-]+)',$/gm)].map((m) => m[1]));
const roman = new Set(), ital = new Set();
const add = (s, set) => { for (const ch of s) set.add(ch.codePointAt(0)); };
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
for (const w of [1440, 375]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await p.goto(`http://localhost:${port}/`);
  await p.waitForFunction(() => window.__cs && performance.getEntriesByName('cs:first-draw-done').length, null, { timeout: 60000 });
  await p.evaluate(async () => { for (const y of [0, 1e4, 2e4, 4e4]) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 400)); } });
  const grab = () => p.evaluate(() => {
    const out = { roman: '', ital: '' }, wk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = wk.nextNode()); ) {
      const cs = getComputedStyle(n.parentElement);
      if (!/^"?Newsreader/.test(cs.fontFamily)) continue;
      out[cs.fontStyle === 'italic' ? 'ital' : 'roman'] += n.textContent;
    }
    return out;
  });
  let g = await grab(); add(g.roman, roman); add(g.ital, ital);
  for (const id of ids) {
    await p.evaluate((i) => window.__cs.openScene(i), id).catch(() => 0);
    await p.waitForTimeout(300);
    g = await grab(); add(g.roman, roman); add(g.ital, ital);
    await p.evaluate(() => window.__cs.closeScene()).catch(() => 0);
  }
}
await b.close(); srv.close();
const dir = CFG;
for (const f of fs.readdirSync(dir)) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const m of src.matchAll(/^  (title|caption):\s*((?:'(?:[^'\\]|\\.)*'(?:\s*\+\s*)?\s*)+),$/gm)) add(new Function('return ' + m[2])(), roman);
}
const out = { roman: [...roman].sort((a, c) => a - c), italic: [...ital].sort((a, c) => a - c) };
fs.writeFileSync(path.join(R, 'fonts/newsreader-chars.json'), JSON.stringify(out) + '\n');
console.log('roman', out.roman.length, String.fromCodePoint(...out.roman), '\nitalic', out.italic.length, String.fromCodePoint(...out.italic));
