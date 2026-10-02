// scenes/configs/solwind.js: scene `solwind` (see ../config.js for the list order)
import { C } from './shared.js';

export const SOLWIND = {
  id: 'solwind',
  fitPct: 0.99,
  date: '1985-09-13',
  title: 'ASM-135 vs. Solwind (1985)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'An F-15 in a supersonic zoom climb releases an ASM-135 missile. ' +
    'The missile’s miniature homing vehicle rises to meet the Solwind P78-1 satellite at about 530 km (SWF Table 5-1; its text says 555 km) and ' +
    'destroys it by collision. SWF counts 285 tracked fragments; all have since decayed. ' +
    'The positions and the debris spread are drawn for legibility, not computed.',
  cite: 'SWF 2026, Table 5-1: 285 tracked, 0 still in orbit (p. 05-01); Table 1-4, p. 01-24; ASM-135 and the zoom climb, Figure 1-8 text.',
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
  hit: { lat: 37.5, lon: -135.0, alt: 530, inc: 97.6, t: 0.5, wa: 0.15, wf: 0.5 },
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
      label: 'F-15 zoom climb',
      dx: -64,
      dy: 24,
    },
    {
      type: 'target',
      label: 'Solwind P78-1',
      color: C.tgt,
      big: 3.4, // the satellite reads at t=0.2, before the intercept
      bright: true,
      impactLabel: 'Impact: Solwind P78-1',
      impactShort: 'Impact: Solwind P78-1',
    },
    { type: 'intercept', from: 'aircraft', t0: 0.24, color: C.int, label: 'ASM-135', flash: 0.42 },
    { type: 'debris', count: 285, spreadAlt: 150, spreadInc: 2.6, spreadRaan: 1.8, dv: 0.6, decay: 0.9, color: '#ffd2a6' },
  ],
  still: 0.45,
  status: [
    [0, 'F-15 in a supersonic zoom climb'],
    [0.24, 'Missile released; homing vehicle rises to the satellite', 'Missile released; vehicle rises to satellite'],
    [0.52, 'Collision at ~530 km; fragments spread and decay', 'Collision at ~530 km'],
    [0.75, 'Time compressed: SWF counts 285 tracked fragments, all since decayed', 'SWF: 285 fragments, all decayed'],
  ],
};
