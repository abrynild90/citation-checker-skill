// ============================================================================
// scenes/svg/still-frame.js: the finished frame of a saved image (3000 x 1875): the picture on top, then one calm band with the scene's title in the serif,
// one line of context, the source line and the credit line. The live 3D still (gl-still.js) and the still diagram share it, so both saves look the same.
// ============================================================================
import { SANS, SERIF, fontsReady } from '../../fonts.js';
import { earthImg, earthLow } from '../earth.js';
import { stillLine } from '../still-config.js';

export const STILL_W = 3000,
  STILL_H = 1875;
// The band is 132 units of the image width / 1000 tall (396 px at 3000): the picture above it keeps the 3000 x 1479 frame the scenes were composed for.
export const BAND_UNITS = 132;
export const bandHeight = (W) => Math.round(BAND_UNITS * (W / 1000));

const BAND_BG = '#0c1222',
  INK = '#eef2fb',
  SOFT = '#b3bdd6',
  FAINT = '#98a2bd',
  WARM = '#ffc86b';

const sims = new WeakMap();
// The diagram remembers its scene, so its saved image can say what it shows.
export const rememberSim = (node, sim) => sims.set(node, sim);
export const simOf = (node) => sims.get(node);

// What the band says, from the scene: the title, one line of context, the source line (with the imagery credit) and the picture note.
export function stillMeta(cfg, title, cite) {
  const src = String(cite || '')
    .trim()
    .replace(/[.;,\s]+$/, '');
  const imagery = earthImg || earthLow ? 'Earth imagery: NASA Blue Marble and Black Marble (public domain).' : 'Land outlines: Natural Earth (public domain).';
  return {
    title: String(title || cfg?.title || ''),
    line: stillLine(cfg),
    source: `${src ? `Source: ${src}. ` : ''}${imagery}`,
    note: 'Drawn for illustration. Orbit heights are squeezed to fit.',
  };
}

