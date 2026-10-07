// ============================================================================
// ui.js: hover/focus card, roving tabindex, shared guide line, write-once DOM helpers.
// Provides: bindMark(), showCard(), rove(), addGuide(), setOnce(), legend(), table(), hint3d().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { EXPORTING, LAST_DA, PHONE_MAX, esc, fmt, fmtD, fmtMY, fmtY, hasScene, num, parse } from './app.js';
import { hooks } from './shared.js';
const card = document.getElementById('card');
function showCard(html, evt, el, full = false) {
  const byKey = !!el?.matches?.(':focus-visible') && !matchMedia('(hover: none)').matches;
  // a card opened by keyboard carries the one-line key help, so nothing else has to float over the chart
  card.innerHTML = byKey && !html.includes('kb-line') ? html + '<p class="kb-line">Arrow keys move between points. Enter opens details. Escape closes this card.</p>' : html;
  card.classList.toggle('full', full);
  // On a narrow page a hover card for a mark on the law band is slim (name, kind and date): the full text opens on click or Enter, so the card fits the empty
  // part of the band instead of covering the zoom panel, the axis or the chapter heading.
  if (!full && innerWidth < 1100 && el?.closest?.('#legalBand, #legalZoomBox, #svgL')) {
    const t = document.createElement('div');
    t.innerHTML = card.innerHTML;
    t.querySelectorAll('p:not(.card-title):not(.when):not(.kb-line), .src').forEach((n) => n.remove());
    card.innerHTML = t.innerHTML;
  }
  // A card opened by keyboard focus is opaque at once (no half-faded card with page text showing through while it moves into place).
  card.classList.toggle('solid', !!el?.matches?.(':focus-visible'));
  card.classList.add('on');
  card.setAttribute('aria-hidden', 'false');
  const dock = innerWidth < PHONE_MAX;
  card.classList.toggle('dock', dock);
  // A docked card is a column: the text scrolls in .cbody and the dismiss / scroll cue is a footer of its own, so the cue never prints over text.
  if (dock) card.innerHTML = `<div class="cbody">${html}</div>`;
  card.dataset.touch = touchMode ? '1' : '';
  shownY = scrollY;
  if (dock) {
    // The docked card sits at the bottom of the screen, or at the top when the tapped point is in the lower half, so it never covers that point.
    const mr = el?.getBoundingClientRect?.();
    card.classList.toggle('top', !!mr && (mr.top + mr.bottom) / 2 > innerHeight * 0.5);
    card.style.left = '';
    card.style.top = '';
    card.firstChild.scrollTop = 0;
    dockCue();
    return;
  }
  card.classList.remove('more');
  // Dense strips (the close-approach chart) have no side that covers nothing: the card stays beside its mark (wider, so shorter), accepts covering a
  // mark or two only when no empty spot is near (cheap, not free) and keeps off the row titles; elsewhere covering a mark costs far more than distance.
  const near = !!el?.closest?.('#svgR'),
    WM = near ? 1.5 : 60;
  card.style.maxWidth = near ? (card.classList.contains('full') ? '380px' : '320px') : '';
  card.classList.toggle('cc', near && !full); // compact hover card on the dense strip: heading clamped to two lines
  // A long bar (a campaign, a negotiation period) is a poor anchor: a hover card sits by the pointer, not by the bar's far end.
  let r = el ? el.getBoundingClientRect() : { left: evt.clientX, right: evt.clientX, top: evt.clientY, bottom: evt.clientY };
  if (el && r.width > 240 && evt && typeof evt.clientX === 'number' && evt.type?.startsWith('mouse')) r = { left: evt.clientX - 6, right: evt.clientX + 6, top: r.top, bottom: r.bottom };
  const cw = card.offsetWidth,
    ch = card.offsetHeight,
    G = 14,
    VW = innerWidth,
    VH = innerHeight;
  // The sticky law band (when stuck to the top) is never covered by a card.
  const bandR = document.getElementById('legalBand')?.getBoundingClientRect(),
    TOP = bandR && bandR.top <= 1 && bandR.bottom > 0 && !(el && el.closest('#legalBand')) ? Math.max(8, bandR.bottom + 8) : 8;
  // Smart placement: try right, left, above and below the mark and take the candidate that covers the fewest neighbouring marks and the chart's x axis.
  const root = el?.closest?.('svg');
  // Annotation lines are tspans inside a <text>: the whole <text> is the obstacle. Zone labels are obstacles everywhere (not only on the strip chart).
  const texts = new Set();
  root?.querySelectorAll('.ann, .ann-sub, .empty-note').forEach((n) => texts.add(n.closest('text') || n));
  root?.querySelectorAll('text.band-label, .handoff text').forEach((n) => texts.add(n));
  // every other piece of chart wording (titles, glosses, row names, panel labels, law labels) is an obstacle too; axis numbers have their own rule below
  root?.querySelectorAll('text').forEach((n) => !n.closest('.axis, .xaxis, .yaxis, .tick, .glyph, .badge3d') && !(el && el.contains(n)) && texts.add(n));
  // a mark's own words (a row name that belongs to a neighbouring mark) are wording too, so they are no longer counted as marks
  const wordsOf = new Set([...texts].filter((n) => n.closest('.mark')));
  const others = root
      ? [...root.querySelectorAll('.mark')]
          .filter((n) => n !== el)
          .flatMap((n) =>
            n.querySelector('.hit')
              ? [...n.querySelectorAll(':scope > :not(.hit)')].filter((c) => !wordsOf.has(c)).map((c) => c.getBoundingClientRect())
              : [n.getBoundingClientRect()],
          )
      : [];
  const noText = [...texts].map((n) => n.getBoundingClientRect()); // covering annotation or zone-label text costs more than any distance
  // Nor the chart's controls, its key or the section heading
  [...document.querySelectorAll('.seg, .legend, h2')].forEach((n) => {
    if (el && n.contains(el)) return;
    const b = n.getBoundingClientRect();
    if (b.width > 2 && b.height > 2 && b.bottom > 0 && b.top < VH) noText.push(b);
  });
  // A card never covers a Download chart button, nor the zoom strip when it belongs to a mark on the law band above it.
  [...document.querySelectorAll('.dl-row .btn, .dl-wrap .btn')]
    .concat(el && !el.closest('#legalZoomBox') && el.closest('#legalBand') ? [document.getElementById('legalZoomBox')] : [])
    .forEach((n) => {
      const b = n?.getBoundingClientRect();
      if (b && b.width > 2 && b.bottom > 0 && b.top < VH) noText.push(b);
    });
  // Page wording around the chart (headings, ledes, callouts, keys: marked data-avoid) is avoided too, unless it is the mark's own region.
  // Each line of such text is its own obstacle (a card may cover the empty end of a line, not the words), so a heading costs per line it covers.
  const avoid = [...document.querySelectorAll('[data-avoid]')]
    .filter((n) => !(el && n.contains(el)))
    .flatMap((n) => {
      const rg = document.createRange();
      rg.selectNodeContents(n);
      const rs = n.matches('ul, div') ? [...n.children].map((c) => c.getBoundingClientRect()) : [...rg.getClientRects()];
      const w = n.matches('h2, .callout') ? 3 : 1; // a heading or a callout must stay readable: covering one costs three times as much
      return rs.filter((b) => b.width > 2 && b.height > 2 && b.bottom > 0 && b.top < VH).map((b) => Object.assign(b.toJSON(), { w }));
    });
  // distance from the card to its mark: proximity matters (a card that drifts a long way from its mark is worse than one that covers a line of lede)
  const gapTo = (q) => Math.hypot(Math.max(q.left - r.right, r.left - q.right, 0), Math.max(q.top - r.bottom, r.top - q.bottom, 0));
  // A mark on the sticky law band has only the page text below it to land on, so covering a line of it (briefly, while hovering) costs little next to drifting away.
  const onBand = !!el?.closest?.('#legalBand'),
    avoidCost = (q) => avoid.reduce((a, o) => a + (hit(q, o, 0) ? (onBand ? 60 : 20) * o.w : 0), 0);
  const ax = root?.querySelector('.xaxis, g.axis')?.getBoundingClientRect();
  const hit = (a, b, pad = 3) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  const mid = (r.top + r.bottom) / 2,
    cx = (r.left + r.right) / 2;
  const H = 3 * G,
    // On the dense strip chart the card prefers the space above or below the whole chart (outside every row), so it hides no row.
    outside =
      near && root
        ? (({ top, bottom }) => [
            [cx - cw / 2, top - ch - 8],
            [cx - cw / 2, bottom + 8],
          ])(root.getBoundingClientRect())
        : [],
    below = [cx - cw / 2, r.bottom + 10],
    above = [cx - cw / 2, r.top - ch - 10],
    cands = [
      ...outside,
      ...(near ? [] : mid < VH / 2 ? [below, above] : [above, below]),
      [r.right + G, mid - ch / 2],
      [r.left - cw - G, mid - ch / 2],
      [cx - cw / 2, r.top - ch - G],
      [cx - cw / 2, r.bottom + G],
      [r.right + G, r.top - 8],
      [r.left - cw - G, r.top - 8],
      [r.right + G, r.bottom - ch + 8],
      [r.left - cw - G, r.bottom - ch + 8],
      [r.right + H, mid - ch / 2],
      [r.left - cw - H, mid - ch / 2],
      [cx - cw / 2, r.top - ch - H],
      [cx - cw / 2, r.bottom + H],
      [cx + G, r.top - ch - G],
      [cx - cw - G, r.top - ch - G],
      [cx + G, r.bottom + G],
      [cx - cw - G, r.bottom + G],
    ].map(([l, tp], i) => {
      const L = Math.min(Math.max(8, l), VW - cw - 8),
        T = Math.min(Math.max(TOP, tp), VH - ch - 8),
        q = { left: L, right: L + cw, top: T, bottom: T + ch };
      const score =
        others.filter((o) => hit(q, o)).length * WM +
        noText.filter((o) => hit(q, o)).length * 100 +
        avoidCost(q) +
        (ax && hit(q, ax, 2) ? (near ? 60 : onBand ? 45 : 18) : 0) +
        (hit(q, r, 6) ? 120 : 0) +
        (near ? 0 : gapTo(q) / (onBand ? 2 : 4) + Math.max(0, gapTo(q) - 120) / 2) +
        Math.abs(L - l) / 40 +
        Math.abs(T - tp) / 40 +
        i * 0.1;
      return { L, T, score };
    });
  let best = cands.reduce((a, b) => (b.score < a.score ? b : a));
  if (best.score >= (near ? 14 : onBand ? 80 : 40) || (near && avoid.some((o) => hit({ left: best.L, right: best.L + cw, top: best.T, bottom: best.T + ch }, o, 0))) || noText.some((o) => hit({ left: best.L, right: best.L + cw, top: best.T, bottom: best.T + ch }, o))) {
    // every side placement covers something: search the viewport for the nearest spot that covers no mark, annotation or axis
    for (let T = TOP; T <= VH - ch - 8; T += 5)
      for (let L = 8; L <= VW - cw - 8; L += 10) {
        const q = { left: L, right: L + cw, top: T, bottom: T + ch };
        const score =
          others.filter((o) => hit(q, o)).length * WM +
          noText.filter((o) => hit(q, o)).length * 100 +
          avoidCost(q) +
          (ax && hit(q, ax, 2) ? (near ? 60 : onBand ? 45 : 18) : 0) +
          (hit(q, r, 12) ? 120 : 0) +
          (near ? Math.hypot(L + cw / 2 - cx, T + ch / 2 - mid) / 15 : gapTo(q) / 4) +
          0.5;
        if (score < best.score) best = { L, T, score };
      }
  }
  card.style.left = best.L + 'px';
  card.style.top = best.T + 'px';
  // a small tail on the edge nearest the mark points at it
  const tail = document.createElement('i');
  tail.className = 'ctail';
  tail.setAttribute('aria-hidden', 'true');
  const isBelow = best.T >= r.bottom - 2,
    isAbove = best.T + ch <= r.top + 2,
    isSide = !isBelow && !isAbove;
  if (isBelow || isAbove) {
    tail.dataset.edge = isBelow ? 't' : 'b';
    tail.style.left = Math.min(Math.max(cx - best.L, 18), cw - 18) + 'px';
  } else if (isSide) {
    tail.dataset.edge = best.L >= r.right - 2 ? 'l' : 'r';
    tail.style.top = Math.min(Math.max(mid - best.T, 18), ch - 18) + 'px';
  }
  if (tail.dataset.edge && (isBelow || isAbove ? Math.abs((isBelow ? best.T - r.bottom : r.top - (best.T + ch))) < 60 : Math.abs(best.L >= r.right - 2 ? best.L - r.right : r.left - (best.L + cw)) < 60)) card.appendChild(tail);
}
// A docked (phone) card is capped in height and scrolls inside itself; while more text lies below the fold a visible cue says so.
function dockCue() {
  const b = card.querySelector('.cbody');
  card.classList.toggle('more', !!b && b.scrollHeight - b.clientHeight - b.scrollTop > 6);
}
card.addEventListener('scroll', dockCue, { passive: true, capture: true }); // scroll does not bubble: capture it from the .cbody
let touchMode = false,
  shownY = 0;
