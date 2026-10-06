// scenes/configs/shakti.js: scene `shakti` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const SHAKTI = {
  id: 'shakti',
  date: '2019-03-27',
  title: 'Mission Shakti: India destroys a satellite (2019)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'On 27 March 2019 India fired a PDV Mk-II interceptor, a missile built to hit a target, from ' +
    'Abdul Kalam Island and destroyed the Microsat-R satellite about 300 km above the Earth. ' +
    'Indian officials said the debris would re-enter, meaning fall back into the atmosphere, within 45 days. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, counts 130 tracked fragments, none still in orbit. ' +
    'In 2022 the UN General Assembly called on states not to conduct destructive “direct-ascent” ' +
    'anti-satellite missile tests, meaning tests launched from Earth (resolution 77/41). ' +
    'The call is not binding.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01; p. 04-04.',
  related: 'unga-77-41',
  event: 'in-2019-shakti',
  orbitAt: [23, 84, 2.7], // the whole-scene view: close enough that the launch-to-intercept arc reads on a recognisable South Asia
  launchAt: [2.67, 1.55, 0.5],
  earlyKey: true,
  lookK: 0.86, // the Earth sits nearer the middle of the frame, not against its left edge
  lightsK: 0.55, // softer city lights: the fragments read as debris, not as another town
  phoneHide: ['Abdul Kalam'], // 375: two labels at the burst (the island is in the status line)
  fitFill: IS_PHONE ? 0.62 : 0.6, // the follow camera frames the launch and the target a little tighter, so the interceptor reads as a rocket
  camHide: { 3: ['Abdul Kalam', 'PDV', 'LEO'] }, // Polar: the strike is a few px wide there, so its neighbours' labels are dropped
  liveOff: { 'Abdul Kalam': [-34, 66], 'PDV': [-130, -80], 'Microsat-R': [172, -14] }, // the two pills sit on opposite sides of the strike, one above and one below
  phoneOff: { 'Abdul Kalam': [-40, 46] }, // 375: the island label hangs clear of the trail head
  hit: { lat: 26.0, lon: 95.0, alt: 300, inc: 96.6, t: 0.38, wa: 0.15, wf: 0.5 },
  actors: [
    { type: 'site', at: [20.75, 87.08], label: 'Abdul Kalam Island', color: C.ground },
    {
      type: 'target',
      label: 'Microsat-R',
      color: C.tgt,
      big: 1.7,
      minPx: 64,
      maxPx: 100,
      bright: true,
      wreck: true,
      impactDx: -80,
      impactDy: -30,
      impactLabel: 'Impact: Microsat-R debris',
      impactShort: 'Impact',
    },
    { type: 'intercept', from: [20.75, 87.08], t0: 0.16, color: C.int, label: 'PDV Mk-II', flash: 0.5, flashCap: 1.35, strong: true, coreK: 0.9, flashSpan: 0.12, rocket: { minPx: 44, maxPx: 70 } },
    {
      type: 'debris',
      count: 130,
      spreadAlt: 170,
      spreadInc: 3.6,
      spreadRaan: 2.6,
      dv: 1.2,
      drift: 0.15,
      decay: 1.5,
      color: '#ff7a3a',
      palette: { hot: [1, 0.96, 0.9], mid: [1, 0.42, 0.18], cool: [0.95, 0.28, 0.14] }, // white and orange-red, not the amber of the city lights
      darkHalo: 0.7, // a dark disc behind every fragment
      size: 0.11,
      minPx: 5,
      maxPx: 15,
      additive: true,
      lateGlow: true,
    },
  ],
  still: 0.43,
  status: [
    [0, 'PDV Mk-II rises from Abdul Kalam Island'],
    [0.4, 'Collision at about 300 km; fragments spread and fall back quickly', 'Collision at about 300 km'],
    [0.65, 'Fast-forward: pieces decay; SWF counts all 130 out of orbit', 'Decay: all 130 out (SWF)'],
  ],
};
