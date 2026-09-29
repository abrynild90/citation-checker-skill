// ============================================================================
// method.js: sources and methodology section.
// Provides: drawMethod().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { AS_OF, EVENTS, LAST_DA, LEDGER_AS_OF, LEGAL, SCHEMA, esc, fmt, parse } from './app.js';
import { PARTICLE_BUDGET } from './scenes/core.js';
export function drawMethod() {
  // one entry per distinct source URL: a full citation (legal rows carry their own; event sources are expanded below) plus the pin(s)
  // Raw URLs never appear as text: each becomes a short domain label in brackets (the link itself carries the full address).
  const host = (u) => {
    try {
      return new URL(u.replace(/&amp;/g, '&')).hostname.replace(/^www\./, '');
    } catch {
      return 'link';
    }
  };
  const short = (t) => esc(t).replace(/,?\s*(https?:\/\/[^\s)\];,]*[^\s)\];,.])/g, (m, u) => ` [${host(u)}]`);
  const bare = short;
  const groups = new Map();
  EVENTS.concat(LEGAL).forEach((r) => {
    if (!groups.has(r.source_url)) groups.set(r.source_url, []);
    groups.get(r.source_url).push(r);
  });
  const cites = [...groups.values()].map((rs) => {
    const r = rs[0],
      url = esc(r.source_url);
    if (!r.source_full && r.citation) return `<li><a href="${url}" target="_blank" rel="noopener">${short(r.citation)}</a></li>`;
    const head = bare(r.source_full || r.source);
    const pins =
      rs.length > 1
        ? `; ${rs.length} ledger rows, each pinned to its table or page (see the card, the data table or <code>ledger.md</code>)`
        : `, ${esc(r.pin)}`;
    return `<li><a href="${url}" target="_blank" rel="noopener">${head}</a>${pins}.</li>`;
  });
  // The ledger's own rule texts start with their own label ("Scope rule: ...", "Co-orbital rule: ..."); the label is added once, in bold, here.
  const unlabel = (t) => t.replace(/^[A-Za-z-]+ rule:\s*/, '');
  // The ledger's two long rule texts are split into short bullets (coverage, disclosed exceptions, how to read a row); each falls back to the whole text.
  const li = (h, t) => `<li>${h ? `<b>${h}</b> ` : ''}${esc(t)}</li>`;
  const scopeRule = (() => {
    const t = unlabel(SCHEMA.scope_rule),
      m = t.match(
        /^(.*?),\s*including\s+(.*?)\.\s*Exclusions, all disclosed:\s*(.*?)\s*\((.*?)\),\s*and\s+(the Table 16-3 line.*?)\s*\((.*?)\)\.\s*(Starfish.*)$/s,
      );
    if (!m) return `<p>${esc(t)}</p>`;
    return (
      `<ul class="sub">${li('Covered:', m[1] + '.')}${li('Also included:', m[2] + '.')}` +
      `${li('Excluded, co-orbital tests:', m[4] + '.')}${li('Excluded, a date variant:', m[5] + ' (' + m[6] + ').')}${li('Added:', m[7])}</ul>`
    );
  })();
  const covered = (t) => {
    const [a, b] = t.split(/,\s*and\s+(?=every flight)/);
    const mm = b?.match(/^(.*?),\s*is a row(.*)$/s);
    return mm ? li('Covered:', a + '.') + li('Also covered:', mm[1] + '.') + li('Each is a row', mm[2]) : li('Covered:', t);
  };
  const coRule = (() => {
    const t = unlabel(SCHEMA.co_scope_rule),
      m = t.match(
        /^(.*?)\s*Two exceptions, both disclosed:\s*\(a\)\s*(.*?);\s*\(b\)\s*(.*?)\s*\((.*?)\),\s*(the text-dated step.*?\.)\s+(RPO rows record.*)$/s,
      );
    if (!m) return `<p>${esc(t)}</p>`;
    return (
      `<ul class="sub">${covered(m[1])}${li('Exception (a):', m[2] + '.')}${li('Exception (b):', m[3] + '.')}` +
      `${li('Cases for (b):', m[4] + '.')}${li('Then:', m[5])}${li('Reading a row:', m[6])}</ul>`
    );
  })();
  const rule = (title, body, open) =>
    `<details class="rule"${open ? ' open' : ''}><summary>${title}</summary><div class="rb">${body}</div></details>`;
  document.getElementById('methodBody').innerHTML = `
  <h3>Editions and “as of” dates</h3>
  <ul><li><b>Primary:</b> Secure World Foundation, <i>Global Counterspace Capabilities: An Open Source Assessment</i> (Victoria Samson &amp;
Kathleen Brett eds., 9th ed., Apr. 2026). 13 countries, five categories. The 13-country count is a 2026 figure, not a historical constant.
Debris counts as of Feb. 2026 (SWF Table 5-1).</li>
  <li><b>Consulted, not cited:</b> CSIS Aerospace Security Project, <i>Space Threat Assessment 2025</i>, was consulted for cross-checking
only; no row, pin or citation depends on it. The 2026 edition was not yet published as of ${LEDGER_AS_OF}.</li>
  <li><b>Ledger as of:</b> ${LEDGER_AS_OF} (schema ${esc(SCHEMA.schema_version)}).</li>
  <li><b>Framing claim:</b> the intro’s statement that only non-destructive capabilities are in active use is SWF’s finding, not this
page’s: SWF 2026, Executive Summary, p. xxiii (PDF p. 21): “only non-destructive capabilities are actively being used against satellites in
current military operations.”</li>
  <li><b>Baseline check:</b> no destructive DA-ASAT test appears after ${fmt(parse(LAST_DA))} in SWF 2026 (Table 5-1 ends with Cosmos 1408).</li></ul>
  <h3 id="codingRules" tabindex="-1">Coding rules</h3>
  <p class="note">One short section per chart. Open a section to read its rules.</p>
  ${rule('Scope: kinetic tests (Chart A)', scopeRule, true)}
  ${rule(
    'Chart A: altitude and dates',
    `<ul class="sub"><li>Altitude is the intercept altitude from SWF Table 5-1 for destructive tests, and the apogee from Tables
        1-4, 2-4 and 3-3 for other tests.</li>
    <li>Tests with no reported altitude sit in a separate strip, off the scale.</li>
    <li>Where SWF gives only a month, the row is dated to that month and shown as month and year.</li>
    <li>Soviet co-orbital (IS) tests are left out of the scatter and counted only in Chart B.</li>
    <li>Starfish Prime is the only nuclear test shown.</li>
    <li><b>Debris:</b> bubble area is proportional to <i>cataloged</i> fragments. Fragments still in orbit are a different
        quantity, so they appear only in cards and tables.</li></ul>`,
  )}
  ${rule(
    'Chart C: non-kinetic events',
    `<ul class="sub"><li>An event is recorded only when a named source documents it.</li>
    <li>Attribution is coded exactly as the source states it and is never upgraded.</li>
    <li>Sustained campaigns are spans, not incident counts.</li>
    <li>Ground-based GNSS jamming affects receivers within range of the jammer, not the satellites. It is tagged
        <code>GNSS_MEO</code> because the targeted signals come from MEO, and the scene and cards say this expressly.</li></ul>`,
  )}
  ${rule('Co-orbital strip (RPO)', coRule)}
  ${rule(
    'Chart B: states by decade',
    `<ul class="sub"><li>The 2020s follow SWF 2026 chapter sections. Earlier decades are the builder’s reconstruction from SWF
        test tables, country chapters and fact sheets, labeled “reconstructed.”</li>
    <li>A state counts as “demonstrated” once it has tested or used the capability, and stays counted in later decades.
        “Developing” covers programs and latent capability.</li>
    <li>Range marks give a conservative lower bound (demonstrated only) and an upper bound (demonstrated plus developing) for each decade.</li>
    <li>In the 2020s the state count is SWF-assessed, but the demonstrated/developing split is the builder’s coding of SWF text.</li>
    <li>Category mode stacks state-capability pairs. Kinetic vs. non-kinetic mode counts unique states per group.</li></ul>`,
  )}
  ${rule(
    '3D scenes',
    `<ul class="sub"><li>Illustrative only, never orbit-propagated. No quantity should be read from a scene.</li>
    <li>Radial distance is compressed (altitude<sup>0.45</sup>); Earth is to scale.</li>
    <li>Particle counts equal cataloged fragments up to a budget of ${PARTICLE_BUDGET.toLocaleString()} on this device.</li></ul>`,
  )}
  <h3>How to cite this page</h3>
  <p>“Counterspace Timeline, 1957–2026,” companion to <i>Space Security Law: Governance Beyond the Atmosphere</i> (data as of ${AS_OF}).
Cite the underlying SWF edition and pinned source for any individual fact; the cards and data tables give each pin.</p>
  <h3>Licensing</h3>
  <p>SWF material is licensed CC BY-NC 4.0. This page uses facts only. Its charts, graphics and prose are original, apart from short
attributed quotations from SWF (15 words or fewer each), which are set in quotation marks; no SWF or CSIS figures or graphics are
reproduced. Earth imagery in the 3D scenes is NASA’s Blue Marble (a U.S. government work, public domain), loaded from a pinned copy on
jsDelivr only when you interact with the hero globe or open a scene, and never with reduced motion. Vector coastlines (static diagrams and
fallback) come from Natural Earth (public domain) via world-atlas.</p>
  <h3>All cited sources (${cites.length})</h3>
  <ol class="cites">${cites.join('')}</ol>
  <p class="note">The full ledger (every row with its pin), the verification log and the builder decisions are in <code>ledger.md</code>,
<code>verification_log.md</code> and <code>methodology.md</code>.</p>`;
}