// Any card goes away when the page scrolls under it (a fixed card would otherwise hang over the wrong thing), when the window loses focus, and on Escape
// (boot.js). A touch card also goes with a tap outside it.
addEventListener(
  'scroll',
  () => {
    if (card.classList.contains('on') && Math.abs(scrollY - shownY) > ((touchMode || card.classList.contains('dock')) ? 24 : 4)) hideCard();
  },
  { passive: true },
);
addEventListener('blur', () => hideCard());
document.addEventListener('visibilitychange', () => document.hidden && hideCard());
document.addEventListener(
  'pointerdown',
  (e) => {
    touchMode = e.pointerType === 'touch';
    if (touchMode && !e.target.closest('.mark') && !e.target.closest('#card')) hideCard();
  },
  true,
);
card.addEventListener('click', () => {
  if (card.classList.contains('dock')) hideCard();
});
export function hideCard() {
  cardEl = null;
  card.classList.remove('on');
  card.setAttribute('aria-hidden', 'true');
}
// ---------------------------------------------------------------- card content
// The line that offers the 3D explainer, with the cube icon from the page's icon set. Every card builder uses it.
export const hint3d = (what = 'the 3D explainer') =>
  `<div class="hint"><svg class="ico" aria-hidden="true"><use href="#i-cube"/></svg>Select to open ${what}</div>`;
