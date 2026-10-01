// Scene collision / framing checker for the 13 WebGL scenes, their static SVG diagrams and their PNG stills.
//   NODE_PATH=tools/node_modules OUT=<dir> PORT=9122 node tools/scene_check.mjs
// Env: ONLY=id,id (scene filter)  CAMS=0,1 (camera-preset filter)  VPS=1440,900,375  TS=0.2,0.3,...  MODES=live,static,still,hero  SHOT=1 (save a PNG per state)  QUIET=1
// Every state is (scene x camera preset x t x viewport) for live scenes; static SVG at each viewport; live and static stills at 1440.
// FAILURES (each is a hard failure, exit code 1 if any):
//   label-overlap    two label boxes overlap                 label-reserved  a label sits on the banner, status caption or hint chip
//   label-mark       a label covers a drawn sprite           label-edge      a label box is within 8 px of the frame edge
//   label-disc       a label box overlaps the Earth disc although a clear slot exists within reach (leader <= limit, <= 0.10 W away)
//   leader-long      leader longer than 0.17 W (0.27 W at 375)      leader-cross  a leader crosses another label box or leader
//   leader-end       the leader ends on empty space (no drawn referent within a few px) or on another labelled referent
//   ref-small        a labelled craft/satellite is drawn < 6 px on the default camera            action-small  action region < 20% of the frame (default camera; sides count at least 40%)
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
//   orbit-thru-centre  a static orbit drawn as a thin straight chord through the Earth's centre (edge-on ring: the plane must be viewed obliquely)
//   subject-small    a labelled craft is drawn under 22 px (default camera) or under 44 px (follow camera, 30 px at 375)
//   preset-empty     every camera preset x t in 0.1..0.9: the scene's primary subject(s) (labelled craft, burst, debris cloud) are drawn at that t but none projects
//                    inside the viewport at >= 8 px (6 px at 375); also checked on stills: subject centred (still-centre) and label font (still-font)
//   still-empty      a still has an empty band (no content) over more than 20% of its body height or width
//   still-crop       a still shows a whole-globe composition (multi-tile composites exempt) (disc radius < 55% of the frame) with the Earth partly cropped (50-98.5% visible); a deliberate close-up is exempt
//   hero-small       hero live at >= 900 px: the outer ring spans under 70% of the stage width
//   hero-*           hero: ISS marker missing (hero-iss), a shell label more than 40 px from its ring (hero-label), caption strip / heading wrap (page side)
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';

const root = path.resolve(process.env.ROOT || '.'), out = process.env.OUT || 'scene_check_out', PORT = +(process.env.PORT || 9122);
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const VPS = (process.env.VPS || '1440,900,375').split(',').map(Number);
const TS = (process.env.TS || '0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.85,0.9').split(',').map(Number);
const CAMS = (process.env.CAMS || '').split(',').filter(Boolean).map(Number);
const MODES = (process.env.MODES || 'live,static,still,hero').split(',');
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
const leadersNear = (a, b) => { // segments that run within 2.5 px of each other over part of their length (not just at a shared end)
  let close = 0; for (let k = 0.1; k <= 0.9; k += 0.2) { const x = a[0] + (a[2] - a[0]) * k, y = a[1] + (a[3] - a[1]) * k; if (distPtSeg(x, y, ...b) < 2.5) close++; }
  return close >= 2;
};
const boxDisc = (b, d) => { const dx = Math.max(b.x0 - d.cx, 0, d.cx - b.x1), dy = Math.max(b.y0 - d.cy, 0, d.cy - b.y1); return Math.hypot(dx, dy) < d.r - 2; };
const crossesCircle = (b, c) => { const dx0 = Math.max(b.x0 - c.cx, 0, c.cx - b.x1), dy0 = Math.max(b.y0 - c.cy, 0, c.cy - b.y1), fx = Math.max(Math.abs(b.x0 - c.cx), Math.abs(b.x1 - c.cx)), fy = Math.max(Math.abs(b.y0 - c.cy), Math.abs(b.y1 - c.cy)); return Math.hypot(dx0, dy0) < c.r + 2 && Math.hypot(fx, fy) > c.r - 2; };
const shellCrop = (circles, W, H, hero) => {
  const out = [];
  for (const c of circles || []) {
    if (!c.ring) continue;
    const r = c.r * 1.05, inside = c.cx - r >= 2 && c.cx + r <= W - 2 && c.cy - r >= 2 && c.cy + r <= H - 2;
    const cover = [[0, 0], [W, 0], [0, H], [W, H]].every(([x, y]) => Math.hypot(x - c.cx, y - c.cy) < r - 2);
    const dx = Math.max(-c.cx, 0, c.cx - W), dy = Math.max(-c.cy, 0, c.cy - H), away = Math.hypot(dx, dy) > r;
    const vOnly = hero && W / H > 1.7 && c.cx - r >= 2 && c.cx + r <= W - 2 && c.cy - r < 2 && c.cy + r > H - 2; // a wide hero stage: a shell may run off the top and the bottom together, sides fully inside
    if (!inside && !cover && !away && !vOnly) out.push(`shell r=${Math.round(c.r)} at (${Math.round(c.cx)},${Math.round(c.cy)}) is cut by the frame ${W}x${H}`);
  }
  return out;
};
const boxCircle = (b, c) => { const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1), dy = Math.max(b.y0 - c.y, 0, c.y - b.y1); return Math.hypot(dx, dy) < c.r; };

