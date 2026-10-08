// ============================================================================
// method.js: the sources and method section (editions, classification rules, how to cite, licences, every cited source).
// Provides: drawMethod().
// ============================================================================
// Imports: the names this module uses from other modules (tools/build_page.py bundles src/boot.js as a module graph).
import { DATA_DATE, EVENTS, LAST_DA, LEGAL, SCHEMA, esc, fmtLong, parse } from './app.js';
import { PARTICLE_BUDGET } from './scenes/core.js';
export function drawMethod() {
  // The data files use their own working vocabulary; the page says the same thing in the reader's words. Quotes become typographic quotes.
  const plain = (t) =>
    t
      .replace(/direct-ascent \(DA-ASAT\) test row/g, 'direct-ascent anti-satellite test')
      .replace(/is a row in this ledger/g, 'is an entry in our records')
      .replace(/DA-ASAT/g, 'direct-ascent anti-satellite')
      .replace(/\brows\b/g, 'entries')
      .replace(/\brow\b/g, 'entry')
      .replace(/\bledger\b/g, 'records')
      .replace(/"([^"]*)"/g, '“$1”')
      .replace(/(\w)'(\w)/g, '$1’$2')
      .replace(/(^|[\s(])'/g, '$1‘')
      .replace(/'/g, '’');
  // One entry per distinct source URL: a full citation (legal items carry their own; event sources are expanded below) plus the page references.
  // A raw address never appears as text: it becomes a short bracketed label (the link itself carries the full address).
  const host = (u) => {
    try {
      const url = new URL(u.replace(/&amp;/g, '&'));
      return /\.pdf$/i.test(url.pathname) ? 'PDF' : url.hostname.replace(/^www\./, '');
    } catch {
      return 'link';
    }
  };
  const short = (t) => esc(plain(t)).replace(/,?\s*(https?:\/\/[^\s)\];,]*[^\s)\];,.])/g, (m, u) => ` [${host(u)}]`);
  const groups = new Map();
  EVENTS.concat(LEGAL).forEach((r) => {
    if (!groups.has(r.source_url)) groups.set(r.source_url, []);
    groups.get(r.source_url).push(r);
  });
  // A citation reads as a title line (the link) and a quieter detail line (date, report number, pages, where the file lives).
  const MONTH = '(?:Jan|Feb|Mar|Apr|May|June|July|Aug|Sept|Oct|Nov|Dec)';
  const SPLIT = new RegExp(`^(.{12,}?)(?=,\\s${MONTH}\\.?\\s\\d|\\s\\(|(?<!&[a-z#0-9]+);\\s|,\\sCD/|,\\sart\\.|,\\sU\\.S\\.-|\\sarts\\.\\s)`);
  const twoLine = (html, url) => {
    const m = html.match(SPLIT),
      head = m ? m[1] : html,
      rest = m ? html.slice(head.length).replace(/^[,;]\s*/, '') : '';
    // A long trailing note folds away: the date and the report stay in view, the rest opens on request.
    const cut = rest.length > 150 ? rest.search(/(?<!&[a-z#0-9]+);\s/) : -1;
    const tail =
      cut > 20
        ? `<span class="cd">${rest.slice(0, cut)}</span><details class="cd-more"><summary>More about this source</summary><span class="cd">${rest.slice(cut + 1).trim()}</span></details>`
        : rest
          ? `<span class="cd">${rest}</span>`
          : '';
    return `<a class="ct" href="${url}" target="_blank" rel="noopener">${head}</a>${tail}`;
  };
  const cites = [...groups.values()].map((rs) => {
    const r = rs[0],
      url = esc(r.source_url);
    if (!r.source_full && r.citation) return `<li>${twoLine(short(r.citation), url)}</li>`;
    const head = short(r.source_full || r.source);
    const pins =
      rs.length > 1 ? `; ${rs.length} entries, each tied to its own table or page (shown with each point and in the data tables)` : `, ${esc(plain(r.pin))}`;
    return `<li>${twoLine(head + pins, url)}</li>`;
  });
  // The data's own rule texts start with their own label ("Scope rule: ...", "Co-orbital rule: ..."); the label is dropped here.
  const unlabel = (t) => t.replace(/^[A-Za-z-]+ rule:\s*/, '');
  // The two long rule texts are split into short points (what is counted, what is left out, how to read an entry); each falls back to the whole text.
  const li = (h, t) => `<li>${h ? `<b>${h}</b> ` : ''}${esc(plain(t))}</li>`;
  const scopeRule = (() => {
    const t = unlabel(SCHEMA.scope_rule),
      m = t.match(
        /^(.*?),\s*including\s+(.*?)\.\s*Exclusions, all disclosed:\s*(.*?)\s*\((.*?)\),\s*and\s+(the Table 16-3 line.*?)\s*\((.*?)\)\.\s*(Starfish.*)$/s,
      );
    if (!m) return `<p>${esc(plain(t))}</p>`;
    return (
      `<ul class="sub">${li('Counted:', m[1] + '.')}${li('Also counted:', m[2] + '.')}` +
      `${li('Left out, co-orbital tests:', m[4] + '.')}${li('Left out, a date variant:', m[5] + ' (' + m[6].replace(/,\s*see that row's conflicts/, '') + ').')}` +
      `${li('Added:', m[7])}</ul>`
    );
  })();
  const counted = (t) => {
    const [a, b] = t.split(/,\s*and\s+(?=every flight)/);
    const mm = b?.match(/^(.*?),\s*is a row(.*)$/s);
    return mm
      ? li('Counted:', a + '.') + li('Also counted:', mm[1] + '.') + li('Each entry', mm[2].replace(/^\s*with domain co_orbital,\s*dated/, 'is dated'))
      : li('Counted:', t);
  };
  const coRule = (() => {
    const t = unlabel(SCHEMA.co_scope_rule),
      m = t.match(
        /^(.*?)\s*Two exceptions, both disclosed:\s*\(a\)\s*(.*?);\s*\(b\)\s*(.*?)\s*\((.*?)\),\s*(the text-dated step.*?\.)\s+(RPO rows record.*)$/s,
      );
    if (!m) return `<p>${esc(plain(t))}</p>`;
    return (
      `<ul class="sub">${counted(m[1])}${li('Exception (a):', m[2] + '.')}${li('Exception (b):', m[3] + '.')}` +
      `${li('Cases for (b):', m[4] + '.')}${li('Then:', m[5])}${li('Reading an entry:', m[6])}</ul>`
    );
  })();
  const rule = (title, body, open) => `<details class="rule"${open ? ' open' : ''}><summary>${title}</summary><div class="rb">${body}</div></details>`;
  document.getElementById('methodBody').innerHTML = `<details class="table src-fold" id="srcDetails"><summary>Read the sources and method<span class="cnt">${cites.length} sources</span></summary>
<p class="src-check">To check a fact, open the data table behind its chart, note the source and page reference for the entry, then find that source in the list of all cited sources.</p>
<div class="msec">
  <h3 id="srcCite">How to cite this page</h3>
  <p class="src-intro">A suggested citation for the page as a whole, and what to cite for a single fact.</p>
  <div class="panel-card cite-card">
    <p class="cite-text" id="citeText">Aaron Brynildson, “Counterspace Timeline, 1957–2026,” companion to <i>Space Security Law: Governance Beyond the Atmosphere</i>
      (data from the Secure World Foundation, <i>Global Counterspace Capabilities</i>, 9th ed., April 2026; last updated ${DATA_DATE}).</p>
  </div>
  <p>To cite an individual fact, cite the SWF edition and the source it rests on. The details shown for each point on a chart, and the data tables, give the page reference.</p>
</div>
<div class="mcols">
<div class="mcol">
<div class="msec">
  <h3 id="srcEditions">Editions and dates</h3>
  <p class="src-intro">Which editions the data rests on, and how current it is.</p>
  <h4 class="sub-h">What the data rests on</h4>
  <ul>
    <li><b>Main source:</b> Secure World Foundation (SWF), <i>Global Counterspace Capabilities: An Open Source Assessment</i> (Victoria Samson &amp; Kathleen
      Brett, eds., 9th ed., April 2026). It covers 13 countries and five categories of capability. The count of 13 countries is a 2026 figure, not a fixed
      number. Debris counts are as of February 2026 (SWF Table 5-1).</li>
    <li><b>Consulted, not cited:</b> The Center for Strategic and International Studies (CSIS) Aerospace Security Project’s <i>Space Threat Assessment
      2025</i> was used only to cross-check. No entry, page reference or citation depends on it. The 2026 edition was not yet published on ${DATA_DATE}.</li>
    <li><b>Data last updated:</b> ${DATA_DATE}.</li>
  </ul>
  <h4 class="sub-h">Checks we ran</h4>
  <ul>
    <li><b>Where the opening claim comes from:</b> The statement at the top of the page that only non-destructive capabilities are in active use is SWF’s
      finding, quoted from SWF 2026, Executive Summary, p.&nbsp;xxiii (PDF p.&nbsp;21): “only non-destructive capabilities are actively being used against satellites
      in current military operations.”</li>
    <li><b>Check on the last destructive test:</b> No destructive direct-ascent anti-satellite test appears after ${fmtLong(parse(LAST_DA))} in SWF 2026 (Table 5-1
      ends with Cosmos 1408).</li>
  </ul>
</div>
</div>
<div class="mcol">
<div class="msec">
  <h3 id="codingRules" tabindex="-1">How we classified the data</h3>
  <p class="src-intro">The rules each chart follows when it counts and places an entry. Open one to read its rules.</p>
  ${rule('What counts as an anti-satellite test', scopeRule, true)}
  ${rule(
    'Anti-satellite tests: altitude and dates',
    `<ul class="sub"><li>Altitude is the intercept altitude from SWF Table 5-1 for destructive tests, and the apogee (the highest point reached) from Tables
        1-4, 2-4 and 3-3 for other tests.</li>
    <li>Tests with no reported altitude sit in a separate strip below the axis.</li>
    <li>Where SWF gives only a month, the entry is dated to that month and shown as month and year.</li>
    <li>Soviet co-orbital (IS) tests are left out of this chart and counted only in the chart of capabilities by decade.</li>
    <li>Starfish Prime is the only nuclear test shown.</li>
    <li><b>Debris:</b> the area of each bubble is proportional to the number of <i>cataloged</i> fragments. Fragments still in orbit are a different
        quantity, so they appear only in the details shown for each point and in the data tables.</li></ul>`,
  )}
  ${rule(
    'Jamming, lasers and cyber operations',
    `<ul class="sub"><li>An operation is recorded only when a named source documents it.</li>
    <li>Attribution is recorded exactly as the source states it and is never upgraded.</li>
    <li>Sustained campaigns are shown as spans of time, not as counts of incidents.</li>
    <li>Jamming from the ground affects satellite-navigation receivers within range of the jammer, not the satellites. We list it with attacks on
        satellite-navigation (GNSS) signals because the signals it targets come from satellites in medium Earth orbit, and the 3D explainer and the
        details shown for each point say so expressly.</li></ul>`,
  )}
  ${rule('Close approaches (rendezvous and proximity operations, RPOs)', coRule)}
  ${rule(
    'Who can do what, by decade',
    `<ul class="sub"><li>The 2020s follow the chapters of SWF 2026. Earlier decades are our reconstruction from SWF’s test tables, country chapters and fact
        sheets, and are labeled “reconstructed.”</li>
    <li>A state counts as “demonstrated” once it has tested or used the capability, and stays counted in later decades. “Developing” covers programs and
        latent capability.</li>
    <li>Each decade shows a range: the low end counts demonstrated capabilities only, and the high end adds those still developing.</li>
    <li>In the 2020s the count of states is SWF’s own assessment. The split between demonstrated and developing is our reading of SWF’s text.</li>
    <li>Grouped by category, each bar stacks pairs of a state and a capability, so a state with two capabilities counts twice. Grouped as kinetic and
        non-kinetic, each bar counts every state once per group.</li></ul>`,
  )}
  ${rule(
    'The 3D explainers',
    `<ul class="sub"><li>They are drawn for illustration. Do not read distances, speeds or counts from them.</li>
    <li>Orbit heights are squeezed so every orbit fits on screen. The Earth is drawn to scale.</li>
    <li>Low Earth orbit (LEO) reaches up to about 2,000 km and holds imaging satellites, the International Space Station and broadband constellations. GPS
        satellites sit in medium Earth orbit (MEO) at about 20,200 km. Broadcast and communications satellites sit in the geostationary belt (GEO) at about
        35,786 km.</li>
    <li>Debris is drawn as dots, one for each cataloged fragment, up to a limit of ${PARTICLE_BUDGET.toLocaleString()} dots on this device.</li></ul>`,
  )}
</div>
<div class="msec">
  <h3 id="srcLicence">Licences and credits</h3>
  <p class="src-intro">What may be reused, and where the pictures come from.</p>
  ${rule('Licence terms and image credits', `<p>SWF material is licensed CC BY-NC 4.0 (Creative Commons Attribution-NonCommercial 4.0). This page uses its facts only. The charts, graphics and prose
      are original, apart from short quotations from SWF (15 words or fewer each), which are always quoted and attributed. No SWF or CSIS figures or
      graphics are reproduced.</p>
    <p>Earth images in the 3D explainers are NASA’s Blue Marble and Black Marble (U.S. government works, in the public domain). Small versions are built
      into the page. The full-size images are fetched from a fixed copy hosted on jsDelivr, a public file host, only when you interact with the globe at the
      top of the page or open a 3D explainer, and never when animation is switched off on your device. Coastlines in the still diagrams come from Natural
      Earth (public domain) through the world-atlas dataset.</p>`)}
</div>
</div>
</div>
<div class="msec">
  <h3 id="srcList">All cited sources (${cites.length})</h3>
  <p class="src-intro">Every source the entries rest on, with the tables or pages each is cited for.</p>
  <ol class="cites">${cites.join('')}</ol>
  <p class="only-phone"><a class="to-top" href="#top">Back to the top</a></p>
  <p>The data table behind each chart lists every entry with its source and page reference.</p></div>
</details>`;

  // The long reference material sits in one disclosure; while it is closed the section's contents list has nothing to point at, so it steps aside.
  const fold = document.getElementById('srcDetails'),
    section = document.getElementById('sources');
  const syncFold = () => section.classList.toggle('folded', !fold.open);
  fold.addEventListener('toggle', syncFold);
  syncFold();
  const more = document.getElementById('srcMore'); // the main-source note belongs with the rest of the reading material
  if (more) fold.querySelector('.src-check').after(more);

  // Copy the citation: the clipboard when the browser allows it; otherwise the text is selected so a reader can copy it by hand.
  const text = document.getElementById('citeText'),
    button = document.getElementById('copyCite'),
    status = document.getElementById('citeStatus');
  let reset = 0;
  const say = (msg, label) => {
    status.textContent = msg;
    button.querySelector('span').textContent = label;
    button.querySelector('use').setAttribute('href', label === 'Copied' ? '#i-check' : '#i-copy');
    clearTimeout(reset);
    reset = setTimeout(() => {
      button.querySelector('span').textContent = 'Copy citation';
      button.querySelector('use').setAttribute('href', '#i-copy');
      status.textContent = '';
    }, 4000);
  };
  button.onclick = async () => {
    const citation = text.textContent.replace(/\s+/g, ' ').trim();
    try {
      await navigator.clipboard.writeText(citation);
      return say('Citation copied.', 'Copied');
    } catch {
      /* no clipboard access: select the text instead */
    }
    getSelection().selectAllChildren(text);
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    if (copied) say('Citation copied.', 'Copied');
    else say('The citation is selected. Press Ctrl+C (Cmd+C on a Mac) to copy it.', 'Copy citation');
  };
}
