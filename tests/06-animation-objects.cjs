const { assert, open, vis } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);

/* Count how many pixels differ between two canvas snapshots: proves something is really moving. */
const snap = p => p.evaluate(() => { const c = document.getElementById('game'); const x = c.getContext('2d'); return Array.from(x.getImageData(0, 0, c.width, c.height).data.filter((_, i) => i % 4 === 0 && (i / 4) % 7 === 0)); });
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 24) n++; return n / a.length; };

t('canvas is alive: road scrolls on the menu and in the race (frames differ)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const a = await snap(p); await p.waitForTimeout(250); const b = await snap(p);
  assert.ok(diff(a, b) > .01, 'menu scenery moves ' + diff(a, b));
  await p.evaluate(() => window.__t.begin()); const c = await snap(p); await p.evaluate(() => window.__t.run(.3)); const d = await snap(p);
  assert.ok(diff(c, d) > .02, 'road scrolls in race ' + diff(c, d)); await g.close();
});

t('canvas actually draws black-and-white content (not blank, only greys)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__t.place('rock', 0, -120); window.__t.place('car', 60, -200); window.__t.place('coin', -60, -160); window.__t.run(.05); });
  const r = await p.evaluate(() => { const c = document.getElementById('game'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let colored = 0, dark = 0, light = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 11) { n++; const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx - mn > 12) colored++; const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l < 50) dark++; if (l > 200) light++; } return { colored: colored / n, dark: dark / n, light: light / n }; });
  assert.ok(r.colored < .002, 'colour pixels ' + r.colored); assert.ok(r.dark > .2 && r.light > .005, JSON.stringify(r)); await g.close();
});

t('menu hero kart: wheels are straight (front wheels symmetric), canvas drawn', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const c = document.getElementById('hero'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height); const w = c.width, h = c.height; let L = 0, R = 0, any = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = d.data[(y * w + x) * 4 + 3]; if (v > 40) { any++; if (x < w / 2) L++; else R++; } } return { any, L, R }; });
  assert.ok(r.any > 1000, 'hero kart drawn'); assert.ok(Math.abs(r.L - r.R) / (r.L + r.R) < .06, 'kart is left-right symmetric ' + JSON.stringify(r)); await g.close();
});

t('countdown animation: lights light up one by one, number pops (CSS animation running)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#btnStart', { force: true });
  const names = await p.evaluate(() => new Promise(res => setTimeout(() => res(document.getElementById('cdNum').getAnimations().map(a => a.animationName || a.constructor.name)), 120)));
  assert.ok(names.length > 0, 'cdNum has a running animation'); await g.close();
});

t('START button pulses, and respects prefers-reduced-motion', async ({ browser, base }) => {
  let g = await open(browser, base); let n = await g.page.evaluate(() => document.getElementById('btnStart').getAnimations().length); assert.ok(n > 0, 'pulse running'); await g.close();
  g = await open(browser, base, { context: { reducedMotion: 'reduce' } });
  n = await g.page.evaluate(() => document.getElementById('btnStart').getAnimations().filter(a => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity).length);
  assert.equal(n, 0, 'infinite pulse stopped for reduced motion'); await g.close();
});

t('smoke particles appear when damaged and disappear when healed', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const m = window.__mono, S = m.S; window.__t.begin(); window.__t.place('rock', 0, -30); window.__t.run(1.5); const a = S.smoke.length;
    window.__t.place('heart', 0, -30); window.__t.run(3); return { a, b: S.smoke.length }; });
  assert.ok(r.a > 3, 'smoke ' + r.a); assert.equal(r.b, 0, 'smoke cleared after heal'); await g.close();
});

t('explosion spawns fire, debris and rings; effects fade out; no leftover particles', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const m = window.__mono, S = m.S; window.__t.begin(); m.explode(); const k = {}; S.parts.forEach(q => k[q.k] = (k[q.k] || 0) + 1); window.__t.run(1.4); const mid = S.parts.length; window.__t.run(8); return { k, mid, end: S.parts.length, smoke: S.smoke.length }; });
  assert.ok(r.k.fire > 20 && r.k.debris > 10 && r.k.ring >= 2, JSON.stringify(r.k)); assert.equal(r.end, 0, 'particles cleaned up'); await g.close();
});

