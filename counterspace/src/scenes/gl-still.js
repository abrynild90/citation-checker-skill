// ============================================================================
// scenes/gl-still.js: GLHost mixin: print-resolution PNG still (banner band, labels with leaders, footer with title/source/credit)
// (ES module bundled by esbuild from src/boot.js; the GLHost methods here are installed by installGLStill(GLHost), see app.js.)
// ============================================================================
import { DEG, ll } from './core.js';
import { STILL_ASPECT, stillFor } from './still-config.js';
import { SANS, fontsReady } from '../fonts.js';
import { renderSVG } from './svg-fallback.js';
import { bandHeight, drawBand, simOf, stillFileName, stillFromSVG, stillMeta } from './svg/still-frame.js';

// A label pill in the box the placer gave it (w x h), in the shared look: hairline border, a dot of the item's colour at the left, text in ink. The type is
// sized from the box, so it follows whatever label scale the placer used, and shrinks only if the text would not fit.
function canvasPill(g, x, y, w, h, text, { color, dot, quiet }) {
  const sc = h / 23,
    padX = 9 * sc,
    dotD = dot ? 7 * sc : 0,
    gap = dot ? 6 * sc : 0;
  g.font = `600 100px ${SANS}`;
  const per = g.measureText(text).width / 100,
    fs = Math.min(12.5 * sc, (w - 2 * padX - dotD - gap) / per),
    cw = dotD + gap + per * fs;
  g.save();
  if (quiet) g.globalAlpha = 0.85;
  g.fillStyle = 'rgba(8,13,28,.72)';
  g.strokeStyle = 'rgba(150,175,230,.35)';
  g.lineWidth = Math.max(1.5, sc);
  g.beginPath();
  g.roundRect(x - w / 2, y - h / 2, w, h, 8 * sc);
  g.fill();
  g.stroke();
  let tx = x - cw / 2;
  if (dot) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(tx + dotD / 2, y, dotD / 2, 0, 2 * Math.PI);
    g.fill();
    tx += dotD + gap;
  }
  g.font = `600 ${fs}px ${SANS}`;
  g.fillStyle = '#eef2fb';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(text, tx, y + fs * 0.04);
  g.restore();
}

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
    const pad = W < 2000 ? 0.07 : 0.05; // a tile of a composite pads more: its craft sprites are a large share of its width
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
    // A fixed still camera is framed for one moment, so it always renders at conf.t; auto-framed stills keep a user-scrubbed time.
    if (conf.t != null && o.t == null && (fixed || this.t >= 0.98 || this.t <= 0.02)) this.update(conf.t);
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
    this._modelBoost = conf.modelBoost ?? 1.4; // print stills draw craft larger; a scene may raise it (conf.modelBoost)
    const amb0 = this.ambient?.intensity;
    if (this.ambient) this.ambient.intensity = 0.62; // a lighter night side in the print
    for (const g of this.gapRings || []) if (g.near) g.mat.uniforms.uNear.value.w = 0; // the print frames its own view: the whole ring (the next live update restores the arc)
    this._fitModels();
    this._ptUniforms();
    this.renderer.render(this.scene, this.camera);
    // Recompose: the picture (Earth disc + everything that moves) is dollied until it fills the band above the caption, then centred in it. A whole-globe
    // composition (disc under ~1.3 band heights) is always shown whole and centred; a deliberate regional close-up keeps its crop and is only centred.
    const bandY0 = (o.title ? 0.1 : 0.04) * H, // a tile keeps clear of its title strip above and its (up to two-line) caption below
      bandH = (o.aspect ? 0.9 : 0.9) * H - bandY0,
      rerender = () => {
        cam.updateProjectionMatrix();
        this._fitModels();
        this._ptUniforms();
        this.renderer.render(this.scene, this.camera);
      };
    for (let it = 0; it < 3 && !fixed; it++) {
      const ex = this._stillExtent(W, H, bandH);
      if (!ex || !ex.whole) break;
      const k = Math.max((ex.x1 - ex.x0) / (0.92 * W), (ex.y1 - ex.y0) / (0.96 * bandH));
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
    // the caption is drawn at the size of the static still's (12 px in a 760 px diagram, about 47 px at 3000 px): 1.32 x the base unit
    const cs = s * 1.32;
    g.font = `${Math.round(12 * cs)}px ${SANS}`;
    if (status) {
      const maxW = Math.min(W - 40 * s, 640 * cs);
      let cur = '';
      for (const wd of status.split(' ')) {
        const nx = cur ? cur + ' ' + wd : wd;
        if (cur && g.measureText(nx).width > maxW) {
          sLines.push(cur);
          cur = wd;
        } else cur = nx;
      }
      if (cur) sLines.push(cur);
      const tw = Math.max(...sLines.map((l) => g.measureText(l).width)) + 24 * cs,
        th = sLines.length * 16 * cs + 10 * cs;
      sBox = [W / 2 - tw / 2, H - 12 * s - th, tw, th];
      lay.boxes.push({ n: 'STATUS', x: sBox[0], y: sBox[1], w: sBox[2], h: sBox[3] });
    }
    const tBox = o.title ? [0, 0, W, 26 * s] : null,
      rsv = [];
    if (sBox) rsv.push([sBox[0] - 3 * s, sBox[1] - 3 * s, sBox[2] + 6 * s, sBox[3] + 6 * s]);
    if (tBox) rsv.push(tBox);
    const ls = s * (conf.labelK ?? 1.3), // labels are drawn 1.3x the caption size: about 43 px type in a 3000 px print
      lp = this._labelPositions(W, H, ls, true, rsv).map((q) => (q && conf.hide?.some((h) => q.text.startsWith(h)) ? null : q));
    // conf.off: { 'Label text start': [dx, dy] } puts that label at its referent plus a fraction of the frame width (the placer's choice is overridden)
    Object.entries(conf.off || {}).forEach(([n, d]) => {
      const i = lp.findIndex((q) => q && q.text.startsWith(n)),
        r = this._lastPlace?.[0]?.[i];
      if (i >= 0 && r) Object.assign(lp[i], { x: r.px + d[0] * W, y: r.py + d[1] * W });
    });
    lay.u = ls;
    lay.objs = this._lastObjs;
    lay.probe = this._probe(W, H);
    lay.obst = this._lastObst;
    lay.labels = lp;
    lay.raw = lp.map((q, i) => (q && this._lastPlace?.[0]?.[i] ? [this._lastPlace[0][i].px, this._lastPlace[0][i].py] : null));
    lay.sBox = sBox;
    lay.rsv = rsv;
    g.textAlign = 'center';
    g.lineJoin = 'round';
    const rawL = this._lastPlace?.[0] || [];
    lp.forEach((q, i) => {
      // every label that sits away from its subject gets a leader to the box edge nearest the subject
      const r = rawL[i];
      if (!q || !r) return; // a placer stub is replaced too: the leader always runs from the referent to the chip edge
      g.font = `600 ${Math.round(11 * ls)}px ${SANS}`;
      const hw = (g.measureText(q.text).width + 12 * ls) / 2, // the drawn chip, not the placer's box: the leader reaches its edge
        hh = 9 * ls,
        cx = Math.max(q.x - hw, Math.min(q.x + hw, r.px)),
        cy = Math.max(q.y - hh, Math.min(q.y + hh, r.py));
      // ax/ay = the referent, qx/qy = the box edge (as _labelPositions)
      if (Math.hypot(cx - r.px, cy - r.py) > 1.2 * ls) Object.assign(q, { leader: true, ax: r.px, ay: r.py, qx: cx, qy: cy, auto: true });
    });
    for (const q of lp) {
      if (!q || !q.leader) continue;
      lay.segs.push({ x1: q.ax, y1: q.ay, x2: q.qx, y2: q.qy, own: q.text });
      g.strokeStyle = 'rgba(238,242,251,.6)';
      g.lineWidth = Math.max(4.4, 2.1 * s); // visible weight: >= 4 px in a 3000 px still (the checker enforces it)
      lay.leadW = g.lineWidth;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(q.ax, q.ay);
      g.lineTo(q.qx, q.qy);
      g.stroke();
      g.beginPath();
      g.arc(q.ax, q.ay, g.lineWidth * 1.1, 0, 2 * Math.PI);
      g.fillStyle = 'rgba(238,242,251,.6)';
      g.fill();
    }
    // the shared label look: a pill with a hairline border and a dot of the item's colour (places and orbit names carry no dot and are a little quieter)
    lp.forEach((q, i) => {
      if (!q) return;
      const L = this.labels[i],
        quiet = L?.cls === 'shell' || L?.item?.shape === 'site' || !!L?.item?.orbit;
      lay.boxes.push({ n: q.text, x: q.x - q.w / 2, y: q.y - q.h / 2, w: q.w, h: q.h });
      canvasPill(g, q.x, q.y, q.w, q.h, q.text, { color: q.color || '#dfe6f7', dot: !quiet, quiet });
    });
    if (sBox) {
      // the caption: one pill in the warm accent
      g.fillStyle = 'rgba(8,13,28,.72)';
      g.strokeStyle = 'rgba(150,175,230,.35)';
      g.lineWidth = Math.max(2, 0.9 * s);
      g.beginPath();
      g.roundRect(sBox[0], sBox[1], sBox[2], sBox[3], 8 * s * 1.3);
      g.fill();
      g.stroke();
      g.font = `500 ${Math.round(12 * cs)}px ${SANS}`;
      g.fillStyle = '#ffc86b';
      g.textBaseline = 'middle';
      sLines.forEach((l, k) => g.fillText(l, W / 2, sBox[1] + 5 * cs + 8 * cs + k * 16 * cs));
      g.textBaseline = 'alphabetic';
    }
    if (o.title) {
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      let fs = 13 * s;
      for (; fs > 8 * s; fs -= 0.5 * s) {
        g.font = `600 ${Math.round(fs)}px ${SANS}`;
        if (g.measureText(o.title).width + 24 * s <= W) break;
      }
      const tw = g.measureText(o.title).width + 24 * s;
      g.fillStyle = 'rgba(8,13,28,.72)';
      g.strokeStyle = 'rgba(150,175,230,.35)';
      g.lineWidth = Math.max(2, 0.9 * s);
      g.beginPath();
      g.roundRect(6 * s, 4 * s, Math.min(W - 12 * s, tw), 22 * s, 8 * s);
      g.fill();
      g.stroke();
      g.fillStyle = '#eef2fb';
      g.fillText(o.title, 18 * s, 15 * s);
      g.textBaseline = 'alphabetic';
    }
    return c;
  },
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and the illustrative banner, caption and source into the PNG, then
  // restore the live size. Scenes with cfg.panels (three unrelated episodes) get a composite: one tile per episode, each with its own camera, title
  // and caption.
  stillPNG(title, cite, targetW = 3000) {
    // Canvas text must not be measured with fallback metrics: if the faces are still loading (only possible in the first moments), wait.
    if (document.fonts && document.fonts.status !== 'loaded') return fontsReady.then(() => this.stillPNG(title, cite, targetW));
    const vw = this.el.clientWidth,
      vh = this.el.clientHeight,
      pr = this.renderer.getPixelRatio();
    const maxDim = Math.min(this.maxTex, 4096),
      panels = this.sim.cfg.panels,
      conf = stillFor(this.sim.cfg.id),
      // a multi-episode still lays its tiles side by side (tileW x tileH each, native resolution, no upscaling)
      tileW = panels ? Math.min(Math.floor(targetW / panels.length), Math.floor(maxDim / panels.length)) : 0,
      W = panels ? tileW * panels.length : Math.min(targetW, maxDim),
      // every still is exactly W x (W / STILL_ASPECT) in total: the picture, then the band (title, context, source, credit)
      H = Math.round(W / STILL_ASPECT) - bandHeight(W),
      // a multi-episode still shows landscape tiles (title strip above, large caption below, all centred in the body)
      tileH = panels ? Math.round(H * (conf.tileHK ?? 0.7)) : 0;
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
          s: (tileW / 1000) * (conf.tileS ?? 2.3),
          status: '',
          cam: conf.panels?.[k],
        });
        const sz = 1,
          ty = Math.round((H - tileH) / 2),
          wrap = (txt, maxW) => {
            const out = [];
            let cur = '';
            for (const wd of txt.split(' ')) {
              const nx = cur ? cur + ' ' + wd : wd;
              if (cur && bg.measureText(nx).width > maxW) (out.push(cur), (cur = wd));
              else cur = nx;
            }
            return cur ? [...out, cur] : out;
          };
        bg.drawImage(tile, k * tileW, ty);
        bg.strokeStyle = 'rgba(150,175,230,.35)';
        bg.lineWidth = Math.max(2, W / 1000);
        bg.strokeRect(k * tileW + 0.5, ty + 0.5, tileW - 1, tileH - 1);
        bg.textAlign = 'left';
        bg.textBaseline = 'top';
        bg.fillStyle = '#eef2fb';
        bg.font = `600 ${44 * sz}px ${SANS}`;
        wrap(`${pn.title} · ${pn.brief}`, tileW - 36 * sz)
          .slice(0, 2)
          .forEach((l, i, a) => bg.fillText(l, k * tileW + 18 * sz, ty - (a.length - i) * 54 * sz - 8 * sz));
        bg.fillStyle = '#b3bdd6';
        bg.font = `${40 * sz}px ${SANS}`;
        if (pn.status) wrap(pn.status, tileW - 36 * sz).forEach((l, i) => bg.fillText(l, k * tileW + 18 * sz, ty + tileH + 16 * sz + i * 52 * sz));
        bg.textBaseline = 'alphabetic';
        tileLays.push({ ...this.stillLayout, ox: k * tileW, oy: ty });
      });
      this.update(keep.t);
    } else body = this._stillBody(W, H, {});
    const lay = this.stillLayout;
    if (tileLays) lay.tiles = tileLays;
    const c = document.createElement('canvas');
    c.width = body.width;
    c.height = body.height + bandHeight(W);
    const g = c.getContext('2d');
    g.fillStyle = '#070b17';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(body, 0, 0);
    drawBand(g, W, body.height, stillMeta(this.sim.cfg, title, cite));
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
  // The saved image of an open still diagram is laid out afresh for the picture area (a 760 px stage, so its labels come out large in the 3000 px image) and
  // framed like the live save. The page's own save button calls src/scene-ui.js, which should hand its diagram to stillFromSVG the same way.
  const diagramStill = async () => {
    const node = document.querySelector('#sceneView > svg'),
      sim = node && simOf(node);
    if (!sim || !document.getElementById('overlay')?.classList.contains('open')) return null;
    const tmp = document.createElement('div');
    tmp.setAttribute('aria-hidden', 'true');
    tmp.style.cssText = 'position:fixed;left:-10000px;top:0;width:760px;height:375px;overflow:hidden';
    document.body.appendChild(tmp);
    try {
      const printed = renderSVG(sim, tmp, undefined, { print: true });
      if (window.__cs) window.__cs.lastStillLay = printed?.__lay; // test hook: the print layout's probe (craft sizes, Earth disc)
      return await stillFromSVG(printed, sim.cfg.title, sim.cfg.cite);
    } finally {
      tmp.remove();
    }
  };
  const wrap = (cs) => {
    const real = cs.host,
      realExport = cs.exportStill;
    if (typeof real !== 'function') return cs;
    cs.host = () => real() || { static: true, stillPNG: () => cs.exportStill() };
    cs.exportStill = async () => (real() ? realExport() : ((await diagramStill()) ?? realExport()));
    cs.stillFromSVG = stillFromSVG; // for the page's save button
    cs.stillFileName = stillFileName;
    return cs;
  };
  if (window.__cs) wrap(window.__cs);
  else {
    let v;
    Object.defineProperty(window, '__cs', {
      configurable: true,
      get: () => v,
      set: (x) => {
        v = wrap(x);
      },
    });
  }
}
