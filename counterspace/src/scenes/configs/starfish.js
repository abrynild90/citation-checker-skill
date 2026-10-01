// scenes/configs/starfish.js: scene `starfish` (see ../config.js for the list order)
import { C } from './shared.js';

export const STARFISH = {
  id: 'starfish',
  date: '1962-07-09',
  title: 'Starfish Prime (1962)',
  shells: ['LEO'],
  duration: 14,
  caption:
    'A 1.4-megaton warhead detonates about 400 km above Johnston Island. Electrons from the blast are trapped by Earth’s magnetic field. ' +
    'They spread along field lines and drift around the planet, forming an artificial radiation belt. ' +
    'SWF says such tests are known to have generated effects that damaged or destroyed satellites in orbit at the time. ' +
    'The belt’s spread in the animation is drawn for legibility, not computed.',
  cite: 'DOE/NV-209 Rev. 16 (Starfish Prime, 9 July 1962); SWF 2026, p. 12-05 (effects that damaged or destroyed satellites in orbit at the time).',
  related: 'ltbt-1963',
  event: 'us-1962-starfish-prime',
  actors: [
    { type: 'site', at: [16.7, -169.5], label: 'Johnston Island', short: 'Johnston Is.', color: C.ground, dx: -84, dy: 40 },
    {
      type: 'suborbital',
      from: [16.7, -169.5],
      to: [16.5, -169.0],
      apex: 400,
      t0: 0.02,
      t1: 0.14,
      color: C.int,
      label: 'Thor launch',
      opt: true,
      dx: -96,
      dy: 4,
    },
    { type: 'flash', at: [16.5, -169.2, 400], t0: 0.14, color: '#fff3c4', label: 'Detonation ~400 km', short: 'Detonation', dx: 34, dy: -34 },
    { type: 'field', lon: -169.2, Ls: [1.18, 1.4, 1.7], color: '#c9b0ff', t0: 0.14 },
    {
      type: 'belt',
      at: [16.5, -169.2],
      L: [1.12, 1.7],
      t0: 0.18,
      t1: 0.9,
      count: 2600,
      color: C.belt,
      size: 0.02,
      nLon: 12,
      label: 'Artificial radiation belt',
      short: 'Radiation belt',
    },
    {
      type: 'ring',
      alt: 800,
      inc: 44.8,
      raan: 40,
      color: '#8cc8ff',
      sat: {
        phase: 1.05,
        speed: 0.25,
        big: 1.5,
        label: 'Satellite in belt',
        short: 'Satellite',
        dx: 30,
        dy: 60,
        staticPh: -0.75, // static: drawn further along its orbit, off the Earth's centre
        fail: { t: 0.8, label: 'Satellite damaged (SWF: such tests did this)', short: 'Satellite damaged' },
      },
    },
  ],
  phoneHide: ['Thor launch'],
  phoneOnDisc: ['Johnston', 'Detonation', 'Satellite'], // 375 live: these sit beside their referents (over the dark Pacific), not in a far column
  stillShort: ['Artificial'], // the live still names the belt "Radiation belt" (fits right of the outer arc)
  staticDropPhone: ['Thor launch'], // 375 static: Thor shares the burst spot; Detonation and Johnston keep separate labels, placed apart
  still: 0.7,
  camDist: 3.5,
  phoneK: 1.5, // 375: zoomed out so the whole belt (L up to 1.7, field-line arches included) and the globe fit
  staticZoom: 1.7,
  staticCenter: [35, -205],
  staticCraftCap: 0.03, // static (screen and print): every icon is at most 3% of the Earth disc area
  staticCraftMax: 54, // static: the satellite icon stays small (it must not cover the Earth's centre)
  stillCam: { at: [16, -160, 4.2], look: [0, 0, 0], hideShell: true },
  status: [
    [0, 'Thor rocket climbs toward ~400 km'],
    [0.16, 'Detonation: electrons trapped on Earth’s field lines', 'Detonation: electrons trapped'],
    [0.3, 'Trapped electrons spread in longitude and latitude along field lines', 'Electrons spread along field lines'],
    [0.75, 'Belt has drifted around Earth (illustrative spread)', 'Belt drifts around Earth (illustrative)'],
    [0.82, 'SWF: effects of such tests damaged or destroyed satellites in orbit at the time', 'Satellites in orbit were damaged (SWF)'],
  ],
};
