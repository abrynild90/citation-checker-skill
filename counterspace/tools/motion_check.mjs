// Actual browser controls: interruption, deterministic pause, replay and tour cancellation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';
const html = fs.readFileSync(new URL('../index.html', import.meta.url));
const server = http.createServer((q, r) => { r.setHeader('Content-Type', 'text/html'); r.end(html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({viewport: {width, height: width === 390 ? 844 : 1000}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.request().url().startsWith(url) ? r.continue() : r.abort());
    await page.goto(url);
    await page.waitForFunction(() => window.__cs && document.querySelector('#svgA svg'));
    await page.addScriptTag({path: new URL('node_modules/axe-core/axe.min.js', import.meta.url).pathname});
    for (const id of await page.evaluate(() => window.__cs.scenes)) {
      await page.evaluate(id => window.__cs.openScene(id), id);
      await page.waitForFunction(() => window.__cs.host()?.scene && window.__cs.earthReady());
      await page.locator('#sceneStepChoose').selectOption('1');
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: step pauses`);
      assert.equal(await page.locator('#scPlay').getAttribute('aria-label'), 'Play');
      assert.equal(await page.locator('#sceneCurrentStep').textContent(), await page.locator('#sceneStepChoose option:checked').textContent().then(s => s.replace(/^\d+\. /, '')));
      await page.locator('#scPlay').click();
      await page.locator('#scCams button[data-i]').nth(1).click();
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: view pauses`);
      await page.waitForFunction(() => !window.__cs.host()._tw, {timeout: 10000});
      // Playback is idle after pausing; late image decoding may still request one draw.
      const idle = await page.evaluate(() => ({t: window.__cs.host().t, raf: window.__cs.host().raf}));
      assert.equal(idle.raf, 0);
      await page.waitForTimeout(250);
      assert.deepEqual(await page.evaluate(() => ({t: window.__cs.host().t, raf: window.__cs.host().raf})), idle, `${id}: pause is idle`);
      await page.locator('#scPlay').click();
      const box = await page.locator('#sceneView canvas').first().boundingBox();
      await page.mouse.move(box.x + box.width * .45, box.y + box.height * .5);
      await page.mouse.down(); await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.up();
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: drag pauses`);
      const t = await page.evaluate(() => window.__cs.host().t);
      await page.waitForTimeout(120);
      assert.equal(await page.evaluate(() => window.__cs.host().t), t, `${id}: drag release stays paused`);
      await page.locator('#scPlay').click();
      await page.locator('#scScrub').focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: keyboard seek pauses`);
      const violations = await page.evaluate(async () => (await axe.run(document.getElementById('scenePanel'))).violations.map(v => v.id));
      assert.deepEqual(violations, [], `${id}: accessibility`);
      await page.locator('#scClose').click();
      console.log(width, id, 'controls, idle pause and accessibility OK');
    }
    // A single event ends on a useful diagram. Replay returns to the first step.
    await page.evaluate(() => window.__cs.openScene('laser'));
    await page.waitForFunction(() => window.__cs.host()?.scene);
    await page.evaluate(() => window.__cs.host().update(.998));
    await page.waitForFunction(() => window.__cs.host()._ended);
    assert.equal(await page.locator('#scPlay').getAttribute('aria-label'), 'Replay');
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__cs.host().t), 1);
    await page.locator('#scPlay').click();
    assert.equal(await page.evaluate(() => window.__cs.host().playing && window.__cs.host().t < .2), true);
    await page.locator('#scClose').click();
    // The automatic end-of-tour timer must also yield to a reader's view change.
    await page.evaluate(() => window.__cs.startTour());
    await page.waitForFunction(() => window.__cs.host()?.scene);
    await page.evaluate(() => window.__cs.host().update(.998));
    await page.waitForFunction(() => window.__cs.host()._ended);
    await page.locator('#scCams button[data-i]').nth(1).click();
    await page.waitForTimeout(1800);
    assert.match(await page.locator('#sceneTitle').textContent(), /Starfish/);
    assert.equal(await page.evaluate(() => window.__cs.host().playing), false);
    await page.locator('#svTourStop').click();
    assert.equal(await page.evaluate(() => window.__cs.host().playing), false);
    await page.locator('#scPlay').click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, value: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.evaluate(() => window.__cs.host().playing), false);
    await page.locator('#scClose').click();
    // A lost graphics context replaces the failed animation with a useful source-qualified still.
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, value: false}); window.__cs.openScene('fengyun'); });
    await page.waitForFunction(() => window.__cs.host()?.scene);
    await page.evaluate(() => window.__cs.host().renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(() => document.querySelector('#sceneView > svg'));
    assert.equal(await page.locator('#scPlay').isVisible(), false);
    assert.match(await page.locator('#scStatic').innerText(), /still diagram/i);
    await page.locator('#scClose').click();
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); server.close(); }
console.log('motion regressions OK');
