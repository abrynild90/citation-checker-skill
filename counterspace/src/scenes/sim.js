// ============================================================================
// scenes/sim.js: simulator: interprets a scene config into time-parameterised items and cameras (renderer-independent)
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes.js.)
// ============================================================================
// ---------------------------------------------------------------- simulator
// Items: {kind, ...} with time functions. Kinds: shell, curve, point, cloud, beam, dome, flash.
import {
  DEG,
  GEO_ALT,
  IS_PHONE,
  PARTICLE_BUDGET,
  add,
  clamp01,
  dot,
  gauss,
  groundArc,
  len,
  lerp,
  ll,
  mulberry,
  norm,
  orbitPos,
  orbitThrough,
  rAlt,
  scl,
  smooth,
  toLL,
} from './core.js';
import { lerp3 } from './gl-items.js';
import { C } from './config.js';
import { craftPos, makeAnchor } from './co-sim.js';

export function buildSim(cfg) {
  const items = [];
  const rnd = mulberry(cfg.id.length * 7919 + 17);
  // Co-orbital scenes (see co-sim.js): anchors, crafts and acts. flags.all shows every act at once (static diagram).
  const flags = { all: false },
    A = cfg.acts || null,
    anchors = {},
    crafts = {};
  for (const [nm, an] of Object.entries(cfg.anchors || {})) anchors[nm] = makeAnchor(an);
  const actOn = (t, acts) =>
    flags.all || !A || !acts || acts.some((i) => t >= A[i].t0 - 1e-9 && (t < A[i].t1 || (i === A.length - 1 && t <= A[i].t1 + 1e-9)));
  const aPos = (a, t) => {
    const an = anchors[a.anchor],
      f = an.frame(t),
      o = a.off || [0, 0, 0];
    return add(add(add(an.pos(t), scl(f.along, o[0])), scl(f.rad, o[1])), scl(f.cross, o[2]));
  };
  const shellDefs = { LEO: [2000, '#78a8ff', 'LEO ≤2,000 km'], MEO: [20200, '#a88cff', 'MEO (GPS)'], GEO: [GEO_ALT, '#ffcf6e', 'GEO'] };
  const sl = cfg.shellLabels || {},
    sa = cfg.shellAng || {},
    angDef = { LEO: 150, MEO: 38, GEO: 60 };
  (cfg.shells || []).forEach((s) =>
    items.push({
      kind: 'shell',
      r: rAlt(shellDefs[s][0]),
      color: shellDefs[s][1],
      label: s in sl ? sl[s] : shellDefs[s][2],
      short: cfg.shellShort?.[s],
      staticLabel: cfg.staticShellLabels?.[s],
      noRing: !!cfg.noRing?.includes(s),
      ang: sa[s] ?? angDef[s],
      strong: !!cfg.spin,
      dx: cfg.shellOff?.[s]?.[0] ?? 0,
      dy: cfg.shellOff?.[s]?.[1] ?? 0,
    }),
  );
  let tgt = null,
    focus = cfg.focus || null;
  const H = cfg.hit;
  if (H) {
    const o = orbitThrough(H.lat, H.lon, H.inc);
    const wBase = 2 * Math.PI * 0.9 * Math.sqrt(1 / Math.pow(rAlt(H.alt), 3));
    // Approach speed (wa) and post-impact drift (wf) are scaled so the target stays in view before the hit (illustrative).
    tgt = { ...H, raan: o.raan, uHit: o.u, w: wBase * (H.wf ?? 1), wa: wBase * (H.wa ?? 0.4) };
    tgt.pos = (t) => orbitPos(H.alt, H.inc, tgt.raan, tgt.uHit + (t < H.t ? tgt.wa : tgt.w) * (t - H.t));
    tgt.hitPos = tgt.pos(H.t);
    focus = focus || [H.lat, H.lon];
  }
  let aircraftPos = null;
  if (cfg.status)
    items.push({
      kind: 'status',
      // Status entries are [t0, text, phoneText?]: a phone-width stage (one line at 375 px) uses the short text when there is one.
      text: (t, still, phone) => {
        let e = cfg.status[0];
        for (const x of cfg.status) if (t >= x[0]) e = x;
        const s = phone && e[2] ? e[2] : e[1],
          c = items._decayCloud;
        if (still || !c || cfg.noSimCount || !tgt || t < tgt.t) return s;
        return phone ? `${s} · ${c.vis}/${c.n} aloft` : `${s} · ${c.vis} of ${c.n} simulated pieces aloft`;
      },
    });
  for (const a of cfg.actors) {
    if (a.type === 'craft') {
      const anc = anchors[a.anchor],
        // dock: {with, t0, t1}: while docked the craft sits exactly on its partner (the renderers then set the two models side by side in screen
        // space, touching, at any zoom). Nothing is drawn between them: SWF says docked, not how.
        raw = (t) => (a.dock && t >= a.dock.t0 && t <= a.dock.t1 ? crafts[a.dock.with].raw(t) : craftPos(anc, a.key, t, a.arcs)),
        inVis = (t) => flags.all || !a.vis || (t >= a.vis[0] && t <= a.vis[1]),
        pos = (t) => (actOn(t, a.acts) && inVis(t) ? raw(t) : null);
      crafts[a.id] = { raw, pos, anc };
      const it = {
        kind: 'point',
        shape: a.model || 'sat',
        prim: true,
        craftId: a.id,
        dockWith: a.dock?.with,
        dockOn: a.dock ? (t) => t >= a.dock.t0 && t <= a.dock.t1 : null,
        minPx: a.minPx,
        maxPx: a.maxPx,
        small: !!a.small,
        scale: a.scale ?? null,
        color: a.color,
        bright: !!a.bright,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
        pos,
        orient: (t) => {
          const f = anc.frame(t);
          return { dir: f.along, up: f.rad };
        },
      };
      if (a.labelFn) {
        it.labelFn = (t, narrow) => (actOn(t, a.acts) && inVis(t) ? a.labelFn(t, narrow) : null);
        it.statusColor = () => a.color;
        it.label = a.label || 'x';
      }
      items.push(it);
    }
    if (a.type === 'link')
      items.push({
        kind: 'beam',
        a: (t) => crafts[a.a].pos(t),
        b: (t) => crafts[a.b].pos(t),
        on: (t) => t >= a.t0 && t <= a.t1,
        color: a.color,
        opacity: 0.95,
        width: a.width ?? 0.014,
        maxPx: 3,
        coreColor: a.coreColor,
      });
    if (a.type === 'burst')
      items.push({
        kind: 'flash',
        pos: crafts[a.craft].raw(a.t0),
        t0: a.t0,
        color: a.color ?? '#fff1c1',
        ringColor: a.ringColor ?? a.color,
        big: true,
        size: a.size ?? 0.16,
        span: a.span ?? 0.06,
      });
    if (a.type === 'trail') {
      const N = 60,
        all = [];
      for (let k = 0; k <= N; k++) all.push(crafts[a.craft].raw(a.t0 + ((a.t1 - a.t0) * k) / N));
      items.push({
        kind: 'curve',
        dynamic: true,
        all,
        thick: a.thick ?? 0.0035,
        color: a.color,
        width: 2,
        pts: (t) => {
          if (!actOn(t, a.acts)) return [];
          const s = clamp01((t - a.t0) / (a.t1 - a.t0));
          return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
        },
      });
    }
    if (a.type === 'tag')
      items.push({
        kind: 'point',
        shape: 'none',
        noLeader: true,
        color: a.color,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
        pos: (t) => (actOn(t, a.acts) && (flags.all || !a.vis || (t >= a.vis[0] && t <= a.vis[1])) ? aPos(a, t) : null),
      });
    if (a.type === 'path') {
      // static orbit line, shown only in its act(s)
      const N = a.N ?? 120,
        all = a.points ? a.points : Array.from({ length: N + 1 }, (_, k) => a.fn(k / N));
      items.push({
        kind: 'curve',
        gate: true,
        inset: true,
        all,
        pts: (t) => (actOn(t, a.acts) ? all : []),
        color: a.color,
        opacity: a.opacity ?? 0.6,
        thick: a.thick,
        label: a.label,
        short: a.short,
        labelAt: all[Math.min(all.length - 1, a.labelIdx ?? 0)],
        labelDx: a.dx,
        labelDy: a.dy,
      });
    }
    if (a.type === 'site')
      items.push({
        kind: 'point',
        shape: 'site',
        liveOnly: a.liveOnly,
        scale: a.small ? 1.7 : null,
        pos: () => ll(a.at[0], a.at[1], 1.003),
        color: a.color,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
      });
    if (a.type === 'ship')
      items.push({ kind: 'point', shape: 'ship', pos: () => ll(a.at[0], a.at[1], 1.004), color: '#cfd8ea', label: a.label, labelDx: a.dx, labelDy: a.dy });
    if (a.type === 'ring') {
      let raan = a.raan,
        phase = a.sat?.phase ?? 0;
      if (a.crossHit && tgt) {
        // orbit that crosses the target's orbit a little before the hit point, with the satellite passing that crossing mid-scene
        const X = toLL(orbitPos(tgt.alt, tgt.inc, tgt.raan, tgt.uHit - a.crossHit)),
          oc = orbitThrough(X.lat, X.lon, a.inc);
        raan = oc.raan;
        phase = oc.u - 0.5 * 2 * Math.PI * (a.sat?.speed ?? 0);
        items._cross = ll(X.lat, X.lon, rAlt(a.alt));
      }
      const pts = [];
      for (let k = 0; k <= 180; k++) pts.push(orbitPos(a.alt, a.inc, raan, (k / 180) * 2 * Math.PI));
      items.push({
        kind: 'curve',
        orbit: true,
        inset: !!a.inset,
        pts: () => pts,
        color: a.color,
        opacity: a.opacity ?? 0.55,
        thick: a.thick,
        label: a.label,
        labelAt: pts[a.sat ? 118 : 45],
      });
      if (a.sat)
        items.push({
          kind: 'point',
          shape: 'sat',
          color: a.color,
          label: a.sat.label,
          short: a.sat.short,
          labelDx: a.sat.dx,
          labelDy: a.sat.dy,
          offGlobe: a.sat.offGlobe,
          iss: !!a.sat.iss,
          minPx: a.sat.minPx,
          maxPx: a.sat.maxPx,
          scale: a.sat.big,
          pos: (t) => orbitPos(a.alt, a.inc, raan, phase + t * 2 * Math.PI * a.sat.speed),
        });
      if (a.sats)
        for (let s = 0; s < a.sats; s++) {
          const ph = (s / a.sats) * 2 * Math.PI;
          items.push({ kind: 'point', shape: 'sat', small: true, color: a.color, pos: () => orbitPos(a.alt, a.inc, a.raan, ph) });
        }
    }
    if (a.type === 'target' && tgt) {
      const pts = [];
      for (let k = 0; k <= 180; k++) pts.push(orbitPos(tgt.alt, tgt.inc, tgt.raan, (k / 180) * 2 * Math.PI));
      items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.35, role: 'orbit' });
      items.push({
        kind: 'point',
        shape: 'sat',
        prim: true,
        color: a.color,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
        scale: typeof a.big === 'number' ? a.big : a.big ? 1.3 : null,
        bright: !!a.bright,
        pos: (t) => (a.noHit || t <= tgt.t ? tgt.pos(t) : null),
        glow: a.noHit ? (t) => Math.abs(t - tgt.t) < 0.08 : null,
      });
    }
    if (a.type === 'target' && tgt && !a.noHit && a.label)
      // The target itself is gone after the hit: a small marker and label keep the impact point identified for the rest of the scene.
      items.push({
        kind: 'point',
        shape: 'tick',
        color: '#fff1c1',
        label: 'Impact point',
        short: 'Impact',
        labelDx: 40,
        labelDy: -30,
        opt: true,
        pos: (t) => (t >= tgt.t ? tgt.hitPos : null),
      });
    if (a.type === 'target' && tgt && a.fall) {
      // after the hit the body breaks into larger pieces that sink and burn up (illustrative)
      a.fall.forEach((f, i) => {
        const pos = (t) => {
          const dt = t - tgt.t;
          if (dt < 0) return null;
          const alt = tgt.alt * (1 - f.k * dt) - 6 * dt;
          return alt > 70 ? orbitPos(alt, tgt.inc + f.di, tgt.raan + f.dr, tgt.uHit + tgt.w * dt * f.dw) : null;
        };
        const tEnd = tgt.t + (1 - 75 / tgt.alt) / f.k,
          N = 36,
          all = [];
        for (let k = 0; k <= N; k++) all.push(pos(tgt.t + ((tEnd - tgt.t) * k) / N) || pos(tgt.t + ((tEnd - tgt.t) * (k - 1)) / N));
        items.push({
          kind: 'curve',
          dynamic: true,
          avoid: true,
          all,
          thick: 0.0045,
          color: '#ff9a55',
          width: 2,
          pts: (t) => {
            const s = clamp01((t - tgt.t) / (tEnd - tgt.t));
            return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
          },
        });
        items.push({
          kind: 'point',
          shape: 'kv',
          kvSize: 0.055,
          color: '#ffb872',
          label: i === 0 ? 'Larger pieces falling (illustrative)' : null,
          opt: true,
          short: 'Pieces falling (illustr.)',
          labelDx: 60,
          labelDy: 16,
          pos,
        });
        items.push({ kind: 'flash', pos: all[N], t0: Math.min(0.98, tEnd), color: '#ffd9a0', size: 0.12, span: 0.1 });
      });
    }
    if (a.type === 'aircraft') {
      const r = 1.012 + a.alt / 6371;
      const P = (s) => {
        const la = lerp(a.path[0][0], a.path[1][0], s),
          lo = lerp(a.path[0][1], a.path[1][1], s);
        return ll(la, lo, r);
      };
      const pos = (t) =>
        t >= a.t0 - 1e-6 && t <= a.t1 + 1e-6 ? P(clamp01((t - a.t0) / (a.t1 - a.t0))) : t > a.t1 && !a.gnss ? null : null;
      const item = {
        kind: 'point',
        shape: 'aircraft',
        prim: true,
        scale: a.gnss ? null : 1.1,
        color: '#e9edf7',
        label: a.label,
        labelDy: a.labelDy,
        labelDx: a.dx,
        pos: (t) => pos(Math.min(t, a.t1)),
      };
      if (!a.gnss) {
        aircraftPos = (t) => P(clamp01((Math.min(t, a.t1) - a.t0) / (a.t1 - a.t0)));
        // Climb: altitude rises along the path (exaggerated) and a trail shows where the F-15 has been.
        const Pc = (s) => {
          const la = lerp(a.path[0][0], a.path[1][0], s),
            lo = lerp(a.path[0][1], a.path[1][1], s);
          return ll(la, lo, r + 0.03 * s);
        };
        aircraftPos = (t) => Pc(clamp01((Math.min(t, a.t1) - a.t0) / (a.t1 - a.t0)));
        item.pos = (t) => (t >= a.t0 - 1e-6 ? aircraftPos(t) : null);
        const all = [];
        for (let k = 0; k <= 30; k++) all.push(Pc(k / 30));
        items.push({
          kind: 'curve',
          dynamic: true,
          avoid: true,
          all,
          thick: 0.004,
          color: '#e9edf7',
          width: 2,
          pts: (t) => {
            const s = clamp01((t - a.t0) / (a.t1 - a.t0));
            return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * 30) + 1));
          },
        });
      }
      if (a.gnss)
        items.push({
          kind: 'curve',
          avoid: true,
          soft: true,
          pts: () => {
            const q = [];
            for (let k = 0; k <= 30; k++) q.push(P(k / 30));
            return q;
          },
          color: '#cfd8ea',
          opacity: 0.4,
        });
      if (a.gnss) {
        item.gnss = true;
        item.path = a.path;
      }
      items.push(item);
    }
    if (a.type === 'intercept' && tgt) {
      const from = a.from === 'aircraft' ? aircraftPos(a.t0) : ll(a.from[0], a.from[1], 1.005);
      const to = tgt.hitPos;
      const mid = norm(add(from, to));
      const ctrl = scl(mid, Math.max(len(from), len(to)) + 0.2);
      const bez = (s) => add(add(scl(from, (1 - s) * (1 - s)), scl(ctrl, 2 * (1 - s) * s)), scl(to, s * s));
      const N = 60,
        all = [];
      for (let k = 0; k <= N; k++) all.push(bez(k / N));
      items._arc = { from, to, mid: bez(0.5), bez, t0: a.t0 };
      // Faint predicted path (whole arc, always visible) under the bright growing trail.
      items.push({ kind: 'curve', avoid: true, pts: () => all, color: a.color, opacity: 0.32, thick: 0.0028, role: 'action' });
      items.push({
        kind: 'curve',
        dynamic: true,
        avoid: true,
        all,
        thick: 0.0042,
        color: a.color,
        width: 2,
        label: a.label,
        labelAt: bez(0.5),
        labelEnd: tgt.t + 0.03,
        pts: (t) => {
          const s = clamp01((t - a.t0) / (tgt.t - a.t0));
          return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
        },
      });
      items.push({
        kind: 'point',
        shape: 'kv',
        color: a.color,
        pos: (t) => (t > a.t0 && t < tgt.t ? bez(clamp01((t - a.t0) / (tgt.t - a.t0))) : null),
      });
      items.push({ kind: 'flash', pos: to, t0: tgt.t, color: '#fff1c1', big: true, size: a.flash ?? 0.3, span: 0.16 });
    }
    if (a.type === 'debris' && tgt) {
      const n = Math.min(a.count, PARTICLE_BUDGET);
      const P = [];
      for (let k = 0; k < n; k++)
        P.push({
          da: gauss(rnd) * a.spreadAlt,
          di: gauss(rnd) * a.spreadInc,
          dr: gauss(rnd) * (a.spreadRaan ?? 0.4),
          dw: 1 + gauss(rnd) * a.dv,
          du: gauss(rnd) * 0.02,
          dec: a.decay * (0.4 + rnd() * 1.4),
          cj: (rnd() - 0.5) * 0.5,
          br: 0.7 + rnd() * 0.3,
        });
      // Fragments start hot (pale orange) and cool to dim red with age; each has its own tint and brightness. Soft sprites, normal blending: no white clipping.
      const HOT = [1, 0.8, 0.5],
        MID = [1, 0.5, 0.2],
        COOL = [0.62, 0.17, 0.12];
      let kc = 0,
        kb = 1e9;
      P.forEach((p, k) => {
        const sc = Math.abs(p.dw - 1) * 3 + Math.abs(p.da) / a.spreadAlt + Math.abs(p.du) * 8 + Math.abs(p.di) / a.spreadInc;
        if (sc < kb) {
          kb = sc;
          kc = k;
        }
      });
      const cloud = {
        kind: 'cloud',
        labelIdx: kc,
        n,
        color: a.color,
        dynCol: true,
        alpha: 0.7,
        size: a.size ?? (n > 2000 ? 0.019 : n > 400 ? 0.02 : 0.034),
        label: a.label,
        labelDx: a.dx,
        labelDy: a.dy,
        vis: 0,
        fill(t, out, colr) {
          const dt = t - tgt.t;
          let vis = 0;
          const dens = Math.min(1, Math.sqrt(300 / n));
          for (let k = 0; k < n; k++) {
            const p = P[k];
            let x = 0,
              y = 0,
              z = 0;
            if (dt > 0) {
              const alt = tgt.alt + p.da * Math.min(1, dt * 12) - p.dec * dt * tgt.alt;
              if (alt > 60) {
                const q = orbitPos(alt, tgt.inc + p.di, tgt.raan + p.dr, tgt.uHit + p.du + tgt.w * (a.drift ?? 1) * dt * p.dw);
                x = q[0];
                y = q[1];
                z = q[2];
                vis++;
              }
            }
            out[3 * k] = x;
            out[3 * k + 1] = y;
            out[3 * k + 2] = z;
            if (colr) {
              const age = clamp01(dt * (a.decay > 0 ? 2.2 : 0.8) + p.cj),
                c = age < 0.4 ? lerp3(HOT, MID, age / 0.4) : lerp3(MID, COOL, (age - 0.4) / 0.6),
                fade = 1 - 0.45 * age,
                k4 = 4 * k;
              colr[k4] = c[0] * p.br;
              colr[k4 + 1] = c[1] * p.br;
              colr[k4 + 2] = c[2] * p.br;
              colr[k4 + 3] = (0.7 + 0.3 * dens) * 0.9 * fade * (dt > 0 && dt < 0.02 ? dt / 0.02 : 1);
            }
          }
          cloud.vis = vis;
          return vis;
        },
      };
      items.push(cloud);
      if (a.decay > 0) items._decayCloud = cloud;
      if (a.decay > 0 && !cfg.status)
        items.push({
          kind: 'status',
          text: (t) =>
            t < tgt.t ? 'Approaching intercept' : `Illustrative fragments still aloft: ${cloud.vis} of ${n} (decay time-compressed)`,
        });
    }
    if (a.type === 'suborbital') {
      const N = 120,
        all = [];
      const g0 = ll(a.from[0], a.from[1]),
        g1 = ll(a.to[0], a.to[1]);
      const om = Math.acos(Math.max(-1, Math.min(1, dot(g0, g1))));
      for (let k = 0; k <= N; k++) {
        const s = k / N;
        const w0 = Math.sin((1 - s) * om) / Math.sin(om || 1),
          w1 = Math.sin(s * om) / Math.sin(om || 1);
        const d = om < 1e-3 ? g0 : norm(add(scl(g0, w0), scl(g1, w1)));
        all.push(scl(d, rAlt(a.apex * Math.sin(Math.PI * s))));
      }
      items.push({
        kind: 'curve',
        dynamic: true,
        trackable: true,
        t0: a.t0,
        t1: a.t1,
        avoid: true,
        opt: a.opt,
        short: a.short,
        all,
        thick: a.thick,
        color: a.color,
        width: 2,
        label: a.label,
        labelDx: a.dx,
        labelDy: a.dy,
        staticAt: a.staticAt,
        labelAt: all[Math.round(N * (a.labelIdx ?? 0.5))],
        pts: (t) => {
          const s = clamp01((t - a.t0) / (a.t1 - a.t0));
          return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
        },
      });
      items.push({ kind: 'curve', pts: () => all, color: a.color, opacity: 0.22, role: 'action' });
      if (a.marks) {
        // altitude ruler along the apogee direction: ticks at stated/analysed altitudes + GEO
        const d = norm(all[N >> 1]),
          tApex = a.t0 + (a.t1 - a.t0) * (a.apexT ?? 0.5);
        items.push({ kind: 'curve', pts: () => [scl(d, 1), scl(d, rAlt(GEO_ALT) * 1.02)], color: '#dfe6f7', opacity: 0.5 });
        a.marks.forEach((m) =>
          items.push({
            kind: 'point',
            shape: 'tick',
            offGlobe: true,
            opt: m.opt,
            color: m.color,
            label: m.label,
            short: m.short,
            staticAt: m.staticAt,
            labelDx: m.dx ?? 0,
            labelDy: m.dy ?? 0,
            pos: (t) => (m.apex && t < tApex ? null : scl(d, rAlt(m.alt))),
          }),
        );
      }
      if (a.head)
        items.push({
          kind: 'point',
          shape: 'kv',
          color: a.color,
          pos: (t) => {
            const s = clamp01((t - a.t0) / (a.t1 - a.t0));
            return s > 0 && s < 1 ? all[Math.round(s * N)] : null;
          },
        });
      focus = focus || a.from;
    }
    if (a.type === 'flash')
      items.push({
        kind: 'flash',
        pos: ll(a.at[0], a.at[1], rAlt(a.at[2])),
        t0: a.t0,
        color: a.color,
        big: true,
        size: a.size,
        span: a.span,
        ringColor: a.ringColor,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
      });
    if (a.type === 'belt') {
      const n = Math.min(a.count, PARTICLE_BUDGET);
      // Particles sit on discrete dipole field lines (L-shells: r = L cos^2(lat)) spaced around the planet in longitude, and each line is drawn as a
      // faint arch: the belt reads as a beaded magnetic cage that spreads out in longitude from the burst, not as a random dot cloud.
      const nL = a.nL ?? 3,
        nLon = a.nLon ?? 12,
        lines = nL * nLon,
        per = Math.ceil(n / lines),
        P = [],
        Lv = (i) => lerp(a.L[0], a.L[1], nL > 1 ? i / (nL - 1) : 0.5);
      const archLat = (L) => Math.acos(Math.sqrt(1 / L)) / DEG;
      for (let k = 0; k < n; k++) {
        const li = Math.floor(k / per),
          Li = li % nL,
          lo = Math.floor(li / nL),
          L = Lv(Li),
          lm = archLat(L),
          u = ((k % per) + 0.5) / per;
        P.push({
          L,
          lat: (u * 2 - 1) * lm * 0.97,
          side: ((lo + 0.5) / nLon) * 2 - 1,
          j: ((lo * 0.37) % 1) * 0.6 + rnd() * 0.02,
          rj: (rnd() - 0.5) * 0.004,
        });
      }
      const spread = (t) => Math.min(1, clamp01((t - a.t0) / (a.t1 - a.t0)) * 1.3);
      for (let Li = 0; Li < nL; Li++)
        for (let lo = 0; lo < nLon; lo++) {
          const L = Lv(Li),
            lm = archLat(L) * 0.97 * DEG,
            side = ((lo + 0.5) / nLon) * 2 - 1,
            jj = ((lo * 0.37) % 1) * 0.6;
          items.push({
            kind: 'curve',
            dynamic: true,
            uniformA: 0.3,
            opacity: 0.3,
            color: a.color,
            all: [],
            pts: (t) => {
              const s = clamp01((t - a.t0) / (a.t1 - a.t0));
              if (s <= jj * 0.25) return [];
              const lon = a.at[1] + side * 180 * spread(t),
                q = [];
              for (let k = 0; k <= 40; k++) {
                const la = -lm + (2 * lm * k) / 40,
                  rr = L * Math.cos(la) ** 2;
                q.push(ll(la / DEG, lon, rAlt((rr - 1) * 6371)));
              }
              return q;
            },
          });
        }
      items.push({
        kind: 'cloud',
        n,
        bg: true,
        color: a.color,
        alpha: 0.95,
        size: a.size ?? 0.017,
        label: a.label,
        short: a.short,
        labelFrom: a.t0 + 0.1,
        labelAt: (t) => ll(0, a.at[1] + 0.5833 * 180 * spread(t), rAlt(0.7 * 6371)), // a point on the outer equatorial field line, where particles are
        labelDx: 60,
        labelDy: 30,
        fill(t, out) {
          const s = clamp01((t - a.t0) / (a.t1 - a.t0));
          let vis = 0;
          for (let k = 0; k < n; k++) {
            const p = P[k];
            let x = 0,
              y = 0,
              z = 0;
            if (s > p.j * 0.25) {
              const rr = p.L * Math.cos(p.lat * DEG) ** 2;
              const alt = (rr - 1) * 6371;
              const q = ll(p.lat, a.at[1] + p.side * 180 * spread(t), rAlt(alt) + p.rj);
              x = q[0];
              y = q[1];
              z = q[2];
              vis++;
            }
            out[3 * k] = x;
            out[3 * k + 1] = y;
            out[3 * k + 2] = z;
          }
          return vis;
        },
      });
      focus = focus || a.at;
    }
    if (a.type === 'field') {
      a.Ls.forEach((L) => {
        const pts = [],
          lm = Math.acos(Math.sqrt(1 / L)) * 0.98;
        for (let k = 0; k <= 60; k++) {
          const la = -lm + (2 * lm * k) / 60,
            rr = L * Math.cos(la) ** 2;
          pts.push(ll(la / DEG, a.lon, rAlt((rr - 1) * 6371)));
        }
        items.push({ kind: 'curve', avoid: true, soft: true, pts: () => pts, color: a.color, opacity: 0.6, thick: 0.0035 });
      });
    }
    if (a.type === 'constellation') {
      const sats = [];
      for (let p = 0; p < a.planes; p++) {
        const raan = (p * 360) / a.planes,
          pts = [];
        for (let k = 0; k <= 120; k++) pts.push(orbitPos(a.alt, a.inc, raan, (k / 120) * 2 * Math.PI));
        items.push({ kind: 'curve', ctx: true, inset: !!a.inset, pts: () => pts, color: a.color, opacity: 0.13 });
        for (let s = 0; s < a.per; s++) {
          const ph = (s / a.per) * 2 * Math.PI + p * 0.5;
          const pos = (t) => orbitPos(a.alt, a.inc, raan, ph + t * a.speed * 2 * Math.PI);
          sats.push(pos);
          items.push({
            kind: 'point',
            shape: 'sat',
            small: true,
            ctx: true,
            color: a.color,
            pos,
            label: p === 0 && s === 0 ? a.label : null,
            opt: p === 0 && s === 0 ? !!a.opt : false,
            labelDx: a.dx ?? 50,
            labelDy: a.dy ?? -30,
          });
        }
      }
      items._gps = sats;
    }
    if (a.type === 'zone') {
      items.push({ kind: 'dome', at: a.at, radius: a.radius, color: a.color, label: a.label, labelDx: a.dx, labelDy: a.dy });
      items._zone = a;
      const c = ll(a.at[0], a.at[1]),
        e1 = norm([c[2], 0, -c[0]]),
        e2 = [c[1] * e1[2] - c[2] * e1[1], c[2] * e1[0] - c[0] * e1[2], c[0] * e1[1] - c[1] * e1[0]],
        q = [],
        rho = a.radius * DEG;
      for (let k = 0; k <= 72; k++) {
        const th = (k / 72) * 2 * Math.PI;
        q.push(add(scl(c, Math.cos(rho) * 1.006), scl(add(scl(e1, Math.cos(th)), scl(e2, Math.sin(th))), Math.sin(rho) * 1.006)));
      }
      items.push({ kind: 'curve', pts: () => q, color: '#ff8080', opacity: 1, thick: 0.004, role: 'action' });
    }
    if (a.type === 'geo') {
      const g = ll(0, a.lon, rAlt(GEO_ALT));
      items.push({ kind: 'point', shape: 'sat', prim: true, color: a.color, label: a.label, short: a.short, labelDy: a.dy ?? -30, labelDx: a.dx, scale: 1.7, bright: true, pos: () => g });
      a.beams.forEach((b, bi) => {
        // space side stays bright; only the ground-side segment dims once the ground network is hit
        const e = ll(b[0], b[1], 1.003),
          m = add(scl(g, 0.4), scl(e, 0.6));
        items.push({ kind: 'beam', a: () => g, b: () => m, on: () => true, color: a.color, opacity: 0.4, width: 0.0038 });
        // Service traffic: small packets ride the downlink from the satellite to the ground; they stop once the ground side goes dark (illustrative).
        for (let k = 0; k < 3; k++)
          items.push({
            kind: 'point',
            shape: 'kv',
            kvSize: 0.045,
            color: '#ffe6a8',
            pos: (t) => {
              if (t > a.dimT1 + 0.05) return null;
              const s = (t * 2.2 + k / 3 + bi * 0.17) % 1;
              return add(scl(g, 1 - s), scl(e, s));
            },
          });
        items.push({
          kind: 'beam',
          a: () => m,
          b: () => e,
          on: () => true,
          color: a.color,
          opacity: 0.4,
          width: 0.0038,
          colorFn: (t) => (t > a.dimT0 + bi * 0.03 ? '#d98a7a' : a.color),
          opFn: (t) => 0.4 - 0.34 * smooth((t - a.dimT0 - bi * 0.03) / (a.dimT1 - a.dimT0)),
        });
      });
      if (a.hub) {
        // illustrative ground management network: links from a hub to regional nodes, with a malware pulse running along them
        const hub = a.hub,
          N = 40,
          pulse = a.pulse;
        // Ground segment under attack (SWF 15-06/15-07): the hub is compromised first (turns red, repeated red rings), malicious commands then run
        // out along every management link (three packets per link, red trail), and each regional node flashes and turns red when the commands arrive.
        items.push({
          kind: 'point',
          shape: 'site',
          pos: () => ll(hub[0], hub[1], 1.004),
          color: '#7fd6ff',
          statusColor: (t) => (t >= pulse[0] ? '#ff6b6b' : '#7fd6ff'),
          scale: 1.5,
          label: a.hubLabel,
          short: a.hubShort,
          labelDx: a.hubDx,
          labelDy: a.hubDy,
        });
        a.beams.forEach((b, bi) => {
          const all = groundArc(hub, b, N),
            q = (k) => all[Math.max(0, Math.min(N, Math.round(k * N)))];
          const t0 = pulse[0] + bi * 0.012,
            st = (t) => clamp01((t - t0) / (pulse[1] - pulse[0])),
            arr = t0 + (pulse[1] - pulse[0]);
          items.push({ kind: 'curve', avoid: true, pts: () => all, color: '#7fd6ff', opacity: 0.38, thick: 0.0018 });
          items.push({
            kind: 'curve',
            dynamic: true,
            avoid: true,
            all,
            thick: 0.0032,
            color: '#ff6b6b',
            width: 2,
            pts: (t) => {
              const s = st(t);
              return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
            },
          });
          for (let k = 0; k < 3; k++)
            items.push({
              kind: 'point',
              shape: 'kv',
              kvSize: 0.07,
              color: '#ff8a8a',
              pos: (t) => {
                const s = st(t) - k * 0.22;
                return s > 0 && s < 1 && t < arr + 0.02 ? q(s) : null;
              },
            });
          items.push({
            kind: 'point',
            shape: 'site',
            small: true,
            scale: 1.3,
            color: '#7fd6ff',
            statusColor: (t) => (t >= arr ? '#ff5d5d' : '#7fd6ff'),
            pos: () => all[N],
          });
          items.push({ kind: 'flash', pos: all[N], t0: arr, color: '#ffc0c0', ringColor: '#ff6b6b', size: 0.16, span: 0.09 });
        });
        [0, 0.05, 0.1].forEach((dt) =>
          items.push({
            kind: 'flash',
            pos: ll(hub[0], hub[1], 1.01),
            t0: pulse[0] + dt,
            color: '#ffb3b3',
            ringColor: '#ff6b6b',
            size: 0.2,
            span: 0.16,
          }),
        );
      }
      focus = focus || [30, a.lon];
    }
    if (a.type === 'terminals') {
      const P = [];
      // Each box is a region [lat0, lat1, lon0, lon1, share, wave]: regions go dark one after another (wave order), terminals within a region over its own window.
      const nw = Math.max(...a.boxes.map((b) => (b[5] ?? 0) + 1));
      a.boxes.forEach(([la0, la1, lo0, lo1, frac, wave], bi) => {
        const m = Math.round(a.count * frac * (IS_PHONE ? 0.6 : 1)); // fewer, smaller dots on a phone: the region stays readable instead of one red blob
        for (let k = 0; k < m; k++)
          P.push({
            p: ll(lerp(la0, la1, rnd()), lerp(lo0, lo1, rnd()), 1.004),
            off: wave == null ? lerp(a.t0, a.t1, bi === 0 ? rnd() * 0.6 : 0.3 + rnd() * 0.7) : lerp(a.t0, a.t1, (wave + rnd() * 0.8) / nw),
          });
      });
      const n = P.length;
      items.push({
        kind: 'cloud',
        n,
        size: 0.02,
        minPx: IS_PHONE ? 1.7 : 3.6,
        maxPx: 12,
        dynCol: true,
        label: a.label,
        short: a.short,
        labelAt: ll(49, 30, 1.05),
        labelDx: 90,
        labelDy: -56,
        colored: true,
        fill(t, out, col) {
          for (let k = 0; k < n; k++) {
            const q = P[k].p;
            out[3 * k] = q[0];
            out[3 * k + 1] = q[1];
            out[3 * k + 2] = q[2];
            const dark = t > P[k].off,
              blink = dark && t < P[k].off + 0.07;
            const k4 = 4 * k;
            col[k4] = blink ? 1 : dark ? 1 : 0.35;
            col[k4 + 1] = blink ? 0.85 : dark ? 0.24 : 1.0;
            col[k4 + 2] = blink ? 0.6 : dark ? 0.2 : 0.62;
            col[k4 + 3] = blink ? 1 : dark ? 0.8 : 0.75;
          }
          return n;
        },
      });
      const dark = (t) => {
        let d = 0;
        for (let k = 0; k < n; k++) if (t > P[k].off) d++;
        return d;
      };
      items.push({
        kind: 'status',
        text: (t, still, phone) => {
          if (phone) {
            if (t < a.pulse0) return 'Before the attack: modems online';
            if (t < a.t0) return 'Attackers reach the ground network';
            return t < a.t1 ? `Malware wipes modems · ${dark(t)}/${n} offline` : 'Modems offline · satellite kept working';
          }
          const tx =
            t < a.pulse0
              ? 'Before the attack: user modems online (green), KA-SAT serving Europe'
              : t < a.t0
                ? 'Attackers reach the ground management network and push malicious commands (illustrative network)'
                : t < a.t1
                  ? 'Malware overwrites modems (SWF: ~45 min): red = offline'
                  : 'Modems offline (red) · the satellite kept working';
          return t >= a.t0 ? `${tx} · ${dark(t)} of ${n} simulated terminals offline` : tx;
        },
      });
    }
    if (a.type === 'beam' && tgt) {
      const from = ll(a.from[0], a.from[1], 1.004);
      const su = norm(from); // beam is on while the satellite is above the site's horizon, within the window
      items.push({
        kind: 'beam',
        avoid: true,
        a: () => from,
        b: (t) => tgt.pos(t),
        on: (t) => Math.abs(t - tgt.t) < a.window && dot(tgt.pos(t), su) > 1.02,
        color: a.color,
        opacity: 0.95,
        width: 0.022,
        maxPx: 15,
        coreColor: '#ffe3f9',
        ends: 0.05,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
      });
    }
  }
  // GNSS links: aircraft <-> 4 highest GPS satellites; red when inside zone.
  if (items._gps && items._zone) {
    const z = items._zone,
      zc = ll(z.at[0], z.at[1]);
    items
      .filter((i) => i.gnss)
      .forEach((ac) => {
        const inZone = (t) => {
          const p = ac.pos(t);
          return p && Math.acos(Math.min(1, dot(norm(p), zc))) / DEG < z.radius;
        };
        ac.statusColor = (t) => (inZone(t) ? C.jam : C.ok);
        ac.labelFn = (t) => (inZone(t) ? ac.label + ' · GNSS lost' : ac.label + ' · GNSS OK');
        for (let k = 0; k < 1; k++)
          items.push({
            kind: 'beam',
            link: true,
            avoid: true,
            soft: true,
            opacity: 0.7,
            width0: 0.0018,
            a: (t) => ac.pos(t),
            b: (t) => {
              const p = ac.pos(t);
              if (!p) return null;
              const s = items._gps
                .map((f) => f(t))
                .map((q) => [q, dot(norm(q), norm(p))])
                .sort((x, y) => y[1] - x[1]);
              return s[k][0];
            },
            on: (t) => !!ac.pos(t),
            colorFn: (t) => (inZone(t) ? C.jam : C.ok),
            dashFn: inZone,
          });
      });
  }
  const f = focus || [20, 0];
  const dist = (cfg.camDist || 4.2) * (IS_PHONE ? (cfg.phoneK ?? 1) : 1);
  const wide = { name: 'Wide', pos: ll(f[0] * 0.6 + 10, f[1] - 25, dist) },
    polar = { name: 'Polar', pos: ll(80, f[1], dist * 1.05) };
  let cams;
  // Frame camera: position and target given in an anchor's local frame [along, radial, cross-track] in Earth radii. `follow: true` re-solves it at every t,
  // so the camera rides with a moving craft and the craft is always in frame.
  const frameAt = (fr, t) => {
    const an = anchors[fr.anchor],
      p = an.pos(t),
      f = an.frame(t),
      o = (v) => add(add(add(p, scl(f.along, v[0])), scl(f.rad, v[1])), scl(f.cross, v[2]));
    return { pos: o(fr.from), look: o(fr.to), up: fr.up === false ? null : f.rad };
  };
  const frameCam = (fr) => ({ ...frameAt(fr, fr.t), hideShell: true, follow: fr.follow ? (t) => frameAt(fr, t) : null });
  // Dolly camera for the hit scenes: at a few key times the camera is fitted to everything that matters then (launch site, target, hit point, the
  // bulk of the debris) so the action fills the frame; between keys it glides, so it pulls back as the debris spreads.
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // Frame fitting depends on the stage aspect: follow cameras are re-solved with the real aspect (host passes it), static ones use this default.
  const ASPECT = IS_PHONE ? 1.04 : 1.22,
    tanFor = (asp) => {
      const tv = Math.tan(20 * DEG) * Math.max(1, 1.1 / asp);
      return [tv * asp, tv];
    };
  // The viewing direction n is fixed for the whole scene (no roll or jump as the debris spreads); only the target point and the distance are fitted.
  const fitPose = (pts, n, look, o = {}) => {
    const [tanH, tanV] = tanFor(o.asp ?? ASPECT);
    let pos = null;
    for (let D = o.dMin ?? 0.9; D <= (o.dMax ?? 9); D += 0.05) {
      pos = add(look, scl(n, D));
      const f = norm(add(look, scl(pos, -1))),
        r = norm(cross3(f, o.up || [0, 1, 0])),
        u = cross3(r, f);
      if (
        pts.every((q) => {
          const v = add(q, scl(pos, -1)),
            z = dot(v, f);
          return z > 0.1 && Math.abs(dot(v, r) / z) <= tanH * (o.fillX ?? 0.8) && Math.abs(dot(v, u) / z) <= tanV * (o.fillY ?? 0.66);
        })
      )
        break;
    }
    return { pos, look };
  };
  const centroid = (pts) => scl(pts.reduce((q, p) => add(q, p), [0, 0, 0]), 1 / pts.length);
  const debrisPts = (tk, pct) => {
    const cl = items.find((i) => i.kind === 'cloud' && i.dynCol && !i.colored);
    if (!cl || !tgt || tk <= tgt.t + 0.01) return [];
    const arr = new Float32Array(cl.n * 3);
    cl.fill(tk, arr);
    const q = [];
    for (let k = 0; k < cl.n; k++) if (arr[3 * k] || arr[3 * k + 1] || arr[3 * k + 2]) q.push([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]);
    if (q.length < 3) return [];
    const c = scl(q.reduce((a, p) => add(a, p), [0, 0, 0]), 1 / q.length),
      d = q.map((p) => len(add(p, scl(c, -1)))),
      cut = d.slice().sort((x, y) => x - y)[Math.floor((q.length - 1) * pct)];
    return q.filter((p, k) => d[k] <= cut).filter((p, k, a) => k % Math.max(1, Math.floor(a.length / 40)) === 0);
  };
  const dollyCam = () => {
    const ht = tgt.t,
      arc = items._arc,
      keys = [0, ht, ht + 0.1, 0.6, 1],
      core = [tgt.hitPos].concat(arc ? [arc.from] : [], aircraftPos ? [aircraftPos(0)] : []),
      c0 = centroid(core),
      cn = norm(c0);
    let sd = cross3(cn, [0, 1, 0]);
    if (len(sd) < 0.2) sd = [1, 0, 0];
    const tilt = (cfg.fitTilt ?? 24) * DEG,
      n = norm(add(scl(cn, Math.cos(tilt)), scl(norm(sd), Math.sin(tilt) * (cfg.fitSide ?? 1)))),
      cache = {},
      posesFor = (asp) =>
        (cache[Math.round(asp * 20)] ||= keys.map((tk) => {
        const P = core.slice();
        if (arc && tk <= ht + 0.05) P.push(arc.to);
        if (tk <= ht) P.push(tgt.pos(tk));
        if (tk > ht) P.push(...debrisPts(tk, cfg.fitPct ?? 0.8));
        return fitPose(P, n, scl(add(scl(c0, 0.5), scl(centroid(P), 0.5)), cfg.lookK ?? 0.97), {
          dMin: cfg.fitMin ?? 0.3,
          dMax: cfg.fitMax ?? 6.5,
          fillX: cfg.fitFill ?? 0.9,
          fillY: (cfg.fitFill ?? 0.9) * 0.8,
          asp,
        });
      }));
    const at = (t, asp = ASPECT) => {
      const poses = posesFor(asp);
      let i = 0;
      while (i < keys.length - 2 && t > keys[i + 1]) i++;
      const s = smooth((t - keys[i]) / (keys[i + 1] - keys[i])),
        a = poses[i],
        b = poses[i + 1];
      return { pos: add(scl(a.pos, 1 - s), scl(b.pos, s)), look: add(scl(a.look, 1 - s), scl(b.look, s)), up: null };
    };
    return { name: 'Follow the action', follow: at, ...at(0), hideShell: true };
  };
  if (cfg.cameras)
    cams = cfg.cameras.map((c0) => {
      const c = IS_PHONE && c0.phone ? { ...c0, ...c0.phone } : c0;
      if (c.fit && tgt) {
        // Tracking camera: fitted at every t to a ground site and the (moving) target, so the satellite is always in frame.
        const site = ll(c.fit.site[0], c.fit.site[1], 1.004),
          mid = norm(add(site, tgt.pos(tgt.t))),
          sd = norm(cross3(mid, [0, 1, 0])),
          tilt = (c.fit.tilt ?? 26) * DEG,
          n = norm(add(scl(mid, Math.cos(tilt)), scl(sd, Math.sin(tilt) * (c.fit.side ?? 1)))),
          at = (t, asp) => {
            const q = tgt.pos(t),
              P = [site, q],
              look = scl(add(scl(site, 0.5), scl(q, 0.5)), 0.97);
            return { ...fitPose(P, n, look, { dMin: 0.3, dMax: c.fit.dMax ?? 6, fillX: c.fit.fill ?? 0.86, fillY: (c.fit.fill ?? 0.86) * 0.8, asp }), up: null };
          };
        return { name: c.name, auto: false, ref: c.ref, follow: at, ...at(tgt.t), hideShell: true };
      }
      if (c.fitPts) {
        // Static camera fitted once to a list of [lat, lon, r] points, seen from the direction dir = [lat, lon].
        const P = c.fitPts.pts.map((q) => ll(q[0], q[1], q[2] ?? 1.004)),
          n = norm(ll(c.fitPts.dir[0], c.fitPts.dir[1])),
          look = scl(centroid(P), c.fitPts.lookK ?? 1),
          at = (t, asp) => ({
            ...fitPose(P, n, look, { dMin: 1, dMax: 12, fillX: c.fitPts.fill ?? 0.86, fillY: (c.fitPts.fillY ?? c.fitPts.fill ?? 0.86) * 0.8, asp }),
            up: null,
          }),
          v = at(0);
        return { name: c.name, auto: false, ref: c.ref, pos: v.pos, look: v.look, follow: at, hideShell: true };
      }
      if (c.trackPath) {
        // Camera that follows a suborbital path: fitted at every t to the launch site, the head of the path and (later) the GEO ring above the apogee.
        const it = items.find((i) => i.trackable),
          all = it.all,
          up = norm(all[all.length >> 1]),
          sd = norm(cross3(up, [0, 1, 0])),
          tilt = (c.trackPath.tilt ?? 30) * DEG,
          n = norm(add(scl(up, Math.cos(tilt)), scl(sd, Math.sin(tilt) * (c.trackPath.side ?? 1)))),
          at = (t, asp) => {
            const pl = it.pts(t),
              P = [all[0], pl.length ? pl[pl.length - 1] : all[1], all[Math.min(all.length - 1, Math.round(((t - it.t0) / (it.t1 - it.t0) + 0.22) * (all.length - 1)))]];
            if (t > (c.trackPath.geoT ?? 0.35)) P.push(scl(up, rAlt(GEO_ALT)));
            const look = scl(centroid(P.concat([[0, 0, 0]])), 1);
            return { ...fitPose(P, n, look, { dMin: 1.2, dMax: 12, fillX: c.trackPath.fill ?? 0.8, fillY: (c.trackPath.fill ?? 0.8) * 0.8, asp }), up: null };
          };
        return { name: c.name, auto: false, ref: c.ref, follow: at, ...at(0), hideShell: true };
      }
      if (c.fitCraft) {
        // Tight follow camera on a set of craft: the view direction is given in the anchor's local frame [along, radial, cross-track] and stays fixed;
        // the target point and the distance are fitted at every t to the craft (now and a little ahead), so the action always fills the frame.
        const an = anchors[c.fitCraft.anchor],
          ids = c.fitCraft.ids,
          at = (t, asp) => {
            const P = [];
            for (const id of ids)
              if (crafts[id].pos(t))
                for (const dt of [-0.05, 0, 0.02]) P.push(crafts[id].raw(Math.max(0, Math.min(1, t + dt))));
            if (!P.length) for (const id of ids) P.push(crafts[id].raw(t));
            const f = an.frame(t),
              d = c.fitCraft.dir,
              n = norm(add(add(scl(f.along, d[0]), scl(f.rad, d[1])), scl(f.cross, d[2])));
            return { ...fitPose(P, n, centroid(P), { up: f.rad, dMin: c.fitCraft.dMin ?? 0.14, dMax: 6, fillX: c.fitCraft.fill ?? 0.8, fillY: (c.fitCraft.fill ?? 0.8) * 0.8, asp }), up: f.rad };
          };
        return { name: c.name, auto: !!c.auto, act: c.act, ref: c.ref, follow: at, ...at(c.fitCraft.t ?? 0.5), hideShell: true };
      }
      if (c.frame) return { name: c.name, auto: !!c.auto, act: c.act, ref: c.ref, ...frameCam(c.frame) };
      return { name: c.name, auto: !!c.auto, act: c.act, ref: c.ref, pos: ll(...c.at), look: c.look ? ll(...c.look) : null, hideShell: !!c.look };
    });
  else if (H && !items._arc) cams = [{ name: 'Zoom', pos: ll(f[0] * 0.8 + 6, f[1] - 12, Math.max(2.5, dist * 0.72)) }, wide, polar];
  else if (items._arc) {
    // launch site through the intercept: a side-on camera looking at the middle of the arc
    const { from, to, mid } = items._arc,
      md = norm(mid),
      e1 = norm(add(to, scl(from, -1))),
      nrm = norm([md[1] * e1[2] - md[2] * e1[1], md[2] * e1[0] - md[0] * e1[2], md[0] * e1[1] - md[1] * e1[0]]);
    const look = add(mid, scl(md, -0.03 - (cfg.lookMix ?? 0) * len(mid))),
      launch = {
        name: 'Launch',
        pos: add(
          look,
          add(scl(nrm, 0.78 * (cfg.camScale || 1) * (IS_PHONE ? 0.8 : 1)), scl(md, 0.34 * (cfg.camScale || 1) * (IS_PHONE ? 0.8 : 1))),
        ),
        look,
        hideShell: true,
      };
    if (cfg.launchAt) {
      const k = IS_PHONE ? (cfg.launchPhoneK ?? 1.05) : 1,
        [ca, cb, cK] = cfg.launchAt;
      launch.pos = add(scl(md, ca * k), scl(nrm, cb * k));
      launch.look = scl(md, cK);
    } else if (cfg.wideLaunch) {
      const D = cfg.wideLaunch * (IS_PHONE ? 1.05 : 1);
      launch.pos = add(scl(md, D * 0.86), scl(nrm, D * 0.5));
      launch.look = scl(md, cfg.lookK ?? 0.3);
    }
    const orbit = {
      name: 'Orbit',
      pos: cfg.orbitAt
        ? ll(cfg.orbitAt[0], cfg.orbitAt[1], cfg.orbitAt[2] * (IS_PHONE ? (cfg.phoneK ?? 1) : 1))
        : ll(f[0] * 0.5 + 12, f[1] - 30, Math.max(3.2, dist * 0.8)),
    };
    cams = cfg.launchCam === 'second' ? [orbit, launch, polar] : [launch, orbit, polar];
    if (H && cfg.dolly !== false) cams.unshift(dollyCam());
  } else cams = [wide, { name: 'Near', pos: ll(f[0], f[1] - 8, Math.max(2.3, dist * 0.55)) }, polar];
  // Still-frame camera: for act scenes, the camera of the act that contains t; otherwise cfg.stillFrame (a frame camera) if given.
  const stillCamFor = (t, asp) => {
    if (A) {
      const i = A.findIndex((a, k) => t >= a.t0 && (t < a.t1 || k === A.length - 1));
      const c = cams[A[Math.max(0, i)].cam],
        v = c.follow ? c.follow(t, asp) : c;
      return { pos: v.pos, look: v.look, up: v.up, hideShell: true };
    }
    if (cfg.stillFrame) return frameCam(cfg.stillFrame);
    if (cfg.stillDolly !== false && cfg.stillCam == null && cams[0].follow && !cfg.acts) return { ...cams[0].follow(t, asp), hideShell: true };
    return null;
  };
  return { cfg, items, cams, flags, stillCamFor, still: cfg.still ?? 0.5, sunRef: cams[0].pos };
}

// ---------------------------------------------------------------- land texture
