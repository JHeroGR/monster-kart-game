const { assert, open, state } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);

/* Real touch events through the Chrome DevTools Protocol, not synthetic mouse events. */
async function touch(g, type, x, y, id = 1) {
  const c = g.cdp || (g.cdp = await g.ctx.newCDPSession(g.page));
  await c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id }] });
  await frames(g.page);       // Chrome delivers pointermove once per frame, so let it land
}
const frames = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const K = p => p.evaluate(() => ({ x: window.__mono.K.x, vx: window.__mono.K.vx, drag: window.__mono.drag.active }));
const stageBox = p => p.locator('#stage').boundingBox();

t('touch drag steers the kart right, then left, and stops on release', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  const sb = await stageBox(p), y = sb.y + sb.height * .6, k0 = (await K(p)).x;
  await touch(g, 'touchStart', sb.x + sb.width / 2, y);
  assert.equal((await K(p)).drag, true);
  for (let i = 1; i <= 8; i++) await touch(g, 'touchMove', sb.x + sb.width / 2 + i * 12, y);
  await p.evaluate(() => window.__t.run(.8));
  const k1 = (await K(p)).x; assert.ok(k1 > k0 + 40, `moved right ${k0} -> ${k1}`);
  for (let i = 1; i <= 16; i++) await touch(g, 'touchMove', sb.x + sb.width / 2 + 96 - i * 12, y);
  await p.evaluate(() => window.__t.run(.8));
  const k2 = (await K(p)).x; assert.ok(k2 < k1 - 60, `moved left ${k1} -> ${k2}`);
  await touch(g, 'touchEnd'); assert.equal((await K(p)).drag, false);
  await p.evaluate(() => window.__t.run(.5)); const k3 = (await K(p)).x;
  await p.evaluate(() => window.__t.run(.5)); assert.ok(Math.abs((await K(p)).x - k3) < 1, 'kart holds position after release');
  await g.close();
});

t('kart is clamped to the road edges', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  const sb = await stageBox(p), y = sb.y + 400;
  await touch(g, 'touchStart', sb.x + 180, y); await touch(g, 'touchMove', sb.x + 600 > 389 ? 389 : sb.x + 600, y);
  await p.evaluate(() => window.__t.run(1.5)); let k = (await K(p)).x;
  assert.ok(k <= 316 - 14 && k > 250, 'right clamp ' + k);
  await touch(g, 'touchMove', 1, y); await p.evaluate(() => window.__t.run(2)); k = (await K(p)).x;
  assert.ok(k >= 44 + 14 && k < 110, 'left clamp ' + k); await touch(g, 'touchEnd'); await g.close();
});

t('touch on the START countdown can steer; drag does nothing on the menu or game over', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page, sb = await stageBox(p);
  await touch(g, 'touchStart', sb.x + 100, sb.y + 300); await touch(g, 'touchEnd');
  assert.equal((await K(p)).drag, false, 'no drag on menu');
  await p.evaluate(() => { window.__mono.startRace(); window.__mono.setManual(true); });
  await touch(g, 'touchStart', sb.x + 100, sb.y + 500);
  assert.equal((await K(p)).drag, true, 'steering allowed during the opening countdown');
  await touch(g, 'touchEnd');
  await p.evaluate(() => { window.__t.run(3.2, 1 / 60); window.__mono.explode(); window.__t.run(2); });
  await touch(g, 'touchStart', sb.x + 100, sb.y + 500); await touch(g, 'touchEnd');
  assert.equal((await K(p)).drag, false, 'no drag on game over'); await g.close();
});

t('PAUSED: touch, drag, arrows and keys cannot move the kart', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  await p.click('#btnPause');
  const sb = await stageBox(p), x0 = (await K(p)).x;
  await touch(g, 'touchStart', sb.x + 100, sb.y + 500);
  for (let i = 0; i < 6; i++) await touch(g, 'touchMove', sb.x + 100 + i * 25, sb.y + 500);
  await touch(g, 'touchEnd');
  await p.keyboard.down('ArrowLeft'); await p.keyboard.down('KeyD');
  const s = await p.evaluate(() => ({ ...window.__mono.input, drag: window.__mono.drag.active }));
  assert.deepEqual(s, { left: false, right: false, drag: false });
  await p.evaluate(() => { window.__mono.setManual(true); for (let i = 0; i < 120; i++) window.__mono.update(1 / 60); });
  /* update() is guarded by the frame loop when paused, so also check the real loop */
  await p.evaluate(() => window.__mono.setManual(false)); await p.waitForTimeout(400);
  assert.ok(Math.abs((await K(p)).x - x0) < 1, 'kart did not move while paused');
  await p.keyboard.up('ArrowLeft'); await p.keyboard.up('KeyD'); await g.close();
});

