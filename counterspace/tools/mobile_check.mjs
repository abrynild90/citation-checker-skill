// Engine checks with touch emulation. This is not physical iPhone or VoiceOver testing.
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import path from 'node:path';
const engine = process.env.BROWSER || 'chromium',
  out = process.env.OUT;
if (out) fs.mkdirSync(out, { recursive: true });
const html = fs.readFileSync('index.html');
const server = http.createServer((q, r) => {
  r.setHeader('Content-Type', 'text/html');
  r.end(html);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await { chromium, webkit }[engine].launch(
  engine === 'chromium' ? { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : {},
);
const reports = [];
try {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: theme });
    const p = await ctx.newPage(),
      errors = [];
    if (engine === 'chromium') {
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    p.on('pageerror', (e) => errors.push(e.message));
    await p.addInitScript(() => {
      window.__shifts = PerformanceObserver.supportedEntryTypes.includes('layout-shift') ? [] : null;
      if (window.__shifts)
        new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && window.__shifts.push(e.value))).observe({
          type: 'layout-shift',
          buffered: true,
        });
    });
    await p.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
    await p.goto(url);
    await p.waitForFunction(() => window.__cs);
    await p.addScriptTag({ path: new URL('node_modules/axe-core/axe.min.js', import.meta.url).pathname });
    await p.locator('#firstLookOpen').tap();
    await p.locator('#firstLookNext').tap();
    assert.equal(await p.locator('#firstLookTreaty').isVisible(), true);
    await p.locator('#firstLookNext').tap();
    assert.match(await p.locator('#firstLookCopy').textContent(), /does not show/);
    await p.locator('#firstLook').evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
    if (out) await p.screenshot({ path: path.join(out, `${engine}-${theme}-intro.png`) });
    assert.deepEqual(await p.evaluate(async () => (await axe.run(document.getElementById('firstLook'))).violations.map((v) => v.id)), []);
    await p.locator('#xct-chartB').click({ force: true });
    await p.locator('#chartB').evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await p.waitForFunction(() => document.getElementById('capPhoneRows').children.length > 0);
    assert.equal(await p.locator('#svgB').isVisible(), false);
    assert.equal(await p.locator('#capPhoneRows h5').count(), 2);
    assert.match(await p.locator('#capPhoneRows').textContent(), /12 states/);
    await p.locator('#capDecade').selectOption('1950s');
    assert.match(await p.locator('#capPhoneNote').textContent(), /did not assess/);
    await p.locator('#capDecade').selectOption('2020s');
    await p.locator('#grpMore').tap();
    assert.equal(await p.locator('#capPhoneRows h5').count(), 5);
    if (out) await p.locator('#capPhone').screenshot({ path: path.join(out, `${engine}-${theme}-capabilities.png`) });
    assert.deepEqual(await p.evaluate(async () => (await axe.run(document.getElementById('chartB'))).violations.map((v) => v.id)), []);
    await p.locator('#capHistory').tap();
    assert.equal(await p.locator('#svgB').isVisible(), true);
    await p.locator('#capHistory').tap();
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(500);
    for (const id of ['rpo', 'solwind']) {
      await p.evaluate((id) => window.__cs.openScene(id), id);
      await p.waitForTimeout(800);
      const more = p.locator('#sceneMore');
      assert.equal(await more.isVisible(), true);
      const r = await more.boundingBox();
      assert.ok(r.height >= 44 && r.y + r.height < 844 && r.x >= 0 && r.x + r.width <= 390);
      await more.tap();
      assert.equal(await more.getAttribute('aria-expanded'), 'true');
      await more.tap();
      if (out) await p.screenshot({ path: path.join(out, `${engine}-${theme}-${id}.png`) });
      await p.locator('#slSource').tap();
      assert.equal(await p.locator('#slPop .sl-links a').isVisible(), true);
      await p.locator('#slSource').tap();
      await p.locator('#scClose').tap();
      await p.waitForTimeout(500);
    }
    // Orientation and text-size adjustment exercise reflow, not physical iOS Dynamic Type.
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 375, height: 667 },
    ]) {
      await p.setViewportSize(viewport);
      await p.waitForTimeout(200);
      await p.evaluate(() => window.__cs.openScene('rpo'));
      await p.waitForTimeout(500);
      await p.locator('#sceneMore').click();
      assert.equal(await p.locator('#sceneMore').getAttribute('aria-expanded'), 'true');
      await p.locator('#scClose').click();
      await p.waitForTimeout(400);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await p.addStyleTag({ content: 'html { -webkit-text-size-adjust: 200%; text-size-adjust: 200%; }' });
    await p.locator('#firstLookOpen').click();
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await p.locator('#firstLookBack').focus();
    await p.keyboard.press('Enter');
    assert.equal(await p.locator('[data-look="1"]').getAttribute('aria-current'), 'step');
    if (out) await p.screenshot({ path: path.join(out, `${engine}-${theme}-enlarged-text.png`) });
    assert.deepEqual(errors, []);
    reports.push({
      engine,
      theme,
      cpuThrottling: engine === 'chromium' ? '4x synthetic slowdown' : 'none',
      checks:
        'intro, decade/filter data, full history, touch full account and source, orientation, 200% CSS text-size adjustment, keyboard navigation, axe accessibility, no document overflow',
      layoutShift: await p.evaluate(() => window.__shifts?.reduce((a, b) => a + b, 0) ?? null),
      timing: await p.evaluate(() =>
        performance.getEntriesByType('navigation').map((n) => ({ domContentLoaded: n.domContentLoadedEventEnd, load: n.loadEventEnd })),
      ),
    });
    await ctx.close();
  }
  console.log(JSON.stringify(reports, null, 2));
  if (out) fs.writeFileSync(path.join(out, `${engine}-mobile-check.json`), JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
  server.close();
}
