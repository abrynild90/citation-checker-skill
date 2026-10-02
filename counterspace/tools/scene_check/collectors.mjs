// scene_check collectors: functions run inside the page (via page.evaluate, so each must be self-contained) that measure one scene state,
// plus discVisible (Node side). Imported by tools/scene_check.mjs.
// ---------------------------------------------------------------- in-page collectors
export const LIVE = (KEYS) => {
  const h = window.__cs.host(),
    el = h.el,
    er = el.getBoundingClientRect(),
    W = el.clientWidth,
    H = el.clientHeight;
  const rel = (e) => {
    const b = e.getBoundingClientRect();
    return { x0: b.left - er.left, y0: b.top - er.top, x1: b.right - er.left, y1: b.bottom - er.top };
  };
  const labels = [];
  h.labels.forEach((Lb) => {
    if (Lb.d.style.display === 'none') return;
    const r = rel(Lb.d),
      o = {
        text: Lb.d.textContent,
        ...r,
        item: Lb.item ? h.sim.items.indexOf(Lb.item) : -1,
        leader: null,
        ref: [Lb.ax, Lb.ay],
        onDisc: W < 520 && !!(h.sim.cfg.phoneOnDisc || []).some((q) => Lb.d.textContent.startsWith(q)),
      }; // cfg.phoneOnDisc: phone labels allowed on the disc
    if (Lb.ln && Lb.ln.style.display !== 'none') o.leader = ['x1', 'y1', 'x2', 'y2'].map((a) => +Lb.ln.getAttribute(a));
    labels.push(o);
  });
  const reserved = [];
  const bn = el.querySelector('.illus');
  if (bn) reserved.push({ n: 'banner', ...rel(bn) });
  if (h.statusEl && h.statusEl.textContent) reserved.push({ n: 'status', ...rel(h.statusEl) });
  if (h.chipEl && h.chipEl.style.opacity !== '0') reserved.push({ n: 'chip', ...rel(h.chipEl) });
  const probe = h._probe(W, H);
  // Referents (labelled craft / satellites / aircraft) that the sim draws at this t but the camera cannot show.
  const hidden = [],
    cp = h.camera.position,
    T = h.T;
  for (const { it, obj } of h.dyn) {
    // insetRef: the context inset shows it
    if (it.kind !== 'point' || !it.prim || h.sim.cams[h.camIdx].ref === false || (h.sim.cams[h.camIdx].insetRef && it.insetLabel)) continue;
    const p = it.pos(h.t);
    if (!p) continue;
    const v = new T.Vector3(...p).project(h.camera),
      x = ((v.x + 1) / 2) * W,
      y = ((1 - v.y) / 2) * H;
    const d = [p[0] - cp.x, p[1] - cp.y, p[2] - cp.z],
      Ld = Math.hypot(...d),
      u = d.map((c) => c / Ld),
      b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2],
      c2 = cp.lengthSq() - 1,
      disc = b * b - c2;
    const occ = disc >= 0 && -b - Math.sqrt(disc) > 0 && -b - Math.sqrt(disc) < Ld - 1e-3;
    if (x < 8 || y < 8 || x > W - 8 || y > H - 8 || v.z > 1 || occ)
      hidden.push(`${it.label} ${occ ? 'behind Earth' : 'off frame'} (${Math.round(x)},${Math.round(y)})`);
  }
  const tb = bn ? bn.getBoundingClientRect().height : 0;
  // status caption: text, line count, event time; key objects that must be in frame on the default camera
  const st = h.statusEl,
    status = st ? st.textContent : '';
  let statusLines = 0;
  if (st && status) {
    const rg = document.createRange();
    rg.selectNodeContents(st);
    statusLines = new Set([...rg.getClientRects()].map((q) => Math.round(q.top / 4))).size;
  }
  const hitT = h.sim.cfg.hit && !h.sim.cfg.actors.some((a) => a.noHit) ? h.sim.cfg.hit.t : null,
    keyOut = [];
  const res = reserved.filter((r) => r.n === 'status' || r.n === 'banner');
  for (const Lb of h.labels) {
    const nm = (Lb.text || '') + '|' + (Lb.short || '');
    if (!KEYS.some((rx) => new RegExp(rx).test(nm)) || (h.sim.cams[h.camIdx].insetRef && Lb.item?.insetLabel)) continue;
    const p = Lb.posFn(h.t);
    if (!p) continue;
    const v = new T.Vector3(...p).project(h.camera),
      x = ((v.x + 1) / 2) * W,
      y = ((1 - v.y) / 2) * H;
    const d = [p[0] - cp.x, p[1] - cp.y, p[2] - cp.z],
      Ld = Math.hypot(...d),
      u = d.map((c) => c / Ld),
      b = cp.x * u[0] + cp.y * u[1] + cp.z * u[2],
      c2 = cp.lengthSq() - 1,
      dd = b * b - c2;
    const occ = dd >= 0 && -b - Math.sqrt(dd) > 0 && -b - Math.sqrt(dd) < Ld - 1e-3;
    const under = res.some((r) => x > r.x0 - 18 && x < r.x1 + 18 && y > r.y0 - 18 && y < r.y1 + 18); // 18 px pad: a model half-hidden by the caption counts
    if (x < 10 || y < 10 || x > W - 10 || y > H - 10 || v.z > 1 || occ || under)
      keyOut.push(`${Lb.text} ${occ ? 'behind Earth' : under ? 'under the caption/banner' : 'off frame'} (${Math.round(x)},${Math.round(y)})`);
  }
  return {
    W,
    H,
    labels,
    reserved,
    probe,
    hidden,
    ringFrame: !!h.sim.cams[h.camIdx]?.ringFrame,
    status,
    statusLines,
    hitT,
    keyOut,
    docked: h.sim.items.some((i) => i.dockOn && i.dockOn(h.t)),
    t: h.t,
    bannerLines: tb > 32 ? 2 : 1,
    audit: window.__cs.audit().filter((a) => /scene/.test(a.chart || '')),
    act: h._act,
  };
};
// Subjects: what the sim draws at this t (visible primary craft, flash, debris cloud) versus what this camera actually frames.
export const SUBJ = () => {
  const h = window.__cs.host(),
    W = h.el.clientWidth,
    H = h.el.clientHeight,
    P = h._probe(W, H),
    thr = W >= 900 ? 8 : 6;
  let drawn = 0;
  for (const { it, obj } of h.dyn) {
    if (!obj.visible) continue;
    if ((it.kind === 'point' && it.prim && it.shape !== 'none') || (it.kind === 'flash' && it.big) || (it.kind === 'cloud' && it.dynCol !== undefined)) drawn++;
  }
  const inF = (x, y, m = 6) => x > m && y > m && x < W - m && y < H - m;
  const ok =
    P.refs.filter((r) => inF(r.x, r.y) && r.px >= thr).length +
    P.pts.filter((q) => q.shape === 'flash' && inF(q.x, q.y) && q.r >= thr / 2).length +
    (P.cloud.filter((c) => inF(c[0], c[1], 2)).length >= 5 ? 1 : 0);
  return { drawn, ok, refs: P.refs.map((r) => `${r.text} ${Math.round(r.px)}px@${Math.round(r.x)},${Math.round(r.y)}`).slice(0, 4) };
};
export const SSX = (sel = '#sceneView') => {
  const v = [...document.querySelectorAll(sel + ' svg[data-ss]')].map((e) => +e.dataset.ss).filter(Boolean);
  return v.length ? Math.min(...v) : null;
};
export const STATIC = (sel = '#sceneView') => {
  const svg = document.querySelector(sel + ' > svg'),
    z = svg && svg.__lay;
  if (!z) return null;
  const bn0 = document.querySelector(sel + ' > .illus'),
    lines0 = bn0 && bn0.getBoundingClientRect().height > 32 ? 2 : 1;
  const mapLay = (l) => ({ text: l.text, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, leader: l.leader, ref: l.ref, item: l.mk ?? -1, onDisc: false });
  if (z.panels)
    return {
      panels: z.panels.map((p) => ({
        W: p.W,
        H: p.H,
        labels: p.labels.map(mapLay),
        reserved: p.reserved.map((r) => ({ n: r.n, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 })),
        probe: p.probe,
        minFont: p.probe.minFont,
      })),
      bannerLines: lines0,
      audit: window.__cs.audit().filter((a) => /scene/.test(a.chart || '')),
      earth: svg.dataset.earth,
    };
  const labels = z.labels.map((l) => ({ text: l.text, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, leader: l.leader, ref: l.ref, item: l.mk ?? -1, onDisc: false }));
  const bn = document.querySelector(sel + ' > .illus'),
    er = document.querySelector(sel).getBoundingClientRect();
  const reserved = z.reserved.map((r) => ({ n: r.n, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }));
  if (bn) {
    const b = bn.getBoundingClientRect();
    reserved.push({ n: 'banner', x0: b.left - er.left, y0: b.top - er.top, x1: b.right - er.left, y1: b.bottom - er.top });
  }
  return {
    W: z.W,
    H: z.H,
    labels,
    reserved,
    probe: z.probe,
    minFont: z.probe.minFont,
    bannerLines: bn && bn.getBoundingClientRect().height > 32 ? 2 : 1,
    audit: window.__cs.audit().filter((a) => /scene/.test(a.chart || '')),
    earth: svg.dataset.earth,
  };
};

