// contrast_check.mjs: verifies the colour-contrast nodes that axe-core cannot decide ("incomplete": text over images, gradients, overlapping elements).
// For each such node it hides all text, scrolls the node into view, screenshots its box (the real pixels behind the glyphs) and computes the contrast
// of the node's actual colour (fill or colour, times opacity) against those pixels. The reported figure is the 25th-percentile pixel, so a border or a
// gridline inside the box does not fail a label that sits on a good background. Thresholds: 4.5:1, or 3:1 for large text.
// Usage: NODE_PATH=tools/node_modules PORT=9950 [VPS=1440x900,1920x1080] [CDN_DIR=<d3.js three.js bm.jpg nt.jpg>] node tools/contrast_check.mjs        (exit code 1 when any node is below its threshold)
// Needs: jsdelivr (axe-core, test only, never shipped) and the page folder served by this script.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'),
  PORT = +(process.env.PORT || 9950),
  AXE = path.join(ROOT, 'tools/node_modules/axe-core/axe.min.js'),
  // VPS=1440x900,1920x1080 overrides the widths (each is checked in the dark and the light scheme)
  CONFIGS = process.env.VPS
    ? process.env.VPS.split(',').flatMap((v) => ['dark', 'light'].map((s) => [s, ...v.split('x').map(Number)]))
    : [
        ['dark', 1440, 900],
        ['light', 1440, 900],
        ['dark', 375, 800],
        ['light', 375, 800],
      ];
const server = http
  .createServer((q, r) => {
    const f = path.join(ROOT, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]);
    fs.readFile(f, (e, d) =>
      e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }), r.end(d)),
    );
  })
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
// Pixel maths runs in a blank page: decode the clip, blend the node's colour over each pixel, take the 25th-percentile contrast.
const maths = await browser.newPage();
const q25 = (b64, fg, opacity) =>
  maths.evaluate(
    async ([b64, fg, opacity]) => {
      const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4),
        lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
      const cv = new OffscreenCanvas(bmp.width, bmp.height),
        g = cv.getContext('2d');
      g.drawImage(bmp, 0, 0);
      const d = g.getImageData(0, 0, bmp.width, bmp.height).data,
        v = fg.match(/[\d.]+/g).map(Number),
        a = (v[3] ?? 1) * opacity,
        vals = [];
      for (let i = 0; i < d.length; i += 4) {
        const bg = [d[i], d[i + 1], d[i + 2]],
          eff = [0, 1, 2].map((k) => v[k] * a + bg[k] * (1 - a)),
          l1 = lum(...eff),
          l2 = lum(...bg);
        vals.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
      }
      vals.sort((x, y) => x - y);
      return vals[Math.floor(vals.length / 4)];
    },
    [b64, fg, opacity],
  );
const failures = [];
for (const [scheme, w, h] of CONFIGS) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  if (process.env.CDN_DIR) {
    const js = (f) => ({ path: process.env.CDN_DIR + '/' + f, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }),
      jpg = (f) => ({ path: process.env.CDN_DIR + '/' + f, contentType: 'image/jpeg', headers: { 'access-control-allow-origin': '*' } });
    await p.route('**/d3.min.js', (r) => r.fulfill(js('d3.js')));
    await p.route('**/three.module.js', (r) => r.fulfill(js('three.js')));
    await p.route('**/earth-blue-marble.jpg', (r) => r.fulfill(jpg('bm.jpg')));
    await p.route('**/earth-night.jpg', (r) => r.fulfill(jpg('nt.jpg')));
  }
  await p.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.evaluate((s) => (document.documentElement.dataset.theme = s), scheme);
  await p.waitForTimeout(800);
  await (process.env.AXE_FILE ? p.addScriptTag({ path: process.env.AXE_FILE }) : p.addScriptTag({ path: AXE }));
  const meta = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['incomplete', 'violations'] });
    window.__els = (r.incomplete[0]?.nodes || []).map((n) => document.querySelector(n.target[n.target.length - 1])).filter(Boolean);
    return {
      violations: r.violations.reduce((n, v) => n + v.nodes.length, 0),
      nodes: window.__els.map((el) => {
        const cs = getComputedStyle(el),
          svg = el instanceof SVGElement;
        let op = 1;
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
        if (svg) op *= parseFloat(cs.fillOpacity || 1);
        return {
          txt: (el.textContent || '').trim().slice(0, 40),
          fg: svg ? cs.fill : cs.color,
          op,
          size: parseFloat(cs.fontSize),
          weight: parseInt(cs.fontWeight),
        };
      }),
    };
  });
  await p.addStyleTag({
    content:
      '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent}' +
      'svg text,svg tspan{fill:transparent!important;stroke:none!important;paint-order:normal!important}',
  });
  await p.waitForTimeout(600);
  let min = 99,
    checked = 0;
  for (let i = 0; i < meta.nodes.length; i++) {
    const n = meta.nodes[i],
      need = n.size >= 24 || (n.size >= 18.66 && n.weight >= 700) ? 3 : 4.5;
    // scroll to the node, let the page settle, read its box and take the picture straight after (a box read before a layout shift would be a picture of something else)
    const attempt = async () => {
      await p.evaluate((i) => window.__els[i].scrollIntoView({ block: 'center', behavior: 'instant' }), i);
      await p.waitForTimeout(150);
      const r = await p.evaluate((i) => {
          const b = window.__els[i].getBoundingClientRect();
          return [b.left, b.top, b.width, b.height];
        }, i),
        x = Math.max(0, Math.floor(r[0])),
        y = Math.max(0, Math.floor(r[1])),
        cw = Math.min(w - x, Math.ceil(r[2]) + 1),
        ch = Math.min(h - y, Math.ceil(r[3]) + 1);
      if (cw <= 0 || ch <= 0 || y >= h) return null;
      return q25((await p.screenshot({ clip: { x, y, width: cw, height: ch } })).toString('base64'), n.fg, n.op);
    };
    let q = await attempt();
    if (q === null) continue;
    // A reading below the threshold is taken again, twice, after a pause: a part that fades in as it arrives, or a tile the software renderer has not painted yet
    // (a light checkerboard under the glyphs), would otherwise read as a failure. A real failure reads the same every time.
    for (const pause of [900, 2500]) {
      if (q >= need) break;
      await p.waitForTimeout(pause);
      q = Math.max(q, (await attempt()) ?? 0);
    }
    checked++;
    min = Math.min(min, q);
    if (q < need) failures.push({ scheme, w, text: n.txt, ratio: +q.toFixed(2), need, size: n.size, fg: n.fg });
  }
  console.log(`${scheme} ${w}px: axe violations ${meta.violations}, undecided nodes ${meta.nodes.length}, measured ${checked}, lowest ratio ${min.toFixed(2)}`);
  await p.close();
}
console.log(failures.length ? 'BELOW THRESHOLD:\n' + failures.map((f) => JSON.stringify(f)).join('\n') : 'all measured nodes meet their threshold');
await browser.close();
server.close();
process.exit(failures.length ? 1 : 0);
