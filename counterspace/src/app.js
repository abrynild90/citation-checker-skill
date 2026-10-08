// ============================================================================
// app.js: shared state, constants and helpers.
// Provides: data (EVENTS, LEGAL, CAPS), layout(), tw()/wrap() text measurement, Placer (label collision), badge(), timed().
// ============================================================================
// Scene modules (see the map in scenes/README.md). tools/build_page.py bundles src/boot.js as an ES-module graph with esbuild.
import { SCENES, HERO } from './scenes/config.js';
import { buildSim } from './scenes/sim.js';
import { GLHost } from './scenes/gl-host.js';
import { installGLItems } from './scenes/gl-items.js';
import { installGLLabels } from './scenes/gl-labels.js';
import { installGLStill } from './scenes/gl-still.js';
import { renderSVG } from './scenes/svg-fallback.js';
import { PARTICLE_BUDGET } from './scenes/core.js';
import { setLand, loadEarth, earthReady, EARTH_URL } from './scenes/earth.js';

// GLHost is split over four files; the mixins add items, labels and the still export to its prototype. Runs at module load, before any scene can open.
[installGLItems, installGLLabels, installGLStill].forEach((install) => install(GLHost));

performance.mark('cs:module-start');
export const D = JSON.parse(document.getElementById('cs-data').textContent);
// Land polygons (~24 KB, delta-packed by pack_land in tools/build_page.py) sit in their own script tag and are parsed on first use (see ensureLand()).
const unpackLand = (rings) =>
  rings.map((r) => {
    const o = r.slice(0, 2);
    for (let i = 2; i < r.length; i++) o[i] = o[i - 2] + r[i];
    return o.map((n) => n / 10);
  });
let landDone = false;
export function ensureLand() {
  if (landDone) return;
  landDone = true;
  performance.mark('cs:land-parse');
  setLand(unpackLand(JSON.parse(document.getElementById('cs-land').textContent)));
}
D.events.forEach((e) => Object.assign(e, D.sources[e.s])); // rows carry a source index; the three source fields are stored once (tools/build_page.py)
export const EVENTS = D.events,
  LEGAL = D.legal,
  CAPS = D.caps,
  SCHEMA = D.schema; // SCHEMA: as-of strings and the scope rule, embedded from data/schema.json at build
export const KIN = EVENTS.filter((e) => e.domain === 'kinetic');
export const NK = EVENTS.filter((e) => e.domain === 'non_kinetic');
export const CO = EVENTS.filter((e) => e.domain === 'co_orbital');
export const byId = Object.fromEntries([...EVENTS, ...LEGAL].map((r) => [r.id, r]));
export const parse = d3.utcParse('%Y-%m-%d');
export const fmt = d3.utcFormat('%b %-d, %Y'),
  fmtY = d3.utcFormat('%Y'),
  fmtMY = d3.utcFormat('%b %Y');
// Timing: performance marks/measures named cs:* (read with __cs.perf()).
export const timed = (name, fn) => {
  const t0 = performance.now(),
    r = fn();
  performance.measure('cs:' + name, { start: t0, end: performance.now() });
  return r;
};
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DOMAIN = [parse('1957-01-01'), parse('2027-01-01')];
export const LEDGER_AS_OF = SCHEMA.page_strings.ledger_as_of_display,
  SWF_ED = SCHEMA.page_strings.swf_edition_label; // e.g. 'SWF 9th ed. (Apr. 2026)'
export const AS_OF = SWF_ED;
export const LAST_DA = KIN.filter((e) => e.type === 'destructive')
  .map((e) => e.date)
  .sort()
  .at(-1);

// Dates in full for readers (the data keeps its own short forms).
export const fmtLong = d3.utcFormat('%-d %B %Y'),
  fmtMonthYear = d3.utcFormat('%B %Y');
export const DATA_DATE = fmtLong(parse(SCHEMA.ledger_as_of));

document.getElementById('asof').innerHTML =
  `<b>Source:</b> Secure World Foundation, <i>Global Counterspace Capabilities</i>, 9th ed. (April 2026). Data last updated ${DATA_DATE}; ` +
  `debris counts as of February 2026. The Center for Strategic and International Studies (CSIS) <i>Space Threat Assessment 2025</i> was consulted ` +
  `for cross-checking; no entry cites it.`;

