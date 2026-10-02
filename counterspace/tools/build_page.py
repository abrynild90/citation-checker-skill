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


# Embedded fonts: fonts/*.woff2 (Latin subsets, SIL OFL; see fonts/OFL-*.txt) become base64 @font-face rules in <style id="cs-fonts">, so the
# page stays one self-contained file. src/export.js copies the IBM Plex Sans rules into exported SVGs (it matches the exact `font-family:"IBM Plex
# Sans"` text written here), and src/fonts.js loads every face before the first text measurement.
# (family, file, weight or range, style, unicode-range-free: the subsets are already Latin + the page's symbols)
FONT_FACES = (
    ('Newsreader', 'Newsreader-opsz.woff2', '400 600', 'normal'),
    ('Newsreader', 'Newsreader-opsz-italic.woff2', '400 600', 'italic'),
    ('IBM Plex Sans', 'IBMPlexSans-400.woff2', '400', 'normal'),
    ('IBM Plex Sans', 'IBMPlexSans-500.woff2', '500', 'normal'),
    ('IBM Plex Sans', 'IBMPlexSans-600.woff2', '600', 'normal'),
    ('IBM Plex Sans', 'IBMPlexSans-400-italic.woff2', '400', 'italic'),
    ('IBM Plex Mono', 'IBMPlexMono-400.woff2', '400', 'normal'),
)


def font_css():
    rules = []
    for fam, f, wt, st in FONT_FACES:
        b64 = base64.b64encode((R / 'fonts' / f).read_bytes()).decode()
        rules.append(f'@font-face{{font-family:"{fam}";font-style:{st};font-weight:{wt};font-display:swap;'
                     f'src:url(data:font/woff2;base64,{b64}) format("woff2")}}')
    return '\n'.join(rules)


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
    js = esbuild(['--bundle', '--format=iife', '--legal-comments=none', 'boot.js'] + (['--sourcemap=inline'] if nomin else ['--minify']))
    tpl = (R / 'src/template.html').read_text()
    tpl = re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1) + esbuild(['--loader=css', '--minify'], m.group(2)) + m.group(3),
                 tpl, count=1, flags=re.S)
    # land.json sits in its own script tag so it is parsed only when a scene or the hero needs it
    tpl = tpl.replace('/*__FONTS__*/', font_css())
    html = tpl.replace('/*__DATA__*/', script_json(data)).replace('/*__LAND__*/', script_json(read_json('src/land.json'))).replace('/*__APP__*/', js)
    out = pathlib.Path(os.environ['OUTFILE']) if os.environ.get('OUTFILE') else R / 'index.html'
    out.write_text(html)
    print(out, len(html.encode()) // 1024, 'KB (esbuild module graph, src/boot.js)')


if __name__ == '__main__':
    main()
