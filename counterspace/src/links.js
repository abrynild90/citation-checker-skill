// ============================================================================
// links.js: the real links between a weapon and the first later law (data/lag_pairs.json). Pointing at either end rings both and draws a dashed line with the
// time between them. Provides: gap(), yearsBetween(), pairsAt(), showLinks(), hideLinks(), linkedRects(). Imports only app.js, so every chart module may use it.
// ============================================================================
import { D, byId, parse } from './app.js';

// The elapsed time as a number and a unit: months under a year, years with one decimal after that.
export function gap(years) {
  if (years < 1) {
    const n = Math.round(years * 12);
    return { num: String(n), unit: n === 1 ? 'month' : 'months' };
  }
  return { num: years.toFixed(1), unit: 'years' };
}
export const yearsBetween = (a, b) => (b - a) / (365.25 * 864e5);

// The pairs that a weapon or a law belongs to, each with the time between its two dates ("kind" says which end `id` is).
export function pairsAt(id) {
  return D.lag_pairs.pairs
    .filter((p) => p.event === id || p.law === id)
    .map((p) => {
      const ev = byId[p.event],
        law = byId[p.law],
        years = yearsBetween(parse(ev.date || ev.start), parse(law.start));
      return { event: p.event, law: p.law, years, g: gap(years), kind: p.event === id ? 'weapon' : 'law' };
    });
}
export const linkText = (g) => `${g.num} ${g.unit} later`;

const NS = 'http://www.w3.org/2000/svg';
const WEAPON_AREAS = '#svgA, #svgC, #svgR',
  LAW_AREAS = '#legalSvg, #legalZoom';
let layer = null;
const mk = (name, attrs, parent) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
};
// The drawn shape of a mark (its invisible hit area left out), in page coordinates; null when it is not on screen.
function shapeRect(node) {
  const parts = [...node.querySelectorAll(':scope > :not(.hit):not(text)')].map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  const rs = parts.length ? parts : [node.getBoundingClientRect()];
  const l = Math.min(...rs.map((r) => r.left)),
    t = Math.min(...rs.map((r) => r.top)),
    r = Math.max(...rs.map((r) => r.right)),
    b = Math.max(...rs.map((r) => r.bottom));
  if (r - l < 1 || b - t < 1 || b < 0 || t > innerHeight || r < 0 || l > innerWidth) return null;
  return { left: l, top: t, right: r, bottom: b, cx: (l + r) / 2, cy: (t + b) / 2, rad: Math.max(r - l, b - t) / 2 };
}
// The first copy of a mark that is on screen (the law strip also has a zoom panel; the charts may be redrawn)
const find = (areas, id) => {
  for (const n of document.querySelectorAll(areas.split(',').map((a) => `${a.trim()} .mark[data-id="${id}"]`).join(','))) {
    if (n.closest('.off, [data-off]')) continue;
    const r = shapeRect(n);
    if (r) return { node: n, r };
  }
  return null;
};
// Where the other end of each of this mark's pairs is on screen.
function ends(el) {
  const id = el?.dataset?.id;
  if (!id) return [];
  const self = shapeRect(el);
  if (!self) return [];
  return pairsAt(id)
    .map((p) => ({ p, self, other: find(p.kind === 'weapon' ? LAW_AREAS : WEAPON_AREAS, p.kind === 'weapon' ? p.law : p.event) }))
    .filter((e) => e.other);
}
export function showLinks(el) {
  hideLinks();
  const list = ends(el);
  if (!list.length) return;
  layer = mk('svg', { class: 'link-layer', 'aria-hidden': 'true', focusable: 'false' }, document.body);
  const ring = (r) => mk('circle', { cx: r.cx, cy: r.cy, r: Math.max(9, r.rad + 5), class: 'lk-ring' }, layer);
  const self = list[0].self;
  list.forEach(({ p, other }) => {
    const a = self,
      b = other.r,
      d = Math.hypot(b.cx - a.cx, b.cy - a.cy) || 1,
      ux = (b.cx - a.cx) / d,
      uy = (b.cy - a.cy) / d,
      ra = Math.max(9, a.rad + 5),
      rb = Math.max(9, b.rad + 5);
    if (d > ra + rb + 6) mk('line', { x1: a.cx + ux * ra, y1: a.cy + uy * ra, x2: b.cx - ux * rb, y2: b.cy - uy * rb, class: 'lk-line' }, layer);
    ring(b.cx === a.cx && b.cy === a.cy ? a : b);
    const t = mk('text', { x: (a.cx + b.cx) / 2, y: (a.cy + b.cy) / 2, class: 'lk-tag', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, layer);
    t.textContent = linkText(p.g);
    const w = t.getComputedTextLength() + 16;
    const bg = mk('rect', { x: (a.cx + b.cx) / 2 - w / 2, y: (a.cy + b.cy) / 2 - 11, width: w, height: 22, rx: 11, class: 'lk-pill' }, layer);
    layer.insertBefore(bg, t);
  });
  ring(self);
}
export function hideLinks() {
  layer?.remove();
  layer = null;
}
addEventListener('scroll', hideLinks, { passive: true });
addEventListener('blur', hideLinks);
// What a card must keep clear of: the marks at the other end of the pairs of `el`, the dashed lines (sampled every 20 px) and each time tag.
export function linkedRects(el) {
  const box = (cx, cy, hw, hh) => ({ left: cx - hw, right: cx + hw, top: cy - hh, bottom: cy + hh });
  return ends(el).flatMap(({ self: a, other }) => {
    const b = other.r,
      d = Math.hypot(b.cx - a.cx, b.cy - a.cy),
      n = Math.max(1, Math.round(d / 20));
    return [
      box(b.cx, b.cy, b.rad + 5, b.rad + 5),
      box((a.cx + b.cx) / 2, (a.cy + b.cy) / 2, 56, 12),
      ...Array.from({ length: n + 1 }, (_, i) => box(a.cx + ((b.cx - a.cx) * i) / n, a.cy + ((b.cy - a.cy) * i) / n, 4, 4)),
    ];
  });
}
