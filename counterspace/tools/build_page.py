"""Inline data + JS into a single self-contained index.html."""
import json, re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
d = lambda p: json.loads((R / p).read_text())
data = dict(events=d('data/events.json'), legal=d('data/legal.json'), caps=d('data/capabilities.json'), land=d('src/land.json'))
blob = json.dumps(data, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
scenes = re.sub(r'^export ', '', (R / 'src/scenes.js').read_text(), flags=re.M)
app = re.sub(r"^import .*? from './scenes.js';\n", '', (R / 'src/app.js').read_text(), flags=re.M)
html = (R / 'src/template.html').read_text().replace('/*__DATA__*/', blob).replace('/*__APP__*/', scenes + '\n' + app)
(R / 'index.html').write_text(html)
print('index.html', len(html.encode()) // 1024, 'KB')
