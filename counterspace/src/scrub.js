// ============================================================================
// scrub.js: "Scrub through time", a thin year slider above the test chart. As it moves, the years after it are fogged out on the pinned law strip, the zoom panel and
// the test chart together, so the tests and the laws appear year by year, and a running tally says how many of each there have been ("1968: 25 tests, 2 laws").
// Play runs 1957 to 2026 in about twelve seconds (Skip jumps to the end) and ends on the longest wait in the pair data, drawn along the slider's own line.
// Everything is counted from the same entries the charts draw; nothing is typed in. With reduced motion there is no Play: the slider is moved by hand.
// Provides: mountScrub(). Registers hooks.scrubVeil, which the chart modules call after a draw so the fog survives every redraw. Needs: app.js, charts/lag.js, links.js.
// ============================================================================
import { DOMAIN, KIN, LEGAL, REDUCED, byId, chartScale, D, fmtY, parse } from './app.js';
import { LAW_WORDS, WORDS } from './charts/lag.js';
import { gap, yearsBetween } from './links.js';
import { hooks } from './shared.js';

const Y0 = 1957,
  Y1 = 2026,
  T0 = +DOMAIN[0],
  T1 = +DOMAIN[1], // 1 January 1957 to 1 January 2027: the span every chart on the shared years draws
  PLAY_MS = 12000;
const $ = (id) => document.getElementById(id);
const yearEnd = (y) => Date.UTC(y + 1, 0, 1) - 1; // a year on the slider means "through the end of that year"
const frac = (t) => (t - T0) / (T1 - T0);
const kinT = KIN.map((e) => +parse(e.date)),
  lawT = LEGAL.map((l) => +parse(l.start));
const count = (arr, t) => arr.reduce((n, v) => n + (v <= t ? 1 : 0), 0);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// cut: the moment the chart is shown up to (a number of milliseconds), or null when the whole chart shows. year: the whole year the slider is on.
let cut = null,
  year = Y1,
  finale = false,
  playing = false,
  touched = false, // the slider has been used (until then the line says what the whole chart holds)
  raf = 0;
const veils = new Set();
let futureSig = '';

// ---------------------------------------------------------------- the fog on the charts
hooks.scrubVeil = (svg, x, y0, y1) => {
  const g = svg.append('g').attr('class', 'scrub-veil').attr('aria-hidden', 'true');
  g.append('rect')
    .attr('class', 'sv-fog')
    .attr('y', y0)
    .attr('height', Math.max(0, y1 - y0));
  g.append('line').attr('class', 'sv-edge').attr('y1', y0).attr('y2', y1);
  const v = { g, x, svg: svg.node(), W: +svg.attr('width') || 0 };
  veils.add(v);
  paint(v);
  futureSig = ''; // a redrawn chart has new marks: they are dimmed again
  dimMarks();
};
function paint(v) {
  if (!v.svg.isConnected) return veils.delete(v);
  if (cut == null) return v.g.style('display', 'none');
  const [r0, r1] = v.x.range(),
    px = Math.max(r0, Math.min(r1, v.x(new Date(cut)))); // the left gutter (the altitude numbers) is never fogged
  v.g.style('display', null);
  v.g
    .select('.sv-fog')
    .attr('x', px)
    .attr('width', Math.max(0, v.W - px));
  v.g.select('.sv-edge').attr('x1', px).attr('x2', px);
}
// Marks that are still in the fog cannot be pointed at: no card opens for something the slider has not reached.
function dimMarks() {
  const sig = cut == null ? '' : String(Math.floor(cut / 864e5));
  if (sig === futureSig) return;
  futureSig = sig;
  document
    .querySelectorAll('#legalSvg .mark, #legalZoom .mark, #svgA .mark')
    .forEach((m) => m.classList.toggle('scrub-future', cut != null && +m.dataset.t > cut));
}

