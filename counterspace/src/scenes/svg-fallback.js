// ============================================================================
// scenes/svg-fallback.js: static SVG renderer for reduced motion / no WebGL
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
// ============================================================================
import { DEG, ll, toLL } from './core.js';
import { fitBanner } from './labels.js';
import { fitFrame } from './svg/layout.js';
import { addDefs, drawGlobe, drawLimbTag, drawStars, panelShowsGlobe, pickGlobe } from './svg/globe.js';
import { createDrawState, drawShells, queueShellLabels } from './svg/draw-state.js';
import { drawItems } from './svg/items.js';
import { attachProbe, drawChrome, drawLegend, drawStatus, legendBox, placeAndDrawLabels } from './svg/label-layer.js';
import { renderPanels } from './svg/panels.js';
import { upgradeDiagramEarth } from './svg/upgrade.js';

// A polished 2D diagram: orthographic globe with vector coastlines, shells, paths and markers,
// with the same screen-space label de-confliction (pills + leader lines) as the live scene.
// The pieces live in ./svg/: layout (frame fit), globe (Earth, lighting), items (per sim item kind), label-layer (labels, key, status, probe),
// craft (silhouettes), panels (multi-episode scenes), earth-raster, upgrade (photographic Earth once loaded).
let svgSeq = 0; // unique gradient/clip ids per SVG (several static SVGs can be in the document at once)

export function renderSVG(sim, el, t = sim.still, opts = {}) {
  if (sim.cfg.panels && !opts.panel) return renderPanels(sim, el, renderSVG);
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
  const fit = fitFrame(sim, el, t, opts, W, H, unit);
  const { R, CX, CY, fTop, fBot, craftBase, stY } = fit;
  const proj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([CX, CY]).scale(R).clipAngle(90);
  const project = (p) => {
    const u = unit(p);
    return { x: CX + u.x * R, y: CY + u.y * R, hidden: u.hidden };
  };
  const path = d3.geoPath(proj);
  const showGlobe = panelShowsGlobe(opts, CX, CY, R, W, H);
  const { GX, GY, GR, gproj, gpath, limb } = pickGlobe(opts, W, cl, CX, CY, R, fTop, fBot, proj, path, showGlobe);
  const svg = d3
    .create('svg')
    .style('background', '#070b16')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', `${sim.cfg.title}: static diagram`);
  const defs = addDefs(svg, U, { GX, GY, GR, gpath });
  svg.append('rect').attr('width', W).attr('height', H).attr('fill', `url(#${U}-bg)`);
  drawStars(svg, W, H);
  const S = createDrawState({ sim, opts, t, W, H, svg, project, path, CX, CY, R, showGlobe, craftBase });
  drawShells(S);
  drawGlobe(svg, defs, U, { sim, rot, W, H, GX, GY, GR, gproj, gpath, limb });
  if (limb) drawLimbTag(svg, W, fBot, S.marks);
  S.g = svg.append('g').attr('font-family', 'system-ui').attr('font-size', 11);
  Object.assign(S, { GX, GY, GR });
  queueShellLabels(S, fTop, stY);
  drawItems(S);
  const legend = legendBox(sim, opts, W, stY);
  const pl = placeAndDrawLabels(S, fit, legend);
  drawLegend(S, legend);
  drawStatus(S, fit);
  drawChrome(S, fit);
  attachProbe(S, fit, legend, pl);
  if (opts.panel) return svg.node();
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  upgradeDiagramEarth({ sim, el, t, node: svg.node() }, renderSVG);
  return svg.node();
}
