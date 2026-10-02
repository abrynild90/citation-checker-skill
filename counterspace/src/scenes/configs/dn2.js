// scenes/configs/dn2.js: scene `dn2` (see ../config.js for the list order)
import { GEO_ALT } from '../core.js';
import { C } from './shared.js';

export const DN2 = {
  id: 'dn2',
  date: '2013-05-13',
  title: 'DN-2 “high-altitude science” launch (2013)',
  shells: ['LEO', 'MEO', 'GEO'],
  duration: 14,
  caption:
    'A rocket from Xichang climbs on a suborbital path toward the geostationary belt and falls back to Earth. China said it reached 10,000 km. ' +
    'The US military said it went “nearly to GEO”, and US officials said the upper stages re-entered “over the Indian Ocean”. ' +
    'SWF cites an analysis putting the apogee at 30,000 km or more. There was no target. The launch showed reach, not an intercept.',
  cite: 'SWF 2026, pp. 03-20, 03-22.',
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
      label: 'DN-2 path (no target: not an intercept)',
      short: 'DN-2 path · no target',
      labelIdx: 0.17,
      dx: -40,
      dy: -50,
      head: true,
      apexT: 0.47,
      staticAt: [0.6, 0.09],
      marks: [
        {
          alt: 10000,
          label: '10,000 km · China’s stated figure',
          short: '10,000 km',
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
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, thick: 0.006, opacity: 0.9, sats: 10 },
  ],
  still: 0.62,
  camDist: 7.5,
  stillCam: { at: [22, 8, 7.9], look: [0, 90, 0.7] },
  status: [
    [0, 'Rocket climbs from Xichang on a suborbital path'],
    [0.4, 'Analysis cited by SWF: apogee ≥30,000 km, toward GEO (35,786 km)', 'SWF-cited analysis: apogee ≥30,000 km'],
    [0.8, 'US officials: upper stages re-entered “over the Indian Ocean” · no target, not an intercept', 'Re-entry over Indian Ocean (US officials)'],
  ],
  // live desktop, default camera (px from their referents): 10,000 km sits under its own marker and Apogee just below that row, each with a short
  // leader that crosses nothing; GEO (short text) hangs under its marker; the path label sits just above its arc
  liveShort: ['GEO'],
  liveOff: { 'DN-2 path': [8, -72], '10,000': [-22, 34], Apogee: [-110, 14], GEO: [10, 34] },
  shellLabels: { MEO: null, GEO: null },
  noRing: ['GEO'],
  staticFitRing: true, // static: the whole GEO ring fits inside the panel at every width (no clipping at the edges)
  cameras: [
    { name: 'Follow the rocket', short: 'Follow', trackPath: { tilt: 45, lift: 0.55, ring: true, geoT: 0.1, fill: 0.97, zoom: 1.3 } },
    // Profile: in close (Earth ~40% of the frame width); the far side of the GEO ring is cropped on purpose, the arc and its markers stay in frame
    { name: 'Profile', at: [22, 8, 5.4], look: [0, 90, 0.7], phone: { at: [24, 24, 6.6], look: [0, 96, 0.7] } },
    { name: 'Polar', at: [78, 80, 8.4], phone: { at: [78, 80, 7.2] }, hide: ['DN-2 path', '10,000'] },
    // Zoom: far enough back that no ring edge is cropped; 375: the path label would sit on the disc, crowding Xichang and 10,000 km
    { name: 'Zoom', at: [20, 45, 6.8], phone: { at: [20, 45, 8], hide: ['DN-2 path'] } },
  ],
};
