// ============================================================================
// scenes/svg/items.js: draws each sim item kind (dome, curve, cloud, beam, point, flash) into the static diagram and records what the label placer needs
// ============================================================================
import { drawCraft, drawMarker, isCraftShape, iconSize, iconRotation, capByArea, markerCapFor, capByMarker, drawnBox } from './craft.js';

// A coverage dome: a filled spherical cap.
function drawDome(S, it) {
  const { g, path } = S;
  g.append('path')
    .datum(d3.geoCircle().center([it.at[1], it.at[0]]).radius(it.radius)())
    .attr('d', path)
    .attr('fill', it.color)
    .attr('fill-opacity', 0.32)
    .attr('stroke', it.color)
    .attr('stroke-width', 1.6);
}

// An orbit, path or trail: drawn as a smooth line, recorded as an obstacle and a ring; may carry a label.
function drawCurve(S, it) {
  const { sim, opts, t, W, g, project, path, CX, CY, R, showGlobe, obst, ringsL, dPolys, orbitPts, NARROW, label, gapPts } = S;
  if (sim.cfg.spin && it.ctx) return; // the hero keeps the constellation's satellites but not its planes: seen edge-on they are straight scratches
  let pts = it.pts(t).map(project);
  // only the part outside the disc: an arch behind the globe, clipped at its limb
  if (it.limbOnly) pts = pts.map((p) => (Math.hypot(p.x - CX, p.y - CY) < R * 1.005 ? { ...p, hidden: true } : p));
  // a panel keeps only the context ring at the altitude of its craft (a GEO belt in a LEO panel, or the reverse, is a stray arc)
  if (opts.panel && it.inset && pts.length) {
    const rr = it.pts(t).reduce((m, q) => m + Math.hypot(...q), 0) / pts.length,
      fr = opts.view ? Math.hypot(...opts.view.focus) : rr;
    if (Math.abs(rr - fr) > 0.6) return;
  }
  // a panel that shows no globe drops low-orbit context rings (they would be a stray arc with nothing to orbit)
  if (opts.panel && !showGlobe && it.inset && pts.length && Math.min(...it.pts(t).map((q) => Math.hypot(...q))) < 1.6) return;
  // staticRingGap: the orbit line is broken around each craft icon (the ring runs behind it, never through it)
  if (sim.cfg.staticRingGap && !opts.panel)
    pts = pts.map((p) => (!p.hidden && gapPts.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < sim.cfg.staticRingGap) ? { ...p, hidden: true } : p));
  // a constellation (context only) never draws across the Earth's face: its planes are seen only against the sky
  if (it.ctx) pts = pts.map((p) => (Math.hypot(p.x - CX, p.y - CY) < R * 1.01 ? { ...p, hidden: true } : p));
  // an orbit has depth: the side beyond the Earth is drawn dimmer than the side in front
  const depth = !!(it.orbit || it.gate || it.ctx || it.role === 'orbit'),
    op = it.thick ? Math.max(0.85, it.opacity ?? 1) : (it.opacity ?? 1),
    line = d3.line().curve(d3.curveCatmullRom.alpha(0.5)),
    drawSeg = (s, far) =>
      s.length > 1 &&
      g
        .append('path')
        .attr('d', line(s.map((q) => [q.x, q.y])))
        .attr('fill', 'none')
        .attr('stroke', it.color)
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', far ? op * 0.45 : op)
        .attr('stroke-width', it.thick ? Math.max(2.2, it.thick * R * 1.8) : it.width || 1.2);
  // one visible run (between the points hidden behind the Earth) is recorded whole for the label placer and the checks, and drawn in pieces by depth
  let run = [];
  const flush = () => {
    if (run.length > 1) {
      dPolys.push({ p: run.map((q) => [q.x, q.y]), role: it.role || 'line' });
      let seg = [run[0]],
        far = depth && run[0].z < 0;
      for (let i = 1; i < run.length; i++) {
        const f = depth && run[i].z < 0;
        if (f !== far) {
          drawSeg(seg, far);
          seg = [seg.at(-1)];
          far = f;
        }
        seg.push(run[i]);
      }
      drawSeg(seg, far);
    }
    run = [];
  };
  if (it.avoid) {
    let cur = [];
    const fl = () => {
      if (cur.length > 1) {
        cur.soft = !!it.soft;
        obst.push(cur);
      }
      cur = [];
    };
    pts.forEach((p) => {
      if (p.hidden) fl();
      else cur.push([p.x, p.y]);
    });
    fl();
  }
  pts.forEach((p) => (p.hidden ? flush() : run.push(p)));
  flush();
  if (!it.dynamic && it.orbit) {
    let cur = [];
    pts.forEach((p) => {
      if (p.hidden) {
        if (cur.length > 1) ringsL.push(cur);
        cur = [];
      } else cur.push([p.x, p.y]);
    });
    if (cur.length > 1) ringsL.push(cur);
    orbitPts.push(...pts.filter((q) => !q.hidden).map((q) => [q.x, q.y]));
  }
  if (it.label && it.labelAt && pts.length > 2 && !it.staticHide)
    // an orbit's name is a quiet label; the name of a path or an action (an interceptor, a rocket) carries a dot like any other item
    label(
      project(it.labelAt),
      it.short && NARROW ? it.short : it.label,
      it.color,
      it.labelDx,
      it.labelDy,
      W < 700 ? null : it.staticAt,
      it.opt,
      false,
      it.orbit || it.gate ? 'place' : 'item',
    );
}

