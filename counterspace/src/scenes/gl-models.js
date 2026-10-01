// ============================================================================
// scenes/gl-models.js: GLHost mixin: the low-poly 3D craft and site models (satellite, ISS, spaceplane, aircraft, ground site, pin, jammer, ship)
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { norm } from './core.js';

export const modelMethods = {
  // _fitModels() rescales them every frame so a model is never a giant blob when the camera is close, nor a speck when it is far.
  // Small spacecraft (MSTI-3 class): octagonal foil-wrapped bus, dark sensor aperture, aft ring, yoke + two-segment cell-textured wings, mast and dish.
  _satModel(color, halo, bright, variant) {
    const T = this.T,
      g = new T.Group(),
      foil = this._mat(color),
      gray = this._mat(0xb8c0d0),
      dark = this._mat(0x39415a),
      pan = new T.MeshLambertMaterial({ map: this._panelTexture(), color: 0xffffff, emissive: 0x0a1a3a });
    const cyl = (r0, r1, l, m, z, y = 0) => {
      const q = new T.Mesh(new T.CylinderGeometry(r0, r1, l, 8), m);
      q.rotation.x = Math.PI / 2;
      q.position.set(0, y, z);
      g.add(q);
      return q;
    };
    const body = cyl(0.0062, 0.0062, 0.015, foil, 0);
    g.userData.body = body;
    g.userData.sat = true;
    cyl(0.0067, 0.0067, 0.0015, gray, -0.0082);
    cyl(0.0034, 0.0046, 0.0042, dark, 0.0092);
    cyl(0.0064, 0.0064, 0.0006, gray, 0.0046);
    [-1, 1].forEach((s) => {
      const yoke = new T.Mesh(new T.BoxGeometry(0.0046, 0.0007, 0.0007), gray);
      yoke.position.x = s * 0.0086;
      g.add(yoke);
      [0, 1].forEach((i) => {
        const p = new T.Mesh(new T.BoxGeometry(0.0072, 0.0007, 0.0104), pan);
        p.position.x = s * (0.0114 + 0.0075 * i + 0.0036);
        g.add(p);
      });
    });
    const mast = new T.Mesh(new T.CylinderGeometry(0.00045, 0.00045, 0.0058, 5), gray);
    mast.position.set(0, 0.0088, -0.003);
    g.add(mast);
    const dish = new T.Mesh(
      new T.SphereGeometry(0.0034, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshLambertMaterial({ color: 0xe8ecf5, side: T.DoubleSide }),
    );
    dish.position.set(0, 0.0122, -0.003);
    dish.rotation.x = -0.6;
    g.add(dish);
    if (variant === 'tug') {
      // SJ-21 (tug): a third panel segment on each wing with a mid-wing hinge, radiator panels on the bus sides, a second smaller dish on a short
      // boom and an aft cluster of four small thruster nozzles around a larger main engine bell. Plus a generic grapple boom (illustrative: SWF does not
      // describe any arm on SJ-21) that stows folded and reaches toward its docking partner.
      const dk = this._mat(0x1c2233);
      [-1, 1].forEach((sg) => {
        const p3 = new T.Mesh(new T.BoxGeometry(0.0072, 0.0007, 0.0104), pan);
        p3.position.x = sg * (0.0114 + 0.0075 * 2 + 0.0036);
        g.add(p3);
        const hinge = new T.Mesh(new T.BoxGeometry(0.0009, 0.0011, 0.0108), dk);
        hinge.position.x = sg * 0.0198;
        g.add(hinge);
        const rad = new T.Mesh(new T.BoxGeometry(0.0004, 0.009, 0.011), this._mat(0xeef1f8));
        rad.position.set(sg * 0.0068, 0, 0.0004);
        g.add(rad);
        [-1, 1].forEach((u) => {
          const nz = new T.Mesh(new T.ConeGeometry(0.0011, 0.003, 8), dk);
          nz.rotation.x = -Math.PI / 2;
          nz.position.set(sg * 0.0036, u * 0.0036, -0.0102);
          g.add(nz);
        });
      });
      const bell = new T.Mesh(new T.ConeGeometry(0.0019, 0.0042, 10), dk);
      bell.rotation.x = -Math.PI / 2;
      bell.position.set(0, 0, -0.0112);
      g.add(bell);
      const boom = new T.Mesh(new T.CylinderGeometry(0.0003, 0.0003, 0.007, 5), gray);
      boom.position.set(0.0042, -0.0066, 0.0035);
      boom.rotation.z = -0.35;
      g.add(boom);
      const arm = new T.Group(),
        armM = this._mat(0xd5dae6),
        seg = (x0, y0, x1, y1, r) => {
          const L = Math.hypot(x1 - x0, y1 - y0),
            q = new T.Mesh(new T.CylinderGeometry(r, r, L, 6), armM);
          q.rotation.z = Math.PI / 2 + Math.atan2(y1 - y0, x1 - x0);
          q.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
          arm.add(q);
        };
      seg(0.006, 0, 0.0135, 0.0036, 0.0007);
      seg(0.0135, 0.0036, 0.0225, 0, 0.0005);
      [0.006, 0.0135].forEach((x, i) => {
        const j = new T.Mesh(new T.BoxGeometry(0.0021, 0.0021, 0.0021), dk);
        j.position.set(x, i ? 0.0036 : 0, 0);
        arm.add(j);
      });
      [-1, 1].forEach((u) => {
        const f = new T.Mesh(new T.BoxGeometry(0.0034, 0.0004, 0.0004), dk);
        f.position.set(0.0243, 0, u * 0.0012);
        arm.add(f);
      });
      g.add(arm);
      // each frame the boom points at the partner (docked pair: the other model), extending as the dock window nears and folding once it ends
      arm.updateMatrixWorld = (force) => {
        const e = (g.userData.armE ||= this.dyn.find((d) => d.obj === g)),
          B = e?.it.dockWith && this.dyn.find((d) => d.it.craftId === e.it.dockWith);
        let f = 0.25;
        if (B) {
          const [t0, t1] = e.it.dockT,
            t = this.t;
          f = Math.max(0.25, Math.min(1, (t - (t0 - 0.12)) / 0.1, (t1 + 0.04 - t) / 0.04));
          const d = g.worldToLocal(g.parent.localToWorld(B.obj.position.clone())); // the partner, in this model's own (possibly rotated) frame
          if (d.lengthSq() > 1e-12) arm.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), d.normalize());
        }
        arm.scale.set(0.5 + 0.45 * f, 1.7, 1.7);
        T.Group.prototype.updateMatrixWorld.call(arm, force);
      };
      const dish2 = new T.Mesh(
        new T.SphereGeometry(0.0022, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
        new T.MeshLambertMaterial({ color: 0xe8ecf5, side: T.DoubleSide }),
      );
      dish2.position.set(0.0054, -0.0102, 0.0035);
      dish2.rotation.x = Math.PI + 0.5;
      g.add(dish2);
    } else if (variant === 'navsat') {
      // Compass G2 (defunct navigation satellite): box-like bus with an Earth-facing phased array, two small dishes, a whip antenna, a fourth
      // panel on each wing and a large apogee-motor bell aft.
      const dk = this._mat(0x232a3d);
      const arr = new T.Mesh(new T.BoxGeometry(0.0074, 0.0074, 0.0013), pan);
      arr.position.set(0, 0, 0.0094);
      g.add(arr);
      const frame = new T.Mesh(new T.BoxGeometry(0.0082, 0.0082, 0.0008), dk);
      frame.position.set(0, 0, 0.0086);
      g.add(frame);
      [-1, 1].forEach((sg) => {
        const p3 = new T.Mesh(new T.BoxGeometry(0.0072, 0.0007, 0.0104), pan);
        p3.position.x = sg * (0.0114 + 0.0075 * 2 + 0.0036);
        g.add(p3);
        const dsh = new T.Mesh(
          new T.SphereGeometry(0.0021, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
          new T.MeshLambertMaterial({ color: 0xcfd5e2, side: T.DoubleSide }),
        );
        dsh.position.set(sg * 0.0043, 0.0074, 0.0012);
        dsh.rotation.x = -0.9;
        g.add(dsh);
        const sun = new T.Mesh(new T.BoxGeometry(0.0012, 0.0012, 0.0012), dk);
        sun.position.set(sg * 0.0069, -0.0052, 0.004);
        g.add(sun);
      });
      const whip = new T.Mesh(new T.CylinderGeometry(0.00022, 0.00022, 0.011, 4), gray);
      whip.position.set(-0.0022, -0.0092, -0.0035);
      g.add(whip);
      const bellN = new T.Mesh(new T.CylinderGeometry(0.0012, 0.0032, 0.0058, 12, 1, true), new T.MeshLambertMaterial({ color: 0x8a8f9c, side: T.DoubleSide }));
      bellN.rotation.x = Math.PI / 2;
      bellN.position.set(0, 0, -0.0124);
      g.add(bellN);
    }
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: this._c(color),
        transparent: true,
        opacity: bright ? 0.5 : 0.32,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(bright ? 0.075 : 0.055);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.052, minPx: 15, maxPx: 50 });
    return g;
  },
  _c(c) {
    return new this.T.Color(c);
  },
  // ISS: long integrated truss, four solar-array pairs (a blanket either side of each mast), white radiators, and the pressurised stack
  // (Zvezda-Zarya-Unity-Destiny in line, Harmony/Columbus/Kibo crossing at the node). Span about 0.11.
  _issModel(color) {
    const T = this.T,
      g = new T.Group(),
      gray = this._mat(0xc9ced9),
      white = this._mat(0xf1f3f8),
      gold = this._mat(0xd9b96a),
      pan = new T.MeshLambertMaterial({ map: this._panelTexture(), emissive: 0x0a1a3a, side: T.DoubleSide });
    const box = (w, h, d, m, x, y, z) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      q.position.set(x, y, z);
      g.add(q);
      return q;
    };
    const cyl = (r, l, m, x, y, z, alongX) => {
      const q = new T.Mesh(new T.CylinderGeometry(r, r, l, 10), m);
      if (alongX) q.rotation.z = Math.PI / 2;
      else q.rotation.x = Math.PI / 2;
      q.position.set(x, y, z);
      g.add(q);
      return q;
    };
    box(0.11, 0.0022, 0.0022, gray, 0, 0, 0.004);
    [-1, 1].forEach((s) => {
      [0.046, 0.027].forEach((x) => {
        box(0.0012, 0.0012, 0.0045, gray, s * x, 0, 0.004);
        [-1, 1].forEach((e) => box(0.0074, 0.0005, 0.0165, pan, s * x, 0, 0.004 + e * 0.0105));
      });
      box(0.0115, 0.0006, 0.0085, white, s * 0.0125, 0, -0.0042);
    });
    const main = cyl(0.0034, 0.024, white, 0, 0, 0.001);
    g.userData.body = main;
    cyl(0.0027, 0.012, white, 0, 0, -0.0135);
    cyl(0.0025, 0.012, gray, 0, 0, 0.0155);
    cyl(0.0031, 0.014, white, 0, 0, 0.0255);
    cyl(0.0022, 0.02, white, 0, 0, 0.0155, true);
    cyl(0.0017, 0.012, gold, 0, 0.0038, 0.0255, true);
    const node = new T.Mesh(new T.SphereGeometry(0.0038, 10, 6), gray);
    node.position.z = 0.0155;
    g.add(node);
    g.userData.iss = true;
    g.userData.tintMat = main.material;
    const h = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending }),
    );
    h.scale.setScalar(0.085);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.11, minPx: 24, maxPx: 62 });
    return g;
  },
  // Spaceplane (X-37B / CSSHQ class): tapered fuselage with a rounded nose, a dark cockpit and payload-bay door, swept delta wings, twin canted tail fins and
  // an engine bell; span about 0.046 (exaggerated). Nose along +z, up is +y.
  _planeModel(color, bright) {
    const T = this.T,
      g = new T.Group(),
      body = this._mat(color),
      white = this._mat(0xeef1f8),
      dark = this._mat(0x2b3140);
    const fus = new T.Mesh(new T.CylinderGeometry(0.0026, 0.0056, 0.044, 16), white);
    fus.rotation.x = Math.PI / 2;
    g.add(fus);
    const nose = new T.Mesh(new T.SphereGeometry(0.0026, 12, 8), white);
    nose.position.z = 0.022;
    g.add(nose);
    const cockpit = new T.Mesh(new T.BoxGeometry(0.0036, 0.0013, 0.006), dark);
    cockpit.position.set(0, 0.0042, 0.0128);
    g.add(cockpit);
    const bay = new T.Mesh(new T.BoxGeometry(0.0046, 0.001, 0.014), body);
    bay.position.set(0, 0.0056, -0.004);
    g.add(bay);
    // Wing: a thick, bevelled slab in a darker shade of the national colour (its underside), with a smaller bright deck on top and a dark leading edge,
    // so the delta reads as a solid winged body with shading instead of one flat wedge.
    const shape = (k) => {
      const q = new T.Shape();
      q.moveTo(0.004 * k, 0.014 * k);
      q.lineTo(0.0215 * k, -0.0125 * k);
      q.lineTo(0.0215 * k, -0.0185 * k);
      q.lineTo(-0.0215 * k, -0.0185 * k);
      q.lineTo(-0.0215 * k, -0.0125 * k);
      q.lineTo(-0.004 * k, 0.014 * k);
      q.closePath();
      return q;
    };
    const under = this._mat(new T.Color(color).multiplyScalar(0.5).getHex());
    const wing = new T.Mesh(
      new T.ExtrudeGeometry(shape(1), { depth: 0.0024, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 1 }),
      under,
    );
    wing.rotation.x = Math.PI / 2;
    wing.position.y = 0.0004;
    g.add(wing);
    const deck = new T.Mesh(
      new T.ExtrudeGeometry(shape(0.8), { depth: 0.0006, bevelEnabled: false }),
      this._mat(new T.Color(color).lerp(new T.Color(0xffffff), 0.28).getHex()),
    );
    deck.rotation.x = Math.PI / 2;
    deck.position.set(0, 0.0007, -0.0012);
    g.add(deck);
    // thermal-tile seams across the wing deck and a white dorsal spine: the delta reads as a shaded, panelled surface rather than one flat wedge
    [-0.002, -0.0085].forEach((z) => {
      const seam = new T.Mesh(new T.BoxGeometry(0.0285 + z * 1.6, 0.0004, 0.0004), dark);
      seam.position.set(0, 0.0012, z);
      g.add(seam);
    });
    const spine = new T.Mesh(new T.BoxGeometry(0.0016, 0.0008, 0.026), white);
    spine.position.set(0, 0.0063, 0.0);
    g.add(spine);
    [-1, 1].forEach((s) => {
      const le = new T.Mesh(new T.BoxGeometry(0.0007, 0.0007, 0.031), dark);
      le.position.set(s * 0.0125, -0.0004, 0.0004);
      le.rotation.y = s * 0.67;
      g.add(le);
    });
    [-1, 1].forEach((s) => {
      const f = new T.Mesh(new T.BoxGeometry(0.001, 0.009, 0.0095), body);
      f.position.set(s * 0.0042, 0.0075, -0.0165);
      f.rotation.z = -s * 0.38;
      g.add(f);
    });
    const bell = new T.Mesh(new T.CylinderGeometry(0.0026, 0.0032, 0.003, 12), dark);
    bell.rotation.x = Math.PI / 2;
    bell.position.z = -0.0235;
    g.add(bell);
    g.userData.body = wing;
    g.userData.sat = true;
    const h = new T.Sprite(
      new T.SpriteMaterial({
        map: this.spriteTex,
        color: this._c(color),
        transparent: true,
        opacity: bright ? 0.5 : 0.34,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    h.scale.setScalar(0.07);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.046, minPx: 22, maxPx: 60 });
    return g;
  },
  _aircraftModel() {
    const T = this.T,
      g = new T.Group(),
      m = new T.MeshBasicMaterial({ color: 0xe9edf7, side: T.DoubleSide });
    const fus = new T.Mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.026, 8), m);
    fus.rotation.x = Math.PI / 2;
    g.add(fus);
    const nose = new T.Mesh(new T.ConeGeometry(0.0022, 0.006, 8), m);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 0.016;
    g.add(nose);
    const sh = new T.Shape();
    sh.moveTo(0, 0.004);
    sh.lineTo(0.02, -0.006);
    sh.lineTo(0.02, -0.0085);
    sh.lineTo(0, -0.0035);
    sh.lineTo(-0.02, -0.0085);
    sh.lineTo(-0.02, -0.006);
    sh.closePath();
    const wing = new T.Mesh(new T.ShapeGeometry(sh), m);
    wing.rotation.x = Math.PI / 2;
    wing.position.z = 0.002;
    g.add(wing);
    [-1, 1].forEach((s) => {
      const tail = new T.Mesh(new T.BoxGeometry(0.0009, 0.0075, 0.006), m);
      tail.position.set(s * 0.0035, 0.0035, -0.011);
      tail.rotation.z = -s * 0.2;
      g.add(tail);
    });
    const stab = new T.Mesh(new T.BoxGeometry(0.014, 0.0009, 0.004), m);
    stab.position.set(0, 0, -0.012);
    g.add(stab);
    g.userData.tintMat = m;
    const h = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: 0xe9edf7, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }),
    );
    h.scale.setScalar(0.06);
    g.add(h);
    g.userData.halo = h;
    Object.assign(g.userData, { span: 0.042, minPx: 19, maxPx: 44 });
    return g;
  },
  // Ground site: base plate, mast and a tilted dish (small pylon/dish glyph), standing on the local vertical.
  _siteModel(color, pos) {
    const T = this.T,
      g = new T.Group(),
      m = new T.MeshLambertMaterial({ color: this._c(color), side: T.DoubleSide, emissive: this._c(color), emissiveIntensity: 0.35 }),
      dm = new T.MeshLambertMaterial({ color: 0xf2f4fa, side: T.DoubleSide, emissive: 0x556070 });
    const base = new T.Mesh(new T.CylinderGeometry(0.008, 0.009, 0.0022, 12), m);
    g.add(base);
    const mast = new T.Mesh(new T.CylinderGeometry(0.0013, 0.0019, 0.022, 6), m);
    mast.position.y = 0.0115;
    g.add(mast);
    const dish = new T.Mesh(new T.SphereGeometry(0.0085, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), dm);
    dish.position.y = 0.024;
    dish.rotation.x = -0.75;
    g.add(dish);
    const feed = new T.Mesh(new T.CylinderGeometry(0.0004, 0.0004, 0.008, 4), m);
    feed.position.set(0, 0.0285, 0.0045);
    feed.rotation.x = 0.6;
    g.add(feed);
    const h = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending }),
    );
    h.scale.setScalar(0.04);
    h.position.y = 0.012;
    g.add(h);
    g.userData.tintMat = m;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    Object.assign(g.userData, { span: 0.03, minPx: 9, maxPx: 26 });
    return g;
  },
  // Map pin (Peresvet shelter sites): a flat ring on the ground, a stem and a bright head, clearly bigger than a dish and with no beam implied.
  _pinModel(color, pos) {
    const T = this.T,
      g = new T.Group(),
      m = new T.MeshBasicMaterial({ color: this._c(color), side: T.DoubleSide }),
      w = new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide });
    const ring = new T.Mesh(new T.RingGeometry(0.014, 0.019, 28), m);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0005;
    g.add(ring);
    const stem = new T.Mesh(new T.CylinderGeometry(0.0016, 0.0016, 0.03, 6), w);
    stem.position.y = 0.015;
    g.add(stem);
    const head = new T.Mesh(new T.SphereGeometry(0.0085, 14, 10), m);
    head.position.y = 0.036;
    g.add(head);
    const core = new T.Mesh(new T.SphereGeometry(0.0034, 10, 8), w);
    core.position.y = 0.036;
    g.add(core);
    g.userData.tintMat = m;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    Object.assign(g.userData, { span: 0.046, minPx: 38, maxPx: 66 });
    return g;
  },
  // Ground jammer: a small truck with a mast and a crossed antenna, and three pulsing emission rings (animated by GLHost.update from the scene time).
  _jammerModel(color, pos) {
    const T = this.T,
      g = new T.Group(),
      m = this._mat(color),
      dark = this._mat(0x3a4254),
      lite = this._mat(0xdde2ee);
    const bed = new T.Mesh(new T.BoxGeometry(0.016, 0.0055, 0.0065), dark);
    bed.position.set(-0.0015, 0.004, 0);
    g.add(bed);
    const cab = new T.Mesh(new T.BoxGeometry(0.0055, 0.0065, 0.0065), lite);
    cab.position.set(0.0083, 0.0045, 0);
    g.add(cab);
    for (const x of [-0.005, 0.0, 0.0085]) {
      const w = new T.Mesh(new T.CylinderGeometry(0.0019, 0.0019, 0.0075, 10), dark);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.0019, 0);
      g.add(w);
    }
    const mast = new T.Mesh(new T.CylinderGeometry(0.0005, 0.0008, 0.03, 6), lite);
    mast.position.set(-0.004, 0.022, 0);
    g.add(mast);
    for (const [y, w] of [
      [0.035, 0.012],
      [0.029, 0.0085],
    ]) {
      const bar = new T.Mesh(new T.BoxGeometry(0.0006, 0.0006, w), m);
      bar.position.set(-0.004, y, 0);
      g.add(bar);
    }
    const tip = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }),
    );
    tip.scale.setScalar(0.012);
    tip.position.set(-0.004, 0.037, 0);
    g.add(tip);
    const rings = [0, 1, 2].map(() => {
      const r = new T.Sprite(
        new T.SpriteMaterial({
          map: this.ringTex,
          color: this._c(color),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: false,
          blending: T.AdditiveBlending,
        }),
      );
      r.position.set(-0.004, 0.036, 0);
      g.add(r);
      return r;
    });
    g.userData.rings = rings;
    g.userData.tintMat = m;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    Object.assign(g.userData, { span: 0.04, minPx: 40, maxPx: 78 });
    return g;
  },
  // Guided-missile cruiser (Ticonderoga class, about 10:1 hull): pointed-bow hull extrusion, dark deck, forward and aft deckhouses with a mast, two
  // stacks, a gun and a helicopter pad.
  _shipModel(pos) {
    const T = this.T,
      g = new T.Group(),
      hull = this._mat(0x8b95a8),
      deck = this._mat(0x5d6779),
      up = this._mat(0xdde2ee),
      gun = this._mat(0x9aa3b5);
    const sh = new T.Shape();
    sh.moveTo(-0.0036, -0.036);
    sh.lineTo(0.0036, -0.036);
    sh.lineTo(0.0043, 0.008);
    sh.quadraticCurveTo(0.0034, 0.03, 0, 0.042);
    sh.quadraticCurveTo(-0.0034, 0.03, -0.0043, 0.008);
    sh.closePath();
    const hg = new T.ExtrudeGeometry(sh, { depth: 0.0038, bevelEnabled: false });
    hg.rotateX(Math.PI / 2);
    hg.translate(0, 0.0038, 0);
    g.add(new T.Mesh(hg, hull));
    const box = (w, h, d, m, x, y, z) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      q.position.set(x, 0.0038 + h / 2 + y, z);
      g.add(q);
      return q;
    };
    box(0.0058, 0.0004, 0.014, deck, 0, 0, -0.026); // helicopter pad
    box(0.0056, 0.0042, 0.0125, up, 0, 0, 0.0035); // forward deckhouse
    box(0.0046, 0.0032, 0.0085, up, 0, 0, -0.0105); // aft deckhouse
    box(0.0034, 0.0038, 0.0034, up, 0, 0.0042, 0.006); // bridge
    [-0.0038, -0.0072].forEach((z) => {
      const st = new T.Mesh(new T.CylinderGeometry(0.0011, 0.0013, 0.0034, 6), gun);
      st.position.set(0, 0.0038 + 0.0032 + 0.0017, z);
      g.add(st);
    });
    const mast = new T.Mesh(new T.CylinderGeometry(0.00035, 0.00035, 0.008, 4), up);
    mast.position.set(0, 0.0038 + 0.0042 + 0.0038 + 0.004, 0.006);
    g.add(mast);
    const turret = new T.Mesh(new T.CylinderGeometry(0.0013, 0.0016, 0.0016, 8), gun);
    turret.position.set(0, 0.0038 + 0.0008, 0.022);
    g.add(turret);
    const barrel = new T.Mesh(new T.CylinderGeometry(0.00035, 0.00035, 0.005, 4), gun);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.0038 + 0.0018, 0.0255);
    g.add(barrel);
    g.position.y = 0;
    g.userData.tintMat = hull;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    g.rotateY(0.6);
    Object.assign(g.userData, { span: 0.078, baseScale: 0.85, minPx: 18, maxPx: 70 });
    return g;
  },
};
