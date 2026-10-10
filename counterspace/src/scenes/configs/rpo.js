// scenes/configs/rpo.js: scene `rpo` (see ../config.js for the list order)
import { GEO_ALT, IS_PHONE } from '../core.js';
import { C, PK } from './shared.js';

const MIN_PX = IS_PHONE ? 62 : 90, // craft model size range (px): larger than before on the desk, kept modest on a phone and in the PNG still
  MAX_PX = IS_PHONE ? 96 : 136;

export const RPO = {
  id: 'rpo',
  date: '2025-06-13',
  title: 'Close approaches: China, the US and Russia (2019–2026)',
  shells: [],
  duration: 32,
  lede: 'These are three separate close approaches, also called rendezvous and proximity operations, taken from the Secure World Foundation’s tables. A close approach is not an attack.',
  caption:
    'Three separate close approaches (also called rendezvous and proximity operations), from the Secure World Foundation’s (SWF) tables. ' +
    '(1) In 2025, in geostationary orbit (GEO), about 36,000 km up, China’s SJ-21 and SJ-25 approached, appeared to dock (join together) and later separated, while two US GSSAP satellites (Geosynchronous Space Situational Awareness Program) were positioned “flanking” them. ' +
    '(2) In 2019–20, in low Earth orbit (LEO), up to 2,000 km up, Russia’s Cosmos 2542 released Cosmos 2543, which then worked near a US imaging satellite, USA 245. ' +
    '(3) In 2025, in GEO, a US GSSAP satellite and the UK’s SKYNET 5A took part in a jointly announced close approach. ' +
    'SWF hedges the intent behind the first two. A close approach is not an attack. No treaty or resolution on this page’s law timeline is tied to these events.',
  cite:
    'Secure World Foundation, 2026: Tables 1-3 (p. 01-15), 2-3 (p. 02-15) and 3-2 (p. 03-16); SJ-21 and SJ-25, pp. 03-12 to 03-13; ' +
    'Cosmos 2542, pp. 02-09 to 02-10; USA 271 and SKYNET 5A, p. 01-14.',
  related: null,
  event: 'cn-2025-sj21-sj25-docking',
  epChip: ['China and the US in GEO', 'Russia in LEO', 'The US and the UK in GEO'], // the in-picture chip names the episode on screen
  epChipShort: ['China, US in GEO', 'Russia in LEO', 'US, UK in GEO'],
  epChipMerge: true, // 375: one chip, "Drawn for illustration · 2 of 3: Russia in LEO"
  panels: [
    {
      t: 0.3,
      title: '1 · GEO, 2025',
      brief: 'SJ-21 + SJ-25 appear to dock',
      short: 'SJ-21 + SJ-25',
      dropPhone: ['GEO belt', 'SJ-21 + SJ-25', 'USA 271', 'USA 270'], // 375: the panel title already names the docked pair; USA 271 would sit under the title (USA 270 stays)
      status: 'SJ-21 and SJ-25 appear to dock; two US GSSAP satellites sit “flanking” them',
    },
    {
      t: 0.6,
      title: '2 · LEO, 2019–20',
      brief: 'Cosmos 2543 near USA 245',
      short: 'Cosmos 2543',
      dropPhone: ['Cosmos 2542'], // 375: the pair's labels would cross USA 245's leader
      status: 'Cosmos 2543, released by Cosmos 2542, works near USA 245',
    },
    {
      t: 0.85,
      title: '3 · GEO, 2025',
      brief: 'USA 271 near SKYNET 5A',
      short: IS_PHONE ? 'USA 271 + SKYNET 5A' : 'USA 271',
      dropPhone: ['GEO belt', 'USA 271', 'SKYNET 5A'], // 375: the panel title names both satellites
      status: 'USA 271 and SKYNET 5A: a jointly announced US–UK close approach',
    },
  ],
  phoneCamOff: { 2: { 'Cosmos 2543': [-88, -62] } }, // 375: the Cosmos 2543 chip sits off the Earth's limb, above the craft
  liveText: { 'Within 1 km (13 June)': 'Within 1 km' }, // live desktop: the date is in the step text; the shorter chip stays off the Earth's disc
  narrowK: 1, // phone: the act cameras are fitted to the craft already; a further tighten cut USA 245 off
  leaderK: 0.3, // a place or orbit name that sits just off its line still gets a leader (the GEO belt name floated free)
  leaderCams: [1, 3], // only in the two GEO episode views
  camOff: {
    0: { 'Within 20': [50, 52], 'USA 245': [-60, 90] },
    2: { 'Within 20': [50, 52], 'USA 245': [-60, 90] },
    1: { 'SJ-25': [70, 62], 'SJ-21': [56, -78] },
  }, // act 1 view: // the two names on opposite sides (leaders never overlap) once the pair separates
  labelEase: true, // labels glide instead of jumping each frame
  actFade: true, // a short cross-fade over the cut between episodes
  inset: 'Top view',
  insetCorner: IS_PHONE ? 'bl' : undefined, // 375: the top view sits at the lower left, clear of the satellites
  insetNoPhone: true,
  insetSize: [128, 96], // desktop: 20% smaller than the default, off the GEO craft at the top right
  insetSizePhone: [92, 74],
  scaleNote:
    'The distances between spacecraft are exaggerated and orbital motion is slowed so that each episode can be seen. ' +
    'The three episodes happened at different times and in different places.',
  anchors: { g1: { geo: { lon: 127 } }, l1: { orbit: { alt: 600, inc: 97.9, through: [58, 52], tThrough: 0.57, du: 0.4 } }, g3: { geo: { lon: 95.3 } } },
  acts: [
    { t0: 0, t1: 0.42, cam: 1 },
    { t0: 0.42, t1: 0.72, cam: 2 },
    { t0: 0.72, t1: 1, cam: 3 },
  ],
  actors: [
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, thick: 0.004, opacity: 0.6, inset: true, push: 0.2, label: 'GEO belt' },
    { type: 'ring', alt: 600, inc: 97.9, raan: 40, color: '#8fd0ff', thick: 0.0016, opacity: 0.1, inset: true, push: 0.08, fadeDisc: true }, // fadeDisc: no long orbit lines drawn across the Earth
    // ---- 1 · China + US in GEO (SJ-21, SJ-25, USA 270, USA 271), June 2025 to January 2026
    {
      type: 'craft',
      id: 'sj25',
      variant: 'tug',
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'g1',
      acts: [0],
      color: C.cn,
      scale: 1.5 * PK,
      label: 'SJ-25 (China)',
      short: 'SJ-25',
      dx: IS_PHONE ? -20 : 70,
      dy: IS_PHONE ? 44 : 48,
      labelFn: (t) => (t >= 0.27 && t < 0.335 ? null : 'SJ-25 (China)'),
      key: [
        [0, 0, 0, 0],
        [0.335, 0, 0, 0],
        [0.355, -0.1, 0, 0],
        [0.385, -0.06, 0, 0.01],
        [0.398, -0.05, 0, 0],
        [0.415, -0.3, 0, 0],
      ],
    },
    {
      type: 'craft',
      id: 'sj21b',
      variant: 'tug',
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'g1',
      acts: [0],
      color: C.cn,
      bright: true,
      scale: 1.5 * PK,
      label: 'SJ-21 (China)',
      short: 'SJ-21',
      dx: 30,
      dy: -44,
      labelFn: (t, n) => (t >= 0.27 && t < 0.335 ? (n ? 'SJ-21 + SJ-25' : 'SJ-21 + SJ-25' + ' (docked)') : 'SJ-21 (China)'),
      dock: { with: 'sj25', t0: 0.27, t1: 0.335 },
      key: [
        [0, 0.62, 0, 0.01],
        [0.09, 0.26, 0, 0],
        [0.15, 0.2, 0, 0],
        [0.175, 0.1, 0, 0],
        [0.21, 0.24, 0, 0],
        [0.245, 0.1, 0, 0.005],
        [0.27, 0, 0, 0],
        [0.335, 0, 0, 0],
        [0.355, 0.1, 0, 0],
        [0.42, 0.1, 0, 0],
      ],
    },
    {
      type: 'craft',
      id: 'usa270',
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'g1',
      acts: [0],
      color: C.us,
      scale: 1.4 * PK,
      label: 'USA 270 (US GSSAP)',
      short: 'USA 270',
      dx: IS_PHONE ? -10 : -30,
      dy: IS_PHONE ? -40 : -58,
      key: [
        [0, -1.0, -0.05, 0.02],
        [0.13, -0.5, -0.05, 0.02],
        [0.42, -0.5, -0.05, 0.02],
      ],
    },
    {
      type: 'craft',
      id: 'usa271',
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'g1',
      acts: [0],
      color: C.us,
      scale: 1.4 * PK,
      label: 'USA 271 (US GSSAP)',
      short: 'USA 271',
      dx: 20,
      dy: -34,
      key: [
        [0, 1.0, 0.05, -0.02],
        [0.13, 0.55, 0.05, -0.02],
        [0.42, 0.55, 0.05, -0.02],
      ],
    },
    // ---- 2 · Russia in LEO (Cosmos 2542, Cosmos 2543, USA 245), December 2019 to January 2020
    {
      type: 'craft',
      id: 'c2542',
      minPx: IS_PHONE ? 62 : 80,
      maxPx: IS_PHONE ? 96 : 116,
      anchor: 'l1',
      acts: [1],
      color: C.ru,
      scale: 1.5 * PK,
      label: 'Cosmos 2542 (Russia)',
      short: 'Cosmos 2542',
      dx: IS_PHONE ? -24 : 104,
      dy: IS_PHONE ? 46 : -36,
      key: [
        [0.42, 0, 0, 0],
        [0.72, 0, 0, 0],
      ],
    },
    { type: 'range', a: 'sj21b', b: 'sj25', t0: 0.16, t1: 0.235, label: 'Within 1 km (13 June)', short: '≤ 1 km' }, // COMSPOC: on 13 June within 1 km
    { type: 'range', a: 'sj21b', b: 'sj25', t0: 0.385, t1: 0.415, label: 'Just under 3 km (13 Jan.)', short: '< 3 km' },
    { type: 'burst', craft: 'c2542', t0: 0.447, color: '#ffd9c0', ringColor: C.ru, size: 0.1, span: 0.05 },
    {
      type: 'craft',
      id: 'c2543',
      minPx: IS_PHONE ? 50 : 58,
      maxPx: IS_PHONE ? 74 : 86,
      anchor: 'l1',
      acts: [1],
      vis: [0.447, 0.72],
      color: C.ru,
      small: true,
      scale: 1.6 * PK,
      label: 'Cosmos 2543',
      short: 'Cosmos 2543',
      dx: 66,
      dy: 54, // right of and below the craft: its leader runs down-right, away from Cosmos 2542's chip above
      labelFn: (t, n, s) => (n || s || t > 0.62 ? 'Cosmos 2543' : 'Cosmos 2543 (small satellite)'),
      arcs: [{ t0: 0.53, t1: 0.6, o: [0, 0.07, 0] }],
      key: [
        [0.42, 0, 0, 0],
        [0.447, 0, 0, 0],
        [0.48, 0.08, 0.012, 0.014],
        [0.53, 0.1, 0.014, 0.014],
        [0.6, 0.42, 0.1, 0.02],
        [0.645, 0.53, 0.06, 0.025],
        [0.68, 0.4, 0.09, 0.02],
        [0.72, 0.3, 0.1, 0.02],
      ],
    },
    { type: 'range', a: 'c2543', b: 'c2542', t0: 0.47, t1: 0.53, label: 'Within 2 km', short: '≤ 2 km' },
    { type: 'range', a: 'c2543', b: 'usa245', t0: 0.6, t1: 0.665, label: 'Within 20 km (Jan. 2020)', short: '≤ 20 km' },
    { type: 'trail', craft: 'c2543', t0: 0.447, t1: 0.68, color: C.ru, acts: [1] },
    {
      type: 'craft',
      id: 'usa245',
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'l1',
      acts: [1],
      color: C.us,
      scale: 1.4 * PK,
      label: 'USA 245 (US satellite)',
      short: 'USA 245',
      dx: 40,
      dy: -40,
      key: [
        [0.42, 0.62, 0.03, 0.05],
        [0.72, 0.6, 0.03, 0.05],
      ],
    },
    // ---- 3 · US + UK in GEO (USA 271, SKYNET 5A), September 2025
    {
      type: 'craft',
      id: 'sky',
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'g3',
      acts: [2],
      color: '#cfd8ea',
      scale: 1.5 * PK,
      label: 'SKYNET 5A (UK)',
      short: 'SKYNET 5A',
      dx: -20,
      dy: 42,
      key: [
        [0.72, 0, 0, 0],
        [1, 0, 0, 0],
      ],
    },
    {
      type: 'craft',
      id: 'usa271b',
      spline: true, // a smooth track through the keyframes, not a kinked wake
      minPx: MIN_PX,
      maxPx: MAX_PX,
      anchor: 'g3',
      acts: [2],
      color: C.us,
      bright: true,
      scale: 1.5 * PK,
      label: 'USA 271 (US GSSAP)',
      short: 'USA 271',
      dx: 20,
      dy: -40,
      arcs: [{ t0: 0.72, t1: 0.8, o: [0, 0.06, 0] }],
      key: [
        [0.72, 0.95, 0.05, 0],
        [0.8, 0.3, 0.05, 0],
        [0.83, 0.12, 0.05, 0],
        [0.93, 0.12, 0.05, 0],
        [1, -0.4, 0.05, 0],
      ],
    },
    { type: 'range', a: 'usa271b', b: 'sky', t0: 0.84, t1: 0.94, label: 'Closest about 13 km', short: '~ 13 km' },
    { type: 'burst', craft: 'usa271b', t0: 0.82, color: '#cfe8ff', ringColor: C.us, size: 0.1, span: 0.05 },
    { type: 'trail', craft: 'usa271b', t0: 0.72, t1: 0.83, color: C.us, acts: [2] },
  ],
  still: 0.3,
  stillShort: ['USA 271', 'USA 245', 'Cosmos 2542'],
  stillOff: { 'USA 245': [-110, 175] }, // the live still: shorter names keep leaders short and the two Cosmos chips apart
  staticCenter: [28, 92],
  staticStatus: 'Three separate episodes shown together: (1) China and the US in GEO, 2025; (2) Russia in LEO, 2019–20; (3) the US and the UK in GEO, 2025',
  captionShort: true, // the picture's caption is the short text at every width; the step list keeps the full sentence
  status: [
    [0, 'GEO, June 2025: China’s SJ-21 drifts west along the belt toward SJ-25', 'GEO 2025: SJ-21 drifts toward SJ-25'],
    [0.08, 'Two US GSSAP satellites move to positions that COMSPOC, a tracking firm, calls “flanking”', 'US GSSAP satellites “flanking” them'],
    [0.16, '13 June: within 1 km, possibly docked, then separated (COMSPOC)', '13 June: within 1 km, possibly docked'],
    [0.235, '30 June: again close enough to dock; 2–6 July: “thought to have docked”', '30 June–6 July: “thought to have docked”'],
    [0.29, 'SWF: they “remained docked until November 2025”', 'SWF: “remained docked until November 2025”'],
    [0.34, '25 Nov.: SJ-25 fires its engine to separate; imagery on 29 Nov. shows two satellites', '25 Nov.: SJ-25 fires to separate'],
    [0.385, 'Jan.: closest just under 3 km (13 Jan.); 130 km apart by 16 Jan.', 'Jan.: closest just under 3 km (13 Jan.)'],
    [0.42, 'LEO, 6 Dec. 2019: Russia’s Cosmos 2542 releases a small satellite, Cosmos 2543', 'LEO 2019: Cosmos 2542 releases 2543'],
    [0.47, 'Cosmos 2543 stays within 2 km of Cosmos 2542 for three days', 'Cosmos 2543 stays within 2 km for three days'],
    [0.53, 'It then raises its apogee (highest point) to 590 km by 16 Dec.', 'It raises its highest point to 590 km'],
    [0.6, 'Amateur analysis “strongly suggests” aim was to watch USA 245; within 20 km', 'Analysis: aim was to observe USA 245'],
    [0.665, 'Russia’s Foreign Ministry said Cosmos 2543 posed no threat to USA 245', 'Russia: Cosmos 2543 posed no threat'],
    [0.72, 'GEO, Sept. 2025: USA 271 (US GSSAP) drifts west, about 1.5° per day, toward SKYNET 5A', 'GEO 2025: USA 271 nears SKYNET 5A'],
    [0.8, '4 Sept.: a maneuver along its orbit; USA 271 stops within 0.05° of SKYNET 5A near 95.3° E', '4 Sept.: USA 271 stops near SKYNET 5A'],
    [0.84, '5–11 Sept.: closest about 13 km; first joint US–UK approach (announced by both)', '5–11 Sept.: closest about 13 km'],
    [0.94, 'The close approach lasted roughly 5–11 Sept. (SWF)', 'Lasted roughly 5–11 Sept. (SWF)'],
  ],
  cameras: [
    { name: 'All three episodes', auto: true, at: [30, 90, 4.9], look: [0, 121, 2.0], phone: { at: [30, 90, 6.0] } },
    {
      name: 'China and the US in GEO',
      act: 0,
      fitCraft: {
        anchor: 'g1',
        ids: ['sj25', 'sj21b', 'usa270', 'usa271'],
        dir: [-0.3, 0.8, 0.55],
        fill: IS_PHONE ? 0.76 : 0.92,
        t: 0.2,
        include: IS_PHONE ? undefined : [[0, -0.8, 0]],
      },
    },
    { name: 'Russia in LEO', act: 1, fitCraft: { anchor: 'l1', ids: ['c2542', 'c2543', 'usa245'], dir: [-0.2, 0.75, 0.6], fill: 0.88, t: 0.57, shiftR: 0.07 } },
    {
      name: 'The US and the UK in GEO',
      act: 2,
      fitCraft: {
        anchor: 'g3',
        ids: ['sky', 'usa271b'],
        dir: [-0.3, 0.8, 0.55],
        fill: IS_PHONE ? 0.76 : 0.92,
        t: 0.85,
        include: IS_PHONE ? undefined : [[0, -0.8, 0]],
      },
    },
    {
      name: 'Whole scene: Earth and the GEO belt',
      at: [38, 100, 7.2],
      phone: { at: [38, 100, 10] },
      ref: false,
      hide: IS_PHONE ? ['USA 245', 'SJ-25', 'SJ-21', 'USA 270', 'USA 271'] : ['USA 245', 'SJ-25'],
    }, // unlocked from the tour
  ],
};
