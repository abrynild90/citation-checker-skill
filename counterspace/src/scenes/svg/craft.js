// ============================================================================
// scenes/svg/craft.js: craft and site glyphs of the still diagram (one drawing style), their measured extent and the size caps applied to them
// ============================================================================
// ---------------------------------------------------------------- glyphs
// One style for every glyph: flat fills with one highlight, a hairline outline in the backdrop colour (the same weight in screen px at any size, so a glyph
// separates from bright land and from dark sky alike), and detail only when the glyph is large enough to carry it. Each is drawn in a local frame (x right,
// y down, unit = s px / 100) centred on (x, y); `s` is the nominal width in px.
const INK = '#070b17',
  PANEL = '#3566bd',
  CELL = '#a9c8ff',
  METAL = '#c3cbe0',
  WHITE = '#eef2fb';

export function drawCraft(g, shape, x, y, s, color, o = {}) {
  const k = g
    .append('g')
    .attr('transform', `translate(${x},${y}) rotate(${o.rot ?? 0}) scale(${s / 100})`)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round');
  const px = 100 / s, // local units per diagram px
    hair = px * Math.min(1, Math.max(0.5, s / 44)), // outline weight: 1 px, down to half a pixel on a very small glyph
    big = s >= 44; // room for cells, bolts and small parts
  const rect = (a, b, w, h, fill, r = 0) =>
    k
      .append('rect')
      .attr('x', a)
      .attr('y', b)
      .attr('width', w)
      .attr('height', h)
      .attr('rx', r)
      .attr('fill', fill)
      .attr('stroke', INK)
      .attr('stroke-width', hair);
  // a shape, or several that overlap, outlined once around their union: the outline underneath, the fill on top
  const solid = (d, fill, extra) => {
    k.append('path')
      .attr('d', d)
      .attr('fill', INK)
      .attr('stroke', INK)
      .attr('stroke-width', 2 * hair);
    return k
      .append('path')
      .attr('d', d)
      .attr('fill', fill)
      .attr('stroke', 'none')
      .call(extra || (() => {}));
  };
  const stroke = (d, col, w, op = 1) =>
    k.append('path').attr('d', d).attr('fill', 'none').attr('stroke', col).attr('stroke-width', w).attr('stroke-opacity', op);
  const shine = (a, b, w, h, op = 0.2) =>
    k.append('rect').attr('x', a).attr('y', b).attr('width', w).attr('height', h).attr('fill', '#fff').attr('fill-opacity', op);
  // a solar panel: blue, a light frame, a cell line down the middle when there is room
  const panel = (a, b, w, h, cells = 1) => {
    rect(a, b, w, h, PANEL);
    shine(a, b, w, h * 0.38, 0.12);
    if (big) {
      for (let i = 1; i <= cells; i++) stroke(`M${a},${b + (h * i) / (cells + 1)}H${a + w}`, CELL, 0.7 * hair, 0.85);
      stroke(`M${a + w / 2},${b}V${b + h}`, CELL, 0.7 * hair, 0.85);
    }
  };
  if (shape === 'sat' || shape === 'iss') {
    if (o.variant === 'solwind') {
      panel(-35, -47, 70, 62, 3);
      rect(-9, -4, 18, 18, '#d8b36a');
      solid('M-41,20 Q0,10 41,20 V40 Q0,52 -41,40Z', METAL);
      stroke('M-41,20 Q0,31 41,20', WHITE, hair);
      rect(-39, 39, 78, 6, '#d8b36a');
    } else if (o.variant === 'fengyun') {
      rect(-48, -1, 96, 2, METAL);
      panel(-48, -7, 35, 14, 1);
      panel(13, -7, 35, 14, 1);
      rect(-10, -10, 20, 20, '#d8b36a', 1);
      shine(-10, -10, 20, 6);
    } else if (shape === 'iss') {
      // the truss with four pairs of solar arrays, the module cluster and a cross module
      rect(-50, -2.4, 100, 4.8, METAL);
      for (const cx of [-43, -26, 26, 43]) {
        panel(cx - 5.5, -31, 11, 27, 2);
        panel(cx - 5.5, 4, 11, 27, 2);
      }
      rect(-15, -7.5, 30, 15, WHITE, 1.5);
      rect(-6, -15, 12, 30, color, 1.5);
      shine(-6, -15, 12, 9, 0.22);
    } else {
      const det = o.variant === 'tug' || o.variant === 'navsat',
        bw = det ? 15 : 13,
        bh = det ? 19 : 15,
        wx = det ? 21 : 20,
        pw = det ? 14.8 : 11.8,
        n = det ? 2 : 3,
        wh = det ? 17 : 15;
      for (const sg of [-1, 1]) {
        // boom, then the wing: SJ-21 and Compass G2 (the pair the static diagram is about) get a bigger bus and two separate panels per side
        rect(sg < 0 ? -wx : bw, -1.8, wx - bw, 3.6, METAL);
        for (let i = 0; i < n; i++) {
          const x0 = sg < 0 ? -wx - (i + 1) * pw - i * 1.6 : wx + i * (pw + 1.6);
          panel(x0, -wh, pw, wh * 2, 1);
        }
      }
      rect(-bw, -bh, bw * 2, bh * 2, color, 2);
      shine(-bw, -bh, bw * 2, bh * 0.7, 0.22);
      if (big) {
        stroke(`M${-bw},${-bh * 0.1}H${bw}`, INK, 0.6 * hair, 0.55);
        stroke(`M${-bw},${bh * 0.45}H${bw}`, INK, 0.6 * hair, 0.55);
      }
      // a small dish on a mast
      stroke(`M0,${-bh}V${-bh - 5}`, METAL, 2.2);
      k.append('ellipse')
        .attr('cx', 0)
        .attr('cy', -bh - 7)
        .attr('rx', 6.5)
        .attr('ry', 3)
        .attr('fill', WHITE)
        .attr('stroke', INK)
        .attr('stroke-width', hair);
      if (o.variant === 'tug') {
        // SJ-21: three thruster bells aft, radiator strips on the bus sides, and a two-segment grapple boom with a small jaw (as in the live model)
        solid('M-9,19 L-6.5,29 L-11.5,29Z M9,19 L11.5,29 L6.5,29Z M-2.8,19 L-4,30 L4,30 L2.8,19Z', '#4b546d');
        for (const sg of [-1, 1]) rect(sg * bw - 1.6, -bh + 4, 3.2, bh * 2 - 8, WHITE);
        const arm = 'M-9,-19 L-20,-36 L-40,-30';
        stroke(arm, INK, 5.4 + 2 * hair);
        stroke(arm, METAL, 3);
        k.append('circle').attr('cx', -20).attr('cy', -36).attr('r', 2.8).attr('fill', '#4b546d').attr('stroke', INK).attr('stroke-width', hair);
        stroke('M-40,-30 L-46,-34 M-40,-30 L-46,-25', INK, 3.4);
        stroke('M-40,-30 L-46,-34 M-40,-30 L-46,-25', METAL, 1.6);
      } else if (o.variant === 'navsat') {
        // Compass G2: the Earth-facing phased array on the bus, a whip antenna and the apogee-motor bell
        rect(-10, -13, 20, 17, '#27324f');
        if (big) {
          for (let i = 1; i < 4; i++) stroke(`M${-10 + i * 5},-13V4`, CELL, 0.6 * hair, 0.8);
          for (let i = 1; i < 3; i++) stroke(`M-10,${-13 + i * 5.7}H10`, CELL, 0.6 * hair, 0.8);
        }
        stroke(`M-9,${-bh}L-15,-34`, METAL, 1.8);
        solid('M-6.5,19 L-9.5,29 L9.5,29 L6.5,19Z', '#8a8f9c');
      }
    }
  } else if (shape === 'plane' && o.variant === 'winged') {
    // a generic winged vehicle (CSSHQ), nose up: a slim body on a broad delta wing, no tail or surface detail
    solid('M0,-47 L6,-28 L48,34 L-48,34 L-6,-28Z', color);
    k.append('path')
      .attr('d', 'M0,-45 C4,-30 4.6,-10 4.6,14 L4.6,34 L-4.6,34 L-4.6,14 C-4.6,-10 -4,-30 0,-45Z')
      .attr('fill', '#fff')
      .attr('fill-opacity', 0.28);
  } else if (shape === 'plane') {
    // spaceplane, seen from above, nose up: a swept delta with a lighter fuselage and a dark cockpit
    solid('M0,-47 L5,-31 L9.5,-12 L45,22 L45,30 L13,25 L7,37 L0,41 L-7,37 L-13,25 L-45,30 L-45,22 L-9.5,-12 L-5,-31Z', color);
    k.append('path')
      .attr('d', 'M0,-45 C4.4,-30 5.2,-10 5.2,12 L5.2,33 L0,37 L-5.2,33 L-5.2,12 C-5.2,-10 -4.4,-30 0,-45Z')
      .attr('fill', '#fff')
      .attr('fill-opacity', 0.28);
    k.append('ellipse').attr('cx', 0).attr('cy', -29).attr('rx', 2.8).attr('ry', 5.5).attr('fill', INK).attr('fill-opacity', 0.75);
  } else if (shape === 'aircraft') {
    // an airliner from above: fuselage, swept wings, tail planes (outlined once as one shape)
    solid(
      'M0,-47 C3.4,-44 4.7,-34 4.7,-12 L4.7,36 C4.7,42 2.4,47 0,47 C-2.4,47 -4.7,42 -4.7,36 L-4.7,-12 C-4.7,-34 -3.4,-44 0,-47Z' +
        'M4,-9 L47,19 L47,27 L4,10Z M-4,-9 L-47,19 L-47,27 L-4,10Z M4,32 L19,42 L19,46 L4,41Z M-4,32 L-19,42 L-19,46 L-4,41Z',
      '#f2f4fa',
    );
  } else if (shape === 'ship') {
    solid('M-50,-9 L32,-9 L50,0 L32,9 L-50,9Z', '#8e9bb4');
    rect(-26, -6, 22, 12, WHITE);
    rect(4, -5, 14, 10, METAL);
    rect(-44, -5, 14, 10, '#5d6a86');
  } else if (shape === 'site') {
    // a place on the ground: a dot in a ring
    k.append('circle')
      .attr('r', 36)
      .attr('fill', 'none')
      .attr('stroke', INK)
      .attr('stroke-width', 8 + 2 * hair);
    k.append('circle').attr('r', 36).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 8);
    k.append('circle')
      .attr('r', 15)
      .attr('fill', color)
      .attr('stroke', INK)
      .attr('stroke-width', 2 * hair);
  } else if (shape === 'jammer') {
    // a truck with a mast, a crossed antenna and three emission arcs
    rect(-40, 12, 50, 20, '#3a4254', 2);
    rect(12, 16, 22, 16, WHITE, 2);
    for (const cx of [-28, -6, 24])
      k.append('circle').attr('cx', cx).attr('cy', 34).attr('r', 7).attr('fill', INK).attr('stroke', '#8e9bb4').attr('stroke-width', 2);
    stroke('M-14,12V-34', INK, 4 + 2 * hair);
    stroke('M-14,12V-34', WHITE, 4);
    stroke('M-28,-30H0M-24,-18H-4', color, 4);
    for (const r of [18, 32, 46]) stroke(`M${-14 - r},${-34 - r * 0.2} A${r},${r} 0 0 1 ${-14 + r},${-34 - r * 0.2}`, color, 3, 0.85 - r / 80);
  }
  return k;
}

