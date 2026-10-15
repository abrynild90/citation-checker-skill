// Steps-list vs foot-buttons hit test. For EVERY scene that has a steps list, at nine desktop window sizes and t = 0.05 / 0.5 / 0.95 (sampled with the
// host paused) and again after one real click on a step row (real playback), the story column must satisfy:
//   * no element of the steps list (#sceneSteps, its box and the "more steps" cue) overlaps a visible foot button (About this picture, Where to go next,
//     Source, Diagram, Related law) and the list stays inside its own section;
//   * elementFromPoint at five points on each visible foot button returns the button (or a child of it): nothing covers it;
//   * the top of the steps list and the foot buttons do not move with t (layout never changes with the time or the "Did you know" line);
//   * the list shows at least 3 whole rows (or all of them, if the scene has fewer) and a row shows whole, not clipped by the box.
// Imported by regression.mjs (runs by default); also runnable alone:  PORT=9950 [VPS=1600x900,...] [ONLY=starfish] node tools/steps_hit_check.mjs
import fs from 'node:fs';
import http from 'node:http';

export const SIZES = [
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1500, 760],
  [1536, 864],
  [1600, 900],
  [1680, 1050],
  [1920, 1080],
  [2560, 1440],
];
export const TIMES = [0.05, 0.5, 0.95];
const FOOT = ['#svAboutBtn', '#svNextBtn', '#scRelated', '#slSource', '#scDiagram'];

// Runs in the page: everything measured for the open scene in its current state.
function measure(foot) {
  const box = (el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom };
    },
    seen = (el) => !el.closest('[hidden]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
    steps = document.getElementById('sceneSteps'),
    sec = document.getElementById('sceneStepsSection'),
    body = document.getElementById('asideBody');
  const out = { problems: [], top: null, sig: '', feet: {}, rows: 0, total: 0, mode: body.className.replace(/story-scroll/, '').trim() };
  if (!seen(steps)) return { ...out, none: true };
  const sb = box(steps),
    sc = box(sec);
  out.top = Math.round(sb.t * 10) / 10;
  const bodyBox = box(body),
    list = [steps, document.getElementById('sceneStepsBox'), ...(document.getElementById('stepsCue').hidden ? [] : [document.getElementById('stepsCue')])];
  // the list's visible window (a clipped window is cut at its last whole row)
  const clip = parseFloat((steps.style.clipPath.match(/inset\(0px 0px ([\d.]+)px/) || [])[1]) || 0,
    lb = { ...sb, b: sb.b - clip };
  if (lb.b > sc.b + 1.5) out.problems.push(`list bottom ${Math.round(lb.b)} is below its section bottom ${Math.round(sc.b)}`);
  const rows = [...steps.children].filter((li) => !li.hidden);
  out.total = rows.length;
  out.sig = rows.map((li) => li.dataset.i).join(','); // the episode: the rows it shows
  for (const li of rows) {
    const r = box(li);
    if (r.t >= lb.t - 1 && r.b <= lb.b + 1.5) out.rows++;
  }
  const need = Math.min(3, rows.length);
  if (out.rows < need) out.problems.push(`only ${out.rows} of ${rows.length} step rows show whole`);
  for (const sel of foot) {
    const el = document.querySelector(sel);
    if (!el || !seen(el)) continue;
    const b = box(el);
    // a button scrolled out of its column (or off the window) cannot be hit; the column scrolling is not an overlap of the list
    const clipped = b.b <= bodyBox.t || b.t >= bodyBox.b || b.b <= 0 || b.t >= innerHeight;
    if (sel !== '#slSource' && sel !== '#scDiagram' && clipped) continue;
    out.feet[sel] = Math.round(b.t * 10) / 10;
    for (const n of list) {
      const r = box(n);
      if (n === steps) r.b = lb.b;
      const w = Math.min(r.r, b.r) - Math.max(r.l, b.l),
        h = Math.min(r.b, b.b) - Math.max(r.t, b.t);
      if (w > 1 && h > 1) out.problems.push(`${n.id || n.className} overlaps ${sel} by ${Math.round(w)}x${Math.round(h)}px`);
    }
    const bw = b.r - b.l,
      bh = b.b - b.t,
      pts = [[0.5, 0.5], [0.15, 0.25], [0.85, 0.25], [0.15, 0.75], [0.85, 0.75]];
    for (const [fx, fy] of pts) {
      const x = b.l + bw * fx,
        y = b.t + bh * fy;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit !== el && !el.contains(hit)) {
        out.problems.push(`${sel} covered at (${Math.round(fx * 100)}%,${Math.round(fy * 100)}%) by ${hit ? (hit.id ? '#' + hit.id : hit.tagName + '.' + hit.className) : 'nothing'}`);
        break;
      }
    }
  }
  return out;
}

