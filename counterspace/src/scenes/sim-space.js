// ============================================================================
// scenes/sim-space.js: simulator actor builders for the field-like actors: Van Allen belt, field lines, constellation, jamming zone, GEO satellite
// and its ground terminals, and the beam (renderer-independent; called per actor by sim.js)
// (ES module: bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
// ============================================================================
import { DEG, GEO_ALT, IS_PHONE, PARTICLE_BUDGET, add, clamp01, dot, groundArc, lerp, ll, mulberry, norm, orbitPos, rAlt, scl, smooth } from './core.js';

// Pushes the items for one actor `a` of the types handled here onto ctx.items. ctx: {cfg, items, rnd, tgt, setFocus}.
export function buildSpaceActor(a, { cfg, items, rnd, tgt, setFocus }) {
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
          uniformA: 0.2,
          staticKeep: lo % 3 === 0 && Li !== 1, // the static diagram draws a third of the arches: a cage, not a tangle
          limbOnly: true, // ... and only where they stand out against the sky, never across the Earth's face
          opacity: 0.2,
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
    setFocus(a.at);
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
          trailOf: a.trail && s === 0 ? { pts, u0: ph, speed: a.speed, len: a.trail } : null,
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
      items.push({ kind: 'beam', a: () => g, b: () => m, on: () => true, color: a.color, opacity: 0.4, width: 0.0038, edgeFade: true });
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
        edgeFade: true,
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
        state: true,
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
          state: true,
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
    setFocus([30, a.lon]);
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
              ? 'Attackers reach the ground network and push malicious commands'
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
    // dazzle: a flaring glare on the target while the beam is on (the sensor is overwhelmed, nothing is destroyed)
    items.push({
      kind: 'glare',
      pos: (t) => tgt.pos(t),
      on: (t) => Math.abs(t - tgt.t) < a.window && dot(tgt.pos(t), su) > 1.02,
      color: a.glareColor || '#ffd6f6',
    });
  }
}
