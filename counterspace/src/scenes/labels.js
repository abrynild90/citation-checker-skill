// ============================================================================
// scenes/labels.js: screen-space label placement shared by live HTML labels, the PNG still and the SVG fallback
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
// Screen-space label de-confliction shared by the live HTML labels, the PNG still and the SVG fallback.
// list[i] = {x, y (preferred centre), px, py (object point), w, h, fixed} or null.
// Returns placements {x, y, leader, ax, ay, qx, qy}. Fixed labels are placed first; others are nudged
// up/down/sideways to the nearest free slot, clamped inside the frame, and given a leader line to the object.
export function placeLabels(list, W, H, reserved = [], disc = null) {
  const boxes = reserved.map(r => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, w: r[2], h: r[3] })), segs = [];
  const out = new Array(list.length).fill(null);
  const order = list.map((_, i) => i).sort((a, b) => ((list[b] && list[b].fixed) ? 1 : 0) - ((list[a] && list[a].fixed) ? 1 : 0) || a - b);
  const inBox = (x, y, b, pad) => Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(y - b.y) < b.h / 2 + pad;
  // How many boxes does the segment (x1,y1)-(x2,y2) pass through? (sampled; used so leader lines never cross another label)
  const crossings = (x1, y1, x2, y2, skip) => { let n = 0; for (const b of boxes) { if (b === skip) continue; for (let u = 0.05; u < 0.96; u += 0.05) if (inBox(x1 + (x2 - x1) * u, y1 + (y2 - y1) * u, b, 1)) { n++; break; } } return n; };
  const segHitsBox = (s, b) => { for (let u = 0; u <= 1; u += 0.05) if (inBox(s[0] + (s[2] - s[0]) * u, s[1] + (s[3] - s[1]) * u, b, 1)) return true; return false; };
  for (const i of order) {
    const c = list[i]; if (!c) continue;
    const { w, h } = c, gap = 3;
    const cx = x => Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, x)), cy = y => Math.max(h / 2 + 3, Math.min(H - h / 2 - 3, y));
    const hits = (x, y) => boxes.reduce((n, b) => n + (Math.abs(x - b.x) < (w + b.w) / 2 + gap && Math.abs(y - b.y) < (h + b.h) / 2 + 1 ? 1 : 0), 0);
    const cand = [[0, 0]];
    for (let k = 1; k <= 8; k++) cand.push([0, -k * h * 1.12], [0, k * h * 1.12]);
    for (const j of [0, -1, 1, -2, 2, -3, 3]) { cand.push([w * 0.55 + 14, j * h * 1.12], [-(w * 0.55 + 14), j * h * 1.12]); }
    for (const m of [1.4, 2.2, 3.2]) for (let a = 0; a < 8; a++) cand.push([Math.cos(a * Math.PI / 4) * (w * 0.55 + 14) * m, Math.sin(a * Math.PI / 4) * (h * 1.6) * m]);
    let best = null, bestN = 1e9;
    for (const [dx, dy] of cand) {
      const x = cx(c.x + dx), y = cy(c.y + dy), me = { x, y, w, h };
      const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)), qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py)), lead = Math.hypot(qx - c.px, qy - c.py) > h * 0.9;
      let n = hits(x, y) * 1000 + Math.hypot(x - c.x, y - c.y) * 0.01;
      if (lead) { n += crossings(c.px, c.py, qx, qy, null) * 600 + Math.hypot(qx - c.px, qy - c.py) * 0.04; }
      for (const s of segs) if (segHitsBox(s, me)) n += 600;
      if (disc && c.avoidDisc && Math.hypot(x - disc.cx, y - disc.cy) < disc.r + Math.hypot(w, h) * 0.35) { const dx0 = Math.max(Math.abs(x - disc.cx) - w / 2, 0), dy0 = Math.max(Math.abs(y - disc.cy) - h / 2, 0); if (Math.hypot(dx0, dy0) < disc.r) n += 900; }
      if (n < bestN) { best = [x, y]; bestN = n; if (n < 0.5) break; }
    }
    const [x, y] = best; boxes.push({ x, y, w, h });
    const qx = Math.max(x - w / 2, Math.min(x + w / 2, c.px)), qy = Math.max(y - h / 2, Math.min(y + h / 2, c.py)), leader = Math.hypot(qx - c.px, qy - c.py) > h * 0.9;
    if (leader) segs.push([c.px, c.py, qx, qy]);
    out[i] = { x, y, leader, ax: c.px, ay: c.py, qx, qy };
  }
  return out;
}
// Push a label box (centre x,y size w,h) out of a disc (globe on screen) so it never sits on the planet.
function offDisc(x, y, w, h, cx, cy, r) {
  let dx = x - cx, dy = y - cy; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  const need = r + Math.abs(dx) * w / 2 + Math.abs(dy) * h / 2 + 12;
  return d >= need ? [x, y] : [cx + dx * need, cy + dy * need];
}
const labelW = (text, u = 1) => (text.length * 6.9 + 16) * u;

