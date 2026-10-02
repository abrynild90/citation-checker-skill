// scene_check rules (Node side): pure geometry helpers, the KEY / EVENTS / override tables and check(S), which turns one collected state into failures.
// Imported by tools/scene_check.mjs; the failure codes are documented at the top of that file.
// ---------------------------------------------------------------- pure geometry / rules (Node side)
const boxHit = (a, b, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
const segSeg = (a, b) => {
  const d = (b[3] - b[1]) * (a[2] - a[0]) - (b[2] - b[0]) * (a[3] - a[1]);
  if (Math.abs(d) < 1e-9) return false;
  const ua = ((b[2] - b[0]) * (a[1] - b[1]) - (b[3] - b[1]) * (a[0] - b[0])) / d,
    ub = ((a[2] - a[0]) * (a[1] - b[1]) - (a[3] - a[1]) * (a[0] - b[0])) / d;
  return ua > 0.03 && ua < 0.97 && ub > 0.03 && ub < 0.97;
};
const segBox = (s, b) => {
  // segment vs box interior shrunk 1.5 px (Liang-Barsky)
  const l = b.x0 + 1.5,
    r = b.x1 - 1.5,
    t = b.y0 + 1.5,
    bt = b.y1 - 1.5;
  let u0 = 0,
    u1 = 1;
  const dx = s[2] - s[0],
    dy = s[3] - s[1];
  for (const [p, q] of [
    [-dx, s[0] - l],
    [dx, r - s[0]],
    [-dy, s[1] - t],
    [dy, bt - s[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const u = q / p;
      if (p < 0) {
        if (u > u1) return false;
        if (u > u0) u0 = u;
      } else {
        if (u < u0) return false;
        if (u < u1) u1 = u;
      }
    }
  }
  return u1 - u0 > 0.02;
};
const distPtSeg = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1,
    dy = y2 - y1,
    L = dx * dx + dy * dy,
    u = L ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L)) : 0;
  return Math.hypot(px - x1 - u * dx, py - y1 - u * dy);
};
const leadersNear = (a, b) => {
  // segments that run within 2.5 px of each other over part of their length (not just at a shared end)
  let close = 0;
  for (let k = 0.1; k <= 0.9; k += 0.2) {
    const x = a[0] + (a[2] - a[0]) * k,
      y = a[1] + (a[3] - a[1]) * k;
    if (distPtSeg(x, y, ...b) < 2.5) close++;
  }
  return close >= 2;
};
const boxDisc = (b, d) => {
  const dx = Math.max(b.x0 - d.cx, 0, d.cx - b.x1),
    dy = Math.max(b.y0 - d.cy, 0, d.cy - b.y1);
  return Math.hypot(dx, dy) < d.r - 2;
};
const crossesCircle = (b, c) => {
  const dx0 = Math.max(b.x0 - c.cx, 0, c.cx - b.x1),
    dy0 = Math.max(b.y0 - c.cy, 0, c.cy - b.y1),
    fx = Math.max(Math.abs(b.x0 - c.cx), Math.abs(b.x1 - c.cx)),
    fy = Math.max(Math.abs(b.y0 - c.cy), Math.abs(b.y1 - c.cy));
  return Math.hypot(dx0, dy0) < c.r + 2 && Math.hypot(fx, fy) > c.r - 2;
};
export const shellCrop = (circles, W, H, hero) => {
  const out = [];
  for (const c of circles || []) {
    if (!c.ring) continue;
    const r = c.r * 1.05,
      inside = c.cx - r >= 2 && c.cx + r <= W - 2 && c.cy - r >= 2 && c.cy + r <= H - 2;
    const cover = [
      [0, 0],
      [W, 0],
      [0, H],
      [W, H],
    ].every(([x, y]) => Math.hypot(x - c.cx, y - c.cy) < r - 2);
    const dx = Math.max(-c.cx, 0, c.cx - W),
      dy = Math.max(-c.cy, 0, c.cy - H),
      away = Math.hypot(dx, dy) > r;
    // a wide hero stage: a shell may run off the top and the bottom together, sides fully inside
    const vOnly = hero && W / H > 1.7 && c.cx - r >= 2 && c.cx + r <= W - 2 && c.cy - r < 2 && c.cy + r > H - 2;
    if (!inside && !cover && !away && !vOnly) out.push(`shell r=${Math.round(c.r)} at (${Math.round(c.cx)},${Math.round(c.cy)}) is cut by the frame ${W}x${H}`);
  }
  return out;
};
const boxCircle = (b, c) => {
  const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1),
    dy = Math.max(b.y0 - c.y, 0, c.y - b.y1);
  return Math.hypot(dx, dy) < c.r;
};

