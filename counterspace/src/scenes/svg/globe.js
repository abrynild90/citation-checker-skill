// ============================================================================
// scenes/svg/globe.js: the globe of the still diagram: which globe is drawn (the real disc or a limb arc), the star field, the Earth (the lit photograph
// projected onto the disc), its thin atmosphere and the "Earth, not to scale" tag
// ============================================================================
import { mulberry } from '../core.js';
import { SUN_VIEW, cachedEarth, earthRasterSync, hasEmbeddedEarth, landGeometry } from './earth-raster.js';
import { trackEarth } from './upgrade.js';
import { earthImg } from '../earth.js';
import { drawPill, pillSize } from './pill.js';

// A panel shows the whole Earth only when enough of the disc falls inside it.
export function panelShowsGlobe(opts, CX, CY, R, W, H) {
  if (!opts.panel) return true;
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
  // a GEO panel always shows the clean limb, never a cropped disc
  return inRect / inDisc >= 0.45 && !(opts.view && Math.hypot(...opts.view.focus) > 1.5);
}

// The globe actually drawn: the real one, or (a GEO panel, where the Earth is far outside the frame) a large limb arc on the Earth's side of the panel
export function pickGlobe(opts, W, cl, CX, CY, R, fTop, fBot, proj, path, showGlobe) {
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
      depth = Math.max(34, Math.min(190, (fBot - fTop) * 0.4)); // how far the limb reaches into the panel along the Earth direction
    GR = Math.min(520, Math.max(W, fBot - fTop) * 1.05); // a capped radius keeps the Earth raster sharp in a wide panel
    GX = pcx + ux * (edge - depth + GR);
    GY = pcy + uy * (edge - depth + GR);
    gproj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([GX, GY]).scale(GR).clipAngle(90);
    gpath = d3.geoPath(gproj);
    limb = { ux, uy, nx: GX - ux * GR, ny: GY - uy * GR, depth };
  }
  return { GX, GY, GR, gproj, gpath, limb };
}

const stop = (g, offset, color, opacity = 1) => g.append('stop').attr('offset', offset).attr('stop-color', color).attr('stop-opacity', opacity);

// The sphere's clip path (ids carry the per-SVG prefix U). The limb of every globe is this one clean circle.
export function addDefs(svg, U, { gpath }) {
  const defs = svg.append('defs');
  defs.append('clipPath').attr('id', `${U}-clip`).append('path').datum({ type: 'Sphere' }).attr('d', gpath);
  return defs;
}

// A fine star field: many faint pinpoints, some brighter, in cool and warm whites. Stars sharing a size, tint and brightness are one path of zero-length
// round-capped segments, so a dense sky stays a handful of elements. Nothing is drawn inside `keep` (the Earth and its atmosphere).
export function drawStars(svg, W, H, keep) {
  const rs = mulberry(99),
    n = Math.round((W * H) / 2300),
    TINTS = ['#dfe8ff', '#cfdcff', '#fff0da'],
    SIZES = [0.7, 1, 1.4, 1.9],
    buckets = {};
  for (let k = 0; k < n; k++) {
    const x = rs() * W,
      y = rs() * H,
      pick = rs(),
      si = pick < 0.6 ? 0 : pick < 0.86 ? 1 : pick < 0.97 ? 2 : 3,
      ti = rs() < 0.62 ? 0 : rs() < 0.5 ? 1 : 2,
      b = 0.3 + rs() * 0.5 + si * 0.08;
    if (keep && Math.hypot(x - keep.cx, y - keep.cy) < keep.r) continue;
    const key = `${si}|${ti}|${Math.round(b * 4)}`;
    (buckets[key] ||= { si, ti, op: Math.min(0.95, Math.round(b * 4) / 4 + 0.1), d: '' }).d += `M${x.toFixed(1)},${y.toFixed(1)}h0`;
  }
  const gStars = svg.append('g').attr('class', 'stars').attr('fill', 'none').attr('stroke-linecap', 'round');
  for (const q of Object.values(buckets))
    gStars.append('path').attr('d', q.d).attr('stroke', TINTS[q.ti]).attr('stroke-width', SIZES[q.si]).attr('stroke-opacity', q.op);
}

