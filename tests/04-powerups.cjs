const { assert, open, state } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);
const R = (p, fn) => p.evaluate(fn);

t('SPEED UP: 6 s, 1.5x speed, fewer obstacles, kart animation, no HUD timer', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S; window.__t.begin(); S.t = 60;
    window.__t.run(.2); const v0 = S.v;
    window.__t.place('boost', 0, -30); window.__t.run(.3);
    const o = { boost: S.boost, anim: m.K.bAnim, hud: [...document.querySelectorAll('#hud .chip')].filter(c => !c.hidden).length };
    window.__t.run(2); o.ratio = S.v / S.base; o.vRise = S.v / v0;
    window.__t.run(4); o.left = S.boost;
    // waves during boost: at most one obstacle each
    S.boost = 5; let max = 0; for (let i = 0; i < 80; i++) { S.objs.length = 0; S.d = 1; m.spawnWave(300); max = Math.max(max, S.objs.filter(x => ['rock', 'pothole', 'car'].includes(x.type)).length); }
    o.maxObs = max; S.boost = 0; let max2 = 0; for (let i = 0; i < 80; i++) { S.objs.length = 0; S.d = 1; m.spawnWave(300); max2 = Math.max(max2, S.objs.filter(x => ['rock', 'pothole', 'car'].includes(x.type)).length); }
    o.maxNormal = max2; return o;
  });
  assert.ok(r.boost > 5 && r.boost <= 6, 'timer ' + r.boost); assert.ok(r.anim > 0, 'kart boost animation triggered');
  assert.equal(r.hud, 0, 'no timer chip for speed up');
  assert.ok(r.ratio > 1.45 && r.ratio < 1.52, 'speed ratio ' + r.ratio);
  assert.equal(r.left, 0, 'ends after 6 s'); assert.equal(r.maxObs, 1); assert.ok(r.maxNormal >= 2, 'normal waves have more');
  await g.close();
});

t('COIN MAGNET: 8 s, pulls coins in a 110 px radius, ignores far coins, HUD chip shows', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S, o = {}; window.__t.begin();
    window.__t.place('magnet', 0, -20); window.__t.run(.2); o.t = S.magnet; o.chip = !document.getElementById('chMagnet').hidden;
    const near = window.__t.place('coin', 80, -60), far = window.__t.place('coin', 160, -60);
    const nx = near.x; window.__t.run(.8);
    o.nearGot = near.dead, o.farMoved = Math.abs(far.x - (m.K.x + 160)) > 1, o.coins = S.coins;
    window.__t.run(8); o.end = S.magnet; window.__t.run(.1); o.chipEnd = !document.getElementById('chMagnet').hidden;
    const c2 = window.__t.place('coin', 80, -60); window.__t.run(.3); o.afterEndMoved = Math.abs(c2.x - c2.bx) > 1; return o;
  });
  assert.ok(r.t > 7.5 && r.t <= 8); assert.equal(r.chip, true); assert.equal(r.nearGot, true); assert.equal(r.farMoved, false);
  assert.equal(r.end, 0); assert.equal(r.chipEnd, false); assert.equal(r.afterEndMoved, false); await g.close();
});

t('PARTS: 3 parts fill the tray, then MONSTER KART (10 s, 2x speed, zoom out, invincible)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S, K = m.K, o = {}; window.__t.begin(); S.t = 60;
    for (let i = 0; i < 2; i++) { window.__t.place('part', 0, -20, { idx: i }); window.__t.run(.2); }
    window.__t.run(.1); o.slots = [...document.querySelectorAll('#hud .slot.on')].length; o.pre = S.monster;
    window.__t.place('part', 0, -20, { idx: 2 }); window.__t.run(.2);
    o.mon = S.monster; o.pieces = S.pieces.slice(); o.chip = !document.getElementById('chMonster').hidden;
    window.__t.run(3); o.ratio = S.v / S.base; o.zoom = S.zoom; o.hw = K.hw;
    window.__t.place('rock', 0, -20); window.__t.place('car', 0, -90); window.__t.place('pothole', 0, -160); window.__t.run(1.2);
    o.alive = K.alive && S.state === 'playing' && !K.damaged; o.bonus = S.bonus; window.__t.run(10); o.end = S.monster;
    return o;
  });
  assert.equal(r.slots, 2); assert.equal(r.pre, 0); assert.ok(r.mon > 9.5); assert.deepEqual(r.pieces, [false, false, false]); assert.equal(r.chip, true);
  assert.ok(r.ratio > 1.9 && r.ratio < 2.02, 'x2 speed ' + r.ratio); assert.ok(r.zoom < .8, 'zoomed out ' + r.zoom); assert.equal(r.hw, 30);
  assert.equal(r.alive, true, 'invincible'); assert.ok(r.bonus >= 20, 'smash bonus ' + r.bonus); assert.equal(r.end, 0); await g.close();
});

