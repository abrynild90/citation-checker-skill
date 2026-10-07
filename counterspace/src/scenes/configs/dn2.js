// scenes/configs/dn2.js: scene `dn2` (see ../config.js for the list order)
import { GEO_ALT, IS_PHONE } from '../core.js';
import { C } from './shared.js';

export const DN2 = {
  id: 'dn2',
  date: '2013-05-13',
  title: 'DN-2: China’s “high-altitude science” rocket launch (2013)',
  shells: ['LEO', 'MEO', 'GEO'],
  duration: 14,
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
    { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground, offGlobe: true, staticAt: [0.78, 0.47], staticPin: 'hard' },
    {
      type: 'suborbital',
      from: [28.2, 102.0],
      to: [-20.0, 78.0],
      apex: 30000,
      t0: 0.05,
      t1: 0.9,
      color: '#ff7a7a',
      thick: 0.011,
      label: 'DN-2 path: no intercept',
      short: 'DN-2 path · no target',
      labelIdx: 0.17,
      labelStart: 0.22, // the pill waits until the rocket has left it behind (it sat on the rocket, its leader hanging off the frame, at the start)
      dx: -40,
      dy: -50,
      head: true,
      ghostOpacity: 0.5, // the whole planned path stays readable before the rocket flies it
      rocket: { style: 'slim', minPx: IS_PHONE ? 56 : 66, maxPx: IS_PHONE ? 78 : 92, glowMin: IS_PHONE ? 32 : 38, glowMax: IS_PHONE ? 52 : 58 },
      apexT: 0.47,
      rulerFrom: 10000, // the altitude ruler starts at its first tick, so no faint line runs through the Earth
      staticAt: [0.6, 0.09],
      marks: [
        {
          alt: 10000,
          label: '10,000 km · China’s stated figure',
          short: '10,000 km',
          phoneFrom: 0.3,
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
        { alt: GEO_ALT, label: 'GEO ring · 35,786 km', short: 'GEO', opt: true, color: C.geo, dx: 0, dy: 46, staticAt: [0.88, 0.58], staticPin: 'hard' },
      ],
    },
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, thick: 0.006, opacity: 0.9, sats: 6 },
  ],
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
  liveText: { '10,000': '10,000 km', Apogee: '≥30,000 km (SWF)' }, // short enough to sit above its marker, clear of the Earth and of the rocket's glow
  liveOff: { 'DN-2 path': [-30, -34], Xichang: [-60, -40], '10,000': [-13, -42], '≥30,000': [76, -44], GEO: [78, 62] }, // the two pills at the apogee fan out up-right and down-right: their leaders no longer cross
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
    { name: 'Follow the rocket', short: 'Follow', trackPath: { tilt: 45, lift: 0.55, ring: true, geoT: 0.34, ahead: 0.07, fill: 0.86, zoom: 1.3, lookK: 0.4 } },
    // Side view: in close (Earth ~40% of the frame width); the far side of the GEO ring is cropped on purpose, the arc and its markers stay in frame
    { name: 'Side view', at: [22, 8, 5.4], look: [0, 90, 0.7], phone: { at: [24, 24, 6.6], look: [0, 96, 0.7] } },
    { name: 'From the pole', at: [78, 80, 8.4], phone: { at: [78, 80, 7.2] }, hide: ['DN-2 path', '10,000'] },
    // Whole scene: far enough back that no ring edge is cropped; 375: the path label would sit on the disc, crowding Xichang and 10,000 km
    { name: 'Whole scene', at: [20, 45, 6.8], phone: { at: [20, 45, 8], hide: ['DN-2 path'] } },
  ],
};