// ---------------------------------------------------------------- the longest wait
function longest() {
  const rows = D.lag_pairs.pairs.map((p) => {
    const ev = byId[p.event],
      law = byId[p.law],
      a = parse(ev.date || ev.start),
      b = parse(law.start);
    return { ev, law, a, b, years: yearsBetween(a, b) };
  });
  return rows.reduce((m, r) => (r.years > m.years ? r : m));
}

// ---------------------------------------------------------------- the control
let el,
  track,
  thumb,
  fill,
  tally,
  playBtn,
  liveEl,
  gapEl,
  ticksEl,
  cs = 1;
const tallyText = (t, y) => `${y}: ${plural(count(kinT, t), 'test')}, ${plural(count(lawT, t), 'law')}`;

function render(announce) {
  const t = cut ?? yearEnd(year),
    f = Math.min(1, Math.max(0, frac(cut ?? yearEnd(year)))),
    yShown = Math.max(Y0, Math.min(Y1, new Date(t).getUTCFullYear()));
  thumb.style.left = f * 100 + '%';
  fill.style.width = f * 100 + '%';
  track.setAttribute('aria-valuenow', String(yShown));
  const txt = tallyText(t, yShown);
  track.setAttribute('aria-valuetext', txt);
  if (finale) {
    const L = longest(),
      g = gap(L.years);
    tally.textContent = `The longest wait: ${g.num} ${g.unit}, from ${WORDS[L.ev.id]?.name ?? L.ev.system} (${fmtY(L.a)}) to the ${LAW_WORDS[L.law.id] ?? L.law.title} (${fmtY(L.b)}).`;
  } else tally.textContent = cut == null && !touched ? `1957 to 2026: ${plural(kinT.length, 'test')}, ${plural(lawT.length, 'law')}` : txt;
  el.classList.toggle('is-finale', finale);
  el.classList.toggle('is-on', cut != null);
  if (announce) liveEl.textContent = finale ? tally.textContent : txt;
  veils.forEach(paint);
  dimMarks();
  lightTicks();
}

// year-by-year moves (keys, taps on the line): the slider sits on the end of a whole year
function setYear(y, announce = true) {
  touched = true;
  stop();
  finale = false;
  gapEl.hidden = true;
  year = Math.max(Y0, Math.min(Y1, Math.round(y)));
  cut = year >= Y1 ? null : yearEnd(year);
  setPlayLabel();
  render(announce);
}
function setFrac(f) {
  setYear(new Date(T0 + f * (T1 - T0)).getUTCFullYear());
}

