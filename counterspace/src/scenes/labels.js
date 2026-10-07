// ============================================================================
// scenes/labels.js: screen-space label placement shared by live HTML labels, the PNG still and the SVG fallback
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
// ============================================================================
// Screen-space label de-confliction shared by the live HTML labels, the PNG still and the SVG fallback.
// list[i] = {x, y (preferred centre), px, py (object point), w, h, fixed} or null.
// Optional extras: obst = drawn paths (leaders and labels avoid them; .soft paths are only lightly penalised), extra = {marks: sprite circles, rings:
// ring polylines,
// parts: particle-count grid, fine: finer fallback search, scale: px scale of the canvas}: a label never sits on those; entries flagged opt are
// dropped if they cannot be placed cleanly.
// Returns placements {x, y, leader, ax, ay, qx, qy}. Fixed labels are placed first; others are nudged
// up/down/sideways to the nearest free slot, clamped inside the frame, and given a leader line to the object.
import { SANS } from '../fonts.js';
export function placeLabels(list, W, H, reserved = [], disc = null, obst = [], memo = null, extra = null) {
  const ex = extra || {},
    marks = ex.marks || [],
    rings = ex.rings || [],
    parts = ex.parts || null;
  const boxes = reserved.map((r) => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, w: r[2], h: r[3] })),
    segs = [],
    M = (ex.edge ?? 12) * (ex.scale || 1),
    MX = (ex.edgeX ?? ex.edge ?? 12) * (ex.scale || 1); // ex.edgeX (desktop live view: 24): the pill's x stays this far from the left and right edges (the leader is not clamped)
  const out = new Array(list.length).fill(null);
  const order = list
    .map((_, i) => i)
    .filter((i) => list[i])
    .sort((a, b) => (list[b] && list[b].fixed ? 1 : 0) - (list[a] && list[a].fixed ? 1 : 0) || a - b);
  // Does segment (x1,y1)-(x2,y2) pass through the interior of box b (shrunk by 1 px)? Liang-Barsky clip.
  const segBox = (x1, y1, x2, y2, b) => {
    const l = b.x - b.w / 2 + 1,
      r = b.x + b.w / 2 - 1,
      t = b.y - b.h / 2 + 1,
      bt = b.y + b.h / 2 - 1;
    let u0 = 0,
      u1 = 1;
    const dx = x2 - x1,
      dy = y2 - y1;
    for (const [p, q] of [
      [-dx, x1 - l],
      [dx, r - x1],
      [-dy, y1 - t],
      [dy, bt - y1],
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
  const segSeg = (a, b) => {
    const d = (b[3] - b[1]) * (a[2] - a[0]) - (b[2] - b[0]) * (a[3] - a[1]);
    if (Math.abs(d) < 1e-9) return false;
    const ua = ((b[2] - b[0]) * (a[1] - b[1]) - (b[3] - b[1]) * (a[0] - b[0])) / d,
      ub = ((a[2] - a[0]) * (a[1] - b[1]) - (a[3] - a[1]) * (a[0] - b[0])) / d;
    return ua > 0.02 && ua < 0.98 && ub > 0.02 && ub < 0.98;
  };
  // Obstacles are drawn paths (screen-space polylines): neither a label nor a leader line may cross them.
  const polyCross = (a, pl) => {
    for (let k = 0; k + 1 < pl.length; k++) if (segSeg(a, [pl[k][0], pl[k][1], pl[k + 1][0], pl[k + 1][1]])) return true;
    return false;
  };
  const polyBox = (pl, b) => {
    for (let k = 0; k + 1 < pl.length; k++) if (segBox(pl[k][0], pl[k][1], pl[k + 1][0], pl[k + 1][1], b)) return true;
    return false;
  };
  // Best slot for label i given the boxes and leader segments already placed.
  const mk = (i, boxes, segs) => {
    const c = list[i];
    if (!c || !isFinite(c.x + c.y + c.px + c.py)) return null;
    // An object hidden under the banner or caption band gets no label (nothing visible to point at).
    if (reserved.some((r) => c.px > r[0] && c.px < r[0] + r[2] && c.py > r[1] && c.py < r[1] + r[3])) return null;
    const { w, h } = c;
    const cx = (x) => Math.max(w / 2 + MX, Math.min(W - w / 2 - MX, x)),
      cy = (y) => Math.max(h / 2 + M, Math.min(H - h / 2 - M, y));
    const hits = (x, y) => boxes.reduce((n, b) => n + (Math.abs(x - b.x) < (w + b.w) / 2 + (ex.gap ?? 5) && Math.abs(y - b.y) < (h + b.h) / 2 + (ex.gap ?? 5) ? 1 : 0), 0);
    // A leader longer than this (share of the canvas width) is a defect: the label belongs next to its object.
    const lim = W * (W <= 400 ? 0.27 : 0.17);
    const cost = (x, y) => {
      let soft = 0;
      const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)),
        qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py)),
        lead = !c.noLeader && Math.hypot(qx - c.px, qy - c.py) > h * (c.leaderK ?? 0.9); // c.leaderK (opt-in, cfg.leaderK for place and orbit names): a name with a small gap still gets its leader
      let n = hits(x, y) * 1000 + Math.hypot(x - c.x, y - c.y) * (c.pin === 'hard' ? 3 : c.pin ? 0.6 : c.noLeader ? 0.3 : 0.01);
      if (memo && memo[i]) n += Math.hypot(x - memo[i][0], y - memo[i][1]) * 0.06; // stickiness: keep last frame's slot unless something clearly better exists
      if (lead) {
        const ll0 = Math.hypot(qx - c.px, qy - c.py);
        if (ll0 > lim * 0.92) n += 330 + (ll0 - lim * 0.92) * 2;
        if (ex.leaderCap && ll0 > ex.leaderCap) n += 260 + (ll0 - ex.leaderCap) * 3; // ex.leaderCap (desktop live view, ~120 px): a long leader is a defect, the pill belongs near its item
        n += ll0 * 0.12;
        for (const b of boxes) if (segBox(c.px, c.py, qx, qy, b)) n += 600;
        for (const s of segs) if (segSeg([c.px, c.py, qx, qy], s)) n += 500;
      }
      if (lead) for (const pl of obst) if (polyCross([c.px, c.py, qx, qy], pl)) n += pl.soft ? 70 : 550;
      const me = { x, y, w: w + 6, h: h + 6 };
      for (let o = 0; o < list.length; o++) {
        const q = list[o];
        if (q && q !== c && Math.abs(q.px - x) < w / 2 + 2 && Math.abs(q.py - y) < h / 2 + 2) n += 400;
      }
      for (const pl of obst) if (polyBox(pl, me)) n += pl.soft ? 90 : 650;
      // Sprites, ring lines and dense particle clumps are things a label must not sit on (its leader may still point into them).
      for (const m of marks) {
        const ddx = Math.max(Math.abs(x - m.x) - w / 2, 0),
          ddy = Math.max(Math.abs(y - m.y) - h / 2, 0);
        if (ddx * ddx + ddy * ddy < (m.r + 3) * (m.r + 3)) n += 700;
      }
      for (const rg of rings) if (polyBox(rg, me)) n += 140; // a thin ring line under a label is a smaller defect than a label on the planet
      if (parts) {
        const pc = parts.count(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
        if (pc > 2) n += Math.min(900, (pc - 2) * 140);
      }
      for (const s of segs) if (segBox(s[0], s[1], s[2], s[3], me)) n += 600;
      if (disc && Math.hypot(x - disc.cx, y - disc.cy) < disc.r + Math.hypot(w, h) * 0.55) {
        const dx0 = Math.max(Math.abs(x - disc.cx) - w / 2, 0),
          dy0 = Math.max(Math.abs(y - disc.cy) - h / 2, 0);
        if (Math.hypot(dx0, dy0) < disc.r) {
          if (c.avoidDisc) n += 900;
          else if (!c.onDisc) soft += 320; // a label prefers open sky to the planet whenever a slot is within reach
        }
      }
      m.soft = soft;
      return n + soft;
    };
    const m = { c, w, h, cx, cy, cost, soft: 0 };
    return m;
  };
  // Cost of label i at (x, y) split into [hard collisions, soft preferences].
  const scoreAt = (i, x, y, boxes, segs) => {
    const m = mk(i, boxes, segs),
      n = m.cost(x, y);
    return [n - m.soft, m.soft];
  };
  const place = (i, boxes, segs) => {
    const m = mk(i, boxes, segs);
    if (!m) return null;
    const { c, w, h, cx, cy, cost } = m;
    const cand = [[0, 0]];
    for (const dy of [4, -4, 8, -8, 12, -12, 16, -16]) cand.push([0, dy]); // small nudges first: often enough to clear a thin line
    for (const dx of [8, -8, 16, -16]) cand.push([dx, 0]);
    for (let k = 1; k <= 8; k++) cand.push([0, -k * h * 1.12], [0, k * h * 1.12]);
    for (const j of [0, -1, 1, -2, 2, -3, 3]) {
      cand.push([w * 0.55 + 14, j * h * 1.12], [-(w * 0.55 + 14), j * h * 1.12]);
    }
    for (const m of [1.4, 2.2, 3.2])
      for (let a = 0; a < 8; a++) cand.push([Math.cos((a * Math.PI) / 4) * (w * 0.55 + 14) * m, Math.sin((a * Math.PI) / 4) * (h * 1.6) * m]);
    let best = null,
      bestN = 1e9;
    const tryAt = (x, y) => {
      const n = cost(x, y);
      if (n < bestN) {
        best = [x, y];
        bestN = n;
      }
      return n;
    };
    let bestSoft = 0;
    const tryAt2 = (x, y) => {
      const n = tryAt(x, y);
      if (best && best[0] === x && best[1] === y) bestSoft = m.soft;
      return n;
    };
    for (const [dx, dy] of cand) if (tryAt2(cx(c.x + dx), cy(c.y + dy)) < 0.5) break;
    // Still resting on the planet (or a soft cost): try rings of slots around the preferred spot, nearest first.
    if (bestN >= 30 && bestN < 500)
      for (const rad of [30, 48, 70, 96, 128, 164, 204, 250])
        for (let a = 0; a < 16; a++) tryAt2(cx(c.x + Math.cos((a * Math.PI) / 8) * rad), cy(c.y + Math.sin((a * Math.PI) / 8) * rad * 0.8));
    // Still resting on the planet: a dense local scan for any slot off it (same cost function, so every other rule still holds).
    if (bestSoft > 0 && bestN < 500) {
      const R0 = 0.11 * W;
      for (let gy = -R0; gy <= R0; gy += 5) for (let gx = -R0; gx <= R0; gx += 5) if (gx * gx + gy * gy <= R0 * R0) tryAt2(cx(c.x + gx), cy(c.y + gy));
    }
    // Nothing clean nearby (crowded frame or a reserved band in the way): search the whole free area on a grid.
    if (bestN >= 500)
      for (let gy = h / 2 + M; gy <= H - h / 2 - M; gy += ex.fine ? Math.max(3, h * 0.15) : Math.max(4, h * 0.4))
        for (let gx = w / 2 + MX; gx <= W - w / 2 - MX; gx += ex.fine ? Math.max(5, w * 0.05) : Math.max(6, w * 0.12)) tryAt2(gx, gy);
    return [best[0], best[1], bestN, bestSoft];
  };
  const fin = (i, x, y, boxes, segs, out) => {
    const c = list[i],
      { w, h } = c;
    boxes.push({ x, y, w, h });
    const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)),
      qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py)),
      leader = !c.noLeader && Math.hypot(qx - c.px, qy - c.py) > h * (c.leaderK ?? 0.9); // c.leaderK (opt-in, cfg.leaderK for place and orbit names): a name with a small gap still gets its leader
    if (leader) segs.push([c.px, c.py, qx, qy]);
    out[i] = { x, y, leader, ax: c.px, ay: c.py, qx, qy };
  };
  const base = () => reserved.map((r) => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, w: r[2], h: r[3] }));
  const run = (order) => {
    const boxes = base(),
      segs = [],
      out = new Array(list.length).fill(null),
      got = [];
    let total = 0,
      hard = 0;
    for (const i of order) {
      const r = place(i, boxes, segs);
      if (!r) continue;
      total += r[2];
      hard += r[2] - r[3];
      got.push(i);
      fin(i, r[0], r[1], boxes, segs, out);
    }
    return { out, total, got, hard };
  };
  // Repair sweeps: re-place each label with every other one held fixed (lets a late label undo an early greedy choice).
  const sym = (out, got) => {
    let t = 0,
      hd = 0;
    for (const j of got) {
      const bx = base(),
        sg = [];
      for (const k of got)
        if (k !== j) {
          const o = out[k];
          bx.push({ x: o.x, y: o.y, w: list[k].w, h: list[k].h });
          if (o.leader) sg.push([o.ax, o.ay, o.qx, o.qy]);
        }
      const [a, b] = scoreAt(j, out[j].x, out[j].y, bx, sg);
      t += a + b;
      hd += a;
    }
    return [t, hd];
  };
  const repair = (res) => {
    let [cur, hd] = sym(res.out, res.got);
    for (let pass = 0; pass < 2 && (hd >= 300 || cur - hd >= 100); pass++)
      for (const i of res.got) {
        const boxes = base(),
          segs = [];
        for (const j of res.got)
          if (j !== i) {
            const o = res.out[j];
            boxes.push({ x: o.x, y: o.y, w: list[j].w, h: list[j].h });
            if (o.leader) segs.push([o.ax, o.ay, o.qx, o.qy]);
          }
        const r = place(i, boxes, segs);
        if (!r) continue;
        const no = res.out.slice(),
          nb = [],
          ns = [];
        fin(i, r[0], r[1], nb, ns, no);
        const [t, th] = sym(no, res.got);
        if (t < cur - 1) {
          res.out = no;
          cur = t;
          hd = th;
        }
      }
    res.total = cur;
    return res;
  };
  // Greedy placement in a few different orders when the first leaves a collision or a crossing leader; keep the cleanest result.
  const fx = order.filter((i) => list[i] && list[i].fixed),
    rest = order.filter((i) => !(list[i] && list[i].fixed)),
    tries = [
      order,
      fx.concat(rest.slice().reverse()),
      fx.concat(rest.slice().sort((p, q) => (list[p].py || 0) - (list[q].py || 0))),
      fx.concat(rest.slice().sort((p, q) => (list[q].py || 0) - (list[p].py || 0))),
      fx.concat(rest.slice().sort((p, q) => (list[p].px || 0) - (list[q].px || 0))),
      fx.concat(rest.slice().sort((p, q) => (list[q].px || 0) - (list[p].px || 0))),
    ];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 4; k++) {
    const r = rest.slice();
    for (let j = r.length - 1; j > 0; j--) {
      const m = Math.floor(rnd() * (j + 1));
      [r[j], r[m]] = [r[m], r[j]];
    }
    tries.push(fx.concat(r));
  }
  let bestRun = null;
  for (const o of tries) {
    const r = run(o);
    if (!bestRun || r.total < bestRun.total) bestRun = r;
    if (bestRun.hard < 300) break;
  }
  repair(bestRun);
  // An optional label (opt) that still collides with something hard is dropped rather than drawn on top of it.
  if (list.some((c) => c && c.opt))
    for (let pass = 0; pass < 2; pass++) {
      let dropped = false;
      for (const j of bestRun.got) {
        const o = bestRun.out[j];
        if (!o || !list[j].opt) continue;
        const bx = base(),
          sg = [];
        for (const k of bestRun.got)
          if (k !== j && bestRun.out[k]) {
            const q = bestRun.out[k];
            bx.push({ x: q.x, y: q.y, w: list[k].w, h: list[k].h });
            if (q.leader) sg.push([q.ax, q.ay, q.qx, q.qy]);
          }
        if (scoreAt(j, o.x, o.y, bx, sg)[0] >= 300) {
          bestRun.out[j] = null;
          dropped = true;
        }
      }
      if (!dropped) break;
    }
  if (memo)
    bestRun.out.forEach((o, i) => {
      if (o) memo[i] = [o.x, o.y];
      else delete memo[i];
    });
  return bestRun.out;
}
// Push a label box (centre x,y size w,h) out of a disc (globe on screen) so it never sits on the planet.
export function offDisc(x, y, w, h, cx, cy, r) {
  let dx = x - cx,
    dy = y - cy;
  const d = Math.hypot(dx, dy) || 1;
  dx /= d;
  dy /= d;
  const need = r + (Math.abs(dx) * w) / 2 + (Math.abs(dy) * h) / 2 + 12;
  return d >= need ? [x, y] : [cx + dx * need, cy + dy * need];
}
// Label pill width: measured with the label font when a canvas is available (falls back to a per-character estimate).
let _mctx;
const _mw = {};
export const labelW = (text, u = 1) => {
  let w = _mw[text];
  if (w == null) {
    try {
      _mctx ||= document.createElement('canvas').getContext('2d');
      _mctx.font = `600 11px ${SANS}`;
      w = _mctx.measureText(text).width;
    } catch (e) {
      w = text.length * 6.6;
    }
    _mw[text] = w;
  }
  return (w + 16) * u;
};
// ---------------------------------------------------------------- the label look (DESIGN.md section 7)
// One pill for live 3D labels, status captions and, through labelBox(), the placement boxes of stills: a 1 px border on a dark glass, type 12.5 px (13 px on
// touch screens), a 7 px dot of the item's colour at the left, a 1 px leader that ends in a 3 px dot on the item. Places and orbit names drop the dot and
// sit at 85% opacity. Warnings and analysis captions use the warm accent. Sizes below are for scale u = 1.
export const LABEL = {
  size: 12.5,
  touch: 13,
  padX: 9,
  padY: 4,
  border: 1,
  dot: 7,
  gap: 6,
  radius: 8,
  bg: 'rgba(8,13,28,.86)',
  edge: 'rgba(150,175,230,.35)',
  text: '#eef2fb',
  warm: '#ffc86b',
  leader: 'rgba(238,242,251,.55)',
  casing: 'rgba(8,13,28,.28)',
  leaderDot: 3,
  place: 0.85,
};
let _coarse;
export const labelPx = () => ((_coarse ??= matchMedia('(pointer: coarse)').matches), _coarse ? LABEL.touch : LABEL.size);
const _bw = {};
// Size of a pill for `text` at scale u (with or without the colour dot): what the placer reserves and what the DOM draws.
export function labelBox(text, u = 1, dot = true) {
  const fs = labelPx(),
    key = fs + '|' + text;
  let w = _bw[key];
  if (w == null) {
    try {
      _mctx ||= document.createElement('canvas').getContext('2d');
      _mctx.font = `600 ${fs}px ${SANS}`;
      w = _mctx.measureText(text).width;
      if (!document.fonts || document.fonts.status === 'loaded') _bw[key] = w; // never cache a measurement made with a fallback font
    } catch (e) {
      w = text.length * fs * 0.58;
    }
  }
  return {
    w: (w + 2 * (LABEL.padX + LABEL.border) + (dot ? LABEL.dot + LABEL.gap : 0)) * u,
    h: (Math.round(fs * 1.2) + 2 * (LABEL.padY + LABEL.border)) * u,
  };
}
// Inline style of a pill element. place: a place or orbit name (no dot, 85%); warm: a caption in the accent colour; block: a caption that may wrap.
export function pillCss({ place = false, warm = false, block = false } = {}) {
  const fs = labelPx(),
    line = Math.round(fs * (block ? 1.3 : 1.2));
  return (
    `position:absolute;transform:translate(-50%,-50%);display:${block ? 'block' : 'flex'};align-items:center;gap:${LABEL.gap}px;box-sizing:border-box;` +
    `padding:${LABEL.padY}px ${LABEL.padX}px;border:${LABEL.border}px solid ${LABEL.edge};border-radius:${LABEL.radius}px;background:${LABEL.bg};` +
    `color:${warm ? LABEL.warm : LABEL.text};font:600 ${fs}px/${line}px ${SANS};font-variant-numeric:tabular-nums;white-space:nowrap;pointer-events:none;` +
    (place ? `opacity:${LABEL.place};` : '')
  );
}
export function dotCss(color) {
  return `flex:none;width:${LABEL.dot}px;height:${LABEL.dot}px;border-radius:50%;background:${color || LABEL.text}`;
}
// The "illustrative" banner sits over the scene view: keep it on one line at any width (its CSS allows 70% of the view, which wraps on a phone).
export function fitBanner(view) {
  const b = view?.querySelector(':scope > .illus');
  if (!b) return;
  b.style.whiteSpace = 'nowrap';
  b.style.maxWidth = 'calc(100% - 20px)';
  b.style.fontSize = '';
  const room = view.clientWidth - 20;
  if (room > 0 && b.scrollWidth > room) b.style.fontSize = Math.max(8.5, Math.floor(((11 * room) / b.scrollWidth) * 10) / 10) + 'px';
}
