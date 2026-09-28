// SVG export: redraws a chart at fixed desktop width and serialises it.
// ---------------------------------------------------------------- SVG export (rendered fresh at a fixed 1200 px desktop layout, light or dark as displayed)
const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-anchor', 'display', 'paint-order'];
const EXPORT_SPEC = {
  A: { id: 'svgA', draw: () => drawA, title: 'Chart A · Kinetic tests: altitude over time', key: 'Filled circle: destructive intercept at its intercept altitude. Triangle: intercept of a missile (suborbital) target. Ring: apogee, flyby or non-intercept test. Star: nuclear detonation. Dashed bubble: area proportional to cataloged fragments (as of Feb. 2026). Altitude axis is logarithmic; tests with no reported altitude sit in the strip below the axis.' },
  B: { id: 'svgB', draw: () => drawB, title: 'Chart B · Capability diffusion', key: 'Solid: capability demonstrated (tested or used). Hatched: developing or latent. Stack height counts state-capability pairs (a state with two capabilities counts twice). Decades before 2020 are reconstructed by the page builder, not assessed by SWF.' },
  C: { id: 'svgC', draw: () => drawC, title: 'Chart C · Non-kinetic operations', get key() { return (stateC.focus ? 'Axis starts in 1995 because the ledger has no earlier non-kinetic entry (earliest: 1997 MIRACL laser test). ' : '') + 'Bars: sustained campaigns. Points: discrete events. Arrowhead: ongoing. Solid: official or multi-government attribution. Outline: researcher / open-source attribution. Dashed outline: alleged. Attribution is recorded as the source states it.'; } },
  L: { id: 'svgL', draw: () => drawL, title: 'The lag between capability and legal response', key: 'Hexagon: capability milestone. Circle: treaty. Square: resolution or body finding (non-binding). Triangle: unilateral pledge. Open ring: no binding rule yet.' },
  legal: { id: 'legalSvg', draw: () => drawLegal, title: 'Law and policy responses, 1957–2026', key: 'Circle: treaty. Square: resolution or body finding. Triangle: unilateral pledge. Diamond: soft law (expert manual, not binding). Cross: veto. Bars: negotiation spans. Marks that would collide are stacked vertically; each stays at its true date on the axis. ' + ABBR_NOTE },
};
function exportSVG(which) {
  drawRest();
  const spec = EXPORT_SPEC[which]; if (!spec) return '';
  const ns = 'http://www.w3.org/2000/svg', savedGuides = guides.length, EW = 1200;
  FORCE_DESKTOP = true; EXPORTING = true;
  const box = document.createElement('div'); box.className = 'xbox'; box.style.cssText = `position:absolute;left:-99999px;top:0;width:${EW}px`; document.body.appendChild(box);
  try {
    spec.draw()(box);
    const src = box.querySelector('svg'), clone = src.cloneNode(true), a = src.querySelectorAll('*'), b = clone.querySelectorAll('*');
    a.forEach((n, i) => { const cs = getComputedStyle(n); b[i].setAttribute('style', STYLE_PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); b[i].removeAttribute('class'); b[i].removeAttribute('tabindex'); b[i].removeAttribute('role'); });
    clone.querySelectorAll('.hit, [class="hit"]').forEach(n => n.remove());
    clone.querySelectorAll('title').forEach(n => { if (n.parentNode === clone) n.remove(); });
    const vb = clone.getAttribute('viewBox').split(' ').map(Number), bodyCS = getComputedStyle(document.body), fg = bodyCS.color, bg = bodyCS.backgroundColor, muted = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || fg;
    const sans = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif';
    const foot = wrap(spec.key, EW - 32, 10.5).concat(wrap(`Source: Secure World Foundation, Global Counterspace Capabilities: An Open Source Assessment (9th ed., Apr. 2026) and the primary sources cited in the ledger. Data as of ${AS_OF}. Companion to Space Security Law: Governance Beyond the Atmosphere.`, EW - 32, 10.5));
    const HDR = 40, FT = foot.length * 14 + 16, HT = HDR + vb[3] + FT;
    const out = document.createElementNS(ns, 'svg');
    out.setAttribute('xmlns', ns); out.setAttribute('width', EW); out.setAttribute('height', HT); out.setAttribute('viewBox', `0 0 ${EW} ${HT}`); out.setAttribute('role', 'img'); out.setAttribute('aria-label', spec.title);
    const mk = (tag, at, txt) => { const e = document.createElementNS(ns, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); if (txt != null) e.textContent = txt; out.appendChild(e); return e; };
    mk('title', {}, spec.title); mk('desc', {}, spec.key);
    mk('rect', { width: EW, height: HT, style: `fill:${bg}` });
    mk('text', { x: 16, y: 26, style: `fill:${fg};font:600 17px ${sans}` }, spec.title);
    clone.setAttribute('x', 0); clone.setAttribute('y', HDR); clone.setAttribute('width', EW); clone.setAttribute('height', vb[3]); clone.removeAttribute('id');
    out.appendChild(clone);
    foot.forEach((s, i) => mk('text', { x: 16, y: HDR + vb[3] + 18 + i * 14, style: `fill:${muted};font:10.5px ${sans}` }, s));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(out);
  } finally { EXPORTING = false; FORCE_DESKTOP = false; box.remove(); guides.length = savedGuides; }
}
function download(name, data, type) { const a = document.createElement('a'); a.href = data.startsWith('data:') ? data : URL.createObjectURL(new Blob([data], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
document.querySelectorAll('[data-export]').forEach(b => b.onclick = () => download(`counterspace-${b.dataset.export}.svg`, exportSVG(b.dataset.export), 'image/svg+xml'));