// Event times that are not cfg.hit.t, and regexes for status text that describes the event; key objects that must stay in frame on the default camera.
export const EVENTS = { starfish: { t: 0.14, re: /detonation:|detonates/i } };
const HITRE = /collision|destroys|destroyed|detonat|fragments spread|debris spreads/i;
export const KEY = {
  viasat: [/KA-SAT/],
  laser: [/MSTI-3/, /White Sands/],
  'sj21-tug': [/SJ-21/, /Compass/],
  cosmos1408: [/^Cosmos 1408/],
  shakti: [/Microsat/],
  spaceplanes: [/^X-37B \(US\)/, /^X-37B OTV-7/, /^CSSHQ \(China\)/],
  rpo: [/SJ-2/, /USA 2/, /Cosmos 254/, /SKYNET/],
};
// Justified per-scene marker-size overrides (px, longer side): the marker IS the scene's subject. Must match cfg.staticMarkerCap in src/scenes/configs/*.js.
const MARKER_OVR = { laser: { 'MSTI-3 (US test target)': 44 }, viasat: { 'KA-SAT (GEO, unaffected)': 48 }, 'sj21-tug': { sj21: 280, cg2: 280 } };
// scenes whose static subject pair may take a bigger share of the Earth disc area than the default 20% (the pair is the point of the diagram)
const AREA_OVR = { 'sj21-tug': 0.8 };
const IMPACT = /impact|debris|collision|fragment|pieces|detonation|burst/i;