// The atmosphere is part of the planet: a hairline ring on the limb and a narrow soft band just outside it, brightest where the sun lights it (a gradient
// along the sun axis, pale blue-white to deep blue) and almost gone on the dark side. Its width follows the planet's size and is capped in px, so a huge limb
// arc in a panel gets a thin horizon line. No halo, no outer glow.
function drawAtmosphere(svg, defs, U, GX, GY, GR) {
  const ux = SUN_VIEW[0],
    uy = -SUN_VIEW[1],
    ul = Math.hypot(ux, uy) || 1,
    dx = ux / ul,
    dy = uy / ul;
  const lg = defs
    .append('linearGradient')
    .attr('id', `${U}-atm`)
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', GX + dx * GR)
    .attr('y1', GY + dy * GR)
    .attr('x2', GX - dx * GR)
    .attr('y2', GY - dy * GR);
  stop(lg, 0, '#ecf6ff', 1);
  stop(lg, 0.3, '#a9d6ff', 0.9);
  stop(lg, 0.58, '#5b9cf2', 0.5);
  stop(lg, 0.82, '#3a68c4', 0.4);
  stop(lg, 1, '#34589f', 0.34);
  const band = Math.max(2, Math.min(GR * 0.03, 7)),
    pad = band * 4,
    f = defs
      .append('filter')
      .attr('id', `${U}-atmblur`)
      .attr('filterUnits', 'userSpaceOnUse')
      .attr('x', GX - GR - pad)
      .attr('y', GY - GR - pad)
      .attr('width', 2 * (GR + pad))
      .attr('height', 2 * (GR + pad));
  f.append('feGaussianBlur').attr('stdDeviation', band * 0.45);
  svg
    .append('circle')
    .attr('cx', GX)
    .attr('cy', GY)
    .attr('r', GR + band * 0.45)
    .attr('fill', 'none')
    .attr('stroke', `url(#${U}-atm)`)
    .attr('stroke-width', band)
    .attr('opacity', 0.55)
    .attr('filter', `url(#${U}-atmblur)`);
  svg
    .append('circle')
    .attr('cx', GX)
    .attr('cy', GY)
    .attr('r', GR + 0.4)
    .attr('fill', 'none')
    .attr('stroke', `url(#${U}-atm)`)
    .attr('stroke-width', Math.max(1.2, Math.min(GR * 0.006, 2.4)));
}

// The Earth: the lit photograph (day and night images by the sun) as soon as imagery exists. Until then, for a few milliseconds, a flat dark disc that the
// photograph dissolves into (upgrade.js). The vector coastline map is drawn only when the page carries no imagery at all.
export function drawGlobe(svg, defs, U, { sim, rot, W, H, GX, GY, GR, gpath, limb, print }) {
  const node = svg.node(),
    embedded = hasEmbeddedEarth(),
    layer = svg.append('g').attr('class', 'earth').attr('clip-path', `url(#${U}-clip)`);
  const base = layer.append('path').datum({ type: 'Sphere' }).attr('d', gpath).attr('fill', '#0b1830');
  // supersampling: a print layout is shown 3.95 times larger in the saved image; the hero draws lean (it must be on screen within ~150 ms); else 2x or the device ratio
  const ss = print ? 3.95 : sim.cfg.spin ? Math.max(1.6, Math.min(devicePixelRatio || 1, 2.5)) : Math.max(2, Math.min(devicePixelRatio || 1, 3));
  const win = limb && { x0: 0, y0: 0, x1: W, y1: H };
  // The saved image needs its picture now (drawn on this thread); a diagram on the page takes one a worker has already drawn for this view, or paints it a
  // moment later.
  const ras = print ? earthRasterSync(rot, GX, GY, GR, win, ss, true) : cachedEarth(rot, GX, GY, GR, win, ss);
  node.__earth = { rot, GX, GY, GR, win, ss, layer: layer.node(), full: false, level: 0, busy: 0, image: null, vec: null, fade: !print };
  if (ras) {
    const level = print ? (earthImg ? 2 : 1) : ras.level;
    const im = layer.append('image').attr('href', ras.url).attr('x', ras.x).attr('y', ras.y).attr('width', ras.w).attr('height', ras.h);
    im.attr('preserveAspectRatio', 'none');
    Object.assign(node.__earth, { image: im.node(), level });
    node.dataset.earth = level >= 2 ? 'bluemarble' : 'embedded';
    node.dataset.ss = ras.ss.toFixed(2);
    base.remove();
    if (!print) trackEarth(node);
  } else {
    node.__earth.vec = base.node();
    node.dataset.ss = '';
    if (embedded) {
      node.dataset.earth = 'pending';
      trackEarth(node);
    } else {
      // no imagery in the page: real coastlines from the land data over a flat ocean
      node.dataset.earth = 'vector';
      layer.append('path').datum({ type: 'Sphere' }).attr('d', gpath).attr('fill', '#123e70');
      layer.append('path').datum(landGeometry()).attr('d', gpath).attr('fill', '#4c7a56').attr('stroke', '#8fb98a').attr('stroke-width', 0.5).attr('stroke-opacity', 0.55);
    }
  }
  drawAtmosphere(svg, defs, U, GX, GY, GR);
}

// A panel that looks at craft far from the Earth (GEO) shows the Earth as a big limb arc on its own side (drawn above, to no scale): name it.
// A secondary label in the shared pill look; its marks keep other labels off it.
export function drawLimbTag(svg, W, fBot, marks, fs, titled = false) {
  const text = 'Earth, not to scale',
    { w, h } = pillSize(text, { dot: false, fs }),
    lx = W - w / 2 - 8, // a corner tag: bottom-right of the panel's free area, over the limb and clear of the caption's centre
    ly = Math.max(fBot - h / 2 - 10, titled ? h + 20 : 0); // a panel title runs along the top: a short panel keeps the tag below it, not over its last words
  drawPill(svg, { x: lx, y: ly, w, h, text, dot: false, secondary: true, fs });
  // the tag as a row of small circles: labels placed by the shared placer stay off it
  for (let cx = lx - w / 2 + h / 2; cx < lx + w / 2; cx += h * 0.9) marks.push({ x: Math.min(cx, lx + w / 2 - h / 2), y: ly, r: h / 2 + 1, n: 'earth-cue' });
}
