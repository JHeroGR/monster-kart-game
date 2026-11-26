/* Shared helpers: open the game in a phone-sized browser context with the debug hook, plus in-page utilities (window.__t). */
const assert = require('node:assert/strict');

const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function open(browser, base, opts = {}) {
  const ctx = await browser.newContext({ ...PHONE, ...(opts.context || {}) });
  await ctx.addInitScript(() => { window.__MK_DEBUG = true; });
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('request', r => requests.push(r.url()));
  /* the sandbox has no internet: answer Google Fonts with empty files so the game uses its fallback fonts */
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(base + (opts.path || '/'));
  if (opts.debug !== false) await page.waitForFunction(() => window.__mono, null, { timeout: 8000 });
  await page.evaluate(installHelpers);
  return { page, ctx, errors, requests, close: () => ctx.close() };
}

/* Runs inside the page. Steps the simulation by hand so every test is deterministic. */
function installHelpers() {
  const m = window.__mono; if (!m) return;
  const { S, K } = m;
  window.__t = {
    quiet() { S.objs.length = 0; S.spawnDist = -1e9; S.puT.boost = S.puT.magnet = S.puT.part = 1e9; },
    run(sec, dt = 1 / 120) { let n = Math.round(sec / dt); while (n-- > 0) m.update(dt); m.render(); m.updateHud(); },
    begin() {                          // click-free start: menu -> countdown -> playing, with no random spawns
      m.setManual(true); m.startRace(); this.run(3.2, 1 / 60); this.quiet();
    },
    /* y is an offset from the kart: negative = above it, on its way down */
    place(type, dx = 0, y = -60, extra = {}) {
      const o = m.spawnObj(type, 1, K.y + y); o.x = o.bx = K.x + dx; Object.assign(o, extra); return o;
    },
  };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; }, sel);
const state = page => page.evaluate(() => window.__mono.S.state);

const install = page => page.evaluate(installHelpers);
module.exports = { install, assert, open, sleep, vis, state, PHONE };
