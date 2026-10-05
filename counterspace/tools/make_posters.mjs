// Renders one poster picture per 3D explainer (no labels, 16:9, WebP) from the real live scenes:
//   NODE_PATH=tools/node_modules PORT=9301 node tools/make_posters.mjs            all scenes
//   ONLY=starfish,rpo  T_starfish=0.4  OUT=dir  W=960  Q=0.82  FILE=index.html
// Writes <OUT>/<id>.webp (default src/assets/posters). The page build embeds them (instant picture while a scene loads, and the gallery cards).
// Each scene is captured at the moment that shows its subject best (POSTER_T below); override one with T_<id>=<0..1>.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const root = path.resolve('.');
const file = path.resolve(process.env.FILE || 'index.html');
const out = path.resolve(process.env.OUT || path.join(root, 'src/assets/posters'));
const PORT = +(process.env.PORT || 9301);
const W = +(process.env.W || 960);
const H = Math.round((W * 9) / 16);
const Q = +(process.env.Q || 0.82);
const POSTER_T = {
  starfish: 0.21,
  solwind: 0.58,
  fengyun: 0.55,
  'burnt-frost': 0.5,
  dn2: 0.6,
  shakti: 0.5,
  cosmos1408: 0.6,
  gnss: 0.5,
  viasat: 0.7,
  laser: 0.78,
  'sj21-tug': 0.6,
  rpo: 0.5,
  spaceplanes: 0.17,
};
// Optional per-scene poster view: a camera preset index (CAM) and/or a free pose [px,py,pz, lx,ly,lz, fov?] (POSE), applied after the time is set.
// Override from the shell with C_<id>=<preset> and P_<id>=px,py,pz,lx,ly,lz[,fov].
const POSTER_VIEW = {
  'sj21-tug': { pose: [-0.588, 0.17, -3.065, -0.64, 0.13, -2.37, 33] }, // the docked pair and its arm over the Earth limb
  spaceplanes: { pose: [3.5, 2.4, 1.6, 0.25, 0.1, 0.1, 44] }, // the plane in sunlight over the Atlantic, wide enough that the orbit tilt reads
};
const only = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(POSTER_T);
fs.mkdirSync(out, { recursive: true });

const srv = http
  .createServer((q, r) => {
    if (q.url === '/' || q.url.startsWith('/?')) {
      r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return fs.createReadStream(file).pipe(r);
    }
    r.writeHead(404);
    r.end();
  })
  .listen(PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '#sceneView > :not(canvas) { visibility: hidden !important; }' }); // pictures without labels, caption or inset
  for (const id of only) {
    const t = +(process.env['T_' + id.replace(/-/g, '_')] ?? POSTER_T[id] ?? 0.5);
    await page.evaluate((id) => window.__cs.openScene(id), id);
    await page.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 90000 }); // the full Earth image loads when the first scene opens
    await page.waitForTimeout(1500);
    const key = id.replace(/-/g, '_');
    const view = { ...(POSTER_VIEW[id] || {}) };
    if (process.env['C_' + key] != null) view.cam = +process.env['C_' + key];
    if (process.env['P_' + key]) view.pose = process.env['P_' + key].split(',').map(Number);
    await page.evaluate(
      ({ t, view }) => {
        const h = window.__cs.host();
        h.playing = false;
        h.update(t);
        if (view.cam != null) {
          h.pickCam(view.cam);
          h.update(t);
        }
        if (view.pose) {
          const p = view.pose;
          h.camera.position.set(p[0], p[1], p[2]);
          h.target.set(p[3], p[4], p[5]);
          h.camera.lookAt(h.target);
          if (p[6]) {
            h.camera.fov = p[6];
            h.camera.updateProjectionMatrix();
          }
          h._user = true;
          h.render();
        }
      },
      { t, view },
    );
    await page.waitForTimeout(400);
    const png = await page.locator('#sceneView canvas').first().screenshot({ type: 'png' });
    const b64 = await page.evaluate(
      async ({ data, W, H, Q }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + data;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const k = Math.max(W / img.width, H / img.height);
        const w = img.width * k;
        const h = img.height * k;
        const x = c.getContext('2d');
        x.imageSmoothingQuality = 'high';
        x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        return c.toDataURL('image/webp', Q).split(',')[1];
      },
      { data: png.toString('base64'), W, H, Q },
    );
    fs.writeFileSync(path.join(out, `${id}.webp`), Buffer.from(b64, 'base64'));
    console.log(id, 't=' + t, Math.round((b64.length * 3) / 4 / 1024) + ' KB');
    await page.evaluate(() => window.__cs.closeScene());
    await page.waitForTimeout(300);
  }
} finally {
  await browser.close();
  srv.close();
}
