// ============================================================================
// scene-ui.js: scene overlay (dialog, scrubber, camera presets, still export) and the hero.
// Provides: openScene(), closeScene(), exportStill(), startHero(); owns the single WebGL host.
// ============================================================================
let THREE = null, host = null, glOK = null;
async function getHost() {
  if (REDUCED) return null;
  if (glOK === false) return null;
  try {
    if (!THREE) THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    if (!host) {
      host = new GLHost(THREE);
      // The scrubber mirrors scene time however it changes: playback ticks, scrubbing or programmatic host.update() calls.
      const upd = host.update.bind(host); host.update = t => { upd(t); syncScrub(t); };
    }
    glOK = true; return host;
  } catch (e) { console.warn('WebGL unavailable, using static diagrams', e); glOK = false; return null; }
}
const ORDER = [...SCENES].sort((a, b) => a.date < b.date ? -1 : 1);
const overlay = document.getElementById('overlay'), view = document.getElementById('sceneView');
let cur = null, returnFocus = null, heroSim = null;
async function openScene(id, originEl) {
  const cfg = SCENES.find(s => s.id === id); if (!cfg) return;
  if (!overlay.classList.contains('open')) { returnFocus = originEl || document.activeElement; }
  cur = cfg;
  overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  document.getElementById('sceneTitle').textContent = cfg.title;
  document.getElementById('sceneDate').textContent = `${ORDER.indexOf(cfg) + 1} / ${ORDER.length}`;
  document.getElementById('sceneCaption').textContent = cfg.caption;
  const ev = byId[cfg.event];
  document.getElementById('sceneSrc').innerHTML = `Source: ${esc(cfg.cite)}${ev ? ` · <a href="${esc(ev.source_url)}" target="_blank" rel="noopener">${esc(ev.source)}</a>` : ''}`;
  document.getElementById('sceneScale').textContent = `Illustrative, not orbit-propagated. Radial distances compressed (altitude^0.45); Earth to scale. Earth imagery: NASA Blue Marble (public domain); a vector map is shown if it cannot load. ${REDUCED ? 'Reduced motion is on, so a static diagram is shown.' : ''}`;
  const rel = document.getElementById('scRelated'); rel.disabled = !cfg.related; rel.textContent = cfg.related ? `⚖ Related law: ${byId[cfg.related]?.label}` : '⚖ No specific legal item';
  const sim = buildSim(cfg); const cams = document.getElementById('scCams'); cams.innerHTML = '';
  const h = await getHost();
  view.querySelector(':scope > svg')?.remove();
  if (h) {
    unloadHero();
    h.mount(view); h.load(sim); h.playing = true; setPlayBtn(true);
    sim.cams.forEach((c, i) => { const b = document.createElement('button'); b.className = 'btn small'; b.type = 'button'; b.textContent = c.name; b.onclick = () => h.setCam(i); cams.appendChild(b); });
    h.play(); syncScrub(h.t);
  } else {
    renderSVG(sim, view);
  }
  staticMode(!h);
  setInert(true); setStatus(`Scene ${ORDER.indexOf(cfg) + 1} of ${ORDER.length}: ${cfg.title}. ${h ? 'Playing.' : ''}`.trim());
  document.getElementById('scClose').focus();
}
// While the dialog is open the page behind it is inert (no focus, not read out).
function setInert(on) { document.querySelectorAll('header.top, main, footer, #card').forEach(n => { n.inert = on; }); }
function closeScene() {
  if (!cur) return;
  cur = null; setInert(false); setStatus(''); overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  if (host) { host.unload(); }
  view.querySelector(':scope > svg')?.remove();
  startHero();
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus(); else { const m = document.querySelector(`[data-id="${returnFocus?.dataset?.id}"]`); m?.focus(); }
}
const scrub = document.getElementById('scScrub'), scTime = document.getElementById('scTime');
function syncScrub(t) {
  if (!cur) return;
  const v = Math.max(0, Math.min(1, t)), dur = cur?.duration || 0;
  scrub.value = Math.round(v * 1000); scrub.setAttribute('aria-valuetext', `${(v * dur).toFixed(1)} of ${dur} seconds`);
  scTime.textContent = `${(v * dur).toFixed(1)} / ${dur} s`;
}
// Static diagrams (reduced motion, no WebGL) have no timeline: hide Play, the scrubber and the camera presets.
function staticMode(on) {
  ['scPlay', 'scScrub', 'scTime', 'scCams'].forEach(id => { document.getElementById(id).hidden = on; });
  document.getElementById('scStatic').hidden = !on;
  if (!on) setPlayBtn(true);
}
scrub.oninput = () => { if (host && cur && !scrub.hidden) { host.playing = false; setPlayBtn(false); host.update(scrub.value / 1000); } };
function setPlayBtn(on) { const b = document.getElementById('scPlay'); b.setAttribute('aria-pressed', on); b.textContent = on ? '❚❚ Pause' : '▶ Play'; b.disabled = false; }
document.getElementById('scPlay').onclick = () => { if (!host || !cur || scrub.hidden) return; host.playing = !host.playing; if (host.playing && host.t >= 1) host.t = 0; setPlayBtn(host.playing); };
document.getElementById('scClose').onclick = closeScene;
document.getElementById('scPrev').onclick = () => { const i = ORDER.indexOf(cur); openScene(ORDER[(i - 1 + ORDER.length) % ORDER.length].id); };
document.getElementById('scNext').onclick = () => { const i = ORDER.indexOf(cur); openScene(ORDER[(i + 1) % ORDER.length].id); };
document.getElementById('scRelated').onclick = () => {
  const id = cur?.related; if (!id) return; closeScene();
  const m = document.querySelector(`#legalSvg [data-id="${id}"]`); if (!m) return;
  document.getElementById('legalBand').scrollIntoView({ block: 'nearest' });
  m.classList.add('hl', 'flash-hl'); m.focus(); setGuide(parse(byId[id].start));
  setTimeout(() => { m.classList.remove('hl', 'flash-hl'); }, 3500);
};
// Still export. WebGL scenes use the host's renderer; static diagrams are rasterised from their SVG at print width (3000 px) with header and footer bands.
const PRINT_W = 3000;
// Same layout as the live still (GLHost.stillPNG): header band with the "illustrative" banner, the diagram, then a footer band with
// the title, the source and the imagery credit on separate lines. Sizes are in units of PRINT_W / 1000.
function svgToPNG(svg, title, cite) {
  return new Promise((resolve, reject) => {
    const vb = svg.viewBox.baseVal, k = PRINT_W / vb.width, xml = new XMLSerializer().serializeToString(svg), img = new Image();
    img.onload = () => {
      const s = PRINT_W / 1000, hb = Math.round(40 * s), fb = Math.round(92 * s), H = Math.round(vb.height * k);
      const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = PRINT_W; c.height = H + hb + fb;
      g.fillStyle = '#060912'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, hb, PRINT_W, H);
      g.fillStyle = '#0b1120'; g.fillRect(0, 0, PRINT_W, hb); g.fillRect(0, hb + H, PRINT_W, fb);
      g.strokeStyle = 'rgba(255,224,138,0.28)'; g.lineWidth = Math.max(1, s); g.beginPath(); g.moveTo(0, hb - 0.5); g.lineTo(PRINT_W, hb - 0.5); g.moveTo(0, hb + H + 0.5); g.lineTo(PRINT_W, hb + H + 0.5); g.stroke();
      g.textBaseline = 'middle'; g.fillStyle = '#ffe08a'; g.font = `600 ${Math.round(14 * s)}px system-ui,sans-serif`;
      g.fillText('Illustrative static diagram, not orbit-propagated · compressed radial scale', 16 * s, hb / 2);
      g.fillStyle = '#e9edf7'; g.font = `600 ${Math.round(22 * s)}px system-ui,sans-serif`; g.fillText(title, 16 * s, hb + H + 24 * s);
      const fit = (txt, px, y) => { let f = Math.round(px * s); g.font = `${f}px system-ui,sans-serif`; while (g.measureText(txt).width > PRINT_W - 32 * s && f > 10 * s) { f -= 0.5 * s; g.font = `${f}px system-ui,sans-serif`; } g.fillStyle = '#c3cbe0'; g.fillText(txt, 16 * s, y); };
      fit(`Source: ${String(cite || '').trim().replace(/[.;,\s]+$/, '')}.`, 15, hb + H + 54 * s);
      fit('Vector land map: Natural Earth (public domain).', 15, hb + H + 77 * s);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('The diagram could not be rasterised'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
}
async function exportStill() {
  if (!cur) return null;
  if (host && glOK) return host.stillPNG(cur.title, cur.cite);
  const svg = view.querySelector(':scope > svg'); if (!svg) throw new Error('No diagram to export');
  return svgToPNG(svg, cur.title, cur.cite);
}
function setStatus(msg) { document.getElementById('scStatus').textContent = msg; }
document.getElementById('scExport').onclick = async () => {
  const c = cur; if (!c) return;
  try { setStatus('Preparing PNG…'); const url = await exportStill(); download(`scene-${c.id}.png`, url, 'image/png'); setStatus('Saved scene-' + c.id + '.png'); }
  catch (e) { setStatus('Export failed: ' + e.message + '. Use your browser’s screenshot tool instead.'); }
};
document.getElementById('tourBtn').onclick = e => openScene(ORDER[0].id, e.currentTarget);
overlay.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeScene(); }
  if (e.key === 'Tab') { const f = [...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],[tabindex="0"]')]; const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
});
overlay.addEventListener('click', e => { if (e.target === overlay) closeScene(); });

// Hero overview uses the same single renderer; it is unloaded whenever a scene opens.
const heroStage = document.getElementById('heroStage');
async function startHero() {
  heroSim = buildSim(HERO);
  const h = await getHost();
  if (cur) return;
  if (h) { heroStage.querySelector('svg')?.remove(); h.mount(heroStage); h.load(heroSim); h.setCam(0); h.playing = true; h.play(); }
  else renderSVG(heroSim, heroStage, 0.2);
}
function unloadHero() { if (host && host.el === heroStage) host.unload(); }

