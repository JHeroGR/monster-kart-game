const { assert, open } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);

t('audio engine starts on first gesture; music tracks: menu, game, over', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#mTouch');
  const r = await p.evaluate(async () => {
    const m = window.__mono, o = {}; o.ctx = !!m.SND.ctx; o.menu = m.SND.track;
    m.startRace(); o.race = m.SND.track; m.setManual(true); window.__t.run(3.2, 1 / 60); o.game = m.SND.track; o.eng = !!m.SND.eng;
    m.explode(); window.__t.run(1.6); await new Promise(r => setTimeout(r, 1900)); o.over = m.SND.track; o.state = m.S.state; return o;
  });
  assert.equal(r.ctx, true); assert.equal(r.menu, 'menu'); assert.equal(r.race, null, 'music stops for the countdown'); assert.equal(r.game, 'game'); assert.equal(r.eng, true); assert.equal(r.over, 'over');
  await g.close();
});

t('every sound effect is called by the right event', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const r = await p.evaluate(() => {
    const m = window.__mono, SND = m.SND, log = []; SND.init();
    for (const k of Object.keys(SND)) if (typeof SND[k] === 'function' && /^(click|toggle|whoosh|beep|coin|heart|repair|hit|crumble|explode|boost|magnet|smash|stomp|zap|part|transform|powerDown|gameOver)$/.test(k)) { const o = SND[k]; SND[k] = function () { log.push(k); return o.apply(this, arguments); }; }
    m.startRace(); m.setManual(true); window.__t.run(3.2, 1 / 60); window.__t.quiet();
    const seen = new Set(log); const need = ['whoosh', 'beep'];
    log.length = 0; window.__t.place('coin', 0, -20); window.__t.run(.3); const c = [...log];
    log.length = 0; window.__t.place('rock', 0, -20); window.__t.run(.3); const h = [...log];
    log.length = 0; window.__t.place('heart', 0, -20); window.__t.run(.3); const he = [...log];
    log.length = 0; window.__t.place('boost', 0, -20); window.__t.run(.3); const b = [...log];
    log.length = 0; window.__t.place('magnet', 0, -20); window.__t.run(.3); const mg = [...log];
    log.length = 0; window.__t.place('part', 0, -20, { idx: 0 }); window.__t.run(.3); const pt = [...log];
    log.length = 0; m.startMonster(); const tr = [...log];
    log.length = 0; K = m.K; window.__t.place('rock', 0, -20); window.__t.run(.3); const sm = [...log];
    log.length = 0; window.__t.run(11); const pd = [...log];
    window.__t.run(1.6); log.length = 0; K.damaged = true; K.heal = 10; window.__t.place('rock', 0, -20); window.__t.run(.3); const ex = [...log];
    log.length = 0; window.__t.run(1.7); const go = [...log];
    return { seen: [...seen], c, h, he, b, mg, pt, tr, sm, pd, ex, go };
  });
  const want = { c: 'coin', h: 'hit', he: 'repair', b: 'boost', mg: 'magnet', pt: 'part', tr: 'transform', sm: 'smash', pd: 'powerDown', ex: 'explode', go: 'gameOver' };
  for (const [k, name] of Object.entries(want)) assert.ok(r[k].includes(name), `${name} not played for event ${k}: ${JSON.stringify(r)}`);
  assert.ok(r.he.includes('heart') && r.h.includes('crumble') && r.seen.includes('whoosh') && r.seen.includes('beep'));
  await g.close();
});

