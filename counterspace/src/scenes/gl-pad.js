// ============================================================================
// scenes/gl-pad.js: GLHost mixin: the launch-complex marker drawn under a rocket until a moment after liftoff (sim.js, rocket.pad).
// A generic pad, not a particular one: a concrete plate with a flame trench and a dark blast deflector, a lattice service tower with a swing arm and warning
// lights, floodlights, propellant tanks and a blockhouse; opts.island puts it on a painted islet (soft shallows, reef edge, sand, scrub, a runway, a dark apron round
// the pad). Everything stands on the ground with soft contact shadows (and a tower shadow away from the sun on the day side). On ignition the flame trench and the
// deflector glow, and a ground-hugging cloud of exhaust and steam rolls out over the surface; the whole complex fades out at the end of its hold.
// All of it is a pure function of the scene time t (gl-host.js update calls ud.padFx(t)), so scrubbing and the print stills agree.
// ============================================================================
import { norm } from './core.js';

const PI = Math.PI;
const smooth01 = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
// Small seeded generator (the pictures below are drawn once and must be the same every time).
const rng = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

let islandCv = null,
  puffCv = null,
  softCv = null;
// A top-down atoll on a transparent ground, after Johnston Atoll: a pale, irregular reef flat (broken surf along its crest, a channel, patch reefs) round a darker lagoon, the long
// artificial main island (sand and coral rubble, scrub, a runway along its axis, an apron where the pad stands, a few buildings and tanks), a sandy spit and two small islets.
// The colours are muted (the ocean round it is dark): nothing glows. The pad stands at the centre of the picture.
function islandCanvas() {
  if (islandCv) return islandCv;
  const W = 768,
    H = 512,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d'),
    R = rng(7),
    cx = W / 2,
    cy = H / 2;
  // a wobbling outline (rx, ry: radii; jit: roughness; ph: phases; rot: turned by)
  const blob = (x0, y0, rx, ry, jit, ph, rot = 0) => {
    const n = 90,
      cr = Math.cos(rot),
      sr = Math.sin(rot);
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2,
        k = 1 + jit * (0.5 * Math.sin(2 * a + ph[0]) + 0.32 * Math.sin(3 * a + ph[1]) + 0.22 * Math.sin(5 * a + ph[2]) + 0.14 * Math.sin(9 * a + ph[0] * 2) + 0.08 * Math.sin(15 * a + ph[1] * 3));
      const px = Math.cos(a) * rx * k,
        py = Math.sin(a) * ry * k,
        x = x0 + px * cr - py * sr,
        y = y0 + px * sr + py * cr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
  };
  const fill = (style, blur, shadow) => {
    g.shadowColor = shadow || 'rgba(0,0,0,0)';
    g.shadowBlur = blur;
    g.fillStyle = style;
    g.fill();
    g.shadowBlur = 0;
  };
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28],
    ph2 = [R() * 6.28, R() * 6.28, R() * 6.28];
  // the reef flat: a wide, shallow shelf, irregular and fading into the sea at its rim
  blob(cx + 10, cy + 4, 330, 206, 0.16, ph, -0.12);
  fill('rgba(52,128,142,0.34)', 40, 'rgba(52,128,142,0.45)');
  blob(cx + 10, cy + 4, 296, 178, 0.17, ph, -0.12);
  fill('rgba(78,156,160,0.42)', 26, 'rgba(78,156,160,0.5)');
  // the lagoon: deeper, a darker blue, with sandy shallows and patch reefs toward the middle
  blob(cx - 6, cy + 6, 244, 134, 0.22, ph2, -0.12);
  fill('rgba(26,86,118,0.78)', 24, 'rgba(26,86,118,0.7)');
  blob(cx - 40, cy + 14, 180, 78, 0.28, ph, -0.1);
  fill('rgba(40,112,138,0.55)', 20, 'rgba(40,112,138,0.5)');
  for (let i = 0; i < 70; i++) {
    const a = R() * PI * 2,
      r = Math.sqrt(R()),
      x = cx - 6 + Math.cos(a) * 232 * r,
      y = cy + 6 + Math.sin(a) * 124 * r,
      s = 3 + R() * 9;
    g.fillStyle = R() < 0.55 ? 'rgba(92,170,168,0.34)' : 'rgba(18,64,94,0.38)';
    g.beginPath();
    g.ellipse(x, y, s * 1.5, s, R() * 3, 0, PI * 2);
    g.fill();
  }
  // the reef crest: a pale broken line of surf round the rim, with gaps (the channel to the south-west), not a drawn outline
  g.save();
  g.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const rx = 312 - pass * 6,
      ry = 194 - pass * 5,
      n = 230;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2,
        a1 = a0 + (PI * 2) / n * (0.5 + R() * 0.9);
      if ((a0 > 2.3 && a0 < 2.62) || R() < 0.22) continue;
      const kk = (a) => 1 + 0.16 * (0.5 * Math.sin(2 * a + ph[0]) + 0.32 * Math.sin(3 * a + ph[1]) + 0.22 * Math.sin(5 * a + ph[2]) + 0.14 * Math.sin(9 * a + ph[0] * 2) + 0.08 * Math.sin(15 * a + ph[1] * 3));
      const P = (a) => {
        const px = Math.cos(a) * rx * kk(a),
          py = Math.sin(a) * ry * kk(a),
          cr = Math.cos(-0.12),
          sr = Math.sin(-0.12);
        return [cx + 10 + px * cr - py * sr, cy + 4 + px * sr + py * cr];
      };
      const p0 = P(a0),
        p1 = P(a1);
      g.strokeStyle = `rgba(216,236,232,${0.16 + 0.26 * R()})`;
      g.lineWidth = 1.4 + R() * 2.4;
      g.beginPath();
      g.moveTo(p0[0], p0[1]);
      g.lineTo(p1[0], p1[1]);
      g.stroke();
    }
  }
  g.restore();
  // the main island: long, flat and artificial (built up from the reef): sand over coral, a darker wet rim, rubble, scrub
  const IA = -0.1,
    ix = cx + 18,
    iy = cy + 18;
  const sg = g.createLinearGradient(ix - 210, iy - 70, ix + 210, iy + 70);
  sg.addColorStop(0, '#d3c79c');
  sg.addColorStop(0.5, '#bdb085');
  sg.addColorStop(1, '#a89b72');
  blob(ix, iy, 232, 78, 0.12, ph2, IA);
  fill('rgba(150,140,100,0.55)', 9, 'rgba(60,92,92,0.6)'); // the wet beach rim
  blob(ix, iy, 224, 71, 0.12, ph2, IA);
  fill(sg, 3);
  // the sandy spit: a thin tongue curling off the north-east end, and two small islets on the reef
  g.save();
  g.translate(ix + 214, iy - 34);
  g.rotate(-0.55);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(46, -16, 92, -4);
  g.quadraticCurveTo(50, -6, 0, 12);
  g.closePath();
  fill('#cfc397', 4, 'rgba(60,92,92,0.5)');
  g.restore();
  for (const [x, y, rx, ry, rot] of [[236, -118, 40, 16, 0.2], [-262, 70, 30, 13, -0.4]]) {
    blob(cx + x, cy + y, rx, ry, 0.3, [R() * 6, R() * 6, R() * 6], rot);
    fill('rgba(196,186,140,0.9)', 6, 'rgba(60,92,92,0.5)');
  }
  // coral rubble and scrub patches
  for (const [x, y, rx, ry, col] of [[-170, 8, 34, 14, '112,126,84'], [-96, 44, 24, 10, '112,126,84'], [92, -26, 40, 12, '96,116,76'], [152, 22, 32, 11, '104,122,80'], [196, -8, 20, 8, '96,116,76'], [-20, -44, 26, 9, '112,126,84'], [30, 50, 22, 8, '140,128,92']]) {
    blob(ix + x, iy + y, rx, ry, 0.35, [R() * 6, R() * 6, R() * 6], IA);
    fill(`rgba(${col},0.62)`, 5);
  }
  for (let i = 0; i < 380; i++) {
    const x = ix + (R() - 0.5) * 420,
      y = iy + (R() - 0.5) * 110;
    g.fillStyle = R() < 0.5 ? 'rgba(120,108,76,0.35)' : 'rgba(228,220,188,0.3)';
    g.fillRect(x, y, 1 + R() * 2, 1 + R());
  }
  // the runway along the island's axis (asphalt with a pale centre line, the thresholds and a taxiway to the apron)
  g.save();
  g.translate(ix - 8, iy + 52);
  g.rotate(IA);
  g.fillStyle = 'rgba(66,70,76,0.96)';
  g.fillRect(-196, -6.5, 392, 13);
  g.fillStyle = 'rgba(214,214,208,0.8)';
  for (let x = -176; x < 176; x += 22) g.fillRect(x, -0.6, 11, 1.2);
  for (let k = -2; k <= 2; k++) {
    g.fillRect(-192, k * 2.4 - 0.5, 10, 1);
    g.fillRect(182, k * 2.4 - 0.5, 10, 1);
  }
  g.fillStyle = 'rgba(70,74,80,0.9)';
  g.fillRect(-40, -52, 7, 48); // the taxiway up to the apron
  g.fillRect(70, -34, 6, 28);
  g.restore();
  // the apron the pad stands on (dark concrete) at the centre, and the support area to the east: sheds, tanks and a few low buildings with short shadows
  blob(cx, cy - 2, 70, 56, 0.05, ph, 0);
  fill('rgba(62,62,60,0.78)', 8, 'rgba(40,40,38,0.5)');
  const bld = (x, y, w, h, col) => {
    g.fillStyle = 'rgba(30,34,38,0.38)';
    g.fillRect(ix + x + 2, iy + y + 2.5, w, h);
    g.fillStyle = col;
    g.fillRect(ix + x, iy + y, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(ix + x, iy + y, w, 1);
  };
  g.save();
  g.translate(0, 0);
  for (const [x, y, w, h, col] of [[78, -22, 26, 11, '#b8bcc0'], [110, -20, 16, 9, '#a6abb0'], [132, -26, 22, 12, '#c4c7ca'], [92, -4, 14, 8, '#9ea4aa'], [122, -2, 30, 9, '#b3b7bb'], [162, -14, 12, 8, '#a6abb0'], [-120, -12, 22, 10, '#b8bcc0'], [-148, 0, 14, 8, '#a6abb0'], [60, 26, 18, 7, '#aeb2b6']]) bld(x, y, w, h, col);
  for (const [x, y, r] of [[144, 8, 7], [158, 4, 6], [132, 12, 5]]) {
    g.fillStyle = 'rgba(30,34,38,0.34)';
    g.beginPath();
    g.arc(ix + x + 2, iy + y + 2, r, 0, PI * 2);
    g.fill();
    g.fillStyle = '#d4d6d8';
    g.beginPath();
    g.arc(ix + x, iy + y, r, 0, PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(80,84,88,0.5)';
    g.lineWidth = 1;
    g.stroke();
  }
  g.restore();
  islandCv = c;
  return c;
}
// A soft cloud puff: a radial fall-off roughened with value noise (normal blending, tinted by the sprite colour).
function puffCanvas() {
  if (puffCv) return puffCv;
  const n = 128,
    c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'),
    im = g.createImageData(n, n),
    h = (a, b) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    },
    vn = (x, y) => {
      const ix = Math.floor(x),
        iy = Math.floor(y),
        fx = x - ix,
        fy = y - iy,
        sx = fx * fx * (3 - 2 * fx),
        sy = fy * fy * (3 - 2 * fy);
      return (h(ix, iy) * (1 - sx) + h(ix + 1, iy) * sx) * (1 - sy) + (h(ix, iy + 1) * (1 - sx) + h(ix + 1, iy + 1) * sx) * sy;
    };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = (x - n / 2) / (n / 2),
        dy = (y - n / 2) / (n / 2),
        r = Math.hypot(dx, dy),
        no = 0.6 * vn(x / 14, y / 14) + 0.4 * vn(x / 6 + 9, y / 6 + 3),
        a = Math.max(0, Math.min(1, (1 - r) * 1.5 + (no - 0.5) * 0.9)) ** 1.3;
      const i = (y * n + x) * 4,
        s = 205 + 50 * no;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = s;
      im.data[i + 3] = Math.round(a * 255);
    }
  g.putImageData(im, 0, 0);
  puffCv = c;
  return c;
}
// A soft dark disc (contact shadows).
function softCanvas() {
  if (softCv) return softCv;
  const n = 64,
    c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'),
    gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(0,0,0,0.9)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.5)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, n, n);
  softCv = c;
  return c;
}