const srcLine = (r) => `<div class="src"><b>Source</b> ${esc(r.source)}, ${esc(r.pin)}</div>`;
const ALT_KIND = { intercept: 'intercept', apogee: 'its highest point', detonation: 'detonation' };
const CONFIDENCE = { high: 'High', medium: 'Medium', low: 'Low' };
// What each kind of test was, in everyday words (the data stores a code; cards, the table and screen-reader labels all use these).
export const KIND_PLAIN = {
  destructive: 'Destroyed a satellite',
  non_destructive: 'Test that did not destroy its target',
  flyby: 'Passed a satellite without hitting it',
  midcourse_intercept: 'Intercepted a ballistic missile in flight',
  nuclear: 'Nuclear explosion in space',
  apogee_only: 'Flew to its highest point with no target',
};
// "None" and "None known" are stored values; the card says it in words.
export const targetWords = (t) => (/^none known$/i.test(t) ? 'No target known' : /^none$/i.test(t) ? 'No target' : t.replace(/^None \(/, 'No target ('));
export function kinCard(e) {
  const debris =
    e.type === 'destructive'
      ? `<dt>Debris</dt><dd>${num(e.fragments_cataloged)} fragments cataloged; ${num(e.fragments_in_orbit)} still in orbit (as of ` +
        `${fmtMY(parse(e.fragments_as_of + '-01'))})</dd>`
      : '';
  const alt = e.altitude_km == null ? 'Not reported' : `${num(e.altitude_km)} km at ${ALT_KIND[e.altitude_kind] || e.altitude_kind}`;
  const mdo =
    e.id === 'us-2008-burnt-frost'
      ? '<p class="note">A missile-defense interceptor (SM-3) used against a satellite: this is where missile defense and anti-satellite weapons overlap.</p>'
      : '';
  return (
    `<p class="card-title">${esc(e.system)}</p><p class="when">${esc(e.state)} · ${fmtD(e)}</p><dl><dt>Target</dt><dd>${esc(targetWords(e.target))}</dd>` +
    `<dt>What happened</dt><dd>${KIND_PLAIN[e.type]}</dd><dt>Altitude</dt><dd>${alt}</dd>${debris}<dt>How sure we are</dt>` +
    `<dd>${CONFIDENCE[e.confidence] || e.confidence}</dd></dl>${mdo}${srcLine(e)}${hasScene(e) ? hint3d() : ''}`
  );
}
import { nkCard, coWhen, coCard } from './cards2.js';
export { nkCard, coWhen, coCard };
// What kind of legal item this is, in words (the data stores it as a code; the draft treaties share the "negotiation_span" code with the bars).
export const LEGAL_KIND = {
  treaty: 'Treaty',
  resolution: 'Resolution or finding (not binding)',
  unilateral: 'Pledge by one country',
  veto: 'Veto in the UN Security Council',
  draft: 'Draft treaty put forward',
  span: 'Negotiation period',
};
export const legalKindOf = (l) => (l.soft_law ? 'soft' : l.kind === 'negotiation_span' ? (l.end || l.id === 'paros-1981' ? 'span' : 'draft') : l.kind);
export const legalKindWords = (l) => (l.soft_law ? 'Soft law (expert manual, not binding)' : LEGAL_KIND[legalKindOf(l)] || l.kind);
// A web address in a citation becomes a link named for the publisher (a raw address is long and says nothing).
const PUBLISHERS = { 'history.state.gov': 'Office of the Historian', 'treaties.unoda.org': 'UN Office for Disarmament Affairs', 'www.itu.int': 'ITU', 'www.icao.int': 'ICAO', 'press.un.org': 'UN Meetings Coverage' };
const citeHtml = (text) =>
  esc(text).replace(/https?:\/\/[^\s<]+/g, (m) => {
    const trail = (m.match(/[.,;)]+$/) || [''])[0],
      url = m.slice(0, m.length - trail.length);
    let host = '';
    try {
      host = new URL(url.replace(/&amp;/g, '&')).hostname;
    } catch (e) {
      /* leave the host empty */
    }
    return `<a href="${url}" target="_blank" rel="noopener">${PUBLISHERS[host] || host.replace(/^www\./, '') || 'Source'}</a>${trail}`;
  });
