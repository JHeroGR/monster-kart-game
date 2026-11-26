#!/usr/bin/env node
/* Test runner:  node tests/run.cjs [--src] [--filter text] [--desktop]
   Builds dist/ and tests that (what you would deploy). --src tests the source folder instead. */
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const useSrc = args.includes('--src'), desktop = args.includes('--desktop');
const filter = args.includes('--filter') ? args[args.indexOf('--filter') + 1] : '';

(async () => {
  const { chromium } = require('playwright');
  const { startServer } = await import(path.join(root, 'scripts/serve.mjs'));
  let dir = root;
  if (!useSrc) { execFileSync('node', [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit' }); dir = path.join(root, 'dist'); }
  const srv = await startServer(dir, 0);
  const base = `http://127.0.0.1:${srv.port}`;
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const env = { browser, base, dir, root, useSrc, desktop };
  const suites = fs.readdirSync(__dirname).filter(f => /^\d\d-.*\.cjs$/.test(f)).sort();
  let pass = 0, fail = 0; const failures = [];
  console.log(`Testing ${useSrc ? 'source' : 'dist'} at ${base}${desktop ? ' (desktop)' : ''}\n`);
  for (const f of suites) {
    console.log(`# ${f}`);
    for (const [name, fn] of require(path.join(__dirname, f)).tests) {
      if (filter && !(f + name).toLowerCase().includes(filter.toLowerCase())) continue;
      const t0 = Date.now();
      try { await fn(env); pass++; console.log(`  ok    ${name} (${Date.now() - t0} ms)`); }
      catch (e) { fail++; failures.push(`${f} > ${name}\n${(e && e.stack || e).toString().split('\n').slice(0, 6).join('\n')}`); console.log(`  FAIL  ${name}\n        ${String(e.message).split('\n')[0]}`); }
    }
  }
  await browser.close(); await srv.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) console.log('\n' + failures.join('\n\n'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
