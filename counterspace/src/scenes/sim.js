// ============================================================================
// scenes/sim.js: simulator: interprets a scene config into time-parameterised items and cameras (renderer-independent)
// (belt / field / constellation / zone / geo / terminals / beam actors live in sim-space.js)
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
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
  len,
  lerp,
  ll,
  mulberry,
  norm,
  orbitPos,
  orbitThrough,
  rAlt,
  scl,
  toLL,
} from './core.js';
import { lerp3 } from './gl-items.js';
import { C } from './config.js';
import { buildCameras } from './cameras.js';
import { craftPos, makeAnchor } from './co-sim.js';
import { buildSpaceActor } from './sim-space.js';

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
        return phone ? `${s} · ${c.vis}/${c.n} in orbit` : `${s} · ${c.vis} of ${c.n} pieces still in orbit`;
      },
    });
  for (const a of cfg.actors) {
    if (a.type === 'craft') {
      const anc = anchors[a.anchor],
        // dock: {with, t0, t1}: while docked the craft sits exactly on its partner (the renderers then set the two models side by side in screen
        // space, touching, at any zoom). Nothing is drawn between them: SWF says docked, not how.
        raw = (t) => (a.dock && t >= a.dock.t0 && t <= a.dock.t1 ? crafts[a.dock.with].raw(t) : craftPos(anc, a.key, t, a.arcs, a.spline)),
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
        it.labelFn = (t, narrow, still) => (actOn(t, a.acts) && inVis(t) ? a.labelFn(t, narrow, still) : null);
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
    // range (opt-in): a thin line between two crafts with the separation the sources report, e.g. "within 1 km", shown in [t0, t1]
    if (a.type === 'range')
      items.push({
        kind: 'beam',
        liveOnly: true,
        soft: true,
        opacity: a.opacity ?? 0.55,
        width0: 0.0011,
        color: a.color || '#e6ecf8',
        a: (t) => (t >= a.t0 && t <= a.t1 ? crafts[a.a].pos(t) : null),
        b: (t) => (t >= a.t0 && t <= a.t1 ? crafts[a.b].pos(t) : null),
        on: (t) => t >= a.t0 && t <= a.t1,
        label: a.label,
        short: a.short,
        labelFrac: a.frac ?? 0.5,
        labelDx: a.dx ?? 0,
        labelDy: a.dy ?? 0,
        opt: true,
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
        byIndex: a.byIndex,
        tail: a.tail, // capped wake length (fraction of the whole path) and brightness
        wakeOp: a.wakeOp,
        color: a.color,
        width: 2,
        pts: (t) => {
          if (!actOn(t, a.acts) || (a.until != null && t > a.until)) return []; // a.until: opt-in end of the wake
          const s = clamp01((t - a.t0) / (a.t1 - a.t0));
          return s <= 0 ? [] : all.slice(0, Math.max(2, ts ? ts.filter((x) => x <= t).length : Math.round(s * N) + 1));
        },
      });
    }
    if (a.type === 'tag')
      items.push({
        kind: 'point',
        shape: a.leader ? 'tick' : 'none', // a leader needs a mark to end on
        liveOnly: a.liveOnly,
        stillHide: a.stillHide,
        noLeader: !a.leader, // leader: true draws the usual leader and dot to the tagged point
        small: a.leader ? true : undefined,
        color: a.color,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
        pos: (t) => (actOn(t, a.acts) && (flags.all || !a.vis || (t >= a.vis[0] && t <= a.vis[1])) ? (a.craftAt ? crafts[a.craftAt[0]].raw(a.craftAt[1]) : aPos(a, t)) : null),
      });
    if (a.type === 'path') {
      // static orbit line, shown only in its act(s)
      const N = a.N ?? 120,
        all = a.points ? a.points : a.offs ? a.offs.map((o) => aPos({ anchor: a.anchor, off: o }, 0)) : Array.from({ length: N + 1 }, (_, k) => a.fn(k / N));
      items.push({
        kind: 'curve',
        gate: true,
        inset: !a.noInset,
        all,
        pts: (t) => (actOn(t, a.acts) && (!a.vis || (t >= a.vis[0] && t <= a.vis[1])) ? all : []),
        color: a.color,
        opacity: a.opacity ?? 0.6,
        thick: a.thick,
        fade: a.fade,
        push: a.push,
        label: a.label,
        short: a.short,
        staticHide: a.staticHide,
        stillHide: a.stillHide,
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
        staticAt: a.staticAt,
        staticPin: a.staticPin,
        labelDy: a.dy,
      });
    if (a.type === 'place')
      // a place name with no marker (a sea or region named in the scene's title): a plain label at a lat/lon, no leader
      items.push({ kind: 'point', shape: 'none', pos: () => ll(a.at[0], a.at[1], 1.003), color: a.color || '#cfd8ea', label: a.label, short: a.short, labelDx: a.dx ?? 0, labelDy: a.dy ?? 0, opt: a.opt });
    if (a.type === 'ship')
      items.push({ kind: 'point', shape: 'ship', shade: a.shade, pos: () => ll(a.at[0], a.at[1], 1.004), color: '#cfd8ea', minPx: a.minPx, maxPx: a.maxPx, label: a.label, labelDx: a.dx, labelDy: a.dy });
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
        gapIds: a.gapCrafts,
        fadeDisc: a.fadeDisc, // opt-in: the line fades where it crosses the Earth's disc
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
          trailOf: a.sat.trail ? { pts, u0: phase, speed: a.sat.speed, len: a.sat.trail } : null,
          minPx: a.sat.minPx,
          maxPx: a.sat.maxPx,
          scale: a.sat.big,
          // fail: from this time the satellite is flagged as damaged (a visible end cue; SWF: such tests damaged or destroyed satellites)
          ...(a.sat.fail && {
            state: true, // its colour changes when it is damaged: the model keeps a glow that shows the change
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
      items.push({ kind: 'curve', pts: () => pts, color: a.color, opacity: 0.35, role: 'orbit', fadeDisc: a.fadeDisc, thick: a.orbitThick }); // fadeDisc: opt-in, the line fades over the Earth's disc
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
    // impactFollow (opt-in): the impact marker glides from the hit point to the debris cloud's centre, so its label stays beside the fragments
    const centroid = (t) => {
      const d = cfg.actors.find((x) => x.type === 'debris') || {},
        dt = t - tgt.t,
        k = clamp01((dt - 0.02) / 0.1),
        alt = Math.max(110, tgt.alt * (1 - (d.decay ?? 0) * 1.1 * dt)),
        c = orbitPos(alt, tgt.inc, tgt.raan, tgt.uHit + tgt.w * (d.drift ?? 1) * dt);
      return add(scl(tgt.hitPos, 1 - k), scl(c, k));
    };
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
        pos: (t) => (t > tgt.t + 0.02 && (a.impactUntil == null || t < a.impactUntil) ? (a.impactFollow ? centroid(t) : tgt.hitPos) : null),
      });
    // impactUntil: the "Impact" pill is shown only while its step is on screen; a quiet tick keeps marking the point afterwards
    if (a.type === 'target' && tgt && !a.noHit && a.label && a.impactUntil != null)
      items.push({ kind: 'point', shape: 'tick', color: '#fff1c1', pos: (t) => (t >= a.impactUntil && (a.tickUntil == null || t < a.tickUntil) ? tgt.hitPos : null) }); // tickUntil: the tick retires with the last fragment
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
          label: i === 0 ? 'Larger pieces falling' : null,
          opt: true,
          short: 'Pieces falling',
          labelDx: 60,
          labelDy: 16,
          pos,
        });
        items.push({ kind: 'flash', pos: all[N], t0: Math.min(0.98, tEnd), color: '#ffd9a0', size: 0.12, span: 0.1 });
      });
    }
    if (a.type === 'aircraft') {
      const r = 1.012 + a.alt / 6371 + (a.lift ?? 0);
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
        scale: a.gnss ? null : a.scale ?? 1.1,
        minPx: a.minPx,
        maxPx: a.maxPx,
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
      if (a.labelUntil != null) {
        // labelUntil: the aircraft's pill retires at this time (still frames keep it), so it does not crowd the missile and the collision
        item.labelFn = (t, narrow, still) => (still || t < a.labelUntil ? a.label : null);
        item.statusColor = () => item.color;
      }
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
        if (a.exit) {
          // exit { dur, k }: after the release the aircraft keeps its heading, eases down and leaves; it is gone dur later (k: path lengths flown by then)
          const ex = (t) => {
            const u = clamp01((t - a.t1) / a.exit.dur),
              s = 1 + a.exit.k * u * (2 - u),
              la = lerp(a.path[0][0], a.path[1][0], s),
              lo = lerp(a.path[0][1], a.path[1][1], s);
            return ll(la, lo, r + 0.03 * (1 - 0.7 * u));
          };
          item.pos = (t) => (t < a.t0 - 1e-6 || t > a.t1 + a.exit.dur ? null : t <= a.t1 ? aircraftPos(t) : ex(t));
        }
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
            if (a.exit && t > a.t1 + a.exit.dur) return []; // the trail leaves with the aircraft
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
      // a.retire: the spent missile arc (predicted path and trail) is removed this long after the hit (t span), so no stub is left beside the aircraft
      const spent = (t) => a.retire != null && t > tgt.t + a.retire;
      items.push({ kind: 'curve', gate: a.retire != null, avoid: true, pts: (t) => (spent(t) ? [] : all), color: a.color, opacity: 0.32, thick: 0.0028, role: 'action' });
      items.push({
        kind: 'curve',
        dynamic: true,
        avoid: true,
        all,
        thick: a.thick ?? 0.0042,
        taper: a.taper,
        color: a.color,
        width: 2,
        label: a.label,
        labelAt: bez(a.labelS ?? 0.5),
        labelEnd: tgt.t + (a.hold ?? 0.03), // a.hold: the label outlives the hit (the still is taken just after it)
        pts: (t) => {
          if (spent(t)) return [];
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
      if (a.rocket)
        // a drawn interceptor with its exhaust flame rides the head of the arc
        items.push({
          kind: 'point',
          shape: 'rocket',
          color: a.color,
          scale: 1,
          minPx: a.rocket.minPx ?? 26,
          maxPx: a.rocket.maxPx ?? 48,
          // stands at the launch point from the start, then rides the arc
          pos: (t) => (t < tgt.t - 0.004 ? bez(sAt(t)) : null),
          orient: (t) => {
            const sv = sAt(t);
            return { up: norm(bez(sv)), dir: norm(add(bez(Math.min(1, sv + 0.02)), scl(bez(sv), -1))) };
          },
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
        coreK: a.coreK,
        size: (a.flash ?? 0.3) * (IS_PHONE ? 0.42 : 1),
        span: a.flashSpan ?? (a.strong ? 0.2 : 0.16), // flashSpan: opt-in shorter shock rings
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
          u: 0.35 + rnd() * 0.65, // decayWin: where in the window this fragment burns up
          cj: (rnd() - 0.5) * 0.5,
          br: 0.7 + rnd() * 0.3,
        });
      // Fragments start hot (pale orange) and cool to dim red with age; each has its own tint and brightness. Soft sprites, normal blending: no white clipping.
      let HOT = [1, 0.8, 0.5],
        MID = [1, 0.5, 0.2],
        COOL = a.lateGlow ? [0.95, 0.45, 0.25] : [0.62, 0.17, 0.12]; // lateGlow: old fragments stay clearly visible
      if (a.palette) {
        // opt-in palette { hot, mid, cool } (rgb 0..1): e.g. yellow-white fragments that separate from the amber city lights
        HOT = a.palette.hot ?? HOT;
        MID = a.palette.mid ?? MID;
        COOL = a.palette.cool ?? COOL;
      }
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
      if (a.ring) {
        const byV = P.map((_, k) => k).sort((x, y) => P[x].dw - P[y].dw);
        byV.forEach((k, r) => (P[k].ph = Math.PI * (2 * ((r + 0.5) / n) - 1) + (rnd() - 0.5) * 0.02));
      }
      const cloud = {
        kind: 'cloud',
        labelIdx: kc,
        labelEdge: a.labelEdge,
        labelTopStatic: a.labelTopStatic,
        labelCands: ranked
          .slice(0, 8)
          .map((r) => r[1])
          .concat(P.map((_, k) => k).filter((k) => k % Math.ceil(n / 24) === 0)), // stand-ins for the label particle when it is behind the Earth (gl-labels)
        n,
        color: a.color,
        dynCol: true,
        alpha: 0.7,
        size: a.size ?? (n > 2000 ? 0.019 : n > 400 ? 0.02 : 0.034),
        minPx: a.minPx, // opt-ins: dot size limits, additive sprites (a.additive), short trails (a.trail: { n, dt })
        maxPx: a.maxPx,
        additive: a.additive,
        trail: a.trail,
        hideEmpty: a.hideEmpty,
        label: a.label,
        labelDx: a.dx,
        labelDy: a.dy,
        vis: 0,
        fill(t, out, colr) {
          const dt = t - tgt.t;
          // a.ring { t1, ease }: opt-in closed ring: each fragment's along-track offset grows from 0 at the hit to its own share of the full circle at t1
          // (ordered by speed, so the ring is evenly filled), then the band keeps widening; the early cloud is a short, fat shell, not a thin wall
          const rs = a.ring ? 1 - (1 - clamp01(dt / (a.ring.t1 - tgt.t))) ** (a.ring.ease ?? 2) : 0;
          let vis = 0;
          const dens = Math.min(1, Math.sqrt(300 / n));
          for (let k = 0; k < n; k++) {
            const p = P[k];
            let x = 0,
              y = 0,
              z = 0;
            if (dt > 0) {
              const fat = a.ring?.fat ? 1 + a.ring.fat * (1 - rs) : 1; // ring.fat: the early cloud is thicker (a shell around the hit), thinning as the ring closes
              let alt = tgt.alt + p.da * fat * Math.min(1, dt * 12) - p.dec * dt * tgt.alt;
              if (a.decayWin) {
                // decayWin [t0, t1]: the fast-forward decay: every fragment sinks and burns up inside this window (all gone at t1), so the picture matches the text
                const sw = clamp01((t - a.decayWin[0]) / (a.decayWin[1] - a.decayWin[0]));
                const base = tgt.alt + p.da * Math.min(1, dt * 12);
                alt = sw >= p.u ? 0 : base * (1 - 0.45 * (sw / p.u) ** 2);
              }
              if (alt > 60) {
                // optional late phase: the band keeps spreading along and across the orbit (time compressed)
                const lt = a.late ? Math.max(0, t - a.late.t0) : 0,
                  q = orbitPos(
                    alt,
                    tgt.inc + p.di * (a.ring?.fat ? 1 + a.ring.fat * (1 - rs) : 1),
                    tgt.raan + p.dr * (1 + (a.late?.kr ?? 0) * lt),
                    tgt.uHit +
                      p.du +
                      (a.ring
                        ? tgt.w * (a.drift ?? 1) * dt + p.ph * rs
                        : tgt.w * (a.drift ?? 1) * (dt * p.dw + (a.late ? a.late.k * lt * (p.dw - 1) : 0))),
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
              // velocity-sorted: fragments near the parent's speed stay bright and large, the fast and slow tails are dimmer and smaller
              const core = 1 - Math.min(1, Math.abs(p.dw - 1) / (a.dv * 1.6 || 1));
              colr[k4 + 3] = (0.7 + 0.3 * dens) * 0.9 * fade * (0.4 + 0.6 * core * core) * (dt > 0 && dt < 0.02 ? dt / 0.02 : 1);
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
          text: (t) => (t < tgt.t ? 'Approaching intercept' : `${cloud.vis} of ${n} fragments still in orbit (decay sped up)`),
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
        if (a.rocket) {
          // a drawn rocket with its exhaust flame rides the head of the path (the glow behind it is kept smaller)
          const sm = (t) => {
            const s = clamp01((t - a.t0) / (a.t1 - a.t0)) * N,
              i = Math.min(N - 1, Math.floor(s)),
              f = s - i;
            return s > 0 && s < N ? add(scl(all[i], 1 - f), scl(all[i + 1], f)) : null;
          };
          items.push({ kind: 'point', shape: 'kv', color: a.color, kvSize: 0.16, kvMin: a.rocket.glowMin ?? 16, kvMax: a.rocket.glowMax ?? 38, pos: headPos });
          items.push({ kind: 'point', shape: 'rocket', color: '#ff8a8a', scale: 1, minPx: a.rocket.minPx ?? 30, maxPx: a.rocket.maxPx ?? 54, pos: sm });
        } else
        items.push({ kind: 'point', shape: 'kv', color: a.color, kvSize: 0.3, kvMin: 28, kvMax: 64, pos: headPos });
        if (!a.rocket) items.push({ kind: 'point', shape: 'kv', color: a.headColor ?? '#fff1e6', kvSize: 0.14, kvMin: 14, kvMax: 30, pos: headPos });
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
        strong: a.strong, // opt-ins: the second white ring and a bolder core
        coreK: a.coreK,
        label: a.label,
        short: a.short,
        labelDx: a.dx,
        labelDy: a.dy,
      });
    buildSpaceActor(a, { cfg, items, rnd, tgt, setFocus: (f) => (focus = focus || f) });
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
        ac.state = true; // the airliner's colour is the story (GNSS lost or fine): its model keeps a glow in that colour
        ac.statusColor = (t) => (inZone(t) ? C.jam : C.ok);
        ac.labelFn = (t) => (inZone(t) ? ac.label + ' · GPS signal lost' : ac.label + ' · GPS signal fine');
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
            labelFrac: ac.beamFrac ?? 0.14,
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