// The chapter list at the foot of the hero: one sentence of fact per chapter, every number computed from the data.
{
  const first = (rows, key) => fmtY(parse(rows.map((r) => r[key]).sort()[0])),
    last = (rows, key) =>
      fmtY(
        parse(
          rows
            .map((r) => r[key])
            .sort()
            .at(-1),
        ),
      );
  const words = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    word = (n) => words[n] || String(n);
  const destroyed = KIN.filter((e) => e.type === 'destructive'),
    nuclear = KIN.filter((e) => e.type === 'nuclear').length,
    allLEO = destroyed.every((e) => e.altitude_km != null && e.altitude_km <= 2000); // low Earth orbit reaches up to about 2,000 km
  const caps = Object.values(CAPS.coding),
    nStates = new Set(caps.flatMap((c) => Object.values(c).flatMap((d) => Object.keys(d))).map((s) => s.replace('USSR/Russia', 'Russia'))).size,
    pairs = new Set(D.lag_pairs.pairs.map((p) => p.event)).size,
    open = D.lag_pairs.open.length,
    nSources = new Set(EVENTS.concat(LEGAL).map((r) => r.source_url)).size;
  const nuclearText = nuclear ? (nuclear === 1 ? ', one of them a high-altitude nuclear test' : `, ${word(nuclear)} of them nuclear`) : '';
  const text = {
    law: `The legal and policy record, from treaties to expert manuals: ${LEGAL.length} items from ${first(LEGAL, 'start')} to ${last(LEGAL, 'start')}, drawn on the same years as every chart below.`,
    tests:
      `Tests of weapons meant to destroy satellites: ${KIN.length} between ${first(KIN, 'date')} and ${last(KIN, 'date')}${nuclearText}; ` +
      `${destroyed.length} destroyed a satellite${allLEO ? ', all in low Earth orbit' : ''}, the last in ${fmtMonthYear(parse(LAST_DA))}.`,
    jam: `Interfering with satellites or the signals they carry, by jamming, laser or cyber attack: ${NK.length} operations since ${first(NK, 'start')}.`,
    close:
      `Satellites flying close to other satellites: ${CO.length} close approaches, dockings, releases and spaceplane missions since ${first(CO, 'start')}, ` +
      `most of them inspection, servicing or technology demonstrations.`,
    who: `Which countries can do what: ${nStates} countries and ${word(caps.length)} kinds of capability, counted decade by decade from the ${CAPS.decades[0]} to the ${CAPS.decades.at(-1)}.`,
    lag: `How long the law took to follow a new capability: ${pairs} milestones with a later legal step, and ${open} with none in our records.`,
    scenes: `${SCENES.length} short scenes, one for each key event on the charts, each with its story and its source.`,
    src: `Where every fact comes from: ${nSources} cited sources, how current the data is, and the rules used to classify each entry.`,
  };
  document.querySelectorAll('#glance [data-ch]').forEach((li) => {
    li.querySelector('.t-text').textContent = text[li.dataset.ch] || '';
  });
}
// The phone list's heading keeps its own wording; only a count in it follows the data.
const legalSum = document.querySelector('#legalPhone summary');
if (legalSum) legalSum.textContent = legalSum.textContent.replace(/\d+/, LEGAL.length);
// ---------------------------------------------------------------- palette & helpers
const STATE_VAR = {
  'United States': '--c-us',
  Russia: '--c-ru',
  China: '--c-cn',
  India: '--c-in',
  Iran: '--c-ir',
  'North Korea': '--c-kp',
  Israel: '--c-il',
  Iraq: '--c-iq',
};
export const actorKey = (a) =>
  Object.keys(STATE_VAR).find((k) => a.startsWith(k) || (k === 'Iran' && a.startsWith('Iran'))) || (a.startsWith('Israel') ? 'Israel' : null);
export const colorOf = (name) => `var(${STATE_VAR[actorKey(name)] || '--c-multi'})`;
export const TYPE_LABEL = {
  destructive: 'Destructive intercept',
  non_destructive: 'Non-destructive test',
  flyby: 'Flyby (no intercept)',
  midcourse_intercept: 'Intercept of suborbital (missile) target',
  nuclear: 'Nuclear detonation',
  apogee_only: 'Apogee only (no target)',
};
export const ATTR_LABEL = {
  official_government: 'Official (single government)',
  multi_government: 'Multiple governments / intergovernmental body',
  researcher_osint: 'Researcher / open-source analysis',
  alleged: 'Alleged (unconfirmed)',
};
export const ACTIVITY = {
  rpo: 'Rendezvous or proximity operation',
  docking: 'Docking',
  capture_tow: 'Capture and tow',
  release: 'Release of an object',
  spaceplane_mission: 'Spaceplane mission (launch to landing)',
};
export const REGIME_CO = { LEO: 'LEO', GEO: 'GEO (belt or its vicinity)', HEO: 'Highly elliptical (HEO)', not_stated: 'Not stated by SWF' };
export const REGIME_LABEL = {
  GNSS_MEO: 'GNSS receivers (MEO signals)',
  GEO_comms: 'GEO communications',
  LEO_constellation: 'LEO constellation',
  ground_segment: 'Ground segment',
  ISR_LEO: 'LEO imaging / ISR',
};
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const fmtD = (e) => (e.date_precision === 'month' ? fmtMY(parse(e.date)) : fmt(parse(e.date))); // rows dated only to a month show month and year
export const num = (n) => (n == null ? '—' : d3.format(',')(n));
export const hasScene = (r) => r.scene_3d && SCENES.some((s) => s.id === r.scene_3d);

