// scenes/configs/sj21-tug.js: scene `sj21-tug` (see ../config.js for the list order)
import { GEO_ALT } from '../core.js';
import { C, PK } from './shared.js';

// SJ-21 presets that show the docked pair carry this note: SWF says SJ-21 "docked" with Compass G2 but does not describe any arm or grapple.
const ARM_TAG = { tag: 'Arm: not shown (SWF does not describe the mechanism)', tagShort: 'Arm: not shown (not in SWF)' };

export const SJ21_TUG = {
  id: 'sj21-tug',
  date: '2022-01-21',
  title: 'SJ-21 pulls a defunct satellite out of the GEO belt (2022)',
  shells: [],
  duration: 24,
  caption:
    'SWF reports that China’s SJ-21 rendezvoused with Compass G2, a defunct Chinese navigation satellite, in December 2021, “docked to it at some ' +
    'point”, and around 21 January 2022 used its own propulsion to pull both objects above the GEO belt (by 27 January: 290 to 3,100 km above the ' +
    'protected zone). SJ-21 then came back down close to GEO. ' +
    'SWF does not say how SJ-21 captured or docked with Compass G2, so the scene shows a docking contact, not an arm. ' +
    'SWF does report robotic-arm demonstrations on other Chinese satellites: SY-7 (2013, p. 03-02) and Aolong-1 (2016, p. 03-04).',
  cite:
    'SWF 2026, p. 03-11 (SJ-21 and Compass G2) and Table 3-2, p. 03-15; robotic arms on other satellites: SY-7 p. 03-02, Aolong-1 p. ' +
    '03-04, SJ-17 p. 03-08.',
  related: null,
  event: 'cn-2022-sj21-compass-g2',
  inset: 'Context: top view',
  insetNoPhone: true, // on a phone the inset would cover the docked pair
  scaleNote: 'Heights above the belt, the spacing between the two spacecraft and their position along the belt are illustrative.',
  anchors: { g: { geo: { lon: 105 } } },
  actors: [
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, thick: 0.005, opacity: 0.85, inset: true, label: 'GEO belt (35,786 km)' },
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
        [0, 0.1, 0.72, 0],
        [1, 0.1, 0.72, 0],
      ], // static: well above the belt line
      dx: 60,
      dy: 34,
      labelFn: (t) => (t >= 0.4 && t < 0.8 ? null : 'Compass G2 (defunct)'),
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
        [0, 0.1, 0.72, 0],
        [1, 0.1, 0.72, 0],
      ], // static: well above the belt line
      dx: -68,
      dy: -12,
      labelFn: (t, n) => (t >= 0.4 && t < 0.8 ? (n ? 'SJ-21 + G2 docked' : 'SJ-21 + Compass G2 (docked)') : 'SJ-21' + ' (China)'),
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
  staticT: 0.74, // static: the pair drawn clearly above the belt (not straddling the ring)
  status: [
    [0, 'SJ-21 (China) approaches Compass G2, a defunct Chinese navigation satellite (25 Dec. 2021)', 'SJ-21 approaches defunct Compass G2'],
    [0.2, 'For several weeks SJ-21 keeps in tight proximity to Compass G2', 'SJ-21 stays close to G2 for weeks'],
    [0.34, 'SWF: SJ-21 “docked to it at some point” (how is not described)', 'SWF: SJ-21 “docked to it at some point”'],
    [0.5, 'Around 21 Jan. 2022 SJ-21’s own propulsion pulls both objects above the GEO belt', 'About 21 Jan.: SJ-21 pulls both above GEO'],
    [0.72, 'By 27 Jan. both are in an orbit 290–3,100 km above the protected GEO zone (height exaggerated)', 'By 27 Jan.: 290–3,100 km above GEO zone'],
    [0.8, 'SWF does not describe the separation; it says SJ-21 later lowered its orbit back close to GEO', 'SJ-21 later lowered its orbit near GEO'],
    [0.96, 'SJ-21 is near GEO again; SWF’s table says Compass G2 was pulled “well past graveyard orbit”', 'G2 pulled “well past graveyard orbit”'],
  ],
  cameras: [
    { name: 'Follow the pair (tight + context inset)', ...ARM_TAG, fitCraft: { anchor: 'g', ids: ['sj21', 'cg2'], dir: [-0.3, 0.8, 0.55], fill: 0.93 } },
    { name: 'Whole event (Earth + GEO belt)', short: 'Whole event', at: [36, 104, 3.9], look: [0, 106, 1.9], phone: { at: [36, 104, 4.8] } },
    { name: 'Approach and docking', ...ARM_TAG, fitCraft: { anchor: 'g', ids: ['sj21', 'cg2'], dir: [-0.9, 0.3, 0.55], fill: 0.7, dMin: 0.5, t: 0.3 } },
    { name: 'Pull (angled)', fitCraft: { anchor: 'g', ids: ['sj21', 'cg2'], dir: [-0.7, 0.55, 0.45], fill: 0.7, dMin: 0.5, t: 0.6 } },
    { name: 'GEO belt (wide)', at: [26, 70, 7.4] },
  ],
  stillCam: { at: [24, 12, 4.7], look: [0, 105, 1.25], hideShell: true },
  staticCenter: [25, 72],
  staticCraftMax: 84,
  staticMarkerCap: { sj21: 100, cg2: 100 }, // the docked pair is the subject (100 px at the 22 px reference stage; global cap 22)
  staticCraftMaxPhone: 38,
  staticFitRing: true, // static: the whole GEO ring fits inside the panel at every width
};
