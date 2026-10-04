// Design-pattern gate: runs the Impeccable detector (61 rules for AI-style design tells, readability and layout problems) on a built page.
//   node tools/impeccable_check.mjs                 FILE=index.html  PORT=9330  MODE=both|file|live  VP=1440x900  SHOW=3  JSON=out.json
// "file" scans the HTML and CSS source; "live" renders the page in Chromium (so the real measured text, line lengths and contrast are checked).
// Needs the skill installed once with `npx impeccable install --user` (the engine lives in ~/.claude/skills/impeccable/scripts). Exit code 2 when any finding remains.
import { spawnSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';

const file = path.resolve(process.env.FILE || 'index.html');
const PORT = +(process.env.PORT || 9330);
const MODE = process.env.MODE || 'both';
const SHOW = +(process.env.SHOW || 3);
const ENGINE = process.env.IMPECCABLE_BIN || path.join(os.homedir(), '.claude/skills/impeccable/scripts/impeccable');
if (!fs.existsSync(ENGINE)) {
  console.error(`Impeccable engine not found at ${ENGINE}. Install it once: npx impeccable install -y --providers=claude --user --no-hooks`);
  process.exit(1);
}
const CHROME =
  process.env.CHROME ||
  [
    ...fs
      .readdirSync('/opt/pw-browsers')
      .filter((d) => d.startsWith('chromium-'))
      .map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`),
  ][0];
const wrapper = path.join(os.tmpdir(), 'impeccable-chrome.sh');
fs.writeFileSync(wrapper, `#!/bin/sh\nexec ${CHROME} --no-sandbox --disable-gpu --disable-dev-shm-usage --ignore-certificate-errors "$@"\n`, { mode: 0o755 });

const run = (target, extra = []) => {
  const r = spawnSync(ENGINE, ['detect', '--no-advisory', '--json', ...extra, target], {
    encoding: 'utf8',
    env: { ...process.env, IMPECCABLE_BROWSER: wrapper },
    maxBuffer: 64 * 1024 * 1024,
    timeout: 240000,
  });
  try {
    return JSON.parse(r.stdout || '[]');
  } catch {
    console.error('detector output was not JSON:', (r.stdout || r.stderr || '').slice(0, 400));
    return [];
  }
};

let all = [];
if (MODE === 'file' || MODE === 'both') all = all.concat(run(file).map((f) => ({ ...f, via: 'file' })));
if (MODE === 'live' || MODE === 'both') {
  const srv = http
    .createServer((q, r) => {
      r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      fs.createReadStream(file).pipe(r);
    })
    .listen(PORT);
  const [w, h] = (process.env.VP || '1440x900').split('x');
  all = all.concat(run(`http://127.0.0.1:${PORT}/`, ['--viewport', `${w}x${h}`]).map((f) => ({ ...f, via: 'live' })));
  srv.close();
}
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(all, null, 1));
const by = new Map();
for (const f of all) {
  const k = f.antipattern;
  if (!by.has(k)) by.set(k, []);
  by.get(k).push(f);
}
for (const [k, list] of [...by].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${String(list.length).padStart(3)}  ${k}  (${list[0].name})`);
  for (const f of list.slice(0, SHOW)) console.log(`       ${f.via}: ${f.snippet}`);
}
console.log(all.length ? `${all.length} finding(s)` : 'Impeccable detector: no findings');
process.exit(all.length ? 2 : 0);
