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
  starfish: 0.6, // the whole globe with the belt lobes and the field lines
  solwind: 0.5, // the textured satellite at the instant the missile reaches it (the textured model is drawn only until impact)
  fengyun: 0.22, // the launch, the interceptor and the satellite in one frame, before the debris saturates the picture
  'burnt-frost': 0.4, // the SM-3 about to reach the textured satellite (the model is drawn until the hit)
  dn2: 0.5, // the rocket well inside the frame, the whole GEO ring around the Earth
  shakti: 0.36, // the interceptor and the satellite both in view over the Bay of Bengal
  cosmos1408: 0.6,
  gnss: 0.35, // both airliners in view: one already red, one still fine
  viasat: 0.55,
  laser: 0.5,
  'sj21-tug': 0.6,
  rpo: 0.5,
  spaceplanes: 0.15,
};
// Optional per-scene poster view: a camera preset index (CAM) and/or a free pose [px,py,pz, lx,ly,lz, fov?] (POSE), applied after the time is set.
// Override from the shell with C_<id>=<preset> and P_<id>=px,py,pz,lx,ly,lz[,fov].
const POSTER_VIEW = {
  viasat: { cam: 1, back: 0.85 }, // Europe close up: the modem regions fill the frame
  'sj21-tug': { cam: 4 }, // the looking-down view: the docked pair above the belt line, the Earth's limb below it
  starfish: { cam: 0 }, // the full-globe composition of the first camera
  gnss: { cam: 0, lift: 0.1, boost: 1.5 }, // the jammer zone whole, not cut by the top of the frame (lift: camera and target move up by this many Earth radii)
  spaceplanes: { cam: 1, boost: 1.5, back: 1.9, lift: -0.15 },
  solwind: { cam: 0, back: 0.62, boost: 2.4 }, // close on the impact, the satellite several times larger
  shakti: { back: 0.58, right: 0.08, boost: 1.7 },
  fengyun: { back: 0.7, boost: 1.8, right: 0.08 },
  dn2: { back: 0.8, boost: 1.3, right: 0.5 }, // in on the Earth and the rocket: the ring runs past the frame, no empty margins
  'burnt-frost': { back: 0.5, boost: 1.8 }, // close on the SM-3, the textured satellite and the ship just before the hit
};
const TRIPTYCH = [[0.2, 1], [0.62, 2], [0.88, 3]]; // [t, camera preset, optional dolly-out factor] per episode (RPO poster; the LEO panel at 0.62 keeps USA 245 inside the frame)
const TRIPTYCH_TITLES = ['GEO, 2025', 'LEO, 2019–20', 'GEO, 2025'];
const TRIPTYCH_BRIEFS = ['SJ-21 + SJ-25 appear to dock', 'Cosmos 2543 near USA 245', 'USA 271 near SKYNET 5A'];
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
  await page.addStyleTag({ content: '#sceneView > :not(canvas), #sceneView .hlabel { visibility: hidden !important; }' }); // pictures without labels, caption or inset
  for (const id of only) {
    const t = +(process.env['T_' + id.replace(/-/g, '_')] ?? POSTER_T[id] ?? 0.5);
    await page.evaluate((id) => window.__cs.openScene(id), id);
    await page.waitForFunction(() => window.__cs.earthReady(), null, { timeout: 90000 }); // the full Earth image loads when the first scene opens
    await page.waitForTimeout(1500);
    const key = id.replace(/-/g, '_');
    if (id === 'rpo' && !process.env.NO_TRIPTYCH) {
      // RPO: one picture that tells the three-episode story, three tiles side by side (each at its own moment and act camera), numbered with the panel titles
      const shots = [];
      for (const [tt, cam, back] of TRIPTYCH) {
        const box = await page.evaluate(({ tt, cam, back }) => {
          const h = window.__cs.host();
          h.playing = false;
          h.update(tt);
          h.pickCam(cam);
          h.update(tt);
          h.render();
          // the screen box of the craft on show (the picture is cropped around it)
          const cv = h.renderer.domElement;
          let pts = h.dyn
              .filter((d) => d.it.kind === 'point' && (d.it.prim || d.it.label) && d.obj.visible && d.it.pos?.(tt))
              .map((d) => {
                const v = d.obj.position.clone().project(h.camera);
                return [((v.x + 1) / 2) * cv.clientWidth, ((1 - v.y) / 2) * cv.clientHeight];
              });
          const xs = pts.map((p) => p[0]),
            ys = pts.map((p) => p[1]);
          // the whole group (every labelled craft) is centred by shifting the projection, so the square crop never has to clamp against the frame edge
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
            cy = (Math.min(...ys) + Math.max(...ys)) / 2,
            w = cv.clientWidth,
            hh = cv.clientHeight,
            sh = h._viewShift || 0;
          h.camera.setViewOffset(w, hh, cx - w / 2, cy + sh - hh / 2, w, hh);
          h.camera.updateProjectionMatrix();
          h.render();
          return { cx: w / 2, cy: hh / 2, bw: Math.max(...xs) - Math.min(...xs), bh: Math.max(...ys) - Math.min(...ys), w, h: hh };
        }, { tt, cam, back });
        if (process.env.DEBUG_TRI) console.log(JSON.stringify(box));
        await page.waitForTimeout(900);
        shots.push({ png: (await page.locator('#sceneView canvas').first().screenshot({ type: 'png' })).toString('base64'), box });
      }
      const b64 = await page.evaluate(
        async ({ shots, W, H, Q, titles, briefs }) => {
          // the page's own embedded fonts (a canvas does not fetch them by itself): load before any text is drawn
          await Promise.all(['600 40px "Newsreader"', '700 40px "IBM Plex Sans"', '600 40px "IBM Plex Sans"', '400 40px "IBM Plex Sans"'].map((f) => document.fonts.load(f).catch(() => null)));
          const SANS = '"IBM Plex Sans", sans-serif';
          const c = document.createElement('canvas');
          c.width = W;
          c.height = H;
          const x = c.getContext('2d');
          x.fillStyle = '#060a16';
          x.fillRect(0, 0, W, H);
          // three square tiles in a row, each cropped around its craft, under one title: the three-episode story at a glance
          const gap = W * 0.0125,
            ts = (W - 4 * gap) / 3,
            th = ts * 1.12, // the tiles are 12% taller than square: the pictures use the space under the row
            ty = H * 0.165; // and the title sits closer to them
          x.textBaseline = 'alphabetic';
          x.fillStyle = '#eef2fb';
          x.font = '600 ' + Math.round(H * 0.058) + 'px "Newsreader", Georgia, serif';
          x.fillText('Three close approaches, three places', gap, H * 0.105);
          const imgs = [];
          for (let i = 0; i < 3; i++) {
            const img = new Image();
            img.src = 'data:image/png;base64,' + shots[i].png;
            await img.decode();
            imgs.push(img);
          }
          // the same scale for all three tiles: the crop that fits the widest group
          const SW = Math.min(imgs[0].height / 1.12, imgs[0].width, Math.max(...shots.map((s, i) => Math.max(0.36 * imgs[i].height, Math.max(s.box.bw, s.box.bh) * (imgs[i].width / s.box.w) * 1.1 + 200 * (imgs[i].width / s.box.w)))));
          for (let i = 0; i < 3; i++) {
            const img = imgs[i],
              b = shots[i].box,
              k = img.width / b.w;
            const sw = SW,
              sh = SW * 1.12;
            const sx = Math.max(0, Math.min(img.width - sw, b.cx * k - sw / 2)),
              sy = Math.max(0, Math.min(img.height - sh, b.cy * k - sh / 2));
            const tx = gap + i * (ts + gap);
            x.imageSmoothingQuality = 'high';
            x.save();
            x.beginPath();
            x.roundRect(tx, ty, ts, th, 10);
            x.clip();
            x.drawImage(img, sx, sy, sw, sh, tx, ty, ts, th);
            x.restore();
            x.strokeStyle = 'rgba(150,175,230,.4)';
            x.lineWidth = 1.5;
            x.beginPath();
            x.roundRect(tx, ty, ts, th, 10);
            x.stroke();
            x.fillStyle = '#ffc86b';
            x.font = '700 ' + Math.round(H * 0.052) + 'px ' + SANS;
            x.fillText(String(i + 1), tx + 2, ty + th + H * 0.085);
            x.fillStyle = '#eef2fb';
            x.font = '600 ' + Math.round(H * 0.038) + 'px ' + SANS;
            x.fillText(titles[i], tx + H * 0.05, ty + th + H * 0.066);
            x.fillStyle = '#b3bdd6';
            x.font = Math.round(H * 0.032) + 'px ' + SANS;
            x.fillText(briefs[i], tx + H * 0.05, ty + th + H * 0.108);
          }
          return c.toDataURL('image/webp', Q).split(',')[1];
        },
        { shots, W, H, Q, titles: TRIPTYCH_TITLES, briefs: TRIPTYCH_BRIEFS },
      );
      fs.writeFileSync(path.join(out, `${id}.webp`), Buffer.from(b64, 'base64'));
      console.log(id, 'triptych', Math.round((b64.length * 3) / 4 / 1024) + ' KB');
      await page.evaluate(() => window.__cs.closeScene());
      await page.waitForTimeout(300);
      continue;
    }
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
