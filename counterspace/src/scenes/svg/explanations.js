// Explanatory stills use diagrams where a photographic globe obscures the relationship.
// Geometry is schematic. No positions, trajectories, hardware or symbol counts are asserted.
import { SANS } from '../../fonts.js';
import { drawCraft } from './craft.js';
import { fontFaceCSS, rememberSim } from './still-frame.js';
import { textW } from './pill.js';
import { drawRelationship, RELATIONSHIP_IDS } from './relationships.js';

const INK = '#eef2fb',
  MUTED = '#b5c1d8',
  BLUE = '#91caff',
  GOLD = '#f4cb79',
  RED = '#ff9a91',
  PURPLE = '#cfb7ff';
const IDS = new Set(['sj21-tug', 'starfish', 'viasat', 'laser', ...RELATIONSHIP_IDS]);

export function renderExplanation(sim, el, opts = {}) {
  if (!IDS.has(sim.cfg.id) || opts.panel) return null;
  const W = opts.W || el.clientWidth || 640,
    H = opts.H || el.clientHeight || 420;
  const phone = W < 520,
    fs = phone ? 12 : 14,
    pad = phone ? 16 : 28;
  const banner = el.querySelector(':scope > .illus');
  const top = opts.print ? 18 : Math.max(phone ? 62 : 54, (banner?.offsetHeight || 24) + 24);
  const bottom = H - 16,
    body = bottom - top - (phone ? 42 : 0);
  const episode = Math.max(0, sim.cfg.acts?.findIndex((a, i) => (opts.t ?? sim.still) >= a.t0 && ((opts.t ?? sim.still) < a.t1 || i === sim.cfg.acts.length - 1)) ?? 0);
  const alt = sim.cfg.explanationAlts?.[episode] || sim.cfg.explanationAlt;
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', alt).style('background', '#070b16');
  svg.append('title').text(sim.cfg.title);
  svg.append('desc').text(alt);
  const defs = svg.append('defs');
  if (opts.print) defs.append('style').text(fontFaceCSS());
  svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#070b16');
  const g = svg.append('g').attr('font-family', SANS).attr('font-size', fs);
  const labels = [],
    marks = [];
  const line = (x1, y1, x2, y2, color = MUTED, dash = '') =>
    g.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).attr('stroke', color).attr('stroke-width', 1.4).attr('stroke-dasharray', dash);
  const path = (d, color = MUTED, width = 1.4, fill = 'none') =>
    g.append('path').attr('d', d).attr('fill', fill).attr('stroke', color).attr('stroke-width', width);
  const circle = (x, y, r, fill, stroke = fill) => g.append('circle').attr('cx', x).attr('cy', y).attr('r', r).attr('fill', fill).attr('stroke', stroke);
  const text = (str, x, y, color = INK, size = fs, weight = 500, anchor = 'middle') => {
    const n = g
      .append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', anchor)
      .attr('fill', color)
      .attr('font-size', size)
      .attr('font-weight', weight)
      .style('font-family', SANS)
      .text(str);
    // Measured text boxes form the collision probe; these are diagram labels, not estimated widths.
    const w = textW(str, size, weight),
      x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    labels.push({
      text: str,
      x0,
      y0: y - size,
      x1: x0 + w,
      y1: y + 3,
      leader: null,
      ref: [x, y],
      mk: -1,
      pc: 0,
    });
    return n;
  };
  const wrap = (str, x, y, maxW, color = MUTED, size = fs) => {
    const rows = [];
    let row = '';
    for (const word of str.split(' ')) {
      const next = row ? row + ' ' + word : word;
      if (row && textW(next, size, 500) > maxW) {
        rows.push(row);
        row = word;
      } else row = next;
    }
    if (row) rows.push(row);
    rows.forEach((r, i) => text(r, x, y + i * (size + 4), color, size));
    return rows.length * (size + 4);
  };
  const arrow = (x1, y1, x2, y2, color = MUTED, dash = '') => {
    line(x1, y1, x2, y2, color, dash);
    const a = Math.atan2(y2 - y1, x2 - x1),
      r = 5;
    path(`M${x2 - r * Math.cos(a - 0.55)},${y2 - r * Math.sin(a - 0.55)}L${x2},${y2}L${x2 - r * Math.cos(a + 0.55)},${y2 - r * Math.sin(a + 0.55)}`, color);
  };
  const craft = (x, y, size, color) => {
    drawCraft(g, 'sat', x, y, size, color);
    marks.push({ x, y, r: size * 0.58, n: 'spacecraft' });
  };
  const box = (str, x, y, w, color = BLUE) => {
    const h = fs + (phone ? 14 : 18);
    g.append('rect')
      .attr('x', x - w / 2)
      .attr('y', y - h / 2)
      .attr('width', w)
      .attr('height', h)
      .attr('rx', 4)
      .attr('fill', '#121c30')
      .attr('stroke', color)
      .attr('stroke-width', 1.2);
    text(str, x, y + fs * 0.35, color);
    return h;
  };

  if (RELATIONSHIP_IDS.includes(sim.cfg.id)) {
    drawRelationship({
      sim,
      t: opts.t ?? sim.still,
      W,
      H,
      phone,
      fs,
      pad,
      top,
      bottom,
      body,
      g,
      text,
      wrap,
      line,
      path,
      circle,
      arrow,
      craft,
    });
  } else if (sim.cfg.id === 'sj21-tug') {
    const gap = phone ? 20 : 42,
      pw = (W - 2 * pad - gap) / 2;
    const yGEO = top + body * 0.68,
      yRaised = top + body * 0.36;
    const size = Math.min(phone ? 35 : 66, pw * 0.25, body * 0.18);
    for (const [i, heading] of ['Before', 'After towing'].entries()) {
      const x = pad + pw * 0.5 + i * (pw + gap);
      text(heading, x, top + fs, INK, fs + 2, 600);
      line(x - pw * 0.45, yGEO, x + pw * 0.45, yGEO, GOLD);
      text('Working GEO belt', x, yGEO + fs + 12, GOLD, fs);
      if (!i) {
        craft(x, yGEO - size * 0.55, size, MUTED);
        text('Compass G2', x, yGEO - size * 1.25 - 12, INK);
      } else {
        const sx = x - pw * 0.23,
          cx = x + pw * 0.23;
        line(x - pw * 0.45, yRaised + size * 0.52, x + pw * 0.45, yRaised + size * 0.52, MUTED, '4 4');
        craft(sx, yRaised, size, GOLD);
        craft(cx, yRaised, size, MUTED);
        text('SJ-21', sx, yRaised - size * 0.62 - 7, GOLD);
        text('Compass G2', cx, yRaised + size * 0.62 + fs + 8, INK);
        arrow(x, yGEO - 6, x, yRaised + size + 20, BLUE, '3 4');
      }
    }
    wrap('Docking method unknown. Heights and spacing are schematic.', W / 2, bottom - (phone ? 20 : 4), W - 2 * pad, MUTED, fs);
  } else if (sim.cfg.id === 'starfish') {
    const cx = W * 0.39,
      cy = top + body * 0.42;
    const r = Math.min(W * 0.14, body * 0.18),
      outer = r * 2.05;
    // A dipole cross-section makes the field paths legible without implying a reconstructed belt boundary.
    for (const side of [-1, 1])
      for (const k of [1.45, 1.85]) {
        const d = `M${cx},${cy - r * 0.9}C${cx + side * r * k * 1.75},${cy - r * k},${cx + side * r * k * 1.75},${cy + r * k},${cx},${cy + r * 0.9}`;
        const p = path(d, PURPLE, phone ? 1.5 : 2);
        const node = p.node();
        for (const frac of [0.22, 0.42, 0.62, 0.78]) {
          const q = node.getPointAtLength(node.getTotalLength() * frac);
          circle(q.x, q.y, phone ? 2.3 : 3, PURPLE);
        }
      }
    circle(cx, cy, r, '#172c47', BLUE);
    text('Earth', cx, cy + fs * 0.35, INK);
    const bx = cx + r * 1.25,
      by = cy + r * 0.56;
    circle(bx, by, 5, GOLD);
    circle(bx, by, 10, 'none', GOLD);
    text('Blast', bx, by + fs + 18, GOLD);
    text('Magnetic field', W / 2, top + fs, PURPLE, fs + 1, 600);
    const xText = W - pad - Math.min(phone ? 61 : 102, W * 0.17);
    wrap('Electrons follow field lines', xText, cy - r * 0.55, Math.min(phone ? 116 : 190, W * 0.3), PURPLE);
    wrap('They also spread around Earth', W / 2, cy + outer + fs + 4, W - 2 * pad, INK);
    wrap('Schematic cross-section; shape and extent illustrative.', W / 2, bottom - (phone ? 20 : 4), W - 2 * pad, MUTED);
  } else if (sim.cfg.id === 'viasat') {
    const satY = top + Math.min(36, body * 0.12),
      networkY = top + body * 0.5,
      modemY = top + body * 0.75;
    const satSize = phone ? 38 : 58;
    craft(W * 0.24, satY, satSize, GOLD);
    text('KA-SAT: still working', W * 0.62, satY + fs * 0.35, GOLD, fs + 1, 600);
    line(pad, top + body * 0.23, W - pad, top + body * 0.23, '#35415b', '3 4');
    box('AcidRain commands', W / 2, top + body * 0.3, Math.min(230, W - 2 * pad), RED);
    const bh = box('Ground management network', W / 2, networkY, Math.min(290, W - 2 * pad), BLUE);
    arrow(W / 2, top + body * 0.3 + bh / 2 + 3, W / 2, networkY - bh / 2 - 3, RED);
    for (const x of [W * 0.23, W * 0.5, W * 0.77]) {
      arrow(W / 2, networkY + bh / 2 + 4, x, modemY - 15, RED);
      g.append('rect')
        .attr('x', x - 18)
        .attr('y', modemY - 10)
        .attr('width', 36)
        .attr('height', 20)
        .attr('rx', 3)
        .attr('fill', '#301c28')
        .attr('stroke', RED);
      path(`M${x - 5},${modemY - 5}L${x + 5},${modemY + 5}M${x + 5},${modemY - 5}L${x - 5},${modemY + 5}`, RED, 1.8);
    }
    text('Modems wiped · service lost', W / 2, modemY + 28, RED, fs + 1, 600);
    wrap('Symbols show roles, not locations or numbers of devices.', W / 2, bottom - (phone ? 20 : 4), W - 2 * pad, MUTED);
  } else {
    const stationX = W * 0.2,
      stationY = top + body * 0.71,
      satX = W * 0.77,
      satY = top + body * 0.23;
    const size = Math.min(phone ? 44 : 70, body * 0.25);
    path(
      `M${pad},${stationY + 12}Q${W * 0.5},${stationY - body * 0.07} ${W - pad},${stationY + 36}L${W - pad},${bottom - 40}L${pad},${bottom - 40}Z`,
      '#405d7e',
      1.2,
      '#14243b',
    );
    circle(stationX, stationY, 5, BLUE);
    craft(satX, satY, size, GOLD);
    text('MSTI-3', satX, satY - size * 0.65 - 6, GOLD, fs + 1, 600);
    arrow(stationX + 4, stationY - 4, satX - size * 0.22, satY + size * 0.2, '#f0a5de');
    wrap('Beam drawn for illustration', W * 0.3, top + body * 0.3, W * 0.34, '#f0a5de');
    text('White Sands', stationX, stationY + fs + 24, BLUE);
    text('Earth’s horizon', W * 0.72, stationY + fs + 28, MUTED);
    wrap('Detailed test results are not public. Geometry is schematic.', W / 2, bottom - (phone ? 20 : 4), W - 2 * pad, MUTED);
  }

  svg.node().__lay = {
    W,
    H,
    labels,
    marks,
    rings: [],
    obst: [],
    reserved: [],
    probe: {
      disc: { cx: -1000, cy: -1000, r: 0 },
      circles: [],
      pts: marks.map((m, i) => ({ ...m, i })),
      rings: [],
      minFont: fs,
      polys: [],
      crafts: null,
      orbitPts: null,
      cloud: null,
      domes: [],
    },
  };
  svg.node().dataset.explanation = sim.cfg.id;
  svg.node().dataset.time = String(opts.t ?? sim.still);
  if (sim.cfg.explanationByStep) svg.node().dataset.episode = String(episode);
  rememberSim(svg.node(), sim);
  el.querySelector(':scope > svg')?.remove();
  el.prepend(svg.node());
  return svg.node();
}
