// ============================================================================
// scenes/svg-fallback.js: static SVG renderer for reduced motion / no WebGL
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes.js.)
// ============================================================================
import { LAND, earthImg, loadEarth } from './earth.js';
import { DEG, ll, mulberry, sunFor, toLL } from './core.js';
import { fitBanner, labelW, offDisc, placeLabels } from './labels.js';

// ---------------------------------------------------------------- SVG fallback (static)
// A polished 2D diagram: orthographic globe with vector coastlines, shells, paths and markers,
// with the same screen-space label de-confliction (pills + leader lines) as the live scene.
// Blue Marble re-projected for the static globe: every pixel of the disc is inverted through the orthographic projection to lon/lat and sampled
// (bilinear) from the equirectangular image; the result is drawn into a canvas and embedded as a data-URL <image> clipped to the sphere.
let lastSS = 0,
  earthPix = null,
  earthPixSrc = null;
function earthRaster(proj, CX, CY, R, win) {
  if (!earthImg) return null;
  try {
    if (earthPixSrc !== earthImg) {
      const sw = Math.min(2048, earthImg.naturalWidth || earthImg.width),
        c = document.createElement('canvas');
      c.width = sw;
      c.height = sw / 2;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(earthImg, 0, 0, sw, sw / 2);
      earthPix = { w: sw, h: sw / 2, d: g.getImageData(0, 0, sw, sw / 2).data };
      earthPixSrc = earthImg;
    }
    // Supersampled: at least 2x the CSS size of the disc (capped at 2000 px), so a phone-width diagram still exports a sharp Earth in the print-size PNG.
    const dpr = Math.max(2, Math.min(devicePixelRatio || 1, 3)),
      S = Math.max(64, Math.min(Math.round(2 * R * dpr), 2000)),
      k = (2 * R) / S,
      // win: only the part of the disc inside this window (svg px) is rasterised (a big limb in a small panel)
      wx0 = win ? Math.max(CX - R, win.x0) : CX - R,
      wy0 = win ? Math.max(CY - R, win.y0) : CY - R,
      wx1 = win ? Math.min(CX + R, win.x1) : CX + R,
      wy1 = win ? Math.min(CY + R, win.y1) : CY + R,
      SW = Math.max(1, Math.ceil((wx1 - wx0) / k)),
      SH = Math.max(1, Math.ceil((wy1 - wy0) / k)),
      c = document.createElement('canvas');
    c.width = SW;
    c.height = SH;
    lastSS = S / (2 * R);
    const g = c.getContext('2d'),
      out = g.createImageData(SW, SH),
      o = out.data,
      { w, h, d } = earthPix,
      x0 = wx0,
      y0 = wy0;
    for (let j = 0; j < SH; j++)
      for (let i = 0; i < SW; i++) {
        const px = x0 + (i + 0.5) * k,
          py = y0 + (j + 0.5) * k;
        if ((px - CX) ** 2 + (py - CY) ** 2 > R * R) continue;
        const ll = proj.invert([px, py]);
        if (!ll || !isFinite(ll[0])) continue;
        let u = (((((ll[0] + 180) / 360) % 1) + 1) % 1) * w - 0.5,
          v = ((90 - ll[1]) / 180) * h - 0.5;
        const ix = Math.floor(u),
          iy = Math.max(0, Math.min(h - 2, Math.floor(v))),
          fx = u - ix,
          fy = v - iy,
          ia = ((ix % w) + w) % w,
          ib = (((ix + 1) % w) + w) % w;
        const a = (iy * w + ia) * 4,
          b = (iy * w + ib) * 4,
          cc = ((iy + 1) * w + ia) * 4,
          dd = ((iy + 1) * w + ib) * 4,
          q = (j * SW + i) * 4;
        for (let ch = 0; ch < 3; ch++) o[q + ch] = (d[a + ch] * (1 - fx) + d[b + ch] * fx) * (1 - fy) + (d[cc + ch] * (1 - fx) + d[dd + ch] * fx) * fy;
        o[q + 3] = 255;
      }
    g.putImageData(out, 0, 0);
    return { url: c.toDataURL('image/jpeg', 0.9), x: wx0, y: wy0, w: SW * k, h: SH * k };
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------- 2D craft silhouettes (simplified versions of the live models)
// Each is drawn in a local frame (x right, y down, unit = s px) and centred on (x, y). `s` is the overall width in px.
function drawCraft(g, shape, x, y, s, color, o = {}) {
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
    k.append('rect').attr('x', a).attr('y', b).attr('width', w).attr('height', h * 0.42).attr('fill', '#fff').attr('fill-opacity', 0.2);
    k.append('rect').attr('x', a).attr('y', b + h * 0.58).attr('width', w).attr('height', h * 0.42).attr('fill', '#000').attr('fill-opacity', 0.26);
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
          k.append('line').attr('x1', sg * 32).attr('x2', sg * 32).attr('y1', -17).attr('y2', 17).attr('stroke', dark).attr('stroke-width', 2);
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
    k.append('path')
      .attr('d', 'M8,-14 L44,26 L44,34 L9,26Z M-8,-14 L-44,26 L-44,34 L-9,26Z')
      .attr('fill', '#000')
      .attr('fill-opacity', 0.3);
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
const CRAFT_PX = { sat: 1, iss: 1.15, plane: 0.8, aircraft: 0.7, ship: 0.9, site: 0.45, jammer: 0.7 };
let earthUpgrade = false,
  pendingStatic = null,
  svgSeq = 0; // unique gradient/clip ids per SVG (several static SVGs can be in the document at once)
// Scenes with cfg.panels (the RPO scene: three unrelated episodes) get one small labelled panel per episode instead of one composite ring.
function renderPanels(sim, el) {
  const W = el.clientWidth || 640,
    H = el.clientHeight || 420,
    narrow = W < 760, // stacked rows; three columns only when there is room for their labels
    phone = W < 520,
    top = phone ? 38 : 40,
    gap = 6,
    n = sim.cfg.panels.length,
    pw = narrow ? W - 2 * gap : (W - (n + 1) * gap) / n,
    ph = narrow ? (H - top - (n + 1) * gap) / n : H - top - 2 * gap;
  fitBanner(el);
  const root = d3
    .create('svg')
    .style('background', '#070b16')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', `${sim.cfg.title}: static diagram, one panel per episode`);
  root.append('rect').attr('width', W).attr('height', H).attr('fill', '#070b16');
  const lays = [];
  sim.cfg.panels.forEach((pn, k) => {
    // focus: the middle of the craft visible at this episode's time
    const pts = sim.items
      .filter((i) => i.kind === 'point' && i.shape !== 'none' && i.prim)
      .map((i) => i.pos(pn.t))
      .filter(Boolean);
    const focus = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]),
      span = Math.max(0.16, ...pts.map((p) => Math.hypot(p[0] - focus[0], p[1] - focus[1], p[2] - focus[2])));
    sim.flags.all = false;
    const node = renderSVG(sim, el, pn.t, {
      panel: true,
      phone,
      W: pw,
      H: ph,
      view: { focus, span },
      status: phone ? '' : pn.status,
      title: phone ? `${pn.title} · ${pn.short || pn.brief}` : narrow ? `${pn.title} · ${pn.brief}` : pn.title,
      keep: true,
      drop: phone ? pn.dropPhone : null,
    });
    const x = narrow ? gap : gap + k * (pw + gap),
      y = narrow ? top + gap + k * (ph + gap) : top + gap;
    node.setAttribute('x', x);
    node.setAttribute('y', y);
    node.setAttribute('width', pw);
    node.setAttribute('height', ph);
    root.node().appendChild(node);
    const lay = node.__lay;
    lay.ox = x;
    lay.oy = y;
    lays.push(lay);
    root
      .append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', pw)
      .attr('height', ph)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,224,138,.35)')
      .attr('rx', 6);
  });
  sim.flags.all = true;
  root.node().__lay = { panels: lays, W, H };
  root.node().dataset.earth = root.node().querySelector('svg')?.dataset.earth || 'vector';
  el.querySelector(':scope > svg')?.remove();
  el.prepend(root.node());
  if (!earthImg) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el.id === 'sceneView' || reduced) {
      pendingStatic = { sim, el, t: sim.still, node: root.node() };
      if (!earthUpgrade) {
        earthUpgrade = true;
        loadEarth(2048).then((ok) => {
          earthUpgrade = false;
          const q = pendingStatic;
          if (ok && q && q.node.isConnected) {
            pendingStatic = null;
            renderSVG(q.sim, q.el, q.t);
          }
        });
      }
    }
  }
  return root.node();
}
export function renderSVG(sim, el, t = sim.still, opts = {}) {
  if (sim.cfg.panels && !opts.panel) return renderPanels(sim, el);
  if (!opts.panel && sim.cfg.staticT != null && t === sim.still) t = sim.cfg.staticT;
  const U = 'sf' + ++svgSeq;
  if (!opts.panel) fitBanner(el);
  if (sim.cfg.acts && !opts.panel) sim.flags.all = true; // static diagram of an act scene shows every act at once
  const W = opts.W || el.clientWidth || 640,
    H = opts.H || el.clientHeight || 420;
  const cam = sim.cams[0].pos,
    zoomed = !!(sim.items._arc && sim.cams[0].look);
  let cl = toLL(sim.cfg.staticCenter ? ll(sim.cfg.staticCenter[0], sim.cfg.staticCenter[1]) : zoomed ? sim.items._arc.mid : cam);
  if (opts.view) {
    // a panel looks at its craft from the side: the view axis is turned away from them so they sit beside the Earth, not in front of it
    const fl = toLL(opts.view.focus);
    cl = { lat: Math.max(-70, Math.min(70, fl.lat + 24)), lon: fl.lon - 38 };
  }
  const rot = d3.geoRotation([-cl.lon, -cl.lat]);
  // Unit projection (globe radius 1, origin at the globe centre, y down); scaled and shifted below once the fit is known.
  const unit = (p) => {
    const q = toLL(p);
    const [lo, la] = rot([q.lon, q.lat]);
    const x = Math.cos(la * DEG) * Math.sin(lo * DEG),
      y = Math.sin(la * DEG);
    const front = Math.cos(la * DEG) * Math.cos(lo * DEG);
    return { x: x * q.r, y: -y * q.r, hidden: front < 0 && Math.hypot(x * q.r, y * q.r) < 1 };
  };
  // Status text is wrapped first: its height is part of the fit.
  const st = sim.items.find((i) => i.kind === 'status'),
    stTxt = opts.panel ? opts.status || '' : (W < 520 && sim.cfg.staticStatusPhone) || sim.cfg.staticStatus || (st ? st.text(t, true) : ''),
    maxCh = Math.floor((W - (opts.panel ? 14 : 40)) / (opts.panel ? 6 : 6.6)),
    stLines = [];
  if (opts.panel ? stTxt : st) {
    let cur = '';
    for (const wd of stTxt.split(' ')) {
      if ((cur + ' ' + wd).trim().length > maxCh && cur) {
        stLines.push(cur);
        cur = wd;
      } else cur = (cur + ' ' + wd).trim();
    }
    if (cur) stLines.push(cur);
  }
  const nCraft = sim.items.filter((i) => i.kind === 'point' && i.prim && i.shape !== 'none' && !i.ctx && !i.liveOnly && i.pos(t)).length,
    craftBase = opts.panel
      ? Math.min(W * 0.2, opts.phone ? 40 : 52)
      : Math.max(
          26,
          Math.min(
            (W < 520 && sim.cfg.staticCraftMaxPhone) || sim.cfg.staticCraftMax || (nCraft <= 2 ? 110 : 64),
            W * (W < 520 ? (nCraft <= 2 ? 0.14 : 0.07) : nCraft <= 2 ? 0.1 : nCraft <= 4 ? 0.055 : 0.045),
          ),
        );
  const stH = stLines.length * 16 + 10,
    stY = H - (opts.panel ? 6 : 34) - stH,
    stW = Math.min(W - 16, Math.max(...stLines.map((l) => l.length), 1) * 6.6 + 24);
  // General fit rule (all scenes, all widths): the globe with its glow and every drawn subject (paths, points, debris, beams)
  // must sit inside the free area: below the banner, above the status/caption band, inside the side margins. The globe is never cropped.
  let x0 = -1.08,
    x1 = 1.08,
    y0 = -1.08,
    y1 = 1.08;
  // far orbits (apogees, belts) may run off the frame so the Earth stays large
  const fitMax = sim.cfg.staticFit && !opts.panel ? (W < 520 && sim.cfg.staticFitPhone) || sim.cfg.staticFit : 0;
  const grow = (p) => {
    if (!p || p.hidden) return;
    if (fitMax && Math.hypot(p.x, p.y) > fitMax) return;
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y);
  };
  {
    for (const it of sim.items) {
      if (it.ctx) continue; // context-only actors (constellations) never shrink the fit
      if (it.kind === 'curve') {
        if (it.staticKeep === false) continue;
        // On a phone the Earth gets the room: orbit and belt lines run off the frame, only trails and paths of the action set the fit.
        if (!(W < 520 && (it.orbit || it.gate || it.role === 'orbit'))) it.pts(t).forEach((q) => grow(unit(q)));
      } else if (it.kind === 'point' && !it.liveOnly) {
        const q = (!opts.panel && it.staticPos?.(t)) || it.pos(t);
        if (q) grow(unit(q));
      } else if (it.kind === 'beam') {
        const A = it.a(t),
          B = it.b(t);
        if (A && B && it.on(t)) {
          grow(unit(A));
          grow(unit(B));
        }
      } else if (it.kind === 'cloud') {
        const arr = new Float32Array(it.n * 3),
          col = it.dynCol ? new Float32Array(it.n * 4) : null;
        it.fill(t, arr, col);
        for (let k = 0; k < it.n; k += Math.max(1, Math.floor(it.n / 400)))
          if (arr[3 * k] || arr[3 * k + 1] || arr[3 * k + 2]) grow(unit([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]));
      }
    }
  }
  // Real banner box (the page's "illustrative" note sits over the diagram) and the footer strip are reserved for labels and the fit.
  let bRes = opts.panel ? [-20, -20, 1, 1] : [8, 8, Math.min(W - 16, 380), W < 520 ? 40 : 26];
  if (!opts.panel) {
    const bn = el.querySelector(':scope > .illus'),
      er = el.getBoundingClientRect(),
      br = bn?.getBoundingClientRect();
    if (br && br.width && er.width) bRes = [br.left - er.left - 3, br.top - er.top - 3, br.width + 6, br.height + 6];
  }
  // Footer scale note: the longest wording that fits at >= 9.5 px (10 px on a desk); never shrunk below that.
  const fFont = W < 520 ? 9.5 : 10,
    fCands = [
      `${sim.cfg.title} · compressed radial scale (Earth radius = 1; altitude^0.45)`,
      'Compressed radial scale (Earth radius = 1; altitude^0.45)',
      'Compressed radial scale · altitude^0.45',
      'Radial scale compressed',
    ],
    ftxt = opts.panel ? opts.title || '' : fCands.find((x) => x.length * fFont * 0.56 + 20 <= W - 12) || fCands.at(-1),
    fw = opts.panel ? 0 : Math.min(W - 12, ftxt.length * fFont * 0.56 + 20);
  const docked = sim.items.some((i) => i.dockWith && i.dockOn(t)), // a docked pair is two models wide: more side margin
    fx = 14 + (opts.panel ? 0 : Math.round(craftBase * (docked ? 1.15 : 0.6))),
    fTop = opts.panel ? (opts.title ? 22 : 6) : Math.max(W < 520 ? 56 : 42, bRes[1] + bRes[3] + 4) + (nCraft ? Math.round(craftBase * 0.3) : 0),
    fBot = stY - 8 - (nCraft && !opts.panel ? Math.round(craftBase * 0.3) : 0);
  let R = Math.max(20, Math.min((W - 2 * fx) / (x1 - x0), (fBot - fTop) / (y1 - y0)));
  let CX = W / 2 - ((x0 + x1) / 2) * R,
    CY = (fTop + fBot) / 2 - ((y0 + y1) / 2) * R;
  if (opts.view) {
    // Panel: the craft fill the panel (span = their half-extent); the Earth is drawn wherever it falls.
    const f = unit(opts.view.focus);
    R = Math.max(30, Math.min((W - 16) / (2 * opts.view.span * 1.5), (fBot - fTop) / (2 * opts.view.span * 1.5)));
    CX = W / 2 - f.x * R;
    CY = (fTop + fBot) / 2 - f.y * R;
  }
  const proj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([CX, CY]).scale(R).clipAngle(90);
  const project = (p) => {
    const u = unit(p);
    return { x: CX + u.x * R, y: CY + u.y * R, hidden: u.hidden };
  };
  const path = d3.geoPath(proj);
  let showGlobe = true;
  if (opts.panel) {
    let inRect = 0,
      inDisc = 0;
    for (let i = 0; i < 24; i++)
      for (let j = 0; j < 24; j++) {
        const x = CX + ((i + 0.5) / 12 - 1) * R,
          y = CY + ((j + 0.5) / 12 - 1) * R;
        if ((x - CX) ** 2 + (y - CY) ** 2 > R * R) continue;
        inDisc++;
        if (x >= 0 && x <= W && y >= 0 && y <= H) inRect++;
      }
    showGlobe = inRect / inDisc >= 0.45;
  }
  // The globe actually drawn: the real one, or (a GEO panel, where the Earth is far outside the frame) a large limb arc on the Earth's side of the panel
  let GX = CX,
    GY = CY,
    GR = R,
    gproj = proj,
    gpath = path,
    limb = null;
  if (opts.panel && !showGlobe) {
    const pcx = W / 2,
      pcy = (fTop + fBot) / 2,
      dx = CX - pcx,
      dy = CY - pcy,
      dl = Math.hypot(dx, dy) || 1;
    let ux = dx / dl,
      uy = dy / dl;
    // the limb fills the lower part of the panel (the Earth is "below" the craft), tilted a little toward the true side
    ux = Math.max(-0.22, Math.min(0.22, ux));
    uy = Math.sqrt(1 - ux * ux);
    const hx = W / 2,
      hy = (fBot - fTop) / 2 + 20,
      edge = Math.abs(ux) * hx + Math.abs(uy) * hy,
      depth = Math.max(34, Math.min(190, (fBot - fTop) * 0.3)); // how far the limb reaches into the panel along the Earth direction
    GR = Math.max(W, fBot - fTop) * 1.05;
    GX = pcx + ux * (edge - depth + GR);
    GY = pcy + uy * (edge - depth + GR);
    gproj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([GX, GY]).scale(GR).clipAngle(90);
    gpath = d3.geoPath(gproj);
    limb = { ux, uy, nx: GX - ux * GR, ny: GY - uy * GR, depth };
  }
  const svg = d3
    .create('svg')
    .style('background', '#070b16')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', `${sim.cfg.title}: static diagram`);
  const defs = svg.append('defs');
  const bg = defs.append('radialGradient').attr('id', `${U}-bg`).attr('cx', '50%').attr('cy', '50%').attr('r', '75%');
  bg.append('stop').attr('offset', 0).attr('stop-color', '#0f1a33');
  bg.append('stop').attr('offset', 1).attr('stop-color', '#070b16');
  const gl = defs.append('radialGradient').attr('id', `${U}-glow`);
  gl.append('stop').attr('offset', 0.9).attr('stop-color', '#5fa8ff').attr('stop-opacity', 0.5);
  gl.append('stop').attr('offset', 1).attr('stop-color', '#5fa8ff').attr('stop-opacity', 0);
  const oc = defs.append('radialGradient').attr('id', `${U}-ocean`).attr('cx', '38%').attr('cy', '35%').attr('r', '80%');
  oc.append('stop').attr('offset', 0).attr('stop-color', '#245c98');
  oc.append('stop').attr('offset', 0.6).attr('stop-color', '#123a68');
  oc.append('stop').attr('offset', 1).attr('stop-color', '#071a34');
  // Lit globe: soft sphere shading + a blurred night side, from the same sun direction as the live scene.
  const sh = defs
    .append('radialGradient')
    .attr('id', `${U}-shade`)
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('cx', GX - 0.28 * GR)
    .attr('cy', GY - 0.3 * GR)
    .attr('r', 1.55 * GR);
  sh.append('stop').attr('offset', 0).attr('stop-color', '#fff').attr('stop-opacity', 0.16);
  sh.append('stop').attr('offset', 0.45).attr('stop-color', '#fff').attr('stop-opacity', 0);
  sh.append('stop').attr('offset', 0.45).attr('stop-color', '#000').attr('stop-opacity', 0);
  sh.append('stop').attr('offset', 1).attr('stop-color', '#000').attr('stop-opacity', 0.5);
  defs
    .append('filter')
    .attr('id', `${U}-blur`)
    .attr('x', '-20%')
    .attr('y', '-20%')
    .attr('width', '140%')
    .attr('height', '140%')
    .append('feGaussianBlur')
    .attr('stdDeviation', Math.max(4, GR * 0.05));
  {
    // Land texture: fractal-noise mottling clipped to the land shape (desert/forest/ice tones), so the coastlines are not a flat cartoon fill.
    const f = defs.append('filter').attr('id', `${U}-tex`).attr('x', 0).attr('y', 0).attr('width', 1).attr('height', 1);
    f.append('feTurbulence').attr('type', 'fractalNoise').attr('baseFrequency', 0.014).attr('numOctaves', 3).attr('seed', 4).attr('result', 'n');
    f.append('feColorMatrix')
      .attr('in', 'n')
      .attr('type', 'matrix')
      .attr('values', '0 0 0 0 0.86  0 0 0 0 0.74  0 0 0 0 0.5  0 0 0 1.1 -0.42')
      .attr('result', 't');
    f.append('feComposite').attr('in', 't').attr('in2', 'SourceGraphic').attr('operator', 'in').attr('result', 'tl');
    const m = f.append('feMerge');
    m.append('feMergeNode').attr('in', 'SourceGraphic');
    m.append('feMergeNode').attr('in', 'tl');
  }
  const sc = defs
    .append('radialGradient')
    .attr('id', `${U}-sheen`)
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('cx', GX - 0.32 * GR)
    .attr('cy', GY - 0.34 * GR)
    .attr('r', 0.5 * GR);
  sc.append('stop').attr('offset', 0).attr('stop-color', '#cfe6ff').attr('stop-opacity', 0.2);
  sc.append('stop').attr('offset', 1).attr('stop-color', '#cfe6ff').attr('stop-opacity', 0);
  defs.append('clipPath').attr('id', `${U}-clip`).append('path').datum({ type: 'Sphere' }).attr('d', gpath);
  svg.append('rect').attr('width', W).attr('height', H).attr('fill', `url(#${U}-bg)`);
  {
    const rs = mulberry(99);
    for (let k = 0; k < 90; k++) {
      const x = rs() * W,
        y = rs() * H,
        b = 0.25 + rs() * 0.5;
      svg
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', rs() < 0.15 ? 1.1 : 0.7)
        .attr('fill', '#dfe8ff')
        .attr('fill-opacity', b);
    }
  }
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
    dCloud = [];
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
  shells.forEach((it) => {
    if (it.noRing) return;
    const rp = [];
    for (let a = 0; a <= 120; a++) rp.push([CX + it.r * R * Math.cos((a / 120) * 2 * Math.PI), CY + it.r * R * Math.sin((a / 120) * 2 * Math.PI)]);
    ringsL.push(rp);
  });
  shells.forEach((it) =>
    svg
      .append('circle')
      .attr('cx', CX)
      .attr('cy', CY)
      .attr('r', it.r * R)
      .attr('fill', it.color)
      .attr('fill-opacity', it.r * R > 0.62 * Math.min(W, H) ? 0 : 0.05)
      .attr('stroke', it.color)
      .attr('stroke-opacity', it.noRing ? 0 : 0.55)
      .attr('stroke-dasharray', '3 4'),
  );
  const gi0 = svg.node().childNodes.length; // everything drawn from here to the label layer is the globe (removed again when it is mostly cropped)
  svg
    .append('circle')
    .attr('cx', GX)
    .attr('cy', GY)
    .attr('r', GR * 1.08)
    .attr('fill', `url(#${U}-glow)`);
  svg.append('path').datum({ type: 'Sphere' }).attr('d', gpath).attr('fill', `url(#${U}-ocean)`).attr('stroke', '#7fb6ff').attr('stroke-opacity', 0.6);
  svg.append('path').datum(d3.geoGraticule10()).attr('d', gpath).attr('fill', 'none').attr('stroke', 'rgba(140,190,255,0.16)');
  // Ring winding is data-dependent: any ring that d3 reads as "more than a hemisphere" is reversed so it fills land, not the complement.
  const landGeo = {
    type: 'MultiPolygon',
    coordinates: (LAND || []).map((r) => {
      const c = [];
      for (let k = 0; k < r.length; k += 2) c.push([r[k], r[k + 1]]);
      if (c.length > 2 && d3.geoArea({ type: 'Polygon', coordinates: [c] }) > 2 * Math.PI) c.reverse();
      return [c];
    }),
  };
  const ras = earthRaster(gproj, GX, GY, GR, limb && { x0: 0, y0: 0, x1: W, y1: H });
  if (ras)
    svg
      .append('image')
      .attr('href', ras.url)
      .attr('x', ras.x)
      .attr('y', ras.y)
      .attr('width', ras.w)
      .attr('height', ras.h)
      .attr('preserveAspectRatio', 'none')
      .attr('clip-path', `url(#${U}-clip)`);
  else
    svg
      .append('path')
      .datum(landGeo)
      .attr('d', gpath)
      .attr('fill', '#4c7a56')
      .attr('filter', `url(#${U}-tex)`)
      .attr('stroke', '#8fb98a')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.55);
  svg.node().dataset.earth = ras ? 'bluemarble' : 'vector';
  svg.node().dataset.ss = ras ? lastSS.toFixed(2) : '';
  {
    // Sun direction in the view basis; the terminator crosses the view axis at a = -sz (units of GR), night is on the far side.
    const sd = toLL(sunFor(sim.sunRef)),
      [slo, sla] = rot([sd.lon, sd.lat]),
      sx = Math.cos(sla * DEG) * Math.sin(slo * DEG),
      sy = Math.sin(sla * DEG),
      sz = Math.cos(sla * DEG) * Math.cos(slo * DEG),
      pm = Math.hypot(sx, sy) || 1e-6;
    const ux = sx / pm,
      uy = -sy / pm,
      cx = GX,
      cyy = GY,
      at = (a) => [cx + ux * a * GR, cyy + uy * a * GR];
    const [x1, y1] = at(-sz - 0.55),
      [x2, y2] = at(-sz + 0.25);
    const ng = defs
      .append('linearGradient')
      .attr('id', `${U}-night`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);
    ng.append('stop').attr('offset', 0).attr('stop-color', '#01030a').attr('stop-opacity', 0.78);
    ng.append('stop').attr('offset', 1).attr('stop-color', '#01030a').attr('stop-opacity', 0);
    const cg = svg.append('g').attr('clip-path', `url(#${U}-clip)`);
    cg.append('path').datum({ type: 'Sphere' }).attr('d', gpath).attr('fill', `url(#${U}-shade)`);
    cg.append('rect').attr('width', W).attr('height', H).attr('fill', `url(#${U}-sheen)`);
    cg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', W)
      .attr('height', H)
      .attr('fill', `url(#${U}-night)`)
      .attr('opacity', limb ? 0.3 : pm < 0.06 && sz > 0 ? 0 : 1);
    svg
      .append('path')
      .datum({ type: 'Sphere' })
      .attr('d', gpath)
      .attr('fill', 'none')
      .attr('stroke', '#8cc8ff')
      .attr('stroke-opacity', 0.55)
      .attr('stroke-width', 1.2);
  }
  // A panel that looks at craft far from the Earth (GEO) shows the Earth as a big limb arc on its own side (drawn above, to no scale): name it.
  if (limb) {
    const tw = 112,
      lx = Math.max(tw / 2 + 8, Math.min(W - tw / 2 - 8, limb.nx)),
      ly = Math.max(fTop + 40, Math.min(fBot - 12, limb.ny + Math.max(16, limb.depth * 0.42)));
    svg
      .append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', 'middle')
      .attr('fill', '#dfe9ff')
      .attr('fill-opacity', 0.9)
      .attr('font-family', 'system-ui')
      .attr('font-size', 10.5)
      .attr('font-style', 'italic')
      .attr('stroke', '#050812')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .text('Earth (not to scale)');
    marks.push({ x: lx, y: ly - 4, r: 16, n: 'earth-cue' }, { x: lx - 38, y: ly - 4, r: 12, n: 'earth-cue' }, { x: lx + 38, y: ly - 4, r: 12, n: 'earth-cue' });
  }
  const g = svg.append('g').attr('font-family', 'system-ui').attr('font-size', 11);
  const NARROW = W < 600 || !!sim.cfg.acts; // short label texts on a phone, and in the busy multi-act composite (spaceplanes) at any width
  // Labels are collected, de-conflicted, then drawn as pills with leader lines to their objects.
  shells.forEach((it, i) => {
    const lab = it.staticLabel ?? it.label;
    if (!lab) return;
    const tx = it.short && NARROW && !it.staticLabel ? it.short : lab,
      w = labelW(tx);
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
      o = (w / 2) * Math.abs(Math.cos(a)) + 9.5 * Math.abs(Math.sin(a)) + 7; // the pill sits just outside its dashed shell line, never on it
    cands.push({ x: px + Math.cos(a) * o, y: py - Math.sin(a) * o, px, py, w, h: 19, fixed: true, text: tx, color: it.color });
  });
  const label = (p, text, color = '#dfe6f7', dx = 0, dy = 0, at = null, opt = false) => {
    if (!p || p.hidden || !text || p.x < 4 || p.y < 4 || p.x > W - 4 || p.y > H - 4) return;
    if (opts.drop?.includes(text)) return; // a panel's own label dropped where it would cross another on a phone
    if (opt && W < 520 && sim.cfg.acts && !opts.panel) return; // the busy multi-act composite drops its secondary labels on a phone
    cands.push({
      x: at ? at[0] * W : p.x + dx,
      y: at ? at[1] * H : p.y - 14 + dy,
      px: p.x,
      py: p.y,
      w: labelW(text),
      h: 19,
      text,
      color,
      opt,
    });
  };
  for (const it of sim.items) {
    if (it.kind === 'dome')
      g.append('path')
        .datum(d3.geoCircle().center([it.at[1], it.at[0]]).radius(it.radius)())
        .attr('d', path)
        .attr('fill', it.color)
        .attr('fill-opacity', 0.32)
        .attr('stroke', it.color)
        .attr('stroke-width', 1.6);
    if (it.kind === 'curve' && it.staticKeep === false) continue;
    if (it.kind === 'curve') {
      let pts = it.pts(t).map(project);
      // only the part outside the disc: an arch behind the globe, clipped at its limb
      if (it.limbOnly) pts = pts.map((p) => (Math.hypot(p.x - CX, p.y - CY) < R * 1.005 ? { ...p, hidden: true } : p));
      // a panel keeps only the context ring at the altitude of its craft (a GEO belt in a LEO panel, or the reverse, is a stray arc)
      if (opts.panel && it.inset && pts.length) {
        const rr = it.pts(t).reduce((m, q) => m + Math.hypot(...q), 0) / pts.length,
          fr = opts.view ? Math.hypot(...opts.view.focus) : rr;
        if (Math.abs(rr - fr) > 0.6) continue;
      }
      // a panel that shows no globe drops low-orbit context rings (they would be a stray arc with nothing to orbit)
      if (opts.panel && !showGlobe && it.inset && pts.length && Math.min(...it.pts(t).map((q) => Math.hypot(...q))) < 1.6) continue;
      let seg = [];
      const flush = () => {
        if (seg.length > 1) dPolys.push({ p: seg.slice(), role: it.role || 'line' });
        if (seg.length > 1)
          g.append('path')
            .attr('d', d3.line().curve(d3.curveCatmullRom.alpha(0.5))(seg))
            .attr('fill', 'none')
            .attr('stroke', it.color)
            .attr('stroke-linecap', 'round')
            .attr('stroke-opacity', it.thick ? Math.max(0.85, it.opacity ?? 1) : (it.opacity ?? 1))
            .attr('stroke-width', it.thick ? Math.max(2.2, it.thick * R * 1.8) : it.width || 1.2);
        seg = [];
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
      pts.forEach((p) => {
        if (p.hidden) flush();
        else seg.push([p.x, p.y]);
      });
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
      }
      if (it.label && it.labelAt && pts.length > 2 && !it.staticHide)
        label(project(it.labelAt), it.short && NARROW ? it.short : it.label, it.color, it.labelDx, it.labelDy, W < 700 ? null : it.staticAt, it.opt);
    }
    if (it.kind === 'cloud') {
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
    if (it.kind === 'beam') {
      const A = it.a(t),
        B = it.b(t);
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
        if (!a.hidden && !b.hidden)
          g.append('line')
            .attr('x1', a.x)
            .attr('y1', a.y)
            .attr('x2', b.x)
            .attr('y2', b.y)
            .attr('stroke', it.colorFn ? it.colorFn(t) : it.color)
            .attr('stroke-opacity', it.opFn ? it.opFn(t) : (it.opacity ?? 0.8))
            .attr('stroke-dasharray', it.dashFn?.(t) ? '3 3' : null)
            .attr('stroke-width', it.width ? 5 : 1.2);
        if (it.label) label({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, it.label, it.color);
      }
    }
    if (it.kind === 'point')
      for (const tt of (!opts.panel && sim.cfg.staticSnap?.[it.craftId]) || [t]) {
        const t = tt;
        const q = it.liveOnly ? null : (!opts.panel && it.staticPos?.(t)) || it.pos(t);
        if (!q) continue;
        let p = project(q);
        if (p.hidden) continue;
        const c = it.statusColor ? it.statusColor(t) : it.color;
        const craftShape =
          ['sat', 'plane', 'aircraft', 'ship', 'site', 'jammer'].includes(it.shape) && (it.prim || (it.label && !it.ctx && !it.small) || it.iss);
        // craft drawn as silhouettes: size follows the panel (bigger on the desk, still readable on a phone), and the subject of a scene is never a speck
        const cs = craftShape
          ? Math.round(
              Math.min(sim.cfg.spin ? 46 : 99, craftBase * (it.iss ? 1.3 : 1)) *
                (it.small ? 0.72 : 1) *
                (CRAFT_PX[it.iss ? 'iss' : it.shape] || 1) *
                ((!opts.panel && sim.cfg.staticCraftScale?.[it.craftId]) || 1),
            )
          : 0;
        // Docked pair: the two models sit side by side, touching (no link is drawn: SWF says docked, not how).
        if (it.dockWith && it.dockOn(t)) p = { ...p, x: p.x + cs * 0.5 };
        else if (it.craftId && sim.items.some((o) => o.dockWith === it.craftId && o.dockOn(t))) p = { ...p, x: p.x - cs * 0.5 };
        let rot = 0;
        if (it.shape === 'plane' || it.shape === 'aircraft') {
          const q2 = it.pos(Math.min(1, t + 0.012)) || q,
            p2 = project(q2);
          if (Math.hypot(p2.x - p.x, p2.y - p.y) > 0.3) rot = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
          else rot = -25;
        }
        const mi = marks.length;
        if (it.shape !== 'none')
          mark(
            p,
            craftShape ? cs * (it.shape === 'sat' || it.shape === 'ship' ? 0.5 : 0.42) + 2 : it.shape === 'sat' ? 5 : it.shape === 'tick' ? 6 : 5,
            it.label || it.shape,
          );
        if (craftShape) drawCraft(g, it.iss ? 'iss' : it.shape, p.x, p.y, cs, c, { rot, variant: it.variant });
        else if (it.shape === 'sat') {
          const q3 = it.small ? 6 : 8;
          g.append('rect')
            .attr('x', p.x - q3 / 2)
            .attr('y', p.y - q3 / 2)
            .attr('width', q3)
            .attr('height', q3)
            .attr('fill', c)
            .attr('stroke', '#070b17')
            .attr('stroke-width', 0.8);
        } else if (it.shape === 'tick')
          g.append('path')
            .attr('d', `M${p.x},${p.y - 5}L${p.x + 5},${p.y}L${p.x},${p.y + 5}L${p.x - 5},${p.y}Z`)
            .attr('fill', c)
            .attr('stroke', '#070b17');
        else if (it.shape === 'none') {
          /* label-only anchor */
        } else if (it.shape === 'kv') g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 4).attr('fill', c);
        else g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 4).attr('fill', c).attr('stroke', '#070b17').attr('stroke-width', 1);
        if (it.label && !it.ctx && !it.noLeader && !(!opts.panel && sim.cfg.staticNoLabel?.includes(it.craftId))) {
          const n0 = cands.length;
          label(
            p,
            (!opts.panel && sim.cfg.staticLabels?.[it.craftId]) || (it.labelFn ? it.labelFn(t, NARROW) : it.short && NARROW ? it.short : it.label),
            c,
            it.labelDx,
            it.labelDy,
            W < 700 ? null : it.staticAt,
            it.opt,
          );
          if (it.offGlobe && cands.length > n0) cands.at(-1).off = true;
          if (cands.length > n0 && marks.length > mi) cands.at(-1).mk = mi;
        }
      }
    if (it.kind === 'flash' && it.big && t >= it.t0 && !it.ringColor) {
      const p = project(it.pos);
      mark(p, 12, it.label || 'flash');
      g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 11).attr('fill', '#fff3c4').attr('fill-opacity', 0.35);
      g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 5).attr('fill', '#fff3c4');
      label(p, it.label, '#fff3c4', it.labelDx, it.labelDy);
    }
    if (it.kind === 'flash' && !it.big && t >= it.t0 && t < it.t0 + (it.span ?? 0.14)) {
      const p = project(it.pos);
      g.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 7).attr('fill', '#fff1c1').attr('fill-opacity', 0.7);
    }
  }
  // Legend-style key (cfg.staticKey: [colour, text] rows) instead of a label per orbit or object: bottom-left, above the caption
  const key = !opts.panel && sim.cfg.staticKey,
    kFs = W < 520 ? 9.5 : 10.5,
    kBox = key
      ? (() => {
          const kw = Math.max(...key.map((k) => (W < 520 && k[2]) || k[1]).map((x) => x.length)) * kFs * 0.57 + 36,
            kh = key.length * (kFs + 6) + 8;
          return [10, stY - 8 - kh, Math.min(kw, W - 20), kh];
        })()
      : null;
  const reserved = opts.panel
    ? [[(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6]]
    : [bRes, [(W - stW) / 2 - 3, stY - 3, stW + 6, stH + 6], [6, H - 27, fw + 2, 22], ...(kBox ? [[kBox[0] - 3, kBox[1] - 3, kBox[2] + 6, kBox[3] + 6]] : [])];
  if (opts.panel && opts.title) reserved.push([0, 0, W, 20]);
  cands.forEach((c) => {
    if (c.off) [c.x, c.y] = offDisc(c.px, c.py, c.w, c.h, GX, GY, GR * 1.08);
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
      g.append('line').attr('x1', kBox[0] + 8).attr('x2', kBox[0] + 24).attr('y1', yy).attr('y2', yy).attr('stroke', k[0]).attr('stroke-width', 3);
      g.append('text')
        .attr('x', kBox[0] + 30)
        .attr('y', yy + kFs * 0.35)
        .attr('fill', '#dfe6f7')
        .attr('font-size', kFs)
        .text((W < 520 && k[2]) || k[1]);
    });
  }
  if (opts.panel ? stTxt : st) {
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
        .attr('font-family', 'system-ui')
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
      .attr('font-family', 'system-ui')
      .text(ft);
  }
  {
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
        minFont: Math.min(
          ...[...svg.node().querySelectorAll('text')].map((e) => +e.getAttribute('font-size') || +e.parentNode.getAttribute('font-size') || 11),
        ),
        polys: dPolys,
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
  if (opts.panel) return svg.node();
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  // Static mode (reduced motion, or a scene opened without WebGL): fetch the imagery once and redraw this diagram with the photographic globe.
  // The hero's placeholder diagram only does this under reduced motion, and after the page has loaded and gone idle (never at first paint).
  if (!earthImg) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches,
      wanted = el.id === 'sceneView' || (reduced && sim.cfg.spin);
    if (wanted) {
      pendingStatic = { sim, el, t, node: svg.node() };
      const go = () =>
        loadEarth(2048).then((ok) => {
          earthUpgrade = false;
          const q = pendingStatic;
          if (ok && q && q.node.isConnected) {
            pendingStatic = null;
            renderSVG(q.sim, q.el, q.t);
          }
        });
      if (!earthUpgrade) {
        earthUpgrade = true;
        if (sim.cfg.spin && document.readyState !== 'complete') addEventListener('load', () => (window.requestIdleCallback || setTimeout)(go), { once: true });
        else if (sim.cfg.spin) (window.requestIdleCallback || setTimeout)(go);
        else go();
      }
    }
  }
  return svg.node();
}
