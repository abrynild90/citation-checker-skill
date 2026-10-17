// scenes/configs/dn2.js: scene `dn2` (see ../config.js for the list order)
import { GEO_ALT, IS_PHONE } from '../core.js';
import { C } from './shared.js';

export const DN2 = {
  id: 'dn2',
  explanationAlt:
    'Two accounts of the rocket’s highest point: China stated 10,000 km; analysis cited by the Secure World Foundation estimated 30,000 km or more. Geostationary orbit is at 35,786 km. These are separate reported figures, not successive measurements of a known trajectory. No target was hit.',
  date: '2013-05-13',
  title: 'DN-2: China’s “high-altitude science” rocket launch (2013)',
  shells: ['LEO', 'MEO', 'GEO'],
  duration: 14,
  scaleNote:
    'The launch and reported heights are sourced. The flight path, rocket shape, timing and re-entry position are illustrative, not a reconstructed trajectory.',
  lede: 'On 13 May 2013 China launched a DN-2 rocket from Xichang on a path that reaches space and falls back without completing an orbit. It climbed toward geostationary orbit, the ring about 36,000 km above the equator, and it had no target.',
  caption:
    'On 13 May 2013 China launched a DN-2 rocket from Xichang on a suborbital path, a flight that reaches space and falls back without completing an orbit. ' +
    'It climbed toward geostationary orbit (GEO), the ring about 36,000 km above the equator where a satellite stays above the same point on the Earth. ' +
    'China said it reached 10,000 km. The US military said it went “nearly to GEO”, and US officials said the upper stages re-entered “over the Indian Ocean”. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, cites an analysis that puts the highest point, its apogee, at 30,000 km or more. ' +
    'There was no target, so this was not an intercept (a missile hitting its target). The launch showed how far the rocket could reach. ' +
    'No treaty or resolution on this page’s law timeline is tied to this launch.',
  cite: 'Secure World Foundation, 2026, pp. 03-20, 03-22.',
  related: null,
  event: 'cn-2013-dn2',
  actors: [
    {
      type: 'site',
      at: [28.2, 102.0],
      label: 'Xichang',
      color: C.ground,
      offGlobe: true,
      staticAt: [0.78, 0.47],
      staticPin: 'hard',
    },
    {
      type: 'suborbital',
      from: [28.2, 102.0],
      to: [-20.0, 78.0],
      apex: 30000,
      t0: 0.05,
      t1: 0.9,
      color: '#ff7a7a',
      thick: IS_PHONE ? 0.011 : 0.02,
      label: 'DN-2 path: no intercept',
      short: 'DN-2 path · no target',
      labelIdx: 0.17,
      labelStart: 0.22, // the pill waits until the rocket has left it behind (it sat on the rocket, its leader hanging off the frame, at the start)
      dx: -40,
      dy: -50,
      head: true,
      wakeOp: 0.62, // the path behind the rocket stays readable (the coast through the apogee and the fall are slow on screen)
      ghostOpacity: 0.25, // the whole planned path stays readable before the rocket flies it
      rocket: {
        style: 'slim',
        minPx: IS_PHONE ? 54 : 144,
        maxPx: IS_PHONE ? 72 : 172,
        glowMin: 10,
        glowMax: 16,
        pad: { minPx: IS_PHONE ? 30 : 44, maxPx: IS_PHONE ? 44 : 64 },
        sizeSteps: IS_PHONE ? null : [[0.18, 1], [0.3, 0.94], [0.84, 0.94], [0.9, 1]], // through the coast the rocket keeps about 95% of its size (it was 76%: at 1440 it was a thin 80 px sliver beside 140 px pills)
        ramp: { k: IS_PHONE ? 1.8 : 1.25, until: 0.3 }, // desktop: 1.25 so the nose keeps clear of the top edge on a tall stage
        smokeK: 1.6,
        coastGlow: IS_PHONE ? undefined : { k: 1, color: '#ff9e88' }, // desktop: a soft halo and a short comet tail so the coasting rocket reads at its small size in the wide framing
        follow: true, // a ballistic arc: the spent stage keeps its nose on the path through the coast and the fall (no tumble hanging off the path end)
        burn: 0.2, // a short powered phase, then a long coast to the apogee
        // no dropped stage: the reports speak of upper stages, but the count is not claimed, and the spent grey stub drifted unlabeled to the frame edge
      },
      apexT: 0.47,
      rulerFadeIn: [0.17, 0.25],
      rulerFrom: 10000, // the altitude ruler starts at its first tick, so no faint line runs through the Earth
      staticAt: [0.6, 0.09],
      marks: [
        {
          alt: 10000,
          label: '10,000 km · China’s stated figure',
          short: '10,000 km (China)',
          phoneFrom: 0.3,
          from: 0.2, // the tick (and its pill) wait until the view has finished pulling back from the pad (between 0.14 and 0.17 no slot is free for the pill, so a bare diamond floated over the ocean)
          opt: true,
          color: '#ffd9a0',
          dx: -20,
          dy: -40,
          staticAt: [0.5, 0.75],
          staticAtPrint: [0.474, 0.79], // print layout: the pill is x3.95 wide and may not sit on the globe, so a short label goes under the globe
          shortPrint: true,
          staticPin: 'hard',
        },
        {
          alt: 30000,
          label: 'Apogee ≥30,000 km (SWF-cited)',
          short: '≥30,000 km (SWF)',
          opt: true,
          color: '#ff9c9c',
          apex: true,
          dx: 0,
          dy: -68,
          staticAt: [0.85, 0.8],
          staticPin: 'hard',
        },
        {
          alt: GEO_ALT,
          label: 'GEO ring · 35,786 km',
          short: 'GEO',
          from: 0.2,
          labelHide: [0.44, 0.8], // while the 10,000 km and apogee pills are up the GEO pill is left out (its tick and the ring stay; the status line names GEO)
          opt: true,
          color: C.geo,
          dx: 0,
          dy: 46,
          staticAt: [0.88, 0.58],
          staticPin: 'hard',
        },
      ],
    },
    // a short re-entry flash where the path ends, so the rocket does not just vanish (illustrative: the reports give only "over the Indian Ocean")
    { type: 'flash', at: [-20.0, 78.0, 0], t0: 0.87, color: '#ffe2b0', ringColor: '#ffb27a', size: 0.17, span: 0.09, strong: true },
    {
      type: 'ring',
      alt: GEO_ALT,
      inc: 0,
      raan: 0,
      color: C.geo,
      thick: 0.006,
      opacity: 0.9,
      fadeCams: [0], fadeInT: [0.19, 0.31], // the ring is edge-on at the opening (flat yellow strands across the frame, and a hairline over the globe): hidden until the view has pulled back, then it fades in
      fadeDisc: 0.1, // the ring passes in front of the globe's face only as a faint line (it read as a cut across the disc at the start)
    },
  ],
  nightK: 1.8, // a lifted night ambient: the dark side of the globe keeps its land and ocean readable and stops reading as a dark glass ball against the sky
  still: 0.62,
  stillOff: { 'DN-2 path': [-106, -50] }, // the still: the path label sits above the globe, not on it
  camDist: 7.5,
  narrowK: 1.1, // phone: the tracking view backs out a little (the rocket and the ring stay whole)
  stillCam: { at: [22, 8, 7.9], look: [0, 90, 0.7] },
  status: [
    [0, 'The DN-2 rocket climbs from Xichang toward GEO'],
    [0.4, 'Analysis cited by SWF: apogee ≥30,000 km, toward GEO (35,786 km)', 'SWF-cited analysis: apogee ≥30,000 km'],
    [0.8, 'Re-entry “over the Indian Ocean”, say US officials', 'US officials: re-entry “over the Indian Ocean”'],
  ],
  // live desktop, default camera (px from their referents): 10,000 km sits above its own marker and Apogee just below it, left of the head's glow,
  // each with a short
  // leader that crosses nothing; GEO (short text) hangs under its marker; the path label sits just above its arc
  liveShort: ['GEO'],
  liveText: { '10,000': '10,000 km (China)', Apogee: '≥30,000 km (SWF)' }, // short enough to sit above its marker, clear of the Earth and of the rocket's glow
  liveOff: {
    'DN-2 path': [-30, -34],
    Xichang: [-62, -54],
    '10,000': [-76, 42],
    '≥30,000': [-76, -74],
    GEO: [28, 40],
  }, // each pill keeps one slot for its whole life (no swapping): 10,000 km below-left of its tick (clear of the disc at every time), the apogee pill up and left of the apogee marker, straight above its leader's end so the leader runs down onto the marker and never over the ruler (a pill below the apogee sat in the rocket's way on the fall, a pill above the 10,000 tick was relocated off the limb early: a hop), GEO just below-right of its tick (clear of the rocket's hull at the apogee)
  offSteps: {
    'DN-2 path': [
      [0, -30, -34],
      [0.8, 0, -62],
    ],
    '10,000': [
      [0, -76, 42],
      [0.76, -24, -22],
    ],
    '≥30,000': [
      [0, -76, -74],
      [0.76, -60, -100],
    ],
  }, // once the rocket is back down the path pill goes straight up so its leader clears the apogee pill
  offPending: true, // the 10,000 km and apogee pills each keep their own fixed slot (one above, one below the ruler), with no swap while the rocket passes
  camOff: { 1: { 'DN-2 path': [-175, -66] } },
  // phone: the path and GEO labels are dropped (the status line and the ring itself carry them); 10,000 km sits below-left of its marker and the
  // apogee label drops straight below its own marker, so the labels no longer converge right of the Earth (default camera, raw px)
  phoneHide: ['DN-2 path', 'GEO'],
  phoneOff: { Xichang: [10, -94] }, // the pill sits beside its site on the disc, no leader across it
  shellLabels: { MEO: null, GEO: null },
  noRing: ['GEO'],
  staticFitRing: true, // static: the whole GEO ring fits inside the panel at every width (no clipping at the edges)
  staticOnDiscPhone: ['Xichang'], // static, 375: Xichang's short label sits beside its site on the disc (off the disc it needed a long leader across the Earth)
  cameras: [
    {
      name: 'Follow the rocket',
      short: 'Follow',
      trackPath: {
        tilt: 45,
        lift: 0.55,
        ring: true,
        geoT: -0.1,
        ahead: 0.07,
        fill: IS_PHONE ? 0.86 : 0.76,
        zoom: IS_PHONE ? 1.3 : 1.42,
        lookK: 0.4,
        launch: { until: 0.3, hold: 0.1, k: IS_PHONE ? 0.95 : 0.88, down: IS_PHONE ? 0 : 0.32, dMin: IS_PHONE ? 0.7 : 0.55, south: 40 }, // opens tight on Xichang and the climbing rocket, then eases out to the whole path
      },
    },
    // Side view: in close (Earth ~40% of the frame width); the far side of the GEO ring is cropped on purpose, the arc and its markers stay in frame
    {
      name: 'Side view',
      at: [22, 8, 5.4],
      look: [0, 90, 0.7],
      phone: { at: [24, 24, 6.6], look: [0, 96, 0.7] },
    },
    {
      name: 'From the pole',
      at: [78, 80, 8.4],
      phone: { at: [78, 80, 7.2] },
      hide: ['DN-2 path', '10,000'],
    },
    // Whole scene: far enough back that no ring edge is cropped; 375: the path label would sit on the disc, crowding Xichang and 10,000 km
    {
      name: 'Whole scene',
      at: [20, 45, 6.8],
      phone: { at: [20, 45, 8], hide: ['DN-2 path'] },
    },
  ],
};
