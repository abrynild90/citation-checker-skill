// Scene collision / framing checker for the 13 WebGL scenes, their static SVG diagrams and their PNG stills.
//   NODE_PATH=tools/node_modules OUT=<dir> PORT=9122 node tools/scene_check.mjs
// Env: ONLY=id,id (scene filter)  VPS=1440,900,375  TS=0.2,0.3,...  MODES=live,static,still  SHOT=1 (save a PNG per state)  QUIET=1
// Every state is (scene x camera preset x t x viewport) for live scenes; static SVG at each viewport; live and static stills at 1440.
// FAILURES (each is a hard failure, exit code 1 if any):
//   label-overlap    two label boxes overlap                 label-reserved  a label sits on the banner, status caption or hint chip
//   label-mark       a label covers a drawn sprite           label-edge      a label box is within 8 px of the frame edge
//   label-disc       a label box overlaps the Earth disc although a clear slot exists within reach (leader <= limit, <= 0.16 W away)
//   leader-long      leader longer than 0.22 W (0.30 W at 375)      leader-cross  a leader crosses another label box or leader
//   leader-end       the leader ends on empty space (no drawn referent within a few px) or on another labelled referent
//   ref-small        a labelled craft/satellite is drawn < 6 px on the default camera            action-small  action region < 20% of the frame (default camera)
//   ref-hidden       a labelled craft is visible in the sim but off frame or behind Earth on some camera
//   banner-wrap      the "illustrative" banner wraps to two lines at 375   audit  the page audit() reports overlapping/clipped text
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';

const root = path.resolve('.'), out = process.env.OUT || 'scene_check_out', PORT = +(process.env.PORT || 9122);
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const VPS = (process.env.VPS || '1440,900,375').split(',').map(Number);
const TS = (process.env.TS || '0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9').split(',').map(Number);
const MODES = (process.env.MODES || 'live,static,still').split(',');
const SHOT = !!process.env.SHOT, QUIET = !!process.env.QUIET;
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); } });
}).listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });

// ---------------------------------------------------------------- pure geometry / rules (Node side)
const boxHit = (a, b, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
const segSeg = (a, b) => {
  const d = (b[3] - b[1]) * (a[2] - a[0]) - (b[2] - b[0]) * (a[3] - a[1]);
  if (Math.abs(d) < 1e-9) return false;
  const ua = ((b[2] - b[0]) * (a[1] - b[1]) - (b[3] - b[1]) * (a[0] - b[0])) / d, ub = ((a[2] - a[0]) * (a[1] - b[1]) - (a[3] - a[1]) * (a[0] - b[0])) / d;
  return ua > 0.03 && ua < 0.97 && ub > 0.03 && ub < 0.97;
};
const segBox = (s, b) => { // segment vs box interior shrunk 1.5 px (Liang-Barsky)
  const l = b.x0 + 1.5, r = b.x1 - 1.5, t = b.y0 + 1.5, bt = b.y1 - 1.5; let u0 = 0, u1 = 1; const dx = s[2] - s[0], dy = s[3] - s[1];
  for (const [p, q] of [[-dx, s[0] - l], [dx, r - s[0]], [-dy, s[1] - t], [dy, bt - s[1]]]) {
    if (p === 0) { if (q < 0) return false; } else { const u = q / p; if (p < 0) { if (u > u1) return false; if (u > u0) u0 = u; } else { if (u < u0) return false; if (u < u1) u1 = u; } }
  }
  return u1 - u0 > 0.02;
};
const distPtSeg = (px, py, x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy, u = L ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L)) : 0; return Math.hypot(px - x1 - u * dx, py - y1 - u * dy); };
const boxDisc = (b, d) => { const dx = Math.max(b.x0 - d.cx, 0, d.cx - b.x1), dy = Math.max(b.y0 - d.cy, 0, d.cy - b.y1); return Math.hypot(dx, dy) < d.r - 2; };
const crossesCircle = (b, c) => { const dx0 = Math.max(b.x0 - c.cx, 0, c.cx - b.x1), dy0 = Math.max(b.y0 - c.cy, 0, c.cy - b.y1), fx = Math.max(Math.abs(b.x0 - c.cx), Math.abs(b.x1 - c.cx)), fy = Math.max(Math.abs(b.y0 - c.cy), Math.abs(b.y1 - c.cy)); return Math.hypot(dx0, dy0) < c.r + 2 && Math.hypot(fx, fy) > c.r - 2; };
const boxCircle = (b, c) => { const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1), dy = Math.max(b.y0 - c.y, 0, c.y - b.y1); return Math.hypot(dx, dy) < c.r; };

