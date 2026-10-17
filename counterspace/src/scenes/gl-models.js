// ============================================================================
// scenes/gl-models.js: GLHost mixin: the 3D craft and site models (satellite, ISS, spaceplane, aircraft, ground site, pin, jammer, ship) and the lights they use
// (ES module bundled by esbuild from src/boot.js; the methods are installed together with gl-items.js's, see installGLItems.)
// ============================================================================
import { norm } from './core.js';
import { foilCanvas } from './earth.js';

// The sea round a warship: a soft round patch of rippled water (deep blue-green with pale wind streaks and glints, a darker pool under the hull, fading to nothing at the
// rim) so a ship drawn many times its true size sits ON a sea surface, not on a flat blue haze. v grows along the ship's +z (the bow). Drawn once, in memory.
let seaCv = null;
function seaCanvas() {
  if (seaCv) return seaCv;
  const S = 256,
    c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'),
    im = g.createImageData(S, S),
    hash = (a, b) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    },
    vn = (x, y, sx, sy, seed) => {
      const u = x / sx,
        v = y / sy,
        i = Math.floor(u),
        j = Math.floor(v),
        fu = u - i,
        fv = v - j,
        sm = (t) => t * t * (3 - 2 * t),
        a = hash(i + seed, j),
        b = hash(i + 1 + seed, j),
        c2 = hash(i + seed, j + 1),
        d = hash(i + 1 + seed, j + 1);
      return a + (b - a) * sm(fu) + (c2 - a) * sm(fv) + (a - b - c2 + d) * sm(fu) * sm(fv);
    };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (x - S / 2) / (S / 2),
        dy = (y - S / 2) / (S / 2),
        r = Math.hypot(dx, dy),
        // a smooth falloff that is gone well inside the patch's edge (r = 0.8 of its half width), so no outline of the patch is ever drawn
        fall = (1 - Math.min(1, Math.max(0, (r - 0.12) / 0.68)) ** 2 * (3 - 2 * Math.min(1, Math.max(0, (r - 0.12) / 0.68)))) ** 1.3,
        // ripples: long wind streaks along the ship's length crossed with a finer chop
        n = 0.5 * vn(x, y, 3.5, 14, 3) + 0.3 * vn(x, y, 2.2, 6, 11) + 0.2 * vn(x, y, 1.3, 2.6, 23),
        crest = Math.pow(Math.max(0, n - 0.5) * 2, 1.6),
        // a darker pool under and just round the hull (the hull is a long ellipse about the middle of the strip)
        hull = Math.exp(-((dx / 0.12) ** 2 + ((dy - 0.29) / 0.5) ** 2)),
        i = (y * S + x) * 4,
        base = 0.3 * fall * (1 - 0.5 * hull),
        cr = 0.42 * crest * fall * (1 - 0.7 * hull);
      // blend: the water body (deep teal), then the pale crests over it
      const a = base + cr * (1 - base);
      im.data[i] = Math.round((28 * base * (1 - cr) + 190 * cr) / Math.max(a, 1e-3));
      im.data[i + 1] = Math.round((78 * base * (1 - cr) + 226 * cr) / Math.max(a, 1e-3));
      im.data[i + 2] = Math.round((112 * base * (1 - cr) + 244 * cr) / Math.max(a, 1e-3));
      im.data[i + 3] = Math.round(Math.min(1, a) * 255);
    }
  g.putImageData(im, 0, 0);
  seaCv = c;
  return c;
}