t('RESUME COUNTDOWN: input is locked until GO', async ({ browser, base }) => {
  const g = await open(browser, base, { context: {} }), p = g.page;
  await p.evaluate(() => window.__t.begin());
  await p.click('#btnPause'); await p.click('#btnResume');
  assert.equal(await p.evaluate(() => window.__mono.S.cdFrozen), true);
  const sb = await stageBox(p), x0 = (await K(p)).x;
  await touch(g, 'touchStart', sb.x + 300, sb.y + 500); await touch(g, 'touchMove', sb.x + 340, sb.y + 500);
  assert.equal((await K(p)).drag, false);
  await touch(g, 'touchEnd');
  await p.keyboard.down('ArrowRight');
  assert.equal(await p.evaluate(() => window.__mono.input.right), false);
  await p.keyboard.up('ArrowRight');
  await p.evaluate(() => window.__t.run(2, 1 / 60)); assert.ok(Math.abs((await K(p)).x - x0) < 1);
  await p.evaluate(() => window.__t.run(1.5, 1 / 60)); assert.equal(await state(p), 'playing');
  await touch(g, 'touchStart', sb.x + 300, sb.y + 500); assert.equal((await K(p)).drag, true, 'unlocked after GO');
  await touch(g, 'touchEnd'); await g.close();
});

t('arrow buttons (arrows mode): hold to steer, release to stop, locked when paused', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#mArrows');
  await p.evaluate(() => window.__t.begin());
  const x0 = (await K(p)).x, r = await p.locator('#btnR').boundingBox();
  await touch(g, 'touchStart', r.x + r.width / 2, r.y + r.height / 2);
  assert.equal(await p.evaluate(() => window.__mono.input.right), true);
  assert.ok(await p.evaluate(() => document.getElementById('btnR').classList.contains('on')));
  await p.evaluate(() => window.__t.run(.6)); const x1 = (await K(p)).x; assert.ok(x1 > x0 + 50, `${x0}->${x1}`);
  await touch(g, 'touchEnd');
  assert.equal(await p.evaluate(() => window.__mono.input.right), false);
  const l = await p.locator('#btnL').boundingBox();
  await touch(g, 'touchStart', l.x + l.width / 2, l.y + l.height / 2);
  await p.evaluate(() => window.__t.run(.6)); assert.ok((await K(p)).x < x1 - 50);
  await touch(g, 'touchEnd');
  await p.click('#btnPause');
  assert.ok(await p.evaluate(() => document.getElementById('ctrls').classList.contains('locked')), 'arrows look locked when paused');
  await touch(g, 'touchStart', l.x + 10, l.y + 10);
  assert.equal(await p.evaluate(() => window.__mono.input.left), false); await touch(g, 'touchEnd');
  await g.close();
});

t('multi-touch: second finger does not hijack the drag', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  const sb = await stageBox(p), c = await g.ctx.newCDPSession(p);
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sb.x + 180, y: sb.y + 500, id: 1 }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sb.x + 180, y: sb.y + 500, id: 1 }, { x: sb.x + 40, y: sb.y + 500, id: 2 }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sb.x + 230, y: sb.y + 500, id: 1 }, { x: sb.x + 40, y: sb.y + 500, id: 2 }] });
  await frames(p);
  await p.evaluate(() => window.__t.run(.6));
  const kk = await K(p); assert.ok(kk.x > 190, 'follows first finger: ' + JSON.stringify(kk) + ' ' + JSON.stringify(await p.evaluate(() => ({ ...window.__mono.drag })))); assert.equal(g.errors.length, 0);
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await g.close();
});

module.exports = { tests: T };
