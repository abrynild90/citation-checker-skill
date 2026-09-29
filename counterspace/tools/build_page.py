"""Inline data + JS into a single self-contained index.html.

src/ is one shared-scope program: most modules use each other's top-level names without importing them (only app.js has real
imports), so it cannot be bundled as a module graph yet (tools/PAGE_TODO_BUNDLER.md lists the missing imports).
Default path: the files in ORDER are joined into one module scope (whole-line `import ... from` lines removed, `export ` keyword
removed, both checked against esbuild's metafile), then esbuild minifies the JS (IIFE) and CSS with a real parser.
Module graph: src/boot.js is bundled as a true module graph when ESBUILD_GRAPH=1, or by default once the scene modules have their imports (graph_ready()); ESBUILD_GRAPH=0 forces the joined-scope build.
Fallback (esbuild missing or NOESBUILD=1): the old line-based minifier. NOMIN=1 skips minification on that path.
OUTFILE=path writes the page elsewhere."""
import json, re, pathlib, os, subprocess, shutil
R = pathlib.Path(__file__).resolve().parent.parent
d = lambda p: json.loads((R / p).read_text())
data = dict(events=d('data/events.json'), legal=d('data/legal.json'), caps=d('data/capabilities.json'),
            lag_pairs=d('data/lag_pairs.json'), schema={k: d('data/schema.json')[k] for k in ('schema_version', 'ledger_as_of', 'scope_rule', 'page_strings')})
blob = json.dumps(data, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
land_blob = json.dumps(d('src/land.json'), separators=(',', ':')).replace('</', '<\\/')  # separate script tag: parsed only when a scene or the hero needs it
strip = lambda t: re.sub(r"^import .*? from '.*?';\n", '', re.sub(r'^export ', '', t, flags=re.M), flags=re.M)
ORDER = ['scenes.js', 'shared.js', 'scenes/core.js', 'scenes/labels.js', 'scenes/config.js', 'scenes/sim.js', 'scenes/earth.js', 'scenes/gl-host.js', 'scenes/gl-items.js', 'scenes/gl-labels.js', 'scenes/gl-still.js', 'scenes/svg-fallback.js', 'app.js', 'audit.js', 'ui.js', 'charts/legal.js', 'charts/a.js', 'charts/c.js', 'charts/b.js', 'charts/lag.js',
         'method.js', 'export.js', 'scene-ui.js', 'boot.js']
ESB = R / 'tools/node_modules/.bin/esbuild'
def esbuild(args, text=None, cwd=R / 'src'):
    r = subprocess.run([str(ESB), *args], input=text, capture_output=True, text=True, cwd=cwd)
    if r.returncode:
        raise RuntimeError(r.stderr)
    return r.stdout
def check_strip():
    """The line-based import strip must remove exactly the import statements esbuild finds in the module graph."""
    import tempfile
    with tempfile.TemporaryDirectory() as t:
        esbuild(['--bundle', '--outfile=' + t + '/o.js', '--metafile=' + t + '/m.json', '--log-level=error'],
                ''.join("import './%s';\n" % f for f in ORDER))
        inputs = json.loads(pathlib.Path(t, 'm.json').read_text())['inputs']
    real = sum(i['kind'] == 'import-statement' for k, v in inputs.items() if k != '<stdin>' for i in v['imports'])
    seen = sum(len(re.findall(r"^import .*? from '.*?';\n", (R / 'src' / f).read_text(), flags=re.M)) for f in ORDER)
    if real != seen:
        raise RuntimeError('import strip mismatch: esbuild sees %d import statements, the strip removes %d' % (real, seen))
def graph_ready():
    """Default for the module-graph build: on once the scene modules carry their own import lines (see tools/PAGE_TODO_SCENES_IMPORTS.md)."""
    return bool(re.search(r'^import ', (R / 'src/scenes/gl-host.js').read_text(), flags=re.M))
GRAPH = {'1': True, '0': False}.get(os.environ.get('ESBUILD_GRAPH'), graph_ready())  # ESBUILD_GRAPH=1 forces the graph, =0 forces the joined-scope build
use_esbuild = ESB.exists() and not os.environ.get('NOESBUILD')
tpl = (R / 'src/template.html').read_text()
js = None
if use_esbuild:
    try:
        check_strip()
        if GRAPH:
            try:
                js = esbuild(['--bundle', '--format=iife', '--minify', '--legal-comments=none', 'boot.js']).strip()
                print('module graph bundle (src/boot.js)')
            except Exception as e:  # keep the joined-scope build as the fallback
                print('graph bundle failed, using the joined-scope build:', str(e)[:300]); js = None
        if js is None:
            js = esbuild(['--format=iife', '--minify', '--legal-comments=none', '--loader=js'],
                         '\n'.join(strip((R / 'src' / f).read_text()) for f in ORDER)).strip()
        tpl = re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1) + esbuild(['--loader=css', '--minify'], m.group(2)).strip() + m.group(3), tpl, count=1, flags=re.S)
    except Exception as e:  # any failure: use the old path rather than break the build
        print('esbuild failed, falling back to the line-based minifier:', str(e)[:300]); use_esbuild = False
if js is None:
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
