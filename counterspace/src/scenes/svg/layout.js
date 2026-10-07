// ============================================================================
// scenes/svg/layout.js: frame fit for the static diagram: caption, craft base size, banner and key reservations, and the globe's size and centre
// ============================================================================
import { PILL, labelFs, pillSize, textW } from './pill.js';

// Wrap the caption to maxW px (measured with the caption's own type); its height is part of the fit.
function wrapStatus(text, maxW, fs) {
  const greedy = (w) => {
    const lines = [];
    let cur = '';
    for (const wd of text.split(' ')) {
      if (cur && textW((cur + ' ' + wd).trim(), fs, 500) > w) {
        lines.push(cur);
        cur = wd;
      } else cur = (cur + ' ' + wd).trim();
    }
    if (cur) lines.push(cur);
    return lines;
  };
  // Balanced: the narrowest measure that still gives the same number of lines, so the last line is never a single orphaned word.
  const first = greedy(maxW);
  if (first.length < 2) return first;
  let lo = maxW / 2,
    hi = maxW;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(mid).length <= first.length) hi = mid;
    else lo = mid;
  }
  return greedy(hi);
}

// Extent (unit-sphere coordinates, y down) that the globe and every drawn subject must fit; `unit` projects a 3D point.
// General fit rule (all scenes, all widths): the globe with its glow and every drawn subject (paths, points, debris, beams)
// must sit inside the free area: below the banner, above the status/caption band, inside the side margins. The globe is never cropped.
function fitExtent(sim, opts, t, W, unit) {
  let x0 = -1.08,
    x1 = 1.08,
    y0 = -1.08,
    // a close-up (staticGlobeY1) keeps the action large: the globe's lower part runs off the frame
    y1 = (!opts.panel && ((W < 520 && sim.cfg.staticGlobeY1Phone) || sim.cfg.staticGlobeY1)) || 1.08;
  // far orbits (apogees, belts) may run off the frame so the Earth stays large
  const fitMax = sim.cfg.staticFit && !sim.cfg.staticFitRing && !opts.panel ? (W < 520 && sim.cfg.staticFitPhone) || sim.cfg.staticFit : 0;
  const grow = (p) => {
    if (!p || p.hidden) return;
    if (fitMax && Math.hypot(p.x, p.y) > fitMax) return;
    if (y1 < 1 && p.y > y1) return; // close-up (staticGlobeY1): what lies below the crop line does not set the fit
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y);
  };
  {
    for (const it of sim.items) {
      if (it.ctx) continue; // context-only actors (constellations) never shrink the fit
      if (it.kind === 'curve') {
        if (it.staticKeep === false) continue;
        // On a phone the Earth gets the room: orbit and belt lines run off the frame, only trails and paths of the action set the fit.
        // (the hero keeps every ring inside its picture at any width)
        if (sim.cfg.staticFitRing || sim.cfg.spin || !(W < 520 && (it.orbit || it.gate || it.role === 'orbit'))) it.pts(t).forEach((q) => grow(unit(q)));
      } else if (it.kind === 'point' && !it.liveOnly) {
        const q = (!opts.panel && it.staticPos?.(t)) || it.pos(t);
        if (q) grow(unit(q));
      } else if (it.kind === 'beam') {
        const A = it.a(t),
          B = (!opts.panel && it.bStatic?.(t)) || it.b(t);
        if (A && B && it.on(t)) {
          grow(unit(A));
          grow(unit(B));
        }
      } else if (it.kind === 'cloud') {
        const arr = new Float32Array(it.n * 3),
          col = it.dynCol ? new Float32Array(it.n * 4) : null;
        it.fill(t, arr, col);
        for (let k = 0; k < it.n; k += Math.max(1, Math.floor(it.n / 400)))
          if (arr[3 * k] || arr[3 * k + 1] || arr[3 * k + 2]) grow(unit([arr[3 * k], arr[3 * k + 1], arr[3 * k + 2]]));
      }
    }
  }
  return { x0, x1, y0, y1 };
}

// Real banner box (the viewer's caption chip sits over the diagram), as [x, y, w, h].
function bannerBox(el, opts, W) {
  let bRes = opts.panel ? [-20, -20, 1, 1] : [8, 8, Math.min(W - 16, 380), W < 520 ? 40 : 26];
  if (!opts.panel) {
    const bn = el.querySelector(':scope > .illus'),
      er = el.getBoundingClientRect(),
      br = bn?.getBoundingClientRect();
    if (br && br.width && er.width) bRes = [br.left - er.left - 3, br.top - er.top - 3, br.width + 6, br.height + 6];
  }
  return bRes;
}

