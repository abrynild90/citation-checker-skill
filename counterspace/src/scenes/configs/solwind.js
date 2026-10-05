// scenes/configs/solwind.js: scene `solwind` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const SOLWIND = {
  id: 'solwind',
  fitPct: 0.99,
  date: '1985-09-13',
  title: 'Solwind: a US missile destroys a satellite (1985)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'On 13 September 1985 a US F-15 fighter fired an ASM-135 anti-satellite missile that destroyed the Solwind P78-1 satellite, about 530 km above the Earth. ' +
    'The F-15 climbed steeply at supersonic speed (a “zoom climb”) before it released the missile. The missile’s miniature homing vehicle, which steers itself, then rose and destroyed the satellite by collision. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, gives the height as 530 km in its Table 5-1 and 555 km in its text, and counts 285 tracked fragments; all have since fallen out of orbit. ' +
    'The Outer Space Treaty of 1967 bars nuclear weapons in orbit but is silent on conventional anti-satellite weapons. ' +
    'The positions and the debris spread are drawn to show the idea. They are not calculated.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01 (285 tracked, 0 still in orbit); Table 1-4, p. 01-24; ASM-135 and the zoom climb, Figure 1-8 text.',
  related: null,
  event: 'us-1985-solwind',
  launchPhoneK: 1.2,
  launchAt: [3.3, 0.95, 0.8],
  staticCenter: [-14, -122],
  staticGlobeY1: 0.8, // static: close-up toward the impact, the globe's lower part runs off the frame
  staticCraftCap: 0.03, // static (screen and print): every icon is at most 3% of the Earth disc area
  staticMarkerCap: { 'Solwind P78-1': 64 }, // the satellite is the subject: clearly visible (declared in tools/scene_check/rules.mjs MARKER_OVR)
  staticCraftMax: 54, // static: icons stay small (they must not cover the Earth's centre)
  staticK: 1.45, // static: Solwind drawn out in space, clear of the aircraft and the Earth's centre
  cloudK: 0.07, // a thinner cloud deck: the white bank beside the subject read as a blob
  hit: { lat: 37.5, lon: -135.0, alt: 530, inc: 97.6, t: 0.5, wa: 0.15, wf: 0.5 },
  liveOff: { 'ASM-135': [-80, -62], 'F-15': [64, -56] }, // the missile's pill sits above the F-15 with a leader down to the arc
  phoneOff: { 'ASM-135': [-16, -58], 'F-15': [96, -16] },
  actors: [
    {
      type: 'aircraft',
      path: [
        [32.5, -114.0],
        [35.0, -124.0],
      ],
      alt: 12,
      t0: 0.0,
      t1: 0.24,
      scale: 3,
      minPx: IS_PHONE ? 44 : 62,
      maxPx: IS_PHONE ? 62 : 104,
      label: 'F-15 zoom climb',
      dx: -64,
      dy: 24,
    },
    {
      type: 'target',
      label: 'Solwind P78-1',
      color: C.tgt,
      big: 5,
      minPx: IS_PHONE ? 40 : 56,
      maxPx: IS_PHONE ? 60 : 96, // the satellite reads at t=0.2, before the intercept
      bright: true,
      impactLabel: 'Impact: Solwind P78-1',
      impactShort: 'Impact: Solwind P78-1',
      impactUntil: 0.75, // the pill retires with its step (step 3); a quiet tick keeps the point marked
    },
    { type: 'intercept', from: 'aircraft', t0: 0.24, color: C.int, label: 'ASM-135', flash: 0.42 },
    { type: 'debris', count: 285, spreadAlt: 150, spreadInc: 2.6, spreadRaan: 1.8, dv: 0.6, decay: 0.9, color: '#ffd2a6' },
  ],
  still: 0.45,
  status: [
    [0, 'F-15 in a steep, supersonic climb'],
    [0.24, 'Missile released; homing vehicle rises to the satellite', 'Missile released; vehicle rises to satellite'],
    [0.52, 'Collision at about 530 km; fragments spread, then fall out of orbit', 'Collision at about 530 km'],
    [0.75, 'Fast-forward: all 285 tracked fragments are now out of orbit (SWF)', 'SWF: 285 fragments, none in orbit'],
  ],
};
