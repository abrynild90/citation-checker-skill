"""Inline data + JS + CSS into a single self-contained index.html.

src/boot.js is the entry of a real ES-module graph: every module imports what it uses. esbuild bundles it into one minified IIFE and
minifies the template's <style> block. Data JSON (data/*.json) and src/land.json go in as inert script blobs.
esbuild comes from tools/node_modules (run `npm install` in tools/); there is no fallback build.
OUTFILE=path writes the page elsewhere than ./index.html."""
import json, re, pathlib, os, subprocess, base64

R = pathlib.Path(__file__).resolve().parent.parent
ESB = R / 'tools/node_modules/.bin/esbuild'


def read_json(p):
    return json.loads((R / p).read_text())


def script_json(obj):
    """Compact JSON safe inside a <script> element ('</' is escaped)."""
    return json.dumps(obj, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')


STYLE_ORDER = ('tokens', 'base', 'page', 'hero', 'charts', 'charts2', 'scenes', 'discover', 'explore', 'scrub', 'reference')
SRC_KEYS = ('source', 'source_url', 'source_full')
DROP_KEYS = ('evidence', 'conflicts')  # ledger-only fields: verification notes the page never reads (see ledger.md)


def slim_events(events):
    """The ledger repeats the same three source fields on every row (only a handful of distinct sources exist), which was ~60 KB of the page.
    Embed each distinct source once and give the row an index (`s`); app.js copies the fields back onto the row at load."""
    table, out = [], []
    for e in events:
        src = {k: e[k] for k in SRC_KEYS if k in e}
        if src not in table:
            table.append(src)
        out.append({**{k: v for k, v in e.items() if k not in SRC_KEYS + DROP_KEYS}, 's': table.index(src)})
    return out, table


def pack_land(rings):
    """src/land.json is one flat [lon,lat,...] ring per polygon, in tenths of a degree. Embed each ring as integers, the first pair absolute and
    every later value as the difference from the value two places before it (small ints are about half the bytes). app.js `unpackLand` reverses it
    exactly: n/10 gives the same double as parsing the original decimal."""
    out = []
    for ring in rings:
        v = [round(c * 10) for c in ring]
        assert all(abs(c * 10 - x) < 1e-6 for c, x in zip(ring, v)), 'land.json holds more than 1 decimal: widen pack_land'
        out.append(v[:2] + [v[i] - v[i - 2] for i in range(2, len(v))])
    return out


# Embedded fonts: fonts/*.woff2 (SIL OFL; see fonts/OFL-*.txt) become base64 @font-face rules in <style id="cs-fonts">, so the page stays one
# self-contained file with no font request. Two files read these rules by their exact text: src/export.js and src/scenes/svg/still-frame.js copy the
# "Public Sans" and "Libre Bodoni" rules into exported SVGs. They match `font-family:"Public Sans"` / `font-family:"Libre Bodoni"` together with
# `font-style:normal`, so keep the family names, their double quotes and the `font-style:normal` text as written below (the "... Fallback" rules fail that
# match on purpose: an exported file carries real fonts). src/fonts.js loads every face before the first text measurement.
# Public Sans is a variable font (weight 100-900, so 400/500/600/700 are real drawings, never synthesized bold) for all body, interface, chart, SVG and 3D
# label text, roman and italic (the italic is for titles of books and reports). Libre Bodoni (variable, weight 400-700) is for display headings only: h1, h2
# and large numerals, 28 px and up. tools/subset_fonts.py documents how the files were made.
# The "Fallback" families are local system fonts (Arial, Times New Roman) with adjusted metrics that stand in while a face decodes (font-display:swap), so
# the first paint wraps like the final one: size-adjust matches the average glyph width, the ascent and descent overrides match the line box.
# Each entry: (family, file, weight or weight range, style).
FONT_FACES = (
    ('Public Sans', 'PublicSans-latin.woff2', '100 900', 'normal'),
    ('Public Sans', 'PublicSans-italic-latin.woff2', '100 900', 'italic'),
    ('Libre Bodoni', 'LibreBodoni-latin.woff2', '400 700', 'normal'),
)
# family, local font names, weight range, size-adjust, ascent and descent (percent of the adjusted size)
FALLBACK_FACES = (
    ('Public Sans Fallback', 'local("Arial"),local("Liberation Sans"),local("Helvetica")', '100 500', 104.3, 91.1, 21.6),
    ('Public Sans Fallback', 'local("Arial Bold"),local("Liberation Sans Bold"),local("Helvetica Bold")', '600 900', 98.9, 96.1, 22.8),
    ('Libre Bodoni Fallback', 'local("Times New Roman"),local("Liberation Serif"),local("Times")', '400 700', 113.2, 81.7, 28.8),
)


def font_css():
    rules = []
    for fam, f, wt, st in FONT_FACES:
        b64 = base64.b64encode((R / 'fonts' / f).read_bytes()).decode()
        rules.append(f'@font-face{{font-family:"{fam}";font-style:{st};font-weight:{wt};font-display:swap;'
                     f'src:url(data:font/woff2;base64,{b64}) format("woff2")}}')
    for fam, src, wt, adj, asc, desc in FALLBACK_FACES:
        rules.append(f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{wt};src:{src};size-adjust:{adj}%;'
                     f'ascent-override:{asc}%;descent-override:{desc}%;line-gap-override:0%}}')
    return '\n'.join(rules)


def earth_json():
    """Small day and night images of the Earth (src/assets, from NASA Blue Marble and Black Marble imagery, public domain), embedded as data URLs so the first
    picture of the planet needs no download. src/scenes/earth.js reads them from <script id="cs-earth">."""
    out = {}
    for key, f in (('day', 'earth-day.jpg'), ('night', 'earth-night.jpg')):
        out[key] = 'data:image/jpeg;base64,' + base64.b64encode((R / 'src/assets' / f).read_bytes()).decode()
    return out


def earth_hd_json():
    """Full-resolution pictures for the live 3D views (NASA imagery from the three-globe package, public domain): the 4096 px day and night images, the water
    mask and the relief map. They go in their own script tag so the small pictures above stay cheap to parse; src/scenes/earth.js decodes them only when a 3D
    view starts. A missing file is skipped (the 3D views then fetch the day and night images from jsDelivr instead)."""
    out = {}
    for key, f, mime in (('day', 'earth-day-4k.jpg', 'image/jpeg'), ('night', 'earth-night-4k.jpg', 'image/jpeg'),
                         ('water', 'earth-water.png', 'image/png'), ('relief', 'earth-relief.png', 'image/png')):
        p = R / 'src/assets' / f
        if p.exists():
            out[key] = f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
    return out


def posters_json():
    """One 16:9 WebP picture per 3D explainer (src/assets/posters/<id>.webp, made by tools/make_posters.mjs), embedded as data URLs for
    <script id="cs-posters">. src/scenes/posters.js reads them: an instant picture while a scene loads, and the gallery cards."""
    d = R / 'src/assets/posters'
    return {f.stem: 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted(d.glob('*.webp'))} if d.is_dir() else {}


def esbuild(args, text=None):
    r = subprocess.run([str(ESB), *args], input=text, capture_output=True, text=True, cwd=R / 'src')
    if r.returncode:
        raise RuntimeError(r.stderr)
    return r.stdout.strip()


def main():
    if not ESB.exists():
        raise SystemExit('esbuild not found: run `npm install` in tools/')
    schema = read_json('data/schema.json')
    events, sources = slim_events(read_json('data/events.json'))
    data = dict(events=events, sources=sources, legal=read_json('data/legal.json'), caps=read_json('data/capabilities.json'),
                lag_pairs=read_json('data/lag_pairs.json'),
                schema={k: schema[k] for k in ('schema_version', 'ledger_as_of', 'scope_rule', 'co_scope_rule', 'page_strings')})
    # D3 and Three.js are pinned build inputs, embedded so file:// and offline use need no CDN.
    # NOMIN=1: unminified bundle with an inline source map (readable stack traces when chasing a page error)
    nomin = bool(os.environ.get('NOMIN'))
    js = esbuild(['--bundle', '--format=iife', '--legal-comments=none', '--charset=utf8', '--alias:three=' + str(R / 'tools/node_modules/three/build/three.module.js'), 'boot.js']
                 + (['--sourcemap=inline'] if nomin else ['--minify']))
    tpl = (R / 'src/template.html').read_text()
    # The page is assembled from parts: src/template.html (page markup), src/partials/*.html (scene viewer, icon sprite) and src/styles/*.css.
    # Styles are joined in this order, then minified together: tokens, base, page, charts (shared chart parts), charts2 (capability, jamming and
    # close-approach charts), scenes.
    for slot, part in (('<!--__OVERLAY__-->', 'overlay'), ('<!--__ICONS__-->', 'icons')):
        tpl = tpl.replace(slot, (R / 'src/partials' / f'{part}.html').read_text().rstrip())
    css = '\n'.join((R / 'src/styles' / f'{n}.css').read_text() for n in STYLE_ORDER)
    tpl = tpl.replace('/*__CSS__*/', esbuild(['--loader=css', '--minify'], css))
    # land.json sits in its own script tag so it is parsed only when a scene or the hero needs it
    tpl = tpl.replace('/*__FONTS__*/', font_css())
    html = (tpl.replace('/*__DATA__*/', script_json(data))
            .replace('/*__LAND__*/', script_json(pack_land(read_json('src/land.json'))))
            .replace('/*__EARTH__*/', script_json(earth_json()) + '</script><script id="cs-earth-hd" type="application/json">' + script_json(earth_hd_json()))
            .replace('/*__POSTERS__*/', script_json(posters_json()))
            .replace('/*__LICENSES__*/', script_json({name: (R / 'tools/node_modules' / name / 'LICENSE').read_text() for name in ('d3', 'three')}))
            .replace('/*__D3__*/', (R / 'tools/node_modules/d3/dist/d3.min.js').read_text().replace('</', '<\\/'))
            .replace('/*__APP__*/', js.replace('</', '<\\/')))
    out = pathlib.Path(os.environ['OUTFILE']) if os.environ.get('OUTFILE') else R / 'index.html'
    # Shader strings from Three.js contain insignificant trailing spaces.
    html = '\n'.join(line.rstrip() for line in html.split('\n'))
    out.write_text(html)
    print(out, len(html.encode()) // 1024, 'KB (esbuild module graph, src/boot.js)')


if __name__ == '__main__':
    main()
