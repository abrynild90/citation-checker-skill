// ============================================================================
// landmark.js: the "you landed here" mark for "Find it on the chart" and "See it on the timeline".
// Provides: showLanding(el, label), clearLanding().
// One ring (and a small chip saying where the reader came from) is drawn over the mark in a fixed layer, so it never moves the page. It pulses three
// times, then stays steady until the reader's next pointer press or key, or until the mark has scrolled out of view. Reduced motion: no pulse.
// ============================================================================
let root = null,
  ringEl = null,
  chipEl = null,
  target = null,
  born = 0,
  arrived = false,
  raf = 0,
  early = 0,
  last = '';
const MODS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);
const EDGE = 12; // the chip keeps at least this far from the window's edge
const GRACE = 1800; // the landing scroll is followed frame by frame for this long (a scroll or resize event follows it after that)
const GIVE_UP = 8000; // a mark the page has still not brought into view by now is dropped

function build() {
  root = document.createElement('div');
  root.className = 'landmark';
  root.setAttribute('aria-hidden', 'true');
  root.hidden = true;
  root.innerHTML = '<div class="lm-ring"></div><div class="lm-chip"></div>';
  ringEl = root.firstChild;
  chipEl = root.lastChild;
  document.body.appendChild(root);
}
// the top edge of the room the reader can see: the pinned law strip (and the pinned year slider under it) cover the top of the window
function safeTop() {
  let t = 8;
  for (const id of ['legalBand', 'yrBar']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect(),
      pos = getComputedStyle(el).position;
    if ((pos === 'sticky' || pos === 'fixed') && r.bottom > 0 && r.top < innerHeight / 2 && r.top <= t + 1 + (id === 'yrBar' ? 200 : 0)) t = Math.max(t, r.bottom + 6);
  }
  return t;
}
function place() {
  raf = 0;
  if (!target || !target.isConnected) return clearLanding();
  const r = target.getBoundingClientRect(),
    vw = document.documentElement.clientWidth,
    vh = innerHeight,
    top = safeTop();
  const off = r.bottom < top - 4 || r.top > vh + 4 || r.right < 0 || r.left > vw;
  if (!off) arrived = true;
  else if (arrived || performance.now() - born > GIVE_UP) return clearLanding(); // scrolled away after being seen (or the page never brought it in)
  root.style.visibility = off ? 'hidden' : ''; // while the landing scroll is still bringing the mark in, the ring waits out of sight
  // the ring: the mark's box with room around it, never smaller than a finger
  const pad = 7,
    w = Math.max(r.width + pad * 2, 44),
    h = Math.max(r.height + pad * 2, 44),
    x = r.left + r.width / 2 - w / 2,
    y = r.top + r.height / 2 - h / 2;
  const key = [x, y, w, h, vw, vh, top, off].map((n) => Math.round(n)).join();
  if (key === last) return;
  last = key;
  root.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;${off ? 'visibility:hidden' : ''}`;
  root.classList.toggle('round', Math.abs(w - h) < 6 && w <= 64);
  // the chip goes where it hides least: above, below, to the right or to the left of the ring, whichever covers the least of the chart's own text and marks and
  // stays inside the window and under the pinned strip (ties keep that order)
  const cw = chipEl.offsetWidth,
    ch = chipEl.offsetHeight,
    gap = 8,
    svg = target.ownerSVGElement,
    others = svg
      ? [...svg.querySelectorAll('text, .mark')]
          .filter((n) => n !== target && !target.contains(n) && !n.contains(target))
          .map((n) => ({ r: n.getBoundingClientRect(), wt: n.tagName === 'text' ? 3 : 1 }))
      : [];
  const spots = [
    [x, y - ch - gap],
    [x, y + h + gap],
    [x + w + gap, y + h / 2 - ch / 2],
    [x - gap - cw, y + h / 2 - ch / 2],
  ].map(([px, py], i) => {
    const nx = Math.min(Math.max(px, EDGE), vw - EDGE - cw),
      ny = py;
    let cost = i * 0.01 + (Math.abs(nx - px) > 0.5 ? 40 + Math.abs(nx - px) : 0) + (ny < top ? 1e4 : 0) + (ny + ch > vh - 6 ? 1e4 : 0);
    // a chip pushed along by the window's edge must still be clear of the ring (never drawn over it)
    const rx = Math.min(nx + cw, x + w) - Math.max(nx, x),
      ry = Math.min(ny + ch, y + h) - Math.max(ny, y);
    if (rx > -4 && ry > -4) cost += 1e3 + Math.max(rx, 0) * Math.max(ry, 0);
    for (const { r, wt } of others) {
      const ox = Math.min(nx + cw, r.right) - Math.max(nx, r.left),
        oy = Math.min(ny + ch, r.bottom) - Math.max(ny, r.top);
      if (ox > 0 && oy > 0) cost += ox * oy * wt;
    }
    return { nx, ny, cost };
  });
  let best = spots.reduce((m, c) => (c.cost < m.cost ? c : m));
  if (best.cost >= 1e4) best = { nx: Math.min(Math.max(x, EDGE), vw - EDGE - cw), ny: Math.max(top, Math.min(y, vh - 6 - ch)) }; // no room anywhere: on the ring's top edge
  chipEl.style.cssText = `left:${best.nx - x}px;top:${best.ny - y}px`;
}
const schedule = () => {
  if (!raf && target) raf = requestAnimationFrame(place);
};
function onKey(e) {
  if (!MODS.has(e.key)) clearLanding();
}
const onPress = () => clearLanding();

export function clearLanding() {
  if (!target && !root) return;
  if (target) target.classList.remove('hl');
  target = null;
  cancelAnimationFrame(raf);
  clearInterval(early);
  raf = 0;
  last = '';
  if (root) root.hidden = true;
  removeEventListener('pointerdown', onPress, true);
  removeEventListener('keydown', onKey, true);
  removeEventListener('scroll', schedule);
  removeEventListener('resize', schedule);
}

export function showLanding(el, label) {
  clearLanding();
  if (!el) return;
  if (!root) build();
  target = el;
  born = performance.now();
  arrived = false;
  el.classList.add('hl');
  chipEl.textContent = label || '';
  chipEl.hidden = !label;
  root.hidden = false;
  // restart the pulse for each landing
  root.classList.remove('lm-on');
  void root.offsetWidth;
  root.classList.add('lm-on');
  place();
  // the page is still scrolling to the mark for a moment: follow it each frame, then only on scroll and resize
  const t0 = born;
  early = setInterval(() => {
    schedule();
    if (arrived && performance.now() - t0 > GRACE) clearInterval(early);
    else if (performance.now() - t0 > GIVE_UP) clearInterval(early);
  }, 50);
  addEventListener('pointerdown', onPress, true);
  addEventListener('keydown', onKey, true);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
}
