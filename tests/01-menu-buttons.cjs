const { assert, open, vis, state } = require('./helpers.cjs');
const T = [];
const t = (n, f) => T.push([n, f]);

t('menu shows title, how-to text, centered START, no forbidden options', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  assert.equal(await state(p), 'menu');
  const txt = await p.evaluate(() => document.getElementById('menu').innerText);
  assert.match(txt, /MONSTER/i); assert.match(txt, /KART/i);
  assert.match(txt, /Steer/); assert.match(txt, /Dodge/); assert.match(txt, /Coins/i);
  assert.doesNotMatch(txt, /difficulty|custom|prompt|mono kart|start race|road clear/i);
  assert.equal((await p.textContent('#btnStart')).trim(), 'START');
  assert.equal(await p.locator('#btnStart .dots, #btnStart i').count(), 0, 'no dots on START');
  /* START is centered horizontally, and vertically between the banner and the control row */
  const r = await p.evaluate(() => {
    const b = document.getElementById('btnStart').getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect();
    const above = document.getElementById('hero').getBoundingClientRect(), below = document.getElementById('mTouch').getBoundingClientRect();
    return { cx: b.left + b.width / 2 - (s.left + s.width / 2), gapTop: b.top - above.bottom, gapBot: below.top - b.bottom };
  });
  assert.ok(Math.abs(r.cx) < 2, 'horizontal offset ' + r.cx);
  assert.ok(Math.abs(r.gapTop - r.gapBot) < 40, `gaps ${r.gapTop} vs ${r.gapBot}`);
  assert.deepEqual(g.errors, []); await g.close();
});

t('every menu button is on screen and large enough to tap', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  for (const sel of ['#btnStart', '#mTouch', '#mArrows', '#menu .sndBtn']) {
    const b = await p.locator(sel).boundingBox();
    assert.ok(b && b.width >= 34 && b.height >= 34, `${sel} too small: ${JSON.stringify(b)}`);
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= 390 && b.y + b.height <= 844, `${sel} off screen`);
  }
  await g.close();
});

t('control mode toggle: touch / arrows, persists across reload', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  assert.equal(await p.getAttribute('#mTouch', 'aria-pressed'), 'true');
  await p.click('#mArrows');
  assert.equal(await p.getAttribute('#mArrows', 'aria-pressed'), 'true');
  assert.equal(await p.getAttribute('#mTouch', 'aria-pressed'), 'false');
  await p.reload(); await p.waitForFunction(() => window.__mono);
  assert.equal(await p.evaluate(() => window.__mono.S.mode), 'arrows');
  await p.evaluate(() => window.__mono.startRace());
  assert.ok(await vis(p, '#ctrls'), 'arrow buttons visible in arrows mode');
  await p.evaluate(() => window.__mono.goMenu()); await p.click('#mTouch');
  await p.evaluate(() => window.__mono.startRace());
  assert.ok(!(await vis(p, '#ctrls')), 'arrow buttons hidden in touch mode');
  await g.close();
});

t('START click: menu hides, countdown lights, 3-2-1-GO, then playing', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#btnStart', { force: true });   // the START button pulses forever, so skip Playwright's "is it still" wait
  assert.equal(await state(p), 'countdown');
  assert.ok(!(await vis(p, '#menu'))); assert.ok(await vis(p, '#cd')); assert.ok(await vis(p, '#hud'));
  await p.evaluate(() => window.__mono.setManual(true));
  const seen = [];
  for (let i = 0; i < 40; i++) {
    await p.evaluate(() => { for (let k = 0; k < 15; k++) window.__mono.update(1 / 60); });
    const s = await p.evaluate(() => [document.getElementById('cdNum').textContent, document.querySelectorAll('#cd .lights i.on').length, window.__mono.S.state]);
    if (!seen.length || seen[seen.length - 1][0] !== s[0]) seen.push(s);
  }
  assert.deepEqual(seen.map(s => s[0]), ['3', '2', '1', 'GO!']);
  assert.deepEqual(seen.map(s => s[1]), [1, 2, 3, 3]);
  assert.equal(seen[3][2], 'playing');
  await g.close();
});

t('pause / resume / menu buttons work, resume runs a 3-2-1', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  await p.click('#btnPause');
  assert.ok(await vis(p, '#pause')); assert.equal(await p.evaluate(() => window.__mono.S.paused), true);
  const d0 = await p.evaluate(() => window.__mono.S.dist);
  await p.evaluate(() => window.__t.run(1));      // frozen: loop is manual, but pauseGame also guards the rAF loop
  await p.click('#btnResume');
  assert.ok(!(await vis(p, '#pause')));
  assert.equal(await state(p), 'countdown'); assert.equal(await p.evaluate(() => window.__mono.S.cdMode), 'resume');
  assert.ok(await p.evaluate(() => document.getElementById('cdHint').hidden), 'no start hint on resume');
  await p.evaluate(() => window.__t.run(3.2, 1 / 60));
  assert.equal(await state(p), 'playing');
  await p.click('#btnPause'); await p.click('#btnPauseMenu');
  assert.equal(await state(p), 'menu'); assert.ok(await vis(p, '#menu'));
  assert.ok(d0 >= 0); await g.close();
});

t('game over screen: distance, START OVER and MENU buttons', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); const m = window.__mono; m.S.dist = 1234; m.explode(); window.__t.run(2); });
  assert.equal(await state(p), 'gameover'); assert.ok(await vis(p, '#over'));
  const txt = await p.innerText('#over');
  assert.match(txt, /You got/i); assert.match(txt, /1,234/); assert.match(txt, /meters/i);
  assert.equal((await p.textContent('#btnAgain')).trim(), 'START OVER');
  await p.click('#btnAgain'); assert.equal(await state(p), 'countdown'); assert.ok(!(await vis(p, '#over')));
  await p.evaluate(() => { window.__mono.explode(); window.__t.run(2); });
  await p.click('#btnMenu'); assert.equal(await state(p), 'menu'); assert.ok(await vis(p, '#menu'));
  assert.match(await p.innerText('#mBest'), /BEST\s+1,2\d\d M/);
  await g.close();
});

t('keyboard: arrows steer, Escape pauses/resumes, Enter starts', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.keyboard.press('Enter'); assert.equal(await state(p), 'countdown');
  await p.evaluate(() => window.__t.run(3.2, 1 / 60));
  await p.keyboard.press('Escape'); assert.equal(await p.evaluate(() => window.__mono.S.paused), true);
  await p.keyboard.press('Escape'); assert.equal(await p.evaluate(() => window.__mono.S.paused), false);
  await g.close();
});

t('HUD: only Score, Distance, coins, parts, pause, sound (no health / speed / clear text)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  const txt = (await p.innerText('#hud')).replace(/\s+/g, ' ');
  assert.match(txt, /score/i); assert.match(txt, /distance/i);
  assert.doesNotMatch(txt, /health|km\/h|speed|clear|road/i);
  assert.equal(await p.locator('#hud .slot').count(), 3);
  const a = await p.locator('.coinpill').boundingBox(), b = await p.locator('.tray').boundingBox();
  assert.ok(Math.abs(a.height - b.height) < 1.5, `pill heights ${a.height} vs ${b.height}`);
  assert.ok(Math.abs(a.y - b.y) < 1.5, 'pills aligned');
  await g.close();
});

module.exports = { tests: T };
