// scenes/configs/starfish.js: scene `starfish` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

const PH = IS_PHONE ? 1.05 : 1; // phoneK, the distance factor of the 375 stage

export const STARFISH = {
  id: 'starfish',
  date: '1962-07-09',
  title: 'Starfish Prime: a nuclear explosion in space (1962)',
  shells: ['LEO'],
  duration: 14,
  caption:
    'On 9 July 1962 the United States detonated a 1.4-megaton nuclear warhead (equal to ' +
    '1.4 million tonnes of TNT) about 400 km above Johnston Island in the Pacific Ocean. ' +
    'Electrons from the blast were trapped by Earth’s magnetic field. ' +
    'They spread along the field lines and drifted around the planet, forming an artificial radiation belt. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, says such tests are known ' +
    'to have produced effects that damaged or destroyed satellites in orbit at the time. ' +
    'The Limited Test Ban Treaty of 1963 bans nuclear tests in outer space. ' +
    'It followed Starfish Prime. ' +
    'The belt’s spread is drawn to show the idea. It is not a calculation.',
  cite:
    'US Department of Energy, DOE/NV-209 Rev. 16 (Starfish Prime, 9 July 1962); ' +
    'Secure World Foundation, 2026, p. 12-05 (satellite damage from such tests).',
  related: 'ltbt-1963',
  event: 'us-1962-starfish-prime',
  actors: [
    {
      type: 'site',
      at: [16.7, -169.5],
      label: 'Johnston Island',
      short: 'Johnston Is.',
      color: C.ground,
      dx: -84,
      dy: 40,
      staticAt: [0.78, 0.4], // static (screen and print): up and right of the burst, so its leader leaves the Earth by the short way and crosses no other label
      staticPin: 'hard',
      minPx: 10,
      maxPx: 15,
    },
    {
      type: 'suborbital',
      from: [16.7, -169.5],
      to: [16.5, -169.0],
      apex: 400,
      t0: 0.02,
      t1: 0.14,
      color: C.int,
      label: 'Thor launch',
      labelEnd: 0.24, // live: the Thor chip goes once the burst has happened (it only crowded the globe at t 0.6 and 0.85); the static views drop it anyway
      opt: true,
      dx: -96,
      dy: 4,
    },
    { type: 'flash', at: [16.5, -169.2, 400], t0: 0.14, strong: true, size: 0.34, span: 0.4, color: '#fff3c4', label: 'Detonation ~400 km', short: 'Detonation', dx: 34, dy: -34 },
    { type: 'field', lon: -169.2, Ls: [1.18, 1.4, 1.7], color: '#c9b0ff', t0: 0.14 },
    {
      type: 'belt',
      at: [16.5, -169.2],
      L: [1.12, 1.7],
      t0: 0.18,
      t1: 0.9,
      count: 2600,
      color: C.belt,
      size: 0.026,
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
        fail: { t: 0.8, label: 'Satellite damaged', short: 'Satellite damaged' },
      },
    },
  ],
  liveLabelK: 1.25, // live at desktop width: the labels carry the story, so the type is 25% larger than the default 11 px
  // live desktop (px from their referents, default camera): Detonation, Johnston and Thor sit in a column just left of the leftmost field-line arc, over the
  // dark Pacific, each with its own short leader (listed first: the later ones are checked against where these landed); the belt label hangs a few px
  // above the belt point it names
  liveOff: { Detonation: [-150, -62], Johnston: [-140, -4], Thor: [-120, -78], Artificial: [-60, -21], 'Satellite damaged': [-130, 30] },
  // Near and Polar (px from their referents, desktop width): Thor and Detonation fan out from the burst with short leaders that miss each other's chips;
  // on Polar the labels sit left and right of the burst (clear of the caption) and the satellite chip hugs the satellite
  camOff: {
    1: { Detonation: [-140, -36], Johnston: [-120, 45], Thor: [-132, 4] },
    2: { Artificial: [-60, -22], 'Satellite in': [-95, 0], 'Satellite damaged': [-190, 0], Johnston: [-120, 22], Detonation: [120, 36], Thor: [-150, 78] },
  },
  // the three presets, written out so Polar can sit lower (42 N, not 80 N): the burst then sits inside the frame instead of on the limb
  cameras: [
    // glide: the first steps (the Thor launch, the burst) are cut tight on Johnston Island; the camera then eases out to the whole belt between 0.18 and 0.4
    // (longitudes written as -194.5 = 165.5 so the move does not swing the long way round)
    {
      name: 'Whole scene',
      glide: [
        [0, [13.5, -172, 2], [16.6, -169.3, 1.03]],
        [0.12, [13.5, -172, 2], [16.6, -169.3, 1.03]],
        [0.3, [18, -175, 2.45], [16.6, -169.4, 1]],
        [0.42, [19.5, -184, 3.1], [8, -178, 0.5]],
        [0.52, [20.02, -194.5, IS_PHONE ? 3.5 * PH * 1.1 : 4.15], [0, -194.5, 0]],
        [1, [20.02, -194.5, IS_PHONE ? 3.5 * PH * 1.1 : 4.15], [0, -194.5, 0]],
      ],
    },
    { name: 'Close up', at: [16.7, -177.5, Math.max(2.3, 3.5 * PH * 0.55)] },
    { name: 'From the north', at: [42, -169.5, 4.3 * PH] },
  ],
  phoneHide: ['Thor launch', 'LEO', 'Artificial', 'Johnston'], // 375: two labels only (Detonation, Satellite) plus the caption; Johnston is named in the story text
  phoneOnDisc: ['Detonation', 'Satellite'], // 375 live: these sit beside their referents (over the dark Pacific), not in a far column
  stillShort: ['Artificial'], // the live still names the belt "Radiation belt" (fits right of the outer arc)
  staticDropPhone: ['Thor launch'], // 375 static: Thor shares the burst spot; Detonation and Johnston keep separate labels, placed apart
  staticDrop: ['Thor launch'], // static: the launch ends at the burst, whose label already says it; its leader only cut across the Earth
  still: 0.7,
  camDist: 3.5,
  nightK: 2.4, // the Pacific night side is lifted so the ocean, the island glints and the rocket separate from the dark at t=0
  phoneK: 1.05, // 375: the Earth stays at least 240 px wide; the outer field-line arches may run past the frame edge
  staticZoom: 1.7,
  staticCenter: [35, -205],
  staticCraftCap: 0.03, // static (screen and print): every icon is at most 3% of the Earth disc area
  staticCraftMax: 54, // static: the satellite icon stays small (it must not cover the Earth's centre)
  stillCam: { at: [16, -160, 4.2], look: [0, 0, 0], hideShell: true },
  status: [
    [0, 'Thor rocket climbs toward about 400 km'],
    [0.16, 'Detonation: electrons caught in Earth’s magnetic field', 'Detonation: electrons trapped'],
    [0.3, 'Trapped electrons spread north, south, east and west along field lines', 'Electrons spread along field lines'],
    [0.75, 'The belt has drifted around Earth', 'Belt drifts around Earth'],
    [0.82, 'SWF: tests like this damaged or destroyed satellites then in orbit', 'SWF: such tests damaged or destroyed satellites'],
  ],
};
