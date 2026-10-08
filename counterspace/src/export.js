// ============================================================================
// export.js: chart downloads (a fresh 1200 px render of the chart in a titled frame, as a standalone file) and file download.
// Provides: exportSVG(), download().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { drawA, kinMarkup } from './charts/a.js';
import { AS_OF, KIN, LEDGER_AS_OF, NK, actorKey, colorOf, setExporting, tw, wrap } from './app.js';
import { CATS, drawB, stateB } from './charts/b.js';
import { drawC, zoomedC } from './charts/c.js';
import { R_SHAPE_KEY, R_STYLE_KEY, R_VERT_NOTE, drawR, zoomedR } from './charts/rpo.js';
import { drawL } from './charts/lag.js';
import { ABBR_NOTE, drawLegal, glyphMarkup } from './charts/legal.js';
import { hooks } from './shared.js';
import { guides } from './ui.js';
import { SANS, SERIF } from './fonts.js';
const STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-variant-numeric',
  'letter-spacing',
  'text-anchor',
  'text-transform',
  'display',
  'paint-order',
];
const INK = 'var(--text)';
// One entry per chart. title and sub: the heading of the file (the title is the chapter title on the page); key: how to read it; file: the name of the
// saved file; legend: swatches drawn above the key text (shapes use the same markup as the page's key).
const EXPORT_SPEC = {
  A: {
    id: 'svgA',
    draw: () => drawA,
    file: 'anti-satellite-tests',
    title: 'How high the tests went, and the debris they left',
    sub: 'Every test in our records, by year and altitude, with the debris from the destructive ones.',
    legend: () => ({
      items: [
        { head: 'What happened' },
        { g: kinMarkup('destructive', INK), t: 'Destroyed a satellite', gw: 24 },
        { g: kinMarkup('midcourse_intercept', INK), t: 'Intercepted a ballistic missile', gw: 24 },
        { g: kinMarkup('apogee_only', INK), t: 'Test that destroyed nothing', gw: 24 },
        { g: kinMarkup('nuclear', INK), t: 'Nuclear explosion in space', gw: 24 },
        { head: 'Country' },
        ...[...new Set(KIN.map((e) => actorKey(e.state) || e.state))].map((s) => ({ c: colorOf(s), t: s === 'Russia' ? 'USSR and Russia' : s })),
      ],
    }),
    bubbles: true, // frameExport adds a size key (debris bubble area) under the swatches
    key:
      'Filled circle: a test that destroyed a satellite, at the altitude where it happened. Triangle: interception of a ballistic missile in flight. ' +
      'Ring: a test that destroyed nothing (rocket-only flight, flyby or other). Star: nuclear explosion in space. Dashed bubble: debris, with area in proportion to the ' +
      'fragments cataloged (as of February 2026). The altitude scale is logarithmic. Tests with no reported altitude sit in the strip below the plot, ' +
      'placed by date only.',
  },
  B: {
    id: 'svgB',
    draw: () => drawB,
    file: 'who-can-do-what',
    title: 'Which states can do what, decade by decade',
    sub: 'Number of states holding each capability in each decade.',
    legend: () => ({
      items: [
        { head: 'Colour' },
        ...(stateB.group === 'cat'
          ? CATS.filter((c) => stateB.on.has(c.key)).map((c) => ({ c: `var(${c.v})`, t: c.label }))
          : [
              { c: 'var(--cat-da)', t: 'Kinetic (direct-ascent, co-orbital)' },
              { c: 'var(--cat-ew)', t: 'Non-kinetic (electronic warfare, directed energy, cyber)' },
            ]),
      ],
    }),
    key:
      'Solid fill: capability demonstrated (tested or used). Striped fill: developing or latent, as the SWF country tables support. Dotted fill: ' +
      'developing, our reading, for 2020s entries where the SWF tables show no data. Faded fill with a dashed edge: decades before the 2020s, which we ' +
      'reconstructed from SWF’s test tables and country chapters; SWF did not assess them. The range above each decade runs from capabilities ' +
      'demonstrated only (low end) to demonstrated plus developing (high end). Bar height counts each state once for every capability it holds, so a ' +
      'state with two capabilities counts twice.',
  },
  C: {
    id: 'svgC',
    draw: () => drawC,
    file: 'jamming-lasers-and-cyber',
    title: 'Attacks that leave satellites in orbit',
    sub: 'Jamming, spoofing, laser and cyber operations, as campaigns and single events.',
    legend: () => ({
      items: [{ head: 'Actor' }, ...[...new Set(NK.map((e) => actorKey(e.actor) || 'Other or multiple actors'))].map((s) => ({ c: colorOf(s), t: s }))],
    }),
    get key() {
      return (
        (zoomedC()
          ? 'Zoomed view: the axis runs from 1995 to 2026, not the shared 1957 to 2026 axis (our records have no earlier jamming, laser or cyber entry; ' +
            'the earliest is the 1997 MIRACL laser test). '
          : '') +
        'Bar: a campaign that lasted. Point: a single event. Arrowhead: still going. Solid fill: attributed by a government or several governments. ' +
        'Outline only: attributed by researchers or open-source analysis. Dashed outline: alleged. Attribution is recorded as the source states it.'
      );
    },
  },
  R: {
    id: 'svgR',
    draw: () => drawR,
    file: 'close-approaches',
    title: 'Satellites that fly close to other satellites',
    sub: 'Close approaches, dockings, captures, releases and spaceplane missions, by actor.',
    // Shape key (activity), outline key (how firmly SWF states it), then the actor colours: the same symbols as the page key.
    legend: () => ({
      items: [
        { head: 'Shape' },
        ...R_SHAPE_KEY.map(([g, t, gw]) => ({ g, t: t.replace(' (launch to landing)', ''), gw })),
        { head: 'Outline' },
        ...R_STYLE_KEY.map(([g, t, gw]) => ({ g, t, gw })),
        { head: 'Actor' },
        ...['United States', 'China', 'Russia'].map((s) => ({ c: colorOf(s), t: s })),
      ],
    }),
    get key() {
      return (
        (zoomedR() ? 'Zoomed view: the axis runs from 2000 to 2026, not the shared 1957 to 2026 axis. ' : '') +
        'Circle: rendezvous or close approach. Square: docking. Triangle: capture and tow. Diamond: release of an object. Bar: spaceplane mission, from ' +
        'launch to landing. Solid: stated plainly by SWF. Outline: SWF hedges its wording. Dashed outline: unclear or conflicting. Arrowhead: still going. ' +
        R_VERT_NOTE +
        ' A close approach is not an attack; SWF’s wording on intent is hedged.'
      );
    },
  },
  L: {
    id: 'svgL',
    draw: () => drawL,
    file: 'how-long-the-law-took',
    title: 'How long the law took to follow',
    sub: 'The time from a capability to the next legal step our records link to it.',
    legend: () => ({
      items: [
        { head: 'Weapon or attack' },
        { g: `<path d="M0,-8L6.9,-4L6.9,4L0,8L-6.9,4L-6.9,-4Z" style="fill:var(--cat-da)"/>`, t: 'Physical attack (kinetic)', gw: 20 },
        { g: `<path d="M0,-8L6.9,-4L6.9,4L0,8L-6.9,4L-6.9,-4Z" style="fill:var(--cat-ew)"/>`, t: 'Jamming, laser or cyber (non-kinetic)', gw: 20 },
        { head: 'Later legal step' },
        { g: glyphMarkup('treaty'), t: 'Treaty', gw: 20 },
        { g: glyphMarkup('resolution'), t: 'Resolution or finding (not binding)', gw: 20 },
        { g: glyphMarkup('unilateral'), t: 'Pledge by one country', gw: 20 },
        { head: 'No later step' },
        { g: `<circle r="7" style="fill:var(--ground);stroke:var(--accent);stroke-width:2.4"/>`, t: 'Open ring', gw: 20 },
      ],
    }),
    key:
      'Hexagon: a space weapon or attack (orange for a physical attack, blue for jamming, a laser or a cyber operation). Circle: treaty. Square: ' +
      'resolution or finding, not binding. Triangle: pledge by one country. Open ring: our records link no later legal step to the capability; this does not mean that no rule applies. The bar is the ' +
      'time between the two. It shows the order of events and says nothing about cause.',
  },
  legal: {
    id: 'legalSvg',
    // The saved image holds the whole timeline and, under it, the enlarged 2021 to 2026 window, so every item is named in the file.
    draw: () => (box) => {
      [false, true].forEach((zoom) => {
        const part = document.createElement('div');
        box.appendChild(part);
        drawLegal(part, zoom);
      });
    },
    partTitles: [null, 'Zoom: 2021 to 2026'],
    file: 'law-and-policy-timeline',
    title: 'Law and policy on one timeline',
    sub: 'Treaties, resolutions, pledges and expert manuals, 1957 to 2026.',
    legend: () => ({
      items: [
        { g: glyphMarkup('treaty'), t: 'Treaty', gw: 20 },
        { g: glyphMarkup('draft'), t: 'Draft treaty put forward', gw: 20 },
        { g: glyphMarkup('resolution'), t: 'Resolution or finding (not binding)', gw: 20 },
        { g: glyphMarkup('unilateral'), t: 'Pledge by one country', gw: 20 },
        { g: glyphMarkup('soft'), t: 'Expert manual (soft law, not binding)', gw: 20 },
        { g: glyphMarkup('veto'), t: 'Veto in the UN Security Council', gw: 20 },
        { g: `<rect x="-9" y="-3.5" width="18" height="7" rx="3.5" style="fill:var(--accent);fill-opacity:.42"/>`, t: 'Years of negotiation', gw: 20 },
      ],
    }),
    key: 'Symbols that would collide are stacked; each keeps its true date on the axis. Abbreviations: ' + ABBR_NOTE,
  },
};
export const EXPORT_FILES = Object.fromEntries(Object.entries(EXPORT_SPEC).map(([k, v]) => [k, v.file]));
const EXPORT_W = 1200,
  PAD = 28;
