// scenes/configs/viasat.js: scene `viasat` (see ../config.js for the list order)
import { GEO_ALT, IS_PHONE } from '../core.js';
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
    'On 24 February 2022, within hours of Russia’s invasion of Ukraine, attackers later attributed to Russia wiped tens of thousands of satellite modems across Europe. ' +
    'Their “AcidRain” malware, software that erases a device’s data, reached the modems through the ground management network of KA-SAT, a communications satellite in geostationary orbit (GEO) about 36,000 km up. ' +
    'The satellite itself kept working. The attack hit the network on the ground. ' +
    'The Tallinn Manual 2.0 is an expert manual on how international law applies to cyber operations. It is soft law, meaning not binding, and dates from 2017, before the attack. ' +
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
      minPx: 34,
      maxPx: 72,
      label: 'KA-SAT (GEO, unaffected)',
      short: 'KA-SAT (GEO)',
      endLabel: 'KA-SAT (GEO): still working',
      endShort: 'KA-SAT: still works',
      endFrom: 0.62,
      dx: 130,
      dy: -46,
      color: C.geo,
      dimT0: 0.4,
      dimT1: 0.7,
      hub: [46, 8],
      hubLabel: 'Ground management network (drawn for illustration)',
      hubShort: 'Ground network',
      hubScale: 1.15,
      nodeScale: 0.85,
      hubDx: -200,
      hubDy: 52,
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
      compactStatus: true,
      ragged: true, // soft-edged, clumpy regions instead of flat slabs of dots
      pulse0: 0.1,
      t0: 0.3,
      t1: 0.62,
      labelOffDisc: true, // stills: the label sits beside the globe, not on it
      label: 'Ground terminals (modems)',
      short: 'Terminals',
      labelDx: IS_PHONE ? 125 : 150,
      labelDy: IS_PHONE ? -104 : -130,
    },
    // One shock ring per region, in the order the modems go dark (illustrative regions; SWF gives no region order).
    { type: 'flash', at: [48, 31, 0], t0: 0.3, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
    { type: 'flash', at: [51, 14, 0], t0: 0.38, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
    { type: 'flash', at: [46, 1, 0], t0: 0.46, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
    { type: 'flash', at: [57, 16, 0], t0: 0.54, color: '#ffb3b3', ringColor: '#ff6b6b', size: 0.2, span: 0.14 },
  ],
  steps: [
    [0, 'Normal service: KA-SAT serves modems across Ukraine and Europe'],
    [0.1, 'Attackers send AcidRain, a data-erasing program, into the ground network'],
    [0.3, 'Commands reach modems region by region; they are wiped and go offline'],
    [0.62, 'Tens of thousands of modems are offline; the satellite keeps working'],
    [0.8, 'Attributed to Russia’s military intelligence (GRU) by the US, UK and EU in May 2022 (SWF, p. 15-07)'],
  ],

  insetHalo: true, // dark casing on the inset's KA-SAT text (it sat on the blue globe)
  insetPhone: 'Top view',
  insetEnd: { from: 0.3, title: 'Top view: KA-SAT (off frame) still works', phone: 'KA-SAT works' }, // the closing note on the satellite, which is out of the Europe frame
  insetSizePhone: [92, 76], // 375: a small inset in the corner, clear of the Terminals pill
  still: 0.75,
  stillOff: { KA: [-250, 20] }, // the still: the satellite pill sits left of the satellite, clear of the caption
  camDist: 5.6,
  focus: [33, 12],
  shellLabels: { GEO: null },
  offFrom: { 'Ground network': 0.45 }, // before this the placer's own slot above the hub is clear
  liveOff: { 'Ground network': [40, 72] }, // desktop: the label sits in the Atlantic to the west, off the modem field
  liveShort: ['Ground terminals', 'Ground management'], // the full text puts a corner of the label on the Earth at 900 px on the wide camera
  staticZoom: 1.5,
  stillCam: { at: [10, 12, 3.9], look: [24, 13, 0.5], hideShell: true },
  cameras: [
    {
      name: 'KA-SAT to Europe',
      short: 'KA-SAT',
      insetRef: true,
      // KA-SAT is in frame at the start; from the first commands the view tilts and closes in on Europe, where the terminals are (the inset keeps KA-SAT in view)
      glide: [
        [0, [10, 11, 4.3], [8, 9, 1.0]],
        [0.3, [10, 11, 4.3], [8, 9, 1.0]],
        [0.37, [30, 13, 2.35], [55, 25, 1.0]],
        [1, [30, 13, 2.35], [55, 25, 1.0]],
      ],
      narrowK: 1, // phone: the glide's own distances carry the zoom (about 12% in, KA-SAT still in frame)
      phone: {
        glide: [
          [0, [10, 12, 4.15], [6, 22, 1.0]],
          [0.2, [10, 12, 4.15], [6, 22, 1.0]],
          [0.32, [30, 13, 2.6], [52, 17, 1.0]],
          [1, [30, 13, 2.6], [52, 17, 1.0]],
        ],
      },
    },
    { name: 'Europe close up', short: 'Europe', at: [32, 14, 2.15], look: [50, 19, 1.0], insetRef: true, phone: { at: [32, 14, 2.2], look: [56, 20, 1.0] } }, // the close view of the regions (KA-SAT is out of frame here by design; the first camera keeps it in view)
    { name: 'Ground network', short: 'Network', at: [42, -2, 2.3], look: [46, 14, 1.0], ref: false },
    { name: 'Whole scene', at: [30, -6, 6.5], hide: ['Ground management'] }, // its label would need a leader across the whole globe
  ],
};
