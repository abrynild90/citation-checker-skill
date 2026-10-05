// scenes/configs/gnss.js: scene `gnss` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const GNSS = {
  id: 'gnss',
  date: '2023-12-01',
  title: 'Jamming satellite navigation (GNSS) over the Baltic',
  shells: ['LEO', 'MEO'],
  shellLabels: { MEO: null },
  staticCenter: [70, 30], // static: centred north of the Baltic so neither airliner sits on the Earth's centre
  staticCraftCap: 0.03, // static (screen and print): every icon is at most 3% of the Earth disc area
  staticCraftMax: 52, // static: airliner icons small enough to leave the Baltic readable
  staticShellLabels: { MEO: 'GPS orbit · MEO' },
  staticDropPhone: ['LEO ≤2,000 km'], // 375 static: the LEO shell label would crowd the aircraft and jammer labels
  staticTextPhone: [[' · GPS signal ', ' · ']], // 375 static: "Airliner 1 · lost"
  duration: 16,
  caption:
    'Since late 2023, ground jamming has repeatedly cut satellite navigation signals (GNSS), such as GPS, for aircraft and ships around the Baltic Sea. ' +
    'Jamming means drowning out a signal with radio noise. In April 2024 Finnair paused its flights to Tartu. ' +
    'GPS satellites orbit in medium Earth orbit (MEO), about 20,000 km up. A jammer swamps their weak signals only inside its local effect zone, so aircraft that cross it lose their position fix. ' +
    'The satellites are unaffected: the jammer interferes with receivers and does not attack any satellite. ' +
    'In October 2025 the International Civil Aviation Organization (ICAO) endorsed a finding that recurring interference with satellite navigation from North Korea and from Russian territory is an “infraction” of the 1944 Chicago Convention. ' +
    'This is a finding by an international body, not a court judgment, and it carries no enforcement. The jammer’s position is drawn for illustration.',
  cite: 'Secure World Foundation, 2026: pp. 02-29 to 02-30; p. 12-05 (jamming of receivers has no effect on the satellites).',
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
      label: 'GPS satellites (MEO)',
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
      dx: 50,
      dy: 18,
      jammer: { at: [56.5, 21.0], label: 'Ground jammer', short: 'Jammer', dx: -70, dy: 30 },
    },
    {
      type: 'aircraft',
      path: [
        [53.0, 8.0],
        [61.0, 32.0],
      ],
      alt: 11,
      lift: IS_PHONE ? 0.022 : 0, // 375: drawn a little higher above the ground so an airliner never touches the jammer marker
      t0: 0,
      t1: 1,
      label: 'Airliner 1',
      gnss: true,
      minPx: IS_PHONE ? 38 : 26,
      maxPx: IS_PHONE ? 70 : 52,
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
      lift: IS_PHONE ? 0.022 : 0, // 375: drawn a little higher above the ground so an airliner never touches the jammer marker
      t0: 0,
      t1: 1,
      label: 'Airliner 2',
      beamLabel: 'GPS signal',
      beamShort: 'GPS signal',
      beamFrac: 0.3, // the label sits on the beam's midpoint (the visible part), not beside the aircraft
      beamDx: 0,
      beamDy: 0,
      gnss: true,
      minPx: IS_PHONE ? 38 : 26,
      maxPx: IS_PHONE ? 70 : 52,
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
  insetSize: [132, 104],
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
      name: 'Close up: jammer zone and Airliner 1',
      short: 'Close up',
      at: [51, 18.5, 1.3],
      look: [56.2, 21, 0.98],
      phone: { at: [51, 18.5, 1.55] },
      ref: false, // a close-up of the dome: Airliner 2 is outside this frame by design
    },
    { name: 'Europe and GPS orbits', short: 'Europe and GPS', at: [42, -8, 5.0], look: [40, 10, 0.5], ref: false, hide: ['Ground jammer', 'Jammer effect'] },
  ],
  status: [
    [0, 'Both airliners have GNSS (green); the jammer zone is red', 'Airliners have GNSS (green); zone is red'],
    [0.3, 'Inside the zone GNSS is lost (red); outside it, OK (green). Satellites unaffected', 'Inside the zone GNSS is lost (red)'],
  ],
};
