// scenes/configs/shared.js: palette and phone scale shared by the scene configs
import { IS_PHONE } from '../core.js';

// Actor colours follow the page palette (US, Russia, China); UK and defunct objects are neutral.
export const C = {
  us: '#56B4E9',
  ru: '#FF8C5A',
  cn: '#F0C24B',
  dead: '#9aa3b5',
  tgt: '#ffd166',
  int: '#ff6b6b',
  debris: '#ffb38a',
  iss: '#8cc8ff',
  gps: '#9be7c4',
  jam: '#ff5d5d',
  ok: '#6ee7a8',
  laser: '#ff4fd8',
  pin: '#ff8ae8',
  geo: '#ffcf6e',
  belt: '#b28cff',
  ground: '#e9edf7',
};

// Spacecraft models are drawn larger on phones (PK) so they stay legible in the small stage.
export const PK = IS_PHONE ? 1.5 : 1;