// Plain markers (small satellites, tick marks, fragments, places without a glyph): a flat dot or diamond with the same hairline outline.
export function drawMarker(g, kind, x, y, color, small = false) {
  if (kind === 'tick')
    return g
      .append('path')
      .attr('d', `M${x},${y - 5.5}L${x + 5.5},${y}L${x},${y + 5.5}L${x - 5.5},${y}Z`)
      .attr('fill', color)
      .attr('stroke', INK)
      .attr('stroke-width', 1.1)
      .attr('stroke-linejoin', 'round');
  if (kind === 'kv') return g.append('circle').attr('cx', x).attr('cy', y).attr('r', 3.6).attr('fill', color);
  const r = kind === 'sat' ? (small ? 2.7 : 3.6) : 4;
  return g.append('circle').attr('cx', x).attr('cy', y).attr('r', r).attr('fill', color).attr('stroke', INK).attr('stroke-width', 1.2);
}

// Real drawn extent of a craft glyph in its own 100-unit frame (measured once in a throwaway attached SVG: the diagram's own SVG is detached while built).
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
export const isCraftShape = (it) =>
  ['sat', 'plane', 'aircraft', 'ship', 'site', 'jammer'].includes(it.shape) && (it.prim || (it.label && !it.ctx && !it.small) || it.iss);

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
  let capPx = markerCap(W, opts.print) * (sim.cfg.spin ? 1.5 : 1); // the hero's ISS is a locator the reader should find: half as large again
  const capOvr = (!opts.panel && (sim.cfg.staticMarkerCap?.[it.craftId] ?? sim.cfg.staticMarkerCap?.[it.label])) || 0;
  if (craftShape && capOvr) capPx = (markerCap(W, opts.print) * capOvr) / 22; // override given in px at the 22 px reference stage
  return { capPx, capOvr };
}

export function capByMarker(cs, it, rot, capPx) {
  const b = localBox(shapeOf(it), it.variant),
    a = (rot * Math.PI) / 180,
    side = (z) =>
      (Math.max(Math.abs(Math.cos(a)) * b.width + Math.abs(Math.sin(a)) * b.height, Math.abs(Math.sin(a)) * b.width + Math.abs(Math.cos(a)) * b.height) * z) /
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