// S = {kind, W, H, labels:[{text, x0,y0,x1,y1, leader:[ax,ay,qx,qy]|null, item}], reserved:[{n,x0,y0,x1,y1}], probe, def (default camera), bannerLines}
function check(S) {
  const F = [], { W, H } = S, u = S.u || 1, L = S.labels, P = S.probe || {}, phone = W <= 400, lim = W * (phone ? 0.3 : 0.22);
  const f = (type, detail) => F.push({ type, detail });
  const B = L.map(l => ({ x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1 }));
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) if (boxHit(B[i], B[j], -0.5)) f('label-overlap', `${L[i].text} / ${L[j].text}`);
    for (const r of S.reserved || []) if (boxHit(B[i], r, -1)) f('label-reserved', `${L[i].text} on ${r.n}`);
    if (P.pts) for (const m of P.pts) if (boxCircle(B[i], m) && m.i !== L[i].item) f('label-mark', `${L[i].text} covers a sprite`);
    if (B[i].x0 < 7.5 * u || B[i].y0 < 7.5 * u || B[i].x1 > W - 7.5 * u || B[i].y1 > H - 7.5 * u) f('label-edge', `${L[i].text} (${Math.round(B[i].x0)},${Math.round(B[i].y0)})-(${Math.round(B[i].x1)},${Math.round(B[i].y1)})`);
    const ld = L[i].leader;
    if (ld) {
      const len = Math.hypot(ld[2] - ld[0], ld[3] - ld[1]);
      if (len > lim) f('leader-long', `${L[i].text} ${Math.round(len)} px > ${Math.round(lim)}`);
      for (let j = 0; j < L.length; j++) {
        if (j !== i && segBox(ld, B[j])) f('leader-cross', `${L[i].text} leader through label ${L[j].text}`);
        if (j > i && L[j].leader && segSeg(ld, L[j].leader)) f('leader-cross', `${L[i].text} x ${L[j].text}`);
      }
      // the end must sit on its own drawn referent
      if (P.pts || P.polys) {
        const [ax, ay] = ld; let near = false, other = null;
        for (const m of P.pts || []) if (Math.hypot(ax - m.x, ay - m.y) < m.r + 3) { if (m.i === L[i].item || L[i].item == null || L[i].item < 0) near = true; else other = other || m; }
        for (const c of P.polys || []) { for (let k = 0; k + 1 < c.p.length && !near; k++) if (distPtSeg(ax, ay, ...c.p[k], ...c.p[k + 1]) < 4.5) near = true; if (near) break; }
        if (!near) for (const c of P.cloud || []) if (Math.hypot(ax - c[0], ay - c[1]) < 7) { near = true; break; }
        if (!near) for (const d of P.domes || []) if (Math.hypot(ax - d.x, ay - d.y) < d.r) { near = true; break; }
        if (!near) for (const c of P.circles || []) if (Math.abs(Math.hypot(ax - c.cx, ay - c.cy) - c.r) < 7) { near = true; break; }
        if (!near) for (const m of P.marks || []) if (Math.hypot(ax - m.x, ay - m.y) < m.r + 3) { near = true; break; }
        if (!near) f('leader-end', `${L[i].text} ends on ${other ? 'another referent' : 'nothing'} at (${Math.round(ax)},${Math.round(ay)})`);
      }
    }
    // Earth disc: only a failure when a clear slot exists within reach
    if (P.disc && boxDisc(B[i], P.disc) && !L[i].onDisc) {
      const w = B[i].x1 - B[i].x0, h = B[i].y1 - B[i].y0, cx = (B[i].x0 + B[i].x1) / 2, cy = (B[i].y0 + B[i].y1) / 2, reach = 0.16 * W;
      const ref = L[i].leader ? [L[i].leader[0], L[i].leader[1]] : [cx, cy];
      let ok = false;
      for (let dy = -reach; dy <= reach && !ok; dy += 6) for (let dx = -reach; dx <= reach && !ok; dx += 6) {
        if (Math.hypot(dx, dy) > reach) continue;
        const b = { x0: B[i].x0 + dx, x1: B[i].x1 + dx, y0: B[i].y0 + dy, y1: B[i].y1 + dy };
        if (b.x0 < 8 || b.y0 < 8 || b.x1 > W - 8 || b.y1 > H - 8 || boxDisc(b, P.disc)) continue;
        const qx = Math.max(b.x0, Math.min(b.x1, ref[0])), qy = Math.max(b.y0, Math.min(b.y1, ref[1]));
        if (Math.hypot(qx - ref[0], qy - ref[1]) > lim * 0.9) continue;
        if (B.some((o, j) => j !== i && boxHit(b, o, 2)) || (S.reserved || []).some(r => boxHit(b, r, 1))) continue;
        if ((P.pts || []).some(m => boxCircle(b, { x: m.x, y: m.y, r: m.r + 2 }))) continue;
        if ((P.circles || []).some(c => c.ring && crossesCircle(b, c))) continue;
        if ((P.polys || []).some(c => c.role !== 'line' && c.role !== 'orbit' && c.p.some((q, k) => k && segBox([c.p[k - 1][0], c.p[k - 1][1], q[0], q[1]], b)))) continue;
        if ((P.cloud || []).filter(q => q[0] > b.x0 && q[0] < b.x1 && q[1] > b.y0 && q[1] < b.y1).length > 2) continue;
        ok = true;
      }
      if (ok) f('label-disc', `${L[i].text} on the Earth disc, clear slot within reach`);
    }
  }
  if (S.def && P.refs) for (const r of P.refs) if (r.px < 6) f('ref-small', `${r.text} ${r.px.toFixed(1)} px`);
  // action region: each side counts at least 30% of the frame, so a long trail across the frame qualifies
  if (S.def && S.action !== undefined) { const a = S.action; const fr = a ? Math.max((a.x1 - a.x0) / W, 0.3) * Math.max((a.y1 - a.y0) / H, 0.3) : 0; if (fr < 0.2) f('action-small', `action region ${(fr * 100).toFixed(0)}% of frame`); }
  if (S.hidden) for (const h of S.hidden) f('ref-hidden', h);
  if (S.bannerLines > 1) f('banner-wrap', `banner wraps to ${S.bannerLines} lines`);
  if (S.audit) for (const a of S.audit) f('audit', JSON.stringify(a).slice(0, 140));
  return F;
}

