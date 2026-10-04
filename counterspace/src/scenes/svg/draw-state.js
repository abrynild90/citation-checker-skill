// ============================================================================
// scenes/svg/draw-state.js: the working state of one static diagram: label candidates, obstacles, marks, the debris grid, and the helpers that fill them
// ============================================================================
import { DEG } from '../core.js';
import { HERO_SAY } from './hero.js';
import { labelFs, pillSize } from './pill.js';

// Everything the item, label and probe passes share. `g` (the content group) and the globe geometry are added by renderSVG once they exist.
export function createDrawState({ sim, opts, t, W, H, svg, project, path, CX, CY, R, showGlobe, craftBase }) {
  const shells = sim.items.filter((i) => i.kind === 'shell'),
    cands = [],
    obst = [],
    marks = [],
    ringsL = [],
    pcell = 8,
    pnx = Math.ceil(W / pcell),
    pny = Math.ceil(H / pcell),
    pgrid = new Uint16Array(pnx * pny),
    dPolys = [],
    dCloud = [],
    crafts = [],
    orbitPts = [];
  const mark = (p, r, n) => {
    if (p && !p.hidden) marks.push({ x: p.x, y: p.y, r, n });
  };
  const pcount = (x0, y0, x1, y1) => {
    const a = Math.max(0, Math.floor(x0 / pcell)),
      b = Math.min(pnx - 1, Math.floor(x1 / pcell)),
      c = Math.max(0, Math.floor(y0 / pcell)),
      d = Math.min(pny - 1, Math.floor(y1 / pcell));
    let n = 0;
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) n += pgrid[j * pnx + i];
    return n;
  };
  // cfg.staticTextPhone: [from, to] pairs
  const phoneText = (x) => (W < 520 && x && sim.cfg.staticTextPhone ? sim.cfg.staticTextPhone.reduce((a, [f, r]) => a.replace(f, r), x) : x);
  const NARROW = W < 600 || !!sim.cfg.acts; // short label texts on a phone, and in the busy multi-act composite (spaceplanes) at any width
  const fs = labelFs(W, opts);
  // kind: 'item' (a craft, an event, a beam: the pill carries a dot of the item's colour) or 'place' (a site or an orbit name: no dot, a little quieter)
  const label = (p, text, color = '#dfe6f7', dx = 0, dy = 0, at = null, opt = false, pin = false, kind = 'item') => {
    if (!p || p.hidden || !text || p.x < 4 || p.y < 4 || p.x > W - 4 || p.y > H - 4) return;
    if (W < 520 && !opts.panel && sim.cfg.staticDropPhone?.includes(text)) return; // a phone drops the labels that would crowd the subject
    if (!opts.panel && sim.cfg.staticDrop?.includes(text)) return; // cfg.staticDrop: labels the static diagram leaves out at every width
    if (opts.drop?.includes(text)) return; // a panel's own label dropped where it would cross another on a phone
    if (opt && W < 520 && sim.cfg.acts && !opts.panel) return; // the busy multi-act composite drops its secondary labels on a phone
    text = (sim.cfg.spin && HERO_SAY[text]) || text; // the hero says it in plain words
    const dot = kind === 'item',
      { w, h } = pillSize(text, { dot, fs });
    cands.push({
      x: at ? at[0] * W : p.x + dx,
      y: at ? at[1] * H : p.y - 16 + dy,
      px: p.x,
      py: p.y,
      w,
      h,
      fs,
      dot,
      text,
      color,
      opt,
      // staticPin 'hard': the hint outweighs soft costs (ring lines, disc).
      // staticPin: the slot hint is a strong preference (the placer stays within a few px of it unless it collides).
      pin: at && pin,
    });
  };
  const gapPts = sim.cfg.staticRingGap
    ? sim.items
        .filter((i) => i.kind === 'point' && i.prim && !i.liveOnly && (i.staticPos || i.pos))
        .map((i) => {
          const q = i.staticPos?.(t) || i.pos(t);
          return q ? project(q) : { x: -999, y: -999 };
        })
    : [];
  return {
    sim,
    opts,
    t,
    W,
    H,
    svg,
    project,
    path,
    CX,
    CY,
    R,
    showGlobe,
    craftBase,
    shells,
    cands,
    obst,
    marks,
    ringsL,
    dPolys,
    dCloud,
    crafts,
    orbitPts,
    pgrid,
    pcell,
    pnx,
    pny,
    mark,
    pcount,
    NARROW,
    phoneText,
    label,
    fs,
    gapPts,
  };
}

// The shell rings: their points are obstacles for label placement; each is drawn as a fine dotted circle under the globe (a boundary, not a path).
export function drawShells(S) {
  const { svg, shells, ringsL, CX, CY, R } = S;
  shells.forEach((it) => {
    if (it.noRing) return;
    const rp = [];
    for (let a = 0; a <= 120; a++) rp.push([CX + it.r * R * Math.cos((a / 120) * 2 * Math.PI), CY + it.r * R * Math.sin((a / 120) * 2 * Math.PI)]);
    ringsL.push(rp);
    svg
      .append('circle')
      .attr('cx', CX)
      .attr('cy', CY)
      .attr('r', it.r * R)
      .attr('fill', 'none')
      .attr('stroke', it.color)
      .attr('stroke-opacity', 0.62)
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '0.1 6.5');
  });
}

// Shell labels sit on the shell line at their preferred angle, or at the nearest angle where that point is inside the frame.
export function queueShellLabels(S, fTop, stY) {
  const { sim, shells, cands, CX, CY, R, W, NARROW, fs } = S;
  shells.forEach((it, i) => {
    const lab = it.staticLabel ?? it.label;
    if (!lab) return;
    if (W < 520 && sim.cfg.staticDropPhone?.includes(lab)) return; // a phone drops the shell labels that would crowd the subject's
    const tx = it.short && NARROW && !it.staticLabel ? it.short : lab,
      { w, h } = pillSize(tx, { dot: false, fs });
    // the label sits on the shell line at its preferred angle, or at the nearest angle where that point is inside the frame
    let a = (it.staticAng ?? it.ang ?? 35 + i * 14) * DEG,
      shown = false;
    for (const k of [0, 10, -10, 20, -20, 30, -30, 45, -45, 60, -60, 80, -80, 100, -100, 130, -130, 160, -160, 180]) {
      const b = a + k * DEG,
        qx = CX + it.r * R * Math.cos(b),
        qy = CY - it.r * R * Math.sin(b);
      if (qx > w / 2 + 12 && qx < W - w / 2 - 12 && qy > fTop + 10 && qy < stY - 24) {
        a += k * DEG;
        shown = true;
        break;
      }
    }
    if (!shown) return;
    const px = CX + it.r * R * Math.cos(a),
      py = CY - it.r * R * Math.sin(a),
      o = (w / 2) * Math.abs(Math.cos(a)) + (h / 2) * Math.abs(Math.sin(a)) + 7; // the pill sits just outside its shell line, never on it
    cands.push({ x: px + Math.cos(a) * o, y: py - Math.sin(a) * o, px, py, w, h, fs, dot: false, fixed: true, text: tx, color: it.color });
  });
}
