// ============================================================================
// cards2.js: hover and focus cards for the jamming and cyber chart and the close-approach chart (moved out of ui.js so one person can own them).
// ui.js re-exports these names, so other modules keep importing them from './ui.js'.
// ============================================================================
import { ACTIVITY, ATTR_LABEL, REGIME_CO, REGIME_LABEL, esc, fmt, fmtMY, fmtY, hasScene, parse } from './app.js';
const srcLine = (r) => `<div class="src">Source: ${esc(r.source)}, ${esc(r.pin)}</div>`;
export function nkCard(e) {
  const span = e.end === e.start ? fmt(parse(e.start)) : `${fmtMY(parse(e.start))} – ${e.end ? fmtMY(parse(e.end)) : 'ongoing'}`;
  return (
    `<h4>${esc(e.target_system)}</h4><dl><dt>When</dt><dd>${span}</dd><dt>Actor</dt><dd>${esc(e.actor)}` +
    `</dd><dt>Attribution</dt><dd>${ATTR_LABEL[e.attribution]}</dd><dt>Category</dt><dd>${e.category.replace('_', ' ')}` +
    `</dd><dt>Target</dt><dd>${REGIME_LABEL[e.target_regime]}` +
    `</dd><dt>Use</dt><dd>${e.operational_use ? 'Operational (in conflict)' : 'Test, demonstration or peacetime'}` +
    `</dd><dt>Effect</dt><dd>${esc(e.effect)}</dd><dt>Confidence</dt><dd>${e.confidence}` +
    `</dd></dl>${e.notes ? `<div class="note">${esc(e.notes)}</div>` : ''}${srcLine(e)}` +
    `${hasScene(e) ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>' : ''}`
  );
}
export const coWhen = (e) => {
  const f = e.date_precision === 'month' ? fmtMY : e.date_precision === 'year' ? fmtY : fmt,
    a = f(parse(e.start)),
    b = e.end ? f(parse(e.end)) : null;
  return b === a || e.end === e.start ? a : `${a} – ${b || 'ongoing (SWF, Apr. 2026)'}`;
};
// Compact form (desktop hover on the dense RPO strip): heading plus the key fields only, so the card stays small and hides few neighbouring rows.
// Click or Enter shows the full card (description, notes, source). Phones dock the full card, which scrolls inside itself.
export function coCard(e, compact = false) {
  const hint = hasScene(e)
    ? '<div class="hint">▣ Click, tap or press Enter to open the 3D scene</div>'
    : compact
      ? '<div class="hint">more… click or press Enter</div>'
      : '<div class="hint">A proximity operation is not an attack; SWF’s wording on intent is hedged.</div>';
  const fields =
    `<dt>When</dt><dd>${coWhen(e)}</dd>` +
    (compact ? '' : `<dt>Actor</dt><dd>${esc(e.actor)}</dd>`) + // compact: the lane already names the actor
    `<dt>Activity</dt><dd>${ACTIVITY[e.activity]}</dd>` +
    (compact ? '' : `<dt>Orbit</dt><dd>${REGIME_CO[e.orbit_regime]}</dd>`) +
    `<dt>Confidence</dt><dd>${e.confidence}</dd>`;
  const head = `<h4>${esc(e.system)}${e.target ? ' → ' + esc(e.target) : ''}</h4><dl>${fields}</dl>`;
  if (compact) return head + hint;
  return `${head}<div>${esc(e.description)}</div>${e.notes ? `<div class="note">${esc(e.notes)}</div>` : ''}${srcLine(e)}${hint}`;
}
