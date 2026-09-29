"""Inline data + JS into a single self-contained index.html.

Primary path: esbuild (tools/node_modules, `npm install` in tools/) bundles the modules listed in ORDER into one minified IIFE and
minifies the CSS, with real import/export handling. Fallback (esbuild missing, or NOESBUILD=1): the old concatenation of the
files in ORDER with imports/exports stripped by regex. NOMIN=1 skips minification on the fallback path (esbuild output is always minified).
ORDER is also the bundle entry: src/ modules still share cross-file globals without importing them (see tools/PAGE_TODO_BUNDLER.md),
so the entry imports every file in dependency order."""
import json, re, pathlib, os, subprocess, shutil
R = pathlib.Path(__file__).resolve().parent.parent
d = lambda p: json.loads((R / p).read_text())
data = dict(events=d('data/events.json'), legal=d('data/legal.json'), caps=d('data/capabilities.json'),
            lag_pairs=d('data/lag_pairs.json'), schema={k: d('data/schema.json')[k] for k in ('schema_version', 'ledger_as_of', 'scope_rule', 'page_strings')})
blob = json.dumps(data, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
land_blob = json.dumps(d('src/land.json'), separators=(',', ':')).replace('</', '<\\/')  # separate script tag: parsed only when a scene or the hero needs it
strip = lambda t: re.sub(r"^import .*? from '.*?';\n", '', re.sub(r'^export ', '', t, flags=re.M), flags=re.M)
ORDER = ['scenes.js', 'scenes/core.js', 'scenes/labels.js', 'scenes/config.js', 'scenes/sim.js', 'scenes/earth.js', 'scenes/gl-host.js', 'scenes/gl-items.js', 'scenes/gl-labels.js', 'scenes/gl-still.js', 'scenes/svg-fallback.js', 'app.js', 'audit.js', 'ui.js', 'charts/legal.js', 'charts/a.js', 'charts/c.js', 'charts/b.js', 'charts/lag.js',
         'method.js', 'export.js', 'scene-ui.js', 'boot.js']
ESB = R / 'tools/node_modules/.bin/esbuild'
def esbuild(args, text):
    r = subprocess.run([str(ESB), *args], input=text, capture_output=True, text=True, cwd=R / 'src')
    if r.returncode:
        raise RuntimeError(r.stderr)
    return r.stdout
use_esbuild = ESB.exists() and not os.environ.get('NOESBUILD')
tpl = (R / 'src/template.html').read_text()
if use_esbuild:
    try:
        js = esbuild(['--bundle', '--format=iife', '--minify', '--legal-comments=none', '--loader=js', '--log-level=warning'],
                     ''.join("import './%s';\n" % f for f in ORDER)).strip()
        tpl = re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1) + esbuild(['--loader=css', '--minify'], m.group(2)).strip() + m.group(3), tpl, count=1, flags=re.S)
    except Exception as e:  # any failure: use the old path rather than break the build
        print('esbuild failed, falling back to concatenation:', str(e)[:300]); use_esbuild = False
if not use_esbuild:
    js = '\n'.join(strip((R / 'src' / f).read_text()) for f in ORDER)
html = tpl.replace('/*__DATA__*/', blob).replace('/*__LAND__*/', land_blob).replace('/*__APP__*/', js)
OUTFILE = pathlib.Path(os.environ['OUTFILE']) if os.environ.get('OUTFILE') else R / 'index.html'  # OUTFILE=path builds elsewhere
OUTFILE.write_text(html)
print('index.html', len(html.encode()) // 1024, 'KB', '(esbuild)' if use_esbuild else '(concatenation fallback)')


# ---- additive: conservative minification of the inline JS and CSS (sources stay readable; set NOMIN=1 to skip).
# Only whole-line comments, blank lines and leading indentation outside template literals are removed, so behaviour is unchanged.
def _min_js(t):
    out, inside = [], False
    for line in t.split('\n'):
        if not inside:
            line = line.strip()
            if not line or line.startswith('//'):
                continue
        out.append(line)
        if line.count('`') - line.count('\\`') & 1:
            inside = not inside
    return '\n'.join(out)
def _min_css(t):
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    return '\n'.join(l.strip() for l in t.split('\n') if l.strip())
def minify(html):
    html = re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1) + _min_css(m.group(2)) + m.group(3), html, count=1, flags=re.S)
    return re.sub(r'(<script type="module">)(.*?)(</script>)', lambda m: m.group(1) + _min_js(m.group(2)) + m.group(3), html, count=1, flags=re.S)
import gzip
if not use_esbuild and not os.environ.get('NOMIN'):
    small = minify(html); OUTFILE.write_text(small)
    print('minified', len(small.encode()) // 1024, 'KB; gzip', len(gzip.compress(small.encode())) // 1024, 'KB')
