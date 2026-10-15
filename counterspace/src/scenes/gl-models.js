// ============================================================================
// scenes/gl-models.js: GLHost mixin: the 3D craft and site models (satellite, ISS, spaceplane, aircraft, ground site, pin, jammer, ship) and the lights they use
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { norm } from './core.js';
import { foilCanvas } from './earth.js';

// A soft strip of foam for a ship's wake: bright at the start (v = 0), streaked, soft at both sides and gone at the far end (v = 1). Drawn once, in memory.
let wakeCv = null;
function wakeCanvas() {
  if (wakeCv) return wakeCv;
  const w = 64,
    h = 256,
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d'),
    im = g.createImageData(w, h),
    hash = (a, b) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
  for (let y = 0; y < h; y++) {
    const along = Math.pow(1 - y / (h - 1), 1.35);
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x - (w - 1) / 2) / (w / 2),
        side = Math.exp(-d * d * 3.4),
        streak = 0.62 + 0.38 * Math.sin(x * 0.85 + y * 0.03 + hash(Math.floor(x / 7), 3) * 6.28) * Math.sin(x * 0.37 - y * 0.021 + 1.3),
        a = Math.min(1, side * along * streak * 1.25);
      const i = (y * w + x) * 4;
      im.data[i] = 235;
      im.data[i + 1] = 244;
      im.data[i + 2] = 255;
      im.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(im, 0, 0);
  wakeCv = c;
  return c;
}

