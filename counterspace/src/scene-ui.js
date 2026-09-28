// Scene overlay (dialog, scrubber, camera presets) and hero.
// ---------------------------------------------------------------- scenes: host, overlay, hero
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
  document.getElementById('scClose').focus();
}
function closeScene() {
  if (!cur) return;
  cur = null; overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
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
document.getElementById('scExport').onclick = () => {
  if (!cur) return;
  if (host && glOK) download(`scene-${cur.id}.png`, host.stillPNG(cur.title, cur.cite), 'image/png');
  else { const s = view.querySelector('svg'); const xml = new XMLSerializer().serializeToString(s); const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = s.viewBox.baseVal.width * 2; c.height = s.viewBox.baseVal.height * 2; const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height); download(`scene-${cur.id}.png`, c.toDataURL('image/png')); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); }
};
document.getElementById('tourBtn').onclick = e => openScene(ORDER[0].id, e.currentTarget);
overlay.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeScene(); }
  if (e.key === 'Tab') { const f = [...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')]; const i = f.indexOf(document.activeElement);
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

