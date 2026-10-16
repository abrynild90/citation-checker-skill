// Design-pattern gate: runs the Impeccable detector (61 rules for AI-style design tells, readability and layout problems) on a built page.
//   node tools/impeccable_check.mjs                 FILE=index.html  PORT=9330  MODE=both|file|live  VP=1440x900  SHOW=3  JSON=out.json
// "file" scans the HTML and CSS source; "live" renders the page in Chromium (so the real measured text, line lengths and contrast are checked).
// Needs the skill installed once with `npx impeccable install --user` (the engine lives in ~/.claude/skills/impeccable/scripts). Exit code 2 when any finding remains.
import { spawn } from 'child_process';
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

// Async spawn, not spawnSync: in live mode the engine fetches the page from the server in this process, and a blocking spawn starves that server
// (the engine then times out, prints "[]", and the gate used to read that as "no findings"). A non-JSON or failed run is now an error (exit 1).
const run = (target, extra = []) =>
  new Promise((resolve) => {
    const args = ['detect', ...(process.env.ADVISORY ? [] : ['--no-advisory']), '--json', ...extra, target];
    const p = spawn(ENGINE, args, { env: { ...process.env, IMPECCABLE_BROWSER: wrapper } });
    let out = '',
      err = '';
    const timer = setTimeout(() => p.kill('SIGKILL'), 240000);
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out || '[]'));
      } catch {
        console.error('detector output was not JSON:', (out || err).slice(0, 400));
        process.exit(1);
      }
      if (!out.trim() && code === 1) {
        console.error('detector failed with no output (exit 1):', err.slice(0, 400));
        process.exit(1);
      }
    });
  });

let all = [];
if (MODE === 'file' || MODE === 'both') all = all.concat((await run(file)).map((f) => ({ ...f, via: 'file' })));
if (MODE === 'live' || MODE === 'both') {
  const srv = http
    .createServer((q, r) => {
      r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      fs.createReadStream(file).pipe(r);
    })
    .listen(PORT);
  const [w, h] = (process.env.VP || '1440x900').split('x');
  all = all.concat((await run(`http://127.0.0.1:${PORT}/`, ['--viewport', `${w}x${h}`])).map((f) => ({ ...f, via: 'live' })));
  srv.close();
}
// Findings that were checked element by element in the rendered page and are not defects. Each has the reason; anything not listed here fails the gate.
// Set ALLOW=0 to see them all.
const VERIFIED = [
  [/^text-overflow$/, /^(dd|p) overflows its box by/, 'inside the closed legend <details> (stale 341 px layout; fits when opened) and the 1 px visually-hidden live region #heroAlt'],
  [/^clipped-overflow-container$/, /section\.chart\.xpanel/, 'inactive chart tab panels (collapsed, visibility hidden) clipping their hidden download menu'],
  [/^content-hidden-at-rest$/, /\d+% of page text/, 'the inactive chart tabs and the closed 3D viewer: reachable by tab and scene interaction'],
  [/^cramped-padding$/, /pat-big/, 'static scan reads an earlier rule; the later cascade (explore.css, reference.css) sets padding 0, border 0, no fill: nothing to be flush against'],
];
const known = (f) => process.env.ALLOW !== '0' && VERIFIED.some(([a, sn]) => a.test(f.antipattern) && sn.test(f.snippet || ''));
const ignored = all.filter(known);
all = all.filter((f) => !known(f));
if (ignored.length) console.log(`(${ignored.length} finding(s) skipped as verified false positives: ${[...new Set(ignored.map((f) => f.antipattern))].join(', ')})`);
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
