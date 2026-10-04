// ============================================================================
// scenes/gl-models.js: GLHost mixin: the 3D craft and site models (satellite, ISS, spaceplane, aircraft, ground site, pin, jammer, ship) and the lights they use
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { norm } from './core.js';
import { foilCanvas } from './earth.js';

// Part kit: a craft is built from many small boxes, cylinders and swept shapes. Each part is placed with a position and rotation (inside optional nested
// groups), baked into its geometry, and all parts that share a material are merged into one mesh, so a whole craft costs a handful of draw calls.
class Kit {
  constructor(T) {
    this.T = T;
    this.map = new Map();
    this.stack = [new T.Matrix4()];
    this._q = new T.Quaternion();
    this._e = new T.Euler();
    this._v = new T.Vector3();
    this._s = new T.Vector3();
  }
  local(x, y, z, rx, ry, rz) {
    this._q.setFromEuler(this._e.set(rx, ry, rz));
    return new this.T.Matrix4().compose(this._v.set(x, y, z), this._q, this._s.set(1, 1, 1));
  }
  group(x, y, z, rx, ry, rz, fn) {
    this.stack.push(this.stack[this.stack.length - 1].clone().multiply(this.local(x, y, z, rx, ry, rz)));
    fn();
    this.stack.pop();
  }
  geo(mat, geometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const m = this.stack[this.stack.length - 1].clone().multiply(this.local(x, y, z, rx, ry, rz));
    if (sx !== 1 || sy !== 1 || sz !== 1) m.multiply(new this.T.Matrix4().makeScale(sx, sy, sz));
    geometry.applyMatrix4(m);
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(geometry);
  }
  box(mat, w, h, d, ...p) {
    this.geo(mat, new this.T.BoxGeometry(w, h, d), ...p);
  }
  cyl(mat, r0, r1, len, x, y, z, rx, ry, rz, segs = 18, open = false) {
    this.geo(mat, new this.T.CylinderGeometry(r0, r1, len, segs, 1, open), x, y, z, rx, ry, rz);
  }
  ball(mat, r, ...p) {
    this.geo(mat, new this.T.SphereGeometry(r, 16, 10), ...p);
  }
  ring(mat, R, r, ...p) {
    this.geo(mat, new this.T.TorusGeometry(R, r, 6, 24), ...p);
  }
  plane(mat, w, h, ...p) {
    this.geo(mat, new this.T.PlaneGeometry(w, h), ...p);
  }
  build() {
    const T = this.T,
      g = new T.Group(),
      meshes = new Map();
    for (const [mat, list] of this.map) {
      let nv = 0,
        ni = 0;
      for (const ge of list) {
        nv += ge.attributes.position.count;
        ni += ge.index ? ge.index.count : ge.attributes.position.count;
      }
      const pos = new Float32Array(nv * 3),
        nor = new Float32Array(nv * 3),
        uv = new Float32Array(nv * 2),
        idx = new Uint32Array(ni);
      let vo = 0,
        io = 0;
      for (const ge of list) {
        const c = ge.attributes.position.count,
          ix = ge.index ? ge.index.array : null;
        pos.set(ge.attributes.position.array, vo * 3);
        nor.set(ge.attributes.normal.array, vo * 3);
        uv.set(ge.attributes.uv.array, vo * 2);
        if (ix) for (let i = 0; i < ix.length; i++) idx[io + i] = ix[i] + vo;
        else for (let i = 0; i < c; i++) idx[io + i] = vo + i;
        vo += c;
        io += ix ? ix.length : c;
        ge.dispose();
      }
      const bg = new T.BufferGeometry();
      bg.setAttribute('position', new T.BufferAttribute(pos, 3));
      bg.setAttribute('normal', new T.BufferAttribute(nor, 3));
      bg.setAttribute('uv', new T.BufferAttribute(uv, 2));
      bg.setIndex(new T.BufferAttribute(idx, 1));
      const mesh = new T.Mesh(bg, mat);
      meshes.set(mat, mesh);
      g.add(mesh);
    }
    g.userData.meshes = meshes;
    return g;
  }
}
// A box with chamfered edges and rounded corners (an extruded rounded rectangle with a small bevel); its UVs are scaled so foil bump maps repeat evenly.
function chamferBox(T, w, h, d, r, b) {
  const W = w - 2 * b,
    H = h - 2 * b,
    x = -W / 2,
    y = -H / 2,
    q = Math.max(0.00005, r - b),
    s = new T.Shape();
  s.moveTo(x + q, y);
  s.lineTo(x + W - q, y);
  s.quadraticCurveTo(x + W, y, x + W, y + q);
  s.lineTo(x + W, y + H - q);
  s.quadraticCurveTo(x + W, y + H, x + W - q, y + H);
  s.lineTo(x + q, y + H);
  s.quadraticCurveTo(x, y + H, x, y + H - q);
  s.lineTo(x, y + q);
  s.quadraticCurveTo(x, y, x + q, y);
  const g = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.0125, uv.getY(i) / 0.0125);
  return g;
}

