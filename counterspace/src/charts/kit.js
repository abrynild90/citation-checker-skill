// ============================================================================
// charts/kit.js: drawing parts shared by the jamming, close-approach and capability charts (track C2).
// Provides: shape paths, glyph() (a mark with its separating outline and hover ring), paint styles, wrapLines(), key markup and the zoom note
// that keep these charts alike.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { EXPORTING } from '../app.js';

// ---------------------------------------------------------------- text measures
// Greedy word wrap with any measuring function.
export function wrapLines(text, maxW, measure) {
  const lines = [];
  let cur = '';
  text.split(' ').forEach((w) => {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && measure(t) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- shapes (SVG path data)
const f = (n) => Math.round(n * 100) / 100;
export const circlePath = (cx, cy, r) => `M${f(cx - r)},${f(cy)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
export function roundRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)},${f(y)}H${f(x + w - r)}a${r},${r} 0 0 1 ${r},${r}V${f(y + h - r)}a${r},${r} 0 0 1 ${-r},${r}H${f(x + r)}a${r},${r} 0 0 1 ${-r},${-r}V${f(y + r)}a${r},${r} 0 0 1 ${r},${-r}Z`;
}
// A bar with round ends. With `tip`, the right end becomes an arrow (a campaign that is still going).
export function barPath(x0, x1, cy, h, tip = 0) {
  const r = h / 2;
  if (!tip) return roundRectPath(x0, cy - r, Math.max(h, x1 - x0), h, r);
  const xr = Math.max(x0 + h, x1);
  return `M${f(x0 + r)},${f(cy - r)}H${f(xr)}L${f(xr + tip)},${f(cy)}L${f(xr)},${f(cy + r)}H${f(x0 + r)}a${r},${r} 0 0 1 0,${-h}Z`;
}
export const diamondPath = (cx, cy, r) => `M${f(cx)},${f(cy - r)}L${f(cx + r)},${f(cy)}L${f(cx)},${f(cy + r)}L${f(cx - r)},${f(cy)}Z`;
export const trianglePath = (cx, cy, r) => `M${f(cx)},${f(cy - r)}L${f(cx + r * 0.95)},${f(cy + r * 0.72)}L${f(cx - r * 0.95)},${f(cy + r * 0.72)}Z`;
export const arrowPath = (x, cy, len, half) => `M${f(x)},${f(cy - half)}L${f(x + len)},${f(cy)}L${f(x)},${f(cy + half)}Z`;

// ---------------------------------------------------------------- marks
// Three ways to fill a mark; the key draws the same three.
//   solid: stated plainly or confirmed. outline: hedged, or reported by researchers. dashed: unclear, or alleged.
export function paint(sel, color, style, hollow = 'var(--bg)') {
  sel.style('fill', style === 'solid' ? color : hollow).style('stroke', color);
  sel.style('stroke-width', style === 'solid' ? 1.5 : 2);
  if (style === 'dashed') sel.style('stroke-dasharray', '4 3');
  return sel;
}
// One mark: a soft ring (shown on hover and focus), a separating outline in the page colour and the painted shape on top.
// Classes: .glyph (scaled on hover for points), .ring, .halo, .body. The ring is left out of downloads.
export function glyph(parent, d, color, style, cls = '', hollow = 'var(--bg)') {
  const g = parent.append('g').attr('class', `glyph ${cls}`.trim());
  if (!EXPORTING) g.append('path').attr('class', 'ring').attr('d', d).attr('stroke-linejoin', 'round').style('stroke', color);
  g.append('path').attr('class', 'halo').attr('d', d).attr('stroke-linejoin', 'round');
  paint(g.append('path').attr('class', 'body').attr('d', d).attr('stroke-linejoin', 'round'), color, style, hollow);
  return g;
}

// ---------------------------------------------------------------- keys (the list under each chart)
// groups: [{ head, items: [[svg inner, text, glyph width], ...] }]. Swatches are centred on 0,0 and drawn with the same paint as the marks.
export function keyMarkup(groups) {
  return groups
    .map(
      (g) =>
        `<li class="kgroup"><span class="khead">${g.head}</span>${g.items
          .map(
            ([inner, text, w = 22]) =>
              `<span class="kitem"><svg width="${w}" height="18" viewBox="${-w / 2} -9 ${w} 18" aria-hidden="true">${inner}</svg><span>${text}</span></span>`,
          )
          .join('')}</li>`,
    )
    .join('');
}
// Swatch shapes for keys (neutral ink, same geometry and paint as the marks).
export const INK = 'var(--text)';
export const swatch = {
  solid: (shape) => shape.replace('{p}', `style="fill:${INK};stroke:${INK};stroke-width:1.5"`),
  outline: (shape) => shape.replace('{p}', `style="fill:var(--bg);stroke:${INK};stroke-width:2"`),
  dashed: (shape) => shape.replace('{p}', `style="fill:var(--bg);stroke:${INK};stroke-width:2;stroke-dasharray:4 3"`),
};
export const bar = (x0 = -11, x1 = 11, h = 12, tip = 0) => `<path d="${barPath(x0, x1, 0, h, tip)}" {p}/>`;
export const dot = (r = 6) => `<path d="${circlePath(0, 0, r)}" {p}/>`;

// ---------------------------------------------------------------- notes
// "Zoomed" flag shown above a chart whose axis is not the shared one.
export const zoomNote = (years, isDefault) =>
  `<span class="zbadge">Zoomed</span> ${years}${isDefault ? ' (the default on phones)' : ''}. This view no longer lines up with the law timeline or the other charts. ` +
  'Choose “Full span” to go back to the shared years.';
