// ============================================================================
// scenes/gl-still.js: GLHost mixin: print-resolution PNG still (banner band, labels with leaders, footer with title/source/credit)
// (Concatenated into one module scope by tools/build_page.py; see src/scenes.js for the module map.)
// ============================================================================
Object.assign(GLHost.prototype, {
  // Print-resolution still: re-render at ~3000 px wide (capped by the GPU), draw labels and
  // the illustrative banner, caption and source into the PNG, then restore the live size.
  stillPNG(title, cite, targetW = 3000) {
    const vw = this.el.clientWidth, vh = this.el.clientHeight, pr = this.renderer.getPixelRatio();
    const maxDim = Math.min(this.maxTex, 4096), W = Math.min(targetW, maxDim, Math.floor(maxDim * vw / vh)), H = Math.round(W * vh / vw);
    // A scene may define its own still framing (cfg.stillCam) so the print image shows the whole subject and its labels, whatever the live camera shows.
    const cam = this.camera, keep = { pos: cam.position.clone(), tgt: this.target.clone(), hide: this.hideShell }, sc = this.sim.cfg.stillCam;
    if (sc) { this.hideShell = !!sc.hideShell; this._syncShell(); this.target.set(...(sc.look ? ll(...sc.look) : [0, 0, 0])); cam.position.set(...ll(...sc.at)); cam.up.set(0, 1, 0); cam.lookAt(this.target); cam.updateMatrixWorld(); }
    cam.clearViewOffset(); cam.updateProjectionMatrix(); this._viewShift = null;
    this.renderer.setPixelRatio(1); this.renderer.setSize(W, H, false); this._fitModels(); this._ptUniforms(); this.renderer.render(this.scene, this.camera);
    // Layout: header band (banner) | render | footer band (title, source, imagery credit). Nothing is drawn over the globe.
    const s = W / 1000, hb = Math.round(40 * s), fb = Math.round(92 * s);
    const c = document.createElement('canvas'); c.width = W; c.height = H + hb + fb;
    const g = c.getContext('2d'); g.fillStyle = '#070b17'; g.fillRect(0, 0, W, c.height); g.drawImage(this.canvas, 0, hb);
    // Status caption: wrapped to the frame first, so its box can be reserved before labels are placed.
    const status = this.status?.text(Math.min(this.t, 1)), lay = { W, H, boxes: [], segs: [] }; this.stillLayout = lay;
    let sLines = [], sBox = null; g.font = `${Math.round(12 * s)}px system-ui,sans-serif`;
    if (status) { const maxW = Math.min(W - 40 * s, 640 * s); let cur = ''; for (const wd of status.split(' ')) { const nx = cur ? cur + ' ' + wd : wd; if (cur && g.measureText(nx).width > maxW) { sLines.push(cur); cur = wd; } else cur = nx; } if (cur) sLines.push(cur);
      const tw = Math.max(...sLines.map(l => g.measureText(l).width)) + 24 * s, th = sLines.length * 16 * s + 10 * s; sBox = [W / 2 - tw / 2, H - 12 * s - th, tw, th]; lay.boxes.push({ n: 'STATUS', x: sBox[0], y: sBox[1], w: sBox[2], h: sBox[3] }); }
    const lp = this._labelPositions(W, H, s, true, sBox ? [sBox[0] - 3 * s, sBox[1] - 3 * s, sBox[2] + 6 * s, sBox[3] + 6 * s] : null);
    lay.objs = this._lastObjs; lay.obst = this._lastObst; lay.labels = lp; lay.sBox = sBox;
    g.textAlign = 'center'; g.lineJoin = 'round';
    for (const q of lp) { if (!q || !q.leader) continue; lay.segs.push({ x1: q.ax, y1: q.ay, x2: q.qx, y2: q.qy, own: q.text }); g.strokeStyle = q.color || '#dfe6f7'; g.globalAlpha = 0.75; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(q.ax, q.ay + hb); g.lineTo(q.qx, q.qy + hb); g.stroke(); g.globalAlpha = 1; }
    for (const q of lp) { if (!q) continue;
      g.font = `600 ${Math.round(11 * s)}px system-ui,sans-serif`; const tw = g.measureText(q.text).width + 12 * s; lay.boxes.push({ n: q.text, x: q.x - tw / 2, y: q.y - 9 * s, w: tw, h: 18 * s });
      g.fillStyle = 'rgba(5,8,18,0.8)'; g.beginPath(); g.roundRect(q.x - tw / 2, q.y + hb - 9 * s, tw, 18 * s, 4 * s); g.fill(); g.textBaseline = 'middle';
      g.fillStyle = q.color || '#dfe6f7'; g.fillText(q.text, q.x, q.y + hb); g.textBaseline = 'alphabetic'; }
    if (sBox) { g.font = `${Math.round(12 * s)}px system-ui,sans-serif`; g.fillStyle = 'rgba(5,8,18,0.78)'; g.fillRect(sBox[0], hb + sBox[1], sBox[2], sBox[3]); g.fillStyle = '#ffe08a'; g.textBaseline = 'middle';
      sLines.forEach((l, k) => g.fillText(l, W / 2, hb + sBox[1] + 5 * s + 8 * s + k * 16 * s)); g.textBaseline = 'alphabetic'; }
    g.textAlign = 'left';
    g.fillStyle = '#0b1120'; g.fillRect(0, 0, W, hb); g.fillRect(0, hb + H, W, fb);
    g.strokeStyle = 'rgba(255,224,138,0.28)'; g.lineWidth = Math.max(1, s); g.beginPath(); g.moveTo(0, hb - 0.5); g.lineTo(W, hb - 0.5); g.moveTo(0, hb + H + 0.5); g.lineTo(W, hb + H + 0.5); g.stroke();
    g.textBaseline = 'middle'; g.fillStyle = '#ffe08a'; g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
    g.fillText('Illustrative, not orbit-propagated · compressed radial scale', 16 * s, hb / 2);
    g.fillStyle = '#e9edf7'; g.font = `600 ${Math.round(22 * s)}px system-ui,sans-serif`; g.fillText(title, 16 * s, hb + H + 24 * s);
    // Source line (cite) and imagery credit each on their own line, at a readable size (shrunk only if a line would overflow).
    const credit = earthImg ? 'Earth imagery: NASA Blue Marble (public domain).' : 'Vector land map: Natural Earth (public domain).';
    const fit = (txt, px, y, col) => { let f = Math.round(px * s); g.font = `${f}px system-ui,sans-serif`; while (g.measureText(txt).width > W - 32 * s && f > 10 * s) { f -= 0.5 * s; g.font = `${f}px system-ui,sans-serif`; } g.fillStyle = col; g.fillText(txt, 16 * s, y); };
    fit(`Source: ${String(cite || '').trim().replace(/[.;,\s]+$/, '')}.`, 15, hb + H + 54 * s, '#c3cbe0');
    fit(credit, 15, hb + H + 77 * s, '#c3cbe0'); g.textBaseline = 'alphabetic';
    const url = c.toDataURL('image/png');
    if (sc) { cam.position.copy(keep.pos); this.target.copy(keep.tgt); this.hideShell = keep.hide; this._syncShell(); cam.lookAt(this.target); }
    this.renderer.setPixelRatio(pr); this.resize();
    return url;
  },
});
