// ============================================================================
// scenes/svg/hero.js: the first picture of the page: the lit Earth with its three orbit shells (low, medium and geostationary) seen as thin ellipses, the
// stage-shaped view, and the plain-language labels. The ordinary diagram passes draw everything else (satellites, labels, stars).
// ============================================================================
import { DEG, ll } from '../core.js';
import { pillSize } from './pill.js';

// Wording of the hero's labels (the scene data keeps the short technical names).
export const HERO_SAY = { 'ISS (illustrative orbit)': 'International Space Station', ISS: 'ISS' };
const SHELL_SAY = { LEO: ['Low Earth orbit, up to 2,000 km', 'LEO'], MEO: ['Medium Earth orbit, GPS', 'MEO'], GEO: ['Geostationary orbit, 35,786 km', 'GEO'] };
const shellKey = (it) => (/^(LEO|Low)/.test(it.label) ? 'LEO' : /^(MEO|Medium)/.test(it.label) ? 'MEO' : 'GEO');
// Where each shell's label likes to sit: the direction on screen, from the planet, of the point on the shell the leader points at.
const SHELL_DIR = { LEO: [-0.8, 0.6], MEO: [0.78, 0.62], GEO: [0.95, -0.3] };

// The moment drawn: one at which the ISS stands in clear sky off the planet's upper right, where its marker and its name are easy to find.
// `unit` projects a scene point onto the unit globe (x right, y down).
export function heroTime(sim, unit, t) {
  const iss = sim.items.find((i) => i.kind === 'point' && i.iss);
  if (!iss) return t;
  let best = t,
    bestD = 1e9;
  for (let k = 0; k <= 400; k++) {
    const tt = k / 400,
      p = iss.pos(tt);
    if (!p) continue;
    const u = unit(p);
    if (u.hidden) continue;
    const d = Math.hypot(u.x - 0.95, u.y + 0.8);
    if (d < bestD) {
      bestD = d;
      best = tt;
    }
  }
  return best;
}

// The view: the equator is seen from higher up the more square the stage is, so the three rings fill its height as well as its width.
export function heroView(W, H) {
  const lat = Math.max(24, Math.min(52, Math.asin(Math.min(0.95, (H / W) * 0.98)) / DEG));
  return { lat, lon: globalThis.__heroLon ?? 35 };
}

// Equatorial ring of a shell, as screen points with their depth (z toward the viewer); the part behind the planet is cut by the disc, the far side beyond
// its limb is drawn dimmer than the near side.
function ringPoints(S, r) {
  const { project } = S,
    out = [];
  for (let k = 0; k <= 240; k++) out.push(project(ll(0, (k / 240) * 360, r)));
  return out;
}

// Draws each shell as a thin ellipse (near side bright, far side dim), records it as a drawn referent and queues its label.
export function drawHeroShells(S, fTop, stY) {
  const { svg, shells, cands, dPolys, W, NARROW, fs, CX, CY } = S;
  const line = d3.line().curve(d3.curveCatmullRom.alpha(0.5)),
    drawSeg = (s, far, color) =>
      s.length > 1 &&
      svg
        .append('path')
        .attr('d', line(s.map((q) => [q.x, q.y])))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-opacity', far ? 0.34 : 0.9)
        .attr('stroke-width', far ? 1.1 : 1.4)
        .attr('stroke-linecap', 'round');
  shells.forEach((it) => {
    const key = shellKey(it),
      pts = ringPoints(S, it.r);
    // each visible run (between the points hidden behind the planet) is recorded whole and drawn in pieces by depth
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        dPolys.push({ p: run.map((q) => [q.x, q.y]), role: 'line' });
        let seg = [run[0]],
          far = run[0].z < 0;
        for (let i = 1; i < run.length; i++) {
          const f = run[i].z < 0;
          if (f !== far) {
            drawSeg(seg, far, it.color);
            seg = [seg.at(-1)];
            far = f;
          }
          seg.push(run[i]);
        }
        drawSeg(seg, far, it.color);
      }
      run = [];
    };
    pts.forEach((p) => (p.hidden ? flush() : run.push(p)));
    flush();
    // label: on the near side, at the point of the ring that lies most toward the label's preferred direction
    const [dx, dy] = SHELL_DIR[key],
      cand = pts.filter((p) => !p.hidden && p.z > 0 && p.x > 30 && p.x < W - 30 && p.y > fTop && p.y < stY - 30);
    let best = null,
      bestScore = -1e9;
    for (const p of cand) {
      const vx = p.x - CX,
        vy = p.y - CY,
        l = Math.hypot(vx, vy) || 1,
        sc = (vx * dx + vy * dy) / l;
      if (sc > bestScore) {
        bestScore = sc;
        best = p;
      }
    }
    if (!best) return;
    const text = NARROW ? SHELL_SAY[key][1] : SHELL_SAY[key][0],
      { w, h } = pillSize(text, { dot: false, fs }),
      l = Math.hypot(best.x - CX, best.y - CY) || 1,
      ux = (best.x - CX) / l,
      uy = (best.y - CY) / l,
      o = (w / 2) * Math.abs(ux) + (h / 2) * Math.abs(uy) + 10;
    cands.push({ x: best.x + ux * o, y: best.y + uy * o, px: best.x, py: best.y, w, h, fs, dot: false, fixed: true, text, color: it.color });
  });
}
