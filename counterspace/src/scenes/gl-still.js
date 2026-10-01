// ============================================================================
// scenes/gl-still.js: GLHost mixin: print-resolution PNG still (banner band, labels with leaders, footer with title/source/credit)
// (ES module bundled by esbuild from src/boot.js; the GLHost methods here are installed by installGLStill(GLHost), see app.js.)
// ============================================================================
import { DEG, ll } from './core.js';
import { earthImg } from './earth.js';
import { STILL_ASPECT, stillFor } from './still-config.js';

const methods = {
  // Extent of the picture for recomposing: like _contentBox, but a whole-globe disc (and shells that fit about 1.2 frames) counts unclipped.
  _stillExtent(W, H, bandH) {
    const P = this._probe(W, H, true),
      d = P.disc;
    if (!d || !(d.r > 0)) return null;
    const whole = d.r < 1.3 * bandH;
    let x0 = 1e9,
      y0 = 1e9,
      x1 = -1e9,
      y1 = -1e9;
    const add = (x, y) => {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    };
    const inb = (x, y) => x > -W && x < 2 * W && y > -H && y < 2 * H;
    if (P.action) {
      add(P.action.x0, P.action.y0);
      add(P.action.x1, P.action.y1);
    }
    const disc = (c, r, free) => {
      if (free) {
        add(c.cx - r, c.cy - r);
        add(c.cx + r, c.cy + r);
      } else {
        add(Math.max(0, c.cx - r), Math.max(0, c.cy - r));
        add(Math.min(W, c.cx + r), Math.min(H, c.cy + r));
      }
    };
    if (whole || !P.action) disc(d, d.r, whole);
    for (const c of whole ? P.circles || [] : []) if (c.ring && c.r > 0 && inb(c.cx, c.cy)) disc(c, c.r, whole && c.r < 1.2 * bandH);
    // a craft is a few hundred px wide with its glow: pad the box so nothing sits on the frame edge
    const pad = 0.05;
    return x1 > x0 && y1 > y0 ? { x0: x0 - pad * W, y0: y0 - pad * H, x1: x1 + pad * W, y1: y1 + pad * H, whole } : null;
  },
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and
  // the illustrative banner, caption and source into the PNG, then restore the live size.
  // One frame of the still: the render, its labels with leaders and the status caption, drawn into a W x H canvas (no bands). `o.t` picks the scene time and
  // the act camera for that time (used for the tiles of a multi-episode still), `o.status` overrides the caption, `o.title` adds a title strip.
  _stillBody(W, H, o = {}) {
    const vw = this.el.clientWidth,
      vh = this.el.clientHeight;
    const cam = this.camera;
    if (o.t != null) this.update(o.t);
    const conf = { ...stillFor(this.sim.cfg.id), ...(o.cam || {}) },
      fixed = !!conf.pos;
    if (this.sim.flags) this.sim.flags.all = !!conf.all; // conf.all: every act at once (all episodes' orbits in one frame)
    if (conf.all) this.update(conf.t ?? this.t);
    if (conf.t != null && o.t == null && (this.t >= 0.98 || this.t <= 0.02)) this.update(conf.t); // untouched scrubber: use the scene's best frame
    const sf = fixed ? null : this.sim.stillCamFor?.(Math.min(this.t, 1), o.aspect || W / H),
      sc = sf || this.sim.cfg.stillCam;
    if (fixed) {
      this.hideShell = conf.hideShell ?? true;
      this._syncShell();
      this.target.set(...conf.look);
      cam.position.set(...conf.pos);
      cam.up.set(...(conf.up || [0, 1, 0]));
      cam.lookAt(this.target);
      cam.updateMatrixWorld();
    } else if (sf) {
      this.hideShell = true;
      this._syncShell();
      this.target.set(...(sf.look || [0, 0, 0]));
      cam.position.set(...sf.pos);
      cam.up.set(...(sf.up || [0, 1, 0]));
      cam.lookAt(this.target);
      cam.updateMatrixWorld();
    } else if (sc) {
      this.hideShell = !!sc.hideShell;
      this._syncShell();
      this.target.set(...(sc.look ? ll(...sc.look) : [0, 0, 0]));
      cam.position.set(...ll(...sc.at));
      cam.up.set(0, 1, 0);
      cam.lookAt(this.target);
      cam.updateMatrixWorld();
    }
    cam.clearViewOffset();
    cam.aspect = W / H;
    cam.fov = conf.fov ?? (2 * Math.atan(Math.tan(20 * DEG) * Math.max(1, 1.1 / cam.aspect))) / DEG;
    cam.updateProjectionMatrix();
    this._viewShift = null;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this._modelBoost = 1.4;
    const amb0 = this.ambient?.intensity;
    if (this.ambient) this.ambient.intensity = 0.62; // a lighter night side in the print
    this._fitModels();
    this._ptUniforms();
    this.renderer.render(this.scene, this.camera);
    // Recompose: the picture (Earth disc + everything that moves) is dollied until it fills the band above the caption, then centred in it. A whole-globe
    // composition (disc under ~1.3 band heights) is always shown whole and centred; a deliberate regional close-up keeps its crop and is only centred.
    const bandY0 = (o.title ? 0.17 : 0.04) * H, // a tile keeps clear of its title strip above and its (up to two-line) caption below
      bandH = (o.aspect ? 0.82 : 0.9) * H - bandY0,
      rerender = () => {
        cam.updateProjectionMatrix();
        this._fitModels();
        this._ptUniforms();
        this.renderer.render(this.scene, this.camera);
      };
    for (let it = 0; it < 3 && !fixed; it++) {
      const ex = this._stillExtent(W, H, bandH);
      if (!ex || !ex.whole) break;
      const k = Math.max((ex.x1 - ex.x0) / (0.92 * W), (ex.y1 - ex.y0) / (0.9 * bandH));
      if (Math.abs(k - 1) < 0.05) break;
      const kk = Math.max(0.55, Math.min(2.4, k)),
        v = cam.position.clone().sub(this.target).multiplyScalar(kk);
      cam.position.copy(this.target).add(v);
      cam.lookAt(this.target);
      cam.updateMatrixWorld();
      rerender();
    }
    const ex = fixed ? null : this._stillExtent(W, H, bandH);
    if (fixed && conf.shift) {
      cam.setViewOffset(W, H, -conf.shift[0] * W, -conf.shift[1] * H, W, H);
      rerender();
    }
    if (ex) {
      const cl = (v, m) => Math.max(-m, Math.min(m, v)),
        dx = cl(W / 2 - (ex.x0 + ex.x1) / 2, 0.4 * W),
        dy = cl(bandY0 + bandH / 2 - (ex.y0 + ex.y1) / 2, 0.4 * H);
      if (Math.abs(dx) > 0.005 * W || Math.abs(dy) > 0.005 * H) {
        cam.setViewOffset(W, H, -dx, -dy, W, H);
        rerender();
      }
    }
    const vo = cam.view && cam.view.enabled ? [-cam.view.offsetX / W, -cam.view.offsetY / H] : [0, 0];
    this._stillCam = { pos: cam.position.toArray(), look: this.target.toArray(), fov: cam.fov, shift: vo, hideShell: this.hideShell };
    this._modelBoost = 1;
    if (this.ambient) this.ambient.intensity = amb0;
    // tiles of a multi-episode still are 1000 px wide inside a 3000 px image: their text is scaled up so it reads at the same size
    const s = o.s ?? (W / 1000) * (o.aspect && !o.full ? 2.1 : 1),
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.drawImage(this.canvas, 0, 0);
    // Status caption: wrapped to the frame first, so its box can be reserved before labels are placed.
    const status = o.status ?? this.status?.text(Math.min(this.t, 1)),
      lay = { W, H, u: s, boxes: [], segs: [] };
    this.stillLayout = lay;
    let sLines = [],
      sBox = null;
    g.font = `${Math.round(12 * s)}px system-ui,sans-serif`;
    if (status) {
      const maxW = Math.min(W - 40 * s, 640 * s);
      let cur = '';
      for (const wd of status.split(' ')) {
        const nx = cur ? cur + ' ' + wd : wd;
        if (cur && g.measureText(nx).width > maxW) {
          sLines.push(cur);
          cur = wd;
        } else cur = nx;
      }
      if (cur) sLines.push(cur);
      const tw = Math.max(...sLines.map((l) => g.measureText(l).width)) + 24 * s,
        th = sLines.length * 16 * s + 10 * s;
      sBox = [W / 2 - tw / 2, H - 12 * s - th, tw, th];
      lay.boxes.push({ n: 'STATUS', x: sBox[0], y: sBox[1], w: sBox[2], h: sBox[3] });
    }
    const tBox = o.title ? [0, 0, W, 26 * s] : null,
      rsv = [];
    if (sBox) rsv.push([sBox[0] - 3 * s, sBox[1] - 3 * s, sBox[2] + 6 * s, sBox[3] + 6 * s]);
    if (tBox) rsv.push(tBox);
    const ls = s * (conf.labelK ?? 1.7), // labels are drawn 1.7x the caption size so they read in a 3000 px print
      lp = this._labelPositions(W, H, ls, true, rsv).map((q) => (q && conf.hide?.some((h) => q.text.startsWith(h)) ? null : q));
    lay.u = ls;
    lay.objs = this._lastObjs;
    lay.probe = this._probe(W, H);
    lay.obst = this._lastObst;
    lay.labels = lp;
    lay.sBox = sBox;
    lay.rsv = rsv;
    g.textAlign = 'center';
    g.lineJoin = 'round';
    const rawL = this._lastPlace?.[0] || [];
    lp.forEach((q, i) => {
      // every label that sits away from its subject gets a leader to the box edge nearest the subject
      const r = rawL[i];
      if (!q || q.leader || !r) return;
      const hw = q.w / 2,
        hh = q.h / 2,
        cx = Math.max(q.x - hw, Math.min(q.x + hw, r.px)),
        cy = Math.max(q.y - hh, Math.min(q.y + hh, r.py));
      if (Math.hypot(cx - r.px, cy - r.py) > 7 * ls) Object.assign(q, { leader: true, ax: cx, ay: cy, qx: r.px, qy: r.py, auto: true });
    });
    for (const q of lp) {
      if (!q || !q.leader) continue;
      lay.segs.push({ x1: q.ax, y1: q.ay, x2: q.qx, y2: q.qy, own: q.text });
      g.strokeStyle = q.color || '#dfe6f7';
      g.globalAlpha = 0.75;
      g.lineWidth = 1.8 * s;
      g.beginPath();
      g.moveTo(q.ax, q.ay);
      g.lineTo(q.qx, q.qy);
      g.stroke();
      g.globalAlpha = 1;
    }
    for (const q of lp) {
      if (!q) continue;
      g.font = `600 ${Math.round(11 * ls)}px system-ui,sans-serif`;
      const tw = g.measureText(q.text).width + 12 * ls;
      lay.boxes.push({ n: q.text, x: q.x - tw / 2, y: q.y - 9 * ls, w: tw, h: 18 * ls });
      g.fillStyle = 'rgba(5,8,18,0.8)';
      g.beginPath();
      g.roundRect(q.x - tw / 2, q.y - 9 * ls, tw, 18 * ls, 4 * ls);
      g.fill();
      g.textBaseline = 'middle';
      g.fillStyle = q.color || '#dfe6f7';
      g.fillText(q.text, q.x, q.y);
      g.textBaseline = 'alphabetic';
    }
    if (sBox) {
      g.font = `${Math.round(12 * s)}px system-ui,sans-serif`;
      g.fillStyle = 'rgba(5,8,18,0.78)';
      g.fillRect(sBox[0], sBox[1], sBox[2], sBox[3]);
      g.fillStyle = '#ffe08a';
      g.textBaseline = 'middle';
      sLines.forEach((l, k) => g.fillText(l, W / 2, sBox[1] + 5 * s + 8 * s + k * 16 * s));
      g.textBaseline = 'alphabetic';
    }
    if (o.title) {
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      let fs = 13 * s;
      for (; fs > 8 * s; fs -= 0.5 * s) {
        g.font = `700 ${Math.round(fs)}px system-ui,sans-serif`;
        if (g.measureText(o.title).width + 16 * s <= W) break;
      }
      const tw = g.measureText(o.title).width + 16 * s;
      g.fillStyle = 'rgba(5,8,18,0.85)';
      g.fillRect(0, 0, Math.min(W, tw), 26 * s);
      g.fillStyle = '#ffe08a';
      g.fillText(o.title, 8 * s, 13 * s);
      g.textBaseline = 'alphabetic';
    }
    return c;
  },
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and the illustrative banner, caption and source into the PNG, then
  // restore the live size. Scenes with cfg.panels (three unrelated episodes) get a composite: one tile per episode, each with its own camera, title
  // and caption.
  stillPNG(title, cite, targetW = 3000) {
    const vw = this.el.clientWidth,
      vh = this.el.clientHeight,
      pr = this.renderer.getPixelRatio();
    const maxDim = Math.min(this.maxTex, 4096),
      panels = this.sim.cfg.panels,
      conf = stillFor(this.sim.cfg.id),
      // a multi-episode still lays its tiles side by side (tileW x tileH each, native resolution, no upscaling)
      tileW = panels ? Math.min(Math.floor(targetW / panels.length), Math.floor(maxDim / panels.length)) : 0,
      tileH = panels ? Math.round(tileW * (conf.tileAspect ?? 1.3)) : 0,
      W = panels ? tileW * panels.length : Math.min(targetW, maxDim),
      H = panels ? tileH : Math.round(W / STILL_ASPECT);
    const cam = this.camera,
      keep = {
        pos: cam.position.clone(),
        tgt: this.target.clone(),
        hide: this.hideShell,
        up: cam.up.clone(),
        all: !!this.sim.flags?.all,
        t: this.t,
        aspect: cam.aspect,
        fov: cam.fov,
      };
    let body,
      tileLays = null;
    if (panels) {
      body = document.createElement('canvas');
      body.width = W;
      body.height = H;
      const bg = body.getContext('2d');
      tileLays = [];
      panels.forEach((pn, k) => {
        const tile = this._stillBody(tileW, tileH, {
          t: pn.t,
          aspect: tileW / tileH,
          full: true,
          s: tileW / 1000 * (conf.tileS ?? 2.3),
          status: pn.status,
          title: `${pn.title} · ${pn.brief}`,
          cam: conf.panels?.[k],
        });
        bg.drawImage(tile, k * tileW, 0);
        bg.strokeStyle = 'rgba(255,224,138,0.5)';
        bg.lineWidth = Math.max(2, W / 1000);
        bg.strokeRect(k * tileW + 0.5, 0.5, tileW - 1, tileH - 1);
        tileLays.push({ ...this.stillLayout, ox: k * tileW });
      });
      this.update(keep.t);
    } else body = this._stillBody(W, H, {});
    const lay = this.stillLayout;
    if (tileLays) lay.tiles = tileLays;
    const s = W / 1000,
      hb = Math.round(40 * s),
      fb = Math.round(92 * s);
    const c = document.createElement('canvas');
    c.width = body.width;
    c.height = body.height + hb + fb;
    const g = c.getContext('2d');
    g.fillStyle = '#070b17';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(body, 0, hb);
    g.textAlign = 'left';
    g.fillStyle = '#0b1120';
    g.fillRect(0, 0, W, hb);
    g.fillRect(0, hb + body.height, W, fb);
    g.strokeStyle = 'rgba(255,224,138,0.28)';
    g.lineWidth = Math.max(1, s);
    g.beginPath();
    g.moveTo(0, hb - 0.5);
    g.lineTo(W, hb - 0.5);
    g.moveTo(0, hb + body.height + 0.5);
    g.lineTo(W, hb + body.height + 0.5);
    g.stroke();
    g.textBaseline = 'middle';
    g.fillStyle = '#ffe08a';
    g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
    g.fillText('Illustrative, not orbit-propagated · compressed radial scale', 16 * s, hb / 2);
    g.fillStyle = '#e9edf7';
    g.font = `600 ${Math.round(22 * s)}px system-ui,sans-serif`;
    g.fillText(title, 16 * s, hb + body.height + 24 * s);
    // Source line (cite) and imagery credit each on their own line, at a readable size (shrunk only if a line would overflow).
    const credit = earthImg ? 'Earth imagery: NASA Blue Marble (public domain).' : 'Vector land map: Natural Earth (public domain).';
    // Both footer lines share one font size: the largest (up to 15 px units) at which the longer line still fits.
    const srcTxt = `Source: ${String(cite || '')
      .trim()
      .replace(/[.;,\s]+$/, '')}.`;
    let f = Math.round(15 * s);
    for (; f > 10 * s; f -= 0.5 * s) {
      g.font = `${f}px system-ui,sans-serif`;
      if (Math.max(g.measureText(srcTxt).width, g.measureText(credit).width) <= W - 32 * s) break;
    }
    g.font = `${f}px system-ui,sans-serif`;
    g.fillStyle = '#c3cbe0';
    g.fillText(srcTxt, 16 * s, hb + body.height + 54 * s);
    g.fillText(credit, 16 * s, hb + body.height + 77 * s);
    g.textBaseline = 'alphabetic';
    const url = c.toDataURL('image/png');
    if (this.sim.flags) this.sim.flags.all = keep.all;
    if (this.t !== keep.t || conf.all) this.update(keep.t);
    cam.position.copy(keep.pos);
    this.target.copy(keep.tgt);
    this.hideShell = keep.hide;
    this._syncShell();
    cam.up.copy(keep.up);
    cam.lookAt(this.target);
    cam.clearViewOffset();
    cam.fov = keep.fov;
    cam.aspect = keep.aspect;
    this.renderer.setPixelRatio(pr);
    this.resize();
    return url;
  },
};

// Adds this file's methods to GLHost.prototype. Called once from app.js, after gl-host.js is loaded and before any scene opens.
export function installGLStill(GLHost) {
  Object.assign(GLHost.prototype, methods);
  // Reduced motion / no WebGL: there is no GL host, so window.__cs.host() is null and host().stillPNG() threw. Give __cs.host() a static stand-in whose
  // stillPNG(title, cite) rasterises the SVG diagram (same print layout) through exportStill; it returns a Promise of the PNG data URL.
  const wrap = (cs) => {
    const real = cs.host;
    if (typeof real !== 'function') return cs;
    cs.host = () => real() || { static: true, stillPNG: () => cs.exportStill() };
    return cs;
  };
  if (window.__cs) wrap(window.__cs);
  else {
    let v;
    Object.defineProperty(window, '__cs', { configurable: true, get: () => v, set: (x) => { v = wrap(x); } });
  }
}
