// scenes/configs/cosmos1408.js: scene `cosmos1408` (see ../config.js for the list order)
import { C } from './shared.js';

export const COSMOS1408 = {
  id: 'cosmos1408',
  fitPct: 0.92,
  date: '2021-11-15',
  title: 'Nudol vs. Cosmos 1408 (2021)',
  shells: ['LEO'],
  duration: 16,
  caption:
    'Russia’s Nudol interceptor destroys the defunct Cosmos 1408 satellite at about 470 km. ' +
    'The debris cloud spreads across heights that cross the orbit of the International Space Station (ISS), which is drawn schematically. ' +
    'The ISS crew sheltered in their docked spacecraft. ' +
    'The Secure World Foundation (SWF) counts more than 1,800 tracked fragments, 5 of them still in orbit as of February 2026.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01; Table 2-4, p. 02-21.',
  related: 'us-moratorium-2022',
  event: 'ru-2021-cosmos1408',
  hit: { lat: 66.0, lon: 52.0, alt: 470, inc: 82.6, t: 0.3, wa: 0.4, wf: 0.6 },
  camHide: { 2: ['Impact'], 3: ['Plesetsk', 'Impact'] },
  launchCam: 'second',
  orbitAt: [52, 28, 4.5],
  phoneK: 1.16,
  liveText: { 'ISS orbit': 'ISS orbit' }, // the shorter text keeps its leader within the limit at 900 px
  noSimCount: true,
  actors: [
    { type: 'site', at: [62.9, 40.6], label: 'Plesetsk', color: C.ground, dx: -110, dy: -16 },
    {
      type: 'ring',
      alt: 420,
      inc: 51.6,
      color: C.iss,
      crossHit: 0.55,
      thick: 0.0032,
      opacity: 0.85,
      sat: { speed: 0.16, label: 'ISS orbit (schematic)', short: 'ISS orbit', iss: true, big: 1.3, minPx: 44, maxPx: 90, dx: 96, dy: 14 },
    },
    { type: 'target', label: 'Cosmos 1408', color: C.tgt, big: true, impactDx: 40, impactDy: -110, dx: -40, dy: 62 },
    { type: 'intercept', from: [62.9, 40.6], t0: 0.17, color: C.int, label: 'Nudol' },
    {
      type: 'debris',
      count: 1807,
      spreadAlt: 150,
      spreadInc: 5,
      spreadRaan: 2.2,
      dv: 1.0,
      decay: 0.25,
      color: C.debris,
      label: 'Debris of Cosmos 1408',
      short: 'Cosmos 1408 debris',
      dx: 0,
      dy: -34,
      labelEdge: true, // live: the label points at a fragment on the cloud's outer edge, not one deep inside it
    },
  ],
  still: 0.8,
  status: [
    [0, 'Nudol rises toward Cosmos 1408; the ISS orbit is drawn below it', 'Nudol rises toward Cosmos 1408'],
    [0.32, 'Collision at about 470 km: debris spreads and crosses the ISS orbit', 'Collision at about 470 km; debris spreads'],
    [0.6, 'Cloud crosses the ISS orbit. SWF: 5 of more than 1,800 pieces still in orbit (Feb. 2026)', 'SWF: 5 of more than 1,800 pieces still in orbit'],
  ],
};
