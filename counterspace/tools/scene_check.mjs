// Scene collision / framing checker for the 13 WebGL scenes, their static SVG diagrams and their PNG stills.
//   NODE_PATH=tools/node_modules OUT=<dir> PORT=9122 node tools/scene_check.mjs
// Env: ONLY=id,id (scene filter)  CAMS=0,1 (camera-preset filter)  VPS=1440,900,375  TS=0.08,0.2,0.3,...  MODES=live,static,still,hero,stillapi
//      SHOT=1 (save a PNG per state)  QUIET=1  ROOT=<dir holding the index.html to test, default .>  OUT=<dir>  PORT=<port>
// (stillapi: every still, live and static, must be exactly 3000x1875.)
// Every state is (scene x camera preset x t x viewport) for live scenes; static SVG at each viewport; live and static stills at 1440.
// FAILURES (each is a hard failure, exit code 1 if any):
//   label-overlap    two label boxes overlap                 label-reserved  a label sits on the banner, status caption or hint chip
//   label-mark       a label covers a drawn sprite           label-edge      a label box is within 8 px of the frame edge
//   label-disc       a label box overlaps the Earth disc although a clear slot exists within reach (leader <= limit, <= 0.10 W away)
//   leader-long      leader longer than 0.17 W (0.27 W at 375)      leader-cross  a leader crosses another label box or leader
//   leader-end       the leader ends on empty space (no drawn referent within a few px) or on another labelled referent
//   ref-small        a labelled craft/satellite is drawn < 6 px on the default camera            action-small  action region < 20% of the frame (default
//                    camera; sides count at least 40%)
//   ref-hidden       a labelled craft is visible in the sim but off frame or behind Earth on some camera
//   banner-wrap      the "illustrative" banner wraps to two lines at 375   audit  the page audit() reports overlapping/clipped text
//   leader-cross     (also) two leaders that touch or run within 2.5 px of each other away from their ends
//   label-detached   a label with no leader sits more than max(30 px, 0.05 W) from its referent
//   status-early     the status line describes the collision/detonation before its event time (cfg.hit.t or EVENTS below) + 0.02
//   status-count     a number in the 375 px status line is missing from the 1440 px status for the same scene/camera/t (viewport-dependent count)
//   status-wrap      the status caption wraps to a second line (any width)      no-impact  after the hit no impact/debris label survives
//   key-out          a key object (KEY table: KA-SAT, MSTI-3, White Sands, ...) is off frame, behind Earth or under the caption on the default camera
//   shell-crop       a shell ring/glow is cut by the frame edge or the footer in a still or the hero (fully inside, or fully covering the frame, only)
//   still-res        a still's Earth is under 1.5x supersampled relative to the viewport it was exported from (checked at 375 too)
//   burst-edge       default camera: a burst ring / debris point touches the frame edge (4 px margin)
//   static-font      a static diagram's text is drawn under 9 px (footer note included)
//   static-ring-clip a ring-fit static diagram (DN-2, SJ-21) has a point of its orbit within 4 px of, or outside, the panel edge
//   craft-area       a static craft icon (measured silhouette; on screen at every width and in the static-still print layout) is over its share of the disc
//                    (3% for context craft and every icon in Starfish/Solwind/GNSS; a subject 20%), or covers the Earth centre in those three
//   marker-size      a static marker (site/airliner/satellite/jammer, craft and site alike) is over the global cap (22 px at W=798, scaled, 10-24) unless
//                    declared in MARKER_OVR
//   orbit-thru-centre  a static orbit drawn as a thin straight chord through the Earth's centre (edge-on ring: the plane must be viewed obliquely)
//   subject-small    a labelled craft is drawn under 22 px (default camera) or under 44 px (follow camera, 30 px at 375)
//   preset-match     an episode preset (cfg.acts camera with `act`) shows its own episode at every t (host time inside the episode's range)
//   preset-empty     every camera preset x t in 0.1..0.9: the scene's primary subject(s) (labelled craft, burst, debris cloud) are drawn at that t but none
//                    projects
//                    inside the viewport at >= 8 px (6 px at 375); also checked on stills: subject centred (still-centre) and label font (still-font)
//   still-earth      an Earth-scale live still (Starfish, Solwind, Fengyun, Burnt Frost, Shakti) has the Earth disc under 62% of the body height
//   still-empty      a still has an empty band (no content) over more than 20% of its body height or width
//   still-crop       a still shows a whole-globe composition (multi-tile composites exempt) (disc radius < 55% of the frame) with the Earth partly cropped
//                    (50-98.5% visible); a deliberate close-up is exempt
//   hero-small       hero live at >= 900 px: the outer ring spans under 70% of the stage width
//   hero-iss         hero live: the ISS marker is missing, or drawn under 12 px while on screen and not behind the Earth
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { check, shellCrop, KEY, EVENTS } from './scene_check/rules.mjs';
import { LIVE, SUBJ, SSX, STATIC, EMPTY, discVisible } from './scene_check/collectors.mjs';

