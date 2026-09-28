// ============================================================================
// scenes/labels.js: screen-space label placement shared by live HTML labels, the PNG still and the SVG fallback
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
// Screen-space label de-confliction shared by the live HTML labels, the PNG still and the SVG fallback.
// list[i] = {x, y (preferred centre), px, py (object point), w, h, fixed} or null.
// Returns placements {x, y, leader, ax, ay, qx, qy}. Fixed labels are placed first; others are nudged
// up/down/sideways to the nearest free slot, clamped inside the frame, and given a leader line to the object.
export function placeLabels(list, W, H, reserved = [], disc = null, obst = []) {
  const boxes = reserved.map(r => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, w: r[2], h: r[3] })), segs = [], M = 4;
  const out = new Array(list.length).fill(null);
  const order = list.map((_, i) => i).filter(i => list[i]).sort((a, b) => ((list[b] && list[b].fixed) ? 1 : 0) - ((list[a] && list[a].fixed) ? 1 : 0) || a - b);
  // Does segment (x1,y1)-(x2,y2) pass through the interior of box b (shrunk by 1 px)? Liang-Barsky clip.
  const segBox = (x1, y1, x2, y2, b) => {
    const l = b.x - b.w / 2 + 1, r = b.x + b.w / 2 - 1, t = b.y - b.h / 2 + 1, bt = b.y + b.h / 2 - 1; let u0 = 0, u1 = 1; const dx = x2 - x1, dy = y2 - y1;
    for (const [p, q] of [[-dx, x1 - l], [dx, r - x1], [-dy, y1 - t], [dy, bt - y1]]) { if (p === 0) { if (q < 0) return false; } else { const u = q / p; if (p < 0) { if (u > u1) return false; if (u > u0) u0 = u; } else { if (u < u0) return false; if (u < u1) u1 = u; } } }
    return u1 - u0 > 0.02;
  };
  const segSeg = (a, b) => { const d = (b[3] - b[1]) * (a[2] - a[0]) - (b[2] - b[0]) * (a[3] - a[1]); if (Math.abs(d) < 1e-9) return false; const ua = ((b[2] - b[0]) * (a[1] - b[1]) - (b[3] - b[1]) * (a[0] - b[0])) / d, ub = ((a[2] - a[0]) * (a[1] - b[1]) - (a[3] - a[1]) * (a[0] - b[0])) / d; return ua > 0.02 && ua < 0.98 && ub > 0.02 && ub < 0.98; };
  // Obstacles are drawn paths (screen-space polylines): neither a label nor a leader line may cross them.
  const polyCross = (a, pl) => { for (let k = 0; k + 1 < pl.length; k++) if (segSeg(a, [pl[k][0], pl[k][1], pl[k + 1][0], pl[k + 1][1]])) return true; return false; };
  const polyBox = (pl, b) => { for (let k = 0; k + 1 < pl.length; k++) if (segBox(pl[k][0], pl[k][1], pl[k + 1][0], pl[k + 1][1], b)) return true; return false; };
  const run = order => {
  const boxes = reserved.map(r => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, w: r[2], h: r[3] })), segs = [], out = new Array(list.length).fill(null); let total = 0;
  for (const i of order) {
    const c = list[i]; if (!c || !isFinite(c.x + c.y + c.px + c.py)) continue;
    // An object hidden under the banner or caption band gets no label (nothing visible to point at).
    if (reserved.some(r => c.px > r[0] && c.px < r[0] + r[2] && c.py > r[1] && c.py < r[1] + r[3])) continue;
    const { w, h } = c;
    const cx = x => Math.max(w / 2 + M, Math.min(W - w / 2 - M, x)), cy = y => Math.max(h / 2 + M, Math.min(H - h / 2 - M, y));
    const hits = (x, y) => boxes.reduce((n, b) => n + (Math.abs(x - b.x) < (w + b.w) / 2 + 3 && Math.abs(y - b.y) < (h + b.h) / 2 + 2 ? 1 : 0), 0);
    const cost = (x, y) => {
      const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)), qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py)), lead = Math.hypot(qx - c.px, qy - c.py) > h * 0.9;
      let n = hits(x, y) * 1000 + Math.hypot(x - c.x, y - c.y) * 0.01;
      if (lead) { n += Math.hypot(qx - c.px, qy - c.py) * 0.04; for (const b of boxes) if (segBox(c.px, c.py, qx, qy, b)) n += 600; for (const s of segs) if (segSeg([c.px, c.py, qx, qy], s)) n += 500; }
      if (lead) for (const pl of obst) if (polyCross([c.px, c.py, qx, qy], pl)) n += 550;
      const me = { x, y, w, h }; for (let o = 0; o < list.length; o++) { const q = list[o]; if (q && q !== c && Math.abs(q.px - x) < w / 2 + 2 && Math.abs(q.py - y) < h / 2 + 2) n += 400; }
      for (const pl of obst) if (polyBox(pl, me)) n += 650;
      for (const s of segs) if (segBox(s[0], s[1], s[2], s[3], me)) n += 600;
      if (disc && c.avoidDisc && Math.hypot(x - disc.cx, y - disc.cy) < disc.r + Math.hypot(w, h) * 0.35) { const dx0 = Math.max(Math.abs(x - disc.cx) - w / 2, 0), dy0 = Math.max(Math.abs(y - disc.cy) - h / 2, 0); if (Math.hypot(dx0, dy0) < disc.r) n += 900; }
      return n;
    };
    const cand = [[0, 0]];
    for (let k = 1; k <= 8; k++) cand.push([0, -k * h * 1.12], [0, k * h * 1.12]);
    for (const j of [0, -1, 1, -2, 2, -3, 3]) { cand.push([w * 0.55 + 14, j * h * 1.12], [-(w * 0.55 + 14), j * h * 1.12]); }
    for (const m of [1.4, 2.2, 3.2]) for (let a = 0; a < 8; a++) cand.push([Math.cos(a * Math.PI / 4) * (w * 0.55 + 14) * m, Math.sin(a * Math.PI / 4) * (h * 1.6) * m]);
    let best = null, bestN = 1e9;
    const tryAt = (x, y) => { const n = cost(x, y); if (n < bestN) { best = [x, y]; bestN = n; } return n; };
    for (const [dx, dy] of cand) if (tryAt(cx(c.x + dx), cy(c.y + dy)) < 0.5) break;
    // Nothing clean nearby (crowded frame or a reserved band in the way): search the whole free area on a grid.
    if (bestN >= 500) for (let gy = h / 2 + M; gy <= H - h / 2 - M; gy += Math.max(4, h * 0.4)) for (let gx = w / 2 + M; gx <= W - w / 2 - M; gx += Math.max(6, w * 0.12)) tryAt(gx, gy);
    total += bestN; const [x, y] = best; boxes.push({ x, y, w, h });
    const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)), qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py)), leader = Math.hypot(qx - c.px, qy - c.py) > h * 0.9;
    if (leader) segs.push([c.px, c.py, qx, qy]);
    out[i] = { x, y, leader, ax: c.px, ay: c.py, qx, qy };
  }
  return { out, total };
  };
  // Greedy placement in a few different orders when the first leaves a collision or a crossing leader; keep the cleanest result.
  const fx = order.filter(i => list[i] && list[i].fixed), rest = order.filter(i => !(list[i] && list[i].fixed)), tries = [order, fx.concat(rest.slice().reverse()), fx.concat(rest.slice().sort((p, q) => (list[p].py || 0) - (list[q].py || 0))), fx.concat(rest.slice().sort((p, q) => (list[q].py || 0) - (list[p].py || 0))), fx.concat(rest.slice().sort((p, q) => (list[p].px || 0) - (list[q].px || 0))), fx.concat(rest.slice().sort((p, q) => (list[q].px || 0) - (list[p].px || 0)))];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 12; k++) { const r = rest.slice(); for (let j = r.length - 1; j > 0; j--) { const m = Math.floor(rnd() * (j + 1)); [r[j], r[m]] = [r[m], r[j]]; } tries.push(fx.concat(r)); }
  let bestRun = null;
  for (const o of tries) { const r = run(o); if (!bestRun || r.total < bestRun.total) bestRun = r; if (bestRun.total < 300) break; }
  return bestRun.out;
}
// Push a label box (centre x,y size w,h) out of a disc (globe on screen) so it never sits on the planet.
function offDisc(x, y, w, h, cx, cy, r) {
  let dx = x - cx, dy = y - cy; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  const need = r + Math.abs(dx) * w / 2 + Math.abs(dy) * h / 2 + 12;
  return d >= need ? [x, y] : [cx + dx * need, cy + dy * need];
}
// Label pill width: measured with the label font when a canvas is available (falls back to a per-character estimate).
let _mctx; const _mw = {};
const labelW = (text, u = 1) => { let w = _mw[text]; if (w == null) { try { _mctx ||= document.createElement('canvas').getContext('2d'); _mctx.font = '600 11px system-ui,sans-serif'; w = _mctx.measureText(text).width; } catch (e) { w = text.length * 6.6; } _mw[text] = w; } return (w + 16) * u; };

