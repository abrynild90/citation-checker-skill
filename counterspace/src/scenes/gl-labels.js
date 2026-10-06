// ============================================================================
// scenes/gl-labels.js: GLHost mixin: HTML labels, leader lines, screen-space label placement and limb geometry
// (ES module bundled by esbuild from src/boot.js; the GLHost methods here are installed by installGLLabels(GLHost), see app.js.)
// ============================================================================
import { DEG, add, ll, occluded, scl } from './core.js';
import { LABEL, dotCss, labelBox, offDisc, pillCss, placeLabels } from './labels.js';
import { SANS } from '../fonts.js';

const INSET_PX = 13; // the inset's type is never below the page-wide floor of 12 px
const methods = {
  _placeLabels: placeLabels, // exposed for tools/scene_check.mjs debugging
  // Point on a sphere of radius r at the visible silhouette, `deg` counter-clockwise from screen-right.
  _limb(r, deg) {
    const T = this.T,
      cam = this.camera,
      d = cam.position.clone().normalize();
    const cr = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0),
      cu = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const right = cr.sub(d.clone().multiplyScalar(cr.dot(d))).normalize(),
      up = cu.sub(d.clone().multiplyScalar(cu.dot(d))).normalize();
    const L = cam.position.length(),
      rr = r * Math.sqrt(Math.max(0, 1 - (r / L) ** 2)); // tangent circle for a perspective camera
    const p = right
      .multiplyScalar(Math.cos(deg * DEG) * rr)
      .add(up.multiplyScalar(Math.sin(deg * DEG) * rr))
      .add(d.multiplyScalar((r * r) / L));
    return [p.x, p.y, p.z];
  },
  // Point on the equatorial ring of radius r, `deg` round the ring from the point that faces the camera (hero shell labels).
  _ringPt(r, deg) {
    const cp = this.camera.position,
      a = Math.atan2(cp.z, cp.x) - deg * DEG;
    return [r * Math.cos(a), 0, r * Math.sin(a)];
  },
  // Shell label anchor: the limb point at `deg`, moved around the shell to the nearest angle that is comfortably inside the stage (never off-screen).
  _limbVis(r, deg) {
    const T = this.T,
      ks = [0];
    for (let k = 15; k <= 180; k += 15) ks.push(k, -k);
    for (const k of ks) {
      const p = this._limb(r, deg + k),
        v = new T.Vector3(...p).project(this.camera);
      if (Math.abs(v.x) < 0.8 && v.y > -0.72 && v.y < 0.72) return p;
    }
    return null;
  },
  // Screen positions of visible labels for a given canvas size (shared by live render and PNG export).
  // u = font scale relative to the live 11 px label. Overlaps are resolved by placeLabels().
  _labelPositions(w, h, u = 1, noBanner = false, statusBox = null) {
    const cam = this.camera.position,
      T = this.T,
      raw = [],
      k = h / (this.el.clientHeight || h);
    for (const L of this.labels) {
      if (L.cls === 'shell' && this.hideShell) {
        raw.push(null);
        continue;
      }
      if (noBanner && (L.item?.stillHide || this.sim.cfg.stillHideText?.some((h) => L.text.startsWith(h)))) {
        raw.push(null); // stillHide: a live-view aid (a gauge or a path tag) that the print frame does not need
        continue;
      }
      if (noBanner && L.item?.impactMark && !this.sim.cfg.stillImpact) {
        raw.push(null); // the still shows the debris and the flash; the impact marker's label is a live-view aid and crowds the print frame
        continue;
      }
      if (this.el.clientWidth < 520 && this.sim.cfg.phoneHide?.some((h) => L.text.startsWith(h))) {
        raw.push(null); // secondary labels left out of a phone-width stage
        continue;
      }
      if ((this.sim.cams[this.camIdx]?.hide || this.sim.cfg.camHide?.[this.camIdx])?.some((h) => L.text.startsWith(h))) {
        raw.push(null); // this camera looks elsewhere: labels of objects it does not show are left out
        continue;
      }
      const spin = this.sim.cfg.spin && L.cls !== 'shell',
        world = (q) => {
          if (q && spin) {
            const w3 = new T.Vector3(...q).applyMatrix4(this.root.matrixWorld);
            return [w3.x, w3.y, w3.z];
          }
          return q;
        },
        hidden = (q) => {
          if (!q) return true;
          const u = new T.Vector3(...q).project(this.camera);
          return occluded([cam.x, cam.y, cam.z], q) || u.z > 1 || Math.abs(u.x) > 0.985 || Math.abs(u.y) > 0.985;
        };
      let p = world(L.posFn(this.t));
      // a debris cloud labels one of its particles: when that one is behind the Earth (or sits on the disc), a stand-in in view, as far off the disc as
      // possible carries the print's label (live: the first one in view, kept until it hides).
      const cl = (L.cloudIt ??= this.dyn.find((d) => d.it.kind === 'cloud' && d.it.label === L.text)?.it || false);
      if (p && cl?.labelCands && (hidden(p) || noBanner || cl.labelEdge)) {
        const c0 = noBanner ? new T.Vector3(0, 0, 0).project(this.camera) : new T.Vector3(...p).project(this.camera), // live: stay near the hidden one
          sgn = noBanner ? 1 : -1,
          // labelEdge (live): the fragment highest in the picture (inside the frame margin), so the label above the cloud has a short leader
          sc = (q) => {
            const u = new T.Vector3(...q).project(this.camera);
            if (cl.labelEdge && !noBanner) return Math.abs(u.x) < 0.75 && Math.abs(u.y) < 0.75 ? u.y : -9;
            return sgn * Math.hypot(u.x - c0.x, u.y - c0.y);
          },
          keep = cl.labelIdx;
        let best = hidden(p) ? null : { p, d: sc(p), idx: keep };
        for (const idx of cl.labelCands) {
          cl.labelIdx = idx;
          const q = world(L.posFn(this.t));
          if (!q || hidden(q)) continue;
          const d = sc(q);
          if (!best || d > best.d + 0.02) best = { p: q, d, idx };
        }
        cl.labelIdx = best ? best.idx : keep;
        if (best) p = best.p;
      }
      if (!p) {
        raw.push(null);
        continue;
      }
      const v = new T.Vector3(...p).project(this.camera);
      if (hidden(p)) {
        raw.push(null);
        continue;
      } // hidden: behind Earth, or its referent is off the stage
      // cfg.liveShort: labels that take their short text on screen too; cfg.liveText: { 'label start': 'text' } a mid-length text for the live desktop view
      const liveAlt = !noBanner && this.el.clientWidth >= 520 ? Object.entries(this.sim.cfg.liveText || {}).find(([h]) => L.text.startsWith(h)) : null,
        text = L.item?.labelFn
          ? L.item.labelFn(this.t, this.el.clientWidth < 520, noBanner)
          : liveAlt
            ? liveAlt[1]
            : L.short &&
                (this.el.clientWidth < 520 ||
                  (noBanner && this.sim.cfg.stillShort?.some((h) => L.text.startsWith(h))) ||
                  (!noBanner && this.sim.cfg.liveShort?.some((h) => L.text.startsWith(h))))
              ? L.short
              : L.text,
        color = L.item?.labelFn ? L.item.statusColor(this.t) : L.hue || null;
      if (!text) {
        raw.push(null);
        continue;
      } // a label function may hide its label (act windows, docked pairs)
      const px = ((v.x + 1) / 2) * w,
        py = ((1 - v.y) / 2) * h;
      const { w: lw, h: lh } = labelBox(text, u, L.role !== 'place');
      let lx = px + L.dx * k,
        ly = py + L.dy * k - (lh / 2 + 2.5 * k); // the pill sits just above its referent unless the scene offsets it
      if (L.item?.offGlobe && (!L.item.stillOnly || noBanner)) {
        const c0 = new T.Vector3(0, 0, 0).project(this.camera),
          lm = this._limb(1, 0),
          c1 = new T.Vector3(...lm).project(this.camera),
          gx = ((c0.x + 1) / 2) * w,
          gy = ((1 - c0.y) / 2) * h,
          gr = Math.hypot(((c1.x + 1) / 2) * w - gx, ((1 - c1.y) / 2) * h - gy);
        [lx, ly] = offDisc(px, py, lw, lh, gx, gy, gr * 1.05);
      }
      raw.push({
        x: lx,
        y: ly,
        px,
        py,
        w: lw,
        h: lh,
        fixed: L.cls === 'shell',
        opt: !!L.opt,
        text,
        color,
        avoidDisc: !!L.item?.offGlobe && (!L.item.stillOnly || noBanner),
        noLeader: !!L.item?.noLeader,
        onDisc: this.el.clientWidth < 520 && !!this.sim.cfg.phoneOnDisc?.some((h) => text.startsWith(h)), // phone: dark ocean under a label beats a long leader
      });
    }
    // Reserved areas are the real DOM boxes in the live view (banner, status caption); stills pass their own caption box.
    const er = this.el.getBoundingClientRect(),
      rel = (e) => {
        const b = e.getBoundingClientRect();
        return [b.left - er.left - 3, b.top - er.top - 3, b.width + 6, b.height + 6];
      },
      bn = noBanner ? null : this.el.querySelector('.illus');
    const banner = noBanner || (this.sim.cfg.spin && !bn) ? [] : [bn ? rel(bn) : [8, 8, Math.min(w - 16, 430), 32]],
      status = noBanner ? statusBox : this.status && this.statusEl ? rel(this.statusEl) : null;
    let disc = null;
    {
      const c0 = new T.Vector3(0, 0, 0).project(this.camera),
        c1 = new T.Vector3(...this._limb(1, 0)).project(this.camera),
        gx = ((c0.x + 1) / 2) * w,
        gy = ((1 - c0.y) / 2) * h;
      disc = { cx: gx, cy: gy, r: Math.hypot(((c1.x + 1) / 2) * w - gx, ((1 - c1.y) / 2) * h - gy) * 1.005 + 4 * k };
    }
    const obst = [],
      vp = (p) => {
        const v = new T.Vector3(...p).project(this.camera);
        return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h, occluded([cam.x, cam.y, cam.z], p) || v.z > 1];
      };
    for (const it of this.obst || []) {
      let pts = it.kind === 'beam' ? (it.on(this.t) && it.a(this.t) && it.b(this.t) ? [it.a(this.t), it.b(this.t)] : []) : it.pts(this.t),
        cur = [];
      const st = Math.max(1, Math.ceil(pts.length / 40)),
        flush = () => {
          if (cur.length > 1) {
            cur.soft = !!it.soft;
            obst.push(cur);
          }
          cur = [];
        };
      for (let k = 0; k < pts.length; k += st) {
        const q = vp(pts[k]);
        if (q[2]) flush();
        else cur.push(q);
      }
      flush();
    }
    const objs = this._sceneObjects(w, h);
    objs.scale = u;
    this._lastObjs = objs;
    this._lastObst = obst;
    const chip = (!noBanner && this.chipEl && this.chipEl.style.opacity !== '0' ? [rel(this.chipEl)] : [])
      .concat(!noBanner && this.handEl && this.handEl.style.visibility === 'visible' ? [rel(this.handEl)] : [])
      .concat(!noBanner && this.epEl && this.epEl.style.visibility === 'visible' ? [rel(this.epEl)] : [])
      .concat(!noBanner && this.insetEl && this.insetEl.style.display !== 'none' ? [rel(this.insetEl)] : []);
    this._lastPlace = [raw, w, h, (status ? banner.concat([status]) : banner).concat(chip), disc, obst, null, objs];
    const pl = placeLabels(raw, w, h, (status ? banner.concat([status]) : banner).concat(chip), disc, obst, noBanner ? null : (this._lm ||= {}), objs);
    // cfg.liveOff: { 'Label text start': [dx, dy] } fixes that label at its referent plus [dx, dy] px (live, default camera, desktop width only
    // (stage >= 700 px):
    // where the placer's own slot lands on a dense field of lines). The leader runs from the referent to the nearest edge of the chip.
    // cfg.phoneOff: the same at phone width (default camera), in raw px
    // cfg.camOff: { camera index: { 'Label text start': [dx, dy] } } the same for another preset (desktop width only)
    const camOffs = w >= 700 ? this.sim.cfg.camOff?.[this.camIdx] : w < 520 ? this.sim.cfg.phoneCamOff?.[this.camIdx] : null, // cfg.phoneCamOff: the same at phone width
      offs = noBanner ? this.sim.cfg.stillOff : camOffs || (this.camIdx === 0 ? (w >= 700 ? this.sim.cfg.liveOff : w < 520 ? this.sim.cfg.phoneOff : null) : null),
      offK = noBanner ? w / 1000 : w >= 700 ? Math.min(1, w / 798) : 1; // cfg.stillOff (PNG stills): px at a 1000 px wide frame
    if (offs)
      Object.entries(offs).forEach(([n, d]) => {
        const i = raw.findIndex((r) => r && r.text.startsWith(n));
        if (i < 0 || !pl[i]) return;
        const r = raw[i],
          // the override must not push the chip past the frame when its referent is near an edge (DN-2's GEO label early in the scene)
          x = Math.max(r.w / 2 + 9, Math.min(w - r.w / 2 - 9, r.px + d[0] * offK)),
          y = Math.max(r.h / 2 + 9, Math.min(h - r.h / 2 - 9, r.py + d[1] * offK)),
          qx = Math.max(x - r.w / 2, Math.min(x + r.w / 2, r.px)),
          qy = Math.max(y - r.h / 2, Math.min(y + r.h / 2, r.py));
        // the placer's own slot stays when the fixed one would land on another label (it knows nothing of this override)
        if (pl.some((q, j) => j !== i && q && raw[j] && Math.abs(q.x - x) < (raw[j].w + r.w) / 2 && Math.abs(q.y - y) < (raw[j].h + r.h) / 2)) return;
        Object.assign(pl[i], { x, y, leader: true, ax: r.px, ay: r.py, qx, qy });
      });
    return raw.map((r, i) => r && pl[i] && { ...pl[i], text: r.text, color: r.color, w: r.w, h: r.h });
  },
  // Everything drawn that a label must stay off, in screen px for a w x h canvas: sprites (marks, with their drawn radius), dense particle
  // clumps (a count grid) and ring lines (shell rings and thick orbit rings). Shared by live labels, the PNG still and the QA checker.
  _sceneObjects(w, h) {
    const T = this.T,
      cam = this.camera,
      cp = cam.position,
      k = h / (this.el.clientHeight || h),
      sc = h / (2 * Math.tan((cam.fov * DEG) / 2)),
      V = new T.Vector3(),
      M = this.root.matrixWorld;
    const me = cam.matrixWorldInverse.elements,
      pm = cam.projectionMatrix.elements;
    const scr = (p) => {
      const x = p[0],
        y = p[1],
        z = p[2],
        vx = me[0] * x + me[4] * y + me[8] * z + me[12],
        vy = me[1] * x + me[5] * y + me[9] * z + me[13],
        vz = me[2] * x + me[6] * y + me[10] * z + me[14],
        d = -vz;
      if (d <= 0.05) return [0, 0, d, true];
      return [(((pm[0] * vx + pm[8] * vz) / d + 1) / 2) * w, ((1 - (pm[5] * vy + pm[9] * vz) / d) / 2) * h, d, false];
    };
    const marks = [],
      rings = [],
      W3 = new T.Vector3();
    for (const { it, obj } of this.dyn) {
      if (!obj.visible) continue;
      if (it.kind === 'point') {
        obj.getWorldPosition(W3);
        const p = [W3.x, W3.y, W3.z];
        if (occluded([cp.x, cp.y, cp.z], p)) continue;
        const q = scr(p);
        if (q[3]) continue;
        const u = obj.userData,
          wr = u.span ? u.span * obj.scale.x * 0.5 : (u.wr ?? 0.012);
        marks.push({ x: q[0], y: q[1], r: Math.max((wr * sc) / q[2], 3 * k), it });
      } else if (it.kind === 'flash') {
        obj.getWorldPosition(W3);
        const p = [W3.x, W3.y, W3.z];
        const q = scr(p);
        if (!q[3]) marks.push({ x: q[0], y: q[1], r: Math.max((obj.userData.core.scale.x * 0.35 * sc) / q[2], 4 * k), it });
      }
    }
    const grid = { cell: 8 * k, nx: Math.ceil(w / (8 * k)), ny: Math.ceil(h / (8 * k)) };
    grid.c = new Uint16Array(grid.nx * grid.ny);
    grid.d = new Uint16Array(grid.nx * grid.ny);
    for (const { it, obj } of this.dyn) {
      if (it.kind !== 'cloud' || !obj.visible || it.bg) continue;
      const a = obj.geometry.attributes.position.array;
      for (let i = 0; i < it.n; i++) {
        const p = [a[3 * i], a[3 * i + 1], a[3 * i + 2]];
        if (!p[0] && !p[1] && !p[2]) continue;
        if (this.sim.cfg.spin) {
          W3.set(...p).applyMatrix4(M);
          p[0] = W3.x;
          p[1] = W3.y;
          p[2] = W3.z;
        }
        const q = scr(p);
        if (q[3] || occluded([cp.x, cp.y, cp.z], p)) continue;
        const gx = Math.floor(q[0] / grid.cell),
          gy = Math.floor(q[1] / grid.cell);
        if (gx >= 0 && gy >= 0 && gx < grid.nx && gy < grid.ny) {
          grid.c[gy * grid.nx + gx]++;
          if (it.dynCol && !it.colored) grid.d[gy * grid.nx + gx]++;
        }
      }
    }
    const parts = {
      grid,
      count: (x0, y0, x1, y1, deb) => {
        const g = grid,
          arr = deb ? g.d : g.c,
          a = Math.max(0, Math.floor(x0 / g.cell)),
          b = Math.min(g.nx - 1, Math.floor(x1 / g.cell)),
          c = Math.max(0, Math.floor(y0 / g.cell)),
          d = Math.min(g.ny - 1, Math.floor(y1 / g.cell));
        let n = 0;
        for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) n += arr[j * g.nx + i];
        return n;
      },
    };
    for (const pts of this.ringPts || []) {
      if (pts.shell && this.hideShell) continue;
      const st = Math.max(1, Math.floor(pts.length / 160));
      let cur = [];
      for (let i = 0; i < pts.length; i += st) {
        const p = W3.set(...pts[i])
            .applyMatrix4(M)
            .toArray(),
          q = scr(p);
        if (q[3] || occluded([cp.x, cp.y, cp.z], p)) {
          if (cur.length > 1) rings.push(cur);
          cur = [];
        } else cur.push([q[0], q[1]]);
      }
      if (cur.length > 1) rings.push(cur);
    }
    return { marks, parts, rings, scale: 1 };
  },
  // Layout probe for QA (tools/scene_check.mjs): what is drawn, in screen px for a w x h canvas: Earth disc, sprite marks (with the item index),
  // curve/beam polylines, particle samples, dome discs, referent sizes and the action-region box (referents + trails + debris).
  _probe(w, h, free = false) {
    const T = this.T,
      cam = this.camera,
      cp = cam.position,
      cpa = [cp.x, cp.y, cp.z],
      k = h / (this.el.clientHeight || h),
      sc = h / (2 * Math.tan((cam.fov * DEG) / 2)),
      W3 = new T.Vector3(),
      items = this.sim.items;
    const scr = (p) => {
      const v = new T.Vector3(...p).project(cam);
      return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h, v.z > 1 || occluded(cpa, p)];
    };
    const c0 = scr([0, 0, 0]),
      c1 = scr(this._limb(1, 0));
    const disc = { cx: c0[0], cy: c0[1], r: Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) };
    const pts = [],
      polys = [],
      cloud = [],
      domes = [],
      circles = [],
      refs = [],
      act = [];
    for (const { it, obj } of this.dyn) {
      if (!obj.visible) continue;
      if (it.kind === 'point' || it.kind === 'flash') {
        if (it.shape === 'none') continue;
        obj.getWorldPosition(W3);
        const q = scr([W3.x, W3.y, W3.z]);
        if (q[2]) continue;
        const u = obj.userData,
          d = Math.max(0.05, cp.distanceTo(W3)),
          px = u.span ? (u.span * obj.scale.x * sc) / d / k : 0,
          r = it.kind === 'flash' ? Math.max((u.core.scale.x * 0.35 * sc) / d, 4 * k) : Math.max(px * 0.5 * k, 3 * k);
        const rg = it.kind === 'flash' && u.ring && u.ring.material.opacity > 0.03 ? (u.ring.scale.x * 0.5 * sc) / d : 0;
        pts.push({ x: q[0], y: q[1], r, i: items.indexOf(it), shape: it.shape || 'flash', ring: rg });
        if (it.kind === 'point' && ['sat', 'plane', 'aircraft'].includes(it.shape) && !it.ctx) {
          if (it.prim) refs.push({ text: it.label || it.shape, px, x: q[0], y: q[1] });
          if (!it.small || it.label) act.push([q[0], q[1]]);
        }
        if (it.kind === 'point' && it.shape === 'kv') act.push([q[0], q[1]]);
      } else if (it.kind === 'cloud') {
        const a = obj.geometry.attributes.position.array,
          st = Math.max(1, Math.ceil(it.n / 700));
        const idx = [it.labelIdx ?? 0]; // the particle the label points at is always probed
        for (let i = 0; i < it.n; i += st) idx.push(i);
        for (const i of idx) {
          const p = [a[3 * i], a[3 * i + 1], a[3 * i + 2]];
          if (!p[0] && !p[1] && !p[2]) continue;
          const q = scr(p);
          if (q[2]) continue;
          cloud.push([q[0], q[1]]);
          act.push([q[0], q[1]]);
        }
      }
    }
    const seg = (list, role) => {
      let cur = [];
      const fl = () => {
        if (cur.length > 1) polys.push({ p: cur, role });
        cur = [];
      };
      for (const p of list) {
        const q = scr(p);
        if (q[2]) fl();
        else cur.push([q[0], q[1]]);
      }
      fl();
    };
    for (const it of items) {
      if (it.kind === 'curve') {
        const pl = it.pts(this.t);
        seg(pl, it.role || (it.dynamic ? 'trail' : 'line'));
        if (it.role === 'action' || it.role === 'orbit' || (it.dynamic && !it.uniformA))
          for (const p of pl) {
            const q = scr(p);
            if (!q[2]) act.push([q[0], q[1]]);
          }
      } else if (it.kind === 'beam' && it.on(this.t)) {
        const A = it.a(this.t),
          B = it.b(this.t);
        if (A && B) {
          seg(
            Array.from({ length: 17 }, (_, k) => add(scl(A, 1 - k / 16), scl(B, k / 16))),
            'beam',
          ); // sampled: the part behind the Earth drops out
          if (!it.link)
            for (const p of [A, B]) {
              const q = scr(p);
              if (!q[2]) act.push([q[0], q[1]]);
            }
        }
      } else if (it.kind === 'shell' && !this.hideShell) {
        const b = scr(this._limb(it.r, 0));
        circles.push({ cx: disc.cx, cy: disc.cy, r: Math.hypot(b[0] - disc.cx, b[1] - disc.cy), ring: !it.noRing });
      } else if (it.kind === 'dome') {
        const a = scr(ll(it.at[0], it.at[1])),
          b = scr(ll(it.at[0] + it.radius, it.at[1]));
        domes.push({ x: a[0], y: a[1], r: Math.hypot(a[0] - b[0], a[1] - b[1]) * 1.2 });
      }
    }
    // Shell rings (equatorial circles, seen as ellipses): polylines a label leader may end on.
    for (const pts of this.ringPts || []) {
      if (pts.shell && this.hideShell) continue;
      let cur = [];
      for (const q0 of pts) {
        const q = scr(
          W3.set(...q0)
            .applyMatrix4(this.root.matrixWorld)
            .toArray(),
        );
        if (q[2]) {
          if (cur.length > 1) polys.push({ p: cur, role: 'orbit' });
          cur = [];
        } else cur.push([q[0], q[1]]);
      }
      if (cur.length > 1) polys.push({ p: cur, role: 'orbit' });
    }
    let action = null;
    // free: stills recompose on everything that acts, even where the camera now cuts it off (within two frames of the view)
    const inb = act.filter((p) => (free ? p[0] > -w && p[0] < 2 * w && p[1] > -h && p[1] < 2 * h : p[0] >= 0 && p[0] <= w && p[1] >= 0 && p[1] <= h));
    if (inb.length > 1) {
      const xs = inb.map((p) => p[0]),
        ys = inb.map((p) => p[1]);
      action = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    }
    return { W: w, H: h, disc, pts, polys, cloud, domes, circles, refs, action };
  },
  // Context inset (cfg.inset): a small schematic seen from above the pole (Earth disc, orbit lines flagged `inset`, a dot per craft), so a tight main camera
  // keeps the Earth and the orbit in view. Drawn on a 2D canvas over the stage; labels treat it as a reserved box.
  _makeInset() {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `position:absolute;right:8px;border:${LABEL.border}px solid ${LABEL.edge};border-radius:${LABEL.radius}px;pointer-events:none;background:rgba(8,13,28,.84)`;
    this.labelLayer.appendChild(c);
    this.insetEl = c;
  },
  _drawInset() {
    const c = this.insetEl;
    if (!c) return;
    const phone = this.el.clientWidth < 520;
    c.style.display = phone && this.sim.cfg.insetNoPhone ? 'none' : '';
    if (c.style.display) return;
    const bl = (phone && this.sim.cfg.insetCornerPhone ? this.sim.cfg.insetCornerPhone : this.sim.cfg.insetCorner) === 'bl', // insetCornerPhone: an opt-in corner for a phone-width stage // bottom-left, above the caption (scenes whose action fills the top right)
      sz = phone && this.sim.cfg.insetSizePhone ? this.sim.cfg.insetSizePhone : this.sim.cfg.insetSize,
      mc = (this._insetMeasure ||= document.createElement('canvas').getContext('2d')),
      title = phone && this.sim.cfg.insetPhone ? this.sim.cfg.insetPhone : this.sim.cfg.inset;
    mc.font = `600 ${INSET_PX}px ${SANS}`;
    // the box is as wide as its title needs at 12 px (never squeezed), and a little taller than before to make room for the larger type
    const w = Math.min(Math.round(this.el.clientWidth * 0.62), Math.max(phone ? (sz ? sz[0] : 128) : sz ? sz[0] : 188, Math.ceil(mc.measureText(title).width) + 18)),
      h = (phone ? (sz ? sz[1] : 104) : sz ? sz[1] : 142) + 8,
      d = Math.min(devicePixelRatio || 1, 2);
    if (c.width !== Math.round(w * d)) {
      c.width = Math.round(w * d);
      c.height = Math.round(h * d);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
    }
    c.style.top = (bl ? Math.round(this.el.clientHeight - h - (this.statusEl?.offsetHeight || 20) - 24) : phone ? 40 : 42) + 'px';
    c.style.left = bl ? '8px' : Math.round(this.el.clientWidth - w - 8) + 'px';
    c.style.right = 'auto';
    const g = c.getContext('2d'),
      t = this.t;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, w, h);
    const curves = this.sim.items.filter((i) => i.kind === 'curve' && i.inset),
      lines = curves.map((i) => i.pts(t)).filter((p) => p.length > 1);
    let rmax = 1.2;
    for (const pl of lines) for (const p of pl) rmax = Math.max(rmax, Math.hypot(p[0], p[2]));
    const sc = (Math.min(w, h - 26) / 2 - 6) / rmax,
      cx = w / 2,
      cy = h / 2 + 11;
    const gr = g.createRadialGradient(cx - 0.3 * sc, cy - 0.3 * sc, 1, cx, cy, sc);
    gr.addColorStop(0, '#5aa0e6');
    gr.addColorStop(1, '#123a68');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy, sc, 0, 7);
    g.fill();
    g.lineWidth = 1.3;
    // insetRing: one orbit ring with a few satellite dots on it (GPS), instead of every orbit plane (which read as an atom)
    const ringOnly = !!this.sim.cfg.insetRing;
    if (ringOnly && curves.length) {
      g.strokeStyle = curves[0].color;
      g.globalAlpha = 0.95;
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(cx, cy, rmax * sc, 0, 7);
      g.stroke();
      g.lineWidth = 1.3;
    }
    curves.forEach((it, k) => {
      if (ringOnly) return;
      const pl = lines.length === curves.length ? lines[k] : it.pts(t);
      if (pl.length < 2) return;
      g.strokeStyle = it.color;
      g.globalAlpha = 0.9;
      g.beginPath();
      pl.forEach((p, i) => (i ? g.lineTo(cx + p[0] * sc, cy + p[2] * sc) : g.moveTo(cx + p[0] * sc, cy + p[2] * sc)));
      g.stroke();
    });
    g.globalAlpha = 1;
    const dots = [];
    const ctxDots = [];
    for (const { it, obj } of this.dyn)
      if (it.kind === 'point' && obj.visible) {
        const p = obj.position;
        if (it.prim) dots.push([cx + p.x * sc, cy + p.z * sc, it.statusColor ? it.statusColor(t) : it.color, it.insetLabel]);
        else if (it.ctx) ctxDots.push([cx + p.x * sc, cy + p.z * sc, it.color]);
      }
    const ringDots = ringOnly ? ctxDots.filter((q, i) => i % Math.max(1, Math.round(ctxDots.length / 4)) === 0).slice(0, 4) : ctxDots;
    for (const q of ringDots) {
      g.fillStyle = q[2];
      g.beginPath();
      if (ringOnly) {
        const a = Math.atan2(q[1] - cy, q[0] - cx);
        g.arc(cx + Math.cos(a) * rmax * sc, cy + Math.sin(a) * rmax * sc, 3, 0, 7);
      } else g.arc(q[0], q[1], 1.7, 0, 7);
      g.fill();
    }
    if (dots.length) {
      const mx = dots.reduce((a, q) => a + q[0], 0) / dots.length,
        my = dots.reduce((a, q) => a + q[1], 0) / dots.length,
        rr = Math.max(7, ...dots.map((q) => Math.hypot(q[0] - mx, q[1] - my) + 5));
      g.strokeStyle = LABEL.warm;
      g.lineWidth = 1;
      g.setLineDash([3, 3]);
      g.beginPath();
      g.arc(mx, my, rr, 0, 7);
      g.stroke();
      g.setLineDash([]);
    }
    for (const q of dots) {
      g.fillStyle = q[2];
      g.beginPath();
      g.arc(q[0], q[1], 2.6, 0, 7);
      g.fill();
      if (q[3]) {
        g.fillStyle = LABEL.warm;
        g.font = `600 ${INSET_PX}px ${SANS}`;
        g.textBaseline = 'middle';
        g.textAlign = q[0] > w / 2 ? 'right' : 'left';
        if (this.sim.cfg.insetHalo) {
          g.lineJoin = 'round';
          g.lineWidth = 3.5;
          g.strokeStyle = 'rgba(8,13,28,.92)';
          g.strokeText(q[3], q[0] + (q[0] > w / 2 ? -9 : 9), q[1] + 14);
        }
        g.fillText(q[3], q[0] + (q[0] > w / 2 ? -9 : 9), q[1] + 14);
        g.textAlign = 'left';
      }
    }
    g.fillStyle = LABEL.text;
    g.font = `600 ${INSET_PX}px ${SANS}`;
    g.textBaseline = 'top';
    g.fillText(title, 9, 6, w - 14);
  },
  // look: { hue: the item's colour (the dot), place: a place or orbit name (no dot, 85%) }
  _label(text, posFn, cls, item, dy = 0, dx = 0, short = null, opt = false, look = {}) {
    const d = document.createElement('div'),
      role = look.place || cls === 'shell' ? 'place' : 'item',
      hue = look.hue ?? (/^#[0-9a-f]{6}$/i.test(item?.color || '') ? item.color : null);
    d.className = 'hlabel';
    d.style.cssText = pillCss({ place: role === 'place' });
    let pd = null;
    if (role !== 'place') {
      pd = document.createElement('i');
      pd.style.cssText = dotCss(hue);
      d.appendChild(pd);
    }
    const tx = document.createElement('span');
    tx.textContent = text;
    d.appendChild(tx);
    this.labelLayer.appendChild(d);
    this.labels.push({ d, tx, pd, posFn, item, text, dy, dx, short, cls, opt, hue, role });
  },
  // GPS links reach a satellite far outside the frame: where such a beam leaves the picture, a small arrowhead in the beam's colour at the frame edge shows that it
  // continues toward a satellite out of view (drawn into the leader layer, so it is not a label and never moves one).
  _edgeArrows() {
    const links = this.sim.items.filter((i) => i.kind === 'beam' && i.link);
    if (!links.length || !this.leaders) return;
    const w = this.el.clientWidth,
      h = this.el.clientHeight,
      m = 16,
      t = this.t,
      V = (this._av ||= new this.T.Vector3()),
      pm = this.camera.projectionMatrix.elements,
      proj = (p) => {
        V.set(p[0], p[1], p[2]).applyMatrix4(this.root.matrixWorld).applyMatrix4(this.camera.matrixWorldInverse);
        const d = -V.z;
        if (d <= 0.05) return [0, 0, 1e9];
        return [(((pm[0] * V.x + pm[8] * V.z) / d + 1) / 2) * w, ((1 - (pm[5] * V.y + pm[9] * V.z) / d) / 2) * h, 0];
      },
      inside = (q) => q[2] === 0 && q[0] >= m && q[0] <= w - m && q[1] >= m && q[1] <= h - m;
    const arrows = (this._arrows ||= []);
    links.forEach((it, k) => {
      let el = arrows[k];
      if (!el) {
        el = arrows[k] = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        el.setAttribute('points', '-7,-6 7,0 -7,6 -3,0');
        el.setAttribute('stroke', LABEL.casing);
        el.setAttribute('stroke-width', '1.5');
        el.setAttribute('stroke-linejoin', 'round');
        this.leaders.appendChild(el);
      }
      const A = it.on(t) && it.a(t),
        B = A && it.b(t);
      if (!A || !B) return void (el.style.display = 'none');
      if (this.sim.cfg.noJamArrow && it.dashFn?.(t)) return void (el.style.display = 'none'); // opt-in: no edge arrow on a jammed (faint, flickering) link
      // walk along the beam from the aircraft: the last sample still inside the frame is where the beam leaves the picture (the satellite end may be
      // behind the camera, so the end points alone cannot be projected)
      let prev = proj(A),
        last = null,
        exited = false;
      if (!inside(prev)) return void (el.style.display = 'none');
      for (let k = 1; k <= 160; k++) {
        const f = k / 160,
          q = proj([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]);
        if (!inside(q)) {
          exited = true;
          break;
        }
        last = { x: q[0], y: q[1], dx: q[0] - prev[0], dy: q[1] - prev[1] };
        prev = q;
      }
      if (!exited || !last) return void (el.style.display = 'none');
      const dx = last.dx,
        dy = last.dy,
        s = 0;
      const pa = [last.x, last.y];
      el.style.display = '';
      el.setAttribute('fill', it.colorFn ? it.colorFn(t) : it.color);
      el.setAttribute('transform', `translate(${(pa[0] + dx * s).toFixed(1)} ${(pa[1] + dy * s).toFixed(1)}) rotate(${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1)})`);
    });
  },
  _renderLabels() {
    this._edgeArrows();
    const pos = this._labelPositions(this.el.clientWidth, this.el.clientHeight);
    this.labels.forEach((L, i) => {
      const q = pos[i];
      if (!q || (L.cls === 'shell' && this.hideShell)) {
        L.d.style.display = 'none';
        if (L.ln) L.ln.style.display = L.lc.style.display = L.dot.style.display = 'none';
        return;
      }
      L.d.style.display = 'flex';
      L.ax = q.ax; // the referent's screen position (read by tools/scene_check.mjs)
      L.ay = q.ay;
      L.d.style.left = Math.round(q.x) + 'px';
      L.d.style.top = Math.round(q.y) + 'px';
      if (L.tx.textContent !== q.text) L.tx.textContent = q.text;
      const hue = q.color || L.hue;
      if (L.pd && hue && hue !== L._hue) {
        L.pd.style.background = L._hue = hue;
      }
      if (!L.ln && this.leaders) {
        const mk = (tag) => this.leaders.appendChild(document.createElementNS('http://www.w3.org/2000/svg', tag));
        L.lc = mk('line'); // a faint dark casing keeps the leader readable over bright cloud and ice
        L.lc.setAttribute('stroke', LABEL.casing);
        L.lc.setAttribute('stroke-width', '3');
        L.lc.setAttribute('stroke-linecap', 'round');
        L.ln = mk('line');
        L.ln.setAttribute('stroke', LABEL.leader);
        L.ln.setAttribute('stroke-width', '1');
        L.dot = mk('circle');
        L.dot.setAttribute('r', String(LABEL.leaderDot / 2));
        L.dot.setAttribute('fill', LABEL.leader);
      }
      if (L.ln) {
        L.ln.style.display = L.lc.style.display = L.dot.style.display = q.leader ? '' : 'none';
        if (q.leader) {
          for (const l of [L.lc, L.ln]) {
            l.setAttribute('x1', q.ax);
            l.setAttribute('y1', q.ay);
            l.setAttribute('x2', q.qx);
            l.setAttribute('y2', q.qy);
          }
          L.dot.setAttribute('cx', q.ax);
          L.dot.setAttribute('cy', q.ay);
        }
      }
    });
  },
};

// Adds this file's methods to GLHost.prototype. Called once from app.js, after gl-host.js is loaded and before any scene opens.
export function installGLLabels(GLHost) {
  Object.assign(GLHost.prototype, methods);
}
