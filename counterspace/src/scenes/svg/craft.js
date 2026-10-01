// ============================================================================
// scenes/svg/craft.js: 2D craft and site silhouettes for the static diagram, their measured extent and the size caps applied to them
// ============================================================================
// ---------------------------------------------------------------- 2D craft silhouettes (simplified versions of the live models)
// Each is drawn in a local frame (x right, y down, unit = s px) and centred on (x, y). `s` is the overall width in px.
export function drawCraft(g, shape, x, y, s, color, o = {}) {
  const k = g
    .append('g')
    .attr('transform', `translate(${x},${y}) rotate(${o.rot ?? 0}) scale(${s / 100})`)
    .attr('stroke-linejoin', 'round');
  const dark = '#070b17',
    panel = '#2a4f9a';
  const sw = 2.2;
  const rect = (a, b, w, h, f, st = dark) =>
    k.append('rect').attr('x', a).attr('y', b).attr('width', w).attr('height', h).attr('fill', f).attr('stroke', st).attr('stroke-width', sw);
  const shade = (a, b, w, h) => {
    k.append('rect')
      .attr('x', a)
      .attr('y', b)
      .attr('width', w)
      .attr('height', h * 0.42)
      .attr('fill', '#fff')
      .attr('fill-opacity', 0.2);
    k.append('rect')
      .attr('x', a)
      .attr('y', b + h * 0.58)
      .attr('width', w)
      .attr('height', h * 0.42)
      .attr('fill', '#000')
      .attr('fill-opacity', 0.26);
    k.append('rect')
      .attr('x', a)
      .attr('y', b)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 1.2);
  };
  const poly = (d, f, st = dark) => k.append('path').attr('d', d).attr('fill', f).attr('stroke', st).attr('stroke-width', sw);
  if (shape === 'sat' || shape === 'iss') {
    if (shape === 'iss') {
      // truss with four solar-array pairs and a module cluster
      rect(-50, -3, 100, 6, '#aab4c8');
      for (const cx of [-42, -26, 26, 42]) {
        rect(cx - 6, -30, 12, 26, panel);
        rect(cx - 6, 4, 12, 26, panel);
      }
      rect(-16, -9, 32, 18, color);
      rect(-9, -16, 18, 32, '#dfe6f7');
    } else {
      // bus with two solar wings (cell grid) and a small dish
      for (const sg of [-1, 1]) {
        const x0 = sg < 0 ? -50 : 14;
        rect(x0, -17, 36, 34, panel);
        shade(x0, -17, 36, 34); // light from the top left: a lit upper half and a shaded lower half, like the 3D model
        for (let i = 1; i < 3; i++)
          k.append('line')
            .attr('x1', x0 + i * 12)
            .attr('x2', x0 + i * 12)
            .attr('y1', -17)
            .attr('y2', 17)
            .attr('stroke', '#8fb0ee')
            .attr('stroke-width', 1.2);
        k.append('line')
          .attr('x1', x0)
          .attr('x2', x0 + 36)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', '#8fb0ee')
          .attr('stroke-width', 1.2);
        k.append('line')
          .attr('x1', sg * 14)
          .attr('x2', sg * 15)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', '#c3cbe0')
          .attr('stroke-width', 3);
      }
      rect(-14, -15, 28, 30, color);
      shade(-14, -15, 28, 30);
      k.append('circle').attr('cx', 0).attr('cy', -21).attr('r', 6).attr('fill', '#dfe6f7').attr('stroke', dark).attr('stroke-width', 1.6);
      if (o.variant === 'tug') {
        // SJ-21: aft thruster nozzles, radiator strips on the bus sides and a hinge line across each wing
        poly('M-9,15 L-6,24 L-12,24Z M9,15 L12,24 L6,24Z M-2.5,15 L-3.5,26 L3.5,26 L2.5,15Z', '#39415a');
        for (const sg of [-1, 1]) {
          rect(sg * 14 - 1.5, -12, 3, 24, '#eef1f8');
          k.append('line')
            .attr('x1', sg * 32)
            .attr('x2', sg * 32)
            .attr('y1', -17)
            .attr('y2', 17)
            .attr('stroke', dark)
            .attr('stroke-width', 2);
        }
      } else if (o.variant === 'navsat') {
        // Compass G2: Earth-facing phased array on the bus, a whip antenna and the apogee-motor bell
        rect(-9, -10, 18, 14, '#27324f');
        const gl = (x1, y1, x2, y2) =>
          k.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).attr('stroke', '#8fb0ee').attr('stroke-width', 0.9);
        for (let i = 1; i < 4; i++) gl(-9 + i * 4.5, -10, -9 + i * 4.5, 4);
        for (let i = 1; i < 3; i++) gl(-9, -10 + i * 4.7, 9, -10 + i * 4.7);
        k.append('line').attr('x1', -9).attr('x2', -15).attr('y1', -15).attr('y2', -30).attr('stroke', '#c3cbe0').attr('stroke-width', 1.6);
        poly('M-6,15 L-9,25 L9,25 L6,15Z', '#8a8f9c');
      }
    }
  } else if (shape === 'plane') {
    // spaceplane (top view, nose up): swept delta wings in the national colour with a darker underside strip, a white fuselage with a dark cockpit and
    // payload-bay door, twin tail fins and an engine bell
    poly('M0,-44 L8,-14 L44,26 L44,34 L9,26 L6,42 L-6,42 L-9,26 L-44,34 L-44,26 L-8,-14Z', color);
    k.append('path').attr('d', 'M8,-14 L44,26 L44,34 L9,26Z M-8,-14 L-44,26 L-44,34 L-9,26Z').attr('fill', '#000').attr('fill-opacity', 0.3);
    k.append('path')
      .attr('d', 'M7,-12 L38,22 M-7,-12 L-38,22')
      .attr('stroke', '#fff')
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', 1.4)
      .attr('fill', 'none');
    poly('M0,-48 C5,-34 7,-16 7,6 L7,38 L-7,38 L-7,6 C-7,-16 -5,-34 0,-48Z', '#eef1f8');
    k.append('path').attr('d', 'M0,-36 C3,-30 4,-24 4,-20 L-4,-20 C-4,-24 -3,-30 0,-36Z').attr('fill', '#1b2236');
    rect(-4, -10, 8, 26, color, dark);
    k.append('rect').attr('x', -4).attr('y', -10).attr('width', 8).attr('height', 11).attr('fill', '#fff').attr('fill-opacity', 0.25);
    k.append('rect')
      .attr('x', -6)
      .attr('y', 38)
      .attr('width', 12)
      .attr('height', 7)
      .attr('rx', 2)
      .attr('fill', '#2b3140')
      .attr('stroke', dark)
      .attr('stroke-width', 1.6);
  } else if (shape === 'aircraft') {
    poly(
      'M0,-46 C5,-30 6,-10 6,4 L46,26 L46,34 L6,24 L4,38 L14,46 L14,50 L0,46 L-14,50 L-14,46 L-4,38 L-6,24 L-46,34 L-46,26 L-6,4 C-6,-10 -5,-30 0,-46Z',
      '#f2f4fa',
      dark,
    );
  } else if (shape === 'ship') {
    poly('M-50,-9 L30,-9 L50,0 L30,9 L-50,9Z', '#8e9bb4');
    rect(-26, -6, 22, 12, '#dfe6f7');
    rect(4, -5, 14, 10, '#c3cbe0');
    rect(-44, -5, 14, 10, '#5d6a86');
  } else if (shape === 'site') {
    poly('M0,-40 L34,0 L0,40 L-34,0Z', color);
    k.append('circle').attr('r', 12).attr('fill', '#fff').attr('fill-opacity', 0.85);
  } else if (shape === 'jammer') {
    // truck with a mast, a crossed antenna and emission arcs
    rect(-40, 12, 50, 20, '#3a4254');
    rect(12, 16, 22, 16, '#dfe6f7');
    for (const cx of [-28, -6, 24])
      k.append('circle').attr('cx', cx).attr('cy', 34).attr('r', 7).attr('fill', dark).attr('stroke', '#8e9bb4').attr('stroke-width', 2);
    k.append('line').attr('x1', -14).attr('x2', -14).attr('y1', 12).attr('y2', -34).attr('stroke', '#dfe6f7').attr('stroke-width', 4);
    k.append('line').attr('x1', -28).attr('x2', 0).attr('y1', -30).attr('y2', -30).attr('stroke', color).attr('stroke-width', 4);
    k.append('line').attr('x1', -24).attr('x2', -4).attr('y1', -18).attr('y2', -18).attr('stroke', color).attr('stroke-width', 4);
    for (const r of [18, 32, 46])
      k.append('path')
        .attr('d', `M${-14 - r},${-34 - r * 0.2} A${r},${r} 0 0 1 ${-14 + r},${-34 - r * 0.2}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 0.85 - r / 80);
  }
  return k;
}

// Real drawn extent of a craft silhouette in its own 100-unit frame (measured once in a throwaway attached SVG: the diagram's own SVG is detached while built).
const boxCache = {};
export function localBox(shape, variant) {
  const key = shape + '|' + variant;
  if (boxCache[key]) return boxCache[key];
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  host.setAttribute('style', 'position:fixed;left:-9999px;top:0;width:10px;height:10px');
  document.body.appendChild(host);
  let b = { width: 0, height: 0 };
  try {
    b = drawCraft(d3.select(host), shape, 0, 0, 100, '#fff', { variant }).node().getBBox();
  } finally {
    host.remove();
  }
  return (boxCache[key] = { width: b.width, height: b.height });
}
// Icon bounding box in units of the craft size (width, height), for the checker's icon-area rule.
export const CRAFT_BOX = { sat: [1, 0.45], iss: [0.96, 0.64], plane: [0.7, 0.7], aircraft: [0.7, 0.7], ship: [1, 0.2], site: [0.68, 0.8], jammer: [0.9, 0.8] };
// Global static marker cap in px for a stage W px wide: 22 px on the 798 px stage of the 1440 viewport, proportional with W, 10-24 px.
// print: the 760 px layout is shown x3.95 in the 3000 px still (about 32 px)
export const markerCap = (W, print) => (print ? 8 : Math.max(10, Math.min(24, (22 * W) / 798)));
const CRAFT_PX = { sat: 1, iss: 1.15, plane: 0.8, aircraft: 0.7, ship: 0.9, site: 0.45, jammer: 0.7 };

// The silhouette key of a point item (the ISS has its own model).
const shapeOf = (it) => (it.iss ? 'iss' : it.shape);

// Is this point drawn as a craft / site silhouette (rather than a plain dot)?
export const isCraftShape = (it) => ['sat', 'plane', 'aircraft', 'ship', 'site', 'jammer'].includes(it.shape) && (it.prim || (it.label && !it.ctx && !it.small) || it.iss);

// Icon width in px. Craft are drawn as silhouettes: the size follows the panel (bigger on the desk, still readable on a phone), and the subject of a scene is
// never a speck.
export function iconSize(it, craftShape, sim, opts, craftBase, R) {
  const cs0 = craftShape
    ? Math.round(
        Math.min(sim.cfg.spin ? 46 : 99, craftBase * (it.iss ? 1.3 : 1)) *
          (it.small ? 0.72 : 1) *
          (CRAFT_PX[it.iss ? 'iss' : it.shape] || 1) *
          ((!opts.panel && sim.cfg.staticCraftScale?.[it.craftId]) || 1),
      )
    : 0;
  // the ISS is context, not the subject: its icon is capped relative to the Earth (never a big shape covering the disc)
  return it.iss && !opts.panel && !sim.cfg.spin ? Math.min(cs0, Math.max(26, Math.round(R * 0.22))) : cs0;
}

// Heading of an aircraft icon (degrees), from where it is a moment later; other shapes are upright.
export function iconRotation(it, t, p, q, project) {
  if (it.shape !== 'plane' && it.shape !== 'aircraft') return 0;
  const q2 = it.pos(Math.min(1, t + 0.012)) || q,
    p2 = project(q2);
  if (Math.hypot(p2.x - p.x, p2.y - p.y) > 0.3) return (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
  return -25;
}

// staticCraftCap: the icon's drawn (rotated) silhouette is at most this share of the Earth disc area, at every width and in the print layout.
export function capByArea(cs, it, rot, share, R) {
  const ext = (z) => {
    const b = localBox(shapeOf(it), it.variant),
      a = (rot * Math.PI) / 180,
      hw = (b.width * z) / 200,
      hh = (b.height * z) / 200;
    return 4 * (Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh) * (Math.abs(Math.sin(a)) * hw + Math.abs(Math.cos(a)) * hh);
  };
  for (let n = 0; n < 40 && ext(cs) > 0.95 * share * Math.PI * R * R; n++) cs *= 0.94;
  return cs;
}

// Global marker cap (every static craft/site marker, screen and print): the longer side of the drawn silhouette is at most markerCap(W) px
// (22 px on the 798 px stage of the 1440 viewport, scaled with W, 10-24 px). A scene whose subject is the point may raise it: cfg.staticMarkerCap[craftId].
// Returns the cap in px and the override (0 when none).
export function markerCapFor(it, sim, opts, W, craftShape) {
  let capPx = markerCap(W, opts.print);
  const capOvr = (!opts.panel && (sim.cfg.staticMarkerCap?.[it.craftId] ?? sim.cfg.staticMarkerCap?.[it.label])) || 0;
  if (craftShape && capOvr) capPx = (markerCap(W, opts.print) * capOvr) / 22; // override given in px at the 22 px reference stage
  return { capPx, capOvr };
}

export function capByMarker(cs, it, rot, capPx) {
  const b = localBox(shapeOf(it), it.variant),
    a = (rot * Math.PI) / 180,
    side = (z) =>
      (Math.max(
        Math.abs(Math.cos(a)) * b.width + Math.abs(Math.sin(a)) * b.height,
        Math.abs(Math.sin(a)) * b.width + Math.abs(Math.cos(a)) * b.height,
      ) *
        z) /
      100;
  for (let n = 0; n < 60 && b.width && side(cs) > capPx; n++) cs = Math.max(2, cs * 0.96);
  return cs;
}

// Measured silhouette (rotated, incl. wings and strokes), not the nominal box: the checker's area rule sees what is drawn. Returns [width, height] in px.
export function drawnBox(it, rot, cs) {
  let [bw, bh] = (CRAFT_BOX[shapeOf(it)] || [0.8, 0.8]).map((v) => v * cs);
  try {
    const b = localBox(shapeOf(it), it.variant),
      a = (rot * Math.PI) / 180,
      k = cs / 100,
      hw = (b.width * k) / 2,
      hh = (b.height * k) / 2;
    if (b.width) {
      bw = 2 * (Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh);
      bh = 2 * (Math.abs(Math.sin(a)) * hw + Math.abs(Math.cos(a)) * hh);
    }
  } catch (e) {
    /* no layout: nominal box */
  }
  return [bw, bh];
}
