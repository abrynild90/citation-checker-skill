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
import { buildCameras } from './cameras.js';
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
  const actOn = (t, acts) => flags.all || !A || !acts || acts.some((i) => t >= A[i].t0 - 1e-9 && (t < A[i].t1 || (i === A.length - 1 && t <= A[i].t1 + 1e-9)));
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
      staticAng: cfg.staticShellAng?.[s],
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
        if (still || !c || cfg.noSimCount || !tgt || t < tgt.t + 0.02) return s;
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
      // staticKey: the static diagram draws this craft at a fixed, more exaggerated offset (e.g. clearly above the GEO belt, not on its line)
      if (a.staticKey) a.staticPos = (t) => (actOn(t, a.acts) && inVis(t) ? craftPos(anc, a.staticKey, t) : null);
      const it = {
        kind: 'point',
        shape: a.model || 'sat',
        prim: true,
        craftId: a.id,
        dockWith: a.dock?.with,
        dockOn: a.dock ? (t) => t >= a.dock.t0 && t <= a.dock.t1 : null,
        dockT: a.dock ? [a.dock.t0, a.dock.t1] : null,
        minPx: a.minPx,
        maxPx: a.maxPx,
        small: !!a.small,
        variant: a.variant,
        scale: a.scale ?? null,
        color: a.color,
        bright: !!a.bright,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
        pos,
        staticPos: a.staticPos,
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
      const N = a.N ?? 60,
        all = [],
        ts = crafts[a.craft].anc.times?.(a.t0, a.t1, N);
      for (let k = 0; k <= N; k++) all.push(crafts[a.craft].raw(ts ? ts[k] : a.t0 + ((a.t1 - a.t0) * k) / N));
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
          return s <= 0 ? [] : all.slice(0, Math.max(2, ts ? ts.filter((x) => x <= t).length : Math.round(s * N) + 1));
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
        push: a.push,
        label: a.label,
        short: a.short,
        staticHide: a.staticHide,
        staticKeep: a.staticKeep,
        labelAt: all[Math.min(all.length - 1, a.labelIdx ?? 0)],
        labelDx: a.dx,
        labelDy: a.dy,
        opt: a.opt,
      });
    }
    if (a.type === 'site')
      items.push({
        kind: 'point',
        shape: 'site',
        liveOnly: a.liveOnly,
        offGlobe: a.offGlobe,
        scale: a.small ? 1.7 : null,
        minPx: a.minPx,
        maxPx: a.maxPx,
        pin: a.pin,
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
        push: a.push,
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
          // fail: from this time the satellite is flagged as damaged (a visible end cue; SWF: such tests damaged or destroyed satellites)
          ...(a.sat.fail && {
            labelFn: (t, n) => (t >= a.sat.fail.t ? (n ? a.sat.fail.short : a.sat.fail.label) : n ? a.sat.short : a.sat.label),
            statusColor: (t) => (t >= a.sat.fail.t ? '#ff9a9a' : '#dfe6f7'),
          }),
          pos: (t) => orbitPos(a.alt, a.inc, raan, phase + t * 2 * Math.PI * a.sat.speed),
          staticPos: a.sat.staticPh != null ? (t) => orbitPos(a.alt, a.inc, raan, phase + a.sat.staticPh + t * 2 * Math.PI * a.sat.speed) : null,
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
        minPx: a.minPx,
        maxPx: a.maxPx,
        bright: !!a.bright,
        pos: (t) => (a.noHit || t <= tgt.t ? tgt.pos(t) : null),
        staticPos: (a.staticK ?? cfg.staticK) ? (t) => scl(tgt.pos(t), a.staticK ?? cfg.staticK) : null,
        glow: a.noHit ? (t) => Math.abs(t - tgt.t) < 0.08 : null,
      });
    }
    if (a.type === 'target' && tgt && !a.noHit && a.label)
      // The target itself is gone after the hit: a small marker and label keep the impact point identified for the rest of the scene.
      items.push({
        kind: 'point',
        shape: 'tick',
        impactMark: true,
        color: '#fff1c1',
        label: a.impactLabel ?? 'Impact',
        short: a.impactShort ?? 'Impact',
        labelDx: a.impactDx ?? 70,
        labelDy: a.impactDy ?? -50,
        opt: true,
        pos: (t) => (t > tgt.t + 0.02 ? tgt.hitPos : null),
      });
    if (a.type === 'target' && tgt && a.wreck)
      // A dim, smaller copy of the satellite stays at the impact point: the wreck marker (its debris is the cloud).
      items.push({
        kind: 'point',
        shape: 'sat',
        color: '#7c8497',
        scale: (typeof a.big === 'number' ? a.big : 1.3) * 0.55,
        minPx: 22,
        maxPx: 40,
        pos: (t) => (t > tgt.t + 0.02 ? tgt.hitPos : null),
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
      const pos = (t) => (t >= a.t0 - 1e-6 && t <= a.t1 + 1e-6 ? P(clamp01((t - a.t0) / (a.t1 - a.t0))) : t > a.t1 && !a.gnss ? null : null);
      const item = {
        kind: 'point',
        shape: 'aircraft',
        prim: true,
        scale: a.gnss ? null : 1.1,
        color: '#e9edf7',
        label: a.label,
        labelDy: a.labelDy,
        labelDx: a.dx,
        beamLabel: a.beamLabel,
        beamShort: a.beamShort,
        beamDx: a.beamDx,
        beamDy: a.beamDy,
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
        labelEnd: tgt.t + (a.hold ?? 0.03), // a.hold: the label outlives the hit (the still is taken just after it)
        pts: (t) => {
          const s = t >= a.t0 - 1e-6 ? Math.max(0.04, clamp01((t - a.t0) / (tgt.t - a.t0))) : 0;
          return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
        },
      });
      // The SM-3 is drawn from the first instant of its flight (t0): the head is already clear of the deck (s0) with a short exhaust plume behind it.
      const s0 = 0.04,
        sAt = (t) => Math.max(s0, clamp01((t - a.t0) / (tgt.t - a.t0)));
      items.push({
        kind: 'point',
        shape: 'kv',
        color: a.color,
        pos: (t) => (t >= a.t0 - 1e-6 && t < tgt.t ? bez(sAt(t)) : null),
      });
      items.push({
        kind: 'point',
        shape: 'kv',
        kvSize: 0.07,
        color: '#ffd9a0',
        pos: (t) => (t >= a.t0 - 1e-6 && t < tgt.t ? bez(Math.max(0.012, sAt(t) - 0.035)) : null),
      });
      items.push({
        kind: 'flash',
        pos: to,
        t0: tgt.t,
        color: '#fff1c1',
        big: true,
        strong: !!a.strong,
        size: (a.flash ?? 0.3) * (IS_PHONE ? 0.42 : 1),
        span: a.strong ? 0.2 : 0.16,
      });
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
        COOL = a.lateGlow ? [0.95, 0.45, 0.25] : [0.62, 0.17, 0.12]; // lateGlow: old fragments stay clearly visible
      let kc = 0,
        kb = 1e9;
      const ranked = [];
      P.forEach((p, k) => {
        const sc = Math.abs(p.dw - 1) * 3 + Math.abs(p.da) / a.spreadAlt + Math.abs(p.du) * 8 + Math.abs(p.di) / a.spreadInc;
        ranked.push([sc, k]);
        if (sc < kb) {
          kb = sc;
          kc = k;
        }
      });
      ranked.sort((x, y) => x[0] - y[0]);
      const cloud = {
        kind: 'cloud',
        labelIdx: kc,
        labelCands: ranked
          .slice(0, 8)
          .map((r) => r[1])
          .concat(P.map((_, k) => k).filter((k) => k % Math.ceil(n / 24) === 0)), // stand-ins for the label particle when it is behind the Earth (gl-labels)
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
                // optional late phase: the band keeps spreading along and across the orbit (time compressed)
                const lt = a.late ? Math.max(0, t - a.late.t0) : 0,
                  q = orbitPos(
                    alt,
                    tgt.inc + p.di,
                    tgt.raan + p.dr * (1 + (a.late?.kr ?? 0) * lt),
                    tgt.uHit + p.du + tgt.w * (a.drift ?? 1) * (dt * p.dw + (a.late ? a.late.k * lt * (p.dw - 1) : 0)),
                  );
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
                fade = 1 - (a.lateGlow ? 0.2 : 0.45) * age,
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
          text: (t) => (t < tgt.t ? 'Approaching intercept' : `Illustrative fragments still aloft: ${cloud.vis} of ${n} (decay time-compressed)`),
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
        labelEnd: a.labelEnd,
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
            staticAtPrint: m.staticAtPrint,
            shortPrint: m.shortPrint,
            staticPin: m.staticPin,
            labelDx: m.dx ?? 0,
            labelDy: m.dy ?? 0,
            pos: (t) => (m.apex && t < tApex ? null : scl(d, rAlt(m.alt))),
          }),
        );
      }
      if (a.head) {
        // glowing rocket head: a wide halo in the path colour around a small white-hot core (about 2x the old red dot, much brighter)
        const headPos = (t) => {
          const s = clamp01((t - a.t0) / (a.t1 - a.t0));
          return s > 0 && s < 1 ? all[Math.round(s * N)] : null;
        };
        items.push({ kind: 'point', shape: 'kv', color: a.color, kvSize: 0.3, kvMin: 28, kvMax: 64, pos: headPos });
        items.push({ kind: 'point', shape: 'kv', color: a.headColor ?? '#fff1e6', kvSize: 0.14, kvMin: 14, kvMax: 30, pos: headPos });
      }
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
            staticKeep: lo % 3 === 0 && Li !== 1, // the static diagram draws a third of the arches: a cage, not a tangle
            limbOnly: true, // ... and only where they stand out against the sky, never across the Earth's face
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
        limbOnly: true,
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
      if (a.jammer)
        items.push({
          kind: 'point',
          shape: 'jammer',
          pos: () => ll(a.jammer.at[0], a.jammer.at[1], 1.003),
          color: a.color,
          label: a.jammer.label,
          short: a.jammer.short,
          labelDx: a.jammer.dx,
          labelDy: a.jammer.dy,
        });
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
      items.push({
        kind: 'point',
        shape: 'sat',
        prim: true,
        insetLabel: a.insetLabel,
        color: a.color,
        label: a.label,
        short: a.short,
        labelDy: a.dy ?? -30,
        labelDx: a.dx,
        scale: 1.7,
        bright: true,
        minPx: a.minPx,
        maxPx: a.maxPx,
        pos: () => g,
      });
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
      // Each box is a region [lat0, lat1, lon0, lon1, share, wave]: regions go dark one after another (wave order), terminals within a region over
      // its own window.
      const nw = Math.max(...a.boxes.map((b) => (b[5] ?? 0) + 1));
      // The sample is canonical (full count, own seeded RNG), so the offline count is a function of t alone; a phone draws the first 60% of each
      // region's dots, but the stated count still comes from the whole sample.
      const canon = [];
      a.boxes.forEach(([la0, la1, lo0, lo1, frac, wave], bi) => {
        const m = Math.round(a.count * frac),
          mShow = Math.round(m * (IS_PHONE ? 0.6 : 1)),
          rv = mulberry(4001 + bi * 131);
        for (let k = 0; k < m; k++) {
          const la = lerp(la0, la1, rv()),
            lo = lerp(lo0, lo1, rv()),
            off = wave == null ? lerp(a.t0, a.t1, bi === 0 ? rv() * 0.6 : 0.3 + rv() * 0.7) : lerp(a.t0, a.t1, (wave + rv() * 0.8) / nw);
          canon.push(off);
          if (k < mShow) P.push({ p: ll(la, lo, 1.004), off });
        }
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
        labelAt: ll(49, 30, a.labelOffDisc ? 1.004 : 1.05),
        labelOffDisc: a.labelOffDisc,
        labelDx: a.labelDx ?? 90,
        labelDy: a.labelDy ?? -56,
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
      // The count is stated against the nominal sample (a.count) at every width: a phone draws fewer dots, but the share offline is the same number.
      const dark = (t) => {
        let d = 0;
        for (const o of canon) if (t > o) d++;
        return Math.round((d / canon.length) * a.count);
      };
      items.push({
        kind: 'status',
        text: (t, still, phone) => {
          if (phone) {
            if (t < a.pulse0) return 'Before the attack: modems online';
            if (t < a.t0) return 'Attackers reach the ground network';
            return t < a.t1 ? `Malware wipes modems · ${dark(t)}/${a.count} offline` : 'Modems offline · satellite kept working';
          }
          const tx =
            t < a.pulse0
              ? 'Before the attack: user modems online (green), KA-SAT serving Europe'
              : t < a.t0
                ? 'Attackers reach the ground management network and push malicious commands (illustrative network)'
                : t < a.t1
                  ? 'Malware overwrites modems (SWF: ~45 min): red = offline'
                  : 'Modems offline (red) · the satellite kept working';
          return t >= a.t0 ? `${tx} · ${dark(t)} of ${a.count} simulated terminals offline` : tx;
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
        bStatic: (a.staticK ?? cfg.staticK) ? (t) => scl(tgt.pos(t), a.staticK ?? cfg.staticK) : null,
        on: (t) => Math.abs(t - tgt.t) < a.window && dot(tgt.pos(t), su) > 1.02,
        color: a.color,
        opacity: 0.95,
        width: 0.022,
        maxPx: 15,
        coreColor: '#ffe3f9',
        ends: 0.05,
        labelOffDisc: a.labelOffDisc,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
        sdx: a.sdx,
        sdy: a.sdy,
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
            label: ac.beamLabel,
            short: ac.beamShort,
            labelFrac: 0.14,
            labelDx: ac.beamDx ?? 40,
            labelDy: ac.beamDy ?? -20,
            opt: true,
            colorFn: (t) => (inZone(t) ? C.jam : C.ok),
            dashFn: inZone,
          });
      });
  }
  const { cams, stillCamFor } = buildCameras({ cfg, items, H, tgt, aircraftPos, focus, anchors, crafts });
  return { cfg, items, cams, flags, stillCamFor, still: cfg.still ?? 0.5, sunRef: cams[0].pos };
}
