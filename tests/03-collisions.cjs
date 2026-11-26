const { assert, open, state } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);
const S = p => p.evaluate(() => { const m = window.__mono; return { state: m.S.state, dmg: m.K.damaged, heal: m.K.heal, inv: m.K.inv, alive: m.K.alive, score: m.S.score, coins: m.S.coins, bonus: m.S.bonus, objs: m.S.objs.length }; });

for (const type of ['rock', 'pothole', 'car']) {
  t(`${type}: first hit damages (smoke) but does not end the run`, async ({ browser, base }) => {
    const g = await open(browser, base), p = g.page;
    await p.evaluate(t => { window.__t.begin(); window.__t.place(t, 0, -40); window.__t.run(.5); }, type);
    const s = await S(p); assert.equal(s.dmg, true); assert.equal(s.state, 'playing'); assert.equal(s.alive, true);
    assert.equal(await p.evaluate(() => window.__mono.S.parts.some(q => q.k === 'debris') || window.__mono.S.smoke.length > 0), true, 'debris or smoke');
    assert.deepEqual(g.errors, []); await g.close();
  });
  t(`${type}: hit while smoking explodes, score stops, game over appears`, async ({ browser, base }) => {
    const g = await open(browser, base), p = g.page;
    await p.evaluate(t => { window.__t.begin(); window.__mono.K.damaged = true; window.__mono.K.heal = 10; window.__t.place(t, 0, -40); window.__t.run(.3); }, type);
    assert.equal(await state(p), 'exploding');
    const sc = (await S(p)).score;
    await p.evaluate(() => window.__t.run(.8)); assert.equal((await S(p)).score, sc, 'scoreboard stopped');
    await p.evaluate(() => window.__t.run(1.5)); assert.equal(await state(p), 'gameover');
    assert.ok(await p.evaluate(() => !document.getElementById('over').hidden));
    await g.close();
  });
}

t('smoke clears by itself after HEAL_TIME with no further hit', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__t.place('rock', 0, -40); window.__t.run(.5); });
  assert.equal((await S(p)).dmg, true);
  await p.evaluate(() => window.__t.run(11)); assert.equal((await S(p)).dmg, true, 'still smoking before 12 s');
  await p.evaluate(() => window.__t.run(1.5)); assert.equal((await S(p)).dmg, false, 'smoke gone');
  await g.close();
});

t('heart while smoking fully heals; heart when healthy gives bonus points', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__t.place('rock', 0, -40); window.__t.run(.5); window.__t.place('heart', 0, -30); window.__t.run(.3); });
  let s = await S(p); assert.equal(s.dmg, false); assert.equal(s.bonus, 0);
  await p.evaluate(() => { window.__t.place('heart', 0, -30); window.__t.run(.3); });
  assert.equal((await S(p)).bonus, 100); await g.close();
});

t('a damaged kart that is healed survives the next hit as a "first" hit again', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__t.place('rock', 0, -40); window.__t.run(.5); window.__t.place('heart', 0, -30); window.__t.run(.5); window.__t.place('car', 0, -40); window.__t.run(.5); });
  const s = await S(p); assert.equal(s.state, 'playing'); assert.equal(s.dmg, true); await g.close();
});

t('two obstacles in the same instant count as one hit (invincibility frames)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); window.__t.place('rock', -6, -40); window.__t.place('car', 6, -40); window.__t.run(.4); });
  assert.equal((await S(p)).state, 'playing'); await g.close();
});

t('NO TUNNELING: objects hit the kart at any speed and any frame size', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const res = await p.evaluate(() => {
    const m = window.__mono, out = [];
    for (const v of [300, 900, 1800, 4000, 9000]) for (const dt of [1 / 240, 1 / 60, 1 / 30, .1, .25]) {
      m.setManual(true); m.startRace(); window.__t.run(3.2, 1 / 60); window.__t.quiet();
      m.S.v = v; m.S.t = 1e6;               // enormous speed: base speed saturates, so also override via sf
      const o = window.__t.place('rock', 0, -v * dt * 1.5); o.sf = v / m.S.base;
      const prev = o.y; o.y += v * dt * 3;  // object jumps clean over the kart in a single step
      out.push({ v, dt, hit: m.sweptHit(o, prev) });
    }
    return out;
  });
  const missed = res.filter(r => !r.hit); assert.deepEqual(missed, [], 'missed: ' + JSON.stringify(missed)); await g.close();
});

t('NO TUNNELING through the real loop at a 0.1 s frame (low-FPS phone)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const hit = await p.evaluate(() => {
    window.__t.begin(); const m = window.__mono; m.S.t = 400;        // top speed
    window.__t.place('rock', 0, -400);
    for (let i = 0; i < 20; i++) m.update(.1);
    return m.K.damaged || m.S.state !== 'playing';
  });
  assert.equal(hit, true); await g.close();
});

t('open lane is always passable: 300 waves at every difficulty', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => {
    const m = window.__mono; window.__t.begin(); let bad = 0;
    for (const d of [0, .2, .5, .8, 1]) for (let i = 0; i < 60; i++) {
      m.S.objs.length = 0; m.S.d = d; m.S.boost = 0; m.S.clear = 0; m.S.nextOpen = i % 4;
      const open = m.S.nextOpen; m.spawnWave(300);
      const lanes = new Set(m.S.objs.filter(o => ['rock', 'pothole', 'car'].includes(o.type)).map(o => Math.round((o.bx - 78) / 68)));
      if (lanes.size > 3 || lanes.has(open)) bad++;
    }
    return bad;
  });
  assert.equal(r, 0); await g.close();
});

t('coins: +10 each, magnet-free pickup, score = distance + coins*10 + bonus', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => { window.__t.begin(); for (let i = 0; i < 3; i++) window.__t.place('coin', 0, -20 - i * 5); window.__t.run(.4); });
  const r = await p.evaluate(() => ({ c: window.__mono.S.coins, s: window.__mono.S.score, d: Math.floor(window.__mono.S.dist), b: window.__mono.S.bonus }));
  assert.equal(r.c, 3); assert.equal(r.s, r.d + 30 + r.b);
  assert.equal(await p.evaluate(() => document.getElementById('hCoins').textContent), '3', 'HUD may lag a frame');
  assert.equal(await p.locator('#hud .popup, .pop-text').count(), 0, 'no floating coin text'); await g.close();
});

t('coin pickup creates no text popup', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const n = await p.evaluate(() => { window.__t.begin(); window.__t.place('coin', 0, -20); window.__t.run(.3); return window.__mono.S.pops.length; });
  assert.equal(n, 0); await g.close();
});

t('objects leave the world after passing the kart (no leak)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const n = await p.evaluate(() => { const m = window.__mono; window.__t.begin(); m.K.x = 60; for (let i = 0; i < 20; i++) { m.spawnObj('rock', 3, -100); } window.__t.run(4); return m.S.objs.length; });
  assert.equal(n, 0); await g.close();
});

module.exports = { tests: T };
