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
    if (width <= 400) {
      await page.evaluate(() => window.__cs.showTab('chartR'));
      const clipped = await page.evaluate(() => {
        const svg = document.querySelector('#svgR svg'), edge = svg.getBoundingClientRect();
        return [...svg.querySelectorAll('.band-gloss')].filter(el => el.getBoundingClientRect().right > edge.right + 1).map(el => el.textContent);
      });
      assert.deepEqual(clipped, [], `${width}: close-approach headers clipped`);
      const clippedHandoff = await page.evaluate(() => {
        const edge = document.querySelector('#svgA svg').getBoundingClientRect();
        return [...document.querySelectorAll('#svgA .handoff text')].filter(el => el.getBoundingClientRect().right > edge.right + 1).map(el => el.textContent);
      });
      assert.deepEqual(clippedHandoff, [], `${width}: destructive-test annotation clipped`);
    }
    await page.evaluate(() => { location.hash = 'srcCite'; });
    await page.waitForFunction(() => document.getElementById('srcDetails').open);
    await page.locator('#sourceFind').fill('NO_MATCH_SOURCE_13579');
    assert.equal(await page.locator('#citedSources > li:visible').count(), 0);
    assert.match(await page.locator('#sourceCount').textContent(), /try a different/);
    await page.locator('#sourceFind').fill('');
    assert.equal(await page.locator('#citedSources > li:visible').count(), await page.locator('#citedSources > li').count());
    assert.equal(await page.locator('#sceneChoose option').count(), 14);
    assert.equal(await page.locator('#legalChoose option').count(), 20);
    await page.locator('#legalChoose').selectOption('ost-1967');
    assert.equal(await page.locator('#legalChoice').isVisible(), true);
    assert.match(await page.locator('#legalChoice').innerText(), /Outer Space Treaty/);
    await page.locator('#clearLawChoice').click();
    assert.equal(await page.locator('#legalChoice').isVisible(), false);
    // Reading a dense chart must not depend on selecting a small SVG mark.
    const findA = page.locator('#chartA .record-find');
    await findA.locator('summary').click();
    await findA.locator('input').fill('fengyun 2007');
    assert.equal(await findA.locator('select option').count(), 2);
    await findA.locator('select').selectOption({ index: 1 });
    assert.match(await findA.locator('.record-result').innerText(), /880 km/);
    assert.equal(await findA.locator('.record-result a[href^="https://"]').count() > 0, true);
    await findA.locator('input').fill('NO_MATCH_RECORD_13579');
    assert.equal(await findA.locator('select').isDisabled(), true);
    assert.equal(await findA.locator('.record-result').isVisible(), false);
    await findA.locator('input').fill('');
    await findA.locator('summary').click();
    await page.evaluate(() => window.__cs.showTab('chartB'));
    await page.locator('#chartB .record-find > summary').click();
    assert.equal(await page.locator('#stateAssessment option').count(), 14);
    await page.locator('#stateAssessment').selectOption('Russia');
    assert.match(await page.locator('#chartB .record-result').innerText(), /Direct-ascent weapons\s+Demonstrated/);
    await page.locator('#chartB .record-find > summary').click();
    if (width <= 400) {
      await page.evaluate(() => window.__cs.openScene('starfish'));
      await page.waitForFunction(() => document.getElementById('overlay').getAttribute('aria-hidden') === 'false');
      assert.equal(await page.locator('#sceneStepsBox').isVisible(), false);
      await page.locator('#sceneStepChoose').selectOption('1');
      assert.equal(await page.locator('#sceneStepsBox').isVisible(), true);
      await page.locator('#scClose').click();
      await page.locator('.reading-nav select').selectOption('quizBand');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'quizBand');
      assert.equal(await page.locator('.reading-nav').isVisible(), true);
    }
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
  await live.locator('#sceneStepChoose').selectOption('1');
  const selectedTime = await live.evaluate(() => window.__cs.host().t);
  assert.equal(await live.evaluate(() => window.__cs.host().playing), false);
  assert.equal(selectedTime > 0, true);
  await live.setViewportSize({ width: 390, height: 844 });
  await live.locator('#sceneMore').click();
  assert.equal(await live.locator('#scenePanel').evaluate(el => el.classList.contains('reading-account')), true);
  assert.equal(await live.evaluate(() => window.__cs.host().playing), false);
  await live.locator('#sceneMore').click();
  assert.equal(await live.locator('#scenePanel').evaluate(el => el.classList.contains('reading-account')), false);
  await live.evaluate(() => { window.__cs.host().playing = false; window.__cs.closeScene(); });
  await live.waitForFunction(() => document.getElementById('overlay').getAttribute('aria-hidden') === 'true');
  assert.deepEqual(liveErrors, []); assert.deepEqual(liveRemote, []);
  console.log('offline live 3D OK');
  await live.close();
} finally { await browser.close(); server.close(); }
console.log('behavioral regressions OK');
