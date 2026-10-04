// ============================================================================
// scenes/svg-fallback.js: the still diagram: the renderer for reduced motion, for browsers without 3D, for the saved image, and for the page's first picture
// of the Earth (the hero) before any 3D library loads
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
import { drawHeroShells, heroTime, heroView } from './svg/hero.js';
import { requestFullEarth, wantsFullEarth } from './svg/upgrade.js';
import { prewarmEarth } from './svg/earth-raster.js';
import { fontFaceCSS, rememberSim } from './svg/still-frame.js';
import { SANS } from '../fonts.js';

prewarmEarth(); // a worker starts decoding the embedded Earth images while the page boots, so the first picture finds it ready

// A still diagram: the orthographic globe (a lit photograph), shells, paths and markers, with the same screen-space label de-confliction (pills and leaders)
// as the live scene. The pieces live in ./svg/: layout (frame fit), globe (Earth, atmosphere, stars), items (per sim item kind), label-layer (labels, key,
// caption, probe), pill (the label look), craft (silhouettes), panels (multi-episode scenes), hero (the first picture), earth-raster and upgrade (the photograph).
let svgSeq = 0; // unique gradient/clip ids per SVG (several static SVGs can be in the document at once)

export function renderSVG(sim, el, t = sim.still, opts = {}) {
  if (sim.cfg.panels && !opts.panel) return renderPanels(sim, el, renderSVG, opts);
  const t0 = performance.now(),
    hero = !!sim.cfg.spin && !opts.panel;
  if (!opts.panel && sim.cfg.staticT != null && t === sim.still) t = sim.cfg.staticT;
  const U = 'sf' + ++svgSeq;
  if (!opts.panel) fitBanner(el);
  if (sim.cfg.acts && !opts.panel) sim.flags.all = true; // static diagram of an act scene shows every act at once
  const W = opts.W || el.clientWidth || 640,
    H = opts.H || el.clientHeight || 420;
  const cam = sim.cams[0].pos,
    zoomed = !!(sim.items._arc && sim.cams[0].look);
  let cl = toLL(sim.cfg.staticCenter ? ll(sim.cfg.staticCenter[0], sim.cfg.staticCenter[1]) : zoomed ? sim.items._arc.mid : cam);
  if (hero && !sim.cfg.staticCenter) cl = heroView(W, H);
  if (opts.view) {
    // a panel looks at its craft from the side: the view axis is turned away from them so they sit beside the Earth, not in front of it
    const fl = toLL(opts.view.focus);
    cl = { lat: Math.max(-70, Math.min(70, fl.lat + 24)), lon: fl.lon - 38 };
  }
  const rot = d3.geoRotation([-cl.lon, -cl.lat]);
  // Unit projection (globe radius 1, origin at the globe centre, y down); scaled and shifted below once the fit is known. z is the depth toward the viewer.
  const unit = (p) => {
    const q = toLL(p);
    const [lo, la] = rot([q.lon, q.lat]);
    const x = Math.cos(la * DEG) * Math.sin(lo * DEG),
      y = Math.sin(la * DEG);
    const front = Math.cos(la * DEG) * Math.cos(lo * DEG);
    return { x: x * q.r, y: -y * q.r, z: front * q.r, hidden: front < 0 && Math.hypot(x * q.r, y * q.r) < 1 };
  };
  if (hero && !opts.print) t = heroTime(sim, unit, t);
  const fit = fitFrame(sim, el, t, opts, W, H, unit);
  const { R, CX, CY, fTop, fBot, craftBase, stY } = fit;
  const proj = d3.geoOrthographic().rotate([-cl.lon, -cl.lat]).translate([CX, CY]).scale(R).clipAngle(90);
  const project = (p) => {
    const u = unit(p);
    return { x: CX + u.x * R, y: CY + u.y * R, z: u.z, hidden: u.hidden };
  };
  const path = d3.geoPath(proj);
  const showGlobe = panelShowsGlobe(opts, CX, CY, R, W, H);
  const { GX, GY, GR, gproj, gpath, limb } = pickGlobe(opts, W, cl, CX, CY, R, fTop, fBot, proj, path, showGlobe);
  const svg = d3
    .create('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', `${sim.cfg.title}: still diagram`);
  const defs = addDefs(svg, U, { GX, GY, GR, gpath });
  // The saved image draws this SVG as an image, which cannot see the page's fonts: the print layout carries the ones it uses.
  if (opts.print) defs.append('style').text(fontFaceCSS());
  // The hero sits on the page's own dark sky, so its picture has no backdrop; a scene diagram carries its own flat ink-blue one.
  if (!hero) {
    svg.style('background', '#070b16');
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#070b16');
  }
  drawStars(svg, W, H, { cx: GX, cy: GY, r: GR * 1.06 });
  const S = createDrawState({ sim, opts, t, W, H, svg, project, path, CX, CY, R, showGlobe, craftBase });
  if (!hero) drawShells(S);
  drawGlobe(svg, defs, U, { sim, rot, W, H, GX, GY, GR, gproj, gpath, limb, print: !!(opts.print || opts.syncEarth) });
  if (limb) drawLimbTag(svg, W, fBot, S.marks, S.fs);
  S.g = svg.append('g').attr('font-family', SANS).attr('font-size', 11);
  Object.assign(S, { GX, GY, GR });
  if (hero) drawHeroShells(S, fTop, stY);
  else queueShellLabels(S, fTop, stY);
  drawItems(S);
  const legend = legendBox(sim, opts, W, stY);
  const pl = placeAndDrawLabels(S, fit, legend);
  drawLegend(S, legend);
  drawStatus(S, fit);
  drawChrome(S);
  attachProbe(S, fit, legend, pl);
  rememberSim(svg.node(), sim);
  if (opts.panel) return svg.node();
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  if (wantsFullEarth(el, sim) && svg.node().__earth) {
    svg.node().__earth.full = true;
    requestFullEarth(sim);
  }
  if (hero && !opts.print) watchStage(sim, el, t, W, H);
  if (!opts.print) performance.measure('cs:diagram-' + sim.cfg.id, { start: t0, end: performance.now() }); // shows in window.__cs.perf()
  return svg.node();
}

// The hero is drawn once for the stage it finds, so it is drawn again when the stage changes shape (a window resize, a phone turned over, the page's own
// layout settling after the first paint). It stops when the live globe takes the stage over.
const watched = new WeakMap();
function watchStage(sim, el, t, W, H) {
  const w = watched.get(el);
  if (w) return Object.assign(w, { sim, t, W, H });
  const st = { sim, t, W, H, timer: 0 };
  watched.set(el, st);
  if (typeof ResizeObserver === 'undefined') return;
  new ResizeObserver(() => {
    clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      if (el.querySelector(':scope > canvas') || !el.querySelector(':scope > svg')) return; // the live globe (or nothing) is on the stage
      const nw = el.clientWidth,
        nh = el.clientHeight;
      if (nw && nh && (Math.abs(nw - st.W) > 3 || Math.abs(nh - st.H) > 3)) renderSVG(st.sim, el, st.t);
    }, 120);
  }).observe(el);
}