// Event times that are not cfg.hit.t, and regexes for status text that describes the event; key objects that must stay in frame on the default camera.
const EVENTS = { starfish: { t: 0.14, re: /detonation:|detonates/i } };
const HITRE = /collision|destroys|destroyed|detonat|fragments spread|debris spreads/i;
const KEY = { viasat: [/KA-SAT/], laser: [/MSTI-3/, /White Sands/], 'sj21-tug': [/SJ-21/, /Compass/], cosmos1408: [/^Cosmos 1408/], shakti: [/Microsat/],
  spaceplanes: [/^X-37B \(US\)/, /^X-37B OTV-7/, /^CSSHQ \(China\)/], rpo: [/SJ-2/, /USA 2/, /Cosmos 254/, /SKYNET/] };
const IMPACT = /impact|debris|collision|fragment|pieces|detonation|burst/i;

// S = {kind, W, H, labels:[{text, x0,y0,x1,y1, leader:[ax,ay,qx,qy]|null, item}], reserved:[{n,x0,y0,x1,y1}], probe, def (default camera), bannerLines}
function check(S) {
  const F = [], { W, H } = S, u = S.u || 1, L = S.labels, P = S.probe || {}, phone = W <= 400, lim = W * (phone ? 0.27 : 0.17);
  const f = (type, detail) => F.push({ type, detail });
  const B = L.map(l => ({ x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1 }));
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) if (boxHit(B[i], B[j], -0.5)) f('label-overlap', `${L[i].text} / ${L[j].text}`);
    for (const r of S.reserved || []) if (boxHit(B[i], r, -1)) f('label-reserved', `${L[i].text} on ${r.n}`);
    if (P.pts) for (const m of P.pts) if (boxCircle(B[i], m) && m.i !== L[i].item) f('label-mark', `${L[i].text} covers a sprite`);
    if (B[i].x0 < 7.5 * u || B[i].y0 < 7.5 * u || B[i].x1 > W - 7.5 * u || B[i].y1 > H - 7.5 * u) f('label-edge', `${L[i].text} (${Math.round(B[i].x0)},${Math.round(B[i].y0)})-(${Math.round(B[i].x1)},${Math.round(B[i].y1)})`);
    const ld = L[i].leader;
    if (!ld && L[i].ref && isFinite(L[i].ref[0]) && S.kind !== 'static-skip') {
      const rx = L[i].ref[0], ry = L[i].ref[1], dx = Math.max(B[i].x0 - rx, 0, rx - B[i].x1), dy = Math.max(B[i].y0 - ry, 0, ry - B[i].y1), d = Math.hypot(dx, dy);
      if (d > Math.max(30 * u, 0.05 * W)) f('label-detached', `${L[i].text} ${Math.round(d)} px from its referent, no leader`);
    }
    if (ld) {
      const len = Math.hypot(ld[2] - ld[0], ld[3] - ld[1]);
      if (len > lim) f('leader-long', `${L[i].text} ${Math.round(len)} px > ${Math.round(lim)}`);
      for (let j = 0; j < L.length; j++) {
        if (j !== i && segBox(ld, B[j])) f('leader-cross', `${L[i].text} leader through label ${L[j].text}`);
        if (j > i && L[j].leader && (segSeg(ld, L[j].leader) || leadersNear(ld, L[j].leader))) f('leader-cross', `${L[i].text} x ${L[j].text}`);
      }
      // the end must sit on its own drawn referent
      if (P.pts || P.polys) {
        const [ax, ay] = ld; let near = false, other = null;
        for (const m of P.pts || []) if (Math.hypot(ax - m.x, ay - m.y) < m.r + 3) { if (m.i === L[i].item || L[i].item == null || L[i].item < 0) near = true; else other = other || m; }
        for (const c of P.polys || []) { for (let k = 0; k + 1 < c.p.length && !near; k++) if (distPtSeg(ax, ay, ...c.p[k], ...c.p[k + 1]) < 4.5) near = true; if (near) break; }
        if (!near) for (const c of P.cloud || []) if (Math.hypot(ax - c[0], ay - c[1]) < 7) { near = true; break; }
        if (!near) for (const d of P.domes || []) if (Math.hypot(ax - d.x, ay - d.y) < d.r) { near = true; break; }
        if (!near) for (const c of P.circles || []) if (Math.abs(Math.hypot(ax - c.cx, ay - c.cy) - c.r) < 7 * (S.kind === 'still' ? Math.max(1, W / 1000) : 1)) { near = true; break; } // the probe circle is a centred fit of an off-axis perspective shell silhouette: its tolerance is in frame pixels, so it scales with the 3000 px still
        if (!near) for (const m of P.marks || []) if (Math.hypot(ax - m.x, ay - m.y) < m.r + 3) { near = true; break; }
        if (!near) f('leader-end', `${L[i].text} ends on ${other ? 'another referent' : 'nothing'} at (${Math.round(ax)},${Math.round(ay)})`);
      }
    }
    // Earth disc: only a failure when a clear slot exists within reach
    if (P.disc && boxDisc(B[i], P.disc) && !L[i].onDisc) {
      const w = B[i].x1 - B[i].x0, h = B[i].y1 - B[i].y0, cx = (B[i].x0 + B[i].x1) / 2, cy = (B[i].y0 + B[i].y1) / 2, reach = 0.1 * W;
      const ref = L[i].ref && isFinite(L[i].ref[0]) ? L[i].ref : L[i].leader ? [L[i].leader[0], L[i].leader[1]] : [cx, cy];
      let ok = false;
      for (let dy = -reach; dy <= reach && !ok; dy += 6) for (let dx = -reach; dx <= reach && !ok; dx += 6) {
        if (Math.hypot(dx, dy) > reach) continue;
        const b = { x0: B[i].x0 + dx, x1: B[i].x1 + dx, y0: B[i].y0 + dy, y1: B[i].y1 + dy };
        if (b.x0 < 8 || b.y0 < 8 || b.x1 > W - 8 || b.y1 > H - 8 || boxDisc(b, { ...P.disc, r: P.disc.r + 8 * u })) continue; // a slot must clear the disc by a margin, like the placer's own rule
        const qx = Math.max(b.x0, Math.min(b.x1, ref[0])), qy = Math.max(b.y0, Math.min(b.y1, ref[1]));
        if (Math.hypot(qx - ref[0], qy - ref[1]) > lim * 0.9) continue;
        if (Math.hypot(qx - ref[0], qy - ref[1]) > 14 && L.some((o, j) => j !== i && o.leader && segSeg([ref[0], ref[1], qx, qy], o.leader))) continue;
        if (Math.hypot(qx - ref[0], qy - ref[1]) > 14 && L.some((o, j) => j !== i && segBox([ref[0], ref[1], qx, qy], { x0: o.x0, x1: o.x1, y0: o.y0, y1: o.y1 }))) continue;
        if (Math.hypot(qx - ref[0], qy - ref[1]) > 14 && (P.polys || []).some(c => c.role !== 'line' && c.role !== 'orbit' && c.p.some((q, k) => k && segSeg([ref[0], ref[1], qx, qy], [c.p[k - 1][0], c.p[k - 1][1], q[0], q[1]])))) continue;
        if (B.some((o, j) => j !== i && boxHit(b, o, 4)) || (S.reserved || []).some(r => boxHit(b, r, 3))) continue;
        if ((P.pts || []).some(m => boxCircle(b, { x: m.x, y: m.y, r: m.r + 4 }))) continue;
        if (L.some((o, j) => j !== i && o.ref && o.ref[0] > b.x0 - 2 && o.ref[0] < b.x1 + 2 && o.ref[1] > b.y0 - 2 && o.ref[1] < b.y1 + 2)) continue; // never sits on another label's object
        if ((P.circles || []).some(c => c.ring && crossesCircle(b, c))) continue;
        if ((P.polys || []).some(c => c.role !== 'line' && c.role !== 'orbit' && c.p.some((q, k) => k && segBox([c.p[k - 1][0], c.p[k - 1][1], q[0], q[1]], b)))) continue;
        if ((P.cloud || []).filter(q => q[0] > b.x0 && q[0] < b.x1 && q[1] > b.y0 && q[1] < b.y1).length > 2) continue;
        ok = [Math.round((b.x0 + b.x1) / 2), Math.round((b.y0 + b.y1) / 2)];
      }
      if (ok) f('label-disc', `${L[i].text} on the Earth disc by ${Math.round(P.disc.r - Math.hypot(Math.max(B[i].x0 - P.disc.cx, 0, P.disc.cx - B[i].x1), Math.max(B[i].y0 - P.disc.cy, 0, P.disc.cy - B[i].y1)))} px, clear slot within reach at ${ok} (now ${Math.round(cx)},${Math.round(cy)})`);
    }
  }
  if (S.def && P.refs) for (const r of P.refs) if (r.px < 6) f('ref-small', `${r.text} ${r.px.toFixed(1)} px`);
  // action region: each side counts at least 40% of the frame, so a long trail across the frame qualifies
  if (S.def && S.action !== undefined && !S.docked && !S.ringFrame) { // a ring-framed default camera (DN-2: the whole arc and the whole GEO ring) shows the action small by design; a docked pair is one object: the action region is that single spot, so it is exempt while docked
    const a = S.action; const fr = a ? Math.max((a.x1 - a.x0) / W, 0.4) * Math.max((a.y1 - a.y0) / H, 0.4) : 0; if (fr < 0.2) f('action-small', `action region ${(fr * 100).toFixed(0)}% of frame`); }
  // burst-edge: on the default camera no burst ring / hit point / debris may touch the frame edge (it must sit inside with margin)
  if (S.def && S.kind === 'live') {
    const m = 4, hit = (x, y, r) => x - r < m || y - r < m || x + r > W - m || y + r > H - m;
    for (const q of P.pts || []) if (q.shape === 'flash' && hit(q.x, q.y, Math.max(q.r, q.ring || 0))) f('burst-edge', `burst ring r=${Math.round(Math.max(q.r, q.ring || 0))} at (${Math.round(q.x)},${Math.round(q.y)}) touches the ${W}x${H} frame edge`);
    const e = (P.cloud || []).filter(c => Math.min(c[0], c[1], W - c[0], H - c[1]) > -2 && Math.min(c[0], c[1], W - c[0], H - c[1]) < 2);
    // debris fields of the hit scenes only (the Starfish belt and space-weather clouds fill the frame by design); >= 3 points in the edge band = the cloud is cut, a lone fragment is an outlier
    if (S.hitT != null && e.length >= 3) f('burst-edge', `${e.length} debris point(s) touch the frame edge, first at (${Math.round(e[0][0])},${Math.round(e[0][1])})`);
  }
  if (S.minFont != null && S.minFont < 9) f('static-font', `smallest text ${S.minFont}px < 9px at ${W}px`);
  if (P.disc0 && P.polys) for (const c of P.polys) {
    if (c.role === 'beam' || c.p.length < 6) continue;
    const a = c.p[0], b = c.p[c.p.length - 1], Lc = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (Lc < 0.8 * P.disc0.r) continue;
    let dev = 0; for (const q of c.p) dev = Math.max(dev, distPtSeg(q[0], q[1], a[0], a[1], b[0], b[1]));
    if (dev < 0.06 * Lc && distPtSeg(P.disc0.cx, P.disc0.cy, a[0], a[1], b[0], b[1]) < 0.3 * P.disc0.r) f('orbit-thru-centre', `a ${c.role} curve of ${Math.round(Lc)} px is a straight chord through the Earth's centre (dev ${dev.toFixed(1)} px)`);
  }
  if (S.kind === 'live' && P.refs && !S.noSubject) {
    const thr = S.def ? (W >= 900 ? 22 : 18) : S.follow ? (W >= 900 ? 44 : 30) : 0;
    if (thr) for (const r of P.refs) if (r.px < thr && r.x > 0 && r.x < W && r.y > 0 && r.y < H) f('subject-small', `${r.text} ${r.px.toFixed(0)} px < ${thr}`);
  }
  if (S.kind === 'still' && P.disc) { // label font and subject centring (union of the Earth disc, shells that fit, and the action region)
    if (u * 11 < 28) f('still-font', `label font ${(u * 11).toFixed(0)} px < 28 px`);
    const tile = W < 2000, b0 = (tile ? 0.17 : 0.04) * H, bh = (tile ? 0.82 : 0.9) * H - b0, d = P.disc, whole = d.r < 1.3 * bh; // a regional close-up (disc over 1.3 bands) is framed on its action only
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = (a, b) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); };
    const dsc = (c, r, free) => { if (free) { add(c.cx - r, c.cy - r); add(c.cx + r, c.cy + r); } else { add(Math.max(0, c.cx - r), Math.max(0, c.cy - r)); add(Math.min(W, c.cx + r), Math.min(H, c.cy + r)); } };
    if (P.action) { add(P.action.x0, P.action.y0); add(P.action.x1, P.action.y1); }
    if (whole || !P.action) dsc(d, d.r, whole);
    if (whole) for (const c of P.circles || []) if (c.ring && c.r > 0 && Math.abs(c.cx - W / 2) < W) dsc(c, c.r, whole && c.r < 1.2 * bh);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (Math.abs(cx - W / 2) > 0.06 * W) f('still-centre', `subject centre x ${Math.round(cx)} is ${Math.round(Math.abs(cx - W / 2))} px off the frame centre (${W} wide)`);
    if (Math.abs(cy - (b0 + bh / 2)) > 0.08 * H) f('still-centre', `subject centre y ${Math.round(cy)} off the band centre ${Math.round(b0 + bh / 2)} (${H} high)`);
    if (whole && (x1 - x0 < 0.5 * W && y1 - y0 < 0.5 * bh)) f('still-centre', `subject only ${Math.round((x1 - x0) / W * 100)}% of the still width (too small)`);
  }
  if (S.emptyBand != null && S.emptyBand > 0.2) f('still-empty', `empty band (gap or lopsided margin) of ${(S.emptyBand * 100).toFixed(0)}% of the still`);
  if (S.emptyArea != null && S.emptyArea < 0.3) f('still-empty', `content fills only ${(S.emptyArea * 100).toFixed(0)}% of the still body`);
  if (S.discVis != null && !S.discBig && S.discVis > 0.5 && S.discVis < 0.985) f('still-crop', `Earth disc ${(S.discVis * 100).toFixed(0)}% inside the still (cropped)`);
  if (S.kind === 'hero' && W >= 900 && S.heroSpan != null && S.heroSpan < 0.7) f('hero-small', `outer ring spans ${(S.heroSpan * 100).toFixed(0)}% of the stage width`);
  if (S.hidden) for (const h of S.hidden) f('ref-hidden', h);
  if (S.status != null && S.evT != null && S.t < S.evT + 0.02 && (S.evRe || HITRE).test(S.status)) f('status-early', `t=${S.t} < event ${S.evT}+0.02: "${S.status.slice(0, 70)}"`);
  if (S.statusLines > 1) f('status-wrap', `status wraps to ${S.statusLines} lines at ${W}px: "${(S.status || '').slice(0, 60)}"`);
  if (S.keyOut) for (const k of S.keyOut) f('key-out', k);
  if (S.hitT != null && S.def && S.t >= S.hitT + 0.1 && !L.some(l => IMPACT.test(l.text))) f('no-impact', `no impact/debris label at t=${S.t} (hit ${S.hitT})`);
  if (S.shellCrop) for (const k of S.shellCrop) f('shell-crop', k);
  if (S.resX != null && S.resX < 1.5) f('still-res', `Earth supersampling ${S.resX.toFixed(2)}x < 1.5x`);
  if (S.bannerLines > 1) f('banner-wrap', `banner wraps to ${S.bannerLines} lines`);
  if (S.audit) for (const a of S.audit) f('audit', JSON.stringify(a).slice(0, 140));
  return F;
}

