// scenes/configs/viasat.js: scene `viasat` (see ../config.js for the list order)
import { GEO_ALT } from '../core.js';
import { C } from './shared.js';

export const VIASAT = {
  id: 'viasat',
  inset: 'Top view: KA-SAT in GEO',
  date: '2022-02-24',
  title: 'Viasat KA-SAT: a cyberattack on a satellite network (2022)',
  staticMarkerCap: { 'KA-SAT (GEO, unaffected)': 48 }, // KA-SAT is the satellite the story is about (48 px at the 22 px reference stage)
  shells: ['GEO'],
  duration: 14,
  caption:
    'On 24 February 2022, within hours of Russian troops crossing into Ukraine, attackers later ' +
    'attributed to Russia wiped tens of thousands of satellite modems in Ukraine and across Europe. ' +
    'They sent destructive “AcidRain” malware, harmful software that erases the data ' +
    'on a device, through the ground management network of the KA-SAT satellite. ' +
    'KA-SAT is a communications satellite in geostationary orbit (GEO), about 36,000 km up. ' +
    'The satellite itself kept working. The attack hit the network on the ground. ' +
    'The Tallinn Manual 2.0 is an expert manual on how international law applies to cyber operations. ' +
    'It is soft law, meaning it is not binding, and it dates from 2017, before the attack. ' +
    'The ground network and the order in which regions go dark are drawn for illustration.',
  cite: 'Secure World Foundation, 2026, pp. 15-06 to 15-07 (Viasat case study).',
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
      hubLabel: 'Ground management network',
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
    [0, 'The network works normally: KA-SAT serves user modems across Ukraine and Europe'],
    [0.1, 'Attackers send AcidRain, a data-erasing program, into the ground management network'],
    [0.3, 'Commands reach user modems region by region; the modems are wiped and go offline'],
    [0.62, 'Tens of thousands of modems are offline; the satellite itself keeps operating'],
    [0.8, 'Attributed to Russia’s military intelligence (GRU) by the US, UK and EU in May 2022 (SWF, p. 15-07)'],
  ],
  still: 0.75,
  camDist: 5.6,
  focus: [33, 12],
  shellLabels: { GEO: null },
  liveShort: ['Ground terminals'], // the full text puts a corner of the label on the Earth at 900 px on the wide camera
  staticZoom: 1.5,
  stillCam: { at: [10, 12, 3.9], look: [24, 13, 0.5], hideShell: true },
  cameras: [
    { name: 'Europe close up', short: 'Europe', at: [32, 14, 2.15], look: [50, 19, 1.0], phone: { at: [32, 14, 2.2], look: [56, 20, 1.0] }, insetRef: true },
    { name: 'Europe and KA-SAT', short: 'Wider Europe', at: [10, 12, 3.9], look: [24, 13, 0.5], phone: { at: [10, 12, 4.5] } },
    { name: 'Ground network', short: 'Network', at: [42, -2, 2.3], look: [46, 14, 1.0], ref: false },
    { name: 'Whole scene', at: [30, -6, 6.5], hide: ['Ground management'] }, // its label would need a leader across the whole globe
  ],
};
