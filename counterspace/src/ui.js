// ============================================================================
// ui.js: hover/focus card, roving tabindex, shared guide line, write-once DOM helpers.
// Provides: bindMark(), showCard(), rove(), addGuide(), setOnce(), legend().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { ACTIVITY, ATTR_LABEL, EXPORTING, LAST_DA, PHONE_MAX, REGIME_CO, REGIME_LABEL, TYPE_LABEL, esc, fmt, fmtD, fmtMY, fmtY, hasScene, num, parse } from './app.js';
import { hooks } from './shared.js';
const card = document.getElementById('card');
function showCard(html, evt, el) {
  card.innerHTML = html; card.classList.add('on'); card.setAttribute('aria-hidden', 'false');
  card.classList.toggle('dock', innerWidth < PHONE_MAX);
  card.dataset.touch = touchMode ? '1' : '';
  if (innerWidth < PHONE_MAX) { card.style.left = ''; card.style.top = ''; return; }
  const r = el ? el.getBoundingClientRect() : { left: evt.clientX, right: evt.clientX, top: evt.clientY, bottom: evt.clientY };
  const cw = card.offsetWidth, ch = card.offsetHeight, G = 14, VW = innerWidth, VH = innerHeight;
  // Smart placement: try right, left, above and below the mark and take the candidate that covers the fewest neighbouring marks and the chart's x axis.
  const root = el?.closest?.('svg'), others = root ? [...root.querySelectorAll('.mark')].filter(n => n !== el).flatMap(n => n.querySelector('.hit') ? [...n.querySelectorAll(':scope > :not(.hit)')].map(c => c.getBoundingClientRect()) : [n.getBoundingClientRect()]) : [];
  root?.querySelectorAll('text.ann, text.ann-sub').forEach(n => others.push(n.getBoundingClientRect()));
  const ax = root?.querySelector('.xaxis')?.getBoundingClientRect();
  const hit = (a, b, pad = 3) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  const mid = (r.top + r.bottom) / 2, cx = (r.left + r.right) / 2;
  const H = 3 * G, cands = [[r.right + G, mid - ch / 2], [r.left - cw - G, mid - ch / 2], [cx - cw / 2, r.top - ch - G], [cx - cw / 2, r.bottom + G], [r.right + G, r.top - 8], [r.left - cw - G, r.top - 8], [r.right + G, r.bottom - ch + 8], [r.left - cw - G, r.bottom - ch + 8],
    [r.right + H, mid - ch / 2], [r.left - cw - H, mid - ch / 2], [cx - cw / 2, r.top - ch - H], [cx - cw / 2, r.bottom + H], [cx + G, r.top - ch - G], [cx - cw - G, r.top - ch - G], [cx + G, r.bottom + G], [cx - cw - G, r.bottom + G]].map(([l, tp], i) => {
    const L = Math.min(Math.max(8, l), VW - cw - 8), T = Math.min(Math.max(8, tp), VH - ch - 8), q = { left: L, right: L + cw, top: T, bottom: T + ch };
    const score = others.filter(o => hit(q, o)).length * 6 + (ax && hit(q, ax, 2) ? 60 : 0) + (hit(q, r, 0) ? 80 : 0) + Math.abs(L - l) / 40 + Math.abs(T - tp) / 40 + i * 0.1;
    return { L, T, score };
  });
  let best = cands.reduce((a, b) => b.score < a.score ? b : a);
  if (best.score >= 6) { // every side placement covers something: search the viewport for the nearest spot that covers no mark, annotation or axis
    for (let T = 8; T <= VH - ch - 8; T += 10) for (let L = 8; L <= VW - cw - 8; L += 10) {
      const q = { left: L, right: L + cw, top: T, bottom: T + ch };
      const score = others.filter(o => hit(q, o)).length * 6 + (ax && hit(q, ax, 2) ? 60 : 0) + (hit(q, r, 0) ? 80 : 0) + Math.hypot(L + cw / 2 - cx, T + ch / 2 - mid) / 60 + 0.5;
      if (score < best.score) best = { L, T, score };
    }
  }
  card.style.left = best.L + 'px'; card.style.top = best.T + 'px';
}
let touchMode = false;
document.addEventListener('pointerdown', e => { touchMode = e.pointerType === 'touch'; if (touchMode && !e.target.closest('.mark') && !e.target.closest('#card')) hideCard(); }, true);
card.addEventListener('click', () => { if (card.classList.contains('dock')) hideCard(); });
export function hideCard() { cardEl = null; card.classList.remove('on'); card.setAttribute('aria-hidden', 'true'); }
const srcLine = r => `<div class="src">Source: ${esc(r.source)}, ${esc(r.pin)}</div>`;
export function kinCard(e) {
  const debris = e.type === 'destructive' ? `<dt>Fragments</dt><dd>${num(e.fragments_cataloged)} cataloged · ${num(e.fragments_in_orbit)} still in orbit (as of ${fmtMY(parse(e.fragments_as_of + '-01'))})</dd>` : '';
  const alt = e.altitude_km == null ? 'not reported' : `${num(e.altitude_km)} km (${e.altitude_kind})`;
  const mdo = e.id === 'us-2008-burnt-frost' ? '<div class="hint">Missile-defense interceptor (SM-3) used against a satellite: shows the missile-defense / ASAT overlap.</div>' : '';
  return `<h4>${esc(e.system)} → ${esc(e.target)}</h4><dl><dt>Date</dt><dd>${fmtD(e)}</dd><dt>State</dt><dd>${esc(e.state)}</dd><dt>Type</dt><dd>${TYPE_LABEL[e.type]}</dd><dt>Altitude</dt><dd>${alt}</dd>${debris}<dt>Confidence</dt><dd>${e.confidence}</dd></dl>${mdo}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`;
}
export function nkCard(e) {
  const span = e.end === e.start ? fmt(parse(e.start)) : `${fmtMY(parse(e.start))} – ${e.end ? fmtMY(parse(e.end)) : 'ongoing'}`;
  return `<h4>${esc(e.target_system)}</h4><dl><dt>When</dt><dd>${span}</dd><dt>Actor</dt><dd>${esc(e.actor)}</dd><dt>Attribution</dt><dd>${ATTR_LABEL[e.attribution]}</dd><dt>Category</dt><dd>${e.category.replace('_', ' ')}</dd><dt>Target</dt><dd>${REGIME_LABEL[e.target_regime]}</dd><dt>Use</dt><dd>${e.operational_use ? 'Operational (in conflict)' : 'Test, demonstration or peacetime'}</dd><dt>Effect</dt><dd>${esc(e.effect)}</dd><dt>Confidence</dt><dd>${e.confidence}</dd></dl>${e.notes ? `<div class="note">${esc(e.notes)}</div>` : ''}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`;
}
export const coWhen = e => { const f = e.date_precision === 'month' ? fmtMY : e.date_precision === 'year' ? fmtY : fmt, a = f(parse(e.start)), b = e.end ? f(parse(e.end)) : null; return b === a || (e.end === e.start) ? a : `${a} – ${b || 'ongoing (SWF, Apr. 2026)'}`; };
export function coCard(e) {
  return `<h4>${esc(e.system)}${e.target ? ' → ' + esc(e.target) : ''}</h4><dl><dt>When</dt><dd>${coWhen(e)}</dd><dt>Actor</dt><dd>${esc(e.actor)}</dd><dt>Activity</dt><dd>${ACTIVITY[e.activity]}</dd><dt>Orbit</dt><dd>${REGIME_CO[e.orbit_regime]}</dd><dt>Confidence</dt><dd>${e.confidence}</dd></dl><div>${esc(e.description)}</div>${e.notes ? `<div class="note">${esc(e.notes)}</div>` : ''}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : '<div class="hint">A proximity operation is not an attack; SWF’s wording on intent is hedged.</div>'}`;
}
export function legalCard(l) {
  const when = l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : fmt(parse(l.start));
  return `<h4>${esc(l.label)}</h4><dl><dt>Date</dt><dd>${when}</dd><dt>Kind</dt><dd>${l.soft_law ? 'Soft law (expert manual, not binding)' : l.kind.replace('_', ' ')}</dd></dl><div>${esc(l.short_note)}</div><div class="src">${esc(l.citation)}</div>${hasScene(l) ? '<div class="hint">▣ Click, tap or press Enter to open the related 3D scene</div>' : ''}`;
}
// Keyboard modality: while the user navigates with keys, a mouse hover never replaces the card of the focused mark; the card always belongs to the focused mark.
let kbd = false, cardEl = null;
document.addEventListener('keydown', e => { if (e.key.startsWith('Arrow') || e.key === 'Tab' || e.key === 'Home' || e.key === 'End') kbd = true; }, true);
document.addEventListener('pointermove', () => { kbd = false; }, true);
const focusedMark = () => { const a = document.activeElement; return a?.classList?.contains('mark') && a.matches(':focus-visible') ? a : null; };
export function bindMark(sel, cardFn, onActivate) {
  if (EXPORTING) return;
  sel.attr('tabindex', 0)
    .on('click', function (ev, d) { onActivate(d, this, ev); })
    .on('keydown', function (ev, d) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onActivate(d, this, ev); } if (ev.key === 'Escape') { hideCard(); } });
  if (!cardFn) return; // cardless marks (phone strip) label themselves inline instead
  sel.on('mouseenter', function (ev, d) { if (kbd) return; cardEl = this; showCard(cardFn(d), ev, this); })
    .on('mouseleave', function (ev, d) { if (touchMode) return; const f = focusedMark(); if (f && f !== this && f.__card) { cardEl = f; showCard(f.__card(), null, f); } else if (cardEl === this) hideCard(); })
    .on('focus', function (ev, d) { this.__card = () => cardFn(d); cardEl = this; showCard(cardFn(d), ev, this); })
    .on('blur', function () { if (!touchMode && cardEl === this) hideCard(); });
}
export const activate = (d, el, ev) => { if (hasScene(d)) { hideCard(); hooks.openScene(d.scene_3d, el); } else showCard(d.domain ? (d.domain === 'kinetic' ? kinCard(d) : d.domain === 'co_orbital' ? coCard(d) : nkCard(d)) : legalCard(d), ev, el); };