// ---------------------------------------------------------------- in-page collectors
const LIVE = (KEYS) => {
  const h = window.__cs.host(), el = h.el, er = el.getBoundingClientRect(), W = el.clientWidth, H = el.clientHeight;
  const rel = e => { const b = e.getBoundingClientRect(); return { x0: b.left - er.left, y0: b.top - er.top, x1: b.right - er.left, y1: b.bottom - er.top }; };
  const labels = [];
  h.labels.forEach(Lb => {
    if (Lb.d.style.display === 'none') return;
    const r = rel(Lb.d), o = { text: Lb.d.textContent, ...r, item: Lb.item ? h.sim.items.indexOf(Lb.item) : -1, leader: null, ref: [Lb.ax, Lb.ay] };
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
    if (it.kind !== 'point' || !it.prim || h.sim.cams[h.camIdx].ref === false || (h.sim.cams[h.camIdx].insetRef && it.insetLabel)) continue; // insetRef: the context inset shows it
    const p = it.pos(h.t); if (!p) continue;
    const v = new T.Vector3(...p).project(h.camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
    const d = [p[0] - cp.x, p[1] - cp.y, p[2] - cp.z], Ld = Math.hypot(...d), u = d.map(c => c / Ld), b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2], c2 = cp.lengthSq() - 1, disc = b * b - c2;
    const occ = disc >= 0 && (-b - Math.sqrt(disc)) > 0 && (-b - Math.sqrt(disc)) < Ld - 1e-3;
    if (x < 8 || y < 8 || x > W - 8 || y > H - 8 || v.z > 1 || occ) hidden.push(`${it.label} ${occ ? 'behind Earth' : 'off frame'} (${Math.round(x)},${Math.round(y)})`);
  }
  const tb = bn ? bn.getBoundingClientRect().height : 0;
  // status caption: text, line count, event time; key objects that must be in frame on the default camera
  const st = h.statusEl, status = st ? st.textContent : '';
  let statusLines = 0;
  if (st && status) { const rg = document.createRange(); rg.selectNodeContents(st); statusLines = new Set([...rg.getClientRects()].map(q => Math.round(q.top / 4))).size; }
  const hitT = h.sim.cfg.hit && !h.sim.cfg.actors.some(a => a.noHit) ? h.sim.cfg.hit.t : null, keyOut = [];
  const res = reserved.filter(r => r.n === 'status' || r.n === 'banner');
  for (const Lb of h.labels) {
    const nm = (Lb.text || '') + '|' + (Lb.short || '');
    if (!KEYS.some(rx => new RegExp(rx).test(nm)) || (h.sim.cams[h.camIdx].insetRef && Lb.item?.insetLabel)) continue;
    const p = Lb.posFn(h.t); if (!p) continue;
    const v = new T.Vector3(...p).project(h.camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
    const d = [p[0] - cp.x, p[1] - cp.y, p[2] - cp.z], Ld = Math.hypot(...d), u = d.map(c => c / Ld), b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2], c2 = cp.lengthSq() - 1, dd = b * b - c2;
    const occ = dd >= 0 && (-b - Math.sqrt(dd)) > 0 && (-b - Math.sqrt(dd)) < Ld - 1e-3;
    const under = res.some(r => x > r.x0 - 18 && x < r.x1 + 18 && y > r.y0 - 18 && y < r.y1 + 18); // 18 px pad: a model half-hidden by the caption counts
    if (x < 10 || y < 10 || x > W - 10 || y > H - 10 || v.z > 1 || occ || under) keyOut.push(`${Lb.text} ${occ ? 'behind Earth' : under ? 'under the caption/banner' : 'off frame'} (${Math.round(x)},${Math.round(y)})`);
  }
  return { W, H, labels, reserved, probe, hidden, ringFrame: !!h.sim.cams[h.camIdx]?.ringFrame, status, statusLines, hitT, keyOut, docked: h.sim.items.some(i => i.dockOn && i.dockOn(h.t)), t: h.t, bannerLines: tb > 32 ? 2 : 1, audit: window.__cs.audit().filter(a => /scene/.test(a.chart || '')), act: h._act };
};
// Subjects: what the sim draws at this t (visible primary craft, flash, debris cloud) versus what this camera actually frames.
const SUBJ = () => {
  const h = window.__cs.host(), W = h.el.clientWidth, H = h.el.clientHeight, P = h._probe(W, H), thr = W >= 900 ? 8 : 6;
  let drawn = 0;
  for (const { it, obj } of h.dyn) {
    if (!obj.visible) continue;
    if ((it.kind === 'point' && it.prim && it.shape !== 'none') || (it.kind === 'flash' && it.big) || (it.kind === 'cloud' && it.dynCol !== undefined)) drawn++;
  }
  const inF = (x, y, m = 6) => x > m && y > m && x < W - m && y < H - m;
  const ok = P.refs.filter(r => inF(r.x, r.y) && r.px >= thr).length + P.pts.filter(q => q.shape === 'flash' && inF(q.x, q.y) && q.r >= thr / 2).length
    + (P.cloud.filter(c => inF(c[0], c[1], 2)).length >= 5 ? 1 : 0);
  return { drawn, ok, refs: P.refs.map(r => `${r.text} ${Math.round(r.px)}px@${Math.round(r.x)},${Math.round(r.y)}`).slice(0, 4) };
};
const SSX = (sel = '#sceneView') => { const v = [...document.querySelectorAll(sel + ' svg[data-ss]')].map(e => +e.dataset.ss).filter(Boolean); return v.length ? Math.min(...v) : null; };
const STATIC = (sel = '#sceneView') => {
  const svg = document.querySelector(sel + ' > svg'), z = svg && svg.__lay; if (!z) return null;
  const bn0 = document.querySelector(sel + ' > .illus'), lines0 = bn0 && bn0.getBoundingClientRect().height > 32 ? 2 : 1;
  const mapLay = l => ({ text: l.text, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, leader: l.leader, ref: l.ref, item: l.mk ?? -1, onDisc: false });
  if (z.panels) return { panels: z.panels.map(p => ({ W: p.W, H: p.H, labels: p.labels.map(mapLay), reserved: p.reserved.map(r => ({ n: r.n, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 })), probe: p.probe, minFont: p.probe.minFont })), bannerLines: lines0, audit: window.__cs.audit().filter(a => /scene/.test(a.chart || '')), earth: svg.dataset.earth };
  const labels = z.labels.map(l => ({ text: l.text, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, leader: l.leader, ref: l.ref, item: l.mk ?? -1, onDisc: false }));
  const bn = document.querySelector(sel + ' > .illus'), er = document.querySelector(sel).getBoundingClientRect();
  const reserved = z.reserved.map(r => ({ n: r.n, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }));
  if (bn) { const b = bn.getBoundingClientRect(); reserved.push({ n: 'banner', x0: b.left - er.left, y0: b.top - er.top, x1: b.right - er.left, y1: b.bottom - er.top }); }
  return { W: z.W, H: z.H, labels, reserved, probe: z.probe, minFont: z.probe.minFont, bannerLines: bn && bn.getBoundingClientRect().height > 32 ? 2 : 1, audit: window.__cs.audit().filter(a => /scene/.test(a.chart || '')), earth: svg.dataset.earth };
};

// Empty-band measure of a still (PNG data URL), body only (header/footer excluded): {band: largest empty gap inside the content, or the imbalance between opposite empty margins; area: content bounding box as a fraction of the body}.
const EMPTY = async (url) => {
  const img = new Image(); img.src = url; await img.decode();
  const k = 4, w = Math.round(img.width / k), h = Math.round(img.height / k), c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data;
  const y0 = Math.round(h * 0.06), y1 = Math.round(h * 0.9), rows = [], cols = new Array(w).fill(0);
  for (let y = y0; y < y1; y++) { let n = 0; for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, L = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; if (L > 30) { n++; cols[x]++; } } rows.push(n); }
  // per axis: rows/cols with content (>= 3 bright px); lead/trail = empty margins, gap = longest empty run between content
  const ax = (arr) => { const on = arr.map(v => v >= 3), first = on.indexOf(true), last = on.lastIndexOf(true); if (first < 0) return { lead: 1, trail: 0, gap: 0, span: 0 };
    let gap = 0, cur = 0; for (let i = first; i <= last; i++) { if (!on[i]) { cur++; gap = Math.max(gap, cur); } else cur = 0; }
    return { lead: first / arr.length, trail: (arr.length - 1 - last) / arr.length, gap: gap / arr.length, span: (last - first + 1) / arr.length }; };
  const r = ax(rows), q = ax(cols);
  return { band: Math.max(r.gap, q.gap, Math.abs(r.lead - r.trail), Math.abs(q.lead - q.trail)), area: r.span * q.span };
};
const discVisible = (d, W, H) => { if (!d || !(d.r > 0)) return null; let n = 0, ins = 0; for (let i = 0; i < 48; i++) for (let j = 0; j < 48; j++) { const x = d.cx + ((i + 0.5) / 24 - 1) * d.r, y = d.cy + ((j + 0.5) / 24 - 1) * d.r; if ((x - d.cx) ** 2 + (y - d.cy) ** 2 > d.r * d.r) continue; n++; if (x >= 0 && x <= W && y >= 0 && y <= H) ins++; } return ins / n; };