// S = {kind, W, H, labels:[{text, x0,y0,x1,y1, leader:[ax,ay,qx,qy]|null, item}], reserved:[{n,x0,y0,x1,y1}], probe, def (default camera), bannerLines}
export function check(S) {
  const F = [],
    { W, H } = S,
    u = S.u || 1,
    L = S.labels,
    P = S.probe || {},
    phone = W <= 400,
    lim = W * (phone ? 0.27 : 0.17);
  const f = (type, detail) => F.push({ type, detail });
  const B = L.map((l) => ({ x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1 }));
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) if (boxHit(B[i], B[j], -0.5)) f('label-overlap', `${L[i].text} / ${L[j].text}`);
    for (const r of S.reserved || []) if (boxHit(B[i], r, -1)) f('label-reserved', `${L[i].text} on ${r.n}`);
    if (P.pts)
      for (const m of P.pts)
        if (boxCircle(B[i], m) && m.i !== L[i].item)
          f('label-mark', `${L[i].text} covers a sprite at ${Math.round(m.x)},${Math.round(m.y)} r${Math.round(m.r)}`);
    if (B[i].x0 < 7.5 * u || B[i].y0 < 7.5 * u || B[i].x1 > W - 7.5 * u || B[i].y1 > H - 7.5 * u)
      f('label-edge', `${L[i].text} (${Math.round(B[i].x0)},${Math.round(B[i].y0)})-(${Math.round(B[i].x1)},${Math.round(B[i].y1)})`);
    const ld = L[i].leader;
    if (!ld && L[i].ref && isFinite(L[i].ref[0]) && S.kind !== 'static-skip') {
      const rx = L[i].ref[0],
        ry = L[i].ref[1],
        dx = Math.max(B[i].x0 - rx, 0, rx - B[i].x1),
        dy = Math.max(B[i].y0 - ry, 0, ry - B[i].y1),
        d = Math.hypot(dx, dy);
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
        const [ax, ay] = ld;
        let near = false,
          other = null;
        for (const m of P.pts || [])
          if (Math.hypot(ax - m.x, ay - m.y) < m.r + 3) {
            if (m.i === L[i].item || L[i].item == null || L[i].item < 0) near = true;
            else other = other || m;
          }
        for (const c of P.polys || []) {
          for (let k = 0; k + 1 < c.p.length && !near; k++) if (distPtSeg(ax, ay, ...c.p[k], ...c.p[k + 1]) < 4.5) near = true;
          if (near) break;
        }
        if (!near)
          for (const c of P.cloud || [])
            if (Math.hypot(ax - c[0], ay - c[1]) < 7) {
              near = true;
              break;
            }
        if (!near)
          for (const d of P.domes || [])
            if (Math.hypot(ax - d.x, ay - d.y) < d.r) {
              near = true;
              break;
            }
        if (!near)
          for (const c of P.circles || [])
            if (Math.abs(Math.hypot(ax - c.cx, ay - c.cy) - c.r) < 7 * (S.kind === 'still' ? Math.max(1, W / 1000) : 1)) {
              near = true;
              break;
              // the probe circle is a centred fit of an off-axis perspective shell silhouette: its tolerance is in frame pixels, so it scales with the 3000 px
              // still
            }
        if (!near)
          for (const m of P.marks || [])
            if (Math.hypot(ax - m.x, ay - m.y) < m.r + 3) {
              near = true;
              break;
            }
        if (!near) f('leader-end', `${L[i].text} ends on ${other ? 'another referent' : 'nothing'} at (${Math.round(ax)},${Math.round(ay)})`);
      }
    }
    // Earth disc: only a failure when a clear slot exists within reach
    if (P.disc && boxDisc(B[i], P.disc) && !L[i].onDisc) {
      const w = B[i].x1 - B[i].x0,
        h = B[i].y1 - B[i].y0,
        cx = (B[i].x0 + B[i].x1) / 2,
        cy = (B[i].y0 + B[i].y1) / 2,
        reach = 0.1 * W;
      const ref = L[i].ref && isFinite(L[i].ref[0]) ? L[i].ref : L[i].leader ? [L[i].leader[0], L[i].leader[1]] : [cx, cy];
      let ok = false;
      for (let dy = -reach; dy <= reach && !ok; dy += 6)
        for (let dx = -reach; dx <= reach && !ok; dx += 6) {
          if (Math.hypot(dx, dy) > reach) continue;
          const b = { x0: B[i].x0 + dx, x1: B[i].x1 + dx, y0: B[i].y0 + dy, y1: B[i].y1 + dy };
          // a slot must clear the disc by a margin, like the placer's own rule
          if (b.x0 < 8 || b.y0 < 8 || b.x1 > W - 8 || b.y1 > H - 8 || boxDisc(b, { ...P.disc, r: P.disc.r + 8 * u })) continue;
          const qx = Math.max(b.x0, Math.min(b.x1, ref[0])),
            qy = Math.max(b.y0, Math.min(b.y1, ref[1]));
          if (Math.hypot(qx - ref[0], qy - ref[1]) > lim * 0.9) continue;
          if (Math.hypot(qx - ref[0], qy - ref[1]) > 14 && L.some((o, j) => j !== i && o.leader && segSeg([ref[0], ref[1], qx, qy], o.leader))) continue;
          if (
            Math.hypot(qx - ref[0], qy - ref[1]) > 14 &&
            L.some((o, j) => j !== i && segBox([ref[0], ref[1], qx, qy], { x0: o.x0, x1: o.x1, y0: o.y0, y1: o.y1 }))
          )
            continue;
          if (
            Math.hypot(qx - ref[0], qy - ref[1]) > 14 &&
            (P.polys || []).some(
              (c) =>
                c.role !== 'line' &&
                c.role !== 'orbit' &&
                c.p.some((q, k) => k && segSeg([ref[0], ref[1], qx, qy], [c.p[k - 1][0], c.p[k - 1][1], q[0], q[1]])),
            )
          )
            continue;
          if (B.some((o, j) => j !== i && boxHit(b, o, 4)) || (S.reserved || []).some((r) => boxHit(b, r, 3))) continue;
          if ((P.pts || []).some((m) => boxCircle(b, { x: m.x, y: m.y, r: m.r + 4 }))) continue;
          // never sits on another label's object
          if (L.some((o, j) => j !== i && o.ref && o.ref[0] > b.x0 - 2 && o.ref[0] < b.x1 + 2 && o.ref[1] > b.y0 - 2 && o.ref[1] < b.y1 + 2)) continue;
          if ((P.circles || []).some((c) => c.ring && crossesCircle(b, c))) continue;
          if (
            (P.polys || []).some(
              (c) => c.role !== 'line' && c.role !== 'orbit' && c.p.some((q, k) => k && segBox([c.p[k - 1][0], c.p[k - 1][1], q[0], q[1]], b)),
            )
          )
            continue;
          if ((P.cloud || []).filter((q) => q[0] > b.x0 && q[0] < b.x1 && q[1] > b.y0 && q[1] < b.y1).length > 2) continue;
          ok = [Math.round((b.x0 + b.x1) / 2), Math.round((b.y0 + b.y1) / 2)];
        }
      if (ok) {
        const depth = Math.round(
          P.disc.r - Math.hypot(Math.max(B[i].x0 - P.disc.cx, 0, P.disc.cx - B[i].x1), Math.max(B[i].y0 - P.disc.cy, 0, P.disc.cy - B[i].y1)),
        );
        f('label-disc', `${L[i].text} on the Earth disc by ${depth} px, clear slot within reach at ${ok} (now ${Math.round(cx)},${Math.round(cy)})`);
      }
    }
  }
  if (S.def && P.refs) for (const r of P.refs) if (r.px < 6) f('ref-small', `${r.text} ${r.px.toFixed(1)} px`);
  // action region: each side counts at least 40% of the frame, so a long trail across the frame qualifies
  if (S.def && S.action !== undefined && !S.docked && !S.ringFrame) {
    // a ring-framed default camera (DN-2: the whole arc and the whole GEO ring) shows the action small by design; a docked pair is one object: the action
    // region is that single spot, so it is exempt while docked
    const a = S.action;
    const fr = a ? Math.max((a.x1 - a.x0) / W, 0.4) * Math.max((a.y1 - a.y0) / H, 0.4) : 0;
    if (fr < 0.2) f('action-small', `action region ${(fr * 100).toFixed(0)}% of frame`);
  }
  // burst-edge: on the default camera no burst ring / hit point / debris may touch the frame edge (it must sit inside with margin)
  if (S.def && S.kind === 'live') {
    const m = 4,
      hit = (x, y, r) => x - r < m || y - r < m || x + r > W - m || y + r > H - m;
    for (const q of P.pts || [])
      if (q.shape === 'flash' && hit(q.x, q.y, Math.max(q.r, q.ring || 0)))
        f('burst-edge', `burst ring r=${Math.round(Math.max(q.r, q.ring || 0))} at (${Math.round(q.x)},${Math.round(q.y)}) touches the ${W}x${H} frame edge`);
    const e = (P.cloud || []).filter((c) => Math.min(c[0], c[1], W - c[0], H - c[1]) > -2 && Math.min(c[0], c[1], W - c[0], H - c[1]) < 2);
    // debris fields of the hit scenes only (the Starfish belt and space-weather clouds fill the frame by design); >= 3 points in the edge band = the cloud is
    // cut, a lone fragment is an outlier
    if (S.hitT != null && e.length >= 3)
      f('burst-edge', `${e.length} debris point(s) touch the frame edge, first at (${Math.round(e[0][0])},${Math.round(e[0][1])})`);
  }
  // static ring fit: a ring-fit scene (cfg.staticFitRing) draws its whole orbit inside the panel, with a margin from every edge
  if (S.kind === 'static' && P.orbitPts) {
    const m = 4,
      bad = P.orbitPts.filter(([x, y]) => x < m || y < m || x > W - m || y > H - m);
    if (bad.length)
      f('static-ring-clip', `${bad.length} orbit point(s) outside the ${W}x${H} panel (first at ${Math.round(bad[0][0])},${Math.round(bad[0][1])})`);
  }
  // craft icon area cap: a context craft (the ISS) is at most 3% of the Earth disc area, any single craft (a subject) at most 20%; limb-only panels exempt
  if ((S.kind === 'static' || S.kind === 'static-still') && P.crafts && P.disc && P.disc.r < 0.8 * Math.max(W, H)) {
    const da = Math.PI * P.disc.r * P.disc.r,
      ctxScene = ['starfish', 'solwind', 'gnss'].includes(S.id); // those scenes: every icon is context (3%)
    for (const c of P.crafts) {
      const a = (c.w * c.h) / da,
        cap = ctxScene || !c.subject ? 0.03 : (AREA_OVR[S.id] ?? 0.2);
      if (a > cap) f('craft-area', `${S.kind} ${c.name} icon ${Math.round(c.w)}x${Math.round(c.h)} px is ${(a * 100).toFixed(1)}% of disc (> ${cap * 100}%)`);
      if (ctxScene && Math.abs(c.x - P.disc.cx) < c.w / 2 && Math.abs(c.y - P.disc.cy) < c.h / 2)
        f('craft-area', `${S.kind} ${c.name} icon covers the Earth centre`);
    }
  }
  // marker size: every static marker (site diamond, airliner, satellite, jammer) is at most the global cap (22 px at W=798, the 1440 viewport stage; scaled
  // with W, 10-24 px; 8 px in the 760 px print layout = 32 px in the 3000 px still);
  // only the scenes in MARKER_OVR (subject is the point) may be larger, up to the stated px, and svg-fallback must report the override.
  if ((S.kind === 'static' || S.kind === 'static-still') && P.crafts)
    for (const c of P.crafts) {
      const base = S.kind === 'static-still' ? 8 : Math.max(10, Math.min(24, (22 * W) / 798)),
        ovr = MARKER_OVR[S.id] && MARKER_OVR[S.id][c.id],
        lim = (ovr ? (base * ovr) / 22 : base) + 0.6,
        sz = Math.max(c.w, c.h);
      if (c.ovr && !ovr) f('marker-size', `${S.kind} ${c.name}: undeclared cap override (${c.cap} px)`);
      else if (sz > lim) f('marker-size', `${S.kind} ${c.name} marker ${Math.round(sz)} px > cap ${Math.round(lim)} px at W=${Math.round(W)}`);
    }
  if (S.minFont != null && S.minFont < 9) f('static-font', `smallest text ${S.minFont}px < 9px at ${W}px`);
  if (P.disc0 && P.polys)
    for (const c of P.polys) {
      if (c.role === 'beam' || c.p.length < 6) continue;
      const a = c.p[0],
        b = c.p[c.p.length - 1],
        Lc = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (Lc < 0.8 * P.disc0.r) continue;
      let dev = 0;
      for (const q of c.p) dev = Math.max(dev, distPtSeg(q[0], q[1], a[0], a[1], b[0], b[1]));
      if (dev < 0.06 * Lc && distPtSeg(P.disc0.cx, P.disc0.cy, a[0], a[1], b[0], b[1]) < 0.3 * P.disc0.r)
        f('orbit-thru-centre', `a ${c.role} curve of ${Math.round(Lc)} px is a straight chord through the Earth's centre (dev ${dev.toFixed(1)} px)`);
    }
  if (S.kind === 'live' && P.refs && !S.noSubject) {
    const thr = S.def ? (W >= 900 ? 22 : 18) : S.follow ? (W >= 900 ? 44 : 30) : 0;
    if (thr) for (const r of P.refs) if (r.px < thr && r.x > 0 && r.x < W && r.y > 0 && r.y < H) f('subject-small', `${r.text} ${r.px.toFixed(0)} px < ${thr}`);
  }
  if (S.kind === 'still' && P.disc) {
    // label font and subject centring (union of the Earth disc, shells that fit, and the action region)
    if (S.leadW != null && S.leadW < 4) f('still-leader', `leader line weight ${S.leadW.toFixed(1)} px < 4 px`);
    L.forEach((l) => {
      // every label that sits off its subject carries a leader
      if (l.leader || !l.raw) return;
      const dx = Math.max(l.x0 - l.raw[0], 0, l.raw[0] - l.x1),
        dy = Math.max(l.y0 - l.raw[1], 0, l.raw[1] - l.y1);
      if (Math.hypot(dx, dy) > 1.5 * u) f('still-leader', `${l.text} sits ${Math.round(Math.hypot(dx, dy))} px from its subject with no leader`);
    });
    if (u * 11 < 28) f('still-font', `label font ${(u * 11).toFixed(0)} px < 28 px`);
    const tile = W < 2000,
      b0 = (tile ? 0.1 : 0.04) * H,
      bh = (tile ? 0.9 : 0.9) * H - b0,
      d = P.disc,
      whole = d.r < 1.3 * bh; // a regional close-up (disc over 1.3 bands) is framed on its action only
    let x0 = 1e9,
      y0 = 1e9,
      x1 = -1e9,
      y1 = -1e9;
    const add = (a, b) => {
      x0 = Math.min(x0, a);
      y0 = Math.min(y0, b);
      x1 = Math.max(x1, a);
      y1 = Math.max(y1, b);
    };
    const dsc = (c, r, free) => {
      if (free) {
        add(c.cx - r, c.cy - r);
        add(c.cx + r, c.cy + r);
      } else {
        add(Math.max(0, c.cx - r), Math.max(0, c.cy - r));
        add(Math.min(W, c.cx + r), Math.min(H, c.cy + r));
      }
    };
    if (P.action) {
      add(P.action.x0, P.action.y0);
      add(P.action.x1, P.action.y1);
    }
    if (whole || !P.action) dsc(d, d.r, whole);
    if (whole) for (const c of P.circles || []) if (c.ring && c.r > 0 && Math.abs(c.cx - W / 2) < W) dsc(c, c.r, whole && c.r < 1.2 * bh);
    // a ring-framed still (SJ-21: the whole GEO ring is the frame): the ring itself is part of the subject
    if (S.id === 'sj21-tug') for (const c of P.polys || []) if (c.role === 'line' && c.p.length > 40) for (const [x, y] of c.p) add(x, y);
    const cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2;
    if (Math.abs(cx - W / 2) > 0.06 * W)
      f('still-centre', `subject centre x ${Math.round(cx)} is ${Math.round(Math.abs(cx - W / 2))} px off the frame centre (${W} wide)`);
    if (Math.abs(cy - (b0 + bh / 2)) > 0.08 * H)
      f('still-centre', `subject centre y ${Math.round(cy)} off the band centre ${Math.round(b0 + bh / 2)} (${H} high)`);
    // subject bbox fraction: the subject (Earth, shells that fit, action) fills >= 60% of the still body height (50% of a composite's tile)
    const sfr = (Math.min(H, y1) - Math.max(0, y0)) / H;
    // Earth-scale scenes: the Earth disc itself (not a bbox with orbits and labels) is >= 62% of the still body height
    if (S.id && ['starfish', 'solwind', 'fengyun', 'burnt-frost', 'shakti'].includes(S.id) && (2 * d.r) / H < 0.62)
      f('still-earth', `Earth disc is ${((200 * d.r) / H).toFixed(0)}% of the still body height (< 62%)`);
    // a ring-framed still (SJ-21, Cosmos 1408): no shell ring is cut by the frame or runs into the caption band
    if (sfr < (tile ? 0.5 : 0.6)) f('still-subject', `subject bbox is ${(sfr * 100).toFixed(0)}% of the still body height (< ${tile ? 50 : 60}%)`);
    if (whole && x1 - x0 < 0.5 * W && y1 - y0 < 0.5 * bh)
      f('still-centre', `subject only ${Math.round(((x1 - x0) / W) * 100)}% of the still width (too small)`);
  }
  if (S.emptyBand != null && S.emptyBand > 0.2) f('still-empty', `empty band (gap or lopsided margin) of ${(S.emptyBand * 100).toFixed(0)}% of the still`);
  if (S.emptyArea != null && S.emptyArea < 0.3) f('still-empty', `content fills only ${(S.emptyArea * 100).toFixed(0)}% of the still body`);
  if (S.discVis != null && !S.discBig && S.discVis > 0.5 && S.discVis < 0.985)
    f('still-crop', `Earth disc ${(S.discVis * 100).toFixed(0)}% inside the still (cropped)`);
  if (S.kind === 'hero' && W >= 900 && S.heroSpan != null && S.heroSpan < 0.7)
    f('hero-small', `outer ring spans ${(S.heroSpan * 100).toFixed(0)}% of the stage width`);
  if (S.hidden) for (const h of S.hidden) f('ref-hidden', h);
  if (S.status != null && S.evT != null && S.t < S.evT + 0.02 && (S.evRe || HITRE).test(S.status))
    f('status-early', `t=${S.t} < event ${S.evT}+0.02: "${S.status.slice(0, 70)}"`);
  if (S.statusLines > 1) f('status-wrap', `status wraps to ${S.statusLines} lines at ${W}px: "${(S.status || '').slice(0, 60)}"`);
  if (S.keyOut) for (const k of S.keyOut) f('key-out', k);
  if (S.hitT != null && S.def && S.t >= S.hitT + 0.1 && !L.some((l) => IMPACT.test(l.text)))
    f('no-impact', `no impact/debris label at t=${S.t} (hit ${S.hitT})`);
  if (S.shellCrop) for (const k of S.shellCrop) f('shell-crop', k);
  if (S.resX != null && S.resX < 1.5) f('still-res', `Earth supersampling ${S.resX.toFixed(2)}x < 1.5x`);
  if (S.bannerLines > 1) f('banner-wrap', `banner wraps to ${S.bannerLines} lines`);
  if (S.audit) for (const a of S.audit) f('audit', JSON.stringify(a).slice(0, 140));
  return F;
}
