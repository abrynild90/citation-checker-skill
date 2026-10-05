// scenes/configs/laser.js: scene `laser` (see ../config.js for the list order)
import { IS_PHONE } from '../core.js';
import { C } from './shared.js';

export const LASER = {
  id: 'laser',
  date: '1997-10-17',
  title: 'MIRACL: a US laser fired at a satellite (1997)',
  shells: ['LEO'],
  duration: 12,
  caption:
    'In October 1997 the United States fired the MIRACL chemical laser at ' +
    'MSTI-3, a retired Air Force experimental satellite with infrared sensors. ' +
    'Detailed results of the test are not public. ' +
    'MIRACL is now part of a facility at White Sands Missile Range, New ' +
    'Mexico, where this diagram places it. The beam is drawn for illustration. ' +
    'A low-power beam can dazzle a sensor, which means briefly blinding it. A high-power beam could damage it. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, describes Russia’s ' +
    'Peresvet as a mobile laser dazzler. The Russia view shows only its shelter sites. ' +
    'No legal item in our records is tied to this test. That is a gap in our records, not a finding that no rule exists.',
  cite: 'Secure World Foundation, 2026: p. 01-35 (MIRACL); pp. 02-35 to 02-36 (Peresvet shelter sites; site markers approximate).',
  related: null,
  event: 'us-1997-miracl',
  hit: { lat: 32.4, lon: -106.4, alt: 420, inc: 97.0, t: 0.5, wa: 0.3, wf: 0.22 },
  lift: 30,
  stillShort: ['MIRACL beam'],
  staticT: 0.7, // static: the satellite well along its pass, so the beam is drawn at full length
  staticZoom: 2.6,
  staticCenter: [14, -80], // static: off the orbit's ground track so the edge-on orbit line is not a chord through the centre
  staticCraftMax: 36, // static: MSTI-3 and the beam are the subject
  staticCraftMaxPhone: 40,
  staticGlobeY1Phone: 0.4,
  staticStatusPhone: 'MIRACL beam tracks the satellite',
  staticBeamW: 5,
  staticGlobeY1: 0.75, // static: close-up on the beam, the globe's lower part runs off the frame
  staticRingGap: 22, // static: the orbit line is broken around MSTI-3
  staticMarkerCap: { 'MSTI-3 (US test target)': 44 }, // the satellite is the target of the beam: 44 px at the 22 px reference stage (global cap 22)
  staticBeamShort: true, // static: the short "MIRACL beam" pill, so it stays clear of the MSTI-3 pill and the limb
  staticBeamLabelFrac: 0.85, // static: MIRACL label anchored near the satellite end, above the limb
  staticK: 1.9, // static: MSTI-3 drawn further out in space so it clears the Earth limb
  actors: [
    { type: 'site', at: [32.4, -106.4], label: 'White Sands Missile Range, New Mexico', short: 'White Sands', color: C.ground, dx: -96, dy: 30 },
    { type: 'target', label: 'MSTI-3 (US test target)', short: 'MSTI-3', color: C.tgt, noHit: true, big: 1.7, minPx: 46, maxPx: 84, dx: 30, dy: 50 },
    {
      type: 'beam',
      from: [32.4, -106.4],
      window: 0.42,
      color: C.laser,
      label: 'MIRACL beam',
      short: 'MIRACL beam',
      width: 0.034,
      dx: 70,
      dy: -26,
      labelOffDisc: true,
      sdx: 120, // static: label to the right of the beam, with a short leader
      sdy: -10, // static: raised so the pill clears the globe limb at 375
    },
    {
      type: 'site',
      at: [56.86, 40.53],
      label: 'Peresvet shelters: Teykovo',
      short: 'Teykovo',
      color: C.pin,
      dx: -20,
      dy: -34,
      pin: true,
      liveOnly: true,
      minPx: IS_PHONE ? 22 : 38, // 375: smaller pins so Teykovo and Yoshkar-Ola do not overlap
      maxPx: IS_PHONE ? 32 : 66,
    },
    {
      type: 'site',
      at: [56.63, 47.89],
      label: 'Yoshkar-Ola',
      color: C.pin,
      dx: 14,
      dy: 40,
      pin: true,
      liveOnly: true,
      minPx: IS_PHONE ? 22 : 38, // 375: smaller pins so Teykovo and Yoshkar-Ola do not overlap
      maxPx: IS_PHONE ? 32 : 66,
    },
    {
      type: 'site',
      at: [55.03, 82.92],
      label: 'Novosibirsk',
      color: C.pin,
      dx: 0,
      dy: 40,
      pin: true,
      liveOnly: true,
      minPx: IS_PHONE ? 22 : 38, // 375: smaller pins so Teykovo and Yoshkar-Ola do not overlap
      maxPx: IS_PHONE ? 32 : 66,
    },
  ],
  liveShort: ['White Sands'], // live: the short name, so the pill stays clear of the ground station and the limb
  liveOff: { 'White Sands': [-112, 14], 'MSTI-3': [96, -30] }, // fixed offsets: the ground station and satellite pills keep their places as the pass moves
  still: 0.5,
  status: [
    [0, 'MSTI-3 rises over White Sands'],
    [0.15, 'MIRACL beam tracks the satellite while it is above the horizon', 'MIRACL beam tracks the satellite'],
    [0.8, 'Same principle: Russia’s Peresvet laser (named in 2018) is a mobile dazzler (SWF)', 'SWF: Russia’s Peresvet is a laser dazzler'],
  ],
  cameras: [
    { name: 'Follow the satellite', fit: { site: [32.4, -106.4], tilt: 55, fill: 0.66 } },
    { name: 'Side view', fit: { site: [32.4, -106.4], tilt: 58, side: -1, fill: 0.72 } },
    {
      name: 'Close up of MSTI-3',
      fit: { site: [32.4, -106.4], tilt: 10, fill: 0.8, dMax: 4.6 },
      phone: { fit: { site: [32.4, -106.4], tilt: 10, fill: 0.7, dMax: 4.6 } },
    },
    {
      name: 'Russia: Peresvet sites',
      at: [50, 55, 2.3],
      look: [56, 58, 1.0],
      drift: [22, 12], // a slow pan east across the shelter sites: the view differs at every t
      ref: false,
      hide: ['MSTI-3', 'MIRACL', 'White Sands'],
      status: ['Markers show the shelter sites of Russia’s Peresvet, a mobile laser dazzler (SWF)', 'Peresvet shelter sites (approximate)'],
    },
  ],
};