// Environment map colours (linear, so values above 1 are bright light): black sky above, a cold dim horizon, earthshine below.
const ENV_SPACE = [0.01, 0.014, 0.03],
  ENV_HORIZON = [0.1, 0.14, 0.24],
  ENV_EARTH = [0.55, 0.78, 1.25];

export const modelMethods = {
  // Lights for craft and sites: the one sun, a faint ambient, a cool rim light behind the subject (it follows the camera, see _rimFrame) so every craft
  // separates from dark space, and a small generated environment map so foil, paint and solar glass read as what they are.
  _buildLights(S, sunDir) {
    const T = this.T,
      spin = !!this.sim.cfg.spin;
    this.ambient = new T.AmbientLight(0x9fb4ff, spin ? 0.5 : 0.2);
    S.add(this.ambient);
    const sun = new T.DirectionalLight(0xfff4e0, spin ? 1.85 : 2.1);
    this.sun = sun;
    sun.position.set(sunDir[0] * 10, sunDir[1] * 10, sunDir[2] * 10);
    S.add(sun);
    this.rim = new T.DirectionalLight(0xa8c8ff, 0.8);
    S.add(this.rim);
    try {
      const pm = new T.PMREMGenerator(this.renderer),
        sc = new T.Scene(),
        geo = new T.SphereGeometry(30, 24, 16),
        pos = geo.attributes.position,
        col = new Float32Array(pos.count * 3),
        mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 30,
          c = y > 0 ? mix(ENV_HORIZON, ENV_SPACE, Math.pow(y, 0.6)) : mix(ENV_HORIZON, ENV_EARTH, Math.pow(-y, 0.8));
        col.set(c, 3 * i);
      }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      sc.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      const panel = (size, rgb, at) => {
        const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ color: new T.Color(...rgb), side: T.DoubleSide, toneMapped: false }));
        m.position.set(...at);
        m.lookAt(0, 0, 0);
        sc.add(m);
      };
      panel(16, [9, 8.2, 6.6], [sunDir[0] * 25, sunDir[1] * 25, sunDir[2] * 25]); // the sun, as a bright warm panel metal can reflect
      panel(14, [0.6, 0.8, 1.2], [-sunDir[0] * 22, -sunDir[1] * 22 + 5, -sunDir[2] * 22]); // a dim cool fill from the opposite side
      this._envRT = pm.fromScene(sc, 0.03);
      S.environment = this._envRT.texture;
      pm.dispose();
      geo.dispose();
      sc.traverse((o) => o.material?.dispose?.());
    } catch (e) {
      console.warn('Environment map unavailable', e); // craft are then lit by the sun and ambient light alone
    }
  },
  // The rim light shines from behind the subject toward the camera, so thin bright edges outline every craft.
  _rimFrame() {
    if (!this.rim) return;
    const cp = this.camera.position,
      d = (this._rd ||= new this.T.Vector3()).copy(cp).sub(this.target).normalize();
    this.rim.position.set(-d.x * 10, -d.y * 10 + 2.5, -d.z * 10);
  },
  // The crumpled-foil bump map shared by every foil part (one GPU texture for the page).
  _foilBump() {
    return this._gtex(foilCanvas(), () => {
      const T = this.T,
        t = new T.CanvasTexture(foilCanvas());
      t.wrapS = t.wrapT = T.RepeatWrapping;
      return t;
    });
  },
  // _fitModels() rescales the models every frame so a model is never a giant blob when the camera is close, nor a speck when it is far.
  // Small spacecraft (MSTI-3 class): a chamfered bus wrapped in crinkled foil with gold bands, radiators, a star tracker, a sensor barrel, a thruster
  // cluster, a yoke and two cell-gridded wings, and a mast with a parabolic dish and its feed. Nose along +z, wings along x, up is +y.
  _satModel(color, halo, bright, variant) {
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI,
      foil = this._foil(color),
      gold = this._foil(0xd8a64a),
      alu = this._mat(0xaab3c2, { metalness: 0.85, roughness: 0.38 }),
      white = this._mat(0xe9edf4, { metalness: 0.15, roughness: 0.5 }),
      dark = this._mat(0x232834, { metalness: 0.55, roughness: 0.5 }),
      glass = this._mat(0x060a14, { metalness: 0.9, roughness: 0.1 }),
      pan = this._panelMat(),
      back = this._mat(0x818a9a, { metalness: 0.3, roughness: 0.6 }),
      dishM = this._mat(0xeceff5, { side: T.DoubleSide, metalness: 0.3, roughness: 0.4 }),
      tug = variant === 'tug',
      nav = variant === 'navsat',
      panel = (cx, w = 0.0072, d = 0.0104) => {
        K.box(alu, w, 0.0004, d, cx, 0, 0);
        K.plane(pan, w - 0.0002, d - 0.0002, cx, 0.00022, 0, -PI / 2, 0, 0);
        K.plane(back, w - 0.0002, d - 0.0002, cx, -0.00022, 0, PI / 2, 0, 0);
      },
      dish = (R, depth) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) pts.push(new T.Vector2((R * i) / 10, depth * (i / 10) ** 2));
        K.geo(dishM, new T.LatheGeometry(pts, 24));
        K.ring(alu, R, 0.00016, 0, depth, 0, PI / 2, 0, 0);
        K.cyl(alu, 0.00016, 0.00016, (R * R) / (4 * depth), 0, (R * R) / (8 * depth), 0);
        K.cyl(dark, 0.00045, 0.0002, 0.0007, 0, (R * R) / (4 * depth) + 0.0004, 0);
      };
    K.geo(foil, chamferBox(T, 0.0125, 0.0125, nav ? 0.0125 : 0.015, 0.0014, 0.0004));
    if (!nav) {
      K.box(gold, 0.0129, 0.0129, 0.0009, 0, 0, -0.0016);
      K.box(gold, 0.0129, 0.0129, 0.0009, 0, 0, 0.0036);
      K.cyl(dark, 0.0033, 0.0035, 0.0034, 0, 0, 0.0092, PI / 2);
      K.cyl(alu, 0.0036, 0.0036, 0.0006, 0, 0, 0.0079, PI / 2);
      K.cyl(glass, 0.0029, 0.0029, 0.0004, 0, 0, 0.0111, PI / 2);
      K.box(dark, 0.0116, 0.0116, 0.0022, 0, 0, -0.0086);
      K.cyl(dark, tug ? 0.0007 : 0.0006, tug ? 0.0019 : 0.0017, tug ? 0.0042 : 0.0034, 0, 0, tug ? -0.0112 : -0.0112, PI / 2, 0, 0, 16, true);
      for (const [x, y] of [
        [0.0044, 0.0044],
        [-0.0044, 0.0044],
        [0.0044, -0.0044],
        [-0.0044, -0.0044],
      ])
        K.cyl(dark, tug ? 0.0004 : 0.0003, tug ? 0.0011 : 0.0007, tug ? 0.003 : 0.0018, x, y, -0.0104, PI / 2);
      K.box(white, 0.009, 0.0004, 0.0092, 0, 0.0064, -0.0004);
      K.box(white, 0.009, 0.0004, 0.0092, 0, -0.0064, -0.0004);
      K.box(dark, 0.002, 0.0018, 0.0024, 0.002, 0.0071, 0.0044);
      K.cyl(dark, 0.0008, 0.0012, 0.0016, 0.002, 0.0084, 0.0044);
      K.cyl(alu, 0.00012, 0.00012, 0.0075, -0.003, 0.01, 0.004, 0.25, 0, 0);
      K.cyl(alu, 0.00045, 0.00045, 0.0044, 0, 0.0086, -0.003);
      K.group(0, 0.011, -0.003, -0.6, 0, 0, () => dish(0.0034, 0.0013));
    } else {
      // Compass G2 (defunct navigation satellite): box bus with an Earth-facing phased array, two small dishes, a whip antenna, a fourth panel on each wing
      // and a large apogee-motor bell aft.
      K.box(gold, 0.0129, 0.0129, 0.0009, 0, 0, -0.0026);
      K.box(dark, 0.0082, 0.0082, 0.0008, 0, 0, 0.0066);
      K.box(pan, 0.0074, 0.0074, 0.0013, 0, 0, 0.0074);
      K.cyl(alu, 0.0003, 0.0003, 0.011, -0.0022, -0.0092, -0.0035);
      K.cyl(dark, 0.0012, 0.0032, 0.0058, 0, 0, -0.0098, PI / 2, 0, 0, 14, true);
      for (const sg of [-1, 1]) {
        K.group(sg * 0.0043, 0.0074, 0.0012, -0.9, 0, 0, () => dish(0.0021, 0.0009));
        K.box(dark, 0.0012, 0.0012, 0.0012, sg * 0.0069, -0.0052, 0.004);
      }
      K.box(white, 0.009, 0.0004, 0.009, 0, 0.0064, -0.0004);
    }
    // yoke and wings (a tug carries three panels per wing, a navigation satellite four)
    const n = tug ? 3 : nav ? 4 : 2;
    for (const sg of [-1, 1]) {
      K.cyl(alu, 0.00035, 0.00035, 0.0052, sg * 0.009, 0, 0, 0, 0, PI / 2);
      K.box(alu, 0.0016, 0.0022, 0.0022, sg * 0.0066, 0, 0);
      K.box(alu, 0.0008, 0.0014, 0.0014, sg * 0.0115, 0, 0);
      for (let i = 0; i < n; i++) panel(sg * (0.015 + 0.0075 * i));
      if (tug) {
        K.box(dark, 0.0009, 0.0011, 0.0108, sg * 0.0198, 0, 0);
        K.box(white, 0.0004, 0.009, 0.011, sg * 0.0068, 0, 0.0004);
      }
    }
    const g = K.build();
    g.userData.body = g.userData.meshes.get(foil);
    g.userData.sat = true;
    if (tug) {
      // SJ-21 (tug): a second smaller dish on a short boom, and a generic grapple boom (illustrative: SWF does not describe any arm on SJ-21) that stows
      // folded and reaches toward its docking partner.
      const dk = this._mat(0x1c2233),
        boom = new T.Mesh(new T.CylinderGeometry(0.0003, 0.0003, 0.007, 8), this._mat(0xaab3c2, { metalness: 0.85, roughness: 0.38 })),
        dish2 = new T.Group();
      boom.position.set(0.0042, -0.0066, 0.0035);
      boom.rotation.z = -0.35;
      g.add(boom);
      const k2 = new Kit(T);
      k2.group(0.0054, -0.0102, 0.0035, PI + 0.5, 0, 0, () => {
        const pts = [];
        for (let i = 0; i <= 8; i++) pts.push(new T.Vector2((0.0022 * i) / 8, 0.0009 * (i / 8) ** 2));
        k2.geo(this._mat(0xeceff5, { side: T.DoubleSide, metalness: 0.3, roughness: 0.4 }), new T.LatheGeometry(pts, 20));
      });
      dish2.add(...k2.build().children);
      g.add(dish2);
      const arm = new T.Group(),
        armM = this._mat(0xffeaa8, { emissive: 0x6b5a1e }), // a light, warm boom that stands out from the grey bus
        seg = (x0, y0, x1, y1, r) => {
          const L = Math.hypot(x1 - x0, y1 - y0),
            q = new T.Mesh(new T.CylinderGeometry(r, r, L, 8), armM);
          q.rotation.z = Math.PI / 2 + Math.atan2(y1 - y0, x1 - x0);
          q.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
          arm.add(q);
        };
      seg(0.006, 0, 0.0135, 0.0036, 0.0011);
      seg(0.0135, 0.0036, 0.0225, 0, 0.0008);
      [0.006, 0.0135].forEach((x, i) => {
        const j = new T.Mesh(new T.BoxGeometry(0.003, 0.003, 0.003), dk);
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
        arm.scale.set(0.5 + 0.45 * f, 2.1, 2.1);
        T.Group.prototype.updateMatrixWorld.call(arm, force);
      };
    }
    if (halo) {
      // A glow behind a craft is drawn only when it carries state (a status colour, or the laser glow); otherwise the rim light does the separating.
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
    }
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
      K = new Kit(T),
      PI = Math.PI,
      gray = this._mat(0xc9ced9, { metalness: 0.55, roughness: 0.45 }),
      white = this._mat(0xf1f3f8, { metalness: 0.2, roughness: 0.45 }),
      gold = this._foil(0xd9b96a),
      alu = this._mat(0xaab3c2, { metalness: 0.85, roughness: 0.38 }),
      pan = this._panelMat({ color: 0xffd6a0 }),
      back = this._mat(0x818a9a, { metalness: 0.3, roughness: 0.6 }),
      array = (cx, cz, w, d) => {
        K.box(alu, w, 0.0004, d, cx, 0, cz);
        K.plane(pan, w - 0.0002, d - 0.0002, cx, 0.00022, cz, -PI / 2, 0, 0);
        K.plane(back, w - 0.0002, d - 0.0002, cx, -0.00022, cz, PI / 2, 0, 0);
      };
    K.box(gray, 0.11, 0.0022, 0.0022, 0, 0, 0.004);
    for (const s of [-1, 1]) {
      for (const x of [0.046, 0.027]) {
        K.box(gray, 0.0012, 0.0012, 0.0045, s * x, 0, 0.004);
        for (const e of [-1, 1]) array(s * x, 0.004 + e * 0.0105, 0.0074, 0.0165);
      }
      K.box(white, 0.0115, 0.0006, 0.0085, s * 0.0125, 0, -0.0042);
      K.box(alu, 0.0115, 0.0004, 0.0004, s * 0.0125, 0.0004, -0.0042);
    }
    K.cyl(white, 0.0034, 0.0034, 0.024, 0, 0, 0.001, PI / 2);
    K.cyl(white, 0.0027, 0.0027, 0.012, 0, 0, -0.0135, PI / 2);
    K.cyl(gray, 0.0025, 0.0025, 0.012, 0, 0, 0.0155, PI / 2);
    K.cyl(white, 0.0031, 0.0031, 0.014, 0, 0, 0.0255, PI / 2);
    K.cyl(white, 0.0022, 0.0022, 0.02, 0, 0, 0.0155, 0, 0, PI / 2);
    K.cyl(gold, 0.0017, 0.0017, 0.012, 0, 0.0038, 0.0255, 0, 0, PI / 2);
    K.ball(gray, 0.0038, 0, 0, 0.0155);
    const g = K.build();
    g.userData.body = g.userData.meshes.get(white);
    g.userData.iss = true;
    g.userData.tintMat = g.userData.body.material;
    Object.assign(g.userData, { span: 0.11, minPx: 24, maxPx: 62 });
    return g;
  },
  // Spaceplane (X-37B / CSSHQ class): a smooth tapered fuselage with a rounded nose, a dark windscreen and a payload-bay door, swept delta wings with tile
  // seams, twin canted tail fins and an engine bell; span about 0.046 (exaggerated). Nose along +z, up is +y.
  _planeModel(color, bright, halo) {
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI,
      body = this._mat(color, { metalness: 0.3, roughness: 0.45 }),
      white = this._mat(0xeef1f8, { metalness: 0.15, roughness: 0.45 }),
      dark = this._mat(0x2b3140, { metalness: 0.5, roughness: 0.5 }),
      glass = this._mat(0x060a14, { metalness: 0.9, roughness: 0.1 }),
      under = this._mat(new T.Color(color).multiplyScalar(0.5).getHex(), { metalness: 0.25, roughness: 0.55 }),
      deck = this._mat(new T.Color(color).lerp(new T.Color(0xffffff), 0.28).getHex(), { metalness: 0.2, roughness: 0.5 }),
      prof = [
        [0.0004, 0.0236],
        [0.0012, 0.0226],
        [0.0023, 0.02],
        [0.0033, 0.015],
        [0.0042, 0.008],
        [0.0049, 0.0],
        [0.0054, -0.009],
        [0.0056, -0.016],
        [0.0054, -0.0225],
      ].map(([r, y]) => new T.Vector2(r, y));
    K.geo(white, new T.LatheGeometry(prof, 24), 0, 0, 0, PI / 2, 0, 0, 1, 1, 0.78);
    K.box(glass, 0.003, 0.001, 0.005, 0, 0.0031, 0.0128);
    K.box(body, 0.0046, 0.001, 0.014, 0, 0.0046, -0.004);
    // Wing: a thick, bevelled slab in a darker shade of the national colour (its underside), with a smaller bright deck on top and a dark leading edge
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
    K.geo(
      under,
      new T.ExtrudeGeometry(shape(1), { depth: 0.0024, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 1 }),
      0,
      0.0004,
      0,
      PI / 2,
      0,
      0,
    );
    K.geo(deck, new T.ExtrudeGeometry(shape(0.8), { depth: 0.0006, bevelEnabled: false }), 0, 0.0007, -0.0012, PI / 2, 0, 0);
    // thermal-tile seams across the wing deck and a white dorsal spine
    for (const z of [-0.002, -0.0085]) K.box(dark, 0.0285 + z * 1.6, 0.0004, 0.0004, 0, 0.0012, z);
    K.box(white, 0.0016, 0.0008, 0.026, 0, 0.0063, 0);
    for (const s of [-1, 1]) {
      K.box(dark, 0.0007, 0.0007, 0.031, s * 0.0125, -0.0004, 0.0004, 0, s * 0.67, 0);
      K.box(body, 0.001, 0.009, 0.0095, s * 0.0042, 0.0075, -0.0165, 0, 0, -s * 0.38);
    }
    K.cyl(dark, 0.0026, 0.0032, 0.003, 0, 0, -0.0235, PI / 2);
    const g = K.build();
    g.userData.body = g.userData.meshes.get(under);
    g.userData.sat = true;
    if (halo) {
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
    }
    Object.assign(g.userData, { span: 0.046, minPx: 22, maxPx: 60 });
    return g;
  },
  // Airliner: white fuselage with a pointed nose and a tapered tail, swept wings, two engines, a tail fin and stabilisers. The airframe colour is the
  // aircraft's status colour (GNSS fine or lost).
  _aircraftModel(halo) {
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI,
      m = this._mat(0xe9edf7, { side: T.DoubleSide, metalness: 0.3, roughness: 0.4, emissive: 0x2a3140 }),
      dark = this._mat(0x2b3140, { metalness: 0.5, roughness: 0.5 }),
      sh = new T.Shape();
    sh.moveTo(0, 0.004);
    sh.lineTo(0.02, -0.006);
    sh.lineTo(0.02, -0.0085);
    sh.lineTo(0, -0.0035);
    sh.lineTo(-0.02, -0.0085);
    sh.lineTo(-0.02, -0.006);
    sh.closePath();
    K.cyl(m, 0.0022, 0.0022, 0.0225, 0, 0, 0.0006, PI / 2);
    K.cyl(m, 0.0002, 0.0022, 0.006, 0, 0, 0.0155, PI / 2);
    K.cyl(m, 0.0022, 0.0007, 0.0075, 0, 0, -0.0165, PI / 2);
    K.geo(m, new T.ShapeGeometry(sh), 0, 0, 0.002, PI / 2, 0, 0);
    for (const s of [-1, 1]) {
      K.cyl(dark, 0.0011, 0.0009, 0.0045, s * 0.0068, -0.0018, 0.0006, PI / 2);
      K.box(m, 0.0009, 0.0075, 0.006, s * 0.0035, 0.0035, -0.011, 0, 0, -s * 0.2);
    }
    K.box(m, 0.014, 0.0009, 0.004, 0, 0, -0.012);
    const g = K.build();
    g.userData.tintMat = m;
    if (halo) {
      const h = new T.Sprite(
        new T.SpriteMaterial({ map: this.spriteTex, color: 0xe9edf7, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }),
      );
      h.scale.setScalar(0.06);
      g.add(h);
      g.userData.halo = h;
    }
    Object.assign(g.userData, { span: 0.042, minPx: 19, maxPx: 44 });
    return g;
  },
  // Ground site: base plate, mast and a tilted dish (small pylon/dish glyph), standing on the local vertical.
  _siteModel(color, pos, halo) {
    const T = this.T,
      g = new T.Group(),
      m = this._mat(this._c(color), { side: T.DoubleSide, emissive: this._c(color), emissiveIntensity: 0.3 }),
      dm = this._mat(0xf2f4fa, { side: T.DoubleSide, emissive: 0x556070, metalness: 0.25, roughness: 0.4 });
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
    if (halo) {
      const h = new T.Sprite(
        new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending }),
      );
      h.scale.setScalar(0.04);
      h.position.y = 0.012;
      g.add(h);
      g.userData.halo = h;
    }
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
