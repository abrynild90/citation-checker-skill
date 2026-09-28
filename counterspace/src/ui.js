// ============================================================================
// ui.js: hover/focus card, roving tabindex, shared guide line, write-once DOM helpers.
// Provides: bindMark(), showCard(), rove(), addGuide(), setOnce(), legend().
// ============================================================================
const card = document.getElementById('card');
function showCard(html, evt, el) {
  card.innerHTML = html; card.classList.add('on'); card.setAttribute('aria-hidden', 'false');
  card.classList.toggle('dock', innerWidth < PHONE_MAX);
  card.dataset.touch = touchMode ? '1' : '';
  if (innerWidth < PHONE_MAX) { card.style.left = ''; card.style.top = ''; return; }
  const r = el ? el.getBoundingClientRect() : { left: evt.clientX, right: evt.clientX, top: evt.clientY, bottom: evt.clientY };
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let left = r.right + 12, top = r.top - 8;
  if (left + cw > innerWidth - 8) left = Math.max(8, r.left - cw - 12);
  if (top + ch > innerHeight - 8) top = Math.max(8, innerHeight - ch - 8);
  card.style.left = left + 'px'; card.style.top = top + 'px';
}
let touchMode = false;
document.addEventListener('pointerdown', e => { touchMode = e.pointerType === 'touch'; if (touchMode && !e.target.closest('.mark') && !e.target.closest('#card')) hideCard(); }, true);
card.addEventListener('click', () => { if (card.classList.contains('dock')) hideCard(); });
function hideCard() { card.classList.remove('on'); card.setAttribute('aria-hidden', 'true'); }
const srcLine = r => `<div class="src">Source: ${esc(r.source)}, ${esc(r.pin)}</div>`;
function kinCard(e) {
  const debris = e.type === 'destructive' ? `<dt>Fragments</dt><dd>${num(e.fragments_cataloged)} cataloged · ${num(e.fragments_in_orbit)} still in orbit (as of ${fmtMY(parse(e.fragments_as_of + '-01'))})</dd>` : '';
  const alt = e.altitude_km == null ? 'not reported' : `${num(e.altitude_km)} km (${e.altitude_kind})`;
  const mdo = e.id === 'us-2008-burnt-frost' ? '<div class="hint">Missile-defense interceptor (SM-3) used against a satellite: shows the missile-defense / ASAT overlap.</div>' : '';
  return `<h4>${esc(e.system)} → ${esc(e.target)}</h4><dl><dt>Date</dt><dd>${fmt(parse(e.date))}</dd><dt>State</dt><dd>${esc(e.state)}</dd><dt>Type</dt><dd>${TYPE_LABEL[e.type]}</dd><dt>Altitude</dt><dd>${alt}</dd>${debris}<dt>Confidence</dt><dd>${e.confidence}</dd></dl>${mdo}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`;
}
function nkCard(e) {
  const span = e.end === e.start ? fmt(parse(e.start)) : `${fmtMY(parse(e.start))} – ${e.end ? fmtMY(parse(e.end)) : 'ongoing'}`;
  return `<h4>${esc(e.target_system)}</h4><dl><dt>When</dt><dd>${span}</dd><dt>Actor</dt><dd>${esc(e.actor)}</dd><dt>Attribution</dt><dd>${ATTR_LABEL[e.attribution]}</dd><dt>Category</dt><dd>${e.category.replace('_', ' ')}</dd><dt>Target</dt><dd>${REGIME_LABEL[e.target_regime]}</dd><dt>Use</dt><dd>${e.operational_use ? 'Operational (in conflict)' : 'Test, demonstration or peacetime'}</dd><dt>Effect</dt><dd>${esc(e.effect)}</dd><dt>Confidence</dt><dd>${e.confidence}</dd></dl>${e.notes ? `<div class="note">${esc(e.notes)}</div>` : ''}${srcLine(e)}${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`;
}
function legalCard(l) {
  const when = l.end ? `${fmtY(parse(l.start))}–${fmtY(parse(l.end))}` : fmt(parse(l.start));
  return `<h4>${esc(l.label)}</h4><dl><dt>Date</dt><dd>${when}</dd><dt>Kind</dt><dd>${l.soft_law ? 'Soft law (expert manual, not binding)' : l.kind.replace('_', ' ')}</dd></dl><div>${esc(l.short_note)}</div><div class="src">${esc(l.citation)}</div>${hasScene(l) ? '<div class="hint">▣ Click, tap or press Enter to open the related 3D scene</div>' : ''}`;
}
function bindMark(sel, cardFn, onActivate) {
  if (EXPORTING) return;
  sel.attr('tabindex', 0)
    .on('click', function (ev, d) { onActivate(d, this, ev); })
    .on('keydown', function (ev, d) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onActivate(d, this, ev); } if (ev.key === 'Escape') hideCard(); });
  if (!cardFn) return; // cardless marks (phone strip) label themselves inline instead
  sel.on('mouseenter', function (ev, d) { showCard(cardFn(d), ev, this); })
    .on('mouseleave', () => { if (!touchMode) hideCard(); })
    .on('focus', function (ev, d) { showCard(cardFn(d), ev, this); })
    .on('blur', () => { if (!touchMode) hideCard(); });
}
const activate = (d, el, ev) => { if (hasScene(d)) { hideCard(); openScene(d.scene_3d, el); } else showCard(d.domain ? (d.domain === 'kinetic' ? kinCard(d) : nkCard(d)) : legalCard(d), ev, el); };

// ---------------------------------------------------------------- shared guide line
const guides = [];
function setGuide(date) { guides.forEach(g => g(date)); }
function addGuide(svg, x, y0, y1, key) {
  if (EXPORTING) return;
  const line = svg.append('line').attr('class', 'guide').attr('y1', y0).attr('y2', y1).style('display', 'none');
  const at = key ? guides.findIndex(g => g.key === key) : -1, fn = key ? (f => (f.key = key, f)) : (f => f);
  const rg = x.range(), r0 = rg[0], r1 = rg.at(-1);
  guides[at < 0 ? guides.length : at] = fn(date => date && x(date) >= r0 - 1 && x(date) <= r1 + 1 ? line.attr('x1', x(date)).attr('x2', x(date)).style('display', null) : line.style('display', 'none'));
}
function handoff(svg, x, y0, y1, label, anchorTop) {
  const X = x(parse(LAST_DA));
  const g = svg.append('g').attr('class', 'handoff').attr('aria-hidden', 'true');
  g.append('line').attr('x1', X).attr('x2', X).attr('y1', y0).attr('y2', y1);
  if (label) g.append('text').attr('x', X - 5).attr('y', anchorTop ? y0 + 10 : y1 - 6).attr('text-anchor', 'end').text(label);
}


// Roving tabindex: a chart's marks become ONE tab stop; arrow keys move in chronological order.
function rove(sel) {
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
function legend(id, w = 22, h = 16) {
  const parts = [], api = {
    item: (inner, text, iw = w) => (parts.push(`<li><svg width="${iw}" height="${h}" viewBox="${-iw / 2} ${-h / 2} ${iw} ${h}" aria-hidden="true">${inner}</svg>${text}</li>`), api),
    raw: html => (parts.push(html), api),
    done: () => setOnce(id, parts.join('')),
  };
  return api;
}
