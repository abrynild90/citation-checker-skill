// ============================================================================
// scenes/config.js: scene configuration data: the SCENES (ten kinetic/non-kinetic plus three co-orbital, one module each in configs/) and the HERO overview
// ============================================================================
import { GEO_ALT } from './core.js';
import { C } from './configs/shared.js';
import { STARFISH } from './configs/starfish.js';
import { SOLWIND } from './configs/solwind.js';
import { FENGYUN } from './configs/fengyun.js';
import { BURNT_FROST } from './configs/burnt-frost.js';
import { DN2 } from './configs/dn2.js';
import { SHAKTI } from './configs/shakti.js';
import { COSMOS1408 } from './configs/cosmos1408.js';
import { GNSS } from './configs/gnss.js';
import { VIASAT } from './configs/viasat.js';
import { LASER } from './configs/laser.js';
import { SJ21_TUG } from './configs/sj21-tug.js';
import { RPO } from './configs/rpo.js';
import { SPACEPLANES } from './configs/spaceplanes.js';

export { C };

// Order matters: it is the order of the scene picker and of the page (kinetic and non-kinetic scenes first, then the co-orbital scenes).
export const SCENES = [STARFISH, SOLWIND, FENGYUN, BURNT_FROST, DN2, SHAKTI, COSMOS1408, GNSS, VIASAT, LASER, SJ21_TUG, RPO, SPACEPLANES];

export const HERO = {
  id: 'hero',
  title: 'Overview',
  shells: ['LEO', 'MEO', 'GEO'],
  duration: 40,
  spin: true,
  shellLabels: { LEO: 'LEO ≤2,000 km', MEO: 'MEO · GPS', GEO: 'GEO ~35,786 km' },
  shellShort: { LEO: 'LEO', MEO: 'MEO · GPS', GEO: 'GEO' },
  shellAng: { LEO: -58, MEO: 42, GEO: 80 },
  staticShellAng: { LEO: 150, MEO: -28, GEO: 8 },
  shellOff: { LEO: [-30, 34], MEO: [46, 22], GEO: [46, -26] },
  actors: [
    {
      type: 'ring',
      alt: 420,
      inc: 51.6,
      raan: 30,
      color: C.iss,
      sat: { phase: 0.04, speed: 3, label: 'ISS (illustrative orbit)', short: 'ISS', dx: 0, dy: 0, offGlobe: true, iss: true, big: 1.3, minPx: 46, maxPx: 72 },
    },
    { type: 'constellation', alt: 20200, inc: 55, planes: 6, per: 3, color: C.gps, speed: 0.4 },
    { type: 'ring', alt: GEO_ALT, inc: 0, raan: 0, color: C.geo, sats: 14 },
  ],
  still: 0.2,
  camDist: 7.2,
  focus: [22, -30],
  wideLat: 13,
};
