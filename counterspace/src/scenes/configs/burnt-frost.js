// scenes/configs/burnt-frost.js: scene `burnt-frost` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const BURNT_FROST = {
  id: 'burnt-frost',
  date: '2008-02-20',
  title: 'Burnt Frost: the US destroys a failing satellite (2008)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'On 20 February 2008 the US Navy cruiser USS Lake Erie fired a modified SM-3 missile at USA-193, a failing US satellite, and destroyed it about 220 km above the Earth. ' +
    'The SM-3 is a missile-defense interceptor, built to shoot down other missiles, so its use against a satellite shows the overlap between missile defense and anti-satellite capability. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, gives the height as 220 km in its Table 5-1 and 240 km in its text. At that height the 175 trackable pieces took about 20 months to fall out of orbit. The animation speeds that up. ' +
    'The Outer Space Treaty of 1967 bars nuclear weapons in orbit but is silent on conventional anti-satellite weapons.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01 (175 cataloged; 0 in orbit); time to re-enter and the 240 km figure in the text, p. 01-24.',
  related: null,
  event: 'us-2008-burnt-frost',
  phoneK: 1.15,
  phoneOff: { 'USS Lake Erie': [46, 34] }, // 375: the ship pill clears the caption pill below it
  sunView: IS_PHONE ? { az: -14, el: 4 } : { az: -32, el: 24 }, // the Pacific sits in daylight with the terminator in view: the ship, missile and satellite get a key light
  nightK: 1.2,
  dayK: IS_PHONE ? 1.6 : 1.15,
  seaK: IS_PHONE ? 2.2 : 0.8, // the Pacific is dark even in daylight: lifted so the ship and satellite separate from it
  phoneHide: ['Larger pieces', 'Pieces falling'], // 375: Impact, the illustration pill and the ship label are enough at the top of the frame
  launchAt: [3.3, 0.95, 0.8],
  camHide: { 3: ['Impact'] }, // Polar: the debris cloud is small there and the pill would sit on the disc
  liveOff: { Impact: [-150, -26], 'Larger pieces': [168, -62] }, // the collision frame: Impact to the left, the falling pieces to the right
  camOff: { 2: { 'USA-193': [160, -58] } }, // From orbit: the satellite pill sits off the disc, right of the limb
  offFrom: { 'USA-193': 0.3 }, // the fixed From orbit offset applies once the interceptor is near the satellite
  earlyKey: true,
  fitFillKeys: IS_PHONE ? [0.82, 0.9] : [0.9, 1.1], // desktop: the first two key frames sit tight on the ship and the satellite, the second tighter, so the camera is already pushing in from the first second
  burstPadFrom: IS_PHONE ? undefined : 0.3, // desktop: the early keys are fitted to the craft alone (the burst ring is not in frame yet)
  fitTilt: IS_PHONE ? undefined : 38, // desktop: the view is turned about 15 degrees from the default
  hit: { lat: 29.0, lon: -173.0, alt: 220, inc: 58.5, t: 0.42, wa: 0.15, wf: 0.5 },
  actors: [
    { type: 'ship', at: [22.0, -163.0], label: 'USS Lake Erie', shade: true, labelUntil: 0.8, dx: 0, dy: 44, minPx: 72, maxPx: 135 },
    {
      type: 'target',
      label: 'USA-193',
      color: C.tgt,
      big: 1.7,
      minPx: 60,
      maxPx: 100,
      impactUntil: 0.9, // the Impact pill stays on the contact point (where the interceptor met the satellite), not on the drifting debris; a tick keeps marking the point
      impactDx: -150,
      impactDy: -30,
      tickUntil: 0.95,
      bright: true,
      fall: [
        { k: 1.5, di: 0.2, dr: 0.01, dw: 0.9 },
        { k: 1.25, di: -0.3, dr: -0.012, dw: 1.05 },
        { k: 1.05, di: 0.4, dr: 0.02, dw: 1.15 },
      ],
    },
    { type: 'intercept', from: [22.0, -163.0], t0: 0.2, color: '#ff8a4a', taper: 0.3, thick: 0.0055, label: 'SM-3 interceptor', short: 'SM-3', rocket: { style: 'slim', minPx: 46, maxPx: 72, glowMin: 24, glowMax: 40 }, flash: 0.4, flashCap: 1.2, coreK: 0.8, strong: true, hold: -0.14, flashSpan: 0.16, linger: 0.2, lingerK: 0.5, lingerEnd: 0.6 },
    { type: 'debris', count: 175, spreadAlt: 90, spreadInc: 2.6, spreadRaan: 1.6, dv: 0.6, decay: 2.2, color: '#ffd2a6', palette: { hot: [0.95, 1, 1], mid: [0.6, 0.9, 1], cool: [0.5, 0.78, 1] }, darkHalo: 0.7, size: 0.1, minPx: 6, maxPx: 16, additive: false, trail: { n: 5, dt: 0.012, k: 0.6 }, lateGlow: true },
  ],
  still: 0.47,
  status: [
    [0, 'Interceptor rises toward the satellite'],
    [0.25, 'Interceptor closes on the satellite', 'Interceptor closing in'],
    [0.44, 'Collision at about 220 km; fragments fall back quickly', 'Collision at about 220 km'],
    [0.6, 'Fast-forward: all out of orbit after about 20 months (SWF)', 'SWF: about 20 months to come down'],
  ],
};
