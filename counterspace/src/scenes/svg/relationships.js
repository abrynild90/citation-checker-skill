// Source figures are text; geometric marks explain relationships without reconstructing events.
export const RELATIONSHIP_IDS = ['cosmos1408', 'gnss', 'dn2', 'spaceplanes', 'rpo', 'solwind', 'burnt-frost', 'shakti'];

const INK = '#eef2fb',
  MUTED = '#b5c1d8',
  BLUE = '#91caff',
  GOLD = '#f4cb79',
  RED = '#ff9a91',
  GREEN = '#95e0bc';

export function drawRelationship(d) {
  const { sim, t, W, phone, fs, pad, top, bottom, body, g, text, wrap, line, path, circle, arrow, craft } = d;
  const id = sim.cfg.id,
    y = (f) => top + body * f;
  const footer = (s) => wrap(s, W / 2, bottom - (phone ? 20 : 4), W - pad * 2, MUTED);
  const heading = (s) => text(s, W / 2, top + fs, INK, fs + 1, 600);
  const earth = (x, cy, r) => {
    circle(x, cy, r, '#172c47', BLUE);
    text('Earth', x, cy + r + fs + 7, BLUE);
  };
  const episode = sim.cfg.acts
    ? Math.max(
        0,
        sim.cfg.acts.findIndex((a, i) => t >= a.t0 && (t < a.t1 || i === sim.cfg.acts.length - 1)),
      )
    : 0;

  if (id === 'cosmos1408') {
    const left = W * 0.27,
      right = W * 0.76,
      half = W * 0.45 - pad;
    line(W * 0.52, top + 2, W * 0.52, y(0.9), '#35415b').attr('stroke-width', 2.4);
    wrap('2021: after the collision', left, top + fs, half, INK);
    text('About 470 km', left, y(0.29), GOLD);
    g.append('rect')
      .attr('x', pad)
      .attr('y', y(0.35))
      .attr('width', W * 0.5 - pad * 2)
      .attr('height', body * 0.24)
      .attr('rx', 3)
      .attr('fill', '#302b28');
    for (let i = 0; i < 15; i++) circle(pad + 12 + (W * 0.5 - pad * 2 - 24) * (((i * 7) % 15) / 14), y(0.37 + (i % 4) * 0.055), 2, GOLD);
    line(pad + 6, y(0.52), W * 0.5 - pad - 6, y(0.52), BLUE, '4 3');
    wrap('Debris crossed the ISS’s orbital height', left, y(0.69), half, BLUE);
    text('February 2026', right, top + fs, INK, fs, 600);
    text('5', right, y(0.45), GOLD, phone ? 32 : 48, 600);
    wrap('tracked fragments remained', right, y(0.59), half, INK);
    wrap('More than 1,800 were tracked initially', right, y(0.82), half, MUTED);
    footer('Historical cloud is schematic. Later count: SWF, 2026.');
  } else if (id === 'gnss') {
    const sy = y(0.23),
      ry = y(0.53),
      xs = [W * 0.25, W * 0.75],
      size = Math.min(32, body * 0.18);
    heading('GPS satellites keep working');
    craft(W / 2, sy, size, GOLD);
    for (const x of xs) {
      arrow(W / 2 + (x < W / 2 ? -12 : 12), sy + 12, x, ry - 13, BLUE);
      g.append('rect')
        .attr('x', x - 32)
        .attr('y', ry - 12)
        .attr('width', 64)
        .attr('height', 24)
        .attr('rx', 3)
        .attr('fill', '#121c30')
        .attr('stroke', x === xs[0] ? GREEN : RED);
      text('Receiver', x, ry + 4, INK);
    }
    text('GPS signal', W * 0.27, y(0.39), BLUE);
    text('Received', xs[0], y(0.73), GREEN, fs + 1, 600);
    text('Lost', xs[1], y(0.73), RED, fs + 1, 600);
    text('Ground jammer', W / 2, y(0.92), RED);
    arrow(W * 0.57, y(0.86), xs[1] - 18, ry + 14, RED);
    text('Radio noise', W * 0.51, y(0.72), RED);
    footer('Receiver interference. Map location and zone boundary illustrative.');
  } else if (id === 'dn2') {
    heading('Two accounts of the highest point');
    const x0 = pad + 4,
      x1 = W - pad - 8,
      scale = (v) => x0 + ((x1 - x0) * v) / 39000;
    const rows = [
      [phone ? 0.4 : 0.34, 10000, phone ? 'China' : 'China’s stated height', GOLD, '10,000 km'],
      [phone ? 0.76 : 0.69, 30000, phone ? 'SWF-cited analysis' : 'Analysis cited by SWF', RED, '≥30,000 km'],
    ];
    for (const [f, v, label, color, value] of rows) {
      text(label, x0, y(f) - fs - 8, INK, fs, 500, 'start');
      line(x0, y(f), scale(v), y(f), color);
      circle(x0, y(f), 2, color);
      circle(scale(v), y(f), 4, color);
      if (v === 30000) arrow(scale(v) + 6, y(f), scale(35500), y(f), color, '3 3');
      text(value, phone ? x1 : scale(v), phone ? y(f) - fs - 8 : y(f) + fs + 10, color, fs + 1, 600, phone ? 'end' : 'middle');
    }
    const gx = scale(35786);
    line(gx, y(0.27), gx, y(0.78), BLUE, '3 4');
    if (phone) text('GEO: 35,786 km', gx, y(0.97), BLUE, fs, 500, 'end');
    else { text('GEO', gx, y(0.18), BLUE); text('35,786 km', gx, y(0.92), BLUE); }
    footer('Reported figures, not two flight measurements. No target was hit.');
  } else if (id === 'spaceplanes') {
    if (episode === 1) {
      heading('OTV-7 orbit · February 2024');
      const cx = W * 0.54,
        cy = y(0.52),
        rx = W * 0.35,
        ry = body * 0.23;
      g.append('ellipse').attr('cx', cx).attr('cy', cy).attr('rx', rx).attr('ry', ry).attr('fill', 'none').attr('stroke', BLUE).attr('stroke-width', 1.8);
      earth(W * 0.31, cy, Math.min(W * 0.055, body * 0.13));
      circle(cx - rx, cy, 4, GOLD);
      circle(cx + rx, cy, 4, GOLD);
      text('Lowest: 323 km', W * 0.24, y(0.23), GOLD);
      text('Highest: 38,838 km', W * 0.73, y(0.23), GOLD);
      line(W * 0.24, y(0.23) + 5, cx - rx, cy - 7, GOLD);
      line(W * 0.73, y(0.23) + 5, cx + rx, cy - 7, GOLD);
      text('Tilt: 59.1°', W * 0.7, y(0.88), MUTED);
      footer('SWF-cited tracking. Orbit shape and orientation schematic.');
    } else if (episode === 0) {
      heading('X-37B’s first six missions');
      const cx = W * 0.38,
        cy = y(0.52),
        r = Math.min(W * 0.2, body * 0.25);
      circle(cx, cy, r, 'none', BLUE);
      earth(cx, cy, r * 0.55);
      circle(cx + r, cy, 4, GOLD);
      wrap('Flights in low Earth orbit', W * 0.77, y(0.42), W * 0.32, INK);
      text('224–908 days each', W / 2, y(0.92), GOLD);
      footer('Flight durations are sourced. Geometry is schematic.');
    } else {
      heading('China’s reusable spacecraft');
      const cy = y(0.46),
        size = Math.min(phone ? 32 : 54, body * 0.2);
      craft(W * 0.29, cy, size, GOLD);
      circle(W * 0.73, cy, 5, GOLD);
      text('Spacecraft', W * 0.29, y(0.24), INK);
      text('Released object', W * 0.73, y(0.24), INK);
      line(W * 0.4, cy, W * 0.67, cy, MUTED, '4 4');
      wrap('Repeated approaches to released objects', W / 2, y(0.7), W - pad * 2, INK);
      footer('Hardware and spacing illustrative. Mission purpose not established.');
    }
  } else if (id === 'rpo') {
    const size = Math.min(phone ? 28 : 52, body * 0.18),
      cy = y(0.47);
    if (episode === 0) {
      heading('2025 · China and the US in GEO');
      const xs = [W * 0.13, W * 0.42, W * 0.6, W * 0.87];
      for (const [i, name] of ['USA 271', 'SJ-21', 'SJ-25', 'USA 270'].entries()) {
        craft(xs[i], cy, size, i === 0 || i === 3 ? BLUE : GOLD);
        text(name, xs[i], y(0.26), INK);
      }
      line(xs[1] + size * 0.55, cy, xs[2] - size * 0.55, cy, GOLD, '3 4');
      wrap('SJ-21 and SJ-25 appeared to dock', W / 2, y(0.72), W - pad * 2, GOLD);
      footer('US satellites “flanked” them. Spacing and hardware illustrative.');
    } else if (episode === 1) {
      heading('2019–20 · Russia in low Earth orbit');
      const xs = [W * 0.17, W * 0.5, W * 0.83];
      for (const [i, name] of ['Cosmos 2542', 'Cosmos 2543', 'USA 245'].entries()) {
        craft(xs[i], cy, size, i === 2 ? BLUE : RED);
        text(name, xs[i], y(0.27), INK);
      }
      arrow(xs[0] + size * 0.55, cy, xs[1] - size * 0.55, cy, RED);
      text('Released', W * 0.335, y(0.7), RED);
      line(xs[1] + size * 0.55, cy, xs[2] - size * 0.55, cy, MUTED, '3 4');
      text('Worked nearby', W * 0.69, y(0.7), INK);
      footer('Spacing illustrative. A close approach does not establish hostile intent.');
    } else {
      heading('2025 · The US and the UK in GEO');
      craft(W * 0.29, cy, size, BLUE);
      craft(W * 0.71, cy, size, MUTED);
      text('USA 271', W * 0.29, y(0.25), BLUE);
      text('SKYNET 5A', W * 0.71, y(0.25), INK);
      line(W * 0.29 + size * 0.6, cy, W * 0.71 - size * 0.6, cy, MUTED, '4 4');
      wrap('A jointly announced close approach', W / 2, y(0.73), W - pad * 2, INK);
      footer('Spacing and hardware illustrative. A close approach is not an attack.');
    }
  } else {
    const [alt, count] = id === 'solwind' ? [530, 285] : id === 'burnt-frost' ? [220, 175] : [300, 130];
    const gap = phone ? 12 : 30,
      width = (W - pad * 2 - gap * 2) / 3;
    const xs = [0, 1, 2].map((i) => pad + width * 0.5 + i * (width + gap));
    for (let i = 0; i < 2; i++) line((xs[i] + xs[i + 1]) / 2, y(0.14), (xs[i] + xs[i + 1]) / 2, y(0.9), '#35415b').attr('stroke-width', 2.4);
    for (const [i, title] of ['Collision', 'Spread', 'Later'].entries()) text(title, xs[i], top + fs, INK, fs + 1, 600);
    const cy = y(0.39),
      size = Math.min(phone ? 28 : 52, body * 0.18);
    craft(xs[0], cy, size, GOLD);
    arrow(xs[0] - width * 0.3, cy + 25, xs[0] - 4, cy + 7, RED);
    wrap(`About ${alt} km`, xs[0], y(0.65), width, GOLD);
    for (let i = 0; i < 9; i++) circle(xs[1] + (((i * 5) % 9) - 4) * width * 0.07, cy + ((i % 3) - 1) * 11, i % 2 ? 2 : 3, GOLD);
    wrap(`${count} tracked fragments`, xs[1], y(0.65), width, GOLD);
    text('0', xs[2], cy + 10, BLUE, phone ? 28 : 42, 600);
    wrap('remain in SWF’s table', xs[2], y(0.65), width, BLUE);
    footer(
      id === 'burnt-frost'
        ? 'All fell out of orbit in about 20 months. Symbols illustrative.'
        : 'Sequence compresses time. Symbols are illustrative, not fragment counts.',
    );
  }
}
