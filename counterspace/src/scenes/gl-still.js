// ============================================================================
// scenes/gl-still.js: GLHost mixin: print-resolution PNG still (banner band, labels with leaders, footer with title/source/credit)
// (ES module bundled by esbuild from src/boot.js; the GLHost methods here are installed by installGLStill(GLHost), see app.js.)
// ============================================================================
import { DEG, ll } from './core.js';
import { earthImg } from './earth.js';

const methods = {
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and
  // the illustrative banner, caption and source into the PNG, then restore the live size.
  // One frame of the still: the render, its labels with leaders and the status caption, drawn into a W x H canvas (no bands). `o.t` picks the scene time and
  // the act camera for that time (used for the tiles of a multi-episode still), `o.status` overrides the caption, `o.title` adds a title strip.
  _stillBody(W, H, o = {}) {
    const vw = this.el.clientWidth,
      vh = this.el.clientHeight;
    const cam = this.camera;
    if (o.t != null) this.update(o.t);
    const sf = this.sim.stillCamFor?.(Math.min(this.t, 1), o.aspect || W / H),
      sc = sf || this.sim.cfg.stillCam;
    if (sf) {
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
    if (o.aspect) {
      cam.aspect = o.aspect;
      cam.fov = (2 * Math.atan(Math.tan(20 * DEG) * Math.max(1, 1.1 / o.aspect))) / DEG;
    }
    cam.updateProjectionMatrix();
    this._viewShift = null;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this._fitModels();
    this._ptUniforms();
    this.renderer.render(this.scene, this.camera);
    const s = W / 1000,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.drawImage(this.canvas, 0, 0);
    // Status caption: wrapped to the frame first, so its box can be reserved before labels are placed.
    const status = o.status ?? this.status?.text(Math.min(this.t, 1)),
      lay = { W, H, boxes: [], segs: [] };
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
    const lp = this._labelPositions(W, H, s, true, rsv);
    lay.objs = this._lastObjs;
    lay.probe = this._probe(W, H);
    lay.obst = this._lastObst;
    lay.labels = lp;
    lay.sBox = sBox;
    lay.rsv = rsv;
    g.textAlign = 'center';
    g.lineJoin = 'round';
    for (const q of lp) {
      if (!q || !q.leader) continue;
      lay.segs.push({ x1: q.ax, y1: q.ay, x2: q.qx, y2: q.qy, own: q.text });
      g.strokeStyle = q.color || '#dfe6f7';
      g.globalAlpha = 0.75;
      g.lineWidth = 1.2 * s;
      g.beginPath();
      g.moveTo(q.ax, q.ay);
      g.lineTo(q.qx, q.qy);
      g.stroke();
      g.globalAlpha = 1;
    }
    for (const q of lp) {
      if (!q) continue;
      g.font = `600 ${Math.round(11 * s)}px system-ui,sans-serif`;
      const tw = g.measureText(q.text).width + 12 * s;
      lay.boxes.push({ n: q.text, x: q.x - tw / 2, y: q.y - 9 * s, w: tw, h: 18 * s });
      g.fillStyle = 'rgba(5,8,18,0.8)';
      g.beginPath();
      g.roundRect(q.x - tw / 2, q.y - 9 * s, tw, 18 * s, 4 * s);
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
      g.font = `700 ${Math.round(13 * s)}px system-ui,sans-serif`;
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
  // restore the live size. Scenes with cfg.panels (three unrelated episodes) get a composite: one tile per episode, each with its own camera, title and caption.
  stillPNG(title, cite, targetW = 3000) {
    const vw = this.el.clientWidth,
      vh = this.el.clientHeight,
      pr = this.renderer.getPixelRatio();
    const maxDim = Math.min(this.maxTex, 4096),
      W = Math.min(targetW, maxDim, Math.floor((maxDim * vw) / vh)),
      panels = this.sim.cfg.panels,
      H = panels ? Math.round(W / panels.length / 1.25) : Math.round((W * vh) / vw);
    const cam = this.camera,
      keep = { pos: cam.position.clone(), tgt: this.target.clone(), hide: this.hideShell, up: cam.up.clone(), t: this.t, aspect: cam.aspect, fov: cam.fov };
    let body,
      tileLays = null;
    if (panels) {
      const tw = Math.floor(W / panels.length);
      body = document.createElement('canvas');
      body.width = tw * panels.length;
      body.height = H;
      const bg = body.getContext('2d');
      tileLays = [];
      panels.forEach((pn, k) => {
        const tile = this._stillBody(tw, H, { t: pn.t, aspect: tw / H, status: pn.status, title: `${pn.title} · ${pn.brief}` });
        bg.drawImage(tile, k * tw, 0);
        bg.strokeStyle = 'rgba(255,224,138,0.5)';
        bg.lineWidth = Math.max(1, W / 1000);
        bg.strokeRect(k * tw + 0.5, 0.5, tw - 1, H - 1);
        tileLays.push({ ...this.stillLayout, ox: k * tw });
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
    c.height = H + hb + fb;
    const g = c.getContext('2d');
    g.fillStyle = '#070b17';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(body, 0, hb);
    g.textAlign = 'left';
    g.fillStyle = '#0b1120';
    g.fillRect(0, 0, W, hb);
    g.fillRect(0, hb + H, W, fb);
    g.strokeStyle = 'rgba(255,224,138,0.28)';
    g.lineWidth = Math.max(1, s);
    g.beginPath();
    g.moveTo(0, hb - 0.5);
    g.lineTo(W, hb - 0.5);
    g.moveTo(0, hb + H + 0.5);
    g.lineTo(W, hb + H + 0.5);
    g.stroke();
    g.textBaseline = 'middle';
    g.fillStyle = '#ffe08a';
    g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
    g.fillText('Illustrative, not orbit-propagated · compressed radial scale', 16 * s, hb / 2);
    g.fillStyle = '#e9edf7';
    g.font = `600 ${Math.round(22 * s)}px system-ui,sans-serif`;
    g.fillText(title, 16 * s, hb + H + 24 * s);
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
    g.fillText(srcTxt, 16 * s, hb + H + 54 * s);
    g.fillText(credit, 16 * s, hb + H + 77 * s);
    g.textBaseline = 'alphabetic';
    const url = c.toDataURL('image/png');
    cam.position.copy(keep.pos);
    this.target.copy(keep.tgt);
    this.hideShell = keep.hide;
    this._syncShell();
    cam.up.copy(keep.up);
    cam.lookAt(this.target);
    this.renderer.setPixelRatio(pr);
    this.resize();
    return url;
  },
};

// Adds this file's methods to GLHost.prototype. Called once from app.js, after gl-host.js is loaded and before any scene opens.
export function installGLStill(GLHost) {
  Object.assign(GLHost.prototype, methods);
}
