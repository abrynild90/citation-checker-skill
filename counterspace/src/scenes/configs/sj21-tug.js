// scenes/configs/sj21-tug.js: scene `sj21-tug` (see ../config.js for the list order)
import { GEO_ALT } from '../core.js';
import { C, PK } from './shared.js';

// SJ-21 presets that show the pair carry this note: SWF says SJ-21 "docked" with Compass G2 but does not describe any arm or grapple, so the boom drawn
// on the tug model is a generic, illustrative one.
const ARM_TAG = { tag: 'Arm drawn for illustration (SWF does not describe it)', tagShort: 'Arm drawn for illustration (not in SWF)' };

export const SJ21_TUG = {
  id: 'sj21-tug',
  date: '2022-01-21',
  title: 'SJ-21 pulls a defunct satellite out of the geostationary belt (2022)',
  shells: [],
  duration: 24,
  caption:
    'In December 2021 China’s SJ-21 satellite reached Compass G2, a defunct Chinese ' +
    'navigation satellite in geostationary orbit (GEO), about 36,000 km up. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, reports that SJ-21 “docked to it at some point”. ' +
    'Around 21 January 2022 SJ-21 used its own propulsion to pull both objects ' +
    'above the GEO belt, the band of orbits where working satellites sit. ' +
    'SJ-21 then came back down close to GEO. ' +
    'SWF’s table says SJ-21 pulled Compass G2 well past the graveyard orbit, the disposal region above GEO for retired satellites. ' +
    'SWF does not say how SJ-21 captured or docked with Compass G2, so the grabbing arm drawn on SJ-21 is for illustration only. ' +
    'SWF does report robotic-arm demonstrations on other Chinese satellites: SY-7 (2013) and Aolong-1 (2016). ' +
    'No legal item in our records is tied to this event.',
  cite:
    'Secure World Foundation, 2026: p. 03-11 (SJ-21 and Compass G2) and Table 3-2, p. 03-15; robotic arms on other satellites: SY-7, p. 03-02; ' +
    'Aolong-1, p. 03-04; SJ-17, p. 03-08.',
  related: null,
  event: 'cn-2022-sj21-compass-g2',
  inset: 'Top view',
  insetNoPhone: true, // on a phone the inset would cover the docked pair
  scaleNote: 'The heights above the belt, the spacing between the two spacecraft and their position along the belt are drawn for illustration.',
  anchors: { g: { geo: { lon: 105 } } },
  actors: [
    {
      type: 'ring',
      alt: GEO_ALT,
      inc: 0,
      raan: 0,
      color: C.geo,
      thick: 0.005,
      opacity: 0.85,
      inset: true,
      push: 1.4,
      gapCrafts: ['sj21', 'cg2'],
      label: 'GEO belt (35,786 km)',
    },
    {
      type: 'craft',
      id: 'cg2',
      variant: 'navsat',
      anchor: 'g',
      color: C.dead,
      scale: 2.2 * PK,
      minPx: 80,
      maxPx: 112,
      label: 'Compass G2 (defunct)',
      short: 'Compass G2',
      staticKey: [
        [0, -1.75, 1.05, 0],
        [1, -1.75, 1.05, 0],
      ], // static: well above the belt line, left of its tug with a clear gap
      dx: 60,
      dy: 34,
      labelFn: (t, n) => (t >= 0.4 && t < 0.8 ? null : n ? 'Compass G2' : 'Compass G2 (defunct)'),
      arcs: [{ t0: 0.5, t1: 0.76, o: [0.09, 0, 0] }],
      key: [
        [0, 0, 0, 0],
        [0.4, 0.03, 0, 0],
        [0.5, 0.03, 0, 0],
        [0.76, 0.11, 0.27, 0],
        [1, 0.135, 0.275, 0.004],
      ],
    },
    {
      type: 'craft',
      id: 'sj21',
      variant: 'tug',
      anchor: 'g',
      color: C.cn,
      bright: true,
      scale: 2.2 * PK,
      minPx: 80,
      maxPx: 112,
      label: 'SJ-21 (China)',
      short: 'SJ-21',
      staticKey: [
        [0, -0.1, 1.15, 0],
        [1, -0.1, 1.15, 0],
      ], // static: the tug beside and a little higher than G2 (no overlap), both clear of the ring
      dx: -68,
      dy: -12,
      labelFn: (t, n) => (t >= 0.4 && t < 0.8 ? (n ? 'SJ-21 + G2 docked' : 'SJ-21 + Compass G2 (docked)') : n ? 'SJ-21' : 'SJ-21 (China)'),
      arcs: [{ t0: 0.8, t1: 0.97, o: [0.07, 0.06, 0] }],
      dock: { with: 'cg2', t0: 0.4, t1: 0.8 },
      key: [
        [0, 0.72, 0, 0],
        [0.2, 0.3, 0, 0],
        [0.27, 0.17, 0.006, -0.008],
        [0.34, 0.09, -0.004, 0.006],
        [0.4, 0.03, 0, 0],
        [0.8, 0.112, 0.2705, 0.0003],
        [0.86, 0.16, 0.28, 0.012],
        [0.97, 0.08, 0.0, 0.0],
        [1, 0.07, 0, 0],
      ],
    },
    { type: 'burst', craft: 'sj21', t0: 0.4, color: '#fff1c1', ringColor: C.cn, size: 0.12, span: 0.07 },
    { type: 'trail', craft: 'sj21', t0: 0.47, t1: 0.97, color: C.cn },
    { type: 'trail', craft: 'cg2', t0: 0.5, t1: 0.8, color: C.dead },
  ],
  still: 0.78,
  staticT: 0.805, // static: just after the docked window, so the two craft are drawn apart (a gap, each at full size) above the belt
  staticStatus: 'SJ-21 pulls Compass G2 above the GEO belt (height and spacing exaggerated)',
  staticCraftScale: { sj21: 2.2, cg2: 2.2 },
  status: [
    [0, 'SJ-21 (China) approaches the defunct Compass G2 (25 Dec. 2021)', 'SJ-21 approaches defunct Compass G2'],
    [0.2, 'For several weeks SJ-21 stays very close to Compass G2', 'SJ-21 stays close to G2 for weeks'],
    [0.34, 'SWF: the two dock at some point; how is not described', 'SWF: they dock at some point'],
    [0.5, 'About 21 Jan. 2022: SJ-21 pulls both objects up with its own propulsion', 'About 21 Jan.: SJ-21 pulls both up'],
    [0.72, 'By 27 Jan. both are 290 to 3,100 km above the protected GEO zone (height exaggerated)', 'By 27 Jan.: 290–3,100 km above GEO zone'],
    [0.8, 'SWF does not describe the separation; it says SJ-21 later lowered its orbit back close to GEO', 'SJ-21 later lowered its orbit near GEO'],
    [0.96, 'SJ-21 is near GEO again; SWF’s table says Compass G2 was pulled “well past graveyard orbit”', 'G2 pulled “well past graveyard orbit”'],
  ],
  cameras: [
    { name: 'Follow the pair', ...ARM_TAG, fitCraft: { anchor: 'g', ids: ['sj21', 'cg2'], dir: [-0.3, 0.8, 0.55], fill: 0.98 } },
    { name: 'Whole event: Earth and the GEO belt', short: 'Whole event', at: [36, 104, 3.9], look: [0, 106, 1.9], phone: { at: [36, 104, 4.8] } },
    {
      name: 'Approach and docking, from the side',
      short: 'Approach and docking',
      ...ARM_TAG,
      fitCraft: { anchor: 'g', ids: ['sj21', 'cg2'], dir: [-0.95, 0.15, 0.3], fill: 0.62, dMin: 0.35, t: 0.3 },
    },
    {
      name: 'The pull: the pair rises above the belt',
      short: 'The pull',
      ...ARM_TAG,
      frame: { anchor: 'g', from: [0.1, 0.17, 0.7], to: [0.08, 0.17, 0], t: 0.6 },
      phone: { frame: { anchor: 'g', from: [0.1, 0.14, 1.05], to: [0.08, 0.14, 0], t: 0.6 } },
    },
    { name: 'Whole GEO belt', at: [26, 70, 7.4] },
  ],
  stillCam: { at: [24, 12, 4.7], look: [0, 105, 1.25], hideShell: true },
  staticCenter: [25, 72],
  staticCraftMax: 120,
  staticMarkerCap: { sj21: 280, cg2: 280 }, // the pair is the subject (280 px at the 22 px reference stage; global cap 22)
  staticCraftMaxPhone: 38,
  staticFitRing: true, // static: the whole GEO ring fits inside the panel at every width
};
