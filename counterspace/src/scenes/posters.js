// Poster pictures: one 16:9 WebP per 3D explainer, made by tools/make_posters.mjs and embedded by tools/build_page.py in <script id="cs-posters">.
// They give each explainer an instant picture while the live scene loads, and fill the gallery cards and chapter banners.
let table = null;
const load = () => {
  if (table) return table;
  try {
    table = JSON.parse(document.getElementById('cs-posters')?.textContent || '{}');
  } catch {
    table = {};
  }
  return table;
};
export const posterURL = (id) => load()[id] || '';
export const hasPoster = (id) => !!posterURL(id);
