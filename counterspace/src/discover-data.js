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

// One line of context per scene, shown in the story column of the 3D explainer: what the source says about why the event is on this timeline.
// Nothing here is new. Each line restates the scene's own account (its `caption` or `lede`) or the ledger note for its event, with the same figures and the
// same hedges; where the line comes from the ledger or the method file, the page of the Secure World Foundation's report is given beside it.
export const CONTEXT = {
  starfish: 'The Secure World Foundation says such tests damaged or destroyed satellites then in orbit. The 1963 Limited Test Ban Treaty followed and bans nuclear tests in space.', // account
  solwind: 'The Outer Space Treaty of 1967 bars nuclear weapons in orbit but is silent on conventional anti-satellite weapons.', // account
  laser: 'A low-power beam can dazzle a sensor, which means briefly blinding it. A high-power beam could damage it. Detailed results of this test are not public.', // the scene's account as it stood before the text cut (the two sentences on beams); account (results)
  fengyun: 'At that height, fragments stay in orbit for decades. The Secure World Foundation lists no other test with as many tracked fragments.', // account
  'burnt-frost': 'A missile-defense interceptor, modified for the task, did it. All 175 trackable pieces fell out of orbit within about 20 months.', // account; ledger: p. 01-24
  dn2: 'The Secure World Foundation lists the launch in its table of China’s anti-satellite missile tests. The US military said it went “nearly to GEO”.', // ledger note 39 and its verification entry (quotation verified); Table 3-3, p. 03-22; p. 03-20
  shakti: 'Indian officials said all the debris would fall within 45 days. The Secure World Foundation says the last tracked piece came down in June 2022, 3.2 years after the test.', // ledger: p. 04-04
  cosmos1408: 'It is the last destructive test in the Secure World Foundation’s table. In April 2022 the United States pledged not to test destructive anti-satellite missiles launched from Earth.', // ledger: Table 5-1; account
  'sj21-tug': 'The Secure World Foundation says SJ-21’s known activities included no explicit test of offensive capabilities. It notes that the technologies could be used offensively in future.', // methodology section 6: p. 03-16
  viasat: 'It came within hours of Russia’s invasion of Ukraine. In May 2022 the United States, the United Kingdom and the European Union attributed it to Russia’s military intelligence service.', // ledger: pp. 15-06, 15-07
  gnss: 'In October 2025 the International Civil Aviation Organization endorsed a finding that recurring interference from North Korea and from Russian territory is an “infraction” of the 1944 Chicago Convention. The finding carries no enforcement.', // account
  spaceplanes: 'The Secure World Foundation says the X-37B has so far approached no other object. China’s craft repeatedly approached objects that the tracking catalog lists as released from it.', // account
  rpo: 'The Secure World Foundation hedges the intent behind the first two. The third was jointly announced by the United States and the United Kingdom.', // account
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
