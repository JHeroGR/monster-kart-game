const { assert, open, state, install } = require('./helpers.cjs');
const fs = require('node:fs'), path = require('node:path');
const T = []; const t = (n, f) => T.push([n, f]);
const json = async (base, p) => (await fetch(base + p)).json();

t('every file referenced by index.html, the manifest and the service worker exists and is served', async ({ base, dir }) => {
  const html = await (await fetch(base + '/')).text();
  const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m => m[1]).filter(u => !/^(https?:)?\/\//.test(u) && !u.startsWith('data:'));
  const man = await json(base, '/manifest.webmanifest'); for (const i of man.icons) refs.push(i.src); refs.push('sw.js');
  for (const r of new Set(refs)) { const res = await fetch(base + '/' + r.replace(/^\.?\//, '')); assert.equal(res.status, 200, r + ' -> ' + res.status); }
});

t('all ES module imports resolve (no 404s, no import errors)', async ({ browser, base }) => {
  const g = await open(browser, base), p = g.page; await p.waitForTimeout(300);
  const mine = g.requests.filter(u => u.startsWith(base)); assert.ok(mine.filter(u => u.endsWith('.js')).length >= 25, 'loaded ' + mine.filter(u => u.endsWith('.js')).length + ' modules');
  assert.deepEqual(g.errors, []); await g.close();
});

t('manifest is installable: name, portrait, standalone/fullscreen, 192 + 512 + maskable icons', async ({ base }) => {
  const m = await json(base, '/manifest.webmanifest'); assert.match(m.name, /monster kart/i); assert.equal(m.orientation, 'portrait'); assert.ok(['fullscreen', 'standalone'].includes(m.display)); assert.ok(m.start_url);
  const sizes = m.icons.map(i => i.sizes + (i.purpose || '')); assert.ok(sizes.some(s => s.startsWith('192x192')) && sizes.some(s => s.startsWith('512x512')) && sizes.some(s => /maskable/.test(s)), sizes.join());
  for (const i of m.icons) { const b = Buffer.from(await (await fetch(base + '/' + i.src.replace(/^\.?\//, ''))).arrayBuffer()); assert.equal(b.slice(1, 4).toString(), 'PNG'); assert.equal(b.readUInt32BE(16), parseInt(i.sizes), i.src + ' width'); }
});

t('service worker installs, controls the page and the game runs OFFLINE', async ({ browser, base, useSrc }) => {
  if (useSrc) return;                                          // the SW cache list is stamped by the build, so only dist is meaningful
  const g = await open(browser, base), p = g.page;
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
  await g.ctx.setOffline(true); await p.reload(); await p.waitForFunction(() => window.__mono, null, { timeout: 8000 });
  assert.equal(await state(p), 'menu'); await install(p); await p.click('#btnStart', { force: true }); await p.evaluate(() => { window.__mono.setManual(true); window.__t.run(3.2, 1 / 60); });
  assert.equal(await state(p), 'playing', 'playable offline'); assert.deepEqual(g.errors.filter(e => !/fonts\.g|Failed to load resource|net::ERR/.test(e)), []); await g.close();
});

t('only external requests are Google Fonts (no analytics, CDNs or trackers)', async ({ browser, base }) => {
  const g = await open(browser, base); await g.page.waitForTimeout(300);
  const ext = g.requests.filter(u => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')); const bad = ext.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u)); assert.deepEqual(bad, []); await g.close();
});

t('debug hook is OFF in a normal page load (nothing exposed to players)', async ({ browser, base }) => {
  const g = await open(browser, base, { debug: false }), p = g.page;
  await g.ctx.clearCookies(); const p2 = await (await browser.newContext({ ...require('./helpers.cjs').PHONE })).newPage(); await p2.route(/fonts\./, r => r.fulfill({ status: 200, body: '' }));
  await p2.goto(base + '/'); await p2.waitForTimeout(400); assert.equal(await p2.evaluate(() => typeof window.__mono), 'undefined'); assert.equal(await p2.locator('#btnStart').isVisible(), true);
  await p2.goto(base + '/?debug'); await p2.waitForTimeout(300); assert.equal(await p2.evaluate(() => typeof window.__mono), 'object', '?debug opt-in'); await g.close(); await p2.context().close();
});

t('size budget: dist < 400 KB, no source maps or stray test/dev files shipped', async ({ dir, useSrc }) => {
  if (useSrc) return; let total = 0; const names = [];
  (function walk(d) { for (const n of fs.readdirSync(d)) { const f = path.join(d, n), s = fs.statSync(f); if (s.isDirectory()) walk(f); else { total += s.size; names.push(path.relative(dir, f)); } } })(dir);
  assert.ok(total < 400 * 1024, `dist is ${(total / 1024) | 0} KB`); assert.deepEqual(names.filter(n => /\.map$|^tests|node_modules|\.cjs$|\.md$/.test(n)), []);
});

t('index.html has the store/PWA essentials: lang, title, theme-color, apple tags, icon links', async ({ base }) => {
  const h = await (await fetch(base + '/')).text();
  for (const re of [/<html[^>]*lang="/, /<title>[^<]*MONSTER KART/i, /name="theme-color"/, /apple-mobile-web-app-capable|mobile-web-app-capable/, /rel="apple-touch-icon"/, /rel="manifest"/]) assert.match(h, re);
});

t('Capacitor config points at dist/ and has a valid app id', async ({ root }) => {
  const c = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8')); assert.equal(c.webDir, 'dist'); assert.match(c.appId, /^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)+$/i); assert.ok(c.appName);
});

t('portrait lock is attempted where the platform supports it', async ({ browser, base }) => {
  const g = await open(browser, base, { init: () => { window.__lock = []; const o = { lock: a => { window.__lock.push(a); return Promise.resolve(); }, type: 'portrait-primary' }; try { Object.defineProperty(screen, 'orientation', { get: () => o, configurable: true }); } catch (e) {} } });
  assert.deepEqual(await g.page.evaluate(() => window.__lock), ['portrait']); await g.close();
});

module.exports = { tests: T };