export function legalCard(l) {
  const when = l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : fmt(parse(l.start));
  return (
    `<p class="card-title">${esc(l.title || l.label)}</p><p class="when">${legalKindWords(l)} · ${when}</p><p>${esc(l.short_note)}</p>` +
    `<div class="src">${citeHtml(l.citation)}</div>${hasScene(l) ? hint3d('the related 3D explainer') : ''}`
  );
}
// Keyboard modality: while the user navigates with keys, a mouse hover never replaces the card of the focused mark;
// the card always belongs to the focused mark.
let kbd = false,
  cardEl = null;
document.addEventListener(
  'keydown',
  (e) => {
    if (e.key.startsWith('Arrow') || e.key === 'Tab' || e.key === 'Home' || e.key === 'End') kbd = true;
  },
  true,
);
document.addEventListener(
  'pointermove',
  () => {
    kbd = false;
  },
  true,
);
const focusedMark = () => {
  const a = document.activeElement;
  return a?.classList?.contains('mark') && a.matches(':focus-visible') ? a : null;
};
export function bindMark(sel, cardFn, onActivate) {
  if (EXPORTING) return;
  sel
    .attr('tabindex', 0)
    .on('click', function (ev, d) {
      onActivate(d, this, ev);
    })
    .on('keydown', function (ev, d) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        onActivate(d, this, ev);
      }
      if (ev.key === 'Escape') {
        hideCard();
      }
    });
  if (!cardFn) return; // cardless marks (phone strip) label themselves inline instead
  sel
    .on('mouseenter', function (ev, d) {
      if (kbd) return;
      cardEl = this;
      showCard(cardFn(d), ev, this);
    })
    .on('mouseleave', function (ev, d) {
      if (touchMode) return;
      const f = focusedMark();
      if (f && f !== this && f.__card) {
        cardEl = f;
        showCard(f.__card(), null, f);
      } else if (cardEl === this) hideCard();
    })
    .on('focus', function (ev, d) {
      this.__card = () => cardFn(d);
      cardEl = this;
      showCard(cardFn(d), ev, this);
      // The browser scrolls a focused mark into view after this handler runs: place the card again once it has, so it sits by the mark and not where the mark used to be.
      const me = this;
      requestAnimationFrame(() => {
        if (cardEl === me && document.activeElement === me) showCard(cardFn(d), null, me);
      });
    })
    .on('blur', function () {
      if (!touchMode && cardEl === this) hideCard();
    });
}
// Live region for cards: pressing Enter on a mark that has no 3D scene re-opens its full card and reads it out.
const live = Object.assign(document.createElement('div'), { id: 'cardLive', className: 'sr' });
live.setAttribute('role', 'status');
live.setAttribute('aria-live', 'polite');
document.body.appendChild(live);
// The card as one reading: each term is followed by its value, and the 3D line is left out.
function cardSpeech() {
  const c = card.cloneNode(true);
  c.querySelectorAll('.hint, .ack-line').forEach((n) => n.remove());
  c.querySelectorAll('dt').forEach((n) => (n.textContent += ': '));
  c.querySelectorAll('.card-title, h4, .when, dd, p, .src, .note').forEach((n) => (n.textContent += '. '));
  return c.textContent.replace(/\s+/g, ' ').trim();
}
function announceCard() {
  const say = cardSpeech();
  live.textContent = '';
  setTimeout(() => (live.textContent = `Details shown. ${say} There is no 3D explainer for this item.`), 60);
}
const cardFor = (d, full) => (d.domain === 'kinetic' ? kinCard(d) : d.domain === 'co_orbital' ? coCard(d, !full) : d.domain ? nkCard(d) : legalCard(d));
export const activate = (d, el, ev) => {
  if (hasScene(d)) {
    hideCard();
    hooks.openScene(d.scene_3d, el);
    return;
  }
  // No scene: show the full card with a visible confirmation line at its top; announceCard() reads it out.
  showCard(
    '<div class="ack-line"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>Details shown. No 3D explainer for this item.</div>' +
      cardFor(d, true),
    ev,
    el,
    true,
  );
  cardEl = el;
  announceCard();
};
// For charts whose marks are neither events nor laws (the pair rows of the last chart): the same card shell, opened and read out like the others.
export function openCard(html, ev, el) {
  showCard(html, ev, el, true);
  cardEl = el;
  announceCard();
}

