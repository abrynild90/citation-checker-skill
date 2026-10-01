// ============================================================================
// scenes/svg/panels.js: scenes with cfg.panels (the RPO scene: three unrelated episodes) as one labelled static panel per episode
// ============================================================================
import { fitBanner } from '../labels.js';
import { upgradePanelsEarth } from './upgrade.js';


export function renderPanels(sim, el, renderSVG) {
  const W = el.clientWidth || 640,
    H = el.clientHeight || 420,
    phone = W < 520, // stacked rows
    cols = !phone && W >= 760 && W / H >= 1.7, // three columns only on a wide, short stage (the print stage); else 2 + 1 so the panels are not slivers
    narrow = !cols,
    top = el.getAttribute('aria-hidden') === 'true' ? 4 : phone ? 38 : 40, // the off-screen print stage has no banner to clear
    gap = phone ? 5 : 6,
    n = sim.cfg.panels.length,
    geo = (k) => {
      // panel k's rectangle: a row of three, a stack of three (phone) or two panels over one full-width panel
      if (cols) return { x: gap + k * ((W - (n + 1) * gap) / n + gap), y: top + gap, w: (W - (n + 1) * gap) / n, h: H - top - 2 * gap };
      if (phone) {
        const h = (H - top - (n + 1) * gap) / n;
        return { x: gap, y: top + gap + k * (h + gap), w: W - 2 * gap, h };
      }
      const h = (H - top - 3 * gap) / 2,
        w2 = (W - 3 * gap) / 2;
      return k < 2 ? { x: gap + k * (w2 + gap), y: top + gap, w: w2, h } : { x: gap, y: top + 2 * gap + h, w: W - 2 * gap, h };
    };
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
    const { x, y, w: pw, h: ph } = geo(k);
    const node = renderSVG(sim, el, pn.t, {
      panel: true,
      phone,
      W: pw,
      H: ph,
      view: { focus, span },
      status: phone ? '' : pn.status,
      title: phone ? `${pn.title} · ${pn.short || pn.brief}` : narrow && pw > 480 ? `${pn.title} · ${pn.brief}` : pn.title,
      keep: true,
      drop: phone ? pn.dropPhone : null,
    });
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
  upgradePanelsEarth({ sim, el, t: sim.still, node: root.node() }, renderSVG);
  return root.node();
}