// A particle cloud (debris, belt): a sample of its points, counted into the debris grid.
function drawCloud(S, it) {
  const { t, W, g, project, CX, CY, R, dCloud, pgrid, pcell, pnx, pny, label } = S;
  const arr = new Float32Array(it.n * 3),
    col = it.dynCol ? new Float32Array(it.n * 4) : null;
  it.fill(t, arr, col);
  const step = Math.max(1, Math.floor(it.n / (it.limbOnly ? 380 : 900)));
  for (let k = 0; k < it.n; k += step) {
    if (!arr[3 * k] && !arr[3 * k + 1] && !arr[3 * k + 2]) continue;
    const p = project([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]);
    if (p.hidden || (it.limbOnly && Math.hypot(p.x - CX, p.y - CY) < R * 1.005)) continue;
    dCloud.push([p.x, p.y]);
    if (!it.bg) {
      const gx = Math.floor(p.x / pcell),
        gy = Math.floor(p.y / pcell);
      if (gx >= 0 && gy >= 0 && gx < pnx && gy < pny) pgrid[gy * pnx + gx] += Math.max(1, step / 2);
    }
    g.append('circle')
      .attr('cx', p.x)
      .attr('cy', p.y)
      .attr('r', it.n > 500 ? 1.1 : it.dynCol ? 1.7 : 1.4)
      .attr('fill', col ? d3.rgb(col[4 * k] * 255, col[4 * k + 1] * 255, col[4 * k + 2] * 255) : it.color)
      .attr('fill-opacity', it.n > 500 ? 0.62 : 0.85);
  }
  if (it.label && (it.labelAt || arr[0] || arr[1] || arr[2]))
    label(
      project((typeof it.labelAt === 'function' ? it.labelAt(t) : it.labelAt) || [arr[0], arr[1], arr[2]]),
      it.short && W < 520 ? it.short : it.label,
      it.color || '#dfe6f7',
    );
}

