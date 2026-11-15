// ============================================================================
// discover-data.js: the small pieces of wording and logic behind "Surprise me", the scene gallery and the "Where to go next" row.
// Pure data and functions, no page access. Every line in FACTS restates something the scene's own account already says (same figures, same source).
// ============================================================================
export const FACTS = {
  starfish: 'The blast formed an artificial radiation belt around Earth.',
  solwind: 'The missile was fired from a fighter jet in a steep climb.',
  fengyun: 'The Secure World Foundation lists no test with more tracked fragments: 3,532.',
  'burnt-frost': 'A missile-defense interceptor did it. The debris fell out of orbit in about 20 months.',
  dn2: 'China said 10,000 km. An analysis cited by the Secure World Foundation says 30,000 km or more.',
  shakti: 'The Secure World Foundation counts 130 tracked fragments, none still in orbit.',
  cosmos1408: 'The debris reached the International Space Station’s orbit. Its crew sheltered.',
  gnss: 'No satellite is touched. Jammers swamp the weak signals at the receiver.',
  viasat: 'It came within hours of Russia’s invasion of Ukraine. The satellite kept working.',
  laser: 'The target, MSTI-3, was a retired experimental satellite. Detailed results are not public.',
  'sj21-tug': 'SJ-21 pulled a defunct navigation satellite above the geostationary belt.',
  rpo: 'A close approach is not an attack.',
  spaceplanes: 'The X-37B has flown eight missions. Six lasted 224 to 908 days.',
};

// The scene time from which each "Did you know" line matches what the animation shows (wide window); the others hold from the first frame.
export const FACT_FROM = { starfish: 0.1, solwind: 0.24, fengyun: 0.3, 'burnt-frost': 0.4, shakti: 0.38, cosmos1408: 0.3, 'sj21-tug': 0.5 };

// Short names for the "Where to go next" row.
export const SHORT = {
  starfish: 'Starfish Prime',
  solwind: 'Solwind',
  fengyun: 'Fengyun-1C',
  'burnt-frost': 'Burnt Frost',
  dn2: 'DN-2 rocket',
  shakti: 'Mission Shakti',
  cosmos1408: 'Cosmos 1408',
  gnss: 'Baltic jamming',
  viasat: 'Viasat cyberattack',
  laser: 'MIRACL laser',
  'sj21-tug': 'Dead-satellite tow',
  rpo: 'Close approaches',
  spaceplanes: 'Reusable craft',
};

// Which kind of event each scene shows, and what a neighbour of the same kind is called.
export const KIND = {
  solwind: 'test',
  fengyun: 'test',
  'burnt-frost': 'test',
  shakti: 'test',
  cosmos1408: 'test',
  starfish: 'high',
  dn2: 'high',
  laser: 'attack',
  gnss: 'attack',
  viasat: 'attack',
  rpo: 'near',
  'sj21-tug': 'near',
  spaceplanes: 'near',
};
const TAG = {
  test: 'Another test that destroyed a satellite',
  high: 'Another high-altitude test or launch',
  attack: 'Another attack that leaves satellites in orbit',
  near: 'Another close approach',
};

// Up to three scenes to visit next: the next two of the same kind (by date, wrapping round), then the nearest by date from a different kind.
// `order` is the list of scene configs sorted by date. Returns [{ id, tag }].
export function nextScenes(cur, order) {
  const day = (s) => Date.parse(s.date),
    same = order.filter((s) => KIND[s.id] === KIND[cur.id]),
    at = same.indexOf(cur),
    out = [];
  for (let k = 1; k < same.length && out.length < 2; k++) out.push({ id: same[(at + k) % same.length].id, tag: TAG[KIND[cur.id]] });
  const others = order.filter((s) => KIND[s.id] !== KIND[cur.id]).sort((a, b) => Math.abs(day(a) - day(cur)) - Math.abs(day(b) - day(cur)));
  for (const s of others) {
    if (out.length >= 3) break;
    out.push({ id: s.id, tag: 'A different kind of event, nearest in date' });
  }
  return out;
}

// A random scene that is not the one just seen.
let lastPick = null;
export function pickSurprise(order) {
  const pool = order.filter((s) => s.id !== lastPick);
  const s = pool[Math.floor(Math.random() * pool.length)];
  lastPick = s.id;
  return s;
}