const SOURCE_LINE =
  'Source: SWF 2026 (Secure World Foundation, Global Counterspace Capabilities: An Open Source Assessment, 9th ed., Apr. 2026) and the primary sources ' +
  'cited on the page.';
const CREDIT = 'Counterspace timeline, companion to Space Security Law by Aaron Brynildson';
// A standalone file has no page stylesheet, so it carries the font faces it uses (IBM Plex Sans 400 and 600, where the 600 face is declared "500 600",
// and Newsreader for the title) as base64 @font-face rules copied from the page's <style id="cs-fonts"> (written by tools/build_page.py).
function fontFaceCSS() {
  const css = document.getElementById('cs-fonts')?.textContent || '';
  return css
    .split('\n')
    .filter(
      (r) =>
        r.includes('font-style:normal') &&
        ((r.includes('font-family:"IBM Plex Sans"') && /font-weight:(400|500 600);/.test(r)) || r.includes('font-family:"Newsreader"')),
    )
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
  clone.querySelectorAll('.hit').forEach((n) => n.remove()); // hover and focus targets are never part of a picture
  clone.querySelectorAll('title').forEach((n) => {
    if (n.parentNode === clone) n.remove();
  });
}
// Wrap the chart clone(s) in a titled frame: title and one-line subtitle on top, the key, the source and the credit line below.
function frameExport(spec, clones, box) {
  const ns = 'http://www.w3.org/2000/svg',
    EW = EXPORT_W,
    inner = EW - 2 * PAD;
  const bcs = getComputedStyle(box),
    fg = bcs.color,
    bg = bcs.backgroundColor,
    muted = bcs.getPropertyValue('--muted').trim() || fg,
    line = bcs.getPropertyValue('--line-strong').trim() || muted;
  const rv = (v) => v.replace(/var\((--[\w-]+)\)/g, (_, n) => bcs.getPropertyValue(n).trim());
  // swatches: groups led by a small label, then the items; wrapped into rows
  const leg = spec.legend ? spec.legend() : null,
    legRows = [];
  let cur = null,
    cx = 0;
  if (leg) {
    leg.items.forEach((it) => {
      const w = it.head ? tw(it.head, 12, 600) + 10 : (it.g ? (it.gw || 18) + 8 : 16) + tw(it.t, 12.5) + 20;
      if (!cur || cx + w > inner || (it.head && cur.length)) {
        cur = [];
        legRows.push(cur);
        cx = 0;
      }
      cur.push({ ...it, x: cx });
      cx += w;
    });
  }
  const LEGH = legRows.length * 24 + (legRows.length ? 10 : 0),
    BK = spec.bubbles ? 76 : 0; // height of the bubble-size key
  const foot = wrap(spec.key, inner, 12),
    src = wrap(SOURCE_LINE, inner, 12);
  // heading
  const HDR = PAD + 74,
    parts = clones.map((c, i) => ({ c, vb: c.getAttribute('viewBox').split(' ').map(Number), title: spec.partTitles?.[i] ?? null }));
  let chartH = 0;
  parts.forEach((p) => {
    p.y = HDR + chartH + (p.title ? 40 : 0);
    chartH += p.vb[3] + (p.title ? 40 : 0) + 12;
  });
  const FOOT0 = HDR + chartH + 8,
    HT = FOOT0 + LEGH + BK + 28 + foot.length * 18 + 10 + src.length * 18 + 14 + 18 + PAD;
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
  mk('desc', {}, `${spec.sub} ${spec.key}`);
  mk('rect', { width: EW, height: HT, style: `fill:${bg}` });
  mk('text', { x: PAD, y: PAD + 28, style: `fill:${fg};font:500 29px ${SERIF}` }, spec.title);
  mk('text', { x: PAD, y: PAD + 54, style: `fill:${muted};font:400 14.5px ${SANS}` }, spec.sub);
  parts.forEach(({ c, vb, y, title }) => {
    if (title) mk('text', { x: PAD, y: y - 16, style: `fill:${fg};font:600 15px ${SANS}` }, title);
    Object.entries({ x: PAD, y, width: inner, height: vb[3] }).forEach(([k, v]) => c.setAttribute(k, v));
    // the nested chart would point at a heading id that does not exist in the file: the outer svg carries the title (role img, aria-label)
    ['id', 'aria-labelledby', 'role'].forEach((a) => c.removeAttribute(a));
    c.setAttribute('aria-hidden', 'true');
    out.appendChild(c);
  });
  mk('line', { x1: PAD, x2: EW - PAD, y1: FOOT0, y2: FOOT0, style: `stroke:${line};stroke-width:1` });
  legRows.forEach((row, ri) =>
    row.forEach((it) => {
      const yy = FOOT0 + 28 + ri * 24;
      if (it.head) mk('text', { x: PAD + it.x, y: yy, style: `fill:${muted};font:600 12px ${SANS}` }, it.head);
      else if (it.g) {
        const gw = it.gw || 18;
        mk('g', { transform: `translate(${PAD + it.x + gw / 2},${yy - 4})`, 'aria-hidden': 'true' }).innerHTML = rv(it.g);
        mk('text', { x: PAD + it.x + gw + 8, y: yy, style: `fill:${fg};font:400 12.5px ${SANS}` }, it.t);
      } else {
        mk('rect', { x: PAD + it.x, y: yy - 10, width: 12, height: 12, rx: 2.5, style: `fill:${rv(it.c)}` });
        mk('text', { x: PAD + it.x + 18, y: yy, style: `fill:${fg};font:400 12.5px ${SANS}` }, it.t);
      }
    }),
  );
  if (spec.bubbles) {
    // Bubble-size key: nested dashed circles (same square-root scale as the chart: a 30 px radius is 3,600 fragments) with their fragment counts.
    const r30 = (n) => 30 * Math.sqrt(n / 3600),
      by = FOOT0 + LEGH + 14 + 62,
      cx0 = PAD + 34;
    [100, 1000, 3500].forEach((n) => {
      const top = by - 2 * r30(n);
      mk('circle', { cx: cx0, cy: by - r30(n), r: r30(n), style: `fill:none;stroke:${muted};stroke-dasharray:2 2` });
      mk('path', { d: `M${cx0},${top}H${cx0 + 38}`, style: `fill:none;stroke:${line}` });
      mk('text', { x: cx0 + 42, y: top + 4, style: `fill:${muted};font:400 12px ${SANS}` }, n.toLocaleString('en-US'));
    });
    mk(
      'text',
      { x: cx0 + 96, y: by - 28, style: `fill:${fg};font:400 12.5px ${SANS}` },
      'Debris bubble area = cataloged fragments (as of Feb. 2026); the numbers are fragment counts.',
    );
  }
  let fy = FOOT0 + LEGH + BK + 38;
  foot.forEach((t, i) => mk('text', { x: PAD, y: fy + i * 18, style: `fill:${muted};font:400 12px ${SANS}` }, t));
  fy += foot.length * 18 + 10;
  src.forEach((t, i) => mk('text', { x: PAD, y: fy + i * 18, style: `fill:${muted};font:400 12px ${SANS}` }, t));
  fy += src.length * 18 + 14;
  mk('text', { x: PAD, y: fy, style: `fill:${fg};font:600 12px ${SANS}` }, CREDIT);
  mk(
    'text',
    { x: EW - PAD, y: fy, 'text-anchor': 'end', style: `fill:${muted};font:400 12px ${SANS}` },
    `Data as of ${AS_OF}. Records last updated ${LEDGER_AS_OF}.`,
  );
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
  box.style.cssText = `position:absolute;left:-99999px;top:0;width:${EXPORT_W - 2 * PAD}px`;
  document.body.appendChild(box);
  try {
    spec.draw()(box);
    const srcs = [...box.querySelectorAll('svg')],
      clones = srcs.map((s) => s.cloneNode(true));
    srcs.forEach((s, i) => inlineStyles(s, clones[i]));
    return frameExport(spec, clones, box);
  } finally {
    setExporting(false, false);
    box.remove();
    guides.length = savedGuides;
  }
}
export function download(name, data, type) {
  const a = document.createElement('a');
  a.href = data instanceof Blob ? URL.createObjectURL(data) : data.startsWith('data:') ? data : URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
// A SVG string drawn onto a canvas at twice its size, saved as a PNG (the fonts travel inside the file, so the picture matches the drawing).
function svgToPng(svg) {
  return new Promise((resolve, reject) => {
    const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),
      w = m ? +m[1] : EXPORT_W,
      h = m ? +m[2] : 800,
      url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
      img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * 2;
      c.height = h * 2;
      const g = c.getContext('2d');
      g.scale(2, 2);
      g.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('no picture'))), 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The chart could not be turned into a picture'));
    };
    img.src = url;
  });
}
// Each "Download chart" button opens a small menu: a picture for slides and documents, or a drawing that stays sharp when enlarged.
const menus = [];
const closeMenus = (except) =>
  menus.forEach((m) => {
    if (m.pop !== except && !m.pop.hidden) {
      m.pop.hidden = true;
      m.btn.setAttribute('aria-expanded', 'false');
    }
  });
