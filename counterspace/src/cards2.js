// ============================================================================
// cards2.js: hover and focus cards for the jamming and cyber chart, the close-approach chart and the capability chart, plus the plain-word labels those
// charts and their data tables share (moved out of ui.js so one person can own them).
// ui.js re-exports nkCard, coCard and coWhen, so other modules keep importing them from './ui.js'.
// ============================================================================
import { esc, fmt, fmtMY, fmtY, hasScene, parse } from './app.js';

// ---------------------------------------------------------------- words a reader understands (never the stored codes)
export const CATEGORY_LABEL = {
  ew_uplink: 'Jamming the signal going up to a satellite',
  ew_downlink: 'Jamming the signal coming down from a satellite',
  gnss_jamming: 'Jamming satellite navigation (GNSS)',
  gnss_spoofing: 'Spoofing satellite navigation (GNSS)',
  directed_energy: 'Laser',
  cyber: 'Cyber attack',
};
export const TARGET_LABEL = {
  GNSS_MEO: 'Satellite navigation receivers (GNSS, such as GPS)',
  GEO_comms: 'Communications satellites in geostationary orbit',
  LEO_constellation: 'A constellation of satellites in low Earth orbit',
  ground_segment: 'Ground equipment and networks',
  ISR_LEO: 'Imaging satellites in low Earth orbit',
};
export const ATTRIBUTION_LABEL = {
  official_government: 'One government, officially',
  multi_government: 'Several governments or an international body',
  researcher_osint: 'Researchers and open-source analysts',
  alleged: 'Alleged, not confirmed',
};
export const SURE_WORD = { high: 'High', medium: 'Medium', low: 'Low' };
export const SURE_LABEL = {
  high: 'High',
  medium: 'Medium (the source hedges, or a detail is missing or disputed)',
  low: 'Low (uncertain, or rests on a single or anonymous account)',
};
export const ACTIVITY_LABEL = {
  rpo: 'Close approach (rendezvous or proximity operation)',
  docking: 'Docking',
  capture_tow: 'Capture and tow',
  release: 'Release of an object',
  spaceplane_mission: 'Spaceplane mission (launch to landing)',
};
export const ORBIT_LABEL = {
  LEO: 'Low Earth orbit',
  GEO: 'Geostationary orbit, or close to it',
  HEO: 'Highly elliptical orbit',
  not_stated: 'Not stated by SWF',
};

