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
# self-contained file. src/export.js copies the IBM Plex Sans rules into exported SVGs (it matches the exact `font-family:"IBM Plex Sans"` text, a
# normal style and a weight of `400` or `500 600` written here), and src/fonts.js loads every face before the first text measurement.
# Newsreader is the complete Latin variable font (weight 200-800, optical size 6-72, so display sizes get their own drawing automatically); the
# Latin Extended face only loads for text that needs it (unicode-range). IBM Plex Sans keeps its TrueType hinting, in Latin, Latin-1 and Extended-A.
# Each entry: (family, file, weight or weight range, style, unicode-range or None). tools/subset_fonts.py documents how the files were made.
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
LATIN_EXT = ('U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,'
             'U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF')
FONT_FACES = (
    ('Newsreader', 'Newsreader-latin.woff2', '200 800', 'normal', LATIN),
    ('Newsreader', 'Newsreader-latin-ext.woff2', '200 800', 'normal', LATIN_EXT),
    ('Newsreader', 'Newsreader-italic-latin.woff2', '200 800', 'italic', LATIN),
    ('IBM Plex Sans', 'IBMPlexSans-400.woff2', '400', 'normal', None),
    ('IBM Plex Sans', 'IBMPlexSans-600.woff2', '500 600', 'normal', None),
    ('IBM Plex Sans', 'IBMPlexSans-700.woff2', '700', 'normal', None),
)


def font_css():
    rules = []
    for fam, f, wt, st, ur in FONT_FACES:
        b64 = base64.b64encode((R / 'fonts' / f).read_bytes()).decode()
        rng = f'unicode-range:{ur};' if ur else ''
        rules.append(f'@font-face{{font-family:"{fam}";font-style:{st};font-weight:{wt};font-display:swap;{rng}'
                     f'src:url(data:font/woff2;base64,{b64}) format("woff2")}}')
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
    # NOMIN=1: unminified bundle with an inline source map (readable stack traces when chasing a page error)
    nomin = bool(os.environ.get('NOMIN'))
    js = esbuild(['--bundle', '--format=iife', '--legal-comments=none', '--charset=utf8', 'boot.js']
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
            .replace('/*__APP__*/', js))
    out = pathlib.Path(os.environ['OUTFILE']) if os.environ.get('OUTFILE') else R / 'index.html'
    out.write_text(html)
    print(out, len(html.encode()) // 1024, 'KB (esbuild module graph, src/boot.js)')


if __name__ == '__main__':
    main()