t('MONSTER smash: +10 per rock/car, popup text, sound per kind', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S, calls = []; window.__t.begin(); const orig = m.SND.smash; m.SND.smash = k => { calls.push(k); orig.call(m.SND, k); };
    const st = m.SND.stomp; m.SND.stomp = () => { calls.push('stomp'); st.call(m.SND); };
    m.startMonster(); window.__t.run(.2); S.pops.length = 0;
    window.__t.place('rock', 0, -20); window.__t.run(.2); window.__t.place('car', 0, -20); window.__t.run(.2); window.__t.place('pothole', 0, -20); window.__t.run(.2);
    return { calls, bonus: S.bonus, pops: S.pops.map(q => q.text) };
  });
  assert.deepEqual(r.calls, ['rock', 'car', 'stomp']); assert.equal(r.bonus, 20); assert.ok(r.pops.includes('SMASH +10')); await g.close();
});

t('AFTER MONSTER: 10 s of clear road, no text, then obstacles return; kart protected briefly', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S, K = m.K, o = {}; window.__t.begin(); S.puT.part = S.puT.boost = S.puT.magnet = 1e9; S.spawnDist = 0;
    for (let i = 0; i < 5; i++) m.spawnObj('rock', i % 4, -100 - i * 50);
    m.startMonster(); S.monster = .05; window.__t.run(.2);
    o.hw = K.hw; o.wiped = S.objs.filter(x => ['rock', 'pothole', 'car'].includes(x.type)).length; o.clear = S.clear;
    o.noText = !/road\s*clear|clear/i.test(document.body.innerText.replace(/smoke cleared/ig, '')) ;
    o.popTexts = S.pops.map(q => q.text);
    let seen = 0; for (let i = 0; i < 9.5 * 60; i++) { S.spawnDist += 6; m.update(1 / 60); seen += S.objs.filter(x => ['rock', 'pothole', 'car'].includes(x.type)).length; if (!K.alive) break; }
    o.obsDuringClear = seen; o.clearAt95 = S.clear;
    window.__t.run(1.5, 1 / 60); let later = 0; for (let i = 0; i < 600; i++) { S.spawnDist += 6; m.update(1 / 60); later += S.objs.filter(x => ['rock', 'pothole', 'car'].includes(x.type)).length; if (!K.alive) break; }
    o.later = later; return o;
  });
  assert.equal(r.hw, 14); assert.equal(r.wiped, 0); assert.ok(r.clear > 9.5); assert.equal(r.noText, true);
  assert.ok(!r.popTexts.some(x => /clear/i.test(x)), 'no ROAD CLEAR popup: ' + r.popTexts);
  assert.equal(r.obsDuringClear, 0, 'no obstacles during clear window'); assert.ok(r.later > 0, 'obstacles return afterwards'); await g.close();
});

t('Power-up spawn cadence: boost, magnet and parts all appear in a long run (bot)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S, K = m.K, seen = {}; m.setManual(true); m.startRace(); window.__t.run(3.2, 1 / 60);
    for (let i = 0; i < 60 * 240; i++) {
      for (const o of S.objs) seen[o.type] = (seen[o.type] || 0) + 0;      // count spawns by first sight
      S.objs.forEach(o => { if (!o.seen) { o.seen = 1; seen[o.type] = (seen[o.type] || 0) + 1; } });
      K.damaged = false; K.alive = true; if (S.state !== 'playing') m.startRace();           // bot is immortal: we only look at spawns
      if (S.state === 'countdown') window.__t.run(3.2, 1 / 60);
      m.update(1 / 60);
    }
    return seen;
  });
  for (const k of ['rock', 'pothole', 'car', 'coin', 'boost', 'magnet', 'part']) assert.ok(r[k] > 0, k + ' never spawned: ' + JSON.stringify(r));
  await g.close();
});

t('Coins are rarer than before (spawn rate sanity) and hearts only appear while damaged', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await R(p, () => {
    const m = window.__mono, S = m.S; window.__t.begin(); let hearts = 0, waves = 400, coinWaves = 0;
    for (let i = 0; i < waves; i++) { S.objs.length = 0; S.heartTimer = 0; m.K.damaged = false; m.spawnWave(300); if (S.objs.some(o => o.type === 'coin')) coinWaves++; if (S.objs.some(o => o.type === 'heart')) hearts++; }
    return { hearts, coinWaves, waves };
  });
  assert.equal(r.hearts, 0); assert.ok(r.coinWaves / r.waves < .5, 'coin wave ratio ' + r.coinWaves / r.waves); await g.close();
});

module.exports = { tests: T };
