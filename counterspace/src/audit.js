// ============================================================================
// audit.js: overlapping or clipped text in every chart SVG, static scene diagrams and live scene labels (bounding-box tests).
// Provides: audit(). Each finding is { chart, kind: overlap | clip | text-on-mark | sticky-clip, a, b?, w?, h? }; [] means clean.
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { hooks } from './shared.js';
const CHART_SVGS = '#legalSvg svg, #legalZoom svg, #svgA svg, #svgB svg, #svgC svg, #svgL svg';
const SCENE_SVGS = '#sceneView > svg, #heroStage > svg';
const boxOf = (r) => ({ x0: r.left, x1: r.right, y0: r.top, y1: r.bottom });
const overlapOf = (a, b) => ({ w: Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h: Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) });
const shown = (t) =>
  t.textContent.trim() &&
  t.getClientRects().length &&
  getComputedStyle(t).display !== 'none' &&
  !t.closest('.lbls-hidden, [display="none"]');
function svgTexts(svg) {
  return [...svg.querySelectorAll('text')]
    .filter(shown)
    .map((t) => ({ s: t.textContent.trim().slice(0, 28), own: t.closest('.mark'), ...boxOf(t.getBoundingClientRect()) }));
}
function pairOverlaps(items, chart) {
  const out = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const { w, h } = overlapOf(items[i], items[j]);
      if (w > 1.5 && h > 3) out.push({ chart, kind: 'overlap', a: items[i].s, b: items[j].s, w: Math.round(w), h: Math.round(h) });
    }
  return out;
}
function textClips(ts, sr, chart) {
  return ts
    .filter((a) => a.x0 < sr.left - 0.5 || a.x1 > sr.right + 0.5 || a.y0 < sr.top - 0.5 || a.y1 > sr.bottom + 0.5)
    .map((a) => ({ chart, kind: 'clip', a: a.s }));
}
function textOnMarks(svg, ts, chart) {
  const shapes = [...svg.querySelectorAll('.mark circle:not(.hit), .mark path, .mark rect:not(.hit), .mark polygon')]
    .map((n) => ({ n, r: n.getBoundingClientRect(), m: n.closest('.mark') }))
    .filter((o) => o.r.width > 0 && !o.n.closest('.badge3d'));
  const out = [];
  ts.forEach((t) =>
    shapes.forEach((o) => {
      if (o.m && o.m === t.own) return;
      const { w, h } = overlapOf(t, boxOf(o.r));
      if (w > 2 && h > 3.5) out.push({ chart, kind: 'text-on-mark', a: t.s, b: o.m?.dataset?.id, w: Math.round(w), h: Math.round(h) });
    }),
  );
  return out;
}
function auditSvg(svg, chart) {
  const ts = svgTexts(svg);
  return [...textOnMarks(svg, ts, chart), ...textClips(ts, svg.getBoundingClientRect(), chart), ...pairOverlaps(ts, chart)];
}
export function audit() {
  hooks.drawRest();
  const out = [];
  document.querySelectorAll(CHART_SVGS).forEach((svg) => out.push(...auditSvg(svg, svg.parentElement.id)));
  document.querySelectorAll(SCENE_SVGS).forEach((svg) => {
    if (svg.getClientRects().length) out.push(...auditSvg(svg, 'scene-svg:' + (svg.parentElement.id || 'view')));
  });
  return out.concat(auditHtml(), auditSticky());
}
// Sticky legal band: while it is stuck (compact), no text below it may straddle its lower edge (that reads as clipped text). Checks every
// text node in <main> (HTML and SVG) against the band's bottom edge; only meaningful at the current scroll position.
function auditSticky() {
  const band = document.getElementById('legalBand');
  if (!band || !band.classList.contains('compact')) return [];
  const edge = band.getBoundingClientRect().bottom,
    out = [],
    root = document.querySelector('main') || document.body,
    rg = document.createRange();
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement,
      s = n.nodeValue.trim();
    if (
      !s ||
      !el ||
      band.contains(el) ||
      el.closest('.card, .overlay, [hidden], script, style, details:not([open]) > :not(summary)') ||
      getComputedStyle(el).visibility === 'hidden'
    )
      continue;
    rg.selectNodeContents(n);
    for (const r of rg.getClientRects())
      if (r.width > 0 && r.top < edge - 1 && r.bottom > edge + 1) {
        out.push({ chart: 'sticky-band', kind: 'sticky-clip', a: s.slice(0, 28), h: Math.round(Math.min(r.bottom, edge + 99) - r.top) });
        break;
      }
  }
  return out;
}
// Overlap tests for HTML boxes: live scene labels (.hlabel, only those on screen) and legend items. Same record shape as the SVG checks.
function auditHtml() {
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
  };
  const labels = [...document.querySelectorAll('.hlabel')].filter(
    (e) => vis(e) && e.textContent.trim() && e.closest('.stage, .view') && e.closest('.overlay:not(.open)') === null,
  );
  const item = (e) => ({ s: e.textContent.trim().slice(0, 28), ...boxOf(e.getBoundingClientRect()) });
  const out = pairOverlaps(labels.map(item), 'scene-labels');
  labels.forEach((e) => {
    const box = e.closest('.stage, .view').getBoundingClientRect();
    out.push(...textClips([item(e)], box, 'scene-labels'));
  });
  document
    .querySelectorAll('ul.legend')
    .forEach((u) =>
      out.push(...pairOverlaps([...u.children].filter((li) => vis(li) && !li.classList.contains('lsep')).map(item), 'legend:' + u.id)),
    );
  return out;
}