const root = path.resolve(process.env.ROOT || '.'),
  out = process.env.OUT || 'scene_check_out',
  PORT = +(process.env.PORT || 9122);
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const VPS = (process.env.VPS || '1440,900,375').split(',').map(Number);
const TS = (process.env.TS || '0.08,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.85,0.9').split(',').map(Number);
const CAMS = (process.env.CAMS || '').split(',').filter(Boolean).map(Number);
const MODES = (process.env.MODES || 'live,static,still,hero').split(',');
const SHOT = !!process.env.SHOT,
  QUIET = !!process.env.QUIET;
fs.mkdirSync(out, { recursive: true });
const srv = http
  .createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]),
      f = path.join(root, u === '/' ? 'index.html' : u);
    fs.readFile(f, (e, b) => {
      if (e) {
        r.writeHead(404);
        r.end();
      } else {
        r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
        r.end(b);
      }
    });
  })
  .listen(PORT);
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--ignore-certificate-errors'],
});

// ---------------------------------------------------------------- run
const results = [],
  failCount = {},
  pageErrs = [],
  statusByVp = {};
const record = (tag, F, extra = {}) => {
  results.push({ tag, F, ...extra });
  for (const x of F) {
    const k = x.type;
    failCount[k] = (failCount[k] || 0) + 1;
  }
  if (F.length && !QUIET)
    console.log(
      tag,
      F.length,
      F.slice(0, 6)
        .map((x) => `${x.type}:${x.detail}`)
        .join(' | '),
    );
};
const ctxOpts = (w, extra = {}) => ({
  viewport: { width: w, height: w <= 400 ? 800 : w <= 900 ? 800 : 900 },
  colorScheme: 'dark',
  ignoreHTTPSErrors: true,
  isMobile: w < 640,
  hasTouch: w < 640,
  ...extra,
});
async function boot(w, extra) {
  const ctx = await browser.newContext(ctxOpts(w, extra)),
    page = await ctx.newPage(),
    errs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text());
  });
  (page.on('pageerror', (e) => pageErrs.push('pageerror [' + curTag + ']: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 6).join(' | '))),
    page.on('pageerror', (e) => errs.push('pageerror [' + curTag + ']: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page, errs };
}
const ids = async (page) => (await page.evaluate(() => window.__cs.scenes)).filter((i) => !ONLY.length || ONLY.includes(i));
let curTag = '';
const tag = (...a) => (curTag = a.join('-'));
const camActs = (page) =>
  page.evaluate(() => {
    const h = window.__cs.host();
    return {
      cams: h.sim.cams.map((c) => ({ name: c.name, act: c.act ?? null, auto: !!c.auto, ref: c.ref, follow: !!c.follow && c.ref !== false })),
      acts: h.sim.cfg.acts || null,
    };
  });

if (MODES.includes('live'))
  for (const w of VPS) {
    const { ctx, page, errs } = await boot(w);
    for (const id of await ids(page)) {
      curTag = 'open-' + id;
      await page.evaluate((id) => window.__cs.openScene(id), id);
      await page.waitForTimeout(900);
      const { cams, acts } = await camActs(page);
      for (let ci = 0; ci < cams.length; ci++) {
        // preset-empty: every preset keeps its subject framed across the whole timeline
        if ((CAMS.length && !CAMS.includes(ci)) || cams[ci].ref === false) continue; // ref:false = a map view of ground markers, no craft subject
        for (const t of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
          await page.evaluate(
            ({ ci, t }) => {
              const h = window.__cs.host();
              h.playing = false;
              h._lm = {};
              h.pickCam(ci);
              h.update(t);
              h.update(t);
            },
            { ci, t },
          );
          const q = await page.evaluate(SUBJ),
            F = [];
          // preset-match: an episode preset shows its own episode at every t (the host maps any t into the episode's range)
          if (cams[ci].act != null) {
            const ht = await page.evaluate(() => window.__cs.host().t),
              a = acts[cams[ci].act];
            if (!(ht >= a.t0 - 1e-6 && ht <= a.t1 + 1e-6))
              F.push({ type: 'preset-match', detail: `"${cams[ci].name}" t=${t}: host time ${ht.toFixed(3)} is outside its episode ${a.t0}-${a.t1}` });
          }
          if (q.drawn && !q.ok)
            F.push({ type: 'preset-empty', detail: `"${cams[ci].name}" t=${t}: subject not in frame (${q.refs.join('; ') || 'no craft'})` });
          record(tag('preset', id, w, 'c' + ci, 't' + t), F, { W: w });
        }
      }
      for (let ci = 0; ci < cams.length; ci++) {
        const c = cams[ci];
        if (CAMS.length && !CAMS.includes(ci)) continue;
        let tl = TS;
        if (c.act != null) tl = TS.filter((t) => t >= acts[c.act].t0 && t < acts[c.act].t1);
        if (!tl.length) tl = [acts[c.act].t0 + 0.05];
        for (const t of tl) {
          await page.evaluate(
            ({ ci, t }) => {
              const h = window.__cs.host();
              h.playing = false;
              h._lm = {};
              h.pickCam(ci);
              h.update(t);
              h.update(t);
            },
            { ci, t },
          );
          const S = await page.evaluate(LIVE, cams[ci].ref === false || !(ci === 0 || cams[ci].follow) ? [] : (KEY[id] || []).map((r) => r.source));
          S.def = ci === 0;
          S.kind = 'live';
          S.follow = !!cams[ci].follow;
          S.evT = EVENTS[id]?.t ?? S.hitT;
          S.evRe = EVENTS[id]?.re;
          if (ci !== 0) S.action = undefined;
          else S.action = S.probe.action;
          const F = check(S);
          (statusByVp[`${id}|c${ci}|t${t}`] ||= {})[w] = S.status;
          const nm = tag('live', id, w, 'c' + ci, 't' + t);
          record(nm, F, { W: w });
          if (SHOT) await page.locator('#sceneView').screenshot({ path: `${out}/${id}-${w}-c${ci}-t${t}.png` });
        }
      }
      await page.evaluate(() => window.__cs.closeScene());
      await page.waitForTimeout(150);
    }
    if (errs.length) console.log('console errors', w, errs.slice(0, 5));
    await ctx.close();
  }
if (MODES.includes('static'))
  for (const w of VPS) {
    const { ctx, page, errs } = await boot(w, { reducedMotion: 'reduce' });
    for (const id of await ids(page)) {
      await page.evaluate((id) => window.__cs.openScene(id), id);
      for (let k = 0; k < 20; k++) {
        await page.waitForTimeout(400);
        if ((await page.evaluate(() => document.querySelector('#sceneView > svg')?.dataset.earth)) === 'bluemarble') break;
      }
      await page.waitForTimeout(300);
      const S = await page.evaluate(STATIC);
      if (!S) {
        record(tag('static', id, w), [{ type: 'audit', detail: 'no static svg' }]);
        continue;
      }
      S.kind = 'static';
      S.id = id;
      S.def = false;
      S.action = undefined;
      S.resX = await page.evaluate(SSX);
      const parts = S.panels ? S.panels.map((p) => ({ ...S, ...p, kind: 'static', def: false, action: undefined, audit: null })) : [S];
      if (S.panels)
        parts.forEach((p, i) => {
          if (i) p.resX = null;
        });
      if (S.panels && S.audit) parts[0].audit = S.audit;
      record(tag('static', id, w), parts.flatMap(check), { W: w, earth: S.earth });
      if (SHOT) await page.locator('#sceneView').screenshot({ path: `${out}/static-${id}-${w}.png` });
      if (w === 1440) {
        const url = await page.evaluate(() => window.__cs.exportStill());
        fs.writeFileSync(`${out}/still-static-${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
        const sl = await page.evaluate(() => {
          const z = window.__cs.lastStillLay;
          return z && z.probe ? { W: z.W, H: z.H, probe: { crafts: z.probe.crafts, disc: z.probe.disc } } : null;
        });
        if (sl)
          record(tag('still-static-craft', id), check({ kind: 'static-still', id, W: sl.W, H: sl.H, labels: [], reserved: [], probe: sl.probe }), { W: w });
        const eb = await page.evaluate(EMPTY, url);
        record(tag('still-static', id), check({ kind: 'still', W: 1000, H: 1000, labels: [], reserved: [], emptyBand: eb.band, emptyArea: eb.area }), { W: w });
      }
      await page.evaluate(() => window.__cs.closeScene());
      await page.waitForTimeout(100);
    }
    if (errs.length) console.log('console errors static', w, errs.slice(0, 5));
    await ctx.close();
  }

// ---------------------------------------------------------------- hero (overview): live WebGL and the static diagram, at every viewport
const HEROLIVE = () => {
  const h = window.__cs.host(),
    T = h.T,
    W = h.el.clientWidth,
    H = h.el.clientHeight,
    cp = h.camera.position;
  const P = h._probe(W, H);
  let iss = null;
  for (const { it, obj } of h.dyn)
    if (it.iss && obj.visible) {
      obj.getWorldPosition(new T.Vector3());
      const p = new T.Vector3();
      obj.getWorldPosition(p);
      const q = p.clone().project(h.camera),
        occ = (() => {
          const d = [p.x - cp.x, p.y - cp.y, p.z - cp.z],
            L = Math.hypot(...d),
            u = d.map((c) => c / L),
            b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2],
            dd = b * b - (cp.lengthSq() - 1);
          return dd >= 0 && -b - Math.sqrt(dd) > 0 && -b - Math.sqrt(dd) < L - 1e-3;
        })();
      const m = P.pts.find((m) => m.i === h.sim.items.indexOf(it));
      iss = { occ, px: m ? m.r * 2 : 0, on: Math.abs(q.x) < 1 && Math.abs(q.y) < 1 };
    }
  return { iss };
};
if (MODES.includes('hero'))
  for (const w of VPS) {
    const { ctx, page, errs } = await boot(w);
    await page.evaluate(() => {
      const b = document.getElementById('heroRot');
      b && !b.hidden ? b.click() : document.getElementById('heroStage').dispatchEvent(new Event('pointerenter'));
    });
    await page
      .waitForFunction(
        () => {
          const h = window.__cs.host();
          return h && h.sim && h.sim.cfg.spin && h.dyn;
        },
        null,
        { timeout: 30000 },
      )
      .catch(() => {});
    await page.waitForTimeout(1200);
    await page.locator('#heroStage').scrollIntoViewIfNeeded();
    // The page's hero is now an SVG timeline picture (hero-timeline.js); nothing mounts the live globe in it, so there is no live hero to measure.
    const liveHero = await page.evaluate(() => {
      const h = window.__cs.host();
      return !!(h && typeof h.update === 'function' && h.sim?.cfg.spin);
    });
    for (const t of liveHero ? [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95] : []) {
      await page.evaluate((t) => {
        const h = window.__cs.host();
        h.playing = false;
        h._lm = {};
        h.update(t);
        h.update(t);
      }, t);
      const S = await page.evaluate(LIVE, []);
      S.def = false;
      S.kind = 'hero';
      S.action = undefined;
      S.u = 1;
      const F = check(S),
        hc = await page.evaluate(HEROLIVE);
      S.shellCrop = shellCrop(S.probe.circles, S.W, S.H, true);
      S.heroSpan = Math.max(0, ...(S.probe.circles || []).filter((c) => c.ring).map((c) => 2 * c.r)) / S.W;
      {
        const hp = check(S);
        F.length = 0;
        F.push(...hp);
      }
      if (hc.iss && !hc.iss.occ && hc.iss.on && hc.iss.px < 12) F.push({ type: 'hero-iss', detail: `ISS marker ${hc.iss.px.toFixed(0)} px at t=${t}` });
      if (!hc.iss) F.push({ type: 'hero-iss', detail: `no ISS marker at t=${t}` });
      record(tag('hero-live', w, 't' + t), F, { W: w });
      if (SHOT) await page.locator('#heroStage').screenshot({ path: `${out}/hero-live-${w}-t${t}.png` });
    }
    await ctx.close();
    const b2 = await boot(w, { reducedMotion: 'reduce' });
    await b2.page.waitForTimeout(800);
    const S2 = await b2.page.evaluate(STATIC, '#heroStage');
    // the hero picture is the SVG timeline (hero-timeline.js), not a globe diagram: the static-diagram rules do not apply to it
    if (!S2) record(tag('hero-static', w), []);
    else {
      S2.kind = 'static';
      S2.def = false;
      S2.action = undefined;
      S2.resX = await b2.page.evaluate(SSX, '#heroStage');
      record(tag('hero-static', w), check(S2), { W: w });
      if (SHOT) await b2.page.locator('#heroStage').screenshot({ path: `${out}/hero-static-${w}.png` });
    }
    await b2.ctx.close();
  }
if (MODES.includes('still')) {
  const { ctx, page, errs } = await boot(1440);
  for (const id of await ids(page)) {
    await page.evaluate((id) => window.__cs.openScene(id), id);
    await page.waitForTimeout(700);
    const stillT = await page.evaluate(() => {
      const h = window.__cs.host();
      return h.sim.still;
    });
    const r = await page.evaluate(async () => {
      const h = window.__cs.host();
      h.playing = false;
      h._lm = {};
      h.update(h.sim.still);
      const url = h.stillPNG('Title', 'SWF 2026, Table 5-1, p. 05-01.'),
        z = h.stillLayout;
      const conv = (q) => ({
        W: q.W,
        H: q.H,
        u: q.u,
        leadW: q.leadW,
        labels: q.labels.filter(Boolean).map((l) => ({
          text: l.text,
          x0: l.x - l.w / 2,
          x1: l.x + l.w / 2,
          y0: l.y - l.h / 2,
          y1: l.y + l.h / 2,
          leader: l.leader ? [l.ax, l.ay, l.qx, l.qy] : null,
          ref: [l.ax, l.ay],
          raw: q.raw && q.raw[q.labels.indexOf(l)],
          item: -1,
        })),
        reserved: (q.rsv || []).map((r, i) => ({ n: 'rsv' + i, x0: r[0], y0: r[1], x1: r[0] + r[2], y1: r[1] + r[3] })),
        probe: q.probe,
      });
      return { url, tiles: (z.tiles || [z]).map(conv) };
    });
    fs.writeFileSync(`${out}/still-live-${id}.png`, Buffer.from(r.url.split(',')[1], 'base64'));
    const eb = await page.evaluate(EMPTY, r.url);
    const F = r.tiles.flatMap((t) =>
      check({
        kind: 'still',
        id,
        leadW: t.leadW,
        u: t.u ?? t.W / 1000,
        W: t.W,
        H: t.H,
        labels: t.labels,
        reserved: t.reserved,
        probe: t.probe,
        def: false,
        shellCrop: shellCrop(t.probe && t.probe.circles, t.W, t.H),
        emptyBand: eb.band,
        emptyArea: eb.area,
        discVis: discVisible(t.probe && t.probe.disc, t.W, t.H),
        discBig: r.tiles.length > 1 || !!(t.probe && t.probe.disc && t.probe.disc.r >= 0.55 * Math.min(t.W, t.H)),
      }),
    );
    // stills are ~3000 px wide: the pixel rules are scaled by u (label font scale) so the limits mean the same thing as in the live frame
    record(tag('still-live', id), F, { stillT });
    await page.evaluate(() => window.__cs.closeScene());
    await page.waitForTimeout(100);
  }
  if (errs.length) console.log('console errors still', errs.slice(0, 5));
  await ctx.close();
}
// viewport-dependent counts: every number the 375 px status states must also appear in the 1440 px status for the same (scene, camera, t)
{
  const nums = (x) => (x || '').replace(/(\d),(\d)/g, '$1$2').match(/\d+(?:\.\d+)?/g) || [];
  for (const [k, v] of Object.entries(statusByVp)) {
    const hi = v[Math.max(...Object.keys(v).map(Number))],
      lo = v[Math.min(...Object.keys(v).map(Number))];
    if (hi == null || lo == null || Object.keys(v).length < 2) continue;
    const H = new Set(nums(hi)),
      bad = nums(lo).filter((n) => !H.has(n));
    if (bad.length)
      record('status-count-' + k, [
        { type: 'status-count', detail: `375 px says ${bad.join(',')} but 1440 px says "${hi.slice(0, 80)}" vs "${lo.slice(0, 60)}"` },
      ]);
  }
}
if (MODES.includes('stillapi')) await stillApiCheck();
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results));
const total = results.reduce((n, r) => n + r.F.length, 0) + pageErrs.length;
console.log('page errors', pageErrs.length, pageErrs.slice(0, 5));
console.log(`\nstates ${results.length}, failing states ${results.filter((r) => r.F.length).length}, failures ${total}`, JSON.stringify(failCount));
await browser.close();
srv.close();
process.exit(total ? 1 : 0);

// ---- still API check (MODES=stillapi): window.__cs.host().stillPNG works in reduced motion (static) and every still is exactly 3000x1875
async function stillApiCheck() {
  const dims = async (page, url) =>
    page.evaluate(
      (u) =>
        new Promise((r) => {
          const i = new Image();
          i.onload = () => r([i.width, i.height]);
          i.src = u;
        }),
      url,
    );
  for (const [mode, extra] of [
    ['static', { reducedMotion: 'reduce' }],
    ['live', {}],
  ]) {
    const { ctx, page } = await boot(1440, extra);
    for (const id of await ids(page)) {
      await page.evaluate((id) => window.__cs.openScene(id), id);
      await page.waitForTimeout(mode === 'static' ? 1500 : 700);
      const url = await page.evaluate(async () => {
        try {
          return await window.__cs.host().stillPNG('Title', 'Cite');
        } catch (e) {
          return 'ERR ' + e.message;
        }
      });
      const F = [];
      if (!url || url.startsWith('ERR')) F.push({ type: 'still-api', detail: String(url) });
      else {
        const [w, h] = await dims(page, url);
        if (w !== 3000 || h !== 1875)
          F.push({ type: 'still-api', detail: `still ${w}x${h}, every still (live, RPO composite and static) must be exactly 3000x1875` });
      }
      record(tag('still-api-' + mode, id), F, {});
      await page.evaluate(() => window.__cs.closeScene());
      await page.waitForTimeout(100);
    }
    await ctx.close();
  }
}
