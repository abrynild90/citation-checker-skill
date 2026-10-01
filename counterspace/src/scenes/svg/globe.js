// ============================================================================
// scenes/svg/globe.js: the globe of the static diagram: which globe is drawn (the real disc or a limb arc), gradients and filters, star field, Earth raster or
// vector land, sun lighting and the "Earth (not to scale)" tag
// ============================================================================
import { DEG, mulberry, sunFor, toLL } from '../core.js';
import { earthRaster, landGeometry, lastSS } from './earth-raster.js';

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

// Gradients, filters and the sphere clip path (ids carry the per-SVG prefix U).
export function addDefs(svg, U, { GX, GY, GR, gpath }) {
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
  return defs;
}

export function drawStars(svg, W, H) {
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

// Glow, sphere, graticule, Earth (raster or vector land), sun lighting and outline.
export function drawGlobe(svg, defs, U, { sim, rot, W, H, GX, GY, GR, gproj, gpath, limb }) {
  svg
    .append('circle')
    .attr('cx', GX)
    .attr('cy', GY)
    .attr('r', GR * 1.08)
    .attr('fill', `url(#${U}-glow)`);
  svg.append('path').datum({ type: 'Sphere' }).attr('d', gpath).attr('fill', `url(#${U}-ocean)`).attr('stroke', '#7fb6ff').attr('stroke-opacity', 0.6);
  svg.append('path').datum(d3.geoGraticule10()).attr('d', gpath).attr('fill', 'none').attr('stroke', 'rgba(140,190,255,0.16)');
  const landGeo = landGeometry();
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
}

// A panel that looks at craft far from the Earth (GEO) shows the Earth as a big limb arc on its own side (drawn above, to no scale): name it.
// (a dark pill keeps it readable over bright land; its marks keep labels off it)
export function drawLimbTag(svg, W, fBot, marks) {
  const tw = 128,
    lx = W - tw / 2 - 8, // a corner tag: bottom-right of the panel's free area, over the limb and clear of the caption's centre
    ly = fBot - 5;
  svg
    .append('rect')
    .attr('x', lx - tw / 2)
    .attr('y', ly - 14)
    .attr('width', tw)
    .attr('height', 20)
    .attr('rx', 4)
    .attr('fill', 'rgba(5,8,18,0.78)'); // a dark pill: the tag stays readable over bright land
  svg
    .append('text')
    .attr('x', lx)
    .attr('y', ly)
    .attr('text-anchor', 'middle')
    .attr('fill', '#dfe9ff')
    .attr('fill-opacity', 0.9)
    .attr('font-family', 'system-ui')
    .attr('font-size', 12)
    .attr('font-style', 'italic')
    .attr('stroke', '#050812')
    .attr('stroke-opacity', 0.7)
    .attr('stroke-width', 3)
    .attr('paint-order', 'stroke')
    .text('Earth (not to scale)');
  marks.push({ x: lx, y: ly - 4, r: 16, n: 'earth-cue' }, { x: lx - 44, y: ly - 4, r: 12, n: 'earth-cue' }, { x: lx + 44, y: ly - 4, r: 12, n: 'earth-cue' });
}
