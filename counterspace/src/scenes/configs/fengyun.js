// scenes/configs/fengyun.js: scene `fengyun` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const FENGYUN = {
  id: 'fengyun',
  fitPct: 0.94,
  date: '2007-01-11',
  title: 'Fengyun-1C: China destroys a weather satellite (2007)',
  shells: ['LEO'],
  duration: 16,
  caption:
    'On 11 January 2007 China fired an SC-19 (a ground-launched anti-satellite missile) from Xichang and ' +
    'destroyed Fengyun-1C, a Chinese weather satellite, about 880 km above the Earth. ' +
    'At that height, fragments stay in orbit for decades. ' +
    'They spread along the old orbit into a ring around the planet. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, lists no ' +
    'other test in its Table 5-1 that produced as many tracked fragments. ' +
    'In 2022 the UN General Assembly called on states not to conduct destructive “direct-ascent” ' +
    'anti-satellite missile tests, meaning tests launched from Earth (resolution 77/41). ' +
    'The call is not binding.',
  cite: 'Secure World Foundation, 2026, Table 5-1, p. 05-01 (3,532 cataloged; 2,351 in orbit as of Feb. 2026).',
  related: 'unga-77-41',
  event: 'cn-2007-fy1c',
  hit: { lat: 35.5, lon: 106.5, alt: 880, inc: 98.6, t: 0.3, wa: 0.4 },
  launchCam: 'second',
  orbitAt: [26, 74, 4.6],
  phoneK: 1.14,
  fitFill: IS_PHONE ? 0.8 : undefined, // 375: the follow camera frames the launch with more sky around it, so the globe is not cropped at the corner
  phoneOff: { Xichang: [-50, 36] }, // 375: Xichang sits at the glow of the launch; its chip hangs below-left on a visible leader
  noSimCount: true,
  stillImpact: true, // the print also labels the impact point
  actors: [
    { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
    { type: 'target', label: 'Fengyun-1C', color: C.tgt, big: true, minPx: IS_PHONE ? 22 : undefined, impactDx: 100, impactDy: -100, impactUntil: 0.6 },
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
      labelEdge: true, // live: the label points at a fragment on the ring's outer edge, so the leader stays short
      dx: 70,
      dy: 24,
      late: { t0: 0.6, k: 1.4, kr: 6 },
    },
  ],
  still: 0.85,
  status: [
    [0, 'SC-19 rises toward Fengyun-1C'],
    [0.32, 'Collision at ~880 km: debris spreads along the old orbit', 'Collision at ~880 km'],
    [0.6, 'A ring forms around the planet', 'A ring forms around Earth'],
    [0.76, 'Fast-forward: the ring spreads wider and thinner. SWF: 2,351 of 3,532 still in orbit (Feb. 2026)', 'SWF: 2,351 of 3,532 still in orbit'],
  ],
};
