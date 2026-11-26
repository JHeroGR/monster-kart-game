#!/usr/bin/env node
/* Regenerates icons/*.png from the game's own kart drawing. Needs Playwright (npm i, then npx playwright install chromium).
   The generated PNGs are committed, so you only need this if you change the kart design. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'icons');
const JOBS = [
  ['icon-192.png', 192, ''],
  ['icon-512.png', 512, ''],
  ['icon-maskable-512.png', 512, '&maskable=1'],
  ['apple-touch-icon.png', 180, '&square=1'],
];

(async () => {
  const { startServer } = await import(require('url').pathToFileURL(path.join(root, 'scripts/serve.mjs')).href);
  const srv = await startServer(root, 0);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  fs.mkdirSync(out, { recursive: true });
  for (const [name, size, extra] of JOBS) {
    await page.goto(`http://127.0.0.1:${srv.port}/scripts/icon.html?size=${size}${extra}`);
    await page.waitForFunction(() => document.getElementById('c').width > 0);
    await page.waitForTimeout(100);
    const data = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
    fs.writeFileSync(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote icons/' + name, size + 'x' + size);
  }
  await browser.close(); await srv.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
})();