const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((res) => {
        let n = 0;
        const f = () => (++n >= 4 ? setTimeout(res, 120) : requestAnimationFrame(f));
        requestAnimationFrame(f);
      }),
  );

export async function runStepsHit(browser, url, { sizes = SIZES, only = [], log = () => {}, tag = 'steps-hit' } = {}) {
  const failures = [],
    rowsSeen = {};
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: 'dark' });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.route('**/*', (route) => (route.request().url().startsWith(url) ? route.continue() : route.abort()));
    await page.goto(url);
    await page.waitForFunction(() => window.__cs && window.__cs.earthReady(), null, { timeout: 30000 }).catch(() => {});
    const ids = (await page.evaluate(() => window.__cs.scenes)).filter((i) => !only.length || only.includes(i));
    for (const id of ids) {
      await page.evaluate((id) => window.__cs.openScene(id), id);
      await page.waitForFunction(() => document.getElementById('overlay').classList.contains('open')).catch(() => {});
      await page.waitForTimeout(250);
      await settle(page);
      const tops = {};
      const state = async (name) => {
        const m = await page.evaluate(measure, FOOT);
        if (m.none) return;
        const here = `${tag} ${id} ${w}x${h} ${name}`;
        for (const p of m.problems) failures.push(`${here}: ${p}`);
        // a laid-out column is the same at every time: the list and the foot buttons do not move
        // (a scene made of episodes fits its list to each episode's own rows: the comparison is between states that show the same rows)
        const key = { steps: m.top, ...m.feet };
        for (const [k, v] of Object.entries(key)) {
          const was = (tops[`${m.sig} ${k}`] ??= { v, name });
          if (Math.abs(was.v - v) > 1.5) failures.push(`${here}: ${k} top moved ${was.v} -> ${v} (was at ${was.name})`);
        }
        // rows left out of a window (with its "more steps" cue) at the worst state: reported, not failed, since a window is the designed fallback
        const r = (rowsSeen[`${id} ${w}x${h}`] ??= { hidden: 0, mode: m.mode });
        r.hidden = Math.max(r.hidden, m.total - m.rows);
      };
      for (const t of TIMES) {
        await page.evaluate((t) => {
          const host = window.__cs.host();
          host.playing = false;
          host.update(t);
          host.update(t);
        }, t);
        await settle(page);
        await state(`t=${t}`);
      }
      // real playback: one real click on a step row, then the same checks while the scene plays from there
      const row = page.locator('#sceneSteps li:not([hidden]) .step').nth(1);
      if (await row.isVisible().catch(() => false)) {
        await row.click({ timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(300);
        await settle(page);
        await state('after-step-click');
        await page.evaluate(() => {
          window.__cs.host().playing = false;
        });
      }
    }
    if (errs.length) failures.push(`${tag} ${w}x${h}: page errors ${errs.slice(0, 2).join(' | ')}`);
    log(`${tag} ${w}x${h}: ${ids.length} scenes checked`);
    await page.close();
  }
  return { failures, rows: rowsSeen };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { chromium } = await import('playwright');
  const html = fs.readFileSync(process.env.HTML || new URL('../index.html', import.meta.url));
  const srv = http.createServer((q, r) => ((r.setHeader('Content-Type', 'text/html'), r.end(html)))).listen(+(process.env.PORT || 9950), '127.0.0.1');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const sizes = process.env.VPS ? process.env.VPS.split(',').map((s) => s.split('x').map(Number)) : SIZES;
  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  const { failures, rows } = await runStepsHit(browser, `http://127.0.0.1:${srv.address().port}/`, { sizes, only, log: console.log });
  if (process.env.ROWS) console.log(JSON.stringify(rows, null, 1));
  failures.forEach((f) => console.log('FAIL', f));
  console.log(failures.length ? `${failures.length} failing` : 'steps hit test OK');
  await browser.close();
  srv.close();
  process.exit(failures.length ? 1 : 0);
}
