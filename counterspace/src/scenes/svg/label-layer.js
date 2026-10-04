// ============================================================================
// scenes/svg/label-layer.js: the label layer of the static diagram: key, label placement, pills and leaders, caption, panel title, and the probe (`__lay`)
// that scene_check reads
// ============================================================================
import { offDisc, placeLabels } from '../labels.js';
import { SANS } from '../../fonts.js';
import { INK, PILL, WARM, drawLeader, drawPill, pillSize, textW } from './pill.js';

const KEY_FS = 12; // the key's type: the floor for any text in a diagram

// Key (cfg.staticKey: [colour, text, phoneText] rows) instead of a label per orbit or object: bottom-left, above the caption.
export function legendBox(sim, opts, W, stY) {
  const key = !opts.panel && sim.cfg.staticKey,
    kBox = key
      ? (() => {
          const kw = Math.max(...key.map((k) => textW((W < 520 && k[2]) || k[1], KEY_FS, 500))) + 2 * PILL.padX + 26,
            kh = key.length * 20 + 12;
          return [10, stY - 8 - kh, Math.min(kw, W - 20), kh];
        })()
      : null;
  return { key, kFs: KEY_FS, kBox };
}

// Reserve the banner, caption and key boxes, place the label candidates, then draw leaders and pills. Returns the placement.
export function placeAndDrawLabels(S, fit, legend) {
  const { opts, W, H, g, GX, GY, GR, cands, obst, marks, ringsL, pcount } = S;
  const { stH, stY, stW, bRes } = fit;
  const { kBox } = legend;
  const reserved = opts.panel
    ? [[(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6]]
    : [bRes, [(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6], ...(kBox ? [[kBox[0] - 3, kBox[1] - 3, kBox[2] + 6, kBox[3] + 6]] : [])];
  if (opts.panel && opts.title) reserved.push([0, 0, fit.titleW + 12, fit.titleH + 8]);
  cands.forEach((c) => {
    if (c.off && !c.pin) [c.x, c.y] = offDisc(c.px, c.py, c.w, c.h, GX, GY, GR * 1.08);
  });
  cands.forEach((c) => {
    c.avoidDisc = !!c.off;
  });
  const pl = placeLabels(cands, W, H, reserved, { cx: GX, cy: GY, r: GR * 1.02 + 4 }, obst, null, {
    marks,
    rings: ringsL,
    parts: { count: pcount },
    fine: true,
  });
  cands.forEach((c, i) => {
    const q = pl[i];
    if (!q) return;
    if (q.leader) drawLeader(g, q.ax, q.ay, q.qx, q.qy);
    drawPill(g, { x: q.x, y: q.y, w: c.w, h: c.h, text: c.text, color: c.color, dot: c.dot, secondary: !c.dot, fs: c.fs });
  });
  return pl;
}

// The key box and its rows: the same pill surface as the labels, a short colour line and a name per row.
export function drawLegend(S, legend) {
  const { W, g } = S;
  const { key, kFs, kBox } = legend;
  if (kBox) {
    g.append('rect')
      .attr('x', kBox[0])
      .attr('y', kBox[1])
      .attr('width', kBox[2])
      .attr('height', kBox[3])
      .attr('rx', PILL.r)
      .attr('fill', PILL.fill)
      .attr('stroke', PILL.border);
    key.forEach((k, i) => {
      const yy = kBox[1] + 6 + i * 20 + 10;
      g.append('line')
        .attr('x1', kBox[0] + PILL.padX)
        .attr('x2', kBox[0] + PILL.padX + 16)
        .attr('y1', yy)
        .attr('y2', yy)
        .attr('stroke', k[0])
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');
      g.append('text')
        .attr('x', kBox[0] + PILL.padX + 24)
        .attr('y', yy + kFs * 0.35)
        .attr('fill', INK)
        .attr('font-family', SANS)
        .attr('font-weight', 500)
        .attr('font-size', kFs)
        .text((W < 520 && k[2]) || k[1]);
    });
  }
}

// The caption: one pill in the warm accent, with the wrapped lines. It states what the picture shows at this moment.
export function drawStatus(S, fit) {
  const { opts, W, g } = S;
  const { hasStatus, stLines, stH, stY, stW, stFs, stLh } = fit;
  if (hasStatus) {
    g.append('rect')
      .attr('x', (W - stW) / 2)
      .attr('y', stY)
      .attr('width', stW)
      .attr('height', stH)
      .attr('rx', PILL.r)
      .attr('fill', PILL.fill)
      .attr('stroke', PILL.border);
    stLines.forEach((l, k) =>
      g
        .append('text')
        .attr('x', W / 2)
        .attr('y', stY + stH / 2 - ((stLines.length - 1) * stLh) / 2 + k * stLh + stFs * 0.35)
        .attr('text-anchor', 'middle')
        .attr('fill', WARM)
        .attr('font-family', SANS)
        .attr('font-weight', 500)
        .attr('font-size', stFs)
        .text(l),
    );
  }
}

// A panel's title: a pill at the panel's top left corner (a diagram without panels has no footer text: the viewer's caption says what is illustrative).
export function drawChrome(S) {
  const { opts, svg } = S;
  if (opts.panel && opts.title) {
    const fs = S.fs,
      { w, h } = pillSize(opts.title, { dot: false, fs });
    drawPill(svg, { x: 6 + w / 2, y: 6 + h / 2, w, h, text: opts.title, dot: false, fs });
  }
}

// The probe (`svg.__lay`): label boxes, marks, rings, obstacles and craft records, for the collision checker.
export function attachProbe(S, fit, legend, pl) {
  const { sim, opts, W, H, svg, CX, CY, R, GX, GY, GR, shells, cands, obst, marks, ringsL, dPolys, dCloud, crafts, orbitPts, pcount } = S;
  const { stH, stY, stW } = fit;
  const { kBox } = legend;
  const lb = [];
  cands.forEach((c, i) => {
    const q = pl[i];
    if (q)
      lb.push({
        text: c.text,
        x0: q.x - c.w / 2,
        y0: q.y - c.h / 2,
        x1: q.x + c.w / 2,
        y1: q.y + c.h / 2,
        leader: q.leader ? [q.ax, q.ay, q.qx, q.qy] : null,
        ref: [q.ax, q.ay],
        mk: c.mk ?? -1,
        pc: pcount(q.x - c.w / 2, q.y - c.h / 2, q.x + c.w / 2, q.y + c.h / 2),
      });
  });
  svg.node().__lay = {
    W,
    H,
    probe: {
      disc: { cx: GX, cy: GY, r: GR },
      circles: shells.map((it) => ({ cx: CX, cy: CY, r: it.r * R, ring: !it.noRing })),
      pts: marks.map((m, i) => ({ x: m.x, y: m.y, r: m.r, i })),
      rings: ringsL,
      disc0: { cx: GX, cy: GY, r: GR },
      minFont: Math.min(...[...svg.node().querySelectorAll('text')].map((e) => +e.getAttribute('font-size') || +e.parentNode.getAttribute('font-size') || 11)),
      polys: dPolys,
      crafts: sim.cfg.spin ? null : crafts, // the hero's ISS marker is a locator, not a scene craft
      orbitPts: sim.cfg.staticFitRing && !opts.panel ? orbitPts : null, // only a ring-fit scene (DN-2, SJ-21) promises its whole ring inside the frame
      cloud: dCloud,
      domes: [],
    },
    labels: lb,
    marks,
    rings: ringsL,
    obst: obst.map((pl) => ({ p: pl, soft: !!pl.soft })),
    reserved: [{ n: 'status', x0: (W - stW) / 2, y0: stY, x1: (W + stW) / 2, y1: stY + stH }, ...(kBox ? [{ n: 'key', x0: kBox[0], y0: kBox[1], x1: kBox[0] + kBox[2], y1: kBox[1] + kBox[3] }] : [])],
  };
}
