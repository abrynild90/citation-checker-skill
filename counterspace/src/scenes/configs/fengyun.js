// scenes/configs/fengyun.js: scene `fengyun` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const FENGYUN = {
  id: 'fengyun',
  fitPct: IS_PHONE ? 0.8 : 0.94,
  date: '2007-01-11',
  title: 'Fengyun-1C: China destroys a weather satellite (2007)',
  shells: [], // the debris ring is the subject; a second orbit-zone ellipse obscures its shape
  duration: 16,
  lede: 'On 11 January 2007 China fired a ground-launched anti-satellite missile and destroyed Fengyun-1C, a Chinese weather satellite, about 880 km above the Earth. At that height, fragments stay in orbit for decades and spread into a ring around the planet.',
  caption:
    'On 11 January 2007 China fired an SC-19 (a ground-launched anti-satellite missile) from Xichang and ' +
    'destroyed Fengyun-1C, a Chinese weather satellite, about 880 km above the Earth. ' +
    'At that height, fragments stay in orbit for decades. ' +
    'They spread along the old orbit into a ring around the planet. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, lists no ' +
    'other test in its Table 5-1 that produced as many tracked fragments. ' +
    'In 2022 the UN General Assembly called on states not to conduct destructive “direct-ascent” ' +
    'anti-satellite missile tests, meaning tests launched from Earth (resolution 77/41). ' +
    'The call is not binding.',
  cite: 'Secure World Foundation, 2026, Table 5-1, p. 05-01 (3,532 cataloged; 2,351 in orbit as of Feb. 2026).',
  modelNote:
    'Fengyun-1C is shown with a box-shaped body and two long solar arrays. NASA describes two 1.5 × 4 m arrays. Its size, orientation and motion here are illustrative.',
  modelSource: 'https://orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/odqnv13i3.pdf',
  related: 'unga-77-41',
  event: 'cn-2007-fy1c',
  hit: { lat: 35.5, lon: 106.5, alt: 880, inc: 98.6, t: 0.3, wa: 1.0 },
  debrisFit: {}, // the camera keeps the live debris inside the frame from the collision to the end
  launchCam: 'second',
  camScale: 1.4, // the launch-site view stands back a little: the satellite, further off early on, is still in frame at t=0.1
  preDrift: { t0: 0.14, k: 0.1, out: 0.08 }, // a slow push-in while the vehicle waits on its pad (with the vapour venting and the tower light), so the opening is not still
  fitSouth: 50, // the first views look from the south, so the vehicle on the pad stands up in the frame (from above it was a speck of 70 px)
  fitLateView: [24, 35], // turn smoothly toward an oblique ring view after the cloud spreads
  fitLateViewFrom: 0.4, // the first views look from the south (fitSouth), so the turn toward the ring view starts a key earlier (0.5 cropped the debris at the frame foot)
  staticCenter: [24, 35], // oblique to the near-polar orbit: a ring, rather than an edge-on plume
  orbitAt: [24, 35, 4.6],
  fitMinKeys: IS_PHONE ? [1.9, 0] : [1.45, 2.0], // the first key frames the Xichang to satellite arc close, so the interceptor and the satellite read as craft
  lookK: IS_PHONE ? 0.8 : 0.84, // the Earth stays whole and centred in the first frames (phone: it was cropped at the left)
  latePct: IS_PHONE ? 0.8 : 0.62, // the ring steps frame the bulk of the cloud, so the Earth fills more of the frame
  fitFillKeys: IS_PHONE ? [0.88, 0.88, 0.88, 0.88, 0.88] : [0.72, 0.66, 0.8, 0.95, 0.95],
  phoneK: 1.14,
  narrowK: 1, // phone: the fitted dolly already frames the debris; a further tighten cut it at the frame edge
  fitFill: IS_PHONE ? 0.88 : 0.78, // 375: the follow camera frames the launch with more sky around it, so the globe is not cropped at the corner
  liveOff: { 'Fengyun-1C': [0, -70], Xichang: [-60, 34], 'Debris ring': [120, 18], 'SC-19': [-140, -34] }, // desktop: the pill sits above the satellite, clear of the key legend in the lower right
  camOff: { 1: { 'Debris ring': [90, 0] }, 3: { 'Debris ring': [90, 0] } },
  offFrom: { 'Fengyun-1C': 0.18 }, // 375: before the launch the placer's own slot is clear; from here the pill hangs below-right of the satellite
  phoneOff: { 'Fengyun-1C': [18, 52], Xichang: [-50, 36] }, // 375: Xichang sits at the glow of the launch; its chip hangs below-left on a visible leader
  sunView: { az: 60, el: 14 }, // a lower, more sideways sun: a clear terminator and a shaded limb, not a flat disc
  noSimCount: true,
  lightsK: 0.5, // softer night lights over East Asia
  stillImpact: true, // the print also labels the impact point
  actors: [
    { type: 'site', at: [28.2, 102.0], label: 'Xichang', color: C.ground },
    {
      type: 'target',
      variant: 'fengyun',
      label: 'Fengyun-1C',
      color: C.tgt,
      big: true,
      minPx: IS_PHONE ? 60 : 100,
      maxPx: IS_PHONE ? 90 : 140,
      impactDx: 150,
      impactDy: -80,
      impactUntil: 0.6,
    },
    {
      type: 'intercept',
      from: [28.2, 102.0],
      t0: 0.14,
      color: C.int,
      label: 'SC-19',
      strong: true,
      coreK: 0.85,
      flash: 0.3,
      rocket: IS_PHONE ? undefined : { style: 'slim', endHold: 0.01, minPx: 135, maxPx: 165, ramp: { k: 1.35, until: 0.3 }, burn: 0.8, smokeK: 1.7, pad: { minPx: 44, maxPx: 64 }, vent: true }, // 35% larger than before, so the vehicle reads at the default framing
    }, // a bright core and a second white ring: the hit reads against the debris plume
    {
      type: 'debris',
      count: 3532,
      spreadAlt: 260,
      spreadInc: 1.6,
      dv: 0.9,
      decay: 0,
      color: C.debris,
      hard: true, // separate fragments, without a soft haze hiding their distribution
      minPx: IS_PHONE ? 2.5 : 2, // individual fragments remain distinct on the smaller stage
      maxPx: 5.5,
      size: 0.034,
      label: 'Debris ring',
      appear: 0.32, // the fragments and their label come up with the step that names them (the collision step), not in the 0.02 before it
      labelEdge: true, // live: the label points at a fragment on the ring's outer edge, so the leader stays short
      dx: 70,
      dy: 24,
      ring: { t1: 0.57, ease: 1.5, fat: 2.4 }, // the fragments reach their share of the full circle by t 0.56: a closed ring, as the caption says
      late: { t0: 0.6, k: 1.4, kr: 6 },
    },
  ],
  still: 0.85,
  status: [
    [0, 'SC-19 rises toward Fengyun-1C'],
    [0.32, 'Collision at ~880 km: debris spreads along the old orbit', 'Collision at ~880 km'],
    [0.6, 'A ring forms around the planet', 'A ring forms around Earth'],
    [0.76, 'Fast-forward: the ring spreads wider and thinner. SWF: 2,351 of 3,532 still in orbit (Feb. 2026)', 'SWF: 2,351 of 3,532 still in orbit'],
  ],
};
