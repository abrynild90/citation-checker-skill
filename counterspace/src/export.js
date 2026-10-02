// ============================================================================
// export.js: SVG export (fresh 1200 px desktop render, titled, with as-of line and source footer) and file download.
// Provides: exportSVG(), download().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { drawA } from './charts/a.js';
import { AS_OF, KIN, NK, actorKey, colorOf, setExporting, tw, wrap } from './app.js';
import { CATS, drawB, stateB } from './charts/b.js';
import { drawC, stateC } from './charts/c.js';
import { R_SHAPE_KEY, R_STYLE_KEY, R_VERT_NOTE, drawR, zoomedR } from './charts/rpo.js';
import { drawL } from './charts/lag.js';
import { ABBR_NOTE, drawLegal } from './charts/legal.js';
import { hooks } from './shared.js';
import { guides } from './ui.js';
import { SANS } from './fonts.js';
const STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-opacity',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-variant-numeric',
  'letter-spacing',
  'text-anchor',
  'display',
  'paint-order',
];
const EXPORT_SPEC = {
  A: {
    id: 'svgA',
    draw: () => drawA,
    legend: () => ({
      head: 'Country:',
      items: [...new Set(KIN.map((e) => actorKey(e.state) || e.state))].map((s) => ({ c: colorOf(s), t: s === 'Russia' ? 'USSR / Russia' : s })),
    }),
    bubbles: true, // frameExport adds a size key (debris bubble area) under the colour key
    title: 'Chart A · Kinetic tests: altitude over time',
    key:
      'Filled circle: destructive intercept at its intercept altitude. Triangle: intercept of a missile (suborbital) target. Ring: ' +
      'apogee, flyby or non-intercept test. Star: nuclear detonation. Dashed bubble: area proportional to cataloged fragments (as of Feb. ' +
      '2026). Altitude axis is logarithmic; tests with no reported altitude sit in the strip below the axis.',
  },
  B: {
    id: 'svgB',
    draw: () => drawB,
    legend: () => ({
      head: 'Colour:',
      items:
        stateB.group === 'cat'
          ? CATS.filter((c) => stateB.on.has(c.key)).map((c) => ({ c: `var(${c.v})`, t: c.label }))
          : [
              { c: 'var(--cat-da)', t: 'Kinetic (direct-ascent, co-orbital)' },
              { c: 'var(--cat-ew)', t: 'Non-kinetic (EW, directed energy, cyber)' },
            ],
    }),
    title: 'Chart B · Capability diffusion',
    key:
      'Solid: capability demonstrated (tested or used). Hatched: developing or latent (SWF matrix supports it). Dotted fill: ' +
      'developing, builder-assessed (2020s entries for which the SWF matrix shows no data). Faded fill with dashed edge: reconstructed ' +
      'decades. Whisker above each decade: low end = demonstrated only, high end = demonstrated plus developing. Stack height counts ' +
      'state-capability pairs (a state with two capabilities counts twice). Decades before 2020 are reconstructed by the page builder, ' +
      'not assessed by SWF.',
  },
  C: {
    id: 'svgC',
    draw: () => drawC,
    legend: () => ({
      head: 'Actor:',
      items: [...new Set(NK.map((e) => actorKey(e.actor) || 'Other or multiple actors'))].map((s) => ({ c: colorOf(s), t: s })),
    }),
    title: 'Chart C · Non-kinetic operations',
    get key() {
      return (
        (stateC.focus
          ? 'Zoomed view: the axis is 1995–2026, not the shared 1957–2026 axis (the ledger has no earlier non-kinetic entry; earliest: ' +
            '1997 MIRACL laser test). '
          : '') +
        'Bars: sustained campaigns. Points: discrete events. Arrowhead: ongoing. Solid: official or multi-government attribution. Outline: ' +
        'researcher / open-source attribution. Dashed outline: alleged. Attribution is recorded as the source states it.'
      );
    },
  },
  R: {
    id: 'svgR',
    draw: () => drawR,
    // Shape key (activity), outline key (how firmly SWF states it), then the actor colours: the same glyphs as the page legend.
    legend: () => ({
      items: [
        { head: 'Shape:' },
        ...R_SHAPE_KEY.map(([g, t, gw]) => ({ g, t: t.replace(' (launch to landing)', ''), gw })),
        { head: 'Outline:' },
        ...R_STYLE_KEY.map(([g, t, gw]) => ({ g, t, gw })),
        { head: 'Actor:' },
        ...['United States', 'China', 'Russia'].map((s) => ({ c: colorOf(s), t: s })),
      ],
    }),
    title: 'Co-orbital proximity operations (RPO)',
    get key() {
      return (
        (zoomedR() ? 'Zoomed view: the axis is 2000–2026, not the shared 1957–2026 axis. ' : '') +
        'Circle: rendezvous or proximity operation. Square: docking. Triangle: capture and tow. Diamond: release of an object. Bar: ' +
        'spaceplane mission, launch to landing. Solid: stated plainly by SWF. Outline: hedged by SWF. Dashed outline: unclear or ' +
        'conflicted. Arrowhead: ongoing. ' +
        R_VERT_NOTE +
        ' A proximity operation is not an attack; SWF’s wording on intent is hedged.'
      );
    },
  },
  L: {
    id: 'svgL',
    draw: () => drawL,
    title: 'Chronology: capability milestones and later legal steps',
    key:
      'Hexagon: capability milestone. Circle: treaty. Square: resolution or body finding (non-binding). Triangle: unilateral pledge. ' +
      'Open ring: no later legal item paired in the ledger (not a claim that no rule exists). Chronology only: a pair shows which came first, not causation.',
  },
  legal: {
    id: 'legalSvg',
    draw: () => drawLegal,
    title: 'Law and policy responses, 1957–2026',
    key:
      'Circle: treaty. Square: resolution or body finding. Triangle: unilateral pledge. Diamond: soft law (expert manual, not binding). ' +
      'Cross: veto. Bars: negotiation spans. Marks that would collide are stacked vertically; each stays at its true date on the axis. ' +
      ABBR_NOTE,
  },
};
const EXPORT_W = 1200,
  SANS_EXPORT = SANS;
