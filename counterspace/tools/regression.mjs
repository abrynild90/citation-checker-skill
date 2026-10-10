// Behavioral regressions: offline boot, fragment navigation, accessible tabs and downloads.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';
const html = fs.readFileSync(new URL('../index.html', import.meta.url));
const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const width of process.env.VPS ? process.env.VPS.split(',').map(Number) : [375, 900, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [], remote = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'warning' && msg.text().includes('labels unplaced')) errors.push(msg.text()); });
    await page.route('**/*', route => {
      if (route.request().url().startsWith(url)) return route.continue();
      remote.push(route.request().url()); return route.abort();
    });
    await page.goto(url + '#%E0%A4%A');
    await page.waitForFunction(() => window.__cs && document.querySelector('#svgA svg'));
    await page.evaluate(() => window.__cs.audit());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: overflow`);
    const clippedAltitudeLabels = await page.evaluate(() => [...document.querySelectorAll('#svgA .axis .tick text')].filter(el => el.getBoundingClientRect().left < document.getElementById('svgA').getBoundingClientRect().left - 1).map(el => el.textContent));
    assert.deepEqual(clippedAltitudeLabels, [], `${width}: clipped altitude labels`);
    for (const id of ['chartC', 'chartR', 'chartB', 'lag']) {
      await page.evaluate(id => { location.hash = id; }, id);
      await page.waitForFunction(id => !document.getElementById(id).hasAttribute('data-off'), id);
      assert.equal(await page.locator(`#tab-${id}`).getAttribute('aria-selected'), 'true');
    }
    await page.evaluate(() => { location.hash = 'srcCite'; });
    await page.waitForFunction(() => document.getElementById('srcDetails').open);
    for (const k of ['A', 'B', 'C', 'R', 'L', 'legal']) {
      const svg = await page.evaluate(k => window.__cs.exportSVG(k), k);
      if (process.env.EXPORTS && width === 1440) fs.writeFileSync(`exports/chart-${k}.svg`, svg);
      assert.match(svg, /<svg/); assert.equal(await page.evaluate(svg => {
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        return !!doc.querySelector('parsererror') || [...doc.querySelectorAll('*')].some(el => [...el.attributes].some(a => /\b(?:NaN|undefined)\b/.test(a.value)));
      }, svg), false, `${width}: invalid SVG ${k}`);
    }
    if (width === 1440) {
      await page.evaluate(() => { location.hash = ''; scrollTo(0, 0); document.activeElement?.blur(); });
      for (let n = 0; n < 200; n++) {
        await page.keyboard.press('Tab');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const covered = await page.evaluate(() => {
          const a = document.activeElement, band = document.getElementById('legalBand');
          if (a.closest('#legalBand, #rail, #overlay, #card, .skip') || band.classList.contains('off')) return false;
          const b = band.getBoundingClientRect(), r = a.getBoundingClientRect();
          return b.top <= 1 && b.bottom > 0 && r.top >= 0 && r.top < b.bottom - 2 && r.bottom > b.top;
        });
        assert.equal(covered, false, `keyboard focus covered at stop ${n}`);
      }
    }
    await page.addScriptTag({ path: new URL('node_modules/axe-core/axe.min.js', import.meta.url).pathname });
    const violations = await page.evaluate(async () => (await axe.run(document)).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
    console.log(width, JSON.stringify({ errors, remote, violations }));
    assert.deepEqual(errors, []); assert.deepEqual(remote, []); assert.deepEqual(violations, []);
    if (width === 1440) await page.screenshot({path:'/tmp/counterspace-page.png',fullPage:true});
    await page.close();
  }
  const live = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const liveErrors = [], liveRemote = [];
  live.on('pageerror', e => liveErrors.push(e.message));
  await live.route('**/*', route => {
    if (route.request().url().startsWith(url)) return route.continue();
    liveRemote.push(route.request().url()); return route.abort();
  });
  await live.goto(url);
  await live.waitForFunction(() => window.__cs && document.querySelector('#svgA svg'));
  await live.evaluate(() => window.__cs.openScene('starfish'));
  await live.waitForFunction(() => window.__cs.host() && window.__cs.earthReady());
  await live.evaluate(() => { window.__cs.host().playing = false; window.__cs.closeScene(); });
  await live.waitForFunction(() => document.getElementById('overlay').getAttribute('aria-hidden') === 'true');
  assert.deepEqual(liveErrors, []); assert.deepEqual(liveRemote, []);
  console.log('offline live 3D OK');
  await live.close();
} finally { await browser.close(); server.close(); }
console.log('behavioral regressions OK');
