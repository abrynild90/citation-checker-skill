// scenes/configs/burnt-frost.js: scene `burnt-frost` (see ../config.js for the list order)
import { C } from './shared.js';
import { IS_PHONE } from '../core.js';

export const BURNT_FROST = {
  id: 'burnt-frost',
  explanationAlt:
    'Sequence of the Burnt Frost interception: collision at about 220 km, spreading fragments, and a later count of none remaining from 175 tracked fragments. They fell out of orbit in about 20 months. Symbols and timing are illustrative.',
  noSimCount: true, // Only sourced counts belong in captions; particle decay is illustrative.
  date: '2008-02-20',
  title: 'Burnt Frost: the US destroys a failing satellite (2008)',
  shells: ['LEO'],
  duration: 12,
  lede: 'On 20 February 2008 the US Navy cruiser USS Lake Erie fired a modified SM-3 missile at USA-193, a failing US satellite, and destroyed it about 220 km above the Earth. The SM-3 is a missile-defense interceptor, so its use against a satellite shows the overlap between missile defense and anti-satellite capability.',
  caption:
    'On 20 February 2008 the US Navy cruiser USS Lake Erie fired a modified SM-3 missile at USA-193, a failing US satellite, and destroyed it about 220 km above the Earth. ' +
    'The SM-3 is a missile-defense interceptor, built to shoot down other missiles, so its use against a satellite shows the overlap between missile defense and anti-satellite capability. ' +
    'The Secure World Foundation (SWF), a space-security nonprofit, gives the height as 220 km in its Table 5-1 and 240 km in its text. At that height the 175 trackable pieces took about 20 months to fall out of orbit. The animation speeds that up. ' +
    'The Outer Space Treaty of 1967 bars nuclear weapons in orbit but is silent on conventional anti-satellite weapons.',
  cite: 'Secure World Foundation, 2026: Table 5-1, p. 05-01 (175 cataloged; 0 in orbit); time to re-enter and the 240 km figure in the text, p. 01-24.',
  related: null,
  event: 'us-2008-burnt-frost',
  phoneK: 1.15,
  phoneOff: { 'USS Lake Erie': [90, -66] }, // compact views: the name clears the ship and the caption below
  sunView: IS_PHONE ? { az: -14, el: 4 } : { az: -95, el: 8 }, // the Pacific sits in daylight with the terminator in view: the ship, missile and satellite get a key light
  glintK: IS_PHONE ? 0 : 0.4, // desktop: a silver path of light on the sea toward the pole side, seen from the low opening view
  glintAt: [76, 1],
  nightK: 1.2,
  dayK: IS_PHONE ? 1.6 : 1.15,
  seaK: IS_PHONE ? 2.2 : 0.8, // the Pacific is dark even in daylight: lifted so the ship and satellite separate from it
  phoneHide: ['Larger pieces', 'Pieces falling'], // 375: Impact, the illustration pill and the ship label are enough at the top of the frame
  launchAt: [3.3, 0.95, 0.8],
  camHide: { 3: ['Impact'] }, // Polar: the debris cloud is small there and the pill would sit on the disc
  liveOff: { Impact: [-108, -20], 'Larger pieces': [168, -62], 'USS Lake Erie': [150, -4] }, // the collision frame: Impact to the left, the falling pieces to the right
  offSteps: {
    Impact: [[0, -108, -20], [0.9, -70, -48]], // the collision frame: to the left; the final count (from 0.9) sits close to the limb, clear of Japan's city lights
    'SM-3': [[0, 118, -48], [0.17, 118, -48], [0.27, -150, -86, 'ease'], [0.3, -150, -86], [0.38, -190, 0, 'ease'], [0.44, null]], // the SM-3 pill: right of the missile at the opening, then left of it; it drifts down and left to clear the satellite's pill as the two close (one side, no hop), and the placer's own slot after the hit
    'USS Lake Erie': [[0, 20, 62], [0.19, 20, 62], [0.3, 150, -4, 'ease']], // under the hull's flank in the opening (clear of the SM-3 pill on the right), then right of the ship once the camera pulls out
    'USA-193': [[0, -34, -80], [0.34, 76, -66], [0.44, null]], // above and a little left of the satellite until the interceptor closes on it, then up and to its right (clear of the interceptor and the ship's pill)
  },
  camOff: { 1: { 'USA-193': [140, -10] }, 2: { 'USA-193': [44, -58], 'USS Lake Erie': [-120, -90] } }, // From orbit: the satellite pill sits off the disc, right of the limb
  offFrom: { 'USA-193': 0.3 }, // the fixed From orbit offset applies once the interceptor is near the satellite
  earlyKey: true,
  dropCoreFrom: 0.55, // after the fall begins the camera frames the debris, not the ship
  keyTimes: IS_PHONE ? undefined : [0, 0.189, 0.3, 0.42, 0.52, 0.6, 0.68, 0.76, 0.84, 1], // desktop: more keys through the fall, each fitted to the debris, so the streaks and fragments stay in frame
  fitDebrisT: IS_PHONE ? undefined : 0.76, // the last keys keep the framing of the widest cloud: the end is the impact region and its trail, not a close-up of one point
  openRel: IS_PHONE ? undefined : { from: 'ship', el: 11, az: -90, lift: 0.05, fill: 0.85, w: [1, 1, 0.5] }, // desktop: the opening is the poster's view, low over the sea beside the ship, easing into the fitted framing at the hit
  fitPct: 0.95,
  fitGlobeOnly: !IS_PHONE, // the last keys frame the globe itself (centred and filled), not the debris that has all gone: no dark void
  fitGlobeFrom: IS_PHONE ? undefined : 0.84, // the last keys keep the whole globe in frame, with the impact point and the trail on it

  fitFillKeys: IS_PHONE ? [0.82, 0.9] : [0.9, 0.9], // desktop: the opening frames the ship and the satellite close, so the interceptor in its cell reads
  burstPadFrom: IS_PHONE ? undefined : 0.3, // desktop: the early keys are fitted to the craft alone (the burst ring is not in frame yet)
  fitTilt: IS_PHONE ? undefined : 38,
  fitTiltKeys: IS_PHONE ? undefined : [null, null, 58, 58, 52, 44, null, null, null, null], // desktop: through the launch and climb the camera leans well off the vertical, so the ship is seen from an oblique angle (flank, decks, mast), not as a plan; the later keys keep the usual view
  fillK: 0.25, // a neutral fill: the ship and satellite keep their paint on the night side // desktop: the view is turned about 15 degrees from the default
  hit: {
    lat: 29.0,
    lon: -173.0,
    alt: 220,
    inc: 58.5,
    t: 0.42,
    wa: 0.15,
    wf: 0.5,
  },
  actors: [
    {
      type: 'ship',
      at: [22.0, -179.0],
      heading: -0.7, // lies across the picture from the pull-back on (it stood up the frame, bow to the limb, like a cut-out); the opening shows it side on
      label: 'USS Lake Erie',
      shade: true,
      leaderHull: true, // the name's leader ends on the hull's outline, not across the deck
      labelUntil: 0.34, // the name retires as the camera turns to follow the interceptor: from there the ship lies along the limb with no clear slot for a pill at the narrower widths
      hideFrom: 0.58,
      dx: 0,
      dy: 44,
      minPx: IS_PHONE ? 72 : 170,
      maxPx: IS_PHONE ? 135 : 245,
      camK: IS_PHONE ? undefined : { 0: 1.42 }, // the default camera opens on the ship, a little larger; the whole-Earth presets keep the old size
      sizeCam: 0, // the default camera only: the whole-Earth presets keep the hull's size
      sizeSteps: IS_PHONE ? undefined : [[0, 1.5], [0.22, 1.5], [0.42, 1.12], [0.56, 1]], // desktop: the cruiser is large in the opening frames (it is the subject until the launch), easing back to its size as the camera pulls out to the debris
    },
    {
      type: 'target',
      label: 'USA-193',
      color: C.tgt,
      big: 1.7,
      minPx: 60,
      maxPx: 100,
      impactUntil: 0.9, // the Impact pill stays on the contact point (where the interceptor met the satellite), not on the drifting debris; a tick keeps marking the point
      impactDx: -150,
      impactDy: -30,
      tickUntil: 0.9, // the tick marks the point until the last count, then the count's own pill takes over
      endLabel: 'Impact point: 0 of 175 in orbit', // the last frames (the cloud has all decayed) keep the impact point and the final count
      endShort: '0 of 175 in orbit',
      endFrom: 0.9,
      endDx: 40, // the end label sits right of the impact point, off the Japanese city lights
      endDy: -26,
      bright: true,
      fallUntil: 0.87,
      fall: [
        { k: 1.5, di: 0.2, dr: 0.01, dw: 0.9 },
        { k: 1.25, di: -0.3, dr: -0.012, dw: 1.05 },
        { k: 1.05, di: 0.4, dr: 0.02, dw: 1.15 },
      ],
    },
    {
      type: 'intercept',
      from: [22.0, -179.0],
      arcRise: 0.3, // a vertical-launch climb that flattens onto the satellite's height (the old high bow overshot and hooked back at the end)
      arcLift: 0.02,
      t0: 0.2,
      color: '#ff8a4a',
      taper: 0.3,
      thick: 0.0055,
      label: 'SM-3 interceptor',
      short: 'SM-3',
      labelFollow: true, // the leader ends on the missile's head, not on a fixed point of its arc
      rocket: { style: 'slim', minPx: IS_PHONE ? 92 : 125, maxPx: IS_PHONE ? 125 : 165, glowMin: 14, glowMax: 24, launch: 'vls', plumeDeck: true, preK: 1.0, waitRing: true, ringK: 0.7, deck: 0.0095, waitLabel: true, ramp: IS_PHONE ? { k: 1.2, until: 0.35 } : { k: 0.88, until: 0.5 }, smokeK: 1.6 }, // launch 'vls': a vertical-launch cold-gas pop lifts it out of its cell, then the motor lights
      flash: 0.24,
      flashCap: 0.8,
      coreK: 0.55,
      strong: true,
      retire: 0.14,
      hold: -0.03, // the SM-3 pill stays with the missile until just before the hit
      flashSpan: 0.12,
      linger: 0.2,
      lingerK: 0.5,
      lingerEnd: 0.6,
    },
    {
      type: 'debris',
      count: 175,
      spreadAlt: 130,
      spreadInc: 6.5, // a wider cross-track spread (3.6 / 3.2 before): at t=0.5-0.6 the cloud was a thin orange column along the orbit
      spreadRaan: 6,
      scatter: 0.028,
      dv: 0.85,
      drift: 0.9,
      decay: 2.2,
      decayWin: [0.62, 0.87],
      hideEmpty: true,
      color: '#ffb066',
      palette: {
        hot: [1, 0.86, 0.55],
        mid: [1, 0.6, 0.25],
        cool: [1, 0.5, 0.22],
      },
      hard: true,
      size: 0.036,
      minPx: 2.5,
      maxPx: 5,
      additive: false,
      lateGlow: true,
    }, // warm orange fragments, uneven in size and spread: no lattice, separate from the blue ocean
  ],
  still: 0.47,
  status: [
    [0, 'The ship readies an interceptor for the satellite'],
    [0.25, 'Interceptor closes on the satellite', 'Interceptor closing in'],
    [0.44, 'Collision at about 220 km', 'Collision at about 220 km'],
    [0.54, 'Fragments spread after the collision; positions are illustrative', 'Fragments spread after collision'],
    [0.65, 'Time passes: debris falls back into the atmosphere', 'Time passes: debris falls back'],
    [0.9, 'SWF: 0 of 175 tracked fragments remain; all fell out of orbit in about 20 months', 'Later count: 0 of 175 remain (SWF)'],
  ],
};
