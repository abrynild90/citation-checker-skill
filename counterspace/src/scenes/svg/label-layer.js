// ============================================================================
// scenes/svg/label-layer.js: the label layer of the static diagram: legend key, label placement, pills and leaders, status caption, panel title / footer
// note, and the probe (`__lay`) that scene_check reads
// ============================================================================
import { offDisc, placeLabels } from '../labels.js';
import { SANS } from '../../fonts.js';

// Legend-style key (cfg.staticKey: [colour, text] rows) instead of a label per orbit or object: bottom-left, above the caption
export function legendBox(sim, opts, W, stY) {
  const key = !opts.panel && sim.cfg.staticKey,
    kFs = W < 900 ? 9.5 : 10.5, // the print stage (760 wide) and phones get the smaller legend
    kBox = key
      ? (() => {
          const kw = Math.max(...key.map((k) => (W < 520 && k[2]) || k[1]).map((x) => x.length)) * kFs * 0.57 + 36,
            kh = key.length * (kFs + 6) + 8;
          return [10, stY - 8 - kh, Math.min(kw, W - 20), kh];
        })()
      : null;
  return { key, kFs, kBox };
}

// Reserve the banner, status, footer and key boxes, place the label candidates, then draw leaders and pills. Returns the placement.
export function placeAndDrawLabels(S, fit, legend) {
  const { opts, W, H, g, GX, GY, GR, cands, obst, marks, ringsL, pcount } = S;
  const { stH, stY, stW, bRes, fw } = fit;
  const { kBox } = legend;
  const reserved = opts.panel
    ? [[(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6]]
    : [bRes, [(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6], [6, H - 27, fw + 2, 22], ...(kBox ? [[kBox[0] - 3, kBox[1] - 3, kBox[2] + 6, kBox[3] + 6]] : [])];
  if (opts.panel && opts.title) reserved.push([0, 0, W, 20]);
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
    if (q.leader) {
      g.append('line').attr('x1', q.ax).attr('y1', q.ay).attr('x2', q.qx).attr('y2', q.qy).attr('stroke', c.color).attr('stroke-opacity', 0.8);
      g.append('circle').attr('cx', q.ax).attr('cy', q.ay).attr('r', 2).attr('fill', c.color);
    }
    g.append('rect')
      .attr('x', q.x - c.w / 2)
      .attr('y', q.y - c.h / 2)
      .attr('width', c.w)
      .attr('height', c.h)
      .attr('rx', 4)
      .attr('fill', 'rgba(5,8,18,0.78)')
      .attr('stroke', c.color)
      .attr('stroke-opacity', 0.35);
    g.append('text')
      .attr('x', q.x)
      .attr('y', q.y + 4)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 600)
      .attr('fill', c.color)
      .text(c.text);
  });
  return pl;
}

// The legend key box and its rows.
export function drawLegend(S, legend) {
  const { W, g } = S;
  const { key, kFs, kBox } = legend;
  if (kBox) {
    g.append('rect')
      .attr('x', kBox[0])
      .attr('y', kBox[1])
      .attr('width', kBox[2])
      .attr('height', kBox[3])
      .attr('rx', 5)
      .attr('fill', 'rgba(5,8,18,0.85)')
      .attr('stroke', 'rgba(223,230,247,0.25)');
    key.forEach((k, i) => {
      const yy = kBox[1] + 8 + i * (kFs + 6) + kFs / 2;
      g.append('line')
        .attr('x1', kBox[0] + 8)
        .attr('x2', kBox[0] + 24)
        .attr('y1', yy)
        .attr('y2', yy)
        .attr('stroke', k[0])
        .attr('stroke-width', 3);
      g.append('text')
        .attr('x', kBox[0] + 30)
        .attr('y', yy + kFs * 0.35)
        .attr('fill', '#dfe6f7')
        .attr('font-size', kFs)
        .text((W < 520 && k[2]) || k[1]);
    });
  }
}

// The status caption: a dark box with the wrapped lines.
export function drawStatus(S, fit) {
  const { opts, W, g } = S;
  const { hasStatus, stLines, stH, stY, stW } = fit;
  if (hasStatus) {
    g.append('rect')
      .attr('x', (W - stW) / 2)
      .attr('y', stY)
      .attr('width', stW)
      .attr('height', stH)
      .attr('rx', 5)
      .attr('fill', 'rgba(5,8,18,0.85)');
    stLines.forEach((l, k) =>
      g
        .append('text')
        .attr('x', W / 2)
        .attr('y', stY + (opts.panel ? 15 : 17) + k * 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffe08a')
        .attr('font-size', opts.panel ? 10 : 12)
        .text(l),
    );
  }
}

// A panel's title tag, or the diagram's footer scale note.
export function drawChrome(S, fit) {
  const { sim, opts, W, H, svg } = S;
  const { fFont, ftxt, fw } = fit;
  if (opts.panel) {
    if (opts.title) {
      svg
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', Math.min(W, opts.title.length * 6.6 + 18))
        .attr('height', 20)
        .attr('fill', 'rgba(5,8,18,0.88)');
      svg
        .append('text')
        .attr('x', 8)
        .attr('y', 14)
        .attr('fill', '#ffe08a')
        .attr('font-family', SANS)
        .attr('font-weight', 700)
        .attr('font-size', 11)
        .text(opts.title);
    }
  } else {
    const ft = ftxt;
    svg
      .append('rect')
      .attr('x', 6)
      .attr('y', H - 26)
      .attr('width', fw)
      .attr('height', 20)
      .attr('rx', 4)
      .attr('fill', sim.cfg.spin ? 'none' : 'rgba(5,8,18,0.82)'); // the hero's scale note is plain text on the stage, not a dark strip
    svg
      .append('text')
      .attr('x', 14)
      .attr('y', H - 12)
      .attr('fill', '#a9b3cc')
      .attr('font-size', fFont)
      .attr('font-family', SANS)
      .text(ft);
  }
}

// The probe (`svg.__lay`): label boxes, marks, rings, obstacles and craft records, for the collision checker.
export function attachProbe(S, fit, legend, pl) {
  const { sim, opts, W, H, svg, CX, CY, R, GX, GY, GR, shells, cands, obst, marks, ringsL, dPolys, dCloud, crafts, orbitPts, pcount } = S;
  const { stH, stY, stW, fw } = fit;
  const { key, kBox } = legend;
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
    reserved: [
      { n: 'status', x0: (W - stW) / 2, y0: stY, x1: (W + stW) / 2, y1: stY + stH },
      { n: 'footer', x0: 6, y0: H - 26, x1: 6 + fw, y1: H - 6 },
      ...(kBox ? [{ n: 'key', x0: kBox[0], y0: kBox[1], x1: kBox[0] + kBox[2], y1: kBox[1] + kBox[3] }] : []),
    ],
  };
}