// ---------------------------------------------------------------- run
const results = [], failCount = {}, pageErrs = [], statusByVp = {};
const record = (tag, F, extra = {}) => { results.push({ tag, F, ...extra }); for (const x of F) { const k = x.type; failCount[k] = (failCount[k] || 0) + 1; } if (F.length && !QUIET) console.log(tag, F.length, F.slice(0, 6).map(x => `${x.type}:${x.detail}`).join(' | ')); };
const ctxOpts = (w, extra = {}) => ({ viewport: { width: w, height: w <= 400 ? 800 : w <= 900 ? 800 : 900 }, colorScheme: 'dark', ignoreHTTPSErrors: true, isMobile: w < 640, hasTouch: w < 640, ...extra });
async function boot(w, extra) {
  const ctx = await browser.newContext(ctxOpts(w, extra)), page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => pageErrs.push('pageerror [' + curTag + ']: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 6).join(' | '))), page.on('pageerror', e => errs.push('pageerror [' + curTag + ']: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page, errs };
}
const ids = async page => (await page.evaluate(() => window.__cs.scenes)).filter(i => !ONLY.length || ONLY.includes(i));
let curTag = '';
const tag = (...a) => (curTag = a.join('-'));
const camActs = (page) => page.evaluate(() => { const h = window.__cs.host(); return { cams: h.sim.cams.map(c => ({ name: c.name, act: c.act ?? null, auto: !!c.auto, ref: c.ref, follow: !!c.follow && c.ref !== false })), acts: h.sim.cfg.acts || null }; });

