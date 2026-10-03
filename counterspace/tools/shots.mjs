// Capture scenes at chosen moments: node tools/shots.mjs
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
const out = process.env.OUT || 'qa';
fs.mkdirSync(out, { recursive: true });
const srv = http
  .createServer((q, r) =>
    fs.readFile(path.join('.', q.url === '/' ? 'index.html' : q.url), (e, b) => {
      r.writeHead(e ? 404 : 200);
      r.end(b);
    }),
  )
  .listen(8766);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8766/', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 20000 });
const shots = JSON.parse(
  process.env.SHOTS ||
    '[["fengyun",0.3],["fengyun",0.85],["cosmos1408",0.75],["laser",0.5],["starfish",0.2],["starfish",0.7],' +
      '["gnss",0.45],["viasat",0.75],["dn2",0.55],["solwind",0.4]]',
);
for (const [id, t] of shots) {
  await p.evaluate((id) => window.__cs.openScene(id), id);
  await p.waitForTimeout(700);
  await p.evaluate((t) => {
    const h = window.__cs.host();
    h.playing = false;
    h.update(t);
  }, t);
  await p.waitForTimeout(150);
  await p.locator('#sceneView').screenshot({ path: `${out}/${id}-${t}.png` });
  await p.evaluate(() => window.__cs.closeScene());
}
if (process.env.STILL) {
  await p.evaluate(() => window.__cs.openScene('fengyun'));
  await p.waitForTimeout(500);
  const u = await p.evaluate(() => {
    const h = window.__cs.host();
    h.playing = false;
    h.update(0.85);
    return h.stillPNG('Fengyun-1C (2007)', 'SWF 2026, Table 5-1, p. 05-01.');
  });
  fs.writeFileSync(`${out}/still.png`, Buffer.from(u.split(',')[1], 'base64'));
}
await b.close();
srv.close();