// Everything that sets where the globe goes: caption box, craft base size, banner and key reservations, and the solved radius and centre
// (R, CX, CY, in px). `unit` projects a 3D point onto the unit globe.
export function fitFrame(sim, el, t, opts, W, H, unit) {
  // The caption is wrapped first: its height is part of the fit.
  const st = sim.items.find((i) => i.kind === 'status'),
    stTxt = opts.panel ? opts.status || '' : (W < 520 && sim.cfg.staticStatusPhone) || sim.cfg.staticStatus || (st ? st.text(t, true, true) : ''),
    stFs = !opts.panel && W >= 700 ? 14 : opts.panel || W < 520 ? 13 : 12, // a panel caption is at least 13 px; // the caption matches the live caption: 14 px on a desktop stage
    stLh = Math.round(stFs * 1.35),
    maxW = W - (opts.panel ? 16 : 32) - 2 * PILL.padX,
    hasStatus = !!(opts.panel ? stTxt : st),
    stLines = hasStatus ? wrapStatus(stTxt, maxW, stFs) : [];
  const nCraft = sim.items.filter((i) => i.kind === 'point' && i.prim && i.shape !== 'none' && !i.ctx && !i.liveOnly && i.pos(t)).length,
    craftBase = opts.panel
      ? Math.min(W * 0.17, opts.phone ? 40 : 52)
      : Math.max(
          26,
          Math.min(
            (W < 520 && sim.cfg.staticCraftMaxPhone) || sim.cfg.staticCraftMax || (nCraft <= 2 ? 110 : 64),
            W * (W < 520 ? (nCraft <= 2 ? 0.14 : 0.07) : nCraft <= 2 ? 0.1 : nCraft <= 4 ? 0.055 : 0.045),
          ),
        );
  const stH = stLines.length * stLh + 14,
    stY = H - (opts.panel ? 6 : 12) - stH,
    stW = Math.min(W - (opts.panel ? 12 : 16), Math.max(...stLines.map((l) => textW(l, stFs, 500)), 1) + 2 * PILL.padX + 6);
  const { x0, x1, y0, y1 } = fitExtent(sim, opts, t, W, unit);
  const bRes = bannerBox(el, opts, W);
  // A panel's title is a pill at its top left corner: its size is part of the fit (and reserved for the label placer).
  const tt = opts.panel && opts.title ? pillSize(opts.title, { dot: false, fs: labelFs(W, opts) }) : null,
    titleW = tt ? tt.w + 6 : 0,
    titleH = tt ? tt.h + 6 : 0;
  const hero = !!sim.cfg.spin && !opts.panel, // the first picture: no caption, no banner, a calm margin all round
    docked = sim.items.some((i) => i.dockWith && i.dockOn(t)), // a docked pair is two models wide: more side margin
    fx = hero ? Math.max(16, Math.round(W * 0.03)) : sim.cfg.staticFitRing ? 20 : 14 + (opts.panel ? 0 : Math.round(craftBase * (docked ? 1.15 : 0.6))), // a ring-fit scene: the ring sets the width
    fTop = hero
      ? Math.max(16, Math.round(H * 0.04))
      : opts.panel
        ? opts.title
          ? titleH + 6
          : 6
        : Math.max(W < 520 ? 56 : 42, bRes[1] + bRes[3] + 4) + (nCraft ? Math.round(craftBase * 0.3) : 0),
    // staticKeyClearPhone: on a phone the Earth sits above the legend key (the key never lies on the globe)
    keyH = !opts.panel && W < 520 && sim.cfg.staticKeyClearPhone && sim.cfg.staticKey ? sim.cfg.staticKey.length * 20 + 20 : 0,
    fBot = hero ? H - Math.max(16, Math.round(H * 0.04)) : stY - 8 - keyH - (nCraft && !opts.panel ? Math.round(craftBase * 0.3) : 0);
  let R = Math.max(20, Math.min((W - 2 * fx) / (x1 - x0), (fBot - fTop) / (y1 - y0)));
  let CX = W / 2 - ((x0 + x1) / 2) * R,
    CY = (fTop + fBot) / 2 - ((y0 + y1) / 2) * R;
  if (opts.view) {
    // Panel: the craft fill the panel (span = their half-extent); the Earth is drawn wherever it falls.
    const f = unit(opts.view.focus);
    const fitR = (k) => Math.min((W - 16) / (2 * opts.view.span * k), (fBot - fTop) / (2 * opts.view.span * k)),
      sp = fitR(1.5) < 0.2 * W ? 1.12 : 1.5; // a tiny Earth (panel 1) gets the craft packed closer to the panel edge: the Earth comes out larger
    R = Math.max(30, fitR(sp));
    CX = W / 2 - f.x * R;
    CY = (fTop + fBot) / 2 - f.y * R;
  }
  return { stFs, stLh, stTxt, hasStatus, stLines, nCraft, craftBase, stH, stY, stW, bRes, titleW, titleH, fTop, fBot, R, CX, CY };
}
