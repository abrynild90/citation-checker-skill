// scenes/configs/burnt-frost.js: scene `burnt-frost` (see ../config.js for the list order)
import { C } from './shared.js';

export const BURNT_FROST = {
  id: 'burnt-frost',
  date: '2008-02-20',
  title: 'Burnt Frost: the US destroys a failing satellite (2008)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'On 20 February 2008 the US Navy cruiser USS Lake Erie fired a modified SM-3 missile ' +
    'at USA-193, a failing US satellite, and destroyed it about 220 km above the Earth. ' +
    'The SM-3 is a missile-defense interceptor, a missile built to shoot down other missiles. ' +
    'Its use against a satellite shows the overlap between missile defense and anti-satellite capability. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, gives the height as 220 km in its Table 5-1 and 240 km in its text. ' +
    'At that height the 175 trackable pieces took about 20 months to fall out of orbit. The animation speeds that up. ' +
    'The Outer Space Treaty of 1967 bars nuclear weapons in orbit but is silent on conventional anti-satellite weapons.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01 (175 cataloged; 0 in orbit); time to re-enter and the 240 km figure in the text, p. 01-24.',
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
    [0.44, 'Collision at about 220 km; fragments fall back quickly', 'Collision at about 220 km'],
    [0.6, 'Fast-forward: all out of orbit after about 20 months (SWF)', 'SWF: about 20 months to come down'],
  ],
};