// ---------------------------------------------------------------- data text in plain words
// The data files keep the builder's working notes. Where a note uses the project's own vocabulary or a stored code, this is the same note in plain
// words (same facts and cautions). Everything else passes through plain(), which only swaps a few acronyms and the word "row".
const NOTE_PLAIN = {
  'us-2003-xss10': 'Orbit recorded as low Earth orbit (LEO), from the table’s 800 x 800 km orbit (SWF’s limit for low Earth orbit is 2,000 km).',
  'iq-2003-gps': 'Not covered in SWF 2026 (Iraq is not one of SWF’s 13 countries). Left out of the capability chart.',
  'ir-2009-eutelsat':
    'Recorded as attributed by several governments or an international body, because an intergovernmental body (the International Telecommunication Union, ITU) located the source in Iranian territory; ITU did not find the Iranian state responsible. SWF dates only the 2010 ITU action and Eutelsat’s Oct. 2022 report of renewed jamming from Iran; the 2009 start follows Eutelsat’s appeals from May 2009 (Eutelsat/HRW) and the 2012 end is the last year of the first documented phase, so the span understates the 2022 episode.',
  'us-2009-pan':
    'The table dates the entry 2009-2013 and lists ‘Yahsat 1B, others unknown, PAN’; our records start at PAN’s launch date (from the text) and take Yahsat 1B as one target. SWF calls the signals-intelligence purpose ‘presumed’.',
  'us-2010-otv1':
    'SWF p. 01-09: to date the X-37B has not approached or rendezvoused with any other space object. Orbit recorded as LEO, from SWF’s statement that earlier flights ‘stayed well within LEO’ (p. 01-06).',
  'us-2014-angels':
    'The table’s orbit column says ‘GSO’; the text places the close approach in the disposal region several hundred km above GSO. Recorded as GEO (the belt and its immediate vicinity).',
  'us-2014-clio': 'SWF’s table puts the word ‘multiple’ in quotes.',
  'ru-2016-syria': 'SWF p. 02-28: ‘The spoofing began in 2016, peaked in 2017’. Our records use 2016, with medium confidence.',
  'ru-2018-peresvet':
    'Named in Putin’s 1 March 2018 speech (SWF p. 02-36); SWF describes it as appearing designed to protect mobile ICBMs from being imaged. Self-declared by the Russian government; no public evidence of use against a satellite. The attribution level “one government, officially” here records the Russian government’s own announcement of a system (a self-declaration); it is kept in the laser group as a capability announcement, not as an operation against a satellite.',
  'ru-2018-trident':
    'SWF does not name the exercise or give dates: it says (Nov. 2018) media reported jamming in Norway and Finland during a major NATO exercise, and that Norway’s government claimed in March 2019 it had proof of Russian interference. Dates 25 Oct - 7 Nov 2018 are the Trident Juncture exercise window (NATO; Norway’s ministry put the jamming at 16 Oct - 7 Nov). Recorded as “one government, officially” on Norway’s claim; Finland only expressed concern (external reporting).',
  'ru-2019-cosmos2542-release': 'Taken from the text; Table 2-3 folds the release into the ‘Dec. 2019 - Mar. 2020’ line.',
  'us-2022-usa270-sy12':
    'Listed in both Table 1-3 (US) and Table 3-2 (China); one entry, with the US satellite as the approaching craft. The text dates the approach ‘late January 2022’.',
  'ru-2022-starlink': 'SWF notes no independent validation of the type or magnitude of the jamming; recorded as “alleged”.',
  'mideast-2023-gnss':
    'Attribution rests on the Israel Defense Forces’ own public statement (SWF p. 10-02), so it is recorded as “one government, officially” for Israel and for jamming only. SWF also reports regional jamming and spoofing after the 7 Oct. 2023 Hamas attack and says it is hard to tell from open sources whether Israel, Hamas or other actors conduct the electronic warfare; no other actor is attributed, so no second entry is recorded (left out, and not recorded as “alleged”: SWF makes no allegation against a named actor). The spoofing reports are therefore not attributed to anyone here. SWF p. 10-01 also reports interference in spring 2023 (20% of regional aircraft in April 2023), before this entry’s start; the start is set to 7 Oct. 2023, the attack SWF names as the trigger of the escalation. Lebanon’s claim is a government claim about Israel, not proof.',
  'ru-2023-baltic':
    'SWF: interference ‘picked up in late 2023 and early 2024’; start set to Dec 2023. The attribution to several governments or an international body rests on the October 2025 resolution of the International Civil Aviation Organization (ICAO) and the findings of the ITU Radio Regulations Board (Nov 2025). Terrestrial jamming of receivers, not attacks on satellites.',
  'cn-2024-sj23-akm':
    'The table dates the entry Jan.-Feb. 2024. SWF’s text puts the launch on 8 Jan. 2023, the apparent release around 15 Jan. 2023 and the within-10-km analysis in Feb. 2024. The entry uses the table’s dates.',
  'ru-2024-eu-sats':
    'SWF p. 02-32: several European countries complained in spring 2024; the ITU Radio Regulations Board (July 2024) said the interference ‘seemed to originate’ from earth stations near Moscow, Kaliningrad and Pavlovka. It described origin locations but made no state-responsibility finding; recorded as attributed by several governments or an international body because the ITU, an intergovernmental body, located the source.',
  'cn-2024-sy24c-sj6':
    'Non-contiguous: March-April, September and December 2024. A US Space Force fact sheet quoted by SWF describes the March-April activity; the entry is not a finding on intent.',
  'ru-2025-cosmos2558-object-c': 'Low confidence because the table puts a ‘?’ at the end date. Table orbit: about 450 km.',
  'us-2025-gssap-flank-sj21-sj25':
    'Taken from the text, not a Table 1-3 line. The date is that of the COMSPOC observation cited in SWF note 116 (9 June 2025). SWF’s own word is ‘most likely’ for the monitoring purpose.',
};
export const plain = (t) =>
  String(t ?? '')
    .replace(/\bRPOs\b/g, 'close approaches')
    .replace(/\bRPO\b/g, 'close approach')
    .replace(/\(R\/B\)/g, '(rocket body)')
    .replace(/\bthe row\b/g, 'the entry');