// In-page links: draw the lazily drawn charts first, so the heights above the target are final and the jump lands on the heading (not 600 px off).
document.addEventListener(
  'click',
  (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1 && a.getAttribute('href') !== '#legalBand') hooks.drawRest?.();
  },
  true,
);

// ---------------------------------------------------------------- shared guide line
export const guides = [];
export function setGuide(date) {
  guides.forEach((g) => g(date));
}
export function addGuide(svg, x, y0, y1, key) {
  if (EXPORTING) return;
  const line = svg.append('line').attr('class', 'guide').attr('y1', y0).attr('y2', y1).style('display', 'none');
  const at = key ? guides.findIndex((g) => g.key === key) : -1,
    fn = key ? (f) => ((f.key = key), f) : (f) => f;
  const [r0, r1] = x.range();
  guides[at < 0 ? guides.length : at] = fn((date) =>
    date && x(date) >= r0 - 1 && x(date) <= r1 + 1 ? line.attr('x1', x(date)).attr('x2', x(date)).style('display', null) : line.style('display', 'none'),
  );
}
export function handoff(svg, x, y0, y1, label, anchorTop, ty) {
  const X = x(parse(LAST_DA));
  const g = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  g.append('line').attr('x1', X).attr('x2', X).attr('y1', y0).attr('y2', y1);
  if (label)
    g.append('text')
      .attr('x', X - 5)
      .attr('y', ty ?? (anchorTop ? y0 + 10 : y1 - 6))
      .attr('text-anchor', 'end')
      .text(label);
  return g;
}