// ---------------------------------------------------------------- shared guide line
export const guides = [];
export function setGuide(date) { guides.forEach(g => g(date)); }
export function addGuide(svg, x, y0, y1, key) {
  if (EXPORTING) return;
  const line = svg.append('line').attr('class', 'guide').attr('y1', y0).attr('y2', y1).style('display', 'none');
  const at = key ? guides.findIndex(g => g.key === key) : -1, fn = key ? (f => (f.key = key, f)) : (f => f);
  const [r0, r1] = x.range();
  guides[at < 0 ? guides.length : at] = fn(date => date && x(date) >= r0 - 1 && x(date) <= r1 + 1 ? line.attr('x1', x(date)).attr('x2', x(date)).style('display', null) : line.style('display', 'none'));
}
export function handoff(svg, x, y0, y1, label, anchorTop, ty) {
  const X = x(parse(LAST_DA));
  const g = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  g.append('line').attr('x1', X).attr('x2', X).attr('y1', y0).attr('y2', y1);
  if (label) g.append('text').attr('x', X - 5).attr('y', ty ?? (anchorTop ? y0 + 10 : y1 - 6)).attr('text-anchor', 'end').text(label);
  return g;
}


// Roving tabindex: a chart's marks become ONE tab stop; arrow keys move in chronological order.
export function rove(sel) {
  if (EXPORTING) return;
  const nodes = sel.nodes().sort((a, b) => (+a.dataset.t || 0) - (+b.dataset.t || 0));
  nodes.forEach((n, i) => n.setAttribute('tabindex', i ? -1 : 0));
  nodes.forEach((n, i) => {
    n.addEventListener('keydown', ev => {
      const k = ev.key; let j = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = Math.min(nodes.length - 1, i + 1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = Math.max(0, i - 1);
      else if (k === 'Home') j = 0; else if (k === 'End') j = nodes.length - 1;
      if (j != null) { ev.preventDefault(); nodes[j].focus(); }
    });
    n.addEventListener('focus', () => nodes.forEach(m => m.setAttribute('tabindex', m === n ? 0 : -1)));
  });
}

// ---------------------------------------------------------------- write-once DOM (legends and tables do not depend on layout)
const written = new Map();
function setOnce(id, html) { if (written.get(id) === html) return; written.set(id, html); document.getElementById(id).innerHTML = html; }
// Legend builder: legend('legendA', 22, 18).item(svgInner, text[, w]).raw(html).done()
export function legend(id, w = 22, h = 16) {
  const parts = [], api = {
    item: (inner, text, iw = w) => (parts.push(`<li><svg width="${iw}" height="${h}" viewBox="${-iw / 2} ${-h / 2} ${iw} ${h}" aria-hidden="true">${inner}</svg><span>${text}</span></li>`), api),
    raw: html => (parts.push(html), api),
    done: () => setOnce(id, parts.join('')),
  };
  return api;
}

// ---------------------------------------------------------------- data tables
export const srcCell = r => `<a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source)}</a>, ${esc(r.pin)}`;
// Accessible data table. Each cell carries data-label so CSS can stack rows as cards on phones (no horizontal scroll).
const CAPTIONS = { tableA: 'Chart A data: kinetic counterspace tests, one row per event', tableB: 'Chart B data: states holding each capability, by decade', tableC: 'Chart C data: non-kinetic operations, one row per event or campaign', tableR: 'Co-orbital data: rendezvous and proximity operations, dockings, a capture and tow, releases and spaceplane missions, one row per ledger row', tableL: 'The lag: capability and response dates for each pair', tableLegal: 'Law and policy items with abbreviations' };
export function table(id, head, rows, caption = CAPTIONS[id]) {
  setOnce(id, `<table>${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td data-label="${esc(head[i])}">${typeof c === 'string' && c.startsWith('<a') ? c : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
}

