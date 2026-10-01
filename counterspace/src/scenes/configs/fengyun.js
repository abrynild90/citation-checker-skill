// scenes/configs/fengyun.js: scene `fengyun` (see ../config.js for the list order)
import { C } from './shared.js';

export const FENGYUN = {
  id: 'fengyun',
  fitPct: 0.94,
  date: '2007-01-11',
  title: 'Fengyun-1C (2007)',
  shells: ['LEO'],
  duration: 16,
  caption:
    'China’s SC-19 interceptor strikes the Fengyun-1C weather satellite at about 880 km (SWF Table 5-1). ' +
    'At that altitude, fragments stay up for decades. They spread along the old orbit into a ring around the planet. ' +
    'It produced the most cataloged fragments of any test in SWF’s Table 5-1.',
  cite: 'SWF 2026, Table 5-1, p. 05-01 (3,532 cataloged; 2,351 in orbit as of Feb. 2026).',
  related: 'unga-77-41',
  event: 'cn-2007-fy1c',
  hit: { lat: 35.5, lon: 106.5, alt: 880, inc: 98.6, t: 0.3, wa: 0.4 },
  launchCam: 'second',
  orbitAt: [26, 74, 4.6],
  phoneK: 1.14,
  noSimCount: true,
  stillImpact: true, // the print also labels the impact point
  actors: [
    { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
    { type: 'target', label: 'Fengyun-1C', color: C.tgt, big: true, impactDx: 100, impactDy: -100 },
    { type: 'intercept', from: [28.2, 102.0], t0: 0.14, color: C.int, label: 'SC-19' },
    {
      type: 'debris',
      count: 3532,
      spreadAlt: 260,
      spreadInc: 1.6,
      dv: 0.9,
      decay: 0,
      color: C.debris,
      label: 'Debris ring',
      dx: 70,
      dy: -50,
      late: { t0: 0.6, k: 1.4, kr: 6 },
    },
  ],
  still: 0.85,
  status: [
    [0, 'SC-19 rises toward Fengyun-1C'],
    [0.32, 'Collision at ~880 km: debris spreads along the old orbit', 'Collision at ~880 km'],
    [0.6, 'Ring forms · SWF: 2,351 of 3,532 cataloged pieces still in orbit (Feb. 2026)', 'SWF: 2,351 of 3,532 still in orbit'],
    [0.76, 'Time compressed: the ring spreads into a wider, thinner band · SWF: 2,351 of 3,532 still in orbit', 'Time compressed: band spreads wider'],
  ],
};