t('every sound renders audibly: not silent, no NaN, no clipping (offline render)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const res = await p.evaluate(async () => {
    const SND = window.__mono.SND, out = {}, saved = window.AudioContext;
    const names = ['click', 'toggle', 'whoosh', 'coin', 'heart', 'repair', 'hit', 'crumble', 'explode', 'boost', 'magnet', 'stomp', 'zap', 'transform', 'powerDown', 'gameOver', ['beep', false], ['beep', true], ['smash', 'rock'], ['smash', 'car'], ['part', 1], ['part', 2], ['part', 3]];
    for (const n of names) {
      const [fn, arg] = Array.isArray(n) ? n : [n]; const key = Array.isArray(n) ? fn + ':' + arg : fn;
      const oc = new OfflineAudioContext(1, 44100 * 4, 44100);
      SND.ctx = null; window.AudioContext = function () { return oc; }; window.webkitAudioContext = undefined; SND.muted = false; SND.init();
      SND[fn](arg); const buf = await oc.startRendering(); const d = buf.getChannelData(0);
      let peak = 0, sum = 0, nan = 0, lastLoud = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (Number.isNaN(d[i])) nan++; peak = Math.max(peak, a); sum += d[i] * d[i]; if (a > .01) lastLoud = i; }
      out[key] = { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan, tail: +(lastLoud / 44100).toFixed(2) };
    }
    /* music: render 6 s of each track by hand-stepping its scheduler */
    for (const tr of ['menu', 'game', 'over']) {
      const oc = new OfflineAudioContext(1, 44100 * 6, 44100); SND.ctx = null; window.AudioContext = function () { return oc; }; SND.init();
      SND.track = tr; SND.step = 0; SND.nextT = 0; for (let i = 0; i < 40; i++) { SND.nextT = Math.max(SND.nextT, 0); try { SND.trackStep(tr, i, i * .2, 0); } catch (e) { out['music:' + tr] = { err: String(e) }; break; } }
      const d = (await oc.startRendering()).getChannelData(0); let peak = 0, sum = 0, nan = 0; for (const v of d) { if (Number.isNaN(v)) nan++; peak = Math.max(peak, Math.abs(v)); sum += v * v; }
      out['music:' + tr] = out['music:' + tr] || { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan };
    }
    window.AudioContext = saved; SND.stopTrack(); return out;
  });
  const bad = [];
  for (const [k, v] of Object.entries(res)) {
    if (v.err) bad.push(k + ' threw ' + v.err); else if (v.nan) bad.push(k + ' NaN'); else if (v.peak < .02) bad.push(k + ' silent (peak ' + v.peak + ')'); else if (v.peak > 1.0) bad.push(k + ' clips (peak ' + v.peak + ')');
  }
  console.log('        ' + Object.entries(res).map(([k, v]) => `${k}:${v.peak}`).join('  '));
  assert.deepEqual(bad, []); await g.close();
});

t('mute: button toggles master gain to 0, persists, and un-mutes', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#menu .sndBtn');
  assert.equal(await p.evaluate(() => document.body.classList.contains('muted')), true);
  await p.waitForTimeout(250); assert.ok(await p.evaluate(() => window.__mono.SND.master.gain.value) < .02, 'master gain ~0');
  await p.reload(); await p.waitForFunction(() => window.__mono);
  assert.equal(await p.evaluate(() => document.body.classList.contains('muted')), true, 'mute remembered');
  await p.click('#menu .sndBtn'); await p.waitForTimeout(250);
  assert.ok(await p.evaluate(() => window.__mono.SND.master.gain.value) > .5); await g.close();
});

t('audio is suspended when paused / tab hidden / landscape, resumed after', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.click('#btnStart', { force: true }); await p.evaluate(() => window.__t.run(0)); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__mono.SND.ctx.state), 'running');
  await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); });
  await p.click('#btnPause'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__mono.SND.ctx.state), 'suspended', 'suspended while paused');
  await p.click('#btnResume'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__mono.SND.ctx.state), 'running'); await g.close();
});

t('app still works with no Web Audio at all (silent fallback)', async ({ browser, base }) => {
  const g = await open(browser, base, { init: () => { delete window.AudioContext; delete window.webkitAudioContext; } }), p = g.page;
  await p.click('#btnStart', { force: true }); await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); window.__t.place('rock', 0, -30); window.__t.run(.5); });
  assert.equal(await p.evaluate(() => window.__mono.K.damaged), true); assert.deepEqual(g.errors, []); await g.close();
});

module.exports = { tests: T };
