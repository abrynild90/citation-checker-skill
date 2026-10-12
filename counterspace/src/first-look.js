import { byId } from './app.js';
import { openScene } from './scene-ui.js';

// An optional, reader-paced introduction; dates and source links match the records.
const section = document.getElementById('firstLook');
const source = (id, label) => `<a href="${byId[id].source_url}" target="_blank" rel="noopener">${label}<span class="sr"> (opens in a new tab)</span></a>`;
const parts = [
  `<h3>A nuclear test in space</h3><p>The United States detonated Starfish Prime about 400 km above Earth on 9 July 1962.</p><p>${source('us-1962-starfish-prime', 'Read the test record and source')}</p>`,
  `<h3>A treaty followed, 13 months later</h3><p>The Limited Test Ban Treaty was signed on 5 August 1963 and entered into force on 10 October. It bans nuclear tests in outer space.</p><p>${source('ltbt-1963', 'Read the treaty')}</p>`,
  `<h3>Later does not mean caused by</h3><p>The treaty followed Starfish Prime. That sequence alone does not show that the test caused the agreement. The U.S. Office of the Historian points to the Cuban Missile Crisis and concern about radioactive fallout.</p><p><a href="https://history.state.gov/milestones/1961-1968/limited-ban" target="_blank" rel="noopener">Read the historical context<span class="sr"> (opens in a new tab)</span></a></p>`,
];
let step = 0;
function show(n) {
  step = Math.max(0, Math.min(parts.length - 1, n));
  document.getElementById('firstLookCopy').innerHTML = parts[step];
  document.getElementById('firstLookTreaty').hidden = step === 0;
  document.getElementById('firstLookBack').disabled = step === 0;
  const next = document.getElementById('firstLookNext');
  next.hidden = step === 2;
  next.textContent = step === 0 ? 'Next: the treaty' : 'Next: the qualification';
  document.getElementById('firstLookDone').hidden = step !== 2;
  section.querySelectorAll('[data-look]').forEach((b, i) => (i === step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
}
document.getElementById('firstLookOpen').onclick = (e) => {
  section.hidden = false;
  e.currentTarget.setAttribute('aria-expanded', 'true');
  show(step);
  document.getElementById('firstLookTitle').focus({ preventScroll: true });
  section.scrollIntoView({ block: 'start', behavior: 'instant' });
};
section.querySelectorAll('[data-look]').forEach((b) => (b.onclick = () => show(+b.dataset.look)));
document.getElementById('firstLookBack').onclick = () => show(step - 1);
document.getElementById('firstLookNext').onclick = () => {
  show(step + 1);
  if (step === 2) document.getElementById('firstLookDone').focus({ preventScroll: true });
};
document.getElementById('firstLookScene').onclick = () => openScene('starfish');
