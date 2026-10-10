// Actual browser controls: interruption, deterministic pause, replay and tour cancellation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';
const html = fs.readFileSync(new URL('../index.html', import.meta.url));
const server = http.createServer((q, r) => {
  r.setHeader('Content-Type', 'text/html');
  r.end(html);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
    await page.goto(url);
    await page.waitForFunction(() => window.__cs && document.querySelector('#svgA svg'));
    await page.addScriptTag({ path: new URL('node_modules/axe-core/axe.min.js', import.meta.url).pathname });
    for (const id of await page.evaluate(() => window.__cs.scenes)) {
      await page.evaluate((id) => window.__cs.openScene(id), id);
      await page.waitForFunction(() => window.__cs.host()?.scene && window.__cs.earthReady());
      // Aircraft headings sample nearby positions. A retired aircraft has no position on one side of its boundary.
      await page.evaluate(() => {
        const h = window.__cs.host();
        for (const it of h.sim.items.filter((it) => it.kind === 'point' && it.shape === 'aircraft')) {
          for (let k = 0; k <= 500; k++) {
            const t = k / 500;
            if (it.pos(t) && (!it.pos(Math.min(1, t + 0.004)) || !it.pos(Math.max(0, t - 0.004)))) h.update(t);
          }
        }
      });
      if (width === 390) await page.locator('#sceneStepChoose').selectOption('1');
      else await page.locator('#sceneSteps li[data-i="1"] .step').click();
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: step pauses`);
      assert.equal(await page.locator('#scPlay').getAttribute('aria-label'), 'Play');
      assert.equal(
        await page.locator('#sceneCurrentStep').textContent(),
        await page.locator('#sceneStepChoose option:checked').getAttribute('data-description'),
      );
      await page.locator('#scPlay').click();
      await page.locator('#scCams button[data-i]').nth(1).click();
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: view pauses`);
      await page.waitForFunction(() => !window.__cs.host()._tw, { timeout: 10000 });
      // Playback is idle after pausing; late image decoding may still request one draw.
      const idle = await page.evaluate(() => ({ t: window.__cs.host().t, raf: window.__cs.host().raf }));
      assert.equal(idle.raf, 0);
      await page.waitForTimeout(250);
      assert.deepEqual(await page.evaluate(() => ({ t: window.__cs.host().t, raf: window.__cs.host().raf })), idle, `${id}: pause is idle`);
      await page.locator('#scPlay').click();
      if (await page.locator('#scMoreViews').isVisible()) {
        await page.locator('#scMoreViews').click();
        assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: camera menu pauses`);
        await page.keyboard.press('Escape');
        await page.locator('#scPlay').click();
      }
      const box = await page.locator('#sceneView canvas').first().boundingBox();
      await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.up();
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: drag pauses`);
      const t = await page.evaluate(() => window.__cs.host().t);
      await page.waitForTimeout(120);
      assert.equal(await page.evaluate(() => window.__cs.host().t), t, `${id}: drag release stays paused`);
      await page.locator('#scPlay').click();
      await page.locator('#scScrub').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: keyboard seek pauses`);
      const violations = await page.evaluate(async () => (await axe.run(document.getElementById('scenePanel'))).violations.map((v) => v.id));
      assert.deepEqual(violations, [], `${id}: accessibility`);
      if (width === 390) {
        assert.equal(await page.locator('#scScrub').evaluate((el) => el.getBoundingClientRect().width > 240), true, `${id}: phone seek track`);
        assert.equal(
          await page.locator('#sceneStepChoose option').evaluateAll((xs) => xs.every((x) => x.textContent.length < 40)),
          true,
          `${id}: concise step names`,
        );
        await page.locator('#slSource').click();
        assert.equal(await page.locator('#slPop #scExport').isVisible(), true, `${id}: save image remains reachable`);
        await page.locator('#slSource').click();
      }
      if (id === 'laser') {
        await page.evaluate(() => {
          const h = window.__cs.host();
          h.pickCam(3);
          h.interrupt();
        });
        assert.equal(await page.evaluate(() => window.__cs.host().t >= 0.78), true, 'Russia view selects its own account');
        await page.evaluate(() => {
          const h = window.__cs.host();
          h.pickCam(0);
          h.interrupt();
        });
        assert.equal(await page.evaluate(() => window.__cs.host().t < 0.78), true, 'MIRACL view selects its own account');
        if (width === 1440) await page.locator('#sceneSteps li').last().click();
        else await page.locator('#sceneStepChoose').selectOption(String((await page.locator('#sceneStepChoose option').count()) - 1));
        assert.equal(await page.evaluate(() => window.__cs.host().camIdx), 3, 'Peresvet step restores the Russia view');
      }
      const episodeButtons = page.locator('#sceneEpisodes button');
      for (let i = 0; i < (await episodeButtons.count()); i++) {
        await page.locator('#scPlay').click();
        await episodeButtons.nth(i).click();
        assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: episode interrupts playback`);
        assert.equal(await episodeButtons.nth(i).getAttribute('aria-pressed'), 'true', `${id}: episode selection follows picture`);
        const episodeMatches = await page.evaluate((i) => {
          const h = window.__cs.host(),
            a = h.sim.cfg.acts[i];
          return h.t >= a.t0 && h.t < a.t1;
        }, i);
        assert.equal(episodeMatches, true, `${id}: episode time remains within its story`);
        await page.waitForTimeout(120);
        assert.equal(
          await page.evaluate((i) => {
            const h = window.__cs.host(),
              a = h.sim.cfg.acts[i],
              steps = h.sim.cfg.status || h.sim.cfg.steps;
            return [...document.querySelectorAll('#sceneSteps li:not([hidden])')].every((li) => {
              const t = steps[Number(li.dataset.i)][0];
              return t >= a.t0 && t < a.t1;
            });
          }, i),
          true,
          `${id}: visible narrative belongs to selected episode`,
        );
        if (width === 1440) {
          assert.equal(
            await page.evaluate(() => {
              const current = document.querySelector('#sceneSteps .now').getBoundingClientRect();
              const list = document.getElementById('sceneSteps').getBoundingClientRect();
              return current.height > 0 && current.top >= list.top - 1 && current.bottom <= list.bottom + 1;
            }),
            true,
            `${id}: active episode step is fully visible`,
          );
        }
      }
      if (['starfish', 'laser', 'sj21-tug', 'viasat'].includes(id)) {
        await page.evaluate(() => window.__cs.host().interrupt());
        const diagramTime = await page.evaluate(() => window.__cs.host().t);
        await page.locator('#scDiagram').press('Enter');
        assert.equal(await page.locator('#sceneView > svg').getAttribute('data-explanation'), id, `${id}: diagram is accessible with keyboard`);
        assert.equal(await page.locator('#scPlay').isVisible(), false, `${id}: diagram has no running controls`);
        assert.equal(await page.evaluate(() => window.__cs.host().playing), false, `${id}: diagram pauses animation`);
        assert.deepEqual(await page.evaluate(() => window.__cs.audit().filter(x => /scene/.test(x.chart || ''))), [], `${id}: diagram labels fit`);
        const diagramViolations = await page.evaluate(async () => (await axe.run(document.getElementById('scenePanel'))).violations.map(v => v.id));
        assert.deepEqual(diagramViolations, [], `${id}: diagram accessibility`);
        await page.locator('#scDiagram').press('Enter');
        assert.equal(await page.locator('#sceneView > svg').count(), 0, `${id}: animation view returns`);
        assert.equal(await page.evaluate(() => window.__cs.host().t), diagramTime, `${id}: paused time is preserved`);
        assert.equal(await page.locator('#scPlay').getAttribute('aria-label'), 'Play', `${id}: returning stays paused`);
      }
      await page.locator('#scClose').click();
      console.log(width, id, 'controls, idle pause and accessibility OK');
    }
    // A single event ends on a useful diagram. Replay returns to the first step.
    await page.evaluate(() => window.__cs.openScene('laser'));
    await page.waitForFunction(() => window.__cs.host()?.scene);
    await page.evaluate(() => window.__cs.host().update(0.998));
    await page.waitForFunction(() => window.__cs.host()._ended);
    assert.equal(await page.locator('#scPlay').getAttribute('aria-label'), 'Replay');
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__cs.host().t), 1);
    await page.locator('#scScrub').focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#scPlay').getAttribute('aria-label'), 'Play');
    await page.evaluate(() => window.__cs.host().update(0.998));
    await page.locator('#scPlay').click();
    await page.waitForFunction(() => window.__cs.host()._ended);
    await page.locator('#scPlay').click();
    assert.equal(await page.evaluate(() => window.__cs.host().playing && window.__cs.host().t < 0.2), true);
    await page.locator('#scClose').click();
    // The automatic end-of-tour timer must also yield to a reader's view change.
    await page.evaluate(() => window.__cs.startTour());
    await page.waitForFunction(() => window.__cs.host()?.scene);
    await page.evaluate(() => window.__cs.host().update(0.998));
    // Act in the frame that finishes: a slow software-rendered CI click must not
    // accidentally arrive after the legitimate 1.6-second advance deadline.
    await page.waitForFunction(() => {
      if (!window.__cs.host()._ended) return false;
      document.querySelectorAll('#scCams button[data-i]')[1].click();
      return true;
    });
    await page.waitForTimeout(1800);
    assert.match(await page.locator('#sceneTitle').textContent(), /Starfish/);
    assert.equal(await page.evaluate(() => window.__cs.host().playing), false);
    await page.locator('#svTourStop').click();
    assert.equal(await page.evaluate(() => window.__cs.host().playing), false);
    await page.locator('#scPlay').click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.evaluate(() => window.__cs.host().playing), false);
    await page.locator('#scClose').click();
    // A lost graphics context replaces the failed animation with a useful source-qualified still.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      window.__cs.openScene('fengyun');
    });
    await page.waitForFunction(() => window.__cs.host()?.scene);
    await page.evaluate(() => window.__cs.host().renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(() => document.querySelector('#sceneView > svg'));
    assert.equal(await page.locator('#scPlay').isVisible(), false);
    assert.match(await page.locator('#scStatic').innerText(), /still diagram/i);
    await page.locator('#scClose').click();
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log('motion regressions OK');