if (MODES.includes('live')) for (const w of VPS) {
  const { ctx, page, errs } = await boot(w);
  for (const id of await ids(page)) {
    curTag = 'open-' + id;
    await page.evaluate(id => window.__cs.openScene(id), id); await page.waitForTimeout(900);
    const { cams, acts } = await camActs(page);
    for (let ci = 0; ci < cams.length; ci++) { // preset-empty: every preset keeps its subject framed across the whole timeline
      if (CAMS.length && !CAMS.includes(ci) || cams[ci].ref === false) continue; // ref:false = a map view of ground markers, no craft subject
      for (const t of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
        await page.evaluate(({ ci, t }) => { const h = window.__cs.host(); h.playing = false; h._lm = {}; h.pickCam(ci); h.update(t); h.update(t); }, { ci, t });
        const q = await page.evaluate(SUBJ), F = [];
        if (q.drawn && !q.ok) F.push({ type: 'preset-empty', detail: `"${cams[ci].name}" t=${t}: subject not in frame (${q.refs.join('; ') || 'no craft'})` });
        record(tag('preset', id, w, 'c' + ci, 't' + t), F, { W: w });
      }
    }
    for (let ci = 0; ci < cams.length; ci++) {
      const c = cams[ci];
      if (CAMS.length && !CAMS.includes(ci)) continue;
      let tl = TS;
      if (c.act != null) tl = TS.filter(t => t >= acts[c.act].t0 && t < acts[c.act].t1);
      if (!tl.length) tl = [acts[c.act].t0 + 0.05];
      for (const t of tl) {
        await page.evaluate(({ ci, t }) => { const h = window.__cs.host(); h.playing = false; h._lm = {}; h.pickCam(ci); h.update(t); h.update(t); }, { ci, t });
        const S = await page.evaluate(LIVE, cams[ci].ref === false || !(ci === 0 || cams[ci].follow) ? [] : (KEY[id] || []).map(r => r.source)); S.def = ci === 0; S.kind = 'live'; S.follow = !!cams[ci].follow;
        S.evT = EVENTS[id]?.t ?? S.hitT; S.evRe = EVENTS[id]?.re;
        if (ci !== 0) S.action = undefined; else S.action = S.probe.action;
        const F = check(S);
        (statusByVp[`${id}|c${ci}|t${t}`] ||= {})[w] = S.status;
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
    S.kind = 'static'; S.def = false; S.action = undefined; S.resX = await page.evaluate(SSX);
    const parts = S.panels ? S.panels.map(p => ({ ...S, ...p, kind: 'static', def: false, action: undefined, audit: null })) : [S];
    if (S.panels) parts.forEach((p, i) => { if (i) p.resX = null; });
    if (S.panels && S.audit) parts[0].audit = S.audit;
    record(tag('static', id, w), parts.flatMap(check), { W: w, earth: S.earth });
    if (SHOT) await page.locator('#sceneView').screenshot({ path: `${out}/static-${id}-${w}.png` });
    if (w === 1440) {
      const url = await page.evaluate(() => window.__cs.exportStill());
      fs.writeFileSync(`${out}/still-static-${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
      const eb = await page.evaluate(EMPTY, url); record(tag('still-static', id), check({ kind: 'still', W: 1000, H: 1000, labels: [], reserved: [], emptyBand: eb.band, emptyArea: eb.area }), { W: w });
    }
    await page.evaluate(() => window.__cs.closeScene()); await page.waitForTimeout(100);
  }
  if (errs.length) console.log('console errors static', w, errs.slice(0, 5));
  await ctx.close();
}

// ---------------------------------------------------------------- hero (overview): live WebGL and the static diagram, at every viewport
const HEROLIVE = () => {
  const h = window.__cs.host(), T = h.T, W = h.el.clientWidth, H = h.el.clientHeight, cp = h.camera.position;
  const P = h._probe(W, H); let iss = null;
  for (const { it, obj } of h.dyn) if (it.iss && obj.visible) {
    obj.getWorldPosition(new T.Vector3());
    const p = new T.Vector3(); obj.getWorldPosition(p);
    const q = p.clone().project(h.camera), occ = (() => { const d = [p.x - cp.x, p.y - cp.y, p.z - cp.z], L = Math.hypot(...d), u = d.map(c => c / L), b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2], dd = b * b - (cp.lengthSq() - 1); return dd >= 0 && (-b - Math.sqrt(dd)) > 0 && (-b - Math.sqrt(dd)) < L - 1e-3; })();
    const m = P.pts.find(m => m.i === h.sim.items.indexOf(it));
    iss = { occ, px: m ? m.r * 2 : 0, on: Math.abs(q.x) < 1 && Math.abs(q.y) < 1 };
  }
  return { iss };
};
if (MODES.includes('hero')) for (const w of VPS) {
  const { ctx, page, errs } = await boot(w);
  await page.evaluate(() => { const b = document.getElementById('heroRot'); b && !b.hidden ? b.click() : document.getElementById('heroStage').dispatchEvent(new Event('pointerenter')); });
  await page.waitForFunction(() => { const h = window.__cs.host(); return h && h.sim && h.sim.cfg.spin && h.dyn; }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('#heroStage').scrollIntoViewIfNeeded();
  for (const t of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
    await page.evaluate(t => { const h = window.__cs.host(); h.playing = false; h._lm = {}; h.update(t); h.update(t); }, t);
    const S = await page.evaluate(LIVE, []); S.def = false; S.kind = 'hero'; S.action = undefined; S.u = 1;
    const F = check(S), hc = await page.evaluate(HEROLIVE);
    S.shellCrop = shellCrop(S.probe.circles, S.W, S.H, true); S.heroSpan = Math.max(0, ...(S.probe.circles || []).filter(c => c.ring).map(c => 2 * c.r)) / S.W; { const hp = check(S); F.length = 0; F.push(...hp); }
    if (hc.iss && !hc.iss.occ && hc.iss.on && hc.iss.px < 12) F.push({ type: 'hero-iss', detail: `ISS marker ${hc.iss.px.toFixed(0)} px at t=${t}` });
    if (!hc.iss) F.push({ type: 'hero-iss', detail: `no ISS marker at t=${t}` });
    record(tag('hero-live', w, 't' + t), F, { W: w });
    if (SHOT) await page.locator('#heroStage').screenshot({ path: `${out}/hero-live-${w}-t${t}.png` });
  }
  await ctx.close();
  const b2 = await boot(w, { reducedMotion: 'reduce' });
  await b2.page.waitForTimeout(800);
  const S2 = await b2.page.evaluate(STATIC, '#heroStage');
  if (!S2) record(tag('hero-static', w), [{ type: 'audit', detail: 'no static hero svg' }]);
  else { S2.kind = 'static'; S2.def = false; S2.action = undefined; S2.resX = await b2.page.evaluate(SSX, '#heroStage'); record(tag('hero-static', w), check(S2), { W: w });
    if (SHOT) await b2.page.locator('#heroStage').screenshot({ path: `${out}/hero-static-${w}.png` }); }
  await b2.ctx.close();
}
if (MODES.includes('still')) {
  const { ctx, page, errs } = await boot(1440);
  for (const id of await ids(page)) {
    await page.evaluate(id => window.__cs.openScene(id), id); await page.waitForTimeout(700);
    const stillT = await page.evaluate(() => { const h = window.__cs.host(); return h.sim.still; });
    const r = await page.evaluate(async () => {
      const h = window.__cs.host(); h.playing = false; h._lm = {}; h.update(h.sim.still);
      const url = h.stillPNG('Title', 'SWF 2026, Table 5-1, p. 05-01.'), z = h.stillLayout;
      const conv = q => ({ W: q.W, H: q.H, u: q.u,
        labels: q.labels.filter(Boolean).map(l => ({ text: l.text, x0: l.x - l.w / 2, x1: l.x + l.w / 2, y0: l.y - l.h / 2, y1: l.y + l.h / 2, leader: l.leader ? [l.ax, l.ay, l.qx, l.qy] : null, ref: [l.ax, l.ay], item: -1 })),
        reserved: (q.rsv || []).map((r, i) => ({ n: 'rsv' + i, x0: r[0], y0: r[1], x1: r[0] + r[2], y1: r[1] + r[3] })), probe: q.probe });
      return { url, tiles: (z.tiles || [z]).map(conv) };
    });
    fs.writeFileSync(`${out}/still-live-${id}.png`, Buffer.from(r.url.split(',')[1], 'base64'));
    const eb = await page.evaluate(EMPTY, r.url);
    const F = r.tiles.flatMap(t => check({ kind: 'still', u: t.u ?? t.W / 1000, W: t.W, H: t.H, labels: t.labels, reserved: t.reserved, probe: t.probe, def: false, shellCrop: shellCrop(t.probe && t.probe.circles, t.W, t.H), emptyBand: eb.band, emptyArea: eb.area, discVis: discVisible(t.probe && t.probe.disc, t.W, t.H), discBig: r.tiles.length > 1 || !!(t.probe && t.probe.disc && t.probe.disc.r >= 0.55 * Math.min(t.W, t.H)) }));
    // stills are ~3000 px wide: the pixel rules are scaled by u (label font scale) so the limits mean the same thing as in the live frame
    record(tag('still-live', id), F, { stillT });
    await page.evaluate(() => window.__cs.closeScene()); await page.waitForTimeout(100);
  }
  if (errs.length) console.log('console errors still', errs.slice(0, 5));
  await ctx.close();
}
// viewport-dependent counts: every number the 375 px status states must also appear in the 1440 px status for the same (scene, camera, t)
{
  const nums = (x) => (x || '').replace(/(\d),(\d)/g, '$1$2').match(/\d+(?:\.\d+)?/g) || [];
  for (const [k, v] of Object.entries(statusByVp)) {
    const hi = v[Math.max(...Object.keys(v).map(Number))], lo = v[Math.min(...Object.keys(v).map(Number))];
    if (hi == null || lo == null || Object.keys(v).length < 2) continue;
    const H = new Set(nums(hi)), bad = nums(lo).filter((n) => !H.has(n));
    if (bad.length) record('status-count-' + k, [{ type: 'status-count', detail: `375 px says ${bad.join(',')} but 1440 px says "${hi.slice(0, 80)}" vs "${lo.slice(0, 60)}"` }]);
  }
}
if (MODES.includes('stillapi')) await stillApiCheck();
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results));
const total = results.reduce((n, r) => n + r.F.length, 0) + pageErrs.length;
console.log('page errors', pageErrs.length, pageErrs.slice(0, 5));
console.log(`\nstates ${results.length}, failing states ${results.filter(r => r.F.length).length}, failures ${total}`, JSON.stringify(failCount));
await browser.close(); srv.close();
process.exit(total ? 1 : 0);

// ---- still API check (MODES=stillapi): window.__cs.host().stillPNG works in reduced motion (static) and live stills are native-resolution landscape frames
async function stillApiCheck() {
  const dims = async (page, url) =>
    page.evaluate(u => new Promise(r => { const i = new Image(); i.onload = () => r([i.width, i.height]); i.src = u; }), url);
  for (const [mode, extra] of [['static', { reducedMotion: 'reduce' }], ['live', {}]]) {
    const { ctx, page } = await boot(1440, extra);
    for (const id of await ids(page)) {
      await page.evaluate(id => window.__cs.openScene(id), id); await page.waitForTimeout(mode === 'static' ? 1500 : 700);
      const url = await page.evaluate(async () => {
        try { return await window.__cs.host().stillPNG('Title', 'Cite'); } catch (e) { return 'ERR ' + e.message; }
      });
      const F = [];
      if (!url || url.startsWith('ERR')) F.push({ type: 'still-api', detail: String(url) });
      else {
        const [w, h] = await dims(page, url);
        if (w < 3000 || h < 1000) F.push({ type: 'still-api', detail: `still ${w}x${h} under 3000 wide or 1000 high` });
      }
      record(tag('still-api-' + mode, id), F, {});
      await page.evaluate(() => window.__cs.closeScene()); await page.waitForTimeout(100);
    }
    await ctx.close();
  }
}