// The file name of a saved image: "counterspace-" and the scene title in lower case with hyphens.
export function stillFileName(title) {
  const slug = String(title || 'scene')
    .toLowerCase()
    .replace(/[“”"‘’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `counterspace-${slug}.png`;
}

// A standalone SVG has no page stylesheet, and an SVG drawn as an image cannot see the page's fonts: the diagram carries the IBM Plex Sans faces it uses
// as @font-face rules (copied from the page's <style id="cs-fonts">), so its labels are set in the page's own type in the saved image.
export function fontFaceCSS() {
  const css = document.getElementById('cs-fonts')?.textContent || '';
  return css
    .split('\n')
    .filter((r) => r.includes('font-family:"IBM Plex Sans"') && r.includes('font-style:normal') && /font-weight:(400|500 600);/.test(r))
    .join('\n');
}

// Wraps text to at most maxLines lines of maxW px in the current canvas font; returns the lines.
function wrap(g, text, maxW) {
  const lines = [];
  let cur = '';
  for (const wd of text.split(' ')) {
    const nx = cur ? cur + ' ' + wd : wd;
    if (cur && g.measureText(nx).width > maxW) {
      lines.push(cur);
      cur = wd;
    } else cur = nx;
  }
  if (cur) lines.push(cur);
  return lines;
}

// The small orbit mark before the credit: a planet, a ring around it and a satellite on the ring, in one line weight.
function orbitMark(g, x, y, u) {
  const lw = 2.6 * u,
    rx = 21 * u,
    ry = 8 * u,
    tilt = -0.38;
  g.save();
  g.translate(x + rx, y);
  g.strokeStyle = SOFT;
  g.lineWidth = lw;
  g.beginPath();
  g.ellipse(0, 0, rx, ry, tilt, Math.PI, 2 * Math.PI); // the far half of the ring
  g.stroke();
  g.fillStyle = BAND_BG;
  g.beginPath();
  g.arc(0, 0, 10.5 * u, 0, 2 * Math.PI);
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 0, rx, ry, tilt, 0, Math.PI); // the near half, in front of the planet
  g.stroke();
  g.fillStyle = WARM;
  g.beginPath();
  const a = -0.62 * Math.PI,
    px = rx * Math.cos(a),
    py = ry * Math.sin(a);
  g.arc(px * Math.cos(tilt) - py * Math.sin(tilt), px * Math.sin(tilt) + py * Math.cos(tilt), 3.8 * u, 0, 2 * Math.PI);
  g.fill();
  g.restore();
  return 2 * rx;
}

// Draws the band into g at y0 (full width W, height bandHeight(W)).
export function drawBand(g, W, y0, m) {
  const u = W / 3000,
    bandH = bandHeight(W),
    mx = 96 * u,
    textW = W - 2 * mx;
  g.fillStyle = BAND_BG;
  g.fillRect(0, y0, W, bandH);
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  // title, in the serif: as large as fits one line
  let px = 100 * u;
  for (; px > 62 * u; px -= 2 * u) {
    g.font = `500 ${px}px ${SERIF}`;
    if (g.measureText(m.title).width <= textW) break;
  }
  g.fillStyle = INK;
  const titleBase = y0 + 50 * u + px * 0.8;
  g.fillText(m.title, mx, titleBase);
  // one line of context, as large as fits (never under 36 px at 3000 wide, the size of 12 px on the page)
  let cp = 44 * u;
  for (; cp > 36 * u; cp -= u) {
    g.font = `400 ${cp}px ${SANS}`;
    if (g.measureText(m.line).width <= textW) break;
  }
  g.fillStyle = SOFT;
  const ctxBase = titleBase + 66 * u;
  g.fillText(m.line, mx, ctxBase);
  // the source line, wrapped to the band's width (up to two lines)
  const sp = 38 * u;
  g.font = `400 ${sp}px ${SANS}`;
  g.fillStyle = FAINT;
  wrap(g, m.source, textW)
    .slice(0, 2)
    .forEach((l, i) => g.fillText(l, mx, ctxBase + 56 * u + i * 49 * u));
  // the credit line, with the orbit mark; the picture note stands at the right when there is room
  const cr = y0 + bandH - 44 * u,
    cs = 36 * u,
    mw = orbitMark(g, mx, cr - 0.34 * cs, u),
    parts = [
      [`500 ${cs}px ${SANS}`, 'Counterspace timeline · companion to '],
      [`italic 400 ${cs * 1.06}px ${SERIF}`, 'Space Security Law'],
      [`500 ${cs}px ${SANS}`, ' by Aaron Brynildson'],
    ];
  let x = mx + mw + 20 * u;
  g.fillStyle = SOFT;
  for (const [f, t] of parts) {
    g.font = f;
    g.fillText(t, x, cr);
    x += g.measureText(t).width;
  }
  g.font = `400 ${cs}px ${SANS}`;
  g.fillStyle = FAINT;
  g.textAlign = 'right';
  if (x + 60 * u + g.measureText(m.note).width <= W - mx) g.fillText(m.note, W - mx, cr);
  else if (x + 60 * u + g.measureText('Drawn for illustration.').width <= W - mx) g.fillText('Drawn for illustration.', W - mx, cr);
  g.textAlign = 'left';
}

const loadImage = (src) =>
  new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('The diagram could not be saved as an image'));
    im.src = src;
  });

// The saved image of a still diagram: the diagram's SVG (laid out for the picture area) drawn into the frame, then the band. Same frame as the live save.
export async function stillFromSVG(svg, title, cite) {
  await fontsReady;
  const W = STILL_W,
    H = STILL_H,
    bodyH = H - bandHeight(W),
    vb = svg.viewBox.baseVal,
    img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))),
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d'),
    fit = Math.min(W / vb.width, bodyH / vb.height); // contain (an exact fit for the stage laid out at this aspect)
  g.fillStyle = '#070b17';
  g.fillRect(0, 0, W, H);
  g.drawImage(img, (W - vb.width * fit) / 2, (bodyH - vb.height * fit) / 2, vb.width * fit, vb.height * fit);
  const meta = stillMeta(sims.get(svg)?.cfg, title, cite);
  if (svg.dataset.explanation) {
    meta.source = `Source: ${String(cite || '').trim().replace(/[.;,\s]+$/, '')}.`;
    meta.note = 'Schematic diagram. Geometry is illustrative.';
  }
  drawBand(g, W, bodyH, meta);
  return c.toDataURL('image/png');
}