// ---------------------------------------------------------------- in-page collectors
const LIVE = () => {
  const h = window.__cs.host(), el = h.el, er = el.getBoundingClientRect(), W = el.clientWidth, H = el.clientHeight;
  const rel = e => { const b = e.getBoundingClientRect(); return { x0: b.left - er.left, y0: b.top - er.top, x1: b.right - er.left, y1: b.bottom - er.top }; };
  const labels = [];
  h.labels.forEach(Lb => {
    if (Lb.d.style.display === 'none') return;
    const r = rel(Lb.d), o = { text: Lb.d.textContent, ...r, item: Lb.item ? h.sim.items.indexOf(Lb.item) : -1, leader: null };
    if (Lb.ln && Lb.ln.style.display !== 'none') o.leader = ['x1', 'y1', 'x2', 'y2'].map(a => +Lb.ln.getAttribute(a));
    labels.push(o);
  });
  const reserved = [];
  const bn = el.querySelector('.illus'); if (bn) reserved.push({ n: 'banner', ...rel(bn) });
  if (h.statusEl && h.statusEl.textContent) reserved.push({ n: 'status', ...rel(h.statusEl) });
  if (h.chipEl && h.chipEl.style.opacity !== '0') reserved.push({ n: 'chip', ...rel(h.chipEl) });
  const probe = h._probe(W, H);
  // Referents (labelled craft / satellites / aircraft) that the sim draws at this t but the camera cannot show.
  const hidden = [], cp = h.camera.position, T = h.T;
  for (const { it, obj } of h.dyn) {
    if (it.kind !== 'point' || !it.prim || h.sim.cams[h.camIdx].ref === false) continue;
    const p = it.pos(h.t); if (!p) continue;
    const v = new T.Vector3(...p).project(h.camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
    const d = [p[0] - cp.x, p[1] - cp.y, p[2] - cp.z], Ld = Math.hypot(...d), u = d.map(c => c / Ld), b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2], c2 = cp.lengthSq() - 1, disc = b * b - c2;
    const occ = disc >= 0 && (-b - Math.sqrt(disc)) > 0 && (-b - Math.sqrt(disc)) < Ld - 1e-3;
    if (x < 8 || y < 8 || x > W - 8 || y > H - 8 || v.z > 1 || occ) hidden.push(`${it.label} ${occ ? 'behind Earth' : 'off frame'} (${Math.round(x)},${Math.round(y)})`);
  }
  const tb = bn ? bn.getBoundingClientRect().height : 0;
  return { W, H, labels, reserved, probe, hidden, bannerLines: tb > 32 ? 2 : 1, audit: window.__cs.audit().filter(a => /scene/.test(a.chart || '')), t: h.t, act: h._act };
};
const STATIC = () => {
  const svg = document.querySelector('#sceneView > svg'), z = svg && svg.__lay; if (!z) return null;
  const bn0 = document.querySelector('#sceneView > .illus'), lines0 = bn0 && bn0.getBoundingClientRect().height > 32 ? 2 : 1;
  const mapLay = l => ({ text: l.text, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, leader: l.leader, item: -1, onDisc: false });
  if (z.panels) return { panels: z.panels.map(p => ({ W: p.W, H: p.H, labels: p.labels.map(mapLay), reserved: p.reserved.map(r => ({ n: r.n, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 })), probe: p.probe })), bannerLines: lines0, audit: window.__cs.audit().filter(a => /scene/.test(a.chart || '')), earth: svg.dataset.earth };
  const labels = z.labels.map(l => ({ text: l.text, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, leader: l.leader, item: -1, onDisc: false }));
  const bn = document.querySelector('#sceneView > .illus'), er = document.getElementById('sceneView').getBoundingClientRect();
  const reserved = z.reserved.map(r => ({ n: r.n, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }));
  if (bn) { const b = bn.getBoundingClientRect(); reserved.push({ n: 'banner', x0: b.left - er.left, y0: b.top - er.top, x1: b.right - er.left, y1: b.bottom - er.top }); }
  return { W: z.W, H: z.H, labels, reserved, probe: z.probe, bannerLines: bn && bn.getBoundingClientRect().height > 32 ? 2 : 1, audit: window.__cs.audit().filter(a => /scene/.test(a.chart || '')), earth: svg.dataset.earth };
};

