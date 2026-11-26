const { assert, open, state } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);

t('works when localStorage throws (private mode / blocked storage)', async ({ browser, base }) => {
  const g = await open(browser, base, { init: () => { const bad = { get() { throw new Error('blocked'); }, set() { throw new Error('blocked'); } }; Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }); } }), p = g.page;
  await p.click('#btnStart', { force: true }); await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); window.__mono.explode(); window.__t.run(2); });
  assert.equal(await state(p), 'gameover'); assert.deepEqual(g.errors, []); await g.close();
});

t('best score persists across reloads and corrupt storage is ignored', async ({ browser, base }) => {
  let g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__mono.S.dist = 777; window.__mono.explode(); window.__t.run(2); });
  assert.ok(await p.evaluate(() => !document.getElementById('newBest').hidden), 'NEW BEST badge shown');
  await p.reload(); await p.waitForFunction(() => window.__mono); assert.match(await p.innerText('#mBest'), /777/);
  await p.evaluate(() => localStorage.setItem('mk-best', '{not json')); await p.reload(); await p.waitForFunction(() => window.__mono);
  assert.equal(await state(p), 'menu'); assert.deepEqual(g.errors, []); await g.close();
});

t('NEW BEST badge is visible text (not blank) and hides when you do not beat the record', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__mono.S.dist = 500; window.__mono.explode(); window.__t.run(2); });
  assert.match(await p.innerText('#newBest'), /NEW BEST/); await p.click('#btnAgain');
  await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); window.__mono.S.dist = 10; window.__mono.explode(); window.__t.run(2); });
  assert.ok(await p.evaluate(() => document.getElementById('newBest').hidden)); await g.close();
});

t('tab hidden / window blur: race pauses, held keys release', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin()); await p.keyboard.down('ArrowLeft');
  await p.evaluate(() => { window.dispatchEvent(new Event('blur')); });
  assert.equal(await p.evaluate(() => window.__mono.input.left), false);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await p.evaluate(() => window.__mono.S.paused), true); assert.ok(await p.locator('#pause').isVisible()); await g.close();
});

t('button mashing: START, pause, resume, menu, again 200x with no errors or stuck state', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { const m = window.__mono, $ = id => document.getElementById(id), btn = ['btnStart', 'btnPause', 'btnResume', 'btnPauseMenu', 'btnAgain', 'btnMenu', 'mTouch', 'mArrows']; m.setManual(true);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 200; i++) { const b = $(btn[(rnd() * btn.length) | 0]); if (b && b.offsetParent !== null) b.click(); window.__t.run(rnd() * 1.2, 1 / 30); if (m.S.state === 'playing' && rnd() < .3) { window.__t.place('rock', 0, -30); window.__t.run(.3, 1 / 30); } }
    document.getElementById('btnMenu').click(); });
  assert.deepEqual(g.errors, []);
  assert.ok(['menu', 'gameover', 'countdown', 'playing', 'exploding'].includes(await state(p)));
  await p.evaluate(() => { window.__mono.goMenu(); }); assert.ok(await p.locator('#btnStart').isVisible()); await g.close();
});

t('double-tapping START does not start two races or two music tracks', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { const b = document.getElementById('btnStart'); b.click(); b.click(); b.click(); });
  assert.equal(await state(p), 'countdown'); await p.evaluate(() => window.__mono.setManual(true));
  const timers = await p.evaluate(() => { window.__t.run(3.2, 1 / 60); return [window.__mono.SND.track, !!window.__mono.SND.timer]; }); assert.deepEqual(timers, ['game', true]); await g.close();
});

t('restart after game over resets the run completely (score, coins, power-ups, kart size)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => { const m = window.__mono, S = m.S, K = m.K; window.__t.begin(); m.startMonster(); S.coins = 9; S.boost = 4; S.magnet = 3; S.pieces = [true, true, false]; window.__t.run(1); m.explode(); window.__t.run(2); document.getElementById('btnAgain').click(); window.__t.run(3.2, 1 / 60);
    return { score: S.score, coins: S.coins, boost: S.boost, magnet: S.magnet, monster: S.monster, pieces: S.pieces, hw: K.hw, alive: K.alive, dmg: K.damaged, state: S.state, t: S.t, zoom: S.zoom }; });
  assert.deepEqual([r.coins, r.boost, r.magnet, r.monster, r.hw, r.alive, r.dmg, r.state], [0, 0, 0, 0, 14, true, false, 'playing']); assert.deepEqual(r.pieces, [false, false, false]); assert.ok(r.t < 1 && r.zoom > .95); await g.close();
});

t('no console errors or uncaught exceptions across a full session', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#mArrows'); await p.click('#btnStart', { force: true }); await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); window.__mono.startMonster(); window.__t.run(12, 1 / 30); window.__mono.explode(); window.__t.run(3); });
  await p.click('#btnMenu'); assert.deepEqual(g.errors, []); await g.close();
});

module.exports = { tests: T };