// Part kit: a craft is built from many small boxes, cylinders and swept shapes. Each part is placed with a position and rotation (inside optional nested
// groups), baked into its geometry, and all parts that share a material are merged into one mesh, so a whole craft costs a handful of draw calls.
export class Kit {
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
      const hasCol = list.every((ge) => ge.attributes.color),
        colA = hasCol ? new Float32Array(nv * 3) : null,
        pos = new Float32Array(nv * 3),
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
        if (hasCol) colA.set(ge.attributes.color.array, vo * 3);
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
      if (hasCol) bg.setAttribute('color', new T.BufferAttribute(colA, 3));
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

// A lofted body along +z from cross-sections {z, w, t, b, x, y}: half-width w, height t above and b below the centre (x, y), each section a superellipse. Closed at both ends.
export function lofted(T, secs, ring = 16, power = 2.6) {
  const n = secs.length,
    pos = new Float32Array((n * ring + 2) * 3),
    idx = [];
  for (let i = 0; i < n; i++) {
    const s = secs[i];
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2,
        c = Math.cos(a),
        sn = Math.sin(a),
        px = s.w * Math.sign(c) * Math.pow(Math.abs(c), 2 / power),
        py = (sn >= 0 ? s.t : s.b) * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / power);
      pos.set([(s.x || 0) + px, (s.y || 0) + py, s.z], (i * ring + j) * 3);
    }
  }
  const c0 = n * ring,
    c1 = c0 + 1;
  pos.set([secs[0].x || 0, secs[0].y || 0, secs[0].z], c0 * 3);
  pos.set([secs[n - 1].x || 0, secs[n - 1].y || 0, secs[n - 1].z], c1 * 3);
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j,
        b = i * ring + ((j + 1) % ring),
        c = (i + 1) * ring + j,
        d = (i + 1) * ring + ((j + 1) % ring);
      idx.push(a, c, b, b, c, d);
    }
  for (let j = 0; j < ring; j++) {
    idx.push(c0, j, (j + 1) % ring);
    idx.push(c1, (n - 1) * ring + ((j + 1) % ring), (n - 1) * ring + j);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.BufferAttribute(new Float32Array((n * ring + 2) * 2), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
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
    const fill = this.sim.cfg.fillK || 0; // a scene whose craft are often on their shadow side can add a neutral fill so they keep their colours
    this.ambient = new T.AmbientLight(fill ? 0xd5ddf2 : 0x9fb4ff, (spin ? 0.5 : 0.2) + fill);
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
  // Identifiable broad shapes only: NASA HEASARC P78-1 photograph and NASA ODQN 13(3), pp. 5–6.
  // Dimensions, attitude and motion remain illustrative; no invented instruments or appendages.
  _referenceSatModel(variant) {
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI;
    const metal = this._mat(0xc3cbd7, { metalness: 0.65, roughness: 0.48 });
    const foil = this._foil(0xd8b36a),
      panel = this._panelMat();
    const back = this._mat(0x566071, { metalness: 0.3, roughness: 0.65 });
    const array = (w, h, x, y, z, rx = 0) => {
      K.group(x, y, z, rx, 0, 0, () => {
        K.box(metal, w, h, 0.0005);
        K.plane(panel, w - 0.0004, h - 0.0004, 0, 0, 0.00027);
        K.plane(back, w - 0.0004, h - 0.0004, 0, 0, -0.00027, 0, PI, 0);
      });
    };
    if (variant === 'solwind') {
      // The wheel beneath a single upright sail is the defining outline in the photograph: a ribbed drum with rim rings and a dark deck, a framed
      // cell-gridded sail on two struts, a gold instrument box with a dark aperture, whip antennas and thruster nubs.
      // Opaque, matte materials: a metallic drum mirrors the cold blue environment and reads as glass, so the drum is painted aluminium (low metalness), wrapped in
      // gold thermal foil whose reflections are kept soft.
      const dark = this._mat(0x1b2029, { metalness: 0.3, roughness: 0.6 }),
        gold = this._foil(0xd8a64a, { metalness: 0.55, roughness: 0.5, bumpScale: 1.2 }),
        white = this._mat(0xe6e9f0, { metalness: 0.15, roughness: 0.5 }),
        drum = this._mat(0xc8ccd6, { metalness: 0.18, roughness: 0.55, emissive: 0x20242c, emissiveIntensity: 1 });
      const R = 0.0148;
      K.cyl(drum, R, R, 0.0072, 0, -0.0133, 0, 0, 0, 0, 40);
      for (let k = 0; k < 24; k++) {
        const angle = (k * PI) / 12;
        K.box(metal, 0.0004, 0.0074, 0.0004, Math.sin(angle) * R, -0.0133, Math.cos(angle) * R, 0, angle, 0);
      }
      K.cyl(dark, R * 0.97, R * 0.97, 0.0005, 0, -0.0094, 0, 0, 0, 0, 40); // the deck
      K.ring(metal, R, 0.0005, 0, -0.0097, 0, PI / 2);
      K.ring(metal, R, 0.0005, 0, -0.0169, 0, PI / 2);
      K.cyl(gold, R * 1.012, R * 1.012, 0.0030, 0, -0.0150, 0, 0, 0, 0, 40); // a band of gold thermal foil round the lower drum
      K.cyl(gold, R * 0.95, R * 0.95, 0.0012, 0, -0.0173, 0, 0, 0, 0, 40); // the gold base
      K.cyl(dark, 0.0034, 0.0042, 0.0008, 0, -0.0181, 0, 0, 0, 0, 20); // a thruster plate under it
      // sail: frame, cell glass (front) and back, a centre rib, two struts down to the deck
      K.group(0, 0.0062, -0.0020, 0, 0, 0, () => {
        const w = 0.0245,
          h = 0.0290;
        K.box(metal, w, h, 0.0005);
        K.plane(panel, w - 0.0012, h - 0.0012, 0, 0, 0.00029);
        K.plane(back, w - 0.0012, h - 0.0012, 0, 0, -0.00029, 0, PI, 0);
        K.box(metal, 0.0004, h, 0.0009, 0, 0, 0);
        for (const sx of [-1, 1]) K.box(metal, 0.0005, h, 0.0009, sx * w * 0.5, 0, 0);
        for (const sy of [-1, 1]) K.box(metal, w, 0.0005, 0.0009, 0, sy * h * 0.5, 0);
      });
      for (const sx of [-1, 1]) K.box(metal, 0.0005, 0.0075, 0.0005, sx * 0.0085, -0.0035, -0.0020, 0, 0, -sx * 0.18);
      // instruments on the deck: a gold box with a dark aperture, a smaller white box, whips
      K.box(gold, 0.0085, 0.0058, 0.0075, 0.0004, -0.0064, 0.0062);
      K.cyl(dark, 0.0020, 0.0020, 0.0009, 0.0004, -0.0060, 0.0104, PI / 2, 0, 0, 14);
      K.box(white, 0.0042, 0.0034, 0.0042, -0.0082, -0.0075, 0.0066);
      K.box(white, 0.0042, 0.0034, 0.0042, 0.0094, -0.0075, 0.0030);
      K.cyl(metal, 0.00018, 0.00018, 0.0140, 0.0088, 0.0032, -0.0050, 0.3, 0, -0.25);
      K.cyl(metal, 0.00018, 0.00018, 0.0100, -0.0092, -0.0008, 0.0010, -0.2, 0, 0.3);
      for (const a of [0, PI / 2, PI, -PI / 2]) K.box(dark, 0.0010, 0.0010, 0.0016, Math.sin(a) * 0.0155, -0.0150, Math.cos(a) * 0.0155, 0, a, 0);
    } else {
      // FY-1C: box body and two long solar arrays; detail beyond this is deliberately omitted.
      K.geo(foil, chamferBox(T, 0.009, 0.009, 0.009, 0.0006, 0.0002));
      K.box(metal, 0.044, 0.0006, 0.0006);
      array(0.016, 0.006, -0.014, 0, 0, -PI / 2);
      array(0.016, 0.006, 0.014, 0, 0, -PI / 2);
    }
    const g = K.build();
    if (variant === 'solwind') g.rotation.y = -Math.PI * 0.45; // an illustrative three-quarter attitude keeps the sail visible
    Object.assign(g.userData, { span: variant === 'solwind' ? 0.040 : 0.046, minPx: 15, maxPx: 50 });
    return g;
  },
  _satModel(color, halo, bright, variant) {
    if (variant === 'solwind' || variant === 'fengyun') return this._referenceSatModel(variant);
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
  // ISS: a long integrated truss with its rails, four solar-array masts (two blankets either side, each a pair of cell-gridded wings), white radiator panels, the
  // pressurised stack (Zvezda-Zarya-Unity-Destiny in line, Harmony/Columbus/Kibo crossing at the node), two small Russian arrays, a robotic arm and gold-foil
  // nodes. Truss along x (span 0.11), the modules and the blankets along z, up is +y.
  _issModel(color) {
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI,
      gray = this._mat(0xc4c9d4, { metalness: 0.55, roughness: 0.42 }),
      white = this._mat(0xf1f3f8, { metalness: 0.2, roughness: 0.45 }),
      gold = this._foil(0xd9b96a),
      alu = this._mat(0xaab3c2, { metalness: 0.85, roughness: 0.38 }),
      dark = this._mat(0x2a303c, { metalness: 0.5, roughness: 0.5 }),
      pan = this._panelMat({ color: 0x8c9fd8 }),
      back = this._mat(0x9a7a46, { metalness: 0.5, roughness: 0.55 }),
      blanket = (cx, cz, w, d) => {
        K.box(back, w, 0.0005, d, cx, 0, cz);
        K.plane(pan, w - 0.0004, d - 0.0004, cx, 0.00028, cz, -PI / 2, 0, 0);
        K.box(alu, w, 0.0006, 0.0004, cx, 0, cz + d / 2);
        K.box(alu, w, 0.0006, 0.0004, cx, 0, cz - d / 2);
      };
    // truss: a box beam with two rails and cross-struts
    K.box(gray, 0.112, 0.0030, 0.0030, 0, 0, 0.004);
    K.box(alu, 0.112, 0.0006, 0.0038, 0, 0.0017, 0.004);
    K.box(alu, 0.112, 0.0006, 0.0038, 0, -0.0017, 0.004);
    for (let i = -10; i <= 10; i++) K.box(gray, 0.0005, 0.0034, 0.0040, i * 0.0052, 0, 0.004);
    // arrays: a mast along z with two blankets on each side of it, one pair each way
    for (const s of [-1, 1])
      for (const x of [0.0475, 0.0275]) {
        K.box(gray, 0.0012, 0.0012, 0.078, s * x, 0, 0.004);
        for (const e of [-1, 1])
          for (const b of [-1, 1]) blanket(s * x + b * 0.0046, 0.004 + e * 0.0215, 0.0082, 0.0330);
        K.cyl(gold, 0.0020, 0.0020, 0.0030, s * x, 0, 0.004, 0, 0, PI / 2); // the rotary joint
      }
    // radiators: white panels either side of the centre, behind the truss
    for (const s of [-1, 1]) {
      K.box(white, 0.0150, 0.0006, 0.0110, s * 0.0120, 0, -0.0062);
      K.box(alu, 0.0150, 0.0004, 0.0004, s * 0.0120, 0.0004, -0.0062);
      K.box(gray, 0.0012, 0.0012, 0.0050, s * 0.0120, 0, -0.0010);
    }
    // pressurised stack along z, the crossing node, the Japanese and European laboratories, Russian service module and its two arrays, the arm
    K.cyl(white, 0.0040, 0.0040, 0.0260, 0, 0, 0.0090, PI / 2);
    K.cyl(white, 0.0031, 0.0031, 0.0140, 0, 0, -0.0160, PI / 2);
    K.cyl(gray, 0.0029, 0.0029, 0.0120, 0, 0, 0.0270, PI / 2);
    K.cyl(white, 0.0036, 0.0036, 0.0130, 0, 0, 0.0365, PI / 2);
    K.cyl(white, 0.0025, 0.0025, 0.0230, 0, 0, 0.0270, 0, 0, PI / 2);
    K.cyl(gold, 0.0020, 0.0020, 0.0100, 0, 0.0046, 0.0360, 0, 0, PI / 2);
    K.ball(gray, 0.0042, 0, 0, 0.0270);
    K.cyl(dark, 0.0033, 0.0033, 0.0006, 0, 0, -0.0235, PI / 2);
    for (const s of [-1, 1]) {
      K.box(white, 0.0090, 0.0004, 0.0150, s * 0.0070, 0.0030, -0.0160);
      K.plane(pan, 0.0086, 0.0146, s * 0.0070, 0.0033, -0.0160, -PI / 2, 0, 0);
    }
    K.cyl(alu, 0.0003, 0.0003, 0.0230, 0.0045, 0.0062, 0.0200, 0.4, 0, 0);
    K.cyl(alu, 0.0003, 0.0003, 0.0150, 0.0060, 0.0100, 0.0310, -0.6, 0, 0);
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
      body = this._mat(new T.Color(0xdfe3ec).lerp(new T.Color(color), 0.08).getHex(), { metalness: 0.45, roughness: 0.34 }),
      white = new T.MeshPhysicalMaterial({ color: 0xc4cad6, metalness: 0.45, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 1.3 }),
      tile = this._mat(0x14171f, { metalness: 0.25, roughness: 0.7 }), // black thermal tiles of the underside
      foil = this._mat(0xc99a3e, { metalness: 0.95, roughness: 0.28 }), // gold foil accents
      nose = this._mat(0x1b1f29, { metalness: 0.4, roughness: 0.4 }),
      dark = this._mat(0x2b3140, { metalness: 0.5, roughness: 0.5 }),
      glass = this._mat(0x060a14, { metalness: 0.9, roughness: 0.1 }),
      under = this._mat(new T.Color(color).lerp(new T.Color(0x0c0e14), 0.9).getHex(), { metalness: 0.5, roughness: 0.42 }),
      deck = this._mat(0xd2d7e1, { metalness: 0.4, roughness: 0.34 }),
      rim = (m) => {
        m.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace(
            '#include <dithering_fragment>',
            'float rimK = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 3.0);\n gl_FragColor.rgb += vec3(0.55, 0.68, 0.95) * rimK * 0.45;\n #include <dithering_fragment>',
          );
        };
        return m;
      },
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
    rim(white);
    rim(deck);
    rim(body);
    // Fuselage: a smooth rounded lathe (flattened), white above; a darker, slightly wider lower hull gives the dark tile belly
    K.geo(white, new T.LatheGeometry(prof, 40), 0, 0.0004, 0, PI / 2, 0, 0, 1.12, 1, 0.72);
    K.geo(under, new T.LatheGeometry(prof, 32), 0, -0.0012, 0, PI / 2, 0, 0, 1.2, 1, 0.4);
    K.geo(nose, new T.SphereGeometry(0.0018, 14, 10), 0, -0.0002, 0.0216, 0, 0, 0, 1, 0.75, 1.3);
    K.geo(glass, new T.SphereGeometry(0.0015, 12, 8), 0, 0.0027, 0.0146, 0, 0, 0, 1.2, 0.5, 2.2);
    // Payload-bay doors: a long recessed panel on the back with a centre seam and two hinge lines
    K.geo(deck, new T.CapsuleGeometry(0.0021, 0.015, 4, 12), 0, 0.0043, -0.0034, PI / 2, 0, 0, 1, 1, 0.22);
    K.box(dark, 0.00018, 0.00022, 0.0172, 0, 0.0049, -0.0034);
    for (const z of [-0.0098, 0.003]) K.box(dark, 0.0042, 0.00018, 0.00018, 0, 0.0047, z);
    // Wing: a thin rounded slab (generous bevel), dark below with a pale deck on top, set low on the rear body
    const shape = (k) => {
      const q = new T.Shape();
      q.moveTo(0.0046 * k, 0.0078 * k);
      q.quadraticCurveTo(0.0098 * k, -0.0012 * k, 0.0112 * k, -0.0108 * k);
      q.lineTo(0.0112 * k, -0.0174 * k);
      q.lineTo(-0.0112 * k, -0.0174 * k);
      q.lineTo(-0.0112 * k, -0.0108 * k);
      q.quadraticCurveTo(-0.0098 * k, -0.0012 * k, -0.0046 * k, 0.0078 * k);
      q.closePath();
      return q;
    };
    K.geo(
      under,
      new T.ExtrudeGeometry(shape(1), { depth: 0.0008, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0007, bevelSegments: 2, curveSegments: 6 }),
      0,
      -0.0016,
      0,
      PI / 2,
      0,
      0,
    );
    K.geo(
      deck,
      new T.ExtrudeGeometry(shape(0.86), { depth: 0.0004, bevelEnabled: true, bevelThickness: 0.0003, bevelSize: 0.0004, bevelSegments: 2, curveSegments: 6 }),
      0,
      -0.0007,
      -0.0004,
      PI / 2,
      0,
      0,
    );
    // Tail: two small tapered fins canted outward (the X-37B's V tail), white with a dark tip
    const fin = new T.Shape();
    fin.moveTo(0, 0);
    fin.lineTo(0.0124, 0);
    fin.lineTo(0.0092, 0.0074);
    fin.lineTo(0.0044, 0.0074);
    fin.closePath();
    for (const s of [-1, 1]) {
      K.group(s * 0.0034, 0.0016, -0.0245, 0, 0, -s * 0.5, () => {
        K.geo(
          white,
          new T.ExtrudeGeometry(fin, { depth: 0.0007, bevelEnabled: true, bevelThickness: 0.0002, bevelSize: 0.0002, bevelSegments: 2 }),
          -0.00035,
          0,
          0,
          0,
          PI / 2,
          0,
        );
        K.box(dark, 0.0009, 0.0004, 0.0044, 0, 0.0074, -0.0068);
      });
    }
    K.cyl(dark, 0.0022, 0.003, 0.003, 0, 0, -0.0242, PI / 2);
    const g = K.build();
    g.userData.body = g.userData.meshes.get(under);
    g.userData.sat = true;
    // Engine glow: a small additive blue-white bloom behind the engine bell
    const eg = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: 0x9fc8ff, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }),
    );
    eg.scale.setScalar(0.011);
    eg.position.set(0, 0, -0.0262);
    g.add(eg);
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
  // A generic winged vehicle (variant 'winged', used for China's CSSHQ): the sources show a winged spacecraft and no more, so this is a plain slim
  // fuselage on a broad swept delta wing, with no tail fins, payload doors or surface detail. Clearly not the X-37B's short wings and twin tail.
  _wingedModel(color, bright, halo) {
    // Lifting-body hull: a broad, flat-bellied body with a domed, lighter top and a dark underside, blended into short swept wings. Nose along +z.
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI,
      top = this._mat(new T.Color(0xe6e9f0).lerp(new T.Color(color), 0.16).getHex(), { metalness: 0.35, roughness: 0.36 }),
      topShade = this._mat(new T.Color(0xaeb6c6).lerp(new T.Color(color), 0.18).getHex(), { metalness: 0.4, roughness: 0.42 }),
      under = this._mat(new T.Color(color).lerp(new T.Color(0x0a0c12), 0.86).getHex(), { metalness: 0.5, roughness: 0.46 }),
      dark = this._mat(0x232938, { metalness: 0.5, roughness: 0.5 }),
      rimm = (m) => {
        m.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace(
            '#include <dithering_fragment>',
            'float rimK = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 3.0);\n gl_FragColor.rgb += vec3(0.5, 0.62, 0.9) * rimK * 0.4;\n #include <dithering_fragment>',
          );
        };
        return m;
      },
      prof = [
        [0.0003, 0.0262],
        [0.0014, 0.0248],
        [0.0027, 0.021],
        [0.0038, 0.014],
        [0.0044, 0.005],
        [0.0046, -0.006],
        [0.0044, -0.016],
        [0.0038, -0.0225],
      ].map(([r, y]) => new T.Vector2(r, y));
    rimm(top);
    rimm(topShade);
    K.geo(top, new T.LatheGeometry(prof, 40), 0, 0.0004, 0, PI / 2, 0, 0, 2.0, 1.0, 0.62); // domed, broad upper hull
    K.geo(under, new T.LatheGeometry(prof, 40), 0, -0.0007, 0, PI / 2, 0, 0, 2.15, 1.0, 0.4); // flatter, dark underside that shows at the edges
    // Short, thick swept wings blended into the hull: a dark underside slab and a mid-grey deck, with a dark trailing flap
    const wing = (k) => {
      const q = new T.Shape();
      q.moveTo(0.0052 * k, 0.0098 * k);
      q.lineTo(0.0125 * k, -0.014 * k);
      q.lineTo(0.0125 * k, -0.0192 * k);
      q.lineTo(-0.0125 * k, -0.0192 * k);
      q.lineTo(-0.0125 * k, -0.014 * k);
      q.lineTo(-0.0052 * k, 0.0098 * k);
      q.closePath();
      return q;
    };
    K.geo(
      under,
      new T.ExtrudeGeometry(wing(1), { depth: 0.0016, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0005, bevelSegments: 2 }),
      0,
      -0.0017,
      0,
      PI / 2,
      0,
      0,
    );
    K.geo(
      topShade,
      new T.ExtrudeGeometry(wing(0.93), { depth: 0.0005, bevelEnabled: true, bevelThickness: 0.0002, bevelSize: 0.0002, bevelSegments: 1 }),
      0,
      -0.0004,
      -0.0004,
      PI / 2,
      0,
      0,
    );
    K.box(dark, 0.0058, 0.0004, 0.0034, 0, 0.0021, 0.0148); // a plain dark patch at the nose end (no cockpit claim)
    for (const s of [-1, 1]) K.box(dark, 0.0072, 0.0004, 0.0022, s * 0.0078, -0.0003, -0.0172); // trailing-edge flaps
    K.cyl(dark, 0.0024, 0.003, 0.0028, 0, 0, -0.0238, PI / 2);
    const g = K.build();
    g.userData.body = g.userData.meshes.get(under);
    g.userData.sat = true;
    const eg = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: 0xffc89f, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending }),
    );
    eg.scale.setScalar(0.011);
    eg.position.set(0, 0, -0.0268);
    g.add(eg);
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
  _aircraftModel(halo, fighter) {
    if (fighter) return this._fighterModel();
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
      // a soft dark shadow under the airframe so it holds against bright land and the red zone
      const sd = new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: 0x050810, transparent: true, opacity: 0.6, depthWrite: false }));
      sd.scale.setScalar(0.05);
      sd.position.y = -0.003;
      sd.renderOrder = -1;
      g.add(sd);
    }
    Object.assign(g.userData, { span: 0.042, minPx: 19, maxPx: 44 });
    return g;
  },
  // Twin-engine air-superiority fighter (the F-15 of the Solwind test), nose along +z, wings along x, up +y, drawn at the airliner's overall size so labels hold:
  // a lofted fuselage (pointed radome, bubble canopy and spine, wide mid-section, twin engine tubes), box intakes under the wing roots, thick swept clipped wings
  // with flap panels, two all-moving tailplanes, two tall canted fins and two open nozzles with an afterburner glow. Broad shape only (no markings, no weapons:
  // the missile is drawn by the scene).
  _fighterModel() {
    const T = this.T,
      K = new Kit(T),
      PI = Math.PI,
      skin = this._mat(0x727d91, { side: T.DoubleSide, metalness: 0.32, roughness: 0.46, emissive: 0x0e131c }),
      belly = this._mat(0x4a5467, { side: T.DoubleSide, metalness: 0.3, roughness: 0.5, emissive: 0x0a0e15 }),
      panel = this._mat(0x5b6679, { side: T.DoubleSide, metalness: 0.3, roughness: 0.5, emissive: 0x0a0e15 }),
      fin = this._mat(0x626d82, { side: T.DoubleSide, metalness: 0.3, roughness: 0.48, emissive: 0x0c1119 }),
      dark = this._mat(0x14171f, { side: T.DoubleSide, metalness: 0.5, roughness: 0.5 }),
      radome = this._mat(0x3a4150, { metalness: 0.4, roughness: 0.38 }),
      metal = this._mat(0x9aa2b0, { side: T.DoubleSide, metalness: 0.85, roughness: 0.34 }),
      burnt = this._mat(0x3c3430, { side: T.DoubleSide, metalness: 0.7, roughness: 0.5, emissive: 0xff5a14, emissiveIntensity: 0.55 }),
      glass = this._mat(0x1d2f55, { metalness: 0.95, roughness: 0.08, emissive: 0x0a1630, envMapIntensity: 1.6 });
    // a flat plate from a polygon: shape (x, y) becomes (x, z) on the horizontal plane, thick in y
    const slab = (pts, th, bev = 0.00008) => {
      const sh = new T.Shape();
      pts.forEach((q, i) => (i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1])));
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1 });
      g.translate(0, 0, -th / 2);
      g.rotateX(PI / 2); // shape y becomes z; thickness becomes y
      return g;
    };
    const mirror = (pts) => pts.map(([x, z]) => [-x, z]).reverse();
    // fuselage: sections along z, each with a half-width and a top and bottom height (superellipse in between)
    const body = lofted(T, [
      { z: 0.0222, w: 0.00008, t: 0.00008, b: 0.00008 },
      { z: 0.0212, w: 0.0005, t: 0.0005, b: 0.0004 },
      { z: 0.0192, w: 0.0012, t: 0.0012, b: 0.001 },
      { z: 0.0160, w: 0.0020, t: 0.0019, b: 0.0015 },
      { z: 0.0120, w: 0.0027, t: 0.0021, b: 0.0019 },
      { z: 0.0070, w: 0.0037, t: 0.0018, b: 0.0023 },
      { z: 0.0000, w: 0.0048, t: 0.0016, b: 0.0024 },
      { z: -0.0070, w: 0.0052, t: 0.0014, b: 0.0023 },
      { z: -0.0140, w: 0.0046, t: 0.0013, b: 0.0020 },
      { z: -0.0195, w: 0.0040, t: 0.0011, b: 0.0016 },
    ]);
    K.geo(skin, body);
    // dark radome tip over the nose (a short lofted cap), pitot boom
    K.geo(radome, lofted(T, [
      { z: 0.0226, w: 0.00006, t: 0.00006, b: 0.00006 },
      { z: 0.0212, w: 0.0005, t: 0.0005, b: 0.0004 },
      { z: 0.0190, w: 0.0013, t: 0.0013, b: 0.0011 },
      { z: 0.0170, w: 0.0017, t: 0.0016, b: 0.0013 },
    ]));
    K.cyl(metal, 0.00009, 0.00005, 0.0042, 0, 0, 0.0245, PI / 2);
    // belly: a darker keel under the centre section
    K.geo(belly, lofted(T, [
      { z: 0.0100, w: 0.0016, t: 0.0001, b: 0.0004, y: -0.0022 },
      { z: 0.0020, w: 0.0030, t: 0.0001, b: 0.0006, y: -0.0027 },
      { z: -0.0080, w: 0.0030, t: 0.0001, b: 0.0006, y: -0.0026 },
      { z: -0.0160, w: 0.0020, t: 0.0001, b: 0.0004, y: -0.0021 },
    ]));
    // dorsal spine and canopy: a low ridge from the cockpit to the tail, the glass bubble over the cockpit and its dark frame
    K.geo(panel, lofted(T, [
      { z: 0.0040, w: 0.0008, t: 0.0004, b: 0.0001, y: 0.0019 },
      { z: -0.0020, w: 0.0016, t: 0.0007, b: 0.0001, y: 0.0019 },
      { z: -0.0090, w: 0.0020, t: 0.0008, b: 0.0001, y: 0.0016 },
      { z: -0.0160, w: 0.0012, t: 0.0004, b: 0.0001, y: 0.0014 },
    ]));
    K.geo(glass, new T.SphereGeometry(0.0017, 18, 12), 0, 0.0020, 0.0100, 0, 0, 0, 0.82, 0.78, 2.7);
    K.geo(dark, new T.TorusGeometry(0.0014, 0.00014, 5, 18, PI), 0, 0.0021, 0.0057, 0, 0, 0, 1, 0.9, 1); // canopy arch (rear)
    K.box(dark, 0.0001, 0.0001, 0.0092, 0.00115, 0.0022, 0.0098, 0, 0, 0, 1, 1, 1);
    K.box(dark, 0.0001, 0.0001, 0.0092, -0.00115, 0.0022, 0.0098, 0, 0, 0, 1, 1, 1);
    // airbrake plate behind the canopy
    K.box(panel, 0.0020, 0.00025, 0.0034, 0, 0.0027, -0.0042);
    // engines and nozzles, side by side at the tail
    for (const x of [-1, 1]) {
      K.cyl(skin, 0.0021, 0.0021, 0.0096, x * 0.0026, -0.0003, -0.0132, PI / 2, 0, 0, 16);
      K.cyl(burnt, 0.0016, 0.0019, 0.0030, x * 0.0026, -0.0003, -0.0201, PI / 2, 0, 0, 16, true);
      K.cyl(dark, 0.0013, 0.0013, 0.0002, x * 0.0026, -0.0003, -0.0190, PI / 2, 0, 0, 14);
      K.cyl(metal, 0.0020, 0.0020, 0.0003, x * 0.0026, -0.0003, -0.0216, PI / 2, 0, 0, 16, true);
      // boxy intakes below the wing roots: a sloped front with a dark mouth and a bright lip
      K.geo(skin, lofted(T, [
        { z: 0.0082, w: 0.0010, t: 0.0003, b: 0.0004, x: x * 0.0043, y: -0.0019 },
        { z: 0.0060, w: 0.0013, t: 0.0007, b: 0.0010, x: x * 0.0043, y: -0.0018 },
        { z: 0.0000, w: 0.0016, t: 0.0010, b: 0.0013, x: x * 0.0046, y: -0.0017 },
        { z: -0.0060, w: 0.0018, t: 0.0012, b: 0.0014, x: x * 0.0048, y: -0.0014 },
      ], 4));
      K.box(dark, 0.0017, 0.0019, 0.0002, x * 0.0043, -0.0019, 0.0083);
      K.box(metal, 0.0020, 0.00018, 0.00035, x * 0.0043, -0.0030, 0.0081);
    }
    // wings: swept, clipped at the tip, slightly drooped, with a flap panel on each trailing edge
    const wing = [[0.0040, 0.0052], [0.0150, -0.0032], [0.0150, -0.0087], [0.0040, -0.0106]];
    const flap = [[0.0050, -0.0074], [0.0102, -0.0080], [0.0102, -0.0092], [0.0050, -0.0102]];
    for (const x of [-1, 1]) {
      K.group(0, 0.0000, 0, 0, 0, -x * 0.035, () => {
        K.geo(skin, slab(x > 0 ? wing : mirror(wing), 0.00065), 0, 0.0001, 0);
        K.geo(panel, slab(x > 0 ? flap : mirror(flap), 0.0001), 0, 0.00048, 0);
        // wing-tip rail
        K.box(dark, 0.00028, 0.0003, 0.0036, x * 0.0149, 0.0001, -0.0057);
      });
    }
    // all-moving tailplanes
    const tp = [[0.0044, -0.0128], [0.0108, -0.0164], [0.0108, -0.0196], [0.0044, -0.0200]];
    for (const x of [-1, 1]) K.geo(fin, slab(x > 0 ? tp : mirror(tp), 0.0004), 0, -0.0004, 0);
    // twin fins, canted outwards
    const fpoly = [[-0.0092, 0.0008], [-0.0142, 0.0082], [-0.0190, 0.0082], [-0.0206, 0.0008]];
    const finGeo = () => {
      const sh = new T.Shape();
      fpoly.forEach((q, i) => (i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1])));
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 0.00045, bevelEnabled: true, bevelThickness: 0.00007, bevelSize: 0.00007, bevelSegments: 1 });
      g.translate(0, 0, -0.000225);
      g.rotateY(PI / 2); // shape x runs along z, shape y up, thickness across
      g.scale(1, 1, -1);
      return g;
    };
    for (const x of [-1, 1]) {
      K.group(x * 0.0034, 0.0006, 0, 0, 0, -x * 0.1, () => {
        K.geo(fin, finGeo());
        K.box(dark, 0.0005, 0.0004, 0.0044, 0, 0.0084, -0.0166); // fin-tip pod
      });
    }
    const g = K.build();
    // afterburner: a hot white-yellow core and an orange sheath behind each nozzle (additive, fading to black along the length), plus a small glow
    const cone = (r, len, c0, c1) => {
      const geo = new T.ConeGeometry(r, len, 14, 1, true),
        pos = geo.attributes.position,
        col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const u = 1 - (pos.getY(i) + len / 2) / len, // 0 at the tail tip, 1 at the nozzle
          c = [c1[0] + (c0[0] - c1[0]) * u * u, c1[1] + (c0[1] - c1[1]) * u * u, c1[2] + (c0[2] - c1[2]) * u * u];
        col.set(c, 3 * i);
      }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      geo.rotateX(-PI / 2); // tip towards -z
      geo.translate(0, 0, -len / 2);
      return new T.Mesh(
        geo,
        new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, opacity: 0.9 }),
      );
    };
    // Each flame is a plume with volume: a short orange sheath (the cone, fading to black along its length) and a chain of soft additive blobs down the axis, wide and
    // red-orange at the tail and narrow, yellow and white near the nozzle, so it glows like a lit exhaust and does not read as a flat pale cone. A hot white core
    // sits at the nozzle, with a glow round it. gl-host flickers the length (`flames` and each flame's `blobs`).
    const flames = [];
    const blob = (c, op) => new T.Sprite(new T.SpriteMaterial({ map: this.spriteTex, color: c, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending }));
    for (const x of [-1, 1]) {
      const f = new T.Group();
      f.position.set(x * 0.0026, -0.0003, -0.0218);
      const sheath = cone(0.0017, 0.0150, [0.95, 0.38, 0.08], [0.1, 0.01, 0.0]);
      sheath.material.opacity = 0.55;
      f.add(sheath);
      const blobs = [];
      // [distance behind the nozzle, size, colour, opacity]
      for (const [z, sz, c, op] of [
        [0.0005, 0.0042, 0xfff1c8, 0.95],
        [0.0030, 0.0054, 0xffc060, 0.8],
        [0.0058, 0.0062, 0xff8a28, 0.62],
        [0.0088, 0.0066, 0xf0561a, 0.46],
        [0.0120, 0.0062, 0xc83a12, 0.3],
        [0.0152, 0.0052, 0x8c2810, 0.18],
      ]) {
        const b = blob(c, op);
        b.scale.setScalar(sz);
        b.position.z = -z;
        b.userData = { z, sz, op };
        f.add(b);
        blobs.push(b);
      }
      const core = new T.Mesh(
        new T.ConeGeometry(0.00085, 0.0075, 12, 1, true).rotateX(-PI / 2).translate(0, 0, -0.00375),
        new T.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }),
      ); // the hot core
      f.add(core);
      const h = blob(0xffa860, 0.7);
      h.scale.setScalar(0.015);
      h.position.z = -0.001;
      f.add(h);
      f.userData.blobs = blobs;
      g.add(f);
      flames.push(f);
    }
    g.userData.flames = flames;
    g.userData.tintMat = this._mat(0xffffff); // the status colour of an airliner does not apply: the livery keeps its greys
    Object.assign(g.userData, { span: 0.0446, minPx: 19, maxPx: 44 });
    return g;
  },
  // Ground site: base plate, mast and a tilted dish (small pylon/dish glyph), standing on the local vertical.
  _siteModel(color, pos, halo) {
    const T = this.T,
      g = new T.Group(),
      m = this._mat(this._c(color), { side: T.DoubleSide, emissive: this._c(color), emissiveIntensity: 0.3 }),
      dm = this._mat(0xf2f4fa, { side: T.DoubleSide, emissive: 0x556070, metalness: 0.25, roughness: 0.4 });
    // a ground station that reads as one from any side: a dark plinth with a ring in the site's colour, a tapered mast and a real concave dish on a short yoke
    // (a pale bowl with a darker inside and a bright rim), a feed on two struts. (A white hemisphere on a white disc read as a snowman from above.)
    const plinth = this._mat(0x3c4556, { metalness: 0.4, roughness: 0.6 }),
      bowOut = this._mat(0xcfd5e2, { side: T.DoubleSide, metalness: 0.35, roughness: 0.42, emissive: 0x1a2030 }),
      bowIn = this._mat(0x6c7689, { side: T.DoubleSide, metalness: 0.4, roughness: 0.5 });
    const base = new T.Mesh(new T.CylinderGeometry(0.0082, 0.0092, 0.0020, 14), plinth);
    g.add(base);
    const bring = new T.Mesh(new T.TorusGeometry(0.0087, 0.00055, 6, 24), m);
    bring.rotation.x = Math.PI / 2;
    bring.position.y = 0.0012;
    g.add(bring);
    const mast = new T.Mesh(new T.CylinderGeometry(0.0012, 0.0019, 0.0150, 8), m);
    mast.position.y = 0.0085;
    g.add(mast);
    const R = 0.0088,
      dep = 0.0036,
      pts = [],
      pts2 = [];
    for (let i = 0; i <= 10; i++) {
      pts.push(new T.Vector2((R * i) / 10, dep * (i / 10) ** 2));
      pts2.push(new T.Vector2((R * 0.96 * i) / 10, dep * (i / 10) ** 2 + 0.0004));
    }
    const dish = new T.Group();
    dish.add(new T.Mesh(new T.LatheGeometry(pts, 20), bowOut));
    dish.add(new T.Mesh(new T.LatheGeometry(pts2, 20), bowIn));
    const rim = new T.Mesh(new T.TorusGeometry(R, 0.00042, 5, 24), dm);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = dep;
    dish.add(rim);
    for (const sx of [-1, 1]) {
      const st = new T.Mesh(new T.CylinderGeometry(0.00022, 0.00022, 0.0105, 4), dm);
      st.position.set(sx * R * 0.5, dep + 0.0042, 0);
      st.rotation.z = -sx * 0.5;
      dish.add(st);
    }
    const feed = new T.Mesh(new T.CylinderGeometry(0.0005, 0.0003, 0.0022, 6), m);
    feed.position.y = dep + 0.0092;
    dish.add(feed);
    dish.position.y = 0.0168;
    dish.rotation.order = 'YXZ';
    dish.rotation.y = 0.95; // turned about the mast so no view looks straight into the bowl (that read as a ball)
    dish.rotation.x = -0.7;
    g.add(dish);
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
  // Map pin (Peresvet shelter sites): a flat target on the ground (ring, tinted disc, centred bright dot), clearly bigger than a dish and with no beam implied.
  _pinModel(color, pos) {
    const T = this.T,
      g = new T.Group(),
      m = new T.MeshBasicMaterial({ color: this._c(color), side: T.DoubleSide, transparent: true, opacity: 0.8 }), // rings 20% softer
      w = new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide });
    const ring = new T.Mesh(new T.RingGeometry(0.014, 0.019, 28), m);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0005;
    g.add(ring);
    // a translucent disc inside the ring and a bright dot at its exact centre: the marker reads as one target seen from any angle
    const fill = new T.Mesh(
      new T.CircleGeometry(0.0145, 28),
      new T.MeshBasicMaterial({ color: this._c(color), transparent: true, opacity: 0.38, side: T.DoubleSide, depthWrite: false }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.0004;
    g.add(fill);
    const core = new T.Mesh(new T.CircleGeometry(0.0062, 20), w);
    core.rotation.x = -Math.PI / 2;
    core.position.y = 0.0007;
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
      dark = this._mat(0x2b3140, { metalness: 0.5, roughness: 0.5 }),
      body = this._mat(0x4a5266, { metalness: 0.3, roughness: 0.55 }),
      lite = this._mat(0xb8c0d0, { metalness: 0.5, roughness: 0.4 }),
      glass = this._mat(0x0b1020, { metalness: 0.8, roughness: 0.15 });
    // a dark flat-bed truck: the cab is slate with a dark windscreen (no white block), the bed carries the transmitter
    const bed = new T.Mesh(new T.BoxGeometry(0.016, 0.0045, 0.0065), dark);
    bed.position.set(-0.0015, 0.0036, 0);
    g.add(bed);
    const cab = new T.Mesh(new T.BoxGeometry(0.0055, 0.0058, 0.0065), body);
    cab.position.set(0.0083, 0.0041, 0);
    g.add(cab);
    const ws = new T.Mesh(new T.BoxGeometry(0.0006, 0.0028, 0.0054), glass);
    ws.position.set(0.0111, 0.0054, 0);
    g.add(ws);
    const box = new T.Mesh(new T.BoxGeometry(0.0075, 0.0032, 0.0052), body);
    box.position.set(-0.0035, 0.0074, 0);
    g.add(box);
    for (const x of [-0.005, 0.0, 0.0085]) {
      const w = new T.Mesh(new T.CylinderGeometry(0.0019, 0.0019, 0.0075, 10), dark);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.0019, 0);
      g.add(w);
    }
    // a mast about twice the old height with two cross-arms and a bright beacon on top
    const mast = new T.Mesh(new T.CylinderGeometry(0.0006, 0.001, 0.058, 6), lite);
    mast.position.set(-0.004, 0.037, 0);
    g.add(mast);
    for (const [y, w] of [
      [0.063, 0.014],
      [0.054, 0.0105],
      [0.045, 0.008],
    ]) {
      const bar = new T.Mesh(new T.BoxGeometry(0.0007, 0.0007, w), m);
      bar.position.set(-0.004, y, 0);
      g.add(bar);
    }
    const tip = new T.Sprite(
      new T.SpriteMaterial({ map: this.spriteTex, color: this._c(color), transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending }),
    );
    tip.scale.setScalar(0.02);
    tip.position.set(-0.004, 0.067, 0);
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
      r.position.set(-0.004, 0.066, 0);
      g.add(r);
      return r;
    });
    g.userData.rings = rings;
    g.userData.tintMat = m;
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    Object.assign(g.userData, { span: 0.07, minPx: 50, maxPx: 96 });
    return g;
  },
  // Guided-missile cruiser (Ticonderoga class, about 10:1 hull): pointed-bow hull extrusion, dark deck, forward and aft deckhouses with a mast, two
  // stacks, a gun and a helicopter pad.
  _shipModel(pos, o = {}) {
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
    if (o.shade) return this._warshipModel(pos);
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
  // Opt-in warship (ship actor `shade`; Burnt Frost's USS Lake Erie), drawn for a reader who has never seen one: a wide, dark-grey hull on a darker waterline band, a
  // raised forecastle at the bow (the sheer), a pale deck stripe, a layered superstructure (deckhouse, bridge, mast with a radar, two funnels, a gun, a helicopter
  // ring) and white water: a bow wave, a foam outline round the hull and a V wake astern. About as long as the old model (stern -0.036, bow 0.042) so labels hold.
  _warshipModel(pos) {
    const T = this.T,
      g = new T.Group();
    const hw = (z) => {
      if (z < -0.02) return 0.0057 + ((z + 0.036) / 0.016) * 0.0015;
      if (z < 0.01) return 0.0072;
      const u = Math.min(1, (z - 0.01) / 0.032);
      return 0.0072 * Math.pow(1 - Math.pow(u, 1.7), 0.9);
    };
    // the plan of the hull between two stations, `inset` narrower on each side (an x, z outline; ExtrudeGeometry reads it as x, y)
    const plan = (za, zb, inset = 0, grow = 1) => {
      const sh = new T.Shape(),
        n = 22,
        zs = Array.from({ length: n + 1 }, (_, i) => za + ((zb - za) * i) / n);
      zs.forEach((z, i) => (i ? sh.lineTo(Math.max(0, hw(z) * grow - inset), z) : sh.moveTo(Math.max(0, hw(z) * grow - inset), z)));
      [...zs].reverse().forEach((z) => sh.lineTo(-Math.max(0, hw(z) * grow - inset), z));
      sh.closePath();
      return sh;
    };
    const layer = (shape, y0, y1, mat) => {
      const ge = new T.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
      ge.rotateX(Math.PI / 2);
      ge.translate(0, y1, 0);
      const m = new T.Mesh(ge, mat);
      g.add(m);
      return m;
    };
    const box = (w, h, d, mat, x, y, z) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      q.position.set(x, y + h / 2, z);
      g.add(q);
      return q;
    };
    const cyl = (r0, r1, h, mat, x, y, z, seg = 10) => {
      const q = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg), mat);
      q.position.set(x, y + h / 2, z);
      g.add(q);
      return q;
    };
    const Z0 = -0.036,
      Z1 = 0.042,
      TOP = 0.0052, // the main deck
      FORE = 0.0072; // the forecastle deck, raised at the bow
    // Opaque naval-grey paint with a small neutral self-light (a fill that stands in for moon and earthshine on the night side), so the hull reads as a solid
    // grey ship on a dark sea, not a blue see-through shape. Roughness is high and metalness near 0, so the cool environment map does not tint the paint.
    const paint = (c, k = 0.42, o = {}) => this._mat(c, { metalness: 0.02, roughness: 0.82, emissive: new T.Color(c).multiplyScalar(k), emissiveIntensity: 1, envMapIntensity: 0.35, ...o });
    const keel = paint(0x3a2523, 0.3),
      side = paint(0x9ba1ab),
      rim = paint(0xc3c7cf, 0.45),
      deckMat = paint(0x757b85),
      stripe = paint(0xf2f2ee, 0.5),
      light = paint(0xe8e9ec, 0.45),
      glass = paint(0x1b222d, 0.3, { metalness: 0.3, roughness: 0.4 }),
      funnel = paint(0x5d626c),
      soot = paint(0x0b0d11, 0.1),
      metal = paint(0xb0b4bc);
    // hull: a dark waterline band, the grey side, then the forecastle (the bow rises: the sheer) with a pale rim round the deck edge
    layer(plan(Z0, Z1), 0, 0.0021, keel);
    layer(plan(Z0, Z1), 0.0021, TOP, side);
    layer(plan(0.008, Z1), TOP, FORE, side);
    layer(plan(Z0, 0.008, 0, 1), TOP, TOP + 0.0003, rim);
    layer(plan(0.008, Z1), FORE, FORE + 0.0003, rim);
    layer(plan(Z0 + 0.0008, 0.0078, 0.0009), TOP + 0.0003, TOP + 0.0005, deckMat);
    layer(plan(0.0102, Z1 - 0.0016, 0.0009), FORE + 0.0003, FORE + 0.0005, deckMat);
    // the pale deck stripe: down the middle of the main deck and along the forecastle
    box(0.0017, 0.0003, 0.043, stripe, 0, TOP + 0.0005, -0.0137);
    box(0.0017, 0.0003, 0.0224, stripe, 0, FORE + 0.0005, 0.0225);
    // forecastle: a gun mount, a missile-cell block and a short anchor winch
    box(0.0042, 0.0003, 0.0052, paint(0x30343b), 0, FORE + 0.0005, 0.0180);
    cyl(0.0014, 0.0017, 0.0018, metal, 0, FORE + 0.0005, 0.0285, 10);
    const barrel = new T.Mesh(new T.CylinderGeometry(0.00035, 0.00035, 0.0056, 5), metal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, FORE + 0.0017, 0.0328);
    g.add(barrel);
    // the superstructure in three layers: a long deckhouse, a bridge block on its forward end, then the mast; two funnels and a second deckhouse astern
    const D0 = TOP + 0.0005;
    box(0.0072, 0.0040, 0.0150, light, 0, D0, 0.0005); // forward deckhouse
    box(0.0075, 0.0007, 0.0152, glass, 0, D0 + 0.0019, 0.0005); // its band of windows
    box(0.0054, 0.0034, 0.0058, paint(0xeceef1), 0, D0 + 0.0040, 0.0043); // bridge block
    box(0.0057, 0.0007, 0.0060, glass, 0, D0 + 0.0053, 0.0045); // bridge windows
    box(0.0050, 0.0004, 0.0062, metal, 0, D0 + 0.0074, 0.0043); // bridge roof
    cyl(0.00042, 0.0006, 0.0125, metal, 0, D0 + 0.0078, 0.0036, 6); // the mast
    box(0.0054, 0.0004, 0.0004, metal, 0, D0 + 0.0150, 0.0036); // yardarm
    box(0.0030, 0.0003, 0.0015, paint(0xcfd2d8), 0, D0 + 0.0198, 0.0036); // radar
    box(0.0058, 0.0030, 0.0090, light, 0, D0, -0.0120); // aft deckhouse
    [-0.0095, -0.0145].forEach((z) => {
      cyl(0.0012, 0.0017, 0.0050, funnel, 0, D0 + 0.0030, z, 10); // funnel
      cyl(0.0012, 0.0012, 0.0004, soot, 0, D0 + 0.0078, z, 10); // its dark cap
    });
    cyl(0.0004, 0.0005, 0.0075, metal, 0, D0 + 0.0030, -0.0188, 5); // the short aft mast
    box(0.0030, 0.0003, 0.0010, metal, 0, D0 + 0.0090, -0.0188);
    // the helicopter deck: a lighter square with a pale ring
    box(0.0086, 0.0003, 0.0100, paint(0x858a94), 0, D0, -0.0285);
    cyl(0.0021, 0.0021, 0.0002, stripe, 0, D0 + 0.0003, -0.0285, 18);
    cyl(0.0016, 0.0016, 0.0003, paint(0x858a94), 0, D0 + 0.0003, -0.0285, 18);
    // white water, soft-edged foam strips (additive, fading out): a bow wave on each side, a foam outline round the hull, a churned wake and a V astern
    const tex = this._gtex(wakeCanvas(), () => new T.CanvasTexture(wakeCanvas()));
    const Y = 0.0007,
      white = (op) => new T.MeshBasicMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    // a ribbon from (x0, z0) to (x1, z1): w0 wide at the start (bright) and w1 at the end (gone)
    const strip = (x0, z0, x1, z1, w0, w1, op) => {
      const dx = x1 - x0,
        dz = z1 - z0,
        L = Math.hypot(dx, dz),
        px = -dz / L,
        pz = dx / L,
        gm = new T.BufferGeometry();
      gm.setAttribute(
        'position',
        new T.Float32BufferAttribute([x0 - (px * w0) / 2, Y, z0 - (pz * w0) / 2, x0 + (px * w0) / 2, Y, z0 + (pz * w0) / 2, x1 - (px * w1) / 2, Y, z1 - (pz * w1) / 2, x1 + (px * w1) / 2, Y, z1 + (pz * w1) / 2], 3),
      );
      gm.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
      gm.setIndex([0, 2, 1, 1, 2, 3]);
      g.add(new T.Mesh(gm, white(op)));
    };
    // the foam outline: the hull's plan, a little larger, flat on the water
    const ring = new T.ShapeGeometry(plan(Z0 - 0.002, Z1 + 0.003, 0, 1.36));
    ring.rotateX(Math.PI / 2);
    ring.translate(0, Y * 0.6, 0);
    g.add(new T.Mesh(ring, new T.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.05, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })));
    // churned wake astern, as wide as the transom, and the V arms that diverge beyond it: the white water is behind the stern only (nothing alongside the bow)
    strip(0, Z0 + 0.001, 0, -0.076, 0.0095, 0.028, 0.6); // turbulent water: as wide as the transom at the stern, spreading and fading with distance (a tapering wake, not parallel streaks)
    strip(0, Z0 + 0.001, 0, -0.050, 0.0066, 0.0135, 0.62); // a denser core in its first stretch
    strip(0, Z0 + 0.0005, 0, -0.0215, 0.0085, 0.0120, 0.9); // bright white churn right at the stern
    [-1, 1].forEach((sd) => strip(sd * 0.0050, Z0 + 0.002, sd * 0.028, -0.074, 0.0034, 0.0080, 0.30)); // the V arms: thin, bright near the stern and opening at the usual shallow angle (short: past the limb they would float in space)
    [-1, 1].forEach((sd) => strip(sd * 0.0072, 0.030, sd * 0.0125, 0.0, 0.0030, 0.0042, 0.34)); // the bow wave: a short white wedge off each bow quarter
    g.position.y = 0;
    // no tintMat: the item's status colour (a pale blue) would repaint the hull every frame and turn the grey paint into a bluish see-through shape
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    g.rotateY(0.6);
    Object.assign(g.userData, { span: 0.078, baseScale: 0.85, minPx: 18, maxPx: 70 });
    return g;
  },
};
