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
  solwind: 0.68, // debris spread over the ocean and Arctic, not read as city lights on land
  fengyun: 0.22, // the launch, the interceptor and the satellite in one frame, before the debris saturates the picture
  'burnt-frost': 0.54, // the debris plume with trails, the shock rings nearly faded
  dn2: 0.6,
  shakti: 0.36, // the interceptor and the satellite both in view over the Bay of Bengal
  cosmos1408: 0.6,
  gnss: 0.5,
  viasat: 0.55,
  laser: 0.5,
  'sj21-tug': 0.6,
  rpo: 0.5,
  spaceplanes: 0.15,
};
// Optional per-scene poster view: a camera preset index (CAM) and/or a free pose [px,py,pz, lx,ly,lz, fov?] (POSE), applied after the time is set.
// Override from the shell with C_<id>=<preset> and P_<id>=px,py,pz,lx,ly,lz[,fov].
const POSTER_VIEW = {
  viasat: { cam: 3 }, // the whole GEO ring, Europe and the beams down to KA-SAT
  'sj21-tug': { cam: 0 }, // push in on the docked pair with its arm
  starfish: { cam: 0, back: 1.5, right: 0.1, lift: 0.18 }, // the whole globe with room around it, the Japan coast lit at the left
  gnss: { cam: 0, lift: 0.1 }, // the jammer zone whole, not cut by the top of the frame (lift: camera and target move up by this many Earth radii)
  spaceplanes: { cam: 1, boost: 1.6 },
  shakti: { back: 0.58, right: 0.08 },
  fengyun: { back: 0.95, boost: 1.7, right: 0.1 },
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
    if (process.env['C_' + key] != null) { view.cam = +process.env['C_' + key]; if (!process.env['P_' + key]) delete view.pose; }
    if (process.env['P_' + key]) view.pose = process.env['P_' + key].split(',').map(Number);
    await page.evaluate(
      ({ t, view }) => {
        const h = window.__cs.host();
        h.playing = false;
        h.update(t);
        if (view.boost) h._modelBoost = view.boost;
        if (view.cam != null) {
          h.pickCam(view.cam);
          h.update(t);
        }
        if (view.back) {
          // back: dolly out by this factor from the target (the picture keeps its centre, the subject gets smaller)
          const d = h.camera.position.clone().sub(h.target).multiplyScalar(view.back);
          h.camera.position.copy(h.target).add(d);
          h.camera.lookAt(h.target);
          h._user = true;
          h.render();
        }
        if (view.right) {
          // right: slide the view sideways by this many Earth radii (the picture moves the other way)
          const r = new h.camera.position.constructor(1, 0, 0).applyQuaternion(h.camera.quaternion).multiplyScalar(view.right);
          h.camera.position.add(r);
          h.target.add(r);
          h.camera.lookAt(h.target);
          h._user = true;
          h.render();
        }
        if (view.lift) {
          const up = h.camera.up.clone().applyQuaternion(h.camera.quaternion).multiplyScalar(view.lift);
          h.camera.position.add(up);
          h.target.add(up);
          h.camera.lookAt(h.target);
          h._user = true;
          h.render();
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