// A beam: a tapered or plain line between two ends, recorded as a polyline; may carry a label.
function drawBeam(S, it) {
  const { sim, opts, t, g, project, obst, dPolys, NARROW, label } = S;
  const A = it.a(t),
    B = (!opts.panel && it.bStatic?.(t)) || it.b(t);
  if (A && B && it.on(t)) {
    const a = project(A),
      b = project(B);
    if (it.avoid && !a.hidden && !b.hidden) {
      const sg = [
        [a.x, a.y],
        [b.x, b.y],
      ];
      sg.soft = !!it.soft;
      obst.push(sg);
    }
    if (!a.hidden && !b.hidden)
      dPolys.push({
        p: [
          [a.x, a.y],
          [b.x, b.y],
        ],
        role: 'beam',
      });
    if (!a.hidden && !b.hidden && it.width && sim.cfg.staticBeamW) {
      // a crisp tapered beam: thin at the transmitter, widening slightly towards the target, with a bright core
      const dx = b.x - a.x,
        dy = b.y - a.y,
        L = Math.hypot(dx, dy) || 1,
        nx = -dy / L,
        ny = dx / L,
        w0 = sim.cfg.staticBeamW * 0.25,
        w1 = sim.cfg.staticBeamW * 0.5;
      const col = it.colorFn ? it.colorFn(t) : it.color;
      g.append('polygon')
        .attr(
          'points',
          `${a.x + nx * w0},${a.y + ny * w0} ${b.x + nx * w1},${b.y + ny * w1} ${b.x - nx * w1},${b.y - ny * w1} ${a.x - nx * w0},${a.y - ny * w0}`,
        )
        .attr('fill', col)
        .attr('fill-opacity', 0.85);
      g.append('line')
        .attr('x1', a.x)
        .attr('y1', a.y)
        .attr('x2', b.x)
        .attr('y2', b.y)
        .attr('stroke', it.coreColor || '#fff')
        .attr('stroke-width', 0.8)
        .attr('stroke-opacity', 0.9);
    } else if (!a.hidden && !b.hidden)
      g.append('line')
        .attr('x1', a.x)
        .attr('y1', a.y)
        .attr('x2', b.x)
        .attr('y2', b.y)
        .attr('stroke', it.colorFn ? it.colorFn(t) : it.color)
        .attr('stroke-opacity', it.opFn ? it.opFn(t) : (it.opacity ?? 0.8))
        .attr('stroke-dasharray', it.dashFn?.(t) ? '3 3' : null)
        .attr('stroke-width', it.width ? sim.cfg.staticBeamW || 5 : 1.2);
    if (it.label) {
      const fr = sim.cfg.staticBeamLabelFrac ?? 0.5; // anchor on the beam: past the middle puts the leader above the limb, clear of the Earth
      const bt = it.short && (NARROW || sim.cfg.staticBeamShort) && sim.cfg.staticBeamLabelFrac ? it.short : it.label;
      label({ x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr }, bt, it.color, it.sdx, it.sdy);
    }
  }
}