function stop() {
  if (!playing) return;
  playing = false;
  cancelAnimationFrame(raf);
  setPlayLabel();
}
function setPlayLabel() {
  playBtn.querySelector('span').textContent = playing ? 'Skip' : finale ? 'Play again' : 'Play';
  playBtn.querySelector('use').setAttribute('href', playing ? '#i-next' : finale ? '#i-replay' : '#i-play');
  playBtn.setAttribute('aria-label', playing ? 'Skip to the end' : finale ? 'Play again from 1957' : 'Play from 1957');
}
function showFinale() {
  stop();
  touched = true;
  finale = true;
  year = Y1;
  cut = null;
  const L = longest();
  gapEl.style.left = frac(+L.a) * 100 + '%';
  gapEl.style.width = (frac(+L.b) - frac(+L.a)) * 100 + '%';
  const g = gap(L.years);
  gapEl.querySelector('b').textContent = `${g.num} ${g.unit} later`;
  gapEl.hidden = false;
  setPlayLabel();
  render(true);
}
function play() {
  if (playing) return showFinale(); // Skip
  touched = true;
  finale = false;
  gapEl.hidden = true;
  playing = true;
  setPlayLabel();
  const t0 = performance.now();
  const step = (now) => {
    if (!playing) return;
    const f = Math.min(1, (now - t0) / PLAY_MS);
    cut = T0 + f * (T1 - T0) - 1;
    year = Math.max(Y0, Math.min(Y1, new Date(cut).getUTCFullYear()));
    render(false);
    if (f >= 1) return showFinale();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

// Where the page should sit while it plays: the pinned strip, the slider and the whole test chart in view together.
function bring(done) {
  const box = $('svgA'),
    row = el.getBoundingClientRect();
  if (!box) return done();
  const band = parseFloat(document.documentElement.style.getPropertyValue('--band-h')) || 0,
    want = box.getBoundingClientRect().top + scrollY - (band + el.offsetHeight + 12),
    ok = Math.abs(scrollY - want) < 80 && row.top >= 0;
  if (ok) return done();
  scrollTo({ top: want, behavior: REDUCED ? 'auto' : 'smooth' });
  if (REDUCED) return done();
  let last = -1,
    still = 0;
  const t0 = performance.now(),
    tick = () => {
      still = scrollY === last ? still + 1 : 0;
      last = scrollY;
      if (still > 4 || performance.now() - t0 > 1800) return done();
      requestAnimationFrame(tick);
    };
  requestAnimationFrame(tick);
}

// The slider's line starts and ends where the charts' year axes do, so the year under the thumb is the year under the edge of the fog.
function align() {
  cs = chartScale();
  el.style.setProperty('--cs', String(cs));
}

function buildTicks() {
  ticksEl.innerHTML =
    KIN.map((e, i) => `<i class="yr-t kin" style="left:${(frac(kinT[i]) * 100).toFixed(2)}%" data-t="${kinT[i]}"></i>`).join('') +
    LEGAL.map((l, i) => `<i class="yr-t law" style="left:${(frac(lawT[i]) * 100).toFixed(2)}%" data-t="${lawT[i]}"></i>`).join('');
}
// ticks the slider has passed read as counted
function lightTicks() {
  const t = cut ?? (touched ? yearEnd(year) : Infinity);
  ticksEl.querySelectorAll('.yr-t').forEach((n) => n.classList.toggle('past', +n.dataset.t <= t));
}

export function mountScrub() {
  el = $('yrBar');
  if (!el) return;
  track = $('yrTrack');
  thumb = el.querySelector('.yr-thumb');
  fill = el.querySelector('.yr-fill');
  tally = $('yrTally');
  playBtn = $('yrPlay');
  liveEl = $('yrLive');
  gapEl = el.querySelector('.yr-gap');
  ticksEl = el.querySelector('.yr-ticks');
  buildTicks();
  align();
  addEventListener('resize', align);
  render(false);
  if (REDUCED) playBtn.hidden = true;

  playBtn.addEventListener('click', () => (playing ? showFinale() : bring(play)));
  // pointer: press or drag anywhere on the line
  const at = (ev) => {
    const r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
  };
  track.addEventListener('pointerdown', (ev) => {
    if (ev.button) return;
    track.setPointerCapture(ev.pointerId);
    track.dataset.drag = '1';
    setFrac(at(ev));
    track.focus({ preventScroll: true });
  });
  track.addEventListener('pointermove', (ev) => track.dataset.drag && setFrac(at(ev)));
  const up = (ev) => {
    delete track.dataset.drag;
    if (track.hasPointerCapture?.(ev.pointerId)) track.releasePointerCapture(ev.pointerId);
  };
  track.addEventListener('pointerup', up);
  track.addEventListener('pointercancel', up);
  track.addEventListener('keydown', (ev) => {
    const k = ev.key,
      step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[k];
    if (step) {
      ev.preventDefault();
      return setYear((cut == null ? year : new Date(cut).getUTCFullYear()) + step);
    }
    if (k === 'Home') return (ev.preventDefault(), setYear(Y0));
    if (k === 'End') return (ev.preventDefault(), setYear(Y1));
    if (k === ' ' || k === 'Enter') return (ev.preventDefault(), playing ? showFinale() : bring(play));
    if (k === 'Escape' && playing) return (ev.preventDefault(), showFinale());
  });
  // the entry in the chapter's head: bring the slider into place, then play (by hand under reduced motion: the slider goes to 1957 and takes the focus)
  $('yrIntro')?.addEventListener('click', () => {
    bring(() => {
      if (REDUCED) {
        setYear(Y0);
        track.focus({ preventScroll: true });
      } else play();
    });
  });
}
