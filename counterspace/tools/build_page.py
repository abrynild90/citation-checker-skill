"""Inline data + JS into a single self-contained index.html.
JS modules are concatenated in dependency order into one module scope (imports/exports stripped)."""
import json, re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
d = lambda p: json.loads((R / p).read_text())
data = dict(events=d('data/events.json'), legal=d('data/legal.json'), caps=d('data/capabilities.json'))
blob = json.dumps(data, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
land_blob = json.dumps(d('src/land.json'), separators=(',', ':')).replace('</', '<\\/')  # separate script tag: parsed only when a scene or the hero needs it
strip = lambda t: re.sub(r"^import .*? from '.*?';\n", '', re.sub(r'^export ', '', t, flags=re.M), flags=re.M)
ORDER = ['scenes.js', 'scenes/core.js', 'scenes/labels.js', 'scenes/config.js', 'scenes/sim.js', 'scenes/earth.js', 'scenes/gl-host.js', 'scenes/svg-fallback.js', 'app.js', 'audit.js', 'ui.js', 'charts/legal.js', 'charts/a.js', 'charts/c.js', 'charts/b.js', 'charts/lag.js',
         'method.js', 'export.js', 'scene-ui.js', 'boot.js']
js = '\n'.join(strip((R / 'src' / f).read_text()) for f in ORDER)
html = (R / 'src/template.html').read_text().replace('/*__DATA__*/', blob).replace('/*__LAND__*/', land_blob).replace('/*__APP__*/', js)
(R / 'index.html').write_text(html)
print('index.html', len(html.encode()) // 1024, 'KB')


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
import os, gzip
if not os.environ.get('NOMIN'):
    small = minify(html); (R / 'index.html').write_text(small)
    print('minified', len(small.encode()) // 1024, 'KB; gzip', len(gzip.compress(small.encode())) // 1024, 'KB')