// Empty-band measure of a still (PNG data URL), body only (header/footer excluded): {band: largest empty gap inside the content, or the imbalance between
// opposite empty margins; area: content bounding box as a fraction of the body}.
export const EMPTY = async (url) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  const k = 4,
    w = Math.round(img.width / k),
    h = Math.round(img.height / k),
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const y0 = Math.round(h * 0.06),
    y1 = Math.round(h * 0.9),
    rows = [],
    cols = new Array(w).fill(0);
  for (let y = y0; y < y1; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4,
        L = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      if (L > 30) {
        n++;
        cols[x]++;
      }
    }
    rows.push(n);
  }
  // per axis: rows/cols with content (>= 3 bright px); lead/trail = empty margins, gap = longest empty run between content
  const ax = (arr) => {
    const on = arr.map((v) => v >= 3),
      first = on.indexOf(true),
      last = on.lastIndexOf(true);
    if (first < 0) return { lead: 1, trail: 0, gap: 0, span: 0 };
    let gap = 0,
      cur = 0;
    for (let i = first; i <= last; i++) {
      if (!on[i]) {
        cur++;
        gap = Math.max(gap, cur);
      } else cur = 0;
    }
    return { lead: first / arr.length, trail: (arr.length - 1 - last) / arr.length, gap: gap / arr.length, span: (last - first + 1) / arr.length };
  };
  const r = ax(rows),
    q = ax(cols);
  return { band: Math.max(r.gap, q.gap, Math.abs(r.lead - r.trail), Math.abs(q.lead - q.trail)), area: r.span * q.span };
};
export const discVisible = (d, W, H) => {
  if (!d || !(d.r > 0)) return null;
  let n = 0,
    ins = 0;
  for (let i = 0; i < 48; i++)
    for (let j = 0; j < 48; j++) {
      const x = d.cx + ((i + 0.5) / 24 - 1) * d.r,
        y = d.cy + ((j + 0.5) / 24 - 1) * d.r;
      if ((x - d.cx) ** 2 + (y - d.cy) ** 2 > d.r * d.r) continue;
      n++;
      if (x >= 0 && x <= W && y >= 0 && y <= H) ins++;
    }
  return ins / n;
};