export let FORCE_DESKTOP = false,
  EXPORTING = false;
// EXPORTING and FORCE_DESKTOP are read by every chart module (live bindings); only the export code changes them, through this setter.
export function setExporting(exporting, forceDesktop) {
  EXPORTING = exporting;
  FORCE_DESKTOP = forceDesktop;
}
// The time window each zoomed chart shows (null when it shows the full span); the sticky law strip follows the chart under it so the years line up.
export const chartWindow = { chartC: null, chartR: null };
export const PHONE_MAX = 640; // px: below this width the page uses its phone layouts
export const isPhoneNow = () => !FORCE_DESKTOP && innerWidth < PHONE_MAX;
export function layout(el, domain = DOMAIN, minW = 300) {
  const W = Math.max(minW, el.clientWidth),
    ph = isPhoneNow();
  const M = { l: ph ? 40 : 64, r: ph ? 12 : 68 };
  const x = d3
    .scaleUtc()
    .domain(domain)
    .range([M.l, W - M.r]);
  return { W, M, x };
}
export function xAxis(g, x, y, every) {
  const ax = d3
    .axisBottom(x)
    .ticks(d3.utcYear.every(every || (isPhoneNow() ? 20 : 10)))
    .tickFormat(fmtY)
    .tickSizeOuter(0);
  g.append('g').attr('class', 'axis xaxis').attr('transform', `translate(0,${y})`).call(ax);
}
// ---- shared text measurement + label placement (greedy, collision-aware)
const mctx = document.createElement('canvas').getContext('2d');
let sansCache = null;
export function tw(text, size, weight = 400) {
  sansCache ??= getComputedStyle(document.documentElement).getPropertyValue('--sans').trim() || 'sans-serif';
  mctx.font = `${weight} ${size}px ${sansCache}`;
  return mctx.measureText(text).width * 1.04 + 1;
}
export function wrap(text, maxW, size, weight) {
  const words = text.split(' '),
    lines = [];
  let cur = '';
  words.forEach((w) => {
    const t = cur ? cur + ' ' + w : w;
    if (cur && tw(t, size, weight) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}
// Rectangles of already-placed things. free() tests a candidate rectangle against them.
export class Placer {
  constructor(b) {
    this.b = b;
    this.r = [];
  }
  textRect(x, y, anchor, w, size) {
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    return [x0, y - size * 0.95, x0 + w, y + size * 0.25];
  }
  free(q, ignore = [], pad = 1.5) {
    const b = this.b;
    if (q[0] < b.x0 || q[2] > b.x1 || q[1] < b.y0 || q[3] > b.y1) return false;
    return this.r.every((o) => ignore.includes(o[4]) || q[2] + pad <= o[0] || q[0] - pad >= o[2] || q[3] + pad <= o[1] || q[1] - pad >= o[3]);
  }
  add(q, kind = 'T') {
    this.r.push([q[0], q[1], q[2], q[3], kind]);
    return q;
  }
}
export function badge(g, x, y) {
  // 3D badge: an isometric cube (shape, not color). Omitted from static exports: the cube means nothing in a figure and has no key entry there.
  if (EXPORTING) return;
  const b = g.append('g').attr('class', 'badge3d').attr('transform', `translate(${x},${y}) scale(${typeof innerWidth !== 'undefined' && innerWidth >= 1024 && !EXPORTING ? 1.0 : 0.9})`).attr('aria-hidden', 'true');
  b.append('path').attr('class', 'top').attr('d', 'M0,-6 L5.2,-3 L0,0 L-5.2,-3Z');
  b.append('path').attr('d', 'M-5.2,-3 L0,0 L0,6 L-5.2,3Z');
  b.append('path').attr('d', 'M5.2,-3 L0,0 L0,6 L5.2,3Z');
}
export const star = (r) => {
  const p = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2,
      rr = i % 2 ? r * 0.45 : r;
    p.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return 'M' + p.join('L') + 'Z';
};
