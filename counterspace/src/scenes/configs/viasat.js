// scenes/configs/viasat.js: scene `viasat` (see ../config.js for the list order)
import { GEO_ALT } from '../core.js';
import { C } from './shared.js';

export const VIASAT = {
  id: 'viasat',
  inset: 'Context: KA-SAT in GEO (top view)',
  date: '2022-02-24',
  title: 'Viasat KA-SAT cyberattack (2022)',
  staticMarkerCap: { 'KA-SAT (GEO, unaffected)': 48 }, // KA-SAT is the satellite the story is about (48 px at the 22 px reference stage)
  shells: ['GEO'],
  duration: 14,
  caption:
    'Within hours of Russian troops crossing into Ukraine in February 2022, attackers pushed destructive “AcidRain” malware through KA-SAT’s ground ' +
    'management network. Tens of thousands of user modems in Ukraine and across Europe went dark. ' +
    'The satellite itself kept working: the attack hit the ground segment.',
  cite: 'SWF 2026, pp. 15-06 to 15-07 (attributed to Russia by the US, UK and EU, May 2022).',
  related: 'tallinn-2017',
  event: 'ru-2022-viasat',
  actors: [
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, thick: 0.003, opacity: 0.5, inset: true },
    {
      type: 'geo',
      lon: 9,
      insetLabel: 'KA-SAT',
      minPx: 26,
      maxPx: 64,
      label: 'KA-SAT (GEO, unaffected)',
      short: 'KA-SAT (GEO)',
      dx: 0,
      dy: -50,
      color: C.geo,
      dimT0: 0.4,
      dimT1: 0.7,
      hub: [46, 8],
      hubLabel: 'Ground management network (illustrative)',
      hubShort: 'Ground network',
      hubDx: -60,
      hubDy: 40,
      pulse: [0.1, 0.3],
      beams: [
        [50, 30],
        [48, 10],
        [52, 0],
        [46, 20],
        [55, 15],
      ],
    },
    {
      type: 'terminals',
      boxes: [
        [44, 52, 22, 40, 0.34, 0],
        [47, 55, 6, 22, 0.28, 1],
        [43, 50, -6, 8, 0.2, 2],
        [54, 60, 6, 26, 0.18, 3],
      ],
      count: 900,
      pulse0: 0.1,
      t0: 0.3,
      t1: 0.62,
      labelOffDisc: true, // stills: the label sits beside the globe, not on it
      label: 'Ground terminals (modems)',
      short: 'Terminals',
      labelDx: 120,
      labelDy: -84,
    },
    // One shock ring per region, in the order the modems go dark (illustrative regions; SWF gives no region order).
    { type: 'flash', at: [48, 31, 0], t0: 0.3, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
    { type: 'flash', at: [51, 14, 0], t0: 0.38, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
    { type: 'flash', at: [46, 1, 0], t0: 0.46, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
    { type: 'flash', at: [57, 16, 0], t0: 0.54, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
  ],
  steps: [
    [0, 'Network normal: KA-SAT serves user modems across Ukraine and Europe'],
    [0.1, 'Attackers push AcidRain wiper malware through the ground' + ' management network'],
    [0.3, 'Commands reach user modems region by region; modems are wiped and go offline'],
    [0.62, 'Tens of thousands of modems offline; the satellite itself keeps operating'],
    [0.8, 'Attributed to Russia (GRU) by the US, UK and EU in May 2022 (SWF' + ' 15-07)'],
  ],
  still: 0.75,
  camDist: 5.6,
  focus: [33, 12],
  shellLabels: { GEO: null },
  liveShort: ['Ground terminals'], // the full text puts a corner of the label on the Earth at 900 px on the wide camera
  staticZoom: 1.5,
  stillCam: { at: [10, 12, 3.9], look: [24, 13, 0.5], hideShell: true },
  cameras: [
    { name: 'Europe (zoom)', short: 'Europe', at: [32, 14, 2.15], look: [50, 19, 1.0], phone: { at: [32, 14, 2.2], look: [56, 20, 1.0] }, insetRef: true },
    { name: 'Europe + KA-SAT', short: 'Wide Europe', at: [10, 12, 3.9], look: [24, 13, 0.5], phone: { at: [10, 12, 4.5] } },
    { name: 'Ground network', short: 'Network', at: [42, -2, 2.3], look: [46, 14, 1.0], ref: false },
    { name: 'Wide', at: [30, -6, 6.5], hide: ['Ground management'] }, // its label would need a leader across the whole globe
  ],
};