// A strip of foam for a ship's wake: dense white at the start (v = 0, drawn at the top of the canvas), broken into streaks and fine bubbles that thin out with
// distance, soft at both sides and gone at the far end (v = 1). Opaque-white colour with the foam density in the alpha. Drawn once, in memory.
let wakeCv = null;
function wakeCanvas() {
  if (wakeCv) return wakeCv;
  const w = 96,
    h = 384,
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d'),
    im = g.createImageData(w, h),
    hash = (a, b) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    },
    // value noise, stretched along the strip (sx wide cells across, sy long cells along)
    vn = (x, y, sx, sy, seed) => {
      const u = x / sx,
        v = y / sy,
        i = Math.floor(u),
        j = Math.floor(v),
        fu = u - i,
        fv = v - j,
        s = (t) => t * t * (3 - 2 * t),
        a = hash(i + seed, j),
        b = hash(i + 1 + seed, j),
        c2 = hash(i + seed, j + 1),
        d = hash(i + 1 + seed, j + 1);
      return a + (b - a) * s(fu) + (c2 - a) * s(fv) + (a - b - c2 + d) * s(fu) * s(fv);
    };
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1),
      along = Math.pow(1 - t, 1.15);
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x - (w - 1) / 2) / (w / 2),
        // a dense core that narrows the foam to the centre, plus a thinner skirt of bubbles either side
        core = Math.exp(-d * d * (5 + 7 * t)),
        skirt = Math.exp(-d * d * 2.2) * 0.45,
        n = 0.45 * vn(x, y, 5, 22, 0) + 0.3 * vn(x, y, 3, 9, 7) + 0.25 * vn(x, y, 1.6, 3.2, 19),
        foam = (core + skirt) * along,
        // as the foam thins it breaks into patches: the noise cuts a rising threshold out of it
        // streaks and bubbles: a second, finer noise breaks the dense core up too, so the wake is foam with texture and a ragged edge, not a flat white wedge
        n2 = vn(x, y, 1.2, 7, 41) * 0.6 + vn(x, y, 2.6, 2.2, 53) * 0.4,
        fd = foam * (0.62 + 0.75 * n2),
        a = Math.max(0, Math.min(1, (fd - (0.1 + 0.5 * t) * (1 - n)) * 2.3 + 0.03 * (1 - t))) * Math.min(1, (1 - t) * 6 + 0.2) * Math.min(1, (1 - d) * 4) ** 1.5;
      const i = (y * w + x) * 4;
      im.data[i] = 247;
      im.data[i + 1] = 251;
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
    if (o.shade) return this._warshipModel(pos, o);
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
  // Opt-in warship (ship actor `shade`; Burnt Frost's USS Lake Erie), drawn for a reader who has never seen one: a Ticonderoga-class cruiser seen as a destroyer-like
  // hull with a raked, flared bow, a boot-topping band and a pale hull number, a raised forecastle carrying a 5-inch gun and a vertical-launch cell block (the SM-3 climbs out of it,
  // at the model's origin), a layered superstructure (deckhouse with radar panels, bridge with wings, a mast with a radar, two raked funnels with dark exhaust uptakes, an aft
  // house with a second mast), a second cell block, an aft gun, a helicopter deck, deck lights, and a fine white wake. Stern -0.044, bow 0.034 (the span is as before, so labels hold).
  _warshipModel(pos, o = {}) {
    const T = this.T,
      g = new T.Group();
    const BEAM = 0.0058,
      Z0 = -0.044,
      Z1 = 0.034,
      ZB = 0.002; // the hull is full width from the stern quarter to here, then tapers to the stem
    const hw = (z) => {
      if (z < -0.028) return 0.0046 + ((z - Z0) / 0.016) * (BEAM - 0.0046);
      if (z < ZB) return BEAM;
      const u = Math.min(1, (z - ZB) / (Z1 - ZB));
      return BEAM * Math.pow(1 - Math.pow(u, 1.3), 0.95);
    };
    // the plan of the hull between two stations (an x, z outline; ExtrudeGeometry reads it as x, y): `inset` narrower each side, `grow` wider, `fl` extra width at the bow (flare),
    // `bow` the z of the stem at this level (a lower level ends further aft: the raked stem)
    const plan = (za, zb, inset = 0, grow = 1, fl = 0, bow = Z1) => {
      const sh = new T.Shape(),
        n = 24,
        zs = Array.from({ length: n + 1 }, (_, i) => za + ((zb - za) * i) / n),
        w = (z) => {
          const zz = z > ZB ? ZB + ((z - ZB) * (Z1 - ZB)) / (bow - ZB) : z;
          return Math.max(0, hw(Math.min(zz, Z1)) * grow * (1 + fl * Math.max(0, Math.min(1, (z - ZB + 0.004) / 0.030))) - inset);
        };
      zs.forEach((z, i) => (i ? sh.lineTo(w(z), z) : sh.moveTo(w(z), z)));
      [...zs].reverse().forEach((z) => sh.lineTo(-w(z), z));
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
    const TOP = 0.0066, // the main deck
      FORE = 0.0082, // the forecastle deck (the cell block sits on it: the missile's base is the model's origin)
      ZF = -0.0052; // the forecastle break
    // Opaque naval-grey paint with a small neutral self-light (a fill that stands in for moon and earthshine on the night side), so the hull reads as a solid
    // grey ship on a dark sea, not a blue see-through shape. Roughness is high and metalness near 0, so the cool environment map does not tint the paint.
    const paint = (c, k = 0.3, o = {}) => this._mat(c, { metalness: 0.06, roughness: 0.74, emissive: new T.Color(c).multiplyScalar(k), emissiveIntensity: 1, envMapIntensity: 0.5, ...o });
    const keel = paint(0x3d1816, 0.3),
      boot = paint(0x7c2e22, 0.5),
      bootLine = paint(0xd2d6dc, 0.5),
      // the hull side: a mid "haze grey" (lighter than the dark sea and darker than the superstructure) with a softer coat that picks up the sun
      side = paint(0x58616d, 0.2, { metalness: 0.35, roughness: 0.4, envMapIntensity: 1.3 }),
      upper = paint(0x727b87, 0.26, { metalness: 0.3, roughness: 0.4, envMapIntensity: 1.3 }),
      seam = paint(0x20252d, 0.1),
      scuttle = paint(0x0d1015, 0.05),
      rim = paint(0xb4bac4, 0.45),
      deckMat = paint(0x3b4049, 0.2), // dark non-skid: the pale rooftops and the cells stand out on it
      lane = paint(0x565c66, 0.22),
      stripe = paint(0xf2f2ee, 0.5),
      light = paint(0xcfd4dc, 0.28, { roughness: 0.55 }),
      light2 = paint(0xb4bbc6, 0.26, { roughness: 0.55 }),
      roof = paint(0xdde0e6, 0.34),
      glass = paint(0x0c1118, 0.3, { metalness: 0.5, roughness: 0.2, envMapIntensity: 1.4 }),
      funnel = paint(0x7d838e, 0.26),
      soot = paint(0x07090c, 0.1),
      metal = paint(0xc2c6ce, 0.38, { metalness: 0.45, roughness: 0.38 }),
      dark = paint(0x15181d, 0.12),
      radar = paint(0x1d2630, 0.3, { metalness: 0.4, roughness: 0.3, envMapIntensity: 1.4 }),
      cellTop = paint(0x23272e, 0.2),
      cellLid = paint(0x6f7681, 0.3);
    // hull: the red antifouling, a boot-topping band at the waterline with a pale line above it, the grey side (the lower part, then a flared upper strake with a step), and the
    // forecastle (the bow rises: the sheer). The stem is raked: each level ends further forward than the one below it.
    layer(plan(Z0, Z1, 0, 0.98, 0, Z1 - 0.011), 0, 0.0014, keel);
    layer(plan(Z0, Z1, 0, 1.0, 0, Z1 - 0.0095), 0.0014, 0.0025, boot);
    layer(plan(Z0, Z1, 0, 1.012, 0, Z1 - 0.0088), 0.0025, 0.0028, bootLine);
    layer(plan(Z0, Z1, 0, 1.012, 0.04, Z1 - 0.0070), 0.0028, 0.0042, side);
    layer(plan(Z0, Z1, 0, 1.045, 0.10, Z1 - 0.0030), 0.0042, TOP, upper); // flared: wider at the deck than at the waterline
    layer(plan(ZF, Z1, 0, 1.045, 0.10, Z1), TOP, FORE, upper);
    layer(plan(ZF, Z1, 0, 1.055, 0.10, Z1), FORE - 0.0004, FORE, rim); // a pale sheer line along the forecastle edge
    layer(plan(Z0, ZF, 0, 1.045, 0.10, Z1), TOP - 0.0004, TOP, rim);
    // plating: thin dark seams down the side, a row of dark scuttles under the deck edge
    for (let z = -0.0405; z < 0.032; z += 0.0044) {
      const hi = z > ZF ? FORE : TOP;
      layer(plan(z, z + 0.00028, 0, 1.05, 0.10, Z1 - 0.0010), 0.0028, hi - 0.0004, seam);
    }
    for (let z = -0.039; z < 0.028; z += 0.0044) {
      const hi = z > ZF ? FORE : TOP;
      layer(plan(z + 0.0012, z + 0.0021, 0, 1.052, 0.10, Z1), hi - 0.0016, hi - 0.0011, scuttle);
    }
    layer(plan(Z0 + 0.0008, ZF - 0.0004, 0.0009, 1.045, 0.10), TOP, TOP + 0.0004, deckMat);
    layer(plan(ZF + 0.0004, Z1 - 0.0016, 0.0009, 1.045, 0.10), FORE, FORE + 0.0004, deckMat);
    // the pale deck stripe down the middle of the forecastle and the main deck
    box(0.0014, 0.0003, 0.0285, stripe, 0, FORE + 0.0004, 0.0125);
    box(0.0014, 0.0003, 0.0285, stripe, 0, TOP + 0.0004, -0.0335);
    // a hull number on each side (a pale "70" low on the forward flank: the paint that tells a warship from a barge)
    {
      const cv = document.createElement('canvas');
      cv.width = 128;
      cv.height = 48;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#f4f4f0';
      cx.font = '700 44px sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('70', 64, 26);
      const nt = new T.CanvasTexture(cv),
        nm = new T.MeshBasicMaterial({ map: nt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      [-1, 1].forEach((sd) => {
        const q = new T.Mesh(new T.PlaneGeometry(0.0050, 0.0019), nm),
          zz = 0.0150;
        q.position.set(sd * (hw(zz) * (1.012 + 0.04 * 0.5) * (1 + 0.04 * 0.5) + 0.00012), 0.0047, zz);
        q.rotation.y = sd * (Math.PI / 2);
        g.add(q);
      });
    }
    // forecastle: the 5-inch gun (an armoured turret with a barrel), the vertical-launch cell block the missile stands in (a grid of dark hatches on a raised plinth, rimmed pale),
    // a mooring winch and the anchor chain
    const gunAt = (z, dir) => {
      cyl(0.0019, 0.0021, 0.0010, paint(0x70767f, 0.32), 0, (z > ZF ? FORE : TOP) + 0.0004, z, 14); // the ring
      const tur = new T.Mesh(new T.SphereGeometry(0.0017, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), paint(0xa7acb5, 0.4, { metalness: 0.4, roughness: 0.4 }));
      tur.scale.set(1, 0.78, 1.25);
      tur.position.set(0, (z > ZF ? FORE : TOP) + 0.0014, z);
      g.add(tur);
      const br = new T.Mesh(new T.CylinderGeometry(0.00036, 0.00044, 0.0056, 6), metal);
      br.rotation.x = Math.PI / 2;
      br.position.set(0, (z > ZF ? FORE : TOP) + 0.0026, z + dir * 0.0034);
      g.add(br);
      box(0.0012, 0.0004, 0.0008, dark, 0, (z > ZF ? FORE : TOP) + 0.0034, z - dir * 0.0006);
    };
    gunAt(0.0215, 1);
    const cells = (x0, z0, nx, nz, y, pitch = 0.00074) => {
      box(nx * pitch + 0.0008, 0.0004, nz * pitch + 0.0008, cellLid, x0, y - 0.0001, z0); // the plinth
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) box(0.00056, 0.00022, 0.00056, cellTop, x0 + (i - (nx - 1) / 2) * pitch, y + 0.0003, z0 + (j - (nz - 1) / 2) * pitch);
    };
    cells(0, 0.0, 3, 8, FORE + 0.0003); // forward cell block (it stands under the missile)
    box(0.0008, 0.0005, 0.0010, dark, 0, FORE + 0.0004, 0.0300); // winch
    // the superstructure in layers: a tall main deckhouse (a band of windows, radar panels on its faces), a bridge block on it with wings, a pale roof; behind it a lower
    // aft house carrying the two funnels; two masts with radars
    const D0 = TOP + 0.0004;
    const HZ0 = -0.0062; // forward face of the deckhouse
    box(0.0086, 0.0008, 0.0120, dark, 0, D0, HZ0 - 0.0060); // dark footprint: the house sits ON the deck, not in it
    box(0.0078, 0.0064, 0.0112, light, 0, D0, HZ0 - 0.0056); // main deckhouse
    box(0.0080, 0.0007, 0.0114, glass, 0, D0 + 0.0030, HZ0 - 0.0056); // its band of windows
    box(0.0080, 0.0004, 0.0114, roof, 0, D0 + 0.0064, HZ0 - 0.0056); // its roof
    box(0.0064, 0.0034, 0.0066, light2, 0, D0 + 0.0068, HZ0 - 0.0040); // bridge block
    box(0.0066, 0.0008, 0.0068, glass, 0, D0 + 0.0078, HZ0 - 0.0040); // bridge windows (a long dark band: the wheelhouse)
    box(0.0070, 0.0005, 0.0074, roof, 0, D0 + 0.0102, HZ0 - 0.0040); // bridge roof
    box(0.0100, 0.0004, 0.0016, light2, 0, D0 + 0.0072, HZ0 - 0.0056); // the bridge wings reach out past the sides
    [-1, 1].forEach((sd) => {
      // the four radar panels of the phased-array: dark tilted slabs on the forward and side faces of the deckhouse
      box(0.0001, 0.0026, 0.0032, radar, sd * 0.0040, D0 + 0.0036, HZ0 - 0.0030); // on each flank
      box(0.0030, 0.0026, 0.0001, radar, sd * 0.0020, D0 + 0.0036, HZ0 + 0.0001); // on the face
    });
    cyl(0.00040, 0.00060, 0.0105, metal, 0, D0 + 0.0107, HZ0 - 0.0050, 6); // the forward mast
    box(0.0052, 0.0004, 0.0004, metal, 0, D0 + 0.0170, HZ0 - 0.0050); // yardarm
    box(0.0028, 0.0004, 0.0016, paint(0xcfd2d8), 0, D0 + 0.0206, HZ0 - 0.0050); // search radar
    box(0.0007, 0.0007, 0.0007, paint(0xcfd2d8), 0, D0 + 0.0212, HZ0 - 0.0050);
    // aft house with two raked funnels (tapered, pale, a dark exhaust uptake on the top)
    const AZ = -0.0182;
    box(0.0078, 0.0004, 0.0120, dark, 0, D0, AZ);
    box(0.0070, 0.0046, 0.0112, light, 0, D0, AZ);
    box(0.0072, 0.0004, 0.0114, roof, 0, D0 + 0.0046, AZ);
    box(0.0072, 0.0006, 0.0114, glass, 0, D0 + 0.0022, AZ);
    [-0.0150, -0.0214].forEach((z) => {
      const f = cyl(0.0013, 0.0019, 0.0060, funnel, 0, D0 + 0.0050, z, 4); // a tapered stack (four-sided: the angular gas-turbine uptake)
      f.rotation.y = Math.PI / 4;
      f.rotation.x = -0.14; // raked aft
      f.position.z -= 0.0004;
      const cap = cyl(0.0013, 0.0013, 0.0006, soot, 0, D0 + 0.0109, z - 0.0013, 4); // the dark exhaust opening
      cap.rotation.y = Math.PI / 4;
      cap.rotation.x = -0.14;
      box(0.0014, 0.0003, 0.0016, dark, 0, D0 + 0.0050, z); // base shadow
    });
    cyl(0.00036, 0.00052, 0.0100, metal, 0, D0 + 0.0050, -0.0242, 6); // the aft mast
    box(0.0034, 0.0004, 0.0004, metal, 0, D0 + 0.0116, -0.0242);
    box(0.0022, 0.0003, 0.0013, paint(0xcfd2d8), 0, D0 + 0.0146, -0.0242);
    // aft: the second cell block, the aft gun (facing aft), the helicopter deck (a pale square with a ring and a bar) and two boats
    cells(0, -0.0292, 3, 5, TOP + 0.0004);
    gunAt(-0.0338, -1);
    box(0.0086, 0.0003, 0.0058, lane, 0, TOP + 0.0004, -0.0405); // helicopter deck
    cyl(0.0021, 0.0021, 0.0003, stripe, 0, TOP + 0.0006, -0.0405, 20);
    cyl(0.0016, 0.0016, 0.0004, lane, 0, TOP + 0.0006, -0.0405, 20);
    box(0.0030, 0.0004, 0.0004, stripe, 0, TOP + 0.0008, -0.0405);
    [-1, 1].forEach((sd) => {
      box(0.0012, 0.0010, 0.0040, paint(0xe2e4e9, 0.45), sd * 0.0044, D0 + 0.0004, -0.0090); // a boat each side of the aft house, forward of it
      box(0.0004, 0.0004, 0.0030, dark, sd * 0.0050, D0 + 0.0014, -0.0090);
    });
    // thin pale rails along each deck edge
    [-1, 1].forEach((sd) => {
      box(0.00016, 0.00052, 0.0212, rim, sd * (hw(-0.0235) * 1.045 - 0.00052), TOP + 0.0004, -0.0235 - 0.0005 + 0.0000);
      box(0.00016, 0.00052, 0.0215, rim, sd * (hw(0.0100) * 1.045 * 1.05 - 0.0006), FORE + 0.0004, 0.0110);
    });
    // deck lights: unlit-material beads (they stay bright on the night side): a red warning light on the mast, white masthead and radar lights, warm lamps on the
    // bridge wings, the deckhouse flanks and the deck edge, and a green / red pair of running lights on the bridge sides
    const lamp = (c, r, x, y, z) => {
      const q = new T.Mesh(new T.SphereGeometry(r, 6, 5), new T.MeshBasicMaterial({ color: c }));
      q.position.set(x, y, z);
      g.add(q);
    };
    lamp(0xff3b30, 0.00046, 0, D0 + 0.0214, HZ0 - 0.0050);
    lamp(0xfff4dc, 0.00036, 0, D0 + 0.0172, HZ0 - 0.0050);
    lamp(0xfff4dc, 0.0003, 0, D0 + 0.0150, -0.0242);
    [-1, 1].forEach((sd) => {
      lamp(sd < 0 ? 0xff5648 : 0x5dff8a, 0.00034, sd * 0.0050, D0 + 0.0078, HZ0 - 0.0056);
      [-0.0110, -0.0190, -0.0240].forEach((z) => lamp(0xffd9a0, 0.00026, sd * 0.0037, D0 + 0.0014, z));
      [-0.0420, -0.0345, -0.0270, -0.0120, 0.0100, 0.0200, 0.0285].forEach((z) => lamp(0xffe2b0, 0.00022, sd * (hw(z) * 1.045 - 0.0007), (z > ZF ? FORE : TOP) + 0.0009, z));
    });
    // white water, soft-edged foam strips (additive, fading out): a bow wave on each side, a foam outline round the hull, a churned wake and a V astern
    const tex = this._gtex(wakeCanvas(), () => new T.CanvasTexture(wakeCanvas()));
    // The model is drawn many times larger than life, so a flat sheet of water would float off the globe's curved surface a little way from the hull (the wake ran off
    // into the sky at the limb). The water, foam and wake are bent down onto the sphere in the vertex shader: the drop at a distance d from the ship (in world units, d = scale
    // x local distance) is R - sqrt(R^2 - d^2), put back in the model's own units by dividing by the scale (_fitModels keeps `uSea` at the model's scale).
    const uSea = { value: 1 };
    g.userData.uSea = uSea;
    const hug = (m) => {
      // a polygon offset pulls the water toward the camera in depth, so the globe's surface (its depth is coarse at a grazing angle) never cuts it off in a hard edge
      m.polygonOffset = true;
      m.polygonOffsetFactor = -4;
      m.polygonOffsetUnits = -16;
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uSea = uSea;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\n uniform float uSea;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n float dW = min(0.9, length(transformed.xz) * uSea);\n transformed.y -= (1.0 - sqrt(1.0 - dW * dW) - 0.004) / uSea;');
      };
      return m;
    };
    const Y = 0.0007,
      white = (op) => hug(new T.MeshBasicMaterial({ map: tex, color: 0xf2f6ff, vertexColors: true, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide }));
    // the sea itself: a round patch of rippled water about the ship (bow at +z), under the foam
    {
      const seaTex = this._gtex(seaCanvas(), () => new T.CanvasTexture(seaCanvas())),
        pg = new T.PlaneGeometry(0.17, 0.17, 24, 24);
      pg.rotateX(-Math.PI / 2); // y is up; the texture's rows run along +z
      const uv = pg.attributes.uv,
        ps = pg.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i) / 0.17 + 0.5, 0.5 - ps.getZ(i) / 0.17);
      const sea = new T.Mesh(pg, hug(new T.MeshBasicMaterial({ map: seaTex, transparent: true, opacity: 1, depthWrite: false })));
      sea.position.set(0, 0.0004, -0.020);
      sea.renderOrder = -1;
      g.add(sea);
    }
    // a ribbon from (x0, z0) to (x1, z1): w0 wide at the start (bright) and w1 at the end (gone)
    const strip = (x0, z0, x1, z1, w0, w1, op, f0 = 1) => {
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
      gm.setAttribute('uv', new T.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); // v = 1 is the top row of the (flipped) canvas: the dense start
      gm.setAttribute('color', new T.Float32BufferAttribute([1, 1, 1, f0, 1, 1, 1, f0, 1, 1, 1, 1, 1, 1, 1, 1], 4)); // f0: the alpha at the start edge (0 = the foam grows out of nothing, no hard cut)
      gm.setIndex([0, 2, 1, 1, 2, 3]);
      g.add(new T.Mesh(gm, white(op)));
    };
    // the foam outline: the hull's plan, a little larger, flat on the water
    const ring = new T.ShapeGeometry(plan(Z0 - 0.002, Z1 + 0.003, 0, 1.36));
    ring.rotateX(Math.PI / 2);
    ring.translate(0, Y * 0.6, 0);
    g.add(new T.Mesh(ring, hug(new T.MeshBasicMaterial({ color: 0xe4eeff, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide }))));
    // churned wake astern: white foam as wide as the transom that spreads, breaks into patches and thins out with distance, with a thin Kelvin arm each side
    // (the wake is short: past the limb it would float in space)
    strip(0, Z0 + 0.001, 0, Z0 - 0.050, 0.0058, 0.0100, 0.75);
    strip(0, Z0 + 0.0005, 0, Z0 - 0.030, 0.0036, 0.0058, 0.9);
    // the Kelvin arms: fine V lines of foam that leave the quarters and spread slowly, thin and broken
    [-1, 1].forEach((sd) => strip(sd * 0.0046, Z0 + 0.003, sd * 0.0150, Z0 - 0.048, 0.0022, 0.0046, 0.5, 0));
    [-1, 1].forEach((sd) => strip(sd * 0.0050, Z0 + 0.0015, sd * 0.0092, Z0 - 0.030, 0.0016, 0.0028, 0.4, 0));
    [-1, 1].forEach((sd) => strip(sd * 0.0062, 0.0200, sd * 0.0092, 0.0035, 0.0020, 0.0028, 0.42, 0)); // the bow wave: a short white wedge off each bow quarter
    g.position.y = 0;
    // no tintMat: the item's status colour (a pale blue) would repaint the hull every frame and turn the grey paint into a bluish see-through shape
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos)));
    g.rotateY(o.heading ?? 0.6);
    Object.assign(g.userData, { span: 0.078, baseScale: 0.85, minPx: 18, maxPx: 70 });
    return g;
  },
};