// ---------------------------------------------------------------- run
const results = [], failCount = {};
const record = (tag, F, extra = {}) => { results.push({ tag, F, ...extra }); for (const x of F) { const k = x.type; failCount[k] = (failCount[k] || 0) + 1; } if (F.length && !QUIET) console.log(tag, F.length, F.slice(0, 6).map(x => `${x.type}:${x.detail}`).join(' | ')); };
const ctxOpts = (w, extra = {}) => ({ viewport: { width: w, height: w <= 400 ? 800 : w <= 900 ? 800 : 900 }, colorScheme: 'dark', ignoreHTTPSErrors: true, isMobile: w < 640, hasTouch: w < 640, ...extra });
async function boot(w, extra) {
  const ctx = await browser.newContext(ctxOpts(w, extra)), page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page, errs };
}
const ids = async page => (await page.evaluate(() => window.__cs.scenes)).filter(i => !ONLY.length || ONLY.includes(i));
const tag = (...a) => a.join('-');
const camActs = (page) => page.evaluate(() => { const h = window.__cs.host(); return { cams: h.sim.cams.map(c => ({ name: c.name, act: c.act ?? null, auto: !!c.auto })), acts: h.sim.cfg.acts || null }; });

if (MODES.includes('live')) for (const w of VPS) {
  const { ctx, page, errs } = await boot(w);
  for (const id of await ids(page)) {
    await page.evaluate(id => window.__cs.openScene(id), id); await page.waitForTimeout(900);
    const { cams, acts } = await camActs(page);
    for (let ci = 0; ci < cams.length; ci++) {
      const c = cams[ci];
      let tl = TS;
      if (c.act != null) tl = TS.filter(t => t >= acts[c.act].t0 && t < acts[c.act].t1);
      if (!tl.length) tl = [acts[c.act].t0 + 0.05];
      for (const t of tl) {
        await page.evaluate(({ ci, t }) => { const h = window.__cs.host(); h.playing = false; h._lm = {}; h.pickCam(ci); h.update(t); h.update(t); }, { ci, t });
        const S = await page.evaluate(LIVE); S.def = ci === 0; S.kind = 'live';
        if (ci !== 0) S.action = undefined; else S.action = S.probe.action;
        const F = check(S);
        const nm = tag('live', id, w, 'c' + ci, 't' + t);
        record(nm, F, { W: w });
        if (SHOT) await page.locator('#sceneView').screenshot({ path: `${out}/${id}-${w}-c${ci}-t${t}.png` });
      }
    }
    await page.evaluate(() => window.__cs.closeScene()); await page.waitForTimeout(150);
  }
  if (errs.length) console.log('console errors', w, errs.slice(0, 5));
  await ctx.close();
}
if (MODES.includes('static')) for (const w of VPS) {
  const { ctx, page, errs } = await boot(w, { reducedMotion: 'reduce' });
  for (const id of await ids(page)) {
    await page.evaluate(id => window.__cs.openScene(id), id);
    for (let k = 0; k < 20; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => document.querySelector('#sceneView > svg')?.dataset.earth) === 'bluemarble') break; }
    await page.waitForTimeout(300);
    const S = await page.evaluate(STATIC);
    if (!S) { record(tag('static', id, w), [{ type: 'audit', detail: 'no static svg' }]); continue; }
    S.kind = 'static'; S.def = false; S.action = undefined;
    const parts = S.panels ? S.panels.map(p => ({ ...S, ...p, kind: 'static', def: false, action: undefined, audit: null })) : [S];
    if (S.panels && S.audit) parts[0].audit = S.audit;
    record(tag('static', id, w), parts.flatMap(check), { W: w, earth: S.earth });
    if (SHOT) await page.locator('#sceneView').screenshot({ path: `${out}/static-${id}-${w}.png` });
    if (w === 1440) {
      const url = await page.evaluate(() => window.__cs.exportStill());
      fs.writeFileSync(`${out}/still-static-${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
    }
    await page.evaluate(() => window.__cs.closeScene()); await page.waitForTimeout(100);
  }
  if (errs.length) console.log('console errors static', w, errs.slice(0, 5));
  await ctx.close();
}
if (MODES.includes('still')) {
  const { ctx, page, errs } = await boot(1440);
  for (const id of await ids(page)) {
    await page.evaluate(id => window.__cs.openScene(id), id); await page.waitForTimeout(700);
    const stillT = await page.evaluate(() => { const h = window.__cs.host(); return h.sim.still; });
    const r = await page.evaluate(async () => {
      const h = window.__cs.host(); h.playing = false; h._lm = {}; h.update(h.sim.still);
      const url = h.stillPNG('Title', 'SWF 2026, Table 5-1, p. 05-01.'), z = h.stillLayout;
      const conv = q => ({ W: q.W, H: q.H,
        labels: q.labels.filter(Boolean).map(l => ({ text: l.text, x0: l.x - l.w / 2, x1: l.x + l.w / 2, y0: l.y - l.h / 2, y1: l.y + l.h / 2, leader: l.leader ? [l.ax, l.ay, l.qx, l.qy] : null, item: -1 })),
        reserved: (q.rsv || []).map((r, i) => ({ n: 'rsv' + i, x0: r[0], y0: r[1], x1: r[0] + r[2], y1: r[1] + r[3] })), probe: q.probe });
      return { url, tiles: (z.tiles || [z]).map(conv) };
    });
    fs.writeFileSync(`${out}/still-live-${id}.png`, Buffer.from(r.url.split(',')[1], 'base64'));
    const F = r.tiles.flatMap(t => check({ kind: 'still', u: t.W / 1000, W: t.W, H: t.H, labels: t.labels, reserved: t.reserved, probe: t.probe, def: false }));
    // stills are ~3000 px wide: the pixel rules are scaled by u (label font scale) so the limits mean the same thing as in the live frame
    record(tag('still-live', id), F, { stillT });
    await page.evaluate(() => window.__cs.closeScene()); await page.waitForTimeout(100);
  }
  if (errs.length) console.log('console errors still', errs.slice(0, 5));
  await ctx.close();
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results));
const total = results.reduce((n, r) => n + r.F.length, 0);
console.log(`\nstates ${results.length}, failing states ${results.filter(r => r.F.length).length}, failures ${total}`, JSON.stringify(failCount));
await browser.close(); srv.close();
process.exit(total ? 1 : 0);