t('boost visuals: kart animation plays ~0.9 s then ends; monster morph runs and reverts', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const m = window.__mono, K = m.K, S = m.S; window.__t.begin(); window.__t.place('boost', 0, -20); window.__t.run(.2); const a = K.bAnim; window.__t.run(1); const b = K.bAnim;
    m.startMonster(); const m0 = K.morph; window.__t.run(.8); const m1 = K.morph; const z = (window.__t.run(3), S.zoom); S.monster = .01; window.__t.run(4); return { a, b, m0, m1, z, hwEnd: K.hw, zoomEnd: S.zoom }; });
  assert.ok(r.a > .3); assert.equal(r.b, 0); assert.equal(r.m0, 0); assert.equal(r.m1, 1); assert.ok(r.z < .8); assert.equal(r.hwEnd, 14); assert.ok(r.zoomEnd > .98); await g.close();
});

t('screen shake / flash decay to 0 (no stuck effects)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const m = window.__mono, S = m.S; window.__t.begin(); window.__t.place('rock', 0, -30); window.__t.run(.2); const a = S.shake + S.flash; window.__t.run(5); return { a, shake: S.shake, flash: S.flash }; });
  assert.ok(r.a > 0); assert.equal(r.shake, 0); assert.equal(r.flash, 0); await g.close();
});

t('every object type draws without error (all 7 + monster + damaged kart)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); const ys = [-300, -250, -200, -150, -100, -60, -20]; ['rock', 'pothole', 'car', 'coin', 'heart', 'boost', 'magnet', 'part'].forEach((t, i) => window.__t.place(t, (i % 4 - 1.5) * 60, -400 + i * 30, { idx: 0 })); window.__mono.K.damaged = true; window.__t.run(.05); window.__mono.startMonster(); window.__t.run(.5); });
  assert.deepEqual(g.errors, []); await g.close();
});

t('performance: render+update frame cost stays inside the 60 fps budget (headless CPU)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const ms = await p.evaluate(() => { const m = window.__mono; window.__t.begin(); m.S.t = 250; m.S.puT.boost = m.S.puT.magnet = m.S.puT.part = 1; m.S.spawnDist = 0; m.K.hw = 14;
    const times = []; for (let i = 0; i < 300; i++) { m.S.spawnDist += 14; const t0 = performance.now(); m.update(1 / 60); m.render(); m.updateHud(); times.push(performance.now() - t0); m.K.alive = true; if (m.S.state !== 'playing') { m.startRace(); window.__t.run(3.2, 1 / 60); } }
    times.sort((a, b) => a - b); return { med: times[150], p95: times[285] }; });
  console.log(`        frame cost: median ${ms.med.toFixed(2)} ms, p95 ${ms.p95.toFixed(2)} ms (headless software rendering)`);
  assert.ok(ms.p95 < 16, 'p95 ' + ms.p95); await g.close();
});

t('speed curve: monotonic, slow ramp (start 250, still <900 at 5 min), difficulty ramps', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const f = window.__mono.speedAt; return [0, 30, 60, 120, 300, 600].map(t => Math.round(f(t))); });
  assert.equal(r[0], 250); for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1]); assert.ok(r[2] < 520 && r[4] < 880, JSON.stringify(r)); await g.close();
});

t('bot soak: a lane-changing bot plays 4 simulated minutes at 30 fps with no errors, no leaks', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const m = window.__mono, S = m.S, K = m.K; m.setManual(true); m.startRace(); window.__t.run(3.2, 1 / 60); let maxObjs = 0, maxParts = 0, maxSmoke = 0;
    for (let i = 0; i < 30 * 240 && S.state === 'playing'; i++) { // steer into the nearest open lane
      let best = K.x, bestScore = -1; for (let l = 0; l < 4; l++) { const x = m.cfg.laneX(l); let danger = 0; for (const o of S.objs) if (['rock', 'pothole', 'car'].includes(o.type) && Math.abs(o.x - x) < 40 && o.y < K.y + 40 && o.y > K.y - 260) danger += 300 - (K.y - o.y); const sc = -danger - Math.abs(x - K.x) * .1; if (sc > bestScore || bestScore === -1) { bestScore = sc; best = x; } }
      m.input.left = best < K.x - 4; m.input.right = best > K.x + 4; m.update(1 / 30); if (i % 30 === 0) m.render();
      maxObjs = Math.max(maxObjs, S.objs.length); maxParts = Math.max(maxParts, S.parts.length); maxSmoke = Math.max(maxSmoke, S.smoke.length); }
    return { state: S.state, t: S.t, score: S.score, maxObjs, maxParts, maxSmoke, topV: S.topV }; });
  console.log('        ' + JSON.stringify(r));
  assert.ok(r.t > 20, 'bot survived at least 20 s: ' + r.t); assert.ok(r.maxObjs < 80 && r.maxParts < 400 && r.maxSmoke < 300, 'no unbounded growth ' + JSON.stringify(r)); assert.deepEqual(g.errors, []); await g.close();
});

module.exports = { tests: T };
