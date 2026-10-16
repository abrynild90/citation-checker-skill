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
  smooth,
  toLL,
} from './core.js';
import { lerp3 } from './gl-items.js';
import { C } from './config.js';
import { buildCameras } from './cameras.js';
import { craftPos, makeAnchor } from './co-sim.js';
import { buildSpaceActor } from './sim-space.js';

// rocket.sizeSteps [[t, k], ...] (opt-in): the drawn vehicle is k times its normal size, blended linearly between the steps (1 before the first, the last k after it)
const stepsK = (st) =>
  st &&
  ((t) => {
    if (t <= st[0][0]) return st[0][1];
    for (let i = 1; i < st.length; i++) if (t <= st[i][0]) return st[i - 1][1] + ((st[i][1] - st[i - 1][1]) * (t - st[i - 1][0])) / (st[i][0] - st[i - 1][0]);
    return st[st.length - 1][1];
  });

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
  const shellDefs = {
    LEO: [2000, '#78a8ff', 'LEO ≤2,000 km'],
    MEO: [20200, '#a88cff', 'MEO (GPS)'],
    GEO: [GEO_ALT, '#ffcf6e', 'GEO'],
  };
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
    tgt = {
      ...H,
      raan: o.raan,
      uHit: o.u,
      w: wBase * (H.wf ?? 1),
      wa: wBase * (H.wa ?? 0.4),
    };
    tgt.pos = (t) => orbitPos(H.alt, H.inc, tgt.raan, tgt.uHit + (t < H.t ? tgt.wa : tgt.w) * (t - H.t));
    tgt.hitPos = tgt.pos(H.t);
    focus = focus || [H.lat, H.lon];
  }
  let aircraftPos = null,
    aircraftItem = null;
  if (cfg.status)
    items.push({
      kind: 'status',
      // Status entries are [t0, text, phoneText?, caption?]: a phone-width stage (one line at 375 px) uses the short text when there is one; the
      // optional caption is a short line for the picture at any width, and cfg.captionShort uses the phone text at any width (the full text stays in the
      // step list).
      text: (t, still, phone) => {
        let e = cfg.status[0];
        for (const x of cfg.status) if (t >= x[0]) e = x;
        const s = phone && e[2] ? e[2] : e[3] || (cfg.captionShort && e[2]) || e[1],
          c = items._decayCloud;
        if (still || !c || cfg.noSimCount || !tgt || t < tgt.t + (cfg.countFrom ?? 0.02)) return s; // countFrom (opt-in): the "N in orbit" count waits until the debris is visible
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
        taper: a.taper, // opt-in: the wake starts thin and widens toward the craft (a soft wake)
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
        pos: (t) =>
          actOn(t, a.acts) && (flags.all || !a.vis || (t >= a.vis[0] && t <= a.vis[1]))
            ? a.craftAt
              ? crafts[a.craftAt[0]].raw(a.craftAt[1])
              : a.world || aPos(a, t)
            : null,
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
        dash: a.dash,
        push: a.push,
        label: a.label,
        short: a.short,
        staticHide: a.staticHide,
        stillHide: a.stillHide,
        staticKeep: a.staticKeep,
        // labelNear (opt-in): the name sits on the sample of the line that is labelStep samples from the named craft, so it stays in a following frame
        labelAt: a.labelNear
          ? (t) => {
              const c = crafts[a.labelNear]?.raw(t);
              if (!c) return all[Math.min(all.length - 1, a.labelIdx ?? 0)];
              let k = 0,
                best = 1e9;
              all.forEach((p, i) => {
                const d = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
                if (d < best) ((best = d), (k = i));
              });
              return all[(((k + (a.labelStep ?? 0)) % all.length) + all.length) % all.length];
            }
          : all[Math.min(all.length - 1, a.labelIdx ?? 0)],
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
        // labelHide (opt-in [t0, t1]): the live pill is left out in that window (the print still names the site), e.g. while a debris cloud peaks around it
        ...(a.labelHide
          ? { labelFn: (t, narrow, still) => (!still && t >= a.labelHide[0] && t < a.labelHide[1] ? null : narrow && a.short ? a.short : a.label), statusColor: () => a.color }
          : {}),
      });
    if (a.type === 'place')
      // a place name with no marker (a sea or region named in the scene's title): a plain label at a lat/lon, no leader
      items.push({
        kind: 'point',
        shape: 'none',
        pos: () => ll(a.at[0], a.at[1], 1.003),
        color: a.color || '#cfd8ea',
        label: a.label,
        short: a.short,
        labelDx: a.dx ?? 0,
        labelDy: a.dy ?? 0,
        opt: a.opt,
      });
    if (a.type === 'ship')
      items.push({
        kind: 'point',
        shape: 'ship',
        shade: a.shade,
        heading: a.heading, // opt-in (radians about the local up): the hull's heading; default 0.6
        pos: (t) => (a.hideFrom != null && t >= a.hideFrom ? null : ll(a.at[0], a.at[1], 1.004)),
        color: '#cfd8ea',
        minPx: a.minPx,
        maxPx: a.maxPx,
        camK: a.camK, // opt-in { camera index: k }: drawn k times larger on that preset only
        label: a.label,
        labelDx: a.dx,
        labelDy: a.dy,
        ...(a.labelUntil != null
          ? {
              labelFn: (t, narrow, still) => (still || t < a.labelUntil ? a.label : null),
              statusColor: () => '#cfd8ea',
            }
          : {}),
      }); // labelUntil (opt-in): the ship's pill retires after the intercept
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
        arcNear: a.arcNear && {
          pos: anchors[a.arcNear.anchor].pos(0),
          r: a.arcNear.r,
          cams: a.arcNear.cams,
        }, // opt-in: only the arc within r of the anchor is drawn (on these cameras)
        fadeDisc: a.fadeDisc, // opt-in: the line fades where it crosses the Earth's disc
        fadeInT: a.fadeInT, // opt-in [t0, t1]: the 3D line fades in over that time span (an edge-on ring at the opening reads as scratches across the globe)
        fadeT: a.fadeT, // opt-in [t0, t1] (+ fadeCams: camera indices): the 3D line fades out over that time span (the inset keeps it)
        fadeCams: a.fadeCams,
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
          pos: (t) => (t < (a.sat.from ?? -1) ? null : orbitPos(a.alt, a.inc, raan, phase + t * 2 * Math.PI * a.sat.speed)), // sat.from (opt-in): the craft is not drawn before this time (it would sit on the frame edge)
          staticPos: a.sat.staticPh != null ? (t) => orbitPos(a.alt, a.inc, raan, phase + a.sat.staticPh + t * 2 * Math.PI * a.sat.speed) : null,
        });
      if (a.sats)
        for (let s = 0; s < a.sats; s++) {
          const ph = (s / a.sats) * 2 * Math.PI;
          items.push({
            kind: 'point',
            shape: 'sat',
            small: true,
            color: a.color,
            pos: () => orbitPos(a.alt, a.inc, a.raan, ph),
          });
        }
    }
    if (a.type === 'target' && tgt) {
      const pts = [];
      for (let k = 0; k <= 180; k++) pts.push(orbitPos(tgt.alt, tgt.inc, tgt.raan, (k / 180) * 2 * Math.PI));
      items.push({
        kind: 'curve',
        pts: () => pts,
        color: a.color,
        opacity: 0.35,
        role: 'orbit',
        fadeDisc: a.fadeDisc,
        thick: a.orbitThick,
      }); // fadeDisc: opt-in, the line fades over the Earth's disc
      items.push({
        kind: 'point',
        shape: 'sat',
        prim: true,
        variant: a.variant,
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
      items.push({
        kind: 'point',
        shape: 'tick',
        color: '#fff1c1',
        pos: (t) => (t >= a.impactUntil && (a.tickUntil == null || t < a.tickUntil) ? tgt.hitPos : null),
      }); // tickUntil: the tick retires with the last fragment
    // endLabel (opt-in): from endFrom on, the impact point carries a pill with the final count, so the last frame (the cloud has all decayed) still says what happened
    if (a.type === 'target' && tgt && !a.noHit && a.endLabel)
      items.push({
        kind: 'point',
        shape: 'tick',
        color: '#fff1c1',
        label: a.endLabel,
        short: a.endShort ?? a.endLabel,
        labelDx: a.endDx ?? 70,
        labelDy: a.endDy ?? -50,
        opt: true,
        pos: (t) => (t >= a.endFrom ? tgt.hitPos : null),
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
          if (dt < 0 || (a.fallUntil != null && t >= a.fallUntil)) return null;
          const alt = tgt.alt * (1 - f.k * dt) - 6 * dt;
          return alt > 70 ? orbitPos(alt, tgt.inc + f.di, tgt.raan + f.dr, tgt.uHit + tgt.w * dt * f.dw) : null;
        };
        const tEnd = Math.min(tgt.t + (1 - 75 / tgt.alt) / f.k, a.fallUntil ?? 1),
          N = 36,
          all = [];
        for (let k = 0; k <= N; k++) all.push(pos(tgt.t + ((tEnd - tgt.t) * k) / N) || pos(tgt.t + ((tEnd - tgt.t) * (k - 1)) / N));
        items.push({
          kind: 'curve',
          dynamic: true,
          avoid: true,
          all,
          thick: 0.0025,
          color: '#ff9a55',
          width: 2,
          pts: (t) => {
            if (a.fallUntil != null && t >= a.fallUntil) return [];
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
        items.push({
          kind: 'flash',
          pos: all[N],
          t0: Math.min(0.98, tEnd),
          color: '#ffd9a0',
          size: 0.12,
          span: 0.1,
          until: a.fallUntil,
        });
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
        fighter: a.fighter, // opt-in: the twin-engine fighter model (gl-models.js) in place of the airliner
        prim: true,
        scale: a.gnss ? null : (a.scale ?? 1.1),
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
        beamMaxPx: a.beamMaxPx,
        pos: (t) => pos(Math.min(t, a.t1)),
        // opt-in climb { deg }: the nose is raised for the zoom climb (a pull-up over the first third of the flight, held, then easing down as the aircraft leaves)
        pitch: a.climb
          ? (t) => {
              const s = clamp01((t - a.t0) / (a.t1 - a.t0)),
                u = a.exit ? clamp01((t - a.t1) / a.exit.dur) : 0;
              return ((a.climb * Math.PI) / 180) * (0.3 + 0.7 * smooth(s / 0.35)) * (1 - 0.75 * u);
            }
          : null,
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
          return ll(la, lo, r + (a.rise ?? 0.03) * s);
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
            return ll(la, lo, r + (a.rise ?? 0.03) * (1 - 0.7 * u));
          };
          item.pos = (t) => (t < a.t0 - 1e-6 || t > a.t1 + a.exit.dur ? null : t <= a.t1 ? aircraftPos(t) : ex(t));
          if (a.exit.shrink != null) item.sizeK = (t) => 1 - (1 - a.exit.shrink) * smooth(clamp01((t - a.t1) / a.exit.dur)); // exit.shrink (opt-in): it recedes to this fraction of its size by the time it leaves, so it never pops out at full size
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
      aircraftItem = item;
      items.push(item);
    }
    if (a.type === 'intercept' && tgt) {
      const from = a.from === 'aircraft' ? aircraftPos(a.t0) : ll(a.from[0], a.from[1], 1.005);
      const to = tgt.hitPos;
      const mid = norm(add(from, to));
      // arcRise (opt-in): the control point sits above the launch point, this fraction of the way toward the target: a climb that flattens out onto the target's
      // altitude (a vertical launch), with no overshoot and hook at the end of the path
      const ctrl =
        a.arcRise != null
          ? scl(norm(add(from, scl(add(to, scl(from, -1)), a.arcRise))), len(to) + (a.arcLift ?? 0))
          : scl(mid, Math.max(len(from), len(to)) + (a.arcLift ?? 0.2)); // arcLift (opt-in): how far the path bows outward past the higher end (a near-direct run for an air launch)
      const bez = (s) => add(add(scl(from, (1 - s) * (1 - s)), scl(ctrl, 2 * (1 - s) * s)), scl(to, s * s));
      const N = 60,
        all = [];
      for (let k = 0; k <= N; k++) all.push(bez(k / N));
      items._arc = { from, to, mid: bez(0.5), bez, t0: a.t0 };
      // Faint predicted path (whole arc, always visible) under the bright growing trail.
      // a.retire: the spent missile arc (predicted path and trail) is removed this long after the hit (t span), so no stub is left beside the aircraft
      const spent = (t) => a.retire != null && t > tgt.t + a.retire;
      items.push({
        kind: 'curve',
        gate: a.retire != null,
        avoid: true,
        pts: (t) => (spent(t) ? [] : all),
        color: a.color,
        opacity: 0.32,
        thick: 0.0028,
        role: 'action',
      });
      items.push({
        kind: 'curve',
        dynamic: true,
        avoid: true,
        all,
        thick: a.thick ?? 0.0042,
        taper: a.taper,
        wakeOp: a.wakeOp ?? (a.rocket ? 0.3 : undefined), // a drawn rocket has its own exhaust and smoke: the path behind it is a faint guide
        color: a.color,
        width: 2,
        label: a.label,
        labelAt: a.labelFollow ? (t) => bez(Math.min(1, Math.max(0.04, (t - a.t0) / (tgt.t - a.t0)))) : bez(a.labelS ?? 0.5), // labelFollow (opt-in): the leader ends on the missile's head, which is drawn, not on a fixed point of its path
        rocketT0: a.labelFollow && a.rocket ? a.t0 : null, // the label follows the drawn vehicle (gl-items)
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
      const kvMark = {
        kind: 'point',
        shape: 'kv',
        color: a.color,
        dim: a.rocket ? 0.3 : undefined, // a drawn vehicle has its own exhaust: the coloured glow is only a faint marker behind it
        pos: (t) => (t >= a.t0 - 1e-6 && t < tgt.t ? bez(sAt(t)) : null),
      };
      items.push(kvMark);
      if (a.rocket)
        // a drawn interceptor with its exhaust flame rides the head of the arc
        items.push({
          kind: 'point',
          shape: 'rocket',
          color: a.color,
          scale: 1,
          minPx: a.rocket.minPx ?? 26,
          maxPx: a.rocket.maxPx ?? 48,
          rocketStyle: a.rocket.style,
          endHold: a.rocket.endHold, // opt-in: stays drawn on the target this long past the hit, inside the flash (no early vanish)
          preK: a.rocket.preK, // opt-in: drawn this fraction of its size while it waits at the launch point, easing to full size just after t0
          // opt-in waitLabel (live only; the pill of the path takes over at t0): the waiting vehicle is named from the first frame
          ...(a.rocket.waitLabel
            ? { label: a.label, short: a.short, labelDx: a.rocket.waitDx ?? 0, labelDy: a.rocket.waitDy ?? 0, labelFn: (t, narrow) => (t < a.t0 && !narrow ? a.label : null), statusColor: () => a.color }
            : {}),
          ramp: a.rocket.ramp, // opt-in { k, until }: drawn k times larger at the pad, easing to its normal size by this fraction of the flight (see _fitModels)
          sizeK: stepsK(a.rocket.sizeSteps),
          // flight look (gl-rocket.js): ignition at t0, the vehicle is consumed at the hit; burn is the fraction of the flight under thrust (the rest is coast)
          fx: {
            t0: a.t0,
            t1: tgt.t,
            burn: a.rocket.burn ?? 0.55,
            alt0: a.from === 'aircraft' ? (cfg.actors.find((x) => x.type === 'aircraft')?.alt ?? 12) : 0,
            air: a.from === 'aircraft' && aircraftItem ? { it: aircraftItem, drop: a.rocket.drop, carry: a.rocket.carry } : null,
            cold: a.rocket.launch === 'vls',
            stand: !!a.rocket.pad,
            vent: !!a.rocket.vent, // opt-in: vapour vents off the vehicle and pools at the pad while it waits
            waitRing: !!a.rocket.waitRing, // opt-in: a thin highlight ring round the vehicle while it waits for launch
            smokeK: a.rocket.smokeK,
            smokeNear: a.rocket.smokeNear, smokeTA: a.rocket.smokeTA,
            stage: a.rocket.stage,
            kv: a.rocket.kv, // opt-in { at }: a small kill vehicle rides the nose (style 'asat') and flies on alone after this time (gl-rocket _kvFrame)
            plumeK: a.rocket.plumeK, // opt-in: a longer, wider exhaust
            plumeDeck: a.rocket.plumeDeck, // opt-in: the exhaust is cut at the deck of the warship it climbs from (gl-rocket.js)
            endFade: a.rocket.endFade, // opt-in: after the hit the spent vehicle drifts on (rocket.endDrift) and fades out over this span
            seed: a.t0 * 10,
            marker: kvMark, // the plain glow marker of the same path: hidden while the vehicle is drawn (gl-rocket.js)
          },
          // stands at the launch point from the start, then rides the arc
          // a vertical-launch missile stands in its cell (drawn small, no plume: preK) until the gas pop at t0, then rises out of it over the pop (no jump)
          pos: (t) =>
            t < tgt.t - 0.004 + (a.rocket.endHold ?? 0)
              ? t > tgt.t && a.rocket.endDrift
                ? add(bez(1), scl(norm(add(bez(1), scl(bez(0.97), -1))), a.rocket.endDrift * (t - tgt.t))) // endDrift (opt-in): past the hit the vehicle coasts on along its last heading
                : bez(a.rocket.launch === 'vls' ? Math.max(0.012 + (s0 - 0.012) * smooth(clamp01((t - a.t0) / 0.012)), clamp01((t - a.t0) / (tgt.t - a.t0))) : sAt(t))
              : null,
          orient: (t) => {
            const sv = sAt(t);
            return {
              up: norm(bez(sv)),
              dir: norm(add(bez(Math.min(1, sv + 0.02)), scl(bez(sv), -1))),
            };
          },
        });
      // opt-in launch site (rocket.pad): a small launch-complex marker (base plate, flame deflector, tower, rail) stands under the vehicle until a moment after liftoff
      if (a.rocket?.pad) {
        const at = scl(norm(from), 1.002),
          until = a.t0 + (a.rocket.pad.hold ?? 0.07);
        items.push({ kind: 'point', shape: 'pad', color: a.color, at, t0: a.t0, until, pos: (t) => (t < until ? at : null), minPx: a.rocket.pad.minPx ?? 40, maxPx: a.rocket.pad.maxPx ?? 60, bright: !!a.rocket.pad.bright, island: !!a.rocket.pad.island });
      }
      if (!a.rocket)
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
        capK: a.flashCap, // opt-ins: larger screen cap, faint lingering ring after the burst
        linger: a.linger,
        lingerEnd: a.lingerEnd,
        lingerK: a.lingerK,
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
      if (a.growJit) {
        const jr = mulberry(cfg.id.length * 15485863 + n); // its own generator: the shared sequence is untouched
        for (const p of P) p.gj = gauss(jr);
      }
      // lobes (opt-in { core, gap, cone, wide, couple }): velocity-dispersed lobes instead of one bell of speeds. Each fragment carries a kick that sends it ahead of or behind the
      // parent along the track (a forward kick raises its orbit and a backward one lowers it, `couple`); `core` of them keep the parent's speed, the rest start at least `gap` of the
      // full speed spread away from it, and the across-track and height spreads grow with the along-track distance (`cone` at the hit, 1 at the lobe's end, all times `wide`),
      // so the cloud is two fans along the orbit with a pinched middle, the shape of a real anti-satellite debris cloud, not a curtain. Its own generator: the shared sequence is untouched.
      if (a.lobes) {
        const lb = a.lobes,
          lr = mulberry(cfg.id.length * 7919 + n);
        for (const p of P) {
          const s = lr() < 0.5 ? -1 : 1,
            m = lr() < lb.core ? 0.12 * Math.abs(gauss(lr)) : Math.min(1.25, lb.gap + (1 - lb.gap) * Math.abs(gauss(lr)) * 0.75);
          p.dw = 1 + s * m * a.dv;
          const k = (lb.cone + (1 - lb.cone) * Math.min(1, m)) * (lb.wide ?? 1);
          p.di *= k;
          p.dr *= k;
          p.da = p.da * (1 - lb.couple) + s * m * a.spreadAlt * lb.couple * (0.6 + 0.8 * lr());
        }
      }
      // Hard debris looks like real fragments, not beads: log-normal sizes (many small, a few large), varied tint and brightness, a few glints,
      // slow tumbling brightness and a small 3-D scatter that grows after the break-up (its own generator: the shared sequence is untouched).
      const sizes = a.hard ? new Float32Array(n) : null;
      if (a.hard) {
        const fr = mulberry(cfg.id.length * 104729 + n);
        for (let k = 0; k < n; k++) {
          const p = P[k],
            glint = fr() < 0.035;
          p.sz = Math.max(0.3, Math.min(2.6, Math.exp(gauss(fr) * 0.5) * 0.68)) * (glint ? 1.5 : 1);
          p.gl = glint;
          p.tv = Math.max(-0.6, Math.min(1, gauss(fr) * 0.45 + 0.2)); // tint: -0.6 warm white .. 1 deep orange
          p.tw = fr() < 0.4 ? 0.2 + fr() * 0.5 : 0; // tumbling fragments flicker; the rest are steady
          p.tf = 40 + fr() * 110;
          p.tp = fr() * 6.2832;
          p.jx = gauss(fr);
          p.jy = gauss(fr);
          p.jz = gauss(fr);
          sizes[k] = p.sz;
        }
      }
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
        labelCentre: a.labelCentre,
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
        darkHalo: a.darkHalo,
        glow: a.glow,
        hard: a.hard,
        sizes,
        trail: a.trail,
        hideEmpty: a.hideEmpty,
        label: a.label,
        labelDx: a.dx,
        labelDy: a.dy,
        vis: 0,
        fill(t, out, colr) {
          const dt = t - tgt.t,
            da = t - Math.max(tgt.t, a.appear ?? 0); // a.appear (opt-in): the fragments are not drawn before this time (the step that names them)
          // Retire a historical cloud before a later source count is shown; do not invent surviving positions.
          const cloudFade = a.fadeOut ? 1 - smooth((t - a.fadeOut[0]) / (a.fadeOut[1] - a.fadeOut[0])) : 1;
          // a.ring { t1, ease }: opt-in closed ring: each fragment's along-track offset grows from 0 at the hit to its own share of the full circle at t1
          // (ordered by speed, so the ring is evenly filled), then the band keeps widening; the early cloud is a short, fat shell, not a thin wall
          const rs = a.ring ? 1 - (1 - clamp01(dt / (a.ring.t1 - tgt.t))) ** (a.ring.ease ?? 2) : 0;
          // a.growIn (opt-in, scene time): the swath grows out of the break-up point over this span from its first frame (spread across, along and in height), not large at once
          const gk = a.growIn ? smooth(clamp01(da / a.growIn)) : 1;
          // a.growMin / a.growJit (opt-in, with growIn): the ACROSS-track and height spread starts at this share of its full width (the along-track length still grows from 0), and each
          // fragment's share varies by +-growJit, so the first frames show a broad ragged swath, not a thin straight bar of beads
          const gx = a.growMin ? a.growMin + (1 - a.growMin) * gk : gk;
          let vis = 0;
          const dens = Math.min(1, Math.sqrt(300 / n));
          for (let k = 0; k < n; k++) {
            const p = P[k];
            let x = 0,
              y = 0,
              z = 0;
            if (dt > 0 && cloudFade > 0 && !(a.appear != null && t < a.appear)) {
              const fat = a.ring?.fat ? 1 + a.ring.fat * (1 - rs) : 1; // ring.fat: the early cloud is thicker (a shell around the hit), thinning as the ring closes
              const gj = a.growJit ? Math.max(0.15, 1 + a.growJit * p.gj * (1 - gk)) : 1, // ragged early edge: fades to the plain spread as the swath grows
                gp = gx * gj;
              let alt = tgt.alt + p.da * fat * gp * Math.min(1, dt * 12) - p.dec * dt * tgt.alt;
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
                    tgt.inc + p.di * gp * (a.ring?.fat ? 1 + a.ring.fat * (1 - rs) : 1),
                    tgt.raan + p.dr * gp * (1 + (a.late?.kr ?? 0) * lt),
                    tgt.uHit +
                      p.du +
                      (a.ring ? tgt.w * (a.drift ?? 1) * dt + p.ph * rs * gk : tgt.w * (a.drift ?? 1) * (dt * p.dw + (a.late ? a.late.k * lt * (p.dw - 1) : 0))),
                  );
                x = q[0];
                y = q[1];
                z = q[2];
                if (a.hard) {
                  const js = (a.scatter ?? 0.012) * Math.min(1, dt * 8); // a small 3-D scatter: the cloud has depth, not a line of beads
                  x += p.jx * js;
                  y += p.jy * js;
                  z += p.jz * js;
                }
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
              const hv = a.hard ? p.br * (p.gl ? 1.5 : 0.82) : p.br,
                tg = a.hard ? 1 - 0.16 * p.tv : 1,
                tb = a.hard ? 1 - 0.4 * p.tv : 1;
              colr[k4] = c[0] * hv;
              colr[k4 + 1] = c[1] * hv * tg;
              colr[k4 + 2] = c[2] * hv * tb;
              // velocity-sorted: fragments near the parent's speed stay bright and large, the fast and slow tails are dimmer and smaller
              const core = 1 - Math.min(1, Math.abs(p.dw - 1) / (a.dv * 1.6 || 1));
              colr[k4 + 3] = Math.min(
                1,
                (0.7 + 0.3 * dens) *
                  0.9 *
                  fade *
                  cloudFade *
                  (0.4 + 0.6 * core * core) *
                  (da > 0 && da < 0.02 ? da / 0.02 : 1) *
                  (a.lateBoost && a.late ? 1 + a.lateBoost * clamp01((t - a.late.t0) / 0.3) : 1) *
                  (a.hard && p.tw ? 1 - p.tw * (0.5 + 0.5 * Math.sin(t * p.tf + p.tp)) : 1),
              ); // lateBoost (opt-in): the old fragments get brighter, so a thin late ring stays visible
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
        // ascent (opt-in, an exponent): the path only climbs, ending at the top point (a vehicle that rises to the burst point), not up and back down
        all.push(scl(d, rAlt(a.ascent ? a.apex * Math.pow(s, a.ascent) : a.apex * Math.sin(Math.PI * s))));
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
        wakeOp: a.wakeOp ?? (a.rocket ? 0.3 : undefined),
        color: a.color,
        width: 2,
        label: a.label,
        labelDx: a.dx,
        labelDy: a.dy,
        staticAt: a.staticAt,
        labelAt: all[Math.round(N * (a.labelIdx ?? 0.5))],
        labelEnd: a.labelEnd,
        labelStart: a.labelStart, // opt-in: the label waits until this t (the rocket is in view by then)
        pts: (t) => {
          const s = clamp01((t - a.t0) / (a.t1 - a.t0));
          return s <= 0 ? [] : all.slice(0, Math.max(2, Math.round(s * N) + 1));
        },
      });
      items.push({
        kind: 'curve',
        pts: () => all,
        color: a.color,
        opacity: a.ghostOpacity ?? 0.22,
        role: 'action',
      }); // ghostOpacity (opt-in): a brighter whole path
      if (a.marks) {
        // altitude ruler along the apogee direction: ticks at stated/analysed altitudes + GEO
        const d = norm(all[N >> 1]),
          tApex = a.t0 + (a.t1 - a.t0) * (a.apexT ?? 0.5);
        items.push({
          kind: 'curve',
          pts: () => [scl(d, a.rulerFrom != null ? rAlt(a.rulerFrom) : 1), scl(d, rAlt(GEO_ALT) * 1.02)],
          color: '#dfe6f7',
          opacity: 0.5,
          fadeIn: a.rulerFadeIn,
        }); // rulerFadeIn (opt-in [t0, t1]): the ruler fades in once the view has pulled back; rulerFrom (opt-in): the ruler starts at this altitude (km), not on the surface
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
            // labelHide (opt-in [t0, t1]): the live pill is left out in that window (the tick stays, the print still names it): one pill fewer where several crowd one spot
            ...(m.labelHide
              ? { labelFn: (t, narrow, still) => (!still && t >= m.labelHide[0] && t < m.labelHide[1] ? null : still ? m.label : m.short ?? m.label), statusColor: () => m.color }
              : {}),
            pos: (t) => ((m.apex && t < tApex) || (m.from != null && t < m.from) || (IS_PHONE && m.phoneFrom && t < m.phoneFrom) ? null : scl(d, rAlt(m.alt))), // phoneFrom (opt-in): on a phone the marker waits until this t
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
            if (s >= N && a.rocket.endHold && t < a.t1 + a.rocket.endHold) return all[N]; // endHold (opt-in): the vehicle stays at the end point a moment (inside the flash there)
            return s >= 0 && s < N ? add(scl(all[i], 1 - f), scl(all[i + 1], f)) : null; // before ignition the vehicle stands at the launch point (s = 0)
          };
          const kvMark = {
            kind: 'point',
            shape: 'kv',
            color: a.color,
            kvSize: 0.16,
            kvMin: a.rocket.glowMin ?? 16,
            kvMax: a.rocket.glowMax ?? 38,
            dim: 0.3, // the drawn vehicle has its own exhaust: the coloured glow is only a faint marker behind it
            pos: headPos,
          };
          items.push(kvMark);
          items.push({
            kind: 'point',
            shape: 'rocket',
            rocketStyle: a.rocket.style,
            ramp: a.rocket.ramp,
            sizeK: stepsK(a.rocket.sizeSteps),
            color: '#ff8a8a',
            scale: 1,
            minPx: a.rocket.minPx ?? 30,
            maxPx: a.rocket.maxPx ?? 54,
            pos: sm,
            // flight look (gl-rocket.js): ignition at launch (t0), landing at t1; burn is the fraction of the flight under thrust
            fx: { t0: a.t0, t1: a.t1, burn: a.rocket.burn ?? 0.35, alt0: 0, stand: !!a.rocket.pad, follow: !!a.rocket.follow, smokeK: a.rocket.smokeK,
            smokeNear: a.rocket.smokeNear, smokeTA: a.rocket.smokeTA, smokeLocal: a.rocket.smokeLocal, smokeTopK: a.rocket.smokeTopK, smokeWind: a.rocket.smokeWind, stage: a.rocket.stage, plumeK: a.rocket.plumeK, plumeDeck: a.rocket.plumeDeck, seed: a.t0 * 10, marker: kvMark },
          });
        } else
          items.push({
            kind: 'point',
            shape: 'kv',
            color: a.color,
            kvSize: 0.3,
            kvMin: 28,
            kvMax: 64,
            pos: headPos,
          });
        if (!a.rocket)
          items.push({
            kind: 'point',
            shape: 'kv',
            color: a.headColor ?? '#fff1e6',
            kvSize: 0.14,
            kvMin: 14,
            kvMax: 30,
            pos: headPos,
          });
      }
      // opt-in launch site (rocket.pad): the launch-complex marker stands under the vehicle until a moment after liftoff (as for an interceptor)
      if (a.rocket?.pad) {
        const at = scl(g0, 1.002),
          until = a.t0 + (a.rocket.pad.hold ?? 0.07);
        items.push({ kind: 'point', shape: 'pad', color: a.color, at, t0: a.t0, until, pos: (t) => (t < until ? at : null), minPx: a.rocket.pad.minPx ?? 40, maxPx: a.rocket.pad.maxPx ?? 60, bright: !!a.rocket.pad.bright, island: !!a.rocket.pad.island });
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
    buildSpaceActor(a, {
      cfg,
      items,
      rnd,
      tgt,
      setFocus: (f) => (focus = focus || f),
    });
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
        ac.labelFn = (t, narrow) =>
          narrow && ac.short
            ? ac.short + (inZone(t) ? ' · GPS lost' : ' · GPS fine')
            : inZone(t)
              ? ac.label + ' · GPS signal lost'
              : ac.label + ' · GPS signal fine'; // short (opt-in): the phone text
        for (let k = 0; k < 1; k++)
          items.push({
            kind: 'beam',
            link: true,
            avoid: true,
            soft: true,
            opacity: 0.7,
            width0: 0.0018,
            maxPx: ac.beamMaxPx ?? 1.5, // navigation links stay fine at close camera distances
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
  const { cams, stillCamFor } = buildCameras({
    cfg,
    items,
    H,
    tgt,
    aircraftPos,
    focus,
    anchors,
    crafts,
  });
  return {
    cfg,
    items,
    cams,
    flags,
    stillCamFor,
    still: cfg.still ?? 0.5,
    sunRef: cams[0].sunRef || cams[0].pos,
  };
}