document.querySelectorAll('[data-export]').forEach((btn) => {
  const which = btn.dataset.export,
    base = `counterspace-timeline-${EXPORT_FILES[which] || which}`,
    wrap = document.createElement('span'),
    pop = document.createElement('div'),
    note = document.createElement('span');
  wrap.className = 'dl-wrap';
  btn.replaceWith(wrap);
  wrap.append(btn, pop);
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  pop.className = 'dl-menu';
  pop.hidden = true;
  note.className = 'sr';
  note.setAttribute('role', 'status');
  const item = (label, hint, run) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<b>${label}</b><span>${hint}</span>`;
    b.onclick = async () => {
      closeMenus();
      btn.focus();
      try {
        await run();
      } catch (e) {
        note.textContent = 'The chart could not be saved. Try the other kind of file.';
      }
    };
    pop.appendChild(b);
  };
  item('Picture', 'For slides and documents', async () => download(`${base}.png`, await svgToPng(exportSVG(which))));
  item('Sharp drawing', 'Stays crisp at any size', () => download(`${base}.svg`, exportSVG(which), 'image/svg+xml'));
  const bg = document.createElement('button');
  bg.type = 'button';
  bg.setAttribute('role', 'switch');
  bg.className = 'dl-switch';
  const dark = document.getElementById('expDark');
  const syncBg = () => {
    bg.setAttribute('aria-checked', String(!!dark?.checked));
    bg.innerHTML = `<span class="sw-txt"><b>Dark background: ${dark?.checked ? 'on' : 'off'}</b><span>Applies to every download</span></span><span class="sw-track" aria-hidden="true"><span class="sw-thumb"></span></span>`;
  };
  bg.onclick = () => {
    if (dark) dark.checked = !dark.checked;
    dark?.dispatchEvent(new Event('change', { bubbles: true }));
  };
  dark?.addEventListener('change', syncBg);
  syncBg();
  pop.appendChild(bg);
  wrap.appendChild(note);
  menus.push({ btn, pop });
  btn.onclick = () => {
    closeMenus(pop);
    pop.hidden = !pop.hidden;
    btn.setAttribute('aria-expanded', String(!pop.hidden));
    if (!pop.hidden) {
      // keep the whole menu on screen, whatever side of the page its button sits on
      pop.style.left = '';
      const r = pop.getBoundingClientRect(),
        dx = r.right > innerWidth - 8 ? innerWidth - 8 - r.right : r.left < 8 ? 8 - r.left : 0;
      if (dx) pop.style.left = dx + 'px';
      pop.firstElementChild.focus();
    }
  };
  wrap.addEventListener('keydown', (e) => {
    // Esc closes the menu from the button too, and focus stays on (or returns to) the button
    if (e.key === 'Escape' && !pop.hidden && !pop.contains(e.target)) {
      e.stopPropagation();
      closeMenus();
      btn.focus();
    }
  });
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeMenus();
      btn.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const all = [...pop.children];
      all[(all.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length].focus();
    }
  });
});
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest?.('.dl-wrap')) closeMenus();
});
document.addEventListener('focusin', (e) => {
  if (!e.target.closest?.('.dl-wrap')) closeMenus();
});
