// ============================================================================
// scenes/cameras.js: camera presets for a simulated scene: wide/polar/zoom views, follow and frame cameras, the dolly camera of the hit scenes and the
// still-frame camera (renderer-independent; used by sim.js)
// ============================================================================
import { DEG, GEO_ALT, IS_PHONE, add, dot, len, ll, norm, rAlt, scl, smooth } from './core.js';

// `ctx` is what buildSim has collected by the time the items exist: the config, the items, the hit definition, the target and aircraft positions, the
// focus point, the anchors and the keyframed crafts. Returns the camera list and `stillCamFor(t, aspect)`.
export function buildCameras({ cfg, items, H, tgt, aircraftPos, focus, anchors, crafts }) {
  const A = cfg.acts || null;
  const f = focus || [20, 0];
  const dist = (cfg.camDist || 4.2) * (IS_PHONE ? (cfg.phoneK ?? 1) : 1);
  const wide = { name: 'Whole scene', pos: ll(cfg.wideLat != null && !IS_PHONE ? cfg.wideLat : f[0] * 0.6 + 10, f[1] - 25, dist) },
    polar = { name: 'From the pole', pos: ll(80, f[1], dist * 1.05) };
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
    pts = pts.filter(Boolean);
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
  const centroid = (pts) => {
    const v = pts.filter(Boolean); // a craft that is not drawn at this t has no position
    return scl(
      v.reduce((q, p) => add(q, p), [0, 0, 0]),
      1 / Math.max(1, v.length),
    );
  };
  const debrisPts = (tk, pct) => {
    const cl = items.find((i) => i.kind === 'cloud' && i.dynCol && !i.colored);
    if (!cl || !tgt || tk <= tgt.t + 0.01) return [];
    const arr = new Float32Array(cl.n * 3);
    cl.fill(tk, arr);
    const q = [];
    for (let k = 0; k < cl.n; k++) if (arr[3 * k] || arr[3 * k + 1] || arr[3 * k + 2]) q.push([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]);
    if (q.length < 3) return [];
    const c = scl(
        q.reduce((a, p) => add(a, p), [0, 0, 0]),
        1 / q.length,
      ),
      d = q.map((p) => len(add(p, scl(c, -1)))),
      cut = d.slice().sort((x, y) => x - y)[Math.floor((q.length - 1) * pct)];
    const kept = q.filter((p, k) => d[k] <= cut),
      dk = kept.map((p) => len(add(p, scl(c, -1))));
    // an even sample, plus the farthest kept fragments (the frame edge is decided by the extremes, not the bulk)
    const far = kept
      .map((p, k) => k)
      .sort((a, b) => dk[b] - dk[a])
      .slice(0, 12);
    return kept.filter((p, k) => k % Math.max(1, Math.floor(kept.length / 40)) === 0 || far.includes(k));
  };
  const dollyCam = () => {
    const ht = tgt.t,
      arc = items._arc,
      // earlyKey: the camera is already tight on the intercept at mid-approach
      keys = cfg.earlyKey ? [0, ht * 0.45, ht, ht + 0.1, 0.6, 1] : [0, ht, ht + 0.1, 0.6, 1],
      core = [tgt.hitPos].concat(arc ? [arc.from] : [], aircraftPos ? [aircraftPos(0)] : []),
      c0 = centroid(core),
      cn = norm(c0);
    let sd = cross3(cn, [0, 1, 0]);
    if (len(sd) < 0.2) sd = [1, 0, 0];
    const tilt = (cfg.fitTilt ?? 24) * DEG,
      n = norm(add(scl(cn, Math.cos(tilt)), scl(norm(sd), Math.sin(tilt) * (cfg.fitSide ?? 1)))),
      cache = {},
      burst = items.find((i) => i.kind === 'flash' && i.big && tgt.hitPos && i.pos === tgt.hitPos) || items.find((i) => i.kind === 'flash' && i.big),
      hn = norm(tgt.hitPos),
      e1 = norm(cross3(hn, [0, 1, 0])),
      e2 = cross3(hn, e1),
      bR = burst ? (burst.size ?? 0.3) * 1.7 * 0.5 * (cfg.burstPad ?? 1.3) : 0,
      burstPad = [e1, scl(e1, -1), e2, scl(e2, -1)].map((e) => add(tgt.hitPos, scl(e, bR))),
      posesFor = (asp) =>
        (cache[Math.round(asp * 20)] ||= keys.map((tk) => {
          const P = core.slice();
          // the expanding burst ring (flash sprite) must fit inside the frame too, not just its centre
          if (burst && tk <= ht + 0.16) P.push(...burstPad);
          if (arc && tk <= ht + 0.05) P.push(arc.to);
          if (tk <= ht) P.push(tgt.pos(tk));
          if (tk > ht) P.push(...debrisPts(cfg.fitDebrisT != null ? Math.min(tk, cfg.fitDebrisT) : tk, tk > ht + 0.12 && cfg.latePct ? cfg.latePct : (cfg.fitPct ?? 0.8)));
          if (cfg.fitCross && items._cross && tk > ht) P.push(items._cross); // fitCross: the crossing with the other orbit (the ISS's) stays in view
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
      if (cfg.camGlide) {
        // camGlide: one Catmull-Rom curve through the key poses (no stop at each key), so the view re-centres in a single smooth move
        const h = keys[i + 1] - keys[i],
          u = Math.max(0, Math.min(1, (t - keys[i]) / h)),
          i0 = Math.max(0, i - 1),
          i3 = Math.min(keys.length - 1, i + 2),
          g = (f) =>
            poses[i][f].map((p1, k) => {
              const p2 = poses[i + 1][f][k],
                m1 = i === 0 ? 0 : ((p2 - poses[i0][f][k]) / (keys[i + 1] - keys[i0])) * h,
                m2 = i3 === i + 1 ? 0 : ((poses[i3][f][k] - p1) / (keys[i3] - keys[i])) * h,
                u2 = u * u,
                u3 = u2 * u;
              return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
            });
        return { pos: g('pos'), look: g('look'), up: null };
      }
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
            return {
              ...fitPose(P, n, look, { dMin: 0.3, dMax: c.fit.dMax ?? 6, fillX: c.fit.fill ?? 0.86, fillY: (c.fit.fill ?? 0.86) * 0.8, asp }),
              up: null,
            };
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
        // trackPath.lift raises the view direction toward the pole, so the equatorial GEO ring is seen as an open ellipse
        const it = items.find((i) => i.trackable),
          all = it.all,
          up = norm(all[all.length >> 1]),
          sd = norm(cross3(up, [0, 1, 0])),
          tilt = (c.trackPath.tilt ?? 30) * DEG,
          n = norm(add(add(scl(up, Math.cos(tilt)), scl(sd, Math.sin(tilt) * (c.trackPath.side ?? 1))), [0, c.trackPath.lift ?? 0, 0])),
          pose = (t, asp, geo, ring) => {
            const pl = it.pts(t),
              P = [
                all[0],
                pl.length ? pl[pl.length - 1] : all[1],
                all[Math.min(all.length - 1, Math.round(((t - it.t0) / (it.t1 - it.t0) + 0.22) * (all.length - 1)))],
              ];
            if (geo) P.push(scl(up, rAlt(GEO_ALT)));
            // trackPath.ring: the whole GEO ring (8 points in the equatorial plane) and the arc's apex stay in frame
            if (ring) {
              const R = rAlt(GEO_ALT);
              for (let k = 0; k < 8; k++) P.push([R * Math.cos((k * Math.PI) / 4), 0, R * Math.sin((k * Math.PI) / 4)]);
              P.push(all[all.length >> 1]);
            }
            const look = scl(centroid(P.concat([[0, 0, 0]])), c.trackPath.lookK ?? 1); // lookK < 1 pulls the view toward the Earth's centre
            const q = fitPose(P, n, look, { dMin: 1.2, dMax: 12, fillX: c.trackPath.fill ?? 0.8, fillY: (c.trackPath.fill ?? 0.8) * 0.8, asp });
            // trackPath.zoom: with the ring in frame, move in by that factor: the Earth gets larger and the far side of the ring is cropped on purpose
            if (ring && c.trackPath.zoom) q.pos = add(look, scl(add(q.pos, scl(look, -1)), 1 / c.trackPath.zoom));
            return { ...q, up: null };
          },
          at = (t, asp) => {
            const g0 = c.trackPath.geoT ?? 0.35;
            if (!c.trackPath.ring) return pose(t, asp, t > g0, false);
            // the ring framing is blended in over the 0.14 before geoT + 0.14, so the camera glides out instead of jumping
            const w = smooth((t - (g0 - 0.1)) / 0.2),
              A = pose(t, asp, false, false),
              B = pose(t, asp, true, true);
            return { pos: add(scl(A.pos, 1 - w), scl(B.pos, w)), look: add(scl(A.look, 1 - w), scl(B.look, w)), up: null };
          };
        return { name: c.name, auto: false, ref: c.ref, follow: at, ...at(0), hideShell: true, ringFrame: !!c.trackPath.ring };
      }
      if (c.fitCraft) {
        // Tight follow camera on a set of craft: the view direction is given in the anchor's local frame [along, radial, cross-track] and stays fixed;
        // the target point and the distance are fitted at every t to the craft (now and a little ahead), so the action always fills the frame.
        const an = anchors[c.fitCraft.anchor],
          ids = c.fitCraft.ids,
          at = (t, asp) => {
            const P = [];
            // fitCraft.lock: the target stays on the craft itself (a fast eccentric orbit would leave it at the frame edge or off a portrait stage)
            for (const id of ids) if (crafts[id].pos(t)) for (const dt of c.fitCraft.lock && c.fitCraft.tight ? [-0.015, 0, 0.008] : [-0.05, 0, 0.02]) P.push(crafts[id].raw(Math.max(0, Math.min(1, t + dt))));
            if (!P.length) for (const id of ids) P.push(crafts[id].raw(t));
            // fitCraft.include: extra points in the anchor's local frame that must stay in view (the GEO belt under the pair)
            for (const o of c.fitCraft.include || []) P.push(add(add(add(an.pos(t), scl(an.frame(t).along, o[0])), scl(an.frame(t).rad, o[1])), scl(an.frame(t).cross, o[2])));
            const f = an.frame(t),
              d = (asp != null && asp < 1.3 && c.fitCraft.phoneDir) || c.fitCraft.dir, // phoneDir: a steeper view on a narrow (phone) stage
              n = norm(add(add(scl(f.along, d[0]), scl(f.rad, d[1])), scl(f.cross, d[2])));
            const pose = fitPose(P, n, c.fitCraft.lock ? add(scl(centroid(P), 0.65), scl(centroid(ids.map((id) => crafts[id].raw(t))), 0.35)) : centroid(P), {
              up: f.rad,
              dMin: c.fitCraft.dMin ?? 0.14,
              dMax: 6,
              fillX: c.fitCraft.fill ?? 0.8,
              fillY: (c.fitCraft.fill ?? 0.8) * 0.8,
              asp,
            });
            if (c.fitCraft.lock) {
              // slide the view so the craft sits left of and below the middle (clear of the context inset in the top right corner), whatever the stage shape
              const fw = norm(add(pose.look, scl(pose.pos, -1))),
                r = norm(cross3(fw, f.rad)),
                u = cross3(r, fw),
                D = Math.hypot(...add(pose.look, scl(pose.pos, -1))),
                [tH, tV] = tanFor(asp ?? ASPECT),
                sh = add(scl(r, 0.14 * tH * D), scl(u, 0.12 * tV * D));
              return { pos: add(pose.pos, sh), look: add(pose.look, sh), up: f.rad };
            }
            return { ...pose, up: f.rad };
          };
        return { name: c.name, auto: !!c.auto, act: c.act, ref: c.ref, follow: at, ...at(c.fitCraft.t ?? 0.5), hideShell: true };
      }
      if (c.frame) return { name: c.name, auto: !!c.auto, act: c.act, ref: c.ref, ...frameCam(c.frame) };
      // c.drift = [dLon of the camera, dLon of the target] in degrees over the whole timeline: a slow pan, so the view differs at every t
      const drifted = (t) => ({
        pos: ll(c.at[0], c.at[1] + c.drift[0] * (t - 0.5), c.at[2]),
        look: c.look ? ll(c.look[0], c.look[1] + c.drift[1] * (t - 0.5), c.look[2]) : null,
        up: null,
      });
      return {
        name: c.name,
        auto: !!c.auto,
        act: c.act,
        ref: c.ref,
        hide: c.hide,
        insetRef: c.insetRef,
        status: c.status,
        pos: ll(...c.at),
        look: c.look ? ll(...c.look) : null,
        hideShell: !!c.look,
        ...(c.drift ? { follow: drifted, ...drifted(0.5) } : {}),
      };
    });
  else if (H && !items._arc) cams = [{ name: 'Close up', pos: ll(f[0] * 0.8 + 6, f[1] - 12, Math.max(2.5, dist * 0.72)) }, wide, polar];
  else if (items._arc) {
    // launch site through the intercept: a side-on camera looking at the middle of the arc
    const { from, to, mid } = items._arc,
      md = norm(mid),
      e1 = norm(add(to, scl(from, -1))),
      nrm = norm([md[1] * e1[2] - md[2] * e1[1], md[2] * e1[0] - md[0] * e1[2], md[0] * e1[1] - md[1] * e1[0]]);
    const look = add(mid, scl(md, -0.03 - (cfg.lookMix ?? 0) * len(mid))),
      launch = {
        name: 'From the launch site',
        pos: add(look, add(scl(nrm, 0.78 * (cfg.camScale || 1) * (IS_PHONE ? 0.8 : 1)), scl(md, 0.34 * (cfg.camScale || 1) * (IS_PHONE ? 0.8 : 1)))),
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
      name: 'From orbit',
      pos: cfg.orbitAt
        ? ll(cfg.orbitAt[0], cfg.orbitAt[1], cfg.orbitAt[2] * (IS_PHONE ? (cfg.phoneK ?? 1) : 1))
        : ll(f[0] * 0.5 + 12, f[1] - 30, Math.max(3.2, dist * 0.8)),
    };
    cams = cfg.launchCam === 'second' ? [orbit, launch, polar] : [launch, orbit, polar];
    if (H && cfg.dolly !== false) cams.unshift(dollyCam());
  } else cams = [wide, { name: 'Close up', pos: ll(f[0], f[1] - 8, Math.max(2.3, dist * 0.55)) }, polar];
  // Still-frame camera: for act scenes, the camera of the act that contains t; otherwise cfg.stillFrame (a frame camera) if given.
  const stillCamFor = (t, asp) => {
    if (A && !cfg.stillCam) {
      const i = A.findIndex((a, k) => t >= a.t0 && (t < a.t1 || k === A.length - 1));
      const c = cams[A[Math.max(0, i)].cam],
        v = c.follow ? c.follow(t, asp) : c;
      return { pos: v.pos, look: v.look, up: v.up, hideShell: true };
    }
    if (cfg.stillFrame) return frameCam(cfg.stillFrame);
    if (cfg.stillDolly !== false && cfg.stillCam == null && cams[0].follow && !cfg.acts) return { ...cams[0].follow(t, asp), hideShell: true };
    return null;
  };
  return { cams, stillCamFor };
}
