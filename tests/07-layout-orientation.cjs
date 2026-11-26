const { assert, open, vis, PHONE } = require('./helpers.cjs');
const T = []; const t = (n, f) => T.push([n, f]);
const PHONES = { 'iPhone SE': [375, 667], 'iPhone 14': [390, 844], 'iPhone 15 Pro Max': [430, 932], 'Pixel 7': [412, 915], 'Galaxy S8 (tall)': [360, 740], 'small Android': [320, 568], 'iPad': [768, 1024] };

for (const [name, [w, h]] of Object.entries(PHONES)) {
  t(`${name} ${w}x${h}: menu, HUD and game over fit the screen, nothing clipped`, async ({ browser, base }) => {
    const g = await open(browser, base, { context: { viewport: { width: w, height: h } } }), p = g.page;
    const inside = async sel => { const b = await p.locator(sel).boundingBox(); assert.ok(b, sel + ' missing'); assert.ok(b.x >= -1 && b.y >= -1 && b.x + b.width <= w + 1 && b.y + b.height <= h + 1, `${sel} outside ${w}x${h}: ${JSON.stringify(b)}`); };
    for (const s of ['#btnStart', '#mTouch', '#mArrows', '#hero']) await inside(s);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), true, 'page does not scroll');
    await p.click('#mArrows'); await p.evaluate(() => window.__t.begin());
    for (const s of ['#btnPause', '#btnL', '#btnR', '.coinpill', '.tray', '#hScore']) await inside(s);
    const sb = await p.locator('#stage').boundingBox(); assert.ok(sb.width <= w + 1 && sb.height <= h + 1);
    await p.evaluate(() => { window.__mono.explode(); window.__t.run(2); });
    for (const s of ['#btnAgain', '#btnMenu']) await inside(s);
    assert.deepEqual(g.errors, []); await g.close();
  });
}

t('LANDSCAPE: rotate notice on menu, countdown, race, pause and game over; game pauses', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const land = () => p.setViewportSize({ width: 844, height: 390 }), port = () => p.setViewportSize({ width: 390, height: 844 });
  const notice = async () => { await p.waitForTimeout(150); return vis(p, '#rotate'); };
  assert.equal(await notice(), false);
  await land(); assert.equal(await notice(), true, 'menu'); assert.match(await p.innerText('#rotate'), /rotate|portrait/i);
  await port(); assert.equal(await notice(), false);
  await p.evaluate(() => window.__t.begin()); await land(); assert.equal(await notice(), true, 'race');
  assert.equal(await p.evaluate(() => window.__mono.S.paused), true, 'paused by rotation');
  await port(); assert.equal(await notice(), false);
  await p.evaluate(() => { window.__mono.explode(); window.__t.run(2); }); await land(); assert.equal(await notice(), true, 'game over'); await port();
  await p.evaluate(() => window.__mono.goMenu()); await p.evaluate(() => { window.__mono.startRace(); }); await land(); assert.equal(await notice(), true, 'countdown'); await g.close();
});

t('LANDSCAPE: input is ignored while the notice is up', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin()); await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(150);
  await p.keyboard.down('ArrowLeft'); assert.equal(await p.evaluate(() => window.__mono.input.left), false); await p.keyboard.up('ArrowLeft'); await g.close();
});

t('desktop browser (wide window, mouse): no rotate notice, game centered and playable', async ({ browser, base }) => {
  const g = await open(browser, base, { context: { viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 } }), p = g.page;
  assert.equal(await vis(p, '#rotate'), false);
  await p.click('#btnStart', { force: true }); await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); });
  const sb = await p.locator('#stage').boundingBox(); assert.ok(Math.abs(sb.x + sb.width / 2 - 640) < 3, 'centered'); assert.ok(sb.height <= 800);
  await p.mouse.move(sb.x + 100, sb.y + 500); await p.mouse.down(); await p.mouse.move(sb.x + 250, sb.y + 500, { steps: 5 }); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await p.evaluate(() => window.__t.run(.6)); assert.ok(await p.evaluate(() => window.__mono.K.x) > 220); await p.mouse.up(); await g.close();
});

t('resize / browser-bar change mid-race re-lays-out without breaking physics', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => window.__t.begin());
  for (const [w, h] of [[390, 760], [390, 844], [360, 640], [412, 915]]) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(80); const H = await p.evaluate(() => window.__mono.view.H); assert.ok(H >= 620 && H <= 800, 'stage height ' + H); }
  await p.evaluate(() => { window.__t.run(.5); window.__t.place('rock', 0, -30); window.__t.run(.5); }); assert.equal(await p.evaluate(() => window.__mono.K.damaged), true); assert.deepEqual(g.errors, []); await g.close();
});

t('safe-area insets and viewport meta are configured for notched phones', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page;
  const m = await p.evaluate(() => document.querySelector('meta[name=viewport]').content);
  assert.match(m, /viewport-fit=cover/); assert.match(m, /user-scalable=no|maximum-scale=1/);
  const css = await (await fetch(base + '/css/base.css')).text(); assert.match(css, /env\(safe-area-inset/); await g.close();
});

t('text: no overflow or clipping in menu, HUD and game-over at 320 px width', async ({ browser, base }) => {
  const g = await open(browser, base, { context: { viewport: { width: 320, height: 568 } } }), p = g.page;
  const over = sel => p.evaluate(s => [...document.querySelectorAll(s + ' *')].filter(e => !e.hidden && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' || (e.children.length === 0 && e.getBoundingClientRect().right > innerWidth + 1 && e.getBoundingClientRect().width > 0)).map(e => e.id || e.className || e.tagName), sel);
  assert.deepEqual(await over('#menu'), []);
  await p.evaluate(() => { window.__t.begin(); window.__mono.S.score = 9999999; window.__mono.S.dist = 99999; window.__t.run(.1); }); assert.deepEqual(await over('#hud'), []);
  await p.evaluate(() => { window.__mono.S.dist = 123456; window.__mono.explode(); window.__t.run(2); }); assert.deepEqual(await over('#over'), []); await g.close();
});

module.exports = { tests: T };
