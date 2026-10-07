// scenes/configs/cosmos1408.js: scene `cosmos1408` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const COSMOS1408 = {
  id: 'cosmos1408',
  fitPct: 0.92,
  latePct: 0.8, // later keys frame the bulk of the cloud and the ISS crossing, so the globe does not shrink to a ball
  fitCross: true,
  fitFillKeys: IS_PHONE ? [0.74, 0.9, 0.9, 0.9, 0.9] : undefined, // 375: the first frame keeps the satellite clear of the caption
  keyTimes: [0, 0.2, 0.46, 0.62, 1], // the camera pulls back from the launch to the whole cloud over 0.25 of the timeline, not in a 0.1 cut
  date: '2021-11-15',
  title: 'Cosmos 1408: Russia destroys one of its satellites (2021)',
  shells: ['LEO'],
  duration: 16,
  caption:
    'On 15 November 2021 Russia fired a Nudol missile from Plesetsk and destroyed ' +
    'Cosmos 1408, a defunct Russian satellite, about 470 km above the Earth. ' +
    'The debris cloud spread across heights that include the orbit of the International Space Station ' +
    '(ISS), which is drawn schematically, and the ISS crew sheltered in their docked spacecraft. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, counts more ' +
    'than 1,800 tracked fragments, 5 of them still in orbit as of February 2026. ' +
    'In April 2022 the United States pledged not to conduct destructive ' +
    '“direct-ascent” anti-satellite missile tests, meaning tests launched from Earth. ' +
    'It is a unilateral pledge, not a treaty. Other states followed; SWF counts 38 countries in all.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01; Table 2-4, p. 02-21.',
  related: 'us-moratorium-2022',
  event: 'ru-2021-cosmos1408',
  hit: { lat: 66.0, lon: 52.0, alt: 470, inc: 82.6, t: 0.3, wa: 0.4, wf: 0.6 },
  phoneHide: ['Plesetsk', 'Nudol', 'Debris of'], // 375: the launch site is secondary here; the Impact and Cosmos 1408 labels carry the picture
  camHide: { 2: ['Impact'], 3: ['Plesetsk', 'Impact', 'Debris of'] },
  launchCam: 'second',
  orbitAt: [52, 28, 4.5],
  phoneK: 1.16,
  narrowK: 1, // phone: the fitted frame already keeps Cosmos 1408 above the caption
  fitFill: IS_PHONE ? 0.8 : 0.94, // desktop and phone: the follow frame pulled back about 10% so the ISS ring is not clipped
  liveText: { 'ISS orbit': 'ISS orbit' }, // the shorter text keeps its leader within the limit at 900 px
  noSimCount: true,
  actors: [
    { type: 'site', at: [62.9, 40.6], label: 'Plesetsk', color: C.ground, dx: -52, dy: 16 },
    {
      type: 'ring',
      alt: 420,
      inc: 51.6,
      color: C.iss,
      crossHit: 0.55,
      thick: 0.0032,
      opacity: 0.85,
      sat: { speed: 0.16, label: 'ISS orbit (schematic)', short: 'ISS orbit', iss: true, big: IS_PHONE ? 1.35 : 2, minPx: IS_PHONE ? 54 : 64, maxPx: IS_PHONE ? 84 : 120, dx: 134, dy: 8 },
    },
    { type: 'target', label: 'Cosmos 1408', color: C.tgt, big: 2.6, minPx: 42, maxPx: 90, bright: true, impactDx: -84, impactDy: -46, dx: -40, dy: 62 },
    { type: 'intercept', from: [62.9, 40.6], t0: 0.17, color: C.int, label: 'Nudol', strong: true, flash: 0.2, coreK: 0.4, flashSpan: 0.12 },
    {
      type: 'debris',
      count: 1807,
      spreadAlt: 150,
      spreadInc: 5,
      spreadRaan: 2.2,
      dv: 1.0,
      decay: 0.25,
      late: { t0: 0.34, k: 7, kr: 1.2 },
      lateBoost: 1.9, // old fragments are brighter and a little larger, so the thinned ring is still visible at the end
      minPx: 5,
      maxPx: 11, // the band keeps spreading along and across the orbit instead of a smear over the pole
      lateGlow: true, // old fragments stay clearly visible near the ISS ring
      color: C.debris,
      label: 'Debris of Cosmos 1408',
      short: 'Cosmos 1408 debris',
      dx: 0,
      dy: -34,
      labelTopStatic: true, // static: the same, the top fragment (the static label would otherwise point at the lowest one, far from a label above the cloud)
      labelEdge: true, // live: the label points at a fragment on the cloud's outer edge, not one deep inside it
    },
  ],
  still: 0.8,
  phoneOff: { 'ISS orbit': [90, -30] }, // 375: the label hangs below the (smaller) ISS model, off the craft
  liveOff: { 'Cosmos 1408': [-100, 14], Plesetsk: [-96, 44], 'ISS orbit': [150, 0], Impact: [34, -112] }, // desktop: the pill sits below-left of the satellite, clear of the key legend in the lower right
  stillOff: { 'ISS orbit': [130, -37] }, // the still: the ISS label sits just right of the globe's edge
  status: [
    [0, 'Nudol rises toward Cosmos 1408; the ISS orbit is drawn below it', 'Nudol rises toward Cosmos 1408'],
    [0.32, 'Collision at about 470 km: debris spreads and crosses the ISS orbit', 'Collision at about 470 km; debris spreads'],
    [0.6, 'Cloud crosses the ISS orbit. SWF: 5 of more than 1,800 pieces still in orbit (Feb. 2026)', 'SWF: 5 of more than 1,800 pieces still in orbit'],
  ],
};
