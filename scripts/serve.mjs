#!/usr/bin/env node
/* Zero-dependency static file server.
   npm start            serves the source folder on http://localhost:8080
   npm run preview      serves the built dist/ folder
   Needed because browsers refuse ES modules and service workers from file:// URLs. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};

export function startServer(dir, port = 0) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(root, rel);
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
      fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return; }
        const headers = {
          'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'content-length': st.size,
          'cache-control': path.basename(file) === 'sw.js' ? 'no-cache' : 'no-cache',
        };
        res.writeHead(200, headers);
        if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
      });
    } catch { res.writeHead(400).end('Bad request'); }
  });
  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, close: () => new Promise(r => server.close(r)) }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const port = Number(process.env.PORT) || 8080;
  const { port: p } = await startServer(dir, port);
  console.log(`Monster Kart: serving ${path.resolve(dir)}\n  http://localhost:${p}/\nOpen it on your phone with your computer's LAN address, same port.`);
}
