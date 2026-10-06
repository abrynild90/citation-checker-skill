// ============================================================================
// scenes/gl-host.js: GLHost core: renderer, scene loading, cameras, update loop, playback and disposal (mixins: gl-items, gl-labels, gl-still)
// (ES module: imports what it uses; bundled by esbuild from src/boot.js. Module map in src/scenes/README.md.)
// ============================================================================
import { DEG, IS_PHONE, norm, occluded, scl, sunFor } from './core.js';
import { LABEL, dotCss, fitBanner, pillCss } from './labels.js';
import { ringCanvas, spriteCanvas } from './earth.js';

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- WebGL host (single shared renderer)
export class GLHost {
  constructor(THREE) {
    this.T = THREE;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !IS_PHONE,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_PHONE ? 1.5 : 2));
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    this.target = new THREE.Vector3(0, 0, 0);
    this.t = 0;
    this.playing = true;
    this.raf = 0;
    this.onTick = null;
    this.lock = null;
    this._act = null;
    this._user = false; // the viewer dragged or zoomed: a following camera stays where they put it until they pick a preset
    this._bindDrag();
    this.ro = new ResizeObserver(() => this.resize());
  }
  mount(el) {
    if (this.el) {
      this.ro.unobserve(this.el);
      this.labelLayer?.remove();
    }
    this.el = el;
    el.prepend(this.canvas);
    this.labelLayer = document.createElement('div');
    this.labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    el.appendChild(this.labelLayer);
    this.ro.observe(el);
    fitBanner(el);
    this.resize();
  }
  resize() {
    if (!this.el) return;
    const w = this.el.clientWidth,
      h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Narrow (phone) frames keep about a 1.1:1 horizontal field of view (was 1.5:1): subjects render ~35% larger while the action still fits.
    this.camera.fov = (2 * Math.atan(Math.tan(20 * DEG) * Math.max(1, 1.1 / (w / h)))) / DEG;
    this.camera.updateProjectionMatrix();
    this._viewShift = null;
    this._applyBands();
    this._heroFit();
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.render();
  }
  // Phone: a preset's own note and the status caption are one amber tag, the note joined on top of the caption (same width, shared edge), not two pills.
  _stackTag(on) {
    const h = this.handEl,
      st = this.statusEl;
    if (!h || !st) return;
    this._tagStacked = on;
    for (const e of [h, st]) {
      e.style.minWidth = '';
      e.style.boxSizing = on ? 'border-box' : '';
    }
    if (!on) {
      const vis = h.style.visibility;
      h.style.cssText = this._handCss;
      h.style.visibility = vis;
      st.style.borderTopLeftRadius = st.style.borderTopRightRadius = '';
      return;
    }
    const w = Math.max(h.offsetWidth, st.offsetWidth);
    h.style.minWidth = st.style.minWidth = w + 'px';
    h.style.width = 'max-content';
    h.style.maxWidth = 'calc(100% - 16px)';
    h.style.left = '50%';
    h.style.top = 'auto';
    h.style.transform = 'translateX(-50%)';
    h.style.bottom = st.offsetHeight + 10 + 'px';
    h.style.borderBottomLeftRadius = h.style.borderBottomRightRadius = '0';
    h.style.borderBottomWidth = '0';
    h.style.justifyContent = 'center';
    st.style.borderTopLeftRadius = st.style.borderTopRightRadius = '0';
  }
  // Hero: the camera distance follows the stage aspect so the whole outermost shell (its glow included) stays inside the stage, banner and hint chip
  // clear of it: wide stage = the vertical field of view decides, phone = the horizontal one.
  _heroFit() {
    if (!this.sim?.cfg.spin || (!this.camIdx && this.camIdx !== 0)) return;
    const R = Math.max(1.5, ...this.sim.items.filter((i) => i.kind === 'shell').map((i) => i.r)) * 1.03,
      fv = this.camera.fov * DEG,
      fh = 2 * Math.atan(Math.tan(fv / 2) * this.camera.aspect),
      dFull = Math.max(R / Math.sin(fv * 0.5 * 0.9), R / Math.sin(fh * 0.5 * 0.95)),
      // A wide stage (desktop): the GEO ring, not the whole glow sphere, sets the framing. The ring spans ~82% of the stage width and the shells' spheres
      // run off the top and the bottom together (sides stay inside), so the Earth and the shells fill the stage instead of a 40% column.
      dWide = Math.hypot(R, R / (0.83 * Math.tan(fh / 2))),
      d = this.camera.aspect > 1.7 ? Math.min(dFull, dWide) : dFull,
      p = this.camera.position.clone().sub(this.target);
    p.setLength(d);
    this.camera.position.copy(p.add(this.target));
    this.camera.lookAt(this.target);
  }
  // Reserve room for the banner (top) and the status caption (bottom): the projection centre moves to the middle of the free band, so subjects never
  // sit under the caption.
  _applyBands() {
    if (!this.el) return;
    const w = this.el.clientWidth,
      h = this.el.clientHeight,
      top = w < 520 ? 46 : 36,
      bot = (this.statusEl && this.status ? this.statusEl.offsetHeight : 0) + 14;
    const s = Math.round(Math.max(0, (bot - top) / 2) + (w < 520 ? (this.sim?.cfg.phoneLift ?? 0) : (this.sim?.cfg.lift ?? 0)));
    if (s === this._viewShift) return;
    this._viewShift = s;
    if (s) this.camera.setViewOffset(w, h, 0, s, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }
  load(sim) {
    this.unload();
    const T = this.T,
      S = new T.Scene();
    this.scene = S;
    this.sim = sim;
    this.dyn = [];
    this.labels = [];
    this.obst = [];
    this._lm = {};
    this.ptMats = [];
    this.tubeMats = [];
    this.ringPts = [];
    this.shellRings = [];
    this.trails = [];
    this.beamTex = null;
    this._pt = null;
    // One sun for every picture (SUN_VIEW in core.js), fixed in space: orbiting the camera or turning the hero reveals the night side.
    const sunDir = sunFor(sim.sunRef, sim.cfg.sunView || undefined); // cfg.sunView {az, el}: an opt-in sun direction for a scene
    this.sunDir = sunDir;
    this._buildLights(S, sunDir);
    const root = new T.Group();
    S.add(root);
    this.root = root;
    this._buildSpace(S);
    // Earth: embedded pictures at once, the full-size ones cross-faded in when they arrive; atmosphere glow around it.
    this._buildEarth(root, sunDir);
    this.spriteTex = new T.CanvasTexture(spriteCanvas());
    this.ringTex = new T.CanvasTexture(ringCanvas());
    const col = (c) => new T.Color(c);
    for (const it of sim.items) this._buildItem(it, root, col);
    // Status caption: the label pill in the warm accent, centred at the bottom; it may wrap on a very narrow stage.
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'hlabel';
    this.statusEl.style.cssText =
      pillCss({ warm: true, block: true }) +
      ';left:50%;bottom:10px;top:auto;transform:translateX(-50%);white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 16px)';
    this.labelLayer.appendChild(this.statusEl);
    // Hero: an on-canvas hint that the stage is interactive (fades once the visitor drags it).
    this.chipEl = null;
    if (sim.cfg.spin) {
      const c = document.createElement('div');
      c.className = 'hlabel';
      // the hero stage styles every svg inside it at full size (page.css), so the icon carries its own size
      c.innerHTML =
        '<svg class="ico" aria-hidden="true" style="width:14px;height:14px;flex:none"><use href="#i-rotate"/></svg><span>Drag to turn the Earth</span>';
      c.style.cssText = pillCss() + ';left:50%;bottom:9px;top:auto;transform:translateX(-50%);transition:opacity .3s cubic-bezier(.16,1,.3,1)';
      this.labelLayer.appendChild(c);
      this.chipEl = c;
    }
    // Handover chip: shown while an episode-locked preset has handed the camera to the episode actually on screen.
    this.handEl = document.createElement('div');
    this.handEl.className = 'hlabel';
    this.handEl.style.cssText = pillCss() + ';left:10px;top:' + (this.el.clientWidth < 520 ? 56 : 44) + 'px;transform:none;visibility:hidden';
    this.handDot = document.createElement('i');
    this.handDot.style.cssText = dotCss('#7cc4ff');
    this.handTx = document.createElement('span');
    this.handEl.append(this.handDot, this.handTx);
    this._handCss = this.handEl.style.cssText;
    this._tagStacked = false;
    this.labelLayer.appendChild(this.handEl);
    // Episode chip (cfg.epChip, opt-in): which episode is on screen, in the handover chip's slot, e.g. "Episode 2 of 3: Russia in LEO".
    this.epEl = null;
    if (sim.cfg.epChip && sim.cfg.acts) {
      this.epEl = document.createElement('div');
      this.epEl.className = 'hlabel';
      this.epEl.style.cssText = pillCss() + ';left:10px;top:' + (this.el.clientWidth < 520 ? 56 : 44) + 'px;transform:none;visibility:hidden';
      const d = document.createElement('i');
      d.style.cssText = dotCss('#ffc86b');
      this.epTx = document.createElement('span');
      this.epEl.append(d, this.epTx);
      this.labelLayer.appendChild(this.epEl);
    }
    this.insetEl = null;
    if (sim.cfg.inset) this._makeInset();
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.leaders.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible');
    this.leaders.setAttribute('aria-hidden', 'true');
    this._arrows = null;
    this.labelLayer.prepend(this.leaders);
    this.lock = null;
    this._act = null;
    this.setCam(0, true);
    this.t = 0;
    this.update(0);
  }
  get maxTex() {
    return this.renderer.capabilities.maxTextureSize || 4096;
  }
  _syncShell() {
    for (const r of this.shellRings || []) r.visible = !this.hideShell;
  }
  // Act scenes (cfg.acts): the camera cuts to each act's preset unless the viewer picked one (lock). A locked preset loops its own act.
  pickCam(i) {
    const c = this.sim.cams[i],
      acts = this.sim.cfg.acts;
    this.lock = null;
    this._fbAct = null;
    this._pinned = !!acts && !c.auto && c.act == null; // an episode scene's Wide preset stays put at every t (the acts do not cut away from it)
    if (acts && c.auto) {
      this._act = null;
      this.update(this.t);
      return;
    }
    if (acts && c.act != null) {
      this.lock = c.act;
      this._lockCam = i;
      const a = acts[c.act];
      if (this.t < a.t0 || this.t >= a.t1) {
        this.setCam(i);
        this.update(a.t0 + 0.001);
        return;
      }
    }
    this.setCam(i);
  }
  setCam(i, instant) {
    const c = this.sim.cams[i],
      prev = this._camSeen ? { p: this.camera.position.clone(), l: this.target.clone(), u: this.camera.up.clone() } : null;
    this.camIdx = i;
    this._user = false;
    this.hideShell = !!c.hideShell;
    this._syncShell();
    this.target.set(...(c.look || [0, 0, 0]));
    this.camera.position.set(...c.pos);
    this.camera.up.set(...(c.up || [0, 1, 0]));
    this.camera.lookAt(this.target);
    this._heroFit();
    this._camSeen = true;
    // A view switch during playback glides to the new view (exponential ease-out, 700 ms). Paused scenes, reduced motion and the hero cut instead.
    this._tw = !instant && prev && this.playing && !REDUCED_MOTION && !this.sim.cfg.spin ? { t0: performance.now(), ...prev } : null;
    if (this._tw) this._twLoop();
    this.render();
  }
  // Frames while a view change glides (a playing scene renders anyway; a scene being dragged or paused still needs them).
  _twLoop() {
    cancelAnimationFrame(this._twRaf);
    const step = () => {
      if (!this._tw) return;
      this.render();
      this._twRaf = requestAnimationFrame(step);
    };
    this._twRaf = requestAnimationFrame(step);
  }
  // Camera motion on top of the preset pose: the glide to a newly picked view, and a very slight drift while the scene plays.
  _camMotion() {
    const c = this.sim.cams[this.camIdx],
      tw = this._tw,
      drift = this.playing && !this.dragging && !REDUCED_MOTION && !this.sim.cfg.spin && !this._user && !c?.follow && !this._modelBoost;
    if (!c || this._user || (!tw && !drift)) return;
    const T = this.T,
      cam = this.camera,
      v = c.follow ? c.follow(this.t, cam.aspect) : { pos: c.pos, look: c.look || [0, 0, 0], up: c.up };
    let e = 1;
    if (tw) {
      const f = Math.min(1, (performance.now() - tw.t0) / 700);
      e = f >= 1 ? 1 : (1 - Math.pow(2, -10 * f)) / (1 - Math.pow(2, -10));
      if (f >= 1) this._tw = null;
    }
    const p = (this._cmP ||= new T.Vector3()).set(...v.pos),
      l = (this._cmL ||= new T.Vector3()).set(...v.look),
      u = (this._cmU ||= new T.Vector3()).set(...(v.up || [0, 1, 0]));
    if (tw && e < 1) {
      p.lerpVectors(tw.p, p, e);
      l.lerpVectors(tw.l, l, e);
      u.lerpVectors(tw.u, u, e).normalize();
    }
    if (drift)
      p.sub(l)
        .applyAxisAngle(u, 0.006 * Math.sin(this.t * Math.PI * 2))
        .add(l); // about a third of a degree each way over the scene
    cam.position.copy(p);
    this.target.copy(l);
    cam.up.copy(u);
    cam.lookAt(l);
  }
  // Opt-in (cfg.actFade): a short cross-fade over the cut between two acts of a playing scene, picture and labels together, instead of a hard jump.
  _actFade() {
    if (!this.playing || REDUCED_MOTION || !this.el?.animate) return;
    try {
      const ov = (this._fadeEl ||= Object.assign(document.createElement('div'), {}));
      ov.style.cssText = 'position:absolute;inset:0;background:#05080f;pointer-events:none;opacity:0';
      if (ov.parentNode !== this.el) this.el.insertBefore(ov, this.labelLayer || null);
      ov.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' });
      this.labelLayer?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' });
    } catch (e) {}
  }
  update(t) {
    const T = this.T;
    this.t = t;
    const acts = this.sim.cfg.acts;
    if (acts && this._pinned) {
      // pinned Wide preset: the camera never cuts to an act's camera
    } else if (acts && this.lock == null) {
      let ai = acts.findIndex((a, k) => t >= a.t0 && (t < a.t1 || k === acts.length - 1));
      ai = Math.max(0, ai);
      if (this._act !== ai) {
        const first = this._act == null;
        this._act = ai;
        this.setCam(acts[ai].cam, true);
        if (!first && this.sim.cfg.actFade) this._actFade();
      }
    } else if (acts) {
      // A locked episode preset shows only its own episode. Scrubbed outside it, the camera of the episode actually on screen takes over (so a preset never
      // frames an empty sky under another episode's caption) and the preset returns when the time comes back.
      const a = acts[this.lock],
        last = this.lock === acts.length - 1,
        inside = t >= a.t0 - 1e-6 && (t < a.t1 || last);
      if (!inside) {
        const ai = Math.max(
          0,
          acts.findIndex((q, k) => t >= q.t0 && (t < q.t1 || k === acts.length - 1)),
        );
        if (this._fbAct !== ai) {
          this._fbAct = ai;
          this.setCam(acts[ai].cam);
        }
      } else if (this._fbAct != null) {
        this._fbAct = null;
        this.setCam(this._lockCam);
      }
    }
    if (this.epEl) {
      const ai = Math.max(
          0,
          acts.findIndex((a, k) => t >= a.t0 && (t < a.t1 || k === acts.length - 1)),
        ),
        txt = `Episode ${ai + 1} of ${acts.length}: ${this.sim.cfg.epChip[ai]}`;
      // cfg.epChipMerge (opt-in, phone width): one chip, not two: the episode rides in the "Drawn for illustration" banner (short names from cfg.epChipShort)
      const ban = this.el.clientWidth < 520 && this.sim.cfg.epChipMerge ? this.el.querySelector(':scope > .illus') : null;
      if (ban) {
        let ep = ban.querySelector('.ep-merge');
        if (!ep) {
          ep = document.createElement('span');
          ep.className = 'ep-merge';
          ban.appendChild(ep);
        }
        const mt = ` · ${ai + 1} of ${acts.length}: ${(this.sim.cfg.epChipShort || this.sim.cfg.epChip)[ai]}`;
        if (ep.textContent !== mt) ep.textContent = mt;
        this.epEl.style.visibility = 'hidden';
      } else {
        if (this.epTx.textContent !== txt) this.epTx.textContent = txt;
        this.epEl.style.color = LABEL.text;
        this.epEl.style.visibility = this.lock != null && this._fbAct != null ? 'hidden' : 'visible'; // the handover chip takes the slot while it is shown
      }
    }
    {
      const on = acts && this.lock != null && this._fbAct != null && this.handEl,
        c = this.sim.cfg.cameras?.[this.camIdx],
        tag = !on && c?.tag; // a preset's own note (e.g. "Arm drawn for illustration"): one amber pill with the status caption, as its second line
      this._tagMerge = false;
      this._tagLine = tag ? (this.el.clientWidth < 640 && c.tagShort ? c.tagShort : c.tag) : '';
      if (this.handEl) {
        this.handEl.style.visibility = on ? 'visible' : 'hidden';
        this.handEl.style.color = LABEL.text;
        this.handDot.style.display = '';
        if (on) this.handTx.textContent = 'Showing: ' + (c?.chip || c?.short || c?.name || '');
        if (this._tagStacked) this._stackTag(false);
      }
    }
    // Following presets (a camera fixed to a moving craft, or a dolly that tracks the action) are re-solved for every t.
    const fc = this.sim.cams[this.camIdx];
    if (fc?.follow && !this._user) {
      const v = fc.follow(t, this.camera.aspect);
      this.target.set(...v.look);
      this.camera.position.set(...v.pos);
      this.camera.up.set(...(v.up || [0, 1, 0]));
      this.camera.lookAt(this.target);
    }
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'curve') {
        const pts = it.pts(t),
          a = obj.geometry.attributes.position;
        const n = Math.min(pts.length, a.count);
        for (let k = 0; k < n; k++) a.array.set(pts[k], 3 * k);
        a.needsUpdate = true;
        obj.geometry.setDrawRange(0, n);
        const c = obj.geometry.attributes.color,
          rgb = obj.userData.rgb;
        if (c && rgb) {
          const tailN = it.tail ? Math.max(2, Math.round(it.tail * (it.all.length - 1))) : 0; // capped wake: only the last tailN points show
          for (let k = 0; k < n; k++) {
            const f = n > 1 ? k / (n - 1) : 1,
              cap = tailN ? Math.max(0, 1 - (n - 1 - k) / tailN) : 1;
            c.array.set([rgb.r, rgb.g, rgb.b, (it.uniformA ?? 0.12 + 0.88 * f * f) * cap * (it.wakeOp ?? 1)], 4 * k);
          }
          c.needsUpdate = true;
        }
      } else if (it.kind === 'gtube') {
        obj.visible = it.ref.pts(t).length > 1;
      } else if (it.kind === 'tube') {
        const n = it.ref.pts(t).length;
        if (obj.material.uniforms.uHead && it.ref.fade !== false) obj.material.uniforms.uHead.value = n < 2 ? 0 : Math.min(1, (n - 1) / it.segs);
        obj.geometry.setDrawRange(0, n < 2 ? 0 : Math.round(Math.min(1, (n - 1) / it.segs) * it.segs) * 30);
      } else if (it.kind === 'point') {
        const p = it.pos(t);
        obj.visible = !!p;
        if (p) obj.position.set(...p);
        const ud = obj.userData;
        if (it.shape === 'jammer' && ud.rings)
          ud.rings.forEach((r, k) => {
            const ph = (t * this.sim.cfg.duration * 0.7 + k / 3) % 1;
            r.scale.setScalar(0.012 + 0.11 * ph);
            r.material.opacity = 0.85 * (1 - ph) ** 1.5;
          });
        if (it.orient && p) {
          const o = it.orient(t);
          obj.up.set(...o.up);
          obj.lookAt(p[0] + o.dir[0], p[1] + o.dir[1], p[2] + o.dir[2]);
          ud.oriented = true;
        }
        if (it.shape === 'aircraft' && p) {
          // wings level, nose along the ground track
          const up = new T.Vector3(...norm(p)),
            a2 = it.pos(Math.min(1, t + 0.004)),
            a1 = it.pos(Math.max(0, t - 0.004));
          const f = new T.Vector3(...a2).sub(new T.Vector3(...a1));
          f.addScaledVector(up, -f.dot(up));
          if (f.lengthSq() > 1e-12) {
            f.normalize();
            ud.f = f;
          } else if (!ud.f) {
            ud.f = new T.Vector3(0, 0, 1).addScaledVector(up, -up.z).normalize();
          }
          const side = new T.Vector3().crossVectors(up, ud.f).normalize();
          obj.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side, up, ud.f));
        }
        if (ud.sat && p && !ud.oriented) {
          const q = it.pos(t + 0.002);
          if (q) obj.lookAt(new T.Vector3(...q));
        } // keep solar wings across the orbit track
        if (ud.iss && p) {
          const q = it.pos(t + 0.002);
          if (q) obj.lookAt(new T.Vector3(...q));
        }
        const tint = ud.body ? ud.body.material : ud.tintMat ? ud.tintMat : obj.material;
        if (it.statusColor && tint) {
          const c = it.statusColor(t);
          tint.color.set(c);
          if (ud.halo) ud.halo.material.color.set(c);
        }
        if (it.glow && tint) {
          const on = it.glow(t);
          tint.color.set(on ? '#ffffff' : it.color);
          if (ud.halo) {
            ud.halo.material.color.set(on ? '#ff8cf0' : it.color);
            ud.halo.scale.setScalar(on ? 0.07 + 0.008 * Math.sin(performance.now() / 60) : 0.05);
            ud.halo.material.opacity = on ? 0.65 : 0.3;
          }
        }
      } else if (it.kind === 'cloud') {
        const g = obj.geometry,
          a = g.attributes.position;
        it.fill(t, a.array, it.dynCol ? g.attributes.aCol.array : null);
        a.needsUpdate = true;
        if (it.dynCol) g.attributes.aCol.needsUpdate = true;
        if (it.hideEmpty) obj.visible = it.vis > 0; // opt-in: a cloud with no fragment left is not drawn
        const tr = obj.userData.trail;
        if (tr) {
          const n = it.n,
            tp = tr.tg.attributes.position.array,
            tc = tr.tg.attributes.aCol.array;
          for (let k = 1; k <= tr.K; k++) {
            it.fill(Math.max(0, t - k * it.trail.dt), tr.pos, tr.col);
            const f = (1 - k / (tr.K + 1)) * (it.trail.k ?? 0.5);
            tp.set(tr.pos, (k - 1) * n * 3);
            for (let q = 0; q < n; q++) {
              const o = ((k - 1) * n + q) * 4;
              tc[o] = tr.col[4 * q];
              tc[o + 1] = tr.col[4 * q + 1];
              tc[o + 2] = tr.col[4 * q + 2];
              tc[o + 3] = tr.col[4 * q + 3] * f;
            }
          }
          it.fill(t, a.array, g.attributes.aCol.array); // the main fill state (vis count) stays that of t
          tr.tg.attributes.position.needsUpdate = true;
          tr.tg.attributes.aCol.needsUpdate = true;
        }
      } else if (it.kind === 'beam') {
        const A = it.a(t),
          B = it.b(t),
          on = A && B && it.on(t);
        obj.visible = !!on;
        if (on) {
          const v = new T.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
          const L = v.length();
          v.normalize();
          const mid = new T.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2),
            cd = mid.clone().sub(this.camera.position).normalize();
          const right = new T.Vector3().crossVectors(v, cd);
          if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
          right.normalize();
          const nz = new T.Vector3().crossVectors(right, v);
          obj.position.copy(mid);
          obj.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right, v, nz));
          // A ribbon keeps its world width at long range, but a close camera must not turn it into a fat bar: cap it at it.maxPx screen pixels.
          let cap = Infinity;
          if (it.maxPx) {
            const bh = this.renderer.domElement.height;
            cap =
              (it.maxPx * (bh / (this.el?.clientHeight || bh)) * Math.max(0.1, mid.distanceTo(this.camera.position))) /
              bh /
              Math.tan((this.camera.fov * DEG) / 2);
          }
          obj.children.forEach((ch) => {
            if (ch.isMesh) ch.scale.set(2 * Math.min(ch.userData.hw, cap), L, 1);
          });
          if (obj.userData.ends) {
            const e = it.ends * 0.3;
            obj.userData.ends[0].position.set(0, -L / 2 + e, 0);
            obj.userData.ends[1].position.set(0, L / 2 - e, 0);
          }
          const core = obj.userData.core.material,
            now = performance.now() / 1000;
          if (it.opFn) {
            const o = it.opFn(t);
            core.color.set(it.colorFn ? it.colorFn(t) : it.color);
            core.opacity = o;
            if (obj.userData.halo) obj.userData.halo.material.opacity = 0.22 * o;
          } else if (it.colorFn) {
            // GNSS links: steady green outside the zone, faint flickering red inside it
            const jam = it.dashFn(t);
            core.color.set(it.colorFn(t));
            core.opacity = jam ? 0.12 + 0.18 * Math.abs(Math.sin(now * 13 + L * 9)) : 0.55;
          } else if (obj.userData.halo) {
            const pulse = 0.8 + 0.2 * Math.sin(now * 30);
            core.opacity = (it.opacity ?? 0.9) * pulse;
            obj.userData.halo.material.opacity = 0.24 * pulse;
          }
        }
      } else if (it.kind === 'flash') {
        const span = it.span ?? (it.big ? 0.3 : 0.14),
          dt = t - it.t0,
          lg = it.linger != null && dt >= span, // opt-in: after the burst a faint ring stays on the impact point
          on = dt > 0 && (dt < span || lg);
        obj.visible = on;
        obj.userData.on = on;
        if (on && lg) {
          const { core, ring } = obj.userData;
          core.material.opacity = 0;
          ring.scale.setScalar((it.size ? it.size * 1.7 : 0.9) * (it.lingerK ?? 1) + 0.01);
          ring.userData.s0 = ring.scale.x;
          ring.material.opacity = it.linger;
          if (obj.userData.ring2) obj.userData.ring2.material.opacity = 0;
        } else if (on) {
          const f = dt / span,
            { core, ring } = obj.userData;
          core.scale.setScalar((it.size ?? (it.big ? 0.55 : 0.16)) * Math.sqrt(Math.min(1, f * 3)) + 0.01);
          core.userData.s0 = core.scale.x;
          core.material.opacity = 0.85 * Math.max(0, 1 - f * 1.6) * (it.coreK ?? 1);
          ring.scale.setScalar((it.size ? it.size * 1.7 : it.big ? 0.9 : 0.3) * Math.pow(f, 0.6) + 0.01);
          ring.userData.s0 = ring.scale.x;
          ring.material.opacity = 0.9 * (1 - f);
          const r2 = obj.userData.ring2;
          if (r2) {
            // strong flash: a bigger, longer-lived core and a second white ring
            core.scale.setScalar(core.scale.x * 1.45);
            core.userData.s0 = core.scale.x;
            core.material.opacity = Math.min(1, 1.1 * Math.max(0, 1 - f * 1.05)) * (it.coreK ?? 1);
            r2.scale.setScalar((it.size ?? 0.55) * 2.6 * Math.pow(f, 0.5) + 0.01);
            r2.userData.s0 = r2.scale.x;
            r2.material.opacity = 0.75 * (1 - f);
          }
        }
      }
    }
    for (const { m, u0, speed } of this.trails || []) m.uniforms.uU.value = (((u0 + t * Math.PI * 2 * speed) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    this._drawInset();
    if (this.statusEl) {
      // a camera may carry its own caption ([full, phone]) when the time-line text does not describe what it shows
      const cst = this.sim.cams[this.camIdx]?.status;
      this.statusEl.textContent = cst
        ? this.el.clientWidth < 640 && cst[1]
          ? cst[1]
          : cst[0]
        : this.status
          ? this.status.text(t, false, this.el.clientWidth < 640)
          : '';
      if (this._tagLine) {
        const sp = document.createElement('span');
        sp.style.cssText = 'display:block;margin-top:2px;font-weight:500;opacity:.88';
        sp.textContent = this._tagLine;
        this.statusEl.appendChild(sp);
      }
      this._applyBands();
    }
    this.render();
  }
  // Point sprite sizes follow the drawing-buffer height (live canvas or the print-resolution still).
  _ptUniforms() {
    const bh = this.renderer.domElement.height,
      k = bh / (this.el?.clientHeight || bh),
      sc = bh / (2 * Math.tan((this.camera.fov * DEG) / 2));
    for (const m of this.tubeMats || []) {
      m.uniforms.uScale.value = sc;
      m.uniforms.uMaxPx.value = m.userData.maxPx * k;
    }
    if (this._edgeRes) this.renderer.getDrawingBufferSize(this._edgeRes);
    const d0 = Math.max(0.5, this.camera.position.distanceTo(this.target));
    for (const m of this.ptMats || []) {
      m.uniforms.uD0.value = d0;
      m.uniforms.uScale.value = sc;
      m.uniforms.uMin.value = m.userData.minPx * k;
      m.uniforms.uMax.value = m.userData.maxPx * k;
    }
  }
  // Models keep a sensible on-screen size: scaled down when the camera is close, up (a little) when it is far.
  _fitModels() {
    const bh = this.renderer.domElement.height,
      k = bh / (this.el?.clientHeight || bh),
      sc = bh / (2 * Math.tan((this.camera.fov * DEG) / 2)),
      cp = this.camera.position,
      v = (this._v3 ||= new this.T.Vector3());
    for (const { obj } of this.dyn) {
      const u = obj.userData;
      if (!u.span || !obj.visible) continue;
      obj.updateWorldMatrix(true, false);
      v.setFromMatrixPosition(obj.matrixWorld);
      const d = Math.max(0.15, v.distanceTo(cp)),
        px = (u.span * u.base * sc) / d,
        b = this._modelBoost || 1, // print stills draw craft a little larger relative to the frame
        f = Math.min(Math.max(px, u.minPx * k * b), u.maxPx * k * b) / px;
      obj.scale.setScalar(u.base * f);
    }
    // Dazzle glare on a target while a beam is on: about 120 px across on screen, pulsing.
    for (const { it, obj } of this.dyn) {
      if (it.kind !== 'glare') continue;
      const p = it.on(this.t) && it.pos(this.t);
      obj.visible = !!p && !occluded([cp.x, cp.y, cp.z], p);
      if (!p) continue;
      obj.position.set(...p);
      const d = Math.max(0.15, obj.position.distanceTo(cp)),
        pulse = 0.85 + 0.15 * Math.sin(this.t * this.sim.cfg.duration * 9);
      obj.scale.setScalar((92 * k * d * pulse) / sc);
      obj.material.rotation = this.t * 3;
    }
    // Orbit lines that fade out around their craft (it.gapIds): the line never runs through a model.
    for (const { mat, ids } of this.gapRings || []) {
      ids.slice(0, 2).forEach((id, k) => {
        const e = this.dyn.find((d) => d.it.craftId === id),
          g = mat.uniforms['uGap' + k].value;
        if (e && e.obj.visible) g.set(e.obj.position.x, e.obj.position.y, e.obj.position.z, 0.6 * (e.obj.userData.span || 0) * e.obj.scale.x);
        else g.w = 0;
      });
    }
    // Docked pairs (it.dockWith): the two models sit side by side, touching, along the camera's right vector, whatever the zoom.
    for (const { it, obj } of this.dyn) {
      if (!it.dockWith || !obj.visible || !it.dockOn(this.t)) continue;
      const B = this.dyn.find((d) => d.it.craftId === it.dockWith),
        p = it.pos(this.t);
      if (!B || !B.obj.visible || !p) continue;
      const right = (this._right ||= new this.T.Vector3()).setFromMatrixColumn(this.camera.matrixWorld, 0),
        w = 0.5 * 0.6 * Math.max((obj.userData.span || 0) * obj.scale.x, (B.obj.userData.span || 0) * B.obj.scale.x);
      obj.position.set(...p).addScaledVector(right, w);
      B.obj.position.set(...p).addScaledVector(right, -w);
    }
    // Glows drawn without a depth test (so the surface never cuts them in half) are hidden while the Earth is between them and the camera.
    const c3 = [cp.x, cp.y, cp.z];
    for (const { it, obj } of this.dyn) {
      if (it.kind === 'flash' && obj.userData.on) {
        obj.updateWorldMatrix(true, false);
        v.setFromMatrixPosition(obj.matrixWorld);
        obj.visible = !occluded(c3, [v.x, v.y, v.z]);
        const d = Math.max(0.15, v.distanceTo(cp)),
          { core, ring } = obj.userData;
        if (core.userData.s0) {
          const ck = it.capK ?? 1; // opt-in: larger on-screen cap for the burst sprites
          core.scale.setScalar(Math.min(core.userData.s0, (110 * ck * k * d) / sc));
          ring.scale.setScalar(Math.min(ring.userData.s0, (190 * ck * k * d) / sc));
          const r2 = obj.userData.ring2;
          if (r2?.userData.s0) r2.scale.setScalar(Math.min(r2.userData.s0, (260 * ck * k * d) / sc));
        }
      } else if (it.kind === 'beam' && obj.visible && obj.userData.ends)
        obj.userData.ends.forEach((s) => {
          s.updateWorldMatrix(true, false);
          v.setFromMatrixPosition(s.matrixWorld);
          s.visible = !occluded(c3, [v.x, v.y, v.z]);
          s.scale.setScalar(Math.min(it.ends, (24 * k * Math.max(0.15, v.distanceTo(cp))) / sc));
        });
    }
  }
  render() {
    if (!this.scene) return;
    // hero: the globe turns once per loop, plus whatever the reader has dragged it by
    if (this.sim.cfg.spin) this.root.rotation.y = this.t * Math.PI * 2 + (this._turn || 0);
    this._camMotion();
    this._earthFrame();
    this._spaceFrame();
    this._rimFrame();
    this._fitModels();
    this._ptUniforms();
    this.renderer.render(this.scene, this.camera);
    this._renderLabels();
  }
  play(onTick) {
    cancelAnimationFrame(this.raf);
    this.onTick = onTick;
    let last = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (this.playing && !this.dragging) {
        let t = this.t + dt / this.sim.cfg.duration;
        if (t > 1.08) t = 0;
        if (this.lock != null) {
          const a = this.sim.cfg.acts[this.lock];
          if (t >= a.t1 || t < a.t0 - 1e-6) t = a.t0;
        }
        this.update(Math.min(t, 1));
        this.t = t;
        this.onTick?.(Math.min(t, 1));
      }
    };
    this.raf = requestAnimationFrame(loop);
  }
  unload() {
    cancelAnimationFrame(this.raf);
    this.el?.querySelector(':scope > .illus .ep-merge')?.remove(); // the merged episode note (cfg.epChipMerge) leaves with the scene
    if (this.scene) {
      // Dispose every geometry, material and texture (map, specularMap, sprites) the scene created.
      this.scene.traverse((o) => {
        o.geometry?.dispose();
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach((m) => {
          for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose();
          m.dispose();
        });
      });
      this.spriteTex?.dispose();
      this.ringTex?.dispose();
      this.beamTex?.dispose();
      this._pt?.dispose();
      cancelAnimationFrame(this._twRaf);
      this._tw = null;
      this._camSeen = false;
      this.spriteTex = this.ringTex = this.beamTex = this._pt = null;
      this._disposeEarth();
      this._disposeSpace();
      this._envRT?.dispose();
      this._envRT = this.rim = null;
      this.ptMats = [];
      this.tubeMats = [];
      this.gapRings = [];
      this.scene.clear();
      this.scene = null;
      this.earthMat = null;
    }
    this.renderer.renderLists.dispose();
    if (this.labelLayer) this.labelLayer.innerHTML = '';
    this.labels = [];
    this.dyn = [];
    this.status = null;
    this.statusEl = null;
    this.chipEl = null;
    this.insetEl = null;
    this._lastPlace = this._lastObjs = this._lastObst = null;
  }
  memory() {
    return { ...this.renderer.info.memory, programs: this.renderer.info.programs?.length };
  }
  _bindDrag() {
    const cv = this.canvas;
    let sx = 0,
      sy = 0;
    cv.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this._user = true;
      sx = e.clientX;
      sy = e.clientY;
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointerup', () => {
      this.dragging = false;
    });
    cv.addEventListener('pointercancel', () => {
      this.dragging = false;
    });
    cv.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      if (this.chipEl) this.chipEl.style.opacity = '0';
      const dx = (e.clientX - sx) * 0.006,
        dy = (e.clientY - sy) * 0.006;
      sx = e.clientX;
      sy = e.clientY;
      const p = this.camera.position,
        o = p.clone().sub(this.target),
        r = o.length();
      let th = Math.atan2(o.x, o.z) - dx,
        ph = Math.acos(o.y / r) - dy;
      ph = Math.max(0.1, Math.min(Math.PI - 0.1, ph));
      p.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)).add(this.target);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.target);
      this.render();
    });
    cv.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this._user = true;
        const p = this.camera.position,
          o = p.clone().sub(this.target);
        const r = Math.max(this.target.length() > 0 ? 0.35 : 1.6, Math.min(12, o.length() * (1 + Math.sign(e.deltaY) * 0.08)));
        p.copy(o.setLength(r).add(this.target));
        this.render();
      },
      { passive: false },
    );
  }
}