export const padMethods = {
  // opts: it.bright (light concrete, the pad stands out on dark sea), it.island (painted islet), it.t0 (ignition), it.until (the hold: when the complex is gone)
  _padModel(pos, opts = {}) {
    const K = opts.island ? 1.3 : opts.bright ? 1.45 : 1; // the complex's drawn size (the pad on its islet is smaller against the atoll)
    const T = this.T,
      g = new T.Group(),
      core = new T.Group(), // the complex itself (a bright, island pad draws it 1.45 times larger)
      fade = [], // materials that fade with the end of the hold
      reg = (m) => (fade.push(m), (m.transparent = true), m),
      plate = reg(this._mat(opts.island ? 0x7d8288 : opts.bright ? 0x9aa3b4 : 0x4c5468, { roughness: 0.85, emissive: opts.island ? 0x17191d : opts.bright ? 0x20262f : 0x000000 })),
      edge = reg(this._mat(opts.island ? 0x9a9ea4 : opts.bright ? 0xe6ecf6 : 0x838ea3, { emissive: opts.island ? 0x1c1e22 : opts.bright ? 0x30363f : 0x000000 })),
      dark = reg(this._mat(0x151a26)),
      steel = reg(this._mat(0xdfe5f0, { metalness: 0.3, roughness: 0.45, emissive: 0x2a3140 })),
      red = reg(this._mat(0xb8493a, { roughness: 0.6, emissive: 0x2a0d08 })),
      tank = reg(this._mat(0xf2f4f8, { metalness: 0.2, roughness: 0.4, emissive: 0x20242c })),
      lampMat = reg(this._mat(0xfff2c8, { emissive: 0xfff2c8, emissiveIntensity: 0.9 })),
      mark = reg(this._mat(0xff3b2a, { emissive: 0xff3b2a, emissiveIntensity: 0.6 }));
    const box = (w, h, d, m, x, y, z) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      q.position.set(x, y + h / 2, z);
      core.add(q);
      return q;
    };
    const spr = (map, c, op, blend, depthTest = true) => {
      const s = new T.Sprite(new T.SpriteMaterial({ map, color: c, transparent: true, opacity: op, depthWrite: false, depthTest, blending: blend }));
      s.renderOrder = 4;
      return s;
    };
    const softTex = this._gtex(softCanvas(), () => new T.CanvasTexture(softCanvas())),
      puffTex = this._gtex(puffCanvas(), () => new T.CanvasTexture(puffCanvas()));
    // where the sun is, in the pad's own frame (y up): shadows lie away from it on the day side
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...norm(pos))),
      ls = new T.Vector3(...(this.sunDir || [1, 0.3, 0.2])).applyQuaternion(q.clone().invert()),
      el = ls.y,
      sd = new T.Vector2(-ls.x, -ls.z);
    if (sd.lengthSq() < 1e-6) sd.set(1, 0);
    sd.normalize();
    if (opts.island) {
      const isl = new T.Mesh(
        new T.PlaneGeometry(0.36, 0.36 * (512 / 768)),
        reg(new T.MeshStandardMaterial({ map: this._gtex(islandCanvas(), () => Object.assign(new T.CanvasTexture(islandCanvas()), { colorSpace: T.SRGBColorSpace, anisotropy: 4 })), roughness: 0.95, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })),
      );
      isl.rotation.x = -PI / 2;
      isl.position.y = 0.0002;
      isl.renderOrder = 1;
      g.add(isl);
    }
    // contact shadows under the plate and the tank/blockhouse corner
    const cs = new T.Mesh(new T.PlaneGeometry(0.058, 0.058), reg(new T.MeshBasicMaterial({ map: softTex, color: 0x050608, transparent: true, opacity: 0.55, depthWrite: false })));
    cs.rotation.x = -PI / 2;
    cs.position.y = 0.0003;
    if (opts.bright) cs.scale.setScalar(1.5);
    cs.renderOrder = 2;
    g.add(cs);
    box(0.0378, 0.0010, 0.0378, edge, 0, 0, 0); // the edge of the plate
    box(0.0345, 0.0016, 0.0345, plate, 0, 0, 0);
    // concrete joints on the plate
    for (const k of [-0.011, 0, 0.011]) {
      box(0.0345, 0.00018, 0.0002, dark, 0, 0.00165, k);
      box(0.0002, 0.00018, 0.0345, dark, k, 0.00165, 0);
    }
    const d = new T.Mesh(new T.CylinderGeometry(0.0072, 0.0072, 0.0006, 20), dark); // the blast deflector
    d.position.y = 0.0019;
    core.add(d);
    box(0.0034, 0.0004, 0.0300, dark, 0, 0.0016, 0); // the flame trench running off to the sides
    // the service tower: four legs, cross braces with diagonals, platforms, a swing arm with a clamp, a lightning mast and warning beacons
    const tx = 0.0125,
      H = 0.052;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.0007, H, 0.0007, steel, tx + dx * 0.0016, 0.0016, dz * 0.0016);
    for (let k = 0; k < 7; k++) {
      const y = 0.0016 + 0.0075 * k;
      box(0.0039, 0.0006, 0.0006, steel, tx, y, -0.0016);
      box(0.0039, 0.0006, 0.0006, steel, tx, y, 0.0016);
      box(0.0006, 0.0006, 0.0039, steel, tx - 0.0016, y, 0);
      box(0.0006, 0.0006, 0.0039, steel, tx + 0.0016, y, 0);
      if (k < 6) {
        const dg = new T.Mesh(new T.BoxGeometry(0.00035, 0.0098, 0.00035), steel); // a diagonal brace on the face toward the vehicle
        dg.position.set(tx - 0.0016, y + 0.00375 + 0.0008, 0);
        dg.rotation.x = k % 2 ? 0.38 : -0.38;
        core.add(dg);
      }
    }
    for (const y of [0.0165, 0.0315, 0.0465]) box(0.0046, 0.0004, 0.0046, steel, tx, y, 0); // service platforms
    box(0.0150, 0.0014, 0.0014, steel, tx - 0.0075, 0.0400, 0); // the swing arm, reaching toward the vehicle
    box(0.0014, 0.0030, 0.0030, red, tx - 0.0150, 0.0392, 0); // its clamp
    box(0.0003, 0.0100, 0.0003, steel, tx, 0.0536, 0); // lightning mast
    const beacon = box(0.0016, 0.0016, 0.0016, mark, tx, 0.0630, 0);
    const beacon2 = box(0.0012, 0.0012, 0.0012, mark, tx, 0.0316, 0.0030);
    box(0.0012, 0.0300, 0.0012, steel, -0.0112, 0.0016, 0); // the guide rail on the other side
    box(0.0030, 0.0006, 0.0030, steel, -0.0112, 0.0016, 0);
    // ground equipment: two propellant tanks lying on cradles and a low blockhouse at the far corner
    for (const z of [-0.0105, -0.0155]) {
      const t = new T.Mesh(new T.CylinderGeometry(0.0021, 0.0021, 0.0095, 14), tank);
      t.rotation.z = PI / 2;
      t.position.set(-0.0135, 0.0016 + 0.0023, z);
      core.add(t);
      box(0.0012, 0.0012, 0.0016, dark, -0.0155, 0.0016, z);
      box(0.0012, 0.0012, 0.0016, dark, -0.0115, 0.0016, z);
    }
    box(0.0070, 0.0034, 0.0046, edge, 0.0, 0.0016, 0.0128);
    box(0.0072, 0.0004, 0.0048, dark, 0.0, 0.0050, 0.0128);
    // floodlights on short poles at the plate corners, aimed at the vehicle: a small lamp each
    const lamps = [];
    for (const [x, z] of [[-0.0172, -0.0172], [0.0172, -0.0172], [-0.0172, 0.0172], [0.0172, 0.0172]]) {
      box(0.0004, 0.0100, 0.0004, steel, x, 0.0016, z);
      const l = box(0.0012, 0.0008, 0.0012, lampMat, x, 0.0112, z);
      const gl = spr(this.spriteTex, 0xfff0c0, 0.55, T.AdditiveBlending, false);
      gl.scale.setScalar(0.0085);
      gl.position.set(x, 0.0118, z);
      core.add(gl);
      lamps.push(gl);
      void l;
    }
    core.scale.setScalar(K);
    g.add(core);
    // the tower's shadow and the plate's, on the day side only (long when the sun is low)
    if (el > 0.05) {
      const L = Math.min(0.036, 0.7 * H / Math.max(0.3, Math.tan(Math.asin(Math.min(0.95, el))))) * K,
        shM = reg(new T.MeshBasicMaterial({ color: 0x06080c, transparent: true, opacity: 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })),
        shape = new T.Shape();
      shape.moveTo(0, -0.0014);
      shape.lineTo(L, -0.0006);
      shape.lineTo(L, 0.0006);
      shape.lineTo(0, 0.0014);
      shape.closePath();
      const sh = new T.Mesh(new T.ShapeGeometry(shape), shM);
      sh.rotation.x = -PI / 2;
      sh.rotation.z = Math.atan2(-sd.y, sd.x); // shape x -> (sd.x, sd.y) in the (x, z) ground plane
      sh.position.set(tx * K, 0.0021, 0);
      sh.renderOrder = 3;
      g.add(sh);
    }
    // ---- ignition effects: glow in the flame trench and over the deflector, light pooling on the concrete, a ground-hugging cloud of exhaust and steam
    const k = K,
      glowD = spr(this.spriteTex, 0xffa24a, 0, T.AdditiveBlending, false),
      glowT = [-1, 1].map(() => spr(this.spriteTex, 0xff7a2a, 0, T.AdditiveBlending, false)),
      pool = new T.Mesh(new T.PlaneGeometry(0.075 * k, 0.075 * k), new T.MeshBasicMaterial({ map: this.spriteTex, color: 0xff9a45, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    pool.rotation.x = -PI / 2;
    pool.position.y = 0.0024;
    pool.renderOrder = 3;
    glowD.position.set(0, 0.004 * k, 0);
    glowT[0].position.set(0, 0.003 * k, -0.0145 * k);
    glowT[1].position.set(0, 0.003 * k, 0.0145 * k);
    g.add(glowD, pool, ...glowT);
    const N = 22,
      R = rng(31),
      puffs = [];
    for (let i = 0; i < N; i++) {
      const s = spr(puffTex, 0xe9e6e0, 0, T.NormalBlending, true);
      s.material.rotation = R() * 6.28;
      g.add(s);
      puffs.push({ s, a: (i / N) * PI * 2 + (R() - 0.5) * 0.5, v: 0.6 + 0.8 * R(), dl: R() * 0.25, sz: 0.7 + 0.8 * R(), wob: R() * 6 });
    }
    g.quaternion.copy(q);
    g.userData.padMark = mark; // the tower's warning light blinks while the vehicle waits (gl-host.js update)
    const t0 = opts.t0 ?? 0,
      until = opts.until ?? t0 + 0.07;
    // padFx(t, dur): called by gl-host.js update with the scene time
    g.userData.padFx = (t, dur) => {
      const u = (t - t0) / 0.05, // 0 at ignition, 1 a twentieth of the scene later
        ig = u < 0 ? 0 : Math.min(1, u / 0.06) * (1 - smooth01((u - 0.5) / 0.9)), // trench / deflector glow: a quick rise, a slow fade as the vehicle clears the pad
        blink = (Math.floor(t * dur * 1.6) & 1) * 0.9 + 0.12;
      mark.emissiveIntensity = blink;
      void beacon;
      void beacon2;
      glowD.material.opacity = 0.9 * ig;
      glowD.scale.setScalar((0.016 + 0.014 * ig) * k);
      for (const s of glowT) {
        s.material.opacity = 0.75 * ig;
        s.scale.setScalar(0.014 * k);
      }
      pool.material.opacity = 0.5 * ig;
      // the floodlights burn at night (they are dim in daylight) and flare a little at ignition
      for (const l of lamps) l.material.opacity = (el > 0.15 ? 0.2 : 0.65) * (1 + 0.5 * ig);
      // ground cloud: puffs roll outward along the surface from the flame trench, rise a little and thin out (a warm core at ignition, grey-white after)
      for (const p of puffs) {
        const a = u - p.dl * 0.3;
        if (a <= 0 || a > 3.2) {
          p.s.visible = false;
          continue;
        }
        p.s.visible = true;
        const e = 1 - Math.exp(-a * 2.2),
          r = (0.006 + 0.034 * p.v * e) * k,
          warm = Math.exp(-a * 2.4);
        p.s.position.set(Math.cos(p.a) * r * 1.2, (0.0030 + 0.0035 * e * p.sz + 0.0012 * Math.sin(p.wob + a)) * k, Math.sin(p.a) * r * 0.9);
        p.s.scale.setScalar((0.010 + 0.02 * e) * p.sz * k);
        p.s.material.color.setRGB(0.80 + 0.2 * warm, 0.78 - 0.1 * warm, 0.74 - 0.3 * warm);
        p.s.material.opacity = 0.5 * Math.min(1, a / 0.1) * Math.exp(-Math.max(0, a - 0.5) * 0.9);
      }
      // the whole complex fades out over the end of its hold
      const f = 1 - smooth01((t - (until - 0.02)) / 0.02);
      for (const m of fade) m.opacity = f * (m.userData.o ?? 1);
    };
    for (const m of fade) m.userData.o = m.opacity;
    Object.assign(g.userData, { span: opts.island ? 0.2 : opts.bright ? 0.056 : 0.0385, minPx: 40, maxPx: 60 });
    return g;
  },
};
