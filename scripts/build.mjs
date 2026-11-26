#!/usr/bin/env node
/* Builds dist/: a plain static folder you can upload to any web host, or hand to Capacitor as `webDir`.
   There is no bundler on purpose: the game is native ES modules, about 100 KB uncompressed.
   The build copies the files, then stamps the service worker with a version and the exact list of files to cache for offline play. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const INCLUDE = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'src', 'icons', 'fonts'];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const files = [];
function copy(rel) {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) return;
  const st = fs.statSync(from);
  if (st.isDirectory()) { for (const n of fs.readdirSync(from).sort()) copy(path.join(rel, n)); return; }
  if (/\.(md|template)$/i.test(rel)) return;
  const to = path.join(dist, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  files.push(rel.split(path.sep).join('/'));
}
INCLUDE.forEach(copy);

const hash = crypto.createHash('sha1');
for (const f of files.filter(f => f !== 'sw.js')) { hash.update(f); hash.update(fs.readFileSync(path.join(dist, f))); }
const version = hash.digest('hex').slice(0, 10);

const precache = ['./', ...files.filter(f => f !== 'sw.js')];
const swPath = path.join(dist, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
if (!sw.includes("const VERSION = 'dev';") || !sw.includes('const PRECACHE = [];')) throw new Error('sw.js placeholders missing');
sw = sw.replace("const VERSION = 'dev';", `const VERSION = '${version}';`).replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(precache)};`);
fs.writeFileSync(swPath, sw);
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ name: 'monster-kart', version, files: files.length }, null, 2) + '\n');

const total = files.reduce((n, f) => n + fs.statSync(path.join(dist, f)).size, 0);
console.log(`built dist/  version ${version}  ${files.length} files  ${(total / 1024).toFixed(0)} KB`);
