// scenes/configs/burnt-frost.js: scene `burnt-frost` (see ../config.js for the list order)
import { C } from './shared.js';

export const BURNT_FROST = {
  id: 'burnt-frost',
  date: '2008-02-20',
  title: 'Burnt Frost: SM-3 vs. USA-193 (2008)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'A US Navy cruiser fires a modified SM-3 at the failing USA-193 satellite at about 220 km (SWF’s text says 240 km; its Table 5-1 says 220 km). ' +
    'At that altitude the 175 trackable pieces took about 20 months to de-orbit; the animation compresses that time. ' +
    'The event shows the overlap between missile defense and anti-satellite capability.',
  cite: 'SWF 2026, Table 5-1, p. 05-01 (175 cataloged; 0 in orbit); decay time and 240 km in text, p. 01-24.',
  related: null,
  event: 'us-2008-burnt-frost',
  phoneK: 1.15,
  launchAt: [3.3, 0.95, 0.8],
  earlyKey: true,
  hit: { lat: 29.0, lon: -173.0, alt: 220, inc: 58.5, t: 0.42, wa: 0.15, wf: 0.5 },
  actors: [
    { type: 'ship', at: [22.0, -163.0], label: 'USS Lake Erie', dx: 0, dy: 70 },
    {
      type: 'target',
      label: 'USA-193',
      color: C.tgt,
      big: 1.7,
      minPx: 46,
      maxPx: 86,
      bright: true,
      fall: [
        { k: 1.5, di: 0.2, dr: 0.01, dw: 0.9 },
        { k: 1.25, di: -0.3, dr: -0.012, dw: 1.05 },
        { k: 1.05, di: 0.4, dr: 0.02, dw: 1.15 },
      ],
    },
    { type: 'intercept', from: [22.0, -163.0], t0: 0.2, color: C.int, label: 'SM-3', flash: 0.42, strong: true, hold: 0.07 },
    { type: 'debris', count: 175, spreadAlt: 90, spreadInc: 2.6, spreadRaan: 1.6, dv: 0.6, decay: 2.2, color: '#ffd2a6', size: 0.046, lateGlow: true },
  ],
  still: 0.47,
  status: [
    [0, 'Interceptor rises toward the satellite'],
    [0.44, 'Collision at ~220 km; low-altitude fragments decay quickly', 'Collision at ~220 km'],
    [0.6, 'Time compressed: SWF reports ~20 months to de-orbit entirely', 'SWF: ~20 months to de-orbit'],
  ],
};
