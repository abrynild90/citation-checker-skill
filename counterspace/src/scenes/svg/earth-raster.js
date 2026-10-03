// ============================================================================
// scenes/svg/earth-raster.js: the Blue Marble re-projected for the static globe, and the vector coastline geometry used when it is not loaded
// ============================================================================
import { LAND, earthImg } from '../earth.js';

// Blue Marble re-projected for the static globe: every pixel of the disc is inverted through the orthographic projection to lon/lat and sampled
// (bilinear) from the equirectangular image; the result is drawn into a canvas and embedded as a data-URL <image> clipped to the sphere.
let earthPix = null,
  earthPixSrc = null;
// Supersampling of the last raster (read by renderSVG into the diagram's data-ss attribute).
export let lastSS = 0;
export function earthRaster(proj, CX, CY, R, win) {
  if (!earthImg) return null;
  try {
    if (earthPixSrc !== earthImg) {
      const sw = Math.min(2048, earthImg.naturalWidth || earthImg.width),
        c = document.createElement('canvas');
      c.width = sw;
      c.height = sw / 2;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(earthImg, 0, 0, sw, sw / 2);
      earthPix = { w: sw, h: sw / 2, d: g.getImageData(0, 0, sw, sw / 2).data };
      earthPixSrc = earthImg;
    }
    // Supersampled: at least 2x the CSS size of the disc (capped at 2000 px), so a phone-width diagram still exports a sharp Earth in the print-size PNG.
    const dpr = Math.max(2, Math.min(devicePixelRatio || 1, 3)),
      S = Math.max(64, Math.min(Math.round(2 * R * dpr), 2000)),
      k = (2 * R) / S,
      // win: only the part of the disc inside this window (svg px) is rasterised (a big limb in a small panel)
      wx0 = win ? Math.max(CX - R, win.x0) : CX - R,
      wy0 = win ? Math.max(CY - R, win.y0) : CY - R,
      wx1 = win ? Math.min(CX + R, win.x1) : CX + R,
      wy1 = win ? Math.min(CY + R, win.y1) : CY + R,
      SW = Math.max(1, Math.ceil((wx1 - wx0) / k)),
      SH = Math.max(1, Math.ceil((wy1 - wy0) / k)),
      c = document.createElement('canvas');
    c.width = SW;
    c.height = SH;
    lastSS = S / (2 * R);
    const g = c.getContext('2d'),
      out = g.createImageData(SW, SH),
      o = out.data,
      { w, h, d } = earthPix,
      x0 = wx0,
      y0 = wy0;
    for (let j = 0; j < SH; j++)
      for (let i = 0; i < SW; i++) {
        const px = x0 + (i + 0.5) * k,
          py = y0 + (j + 0.5) * k;
        if ((px - CX) ** 2 + (py - CY) ** 2 > R * R) continue;
        const ll = proj.invert([px, py]);
        if (!ll || !isFinite(ll[0])) continue;
        let u = (((((ll[0] + 180) / 360) % 1) + 1) % 1) * w - 0.5,
          v = ((90 - ll[1]) / 180) * h - 0.5;
        const ix = Math.floor(u),
          iy = Math.max(0, Math.min(h - 2, Math.floor(v))),
          fx = u - ix,
          fy = v - iy,
          ia = ((ix % w) + w) % w,
          ib = (((ix + 1) % w) + w) % w;
        const a = (iy * w + ia) * 4,
          b = (iy * w + ib) * 4,
          cc = ((iy + 1) * w + ia) * 4,
          dd = ((iy + 1) * w + ib) * 4,
          q = (j * SW + i) * 4;
        for (let ch = 0; ch < 3; ch++) o[q + ch] = (d[a + ch] * (1 - fx) + d[b + ch] * fx) * (1 - fy) + (d[cc + ch] * (1 - fx) + d[dd + ch] * fx) * fy;
        o[q + 3] = 255;
      }
    g.putImageData(out, 0, 0);
    return { url: c.toDataURL('image/jpeg', 0.9), x: wx0, y: wy0, w: SW * k, h: SH * k };
  } catch (e) {
    return null;
  }
}

// Land as one MultiPolygon. Ring winding is data-dependent: any ring that d3 reads as "more than a hemisphere" is reversed so it fills land,
// not the complement.
export function landGeometry() {
  return {
    type: 'MultiPolygon',
    coordinates: (LAND || []).map((r) => {
      const c = [];
      for (let k = 0; k < r.length; k += 2) c.push([r[k], r[k + 1]]);
      if (c.length > 2 && d3.geoArea({ type: 'Polygon', coordinates: [c] }) > 2 * Math.PI) c.reverse();
      return [c];
    }),
  };
}
