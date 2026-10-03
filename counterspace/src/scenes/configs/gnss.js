// scenes/configs/gnss.js: scene `gnss` (see ../config.js for the list order)
import { C } from './shared.js';

export const GNSS = {
  id: 'gnss',
  date: '2023-12-01',
  title: 'GNSS jamming over the Baltic',
  shells: ['LEO', 'MEO'],
  shellLabels: { MEO: null },
  staticCenter: [70, 30], // static: centred north of the Baltic so neither airliner sits on the Earth's centre
  staticCraftCap: 0.03, // static (screen and print): every icon is at most 3% of the Earth disc area
  staticCraftMax: 52, // static: airliner icons small enough to leave the Baltic readable
  staticShellLabels: { MEO: 'GPS orbit · MEO' },
  staticDropPhone: ['LEO ≤2,000 km'], // 375 static: the LEO shell label would crowd the aircraft and jammer labels
  staticTextPhone: [[' · GNSS ', ' · ']], // 375 static: "Airliner A · lost"
  duration: 16,
  caption:
    'GPS satellites orbit in medium Earth orbit (MEO), far above the aircraft. ' +
    'A jammer on the ground swamps their weak signals only inside its local effect zone. ' +
    'Aircraft crossing the zone lose their position fix, while aircraft outside it and the satellites themselves are unaffected. ' +
    'This is interference with receivers, not an attack on a satellite.',
  cite: 'SWF 2026, pp. 02-29 to 02-30; p. 12-05 (downlink jamming has no effect on the satellites).',
  related: 'icao-2025',
  event: 'ru-2023-baltic',
  actors: [
    {
      type: 'constellation',
      alt: 20200,
      inc: 55,
      planes: 6,
      per: 3,
      color: C.gps,
      speed: 0.25,
      inset: true,
      label: 'GPS satellites · MEO',
      opt: true,
      dx: -50,
      dy: 40,
    },
    {
      type: 'zone',
      at: [57.5, 21.0],
      radius: 6.2,
      color: C.jam,
      label: 'Jammer effect zone',
      dx: 40,
      dy: -34,
      jammer: { at: [56.5, 21.0], label: 'Ground jammer (illustrative)', short: 'Jammer', dx: -70, dy: 30 },
    },
    {
      type: 'aircraft',
      path: [
        [53.0, 8.0],
        [61.0, 32.0],
      ],
      alt: 11,
      t0: 0,
      t1: 1,
      label: 'Airliner A',
      gnss: true,
      dx: -96,
      dy: -14,
    },
    {
      type: 'aircraft',
      path: [
        [44.2, 8.0],
        [45.2, 30.0],
      ],
      alt: 11,
      t0: 0,
      t1: 1,
      label: 'Airliner B',
      beamLabel: 'GPS signal (from a MEO satellite, off view)',
      beamShort: 'GPS signal',
      beamFrac: 0.22, // the label sits on the beam's midpoint (the visible part), not beside the aircraft
      beamDx: 0,
      beamDy: 0,
      gnss: true,
      labelDy: 34,
      dx: 92,
    },
  ],
  still: 0.45,
  camDist: 3.5,
  phoneK: 0.82,
  stillCam: { at: [49, 14, 1.85], look: [51.5, 16, 0.98], hideShell: true },
  focus: [55, 18],
  inset: 'GPS orbits (top view)',
  insetCorner: 'bl',
  insetSize: [150, 116],
  insetNoPhone: true, // the phone stage is too small for an inset that would sit on the jammer zone
  cameras: [
    {
      name: 'Baltic: airliners and jammer zone',
      short: 'Baltic zone',
      at: [41, 13, 1.46],
      look: [52.2, 22.2, 0.98],
      phone: { at: [38, 12, 1.48] },
    },
    {
      name: 'Close-up: jammer zone and Airliner A',
      short: 'Close-up',
      at: [51, 18.5, 1.3],
      look: [56.2, 21, 0.98],
      phone: { at: [51, 18.5, 1.55] },
      ref: false, // a close-up of the dome: Airliner B is outside this frame by design
    },
    { name: 'Europe + GPS orbits', short: 'Europe + GPS', at: [42, -8, 5.0], look: [40, 10, 0.5], ref: false, hide: ['Ground jammer', 'Jammer effect'] },
  ],
  status: [
    [0, 'Both airliners have GNSS (green) ·' + ' jammer zone in red · satellites unaffected', 'Airliners have GNSS (green) · zone in red'],
    [0.3, 'Inside the zone GNSS is lost (red); outside it' + ' stays OK (green). Satellites unaffected', 'Inside the zone GNSS is lost (red)'],
  ],
};
