// ============================================================================
// discover-data.js: the small pieces of wording and logic behind "Surprise me", the scene gallery and the "Where to go next" row.
// Pure data and functions, no page access. Every line in FACTS restates something the scene's own account already says (same figures, same source).
// ============================================================================
export const FACTS = {
  starfish: 'Electrons from the blast were trapped by Earth’s magnetic field and formed an artificial radiation belt around the planet.',
  solwind: 'A US fighter jet launched the missile from a steep supersonic climb, and its homing vehicle destroyed the satellite by collision.',
  fengyun: 'The Secure World Foundation lists no other test that produced as many tracked fragments: 3,532 cataloged, 2,351 still in orbit as of February 2026.',
  'burnt-frost': 'The missile was a missile-defense interceptor, built to shoot down other missiles, and the 175 trackable pieces took about 20 months to fall out of orbit.',
  dn2: 'China said the rocket reached 10,000 km. An analysis cited by the Secure World Foundation puts its highest point at 30,000 km or more.',
  shakti: 'Indian officials said the debris would fall back within 45 days. The Secure World Foundation counts 130 tracked fragments, none still in orbit.',
  cosmos1408: 'The debris cloud spread across heights that include the orbit of the International Space Station, and its crew sheltered in their docked spacecraft.',
  gnss: 'The jammers do not attack any satellite. They swamp the weak signals at the receiver, so aircraft that cross the zone lose their position fix.',
  viasat: 'The attack came within hours of Russia’s invasion of Ukraine. The satellite kept working; the damage was to modems, through the ground network.',
  laser: 'The target, MSTI-3, was a retired Air Force experimental satellite, and detailed results of the test are not public.',
  'sj21-tug': 'SJ-21 pulled a defunct navigation satellite, Compass G2, above the geostationary belt, then came back down close to it.',
  rpo: 'A close approach is not an attack: in 2025 two US satellites were positioned flanking China’s SJ-21 and SJ-25 in geostationary orbit.',
  spaceplanes: 'The US X-37B has flown eight missions, and six of them lasted between 224 and 908 days.',
};

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
  'sj21-tug': 'SJ-21 tow',
  rpo: 'Close approaches',
  spaceplanes: 'Spaceplanes',
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
