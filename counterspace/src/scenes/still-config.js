// ============================================================================
// scenes/still-config.js: per-scene PNG still settings (camera, field of view, label scale), chosen by viewing the stills.
// pos/look are world coordinates (three frame, Earth radius 1); fov is the vertical field of view in degrees at the still aspect (STILL_ASPECT).
// shift = [dx, dy] moves the picture by that fraction of the frame (view offset). hideShell hides the shell rings/labels. t overrides the scene's still time.
// labelK scales label text (default 1.3). panels = per-tile cameras of a multi-episode still (RPO), laid out side by side.
// ============================================================================
export const STILL_ASPECT = 1.6; // total still (bands included): 3000 x 1875
export const STILL = {
  // Starfish: whole belt (field-line shells) and the Earth, seen from the Pacific side.
  starfish: {
    t: 0.7,
    pos: [-4.158, 1.269, 1.514],
    look: [0, 0, 0],
    fov: 34,
    shift: [0.001, -0.06],
    hide: ['Thor launch'], // the live Near chip stays on at every t; the print keeps the single Detonation chip
    // labels off the field lines: Thor and Detonation above the belt, Johnston Island below it (fractions of the frame width)
    // R23: the burst point sits among the field-line arcs, so no leader runs across them: Thor sits just left with a short horizontal leader,
    // Detonation rises straight up
    // beside the arcs, Johnston drops straight down, and the belt label (short text) sits right of the outer arc it names, on the same line
    off: { Thor: [-0.1, 0], Detonation: [-0.1, -0.022], Johnston: [-0.075, 0.024], Radiation: [0.105, 0], Satellite: [-0.065, -0.07] },
  },
  solwind: {
    t: 0.45,
    pos: [-3.274, 2.613, 2.013],
    look: [-0.531, 0.696, 0.64],
    fov: 19.5,
    shift: [0.11, -0.12],
    // labels spread around the objects: Solwind up-left over the ocean, ASM-135 up-right beside the missile, the F-15 out right past the limb
    // (leaders short of the 0.17 W limit)
    off: { Solwind: [-0.11, -0.05], 'ASM-135': [-0.025, -0.07], 'F-15': [0.17, -0.14] },
  },
  fengyun: { t: 0.85, pos: [0.834, 2.523, -4.242], look: [-0.083, 0.305, -0.382], fov: 33, shift: [0.029, -0.039], off: { Impact: [0.17, -0.05] } },
  'burnt-frost': { t: 0.47, pos: [-3.755, 1.807, -0.546], look: [-0.893, 0.526, 0.193], fov: 34, shift: [0.084, -0.097], labelK: 1.2 },
  dn2: { t: 0.62, pos: [7.86, 3.207, -1.046], look: [0, 0, -0.7], fov: 33, shift: [0.06, -0.028], hideShell: false, labelK: 1.3 },
  shakti: { t: 0.43, pos: [1.337, 1.766, -3.995], look: [-0.049, 0.46, -0.977], fov: 34, shift: [0.085, -0.052] },
  cosmos1408: { t: 0.8, pos: [2.313, 3.979, -0.136], look: [0.057, 0.675, -0.124], fov: 36, shift: [-0.005, -0.135], labelK: 1.2 },
  gnss: { t: 0.45, pos: [2.679, 2.994, -0.612], look: [0.586, 0.767, -0.168], fov: 40, shift: [0.009, -0.061], labelK: 1.1 },
  viasat: { t: 0.75, pos: [4.039, 0.718, -0.858], look: [0.445, 0.203, -0.103], fov: 40, shift: [0.002, -0.075] },
  // MIRACL: side view of the beam from White Sands to MSTI-3 with the Earth limb behind (t 0.3: the beam is long and the satellite is off the zenith).
  laser: {
    t: 0.3,
    pos: [2.146, 1.145, 2.307],
    look: [-0.182, 0.315, 0.668],
    fov: 14,
    shift: [0.2, 0.15],
    hide: ['Peresvet', 'Yoshkar', 'Novosibirsk', 'Teykovo'],
  },
  // SJ-21 tug: the whole GEO ring, the Earth and the docked pair with their labels grouped beside it.
  'sj21-tug': { t: 0.78, pos: [3.5, 6.5, -1.6], look: [-0.4, 0, -1.1], fov: 41, shift: [0.075, -0.11] },
  // Spaceplanes: every act at once (OTV-7's 323 x 38,838 km orbit, the X-37B flight orbits, CSSHQ's orbit and craft).
  spaceplanes: {
    t: 0.7,
    all: true,
    pos: [4.4, 3.9, 5.2],
    look: [0.4, 0.5, 0],
    fov: 38,
    shift: [0.07, 0],
    off: { GEO: [-0.1, -0.025] }, // the ring label sits left of its marker, clear of the caption band
    modelBoost: 2, // X-37B and CSSHQ read as >= 12 px icons in the print
    hide: ['X-37B (US)', 'X-37B flights', 'Object G', 'Object J'],
  },
  // RPO: three episodes side by side (each tile uses its act camera); tiles are as tall as the still body. Cosmos 2542's chip sits below its craft.
  rpo: { tileS: 1.85, labelK: 1.65, tileHK: 0.7, modelBoost: 1.6, off: { 'Cosmos 2542': [0.17, 0.185] } },
};
// Runtime override for tuning: globalThis.__stillCfg = { id: {...} }.
export const stillFor = (id) => ({ ...(STILL[id] || {}), ...(globalThis.__stillCfg?.[id] || {}) });
