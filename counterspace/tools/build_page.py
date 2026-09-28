"""Inline data + JS into a single self-contained index.html.
JS modules are concatenated in dependency order into one module scope (imports/exports stripped)."""
import json, re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
d = lambda p: json.loads((R / p).read_text())
data = dict(events=d('data/events.json'), legal=d('data/legal.json'), caps=d('data/capabilities.json'), land=d('src/land.json'))
blob = json.dumps(data, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
strip = lambda t: re.sub(r"^import .*? from '.*?';\n", '', re.sub(r'^export ', '', t, flags=re.M), flags=re.M)
ORDER = ['scenes.js', 'scenes/core.js', 'scenes/labels.js', 'scenes/config.js', 'scenes/sim.js', 'scenes/earth.js', 'scenes/gl-host.js', 'scenes/svg-fallback.js', 'app.js', 'audit.js', 'ui.js', 'charts/legal.js', 'charts/a.js', 'charts/c.js', 'charts/b.js', 'charts/lag.js',
         'method.js', 'export.js', 'scene-ui.js', 'boot.js']
js = '\n'.join(strip((R / 'src' / f).read_text()) for f in ORDER)
html = (R / 'src/template.html').read_text().replace('/*__DATA__*/', blob).replace('/*__APP__*/', js)
(R / 'index.html').write_text(html)
print('index.html', len(html.encode()) // 1024, 'KB')
