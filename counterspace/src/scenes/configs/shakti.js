// scenes/configs/shakti.js: scene `shakti` (see ../config.js for the list order)
import { C } from './shared.js';

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
  fitFill: 1.1, // the follow camera frames the launch and the target a little tighter, so the interceptor reads as a rocket
  camHide: { 3: ['Abdul Kalam', 'PDV', 'LEO'] }, // Polar: the strike is a few px wide there, so its neighbours' labels are dropped
  liveOff: { 'PDV': [-86, -46], 'Microsat-R': [70, 44] }, // the two pills sit on opposite sides of the strike, one above and one below
  phoneOff: { 'Abdul Kalam': [-56, 30] }, // 375: the island label hangs clear of the trail head
  hit: { lat: 26.0, lon: 95.0, alt: 300, inc: 96.6, t: 0.38, wa: 0.15, wf: 0.5 },
  actors: [
    { type: 'site', at: [20.75, 87.08], label: 'Abdul Kalam Island', color: C.ground },
    {
      type: 'target',
      label: 'Microsat-R',
      color: C.tgt,
      big: 1.7,
      minPx: 46,
      maxPx: 86,
      bright: true,
      wreck: true,
      impactDx: -80,
      impactDy: -30,
      impactLabel: 'Impact: Microsat-R (wreck)',
      impactShort: 'Impact',
    },
    { type: 'intercept', from: [20.75, 87.08], t0: 0.16, color: C.int, label: 'PDV Mk-II', flash: 0.32, rocket: { minPx: 30, maxPx: 54 } },
    {
      type: 'debris',
      count: 130,
      spreadAlt: 170,
      spreadInc: 3.6,
      spreadRaan: 2.6,
      dv: 1.2,
      drift: 0.15,
      decay: 1.5,
      color: '#ffd2a6',
      size: 0.075,
      lateGlow: true,
    },
  ],
  still: 0.43,
  status: [
    [0, 'PDV Mk-II rises from Abdul Kalam Island'],
    [0.4, 'Collision at about 300 km; fragments spread and fall back quickly', 'Collision at about 300 km'],
    [0.65, 'Fast-forward: all 130 tracked pieces have left orbit (SWF)', 'SWF: 130 pieces, none in orbit'],
  ],
};