// Roving tabindex: a chart's marks become ONE tab stop; arrow keys move in chronological order.
export function rove(sel) {
  if (EXPORTING) return;
  const nodes = sel.nodes().sort((a, b) => (+a.dataset.t || 0) - (+b.dataset.t || 0));
  nodes.forEach((n, i) => n.setAttribute('tabindex', i ? -1 : 0));
  // One short hint, shown at the foot of the window while a mark has focus, and read out after the mark's own name.
  const box = nodes[0]?.closest('.svgbox, #legalBand, #legalZoomBox');
  if (box) {
    const hid = 'kh-' + (box.id || 'chart');
    let h = document.getElementById(hid);
    if (!h) {
      document.body.insertAdjacentHTML('beforeend', `<p class="kbd-hint" id="${hid}" aria-hidden="false">Arrow keys move between points. Enter opens details. Escape closes a card. Tab leaves the chart.</p>`);
      h = document.getElementById(hid);
    }
    nodes.forEach((n) => n.setAttribute('aria-describedby', hid));
  }
  nodes.forEach((n, i) => {
    n.addEventListener('keydown', (ev) => {
      const k = ev.key;
      let j = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = Math.min(nodes.length - 1, i + 1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = Math.max(0, i - 1);
      else if (k === 'Home') j = 0;
      else if (k === 'End') j = nodes.length - 1;
      if (j != null) {
        ev.preventDefault();
        nodes[j].focus();
      }
    });
    n.addEventListener('focus', () => nodes.forEach((m) => m.setAttribute('tabindex', m === n ? 0 : -1)));
  });
}

// ---------------------------------------------------------------- write-once DOM (keys and tables do not depend on layout)
const written = new Map();
function setOnce(id, html) {
  if (written.get(id) === html) return;
  written.set(id, html);
  document.getElementById(id).innerHTML = html;
}
// Key builder: legend('legendA', 22, 18).group('Kind of test').item(svgInner, text[, w]).raw(html).done()
// Without .group() the items form one plain row of swatch-and-name pairs; with it each group is a line led by a small eyebrow label.
export function legend(id, w = 22, h = 16) {
  const groups = [{ name: null, items: [] }],
    api = {
      group: (name) => (groups.push({ name, items: [] }), api),
      item: (inner, text, iw = w) => (
        groups
          .at(-1)
          .items.push(
            `<li><svg width="${iw}" height="${h}" viewBox="${-iw / 2} ${-h / 2} ${iw} ${h}" aria-hidden="true">${inner}</svg><span>${text}</span></li>`,
          ),
        api
      ),
      raw: (html) => (groups.at(-1).items.push(html), api),
      done: () =>
        setOnce(
          id,
          groups
            .map((g) =>
              g.name == null ? g.items.join('') : `<li class="kgroup"><span class="kname">${g.name}</span><ul class="kitems">${g.items.join('')}</ul></li>`,
            )
            .join(''),
        ),
    };
  return api;
}

// ---------------------------------------------------------------- data tables
// Source link for a table entry. On a wide screen the visible text is short (source and the PDF page); on a phone the full page reference shows.
// The link's own name carries the source, the page reference, the table and the entry, so every link in a table is distinct for a screen reader.
const SRC_TABLE = { tableA: 'anti-satellite tests', tableC: 'jamming, laser and cyber operations', tableR: 'close approaches' };
function shortPin(pin) {
  const first = String(pin).split(';')[0];
  const t = first.match(/^(Table [\d.-]+|Section [\d.]+)/),
    pg = first.match(/PDF p\. [\d-]+/);
  if (t && pg) return `${t[1]}, ${pg[0]}`;
  if (pg) return pg[0];
  const cut = first.length > 40 ? first.slice(0, 40).replace(/[\s,;(]+\S*$/, '') + '...' : first; // long free-text pins: the full page reference stays in the link name and the title
  return cut;
}
// A value that repeats on nearly every row shows as a dash; screen readers still hear it, and the cards on small screens leave it out.
export const quiet = (full) => `<span class="qc"><span aria-hidden="true">\u2013</span><span class="sr">${esc(full)}</span></span>`;
export const srcCell = (r, tableId, entry) => {
  const tn = SRC_TABLE[tableId] || 'data',
    label = `${r.source}, ${r.pin}. Source for the ${tn} table, ${entry}`;
  const shown = r.source.length > 34 ? r.source.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : r.source;
  return `<span class="srcc"><a href="${esc(r.source_url)}" target="_blank" rel="noopener" aria-label="${esc(label)}" title="${esc(r.source)}">${esc(shown)}</a><span class="pin-s" title="${esc(r.pin)}">, ${esc(shortPin(r.pin)).replace(/(Table [\d.-]+|Section [\d.]+|PDF p\. [\d-]+)/g, '<span class="nw">$1</span>')}</span><span class="pin-f">, ${esc(r.pin)}</span></span>`;
};
// Accessible data table. Each cell carries data-label so CSS can stack entries as cards on phones (no sideways scrolling). Columns whose cells are
// all numbers are right-aligned; date columns never wrap on a wide screen.
const CAPTIONS = {
  tableA: 'Anti-satellite tests, one line per test',
  tableB: 'States holding each capability, by decade',
  tableC: 'Jamming, laser and cyber operations, one line per event or campaign',
  tableR:
    'Close approaches in orbit: rendezvous and proximity operations, dockings, a capture and tow, releases and spaceplane missions, one line per operation',
  tableL: 'Each capability and the later legal step linked to it, with the time between them',
  tableLegal: 'Law and policy items, with the short names used on the timeline',
};
const isNumber = (c) => typeof c === 'number' || (typeof c === 'string' && /^-?[\d,]+(\.\d+)?$/.test(c));
export function table(id, head, rows, caption = CAPTIONS[id], hiddenLast = false) {
  const kind = head.map((h, i) =>
    /date|^(start|end|when)$/i.test(h)
      ? 'date'
      : rows.some((r) => isNumber(r[i])) && rows.every((r) => r[i] == null || r[i] === '—' || r[i] === '' || isNumber(r[i]))
        ? 'num'
        : '',
  );
  // hiddenLast: the last column is kept in the markup but never shown or read out (the last chart keeps its record ids there for tools/qa.mjs).
  const hide = (i) => (hiddenLast && i === head.length - 1 ? ' hidden' : '');
  const cell = (c, i) =>
    `<td${kind[i] ? ` class="${kind[i]}"` : ''}${hide(i)} data-label="${esc(String(head[i]).replace(/<[^>]*>/g, ''))}">${typeof c === 'string' && (c.startsWith('<a') || c.startsWith('<span class="srcc"') || c.startsWith('<span class="cnt-line"') || c.startsWith('<span class="tl"') || c.startsWith('<span class="qc"')) ? c : esc(c)}</td>`;
  const tr = (r) => `<tr>${r.map(cell).join('')}</tr>`;
  const cap = caption ? `<caption>${esc(caption)}</caption>` : '';
  const th = head.map((h, i) => `<th scope="col"${kind[i] ? ` class="${kind[i]}"` : ''}${hide(i)}>${h}</th>`).join('');
  const host = document.getElementById(id);
  if (host && !host.hasAttribute('role')) {
    host.setAttribute('role', 'region');
    host.setAttribute('tabindex', '0');
    host.setAttribute('aria-label', `${caption || 'Data table'} (scrolls)`);
  }
  setOnce(id, `<table>${cap}<thead><tr>${th}</tr></thead><tbody>${rows.map(tr).join('')}</tbody></table>`);
  let hint = host?.parentElement.querySelector(':scope > .scroll-hint');
  if (host && !hint && !host.closest('.only-phone')) {
    host.insertAdjacentHTML('beforebegin', '<p class="scroll-hint">Scroll sideways to see more columns.</p>');
    hint = host.previousElementSibling;
    const check = () => hint.classList.toggle('on', host.scrollWidth > host.clientWidth + 2);
    host.closest('details')?.addEventListener('toggle', check);
    addEventListener('resize', check);
  }
  hint?.classList.toggle('on', host.scrollWidth > host.clientWidth + 2);
  // keyboard users can step over a long table of links
  const det = host?.closest('details');
  if (det && !det.querySelector('.skip-table') && rows.length > 12) {
    det.insertAdjacentHTML('beforeend', `<span id="after-${id}" tabindex="-1"></span>`);
    host.insertAdjacentHTML('beforebegin', `<a class="skip-table" href="#after-${id}">Skip this table</a>`);
  }
  // On a phone each row is a tall card, so a long list starts with its first 10 and a button shows the rest (CSS hides the extra rows on phones only).
  if (host && rows.length > 12 && !host.parentElement.querySelector(':scope > .more-rows')) {
    host.classList.add('capped');
    host.insertAdjacentHTML(
      'afterend',
      `<button class="btn small more-rows" type="button" aria-expanded="false" aria-controls="${id}">Show all ${rows.length} entries</button>`,
    );
    const b = host.nextElementSibling;
    b.addEventListener('click', () => {
      const all = host.classList.toggle('capped') === false;
      b.setAttribute('aria-expanded', String(all));
      b.textContent = all ? 'Show first 10 entries' : `Show all ${rows.length} entries`;
    });
  }
  // the disclosure button says how big the table is
  const sum = document.getElementById(id)?.closest('details')?.querySelector(':scope > summary');
  if (sum && !sum.querySelector('.cnt')) sum.insertAdjacentHTML('beforeend', `<span class="cnt">${rows.length} entries</span>`);
}
