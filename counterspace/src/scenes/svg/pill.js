// ============================================================================
// scenes/svg/pill.js: the one label look (DESIGN.md section 7) for the still diagrams: a pill with a hairline border, a dot of the item's colour, and a leader
// that ends in a small dot on the item. Sizes and the drawing live here so the placer, the probe and the pixels always agree.
// ============================================================================
import { SANS } from '../../fonts.js';

// Spec in px. Touch-size screens get the larger type; nothing is smaller than 12 px.
export const PILL = { fs: 12.5, fsTouch: 13, padX: 9, padY: 4, dot: 7, gap: 6, r: 8, border: 'rgba(150,175,230,.35)', fill: 'rgba(8,13,28,.72)' };
export const INK = '#eef2fb',
  WARM = '#ffc86b',
  LEADER = 'rgba(238,242,251,.55)';

let mctx;
const widths = new Map();
// Width of a text in Plex Sans at weight 600 (measured on a canvas once the faces are loaded; the first draw waits for them).
export function textW(text, fs, weight = 600) {
  const key = weight + '|' + fs + '|' + text;
  let w = widths.get(key);
  if (w == null) {
    try {
      mctx ||= document.createElement('canvas').getContext('2d');
      mctx.font = `${weight} ${fs}px ${SANS}`;
      w = mctx.measureText(text).width;
    } catch (e) {
      w = text.length * fs * 0.56;
    }
    widths.set(key, w);
  }
  return w;
}

// Type size for a diagram: 13 px on touch screens and phone-width pictures, 12.5 px otherwise. A panel of a multi-panel diagram follows its own `phone` flag.
export const labelFs = (W, opts = {}) => {
  let touch = false;
  try {
    touch = matchMedia('(pointer: coarse)').matches;
  } catch (e) {
    /* no media queries: the fine-pointer size */
  }
  return opts.panel ? (opts.phone || touch ? PILL.fsTouch : PILL.fs) : W < 520 || touch ? PILL.fsTouch : PILL.fs;
};
// Box of a label pill. A primary label carries a dot, a secondary one (a place or an orbit name) does not.
export function pillSize(text, { dot = true, fs = PILL.fs } = {}) {
  return { w: Math.ceil(textW(text, fs) + 2 * PILL.padX + (dot ? PILL.dot + PILL.gap : 0)), h: Math.round(fs * 1.2 + 2 * PILL.padY) };
}

// Draws the pill centred on (x, y). color is the item's colour (the dot); warm switches the text to the warm accent (captions that warn or analyse).
export function drawPill(g, { x, y, w, h, text, color, dot = true, warm = false, secondary = false, fs = PILL.fs }) {
  const k = g.append('g');
  if (secondary) k.attr('opacity', 0.85);
  k.append('rect')
    .attr('x', x - w / 2)
    .attr('y', y - h / 2)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', PILL.r)
    .attr('fill', PILL.fill)
    .attr('stroke', PILL.border)
    .attr('stroke-width', 1);
  const x0 = x - w / 2 + PILL.padX;
  if (dot) k.append('circle').attr('cx', x0 + PILL.dot / 2).attr('cy', y).attr('r', PILL.dot / 2).attr('fill', color);
  k.append('text')
    .attr('x', dot ? x0 + PILL.dot + PILL.gap : x0)
    .attr('y', y + fs * 0.35)
    .attr('font-family', SANS)
    .attr('font-size', fs)
    .attr('font-weight', 600)
    .attr('fill', warm ? WARM : INK)
    .text(text);
  return k;
}

// A leader from the item (ax, ay) to the pill edge (qx, qy): a hairline ending in a 3 px dot on the item.
export function drawLeader(g, ax, ay, qx, qy) {
  g.append('line').attr('x1', ax).attr('y1', ay).attr('x2', qx).attr('y2', qy).attr('stroke', LEADER).attr('stroke-width', 1).attr('stroke-linecap', 'round');
  g.append('circle').attr('cx', ax).attr('cy', ay).attr('r', 3).attr('fill', LEADER);
}