// A craft, site, satellite or marker: its silhouette (sized, rotated and capped), its mark for the label placer, its probe record and its label candidate.
function drawPoint(S, it) {
  const { sim, opts, t: t0, W, g, project, R, craftBase, marks, mark, cands, crafts, label, phoneText, NARROW } = S;
  for (const tt of (!opts.panel && sim.cfg.staticSnap?.[it.craftId]) || [t0]) {
    const t = tt;
    const q = it.liveOnly || it.shape === 'rocket' || it.noStatic ? null : (!opts.panel && it.staticPos?.(t)) || it.pos(t);
    if (!q) continue;
    let p = project(q);
    if (p.hidden) continue;
    const c = it.statusColor ? it.statusColor(t) : it.color;
    const craftShape = isCraftShape(it);
    let cs = iconSize(it, craftShape, sim, opts, craftBase, R);
    // Docked pair: the two models sit side by side, touching (no link is drawn: SWF says docked, not how).
    if (it.dockWith && it.dockOn(t)) p = { ...p, x: p.x + cs * 0.5 };
    else if (it.craftId && sim.items.some((o) => o.dockWith === it.craftId && o.dockOn(t))) p = { ...p, x: p.x - cs * 0.5 };
    const rot = iconRotation(it, t, p, q, project);
    if (craftShape && !opts.panel && sim.cfg.staticCraftCap) cs = capByArea(cs, it, rot, sim.cfg.staticCraftCap, R);
    const { capPx, capOvr } = markerCapFor(it, sim, opts, W, craftShape);
    if (craftShape) cs = capByMarker(cs, it, rot, capPx);
    const mi = marks.length;
    if (it.shape !== 'none')
      mark(
        p,
        craftShape ? cs * (it.shape === 'sat' || it.shape === 'ship' ? 0.5 : 0.42) + 2 : it.shape === 'sat' ? 5 : it.shape === 'tick' ? 6 : 5,
        it.label || it.shape,
      );
    if (craftShape) drawCraft(g, it.iss ? 'iss' : it.shape, p.x, p.y, cs, c, { rot, variant: it.variant });
    if (craftShape) {
      const [bw, bh] = drawnBox(it, rot, cs);
      crafts.push({
        x: p.x,
        y: p.y,
        w: bw,
        h: bh,
        subject: !it.iss && !it.ctx,
        name: it.label || it.shape,
        cap: capPx,
        ovr: !!capOvr,
        id: it.craftId || it.label,
      });
    } else if (it.shape !== 'none') drawMarker(g, it.shape, p.x, p.y, c, it.small); // ('none' is a label-only anchor)
    if (it.label && !it.ctx && !it.noLeader && !(!opts.panel && sim.cfg.staticNoLabel?.includes(it.craftId))) {
      const n0 = cands.length;
      label(
        p,
        (!opts.panel && ((W < 600 && sim.cfg.staticLabelsNarrow?.[it.craftId]) || sim.cfg.staticLabels?.[it.craftId])) ||
          phoneText(it.labelFn ? it.labelFn(t, NARROW) : it.short && (NARROW || (opts.print && it.shortPrint)) ? it.short : it.label),
        c,
        it.labelDx,
        it.labelDy,
        W < 700 ? null : (opts.print && it.staticAtPrint) || it.staticAt,
        it.opt,
        it.staticPin,
        it.shape === 'site' ? 'place' : 'item', // a place name is a quiet label
      );
      // offGlobe: the label leaves the Earth's disc (its site lies in the dark sky of the frame); a phone may keep a short label beside a site that is deep in the disc
      if (it.offGlobe && cands.length > n0 && !(W < 520 && sim.cfg.staticOnDiscPhone?.includes(it.label))) cands.at(-1).off = true;
      if (cands.length > n0 && marks.length > mi) cands.at(-1).mk = mi;
    }
  }
}

// A flash: a detonation or burst marker (big flashes are labelled), or a brief pulse.
function drawFlash(S, it) {
  const { t, g, project, mark, label, phoneText } = S;
  if (it.big && t >= it.t0 && !it.ringColor) {
    const p = project(it.pos);
    mark(p, 12, it.label || 'flash');
    g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 11).attr('fill', '#fff3c4').attr('fill-opacity', 0.35);
    g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 5).attr('fill', '#fff3c4');
    label(p, phoneText(it.label), '#fff3c4', it.labelDx, it.labelDy);
  }
  if (!it.big && t >= it.t0 && t < it.t0 + (it.span ?? 0.14)) {
    const p = project(it.pos);
    g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 7).attr('fill', '#fff1c1').attr('fill-opacity', 0.7);
  }
}

const DRAWERS = { dome: drawDome, cloud: drawCloud, beam: drawBeam, point: drawPoint, flash: drawFlash };

// Draw every item in sim order.
export function drawItems(S) {
  for (const it of S.sim.items) {
    if (it.kind === 'curve') {
      if (it.staticKeep !== false) drawCurve(S, it);
    } else DRAWERS[it.kind]?.(S, it);
  }
}