const SOURCE_LINE =
  `Source: Secure World Foundation, Global Counterspace Capabilities: An Open Source Assessment (9th ed., Apr. 2026) and ` +
  `the primary sources cited in the ledger. Data as of ${AS_OF}. Companion to Space Security Law: Governance Beyond the Atmosphere.`;
// A standalone SVG has no page stylesheet, so it carries the subset IBM Plex Sans faces it uses (400 and 600; a 700 request resolves to 600) as
// base64 @font-face rules, copied from the page's <style id="cs-fonts"> (written by tools/build_page.py). Roughly 36 KB added per file.
function fontFaceCSS() {
  const css = document.getElementById('cs-fonts')?.textContent || '';
  return css
    .split('\n')
    .filter((r) => r.includes('font-family:"IBM Plex Sans"') && r.includes('font-style:normal') && /font-weight:(400|600);/.test(r))
    .join('\n');
}
// Copy computed presentation properties onto the clone so the file renders the same without the page's stylesheet.
function inlineStyles(src, clone) {
  const a = src.querySelectorAll('*'),
    b = clone.querySelectorAll('*');
  a.forEach((n, i) => {
    const cs = getComputedStyle(n);
    b[i].setAttribute('style', STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
    ['class', 'tabindex', 'role'].forEach((k) => b[i].removeAttribute(k));
  });
  clone.querySelectorAll('.hit').forEach((n) => n.remove());
  clone.querySelectorAll('title').forEach((n) => {
    if (n.parentNode === clone) n.remove();
  });
}
// Wrap the chart clone in a titled frame with a visible as-of line (top right) and a source footer.
function frameExport(spec, clone, box) {
  const ns = 'http://www.w3.org/2000/svg',
    EW = EXPORT_W,
    vb = clone.getAttribute('viewBox').split(' ').map(Number);
  const bcs = getComputedStyle(box),
    fg = bcs.color,
    bg = bcs.backgroundColor,
    muted = bcs.getPropertyValue('--muted').trim() || fg;
  const rv = (v) => v.replace(/var\((--[\w-]+)\)/g, (_, n) => bcs.getPropertyValue(n).trim());
  // colour key row(s): only the countries / categories / actors actually present in the chart
  const leg = spec.legend ? spec.legend() : null,
    LX = 16,
    legRows = [];
  let cur = null,
    cx = 0;
  if (leg) {
    const items = [...(leg.head ? [{ head: leg.head }] : []), ...leg.items];
    items.forEach((it) => {
      const w = it.head ? tw(it.head, 10.5, 600) + 8 : (it.g ? (it.gw || 14) + 6 : 14) + tw(it.t, 10.5) + 16;
      if (!cur || cx + w > EW - 32) {
        cur = [];
        legRows.push(cur);
        cx = 0;
      }
      cur.push({ ...it, x: cx });
      cx += w;
    });
  }
  const LEGH = legRows.length * 16 + (legRows.length ? 8 : 0),
    BK = spec.bubbles ? 68 : 0; // height of the bubble-size key row
  const foot = wrap(spec.key, EW - 32, 10.5).concat(wrap(SOURCE_LINE, EW - 32, 10.5)),
    HDR = 40,
    HT = HDR + vb[3] + LEGH + BK + foot.length * 14 + 16;
  const out = document.createElementNS(ns, 'svg');
  out.setAttribute('xmlns', ns);
  out.setAttribute('width', EW);
  out.setAttribute('height', HT);
  out.setAttribute('viewBox', `0 0 ${EW} ${HT}`);
  out.setAttribute('role', 'img');
  out.setAttribute('aria-label', spec.title);
  const mk = (tag, at, txt) => {
    const e = document.createElementNS(ns, tag);
    Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v));
    if (txt != null) e.textContent = txt;
    out.appendChild(e);
    return e;
  };
  mk('title', {}, spec.title);
  mk('defs', {}).appendChild(document.createElementNS(ns, 'style')).textContent = fontFaceCSS();
  mk('desc', {}, spec.key);
  mk('rect', { width: EW, height: HT, style: `fill:${bg}` });
  mk('text', { x: 16, y: 26, style: `fill:${fg};font:600 17px ${SANS_EXPORT}` }, spec.title);
  mk(
    'text',
    { x: EW - 16, y: 26, 'text-anchor': 'end', style: `fill:${muted};font:11.5px ${SANS_EXPORT}` },
    `Data as of ${AS_OF} · Source: SWF 2026 and ledger`,
  );
  Object.entries({ x: 0, y: HDR, width: EW, height: vb[3] }).forEach(([k, v]) => clone.setAttribute(k, v));
  // the nested chart svg would point at a heading id that does not exist in the file: the outer svg carries the title (role img, aria-label)
  ['id', 'aria-labelledby', 'role'].forEach((a) => clone.removeAttribute(a));
  clone.setAttribute('aria-hidden', 'true');
  out.appendChild(clone);
  legRows.forEach((row, ri) =>
    row.forEach((it) => {
      const yy = HDR + vb[3] + 14 + ri * 16;
      if (it.head) mk('text', { x: LX + it.x, y: yy, style: `fill:${fg};font:600 10.5px ${SANS_EXPORT}` }, it.head);
      else if (it.g) {
        const gw = it.gw || 14;
        mk('g', { transform: `translate(${LX + it.x + gw / 2},${yy - 4})`, 'aria-hidden': 'true' }).innerHTML = rv(it.g);
        mk('text', { x: LX + it.x + gw + 6, y: yy, style: `fill:${fg};font:10.5px ${SANS_EXPORT}` }, it.t);
      } else {
        mk('rect', { x: LX + it.x, y: yy - 9, width: 10, height: 10, rx: 2, style: `fill:${rv(it.c)}` });
        mk('text', { x: LX + it.x + 14, y: yy, style: `fill:${fg};font:10.5px ${SANS_EXPORT}` }, it.t);
      }
    }),
  );
  if (spec.bubbles) {
    // Bubble-size key: nested dashed circles (same sqrt scale as the chart, 30 px radius = 3,600 fragments) with their fragment counts.
    const r30 = (n) => 30 * Math.sqrt(n / 3600),
      by = HDR + vb[3] + LEGH + 4 + 62,
      cx0 = LX + 32;
    [100, 1000, 3500].forEach((n) => {
      mk('circle', { cx: cx0, cy: by - r30(n), r: r30(n), style: `fill:none;stroke:${muted};stroke-dasharray:2 2` });
      mk('text', { x: cx0 + 36, y: by - 2 * r30(n) + 9, style: `fill:${muted};font:10px ${SANS_EXPORT}` }, n.toLocaleString('en-US'));
    });
    mk(
      'text',
      { x: cx0 + 80, y: by - 26, style: `fill:${fg};font:10.5px ${SANS_EXPORT}` },
      'Debris bubble area = cataloged fragments (as of Feb. 2026); labels give fragment counts.',
    );
  }
  foot.forEach((t, i) => mk('text', { x: 16, y: HDR + vb[3] + LEGH + BK + 18 + i * 14, style: `fill:${muted};font:10.5px ${SANS_EXPORT}` }, t));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(out);
}
// Redraw a chart off-screen at the fixed export width (desktop layout) and serialise it.
export function exportSVG(which) {
  hooks.drawRest();
  const spec = EXPORT_SPEC[which];
  if (!spec) return '';
  const savedGuides = guides.length;
  setExporting(true, true);
  const box = document.createElement('div');
  box.className = 'xbox ' + (document.getElementById('expDark')?.checked ? 'xdark' : 'xlight');
  box.style.cssText = `position:absolute;left:-99999px;top:0;width:${EXPORT_W}px`;
  document.body.appendChild(box);
  try {
    spec.draw()(box);
    const src = box.querySelector('svg'),
      clone = src.cloneNode(true);
    inlineStyles(src, clone);
    return frameExport(spec, clone, box);
  } finally {
    setExporting(false, false);
    box.remove();
    guides.length = savedGuides;
  }
}
export function download(name, data, type) {
  const a = document.createElement('a');
  a.href = data.startsWith('data:') ? data : URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
document
  .querySelectorAll('[data-export]')
  .forEach((b) => (b.onclick = () => download(`counterspace-${b.dataset.export}.svg`, exportSVG(b.dataset.export), 'image/svg+xml')));