export const noteOf = (e) => (e.notes ? plain(NOTE_PLAIN[e.id] ?? e.notes) : '');

// ---------------------------------------------------------------- cards
const cube = '<svg class="ico" aria-hidden="true"><use href="#i-cube"/></svg>';
const sceneHint = `<div class="hint">${cube}Open the 3D explainer</div>`;
const srcLine = (r) => `<div class="src">Source: ${esc(r.source)}, ${esc(r.pin)}</div>`;
const dl = (rows) => `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;

export function nkCard(e) {
  const span = e.end === e.start ? fmt(parse(e.start)) : `${fmtMY(parse(e.start))} – ${e.end ? fmtMY(parse(e.end)) : 'ongoing'}`;
  const note = noteOf(e);
  return (
    `<p class="card-title">${esc(e.target_system)}</p>` +
    dl([
      ['When', span],
      ['Actor', esc(e.actor)],
      ['Type', CATEGORY_LABEL[e.category]],
      ['Attribution', ATTRIBUTION_LABEL[e.attribution]],
      ['Target', TARGET_LABEL[e.target_regime]],
      ['Setting', e.operational_use ? 'In a conflict' : 'A test, a demonstration or peacetime'],
      ['How sure we are', SURE_LABEL[e.confidence]],
    ]) +
    `<div>${esc(plain(e.effect))}</div>${note ? `<div class="note">${esc(note)}</div>` : ''}${srcLine(e)}${hasScene(e) ? sceneHint : ''}`
  );
}
export const coWhen = (e) => {
  const f = e.date_precision === 'month' ? fmtMY : e.date_precision === 'year' ? fmtY : fmt,
    a = f(parse(e.start)),
    b = e.end ? f(parse(e.end)) : null;
  return b === a || e.end === e.start ? a : `${a} – ${b || 'ongoing (as of SWF’s April 2026 edition)'}`;
};
// Compact form (desktop hover on the dense close-approach chart): the key facts only, so the card stays small and hides few neighbouring points.
// Click or Enter shows the full card (description, notes, source). Phones dock the full card, which scrolls inside itself.
export function coCard(e, compact = false) {
  const hint = hasScene(e) ? sceneHint : compact ? '<div class="hint">Select the point, or press Enter, for the full entry.</div>' : '';
  const rows = [
    ['When', coWhen(e)],
    compact ? null : ['Actor', esc(e.actor)],
    ['Activity', ACTIVITY_LABEL[e.activity]],
    e.target ? ['Other object', esc(plain(e.target))] : null,
    compact ? null : ['Orbit', ORBIT_LABEL[e.orbit_regime]],
    ['How sure we are', compact ? SURE_WORD[e.confidence] : SURE_LABEL[e.confidence]],
  ].filter(Boolean);
  const head = `<p class="card-title">${esc(plain(e.system))}</p>${dl(rows)}`;
  if (compact) return head + hint;
  const note = noteOf(e);
  return (
    `${head}<div>${esc(plain(e.description))}</div>${note ? `<div class="note">${esc(note)}</div>` : ''}${srcLine(e)}` +
    `<div class="hint">A proximity operation is not an attack, and SWF’s wording on intent is hedged.</div>${hasScene(e) ? sceneHint : ''}`
  );
}

// Capability chart: one decade. info = { title, note, lines: [{ color, name, text }], total }.
export function decadeCard(info) {
  const dot = (c) => `<i style="display:inline-block;width:9px;height:9px;margin-right:7px;border-radius:50%;background:${c}"></i>`;
  const block = (l) => `<div style="margin-top:7px"><div style="color:var(--faint)">${dot(l.color)}${esc(l.name)}</div><div>${esc(l.text)}</div></div>`;
  return (
    `<p class="card-title">${esc(info.title)}</p>` +
    `<div class="note">${esc(info.note)}</div>` +
    info.lines.map(block).join('') +
    `<div class="src">${esc(info.total)} The data table lists the states.</div>`
  );
}
