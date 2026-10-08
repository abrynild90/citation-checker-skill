// Duplicate-id check for a built page: node tools/check_ids.mjs [index.html]
// Reads the static markup (template plus the scene overlay) and exits 1 if any id appears twice. smoke.mjs repeats the same check on the live page,
// where ids made by script are included. A repeated id sends getElementById to the wrong element (the year slider's Play once took the 3D scene's).
import fs from 'fs';
import path from 'path';

export function duplicateIds(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const seen = new Map();
  for (const m of body.matchAll(/<[a-zA-Z][^>]*?\sid="([^"]+)"/g)) seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id} (x${n})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = path.resolve(process.argv[2] || 'index.html');
  const dup = duplicateIds(fs.readFileSync(file, 'utf8'));
  console.log(dup.length ? `FAIL duplicate ids in the built page: ${dup.join(', ')}` : 'check_ids OK: no duplicate ids');
  process.exit(dup.length ? 1 : 0);
}
